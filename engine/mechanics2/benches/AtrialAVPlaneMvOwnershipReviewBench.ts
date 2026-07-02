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

export const ATRIAL_AV_PLANE_MV_OWNERSHIP_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-mv-ownership-review-report-v1" as const;

type VariantIdV1 =
  | "raw-traction-reference"
  | "mv-open-faster"
  | "mv-open-slower"
  | "mv-low-threshold-faster"
  | "mv-higher-inertance-loss"
  | "mv-lower-inertance-loss"
  | "mv-moderate-lower-inertance-loss"
  | "mv-moderate-lower-inertance-default-loss"
  | "mv-low-leak-fast-close"
  | "mv-pressure-flow-stiffer";

type VariantV1 = {
  readonly variantId: VariantIdV1;
  readonly mv: Partial<FlowStateValveParamsV1>;
  readonly mvSystolicClosureDriveGain01?: number;
  readonly mvSystolicClosureDriveStartTheta?: number;
  readonly mvSystolicClosureDriveEndTheta?: number;
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
  readonly maxTractionPressureStepMmHg: number;
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
  readonly maxTractionPressureStepMmHg: number;
  readonly maxVLoopArea: number;
};

export type AtrialAVPlaneMvOwnershipReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_MV_OWNERSHIP_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneMvOwnershipReviewV1";
  readonly mode: "left-heart-av-plane-mv-ownership-review-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawReference: VariantSummaryV1;
  readonly bestMvOwnershipVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly bestMvOwnershipVariantId: VariantIdV1;
    readonly bestMvOwnershipSourceSurfacePass: number;
    readonly bestMvOwnershipTopologyPass: number;
    readonly bestMvOwnershipMvfCleanCount: number;
    readonly mvOwnershipVariantsImprovingRawSourceAndKeepingTopology: number;
    readonly reviewStatus:
      | "mv-ownership-transfer-signal"
      | "mv-ownership-mixed"
      | "mv-ownership-no-go";
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

export const ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1: readonly VariantV1[] = [
  variant("raw-traction-reference", {}),
  variant("mv-open-faster", { tauOpenSec: 0.014, maxOpenStepPerStep: 0.26 }),
  variant("mv-open-slower", { tauOpenSec: 0.038, maxOpenStepPerStep: 0.10 }),
  variant("mv-low-threshold-faster", { openThresholdMmHg: 0.12, tauOpenSec: 0.016, maxOpenStepPerStep: 0.24 }),
  variant("mv-higher-inertance-loss", { inertanceMmHgSec2PerMl: 0.0010, bernoulliMmHgSec2PerMl2: 1.4e-5 }),
  variant("mv-lower-inertance-loss", { inertanceMmHgSec2PerMl: 0.00025, bernoulliMmHgSec2PerMl2: 4e-6 }),
  variant("mv-moderate-lower-inertance-loss", { inertanceMmHgSec2PerMl: 0.00035, bernoulliMmHgSec2PerMl2: 6e-6 }),
  variant("mv-moderate-lower-inertance-default-loss", { inertanceMmHgSec2PerMl: 0.00035 }),
  variant("mv-low-leak-fast-close", { minEffectiveOpen01: 0.005, tauCloseSec: 0.010, reverseFlowLimitMlPerSec: 4 }),
  variant("mv-pressure-flow-stiffer", {
    resistanceMmHgSecPerMl: 0.0034,
    inertanceMmHgSec2PerMl: 0.0008,
    bernoulliMmHgSec2PerMl2: 1.2e-5,
    tauOpenSec: 0.018,
    tauCloseSec: 0.014,
  }),
];

