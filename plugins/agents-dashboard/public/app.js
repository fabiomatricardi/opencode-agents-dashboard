/* OpenCode Agents Dashboard — live client.
   Left rail: all sessions. Main stage: the selected actor (auto-follows the
   active one until you pin another). Connects to the plugin's SSE stream. */
"use strict"

/* ---------------- state ---------------- */
const sessions = new Map() // id -> session view
let totals = { sessions: 0, active: 0, tokens: 0, toolCalls: 0, errors: 0, cost: 0 }
let selectedID = null
let following = true // auto-switch main stage to the active session
let stopped = false // fully stopped from the UI
let railMode = localStorage.getItem("dash.railMode") === "all" ? "all" : "live"
const RECENT_MS = 10 * 60 * 1000 // "recently active" window for Live mode
const hydrating = new Set() // ids with an in-flight history fetch
const noHistory = new Set() // ids where the server can't hydrate (demo mode)

const $side = document.getElementById("side-list")
const $sideCount = document.getElementById("side-count")
const $stage = document.getElementById("stage")
const $topstats = document.getElementById("topstats")
const $live = document.getElementById("live")
const $liveText = document.getElementById("live-text")
const $followChip = document.getElementById("follow-chip")
const $stopBtn = document.getElementById("stop-btn")

/* ---------------- helpers ---------------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

function fmtTokens(n) {
  n = Math.max(0, n | 0)
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}
function fmtDur(ms) {
  if (ms == null || isNaN(ms)) return ""
  if (ms < 0) ms = 0
  if (ms < 60_000) return (ms / 1000).toFixed(1) + "s"
  if (ms < 3_600_000) return Math.floor(ms / 60000) + ":" + String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")
  return Math.floor(ms / 3_600_000) + ":" + String(Math.floor((ms % 3_600_000) / 60000)).padStart(2, "0") + ":" + String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")
}
function fmtCost(n) {
  if (!n) return "$0.00"
  if (n < 0.01) return "$" + n.toFixed(4)
  return "$" + n.toFixed(2)
}
function shortID(id) {
  const i = String(id || "")
  return i.length > 9 ? "…" + i.slice(-6) : i
}
function shortText(s, max = 120) {
  s = String(s ?? "").replace(/\s+/g, " ").trim()
  return s.length > max ? s.slice(0, max - 1) + "…" : s
}

const ICONS = {
  read: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
  glob: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="11.5" cy="13.5" r="2.3"/><path d="m15.5 15.5 2 2"/></svg>',
  grep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 11h9"/><circle cx="16.5" cy="15.5" r="3.2"/><path d="m19.2 18.2 2 2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  write: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M12 12v6M9 15h6"/></svg>',
  shell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 17 6-6-6-6M12 19h8"/></svg>',
  sub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V4M8 4h8M9 13h.01M15 13h.01"/></svg>',
  netfetch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11" r="8"/><path d="M3.5 11h17M12 3.5c2.8 3 2.8 12 0 15M12 3.5c-2.8 3-2.8 12 0 15"/><path d="M12 13.5v7m0 0-2.5-2.5m2.5 2.5 2.5-2.5"/></svg>',
  netsearch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><path d="M7.5 10.5a3 3 0 0 1 6 0M10.5 3.5c2 2.2 2 11.8 0 14M10.5 3.5c-2 2.2-2 11.8 0 14"/><path d="m19.5 19.5 2 2"/></svg>',
  think: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4L18 8.7l-4.3 1.7L12 14.7l-1.7-4.3L6 8.7l4.3-1.7Z"/><path d="M18.5 14.5l.9 2.1 2.1.9-2.1-2.1-.9ZM5.5 15.5l.9 2.1 2.1-.9-.9-2.1-2.1.9Z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h4v4M20 4l-6.5 6.5M4 20l6.5-6.5M16 20h4v-4M20 20 14 13.5M4 4l6.5 6.5"/></svg>',
  wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10M7 21h10"/><path d="M8.5 3v3.5c0 2.2 1.5 3.6 3.5 5-2 .1.4-3.5 2.8-3.5 5V21M15.5 3v3.5c0 2.2-1.5 3.6-3.5 5 2 1.4 3.5 2.8 3.5 5V21"/></svg>',
  done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5.5"/></svg>',
  err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 20h19Z"/><path d="M12 10v5M12 17.5h.01"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V5M9 5h6M9.5 13h.01M14.5 13h.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>',
  comp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16M4 20h16"/><path d="m9 8.5 3 3 3-3"/><path d="m9 15.5 3-3 3 3"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z"/></svg>',
}
function toolIcon(name, isSub) {
  const n = String(name || "").toLowerCase()
  if (isSub || n === "subagent" || n === "task" || n === "agent") return { cls: "sub", svg: ICONS.sub }
  if (n === "read") return { cls: "read", svg: ICONS.read }
  if (n === "glob") return { cls: "read", svg: ICONS.glob }
  if (n === "grep") return { cls: "read", svg: ICONS.grep }
  if (n === "edit" || n === "patch" || n === "multiedit") return { cls: "edit", svg: ICONS.edit }
  if (n === "write") return { cls: "edit", svg: ICONS.write }
  if (["shell", "execute", "bash", "powershell"].includes(n)) return { cls: "shell", svg: ICONS.shell }
  if (n === "webfetch" || n === "fetch") return { cls: "net", svg: ICONS.netfetch }
  if (n === "websearch") return { cls: "net", svg: ICONS.netsearch }
  return { cls: "misc", svg: ICONS.msg }
}
const STATE_ICONS = {
  thinking: { cls: "think", svg: ICONS.think },
  switched: { cls: "sub", svg: ICONS.shuffle },
  waiting: { cls: "net", svg: ICONS.wait },
  done: { cls: "done", svg: ICONS.done },
  idle: { cls: "misc", svg: ICONS.done },
  compacted: { cls: "comp", svg: ICONS.comp },
}

/* ---------------- timeline rendering (main stage) ---------------- */
function timelineItemHTML(item) {
  let who = "",
    t = "",
    detail = "",
    dur = "",
    cls = "",
    ico = ""
  if (item.kind === "tool") {
    who = esc(item.name)
    t = esc(item.title)
    detail = item.detail ? esc(item.detail) : ""
    dur = item.status === "running" ? "running…" : fmtDur((item.endedAt ?? 0) - item.startedAt)
    const ic = toolIcon(item.name, item.isSubagent)
    ico = `<span class="tl-ico ${ic.cls}">${ic.svg}</span>`
    cls = `kind-tool status-${esc(item.status)} has-ico ${item.status === "running" ? "running" : ""}`
  } else if (item.kind === "text") {
    who = item.role === "user" ? "user" : item.role === "system" ? "system" : esc(item.agent || "agent")
    t = esc(item.text)
    if (item.role === "user") ico = `<span class="tl-ico user">${ICONS.user}</span>`
    else if (item.role === "system") ico = `<span class="tl-ico misc">${ICONS.gear}</span>`
    else ico = `<span class="tl-ico edit">${ICONS.bot}</span>`
    cls = `kind-text role-${esc(item.role)} has-ico`
  } else if (item.kind === "error") {
    who = "error"
    t = esc(item.message)
    detail = item.type ? esc(item.type) : ""
    ico = `<span class="tl-ico err">${ICONS.err}</span>`
    cls = "kind-error has-ico"
  } else {
    who = "state"
    t = esc(item.text)
    const si = STATE_ICONS[item.state] ?? { cls: "misc", svg: ICONS.msg }
    ico = `<span class="tl-ico ${si.cls}">${si.svg}</span>`
    cls = `kind-state ${esc(item.state)} has-ico`
  }
  return `<div class="tl-item ${cls}">
    ${ico}
    <div class="tl-head"><span class="who">${who}</span><span class="t">${t}</span><span class="dur">${esc(dur)}</span></div>
    ${detail ? `<div class="detail">${detail}</div>` : ""}
  </div>`
}

