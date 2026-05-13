"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  ExternalLink,
  Grid3X3,
  Layers3,
  List,
  RotateCcw,
  Search,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { InputField, InputGroup } from "@/components/fluid/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/fluid/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/fluid/table";
import { TabsSubtle, TabsSubtleItem } from "@/components/fluid/tabs-subtle";
import {
  BentoCard,
  BentoGrid,
  CatalogIntro,
  EmptyState,
  FilterBar,
  FilterChip,
  FilterSection,
  PreviewFrame,
  TableFrame,
  type BentoSize,
} from "@/components/fluid/patterns";
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

function cardGridSize(index: number): BentoSize {
  if (index === 0) return "large";
  if (index === 3) return "wide";
  return "small";
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
    <div className="grid gap-1.5 sm:grid-cols-[auto_1fr] sm:items-start">
      <div>
        <Badge variant="dot" size="sm" color="gray">{label}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <FilterChip active={!activeValue} onClick={() => onSelect("")}>All</FilterChip>
        {facets.map((facet) => (
          <FilterChip
            key={facet.name}
            active={activeValue === facet.name}
            onClick={() => onSelect(activeValue === facet.name ? "" : facet.name)}
          >
            {facet.name} {facet.count}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FacetSelect({
  label,
  facets,
  value,
  onSelect,
  icon,
}: {
  label: string;
  facets: VaultFacet[];
  value: string;
  onSelect: (value: string) => void;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger icon={icon} placeholder={`All ${label}`} className="w-full" />
      <SelectContent>
        <SelectItem index={0} value="">All {label}</SelectItem>
        {facets.map((facet, index) => (
          <SelectItem key={facet.name} index={index + 1} value={facet.name}>
            {facet.name} {facet.count}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const badges = (
    <>
      <Badge variant="dot" size="sm" color={colorFor(asset.contentType)}>{asset.contentType}</Badge>
      {asset.tags.slice(0, 2).map((tag) => (
        <Badge key={tag} size="sm" color={colorFor(tag)}>{tag}</Badge>
      ))}
    </>
  );

  return (
    <BentoCard
      href={asset.href}
      title={asset.title}
      badges={badges}
      summary={asset.summary}
      gridSize={cardGridSize(index)}
    >
      <PreviewFrame>
        <AssetPreview asset={asset} />
      </PreviewFrame>
    </BentoCard>
  );
}

function AssetTable({ assets }: { assets: ToolAsset[] }) {
  return (
    <TableFrame>
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
                  <span>{asset.title}</span>
                  <span className="max-w-[58ch] truncate text-muted-foreground">{asset.summary}</span>
                </a>
              </TableCell>
              <TableCell className="hidden md:table-cell">{asset.contentType}</TableCell>
              <TableCell className="hidden lg:table-cell">{asset.tags.slice(0, 3).join(", ")}</TableCell>
              <TableCell className="text-right">{formatDate(asset.updated)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mt-12 lg:mt-0">
        <CatalogIntro
          badges={
            <>
              <Badge variant="dot" size="sm" color="teal">Agent maintained</Badge>
              <Badge variant="dot" size="sm" color="gray">{vault.stats.total} saved</Badge>
              <Badge variant="dot" size="sm" color="blue">Updated {formatDate(vault.stats.latestUpdated)}</Badge>
            </>
          }
          title="Asset Vault"
          description="Tools, demos, libraries, and visual references that can be searched by English terms or Chinese aliases."
          actions={
            <Button asChild variant="primary" size="sm" trailingIcon={ExternalLink}>
              <a href="https://github.com/BIAsia/asset-vault" target="_blank" rel="noreferrer">Repository</a>
            </Button>
          }
          navigation={
            <>
              <Button variant="ghost" size="icon" disabled aria-label="Previous page">
                <ArrowRight className="rotate-180" />
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Skip to collection">
                <a href="#collection">
                  <ArrowRight />
                </a>
              </Button>
            </>
          }
        />

        <div id="collection" className="mx-auto w-full max-w-[1200px] px-6 pb-16">
          <FilterBar>
            <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto] lg:items-end">
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

              <div className="flex items-center">
                <TabsSubtle selectedIndex={viewMode === "gallery" ? 0 : 1} onSelect={(index) => setViewMode(index === 0 ? "gallery" : "table")}>
                  <TabsSubtleItem index={0} label="Gallery" icon={Grid3X3} />
                  <TabsSubtleItem index={1} label="Table" icon={List} />
                </TabsSubtle>
              </div>

              <div className="flex items-center gap-2 lg:justify-end">
                <Badge size="sm" variant="dot" color="gray">{filteredAssets.length} shown</Badge>
                {hasFilters && (
                  <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <FilterSection className="hidden grid-cols-1 gap-1.5 md:grid">
              <FacetRow label="Type" facets={vault.facets.contentTypes} activeValue={activeType} onSelect={setActiveType} />
              <FacetRow label="Tags" facets={vault.facets.tags} activeValue={activeTag} onSelect={setActiveTag} />
            </FilterSection>

            <FilterSection className="grid gap-2 md:hidden">
              <FacetSelect label="types" facets={vault.facets.contentTypes} value={activeType} onSelect={setActiveType} icon={Layers3} />
              <FacetSelect label="tags" facets={vault.facets.tags} value={activeTag} onSelect={setActiveTag} icon={Tags} />
            </FilterSection>
          </FilterBar>

          {filteredAssets.length > 0 ? (
            viewMode === "gallery" ? (
              <BentoGrid>
                {filteredAssets.map((asset, index) => <AssetCard key={asset.id} asset={asset} index={index} />)}
              </BentoGrid>
            ) : (
              <AssetTable assets={filteredAssets} />
            )
          ) : (
            <EmptyState
              title="No matching assets"
              description="Try a Chinese alias, an English technical term, or clear the current filters."
              action={<Button variant="secondary" size="sm" onClick={resetFilters}>Clear search</Button>}
            />
          )}
        </div>
      </div>
    </main>
  );
}
