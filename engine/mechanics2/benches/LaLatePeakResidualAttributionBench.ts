import {
  runDecomposedLaPressureContractBenchV1,
} from "@/engine/mechanics2/benches/DecomposedLaPressureContractBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const LA_LATE_PEAK_RESIDUAL_ATTRIBUTION_REPORT_ID_V1 =
  "la-late-peak-residual-attribution-report-v1" as const;

type LaLatePeakResidualClassV1 =
  | "current-late-window-boundary-tail-dominant"
  | "decomposed-a-wave-late-pulse-present"
  | "pressure-parity-clean-despite-phase-label"
  | "unclassified-late-peak-residual";

type LaLatePeakResidualAttributionRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly sourceStatus: "fail";
  readonly sourceFailureReasons: readonly string[];
  readonly currentLatePeakTheta: number;
  readonly decomposedLatePeakTheta: number;
  readonly decomposedLateToCurrentLateDeltaTheta: number;
  readonly decomposedMeanAbsDeltaMmHg: number;
  readonly decomposedImprovementFraction: number;
  readonly classifications: readonly LaLatePeakResidualClassV1[];
};

export type LaLatePeakResidualAttributionReportV1 = {
  readonly reportId: typeof LA_LATE_PEAK_RESIDUAL_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "laLatePeakResidualAttributionV1";
  readonly upstreamDecomposedContract: {
    readonly requiredStatus: "decomposed-la-pressure-contract-focused-shadow-signal";
    readonly observedStatus: ReturnType<
      typeof runDecomposedLaPressureContractBenchV1
    >["decision"]["decomposedLaPressureContractStatus"];
    readonly totalPass: number;
    readonly focusedResidualPass: number;
  };
  readonly attributionMode: "decomposed-LA-nonfocused-late-peak-residuals";
  readonly rows: readonly LaLatePeakResidualAttributionRowV1[];
  readonly summary: {
    readonly residualCount: number;
    readonly classifiedCount: number;
    readonly boundaryTailDominantCount: number;
    readonly pressureParityCleanCount: number;
  };
  readonly decision: {
    readonly laLatePeakResidualAttributionStatus:
      | "la-late-peak-residual-attribution-signal"
      | "la-late-peak-residual-attribution-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly sourceSurfaceSubstitution: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly pistonVolumeMode: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runLaLatePeakResidualAttributionBenchV1(): LaLatePeakResidualAttributionReportV1 {
  const upstream = runDecomposedLaPressureContractBenchV1();
  const rows = upstream.rows
    .filter((row) => row.status === "fail" && row.failureReasons.includes("decomposed-late-peak-phase-offset"))
    .map((row): LaLatePeakResidualAttributionRowV1 => {
      const classifications = classificationsFor({
        currentLatePeakTheta: row.currentLatePeakTheta,
        decomposedLatePeakTheta: row.decomposedLatePeakTheta,
        decomposedMeanAbsDeltaMmHg: row.decomposedMeanAbsDeltaMmHg,
        decomposedImprovementFraction: row.decomposedImprovementFraction,
      });
      return {
        profileId: row.profileId,
        sourceStatus: "fail",
        sourceFailureReasons: row.failureReasons,
        currentLatePeakTheta: row.currentLatePeakTheta,
        decomposedLatePeakTheta: row.decomposedLatePeakTheta,
        decomposedLateToCurrentLateDeltaTheta: row.decomposedLateToCurrentLateDeltaTheta,
        decomposedMeanAbsDeltaMmHg: row.decomposedMeanAbsDeltaMmHg,
        decomposedImprovementFraction: row.decomposedImprovementFraction,
        classifications,
      };
    });
  const classifiedCount = rows.filter((row) =>
    !row.classifications.includes("unclassified-late-peak-residual")
  ).length;
  const upstreamOk =
    upstream.decision.decomposedLaPressureContractStatus
    === "decomposed-la-pressure-contract-focused-shadow-signal";
  const hasSignal = upstreamOk && rows.length === 3 && classifiedCount === rows.length;
  return {
    reportId: LA_LATE_PEAK_RESIDUAL_ATTRIBUTION_REPORT_ID_V1,
    gateId: "laLatePeakResidualAttributionV1",
    upstreamDecomposedContract: {
      requiredStatus: "decomposed-la-pressure-contract-focused-shadow-signal",
      observedStatus: upstream.decision.decomposedLaPressureContractStatus,
      totalPass: upstream.summary.pass,
      focusedResidualPass: upstream.summary.focusedResidualPass,
    },
    attributionMode: "decomposed-LA-nonfocused-late-peak-residuals",
    rows,
    summary: {
      residualCount: rows.length,
      classifiedCount,
      boundaryTailDominantCount: rows.filter((row) =>
        row.classifications.includes("current-late-window-boundary-tail-dominant")
      ).length,
      pressureParityCleanCount: rows.filter((row) =>
        row.classifications.includes("pressure-parity-clean-despite-phase-label")
      ).length,
    },
    decision: {
      laLatePeakResidualAttributionStatus: hasSignal
        ? "la-late-peak-residual-attribution-signal"
        : "la-late-peak-residual-attribution-blocked",
      nextAction: hasSignal
        ? "Proceed only to a shadow source-surface substitution smoke using the decomposed LA pressure contract. Keep runtime wiring, morphology acceptance, AV-plane, and LandAtrial locked."
        : "Keep source-surface substitution blocked and refine the non-focused late-peak residual classification.",
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "AV-plane-piston-volume-mode",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      sourceSurfaceSubstitution: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      pistonVolumeMode: false,
      LandAtrialUnlock: false,
    },
  };
}

function classificationsFor(input: {
  readonly currentLatePeakTheta: number;
  readonly decomposedLatePeakTheta: number;
  readonly decomposedMeanAbsDeltaMmHg: number;
  readonly decomposedImprovementFraction: number;
}): readonly LaLatePeakResidualClassV1[] {
  const classes: LaLatePeakResidualClassV1[] = [];
  if (input.currentLatePeakTheta <= 0.75) {
    classes.push("current-late-window-boundary-tail-dominant");
  }
  if (input.decomposedLatePeakTheta >= 0.84 && input.decomposedLatePeakTheta <= 0.89) {
    classes.push("decomposed-a-wave-late-pulse-present");
  }
  if (input.decomposedMeanAbsDeltaMmHg <= 0.35 && input.decomposedImprovementFraction >= 0.95) {
    classes.push("pressure-parity-clean-despite-phase-label");
  }
  if (classes.length === 0) classes.push("unclassified-late-peak-residual");
  return classes;
}
