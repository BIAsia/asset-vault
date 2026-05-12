import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { cacheDir, ensureProjectDirs } from "./utils/paths";
import { processNext } from "./utils/processor";

ensureProjectDirs();

const untilIdle = process.argv.includes("--until-idle");
const lockPath = path.join(cacheDir, "worker.lock");

function pidIsAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

if (existsSync(lockPath)) {
  const pid = Number(readFileSync(lockPath, "utf8"));
  if (Number.isFinite(pid) && pidIsAlive(pid)) {
    console.log(`[vault] worker already running as ${pid}`);
    process.exit(0);
  }
  rmSync(lockPath, { force: true });
}

writeFileSync(lockPath, String(process.pid));

async function main() {
  try {
    while (true) {
      const didWork = await processNext();
      if (!didWork && untilIdle) break;
      if (!didWork) await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  } finally {
    rmSync(lockPath, { force: true });
  }
}

await main();
