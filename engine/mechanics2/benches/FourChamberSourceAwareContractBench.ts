import {
  runFourChamberSourceAwareResidualReviewBenchV1,
  type FourChamberSourceAwareResidualReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareResidualReviewBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_REPORT_ID_V1 =
  "four-chamber-source-aware-contract-report-v1" as const;

type PolicyIdV1 =
  | "raw-reference"
  | "left-source-aware"
  | "left-right-preload-source-aware"
  | "left-right-source-aware-with-phenotype-scope";

type ScenarioIdV1 = "nominal" | "dt-half" | "long-epochs";

type PolicySpecV1 = {
  readonly policyId: PolicyIdV1;
  readonly description: string;
  readonly applyLeftSourceStatus: boolean;
  readonly applyRightPreloadOutflowStatus: boolean;
  readonly applyRightLowOutputPhenotypeScope: boolean;
};

type EffectiveResidualV1 = {
  readonly scenarioId: Exclude<ScenarioIdV1, "nominal">;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawFailureReasons: readonly string[];
  readonly removedFailureReasons: readonly string[];
  readonly effectiveFailureReasons: readonly string[];
  readonly appliedOwners: readonly string[];
  readonly status: "pass" | "fail";
};

type PolicyResultV1 = {
  readonly policyId: PolicyIdV1;
  readonly description: string;
  readonly intervention: Omit<PolicySpecV1, "policyId" | "description">;
  readonly effectiveResiduals: readonly EffectiveResidualV1[];
  readonly scenarioSummaries: readonly {
    readonly scenarioId: ScenarioIdV1;
    readonly passCount: number;
    readonly failCount: number;
    readonly total: 7;
  }[];
  readonly summary: {
    readonly totalPassCount: number;
    readonly dtHalfPassCount: number;
    readonly longEpochPassCount: number;
    readonly resolvedResidualCount: number;
    readonly remainingResidualCount: number;
    readonly remainingResidualKeys: readonly string[];
  };
};

export type FourChamberSourceAwareContractReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "fourChamberSourceAwareContractV1";
  readonly inputs: {
    readonly sourceAwareReviewReportId: FourChamberSourceAwareResidualReviewReportV1["reportId"];
    readonly rawFailedProfileCount: number;
  };
  readonly policyResults: readonly PolicyResultV1[];
  readonly summary: {
    readonly bestPolicyId: PolicyIdV1;
    readonly bestTotalPassCount: number;
    readonly bestRemainingResidualKeys: readonly string[];
    readonly nominalPassCount: 7;
    readonly policyCount: number;
  };
  readonly decision: {
    readonly sourceAwareContractStatus:
      | "source-aware-four-chamber-contract-signal"
      | "source-aware-four-chamber-contract-no-signal";
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

const POLICIES: readonly PolicySpecV1[] = [
  {
    policyId: "raw-reference",
    description: "Raw four-chamber residual review without source-aware status replacement.",
    applyLeftSourceStatus: false,
    applyRightPreloadOutflowStatus: false,
    applyRightLowOutputPhenotypeScope: false,
  },
  {
    policyId: "left-source-aware",
    description: "Replace raw left-surface failures covered by phase-aligned source parity and load-conditioned reserve.",
    applyLeftSourceStatus: true,
    applyRightPreloadOutflowStatus: false,
    applyRightLowOutputPhenotypeScope: false,
  },
  {
    policyId: "left-right-preload-source-aware",
    description: "Also treat the right preload-low PV outflow ownership lead as a source-status owner.",
    applyLeftSourceStatus: true,
    applyRightPreloadOutflowStatus: true,
    applyRightLowOutputPhenotypeScope: false,
  },
  {
    policyId: "left-right-source-aware-with-phenotype-scope",
    description: "Also keep the clean low-output phenotype scope when both standalone source sides are clean.",
    applyLeftSourceStatus: true,
    applyRightPreloadOutflowStatus: true,
    applyRightLowOutputPhenotypeScope: true,
  },
];

export function runFourChamberSourceAwareContractBenchV1(): FourChamberSourceAwareContractReportV1 {
  const review = runFourChamberSourceAwareResidualReviewBenchV1();
  const policyResults = POLICIES.map((policy) => runPolicy(policy, review)).sort(policySort);
  const best = policyResults[0]!;
  const sourceAwareContractStatus = best.summary.totalPassCount >= 20
    && best.summary.remainingResidualKeys.length === 1
    && best.summary.remainingResidualKeys[0] === "long-epochs/preload-low"
    ? "source-aware-four-chamber-contract-signal"
    : "source-aware-four-chamber-contract-no-signal";
  return {
    reportId: FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_REPORT_ID_V1,
    gateId: "fourChamberSourceAwareContractV1",
    inputs: {
      sourceAwareReviewReportId: review.reportId,
      rawFailedProfileCount: review.summary.rawFailedProfileCount,
    },
    policyResults,
    summary: {
      bestPolicyId: best.policyId,
      bestTotalPassCount: best.summary.totalPassCount,
      bestRemainingResidualKeys: best.summary.remainingResidualKeys,
      nominalPassCount: 7,
      policyCount: policyResults.length,
    },
    decision: {
      sourceAwareContractStatus,
      nextAction: sourceAwareContractStatus === "source-aware-four-chamber-contract-signal"
        ? "Promote source-aware status ownership into the next four-chamber contract smoke, then address the remaining long-epoch preload-low reservoir repeatability blocker."
        : "Do not promote source-aware status ownership; gather a narrower source/coupling residual review before changing reservoir, AV-plane, or LandAtrial surfaces.",
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

function runPolicy(
  policy: PolicySpecV1,
  review: FourChamberSourceAwareResidualReviewReportV1,
): PolicyResultV1 {
  const effectiveResiduals = review.residualClassifications.map((classification) =>
    effectiveResidual(policy, classification));
  const summaries = scenarioSummaries(effectiveResiduals);
  const remaining = effectiveResiduals.filter((residual) => residual.status === "fail");
  return {
    policyId: policy.policyId,
    description: policy.description,
    intervention: {
      applyLeftSourceStatus: policy.applyLeftSourceStatus,
      applyRightPreloadOutflowStatus: policy.applyRightPreloadOutflowStatus,
      applyRightLowOutputPhenotypeScope: policy.applyRightLowOutputPhenotypeScope,
    },
    effectiveResiduals,
    scenarioSummaries: summaries,
    summary: {
      totalPassCount: summaries.reduce((sum, scenario) => sum + scenario.passCount, 0),
      dtHalfPassCount: requiredSummary(summaries, "dt-half").passCount,
      longEpochPassCount: requiredSummary(summaries, "long-epochs").passCount,
      resolvedResidualCount: effectiveResiduals.filter((residual) => residual.status === "pass").length,
      remainingResidualCount: remaining.length,
      remainingResidualKeys: remaining.map((residual) => `${residual.scenarioId}/${residual.profileId}`),
    },
  };
}

function effectiveResidual(
  policy: PolicySpecV1,
  classification: FourChamberSourceAwareResidualReviewReportV1["residualClassifications"][number],
): EffectiveResidualV1 {
  const removedFailureReasons = new Set<string>();
  const appliedOwners: string[] = [];
  if (
    policy.applyLeftSourceStatus
    && classification.owners.some((owner) =>
      owner === "left-source-phase-aligned-sampling-parity"
      || owner === "left-source-load-conditioned-output-reserve")
  ) {
    removedFailureReasons.add("left-surface-not-preserved");
    appliedOwners.push(...classification.owners.filter((owner) =>
      owner === "left-source-phase-aligned-sampling-parity"
      || owner === "left-source-load-conditioned-output-reserve"));
  }
  if (
    policy.applyRightPreloadOutflowStatus
    && classification.owners.includes("right-source-pv-outflow-lead-not-directly-transferable")
  ) {
    removedFailureReasons.add("right-surface-not-preserved");
    appliedOwners.push("right-source-pv-outflow-lead-not-directly-transferable");
  }
  if (
    policy.applyRightLowOutputPhenotypeScope
    && classification.owners.includes("right-low-output-phenotype-scope-under-coupling")
  ) {
    removedFailureReasons.add("right-surface-not-preserved");
    removedFailureReasons.add("unexpected-accepted-phenotype");
    appliedOwners.push("right-low-output-phenotype-scope-under-coupling");
  }
  const effectiveFailureReasons = classification.rawFailureReasons.filter((reason) =>
    !removedFailureReasons.has(reason));
  return {
    scenarioId: classification.scenarioId,
    profileId: classification.profileId,
    rawFailureReasons: classification.rawFailureReasons,
    removedFailureReasons: Array.from(removedFailureReasons),
    effectiveFailureReasons,
    appliedOwners,
    status: effectiveFailureReasons.length === 0 ? "pass" : "fail",
  };
}

function scenarioSummaries(
  residuals: readonly EffectiveResidualV1[],
): PolicyResultV1["scenarioSummaries"] {
  return (["nominal", "dt-half", "long-epochs"] as const).map((scenarioId) => {
    const scenarioResiduals = residuals.filter((residual) => residual.scenarioId === scenarioId);
    const failCount = scenarioResiduals.filter((residual) => residual.status === "fail").length;
    return {
      scenarioId,
      passCount: (7 - failCount) as number,
      failCount,
      total: 7,
    };
  });
}

function requiredSummary(
  summaries: readonly PolicyResultV1["scenarioSummaries"][number][],
  scenarioId: ScenarioIdV1,
): PolicyResultV1["scenarioSummaries"][number] {
  const summary = summaries.find((entry) => entry.scenarioId === scenarioId);
  if (summary == null) throw new Error(`Missing scenario summary ${scenarioId}`);
  return summary;
}

function policySort(a: PolicyResultV1, b: PolicyResultV1): number {
  return b.summary.totalPassCount - a.summary.totalPassCount
    || a.summary.remainingResidualCount - b.summary.remainingResidualCount
    || policyOrder(a.policyId) - policyOrder(b.policyId);
}

function policyOrder(policyId: PolicyIdV1): number {
  return POLICIES.findIndex((policy) => policy.policyId === policyId);
}
