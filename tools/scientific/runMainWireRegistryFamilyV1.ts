import { access, mkdir, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify as canonical, sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import { MAIN_WIRE_CASE_PARENT_V1 as parents, MAIN_WIRE_STATIC_CASE_DEFINITIONS_V1 as definitions } from "@/analysis/registry/MainWireStaticCaseDefinitionsV1";
import { CURRENT_MODEL_PRESETS_V1 as adopted } from "@/data/model-releases/CurrentModelReleaseV1";
import { ownMainWireRegistryProposalsV1 as ownProposals, type MainWireRegistryProposalV1 as Proposal } from "./MainWireRegistryInitialCandidatesV1";
import { beginFittingSourceSnapshotV1 as begin, resumeFittingSourceSnapshotV1 as resume } from "./FittingSourceSnapshotV1";
import { readSealedFittingRunV1 as sealed } from "./SealedFittingRunV1";
import { writeFittingRunJsonV1 as writeJson, writeFittingRunTextV1 as writeText } from "./FittingRunFilesV1";

/** Two current comparison layers only. This is not a general dependency engine.
 * Roots get their own protocols; AS keeps only area from its original proposal. */
export function mainWireRegistryFamilyLayersV1(proposals: readonly Proposal[]) {
  const roots = proposals.filter(p => !Object.hasOwn(parents, p.referenceId));
  const children = proposals.filter(p => Object.hasOwn(parents, p.referenceId));
  if (proposals.some(p => p.parentRun)) throw new Error("Family owns parent selection; use fit:registry for an explicit external parent run");
  for (const child of children) {
    const parentId = parents[child.referenceId as keyof typeof parents];
    if (!roots.some(p => p.referenceId === parentId)) throw new Error(`Family plan must include ${parentId} for ${child.referenceId}`);
    if (child.coordinateIds?.some(id => id !== "aortic-area")) throw new Error("Family AS comparisons may search only aortic-area");
  }
  return { roots, children: children.map(p => ({ ...p, coordinateIds: ["aortic-area"] as Proposal["coordinateIds"] })) };
}
const exists = async (path: string) => { try { await access(path); return true; } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return false; throw e; } };
async function execute(args: string[]) {
  const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script",
    resolve("tools/scientific/runMainWireRegistryFittingV1.ts"), ...args], { stdio: "inherit", env: { ...process.env, CI: "true" } });
  let timer: NodeJS.Timeout | undefined;
  const interrupt = () => { child.kill("SIGTERM"); timer ??= setTimeout(() => child.kill("SIGKILL"), 2000); timer.unref(); };
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt);
  try { await new Promise<void>((done, reject) => {
    child.once("error", reject); child.once("close", (code, signal) => code === 0 ? done() : reject(new Error(`Family phase interrupted: ${code ?? signal}; resume this family`)));
  }); } finally { clearTimeout(timer); process.off("SIGINT", interrupt); process.off("SIGTERM", interrupt); }
}
type Options = { proposals: Proposal[]; workers: number; minutes: number; evaluations: number; finalists: number };
type PhaseReport = { sourceSha256: string; wallTimeMs: number; rows: { referenceId: string; title: string; status: string;
  issues: string[]; candidateFile: string | null }[] };
