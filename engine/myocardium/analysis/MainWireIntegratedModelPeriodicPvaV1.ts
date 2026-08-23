import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  evaluateMainWireIntegratedModelLvMvo2EstimateV1,
  type MainWireIntegratedModelLvMvo2EstimateV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelMvo2ReferenceV1";
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID =
  "main-wire-integrated-model-settled-hot-start-pva-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID =
  "suga-pva-area-max-common-isochrone-nonlinear-espvr-exponential-edpvr-settled-preload-family-v4" as const;

const MMHG_ML_TO_JOULE_V1 = 1.33322e-4;
const MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 = 3;
const MINIMUM_PVA_PREVIEW_POINT_COUNT_V1 = 5;
const CURVE_SAMPLE_COUNT_V1 = 64;
const SYSTOLIC_TIME_SAMPLE_COUNT_V1 = 128;
const PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1 = 128;
const EDPVR_V0_GRID_COUNT_V1 = 120;
const EDPVR_EXPONENT_GRID_COUNT_V1 = 180;

export type MainWireIntegratedModelPeriodicPvaVentricleV1 = "LV" | "RV";
export type MainWireIntegratedModelPeriodicPvaCurvePointV1 = Readonly<{
  volumeMl: number;
  pressureMmHg: number;
}>;

type PeriodicPvaProgressV1 = Readonly<{
  completedPointCount: number;
  totalPointCount: number;
}>;

export type MainWireIntegratedModelPeriodicPvaEspvrV1 = Readonly<{
  primaryMethod: "active-pressure-area-max-common-isochrone";
  primaryCurveLaw: "measured-domain-shape-preserving-locus";
  selectedTimeSinceAtrialCaptureSec: number;
  selectedPhase01AtAnchor: number;
  phaseSelectionPolicy: "anchor-plus-nearest-two-bidirectional-loads";
  phaseSelectionPointCount: number;
  activePressureAreaMmHgMl: number;
  activePressureAreaVolumeRangeMl: readonly [number, number];
  localElastanceAtAnchorMmHgPerMl: number;
  measuredVolumeRangeMl: readonly [number, number];
  fitPoints: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  interpolation: "piecewise-linear" | "shape-preserving-cubic-hermite";
  continuity: "C0" | "C1";
  displayExtrapolation: "none";
  educationalLinearApproximation: Readonly<{
    method: "anchor-local-tangent";
    use: "display-only-not-pva-owner";
    anchorVolumeMl: number;
    anchorPressureMmHg: number;
    elastanceMmHgPerMl: number;
    volumeAxisInterceptMl: number;
  }> | null;
  pressureEnvelopeDiagnostic: Readonly<{
    method: "phase-wise-maximum-pressure-envelope";
    curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
    timeSinceAtrialCaptureRangeSec: readonly [number, number];
    phase01AtAnchorRange: readonly [number, number];
    winningTimeByVolume: readonly Readonly<{
      volumeMl: number;
      timeSinceAtrialCaptureSec: number;
      phase01AtAnchor: number;
    }>[];
    excessAreaMmHgMl: number;
    excessAreaFraction: number;
  }>;
  semilunarClosureComparator: Readonly<{
    method: "linear-semilunar-closure-fit";
    elastanceMmHgPerMl: number;
    volumeAxisInterceptMl: number;
    rSquared: number;
  }> | null;
}>;

export type MainWireIntegratedModelPeriodicPvaEdpvrV1 = Readonly<{
  method: "density-weighted-exponential-maximum-volume-fit";
  scaleMmHg: number;
  exponentPerMl: number;
  zeroPressureVolumeMl: number;
  rSquared: number;
  measuredVolumeRangeMl: readonly [number, number];
  fitPoints: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  parameterBoundaryHit: boolean;
  curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
}>;

type PeriodicPvaAnchorV1 = Readonly<{
  totalBloodVolumeMl: number;
  endDiastolicVolumeMl: number;
  endSystolicVolumeMl: number;
  acceptedBeatDurationSec: number;
  measuredHeartRateBpm: number;
}>;

type PeriodicPvaStrokeWorkV1 = Readonly<{
  method: "accepted-step-transmural-path-work";
  mmHgMl: number;
  joule: number;
}>;

type PeriodicPvaPotentialEnergyV1 = Readonly<{
  method: "area-between-nonlinear-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv";
  leftIntersectionVolumeMl: number;
  measuredEspvrStartVolumeMl: number;
  lowVolumeTangentExtensionUsed: boolean;
  lowVolumeTangentExtensionSpanMl: number;
  mmHgMl: number;
  joule: number;
}>;

type PeriodicPvaAreaV1 = Readonly<{
  definition: "PVA = SW + PE";
  mmHgMl: number;
  joule: number;
}>;

export type MainWireIntegratedModelPeriodicPvaPreviewV1 = Readonly<{
  stage: "anchor" | "relations" | "pva";
  pointCount: number;
  anchor: PeriodicPvaAnchorV1 | null;
  strokeWork: PeriodicPvaStrokeWorkV1;
  espvr: MainWireIntegratedModelPeriodicPvaEspvrV1 | null;
  edpvr: MainWireIntegratedModelPeriodicPvaEdpvrV1 | null;
  potentialEnergy: PeriodicPvaPotentialEnergyV1 | null;
  pva: PeriodicPvaAreaV1 | null;
  estimatedMvo2: MainWireIntegratedModelLvMvo2EstimateV1 | null;
}>;

export type MainWireIntegratedModelPeriodicPvaV1 =
  | Readonly<{
      analysisId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID;
      status: "collecting" | "unavailable";
      ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1;
      pressureBasis: "transmural";
      progress: PeriodicPvaProgressV1;
      reason: string;
      preview: MainWireIntegratedModelPeriodicPvaPreviewV1 | null;
    }>
  | Readonly<{
      analysisId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID;
      methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID;
      outputId: string;
      status: "available";
      ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1;
      pressureBasis: "transmural";
      progress: PeriodicPvaProgressV1;
      source: Readonly<{
        protocolId: string;
        pointCount: number;
        familyProgress: PeriodicPvaProgressV1;
        primaryLineage: "persistent-worker-settled-hot-start-chain";
        slowControllerPolicy: "active-source-period1-then-coronary-tone-frozen";
        endDiastolicLandmark: "maximum-volume-proxy";
        endSystolicLandmark: "active-pressure-area-max-common-isochrone";
      }>;
      anchor: PeriodicPvaAnchorV1;
      strokeWork: PeriodicPvaStrokeWorkV1;
      espvr: MainWireIntegratedModelPeriodicPvaEspvrV1;
      edpvr: MainWireIntegratedModelPeriodicPvaEdpvrV1;
      potentialEnergy: PeriodicPvaPotentialEnergyV1;
      pva: PeriodicPvaAreaV1;
      estimatedMvo2: MainWireIntegratedModelLvMvo2EstimateV1 | null;
      limitations: readonly [
        "settled-preload-reduction-family-not-transient-venous-occlusion",
        "maximum-volume-used-as-end-diastolic-proxy",
        "common-isochrone-is-a-protocol-clock-not-a-common-land-state",
        "pressure-envelope-retained-as-single-phase-approximation-diagnostic",
        "local-linear-espvr-is-display-only-not-pva-owner",
        "measured-systolic-locus-is-not-extrapolated-for-display",
        "low-volume-pva-tail-uses-endpoint-local-tangent-extension",
        "coronary-tone-held-at-source-during-preload-reduction",
        "not-clinical-validation",
      ];
    }>;

