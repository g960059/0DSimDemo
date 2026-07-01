import {
  runLeftHeartDynamicReserveContractBenchV1,
  type LeftHeartDynamicReservePointResultV1,
  type LeftHeartDynamicReserveVariantResultV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  runRightHeartStrategicSmokeBenchV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";

export const PAIRED_HEART_STRATEGIC_SMOKE_REPORT_ID_V1 =
  "paired-heart-strategic-smoke-report-v1" as const;

type PairedProfileV1 = {
  readonly profileId: string;
  readonly leftPointId: string;
  readonly rightPointId: string;
};

export type PairedHeartStrategicSmokePointResultV1 = {
  readonly profileId: string;
  readonly leftPointId: string;
  readonly rightPointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly leftStatus: LeftHeartDynamicReservePointResultV1["status"] | "missing";
  readonly rightStatus: RightHeartStrategicSmokePointResultV1["status"] | "missing";
  readonly leftAcceptedPhenotypeReasons: readonly string[];
  readonly rightAcceptedPhenotypeReasons: readonly string[];
  readonly failureReasons: readonly string[];
};

export type PairedHeartStrategicSmokeReportV1 = {
  readonly reportId: typeof PAIRED_HEART_STRATEGIC_SMOKE_REPORT_ID_V1;
  readonly gateId: "pairedHeartStrategicSmokeGateV1";
  readonly sourceSurfaces: {
    readonly leftReportId: string;
    readonly leftVariantId: string;
    readonly rightReportId: string;
  };
  readonly pointResults: readonly PairedHeartStrategicSmokePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly leftPassCount: number;
    readonly rightPassCount: number;
    readonly pairedAcceptedPhenotypeCount: number;
  };
  readonly decision: {
    readonly pairedHeartGateStatus: "paired-heart-smoke-pass" | "mixed-signal" | "no-go";
    readonly nextAction: string;
    readonly remainingBlockers: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly circulationCoupling: false;
    readonly morphologyAcceptance: false;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

const PAIRED_PROFILES: readonly PairedProfileV1[] = [
  { profileId: "normal-hr75", leftPointId: "left-heart-normal-hr75", rightPointId: "right-heart-normal-hr75" },
  { profileId: "normal-hr90", leftPointId: "left-heart-normal-hr90", rightPointId: "right-heart-normal-hr90" },
  { profileId: "preload-low", leftPointId: "left-heart-preload-low", rightPointId: "right-heart-preload-low" },
  { profileId: "preload-high", leftPointId: "left-heart-preload-high", rightPointId: "right-heart-preload-high" },
  { profileId: "afterload-high", leftPointId: "left-heart-afterload-high", rightPointId: "right-heart-pulmonary-afterload-high" },
  { profileId: "contractility-low", leftPointId: "left-heart-contractility-low", rightPointId: "right-heart-contractility-low" },
  { profileId: "contractility-high", leftPointId: "left-heart-contractility-high", rightPointId: "right-heart-contractility-high" },
];

export function runPairedHeartStrategicSmokeBenchV1(): PairedHeartStrategicSmokeReportV1 {
  const leftReport = runLeftHeartDynamicReserveContractBenchV1();
  const leftVariant = leftReport.variantResults.find((variant) =>
    variant.variantId === leftReport.decision.bestStrictVariantId
  );
  const rightReport = runRightHeartStrategicSmokeBenchV1();
  if (leftVariant == null) {
    const pointResults = PAIRED_PROFILES.map((profile): PairedHeartStrategicSmokePointResultV1 => ({
      ...profile,
      status: "inconclusive",
      leftStatus: "missing",
      rightStatus: "missing",
      leftAcceptedPhenotypeReasons: [],
      rightAcceptedPhenotypeReasons: [],
      failureReasons: ["missing-left-selected-variant"],
    }));
    return buildReport("missing-left-selected-variant", "missing", "missing", pointResults);
  }
  const pointResults = PAIRED_PROFILES.map((profile) => pairProfile(profile, leftVariant, rightReport.pointResults));
  return buildReport(leftReport.reportId, leftVariant.variantId, rightReport.reportId, pointResults);
}

function pairProfile(
  profile: PairedProfileV1,
  leftVariant: LeftHeartDynamicReserveVariantResultV1,
  rightPoints: readonly RightHeartStrategicSmokePointResultV1[],
): PairedHeartStrategicSmokePointResultV1 {
  const left = leftVariant.pointResults.find((point) => point.pointId === profile.leftPointId);
  const right = rightPoints.find((point) => point.pointId === profile.rightPointId);
  const failureReasons = [
    ...(left == null ? ["missing-left-point"] : left.failureReasons.map((reason) => `left:${reason}`)),
    ...(right == null ? ["missing-right-point"] : right.failureReasons.map((reason) => `right:${reason}`)),
  ];
  return {
    ...profile,
    status: left == null || right == null
      ? "inconclusive"
      : failureReasons.length === 0 ? "pass" : "fail",
    leftStatus: left?.status ?? "missing",
    rightStatus: right?.status ?? "missing",
    leftAcceptedPhenotypeReasons: left?.acceptedPhenotypeReasons ?? [],
    rightAcceptedPhenotypeReasons: right?.acceptedPhenotypeReasons ?? [],
    failureReasons,
  };
}

function buildReport(
  leftReportId: string,
  leftVariantId: string,
  rightReportId: string,
  pointResults: readonly PairedHeartStrategicSmokePointResultV1[],
): PairedHeartStrategicSmokeReportV1 {
  const summary = {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    leftPassCount: pointResults.filter((point) => point.leftStatus === "pass").length,
    rightPassCount: pointResults.filter((point) => point.rightStatus === "pass").length,
    pairedAcceptedPhenotypeCount: pointResults.filter((point) =>
      point.leftAcceptedPhenotypeReasons.length > 0 || point.rightAcceptedPhenotypeReasons.length > 0
    ).length,
  };
  const pairedHeartGateStatus = summary.pass === summary.total
    ? "paired-heart-smoke-pass"
    : summary.pass >= 5 ? "mixed-signal" : "no-go";
  return {
    reportId: PAIRED_HEART_STRATEGIC_SMOKE_REPORT_ID_V1,
    gateId: "pairedHeartStrategicSmokeGateV1",
    sourceSurfaces: { leftReportId, leftVariantId, rightReportId },
    pointResults,
    summary,
    decision: {
      pairedHeartGateStatus,
      nextAction: pairedHeartGateStatus === "paired-heart-smoke-pass"
        ? "Proceed to a coupled circulation-bridge smoke before any four-chamber, AV-plane, or LandAtrial work."
        : "Stay on paired left/right sidecar smoke before circulation coupling.",
      remainingBlockers: pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => `${point.profileId}: ${point.failureReasons.join(",")}`),
    },
    claimBoundary: {
      runtimeWiring: false,
      circulationCoupling: false,
      morphologyAcceptance: false,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}
