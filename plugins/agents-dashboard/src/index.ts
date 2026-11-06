/**
 * opencode-agents-dashboard — live web dashboard for OpenCode agent sessions.
 *
 * Runs inside the OpenCode server, observes the public event stream plus tool
 * lifecycle hooks, and serves a local web dashboard (vanilla JS) that shows
 * what every agent is doing in real time: state messages, tool calls,
 * subagents, permissions, tokens and errors.
 *
 * Options (via opencode.jsonc `plugins` entry):
 *   port     — dashboard port (default 4590; AGENTS_DASHBOARD_PORT overrides;
 *              auto-increments when busy)
 *   autoOpen — open the browser on start (default true;
 *              AGENTS_DASHBOARD_AUTO_OPEN=false overrides)
 *
 * Revision note: main-actor layout (left rail + stage), lifecycle derivation
 * from time.busy/idle, history hydration, UI stop/restart.
 */
import { Plugin } from "@opencode/plugin"
import { fileURLToPath } from "node:url"
import { DashboardStore } from "./store.ts"
import { attachCollector, type Collector } from "./collector.ts"
import { openBrowser, startBridge, type Bridge } from "./http.ts"

const DEFAULT_PORT = 4590

function envPort(): number | undefined {
  const raw = process.env.AGENTS_DASHBOARD_PORT
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? Math.trunc(n) : undefined
}

function envAutoOpen(): boolean | undefined {
  const raw = String(process.env.AGENTS_DASHBOARD_AUTO_OPEN ?? "").toLowerCase()
  if (raw === "false" || raw === "0" || raw === "no") return false
  if (raw === "true" || raw === "1" || raw === "yes") return true
  return undefined
}

/** Resolve with the promise result, or reject after `ms` with a timeout note. */
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export default Plugin.define({
  id: "agents-dashboard",
  async setup(ctx: any) {
    // V2 host check: OpenCode 1.x uses a different plugin system (singular
    // `plugin` config key, different hook surface), and on 1.x hosts the
    // `plugins` key is ignored entirely. If we ever do get loaded without the
    // V2 surface, say so clearly instead of half-working in the background.
    // The demo script never calls setup(), and the harness's fake host provides
    // both methods, so this guard only trips on genuinely incompatible hosts.
    if (typeof ctx?.event?.subscribe !== "function" || typeof ctx?.tool?.hook !== "function") {
      console.warn(
          "[agents-dashboard] requires OpenCode 2.x (missing ctx.event.subscribe / ctx.tool.hook) — not starting. " +
          "Upgrade OpenCode, or on 1.x add this plugin via the V2 'plugins' config key.",
      )
      return () => {}
    }

    const options = (ctx?.options ?? {}) as Record<string, unknown>
    const port = envPort() ?? (Number.isFinite(Number(options.port)) ? Math.trunc(Number(options.port)) : DEFAULT_PORT)
    const autoOpen = envAutoOpen() ?? (options.autoOpen !== false)

    const store = new DashboardStore()
    let collector: Collector | undefined
    let bridge: Bridge | undefined

    // Control plane exposed to the dashboard UI: stop / restart / history.
    // Closures read `collector` / `bridge` at call time, so they stay correct
    // across stop / restart cycles.
    const api = {
      shutdown: (full: boolean) => {
        try {
          collector?.dispose()
        } catch {
          /* ignore */
        }
        collector = undefined
        if (full) {
          bridge?.close()
          bridge = undefined
        }
        store.broadcast({ type: "stopped" })
        console.log(`[agents-dashboard] stopped from dashboard${full ? " (full exit)" : ""}`)
      },
      restart: async () => {
        try {
          collector?.dispose()
        } catch {
          /* ignore */
        }
        collector = undefined
        store.clear()
        try {
          collector = await attachCollector(ctx, store)
          store.broadcast({ type: "started" })
          console.log("[agents-dashboard] restarted from dashboard")
        } catch (err) {
          console.error("[agents-dashboard] restart failed:", err)
          store.broadcast({ type: "stopped" })
        }
      },
      removeSession: (sessionID: string) => {
        store.removeSession(sessionID)
      },
      renameSession: async (sessionID: string, title: string) => {
        const updateFn = (ctx?.session as any)?.update
        if (typeof updateFn !== "function") throw new Error("session rename unavailable")
        await updateFn.call(ctx.session, { sessionID, title })
        // Apply locally right away; the session.updated event will confirm later.
        store.renameSession(sessionID, title)
        return { session: store.sessionView(sessionID) }
      },
      sessionMessages: async (sessionID: string) => {
        const contextFn = (ctx?.session as any)?.context
        if (typeof contextFn !== "function") throw new Error("session context unavailable")
        const messages = (await contextFn.call(ctx.session, { sessionID })) as unknown[]
        let count = 0
        for (const m of Array.isArray(messages) ? messages : []) {
          try {
            store.applyMessage(m, sessionID, { hydrate: true })
            count++
          } catch {
            /* skip malformed entries */
          }
        }
        store.markHydrated(sessionID)
        return { session: store.sessionView(sessionID), messages: count }
      },
    }

    // Bring the dashboard up first so it is available even if collector
    // registration or the first model call is slow.
    try {
      const publicDir = fileURLToPath(new URL("../public/", import.meta.url))
      bridge = await startBridge({
        store,
        port,
        publicDir,
        api,
        onLog: (line) => console.log(line),
      })
      if (autoOpen) openBrowser(`http://127.0.0.1:${bridge.port}`)
    } catch (err) {
      console.error("[agents-dashboard] failed to start dashboard server:", err)
    }

    // Collector registration must never block or break the host: bounded by a
    // timeout for setup, but continues in the background and takes over as
    // soon as it is ready.
    const attaching = attachCollector(ctx, store)
        .then((c) => {
          collector = c
          return c
        })
        .catch((err) => {
          console.error("[agents-dashboard] collector attach problem:", err)
          return undefined as Collector | undefined
        })
    await withTimeout(attaching, 3_000, "collector attach").catch(() => undefined)

    return () => {
      collector?.dispose()
      bridge?.close()
    }
  },
})
