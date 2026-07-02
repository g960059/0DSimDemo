import {
  runFourChamberSubsystemResidualReviewBenchV1,
  type FourChamberSubsystemResidualReviewReportV1,
} from "@/engine/mechanics2/benches/FourChamberSubsystemResidualReviewBench";
import {
  runRightPreloadOutflowOwnershipBenchV1,
  type RightPreloadOutflowOwnershipReportV1,
} from "@/engine/mechanics2/benches/RightPreloadOutflowOwnershipBench";
import {
  runSourceSurfaceContractBenchV1,
  type SourceSurfaceContractReportV1,
} from "@/engine/mechanics2/benches/SourceSurfaceContractBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const FOUR_CHAMBER_SOURCE_AWARE_RESIDUAL_REVIEW_REPORT_ID_V1 =
  "four-chamber-source-aware-residual-review-report-v1" as const;

type ScenarioIdV1 = "dt-half" | "long-epochs";

type SourceAwareOwnerV1 =
  | "left-source-phase-aligned-sampling-parity"
  | "left-source-load-conditioned-output-reserve"
  | "right-source-pv-outflow-lead-not-directly-transferable"
  | "right-low-output-phenotype-scope-under-coupling"
  | "reservoir-repeatability"
  | "coupled-forward-mismatch";

type SourcePointSnapshotV1 = {
  readonly pointId: string;
  readonly sourceStatus: string;
  readonly sourceFailureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly phaseAlignedShapeParityOk: boolean;
  readonly outputOk: boolean;
  readonly repeatabilityOk: boolean;
  readonly dtOutputParityOk: boolean;
  readonly morphologyOk: boolean;
  readonly forwardEjectionMl: number | null;
};

type ResidualClassificationV1 = {
  readonly scenarioId: ScenarioIdV1;
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly rawStatus: "pass" | "fail" | "inconclusive";
  readonly rawFailureReasons: readonly string[];
  readonly rawLeftStatus: string;
  readonly rawRightStatus: string;
  readonly leftSource: SourcePointSnapshotV1 | null;
  readonly rightSource: SourcePointSnapshotV1 | null;
  readonly owners: readonly SourceAwareOwnerV1[];
  readonly sourceAwareDisposition:
    | "raw-left-failure-reclassified"
    | "source-lead-exists-but-direct-transfer-blocked"
    | "coupled-reservoir-or-phenotype-blocker";
  readonly recommendedNextContract: string;
};

