/**
 * Pure analysis for release-bound hemodynamic protocols.
 *
 * Two experiment classes are deliberately kept separate:
 *
 * 1. A total-blood-volume (TBV) family is a one-dimensional, closed-loop
 *    preload operating locus. It is not a pump-clamped Guyton venous-return
 *    experiment and it is not an intrinsic ESPVR/EDPVR measurement.
 * 2. LV pressure-volume relations are estimated only from a fixed-TBV,
 *    multi-beat, IVC-like preload-reduction protocol with frozen controls.
 *
 * Period-2 observations retain their two branches. They are never averaged
 * into a pseudo-steady observation and never enter a fit.
 */

export const MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_V1_ID =
  "main-wire-scientific-hemodynamic-analysis-v1" as const;

export type MainWireScientificHemodynamicProtocolKindV1 =
  | "tbv-preload-operating-locus"
  | "fixed-tbv-ivc-like-preload-reduction";

export type MainWireScientificHemodynamicPointRoleV1 =
  | "baseline"
  | "preload-reduction"
  | "recovery"
  | "operating-locus";

export type MainWireScientificLvEventStatusV1 =
  | "complete"
  | "missing-end-diastolic-event"
  | "missing-end-systolic-event"
  | "ambiguous-valve-event"
  | "non-ejecting-beat";

export type MainWireScientificLvPressureVolumeBeatV1 = Readonly<{
  endDiastolicVolumeMl: number;
  endDiastolicTransmuralPressureMmHg: number;
  endSystolicVolumeMl: number;
  endSystolicTransmuralPressureMmHg: number;
  strokeWorkMmHgMl: number;
}>;

export type MainWireScientificHemodynamicMeasurementV1 = Readonly<{
  meanRightAtrialTransmuralPressureMmHg: number;
  meanLeftAtrialTransmuralPressureMmHg: number;
  cardiacOutputLPerMin: number;
  lvPressureVolume: MainWireScientificLvPressureVolumeBeatV1 | null;
  quality: Readonly<{
    lvEventStatus: MainWireScientificLvEventStatusV1;
    totalBloodVolumeAbsoluteErrorMl: number;
    maximumContinuityAbsoluteResidualMl: number;
  }>;
}>;

export type MainWireScientificPeriod2BranchV1 = Readonly<{
  branchId: "strong" | "weak";
  measurement: MainWireScientificHemodynamicMeasurementV1;
}>;

type MainWireScientificHemodynamicOperatingPointCommonV1 = Readonly<{
  pointId: string;
  protocolKind: MainWireScientificHemodynamicProtocolKindV1;
  role: MainWireScientificHemodynamicPointRoleV1;
  totalBloodVolumeMl: number;
}>;

export type MainWireScientificP1OperatingPointV1 =
  MainWireScientificHemodynamicOperatingPointCommonV1 & Readonly<{
    periodicity: "P1";
    measurement: MainWireScientificHemodynamicMeasurementV1;
  }>;

/**
 * A point from a continuously changing loading limb. It is eligible for a
 * relation fit, but it is not a demonstrated period-1 orbit: the intervention
 * changes between successive beats, so a periodicity claim is not available.
 */
export type MainWireScientificTransientFitEligibleOperatingPointV1 =
  MainWireScientificHemodynamicOperatingPointCommonV1 & Readonly<{
    periodicity: "transient-fit-eligible";
    measurement: MainWireScientificHemodynamicMeasurementV1;
  }>;

export type MainWireScientificP2OperatingPointV1 =
  MainWireScientificHemodynamicOperatingPointCommonV1 & Readonly<{
    periodicity: "P2";
    branches: readonly [
      MainWireScientificPeriod2BranchV1,
      MainWireScientificPeriod2BranchV1,
    ];
  }>;

export type MainWireScientificFailedOperatingPointV1 =
  MainWireScientificHemodynamicOperatingPointCommonV1 & Readonly<{
    periodicity: "failure";
    failureReason: string;
  }>;

export type MainWireScientificHemodynamicOperatingPointV1 =
  | MainWireScientificP1OperatingPointV1
  | MainWireScientificTransientFitEligibleOperatingPointV1
  | MainWireScientificP2OperatingPointV1
  | MainWireScientificFailedOperatingPointV1;

export type MainWireScientificPreloadOperatingLocusV1 = Readonly<{
  analysisId: typeof MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_V1_ID;
  physiologyLabel: "closed-loop-TBV-preload-operating-locus";
  claimBoundary: Readonly<{
    independentVariable: "total-blood-volume";
    dimensionality: "one-dimensional-locus";
    isPumpClampedGuytonVenousReturnCurve: false;
    isTwoDimensionalSurface: false;
    isIntrinsicEspvrOrEdpvr: false;
  }>;
  p1Points: readonly Readonly<{
    pointId: string;
    totalBloodVolumeMl: number;
    meanRightAtrialTransmuralPressureMmHg: number;
    meanLeftAtrialTransmuralPressureMmHg: number;
    cardiacOutputLPerMin: number;
  }>[];
  period2Points: readonly Readonly<{
    pointId: string;
    totalBloodVolumeMl: number;
    branches: readonly [
      MainWireScientificPeriod2BranchV1,
      MainWireScientificPeriod2BranchV1,
    ];
    fitPolicy: "excluded-never-averaged";
  }>[];
  failedPoints: readonly Readonly<{
    pointId: string;
    totalBloodVolumeMl: number;
    reason: string;
  }>[];
  incompatiblePointIds: readonly string[];
}>;

