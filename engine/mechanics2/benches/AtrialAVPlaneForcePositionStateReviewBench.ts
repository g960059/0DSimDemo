import {
  applyAtrialAVPlaneWorkConjugateReviewVariantV1,
  ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneWorkConjugateReviewBench";
import {
  applyAtrialAVPlaneTractionReservoirTransactionVariantV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneTractionReservoirTransactionBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildAVPlaneWorkCoordinateSeriesV1,
  summarizeAVPlaneWorkCoordinateSeriesV1,
  type AVPlaneWorkCoordinateSummaryV1,
} from "@/engine/mechanics2/core/AVPlaneWorkCoordinateStateV1";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_FORCE_POSITION_STATE_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-force-position-state-review-report-v1" as const;

type VariantIdV1 =
  | "raw-velocity-traction-reference"
  | "force3-stiff2-damp05-mass035"
  | "force4-stiff2-damp06-mass035"
  | "force4-stiff3-damp08-mass035"
  | "force5-stiff4-damp10-mass035"
  | "force6-stiff5-damp12-mass050"
  | "force8-stiff2-damp04-mass035-fast"
  | "force10-stiff3-damp06-mass035-fast"
  | "force12-stiff4-damp08-mass050-fast";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mode: "raw-reference" | "force-position";
  readonly driveForceN: number;
  readonly stiffnessNPerNorm: number;
  readonly dampingNsecPerNorm: number;
  readonly massKg: number;
  readonly maxVelocityNormPerSec: number;
};

type LobeQualityV1 = {
  readonly pass: boolean;
  readonly selfIntersections: number;
  readonly opposedSignedLobes: boolean;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly volumeSeparationMl: number;
  readonly failureReasons: readonly string[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: VariantIdV1;
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly topologyStatus: "pass" | "fail";
  readonly mvfClean: boolean;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly lobeQuality: LobeQualityV1;
  readonly coordinateSummary: AVPlaneWorkCoordinateSummaryV1;
  readonly maxStateZNorm: number;
  readonly maxStateZDotNormPerSec: number;
  readonly maxDriveForceN: number;
  readonly maxStatePressureMmHg: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly topologyPass: number;
  readonly mvfCleanCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly workClosureCleanCount: number;
  readonly maxDisplacementObservedMm: number;
  readonly maxVelocityAbsCmPerSec: number;
  readonly maxTractionForceN: number;
  readonly maxPositivePowerW: number;
  readonly maxTotalPositiveWorkJ: number;
  readonly maxStateZNorm: number;
  readonly maxStateZDotNormPerSec: number;
  readonly maxDriveForceN: number;
  readonly maxStatePressureMmHg: number;
};

export type AtrialAVPlaneForcePositionStateReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_FORCE_POSITION_STATE_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneForcePositionStateReviewV1";
  readonly mode: "left-heart-av-plane-force-position-state-review-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawReference: VariantSummaryV1;
  readonly bestForcePositionVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly bestForceVariantId: VariantIdV1;
    readonly bestForceSourceSurfacePass: number;
    readonly bestForceTopologyPass: number;
    readonly bestForceMvfCleanCount: number;
    readonly forceVariantsPreservingRawTopologyAndSource: number;
    readonly forcePositionStatus:
      | "force-position-state-promotion-signal"
      | "force-position-state-mixed"
      | "force-position-state-no-go";
  };
  readonly decision: {
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly hiddenBloodVolumeSource: false;
    readonly pressureSubstitution: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;
const PRE_A_THETA = 0.74;
const ANNULAR_AREA_CM2 = 20 / 1.2;
const MAX_DISPLACEMENT_MM = 12;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const BASE_TRACTION_VARIANT = {
  variantId: "traction12-flow10-cap20",
  reservoirCapacityGainMl: 20,
  venousCouplingGain: 1.0,
  maxKinematicFlowMlPerSec: 90,
  tractionGainMmHgPerNormPerSec: 1.2,
  pulmonarySourcePressureDeltaMmHg: 1.0,
  pulmonaryComplianceMlPerMmHg: 30,
  pulmonaryToLaResistanceMultiplier: 1.0,
  ejectionRateStartMlPerSec: 18,
  ejectionRateEndMlPerSec: 60,
  reservoirStartTheta: 0.06,
  reservoirEndTheta: 0.58,
  riseTauSec: 0.055,
  fallTauSec: 0.30,
  releaseTauSec: 0.085,
  mvClosedThreshold01: 0.20,
} as const;

const BASELINE_NO_AV_PLANE_VARIANT = {
  ...BASE_TRACTION_VARIANT,
  variantId: "compliance-node-no-avplane",
  reservoirCapacityGainMl: 0,
  venousCouplingGain: 0,
  maxKinematicFlowMlPerSec: 0,
  tractionGainMmHgPerNormPerSec: 0,
} as const;

export const ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-velocity-traction-reference", "raw-reference", 0, 0, 0, 0.035, 1.8),
  variant("force3-stiff2-damp05-mass035", "force-position", 3, 2, 0.5, 0.035, 1.8),
  variant("force4-stiff2-damp06-mass035", "force-position", 4, 2, 0.6, 0.035, 2.0),
  variant("force4-stiff3-damp08-mass035", "force-position", 4, 3, 0.8, 0.035, 2.0),
  variant("force5-stiff4-damp10-mass035", "force-position", 5, 4, 1.0, 0.035, 2.2),
  variant("force6-stiff5-damp12-mass050", "force-position", 6, 5, 1.2, 0.050, 2.0),
  variant("force8-stiff2-damp04-mass035-fast", "force-position", 8, 2, 0.4, 0.035, 3.2),
  variant("force10-stiff3-damp06-mass035-fast", "force-position", 10, 3, 0.6, 0.035, 3.4),
  variant("force12-stiff4-damp08-mass050-fast", "force-position", 12, 4, 0.8, 0.050, 3.0),
];

