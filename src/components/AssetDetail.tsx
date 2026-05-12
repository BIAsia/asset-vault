"use client";

import { ArrowLeft, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/fluid/table";
import { fontWeights } from "@/lib/font-weight";
import { ShapeProvider } from "@/lib/shape-context";
import { cn } from "@/lib/utils";
import type { ToolAsset } from "@/lib/vault";

interface AssetDetailProps {
  asset: ToolAsset;
}

const badgeColors = ["gray", "blue", "teal", "violet", "amber", "rose", "green"] as const;

function colorFor(value: string) {
  let total = 0;
  for (const char of value) total += char.charCodeAt(0);
  return badgeColors[total % badgeColors.length];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

function AssetPreview({ asset }: { asset: ToolAsset }) {
  if (asset.previewVideo) {
    return (
      <video
        className="aspect-[16/10] h-full w-full object-contain"
        src={asset.previewVideo}
        poster={asset.previewImage}
        muted
        playsInline
        loop
        controls
        preload="metadata"
      />
    );
  }

  return (
    <img
      className="aspect-[16/10] h-full w-full object-contain"
      src={asset.previewImage}
      alt={`${asset.title} preview`}
    />
  );
}

export default function AssetDetail({ asset }: AssetDetailProps) {
  return (
    <ShapeProvider defaultShape="pill">
      <section className="grid gap-8">
        <nav className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" leadingIcon={ArrowLeft}>
            <a href="/">Asset Vault</a>
          </Button>
          <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${asset.title} original`}>
            <a href={asset.url} target="_blank" rel="noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </nav>

        <header className="grid gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="dot" size="sm" color={colorFor(asset.contentType)}>{asset.contentType}</Badge>
            {asset.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} size="sm" color={colorFor(tag)}>{tag}</Badge>
            ))}
          </div>
          <div className="grid gap-2">
            <h1
              className="text-[22px] leading-none text-foreground sm:text-[28px]"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              {asset.title}
            </h1>
            <p className="max-w-[65ch] text-[14px] leading-6 text-muted-foreground">{asset.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary" size="sm" trailingIcon={ExternalLink}>
              <a href={asset.url} target="_blank" rel="noreferrer">Open primary</a>
            </Button>
            <Button asChild variant="tertiary" size="sm" leadingIcon={LinkIcon}>
              <a href="#links">Links</a>
            </Button>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border bento-card-border">
          <div className="flex min-h-[260px] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
            <div className="w-full overflow-hidden rounded-lg border border-border/50 bg-muted">
              <AssetPreview asset={asset} />
            </div>
          </div>
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="group/link flex items-center gap-2 border-t border-border/40 px-4 py-3 transition-colors duration-80 outline-none hover:bg-hover focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
          >
            <span
              className="text-[13px] text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground"
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              {new URL(asset.url).hostname.replace(/^www\./, "")}
            </span>
            <ExternalLink size={14} strokeWidth={1.5} className="text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground" />
          </a>
        </section>

        <section id="details" className="grid gap-5">
          <div className="grid gap-2">
            <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>Why it matters</h2>
            <p className="text-[14px] leading-7 text-muted-foreground">{asset.whyInteresting}</p>
          </div>

          <div className="overflow-hidden rounded-xl border bento-card-border">
            <Table>
              <TableBody>
                {asset.features.map((feature, index) => (
                  <TableRow key={feature} index={index}>
                    <TableCell className="w-24 text-foreground">Feature</TableCell>
                    <TableCell>{feature}</TableCell>
                  </TableRow>
                ))}
                {asset.useCases.map((useCase, index) => (
                  <TableRow key={useCase} index={asset.features.length + index}>
                    <TableCell className="w-24 text-foreground">Use case</TableCell>
                    <TableCell>{useCase}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-2">
            <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>Aliases</h2>
            <div className="flex flex-wrap gap-1.5">
              {asset.aliases.map((alias) => (
                <Badge key={alias} size="sm" color="gray">{alias}</Badge>
              ))}
            </div>
          </div>

          <div id="links" className="grid gap-2">
            <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>Links</h2>
            <div className="flex flex-wrap gap-2">
              {asset.links.map((link) => (
                <Button key={link.url} asChild variant="tertiary" size="sm" trailingIcon={ExternalLink}>
                  <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
                </Button>
              ))}
            </div>
          </div>

          <div className={cn("grid gap-2 rounded-xl border px-4 py-3 text-[13px] text-muted-foreground bento-card-border sm:grid-cols-2")}>
            <p>Created <span className="text-foreground">{formatDate(asset.created)}</span></p>
            <p>Updated <span className="text-foreground">{formatDate(asset.updated)}</span></p>
          </div>
        </section>
      </section>
    </ShapeProvider>
  );
}
