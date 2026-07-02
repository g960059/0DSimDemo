import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_AV_PLANE_TRACTION_RESERVOIR_TRANSACTION_REPORT_ID_V1 =
  "atrial-av-plane-traction-reservoir-transaction-report-v1" as const;

export type AtrialAVPlaneTractionReservoirTransactionVariantIdV1 =
  | "compliance-node-no-avplane"
  | "flow08-cap16-no-traction"
  | "traction08-cap16-no-flow"
  | "traction04-flow05-cap16"
  | "traction08-flow08-cap16"
  | "traction12-flow10-cap20"
  | "traction16-flow12-cap24"
  | "negative-traction08-flow08-cap16";

type VariantV1 = {
  readonly variantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1;
  readonly reservoirCapacityGainMl: number;
  readonly venousCouplingGain: number;
  readonly maxKinematicFlowMlPerSec: number;
  readonly tractionGainMmHgPerNormPerSec: number;
  readonly pulmonarySourcePressureDeltaMmHg: number;
  readonly pulmonaryComplianceMlPerMmHg: number;
  readonly pulmonaryToLaResistanceMultiplier: number;
  readonly ejectionRateStartMlPerSec: number;
  readonly ejectionRateEndMlPerSec: number;
  readonly reservoirStartTheta: number;
  readonly reservoirEndTheta: number;
  readonly riseTauSec: number;
  readonly fallTauSec: number;
  readonly releaseTauSec: number;
  readonly mvClosedThreshold01: number;
};

type LobeQualityV1 = {
  readonly lobeQualityPass: boolean;
  readonly selfIntersections: number;
  readonly aLoopArea: number;
  readonly vLoopArea: number;
  readonly signedALoopArea: number;
  readonly signedVLoopArea: number;
  readonly opposedSignedLobes: boolean;
  readonly volumeSeparationMl: number;
  readonly failureReasons: readonly string[];
};

type RowCoreV1 = {
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly maxMassResidualAbsMl: number;
  readonly clampCount: number;
  readonly baselineClampCount: number;
  readonly maxReservoirState01: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly maxAVPlaneKinematicFlowMlPerSec: number;
  readonly avPlaneKinematicForwardVolumeMl: number;
  readonly maxAVPlaneReservoirTractionPressureMmHg: number;
  readonly minAVPlaneReservoirTractionPressureMmHg: number;
  readonly maxPulmonaryVenousPressureMmHg: number;
  readonly minPulmonaryVenousPressureMmHg: number;
  readonly aPrimeReadbackPresent: boolean;
  readonly maxAPrimePeakAbsCmPerSec: number;
  readonly maxSPrimePeakAbsCmPerSec: number;
  readonly lobeQuality: LobeQualityV1;
};

