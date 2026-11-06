# OpenCode agent dashboard plugin

**Session ID:** ses_e56addedcffeOqAsG1JiOhxrk4
**Created:** 11/5/2026, 10:28:14 AM
**Updated:** 11/5/2026, 10:35:07 AM

---

## User

I want to create an opencode plugin that displays what the AI agents in one opencode session are doing. It must be a beautiful looking and modern dashboard, with state messages, tool calling notice, subagents display.
- give the option to change the port to display the dashboard frontend
- use the logs in @session-example.json to inspect how opencode is working during the sessions.
- use @dashboardExample.png to get inspired by the look and style of the ai agents dashboard
- use web-sources and web-fetch if you need to understand how to create opencode plugins

propose me a plan and ask questions if required

---

## Assistant

_Thinking:_

The user wants to create an OpenCode plugin that displays a dashboard showing what AI agents are doing in an OpenCode session. Let me analyze the requirements:

1. Beautiful, modern dashboard with:
   - State messages
   - Tool calling notices
   - Subagents display
2. Configurable port for the dashboard frontend
3. Use session-example.json to understand OpenCode session structure
4. Use dashboardExample.png for style inspiration
5. Research OpenCode plugins via web sources

I'm in Plan mode, so I should:
1. First, load the OpenCode skill to understand plugin development
2. Analyze the session-example.json structure (already provided)
3. Look at the dashboard image
4. Research web sources
5. Propose a plan and ask questions

Let me start by loading the OpenCode skill since this is about OpenCode plugins.

The session example shows:
- Sessions have: info (id, projectID, agent, model, cost, tokens, outcome, time, title, location)
- Messages array with types: synthetic, user, assistant, idle, agent-switched, system
- Assistant messages have: content arrays with types: reasoning, text, tool
- Tool calls have: id, name, state (status: completed/error, input, content, metadata), time
- agent field shows "plan" or "build" agents
- agent-switched messages show agent switching
- idle messages show session completion state
- tokens tracking (input, output, reasoning, cache)
- finish reasons: tool-calls, stop, error

The dashboard image shows:
- Dark theme, modern design
- Trading dashboard (BTC/USDT etc.) - it's a "Claude Fable 5.1 Indicator" GitHub repo
- Top bar with logo, star/fork counts, "Open repo" button
- Cards showing multiple assets
- Main chart area with candlesticks
- Right sidebar: "Fable Copilot" panel with Market Scan (checklist), AI Overview, Open Position, Today stats, Auto-execute toggle
- Bottom: Monthly P&L with big numbers
- Orange/red accent colors on dark background
- Live indicator

So the dashboard should have:
- Dark theme with orange accent
- Sidebar showing agent activity (like the Copilot panel)
- Live status indicator
- State messages, tool calls, subagents

Let me first load the OpenCode skill to understand plugin development. Then do web research on OpenCode plugin API.

Key questions I might need to ask:
1. Tech stack for dashboard - React/Vite? Plain HTML? 
2. Single session monitoring or all sessions?
3. Should dashboard auto-open browser?
4. Bundling approach - separate npm package vs built into project?

Let me research first.

I'll start by loading the OpenCode skill to understand the plugin system, then research the plugin API.

**Tool: skill**

**Input:**
```json
{
  "id": "opencode"
}
```

<skill_content name="OpenCode">
# Skill: OpenCode

# OpenCode

Use this guide as the starting point for work involving OpenCode itself. It
covers the core concepts needed to configure and customize OpenCode, extend it
with plugins, and build integrations with the OpenCode SDK, clients, and API.

Full documentation is available at <https://opencode.ai/v2/docs/>. This overview is
only an index of core concepts. Before answering a question about a topic below,
fetch the URL named in that section and use the full page as the source of
truth. Follow links from that page when the question needs more detail. Fetch
<https://opencode.ai/v2/docs/> first when you need to discover the relevant
documentation page.

A machine-readable documentation index is available at
<https://opencode.ai/v2/llms.txt>.

## Version policy

Always answer for OpenCode V2 unless the user explicitly asks about V1,
legacy OpenCode, or migrating from V1.

Use only <https://opencode.ai/v2/docs/> documentation as the source of truth for V2.
Do not use <https://opencode.ai/docs/>, which documents V1, and do not use
general web search to resolve a V2 documentation question when the V2 docs or
linked pages cover it. The schema served from
<https://opencode.ai/config.json> accepts both V2 fields and deprecated V1
fields. Never recommend a field it marks deprecated. If V2 documentation is
missing or contradictory, state the uncertainty or ask for clarification instead of falling back to V1.

V1 documentation and syntax may be consulted only when the user explicitly
asks about V1 or when needed as migration input. Outputs and recommendations
must still use V2 unless the user specifically requests a V1 result.

## [CLI](https://opencode.ai/v2/docs/cli)

For questions about the terminal interface, command-line invocation, `run`,
`mini`, terminal providers, or other CLI behavior, fetch the
[CLI guide](https://opencode.ai/v2/docs/cli) and the relevant page linked from
that section.

CLI and TUI preferences are separate from OpenCode's server and project
configuration. They live in the global `~/.config/opencode/cli.json`, or
`$XDG_CONFIG_HOME/opencode/cli.json` when `XDG_CONFIG_HOME` is set. There is no
project-local CLI configuration. Set `OPENCODE_CLI_CONFIG_CONTENT` to merge
inline JSON over the global settings. Most preferences can also be changed from
the TUI by pressing `Ctrl+P` and selecting **Open settings**.

### [Settings](https://opencode.ai/v2/docs/cli/config)

Fetch the full [CLI settings reference](https://opencode.ai/v2/docs/cli/config)
before editing `cli.json`. It documents every terminal-only setting, accepted
values, and examples, including themes, input, sessions, tabs, diffs, alerts,
Mini, keybindings, terminal plugins, and debugging. Do not put these settings
in `opencode.json(c)`.

### [Keybinds](https://opencode.ai/v2/docs/cli/keybinds)

Configure keybindings under `keybinds` in `cli.json`. The leader key is the
`keybinds.leader` entry; leader timing is configured separately under
`leader.timeout`. Bindings can use a string, an array of strings, or an object
when event behavior such as `preventDefault` is required. Disable a binding
with `"none"` or `false`.

Never guess a command ID, default binding, or accepted key syntax. Fetch the
full [keybind reference](https://opencode.ai/v2/docs/cli/keybinds), which lists
the current IDs and defaults, before answering or editing a binding.

## [OpenCode configuration](https://opencode.ai/v2/docs/config)

OpenCode's server and project configuration uses JSON or JSONC. Include the
published schema so the user's editor can validate fields and provide
autocomplete:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
}
```

Global configuration lives at `~/.config/opencode/opencode.json(c)` and applies
to every project for that user. Project configuration can live in any directory
as `opencode.json(c)` or `.opencode/opencode.json(c)`, including nested packages
in a monorepo.

During ordinary project discovery, OpenCode searches the current Location
directory and every ancestor through the filesystem root, including directories
above the detected project or repository root. It merges direct
`opencode.json(c)` files from the farthest ancestor to the current directory,
then does the same for `.opencode/opencode.json(c)` files. This means every
discovered `.opencode` config overrides every discovered direct config. Global
filesystem configuration has lower precedence than these discovered documents.

Common configuration fields include `model`, `default_agent`, `permissions`,
`agents`, `commands`, `plugins`, `providers`, `mcp`, `skills`, `instructions`,
`references`, `formatter`, and `lsp`.

This configuration is distinct from `cli.json`. Use the
[CLI settings reference](https://opencode.ai/v2/docs/cli/config) for terminal
preferences, especially themes and keybindings.

Config changes apply without a restart. OpenCode watches config files and
reloads agents, commands, skills, MCP servers, and plugins after a save. The TUI
does the same for `cli.json`. To force a full reload, use `/reload`. Don't tell
the user to restart OpenCode after editing config.

Do not guess field names or shapes. Fetch the V2 configuration guide and its
linked topic guide as the source of truth, and preserve unrelated settings when
editing an existing file. Keep the published `$schema` URL in configuration
examples, but do not fetch it to determine the V2 configuration shape.

See the [full configuration guide](https://opencode.ai/v2/docs/config) for
every field, examples, config locations, and links to dedicated feature guides.

## [MCP servers](https://opencode.ai/v2/docs/mcp-servers)

Configure MCP servers under `mcp.servers`. Prefer the CLI because it preserves
unrelated configuration. Use `--global` when the user asks to set up a service
for themselves without limiting it to the current project; omit it when they
explicitly want project-local configuration.

```sh
opencode mcp add <name> --global --url <remote-url>
opencode mcp list
```

Remote servers use OAuth by default. If `mcp list` reports that a server needs
authentication, tell the user to run `/mcps`, select the server, and sign in.
Do not run `opencode mcp auth` through the shell tool: it starts an interactive
flow whose authorization link can be hidden in background process output.
Use the user-facing MCP interface instead.

Report the server as configured but awaiting sign-in until its connection
status confirms it is connected.

OAuth credentials are stored outside the OpenCode configuration. Do not ask for or
store an API key when the server supports OAuth. Use header-based credentials
only when OAuth is unavailable or the user explicitly requires them, and use an
environment substitution such as `{env:MCP_API_KEY}` instead of writing a
secret into configuration.

## [V1 to V2 migration](https://opencode.ai/v2/docs/migrate-v1)

For any request to migrate OpenCode configuration, agents, commands, skills,
plugins, integrations, or other behavior from V1 to V2, read the full
[migration guide](https://opencode.ai/v2/docs/migrate-v1) before acting. In
the repository, its source is `services/www/src/docs/content/migrate-v1.mdx`.

V1 config files and `.opencode/` definitions are intended to remain compatible.
The only intentional breaking changes are the server API and plugin API. Native
V2 config uses more ergonomic shapes, but conversion is optional. When the user
requests conversion, inspect the complete configuration, preserve behavior and
unrelated settings, and apply only the relevant migrations from the guide. For
plugin migrations, fetch and follow both the migration guide and the full
[plugins guide](https://opencode.ai/v2/docs/build/plugins). If non-API V1
functionality fails in V2, use the `report` skill to file it as a compatibility
bug.

## [Plugins](https://opencode.ai/v2/docs/build/plugins)

For questions about creating, configuring, loading, publishing, or migrating
plugins, fetch the full [plugins guide](https://opencode.ai/v2/docs/build/plugins)
before answering. Refer to this guide when the user wants to build a plugin. It
covers hooks, transforms, tools, plugin context capabilities, and package
entrypoints. Plugins can also extend the TUI; for those, fetch the
[CLI plugin guide](https://opencode.ai/v2/docs/build/plugins/cli).
For custom methods and events shared with other plugins or clients, fetch the
[RPC guide](https://opencode.ai/v2/docs/build/plugins/rpc).

## [Service](https://opencode.ai/v2/docs/troubleshooting#check-the-background-service)

OpenCode uses a client-server architecture. Interfaces such as the TUI connect
to a background OpenCode service, which owns sessions, configuration, plugins,
permissions, and tool execution.

OpenCode normally discovers or starts the shared background service
automatically. Restart it only if it is stuck or unhealthy, not to apply
configuration changes:

```sh
opencode service restart
```

Check its status after restarting:

```sh
opencode service status
```

## [API](https://opencode.ai/v2/docs/api)

OpenCode exposes an HTTP API from its server. The API is described by an
OpenAPI document available from the running server at `/openapi.json`.

Use OpenCode's built-in `api` command for local requests. It uses the same
discovery and authentication flow as the TUI and may start the background
service when no compatible healthy service is available. It accepts either an
HTTP method and path or an OpenAPI operation ID.

Call an endpoint with an HTTP method and path:

```sh
opencode api get /api/info
```

Pass a request body with `--data` or `-d`, and additional headers with
`--header` or `-H`:

```sh
opencode api post /api/example --data '{"key":"value"}'
opencode api get /api/example --header 'X-Example:value'
```

Request bodies default to `Content-Type: application/json`. When OpenCode is
connected to an explicit server instead of its managed background service, use
the same configured server and authentication context rather than constructing
an unauthenticated request separately.

See the [full API reference](https://opencode.ai/v2/docs/api) for available
endpoints, parameters, request bodies, and response schemas. The
raw [OpenAPI specification](https://opencode.ai/v2/openapi.json) is also
available for code generation and other tooling.

## [Client](https://opencode.ai/v2/docs/build/client)

For questions about connecting an application to OpenCode over the network,
fetch the full [client guide](https://opencode.ai/v2/docs/build/client) before
answering.

`@opencode/client` is the generated TypeScript client for the OpenCode HTTP
API. Its methods and types come from the same contract as the API reference.
The default entrypoint exposes Promise-based resource clients and async
iterables for streaming endpoints. The `@opencode/client/effect` entrypoint
exposes typed Effects, Streams, and decoded OpenCode schema values. Its
`Service` API can discover, start, stop, and authenticate with the local
background service from a Node application.

## [SDK](https://opencode.ai/v2/docs/build/sdk)

For questions about embedding OpenCode directly in an application, fetch the
full [SDK guide](https://opencode.ai/v2/docs/build/sdk) before answering. The SDK
hosts OpenCode in the application without opening an HTTP listener.

Use the [Effect SDK guide](https://opencode.ai/v2/docs/build/sdk/effect) for
Effect applications. For Cloudflare Durable Objects, use the
[Cloudflare SDK guide](https://opencode.ai/v2/docs/build/sdk/cloudflare).

## [Troubleshooting](https://opencode.ai/v2/docs/troubleshooting)

OpenCode runs a client and a background server. Start by determining whether a
problem belongs to the client, the shared server, or one project.

- Check the service with `opencode service status` and verify the API with
  `opencode api get /api/info`.
- Compare with `opencode --standalone`, which runs the TUI with a private
  server, to isolate shared-service issues.
- Inspect `~/.local/share/opencode/log/opencode.log`. Filter `role=cli` for
  client startup and `role=server` for sessions, providers, plugins,
  permissions, and tools.
- Run one reproduction with `OPENCODE_LOG_LEVEL=DEBUG` when normal logs are not
  sufficient.
- Do not delete or edit the database, service registration, or service config
  while diagnosing a problem. Back up persistent data before inspecting it
  with external tools.
- Redact API keys, authorization headers, prompts, file contents, and other
  sensitive data before sharing diagnostics.

See the [full troubleshooting guide](https://opencode.ai/v2/docs/troubleshooting)
for service lifecycle commands, API inspection, log locations, explicit server
connections, issue-reporting details, and local development paths.

Base directory for this skill: /builtin
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
</skill_files>
</skill_content>

---

## Assistant

_Thinking:_

Now let me fetch the plugins guide to understand how to build OpenCode plugins.

Let me fetch the full plugins guide to understand the plugin API.

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://opencode.ai/v2/docs/build/plugins"
}
```

StatusCode: non 2xx status code (403 GET https://opencode.ai/v2/docs/build/plugins?_sm_nck=1)

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://opencode.ai/v2/llms.txt"
}
```

StatusCode: non 2xx status code (403 GET https://opencode.ai/v2/llms.txt?_sm_nck=1)

---

## Assistant

_Thinking:_

Direct fetch got 403. Let me try websearch to find plugin documentation, and also try fetching with different approaches.

Direct fetches were blocked (403). Let me search for the plugin documentation instead.

**Tool: websearch**

**Input:**
```json
{
  "query": "opencode.ai v2 docs build plugins hooks events documentation"
}
```

## [Server](https://opencode.ai/v2/docs/build/plugins/server)

Set result to supply the title yourself.
await ctx.session.hook("context", (event) => {
  event.system.push({ type: "text", text: "Keep the review focused on correctness." })
  delete event.tools.write
  event.options.temperature = 0.2
  event.options.maxTokens = 8_000
})

await ctx.session.hook("compaction", async (event) => {
  event.result = { summary: await summarize(event

...

For example, OpenAI Responses uses reasoningEffort:
await ctx.session.hook(
  "context",
  (event) => {
    event.options.reasoningEffort = "high"
  },
  { providerID: "openai" },
)

...

Modify model request settings and optionally scope the hook to one provider. The event carries the same kind as the HTTP hooks below.
await ctx.session.hook(
  "model.request",
  (event) => {
    event.headers["x-plugin"] = "review"
  },
  { providerID: "anthropic" },

...

Use it instead of the agent ID to tell auxiliary requests apart.
await ctx.session.hook("http.request", (event) => {
  event.request.headers.set("x-session-id", event.sessionID)
  if (event.kind === "title") event.request.headers.set("x-priority", "background")
})

await ctx.session.hook("http.response", (event) => {
  event.response = new Response(event.response.body, {
    status: event.response.status,
    headers: { ...Object.fromEntries(event.response.headers), "x-plugin": "review" },
  })
})

...

event.frame = JSON.stringify(body)
  },
  { providerID: "openai" },
)

await ctx.session.hook("experimental.ws.receive", (event) => {
  if (event.frame.includes('"type":"error"')) console.error(event.frame)
})
These hooks are experimental and their names or shapes may change.

Retry policy

...

await ctx.shell.hook("create.before", (event) => {
  event.timeout = Math.min(event.timeout, 60_000)
  event.env.COMPANY_ENV = "development"
})

Reference

interface ShellHookContext {
  hook(name: "create.before", callback: (event: ShellCreateBefore) => Promise<void> | void): Promise<Registration>
}

...

await ctx.tool.hook("execute.before", (event) => {
  if (event.tool === "read") console.log(event.input)
})
Inspect successful results or failures after execution.
await ctx.tool.hook("execute.after", (event) => {
  if (event.status === "completed") event.result = { ...event.result, metadata: { observed: true } }
  if (event.status === "error") console.error(event.error.message)
})

Reference

interface ToolHooks {
  "execute.before": ToolExecuteBefore

## [Plugins - OpenCode](https://opencode.ai/v2/docs/build/plugins)

export default Plugin.define({
  id: "example",
  async setup(ctx) {
    await ctx.storage.set("loaded", true)
  },
})
Migrating an existing OpenCode 1 plugin? Follow the V1 plugin migration guide.

Parts

Each part is an export of the package. Every part's SDK comes from the one @opencode/plugin dependency.
{
  "name": "opencode-acme-plugin",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tui": "./src/tui.tsx",
    "./gui-experimental": "./dist/gui-experimental.cjs",
    "./rpc": "./src/rpc.ts"
  },
  "files": ["src", "dist"],
  "dependencies": {
    "@opencode/plugin": "latest"
  }
}
* Server (. or ./server) runs in the OpenCode server with @opencode/plugin. It adds tools, hooks, integrations, commands, and agents. See Server, or Effect plugins for the Effect API.
* TUI (./tui) runs in the terminal UI with @opencode/plugin/tui. See TUI.
* GUI (./gui-experimental) runs its setup in every OpenCode Desktop window and its main in the desktop app's main process, with @opencode/plugin/gui. See GUI.
* RPC (./rpc) is a typed contract that the server part implements and the other parts and clients call. See RPC.

...

To load published packages or plugin directories from other locations, add them to plugins in opencode.json(c):
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-acme-plugin",
    "opencode-acme-plugin@1.2.0",
    "@acme/opencode-plugin",
    "./plugins/local",
    "../shared/plugin",
    "/absolute/path/plugin",
    "file:///home/me/plugins/local",
    {
      "package": "@acme/opencode-plugin",
      "options": {
        "agent": "reviewer",

...

Its parts use the same default exports as a local plugin.
npm publish
* Export ./rpc when other plugins and clients should import your RPC contract without loading your implementation.
* Build the GUI bundle before you publish, and include it through files. See Build the bundle.
* Use versions compatible with the OpenCode release you target, and test the installed package, not only a workspace-linked copy. Publish a compatible plugin update when you adopt a newer API contract.
Add tools, hooks, integrations, commands, and agents in the OpenCode server.
Add commands, routes, slots, and Markdown renderers to the terminal UI.
Add panels, commands, settings pages, and native integrations to OpenCode Desktop.
Expose typed methods and events from the server part to the other parts and to clients.

## [Plugins - OpenCode](http://dev.opencode.ai/v2/docs/build/plugins)

* ctx.integration | list , get , connect , attempt , transform , reload , and connection lookup/resolution
* ctx.plugin | list currently active plugin IDs
* ctx.reference | list , transform , reload
* ctx.session | create , get , prompt , command , synthetic , interrupt , and hook
* ctx.skill | list , transform , reload
* ctx.tool | transform and hook
* ctx.aisdk | hook
* ctx.event | subscribe to the current public server event stream
* ctx.options | Readonly options from the matching config object

Transform hooks

Transform hooks let a plugin modify how OpenCode is configured. Use them to add or remove definitions, override settings, choose defaults, and provide tools or other sources.
* Transform | Draft operations
* agent.transform | list , get , default , update , remove

...

Each plugin’s logic remains composed with the others, so a later plugin can still modify models added by an earlier one. The catalog updates without restarting OpenCode.

Runtime hooks

Runtime hooks intercept live operations. Their event objects expose specific mutable fields:
* Hook | Mutable fields
* ctx.aisdk.hook("sdk", callback) | sdk , after inspecting model , package , and options
* ctx.aisdk.hook("language", callback) | language , after inspecting model , sdk , and options
* ctx.session.hook("request", callback) | system , messages , and the tools record immediately before model dispatch
* ctx.tool.hook("execute.before", callback) | input , before the selected tool executes
* ctx.tool.hook("execute.after", callback) | Terminal content , metadata , and outputPaths ; error on failure

...

elected model requests and normalize another tool’s input:
import  { Plugin }  from  "@op

...

hook ( "request" , ( event )  =>  {       delete  event.tools.write     })     await  ctx.tool. hook ( "execute.before" , ( event )  =>  {       if  (event.tool  !==  "lookup"  ||  typeof  event.input  !==  "object"  ||  event.input  ===  null )  return       event.input  =  {  ... event.input, source:  "plugin"  }     })   }, })
A hook failure fails the operation it intercepts. Keep runtime hooks fast and handle expected errors inside the callback.

Examples

Add a tool

Create an executable tool with Tool.make , then register it with a name and registration options. Define its input with JSON Schema and use an async executor:
import  { Plugin }  from  "@opencode-ai/plugin/v2" import  { Tool }  from  "@opencode-ai/plugin/v2/tool" export  default  Plugin.

## [Plugins | OpenCode](https://opencode.ai:2083/docs/plugins)

OpenCode
app.header.home app.header.docs
 
Search
New OpenCode v2 is now available →
GitHub Discord

...

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Todo Events

* todo.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

...

tree }) => { return { event : async ({ event }) => { // Send notification on session completion if (event.type === "session.idle" ) { await $ `osascript -e 'display notification "Session completed!"

...

.opencode/plugins/my-plugin.ts
export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject

...

Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](http://opencode.ai/docs/plugins)

Select theme Dark Light Auto Select language English العربية Bosanski Dansk Deutsch Español Français Italiano 日本語 한국어 Norsk Bokmål Polski Português (Brasil) Русский ไทย Türkçe 简体中文 繁體中文

Plugins

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append

...

export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject additional context into the compaction prompt output.context. push ( ` ## Custom Context Include any state that should persist across compaction: - Current task status - Important decisions made - Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins](https://opencode.ai/v2/docs/plugins/)

Plugins

Add published packages, versioned packages, scoped packages, or local plugin directories to opencode.json(c).

Configure

{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-acme-plugin",
    "opencode-acme-plugin@1.2.0",
    "@acme/opencode-plugin",
    "./plugins/local",
    "../shared/plugin",
    "/absolute/path/plugin",
    "file:///home/me/plugins/local",
    {
      "package": "@acme/opencode-plugin",
      "options": {
        "agent": "reviewer",
        "strict": true,
      },
    },
  ],
}

...

Global plugins use the same discovery layout under the OpenCode config directory.
~/.config/opencode/plugins/

...

"plugins": ["./plugins/local"]
}

Control

Plugin entries are processed in order. Prefix an ID or wildcard with - to disable it, use * for every plugin, and use .* to match an ID prefix. A later ID re-enables a plugin.
{
  "plugins": ["*", "-opencode.provider.*", "opencode.provider.openai", "-acme.reviewer"]
}

...

organization policy.

Manage

Install, list, check, update, or remove global package plugins with the CLI.
opencode plugin add opencode-acme-plugin@1.2.0
opencode plugin list
opencode plugin list --builtin
opencode plugin check
opencode plugin update
opencode plugin update opencode-acme-plugin
opencode plugin remove opencode-acme-plugin@1.2.0
plugin check checks server, GUI-only, and TUI-only package plugins for updates. plugin update updates every outdated package; pass a configured package target to check or update only that package. Local plugins and exact package revisions are skipped.

...

The app loads plugins from the server it runs, so configure the plugin in your global opencode.json(c) to use it in every window.
{
  "plugins": ["opencode-acme-plugin"],
}
Settings > Extensions > Plugins lists them when the app's own server is selected. A plugin's switch turns off only its desktop UI, and Reload loads it again after a failure. To turn off the whole plugin, add - and its ID to plugins, for example "-acme".

Terminal

TUI-only plugins are configured separately and remain active when connected to a remote server.
{
  "plugins": ["opencode-acme-cli"]
}
Create plugins that add tools, hooks, integrations, commands, agents, and other behavior.

## [Plugins | OpenCode](https://opencode.ai/docs/en/plugins)

Select theme Dark Light Auto Select language English العربية Bosanski Dansk Deutsch Español Français Italiano 日本語 한국어 Norsk Bokmål Polski Português (Brasil) Русский ไทย Türkçe 简体中文 繁體中文

Plugins

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append

...

export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject additional context into the compaction prompt output.context. push ( ` ## Custom Context Include any state that should persist across compaction: - Current task status - Important decisions made - Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](https://opencode.ai:2096/docs/plugins)

Select theme Dark Light Auto Select language English العربية Bosanski Dansk Deutsch Español Français Italiano 日本語 한국어 Norsk Bokmål Polski Português (Brasil) Русский ไทย Türkçe 简体中文 繁體中文

Plugins

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append

...

export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject additional context into the compaction prompt output.context. push ( ` ## Custom Context Include any state that should persist across compaction: - Current task status - Important decisions made - Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](http://opencode.ai:2082/docs/plugins)

Select theme Dark Light Auto Select language English العربية Bosanski Dansk Deutsch Español Français Italiano 日本語 한국어 Norsk Bokmål Polski Português (Brasil) Русский ไทย Türkçe 简体中文 繁體中文

Plugins

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append

...

export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject additional context into the compaction prompt output.context. push ( ` ## Custom Context Include any state that should persist across compaction: - Current task status - Important decisions made - Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](http://opencode.ai:2095/docs/plugins)

Select theme Dark Light Auto Select language English العربية Bosanski Dansk Deutsch Español Français Italiano 日本語 한국어 Norsk Bokmål Polski Português (Brasil) Русский ไทย Türkçe 简体中文 繁體中文

Plugins

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

For TypeScript plugins, you can import types from the plugin package:
my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed
* message.updated

Permission Events

* permission.asked
* permission.replied

Server Events

* server.connected

Session Events

* session.created
* session.compacted
* session.deleted
* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append

...

export const MyPlugin = async ({ client }) => { await client.app. log ({ body: { service: "my-plugin" , level: "info" , message: "Plugin initialized" , extra: { foo: "bar" }, }, }) }
Levels: debug , info , warn , error . See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts
import type { Plugin } from "@opencode-ai/plugin" export const CompactionPlugin : Plugin = async ( ctx ) => { return { "experimental.session.compacting" : async ( input , output ) => { // Inject additional context into the compaction prompt output.context. push ( ` ## Custom Context Include any state that should persist across compaction: - Current task status - Important decisions made - Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

**Tool: websearch**

**Input:**
```json
{
  "query": "opencode plugin \"tool.execute.before\" OR \"tool.execute.after\" hook example"
}
```

## [opencode hooks: tool.execute.before plugins | getagenttools](https://getagenttools.com/blog/opencode-hooks)
Published: 2026-11-01T00:00:00.000Z

In plugin files under .opencode/plugins/ or ~/.config/opencode/plugins/ , or in npm packages listed under plugin in opencode.json .
* How a hook says no. It throws an error.

...

In the 1.x source nothing calls it. opencode v2 replaces it with a permission evaluate hook.
* How I know. I do not use opencode. I read the docs and the v1.19.4 source on 25 October 2026. The example above is mine and untested.
How the Claude Code event works is in my PreToolUse post.

Does opencode have hooks like Claude Code?

Same hook points, different mechanism. In Claude Code a hook is a command in a settings file. It reads JSON on stdin. Exit code 2 blocks the call. In opencode a hook is a function inside a plugin. It gets two objects, input and output . It blocks by throwing.
The plugins page lists the events. Under "Tool Events" there are two, tool.execute.before and tool.execute.after .
* Claude Code | opencode 1.x | opencode v2

...

* "ask" sends the call to a prompt | No working hook for this | ctx.permission.hook("evaluate", ...) sets effect
The v2 column comes from the V1 migration guide . npm still ships 1.x as latest , 1.19.4 on 25 October. The guide's v2 example looks like this:
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "company.guard",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {

...

})

How do I write an opencode hooks plugin?

Put a .ts or .js file in .opencode/plugins/ for one project. Use ~/.config/opencode/plugins/ for all projects.

...

loader. Every export of a plugin file counts as a plugin. An exported constant makes it throw "Plugin export is not a function" ( plugin/index.ts, line 107 ). An exported helper function gets called as a plugin. Keep helpers unexported.

How do I block a command with tool.execute.before?

Check input.tool and the arguments, then throw. This is the docs example, trimmed:
export const EnvProtection = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        throw new Error("Do not read .env files")
      }
    },
  }
}
For shell commands the tool ID is bash . A comment in the source says it stays "for compatibility with existing plugins, users, and saved permissions. Rename with opencode 2.0" ( tool/shell/id.ts, line 14 ).

## [Plugins - OpenCode](https://dev.opencode.ai/v2/docs/build/plugins/)

import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "example",
  async setup(ctx) {
    await ctx.storage.set("loaded", true)
  },
})
Plugins under .opencode/plugins/ are loaded automatically, like the local example above. To load published packages or plugin directories from other locations, add them to plugins in

