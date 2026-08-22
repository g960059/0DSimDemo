import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
} from "@/engine/myocardium/MainWireIntegratedModelAnalysisContractV3";
import {
  validateStudioSimulationAnalysisV2,
  type StudioSimulationAnalysisExecutionPlanResolverV2,
  type StudioSimulationAnalysisExecutionPlanV2,
  type StudioSimulationAnalysisV2,
} from "@/studio/contracts/v2/simulation";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";

const MAIN_WIRE_INTEGRATED_STUDIO_BIDIRECTIONAL_STARLING_PLAN_V3:
StudioSimulationAnalysisExecutionPlanV2 = Object.freeze({
  partitions: Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
    MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPERVOLEMIC_PARTITION_V3,
  ]),
  merge: mergeMainWireIntegratedStudioStructuralAnalysesV3,
});

const MAIN_WIRE_INTEGRATED_STUDIO_PRELOAD_REDUCTION_PVA_PLAN_V3:
StudioSimulationAnalysisExecutionPlanV2 = Object.freeze({
  partitions: Object.freeze([
    MAIN_WIRE_INTEGRATED_MODEL_RESPONSIVE_STARLING_HYPOVOLEMIC_PARTITION_V3,
  ]),
  merge: mergeMainWireIntegratedStudioStructuralAnalysesV3,
});

export const resolveMainWireIntegratedStudioAnalysisExecutionPlanV3:
StudioSimulationAnalysisExecutionPlanResolverV2 = (analysisId) =>
  analysisId === MAIN_WIRE_INTEGRATED_MODEL_GUYTON_STARLING_ORIENTATION_V3_ID
    ? MAIN_WIRE_INTEGRATED_STUDIO_BIDIRECTIONAL_STARLING_PLAN_V3
    : analysisId ===
        MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_RELATIONS_V3_ID
      ? MAIN_WIRE_INTEGRATED_STUDIO_PRELOAD_REDUCTION_PVA_PLAN_V3
    : null;

/**
 * Combines independently progressing preload directions without inventing
 * samples. Exact duplicate center points collapse by TBV/role identity; every
 * other measured or boundary point remains model-owned.
 */
export function mergeMainWireIntegratedStudioStructuralAnalysesV3(
  analyses: readonly StudioSimulationAnalysisV2[],
): StudioSimulationAnalysisV2 {
  if (analyses.length === 0) {
    throw new Error("bidirectional Starling merge requires a partial result");
  }
  if (analyses.length === 1) return analyses[0]!;
  const first = analyses[0]!;
  for (const analysis of analyses.slice(1)) {
    assertSameAnalysisEnvelopeV3(first, analysis);
  }
  const payloads = analyses.map(({ payload }, index) =>
    requiredRecordV3(payload, `analysis[${index}].payload`));
  assertCanonicalEqualV3(
    payloads.map((payload) => withoutKeysV3(payload, ["left", "right"])),
    "bidirectional analysis envelope payloads",
  );
  const payload = Object.freeze({
    ...payloads[0],
    right: mergeStructuralSideV3(payloads, "right"),
    left: mergeStructuralSideV3(payloads, "left"),
  });
  return validateStudioSimulationAnalysisV2({
    ...first,
    payload,
  }, "$.bidirectionalStarlingAnalysis");
}

