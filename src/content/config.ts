import { defineCollection, z } from "astro:content";

const tools = defineCollection({
  type: "content",
  schema: z.object({
    schemaVersion: z.literal(1),
    id: z.string().min(2),
    title: z.string().min(1),
    url: z.string().url(),
    links: z.array(z.object({
      label: z.string().min(1),
      url: z.string().url()
    })).default([]),
    contentType: z.enum(["tool", "library", "reference", "demo", "article", "video", "repo"]).default("tool"),
    summary: z.string().min(1),
    features: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    aliases: z.array(z.string()).default([]),
    useCases: z.array(z.string()).default([]),
    whyInteresting: z.string().default(""),
    previewImage: z.string().min(1),
    previewVideo: z.string().optional(),
    created: z.coerce.date(),
    updated: z.coerce.date()
  })
});

export const collections = { tools };
