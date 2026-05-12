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

function idFromFilePath(filePath: string) {
  return path.basename(filePath).replace(/\.(md|mdx)$/i, "");
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
  return tools.find((tool) => toolHasUrl(tool, url));
}

function canonicalContentKey(url: string) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (host === "github.com" && pathParts.length >= 2) {
    return `${host}/${pathParts[0].toLowerCase()}/${pathParts[1].toLowerCase()}`;
  }

  return `${host}/${pathParts.join("/").toLowerCase()}`;
}

function valuesFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object" && "url" in item && typeof item.url === "string") return [item.url];
    return [];
  });
}

function toolUrls(tool: ExistingTool) {
  return [tool.data.url, ...valuesFromUnknown(tool.data.links)]
    .filter((value): value is string => typeof value === "string");
}

function toolHasUrl(tool: ExistingTool, url: string) {
  return toolUrls(tool).includes(url);
}

function toolMatchesContentKey(tool: ExistingTool, url: string) {
  const incoming = canonicalContentKey(url);
  return toolUrls(tool).some((toolUrl) => canonicalContentKey(toolUrl) === incoming);
}

function findToolForCardUrl(tools: ExistingTool[], url: string) {
  return tools.find((tool) => toolHasUrl(tool, url)) ?? tools.find((tool) => toolMatchesContentKey(tool, url));
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

function generatedBody(tool: MaterializedTool) {
  const features = tool.features.map((item) => `- ${item}`).join("\n");
  const useCases = tool.useCases.map((item) => `- ${item}`).join("\n");
  const sourceLinks = tool.links.map((link) => `- [${link.label}](${link.url})`).join("\n");
  return `${START}
${tool.summary}

## Features

${features}

## Use Cases

${useCases}

## Why It Matters

${tool.whyInteresting}

## Source

${sourceLinks}
${END}`;
}

function uniqueId(base: string, existing: ExistingTool[], url: string) {
  const sameUrl = existing.find((tool) => tool.data.url === url);
  if (sameUrl && typeof sameUrl.data.id === "string") return sameUrl.data.id;
  if (sameUrl) return idFromFilePath(sameUrl.filePath);
  const ids = new Set(existing.map((tool) => typeof tool.data.id === "string" ? tool.data.id : idFromFilePath(tool.filePath)));
  if (!ids.has(base)) return base;
  return `${base}-${shortHash(url)}`;
}

function mergeStringArray(existing: unknown, incoming: string[]) {
  const existingValues = Array.isArray(existing) ? existing.filter((value): value is string => typeof value === "string") : [];
  return [...existingValues, ...incoming].filter((value, index, all) => all.indexOf(value) === index);
}

export async function materializeTool(card: AiToolCard, assets: { previewImage: string; previewVideo?: string }) {
  mkdirSync(contentToolsDir, { recursive: true });
  const existingTools = await readExistingTools();
  const existing = findToolForCardUrl(existingTools, card.url);
  const id = typeof existing?.data.id === "string"
    ? existing.data.id
    : existing
      ? idFromFilePath(existing.filePath)
      : uniqueId(slugFromUrl(card.url, card.title), existingTools, card.url);
  const now = new Date().toISOString();
  const created = typeof existing?.data.created === "string" ? existing.data.created : now;
  const existingLinks = Array.isArray(existing?.data.links) ? existing.data.links : [];
  const cardContentKey = canonicalContentKey(card.url);
  const sameContentLinks = valuesFromUnknown(existingLinks).filter((url) => canonicalContentKey(url) === cardContentKey);
  const sameContentPrimary = typeof existing?.data.url === "string" && canonicalContentKey(existing.data.url) === cardContentKey
    ? existing.data.url
    : undefined;
  const links = [
    ...sameContentLinks.map((url) => ({ label: new URL(url).hostname.replace(/^www\./, ""), url })),
    ...(sameContentPrimary ? [{ label: new URL(sameContentPrimary).hostname.replace(/^www\./, ""), url: sameContentPrimary }] : []),
    { label: new URL(card.url).hostname.replace(/^www\./, ""), url: card.url }
  ].filter((link, index, all) => all.findIndex((candidate) => candidate.url === link.url) === index);
  const preferNewPrimary = sameContentPrimary && new URL(sameContentPrimary).hostname === "github.com" && new URL(card.url).hostname !== "github.com";
  const primaryUrl = preferNewPrimary ? card.url : (sameContentPrimary ?? card.url);
  const rawTool = {
    schemaVersion: 1,
    id,
    title: card.title,
    url: primaryUrl,
    links,
    contentType: card.contentType,
    summary: card.summary,
    features: mergeStringArray(existing?.data.features, card.features),
    tags: mergeStringArray(existing?.data.tags, card.tags),
    aliases: mergeStringArray(existing?.data.aliases, card.aliases),
    useCases: mergeStringArray(existing?.data.useCases, card.useCases),
    whyInteresting: card.whyInteresting,
    previewImage: assets.previewImage,
    created,
    updated: now
  };
  const tool: MaterializedTool = MaterializedToolSchema.parse(
    assets.previewVideo ? { ...rawTool, previewVideo: assets.previewVideo } : rawTool
  );

  const filePath = existing?.filePath ?? path.join(contentToolsDir, `${id}.md`);
  const body = `${generatedBody(tool)}${preserveManualContent(existing)}`;
  const { id: _id, ...frontmatter } = tool;
  const file = matter.stringify(body, frontmatter);
  writeFileSync(filePath, file);
  return { filePath, tool };
}

export function parseToolFile(filePath: string) {
  const parsed = matter(readFileSync(filePath, "utf8"));
  const id = typeof parsed.data.id === "string" ? parsed.data.id : idFromFilePath(filePath);
  return MaterializedToolSchema.parse({ id, ...parsed.data });
}

export function assetExists(sitePath: string) {
  if (!sitePath.startsWith("/")) return false;
  return existsSync(path.join(repoRoot, "public", sitePath));
}
