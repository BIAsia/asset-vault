import type { CollectionEntry } from "astro:content";

export type ToolLink = {
  label: string;
  url: string;
};

export type ToolAsset = {
  id: string;
  slug: string;
  href: string;
  title: string;
  url: string;
  links: ToolLink[];
  contentType: string;
  summary: string;
  features: string[];
  tags: string[];
  aliases: string[];
  useCases: string[];
  whyInteresting: string;
  previewImage: string;
  previewVideo?: string;
  created: string;
  updated: string;
  searchText: string;
};

export type VaultFacet = {
  name: string;
  count: number;
};

export type VaultIndex = {
  assets: ToolAsset[];
  facets: {
    tags: VaultFacet[];
    contentTypes: VaultFacet[];
  };
  stats: {
    total: number;
    tagCount: number;
    latestUpdated?: string;
  };
};

function hostLabel(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

function uniqueLinks(primaryUrl: string, links: ToolLink[]) {
  const merged = [...links, { label: hostLabel(primaryUrl), url: primaryUrl }];
  return merged.filter(
    (link, index, all) => all.findIndex((candidate) => candidate.url === link.url) === index
  );
}

export function toToolAsset(tool: CollectionEntry<"tools">): ToolAsset {
  const data = tool.data;
  const links = uniqueLinks(data.url, data.links);
  const updated = data.updated.toISOString();
  const created = data.created.toISOString();
  const searchText = [
    data.title,
    data.summary,
    links.map((link) => `${link.label} ${link.url}`).join(" "),
    data.contentType,
    data.features.join(" "),
    data.tags.join(" "),
    data.aliases.join(" "),
    data.useCases.join(" "),
    data.whyInteresting
  ].join(" ").toLowerCase();

  return {
    id: data.id,
    slug: tool.slug,
    href: `/tools/${tool.slug}/`,
    title: data.title,
    url: data.url,
    links,
    contentType: data.contentType,
    summary: data.summary,
    features: data.features,
    tags: data.tags,
    aliases: data.aliases,
    useCases: data.useCases,
    whyInteresting: data.whyInteresting,
    previewImage: data.previewImage,
    previewVideo: data.previewVideo,
    created,
    updated,
    searchText
  };
}

function countFacet(values: string[]): VaultFacet[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function createVaultIndex(entries: CollectionEntry<"tools">[]): VaultIndex {
  const assets = entries
    .map(toToolAsset)
    .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));

  return {
    assets,
    facets: {
      tags: countFacet(assets.flatMap((asset) => asset.tags)),
      contentTypes: countFacet(assets.map((asset) => asset.contentType))
    },
    stats: {
      total: assets.length,
      tagCount: new Set(assets.flatMap((asset) => asset.tags)).size,
      latestUpdated: assets[0]?.updated
    }
  };
}
