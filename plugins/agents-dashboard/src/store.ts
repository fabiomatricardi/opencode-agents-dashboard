/**
 * In-memory state of the dashboard: sessions, their activity buffers,
 * derived agent states, totals, and the SSE broadcast channel.
 */
import {
  MAX_ITEMS,
  deriveToolMeta,
  pick,
  truncate,
  type ActivityItem,
  type ErrorItem,
  type SessionStatus,
  type SessionView,
  type Snapshot,
  type StateItem,
  type TextItem,
  type Totals,
  type ToolItem,
} from "./types.ts"

export interface Broadcast {
  type: "session" | "totals" | "remove"
  session?: SessionView
  totals?: Totals
  id?: string
}

export class DashboardStore {
  readonly sessions = new Map<string, SessionView>()
  /** session ids, most recently active first */
  order: string[] = []
  readonly startedAt = Date.now()
  /** session ids whose history was hydrated from the server API. */
  readonly hydrated = new Set<string>()
  subscribers = new Set<(b: Broadcast) => void>()
  /** Per-type event counters — observability for the collector, exposed via /api/state. */
  readonly eventCounts = new Map<string, number>()
  lastEventAt = 0
  lastEventType = ""
  pumpErrors = 0
  /** Last backfill outcome (count / error) — exposed via snapshot stats. */
  backfill: { at: number; count: number; error?: string } = { at: 0, count: 0 }
  private sweepTimer: ReturnType<typeof setInterval> | undefined

  constructor() {
    // Watchdog: converge active sessions to Idle when nothing happens.
    // Guards against missed/renamed idle events and stale re-activations.
    const idleMs = Number(process.env.AGENTS_DASHBOARD_IDLE_MS) || 90_000
    this.sweepTimer = setInterval(() => this.sweep(), Math.max(2_000, Math.floor(idleMs / 3)))
    // don't hold the event loop open just for the sweep
    ;(this.sweepTimer as unknown as { unref?: () => void }).unref?.()
  }

  dispose() {
    if (this.sweepTimer) clearInterval(this.sweepTimer)
    this.sweepTimer = undefined
  }

  /** Called by the collector for EVERY bus event, handled or not. */
  markEvent(type: string) {
    this.eventCounts.set(type, (this.eventCounts.get(type) ?? 0) + 1)
    this.lastEventAt = Date.now()
    this.lastEventType = type
  }

  /** Auto-idle active sessions that went silent (no tool running, nothing pending). */
  private sweep() {
    const now = Date.now()
    const idleMs = Number(process.env.AGENTS_DASHBOARD_IDLE_MS) || 90_000
    for (const s of this.sessions.values()) {
      if (s.status !== "active") continue
      if (s.currentTool || s.compacting || s.permissions.length > 0) continue
      if (now - s.lastActiveAt > idleMs) {
        this.applyIdle({ sessionID: s.id, outcome: "succeeded" }, { silent: true })
      }
    }
  }

  /** Remove every session (used by restart). */
  clear() {
    this.sessions.clear()
    this.order = []
    this.hydrated.clear()
    this.broadcast({ type: "cleared" })
    this.broadcast({ type: "totals", totals: this.totals() })
  }

  /** Serialized view (with children) for one session, or undefined. */
  sessionView(id: string) {
    const s = this.sessions.get(id)
    return s ? snapshotSession(s, this.sessions, this.hydrated) : undefined
  }

  markHydrated(id: string) {
    this.hydrated.add(id)
    this.publishSession(id)
  }

  /** Rename a session (UI action or session.updated event). */
  renameSession(id: string, title: string) {
    const s = this.ensure(id)
    s.title = title
    this.publishSession(id)
  }

  /* ---------------- broadcast plumbing ---------------- */

  broadcast(b: Broadcast) {
    for (const fn of this.subscribers) {
      try {
        fn(b)
      } catch {
        /* subscriber died; http.ts prunes on close */
      }
    }
  }

  publishSession(id: string) {
    const s = this.sessions.get(id)
    if (s) this.broadcast({ type: "session", session: snapshotSession(s, this.sessions, this.hydrated) })
    this.broadcast({ type: "totals", totals: this.totals() })
  }

  /* ---------------- sessions ---------------- */

