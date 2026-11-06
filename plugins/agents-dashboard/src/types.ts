/**
 * Shared data model for the agents dashboard.
 * Everything here is deliberately plain and serializable: the store produces
 * JSON snapshots that are pushed to the browser over SSE verbatim.
 */

export type ToolStatus = "running" | "completed" | "error"
export type SessionStatus = "active" | "idle" | "error"

/** One entry in a session's activity timeline. */
export interface ToolItem {
  kind: "tool"
  id: string
  sessionID: string
  messageID?: string
  name: string
  /** Short human summary, e.g. `edit → src/app.ts` */
  title: string
  /** Optional secondary detail (command, glob pattern, url...) */
  detail?: string
  status: ToolStatus
  startedAt: number
  endedAt?: number
  agent?: string
  /** True when this tool call spawned a subagent session. */
  isSubagent?: boolean
}

export interface TextItem {
  kind: "text"
  id: string
  sessionID: string
  role: "user" | "assistant" | "system"
  text: string
  at: number
  agent?: string
}

export interface StateItem {
  kind: "state"
  id: string
  sessionID: string
  state: "thinking" | "idle" | "done" | "switched" | "waiting"
  text: string
  at: number
  agent?: string
  previous?: string
}

export interface ErrorItem {
  kind: "error"
  id: string
  sessionID: string
  type?: string
  message: string
  at: number
  agent?: string
}

export type ActivityItem = ToolItem | TextItem | StateItem | ErrorItem

export interface SessionView {
  id: string
  title?: string
  parentID?: string
  agent?: string
  providerID?: string
  modelID?: string
  directory?: string
  status: SessionStatus
  /** Derived current activity, e.g. "Running edit…", "Thinking…" */
  stateText: string
  currentTool?: ToolItem
  items: ActivityItem[]
  tokens: { input: number; output: number; reasoning: number; cache: number }
  cost: number
  counts: { tools: number; errors: number; messages: number; edits: number }
  permissions: Array<{ id: string; action?: string; title?: string; at: number }>
  /** Local timestamp of the last observed idle transition (drives the activation latch). */
  idleLatch?: number
  /** Set while a context compaction is in progress (suppresses the idle watchdog). */
  compacting?: boolean
  /** First characters of the most recent reasoning stream, for the AI overview panel. */
  reasoningPreview?: string
  /** Last assistant text snippet. */
  replyPreview?: string
  createdAt: number
  updatedAt: number
  lastActiveAt: number
}

export interface Totals {
  sessions: number
  active: number
  tokens: number
  toolCalls: number
  errors: number
  cost: number
}

export interface Snapshot {
  now: number
  uptime: number
  totals: Totals
  sessions: Array<SessionView & { children?: Array<{ id: string; title?: string; status: SessionStatus; stateText: string }> }>
  /** Collector observability — which bus events actually arrive, and when. */
  stats: {
    eventsHandled: number
    lastEventAt: number
    lastEventType: string
    pumpErrors: number
    eventCounts: Record<string, number>
    backfill: { at: number; count: number; error?: string }
  }
}

/** Rolling buffer cap per session. */
export const MAX_ITEMS = 600

/* ---------- small helpers shared by store / collector / demo ---------- */

/** Pick the first defined value among keys of an object (defensive field reading). */
export function pick<T = unknown>(obj: unknown, ...keys: string[]): T | undefined {
  if (typeof obj !== "object" || obj === null) return undefined
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k]
    if (v !== undefined && v !== null) return v as T
  }
  return undefined
}

export function truncate(s: unknown, max = 96): string | undefined {
  if (s === undefined || s === null) return undefined
  const str = String(s).replace(/\s+/g, " ").trim()
  if (!str) return undefined
  return str.length > max ? str.slice(0, max - 1) + "…" : str
}

const FILE_KEYS = ["filePath", "file_path", "path", "file", "target"]
const CMD_KEYS = ["command", "cmd", "script"]
const QUERY_KEYS = ["pattern", "query", "q", "url", "glob", "description", "prompt"]

/** Redaction placeholders from shared logs, e.g. `[redacted:tool-input:...]`. */
function isRedacted(v: unknown): boolean {
  return typeof v === "string" && (v.startsWith("[redacted") || v.startsWith("redacted:"))
}

/**
 * Build the display title/detail for a tool call from its raw input.
 * Tolerant by design: input shapes vary between tools and versions.
 */
export function deriveToolMeta(name: string, input: unknown): { title: string; detail?: string; isSubagent?: boolean } {
  const obj = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>
  const file = pick<string>(obj, ...FILE_KEYS)
  const cmd = pick<string>(obj, ...CMD_KEYS)
  const other = pick<string>(obj, ...QUERY_KEYS)

  if (name === "subagent" || name === "task" || name === "agent") {
    const sub = [other, cmd].find((v) => v && !isRedacted(v))
    return { title: `Subagent: ${truncate(sub, 64) ?? name}`, detail: sub, isSubagent: true }
  }
  if (file && !isRedacted(file)) {
    const base = file.split(/[\\/]/).pop() ?? file
    return { title: `${name} → ${base}`, detail: file }
  }
  if (cmd && !isRedacted(cmd)) return { title: `${name} → ${truncate(cmd, 48) ?? ""}`, detail: truncate(cmd, 160) }
  if (other && !isRedacted(other)) return { title: `${name} → ${truncate(other, 48) ?? ""}`, detail: truncate(other, 160) }
  if (typeof input === "object" && input !== null) {
    const first = Object.entries(obj)
      .filter(([k, v]) => k !== "redacted" && typeof v === "string" && v && !isRedacted(v))
      .map(([, v]) => v as string)
      .find(Boolean)
    if (first) return { title: `${name} → ${truncate(first, 40)}`, detail: truncate(first, 160) }
  }
  return { title: name }
}
