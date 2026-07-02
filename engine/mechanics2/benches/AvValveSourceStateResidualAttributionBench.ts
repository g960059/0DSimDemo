import {
  runAvValveSourceStateContractShadowBenchV1,
  type AvValveSourceStateContractShadowReportV1,
} from "@/engine/mechanics2/benches/AvValveSourceStateContractShadowBench";

export const AV_VALVE_SOURCE_STATE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1 =
  "av-valve-source-state-residual-attribution-report-v1" as const;

type ResidualOwnerV1 =
  | "source-state-rescued"
  | "baseline-valve-replay-residual"
  | "source-state-new-regression"
  | "source-state-partial-improvement";

type ResidualClassV1 =
  | "mv-adverse-gradient-forward-flow"
  | "mv-forward-volume-or-peak-residual"
  | "tv-c1-forward-volume-underfill"
  | "source-state-rescued";

type SourceStateResidualAttributionRowV1 = {
  readonly profileId: string;
  readonly valveSide: "MV" | "TV";
  readonly controlStatus: "pass" | "fail";
  readonly bestStatus: "pass" | "fail";
  readonly controlFailureReasons: readonly string[];
  readonly bestFailureReasons: readonly string[];
  readonly controlForwardVolumeRatio: number;
  readonly bestForwardVolumeRatio: number;
  readonly forwardVolumeRatioDelta: number;
  readonly controlC1ContinuityScore: number;
  readonly bestC1ContinuityScore: number;
  readonly c1ContinuityDelta: number;
  readonly residualOwner: ResidualOwnerV1;
  readonly residualClass: ResidualClassV1;
};

