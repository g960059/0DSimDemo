import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemReservoirParamsV1,
  type FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_PV_OUTFLOW_TRANSFER_REVIEW_REPORT_ID_V1 =
  "four-chamber-pv-outflow-transfer-review-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type ScenarioSpecV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
};

type CandidateIdV1 =
  | "selected-reference"
  | "pv-resistance125"
  | "pv-resistance150"
  | "pv-open-tau030"
  | "pv-bernoulli300";

type CandidateSpecV1 = {
  readonly candidateId: CandidateIdV1;
  readonly description: string;
  readonly pvResistanceMultiplier: number;
  readonly pvBernoulliMultiplier: number;
  readonly pvTauOpenSec: number | null;
};

type ProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type ProfileResultV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly status: FourChamberSubsystemRunV1["status"];
  readonly failureReasons: readonly string[];
  readonly leftFailureReasons: readonly string[];
  readonly rightFailureReasons: readonly string[];
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly leftAovEjectedVolumeMl: number | null;
  readonly rightPvEjectedVolumeMl: number | null;
  readonly absForwardMismatchMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
};

type ScenarioResultV1 = {
  readonly scenario: ScenarioSpecV1;
  readonly profileResults: readonly ProfileResultV1[];
  readonly summary: {
    readonly passCount: number;
    readonly total: number;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly meanAbsForwardMismatchMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
  };
};

type CandidateResultV1 = {
  readonly candidateId: CandidateIdV1;
  readonly description: string;
  readonly intervention: Omit<CandidateSpecV1, "candidateId" | "description">;
  readonly scenarioResults: readonly ScenarioResultV1[];
  readonly summary: {
    readonly totalPassCount: number;
    readonly nominalPassCount: number;
    readonly dtHalfPassCount: number;
    readonly longEpochPassCount: number;
    readonly improvesDtHalfPreloadRightSurface: boolean;
    readonly worsensNominalOrLong: boolean;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
  };
};

export type FourChamberPvOutflowTransferReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_PV_OUTFLOW_TRANSFER_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberPvOutflowTransferReviewV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly rightPreloadOutflowLeadId: "pv-resistance150";
  };
  readonly candidateResults: readonly CandidateResultV1[];
  readonly summary: {
    readonly referenceTotalPassCount: number;
    readonly bestCandidateId: CandidateIdV1;
    readonly bestTotalPassCount: number;
    readonly directTransferFullPassCandidateCount: number;
    readonly dtHalfPreloadRightSurfaceImprovementCount: number;
  };
  readonly decision: {
    readonly pvOutflowTransferStatus:
      | "pv-outflow-direct-transfer-signal"
      | "pv-outflow-direct-transfer-no-go";
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

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const PROFILE_MAP: readonly ProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const SCENARIOS: readonly ScenarioSpecV1[] = [
  { scenarioId: "nominal", sampleRateMultiplier: 1, epochs: 14 },
  { scenarioId: "dt-half", sampleRateMultiplier: 2, epochs: 14 },
  { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 22 },
];

const CANDIDATES: readonly CandidateSpecV1[] = [
  {
    candidateId: "selected-reference",
    description: "Existing selected four-chamber scaffold.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
  },
  {
    candidateId: "pv-resistance125",
    description: "Reduced direct-transfer PV resistance probe.",
    pvResistanceMultiplier: 1.25,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
  },
  {
    candidateId: "pv-resistance150",
    description: "Standalone right-preload source lead transferred directly.",
    pvResistanceMultiplier: 1.5,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: null,
  },
  {
    candidateId: "pv-open-tau030",
    description: "Standalone right-preload PV opening-tau lead transferred directly.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 1,
    pvTauOpenSec: 0.030,
  },
  {
    candidateId: "pv-bernoulli300",
    description: "Standalone right-preload PV quadratic-loss lead transferred directly.",
    pvResistanceMultiplier: 1,
    pvBernoulliMultiplier: 3,
    pvTauOpenSec: null,
  },
];

export function runFourChamberPvOutflowTransferReviewBenchV1():
FourChamberPvOutflowTransferReviewReportV1 {
  const candidateResults = CANDIDATES.map(runCandidate).sort(candidateSort);
  const reference = candidateResults.find((candidate) => candidate.candidateId === "selected-reference")!;
  const best = candidateResults[0]!;
  const directTransferFullPassCandidateCount = candidateResults.filter((candidate) =>
    candidate.scenarioResults.every((scenario) => scenario.summary.passCount === scenario.summary.total)).length;
  const dtHalfPreloadRightSurfaceImprovementCount = candidateResults.filter((candidate) =>
    candidate.summary.improvesDtHalfPreloadRightSurface).length;
  const pvOutflowTransferStatus =
    directTransferFullPassCandidateCount > 0
    || (best.summary.totalPassCount > reference.summary.totalPassCount && !best.summary.worsensNominalOrLong)
      ? "pv-outflow-direct-transfer-signal"
      : "pv-outflow-direct-transfer-no-go";
  return {
    reportId: FOUR_CHAMBER_PV_OUTFLOW_TRANSFER_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberPvOutflowTransferReviewV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      rightPreloadOutflowLeadId: "pv-resistance150",
    },
    candidateResults,
    summary: {
      referenceTotalPassCount: reference.summary.totalPassCount,
      bestCandidateId: best.candidateId,
      bestTotalPassCount: best.summary.totalPassCount,
      directTransferFullPassCandidateCount,
      dtHalfPreloadRightSurfaceImprovementCount,
    },
    decision: {
      pvOutflowTransferStatus,
      nextAction: pvOutflowTransferStatus === "pv-outflow-direct-transfer-signal"
        ? "Use the transferred PV outflow lead in the next source-aware four-chamber residual review before any runtime or atrial work."
        : "Do not transfer the standalone PV outflow lead directly into the four-chamber scaffold. Build a source-aware four-chamber review that separates phase-aligned source failures and magnitude calibration before changing reservoir, AV-plane, or LandAtrial surfaces.",
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
  const scenarioResults = SCENARIOS.map((scenario) => runScenario(spec, scenario));
  const nominal = requiredScenario(scenarioResults, "nominal");
  const longEpochs = requiredScenario(scenarioResults, "long-epochs");
  const totalPassCount = scenarioResults.reduce((sum, scenario) => sum + scenario.summary.passCount, 0);
  const dtHalfPreload = requiredProfile(requiredScenario(scenarioResults, "dt-half"), "preload-low");
  const improvesDtHalfPreloadRightSurface = dtHalfPreload.rightStatus === "pass";
  const worsensNominalOrLong =
    nominal.summary.passCount < 7 || longEpochs.summary.passCount < 6;
  return {
    candidateId: spec.candidateId,
    description: spec.description,
    intervention: {
      pvResistanceMultiplier: spec.pvResistanceMultiplier,
      pvBernoulliMultiplier: spec.pvBernoulliMultiplier,
      pvTauOpenSec: spec.pvTauOpenSec,
    },
    scenarioResults,
    summary: {
      totalPassCount,
      nominalPassCount: nominal.summary.passCount,
      dtHalfPassCount: requiredScenario(scenarioResults, "dt-half").summary.passCount,
      longEpochPassCount: longEpochs.summary.passCount,
      improvesDtHalfPreloadRightSurface,
      worsensNominalOrLong,
      maxAbsForwardMismatchMl: maxOrNull(scenarioResults.map((scenario) => scenario.summary.maxAbsForwardMismatchMl)),
      maxAbsReservoirVolumeMl: maxOrNull(scenarioResults.map((scenario) => scenario.summary.maxAbsReservoirVolumeMl)),
    },
  };
}

function runScenario(spec: CandidateSpecV1, scenario: ScenarioSpecV1): ScenarioResultV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map((point) => applyRightScaffold(point, spec))
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const reservoir = reservoirParams(scenario.epochs);
  const profileResults = PROFILE_MAP.map((profile) => {
    const run = runFourChamberSubsystemV1({
      profileId: profile.profileId,
      left: requiredPoint(leftParams, profile.leftPointId),
      right: requiredPoint(rightParams, profile.rightPointId),
      reservoir,
    });
    return toProfileResult(run);
  });
  return {
    scenario,
    profileResults,
    summary: summarizeProfiles(profileResults),
  };
}

function toProfileResult(run: FourChamberSubsystemRunV1): ProfileResultV1 {
  return {
    profileId: run.profileId,
    status: run.status,
    failureReasons: run.failureReasons,
    leftFailureReasons: run.finalState.leftFailureReasons,
    rightFailureReasons: run.finalState.rightFailureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    leftAovEjectedVolumeMl: run.finalState.leftAovEjectedVolumeMl,
    rightPvEjectedVolumeMl: run.finalState.rightPvEjectedVolumeMl,
    absForwardMismatchMl: run.finalState.absMismatchMl,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
  };
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  spec: CandidateSpecV1,
): RightHeartSubsystemParamsV2 {
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
    pv: {
      ...point.pv,
      resistanceMmHgSecPerMl: point.pv.resistanceMmHgSecPerMl * spec.pvResistanceMultiplier,
      bernoulliMmHgSec2PerMl2: point.pv.bernoulliMmHgSec2PerMl2 * spec.pvBernoulliMultiplier,
      tauOpenSec: spec.pvTauOpenSec ?? point.pv.tauOpenSec,
    },
  };
}

