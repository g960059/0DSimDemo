import {
  applyVelocityStatefulTractionVariantV1,
  ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneVelocityStatefulTractionReviewBench";
import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import type { FlowStateValveParamsV1 } from "@/engine/mechanics2/valve/FlowStateValveV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_LAMV_TRANSACTION_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-lamv-transaction-review-report-v1" as const;

type VariantIdV1 =
  | "raw-traction-reference"
  | "lamv-open-release-fast-threshold20"
  | "lamv-open-release-fast-threshold08"
  | "lamv-open-release-rate2600-threshold12"
  | "lamv-open-release-rate1800-threshold12"
  | "lamv-open-release-rate2600-threshold08"
  | "lamv-open-release-rate2600-threshold12-mv-moderate";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mode: "raw-reference" | "lamv-open-transaction";
  readonly releaseThreshold01: number;
  readonly pressureRiseTauSec: number;
  readonly pressureFallTauSec: number;
  readonly pressureReleaseTauSec: number;
  readonly pressureMaxRateMmHgPerSec: number;
  readonly mv?: Partial<FlowStateValveParamsV1>;
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
  readonly maxMvOpenStep: number;
  readonly maxMvOpen01: number;
  readonly maxMvQDotAbsMlPerSec2: number;
  readonly maxMvPressureFlowResidualAbsMmHg: number;
  readonly maxMvReverseProjectionAbsMlPerSec: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly maxLapStepMmHg: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly lobeQuality: LobeQualityV1;
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
  readonly maxMvQDotAbsMlPerSec2: number;
  readonly maxMvPressureFlowResidualAbsMmHg: number;
  readonly maxMvReverseProjectionAbsMlPerSec: number;
  readonly maxMvOpenStep: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionPressureStepMmHg: number;
  readonly maxTractionPressureDuringMvOpenMmHg: number;
  readonly maxLapStepMmHg: number;
  readonly maxVLoopArea: number;
};

export type AtrialAVPlaneLaMvTransactionReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_LAMV_TRANSACTION_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneLaMvTransactionReviewV1";
  readonly mode: "left-heart-av-plane-lamv-transaction-review-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawReference: VariantSummaryV1;
  readonly bestLaMvTransactionVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly bestLaMvTransactionVariantId: VariantIdV1;
    readonly bestLaMvTransactionSourceSurfacePass: number;
    readonly bestLaMvTransactionTopologyPass: number;
    readonly bestLaMvTransactionMvfCleanCount: number;
    readonly laMvVariantsImprovingRawSourceAndKeepingTopology: number;
    readonly reviewStatus:
      | "lamv-transaction-transfer-signal"
      | "lamv-transaction-mixed"
      | "lamv-transaction-no-go";
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
const RAW_TRACTION_VARIANT_ID = "raw-velocity-traction12-flow10-cap20" as const;
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

export const ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-traction-reference", "raw-reference", 0.20, 0.005, 0.04, 0.010, 9999),
  variant("lamv-open-release-fast-threshold20", "lamv-open-transaction", 0.20, 0.005, 0.04, 0.010, 9999),
  variant("lamv-open-release-fast-threshold08", "lamv-open-transaction", 0.08, 0.005, 0.04, 0.010, 9999),
  variant("lamv-open-release-rate2600-threshold12", "lamv-open-transaction", 0.12, 0.004, 0.035, 0.010, 2600),
  variant("lamv-open-release-rate1800-threshold12", "lamv-open-transaction", 0.12, 0.006, 0.045, 0.012, 1800),
  variant("lamv-open-release-rate2600-threshold08", "lamv-open-transaction", 0.08, 0.004, 0.035, 0.008, 2600),
  variant(
    "lamv-open-release-rate2600-threshold12-mv-moderate",
    "lamv-open-transaction",
    0.12,
    0.004,
    0.035,
    0.010,
    2600,
    { inertanceMmHgSec2PerMl: 0.00035, bernoulliMmHgSec2PerMl2: 6e-6 },
  ),
];

