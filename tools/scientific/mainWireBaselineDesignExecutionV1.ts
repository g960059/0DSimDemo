import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV2,
  type MainWireIntegratedModelFormalPreloadReserveQualificationV2,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2, validMainWireFixedToneSettlementEvidenceV2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { assertMainWireStandard70PreloadReservePassedV1,
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type { MainWireIntegratedModelStandard70CandidateInitializationV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import type { MainWireStandard70BaselineCalibrationAcceptedEvaluationV1,
  MainWireStandard70BaselineCalibrationEvaluationV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import { scoreMainWireBaselineOperatingPointV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineOperatingPointDesignV1";
import { assertMainWireBaselinePressureRateQualityV1 } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { assertMainWireBaselineColdConsistencyV1, type MainWireBaselineColdConsistencySourceV1 } from
  "@/analysis/methods/mainWire/MainWireBaselineColdConsistencyV1";
import { validPreloadReserveSideV1 } from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

export const designReservePolicyV1 = { base: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  standard70: MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1,
  measurementProtocolId: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
  endDiastolicDefinition: "inlet-valve-closure",
  settlement: MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 };

export async function reserveCandidateIdentityV1(inputs: MainWireBaselineCalibrationCandidateInputsV1, nominalDtSec: number) {
  return sha256CanonicalJsonHex({ hemodynamicResearchInputs: inputs.hemodynamicResearchInputs,
    mechanismResearchInputs: inputs.mechanismResearchInputs,
    ventricularContractilityScale: inputs.ventricularContractilityScale, nominalDtSec });
}

export type DesignReserveResultV1 = {
  reserve: MainWireIntegratedModelFormalPreloadReserveMeasurementV2 | null;
  failure: string | null; wallTimeMs: number; executionTier: "full-invariant";
  sourceCheckpointSha256: string; candidateIdentitySha256: string; reservePolicyIdentity: string;
  sourceEvaluationExecutionTier: "full-invariant" | "hot-path-lean";
};

export function qualifyMeasuredDesignReserveV1(result: DesignReserveResultV1, expected: {
  sourceCheckpointSha256: string; candidateIdentitySha256: string; reservePolicyIdentity: string;
  sourceGlobalTbvMl: number;
}) {
  const { sourceGlobalTbvMl, ...identities } = expected;
  if (!result.reserve || result.failure !== null || result.executionTier !== "full-invariant"
    || !["full-invariant", "hot-path-lean"].includes(result.sourceEvaluationExecutionTier)
    || (Object.keys(identities) as (keyof typeof identities)[]).some((key) => result[key] !== identities[key])) {
    throw new Error("measured reserve is missing, failed, or incompatible with this finalist");
  }
  return qualifyCurrentDesignReserveObservationV1(result.reserve, sourceGlobalTbvMl);
}

function qualifyCurrentDesignReserveObservationV1(
  reserve: MainWireIntegratedModelFormalPreloadReserveMeasurementV2,
  sourceGlobalTbvMl: number,
) {
  const policy = MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1;
  if (reserve.protocolId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID
    || reserve.endDiastolicDefinition !== designReservePolicyV1.endDiastolicDefinition
    || (["center", "hypovolemic", "hypervolemic"] as const).some((key) =>
      !validMainWireFixedToneSettlementEvidenceV2(reserve.settlement?.[key]))
    || !(sourceGlobalTbvMl > 0) || !Number.isFinite(sourceGlobalTbvMl)
    || !(Math.abs(reserve.sourceGlobalTbvMl - sourceGlobalTbvMl) <= 1e-6)
    || (["hypovolemic", "hypervolemic"] as const).some((direction) =>
      reserve[`${direction}GlobalTbvScale`] !== policy[`${direction}GlobalTbvScale`]
      || !(Math.abs(reserve[`${direction}GlobalTbvMl`]
        - reserve.sourceGlobalTbvMl * policy[`${direction}GlobalTbvScale`]) <= 1e-6)
      || (["left", "right"] as const).some((side) =>
        reserve[side][direction].endpointDirection !== direction))
    || [reserve.left.hypovolemic, reserve.left.hypervolemic,
      reserve.right.hypovolemic, reserve.right.hypervolemic].some((row) =>
      Object.entries(row).some(([key, value]) => key !== "endpointDirection"
        && (typeof value !== "number" || !Number.isFinite(value))))) {
    throw new Error("measured reserve is missing, failed, or incompatible with this finalist");
  }
  const qualification = qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1(reserve);
  assertMainWireStandard70PreloadReservePassedV1(qualification);
  return qualification;
}

/** Continue only from an actual same-rate source; exact restore binds its inputs. */
export function designRateInitializationV1(heartRateBpm: number,
  source: MainWireBaselineCalibrationCandidateInputsV1,
  sourceCheckpoint: MainWireIntegratedModelStandard70CheckpointV1,
): MainWireIntegratedModelStandard70CandidateInitializationV1 {
  return source.hemodynamicResearchInputs.heartRateBpm === heartRateBpm
    ? { kind: "standard70-parameter-continuation", sourceCheckpoint,
      sourceHemodynamicResearchInputs: source.hemodynamicResearchInputs,
      sourceMechanismResearchInputs: source.mechanismResearchInputs,
      sourceVentricularContractilityScale: source.ventricularContractilityScale }
    : { kind: "cold" };
}

/** Early screening alone may continue from the frozen incumbent's counterpart. */
export function designEarlyRateInitializationV1(heartRateBpm: number,
  officialInputs: MainWireBaselineCalibrationCandidateInputsV1,
  officialCheckpoint: MainWireIntegratedModelStandard70CheckpointV1,
  source?: { request: MainWireBaselineCalibrationCandidateInputsV1;
    evaluation: MainWireStandard70BaselineCalibrationEvaluationV1 },
): MainWireIntegratedModelStandard70CandidateInitializationV1 {
  if (source?.request.hemodynamicResearchInputs.heartRateBpm === heartRateBpm
    && source.evaluation.status === "accepted"
    && source.evaluation.exactResult.classification.status === "period1-converged"
    && Number.isFinite(scoreMainWireBaselineOperatingPointV1(source.evaluation).minimumMargin)) {
    // A finite corridor failure is still an exact accepted state. Retain every
    // actual source input; exact restore, not HR relabelling, binds the checkpoint.
    return designRateInitializationV1(heartRateBpm, source.request, source.evaluation.exactResult.checkpoint);
  }
  return designRateInitializationV1(heartRateBpm, officialInputs, officialCheckpoint);
}

export function designQualificationPathV1(index: number, mode: string) {
  return `${index}.qualification-${mode}.json`;
}

export function validateDesignQualificationResultV1(raw: unknown, expected: {
  mode: string; sourceRequestPath: string; sourceEvaluationPath: string; executionCommit: string;
}, source?: MainWireBaselineColdConsistencySourceV1): boolean {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("missing qualification result");
  const result = raw as Record<string, unknown>;
  if (typeof result.qualified !== "boolean" || result.executionTier !== "full-invariant"
    || result.baselineAdopted !== false
    || !["cold", "refined", "reserve", "hr60", "hr70", "afterload"].includes(expected.mode)
    || Object.entries(expected).some(([key, value]) => result[key] !== value)) {
    throw new Error("qualification result shape or provenance mismatch");
  }
  if (!result.qualified) return false;
  const evaluation = result.evaluation as MainWireStandard70BaselineCalibrationAcceptedEvaluationV1 | undefined;
  let feasible = false;
  try { feasible = !!evaluation && scoreMainWireBaselineOperatingPointV1(evaluation).feasible; } catch { /* Malformed imported evidence. */ }
  if (!evaluation || !feasible) throw new Error("qualification result requires a complete feasible evaluation");
  if (expected.mode === "cold") {
    if (!source) throw new Error("Cold consistency requires the actual nominal source and candidate identity");
    assertMainWireBaselineColdConsistencyV1(result.coldConsistency, {
      warm: source,
      cold: { evaluation, candidateIdentitySha256: source.candidateIdentitySha256 },
    });
  }
  if (expected.mode === "refined") {
    assertMainWireBaselinePressureRateQualityV1(result.pressureRateQuality);
    const quality = result.pressureRateQuality;
    const exact = evaluation.exactResult;
    const checkpoint = exact?.checkpoint;
    const beat = checkpoint?.baseStandardCheckpointV2?.completedBeatMetrics;
    if (!beat || exact.classification.status !== "period1-converged"
      || quality.grids.fine.nominalDtSec !== evaluation.nominalDtSec
      || quality.grids.fine.nominalDtSec !== exact.nominalDtSec
      || quality.grids.fine.checkpointSha256 !== checkpoint.checkpointSha256
      || canonicalJsonStringify(quality.grids.fine.modelIdentity) !== canonicalJsonStringify(checkpoint.modelIdentity)
      || quality.checks.some((check) => {
        const ventricle = check.checkId.startsWith("left-") ? "LV" : "RV";
        const extremum = check.checkId.includes(".maximum-") ? "maximumMmHgPerSec" : "minimumMmHgPerSec";
        const measurement = ventricle === "LV" ? exact.measurements?.leftVentricle : exact.measurements?.rightVentricle;
        const actual = [...evaluation.objectiveChecks, ...evaluation.safetySentinelChecks]
          .find(({ checkId }) => checkId === check.checkId)?.actual;
        const reported = check.fine.reportedMmHgPerSec;
        return reported !== beat.ventricularAbsolutePressureRateExtrema?.[ventricle]?.[extremum]
          || reported !== (extremum === "maximumMmHgPerSec" ? measurement?.maximumDpDtMmHgPerSec : measurement?.minimumDpDtMmHgPerSec)
          || reported !== actual;
      })) {
      throw new Error("qualification pressure-rate quality does not bind the refined evaluation");
    }
  }
  if (expected.mode === "reserve") {
    const reserve = result.reserve as MainWireIntegratedModelFormalPreloadReserveQualificationV2 | undefined;
    const condition = result.conditionHemodynamicResearchInputs as { totalBloodVolumeMl?: number } | undefined;
    if (result.reserveExecutionTier !== "full-invariant" || result.reserveStatus !== "passed" || result.reserveFailure !== null
      || !reserve || reserve.status !== "passed"
      || reserve.qualificationId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID
      || !reserve.left || !reserve.right
      || !validPreloadReserveSideV1(reserve.left) || !validPreloadReserveSideV1(reserve.right)) {
      throw new Error("qualification result requires passed full-policy reserve evidence");
    }
    qualifyCurrentDesignReserveObservationV1(reserve, condition?.totalBloodVolumeMl ?? NaN);
  }
  return true;
}

/** Bounded occupancy without a batch barrier; returned order is input order. */
export async function mapDesignInOrderV1<T, R>(items: readonly T[], parallelism: number,
  run: (item: T, index: number) => Promise<R>): Promise<R[]> {
  if (!Number.isInteger(parallelism) || parallelism < 1 || parallelism > 8) throw new Error("invalid design parallelism");
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(parallelism, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]!, index);
    }
  }));
  return results;
}