type RowV1 = RowCoreV1 & {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly variantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1;
  readonly sampleRateHz: number;
  readonly dtHalfSampleRateHz: number;
  readonly dtHalf: RowCoreV1 & {
    readonly sourceSurfaceStatus: "pass" | "fail";
    readonly topologyStatus: "pass" | "fail";
    readonly failureReasons: readonly string[];
  };
  readonly sourceSurfaceStatus: "pass" | "fail";
  readonly topologyStatus: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type VariantSummaryV1 = {
  readonly variantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1;
  readonly sourceSurfacePass: number;
  readonly topologyPass: number;
  readonly dtHalfTopologyPass: number;
  readonly sourcePreservingTopologyPass: number;
  readonly mvfCleanCount: number;
  readonly hiddenVolumeCleanCount: number;
  readonly aPrimeReadbackPresentCount: number;
  readonly opposedLobeCount: number;
  readonly dtHalfOpposedLobeCount: number;
  readonly selfIntersectionCount: number;
  readonly dtHalfSelfIntersectionCount: number;
  readonly maxAVPlaneKinematicFlowMlPerSec: number;
  readonly maxAVPlaneKinematicForwardVolumeMl: number;
  readonly maxAVPlaneReservoirTractionPressureMmHg: number;
  readonly minAVPlaneReservoirTractionPressureMmHg: number;
  readonly maxGeometryDeltaMl: number;
  readonly maxALoopArea: number;
  readonly maxVLoopArea: number;
  readonly maxVolumeSeparationMl: number;
};

export type AtrialAVPlaneTractionReservoirTransactionReportV1 = {
  readonly reportId: typeof ATRIAL_AV_PLANE_TRACTION_RESERVOIR_TRANSACTION_REPORT_ID_V1;
  readonly gateId: "atrialAVPlaneTractionReservoirTransactionV1";
  readonly mode: "left-heart-atrial-av-plane-traction-reservoir-transaction-no-runtime";
  readonly variants: readonly VariantV1[];
  readonly rows: readonly RowV1[];
  readonly variantSummaries: readonly VariantSummaryV1[];
  readonly bestTopologyVariant: VariantSummaryV1;
  readonly summary: {
    readonly totalProfiles: 7;
    readonly baselineSourceSurfacePass: number;
    readonly baselineTopologyPass: number;
    readonly bestTopologyVariantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1;
    readonly bestTopologyPass: number;
    readonly bestDtHalfTopologyPass: number;
    readonly bestSourceSurfacePass: number;
    readonly bestSourcePreservingTopologyPass: number;
    readonly bestOpposedLobeCount: number;
    readonly bestMvfCleanCount: number;
    readonly flowOnlyTopologyPass: number;
    readonly tractionOnlyTopologyPass: number;
    readonly negativeTractionTopologyPass: number;
    readonly maxAVPlaneKinematicFlowMlPerSec: number;
    readonly maxAVPlaneReservoirTractionPressureMmHg: number;
    readonly maxVLoopArea: number;
  };
  readonly decision: {
    readonly atrialAVPlaneTractionReservoirTransactionStatus:
      | "atrial-av-plane-traction-vloop-topology-signal"
      | "atrial-av-plane-traction-vloop-mixed"
      | "atrial-av-plane-traction-vloop-blocked";
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

const VARIANTS: readonly VariantV1[] = [
  variant("compliance-node-no-avplane", 0, 0, 0, 0, 1.0, 30, 1.0, 18, 60),
  variant("flow08-cap16-no-traction", 16, 0.8, 70, 0, 1.0, 30, 1.0, 18, 60),
  variant("traction08-cap16-no-flow", 16, 0, 0, 0.8, 1.0, 30, 1.0, 18, 60),
  variant("traction04-flow05-cap16", 16, 0.5, 45, 0.4, 1.0, 30, 1.0, 18, 60),
  variant("traction08-flow08-cap16", 16, 0.8, 70, 0.8, 1.0, 30, 1.0, 18, 60),
  variant("traction12-flow10-cap20", 20, 1.0, 90, 1.2, 1.0, 30, 1.0, 18, 60),
  variant("traction16-flow12-cap24", 24, 1.2, 110, 1.6, 1.0, 30, 1.0, 18, 60),
  variant("negative-traction08-flow08-cap16", 16, 0.8, 70, -0.8, 1.0, 30, 1.0, 18, 60),
];

export function runAtrialAVPlaneTractionReservoirTransactionBenchV1():
AtrialAVPlaneTractionReservoirTransactionReportV1 {
  const rawParamsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const baselineVariant = VARIANTS[0]!;
  const baselineParamsByProfile = rawParamsByProfile.map((params) =>
    applyAtrialAVPlaneTractionReservoirTransactionVariantV1(params, baselineVariant)
  );
  const baselineRuns = baselineParamsByProfile.map((params) => runLeftHeartSubsystemV2(params));
  const baselineDtHalfRuns = baselineParamsByProfile.map((params) =>
    runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 })
  );
  const rows = PROFILE_IDS.flatMap((profileId, index) => {
    const baselineParams = baselineParamsByProfile[index]!;
    const baselineRun = baselineRuns[index]!;
    const baselineDtHalfRun = baselineDtHalfRuns[index]!;
    return VARIANTS.map((variantConfig) => {
      const params = variantConfig.variantId === "compliance-node-no-avplane"
        ? baselineParams
        : applyAtrialAVPlaneTractionReservoirTransactionVariantV1(rawParamsByProfile[index]!, variantConfig);
      const run = variantConfig.variantId === "compliance-node-no-avplane"
        ? baselineRun
        : runLeftHeartSubsystemV2(params);
      const dtHalfRun = variantConfig.variantId === "compliance-node-no-avplane"
        ? baselineDtHalfRun
        : runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
      return rowForRun(profileId, baselineParams.fixtureId, variantConfig, baselineRun, baselineDtHalfRun, run, dtHalfRun);
    });
  });
  const variantSummaries = VARIANTS.map((variantConfig) =>
    summarizeVariant(variantConfig.variantId, rows.filter((row) => row.variantId === variantConfig.variantId))
  );
  const baseline = variantSummaries.find((summary) => summary.variantId === "compliance-node-no-avplane")!;
  const flowOnly = variantSummaries.find((summary) => summary.variantId === "flow08-cap16-no-traction")!;
  const tractionOnly = variantSummaries.find((summary) => summary.variantId === "traction08-cap16-no-flow")!;
  const negativeTraction =
    variantSummaries.find((summary) => summary.variantId === "negative-traction08-flow08-cap16")!;
  const bestTopologyVariant = [...variantSummaries].sort((a, b) =>
    b.topologyPass - a.topologyPass
    || b.dtHalfTopologyPass - a.dtHalfTopologyPass
    || b.sourcePreservingTopologyPass - a.sourcePreservingTopologyPass
    || b.sourceSurfacePass - a.sourceSurfacePass
    || b.opposedLobeCount - a.opposedLobeCount
  )[0]!;
  const status = bestTopologyVariant.topologyPass === PROFILE_IDS.length
    && bestTopologyVariant.dtHalfTopologyPass === PROFILE_IDS.length
    && bestTopologyVariant.sourcePreservingTopologyPass >= baseline.sourceSurfacePass
    ? "atrial-av-plane-traction-vloop-topology-signal"
    : bestTopologyVariant.topologyPass > baseline.topologyPass
      ? "atrial-av-plane-traction-vloop-mixed"
      : "atrial-av-plane-traction-vloop-blocked";
  return {
    reportId: ATRIAL_AV_PLANE_TRACTION_RESERVOIR_TRANSACTION_REPORT_ID_V1,
    gateId: "atrialAVPlaneTractionReservoirTransactionV1",
    mode: "left-heart-atrial-av-plane-traction-reservoir-transaction-no-runtime",
    variants: VARIANTS,
    rows,
    variantSummaries,
    bestTopologyVariant,
    summary: {
      totalProfiles: 7,
      baselineSourceSurfacePass: baseline.sourceSurfacePass,
      baselineTopologyPass: baseline.topologyPass,
      bestTopologyVariantId: bestTopologyVariant.variantId,
      bestTopologyPass: bestTopologyVariant.topologyPass,
      bestDtHalfTopologyPass: bestTopologyVariant.dtHalfTopologyPass,
      bestSourceSurfacePass: bestTopologyVariant.sourceSurfacePass,
      bestSourcePreservingTopologyPass: bestTopologyVariant.sourcePreservingTopologyPass,
      bestOpposedLobeCount: bestTopologyVariant.opposedLobeCount,
      bestMvfCleanCount: bestTopologyVariant.mvfCleanCount,
      flowOnlyTopologyPass: flowOnly.topologyPass,
      tractionOnlyTopologyPass: tractionOnly.topologyPass,
      negativeTractionTopologyPass: negativeTraction.topologyPass,
      maxAVPlaneKinematicFlowMlPerSec:
        round(Math.max(0, ...variantSummaries.map((summary) => summary.maxAVPlaneKinematicFlowMlPerSec))),
      maxAVPlaneReservoirTractionPressureMmHg:
        round(Math.max(0, ...variantSummaries.map((summary) => summary.maxAVPlaneReservoirTractionPressureMmHg))),
      maxVLoopArea: round(Math.max(0, ...variantSummaries.map((summary) => summary.maxVLoopArea))),
    },
    decision: {
      atrialAVPlaneTractionReservoirTransactionStatus: status,
      nextAction: status === "atrial-av-plane-traction-vloop-topology-signal"
        ? "Promote AV-plane traction plus accepted venous reservoir flow as the next atrial v-loop mechanism. Keep runtime, morphology acceptance, and AV-plane enablement blocked until source/MVF residuals and owner visual review are resolved."
        : status === "atrial-av-plane-traction-vloop-mixed"
          ? "Use the traction signal only as bounded evidence; do not return to passive reservoir scalar sweeps."
          : "Do not promote traction; reassess AV-plane reservoir topology before more closed-loop work.",
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

export function applyAtrialAVPlaneTractionReservoirTransactionVariantV1(
  params: LeftHeartSubsystemParamsV2,
  variantConfig: VariantV1,
): LeftHeartSubsystemParamsV2 {
  const base = {
    ...params,
    pulmonaryVenousBoundaryMode: "compliance-node" as const,
    pulmonaryVenousInitialPressureMmHg:
      params.pulmonaryVenousPressureMmHg + variantConfig.pulmonarySourcePressureDeltaMmHg,
    pulmonaryVenousSourcePressureMmHg:
      params.pulmonaryVenousPressureMmHg + variantConfig.pulmonarySourcePressureDeltaMmHg,
    pulmonaryVenousComplianceMlPerMmHg: variantConfig.pulmonaryComplianceMlPerMmHg,
    pulmonaryVenousResistanceMmHgSecPerMl:
      params.pulmonaryVenousResistanceMmHgSecPerMl * variantConfig.pulmonaryToLaResistanceMultiplier,
    laPressureSourceMode: "fiber-chamber-total-pressure-shadow" as const,
  };
  if (variantConfig.reservoirCapacityGainMl <= 0) {
    return {
      ...base,
      laLobeGeneratorMode: "none",
      laEffectiveGeometryMode: "none",
      laReservoirSuctionPressureGainMmHg: 0,
      laBoosterPressureGainMmHg: 0,
      laReservoirGeometryGainMl: 0,
      laBoosterGeometryGainMl: 0,
      laAVPlaneVenousReservoirCouplingGain: 0,
      laAVPlaneVenousReservoirMaxFlowMlPerSec: 0,
      laAVPlaneReservoirReferenceGainMl: 0,
      laAVPlaneReservoirTractionGainMmHgPerNormPerSec: 0,
      laAVPlaneReservoirRecoilPressureGainMmHg: 0,
    };
  }
  return {
    ...base,
    laLobeGeneratorMode: "av-plane-traction-reservoir-transaction-v1",
    laEffectiveGeometryMode: "av-plane-reservoir-capacity-transaction-v1",
    laReservoirSuctionPressureGainMmHg: 0,
    laBoosterPressureGainMmHg: 0,
    laReservoirGeometryGainMl: variantConfig.reservoirCapacityGainMl,
    laBoosterGeometryGainMl: 0,
    laReservoirSuctionStartTheta: variantConfig.reservoirStartTheta,
    laReservoirSuctionEndTheta: variantConfig.reservoirEndTheta,
    laAVPlaneEjectionRateStartMlPerSec: variantConfig.ejectionRateStartMlPerSec,
    laAVPlaneEjectionRateEndMlPerSec: variantConfig.ejectionRateEndMlPerSec,
    laAVPlaneReservoirCapacityRiseTauSec: variantConfig.riseTauSec,
    laAVPlaneReservoirCapacityFallTauSec: variantConfig.fallTauSec,
    laAVPlaneReservoirCapacityReleaseTauSec: variantConfig.releaseTauSec,
    laAVPlaneReservoirCapacityMvOpenReleaseThreshold01: variantConfig.mvClosedThreshold01,
    laAVPlaneVenousReservoirCouplingGain: variantConfig.venousCouplingGain,
    laAVPlaneVenousReservoirMaxFlowMlPerSec: variantConfig.maxKinematicFlowMlPerSec,
    laAVPlaneVenousReservoirMvOpenReleaseThreshold01: variantConfig.mvClosedThreshold01,
    laAVPlaneReservoirReferenceGainMl: 0,
    laAVPlaneReservoirTractionGainMmHgPerNormPerSec: variantConfig.tractionGainMmHgPerNormPerSec,
    laAVPlaneReservoirRecoilPressureGainMmHg: 0,
    laEffectiveGeometryVelocityScaleCmPerSec: 2.4,
  };
}

function rowForRun(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  variantConfig: VariantV1,
  baseline: LeftHeartSubsystemRunV2,
  baselineDtHalf: LeftHeartSubsystemRunV2,
  run: LeftHeartSubsystemRunV2,
  dtHalfRun: LeftHeartSubsystemRunV2,
): RowV1 {
  const nominalBase = rowCore(baseline.finalBeatSamples, baseline, run.finalBeatSamples, run);
  const dtHalfBase = rowCore(baselineDtHalf.finalBeatSamples, baselineDtHalf, dtHalfRun.finalBeatSamples, dtHalfRun);
  const sourceFailures = sourceSurfaceFailureReasons(nominalBase);
  const dtHalfSourceFailures = sourceSurfaceFailureReasons(dtHalfBase);
  const dtHalfTopologyFailures = [
    ...dtHalfSourceFailures,
    ...(dtHalfBase.lobeQuality.lobeQualityPass ? [] : ["dt-half-la-pv-lobe-quality-fail"]),
    ...(dtHalfBase.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["dt-half-hidden-blood-volume-source"]),
  ];
  const topologyFailures = [
    ...sourceFailures,
    ...(nominalBase.lobeQuality.lobeQualityPass ? [] : ["la-pv-lobe-quality-fail"]),
    ...(nominalBase.maxHiddenBloodVolumeSourceMl === 0 ? [] : ["hidden-blood-volume-source"]),
    ...(dtHalfBase.lobeQuality.lobeQualityPass ? [] : ["dt-half-la-pv-lobe-quality-fail"]),
  ];
  return {
    profileId,
    sourcePointId,
    variantId: variantConfig.variantId,
    sampleRateHz: run.params.sampleRateHz,
    dtHalfSampleRateHz: dtHalfRun.params.sampleRateHz,
    ...nominalBase,
    dtHalf: {
      ...dtHalfBase,
      sourceSurfaceStatus: dtHalfSourceFailures.length === 0 ? "pass" : "fail",
      topologyStatus: dtHalfTopologyFailures.length === 0 ? "pass" : "fail",
      failureReasons: dtHalfTopologyFailures,
    },
    sourceSurfaceStatus: sourceFailures.length === 0 ? "pass" : "fail",
    topologyStatus: topologyFailures.length === 0 ? "pass" : "fail",
    failureReasons: topologyFailures,
  };
}

function rowCore(
  baselineBeat: readonly LeftHeartSubsystemSampleV2[],
  baselineRun: LeftHeartSubsystemRunV2,
  beat: readonly LeftHeartSubsystemSampleV2[],
  run: LeftHeartSubsystemRunV2,
): RowCoreV1 {
  const dtSec = 1 / Math.max(run.params.sampleRateHz, 1e-9);
  const baselineDtSec = 1 / Math.max(baselineRun.params.sampleRateHz, 1e-9);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const qAov = beat.map((sample) => sample.qAovMlPerSec);
  const qKinematic = beat.map((sample) => sample.qAVPlaneReservoirKinematicMlPerSec);
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const mvShape = computeShapeQualityMetricsV1(qMv);
  const tractionPressure = beat.map((sample) => sample.laAVPlaneReservoirTractionPressureMmHg);
  return {
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: round(mvShape.c1ContinuityScore),
    mvForwardVolumeRatio: round(
      forwardFlowVolume(qMv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, baselineDtSec), 1e-9),
    ),
    aovForwardVolumeRatio: round(
      forwardFlowVolume(qAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, baselineDtSec), 1e-9),
    ),
    maxMassResidualAbsMl: round(maxAbs(beat.map((sample) => sample.massResidualMl))),
    clampCount: run.clampCount,
    baselineClampCount: baselineRun.clampCount,
    maxReservoirState01: round(Math.max(0, ...beat.map((sample) => sample.laReservoirSuctionDrive01))),
    maxGeometryDeltaMl: round(Math.max(0, ...beat.map((sample) => sample.laReservoirGeometryDeltaMl))),
    maxHiddenBloodVolumeSourceMl:
      round(maxAbs(beat.map((sample) => sample.laEffectiveGeometryHiddenBloodVolumeSourceMl))),
    maxAVPlaneKinematicFlowMlPerSec: round(Math.max(0, ...qKinematic)),
    avPlaneKinematicForwardVolumeMl: round(forwardFlowVolume(qKinematic, dtSec)),
    maxAVPlaneReservoirTractionPressureMmHg: round(Math.max(0, ...tractionPressure)),
    minAVPlaneReservoirTractionPressureMmHg: round(Math.min(...tractionPressure)),
    maxPulmonaryVenousPressureMmHg:
      round(Math.max(0, ...beat.map((sample) => sample.acceptedPulmonaryVenousPressureMmHg))),
    minPulmonaryVenousPressureMmHg:
      round(Math.min(...beat.map((sample) => sample.acceptedPulmonaryVenousPressureMmHg))),
    aPrimeReadbackPresent: beat.some((sample) => sample.laAPrimeProxyCmPerSec != null),
    maxAPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) => sample.laAPrimeProxyCmPerSec ?? 0))),
    maxSPrimePeakAbsCmPerSec: round(maxAbs(beat.map((sample) =>
      sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec ?? 0
    ))),
    lobeQuality: lobeQualityFor(beat),
  };
}

