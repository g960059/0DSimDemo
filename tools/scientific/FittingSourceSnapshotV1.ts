import { spawn, execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, open, access } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
import { promisify } from "node:util";
import { writeFittingRunJsonV1 as writeJson } from "./FittingRunFilesV1";

const execute = promisify(execFile);
const hash = (bytes: string | Uint8Array) => createHash("sha256").update(bytes).digest("hex");
// Include numerical/analysis code, their data, CLI entry points and build inputs;
// not generated research runs or installed dependencies.
const roots = ["engine", "analysis", "domain", "runtime", "data", "studio", "tools", "components", "appTheme.ts", "index.css", "homeLinks.ts", "localeRouting.ts",
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
  if (hash(JSON.stringify(await inventory(root))) !== sourceSha256)
    throw new Error("Fitting source changed while archiving; do not execute this snapshot");
  // An interrupted run still has its input source, but no completed-run seal.
  await writeJson(dirname(resolve(prefix)), basename(`${prefix}.started.json`), { ...source, status: "started-not-sealed" });
  return sourceSession(prefix, root, source);
}

type Source = { schemaId: string; sourceSha256: string; archive: { filename: string; sha256: string };
  files: { path: string; sha256: string }[]; environment: { node: string; platform: string; architecture: string } };

/** Resume the same source, not merely the same commit/model name. The original
 * archive is retained; a changed source or environment requires a new run. */
export async function resumeFittingSourceSnapshotV1(prefix: string) {
  try { await access(`${prefix}.source.json`); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const { stdout } = await execute("git", ["rev-parse", "--show-toplevel"]), root = stdout.trim();
    const { status, ...source } = JSON.parse(await readFile(`${prefix}.started.json`, "utf8")) as Source & { status: string };
    if (status !== "started-not-sealed" || source.schemaId !== "fitting-source-snapshot-v1"
      || source.archive.filename !== basename(`${prefix}.source.tar.gz`)
      || hash(JSON.stringify(source.files)) !== source.sourceSha256
      || hash(await readFile(`${prefix}.source.tar.gz`)) !== source.archive.sha256
      || hash(JSON.stringify(await inventory(root))) !== source.sourceSha256
      || source.environment.node !== process.version || source.environment.platform !== process.platform
      || source.environment.architecture !== process.arch)
      throw new Error("Fitting resume source/archive/environment differs; start a new run");
    return sourceSession(prefix, root, source);
  }
  throw new Error("Fitting run is already sealed; no execution may be appended");
}

function sourceSession(prefix: string, root: string, source: Source) {
  const { sourceSha256 } = source;
  return Object.freeze({ sourceSha256, finish: async (outputs: readonly string[]) => {
    if (!Array.isArray(outputs)) throw new Error("Fitting source seal requires an explicit output-file list; use [] only for a source-only record");
    if (hash(JSON.stringify(await inventory(root))) !== sourceSha256) {
      throw new Error("Fitting source changed during this run; retained results are not source-bound. Rerun from a stable worktree.");
    }
    const results = [];
    for (const path of [...new Set(outputs)]) results.push({ filename: basename(path), sha256: hash(await readFile(path)) });
    // A killed writer must not expose a truncated seal that blocks replay of
    // otherwise complete jobs. Publish the whole seal atomically, without overwrite.
    await writeJson(dirname(resolve(prefix)), basename(`${prefix}.source.json`), { ...source, results });
  } });
}
