"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Grid3X3,
  List,
  RotateCcw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { InputField, InputGroup } from "@/components/fluid/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/fluid/table";
import { TabsSubtle, TabsSubtleItem } from "@/components/fluid/tabs-subtle";
import { fontWeights } from "@/lib/font-weight";
import { ShapeProvider } from "@/lib/shape-context";
import { cn } from "@/lib/utils";
import type { ToolAsset, VaultFacet, VaultIndex } from "@/lib/vault";

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

function cardGridClass(index: number) {
  if (index === 0) return "md:col-span-2 md:row-span-2";
  if (index === 3) return "md:col-span-2 xl:col-span-1";
  return "col-span-1";
}

function FacetButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}

function FacetRow({
  label,
  facets,
  activeValue,
  onSelect,
}: {
  label: string;
  facets: VaultFacet[];
  activeValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="dot" size="sm" color="gray">{label}</Badge>
      <FacetButton active={!activeValue} onClick={() => onSelect("")}>All</FacetButton>
      {facets.map((facet) => (
        <FacetButton
          key={facet.name}
          active={activeValue === facet.name}
          onClick={() => onSelect(activeValue === facet.name ? "" : facet.name)}
        >
          {facet.name} {facet.count}
        </FacetButton>
      ))}
    </div>
  );
}

function AssetPreview({ asset }: { asset: ToolAsset }) {
  if (asset.previewVideo) {
    return (
      <video
        className="aspect-[16/10] h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.015]"
        src={asset.previewVideo}
        poster={asset.previewImage}
        muted
        playsInline
        loop
        preload="metadata"
      />
    );
  }

  return (
    <img
      className="aspect-[16/10] h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.015]"
      src={asset.previewImage}
      alt={`${asset.title} preview`}
      loading="lazy"
    />
  );
}

function AssetCard({ asset, index }: { asset: ToolAsset; index: number }) {
  return (
    <article
      className={cn(
        "group relative flex min-h-[360px] flex-col overflow-hidden rounded-xl border transition-[shadow,border-color] duration-80 bento-card-border",
        cardGridClass(index)
      )}
    >
      <a
        className="flex flex-1 items-center justify-center overflow-hidden px-4 py-8 outline-none focus-visible:shadow-[inset_0_0_0_1px_#6B97FF] sm:px-6"
        href={asset.href}
        aria-label={`Open ${asset.title}`}
      >
        <div className="w-full overflow-hidden rounded-lg border border-border/50 bg-muted">
          <AssetPreview asset={asset} />
        </div>
      </a>

      <div className="shrink-0 border-t border-border/40">
        <a
          href={asset.href}
          className="group/link flex items-start gap-3 px-4 py-3 transition-colors duration-80 outline-none hover:bg-hover focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="dot" size="sm" color={colorFor(asset.contentType)}>{asset.contentType}</Badge>
              {asset.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="sm" color={colorFor(tag)}>{tag}</Badge>
              ))}
            </div>
            <h2
              className="truncate text-[13px] text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground"
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              {asset.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{asset.summary}</p>
          </div>
          <ArrowRight size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground" />
        </a>

        <div className="flex items-center justify-between gap-3 border-t border-border/30 px-4 py-2">
          <div className="flex min-w-0 gap-1.5 overflow-hidden">
            {asset.aliases.slice(0, 4).map((alias) => (
              <Badge key={alias} size="sm" variant="solid" color="gray" className="max-w-[120px] truncate">
                {alias}
              </Badge>
            ))}
          </div>
          <Button asChild size="icon-sm" variant="ghost" aria-label={`Open ${asset.title} original`}>
            <a href={asset.url} target="_blank" rel="noreferrer">
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}

function AssetTable({ assets }: { assets: ToolAsset[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bento-card-border">
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

  const resetFilters = () => {
    setQuery("");
    setActiveTag("");
    setActiveType("");
  };

  const hasFilters = query || activeTag || activeType;

  return (
    <ShapeProvider defaultShape="pill">
      <main className="min-h-screen bg-background text-foreground">
        <div className="mt-12 lg:mt-0">
          <header className="mx-auto w-full max-w-[640px] px-6 py-20 sm:py-28">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="dot" size="sm" color="teal">Agent maintained</Badge>
                  <Badge variant="dot" size="sm" color="gray">{vault.stats.total} saved</Badge>
                  <Badge variant="dot" size="sm" color="blue">Updated {formatDate(vault.stats.latestUpdated)}</Badge>
                </div>
                <h1
                  className="text-[22px] leading-none text-foreground sm:text-[28px]"
                  style={{ fontVariationSettings: fontWeights.bold }}
                >
                  Asset Vault
                </h1>
                <p className="max-w-[56ch] text-[14px] leading-6 text-muted-foreground">
                  Tools, demos, libraries, and visual references that can be searched by English terms or Chinese aliases.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button asChild variant="primary" size="sm" trailingIcon={ExternalLink}>
                    <a href="https://github.com/BIAsia/asset-vault" target="_blank" rel="noreferrer">Repository</a>
                  </Button>
                  <Button variant="tertiary" size="sm" leadingIcon={RotateCcw} disabled={!hasFilters} onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" disabled aria-label="Previous page">
                  <ArrowRight className="rotate-180" />
                </Button>
                <Button asChild variant="ghost" size="icon" aria-label="Skip to collection">
                  <a href="#collection">
                    <ArrowRight />
                  </a>
                </Button>
              </div>
            </div>
          </header>

          <div id="collection" className="mx-auto w-full max-w-[1200px] px-6 pb-16">
            <section className="mb-6 grid gap-3 rounded-xl border px-4 py-3 bento-card-border">
              <div className="grid gap-3 lg:grid-cols-[minmax(280px,420px)_1fr_auto] lg:items-end">
                <InputGroup className="w-full">
                  <InputField
                    index={0}
                    label="Search"
                    icon={Search}
                    value={query}
                    onChange={setQuery}
                    placeholder="线条, stroke, shader, vector..."
                    type="search"
                  />
                </InputGroup>

                <div className="grid gap-1">
                  <span className="pl-3 text-[13px] text-muted-foreground">View</span>
                  <TabsSubtle selectedIndex={viewMode === "gallery" ? 0 : 1} onSelect={(index) => setViewMode(index === 0 ? "gallery" : "table")}>
                    <TabsSubtleItem index={0} label="Gallery" icon={Grid3X3} />
                    <TabsSubtleItem index={1} label="Table" icon={List} />
                  </TabsSubtle>
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  <Badge size="sm" variant="dot" color="gray">{filteredAssets.length} shown</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                <FacetRow label="Type" facets={vault.facets.contentTypes} activeValue={activeType} onSelect={setActiveType} />
                <FacetRow label="Tags" facets={vault.facets.tags} activeValue={activeTag} onSelect={setActiveTag} />
              </div>

            </section>

            {filteredAssets.length > 0 ? (
              viewMode === "gallery" ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 bento-grid">
                  {filteredAssets.map((asset, index) => <AssetCard key={asset.id} asset={asset} index={index} />)}
                </div>
              ) : (
                <AssetTable assets={filteredAssets} />
              )
            ) : (
              <div className="grid place-items-center gap-3 rounded-xl border px-6 py-16 text-center bento-card-border">
                <p className="text-[16px]" style={{ fontVariationSettings: fontWeights.semibold }}>No matching assets</p>
                <p className="max-w-md text-[13px] leading-6 text-muted-foreground">Try a Chinese alias, an English technical term, or clear the current filters.</p>
                <Button variant="secondary" size="sm" onClick={resetFilters}>Clear search</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </ShapeProvider>
  );
}
