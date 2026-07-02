import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const SOURCE_SURFACE_TIME_INTEGRATION_ATTRIBUTION_REPORT_ID_V1 =
  "source-surface-time-integration-attribution-report-v1" as const;

type SideV1 = "left" | "right";

type AttributionClassV1 =
  | "shape-dt-parity"
  | "output-reserve"
  | "repeatability-before-dt-output"
  | "clean-phenotype"
  | "pass";

type ResidualPointV1 = {
  readonly pointId: string;
  readonly side: SideV1;
  readonly sourceCandidateId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly attribution: AttributionClassV1;
  readonly failureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly evidence: {
    readonly finalForwardEjectionMl: number | null;
    readonly previousForwardEjectionMl: number | null;
    readonly dtHalfForwardEjectionMl: number | null;
    readonly finalStrokeVolumeMl: number | null;
    readonly previousStrokeVolumeMl: number | null;
    readonly dtHalfStrokeVolumeMl: number | null;
    readonly finalInflowC1: number | null;
    readonly dtHalfInflowC1: number | null;
    readonly finalPressureC1: number | null;
    readonly dtHalfPressureC1: number | null;
    readonly repeatabilityOutputDeltaMl: number | null;
    readonly dtOutputDeltaMl: number | null;
    readonly dtShapeDelta: number | null;
    readonly finalForwardPeakCount: number | null;
    readonly dtHalfForwardPeakCount: number | null;
    readonly maxValveClosureDrive01: number | null;
    readonly maxOutflowStatefulDrive01: number | null;
    readonly clampCount: number | null;
  };
  readonly nextOwner:
    | "source-shape-time-integration"
    | "source-output-reserve-calibration"
    | "source-settling-repeatability"
    | "phenotype-policy"
    | "none";
};

