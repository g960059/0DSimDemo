import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runLaActivePulseMvReplayRefinementBenchV1,
} from "@/engine/mechanics2/benches/LaActivePulseMvReplayRefinementBench";
import { computeShapeQualityMetricsV1 } from "@/engine/mechanics2/metrics/ShapeQualityMetricsV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemRunV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_PRESSURE_SOURCE_SUBSTITUTION_CANDIDATE_REPORT_ID_V1 =
  "la-pressure-source-substitution-candidate-report-v1" as const;

type CandidateRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourcePointId: string;
  readonly baselineMvForwardPeakCount: number;
  readonly candidateMvForwardPeakCount: number;
  readonly baselineMvC1ContinuityScore: number;
  readonly candidateMvC1ContinuityScore: number;
  readonly baselineMvForwardVolumeMl: number;
  readonly candidateMvForwardVolumeMl: number;
  readonly candidateToBaselineMvForwardVolumeRatio: number;
  readonly baselineAovForwardVolumeMl: number;
  readonly candidateAovForwardVolumeMl: number;
  readonly candidateToBaselineAovForwardVolumeRatio: number;
  readonly candidateLapMeanAbsDeltaMmHg: number;
  readonly candidateLapRmsDeltaMmHg: number;
  readonly candidateLapFiberActivePulsePeak01: number;
  readonly candidateLapFiberActivePressurePeakMmHg: number;
  readonly baselineClampCount: number;
  readonly candidateMaxMassResidualAbsMl: number;
  readonly candidateClampCount: number;
  readonly baselineTransactionConvergedFraction: number;
  readonly candidateTransactionConvergedFraction: number;
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type LaPressureSourceSubstitutionCandidateReportV1 = {
  readonly reportId: typeof LA_PRESSURE_SOURCE_SUBSTITUTION_CANDIDATE_REPORT_ID_V1;
  readonly gateId: "laPressureSourceSubstitutionCandidateV1";
  readonly upstreamActivePulseRefinement: {
    readonly requiredStatus: "la-active-pulse-mv-replay-refinement-signal";
    readonly observedStatus: ReturnType<
      typeof runLaActivePulseMvReplayRefinementBenchV1
    >["decision"]["laActivePulseMvReplayRefinementStatus"];
    readonly selectedMode: ReturnType<
      typeof runLaActivePulseMvReplayRefinementBenchV1
    >["decision"]["selectedMode"];
  };
  readonly candidateMode:
    "left-heart-source-surface-fiber-active-a-window-gated-shadow";
  readonly rows: readonly CandidateRowV1[];
  readonly summary: {
    readonly total: 7;
    readonly pass: number;
    readonly fail: number;
    readonly mvfCleanCount: number;
    readonly outputParityCount: number;
    readonly clampFreeCount: number;
    readonly clampRegressionFreeCount: number;
    readonly meanLapRmsDeltaMmHg: number;
    readonly meanMvForwardVolumeRatio: number;
    readonly meanAovForwardVolumeRatio: number;
  };
  readonly decision: {
    readonly laPressureSourceSubstitutionCandidateStatus:
      | "la-pressure-source-substitution-candidate-signal"
      | "la-pressure-source-substitution-candidate-mixed-signal"
      | "la-pressure-source-substitution-candidate-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
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

export function runLaPressureSourceSubstitutionCandidateBenchV1():
LaPressureSourceSubstitutionCandidateReportV1 {
  const upstream = runLaActivePulseMvReplayRefinementBenchV1();
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
      runLeftHeartSubsystemV2(baselineParams),
      runLeftHeartSubsystemV2(candidateParams),
    );
  });
  const pass = rows.filter((row) => row.status === "pass").length;
  const upstreamOk =
    upstream.decision.laActivePulseMvReplayRefinementStatus
    === "la-active-pulse-mv-replay-refinement-signal"
    && upstream.decision.selectedMode === "fiber-active-a-window-gated";
  return {
    reportId: LA_PRESSURE_SOURCE_SUBSTITUTION_CANDIDATE_REPORT_ID_V1,
    gateId: "laPressureSourceSubstitutionCandidateV1",
    upstreamActivePulseRefinement: {
      requiredStatus: "la-active-pulse-mv-replay-refinement-signal",
      observedStatus: upstream.decision.laActivePulseMvReplayRefinementStatus,
      selectedMode: upstream.decision.selectedMode,
    },
    candidateMode: "left-heart-source-surface-fiber-active-a-window-gated-shadow",
    rows,
    summary: {
      total: 7,
      pass,
      fail: rows.length - pass,
      mvfCleanCount: rows.filter((row) =>
        row.candidateMvForwardPeakCount === 2 && row.candidateMvC1ContinuityScore <= 0.42
      ).length,
      outputParityCount: rows.filter((row) =>
        row.candidateToBaselineAovForwardVolumeRatio >= 0.80
        && row.candidateToBaselineAovForwardVolumeRatio <= 1.20
      ).length,
      clampFreeCount: rows.filter((row) => row.candidateClampCount === 0).length,
      clampRegressionFreeCount: rows.filter((row) =>
        row.candidateClampCount <= row.baselineClampCount
      ).length,
      meanLapRmsDeltaMmHg: round(mean(rows.map((row) => row.candidateLapRmsDeltaMmHg))),
      meanMvForwardVolumeRatio: round(mean(rows.map((row) => row.candidateToBaselineMvForwardVolumeRatio))),
      meanAovForwardVolumeRatio: round(mean(rows.map((row) => row.candidateToBaselineAovForwardVolumeRatio))),
    },
    decision: {
      laPressureSourceSubstitutionCandidateStatus: upstreamOk && pass === rows.length
        ? "la-pressure-source-substitution-candidate-signal"
        : upstreamOk && pass >= 5
          ? "la-pressure-source-substitution-candidate-mixed-signal"
          : "la-pressure-source-substitution-candidate-blocked",
      nextAction: upstreamOk && pass === rows.length
        ? "Proceed only to a four-chamber source/reservoir shadow review using the selected LA pressure source mode. Keep runtime, AV-plane, and LandAtrial locked."
        : upstreamOk && pass >= 5
          ? "Keep promotion blocked and classify the remaining source-substitution candidate residuals before any four-chamber or runtime path."
          : "Keep source substitution blocked; the selected active-pulse mode does not preserve the left-heart source surface in closed-loop replay.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
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
  baseline: LeftHeartSubsystemRunV2,
  candidate: LeftHeartSubsystemRunV2,
): CandidateRowV1 {
  const baselineBeat = baseline.finalBeatSamples;
  const candidateBeat = candidate.finalBeatSamples;
  const baselineQmv = baselineBeat.map((sample) => sample.qMvMlPerSec);
  const candidateQmv = candidateBeat.map((sample) => sample.qMvMlPerSec);
  const baselineAov = baselineBeat.map((sample) => sample.qAovMlPerSec);
  const candidateAov = candidateBeat.map((sample) => sample.qAovMlPerSec);
  const baselineLap = baselineBeat.map((sample) => sample.lapMmHg);
  const candidateLap = candidateBeat.map((sample) => sample.lapMmHg);
  const candidateShape = computeShapeQualityMetricsV1(candidateQmv);
  const baselineShape = computeShapeQualityMetricsV1(baselineQmv);
  const dtSec = 1 / Math.max(candidateBeat.length, 1);
  const base = {
    profileId,
    sourcePointId,
    baselineMvForwardPeakCount: positivePeakCount(baselineQmv),
    candidateMvForwardPeakCount: positivePeakCount(candidateQmv),
    baselineMvC1ContinuityScore: round(baselineShape.c1ContinuityScore),
    candidateMvC1ContinuityScore: round(candidateShape.c1ContinuityScore),
    baselineMvForwardVolumeMl: round(forwardFlowVolume(baselineQmv, dtSec)),
    candidateMvForwardVolumeMl: round(forwardFlowVolume(candidateQmv, dtSec)),
    candidateToBaselineMvForwardVolumeRatio: round(
      forwardFlowVolume(candidateQmv, dtSec) / Math.max(forwardFlowVolume(baselineQmv, dtSec), 1e-9),
    ),
    baselineAovForwardVolumeMl: round(forwardFlowVolume(baselineAov, dtSec)),
    candidateAovForwardVolumeMl: round(forwardFlowVolume(candidateAov, dtSec)),
    candidateToBaselineAovForwardVolumeRatio: round(
      forwardFlowVolume(candidateAov, dtSec) / Math.max(forwardFlowVolume(baselineAov, dtSec), 1e-9),
    ),
    candidateLapMeanAbsDeltaMmHg: round(meanAbsDelta(baselineLap, candidateLap)),
    candidateLapRmsDeltaMmHg: round(rmsDelta(baselineLap, candidateLap)),
    candidateLapFiberActivePulsePeak01: round(Math.max(...candidateBeat.map((sample) => sample.lapFiberActivePulse01))),
    candidateLapFiberActivePressurePeakMmHg: round(Math.max(...candidateBeat.map((sample) =>
      sample.lapFiberActivePressureMmHg
    ))),
    baselineClampCount: baseline.clampCount,
    candidateMaxMassResidualAbsMl: round(maxAbs(candidateBeat.map((sample) => sample.massResidualMl))),
    candidateClampCount: candidate.clampCount,
    baselineTransactionConvergedFraction: round(mean(baselineBeat.map((sample) => sample.transactionConverged01))),
    candidateTransactionConvergedFraction: round(mean(candidateBeat.map((sample) => sample.transactionConverged01))),
  };
  const failureReasons = failureReasonsFor(base);
  return {
    ...base,
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function failureReasonsFor(row: Omit<CandidateRowV1, "status" | "failureReasons">): readonly string[] {
  const failures: string[] = [];
  if (row.candidateMvForwardPeakCount !== 2) failures.push("candidate-mvf-not-biphasic");
  if (row.candidateMvC1ContinuityScore > 0.42) failures.push("candidate-mvf-c1-kink");
  if (row.candidateToBaselineMvForwardVolumeRatio < 0.78 || row.candidateToBaselineMvForwardVolumeRatio > 1.22) {
    failures.push("candidate-mv-forward-volume-ratio-wide");
  }
  if (row.candidateToBaselineAovForwardVolumeRatio < 0.80 || row.candidateToBaselineAovForwardVolumeRatio > 1.20) {
    failures.push("candidate-aov-output-ratio-wide");
  }
  if (row.candidateClampCount > row.baselineClampCount) failures.push("candidate-new-clamp-hit");
  if (row.candidateMaxMassResidualAbsMl > 0.08) failures.push("candidate-mass-residual-wide");
  return failures;
}

function positivePeakCount(values: readonly number[]): number {
  const maxValue = Math.max(0, ...values);
  const threshold = 0.12 * Math.max(maxValue, 1e-9);
  let count = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const cur = values[i]!;
    if (cur <= threshold) continue;
    if (cur > values[i - 1]! && cur >= values[i + 1]!) count++;
  }
  return count;
}

function forwardFlowVolume(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, q) => sum + Math.max(0, q) * dtSec, 0);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanAbsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / count;
}

function rmsDelta(a: readonly number[], b: readonly number[]): number {
  const count = Math.min(a.length, b.length);
  if (count === 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += (a[i]! - b[i]!) ** 2;
  return Math.sqrt(sum / count);
}

function maxAbs(values: readonly number[]): number {
  return Math.max(0, ...values.map((value) => Math.abs(value)));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
