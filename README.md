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

- OpenCode 2.0.26 or later (V1 plugins are not compatible with V2)
- Node.js 24 or later and npm
- An authenticated `codex` CLI on `PATH`

## Install

Install globally from GitHub with OpenCode's plugin manager:

```bash
opencode plugin add "git+https://github.com/blockedby/codex-for-opencode.git#main"
```

This adds one package entry to the global OpenCode configuration. The V2 plugin registers its four tools and bundled skill through domain transforms, so no separate skills configuration or symlink is needed.

The resulting plugin entry is:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "git+https://github.com/blockedby/codex-for-opencode.git#main"
  ]
}
```

For local development, clone the repository, run `npm install`, and reference the `./plugin` directory as shown in the checked-in `opencode.jsonc`. OpenCode 2.0.26 loads local directories through `index.ts`, not configured standalone files. Tool execution resolves the current session directory rather than using the plugin's startup location, and session cancellation terminates the Codex process tree.

Configuration changes normally reload automatically. Run `opencode reload` if the active plugin list has not refreshed.

## Verify

Check the source package:

```bash
cd ~/code/tools/codex-for-opencode
npm test
npm pack --dry-run
codex --version
```

Then verify the globally installed package from a neutral directory outside the checkout:

```bash
cd /tmp/opencode
opencode plugin list
opencode api get /api/skill
```

`npm test` compiles and type-checks with TypeScript 7, validates skill frontmatter, and tests V2 registration and all four executors against a fake Codex CLI. `npm pack --dry-run` verifies the distributable contains compiled JavaScript and the skill. Compiled `dist/` files are checked into Git: run `npm run compile` after source changes and commit the generated files. Git installs require no lifecycle build scripts, avoiding OpenCode's bundled installer's Git preparation failure. The JavaScript entrypoint also avoids stripping TypeScript inside `node_modules`. The active plugin list should include `codex-for-opencode`, the skill list should include `codex-tools`, and the model should see `web_search_codex`, `web_fetch_codex`, `apply_patch_codex`, and `codex_task`.

## Update

Update a moving Git ref explicitly when necessary:

```bash
opencode plugin update "git+https://github.com/blockedby/codex-for-opencode.git#main"
```

## Safety

All tools run in the active OpenCode directory. Select `read-only` unless writes are required. Web tools use Codex's native behavior for network access and source selection.
