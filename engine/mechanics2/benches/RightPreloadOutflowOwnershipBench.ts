import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RIGHT_PRELOAD_OUTFLOW_OWNERSHIP_REPORT_ID_V1 =
  "right-preload-outflow-ownership-report-v1" as const;

type CandidateIdV1 =
  | "right-source-reference"
  | "pv-resistance150"
  | "pv-open-tau030"
  | "pv-bernoulli300"
  | "pv-resistance200-negative-control"
  | "pa-drive050-negative-control";

type CandidateSpecV1 = {
  readonly candidateId: CandidateIdV1;
  readonly description: string;
  readonly pvResistanceMultiplier: number;
  readonly pvBernoulliMultiplier: number;
  readonly pvTauOpenSec: number | null;
  readonly paOutflowStatefulResistanceGain: number;
  readonly paOutflowStatefulDriveStartMmHg: number | null;
  readonly paOutflowStatefulDriveEndMmHg: number | null;
  readonly paOutflowStatefulFallTauSec: number | null;
};

type CandidateResultV1 = {
  readonly candidateId: CandidateIdV1;
  readonly description: string;
  readonly intervention: Omit<CandidateSpecV1, "candidateId" | "description">;
  readonly pointResults: readonly {
    readonly pointId: string;
    readonly status: RightHeartStrategicSmokePointResultV1["status"];
    readonly failureReasons: readonly string[];
    readonly pvEjectedVolumeMl: number | null;
    readonly repeatabilityDeltaMl: number | null;
    readonly dtHalfDeltaMl: number | null;
    readonly tvC1ContinuityScore: number | null;
    readonly maxSafetyPressureMmHg: number | null;
  }[];
  readonly rightPreloadLongEpoch: readonly RightPreloadLongEpochPointV1[];
  readonly summary: {
    readonly pass: number;
    readonly total: number;
    readonly rightPreloadPass: boolean;
    readonly rightPreloadLongEpochPass: boolean;
    readonly morphologyOkCount: number;
    readonly outputOkCount: number;
    readonly repeatabilityOkCount: number;
    readonly dtOutputParityOkCount: number;
    readonly safetyWorkBoundedCount: number;
    readonly maxLongEpochRepeatabilityDeltaMl: number | null;
    readonly maxLongEpochDtHalfOutputDeltaMl: number | null;
  };
};

type RightPreloadLongEpochPointV1 = {
  readonly beats: number;
  readonly status: RightHeartStrategicSmokePointResultV1["status"];
  readonly failureReasons: readonly string[];
  readonly pvEjectedVolumeMl: number | null;
  readonly previousPvEjectedVolumeMl: number | null;
  readonly dtHalfPvEjectedVolumeMl: number | null;
  readonly repeatabilityDeltaMl: number | null;
  readonly dtHalfOutputDeltaMl: number | null;
  readonly tvForwardVolumeMl: number | null;
  readonly rvVolumeRangeMl: number | null;
  readonly paPressureRangeMmHg: number | null;
  readonly maxPvOpen01: number | null;
  readonly maxPvEffectiveResistanceMmHgSecPerMl: number | null;
  readonly maxPvBernoulliLossMmHg: number | null;
  readonly maxPvInertancePressureMmHg: number | null;
  readonly maxSafetyPressureMmHg: number | null;
};

