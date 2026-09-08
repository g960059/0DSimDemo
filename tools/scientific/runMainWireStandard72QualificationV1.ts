import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { constants, existsSync } from "node:fs";
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { cloneAndFreezeCanonicalJson, canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { validateMainWireStandard72SavedFittingResultV1 } from "@/analysis/methods/mainWire/MainWireStandard72FittingWorkflowV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Candidate } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

type GridResult = Awaited<ReturnType<typeof import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1").runMainWireStandard72QualificationGridV1>>;
type NominalDt = .002 | .001;
const maximumCandidateBytes = 1_048_576;
const maximumWorkerStdoutBytes = 64 * 1_048_576;
const maximumWorkerStderrBytes = 1_048_576;

async function main() {
  const { values } = parseArgs({ options: {
    output: { type: "string" }, reuse: { type: "string" }, candidate: { type: "string" },
    tbv: { type: "string" }, help: { type: "boolean" },
    worker: { type: "boolean" }, dt: { type: "string" },
  } });
  if (values.help) {
    process.stdout.write("Usage: npm run qualify:scientific:main-wire-standard72-v1 -- --output NEW_JSON [--reuse SAVED_FITTING_JSON | --candidate CANDIDATE_JSON | --tbv ML]\n"
      + "Runs the same candidate independently from cold at 2ms and 1ms in two child processes, then assesses resting behavior, pressure-rate/tau and fixed-tone preload reserve. The default candidate is the registry baseline.\n"
      + "--reuse validates a saved Standard72 fitting result and takes only its candidate parameters; prior checkpoints and qualification are not reused. --tbv changes baseline total blood volume.\n"
      + "Writes a new report without overwriting files. Exit 0 means qualified; exit 1 means held or an execution/input error. This does not publish or adopt a baseline, qualify afterload, or claim clinical validation.\n"
      + "Internal worker usage: CI=true with --worker --dt .002|.001, candidate JSON on stdin and grid-result JSON on stdout.\n");
    return;
  }
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    if (values.output !== undefined || values.reuse !== undefined || values.candidate !== undefined || values.tbv !== undefined
      || (values.dt !== ".002" && values.dt !== ".001")) {
      throw new Error("Internal worker requires only --worker --dt .002|.001 and candidate JSON on stdin");
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > maximumCandidateBytes) throw new Error("Worker candidate input exceeds 1 MiB");
      chunks.push(buffer);
    }
    const candidateInputs = cloneAndFreezeCanonicalJson(JSON.parse(Buffer.concat(chunks).toString("utf8"))) as Candidate;
    const { runMainWireStandard72QualificationGridV1 } = await import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1");
    const result = await runMainWireStandard72QualificationGridV1({ candidateInputs, nominalDtSec: Number(values.dt) as NominalDt });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (!values.output || values.dt !== undefined
    || [values.reuse, values.candidate, values.tbv].filter(value => value !== undefined).length > 1) {
    throw new Error("Require --output NEW_JSON and at most one of --reuse, --candidate or --tbv; see --help");
  }
  const output = resolve(values.output);
  if (existsSync(output)) throw new Error("Output already exists; choose a new file");
  await access(dirname(output), constants.W_OK);
  const saved = values.reuse === undefined ? undefined
    : await validateMainWireStandard72SavedFittingResultV1(JSON.parse(await readFile(values.reuse, "utf8")));
  let candidateInputs: Candidate = values.candidate === undefined
    ? saved?.evaluation.candidateInputs ?? resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs
    : JSON.parse(await readFile(values.candidate, "utf8"));
  if (values.tbv !== undefined) {
    const totalBloodVolumeMl = Number(values.tbv);
    if (!Number.isFinite(totalBloodVolumeMl) || totalBloodVolumeMl <= 0) throw new Error("--tbv requires positive finite milliliters");
    candidateInputs = { ...candidateInputs, hemodynamicResearchInputs: { ...candidateInputs.hemodynamicResearchInputs, totalBloodVolumeMl } };
  }
  // Snapshot once: both independent processes receive exactly these bytes.
  const encodedCandidate = canonicalJsonStringify(cloneAndFreezeCanonicalJson(candidateInputs));
  if (Buffer.byteLength(encodedCandidate) > maximumCandidateBytes) throw new Error("Candidate input exceeds 1 MiB");
  const { assessMainWireStandard72FittingQualificationV1 } = await import("@/analysis/methods/mainWire/MainWireStandard72FittingQualificationV1");
  const [coarse, fine] = await runGrids(encodedCandidate);
  const report = await assessMainWireStandard72FittingQualificationV1({ coarse, fine });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ output, modelId: report.modelId, status: report.status,
    reportSha256: report.reportSha256, initialization: "independent-cold-per-grid",
    nominalDtSec: [.002, .001], publicBaselinePromotionAuthorized: false,
    afterloadQualified: false, clinicalValidationClaimed: false })}\n`);
  if (report.status !== "qualified") process.exitCode = 1;
}

async function runGrids(encodedCandidate: string): Promise<[GridResult, GridResult]> {
  const active = new Set<ChildProcessWithoutNullStreams>();
  const terminationTimers = new Map<ChildProcessWithoutNullStreams, NodeJS.Timeout>();
  let interruption: "SIGINT" | "SIGTERM" | null = null;
  const terminate = (child: ChildProcessWithoutNullStreams) => {
    if (!active.has(child) || terminationTimers.has(child)) return;
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 1_000);
    timer.unref();
    terminationTimers.set(child, timer);
  };
  const stop = () => { for (const child of active) terminate(child); };
  const interrupt = (signal: "SIGINT" | "SIGTERM") => {
    interruption = signal;
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    stop();
  };
  const onInterrupt = () => interrupt("SIGINT"), onTerminate = () => interrupt("SIGTERM");
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  const pending: Promise<GridResult>[] = [];
  try {
    for (const dt of [.002, .001] as const) pending.push(runGridWorker(dt));
    const results = await Promise.all(pending);
    if (interruption !== null) throw new Error(`Qualification interrupted by ${interruption}`);
    return results as [GridResult, GridResult];
  } catch (error) {
    stop();
    await Promise.allSettled(pending);
    throw interruption === null ? error : new Error(`Qualification interrupted by ${interruption}`);
  } finally {
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
  }

  function runGridWorker(dt: NominalDt): Promise<GridResult> {
    const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script",
      fileURLToPath(import.meta.url), "--worker", "--dt", dt === .002 ? ".002" : ".001"],
    // Vite otherwise treats stdin EOF as shutdown, before async grid output.
    { cwd: process.cwd(), env: { ...process.env, CI: "true" }, stdio: ["pipe", "pipe", "pipe"] });
    active.add(child);
    return new Promise((resolveResult, reject) => {
      const stdout: Buffer[] = [];
      let stdoutBytes = 0, stderrBytes = 0;
      let failure: Error | null = null;
      const fail = (error: Error) => { failure ??= error; terminate(child); };
      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > maximumWorkerStdoutBytes) fail(new Error("Worker stdout exceeds 64 MiB"));
        else stdout.push(chunk);
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes > maximumWorkerStderrBytes) fail(new Error("Worker stderr exceeds 1 MiB"));
        else process.stderr.write(chunk);
      });
      child.once("error", error => { failure ??= error; });
      child.stdin.once("error", fail);
      child.once("close", (code, signal) => {
        active.delete(child);
        clearTimeout(terminationTimers.get(child));
        terminationTimers.delete(child);
        if (failure !== null || code !== 0) {
          reject(new Error(`${dt * 1000}ms qualification worker failed: ${failure?.message ?? `exit ${code ?? signal}`}`));
          return;
        }
        try { resolveResult(JSON.parse(Buffer.concat(stdout).toString("utf8")) as GridResult); }
        catch (error) { reject(new Error(`${dt * 1000}ms qualification worker returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)); }
      });
      child.stdin.end(encodedCandidate);
    });
  }
}

await main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode ||= 1;
});
