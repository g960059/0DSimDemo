import {
  FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1,
  runFullLeftAVPlaneResidualRoutingBenchV1,
  runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1,
  type FullLeftAVPlaneResidualRoutingVariantIdV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";
import type { LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

export const LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1 =
  "la-effective-cavity-sign-audit-report-v1" as const;

export type LAEffectiveCavitySignAuditClassificationV1 =
  | "no-av-plane-capacity"
  | "counterfactual-only-sign-correct"
  | "applied-sign-correct-too-weak"
  | "applied-sign-correct-with-blood-phase"
  | "av-plane-positive-pressure-source"
  | "hidden-volume-or-nonfinite";

export type LAEffectiveCavitySignAuditRowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly traceRole: string;
  readonly inferredComplianceMlPerMmHg: number | null;

  readonly systolicDeltaPAvMeanMmHg: number;
  readonly systolicDeltaPAvMaxMmHg: number;
  readonly systolicDeltaPAvMinMmHg: number;
  readonly systolicDeltaPAvPositiveFraction: number;

  readonly systolicCounterfactualDeltaPAvMeanMmHg: number;
  readonly systolicCounterfactualDeltaPAvMaxMmHg: number;
  readonly systolicCounterfactualDeltaPAvMinMmHg: number;
  readonly systolicCounterfactualDeltaPAvPositiveFraction: number;

  readonly systolicDeltaVEffMeanMl: number;
  readonly systolicDeltaVEffPositiveFraction: number;
  readonly systolicCounterfactualDeltaVEffMeanMl: number;
  readonly systolicCounterfactualDeltaVEffPositiveFraction: number;

  readonly fixedVolumeProbePressureRiseMmHg: number;
  readonly fixedVolumeProbeMaxPressureReliefMmHg: number;
  readonly fixedVolumeProbePass: boolean;
  readonly fixedVolumeCounterfactualPressureRiseMmHg: number;
  readonly fixedVolumeCounterfactualMaxPressureReliefMmHg: number;
  readonly fixedVolumeCounterfactualPass: boolean;

  readonly maxAvPlaneReferenceCapacityMl: number;
  readonly maxPressureReferenceCapacityMl: number;
  readonly maxEffectiveCavityCapacityMl: number;
  readonly maxHiddenBloodVolumeSourceMl: number;

  readonly xDescentPressureDropMmHg: number;
  readonly reservoirVolumeRiseMl: number;
  readonly vWaveRiseMmHg: number;
  readonly postOpeningPressureDropMmHg: number;
  readonly postOpeningVolumeDropMl: number;
  readonly conduitBelowReservoirChordFraction: number;

  readonly bloodPvPhasePass: boolean;
  readonly bloodPvC1Pass: boolean;
  readonly capacityPvPhasePass: boolean;
  readonly capacityPvC1Pass: boolean;
  readonly sourceSurfacePass: boolean;
  readonly mvfClean: boolean;
  readonly primeWaveformPass: boolean;
  readonly hiddenVolumeClean: boolean;
  readonly mvOpeningTangentJumpDeg: number;

  readonly plottedInOwnerSvg: boolean;
  readonly capacityAxisHiddenByStrictBloodGate: boolean;
  readonly classification: LAEffectiveCavitySignAuditClassificationV1;
  readonly failureReasons: readonly string[];
};

export type LAEffectiveCavitySignAuditReportV1 = {
  readonly reportId: typeof LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1;
  readonly gateId: "laEffectiveCavitySignAuditV1";
  readonly sourceReportId: typeof FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1;
  readonly mode: "diagnostic-only-no-runtime-la-effective-cavity-sign-audit";
  readonly rows: readonly LAEffectiveCavitySignAuditRowV1[];
  readonly summary: {
    readonly totalRows: number;
    readonly appliedFixedVolumeProbePass: number;
    readonly counterfactualFixedVolumeProbePass: number;
    readonly avPlanePositivePressureSourceRows: number;
    readonly hiddenVolumeCleanRows: number;
    readonly appliedSignCorrectRows: number;
    readonly counterfactualSignCorrectRows: number;
    readonly strictBloodPhaseRows: number;
    readonly strictBloodPhaseAndC1Rows: number;
    readonly referenceCapacityStrictBloodPhaseAndC1Rows: number;
    readonly capacityAxisPhaseRows: number;
    readonly plottedOwnerSvgRows: number;
    readonly capacityAxisHiddenRows: number;
    readonly maxAppliedPressureReliefMmHg: number;
    readonly maxCounterfactualPressureReliefMmHg: number;
    readonly maxReferenceCapacityMl: number;
    readonly reviewStatus:
      | "av-plane-positive-pressure-source"
      | "sign-correct-but-blood-loop-not-solved"
      | "blood-loop-candidate-present"
      | "no-capacity-signal";
    readonly nextOwner:
      "accepted-state-la-wall-avplane-mv-pv-residual"
      | "av-plane-sign-semantics";
  };
  readonly claimBoundary: {
    readonly diagnosticOnly: true;
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly bloodVolumePvRemainsAuthoritative: true;
    readonly capacityAxisIsShadowOnly: true;
    readonly hiddenBloodVolumeSource: false;
    readonly AVPlaneEnablement: false;
    readonly LandAtrialUnlock: false;
  };
  readonly decision: {
    readonly blockedClaims: readonly string[];
    readonly interpretation: readonly string[];
    readonly nextRecommendedWork: readonly string[];
  };
};

type TraceRoleV1 =
  | "baseline"
  | "rawTraction"
  | "bestFullResidual"
  | "bestOverall"
  | "bestV6ReferenceCapacity"
  | "bestV8ReferenceCapacityVenous"
  | "bestV9DynamicReferencePressure"
  | "bestV10SeparatedCapacity";

type TraceSpecV1 = {
  readonly traceRole: TraceRoleV1;
  readonly variantId: FullLeftAVPlaneResidualRoutingVariantIdV1;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
};

type RoutingRowV1 = ReturnType<typeof runFullLeftAVPlaneResidualRoutingBenchV1>["rows"][number];

export function runLAEffectiveCavitySignAuditBenchV1(): LAEffectiveCavitySignAuditReportV1 {
  const sourceReport = runFullLeftAVPlaneResidualRoutingBenchV1();
  const rowByVariantProfile = new Map<string, RoutingRowV1>(
    sourceReport.rows.map((row) => [`${row.variantId}::${row.profileId}`, row] as const),
  );
  const panels = runFullLeftAVPlaneResidualRoutingTrajectoryPanelsV1(
    sourceReport.summary.bestFullResidualVariantId,
    sourceReport.summary.bestOverallVariantId,
    sourceReport.summary.bestSmoothCoreVariantId,
    sourceReport.summary.bestV2VariantId,
    sourceReport.summary.bestV3VariantId,
    sourceReport.summary.bestV4VariantId,
    sourceReport.summary.bestV5VariantId,
    sourceReport.summary.bestV6VariantId,
    sourceReport.summary.bestV8VariantId,
    sourceReport.summary.bestV9VariantId,
    sourceReport.summary.bestV10VariantId,
  );
  const rows = panels.flatMap((panel) => {
    const traces = uniqueTraces([
      { traceRole: "baseline", variantId: "baseline-no-avp-compliance-node", samples: panel.baseline },
      { traceRole: "rawTraction", variantId: "raw-traction-reference", samples: panel.rawTraction },
      {
        traceRole: "bestFullResidual",
        variantId: panel.bestFullResidualVariantId,
        samples: panel.bestFullResidual,
      },
      { traceRole: "bestOverall", variantId: panel.bestOverallVariantId, samples: panel.bestOverall },
      {
        traceRole: "bestV6ReferenceCapacity",
        variantId: panel.bestV6VariantId,
        samples: panel.bestV6,
      },
      {
        traceRole: "bestV8ReferenceCapacityVenous",
        variantId: panel.bestV8VariantId,
        samples: panel.bestV8,
      },
      {
        traceRole: "bestV9DynamicReferencePressure",
        variantId: panel.bestV9VariantId,
        samples: panel.bestV9,
      },
      {
        traceRole: "bestV10SeparatedCapacity",
        variantId: panel.bestV10VariantId,
        samples: panel.bestV10,
      },
    ]);
    return traces.map((trace) => {
      const routingRow = rowByVariantProfile.get(`${trace.variantId}::${panel.profileId}`);
      if (!routingRow) throw new Error(`Missing routing row for ${trace.variantId} ${panel.profileId}`);
      return auditRowForTrace(panel.profileId, trace, routingRow);
    });
  });
  const appliedPositive = rows.filter((row) => row.classification === "av-plane-positive-pressure-source").length;
  const strictBloodPhaseAndC1Rows = rows.filter((row) => row.bloodPvPhasePass && row.bloodPvC1Pass).length;
  const referenceCapacityStrictBloodPhaseAndC1Rows = rows.filter((row) =>
    row.maxAvPlaneReferenceCapacityMl > 1e-6 && row.bloodPvPhasePass && row.bloodPvC1Pass
  ).length;
  const capacityAxisHiddenRows = rows.filter((row) => row.capacityAxisHiddenByStrictBloodGate).length;
  const appliedSignCorrectRows = rows.filter((row) =>
    row.maxPressureReferenceCapacityMl > 1e-6
    && row.systolicDeltaPAvMaxMmHg <= 0.05
    && row.systolicDeltaVEffPositiveFraction === 0
  ).length;
  const counterfactualSignCorrectRows = rows.filter((row) =>
    row.maxAvPlaneReferenceCapacityMl > 1e-6
    && row.systolicCounterfactualDeltaPAvMaxMmHg <= 0.05
    && row.systolicCounterfactualDeltaVEffPositiveFraction === 0
  ).length;
  const maxAppliedPressureReliefMmHg = round(Math.max(0, ...rows.map((row) =>
    row.fixedVolumeProbeMaxPressureReliefMmHg
  )));
  const maxCounterfactualPressureReliefMmHg = round(Math.max(0, ...rows.map((row) =>
    row.fixedVolumeCounterfactualMaxPressureReliefMmHg
  )));
  const maxReferenceCapacityMl = round(Math.max(0, ...rows.map((row) => row.maxAvPlaneReferenceCapacityMl)));
  const reviewStatus = appliedPositive > 0
    ? "av-plane-positive-pressure-source"
    : referenceCapacityStrictBloodPhaseAndC1Rows > 0
      ? "blood-loop-candidate-present"
      : maxCounterfactualPressureReliefMmHg > 0.25 || maxAppliedPressureReliefMmHg > 0.25
        ? "sign-correct-but-blood-loop-not-solved"
        : "no-capacity-signal";
  return {
    reportId: LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1,
    gateId: "laEffectiveCavitySignAuditV1",
    sourceReportId: sourceReport.reportId,
    mode: "diagnostic-only-no-runtime-la-effective-cavity-sign-audit",
    rows,
    summary: {
      totalRows: rows.length,
      appliedFixedVolumeProbePass: rows.filter((row) => row.fixedVolumeProbePass).length,
      counterfactualFixedVolumeProbePass: rows.filter((row) => row.fixedVolumeCounterfactualPass).length,
      avPlanePositivePressureSourceRows: appliedPositive,
      hiddenVolumeCleanRows: rows.filter((row) => row.hiddenVolumeClean).length,
      appliedSignCorrectRows,
      counterfactualSignCorrectRows,
      strictBloodPhaseRows: rows.filter((row) => row.bloodPvPhasePass).length,
      strictBloodPhaseAndC1Rows,
      referenceCapacityStrictBloodPhaseAndC1Rows,
      capacityAxisPhaseRows: rows.filter((row) => row.capacityPvPhasePass).length,
      plottedOwnerSvgRows: rows.filter((row) => row.plottedInOwnerSvg).length,
      capacityAxisHiddenRows,
      maxAppliedPressureReliefMmHg,
      maxCounterfactualPressureReliefMmHg,
      maxReferenceCapacityMl,
      reviewStatus,
      nextOwner: reviewStatus === "av-plane-positive-pressure-source"
        ? "av-plane-sign-semantics"
        : "accepted-state-la-wall-avplane-mv-pv-residual",
    },
    claimBoundary: {
      diagnosticOnly: true,
      runtimeWiring: false,
      morphologyAcceptance: false,
      bloodVolumePvRemainsAuthoritative: true,
      capacityAxisIsShadowOnly: true,
      hiddenBloodVolumeSource: false,
      AVPlaneEnablement: false,
      LandAtrialUnlock: false,
    },
    decision: {
      blockedClaims: [
        "runtime-wiring",
        "morphology-acceptance",
        "capacity-axis-pv-acceptance",
        "av-plane-enable",
        "land-atrial-unlock",
      ],
      interpretation: [
        "AV-plane/reference-capacity rows are audited at fixed ledger-owned LA blood volume.",
        "A negative deltaP means the current reference/capacity semantics lowers LA pressure at fixed blood volume.",
        "Capacity-axis or effective-cavity figure-eight traces remain shadow readbacks and are not morphology acceptance.",
        "Rows that only create a V-loop by capacity-axis display or elastance-rise are withheld from the owner SVG.",
      ],
      nextRecommendedWork: [
        "Move the pressure-relief/capacity state inside the accepted-state LA wall / AV-plane / MV / pulmonary venous residual.",
        "Keep strict LA blood-volume PV phase orientation and C1 tangent gates as the visual-review authority.",
        "Do not continue scalar reference-capacity or separated-capacity variants as display-axis routes.",
      ],
    },
  };
}

function auditRowForTrace(
  profileId: FourChamberSubsystemProfileIdV1,
  trace: TraceSpecV1,
  routingRow: RoutingRowV1,
): LAEffectiveCavitySignAuditRowV1 {
  const compliance = inferComplianceMlPerMmHg(trace.samples, routingRow);
  const systolicSamples = systolicDescentSamples(trace.samples);
  const appliedDeltaP = trace.samples.map((sample) =>
    -pressureReliefMmHg(sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl, compliance)
  );
  const counterfactualDeltaP = trace.samples.map((sample) =>
    -pressureReliefMmHg(sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl, compliance)
  );
  const appliedDeltaVEff = trace.samples.map((sample) =>
    sample.laVolumeCoordinateReadback.pressureWallStretchVolumeMl
    - sample.laVolumeCoordinateReadback.bloodVolumeMl
  );
  const counterfactualDeltaVEff = trace.samples.map((sample) =>
    sample.laVolumeCoordinateReadback.counterfactualWallStretchVolumeMl
    - sample.laVolumeCoordinateReadback.bloodVolumeMl
  );
  const systolicIndices = systolicSamples.map((sample) => trace.samples.indexOf(sample));
  const systolicAppliedP = valuesAt(appliedDeltaP, systolicIndices);
  const systolicCounterfactualP = valuesAt(counterfactualDeltaP, systolicIndices);
  const systolicAppliedV = valuesAt(appliedDeltaVEff, systolicIndices);
  const systolicCounterfactualV = valuesAt(counterfactualDeltaVEff, systolicIndices);
  const fixedVolumeProbePressureRiseMmHg = round(Math.max(0, ...appliedDeltaP));
  const fixedVolumeProbeMaxPressureReliefMmHg = round(Math.max(0, ...appliedDeltaP.map((value) => -value)));
  const fixedVolumeCounterfactualPressureRiseMmHg = round(Math.max(0, ...counterfactualDeltaP));
  const fixedVolumeCounterfactualMaxPressureReliefMmHg =
    round(Math.max(0, ...counterfactualDeltaP.map((value) => -value)));
  const maxAvPlaneReferenceCapacityMl = round(Math.max(
    0,
    ...trace.samples.map((sample) => sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl),
  ));
  const maxPressureReferenceCapacityMl = round(Math.max(
    0,
    ...trace.samples.map((sample) => sample.laVolumeCoordinateReadback.pressureReferenceCapacityMl),
  ));
  const maxEffectiveCavityCapacityMl = round(Math.max(
    0,
    ...trace.samples.map((sample) =>
      sample.laVolumeCoordinateReadback.effectiveCavityVolumeMl
      - sample.laVolumeCoordinateReadback.bloodVolumeMl
    ),
  ));
  const maxHiddenBloodVolumeSourceMl = round(Math.max(
    0,
    ...trace.samples.map((sample) => Math.abs(sample.laVolumeCoordinateReadback.hiddenBloodVolumeSourceMl)),
  ));
  const plottedInOwnerSvg = routingRow.phaseOrientedPvPass && routingRow.phaseC1Pass;
  const capacityAxisHiddenByStrictBloodGate =
    routingRow.capacityAxisPhaseOrientedPvPass && !plottedInOwnerSvg;
  const failureReasons: string[] = [];
  if (maxHiddenBloodVolumeSourceMl > 1e-6 || !routingRow.hiddenVolumeClean) {
    failureReasons.push("hidden-volume-not-clean");
  }
  if (fixedVolumeProbePressureRiseMmHg > 0.05) failureReasons.push("applied-av-plane-raises-pressure");
  if (fixedVolumeCounterfactualPressureRiseMmHg > 0.05) {
    failureReasons.push("counterfactual-av-plane-raises-pressure");
  }
  if (!routingRow.phaseOrientedPvPass) failureReasons.push("strict-blood-volume-phase-fails");
  if (!routingRow.phaseC1Pass) failureReasons.push("strict-blood-volume-c1-fails");
  if (capacityAxisHiddenByStrictBloodGate) failureReasons.push("capacity-axis-hidden-by-strict-blood-gate");
  const classification = classifyRow({
    maxAvPlaneReferenceCapacityMl,
    maxPressureReferenceCapacityMl,
    fixedVolumeProbePressureRiseMmHg,
    fixedVolumeCounterfactualPressureRiseMmHg,
    fixedVolumeProbeMaxPressureReliefMmHg,
    fixedVolumeCounterfactualMaxPressureReliefMmHg,
    maxHiddenBloodVolumeSourceMl,
    bloodPass: plottedInOwnerSvg,
  });
  return {
    profileId,
    variantId: trace.variantId,
    traceRole: trace.traceRole,
    inferredComplianceMlPerMmHg: compliance == null ? null : round(compliance),
    systolicDeltaPAvMeanMmHg: round(mean(systolicAppliedP)),
    systolicDeltaPAvMaxMmHg: round(Math.max(...systolicAppliedP, 0)),
    systolicDeltaPAvMinMmHg: round(Math.min(...systolicAppliedP, 0)),
    systolicDeltaPAvPositiveFraction: round(fraction(systolicAppliedP, (value) => value > 0.05)),
    systolicCounterfactualDeltaPAvMeanMmHg: round(mean(systolicCounterfactualP)),
    systolicCounterfactualDeltaPAvMaxMmHg: round(Math.max(...systolicCounterfactualP, 0)),
    systolicCounterfactualDeltaPAvMinMmHg: round(Math.min(...systolicCounterfactualP, 0)),
    systolicCounterfactualDeltaPAvPositiveFraction:
      round(fraction(systolicCounterfactualP, (value) => value > 0.05)),
    systolicDeltaVEffMeanMl: round(mean(systolicAppliedV)),
    systolicDeltaVEffPositiveFraction: round(fraction(systolicAppliedV, (value) => value > 1e-6)),
    systolicCounterfactualDeltaVEffMeanMl: round(mean(systolicCounterfactualV)),
    systolicCounterfactualDeltaVEffPositiveFraction:
      round(fraction(systolicCounterfactualV, (value) => value > 1e-6)),
    fixedVolumeProbePressureRiseMmHg,
    fixedVolumeProbeMaxPressureReliefMmHg,
    fixedVolumeProbePass: fixedVolumeProbePressureRiseMmHg <= 0.05,
    fixedVolumeCounterfactualPressureRiseMmHg,
    fixedVolumeCounterfactualMaxPressureReliefMmHg,
    fixedVolumeCounterfactualPass: fixedVolumeCounterfactualPressureRiseMmHg <= 0.05,
    maxAvPlaneReferenceCapacityMl,
    maxPressureReferenceCapacityMl,
    maxEffectiveCavityCapacityMl,
    maxHiddenBloodVolumeSourceMl,
    xDescentPressureDropMmHg: routingRow.phasePv.systolicXDescentPressureDropMmHg,
    reservoirVolumeRiseMl: routingRow.phasePv.systolicReservoirVolumeRiseMl,
    vWaveRiseMmHg: routingRow.phasePv.systolicVWavePressureRiseMmHg,
    postOpeningPressureDropMmHg: routingRow.phasePv.postOpeningPressureDropMmHg,
    postOpeningVolumeDropMl: routingRow.phasePv.postOpeningVolumeDropMl,
    conduitBelowReservoirChordFraction: routingRow.phasePv.conduitBelowReservoirChordFraction,
    bloodPvPhasePass: routingRow.phaseOrientedPvPass,
    bloodPvC1Pass: routingRow.phaseC1Pass,
    capacityPvPhasePass: routingRow.capacityAxisPhaseOrientedPvPass,
    capacityPvC1Pass: routingRow.capacityAxisPhaseC1Pass,
    sourceSurfacePass: routingRow.sourceSurfacePass,
    mvfClean: routingRow.mvfClean,
    primeWaveformPass: routingRow.primeWaveformPass,
    hiddenVolumeClean: routingRow.hiddenVolumeClean,
    mvOpeningTangentJumpDeg: routingRow.phasePv.mvOpeningTangentAngleJumpDeg,
    plottedInOwnerSvg,
    capacityAxisHiddenByStrictBloodGate,
    classification,
    failureReasons,
  };
}

function classifyRow(input: {
  readonly maxAvPlaneReferenceCapacityMl: number;
  readonly maxPressureReferenceCapacityMl: number;
  readonly fixedVolumeProbePressureRiseMmHg: number;
  readonly fixedVolumeCounterfactualPressureRiseMmHg: number;
  readonly fixedVolumeProbeMaxPressureReliefMmHg: number;
  readonly fixedVolumeCounterfactualMaxPressureReliefMmHg: number;
  readonly maxHiddenBloodVolumeSourceMl: number;
  readonly bloodPass: boolean;
}): LAEffectiveCavitySignAuditClassificationV1 {
  if (input.maxHiddenBloodVolumeSourceMl > 1e-6) return "hidden-volume-or-nonfinite";
  if (input.fixedVolumeProbePressureRiseMmHg > 0.05 || input.fixedVolumeCounterfactualPressureRiseMmHg > 0.05) {
    return "av-plane-positive-pressure-source";
  }
  if (input.bloodPass && input.fixedVolumeProbeMaxPressureReliefMmHg > 0.25) {
    return "applied-sign-correct-with-blood-phase";
  }
  if (input.maxPressureReferenceCapacityMl > 1e-6 && input.fixedVolumeProbeMaxPressureReliefMmHg > 0.25) {
    return "applied-sign-correct-too-weak";
  }
  if (input.maxAvPlaneReferenceCapacityMl > 1e-6 && input.fixedVolumeCounterfactualMaxPressureReliefMmHg > 0.25) {
    return "counterfactual-only-sign-correct";
  }
  return "no-av-plane-capacity";
}

function uniqueTraces(traces: readonly TraceSpecV1[]): readonly TraceSpecV1[] {
  const seen = new Set<string>();
  const unique: TraceSpecV1[] = [];
  for (const trace of traces) {
    const key = trace.variantId;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trace);
  }
  return unique;
}

