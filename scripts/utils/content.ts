import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { contentToolsDir, repoRoot } from "./paths";
import { MaterializedToolSchema } from "./schema";
import type { AiToolCard, MaterializedTool } from "./schema";
import { shortHash, slugFromUrl } from "./url";

const START = "<!-- generated:start -->";
const END = "<!-- generated:end -->";

export interface ExistingTool {
  filePath: string;
  data: Record<string, unknown>;
  content: string;
}

export async function readExistingTools(): Promise<ExistingTool[]> {
  const files = await fg("src/content/tools/**/*.{md,mdx}", { cwd: repoRoot, absolute: true });
  return files.map((filePath) => {
    const parsed = matter(readFileSync(filePath, "utf8"));
    return { filePath, data: parsed.data, content: parsed.content };
  });
}

export async function findToolByUrl(url: string) {
  const tools = await readExistingTools();
  return tools.find((tool) => tool.data.url === url);
}

function preserveManualContent(existing?: ExistingTool) {
  if (!existing) return "\n## My Notes\n\n";
  const endIndex = existing.content.indexOf(END);
  if (endIndex === -1) {
    const trimmed = existing.content.trim();
    return trimmed ? `\n## My Notes\n\n${trimmed}\n` : "\n## My Notes\n\n";
  }
  const manual = existing.content.slice(endIndex + END.length).trim();
  return manual ? `\n${manual}\n` : "\n## My Notes\n\n";
}

function generatedBody(card: AiToolCard) {
  const features = card.features.map((item) => `- ${item}`).join("\n");
  const useCases = card.useCases.map((item) => `- ${item}`).join("\n");
  return `${START}
${card.summary}

## Features

${features}

## Use Cases

${useCases}

## Why It Matters

${card.whyInteresting}

## Source

[Open original](${card.url})
${END}`;
}

function uniqueId(base: string, existing: ExistingTool[], url: string) {
  const sameUrl = existing.find((tool) => tool.data.url === url);
  if (sameUrl && typeof sameUrl.data.id === "string") return sameUrl.data.id;
  const ids = new Set(existing.map((tool) => tool.data.id).filter(Boolean));
  if (!ids.has(base)) return base;
  return `${base}-${shortHash(url)}`;
}

export async function materializeTool(card: AiToolCard, assets: { previewImage: string; previewVideo?: string }) {
  mkdirSync(contentToolsDir, { recursive: true });
  const existingTools = await readExistingTools();
  const existing = existingTools.find((tool) => tool.data.url === card.url);
  const id = uniqueId(slugFromUrl(card.url, card.title), existingTools, card.url);
  const now = new Date().toISOString();
  const created = typeof existing?.data.created === "string" ? existing.data.created : now;
  const rawTool = {
    schemaVersion: 1,
    id,
    title: card.title,
    url: card.url,
    contentType: card.contentType,
    summary: card.summary,
    features: card.features,
    tags: card.tags,
    aliases: card.aliases,
    useCases: card.useCases,
    whyInteresting: card.whyInteresting,
    previewImage: assets.previewImage,
    created,
    updated: now
  };
  const tool: MaterializedTool = MaterializedToolSchema.parse(
    assets.previewVideo ? { ...rawTool, previewVideo: assets.previewVideo } : rawTool
  );

  const filePath = existing?.filePath ?? path.join(contentToolsDir, `${id}.md`);
  const body = `${generatedBody(card)}${preserveManualContent(existing)}`;
  const file = matter.stringify(body, tool);
  writeFileSync(filePath, file);
  return { filePath, tool };
}

export function parseToolFile(filePath: string) {
  const parsed = matter(readFileSync(filePath, "utf8"));
  return MaterializedToolSchema.parse(parsed.data);
}

export function assetExists(sitePath: string) {
  if (!sitePath.startsWith("/")) return false;
  return existsSync(path.join(repoRoot, "public", sitePath));
}
