import { mkdirSync } from "node:fs";
import path from "node:path";

export const repoRoot = process.cwd();
export const inboxDir = path.join(repoRoot, "inbox");
export const pendingPath = path.join(inboxDir, "pending.jsonl");
export const processedPath = path.join(inboxDir, "processed.jsonl");
export const failedPath = path.join(inboxDir, "failed.jsonl");
export const contentToolsDir = path.join(repoRoot, "src", "content", "tools");
export const publicToolsDir = path.join(repoRoot, "public", "assets", "tools");
export const publicDataDir = path.join(repoRoot, "public", "data");
export const dataDir = path.join(repoRoot, "data");
export const cacheDir = path.join(repoRoot, ".cache");
export const taxonomyPath = path.join(dataDir, "taxonomy.yml");

export function ensureProjectDirs() {
  for (const dir of [
    inboxDir,
    contentToolsDir,
    publicToolsDir,
    publicDataDir,
    dataDir,
    cacheDir
  ]) {
    mkdirSync(dir, { recursive: true });
  }
}

export function siteAssetPath(filePath: string) {
  const rel = path.relative(path.join(repoRoot, "public"), filePath);
  return `/${rel.split(path.sep).join("/")}`;
}