function sourceSurfaceFailureReasons(row: Pick<RowCoreV1,
  | "mvForwardPeakCount"
  | "mvC1ContinuityScore"
  | "mvForwardVolumeRatio"
  | "aovForwardVolumeRatio"
  | "maxMassResidualAbsMl"
  | "clampCount"
  | "baselineClampCount"
>): readonly string[] {
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
    lobeQualityPass: failures.length === 0,
    selfIntersections,
    aLoopArea: round(aLoopArea),
    vLoopArea: round(vLoopArea),
    signedALoopArea: round(signedALoop),
    signedVLoopArea: round(signedVLoop),
    opposedSignedLobes,
    volumeSeparationMl: round(volumeSeparation),
    failureReasons: failures,
  };
}

function summarizeVariant(
  variantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1,
  rows: readonly RowV1[],
): VariantSummaryV1 {
  return {
    variantId,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    topologyPass: rows.filter((row) => row.lobeQuality.lobeQualityPass).length,
    dtHalfTopologyPass: rows.filter((row) => row.dtHalf.lobeQuality.lobeQualityPass).length,
    sourcePreservingTopologyPass:
      rows.filter((row) => row.sourceSurfaceStatus === "pass" && row.lobeQuality.lobeQualityPass).length,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    hiddenVolumeCleanCount: rows.filter((row) => row.maxHiddenBloodVolumeSourceMl === 0).length,
    aPrimeReadbackPresentCount: rows.filter((row) => row.aPrimeReadbackPresent).length,
    opposedLobeCount: rows.filter((row) => row.lobeQuality.opposedSignedLobes).length,
    dtHalfOpposedLobeCount: rows.filter((row) => row.dtHalf.lobeQuality.opposedSignedLobes).length,
    selfIntersectionCount: rows.filter((row) => row.lobeQuality.selfIntersections > 0).length,
    dtHalfSelfIntersectionCount: rows.filter((row) => row.dtHalf.lobeQuality.selfIntersections > 0).length,
    maxAVPlaneKinematicFlowMlPerSec: round(Math.max(0, ...rows.map((row) =>
      row.maxAVPlaneKinematicFlowMlPerSec
    ))),
    maxAVPlaneKinematicForwardVolumeMl: round(Math.max(0, ...rows.map((row) =>
      row.avPlaneKinematicForwardVolumeMl
    ))),
    maxAVPlaneReservoirTractionPressureMmHg: round(Math.max(0, ...rows.map((row) =>
      row.maxAVPlaneReservoirTractionPressureMmHg
    ))),
    minAVPlaneReservoirTractionPressureMmHg: round(Math.min(...rows.map((row) =>
      row.minAVPlaneReservoirTractionPressureMmHg
    ))),
    maxGeometryDeltaMl: round(Math.max(0, ...rows.map((row) => row.maxGeometryDeltaMl))),
    maxALoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.aLoopArea))),
    maxVLoopArea: round(Math.max(0, ...rows.map((row) => row.lobeQuality.vLoopArea))),
    maxVolumeSeparationMl: round(Math.max(0, ...rows.map((row) => row.lobeQuality.volumeSeparationMl))),
  };
}

