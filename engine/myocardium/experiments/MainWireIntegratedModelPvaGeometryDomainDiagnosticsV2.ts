import {
  MMHG_ML_TO_JOULE_V1,
  type MainWireIntegratedModelMethodSpecificPvaResearchV1,
  type MainWireIntegratedModelPvaDiastolicReferenceV1,
  type MainWireIntegratedModelPvaLinearRelationV1,
  type MainWireIntegratedModelPvaSystolicMethodV1,
  type MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import type {
  MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
  MainWireIntrinsicPassiveCenterSliceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V2_ID =
  "main-wire-integrated-model-pva-geometry-domain-diagnostics-v2" as const;

const REFERENCE_IDS_V2 = Object.freeze([
  "dynamic-maximum-volume",
  "intrinsic-passive-center-slice",
] as const);

export type MainWireIntegratedModelPvaReferenceIdV2 =
  (typeof REFERENCE_IDS_V2)[number];

export type MainWireIntegratedModelPvaGeometryClassificationV2 =
  | "domain-supported-pva"
  | "transient-pva-like-area"
  | "out-of-domain"
  | "method-unavailable";

type AvailablePvaRowV1 = Extract<
  MainWireIntegratedModelMethodSpecificPvaResearchV1["pvaRows"][number],
  { status: "available" }
>;

type AvailableSystolicRelationV1 = Extract<
  MainWireIntegratedModelMethodSpecificPvaResearchV1["systolicRelations"][number],
  { status: "available" }
>;

type AvailableDiastolicReferenceV1 = Extract<
  MainWireIntegratedModelMethodSpecificPvaResearchV1["diastolicReferences"][number],
  { status: "available" }
>;

type AvailableComparisonRowV1 = Extract<
  MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"][number],
  { status: "available" }
>;

export type MainWireIntegratedModelPvaReferenceAssessmentV2 = Readonly<{
  referenceId: MainWireIntegratedModelPvaReferenceIdV2;
  classification: MainWireIntegratedModelPvaGeometryClassificationV2;
  endpointDomainStatus:
    | "inside-supported-domain"
    | "below-supported-domain"
    | "above-supported-domain";
  supportedVolumeRangeMl: readonly [number, number];
  observedDomainAreaStrip: Readonly<{
    lowerVolumeMl: number;
    upperVolumeMl: number;
    signedSystolicMinusPassiveAreaJ: number;
  }> | null;
  supportedIntersectionVolumeMl: number | null;
  supportedPotentialEnergyJ: number | null;
  sourcePotentialEnergyJ: number;
  sourcePvaJ: number;
  reasons: readonly string[];
}>;

export type MainWireIntegratedModelPvaGeometryRowV2 =
  | Readonly<{
      status: "method-unavailable";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: "occlusion" | "release";
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      reason: string;
      dynamicReferenceClassification: "method-unavailable";
      intrinsicReferenceClassification: "method-unavailable";
    }>
  | Readonly<{
      status: "diagnosed";
      ventricleId: MainWireIntegratedModelPvaVentricleV1;
      beatOrdinal: number;
      directionId: "occlusion" | "release";
      systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
      systolicEndpoint: Readonly<{
        volumeMl: number;
        observedPressureMmHg: number;
        fittedPressureMmHg: number;
        fittedMinusObservedPressureMmHg: number;
      }>;
      systolicGeometry: Readonly<{
        volumeAxisInterceptMl: number;
        measuredVolumeRangeMl: readonly [number, number];
        endpointInsideMeasuredVolumeRange: boolean;
        sourceIntegrationLowerVolumeMl: number;
        lineAreaMmHgMl: number;
        lineAreaInsideMeasuredVolumeRangeMmHgMl: number;
        lineAreaOutsideMeasuredVolumeRangeMmHgMl: number;
        lineAreaOutsideMeasuredVolumeRangeFraction: number;
        volumeAxisInterceptDistanceBelowMeasuredRangeMl: number;
      }>;
      dynamicMaximumVolume: MainWireIntegratedModelPvaReferenceAssessmentV2;
      intrinsicPassiveCenterSlice: MainWireIntegratedModelPvaReferenceAssessmentV2;
    }>;

export type MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2 = Readonly<{
  studyId: typeof MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V2_ID;
  status: "completed";
  scope: "research-only-pva-geometry-and-domain-diagnostics";
  source: Readonly<{
    methodSpecificPvaStudyId: string;
    diastolicReferenceComparisonStudyId: string;
  }>;
  pressureBasis: "ventricular-transmural";
  workRule: "accepted-open-path-and-synthetic-straight-closure-reported-separately";
  domainRule: "no-passive-extrapolation-below-model-minimum-or-above-sampled-maximum";
  intersectionRule: "first-upward-intersection-inside-common-supported-domain";
  beatWorkDiagnostics: readonly Readonly<{
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    beatOrdinal: number;
    acceptedOpenPathJ: number;
    syntheticStraightClosureJ: number;
    closedPolygonJ: number;
    syntheticClosureAbsoluteFractionOfAcceptedOpenPath: number | null;
    endpointClosureDeltaVolumeMl: number;
    endpointClosureDeltaPressureMmHg: number;
    exactlyClosedByRetainedEndpoints: boolean;
  }>[];
  systolicRelationDiagnostics: readonly Readonly<{
    status: "available" | "unavailable";
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    directionId: "occlusion" | "release";
    systolicMethodId: MainWireIntegratedModelPvaSystolicMethodV1;
    pointCount: number;
    reason: string | null;
    slopeMmHgPerMl: number | null;
    volumeAxisInterceptMl: number | null;
    reportedMeasuredVolumeRangeMl: readonly [number, number] | null;
    landmarkContactVolumeRangeMl: readonly [number, number] | null;
    reportedRangeMatchesLandmarkContactRange: boolean | null;
    minimumFittedMinusObservedPressureMmHg: number | null;
    maximumFittedMinusObservedPressureMmHg: number | null;
    medianAbsoluteFittedPressureResidualMmHg: number | null;
    slopeSearchBoundary:
      "not-grid-searched" | "lower-bound" | "upper-bound" | "interior" | null;
  }>[];
  dynamicReferenceDiagnostics: readonly Readonly<{
    status: "available" | "unavailable";
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    directionId: "occlusion" | "release";
    reason: string | null;
    measuredVolumeRangeMl: readonly [number, number] | null;
    beta: number | null;
    volumeOffsetMl: number | null;
    betaSearchBoundary: "lower-bound" | "upper-bound" | "interior" | null;
    offsetSearchBoundary: "lower-bound" | "upper-bound" | "interior" | null;
    fitInteriorToDeclaredSearchGrid: boolean;
  }>[];
  rows: readonly MainWireIntegratedModelPvaGeometryRowV2[];
  summary: Readonly<{
    attemptedRowCount: number;
    sourceAvailableRowCount: number;
    sourceUnavailableRowCount: number;
    byReference: readonly Readonly<{
      referenceId: MainWireIntegratedModelPvaReferenceIdV2;
      domainSupportedPvaRowCount: number;
      transientPvaLikeAreaRowCount: number;
      outOfDomainRowCount: number;
      methodUnavailableRowCount: number;
      observedDomainAreaStripRowCount: number;
      supportedIntersectionRowCount: number;
    }>[];
    uniqueBeatWorkCount: number;
    exactlyClosedBeatWorkCount: number;
    syntheticClosureFraction: Readonly<{
      minimum: number | null;
      median: number | null;
      maximum: number | null;
      aboveOnePercentCount: number;
      aboveFivePercentCount: number;
    }>;
    systolicLineOutsideMeasuredRangeFraction: Readonly<{
      minimum: number | null;
      median: number | null;
      maximum: number | null;
      aboveHalfCount: number;
      aboveThreeQuartersCount: number;
    }>;
    intrinsicEndpointBelowModelMinimumCount: number;
    intrinsicEndpointAboveSampledMaximumCount: number;
    dynamicFitBoundaryCount: number;
  }>;
  interpretation: Readonly<{
    existingAbsolutePvaReadyForProductDisplay: false;
    genericPvaEstablished: false;
    closedPeriodicLoopEstablishedForTransientRows: false;
    domainSupportedSystolicPassiveIntersectionEstablishedForEveryRow: false;
    clinicalPvaEstablished: false;
    oxygenConsumptionEstablished: false;
  }>;
}>;

export function diagnoseMainWireIntegratedModelPvaGeometryDomainsV2(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2 {
  assertSourceInputsV2(pva, comparison);

  const beatWorkDiagnostics = beatWorkDiagnosticsV2(pva);
  const workByKey = new Map(
    beatWorkDiagnostics.map((work) => [
      beatKeyV2(work.ventricleId, work.beatOrdinal),
      work,
    ]),
  );
  const relationByKey = new Map(
    pva.systolicRelations.map((outcome) => [
      relationKeyV2(outcome.ventricleId, outcome.directionId, outcome.methodId),
      outcome,
    ]),
  );
  const dynamicByKey = new Map(
    pva.diastolicReferences.map((outcome) => [
      directionKeyV2(outcome.ventricleId, outcome.directionId),
      outcome,
    ]),
  );
  const comparisonByKey = uniqueRowMapV2(comparison.rows);
  const sliceByVentricle = new Map(
    comparison.intrinsicSlices.map((slice) => [slice.ventricleId, slice]),
  );

  const systolicRelationDiagnostics = Object.freeze(
    pva.systolicRelations.map(systolicRelationDiagnosticV2),
  );
  const dynamicReferenceDiagnostics = Object.freeze(
    pva.diastolicReferences.map(dynamicReferenceDiagnosticV2),
  );
  const dynamicDiagnosticByKey = new Map(
    dynamicReferenceDiagnostics.map((diagnostic) => [
      directionKeyV2(diagnostic.ventricleId, diagnostic.directionId),
      diagnostic,
    ]),
  );

  const rows = Object.freeze(
    pva.pvaRows.map((sourceRow): MainWireIntegratedModelPvaGeometryRowV2 => {
      if (sourceRow.status === "unavailable") {
        return Object.freeze({
          status: "method-unavailable" as const,
          ventricleId: sourceRow.ventricleId,
          beatOrdinal: sourceRow.beatOrdinal,
          directionId: sourceRow.directionId,
          systolicMethodId: sourceRow.systolicMethodId,
          reason: sourceRow.reason,
          dynamicReferenceClassification: "method-unavailable" as const,
          intrinsicReferenceClassification: "method-unavailable" as const,
        });
      }
      const key = rowKeyV2(sourceRow);
      const relationOutcome = relationByKey.get(
        relationKeyV2(
          sourceRow.ventricleId,
          sourceRow.directionId,
          sourceRow.systolicMethodId,
        ),
      );
      const dynamicOutcome = dynamicByKey.get(
        directionKeyV2(sourceRow.ventricleId, sourceRow.directionId),
      );
      const comparisonRow = comparisonByKey.get(key);
      const slice = sliceByVentricle.get(sourceRow.ventricleId);
      const work = workByKey.get(
        beatKeyV2(sourceRow.ventricleId, sourceRow.beatOrdinal),
      );
      const dynamicFit = dynamicDiagnosticByKey.get(
        directionKeyV2(sourceRow.ventricleId, sourceRow.directionId),
      );
      if (
        relationOutcome?.status !== "available" ||
        dynamicOutcome?.status !== "available" ||
        comparisonRow === undefined ||
        work === undefined ||
        dynamicFit === undefined
      ) {
        throw new Error(
          `available source row ${key} has missing retained inputs`,
        );
      }
      const measuredVolumeRangeMl = contactVolumeRangeV2(relationOutcome);
      const fittedPressureMmHg = linePressureV2(
        relationOutcome.relation,
        sourceRow.systolicEndpoint.volumeMl,
      );
      const systolicGeometry = systolicGeometryV2(
        relationOutcome.relation,
        measuredVolumeRangeMl,
        sourceRow.systolicDiastolicIntersectionVolumeMl,
        sourceRow.systolicEndpoint.volumeMl,
      );
      const dynamicMaximumVolume = assessDynamicReferenceV2(
        sourceRow,
        relationOutcome.relation,
        measuredVolumeRangeMl,
        dynamicOutcome.reference,
        dynamicFit.fitInteriorToDeclaredSearchGrid,
        work.exactlyClosedByRetainedEndpoints,
        systolicGeometry.lineAreaOutsideMeasuredVolumeRangeFraction,
      );
      const intrinsicPassiveCenterSlice = assessIntrinsicReferenceV2(
        sourceRow,
        comparisonRow,
        relationOutcome.relation,
        measuredVolumeRangeMl,
        slice,
        work.exactlyClosedByRetainedEndpoints,
        systolicGeometry.lineAreaOutsideMeasuredVolumeRangeFraction,
      );
      return Object.freeze({
        status: "diagnosed" as const,
        ventricleId: sourceRow.ventricleId,
        beatOrdinal: sourceRow.beatOrdinal,
        directionId: sourceRow.directionId,
        systolicMethodId: sourceRow.systolicMethodId,
        systolicEndpoint: Object.freeze({
          volumeMl: sourceRow.systolicEndpoint.volumeMl,
          observedPressureMmHg: sourceRow.systolicEndpoint.pressureMmHg,
          fittedPressureMmHg,
          fittedMinusObservedPressureMmHg:
            fittedPressureMmHg - sourceRow.systolicEndpoint.pressureMmHg,
        }),
        systolicGeometry,
        dynamicMaximumVolume,
        intrinsicPassiveCenterSlice,
      });
    }),
  );

  const diagnosedRows = rows.filter(
    (
      row,
    ): row is Extract<
      MainWireIntegratedModelPvaGeometryRowV2,
      { status: "diagnosed" }
    > => row.status === "diagnosed",
  );
  const closureFractions = beatWorkDiagnostics.flatMap((work) =>
    work.syntheticClosureAbsoluteFractionOfAcceptedOpenPath === null
      ? []
      : [work.syntheticClosureAbsoluteFractionOfAcceptedOpenPath],
  );
  const extrapolatedFractions = diagnosedRows.map(
    (row) => row.systolicGeometry.lineAreaOutsideMeasuredVolumeRangeFraction,
  );
  const result = Object.freeze({
    studyId: MAIN_WIRE_INTEGRATED_MODEL_PVA_GEOMETRY_DOMAIN_DIAGNOSTICS_V2_ID,
    status: "completed" as const,
    scope: "research-only-pva-geometry-and-domain-diagnostics" as const,
    source: Object.freeze({
      methodSpecificPvaStudyId: pva.studyId,
      diastolicReferenceComparisonStudyId: comparison.studyId,
    }),
    pressureBasis: "ventricular-transmural" as const,
    workRule:
      "accepted-open-path-and-synthetic-straight-closure-reported-separately" as const,
    domainRule:
      "no-passive-extrapolation-below-model-minimum-or-above-sampled-maximum" as const,
    intersectionRule:
      "first-upward-intersection-inside-common-supported-domain" as const,
    beatWorkDiagnostics,
    systolicRelationDiagnostics,
    dynamicReferenceDiagnostics,
    rows,
    summary: Object.freeze({
      attemptedRowCount: rows.length,
      sourceAvailableRowCount: diagnosedRows.length,
      sourceUnavailableRowCount: rows.length - diagnosedRows.length,
      byReference: Object.freeze(
        REFERENCE_IDS_V2.map((referenceId) => {
          const classifications = rows.map((row) =>
            row.status === "method-unavailable"
              ? "method-unavailable"
              : referenceId === "dynamic-maximum-volume"
                ? row.dynamicMaximumVolume.classification
                : row.intrinsicPassiveCenterSlice.classification,
          );
          return Object.freeze({
            referenceId,
            domainSupportedPvaRowCount: countV2(
              classifications,
              "domain-supported-pva",
            ),
            transientPvaLikeAreaRowCount: countV2(
              classifications,
              "transient-pva-like-area",
            ),
            outOfDomainRowCount: countV2(classifications, "out-of-domain"),
            methodUnavailableRowCount: countV2(
              classifications,
              "method-unavailable",
            ),
            observedDomainAreaStripRowCount: rows.filter(
              (row) =>
                row.status === "diagnosed" &&
                (referenceId === "dynamic-maximum-volume"
                  ? row.dynamicMaximumVolume.observedDomainAreaStrip !== null
                  : row.intrinsicPassiveCenterSlice.observedDomainAreaStrip !==
                    null),
            ).length,
            supportedIntersectionRowCount: rows.filter(
              (row) =>
                row.status === "diagnosed" &&
                (referenceId === "dynamic-maximum-volume"
                  ? row.dynamicMaximumVolume.supportedIntersectionVolumeMl !==
                    null
                  : row.intrinsicPassiveCenterSlice
                      .supportedIntersectionVolumeMl !== null),
            ).length,
          });
        }),
      ),
      uniqueBeatWorkCount: beatWorkDiagnostics.length,
      exactlyClosedBeatWorkCount: beatWorkDiagnostics.filter(
        ({ exactlyClosedByRetainedEndpoints }) =>
          exactlyClosedByRetainedEndpoints,
      ).length,
      syntheticClosureFraction: Object.freeze({
        minimum: minimumOrNullV2(closureFractions),
        median: medianOrNullV2(closureFractions),
        maximum: maximumOrNullV2(closureFractions),
        aboveOnePercentCount: closureFractions.filter((value) => value > 0.01)
          .length,
        aboveFivePercentCount: closureFractions.filter((value) => value > 0.05)
          .length,
      }),
      systolicLineOutsideMeasuredRangeFraction: Object.freeze({
        minimum: minimumOrNullV2(extrapolatedFractions),
        median: medianOrNullV2(extrapolatedFractions),
        maximum: maximumOrNullV2(extrapolatedFractions),
        aboveHalfCount: extrapolatedFractions.filter((value) => value > 0.5)
          .length,
        aboveThreeQuartersCount: extrapolatedFractions.filter(
          (value) => value > 0.75,
        ).length,
      }),
      intrinsicEndpointBelowModelMinimumCount: diagnosedRows.filter(
        (row) =>
          row.intrinsicPassiveCenterSlice.endpointDomainStatus ===
          "below-supported-domain",
      ).length,
      intrinsicEndpointAboveSampledMaximumCount: diagnosedRows.filter(
        (row) =>
          row.intrinsicPassiveCenterSlice.endpointDomainStatus ===
          "above-supported-domain",
      ).length,
      dynamicFitBoundaryCount: dynamicReferenceDiagnostics.filter(
        (diagnostic) =>
          diagnostic.status === "available" &&
          !diagnostic.fitInteriorToDeclaredSearchGrid,
      ).length,
    }),
    interpretation: Object.freeze({
      existingAbsolutePvaReadyForProductDisplay: false as const,
      genericPvaEstablished: false as const,
      closedPeriodicLoopEstablishedForTransientRows: false as const,
      domainSupportedSystolicPassiveIntersectionEstablishedForEveryRow:
        false as const,
      clinicalPvaEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
    }),
  });
  requireFiniteNumericLeavesV2(result, "PVA geometry/domain diagnostics");
  return result;
}

export function decomposeMainWireIntegratedModelSystolicLineAreaV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  measuredVolumeRangeMl: readonly [number, number],
  lowerVolumeMl: number,
  upperVolumeMl: number,
): Readonly<{
  totalAreaMmHgMl: number;
  insideMeasuredAreaMmHgMl: number;
  outsideMeasuredAreaMmHgMl: number;
  outsideMeasuredAreaFraction: number;
}> {
  if (!(upperVolumeMl > lowerVolumeMl))
    throw new RangeError("systolic line area requires an increasing interval");
  const totalAreaMmHgMl = lineIntegralV2(
    relation,
    lowerVolumeMl,
    upperVolumeMl,
  );
  const insideLower = Math.max(lowerVolumeMl, measuredVolumeRangeMl[0]);
  const insideUpper = Math.min(upperVolumeMl, measuredVolumeRangeMl[1]);
  const insideMeasuredAreaMmHgMl =
    insideUpper > insideLower
      ? lineIntegralV2(relation, insideLower, insideUpper)
      : 0;
  const outsideMeasuredAreaMmHgMl = totalAreaMmHgMl - insideMeasuredAreaMmHgMl;
  if (
    !Number.isFinite(totalAreaMmHgMl) ||
    !(totalAreaMmHgMl > 0) ||
    !Number.isFinite(outsideMeasuredAreaMmHgMl) ||
    outsideMeasuredAreaMmHgMl < -1e-10
  ) {
    throw new Error("systolic line area decomposition is invalid");
  }
  return Object.freeze({
    totalAreaMmHgMl,
    insideMeasuredAreaMmHgMl,
    outsideMeasuredAreaMmHgMl: Math.max(0, outsideMeasuredAreaMmHgMl),
    outsideMeasuredAreaFraction: Math.max(
      0,
      outsideMeasuredAreaMmHgMl / totalAreaMmHgMl,
    ),
  });
}

export function findMainWireIntegratedModelSupportedIntersectionV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  supportedVolumeRangeMl: readonly [number, number],
  endpointVolumeMl: number,
  referencePressureMmHg: (volumeMl: number) => number | null,
): number | null {
  const lower = supportedVolumeRangeMl[0];
  const upper = Math.min(supportedVolumeRangeMl[1], endpointVolumeMl);
  if (!(upper > lower)) return null;
  const difference = (volumeMl: number): number | null => {
    const reference = referencePressureMmHg(volumeMl);
    return reference === null
      ? null
      : linePressureV2(relation, volumeMl) - reference;
  };
  let left = lower;
  let leftValue = difference(left);
  if (leftValue === null || !Number.isFinite(leftValue)) return null;
  for (let index = 1; index <= 1024; index += 1) {
    const right = lower + (index / 1024) * (upper - lower);
    const rightValue = difference(right);
    if (rightValue === null || !Number.isFinite(rightValue)) return null;
    if (leftValue <= 0 && rightValue >= 0) {
      if (leftValue === 0) return left;
      let lo = left;
      let hi = right;
      for (let iteration = 0; iteration < 80; iteration += 1) {
        const mid = (lo + hi) / 2;
        const midValue = difference(mid);
        if (midValue === null || !Number.isFinite(midValue)) return null;
        if (midValue >= 0) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    }
    left = right;
    leftValue = rightValue;
  }
  return null;
}

function assessDynamicReferenceV2(
  sourceRow: AvailablePvaRowV1,
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  measuredVolumeRangeMl: readonly [number, number],
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  fitInterior: boolean,
  exactlyClosed: boolean,
  extrapolatedFraction: number,
): MainWireIntegratedModelPvaReferenceAssessmentV2 {
  const endpointDomainStatus = endpointDomainStatusV2(
    sourceRow.systolicEndpoint.volumeMl,
    reference.measuredVolumeRangeMl,
  );
  const commonRange = intersectRangesV2(
    measuredVolumeRangeMl,
    reference.measuredVolumeRangeMl,
  );
  const supportedIntersectionVolumeMl =
    commonRange === null
      ? null
      : findMainWireIntegratedModelSupportedIntersectionV2(
          relation,
          commonRange,
          sourceRow.systolicEndpoint.volumeMl,
          (volumeMl) => dynamicPressureV2(reference, volumeMl),
        );
  const observedDomainAreaStrip = dynamicObservedDomainAreaStripV2(
    relation,
    reference,
    commonRange,
    sourceRow.systolicEndpoint.volumeMl,
  );
  const supportedPotentialEnergyMmHgMl =
    supportedIntersectionVolumeMl === null ||
    endpointDomainStatus !== "inside-supported-domain" ||
    sourceRow.systolicEndpoint.volumeMl > measuredVolumeRangeMl[1]
      ? null
      : dynamicPotentialEnergyV2(
          relation,
          reference,
          supportedIntersectionVolumeMl,
          sourceRow.systolicEndpoint.volumeMl,
        );
  const reasons = referenceReasonsV2({
    endpointDomainStatus,
    supportedIntersectionVolumeMl,
    exactlyClosed,
    extrapolatedFraction,
    fitInterior,
  });
  return Object.freeze({
    referenceId: "dynamic-maximum-volume" as const,
    classification: classificationV2(
      endpointDomainStatus,
      reasons,
      supportedPotentialEnergyMmHgMl,
    ),
    endpointDomainStatus,
    supportedVolumeRangeMl: reference.measuredVolumeRangeMl,
    observedDomainAreaStrip,
    supportedIntersectionVolumeMl,
    supportedPotentialEnergyJ:
      supportedPotentialEnergyMmHgMl === null
        ? null
        : supportedPotentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
    sourcePotentialEnergyJ:
      sourceRow.potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
    sourcePvaJ: sourceRow.pressureVolumeAreaJ,
    reasons,
  });
}

function assessIntrinsicReferenceV2(
  sourceRow: AvailablePvaRowV1,
  comparisonRow: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"][number],
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  measuredVolumeRangeMl: readonly [number, number],
  slice:
    | MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["intrinsicSlices"][number]
    | undefined,
  exactlyClosed: boolean,
  extrapolatedFraction: number,
): MainWireIntegratedModelPvaReferenceAssessmentV2 {
  if (slice?.status !== "available") {
    throw new Error(
      `intrinsic slice is unavailable for ${sourceRow.ventricleId}`,
    );
  }
  const supportedVolumeRangeMl = Object.freeze([
    slice.modelMinimumVolumeMl,
    slice.maximumSampledVolumeMl,
  ] as const);
  const endpointDomainStatus = endpointDomainStatusV2(
    sourceRow.systolicEndpoint.volumeMl,
    supportedVolumeRangeMl,
  );
  const commonRange = intersectRangesV2(
    measuredVolumeRangeMl,
    supportedVolumeRangeMl,
  );
  const supportedIntersectionVolumeMl =
    commonRange === null
      ? null
      : findMainWireIntegratedModelSupportedIntersectionV2(
          relation,
          commonRange,
          sourceRow.systolicEndpoint.volumeMl,
          (volumeMl) => intrinsicPressureV2(slice, volumeMl),
        );
  const observedDomainAreaStrip = intrinsicObservedDomainAreaStripV2(
    relation,
    slice,
    commonRange,
    sourceRow.systolicEndpoint.volumeMl,
  );
  const supportedPotentialEnergyMmHgMl =
    supportedIntersectionVolumeMl === null ||
    endpointDomainStatus !== "inside-supported-domain" ||
    sourceRow.systolicEndpoint.volumeMl > measuredVolumeRangeMl[1]
      ? null
      : intrinsicPotentialEnergyV2(
          relation,
          slice,
          supportedIntersectionVolumeMl,
          sourceRow.systolicEndpoint.volumeMl,
        );
  const comparisonAvailable =
    comparisonRow.status === "available" ? comparisonRow : null;
  const reasons = referenceReasonsV2({
    endpointDomainStatus,
    supportedIntersectionVolumeMl,
    exactlyClosed,
    extrapolatedFraction,
    fitInterior: true,
  });
  if (comparisonAvailable === null) {
    reasons.push("retained intrinsic comparison row is unavailable");
  }
  return Object.freeze({
    referenceId: "intrinsic-passive-center-slice" as const,
    classification: classificationV2(
      endpointDomainStatus,
      reasons,
      supportedPotentialEnergyMmHgMl,
    ),
    endpointDomainStatus,
    supportedVolumeRangeMl,
    observedDomainAreaStrip,
    supportedIntersectionVolumeMl,
    supportedPotentialEnergyJ:
      supportedPotentialEnergyMmHgMl === null
        ? null
        : supportedPotentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
    sourcePotentialEnergyJ:
      comparisonAvailable?.intrinsicPassivePotentialEnergyJ ??
      sourceRow.potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
    sourcePvaJ:
      comparisonAvailable?.intrinsicPassivePvaJ ??
      sourceRow.pressureVolumeAreaJ,
    reasons: Object.freeze(reasons),
  });
}

function referenceReasonsV2(
  input: Readonly<{
    endpointDomainStatus: MainWireIntegratedModelPvaReferenceAssessmentV2["endpointDomainStatus"];
    supportedIntersectionVolumeMl: number | null;
    exactlyClosed: boolean;
    extrapolatedFraction: number;
    fitInterior: boolean;
  }>,
): string[] {
  const reasons: string[] = [];
  if (input.endpointDomainStatus !== "inside-supported-domain")
    reasons.push(`systolic endpoint is ${input.endpointDomainStatus}`);
  if (input.supportedIntersectionVolumeMl === null)
    reasons.push(
      "no systolic-passive intersection exists in the common supported domain",
    );
  if (!input.exactlyClosed)
    reasons.push(
      "retained transient path requires a synthetic straight closure segment",
    );
  if (input.extrapolatedFraction > 0)
    reasons.push(
      "systolic line area extends outside its landmark volume range",
    );
  if (!input.fitInterior)
    reasons.push(
      "dynamic reference fit touches a declared search-grid boundary",
    );
  return reasons;
}

function classificationV2(
  endpointDomainStatus: MainWireIntegratedModelPvaReferenceAssessmentV2["endpointDomainStatus"],
  reasons: readonly string[],
  supportedPotentialEnergyMmHgMl: number | null,
): MainWireIntegratedModelPvaGeometryClassificationV2 {
  if (endpointDomainStatus !== "inside-supported-domain")
    return "out-of-domain";
  return reasons.length === 0 && supportedPotentialEnergyMmHgMl !== null
    ? "domain-supported-pva"
    : "transient-pva-like-area";
}

function systolicGeometryV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  measuredVolumeRangeMl: readonly [number, number],
  lowerVolumeMl: number,
  endpointVolumeMl: number,
): Extract<
  MainWireIntegratedModelPvaGeometryRowV2,
  { status: "diagnosed" }
>["systolicGeometry"] {
  const area = decomposeMainWireIntegratedModelSystolicLineAreaV2(
    relation,
    measuredVolumeRangeMl,
    lowerVolumeMl,
    endpointVolumeMl,
  );
  return Object.freeze({
    volumeAxisInterceptMl: relation.volumeAxisInterceptMl,
    measuredVolumeRangeMl,
    endpointInsideMeasuredVolumeRange:
      endpointVolumeMl >= measuredVolumeRangeMl[0] &&
      endpointVolumeMl <= measuredVolumeRangeMl[1],
    sourceIntegrationLowerVolumeMl: lowerVolumeMl,
    lineAreaMmHgMl: area.totalAreaMmHgMl,
    lineAreaInsideMeasuredVolumeRangeMmHgMl: area.insideMeasuredAreaMmHgMl,
    lineAreaOutsideMeasuredVolumeRangeMmHgMl: area.outsideMeasuredAreaMmHgMl,
    lineAreaOutsideMeasuredVolumeRangeFraction:
      area.outsideMeasuredAreaFraction,
    volumeAxisInterceptDistanceBelowMeasuredRangeMl: Math.max(
      0,
      measuredVolumeRangeMl[0] - relation.volumeAxisInterceptMl,
    ),
  });
}

function beatWorkDiagnosticsV2(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2["beatWorkDiagnostics"] {
  return Object.freeze(
    pva.beatSummary.flatMap((beat) =>
      (["LV", "RV"] as const).map((ventricleId) => {
        const ventricle = beat[ventricleId];
        const acceptedOpenPathJ =
          ventricle.externalWork.acceptedOpenPathMmHgMl * MMHG_ML_TO_JOULE_V1;
        const syntheticStraightClosureJ =
          ventricle.externalWork.straightClosureSegmentMmHgMl *
          MMHG_ML_TO_JOULE_V1;
        return Object.freeze({
          ventricleId,
          beatOrdinal: beat.beatOrdinal,
          acceptedOpenPathJ,
          syntheticStraightClosureJ,
          closedPolygonJ:
            ventricle.externalWork.closedLoopMmHgMl * MMHG_ML_TO_JOULE_V1,
          syntheticClosureAbsoluteFractionOfAcceptedOpenPath:
            acceptedOpenPathJ === 0
              ? null
              : Math.abs(syntheticStraightClosureJ) /
                Math.abs(acceptedOpenPathJ),
          endpointClosureDeltaVolumeMl: ventricle.endpointClosure.deltaVolumeMl,
          endpointClosureDeltaPressureMmHg:
            ventricle.endpointClosure.deltaPressureMmHg,
          exactlyClosedByRetainedEndpoints:
            ventricle.endpointClosure.deltaVolumeMl === 0 &&
            ventricle.endpointClosure.deltaPressureMmHg === 0 &&
            syntheticStraightClosureJ === 0,
        });
      }),
    ),
  );
}

function systolicRelationDiagnosticV2(
  outcome: MainWireIntegratedModelMethodSpecificPvaResearchV1["systolicRelations"][number],
): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2["systolicRelationDiagnostics"][number] {
  if (outcome.status === "unavailable") {
    return Object.freeze({
      status: "unavailable" as const,
      ventricleId: outcome.ventricleId,
      directionId: outcome.directionId,
      systolicMethodId: outcome.methodId,
      pointCount: outcome.pointCount,
      reason: outcome.reason,
      slopeMmHgPerMl: null,
      volumeAxisInterceptMl: null,
      reportedMeasuredVolumeRangeMl: null,
      landmarkContactVolumeRangeMl: null,
      reportedRangeMatchesLandmarkContactRange: null,
      minimumFittedMinusObservedPressureMmHg: null,
      maximumFittedMinusObservedPressureMmHg: null,
      medianAbsoluteFittedPressureResidualMmHg: null,
      slopeSearchBoundary: null,
    });
  }
  const contactRange = contactVolumeRangeV2(outcome);
  const residuals = outcome.points.map(
    (point) =>
      linePressureV2(outcome.relation, point.volumeMl) - point.pressureMmHg,
  );
  return Object.freeze({
    status: "available" as const,
    ventricleId: outcome.ventricleId,
    directionId: outcome.directionId,
    systolicMethodId: outcome.methodId,
    pointCount: outcome.pointCount,
    reason: null,
    slopeMmHgPerMl: outcome.relation.slopeMmHgPerMl,
    volumeAxisInterceptMl: outcome.relation.volumeAxisInterceptMl,
    reportedMeasuredVolumeRangeMl: outcome.relation.measuredVolumeRangeMl,
    landmarkContactVolumeRangeMl: contactRange,
    reportedRangeMatchesLandmarkContactRange:
      outcome.relation.measuredVolumeRangeMl[0] === contactRange[0] &&
      outcome.relation.measuredVolumeRangeMl[1] === contactRange[1],
    minimumFittedMinusObservedPressureMmHg: Math.min(...residuals),
    maximumFittedMinusObservedPressureMmHg: Math.max(...residuals),
    medianAbsoluteFittedPressureResidualMmHg: medianOrNullV2(
      residuals.map(Math.abs),
    ),
    slopeSearchBoundary:
      outcome.methodId !== "sampled-common-support-envelope"
        ? ("not-grid-searched" as const)
        : outcome.relation.slopeMmHgPerMl === 0.05
          ? ("lower-bound" as const)
          : outcome.relation.slopeMmHgPerMl === 12
            ? ("upper-bound" as const)
            : ("interior" as const),
  });
}

function dynamicReferenceDiagnosticV2(
  outcome: MainWireIntegratedModelMethodSpecificPvaResearchV1["diastolicReferences"][number],
): MainWireIntegratedModelPvaGeometryDomainDiagnosticsV2["dynamicReferenceDiagnostics"][number] {
  if (outcome.status === "unavailable") {
    return Object.freeze({
      status: "unavailable" as const,
      ventricleId: outcome.ventricleId,
      directionId: outcome.directionId,
      reason: outcome.reason,
      measuredVolumeRangeMl: null,
      beta: null,
      volumeOffsetMl: null,
      betaSearchBoundary: null,
      offsetSearchBoundary: null,
      fitInteriorToDeclaredSearchGrid: false,
    });
  }
  const positive = outcome.points.filter(
    ({ pressureMmHg }) => pressureMmHg > 0.05,
  );
  const volumes = positive.map(({ volumeMl }) => volumeMl);
  const minimum = Math.min(...volumes);
  const maximum = Math.max(...volumes);
  const span = maximum - minimum;
  const upperOffsetBoundary = minimum - span * 0.05;
  const lowerOffsetBoundary = minimum - span * 1.5;
  const betaSearchBoundary =
    outcome.reference.beta === 1.5
      ? ("lower-bound" as const)
      : outcome.reference.beta === 4.5
        ? ("upper-bound" as const)
        : ("interior" as const);
  const offsetSearchBoundary =
    outcome.reference.volumeOffsetMl === lowerOffsetBoundary
      ? ("lower-bound" as const)
      : outcome.reference.volumeOffsetMl === upperOffsetBoundary
        ? ("upper-bound" as const)
        : ("interior" as const);
  return Object.freeze({
    status: "available" as const,
    ventricleId: outcome.ventricleId,
    directionId: outcome.directionId,
    reason: null,
    measuredVolumeRangeMl: outcome.reference.measuredVolumeRangeMl,
    beta: outcome.reference.beta,
    volumeOffsetMl: outcome.reference.volumeOffsetMl,
    betaSearchBoundary,
    offsetSearchBoundary,
    fitInteriorToDeclaredSearchGrid:
      betaSearchBoundary === "interior" && offsetSearchBoundary === "interior",
  });
}

function intrinsicPressureV2(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  volumeMl: number,
): number | null {
  if (
    volumeMl < slice.modelMinimumVolumeMl ||
    volumeMl > slice.maximumSampledVolumeMl
  )
    return null;
  if (volumeMl <= slice.zeroPressureVolumeMl) return 0;
  const knots = intrinsicKnotsV2(slice);
  for (let index = 1; index < knots.length; index += 1) {
    const left = knots[index - 1]!;
    const right = knots[index]!;
    if (volumeMl > right.volumeMl) continue;
    const fraction =
      (volumeMl - left.volumeMl) / (right.volumeMl - left.volumeMl);
    return (
      left.pressureMmHg + fraction * (right.pressureMmHg - left.pressureMmHg)
    );
  }
  return null;
}

function intrinsicPotentialEnergyV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number | null {
  const line = lineIntegralV2(relation, lowerVolumeMl, upperVolumeMl);
  const passive = intrinsicIntegralV2(slice, lowerVolumeMl, upperVolumeMl);
  const value = passive === null ? null : line - passive;
  return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
}

function intrinsicIntegralV2(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number | null {
  if (
    lowerVolumeMl < slice.modelMinimumVolumeMl ||
    upperVolumeMl > slice.maximumSampledVolumeMl ||
    !(upperVolumeMl >= lowerVolumeMl)
  )
    return null;
  const boundaries = [
    lowerVolumeMl,
    ...intrinsicKnotsV2(slice)
      .map(({ volumeMl }) => volumeMl)
      .filter(
        (volumeMl) => volumeMl > lowerVolumeMl && volumeMl < upperVolumeMl,
      ),
    upperVolumeMl,
  ];
  let integral = 0;
  for (let index = 1; index < boundaries.length; index += 1) {
    const left = boundaries[index - 1]!;
    const right = boundaries[index]!;
    const leftPressure = intrinsicPressureV2(slice, left);
    const rightPressure = intrinsicPressureV2(slice, right);
    if (leftPressure === null || rightPressure === null) return null;
    integral += 0.5 * (leftPressure + rightPressure) * (right - left);
  }
  return integral;
}

function intrinsicKnotsV2(
  slice: MainWireIntrinsicPassiveCenterSliceV1,
): readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[] {
  return Object.freeze([
    Object.freeze({
      volumeMl: slice.modelMinimumVolumeMl,
      pressureMmHg: 0,
    }),
    Object.freeze({ volumeMl: slice.zeroPressureVolumeMl, pressureMmHg: 0 }),
    ...slice.points.flatMap((point) =>
      point.volumeMl > slice.zeroPressureVolumeMl &&
      point.intrinsicPressureMmHg > 0
        ? [
            Object.freeze({
              volumeMl: point.volumeMl,
              pressureMmHg: point.intrinsicPressureMmHg,
            }),
          ]
        : [],
    ),
  ]);
}

function dynamicPressureV2(
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  volumeMl: number,
): number {
  return (
    reference.alphaMmHgPerMlPower *
    Math.max(0, volumeMl - reference.volumeOffsetMl) ** reference.beta
  );
}

function dynamicPotentialEnergyV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number | null {
  const value = dynamicSignedDifferenceAreaV2(
    relation,
    reference,
    lowerVolumeMl,
    upperVolumeMl,
  );
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function dynamicSignedDifferenceAreaV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number {
  const systolic = lineIntegralV2(relation, lowerVolumeMl, upperVolumeMl);
  const power = (volumeMl: number) =>
    Math.max(0, volumeMl - reference.volumeOffsetMl) ** (reference.beta + 1);
  const passive =
    (reference.alphaMmHgPerMlPower / (reference.beta + 1)) *
    (power(upperVolumeMl) - power(lowerVolumeMl));
  return systolic - passive;
}

function dynamicObservedDomainAreaStripV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  reference: MainWireIntegratedModelPvaDiastolicReferenceV1,
  commonRange: readonly [number, number] | null,
  endpointVolumeMl: number,
): MainWireIntegratedModelPvaReferenceAssessmentV2["observedDomainAreaStrip"] {
  if (commonRange === null) return null;
  const upperVolumeMl = Math.min(commonRange[1], endpointVolumeMl);
  if (!(upperVolumeMl > commonRange[0])) return null;
  const signedArea = dynamicSignedDifferenceAreaV2(
    relation,
    reference,
    commonRange[0],
    upperVolumeMl,
  );
  return Number.isFinite(signedArea)
    ? Object.freeze({
        lowerVolumeMl: commonRange[0],
        upperVolumeMl,
        signedSystolicMinusPassiveAreaJ: signedArea * MMHG_ML_TO_JOULE_V1,
      })
    : null;
}

function intrinsicObservedDomainAreaStripV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  commonRange: readonly [number, number] | null,
  endpointVolumeMl: number,
): MainWireIntegratedModelPvaReferenceAssessmentV2["observedDomainAreaStrip"] {
  if (commonRange === null) return null;
  const upperVolumeMl = Math.min(commonRange[1], endpointVolumeMl);
  if (!(upperVolumeMl > commonRange[0])) return null;
  const passive = intrinsicIntegralV2(slice, commonRange[0], upperVolumeMl);
  if (passive === null) return null;
  const signedArea =
    lineIntegralV2(relation, commonRange[0], upperVolumeMl) - passive;
  return Number.isFinite(signedArea)
    ? Object.freeze({
        lowerVolumeMl: commonRange[0],
        upperVolumeMl,
        signedSystolicMinusPassiveAreaJ: signedArea * MMHG_ML_TO_JOULE_V1,
      })
    : null;
}

function endpointDomainStatusV2(
  endpointVolumeMl: number,
  supportedVolumeRangeMl: readonly [number, number],
): MainWireIntegratedModelPvaReferenceAssessmentV2["endpointDomainStatus"] {
  if (endpointVolumeMl < supportedVolumeRangeMl[0])
    return "below-supported-domain";
  if (endpointVolumeMl > supportedVolumeRangeMl[1])
    return "above-supported-domain";
  return "inside-supported-domain";
}

function intersectRangesV2(
  left: readonly [number, number],
  right: readonly [number, number],
): readonly [number, number] | null {
  const lower = Math.max(left[0], right[0]);
  const upper = Math.min(left[1], right[1]);
  return upper > lower ? Object.freeze([lower, upper] as const) : null;
}

function contactVolumeRangeV2(
  outcome: AvailableSystolicRelationV1,
): readonly [number, number] {
  const volumes = outcome.points.map(({ volumeMl }) => volumeMl);
  return Object.freeze([Math.min(...volumes), Math.max(...volumes)] as const);
}

function linePressureV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  volumeMl: number,
): number {
  return relation.slopeMmHgPerMl * volumeMl + relation.interceptMmHg;
}

function lineIntegralV2(
  relation: MainWireIntegratedModelPvaLinearRelationV1,
  lowerVolumeMl: number,
  upperVolumeMl: number,
): number {
  return (
    0.5 * relation.slopeMmHgPerMl * (upperVolumeMl ** 2 - lowerVolumeMl ** 2) +
    relation.interceptMmHg * (upperVolumeMl - lowerVolumeMl)
  );
}

function uniqueRowMapV2(
  rows: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"],
): ReadonlyMap<
  string,
  MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"][number]
> {
  const map = new Map<
    string,
    MainWireIntegratedModelPvaDiastolicReferenceComparisonV1["rows"][number]
  >();
  for (const row of rows) {
    const key = rowKeyV2(row);
    if (map.has(key)) throw new Error(`duplicate comparison row ${key}`);
    map.set(key, row);
  }
  return map;
}

function assertSourceInputsV2(
  pva: MainWireIntegratedModelMethodSpecificPvaResearchV1,
  comparison: MainWireIntegratedModelPvaDiastolicReferenceComparisonV1,
): void {
  if (
    pva.studyId !==
      "main-wire-integrated-model-method-specific-pva-research-v1" ||
    pva.status !== "completed" ||
    comparison.studyId !==
      "main-wire-integrated-model-pva-diastolic-reference-comparison-v1" ||
    comparison.status !== "completed"
  ) {
    throw new Error(
      "PVA V2 diagnostics require the completed V1 research inputs",
    );
  }
  if (
    pva.pressureBasis !== "ventricular-transmural" ||
    comparison.pressureBasis !== pva.pressureBasis
  ) {
    throw new Error(
      "PVA V2 diagnostics require one ventricular-transmural basis",
    );
  }
  if (
    pva.pvaRows.length !== comparison.rows.length ||
    pva.beatSummary.length !== 21
  ) {
    throw new Error("PVA V2 source shapes are incomplete");
  }
}

function rowKeyV2(
  row: Readonly<{
    ventricleId: string;
    beatOrdinal: number;
    directionId: string;
    systolicMethodId: string;
  }>,
): string {
  return `${row.ventricleId}:${row.beatOrdinal}:${row.directionId}:${row.systolicMethodId}`;
}

function relationKeyV2(
  ventricleId: string,
  directionId: string,
  methodId: string,
): string {
  return `${ventricleId}:${directionId}:${methodId}`;
}

function directionKeyV2(ventricleId: string, directionId: string): string {
  return `${ventricleId}:${directionId}`;
}

function beatKeyV2(ventricleId: string, beatOrdinal: number): string {
  return `${ventricleId}:${beatOrdinal}`;
}

function countV2<T>(values: readonly T[], selected: T): number {
  return values.filter((value) => value === selected).length;
}

function minimumOrNullV2(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.min(...values);
}

function maximumOrNullV2(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.max(...values);
}

function medianOrNullV2(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : 0.5 * (sorted[middle - 1]! + sorted[middle]!);
}

function requireFiniteNumericLeavesV2(value: unknown, label: string): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) requireFiniteNumericLeavesV2(item, label);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value))
      requireFiniteNumericLeavesV2(item, label);
  }
}
