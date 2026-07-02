import {
  applyAtrialAVPlaneTractionReservoirTransactionVariantV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneTractionReservoirTransactionBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-velocity-stateful-traction-review-report-v1" as const;

type VariantIdV1 =
  | "raw-velocity-traction12-flow10-cap20"
  | "raw-velocity-traction10-flow10-cap20-release08"
  | "raw-velocity-traction12-flow10-cap20-short-window"
  | "velocity-stateful-traction12-rate2600-release08"
  | "velocity-stateful-traction12-rate1800-release08"
  | "velocity-stateful-traction12-rate1200-release08"
  | "velocity-stateful-traction10-rate1800-release08"
  | "velocity-stateful-traction12-rate2600-release04";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mode: "raw-velocity" | "velocity-stateful";
  readonly tractionGainMmHgPerNormPerSec: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
  readonly capacityRiseTauSec: number;
  readonly capacityFallTauSec: number;
  readonly capacityReleaseTauSec: number;
  readonly mvReleaseThreshold01: number;
  readonly pressureRiseTauSec: number;
  readonly pressureFallTauSec: number;
  readonly pressureReleaseTauSec: number;
  readonly pressureMaxRateMmHgPerSec: number;
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
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionPressureTargetMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureRateMmHgPerSec: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly tractionMvOpenPressureIntegralMmHgSec: number;
  readonly maxLapStepMmHg: number;
  readonly avPlaneKinematicForwardVolumeMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly topologyPass: number;
  readonly sourcePreservingTopologyPass: number;
  readonly mvfCleanCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly opposedLobeCount: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionPressureTargetMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureRateMmHgPerSec: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly maxTractionMvOpenPressureIntegralMmHgSec: number;
  readonly maxLapStepMmHg: number;
  readonly maxAVPlaneKinematicForwardVolumeMl: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AtrialAVPlaneVelocityStatefulTractionReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneVelocityStatefulTractionReviewV1";
  readonly mode: "left-heart-av-plane-velocity-stateful-traction-review-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawReference: VariantSummaryV1;
  readonly bestVelocityStatefulVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly rawMaxTractionPressureStepMmHg: number;
    readonly bestVelocityStatefulVariantId: VariantIdV1;
    readonly bestVelocityStatefulSourceSurfacePass: number;
    readonly bestVelocityStatefulTopologyPass: number;
    readonly bestVelocityStatefulMvfCleanCount: number;
    readonly bestVelocityStatefulMaxTractionPressureStepMmHg: number;
    readonly bestVelocityStatefulStepReductionRatio: number;
    readonly velocityStatefulVariantsPreservingRawTopologyAndSource: number;
    readonly reviewStatus:
      | "velocity-stateful-traction-promotion-signal"
      | "velocity-stateful-traction-mixed"
      | "velocity-stateful-traction-no-go";
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

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

const BASE_TRACTION = {
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

const BASELINE_NO_AV_PLANE = {
  ...BASE_TRACTION,
  variantId: "compliance-node-no-avplane",
  reservoirCapacityGainMl: 0,
  venousCouplingGain: 0,
  maxKinematicFlowMlPerSec: 0,
  tractionGainMmHgPerNormPerSec: 0,
} as const;

export const ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-velocity-traction12-flow10-cap20", "raw-velocity", 1.2, 0.06, 0.58, 0.055, 0.30, 0.085, 0.20, 0.005, 0.04, 0.010, 9999),
  variant("raw-velocity-traction10-flow10-cap20-release08", "raw-velocity", 1.0, 0.06, 0.58, 0.055, 0.30, 0.050, 0.08, 0.005, 0.04, 0.010, 9999),
  variant("raw-velocity-traction12-flow10-cap20-short-window", "raw-velocity", 1.2, 0.06, 0.50, 0.045, 0.22, 0.045, 0.10, 0.005, 0.04, 0.010, 9999),
  variant("velocity-stateful-traction12-rate2600-release08", "velocity-stateful", 1.2, 0.06, 0.58, 0.055, 0.30, 0.050, 0.08, 0.004, 0.035, 0.010, 2600),
  variant("velocity-stateful-traction12-rate1800-release08", "velocity-stateful", 1.2, 0.06, 0.58, 0.055, 0.30, 0.050, 0.08, 0.006, 0.045, 0.012, 1800),
  variant("velocity-stateful-traction12-rate1200-release08", "velocity-stateful", 1.2, 0.06, 0.58, 0.055, 0.30, 0.050, 0.08, 0.008, 0.055, 0.014, 1200),
  variant("velocity-stateful-traction10-rate1800-release08", "velocity-stateful", 1.0, 0.06, 0.58, 0.055, 0.30, 0.050, 0.08, 0.006, 0.045, 0.012, 1800),
  variant("velocity-stateful-traction12-rate2600-release04", "velocity-stateful", 1.2, 0.06, 0.58, 0.055, 0.30, 0.030, 0.04, 0.004, 0.035, 0.008, 2600),
];

export function runAtrialAVPlaneVelocityStatefulTractionReviewBenchV1():
AtrialAVPlaneVelocityStatefulTractionReviewReportV1 {
  const rawParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = rawParams.map((params) =>
    runLeftHeartSubsystemV2(applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, BASELINE_NO_AV_PLANE))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.map((variantConfig) => {
      const params = applyVelocityStatefulTractionVariantV1(rawParams[index]!, variantConfig);
      const run = runLeftHeartSubsystemV2(params);
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, run);
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawReference = variantSummaries.find((summary) =>
    summary.variantId === "raw-velocity-traction12-flow10-cap20"
  )!;
  const statefulSummaries = variantSummaries.filter((summary) =>
    summary.variantId.startsWith("velocity-stateful")
  );
  const bestVelocityStatefulVariant = [...statefulSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || a.maxTractionPressureStepMmHg - b.maxTractionPressureStepMmHg
  )[0]!;
  const velocityStatefulVariantsPreservingRawTopologyAndSource = statefulSummaries.filter((summary) =>
    summary.topologyPass >= rawReference.topologyPass
    && summary.sourceSurfacePass >= rawReference.sourceSurfacePass
  ).length;
  const bestVelocityStatefulStepReductionRatio = round(
    bestVelocityStatefulVariant.maxTractionPressureStepMmHg
      / Math.max(rawReference.maxTractionPressureStepMmHg, 1e-9),
  );
  const reviewStatus =
    velocityStatefulVariantsPreservingRawTopologyAndSource > 0
    && bestVelocityStatefulStepReductionRatio < 0.75
      ? "velocity-stateful-traction-promotion-signal"
      : bestVelocityStatefulVariant.topologyPass > 0 || bestVelocityStatefulVariant.sourceSurfacePass > 0
        ? "velocity-stateful-traction-mixed"
        : "velocity-stateful-traction-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneVelocityStatefulTractionReviewV1",
    mode: "left-heart-av-plane-velocity-stateful-traction-review-no-runtime",
    variants: ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
    rows,
    variantSummaries,
    rawReference,
    bestVelocityStatefulVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawReference.sourceSurfacePass,
      rawTopologyPass: rawReference.topologyPass,
      rawMvfCleanCount: rawReference.mvfCleanCount,
      rawMaxTractionPressureStepMmHg: rawReference.maxTractionPressureStepMmHg,
      bestVelocityStatefulVariantId: bestVelocityStatefulVariant.variantId,
      bestVelocityStatefulSourceSurfacePass: bestVelocityStatefulVariant.sourceSurfacePass,
      bestVelocityStatefulTopologyPass: bestVelocityStatefulVariant.topologyPass,
      bestVelocityStatefulMvfCleanCount: bestVelocityStatefulVariant.mvfCleanCount,
      bestVelocityStatefulMaxTractionPressureStepMmHg: bestVelocityStatefulVariant.maxTractionPressureStepMmHg,
      bestVelocityStatefulStepReductionRatio,
      velocityStatefulVariantsPreservingRawTopologyAndSource,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "velocity-stateful-traction-promotion-signal"
        ? "Use velocity-target stateful traction as the next AV-plane timing contract candidate, still without runtime wiring or morphology acceptance."
        : "Do not promote velocity-target stateful traction as-is. Keep AV-plane traction as the v-loop mechanism lead, but change LA/MV timing or ownership before more passive reservoir sweeps.",
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

export function applyVelocityStatefulTractionVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const base = applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, {
    ...BASE_TRACTION,
    tractionGainMmHgPerNormPerSec: variantConfig.tractionGainMmHgPerNormPerSec,
    reservoirStartTheta: variantConfig.reservoirStartTheta,
    reservoirEndTheta: variantConfig.reservoirEndTheta,
    riseTauSec: variantConfig.capacityRiseTauSec,
    fallTauSec: variantConfig.capacityFallTauSec,
    releaseTauSec: variantConfig.capacityReleaseTauSec,
    mvClosedThreshold01: variantConfig.mvReleaseThreshold01,
  });
  if (variantConfig.mode === "raw-velocity") return base;
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-velocity-stateful-traction-reservoir-transaction-v1",
    laAVPlaneReservoirTractionPressureRiseTauSec: variantConfig.pressureRiseTauSec,
    laAVPlaneReservoirTractionPressureFallTauSec: variantConfig.pressureFallTauSec,
    laAVPlaneReservoirTractionPressureReleaseTauSec: variantConfig.pressureReleaseTauSec,
    laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec: variantConfig.pressureMaxRateMmHgPerSec,
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
  const tractionPressure = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  const tractionTarget = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureTargetMmHg);
  const lap = beat.map((sample) => sample.lapMmHg);
  const pressureSteps = tractionPressure.slice(1).map((value, index) => value - tractionPressure[index]!);
  const lapSteps = lap.slice(1).map((value, index) => value - lap[index]!);
  const mvOpenPressureIntegral = beat.reduce((sum, sample) =>
    sum + (sample.mvOpen01 > 0.2 ? sample.laAVPlaneReservoirTractionPressureMmHg : 0) * dtSec,
  0);
  const maxHiddenBloodVolumeSourceMl =
    round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl)));
  const maxMassResidualAbsMl = round(maxAbs(beat.map((sample) => sample.massResidualMl)));
  const sourceFailures = sourceSurfaceFailureReasons({
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    maxMassResidualAbsMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
  });
  const topologyFailures = lobeQuality.pass ? [] : ["la-pv-lobe-quality-fail"];
  const hiddenVolumeFailures = maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"];
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
    maxTractionPressureMmHg: round(Math.max(0, ...tractionPressure)),
    maxTractionPressureTargetMmHg: round(Math.max(0, ...tractionTarget)),
    maxTractionPressureStepMmHg: round(maxAbs(pressureSteps)),
    maxTractionPressureRateMmHgPerSec: round(maxAbs(pressureSteps) / Math.max(dtSec, 1e-9)),
    maxTractionPressureDuringMvOpenMmHg: round(Math.max(0, ...beat.map((sample) =>
      sample.mvOpen01 > 0.2 ? sample.laAVPlaneReservoirTractionPressureMmHg : 0
    ))),
    tractionMvOpenPressureIntegralMmHgSec: round(mvOpenPressureIntegral),
    maxLapStepMmHg: round(maxAbs(lapSteps)),
    avPlaneKinematicForwardVolumeMl:
      round(forwardFlowVolume(beat.map((sample) => sample.qAVPlaneReservoirKinematicMlPerSec), dtSec)),
    maxHiddenBloodVolumeSourceMl,
    maxMassResidualAbsMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    failureReasons: [
      ...sourceFailures,
      ...topologyFailures,
      ...hiddenVolumeFailures,
    ],
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
  if (row.mvForwardVolumeRatio < 0.78 || row.mvForwardVolumeRatio > 1.22) {
    failures.push("mv-forward-volume-ratio-wide");
  }
  if (row.aovForwardVolumeRatio < 0.80 || row.aovForwardVolumeRatio > 1.20) {
    failures.push("aov-output-ratio-wide");
  }
  if (row.maxMassResidualAbsMl > 0.08) failures.push("mass-residual-wide");
  if (row.clampCount > row.baselineClampCount) failures.push("new-clamp-hit");
  return failures;
}