/* ---------------- side list ---------------- */
const DOT_TIP = {
  active: "active — running now, consuming tokens",
  idle: "idle — dormant, not sending requests",
  error: "error — last run failed, dormant",
}
function isLive(s) {
  return s.status === "active" || Date.now() - s.lastActiveAt < RECENT_MS
}

function railHeaderHTML() {
  const btn = (mode, label) =>
    `<button class="modebtn ${railMode === mode ? "on" : ""}" data-mode="${mode}">${label}</button>`
  return `<div class="rail-tools">
      ${btn("live", "Live")}${btn("all", "All")}
      <button class="modebtn prune" id="clear-finished" title="Remove idle & error sessions older than 10 minutes from the dashboard (OpenCode keeps them)">Clear finished</button>
    </div>`
}

function sideRowHTML(s, depth) {
  const cls = s.status === "active" ? "active" : s.status === "error" ? "error" : "idle"
  const agentCls = /plan/i.test(s.agent || "") ? "plan" : /build/i.test(s.agent || "") ? "build" : s.parentID ? "sub" : "other"
  const agentLabel = s.parentID && !s.agent ? "sub" : s.agent || ""
  const selected = s.id === selectedID ? " selected" : ""
  const childCls = depth > 0 ? " child" : ""
  return `<div class="row ${cls}${selected}${childCls}" data-id="${esc(s.id)}" style="--depth:${depth}" tabindex="0" title="${esc(DOT_TIP[s.status] || "")}">
    <span class="dot" title="${esc(DOT_TIP[s.status] || "")}"></span>
    <span class="row-main">
      <span class="row-title">${depth > 0 ? "↳ " : ""}${esc(s.title || "Session " + shortID(s.id))}</span>
      <span class="row-state">${esc(shortText(s.stateText, 44))}</span>
    </span>
    ${agentLabel ? `<span class="pill ${esc(agentCls)}">${esc(agentLabel)}</span>` : ""}
    <span class="row-x" data-x="${esc(s.id)}" title="Remove from dashboard">✕</span>
  </div>`
}