export function runAtrialAVPlaneLaMvTransactionReviewBenchV1():
AtrialAVPlaneLaMvTransactionReviewReportV1 {
  const rawParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rawReferenceVariant = ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1[0]!;
  const baselineRuns = rawParams.map((params) =>
    runLeftHeartSubsystemV2(applyLaMvTransactionVariant(params, rawReferenceVariant))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1.map((variantConfig) => {
      const run = runLeftHeartSubsystemV2(applyLaMvTransactionVariant(rawParams[index]!, variantConfig));
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, run);
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawReference = variantSummaries.find((summary) => summary.variantId === "raw-traction-reference")!;
  const transactionSummaries = variantSummaries.filter((summary) => summary.variantId !== rawReference.variantId);
  const bestLaMvTransactionVariant = [...transactionSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || a.maxTractionPressureDuringMvOpenMmHg - b.maxTractionPressureDuringMvOpenMmHg
    || a.maxMvQDotAbsMlPerSec2 - b.maxMvQDotAbsMlPerSec2
  )[0]!;
  const laMvVariantsImprovingRawSourceAndKeepingTopology = transactionSummaries.filter((summary) =>
    summary.sourceSurfacePass > rawReference.sourceSurfacePass
    && summary.topologyPass >= rawReference.topologyPass
  ).length;
  const reviewStatus =
    laMvVariantsImprovingRawSourceAndKeepingTopology > 0
      ? "lamv-transaction-transfer-signal"
      : bestLaMvTransactionVariant.sourceSurfacePass > 0 || bestLaMvTransactionVariant.topologyPass > 0
        ? "lamv-transaction-mixed"
        : "lamv-transaction-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_LAMV_TRANSACTION_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneLaMvTransactionReviewV1",
    mode: "left-heart-av-plane-lamv-transaction-review-no-runtime",
    variants: ATRIAL_AV_PLANE_LAMV_TRANSACTION_VARIANTS_V1,
    rows,
    variantSummaries,
    rawReference,
    bestLaMvTransactionVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawReference.sourceSurfacePass,
      rawTopologyPass: rawReference.topologyPass,
      rawMvfCleanCount: rawReference.mvfCleanCount,
      bestLaMvTransactionVariantId: bestLaMvTransactionVariant.variantId,
      bestLaMvTransactionSourceSurfacePass: bestLaMvTransactionVariant.sourceSurfacePass,
      bestLaMvTransactionTopologyPass: bestLaMvTransactionVariant.topologyPass,
      bestLaMvTransactionMvfCleanCount: bestLaMvTransactionVariant.mvfCleanCount,
      laMvVariantsImprovingRawSourceAndKeepingTopology,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "lamv-transaction-transfer-signal"
        ? "Use the same-step LA/MV transaction signal for the next AV-plane traction ownership candidate while keeping runtime AV-plane enablement blocked."
        : "Same-step MV opening release is not sufficient by itself. Keep AV-plane traction as the v-loop mechanism lead and move pressure/capacity ownership into the AV-plane coordinate contract.",
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

export function applyLaMvTransactionVariant(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const rawTractionVariant = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.find((config) =>
    config.variantId === RAW_TRACTION_VARIANT_ID
  )!;
  const base = applyVelocityStatefulTractionVariantV1(params, rawTractionVariant);
  if (variantConfig.mode === "raw-reference") return base;
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-lamv-open-traction-transaction-v1",
    laAVPlaneReservoirCapacityMvOpenReleaseThreshold01: variantConfig.releaseThreshold01,
    laAVPlaneReservoirTractionPressureRiseTauSec: variantConfig.pressureRiseTauSec,
    laAVPlaneReservoirTractionPressureFallTauSec: variantConfig.pressureFallTauSec,
    laAVPlaneReservoirTractionPressureReleaseTauSec: variantConfig.pressureReleaseTauSec,
    laAVPlaneReservoirTractionPressureMaxRateMmHgPerSec: variantConfig.pressureMaxRateMmHgPerSec,
    mv: {
      ...base.mv,
      ...variantConfig.mv,
    },
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
  const maxHiddenBloodVolumeSourceMl =
    round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl)));
  const maxMassResidualAbsMl = round(maxAbs(beat.map((sample) => sample.massResidualMl)));
  const mvOpen = beat.map((sample) => sample.mvOpen01);
  const mvOpenSteps = mvOpen.slice(1).map((value, index) => value - mvOpen[index]!);
  const tractionPressure = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  const tractionSteps = tractionPressure.slice(1).map((value, index) => value - tractionPressure[index]!);
  const lap = beat.map((sample) => sample.lapMmHg);
  const lapSteps = lap.slice(1).map((value, index) => value - lap[index]!);
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
    maxMvOpenStep: round(maxAbs(mvOpenSteps)),
    maxMvOpen01: round(Math.max(0, ...mvOpen)),
    maxMvQDotAbsMlPerSec2: round(maxAbs(beat.map((sample) => sample.mv.qDotMlPerSec2))),
    maxMvPressureFlowResidualAbsMmHg:
      round(maxAbs(beat.map((sample) => sample.mv.pressureFlowResidualMmHg))),
    maxMvReverseProjectionAbsMlPerSec:
      round(maxAbs(beat.map((sample) => sample.mv.reverseProjectionMlPerSec))),
    maxTractionPressureMmHg: round(Math.max(0, ...tractionPressure)),
    maxTractionPressureStepMmHg: round(maxAbs(tractionSteps)),
    maxTractionPressureDuringMvOpenMmHg: round(Math.max(0, ...beat.map((sample) =>
      sample.mvOpen01 > 0.2 ? sample.laAVPlaneReservoirTractionPressureMmHg : 0
    ))),
    maxLapStepMmHg: round(maxAbs(lapSteps)),
    maxHiddenBloodVolumeSourceMl,
    maxMassResidualAbsMl,
    clampCount: run.clampCount,
    baselineClampCount: baseline.clampCount,
    lobeQuality,
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
    maxMvQDotAbsMlPerSec2: round(Math.max(0, ...rows.map((row) => row.maxMvQDotAbsMlPerSec2))),
    maxMvPressureFlowResidualAbsMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxMvPressureFlowResidualAbsMmHg))),
    maxMvReverseProjectionAbsMlPerSec:
      round(Math.max(0, ...rows.map((row) => row.maxMvReverseProjectionAbsMlPerSec))),
    maxMvOpenStep: round(Math.max(0, ...rows.map((row) => row.maxMvOpenStep))),
    maxTractionPressureMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureMmHg))),
    maxTractionPressureStepMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
    maxTractionPressureDuringMvOpenMmHg:
      round(Math.max(0, ...rows.map((row) => row.maxTractionPressureDuringMvOpenMmHg))),
    maxLapStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxLapStepMmHg))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
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

function variant(
  variantId: VariantIdV1,
  mode: VariantV1["mode"],
  releaseThreshold01: number,
  pressureRiseTauSec: number,
  pressureFallTauSec: number,
  pressureReleaseTauSec: number,
  pressureMaxRateMmHgPerSec: number,
  mv?: Partial<FlowStateValveParamsV1>,
): VariantV1 {
  return {
    variantId,
    mode,
    releaseThreshold01,
    pressureRiseTauSec,
    pressureFallTauSec,
    pressureReleaseTauSec,
    pressureMaxRateMmHgPerSec,
    mv,
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
