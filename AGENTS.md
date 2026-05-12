# Asset Vault Agent Rules

This repo is an agent-maintained public asset library.

## Hard Rules

- Do not use Computer Use, GUI browser automation, mouse control, keyboard control, or a visible user browser for collection.
- Normal collection is only `pnpm vault:add <url>`.
- Background processing may use headless Playwright with an isolated profile.
- AI must output schema-compatible JSON. Do not let AI write final Markdown directly.
- Do not edit generated content files by hand unless repairing validation errors.
- Never overwrite user notes outside `<!-- generated:start -->` and `<!-- generated:end -->`.
- Run `pnpm vault:validate` before committing generated content.

## Daily Flow

1. User sends a URL.
2. Run `pnpm vault:add <url>`.
3. Return once the URL is queued; the worker handles processing, commit, push, and Vercel deployment.
