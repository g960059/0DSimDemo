import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1,
} from "@/engine/mechanics2/core/FourChamberAssemblyContractV1";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemReservoirParamsV1,
  type FourChamberSubsystemRunV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_SUBSYSTEM_SMOKE_REPORT_ID_V1 =
  "four-chamber-subsystem-smoke-report-v1" as const;

type SubsystemScaffoldSpecV1 = {
  readonly scaffoldId: string;
  readonly rightUpperPressureContribution01: number;
  readonly reservoirTransferGain01: number;
  readonly reservoirTransferCapMl: number;
};

type SubsystemProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type SubsystemScaffoldResultV1 = {
  readonly scaffold: SubsystemScaffoldSpecV1;
  readonly reservoir: FourChamberSubsystemReservoirParamsV1;
  readonly profileResults: readonly FourChamberSubsystemRunV1[];
  readonly summary: {
    readonly profileCount: number;
    readonly passCount: number;
    readonly morphologyPreservedCount: number;
    readonly flowBalancedCount: number;
    readonly repeatableCount: number;
    readonly phenotypeScopeOkCount: number;
    readonly maxAbsForwardMismatchMl: number | null;
    readonly meanAbsForwardMismatchMl: number | null;
    readonly maxAbsAcceptedTransferMl: number | null;
    readonly maxAbsReservoirVolumeMl: number | null;
    readonly maxPulmonaryVenousPressureAdjustmentMmHg: number | null;
    readonly maxSystemicPressureAdjustmentMmHg: number | null;
  };
  readonly status: "pass" | "fail";
  readonly failureReasons: readonly string[];
};

export type FourChamberSubsystemSmokeReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SUBSYSTEM_SMOKE_REPORT_ID_V1;
  readonly gateId: "fourChamberSubsystemSmokeV1";
  readonly contractId: typeof FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1.contractId;
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly assemblySmokeSelectedScaffoldId: string;
  };
  readonly scaffoldResults: readonly SubsystemScaffoldResultV1[];
  readonly selectedScaffold: SubsystemScaffoldResultV1 | null;
  readonly summary: {
    readonly totalScaffolds: number;
    readonly passCount: number;
    readonly selectedScaffoldId: string | null;
    readonly selectedMeanAbsForwardMismatchMl: number | null;
    readonly selectedMaxAcceptedTransferMl: number | null;
    readonly selectedMaxReservoirVolumeMl: number | null;
  };
  readonly decision: {
    readonly subsystemSmokeStatus:
      | "four-chamber-subsystem-smoke-pass"
      | "four-chamber-subsystem-smoke-mixed"
      | "four-chamber-subsystem-smoke-blocked";
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

const PROFILE_MAP: readonly SubsystemProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

const SUBSYSTEM_SCAFFOLDS: readonly SubsystemScaffoldSpecV1[] = [
  {
    scaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
    rightUpperPressureContribution01: 0.47,
    reservoirTransferGain01: 0.14,
    reservoirTransferCapMl: 3.5,
  },
  {
    scaffoldId: "center-pressure045-gain012-cap4",
    rightUpperPressureContribution01: 0.45,
    reservoirTransferGain01: 0.12,
    reservoirTransferCapMl: 4,
  },
];

export function runFourChamberSubsystemSmokeBenchV1(): FourChamberSubsystemSmokeReportV1 {
  const scaffoldResults = SUBSYSTEM_SCAFFOLDS.map(runScaffold);
  const passing = scaffoldResults.filter((result) => result.status === "pass");
  const selectedScaffold = [...passing].sort((a, b) =>
    (a.summary.meanAbsForwardMismatchMl ?? 1e9) - (b.summary.meanAbsForwardMismatchMl ?? 1e9)
    || (a.summary.maxAbsAcceptedTransferMl ?? 1e9) - (b.summary.maxAbsAcceptedTransferMl ?? 1e9)
  )[0] ?? null;
  const subsystemSmokeStatus = passing.length === scaffoldResults.length
    ? "four-chamber-subsystem-smoke-pass"
    : passing.length > 0
      ? "four-chamber-subsystem-smoke-mixed"
      : "four-chamber-subsystem-smoke-blocked";
  return {
    reportId: FOUR_CHAMBER_SUBSYSTEM_SMOKE_REPORT_ID_V1,
    gateId: "fourChamberSubsystemSmokeV1",
    contractId: FOUR_CHAMBER_ASSEMBLY_CONTRACT_V1.contractId,
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      assemblySmokeSelectedScaffoldId: "best-neighborhood-pressure047-gain014-cap35",
    },
    scaffoldResults,
    selectedScaffold,
    summary: {
      totalScaffolds: scaffoldResults.length,
      passCount: passing.length,
      selectedScaffoldId: selectedScaffold?.scaffold.scaffoldId ?? null,
      selectedMeanAbsForwardMismatchMl: selectedScaffold?.summary.meanAbsForwardMismatchMl ?? null,
      selectedMaxAcceptedTransferMl: selectedScaffold?.summary.maxAbsAcceptedTransferMl ?? null,
      selectedMaxReservoirVolumeMl: selectedScaffold?.summary.maxAbsReservoirVolumeMl ?? null,
    },
    decision: {
      subsystemSmokeStatus,
      nextAction: subsystemSmokeStatus === "four-chamber-subsystem-smoke-pass"
        ? "Proceed to time-domain four-chamber subsystem residual/numerics review. Keep runtime, AV-plane, and LandAtrial blocked."
        : "Keep the lane at four-chamber subsystem smoke. Do not proceed to residual/numerics review until this smoke preserves the assembly contract.",
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

function runScaffold(scaffold: SubsystemScaffoldSpecV1): SubsystemScaffoldResultV1 {
  const leftParams = buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID);
  const rightParams = buildRightHeartStrategicEnvelopeV1().map((point) => applyRightScaffold(point, scaffold));
  const reservoir = reservoirParams(scaffold);
  const profileResults = PROFILE_MAP.map((profile) => {
    const left = requiredPoint(leftParams, profile.leftPointId);
    const right = requiredPoint(rightParams, profile.rightPointId);
    return runFourChamberSubsystemV1({
      profileId: profile.profileId,
      left,
      right,
      reservoir,
    });
  });
  const failureReasons = profileResults
    .filter((profile) => profile.status !== "pass")
    .map((profile) => `${profile.profileId}: ${profile.failureReasons.join(",")}`);
  return {
    scaffold,
    reservoir,
    profileResults,
    summary: summarizeProfiles(profileResults),
    status: failureReasons.length === 0 ? "pass" : "fail",
    failureReasons,
  };
}

function applyRightScaffold(
  point: RightHeartSubsystemParamsV2,
  scaffold: SubsystemScaffoldSpecV1,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: scaffold.rightUpperPressureContribution01,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function reservoirParams(scaffold: SubsystemScaffoldSpecV1): FourChamberSubsystemReservoirParamsV1 {
  return {
    epochs: 14,
    transferGain01: scaffold.reservoirTransferGain01,
    maxTransferPerEpochMl: scaffold.reservoirTransferCapMl,
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
  profileResults: readonly FourChamberSubsystemRunV1[],
): SubsystemScaffoldResultV1["summary"] {
  return {
    profileCount: profileResults.length,
    passCount: profileResults.filter((profile) => profile.status === "pass").length,
    morphologyPreservedCount: profileResults.filter((profile) => profile.classifications.morphologyPreserved).length,
    flowBalancedCount: profileResults.filter((profile) => profile.classifications.flowBalanced).length,
    repeatableCount: profileResults.filter((profile) => profile.classifications.repeatableFinalState).length,
    phenotypeScopeOkCount: profileResults.filter((profile) => profile.classifications.phenotypeScopeOk).length,
    maxAbsForwardMismatchMl: maxOrNull(profileResults.map((profile) => profile.finalState.absMismatchMl)),
    meanAbsForwardMismatchMl: meanOrNull(profileResults.map((profile) => profile.finalState.absMismatchMl)),
    maxAbsAcceptedTransferMl: maxOrNull(profileResults.map((profile) => profile.finalState.maxAbsAcceptedTransferMl)),
    maxAbsReservoirVolumeMl: maxOrNull(profileResults.map((profile) => profile.finalState.maxAbsReservoirVolumeMl)),
    maxPulmonaryVenousPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.finalState.pulmonaryVenousPressureAdjustmentMmHg))),
    maxSystemicPressureAdjustmentMmHg:
      maxOrNull(profileResults.map((profile) => Math.abs(profile.finalState.systemicPressureAdjustmentMmHg))),
  };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing four-chamber subsystem profile ${fixtureId}`);
  return point;
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
