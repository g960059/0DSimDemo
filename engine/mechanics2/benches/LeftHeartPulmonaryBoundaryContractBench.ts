import {
  buildLeftHeartArchitectureEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartArchitectureComparisonBench";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

export const LEFT_HEART_PULMONARY_BOUNDARY_CONTRACT_REPORT_ID_V1 =
  "left-heart-pulmonary-boundary-contract-report-v1" as const;

type LeftHeartPulmonaryBoundaryVariantIdV1 =
  | "v2-fixed2-soft-baseline"
  | "semilunar-loss2-root-runoff70"
  | "semilunar-loss2-root-runoff70-pv-node-c12"
  | "semilunar-loss2-root-runoff70-pv-node-c20"
  | "semilunar-loss2-root-runoff70-pv-node-buffered"
  | "semilunar-loss2-root-runoff70-pv-node-buffered-mv-loss"
  | "semilunar-loss2-root-runoff70-lv-floor30"
  | "semilunar-loss2-root-runoff70-low-suction"
  | "semilunar-loss5-inertance4-root-runoff110-low-suction";

type PulmonaryBoundarySpecV1 =
  | { readonly mode: "fixed-pressure" }
  | {
    readonly mode: "compliance-node";
    readonly sourcePressureDeltaMmHg: number;
    readonly initialPressureDeltaMmHg: number;
    readonly sourceResistanceMmHgSecPerMl: number;
    readonly complianceMlPerMmHg: number;
    readonly toLaResistanceMultiplier: number;
  };

type BeatSummaryV1 = {
  readonly beat: number;
  readonly sampleCount: number;
  readonly strokeVolumeMl: number | null;
  readonly aovEjectedVolumeMl: number | null;
  readonly mvForwardVolumeMl: number | null;
  readonly pulmonaryVenousToLaVolumeMl: number | null;
  readonly pulmonaryVenousSourceVolumeMl: number | null;
  readonly lvpPeakMmHg: number | null;
  readonly lapMinMmHg: number | null;
  readonly lapMaxMmHg: number | null;
  readonly rootPressureMinMmHg: number | null;
  readonly rootPressureMaxMmHg: number | null;
  readonly pulmonaryVenousPressureMinMmHg: number | null;
  readonly pulmonaryVenousPressureMaxMmHg: number | null;
  readonly laVolumeMinMl: number | null;
  readonly laVolumeMaxMl: number | null;
  readonly qMvPeakMlPerSec: number | null;
  readonly qAovPeakMlPerSec: number | null;
  readonly qPulmonaryVenousPeakMlPerSec: number | null;
  readonly mvForwardPeakCount: number;
  readonly mvC1ContinuityScore: number;
  readonly lvpShape: ShapeQualityMetricsV1;
  readonly qMvShape: ShapeQualityMetricsV1;
  readonly clampCount: number;
  readonly maxSafetyPressureMmHg: number | null;
};

export type LeftHeartPulmonaryBoundaryPointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly finalBeat: BeatSummaryV1 | null;
  readonly previousBeat: BeatSummaryV1 | null;
  readonly dtHalfFinalBeat: BeatSummaryV1 | null;
  readonly repeatability: {
    readonly aovEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly mvForwardVolumeDeltaMl: number | null;
    readonly clampDelta: number | null;
    readonly aovAlternans: boolean;
    readonly strokeAlternans: boolean;
  };
  readonly dtSensitivity: {
    readonly aovEjectionDeltaMl: number | null;
    readonly strokeVolumeDeltaMl: number | null;
    readonly mvC1ContinuityDelta: number | null;
    readonly dtStable: boolean;
  };
  readonly classifications: {
    readonly lvPvOk: boolean;
    readonly mvfOk: boolean;
    readonly outputOk: boolean;
    readonly repeatabilityOk: boolean;
    readonly dtStable: boolean;
    readonly flowCoupled: boolean;
    readonly clampFree: boolean;
  };
  readonly failureReasons: readonly string[];
};