function mergeStructuralSideV3(
  payloads: readonly Readonly<Record<string, unknown>>[],
  side: "right" | "left",
): Readonly<Record<string, unknown>> {
  const sides = payloads.map((payload, index) =>
    requiredRecordV3(payload[side], `analysis[${index}].payload.${side}`));
  assertCanonicalEqualV3(
    sides.map((candidate) => withoutKeysV3(candidate, ["starlingLocus"])),
    `bidirectional ${side} structural payloads`,
  );
  const loci = sides.map((candidate, index) => {
    const locus = requiredRecordV3(
      candidate.starlingLocus,
      `analysis[${index}].payload.${side}.starlingLocus`,
    );
    if (
      (
        locus.status !== "responsive-fixed-tbv-preview" &&
        locus.status !== "measured-fixed-tbv-protocol"
      ) || !Array.isArray(locus.points)
    ) {
      throw new Error(
        `bidirectional ${side} result is not a fixed-TBV locus`,
      );
    }
    return locus;
  });
  assertCanonicalEqualV3(
    loci.map((locus) => withoutKeysV3(
      locus,
      ["completedPointCount", "points", "totalPointCount"],
    )),
    `bidirectional ${side} Starling contracts`,
  );
  const pointByIdentity = new Map<string, unknown>();
  for (const [locusIndex, locus] of loci.entries()) {
    const points = locus.points as readonly unknown[];
    for (const [pointIndex, value] of points.entries()) {
      const point = requiredRecordV3(
        value,
        `analysis[${locusIndex}].payload.${side}.starlingLocus.points[${pointIndex}]`,
      );
      const tbv = point.totalBloodVolumeMl;
      const role = point.role;
      if (
        typeof tbv !== "number"
        || !Number.isFinite(tbv)
        || (role !== "operating-anchor" && role !== "continuation")
      ) throw new Error(`bidirectional ${side} Starling point identity is invalid`);
      const identity = `${role}:${tbv}`;
      const prior = pointByIdentity.get(identity);
      if (prior !== undefined) {
        assertCanonicalEqualV3(
          [prior, point],
          `bidirectional ${side} duplicate Starling point ${identity}`,
        );
      } else pointByIdentity.set(identity, point);
    }
  }
  const points = Object.freeze([...pointByIdentity.values()].sort((left, right) => {
    const leftPressure = requiredFiniteFieldV3(left, "fillingPressureMmHg");
    const rightPressure = requiredFiniteFieldV3(right, "fillingPressureMmHg");
    return leftPressure - rightPressure;
  }));
  const allPartitionsComplete = loci.every((locus) =>
    requiredSafeIntegerFieldV3(locus, "completedPointCount")
      === requiredSafeIntegerFieldV3(locus, "totalPointCount"));
  const totalPointCount = allPartitionsComplete
    ? points.length
    : Math.max(
        points.length,
        ...loci.map((locus) => requiredSafeIntegerFieldV3(
          locus,
          "totalPointCount",
        )),
      );
  return Object.freeze({
    ...sides[0],
    starlingLocus: Object.freeze({
      ...loci[0],
      completedPointCount: points.length,
      totalPointCount,
      points,
    }),
  });
}

function assertSameAnalysisEnvelopeV3(
  expected: StudioSimulationAnalysisV2,
  candidate: StudioSimulationAnalysisV2,
): void {
  for (const key of [
    "analysisId",
    "inputEpoch",
    "modelId",
    "runtimeSessionId",
    "scenarioId",
    "sourceAcceptedRevision",
    "sourceAcceptedTimeSec",
  ] as const) {
    if (candidate[key] !== expected[key]) {
      throw new Error(`bidirectional Starling analysis ${key} differs`);
    }
  }
}

function assertCanonicalEqualV3(
  values: readonly unknown[],
  label: string,
): void {
  const expected = studioCanonicalJsonStringify(values[0]);
  if (values.slice(1).some((value) =>
    studioCanonicalJsonStringify(value) !== expected)) {
    throw new Error(`${label} differ`);
  }
}

function withoutKeysV3(
  value: Readonly<Record<string, unknown>>,
  omitted: readonly string[],
): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(Object.entries(value).filter(([key]) =>
    !omitted.includes(key))));
}

function requiredRecordV3(
  value: unknown,
  path: string,
): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Readonly<Record<string, unknown>>;
}

function requiredFiniteFieldV3(value: unknown, field: string): number {
  const candidate = requiredRecordV3(value, "Starling point")[field];
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    throw new Error(`Starling point ${field} must be finite`);
  }
  return candidate;
}

function requiredSafeIntegerFieldV3(
  value: Readonly<Record<string, unknown>>,
  field: string,
): number {
  const candidate = value[field];
  if (!Number.isSafeInteger(candidate) || (candidate as number) < 0) {
    throw new Error(`Starling locus ${field} must be a nonnegative integer`);
  }
  return candidate as number;
}
