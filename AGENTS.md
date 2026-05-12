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

## Daily Flow

1. User sends a URL.
2. Run `COREPACK_HOME=/Users/devonly/Documents/Feishu/asset-vault/.corepack pnpm vault:add <url>`, with network approval when the environment restricts outbound access.
3. Return once the URL is queued; the worker handles processing, commit, push, and Vercel deployment.

## Runtime Notes

- Use the repo-local Corepack cache above. Plain `pnpm` may try to write under `/Users/devonly/.cache/node/corepack` and fail in sandboxed agent sessions.
- Use repo-local Playwright browsers under `.cache/ms-playwright`. If the browser executable is missing, run `PLAYWRIGHT_BROWSERS_PATH=/Users/devonly/Documents/Feishu/asset-vault/.cache/ms-playwright pnpm exec playwright install chromium` with network approval.
- If headless screenshot capture fails, use page metadata to fetch a real preview image. If neither a screenshot nor metadata image can be captured, fail the collection instead of creating a fake asset.
- If collection still fails with a likely network error such as `fetch failed`, rerun the same `vault:add` command with network approval rather than editing generated files by hand.
- If a user asks whether processing finished or pushed, check `inbox/processed.jsonl`, `inbox/failed.jsonl`, `git status --short --branch`, and `git log --oneline -3 --decorate`.
- `main...origin/main` with no status lines means the local branch is clean and synchronized with the remote.