function visibleSessions() {
  const list = [...sessions.values()].sort((a, b) => {
    const rank = { active: 0, error: 1, idle: 2 }
    const d = (rank[a.status] ?? 3) - (rank[b.status] ?? 3)
    if (d !== 0) return d
    return b.lastActiveAt - a.lastActiveAt
  })
  if (railMode === "all") return list
  // Live mode: active, recently active, the selected session, and children of visible parents.
  const byId = new Map(list.map((s) => [s.id, s]))
  const keep = new Set()
  for (const s of list) {
    if (isLive(s) || s.id === selectedID) keep.add(s.id)
  }
  // never orphan a visible child's parent
  for (const s of list) {
    if (keep.has(s.id) && s.parentID && byId.has(s.parentID)) keep.add(s.parentID)
  }
  // fallback: never show an empty rail while sessions exist — keep the single
  // most recent session visible even if it aged out of the 10-minute window
  if (!keep.size && list.length) keep.add(list[0].id)
  return list.filter((s) => keep.has(s.id))
}

function renderSide() {
  const list = visibleSessions()
  const byId = new Map(list.map((s) => [s.id, s]))
  const childrenOf = new Map()
  const roots = []
  for (const s of list) {
    if (s.parentID && byId.has(s.parentID)) {
      if (!childrenOf.has(s.parentID)) childrenOf.set(s.parentID, [])
      childrenOf.get(s.parentID).push(s)
    } else {
      roots.push(s)
    }
  }
  let count = 0
  const out = [railHeaderHTML()]
  const walk = (s, depth) => {
    out.push(sideRowHTML(s, depth))
    count++
    for (const c of childrenOf.get(s.id) ?? []) walk(c, depth + 1)
  }
  roots.forEach((r) => walk(r, 0))
  // orphans (parent not tracked) render at top level with their ↳ marker
  for (const s of list) {
    if (s.parentID && !byId.has(s.parentID)) {
      out.push(sideRowHTML(s, 0))
      count++
    }
  }
  let rowsHTML = out.slice(1).join("")
  if (!count) {
    rowsHTML = `<div class="side-empty">No live sessions right now — ${sessions.size} past session${sessions.size === 1 ? "" : "s"} hidden.<br><button class="modebtn" data-mode="all" style="margin-top:8px">Show all</button></div>`
  }
  $side.innerHTML = railHeaderHTML() + rowsHTML
  $sideCount.textContent = `${count}/${sessions.size}`
}

