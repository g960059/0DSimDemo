import { spawn, execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile, open } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
// Include numerical/analysis code, their data, CLI entry points and build inputs;
// not generated research runs or installed dependencies.
const roots = ["engine", "analysis", "domain", "data", "studio", "tools",
  "package.json", "package-lock.json", "tsconfig.json", "tsconfig.node.json",
  "vite.config.ts", "vitest.config.ts"];

async function inventory(root: string) {
  const { stdout } = await execute("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ...roots], { cwd: root });
  const paths = [...new Set(stdout.split("\0").filter(Boolean))].sort();
  const files: { path: string; sha256: string }[] = [];
  for (const path of paths) {
    try { files.push({ path, sha256: hash(await readFile(resolve(root, path))) }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  return files;
}

/** Run-level source archive, including dirty/untracked source. Never a step cost.
 * The sidecar binds the archive to the produced files, not to a model-ID claim.
 * Keep archive + sidecar + results together; dependencies are pinned by lockfile.
 */
export async function beginFittingSourceSnapshotV1(prefix: string) {
  const { stdout } = await execute("git", ["rev-parse", "--show-toplevel"]);
  const root = stdout.trim();
  const { stdout: commit } = await execute("git", ["rev-parse", "HEAD"], { cwd: root });
  const files = await inventory(root);
  const archivePath = resolve(`${prefix}.source.tar.gz`);
  const archive = await open(archivePath, "wx");
  try {
    await new Promise<void>((done, reject) => {
      const child = spawn("tar", ["-czf", "-", "--null", "-T", "-"], { cwd: root, stdio: ["pipe", archive.fd, "pipe"] });
      let stderr = "";
      child.stderr!.on("data", chunk => { stderr += String(chunk); });
      child.on("error", reject);
      child.stdin!.on("error", reject);
      child.on("close", code => code === 0 ? done() : reject(new Error(`Fitting source archive failed: ${stderr}`)));
      child.stdin!.end(files.map(f => f.path).join("\0") + "\0");
    });
  } finally { await archive.close(); }
  const sourceSha256 = hash(JSON.stringify(files));
  const source = { schemaId: "fitting-source-snapshot-v1", sourceCommit: commit.trim(), sourceSha256,
    archive: { filename: basename(archivePath), sha256: hash(await readFile(archivePath)) }, files,
    environment: { node: process.version, platform: process.platform, architecture: process.arch },
    dependencyInstallationArchived: false };
  return Object.freeze({ sourceSha256, finish: async (outputs: readonly string[]) => {
    if (hash(JSON.stringify(await inventory(root))) !== sourceSha256) {
      throw new Error("Fitting source changed during this run; retained results are not source-bound. Rerun from a stable worktree.");
    }
    const results = [];
    for (const path of outputs) results.push({ filename: basename(path), sha256: hash(await readFile(path)) });
    await writeFile(`${prefix}.source.json`, JSON.stringify({ ...source, results }, null, 2) + "\n", { flag: "wx" });
  } });
}