export type AvValveSourceStateResidualAttributionReportV1 = {
  readonly reportId: typeof AV_VALVE_SOURCE_STATE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "avValveSourceStateResidualAttributionV1";
  readonly upstreamSourceStateShadow: {
    readonly requiredStatus: "av-valve-source-state-contract-shadow-mixed";
    readonly observedStatus: AvValveSourceStateContractShadowReportV1["decision"]["avValveSourceStateContractShadowStatus"];
    readonly bestFixedVariantId: string;
    readonly bestFixedPass: number;
    readonly bestFixedCleanShapeCount: number;
  };
  readonly rows: readonly SourceStateResidualAttributionRowV1[];
  readonly summary: {
    readonly total: 14;
    readonly sourceStateRescuedCount: number;
    readonly baselineValveReplayResidualCount: number;
    readonly sourceStateNewRegressionCount: number;
    readonly sourceStatePartialImprovementCount: number;
    readonly mvAdverseGradientForwardFlowCount: number;
    readonly mvForwardVolumeOrPeakResidualCount: number;
    readonly tvC1ForwardVolumeUnderfillCount: number;
  };
  readonly decision: {
    readonly avValveSourceStateResidualAttributionStatus:
      | "av-valve-source-state-residual-attribution-complete"
      | "av-valve-source-state-residual-attribution-inconclusive";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly moreFixedSourceStateVariantSweep: false;
    readonly sourcePressureCommit: false;
    readonly sourceGradientCommit: false;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneGeometry: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runAvValveSourceStateResidualAttributionBenchV1():
AvValveSourceStateResidualAttributionReportV1 {
  const upstream = runAvValveSourceStateContractShadowBenchV1();
  const bestVariantId = upstream.summary.bestFixedVariantId;
  const rows = upstream.rows
    .filter((row) => row.variantId === "current-pressure-control")
    .map((control) => {
      const best = upstream.rows.find((row) =>
        row.profileId === control.profileId
        && row.valveSide === control.valveSide
        && row.variantId === bestVariantId
      );
      if (!best) {
        throw new Error(`Missing best source-state row for ${control.profileId}/${control.valveSide}`);
      }
      return classifyRow(control, best);
    });
  const summary = summarize(rows);
  const status = upstream.decision.avValveSourceStateContractShadowStatus === "av-valve-source-state-contract-shadow-mixed"
    && summary.sourceStateNewRegressionCount === 0
    && summary.baselineValveReplayResidualCount + summary.sourceStateRescuedCount === 14
    ? "av-valve-source-state-residual-attribution-complete"
    : "av-valve-source-state-residual-attribution-inconclusive";
  return {
    reportId: AV_VALVE_SOURCE_STATE_RESIDUAL_ATTRIBUTION_REPORT_ID_V1,
    gateId: "avValveSourceStateResidualAttributionV1",
    upstreamSourceStateShadow: {
      requiredStatus: "av-valve-source-state-contract-shadow-mixed",
      observedStatus: upstream.decision.avValveSourceStateContractShadowStatus,
      bestFixedVariantId: upstream.summary.bestFixedVariantId,
      bestFixedPass: upstream.summary.bestFixedPass,
      bestFixedCleanShapeCount: upstream.summary.bestFixedCleanShapeCount,
    },
    rows,
    summary,
    decision: {
      avValveSourceStateResidualAttributionStatus: status,
      nextAction: status === "av-valve-source-state-residual-attribution-complete"
        ? "Stop fixed source-state variant sweeps. The best source-state replay rescues only one MV volume-parity row while 13/14 residuals are already present in current-pressure valve replay. Next build a true same-step source/valve/chamber transaction that owns MV adverse-gradient flow and TV pressure-flow/area underfill together."
        : "Do not promote source-state ownership. Re-run residual attribution after the source-state shadow report is coherent.",
      blockedClaims: [
        "more-fixed-source-state-variant-sweep",
        "source-pressure-commit",
        "source-gradient-commit",
        "runtime-wiring",
        "morphology-acceptance",
        "AV-plane-geometry",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      moreFixedSourceStateVariantSweep: false,
      sourcePressureCommit: false,
      sourceGradientCommit: false,
      runtimeWiring: false,
      morphologyAcceptance: false,
      AVPlaneGeometry: false,
      LandAtrialUnlock: false,
    },
  };
}

type SourceStateRowV1 = AvValveSourceStateContractShadowReportV1["rows"][number];

function classifyRow(
  control: SourceStateRowV1,
  best: SourceStateRowV1,
): SourceStateResidualAttributionRowV1 {
  const residualOwner = residualOwnerFor(control, best);
  return {
    profileId: control.profileId,
    valveSide: control.valveSide,
    controlStatus: control.status,
    bestStatus: best.status,
    controlFailureReasons: control.failureReasons,
    bestFailureReasons: best.failureReasons,
    controlForwardVolumeRatio: control.shadowToCurrentForwardVolumeRatio,
    bestForwardVolumeRatio: best.shadowToCurrentForwardVolumeRatio,
    forwardVolumeRatioDelta: round(best.shadowToCurrentForwardVolumeRatio - control.shadowToCurrentForwardVolumeRatio),
    controlC1ContinuityScore: control.shadowC1ContinuityScore,
    bestC1ContinuityScore: best.shadowC1ContinuityScore,
    c1ContinuityDelta: round(best.shadowC1ContinuityScore - control.shadowC1ContinuityScore),
    residualOwner,
    residualClass: residualClassFor(best, residualOwner),
  };
}

function residualOwnerFor(control: SourceStateRowV1, best: SourceStateRowV1): ResidualOwnerV1 {
  if (control.status === "fail" && best.status === "pass") return "source-state-rescued";
  const controlReasons = new Set(control.failureReasons);
  const bestReasons = new Set(best.failureReasons);
  const addsNewFailure = [...bestReasons].some((reason) => !controlReasons.has(reason));
  const removesFailure = [...controlReasons].some((reason) => !bestReasons.has(reason));
  if (addsNewFailure) return "source-state-new-regression";
  if (removesFailure) return "source-state-partial-improvement";
  return "baseline-valve-replay-residual";
}

function residualClassFor(
  best: SourceStateRowV1,
  owner: ResidualOwnerV1,
): ResidualClassV1 {
  if (owner === "source-state-rescued") return "source-state-rescued";
  if (best.valveSide === "TV") return "tv-c1-forward-volume-underfill";
  if (best.failureReasons.includes("shadow-adverse-gradient-during-forward-flow")) {
    return "mv-adverse-gradient-forward-flow";
  }
  return "mv-forward-volume-or-peak-residual";
}

function summarize(rows: readonly SourceStateResidualAttributionRowV1[]):
AvValveSourceStateResidualAttributionReportV1["summary"] {
  return {
    total: 14,
    sourceStateRescuedCount: count(rows, "residualOwner", "source-state-rescued"),
    baselineValveReplayResidualCount: count(rows, "residualOwner", "baseline-valve-replay-residual"),
    sourceStateNewRegressionCount: count(rows, "residualOwner", "source-state-new-regression"),
    sourceStatePartialImprovementCount: count(rows, "residualOwner", "source-state-partial-improvement"),
    mvAdverseGradientForwardFlowCount: count(rows, "residualClass", "mv-adverse-gradient-forward-flow"),
    mvForwardVolumeOrPeakResidualCount: count(rows, "residualClass", "mv-forward-volume-or-peak-residual"),
    tvC1ForwardVolumeUnderfillCount: count(rows, "residualClass", "tv-c1-forward-volume-underfill"),
  };
}

function count<TValue extends string>(
  rows: readonly SourceStateResidualAttributionRowV1[],
  key: "residualOwner" | "residualClass",
  value: TValue,
): number {
  return rows.filter((row) => row[key] === value).length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
