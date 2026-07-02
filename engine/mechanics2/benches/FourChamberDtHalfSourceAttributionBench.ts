import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
  type LeftHeartDynamicReserveVariantIdV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemProfileIdV1,
  type FourChamberSubsystemReservoirParamsV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const FOUR_CHAMBER_DTHALF_SOURCE_ATTRIBUTION_REPORT_ID_V1 =
  "four-chamber-dthalf-source-attribution-report-v1" as const;

type AttributionProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

type SideAttributionV1 =
  | "not-subsystem-failed"
  | "standalone-dt-half-source-fails"
  | "reservoir-pressure-perturbation-fails"
  | "subsystem-coupling-only";

type ProfileAttributionResultV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly subsystemFailureReasons: readonly string[];
  readonly finalPulmonaryVenousPressureMmHg: number;
  readonly finalSystemicVenousPressureMmHg: number;
  readonly left: {
    readonly subsystemFailed: boolean;
    readonly baseStatus: LeftHeartDynamicReservePointResultV1["status"];
    readonly adjustedStatus: LeftHeartDynamicReservePointResultV1["status"];
    readonly baseFailureReasons: readonly string[];
    readonly adjustedFailureReasons: readonly string[];
    readonly attribution: SideAttributionV1;
  };
  readonly right: {
    readonly subsystemFailed: boolean;
    readonly baseStatus: RightHeartStrategicSmokePointResultV1["status"];
    readonly adjustedStatus: RightHeartStrategicSmokePointResultV1["status"];
    readonly baseFailureReasons: readonly string[];
    readonly adjustedFailureReasons: readonly string[];
    readonly attribution: SideAttributionV1;
  };
};

export type FourChamberDtHalfSourceAttributionReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_DTHALF_SOURCE_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "fourChamberDtHalfSourceAttributionV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: LeftHeartDynamicReserveVariantIdV1;
    readonly selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly sampleRateMultiplier: 2;
  };
  readonly profileResults: readonly ProfileAttributionResultV1[];
  readonly summary: {
    readonly profileCount: number;
    readonly subsystemFailedSideCount: number;
    readonly standaloneDtHalfSourceFailureCount: number;
    readonly reservoirPressurePerturbationFailureCount: number;
    readonly subsystemCouplingOnlyCount: number;
  };
  readonly decision: {
    readonly attributionStatus:
      | "dt-half-source-attribution-standalone-source"
      | "dt-half-source-attribution-pressure-perturbation"
      | "dt-half-source-attribution-mixed";
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

const ATTRIBUTION_PROFILES: readonly AttributionProfileMapV1[] = [
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
];

export function runFourChamberDtHalfSourceAttributionBenchV1():
FourChamberDtHalfSourceAttributionReportV1 {
  const profileResults = ATTRIBUTION_PROFILES.map(runProfile);
  const attributions = profileResults.flatMap((profile) => [profile.left, profile.right])
    .filter((side) => side.subsystemFailed)
    .map((side) => side.attribution);
  const standaloneCount = attributions.filter((value) => value === "standalone-dt-half-source-fails").length;
  const pressureCount = attributions.filter((value) => value === "reservoir-pressure-perturbation-fails").length;
  const couplingOnlyCount = attributions.filter((value) => value === "subsystem-coupling-only").length;
  const attributionStatus = pressureCount > 0
    ? "dt-half-source-attribution-pressure-perturbation"
    : couplingOnlyCount > 0
      ? "dt-half-source-attribution-mixed"
      : "dt-half-source-attribution-standalone-source";
  return {
    reportId: FOUR_CHAMBER_DTHALF_SOURCE_ATTRIBUTION_REPORT_ID_V1,
    gateId: "fourChamberDtHalfSourceAttributionV1",
    sourceSurfaces: {
      leftVariantId: LEFT_VARIANT_ID,
      selectedScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      sampleRateMultiplier: 2,
    },
    profileResults,
    summary: {
      profileCount: profileResults.length,
      subsystemFailedSideCount: attributions.length,
      standaloneDtHalfSourceFailureCount: standaloneCount,
      reservoirPressurePerturbationFailureCount: pressureCount,
      subsystemCouplingOnlyCount: couplingOnlyCount,
    },
    decision: {
      attributionStatus,
      nextAction: attributionStatus === "dt-half-source-attribution-standalone-source"
        ? "Focus next on standalone dt-half source-surface numerics before changing reservoir coupling."
        : attributionStatus === "dt-half-source-attribution-pressure-perturbation"
          ? "Focus next on reservoir pressure perturbation compatibility before changing source surfaces."
          : "Classify subsystem-only dt-half residuals before expanding the four-chamber sidecar.",
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

function runProfile(profile: AttributionProfileMapV1): ProfileAttributionResultV1 {
  const leftBase = withSampleRate(requiredPoint(
    buildLeftHeartDynamicReserveVariantEnvelopeV1(LEFT_VARIANT_ID),
    profile.leftPointId,
  ));
  const rightBase = withSampleRate(requiredPoint(
    buildRightHeartStrategicEnvelopeV1().map(applySelectedRightScaffold),
    profile.rightPointId,
  ));
  const subsystemRun = runFourChamberSubsystemV1({
    profileId: profile.profileId,
    left: leftBase,
    right: rightBase,
    reservoir: reservoirParams(),
  });
  const leftAdjusted = runLeftHeartDynamicReservePointV1(
    withLeftPulmonaryPressure(leftBase, subsystemRun.finalState.pulmonaryVenousPressureMmHg),
  );
  const rightAdjusted = runRightHeartStrategicPointV1(
    withRightSystemicVenousPressure(rightBase, subsystemRun.finalState.systemicVenousPressureMmHg),
  );
  const leftBaseResult = runLeftHeartDynamicReservePointV1(leftBase);
  const rightBaseResult = runRightHeartStrategicPointV1(rightBase);
  const leftSubsystemFailed = subsystemRun.failureReasons.includes("left-surface-not-preserved");
  const rightSubsystemFailed = subsystemRun.failureReasons.includes("right-surface-not-preserved");
  return {
    profileId: profile.profileId,
    subsystemFailureReasons: subsystemRun.failureReasons,
    finalPulmonaryVenousPressureMmHg: subsystemRun.finalState.pulmonaryVenousPressureMmHg,
    finalSystemicVenousPressureMmHg: subsystemRun.finalState.systemicVenousPressureMmHg,
    left: {
      subsystemFailed: leftSubsystemFailed,
      baseStatus: leftBaseResult.status,
      adjustedStatus: leftAdjusted.status,
      baseFailureReasons: leftBaseResult.failureReasons,
      adjustedFailureReasons: leftAdjusted.failureReasons,
      attribution: classifySide(leftSubsystemFailed, leftBaseResult.status, leftAdjusted.status),
    },
    right: {
      subsystemFailed: rightSubsystemFailed,
      baseStatus: rightBaseResult.status,
      adjustedStatus: rightAdjusted.status,
      baseFailureReasons: rightBaseResult.failureReasons,
      adjustedFailureReasons: rightAdjusted.failureReasons,
      attribution: classifySide(rightSubsystemFailed, rightBaseResult.status, rightAdjusted.status),
    },
  };
}

function classifySide(
  subsystemFailed: boolean,
  baseStatus: "pass" | "fail" | "inconclusive",
  adjustedStatus: "pass" | "fail" | "inconclusive",
): SideAttributionV1 {
  if (!subsystemFailed) return "not-subsystem-failed";
  if (baseStatus !== "pass") return "standalone-dt-half-source-fails";
  if (adjustedStatus !== "pass") return "reservoir-pressure-perturbation-fails";
  return "subsystem-coupling-only";
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

function reservoirParams(): FourChamberSubsystemReservoirParamsV1 {
  return {
    epochs: 14,
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

function withSampleRate<T extends { readonly sampleRateHz: number }>(point: T): T {
  return { ...point, sampleRateHz: point.sampleRateHz * 2 };
}

function withLeftPulmonaryPressure(
  params: LeftHeartSubsystemParamsV2,
  pressureMmHg: number,
): LeftHeartSubsystemParamsV2 {
  return {
    ...params,
    pulmonaryVenousPressureMmHg: pressureMmHg,
    pulmonaryVenousInitialPressureMmHg: pressureMmHg,
    pulmonaryVenousSourcePressureMmHg: pressureMmHg,
  };
}

function withRightSystemicVenousPressure(
  params: RightHeartSubsystemParamsV2,
  pressureMmHg: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...params,
    systemicVenousPressureMmHg: pressureMmHg,
  };
}

function requiredPoint<T extends { readonly fixtureId: string }>(
  points: readonly T[],
  fixtureId: string,
): T {
  const point = points.find((candidate) => candidate.fixtureId === fixtureId);
  if (point == null) throw new Error(`Missing dt-half source attribution profile ${fixtureId}`);
  return point;
}