export type MainWireScientificHemodynamicQcIssueCodeV1 =
  | "protocol-kind-mismatch"
  | "transient-classification-mismatch"
  | "baseline-fit-eligible-missing"
  | "period-2-excluded-never-averaged"
  | "period-2-detected-protocol-rejected"
  | "alternans-suspect-excluded"
  | "alternans-suspect-detected-protocol-rejected"
  | "source-periodicity-gate-excluded"
  | "solver-failure-excluded"
  | "solver-failure-detected-protocol-rejected"
  | "recovery-point-not-used-for-fit"
  | "lv-pressure-volume-sample-missing"
  | "lv-event-invalid"
  | "non-finite-measurement"
  | "total-blood-volume-error-above-threshold"
  | "continuity-residual-above-threshold"
  | "non-ejecting-beat"
  | "fixed-tbv-span-above-threshold"
  | "insufficient-fit-eligible-points"
  | "insufficient-edv-span"
  | "insufficient-end-systolic-pressure-span"
  | "espvr-fit-failed"
  | "espvr-slope-not-positive"
  | "espvr-adjusted-r2-below-threshold"
  | "espvr-rmse-above-threshold"
  | "espvr-leave-one-out-slope-instability"
  | "espvr-nonlinearity-detected"
  | "edpvr-fit-failed"
  | "edpvr-reference-volume-not-below-data"
  | "edpvr-parameter-not-positive"
  | "edpvr-pressure-span-below-threshold"
  | "edpvr-adjusted-r2-below-threshold"
  | "edpvr-rmse-above-threshold"
  | "prsw-fit-failed"
  | "prsw-slope-not-positive"
  | "prsw-adjusted-r2-below-threshold"
  | "prsw-rmse-above-threshold"
  | "prsw-leave-one-out-slope-instability";

export type MainWireScientificHemodynamicQcIssueV1 = Readonly<{
  code: MainWireScientificHemodynamicQcIssueCodeV1;
  message: string;
  pointIds: readonly string[];
}>;

export type MainWireScientificHemodynamicAnalysisThresholdsV1 = Readonly<{
  maximumTotalBloodVolumeAbsoluteErrorMl: number;
  maximumContinuityAbsoluteResidualMl: number;
  maximumFixedTotalBloodVolumeSpanMl: number;
  minimumStrokeVolumeMl: number;
  minimumEspvrPointCount: number;
  minimumEdpvrPointCount: number;
  minimumPrswPointCount: number;
  minimumPrimaryEdvSpanFractionOfBaseline: number;
  minimumAlternateEdvSpanFractionOfBaseline: number;
  minimumAlternateEndSystolicPressureSpanMmHg: number;
  minimumEspvrAdjustedR2: number;
  maximumEspvrRmseMmHg: number;
  maximumEspvrLeaveOneOutSlopeRelativeDeviation: number;
  quadraticRmseImprovementFlagFraction: number;
  quadraticLocalSlopeVariationFlagFraction: number;
  minimumEdpvrPressureSpanMmHg: number;
  minimumEdpvrAdjustedR2: number;
  maximumEdpvrRmseMmHg: number;
  minimumPrswAdjustedR2: number;
  maximumPrswRmseFractionOfStrokeWorkSpan: number;
  maximumPrswLeaveOneOutSlopeRelativeDeviation: number;
}>;

export const MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_THRESHOLDS_V1 =
  Object.freeze({
    maximumTotalBloodVolumeAbsoluteErrorMl: 1e-4,
    maximumContinuityAbsoluteResidualMl: 1e-5,
    maximumFixedTotalBloodVolumeSpanMl: 0.01,
    minimumStrokeVolumeMl: 1,
    minimumEspvrPointCount: 6,
    minimumEdpvrPointCount: 5,
    minimumPrswPointCount: 5,
    minimumPrimaryEdvSpanFractionOfBaseline: 0.15,
    minimumAlternateEdvSpanFractionOfBaseline: 0.10,
    minimumAlternateEndSystolicPressureSpanMmHg: 20,
    minimumEspvrAdjustedR2: 0.98,
    maximumEspvrRmseMmHg: 5,
    maximumEspvrLeaveOneOutSlopeRelativeDeviation: 0.10,
    quadraticRmseImprovementFlagFraction: 0.20,
    quadraticLocalSlopeVariationFlagFraction: 0.15,
    minimumEdpvrPressureSpanMmHg: 5,
    minimumEdpvrAdjustedR2: 0.95,
    maximumEdpvrRmseMmHg: 1,
    minimumPrswAdjustedR2: 0.95,
    maximumPrswRmseFractionOfStrokeWorkSpan: 0.10,
    maximumPrswLeaveOneOutSlopeRelativeDeviation: 0.15,
  }) satisfies MainWireScientificHemodynamicAnalysisThresholdsV1;

export type MainWireScientificLinearRegressionV1 = Readonly<{
  slope: number;
  intercept: number;
  r2: number;
  adjustedR2: number;
  rmse: number;
  residuals: readonly number[];
}>;

export type MainWireScientificLinearEspvrFitV1 = Readonly<{
  relation: "Pes_tm=Ees*(Ves-V0)";
  endSystolicElastanceMmHgPerMl: number;
  volumeAxisInterceptMl: number;
  pressureInterceptMmHg: number;
  diagnostics: MainWireScientificLinearRegressionV1;
  leaveOneOutSlopeMaximumRelativeDeviation: number;
}>;

export type MainWireScientificQuadraticEspvrSensitivityV1 = Readonly<{
  relation: "Pes_tm=a*Ves^2+b*Ves+c";
  quadraticCoefficientMmHgPerMl2: number;
  linearCoefficientMmHgPerMl: number;
  interceptMmHg: number;
  diagnostics: MainWireScientificLinearRegressionV1;
  rmseImprovementFractionOverLinear: number;
  localSlopeVariationFraction: number;
  nonlinear: boolean;
  flagCriteria: Readonly<{
    rmseImprovementAtLeast: number;
    localSlopeVariationAtLeast: number;
    operator: "or";
  }>;
}>;

export type MainWireScientificExponentialEdpvrFitV1 = Readonly<{
  relation: "Ped_tm=P0+alpha*(exp(beta*(Ved-Vref))-1)";
  referenceVolumeMl: number;
  referencePressureMmHg: number;
  alphaMmHg: number;
  betaPerMl: number;
  tangentStiffnessAtBaselineMmHgPerMl: number;
  diagnostics: MainWireScientificLinearRegressionV1;
}>;

export type MainWireScientificPrswFitV1 = Readonly<{
  relation: "SW=Mw*(Ved-Vw)";
  preloadRecruitableStrokeWorkSlopeMmHg: number;
  volumeAxisInterceptMl: number;
  strokeWorkInterceptMmHgMl: number;
  diagnostics: MainWireScientificLinearRegressionV1;
  leaveOneOutSlopeMaximumRelativeDeviation: number;
}>;