  ensure(sessionID: string): SessionView {
    let s = this.sessions.get(sessionID)
    if (!s) {
      const now = Date.now()
      s = {
        id: sessionID,
        status: "active",
        stateText: "Working…",
        items: [],
        tokens: { input: 0, output: 0, reasoning: 0, cache: 0 },
        cost: 0,
        counts: { tools: 0, errors: 0, messages: 0, edits: 0 },
        permissions: [],
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
      }
      this.sessions.set(sessionID, s)
      this.order.unshift(sessionID)
      this.publishSession(sessionID)
    }
    return s
  }

  touch(sessionID: string) {
    const s = this.ensure(sessionID)
    const now = Date.now()
    s.updatedAt = now
    s.lastActiveAt = now
    this.order = this.order.filter((id) => id !== sessionID)
    this.order.unshift(sessionID)
    return s
  }

  removeSession(sessionID: string) {
    if (!this.sessions.delete(sessionID)) return
    this.order = this.order.filter((id) => id !== sessionID)
    this.broadcast({ type: "remove", id: sessionID })
    this.broadcast({ type: "totals", totals: this.totals() })
  }

  /** Merge a Session.Info object (from session.created / session.updated events).
   * Derives real lifecycle state from time.busy / time.idle / outcome so
   * backfilled historical sessions don't show as forever-"Working…". */
  applySessionInfo(info: unknown, opts?: { backfill?: boolean }) {
    const id = pick<string>(info, "id", "sessionID")
    if (!id) return
    const s = this.touch(id)
    const title = pick<string>(info, "title")
    if (title) s.title = title
    const agent = pick<string>(info, "agent")
    if (agent) s.agent = agent
    const parentID = pick<string>(info, "parentID", "parent_id", "parentSessionID")
    if (parentID) {
      s.parentID = parentID
      this.ensure(parentID) // make sure the parent tile exists
    }
    const model = pick<Record<string, unknown>>(info, "model")
    if (model) {
      s.modelID = pick<string>(model, "id") ?? s.modelID
      s.providerID = pick<string>(model, "providerID") ?? s.providerID
    }
    const dir = pick<string>(info, "directory", "worktree") ?? pick<string>(pick(info, "location"), "directory")
    if (dir) s.directory = dir
    const tokens = pick<Record<string, number>>(info, "tokens")
    if (tokens) {
      s.tokens.input = tokens.input ?? s.tokens.input
      s.tokens.output = tokens.output ?? s.tokens.output
      s.tokens.reasoning = tokens.reasoning ?? s.tokens.reasoning
      s.tokens.cache = pick<number>(tokens, "cache") ?? pick<number>(tokens, "cache_read") ?? s.tokens.cache
    }
    const cost = pick<number>(info, "cost")
    if (typeof cost === "number") s.cost = cost

    // Lifecycle derivation from the session's own timestamps.
    const time = pick<Record<string, number>>(info, "time")
    const outcome = pick<string>(info, "outcome")
    if (time) {
      const created = time.created
      if (created && created < s.createdAt) s.createdAt = created
      const busy = time.busy ?? 0
      const idle = time.idle ?? 0
      const isBusy = busy > idle
      if (isBusy) {
        // Only re-activate on info generated after our last observed idle —
        // stale session.updated events must not resurrect "Working…".
        if (!s.idleLatch || (time.updated ?? 0) > s.idleLatch || !idle) {
          s.status = "active"
          s.idleLatch = undefined
          if (!s.currentTool && (s.stateText === "Idle" || s.stateText === "Idle — done" || s.stateText === "Idle" || !s.stateText)) {
            s.stateText = "Working…"
          }
        }
      } else if (idle > 0 || opts?.backfill) {
        if (outcome === "failed") {
          s.status = "error"
          if (!s.stateText.startsWith("Error")) s.stateText = "Error — last run failed"
        } else {
          s.status = "idle"
          // Any stale activity text ("Thinking…", "Running X…") must not survive
          // an observed idle transition — only the error text is preserved.
          if (s.stateText && !s.stateText.startsWith("Error")) s.stateText = "Idle"
        }
      }
      if (opts?.backfill) {
        const updated = time.updated ?? time.created
        if (updated && updated > s.lastActiveAt) s.lastActiveAt = updated
      }
    }
    this.publishSession(id)
  }

