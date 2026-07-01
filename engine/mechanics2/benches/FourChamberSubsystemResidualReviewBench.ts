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

export const FOUR_CHAMBER_SUBSYSTEM_RESIDUAL_REVIEW_REPORT_ID_V1 =
  "four-chamber-subsystem-residual-review-report-v1" as const;

type ReviewScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type ReviewScenarioSpecV1 = {
  readonly scenarioId: ReviewScenarioIdV1;
  readonly description: string;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
};

type ReviewProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type ReviewProfileResultV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly status: FourChamberSubsystemRunV1["status"];
  readonly absForwardMismatchMl: number | null;
  readonly relativeForwardMismatch: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly failureReasons: readonly string[];
};

type ReviewScenarioResultV1 = {
  readonly scenario: ReviewScenarioSpecV1;
  readonly profileResults: readonly ReviewProfileResultV1[];
  readonly summary: {
    readonly profileCount: number;
    readonly passCount: number;
    readonly meanAbsForwardMismatchMl: number | null;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxFinalReservoirStepMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicPressureAdjustmentMmHg: number | null;
  };
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

type ScenarioComparisonV1 = {
  readonly scenarioId: Exclude<ReviewScenarioIdV1, "nominal">;
  readonly maxAbsForwardMismatchDeltaMl: number | null;
  readonly meanAbsForwardMismatchDeltaMl: number | null;
  readonly maxReservoirVolumeDeltaMl: number | null;
  readonly maxAcceptedTransferDeltaMl: number | null;
  readonly profileDeltas: readonly {
    readonly profileId: FourChamberSubsystemProfileIdV1;
    readonly absForwardMismatchDeltaMl: number | null;
    readonly reservoirVolumeDeltaMl: number | null;
    readonly acceptedTransferDeltaMl: number | null;
  }[];
};

export type FourChamberSubsystemResidualReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SUBSYSTEM_RESIDUAL_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSubsystemResidualReviewV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
  };
  readonly scenarioResults: readonly ReviewScenarioResultV1[];
  readonly comparisons: readonly ScenarioComparisonV1[];
  readonly summary: {
    readonly scenarioCount: number;
    readonly passScenarioCount: number;
    readonly nominalPassCount: number;
    readonly dtHalfPassCount: number;
    readonly longEpochPassCount: number;
    readonly maxDtHalfMismatchDeltaMl: number | null;
    readonly maxLongEpochMismatchDeltaMl: number | null;
    readonly maxLongEpochReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly residualReviewStatus:
      | "four-chamber-subsystem-residual-review-pass"
      | "four-chamber-subsystem-residual-review-mixed"
      | "four-chamber-subsystem-residual-review-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const PROFILE_MAP: readonly ReviewProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const SCENARIOS: readonly ReviewScenarioSpecV1[] = [
  {
    scenarioId: "nominal",
    description: "Selected four-chamber subsystem smoke scaffold.",
    sampleRateMultiplier: 1,
    epochs: 14,
  },
  {
    scenarioId: "dt-half",
    description: "Same scaffold with doubled left/right subsystem sample rates.",
    sampleRateMultiplier: 2,
    epochs: 14,
  },
  {
    scenarioId: "long-epochs",
    description: "Same scaffold with a longer reservoir epoch history.",
    sampleRateMultiplier: 1,
    epochs: 22,
  },
];