export type LeftHeartPulmonaryBoundaryVariantResultV1 = {
  readonly variantId: LeftHeartPulmonaryBoundaryVariantIdV1;
  readonly description: string;
  readonly intervention: {
    readonly aovResistanceMultiplier: number;
    readonly aovInertanceMultiplier: number;
    readonly aovBernoulliMultiplier: number;
    readonly rootOutResistanceMultiplier: number;
    readonly mvResistanceMultiplier: number;
    readonly mvInertanceMultiplier: number;
    readonly mvBernoulliMultiplier: number;
    readonly mvTauCloseMultiplier: number;
    readonly minLvVolumeMl: number | null;
    readonly absoluteMinLvVolumeMl: number | null;
    readonly lvLowerSoftLimitGainMultiplier: number;
    readonly pulmonaryBoundary: PulmonaryBoundarySpecV1;
  };
  readonly pointResults: readonly LeftHeartPulmonaryBoundaryPointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly lvPvOkCount: number;
    readonly mvfOkCount: number;
    readonly outputOkCount: number;
    readonly repeatabilityOkCount: number;
    readonly dtStableCount: number;
    readonly flowCoupledCount: number;
    readonly clampFreeCount: number;
    readonly maxAovEjectionDeltaMl: number | null;
    readonly maxStrokeVolumeDeltaMl: number | null;
    readonly maxDtHalfAovEjectionDeltaMl: number | null;
  };
};