function lobeQualityFor(samples: readonly LeftHeartSubsystemSampleV2[]): LobeQualityV1 {
  const volumes = samples.map((sample) => sample.acceptedLaVolumeMl);
  const pressures = samples.map((sample) => sample.lapMmHg);
  const theta = samples.map((sample) => sample.theta);
  const selfIntersections = countSelfIntersections(volumes, pressures);
  const aIndices = theta.map((value, index) => value >= PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const vIndices = theta.map((value, index) => value < PRE_A_THETA ? index : -1).filter((index) => index >= 0);
  const aLoop = sliceByIndices(volumes, pressures, aIndices);
  const vLoop = sliceByIndices(volumes, pressures, vIndices);
  const signedALoop = signedPolygonArea(aLoop.x, aLoop.y);
  const signedVLoop = signedPolygonArea(vLoop.x, vLoop.y);
  const aLoopArea = Math.abs(signedALoop);
  const vLoopArea = Math.abs(signedVLoop);
  const opposedSignedLobes = signedALoop * signedVLoop < 0;
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failures: string[] = [];
  if (selfIntersections < 1) failures.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failures.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failures.push("v-loop-area-too-small");
  if (!opposedSignedLobes) failures.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failures.push("v-loop-not-higher-volume-than-a-loop");
  return {
    pass: failures.length === 0,
    selfIntersections,
    opposedSignedLobes,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    volumeSeparationMl: round(volumeSeparation),
    failureReasons: failures,
  };
}

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    topologyPass: rows.filter((row) => row.topologyStatus === "pass").length,
    sourcePreservingTopologyPass:
      rows.filter((row) => row.sourceSurfaceStatus === "pass" && row.topologyStatus === "pass").length,
    mvfCleanCount: rows.filter((row) => row.mvfClean).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    maxTractionPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureMmHg))),
    maxTractionPressureTargetMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureTargetMmHg))),
    maxTractionPressureStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
    maxTractionPressureRateMmHgPerSec:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureRateMmHgPerSec))),
    maxTractionPressureDuringMvOpenMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureDuringMvOpenMmHg))),
    maxTractionMvOpenPressureIntegralMmHgSec:
      round(Math.max(0, ...rows.map((row) => row.tractionMvOpenPressureIntegralMmHgSec))),
    maxLapStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxLapStepMmHg))),
    maxAVPlaneKinematicForwardVolumeMl:
      round(Math.max(0, ...rows.map((row) => row.avPlaneKinematicForwardVolumeMl))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
    maxVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.lobeQuality.volumeSeparationMl))),
  };
}