function variant(
  variantId: AtrialAVPlaneTractionReservoirTransactionVariantIdV1,
  reservoirCapacityGainMl: number,
  venousCouplingGain: number,
  maxKinematicFlowMlPerSec: number,
  tractionGainMmHgPerNormPerSec: number,
  pulmonarySourcePressureDeltaMmHg: number,
  pulmonaryComplianceMlPerMmHg: number,
  pulmonaryToLaResistanceMultiplier: number,
  ejectionRateStartMlPerSec: number,
  ejectionRateEndMlPerSec: number,
): VariantV1 {
  return {
    variantId,
    reservoirCapacityGainMl,
    venousCouplingGain,
    maxKinematicFlowMlPerSec,
    tractionGainMmHgPerNormPerSec,
    pulmonarySourcePressureDeltaMmHg,
    pulmonaryComplianceMlPerMmHg,
    pulmonaryToLaResistanceMultiplier,
    ejectionRateStartMlPerSec,
    ejectionRateEndMlPerSec,
    reservoirStartTheta: 0.06,
    reservoirEndTheta: 0.58,
    riseTauSec: 0.055,
    fallTauSec: 0.30,
    releaseTauSec: 0.085,
    mvClosedThreshold01: 0.20,
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
  if (x.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < x.length; i++) {
    const j = (i + 1) % x.length;
    area += x[i]! * y[j]! - x[j]! * y[i]!;
  }
  return 0.5 * area;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