type LinearFitV1 = Readonly<{
  slope: number;
  intercept: number;
  rSquared: number;
}>;

type SystolicPressureLawV1 = Readonly<{
  kind: "piecewise-linear" | "shape-preserving-cubic-hermite";
  points: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  tangentsMmHgPerMl: readonly number[];
  measuredVolumeRangeMl: readonly [number, number];
}>;

type IsochronalPressureCandidateV1 = Readonly<{
  timeSinceAtrialCaptureSec: number;
  phase01AtAnchor: number;
  activePressureAreaMmHgMl: number;
  activePressureAreaVolumeRangeMl: readonly [number, number];
  scoringLaw: SystolicPressureLawV1;
  law: SystolicPressureLawV1;
  points: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
}>;

type AreaMaxCommonIsochroneV1 = Readonly<{
  selected: IsochronalPressureCandidateV1;
  pressureEnvelope: MainWireIntegratedModelPeriodicPvaEspvrV1["pressureEnvelopeDiagnostic"];
}>;

type ExponentialFitV1 = Readonly<{
  scale: number;
  exponent: number;
  volumeOffset: number;
  rSquared: number;
  parameterBoundaryHit: boolean;
}>;

export function buildMainWireIntegratedModelPeriodicPvaV1(
  locus: MainWireIntegratedModelStarlingLocusV3,
  ventricleId: MainWireIntegratedModelPeriodicPvaVentricleV1,
): MainWireIntegratedModelPeriodicPvaV1 {
  const familyProgress: PeriodicPvaProgressV1 = Object.freeze({
    completedPointCount:
      "completedPointCount" in locus ? locus.completedPointCount : 0,
    totalPointCount: "totalPointCount" in locus ? locus.totalPointCount : 0,
  });
  let progress = familyProgress;
  const incomplete = (
    status: "collecting" | "unavailable",
    reason: string,
    preview: MainWireIntegratedModelPeriodicPvaPreviewV1 | null = null,
  ): MainWireIntegratedModelPeriodicPvaV1 =>
    Object.freeze({
      analysisId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID,
      methodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
      status,
      ventricleId,
      pressureBasis: "transmural" as const,
      progress,
      reason,
      preview,
    });

  if (locus.status !== "measured-fixed-tbv-protocol") {
    return incomplete(
      "unavailable",
      "PVA requires the settled fixed-tone preload-reduction analysis",
    );
  }
  const anchor = locus.points.find(({ role }) => role === "operating-anchor");
  if (anchor === undefined) {
    return incomplete(
      "unavailable",
      "The operating load anchor is unavailable",
    );
  }
  const tbvToleranceMl = Math.max(
    1e-6,
    Math.abs(anchor.totalBloodVolumeMl) * 1e-12,
  );
  const relationPoints = Object.freeze(
    [...locus.points].sort(
      (left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl,
    ),
  );
  const lowerPointCount = relationPoints.filter(
    ({ totalBloodVolumeMl }) =>
      totalBloodVolumeMl < anchor.totalBloodVolumeMl - tbvToleranceMl,
  ).length;
  const higherPointCount = relationPoints.filter(
    ({ totalBloodVolumeMl }) =>
      totalBloodVolumeMl > anchor.totalBloodVolumeMl + tbvToleranceMl,
  ).length;
  const bilateralPreviewReady = lowerPointCount >= 1 && higherPointCount >= 1;
  const bilateralPvaReady = lowerPointCount >= 2 && higherPointCount >= 2;
  const phaseSelectionPoints = phaseSelectionCorePointsV1(
    relationPoints,
    anchor,
    tbvToleranceMl,
  );
  progress = Object.freeze({
    completedPointCount: Math.min(
      MINIMUM_PVA_PREVIEW_POINT_COUNT_V1,
      1 + Math.min(2, lowerPointCount) + Math.min(2, higherPointCount),
    ),
    totalPointCount: MINIMUM_PVA_PREVIEW_POINT_COUNT_V1,
  });
  const strokeWorkMmHgMl = anchor.acceptedTransmuralPathWorkMmHgMl;
  if (
    strokeWorkMmHgMl === undefined ||
    !Number.isFinite(strokeWorkMmHgMl) ||
    !(strokeWorkMmHgMl > 0)
  ) {
    return incomplete(
      "unavailable",
      "The anchor beat does not retain positive finite accepted-step SW",
    );
  }
  const strokeWork = Object.freeze({
    method: "accepted-step-transmural-path-work" as const,
    mmHgMl: strokeWorkMmHgMl,
    joule: strokeWorkMmHgMl * MMHG_ML_TO_JOULE_V1,
  });
  const anchorPreview: MainWireIntegratedModelPeriodicPvaPreviewV1 =
    Object.freeze({
      stage: "anchor" as const,
      pointCount: relationPoints.length,
      anchor: null,
      strokeWork,
      espvr: null,
      edpvr: null,
      potentialEnergy: null,
      pva: null,
      estimatedMvo2: null,
    });
  if (
    relationPoints.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    !bilateralPreviewReady
  ) {
    return incomplete(
      "collecting",
      `${relationPoints.length} settled points; the anchor plus one lower- and one higher-preload point are required for relation preview`,
      anchorPreview,
    );
  }
  const semilunarClosure = relationPoints.flatMap((point) => {
    const landmark = point.ventricularPressureVolumeLandmarks.endSystolic;
    return landmark.event === "semilunar-valve-closure" ? [landmark] : [];
  });
  const diastolic = relationPoints
    .map(
      ({ ventricularPressureVolumeLandmarks }) =>
        ventricularPressureVolumeLandmarks.endDiastolic,
    )
    .filter(({ pressureMmHg }) => pressureMmHg > 0.05);
  const edpvr = exponentialFitV1(diastolic);
  const areaMaxIsochrone =
    edpvr === null
      ? null
      : areaMaxCommonIsochroneV1(
          phaseSelectionPoints,
          relationPoints,
          edpvr,
          anchor,
        );
  if (
    areaMaxIsochrone === null ||
    diastolic.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    edpvr === null
  ) {
    return incomplete(
      locus.completedPointCount === locus.totalPointCount
        ? "unavailable"
        : "collecting",
      "Settled phased loops and positive-pressure filling landmarks do not define an area-max common isochrone and EDPVR",
      anchorPreview,
    );
  }
  const systolicLaw = areaMaxIsochrone.selected.law;
  const anchorEndSystolic = interpolateLoopAtTimeV1(
    anchor.ventricularPressureVolumeLoop,
    anchor.acceptedBeatDurationSec,
    areaMaxIsochrone.selected.timeSinceAtrialCaptureSec,
  );
  const anchorEndDiastolic =
    anchor.ventricularPressureVolumeLandmarks.endDiastolic;
  const acceptedBeatDurationSec = anchor.acceptedBeatDurationSec;
  if (
    anchorEndSystolic === null ||
    acceptedBeatDurationSec === undefined ||
    !Number.isFinite(acceptedBeatDurationSec) ||
    !(acceptedBeatDurationSec > 0)
  ) {
    return incomplete(
      "unavailable",
      "The anchor beat does not retain accepted-step SW, duration, and the selected common isochrone time",
      anchorPreview,
    );
  }
  const systolicRange = systolicLaw.measuredVolumeRangeMl;
  const diastolicRange = finiteRangeV1(
    diastolic.map(({ volumeMl }) => volumeMl),
  )!;
  const semilunarClosureFit = linearFitV1(semilunarClosure);
  const localElastanceAtAnchorMmHgPerMl = systolicPressureDerivativeV1(
    systolicLaw,
    anchorEndSystolic.volumeMl,
  );
  const educationalLinearApproximation =
    Number.isFinite(localElastanceAtAnchorMmHgPerMl) &&
    localElastanceAtAnchorMmHgPerMl > 0
      ? Object.freeze({
          method: "anchor-local-tangent" as const,
          use: "display-only-not-pva-owner" as const,
          anchorVolumeMl: anchorEndSystolic.volumeMl,
          anchorPressureMmHg: anchorEndSystolic.pressureMmHg,
          elastanceMmHgPerMl: localElastanceAtAnchorMmHgPerMl,
          volumeAxisInterceptMl:
            anchorEndSystolic.volumeMl -
            anchorEndSystolic.pressureMmHg / localElastanceAtAnchorMmHgPerMl,
        })
      : null;
  const espvrProjection: MainWireIntegratedModelPeriodicPvaEspvrV1 =
    Object.freeze({
      primaryMethod: "active-pressure-area-max-common-isochrone" as const,
      primaryCurveLaw: "measured-domain-shape-preserving-locus" as const,
      selectedTimeSinceAtrialCaptureSec:
        areaMaxIsochrone.selected.timeSinceAtrialCaptureSec,
      selectedPhase01AtAnchor: areaMaxIsochrone.selected.phase01AtAnchor,
      phaseSelectionPolicy:
        "anchor-plus-nearest-two-bidirectional-loads" as const,
      phaseSelectionPointCount: phaseSelectionPoints.length,
      activePressureAreaMmHgMl:
        areaMaxIsochrone.selected.activePressureAreaMmHgMl,
      activePressureAreaVolumeRangeMl:
        areaMaxIsochrone.selected.activePressureAreaVolumeRangeMl,
      localElastanceAtAnchorMmHgPerMl,
      measuredVolumeRangeMl: systolicRange,
      fitPoints: systolicLaw.points,
      curve: sampleShapePreservingCurveV1(systolicLaw),
      interpolation: systolicLaw.kind,
      continuity:
        systolicLaw.kind === "shape-preserving-cubic-hermite"
          ? ("C1" as const)
          : ("C0" as const),
      displayExtrapolation: "none" as const,
      educationalLinearApproximation,
      pressureEnvelopeDiagnostic: areaMaxIsochrone.pressureEnvelope,
      semilunarClosureComparator:
        semilunarClosureFit === null
          ? null
          : Object.freeze({
              method: "linear-semilunar-closure-fit" as const,
              elastanceMmHgPerMl: semilunarClosureFit.slope,
              volumeAxisInterceptMl:
                -semilunarClosureFit.intercept / semilunarClosureFit.slope,
              rSquared: semilunarClosureFit.rSquared,
            }),
    });
  const edpvrProjection: MainWireIntegratedModelPeriodicPvaEdpvrV1 =
    Object.freeze({
      method: "density-weighted-exponential-maximum-volume-fit" as const,
      scaleMmHg: edpvr.scale,
      exponentPerMl: edpvr.exponent,
      zeroPressureVolumeMl: edpvr.volumeOffset,
      rSquared: edpvr.rSquared,
      measuredVolumeRangeMl: diastolicRange,
      fitPoints: Object.freeze(
        diastolic.map((point) => Object.freeze({ ...point })),
      ),
      parameterBoundaryHit: edpvr.parameterBoundaryHit,
      curve: sampleCurveV1(edpvr.volumeOffset, diastolicRange[1], (volumeMl) =>
        nonnegativeExponentialPressureV1(edpvr, volumeMl),
      ),
    });
  const anchorProjection: PeriodicPvaAnchorV1 = Object.freeze({
    totalBloodVolumeMl: anchor.totalBloodVolumeMl,
    endDiastolicVolumeMl: anchorEndDiastolic.volumeMl,
    endSystolicVolumeMl: anchorEndSystolic.volumeMl,
    acceptedBeatDurationSec,
    measuredHeartRateBpm: 60 / acceptedBeatDurationSec,
  });
  const relationsPreview: MainWireIntegratedModelPeriodicPvaPreviewV1 =
    Object.freeze({
      stage: "relations" as const,
      pointCount: relationPoints.length,
      anchor: anchorProjection,
      strokeWork,
      espvr: espvrProjection,
      edpvr: edpvrProjection,
      potentialEnergy: null,
      pva: null,
      estimatedMvo2: null,
    });
  if (!bilateralPvaReady) {
    return incomplete(
      "collecting",
      `${relationPoints.length} settled points; the anchor plus two lower- and two higher-preload points are required before the broad-domain PVA is admitted`,
      relationsPreview,
    );
  }
  const lowVolumeExtension = lowVolumeTangentExtensionV1(systolicLaw);
  if (lowVolumeExtension === null) {
    return incomplete(
      locus.completedPointCount === locus.totalPointCount
        ? "unavailable"
        : "collecting",
      "The nonlinear ESPVR does not define a positive finite low-volume tangent for the unresolved PE tail",
      relationsPreview,
    );
  }
  const systolicBoundaryPressureMmHg = (volumeMl: number) =>
    nonlinearPvaBoundaryPressureV1(systolicLaw, lowVolumeExtension, volumeMl);
  const peLeftIntersectionVolumeMl = pressureRelationsLeftIntersectionV1(
    systolicBoundaryPressureMmHg,
    edpvr,
    Math.max(0, lowVolumeExtension.zeroPressureVolumeMl),
    anchorEndSystolic.volumeMl,
  );
  if (peLeftIntersectionVolumeMl === null) {
    return incomplete(
      locus.completedPointCount === locus.totalPointCount
        ? "unavailable"
        : "collecting",
      "PE requires one left ESPVR–EDPVR intersection followed by P_es > P_ed through anchor ESV",
      relationsPreview,
    );
  }
  const potentialEnergyMmHgMl = pressureDifferenceAreaV1(
    systolicBoundaryPressureMmHg,
    (volumeMl) => nonnegativeExponentialPressureV1(edpvr, volumeMl),
    peLeftIntersectionVolumeMl,
    anchorEndSystolic.volumeMl,
  );
  const pvaMmHgMl = strokeWorkMmHgMl + potentialEnergyMmHgMl;
  if (
    ![
      peLeftIntersectionVolumeMl,
      strokeWorkMmHgMl,
      potentialEnergyMmHgMl,
      pvaMmHgMl,
    ].every(Number.isFinite) ||
    !(anchorEndSystolic.volumeMl > peLeftIntersectionVolumeMl) ||
    !(strokeWorkMmHgMl > 0) ||
    !(potentialEnergyMmHgMl >= 0) ||
    !(pvaMmHgMl > 0)
  ) {
    return incomplete(
      locus.completedPointCount === locus.totalPointCount
        ? "unavailable"
        : "collecting",
      "The settled relations do not define a positive finite SW/PE/PVA decomposition",
      relationsPreview,
    );
  }
  const outputId = `protocol-analysis.settled-hot-start-pva-v1.${ventricleId}`;
  const pvaJ = pvaMmHgMl * MMHG_ML_TO_JOULE_V1;
  const estimatedMvo2 =
    ventricleId === "LV"
      ? evaluateMainWireIntegratedModelLvMvo2EstimateV1({
          pvaOutputId: outputId,
          pvaMethodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
          pvaEstimateJ: pvaJ,
          heartRateBpm: 60 / acceptedBeatDurationSec,
        })
      : null;
  const potentialEnergy: PeriodicPvaPotentialEnergyV1 = Object.freeze({
    method:
      "area-between-nonlinear-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv" as const,
    leftIntersectionVolumeMl: peLeftIntersectionVolumeMl,
    measuredEspvrStartVolumeMl: systolicRange[0],
    lowVolumeTangentExtensionUsed:
      peLeftIntersectionVolumeMl < systolicRange[0],
    lowVolumeTangentExtensionSpanMl: Math.max(
      0,
      systolicRange[0] - peLeftIntersectionVolumeMl,
    ),
    mmHgMl: potentialEnergyMmHgMl,
    joule: potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
  });
  const pva: PeriodicPvaAreaV1 = Object.freeze({
    definition: "PVA = SW + PE" as const,
    mmHgMl: pvaMmHgMl,
    joule: pvaJ,
  });
  return Object.freeze({
    analysisId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID,
    outputId,
    status: "available" as const,
    ventricleId,
    pressureBasis: "transmural" as const,
    progress,
    source: Object.freeze({
      protocolId: locus.protocolId,
      pointCount: relationPoints.length,
      familyProgress,
      primaryLineage: "persistent-worker-settled-hot-start-chain" as const,
      slowControllerPolicy:
        "active-source-period1-then-coronary-tone-frozen" as const,
      endDiastolicLandmark: "maximum-volume-proxy" as const,
      endSystolicLandmark: "active-pressure-area-max-common-isochrone" as const,
    }),
    anchor: anchorProjection,
    strokeWork,
    espvr: espvrProjection,
    edpvr: edpvrProjection,
    potentialEnergy,
    pva,
    estimatedMvo2,
    limitations: Object.freeze([
      "settled-preload-reduction-family-not-transient-venous-occlusion",
      "maximum-volume-used-as-end-diastolic-proxy",
      "common-isochrone-is-a-protocol-clock-not-a-common-land-state",
      "pressure-envelope-retained-as-single-phase-approximation-diagnostic",
      "local-linear-espvr-is-display-only-not-pva-owner",
      "measured-systolic-locus-is-not-extrapolated-for-display",
      "low-volume-pva-tail-uses-endpoint-local-tangent-extension",
      "coronary-tone-held-at-source-during-preload-reduction",
      "not-clinical-validation",
    ] as const),
  });
}

function phaseSelectionCorePointsV1(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  anchor: MainWireIntegratedModelStarlingPointV3,
  tbvToleranceMl: number,
): readonly MainWireIntegratedModelStarlingPointV3[] {
  const lower = points
    .filter(
      ({ totalBloodVolumeMl }) =>
        totalBloodVolumeMl < anchor.totalBloodVolumeMl - tbvToleranceMl,
    )
    .sort((left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl)
    .slice(0, 2);
  const higher = points
    .filter(
      ({ totalBloodVolumeMl }) =>
        totalBloodVolumeMl > anchor.totalBloodVolumeMl + tbvToleranceMl,
    )
    .sort((left, right) => left.totalBloodVolumeMl - right.totalBloodVolumeMl)
    .slice(0, 2);
  return Object.freeze(
    [...higher, anchor, ...lower].sort(
      (left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl,
    ),
  );
}

function areaMaxCommonIsochroneV1(
  phaseSelectionPoints: readonly MainWireIntegratedModelStarlingPointV3[],
  allPoints: readonly MainWireIntegratedModelStarlingPointV3[],
  edpvr: ExponentialFitV1,
  anchor: MainWireIntegratedModelStarlingPointV3,
): AreaMaxCommonIsochroneV1 | null {
  if (
    phaseSelectionPoints.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    allPoints.length < phaseSelectionPoints.length
  ) {
    return null;
  }
  const beatDurationsSec = allPoints.map(
    ({ acceptedBeatDurationSec }) => acceptedBeatDurationSec,
  );
  if (
    beatDurationsSec.some(
      (durationSec) =>
        durationSec === undefined ||
        !Number.isFinite(durationSec) ||
        !(durationSec > 0),
    ) ||
    anchor.acceptedBeatDurationSec === undefined ||
    !Number.isFinite(anchor.acceptedBeatDurationSec) ||
    !(anchor.acceptedBeatDurationSec > 0)
  ) {
    return null;
  }
  const minimumBeatDurationSec = Math.min(...(beatDurationsSec as number[]));
  const candidates: IsochronalPressureCandidateV1[] = [];
  for (
    let timeOrdinal = 0;
    timeOrdinal < SYSTOLIC_TIME_SAMPLE_COUNT_V1;
    timeOrdinal += 1
  ) {
    const timeSinceAtrialCaptureSec =
      (timeOrdinal / SYSTOLIC_TIME_SAMPLE_COUNT_V1) * minimumBeatDurationSec;
    const sampledForPhaseSelection = phaseSelectionPoints.map((point) =>
      interpolateLoopAtTimeV1(
        point.ventricularPressureVolumeLoop,
        point.acceptedBeatDurationSec,
        timeSinceAtrialCaptureSec,
      ),
    );
    const sampledForFullLocus = allPoints.map((point) =>
      interpolateLoopAtTimeV1(
        point.ventricularPressureVolumeLoop,
        point.acceptedBeatDurationSec,
        timeSinceAtrialCaptureSec,
      ),
    );
    if (
      sampledForPhaseSelection.some((point) => point === null) ||
      sampledForFullLocus.some((point) => point === null)
    ) {
      continue;
    }
    const scoringPoints =
      sampledForPhaseSelection as MainWireIntegratedModelPeriodicPvaCurvePointV1[];
    const owned =
      sampledForFullLocus as MainWireIntegratedModelPeriodicPvaCurvePointV1[];
    const scoringLaw = fitSystolicPressureLawV1(scoringPoints);
    const law = fitSystolicPressureLawV1(owned);
    if (
      scoringLaw === null ||
      law === null ||
      !systolicLawStrictlyIncreasingV1(scoringLaw) ||
      !systolicLawStrictlyIncreasingV1(law)
    ) {
      continue;
    }
    const activePressureAreaMmHgMl = positivePressureDifferenceAreaV1(
      (volumeMl) => systolicPressureV1(scoringLaw, volumeMl),
      (volumeMl) => nonnegativeExponentialPressureV1(edpvr, volumeMl),
      scoringLaw.measuredVolumeRangeMl[0],
      scoringLaw.measuredVolumeRangeMl[1],
    );
    if (activePressureAreaMmHgMl === null) continue;
    candidates.push(
      Object.freeze({
        timeSinceAtrialCaptureSec,
        phase01AtAnchor:
          timeSinceAtrialCaptureSec / anchor.acceptedBeatDurationSec,
        activePressureAreaMmHgMl,
        activePressureAreaVolumeRangeMl: scoringLaw.measuredVolumeRangeMl,
        scoringLaw,
        law,
        points: Object.freeze(
          owned.map((point) => Object.freeze({ ...point })),
        ),
      }),
    );
  }
  const selected = candidates.reduce<IsochronalPressureCandidateV1 | null>(
    (best, candidate) =>
      best === null ||
      candidate.activePressureAreaMmHgMl > best.activePressureAreaMmHgMl
        ? candidate
        : best,
    null,
  );
  if (selected === null) return null;
  const pressureEnvelope = pressureEnvelopeDiagnosticV1(
    candidates,
    selected,
    selected.law.measuredVolumeRangeMl,
    anchor.acceptedBeatDurationSec,
  );
  if (pressureEnvelope === null) return null;
  return Object.freeze({ selected, pressureEnvelope });
}

function pressureEnvelopeDiagnosticV1(
  candidates: readonly IsochronalPressureCandidateV1[],
  selected: IsochronalPressureCandidateV1,
  volumeRangeMl: readonly [number, number],
  anchorBeatDurationSec: number,
):
  | MainWireIntegratedModelPeriodicPvaEspvrV1["pressureEnvelopeDiagnostic"]
  | null {
  if (candidates.length === 0 || !(volumeRangeMl[1] > volumeRangeMl[0])) {
    return null;
  }
  const winningTimesSec: number[] = [];
  const curve = sampleCurveV1(
    volumeRangeMl[0],
    volumeRangeMl[1],
    (volumeMl) => {
      let winner = selected;
      let maximumPressureMmHg = systolicPressureV1(selected.law, volumeMl);
      for (const candidate of candidates) {
        const pressureMmHg = systolicPressureV1(candidate.law, volumeMl);
        if (!Number.isFinite(pressureMmHg)) continue;
        if (pressureMmHg > maximumPressureMmHg) {
          winner = candidate;
          maximumPressureMmHg = pressureMmHg;
        }
      }
      winningTimesSec.push(winner.timeSinceAtrialCaptureSec);
      return maximumPressureMmHg;
    },
  );
  const timeRange = finiteRangeAllowEqualV1(winningTimesSec);
  if (curve.length === 0 || timeRange === null) return null;
  const winningTimeByVolume = Object.freeze(
    curve.map((point, index) =>
      Object.freeze({
        volumeMl: point.volumeMl,
        timeSinceAtrialCaptureSec: winningTimesSec[index]!,
        phase01AtAnchor: winningTimesSec[index]! / anchorBeatDurationSec,
      }),
    ),
  );
  const excessAreaMmHgMl = pressureDifferenceAreaV1(
    (volumeMl) => {
      let maximumPressureMmHg = systolicPressureV1(selected.law, volumeMl);
      for (const candidate of candidates) {
        const pressureMmHg = systolicPressureV1(candidate.law, volumeMl);
        if (Number.isFinite(pressureMmHg)) {
          maximumPressureMmHg = Math.max(maximumPressureMmHg, pressureMmHg);
        }
      }
      return maximumPressureMmHg;
    },
    (volumeMl) => systolicPressureV1(selected.law, volumeMl),
    volumeRangeMl[0],
    volumeRangeMl[1],
  );
  if (!Number.isFinite(excessAreaMmHgMl) || excessAreaMmHgMl < 0) return null;
  return Object.freeze({
    method: "phase-wise-maximum-pressure-envelope" as const,
    curve,
    timeSinceAtrialCaptureRangeSec: timeRange,
    phase01AtAnchorRange: Object.freeze([
      timeRange[0] / anchorBeatDurationSec,
      timeRange[1] / anchorBeatDurationSec,
    ] as const),
    winningTimeByVolume,
    excessAreaMmHgMl,
    excessAreaFraction:
      selected.activePressureAreaMmHgMl > 0
        ? excessAreaMmHgMl / selected.activePressureAreaMmHgMl
        : Number.POSITIVE_INFINITY,
  });
}

function interpolateLoopAtTimeV1(
  loop: readonly MainWireIntegratedModelPressureVolumeLoopPointV3[],
  acceptedBeatDurationSec: number | undefined,
  timeSinceAtrialCaptureSec: number,
): MainWireIntegratedModelPeriodicPvaCurvePointV1 | null {
  if (
    acceptedBeatDurationSec === undefined ||
    !Number.isFinite(acceptedBeatDurationSec) ||
    !(acceptedBeatDurationSec > 0) ||
    !Number.isFinite(timeSinceAtrialCaptureSec) ||
    timeSinceAtrialCaptureSec < 0 ||
    !(timeSinceAtrialCaptureSec < acceptedBeatDurationSec)
  ) {
    return null;
  }
  return interpolateLoopAtPhaseV1(
    loop,
    timeSinceAtrialCaptureSec / acceptedBeatDurationSec,
  );
}

function interpolateLoopAtPhaseV1(
  loop: readonly MainWireIntegratedModelPressureVolumeLoopPointV3[],
  phase01: number,
): MainWireIntegratedModelPeriodicPvaCurvePointV1 | null {
  if (
    loop.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    !Number.isFinite(phase01) ||
    phase01 < 0 ||
    phase01 >= 1
  ) {
    return null;
  }
  const ordered = [...loop].sort(
    (left, right) =>
      (left.phase01 ?? Number.NaN) - (right.phase01 ?? Number.NaN),
  );
  if (
    ordered.some(
      ({ phase01: retainedPhase, volumeMl, pressureMmHg }) =>
        retainedPhase === undefined ||
        !Number.isFinite(retainedPhase) ||
        retainedPhase < 0 ||
        retainedPhase >= 1 ||
        !Number.isFinite(volumeMl) ||
        !Number.isFinite(pressureMmHg),
    ) ||
    ordered
      .slice(1)
      .some((point, index) => point.phase01! <= ordered[index]!.phase01!)
  ) {
    return null;
  }
  const exact = ordered.find((point) => point.phase01 === phase01);
  if (exact !== undefined) {
    return Object.freeze({
      volumeMl: exact.volumeMl,
      pressureMmHg: exact.pressureMmHg,
    });
  }
  const rightIndex = ordered.findIndex((point) => point.phase01! > phase01);
  const left = rightIndex <= 0 ? ordered.at(-1)! : ordered[rightIndex - 1]!;
  const right = rightIndex < 0 ? ordered[0]! : ordered[rightIndex]!;
  const leftPhase = rightIndex === 0 ? left.phase01! - 1 : left.phase01!;
  const rightPhase = rightIndex < 0 ? right.phase01! + 1 : right.phase01!;
  const fraction = (phase01 - leftPhase) / (rightPhase - leftPhase);
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) return null;
  return Object.freeze({
    volumeMl: left.volumeMl + fraction * (right.volumeMl - left.volumeMl),
    pressureMmHg:
      left.pressureMmHg + fraction * (right.pressureMmHg - left.pressureMmHg),
  });
}

function fitSystolicPressureLawV1(
  points: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[],
): SystolicPressureLawV1 | null {
  if (
    points.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    points.some(
      ({ volumeMl, pressureMmHg }) =>
        !Number.isFinite(volumeMl) || !Number.isFinite(pressureMmHg),
    )
  )
    return null;
  const ordered = Object.freeze(
    [...points]
      .sort((left, right) => left.volumeMl - right.volumeMl)
      .map((point) => Object.freeze({ ...point })),
  );
  const widths = ordered
    .slice(1)
    .map((point, index) => point.volumeMl - ordered[index]!.volumeMl);
  if (widths.some((widthMl) => !(widthMl > 1e-10))) return null;
  const secants = widths.map(
    (widthMl, index) =>
      (ordered[index + 1]!.pressureMmHg - ordered[index]!.pressureMmHg) /
      widthMl,
  );
  if (secants.some((slope) => !Number.isFinite(slope))) return null;
  const useCubic = ordered.length >= MINIMUM_PVA_PREVIEW_POINT_COUNT_V1;
  const tangents = useCubic
    ? shapePreservingTangentsV1(widths, secants)
    : ordered.map((_, index) =>
        index === ordered.length - 1 ? secants.at(-1)! : secants[index]!,
      );
  if (tangents.some((slope) => !Number.isFinite(slope))) return null;
  return Object.freeze({
    kind: useCubic
      ? ("shape-preserving-cubic-hermite" as const)
      : ("piecewise-linear" as const),
    points: ordered,
    tangentsMmHgPerMl: Object.freeze(tangents),
    measuredVolumeRangeMl: Object.freeze([
      ordered[0]!.volumeMl,
      ordered.at(-1)!.volumeMl,
    ] as const),
  });
}

function systolicPressureV1(
  law: SystolicPressureLawV1,
  volumeMl: number,
): number {
  const [minimumVolumeMl, maximumVolumeMl] = law.measuredVolumeRangeMl;
  if (
    !Number.isFinite(volumeMl) ||
    volumeMl < minimumVolumeMl ||
    volumeMl > maximumVolumeMl
  )
    return Number.NaN;
  const exact = law.points.find((point) => point.volumeMl === volumeMl);
  if (exact !== undefined) return exact.pressureMmHg;
  const rightIndex = law.points.findIndex((point) => point.volumeMl > volumeMl);
  if (rightIndex <= 0) return Number.NaN;
  const left = law.points[rightIndex - 1]!;
  const right = law.points[rightIndex]!;
  const widthMl = right.volumeMl - left.volumeMl;
  const fraction = (volumeMl - left.volumeMl) / widthMl;
  if (law.kind === "piecewise-linear") {
    return (
      left.pressureMmHg + fraction * (right.pressureMmHg - left.pressureMmHg)
    );
  }
  const fraction2 = fraction * fraction;
  const fraction3 = fraction2 * fraction;
  return (
    (2 * fraction3 - 3 * fraction2 + 1) * left.pressureMmHg +
    (fraction3 - 2 * fraction2 + fraction) *
      widthMl *
      law.tangentsMmHgPerMl[rightIndex - 1]! +
    (-2 * fraction3 + 3 * fraction2) * right.pressureMmHg +
    (fraction3 - fraction2) * widthMl * law.tangentsMmHgPerMl[rightIndex]!
  );
}

function systolicPressureDerivativeV1(
  law: SystolicPressureLawV1,
  volumeMl: number,
): number {
  const [minimumVolumeMl, maximumVolumeMl] = law.measuredVolumeRangeMl;
  if (
    !Number.isFinite(volumeMl) ||
    volumeMl < minimumVolumeMl ||
    volumeMl > maximumVolumeMl
  ) {
    return Number.NaN;
  }
  const exactIndex = law.points.findIndex(
    (point) => point.volumeMl === volumeMl,
  );
  if (exactIndex >= 0) return law.tangentsMmHgPerMl[exactIndex]!;
  const rightIndex = law.points.findIndex((point) => point.volumeMl > volumeMl);
  if (rightIndex <= 0) return Number.NaN;
  const left = law.points[rightIndex - 1]!;
  const right = law.points[rightIndex]!;
  const widthMl = right.volumeMl - left.volumeMl;
  if (law.kind === "piecewise-linear") {
    return (right.pressureMmHg - left.pressureMmHg) / widthMl;
  }
  const fraction = (volumeMl - left.volumeMl) / widthMl;
  const fraction2 = fraction * fraction;
  return (
    ((6 * fraction2 - 6 * fraction) / widthMl) * left.pressureMmHg +
    (3 * fraction2 - 4 * fraction + 1) *
      law.tangentsMmHgPerMl[rightIndex - 1]! +
    ((-6 * fraction2 + 6 * fraction) / widthMl) * right.pressureMmHg +
    (3 * fraction2 - 2 * fraction) * law.tangentsMmHgPerMl[rightIndex]!
  );
}

function systolicLawStrictlyIncreasingV1(law: SystolicPressureLawV1): boolean {
  return (
    law.points
      .slice(1)
      .every(
        (point, index) => point.pressureMmHg > law.points[index]!.pressureMmHg,
      ) &&
    law.tangentsMmHgPerMl.every((slope) => Number.isFinite(slope) && slope >= 0)
  );
}

type LowVolumeTangentExtensionV1 = Readonly<{
  measuredStartVolumeMl: number;
  measuredStartPressureMmHg: number;
  slopeMmHgPerMl: number;
  zeroPressureVolumeMl: number;
}>;

function lowVolumeTangentExtensionV1(
  law: SystolicPressureLawV1,
): LowVolumeTangentExtensionV1 | null {
  const measuredStartVolumeMl = law.measuredVolumeRangeMl[0];
  const measuredStartPressureMmHg = systolicPressureV1(
    law,
    measuredStartVolumeMl,
  );
  const slopeMmHgPerMl = systolicPressureDerivativeV1(
    law,
    measuredStartVolumeMl,
  );
  const zeroPressureVolumeMl =
    measuredStartVolumeMl - measuredStartPressureMmHg / slopeMmHgPerMl;
  if (
    ![
      measuredStartVolumeMl,
      measuredStartPressureMmHg,
      slopeMmHgPerMl,
      zeroPressureVolumeMl,
    ].every(Number.isFinite) ||
    !(measuredStartPressureMmHg > 0) ||
    !(slopeMmHgPerMl > 0) ||
    !(zeroPressureVolumeMl < measuredStartVolumeMl)
  ) {
    return null;
  }
  return Object.freeze({
    measuredStartVolumeMl,
    measuredStartPressureMmHg,
    slopeMmHgPerMl,
    zeroPressureVolumeMl,
  });
}

function nonlinearPvaBoundaryPressureV1(
  law: SystolicPressureLawV1,
  extension: LowVolumeTangentExtensionV1,
  volumeMl: number,
): number {
  if (!Number.isFinite(volumeMl)) return Number.NaN;
  if (volumeMl < extension.measuredStartVolumeMl) {
    return (
      extension.measuredStartPressureMmHg +
      extension.slopeMmHgPerMl * (volumeMl - extension.measuredStartVolumeMl)
    );
  }
  return systolicPressureV1(law, volumeMl);
}

function shapePreservingTangentsV1(
  widthsMl: readonly number[],
  secantsMmHgPerMl: readonly number[],
): readonly number[] {
  if (secantsMmHgPerMl.length === 1) {
    return Object.freeze([secantsMmHgPerMl[0]!, secantsMmHgPerMl[0]!]);
  }
  const endpoint = (
    firstWidth: number,
    secondWidth: number,
    firstSecant: number,
    secondSecant: number,
  ) => {
    let tangent =
      ((2 * firstWidth + secondWidth) * firstSecant -
        firstWidth * secondSecant) /
      (firstWidth + secondWidth);
    if (Math.sign(tangent) !== Math.sign(firstSecant)) tangent = 0;
    else if (
      Math.sign(firstSecant) !== Math.sign(secondSecant) &&
      Math.abs(tangent) > Math.abs(3 * firstSecant)
    )
      tangent = 3 * firstSecant;
    return tangent;
  };
  const tangents = new Array<number>(secantsMmHgPerMl.length + 1);
  tangents[0] = endpoint(
    widthsMl[0]!,
    widthsMl[1]!,
    secantsMmHgPerMl[0]!,
    secantsMmHgPerMl[1]!,
  );
  for (let index = 1; index < secantsMmHgPerMl.length; index += 1) {
    const leftSecant = secantsMmHgPerMl[index - 1]!;
    const rightSecant = secantsMmHgPerMl[index]!;
    if (
      leftSecant === 0 ||
      rightSecant === 0 ||
      Math.sign(leftSecant) !== Math.sign(rightSecant)
    ) {
      tangents[index] = 0;
      continue;
    }
    const leftWidth = widthsMl[index - 1]!;
    const rightWidth = widthsMl[index]!;
    const leftWeight = 2 * rightWidth + leftWidth;
    const rightWeight = rightWidth + 2 * leftWidth;
    tangents[index] =
      (leftWeight + rightWeight) /
      (leftWeight / leftSecant + rightWeight / rightSecant);
  }
  const last = secantsMmHgPerMl.length - 1;
  tangents[last + 1] = endpoint(
    widthsMl[last]!,
    widthsMl[last - 1]!,
    secantsMmHgPerMl[last]!,
    secantsMmHgPerMl[last - 1]!,
  );
  return Object.freeze(tangents);
}

function sampleShapePreservingCurveV1(
  law: SystolicPressureLawV1,
): readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[] {
  const [startVolumeMl, endVolumeMl] = law.measuredVolumeRangeMl;
  return Object.freeze(
    Array.from({ length: CURVE_SAMPLE_COUNT_V1 + 1 }, (_, index) => {
      const volumeMl =
        index === 0
          ? startVolumeMl
          : index === CURVE_SAMPLE_COUNT_V1
            ? endVolumeMl
            : startVolumeMl +
              (index / CURVE_SAMPLE_COUNT_V1) * (endVolumeMl - startVolumeMl);
      return Object.freeze({
        volumeMl,
        pressureMmHg: systolicPressureV1(law, volumeMl),
      });
    }),
  );
}

function positivePressureDifferenceAreaV1(
  upperPressure: (volumeMl: number) => number,
  lowerPressure: (volumeMl: number) => number,
  startVolumeMl: number,
  endVolumeMl: number,
): number | null {
  if (!(endVolumeMl > startVolumeMl)) return null;
  for (
    let index = 0;
    index <= PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1;
    index += 1
  ) {
    const volumeMl =
      startVolumeMl +
      (index / PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1) *
        (endVolumeMl - startVolumeMl);
    const differenceMmHg = upperPressure(volumeMl) - lowerPressure(volumeMl);
    if (!Number.isFinite(differenceMmHg) || !(differenceMmHg > 0)) return null;
  }
  const areaMmHgMl = pressureDifferenceAreaV1(
    upperPressure,
    lowerPressure,
    startVolumeMl,
    endVolumeMl,
  );
  return Number.isFinite(areaMmHgMl) && areaMmHgMl > 0 ? areaMmHgMl : null;
}

function pressureDifferenceAreaV1(
  upperPressure: (volumeMl: number) => number,
  lowerPressure: (volumeMl: number) => number,
  startVolumeMl: number,
  endVolumeMl: number,
): number {
  if (
    ![startVolumeMl, endVolumeMl].every(Number.isFinite) ||
    !(endVolumeMl > startVolumeMl)
  ) {
    return Number.NaN;
  }
  const intervalWidthMl =
    (endVolumeMl - startVolumeMl) / PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1;
  let areaMmHgMl = 0;
  for (
    let index = 0;
    index <= PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1;
    index += 1
  ) {
    const volumeMl = startVolumeMl + index * intervalWidthMl;
    const differenceMmHg = upperPressure(volumeMl) - lowerPressure(volumeMl);
    if (!Number.isFinite(differenceMmHg)) return Number.NaN;
    areaMmHgMl +=
      (index === 0 || index === PRESSURE_AREA_INTEGRATION_INTERVAL_COUNT_V1
        ? 0.5
        : 1) * differenceMmHg;
  }
  return areaMmHgMl * intervalWidthMl;
}

type WeightedPressurePointV1 = Readonly<{
  point: Readonly<{ volumeMl: number; pressureMmHg: number }>;
  weight: number;
}>;

function volumeQuadratureWeightsV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): readonly WeightedPressurePointV1[] | null {
  if (
    points.length < 2 ||
    points.some(
      ({ volumeMl, pressureMmHg }) =>
        !Number.isFinite(volumeMl) || !Number.isFinite(pressureMmHg),
    )
  ) {
    return null;
  }
  const ordered = [...points].sort(
    (left, right) => left.volumeMl - right.volumeMl,
  );
  if (
    ordered
      .slice(1)
      .some(
        (point, index) => !(point.volumeMl - ordered[index]!.volumeMl > 1e-10),
      )
  ) {
    return null;
  }
  return Object.freeze(
    ordered.map((point, index) => {
      const left = ordered[index - 1];
      const right = ordered[index + 1];
      const weight =
        left === undefined
          ? 0.5 * (right!.volumeMl - point.volumeMl)
          : right === undefined
            ? 0.5 * (point.volumeMl - left.volumeMl)
            : 0.5 * (right.volumeMl - left.volumeMl);
      return Object.freeze({ point, weight });
    }),
  );
}

function weightedRSquaredV1(
  weighted: readonly WeightedPressurePointV1[],
  predict: (
    point: Readonly<{ volumeMl: number; pressureMmHg: number }>,
  ) => number,
): number {
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const mean =
    weighted.reduce(
      (sum, item) => sum + item.weight * item.point.pressureMmHg,
      0,
    ) / totalWeight;
  const total = weighted.reduce(
    (sum, item) => sum + item.weight * (item.point.pressureMmHg - mean) ** 2,
    0,
  );
  const residual = weighted.reduce((sum, item) => {
    const predicted = predict(item.point);
    return sum + item.weight * (item.point.pressureMmHg - predicted) ** 2;
  }, 0);
  return total > 0 ? 1 - residual / total : residual === 0 ? 1 : 0;
}

function pressureRelationsLeftIntersectionV1(
  systolicPressureMmHg: (volumeMl: number) => number,
  edpvr: ExponentialFitV1,
  searchStartVolumeMl: number,
  endVolumeMl: number,
): number | null {
  if (
    ![searchStartVolumeMl, endVolumeMl].every(Number.isFinite) ||
    searchStartVolumeMl < 0 ||
    !(endVolumeMl > searchStartVolumeMl)
  ) {
    return null;
  }
  const pressureDifferenceMmHg = (volumeMl: number) =>
    systolicPressureMmHg(volumeMl) -
    nonnegativeExponentialPressureV1(edpvr, volumeMl);
  let lowerVolumeMl = searchStartVolumeMl;
  let lowerDifferenceMmHg = pressureDifferenceMmHg(lowerVolumeMl);
  let upperVolumeMl = Number.NaN;
  let upperDifferenceMmHg = Number.NaN;
  const endDifferenceMmHg = pressureDifferenceMmHg(endVolumeMl);
  if (
    !Number.isFinite(lowerDifferenceMmHg) ||
    !Number.isFinite(endDifferenceMmHg) ||
    lowerDifferenceMmHg > 0 ||
    !(endDifferenceMmHg > 0)
  ) {
    return null;
  }
  for (let index = 1; index <= 256; index += 1) {
    const volumeMl =
      searchStartVolumeMl + (index / 256) * (endVolumeMl - searchStartVolumeMl);
    const differenceMmHg = pressureDifferenceMmHg(volumeMl);
    if (!Number.isFinite(differenceMmHg)) return null;
    if (lowerDifferenceMmHg <= 0 && differenceMmHg > 0) {
      upperVolumeMl = volumeMl;
      upperDifferenceMmHg = differenceMmHg;
      break;
    }
    lowerVolumeMl = volumeMl;
    lowerDifferenceMmHg = differenceMmHg;
  }
  if (!Number.isFinite(upperVolumeMl) || !(upperDifferenceMmHg > 0)) {
    return null;
  }
  if (lowerDifferenceMmHg <= 0) {
    for (let iteration = 0; iteration < 96; iteration += 1) {
      const midpointVolumeMl = 0.5 * (lowerVolumeMl + upperVolumeMl);
      const midpointDifferenceMmHg = pressureDifferenceMmHg(midpointVolumeMl);
      if (!Number.isFinite(midpointDifferenceMmHg)) return null;
      if (midpointDifferenceMmHg > 0) upperVolumeMl = midpointVolumeMl;
      else lowerVolumeMl = midpointVolumeMl;
    }
  }
  const intersectionVolumeMl =
    lowerDifferenceMmHg === 0
      ? lowerVolumeMl
      : 0.5 * (lowerVolumeMl + upperVolumeMl);
  // A nonlinear systolic locus can in principle re-cross the EDPVR. PVA is
  // admitted only when the first left intersection is followed by one
  // strictly positive pressure gap through the anchor end-systolic volume.
  for (let index = 1; index <= CURVE_SAMPLE_COUNT_V1; index += 1) {
    const volumeMl =
      intersectionVolumeMl +
      (index / CURVE_SAMPLE_COUNT_V1) * (endVolumeMl - intersectionVolumeMl);
    if (!(pressureDifferenceMmHg(volumeMl) > 0)) return null;
  }
  return intersectionVolumeMl;
}

function linearFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): LinearFitV1 | null {
  if (points.length < 2) return null;
  const meanX =
    points.reduce((sum, point) => sum + point.volumeMl, 0) / points.length;
  const meanY =
    points.reduce((sum, point) => sum + point.pressureMmHg, 0) / points.length;
  const variance = points.reduce(
    (sum, point) => sum + (point.volumeMl - meanX) ** 2,
    0,
  );
  const covariance = points.reduce(
    (sum, point) =>
      sum + (point.volumeMl - meanX) * (point.pressureMmHg - meanY),
    0,
  );
  if (!(variance > 1e-12)) return null;
  const slope = covariance / variance;
  const intercept = meanY - slope * meanX;
  if (!(slope > 0) || !Number.isFinite(intercept)) return null;
  return Object.freeze({
    slope,
    intercept,
    rSquared: rSquaredV1(
      points.map(({ pressureMmHg }) => pressureMmHg),
      points.map(({ volumeMl }) => slope * volumeMl + intercept),
    ),
  });
}

function exponentialFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): ExponentialFitV1 | null {
  const range = finiteRangeV1(points.map(({ volumeMl }) => volumeMl));
  const weighted = volumeQuadratureWeightsV1(points);
  if (range === null || weighted === null || weighted.length < 3) return null;
  const span = range[1] - range[0];
  const minimumV0 = range[0] - Math.max(20, 1.5 * span);
  const maximumV0 = range[0] - Math.max(0.05, span * 0.002);
  const minimumExponent = 0.001;
  const maximumExponent = Math.min(
    0.25,
    18 / Math.max(1, range[1] - minimumV0),
  );
  if (!(maximumExponent > minimumExponent)) return null;
  let best: (ExponentialFitV1 & Readonly<{ score: number }>) | null = null;
  for (let vOrdinal = 0; vOrdinal <= EDPVR_V0_GRID_COUNT_V1; vOrdinal += 1) {
    const volumeOffset =
      minimumV0 + (vOrdinal / EDPVR_V0_GRID_COUNT_V1) * (maximumV0 - minimumV0);
    for (
      let exponentOrdinal = 0;
      exponentOrdinal <= EDPVR_EXPONENT_GRID_COUNT_V1;
      exponentOrdinal += 1
    ) {
      const fraction = exponentOrdinal / EDPVR_EXPONENT_GRID_COUNT_V1;
      const exponent = Math.exp(
        Math.log(minimumExponent) +
          fraction * (Math.log(maximumExponent) - Math.log(minimumExponent)),
      );
      const basis = weighted.map(({ point }) =>
        Math.expm1(exponent * (point.volumeMl - volumeOffset)),
      );
      const denominator = basis.reduce(
        (sum, value, index) => sum + weighted[index]!.weight * value ** 2,
        0,
      );
      if (!(denominator > 0) || !Number.isFinite(denominator)) continue;
      const scale =
        weighted.reduce(
          (sum, item, index) =>
            sum + item.weight * item.point.pressureMmHg * basis[index]!,
          0,
        ) / denominator;
      if (!(scale > 0) || !Number.isFinite(scale)) continue;
      const predicted = basis.map((value) => scale * value);
      const score = weighted.reduce(
        (sum, item, index) =>
          sum +
          item.weight * (item.point.pressureMmHg - predicted[index]!) ** 2,
        0,
      );
      if (!Number.isFinite(score) || (best !== null && score >= best.score))
        continue;
      best = Object.freeze({
        scale,
        exponent,
        volumeOffset,
        score,
        rSquared: weightedRSquaredV1(
          weighted,
          ({ volumeMl }) =>
            scale * Math.expm1(exponent * (volumeMl - volumeOffset)),
        ),
        parameterBoundaryHit:
          vOrdinal === 0 ||
          vOrdinal === EDPVR_V0_GRID_COUNT_V1 ||
          exponentOrdinal === 0 ||
          exponentOrdinal === EDPVR_EXPONENT_GRID_COUNT_V1,
      });
    }
  }
  if (best === null) return null;
  const { score: _score, ...fit } = best;
  return Object.freeze(fit);
}