export type MainWireScientificFitAssessmentV1<T> = Readonly<{
  status: "accepted" | "rejected";
  fit: T | null;
  pointIds: readonly string[];
  rejectReasons: readonly MainWireScientificHemodynamicQcIssueV1[];
}>;

export type MainWireScientificLvPressureVolumeAnalysisV1 = Readonly<{
  analysisId: typeof MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_V1_ID;
  protocolKind: "fixed-tbv-ivc-like-preload-reduction";
  physiologyBoundary: Readonly<{
    pressures: "transmural";
    espvr: "multi-beat-fixed-context-end-systolic-relation-not-material-law";
    edpvr: "multi-beat-end-diastolic-envelope-not-fully-relaxed-passive-material-law";
    prsw: "fixed-context-preload-recruitable-stroke-work-relation";
    tbvFamilyMaySubstituteForThisProtocol: false;
    period2AveragingPermitted: false;
  }>;
  thresholds: MainWireScientificHemodynamicAnalysisThresholdsV1;
  includedFitEligiblePointIds: readonly string[];
  exclusions: readonly MainWireScientificHemodynamicQcIssueV1[];
  espvr: MainWireScientificFitAssessmentV1<MainWireScientificLinearEspvrFitV1>;
  quadraticEspvrSensitivity: MainWireScientificQuadraticEspvrSensitivityV1 | null;
  edpvr: MainWireScientificFitAssessmentV1<MainWireScientificExponentialEdpvrFitV1>;
  prsw: MainWireScientificFitAssessmentV1<MainWireScientificPrswFitV1>;
  overallStatus: "accepted" | "rejected";
}>;

export type MainWireScientificEdpvrReferenceV1 = Readonly<{
  referenceVolumeMl: number;
  referencePressureMmHg: number;
}>;

export function buildMainWireScientificPreloadOperatingLocusV1(
  points: readonly MainWireScientificHemodynamicOperatingPointV1[],
): MainWireScientificPreloadOperatingLocusV1 {
  const p1Points: MainWireScientificPreloadOperatingLocusV1["p1Points"][number][] = [];
  const period2Points: MainWireScientificPreloadOperatingLocusV1["period2Points"][number][] = [];
  const failedPoints: MainWireScientificPreloadOperatingLocusV1["failedPoints"][number][] = [];
  const incompatiblePointIds: string[] = [];

  for (const point of points) {
    if (point.protocolKind !== "tbv-preload-operating-locus") {
      incompatiblePointIds.push(point.pointId);
      continue;
    }
    if (point.periodicity === "P1") {
      p1Points.push(Object.freeze({
        pointId: point.pointId,
        totalBloodVolumeMl: point.totalBloodVolumeMl,
        meanRightAtrialTransmuralPressureMmHg:
          point.measurement.meanRightAtrialTransmuralPressureMmHg,
        meanLeftAtrialTransmuralPressureMmHg:
          point.measurement.meanLeftAtrialTransmuralPressureMmHg,
        cardiacOutputLPerMin: point.measurement.cardiacOutputLPerMin,
      }));
    } else if (point.periodicity === "P2") {
      period2Points.push(Object.freeze({
        pointId: point.pointId,
        totalBloodVolumeMl: point.totalBloodVolumeMl,
        branches: point.branches,
        fitPolicy: "excluded-never-averaged" as const,
      }));
    } else if (point.periodicity === "failure") {
      failedPoints.push(Object.freeze({
        pointId: point.pointId,
        totalBloodVolumeMl: point.totalBloodVolumeMl,
        reason: point.failureReason,
      }));
    } else {
      incompatiblePointIds.push(point.pointId);
    }
  }

  return Object.freeze({
    analysisId: MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_V1_ID,
    physiologyLabel: "closed-loop-TBV-preload-operating-locus",
    claimBoundary: Object.freeze({
      independentVariable: "total-blood-volume",
      dimensionality: "one-dimensional-locus",
      isPumpClampedGuytonVenousReturnCurve: false,
      isTwoDimensionalSurface: false,
      isIntrinsicEspvrOrEdpvr: false,
    }),
    p1Points: Object.freeze(p1Points),
    period2Points: Object.freeze(period2Points),
    failedPoints: Object.freeze(failedPoints),
    incompatiblePointIds: Object.freeze(incompatiblePointIds),
  });
}

