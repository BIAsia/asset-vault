import { writeFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { dataDir, publicDataDir, repoRoot } from "./utils/paths";
import { parseToolFile } from "./utils/content";

const files = await fg("src/content/tools/**/*.{md,mdx}", { cwd: repoRoot, absolute: true });
const tools = files
  .map((filePath) => parseToolFile(filePath))
  .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));

const json = `${JSON.stringify(tools, null, 2)}\n`;
writeFileSync(path.join(dataDir, "tools.generated.json"), json);
writeFileSync(path.join(publicDataDir, "tools.json"), json);
console.log(`[vault] rebuilt index for ${tools.length} tools`);
