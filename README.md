# Asset Vault

A local-background, agent-maintained asset library. Send a URL, let the headless worker collect it, and view the generated card on a static site deployed by Vercel.

## Quick Start

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local
pnpm vault:add https://wcandillon.github.io/redraw/
pnpm dev
```

## Commands

- `pnpm vault:add <url>` queues a URL and starts a detached background worker.
- `pnpm vault:process --once` processes one queued URL in the current terminal.
- `pnpm vault:worker` keeps processing queued URLs.
- `pnpm vault:validate` validates content, assets, and duplicate URLs.
- `pnpm vault:build` validates, builds Astro, and creates the Pagefind index.

## Deployment

Create a GitHub repo, push `main`, then connect it to Vercel. Vercel runs `pnpm vault:build` and publishes `dist`.