export function analyzeMainWireScientificLvPressureVolumeProtocolV1(input: Readonly<{
  points: readonly MainWireScientificHemodynamicOperatingPointV1[];
  edpvrReference: MainWireScientificEdpvrReferenceV1;
  thresholds?: Partial<MainWireScientificHemodynamicAnalysisThresholdsV1>;
}>): MainWireScientificLvPressureVolumeAnalysisV1 {
  const thresholds = Object.freeze({
    ...MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_THRESHOLDS_V1,
    ...(input.thresholds ?? {}),
  });
  const exclusions: MainWireScientificHemodynamicQcIssueV1[] = [];
  const globalRejectReasons: MainWireScientificHemodynamicQcIssueV1[] = [];
  const valid: Array<Readonly<{
    point: MainWireScientificTransientFitEligibleOperatingPointV1;
    pv: MainWireScientificLvPressureVolumeBeatV1;
  }>> = [];
  let period2Detected = false;
  let alternansSuspectDetected = false;
  let failureDetected = false;

  for (const point of input.points) {
    if (point.protocolKind !== "fixed-tbv-ivc-like-preload-reduction") {
      exclusions.push(issue(
        "protocol-kind-mismatch",
        "Only fixed-TBV IVC-like preload-reduction points may enter ESPVR, EDPVR, or PRSW analysis.",
        [point.pointId],
      ));
      continue;
    }
    if (point.periodicity === "P2") {
      period2Detected = true;
      exclusions.push(issue(
        "period-2-excluded-never-averaged",
        "The strong and weak P2 branches are retained as raw evidence but are excluded and never averaged into a fit.",
        [point.pointId],
      ));
      continue;
    }
    if (point.periodicity === "failure") {
      if (point.failureReason.startsWith(
        "source baseline did not reproduce period-1 closure",
      )) {
        exclusions.push(issue(
          "source-periodicity-gate-excluded",
          `The source baseline failed its periodicity reproduction gate and was excluded: ${point.failureReason}`,
          [point.pointId],
        ));
      } else if (point.failureReason.includes("alternans-suspect")) {
        alternansSuspectDetected = true;
        exclusions.push(issue(
          "alternans-suspect-excluded",
          `The changing-load beat showed alternans-suspect evidence and was conservatively excluded: ${point.failureReason}`,
          [point.pointId],
        ));
      } else {
        failureDetected = true;
        exclusions.push(issue(
          "solver-failure-excluded",
          `The operating point failed and was excluded: ${point.failureReason}`,
          [point.pointId],
        ));
      }
      continue;
    }
    if (point.periodicity !== "transient-fit-eligible") {
      exclusions.push(issue(
        "transient-classification-mismatch",
        "A continuously changing loading limb must be explicitly classified as transient-fit-eligible; it cannot be relabelled as a demonstrated periodic orbit.",
        [point.pointId],
      ));
      continue;
    }
    if (point.role === "recovery") {
      exclusions.push(issue(
        "recovery-point-not-used-for-fit",
        "Recovery observations are protocol-recovery evidence and do not enter the loading-limb fits.",
        [point.pointId],
      ));
      continue;
    }

    const measurement = point.measurement;
    if (!finiteMeasurement(measurement, point.totalBloodVolumeMl)) {
      exclusions.push(issue(
        "non-finite-measurement",
        "One or more required hemodynamic values are non-finite.",
        [point.pointId],
      ));
      continue;
    }
    if (measurement.lvPressureVolume === null) {
      exclusions.push(issue(
        "lv-pressure-volume-sample-missing",
        "End-diastolic, end-systolic, and stroke-work measurements are required.",
        [point.pointId],
      ));
      continue;
    }
    if (measurement.quality.lvEventStatus !== "complete") {
      const code = measurement.quality.lvEventStatus === "non-ejecting-beat"
        ? "non-ejecting-beat"
        : "lv-event-invalid";
      exclusions.push(issue(
        code,
        `Valve-event extraction is not valid: ${measurement.quality.lvEventStatus}.`,
        [point.pointId],
      ));
      continue;
    }
    if (
      measurement.quality.totalBloodVolumeAbsoluteErrorMl
        > thresholds.maximumTotalBloodVolumeAbsoluteErrorMl
    ) {
      exclusions.push(issue(
        "total-blood-volume-error-above-threshold",
        `Absolute TBV error exceeds ${thresholds.maximumTotalBloodVolumeAbsoluteErrorMl} mL.`,
        [point.pointId],
      ));
      continue;
    }
    if (
      measurement.quality.maximumContinuityAbsoluteResidualMl
        > thresholds.maximumContinuityAbsoluteResidualMl
    ) {
      exclusions.push(issue(
        "continuity-residual-above-threshold",
        `Continuity residual exceeds ${thresholds.maximumContinuityAbsoluteResidualMl} mL.`,
        [point.pointId],
      ));
      continue;
    }
    if (
      measurement.lvPressureVolume.endDiastolicVolumeMl
        - measurement.lvPressureVolume.endSystolicVolumeMl
        < thresholds.minimumStrokeVolumeMl
      || measurement.lvPressureVolume.strokeWorkMmHgMl <= 0
    ) {
      exclusions.push(issue(
        "non-ejecting-beat",
        "The beat does not have positive ejection and positive transmural stroke work.",
        [point.pointId],
      ));
      continue;
    }
    valid.push(Object.freeze({ point, pv: measurement.lvPressureVolume }));
  }

  if (period2Detected) {
    globalRejectReasons.push(issue(
      "period-2-detected-protocol-rejected",
      "P2 occurred during the loading protocol; P1-only exploratory fits may be shown, but the protocol fit is rejected.",
      input.points.filter((point) => point.periodicity === "P2").map((point) => point.pointId),
    ));
  }
  if (alternansSuspectDetected) {
    globalRejectReasons.push(issue(
      "alternans-suspect-detected-protocol-rejected",
      "Alternating residuals occurred while load was changing. This is not a period-2 diagnosis, but the affected beats and all relation claims are conservatively rejected.",
      input.points.filter((point) =>
        point.periodicity === "failure"
        && point.failureReason.includes("alternans-suspect")).map((point) => point.pointId),
    ));
  }
  if (failureDetected) {
    globalRejectReasons.push(issue(
      "solver-failure-detected-protocol-rejected",
      "At least one requested loading point failed; the protocol fit is incomplete and is rejected.",
      input.points.filter((point) => point.periodicity === "failure").map((point) => point.pointId),
    ));
  }

  const baseline = valid.find(({ point }) => point.role === "baseline");
  if (baseline === undefined) {
    globalRejectReasons.push(issue(
      "baseline-fit-eligible-missing",
      "A valid, source-periodicity-gated transient baseline is required before preload reduction.",
      input.points.filter((point) => point.role === "baseline").map((point) => point.pointId),
    ));
  }

  const fixedTbvSpan = span(valid.map(({ point }) => point.totalBloodVolumeMl));
  if (fixedTbvSpan > thresholds.maximumFixedTotalBloodVolumeSpanMl) {
    globalRejectReasons.push(issue(
      "fixed-tbv-span-above-threshold",
      `TBV span ${fixedTbvSpan} mL exceeds the fixed-TBV limit ${thresholds.maximumFixedTotalBloodVolumeSpanMl} mL.`,
      valid.map(({ point }) => point.pointId),
    ));
  }

  const pointIds = Object.freeze(valid.map(({ point }) => point.pointId));
  const espvrPoints = valid.map(({ point, pv }) => ({
    pointId: point.pointId,
    x: pv.endSystolicVolumeMl,
    y: pv.endSystolicTransmuralPressureMmHg,
  }));
  const edpvrPoints = valid.map(({ point, pv }) => ({
    pointId: point.pointId,
    x: pv.endDiastolicVolumeMl,
    y: pv.endDiastolicTransmuralPressureMmHg,
  }));
  const prswPoints = valid.map(({ point, pv }) => ({
    pointId: point.pointId,
    x: pv.endDiastolicVolumeMl,
    y: pv.strokeWorkMmHgMl,
  }));

  const espvrFit = fitLinearEspvr(espvrPoints);
  const quadratic = espvrFit === null
    ? null
    : fitQuadraticEspvrSensitivity(espvrPoints, espvrFit, thresholds);
  const espvrReasons = [...globalRejectReasons];
  if (valid.length < thresholds.minimumEspvrPointCount) {
    espvrReasons.push(issue(
      "insufficient-fit-eligible-points",
      `ESPVR requires at least ${thresholds.minimumEspvrPointCount} fit-eligible transient points; received ${valid.length}.`,
      pointIds,
    ));
  }
  addLoadingSpanIssues(espvrReasons, valid, baseline, thresholds);
  if (espvrFit === null) {
    espvrReasons.push(issue(
      "espvr-fit-failed",
      "A finite free-intercept linear ESPVR could not be estimated.",
      pointIds,
    ));
  } else {
    if (espvrFit.endSystolicElastanceMmHgPerMl <= 0) {
      espvrReasons.push(issue(
        "espvr-slope-not-positive",
        "End-systolic elastance must be positive.",
        pointIds,
      ));
    }
    if (espvrFit.diagnostics.adjustedR2 < thresholds.minimumEspvrAdjustedR2) {
      espvrReasons.push(issue(
        "espvr-adjusted-r2-below-threshold",
        `ESPVR adjusted R2 is below ${thresholds.minimumEspvrAdjustedR2}.`,
        pointIds,
      ));
    }
    if (espvrFit.diagnostics.rmse > thresholds.maximumEspvrRmseMmHg) {
      espvrReasons.push(issue(
        "espvr-rmse-above-threshold",
        `ESPVR RMSE exceeds ${thresholds.maximumEspvrRmseMmHg} mmHg.`,
        pointIds,
      ));
    }
    if (
      espvrFit.leaveOneOutSlopeMaximumRelativeDeviation
        > thresholds.maximumEspvrLeaveOneOutSlopeRelativeDeviation
    ) {
      espvrReasons.push(issue(
        "espvr-leave-one-out-slope-instability",
        `Leave-one-out Ees deviation exceeds ${thresholds.maximumEspvrLeaveOneOutSlopeRelativeDeviation}.`,
        pointIds,
      ));
    }
    if (quadratic?.nonlinear === true) {
      espvrReasons.push(issue(
        "espvr-nonlinearity-detected",
        "Quadratic sensitivity indicates that a single linear ESPVR is not adequate over this loading range.",
        pointIds,
      ));
    }
  }

  const edpvrFit = fitExponentialEdpvr(edpvrPoints, input.edpvrReference, baseline?.point.pointId ?? null);
  const edpvrReasons = [...globalRejectReasons];
  if (valid.length < thresholds.minimumEdpvrPointCount) {
    edpvrReasons.push(issue(
      "insufficient-fit-eligible-points",
      `EDPVR requires at least ${thresholds.minimumEdpvrPointCount} fit-eligible transient points; received ${valid.length}.`,
      pointIds,
    ));
  }
  if (
    edpvrPoints.length > 0
    && input.edpvrReference.referenceVolumeMl >= Math.min(...edpvrPoints.map(({ x }) => x))
  ) {
    edpvrReasons.push(issue(
      "edpvr-reference-volume-not-below-data",
      "The fixed zero/reference-pressure volume must be below all analyzed end-diastolic volumes.",
      pointIds,
    ));
  }
  const edPressureSpan = span(edpvrPoints.map(({ y }) => y));
  if (edPressureSpan < thresholds.minimumEdpvrPressureSpanMmHg) {
    edpvrReasons.push(issue(
      "edpvr-pressure-span-below-threshold",
      `End-diastolic pressure span is below ${thresholds.minimumEdpvrPressureSpanMmHg} mmHg.`,
      pointIds,
    ));
  }
  if (edpvrFit === null) {
    edpvrReasons.push(issue(
      "edpvr-fit-failed",
      "A positive-parameter exponential EDPVR could not be estimated for the fixed Vref/P0.",
      pointIds,
    ));
  } else {
    if (edpvrFit.alphaMmHg <= 0 || edpvrFit.betaPerMl <= 0) {
      edpvrReasons.push(issue(
        "edpvr-parameter-not-positive",
        "EDPVR alpha and beta must both be positive.",
        pointIds,
      ));
    }
    if (edpvrFit.diagnostics.adjustedR2 < thresholds.minimumEdpvrAdjustedR2) {
      edpvrReasons.push(issue(
        "edpvr-adjusted-r2-below-threshold",
        `EDPVR adjusted R2 is below ${thresholds.minimumEdpvrAdjustedR2}.`,
        pointIds,
      ));
    }
    if (edpvrFit.diagnostics.rmse > thresholds.maximumEdpvrRmseMmHg) {
      edpvrReasons.push(issue(
        "edpvr-rmse-above-threshold",
        `EDPVR RMSE exceeds ${thresholds.maximumEdpvrRmseMmHg} mmHg.`,
        pointIds,
      ));
    }
  }

  const prswFit = fitPrsw(prswPoints);
  const prswReasons = [...globalRejectReasons];
  if (valid.length < thresholds.minimumPrswPointCount) {
    prswReasons.push(issue(
      "insufficient-fit-eligible-points",
      `PRSW requires at least ${thresholds.minimumPrswPointCount} fit-eligible transient points; received ${valid.length}.`,
      pointIds,
    ));
  }
  if (prswFit === null) {
    prswReasons.push(issue(
      "prsw-fit-failed",
      "A finite free-intercept PRSW relation could not be estimated.",
      pointIds,
    ));
  } else {
    if (prswFit.preloadRecruitableStrokeWorkSlopeMmHg <= 0) {
      prswReasons.push(issue(
        "prsw-slope-not-positive",
        "PRSW slope must be positive.",
        pointIds,
      ));
    }
    if (prswFit.diagnostics.adjustedR2 < thresholds.minimumPrswAdjustedR2) {
      prswReasons.push(issue(
        "prsw-adjusted-r2-below-threshold",
        `PRSW adjusted R2 is below ${thresholds.minimumPrswAdjustedR2}.`,
        pointIds,
      ));
    }
    const swSpan = span(prswPoints.map(({ y }) => y));
    const allowedRmse = thresholds.maximumPrswRmseFractionOfStrokeWorkSpan * swSpan;
    if (prswFit.diagnostics.rmse > allowedRmse) {
      prswReasons.push(issue(
        "prsw-rmse-above-threshold",
        `PRSW RMSE exceeds ${thresholds.maximumPrswRmseFractionOfStrokeWorkSpan} of the stroke-work span.`,
        pointIds,
      ));
    }
    if (
      prswFit.leaveOneOutSlopeMaximumRelativeDeviation
        > thresholds.maximumPrswLeaveOneOutSlopeRelativeDeviation
    ) {
      prswReasons.push(issue(
        "prsw-leave-one-out-slope-instability",
        `Leave-one-out PRSW slope deviation exceeds ${thresholds.maximumPrswLeaveOneOutSlopeRelativeDeviation}.`,
        pointIds,
      ));
    }
  }

  const espvr = assessment(espvrFit, pointIds, espvrReasons);
  const edpvr = assessment(edpvrFit, pointIds, edpvrReasons);
  const prsw = assessment(prswFit, pointIds, prswReasons);

  return Object.freeze({
    analysisId: MAIN_WIRE_SCIENTIFIC_HEMODYNAMIC_ANALYSIS_V1_ID,
    protocolKind: "fixed-tbv-ivc-like-preload-reduction",
    physiologyBoundary: Object.freeze({
      pressures: "transmural",
      espvr: "multi-beat-fixed-context-end-systolic-relation-not-material-law",
      edpvr: "multi-beat-end-diastolic-envelope-not-fully-relaxed-passive-material-law",
      prsw: "fixed-context-preload-recruitable-stroke-work-relation",
      tbvFamilyMaySubstituteForThisProtocol: false,
      period2AveragingPermitted: false,
    }),
    thresholds,
    includedFitEligiblePointIds: pointIds,
    exclusions: Object.freeze(exclusions),
    espvr,
    quadraticEspvrSensitivity: quadratic,
    edpvr,
    prsw,
    overallStatus:
      espvr.status === "accepted"
      && edpvr.status === "accepted"
      && prsw.status === "accepted"
        ? "accepted"
        : "rejected",
  });
}

