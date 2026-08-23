import type {
  MainWireIntegratedModelPressureVolumeLoopPointV3,
  MainWireIntegratedModelStarlingLocusV3,
  MainWireIntegratedModelStarlingPointV3,
} from "@/engine/myocardium/MainWireIntegratedModelGuytonStarlingOrientationV3";
import {
  evaluateMainWireIntegratedModelLvMvo2EstimateV1,
  type MainWireIntegratedModelLvMvo2EstimateV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelMvo2ReferenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3,
} from "@/engine/myocardium/MainWireIntegratedModelResponsiveStarlingProtocolV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_V1_ID =
  "main-wire-integrated-model-settled-hot-start-pva-v1" as const;
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_METHOD_V1_ID =
  "suga-pva-area-max-common-isochrone-exponential-edpvr-settled-preload-reduction-v2" as const;

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
  primaryCurveLaw:
    "density-weighted-monotone-quadratic" | "density-weighted-linear-fallback";
  selectedTimeSinceAtrialCaptureSec: number;
  selectedPhase01AtAnchor: number;
  activePressureAreaMmHgMl: number;
  activePressureAreaVolumeRangeMl: readonly [number, number];
  zeroPressureVolumeMl: number;
  elastanceMmHgPerMl: number;
  volumeAxisInterceptMl: number;
  localElastanceAtAnchorMmHgPerMl: number;
  rSquared: number;
  measuredVolumeRangeMl: readonly [number, number];
  fitPoints: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  curve: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
  nonlinearCurve: Readonly<{
    method: "density-weighted-quadratic-common-isochrone-fit";
    quadraticMmHgPerMl2: number;
    linearMmHgPerMl: number;
    interceptMmHg: number;
    rSquared: number;
    monotonicallyIncreasingAcrossMeasuredRange: boolean;
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
  method: "area-between-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv";
  leftIntersectionVolumeMl: number;
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
        "systolic-curve-uses-linear-endpoint-tangents-outside-measured-range",
        "coronary-tone-held-at-source-during-preload-reduction",
        "not-clinical-validation",
      ];
    }>;

type LinearFitV1 = Readonly<{
  slope: number;
  intercept: number;
  rSquared: number;
}>;

type WeightedQuadraticFitV1 = Readonly<{
  quadratic: number;
  linear: number;
  intercept: number;
  rSquared: number;
}>;

type SystolicPressureLawV1 = Readonly<{
  kind:
    "density-weighted-monotone-quadratic" | "density-weighted-linear-fallback";
  quadratic: number;
  linear: number;
  intercept: number;
  rSquared: number;
  measuredVolumeRangeMl: readonly [number, number];
}>;

type IsochronalPressureCandidateV1 = Readonly<{
  timeSinceAtrialCaptureSec: number;
  phase01AtAnchor: number;
  activePressureAreaMmHgMl: number;
  law: SystolicPressureLawV1;
  points: readonly MainWireIntegratedModelPeriodicPvaCurvePointV1[];
}>;

