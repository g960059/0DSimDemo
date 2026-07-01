import {
  buildLeftHeartArchitectureEnvelopeV1,
  runLeftHeartArchitectureComparisonBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartArchitectureComparisonBench";
import { computeShapeQualityMetricsV1, type ShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

export const LEFT_HEART_RESIDUAL_ATTRIBUTION_REPORT_ID_V1 =
  "left-heart-residual-attribution-report-v1" as const;

export type LeftHeartResidualPointAttributionV1 = {
  readonly pointId: string;
  readonly status: "artifact-residual" | "output-reserve-residual" | "pass";
  readonly classification:
    | "afterload-output-reserve"
    | "contractility-low-output-reserve"
    | "contractility-high-flow-decoupled-mvf-kink"
    | "no-residual";
  readonly strokeVolumeMl: number | null;
  readonly lvpPeakMmHg: number | null;
  readonly lvActivePressurePeakMmHg: number | null;
  readonly lvSeriesPressurePeakMmHg: number | null;
  readonly lvPassivePressurePeakMmHg: number | null;
  readonly qMvPeakMlPerSec: number | null;
  readonly qAovPeakMlPerSec: number | null;
  readonly mvForwardPeakCount: number;
  readonly mvPeakTheta: readonly number[];
  readonly aovEjectedVolumeMl: number | null;
  readonly rootPressurePeakMmHg: number | null;
  readonly mvPressureGradientRangeMmHg: readonly [number | null, number | null];
  readonly mvOpenRange01: readonly [number | null, number | null];
  readonly mvQDotPeakAbsMlPerSec2: number | null;
  readonly mvC1ContinuityScore: number;
  readonly maxAbsMassResidualMl: number | null;
  readonly clampCount: number;
  readonly maxSafetyPressureMmHg: number | null;
  readonly maxTransactionResidualNormMl: number | null;
  readonly lvpShape: ShapeQualityMetricsV1;
  readonly qMvShape: ShapeQualityMetricsV1;
  readonly attributionFlags: {
    readonly lowStrokeVolume: boolean;
    readonly lowAovEjection: boolean;
    readonly mvfKink: boolean;
    readonly mvfNotBiphasic: boolean;
    readonly massResidual: boolean;
    readonly clampHit: boolean;
    readonly softSafetyActive: boolean;
  };
};

export type LeftHeartResidualAttributionReportV1 = {
  readonly reportId: typeof LEFT_HEART_RESIDUAL_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "leftHeartResidualAttributionGateV1";
  readonly sourceComparison: {
    readonly reportId: "left-heart-architecture-comparison-report-v1";
    readonly targetSurface: "v2-fixed2-soft";
    readonly summary: {
      readonly pass: number;
      readonly total: number;
      readonly lvPvOkCount: number;
      readonly mvfOkCount: number;
      readonly outputOkCount: number;
    };
  };
  readonly pointAttributions: readonly LeftHeartResidualPointAttributionV1[];
  readonly decision: {
    readonly leftHeartGateBStatus: "mixed-attributed";
    readonly lowContractilityArtifactSeparated: boolean;
    readonly highContractilityFlowDecoupledMvfKinkRemains: boolean;
    readonly afterloadOutputReserveRemains: boolean;
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

export function runLeftHeartResidualAttributionBenchV1(): LeftHeartResidualAttributionReportV1 {
  const comparison = runLeftHeartArchitectureComparisonBenchV1();
  const target = comparison.variantResults.find((variant) => variant.variantId === "v2-fixed2-soft");
  if (target == null) throw new Error("v2-fixed2-soft surface is required for residual attribution");
  const params = buildLeftHeartArchitectureEnvelopeV1({
    transactionMode: "fixed-point",
    transactionIterations: 2,
    transactionRelaxation: 0.5,
    volumeSafetyMode: "soft-pressure",
  }).filter((point) =>
    point.fixtureId === "left-heart-afterload-high"
    || point.fixtureId === "left-heart-contractility-low"
    || point.fixtureId === "left-heart-contractility-high"
  );
  const pointAttributions = params.map(runPointAttribution);
  const contractilityLow = pointAttributions.find((point) => point.pointId === "left-heart-contractility-low");
  const contractilityHigh = pointAttributions.find((point) => point.pointId === "left-heart-contractility-high");
  const afterloadHigh = pointAttributions.find((point) => point.pointId === "left-heart-afterload-high");
  const lowContractilityArtifactSeparated = Boolean(
    contractilityLow?.attributionFlags.lowStrokeVolume
    && !contractilityLow.attributionFlags.mvfKink
    && !contractilityLow.attributionFlags.mvfNotBiphasic
    && !contractilityLow.attributionFlags.massResidual
    && !contractilityLow.attributionFlags.clampHit,
  );
  const highContractilityFlowDecoupledMvfKinkRemains = Boolean(
    contractilityHigh?.attributionFlags.lowAovEjection
    || contractilityHigh?.attributionFlags.mvfKink,
  );
  const afterloadOutputReserveRemains = Boolean(afterloadHigh?.attributionFlags.lowStrokeVolume);
  return {
    reportId: LEFT_HEART_RESIDUAL_ATTRIBUTION_REPORT_ID_V1,
    gateId: "leftHeartResidualAttributionGateV1",
    sourceComparison: {
      reportId: comparison.reportId,
      targetSurface: "v2-fixed2-soft",
      summary: {
        pass: target.summary.pass,
        total: target.summary.total,
        lvPvOkCount: target.summary.lvPvOkCount,
        mvfOkCount: target.summary.mvfOkCount,
        outputOkCount: target.summary.outputOkCount,
      },
    },
    pointAttributions,
    decision: {
      leftHeartGateBStatus: "mixed-attributed",
      lowContractilityArtifactSeparated,
      highContractilityFlowDecoupledMvfKinkRemains,
      afterloadOutputReserveRemains,
      nextAction: "Keep the next MechanicsCore2 phase in left-heart Gate B: classify output reserve and root-cause the high-contractility MVF kink before right-heart, four-chamber, or LandAtrial work.",
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

function runPointAttribution(params: LeftHeartSubsystemParamsV2): LeftHeartResidualPointAttributionV1 {
  const run = runLeftHeartSubsystemV2(params);
  const beat = run.finalBeatSamples;
  const lvp = beat.map((sample) => sample.lvpMmHg);
  const qMv = beat.map((sample) => sample.qMvMlPerSec);
  const volumes = beat.map((sample) => sample.lvVolumeMl);
  const lvpShape = computeShapeQualityMetricsV1(lvp);
  const qMvShape = computeShapeQualityMetricsV1(qMv);
  const mvPeakIndices = positivePeakIndices(qMv);
  const strokeVolumeMl = finiteRangeOrNull(volumes);
  const aovEjectedVolumeMl = flowIntegral(beat, (sample) => sample.qAovMlPerSec);
  const maxAbsMassResidualMl = finiteMaxOrNull(beat.map((sample) => Math.abs(sample.massResidualMl)));
  const clampCount = beat.reduce((sum, sample) => sum + sample.volumeClampHit01, 0);
  const maxSafetyPressureMmHg = finiteMaxOrNull(beat.map((sample) => Math.max(
    Math.abs(sample.lvpSafetyMmHg),
    Math.abs(sample.lapSafetyMmHg),
  )));
  const attributionFlags = {
    lowStrokeVolume: (strokeVolumeMl ?? 0) < 35,
    lowAovEjection: (aovEjectedVolumeMl ?? 0) < 35,
    mvfKink: qMvShape.c1ContinuityScore > 0.38,
    mvfNotBiphasic: mvPeakIndices.length !== 2,
    massResidual: (maxAbsMassResidualMl ?? 999) > 1e-6,
    clampHit: clampCount > 0,
    softSafetyActive: (maxSafetyPressureMmHg ?? 0) > 0.05,
  };
  return {
    pointId: params.fixtureId,
    status: statusFor(params.fixtureId, attributionFlags),
    classification: classificationFor(params.fixtureId, attributionFlags),
    strokeVolumeMl,
    lvpPeakMmHg: finiteMaxOrNull(lvp),
    lvActivePressurePeakMmHg: finiteMaxOrNull(beat.map((sample) => sample.lvChamber.activePressureMmHg)),
    lvSeriesPressurePeakMmHg: finiteMaxOrNull(beat.map((sample) => sample.lvChamber.seriesPressureMmHg)),
    lvPassivePressurePeakMmHg: finiteMaxOrNull(beat.map((sample) => sample.lvChamber.passivePressureMmHg)),
    qMvPeakMlPerSec: finiteMaxOrNull(qMv),
    qAovPeakMlPerSec: finiteMaxOrNull(beat.map((sample) => sample.qAovMlPerSec)),
    mvForwardPeakCount: mvPeakIndices.length,
    mvPeakTheta: mvPeakIndices.map((index) => round(beat[index]?.theta ?? 0)),
    aovEjectedVolumeMl,
    rootPressurePeakMmHg: finiteMaxOrNull(beat.map((sample) => sample.acceptedRootPressureMmHg)),
    mvPressureGradientRangeMmHg: [
      finiteMinOrNull(beat.map((sample) => sample.mv.pressureGradientMmHg)),
      finiteMaxOrNull(beat.map((sample) => sample.mv.pressureGradientMmHg)),
    ],
    mvOpenRange01: [
      finiteMinOrNull(beat.map((sample) => sample.mv.open01)),
      finiteMaxOrNull(beat.map((sample) => sample.mv.open01)),
    ],
    mvQDotPeakAbsMlPerSec2: finiteMaxOrNull(beat.map((sample) => Math.abs(sample.mv.qDotMlPerSec2))),
    mvC1ContinuityScore: qMvShape.c1ContinuityScore,
    maxAbsMassResidualMl,
    clampCount,
    maxSafetyPressureMmHg,
    maxTransactionResidualNormMl: finiteMaxOrNull(beat.map((sample) => sample.transactionResidualNormMl)),
    lvpShape,
    qMvShape,
    attributionFlags,
  };
}

function statusFor(
  fixtureId: string,
  flags: LeftHeartResidualPointAttributionV1["attributionFlags"],
): LeftHeartResidualPointAttributionV1["status"] {
  const flowDecoupled = fixtureId === "left-heart-contractility-high" && flags.lowAovEjection;
  if (flowDecoupled || flags.mvfKink || flags.mvfNotBiphasic || flags.massResidual || flags.clampHit) {
    return "artifact-residual";
  }
  if (flags.lowStrokeVolume || flags.lowAovEjection) return "output-reserve-residual";
  return fixtureId.includes("high") || fixtureId.includes("low") ? "pass" : "pass";
}

function classificationFor(
  fixtureId: string,
  flags: LeftHeartResidualPointAttributionV1["attributionFlags"],
): LeftHeartResidualPointAttributionV1["classification"] {
  if (fixtureId === "left-heart-afterload-high" && flags.lowStrokeVolume) return "afterload-output-reserve";
  if (fixtureId === "left-heart-contractility-low" && flags.lowStrokeVolume) return "contractility-low-output-reserve";
  if (fixtureId === "left-heart-contractility-high" && (flags.lowAovEjection || flags.mvfKink || flags.mvfNotBiphasic)) {
    return "contractility-high-flow-decoupled-mvf-kink";
  }
  return "no-residual";
}

function positivePeakIndices(values: readonly number[]): readonly number[] {
  const maxValue = Math.max(0, ...values);
  const threshold = Math.max(8, 0.12 * maxValue);
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur > threshold && cur > values[i - 1]! && cur >= values[i + 1]!) peaks.push(i);
  }
  return mergeNearbyPeaks(peaks, 10);
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