type FitPoint = Readonly<{ pointId: string; x: number; y: number }>;

function fitLinearEspvr(
  points: readonly FitPoint[],
): MainWireScientificLinearEspvrFitV1 | null {
  const diagnostics = linearRegression(points);
  if (diagnostics === null || Math.abs(diagnostics.slope) < 1e-12) return null;
  return Object.freeze({
    relation: "Pes_tm=Ees*(Ves-V0)",
    endSystolicElastanceMmHgPerMl: diagnostics.slope,
    volumeAxisInterceptMl: -diagnostics.intercept / diagnostics.slope,
    pressureInterceptMmHg: diagnostics.intercept,
    diagnostics,
    leaveOneOutSlopeMaximumRelativeDeviation: leaveOneOutSlopeDeviation(
      points,
      diagnostics.slope,
    ),
  });
}

function fitPrsw(points: readonly FitPoint[]): MainWireScientificPrswFitV1 | null {
  const diagnostics = linearRegression(points);
  if (diagnostics === null || Math.abs(diagnostics.slope) < 1e-12) return null;
  return Object.freeze({
    relation: "SW=Mw*(Ved-Vw)",
    preloadRecruitableStrokeWorkSlopeMmHg: diagnostics.slope,
    volumeAxisInterceptMl: -diagnostics.intercept / diagnostics.slope,
    strokeWorkInterceptMmHgMl: diagnostics.intercept,
    diagnostics,
    leaveOneOutSlopeMaximumRelativeDeviation: leaveOneOutSlopeDeviation(
      points,
      diagnostics.slope,
    ),
  });
}

