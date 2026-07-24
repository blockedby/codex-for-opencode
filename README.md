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

Install globally from GitHub with OpenCode's plugin manager:

```bash
opencode plugin "codex-for-opencode@git+https://github.com/blockedby/codex-for-opencode.git" --global
```

This adds one package entry to the global OpenCode configuration. The plugin registers its bundled `skills/` directory through the OpenCode `config` hook, so no separate `skills.paths` entry or symlink is needed. Because the repository is private, Git must already be authenticated for `github.com` on the machine running OpenCode; `gh auth setup-git` configures Git to use the active GitHub CLI credentials.

The resulting plugin entry is:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "codex-for-opencode@git+https://github.com/blockedby/codex-for-opencode.git"
  ]
}
```

For local development, clone the repository, run `npm install`, and reference `plugin/codex-tools.ts` as shown in the checked-in `opencode.jsonc`. The same config hook registers the adjacent skills directory.

Quit and restart OpenCode after installation or configuration changes. Plugins and skills are loaded at startup.

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
cd /tmp
opencode debug config
opencode debug skill
```

`npm test` type-checks the plugin and validates every bundled skill's YAML frontmatter. `npm pack --dry-run` confirms that the distributable contains the plugin and skills. In a restarted OpenCode session, `opencode debug config` should resolve the plugin and its `skills/` path under OpenCode's installed package cache, not the source checkout. `opencode debug skill` should include `codex-tools`, and the model should see `web_search_codex`, `web_fetch_codex`, `apply_patch_codex`, and `codex_task`.

## Update

Reinstall the Git-backed plugin when the cached package does not refresh automatically:

```bash
opencode plugin "codex-for-opencode@git+https://github.com/blockedby/codex-for-opencode.git" --global --force
```

## Safety

All tools run in the active OpenCode directory. Select `read-only` unless writes are required. Web tools use Codex's native behavior for network access and source selection.
