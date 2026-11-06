# Next steps — publishing & maintaining `opencode-agents-dashboard`

Current state: the plugin is feature-complete and verified (v0.2.1).
`npm publish --dry-run` passes with a clean tarball. The only thing
missing before the real publish is **npm authentication on this machine**.

---

## 1. Log in to npm (one-time, interactive — only you can do this)

```sh
cd C:\myAI\20261105-agentsdashboard\plugins\agents-dashboard
npm whoami        # → ENEEDAUTH today; after login prints your username
npm adduser       # opens a browser to authenticate npmjs.com
```

- If you already have an npm account: `npm adduser` links this machine to it.
- If 2FA is enabled on your account, keep your authenticator handy — publish
  will ask for an OTP (or use an automation token, see §4).

## 2. Publish

```sh
cd C:\myAI\20261105-agentsdashboard\plugins\agents-dashboard
npm publish --access public
```

Then verify it landed:

```sh
npm view opencode-agents-dashboard version
```

What gets shipped (verified via `npm publish --dry-run`):
`src/`, `public/`, `scripts/`, `README.md`, `package.json` — 28.3 kB tarball,
no `node_modules`.

## 3. Use it in any project

After publishing, in any project's `opencode.json(c)`:

```jsonc
{
  "plugins": [
    { "package": "opencode-agents-dashboard", "options": { "port": 4090, "autoOpen": true } }
  ]
}
```

or install it globally for every project:

```sh
opencode plugin add opencode-agents-dashboard
```

Note: `opencode plugin add` writes the entry to the **global** config
(`~/.config/opencode/opencode.json(c)`); edit it there into the object form
shown above if you need custom `port`/`autoOpen`. Package plugins install into
OpenCode's own managed cache — there is no `npm install` step for consumers,
and updates flow via `opencode plugin update` (§4).

The dashboard then starts with OpenCode and prints its URL
(`[agents-dashboard] dashboard running at …`).

## 4. Updating later

```sh
# release a fix/feature
cd C:\myAI\20261105-agentsdashboard\plugins\agents-dashboard
npm version patch          # 0.2.0 → 0.2.1 (or `minor` / `major`)
npm publish --access public

# update machines using the installed package
opencode plugin update opencode-agents-dashboard
```

Automation tokens: if you publish from CI or want to skip OTP prompts, create
a Granular Access Token on npmjs.com (Access Tokens → Generate) and publish with
`NPM_CONFIG_//registry.npmjs.org/:_authToken=<token> npm publish`.

## 5. Optional but recommended

- **Git**: this workspace is not a git repo yet. `git init` + push to GitHub,
  then add `"repository": { "type": "git", "url": "https://github.com/<you>/opencode-agents-dashboard" }`
  to `plugins/agents-dashboard/package.json` so npm shows a repo link.
- **CI publish**: a GitHub Action on tag push can run `npm publish` with the
  token from §4.
- **Screenshots**: add 1–2 dashboard screenshots to this README before publishing —
  visual plugins sell themselves.

## 6. Local development loop (no publishing needed)

- `npm run demo`   → replays `session-example.json` at http://127.0.0.1:4099
- `npm test`       → boots setup() against a fake host, asserts bridge + UI
- The running OpenCode service watches the plugin's source files and reloads on
  save; hard-refresh the dashboard tab (Ctrl+F5) to pick up UI changes.
- If the tab goes OFFLINE after a reload race, the current URL is in the log
  (`[agents-dashboard] dashboard running at …`) — or restart OpenCode cleanly.

## Troubleshooting publish

| Symptom | Fix |
| --- | --- |
| `ENEEDAUTH` | run `npm adduser` (§1) |
| `ENEEDAUTH` on publish despite login | OTP required — have your 2FA ready or use a token (§4) |
| name taken | bump `version` or pick a scoped name `@<npmuser>/opencode-agents-dashboard` |
| 403 on publish | package name conflict or token without publish rights |