function fitQuadraticEspvrSensitivity(
  points: readonly FitPoint[],
  linear: MainWireScientificLinearEspvrFitV1,
  thresholds: MainWireScientificHemodynamicAnalysisThresholdsV1,
): MainWireScientificQuadraticEspvrSensitivityV1 | null {
  if (points.length < 3) return null;
  const meanX = mean(points.map(({ x }) => x));
  const sums = {
    z4: 0,
    z3: 0,
    z2: 0,
    z1: 0,
    y: 0,
    z2y: 0,
    zy: 0,
  };
  for (const { x, y } of points) {
    const z = x - meanX;
    const z2 = z * z;
    sums.z4 += z2 * z2;
    sums.z3 += z2 * z;
    sums.z2 += z2;
    sums.z1 += z;
    sums.y += y;
    sums.z2y += z2 * y;
    sums.zy += z * y;
  }
  const centered = solveLinearSystem3x3(
    [
      [sums.z4, sums.z3, sums.z2],
      [sums.z3, sums.z2, sums.z1],
      [sums.z2, sums.z1, points.length],
    ],
    [sums.z2y, sums.zy, sums.y],
  );
  if (centered === null) return null;
  const [a, bCentered, cCentered] = centered;
  const b = bCentered - 2 * a * meanX;
  const c = cCentered - bCentered * meanX + a * meanX * meanX;
  const predicted = points.map(({ x }) => a * x * x + b * x + c);
  const diagnostics = regressionDiagnostics(
    points.map(({ y }) => y),
    predicted,
    2,
    b,
    c,
  );
  const rmseImprovement = linear.diagnostics.rmse > 1e-10
    ? Math.max(0, (linear.diagnostics.rmse - diagnostics.rmse) / linear.diagnostics.rmse)
    : 0;
  const xs = points.map(({ x }) => x);
  const localSlopes = [Math.min(...xs), Math.max(...xs)].map((x) => 2 * a * x + b);
  const localSlopeVariation = Math.abs(localSlopes[1]! - localSlopes[0]!)
    / Math.max(Math.abs(linear.endSystolicElastanceMmHgPerMl), 1e-12);
  const nonlinear =
    rmseImprovement >= thresholds.quadraticRmseImprovementFlagFraction
    || localSlopeVariation >= thresholds.quadraticLocalSlopeVariationFlagFraction;

  return Object.freeze({
    relation: "Pes_tm=a*Ves^2+b*Ves+c",
    quadraticCoefficientMmHgPerMl2: a,
    linearCoefficientMmHgPerMl: b,
    interceptMmHg: c,
    diagnostics,
    rmseImprovementFractionOverLinear: rmseImprovement,
    localSlopeVariationFraction: localSlopeVariation,
    nonlinear,
    flagCriteria: Object.freeze({
      rmseImprovementAtLeast: thresholds.quadraticRmseImprovementFlagFraction,
      localSlopeVariationAtLeast: thresholds.quadraticLocalSlopeVariationFlagFraction,
      operator: "or",
    }),
  });
}

