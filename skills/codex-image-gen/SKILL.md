---
name: codex-image-gen
description: "Generate or edit raster images with Codex image-generation capabilities: photos, illustrations, textures, sprites, mockups and transparent cutouts. Use when the user asks for codex_image_gen or an AI-generated bitmap asset, not for deterministic SVG, CSS or diagram work."
---

# codex_image_gen

Produce actual image files, not a prompt-only answer or a code-drawn substitute. This is an image-generation workflow skill, not a new tool or a grant of additional permissions.

## Select the available execution path

- Prefer the host's built-in `image_gen` capability. If the installed `imagegen` skill is available, load it and follow its native generation/editing workflow rather than maintaining a second SDK runner or copying its implementation.
- A skill does not create an unavailable tool. Check the host's tool catalog; do not invent `codex_image_gen` tool calls, Codex CLI flags or image-generation capabilities for `codex_task`.
- If native generation is unavailable, say so. The installed `imagegen` skill may offer an OpenAI API/CLI fallback; use it only after the user explicitly chooses or confirms that path and its separate billing. A configured API key is not authorization to switch paths. Never request credentials in chat or inspect browser/session secrets.
- Do not delegate generation just to avoid an unavailable tool. If delegation is explicitly authorized and the host permits it, respect its background-only and cancellation rules. Do not block through a synchronous delegation tool when background execution is required.

## Shape the request

Determine whether this is a new image or an edit, whether it is preview-only or a project asset, and how many final assets are needed. Ask only for missing information that materially blocks the result.

Use a concise brief:

```text
Purpose: where this image will be used
Subject and action: the requested visual content
Style: photographic / illustration / texture / sprite / other raster medium
Composition: aspect ratio, crop, and any needed space for interface text
References: identify each image as style reference, edit target, or insert
Text: exact quoted text, or no text
Constraints: what must stay, what must change, what to avoid
Delivery: preview or project path; transparency if required
```

Preserve a specific user brief instead of adding arbitrary objects, branding or style requirements. For edits, explicitly list the invariants and change only the requested parts. Inspect local edit targets and make them available in the host's supported image-input flow before generation; do not promise filesystem-path editing through a tool that accepts only visible conversation images.

When a reference comes from Behance or another third-party source, adapt the visual principles to an original image. Do not copy its logos, private screenshots or identifiable people without the appropriate permission. Do not upload sensitive workspace material to an external generation service merely because it is locally available.

## Generate and inspect

Generate one requested asset or variant at a time unless the selected tool genuinely supports the user's requested batch. A request for several images does not by itself authorize an API fallback. Do not silently change models or bypass a failed capability.

Inspect the actual result for subject, composition, legible/exact text, unintended objects, edit drift, aspect ratio and usable crop. For transparent output, verify that the file has an alpha channel and contains transparent pixels; a painted checkerboard is not transparency. If practical, inspect against both light and dark backgrounds.

Make targeted revisions rather than changing unrelated aspects of the brief. Do not report a successful image generation when only a prompt, placeholder or failed tool response exists.

## Deliver a usable asset

- Use the actual output path returned by the tool; do not guess which file is new by selecting the most recent file from another session. Native Codex outputs may be under `$CODEX_HOME/generated_images/`; this is an intermediate location for project assets, not a universal guaranteed path.
- Keep preview-only outputs at the host's default location if appropriate. Copy selected project-bound images into the user's requested workspace destination, or a project-appropriate assets directory when no destination was specified.
- Preserve originals and existing user files. Use a descriptive versioned filename for a new variant rather than replacing an existing asset without authorization. Preserve the alpha channel when copying/converting transparent images.
- Check the saved file exists and is decodable, and report its actual dimensions and format. Only integrate it into application code when that integration is part of the user's request.
- Report the final path, a compact final prompt/brief and the generation path used. Distinguish an inspected image from unverified behaviour, brand claims or real product screenshots. Publication, deployment and uploads remain separate actions.

Prefer editing existing SVG/vector/code-native artwork when that is the requested format or matches an established repo system. Do not rasterize a deterministic UI, diagram or icon task just because this skill is installed.
