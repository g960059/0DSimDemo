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

export const ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-work-conjugate-review-report-v1" as const;

type VariantIdV1 =
  | "raw-velocity-traction12-flow10-cap20"
  | "finite-drive-traction12-flow10-cap20"
  | "finite-drive-traction16-flow10-cap20"
  | "finite-drive-traction20-flow10-cap20"
  | "finite-drive-traction20-fast-flow10-cap20";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mode: "raw-velocity" | "finite-drive";
  readonly tractionGain: number;
  readonly riseTauSec: number;
  readonly fallTauSec: number;
  readonly releaseTauSec: number;
  readonly maxRateMmHgPerSec: number;
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
  readonly mvfClean: boolean;
  readonly topologyStatus: "pass" | "fail";
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly lobeQuality: LobeQualityV1;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionTargetPressureMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureRateMmHgPerSec: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly avPlaneKinematicForwardVolumeMl: number;
  readonly tractionGeometryWorkProxyMmHgMl: number;
  readonly tractionKinematicWorkProxyMmHgMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: VariantIdV1;
  readonly sourceSurfacePass: number;
  readonly mvfCleanCount: number;
  readonly topologyPass: number;
  readonly sourcePreservingTopologyPass: number;
  readonly hiddenVolumeCleanCount: number;
  readonly opposedLobeCount: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionTargetPressureMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureRateMmHgPerSec: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly maxAVPlaneKinematicForwardVolumeMl: number;
  readonly maxTractionGeometryWorkProxyMmHgMl: number;
  readonly maxTractionKinematicWorkProxyMmHgMl: number;
};

export type AtrialAVPlaneWorkConjugateReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneWorkConjugateReviewV1";
  readonly mode: "left-heart-av-plane-work-conjugate-review-no-runtime";
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawVelocityReference: VariantSummaryV1;
  readonly bestFiniteDriveVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly rawMaxTractionPressureStepMmHg: number;
    readonly bestFiniteDriveVariantId: VariantIdV1;
    readonly bestFiniteDriveSourceSurfacePass: number;
    readonly bestFiniteDriveTopologyPass: number;
    readonly bestFiniteDriveMvfCleanCount: number;
    readonly bestFiniteDriveMaxTractionPressureStepMmHg: number;
    readonly bestFiniteDriveStepReductionRatio: number;
    readonly finiteDriveVariantsPreservingRawTopologyAndSource: number;
  };
  readonly decision: {
    readonly atrialAVPlaneWorkConjugateReviewStatus:
      | "finite-drive-traction-pressure-smoothing-signal"
      | "finite-drive-traction-pressure-smoothing-no-go";
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

const BASELINE_VARIANT = {
  ...BASE_TRACTION_VARIANT,
  variantId: "compliance-node-no-avplane",
  reservoirCapacityGainMl: 0,
  venousCouplingGain: 0,
  maxKinematicFlowMlPerSec: 0,
  tractionGainMmHgPerNormPerSec: 0,
} as const;

export const ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-velocity-traction12-flow10-cap20", "raw-velocity", 1.2, 0.005, 0.04, 0.01, 9999),
  variant("finite-drive-traction12-flow10-cap20", "finite-drive", 12, 0.025, 0.10, 0.020, 450),
  variant("finite-drive-traction16-flow10-cap20", "finite-drive", 16, 0.025, 0.10, 0.020, 450),
  variant("finite-drive-traction20-flow10-cap20", "finite-drive", 20, 0.025, 0.10, 0.020, 450),
  variant("finite-drive-traction20-fast-flow10-cap20", "finite-drive", 20, 0.005, 0.04, 0.010, 9999),
];

