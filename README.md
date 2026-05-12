# Asset Vault

An agent-maintained asset library. Send a URL, let the headless collector finish the job, and view the generated card on a static site deployed by Vercel.

## Quick Start

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local
pnpm vault:add https://wcandillon.github.io/redraw/
pnpm dev
```

## Commands

- `pnpm vault:add <url>` queues a URL, processes the queue in the current terminal, validates, commits, and pushes before returning.
- `pnpm vault:add <url> --background` queues a URL and starts a detached background worker.
- `pnpm vault:process --once` processes one queued URL in the current terminal.
- `pnpm vault:worker` keeps processing queued URLs.
- `pnpm vault:validate` validates content, assets, and duplicate URLs.
- `pnpm vault:build` validates, builds Astro, and creates the Pagefind index.

## Agent Usage

Agents should run external URL collection with network access available from the first attempt. In sandboxed environments, request network approval up front, run `pnpm vault:add <url>`, and only report success after the command exits successfully.

## Deployment

Create a GitHub repo, push `main`, then connect it to Vercel. Vercel runs `pnpm vault:build` and publishes `dist`.
