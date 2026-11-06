/**
 * Harness: calls the plugin's setup() against a fake host context to prove the
 * bridge boots, serves the UI, and pushes SSE — without a real OpenCode run.
 */
import index from "../src/index.ts"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function* emptyStream() {
  yield { type: "session.updated", properties: { info: { id: "ses_fake", title: "Harness session", agent: "build" } } }
  await sleep(200)
  yield {
    type: "message.part.updated",
    properties: { sessionID: "ses_fake", part: { type: "text", text: "hello from the harness" } },
  }
  await sleep(200)
  yield { type: "session.idle", properties: { sessionID: "ses_fake", outcome: "succeeded" } }
  await sleep(4000)
}

const ctx = {
  options: { port: 4098, autoOpen: false },
  event: { subscribe: () => emptyStream() },
  tool: {
    hook: async (_name: string, cb: (e: unknown) => void) => {
      // fire a synthetic tool call through the registered hook to prove the path
      setTimeout(() => cb({ tool: "read", sessionID: "ses_fake", id: "fake-tool-1", input: { filePath: "src/app.ts" } }), 120)
      setTimeout(
        () => cb({ tool: "read", id: "fake-tool-1", sessionID: "ses_fake", status: "completed" }),
        240,
      )
      return { dispose: () => {} }
    },
  },
  session: {},
}

const api = await index.setup(ctx as never)
await sleep(300)
const res = await fetch("http://127.0.0.1:4098/api/state")
const state = (await res.json()) as { sessions: Array<{ id: string; status: string; stateText: string; counts: { tools: number } }> }
console.log("harness state:", JSON.stringify(state.sessions.map((s) => ({ id: s.id, status: s.status, state: s.stateText, tools: s.counts.tools }))))
const html = await (await fetch("http://127.0.0.1:4098/")).text()
console.log("harness UI bytes:", html.length, html.includes("Agents Dashboard") ? "title OK" : "title MISSING")
// clean teardown: close the bridge + dispose collectors, then let node drain
// (a bare process.exit() while the SSE generator is parked triggers a
//  fail-fast exit 0xC0000409 on Windows/Node 24)
if (typeof (api as { shutdown?: (f: boolean) => void })?.shutdown === "function") {
  ;(api as { shutdown: (f: boolean) => void }).shutdown(true)
}
await sleep(100)
process.exit(0)