export function runFourChamberSubsystemResidualReviewBenchV1():
FourChamberSubsystemResidualReviewReportV1 {
  const scenarioResults = SCENARIOS.map(runScenario);
  const nominal = requiredScenario(scenarioResults, "nominal");
  const comparisons = scenarioResults
    .filter((scenario) => scenario.scenario.scenarioId !== "nominal")
    .map((scenario) => compareScenario(nominal, scenario));
  const dtHalf = requiredScenario(scenarioResults, "dt-half");
  const longEpochs = requiredScenario(scenarioResults, "long-epochs");
  const dtHalfComparison = requiredComparison(comparisons, "dt-half");
  const longEpochComparison = requiredComparison(comparisons, "long-epochs");
  const residualReviewStatus =
    nominal.status === "pass"
    && dtHalf.status === "pass"
    && longEpochs.status === "pass"
    && (dtHalfComparison.maxAbsForwardMismatchDeltaMl ?? 1e9) <= 1.5
    && (longEpochComparison.maxAbsForwardMismatchDeltaMl ?? 1e9) <= 1.5
    && (longEpochs.summary.maxAbsReservoirVolumeMl ?? 1e9) <= 22
      ? "four-chamber-subsystem-residual-review-pass"
      : scenarioResults.some((scenario) => scenario.status === "pass")
        ? "four-chamber-subsystem-residual-review-mixed"
        : "four-chamber-subsystem-residual-review-blocked";
  return {
    reportId: FOUR_CHAMBER_SUBSYSTEM_RESIDUAL_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSubsystemResidualReviewV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
    },
    scenarioResults,
    comparisons,
    summary: {
      scenarioCount: scenarioResults.length,
      passScenarioCount: scenarioResults.filter((scenario) => scenario.status === "pass").length,
      nominalPassCount: nominal.summary.passCount,
      dtHalfPassCount: dtHalf.summary.passCount,
      longEpochPassCount: longEpochs.summary.passCount,
      maxDtHalfMismatchDeltaMl: dtHalfComparison.maxAbsForwardMismatchDeltaMl,
      maxLongEpochMismatchDeltaMl: longEpochComparison.maxAbsForwardMismatchDeltaMl,
      maxLongEpochReservoirVolumeMl: longEpochs.summary.maxAbsReservoirVolumeMl,
    },
    decision: {
      residualReviewStatus,
      nextAction: residualReviewStatus === "four-chamber-subsystem-residual-review-pass"
        ? "Proceed to a bounded four-chamber subsystem numerics/closure plan before runtime, AV-plane, or LandAtrial work."
        : "Keep the lane at four-chamber subsystem residual review and classify scenario failures before further expansion.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runScenario(scenario: ReviewScenarioSpecV1): ReviewScenarioResultV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const reservoir = reservoirParams(scenario);
  const profileResults = PROFILE_MAP.map((profile) => toProfileReview(runFourChamberSubsystemV1({
    profileId: profile.profileId,
    left: requiredPoint(leftParams, profile.leftPointId),
    right: requiredPoint(rightParams, profile.rightPointId),
    reservoir,
  })));
  const failureReasons = profileResults
    .filter((profile) => profile.status !== "pass")
    .map((profile) => `${profile.profileId}: ${profile.failureReasons.join(",")}`);
  return {
    scenario,
    profileResults,
    summary: summarizeProfiles(profileResults),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function toProfileReview(run: FourChamberSubsystemRunV1): ReviewProfileResultV1 {
  return {
    profileId: run.profileId,
    status: run.status,
    absForwardMismatchMl: run.finalState.absMismatchMl,
    relativeForwardMismatch: run.finalState.relativeMismatch,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    pulmonaryVenousPressureAdjustmentMmHg: run.finalState.pulmonaryVenousPressureAdjustmentMmHg,
    systemicPressureAdjustmentMmHg: run.finalState.systemicPressureAdjustmentMmHg,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    failureReasons: run.failureReasons,
  };
}

function compareScenario(
  nominal: ReviewScenarioResultV1,
  scenario: ReviewScenarioResultV1,
): ScenarioComparisonV1 {
  const profileDeltas = PROFILE_MAP.map((profile) => {
    const base = requiredProfile(nominal.profileResults, profile.profileId);
    const actual = requiredProfile(scenario.profileResults, profile.profileId);
    return {
      profileId: profile.profileId,
      absForwardMismatchDeltaMl: deltaOrNull(actual.absForwardMismatchMl, base.absForwardMismatchMl),
      reservoirVolumeDeltaMl: deltaOrNull(actual.maxAbsReservoirVolumeMl, base.maxAbsReservoirVolumeMl),
      acceptedTransferDeltaMl: deltaOrNull(actual.maxAbsAcceptedTransferMl, base.maxAbsAcceptedTransferMl),
    };
  });
  return {
    scenarioId: scenario.scenario.scenarioId as Exclude<ReviewScenarioIdV1, "nominal">,
    maxAbsForwardMismatchDeltaMl: maxOrNull(profileDeltas.map((profile) =>
      profile.absForwardMismatchDeltaMl
    )),
    meanAbsForwardMismatchDeltaMl: meanOrNull(profileDeltas.map((profile) =>
      profile.absForwardMismatchDeltaMl
    )),
    maxReservoirVolumeDeltaMl: maxOrNull(profileDeltas.map((profile) =>
      profile.reservoirVolumeDeltaMl
    )),
    maxAcceptedTransferDeltaMl: maxOrNull(profileDeltas.map((profile) =>
      profile.acceptedTransferDeltaMl
    )),
    profileDeltas,
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

function reservoirParams(scenario: ReviewScenarioSpecV1): FourChamberSubsystemReservoirParamsV1 {
  return {
    epochs: scenario.epochs,
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

function summarizeProfiles(
  profileResults: readonly ReviewProfileResultV1[],
): ReviewScenarioResultV1["summary"] {
  return {
    profileCount: profileResults.length,
    passCount: profileResults.filter((profile) => profile.status === "pass").length,
    meanAbsForwardMismatchMl: meanOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    maxAbsForwardMismatchMl: maxOrNull(profileResults.map((profile) => profile.absForwardMismatchMl)),
    maxAbsAcceptedTransferMl: maxOrNull(profileResults.map((profile) => profile.maxAbsAcceptedTransferMl)),
    maxAbsReservoirVolumeMl: maxOrNull(profileResults.map((profile) => profile.maxAbsReservoirVolumeMl)),
    maxFinalReservoirStepMl: maxOrNull(profileResults.map((profile) => profile.finalReservoirStepMl)),
    maxPulmonaryVenousPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.pulmonaryVenousPressureAdjustmentMmHg))),
    maxSystemicPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.systemicPressureAdjustmentMmHg))),
  };
}

function withSampleRate<T extends { readonly sampleRateHz: number }>(point: T, multiplier: number): T {
  return { ...point, sampleRateHz: point.sampleRateHz * multiplier };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing four-chamber residual review profile ${fixtureId}`);
  return point;
}

function requiredScenario(
  scenarios: readonly ReviewScenarioResultV1[],
  scenarioId: ReviewScenarioIdV1,
): ReviewScenarioResultV1 {
  const scenario = scenarios.find((candidate) => candidate.scenario.scenarioId === scenarioId);
  if (scenario == null) throw new Error(`Missing four-chamber residual review scenario ${scenarioId}`);
  return scenario;
}

function requiredComparison(
  comparisons: readonly ScenarioComparisonV1[],
  scenarioId: Exclude<ReviewScenarioIdV1, "nominal">,
): ScenarioComparisonV1 {
  const comparison = comparisons.find((candidate) => candidate.scenarioId === scenarioId);
  if (comparison == null) throw new Error(`Missing four-chamber residual review comparison ${scenarioId}`);
  return comparison;
}

function requiredProfile(
  profiles: readonly ReviewProfileResultV1[],
  profileId: FourChamberSubsystemProfileIdV1,
): ReviewProfileResultV1 {
  const profile = profiles.find((candidate) => candidate.profileId === profileId);
  if (profile == null) throw new Error(`Missing four-chamber residual review profile ${profileId}`);
  return profile;
}

function deltaOrNull(actual: number | null, base: number | null): number | null {
  return actual != null && base != null ? round(Math.abs(actual - base)) : null;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function meanOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
