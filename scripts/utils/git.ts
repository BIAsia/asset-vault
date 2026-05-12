import { spawn } from "node:child_process";

function run(command: string, args: string[], allowFail = false) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (code) => {
      const result = { code: code ?? 0, stdout, stderr };
      if (!allowFail && result.code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed: ${stderr || stdout}`));
      } else {
        resolve(result);
      }
    });
  });
}

export async function maybeCommitAndPush(message: string) {
  const inside = await run("git", ["rev-parse", "--is-inside-work-tree"], true);
  if (inside.code !== 0 || inside.stdout.trim() !== "true") {
    console.warn("[vault] not inside a git repo; skipping commit/push");
    return;
  }

  await run("git", ["add", "src/content/tools", "public/assets/tools", "public/data/tools.json", "data/tools.generated.json", "inbox"], true);
  const status = await run("git", ["status", "--porcelain"], true);
  if (!status.stdout.trim()) {
    console.log("[vault] no git changes to commit");
    return;
  }

  await run("git", ["commit", "-m", message], true);
  const remotes = await run("git", ["remote"], true);
  if (process.env.VAULT_GIT_PUSH === "0" || !remotes.stdout.trim()) {
    console.log("[vault] commit created; skipping push");
    return;
  }
  await run("git", ["push"], true);
}