type AreaMaxCommonIsochroneV1 = Readonly<{
  selected: IsochronalPressureCandidateV1;
  linearSummary: LinearFitV1;
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
  const coreMinimumTbvMl =
    anchor.totalBloodVolumeMl *
    MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_MINIMUM_TBV_SCALE_V3;
  const tbvToleranceMl = Math.max(
    1e-6,
    Math.abs(anchor.totalBloodVolumeMl) * 1e-12,
  );
  const corePoints = Object.freeze(
    locus.points
      .filter(
        ({ totalBloodVolumeMl }) =>
          totalBloodVolumeMl <= anchor.totalBloodVolumeMl + tbvToleranceMl &&
          totalBloodVolumeMl >= coreMinimumTbvMl - tbvToleranceMl,
      )
      .sort(
        (left, right) => right.totalBloodVolumeMl - left.totalBloodVolumeMl,
      ),
  );
  progress = Object.freeze({
    completedPointCount: corePoints.length,
    totalPointCount: MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3,
  });
  const minimumCoreTbvReached = corePoints.some(
    ({ totalBloodVolumeMl }) =>
      totalBloodVolumeMl <= coreMinimumTbvMl + tbvToleranceMl,
  );
  const coreSamplingComplete =
    corePoints.length >=
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3 &&
    minimumCoreTbvReached;
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
      pointCount: corePoints.length,
      anchor: null,
      strokeWork,
      espvr: null,
      edpvr: null,
      potentialEnergy: null,
      pva: null,
      estimatedMvo2: null,
    });
  if (corePoints.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1) {
    return incomplete(
      "collecting",
      `${corePoints.length} settled points; three are required for relation preview`,
      anchorPreview,
    );
  }
  const semilunarClosure = corePoints.flatMap((point) => {
    const landmark = point.ventricularPressureVolumeLandmarks.endSystolic;
    return landmark.event === "semilunar-valve-closure" ? [landmark] : [];
  });
  const diastolic = corePoints
    .map(
      ({ ventricularPressureVolumeLandmarks }) =>
        ventricularPressureVolumeLandmarks.endDiastolic,
    )
    .filter(({ pressureMmHg }) => pressureMmHg > 0.05);
  const edpvr = exponentialFitV1(diastolic);
  const endSystolicVolumeRange = finiteRangeV1(
    corePoints.map(
      ({ ventricularPressureVolumeLandmarks }) =>
        ventricularPressureVolumeLandmarks.endSystolic.volumeMl,
    ),
  );
  const areaMaxIsochrone =
    edpvr === null || endSystolicVolumeRange === null
      ? null
      : areaMaxCommonIsochroneV1(
          corePoints,
          endSystolicVolumeRange,
          edpvr,
          anchor,
        );
  if (
    areaMaxIsochrone === null ||
    diastolic.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1 ||
    edpvr === null
  ) {
    return incomplete(
      coreSamplingComplete ? "unavailable" : "collecting",
      "Settled phased loops and positive-pressure filling landmarks do not define an area-max common isochrone and EDPVR",
      anchorPreview,
    );
  }
  const systolic = areaMaxIsochrone.selected.points;
  const systolicLaw = areaMaxIsochrone.selected.law;
  const espvr = areaMaxIsochrone.linearSummary;
  const espvrV0 = -espvr.intercept / espvr.slope;
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
  const systolicRange = finiteRangeV1(
    systolic.map(({ volumeMl }) => volumeMl),
  )!;
  const diastolicRange = finiteRangeV1(
    diastolic.map(({ volumeMl }) => volumeMl),
  )!;
  const semilunarClosureFit = linearFitV1(semilunarClosure);
  const systolicZeroPressureVolumeMl =
    systolicZeroPressureVolumeV1(systolicLaw);
  if (systolicZeroPressureVolumeMl === null) {
    return incomplete(
      coreSamplingComplete ? "unavailable" : "collecting",
      "The selected common isochrone does not define a finite left zero-pressure extension",
      anchorPreview,
    );
  }
  const espvrProjection: MainWireIntegratedModelPeriodicPvaEspvrV1 =
    Object.freeze({
      primaryMethod: "active-pressure-area-max-common-isochrone" as const,
      primaryCurveLaw: systolicLaw.kind,
      selectedTimeSinceAtrialCaptureSec:
        areaMaxIsochrone.selected.timeSinceAtrialCaptureSec,
      selectedPhase01AtAnchor: areaMaxIsochrone.selected.phase01AtAnchor,
      activePressureAreaMmHgMl:
        areaMaxIsochrone.selected.activePressureAreaMmHgMl,
      activePressureAreaVolumeRangeMl: endSystolicVolumeRange,
      zeroPressureVolumeMl: systolicZeroPressureVolumeMl,
      elastanceMmHgPerMl: espvr.slope,
      volumeAxisInterceptMl: espvrV0,
      localElastanceAtAnchorMmHgPerMl: systolicPressureSlopeV1(
        systolicLaw,
        anchorEndSystolic.volumeMl,
      ),
      rSquared: espvr.rSquared,
      measuredVolumeRangeMl: systolicRange,
      fitPoints: Object.freeze(
        systolic.map((point) => Object.freeze({ ...point })),
      ),
      curve: sampleCurveV1(
        systolicZeroPressureVolumeMl,
        systolicRange[1],
        (volumeMl) => Math.max(0, systolicPressureV1(systolicLaw, volumeMl)),
      ),
      nonlinearCurve:
        systolicLaw.kind === "density-weighted-monotone-quadratic"
          ? Object.freeze({
              method:
                "density-weighted-quadratic-common-isochrone-fit" as const,
              quadraticMmHgPerMl2: systolicLaw.quadratic,
              linearMmHgPerMl: systolicLaw.linear,
              interceptMmHg: systolicLaw.intercept,
              rSquared: systolicLaw.rSquared,
              monotonicallyIncreasingAcrossMeasuredRange: true,
            })
          : null,
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
      pointCount: corePoints.length,
      anchor: anchorProjection,
      strokeWork,
      espvr: espvrProjection,
      edpvr: edpvrProjection,
      potentialEnergy: null,
      pva: null,
      estimatedMvo2: null,
    });
  if (corePoints.length < MINIMUM_PVA_PREVIEW_POINT_COUNT_V1) {
    return incomplete(
      "collecting",
      `${corePoints.length} settled points; five are required for provisional PVA`,
      relationsPreview,
    );
  }
  const peLeftIntersectionVolumeMl = espvrEdpvrLeftIntersectionV1(
    systolicLaw,
    edpvr,
    systolicZeroPressureVolumeMl,
    anchorEndSystolic.volumeMl,
  );
  if (peLeftIntersectionVolumeMl === null) {
    return incomplete(
      coreSamplingComplete ? "unavailable" : "collecting",
      "PE requires one left ESPVR–EDPVR intersection followed by P_es > P_ed through anchor ESV",
      relationsPreview,
    );
  }
  const potentialEnergyMmHgMl = pressureDifferenceAreaV1(
    (volumeMl) => systolicPressureV1(systolicLaw, volumeMl),
    (volumeMl) => nonnegativeExponentialPressureV1(edpvr, volumeMl),
    peLeftIntersectionVolumeMl,
    anchorEndSystolic.volumeMl,
  );
  const pvaMmHgMl = strokeWorkMmHgMl + potentialEnergyMmHgMl;
  if (
    ![
      espvrV0,
      peLeftIntersectionVolumeMl,
      strokeWorkMmHgMl,
      potentialEnergyMmHgMl,
      pvaMmHgMl,
    ].every(Number.isFinite) ||
    !(anchorEndSystolic.volumeMl > systolicZeroPressureVolumeMl) ||
    !(anchorEndSystolic.volumeMl > peLeftIntersectionVolumeMl) ||
    !(strokeWorkMmHgMl > 0) ||
    !(potentialEnergyMmHgMl >= 0) ||
    !(pvaMmHgMl > 0)
  ) {
    return incomplete(
      coreSamplingComplete ? "unavailable" : "collecting",
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
      "area-between-espvr-and-nonnegative-edpvr-from-left-intersection-to-anchor-esv" as const,
    leftIntersectionVolumeMl: peLeftIntersectionVolumeMl,
    mmHgMl: potentialEnergyMmHgMl,
    joule: potentialEnergyMmHgMl * MMHG_ML_TO_JOULE_V1,
  });
  const pva: PeriodicPvaAreaV1 = Object.freeze({
    definition: "PVA = SW + PE" as const,
    mmHgMl: pvaMmHgMl,
    joule: pvaJ,
  });
  const pvaPreview: MainWireIntegratedModelPeriodicPvaPreviewV1 = Object.freeze(
    {
      stage: "pva" as const,
      pointCount: corePoints.length,
      anchor: anchorProjection,
      strokeWork,
      espvr: espvrProjection,
      edpvr: edpvrProjection,
      potentialEnergy,
      pva,
      estimatedMvo2,
    },
  );
  if (!coreSamplingComplete) {
    return incomplete(
      "collecting",
      `${corePoints.length} settled points; refining provisional PVA to at least ${MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PVA_CORE_POINT_COUNT_V3} points and 60% TBV`,
      pvaPreview,
    );
  }
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
      pointCount: corePoints.length,
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
      "systolic-curve-uses-linear-endpoint-tangents-outside-measured-range",
      "coronary-tone-held-at-source-during-preload-reduction",
      "not-clinical-validation",
    ] as const),
  });
}

