import fg from "fast-glob";
import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./utils/paths";
import { assetExists, parseToolFile } from "./utils/content";

const files = await fg("src/content/tools/**/*.{md,mdx}", { cwd: repoRoot, absolute: true });
const seenUrls = new Map<string, string>();
const errors: string[] = [];

function rejectsGeneratedPlaceholder(sitePath: string) {
  if (!sitePath.endsWith(".svg")) return false;
  const filePath = path.join(repoRoot, "public", sitePath);
  const text = readFileSync(filePath, "utf8");
  return text.includes("Captured Asset") || text.includes("M80 620 C 290 470");
}

for (const file of files) {
  try {
    const tool = parseToolFile(file);
    for (const url of [tool.url, ...tool.links.map((link) => link.url)]) {
      if (seenUrls.has(url) && seenUrls.get(url) !== file) {
        errors.push(`Duplicate URL: ${url} in ${file} and ${seenUrls.get(url)}`);
      }
      seenUrls.set(url, file);
    }
    if (!assetExists(tool.previewImage)) {
      errors.push(`Missing previewImage for ${tool.id}: ${tool.previewImage}`);
    } else if (rejectsGeneratedPlaceholder(tool.previewImage)) {
      errors.push(`Generated placeholder previewImage is not allowed for ${tool.id}: ${tool.previewImage}`);
    }
    if (tool.previewVideo && !assetExists(tool.previewVideo)) {
      errors.push(`Missing previewVideo for ${tool.id}: ${tool.previewVideo}`);
    }
  } catch (error) {
    errors.push(`${file}: ${(error as Error).message}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`[vault] validated ${files.length} tools`);