export type SourceSurfaceTimeIntegrationAttributionReportV1 = {
  readonly reportId: typeof SOURCE_SURFACE_TIME_INTEGRATION_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "sourceSurfaceTimeIntegrationAttributionV1";
  readonly inputs: {
    readonly leftSourceCandidateId: "left-mv-closure075";
    readonly rightSourceCandidateId: "right-lowt30000-safety018";
    readonly sampleRateMultiplier: 2;
    readonly residualPointIds: readonly string[];
  };
  readonly residualPoints: readonly ResidualPointV1[];
  readonly summary: {
    readonly residualPointCount: number;
    readonly passCount: number;
    readonly failCount: number;
    readonly shapeDtParityCount: number;
    readonly outputReserveCount: number;
    readonly repeatabilityBeforeDtOutputCount: number;
    readonly cleanPhenotypeCount: number;
  };
  readonly decision: {
    readonly attributionStatus:
      | "source-time-integration-attribution-classified"
      | "source-time-integration-attribution-incomplete";
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

export function runSourceSurfaceTimeIntegrationAttributionBenchV1():
SourceSurfaceTimeIntegrationAttributionReportV1 {
  const residualPoints = [
    leftResidual("left-heart-preload-low"),
    leftResidual("left-heart-afterload-high"),
    rightResidual("right-heart-preload-low"),
    rightResidual("right-heart-contractility-low"),
  ];
  const summary = summarize(residualPoints);
  const attributionStatus = summary.failCount === summary.residualPointCount - summary.cleanPhenotypeCount
    ? "source-time-integration-attribution-classified"
    : "source-time-integration-attribution-incomplete";
  return {
    reportId: SOURCE_SURFACE_TIME_INTEGRATION_ATTRIBUTION_REPORT_ID_V1,
    gateId: "sourceSurfaceTimeIntegrationAttributionV1",
    inputs: {
      leftSourceCandidateId: "left-mv-closure075",
      rightSourceCandidateId: "right-lowt30000-safety018",
      sampleRateMultiplier: 2,
      residualPointIds: residualPoints.map((point) => point.pointId),
    },
    residualPoints,
    summary,
    decision: {
      attributionStatus,
      nextAction: "Build a source-surface time-integration/output-parity contract that owns shape parity, output reserve, and repeatability separately; do not reopen reservoir gain/compliance scans.",
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

function leftResidual(pointId: string): ResidualPointV1 {
  const params = requiredLeftPoint(pointId);
  const result = runLeftHeartDynamicReservePointV1({
    ...params,
    sampleRateHz: params.sampleRateHz * 2,
    mvSystolicClosureDriveGain01: 0.75,
  });
  const attribution = classifyLeft(result);
  return {
    pointId,
    side: "left",
    sourceCandidateId: "left-mv-closure075",
    status: result.status,
    attribution,
    failureReasons: result.failureReasons,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    evidence: leftEvidence(result),
    nextOwner: nextOwner(attribution),
  };
}

function rightResidual(pointId: string): ResidualPointV1 {
  const base = rightLowOutputProbe(applySelectedRightScaffold(requiredRightPoint(pointId)), 30_000, 0.18);
  const params = { ...base, sampleRateHz: base.sampleRateHz * 2 };
  const result = runRightHeartStrategicPointV1(params);
  const attribution = classifyRight(result);
  return {
    pointId,
    side: "right",
    sourceCandidateId: "right-lowt30000-safety018",
    status: result.status,
    attribution,
    failureReasons: result.failureReasons,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    evidence: rightEvidence(result),
    nextOwner: nextOwner(attribution),
  };
}

function classifyLeft(result: LeftHeartDynamicReservePointResultV1): AttributionClassV1 {
  if (result.acceptedPhenotypeReasons.length > 0) return "clean-phenotype";
  if (result.status === "pass") return "pass";
  if (result.failureReasons.includes("output-aov-ejected-volume-too-low")) return "output-reserve";
  if (result.failureReasons.includes("dt-half-shape-parity-failed")) return "shape-dt-parity";
  return "shape-dt-parity";
}

function classifyRight(result: RightHeartStrategicSmokePointResultV1): AttributionClassV1 {
  if (result.acceptedPhenotypeReasons.length > 0) return "clean-phenotype";
  if (result.status === "pass") return "pass";
  if (result.failureReasons.includes("beat-repeatability-failed")) return "repeatability-before-dt-output";
  if (result.failureReasons.includes("dt-half-shape-parity-failed")) return "shape-dt-parity";
  if (result.failureReasons.includes("dt-half-output-parity-failed")) return "repeatability-before-dt-output";
  if (result.failureReasons.some((reason) => reason.includes("ejected-volume-too-low"))) return "output-reserve";
  return "repeatability-before-dt-output";
}

function nextOwner(attribution: AttributionClassV1): ResidualPointV1["nextOwner"] {
  switch (attribution) {
    case "shape-dt-parity":
      return "source-shape-time-integration";
    case "output-reserve":
      return "source-output-reserve-calibration";
    case "repeatability-before-dt-output":
      return "source-settling-repeatability";
    case "clean-phenotype":
      return "phenotype-policy";
    case "pass":
      return "none";
  }
}

function leftEvidence(result: LeftHeartDynamicReservePointResultV1): ResidualPointV1["evidence"] {
  return {
    finalForwardEjectionMl: result.finalBeat?.aovEjectedVolumeMl ?? null,
    previousForwardEjectionMl: result.previousBeat?.aovEjectedVolumeMl ?? null,
    dtHalfForwardEjectionMl: result.dtHalfFinalBeat?.aovEjectedVolumeMl ?? null,
    finalStrokeVolumeMl: result.finalBeat?.strokeVolumeMl ?? null,
    previousStrokeVolumeMl: result.previousBeat?.strokeVolumeMl ?? null,
    dtHalfStrokeVolumeMl: result.dtHalfFinalBeat?.strokeVolumeMl ?? null,
    finalInflowC1: result.finalBeat?.mvC1ContinuityScore ?? null,
    dtHalfInflowC1: result.dtHalfFinalBeat?.mvC1ContinuityScore ?? null,
    finalPressureC1: result.finalBeat?.lvpC1ContinuityScore ?? null,
    dtHalfPressureC1: result.dtHalfFinalBeat?.lvpC1ContinuityScore ?? null,
    repeatabilityOutputDeltaMl: result.repeatability.aovEjectionDeltaMl,
    dtOutputDeltaMl: result.dtSensitivity.aovEjectionDeltaMl,
    dtShapeDelta: result.dtSensitivity.mvC1ContinuityDelta,
    finalForwardPeakCount: result.finalBeat?.mvForwardPeakCount ?? null,
    dtHalfForwardPeakCount: result.dtHalfFinalBeat?.mvForwardPeakCount ?? null,
    maxValveClosureDrive01: result.finalBeat?.maxMvClosureDrive01 ?? null,
    maxOutflowStatefulDrive01: result.finalBeat?.maxRootOutflowStatefulDrive01 ?? null,
    clampCount: result.finalBeat?.clampCount ?? null,
  };
}

function rightEvidence(result: RightHeartStrategicSmokePointResultV1): ResidualPointV1["evidence"] {
  return {
    finalForwardEjectionMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    previousForwardEjectionMl: result.previousBeat?.pvEjectedVolumeMl ?? null,
    dtHalfForwardEjectionMl: result.dtHalfFinalBeat?.pvEjectedVolumeMl ?? null,
    finalStrokeVolumeMl: result.finalBeat?.strokeVolumeMl ?? null,
    previousStrokeVolumeMl: result.previousBeat?.strokeVolumeMl ?? null,
    dtHalfStrokeVolumeMl: result.dtHalfFinalBeat?.strokeVolumeMl ?? null,
    finalInflowC1: result.finalBeat?.tvC1ContinuityScore ?? null,
    dtHalfInflowC1: result.dtHalfFinalBeat?.tvC1ContinuityScore ?? null,
    finalPressureC1: result.finalBeat?.rvpC1ContinuityScore ?? null,
    dtHalfPressureC1: result.dtHalfFinalBeat?.rvpC1ContinuityScore ?? null,
    repeatabilityOutputDeltaMl: result.repeatability.pvEjectionDeltaMl,
    dtOutputDeltaMl: result.dtSensitivity.pvEjectionDeltaMl,
    dtShapeDelta: result.dtSensitivity.tvC1ContinuityDelta,
    finalForwardPeakCount: result.finalBeat?.tvForwardPeakCount ?? null,
    dtHalfForwardPeakCount: result.dtHalfFinalBeat?.tvForwardPeakCount ?? null,
    maxValveClosureDrive01: result.finalBeat?.maxTvClosureDrive01 ?? null,
    maxOutflowStatefulDrive01: result.finalBeat?.maxPaOutflowStatefulDrive01 ?? null,
    clampCount: result.finalBeat?.clampCount ?? null,
  };
}

function summarize(residualPoints: readonly ResidualPointV1[]): SourceSurfaceTimeIntegrationAttributionReportV1["summary"] {
  return {
    residualPointCount: residualPoints.length,
    passCount: residualPoints.filter((point) => point.status === "pass").length,
    failCount: residualPoints.filter((point) => point.status === "fail").length,
    shapeDtParityCount: residualPoints.filter((point) => point.attribution === "shape-dt-parity").length,
    outputReserveCount: residualPoints.filter((point) => point.attribution === "output-reserve").length,
    repeatabilityBeforeDtOutputCount: residualPoints.filter((point) => point.attribution === "repeatability-before-dt-output").length,
    cleanPhenotypeCount: residualPoints.filter((point) => point.attribution === "clean-phenotype").length,
  };
}

function requiredLeftPoint(pointId: string): LeftHeartSubsystemParamsV2 {
  const point = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .find((candidate) => candidate.fixtureId === pointId);
  if (point == null) throw new Error(`Missing left source point ${pointId}`);
  return point;
}

function requiredRightPoint(pointId: string): RightHeartSubsystemParamsV2 {
  const point = buildRightHeartStrategicEnvelopeV1().find((candidate) => candidate.fixtureId === pointId);
  if (point == null) throw new Error(`Missing right source point ${pointId}`);
  return point;
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

function rightLowOutputProbe(
  point: RightHeartSubsystemParamsV2,
  lowTrefPa: number,
  upperSafetyGainMmHgPerMl: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl / 0.25 * upperSafetyGainMmHgPerMl,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? lowTrefPa : point.rv.fiber.trefPa,
      },
    },
  };
}
