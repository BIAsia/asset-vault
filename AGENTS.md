# Asset Vault Agent Rules

This repo is an agent-maintained public asset library.

## Hard Rules

- Do not use Computer Use, GUI browser automation, mouse control, keyboard control, or a visible user browser for collection.
- Normal collection is only `pnpm vault:add <url>`; for external URLs, request network approval up front when the sandbox requires it.
- Background processing may use headless Playwright with an isolated profile.
- AI must output schema-compatible JSON. Do not let AI write final Markdown directly.
- Do not edit generated content files by hand unless repairing validation errors.
- Never overwrite user notes outside `<!-- generated:start -->` and `<!-- generated:end -->`.
- Run `pnpm vault:validate` before committing generated content.
- Preview images must be real source-derived assets: a headless Playwright screenshot of the URL, or a downloaded image from page metadata such as `og:image`/`twitter:image`. Do not generate placeholder, decorative, or fake preview images.
- Keep generated-content commits separate from source-code workflow fixes. Do not mix unrelated UI, dependency, or design changes into vault collection commits.
- Do not revert or clean up unrelated dirty worktree changes unless the user explicitly asks.

## Daily Flow

1. User sends a URL.
2. Run `COREPACK_HOME=/Users/devonly/Documents/Feishu/asset-vault/.corepack pnpm vault:add <url>`, with network approval when the environment restricts outbound access.
3. Return once the URL is queued unless the user asks whether it finished.
4. If the user asks whether it finished, verify the worker result before answering.

## Completion Checks

When checking whether processing finished or pushed, inspect all of these:

- `inbox/pending.jsonl` to confirm the URL is no longer queued.
- `inbox/processed.jsonl` and `inbox/failed.jsonl` to find the newest result for the exact URL.
- `.cache/worker.lock` to see whether a worker may still be running.
- `git status --short --branch` and `git log --oneline -3 --decorate` to confirm commit/push state.

Do not report success from "queued" output alone. Only say collection completed after the exact URL appears in `processed.jsonl` and the generated commit is on `origin/main`, or clearly say that it is only queued/running/failed.

## Runtime Notes

- Use the repo-local Corepack cache above. Plain `pnpm` may try to write under `/Users/devonly/.cache/node/corepack` and fail in sandboxed agent sessions.
- Use repo-local Playwright browsers under `.cache/ms-playwright`. If the browser executable is missing, run `PLAYWRIGHT_BROWSERS_PATH=/Users/devonly/Documents/Feishu/asset-vault/.cache/ms-playwright pnpm exec playwright install chromium` with network approval.
- If headless screenshot capture fails, use page metadata to fetch a real preview image. If neither a screenshot nor metadata image can be captured, fail the collection instead of creating a fake asset.
- If collection still fails with a likely network error such as `fetch failed`, rerun the same `vault:add` command with network approval rather than editing generated files by hand.
- `main...origin/main` with no status lines means the local branch is clean and synchronized with the remote.

## Generated Content Boundaries

- Generated collection outputs are `src/content/tools`, `public/assets/tools`, `public/data/tools.json`, `data/tools.generated.json`, and `inbox/*.jsonl`.
- Source workflow fixes live under files such as `scripts/**`, `AGENTS.md`, schema/config files, and UI components. Commit these separately from generated collection outputs.
- Manual notes belong only outside the generated markers. Preserve them across regeneration.
- If generated content is invalid, prefer fixing the generator or schema and regenerating with `pnpm vault:add <url> --force`.

## Preview Quality

- Prefer Playwright screenshots of the actual URL.
- Metadata-image fallback is acceptable only when screenshot capture fails.
- Preview assets should be URL-specific; different pages on the same host must not share one preview directory unless they are confirmed to be the same content.
- Do not accept placeholder SVGs, decorative generated art, blank captures, or unrelated host-level images as previews.

## Failure Handling

- Treat failed rows in `inbox/failed.jsonl` as diagnostic history, not as final truth after a later retry. Compare timestamps and exact URLs.
- If the worker fails because Playwright, Corepack, dependencies, or network access are missing, fix that runtime cause and rerun `pnpm vault:add <url> --force`.
- If a page cannot produce a real screenshot or metadata image, leave it failed and report that clearly rather than inventing an asset.
- If generated content is committed but source-code support for that content is still uncommitted, commit the source fix separately before considering the pipeline healthy.
