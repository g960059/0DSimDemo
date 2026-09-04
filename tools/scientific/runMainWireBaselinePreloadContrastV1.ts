import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1, type HotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import {
  applyMainWireBaselineCalibrationParametersV1,
  mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1,
  type MainWireBaselineCalibrationParameterIdV1,
} from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { evaluateMainWireStandard70BaselineCalibrationCandidateV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { scoreMainWireBaselineOperatingPointV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { measureMainWireIntegratedModelFormalPreloadReserveV2 } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { mainWireStandard70PreloadReserveDirectionalResponsePassedV1,
} from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1 } from
  "@/domain/model/MainWireStandardIdentityV1";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import checkpointJson from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-settled-baseline-checkpoint.json";
import { designReservePolicyV1 } from "./mainWireBaselineDesignExecutionV1";

// A small, declared counterfactual experiment, not another optimizer. All
// branches reuse the existing fixed-control, independently settled protocol.
type Contrast = { id: string; updates: { parameterId: MainWireBaselineCalibrationParameterIdV1; value: number }[] };
const { values } = parseArgs({ options: { design: { type: "string" }, output: { type: "string" },
  parallelism: { type: "string", default: "6" }, "heart-rate": { type: "string", default: "60" },
  "integrity-tier": { type: "string", default: "hot-path-lean" }, worker: { type: "string" } } });
if (!values.design || !values.output) throw new Error("--design JSON --output NEW_DIRECTORY [--parallelism 1..8]");
selectHotPathIntegrityTierV1(values["integrity-tier"] as HotPathIntegrityTierV1);
const executionTier = hotPathIntegrityTierV1();
// Candidate integration has exact full/lean replay equivalence. The typed
// structural-analysis path has not established that equivalence; keep its
// settled preload measurements under full validation in either CLI tier.
const reserveExecutionTier = "full-invariant" as const;
const contrasts = JSON.parse(await readFile(values.design, "utf8")) as Contrast[];
const parallelism = Number(values.parallelism);
const heartRateBpm = Number(values["heart-rate"]);
if (!Array.isArray(contrasts) || !contrasts.length || contrasts.length > 12
  || !Number.isInteger(parallelism) || parallelism < 1 || parallelism > 8
  || ![60, 70].includes(heartRateBpm)
  || new Set(contrasts.map((row) => row.id)).size !== contrasts.length) throw new Error("invalid bounded contrast design");
const allowed: readonly MainWireBaselineCalibrationParameterIdV1[] = [
  "hemodynamics.total-blood-volume-ml", "hemodynamics.systemic-resistance",
  "hemodynamics.arterial-stiffness",
  "myocardium.common-ventricular-active-tension-scale", "myocardium.common-ventricular-passive-stiffness-scale",
];
for (const row of contrasts) {
  if (!/^[a-z0-9-]+$/.test(row.id) || !Array.isArray(row.updates)
    || new Set(row.updates.map((x) => x.parameterId)).size !== row.updates.length
    || row.updates.some((x) => !allowed.includes(x.parameterId)
      || !mainWireBaselineCalibrationParameterIsOnReleaseLatticeV1(x.parameterId, x.value))) {
    throw new Error("contrast requires unique, allowed, release-lattice coordinates");
  }
}
const reference = resolveMainWireFittingReferenceV1("baseline");
if (reference.selectedConstruction.modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1) {
  throw new Error("preload contrast runner only supports Standard70");
}
const source = reference.selectedConstruction.candidateInputs;
const anchor = { ...source, hemodynamicResearchInputs: { ...source.hemodynamicResearchInputs, heartRateBpm } };
const checkpoint = checkpointJson as unknown as MainWireIntegratedModelStandard70CheckpointV1;
const output = resolve(values.output);
if (values.worker !== undefined) {
  const contrast = contrasts.find((row) => row.id === values.worker);
  if (!contrast) throw new Error("unknown contrast");
  const inputs = applyMainWireBaselineCalibrationParametersV1(anchor, contrast.updates);
  const request = { ...inputs, nominalDtSec: 0.002, initialization: heartRateBpm !== source.hemodynamicResearchInputs.heartRateBpm
    ? { kind: "cold" as const } : {
    kind: "standard70-parameter-continuation" as const, sourceCheckpoint: checkpoint,
    sourceHemodynamicResearchInputs: anchor.hemodynamicResearchInputs,
    sourceMechanismResearchInputs: anchor.mechanismResearchInputs,
    sourceVentricularContractilityScale: anchor.ventricularContractilityScale,
  } };
  await writeFile(resolve(output, `${contrast.id}.request.json`), JSON.stringify(request), { flag: "wx" });
  const startedAt = performance.now();
  const evaluation = await evaluateMainWireStandard70BaselineCalibrationCandidateV1(request);
  let reserve: Awaited<ReturnType<typeof measureMainWireIntegratedModelFormalPreloadReserveV2>> | null = null;
  let reserveFailure: string | null = null;
  // Continuous rest-corridor failures remain diagnostic observations. Solver,
  // event, discrete morphology and right-heart safety failures cannot start a protocol.
  if (evaluation.status === "accepted" && Number.isFinite(scoreMainWireBaselineOperatingPointV1(evaluation).minimumMargin)) {
    try {
      selectHotPathIntegrityTierV1(reserveExecutionTier);
      const session = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
        evaluation.exactResult.checkpoint, inputs.hemodynamicResearchInputs,
        inputs.ventricularContractilityScale, undefined, inputs.mechanismResearchInputs,
      );
      reserve = await measureMainWireIntegratedModelFormalPreloadReserveV2(session, inputs.hemodynamicResearchInputs);
    } catch (error) { reserveFailure = error instanceof Error ? error.message : String(error); }
    finally { selectHotPathIntegrityTierV1(executionTier); }
  }
  await writeFile(resolve(output, `${contrast.id}.result.json`), JSON.stringify({ contrast, inputs, evaluation, reserve,
    reserveFailure, executionTier, reserveExecutionTier, wallTimeMs: performance.now() - startedAt, baselineAdopted: false }), { flag: "wx" });
} else {
  if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("contrast requires a clean committed worktree");
  await mkdir(output);
  const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const reservePolicy = designReservePolicyV1;
  const reservePolicyIdentity = await sha256CanonicalJsonHex(reservePolicy);
  const protocol = { studyId: "main-wire-standard70-preload-contrast-v1", executionCommit, executionTier, reserveExecutionTier, contrasts, heartRateBpm,
    reservePolicy, reservePolicyIdentity,
    reference, checkpointSha256: checkpoint.checkpointSha256, nominalDtSec: 0.002, parallelism,
    claim: "exploratory fixed-control preload responses; no isolated-contractility identification or baseline adoption" };
  const protocolIdentity = await sha256CanonicalJsonHex(protocol);
  await writeFile(resolve(output, "protocol.json"), JSON.stringify({ ...protocol, protocolIdentity }, null, 2), { flag: "wx" });
  await writeFile(resolve(output, "design.json"), JSON.stringify(contrasts), { flag: "wx" });
  const startedAt = performance.now();
  const rows: unknown[] = [];
  for (let i = 0; i < contrasts.length; i += parallelism) {
    const batch = await Promise.all(contrasts.slice(i, i + parallelism).map(async (contrast) => {
      await new Promise<void>((done, fail) => {
        const child = spawn(process.execPath, ["node_modules/vite-node/vite-node.mjs", "--script",
          "tools/scientific/runMainWireBaselinePreloadContrastV1.ts", "--design", resolve(output, "design.json"),
          "--output", output, "--heart-rate", String(heartRateBpm), "--integrity-tier", executionTier,
          "--worker", contrast.id], { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (data) => { stderr += String(data); });
        child.on("error", fail);
        child.on("exit", (code) => code === 0 ? done() : fail(new Error(`${contrast.id}: ${stderr}`)));
      });
      const result = JSON.parse(await readFile(resolve(output, `${contrast.id}.result.json`), "utf8")) as {
        evaluation: Awaited<ReturnType<typeof evaluateMainWireStandard70BaselineCalibrationCandidateV1>>;
        reserve: Awaited<ReturnType<typeof measureMainWireIntegratedModelFormalPreloadReserveV2>> | null;
        reserveFailure: string | null; wallTimeMs: number;
      };
      const reserve = result.reserve;
      const reserveChecks = reserve === null ? null : (["left", "right"] as const)
        .flatMap((side) => (["hypovolemic", "hypervolemic"] as const)
          .map((direction) => ({ side, direction,
            passed: mainWireStandard70PreloadReserveDirectionalResponsePassedV1(reserve[side][direction]) })));
      process.stderr.write(`[preload-contrast] ${contrast.id}: rest=${result.evaluation.status === "accepted" ? result.evaluation.constructionGateStatus : result.evaluation.status}, reserve=${reserveChecks?.every((x) => x.passed) ?? "unresolved"}\n`);
      return { id: contrast.id, updates: contrast.updates, status: result.evaluation.status,
        checks: result.evaluation.status === "accepted" ? result.evaluation.objectiveChecks : null,
        score: scoreMainWireBaselineOperatingPointV1(result.evaluation),
        reserve: result.reserve, reserveChecks, reserveFailure: result.reserveFailure, wallTimeMs: result.wallTimeMs,
        resultPath: `${contrast.id}.result.json` };
    }));
    rows.push(...batch);
  }
  await writeFile(resolve(output, "result.json"), JSON.stringify({ executionCommit, executionTier, reserveExecutionTier, protocolIdentity, reservePolicyIdentity,
    wallTimeMs: performance.now() - startedAt, rows, finalQualificationExecuted: false, baselineAdopted: false }, null, 2), { flag: "wx" });
  process.stdout.write(`${output}/result.json\n`);
}
