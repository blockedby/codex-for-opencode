# codex-for-opencode

OpenCode plugin tools backed by deterministic web evidence and short-lived Codex CLI sessions.

## Tools

- `web_search_codex`: Brave Search when `BRAVE_SEARCH_API_KEY` is set, otherwise DuckDuckGo HTML search. Codex can summarize only the returned results.
- `web_fetch_codex`: public HTTP(S) fetching with DNS, private-network, and redirect checks. It extracts readable text or Markdown, then Codex can summarize only that content.
- `codex_task`: delegates a bounded coding task to `codex exec --json` in OpenCode's current directory.

This plugin deliberately does not duplicate OpenCode's native `apply_patch`, `webfetch`, or optional `websearch` tools.

## Requirements

- OpenCode 1.18.4 or later
- Node.js and npm
- An authenticated `codex` CLI on `PATH`
- Optional: `BRAVE_SEARCH_API_KEY` for Brave Search; without it, search uses DuckDuckGo's HTML endpoint

## Install

Install the package dependencies:

```bash
cd ~/code/tools/codex-for-opencode
npm install
```

The checked-in `opencode.jsonc` enables the plugin and skill whenever OpenCode starts from this directory. To use it from every project, add the same paths to your global configuration instead.

Add this plugin and skill directory to `~/.config/opencode/opencode.jsonc`. Preserve existing configuration fields.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "file:///home/<user>/code/tools/codex-for-opencode/plugin/codex-tools.ts"
  ],
  "skills": {
    "paths": [
      "/home/<user>/code/tools/codex-for-opencode/skills"
    ]
  }
}
```

Replace `<user>` with the local username. Quit and restart OpenCode after changing plugins or skills: OpenCode loads them only at startup.

## Verify

```bash
cd ~/code/tools/codex-for-opencode
npm test
codex --version
opencode debug config
```

In a restarted OpenCode session, ask it to use `web_search_codex` for a current topic. It should expose the three plugin tools above.

## Safety

`web_fetch_codex` accepts only public HTTP(S) destinations and checks every redirect before following it. It rejects URL credentials, local names, and DNS resolutions containing private or reserved network addresses. `codex_task` runs only in the active OpenCode directory; select `read-only` unless writes are required.