export type FourChamberSourceAwareResidualReviewReportV1 = {
  readonly reportId: typeof FOUR_CHAMBER_SOURCE_AWARE_RESIDUAL_REVIEW_REPORT_ID_V1;
  readonly gateId: "fourChamberSourceAwareResidualReviewV1";
  readonly inputs: {
    readonly rawResidualReviewReportId: FourChamberSubsystemResidualReviewReportV1["reportId"];
    readonly sourceContractReportId: SourceSurfaceContractReportV1["reportId"];
    readonly rightOutflowOwnershipReportId: RightPreloadOutflowOwnershipReportV1["reportId"];
    readonly leftSourceCandidateId: SourceSurfaceContractReportV1["summary"]["leftBestCandidateId"];
    readonly rightOutflowLeadId: RightPreloadOutflowOwnershipReportV1["summary"]["bestCandidateId"];
  };
  readonly residualClassifications: readonly ResidualClassificationV1[];
  readonly summary: {
    readonly rawFailedProfileCount: number;
    readonly rawLeftFailureReclassifiedCount: number;
    readonly sourceLeadExistsButDirectTransferBlockedCount: number;
    readonly coupledReservoirOrPhenotypeBlockerCount: number;
    readonly sourceAwareUnblockedCount: number;
  };
  readonly decision: {
    readonly sourceAwareReviewStatus:
      | "source-aware-four-chamber-review-actionable"
      | "source-aware-four-chamber-review-inconclusive";
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

type ProfileMapV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

const PROFILE_MAP: readonly ProfileMapV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

export function runFourChamberSourceAwareResidualReviewBenchV1():
FourChamberSourceAwareResidualReviewReportV1 {
  const raw = runFourChamberSubsystemResidualReviewBenchV1();
  const source = runSourceSurfaceContractBenchV1();
  const rightOutflow = runRightPreloadOutflowOwnershipBenchV1();
  const leftBest = requiredLeftCandidate(source);
  const classifications = raw.scenarioResults
    .filter((scenario) => scenario.scenario.scenarioId !== "nominal")
    .flatMap((scenario) => scenario.profileResults
      .filter((profile) => profile.status !== "pass")
      .map((profile) => classifyResidual({
        scenarioId: scenario.scenario.scenarioId as ScenarioIdV1,
        profile,
        source,
        leftBest,
        rightOutflow,
      })));
  const summary = {
    rawFailedProfileCount: classifications.length,
    rawLeftFailureReclassifiedCount: classifications.filter((entry) =>
      entry.sourceAwareDisposition === "raw-left-failure-reclassified").length,
    sourceLeadExistsButDirectTransferBlockedCount: classifications.filter((entry) =>
      entry.sourceAwareDisposition === "source-lead-exists-but-direct-transfer-blocked").length,
    coupledReservoirOrPhenotypeBlockerCount: classifications.filter((entry) =>
      entry.sourceAwareDisposition === "coupled-reservoir-or-phenotype-blocker").length,
    sourceAwareUnblockedCount: classifications.filter((entry) =>
      entry.sourceAwareDisposition !== "coupled-reservoir-or-phenotype-blocker").length,
  };
  const sourceAwareReviewStatus = summary.rawFailedProfileCount > 0
    && summary.sourceAwareUnblockedCount > 0
    ? "source-aware-four-chamber-review-actionable"
    : "source-aware-four-chamber-review-inconclusive";
  return {
    reportId: FOUR_CHAMBER_SOURCE_AWARE_RESIDUAL_REVIEW_REPORT_ID_V1,
    gateId: "fourChamberSourceAwareResidualReviewV1",
    inputs: {
      rawResidualReviewReportId: raw.reportId,
      sourceContractReportId: source.reportId,
      rightOutflowOwnershipReportId: rightOutflow.reportId,
      leftSourceCandidateId: source.summary.leftBestCandidateId,
      rightOutflowLeadId: rightOutflow.summary.bestCandidateId,
    },
    residualClassifications: classifications,
    summary,
    decision: {
      sourceAwareReviewStatus,
      nextAction: sourceAwareReviewStatus === "source-aware-four-chamber-review-actionable"
        ? "Implement a source-aware four-chamber contract that applies phase-aligned source parity and load-conditioned magnitude ownership before changing reservoir, AV-plane, or LandAtrial surfaces."
        : "Do not proceed to runtime or atrial work; gather a more specific source/coupling residual classification first.",
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

function classifyResidual({
  scenarioId,
  profile,
  source,
  leftBest,
  rightOutflow,
}: {
  readonly scenarioId: ScenarioIdV1;
  readonly profile: FourChamberSubsystemResidualReviewReportV1["scenarioResults"][number]["profileResults"][number];
  readonly source: SourceSurfaceContractReportV1;
  readonly leftBest: SourceSurfaceContractReportV1["leftSurfaceResults"][number];
  readonly rightOutflow: RightPreloadOutflowOwnershipReportV1;
}): ResidualClassificationV1 {
  const map = requiredProfileMap(profile.profileId);
  const leftSource = snapshotSourcePoint(leftBest.pointResults.find((point) =>
    point.pointId === map.leftPointId) ?? null);
  const rightSource = snapshotSourcePoint(source.rightSurfaceResult.pointResults.find((point) =>
    point.pointId === map.rightPointId) ?? null);
  const owners: SourceAwareOwnerV1[] = [];
  if (profile.failureReasons.includes("left-surface-not-preserved") && leftSource?.sourceStatus === "pass") {
    owners.push(map.profileId === "afterload-high"
      ? "left-source-load-conditioned-output-reserve"
      : "left-source-phase-aligned-sampling-parity");
  }
  if (
    map.profileId === "preload-low"
    && profile.failureReasons.includes("right-surface-not-preserved")
    && rightOutflow.summary.bestCandidateId === "pv-resistance150"
    && rightOutflow.summary.bestPassCount === 7
  ) {
    owners.push("right-source-pv-outflow-lead-not-directly-transferable");
  }
  if (
    map.profileId === "contractility-low"
    && profile.failureReasons.some((reason) =>
      reason === "right-surface-not-preserved" || reason === "unexpected-accepted-phenotype")
  ) {
    owners.push("right-low-output-phenotype-scope-under-coupling");
  }
  if (profile.failureReasons.includes("persistent-large-reservoir-shuttle")) {
    owners.push("reservoir-repeatability");
  }
  if (profile.failureReasons.includes("left-right-forward-ejection-mismatch")) {
    owners.push("coupled-forward-mismatch");
  }
  const disposition = dispositionFor(owners);
  return {
    scenarioId,
    profileId: profile.profileId,
    rawStatus: profile.status,
    rawFailureReasons: profile.failureReasons,
    rawLeftStatus: profile.leftStatus,
    rawRightStatus: profile.rightStatus,
    leftSource,
    rightSource,
    owners,
    sourceAwareDisposition: disposition,
    recommendedNextContract: recommendedNextContract(disposition),
  };
}

function dispositionFor(owners: readonly SourceAwareOwnerV1[]): ResidualClassificationV1["sourceAwareDisposition"] {
  if (
    owners.some((owner) =>
      owner === "reservoir-repeatability"
      || owner === "right-low-output-phenotype-scope-under-coupling"
      || owner === "coupled-forward-mismatch")
  ) {
    return "coupled-reservoir-or-phenotype-blocker";
  }
  if (owners.includes("right-source-pv-outflow-lead-not-directly-transferable")) {
    return "source-lead-exists-but-direct-transfer-blocked";
  }
  return "raw-left-failure-reclassified";
}

function recommendedNextContract(
  disposition: ResidualClassificationV1["sourceAwareDisposition"],
): string {
  switch (disposition) {
    case "raw-left-failure-reclassified":
      return "Apply phase-aligned source parity and load-conditioned left output reserve in a source-aware four-chamber contract.";
    case "source-lead-exists-but-direct-transfer-blocked":
      return "Integrate right preload-low PV outflow ownership through a source-aware contract; do not directly transfer the standalone PV valve parameters.";
    case "coupled-reservoir-or-phenotype-blocker":
      return "Classify coupled reservoir repeatability and low-output phenotype scope after source-aware status replacement.";
  }
}

function requiredLeftCandidate(
  source: SourceSurfaceContractReportV1,
): SourceSurfaceContractReportV1["leftSurfaceResults"][number] {
  const candidate = source.leftSurfaceResults.find((entry) =>
    entry.candidateId === source.summary.leftBestCandidateId);
  if (candidate == null) throw new Error(`Missing left source candidate ${source.summary.leftBestCandidateId}`);
  return candidate;
}

function snapshotSourcePoint(
  point: SourceSurfaceContractReportV1["leftSurfaceResults"][number]["pointResults"][number] | null,
): SourcePointSnapshotV1 | null {
  if (point == null) return null;
  return {
    pointId: point.pointId,
    sourceStatus: point.sourceStatus,
    sourceFailureReasons: point.sourceFailureReasons,
    acceptedPhenotypeReasons: point.acceptedPhenotypeReasons,
    phaseAlignedShapeParityOk: point.phaseAlignedShapeParityOk,
    outputOk: point.outputOk,
    repeatabilityOk: point.repeatabilityOk,
    dtOutputParityOk: point.dtOutputParityOk,
    morphologyOk: point.morphologyOk,
    forwardEjectionMl: point.forwardEjectionMl,
  };
}

function requiredProfileMap(profileId: FourChamberSubsystemProfileIdV1): ProfileMapV1 {
  const map = PROFILE_MAP.find((entry) => entry.profileId === profileId);
  if (map == null) throw new Error(`Missing profile map ${profileId}`);
  return map;
}