function nonnegativeExponentialPressureV1(
  fit: ExponentialFitV1,
  volumeMl: number,
): number {
  if (volumeMl <= fit.volumeOffset) return 0;
  return fit.scale * Math.expm1(fit.exponent * (volumeMl - fit.volumeOffset));
}

function sampleCurveV1(
  startVolumeMl: number,
  endVolumeMl: number,
  pressure: (volumeMl: number) => number,
): readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[] {
  if (!(endVolumeMl > startVolumeMl)) return Object.freeze([]);
  return Object.freeze(
    Array.from({ length: CURVE_SAMPLE_COUNT_V1 + 1 }, (_, index) => {
      const volumeMl =
        startVolumeMl +
        (index / CURVE_SAMPLE_COUNT_V1) * (endVolumeMl - startVolumeMl);
      return Object.freeze({ volumeMl, pressureMmHg: pressure(volumeMl) });
    }),
  );
}

function finiteRangeV1(
  values: readonly number[],
): readonly [number, number] | null {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value)))
    return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return maximum > minimum ? Object.freeze([minimum, maximum] as const) : null;
}

function finiteRangeAllowEqualV1(
  values: readonly number[],
): readonly [number, number] | null {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }
  return Object.freeze([Math.min(...values), Math.max(...values)] as const);
}

function rSquaredV1(
  observed: readonly number[],
  predicted: readonly number[],
): number {
  if (observed.length === 0 || observed.length !== predicted.length) return 0;
  const mean =
    observed.reduce((sum, value) => sum + value, 0) / observed.length;
  const total = observed.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  const residual = observed.reduce(
    (sum, value, index) => sum + (value - predicted[index]!) ** 2,
    0,
  );
  return total > 0 ? 1 - residual / total : residual === 0 ? 1 : 0;
}
