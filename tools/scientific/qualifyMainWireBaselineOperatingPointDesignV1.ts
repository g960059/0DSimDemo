import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1, type HotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import {
  evaluateMainWireStandard70BaselineCalibrationCandidateV1,
  type MainWireStandard70BaselineCalibrationEvaluationV1,
  type MainWireStandard70BaselineCalibrationEvaluationRequestV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { scoreMainWireBaselineOperatingPointV1, mainWireBaselineDesignQualificationPassedV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { measureMainWireIntegratedModelFormalPreloadReserveV2,
  qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1 } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { assertMainWireStandard70PreloadReservePassedV1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { designRateInitializationV1, designFinalRateInitializationV1 } from "./mainWireBaselineDesignExecutionV1";
import { evaluateMainWireBaselinePressureRateQualityV1 } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { evaluateMainWireBaselineColdConsistencyV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineColdConsistencyV1";
import { buildMainWireStandard70BaselineCalibrationRequestIdentityV1,
  buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1, initializationIdentityV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import launchBaseline from "@/studio/integrations/mainWireIntegratedV3/standard70-launch-baseline.json";
const checkpoint = launchBaseline.qualificationCheckpoint;

const { values } = parseArgs({ options: { request: { type: "string" },
  "integrity-tier": { type: "string", default: "full-invariant" },
  "rate-initialization": { type: "string", default: "cold" },
  "rate-source-request": { type: "string" }, "rate-source-evaluation": { type: "string" },
  evaluation: { type: "string" }, mode: { type: "string" }, output: { type: "string" } } });
if (!values.request || !values.evaluation || !values.output
  || !["cold", "refined", "reserve", "hr60", "hr70"].includes(values.mode ?? "")) {
  throw new Error("--request FILE --evaluation FILE --mode cold|refined|reserve|hr60|hr70 --output NEW_FILE");
}
if (Boolean(values["rate-source-request"]) !== Boolean(values["rate-source-evaluation"])
  || (values["rate-source-request"] && !["hr60", "hr70"].includes(values.mode!))) {
  throw new Error("rate source request and evaluation must be paired and used only for an HR condition");
}
if (!["cold", "same-clock-checkpoint"].includes(values["rate-initialization"]!)) {
  throw new Error("--rate-initialization must be cold|same-clock-checkpoint");
}
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
  throw new Error("qualification requires a clean committed worktree");
}
selectHotPathIntegrityTierV1(values["integrity-tier"] as HotPathIntegrityTierV1);
const executionTier = hotPathIntegrityTierV1();
const reserveExecutionTier = executionTier;
const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const request = JSON.parse(await readFile(values.request, "utf8")) as MainWireStandard70BaselineCalibrationEvaluationRequestV1;
const previous = JSON.parse(await readFile(values.evaluation, "utf8")) as MainWireStandard70BaselineCalibrationEvaluationV1;
if (previous.status !== "accepted" || !scoreMainWireBaselineOperatingPointV1(previous).feasible
  || !request.hemodynamicResearchInputs || !request.mechanismResearchInputs
  || request.ventricularContractilityScale === undefined) {
  throw new Error("qualification requires an accepted screened candidate with explicit inputs");
}
const currentPolicy = await buildMainWireStandard70BaselineCalibrationConstructionPolicyIdentityV1();
const sourceDtSec = request.nominalDtSec ?? 0.002;
if (sourceDtSec !== 0.002 || previous.nominalDtSec !== sourceDtSec) {
  throw new Error("baseline design qualification requires a bound 2-ms source; refined is 1 ms, cold keeps 2 ms");
}
if (previous.constructionPolicyIdentitySha256 !== currentPolicy.constructionPolicyIdentitySha256
  || previous.requestIdentitySha256 !== await buildMainWireStandard70BaselineCalibrationRequestIdentityV1({
    constructionPolicyIdentitySha256: currentPolicy.constructionPolicyIdentitySha256,
    hemodynamicResearchInputs: request.hemodynamicResearchInputs,
    mechanismResearchInputs: request.mechanismResearchInputs,
    ventricularContractilityScale: request.ventricularContractilityScale,
    nominalDtSec: request.nominalDtSec ?? 0.002,
    initialization: initializationIdentityV1(request.initialization ?? { kind: "cold" }),
  })) {
  throw new Error("qualification source request does not bind the saved evaluation");
}
const startedAt = performance.now();
let reserve: unknown = null;
let reserveStatus: "not-run" | "passed" | "failed" = "not-run";
let reserveFailure: string | null = null;
const hemodynamics = { ...request.hemodynamicResearchInputs,
  ...(values.mode === "hr60" ? { heartRateBpm: 60 } : {}),
  ...(values.mode === "hr70" ? { heartRateBpm: 70 } : {}),
};
const rateInitialization = values["rate-source-request"] && values["rate-source-evaluation"]
  ? await designFinalRateInitializationV1({ hemodynamicResearchInputs: hemodynamics,
    mechanismResearchInputs: request.mechanismResearchInputs,
    ventricularContractilityScale: request.ventricularContractilityScale }, sourceDtSec,
    JSON.parse(await readFile(values["rate-source-request"], "utf8")),
    JSON.parse(await readFile(values["rate-source-evaluation"], "utf8"))) : undefined;
const evaluation = await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
  ...request, hemodynamicResearchInputs: hemodynamics,
  nominalDtSec: values.mode === "refined" ? sourceDtSec / 2 : sourceDtSec,
  // Never relabel the finalist's different pacing clock. A compatible official
  // source can screen this rate; the selected baseline still needs its own cold run.
  initialization: rateInitialization ?? (["hr60", "hr70"].includes(values.mode!) && values["rate-initialization"] === "same-clock-checkpoint"
    ? designRateInitializationV1(hemodynamics.heartRateBpm,
      resolveMainWireFittingReferenceV1("baseline").selectedConstruction.candidateInputs,
      checkpoint as unknown as MainWireIntegratedModelStandard70CheckpointV1)
    : ["cold", "hr60", "hr70"].includes(values.mode!) ? { kind: "cold" }
    : { kind: "standard70-exact-checkpoint", checkpoint: previous.exactResult.checkpoint }),
});
if (values.mode === "reserve" && evaluation.status === "accepted"
  && scoreMainWireBaselineOperatingPointV1(evaluation).feasible) {
  try {
    selectHotPathIntegrityTierV1(reserveExecutionTier);
    const session = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
      evaluation.exactResult.checkpoint, request.hemodynamicResearchInputs,
      request.ventricularContractilityScale, undefined, request.mechanismResearchInputs,
    );
    const qualifiedReserve = qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1(
      await measureMainWireIntegratedModelFormalPreloadReserveV2(session, request.hemodynamicResearchInputs));
    reserve = qualifiedReserve;
    assertMainWireStandard70PreloadReservePassedV1(qualifiedReserve);
    reserveStatus = "passed";
  } catch (error) {
    reserveStatus = "failed";
    reserveFailure = error instanceof Error ? error.message : String(error);
  } finally { selectHotPathIntegrityTierV1(executionTier); }
}
const candidateIdentitySha256 = await sha256CanonicalJsonHex({
  hemodynamicResearchInputs: request.hemodynamicResearchInputs,
  ventricularContractilityScale: request.ventricularContractilityScale,
  mechanismResearchInputs: request.mechanismResearchInputs,
});
const pressureRateQuality = values.mode === "refined" && evaluation.status === "accepted"
  ? evaluateMainWireBaselinePressureRateQualityV1({
    coarse: { qualification: previous.exactResult, candidateIdentitySha256 },
    fine: { qualification: evaluation.exactResult, candidateIdentitySha256 },
  }) : null;
const coldConsistency = values.mode === "cold" && evaluation.status === "accepted"
  ? evaluateMainWireBaselineColdConsistencyV1({
    warm: { evaluation: previous, candidateIdentitySha256 },
    cold: { evaluation, candidateIdentitySha256 },
  }) : null;
const qualified = mainWireBaselineDesignQualificationPassedV1(evaluation, values.mode === "reserve", reserveStatus)
  && (values.mode !== "refined" || pressureRateQuality?.status === "passed")
  && (values.mode !== "cold" || coldConsistency?.status === "passed");
await writeFile(values.output, JSON.stringify({ executionCommit, executionTier, reserveExecutionTier, mode: values.mode, qualified,
  rateInitializationPolicy: rateInitialization ? "bound-same-candidate-rate-screen-checkpoint" : values["rate-initialization"],
  rateSourceRequestPath: values["rate-source-request"] ?? null,
  rateSourceEvaluationPath: values["rate-source-evaluation"] ?? null,
  conditionHemodynamicResearchInputs: hemodynamics,
  sourceRequestPath: values.request, sourceEvaluationPath: values.evaluation,
  wallTimeMs: performance.now() - startedAt, evaluation, reserveStatus, reserveFailure, reserve, pressureRateQuality, coldConsistency,
  baselineAdopted: false }, null, 2), { flag: "wx" });
process.stdout.write(`${values.output}\n`);
if (!qualified) process.exitCode = 1;
