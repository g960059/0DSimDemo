import {
  runLaMvAssembledTransactionSurfaceBenchV1,
} from "@/engine/mechanics2/benches/LaMvAssembledTransactionSurfaceBench";

export const LA_MV_ASSEMBLED_RESIDUAL_ATTRIBUTION_REPORT_ID_V1 =
  "la-mv-assembled-residual-attribution-report-v1" as const;

type SurfaceReportV1 = ReturnType<typeof runLaMvAssembledTransactionSurfaceBenchV1>;
type SurfaceRowV1 = SurfaceReportV1["rows"][number];

type ReasonCountV1 = {
  readonly reason: string;
  readonly count: number;
};

type VariantAttributionV1 = {
  readonly variantId: SurfaceRowV1["variantId"];
  readonly totalProfiles: number;
  readonly contractPass: number;
  readonly sourceSurfacePass: number;
  readonly laPvLobeQualityPass: number;
  readonly mvfCleanCount: number;
  readonly mvForwardVolumeParityCount: number;
  readonly aovOutputParityCount: number;
  readonly transactionResidualBoundedCount: number;
  readonly transactionConvergenceCount: number;
  readonly laPvFailureReasonCounts: readonly ReasonCountV1[];
  readonly sourceFailureReasonCounts: readonly ReasonCountV1[];
  readonly ownerClassification:
    | "atrial-geometry-lobe-owner"
    | "mixed-transaction-and-lobe-owner"
    | "source-surface-owner";
};