export type LeftHeartPulmonaryBoundaryContractReportV1 = {
  readonly reportId: typeof LEFT_HEART_PULMONARY_BOUNDARY_CONTRACT_REPORT_ID_V1;
  readonly gateId: "leftHeartPulmonaryBoundaryContractGateV1";
  readonly sourceSurface: "v2-fixed2-soft";
  readonly variantResults: readonly LeftHeartPulmonaryBoundaryVariantResultV1[];
  readonly decision: {
    readonly leftHeartGateBStatus: "mixed-boundary-signal" | "no-improvement";
    readonly bestVariantId: LeftHeartPulmonaryBoundaryVariantIdV1;
    readonly bestPassCount: number;
    readonly baselinePassCount: number;
    readonly bestHighContractilityVariantId: LeftHeartPulmonaryBoundaryVariantIdV1;
    readonly bestHighContractilityFailureReasons: readonly string[];
    readonly highContractilityMvfSignal: "improved" | "unchanged-or-worse";
    readonly nextAction: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly outputReserveAcceptance: false;
    readonly rightHeartUnlock: false;
    readonly fourChamberUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

type VariantSpecV1 = {
  readonly variantId: LeftHeartPulmonaryBoundaryVariantIdV1;
  readonly description: string;
  readonly aovResistanceMultiplier: number;
  readonly aovInertanceMultiplier: number;
  readonly aovBernoulliMultiplier: number;
  readonly rootOutResistanceMultiplier: number;
  readonly mvResistanceMultiplier: number;
  readonly mvInertanceMultiplier: number;
  readonly mvBernoulliMultiplier: number;
  readonly mvTauCloseMultiplier: number;
  readonly minLvVolumeMl: number | null;
  readonly absoluteMinLvVolumeMl: number | null;
  readonly lvLowerSoftLimitGainMultiplier: number;
  readonly pulmonaryBoundary: PulmonaryBoundarySpecV1;
};

const BASE_TRANSACTION = {
  transactionMode: "fixed-point",
  transactionIterations: 2,
  transactionRelaxation: 0.5,
  volumeSafetyMode: "soft-pressure",
} as const;

const VARIANTS: readonly VariantSpecV1[] = [
  {
    variantId: "v2-fixed2-soft-baseline",
    description: "Current V2 fixed-point soft-pressure surface before semilunar/root or pulmonary-boundary intervention.",
    aovResistanceMultiplier: 1,
    aovInertanceMultiplier: 1,
    aovBernoulliMultiplier: 1,
    rootOutResistanceMultiplier: 1,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: { mode: "fixed-pressure" },
  },
  {
    variantId: "semilunar-loss2-root-runoff70",
    description: "Best outflow-repair surface from the previous gate: semilunar loss2 plus faster root runoff.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: { mode: "fixed-pressure" },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-pv-node-c12",
    description: "Adds a finite pulmonary venous compliance node while preserving the previous outflow-repair surface.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: {
      mode: "compliance-node",
      sourcePressureDeltaMmHg: 0,
      initialPressureDeltaMmHg: 0,
      sourceResistanceMmHgSecPerMl: 0.11,
      complianceMlPerMmHg: 12,
      toLaResistanceMultiplier: 1,
    },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-pv-node-c20",
    description: "Tests a larger pulmonary venous compliance reservoir to reduce fixed-source overdrive during high LV suction.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: {
      mode: "compliance-node",
      sourcePressureDeltaMmHg: 0,
      initialPressureDeltaMmHg: 0,
      sourceResistanceMmHgSecPerMl: 0.16,
      complianceMlPerMmHg: 20,
      toLaResistanceMultiplier: 1,
    },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-pv-node-buffered",
    description: "Uses a buffered PV source and slightly higher PV-to-LA resistance to test high-contractility MVF continuity without changing atrial kick timing.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: {
      mode: "compliance-node",
      sourcePressureDeltaMmHg: 2,
      initialPressureDeltaMmHg: 0,
      sourceResistanceMmHgSecPerMl: 0.18,
      complianceMlPerMmHg: 18,
      toLaResistanceMultiplier: 1.25,
    },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-pv-node-buffered-mv-loss",
    description: "Combines the buffered PV node with modest MV loss/inertance to separate PV-source overdrive from MV pressure-flow shape.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1.5,
    mvInertanceMultiplier: 2,
    mvBernoulliMultiplier: 2,
    mvTauCloseMultiplier: 0.8,
    minLvVolumeMl: null,
    absoluteMinLvVolumeMl: null,
    lvLowerSoftLimitGainMultiplier: 1,
    pulmonaryBoundary: {
      mode: "compliance-node",
      sourcePressureDeltaMmHg: 1,
      initialPressureDeltaMmHg: 0,
      sourceResistanceMmHgSecPerMl: 0.18,
      complianceMlPerMmHg: 18,
      toLaResistanceMultiplier: 1.25,
    },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-lv-floor30",
    description: "Keeps the best outflow-repair surface but lowers the LV soft/emergency lower-volume floor to test whether safety-floor suction/clamp creates the high-contractility MVF artifact.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: 30,
    absoluteMinLvVolumeMl: 22,
    lvLowerSoftLimitGainMultiplier: 0.5,
    pulmonaryBoundary: { mode: "fixed-pressure" },
  },
  {
    variantId: "semilunar-loss2-root-runoff70-low-suction",
    description: "Keeps the best outflow-repair surface but removes most lower-bound soft-pressure suction while retaining upper-bound safety pressure.",
    aovResistanceMultiplier: 2,
    aovInertanceMultiplier: 2,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 0.7,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: 30,
    absoluteMinLvVolumeMl: 20,
    lvLowerSoftLimitGainMultiplier: 0.05,
    pulmonaryBoundary: { mode: "fixed-pressure" },
  },
  {
    variantId: "semilunar-loss5-inertance4-root-runoff110-low-suction",
    description: "High-drive component probe: suppress lower-bound safety suction and increase semilunar loss/inertance enough to test whether the high-contractility MVF kink/clamp can be removed locally.",
    aovResistanceMultiplier: 5,
    aovInertanceMultiplier: 4,
    aovBernoulliMultiplier: 2,
    rootOutResistanceMultiplier: 1.1,
    mvResistanceMultiplier: 1,
    mvInertanceMultiplier: 1,
    mvBernoulliMultiplier: 1,
    mvTauCloseMultiplier: 1,
    minLvVolumeMl: 30,
    absoluteMinLvVolumeMl: 20,
    lvLowerSoftLimitGainMultiplier: 0.05,
    pulmonaryBoundary: { mode: "fixed-pressure" },
  },
];