function inferComplianceMlPerMmHg(
  samples: readonly LeftHeartSubsystemSampleV2[],
  row: RoutingRowV1,
): number | null {
  if (row.maxPressureReferenceCapacityMl > 1e-6 && row.maxAppliedFixedBloodPressureReliefMmHg > 1e-6) {
    return row.maxPressureReferenceCapacityMl / row.maxAppliedFixedBloodPressureReliefMmHg;
  }
  if (row.maxReferenceCapacityShiftMl > 1e-6 && row.maxCounterfactualFixedBloodPressureReliefMmHg > 1e-6) {
    return row.maxReferenceCapacityShiftMl / row.maxCounterfactualFixedBloodPressureReliefMmHg;
  }
  const capacity = Math.max(
    0,
    ...samples.map((sample) => sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl),
  );
  if (capacity <= 1e-6) return null;
  return null;
}

function pressureReliefMmHg(capacityMl: number, complianceMlPerMmHg: number | null): number {
  if (complianceMlPerMmHg == null || complianceMlPerMmHg <= 0) return 0;
  return Math.max(0, capacityMl) / complianceMlPerMmHg;
}

function systolicDescentSamples(samples: readonly LeftHeartSubsystemSampleV2[]): readonly LeftHeartSubsystemSampleV2[] {
  const selected = samples.filter((sample) =>
    sample.theta >= 0.03
    && sample.theta <= 0.52
    && sample.mvOpen01 < 0.25
    && (
      sample.aovOpen01 > 0.05
      || sample.laVolumeCoordinateReadback.avPlaneReferenceCapacityMl > 0.05
      || sample.laAVPlaneWorkCoordinateZDotNormPerSec > 0.005
    )
  );
  if (selected.length > 0) return selected;
  return samples.filter((sample) => sample.theta >= 0.03 && sample.theta <= 0.52 && sample.mvOpen01 < 0.25);
}

function valuesAt(values: readonly number[], indices: readonly number[]): readonly number[] {
  return indices.map((index) => values[index]).filter((value): value is number => Number.isFinite(value));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fraction(values: readonly number[], predicate: (value: number) => boolean): number {
  if (values.length === 0) return 0;
  return values.filter(predicate).length / values.length;
}

function round(value: number, digits = 6): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