/* ---------------- main stage ---------------- */
let editingID = null

function stageHTML(s) {
  const status = s.status === "active" ? "active" : s.status === "error" ? "error" : "idle"
  const stateCls = s.status === "active" ? "" : s.status === "error" ? "state-error" : "state-idle"
  const agentCls = /plan/i.test(s.agent || "") ? "plan" : /build/i.test(s.agent || "") ? "build" : s.parentID ? "sub" : "other"
  const agentLabel = s.agent || (s.parentID ? "subagent" : "agent")

  const kids = (s.children ?? [])
    .map(
      (c) =>
        `<button class="kid ${esc(c.status)}" data-focus="${esc(c.id)}" title="${esc(c.id)}">
          <span class="dot"></span>${esc(shortID(c.id))} — ${esc(shortText(c.stateText, 30))}
        </button>`,
    )
    .join("")
  const parentChip = s.parentID
    ? `<button class="kid parent-of" data-focus="${esc(s.parentID)}" title="${esc(s.parentID)}">↳ subagent of ${esc(shortID(s.parentID))}</button>`
    : ""

  const perm = s.permissions?.length
    ? `<div class="perm"><span class="dot"></span>Waiting for approval — ${esc(s.permissions[0].title || "action")}</div>`
    : ""

  // Newest-first: latest activity is always the top row of the stage.
  // state/text/error items carry `at`; tool items carry startedAt/endedAt.
  const tsOf = (i) => (i.at ?? i.startedAt ?? i.endedAt ?? 0)
  const chron = [...s.items].sort((a, b) => tsOf(b) - tsOf(a))
  const overview =
    s.reasoningPreview || s.replyPreview
      ? `<div class="overview">
          ${s.reasoningPreview ? `<div class="cap">AI overview — latest reasoning</div><div class="txt">${esc(s.reasoningPreview)}</div>` : ""}
          ${s.replyPreview ? `<div class="cap" style="margin-top:10px">Latest reply</div><div class="txt">${esc(s.replyPreview)}</div>` : ""}
        </div>`
      : ""

  const hydrationNote = noHistory.has(s.id)
    ? '<div class="hydrate-note">History unavailable in this mode — showing live activity only.</div>'
    : ""

  return `<section class="stage-inner">
    <div class="stage-head">
      <span class="dot"></span>
      ${
        editingID === s.id
          ? `<input class="rename-input" id="rename-input" value="${esc(s.title || "")}" maxlength="120"
              placeholder="Session title" autocomplete="off" />
             <span class="rename-hint">Enter to save · Esc to cancel</span>`
          : `<h2>${esc(s.title || "Session " + shortID(s.id))}${s.directory ? ` <small>· ${esc(shortText(s.directory.split(/[\\\\/]/).pop(), 26))}</small>` : ""}</h2>
             <button class="rename-btn" data-rename="${esc(s.id)}" title="Rename session">✎</button>`
      }
      <span class="pill ${esc(agentCls)}">${esc(agentLabel)}</span>
      <span class="model">${esc(s.modelID || "")}</span>
      <span class="right" data-timer="${esc(s.createdAt)}">⏱ ${fmtDur(Date.now() - s.createdAt)}</span>
    </div>
    <div class="stage-state ${stateCls}">
      <span class="spinner"></span><span class="txt">${esc(s.stateText || "—")}</span>
    </div>
    ${perm}
    <div class="stage-meta">
      <span>tokens <b>${fmtTokens(s.tokens.input + s.tokens.output + s.tokens.reasoning)}</b></span>
      <span>tools <b>${s.counts.tools}</b></span>
      <span>errors <b>${s.counts.errors}</b></span>
      <span>messages <b>${s.counts.messages}</b></span>
      <span>cost <b>${fmtCost(s.cost)}</b></span>
    </div>
    ${kids.length || parentChip ? `<div class="kids">${kids}${parentChip}</div>` : ""}
    ${overview}
    ${hydrationNote}
    <div class="timeline">${chron.map(timelineItemHTML).join("") || '<div class="tl-item"><div class="tl-head"><span class="t" style="color:var(--text-faint)">No activity recorded yet — the timeline fills as the agent works.</span></div></div>'}</div>
  </section>`
}

