import crypto from "node:crypto";

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString();
}

export function shortHash(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72);
}

export function slugFromUrl(url: string, title?: string) {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  const pathPart = parsed.pathname.split("/").filter(Boolean).slice(0, 2).join("-");
  const titlePart = title ? slugify(title) : "";
  const base = slugify(titlePart || [host, pathPart].filter(Boolean).join("-"));
  return base || `asset-${shortHash(url)}`;
}