function fitExponentialEdpvr(
  points: readonly FitPoint[],
  reference: MainWireScientificEdpvrReferenceV1,
  baselinePointId: string | null,
): MainWireScientificExponentialEdpvrFitV1 | null {
  if (
    points.length < 3
    || !Number.isFinite(reference.referenceVolumeMl)
    || !Number.isFinite(reference.referencePressureMmHg)
  ) return null;
  const x = points.map((point) => point.x - reference.referenceVolumeMl);
  const y = points.map((point) => point.y - reference.referencePressureMmHg);
  if (x.some((value) => value <= 0) || y.some((value) => !Number.isFinite(value))) return null;

  const maxX = Math.max(...x);
  const minimumBeta = 1e-6;
  const maximumBeta = Math.max(minimumBeta * 10, Math.min(2, 50 / maxX));
  const logMinimum = Math.log(minimumBeta);
  const logMaximum = Math.log(maximumBeta);
  const gridCount = 160;
  let bestIndex = 0;
  let best = exponentialObjective(logMinimum, x, y);
  for (let index = 1; index <= gridCount; index += 1) {
    const logBeta = logMinimum + (logMaximum - logMinimum) * index / gridCount;
    const candidate = exponentialObjective(logBeta, x, y);
    if (candidate.sse < best.sse) {
      best = candidate;
      bestIndex = index;
    }
  }
  const gridStep = (logMaximum - logMinimum) / gridCount;
  let lo = Math.max(logMinimum, logMinimum + (bestIndex - 1) * gridStep);
  let hi = Math.min(logMaximum, logMinimum + (bestIndex + 1) * gridStep);
  const ratio = (Math.sqrt(5) - 1) / 2;
  let left = hi - ratio * (hi - lo);
  let right = lo + ratio * (hi - lo);
  let leftValue = exponentialObjective(left, x, y);
  let rightValue = exponentialObjective(right, x, y);
  for (let iteration = 0; iteration < 80; iteration += 1) {
    if (leftValue.sse <= rightValue.sse) {
      hi = right;
      right = left;
      rightValue = leftValue;
      left = hi - ratio * (hi - lo);
      leftValue = exponentialObjective(left, x, y);
    } else {
      lo = left;
      left = right;
      leftValue = rightValue;
      right = lo + ratio * (hi - lo);
      rightValue = exponentialObjective(right, x, y);
    }
  }
  best = leftValue.sse <= rightValue.sse ? leftValue : rightValue;
  if (!Number.isFinite(best.sse) || best.alpha <= 0 || best.beta <= 0) return null;

  const predicted = x.map((value) =>
    reference.referencePressureMmHg + best.alpha * Math.expm1(best.beta * value));
  const diagnostics = regressionDiagnostics(
    points.map(({ y: pressure }) => pressure),
    predicted,
    2,
    Number.NaN,
    Number.NaN,
  );
  const baseline = points.find(({ pointId }) => pointId === baselinePointId) ?? points[0]!;
  const baselineX = baseline.x - reference.referenceVolumeMl;

  return Object.freeze({
    relation: "Ped_tm=P0+alpha*(exp(beta*(Ved-Vref))-1)",
    referenceVolumeMl: reference.referenceVolumeMl,
    referencePressureMmHg: reference.referencePressureMmHg,
    alphaMmHg: best.alpha,
    betaPerMl: best.beta,
    tangentStiffnessAtBaselineMmHgPerMl:
      best.alpha * best.beta * Math.exp(best.beta * baselineX),
    diagnostics,
  });
}

function exponentialObjective(
  logBeta: number,
  x: readonly number[],
  y: readonly number[],
): Readonly<{ beta: number; alpha: number; sse: number }> {
  const beta = Math.exp(logBeta);
  const basis = x.map((value) => Math.expm1(beta * value));
  const denominator = basis.reduce((sum, value) => sum + value * value, 0);
  const numerator = basis.reduce((sum, value, index) => sum + value * y[index]!, 0);
  const alpha = denominator > 0 ? numerator / denominator : Number.NaN;
  if (!Number.isFinite(alpha) || alpha <= 0) {
    return Object.freeze({ beta, alpha, sse: Number.POSITIVE_INFINITY });
  }
  const sse = basis.reduce((sum, value, index) => {
    const residual = y[index]! - alpha * value;
    return sum + residual * residual;
  }, 0);
  return Object.freeze({ beta, alpha, sse });
}

function linearRegression(points: readonly FitPoint[]): MainWireScientificLinearRegressionV1 | null {
  if (points.length < 2) return null;
  const xMean = mean(points.map(({ x }) => x));
  const yMean = mean(points.map(({ y }) => y));
  let xx = 0;
  let xy = 0;
  for (const { x, y } of points) {
    xx += (x - xMean) ** 2;
    xy += (x - xMean) * (y - yMean);
  }
  if (!Number.isFinite(xx) || xx <= 1e-18) return null;
  const slope = xy / xx;
  const intercept = yMean - slope * xMean;
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) return null;
  return regressionDiagnostics(
    points.map(({ y }) => y),
    points.map(({ x }) => slope * x + intercept),
    1,
    slope,
    intercept,
  );
}

function regressionDiagnostics(
  observed: readonly number[],
  predicted: readonly number[],
  predictorCount: number,
  slope: number,
  intercept: number,
): MainWireScientificLinearRegressionV1 {
  const observedMean = mean(observed);
  const residuals = observed.map((value, index) => value - predicted[index]!);
  const sse = residuals.reduce((sum, value) => sum + value * value, 0);
  const tss = observed.reduce((sum, value) => sum + (value - observedMean) ** 2, 0);
  const r2 = tss <= 1e-18 ? (sse <= 1e-18 ? 1 : 0) : 1 - sse / tss;
  const denominator = observed.length - predictorCount - 1;
  const adjustedR2 = denominator > 0
    ? 1 - (1 - r2) * (observed.length - 1) / denominator
    : r2;
  return Object.freeze({
    slope,
    intercept,
    r2,
    adjustedR2,
    rmse: Math.sqrt(sse / observed.length),
    residuals: Object.freeze(residuals),
  });
}