...

export default Plugin.define({
  id: "example",
  setup(ctx) {
    console.log(`loaded in OpenCode ${ctx.app.version}`)
    return () => console.log("unloaded")
  },
})

Context

...

Register a local worktree strategy using the normal plugin lifecycle. The implementation module in this example owns option validation and the backend's create, remove, and list operations.

...

OpenCodeEvent>
}

Hooks

Hooks intercept live operations. Register a hook on its domain and dispose the returned registration when it is no longer needed.

...

Provider options use the selected protocol's semantic option names, not raw HTTP body fields. Scope provider-specific settings to the matching provider. For example, OpenAI Responses uses reasoningEffort:
await ctx.session.hook(
  "context",
  (event) => {
    event.options.reasoningEffort = "high"
  },
  { providerID: "openai" },
)
Generation options depend on the selected protocol and model:
* maxTokens is the semantic output-token limit.
* Gemini supports topK; OpenAI Responses does not expose it.

Model request

Modify model request settings and optionally scope the hook to one provider. The event carries the same kind as the HTTP hooks below.
await ctx.session.hook(
  "model.request",
  (event) => {
    event.headers["x-plugin"] = "review"
  },
  { providerID:

...

rt V1

A plugin can support V1 and V2 from the same package entrypoint. Default export one object with a V1 server() function and a V2 setup() function:
import { Plugin } from "@opencode/plugin"

export default {
  ...Plugin.define({
    id: "example",
    async setup(ctx) {
      await ctx.tool.hook("execute.before", () => {
        console.log("A tool is about to run")
      })
    },
  }),
  async server() {
    return {
      "tool.execute.before": async () => {
        console.log("A tool is about to run")
      },
    }
  },
}
* V1 calls server() and uses the returned hooks.

...

* Keep each implementation on its own API; sharing an export does not translate V1 hooks into V2 hooks.

## [opencode/packages/core/src/tool.ts at v2 · anomalyco/opencode · GitHub](https://github.com/anomalyco/opencode/blob/v2/packages/core/src/tool.ts)

export type { Context, Metadata, Namespace, Options, Result } from "@opencode/schema/tool"

import { ToolDefinition, type ToolCall } from "@opencode/ai"
import { Tool } from "@opencode/schema/tool"
import { Context, Effect, Layer, Result, Schema, SchemaIssue, Types } from "effect"
import { makeLocationNode } from "@opencode/util/effect/app-node"
import type { Agent } from "./agent.js"

...

import { PluginHooks } from "./plugin/hooks.js"
import { SessionMessage } from "./session/message.js"
import { SessionSchema } from "./session/schema.js"
import { State } from "./state.js"
import { definition, effectiveName, execute, normalizedName, normalizeContent } from "./tool/runtime.js"
import { Wildcard } from "./util/wildcard.js"

export class RegistrationError extends Schema.TaggedError<RegistrationError>()("Tool.RegistrationError", {
  name: Schema.String,
  message: Schema.String,
}) {}

export interface Editor {

...

```ts
  readonly snapshot: (permissions?: Permission.Ruleset) => Effect.Effect<Snapshot>
}

/** A local execution result after hooks and content normalization. */
```

...

    readonly call: ToolCall
    readonly progress?: (update: Tool.Metadata) => Effect.Effect<void>
    /** Surviving request definitions, keyed by the names advertised after session context hooks. */

...

  Effect.gen(function* () {
    const hooks = yield* PluginHooks.Service
    const image = yield* Image.Service

    type NormalizedItem = Tool.Content | "decode" | "size"

...

```ts
      hooks.trigger("tool", "execute.before", {
        tool: name,
        sessionID: context.sessionID,
        agent: context.agent,
        messageID: context.messageID,
        id: context.id,
```

...

```ts
        yield* hooks.trigger("tool", "execute.after", afterEvent)
        return yield* afterEvent.error
      }
      const afterEvent: PluginHooks.Domains["tool"]["execute.after"] = {
```

...

```ts
          content: execution.value.content,
          ...(execution.value.metadata === undefined ? {} : { metadata: execution.value.metadata }),
        },
      }
      yield* hooks.trigger("tool", "execute.after", afterEvent)
      const afterContent = yield* normalizeImages(normalizeContent(afterEvent.result.content, afterEvent.result.output))
      return {
```

...

              const requested = input.definitions?.get(event.tool)
              // Preserve session context removal and alias resolution, now after the repair hook.

## [Plugins | OpenCode](https://opencode.ai:2083/docs/plugins)

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

There are two ways to load plugins.

From local files

Place JavaScript or TypeScript files in the plugin directory.
* .opencode/plugins/ - Project-level plugins

...

Plugins are loaded from all sources and all hooks run in sequence. The load order is:
1. Global config ( ~/.config/opencode/opencode.json )
2. Project config ( opencode.json )
3.

...

Each function receives a context object and returns a hooks object.

Dependencies

Local plugins and custom tools can use external npm packages.

...

import { escape } from "shescape" export const MyPlugin = async ( ctx ) => { return { "tool.execute.before" : async ( input , output ) => { if (input.tool === "bash" ) { output.args.command = escape (output.args.command) } }, } }

Basic structure

.opencode/plugins/example.js
export const MyPlugin = async ({ project , client , $ , directory , worktree }) => { console. log ( "Plugin initialized!" ) return { // Hook implementations go here } }
The plugin function receives:
* project : The current project information.
* directory : The current working directory.

...

pencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.updated

Installation Events

* installation.updated

LSP Events

* lsp.client.diagnostics
* lsp.updated

Message Events

* message.part.removed
* message.part.updated
* message.removed

...

TUI Events

* tui.prompt.append
* tui.command.execute
* tui.toast.show

Examples

Here are some examples of plugins you can use to extend opencode.

Send notifications

Send notifications when certain events occur:
.opencode/plugins/notification.js
export const NotificationPlugin = async ({ project , client , $ , directory , work

...

Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](https://opencode.ai:2096/docs/plugins)

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

Plugins are loaded from all sources and all hooks run in sequence. The load order is:
1. Global config ( ~/.config/opencode/opencode.json )
2. Project config ( opencode.json )
3.

...

Each function receives a context object and returns a hooks object.

Dependencies

Local plugins and custom tools can use external npm packages.

...

import { escape } from "shescape" export const MyPlugin = async ( ctx ) => { return { "tool.execute.before" : async ( input , output ) => { if (input.tool === "bash" ) { output.args.command = escape (output.args.command) } }, } }

Basic structure

.opencode/plugins/example.js
export const MyPlugin = async ({ project , client , $ , directory , worktree }) => { console. log ( "Plugin initialized!" ) return { // Hook implementations go here } }
The plugin function receives:
* project : The current project information.
* directory : The current working directory.

...

pencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.

...

* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append
* tui.command.execute
* tui.toast.show

Examples

Here are some examples of plugins you can use to extend opencode.

Send notifications

Send notifications when certain events occur:
.opencode/plugins/notification.js
export const NotificationPlugin = async ({ project , client , $ , directory , worktree }) => { return { event

...

See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts

...

Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [Plugins | OpenCode](http://opencode.ai:2082/docs/plugins)

Write your own plugins to extend OpenCode.
Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.
For examples, check out the plugins created by the community.

Use a plugin

...

Plugins are loaded from all sources and all hooks run in sequence. The load order is:
1. Global config ( ~/.config/opencode/opencode.json )
2. Project config ( opencode.json )
3.

...

Each function receives a context object and returns a hooks object.

Dependencies

Local plugins and custom tools can use external npm packages.

...

import { escape } from "shescape" export const MyPlugin = async ( ctx ) => { return { "tool.execute.before" : async ( input , output ) => { if (input.tool === "bash" ) { output.args.command = escape (output.args.command) } }, } }

Basic structure

.opencode/plugins/example.js
export const MyPlugin = async ({ project , client , $ , directory , worktree }) => { console. log ( "Plugin initialized!" ) return { // Hook implementations go here } }
The plugin function receives:
* project : The current project information.
* directory : The current working directory.

...

pencode-ai/plugin" export const MyPlugin : Plugin = async ({ project , client , $ , directory , worktree }) => { return { // Type-safe hook implementations } }

Events

Plugins can subscribe to events as seen below in the Examples section. Here is a list of the different events available.

Command Events

* command.executed

File Events

* file.edited
* file.watcher.

...

* session.diff
* session.error
* session.idle
* session.status
* session.updated

Shell Events

* shell.env

Tool Events

* tool.execute.after
* tool.execute.before

TUI Events

* tui.prompt.append
* tui.command.execute
* tui.toast.show

Examples

Here are some examples of plugins you can use to extend opencode.

Send notifications

Send notifications when certain events occur:
.opencode/plugins/notification.js
export const NotificationPlugin = async ({ project , client , $ , directory , worktree }) => { return { event

...

See SDK documentation for details.

Compaction hooks

Customize the context included when a session is compacted:
.opencode/plugins/compaction.ts

...

Files being actively worked on ` ) }, } }
The experimental.session.compacting hook fires before the LLM generates a continuation summary.

## [creating-opencode-plugins - AI Agent skill](https://eliteai.tools/agent-skills/creating-opencode-plugins-4)

n

Complete Example: Environment File Protection

javascript Copy
// .opencode/plugin/env-protection.js

export const EnvProtectionPlugin = async ({ project, client }) => {

...

};
          }
          break;
        }
      }
    }
  };
};

Example: Command Execution Notifications

javascript Copy
// .opencode/plugin/notify.js

export const NotifyPlugin = async ({ project, $ }) => {
  let commandStartTime = null;

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'command.executed': {

...

await $`osascript -e 'display notification "Completed in ${duration}ms" with title "${tool}"'`;
          }

          console.log(`✅ ${tool} completed in ${duration}ms`);
          break;
        }
      }
    }
  };
};

Example: Custom Tool Registration

javascript Copy
// .opencode/plugin/custom-tools.js

export const CustomToolsPlugin = async ({ client }) => {
  // Register custom tool on initialization
  await client.registerTool({

...

Quality : Auto-format files on save (file.edited hook runs prettier)
Monitoring : Track tool usage patterns (tool.execute hooks log analytics)

Claude Code Event Mapping

When porting Claude Code hook behavior to OpenCode plugins, use these event mappings:
* Claude Hook | OpenCode Event | Description

...

| Run before tool execution, can block
* PostToolUse | tool.execute.after | Run after tool execution
* UserPromptSubmit | message.* events | Process user prompts
* SessionEnd | session.idle | Session completion

Example: Claude-like Hook Behavior

javascript Copy
export const CompatiblePlugin = async (context) => {
  return {
    // Equivalent to Claude's PreToolUse hook
    'tool.execute.before': async (input, output) => {
      if (shouldBlock(input)) {
        throw new Error('Blocked by policy');
      }
    },

    // Equivalent to Claude's PostToolUse hook
    'tool.execute.after': async (result) => {
      console.log(`Tool completed: ${result.tool}`);
    },

    // Equivalent to Claude's SessionEnd hook

...

omposedPlugin = compose([
  envProtectionPlugin,
  notifyPlugin,
  customToolsPlugin
]);
// Runs all hooks in sequence

Non-Convertibility Note

Important : OpenCode plugins cannot be directly converted from Claude Code hooks due to fundamental differences:
* Event models differ : Claude has 4 hook events, OpenCode has 32+

## [Migrate plugins from V1](https://opencode.ai/v2/docs/build/plugins/migrate-v1/)

A V2 plugin default-exports a definition with an id and setup(ctx); setup registers hooks, transforms, tools, and subscriptions through the context.
V1 plugin implementations do not run in V2. Moving a file or renaming its config entry is not enough.

Migrate plugin configuration

Rename plugin to plugins. Replace a package-and-options tuple with an object:
// V1
{
  "plugin": [
    "opencode-example-plugin",
    ["./plugin/local.ts", { "enabled": true }]
  ]
}

// V2
{
  "plugins": [
    "opencode-example-plugin",
    {
      "package": "./plugin/local",
      "options": { "enabled": true }
    }
  ]
}
V2 discovers local plugins from both .opencode/plugin/ and .opencode/plugins/; use .opencode/plugins/ for V2 files. Configured local paths must name directories. For the example above, move the por

...

Local plugins and package plugins use the same implementation API.

Replace the entrypoint

Change the package import, replace the exported plugin function with Plugin.define, and move initialization into setup.
import type { Plugin } from "@opencode-ai/plugin"

export const ExamplePlugin: Plugin = async ({ directory, project, client }) => {
  await client.app.log({
    body: { service: "example", level: "info", message: `Loaded for ${project.id}` },
  })

  return {
    // V1 tools and hooks
  }
}
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "example",
  async setup(ctx) {
    await ctx.storage.set("last-project", ctx.location.project.id)
    console.log(`Loaded for ${ctx.location.directory}`)
  },
})
Every V2 plugin needs a stable id. Plugin storage is scoped by this ID, an

...

await ctx.storage.set("settings", { strict })
const settings = await ctx.storage.get("settings")

Support V1 and V2 from one package

A package can temporarily expose both implementations from one default export. V1 calls server() and V2 calls setup(). The APIs remain separate; this shape does not translate hooks automatically.
import { Plugin } from "@opencode/plugin"

export default {
  ...Plugin.define({
    id: "example",
    async setup(ctx) {
      await ctx.tool.hook("execute.before", () => {
        console.log("A tool is about to run")
      })
    },
  }),
  async server() {
    return {
      "tool.execute.before": async () => {
        console.log("A tool is about to run")
      },
    }
  },
}
V1 object entrypoints are supported in OpenCode 1.18.29 and newer.

## [Plugins - OpenCode](https://v2.opencode.ai/build/plugins)

User plugins are activated in configured order between OpenCode's internal plugin phases. Hooks run sequentially in registration order, and later hooks observe earlier mutations.

...

Install dependencies in a package.json visible from the plugin file, for example:
cd .opencode
bun add @opencode-ai/plugin@next
Match the plugin package version to the OpenCode release you target.

...

ctx.tool | transform and hook
* ctx.aisdk | hook
* ctx.event | subscribe to the current public server event stream
* ctx.options | Readonly options from the matching config object

Transform hooks

Transform hooks let a plugin modify how OpenCode is configured. Use them to add or remove definitions, override settings, choose defaults, and provide tools or other sources.

...

* skill.transform | source, list
* tool.transform | add
Here's an example that keeps models synced from a remote source:
import { Plugin } from "@opencode-ai/plugin/v2"

...

The catalog updates without restarting OpenCode.

Runtime hooks

Runtime hooks intercept live operations. Their event objects expose specific mutable fields:
* Hook | Mutable fields
* ctx.aisdk.hook("sdk", callback) | sdk, after inspecting model, package, and options
* ctx.aisdk.hook("language", callback) | language, after inspecting model, sdk, and options
* ctx.session.hook("request", callback) | system, messages, and the tools record immediately before model dispatch
* ctx.tool.hook("execute.before", callback) | input, before the selected tool executes
* ctx.tool.hook("execute.after", callback) | result, output, and outputPaths, after execution settles
For example, remove a tool from selected model requests and normalize another tool's input:
import { Plugin } from "@opencode-ai/plugin/v2"

export default Plugin.define({
  id: "acme.guards",
  setup: async (ctx) => {
    await ctx.session.hook("request", (event) => {
      delete event.tools.write
    })

    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool !== "lookup" || typeof event.input !== "object" || event.input === null) return
      event.input = { ...event.input, source: "plugin" }
    })
  },
})
A hook failure fails the operation it intercepts. Keep runtime hooks fast and handle expected errors inside the callback.

Examples

Add a tool

Pass a tool declaration to tools.add. Define its input with JSON Schema and use an async executor:
import { Plugin

## [opencode/packages/core/src/tool.ts at v2.0.29 · anomalyco/opencode · GitHub](https://github.com/anomalyco/opencode/blob/v2.0.29/packages/core/src/tool.ts)

export type { Context, Metadata, Namespace, Options, Result } from "@opencode/schema/tool"

import { ToolDefinition, type ToolCall } from "@opencode/ai"
import { Tool } from "@opencode/schema/tool"
import { Context, Effect, Layer, Result, Schema, SchemaIssue, Types } from "effect"
import { makeLocationNode } from "@opencode/util/effect/app-node"
import type { Agent } from "./agent.js"

...

import { PluginHooks } from "./plugin/hooks.js"
import { SessionMessage } from "./session/message.js"
import { SessionSchema } from "./session/schema.js"
import { State } from "./state.js"
import { definition, effectiveName, execute, normalizedName, normalizeContent } from "./tool/runtime.js"
import { Wildcard } from "./util/wildcard.js"

export class RegistrationError extends Schema.TaggedError<RegistrationError>()("Tool.RegistrationError", {
  name: Schema.String,
  message: Schema.String,
}) {}

export interface Editor {

...

/** A local execution result after hooks and content normalization. */
export interface NormalizedResult extends Tool.Result {
  readonly content: ReadonlyArray<Tool.Content>
}

...

readonly progress?: (update: Tool.Metadata) => Effect.Effect<void>
    /** Surviving request definitions, keyed by the names advertised after session context hooks. */

...

Effect.gen(function* () {
    const hooks = yield* PluginHooks.Service
    const image = yield* Image.Service

    type NormalizedItem = Tool.Content | "decode" | "size"

...

hooks.trigger("tool", "execute.before", {
        tool: name,
        sessionID: context.sessionID,
        agent: context.agent,
        messageID: context.messageID,
        id: context.id,

...

yield* hooks.trigger("tool", "execute.after", afterEvent)
        return yield* afterEvent.error
      }
      const afterEvent: PluginHooks.Domains["tool"]["execute.after"] = {

...

.output === undefined ? {} : { output: execution.value.output }),
          content: execution.value.content,
          ...(execution.value.metadata === undefined ? {} : { metadata: execution.value.metadata }),
        },
      }
      yield* hooks.trigger("tool", "execute.after", afterEvent)
      const afterContent = yield* normalizeImages(normalizeContent(afterEvent.result.content, afterEvent.result.output))
      return {

...

const requested = input.definitions?.get(event.tool)
              // Preserve session context removal and alias resolution, now after the repair hook.

---

## Assistant

_Thinking:_

I have a good understanding of the plugin API now. Let me summarize what I've learned:

**OpenCode V2 Plugin API:**
- Plugins live in `.opencode/plugins/` (project) or `~/.config/opencode/plugins/` (global) or as npm packages
- V2 style: `Plugin.define({ id, setup(ctx) })` from `@opencode/plugin`
- V1 style: `export const MyPlugin = async ({ project, client, $, directory, worktree }) => { return { hooks } }` — still supported in V2
- Events available via `event: async ({ event }) => {...}` hook (V1) or `ctx.event` subscribe (V2):
  - session.created, session.idle, session.status, session.updated, session.error
  - message.updated, message.part.updated, message.part.removed, message.removed
  - tool.execute.before, tool.execute.after
  - permission.asked, permission.replied
  - file.edited
  - etc.
- V2 runtime hooks: `ctx.tool.hook("execute.before", ...)`, `ctx.tool.hook("execute.after", ...)`, `ctx.session.hook(...)`
- The plugin gets a `client` (SDK client) to query the API

Now, the key question: how does the dashboard get data?

Option A: The plugin subscribes to events and broadcasts to a WebSocket server it starts itself. Then the dashboard frontend connects to that WebSocket.

Option B: The dashboard frontend talks directly to the OpenCode server API (there's an SSE event stream at `/event` I believe). Let me check the API docs.

Actually, OpenCode server has an SSE endpoint. In V1, `GET /event` was the SSE stream. The `opencode api` command allows requests. Let me check the OpenAPI spec.

Actually, let me think about the architecture:
1. The plugin (running inside OpenCode server) subscribes to events: session.updated, message.updated, message.part.updated, tool.execute.before/after, session.idle, permission.asked etc.
2. The plugin starts an HTTP server (with configurable port) that serves:
   - Static dashboard frontend (HTML/JS/CSS)
   - A WebSocket or SSE endpoint that pushes live activity data
   - REST endpoint for initial state (backfill from session data)
3. The frontend connects and displays:
   - Current agent (plan/build), state (working/idle/waiting)
   - Live activity feed: state messages, tool calls with inputs/outputs summary
   - Subagents panel (from `subagent` tool calls / child sessions)
   - Token/cost stats
   - Permission requests

The user wants:
- State messages (agent state: thinking, working, idle...)
- Tool calling notices
- Subagents display
- Configurable port

From the session-example.json I can see the data shapes:
- `info`: session info with agent, model, tokens, cost, time
- `messages[]`: user / assistant / synthetic / idle / agent-switched / system
- assistant messages have `content[]` with reasoning/text/tool parts
- tool parts: `name`, `state.status` (completed/error), `state.input`, `state.content`, `state.metadata`, time.created/ran/completed
- idle messages mark turn completion with outcome succeeded/failed
- agent-switched messages show agent transitions (plan ↔ build)

Wait — but for V2, the plugin API differs. The search results show two generations:
- V1 (`@opencode-ai/plugin`): `export const X = async ({ project, client, $, directory, worktree }) => ({ hooks })` with `event` hook receiving `{ type, properties }` events.
- V2 (`@opencode/plugin`): `Plugin.define({ id, setup(ctx) })` with `ctx.tool.hook`, `ctx.session.hook`, `ctx.event`.

The skill says "Always answer for OpenCode V2 unless the user explicitly asks about V1". The migration guide says V2 discovers local plugins from `.opencode/plugin/` and `.opencode/plugins/` (use `.opencode/plugins/` for V2 files). V1 plugin implementations do not run in V2 — moving the file is not enough; must use Plugin.define.

Hmm, but the docs also mention: "A plugin can support V1 and V2 from the same package entrypoint. Default export one object with a V1 server() function and a V2 setup() function".

So I should build the plugin with the V2 API (`@opencode/plugin`, `Plugin.define`, `setup(ctx)`).

Now — how does the plugin know about sessions and subagents? Let me check what events are available in V2 via ctx.event. In V1 there were session/message/tool events. Let me look for the V2 event list. The search results didn't list ctx.event event types explicitly. There's mention of `ctx.event | subscribe to the current public server event stream`. The "public server event stream" is probably the same event bus as V1: session.*, message.*, tool.* etc.

Let me fetch the V2 docs page for more details — direct fetch failed with 403, maybe due to the `_sm_nck=1` suffix. Let me try dev.opencode.ai or v2.opencode.ai which appeared in search results. Also there's the GitHub repo (anomalyco/opencode) — I could fetch raw source of the plugins docs from GitHub. Let me try a few.

Actually let me also check the API docs for the event stream endpoint (SSE) — the dashboard might connect directly to the OpenCode server SSE stream instead of the plugin bridging. But then the plugin wouldn't be needed. The user explicitly wants a plugin. The plugin approach: plugin subscribes internally to events (no HTTP needed), runs its own HTTP+WebSocket server on a configurable port serving the dashboard UI.

Alternatively the plugin could serve only the WebSocket bridge and the dashboard is served as static files from the plugin. Both work. A single server serving both is simplest.

Let me check V2 docs for `ctx.event` and whether plugins can start servers. Nothing prevents a plugin from starting an HTTP server in Node (it runs in the server process). V1 plugins had `$` (Bun shell) and `client`. V2 has ctx.* context. Plugins run in the OpenCode server (Bun). Starting an HTTP server should be fine.

Let me fetch the V2 plugin docs from dev.opencode.ai to confirm details, and also check the OpenAPI for /event SSE. Let me also look at the V2 docs source on GitHub: anomalyco/opencode, path services/www/src/docs/content/... per the skill note ("its source is services/www/src/docs/content/migrate-v1.mdx"). So plugins docs source might be at services/www/src/docs/content/build/plugins.mdx. Let me fetch raw.githubusercontent.com for that.

Also, I should check the docs page about the API/event stream: https://opencode.ai/v2/docs/api. Let me fetch via GitHub raw to avoid the 403.

Then I'll analyze the session JSON structure (already given in the prompt) and the dashboard image (given). Then propose a plan + ask questions.

Let me fetch:
1. https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/build/plugins.mdx (V2 plugins docs source)
2. Maybe the openapi.json from GitHub: packages/... let me search for it.

Actually the openapi spec URL: https://opencode.ai/v2/openapi.json per the skill. Direct fetch may 403 too. Try GitHub raw: probably packages/sdk/js/src/gen/openapi... not sure. Let me first get the plugins docs source, which is most important.

I now have a good picture of the plugin API. Let me verify key V2 details from the docs source on GitHub (direct site fetch was 403).

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/build/plugins.mdx"
}
```

StatusCode: non 2xx status code (404 GET https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/build/plugins.mdx)

---

## Assistant

_Thinking:_

404 — path may differ. Let me look at the repo structure via the GitHub API.

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content?ref=v2"
}
```

[{"name":"agents.mdx","path":"services/www/src/docs/content/agents.mdx","sha":"1507f5b30e9ed8cf097e20541626c7cc933f778b","size":8653,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/agents.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/agents.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/1507f5b30e9ed8cf097e20541626c7cc933f778b","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/agents.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/agents.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/1507f5b30e9ed8cf097e20541626c7cc933f778b","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/agents.mdx"}},{"name":"attachments.mdx","path":"services/www/src/docs/content/attachments.mdx","sha":"36caace2e8853ae650773c6b6e9559d62bcbbfd6","size":6361,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/attachments.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/attachments.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/36caace2e8853ae650773c6b6e9559d62bcbbfd6","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/attachments.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/attachments.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/36caace2e8853ae650773c6b6e9559d62bcbbfd6","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/attachments.mdx"}},{"name":"build","path":"services/www/src/docs/content/build","sha":"dee8fe1553c252c07accaef809d804ae57d40201","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/dee8fe1553c252c07accaef809d804ae57d40201","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/dee8fe1553c252c07accaef809d804ae57d40201","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build"}},{"name":"cli","path":"services/www/src/docs/content/cli","sha":"b73e9c35fe6a4e307334d16e9666ceb677a01a98","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/cli?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/cli","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/b73e9c35fe6a4e307334d16e9666ceb677a01a98","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/cli?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/b73e9c35fe6a4e307334d16e9666ceb677a01a98","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/cli"}},{"name":"commands.mdx","path":"services/www/src/docs/content/commands.mdx","sha":"a20d04f6fb301133603743d1bfe18ce6da2f1e89","size":7236,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/commands.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/commands.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a20d04f6fb301133603743d1bfe18ce6da2f1e89","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/commands.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/commands.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a20d04f6fb301133603743d1bfe18ce6da2f1e89","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/commands.mdx"}},{"name":"compaction.mdx","path":"services/www/src/docs/content/compaction.mdx","sha":"a22c87e508023b493df005d49931d14a2600b6ee","size":5976,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/compaction.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/compaction.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a22c87e508023b493df005d49931d14a2600b6ee","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/compaction.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/compaction.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a22c87e508023b493df005d49931d14a2600b6ee","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/compaction.mdx"}},{"name":"config.mdx","path":"services/www/src/docs/content/config.mdx","sha":"adcacb53dcc1627f57317be72218e7c6ed72f33f","size":12096,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/config.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/config.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/adcacb53dcc1627f57317be72218e7c6ed72f33f","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/config.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/config.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/adcacb53dcc1627f57317be72218e7c6ed72f33f","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/config.mdx"}},{"name":"console","path":"services/www/src/docs/content/console","sha":"e136597a3da3407e187c96930c37e6632fc813b6","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/console?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/console","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/e136597a3da3407e187c96930c37e6632fc813b6","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/console?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/e136597a3da3407e187c96930c37e6632fc813b6","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/console"}},{"name":"formatters.mdx","path":"services/www/src/docs/content/formatters.mdx","sha":"e78821e0f6e82699518b203cda5730283614b06c","size":6131,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/formatters.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/formatters.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/e78821e0f6e82699518b203cda5730283614b06c","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/formatters.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/formatters.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/e78821e0f6e82699518b203cda5730283614b06c","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/formatters.mdx"}},{"name":"index.mdx","path":"services/www/src/docs/content/index.mdx","sha":"c5c68c392648bb90a83e9a692edeb1c631f767f8","size":4059,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/index.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/index.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/c5c68c392648bb90a83e9a692edeb1c631f767f8","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/index.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/index.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/c5c68c392648bb90a83e9a692edeb1c631f767f8","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/index.mdx"}},{"name":"instructions.mdx","path":"services/www/src/docs/content/instructions.mdx","sha":"d7d43422a6a1212271c7c9be382a361a03ee390b","size":4578,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/instructions.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/instructions.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/d7d43422a6a1212271c7c9be382a361a03ee390b","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/instructions.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/instructions.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/d7d43422a6a1212271c7c9be382a361a03ee390b","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/instructions.mdx"}},{"name":"mcp-servers.mdx","path":"services/www/src/docs/content/mcp-servers.mdx","sha":"4951db4ff3b40228c331bfa18d74ee610c86d70e","size":11825,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/mcp-servers.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/mcp-servers.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/4951db4ff3b40228c331bfa18d74ee610c86d70e","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/mcp-servers.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/mcp-servers.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/4951db4ff3b40228c331bfa18d74ee610c86d70e","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/mcp-servers.mdx"}},{"name":"migrate-v1.mdx","path":"services/www/src/docs/content/migrate-v1.mdx","sha":"760bfc691da16a191c8a4bd3b054d6157752c9a8","size":18611,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/migrate-v1.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/migrate-v1.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/760bfc691da16a191c8a4bd3b054d6157752c9a8","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/migrate-v1.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/migrate-v1.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/760bfc691da16a191c8a4bd3b054d6157752c9a8","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/migrate-v1.mdx"}},{"name":"models.mdx","path":"services/www/src/docs/content/models.mdx","sha":"003ef6df1b251c7bca6c128672c57aebee3fda56","size":12327,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/models.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/models.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/003ef6df1b251c7bca6c128672c57aebee3fda56","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/models.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/models.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/003ef6df1b251c7bca6c128672c57aebee3fda56","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/models.mdx"}},{"name":"network.mdx","path":"services/www/src/docs/content/network.mdx","sha":"be70545b519970a09f7f24db10f64e198f903c6c","size":3370,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/network.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/network.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/be70545b519970a09f7f24db10f64e198f903c6c","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/network.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/network.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/be70545b519970a09f7f24db10f64e198f903c6c","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/network.mdx"}},{"name":"permissions.mdx","path":"services/www/src/docs/content/permissions.mdx","sha":"a8e540213c394a3e4ed4e847be3d52b6d4cfbffe","size":11362,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/permissions.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/permissions.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a8e540213c394a3e4ed4e847be3d52b6d4cfbffe","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/permissions.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/permissions.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/a8e540213c394a3e4ed4e847be3d52b6d4cfbffe","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/permissions.mdx"}},{"name":"plugins.mdx","path":"services/www/src/docs/content/plugins.mdx","sha":"4901d3d17c4bf499205404ea116e004bd03db5a1","size":4203,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/plugins.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/plugins.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/4901d3d17c4bf499205404ea116e004bd03db5a1","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/plugins.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/plugins.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/4901d3d17c4bf499205404ea116e004bd03db5a1","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/plugins.mdx"}},{"name":"policies.mdx","path":"services/www/src/docs/content/policies.mdx","sha":"ea021b7ccb14b279ff5deb93d3014bb371ee5f9b","size":7880,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/policies.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/policies.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/ea021b7ccb14b279ff5deb93d3014bb371ee5f9b","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/policies.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/policies.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/ea021b7ccb14b279ff5deb93d3014bb371ee5f9b","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/policies.mdx"}},{"name":"providers.mdx","path":"services/www/src/docs/content/providers.mdx","sha":"ed6797b3438e594a803e6285d106e40ad25bb6cb","size":21212,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/providers.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/providers.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/ed6797b3438e594a803e6285d106e40ad25bb6cb","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/providers.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/providers.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/ed6797b3438e594a803e6285d106e40ad25bb6cb","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/providers.mdx"}},{"name":"references.mdx","path":"services/www/src/docs/content/references.mdx","sha":"947616ff775409cdf7659706bdd8049efdfc1ec4","size":7012,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/references.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/references.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/947616ff775409cdf7659706bdd8049efdfc1ec4","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/references.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/references.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/947616ff775409cdf7659706bdd8049efdfc1ec4","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/references.mdx"}},{"name":"sharing.mdx","path":"services/www/src/docs/content/sharing.mdx","sha":"1f9f406aa60de5648b3a022d99cba2715513d0d4","size":76,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/sharing.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/sharing.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/1f9f406aa60de5648b3a022d99cba2715513d0d4","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/sharing.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/sharing.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/1f9f406aa60de5648b3a022d99cba2715513d0d4","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/sharing.mdx"}},{"name":"skills.mdx","path":"services/www/src/docs/content/skills.mdx","sha":"2301c68629cd05a7ccb82e47b7952f8e0610fce5","size":8991,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/skills.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/skills.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/2301c68629cd05a7ccb82e47b7952f8e0610fce5","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/skills.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/skills.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/2301c68629cd05a7ccb82e47b7952f8e0610fce5","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/skills.mdx"}},{"name":"snapshots.mdx","path":"services/www/src/docs/content/snapshots.mdx","sha":"88bca613bcb714f0a320806c94ea6c4b5e9407f1","size":4876,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/snapshots.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/snapshots.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/88bca613bcb714f0a320806c94ea6c4b5e9407f1","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/snapshots.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/snapshots.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/88bca613bcb714f0a320806c94ea6c4b5e9407f1","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/snapshots.mdx"}},{"name":"themes.mdx","path":"services/www/src/docs/content/themes.mdx","sha":"472ac15fe849570ea095b7f952b1cf8e37e15ebd","size":7657,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/themes.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/themes.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/472ac15fe849570ea095b7f952b1cf8e37e15ebd","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/themes.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/themes.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/472ac15fe849570ea095b7f952b1cf8e37e15ebd","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/themes.mdx"}},{"name":"tools.mdx","path":"services/www/src/docs/content/tools.mdx","sha":"884119a2908ae8a9cd2a8cb09f12dab3fd5bb61d","size":9904,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/tools.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/tools.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/884119a2908ae8a9cd2a8cb09f12dab3fd5bb61d","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/tools.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/tools.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/884119a2908ae8a9cd2a8cb09f12dab3fd5bb61d","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/tools.mdx"}},{"name":"troubleshooting.mdx","path":"services/www/src/docs/content/troubleshooting.mdx","sha":"861582d6a4a23345e18aad69a8b6876f6d1ed3d6","size":5410,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/troubleshooting.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/troubleshooting.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/861582d6a4a23345e18aad69a8b6876f6d1ed3d6","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/troubleshooting.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/troubleshooting.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/861582d6a4a23345e18aad69a8b6876f6d1ed3d6","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/troubleshooting.mdx"}},{"name":"warming.mdx","path":"services/www/src/docs/content/warming.mdx","sha":"bd281fa99f361cfc3a4bdb923bed1991073bc253","size":3857,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/warming.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/warming.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/bd281fa99f361cfc3a4bdb923bed1991073bc253","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/warming.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/warming.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/bd281fa99f361cfc3a4bdb923bed1991073bc253","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/warming.mdx"}},{"name":"websearch.mdx","path":"services/www/src/docs/content/websearch.mdx","sha":"8409cabfd2c5aeaa29ab44985b88cf203fef285c","size":2518,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/websearch.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/websearch.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/8409cabfd2c5aeaa29ab44985b88cf203fef285c","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/websearch.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/websearch.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/8409cabfd2c5aeaa29ab44985b88cf203fef285c","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/websearch.mdx"}}]

---

## Assistant

_Thinking:_

The build directory exists. Let me list it to find plugins.mdx and the RPC docs.

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build?ref=v2"
}
```

[{"name":"client","path":"services/www/src/docs/content/build/client","sha":"b93313552973ce62fbd6c94b73c2f6853b136a45","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/client?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/client","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/b93313552973ce62fbd6c94b73c2f6853b136a45","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/client?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/b93313552973ce62fbd6c94b73c2f6853b136a45","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/client"}},{"name":"index.mdx","path":"services/www/src/docs/content/build/index.mdx","sha":"3f71ce51ae2d77e10072ea9a1a282b48026c4ddf","size":958,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/index.mdx?ref=v2","html_url":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/build/index.mdx","git_url":"https://api.github.com/repos/anomalyco/opencode/git/blobs/3f71ce51ae2d77e10072ea9a1a282b48026c4ddf","download_url":"https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/build/index.mdx","type":"file","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/index.mdx?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/blobs/3f71ce51ae2d77e10072ea9a1a282b48026c4ddf","html":"https://github.com/anomalyco/opencode/blob/v2/services/www/src/docs/content/build/index.mdx"}},{"name":"plugins","path":"services/www/src/docs/content/build/plugins","sha":"37baf61d651c2db10ad84486315145ba3abd048e","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/plugins?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/plugins","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/37baf61d651c2db10ad84486315145ba3abd048e","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/plugins?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/37baf61d651c2db10ad84486315145ba3abd048e","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/plugins"}},{"name":"sdk","path":"services/www/src/docs/content/build/sdk","sha":"5e38e294361548ad568635f770befe76c06b2fb5","size":0,"url":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/sdk?ref=v2","html_url":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/sdk","git_url":"https://api.github.com/repos/anomalyco/opencode/git/trees/5e38e294361548ad568635f770befe76c06b2fb5","download_url":null,"type":"dir","_links":{"self":"https://api.github.com/repos/anomalyco/opencode/contents/services/www/src/docs/content/build/sdk?ref=v2","git":"https://api.github.com/repos/anomalyco/opencode/git/trees/5e38e294361548ad568635f770befe76c06b2fb5","html":"https://github.com/anomalyco/opencode/tree/v2/services/www/src/docs/content/build/sdk"}}]

---

## Assistant

_Thinking:_

The build/plugins directory exists. Let me fetch the main plugins doc there.

**Tool: webfetch**

**Input:**
```json
{
  "url": "https://raw.githubusercontent.com/anomalyco/opencode/v2/services/www/src/docs/content/build/plugins/index.mdx"
}
```

---
title: "Overview"
---

Plugins can modify OpenCode's behavior and add new features. To change the terminal UI, build a [CLI
plugin](/build/plugins/cli).

Migrating an existing OpenCode 1 plugin? Follow the [V1 plugin migration guide](/build/plugins/migrate-v1).

```ts title=".opencode/plugins/example/index.ts"
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "example",
  async setup(ctx) {
    await ctx.storage.set("loaded", true)
  },
})
```

Plugins under `.opencode/plugins/` are loaded automatically, like the local example above. To load published packages
or plugin directories from other locations, add them to `plugins` in `opencode.json(c)`:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-acme-plugin",
    "opencode-acme-plugin@1.2.0",
    "@acme/opencode-plugin",
    "./plugins/local",
    "../shared/plugin",
    "/absolute/path/plugin",
    "file:///home/me/plugins/local",
    {
      "package": "@acme/opencode-plugin",
      "options": {
        "agent": "reviewer",
        "strict": true,
      },
    },
  ],
}
```

See [Configure plugins](/plugins) for more loading and configuration options.

## Lifecycle

`setup` runs when the plugin loads. It may return a cleanup function that runs when the plugin unloads.

```ts
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "example",
  setup(ctx) {
    console.log(`loaded in OpenCode ${ctx.app.version}`)
    return () => console.log("unloaded")
  },
})
```

### Context

The plugin context is essentially an [OpenCode server client](/build/client).
Its read and action methods use the same inputs and responses as the client. It
adds plugin-only methods for transforms, runtime hooks, reloads, registrations,
and plugin options.

```ts
setup(ctx) {
  console.log(ctx.app.version)
}
```

`ctx.location` describes the location where this plugin instance is loaded. It
includes `directory`, optional `workspaceID`, and `project` metadata (`id`,
`directory`, and `canonical`). It is available in both Promise and Effect plugins.
This is the plugin instance's location, not the location of every session it can
access or event it receives.

```ts
setup(ctx) {
  console.log(ctx.location.directory)
  console.log(ctx.location.project.canonical)
}
```

### Options

Pass plugin options with the object form in `opencode.json(c)`.

```jsonc title="opencode.jsonc"
{
  "plugins": [
    {
      "package": "./plugins/company",
      "options": {
        "strict": true,
      },
    },
  ],
}
```

Read those values from `ctx.options` during `setup`.

```ts title="plugins/company/index.ts"
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "company",
  setup(ctx) {
    const strict = ctx.options.strict === true
  },
})
```

## Transforms

Transforms are synchronous edits to OpenCode's domain state, and each builds on earlier registrations in its domain.
Registry reads such as `ctx.model.list()` reflect every registration so far, including during plugin setup;
startup batching only coalesces update notifications and never delays what a read returns. Resource status APIs still
report the state of running resources: a registered definition does not mean its connection or other resource work has
completed.

Sources contribute providers and immutable model definitions through `ctx.provider.transform`.

```ts title="plugins/models/index.ts"
import { Model, Plugin, Provider } from "@opencode/plugin"

export default Plugin.define({
  id: "company.models",
  async setup(ctx) {
    const providerID = Provider.ID.make("acme")
    const models = [{ ...Model.Info.default(providerID, Model.ID.make("reasoner")), name: "Acme Reasoner" }]
    await ctx.provider.transform((editor) => {
      editor.add({
        info: {
          ...Provider.Info.empty(providerID),
          name: "Acme",
          activation: "enabled",
          package: "@opencode/ai/providers/openai-compatible",
          settings: { baseURL: "http://127.0.0.1:8000/v1" },
        },
        models,
      })
    })

    const available = await ctx.model.list()
  },
})
```

Any registration, removal, or `reload()` marks the registry changed; the next read rebuilds it by replaying every
active transform in registration order onto a fresh value. Keep transforms cheap and repeatable. A value you have
already read is never modified by later rebuilds.

After provider transforms and availability are resolved, OpenCode materializes the active providers' models and replays
every model transform in order. A model policy can inspect the whole candidate collection, including newly refreshed
sources.

```ts title="plugins/model-budget/index.ts"
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "company.model-budget",
  async setup(ctx) {
    await ctx.model.transform((editor) => {
      editor
        .list()
        .filter((model) => model.cost.some((tier) => tier.output > 20))
        .forEach((model) => {
          editor.remove(model.providerID, model.id)
        })
    })
  },
})
```

Captured inputs are not watched automatically. Load external data before the synchronous callback, then call
`reload()` after those inputs change. Here, `loadFromSource()` returns
`{ info: Provider.Info, models: readonly Model.Info[] }` entries.

```ts title="plugins/models/index.ts"
import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "company.models",
  async setup(ctx) {
    const source = { providers: await loadFromSource() }

    await ctx.provider.transform((editor) => {
      source.providers.forEach((provider) => editor.add(provider))
    })

    const refresh = async () => {
      source.providers = await loadFromSource()
      await ctx.provider.reload()
    }

    const timer = setInterval(() => void refresh().catch(console.error), 60_000)
    return () => clearInterval(timer)
  },
})
```

Provider changes invalidate the whole active model result, so the output-price policy still filters the refreshed models.
Use `ctx.model.reload()` when only an input captured by a model transform changes.

## API

### Agent

Read all agents or fetch one by ID.

```ts
const agents = await ctx.agent.list()
const build = await ctx.agent.get({ agentID: "build" })
```

Register a transform to inspect, update, remove, or select the default agent.

```ts
await ctx.agent.transform((editor) => {
  const agents = editor.list()
  const build = editor.get("build")

  editor.default("build")
  editor.update("build", (agent) => {
    agent.description = "Builds features and fixes bugs"
  })
  editor.remove("legacy")
})
```

Reload agents after external state used by a transform changes.

```ts
await ctx.agent.reload()
```

#### Reference

Schema: [`Agent.Info`](/api#schema-Agent.Info)

```ts
interface AgentContext {
  list(input?: AgentListInput, requestOptions?: RequestOptions): Promise<AgentListOutput>
  get(input: AgentGetInput, requestOptions?: RequestOptions): Promise<AgentGetOutput>
  transform(callback: (editor: AgentEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface AgentEditor {
  list(): readonly AgentInfo[]
  get(id: string): AgentInfo | undefined
  default(id: string | undefined): void
  update(id: string, update: (agent: AgentInfo) => void): void
  remove(id: string): void
}

interface Registration {
  dispose(): Promise<void>
}
```

### Providers

Read available providers or inspect one provider's metadata by ID.

```ts
const providers = await ctx.provider.list()
const provider = await ctx.provider.get({ providerID: "anthropic" })
```

Provider transforms edit provider settings and source definitions. Editor reads include inactive providers and expose
immutable definitions; `models.update` edits an owned copy of a source model.

```ts
await ctx.provider.transform((editor) => {
  editor.update("anthropic", (provider) => {
    provider.headers = { ...provider.headers, "x-company": "engineering" }
  })
  editor.models.update("anthropic", "claude-sonnet-4-5", (model) => {
    model.name = "Team Sonnet"
  })
  editor.models.remove("anthropic", "legacy-model")
  editor.remove("legacy-provider")
})
```

Replace a provider's source inventory with `models.set`, then reload after the captured definitions change.

```ts
const source = { models: await loadModels() }
await ctx.provider.transform((editor) => {
  editor.models.set("acme", source.models)
})

source.models = await loadModels()
await ctx.provider.reload()
```

For account-specific discovery, pass the connection used to load the inventory as `sourceConnection`. OpenCode excludes
that provider while another connection is selected, until your plugin publishes its refreshed inventory.

```ts
const connection = await ctx.integration.connection.active("acme")
if (!connection) return
const inventory = await loadInventory(connection)
await ctx.provider.transform((editor) => {
  editor.add({ info: inventory.provider, models: inventory.models, sourceConnection: connection })
})
```

#### Reference

Schemas: [`Provider.Info`](/api#schema-Provider.Info), [`Model.Info`](/api#schema-Model.Info)

```ts
interface ProviderDomain extends ProviderApi {
  transform(callback: (editor: ProviderEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface ProviderRecord {
  readonly provider: Provider.Info
  readonly models: ReadonlyMap<string, Model.Info>
  readonly sourceConnection?: ConnectionInfo
}

interface ProviderEditor {
  list(): readonly ProviderRecord[]
  get(providerID: string): ProviderRecord | undefined
  add(input: { info: Provider.Info; models: readonly Model.Info[]; sourceConnection?: ConnectionInfo }): void
  update(providerID: string, update: (provider: DeepMutable<Provider.Info>) => void): void
  remove(providerID: string): void
  readonly models: {
    set(providerID: string, models: readonly Model.Info[]): void
    update(providerID: string, modelID: string, update: (model: DeepMutable<Model.Info>) => void): void
    remove(providerID: string, modelID: string): void
  }
}
```

### Models

Read available models and the default selection.

```ts
const models = await ctx.model.list()
const selected = await ctx.model.default()
```

Model transforms edit the entire active-provider candidate collection. Disabled candidates remain editable until all
transforms finish; `update` can add a model only under an available provider.

```ts
await ctx.model.transform((editor) => {
  editor.list("anthropic").forEach((model) => {
    editor.update(model.providerID, model.id, (draft) => {
      draft.enabled = draft.capabilities.tools
    })
  })
  editor.default.set("anthropic", "claude-sonnet-4-5")
  editor.remove("anthropic", "legacy-model")
})
```

Callbacks edit raw model overrides. Provider defaults are merged once when OpenCode commits the result; unchanged reads
reuse that result. `editor.provider` exposes immutable source definitions, including inactive templates, rather than
model-transform output.

```ts
await ctx.model.transform((editor) => {
  const source = editor.provider.get("anthropic")?.models.get("claude-sonnet-4-5")
  if (!source) return
  editor.update("anthropic", source.id, (model) => {
    model.limit.context = Math.min(model.limit.context, source.limit.context)
  })
})

await ctx.model.reload()
```

#### Reference

Schema: [`Model.Info`](/api#schema-Model.Info)

```ts
interface ModelDomain extends ModelApi {
  transform(callback: (editor: ModelEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface ModelEditor {
  list(providerID?: string): readonly DeepMutable<Model.Info>[]
  get(providerID: string, modelID: string): DeepMutable<Model.Info> | undefined
  update(providerID: string, modelID: string, update: (model: DeepMutable<Model.Info>) => void): void
  remove(providerID: string, modelID: string): void
  readonly default: {
    get(): { providerID: string; modelID: string } | undefined
    set(providerID: string, modelID: string): void
  }
  readonly provider: {
    list(): readonly ProviderRecord[]
    get(providerID: string): ProviderRecord | undefined
  }
}
```

### Commands

Read the commands available at a location.

```ts
const commands = await ctx.command.list()
```

Register commands with a transform. The executor receives the session, prompt attachments, and requested delivery mode.

```ts
await ctx.command.transform((editor) => {
  editor.add({
    name: "security-review",
    description: "Review changes for security issues",
    execute: async ({ sessionID, prompt, delivery }) => {
      await ctx.session.prompt({
        ...prompt,
        sessionID,
        text: `Review these changes for security issues.\n\n${prompt.text}`,
        delivery,
      })
    },
  })
})
```

Reload commands after external state used by a transform changes.

```ts
await ctx.command.reload()
```

#### Reference

Schemas: [`Command.Info`](/api#schema-Command.Info),
[`Session.Inbox.Delivery`](/api#schema-Session.Inbox.Delivery)

```ts
interface CommandContext {
  list(input?: CommandListInput, requestOptions?: RequestOptions): Promise<CommandListOutput>
  transform(callback: (editor: CommandEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface CommandEditor {
  add(definition: CommandDefinition): void
}

interface CommandDefinition {
  name: string
  description?: string
  execute(input: CommandInvocation): Promise<void>
}

interface CommandInvocation {
  sessionID: string
  prompt: PromptInput
  delivery: "steer" | "queue"
}
```

### Integrations

Read integrations and inspect active credentials.

```ts
const integrations = await ctx.integration.list()
const github = await ctx.integration.get({ integrationID: "github" })
const connection = await ctx.integration.connection.active("github")
const credential = connection ? await ctx.integration.connection.resolve(connection) : undefined
```

Connect integrations with an API key.

```ts
await ctx.integration.connect.key({
  integrationID: "github",
  key: process.env.GITHUB_TOKEN!,
})
```

Start, inspect, complete, or cancel an OAuth connection attempt.

```ts
const attempt = await ctx.integration.oauth.connect({ integrationID: "github", methodID: "oauth" })
const status = await ctx.integration.oauth.status({ integrationID: "github", attemptID: attempt.data.attemptID })
await ctx.integration.oauth.complete({ integrationID: "github", attemptID: attempt.data.attemptID, code })
await ctx.integration.oauth.cancel({ integrationID: "github", attemptID: attempt.data.attemptID })
```

Command-based connections expose the same start, status, and cancel flow.

```ts
const attempt = await ctx.integration.command.connect({ integrationID: "acme", methodID: "cli" })
const status = await ctx.integration.command.status({ integrationID: "acme", attemptID: attempt.data.attemptID })
await ctx.integration.command.cancel({ integrationID: "acme", attemptID: attempt.data.attemptID })
```

Register a transform to inspect integrations and manage their authentication methods.

```ts
await ctx.integration.transform((editor) => {
  const integrations = editor.list()
  const acme = editor.get("acme")

  editor.update("acme", (integration) => {
    integration.name = "Acme"
  })
  editor.method.update({
    integrationID: "acme",
    method: { id: "cli", type: "command", label: "Sign in with Acme CLI", command: ["acme", "login"] },
  })

  const methods = editor.method.list("acme")
  const legacy = methods.find((method) => method.type === "command" && method.id === "legacy")
  if (legacy) editor.method.remove("acme", legacy)
  editor.remove("legacy")
})
```

Reload integrations after external state used by a transform changes.

```ts
await ctx.integration.reload()
```

#### Reference

Schemas: [`Integration.Info`](/api#schema-Integration.Info), [`Integration.Method`](/api#schema-Integration.Method),
[`Connection.Info`](/api#schema-Connection.Info), [`Form.Answer`](/api#schema-Form.Answer)

```ts
interface IntegrationContext {
  list(input?: IntegrationListInput, requestOptions?: RequestOptions): Promise<IntegrationListOutput>
  get(input: IntegrationGetInput, requestOptions?: RequestOptions): Promise<IntegrationGetOutput>
  connect: {
    key(input: IntegrationConnectKeyInput, requestOptions?: RequestOptions): Promise<void>
  }
  oauth: {
    connect(
      input: IntegrationOauthConnectInput,
      requestOptions?: RequestOptions,
    ): Promise<IntegrationOauthConnectOutput>
    status(input: IntegrationOauthStatusInput, requestOptions?: RequestOptions): Promise<IntegrationOauthStatusOutput>
    complete(input: IntegrationOauthCompleteInput, requestOptions?: RequestOptions): Promise<void>
    cancel(input: IntegrationOauthCancelInput, requestOptions?: RequestOptions): Promise<void>
  }
  command: {
    connect(
      input: IntegrationCommandConnectInput,
      requestOptions?: RequestOptions,
    ): Promise<IntegrationCommandConnectOutput>
    status(
      input: IntegrationCommandStatusInput,
      requestOptions?: RequestOptions,
    ): Promise<IntegrationCommandStatusOutput>
    cancel(input: IntegrationCommandCancelInput, requestOptions?: RequestOptions): Promise<void>
  }
  transform(callback: (editor: IntegrationEditor) => void): Promise<Registration>
  reload(): Promise<void>
  connection: {
    active(integrationID: string): Promise<ConnectionInfo | undefined>
    resolve(connection: ConnectionInfo): Promise<CredentialValue | undefined>
  }
}

interface IntegrationEditor {
  list(): readonly IntegrationRef[]
  get(id: string): IntegrationRef | undefined
  update(id: string, update: (integration: IntegrationRef) => void): void
  remove(id: string): void
  method: {
    list(integrationID: string): readonly IntegrationMethod[]
    update(input: IntegrationMethodRegistration): void
    remove(integrationID: string, method: IntegrationMethod): void
  }
}
```

### MCP

List MCP servers and their current connection state.

```ts
const servers = await ctx.mcp.list()
```

Plugins manage MCP servers only through transforms. Use `editor.set` to add or replace a server, `editor.update` to
change its configuration, and `editor.remove` to remove it. Inspect configuration with `editor.list` and `editor.get`.

```ts
await ctx.mcp.transform((editor) => {
  const servers = editor.list()
  const docs = editor.get("docs")
  editor.set("docs", { type: "remote", url: "https://mcp.example.com" })
  editor.update("docs", (server) => {
    server.disabled = false
  })
  editor.remove("legacy")
})
```

Set `disabled: true` in a transform to disable a server and disconnect it, or `disabled: false` to enable it and allow
OpenCode to connect. OpenCode reconciles server lifecycle from the transformed configuration.

Call `reload()` after external state used by a transform changes to reapply transforms and reconcile the servers.

```ts
await ctx.mcp.reload()
```

#### Reference

Schemas: [`Mcp.Server`](/api#schema-Mcp.Server), [`Mcp.LocalConfigEncoded`](/api#schema-Mcp.LocalConfigEncoded),
[`Mcp.RemoteConfigEncoded`](/api#schema-Mcp.RemoteConfigEncoded)

```ts
interface MCPContext {
  list(input?: McpListInput, requestOptions?: RequestOptions): Promise<McpListOutput>
  transform(callback: (editor: MCPEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface MCPEditor {
  list(): readonly (readonly [string, McpServerConfig])[]
  get(name: string): McpServerConfig | undefined
  set(name: string, config: McpServerConfig): void
  update(name: string, update: (config: McpServerConfig) => void): void
  remove(name: string): void
}
```

### Plugins

List the plugins currently active for a location.

```ts
const plugins = await ctx.plugin.list()
```

#### Reference

Schemas: [`Plugin.Info`](/api#schema-Plugin.Info), [`Plugin.Source`](/api#schema-Plugin.Source)

```ts
interface PluginContext {
  list(input?: PluginListInput, requestOptions?: RequestOptions): Promise<PluginListOutput>
}
```

### References

Read the references available at a location.

```ts
const references = await ctx.reference.list()
```

Register a transform to inspect, add, or remove local and Git references. `get(name)` returns the current configured source,
or `undefined` when the name is absent.

```ts
await ctx.reference.transform((editor) => {
  const references = editor.list()
  editor.add("handbook", { type: "local", path: "/workspace/docs/handbook" })
  editor.add("standards", { type: "git", repository: "https://github.com/acme/standards", branch: "main" })
  const handbook = editor.get("handbook")
  editor.remove("legacy")
})
```

Reload references after external state used by a transform changes.

```ts
await ctx.reference.reload()
```

#### Reference

Schemas: [`Reference.Info`](/api#schema-Reference.Info), [`Reference.LocalSource`](/api#schema-Reference.LocalSource),
[`Reference.GitSource`](/api#schema-Reference.GitSource)

```ts
interface ReferenceContext {
  list(input?: ReferenceListInput, requestOptions?: RequestOptions): Promise<ReferenceListOutput>
  transform(callback: (editor: ReferenceEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface ReferenceEditor {
  list(): readonly (readonly [string, ReferenceLocalSource | ReferenceGitSource])[]
  get(name: string): ReferenceLocalSource | ReferenceGitSource | undefined
  add(name: string, source: ReferenceLocalSource | ReferenceGitSource): void
  remove(name: string): void
}
```

### Generate

Generate text with a selected model without creating a session, invoking tools, or adding to session history.

```ts
const review = await ctx.generate.text({
  model: { providerID: "anthropic", id: "claude-sonnet-4-6" },
  prompt: "Review this proposed action.",
})
```

### Permissions

Inspect or resolve pending permission requests.

```ts
const pending = await ctx.permission.list({ sessionID })
const request = await ctx.permission.get({ sessionID, requestID })
await ctx.permission.reply({ sessionID, requestID, reply: "once" })
```

Replace the session-scoped permission rules. They are evaluated after the agent's rules, and the
last matching rule wins. Child sessions inherit the rules in effect when they are created.

```ts
await ctx.permission.rules({
  sessionID,
  permissions: [{ action: "edit", resource: "/path/to/original/checkout/**", effect: "deny" }],
})
```

### Sessions

Create or read a session.

```ts
const created = await ctx.session.create({ title: "Review" })
const session = await ctx.session.get({ sessionID })
const messages = await ctx.session.context({ sessionID })
```

Change the agent or model used by subsequent requests.

```ts
await ctx.session.switchAgent({ sessionID, agent: "build" })
await ctx.session.switchModel({ sessionID, model: { providerID: "anthropic", id: "claude-sonnet-4-5" } })
```

Send user prompts, transient generation requests, commands, or synthetic messages.

```ts
const prompt = await ctx.session.prompt({ sessionID, text: "Review the current changes" })
const generated = await ctx.session.generate({ sessionID, prompt: "Summarize this project" })
const command = await ctx.session.command({ sessionID, command: "review", arguments: "--staged" })
const synthetic = await ctx.session.synthetic({ sessionID, text: "Deployment completed" })
```

Rename, interrupt, or wait for a session.

```ts
await ctx.session.update({ sessionID, title: "Review" })
await ctx.session.interrupt({ sessionID, continue: false })
await ctx.session.wait({ sessionID })
```

Remove a temporary session with `remove`. Removal stops active execution and recursively deletes child sessions.

```ts
await ctx.session.remove({ sessionID })
```

Request compaction with `compact`. It returns the admitted inbox item, not a completed summary; compaction runs at
the next step boundary by default. Pass `delivery: "queue"` to preserve queue order instead.

```ts
const compaction = await ctx.session.compact({ sessionID })
```

#### Reference

Schemas: [`Session.Info`](/api#schema-Session.Info), [`Model.Ref`](/api#schema-Model.Ref),
[`Session.Inbox.User`](/api#schema-Session.Inbox.User), [`Session.Inbox.Synthetic`](/api#schema-Session.Inbox.Synthetic)

```ts
interface SessionContext {
  create(input?: SessionCreateInput, requestOptions?: RequestOptions): Promise<SessionInfo>
  get(input: SessionGetInput, requestOptions?: RequestOptions): Promise<SessionInfo>
  remove(input: SessionRemoveInput, requestOptions?: RequestOptions): Promise<void>
  context(input: SessionContextInput, requestOptions?: RequestOptions): Promise<readonly SessionMessageInfo[]>
  switchAgent(input: SessionSwitchAgentInput, requestOptions?: RequestOptions): Promise<void>
  switchModel(input: SessionSwitchModelInput, requestOptions?: RequestOptions): Promise<void>
  update(input: SessionUpdateInput, requestOptions?: RequestOptions): Promise<void>
  move(input: SessionMoveInput, requestOptions?: RequestOptions): Promise<void>
  prompt(input: SessionPromptInput, requestOptions?: RequestOptions): Promise<SessionInboxUser>
  generate(input: SessionGenerateInput, requestOptions?: RequestOptions): Promise<{ text: string }>
  command(input: SessionCommandInput, requestOptions?: RequestOptions): Promise<SessionInboxUser>
  compact(input: SessionCompactInput, requestOptions?: RequestOptions): Promise<SessionInboxCompaction>
  synthetic(input: SessionSyntheticInput, requestOptions?: RequestOptions): Promise<SessionInboxSynthetic>
  interrupt(input: SessionInterruptInput, requestOptions?: RequestOptions): Promise<void>
  wait(input: SessionWaitInput, requestOptions?: RequestOptions): Promise<void>
}
```

### Skills

Read the skills available at a location.

```ts
const skills = await ctx.skill.list()
```

Register a transform to inspect, add, update, or remove skills. `get(id)` returns the current editor entry, or `undefined`
when the skill is absent.

```ts
await ctx.skill.transform((editor) => {
  const skills = editor.list()
  editor.add({
    id: "review",
    name: "Review",
    description: "Review the current changes",
    path: "/workspace/.opencode/skills/review/SKILL.md",
    content: "Review the current changes for correctness and missing tests.",
  })
  const review = editor.get("review")
  editor.update("review", (skill) => {
    skill.autoinvoke = true
  })
  editor.remove("legacy")
})
```

Reload skills after external state used by a transform changes.

```ts
await ctx.skill.reload()
```

#### Reference

Schema: [`Skill.Info`](/api#schema-Skill.Info)

```ts
interface SkillContext {
  list(input?: SkillListInput, requestOptions?: RequestOptions): Promise<SkillListOutput>
  transform(callback: (editor: SkillEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface SkillEditor {
  list(): readonly SkillInfo[]
  get(id: string): SkillInfo | undefined
  add(skill: SkillInfo): void
  update(id: string, update: (skill: SkillInfo) => void): void
  remove(id: string): void
}
```

### Storage

Store, read, or remove durable JSON values scoped to the plugin.

```ts
await ctx.storage.set("settings", { strict: true })
const settings = await ctx.storage.get("settings")
await ctx.storage.remove("settings")
```

Scan keys by prefix with optional cursor pagination.

```ts
const page = await ctx.storage.scan({ prefix: "cache/", limit: 100 })
const next = page.next
```

#### Reference

```ts
interface StorageContext {
  get(key: string): Promise<Json | undefined>
  set(key: string, value: Json): Promise<void>
  remove(key: string): Promise<void>
  scan(options: StorageScanOptions): Promise<StorageScanResult>
}

interface StorageScanOptions {
  prefix: string
  after?: string
  limit?: number
}

interface StorageScanResult {
  entries: readonly { key: string; value: Json }[]
  next?: string
}
```

### Tools

Read the tools currently registered, after every transform, outside of a transform callback. Each tool has an `id`
containing its effective name.

```ts
const tools = await ctx.tool.list()
const read = tools.find((tool) => tool.id === "read")
```

Register, update, and remove tools with a synchronous transform, including in Promise plugins. Load external data
before registering or reloading. A later valid registration overrides the same effective tool name.

```ts
const registration = await ctx.tool.transform((editor) => {
  editor.namespace({
    name: "acme",
    description: "Customer account tools",
  })
  editor.add({
    name: "greeting",
    description: "Create a greeting",
    input: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false,
    },
    options: { namespace: "acme", codemode: true },
    execute: async (input, context) => {
      await context.progress({ status: "greeting" })
      return { content: `Hello ${(input as { name: string }).name}!` }
    },
  })
})
```

Promise tool executors receive `context.signal`. Pass it to cancellable work such as `fetch` so stopping the Session
also stops the underlying operation.

```ts
execute: async ({ url }, context) => {
  const response = await fetch(url, { signal: context.signal })
  return { content: await response.text() }
}
```

Call `reload()` after changing source data captured by the callback. Reload replays the active transforms without
changing their order; it does not rerun plugin setup.

```ts
await ctx.tool.reload()
```

Use `list()` and `get()` to inspect tools currently in the editor. Tools have an `id` containing their effective name,
and `get()` returns `undefined` when that ID is not present. Use `update` and `remove` with the effective tool name,
including its namespace (`acme_greeting` above). Dots in
namespaces and unsupported characters in tool names become `_`. Missing names are ignored; creating a tool requires
`add` with a complete definition. Updates preserve the name and namespace. Assign new schemas or options to replace
them rather than mutating nested values. Invalid updates are logged and leave the previous definition intact.

```ts
await ctx.tool.transform((editor) => {
  editor.update("acme_greeting", (tool) => {
    tool.description = "Greet the user by name"
  })
  editor.remove("acme_obsolete")
})
```

Updates and removals replay in order with additions, including after MCP catalog refreshes. Disposing their
registration removes those changes and rebuilds from the remaining transforms.

Dispose a registration to remove its transform and rebuild from the remaining transforms, revealing any earlier
definition it overrode. Disposal is idempotent, and unloading the plugin also disposes its registrations.

```ts
await registration.dispose()
```

Each model request captures a stable, executable tool snapshot. Later transforms, reloads, and disposal affect future
snapshots, not the definitions, Code Mode namespace descriptions, or executors already captured. Executors that close
over mutable plugin data still observe that data; capture a value inside the transform when it must remain tied to
that definition.

#### Reference

Schemas: [`Tool.Content`](/api#schema-Tool.Content), [`Tool.TextContent`](/api#schema-Tool.TextContent),
[`Tool.FileContent`](/api#schema-Tool.FileContent)

```ts
interface ToolContext {
  list(): Promise<readonly (ToolInfo & { readonly id: string })[]>
  transform(callback: (editor: ToolEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface ToolEditor {
  list(): readonly (ToolInfo & { readonly id: string })[]
  get(id: string): (ToolInfo & { readonly id: string }) | undefined
  namespace(namespace: { name: string; description: string }): void
  add(tool: ToolInfo): void
  update(id: string, update: (tool: Types.Mutable<ToolInfo>) => void): void
  remove(id: string): void
}
```

### VCS

Read repository information, working-copy status, or file diffs.

```ts
const info = await ctx.vcs.get()
const branches = await ctx.vcs.branches({ search: "feature", limit: 10 })
const changes = await ctx.vcs.status()
const diff = await ctx.vcs.diff({ mode: "working", context: 3 })
```

Register a location-scoped VCS provider with a transform. A provider matching the detected repository type is selected
automatically; use `editor.default.set` to select a different provider.

```ts
await ctx.vcs.transform((editor) => {
  editor.add({
    id: "custom",
    name: "Custom VCS",
    info: async () => ({ branch: { current: "feature", default: "main" } }),
    branches: async (input, { signal }) => readBranches(input, signal),
    status: async (scope, { signal }) => readStatus(scope.worktree, signal),
    diff: async (input, { signal }) => readDiff(input, signal),
  })
  editor.default.set("custom")
})
```

Provider callbacks receive the current location, working-copy root, canonical project root, and optional repository
store. Diff callbacks also receive the selected mode, requested context, and output byte budget. Repository discovery
continues to use OpenCode's built-in Git and Mercurial detectors.

Providers can optionally implement `init(scope, { signal })` to create a repository in `scope.worktree`. Initialization
selects the provider by ID (Git by default), not by the detected repository type. Register a provider with `init` even
when the location has no repository yet; OpenCode checks that the directory exists and has no repository before calling
it, then rediscovers the project. New repository formats still need discovery support beyond this callback.

#### Reference

Schemas: [`Vcs.Info`](/api#schema-Vcs.Info), [`Vcs.FileStatus`](/api#schema-Vcs.FileStatus),
[`FileDiff.Info`](/api#schema-FileDiff.Info)

```ts
interface VcsContext {
  get(input?: VcsGetInput, requestOptions?: RequestOptions): Promise<VcsGetOutput>
  branches(input?: VcsBranchesInput, requestOptions?: RequestOptions): Promise<VcsBranchesOutput>
  status(input?: VcsStatusInput, requestOptions?: RequestOptions): Promise<VcsStatusOutput>
  diff(input: VcsDiffInput, requestOptions?: RequestOptions): Promise<VcsDiffOutput>
  transform(callback: (editor: VcsEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface VcsEditor {
  add(definition: VcsDefinition): void
  default: {
    get(): string | undefined
    set(providerID: string): void
  }
}

interface VcsDefinition {
  init?(scope: VcsScope, context: { signal: AbortSignal }): Promise<void>
  // Existing info, branches, status, and diff callbacks are required.
}
```

### Worktrees

Register a local worktree strategy using the normal plugin lifecycle. The implementation module in this example owns
option validation and the backend's `create`, `remove`, and `list` operations.

```ts title="plugins/worktrees/index.ts"
import { Plugin } from "@opencode/plugin"
import { makeStrategy } from "./strategy"

export default Plugin.define({
  id: "company.worktrees",
  async setup(ctx) {
    const strategy = makeStrategy(ctx.options)
    await ctx.worktree.transform((editor) => {
      editor.add(strategy)
    })
  },
})
```

Load the plugin through `plugins` and configure the common destination separately:

```jsonc title="opencode.jsonc"
{
  "worktree": { "directory": "../worktrees" },
  "plugins": [{ "package": "./plugins/worktrees", "options": {} }],
}
```

- Adding a strategy selects it automatically. The last active registration wins; no strategy-selection config is needed.
- Disposing its registration or unloading the plugin restores the previous implementation, ultimately the bundled Git strategy.
- `reload()` replays transforms after captured inputs change; it does not rerun plugin setup.
- Creation failures do not retry through Git. Existing worktrees retain their recorded owner even when the default changes.
- Strategies manage local directories. Remote workspace provisioning is not part of this interface.

#### Operations

The plugin context exposes the same project-based worktree operations as the client. Every operation requires a
`projectID`. `list` reads only saved inventory, including known checkouts of the same project; it does not load
configuration, start plugins, or discover filesystem changes.

```ts
const projectID = ctx.location.project.id
const created = await ctx.worktree.create({ projectID, name: "task" })
const inventory = await ctx.worktree.list({ projectID })
await ctx.worktree.refresh({ projectID })
await ctx.worktree.remove({ projectID, directory: created.directory, force: false })
```

Create loads configuration and plugins from the project's saved `canonical` directory and uses their selected strategy.
It accepts an optional parent `directory`, source `from`, starting `branch`, and `name`.
The source defaults to the canonical checkout, and a `from` override must belong to that project. Choosing a source
does not change the configuration root.
A supplied starting ref must be supported by the selected strategy;
Rift's native snapshot operation, for example, has no ref-selection option.

Create and refresh wait for the canonical checkout's plugins to activate. Calls made during that checkout's plugin
setup see registrations made so far and do not wait for their own activation.

Remove loads the canonical configuration and activates its plugins, then uses the worktree's recorded strategy rather
than the currently selected default. An unavailable recorded owner produces an error. The worktree's destination can
be elsewhere:

```ts
await ctx.worktree.remove({
  directory: "/worktrees/task",
  projectID,
  force: false,
})
```

Missing owners fail removal rather than falling back to Git. A strategy can throw `new Worktree.OperationError({
message: "Uncommitted changes", forceRequired: true })`, importing `Worktree` from `@opencode/plugin`, to request
force confirmation without depending on Core or Git errors.

Refresh loads canonical configuration and asks all available strategies to find worktrees across known checkout roots.
It combines results, preserves recorded ownership, and prunes missing directories. A failed discovery source is logged
while other sources continue. Existing directories remain saved even if no available strategy reports them. Observe
`worktree.updated` and call `list` again to read changed inventory.

```ts
await ctx.worktree.refresh({ projectID })
```

#### Reference

Implementations receive a suggested destination after naming and collision handling. Return the actual directory from
`create`; it may differ when a backend requires its own layout. OpenCode resolves the returned path and uses it for
inventory, startup commands, and the API result. The returned directory must exist.

Strategies choosing another destination handle naming collisions there. OpenCode still creates the suggested parent
directory before calling the strategy. `list` must report only directories the strategy owns, plus any repository roots.

```ts
interface WorktreeDefinition {
  readonly id: string
  create(
    input: { sourceDirectory: string; directory: string; branch?: string },
    context: { signal: AbortSignal },
  ): Promise<{ directory: string }>
  remove(input: { directory: string; force: boolean }, context: { signal: AbortSignal }): Promise<void>
  list(
    sourceDirectory: string,
    context: { signal: AbortSignal },
  ): Promise<readonly { directory: string; type: "root" | "worktree" }[]>
}

interface WorktreeEditor {
  add(definition: WorktreeDefinition): void
}

interface WorktreeDomain extends WorktreeApi {
  transform(callback: (editor: WorktreeEditor) => void): Promise<Registration>
  reload(): Promise<void>
}
```

Promise callbacks must cooperate with `signal` cancellation. Effect callbacks return Effects and use Effect interruption
instead. Registrations remain scoped to the plugin runtime; project operations use the canonical checkout's registry.
Core configuration adapters feed directory settings into that registry.

### Websearch

List websearch providers or run a query through the selected provider.

```ts
const providers = await ctx.websearch.providers()
const results = await ctx.websearch.query({ query: "OpenCode plugins", providerID: "internal" })
```

Register a provider and select the default provider with a transform.

```ts
await ctx.websearch.transform((editor) => {
  editor.add({
    id: "internal",
    name: "Internal search",
    execute: async ({ query }, { signal }) => {
      const response = await fetch(`https://search.example.com?q=${encodeURIComponent(query)}`, { signal })
      const result = await response.json()
      return [{ url: result.url, title: result.title, content: result.content, time: {} }]
    },
  })
  editor.default.set("internal")
})
```

Disable websearch by selecting `false`, or reload providers after external state changes.

```ts
await ctx.websearch.transform((editor) => editor.default.set(false))
await ctx.websearch.reload()
```

#### Reference

Schemas: [`WebSearch.Provider`](/api#schema-WebSearch.Provider), [`WebSearch.Result`](/api#schema-WebSearch.Result)

```ts
interface WebSearchContext {
  providers(input?: WebsearchProvidersInput, requestOptions?: RequestOptions): Promise<WebsearchProvidersOutput>
  query(input: WebsearchQueryInput, requestOptions?: RequestOptions): Promise<WebsearchQueryOutput>
  transform(callback: (editor: WebSearchEditor) => void): Promise<Registration>
  reload(): Promise<void>
}

interface WebSearchEditor {
  add(provider: WebSearchDefinition): void
  default: {
    get(): string | false | undefined
    set(providerID: string | false): void
  }
}
```

### Events

Subscribe to the connected server's public event stream. Abort the stream during plugin cleanup.

```ts
const controller = new AbortController()
void (async () => {
  for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
    console.log(event.type)
  }
})()
return () => controller.abort()
```

#### Reference

Schema: [`V2EventEncoded`](/api#schema-V2EventEncoded)

```ts
interface EventContext {
  subscribe(options?: { signal?: AbortSignal }): AsyncIterable<OpenCodeEvent>
}
```

## Hooks

Hooks intercept live operations. Register a hook on its domain and dispose the
returned registration when it is no longer needed.

```ts
const registration = await ctx.session.hook("context", () => {})
await registration.dispose()
```

Multiple plugins can register the same hook. OpenCode runs them in plugin order,
so later hooks see changes made by earlier hooks.

### Sessions

Session hooks intercept prompt admission, model calls, native HTTP, and retries.

#### Prompt admission

Intercept incoming user prompts before attachment and skill resolution and durable inbox admission:

```ts
await ctx.session.hook("prompt", (event) => {
  event.prompt.text = event.prompt.text.replaceAll("company-secret", "[redacted]")
  event.prompt.files ??= []
  event.prompt.files.push({ uri: "file:///project/policy.md" })
  event.metadata = { ...event.metadata, source: "company-policy" }
  event.delivery = "queue"
})
```

The hook receives an owned, mutable draft:

- `prompt` contains `text`, `files`, agent mentions in `agents`, and selected `skills`.
- `metadata` contains application-defined admission metadata.
- `delivery` is `"steer"` by default and can be changed to `"queue"`.
- Session and message IDs are readonly; a hook cannot redirect admission.

Files and skills added by a hook follow the normal resolution and validation
path. When rewriting text, update or remove attachment `mention` offsets that no
longer match. Agent mentions do not switch the session's active agent.

Prompt hooks run under these conditions:

- Hooks run in registration order after the session's location plugins are ready.
- Commands that submit through `session.prompt` run the hook.
- Synthetic messages, shell messages, compaction controls, and move controls do not.
- The hook runs once during admission, not before every model call.
- Provider scoping is unavailable because model resolution happens after admission.

Edits become the canonical persisted user input. If preparation fails or is
interrupted, OpenCode does not admit the prompt.

Keep prompt hooks retry-safe. They are not an exactly-once side-effect boundary:

- Retrying an ID already pending or delivered returns the original admission without rerunning hooks.
- Concurrent submissions can run hooks more than once, but only the first successful admission wins.
- Prompt hooks transform input and do not expose a typed rejection API.

#### Model requests

Modify assembled system instructions, messages, tools, or request options immediately before model dispatch. Each
kind of request a session issues has its own hook, so a plugin can treat the agent loop and auxiliary requests
differently:

- `context` runs for the agent loop, including tool-driven continuations.
- `compaction` runs for checkpoint summaries. `messages` is the transcript being summarized; OpenCode appends its
  summary prompt after hooks run. Set `result` to record the compaction yourself and skip the model call; it takes the
  same fields as a completed compaction message.
- `generate` runs for transient `ctx.session.generate` calls.
- `title` runs for title generation. It has no `agent` or `tools`. Set `result` to supply the title yourself.

```ts
await ctx.session.hook("context", (event) => {
  event.system.push({ type: "text", text: "Keep the review focused on correctness." })
  delete event.tools.write
  event.options.temperature = 0.2
  event.options.maxTokens = 8_000
})

await ctx.session.hook("compaction", async (event) => {
  event.result = { summary: await summarize(event.messages) }
})
```

Changes affect only the outgoing model call, not persisted history or configuration. A hook that should apply to
every request must register for each kind.

Request overrides follow these rules:

- `options` starts empty for each model call; it does not contain resolved model settings.
- Typed keys are generation settings; any other key is passed to the selected protocol as a provider option.
- Hooks run in registration order and see overrides made by earlier hooks.
- Request overrides take precedence over model defaults, which take precedence over route defaults.
- Provider option objects merge recursively; arrays and scalar values replace earlier values.
- Deleting an override or setting it to `undefined` falls back to configured defaults rather than removing them.
- Raw HTTP body overlays apply after protocol lowering and can override the resulting fields.

#### Provider options

Provider options use the selected protocol's semantic option names, not raw HTTP body fields. Scope provider-specific
settings to the matching provider. For example, OpenAI Responses uses `reasoningEffort`:

```ts
await ctx.session.hook(
  "context",
  (event) => {
    event.options.reasoningEffort = "high"
  },
  { providerID: "openai" },
)
```

Generation options depend on the selected protocol and model:

- `maxTokens` is the semantic output-token limit.
- Gemini supports `topK`; OpenAI Responses does not expose it.

#### Model request

Modify model request settings and optionally scope the hook to one provider. The event carries the same `kind`
as the HTTP hooks below.

```ts
await ctx.session.hook(
  "model.request",
  (event) => {
    event.headers["x-plugin"] = "review"
  },
  { providerID: "anthropic" },
)
```

#### Native HTTP

Modify native provider requests or responses. Their bodies are one-shot streams; clone or replace a body before reading
it.

Both hooks run for every request a session issues. `event.kind` says which flow issued it: `"primary"` for the agent
loop, `"compaction"` for checkpoint summaries, `"title"` for title generation, and `"generate"` for transient
`ctx.session.generate` calls. Use it instead of the agent ID to tell auxiliary requests apart.

```ts
await ctx.session.hook("http.request", (event) => {
  event.request.headers.set("x-session-id", event.sessionID)
  if (event.kind === "title") event.request.headers.set("x-priority", "background")
})

await ctx.session.hook("http.response", (event) => {
  event.response = new Response(event.response.body, {
    status: event.response.status,
    headers: { ...Object.fromEntries(event.response.headers), "x-plugin": "review" },
  })
})
```

#### Native WebSocket (experimental)

Providers that stream over a WebSocket open one connection per session and reuse it across requests, so
`http.request` and `http.response` never see that traffic. The `experimental.ws.handshake` hook runs once per model
call before the connection is selected. It carries the same `sessionID`, `agent`, `model`, and `kind` as the HTTP
hooks, plus the connection `url` and `headers`. Changing `url` or `headers` changes which socket the request uses, so a
rotated bearer token reopens the connection.

HTTP hooks still run for every HTTP request, including the request a WebSocket route falls back to.

```ts
await ctx.session.hook(
  "experimental.ws.handshake",
  async (event) => {
    event.headers.authorization = `Bearer ${await mintToken(event.url)}`
    delete event.headers["api-key"]
  },
  { providerID: "azure" },
)
```

`experimental.ws.send` and `experimental.ws.receive` expose the frames themselves, the WebSocket counterpart of
editing an HTTP request or response body. `send` runs after the provider driver builds an outbound frame and before it
is written; `receive` runs on each inbound frame before the driver observes it. Both carry the frame as a string and
send whatever `frame` holds when the hook returns.

OpenCode does not validate rewritten frames. The driver tracks state from the provider's replies, so a rewrite that
changes protocol meaning is the plugin's responsibility, just as a rewritten HTTP body is.

```ts
await ctx.session.hook(
  "experimental.ws.send",
  (event) => {
    const body = JSON.parse(event.frame)
    if (body.type === "response.create") body.metadata = { ...body.metadata, session: event.sessionID }
    event.frame = JSON.stringify(body)
  },
  { providerID: "openai" },
)

await ctx.session.hook("experimental.ws.receive", (event) => {
  if (event.frame.includes('"type":"error"')) console.error(event.frame)
})
```

These hooks are experimental and their names or shapes may change.

#### Retry policy

Override the retry decision for a provider failure or replace its delay in milliseconds. The hook runs after OpenCode
classifies the failure and proposes its policy, but before any retry is scheduled. It does not expose how OpenCode
internally performs the next attempt.

```ts
await ctx.session.hook("retry", (event) => {
  if (event.error.status === 429) {
    event.decision = { retry: true, delay: 10_000 }
    return
  }
  if (event.error.type === "provider.invalid-request" && event.attempt === 2) {
    event.decision = { retry: true, delay: 0 }
    return
  }
  if (event.attempt >= 3) event.decision = { retry: false }
})
```

Retry hooks can change OpenCode's initial `decision` by making a terminal failure
retryable or vetoing a proposed retry.

Retry decisions follow these rules:

- Multiple hooks run in registration order, and later hooks see the current decision.
- The built-in maximum attempt count remains a hard limit.
- `attempt` is the physical attempt under consideration. The initial request is `1`, so the first retry is `2`.
[showing lines 1-1511 of 1776; full output saved to C:\Users\fmatricard\.local\share\opencode\tool-output\tool_1a953f737001DD9M6ujnNEqzK0]

---

## Assistant

_Thinking:_

I have the core of the V2 plugin docs. Let me get the rest of the doc — the "Tool" hooks section and any remaining sections (lines 1511-1776), which will show `ctx.tool.hook` details and maybe `ctx.event` event types. Let me fetch the remainder by reading the saved output file... actually easier to fetch the raw file again but I can't get a range. Let me just read the saved tool output file for the rest.

Actually, the saved output is at C:\Users\fmatricard\.local\share\opencode\tool-output\tool_1a953f737001DD9M6ujnNEqzK0. Let me read from offset 1511.

**Tool: read**

**Input:**
```json
{
  "path": "C:\\Users\\fmatricard\\.local\\share\\opencode\\tool-output\\tool_1a953f737001DD9M6ujnNEqzK0",
  "offset": 1511,
  "limit": 270
}
```

Read file C:\Users\fmatricard\.local\share\opencode\tool-output\tool_1a953f737001DD9M6ujnNEqzK0, lines 1511-1776
1511: - `attempt` is the physical attempt under consideration. The initial request is `1`, so the first retry is `2`.
1512: - Invalid delays such as `NaN`, infinity, or negative values fall back to the computed delay.
1513: - Context-overflow recovery is separate because it compacts the conversation instead of retrying the same request.
1514: 
1515: #### Session reference
1516: 
1517: ```ts
1518: import type { SessionPrompt } from "@opencode/plugin/promise/session"
1519: 
1520: interface SessionHooks {
1521:   prompt: SessionPrompt
1522:   context: SessionContextHook
1523:   compaction: SessionContextHook & { result?: SessionCompactionResult }
1524:   generate: SessionContextHook
1525:   title: SessionRequestHook & { result?: string }
1526:   "model.request": SessionModelRequestHook
1527:   "http.request": SessionHttpRequestHook
1528:   "http.response": SessionHttpResponseHook
1529:   "experimental.ws.handshake": SessionWebSocketHandshakeHook
1530:   "experimental.ws.send": SessionWebSocketSendHook
1531:   "experimental.ws.receive": SessionWebSocketReceiveHook
1532:   retry: SessionRetryHook
1533: }
1534: 
1535: interface SessionWebSocketHandshakeHook {
1536:   readonly sessionID: string
1537:   readonly agent: string
1538:   readonly model: { providerID: string; id: string; variant?: string }
1539:   readonly kind: "primary" | "compaction" | "title" | "generate"
1540:   url: string
1541:   headers: Record<string, string>
1542: }
1543: 
1544: interface SessionWebSocketSendHook {
1545:   readonly sessionID: string
1546:   readonly agent: string
1547:   readonly model: { providerID: string; id: string; variant?: string }
1548:   readonly kind: "primary" | "compaction" | "title" | "generate"
1549:   frame: string
1550: }
1551: 
1552: interface SessionWebSocketReceiveHook {
1553:   readonly sessionID: string
1554:   readonly agent: string
1555:   readonly model: { providerID: string; id: string; variant?: string }
1556:   readonly kind: "primary" | "compaction" | "title" | "generate"
1557:   frame: string
1558: }
1559: 
1560: type RetryDecision = { retry: false } | { retry: true; delay: number }
1561: 
1562: interface SessionRetryHook {
1563:   readonly sessionID: string
1564:   readonly agent: string
1565:   readonly model: { providerID: string; id: string; variant?: string }
1566:   readonly error: { type: string; message: string; status?: number }
1567:   readonly attempt: number
1568:   decision: RetryDecision
1569: }
1570: 
1571: interface SessionRequestHook {
1572:   readonly sessionID: string
1573:   readonly model: { providerID: string; id: string; variant?: string }
1574:   system: SystemPart[]
1575:   messages: Message[]
1576:   options: {
1577:     maxTokens?: number
1578:     temperature?: number
1579:     topP?: number
1580:     topK?: number
1581:     frequencyPenalty?: number
1582:     presencePenalty?: number
1583:     seed?: number
1584:     stop?: string[]
1585:   } & Record<string, unknown>
1586: }
1587: 
1588: interface SessionContextHook extends SessionRequestHook {
1589:   readonly agent: string
1590:   tools: Record<string, { description: string; input: JsonSchema }>
1591: }
1592: 
1593: interface SessionCompactionResult {
1594:   summary: string
1595:   providerState?: Record<string, unknown>
1596:   metadata?: Record<string, unknown>
1597:   tokens?: TokenUsage
1598: }
1599: 
1600: interface SessionHookContext {
1601:   hook<Name extends keyof SessionHooks>(
1602:     name: Name,
1603:     callback: (event: SessionHooks[Name]) => Promise<void> | void,
1604:     options?: Name extends "prompt" ? never : { providerID?: string },
1605:   ): Promise<Registration>
1606: }
1607: ```
1608: 
1609: ### Permissions
1610: 
1611: Review permission decisions after configured rules are evaluated and before an
1612: action runs or a permission prompt is published.
1613: 
1614: ```ts
1615: await ctx.permission.hook("evaluate", async (event) => {
1616:   if (event.action === "read") return
1617: 
1618:   const messages = await ctx.session.context({ sessionID: event.sessionID })
1619:   const review = await ctx.generate.text({
1620:     model: { providerID: "anthropic", id: "claude-sonnet-4-6" },
1621:     prompt: buildSafetyPrompt({ messages, action: event.action, resources: event.resources }),
1622:   })
1623:   const decision = parseDecision(review.text)
1624: 
1625:   event.effect = decision.effect
1626:   event.message = decision.reason
1627: })
1628: ```
1629: 
1630: Permission hooks follow these rules:
1631: 
1632: - Hooks run for `allow` and `ask` decisions.
1633: - An explicit configured `deny` is final and does not invoke the hook.
1634: - A hook may change `effect` to `allow`, `ask`, or `deny`.
1635: - `message` appears in an escalated permission request or becomes the denial reason.
1636: 
1637: #### Reference
1638: 
1639: ```ts
1640: interface PermissionEvaluation {
1641:   readonly sessionID: string
1642:   readonly agent?: string
1643:   readonly action: string
1644:   readonly resources: readonly string[]
1645:   readonly metadata?: Record<string, unknown>
1646:   readonly source?: { type: "tool"; messageID: string; id: string }
1647:   effect: "allow" | "ask" | "deny"
1648:   message?: string
1649: }
1650: ```
1651: 
1652: ### Shell
1653: 
1654: Modify shell commands, working directories, timeouts, executables, or environment variables before execution.
1655: 
1656: ```ts
1657: await ctx.shell.hook("create.before", (event) => {
1658:   event.timeout = Math.min(event.timeout, 60_000)
1659:   event.env.COMPANY_ENV = "development"
1660: })
1661: ```
1662: 
1663: #### Reference
1664: 
1665: ```ts
1666: interface ShellHookContext {
1667:   hook(name: "create.before", callback: (event: ShellCreateBefore) => Promise<void> | void): Promise<Registration>
1668: }
1669: 
1670: interface ShellCreateBefore {
1671:   command: string
1672:   cwd: string
1673:   timeout: number
1674:   shell: string
1675:   env: Record<string, string | undefined>
1676: }
1677: ```
1678: 
1679: ### Tools
1680: 
1681: Inspect or replace tool input before execution.
1682: 
1683: ```ts
1684: await ctx.tool.hook("execute.before", (event) => {
1685:   if (event.tool === "read") console.log(event.input)
1686: })
1687: ```
1688: 
1689: Inspect successful results or failures after execution.
1690: 
1691: ```ts
1692: await ctx.tool.hook("execute.after", (event) => {
1693:   if (event.status === "completed") event.result = { ...event.result, metadata: { observed: true } }
1694:   if (event.status === "error") console.error(event.error.message)
1695: })
1696: ```
1697: 
1698: #### Reference
1699: 
1700: ```ts
1701: interface ToolHooks {
1702:   "execute.before": ToolExecuteBefore
1703:   "execute.after": ToolExecuteCompleted | ToolExecuteFailed
1704: }
1705: 
1706: interface ToolHookContext {
1707:   hook<Name extends keyof ToolHooks>(
1708:     name: Name,
1709:     callback: (event: ToolHooks[Name]) => Promise<void> | void,
1710:   ): Promise<Registration>
1711: }
1712: ```
1713: 
1714: ## Publish
1715: 
1716: A package plugin uses the same default export as a local plugin. A minimal
1717: manifest is:
1718: 
1719: ```json title="package.json"
1720: {
1721:   "name": "opencode-acme-plugin",
1722:   "version": "1.0.0",
1723:   "type": "module",
1724:   "exports": {
1725:     ".": "./src/index.ts",
1726:     "./rpc": "./src/rpc.ts"
1727:   },
1728:   "dependencies": {
1729:     "@opencode/plugin": "latest"
1730:   }
1731: }
1732: ```
1733: 
1734: The `./rpc` export is optional; include it when publishing a shared
1735: [RPC contract](/build/plugins/rpc) for other plugins and clients to import
1736: without loading your implementation.
1737: 
1738: Use versions compatible with the OpenCode release you target and test the
1739: installed package, not only a workspace-linked copy. Publish a compatible
1740: plugin update when you adopt a newer API contract.
1741: 
1742: ## Support V1
1743: 
1744: A plugin can support V1 and V2 from the same package entrypoint. Default export
1745: one object with a V1 `server()` function and a V2 `setup()` function:
1746: 
1747: ```ts title="src/index.ts"
1748: import { Plugin } from "@opencode/plugin"
1749: 
1750: export default {
1751:   ...Plugin.define({
1752:     id: "example",
1753:     async setup(ctx) {
1754:       await ctx.tool.hook("execute.before", () => {
1755:         console.log("A tool is about to run")
1756:       })
1757:     },
1758:   }),
1759:   async server() {
1760:     return {
1761:       "tool.execute.before": async () => {
1762:         console.log("A tool is about to run")
1763:       },
1764:     }
1765:   },
1766: }
1767: ```
1768: 
1769: - V1 calls `server()` and uses the returned hooks.
1770: - V2 reads the default export's `id` and `setup()` (or `effect()` for Effect plugins), ignoring `server()`.
1771: - Keep each implementation on its own API; sharing an export does not translate V1 hooks into V2 hooks.
1772: - Spread `Plugin.define(...)` into the exported object so it type-checks the V2 definition separately from `server()`.
1773: 
1774: The V1 object form is supported in OpenCode `1.18.29`. Older V1 releases may
1775: expect function exports instead; test the installed package with the oldest V1
1776: release you intend to support and with V2.

---

## Assistant

_Thinking:_

I now have a comprehensive understanding of the V2 plugin API:

- `Plugin.define({ id, setup(ctx) })` — `setup` runs at load, can return cleanup fn
- `ctx.event.subscribe({ signal })` — AsyncIterable of server events (`OpenCodeEvent`, schema `V2EventEncoded`)
- `ctx.tool.hook("execute.before/after", ...)` — tool lifecycle with `sessionID`, `tool`, `input`, `status`, etc.
- `ctx.session.*` — `get`, `context` (messages), etc.
- `ctx.permission.list/get/reply`, `ctx.permission.hook("evaluate", ...)`
- Options via `plugins: [{ package: "./plugins/x", options: {...} }]` → `ctx.options`
- Local plugins: `.opencode/plugins/` (auto-loaded), or configured via `plugins` in opencode.json(c)
- The plugin context is "essentially an OpenCode server client"

The event stream (`ctx.event.subscribe`) exposes `OpenCodeEvent` — the same public events as V1: `session.created`, `session.updated`, `session.idle`, `session.status`, `session.error`, `message.updated`, `message.part.updated`, `tool.execute.before`... hmm wait, in the docs above, tool events are hooks now (ctx.tool.hook), but the public event stream also carries tool events (V1 docs listed tool.execute.before/after as events). The schema is V2EventEncoded at /api#schema-V2EventEncoded. I can't fetch that page (403). I'll note uncertainty and design defensively: the plugin will normalize event types and fall back to hooks (ctx.tool.hook) for tool lifecycle — hooks are guaranteed.

Now the architecture question: how does the dashboard get live data?

Option A: Plugin runs its own HTTP server (Node/Bun) that:
- Serves the dashboard static frontend at http://localhost:PORT
- Exposes WebSocket / WS endpoint (or SSE) pushing live events
- Exposes REST endpoints for initial snapshot (sessions, messages)

This runs inside the OpenCode server process. The plugin is TypeScript; OpenCode runs on Bun. Bun's built-in HTTP server supports WebSocket upgrade (Bun.serve). If running under Node... OpenCode is Bun-based I believe (bun shell, `bun add` mentioned in docs). Using Bun's `Bun.serve` might not work if the server runs under Node. Safer: use a tiny dependency-free HTTP server via node:http + ws library? But adding dependencies requires them installed. Local plugins can use external npm packages ("Local plugins and custom tools can use external npm packages" — need package.json visible from the plugin file). We can create a package.json in the plugin directory and bun/npm install ws.

Alternatively, avoid WebSocket entirely and use SSE (Server-Sent Events) over plain node:http — SSE is just HTTP with text/event-stream; no extra dependency. And the dashboard only needs one-way live updates; commands are unnecessary. SSE works everywhere, no deps. That's the robust choice: zero runtime dependencies beyond node builtins.

Hmm, but wait: is `node:http` available? OpenCode server runs on Bun which implements node:http API. Also could use Bun.serve if available. I'll plan for `node:http` (Bun-compatible).

Option B: Dashboard frontend connects directly to the OpenCode server's event SSE stream (`GET /event`) and REST endpoints. Then the plugin isn't strictly needed except to serve static files/bridge. But direct connection has auth/discovery complexities and V2 API differences. The plugin-bridged approach (Option A) is cleaner and matches "create an opencode plugin".

Option A it is. 

Subagents: In the session JSON, subagents are invoked via the `subagent`/`task` tool. Actually in the log there's a "task" tool? Let me check... In the session-example.json there are tool calls named: read, glob, grep, edit, write, shell, execute. The system prompt mentions `subagent` tool with agent "explore"/"general". Child sessions exist: `session.remove` "recursively deletes child sessions", and Session.Info likely has a `parentID`. In the V1 data model, sessions had `parentID` for subagent sessions. The dashboard can display subagent activity by tracking sessions whose `info.parentID` is set (events `session.created`/`session.updated`), and also by the `subagent`/`task` tool call in the parent session. I'll design: track all sessions; group child sessions under parents; show subagent cards when a `task`/`subagent` tool is invoked and when child session messages stream.

State messages: derive agent state: idle → working (prompt admitted), reasoning (message.part.updated with reasoning part), tool running (tool.execute.before), waiting permission (permission events), idle/error (session.idle with outcome, session.error). The example log shows exactly these: agent-switched, idle messages with outcome succeeded/failed, provider errors.

Tool calling notice: live "Tool X running → completed in Nms" with inputs summary (e.g. edit: file path) from `tool.execute.before` (input) and `after` (status/metadata). The session JSON gives the shapes of tool state to backfill history: name, state.status, state.input, state.content, time.

Backfill: On dashboard connect, plugin can fetch recent sessions via ctx.session... but there's no ctx.session.list? The reference above shows create/get/context/remove... no list. Hmm. The client API (server) has session list endpoint (V1 had /session). ctx is "essentially an OpenCode server client" — its read/action methods match the client; the SessionContext interface shown lists only some. There may be more methods (the docs excerpt may be abridged). To be safe: the plugin keeps its own in-memory rolling buffer of recent activity from the moment it loads, and on dashboard connect sends the buffer. Optionally use ctx.client/HTTP to fetch sessions list if available. I'll note "initial snapshot = in-memory buffer since plugin load" and attempt session list via the client if available.

Port configuration: via plugin options in opencode.json(c): plugins: [{ package: "./plugins/agents-dashboard", options: { port: 4090 } }] → ctx.options.port. Also honor env var (e.g. DASHBOARD_PORT) and default (e.g. 4567?). If the port is busy, log a warning and try next port. The requirement: "give the option to change the port to display the dashboard frontend" — options config + env var.

Frontend look: from dashboardExample.png — dark theme (#0d0f14-ish), orange accent (#ff7a45/#e8590c), cards with rounded corners, subtle borders, top bar, right sidebar with:
- Agent status card ("Fable Copilot" → "OpenCode Agent"), state pill, checklist of current activities
- Activity feed (like "Scanning the chart" banner with progress)
- Stats: tokens, cost, tasks done
Main area: activity timeline resembling the candlestick chart area — a timeline of messages/tool calls; and bottom "Monthly P&L" → could be "Session stats" with big numbers (tokens, tool calls, files edited, duration).

Tech for frontend: zero-build single-file HTML+JS (vanilla) served by the plugin — simplest, no build step, lives in plugin dir. OR React+Vite built into the plugin. For "beautiful and modern", vanilla + hand-rolled CSS is fully capable (the design is mostly CSS). A React/Vite build adds toolchain complexity to the plugin repo. I'll ask the user? The user said "ask questions if required". I have a couple of genuine questions:

1. Deployment shape: project-local plugin in this repo (.opencode/plugins/agents-dashboard) vs standalone package (opencode-agents-dashboard) installed globally?
2. Frontend stack: zero-dependency vanilla HTML/CSS/JS vs React/Vite (needs build step)?
3. Monitor scope: only the current session (most recent active) vs all sessions with a session picker?
4. Should the dashboard auto-open the browser when OpenCode starts?

Maybe fold 4 into the plan as an option (auto-open configurable, default off/on?). Keep questions minimal: 3-4 max.

Also worth noting: V1 vs V2. The user's environment — are they on V2? The session log shows agents "plan"/"build" and this harness (OpenCode) with skills mentioning v2 docs. Today's opencode installed: unknown. The skill says answer for V2. I'll build for V2 with the compatibility option? Building dual V1/V2 support adds complexity; docs say a package can expose both. But local dir plugins: V2 uses Plugin.define. If user is on V1, plugin function export style. I'll ask? Better to keep the plan V2 and mention dual-export fallback as an implementation detail if their installed version is V1. Let me check quickly what version they run? I could run `opencode --version` via shell — allowed (read-only). In plan mode I shouldn't modify files; running a command to check version is fine. Actually the shell tool usage in plan mode for diagnostics is acceptable. Let me check.

Also verify Bun runtime availability for the HTTP server approach... the plugin runs inside OpenCode's process (Bun or Node?). OpenCode V2 — the repo uses Effect and Bun. `node:http` import works in both. Fine.

Plan structure:
1. Plugin skeleton: .opencode/plugins/agents-dashboard/ (or package) with package.json + index.ts using Plugin.define
2. Event collector: subscribe ctx.event.subscribe + ctx.tool.hook; normalize into Activity model
3. Bridge server: node:http server on configurable port; SSE /stream + GET /api/state snapshot; static files for UI
4. Frontend: dark/orange themed dashboard, panels:
   - Header: project, session title, LIVE badge, model, agent
   - Left/main: activity timeline (state messages, tool calls w/ icons + durations, errors)
   - Right sidebar: agent status card (current state pill, current tool), subagents cards, permissions waiting, stats (tokens/cost/duration)
   - Bottom: session stats big numbers
   - Reconnect logic, history backfill
5. Config: options.port (opencode.jsonc), env AGENTS_DASHBOARD_PORT, default 4590; auto-open browser option
6. Testing: replay script feeding session-example.json through the collector into the dashboard (mock mode) — nice: add a "demo mode" endpoint that replays the sample session so we can style without live sessions.

Wait — also consider: does ctx.event.subscribe give tool events? The EventContext reference says AsyncIterable<OpenCodeEvent>, schema V2EventEncoded. The V1 event list included tool.execute.before/after, message.part.updated, session.* etc. V2 likely the same bus. Since I also have ctx.tool.hook, tool lifecycle is guaranteed via hooks (with sessionID, agent, messageID, tool, input). message.part.updated events carry part updates (text/reasoning/tool state) — those come from the event stream. To be safe, the collector consumes both: hooks for tool start/end, event stream for session/message/permission events.

Hmm, one more thing to verify: message.part.updated payload shape in V2 (type/properties). I can't fetch /api docs (403). I'll design the normalizer defensively: handle both {type, properties:{...}} and flat event shapes.

I think I have enough. Let me also quickly check the user's opencode version via shell to tailor (V1 vs V2). Also check whether .opencode dir exists in the workspace.

I have the full plugin API picture now. Let me check the local environment (OpenCode version, existing config) to tailor the plan.

**Tool: shell**

**Input:**
```json
{
  "command": "opencode --version"
}
```

opencode : File C:\Users\fmatricard\AppData\Roaming\npm\opencode.ps1 cannot be loaded because running scripts is 
disabled on this system. For more information, see about_Execution_Policies at 
https:/go.microsoft.com/fwlink/?LinkID=135170.
At line:1 char:1
+ opencode --version
+ ~~~~~~~~
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess

Exited with code 1

**Tool: glob**

**Input:**
```json
{
  "pattern": ".opencode/**",
  "hidden": true
}
```

No files found

---

## Assistant

_Thinking:_

PowerShell execution policy blocks the .ps1 shim. Try opencode.cmd or reading the npm package version.

**Tool: shell**

**Input:**
```json
{
  "command": "opencode.cmd --version"
}
```

opencode v2.2.5


---

## Assistant

_Thinking:_

OpenCode v2.2.5 — V2 confirmed. The V2 plugin API applies.

Now I have everything needed. Let me analyze the session-example.json structure (given in prompt):

Key data shapes observed:
1. `info` — session: id, projectID, agent (current), model, cost, tokens {input, output, reasoning, cache}, outcome, time {created, updated, busy, idle, viewed}, title, location.directory
2. `messages[]` — types:
   - `user` — text, files[] (attachments w/ mime + mention), agents[]
   - `assistant` — agent ("plan"/"build"), model, content[] (reasoning / text / tool parts), finish ("tool-calls"/"stop"/"error"), tokens per message, cost
   - `tool` content part: id, name (read/glob/grep/edit/write/shell/execute/subagent…), state {status: completed|error|running?, input, content, metadata, error}, time {created, ran, completed}
   - `synthetic` — text + description (system-injected notes)
   - `idle` — marks turn end: outcome succeeded|failed, error details
   - `agent-switched` — agent, previous
   - `system` — text + description
3. Errors: finish:"error" with error {type: provider.invalid-output/provider.invalid-request/tool.execution, message}
4. Subagents: the `subagent` tool (system prompt) — child sessions. In this log there's no subagent call but the harness defines it. Dashboard must handle `subagent`/`task` tool + child sessions (session.created events with parentID).

Dashboard style from the PNG: dark background, orange accent, top bar with repo title/star/fork, asset cards row, main chart, right sidebar (agent panel with checklist, overview, positions, today stats, toggle), bottom stats banner. Map to:
- Top bar: project name + session title + LIVE badge
- Cards row (like BTC/ETH/SOL/XRP): agent status / tokens / cost / tool calls — 4 stat cards
- Main "chart" area: live activity timeline (messages, tool calls as vertical ticks/blocks) — like candlesticks we can do a timeline stream visualization
- Banner: current state message "Scanning the chart" → e.g. "Reading files…"
- Right sidebar: current agent card (state pill, checklist of running ops), Subagents panel, AI overview (last reasoning snippet), permissions
- Bottom: session stats big numbers (duration, tokens, tools, edits) + mini sparkline of activity

Now the questions. I'll ask 4 concise questions:
1. Plugin shape: local in this repo (.opencode/plugins/) vs standalone npm package vs both
2. Frontend stack: vanilla zero-dep single file vs React/Vite
3. Scope: track the most recent active session only vs all sessions (+picker)
4. Auto-open browser on start: yes/no/configurable

Then present the full plan. Actually, the user asked: "propose me a plan and ask questions if required" — so I should present the plan AND the questions together. Let me write the plan in the chat, then ask the questions with the question tool. Plan mode says discuss plan directly in conversation; don't create plan files unless asked. Good — no file writes.

Let me formulate the plan concisely but completely:

## Architecture
- OpenCode V2 plugin (`@opencode/plugin`, Plugin.define, setup(ctx)) — verified your install: v2.2.5
- Plugin runs inside the OpenCode server process; starts an embedded HTTP server (node:http, zero runtime deps; Bun-compatible)
  - Serves dashboard UI (static)
  - `GET /api/state` → snapshot (sessions, current state, buffered activity)
  - `GET /stream` (SSE) → live events pushed to browser
- Data collection:
  - `ctx.event.subscribe()` for session.created/updated/idle, message.part.updated (text/reasoning/tool state), permission.* etc.
  - `ctx.tool.hook("execute.before"/"execute.after")` for guaranteed tool lifecycle (name, input, duration, status)
  - `ctx.session.get/context` for backfill of the active session on dashboard connect
- Derived states: idle / thinking (reasoning streaming) / running tool X / waiting permission / error / finished
- Port: plugin options in opencode.jsonc `{ package: "./plugins/agents-dashboard", options: { port: 4090, autoOpen: true } }`, fallback env AGENTS_DASHBOARD_PORT, default 4590; auto-increments if busy and logs the URL.

## Dashboard UI (inspired by your PNG)
- Dark + orange accent, cards, rounded, subtle borders
- Top bar: project + session title + model + LIVE dot + connection status
- 4 stat cards: current agent/state, tokens, cost, tool-call count (tick up live)
- Main panel: "current activity" banner (like "Scanning the chart") + live activity timeline (tool calls with icons, durations, file targets; state messages; errors in red)
- Right sidebar: agent status card w/ checklist of running ops; subagent cards (from subagent tool calls/child sessions) with nested status; permission requests inline (allow/deny display); AI overview = last reasoning snippet
- Bottom banner: session big-number stats (duration, messages, tool calls, files edited) + activity sparkline
- Frontend: single-page, reconnects automatically, replays demo (session-example.json) in demo mode for styling without live traffic

## Repo layout (if local)
- plugins/agents-dashboard/
  - package.json (name, @opencode/plugin dep)
  - src/index.ts (Plugin.define, server bootstrap, options)
  - src/collector.ts (event normalization → store)
  - src/store.ts (rolling buffer + session registry)
  - src/http.ts (SSE + REST + static)
  - public/index.html|app.js|style.css (the dashboard)
- opencode.jsonc: plugins entry with options { port }
- README

## Testing
- `npm run demo` → replays session-example.json against a local mock server so we can see the dashboard populated before wiring live events
- Manual: run opencode, give it a task, watch dashboard

Then questions.

OpenCode v2.2.5 confirmed — the modern V2 plugin API applies. I have everything I need to propose the plan.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "header": "Distribution",
      "options": [
        {
          "description": "Lives in .opencode/plugins/agents-dashboard in this project; auto-loaded by OpenCode, easiest to iterate",
          "label": "Local in this repo (Recommended)"
        },
        {
          "description": "Installable anywhere via opencode.jsonc; more setup, but reusable across projects",
          "label": "Standalone npm package"
        },
        {
          "description": "Develop locally now, structured so it can be published later with minimal changes",
          "label": "Both (local now, publishable later)"
        }
      ],
      "question": "How should the plugin be packaged and loaded?"
    },
    {
      "header": "Frontend stack",
      "options": [
        {
          "description": "Single HTML/JS/CSS bundle served by the plugin. No build step, zero dependencies, easy to maintain",
          "label": "Vanilla JS + CSS (Recommended)"
        },
        {
          "description": "Nicer component structure and theming, but requires a build step and node_modules in the plugin",
          "label": "React + Vite"
        },
        {
          "description": "Middle ground: tiny components + hand-rolled CSS, build optional",
          "label": "Preact/htmx-style micro stack"
        }
      ],
      "question": "What should the dashboard frontend be built with?"
    },
    {
      "header": "Session scope",
      "options": [
        {
          "description": "Shows what the current/last active session and its subagents are doing — cleaner, matches 'one session' goal",
          "label": "Active session only (Recommended)"
        },
        {
          "description": "Sidebar with session list to switch between; more complex but useful for parallel work",
          "label": "All sessions + picker"
        },
        {
          "description": "Shows all sessions side by side, each with its own status card",
          "label": "All sessions, tiled"
        }
      ],
      "question": "Which sessions should the dashboard monitor?"
    },
    {
      "header": "Auto-open",
      "options": [
        {
          "description": "Dashboard opens in your browser as soon as the plugin's server starts",
          "label": "Yes, auto-open (Recommended)"
        },
        {
          "description": "Just print the dashboard URL in the OpenCode log/TUI; you open it yourself",
          "label": "No, only log the URL"
        },
        {
          "description": "Default off, enabled via the plugin's autoOpen option in opencode.jsonc",
          "label": "Configurable, default off"
        }
      ],
      "question": "Should the dashboard auto-open the browser when it starts?"
    }
  ]
}
```

User has answered your questions: "How should the plugin be packaged and loaded?"="Both (local now, publishable later)", "What should the dashboard frontend be built with?"="Vanilla JS + CSS (Recommended)", "Which sessions should the dashboard monitor?"="All sessions, tiled", "Should the dashboard auto-open the browser when it starts?"="Yes, auto-open (Recommended)". You can now continue with the user's answers in mind.

---

## Assistant

_Thinking:_

The user answered:
1. Both (local now, publishable later)
2. Vanilla JS + CSS
3. All sessions, tiled
4. Yes, auto-open

Now I present the final consolidated plan. I should NOT write files (plan mode). Present the plan in chat.

Important detail for "All sessions, tiled": the dashboard will show a grid of session cards, each with its own status; a detail focus view when clicking a card. Subagents nested within their parent session card.

Also for "publishable later": structure the plugin dir as its own npm package (package.json with name `opencode-agents-dashboard`, exports ".", files, dependencies @opencode/plugin). Locally it can be referenced in opencode.jsonc via `{ "package": "./plugins/agents-dashboard", "options": {...} }` — wait, configured local paths must name directories. The docs said: "Configured local paths must name directories" — `./plugins/local` in examples is a directory containing the plugin default export (index.ts). V2 discovers `.opencode/plugins/` automatically for loose files, but a configured path must be a directory with the package. So plan: `plugins/agents-dashboard/` directory with package.json + src/index.ts; load via opencode.jsonc plugins entry with options (so we get port options). Note: deps — @opencode/plugin must be installed in that directory (bun/npm install) or bun auto-installs? Docs: "Install dependencies in a package.json visible from the plugin file" — so we run install in that folder.

Port options: ctx.options.port; env AGENTS_DASHBOARD_PORT; default 4590. autoOpen option (default true), env override OPENCODE_DASHBOARD_NO_OPEN. If port busy: scan upward, log final URL. The plugin logs via console.log (shows in server log) — or use ctx.client? V2 has no explicit log API shown; console.log is fine (goes to opencode log).

Frontend details for "tiled" all-sessions: grid of session tiles; each tile: header (title, agent pill, LIVE/idle dot), current activity line, mini tool-feed (last ~5), stats row (tokens, tools, duration); click → expanded focus view with full timeline + subagents + reasoning peek; global top bar with connection status + aggregate stats. Subagent sessions: detected via session info parentID (session.created/updated events) and/or subagent tool call; rendered as nested chips inside parent tile + detail rows.

Data backfill: on connect, GET /api/state returns buffered state; for sessions that existed before plugin load, attempt ctx.session... there's no list in the shown interface; but ctx is a server client — likely ctx has more (the docs interface may be partial). Plan states: best-effort backfill via server API if available (session list), else starts from plugin load. Fine.

Deliverables/milestones:
1. Scaffold plugin package + opencode.jsonc wiring + port/option plumbing
2. Collector (events + tool hooks → normalized store) with unit-testable pure normalizer
3. HTTP bridge (static + /api/state + /stream SSE) + auto-open
4. Dashboard UI (top bar, tiles grid, focus view, subagents, permissions, stats) styled per PNG
5. Demo replay mode: `bun run demo` replays session-example.json into a mock store + serves UI (lets us verify visuals against the sample data)
6. README + publish prep (files/exports/version)

I'll present this compactly. Also note risks/unknowns: exact V2 event payload shapes (V2EventEncoded) will be confirmed against the running server during implementation (we can introspect via opencode api / openapi). That's honest.

Keep it tight.

Great — decisions locked in. Here's the full plan:

## Plan: `opencode-agents-dashboard` plugin

### How it works (architecture)

```
OpenCode server process
└── Plugin (runs inside, @opencode/plugin V2 — matches your v2.2.5)
    ├── Collector ──► ctx.event.subscribe()   → session.*, message.part.updated, permission.*
    │             └─► ctx.tool.hook(before/after) → guaranteed tool lifecycle (name, input, duration, status)
    ├── Store ──► normalized in-memory model: sessions → turns → activity items (state msgs, tool calls, errors, subagent events)
    └── Bridge server (node:http, zero runtime deps, Bun-compatible)
        ├── GET /           → dashboard UI (static vanilla JS/CSS)
        ├── GET /api/state  → snapshot for initial paint + backfill
        └── GET /stream     → SSE push of live events (auto-reconnect in browser)
```

The plugin never writes to your sessions — it's a read-only observer. No extra deps beyond `@opencode/plugin` (SSE needs no WebSocket library, works identically under Bun/Node).

**Data mapping from `session-example.json`** (verified shapes):
- Agent state derived: `idle → thinking` (reasoning part streaming) `→ running tool` (tool.execute.before) `→ waiting permission / error / done` (`idle` messages with `outcome: succeeded|failed`, `provider.invalid-output` errors, etc.)
- Tool calls: name, inputs summary (e.g. `edit → core.py`, `shell → uv run python…`), status, duration from `time.ran→completed`
- Agent switches (`agent-switched`: plan ↔ build), synthetic/system notices, per-message token counts
- Subagents: `subagent` tool calls in the parent + child sessions tracked via session events; rendered nested under their parent

### Dashboard UI (styled after your PNG: dark + orange accent, cards, soft borders)
- **Top bar**: project + session title, model, LIVE dot with connection status
- **Stat cards row** (like BTC/ETH/SOL/XRP): current state · tokens · cost · tool calls — ticking live
- **Tile grid — all sessions**: each tile = mini "chart card" with agent pill, current activity line ("Reading files…"), last-5 tool feed, stats row; click → focus view with full timeline, reasoning peek, errors in red
- **Subagents**: nested chips inside parent tile + dedicated rows in focus view, with their own status/duration
- **Permissions**: inline notice when the agent is waiting on you
- **Bottom banner** (like Monthly P&L): session big-numbers — duration, messages, tool calls, files edited + activity sparkline
- Demo mode: `npm run demo` replays `session-example.json` into the UI so we can validate the design against real data before wiring live traffic

### Port & options (your requirement)
- `opencode.jsonc` → `plugins: [{ package: "./plugins/agents-dashboard", options: { port: 4090, autoOpen: true } }]` → read from `ctx.options`
- Env fallback `AGENTS_DASHBOARD_PORT`; default `4590`; auto-increments if busy and logs the final URL; `autoOpen` launches the browser on start (configurable via `AUTO_OPEN=false` too)

### Layout (local now, publishable later)
```
plugins/agents-dashboard/        ← its own npm package (opencode-agents-dashboard)
├── package.json                 ← exports ".", files, deps: @opencode/plugin
├── src/index.ts                 ← Plugin.define, setup: options, server bootstrap, auto-open
├── src/collector.ts             ← events/hooks → pure normalizer
├── src/store.ts                 ← rolling buffer, session registry
├── src/http.ts                  ← static + REST + SSE
└── public/                      ← index.html, app.js, style.css
opencode.jsonc                   ← plugin entry with options
README.md
```
Publishing later = `npm publish` + switching the config entry to the package name — no code changes.

### Build order
1. Scaffold package + `opencode.jsonc` wiring + option/env/port plumbing
2. Collector + store (pure, testable normalizer)
3. HTTP bridge (SSE + snapshot + auto-open)
4. Dashboard UI (tiles, focus view, subagents, stats) against demo replay
5. Live verification with a real session; polish pass
6. README + publish prep

### Known risk / how we handle it
The exact V2 wire shape of `message.part.updated` payloads isn't fully documented in what I could access (the `/api` schema page 403s). The collector normalizes defensively and during implementation we'll introspect the live stream (`opencode api` / logs) to pin the real shapes — hooks (`ctx.tool.hook`) are the guaranteed fallback for tool data.

Ready to implement on your go — just switch agents (I'm in Plan mode, so I won't touch any files until you switch to Build). Want anything adjusted first — e.g. accent color, default port, or extra panels (todo list, git diff)?