export function runLeftHeartPulmonaryBoundaryContractBenchV1(): LeftHeartPulmonaryBoundaryContractReportV1 {
  const variantResults = VARIANTS.map(runVariant);
  const baseline = variantResults.find((variant) => variant.variantId === "v2-fixed2-soft-baseline");
  if (baseline == null) throw new Error("baseline variant is required");
  const best = [...variantResults].sort((a, b) =>
    b.summary.pass - a.summary.pass
    || b.summary.mvfOkCount - a.summary.mvfOkCount
    || b.summary.outputOkCount - a.summary.outputOkCount,
  )[0]!;
  const baselineHigh = highContractilityPoint(baseline);
  const highRanked = [...variantResults].sort((a, b) =>
    highContractilityScore(b) - highContractilityScore(a)
    || b.summary.pass - a.summary.pass,
  );
  const bestHighVariant = highRanked[0]!;
  const bestHigh = highContractilityPoint(bestHighVariant);
  const baselineHighMvfScore = baselineHigh?.finalBeat?.mvC1ContinuityScore ?? Number.POSITIVE_INFINITY;
  const bestHighMvfScore = bestHigh?.finalBeat?.mvC1ContinuityScore ?? Number.POSITIVE_INFINITY;
  const highContractilityMvfSignal =
    bestHigh?.classifications.mvfOk === true || bestHighMvfScore < baselineHighMvfScore
      ? "improved"
      : "unchanged-or-worse";
  return {
    reportId: LEFT_HEART_PULMONARY_BOUNDARY_CONTRACT_REPORT_ID_V1,
    gateId: "leftHeartPulmonaryBoundaryContractGateV1",
    sourceSurface: "v2-fixed2-soft",
    variantResults,
    decision: {
      leftHeartGateBStatus: best.summary.pass > baseline.summary.pass || highContractilityMvfSignal === "improved"
        ? "mixed-boundary-signal"
        : "no-improvement",
      bestVariantId: best.variantId,
      bestPassCount: best.summary.pass,
      baselinePassCount: baseline.summary.pass,
      bestHighContractilityVariantId: bestHighVariant.variantId,
      bestHighContractilityFailureReasons: bestHigh?.failureReasons ?? ["missing-high-contractility-point"],
      highContractilityMvfSignal,
      nextAction: "Treat finite pulmonary venous compliance-node variants as no-go for broad Gate B. The high-drive local rescue points instead to lower-bound safety suction plus semilunar/load balance; next work should turn that component signal into broad output-reserve calibration without reopening right-heart, four-chamber, or LandAtrial work.",
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      outputReserveAcceptance: false,
      rightHeartUnlock: false,
      fourChamberUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function highContractilityScore(variant: LeftHeartPulmonaryBoundaryVariantResultV1): number {
  const high = highContractilityPoint(variant);
  if (high == null || high.finalBeat == null) return Number.NEGATIVE_INFINITY;
  return (high.classifications.lvPvOk ? 10 : 0)
    + (high.classifications.mvfOk ? 10 : 0)
    + (high.classifications.outputOk ? 10 : 0)
    + (high.classifications.dtStable ? 8 : 0)
    + (high.classifications.flowCoupled ? 6 : 0)
    + (high.classifications.clampFree ? 6 : 0)
    - high.failureReasons.length
    - high.finalBeat.mvC1ContinuityScore;
}

function runVariant(spec: VariantSpecV1): LeftHeartPulmonaryBoundaryVariantResultV1 {
  const pointResults = buildLeftHeartArchitectureEnvelopeV1(BASE_TRANSACTION)
    .map((params) => applyVariant(params, spec))
    .map(runPoint);
  const pass = pointResults.filter((point) => point.status === "pass").length;
  const fail = pointResults.filter((point) => point.status === "fail").length;
  const inconclusive = pointResults.filter((point) => point.status === "inconclusive").length;
  return {
    variantId: spec.variantId,
    description: spec.description,
    intervention: {
      aovResistanceMultiplier: spec.aovResistanceMultiplier,
      aovInertanceMultiplier: spec.aovInertanceMultiplier,
      aovBernoulliMultiplier: spec.aovBernoulliMultiplier,
      rootOutResistanceMultiplier: spec.rootOutResistanceMultiplier,
      mvResistanceMultiplier: spec.mvResistanceMultiplier,
      mvInertanceMultiplier: spec.mvInertanceMultiplier,
      mvBernoulliMultiplier: spec.mvBernoulliMultiplier,
      mvTauCloseMultiplier: spec.mvTauCloseMultiplier,
      minLvVolumeMl: spec.minLvVolumeMl,
      absoluteMinLvVolumeMl: spec.absoluteMinLvVolumeMl,
      lvLowerSoftLimitGainMultiplier: spec.lvLowerSoftLimitGainMultiplier,
      pulmonaryBoundary: spec.pulmonaryBoundary,
    },
    pointResults,
    summary: {
      total: pointResults.length,
      pass,
      fail,
      inconclusive,
      lvPvOkCount: pointResults.filter((point) => point.classifications.lvPvOk).length,
      mvfOkCount: pointResults.filter((point) => point.classifications.mvfOk).length,
      outputOkCount: pointResults.filter((point) => point.classifications.outputOk).length,
      repeatabilityOkCount: pointResults.filter((point) => point.classifications.repeatabilityOk).length,
      dtStableCount: pointResults.filter((point) => point.classifications.dtStable).length,
      flowCoupledCount: pointResults.filter((point) => point.classifications.flowCoupled).length,
      clampFreeCount: pointResults.filter((point) => point.classifications.clampFree).length,
      maxAovEjectionDeltaMl: finiteMaxOrNull(pointResults.map((point) => point.repeatability.aovEjectionDeltaMl ?? Number.NaN)),
      maxStrokeVolumeDeltaMl: finiteMaxOrNull(pointResults.map((point) => point.repeatability.strokeVolumeDeltaMl ?? Number.NaN)),
      maxDtHalfAovEjectionDeltaMl: finiteMaxOrNull(pointResults.map((point) => point.dtSensitivity.aovEjectionDeltaMl ?? Number.NaN)),
    },
  };
}

function applyVariant(params: LeftHeartSubsystemParamsV2, spec: VariantSpecV1): LeftHeartSubsystemParamsV2 {
  const pulmonary = spec.pulmonaryBoundary;
  return {
    ...params,
    rootOutResistanceMmHgSecPerMl: params.rootOutResistanceMmHgSecPerMl * spec.rootOutResistanceMultiplier,
    minLvVolumeMl: spec.minLvVolumeMl ?? params.minLvVolumeMl,
    absoluteMinLvVolumeMl: spec.absoluteMinLvVolumeMl ?? params.absoluteMinLvVolumeMl,
    lvLowerSoftLimitGainMmHgPerMl: params.lvLowerSoftLimitGainMmHgPerMl * spec.lvLowerSoftLimitGainMultiplier,
    pulmonaryVenousBoundaryMode: pulmonary.mode,
    pulmonaryVenousInitialPressureMmHg: pulmonary.mode === "compliance-node"
      ? params.pulmonaryVenousPressureMmHg + pulmonary.initialPressureDeltaMmHg
      : params.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pulmonary.mode === "compliance-node"
      ? params.pulmonaryVenousPressureMmHg + pulmonary.sourcePressureDeltaMmHg
      : params.pulmonaryVenousPressureMmHg,
    pulmonaryVenousSourceResistanceMmHgSecPerMl: pulmonary.mode === "compliance-node"
      ? pulmonary.sourceResistanceMmHgSecPerMl
      : params.pulmonaryVenousSourceResistanceMmHgSecPerMl,
    pulmonaryVenousComplianceMlPerMmHg: pulmonary.mode === "compliance-node"
      ? pulmonary.complianceMlPerMmHg
      : params.pulmonaryVenousComplianceMlPerMmHg,
    pulmonaryVenousResistanceMmHgSecPerMl: pulmonary.mode === "compliance-node"
      ? params.pulmonaryVenousResistanceMmHgSecPerMl * pulmonary.toLaResistanceMultiplier
      : params.pulmonaryVenousResistanceMmHgSecPerMl,
    mv: {
      ...params.mv,
      resistanceMmHgSecPerMl: params.mv.resistanceMmHgSecPerMl * spec.mvResistanceMultiplier,
      inertanceMmHgSec2PerMl: params.mv.inertanceMmHgSec2PerMl * spec.mvInertanceMultiplier,
      bernoulliMmHgSec2PerMl2: params.mv.bernoulliMmHgSec2PerMl2 * spec.mvBernoulliMultiplier,
      tauCloseSec: params.mv.tauCloseSec * spec.mvTauCloseMultiplier,
    },
    aov: {
      ...params.aov,
      resistanceMmHgSecPerMl: params.aov.resistanceMmHgSecPerMl * spec.aovResistanceMultiplier,
      inertanceMmHgSec2PerMl: params.aov.inertanceMmHgSec2PerMl * spec.aovInertanceMultiplier,
      bernoulliMmHgSec2PerMl2: params.aov.bernoulliMmHgSec2PerMl2 * spec.aovBernoulliMultiplier,
    },
  };
}

function runPoint(params: LeftHeartSubsystemParamsV2): LeftHeartPulmonaryBoundaryPointResultV1 {
  const run = runLeftHeartSubsystemV2(params);
  const dtHalfRun = runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
  const finalBeatIndex = params.beats - 2;
  const previousBeatIndex = params.beats - 3;
  const finalBeat = summarizeBeat(finalBeatIndex, run.samples.filter((sample) => sample.beat === finalBeatIndex));
  const previousBeat = summarizeBeat(previousBeatIndex, run.samples.filter((sample) => sample.beat === previousBeatIndex));
  const dtHalfFinalBeat = summarizeBeat(finalBeatIndex, dtHalfRun.samples.filter((sample) => sample.beat === finalBeatIndex));
  if (finalBeat == null || previousBeat == null || dtHalfFinalBeat == null) {
    return emptyPoint(params.fixtureId, finalBeat, previousBeat, dtHalfFinalBeat);
  }
  const aovEjectionDeltaMl = Math.abs((finalBeat.aovEjectedVolumeMl ?? 0) - (previousBeat.aovEjectedVolumeMl ?? 0));
  const strokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (previousBeat.strokeVolumeMl ?? 0));
  const mvForwardVolumeDeltaMl = Math.abs((finalBeat.mvForwardVolumeMl ?? 0) - (previousBeat.mvForwardVolumeMl ?? 0));
  const clampDelta = Math.abs(finalBeat.clampCount - previousBeat.clampCount);
  const dtAovEjectionDeltaMl = Math.abs((finalBeat.aovEjectedVolumeMl ?? 0) - (dtHalfFinalBeat.aovEjectedVolumeMl ?? 0));
  const dtStrokeVolumeDeltaMl = Math.abs((finalBeat.strokeVolumeMl ?? 0) - (dtHalfFinalBeat.strokeVolumeMl ?? 0));
  const dtMvC1ContinuityDelta = Math.abs(finalBeat.mvC1ContinuityScore - dtHalfFinalBeat.mvC1ContinuityScore);
  const dtStable = dtAovEjectionDeltaMl <= 12 && dtStrokeVolumeDeltaMl <= 12 && dtMvC1ContinuityDelta <= 0.18;
  const classifications = classify(finalBeat, aovEjectionDeltaMl, strokeVolumeDeltaMl, dtStable);
  const failureReasons = failureReasonsFor(classifications, finalBeat, aovEjectionDeltaMl, strokeVolumeDeltaMl);
  return {
    pointId: params.fixtureId,
    status: failureReasons.length === 0 ? "pass" : "fail",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      aovEjectionDeltaMl: round(aovEjectionDeltaMl),
      strokeVolumeDeltaMl: round(strokeVolumeDeltaMl),
      mvForwardVolumeDeltaMl: round(mvForwardVolumeDeltaMl),
      clampDelta,
      aovAlternans: aovEjectionDeltaMl > 20,
      strokeAlternans: strokeVolumeDeltaMl > 20,
    },
    dtSensitivity: {
      aovEjectionDeltaMl: round(dtAovEjectionDeltaMl),
      strokeVolumeDeltaMl: round(dtStrokeVolumeDeltaMl),
      mvC1ContinuityDelta: round(dtMvC1ContinuityDelta),
      dtStable,
    },
    classifications,
    failureReasons,
  };
}

function emptyPoint(
  pointId: string,
  finalBeat: BeatSummaryV1 | null,
  previousBeat: BeatSummaryV1 | null,
  dtHalfFinalBeat: BeatSummaryV1 | null,
): LeftHeartPulmonaryBoundaryPointResultV1 {
  return {
    pointId,
    status: "inconclusive",
    finalBeat,
    previousBeat,
    dtHalfFinalBeat,
    repeatability: {
      aovEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      mvForwardVolumeDeltaMl: null,
      clampDelta: null,
      aovAlternans: false,
      strokeAlternans: false,
    },
    dtSensitivity: {
      aovEjectionDeltaMl: null,
      strokeVolumeDeltaMl: null,
      mvC1ContinuityDelta: null,
      dtStable: false,
    },
    classifications: {
      lvPvOk: false,
      mvfOk: false,
      outputOk: false,
      repeatabilityOk: false,
      dtStable: false,
      flowCoupled: false,
      clampFree: false,
    },
    failureReasons: ["too-few-beat-samples"],
  };
}

function summarizeBeat(beat: number, samples: readonly LeftHeartSubsystemSampleV2[]): BeatSummaryV1 | null {
  if (samples.length < 16) return null;
  const lvp = samples.map((sample) => sample.lvpMmHg);
  const lap = samples.map((sample) => sample.lapMmHg);
  const qMv = samples.map((sample) => sample.qMvMlPerSec);
  const volumes = samples.map((sample) => sample.lvVolumeMl);
  const laVolumes = samples.map((sample) => sample.laVolumeMl);
  return {
    beat,
    sampleCount: samples.length,
    strokeVolumeMl: finiteRangeOrNull(volumes),
    aovEjectedVolumeMl: flowIntegral(samples, (sample) => sample.qAovMlPerSec),
    mvForwardVolumeMl: flowIntegral(samples, (sample) => sample.qMvMlPerSec),
    pulmonaryVenousToLaVolumeMl: flowIntegral(samples, (sample) => sample.qPulmonaryVenousMlPerSec),
    pulmonaryVenousSourceVolumeMl: flowIntegral(samples, (sample) => sample.qPulmonaryVenousSourceMlPerSec),
    lvpPeakMmHg: finiteMaxOrNull(lvp),
    lapMinMmHg: finiteMinOrNull(lap),
    lapMaxMmHg: finiteMaxOrNull(lap),
    rootPressureMinMmHg: finiteMinOrNull(samples.map((sample) => sample.acceptedRootPressureMmHg)),
    rootPressureMaxMmHg: finiteMaxOrNull(samples.map((sample) => sample.acceptedRootPressureMmHg)),
    pulmonaryVenousPressureMinMmHg: finiteMinOrNull(samples.map((sample) => sample.acceptedPulmonaryVenousPressureMmHg)),
    pulmonaryVenousPressureMaxMmHg: finiteMaxOrNull(samples.map((sample) => sample.acceptedPulmonaryVenousPressureMmHg)),
    laVolumeMinMl: finiteMinOrNull(laVolumes),
    laVolumeMaxMl: finiteMaxOrNull(laVolumes),
    qMvPeakMlPerSec: finiteMaxOrNull(qMv),
    qAovPeakMlPerSec: finiteMaxOrNull(samples.map((sample) => sample.qAovMlPerSec)),
    qPulmonaryVenousPeakMlPerSec: finiteMaxOrNull(samples.map((sample) => sample.qPulmonaryVenousMlPerSec)),
    mvForwardPeakCount: positivePeakCount(qMv),
    mvC1ContinuityScore: computeShapeQualityMetricsV1(qMv).c1ContinuityScore,
    lvpShape: computeShapeQualityMetricsV1(lvp),
    qMvShape: computeShapeQualityMetricsV1(qMv),
    clampCount: samples.reduce((sum, sample) => sum + sample.volumeClampHit01, 0),
    maxSafetyPressureMmHg: finiteMaxOrNull(samples.map((sample) => Math.max(
      Math.abs(sample.lvpSafetyMmHg),
      Math.abs(sample.lapSafetyMmHg),
    ))),
  };
}

function classify(
  beat: BeatSummaryV1,
  aovEjectionDeltaMl: number,
  strokeVolumeDeltaMl: number,
  dtStable: boolean,
): LeftHeartPulmonaryBoundaryPointResultV1["classifications"] {
  const strokeVolume = beat.strokeVolumeMl ?? 0;
  const aovEjected = beat.aovEjectedVolumeMl ?? 0;
  const lvPvOk =
    (beat.lvpPeakMmHg ?? 0) >= 70
    && (beat.lvpPeakMmHg ?? 999) <= 190
    && beat.lvpShape.dominantPeakCount <= 1
    && (beat.lvpShape.fwhmFractionOfWindow ?? 0) >= 0.08
    && beat.lvpShape.c1ContinuityScore <= 0.35
    && beat.lvpShape.positiveCurvatureBurden <= 0.22;
  const mvfOk = beat.mvForwardPeakCount === 2 && beat.mvC1ContinuityScore <= 0.38;
  const outputOk = strokeVolume >= 35 && strokeVolume <= 110 && aovEjected >= 35;
  const repeatabilityOk = aovEjectionDeltaMl <= 20 && strokeVolumeDeltaMl <= 20;
  const flowCoupled = Math.abs(strokeVolume - aovEjected) <= 20;
  const clampFree = beat.clampCount === 0;
  return { lvPvOk, mvfOk, outputOk, repeatabilityOk, dtStable, flowCoupled, clampFree };
}

function failureReasonsFor(
  classifications: LeftHeartPulmonaryBoundaryPointResultV1["classifications"],
  beat: BeatSummaryV1,
  aovEjectionDeltaMl: number,
  strokeVolumeDeltaMl: number,
): readonly string[] {
  const failures: string[] = [];
  if (!classifications.lvPvOk) failures.push("lv-pv-shape-or-pressure");
  if (!classifications.mvfOk) failures.push("mvf-shape");
  if (!classifications.outputOk) {
    if ((beat.strokeVolumeMl ?? 0) < 35) failures.push("output-stroke-volume-too-low");
    if ((beat.aovEjectedVolumeMl ?? 0) < 35) failures.push("output-aov-ejected-volume-too-low");
    if ((beat.strokeVolumeMl ?? 999) > 110) failures.push("output-stroke-volume-too-high");
  }
  if (!classifications.repeatabilityOk) {
    if (aovEjectionDeltaMl > 20) failures.push("beat-to-beat-aov-alternans");
    if (strokeVolumeDeltaMl > 20) failures.push("beat-to-beat-stroke-alternans");
  }
  if (!classifications.dtStable) failures.push("dt-half-unstable");
  if (!classifications.flowCoupled) failures.push("volume-stroke-aov-flow-decoupled");
  if (!classifications.clampFree) failures.push("volume-clamp-hit");
  return failures;
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(8, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, 10).length;
}

function mergeNearbyPeaks(indices: readonly number[], minSeparation: number): readonly number[] {
  const out: number[] = [];
  for (const index of indices) {
    const last = out.at(-1);
    if (last == null || index - last > minSeparation) out.push(index);
    else if (index > last) out[out.length - 1] = index;
  }
  return out;
}

function flowIntegral(samples: readonly LeftHeartSubsystemSampleV2[], accessor: (sample: LeftHeartSubsystemSampleV2) => number): number | null {
  if (samples.length < 2) return null;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i]!.tSec - samples[i - 1]!.tSec;
    total += Math.max(0, accessor(samples[i]!)) * Math.max(0, dt);
  }
  return round(total);
}

function highContractilityPoint(
  variant: LeftHeartPulmonaryBoundaryVariantResultV1,
): LeftHeartPulmonaryBoundaryPointResultV1 | undefined {
  return variant.pointResults.find((point) => point.pointId === "left-heart-contractility-high");
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function finiteMinOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.min(...finite)) : null;
}

function finiteRangeOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite) - Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