function renderStage() {
  if (stopped) {
    $stage.innerHTML = `<div class="stopped">
      <div class="ring"></div>
      <h2>Dashboard stopped</h2>
      <p>
        The dashboard server has been shut down and the port freed — the plugin is no longer observing.
        Your OpenCode sessions continue running unaffected.<br><br>
        To bring the dashboard back: restart OpenCode (or run <code>opencode service restart</code> in a terminal),
        then click Reload.
      </p>
      <button class="topbtn big" id="restart-big">↻ Reload</button>
    </div>`
    document.getElementById("restart-big")?.addEventListener("click", () => location.reload())
    return
  }
  const s = selectedID ? sessions.get(selectedID) : null
  if (!s) {
    $stage.innerHTML = `<div class="empty"><div><div class="ring"></div>
      <h2>Waiting for agents…</h2>
      <p>Start or continue a session in OpenCode — it appears in the left rail and becomes the main actor automatically while auto-follow is on.</p></div></div>`
    return
  }
  // preserve in-progress rename text across live re-renders
  let pendingRename
  if (editingID === s.id) {
    const existing = document.getElementById("rename-input")
    if (existing) pendingRename = existing.value
  }
  $stage.innerHTML = stageHTML(s)
  if (editingID === s.id) {
    const input = document.getElementById("rename-input")
    if (input) {
      if (pendingRename !== undefined) input.value = pendingRename
      input.focus()
      const n = input.value.length
      input.setSelectionRange(n, n)
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void commitRename(s.id, input.value)
        if (e.key === "Escape") {
          editingID = null
          renderStage()
        }
      })
      input.addEventListener("blur", () => {
        editingID = null
        renderStage()
      })
    }
  }
  $stage.querySelectorAll("[data-focus]").forEach((el) =>
    el.addEventListener("click", () => select(el.getAttribute("data-focus"), { fromKid: true })),
  )
  $stage.querySelectorAll("[data-rename]").forEach((el) =>
    el.addEventListener("click", () => {
      editingID = s.id
      renderStage()
    }),
  )
  // lazy hydration of history for the selected session
  if (!s.hydrated && !hydrating.has(s.id) && !noHistory.has(s.id)) void hydrate(s.id)
}

