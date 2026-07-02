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

export const SOURCE_SURFACE_CONTRACT_REPORT_ID_V1 =
  "source-surface-contract-report-v1" as const;

type SideV1 = "left" | "right";

type SourceSurfaceContractPointV1 = {
  readonly pointId: string;
  readonly side: SideV1;
  readonly sourceStatus: "pass" | "fail" | "inconclusive";
  readonly sourceFailureReasons: readonly string[];
  readonly rawFailureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly phaseAlignedShapeParityOk: boolean;
  readonly rawShapeParityOk: boolean;
  readonly outputOk: boolean;
  readonly repeatabilityOk: boolean;
  readonly dtOutputParityOk: boolean;
  readonly morphologyOk: boolean;
  readonly clampFree: boolean;
  readonly safetyWorkBounded: boolean;
  readonly forwardEjectionMl: number | null;
  readonly previousForwardEjectionMl: number | null;
  readonly dtHalfForwardEjectionMl: number | null;
  readonly forwardEjectionRepeatabilityDeltaMl: number | null;
  readonly forwardEjectionDtHalfDeltaMl: number | null;
  readonly rawBaseC1: number | null;
  readonly rawDtHalfC1: number | null;
  readonly rawDtHalfDelta: number | null;
  readonly alignedDtHalfC1: number | null;
  readonly alignedDtHalfDelta: number | null;
  readonly rawBaseDominantPeakCount: number | null;
  readonly rawDtHalfDominantPeakCount: number | null;
  readonly alignedDtHalfDominantPeakCount: number | null;
  readonly rawBaseFlowPeakCount: number | null;
  readonly rawDtHalfFlowPeakCount: number | null;
  readonly alignedDtHalfFlowPeakCount: number | null;
};

type LeftSurfaceCandidateIdV1 =
  | "left-reference-phase-aligned"
  | "left-afterload-active-reserve103"
  | "left-afterload-pressure-reserve102";

type LeftSurfaceResultV1 = {
  readonly candidateId: LeftSurfaceCandidateIdV1;
  readonly description: string;
  readonly intervention: {
    readonly sourceSampleRateMultiplier: 2;
    readonly mvSystolicClosureDriveGain01: 0.75;
    readonly highAfterloadDetection:
      | "none"
      | "root-downstream>=80-or-root-resistance>=0.8";
    readonly highAfterloadLvTrefMultiplier: number;
    readonly highAfterloadLvPressureScaleMultiplier: number;
  };
  readonly pointResults: readonly SourceSurfaceContractPointV1[];
  readonly summary: SourceSurfaceSummaryV1;
};

type RightSurfaceResultV1 = {
  readonly candidateId: "right-reference-phase-aligned";
  readonly description: string;
  readonly intervention: {
    readonly sourceSampleRateMultiplier: 2;
    readonly rvLowOutputTrefPa: 30000;
    readonly rvUpperSafetyGainMmHgPerMl: 0.18;
  };
  readonly pointResults: readonly SourceSurfaceContractPointV1[];
  readonly summary: SourceSurfaceSummaryV1;
};

type RightPreloadSettlingProbeV1 = {
  readonly pointId: "right-heart-preload-low";
  readonly candidateId: "right-preload-low-long-epoch-settling-probe";
  readonly beatsReviewed: readonly number[];
  readonly beatResults: readonly {
    readonly beats: number;
    readonly status: RightHeartStrategicSmokePointResultV1["status"];
    readonly failureReasons: readonly string[];
    readonly forwardEjectionMl: number | null;
    readonly previousForwardEjectionMl: number | null;
    readonly dtHalfForwardEjectionMl: number | null;
    readonly repeatabilityDeltaMl: number | null;
    readonly dtHalfOutputDeltaMl: number | null;
    readonly tvC1ContinuityScore: number | null;
    readonly tvShapeDelta: number | null;
  }[];
  readonly classification:
    | "persistent-right-source-settling-repeatability-blocker"
    | "short-warmup-owner"
    | "inconclusive";
};

type SourceSurfaceSummaryV1 = {
  readonly total: number;
  readonly pass: number;
  readonly fail: number;
  readonly inconclusive: number;
  readonly phaseAlignedShapeParityOkCount: number;
  readonly outputOkCount: number;
  readonly repeatabilityOkCount: number;
  readonly dtOutputParityOkCount: number;
  readonly morphologyOkCount: number;
  readonly phenotypeAcceptedCount: number;
};

