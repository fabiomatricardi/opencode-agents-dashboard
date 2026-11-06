/**
 * Collector: wires OpenCode's public event stream and tool lifecycle hooks
 * into the DashboardStore. Everything is defensive — event payload shapes
 * are normalized through `pick` so version differences degrade gracefully.
 */
import { DashboardStore } from "./store.ts"
import { pick, truncate } from "./types.ts"

const DEBUG = String(process.env.AGENTS_DASHBOARD_DEBUG ?? "").toLowerCase() === "true"

function dbg(...args: unknown[]) {
  if (DEBUG) console.log("[agents-dashboard]", ...args)
}

function eventProps(ev: unknown): Record<string, unknown> {
  return (pick<Record<string, unknown>>(ev, "properties", "payload", "data") ?? (ev as Record<string, unknown>)) ?? {}
}

export interface Collector {
  dispose(): void
}

export async function attachCollector(ctx: any, store: DashboardStore): Promise<Collector> {
  const controller = new AbortController()
  const registrations: Array<{ dispose?: () => unknown } | undefined> = []

  // ---- public event stream ----
  // Self-healing: if the generator ends or throws (plugin reloads, transport
  // hiccups, version drift), resubscribe after a short backoff instead of
  // silently going deaf. Every event is counted in the store so liveness is
  // observable via /api/state.
  void (async () => {
    let events = 0
    while (!controller.signal.aborted) {
      let resubscribe = false
      try {
        for await (const ev of ctx.event.subscribe({ signal: controller.signal })) {
          try {
            events++
            handleEvent(store, ev)
          } catch (err) {
            dbg("event handler error:", err)
          }
        }
        // generator completed normally — an exhausted subscription is silent
        // death unless we resubscribe
        resubscribe = !controller.signal.aborted
        if (resubscribe) store.pumpErrors++
      } catch (err) {
        if (!controller.signal.aborted) {
          store.pumpErrors++
          dbg("event stream error:", err)
          resubscribe = true
        }
      }
      if (!resubscribe) break
      await new Promise((r) => setTimeout(r, 1_000))
    }
    dbg("event pump stopped after", events, "events")
  })()

  // ---- tool lifecycle hooks (guaranteed source of truth) ----
  try {
    registrations.push(
      await ctx.tool.hook("execute.before", (event: unknown) => {
        const e = event as Record<string, unknown>
        store.applyToolStart({
          sessionID: String(pick(e, "sessionID") ?? ""),
          tool: String(pick(e, "tool") ?? pick(e, "name") ?? "tool"),
          id: pick<string>(e, "id", "callID"),
          messageID: pick<string>(e, "messageID"),
          agent: pick<string>(e, "agent"),
          input: pick(e, "input", "args"),
        })
      }),
    )
    registrations.push(
      await ctx.tool.hook("execute.after", (event: unknown) => {
        const e = event as Record<string, unknown>
        store.applyToolEnd({
          sessionID: String(pick(e, "sessionID") ?? ""),
          id: pick<string>(e, "id", "callID"),
          tool: pick<string>(e, "tool", "name"),
          status: pick<string>(e, "status") ?? (pick(e, "error") ? "error" : "completed"),
          error: pick(e, "error"),
        })
      }),
    )
  } catch (err) {
    dbg("tool hooks unavailable:", err)
  }

  // ---- best-effort backfill of sessions that existed before we loaded ----
  void backfill(ctx, store)

  return {
    dispose() {
      controller.abort()
      for (const reg of registrations) {
        try {
          reg?.dispose?.()
        } catch {
          /* ignore */
        }
      }
    },
  }
}

async function backfill(ctx: any, store: DashboardStore) {
  const record = (count: number, error?: string) => {
    store.backfill = { at: Date.now(), count, error }
  }
  try {
    const list = (ctx.session as any)?.list
    if (typeof list !== "function") {
      record(0, "ctx.session.list is not a function")
      return
    }
    const out = await list.call(ctx.session)
    const sessions = Array.isArray(out) ? out : (out?.data ?? out?.sessions ?? [])
    let applied = 0
    for (const info of sessions) {
      try {
        store.applySessionInfo(info, { backfill: true })
        applied++
      } catch (err) {
        dbg("backfill: skipping malformed session:", err)
      }
    }
    store.broadcast({ type: "totals", totals: store.totals() })
    record(applied, applied === 0 ? "list returned no sessions" : undefined)
    dbg("backfilled", applied, "sessions")
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    record(0, message)
    dbg("backfill skipped:", err)
  }
}