function leaveOneOutSlopeDeviation(
  points: readonly FitPoint[],
  fullSlope: number,
): number {
  if (points.length < 3 || Math.abs(fullSlope) < 1e-12) return Number.POSITIVE_INFINITY;
  let maximum = 0;
  for (let omitted = 0; omitted < points.length; omitted += 1) {
    const fit = linearRegression(points.filter((_, index) => index !== omitted));
    if (fit === null) return Number.POSITIVE_INFINITY;
    maximum = Math.max(maximum, Math.abs(fit.slope - fullSlope) / Math.abs(fullSlope));
  }
  return maximum;
}

function solveLinearSystem3x3(
  sourceMatrix: readonly (readonly number[])[],
  sourceVector: readonly number[],
): readonly [number, number, number] | null {
  const matrix = sourceMatrix.map((row, index) => [...row, sourceVector[index]!]);
  for (let pivot = 0; pivot < 3; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < 3; row += 1) {
      if (Math.abs(matrix[row]![pivot]!) > Math.abs(matrix[best]![pivot]!)) best = row;
    }
    if (Math.abs(matrix[best]![pivot]!) < 1e-14) return null;
    [matrix[pivot], matrix[best]] = [matrix[best]!, matrix[pivot]!];
    const scale = matrix[pivot]![pivot]!;
    for (let column = pivot; column < 4; column += 1) matrix[pivot]![column]! /= scale;
    for (let row = 0; row < 3; row += 1) {
      if (row === pivot) continue;
      const factor = matrix[row]![pivot]!;
      for (let column = pivot; column < 4; column += 1) {
        matrix[row]![column]! -= factor * matrix[pivot]![column]!;
      }
    }
  }
  const solution = [matrix[0]![3]!, matrix[1]![3]!, matrix[2]![3]!] as const;
  return solution.every(Number.isFinite) ? solution : null;
}

function addLoadingSpanIssues(
  reasons: MainWireScientificHemodynamicQcIssueV1[],
  valid: readonly Readonly<{
    point: MainWireScientificTransientFitEligibleOperatingPointV1;
    pv: MainWireScientificLvPressureVolumeBeatV1;
  }>[],
  baseline: Readonly<{
    point: MainWireScientificTransientFitEligibleOperatingPointV1;
    pv: MainWireScientificLvPressureVolumeBeatV1;
  }> | undefined,
  thresholds: MainWireScientificHemodynamicAnalysisThresholdsV1,
): void {
  const ids = valid.map(({ point }) => point.pointId);
  if (baseline === undefined || baseline.pv.endDiastolicVolumeMl <= 0) return;
  const edvSpanFraction = span(valid.map(({ pv }) => pv.endDiastolicVolumeMl))
    / baseline.pv.endDiastolicVolumeMl;
  const esPressureSpan = span(valid.map(({ pv }) => pv.endSystolicTransmuralPressureMmHg));
  const primaryPass = edvSpanFraction >= thresholds.minimumPrimaryEdvSpanFractionOfBaseline;
  const alternateEdvPass = edvSpanFraction >= thresholds.minimumAlternateEdvSpanFractionOfBaseline;
  const alternatePressurePass =
    esPressureSpan >= thresholds.minimumAlternateEndSystolicPressureSpanMmHg;
  if (!primaryPass && !alternateEdvPass) {
    reasons.push(issue(
      "insufficient-edv-span",
      `EDV span is below both the primary ${thresholds.minimumPrimaryEdvSpanFractionOfBaseline} and alternate ${thresholds.minimumAlternateEdvSpanFractionOfBaseline} baseline fractions.`,
      ids,
    ));
  }
  if (!primaryPass && alternateEdvPass && !alternatePressurePass) {
    reasons.push(issue(
      "insufficient-end-systolic-pressure-span",
      `The alternate loading-range gate requires at least ${thresholds.minimumAlternateEndSystolicPressureSpanMmHg} mmHg end-systolic pressure span.`,
      ids,
    ));
  }
}

function finiteMeasurement(
  measurement: MainWireScientificHemodynamicMeasurementV1,
  totalBloodVolumeMl: number,
): boolean {
  const values = [
    totalBloodVolumeMl,
    measurement.meanRightAtrialTransmuralPressureMmHg,
    measurement.meanLeftAtrialTransmuralPressureMmHg,
    measurement.cardiacOutputLPerMin,
    measurement.quality.totalBloodVolumeAbsoluteErrorMl,
    measurement.quality.maximumContinuityAbsoluteResidualMl,
  ];
  if (measurement.lvPressureVolume !== null) {
    values.push(
      measurement.lvPressureVolume.endDiastolicVolumeMl,
      measurement.lvPressureVolume.endDiastolicTransmuralPressureMmHg,
      measurement.lvPressureVolume.endSystolicVolumeMl,
      measurement.lvPressureVolume.endSystolicTransmuralPressureMmHg,
      measurement.lvPressureVolume.strokeWorkMmHgMl,
    );
  }
  return values.every(Number.isFinite);
}

function assessment<T>(
  fit: T | null,
  pointIds: readonly string[],
  reasons: readonly MainWireScientificHemodynamicQcIssueV1[],
): MainWireScientificFitAssessmentV1<T> {
  return Object.freeze({
    status: fit !== null && reasons.length === 0 ? "accepted" : "rejected",
    fit,
    pointIds,
    rejectReasons: Object.freeze([...reasons]),
  });
}

function issue(
  code: MainWireScientificHemodynamicQcIssueCodeV1,
  message: string,
  pointIds: readonly string[],
): MainWireScientificHemodynamicQcIssueV1 {
  return Object.freeze({ code, message, pointIds: Object.freeze([...pointIds]) });
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function span(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values) - Math.min(...values);
}
