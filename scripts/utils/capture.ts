import { mkdirSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { cacheDir, publicToolsDir, siteAssetPath } from "./paths";

export interface CapturedPage {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  text: string;
  html: string;
  previewImage: string;
  previewVideo?: string;
  ogImage?: string;
  favicon?: string;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractFromHtml(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  const title = cleanText(document.querySelector("title")?.textContent ?? "");
  const description = cleanText(
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
      ""
  );
  const ogImage =
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
    document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ??
    document.querySelector('link[rel="image_src"]')?.getAttribute("href") ??
    undefined;
  const favicon =
    document.querySelector('link[rel="icon"]')?.getAttribute("href") ??
    document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ??
    undefined;
  const article = new Readability(document.cloneNode(true) as Document).parse();
  const text = cleanText(article?.textContent || document.body?.textContent || "");
  return {
    title,
    description,
    text,
    ogImage: ogImage ? new URL(ogImage, url).toString() : undefined,
    favicon: favicon ? new URL(favicon, url).toString() : undefined
  };
}

function imageExtension(contentType: string) {
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/gif")) return "gif";
  if (contentType.includes("image/svg+xml")) return "svg";
  return "jpg";
}

async function downloadMetadataImage(imageUrl: string, assetDir: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`metadata image request failed: ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error(`metadata image is not an image: ${contentType || "unknown content-type"}`);
  const previewPath = path.join(assetDir, `preview.${imageExtension(contentType)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(previewPath, bytes);
  return siteAssetPath(previewPath);
}

export async function captureUrl(url: string, id: string): Promise<CapturedPage> {
  const assetDir = path.join(publicToolsDir, id);
  mkdirSync(assetDir, { recursive: true });
  const rawHtmlPath = path.join(assetDir, "raw.html");
  const profileDir = path.join(cacheDir, "playwright-profile");
  const recordVideo = process.env.VAULT_RECORD_VIDEO === "1";
  const videoDir = path.join(cacheDir, "videos", id);

  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(cacheDir, "ms-playwright");
    const { chromium } = await import("playwright");
    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      viewport: { width: 1440, height: 980 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      recordVideo: recordVideo ? { dir: videoDir, size: { width: 1440, height: 980 } } : undefined
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(recordVideo ? 4_000 : 1_200);

    const html = await page.content();
    const finalUrl = page.url();
    const meta = await page.evaluate(() => ({
      title: document.title || "",
      description:
        document.querySelector('meta[name="description"]')?.getAttribute("content") ||
        document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "",
      ogImage:
        document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
        document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
        document.querySelector('link[rel="image_src"]')?.getAttribute("href") ||
        "",
      favicon:
        document.querySelector('link[rel="icon"]')?.getAttribute("href") ||
        document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
        ""
    }));
    const extracted = extractFromHtml(html, finalUrl);
    writeFileSync(rawHtmlPath, html);

    const previewPath = path.join(assetDir, "preview.png");
    await page.screenshot({ path: previewPath, type: "png", fullPage: false });

    let previewVideo: string | undefined;
    const video = page.video();
    await page.close().catch(() => {});
    await context.close();
    if (recordVideo && video) {
      const capturedVideoPath = await video.path().catch(() => "");
      if (capturedVideoPath) {
        const previewVideoPath = path.join(assetDir, "preview.webm");
        await copyFile(capturedVideoPath, previewVideoPath);
        previewVideo = siteAssetPath(previewVideoPath);
      }
    }

    return {
      requestedUrl: url,
      finalUrl,
      title: cleanText(meta.title || extracted.title),
      description: cleanText(meta.description || extracted.description),
      text: extracted.text,
      html,
      previewImage: siteAssetPath(previewPath),
      previewVideo,
      ogImage: meta.ogImage ? new URL(meta.ogImage, finalUrl).toString() : extracted.ogImage,
      favicon: meta.favicon ? new URL(meta.favicon, finalUrl).toString() : extracted.favicon
    };
  } catch (error) {
    console.warn(`[vault] screenshot capture failed, trying metadata image fallback: ${(error as Error).message}`);
    const response = await fetch(url);
    const html = await response.text();
    const extracted = extractFromHtml(html, response.url || url);
    writeFileSync(rawHtmlPath, html);
    if (!extracted.ogImage) {
      throw new Error(`Unable to capture a real preview image for ${url}; screenshot failed and no metadata image was found`);
    }
    const previewImage = await downloadMetadataImage(extracted.ogImage, assetDir);
    return {
      requestedUrl: url,
      finalUrl: response.url || url,
      title: extracted.title || new URL(url).hostname,
      description: extracted.description,
      text: extracted.text,
      html,
      previewImage,
      ogImage: extracted.ogImage,
      favicon: extracted.favicon
    };
  }
}