  /** Context compaction lifecycle (session.compaction.* events and compaction
   * message parts). status: running | completed | failed. */
  applyCompaction(
    sessionID: string,
    st: { status: "running" | "completed" | "failed"; reason?: string; summary?: string; id?: string; at?: number },
    opts?: { hydrate?: boolean },
  ) {
    if (!sessionID) return
    const s = this.ensure(sessionID)
    const reason = st.reason === "manual" ? "manual" : "auto"
    if (st.status === "running") {
      if (!opts?.hydrate) {
        s.compacting = true
        s.status = "active"
        s.stateText = "Compacting context…"
        s.currentTool = undefined
      }
      this.addItem(sessionID, {
        kind: "state",
        id: st.id ? `comp:${st.id}:running` : `comp:running:${Date.now()}`,
        sessionID,
        state: "compacted",
        text: `Compacting context (${reason})…`,
        at: st.at ?? Date.now(),
        agent: s.agent,
      })
    } else {
      s.compacting = false
      const failed = st.status === "failed"
      this.addItem(sessionID, {
        kind: "state",
        id: st.id ? `comp:${st.id}:${st.status}` : `comp:${st.status}:${Date.now()}`,
        sessionID,
        state: "compacted",
        text: failed ? `Context compaction failed (${reason})` : `Context compacted (${reason})`,
        at: st.at ?? Date.now(),
        agent: s.agent,
      })
      if (failed) {
        s.counts.errors++
        if (!opts?.hydrate && !s.stateText.startsWith("Error")) s.stateText = "Error — compaction failed"
      } else if (!opts?.hydrate && s.status !== "active") {
        s.stateText = "Idle"
      }
    }
    this.publishSession(sessionID)
  }

