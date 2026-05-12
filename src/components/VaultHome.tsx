"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Grid3X3,
  Library,
  List,
  RotateCcw,
  Search,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/fluid/table";
import { TabsSubtle, TabsSubtleItem } from "@/components/fluid/tabs-subtle";
import { ShapeProvider } from "@/lib/shape-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { cn } from "@/lib/utils";
import type { ToolAsset, VaultIndex } from "@/lib/vault";

type ViewMode = "gallery" | "table";

interface VaultHomeProps {
  vault: VaultIndex;
}

const badgeColors = ["gray", "blue", "teal", "violet", "amber", "rose", "green"] as const;

function colorFor(value: string) {
  let total = 0;
  for (const char of value) total += char.charCodeAt(0);
  return badgeColors[total % badgeColors.length];
}

function formatDate(value?: string) {
  if (!value) return "No updates";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

function AssetCard({ asset }: { asset: ToolAsset }) {
  return (
    <article className={cn("group overflow-hidden transition-transform duration-100 hover:-translate-y-0.5", surfaceClasses(3, 4), "rounded-3xl")}>
      <a className="block bg-muted" href={asset.href} aria-label={`Open ${asset.title}`}>
        <div className="aspect-[16/10] overflow-hidden">
          {asset.previewVideo ? (
            <video className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]" src={asset.previewVideo} poster={asset.previewImage} muted playsInline loop preload="metadata" />
          ) : (
            <img className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]" src={asset.previewImage} alt={`${asset.title} preview`} loading="lazy" />
          )}
        </div>
      </a>
      <div className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge size="sm" variant="dot" color={colorFor(asset.contentType)}>{asset.contentType}</Badge>
              {asset.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="sm" color={colorFor(tag)}>{tag}</Badge>
              ))}
            </div>
            <h2 className="text-[18px] leading-tight text-foreground">{asset.title}</h2>
          </div>
          <Button asChild size="icon-sm" variant="ghost" aria-label={`Open ${asset.title} original`}>
            <a href={asset.url} target="_blank" rel="noreferrer">
              <ArrowUpRight />
            </a>
          </Button>
        </div>
        <p className="line-clamp-3 text-[13px] leading-6 text-muted-foreground">{asset.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {asset.aliases.slice(0, 4).map((alias) => (
            <span key={alias} className="rounded-full bg-hover px-2 py-1 text-[11px] text-muted-foreground">{alias}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function AssetTable({ assets }: { assets: ToolAsset[] }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl p-2", surfaceClasses(3, 4))}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead className="hidden md:table-cell">Kind</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset, index) => (
            <TableRow key={asset.id} index={index}>
              <TableCell>
                <a className="grid gap-1 text-foreground" href={asset.href}>
                  <span className="text-[13px]">{asset.title}</span>
                  <span className="max-w-[58ch] truncate text-[12px] text-muted-foreground">{asset.summary}</span>
                </a>
              </TableCell>
              <TableCell className="hidden md:table-cell">{asset.contentType}</TableCell>
              <TableCell className="hidden lg:table-cell">{asset.tags.slice(0, 3).join(", ")}</TableCell>
              <TableCell className="text-right">{formatDate(asset.updated)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function VaultHome({ vault }: VaultHomeProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeType, setActiveType] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vault.assets.filter((asset) => {
      const matchesQuery = !normalizedQuery || asset.searchText.includes(normalizedQuery);
      const matchesTag = !activeTag || asset.tags.includes(activeTag);
      const matchesType = !activeType || asset.contentType === activeType;
      return matchesQuery && matchesTag && matchesType;
    });
  }, [activeTag, activeType, query, vault.assets]);

  useEffect(() => {
    if (!document.querySelector("#pagefind-search")) return;
    const href = "/pagefind/pagefind-ui.css";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
    const pagefindPath = "/pagefind/pagefind-ui.js";
    import(/* @vite-ignore */ pagefindPath)
      .then(({ PagefindUI }) => {
        new PagefindUI({ element: "#pagefind-search", showSubResults: true });
      })
      .catch(() => {});
  }, []);

  const resetFilters = () => {
    setQuery("");
    setActiveTag("");
    setActiveType("");
  };

  return (
    <ShapeProvider defaultShape="pill">
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto grid w-full max-w-[1380px] gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <header className={cn("grid gap-5 p-4 md:grid-cols-[1fr_auto] md:items-end", surfaceClasses(2, 2), "rounded-3xl")}>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="dot" color="teal">Agent maintained</Badge>
                <Badge variant="dot" color="gray">Git-backed</Badge>
              </div>
              <div>
                <h1 className="text-[clamp(40px,8vw,96px)] font-semibold leading-[0.9] tracking-[-0.04em] text-foreground">Asset Vault</h1>
                <p className="mt-4 max-w-2xl text-[14px] leading-6 text-muted-foreground">
                  A compact research surface for tools, demos, libraries, and visual references collected by the background agent.
                </p>
              </div>
            </div>
            <div className={cn("grid min-w-[260px] grid-cols-3 gap-2 p-2", surfaceClasses(3, 3), "rounded-3xl")}>
              <div className="grid gap-1 rounded-2xl bg-hover px-3 py-2">
                <span className="text-[11px] text-muted-foreground">Items</span>
                <span className="text-[22px] font-semibold">{vault.stats.total}</span>
              </div>
              <div className="grid gap-1 rounded-2xl bg-hover px-3 py-2">
                <span className="text-[11px] text-muted-foreground">Tags</span>
                <span className="text-[22px] font-semibold">{vault.stats.tagCount}</span>
              </div>
              <div className="grid gap-1 rounded-2xl bg-hover px-3 py-2">
                <span className="text-[11px] text-muted-foreground">Latest</span>
                <span className="text-[12px] font-medium">{formatDate(vault.stats.latestUpdated)}</span>
              </div>
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={cn("grid h-fit gap-5 p-4 lg:sticky lg:top-4", surfaceClasses(3, 5), "rounded-3xl")}>
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Search size={14} /> Search</span>
                <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 ring-1 ring-border transition-colors focus-within:bg-card">
                  <Search size={16} className="text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="线条, shader, vector..."
                    type="search"
                  />
                </span>
              </label>

              <div className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Grid3X3 size={14} /> View</span>
                <TabsSubtle selectedIndex={viewMode === "gallery" ? 0 : 1} onSelect={(index) => setViewMode(index === 0 ? "gallery" : "table")}>
                  <TabsSubtleItem index={0} label="Gallery" icon={Grid3X3} />
                  <TabsSubtleItem index={1} label="Table" icon={List} />
                </TabsSubtle>
              </div>

              <div className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Library size={14} /> Type</span>
                <div className="flex flex-wrap gap-1.5">
                  <button className={cn("rounded-full px-2.5 py-1 text-[12px] transition-colors", !activeType ? "bg-active text-foreground" : "text-muted-foreground hover:bg-hover")} type="button" onClick={() => setActiveType("")}>All</button>
                  {vault.facets.contentTypes.map((facet) => (
                    <button key={facet.name} className={cn("rounded-full px-2.5 py-1 text-[12px] transition-colors", activeType === facet.name ? "bg-active text-foreground" : "text-muted-foreground hover:bg-hover")} type="button" onClick={() => setActiveType(facet.name)}>
                      {facet.name} <span className="text-muted-foreground">{facet.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Tags size={14} /> Tags</span>
                <div className="flex max-h-[260px] flex-wrap gap-1.5 overflow-auto pr-1">
                  {vault.facets.tags.map((facet) => (
                    <button key={facet.name} className={cn("rounded-full px-2.5 py-1 text-[12px] transition-colors", activeTag === facet.name ? "bg-active text-foreground" : "text-muted-foreground hover:bg-hover")} type="button" onClick={() => setActiveTag(activeTag === facet.name ? "" : facet.name)}>
                      {facet.name} <span className="text-muted-foreground">{facet.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="tertiary" size="md" leadingIcon={RotateCcw} onClick={resetFilters}>Reset filters</Button>

              <div className="grid gap-2 border-t border-border pt-4">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileText size={14} /> Deep search</span>
                <div id="pagefind-search" className="ff-pagefind" />
              </div>
            </aside>

            <section className="grid content-start gap-4">
              <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] text-muted-foreground">Showing</p>
                  <p className="text-[24px] font-semibold tracking-[-0.03em]">{filteredAssets.length} of {vault.stats.total} assets</p>
                </div>
                <Button asChild variant="secondary" trailingIcon={ExternalLink} className="w-fit">
                  <a href="https://github.com/BIAsia/asset-vault" target="_blank" rel="noreferrer">Repository</a>
                </Button>
              </div>

              {filteredAssets.length > 0 ? (
                viewMode === "gallery" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredAssets.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
                  </div>
                ) : (
                  <AssetTable assets={filteredAssets} />
                )
              ) : (
                <div className={cn("grid place-items-center gap-3 p-10 text-center", surfaceClasses(3, 4), "rounded-3xl")}>
                  <p className="text-[18px] font-semibold">No matching assets</p>
                  <p className="max-w-md text-[13px] leading-6 text-muted-foreground">Try a Chinese alias, an English technical term, or clear the current filters.</p>
                  <Button variant="secondary" onClick={resetFilters}>Clear search</Button>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </ShapeProvider>
  );
}
