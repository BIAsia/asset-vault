import { readFileSync } from "node:fs";
import { taxonomyPath } from "./paths";

export interface Taxonomy {
  tags: Record<string, string[]>;
}

export function loadTaxonomy(): Taxonomy {
  const raw = readFileSync(taxonomyPath, "utf8");
  const tags: Record<string, string[]> = {};
  let currentTag = "";

  for (const line of raw.split(/\r?\n/)) {
    const tagMatch = line.match(/^  ([a-z0-9-]+):\s*$/);
    if (tagMatch) {
      currentTag = tagMatch[1];
      tags[currentTag] = [];
      continue;
    }

    const aliasesMatch = line.match(/^\s+aliases:\s*\[(.*)\]\s*$/);
    if (currentTag && aliasesMatch) {
      tags[currentTag] = aliasesMatch[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return { tags };
}

export function normalizeTags(input: string[], taxonomy: Taxonomy) {
  const known = new Set(Object.keys(taxonomy.tags));
  const normalized = input
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);

  const accepted = normalized.filter((tag) => known.has(tag));
  const fallback = normalized.filter((tag) => !known.has(tag)).slice(0, 4);
  return [...new Set([...accepted, ...fallback])].slice(0, 12);
}

export function expandAliases(tags: string[], aliases: string[], taxonomy: Taxonomy) {
  const expanded = [...aliases];
  for (const tag of tags) {
    expanded.push(...(taxonomy.tags[tag] ?? []));
  }
  return [...new Set(expanded.map((item) => item.trim()).filter(Boolean))].slice(0, 30);
}
