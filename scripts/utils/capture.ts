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
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? undefined;
  const favicon =
    document.querySelector('link[rel="icon"]')?.getAttribute("href") ??
    document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ??
    undefined;
  const article = new Readability(document.cloneNode(true) as Document).parse();
  const text = cleanText(article?.textContent || document.body?.textContent || "");
  return { title, description, text, ogImage, favicon };
}

function placeholderSvg(title: string, url: string) {
  const safeTitle = title.replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char] ?? char);
  const host = new URL(url).hostname.replace(/^www\./, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#f3efe2"/>
  <path d="M80 620 C 290 470, 400 680, 610 520 S 990 300, 1200 430" fill="none" stroke="#167c65" stroke-width="18" stroke-linecap="round"/>
  <text x="80" y="160" font-family="Georgia, serif" font-size="86" fill="#1f2533">${safeTitle || "Captured Asset"}</text>
  <text x="84" y="230" font-family="Arial, sans-serif" font-size="32" fill="#626a75">${host}</text>
</svg>`;
}

export async function captureUrl(url: string, id: string): Promise<CapturedPage> {
  const assetDir = path.join(publicToolsDir, id);
  mkdirSync(assetDir, { recursive: true });
  const rawHtmlPath = path.join(assetDir, "raw.html");
  const profileDir = path.join(cacheDir, "playwright-profile");
  const recordVideo = process.env.VAULT_RECORD_VIDEO === "1";
  const videoDir = path.join(cacheDir, "videos", id);

  try {
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
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
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
      ogImage: meta.ogImage || extracted.ogImage,
      favicon: meta.favicon || extracted.favicon
    };
  } catch (error) {
    const response = await fetch(url);
    const html = await response.text();
    const extracted = extractFromHtml(html, response.url || url);
    writeFileSync(rawHtmlPath, html);
    const previewPath = path.join(assetDir, "preview.svg");
    writeFileSync(previewPath, placeholderSvg(extracted.title, url));
    return {
      requestedUrl: url,
      finalUrl: response.url || url,
      title: extracted.title || new URL(url).hostname,
      description: extracted.description,
      text: extracted.text,
      html,
      previewImage: siteAssetPath(previewPath),
      ogImage: extracted.ogImage,
      favicon: extracted.favicon
    };
  }
}
