/**
 * Embedded bridge server: serves the dashboard UI, a JSON state snapshot,
 * and an SSE stream that pushes live store updates to connected browsers.
 * Zero runtime dependencies beyond node builtins (works under Bun and Node).
 */
import { createServer, type Server, type ServerResponse } from "node:http"
import { spawn } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { extname, join } from "node:path"
import { DashboardStore, type Broadcast } from "./store.ts"

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
}

export interface Bridge {
  port: number
  close(): void
}

export interface StartBridgeOptions {
  store: DashboardStore
  port: number
  publicDir: string
  host?: string
  onUrl?: (url: string) => void
  onLog?: (line: string) => void
  /** Host-provided control plane: history hydration + plugin lifecycle. */
  api?: {
    /** Replay a session's recent messages into the store; returns the merged view. */
    sessionMessages?: (sessionID: string) => Promise<{ session?: unknown; messages?: number }>
    /** Stop observing. `full` also closes the bridge server. */
    shutdown?: (full: boolean) => void
    /** Resume observing with a fresh store. */
    restart?: () => void
    /** Drop one session from the dashboard (OpenCode itself is untouched). */
    removeSession?: (sessionID: string) => void
    /** Rename a session in OpenCode; returns the merged view. */
    renameSession?: (sessionID: string, title: string) => Promise<{ session?: unknown }>
  }
}

const SAFE_ID = /^[A-Za-z0-9_.:-]{1,120}$/

