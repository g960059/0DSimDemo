import { execFileSync, spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1, type HotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 as policy,
  scoreMainWireBaselineOperatingPointV1, mainWireBaselineDesignBetterV1,
  mainWireBaselineDesignNeighborsV1,
  mainWireBaselineDesignSeedV1,
  scoreMainWireBaselineReserveAwareV1,
  type DesignScoreV1,
} from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { measureMainWireIntegratedModelFormalPreloadReserveV1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1 } from
  "@/domain/model/MainWireStandardIdentityV1";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import checkpoint from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";

const { values } = parseArgs({ options: { output: { type: "string" },
  worker: { type: "string" }, parallelism: { type: "string", default: "8" },
  "heart-rate": { type: "string", default: "60" },
  "integrity-tier": { type: "string", default: "hot-path-lean" },
  "reserve-worker": { type: "string" },
  "maximum-evaluations": { type: "string", default: String(policy.maximumEvaluations) },
  "qualify-finalists": { type: "string", default: "3" },
  "seed-request": { type: "string" }, "seed-evaluation": { type: "string" } } });
if (!values.output) throw new Error("--output NEW_DIRECTORY is required");
selectHotPathIntegrityTierV1(values["integrity-tier"] as HotPathIntegrityTierV1);
const executionTier = hotPathIntegrityTierV1();
const output = resolve(values.output);
type ReserveResult = { reserve: MainWireIntegratedModelFormalPreloadReserveMeasurementV1 | null;
  failure: string | null; wallTimeMs: number; executionTier: "full-invariant";
  sourceCheckpointSha256: string };
