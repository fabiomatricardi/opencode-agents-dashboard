/**
 * Demo mode: replays session-example.json through the SAME store + bridge the
 * live plugin uses, so the dashboard can be developed and styled without a
 * running OpenCode instance.
 *
 *   node scripts/demo.ts [path/to/session-example.json]
 *
 * Serves on http://127.0.0.1:4099 (override with DEMO_PORT).
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { DashboardStore } from "../src/store.ts"
import { startBridge } from "../src/http.ts"
import { pick } from "../src/types.ts"

const samplePath =
  process.argv[2] ??
  join(fileURLToPath(new URL("../../..", import.meta.url)), "session-example.json")
const port = Number(process.env.DEMO_PORT ?? 4099)
const stepMs = Number(process.env.DEMO_STEP_MS ?? 55)

interface AnyMsg { type?: string; [k: string]: unknown }

const raw = JSON.parse(readFileSync(samplePath, "utf8")) as { info?: unknown; messages?: AnyMsg[] }
const store = new DashboardStore()
const sessionID = String(pick(raw.info, "id") ?? "ses_demo")

store.applySessionInfo(raw.info)

const bridge = await startBridge({
  store,
  port,
  publicDir: fileURLToPath(new URL("../public/", import.meta.url)),
  api: {
    // Demo has no OpenCode context: rename applies to the in-memory store only.
    renameSession: (sessionID: string, title: string) => {
      store.renameSession(sessionID, title)
      return { session: store.sessionView(sessionID) }
    },
  },
  onLog: (l) => console.log(l),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function replay() {
  await sleep(800)
  for (const msg of raw.messages ?? []) {
    const type = String(msg.type ?? "")
    const time = (pick<Record<string, number>>(msg, "time") ?? {}) as Record<string, number>

    if (type === "user") {
      store.applyUserMessage(sessionID, String(msg.text ?? "(user message)"), time.created ?? Date.now())
    } else if (type === "assistant") {
      const info = {
        id: String(msg.id ?? ""),
        role: "assistant",
        agent: pick<string>(msg, "agent"),
        model: pick<Record<string, unknown>>(msg, "model"),
        time,
      }
      const content = (msg.content as unknown[] | undefined) ?? []
      for (const part of content) {
        const ptype = String(pick(part, "type") ?? "")
        if (ptype === "reasoning") {
          store.applyMessagePart({ sessionID, part: { type: "reasoning", text: pick(part, "text") }, info })
        } else if (ptype === "text") {
          store.applyMessagePart({ sessionID, part: { type: "text", text: pick(part, "text") }, info })
        } else if (ptype === "tool") {
          const state = (pick<Record<string, unknown>>(part, "state") ?? {}) as Record<string, unknown>
          const status = String(state.status ?? "completed")
          const name = String(pick(part, "name") ?? "tool")
          const callID = String(pick(part, "id") ?? `tool:${name}:${Math.random().toString(36).slice(2, 8)}`)
          const ptime = (pick<Record<string, number>>(part, "time") ?? {}) as Record<string, number>
          store.applyToolStart({
            sessionID,
            tool: name,
            id: callID,
            agent: info.agent,
            messageID: info.id,
            input: pick(state, "input"),
            startedAt: ptime.created ?? ptime.ran,
          })
          await sleep(40)
          store.applyToolEnd({
            sessionID,
            id: callID,
            tool: name,
            status: status === "error" ? "error" : "completed",
            error: pick(state, "error"),
            startedAt: ptime.ran,
            endedAt: ptime.completed ?? Date.now(),
          })
        }
        await sleep(stepMs)
      }
      // finish reason → derive terminal state of the message
      const finish = String(msg.finish ?? "stop")
      if (finish === "error") {
        store.applySessionError({ sessionID, error: pick(msg, "error") })
      }
    } else if (type === "synthetic") {
      store.applyMessagePart({
        sessionID,
        part: { type: "text", text: String(msg.text ?? "(synthetic)") },
        info: { id: String(msg.id ?? ""), role: "system" },
      })
    } else if (type === "agent-switched") {
      store.applyAgentSwitch({
        sessionID,
        agent: pick<string>(msg, "agent"),
        previous: pick<string>(msg, "previous"),
      })
    } else if (type === "idle") {
      store.applyIdle({
        sessionID,
        outcome: pick<string>(msg, "outcome"),
        error: pick(msg, "error"),
      })
    }
    await sleep(stepMs)
  }
  console.log("[demo] replay finished — live session snapshot kept on screen")
}

void replay()

// keep the demo server running; ctrl-c to stop
process.on("SIGINT", () => {
  bridge.close()
  process.exit(0)
})