export function runAtrialAVPlaneForcePositionStateReviewBenchV1():
AtrialAVPlaneForcePositionStateReviewReportV1 {
  const rawParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rawWorkVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((candidate) =>
    candidate.variantId === "raw-velocity-traction12-flow10-cap20"
  )!;
  const baselineRuns = rawParams.map((params) =>
    runLeftHeartSubsystemV2(applyAtrialAVPlaneTractionReservoirTransactionVariantV1(
      params,
      BASELINE_NO_AV_PLANE_VARIANT,
    ))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1.map((variantConfig) => {
      const params = variantConfig.mode === "raw-reference"
        ? applyAtrialAVPlaneWorkConjugateReviewVariantV1(rawParams[index]!, rawWorkVariant)
        : applyForcePositionVariant(rawParams[index]!, variantConfig);
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, runLeftHeartSubsystemV2(params));
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawReference = variantSummaries.find((summary) =>
    summary.variantId === "raw-velocity-traction-reference"
  )!;
  const forceSummaries = variantSummaries.filter((summary) => summary.variantId !== rawReference.variantId);
  const bestForcePositionVariant = [...forceSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || b.hiddenVolumeCleanCount - a.hiddenVolumeCleanCount
    || b.workClosureCleanCount - a.workClosureCleanCount
  )[0]!;
  const forceVariantsPreservingRawTopologyAndSource = forceSummaries.filter((summary) =>
    summary.topologyPass >= rawReference.topologyPass
    && summary.sourceSurfacePass >= rawReference.sourceSurfacePass
  ).length;
  const forcePositionStatus = forceVariantsPreservingRawTopologyAndSource > 0
    ? "force-position-state-promotion-signal"
    : bestForcePositionVariant.topologyPass > 0 || bestForcePositionVariant.sourceSurfacePass > 0
      ? "force-position-state-mixed"
      : "force-position-state-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_FORCE_POSITION_STATE_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneForcePositionStateReviewV1",
    mode: "left-heart-av-plane-force-position-state-review-no-runtime",
    variants: ATRIAL_AV_PLANE_FORCE_POSITION_STATE_VARIANTS_V1,
    rows,
    variantSummaries,
    rawReference,
    bestForcePositionVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawReference.sourceSurfacePass,
      rawTopologyPass: rawReference.topologyPass,
      rawMvfCleanCount: rawReference.mvfCleanCount,
      bestForceVariantId: bestForcePositionVariant.variantId,
      bestForceSourceSurfacePass: bestForcePositionVariant.sourceSurfacePass,
      bestForceTopologyPass: bestForcePositionVariant.topologyPass,
      bestForceMvfCleanCount: bestForcePositionVariant.mvfCleanCount,
      forceVariantsPreservingRawTopologyAndSource,
      forcePositionStatus,
    },
    decision: {
      nextAction: forcePositionStatus === "force-position-state-promotion-signal"
        ? "Promote the explicit force-position coordinate as the next AV-plane contract surface, still without runtime wiring or morphology acceptance."
        : "Do not promote this force-position state as-is. Use the readbacks to decide whether force timing, coordinate inertia, or LA/MV transaction ownership must change.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "hidden-blood-volume-source",
        "atrial-pressure-substitution",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      hiddenBloodVolumeSource: false,
      pressureSubstitution: false,
      LandAtrialUnlock: false,
    },
  };
}

