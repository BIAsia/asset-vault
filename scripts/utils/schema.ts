import { z } from "zod";

export const ContentTypeSchema = z.enum(["tool", "library", "reference", "demo", "article", "video", "repo"]);

export const AiToolCardSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  contentType: ContentTypeSchema.default("tool"),
  summary: z.string().min(12).max(420),
  features: z.array(z.string().min(1)).min(1).max(10),
  tags: z.array(z.string().min(1)).min(1).max(12),
  aliases: z.array(z.string().min(1)).min(2).max(30),
  useCases: z.array(z.string().min(1)).min(1).max(10),
  whyInteresting: z.string().min(1).max(600)
});

export const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url()
});

const DateStringSchema = z.preprocess(
  (value) => value instanceof Date ? value.toISOString() : value,
  z.string().datetime()
);

export const MaterializedToolSchema = AiToolCardSchema.extend({
  schemaVersion: z.literal(1),
  id: z.string().min(2),
  links: z.array(LinkSchema).default([]),
  previewImage: z.string().min(1),
  previewVideo: z.string().optional(),
  created: DateStringSchema,
  updated: DateStringSchema
});

export type AiToolCard = z.infer<typeof AiToolCardSchema>;
export type MaterializedTool = z.infer<typeof MaterializedToolSchema>;

export interface QueueItem {
  id: string;
  url: string;
  submittedAt: string;
  source: string;
  force?: boolean;
}

export const QueueItemSchema = z.object({
  id: z.string().min(8),
  url: z.string().url(),
  submittedAt: z.string().datetime(),
  source: z.string().default("local-agent"),
  force: z.boolean().optional()
});
