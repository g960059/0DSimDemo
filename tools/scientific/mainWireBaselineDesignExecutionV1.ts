import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { assertMainWireStandard70PreloadReservePassedV1,
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireIntegratedModelStandard70CheckpointV1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type { MainWireIntegratedModelStandard70CandidateInitializationV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";

export const designReservePolicyV1 = { base: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  standard70: MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 };

export async function reserveCandidateIdentityV1(inputs: MainWireBaselineCalibrationCandidateInputsV1, nominalDtSec: number) {
  return sha256CanonicalJsonHex({ hemodynamicResearchInputs: inputs.hemodynamicResearchInputs,
    mechanismResearchInputs: inputs.mechanismResearchInputs,
    ventricularContractilityScale: inputs.ventricularContractilityScale, nominalDtSec });
}

export type DesignReserveResultV1 = {
  reserve: MainWireIntegratedModelFormalPreloadReserveMeasurementV1 | null;
  failure: string | null; wallTimeMs: number; executionTier: "full-invariant";
  sourceCheckpointSha256: string; candidateIdentitySha256: string; reservePolicyIdentity: string;
  sourceEvaluationExecutionTier: "full-invariant" | "hot-path-lean";
};

export function qualifyMeasuredDesignReserveV1(result: DesignReserveResultV1, expected: {
  sourceCheckpointSha256: string; candidateIdentitySha256: string; reservePolicyIdentity: string;
  sourceGlobalTbvMl: number;
}) {
  const { sourceGlobalTbvMl, ...identities } = expected;
  const policy = MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1;
  if (!result.reserve || result.failure !== null || result.executionTier !== "full-invariant"
    || !["full-invariant", "hot-path-lean"].includes(result.sourceEvaluationExecutionTier)
    || (Object.keys(identities) as (keyof typeof identities)[]).some((key) => result[key] !== identities[key])
    || result.reserve.protocolId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID
    || !(sourceGlobalTbvMl > 0) || !Number.isFinite(sourceGlobalTbvMl)
    || !(Math.abs(result.reserve.sourceGlobalTbvMl - sourceGlobalTbvMl) <= 1e-6)
    || (["hypovolemic", "hypervolemic"] as const).some((direction) =>
      result.reserve![`${direction}GlobalTbvScale`] !== policy[`${direction}GlobalTbvScale`]
      || !(Math.abs(result.reserve![`${direction}GlobalTbvMl`]
        - result.reserve!.sourceGlobalTbvMl * policy[`${direction}GlobalTbvScale`]) <= 1e-6)
      || (["left", "right"] as const).some((side) =>
        result.reserve![side][direction].endpointDirection !== direction))
    || [result.reserve.left.hypovolemic, result.reserve.left.hypervolemic,
      result.reserve.right.hypovolemic, result.reserve.right.hypervolemic].some((row) =>
      Object.entries(row).some(([key, value]) => key !== "endpointDirection"
        && (typeof value !== "number" || !Number.isFinite(value))))) {
    throw new Error("measured reserve is missing, failed, or incompatible with this finalist");
  }
  const qualification = qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1(result.reserve);
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

export function designQualificationPathV1(index: number, mode: string) {
  return `${index}.qualification-${mode}.json`;
}

export function validateDesignQualificationResultV1(raw: unknown, expected: {
  mode: string; sourceRequestPath: string; sourceEvaluationPath: string; executionCommit: string;
}): boolean {
  if (raw === null || typeof raw !== "object") throw new Error("missing qualification result");
  const result = raw as Record<string, unknown>;
  if (typeof result.qualified !== "boolean" || result.executionTier !== "full-invariant"
    || result.baselineAdopted !== false
    || Object.entries(expected).some(([key, value]) => result[key] !== value)) {
    throw new Error("qualification result shape or provenance mismatch");
  }
  return result.qualified;
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
