"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";

const bentoSizeClasses = {
  large: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2",
  small: "col-span-1",
} as const;

type BentoSize = keyof typeof bentoSizeClasses;

interface CatalogIntroProps {
  badges?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  navigation?: ReactNode;
}

function CatalogIntro({ badges, title, description, actions, navigation }: CatalogIntroProps) {
  return (
    <header className="mx-auto w-full max-w-[640px] px-6 py-20 sm:py-28">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
          <h1
            className="text-[22px] leading-none text-foreground sm:text-[28px]"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            {title}
          </h1>
          <p className="max-w-[56ch] text-[14px] leading-6 text-muted-foreground">{description}</p>
          {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {navigation && <div className="flex shrink-0 items-center gap-1">{navigation}</div>}
      </div>
    </header>
  );
}

function BentoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 bento-grid">
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  href?: string;
  title: string;
  badges?: ReactNode;
  summary?: string;
  aliases?: ReactNode;
  action?: ReactNode;
  gridSize?: BentoSize;
  className?: string;
  style?: CSSProperties;
}

function BentoCard({
  children,
  href,
  title,
  badges,
  summary,
  aliases,
  action,
  gridSize = "small",
  className,
  style,
}: BentoCardProps) {
  const content = (
    <div className="flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      {children}
    </div>
  );

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-[shadow,border-color] duration-80 bento-card-border",
        bentoSizeClasses[gridSize],
        className
      )}
      style={style}
    >
      {href ? (
        <a className="flex flex-1 outline-none focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]" href={href} aria-label={`Open ${title}`}>
          {content}
        </a>
      ) : (
        content
      )}

      <div className="shrink-0 border-t border-border/40">
        {href ? (
          <a
            href={href}
            className="group/link block px-4 py-3 transition-colors duration-80 outline-none hover:bg-hover focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
          >
            <BentoCardFooter title={title} badges={badges} summary={summary} />
          </a>
        ) : (
          <div className="px-4 py-3">
            <BentoCardFooter title={title} badges={badges} summary={summary} />
          </div>
        )}

        {(aliases || action) && (
          <div className="flex items-center justify-between gap-3 border-t border-border/30 px-4 py-2">
            <div className="flex min-w-0 gap-1.5 overflow-hidden">{aliases}</div>
            {action}
          </div>
        )}
      </div>
    </article>
  );
}

function BentoCardFooter({ title, badges, summary }: { title: string; badges?: ReactNode; summary?: string }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground"
          style={{ fontVariationSettings: fontWeights.medium }}
        >
          {title}
        </span>
        {badges}
        <ArrowRight size={15} strokeWidth={1.5} className="shrink-0 text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground" />
      </div>
      {summary && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{summary}</p>}
    </>
  );
}

function PreviewFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border/50 bg-muted", className)}>
      {children}
    </div>
  );
}

function PreviewCard({ children, footerHref, footerLabel }: { children: ReactNode; footerHref: string; footerLabel: string }) {
  return (
    <section className="overflow-hidden rounded-xl border bento-card-border">
      <div className="flex min-h-[260px] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
        <PreviewFrame>{children}</PreviewFrame>
      </div>
      <LinkFooter href={footerHref}>{footerLabel}</LinkFooter>
    </section>
  );
}

function DetailHeader({
  badges,
  title,
  description,
  actions,
}: {
  badges?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid gap-4">
      {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
      <div className="grid gap-2">
        <h1
          className="text-[22px] leading-none text-foreground sm:text-[28px]"
          style={{ fontVariationSettings: fontWeights.bold }}
        >
          {title}
        </h1>
        <p className="max-w-[65ch] text-[14px] leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

function FilterBar({ children }: { children: ReactNode }) {
  return (
    <section className="mb-6 grid gap-3 rounded-xl border px-4 py-3 bento-card-border">
      {children}
    </section>
  );
}

function FilterSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-border/40 pt-3", className)}>{children}</div>;
}

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function FilterChip({ active = false, className, children, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-[20px] px-2 text-[11px] outline-none transition-colors duration-80 focus-visible:ring-1 focus-visible:ring-[#6B97FF]",
        active ? "bg-active text-foreground" : "text-muted-foreground hover:bg-hover hover:text-foreground",
        className
      )}
      style={{ fontVariationSettings: active ? fontWeights.medium : fontWeights.normal }}
      {...props}
    >
      {children}
    </button>
  );
}

function TableFrame({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-xl border bento-card-border">{children}</div>;
}

function LinkFooter({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group/link flex items-center gap-2 border-t border-border/40 px-4 py-3 transition-colors duration-80 outline-none hover:bg-hover focus-visible:shadow-[inset_0_0_0_1px_#6B97FF]"
    >
      <span
        className="text-[13px] text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground"
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {children}
      </span>
      <ExternalLink size={14} strokeWidth={1.5} className="text-muted-foreground transition-colors duration-80 group-hover/link:text-foreground" />
    </a>
  );
}

function DocsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function BodyText({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-7 text-muted-foreground">{children}</p>;
}

function MetaRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-xl border px-4 py-3 text-[13px] text-muted-foreground bento-card-border sm:grid-cols-2">
      {children}
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <section className="grid place-items-center gap-3 rounded-xl border px-6 py-16 text-center bento-card-border">
      <h2 className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
        {title}
      </h2>
      <p className="max-w-md text-[14px] leading-6 text-muted-foreground">{description}</p>
      {action}
    </section>
  );
}

export {
  BodyText,
  BentoCard,
  BentoGrid,
  CatalogIntro,
  DetailHeader,
  DocsSection,
  EmptyState,
  FilterBar,
  FilterChip,
  FilterSection,
  LinkFooter,
  MetaRow,
  PreviewCard,
  PreviewFrame,
  TableFrame,
};
export type { BentoSize };