function areaMaxCommonIsochroneV1(
  points: readonly MainWireIntegratedModelStarlingPointV3[],
  integrationVolumeRangeMl: readonly [number, number],
  edpvr: ExponentialFitV1,
  anchor: MainWireIntegratedModelStarlingPointV3,
): AreaMaxCommonIsochroneV1 | null {
  if (points.length < MINIMUM_RELATION_PREVIEW_POINT_COUNT_V1) return null;
  const beatDurationsSec = points.map(
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
    const sampled = points.map((point) =>
      interpolateLoopAtTimeV1(
        point.ventricularPressureVolumeLoop,
        point.acceptedBeatDurationSec,
        timeSinceAtrialCaptureSec,
      ),
    );
    if (sampled.some((point) => point === null)) continue;
    const owned = sampled as MainWireIntegratedModelPeriodicPvaCurvePointV1[];
    const law = fitSystolicPressureLawV1(owned);
    if (law === null) continue;
    const activePressureAreaMmHgMl = pressureDifferenceAreaV1(
      (volumeMl) => systolicPressureV1(law, volumeMl),
      (volumeMl) => nonnegativeExponentialPressureV1(edpvr, volumeMl),
      integrationVolumeRangeMl[0],
      integrationVolumeRangeMl[1],
    );
    if (!Number.isFinite(activePressureAreaMmHgMl)) continue;
    candidates.push(
      Object.freeze({
        timeSinceAtrialCaptureSec,
        phase01AtAnchor:
          timeSinceAtrialCaptureSec / anchor.acceptedBeatDurationSec,
        activePressureAreaMmHgMl,
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
  const selectedAdmissibleAreaMmHgMl = positivePressureDifferenceAreaV1(
    (volumeMl) => systolicPressureV1(selected.law, volumeMl),
    (volumeMl) => nonnegativeExponentialPressureV1(edpvr, volumeMl),
    integrationVolumeRangeMl[0],
    integrationVolumeRangeMl[1],
  );
  if (selectedAdmissibleAreaMmHgMl === null) return null;
  const linearSummary = densityWeightedLinearFitV1(selected.points);
  if (linearSummary === null) return null;
  const pressureEnvelope = pressureEnvelopeDiagnosticV1(
    candidates,
    selected,
    integrationVolumeRangeMl,
    anchor.acceptedBeatDurationSec,
  );
  if (pressureEnvelope === null) return null;
  return Object.freeze({ selected, linearSummary, pressureEnvelope });
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
      let winner = candidates[0]!;
      let maximumPressureMmHg = systolicPressureV1(winner.law, volumeMl);
      for (const candidate of candidates.slice(1)) {
        const pressureMmHg = systolicPressureV1(candidate.law, volumeMl);
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
      let maximumPressureMmHg = Number.NEGATIVE_INFINITY;
      for (const candidate of candidates) {
        maximumPressureMmHg = Math.max(
          maximumPressureMmHg,
          systolicPressureV1(candidate.law, volumeMl),
        );
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
  const measuredVolumeRangeMl = finiteRangeV1(
    points.map(({ volumeMl }) => volumeMl),
  );
  const linear = densityWeightedLinearFitV1(points);
  if (measuredVolumeRangeMl === null || linear === null) return null;
  const quadratic =
    points.length >= MINIMUM_PVA_PREVIEW_POINT_COUNT_V1
      ? densityWeightedQuadraticFitV1(points)
      : null;
  if (
    quadratic !== null &&
    quadratic.rSquared >= linear.rSquared - 1e-12 &&
    2 * quadratic.quadratic * measuredVolumeRangeMl[0] + quadratic.linear > 0 &&
    2 * quadratic.quadratic * measuredVolumeRangeMl[1] + quadratic.linear > 0
  ) {
    return Object.freeze({
      kind: "density-weighted-monotone-quadratic" as const,
      quadratic: quadratic.quadratic,
      linear: quadratic.linear,
      intercept: quadratic.intercept,
      rSquared: quadratic.rSquared,
      measuredVolumeRangeMl,
    });
  }
  return Object.freeze({
    kind: "density-weighted-linear-fallback" as const,
    quadratic: 0,
    linear: linear.slope,
    intercept: linear.intercept,
    rSquared: linear.rSquared,
    measuredVolumeRangeMl,
  });
}

function systolicPressureV1(
  law: SystolicPressureLawV1,
  volumeMl: number,
): number {
  const [minimumVolumeMl, maximumVolumeMl] = law.measuredVolumeRangeMl;
  if (volumeMl < minimumVolumeMl) {
    return (
      polynomialPressureV1(law, minimumVolumeMl) +
      systolicPressureSlopeV1(law, minimumVolumeMl) *
        (volumeMl - minimumVolumeMl)
    );
  }
  if (volumeMl > maximumVolumeMl) {
    return (
      polynomialPressureV1(law, maximumVolumeMl) +
      systolicPressureSlopeV1(law, maximumVolumeMl) *
        (volumeMl - maximumVolumeMl)
    );
  }
  return polynomialPressureV1(law, volumeMl);
}

function polynomialPressureV1(
  law: SystolicPressureLawV1,
  volumeMl: number,
): number {
  return law.quadratic * volumeMl ** 2 + law.linear * volumeMl + law.intercept;
}

function systolicPressureSlopeV1(
  law: SystolicPressureLawV1,
  volumeMl: number,
): number {
  const boundedVolumeMl = Math.max(
    law.measuredVolumeRangeMl[0],
    Math.min(law.measuredVolumeRangeMl[1], volumeMl),
  );
  return 2 * law.quadratic * boundedVolumeMl + law.linear;
}

function systolicZeroPressureVolumeV1(
  law: SystolicPressureLawV1,
): number | null {
  const minimumVolumeMl = law.measuredVolumeRangeMl[0];
  const pressureMmHg = polynomialPressureV1(law, minimumVolumeMl);
  const slopeMmHgPerMl = systolicPressureSlopeV1(law, minimumVolumeMl);
  if (
    ![pressureMmHg, slopeMmHgPerMl].every(Number.isFinite) ||
    !(slopeMmHgPerMl > 0)
  ) {
    return null;
  }
  const zeroPressureVolumeMl = minimumVolumeMl - pressureMmHg / slopeMmHgPerMl;
  return Number.isFinite(zeroPressureVolumeMl) ? zeroPressureVolumeMl : null;
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

function densityWeightedLinearFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): LinearFitV1 | null {
  const weighted = volumeQuadratureWeightsV1(points);
  if (weighted === null) return null;
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const meanX =
    weighted.reduce((sum, item) => sum + item.weight * item.point.volumeMl, 0) /
    totalWeight;
  const meanY =
    weighted.reduce(
      (sum, item) => sum + item.weight * item.point.pressureMmHg,
      0,
    ) / totalWeight;
  const variance = weighted.reduce(
    (sum, item) => sum + item.weight * (item.point.volumeMl - meanX) ** 2,
    0,
  );
  const covariance = weighted.reduce(
    (sum, item) =>
      sum +
      item.weight *
        (item.point.volumeMl - meanX) *
        (item.point.pressureMmHg - meanY),
    0,
  );
  if (!(variance > 1e-12)) return null;
  const slope = covariance / variance;
  const intercept = meanY - slope * meanX;
  if (!(slope > 0) || !Number.isFinite(intercept)) return null;
  return Object.freeze({
    slope,
    intercept,
    rSquared: weightedRSquaredV1(
      weighted,
      ({ volumeMl }) => slope * volumeMl + intercept,
    ),
  });
}

function densityWeightedQuadraticFitV1(
  points: readonly Readonly<{ volumeMl: number; pressureMmHg: number }>[],
): WeightedQuadraticFitV1 | null {
  const weighted = volumeQuadratureWeightsV1(points);
  if (weighted === null || weighted.length < 3) return null;
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const center =
    weighted.reduce((sum, item) => sum + item.weight * item.point.volumeMl, 0) /
    totalWeight;
  const sums = weighted.reduce(
    (accumulator, item) => {
      const x = item.point.volumeMl - center;
      const y = item.point.pressureMmHg;
      const w = item.weight;
      accumulator.s0 += w;
      accumulator.s1 += w * x;
      accumulator.s2 += w * x ** 2;
      accumulator.s3 += w * x ** 3;
      accumulator.s4 += w * x ** 4;
      accumulator.sy += w * y;
      accumulator.sxy += w * x * y;
      accumulator.sx2y += w * x ** 2 * y;
      return accumulator;
    },
    { s0: 0, s1: 0, s2: 0, s3: 0, s4: 0, sy: 0, sxy: 0, sx2y: 0 },
  );
  const centered = solveThreeByThreeV1(
    [
      [sums.s4, sums.s3, sums.s2],
      [sums.s3, sums.s2, sums.s1],
      [sums.s2, sums.s1, sums.s0],
    ],
    [sums.sx2y, sums.sxy, sums.sy],
  );
  if (centered === null) return null;
  const [quadratic, centeredLinear, centeredIntercept] = centered;
  const linear = centeredLinear - 2 * quadratic * center;
  const intercept =
    quadratic * center ** 2 - centeredLinear * center + centeredIntercept;
  if (![quadratic, linear, intercept].every(Number.isFinite)) return null;
  return Object.freeze({
    quadratic,
    linear,
    intercept,
    rSquared: weightedRSquaredV1(
      weighted,
      ({ volumeMl }) =>
        quadratic * volumeMl ** 2 + linear * volumeMl + intercept,
    ),
  });
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

function espvrEdpvrLeftIntersectionV1(
  systolicLaw: SystolicPressureLawV1,
  edpvr: ExponentialFitV1,
  systolicZeroPressureVolumeMl: number,
  endVolumeMl: number,
): number | null {
  if (
    ![systolicZeroPressureVolumeMl, endVolumeMl].every(Number.isFinite) ||
    !(endVolumeMl > systolicZeroPressureVolumeMl)
  ) {
    return null;
  }
  const pressureDifferenceMmHg = (volumeMl: number) =>
    systolicPressureV1(systolicLaw, volumeMl) -
    nonnegativeExponentialPressureV1(edpvr, volumeMl);
  let lowerVolumeMl = systolicZeroPressureVolumeMl;
  let upperVolumeMl = endVolumeMl;
  const lowerDifferenceMmHg = pressureDifferenceMmHg(lowerVolumeMl);
  const upperDifferenceMmHg = pressureDifferenceMmHg(upperVolumeMl);
  if (
    !Number.isFinite(lowerDifferenceMmHg) ||
    !Number.isFinite(upperDifferenceMmHg) ||
    lowerDifferenceMmHg > 0 ||
    !(upperDifferenceMmHg > 0)
  ) {
    return null;
  }
  if (lowerDifferenceMmHg < 0) {
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
  // The explicit interval gate is retained even though linear-minus-convex is
  // concave: it keeps the numerical PE contract readable and catches any
  // future change to either pressure law.
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

function solveThreeByThreeV1(
  matrix: readonly (readonly [number, number, number])[],
  vector: readonly [number, number, number],
): readonly [number, number, number] | null {
  const augmented = matrix.map((row, index) => [
    row[0],
    row[1],
    row[2],
    vector[index]!,
  ]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (
        Math.abs(augmented[row]![column]!) >
        Math.abs(augmented[pivot]![column]!)
      )
        pivot = row;
    }
    if (!(Math.abs(augmented[pivot]![column]!) > 1e-18)) return null;
    [augmented[column], augmented[pivot]] = [
      augmented[pivot]!,
      augmented[column]!,
    ];
    const divisor = augmented[column]![column]!;
    for (let entry = column; entry < 4; entry += 1) {
      augmented[column]![entry] = augmented[column]![entry]! / divisor;
    }
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row]![column]!;
      for (let entry = column; entry < 4; entry += 1) {
        augmented[row]![entry] =
          augmented[row]![entry]! - factor * augmented[column]![entry]!;
      }
    }
  }
  const result = [
    augmented[0]![3]!,
    augmented[1]![3]!,
    augmented[2]![3]!,
  ] as const;
  return result.every(Number.isFinite) ? Object.freeze(result) : null;
}