async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, resume: { type: "string" }, plan: { type: "string" },
    workers: { type: "string" }, minutes: { type: "string" }, evaluations: { type: "string" }, finalists: { type: "string" }, help: { type: "boolean" } } });
  if (values.help) {
    process.stdout.write("Usage: npm run fit:registry:family -- --output NEW_DIRECTORY [--plan JSON_ARRAY] [--workers 4] [--minutes 30] [--evaluations 25] [--finalists 3]\n"
      + "Rebuild current roots, then rebase the two AS comparisons onto their selected final-qualified parents. All requested cases, including parent-held children, are reported.\n"
      + "Uses existing per-case search and cold 2/1ms qualification. A parent hold never falls back to an old public background.\n"
      + "Total active fitting budget spans both layers; source archive/setup and offline time are excluded. No mint, adoption, release or automatic reviewer vote.\n"
      + "Resume: --resume DIRECTORY only; original source, plan and each phase journal remain mandatory.\n"); return;
  }
  if (values.resume && Object.keys(values).some(k => k !== "resume")) throw new Error("Family resume keeps its original specification");
  if (!values.resume && !values.output) throw new Error("Require --output or --resume");
  const output = resolve(values.resume ?? values.output!);
  if (values.resume && await exists(join(output, "execution.source.json"))) {
    const run = await sealed(output);
    process.stdout.write(JSON.stringify({ output, status: "already-completed", report: await run.readJson("report.json"), executedJobs: 0 }) + "\n"); return;
  }
  let options: Options;
  if (values.resume) options = JSON.parse(await readFile(join(output, "options.json"), "utf8"));
  else {
    const evaluations = Number(values.evaluations ?? 25);
    const active = Object.values(definitions).filter(d => adopted.some(p => p.presetId === d.adoptedPresetId));
    if (active.length !== adopted.length) throw new Error("Active cases and definitions differ");
    options = { proposals: ownProposals(values.plan ? JSON.parse(await readFile(values.plan, "utf8")) : active.map(d => ({ referenceId: d.referenceId })), evaluations),
      workers: Number(values.workers ?? 4), minutes: Number(values.minutes ?? 30), evaluations, finalists: Number(values.finalists ?? 3) };
  }
  const layers = mainWireRegistryFamilyLayersV1(ownProposals(options.proposals, options.evaluations));
  if (!layers.roots.length || !Number.isInteger(options.workers) || options.workers < 1 || options.workers > 8
    || !Number.isFinite(options.minutes) || options.minutes <= 0 || options.minutes > 60
    || !Number.isInteger(options.finalists) || options.finalists < 1 || options.finalists > 8) throw new Error("Invalid bounded family options");
  if (!values.resume) await mkdir(output);
  const snapshot = await (values.resume ? resume : begin)(join(output, "execution"));
  const files: string[] = [];
  const save = async (name: string, value: unknown) => {
    const file = join(output, name);
    if (await exists(file)) {
      if (canonical(JSON.parse(await readFile(file, "utf8"))) !== canonical(value)) throw new Error(`Family resume record differs: ${name}`);
      files.push(file);
    } else files.push(await writeJson(output, name, value));
  };
  await save("options.json", options);
  await save("identity.json", { sourceSha256: snapshot.sourceSha256, optionsSha256: await hash(options) });
  const phase = async (name: string, proposals: Proposal[], minutes: number) => {
    await save(`${name}-plan.json`, proposals);
    const directory = join(output, name);
    await execute(await exists(directory) ? ["--resume", directory] : ["--output", directory, "--plan", join(output, `${name}-plan.json`),
      "--workers", String(options.workers), "--minutes", String(minutes), "--evaluations", String(options.evaluations), "--finalists", String(options.finalists)]);
    const run = await sealed(directory), report = await run.readJson("report.json") as PhaseReport;
    if (run.seal.sourceSha256 !== snapshot.sourceSha256 || report.sourceSha256 !== snapshot.sourceSha256) throw new Error("Family phases must share the same source snapshot");
    await save(`${name}-receipt.json`, { sourceSha256: run.seal.sourceSha256, reportSha256: await hash(report), sealSha256: await hash(run.seal), report });
    return report;
  };
  const roots = await phase("parents", layers.roots, options.minutes);
  const remainingMinutes = Math.max(0, options.minutes - roots.wallTimeMs / 60_000);
  const runnable = layers.children.filter(p => roots.rows.some(r => r.referenceId === parents[p.referenceId as keyof typeof parents] && r.status === "review-pending"));
  const children = runnable.length && remainingMinutes > 0 ? await phase("children", runnable.map(p => ({ ...p, parentRun: join(output, "parents") })), remainingMinutes) : null;
  const rows = [...roots.rows.map(r => ({ ...r, phase: "parents", parentReferenceId: null })),
    ...layers.children.filter((p, i, all) => all.findIndex(q => q.referenceId === p.referenceId) === i).map(p => {
      const parentReferenceId = parents[p.referenceId as keyof typeof parents];
      const row = children?.rows.find(r => r.referenceId === p.referenceId);
      return row ? { ...row, phase: "children", parentReferenceId } : { referenceId: p.referenceId, title: definitions[p.referenceId].title,
        phase: "not-executed", parentReferenceId, status: "held", candidateFile: null,
        issues: [runnable.some(r => r.referenceId === p.referenceId) ? "family-wall-time-budget" : "comparison-parent-not-final-qualified"] };
    })];
  const report = { schemaId: "main-wire-registry-family-run-v1", sourceSha256: snapshot.sourceSha256, rows,
    wallTimeMs: roots.wallTimeMs + (children?.wallTimeMs ?? 0), budgetMinutes: options.minutes,
    timing: "sum of active phase fitting time; setup/archive and offline time excluded; parallel workers counted as wall time",
    allRequestedCasesReported: rows.length === new Set(options.proposals.map(p => p.referenceId)).size,
    publicPromotionAuthorized: false, formalReview: "pending", optimizerChanged: false };
  await save("report.json", report);
  const md = ["# Registry family rebuild", "", "公開設定は変更していません。自動検証を通過した候補も正式採用・症例レビューとは別です。", "",
    "| 症例 | 比較の親 | 結果 | 未完了・保留 |", "|---|---|---|---|",
    ...rows.map(r => `| ${r.title} | ${r.parentReferenceId ?? "—"} | ${r.status} | ${r.issues.join(" / ") || "症例レビュー待ち"} |`), "",
    `計算時間: ${(report.wallTimeMs / 1000).toFixed(1)} 秒（並列実行を含む経過時間。起動・保存を除く）。`, "",
    "詳細は parents/REPORT.md と children/REPORT.md。資料作成は各phaseを fit:registry:prepare へ渡します。", ""].join("\n");
  if (await exists(join(output, "REPORT.md"))) {
    if (await readFile(join(output, "REPORT.md"), "utf8") !== md) throw new Error("Family report differs on resume");
    files.push(join(output, "REPORT.md"));
  } else files.push(await writeText(output, "REPORT.md", md));
  await snapshot.finish(files);
  process.stdout.write(JSON.stringify({ output, ...report }) + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