export function runAtrialAVPlaneWorkConjugateReviewBenchV1(): AtrialAVPlaneWorkConjugateReviewReportV1 {
  const rawParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = rawParamsByProfile.map((params) =>
    runLeftHeartSubsystemV2(applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, BASELINE_VARIANT))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.map((variantConfig) => {
      const params = applyAtrialAVPlaneWorkConjugateReviewVariantV1(rawParamsByProfile[index]!, variantConfig);
      const run = runLeftHeartSubsystemV2(params);
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, run);
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawVelocityReference =
    variantSummaries.find((summary) => summary.variantId === "raw-velocity-traction12-flow10-cap20")!;
  const finiteDriveSummaries = variantSummaries.filter((summary) =>
    summary.variantId !== rawVelocityReference.variantId
  );
  const bestFiniteDriveVariant = [...finiteDriveSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || a.maxTractionPressureStepMmHg - b.maxTractionPressureStepMmHg
  )[0]!;
  const finiteDriveVariantsPreservingRawTopologyAndSource = finiteDriveSummaries.filter((summary) =>
    summary.topologyPass >= rawVelocityReference.topologyPass
    && summary.sourceSurfacePass >= rawVelocityReference.sourceSurfacePass
  ).length;
  const bestFiniteDriveStepReductionRatio = round(
    bestFiniteDriveVariant.maxTractionPressureStepMmHg
      / Math.max(rawVelocityReference.maxTractionPressureStepMmHg, 1e-9),
  );
  const status = finiteDriveVariantsPreservingRawTopologyAndSource > 0
    && bestFiniteDriveStepReductionRatio < 0.6
    ? "finite-drive-traction-pressure-smoothing-signal"
    : "finite-drive-traction-pressure-smoothing-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneWorkConjugateReviewV1",
    mode: "left-heart-av-plane-work-conjugate-review-no-runtime",
    rows,
    variantSummaries,
    rawVelocityReference,
    bestFiniteDriveVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawVelocityReference.sourceSurfacePass,
      rawTopologyPass: rawVelocityReference.topologyPass,
      rawMvfCleanCount: rawVelocityReference.mvfCleanCount,
      rawMaxTractionPressureStepMmHg: rawVelocityReference.maxTractionPressureStepMmHg,
      bestFiniteDriveVariantId: bestFiniteDriveVariant.variantId,
      bestFiniteDriveSourceSurfacePass: bestFiniteDriveVariant.sourceSurfacePass,
      bestFiniteDriveTopologyPass: bestFiniteDriveVariant.topologyPass,
      bestFiniteDriveMvfCleanCount: bestFiniteDriveVariant.mvfCleanCount,
      bestFiniteDriveMaxTractionPressureStepMmHg: bestFiniteDriveVariant.maxTractionPressureStepMmHg,
      bestFiniteDriveStepReductionRatio,
      finiteDriveVariantsPreservingRawTopologyAndSource,
    },
    decision: {
      atrialAVPlaneWorkConjugateReviewStatus: status,
      nextAction: status === "finite-drive-traction-pressure-smoothing-signal"
        ? "Use finite traction state only if owner visual review accepts the less-spiky shape."
        : "Do not promote finite pressure-drive smoothing. Keep the raw velocity-traction topology lead, but replace pressure smoothing with an explicit AV-plane position/velocity/force coordinate and work/energy readbacks.",
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

export function applyAtrialAVPlaneWorkConjugateReviewVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const base = applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, BASE_TRACTION_VARIANT);
  if (variantConfig.mode === "raw-velocity") {
    return base;
  }
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-stateful-traction-reservoir-transaction-v1",
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec: variantConfig.tractionGain,
    laAVPlaneReservoirTractionPressureRiseTauSec: variantConfig.riseTauSec,
    laAVPlaneReservoirTractionPressureFallTauSec: variantConfig.fallTauSec,
    laAVPlaneReservoirTractionPressureReleaseTauSec: variantConfig.releaseTauSec,
    laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec: variantConfig.maxRateMmHgPerSec,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantConfig: VariantV1,
  baseline: ReturnType<typeof runLeftHeartSubsystemV2>,
  run: ReturnType<typeof runLeftHeartSubsystemV2>,
): RowV1 {
  const beat = run.finalBeatSamples;
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baseline.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const baselineQmv = baseline.finalBeatSamples.map((sample) => sample.qMvMlPerSec);
  const baselineQaov = baseline.finalBeatSamples.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const mvForwardPeakCount = positivePeakCount(qMv);
  const mvForwardVolumeRatio = round(
    forwardFlowVolume(qMv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, baselineDtSec), 1e-9),
  );
  const aovForwardVolumeRatio = round(
    forwardFlowVolume(qAov, dtSec) / Math.max(forwardFlowVolume(baselineQaov, baselineDtSec), 1e-9),
  );
  const lobeQuality = lobeQualityFor(beat);
  const tractionPressure = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  const tractionTarget = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureTargetMmHg);
  const tractionPressureSteps = tractionPressure.slice(1).map((value, index) => value - tractionPressure[index]!);
  const maxTractionPressureStepMmHg = round(maxAbs(tractionPressureSteps));
  const maxTractionPressureDuringMvOpenMmHg = round(Math.max(0, ...beat.map((sample) =>
    sample.mvOpen01 > 0.2 ? sample.laAVPlaneReservoirTractionPressureMmHg : 0
  )));
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
  const hiddenVolumeFailures = maxAbs(beat.map((sample) =>
    sample.laEffectiveGeometryHiddenBloodVolumeSourceMl
  )) === 0 ? [] : ["hidden-blood-volume-source"];
  const sourceSurfaceStatus = sourceFailures.length === 0 ? "pass" : "fail";
  return {
    profileId,
    variantId: variantConfig.variantId,
    sourceSurfaceStatus,
    mvfClean: mvForwardPeakCount === 2 && mvShape.c1ContinuityScore <= 0.42,
    topologyStatus: topologyFailures.length === 0 && hiddenVolumeFailures.length === 0 ? "pass" : "fail",
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    lobeQuality,
    maxTractionPressureMmHg: round(Math.max(0, ...tractionPressure)),
    maxTractionTargetPressureMmHg: round(Math.max(0, ...tractionTarget)),
    maxTractionPressureStepMmHg,
    maxTractionPressureRateMmHgPerSec: round(maxTractionPressureStepMmHg / Math.max(dtSec, 1e-9)),
    maxTractionPressureDuringMvOpenMmHg,
    avPlaneKinematicForwardVolumeMl:
      round(forwardFlowVolume(beat.map((sample) => sample.qAVPlaneReservoirKinematicMlPerSec), dtSec)),
    tractionGeometryWorkProxyMmHgMl: round(integrateTractionGeometryWorkProxy(beat)),
    tractionKinematicWorkProxyMmHgMl: round(forwardFlowVolume(beat.map((sample) =>
      sample.laAVPlaneReservoirTractionPressureMmHg * Math.max(0, sample.qAVPlaneReservoirKinematicMlPerSec)
    ), dtSec)),
    maxHiddenBloodVolumeSourceMl:
      round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl))),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
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
  if (row.mvForwardPeakCount !== 2) failures.push("mvf-not-biphasic");
  if (row.mvC1ContinuityScore > 0.42) failures.push("mvf-c1-kink");
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