export type RightPreloadOutflowOwnershipReportV1 = {
  readonly reportId: typeof RIGHT_PRELOAD_OUTFLOW_OWNERSHIP_REPORT_ID_V1;
  readonly gateId: "rightPreloadOutflowOwnershipV1";
  readonly inputs: {
    readonly rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly sourceSampleRateMultiplier: 2;
    readonly rvLowOutputTrefPa: 30000;
    readonly rvUpperSafetyGainMmHgPerMl: 0.18;
    readonly beatsReviewed: readonly [16, 20, 32, 56];
  };
  readonly candidateResults: readonly CandidateResultV1[];
  readonly summary: {
    readonly bestCandidateId: CandidateIdV1;
    readonly bestPassCount: number;
    readonly fullPassCandidateCount: number;
    readonly longEpochPassCandidateCount: number;
    readonly referencePassCount: number;
    readonly rightPreloadReferenceFailureReasons: readonly string[];
  };
  readonly decision: {
    readonly rightPreloadOutflowStatus:
      | "right-preload-outflow-contract-signal"
      | "right-preload-outflow-contract-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirTuningReopened: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const CANDIDATES: readonly CandidateSpecV1[] = [
  {
    candidateId: "right-source-reference",
    description: "Selected right source surface before PV outflow ownership changes.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
    paOutflowStatefulResistanceGain: 0,
    paOutflowStatefulDriveStartMmHg: null,
    paOutflowStatefulDriveEndMmHg: null,
    paOutflowStatefulFallTauSec: null,
  },
  {
    candidateId: "pv-resistance150",
    description: "Moderate PV pressure-flow loss ownership; broad candidate.",
    pvResistanceMultiplier: 1.5,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
    paOutflowStatefulResistanceGain: 0,
    paOutflowStatefulDriveStartMmHg: null,
    paOutflowStatefulDriveEndMmHg: null,
    paOutflowStatefulFallTauSec: null,
  },
  {
    candidateId: "pv-open-tau030",
    description: "Slower PV opening state ownership without changing steady loss.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: 0.030,
    paOutflowStatefulResistanceGain: 0,
    paOutflowStatefulDriveStartMmHg: null,
    paOutflowStatefulDriveEndMmHg: null,
    paOutflowStatefulFallTauSec: null,
  },
  {
    candidateId: "pv-bernoulli300",
    description: "PV quadratic loss ownership component probe.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 3,
    pvTauOpenSec: null,
    paOutflowStatefulResistanceGain: 0,
    paOutflowStatefulDriveStartMmHg: null,
    paOutflowStatefulDriveEndMmHg: null,
    paOutflowStatefulFallTauSec: null,
  },
  {
    candidateId: "pv-resistance200-negative-control",
    description: "Over-damped PV loss negative control.",
    pvResistanceMultiplier: 2,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
    paOutflowStatefulResistanceGain: 0,
    paOutflowStatefulDriveStartMmHg: null,
    paOutflowStatefulDriveEndMmHg: null,
    paOutflowStatefulFallTauSec: null,
  },
  {
    candidateId: "pa-drive050-negative-control",
    description: "PA runoff stateful resistance negative control.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
    paOutflowStatefulResistanceGain: 0.5,
    paOutflowStatefulDriveStartMmHg: 20,
    paOutflowStatefulDriveEndMmHg: 34,
    paOutflowStatefulFallTauSec: 0.8,
  },
];

const LONG_EPOCH_BEATS = [16, 20, 32, 56] as const;

export function runRightPreloadOutflowOwnershipBenchV1(): RightPreloadOutflowOwnershipReportV1 {
  const candidateResults = CANDIDATES.map(runCandidate).sort(candidateSort);
  const best = candidateResults[0]!;
  const reference = candidateResults.find((candidate) => candidate.candidateId === "right-source-reference")!;
  const referencePreload = reference.pointResults.find((point) => point.pointId === "right-heart-preload-low");
  const fullPassCandidateCount = candidateResults.filter((candidate) =>
    candidate.summary.pass === candidate.summary.total).length;
  const longEpochPassCandidateCount = candidateResults.filter((candidate) =>
    candidate.summary.rightPreloadLongEpochPass).length;
  const rightPreloadOutflowStatus =
    fullPassCandidateCount > 0 && longEpochPassCandidateCount > 0
      ? "right-preload-outflow-contract-signal"
      : "right-preload-outflow-contract-blocked";
  return {
    reportId: RIGHT_PRELOAD_OUTFLOW_OWNERSHIP_REPORT_ID_V1,
    gateId: "rightPreloadOutflowOwnershipV1",
    inputs: {
      rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      sourceSampleRateMultiplier: 2,
      rvLowOutputTrefPa: 30000,
      rvUpperSafetyGainMmHgPerMl: 0.18,
      beatsReviewed: LONG_EPOCH_BEATS,
    },
    candidateResults,
    summary: {
      bestCandidateId: best.candidateId,
      bestPassCount: best.summary.pass,
      fullPassCandidateCount,
      longEpochPassCandidateCount,
      referencePassCount: reference.summary.pass,
      rightPreloadReferenceFailureReasons: referencePreload?.failureReasons ?? ["missing-right-preload-low"],
    },
    decision: {
      rightPreloadOutflowStatus,
      nextAction: rightPreloadOutflowStatus === "right-preload-outflow-contract-signal"
        ? "Treat PV outflow pressure-flow/loss ownership as the right-preload source-surface lead; rerun source/four-chamber residual review before runtime, reservoir retuning, AV-plane, or LandAtrial work."
        : "Do not return to four-chamber residual review. Right preload-low still needs source-surface settling ownership before reservoir or atrial work.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-tuning-reopened",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirTuningReopened: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runCandidate(spec: CandidateSpecV1): CandidateResultV1 {
  const pointResultsRaw = buildRightHeartStrategicEnvelopeV1()
    .map((point) => runRightHeartStrategicPointV1(applyCandidate(sourceBase(point), spec)));
  const pointResults = pointResultsRaw.map((result) => ({
    pointId: result.pointId,
    status: result.status,
    failureReasons: result.failureReasons,
    pvEjectedVolumeMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    repeatabilityDeltaMl: result.repeatability.pvEjectionDeltaMl,
    dtHalfDeltaMl: result.dtSensitivity.pvEjectionDeltaMl,
    tvC1ContinuityScore: result.finalBeat?.tvC1ContinuityScore ?? null,
    maxSafetyPressureMmHg: result.finalBeat?.maxSafetyPressureMmHg ?? null,
  }));
  const rightPreloadLongEpoch = LONG_EPOCH_BEATS.map((beats) =>
    runRightPreloadLongEpoch(applyCandidate(rightPreloadBase(), spec), beats));
  return {
    candidateId: spec.candidateId,
    description: spec.description,
    intervention: {
      pvResistanceMultiplier: spec.pvResistanceMultiplier,
      pvBernoulliMultiplier: spec.pvBernoulliMultiplier,
      pvTauOpenSec: spec.pvTauOpenSec,
      paOutflowStatefulResistanceGain: spec.paOutflowStatefulResistanceGain,
      paOutflowStatefulDriveStartMmHg: spec.paOutflowStatefulDriveStartMmHg,
      paOutflowStatefulDriveEndMmHg: spec.paOutflowStatefulDriveEndMmHg,
      paOutflowStatefulFallTauSec: spec.paOutflowStatefulFallTauSec,
    },
    pointResults,
    rightPreloadLongEpoch,
    summary: {
      pass: pointResultsRaw.filter((point) => point.status === "pass").length,
      total: pointResultsRaw.length,
      rightPreloadPass: pointResultsRaw.find((point) => point.pointId === "right-heart-preload-low")?.status === "pass",
      rightPreloadLongEpochPass: rightPreloadLongEpoch.every((point) => point.status === "pass"),
      morphologyOkCount: pointResultsRaw.filter((point) => point.classifications.morphologyOk).length,
      outputOkCount: pointResultsRaw.filter((point) => point.classifications.outputOk).length,
      repeatabilityOkCount: pointResultsRaw.filter((point) => point.repeatability.ok).length,
      dtOutputParityOkCount: pointResultsRaw.filter((point) => point.dtSensitivity.outputParityOk).length,
      safetyWorkBoundedCount: pointResultsRaw.filter((point) => point.classifications.safetyWorkBounded).length,
      maxLongEpochRepeatabilityDeltaMl: finiteMaxOrNull(
        rightPreloadLongEpoch.map((point) => point.repeatabilityDeltaMl ?? Number.NaN),
      ),
      maxLongEpochDtHalfOutputDeltaMl: finiteMaxOrNull(
        rightPreloadLongEpoch.map((point) => point.dtHalfOutputDeltaMl ?? Number.NaN),
      ),
    },
  };
}

function runRightPreloadLongEpoch(
  params: RightHeartSubsystemParamsV2,
  beats: number,
): RightPreloadLongEpochPointV1 {
  const result = runRightHeartStrategicPointV1({ ...params, beats });
  const run = runRightHeartSubsystemV2({ ...params, beats });
  const beatSamples = run.samples.filter((sample) => sample.beat === beats - 2);
  return {
    beats,
    status: result.status,
    failureReasons: result.failureReasons,
    pvEjectedVolumeMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    previousPvEjectedVolumeMl: result.previousBeat?.pvEjectedVolumeMl ?? null,
    dtHalfPvEjectedVolumeMl: result.dtHalfFinalBeat?.pvEjectedVolumeMl ?? null,
    repeatabilityDeltaMl: result.repeatability.pvEjectionDeltaMl,
    dtHalfOutputDeltaMl: result.dtSensitivity.pvEjectionDeltaMl,
    tvForwardVolumeMl: flowIntegral(beatSamples, (sample) => sample.qTvMlPerSec),
    rvVolumeRangeMl: finiteRangeOrNull(beatSamples.map((sample) => sample.rvVolumeMl)),
    paPressureRangeMmHg: finiteRangeOrNull(beatSamples.map((sample) => sample.paPressureMmHg)),
    maxPvOpen01: finiteMaxOrNull(beatSamples.map((sample) => sample.pvOpen01)),
    maxPvEffectiveResistanceMmHgSecPerMl: finiteMaxOrNull(beatSamples.map((sample) => sample.pv.resistanceMmHgSecPerMl)),
    maxPvBernoulliLossMmHg: finiteMaxOrNull(beatSamples.map((sample) => sample.pv.bernoulliLossMmHg)),
    maxPvInertancePressureMmHg: finiteMaxOrNull(beatSamples.map((sample) => Math.abs(sample.pv.inertancePressureMmHg))),
    maxSafetyPressureMmHg: result.finalBeat?.maxSafetyPressureMmHg ?? null,
  };
}

function sourceBase(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...rightLowOutputProbe(applySelectedRightScaffold(point), 30_000, 0.18),
    sampleRateHz: point.sampleRateHz * 2,
  };
}

function rightPreloadBase(): RightHeartSubsystemParamsV2 {
  const point = buildRightHeartStrategicEnvelopeV1()
    .find((candidate) => candidate.fixtureId === "right-heart-preload-low");
  if (point == null) throw new Error("Missing right-heart-preload-low");
  return sourceBase(point);
}

function applyCandidate(
  point: RightHeartSubsystemParamsV2,
  spec: CandidateSpecV1,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    paOutflowStatefulResistanceGain: spec.paOutflowStatefulResistanceGain,
    paOutflowStatefulDriveStartMmHg:
      spec.paOutflowStatefulDriveStartMmHg ?? point.paOutflowStatefulDriveStartMmHg,
    paOutflowStatefulDriveEndMmHg:
      spec.paOutflowStatefulDriveEndMmHg ?? point.paOutflowStatefulDriveEndMmHg,
    paOutflowStatefulFallTauSec:
      spec.paOutflowStatefulFallTauSec ?? point.paOutflowStatefulFallTauSec,
    pv: {
      ...point.pv,
      resistanceMmHgSecPerMl: point.pv.resistanceMmHgSecPerMl * spec.pvResistanceMultiplier,
      bernoulliMmHgSec2PerMl2: point.pv.bernoulliMmHgSec2PerMl2 * spec.pvBernoulliMultiplier,
      tauOpenSec: spec.pvTauOpenSec ?? point.pv.tauOpenSec,
    },
  };
}

function applySelectedRightScaffold(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: 0.47,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function rightLowOutputProbe(
  point: RightHeartSubsystemParamsV2,
  lowTrefPa: number,
  upperSafetyGainMmHgPerMl: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl / 0.25 * upperSafetyGainMmHgPerMl,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? lowTrefPa : point.rv.fiber.trefPa,
      },
    },
  };
}

function candidateSort(a: CandidateResultV1, b: CandidateResultV1): number {
  return b.summary.pass - a.summary.pass
    || Number(b.summary.rightPreloadLongEpochPass) - Number(a.summary.rightPreloadLongEpochPass)
    || b.summary.dtOutputParityOkCount - a.summary.dtOutputParityOkCount
    || (a.summary.maxLongEpochRepeatabilityDeltaMl ?? 1e9) - (b.summary.maxLongEpochRepeatabilityDeltaMl ?? 1e9)
    || (a.summary.maxLongEpochDtHalfOutputDeltaMl ?? 1e9) - (b.summary.maxLongEpochDtHalfOutputDeltaMl ?? 1e9)
    || a.candidateId.localeCompare(b.candidateId);
}

function flowIntegral(
  samples: readonly RightHeartSubsystemSampleV2[],
  accessor: (sample: RightHeartSubsystemSampleV2) => number,
): number | null {
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

function finiteRangeOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite) - Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
