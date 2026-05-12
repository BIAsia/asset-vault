import fg from "fast-glob";
import { repoRoot } from "./utils/paths";
import { assetExists, parseToolFile } from "./utils/content";

const files = await fg("src/content/tools/**/*.{md,mdx}", { cwd: repoRoot, absolute: true });
const seenUrls = new Map<string, string>();
const errors: string[] = [];

for (const file of files) {
  try {
    const tool = parseToolFile(file);
    if (seenUrls.has(tool.url)) {
      errors.push(`Duplicate URL: ${tool.url} in ${file} and ${seenUrls.get(tool.url)}`);
    }
    seenUrls.set(tool.url, file);
    if (!assetExists(tool.previewImage)) {
      errors.push(`Missing previewImage for ${tool.id}: ${tool.previewImage}`);
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
