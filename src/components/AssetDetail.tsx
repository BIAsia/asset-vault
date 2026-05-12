"use client";

import { ArrowLeft, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/fluid/table";
import { ShapeProvider } from "@/lib/shape-context";
import { surfaceClasses } from "@/lib/surface-classes";
import { cn } from "@/lib/utils";
import type { ToolAsset } from "@/lib/vault";

interface AssetDetailProps {
  asset: ToolAsset;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function AssetDetail({ asset }: AssetDetailProps) {
  return (
    <ShapeProvider defaultShape="pill">
      <section className="grid gap-5">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" leadingIcon={ArrowLeft}>
            <a href="/">Asset Vault</a>
          </Button>
          <div className="flex flex-wrap gap-2">
            {asset.links.map((link) => (
              <Button key={link.url} asChild variant="tertiary" trailingIcon={ExternalLink}>
                <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
              </Button>
            ))}
          </div>
        </nav>

        <header className={cn("grid gap-5 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:items-center", surfaceClasses(2, 3), "rounded-3xl")}>
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="dot">{asset.contentType}</Badge>
              {asset.tags.slice(0, 4).map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
            <div>
              <h1 className="text-[clamp(36px,7vw,88px)] font-semibold leading-[0.92] tracking-[-0.045em]">{asset.title}</h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{asset.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="primary" trailingIcon={ExternalLink}>
                <a href={asset.url} target="_blank" rel="noreferrer">Open primary</a>
              </Button>
              <Button asChild variant="secondary" leadingIcon={LinkIcon}>
                <a href="#details">Inspect details</a>
              </Button>
            </div>
          </div>
          <div className={cn("overflow-hidden", surfaceClasses(3, 6), "rounded-3xl")}>
            {asset.previewVideo ? (
              <video className="aspect-[16/10] h-full w-full object-cover" src={asset.previewVideo} poster={asset.previewImage} muted playsInline loop controls preload="metadata" />
            ) : (
              <img className="aspect-[16/10] h-full w-full object-cover" src={asset.previewImage} alt={`${asset.title} preview`} />
            )}
          </div>
        </header>

        <section id="details" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className={cn("grid gap-4 p-4", surfaceClasses(3, 4), "rounded-3xl")}>
            <div>
              <p className="text-[12px] text-muted-foreground">Why it matters</p>
              <p className="mt-2 text-[18px] leading-7 tracking-[-0.02em]">{asset.whyInteresting}</p>
            </div>
            <Table>
              <TableBody>
                {asset.features.map((feature, index) => (
                  <TableRow key={feature} index={index}>
                    <TableCell className="w-28 text-foreground">Feature</TableCell>
                    <TableCell>{feature}</TableCell>
                  </TableRow>
                ))}
                {asset.useCases.map((useCase, index) => (
                  <TableRow key={useCase} index={asset.features.length + index}>
                    <TableCell className="w-28 text-foreground">Use case</TableCell>
                    <TableCell>{useCase}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <aside className={cn("grid h-fit gap-5 p-4", surfaceClasses(3, 4), "rounded-3xl")}>
            <div>
              <p className="mb-2 text-[12px] text-muted-foreground">Aliases</p>
              <div className="flex flex-wrap gap-1.5">
                {asset.aliases.map((alias) => <span key={alias} className="rounded-full bg-hover px-2.5 py-1 text-[12px] text-muted-foreground">{alias}</span>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px] text-muted-foreground">Links</p>
              <div className="grid gap-2">
                {asset.links.map((link) => (
                  <a key={link.url} className="truncate rounded-full bg-hover px-3 py-2 text-[13px] text-foreground transition-colors hover:bg-active" href={link.url} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-hover px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Created</p>
                <p className="text-[13px]">{formatDate(asset.created)}</p>
              </div>
              <div className="rounded-2xl bg-hover px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Updated</p>
                <p className="text-[13px]">{formatDate(asset.updated)}</p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </ShapeProvider>
  );
}
