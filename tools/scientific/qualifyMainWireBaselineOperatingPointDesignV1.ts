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
import { qualifyMainWireIntegratedModelFormalPreloadReserveV1 } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { assertMainWireStandard70PreloadReservePassedV1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";

const { values } = parseArgs({ options: { request: { type: "string" },
  "integrity-tier": { type: "string", default: "full-invariant" },
  evaluation: { type: "string" }, mode: { type: "string" }, output: { type: "string" } } });
if (!values.request || !values.evaluation || !values.output
  || !["cold", "refined", "reserve", "hr60", "hr70", "afterload"].includes(values.mode ?? "")) {
  throw new Error("--request FILE --evaluation FILE --mode cold|refined|reserve|hr60|hr70|afterload --output NEW_FILE");
}
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
  throw new Error("qualification requires a clean committed worktree");
}
selectHotPathIntegrityTierV1(values["integrity-tier"] as HotPathIntegrityTierV1);
const executionTier = hotPathIntegrityTierV1();
const reserveExecutionTier = "full-invariant" as const;
const executionCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const request = JSON.parse(await readFile(values.request, "utf8")) as MainWireStandard70BaselineCalibrationEvaluationRequestV1;
const previous = JSON.parse(await readFile(values.evaluation, "utf8")) as MainWireStandard70BaselineCalibrationEvaluationV1;
if (previous.status !== "accepted" || !scoreMainWireBaselineOperatingPointV1(previous).feasible
  || !request.hemodynamicResearchInputs || !request.mechanismResearchInputs
  || request.ventricularContractilityScale === undefined) {
  throw new Error("qualification requires an accepted screened candidate with explicit inputs");
}
const startedAt = performance.now();
let reserve: unknown = null;
let reserveStatus: "not-run" | "passed" | "failed" = "not-run";
let reserveFailure: string | null = null;
const hemodynamics = { ...request.hemodynamicResearchInputs,
  ...(values.mode === "hr60" ? { heartRateBpm: 60 } : {}),
  ...(values.mode === "hr70" ? { heartRateBpm: 70 } : {}),
  ...(values.mode === "afterload" ? { systemicResistance: request.hemodynamicResearchInputs.systemicResistance * 1.1 } : {}),
};
const evaluation = await evaluateMainWireStandard70BaselineCalibrationCandidateV1({
  ...request, hemodynamicResearchInputs: hemodynamics,
  nominalDtSec: values.mode === "refined" ? 0.001 : 0.002,
  // Different pacing periods do not share the same exact cycle boundary.
  // Qualify a discrete rate condition cold; never relabel a different clock.
  initialization: ["cold", "hr60", "hr70"].includes(values.mode!) ? { kind: "cold" }
    : values.mode === "afterload"
      ? { kind: "standard70-parameter-continuation", sourceCheckpoint: previous.exactResult.checkpoint,
        sourceHemodynamicResearchInputs: request.hemodynamicResearchInputs,
        sourceMechanismResearchInputs: request.mechanismResearchInputs,
        sourceVentricularContractilityScale: request.ventricularContractilityScale }
      : { kind: "standard70-exact-checkpoint", checkpoint: previous.exactResult.checkpoint },
});
if (values.mode === "reserve" && evaluation.status === "accepted"
  && scoreMainWireBaselineOperatingPointV1(evaluation).feasible) {
  try {
    selectHotPathIntegrityTierV1(reserveExecutionTier);
    const session = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
      evaluation.exactResult.checkpoint, request.hemodynamicResearchInputs,
      request.ventricularContractilityScale, undefined, request.mechanismResearchInputs,
    );
    reserve = await qualifyMainWireIntegratedModelFormalPreloadReserveV1(session, request.hemodynamicResearchInputs);
    assertMainWireStandard70PreloadReservePassedV1(reserve as Awaited<ReturnType<typeof qualifyMainWireIntegratedModelFormalPreloadReserveV1>>);
    reserveStatus = "passed";
  } catch (error) {
    reserveStatus = "failed";
    reserveFailure = error instanceof Error ? error.message : String(error);
  } finally { selectHotPathIntegrityTierV1(executionTier); }
}
const qualified = mainWireBaselineDesignQualificationPassedV1(evaluation, values.mode === "reserve", reserveStatus);
await writeFile(values.output, JSON.stringify({ executionCommit, executionTier, reserveExecutionTier, mode: values.mode, qualified,
  sourceRequestPath: values.request, sourceEvaluationPath: values.evaluation,
  wallTimeMs: performance.now() - startedAt, evaluation, reserveStatus, reserveFailure, reserve,
  baselineAdopted: false }, null, 2), { flag: "wx" });
process.stdout.write(`${values.output}\n`);
if (!qualified) process.exitCode = 1;
