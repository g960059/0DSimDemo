import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import {
  runFourChamberSubsystemV1,
  type FourChamberSubsystemReservoirParamsV1,
} from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const PRELOAD_LOW_RESERVOIR_REPEATABILITY_ATTRIBUTION_REPORT_ID_V1 =
  "preload-low-reservoir-repeatability-attribution-report-v1" as const;

type EpochProbeV1 = {
  readonly epochs: number;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly failureReasons: readonly string[];
  readonly leftStatus: string;
  readonly rightStatus: string;
  readonly finalAbsForwardMismatchMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly finalAcceptedTransferMl: number | null;
  readonly transferLimiterHitCount: number;
  readonly lastEightReservoirStepMeanMl: number | null;
  readonly lastEightReservoirVolumeSlopeMlPerEpoch: number | null;
};

export type PreloadLowReservoirRepeatabilityAttributionReportV1 = {
  readonly reportId: typeof PRELOAD_LOW_RESERVOIR_REPEATABILITY_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "preloadLowReservoirRepeatabilityAttributionV1";
  readonly inputs: {
    readonly profileId: "preload-low";
    readonly leftPointId: "left-heart-preload-low";
    readonly rightPointId: "right-heart-preload-low";
    readonly reservoirScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly epochCounts: readonly number[];
  };
  readonly epochProbes: readonly EpochProbeV1[];
  readonly summary: {
    readonly longestEpochs: number;
    readonly longestStatus: EpochProbeV1["status"];
    readonly longestMaxAbsReservoirVolumeMl: number;
    readonly longestFinalReservoirStepMl: number | null;
    readonly maxReservoirVolumeGrowthFrom22ToLongestMl: number | null;
    readonly allSourceSurfacesPreserved: boolean;
  };
  readonly decision: {
    readonly repeatabilityStatus:
      | "persistent-reservoir-shuttle-not-slow-convergence"
      | "reservoir-load-breaks-right-surface-after-volume-accumulation"
      | "slow-convergence-plausible"
      | "inconclusive";
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

const EPOCH_COUNTS = [14, 22, 40, 56] as const;

export function runPreloadLowReservoirRepeatabilityAttributionBenchV1():
PreloadLowReservoirRepeatabilityAttributionReportV1 {
  const epochProbes = EPOCH_COUNTS.map(runProbe);
  const longest = epochProbes.at(-1)!;
  const at22 = epochProbes.find((probe) => probe.epochs === 22);
  const maxReservoirVolumeGrowthFrom22ToLongestMl = at22 == null
    ? null
    : round(longest.maxAbsReservoirVolumeMl - at22.maxAbsReservoirVolumeMl);
  const allSourceSurfacesPreserved = epochProbes.every((probe) =>
    probe.leftStatus === "pass" && probe.rightStatus === "pass");
  const repeatabilityStatus =
    !allSourceSurfacesPreserved
    && longest.rightStatus !== "pass"
    && (maxReservoirVolumeGrowthFrom22ToLongestMl ?? 0) > 15
    && longest.maxAbsReservoirVolumeMl > 45
      ? "reservoir-load-breaks-right-surface-after-volume-accumulation"
      : allSourceSurfacesPreserved
    && longest.status === "fail"
    && longest.failureReasons.includes("persistent-large-reservoir-shuttle")
    && (longest.finalReservoirStepMl ?? 0) > 0.5
    && (maxReservoirVolumeGrowthFrom22ToLongestMl ?? 0) > 5
      ? "persistent-reservoir-shuttle-not-slow-convergence"
      : allSourceSurfacesPreserved
        && longest.status === "fail"
        && (longest.finalReservoirStepMl ?? 1e9) <= 0.5
        ? "slow-convergence-plausible"
        : "inconclusive";
  return {
    reportId: PRELOAD_LOW_RESERVOIR_REPEATABILITY_ATTRIBUTION_REPORT_ID_V1,
    gateId: "preloadLowReservoirRepeatabilityAttributionV1",
    inputs: {
      profileId: "preload-low",
      leftPointId: "left-heart-preload-low",
      rightPointId: "right-heart-preload-low",
      reservoirScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      epochCounts: EPOCH_COUNTS,
    },
    epochProbes,
    summary: {
      longestEpochs: longest.epochs,
      longestStatus: longest.status,
      longestMaxAbsReservoirVolumeMl: longest.maxAbsReservoirVolumeMl,
      longestFinalReservoirStepMl: longest.finalReservoirStepMl,
      maxReservoirVolumeGrowthFrom22ToLongestMl,
      allSourceSurfacesPreserved,
    },
    decision: {
      repeatabilityStatus,
      nextAction: repeatabilityStatus === "reservoir-load-breaks-right-surface-after-volume-accumulation"
        ? "Treat preload-low as a reservoir load-accumulation / right-surface compatibility blocker and design a bounded reservoir-volume ownership contract; do not broaden reservoir tuning or move to AV-plane/LandAtrial."
        : repeatabilityStatus === "persistent-reservoir-shuttle-not-slow-convergence"
        ? "Treat preload-low as a reservoir state/repeatability ownership blocker and design a bounded reservoir-state repeatability contract; do not broaden reservoir tuning or move to AV-plane/LandAtrial."
        : repeatabilityStatus === "slow-convergence-plausible"
          ? "Extend the warmup/repeatability protocol before changing model structure."
          : "Gather a narrower epoch-history attribution before changing model structure.",
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

function runProbe(epochs: number): EpochProbeV1 {
  const run = runFourChamberSubsystemV1({
    profileId: "preload-low",
    left: leftPreloadLow(),
    right: rightPreloadLow(),
    reservoir: reservoirParams(epochs),
  });
  const last = run.epochHistory.at(-1);
  const lastEight = run.epochHistory.slice(-8);
  return {
    epochs,
    status: run.status,
    failureReasons: run.failureReasons,
    leftStatus: run.finalState.leftStatus,
    rightStatus: run.finalState.rightStatus,
    finalAbsForwardMismatchMl: run.finalState.absMismatchMl,
    maxAbsReservoirVolumeMl: run.finalState.maxAbsReservoirVolumeMl,
    finalAbsReservoirVolumeMl: last == null
      ? Number.NaN
      : round(Math.max(
        Math.abs(last.pulmonaryVenousReservoirVolumeMl),
        Math.abs(last.systemicVenousReservoirVolumeMl),
      )),
    finalReservoirStepMl: run.finalState.finalReservoirStepMl,
    maxAbsAcceptedTransferMl: run.finalState.maxAbsAcceptedTransferMl,
    finalAcceptedTransferMl: run.finalState.finalAcceptedTransferMl,
    transferLimiterHitCount: run.epochHistory.filter((epoch) => epoch.transferLimiterActive).length,
    lastEightReservoirStepMeanMl: meanOrNull(lastEight.map((epoch, index, entries) => {
      if (index === 0) return null;
      const previous = entries[index - 1]!;
      return Math.abs(epoch.pulmonaryVenousReservoirVolumeMl - previous.pulmonaryVenousReservoirVolumeMl);
    })),
    lastEightReservoirVolumeSlopeMlPerEpoch: reservoirSlope(lastEight),
  };
}

function leftPreloadLow() {
  const point = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .find((candidate) => candidate.fixtureId === "left-heart-preload-low");
  if (point == null) throw new Error("Missing left-heart-preload-low");
  return point;
}

function rightPreloadLow() {
  const point = buildRightHeartStrategicEnvelopeV1()
    .find((candidate) => candidate.fixtureId === "right-heart-preload-low");
  if (point == null) throw new Error("Missing right-heart-preload-low");
  return applySelectedRightScaffold(point);
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

function reservoirSlope(entries: readonly { readonly pulmonaryVenousReservoirVolumeMl: number }[]): number | null {
  if (entries.length < 2) return null;
  const first = entries[0]!;
  const last = entries.at(-1)!;
  return round((Math.abs(last.pulmonaryVenousReservoirVolumeMl)
    - Math.abs(first.pulmonaryVenousReservoirVolumeMl)) / (entries.length - 1));
}

function meanOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length);
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