if (values.worker) {
  process.stderr.write(`[execution-tier] ${executionTier}\n`);
  const input = JSON.parse(await readFile(values.worker, "utf8")) as
    MainWireStandard70BaselineCalibrationEvaluationRequestV1;
  if (values["reserve-worker"]) {
    const evaluation = JSON.parse(await readFile(values["reserve-worker"], "utf8")) as MainWireStandard70BaselineCalibrationEvaluationV1;
    if (evaluation.status !== "accepted" || !Number.isFinite(scoreMainWireBaselineOperatingPointV1(evaluation).minimumMargin)
      || !input.hemodynamicResearchInputs || !input.mechanismResearchInputs || input.ventricularContractilityScale === undefined) {
      throw new Error("reserve worker requires an exact, event- and safety-qualified candidate with explicit inputs");
    }
    const startedAt = performance.now();
    const result: ReserveResult = { reserve: null, failure: null, wallTimeMs: 0,
      executionTier: "full-invariant", sourceCheckpointSha256: evaluation.exactResult.checkpoint.checkpointSha256 };
    try {
      selectHotPathIntegrityTierV1("full-invariant");
      const session = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
        evaluation.exactResult.checkpoint, input.hemodynamicResearchInputs,
        input.ventricularContractilityScale, undefined, input.mechanismResearchInputs);
      result.reserve = await measureMainWireIntegratedModelFormalPreloadReserveV1(session, input.hemodynamicResearchInputs);
    } catch (error) { result.failure = error instanceof Error ? error.message : String(error); }
    finally { selectHotPathIntegrityTierV1(executionTier); }
    result.wallTimeMs = performance.now() - startedAt;
    await writeFile(output, JSON.stringify(result), { flag: "wx" });
  } else {
    const evaluation = await evaluateMainWireStandard70BaselineCalibrationCandidateV1(input);
    await writeFile(output, JSON.stringify(evaluation), { flag: "wx" });
  }
} else {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
    throw new Error("operating-point design requires a clean committed worktree");
  }
  const parallelism = Number(values.parallelism);
  const maximumEvaluations = Number(values["maximum-evaluations"]);
  const maximumFinalists = Number(values["qualify-finalists"]);
  if (!Number.isInteger(parallelism) || parallelism < 1 || parallelism > 8) {
    throw new Error("--parallelism must be 1..8");
  }
  if (!Number.isInteger(maximumEvaluations) || maximumEvaluations < 1 || maximumEvaluations > policy.maximumEvaluations
    || !Number.isInteger(maximumFinalists) || maximumFinalists < 0 || maximumFinalists > 3) {
    throw new Error("evaluation budget must be 1..49 and finalist budget 0..3");
  }
  await mkdir(output); // Never overwrite a preceding experiment.
  const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const reference = resolveMainWireFittingReferenceV1(policy.referenceId);
  if (reference.selectedConstruction.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1) {
    throw new Error("design evaluator is only compatible with the Standard70 reference");
  }
  const heartRateBpm = Number(values["heart-rate"]);
  if (!(policy.allowedHeartRatesBpm as readonly number[]).includes(heartRateBpm)) {
    throw new Error("--heart-rate must be 60 or 70");
  }
  const anchor = { ...reference.selectedConstruction.candidateInputs,
    hemodynamicResearchInputs: { ...reference.selectedConstruction.candidateInputs.hemodynamicResearchInputs, heartRateBpm } };
  let seed: MainWireBaselineCalibrationCandidateInputsV1 = anchor;
  let seedCheckpoint = checkpoint as unknown as MainWireIntegratedModelStandard70CheckpointV1;
  if (Boolean(values["seed-request"]) !== Boolean(values["seed-evaluation"])) {
    throw new Error("seed request and evaluation must be supplied together");
  }
  if (values["seed-request"] && values["seed-evaluation"]) {
    const request = JSON.parse(await readFile(values["seed-request"], "utf8")) as MainWireBaselineCalibrationCandidateInputsV1;
    seed = mainWireBaselineDesignSeedV1(anchor, request);
    const rawSource = JSON.parse(await readFile(values["seed-evaluation"], "utf8"));
    const source = (rawSource.evaluation ?? rawSource) as MainWireStandard70BaselineCalibrationEvaluationV1;
    if (source.status !== "accepted") throw new Error("seed requires an exact candidate checkpoint");
    // The prior observations are never scored or trusted. Exact restore binds
    // all frozen inputs, then independently re-establishes periodic closure.
    seedCheckpoint = source.exactResult.checkpoint;
  }
  const policyIdentity = await sha256CanonicalJsonHex(policy);
  const reservePolicy = { base: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
    standard70: MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 };
  const reservePolicyIdentity = await sha256CanonicalJsonHex(reservePolicy);
  await writeFile(resolve(output, "protocol.json"), JSON.stringify({
    executionCommit, executionTier, policy, policyIdentity, reservePolicy, reservePolicyIdentity,
    reference, parallelism, maximumEvaluations, maximumFinalists, heartRateBpm, seed,
    seedCheckpointSha256: seedCheckpoint.checkpointSha256,
    claim: "bounded exploratory construction; not identifiability or final qualification",
  }, null, 2), { flag: "wx" });
  const startedAt = performance.now();
  let count = 0;
  type Entry = { index: number; inputs: MainWireBaselineCalibrationCandidateInputsV1;
    evaluation: MainWireStandard70BaselineCalibrationEvaluationV1; reserve: ReserveResult | null;
    reserveScreen: "not-run" | "measured" | "unresolved" | "rest-bound-pruned"; score: DesignScoreV1 };
  const history: Entry[] = [];
  const seen = new Set<string>();
  async function runChild(script: string, args: string[], permitQualificationFailure = false) {
    await new Promise<void>((done, fail) => {
      const child = spawn(process.execPath, ["node_modules/vite-node/vite-node.mjs", "--script", script, ...args],
        { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (data) => { stderr += String(data); });
      child.on("error", fail);
      child.on("exit", (code) => code === 0 || (code === 1 && permitQualificationFailure)
        ? done() : fail(new Error(`worker failed: ${stderr}`)));
    });
  }
  async function evaluate(inputs: MainWireBaselineCalibrationCandidateInputsV1,
    initialization: MainWireStandard70BaselineCalibrationEvaluationRequestV1["initialization"]) {
    const index = count++;
    const request = { ...inputs, nominalDtSec: policy.nominalDtSec, initialization };
    const requestPath = resolve(output, `${index}.request.json`);
    const resultPath = resolve(output, `${index}.result.json`);
    await writeFile(requestPath, JSON.stringify(request), { flag: "wx" });
    await runChild("tools/scientific/runMainWireBaselineOperatingPointDesignV1.ts", ["--worker", requestPath,
      "--output", resultPath, "--integrity-tier", executionTier]);
    const evaluation = JSON.parse(await readFile(resultPath, "utf8")) as
      MainWireStandard70BaselineCalibrationEvaluationV1;
    const entry: Entry = { index, inputs, evaluation, reserve: null, reserveScreen: "not-run",
      score: scoreMainWireBaselineReserveAwareV1(evaluation, null) };
    history.push(entry);
    const score = scoreMainWireBaselineOperatingPointV1(evaluation);
    process.stderr.write(`[design] ${index}: ${evaluation.status} ${JSON.stringify(score)}\n`);
    return entry;
  }
  async function measureReserve(entry: Entry) {
    const path = resolve(output, `${entry.index}.reserve.json`);
    await runChild("tools/scientific/runMainWireBaselineOperatingPointDesignV1.ts", [
      "--worker", resolve(output, `${entry.index}.request.json`),
      "--reserve-worker", resolve(output, `${entry.index}.result.json`),
      "--output", path, "--integrity-tier", executionTier]);
    entry.reserve = JSON.parse(await readFile(path, "utf8")) as ReserveResult;
    entry.reserveScreen = entry.reserve.reserve ? "measured" : "unresolved";
    entry.score = scoreMainWireBaselineReserveAwareV1(entry.evaluation, entry.reserve.reserve);
    process.stderr.write(`[reserve] ${entry.index}: ${JSON.stringify(entry.score)}\n`);
  }
  let best = await evaluate(seed, heartRateBpm !== 60 && !values["seed-evaluation"]
    ? { kind: "cold" } : { kind: "standard70-exact-checkpoint", checkpoint: seedCheckpoint });
  if (!Number.isFinite(scoreMainWireBaselineOperatingPointV1(best.evaluation).minimumMargin)) {
    throw new Error("initial candidate did not reconfirm numerical, event and safety gates");
  }
  await measureReserve(best);
  if (!Number.isFinite(best.score.minimumMargin)) throw new Error("initial preload protocol was unresolved");
  seen.add(await sha256CanonicalJsonHex(seed));
  let stepScale: 1 | 0.5 | 0.25 = 1;
  let stopReason = "evaluation-budget";
  while (count < maximumEvaluations) {
    const proposals: MainWireBaselineCalibrationCandidateInputsV1[] = [];
    for (const candidate of mainWireBaselineDesignNeighborsV1(anchor, best.inputs, stepScale)) {
      const key = await sha256CanonicalJsonHex(candidate);
      if (!seen.has(key) && count + proposals.length < maximumEvaluations) {
        seen.add(key); proposals.push(candidate);
      }
    }
    const source = best;
    if (source.evaluation.status !== "accepted") throw new Error("unaccepted continuation source");
    const initialization = { kind: "standard70-parameter-continuation" as const,
      sourceCheckpoint: source.evaluation.exactResult.checkpoint,
      sourceHemodynamicResearchInputs: source.inputs.hemodynamicResearchInputs,
      sourceMechanismResearchInputs: source.inputs.mechanismResearchInputs,
      sourceVentricularContractilityScale: source.inputs.ventricularContractilityScale };
    for (let i = 0; i < proposals.length; i += parallelism) {
      const batch = await Promise.all(proposals.slice(i, i + parallelism)
        .map((candidate) => evaluate(candidate, initialization)));
      // Freeze the incumbent within each parallel batch. Since adding reserve
      // can only lower a score, rest-only bounds safely avoid unhelpful runs.
      const incumbent = best.score;
      await Promise.all(batch.map(async (entry) => {
        if (mainWireBaselineDesignBetterV1(scoreMainWireBaselineOperatingPointV1(entry.evaluation), incumbent)) {
          await measureReserve(entry);
        } else entry.reserveScreen = "rest-bound-pruned";
      }));
      for (const entry of batch) {
        if (mainWireBaselineDesignBetterV1(entry.score, best.score)) best = entry;
      }
    }
    if (best.index === source.index) {
      if (stepScale === 0.25) { stopReason = "mesh-exhausted"; break; }
      stepScale = stepScale === 1 ? 0.5 : 0.25;
    }
  }
  // Bounded one-command handoff: never call a nominal candidate qualified just
  // because it won the search. Fine dt is the first, cheap-to-reject finalist gate.
  const finalists = [...history].filter((row) => row.score.feasible)
    .sort((a, b) => b.score.minimumMargin - a.score.minimumMargin
      || b.score.pressureFlowMargin - a.score.pressureFlowMargin || a.index - b.index)
    .slice(0, maximumFinalists);
  const qualificationResults: { index: number; modes: { mode: string; qualified: boolean; resultPath: string }[];
    qualified: boolean }[] = [];
  for (const finalist of finalists) {
    async function qualify(mode: string) {
      const path = resolve(output, `${finalist.index}.${mode}.json`);
      await runChild("tools/scientific/qualifyMainWireBaselineOperatingPointDesignV1.ts", [
        "--request", resolve(output, `${finalist.index}.request.json`),
        "--evaluation", resolve(output, `${finalist.index}.result.json`),
        "--mode", mode, "--output", path, "--integrity-tier", "full-invariant"], true);
      const result = JSON.parse(await readFile(path, "utf8")) as { qualified: boolean };
      process.stderr.write(`[qualification] ${finalist.index}/${mode}: ${result.qualified}\n`);
      return { mode, qualified: result.qualified, resultPath: `${finalist.index}.${mode}.json` };
    }
    const modes = [await qualify("refined")];
    if (modes[0]!.qualified) {
      const remaining = ["cold", "reserve", heartRateBpm === 60 ? "hr70" : "hr60", "afterload"];
      for (let i = 0; i < remaining.length; i += parallelism) {
        modes.push(...await Promise.all(remaining.slice(i, i + parallelism).map(qualify)));
      }
    }
    const qualified = modes.length === 5 && modes.every((row) => row.qualified);
    qualificationResults.push({ index: finalist.index, modes, qualified });
    if (qualified) break;
  }
  const summarized = history.sort((a, b) => a.index - b.index).map(({ index, inputs, evaluation, reserve, reserveScreen, score }) => ({
    index, inputs, score, restScore: scoreMainWireBaselineOperatingPointV1(evaluation),
    reserveScreen, reservePath: reserve ? `${index}.reserve.json` : null,
    reserveWallTimeMs: reserve?.wallTimeMs ?? 0, reserveFailure: reserve?.failure ?? null,
    resultPath: `${index}.result.json`, status: evaluation.status,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    wallTimeMs: evaluation.wallTimeMs,
    checks: evaluation.status === "accepted" ? evaluation.objectiveChecks : null,
    failed: evaluation.status === "accepted" ? evaluation.failedConstructionCheckIds : evaluation.message,
  }));
  await writeFile(resolve(output, "result.json"), JSON.stringify({
    executionCommit, executionTier, policyIdentity, reservePolicyIdentity, wallTimeMs: performance.now() - startedAt,
    summedEvaluationWallTimeMs: history.reduce((sum, x) => sum + x.evaluation.wallTimeMs, 0),
    stopReason, evaluationCount: count, bestIndex: best.index, candidates: summarized,
    reserveEvaluationCount: history.filter((row) => row.reserve !== null).length,
    finalQualificationExecuted: qualificationResults.length > 0, qualificationResults,
    qualifiedCandidateIndex: qualificationResults.find((row) => row.qualified)?.index ?? null,
    baselineAdopted: false,
  }, null, 2), { flag: "wx" });
  process.stdout.write(`${output}/result.json\n`);
}
