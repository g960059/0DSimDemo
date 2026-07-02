import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLaPressureSourceSubstitutionCandidateBenchV1,
} from "@/engine/mechanics2/benches/LaPressureSourceSubstitutionCandidateBench";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_PRESSURE_SOURCE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1 =
  "la-pressure-source-residual-attribution-report-v1" as const;

type ResidualClassV1 =
  | "closed-loop-ea-collapse-with-preserved-volume"
  | "fiber-pulse-shape-differs-from-empirical-a-window"
  | "late-gradient-support-eroded"
  | "late-flow-distribution-eroded"
  | "candidate-new-clamp"
  | "output-parity-loss"
  | "mass-residual";

type PeakSummaryV1 = {
  readonly count: number;
  readonly theta: readonly number[];
  readonly value: readonly number[];
};

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly baselineMvPeaks: PeakSummaryV1;
  readonly candidateMvPeaks: PeakSummaryV1;
  readonly baselineGradientPeaks: PeakSummaryV1;
  readonly candidateGradientPeaks: PeakSummaryV1;
  readonly baselineLateForwardFraction: number;
  readonly candidateLateForwardFraction: number;
  readonly lateForwardFractionDelta: number;
  readonly baselineLateGradientFraction: number;
  readonly candidateLateGradientFraction: number;
  readonly lateGradientFractionDelta: number;
  readonly empiricalPulsePeakTheta: number;
  readonly fiberPulsePeakTheta: number;
  readonly activePulsePeakThetaDelta: number;
  readonly empiricalPulseFwhmFraction: number | null;
  readonly fiberPulseFwhmFraction: number | null;
  readonly fiberVsEmpiricalPulseRms: number;
  readonly mvForwardVolumeRatio: number;
  readonly aovForwardVolumeRatio: number;
  readonly baselineClampCount: number;
  readonly candidateClampCount: number;
  readonly candidateMaxMassResidualAbsMl: number;
  readonly classes: readonly ResidualClassV1[];
};

