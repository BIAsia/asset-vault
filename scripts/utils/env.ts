import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./paths";

let loaded = false;

export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;

  for (const file of [".env.local", ".env"]) {
    const fullPath = path.join(repoRoot, file);
    if (!existsSync(fullPath)) continue;
    const raw = readFileSync(fullPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}
