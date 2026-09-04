import { execFileSync, spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_BASELINE_OPERATING_POINT_DESIGN_V1 as policy,
  scoreMainWireBaselineOperatingPointV1, mainWireBaselineDesignBetterV1,
  mainWireBaselineDesignNeighborsV1,
} from "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { applyMainWireBaselineCalibrationParametersV1,
  readMainWireBaselineCalibrationParameterV1,
  type MainWireBaselineCalibrationCandidateInputsV1 } from
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
  "seed-request": { type: "string" }, "seed-evaluation": { type: "string" } } });
if (!values.output) throw new Error("--output NEW_DIRECTORY is required");
const output = resolve(values.output);
if (values.worker) {
  const input = JSON.parse(await readFile(values.worker, "utf8")) as
    MainWireStandard70BaselineCalibrationEvaluationRequestV1;
  const evaluation = await evaluateMainWireStandard70BaselineCalibrationCandidateV1(input);
  await writeFile(output, JSON.stringify(evaluation), { flag: "wx" });
} else {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
    throw new Error("operating-point design requires a clean committed worktree");
  }
  const parallelism = Number(values.parallelism);
  if (!Number.isInteger(parallelism) || parallelism < 1 || parallelism > 8) {
    throw new Error("--parallelism must be 1..8");
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
    seed = applyMainWireBaselineCalibrationParametersV1(anchor, policy.coordinates.map((coordinate) => {
      const value = readMainWireBaselineCalibrationParameterV1(request, coordinate.parameterId);
      if (Math.abs(value - readMainWireBaselineCalibrationParameterV1(anchor, coordinate.parameterId)) > coordinate.radius + 1e-8) {
        throw new Error("seed exceeds the fixed design radius");
      }
      return { parameterId: coordinate.parameterId, value };
    }));
    const source = JSON.parse(await readFile(values["seed-evaluation"], "utf8")) as MainWireStandard70BaselineCalibrationEvaluationV1;
    if (source.status !== "accepted") throw new Error("seed requires an exact candidate checkpoint");
    // The prior observations are never scored or trusted. Exact restore binds
    // all frozen inputs, then independently re-establishes periodic closure.
    seedCheckpoint = source.exactResult.checkpoint;
  }
  const policyIdentity = await sha256CanonicalJsonHex(policy);
  await writeFile(resolve(output, "protocol.json"), JSON.stringify({
    executionCommit, policy, policyIdentity, reference, parallelism, heartRateBpm, seed,
    seedCheckpointSha256: seedCheckpoint.checkpointSha256,
    claim: "bounded exploratory construction; not identifiability or final qualification",
  }, null, 2), { flag: "wx" });
  const startedAt = performance.now();
  let count = 0;
  const history: { index: number; inputs: MainWireBaselineCalibrationCandidateInputsV1;
    evaluation: MainWireStandard70BaselineCalibrationEvaluationV1 }[] = [];
  const seen = new Set<string>();
  async function evaluate(inputs: MainWireBaselineCalibrationCandidateInputsV1,
    initialization: MainWireStandard70BaselineCalibrationEvaluationRequestV1["initialization"]) {
    const index = count++;
    const request = { ...inputs, nominalDtSec: policy.nominalDtSec, initialization };
    const requestPath = resolve(output, `${index}.request.json`);
    const resultPath = resolve(output, `${index}.result.json`);
    await writeFile(requestPath, JSON.stringify(request), { flag: "wx" });
    await new Promise<void>((done, fail) => {
      const child = spawn(process.execPath, ["node_modules/vite-node/vite-node.mjs", "--script",
        "tools/scientific/runMainWireBaselineOperatingPointDesignV1.ts", "--worker", requestPath,
        "--output", resultPath], { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (data) => { stderr += String(data); });
      child.on("error", fail);
      child.on("exit", (code) => code === 0 ? done() : fail(new Error(`worker ${index}: ${stderr}`)));
    });
    const evaluation = JSON.parse(await readFile(resultPath, "utf8")) as
      MainWireStandard70BaselineCalibrationEvaluationV1;
    const entry = { index, inputs, evaluation };
    history.push(entry);
    const score = scoreMainWireBaselineOperatingPointV1(evaluation);
    process.stderr.write(`[design] ${index}: ${evaluation.status} ${JSON.stringify(score)}\n`);
    return entry;
  }
  let best = await evaluate(seed, heartRateBpm !== 60 && !values["seed-evaluation"]
    ? { kind: "cold" } : { kind: "standard70-exact-checkpoint", checkpoint: seedCheckpoint });
  if (!Number.isFinite(scoreMainWireBaselineOperatingPointV1(best.evaluation).minimumMargin)) {
    throw new Error("initial candidate did not reconfirm numerical, event and safety gates");
  }
  seen.add(await sha256CanonicalJsonHex(seed));
  let stepScale: 1 | 0.5 | 0.25 = 1;
  let stopReason = "evaluation-budget";
  while (count < policy.maximumEvaluations) {
    const proposals: MainWireBaselineCalibrationCandidateInputsV1[] = [];
    for (const candidate of mainWireBaselineDesignNeighborsV1(anchor, best.inputs, stepScale)) {
      const key = await sha256CanonicalJsonHex(candidate);
      if (!seen.has(key) && count + proposals.length < policy.maximumEvaluations) {
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
      for (const entry of batch) {
        if (mainWireBaselineDesignBetterV1(scoreMainWireBaselineOperatingPointV1(entry.evaluation),
          scoreMainWireBaselineOperatingPointV1(best.evaluation))) best = entry;
      }
    }
    if (best.index === source.index) {
      if (stepScale === 0.25) { stopReason = "mesh-exhausted"; break; }
      stepScale = stepScale === 1 ? 0.5 : 0.25;
    }
  }
  const summarized = history.sort((a, b) => a.index - b.index).map(({ index, inputs, evaluation }) => ({
    index, inputs, score: scoreMainWireBaselineOperatingPointV1(evaluation),
    resultPath: `${index}.result.json`, status: evaluation.status,
    requestIdentitySha256: evaluation.requestIdentitySha256,
    wallTimeMs: evaluation.wallTimeMs,
    checks: evaluation.status === "accepted" ? evaluation.objectiveChecks : null,
    failed: evaluation.status === "accepted" ? evaluation.failedConstructionCheckIds : evaluation.message,
  }));
  await writeFile(resolve(output, "result.json"), JSON.stringify({
    executionCommit, policyIdentity, wallTimeMs: performance.now() - startedAt,
    summedEvaluationWallTimeMs: history.reduce((sum, x) => sum + x.evaluation.wallTimeMs, 0),
    stopReason, evaluationCount: count, bestIndex: best.index, candidates: summarized,
    finalQualificationExecuted: false, baselineAdopted: false,
  }, null, 2), { flag: "wx" });
  process.stdout.write(`${output}/result.json\n`);
}