function variant(
  variantId: VariantIdV1,
  mode: VariantV1["mode"],
  tractionGainMmHgPerNormPerSec: number,
  reservoirStartTheta: number,
  reservoirEndTheta: number,
  capacityRiseTauSec: number,
  capacityFallTauSec: number,
  capacityReleaseTauSec: number,
  mvReleaseThreshold01: number,
  pressureRiseTauSec: number,
  pressureFallTauSec: number,
  pressureReleaseTauSec: number,
  pressureMaxRateMmHgPerSec: number,
): VariantV1 {
  return {
    variantId,
    mode,
    tractionGainMmHgPerNormPerSec,
    reservoirStartTheta,
    reservoirEndTheta,
    capacityRiseTauSec,
    capacityFallTauSec,
    capacityReleaseTauSec,
    mvReleaseThreshold01,
    pressureRiseTauSec,
    pressureFallTauSec,
    pressureReleaseTauSec,
    pressureMaxRateMmHgPerSec,
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

function countSelfIntersections(x: readonly number[], y: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 2; j < x.length - 1; j++) {
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === x.length - 2) continue;
      if (segmentsIntersect(x[i]!, y[i]!, x[i + 1]!, y[i + 1]!, x[j]!, y[j]!, x[j + 1]!, y[j + 1]!)) count++;
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1 = orientation(ax, ay, bx, by, cx, cy);
  const d2 = orientation(ax, ay, bx, by, dx, dy);
  const d3 = orientation(cx, cy, dx, dy, ax, ay);
  const d4 = orientation(cx, cy, dx, dy, bx, by);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function sliceByIndices(
  x: readonly number[],
  y: readonly number[],
  indices: readonly number[],
): { readonly x: readonly number[]; readonly y: readonly number[] } {
  return {
    x: indices.map((index) => x[index]!),
    y: indices.map((index) => y[index]!),
  };
}

function signedPolygonArea(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || y.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
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

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