async function commitRename(id, title) {
  title = String(title ?? "").trim()
  if (!title || title === (sessions.get(id)?.title ?? "")) {
    editingID = null
    renderStage()
    return
  }
  const s = sessions.get(id)
  if (!s) return
  const old = s.title
  s.title = title // optimistic; the server + event stream confirm
  editingID = null
  renderAll()
  try {
    const res = await fetch(`/api/session/${encodeURIComponent(id)}/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    const out = await res.json()
    if (!out.ok) {
      console.error("rename failed", out.error)
      const cur = sessions.get(id)
      if (cur) {
        cur.title = old
        renderAll()
      }
    }
  } catch (err) {
    console.error("rename failed", err)
    const cur = sessions.get(id)
    if (cur) {
      cur.title = old
      renderAll()
    }
  }
}

function renderTopstats() {
  $topstats.innerHTML = `
    <span class="chip hot"><b>${totals.active}</b> active</span>
    <span class="chip"><b>${totals.sessions}</b> sessions</span>
    <span class="chip"><b>${fmtTokens(totals.tokens)}</b> tok</span>
    <span class="chip"><b>${totals.toolCalls}</b> tools</span>
    <span class="chip ${totals.errors ? "bad" : ""}"><b>${totals.errors}</b> err</span>
    <span class="chip">${fmtCost(totals.cost)}</span>`
}

function renderAll() {
  renderSide()
  renderStage()
  renderTopstats()
}

/* ---------------- selection + hydration ---------------- */
function select(id, opts = {}) {
  const s = sessions.get(id)
  if (!s) return
  const changed = selectedID !== id
  selectedID = id
  if (!opts.fromKid && changed) {
    following = false
    renderFollowChip()
  }
  renderSide()
  renderStage()
  if (!s.hydrated && !noHistory.has(s.id) && !hydrating.has(s.id)) void hydrate(id)
}

async function hydrate(id) {
  hydrating.add(id)
  try {
    const res = await fetch(`/api/session/${encodeURIComponent(id)}/messages`)
    const out = await res.json()
    if (out.ok && out.session) {
      sessions.set(out.session.id, out.session)
      if (out.session.id === selectedID) renderStage()
      renderSide()
    } else {
      noHistory.add(id)
      if (out.session?.id === selectedID) renderStage()
    }
  } catch {
    noHistory.add(id)
  } finally {
    hydrating.delete(id)
  }
}

function applySession(s) {
  const wasActive = sessions.get(s.id)?.status === "active"
  sessions.set(s.id, s)
  // auto-follow: the main stage chases whichever session starts working
  if (following && !stopped && s.status === "active") {
    const cur = selectedID ? sessions.get(selectedID) : null
    if (!cur || cur.status !== "active" || s.lastActiveAt >= cur.lastActiveAt) {
      selectedID = s.id
    }
  }
  renderAll()
  void wasActive
}

/* ---------------- topbar actions ---------------- */
function renderFollowChip() {
  $followChip.textContent = following ? "Following ●" : "Pinned ◌ — follow"
  $followChip.classList.toggle("on", following)
}
$followChip.addEventListener("click", () => {
  following = !following
  if (following) {
    const active = [...sessions.values()].filter((s) => s.status === "active").sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0]
    if (active) selectedID = active.id
  }
  renderFollowChip()
  renderAll()
})

/* Stop = full shutdown: the dashboard server closes, the plugin stops
   observing, the port is freed. OpenCode itself keeps running. */
async function doStop() {
  stopped = true
  renderStage()
  try {
    await fetch("/api/shutdown?full=1", { method: "POST" })
  } catch {
    /* the server tears down right after responding */
  }
  es?.close()
  connected = false
  setLive("offline", "STOPPED")
  $stopBtn.textContent = "↻ Reconnect"
}

$stopBtn.addEventListener("click", () => {
  if (stopped) {
    location.reload() // the server is gone; reloading reconnects once the plugin runs again
  } else {
    void doStop()
  }
})
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    following = true
    renderFollowChip()
  }
})

/* side interactions (delegated — rows re-render constantly) */
$side.addEventListener("click", (e) => {
  const modeBtn = e.target.closest("[data-mode]")
  if (modeBtn) {
    railMode = modeBtn.getAttribute("data-mode")
    localStorage.setItem("dash.railMode", railMode)
    renderSide()
    return
  }
  if (e.target.closest("#clear-finished")) {
    void clearFinished()
    return
  }
  const x = e.target.closest("[data-x]")
  if (x) {
    e.stopPropagation()
    void removeSession(x.getAttribute("data-x"))
    return
  }
  const row = e.target.closest(".row")
  if (row) select(row.getAttribute("data-id"))
})
$side.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.classList?.contains("row")) select(e.target.getAttribute("data-id"))
})
/* the n/total counter doubles as a Live <-> All toggle */
$sideCount.addEventListener("click", () => {
  railMode = railMode === "live" ? "all" : "live"
  localStorage.setItem("dash.railMode", railMode)
  renderSide()
})

async function removeSession(id) {
  try {
    await fetch(`/api/session/${encodeURIComponent(id)}`, { method: "DELETE" })
  } catch {
    /* fall back to local-only removal below */
  }
  sessions.delete(id)
  if (selectedID === id) {
    selectedID = null
    renderStage()
  }
  renderAll()
}

async function clearFinished() {
  const stale = [...sessions.values()].filter(
    (s) => s.status !== "active" && Date.now() - s.lastActiveAt > RECENT_MS,
  )
  await Promise.allSettled(
    stale.map((s) => fetch(`/api/session/${encodeURIComponent(s.id)}`, { method: "DELETE" }).catch(() => null)),
  )
  for (const s of stale) {
    sessions.delete(s.id)
    if (selectedID === s.id) selectedID = null
  }
  renderAll()
}

/* ---------------- live updates ---------------- */
function setLive(state, text) {
  $live.className = "live " + state
  $liveText.textContent = text
}

let esAttempts = 0
function connect() {
  setLive("connecting", esAttempts > 2 ? "RECONNECTING…" : "CONNECTING")
  es = new EventSource("/stream")
  es.onopen = () => {
    connected = true
    esAttempts = 0
    setLive("connected", "LIVE")
  }
  es.onerror = () => {
    connected = false
    esAttempts++
    setLive(esAttempts > 4 ? "offline" : "connecting", esAttempts > 4 ? "OFFLINE — reload to retry" : "RECONNECTING…")
  }
  es.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg.type === "snapshot") {
      sessions.clear()
      for (const s of msg.snapshot.sessions) sessions.set(s.id, s)
      totals = msg.snapshot.totals
      if (following && !selectedID) {
        const first = [...sessions.values()].sort((a, b) => b.lastActiveAt - a.lastActiveAt)[0]
        if (first) selectedID = first.id
      }
      renderAll()
    } else if (msg.type === "session" && msg.session) {
      applySession(msg.session)
    } else if (msg.type === "totals" && msg.totals) {
      totals = msg.totals
      renderTopstats()
    } else if (msg.type === "remove" && msg.id) {
      sessions.delete(msg.id)
      if (selectedID === msg.id) selectedID = null
      renderAll()
    } else if (msg.type === "cleared") {
      sessions.clear()
      selectedID = null
      renderAll()
    } else if (msg.type === "stopped") {
      stopped = true
      $stopBtn.textContent = "↻ Restart"
      renderStage()
    } else if (msg.type === "started") {
      stopped = false
      $stopBtn.textContent = "⏻ Stop"
      selectedID = null
      renderAll()
    }
  }
}

/* safety-net poll when SSE is down */
setInterval(async () => {
  if (connected) return
  try {
    const res = await fetch("/api/state")
    const snap = await res.json()
    sessions.clear()
    for (const s of snap.sessions) sessions.set(s.id, s)
    totals = snap.totals
    renderAll()
  } catch {
    /* server probably restarting */
  }
}, 30_000)

/* live ticking session timer in the stage header */
setInterval(() => {
  document.querySelectorAll("[data-timer]").forEach((el) => {
    const created = Number(el.getAttribute("data-timer"))
    el.textContent = "⏱ " + fmtDur(Date.now() - created)
  })
}, 1000)

let connected = false
let es = null
renderFollowChip()
connect()
