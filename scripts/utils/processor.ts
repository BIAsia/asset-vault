import { appendFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { captureUrl } from "./capture";
import { generateToolCard } from "./ai";
import { materializeTool } from "./content";
import { loadTaxonomy } from "./taxonomy";
import { processedPath, failedPath } from "./paths";
import { readQueue, removeQueueItem } from "./queue";
import { maybeCommitAndPush } from "./git";

function pnpmRun(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm ${args.join(" ")} failed with ${code}`));
    });
  });
}

export async function processNext() {
  const [item] = readQueue();
  if (!item) return false;
  console.log(`[vault] processing ${item.url}`);

  try {
    const taxonomy = loadTaxonomy();
    const provisionalId = new URL(item.url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const captured = await captureUrl(item.url, provisionalId);
    const card = await generateToolCard(captured, taxonomy);
    const result = await materializeTool(card, {
      previewImage: captured.previewImage,
      previewVideo: captured.previewVideo
    });

    await pnpmRun(["vault:rebuild-index"]);
    await pnpmRun(["vault:validate"]);

    removeQueueItem(item.id);
    appendFileSync(
      processedPath,
      `${JSON.stringify({ ...item, processedAt: new Date().toISOString(), toolId: result.tool.id, status: "processed" })}\n`
    );
    await maybeCommitAndPush(`vault: collect ${result.tool.title}`);
    console.log(`[vault] collected ${result.tool.title}`);
    return true;
  } catch (error) {
    removeQueueItem(item.id);
    appendFileSync(
      failedPath,
      `${JSON.stringify({ ...item, failedAt: new Date().toISOString(), error: (error as Error).message })}\n`
    );
    throw error;
  }
}
