import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import { computePhaseAlignedFlowParityV1 } from "@/engine/mechanics2/metrics/PhaseAlignedFlowParityV1";
import {
  runLeftHeartSubsystemV2,
  type LeftHeartSubsystemParamsV2,
  type LeftHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import {
  runRightHeartSubsystemV2,
  type RightHeartSubsystemParamsV2,
  type RightHeartSubsystemSampleV2,
} from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const SOURCE_SURFACE_SAMPLING_PARITY_REPORT_ID_V1 =
  "source-surface-sampling-parity-report-v1" as const;

type PointResultV1 = {
  readonly pointId: string;
  readonly side: "left" | "right";
  readonly residualOwnerBeforeSamplingCheck:
    | "shape-dt-parity"
    | "output-reserve"
    | "repeatability-before-dt-output";
  readonly rawBaseC1: number;
  readonly rawDtHalfC1: number;
  readonly rawDtHalfDelta: number;
  readonly alignedDtHalfC1: number;
  readonly alignedDtHalfDelta: number;
  readonly rawBasePeakCount: number;
  readonly rawDtHalfPeakCount: number;
  readonly alignedDtHalfPeakCount: number;
  readonly rawBaseFlowPeakCount: number;
  readonly rawDtHalfFlowPeakCount: number;
  readonly alignedDtHalfFlowPeakCount: number;
  readonly absoluteDtHalfC1Ok: boolean;
  readonly alignedShapeParityOk: boolean;
  readonly forwardEjectionBaseMl: number;
  readonly forwardEjectionDtHalfMl: number;
  readonly forwardEjectionDeltaMl: number;
  readonly previousForwardEjectionBaseMl: number;
  readonly repeatabilityDeltaMl: number;
  readonly samplingAttribution:
    | "sampling-grid-explains-shape-residual"
    | "sampling-grid-not-owner";
};

export type SourceSurfaceSamplingParityReportV1 = {
  readonly reportId: typeof SOURCE_SURFACE_SAMPLING_PARITY_REPORT_ID_V1;
  readonly gateId: "sourceSurfaceSamplingParityV1";
  readonly points: readonly PointResultV1[];
  readonly summary: {
    readonly pointCount: number;
    readonly samplingGridExplainsShapeResidualCount: number;
    readonly samplingGridNotOwnerCount: number;
    readonly remainingOutputReserveCount: number;
    readonly remainingRepeatabilityCount: number;
  };
  readonly decision: {
    readonly samplingParityStatus:
      | "sampling-parity-shape-owner-found"
      | "sampling-parity-not-owner";
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

export function runSourceSurfaceSamplingParityBenchV1(): SourceSurfaceSamplingParityReportV1 {
  const points = [
    leftPoint("left-heart-preload-low", "shape-dt-parity"),
    leftPoint("left-heart-afterload-high", "output-reserve"),
    rightPoint("right-heart-preload-low", "repeatability-before-dt-output"),
  ];
  const summary = {
    pointCount: points.length,
    samplingGridExplainsShapeResidualCount: points.filter((point) =>
      point.samplingAttribution === "sampling-grid-explains-shape-residual").length,
    samplingGridNotOwnerCount: points.filter((point) => point.samplingAttribution === "sampling-grid-not-owner").length,
    remainingOutputReserveCount: points.filter((point) =>
      point.residualOwnerBeforeSamplingCheck === "output-reserve"
      && point.samplingAttribution === "sampling-grid-not-owner").length,
    remainingRepeatabilityCount: points.filter((point) =>
      point.residualOwnerBeforeSamplingCheck === "repeatability-before-dt-output"
      && point.samplingAttribution === "sampling-grid-not-owner").length,
  };
  const samplingParityStatus = summary.samplingGridExplainsShapeResidualCount > 0
    ? "sampling-parity-shape-owner-found"
    : "sampling-parity-not-owner";
  return {
    reportId: SOURCE_SURFACE_SAMPLING_PARITY_REPORT_ID_V1,
    gateId: "sourceSurfaceSamplingParityV1",
    points,
    summary,
    decision: {
      samplingParityStatus,
      nextAction: "Use phase-aligned shape parity for source-surface dt checks, then address output reserve and right-source repeatability as separate contracts.",
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

function leftPoint(
  pointId: string,
  owner: PointResultV1["residualOwnerBeforeSamplingCheck"],
): PointResultV1 {
  const params0 = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .find((point) => point.fixtureId === pointId);
  if (params0 == null) throw new Error(`Missing left source point ${pointId}`);
  const params = { ...params0, sampleRateHz: params0.sampleRateHz * 2, mvSystolicClosureDriveGain01: 0.75 };
  const base = runLeftHeartSubsystemV2(params);
  const dtHalf = runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
  return summarizePoint({
    pointId,
    side: "left",
    owner,
    baseSamples: base.samples.filter((sample) => sample.beat === params.beats - 2),
    previousBaseSamples: base.samples.filter((sample) => sample.beat === params.beats - 3),
    dtHalfSamples: dtHalf.samples.filter((sample) => sample.beat === params.beats - 2),
    flowSelector: (sample: LeftHeartSubsystemSampleV2) => sample.qMvMlPerSec,
    forwardSelector: (sample: LeftHeartSubsystemSampleV2) => sample.qAovMlPerSec,
  });
}

function rightPoint(
  pointId: string,
  owner: PointResultV1["residualOwnerBeforeSamplingCheck"],
): PointResultV1 {
  const params0 = buildRightHeartStrategicEnvelopeV1().find((point) => point.fixtureId === pointId);
  if (params0 == null) throw new Error(`Missing right source point ${pointId}`);
  const selected = rightLowOutputProbe(applySelectedRightScaffold(params0), 30_000, 0.18);
  const params = { ...selected, sampleRateHz: selected.sampleRateHz * 2 };
  const base = runRightHeartSubsystemV2(params);
  const dtHalf = runRightHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 });
  return summarizePoint({
    pointId,
    side: "right",
    owner,
    baseSamples: base.samples.filter((sample) => sample.beat === params.beats - 2),
    previousBaseSamples: base.samples.filter((sample) => sample.beat === params.beats - 3),
    dtHalfSamples: dtHalf.samples.filter((sample) => sample.beat === params.beats - 2),
    flowSelector: (sample: RightHeartSubsystemSampleV2) => sample.qTvMlPerSec,
    forwardSelector: (sample: RightHeartSubsystemSampleV2) => sample.qPvMlPerSec,
  });
}

function summarizePoint<TSample extends { readonly tSec: number; readonly theta: number }>({
  pointId,
  side,
  owner,
  baseSamples,
  previousBaseSamples,
  dtHalfSamples,
  flowSelector,
  forwardSelector,
}: {
  readonly pointId: string;
  readonly side: "left" | "right";
  readonly owner: PointResultV1["residualOwnerBeforeSamplingCheck"];
  readonly baseSamples: readonly TSample[];
  readonly previousBaseSamples: readonly TSample[];
  readonly dtHalfSamples: readonly TSample[];
  readonly flowSelector: (sample: TSample) => number;
  readonly forwardSelector: (sample: TSample) => number;
}): PointResultV1 {
  const parity = computePhaseAlignedFlowParityV1({
    side,
    baseSamples,
    dtHalfSamples,
    flowSelector,
  });
  if (parity == null) throw new Error(`Too few samples for ${pointId} sampling parity`);
  const forwardEjectionBaseMl = flowIntegral(baseSamples, forwardSelector);
  const forwardEjectionDtHalfMl = flowIntegral(dtHalfSamples, forwardSelector);
  const previousForwardEjectionBaseMl = flowIntegral(previousBaseSamples, forwardSelector);
  const absoluteDtHalfC1Ok = parity.rawDtHalfC1 <= (side === "left" ? 0.38 : 0.48);
  const alignedShapeParityOk = parity.phaseAlignedShapeParityOk;
  const samplingAttribution = owner === "shape-dt-parity" && absoluteDtHalfC1Ok && alignedShapeParityOk
    ? "sampling-grid-explains-shape-residual"
    : "sampling-grid-not-owner";
  return {
    pointId,
    side,
    residualOwnerBeforeSamplingCheck: owner,
    rawBaseC1: round(parity.rawBaseC1),
    rawDtHalfC1: round(parity.rawDtHalfC1),
    rawDtHalfDelta: round(parity.rawDtHalfDelta),
    alignedDtHalfC1: round(parity.alignedDtHalfC1),
    alignedDtHalfDelta: round(parity.alignedDtHalfDelta),
    rawBasePeakCount: parity.rawBaseDominantPeakCount,
    rawDtHalfPeakCount: parity.rawDtHalfDominantPeakCount,
    alignedDtHalfPeakCount: parity.alignedDtHalfDominantPeakCount,
    rawBaseFlowPeakCount: parity.rawBaseFlowPeakCount,
    rawDtHalfFlowPeakCount: parity.rawDtHalfFlowPeakCount,
    alignedDtHalfFlowPeakCount: parity.alignedDtHalfFlowPeakCount,
    absoluteDtHalfC1Ok,
    alignedShapeParityOk,
    forwardEjectionBaseMl: round(forwardEjectionBaseMl),
    forwardEjectionDtHalfMl: round(forwardEjectionDtHalfMl),
    forwardEjectionDeltaMl: round(Math.abs(forwardEjectionBaseMl - forwardEjectionDtHalfMl)),
    previousForwardEjectionBaseMl: round(previousForwardEjectionBaseMl),
    repeatabilityDeltaMl: round(Math.abs(forwardEjectionBaseMl - previousForwardEjectionBaseMl)),
    samplingAttribution,
  };
}

function flowIntegral<TSample extends { readonly tSec: number }>(
  samples: readonly TSample[],
  selector: (sample: TSample) => number,
): number {
  if (samples.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < samples.length; i++) {
    const dtSec = Math.max(samples[i]!.tSec - samples[i - 1]!.tSec, 0);
    sum += Math.max(0, selector(samples[i]!)) * dtSec;
  }
  return sum;
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

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
