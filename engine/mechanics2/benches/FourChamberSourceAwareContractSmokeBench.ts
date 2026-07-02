import {
  runFourChamberSourceAwareContractBenchV1,
  type FourChamberSourceAwareContractReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareContractBench";
import {
  runFourChamberSubsystemResidualReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSubsystemResidualReviewBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_SMOKE_REPORT_ID_V1 =
  "four-chamber-source-aware-contract-smoke-report-v1" as const;

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type RemainingBlockerV1 = {
  readonly scenarioId: Exclude<ScenarioIdV1, "nominal">;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly effectiveFailureReasons: readonly string[];
  readonly rawFailureReasons: readonly string[];
  readonly absForwardMismatchMl: number | null;
  readonly maxAbsReservoirVolumeMl: number;
  readonly finalReservoirStepMl: number | null;
  readonly maxAbsAcceptedTransferMl: number | null;
  readonly pulmonaryVenousPressureAdjustmentMmHg: number;
  readonly systemicPressureAdjustmentMmHg: number;
};

export type FourChamberSourceAwareContractSmokeReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_SMOKE_REPORT_ID_V1;
  readonly gateId: "fourChamberSourceAwareContractSmokeV1";
  readonly inputs: {
    readonly sourceAwareContractReportId: FourChamberSourceAwareContractReportV1["reportId"];
    readonly selectedPolicyId: FourChamberSourceAwareContractReportV1["summary"]["bestPolicyId"];
  };
  readonly scenarioSummaries: FourChamberSourceAwareContractReportV1["policyResults"][number]["scenarioSummaries"];
  readonly remainingBlockers: readonly RemainingBlockerV1[];
  readonly summary: {
    readonly totalPassCount: number;
    readonly total: 21;
    readonly remainingBlockerCount: number;
    readonly remainingReservoirRepeatabilityBlockerCount: number;
    readonly maxRemainingReservoirVolumeMl: number | null;
    readonly maxRemainingReservoirStepMl: number | null;
  };
  readonly decision: {
    readonly contractSmokeStatus:
      | "source-aware-four-chamber-contract-smoke-pass"
      | "source-aware-four-chamber-contract-smoke-reservoir-repeatability-blocked"
      | "source-aware-four-chamber-contract-smoke-blocked";
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

export function runFourChamberSourceAwareContractSmokeBenchV1():
FourChamberSourceAwareContractSmokeReportV1 {
  const contract = runFourChamberSourceAwareContractBenchV1();
  const rawResidual = runFourChamberSubsystemResidualReviewBenchV1();
  const selected = requiredPolicy(contract, contract.summary.bestPolicyId);
  const remainingBlockers = selected.effectiveResiduals
    .filter((residual) => residual.status === "fail")
    .map((residual) => {
      const raw = rawProfile(rawResidual, residual.scenarioId, residual.profileId);
      return {
        scenarioId: residual.scenarioId,
        profileId: residual.profileId,
        effectiveFailureReasons: residual.effectiveFailureReasons,
        rawFailureReasons: residual.rawFailureReasons,
        absForwardMismatchMl: raw.absForwardMismatchMl,
        maxAbsReservoirVolumeMl: raw.maxAbsReservoirVolumeMl,
        finalReservoirStepMl: raw.finalReservoirStepMl,
        maxAbsAcceptedTransferMl: raw.maxAbsAcceptedTransferMl,
        pulmonaryVenousPressureAdjustmentMmHg: raw.pulmonaryVenousPressureAdjustmentMmHg,
        systemicPressureAdjustmentMmHg: raw.systemicPressureAdjustmentMmHg,
      };
    });
  const remainingReservoirRepeatabilityBlockerCount = remainingBlockers.filter((blocker) =>
    blocker.effectiveFailureReasons.includes("persistent-large-reservoir-shuttle")).length;
  const totalPassCount = selected.summary.totalPassCount;
  const contractSmokeStatus = totalPassCount === 21
    ? "source-aware-four-chamber-contract-smoke-pass"
    : totalPassCount === 20
      && remainingBlockers.length === 1
      && remainingReservoirRepeatabilityBlockerCount === 1
      ? "source-aware-four-chamber-contract-smoke-reservoir-repeatability-blocked"
      : "source-aware-four-chamber-contract-smoke-blocked";
  return {
    reportId: FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_SMOKE_REPORT_ID_V1,
    gateId: "fourChamberSourceAwareContractSmokeV1",
    inputs: {
      sourceAwareContractReportId: contract.reportId,
      selectedPolicyId: selected.policyId,
    },
    scenarioSummaries: selected.scenarioSummaries,
    remainingBlockers,
    summary: {
      totalPassCount,
      total: 21,
      remainingBlockerCount: remainingBlockers.length,
      remainingReservoirRepeatabilityBlockerCount,
      maxRemainingReservoirVolumeMl: maxOrNull(remainingBlockers.map((blocker) =>
        blocker.maxAbsReservoirVolumeMl)),
      maxRemainingReservoirStepMl: maxOrNull(remainingBlockers.map((blocker) =>
        blocker.finalReservoirStepMl)),
    },
    decision: {
      contractSmokeStatus,
      nextAction: contractSmokeStatus === "source-aware-four-chamber-contract-smoke-reservoir-repeatability-blocked"
        ? "Keep the source-aware contract smoke as the current scaffold and address long-epoch preload-low reservoir repeatability next, without reservoir broad retuning, AV-plane, LandAtrial, or runtime wiring."
        : contractSmokeStatus === "source-aware-four-chamber-contract-smoke-pass"
          ? "Proceed to a true four-chamber dynamics/numerics smoke before runtime or atrial work."
          : "Do not promote the source-aware contract; classify remaining blockers before further model work.",
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

function requiredPolicy(
  contract: FourChamberSourceAwareContractReportV1,
  policyId: FourChamberSourceAwareContractReportV1["summary"]["bestPolicyId"],
): FourChamberSourceAwareContractReportV1["policyResults"][number] {
  const policy = contract.policyResults.find((entry) => entry.policyId === policyId);
  if (policy == null) throw new Error(`Missing policy ${policyId}`);
  return policy;
}

function rawProfile(
  raw: ReturnType<typeof runFourChamberSubsystemResidualReviewBenchV1>,
  scenarioId: Exclude<ScenarioIdV1, "nominal">,
  profileId: FourChamberSubsystemProfileIdV1,
): ReturnType<typeof runFourChamberSubsystemResidualReviewBenchV1>["scenarioResults"][number]["profileResults"][number] {
  const scenario = raw.scenarioResults.find((entry) => entry.scenario.scenarioId === scenarioId);
  if (scenario == null) throw new Error(`Missing scenario ${scenarioId}`);
  const profile = scenario.profileResults.find((entry) => entry.profileId === profileId);
  if (profile == null) throw new Error(`Missing profile ${scenarioId}/${profileId}`);
  return profile;
}

function maxOrNull(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return Math.round(Math.max(...finite) * 1_000_000) / 1_000_000;
}
