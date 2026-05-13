"use client";

import { ArrowLeft, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/fluid/badge";
import { Button } from "@/components/fluid/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/fluid/table";
import {
  BodyText,
  DetailHeader,
  DocsSection,
  MetaRow,
  PreviewCard,
  TableFrame,
} from "@/components/fluid/patterns";
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

function hostLabel(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
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

      <DetailHeader
        badges={
          <>
            <Badge variant="dot" size="sm" color={colorFor(asset.contentType)}>{asset.contentType}</Badge>
            {asset.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} size="sm" color={colorFor(tag)}>{tag}</Badge>
            ))}
          </>
        }
        title={asset.title}
        description={asset.summary}
        actions={
          <>
            <Button asChild variant="primary" size="sm" trailingIcon={ExternalLink}>
              <a href={asset.url} target="_blank" rel="noreferrer">Open primary</a>
            </Button>
            <Button asChild variant="tertiary" size="sm" leadingIcon={LinkIcon}>
              <a href="#links">Links</a>
            </Button>
          </>
        }
      />

      <PreviewCard footerHref={asset.url} footerLabel={hostLabel(asset.url)}>
        <AssetPreview asset={asset} />
      </PreviewCard>

      <section id="details" className="grid gap-5">
        <DocsSection title="Why it matters">
          <BodyText>{asset.whyInteresting}</BodyText>
        </DocsSection>

        <TableFrame>
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
        </TableFrame>
      </section>

      <section className="grid gap-5">
        <DocsSection title="Aliases">
          <div className="flex flex-wrap gap-1.5">
            {asset.aliases.map((alias) => (
              <Badge key={alias} size="sm" color="gray">{alias}</Badge>
            ))}
          </div>
        </DocsSection>

        <DocsSection title="Links">
          <div id="links" className="flex flex-wrap gap-2">
            {asset.links.map((link) => (
              <Button key={link.url} asChild variant="tertiary" size="sm" trailingIcon={ExternalLink}>
                <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
              </Button>
            ))}
          </div>
        </DocsSection>

        <MetaRow>
          <p>Created <span className="text-foreground">{formatDate(asset.created)}</span></p>
          <p>Updated <span className="text-foreground">{formatDate(asset.updated)}</span></p>
        </MetaRow>
      </section>
    </section>
  );
}