export function startBridge(opts: StartBridgeOptions): Promise<Bridge> {
  const { store, publicDir } = opts
  const host = opts.host ?? "127.0.0.1"
  const log = opts.onLog ?? ((l: string) => console.log(l))

  // Assets are read fresh from disk on every request so edits to the UI show
  // up on browser refresh even while a long-lived server keeps running.
  function readAsset(name: string) {
    try {
      const file = join(publicDir, name)
      if (existsSync(file)) return { body: readFileSync(file), type: MIME[extname(name)] ?? "application/octet-stream" }
    } catch {
      /* fallthrough to 404 */
    }
    return undefined
  }

  const clients = new Set<ServerResponse>()

  function sendToClient(res: ServerResponse, b: Broadcast) {
    try {
      res.write(`data: ${JSON.stringify(b)}\n\n`)
    } catch {
      clients.delete(res)
    }
  }

  const server: Server = createServer(async (req, res) => {
    const url = (req.url ?? "/").split("?")[0]
    res.setHeader("Access-Control-Allow-Origin", "*")

    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "POST" && req.method !== "DELETE") {
      res.writeHead(405).end()
      return
    }

    if (url === "/api/state") {
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      res.end(JSON.stringify(store.snapshot()))
      return
    }

    if (url === "/api/shutdown" && req.method === "POST") {
      const full = new URL(req.url ?? "", "http://x").searchParams.get("full") === "1"
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      res.end(JSON.stringify({ ok: true, full }))
      // respond first, then act — a full shutdown tears the connection down.
      setTimeout(() => {
        if (opts.api?.shutdown) {
          try {
            opts.api.shutdown(full)
          } catch {
            /* ignore */
          }
        }
        if (full) {
          // no control plane (demo mode): close the bridge directly
          try {
            for (const r of clients) r.end()
          } catch {
            /* ignore */
          }
          clients.clear()
          try {
            server.close()
          } catch {
            /* ignore */
          }
        }
      }, 60)
      return
    }

    const removeMatch = /^\/api\/session\/([^/]+)$/.exec(url)
    if (removeMatch && req.method === "DELETE") {
      const sessionID = decodeURIComponent(removeMatch[1])
      if (!SAFE_ID.test(sessionID)) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: "bad session id" }))
        return
      }
      try {
        opts.api?.removeSession?.(sessionID)
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: String(err) }))
      }
      return
    }

    const renameMatch = /^\/api\/session\/([^/]+)\/rename$/.exec(url)
    if (renameMatch && req.method === "POST") {
      const sessionID = decodeURIComponent(renameMatch[1])
      if (!SAFE_ID.test(sessionID)) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: "bad session id" }))
        return
      }
      let body = ""
      let tooBig = false
      req.on("data", (c: Buffer) => {
        body += c
        if (body.length > 10_000) {
          tooBig = true
          req.destroy()
        }
      })
      req.on("end", async () => {
        try {
          const title = String((JSON.parse(body || "{}") as { title?: unknown }).title ?? "").trim()
          if (!title || title.length > 120) {
            res.writeHead(400, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ ok: false, error: "title must be 1..120 chars" }))
            return
          }
          if (!opts.api?.renameSession) {
            res.writeHead(501, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ ok: false, error: "rename unavailable" }))
            return
          }
          const out = await opts.api.renameSession(sessionID, title)
          res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
          res.end(JSON.stringify({ ok: true, ...(out ?? {}) }))
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ ok: false, error: String(err) }))
        }
      })
      if (tooBig) return
      return
    }

    if (url === "/api/restart" && req.method === "POST") {
      try {
        await opts.api?.restart?.()
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: String(err) }))
      }
      return
    }

    const messagesMatch = /^\/api\/session\/([^/]+)\/messages$/.exec(url)
    if (messagesMatch && req.method === "GET") {
      const sessionID = decodeURIComponent(messagesMatch[1])
      if (!SAFE_ID.test(sessionID)) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: "bad session id" }))
        return
      }
      if (!opts.api?.sessionMessages) {
        res.writeHead(501, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: "history hydration unavailable" }))
        return
      }
      try {
        const out = await opts.api.sessionMessages(sessionID)
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        res.end(JSON.stringify({ ok: true, ...out }))
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, error: String(err) }))
      }
      return
    }

    if (url === "/stream") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      })
      res.write(`retry: 2000\n\n`)
      // initial snapshot event so the client paints immediately
      res.write(`data: ${JSON.stringify({ type: "snapshot", snapshot: store.snapshot() })}\n\n`)
      clients.add(res)
      const keepAlive = setInterval(() => {
        try {
          res.write(`: ping\n\n`)
        } catch {
          /* cleaned up on close */
        }
      }, 15_000)
      res.on("close", () => {
        clearInterval(keepAlive)
        clients.delete(res)
      })
      return
    }

    if (url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("ok")
      return
    }

    const asset = readAsset(url === "/" ? "index.html" : url.slice(1))
    if (asset) {
      res.writeHead(200, { "Content-Type": asset.type, "Cache-Control": "no-store" })
      res.end(req.method === "HEAD" ? undefined : asset.body)
      return
    }

    res.writeHead(404, { "Content-Type": "text/plain" })
    res.end("not found")
  })

  // Push every store broadcast to all connected browsers.
  store.subscribers.add((b) => {
    for (const res of clients) sendToClient(res, b)
  })

  const basePort = Number.isFinite(opts.port) ? Math.trunc(opts.port) : 4590

  return new Promise((resolve, reject) => {
    let attempt = 0
    const tryListen = () => {
      const port = basePort + attempt
      const onError = (err: NodeJS.ErrnoException) => {
        server.off("error", onError)
        if (err.code === "EADDRINUSE" || err.code === "EACCES") {
          if (attempt < 10) {
            attempt++
            setTimeout(tryListen, 50)
            return
          }
        }
        reject(err)
      }
      server.on("error", onError)
      server.listen(port, host, () => {
        server.off("error", onError)
        const url = `http://${host}:${port}`
        log(`[agents-dashboard] dashboard running at ${url}`)
        opts.onUrl?.(url)
        resolve({
          port,
          close: () => {
            for (const res of clients) {
              try {
                res.end()
              } catch {
                /* ignore */
              }
            }
            clients.clear()
            server.close()
          },
        })
      })
    }
    tryListen()
  })
}

/** Best-effort browser launch across platforms. Never throws. */
export function openBrowser(url: string) {
  try {
    const platform = process.platform
    const child =
      platform === "win32"
        ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" })
        : platform === "darwin"
          ? spawn("open", [url], { detached: true, stdio: "ignore" })
          : spawn("xdg-open", [url], { detached: true, stdio: "ignore" })
    child.unref()
  } catch {
    /* ignore — the URL is printed anyway */
  }
}
