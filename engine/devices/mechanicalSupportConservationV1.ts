import {
  MECHANICAL_SUPPORT_NODE_NAMES_V1,
  type MechanicalSupportNodeNameV1,
} from "@/engine/devices/typesV1";

export type MechanicalSupportNodeRateRecordV1 = Readonly<
  Record<MechanicalSupportNodeNameV1, number>
>;

/**
 * Physical conservation is a floating-point residual policy, not a serialized
 * identity policy. Sixty-four ulps covers the deterministic accumulation and
 * node-aggregation roundoff while remaining proportional to routed flow.
 */
const CONSERVATION_ROUNDOFF_ULPS_V1 = 64;

export function compensatedMechanicalSupportNodeSumV1(
  nodeRates: MechanicalSupportNodeRateRecordV1,
): number {
  return compensatedFiniteSumV1(
    MECHANICAL_SUPPORT_NODE_NAMES_V1.map((node) => nodeRates[node]),
    "mechanical-support node-rate sum",
  );
}

export function mechanicalSupportConservationToleranceMlPerSecV1(
  nodeRates: MechanicalSupportNodeRateRecordV1,
): number {
  const routedFlowScaleMlPerSec = compensatedFiniteSumV1(
    MECHANICAL_SUPPORT_NODE_NAMES_V1.map(
      (node) => Math.abs(nodeRates[node]),
    ),
    "mechanical-support routed-flow scale",
  );
  return CONSERVATION_ROUNDOFF_ULPS_V1
    * Number.EPSILON
    * Math.max(1, routedFlowScaleMlPerSec);
}

export function mechanicalSupportNodeRatesAreConservativeV1(
  nodeRates: MechanicalSupportNodeRateRecordV1,
  residualMlPerSec: number,
): boolean {
  if (!Number.isFinite(residualMlPerSec)) return false;
  return Math.abs(residualMlPerSec)
    <= mechanicalSupportConservationToleranceMlPerSecV1(nodeRates);
}

/** Deterministic Neumaier sum with a finite check at each boundary. */
function compensatedFiniteSumV1(
  values: readonly number[],
  field: string,
): number {
  let sum = 0;
  let correction = 0;
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new Error(`${field}[${index}] must be finite`);
    }
    const next = sum + value;
    if (!Number.isFinite(next)) {
      throw new Error(`${field} partial sum must be finite`);
    }
    correction += Math.abs(sum) >= Math.abs(value)
      ? sum - next + value
      : value - next + sum;
    if (!Number.isFinite(correction)) {
      throw new Error(`${field} compensation must be finite`);
    }
    sum = next;
  }
  const result = sum + correction;
  if (!Number.isFinite(result)) {
    throw new Error(`${field} must be finite`);
  }
  return result;
}