export function runAtrialAVPlaneMvOwnershipReviewBenchV1(): AtrialAVPlaneMvOwnershipReviewReportV1 {
  const rawParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rawTractionVariant = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.find((variantConfig) =>
    variantConfig.variantId === "raw-velocity-traction12-flow10-cap20"
  )!;
  const baselineRuns = rawParams.map((params) =>
    runLeftHeartSubsystemV2(applyRawTraction(params))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) =>
    ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1.map((variantConfig) => {
      const run = runLeftHeartSubsystemV2(applyMvOwnershipVariant(
        applyVelocityStatefulTractionVariantV1(rawParams[index]!, rawTractionVariant),
        variantConfig,
      ));
      return rowForRun(profileId, variantConfig, baselineRuns[index]!, run);
    })
  );
  const variantSummaries = ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const rawReference = variantSummaries.find((summary) => summary.variantId === "raw-traction-reference")!;
  const mvSummaries = variantSummaries.filter((summary) => summary.variantId !== rawReference.variantId);
  const bestMvOwnershipVariant = [...mvSummaries].sort((a, b) =>
    b.sourceSurfacePass - a.sourceSurfacePass
    || b.topologyPass - a.topologyPass
    || b.mvfCleanCount - a.mvfCleanCount
    || a.maxMvQDotAbsMlPerSec2 - b.maxMvQDotAbsMlPerSec2
  )[0]!;
  const mvOwnershipVariantsImprovingRawSourceAndKeepingTopology = mvSummaries.filter((summary) =>
    summary.sourceSurfacePass > rawReference.sourceSurfacePass
    && summary.topologyPass >= rawReference.topologyPass
  ).length;
  const reviewStatus =
    mvOwnershipVariantsImprovingRawSourceAndKeepingTopology > 0
      ? "mv-ownership-transfer-signal"
      : bestMvOwnershipVariant.sourceSurfacePass > 0 || bestMvOwnershipVariant.topologyPass > 0
        ? "mv-ownership-mixed"
        : "mv-ownership-no-go";
  return {
    reportId: ATRIAL_AV_PLANE_MV_OWNERSHIP_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneMvOwnershipReviewV1",
    mode: "left-heart-av-plane-mv-ownership-review-no-runtime",
    variants: ATRIAL_AV_PLANE_MV_OWNERSHIP_VARIANTS_V1,
    rows,
    variantSummaries,
    rawReference,
    bestMvOwnershipVariant,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawReference.sourceSurfacePass,
      rawTopologyPass: rawReference.topologyPass,
      rawMvfCleanCount: rawReference.mvfCleanCount,
      bestMvOwnershipVariantId: bestMvOwnershipVariant.variantId,
      bestMvOwnershipSourceSurfacePass: bestMvOwnershipVariant.sourceSurfacePass,
      bestMvOwnershipTopologyPass: bestMvOwnershipVariant.topologyPass,
      bestMvOwnershipMvfCleanCount: bestMvOwnershipVariant.mvfCleanCount,
      mvOwnershipVariantsImprovingRawSourceAndKeepingTopology,
      reviewStatus,
    },
    decision: {
      nextAction: reviewStatus === "mv-ownership-transfer-signal"
        ? "Use the MV ownership transfer signal as the next LA/MV transaction candidate while keeping runtime AV-plane enablement blocked."
        : "Do not treat MV valve parameter ownership alone as the AV-plane cleanup. Move next to a same-step LA pressure, AV-plane traction, and MV opening transaction.",
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

function applyRawTraction(params: LeftHeartSubsystemParamsV2): LeftHeartSubsystemParamsV2 {
  const rawTractionVariant = ATRIAL_AV_PLANE_VELOCITY_STATEFUL_TRACTION_VARIANTS_V1.find((variantConfig) =>
    variantConfig.variantId === "raw-velocity-traction12-flow10-cap20"
  )!;
  return applyVelocityStatefulTractionVariantV1(params, rawTractionVariant);
}

function applyMvOwnershipVariant(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    mv: {
      ...params.mv,
      ...variantConfig.mv,
    },
    mvSystolicClosureDriveGain01:
      variantConfig.mvSystolicClosureDriveGain01 ?? params.mvSystolicClosureDriveGain01,
    mvSystolicClosureDriveStartTheta:
      variantConfig.mvSystolicClosureDriveStartTheta ?? params.mvSystolicClosureDriveStartTheta,
    mvSystolicClosureDriveEndTheta:
      variantConfig.mvSystolicClosureDriveEndTheta ?? params.mvSystolicClosureDriveEndTheta,
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
    maxTractionPressureStepMmHg:
      round(maxAbs(beat.slice(1).map((sample, index) =>
        sample.laAVPlaneReservoirTractionPressureMmHg - beat[index]!.laAVPlaneReservoirTractionPressureMmHg
      ))),
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
    maxTractionPressureStepMmHg: round(Math.max(0, ...rows.map((row) => row.maxTractionPressureStepMmHg))),
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
  mv: Partial<FlowStateValveParamsV1>,
  overrides: Omit<VariantV1, "variantId" | "mv"> = {},
): VariantV1 {
  return {
    variantId,
    mv,
    ...overrides,
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
