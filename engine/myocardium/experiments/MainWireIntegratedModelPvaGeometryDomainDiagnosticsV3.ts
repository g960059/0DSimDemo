import {
  MMHG_ML_TO_JOULE_V1,
  type MainWireIntegratedModelMethodSpecificPvaResearchV1,
  type MainWireIntegratedModelPvaLinearRelationV1,
  type MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type {
  MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
  MainWireIntrinsicPassiveCenterSliceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import {
  diagnoseMainWireIntegratedModelPvaGeometryDomainsV2,
  type MainWireIntegratedModelPvaGeometryClassificationV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2";

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V3_ID =
  "main-wire-integrated-model-pva-geometry-domain-diagnostics-v3" as const;

const REFERENCES_V3 = Object.freeze([
  "dynamic-maximum-volume",
  "intrinsic-passive-center-slice",
] as const);

type ReferenceIdV3 = (typeof REFERENCES_V3)[number];

export type MainWireIntegratedModelPvaGeometryClassificationV3 =
  MainWireIntegratedModelPvaGeometryClassificationV2 | "relation-inadmissible";

export type MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3 = Readonly<{
  studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V3_ID;
  status: "completed";
  scope: "research-promotion-diagnostics-with-corrected-semantics";
  source: Readonly<{
    methodSpecificPvaStudyId: string;
    diastolicReferenceComparisonStudyId: string;
    geometryV2StudyId: string;
    semanticRowBindingEstablished: true;
  }>;
  closureDiagnostics: readonly Readonly<{
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    beatOrdinal: number;
    exactEndpointClosure: boolean;
    numericallyPeriodicClosureQualified: false;
    transientOpenPath: boolean;
    syntheticClosureAbsoluteFractionOfAcceptedOpenPath: number | null;
  }>[];
  rows: readonly (
    | Readonly<{
        status: "method-unavailable" | "relation-inadmissible";
        ventricleId: MainWireIntegratedModelPvaVentricleV1;
        beatOrdinal: number;
        directionId: "occlusion" | "release";
        systolicMethodId: string;
        reason: string;
        dynamicReferenceClassification:
          "method-unavailable" | "relation-inadmissible";
        intrinsicReferenceClassification:
          "method-unavailable" | "relation-inadmissible";
      }>
    | Readonly<{
        status: "diagnosed";
        ventricleId: MainWireIntegratedModelPvaVentricleV1;
        beatOrdinal: number;
        directionId: "occlusion" | "release";
        systolicMethodId: string;
        dynamicMaximumVolume: Readonly<{
          classification: MainWireIntegratedModelPvaGeometryClassificationV3;
          firstSupportedIntersectionVolumeMl: number | null;
          singleSupportedIntersectionConfirmed: boolean | null;
          reasons: readonly string[];
        }>;
        intrinsicPassiveCenterSlice: Readonly<{
          classification: MainWireIntegratedModelPvaGeometryClassificationV3;
          firstSupportedIntersectionVolumeMl: number | null;
          singleSupportedIntersectionConfirmed: boolean | null;
          reasons: readonly string[];
        }>;
      }>
  )[];
  summary: Readonly<{
    attemptedRowCount: number;
    semanticRowBindingEstablished: true;
    exactEndpointClosureCount: number;
    numericallyPeriodicClosureQualifiedCount: 0;
    transientOpenPathCount: number;
    relationInadmissibleRowCount: number;
    methodUnavailableRowCount: number;
    byReference: readonly Readonly<{
      referenceId: ReferenceIdV3;
      domainSupportedPvaRowCount: number;
      transientPvaLikeAreaRowCount: number;
      outOfDomainRowCount: number;
      relationInadmissibleRowCount: number;
      methodUnavailableRowCount: number;
    }>[];
  }>;
  interpretation: Readonly<{
    exactEndpointClosureIsPeriodicQualification: false;
    transientRowsNumericallyPeriodic: false;
    nonpositiveSlopeIsMethodUnavailable: false;
    everySupportedIntersectionIsSingleCrossingChecked: true;
    genericPvaEstablished: false;
    mainIntegrationReady: false;
  }>;
}>;

export function diagnoseMainWireIntegratedModelPvaGeometryDomainsV3(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV3 {
  assertSemanticRowBindingV3(pva, comparison);
  const v2 = diagnoseMainWireIntegratedModelPvaGeometryDomainsV2(
    pva,
    comparison,
  );
  const relations = new Map(
    pva.systolicRelations.map((outcome) => [
      relationKeyV3(outcome.ventricleId, outcome.directionId, outcome.methodId),
      outcome,
    ]),
  );
  const dynamicReferences = new Map(
    pva.diastolicReferences.map((outcome) => [
      directionKeyV3(outcome.ventricleId, outcome.directionId),
      outcome,
    ]),
  );
  const intrinsicSlices = new Map(
    comparison.intrinsicSlices.map((slice) => [slice.ventricleId, slice]),
  );

  const closureDiagnostics = Object.freeze(
    v2.beatWorkDiagnostics.map((work) =>
      Object.freeze({
        ventricleId: work.ventricleId,
        beatOrdinal: work.beatOrdinal,
        exactEndpointClosure: work.exactlyClosedByRetainedEndpoints,
        numericallyPeriodicClosureQualified: false as const,
        transientOpenPath: !work.exactlyClosedByRetainedEndpoints,
        syntheticClosureAbsoluteFractionOfAcceptedOpenPath:
          work.syntheticClosureAbsoluteFractionOfAcceptedOpenPath,
      }),
    ),
  );

  const rows = Object.freeze(
    v2.rows.map((row) => {
      if (row.status === "method-unavailable") {
        const classification = row.reason.includes(
          "does not have positive slope",
        )
          ? ("relation-inadmissible" as const)
          : ("method-unavailable" as const);
        return Object.freeze({
          status: classification,
          ventricleId: row.ventricleId,
          beatOrdinal: row.beatOrdinal,
          directionId: row.directionId,
          systolicMethodId: row.systolicMethodId,
          reason: row.reason,
          dynamicReferenceClassification: classification,
          intrinsicReferenceClassification: classification,
        });
      }

      const relationOutcome = relations.get(
        relationKeyV3(row.ventricleId, row.directionId, row.systolicMethodId),
      );
      if (relationOutcome?.status !== "available") {
        throw new Error("diagnosed V3 row requires an available relation");
      }
      const dynamicOutcome = dynamicReferences.get(
        directionKeyV3(row.ventricleId, row.directionId),
      );
      const slice = intrinsicSlices.get(row.ventricleId);
      const dynamic = correctedReferenceV3(
        row.dynamicMaximumVolume,
        relationOutcome.relation,
        row.systolicEndpoint.volumeMl,
        dynamicOutcome?.status === "available"
          ? (volumeMl) => dynamicPressureV3(dynamicOutcome.reference, volumeMl)
          : null,
        [],
      );
      const intrinsic = correctedReferenceV3(
        row.intrinsicPassiveCenterSlice,
        relationOutcome.relation,
        row.systolicEndpoint.volumeMl,
        slice?.status === "available"
          ? (volumeMl) => intrinsicPressureV3(slice, volumeMl)
          : null,
        slice?.status === "available"
          ? slice.points.map(({ volumeMl }) => volumeMl)
          : [],
      );
      return Object.freeze({
        status: "diagnosed" as const,
        ventricleId: row.ventricleId,
        beatOrdinal: row.beatOrdinal,
        directionId: row.directionId,
        systolicMethodId: row.systolicMethodId,
        dynamicMaximumVolume: dynamic,
        intrinsicPassiveCenterSlice: intrinsic,
      });
    }),
  );

  const byReference = Object.freeze(
    REFERENCES_V3.map((referenceId) => {
      const classifications = rows.map((row) =>
        row.status === "diagnosed"
          ? referenceId === "dynamic-maximum-volume"
            ? row.dynamicMaximumVolume.classification
            : row.intrinsicPassiveCenterSlice.classification
          : row.status,
      );
      return Object.freeze({
        referenceId,
        domainSupportedPvaRowCount: countV3(
          classifications,
          "domain-supported-pva",
        ),
        transientPvaLikeAreaRowCount: countV3(
          classifications,
          "transient-pva-like-area",
        ),
        outOfDomainRowCount: countV3(classifications, "out-of-domain"),
        relationInadmissibleRowCount: countV3(
          classifications,
          "relation-inadmissible",
        ),
        methodUnavailableRowCount: countV3(
          classifications,
          "method-unavailable",
        ),
      });
    }),
  );

  const result = Object.freeze({
    studyId: MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V3_ID,
    status: "completed" as const,
    scope: "research-promotion-diagnostics-with-corrected-semantics" as const,
    source: Object.freeze({
      methodSpecificPvaStudyId: pva.studyId,
      diastolicReferenceComparisonStudyId: comparison.studyId,
      geometryV2StudyId: v2.studyId,
      semanticRowBindingEstablished: true as const,
    }),
    closureDiagnostics,
    rows,
    summary: Object.freeze({
      attemptedRowCount: rows.length,
      semanticRowBindingEstablished: true as const,
      exactEndpointClosureCount: closureDiagnostics.filter(
        (value) => value.exactEndpointClosure,
      ).length,
      numericallyPeriodicClosureQualifiedCount: 0 as const,
      transientOpenPathCount: closureDiagnostics.filter(
        (value) => value.transientOpenPath,
      ).length,
      relationInadmissibleRowCount: rows.filter(
        (row) => row.status === "relation-inadmissible",
      ).length,
      methodUnavailableRowCount: rows.filter(
        (row) => row.status === "method-unavailable",
      ).length,
      byReference,
    }),
    interpretation: Object.freeze({
      exactEndpointClosureIsPeriodicQualification: false as const,
      transientRowsNumericallyPeriodic: false as const,
      nonpositiveSlopeIsMethodUnavailable: false as const,
      everySupportedIntersectionIsSingleCrossingChecked: true as const,
      genericPvaEstablished: false as const,
      mainIntegrationReady: false as const,
    }),
  });
  requireFiniteNumericLeavesV3(result, "PVA geometry V3");
  return result;
}

function correctedReferenceV3(
  source: Readonly<{
    classification: MainWireIntegratedModelPvaGeometryClassificationV2;
    supportedVolumeRangeMl: readonly [number, number];
    supportedIntersectionVolumeMl: number | null;
    reasons: readonly string[];
  }>,
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  endpointVolumeMl: number,
  referencePressure: ((volumeMl: number) => number | null) | null,
  referenceBreakpointsMl: readonly number[],
) {
  const first = source.supportedIntersectionVolumeMl;
  const single =
    first === null || referencePressure === null
      ? null
      : verifyMainWireIntegratedModelSingleSupportedIntersectionV3(
          relation,
          first,
          Math.min(endpointVolumeMl, source.supportedVolumeRangeMl[1]),
          referencePressure,
          referenceBreakpointsMl,
        );
  const reasons = [...source.reasons];
  if (single === false) {
    reasons.push("systolic line crosses the passive reference again");
  }
  const classification =
    source.classification === "domain-supported-pva" && single === false
      ? ("transient-pva-like-area" as const)
      : source.classification;
  return Object.freeze({
    classification,
    firstSupportedIntersectionVolumeMl: first,
    singleSupportedIntersectionConfirmed: single,
    reasons: Object.freeze(reasons),
  });
}

export function verifyMainWireIntegratedModelSingleSupportedIntersectionV3(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
  referencePressure: (volumeMl: number) => number | null,
  referenceBreakpointsMl: readonly number[] = [],
): boolean {
  // Intrinsic references supply every piecewise-linear knot, making this exact
  // on each segment. The dynamic power reference is convex, so systolic minus
  // passive is concave and nonnegative endpoint values bound the interval.
  if (!(upperVolumeMl >= lowerVolumeMl)) return false;
  const volumes = [
    lowerVolumeMl,
    ...referenceBreakpointsMl.filter(
      (volumeMl) => volumeMl > lowerVolumeMl && volumeMl < upperVolumeMl,
    ),
    upperVolumeMl,
  ];
  for (const volumeMl of volumes) {
    const passive = referencePressure(volumeMl);
    const difference =
      relation.slopeMmHgPerMl * volumeMl +
      relation.interceptMmHg -
      (passive ?? Number.NaN);
    if (!Number.isFinite(difference) || difference < -1e-9) return false;
  }
  return true;
}

function assertSemanticRowBindingV3(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): void {
  if (pva.pvaRows.length !== comparison.rows.length) {
    throw new Error("PVA V3 inputs have different row counts");
  }
  const comparisonRows = new Map(
    comparison.rows.map((row) => [rowKeyV3(row), row]),
  );
  const relations = new Map(
    pva.systolicRelations.map((outcome) => [
      relationKeyV3(outcome.ventricleId, outcome.directionId, outcome.methodId),
      outcome,
    ]),
  );
  if (comparisonRows.size !== comparison.rows.length) {
    throw new Error("PVA V3 comparison rows are duplicated");
  }
  for (const row of pva.pvaRows) {
    const retained = comparisonRows.get(rowKeyV3(row));
    if (retained === undefined || retained.status !== row.status) {
      throw new Error(`PVA V3 row status mismatch at ${rowKeyV3(row)}`);
    }
    if (row.status === "available" && retained.status === "available") {
      const relation = relations.get(
        relationKeyV3(row.ventricleId, row.directionId, row.systolicMethodId),
      );
      if (
        relation?.status !== "available" ||
        retained.systolicEndpointVolumeMl !== row.systolicEndpoint.volumeMl ||
        retained.systolicEndpointPressureMmHg !==
          row.systolicEndpoint.pressureMmHg ||
        retained.systolicVolumeAxisInterceptMl !==
          relation.relation.volumeAxisInterceptMl ||
        retained.externalWorkJ !==
          row.externalWorkMmHgMl * MMHG_ML_TO_JOULE_V1 ||
        retained.dynamicMaximumVolumePvaJ !== row.pressureVolumeAreaJ
      ) {
        throw new Error(`PVA V3 numerical row mismatch at ${rowKeyV3(row)}`);
      }
    }
  }
}

function dynamicPressureV3(
  reference: Readonly<{
    alphaMmHgPerMlPower: number;
    volumeOffsetMl: number;
    beta: number;
  }>,
  volumeMl: number,
): number {
  return (
    reference.alphaMmHgPerMlPower *
    Math.max(0, volumeMl - reference.volumeOffsetMl) ** reference.beta
  );
}

function intrinsicPressureV3(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  volumeMl: number,
): number | null {
  if (
    volumeMl < slice.modelMinimumVolumeMl ||
    volumeMl > slice.maximumSampledVolumeMl
  ) {
    return null;
  }
  if (volumeMl <= slice.zeroPressureVolumeMl) return 0;
  for (let index = 1; index < slice.points.length; index += 1) {
    const left = slice.points[index - 1]!;
    const right = slice.points[index]!;
    if (volumeMl > right.volumeMl) continue;
    const fraction =
      (volumeMl - left.volumeMl) / (right.volumeMl - left.volumeMl);
    return Math.max(
      0,
      left.intrinsicPressureMmHg +
        fraction * (right.intrinsicPressureMmHg - left.intrinsicPressureMmHg),
    );
  }
  return null;
}

function rowKeyV3(
  row: Readonly<{
    ventricleId: string;
    beatOrdinal: number;
    directionId: string;
    systolicMethodId: string;
  }>,
): string {
  return `${row.ventricleId}:${row.beatOrdinal}:${row.directionId}:${row.systolicMethodId}`;
}

function relationKeyV3(
  ventricleId: string,
  directionId: string,
  methodId: string,
): string {
  return `${ventricleId}:${directionId}:${methodId}`;
}

function directionKeyV3(ventricleId: string, directionId: string): string {
  return `${ventricleId}:${directionId}`;
}

function countV3<T>(values: readonly T[], selected: T): number {
  return values.filter((value) => value === selected).length;
}

function requireFiniteNumericLeavesV3(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  for (const child of Object.values(value)) {
    requireFiniteNumericLeavesV3(child, label);
  }
}