function applyForcePositionVariant(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const base = applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, BASE_TRACTION_VARIANT);
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-force-position-reservoir-transaction-v1",
    laEffectiveGeometryMode: "av-plane-force-position-reservoir-transaction-v1",
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec: 0,
    laAVPlaneWorkCoordinateAnnularAreaCm2: ANNULAR_AREA_CM2,
    laAVPlaneWorkCoordinateDriveForceN: variantConfig.driveForceN,
    laAVPlaneWorkCoordinateStiffnessNPerNorm: variantConfig.stiffnessNPerNorm,
    laAVPlaneWorkCoordinateDampingNsecPerNorm: variantConfig.dampingNsecPerNorm,
    laAVPlaneWorkCoordinateMassKg: variantConfig.massKg,
    laAVPlaneWorkCoordinateMaxVelocityNormPerSec: variantConfig.maxVelocityNormPerSec,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantConfig: VariantV1,
  baseline: ReturnType<typeof runLeftHeartSubsystemV2>,
  run: ReturnType<typeof runLeftHeartSubsystemV2>,
): RowV1 {
  const beat = run.finalBeatSamples;
  const baselineBeat = baseline.finalBeatSamples;
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baseline.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const mvForwardVolumeRatio = round(
    forwardFlowVolume(qMv, dtSec)
      / Math.max(forwardFlowVolume(baselineBeat.map((sample) => sample.qMvMlPerSec), baselineDtSec), 1e-9),
  );
  const aovForwardVolumeRatio = round(
    forwardFlowVolume(qAov, dtSec)
      / Math.max(forwardFlowVolume(baselineBeat.map((sample) => sample.qAovMlPerSec), baselineDtSec), 1e-9),
  );
  const lobeQuality = lobeQualityFor(beat);
  const coordinateSeries = buildAVPlaneWorkCoordinateSeriesV1(beat.map((sample) => ({
    theta: sample.theta,
    zAvNorm: sample.avPlaneGeometryReadback.zAvNorm,
    atrialGeometryDeltaMl: sample.laReservoirGeometryDeltaMl,
    tractionPressureMmHg: sample.laAVPlaneReservoirTractionPressureMmHg,
    hiddenBloodVolumeSourceMl: sample.laEffectiveGeometryHiddenBloodVolumeSourceMl,
  })), dtSec, {
    side: "left",
    annularAreaCm2: ANNULAR_AREA_CM2,
    maxDisplacementMm: MAX_DISPLACEMENT_MM,
  });
  const coordinateSummary = summarizeAVPlaneWorkCoordinateSeriesV1(coordinateSeries);
  const sourceFailures = sourceSurfaceFailureReasons({
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
  });
  const topologyFailures = lobeQuality.pass ? [] : ["la-pv-lobe-quality-fail"];
  const hiddenVolumeFailures = coordinateSummary.maxHiddenBloodVolumeSourceMl === 0
    ? []
    : ["hidden-blood-volume-source"];
  const workFailures = coordinateSummary.maxCoordinateVolumeErrorMl < 1e-6
    && coordinateSummary.maxWorkClosureErrorJ < 1e-6
    ? []
    : ["work-coordinate-closure-error"];
  return {
    profileId,
    variantId: variantConfig.variantId,
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    topologyStatus: topologyFailures.length === 0 && hiddenVolumeFailures.length === 0 ? "pass" : "fail",
    mvfClean: mvForwardPeakCount === 2 && mvShape.c1ContinuityScore <= 0.42,
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    lobeQuality,
    coordinateSummary,
    maxStateZNorm: round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateZNorm))),
    maxStateZDotNormPerSec:
      round(maxAbs(beat.map((sample) => sample.laAVPlaneWorkCoordinateZDotNormPerSec))),
    maxDriveForceN: round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinateDriveForceN))),
    maxStatePressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.laAVPlaneWorkCoordinatePressureMmHg))),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    failureReasons: [
      ...sourceFailures,
      ...topologyFailures,
      ...hiddenVolumeFailures,
      ...workFailures,
    ],
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    topologyPass: rows.filter((row) => row.topologyStatus === "pass").length,
    mvfCleanCount: rows.filter((row) => row.mvfClean).length,
    hiddenVolumeCleanCount:
      rows.filter((row) => row.coordinateSummary.maxHiddenBloodVolumeSourceMl === 0).length,
    workClosureCleanCount: rows.filter((row) =>
      row.coordinateSummary.maxCoordinateVolumeErrorMl < 1e-6
      && row.coordinateSummary.maxWorkClosureErrorJ < 1e-6
    ).length,
    maxDisplacementObservedMm:
      round(Math.max(0, ...rows.map((row) => row.coordinateSummary.maxDisplacementObservedMm))),
    maxVelocityAbsCmPerSec:
      round(Math.max(0, ...rows.map((row) => row.coordinateSummary.maxVelocityAbsCmPerSec))),
    maxTractionForceN:
      round(Math.max(0, ...rows.map((row) => row.coordinateSummary.maxTractionForceN))),
    maxPositivePowerW:
      round(Math.max(0, ...rows.map((row) => row.coordinateSummary.maxPositivePowerW))),
    maxTotalPositiveWorkJ:
      round(Math.max(0, ...rows.map((row) => row.coordinateSummary.totalPositiveWorkJ))),
    maxStateZNorm: round(Math.max(0, ...rows.map((row) => row.maxStateZNorm))),
    maxStateZDotNormPerSec: round(Math.max(0, ...rows.map((row) => row.maxStateZDotNormPerSec))),
    maxDriveForceN: round(Math.max(0, ...rows.map((row) => row.maxDriveForceN))),
    maxStatePressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxStatePressureMmHg))),
  };
}

