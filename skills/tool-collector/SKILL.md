---
name: tool-collector
description: Use this skill when the user sends a URL to collect into the Asset Vault, asks to save/bookmark/archive a tool, or wants the headless collector to process saved links without using Computer Use or a visible browser.
---

# Tool Collector

## Normal Collection

When the user asks to collect a URL:

1. Run `pnpm vault:add <url>` from the repo root. For external URLs in sandboxed environments, request network approval before the first attempt.
2. Do not open the URL locally.
3. Do not use Computer Use, GUI browser automation, mouse, keyboard, or the user's visible browser.
4. Wait for the command to finish processing, validation, commit, and push.
5. Tell the user collection finished only after the command exits successfully.

## Worker Rules

- The worker may use headless Playwright with an isolated profile.
- AI output must match `ToolCardSchema`.
- Scripts materialize Markdown and assets; AI does not write final Markdown directly.
- Preserve everything outside `<!-- generated:start -->` and `<!-- generated:end -->`.
- Always produce Chinese aliases for English technical concepts.
- Run `pnpm vault:validate` before commit/push.

## Useful Commands

- `pnpm vault:process --once`: process one queued URL in the foreground.
- `pnpm vault:worker`: keep processing queue in the foreground.
- `pnpm vault:add <url> --background`: queue a URL and start a detached worker only when explicitly requested.
- `pnpm vault:validate`: validate generated content.
- `pnpm vault:build`: validate, build the site, and create Pagefind search index.
