import { loadLocalEnv } from "./env";
import { AiToolCardSchema } from "./schema";
import type { AiToolCard } from "./schema";
import type { CapturedPage } from "./capture";
import { expandAliases, normalizeTags } from "./taxonomy";
import type { Taxonomy } from "./taxonomy";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function extractJson(value: string) {
  const trimmed = value.trim().replace(/^```json\s*|\s*```$/g, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return trimmed;
  return trimmed.slice(start, end + 1);
}

function heuristicCard(page: CapturedPage, taxonomy: Taxonomy): AiToolCard {
  const corpus = `${page.title} ${page.description} ${page.text}`.toLowerCase();
  const tags: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ["graphics", /graphics?|visual|canvas|webgl|svg|vector|render/],
    ["vector", /vector|svg|path/],
    ["stroke", /stroke|line|path|draw|pen|brush|outline/],
    ["shader", /shader|gpu|webgl|glsl|fragment/],
    ["rendering", /render|raster|pbr|physically based/],
    ["typography", /typography|text|font|glyph|letter/],
    ["animation", /animation|motion|timeline|transition/],
    ["creative-coding", /creative coding|generative|canvas|experiment/],
    ["library", /library|framework|sdk|api|typescript|javascript/]
  ];
  for (const [tag, pattern] of checks) {
    if (pattern.test(corpus)) tags.push(tag);
  }
  const normalizedTags = normalizeTags(tags.length ? tags : ["reference"], taxonomy);
  const aliases = expandAliases(normalizedTags, [], taxonomy);
  const title = page.title || new URL(page.finalUrl).hostname;
  const summary =
    page.description ||
    truncate(page.text.split(/[.!?。！？]/).find((sentence) => sentence.trim().length > 24)?.trim() || `${title} is a saved web reference.`, 220);
  const features = [
    ...new Set(
      page.text
        .split(/\n|•|- /)
        .map((line) => line.trim())
        .filter((line) => line.length >= 8 && line.length <= 90)
        .slice(0, 6)
    )
  ];

  return AiToolCardSchema.parse({
    title,
    url: page.finalUrl,
    contentType: corpus.includes("github.com") ? "repo" : "tool",
    summary,
    features: features.length ? features : ["Captured page metadata", "Searchable aliases", "Visual preview"],
    tags: normalizedTags,
    aliases,
    useCases: aliases.includes("线条") ? ["动态线条", "路径着色", "文本描边参考"] : ["工具调研", "视觉参考", "项目灵感沉淀"],
    whyInteresting: `${title} was collected because it appears relevant to ${normalizedTags.join(", ")} workflows.`
  });
}

export async function generateToolCard(page: CapturedPage, taxonomy: Taxonomy): Promise<AiToolCard> {
  loadLocalEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return heuristicCard(page, taxonomy);

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const allowedTags = Object.keys(taxonomy.tags);
  const prompt = {
    url: page.finalUrl,
    title: page.title,
    description: page.description,
    text: truncate(page.text, 10_000),
    allowedTags,
    outputContract: {
      title: "string",
      url: "valid URL",
      contentType: "tool | library | reference | demo | article | video | repo",
      summary: "Chinese preferred, one concise sentence",
      features: ["3-8 concrete features"],
      tags: ["use broad allowedTags where possible"],
      aliases: ["Chinese and English search terms, include translations and related concepts"],
      useCases: ["concrete use cases"],
      whyInteresting: "why this is worth saving"
    }
  };

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You create structured cards for a personal public asset library. Return JSON only. Prefer precise Chinese summaries and aliases. Use broad stable tags."
          },
          { role: "user", content: JSON.stringify(prompt) }
        ]
      })
    });
    if (!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI response did not include content");
    const parsed = AiToolCardSchema.parse(JSON.parse(extractJson(content)));
    const tags = normalizeTags(parsed.tags, taxonomy);
    return AiToolCardSchema.parse({
      ...parsed,
      url: page.finalUrl,
      tags,
      aliases: expandAliases(tags, parsed.aliases, taxonomy)
    });
  } catch (error) {
    console.warn(`[vault] AI generation failed, using heuristic fallback: ${(error as Error).message}`);
    return heuristicCard(page, taxonomy);
  }
}