export type LaMvAssembledResidualAttributionReportV1 = {
  readonly reportId: typeof LA_MV_ASSEMBLED_RESIDUAL_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "laMvAssembledResidualAttributionV1";
  readonly sourceReportId: SurfaceReportV1["reportId"];
  readonly variants: readonly VariantAttributionV1[];
  readonly summary: {
    readonly totalRows: number;
    readonly laPvLobeFailRows: number;
    readonly laPvLobePassRows: number;
    readonly rowsWithCleanFlowVolumeAndMassButLobeFail: number;
    readonly rowsWithBoundedResidualButLobeFail: number;
    readonly rowsWithMvfFailure: number;
    readonly rowsWithTransactionResidualWide: number;
    readonly complianceResidualImprovedWithoutLobeGain: boolean;
  };
  readonly decision: {
    readonly residualOwner:
      | "atrial-geometry-lobe-quality-before-av-plane-enable"
      | "transaction-residual-before-geometry"
      | "source-surface-before-geometry";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimeReadback: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runLaMvAssembledResidualAttributionBenchV1():
LaMvAssembledResidualAttributionReportV1 {
  const surface = runLaMvAssembledTransactionSurfaceBenchV1();
  const rows = surface.rows;
  const variants = surface.variants.map((variant) => {
    const variantRows = rows.filter((row) => row.variantId === variant.variantId);
    return summarizeVariant(variant.variantId, variantRows);
  });
  const laPvLobeFailRows = rows.filter((row) => !row.laPvLobeQualityPass).length;
  const rowsWithCleanFlowVolumeAndMassButLobeFail = rows.filter((row) =>
    !row.laPvLobeQualityPass
    && row.mvForwardVolumeRatio >= 0.78
    && row.mvForwardVolumeRatio <= 1.22
    && row.aovForwardVolumeRatio >= 0.80
    && row.aovForwardVolumeRatio <= 1.20
    && row.maxMassResidualAbsMl <= 0.08
  ).length;
  const rowsWithBoundedResidualButLobeFail = rows.filter((row) =>
    !row.laPvLobeQualityPass
    && row.maxTransactionResidualNormMl <= 0.25
  ).length;
  const fixedPressure = requiredVariant(surface, "fiber-total-fixed-pressure-fp2-reference");
  const highIterationCompliance = requiredVariant(surface, "fiber-total-pv-compliance-fp10-relax025");
  const complianceResidualImprovedWithoutLobeGain =
    highIterationCompliance.maxTransactionResidualNormMl < fixedPressure.maxTransactionResidualNormMl
    && highIterationCompliance.laPvLobeQualityPass <= fixedPressure.laPvLobeQualityPass;
  return {
    reportId: LA_MV_ASSEMBLED_RESIDUAL_ATTRIBUTION_REPORT_ID_V1,
    gateId: "laMvAssembledResidualAttributionV1",
    sourceReportId: surface.reportId,
    variants,
    summary: {
      totalRows: rows.length,
      laPvLobeFailRows,
      laPvLobePassRows: rows.length - laPvLobeFailRows,
      rowsWithCleanFlowVolumeAndMassButLobeFail,
      rowsWithBoundedResidualButLobeFail,
      rowsWithMvfFailure: rows.filter((row) =>
        row.mvForwardPeakCount !== 2 || row.mvC1ContinuityScore > 0.42).length,
      rowsWithTransactionResidualWide: rows.filter((row) =>
        row.failureReasons.includes("transaction-residual-wide")).length,
      complianceResidualImprovedWithoutLobeGain,
    },
    decision: {
      residualOwner: rowsWithCleanFlowVolumeAndMassButLobeFail >= 10
        && complianceResidualImprovedWithoutLobeGain
        ? "atrial-geometry-lobe-quality-before-av-plane-enable"
        : rowsWithBoundedResidualButLobeFail >= 8
          ? "source-surface-before-geometry"
          : "transaction-residual-before-geometry",
      nextAction: "Do not enable AV-plane or runtime yet. First build a geometry-readback-only atrial lobe-quality experiment that can change wall geometry without hidden blood-volume source.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-readback",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimeReadback: false,
      LandAtrialUnlock: false,
    },
  };
}

function summarizeVariant(
  variantId: SurfaceRowV1["variantId"],
  rows: readonly SurfaceRowV1[],
): VariantAttributionV1 {
  const laPvLobeQualityPass = rows.filter((row) => row.laPvLobeQualityPass).length;
  const transactionResidualBoundedCount = rows.filter((row) => row.maxTransactionResidualNormMl <= 0.25).length;
  return {
    variantId,
    totalProfiles: rows.length,
    contractPass: rows.filter((row) => row.contractStatus === "pass").length,
    sourceSurfacePass: rows.filter((row) => row.sourceSurfaceStatus === "pass").length,
    laPvLobeQualityPass,
    mvfCleanCount: rows.filter((row) => row.mvForwardPeakCount === 2 && row.mvC1ContinuityScore <= 0.42).length,
    mvForwardVolumeParityCount: rows.filter((row) =>
      row.mvForwardVolumeRatio >= 0.78 && row.mvForwardVolumeRatio <= 1.22).length,
    aovOutputParityCount: rows.filter((row) =>
      row.aovForwardVolumeRatio >= 0.80 && row.aovForwardVolumeRatio <= 1.20).length,
    transactionResidualBoundedCount,
    transactionConvergenceCount: rows.filter((row) => !row.failureReasons.includes("transaction-not-converged")).length,
    laPvFailureReasonCounts: reasonCounts(rows.flatMap((row) => row.laPvFailureReasons)),
    sourceFailureReasonCounts: reasonCounts(rows.flatMap((row) =>
      row.failureReasons.filter((reason) => reason !== "la-pv-lobe-quality-fail")
    )),
    ownerClassification: laPvLobeQualityPass === 0 && transactionResidualBoundedCount >= 4
      ? "atrial-geometry-lobe-owner"
      : laPvLobeQualityPass > 0
        ? "mixed-transaction-and-lobe-owner"
        : "source-surface-owner",
  };
}

function reasonCounts(reasons: readonly string[]): readonly ReasonCountV1[] {
  const counts = new Map<string, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
}

function requiredVariant(
  report: SurfaceReportV1,
  variantId: SurfaceRowV1["variantId"],
): SurfaceReportV1["variantSummaries"][number] {
  const variant = report.variantSummaries.find((candidate) => candidate.variantId === variantId);
  if (variant == null) throw new Error(`Missing assembled transaction variant: ${variantId}`);
  return variant;
}