export type LaPressureSourceResidualAttributionReportV1 = {
  readonly reportId: typeof LA_PRESSURE_SOURCE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "laPressureSourceResidualAttributionV1";
  readonly upstreamSourceCandidate: {
    readonly requiredStatus: "la-pressure-source-substitution-candidate-blocked";
    readonly observedStatus: ReturnType<
      typeof runLaPressureSourceSubstitutionCandidateBenchV1
    >["decision"]["laPressureSourceSubstitutionCandidateStatus"];
    readonly pass: number;
    readonly mvfCleanCount: number;
    readonly outputParityCount: number;
    readonly clampRegressionFreeCount: number;
  };
  readonly rows: readonly RowV1[];
  readonly summary: {
    readonly total: 7;
    readonly eaCollapsePreservedVolumeCount: number;
    readonly fiberPulseShapeDiffCount: number;
    readonly lateGradientErodedCount: number;
    readonly lateFlowErodedCount: number;
    readonly outputParityLossCount: number;
    readonly candidateNewClampCount: number;
    readonly meanFiberVsEmpiricalPulseRms: number;
    readonly meanLateGradientFractionDelta: number;
    readonly meanLateForwardFractionDelta: number;
  };
  readonly decision: {
    readonly laPressureSourceResidualAttributionStatus:
      | "la-pressure-source-residual-attribution-complete"
      | "la-pressure-source-residual-attribution-inconclusive";
    readonly residualOwner: string;
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourceSurfaceSubstitution: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID = "active-length-mv-closure-stateful-root08" as const;

const PROFILE_IDS: readonly FourChamberSubsystemProfileIdV1[] = [
  "normal-hr75",
  "normal-hr90",
  "preload-low",
  "preload-high",
  "afterload-high",
  "contractility-low",
  "contractility-high",
];

export function runLaPressureSourceResidualAttributionBenchV1():
LaPressureSourceResidualAttributionReportV1 {
  const upstream = runLaPressureSourceSubstitutionCandidateBenchV1();
  const paramsByProfile = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rows = PROFILE_IDS.map((profileId, index) => {
    const baselineParams = paramsByProfile[index]!;
    const candidateParams: LeftHeartSubsystemParamsV2 = {
      ...baselineParams,
      laPressureSourceMode: "fiber-active-a-window-gated-shadow",
      laFiberActivePressureReferenceMmHg: 11,
    };
    return rowForRuns(
      profileId,
      baselineParams.fixtureId,
      baselineParams,
      runLeftHeartSubsystemV2(baselineParams),
      runLeftHeartSubsystemV2(candidateParams),
    );
  });
  const summary = {
    total: 7 as const,
    eaCollapsePreservedVolumeCount: classCount(rows, "closed-loop-ea-collapse-with-preserved-volume"),
    fiberPulseShapeDiffCount: classCount(rows, "fiber-pulse-shape-differs-from-empirical-a-window"),
    lateGradientErodedCount: classCount(rows, "late-gradient-support-eroded"),
    lateFlowErodedCount: classCount(rows, "late-flow-distribution-eroded"),
    outputParityLossCount: classCount(rows, "output-parity-loss"),
    candidateNewClampCount: classCount(rows, "candidate-new-clamp"),
    meanFiberVsEmpiricalPulseRms: round(mean(rows.map((row) => row.fiberVsEmpiricalPulseRms))),
    meanLateGradientFractionDelta: round(mean(rows.map((row) => row.lateGradientFractionDelta))),
    meanLateForwardFractionDelta: round(mean(rows.map((row) => row.lateForwardFractionDelta))),
  };
  const upstreamBlocked =
    upstream.decision.laPressureSourceSubstitutionCandidateStatus
    === "la-pressure-source-substitution-candidate-blocked";
  const hasClearOwner =
    upstreamBlocked
    && summary.eaCollapsePreservedVolumeCount >= 5
    && summary.outputParityLossCount === 0
    && summary.candidateNewClampCount === 0;
  return {
    reportId: LA_PRESSURE_SOURCE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1,
    gateId: "laPressureSourceResidualAttributionV1",
    upstreamSourceCandidate: {
      requiredStatus: "la-pressure-source-substitution-candidate-blocked",
      observedStatus: upstream.decision.laPressureSourceSubstitutionCandidateStatus,
      pass: upstream.summary.pass,
      mvfCleanCount: upstream.summary.mvfCleanCount,
      outputParityCount: upstream.summary.outputParityCount,
      clampRegressionFreeCount: upstream.summary.clampRegressionFreeCount,
    },
    rows,
    summary,
    decision: {
      laPressureSourceResidualAttributionStatus: hasClearOwner
        ? "la-pressure-source-residual-attribution-complete"
        : "la-pressure-source-residual-attribution-inconclusive",
      residualOwner: hasClearOwner
        ? "closed-loop LA active-pressure source shape collapses MVF E/A separation while preserving forward volume/output"
        : "residual owner remains mixed or inconclusive",
      nextAction: hasClearOwner
        ? "Keep LA pressure source substitution blocked. Continue atrial-fiber work as shadow/readback until a valve/source co-owned pressure-gradient contract is designed; do not tune AV-plane or LandAtrial against this residual."
        : "Do not promote source substitution; add focused waveform attribution before the next model surface.",
      blockedClaims: [
        "source-surface-substitution",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourceSurfaceSubstitution: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function rowForRuns(
  profileId: FourChamberSubsystemProfileIdV1,
  sourcePointId: string,
  baselineParams: LeftHeartSubsystemParamsV2,
  baseline: LeftHeartSubsystemRunV2,
  candidate: LeftHeartSubsystemRunV2,
): RowV1 {
  const baselineBeat = baseline.finalBeatSamples;
  const candidateBeat = candidate.finalBeatSamples;
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const candidateQmv = candidateBeat.map((sample) => sample.qMvMlPerSec);
  const baselineGradient = baselineBeat.map((sample) => Math.max(0, sample.lapMmHg - sample.lvpMmHg));
  const candidateGradient = candidateBeat.map((sample) => Math.max(0, sample.lapMmHg - sample.lvpMmHg));
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const candidateAov = candidateBeat.map((sample) => sample.qAovMlPerSec);
  const empiricalPulse = candidateBeat.map((sample) =>
    sample.lapEmpiricalAWaveMmHg / Math.max(baselineParams.laAWaveMmHg, 1e-9)
  );
  const fiberPulse = candidateBeat.map((sample) => sample.lapFiberActivePulse01);
  const theta = candidateBeat.map((sample) => sample.theta);
  const baselineLateForwardFraction = lateFraction(candidateBeat, baselineQmv);
  const candidateLateForwardFraction = lateFraction(candidateBeat, candidateQmv);
  const baselineLateGradientFraction = lateFraction(candidateBeat, baselineGradient);
  const candidateLateGradientFraction = lateFraction(candidateBeat, candidateGradient);
  const rowBase = {
    profileId,
    sourcePointId,
    baselineMvPeaks: peakSummary(theta, baselineQmv),
    candidateMvPeaks: peakSummary(theta, candidateQmv),
    baselineGradientPeaks: peakSummary(theta, baselineGradient),
    candidateGradientPeaks: peakSummary(theta, candidateGradient),
    baselineLateForwardFraction: round(baselineLateForwardFraction),
    candidateLateForwardFraction: round(candidateLateForwardFraction),
    lateForwardFractionDelta: round(candidateLateForwardFraction - baselineLateForwardFraction),
    baselineLateGradientFraction: round(baselineLateGradientFraction),
    candidateLateGradientFraction: round(candidateLateGradientFraction),
    lateGradientFractionDelta: round(candidateLateGradientFraction - baselineLateGradientFraction),
    empiricalPulsePeakTheta: round(thetaAtMax(theta, empiricalPulse)),
    fiberPulsePeakTheta: round(thetaAtMax(theta, fiberPulse)),
    activePulsePeakThetaDelta: round(circularDistance(thetaAtMax(theta, empiricalPulse), thetaAtMax(theta, fiberPulse))),
    empiricalPulseFwhmFraction: fwhmFraction(empiricalPulse),
    fiberPulseFwhmFraction: fwhmFraction(fiberPulse),
    fiberVsEmpiricalPulseRms: round(rmsDelta(empiricalPulse, fiberPulse)),
    mvForwardVolumeRatio: round(
      forwardFlowVolume(candidateQmv, dtSec(candidateBeat))
      / Math.max(forwardFlowVolume(baselineQmv, dtSec(baselineBeat)), 1e-9),
    ),
    aovForwardVolumeRatio: round(
      forwardFlowVolume(candidateAov, dtSec(candidateBeat))
      / Math.max(forwardFlowVolume(baselineAov, dtSec(baselineBeat)), 1e-9),
    ),
    baselineClampCount: baseline.clampCount,
    candidateClampCount: candidate.clampCount,
    candidateMaxMassResidualAbsMl: round(maxAbs(candidateBeat.map((sample) => sample.massResidualMl))),
  };
  return { ...rowBase, classes: classify(rowBase) };
}

function classify(row: Omit<RowV1, "classes">): readonly ResidualClassV1[] {
  const classes: ResidualClassV1[] = [];
  const volumePreserved =
    row.mvForwardVolumeRatio >= 0.96
    && row.mvForwardVolumeRatio <= 1.04
    && row.aovForwardVolumeRatio >= 0.96
    && row.aovForwardVolumeRatio <= 1.04;
  if (row.candidateMvPeaks.count < row.baselineMvPeaks.count && volumePreserved) {
    classes.push("closed-loop-ea-collapse-with-preserved-volume");
  }
  if (row.fiberVsEmpiricalPulseRms > 0.12 || row.activePulsePeakThetaDelta > 0.04) {
    classes.push("fiber-pulse-shape-differs-from-empirical-a-window");
  }
  if (row.lateGradientFractionDelta < -0.08) classes.push("late-gradient-support-eroded");
  if (row.lateForwardFractionDelta < -0.08) classes.push("late-flow-distribution-eroded");
  if (row.candidateClampCount > row.baselineClampCount) classes.push("candidate-new-clamp");
  if (!volumePreserved) classes.push("output-parity-loss");
  if (row.candidateMaxMassResidualAbsMl > 0.08) classes.push("mass-residual");
  return classes;
}

function peakSummary(theta: readonly number[], values: readonly number[]): PeakSummaryV1 {
  const maxValue = Math.max(0, ...values);
  const threshold = 0.12 * Math.max(maxValue, 1e-9);
  const peaks: Array<{ theta: number; value: number }> = [];
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= threshold) continue;
    if (cur > values[i - 1]! && cur >= values[i + 1]!) {
      peaks.push({ theta: round(theta[i]!), value: round(cur) });
    }
  }
  return {
    count: peaks.length,
    theta: peaks.map((peak) => peak.theta),
    value: peaks.map((peak) => peak.value),
  };
}

function lateFraction(samples: readonly LeftHeartSubsystemSampleV2[], values: readonly number[]): number {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 1e-9) return 0;
  const late = values.reduce((sum, value, index) => {
    const theta = samples[index]?.theta ?? 0;
    if (theta < 0.78 || theta > 0.99) return sum;
    return sum + Math.max(0, value);
  }, 0);
  return late / total;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, q) => sum + Math.max(0, q) * dtSec, 0);
}

function dtSec(samples: readonly LeftHeartSubsystemSampleV2[]): number {
  if (samples.length < 2) return 1;
  return Math.max(1e-9, samples[1]!.tSec - samples[0]!.tSec);
}

function thetaAtMax(theta: readonly number[], values: readonly number[]): number {
  let maxValue = Number.NEGATIVE_INFINITY;
  let maxIndex = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i]! > maxValue) {
      maxValue = values[i]!;
      maxIndex = i;
    }
  }
  return theta[maxIndex] ?? 0;
}

function fwhmFraction(values: readonly number[]): number | null {
  const maxValue = Math.max(0, ...values);
  if (maxValue <= 1e-9) return null;
  const threshold = 0.5 * maxValue;
  const hits = values.filter((value) => value >= threshold).length;
  return round(hits / Math.max(values.length, 1));
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function circularDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

function classCount(rows: readonly RowV1[], cls: ResidualClassV1): number {
  return rows.filter((row) => row.classes.includes(cls)).length;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  if (value == null || !Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