function sourceSurfaceFailureReasons(row: {
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
}): readonly string[] {
  const failures: string[] = [];
  if (row.mvForwardPeakCount !== 2) failures.push("mv-forward-peak-count");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mv-c1-kink");
  if (row.mvForwardVolumeRatio < 0.72 || row.mvForwardVolumeRatio > 1.32) failures.push("mv-forward-volume-ratio");
  if (row.aovForwardVolumeRatio < 0.72 || row.aovForwardVolumeRatio > 1.32) failures.push("aov-forward-volume-ratio");
  if (row.maxMassResidualAbsMl > 1e-6) failures.push("mass-residual");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function lobeQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): LobeQualityV1 {
  const preA = samples.filter((sample) => sample.theta <= PRE_A_THETA);
  const aLoop = samples.filter((sample) => sample.theta >= PRE_A_THETA);
  const selfIntersections = countSelfIntersections(samples);
  const signedALoop = signedArea(aLoop);
  const signedVLoop = signedArea(preA);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const aMeanVolume = mean(aLoop.map((sample) => sample.acceptedLaVolumeMl));
  const vMeanVolume = mean(preA.map((sample) => sample.acceptedLaVolumeMl));
  const volumeSeparation = Math.abs(aMeanVolume - vMeanVolume);
  const failureReasons: string[] = [];
  if (selfIntersections < 1) failureReasons.push("self-intersection");
  if (signedALoop * signedVLoop >= 0) failureReasons.push("same-signed-lobes");
  if (aLoopArea < 1.2) failureReasons.push("a-loop-area");
  if (vLoopArea < 1.2) failureReasons.push("v-loop-area");
  if (volumeSeparation < 2.0) failureReasons.push("lobe-volume-separation");
  return {
    pass: failureReasons.length === 0,
    selfIntersections,
    opposedSignedLobes: signedALoop * signedVLoop < 0,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    volumeSeparationMl: round(volumeSeparation),
    failureReasons,
  };
}

function positivePeakCount(values: readonly number[]): number {
  let count = 0;
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(maxValue * 0.18, 1e-6);
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i]! > threshold && values[i]! >= values[i - 1]! && values[i]! > values[i + 1]!) count++;
  }
  return count;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + Math.max(0, value) * dtSec, 0);
}

function countSelfIntersections(samples: readonly LeftHeartSubsystemSampleV2[]): number {
  let count = 0;
  const points = samples.map((sample) => ({ x: sample.acceptedLaVolumeMl, y: sample.lapMmHg }));
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue;
      if (segmentsIntersect(points[i]!, points[i + 1]!, points[j]!, points[j + 1]!)) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number },
  c: { readonly x: number; readonly y: number },
  d: { readonly x: number; readonly y: number },
): boolean {
  const d1 = direction(c, d, a);
  const d2 = direction(c, d, b);
  const d3 = direction(a, b, c);
  const d4 = direction(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0))
    && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number },
  c: { readonly x: number; readonly y: number },
): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

function signedArea(samples: readonly LeftHeartSubsystemSampleV2[]): number {
  if (samples.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < samples.length; i++) {
    const current = samples[i]!;
    const next = samples[(i + 1) % samples.length]!;
    area += current.acceptedLaVolumeMl * next.lapMmHg - next.acceptedLaVolumeMl * current.lapMmHg;
  }
  return area / 2;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function variant(
  variantId: VariantIdV1,
  mode: VariantV1["mode"],
  driveForceN: number,
  stiffnessNPerNorm: number,
  dampingNsecPerNorm: number,
  massKg: number,
  maxVelocityNormPerSec: number,
): VariantV1 {
  return {
    variantId,
    mode,
    driveForceN,
    stiffnessNPerNorm,
    dampingNsecPerNorm,
    massKg,
    maxVelocityNormPerSec,
  };
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