function reservoirParams(epochs: number): FourChamberSubsystemReservoirParamsV1 {
  return {
    epochs,
    transferGain01: 0.14,
    maxTransferPerEpochMl: 3.5,
    pulmonaryVenousComplianceMlPerMmHg: 80,
    systemicVenousComplianceMlPerMmHg: 160,
    pulmonaryPressureAdjustmentBoundMmHg: 1.4,
    systemicPressureAdjustmentBoundMmHg: 1.1,
    persistentReservoirVolumeBoundMl: 28,
    repeatabilityMismatchDeltaMl: 1.2,
    repeatabilityReservoirStepMl: 4,
  };
}

function summarizeProfiles(profileResults: readonly ProfileResultV1[]): ScenarioResultV1["summary"] {
  return {
    passCount: profileResults.filter((profile) => profile.status === "pass").length,
    total: profileResults.length,
    maxAbsForwardMismatchMl: maxOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    meanAbsForwardMismatchMl: meanOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    maxAbsReservoirVolumeMl: maxOrNull(profileResults.map((profile) => profile.maxAbsReservoirVolumeMl)),
    maxAbsAcceptedTransferMl: maxOrNull(profileResults.map((profile) => profile.maxAbsAcceptedTransferMl)),
  };
}

function candidateSort(a: CandidateResultV1, b: CandidateResultV1): number {
  return b.summary.totalPassCount - a.summary.totalPassCount
    || Number(a.summary.worsensNominalOrLong) - Number(b.summary.worsensNominalOrLong)
    || (a.summary.maxAbsForwardMismatchMl ?? 1e9) - (b.summary.maxAbsForwardMismatchMl ?? 1e9)
    || a.candidateId.localeCompare(b.candidateId);
}

function withSampleRate<T extends { readonly sampleRateHz: number }>(
  point: T,
  multiplier: number,
): T {
  return { ...point, sampleRateHz: point.sampleRateHz * multiplier };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing fixture ${fixtureId}`);
  return point;
}

function requiredScenario(
  scenarios: readonly ScenarioResultV1[],
  scenarioId: ScenarioIdV1,
): ScenarioResultV1 {
  const scenario = scenarios.find((candidate) => candidate.scenario.scenarioId === scenarioId);
  if (scenario == null) throw new Error(`Missing scenario ${scenarioId}`);
  return scenario;
}

function requiredProfile(
  scenario: ScenarioResultV1,
  profileId: FourChamberSubsystemProfileIdV1,
): ProfileResultV1 {
  const profile = scenario.profileResults.find((candidate) => candidate.profileId === profileId);
  if (profile == null) throw new Error(`Missing profile ${profileId}`);
  return profile;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function meanOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
