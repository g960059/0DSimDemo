import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { qualifyMainWireIntegratedModelFormalPreloadReserveMeasurementV1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  type MainWireIntegratedModelFormalPreloadReserveMeasurementV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { assertMainWireStandard70PreloadReservePassedV1,
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1 } from
  "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";

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
};

export function qualifyMeasuredDesignReserveV1(result: DesignReserveResultV1, expected: {
  sourceCheckpointSha256: string; candidateIdentitySha256: string; reservePolicyIdentity: string;
}) {
  if (!result.reserve || result.failure !== null || result.executionTier !== "full-invariant"
    || (Object.keys(expected) as (keyof typeof expected)[]).some((key) => result[key] !== expected[key])
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
