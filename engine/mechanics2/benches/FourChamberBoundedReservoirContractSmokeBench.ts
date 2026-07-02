import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runFourChamberSourceAwareResidualReviewBenchV1,
  type FourChamberSourceAwareResidualReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareResidualReviewBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_BOUNDED_RESERVOIR_CONTRACT_SMOKE_REPORT_ID_V1 =
  "four-chamber-bounded-reservoir-contract-smoke-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type ScenarioSpecV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly sampleRateMultiplier: number;
  readonly epochs: number;
};

type ProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type EffectivePointResultV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawStatus: FourChamberSubsystemRunV1["status"];
  readonly effectiveStatus: "pass" | "fail";
  readonly rawFailureReasons: readonly string[];
  readonly removedFailureReasons: readonly string[];
  readonly effectiveFailureReasons: readonly string[];
  readonly appliedOwners: readonly string[];
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly reservoirVolumeOwnershipLimiterHitCount: number;
  readonly maxAbsReservoirVolumeOwnershipRejectedTransferMl: number | null;
  readonly leftStatus: string;
  readonly rightStatus: string;
};

type ScenarioSummaryV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly rawPassCount: number;
  readonly effectivePassCount: number;
  readonly total: 7;
  readonly maxAbsReservoirVolumeMl: number | null;
  readonly volumeOwnershipLimiterHitCount: number;
};

export type FourChamberBoundedReservoirContractSmokeReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_BOUNDED_RESERVOIR_CONTRACT_SMOKE_REPORT_ID_V1;
  readonly gateId: "fourChamberBoundedReservoirContractSmokeV1";
  readonly inputs: {
    readonly sourceAwareResidualReviewReportId: FourChamberSourceAwareResidualReviewReportV1["reportId"];
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly reservoirVolumeOwnershipBoundMl: 24;
  };
  readonly pointResults: readonly EffectivePointResultV1[];
  readonly scenarioSummaries: readonly ScenarioSummaryV1[];
  readonly preloadLowStressProbe: {
    readonly epochs: 56;
    readonly rawStatus: FourChamberSubsystemRunV1["status"];
    readonly failureReasons: readonly string[];
    readonly leftStatus: string;
    readonly rightStatus: string;
    readonly maxAbsReservoirVolumeMl: number;
    readonly finalReservoirStepMl: number | null;
    readonly volumeOwnershipLimiterHitCount: number;
  };
  readonly summary: {
    readonly rawPassCount: number;
    readonly effectivePassCount: number;
    readonly total: 21;
    readonly effectivePassByScenario: readonly ScenarioSummaryV1[];
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly totalVolumeOwnershipLimiterHitCount: number;
    readonly maxAbsReservoirVolumeOwnershipRejectedTransferMl: number | null;
  };
  readonly decision: {
    readonly boundedReservoirContractSmokeStatus:
      | "source-aware-bounded-reservoir-contract-smoke-pass"
      | "source-aware-bounded-reservoir-contract-smoke-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly reservoirBroadRetuning: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const LEFT_VARIANT_ID: LeftHeartDynamicReserveVariantIdV1 =
  "active-length-mv-closure-stateful-root08";

const SCENARIOS: readonly ScenarioSpecV1[] = [
  { scenarioId: "nominal", sampleRateMultiplier: 1, epochs: 14 },
  { scenarioId: "dt-half", sampleRateMultiplier: 2, epochs: 14 },
  { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 22 },
];

const PROFILE_MAP: readonly ProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

export function runFourChamberBoundedReservoirContractSmokeBenchV1():
FourChamberBoundedReservoirContractSmokeReportV1 {
  const sourceAware = runFourChamberSourceAwareResidualReviewBenchV1();
  const pointResults = SCENARIOS.flatMap((scenario) =>
    PROFILE_MAP.map((profile) => runEffectivePoint(sourceAware, scenario, profile))
  );
  const scenarioSummaries = SCENARIOS.map((scenario) => scenarioSummary(scenario.scenarioId, pointResults));
  const preloadLowStressProbe = runPreloadLowStressProbe();
  const rawPassCount = pointResults.filter((point) => point.rawStatus === "pass").length;
  const effectivePassCount = pointResults.filter((point) => point.effectiveStatus === "pass").length;
  const totalVolumeOwnershipLimiterHitCount = pointResults.reduce(
    (sum, point) => sum + point.reservoirVolumeOwnershipLimiterHitCount,
    preloadLowStressProbe.volumeOwnershipLimiterHitCount,
  );
  const smokePass =
    effectivePassCount === 21
    && preloadLowStressProbe.rawStatus === "pass"
    && preloadLowStressProbe.leftStatus === "pass"
    && preloadLowStressProbe.rightStatus === "pass"
    && totalVolumeOwnershipLimiterHitCount > 0;
  return {
    reportId: FOUR_CHAMBER_BOUNDED_RESERVOIR_CONTRACT_SMOKE_REPORT_ID_V1,
    gateId: "fourChamberBoundedReservoirContractSmokeV1",
    inputs: {
      sourceAwareResidualReviewReportId: sourceAware.reportId,
      leftVariantId: LEFT_VARIANT_ID,
      reservoirVolumeOwnershipBoundMl: 24,
    },
    pointResults,
    scenarioSummaries,
    preloadLowStressProbe,
    summary: {
      rawPassCount,
      effectivePassCount,
      total: 21,
      effectivePassByScenario: scenarioSummaries,
      maxAbsReservoirVolumeMl: maxOrNull([
        ...pointResults.map((point) => point.maxAbsReservoirVolumeMl),
        preloadLowStressProbe.maxAbsReservoirVolumeMl,
      ]),
      totalVolumeOwnershipLimiterHitCount,
      maxAbsReservoirVolumeOwnershipRejectedTransferMl:
        maxOrNull(pointResults.map((point) =>
          point.maxAbsReservoirVolumeOwnershipRejectedTransferMl
        )),
    },
    decision: {
      boundedReservoirContractSmokeStatus: smokePass
        ? "source-aware-bounded-reservoir-contract-smoke-pass"
        : "source-aware-bounded-reservoir-contract-smoke-blocked",
      nextAction: smokePass
        ? "Treat bounded reservoir-volume ownership as the next four-chamber source-aware contract scaffold and move to a non-oracle dynamics/numerics review; do not unlock runtime, AV-plane, or LandAtrial from this smoke alone."
        : "Do not promote bounded reservoir-volume ownership. Reclassify the remaining full-envelope blockers before more reservoir or atrial work.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "reservoir-broad-retuning",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      reservoirBroadRetuning: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runEffectivePoint(
  sourceAware: FourChamberSourceAwareResidualReviewReportV1,
  scenario: ScenarioSpecV1,
  profile: ProfileMapV1,
): EffectivePointResultV1 {
  const run = runBoundedProfile(scenario, profile);
  const sourceAwareClassification = sourceAware.residualClassifications.find((classification) =>
    classification.scenarioId === scenario.scenarioId && classification.profileId === profile.profileId);
  const removedFailureReasons = sourceAwareClassification == null
    ? []
    : removedReasonsFor(sourceAwareClassification);
  const effectiveFailureReasons = run.failureReasons.filter((reason) =>
    !removedFailureReasons.includes(reason));
  return {
    scenarioId: scenario.scenarioId,
    profileId: profile.profileId,
    rawStatus: run.status,
    effectiveStatus: effectiveFailureReasons.length === 0 ? "pass" : "fail",
    rawFailureReasons: run.failureReasons,
    removedFailureReasons,
    effectiveFailureReasons,
    appliedOwners: sourceAwareClassification?.owners ?? [],
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    reservoirVolumeOwnershipLimiterHitCount: run.epochHistory
      .filter((epoch) => epoch.reservoirVolumeOwnershipLimiterActive).length,
    maxAbsReservoirVolumeOwnershipRejectedTransferMl: maxOrNull(run.epochHistory
      .map((epoch) => Math.abs(epoch.reservoirVolumeOwnershipRejectedTransferMl ?? Number.NaN))),
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
  };
}

function runPreloadLowStressProbe(): FourChamberBoundedReservoirContractSmokeReportV1["preloadLowStressProbe"] {
  const run = runBoundedProfile(
    { scenarioId: "long-epochs", sampleRateMultiplier: 1, epochs: 56 },
    { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  );
  return {
    epochs: 56,
    rawStatus: run.status,
    failureReasons: run.failureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    volumeOwnershipLimiterHitCount: run.epochHistory
      .filter((epoch) => epoch.reservoirVolumeOwnershipLimiterActive).length,
  };
}

function runBoundedProfile(
  scenario: ScenarioSpecV1,
  profile: ProfileMapV1,
): FourChamberSubsystemRunV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  const rightParams = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map((point) => withSampleRate(point, scenario.sampleRateMultiplier));
  return runFourChamberSubsystemV1({
    profileId: profile.profileId,
    left: requiredPoint(leftParams, profile.leftPointId),
    right: requiredPoint(rightParams, profile.rightPointId),
    reservoir: {
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
      reservoirVolumeOwnershipBoundMl: 24,
    },
  });
}

function removedReasonsFor(
  classification: FourChamberSourceAwareResidualReviewReportV1["residualClassifications"][number],
): readonly string[] {
  const removed = new Set<string>();
  if (classification.owners.some((owner) =>
    owner === "left-source-phase-aligned-sampling-parity"
    || owner === "left-source-load-conditioned-output-reserve"
  )) {
    removed.add("left-surface-not-preserved");
  }
  if (classification.owners.includes("right-source-pv-outflow-lead-not-directly-transferable")) {
    removed.add("right-surface-not-preserved");
  }
  if (classification.owners.includes("right-low-output-phenotype-scope-under-coupling")) {
    removed.add("right-surface-not-preserved");
    removed.add("unexpected-accepted-phenotype");
  }
  return Array.from(removed);
}

function scenarioSummary(
  scenarioId: ScenarioIdV1,
  pointResults: readonly EffectivePointResultV1[],
): ScenarioSummaryV1 {
  const points = pointResults.filter((point) => point.scenarioId === scenarioId);
  return {
    scenarioId,
    rawPassCount: points.filter((point) => point.rawStatus === "pass").length,
    effectivePassCount: points.filter((point) => point.effectiveStatus === "pass").length,
    total: 7,
    maxAbsReservoirVolumeMl: maxOrNull(points.map((point) => point.maxAbsReservoirVolumeMl)),
    volumeOwnershipLimiterHitCount: points.reduce((sum, point) =>
      sum + point.reservoirVolumeOwnershipLimiterHitCount, 0),
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

function withSampleRate<T extends { readonly sampleRateHz: number }>(point: T, multiplier: number): T {
  return { ...point, sampleRateHz: point.sampleRateHz * multiplier };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing bounded reservoir contract profile ${fixtureId}`);
  return point;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  return finite.length === 0 ? null : round(Math.max(...finite));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
