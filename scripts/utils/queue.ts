import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { pendingPath } from "./paths";
import { QueueItemSchema } from "./schema";
import type { QueueItem } from "./schema";

export function readQueue() {
  if (!existsSync(pendingPath)) return [];
  const lines = readFileSync(pendingPath, "utf8").split(/\r?\n/).filter(Boolean);
  return lines
    .map((line) => QueueItemSchema.safeParse(JSON.parse(line)))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export function appendQueue(item: QueueItem) {
  appendFileSync(pendingPath, `${JSON.stringify(item)}\n`);
}

export function writeQueue(items: QueueItem[]) {
  writeFileSync(pendingPath, items.map((item) => JSON.stringify(item)).join("\n") + (items.length ? "\n" : ""));
}

export function removeQueueItem(id: string) {
  const next = readQueue().filter((item) => item.id !== id);
  writeQueue(next);
}

export function queueHasUrl(url: string) {
  return readQueue().some((item) => item.url === url);
}