export type SourceSurfaceContractReportV1 = {
  readonly reportId: typeof SOURCE_SURFACE_CONTRACT_REPORT_ID_V1;
  readonly gateId: "sourceSurfaceContractV1";
  readonly inputs: {
    readonly leftBaselineVariantId: "active-length-mv-closure-stateful-root08";
    readonly rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly sourceSampleRateMultiplier: 2;
    readonly phaseAlignedShapeParity: true;
  };
  readonly leftSurfaceResults: readonly LeftSurfaceResultV1[];
  readonly rightSurfaceResult: RightSurfaceResultV1;
  readonly rightPreloadSettlingProbe: RightPreloadSettlingProbeV1;
  readonly summary: {
    readonly leftBestCandidateId: LeftSurfaceCandidateIdV1;
    readonly leftBestPassCount: number;
    readonly leftFullPassCandidateCount: number;
    readonly rightPassCount: number;
    readonly rightFullPass: boolean;
    readonly rightPreloadSettlingBlocker: boolean;
  };
  readonly decision: {
    readonly sourceContractStatus:
      | "left-contract-pass-right-source-blocked"
      | "source-contract-pass"
      | "source-contract-blocked";
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

type LeftCandidateSpecV1 = {
  readonly candidateId: LeftSurfaceCandidateIdV1;
  readonly description: string;
  readonly highAfterloadLvTrefMultiplier: number;
  readonly highAfterloadLvPressureScaleMultiplier: number;
};

const LEFT_CANDIDATES: readonly LeftCandidateSpecV1[] = [
  {
    candidateId: "left-reference-phase-aligned",
    description: "Selected left source surface with phase-aligned shape parity only.",
    highAfterloadLvTrefMultiplier: 1,
    highAfterloadLvPressureScaleMultiplier: 1,
  },
  {
    candidateId: "left-afterload-active-reserve103",
    description: "Diagnostic load-conditioned active reserve for high-afterload output parity.",
    highAfterloadLvTrefMultiplier: 1.03,
    highAfterloadLvPressureScaleMultiplier: 1,
  },
  {
    candidateId: "left-afterload-pressure-reserve102",
    description: "Diagnostic load-conditioned pressure reserve for high-afterload output parity.",
    highAfterloadLvTrefMultiplier: 1,
    highAfterloadLvPressureScaleMultiplier: 1.02,
  },
];

export function runSourceSurfaceContractBenchV1(): SourceSurfaceContractReportV1 {
  const leftSurfaceResults = LEFT_CANDIDATES.map(runLeftCandidate).sort(leftSort);
  const rightSurfaceResult = runRightReference();
  const rightPreloadSettlingProbe = runRightPreloadSettlingProbe();
  const leftBest = leftSurfaceResults[0]!;
  const leftFullPassCandidateCount = leftSurfaceResults.filter((candidate) =>
    candidate.summary.pass === candidate.summary.total).length;
  const rightFullPass = rightSurfaceResult.summary.pass === rightSurfaceResult.summary.total;
  const rightPreloadSettlingBlocker =
    rightPreloadSettlingProbe.classification === "persistent-right-source-settling-repeatability-blocker";
  const sourceContractStatus = leftFullPassCandidateCount > 0 && rightFullPass
    ? "source-contract-pass"
    : leftFullPassCandidateCount > 0 && rightPreloadSettlingBlocker
      ? "left-contract-pass-right-source-blocked"
      : "source-contract-blocked";
  return {
    reportId: SOURCE_SURFACE_CONTRACT_REPORT_ID_V1,
    gateId: "sourceSurfaceContractV1",
    inputs: {
      leftBaselineVariantId: "active-length-mv-closure-stateful-root08",
      rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      sourceSampleRateMultiplier: 2,
      phaseAlignedShapeParity: true,
    },
    leftSurfaceResults,
    rightSurfaceResult,
    rightPreloadSettlingProbe,
    summary: {
      leftBestCandidateId: leftBest.candidateId,
      leftBestPassCount: leftBest.summary.pass,
      leftFullPassCandidateCount,
      rightPassCount: rightSurfaceResult.summary.pass,
      rightFullPass,
      rightPreloadSettlingBlocker,
    },
    decision: {
      sourceContractStatus,
      nextAction: sourceContractStatus === "left-contract-pass-right-source-blocked"
        ? "Keep phase-aligned source shape parity and left load-conditioned reserve as source-contract leads; focus next on right preload-low settling/repeatability before returning to four-chamber or runtime work."
        : sourceContractStatus === "source-contract-pass"
          ? "Rerun four-chamber subsystem residual review with the source contract before any runtime, AV-plane, or LandAtrial work."
          : "Do not widen reservoir tuning or source parameter scans; classify source-surface blockers before further assembly work.",
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

function runLeftCandidate(spec: LeftCandidateSpecV1): LeftSurfaceResultV1 {
  const pointResults = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .map((point) => leftSourceParams(point, spec))
    .map(leftContractPoint);
  return {
    candidateId: spec.candidateId,
    description: spec.description,
    intervention: {
      sourceSampleRateMultiplier: 2,
      mvSystolicClosureDriveGain01: 0.75,
      highAfterloadDetection: spec.candidateId === "left-reference-phase-aligned"
        ? "none"
        : "root-downstream>=80-or-root-resistance>=0.8",
      highAfterloadLvTrefMultiplier: spec.highAfterloadLvTrefMultiplier,
      highAfterloadLvPressureScaleMultiplier: spec.highAfterloadLvPressureScaleMultiplier,
    },
    pointResults,
    summary: summarize(pointResults),
  };
}

function runRightReference(): RightSurfaceResultV1 {
  const pointResults = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map((point) => rightLowOutputProbe(point, 30_000, 0.18))
    .map((point) => ({ ...point, sampleRateHz: point.sampleRateHz * 2 }))
    .map(rightContractPoint);
  return {
    candidateId: "right-reference-phase-aligned",
    description: "Selected right source surface with phase-aligned shape parity.",
    intervention: {
      sourceSampleRateMultiplier: 2,
      rvLowOutputTrefPa: 30000,
      rvUpperSafetyGainMmHgPerMl: 0.18,
    },
    pointResults,
    summary: summarize(pointResults),
  };
}

function runRightPreloadSettlingProbe(): RightPreloadSettlingProbeV1 {
  const point0 = buildRightHeartStrategicEnvelopeV1()
    .find((point) => point.fixtureId === "right-heart-preload-low");
  if (point0 == null) throw new Error("Missing right-heart-preload-low");
  const base = {
    ...rightLowOutputProbe(applySelectedRightScaffold(point0), 30_000, 0.18),
    sampleRateHz: point0.sampleRateHz * 2,
  };
  const beatsReviewed = [base.beats, 20, 32, 56] as const;
  const beatResults = beatsReviewed.map((beats) => {
    const result = runRightHeartStrategicPointV1({ ...base, beats });
    return {
      beats,
      status: result.status,
      failureReasons: result.failureReasons,
      forwardEjectionMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
      previousForwardEjectionMl: result.previousBeat?.pvEjectedVolumeMl ?? null,
      dtHalfForwardEjectionMl: result.dtHalfFinalBeat?.pvEjectedVolumeMl ?? null,
      repeatabilityDeltaMl: result.repeatability.pvEjectionDeltaMl,
      dtHalfOutputDeltaMl: result.dtSensitivity.pvEjectionDeltaMl,
      tvC1ContinuityScore: result.finalBeat?.tvC1ContinuityScore ?? null,
      tvShapeDelta: result.dtSensitivity.tvC1ContinuityDelta,
    };
  });
  const finalProbe = beatResults.at(-1);
  const classification =
    beatResults.every((result) => result.status === "fail")
    && finalProbe != null
    && (finalProbe.repeatabilityDeltaMl ?? 0) > 16
      ? "persistent-right-source-settling-repeatability-blocker"
      : beatResults[0]?.status === "fail" && beatResults.some((result) => result.status === "pass")
        ? "short-warmup-owner"
        : "inconclusive";
  return {
    pointId: "right-heart-preload-low",
    candidateId: "right-preload-low-long-epoch-settling-probe",
    beatsReviewed,
    beatResults,
    classification,
  };
}

function leftSourceParams(
  point: LeftHeartSubsystemParamsV2,
  spec: LeftCandidateSpecV1,
): LeftHeartSubsystemParamsV2 {
  const highAfterload =
    (point.rootDownstreamPressureMmHg ?? 0) >= 80
    || (point.rootOutResistanceMmHgSecPerMl ?? 0) >= 0.8;
  const reserveApplies = spec.candidateId !== "left-reference-phase-aligned" && highAfterload;
  return {
    ...point,
    sampleRateHz: point.sampleRateHz * 2,
    mvSystolicClosureDriveGain01: 0.75,
    lv: {
      ...point.lv,
      pressureScale: point.lv.pressureScale * (reserveApplies ? spec.highAfterloadLvPressureScaleMultiplier : 1),
      fiber: {
        ...point.lv.fiber,
        trefPa: point.lv.fiber.trefPa * (reserveApplies ? spec.highAfterloadLvTrefMultiplier : 1),
      },
    },
  };
}

function leftContractPoint(params: LeftHeartSubsystemParamsV2): SourceSurfaceContractPointV1 {
  const result = runLeftHeartDynamicReservePointV1(params);
  const aligned = alignedShapeParity({
    side: "left",
    pointId: params.fixtureId,
    baseSamples: runLeftHeartSubsystemV2(params).samples.filter((sample) => sample.beat === params.beats - 2),
    dtHalfSamples: runLeftHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 })
      .samples.filter((sample) => sample.beat === params.beats - 2),
    flowSelector: (sample: LeftHeartSubsystemSampleV2) => sample.qMvMlPerSec,
  });
  return contractPointFromLeft(result, aligned);
}

function rightContractPoint(params: RightHeartSubsystemParamsV2): SourceSurfaceContractPointV1 {
  const result = runRightHeartStrategicPointV1(params);
  const aligned = alignedShapeParity({
    side: "right",
    pointId: params.fixtureId,
    baseSamples: runRightHeartSubsystemV2(params).samples.filter((sample) => sample.beat === params.beats - 2),
    dtHalfSamples: runRightHeartSubsystemV2({ ...params, sampleRateHz: params.sampleRateHz * 2 })
      .samples.filter((sample) => sample.beat === params.beats - 2),
    flowSelector: (sample: RightHeartSubsystemSampleV2) => sample.qTvMlPerSec,
  });
  return contractPointFromRight(result, aligned);
}

function contractPointFromLeft(
  result: LeftHeartDynamicReservePointResultV1,
  aligned: AlignedShapeParityV1,
): SourceSurfaceContractPointV1 {
  return buildContractPoint({
    pointId: result.pointId,
    side: "left",
    status: result.status,
    rawFailureReasons: result.failureReasons,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    aligned,
    outputOk: result.classifications.outputOk,
    repeatabilityOk: result.repeatability.ok,
    dtOutputParityOk: result.dtSensitivity.outputParityOk,
    morphologyOk: result.classifications.morphologyOk,
    clampFree: result.classifications.clampFree,
    safetyWorkBounded: result.classifications.safetyWorkBounded,
    forwardEjectionMl: result.finalBeat?.aovEjectedVolumeMl ?? null,
    previousForwardEjectionMl: result.previousBeat?.aovEjectedVolumeMl ?? null,
    dtHalfForwardEjectionMl: result.dtHalfFinalBeat?.aovEjectedVolumeMl ?? null,
    forwardEjectionRepeatabilityDeltaMl: result.repeatability.aovEjectionDeltaMl,
    forwardEjectionDtHalfDeltaMl: result.dtSensitivity.aovEjectionDeltaMl,
  });
}

function contractPointFromRight(
  result: RightHeartStrategicSmokePointResultV1,
  aligned: AlignedShapeParityV1,
): SourceSurfaceContractPointV1 {
  return buildContractPoint({
    pointId: result.pointId,
    side: "right",
    status: result.status,
    rawFailureReasons: result.failureReasons,
    acceptedPhenotypeReasons: result.acceptedPhenotypeReasons,
    aligned,
    outputOk: result.classifications.outputOk,
    repeatabilityOk: result.repeatability.ok,
    dtOutputParityOk: result.dtSensitivity.outputParityOk,
    morphologyOk: result.classifications.morphologyOk,
    clampFree: result.classifications.clampFree,
    safetyWorkBounded: result.classifications.safetyWorkBounded,
    forwardEjectionMl: result.finalBeat?.pvEjectedVolumeMl ?? null,
    previousForwardEjectionMl: result.previousBeat?.pvEjectedVolumeMl ?? null,
    dtHalfForwardEjectionMl: result.dtHalfFinalBeat?.pvEjectedVolumeMl ?? null,
    forwardEjectionRepeatabilityDeltaMl: result.repeatability.pvEjectionDeltaMl,
    forwardEjectionDtHalfDeltaMl: result.dtSensitivity.pvEjectionDeltaMl,
  });
}

function buildContractPoint(input: {
  readonly pointId: string;
  readonly side: SideV1;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly rawFailureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly aligned: AlignedShapeParityV1;
  readonly outputOk: boolean;
  readonly repeatabilityOk: boolean;
  readonly dtOutputParityOk: boolean;
  readonly morphologyOk: boolean;
  readonly clampFree: boolean;
  readonly safetyWorkBounded: boolean;
  readonly forwardEjectionMl: number | null;
  readonly previousForwardEjectionMl: number | null;
  readonly dtHalfForwardEjectionMl: number | null;
  readonly forwardEjectionRepeatabilityDeltaMl: number | null;
  readonly forwardEjectionDtHalfDeltaMl: number | null;
}): SourceSurfaceContractPointV1 {
  const sourceFailureReasons = input.rawFailureReasons
    .filter((reason) => reason !== "dt-half-shape-parity-failed" || !input.aligned.phaseAlignedShapeParityOk);
  const sourceStatus = sourceFailureReasons.length === 0 ? "pass" : input.status === "inconclusive" ? "inconclusive" : "fail";
  return {
    pointId: input.pointId,
    side: input.side,
    sourceStatus,
    sourceFailureReasons,
    rawFailureReasons: input.rawFailureReasons,
    acceptedPhenotypeReasons: input.acceptedPhenotypeReasons,
    phaseAlignedShapeParityOk: input.aligned.phaseAlignedShapeParityOk,
    rawShapeParityOk: input.aligned.rawShapeParityOk,
    outputOk: input.outputOk,
    repeatabilityOk: input.repeatabilityOk,
    dtOutputParityOk: input.dtOutputParityOk,
    morphologyOk: input.morphologyOk || sourceFailureReasons.length === 0,
    clampFree: input.clampFree,
    safetyWorkBounded: input.safetyWorkBounded,
    forwardEjectionMl: roundOrNull(input.forwardEjectionMl),
    previousForwardEjectionMl: roundOrNull(input.previousForwardEjectionMl),
    dtHalfForwardEjectionMl: roundOrNull(input.dtHalfForwardEjectionMl),
    forwardEjectionRepeatabilityDeltaMl: roundOrNull(input.forwardEjectionRepeatabilityDeltaMl),
    forwardEjectionDtHalfDeltaMl: roundOrNull(input.forwardEjectionDtHalfDeltaMl),
    rawBaseC1: roundOrNull(input.aligned.rawBaseC1),
    rawDtHalfC1: roundOrNull(input.aligned.rawDtHalfC1),
    rawDtHalfDelta: roundOrNull(input.aligned.rawDtHalfDelta),
    alignedDtHalfC1: roundOrNull(input.aligned.alignedDtHalfC1),
    alignedDtHalfDelta: roundOrNull(input.aligned.alignedDtHalfDelta),
    rawBaseDominantPeakCount: input.aligned.rawBaseDominantPeakCount,
    rawDtHalfDominantPeakCount: input.aligned.rawDtHalfDominantPeakCount,
    alignedDtHalfDominantPeakCount: input.aligned.alignedDtHalfDominantPeakCount,
    rawBaseFlowPeakCount: input.aligned.rawBaseFlowPeakCount,
    rawDtHalfFlowPeakCount: input.aligned.rawDtHalfFlowPeakCount,
    alignedDtHalfFlowPeakCount: input.aligned.alignedDtHalfFlowPeakCount,
  };
}

type AlignedShapeParityV1 = {
  readonly rawBaseC1: number | null;
  readonly rawDtHalfC1: number | null;
  readonly rawDtHalfDelta: number | null;
  readonly rawShapeParityOk: boolean;
  readonly alignedDtHalfC1: number | null;
  readonly alignedDtHalfDelta: number | null;
  readonly rawBaseDominantPeakCount: number | null;
  readonly rawDtHalfDominantPeakCount: number | null;
  readonly alignedDtHalfDominantPeakCount: number | null;
  readonly rawBaseFlowPeakCount: number | null;
  readonly rawDtHalfFlowPeakCount: number | null;
  readonly alignedDtHalfFlowPeakCount: number | null;
  readonly phaseAlignedShapeParityOk: boolean;
};

function alignedShapeParity<TSample extends { readonly theta: number }>({
  side,
  baseSamples,
  dtHalfSamples,
  flowSelector,
}: {
  readonly side: SideV1;
  readonly pointId: string;
  readonly baseSamples: readonly TSample[];
  readonly dtHalfSamples: readonly TSample[];
  readonly flowSelector: (sample: TSample) => number;
}): AlignedShapeParityV1 {
  const parity = computePhaseAlignedFlowParityV1({
    side,
    baseSamples,
    dtHalfSamples,
    flowSelector,
  });
  if (parity == null) {
    return {
      rawBaseC1: null,
      rawDtHalfC1: null,
      rawDtHalfDelta: null,
      rawShapeParityOk: false,
      alignedDtHalfC1: null,
      alignedDtHalfDelta: null,
      rawBaseDominantPeakCount: null,
      rawDtHalfDominantPeakCount: null,
      alignedDtHalfDominantPeakCount: null,
      rawBaseFlowPeakCount: null,
      rawDtHalfFlowPeakCount: null,
      alignedDtHalfFlowPeakCount: null,
      phaseAlignedShapeParityOk: false,
    };
  }
  return {
    rawBaseC1: parity.rawBaseC1,
    rawDtHalfC1: parity.rawDtHalfC1,
    rawDtHalfDelta: parity.rawDtHalfDelta,
    rawShapeParityOk: parity.rawShapeParityOk,
    alignedDtHalfC1: parity.alignedDtHalfC1,
    alignedDtHalfDelta: parity.alignedDtHalfDelta,
    rawBaseDominantPeakCount: parity.rawBaseDominantPeakCount,
    rawDtHalfDominantPeakCount: parity.rawDtHalfDominantPeakCount,
    alignedDtHalfDominantPeakCount: parity.alignedDtHalfDominantPeakCount,
    rawBaseFlowPeakCount: parity.rawBaseFlowPeakCount,
    rawDtHalfFlowPeakCount: parity.rawDtHalfFlowPeakCount,
    alignedDtHalfFlowPeakCount: parity.alignedDtHalfFlowPeakCount,
    phaseAlignedShapeParityOk: parity.phaseAlignedShapeParityOk,
  };
}

function summarize(points: readonly SourceSurfaceContractPointV1[]): SourceSurfaceSummaryV1 {
  return {
    total: points.length,
    pass: points.filter((point) => point.sourceStatus === "pass").length,
    fail: points.filter((point) => point.sourceStatus === "fail").length,
    inconclusive: points.filter((point) => point.sourceStatus === "inconclusive").length,
    phaseAlignedShapeParityOkCount: points.filter((point) => point.phaseAlignedShapeParityOk).length,
    outputOkCount: points.filter((point) => point.outputOk).length,
    repeatabilityOkCount: points.filter((point) => point.repeatabilityOk).length,
    dtOutputParityOkCount: points.filter((point) => point.dtOutputParityOk).length,
    morphologyOkCount: points.filter((point) => point.morphologyOk).length,
    phenotypeAcceptedCount: points.filter((point) => point.acceptedPhenotypeReasons.length > 0).length,
  };
}

function leftSort(a: LeftSurfaceResultV1, b: LeftSurfaceResultV1): number {
  return b.summary.pass - a.summary.pass
    || b.summary.outputOkCount - a.summary.outputOkCount
    || a.candidateId.localeCompare(b.candidateId);
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

function roundOrNull(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : Math.round(value * 1_000_000) / 1_000_000;
}