/** Handle one bus event against the store. Exported for tests/harness replay. */
export function handleEvent(store: DashboardStore, ev: unknown) {
  const type = String(pick(ev, "type") ?? "")
  const props = eventProps(ev)
  if (!type) return
  store.markEvent(type)
  dbg("event:", type)

  switch (type) {
    case "session.created":
    case "session.updated": {
      store.applySessionInfo(props.info ?? props)
      break
    }
    case "session.status": {
      const sessionID = pick<string>(props, "sessionID")
      const status = pick<Record<string, unknown>>(props, "status")
      const kind = pick<string>(status, "type") ?? pick<string>(props, "type")
      if (!sessionID) break
      if (kind === "busy" || kind === "active" || kind === "running") {
        store.ensure(sessionID).status = "active"
        store.publishSession(sessionID)
      } else if (kind === "idle") {
        store.applyIdle({ sessionID })
      } else if (kind === "retry" || kind === "error") {
        store.applySessionError({ sessionID, error: pick(status, "error") ?? props })
      } else {
        store.touch(sessionID)
        store.publishSession(sessionID)
      }
      break
    }
    case "session.idle": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) store.applyIdle({ sessionID, outcome: pick<string>(props, "outcome"), error: pick(props, "error") })
      break
    }
    case "session.error": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) store.applySessionError({ sessionID, error: pick(props, "error") ?? props })
      break
    }
    case "session.deleted":
    case "session.removed": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) store.removeSession(String(sessionID))
      break
    }
    case "message.updated": {
      const msg = props.info ?? props.message ?? props
      store.applyMessage(msg)
      break
    }
    case "message.part.updated":
    case "message.part.changed": {
      const sessionID = pick<string>(props, "sessionID")
      const part = pick(props, "part") ?? props
      if (sessionID) store.applyMessagePart({ sessionID, part })
      break
    }
    case "message.removed":
    case "message.part.removed": {
      // low value for the dashboard; ignore
      break
    }
    /* ---------- V2.2+ event family (session.* granular events) ---------- */
    case "session.usage.updated": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "sessionID")
      if (sessionID) {
        const usage = pick(props, "usage", "tokens") ?? props
        store.applyUsage(String(sessionID), usage)
      }
      break
    }
    case "session.execution.started":
    case "session.step.started": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) {
        const s = store.ensure(String(sessionID))
        s.status = "active"
        s.idleLatch = undefined
        if (s.stateText.startsWith("Error") || s.stateText === "Idle") s.stateText = "Working…"
        store.publishSession(String(sessionID))
      }
      break
    }
    case "session.execution.succeeded": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) store.applyIdle({ sessionID: String(sessionID), outcome: "succeeded" })
      break
    }
    case "session.execution.failed": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) store.applyIdle({ sessionID: String(sessionID), outcome: "failed", error: pick(props, "error") })
      break
    }
    case "session.execution.interrupted":
    case "session.step.failed": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "id")
      if (sessionID) store.touch(String(sessionID))
      break
    }
    case "session.retry.scheduled": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        const s = store.ensure(String(sessionID))
        s.status = "active"
        s.stateText = "Retrying…"
        store.publishSession(String(sessionID))
      }
      break
    }
    case "session.reasoning.started":
    case "session.reasoning.delta":
    case "session.text.started":
    case "session.text.delta": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        const s = store.ensure(String(sessionID))
        const isReasoning = type.startsWith("session.reasoning")
        const delta = pick<string>(props, "delta", "text") ?? pick(props, "part", "text")
        if (isReasoning) {
          s.status = "active"
          if (delta) s.reasoningPreview = truncate(delta, 240)
          if (!s.currentTool) s.stateText = "Thinking…"
        } else if (!s.currentTool) {
          s.status = "active"
          s.stateText = "Writing…"
        }
        store.publishSession(String(sessionID))
      }
      break
    }
    case "session.text.ended": {
      // Final assistant text for a step — the most useful single line to show.
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        const text = pick<string>(props, "text") ?? pick(props, "part", "text") ?? ""
        if (text.trim()) {
          store.applyMessagePart({
            sessionID: String(sessionID),
            part: { type: "text", text, id: `steptext:${Date.now()}` },
          })
        }
      }
      break
    }
    case "session.tool.called":
    case "session.shell.started": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        store.applyToolStart({
          sessionID: String(sessionID),
          tool: String(pick(props, "tool") ?? pick(props, "name") ?? (type === "session.shell.started" ? "shell" : "tool")),
          id: pick<string>(props, "callID", "id"),
          messageID: pick<string>(props, "messageID"),
          agent: pick<string>(props, "agent"),
          input: pick(props, "input", "args"),
        })
      }
      break
    }
    case "session.tool.success":
    case "session.tool.failed":
    case "session.shell.ended": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        store.applyToolEnd({
          sessionID: String(sessionID),
          id: pick<string>(props, "callID", "id"),
          tool: pick<string>(props, "tool", "name"),
          status: type === "session.tool.failed" ? "error" : "completed",
          error: pick(props, "error"),
        })
      }
      break
    }
    case "session.tool.progress":
    case "session.tool.input.started":
    case "session.tool.input.delta":
    case "session.tool.input.ended":
    case "session.compaction.delta":
    case "session.reasoning.ended":
    case "session.step.streamed":
    case "session.step.ended": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) store.touch(String(sessionID))
      break
    }
    case "session.compaction.started":
    case "session.compaction.ended":
    case "session.compaction.failed": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "sessionID")
      if (sessionID) {
        const status = type.endsWith("started") ? "running" : type.endsWith("failed") ? "failed" : "completed"
        store.applyCompaction(String(sessionID), {
          status,
          reason: pick<string>(props, "reason"),
          summary: pick<string>(props, "summary"),
        })
      }
      break
    }
    case "session.renamed":
    case "session.model.selected":
    case "session.agent.selected":
    case "session.forked": {
      const info = pick(props, "info") ?? props
      if (pick<string>(info, "id", "sessionID")) store.applySessionInfo(info)
      break
    }
    case "session.skill.activated": {
      const sessionID = pick<string>(props, "sessionID") ?? pick(props, "info", "sessionID")
      const skill = pick<string>(props, "skill", "name", "id")
      if (sessionID) {
        const s = store.ensure(String(sessionID))
        if (skill) s.stateText = `Skill ${skill}…`
        store.publishSession(String(sessionID))
      }
      break
    }
    case "permission.asked":
    case "permission.updated": {
      const sessionID = pick<string>(props, "sessionID")
      const perm = (pick(props, "permission") ?? props) as Record<string, unknown>
      if (sessionID) {
        store.applyPermission({
          sessionID,
          id: pick<string>(perm, "id", "requestID"),
          action: pick<string>(perm, "action", "type", "permission"),
          title: pick<string>(perm, "title", "pattern", "resource"),
        })
      }
      break
    }
    case "permission.replied": {
      const sessionID = pick<string>(props, "sessionID")
      if (sessionID) {
        store.applyPermission({
          sessionID,
          id: pick<string>(props, "requestID", "id") ?? `perm:${pick(props, "sessionID")}`,
          replied: true,
        })
      }
      break
    }
    case "tool.execute.before": {
      // Some builds also emit tool events on the bus; hooks already cover this,
      // but accept them in case hooks are unavailable.
      store.applyToolStart({
        sessionID: String(pick(props, "sessionID") ?? ""),
        tool: String(pick(props, "tool") ?? "tool"),
        id: pick<string>(props, "id", "callID"),
        messageID: pick<string>(props, "messageID"),
        agent: pick<string>(props, "agent"),
        input: pick(props, "input", "args"),
      })
      break
    }
    case "tool.execute.after": {
      store.applyToolEnd({
        sessionID: String(pick(props, "sessionID") ?? ""),
        id: pick<string>(props, "id", "callID"),
        tool: pick<string>(props, "tool", "name"),
        status: pick<string>(props, "status") ?? (pick(props, "error") ? "error" : "completed"),
        error: pick(props, "error"),
      })
      break
    }
    default:
      dbg("ignored event:", type)
  }
}
