# Native image generation through Codex CLI

Use this route when the user specifically requests Codex image generation or an end-to-end test, the parent host has no native image tool, and running Codex is permitted. The parent host's missing tool does not establish that the installed Codex CLI lacks it.

## Read-only preflight

```sh
codex --version
codex features list
codex login status
codex exec --help
```

Check that `image_generation` is available/enabled and the CLI reports ChatGPT sign-in. Do not read auth files, dump configuration/environment values, or request credentials. If sign-in is missing, return the blocker to the user. Do not replace it with API billing. If a future CLI changes the capability or options, use its actual help/docs rather than guessing flags or relying on this test forever.

## Bounded generation

Use a new scratch directory, a non-sensitive prompt and the installed `$codex-image-gen` / `$imagegen` skills. Do not send unrelated workspace contents to the child. For a smoke test, request one simple original image, no text/branding, and no iteration or further delegation.

An example POSIX command, after confirming these options exist in the installed CLI:

```sh
env -u OPENAI_API_KEY -u CODEX_API_KEY codex exec \
  --ephemeral --skip-git-repo-check --sandbox workspace-write \
  --cd /absolute/path/to/new-scratch-directory \
  --color never \
  --output-last-message /absolute/path/to/new-scratch-directory/result.json \
  - < /absolute/path/to/new-scratch-directory/prompt.md
```

On a background-only host, launch this command through its **background-capable** execution tool with a finite time bound. Do not use a foreground `codex_task` wrapper, poll completion, or create further agents. Keep the main conversation available and process the automatic completion notification. Follow the host's process-tree cancellation rules on interruption.

The prompt should require:

- Native Codex image generation under the existing ChatGPT sign-in only; no image API runner, API key, browser account actions, downloads or code-drawn substitute.
- One requested image; no unrelated code/config changes, publishing or Git actions.
- The exact returned native artifact path and, if possible, a non-destructive copy into the scratch directory. Never select a recent image from another session.
- A final structured status with artifact path, saved path, inspection result and any actual blocker. A success claim without a real file is not a passed test.

Remove API-key variables from the child environment without logging their values. Do not override the user's configured model/provider or install new credentials just to make the test pass. Native generation still uses the user's included Codex usage; it is not cost-free.

## Verify the actual output

Check that the returned file exists, is decodable, and matches the copied artifact. Inspect the image visually for the requested subject and avoid-list. Read actual dimensions/format rather than assuming the requested size is guaranteed.

For transparency, verify a real alpha channel with transparent pixels. Inspect against light/dark surfaces when needed; do not accept a rendered checkerboard as alpha. Preserve the original when creating previews or integrating the selected asset into a project.

Keep raw process logs and credentials out of the repository. Record only sanitized evidence: CLI version, sign-in mode, native capability status, asset format/dimensions, transparency checks and whether a real output was inspected. Report failures instead of silently changing generation paths.

## Verified smoke test

On 2026-10-14, Codex CLI **0.162.1** reported `image_generation` enabled and ChatGPT sign-in. A bounded background session using the installed skills generated an original cobalt-blue paper-cut fox, copied from its exact native output path. The inspected result was a **1254 × 1254 RGBA PNG**, with alpha values spanning **0–255** and genuine transparent pixels. API-key variables were removed from the child environment. No API fallback was used.

This verifies native generation and transparent-output saving for that CLI/session. It does not establish future availability, exact-size guarantees, every editing mode or support through the plugin's `codex_task` tool.
