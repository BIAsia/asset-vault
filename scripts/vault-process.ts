import { ensureProjectDirs } from "./utils/paths";
import { processNext } from "./utils/processor";

ensureProjectDirs();
const processed = await processNext();
if (!processed) console.log("[vault] queue is empty");
