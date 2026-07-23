# codex-for-opencode

OpenCode plugin that exposes the Pi Codex tool set through short-lived Codex CLI agents.

## Tools

- `web_search_codex`: uses Codex's native web search and fetch capabilities to return structured search results.
- `web_fetch_codex`: uses Codex's native web capabilities to read a specific URL and return a structured extraction.
- `apply_patch_codex`: asks Codex to validate or apply a patch in the active OpenCode directory.
- `codex_task`: delegates a bounded implementation, review, debugging, research, or test task to Codex.

Web-enabled tools invoke `codex --search`; no Brave, DuckDuckGo, or local HTTP client is used. All delegated sessions use `gpt-5.6-luna` by default. Supply `model` to override it for one task.

Codex, not this plugin, chooses and uses its internal tools. The plugin returns Codex's final response rather than fetching, extracting, or summarizing web evidence itself.

## Requirements

- OpenCode 1.18.4 or later
- Node.js and npm
- An authenticated `codex` CLI on `PATH`

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

In a restarted OpenCode session, it should expose `web_search_codex`, `web_fetch_codex`, `apply_patch_codex`, and `codex_task`.

## Safety

All tools run in the active OpenCode directory. Select `read-only` unless writes are required. Web tools use Codex's native behavior for network access and source selection.