  /** Usage update (session.usage.updated) — token/cost accounting for live turns. */
  applyUsage(sessionID: string, usage: unknown) {
    if (!sessionID) return
    const u = (usage ?? {}) as Record<string, number>
    const s = this.ensure(sessionID)
    const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined)
    const input = num(u.input) ?? num(u.inputTokens) ?? num(u.prompt_tokens)
    const output = num(u.output) ?? num(u.outputTokens) ?? num(u.completion_tokens)
    const reasoning = num(u.reasoning) ?? num(u.reasoningTokens)
    const cache = num(u.cache) ?? num(u.cache_read) ?? num(u.cached_input)
    if (input === undefined && output === undefined && reasoning === undefined && cache === undefined) return
    if (input !== undefined) s.tokens.input = Math.max(s.tokens.input, input)
    if (output !== undefined) s.tokens.output = Math.max(s.tokens.output, output)
    if (reasoning !== undefined) s.tokens.reasoning = Math.max(s.tokens.reasoning, reasoning)
    if (cache !== undefined) s.tokens.cache = Math.max(s.tokens.cache, cache)
    const cost = num(u.cost)
    if (cost !== undefined) s.cost = Math.max(s.cost, cost)
    this.publishSession(sessionID)
  }

  /* ---------------- activity items ---------------- */

  private addItem(sessionID: string, item: ActivityItem) {
    const s = this.ensure(sessionID)
    const idx = s.items.findIndex((i) => i.id === item.id)
    if (idx >= 0) s.items[idx] = item as ActivityItem
    else s.items.push(item as ActivityItem)
    if (s.items.length > MAX_ITEMS) s.items.splice(0, s.items.length - MAX_ITEMS)
  }

  private findItem(sessionID: string, id: string): ActivityItem | undefined {
    return this.ensure(sessionID).items.find((i) => i.id === id)
  }

  /** Tool started (from ctx.tool.hook("execute.before") or a tool part event). */
  applyToolStart(evt: {
    sessionID: string
    tool: string
    id?: string
    messageID?: string
    agent?: string
    input?: unknown
    startedAt?: number
  }) {
    if (!evt?.sessionID || !evt.tool) return
    const s = this.touch(evt.sessionID)
    const id = evt.id ?? `tool:${evt.tool}:${s.counts.tools}`
    const meta = deriveToolMeta(evt.tool, evt.input)
    const existing = this.findItem(evt.sessionID, id)
    if (existing && existing.kind === "tool") {
      // already tracked (e.g. hook fired first) — refresh metadata, keep lifecycle, no double count
      existing.title = meta.title
      existing.detail = meta.detail ?? existing.detail
    } else {
      const item: ToolItem = {
        kind: "tool",
        id,
        sessionID: evt.sessionID,
        messageID: evt.messageID,
        name: evt.tool,
        title: meta.title,
        detail: meta.detail,
        isSubagent: meta.isSubagent,
        status: "running",
        startedAt: evt.startedAt ?? Date.now(),
        agent: evt.agent ?? s.agent,
      }
      this.addItem(evt.sessionID, item)
      s.counts.tools++
      s.idleLatch = undefined // new activity invalidates the idle latch
    }
    if (meta.isSubagent) s.stateText = `Spawning ${truncate(meta.detail, 40) ?? "subagent"}…`
    else s.stateText = `Running ${evt.tool}…`
    s.currentTool = (this.findItem(evt.sessionID, id) as ToolItem) ?? undefined
    this.publishSession(evt.sessionID)
  }

  /** Tool finished (from ctx.tool.hook("execute.after") or tool part state change). */
  applyToolEnd(evt: {
    sessionID: string
    id?: string
    tool?: string
    status?: string
    error?: unknown
    startedAt?: number
    endedAt?: number
  }) {
    if (!evt?.sessionID) return
    const s = this.ensure(evt.sessionID)
    let item: ToolItem | undefined
    if (evt.id) item = this.findItem(evt.sessionID, evt.id) as ToolItem | undefined
    if (!item) {
      // fall back to the most recent running tool (matching name when given)
      for (let i = s.items.length - 1; i >= 0; i--) {
        const it = s.items[i] as ToolItem
        if (it.kind === "tool" && it.status === "running" && (!evt.tool || it.name === evt.tool)) {
          item = it
          break
        }
      }
    }
    if (!item) return
    item.status = evt.status === "error" ? "error" : "completed"
    if (evt.startedAt && !item.startedAt) item.startedAt = evt.startedAt
    item.endedAt = evt.endedAt ?? Date.now()
    if (item.status === "error") {
      s.counts.errors++
      const msg = truncate(pick<Record<string, unknown>>(evt.error, "message") ?? evt.error, 220)
      const err: ErrorItem = {
        kind: "error",
        id: `err:${item.id}`,
        sessionID: s.id,
        type: pick<string>(evt.error, "type") ?? "tool.execution",
        message: msg ?? "Tool failed",
        at: item.endedAt,
        agent: item.agent,
      }
      this.addItem(s.id, err)
      s.stateText = "Tool error"
    } else {
      s.stateText = "Thinking…"
    }
    if (s.currentTool && s.currentTool.id === item.id) s.currentTool = undefined
    this.publishSession(s.id)
  }

  /** A streamed message part (reasoning / text / tool). */
  applyMessagePart(evt: { sessionID: string; part: unknown; info?: unknown; opts?: { hydrate?: boolean } }) {
    if (!evt?.sessionID) return
    const s = this.touch(evt.sessionID)
    const part = evt.part ?? {}
    const type = pick<string>(part, "type") ?? "text"

    // A live part update means the session is working again (never during
    // hydration replays, which must not flip historical status).
    if (!evt.opts?.hydrate && s.status !== "active") {
      s.status = "active"
      s.idleLatch = undefined
      s.stateText = s.stateText.startsWith("Error") ? "Working…" : s.stateText || "Working…"
    }

    if (evt.info) {
      const agent = pick<string>(evt.info, "agent")
      if (agent) s.agent = agent
      const model = pick<Record<string, unknown>>(evt.info, "model")
      if (model) {
        s.modelID = pick<string>(model, "id") ?? s.modelID
        s.providerID = pick<string>(model, "providerID") ?? s.providerID
      }
    }

    const at = Date.now()
    const role = (pick<string>(evt.info, "role") ?? (type === "reasoning" || type === "tool" ? "assistant" : "assistant")) as
      | "user"
      | "assistant"
      | "system"
    const agent = pick<string>(evt.info, "agent") ?? s.agent

    if (type === "compaction") {
      // Compaction parts carry their own lifecycle (running/completed/failed).
      const status = pick<string>(part, "status")
      if (status === "running" || status === "completed" || status === "failed") {
        const pid = pick<string>(part, "id")
        const created = pick<number>(part, "time", "created")
        this.applyCompaction(
          evt.sessionID,
          { status, reason: pick<string>(part, "reason"), summary: pick<string>(part, "summary"), id: pid, at: created },
          evt.opts,
        )
      }
      return
    }

    if (type === "reasoning") {
      const text = pick<string>(part, "text") ?? ""
      if (text) s.reasoningPreview = truncate(text, 240)
      if (s.stateText !== "Thinking…" && !s.currentTool) s.stateText = "Thinking…"
      if (!evt.opts?.hydrate && !s.items.some((i) => i.kind === "state" && (i as StateItem).state === "thinking" && at - (i as StateItem).at < 60_000)) {
        this.addItem(s.id, {
          kind: "state",
          id: `think:${evt.sessionID}:${at}`,
          sessionID: s.id,
          state: "thinking",
          text: "Thinking…",
          at,
          agent,
        } satisfies StateItem)
      }
    } else if (type === "text") {
      const text = pick<string>(part, "text") ?? ""
      if (text) {
        s.replyPreview = truncate(text, 240)
        const messageID = pick<string>(evt.info, "id") ?? pick<string>(part, "id") ?? `txt:${at}`
        this.addItem(s.id, {
          kind: "text",
          id: messageID,
          sessionID: s.id,
          role,
          text: truncate(text, 400) ?? "",
          at: pick<number>(evt.info, "time", "created") ?? at,
          agent,
        } satisfies TextItem)
        s.counts.messages++
        if (role === "assistant" && !s.currentTool) s.stateText = "Writing…"
      }
    } else if (type === "tool") {
      const state = pick<Record<string, unknown>>(part, "state") ?? {}
      const status = pick<string>(state, "status")
      const name = pick<string>(part, "name") ?? "tool"
      const callID = pick<string>(part, "id") ?? `tool:${name}:${at}`
      const time = pick<Record<string, number>>(part, "time") ?? {}
      // Ensure the item exists even when we only ever see the completed state
      // (hydration replays history, where starts were never observed live).
      this.applyToolStart({
        sessionID: s.id,
        tool: name,
        id: callID,
        messageID: pick<string>(evt.info, "id"),
        agent,
        input: pick(state, "input"),
        startedAt: time.created ?? time.ran,
      })
      if (status === "completed" || status === "error") {
        this.applyToolEnd({
          sessionID: s.id,
          id: callID,
          tool: name,
          status,
          error: pick(state, "error"),
          startedAt: time.ran,
          endedAt: time.completed,
        })
      }
    }
    this.publishSession(evt.sessionID)
  }

  /** Full message object (message.updated) — apply all its parts. An explicit
   * sessionID hint is used when hydrating history for a known session. */
  applyMessage(msg: unknown, sessionIDHint?: string, opts?: { hydrate?: boolean }) {
    const body = pick<Record<string, unknown>>(msg, "info") ?? (msg as Record<string, unknown>)
    const sessionID = sessionIDHint ?? pick<string>(msg, "sessionID") ?? pick<string>(body, "sessionID")
    if (!sessionID) return
    const parts = pick<unknown[]>(body, "parts", "content")
    if (Array.isArray(parts)) {
      for (const part of parts) this.applyMessagePart({ sessionID, part, info: body, opts })
      return
    }
    const text = pick<string>(body, "text")
    if (text) {
      this.applyMessagePart({
        sessionID,
        part: { type: "text", text },
        info: body,
        opts,
      })
    }
  }

  /** User prompt arrived (also observable via message events, but explicit for demo/backfill). */
  applyUserMessage(sessionID: string, text: string, at = Date.now()) {
    const s = this.touch(sessionID)
    this.addItem(sessionID, {
      kind: "text",
      id: `user:${at}:${s.counts.messages}`,
      sessionID,
      role: "user",
      text: truncate(text, 300) ?? "",
      at,
    })
    s.counts.messages++
    s.status = "active"
    s.idleLatch = undefined
    s.stateText = "Working…"
    this.publishSession(sessionID)
  }

  /* ---------------- lifecycle events ---------------- */

  applyAgentSwitch(evt: { sessionID: string; agent?: string; previous?: string }) {
    if (!evt?.sessionID) return
    const s = this.touch(evt.sessionID)
    if (evt.agent) s.agent = evt.agent
    this.addItem(s.id, {
      kind: "state",
      id: `switch:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`,
      sessionID: s.id,
      state: "switched",
      text: evt.agent ? `Switched to ${evt.agent}` : "Agent switched",
      at: Date.now(),
      agent: evt.agent,
      previous: evt.previous,
    })
    this.publishSession(s.id)
  }

  applyIdle(evt: { sessionID: string; outcome?: string; error?: unknown }, opts?: { silent?: boolean }) {
    if (!evt?.sessionID) return
    // silent auto-idles (watchdog) must not refresh lastActiveAt — the session
    // has been silent for a while, and Live-rail recency should reflect that.
    const s = opts?.silent ? this.ensure(evt.sessionID) : this.touch(evt.sessionID)
    s.currentTool = undefined
    s.idleLatch = Date.now()
    const outcome = evt.outcome
    if (outcome === "failed" || evt.error) {
        s.status = "error"
        s.stateText = "Error — last run failed"
      const type = pick<Record<string, unknown>>(evt.error, "type")
      const err: ErrorItem = {
        kind: "error",
        id: `err:${s.id}:${Date.now()}`,
        sessionID: s.id,
        type: typeof type === "string" ? type : undefined,
        message: truncate(pick(evt.error, "message") ?? evt.error ?? "Session failed", 220) ?? "Session failed",
        at: Date.now(),
        agent: s.agent,
      }
      this.addItem(s.id, err)
      s.counts.errors++
    } else {
      s.status = "idle"
      s.stateText = "Idle"
      if (!opts?.silent) {
        this.addItem(s.id, {
          kind: "state",
          id: `done:${s.id}:${Date.now()}`,
          sessionID: s.id,
          state: "done",
          text: "Turn completed",
          at: Date.now(),
          agent: s.agent,
        })
      }
    }
    this.publishSession(s.id)
  }

  applySessionError(evt: { sessionID: string; error?: unknown }) {
    if (!evt?.sessionID) return
    const s = this.touch(evt.sessionID)
    const err: ErrorItem = {
      kind: "error",
      id: `err:${s.id}:${Date.now()}`,
      sessionID: s.id,
      type: pick<string>(evt.error, "type"),
      message: truncate(pick(evt.error, "message") ?? evt.error ?? "Unknown error", 220) ?? "Unknown error",
      at: Date.now(),
      agent: s.agent,
    }
    this.addItem(s.id, err)
    s.counts.errors++
    s.status = "error"
    s.stateText = "Error"
    this.publishSession(s.id)
  }

  applyPermission(evt: { sessionID: string; id?: string; action?: string; title?: string; replied?: boolean }) {
    if (!evt?.sessionID) return
    const s = this.touch(evt.sessionID)
    const id = evt.id ?? `perm:${Date.now()}`
    if (evt.replied) {
      s.permissions = s.permissions.filter((p) => p.id !== id)
    } else {
      if (!s.permissions.some((p) => p.id === id)) {
        s.permissions.push({ id, action: evt.action, title: evt.title ?? evt.action, at: Date.now() })
        this.addItem(s.id, {
          kind: "state",
          id: `wait:${id}`,
          sessionID: s.id,
          state: "waiting",
          text: `Waiting for approval: ${evt.title ?? evt.action ?? "action"}`,
          at: Date.now(),
          agent: s.agent,
        })
      }
    }
    if (s.permissions.length > 0) s.stateText = "Waiting for approval…"
    else if (s.status === "active") s.stateText = "Working…"
    this.publishSession(s.id)
  }

  /* ---------------- snapshots ---------------- */

  totals(): Totals {
    let tokens = 0
    let toolCalls = 0
    let errors = 0
    let cost = 0
    let active = 0
    for (const s of this.sessions.values()) {
      tokens += s.tokens.input + s.tokens.output + s.tokens.reasoning
      toolCalls += s.counts.tools
      errors += s.counts.errors
      cost += s.cost
      if (s.status === "active") active++
    }
    return { sessions: this.sessions.size, active, tokens, toolCalls, errors, cost }
  }

  snapshot(): Snapshot {
    const now = Date.now()
    const sessions = this.order
      .map((id) => this.sessions.get(id))
      .filter((s): s is SessionView => Boolean(s))
      .map((s) => snapshotSession(s, this.sessions, this.hydrated))
    const eventCounts: Record<string, number> = {}
    for (const [t, n] of this.eventCounts) eventCounts[t] = n
    return {
      now,
      uptime: now - this.startedAt,
      totals: this.totals(),
      sessions,
      stats: {
        eventsHandled: [...this.eventCounts.values()].reduce((a, b) => a + b, 0),
        lastEventAt: this.lastEventAt,
        lastEventType: this.lastEventType,
        pumpErrors: this.pumpErrors,
        eventCounts,
        backfill: this.backfill,
      },
    }
  }
}

function snapshotSession(
  s: SessionView,
  all: Map<string, SessionView>,
  hydrated?: Set<string>,
): Snapshot["sessions"][number] {
  const children: Snapshot["sessions"][number]["children"] = []
  for (const other of all.values()) {
    if (other.parentID === s.id) {
      children.push({ id: other.id, title: other.title, status: other.status, stateText: other.stateText })
    }
  }
  const base = children.length ? { ...s, children } : { ...s }
  return (hydrated?.has(s.id) ? { ...base, hydrated: true } : base) as Snapshot["sessions"][number]
}
