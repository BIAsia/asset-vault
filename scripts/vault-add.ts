import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { ensureProjectDirs, repoRoot } from "./utils/paths";
import { appendQueue, queueHasUrl } from "./utils/queue";
import { findToolByUrl } from "./utils/content";
import { normalizeUrl } from "./utils/url";

ensureProjectDirs();

const rawUrl = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[0] && arg !== process.argv[1]);
const force = process.argv.includes("--force");
const noStart = process.argv.includes("--no-start");

if (!rawUrl) {
  console.error("Usage: pnpm vault:add <url> [--force] [--no-start]");
  process.exit(1);
}

const url = normalizeUrl(rawUrl);
const existing = await findToolByUrl(url);
if (existing && !force) {
  console.log(`[vault] already collected: ${url}`);
  process.exit(0);
}

if (queueHasUrl(url) && !force) {
  console.log(`[vault] already queued: ${url}`);
  process.exit(0);
}

appendQueue({
  id: crypto.randomUUID(),
  url,
  submittedAt: new Date().toISOString(),
  source: "local-agent",
  force
});
console.log(`[vault] queued ${url}`);

if (!noStart) {
  if (!existsSync("node_modules")) {
    console.warn("[vault] dependencies are not installed; run pnpm install, then pnpm vault:worker");
    process.exit(0);
  }
  const child = spawn("pnpm", ["vault:worker", "--", "--until-idle"], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore"
  });
  child.unref();
  console.log("[vault] background worker started");
}
