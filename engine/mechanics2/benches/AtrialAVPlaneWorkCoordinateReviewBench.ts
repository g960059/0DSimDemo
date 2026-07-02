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
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_WORK_COORDINATE_REVIEW_REPORT_ID_V1 =
  "atrial-av-plane-work-coordinate-review-report-v1" as const;

type VariantIdV1 =
  | "raw-coordinate-traction12-flow10-cap20"
  | "finite-coordinate-traction20-fast-flow10-cap20";

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
  readonly sPrimePresent: boolean;
  readonly ePrimePresent: boolean;
  readonly aPrimePresent: boolean;
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
  readonly sPrimePresentCount: number;
  readonly ePrimePresentCount: number;
  readonly aPrimePresentCount: number;
  readonly maxDisplacementObservedMm: number;
  readonly maxVelocityAbsCmPerSec: number;
  readonly maxTractionPressureMmHg: number;
  readonly maxTractionForceN: number;
  readonly maxPositivePowerW: number;
  readonly maxTotalPositiveWorkJ: number;
  readonly maxWorkClosureErrorJ: number;
  readonly maxCoordinateVolumeErrorMl: number;
};

export type AtrialAVPlaneWorkCoordinateReviewReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_WORK_COORDINATE_REVIEW_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneWorkCoordinateReviewV1";
  readonly mode: "left-heart-av-plane-work-coordinate-review-no-runtime";
  readonly coordinateDefinition: {
    readonly side: "left";
    readonly annularAreaCm2: number;
    readonly maxDisplacementMm: number;
    readonly bloodVolumeLedgerMode: "flow-ledger-only-no-av-plane-volume-source";
    readonly workRelation: "forceEqualsPressureTimesArea-workEqualsForceTimesDisplacement";
  };
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly rawCoordinateReference: VariantSummaryV1;
  readonly finiteDriveCoordinateReference: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly rawSourceSurfacePass: number;
    readonly rawTopologyPass: number;
    readonly rawMvfCleanCount: number;
    readonly rawMaxDisplacementObservedMm: number;
    readonly rawMaxVelocityAbsCmPerSec: number;
    readonly rawMaxTractionForceN: number;
    readonly rawMaxPositivePowerW: number;
    readonly rawMaxTotalPositiveWorkJ: number;
    readonly rawMaxWorkClosureErrorJ: number;
    readonly finiteSourceSurfacePass: number;
    readonly finiteTopologyPass: number;
    readonly finiteMvfCleanCount: number;
    readonly coordinateStatus:
      | "work-coordinate-readback-sane-topology-signal"
      | "work-coordinate-readback-mixed"
      | "work-coordinate-readback-blocked";
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
const BASELINE_NO_AV_PLANE_VARIANT = {
  variantId: "compliance-node-no-avplane",
  reservoirCapacityGainMl: 0,
  venousCouplingGain: 0,
  maxKinematicFlowMlPerSec: 0,
  tractionGainMmHgPerNormPerSec: 0,
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

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

export function runAtrialAVPlaneWorkCoordinateReviewBenchV1():
AtrialAVPlaneWorkCoordinateReviewReportV1 {
  const rawVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((variant) =>
    variant.variantId === "raw-velocity-traction12-flow10-cap20"
  )!;
  const finiteVariant = ATRIAL_AV_PLANE_WORK_CONJUGATE_REVIEW_VARIANTS_V1.find((variant) =>
    variant.variantId === "finite-drive-traction20-fast-flow10-cap20"
  )!;
  const baseParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineRuns = baseParams.map((params) =>
    runLeftHeartSubsystemV2(applyAtrialAVPlaneTractionReservoirTransactionVariantV1(
      params,
      BASELINE_NO_AV_PLANE_VARIANT,
    ))
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baseline = baselineRuns[index]!;
    const raw = runLeftHeartSubsystemV2(applyAtrialAVPlaneWorkConjugateReviewVariantV1(baseParams[index]!, rawVariant));
    const finite =
      runLeftHeartSubsystemV2(applyAtrialAVPlaneWorkConjugateReviewVariantV1(baseParams[index]!, finiteVariant));
    return [
      rowForRun(profileId, "raw-coordinate-traction12-flow10-cap20", baseline, raw),
      rowForRun(profileId, "finite-coordinate-traction20-fast-flow10-cap20", baseline, finite),
    ];
  });
  const variantSummaries = [
    summarizeVariant("raw-coordinate-traction12-flow10-cap20", rows),
    summarizeVariant("finite-coordinate-traction20-fast-flow10-cap20", rows),
  ];
  const rawCoordinateReference = variantSummaries[0]!;
  const finiteDriveCoordinateReference = variantSummaries[1]!;
  const coordinateStatus =
    rawCoordinateReference.topologyPass === PROFILE_IDS.length
    && rawCoordinateReference.hiddenVolumeCleanCount === PROFILE_IDS.length
    && rawCoordinateReference.maxCoordinateVolumeErrorMl < 1e-6
    && rawCoordinateReference.maxWorkClosureErrorJ < 1e-6
      ? "work-coordinate-readback-sane-topology-signal"
      : rawCoordinateReference.topologyPass > finiteDriveCoordinateReference.topologyPass
        ? "work-coordinate-readback-mixed"
        : "work-coordinate-readback-blocked";
  return {
    reportId: ATRIAL_AV_PLANE_WORK_COORDINATE_REVIEW_REPORT_ID_V1,
    gateId: "atrialAVPlaneWorkCoordinateReviewV1",
    mode: "left-heart-av-plane-work-coordinate-review-no-runtime",
    coordinateDefinition: {
      side: "left",
      annularAreaCm2: round(ANNULAR_AREA_CM2),
      maxDisplacementMm: MAX_DISPLACEMENT_MM,
      bloodVolumeLedgerMode: "flow-ledger-only-no-av-plane-volume-source",
      workRelation: "forceEqualsPressureTimesArea-workEqualsForceTimesDisplacement",
    },
    rows,
    variantSummaries,
    rawCoordinateReference,
    finiteDriveCoordinateReference,
    summary: {
      totalProfiles: 7,
      rawSourceSurfacePass: rawCoordinateReference.sourceSurfacePass,
      rawTopologyPass: rawCoordinateReference.topologyPass,
      rawMvfCleanCount: rawCoordinateReference.mvfCleanCount,
      rawMaxDisplacementObservedMm: rawCoordinateReference.maxDisplacementObservedMm,
      rawMaxVelocityAbsCmPerSec: rawCoordinateReference.maxVelocityAbsCmPerSec,
      rawMaxTractionForceN: rawCoordinateReference.maxTractionForceN,
      rawMaxPositivePowerW: rawCoordinateReference.maxPositivePowerW,
      rawMaxTotalPositiveWorkJ: rawCoordinateReference.maxTotalPositiveWorkJ,
      rawMaxWorkClosureErrorJ: rawCoordinateReference.maxWorkClosureErrorJ,
      finiteSourceSurfacePass: finiteDriveCoordinateReference.sourceSurfacePass,
      finiteTopologyPass: finiteDriveCoordinateReference.topologyPass,
      finiteMvfCleanCount: finiteDriveCoordinateReference.mvfCleanCount,
      coordinateStatus,
    },
    decision: {
      nextAction: coordinateStatus === "work-coordinate-readback-sane-topology-signal"
        ? "Use the coordinate readbacks as the next AV-plane contract surface: replace pressure-hook traction with an explicit force/position state before any runtime AV-plane enablement."
        : "Do not promote AV-plane traction until the coordinate readbacks are finite, ledger-clean, and work-consistent.",
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

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  variantId: VariantIdV1,
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
    variantId,
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    topologyStatus: topologyFailures.length === 0 && hiddenVolumeFailures.length === 0 ? "pass" : "fail",
    mvfClean: mvForwardPeakCount === 2 && mvShape.c1ContinuityScore <= 0.42,
    mvForwardPeakCount,
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio,
    aovForwardVolumeRatio,
    lobeQuality,
    coordinateSummary,
    sPrimePresent: beat.some((sample) => sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec !== null),
    ePrimePresent: beat.some((sample) => sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec !== null),
    aPrimePresent: beat.some((sample) => sample.laAPrimeProxyCmPerSec !== null),
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
  const variantRows = rows.filter((row) => row.variantId === variantId);
  return {
    variantId,
    sourceSurfacePass: variantRows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    topologyPass: variantRows.filter((row) => row.topologyStatus === "pass").length,
    mvfCleanCount: variantRows.filter((row) => row.mvfClean).length,
    hiddenVolumeCleanCount:
      variantRows.filter((row) => row.coordinateSummary.maxHiddenBloodVolumeSourceMl === 0).length,
    sPrimePresentCount: variantRows.filter((row) => row.sPrimePresent).length,
    ePrimePresentCount: variantRows.filter((row) => row.ePrimePresent).length,
    aPrimePresentCount: variantRows.filter((row) => row.aPrimePresent).length,
    maxDisplacementObservedMm:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxDisplacementObservedMm))),
    maxVelocityAbsCmPerSec:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxVelocityAbsCmPerSec))),
    maxTractionPressureMmHg:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxTractionPressureMmHg))),
    maxTractionForceN:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxTractionForceN))),
    maxPositivePowerW:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxPositivePowerW))),
    maxTotalPositiveWorkJ:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.totalPositiveWorkJ))),
    maxWorkClosureErrorJ:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxWorkClosureErrorJ))),
    maxCoordinateVolumeErrorMl:
      round(Math.max(0, ...variantRows.map((row) => row.coordinateSummary.maxCoordinateVolumeErrorMl))),
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

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