function summarizeVariant(variantId: VariantIdV1, rows: readonly RowV1[]): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    mvfCleanCount: rows.filter((row) => row.mvfClean).length,
    topologyPass: rows.filter((row) => row.topologyStatus === "pass").length,
    sourcePreservingTopologyPass:
      rows.filter((row) => row.sourceSurfaceStatus === "pass" && row.topologyStatus === "pass").length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    maxTractionPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureMmHg))),
    maxTractionTargetPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionTargetPressureMmHg))),
    maxTractionPressureStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
    maxTractionPressureRateMmHgPerSec:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureRateMmHgPerSec))),
    maxTractionPressureDuringMvOpenMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureDuringMvOpenMmHg))),
    maxAVPlaneKinematicForwardVolumeMl:
      round(Math.max(0, ...rows.map((row) => row.avPlaneKinematicForwardVolumeMl))),
    maxTractionGeometryWorkProxyMmHgMl:
      round(Math.max(0, ...rows.map((row) => row.tractionGeometryWorkProxyMmHgMl))),
    maxTractionKinematicWorkProxyMmHgMl:
      round(Math.max(0, ...rows.map((row) => row.tractionKinematicWorkProxyMmHgMl))),
  };
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
  const volumeSeparation = mean(vLoop.x) - mean(aLoop.x);
  const failureReasons: string[] = [];
  if (selfIntersections < 1) failureReasons.push("missing-pv-self-intersection");
  if (aLoopArea < 1.8) failureReasons.push("a-loop-area-too-small");
  if (vLoopArea < 1.8) failureReasons.push("v-loop-area-too-small");
  if (signedALoop * signedVLoop >= 0) failureReasons.push("a-v-lobes-not-opposed");
  if (volumeSeparation < 1.2) failureReasons.push("v-loop-not-higher-volume-than-a-loop");
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

function integrateTractionGeometryWorkProxy(samples: readonly LeftHeartSubsystemSampleV2[]): number {
  let work = 0;
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1]!;
    const current = samples[i]!;
    const dGeometryMl = current.laReservoirGeometryDeltaMl - previous.laReservoirGeometryDeltaMl;
    const pressureMmHg = 0.5 * (
      current.laAVPlaneReservoirTractionPressureMmHg
      + previous.laAVPlaneReservoirTractionPressureMmHg
    );
    work += Math.max(0, pressureMmHg * dGeometryMl);
  }
  return work;
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
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function variant(
  variantId: VariantIdV1,
  mode: VariantV1["mode"],
  tractionGain: number,
  riseTauSec: number,
  fallTauSec: number,
  releaseTauSec: number,
  maxRateMmHgPerSec: number,
): VariantV1 {
  return {
    variantId,
    mode,
    tractionGain,
    riseTauSec,
    fallTauSec,
    releaseTauSec,
    maxRateMmHgPerSec,
  };
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
