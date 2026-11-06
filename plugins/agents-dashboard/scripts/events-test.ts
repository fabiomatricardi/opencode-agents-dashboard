/**
 * Event-family test: drives the NEW V2 event names (session.tool.*,
 * session.usage.updated, session.compaction.*, session.execution.*) through
 * the collector's handleEvent — proving capture works on v2.2+ buses and
 * exercising the compaction lifecycle end-to-end.
 */
import { DashboardStore } from "../src/store.ts"
import { handleEvent } from "../src/collector.ts"

const store = new DashboardStore()
const ev = (type: string, properties: Record<string, unknown>) => handleEvent(store, { type, properties })
const fail = (msg: string) => {
  console.error("FAIL:", msg)
  process.exit(1)
}

// 1. tool lifecycle via the new bus names
ev("session.tool.called", { sessionID: "ses_t", tool: "shell", callID: "c1", input: { command: "ls" } })
let s = store.sessions.get("ses_t")
if (!s || s.counts.tools !== 1 || s.currentTool?.status !== "running") fail("tool.called did not start a tool")
if (s.stateText !== "Running shell…") fail(`stateText after tool.called = ${s.stateText}`)

ev("session.tool.success", { sessionID: "ses_t", callID: "c1", tool: "shell" })
s = store.sessions.get("ses_t")
if (s.currentTool) fail("tool.success did not clear currentTool")

// 2. usage accounting via the new bus name
ev("session.usage.updated", { sessionID: "ses_t", usage: { input: 1000, output: 500, reasoning: 100, cache: 50, cost: 0.01 } })
s = store.sessions.get("ses_t")
if (s.tokens.input !== 1000 || s.tokens.output !== 500 || s.cost !== 0.01) fail("usage.updated did not apply tokens")

// 3. compaction lifecycle: running -> completed
ev("session.compaction.started", { sessionID: "ses_t", reason: "auto" })
s = store.sessions.get("ses_t")
if (s.stateText !== "Compacting context…") fail(`stateText during compaction = ${s.stateText}`)
if (!s.compacting) fail("compacting flag not set")
// watchdog must not auto-idle a compacting session
;(store as unknown as { sweep: () => void }).sweep?.()
// force lastActiveAt far in the past and sweep again via private path
;(s as unknown as { lastActiveAt: number }).lastActiveAt = Date.now() - 600_000
;(store as unknown as { sweep: () => void }).sweep?.()
if (s.status !== "active") fail("watchdog auto-idled a compacting session")

ev("session.compaction.ended", { sessionID: "ses_t", reason: "auto" })
s = store.sessions.get("ses_t")
if (s.compacting) fail("compacting flag not cleared on ended")
const compItems = s.items.filter((i) => i.kind === "state" && (i as { state?: string }).state === "compacted")
if (compItems.length !== 2) fail(`expected 2 compaction items, got ${compItems.length}`)

// 4. compaction failure path counts an error
ev("session.compaction.started", { sessionID: "ses_t", reason: "manual" })
ev("session.compaction.failed", { sessionID: "ses_t", reason: "manual" })
s = store.sessions.get("ses_t")
if (s.counts.errors !== 1) fail(`compaction failure not counted (errors=${s.counts.errors})`)

// 5. execution lifecycle
ev("session.execution.started", { sessionID: "ses_e" })
s = store.sessions.get("ses_e")
if (s.status !== "active") fail("execution.started did not activate")
ev("session.execution.succeeded", { sessionID: "ses_e" })
s = store.sessions.get("ses_e")
if (s.status !== "idle" || s.stateText !== "Idle") fail(`execution.succeeded -> ${s.status}/${s.stateText}`)

// 6. stats observability
const snap = store.snapshot()
if (!snap.stats || snap.stats.eventsHandled < 8) fail(`stats missing or too few events: ${snap.stats?.eventsHandled}`)
if (!snap.stats.eventCounts["session.compaction.ended"]) fail("eventCounts lacks compaction.ended")

console.log("events-family test: OK —", JSON.stringify({
  events: snap.stats.eventsHandled,
  types: Object.keys(snap.stats.eventCounts).length,
  compactionItems: compItems.length,
}))
process.exit(0)
