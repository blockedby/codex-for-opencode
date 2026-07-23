# codex-for-opencode

OpenCode plugin that delegates work directly to a short-lived Codex CLI agent.

## Tools

- `codex_task`: delegates a bounded task to `codex exec --json` in OpenCode's current directory.
- Set `web_search: true` to invoke Codex with `--search`, exposing Codex's native live `web_search` tool to the delegated agent.
- Delegated sessions use `gpt-5.6-luna` by default. Supply `model` to override it for one task.

Codex, not this plugin, chooses and uses its internal tools. The plugin returns Codex's final response rather than parsing or summarizing web evidence itself.

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

In a restarted OpenCode session, ask it to use `codex_task` with `web_search: true` for a current topic. It should expose the `codex_task` plugin tool.

## Safety

`codex_task` runs only in the active OpenCode directory. Select `read-only` unless writes are required. When `web_search` is enabled, network access and source selection are governed by Codex's native tool behavior.
