import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
} from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import { positiveValvePeaksDetailed, phaseInWindow, phaseOf } from "@/engine/verification/shapeMetrics";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import {
  DYNAMIC_VALVE_TRANSITION_V1_ID,
  initialDynamicValveTransitionV1State,
  stepDynamicValveTransitionV1,
  type DynamicValveTransitionV1Parameters,
  type DynamicValveTransitionV1State,
  type DynamicValveTransitionV1StepResult,
} from "@/engine/valves/dynamicValveTransitionV1";

export const DYNAMIC_VALVE_LOCAL_BENCH_PHASE5BU_ID =
  "dynamic-valve-local-bench-phase5bu-result-v1" as const;
export const DYNAMIC_VALVE_LOCAL_BENCH_PHASE5BU_RESULT_PATH =
  "data/myocardium/protocols/dynamic-valve-local-bench-phase5bu-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type ValveId = "MV" | "AoV" | "TV" | "PV";
type AvValveId = "MV" | "TV";
type SemilunarValveId = "AoV" | "PV";

type VariantId =
  | "live-source-flow"
  | "source-ode-current-loss-hard-diode"
  | "source-ode-consistent-loss-hard-diode"
  | "hysteretic-consistent-soft-reverse"
  | "hysteretic-area-consistent-soft-reverse"
  | "delayed-close-hysteretic-area-soft-reverse";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly runtimeParams: Partial<CoreRuntimeParams>;
};

type ValveSpec = {
  readonly id: ValveId;
  readonly upstreamPressureKey: keyof SimSample;
  readonly downstreamPressureKey: keyof SimSample;
  readonly flowKey: keyof SimSample;
  readonly openKey: keyof SimSample;
  readonly qDotRawKey: keyof SimSample;
  readonly qDotPostKey: keyof SimSample;
  readonly diodeImpulseKey: keyof SimSample;
  readonly resistanceMmHgSecPerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly openGainPerMmHg: number;
  readonly sourceDeadbandMmHg: number;
  readonly tauOpenSec: number;
  readonly tauCloseSec: number;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly parameterOverrides: Partial<DynamicValveTransitionV1Parameters>;
  readonly useLiveOpen01: boolean;
  readonly usesReplay: boolean;
};

type LivePointTrace = {
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly sampleCount: number;
  readonly finalBeatSampleCount: number;
  readonly metrics: MetricDigest | null;
  readonly samples: readonly SimSample[];
  readonly finalBeat: readonly SimSample[];
  readonly errorMessage: string | null;
};

type ReplaySample = {
  readonly timeSec: number;
  readonly theta: number;
  readonly liveFlowMlPerSec: number;
  readonly replayFlowMlPerSec: number;
  readonly liveOpen01: number;
  readonly replayOpen01: number;
  readonly dPMmHg: number;
  readonly qDotRawMlPerSec2: number;
  readonly qDotPostMlPerSec2: number;
  readonly diodeImpulseMlPerSec: number;
  readonly qDotClampImpulseMlPerSec2: number;
  readonly adversePressureGradientFlow01: number;
};

type ValveRunMetrics = {
  readonly finalBeatSampleCount: number;
  readonly livePositivePeakCount: number;
  readonly replayPositivePeakCount: number;
  readonly liveExtraAvPeakCount: number | null;
  readonly replayExtraAvPeakCount: number | null;
  readonly extraAvPeakReduced: boolean | null;
  readonly liveForwardVolumeMl: number;
  readonly replayForwardVolumeMl: number;
  readonly forwardVolumeRatio: number | null;
  readonly liveRegurgitantFraction: number;
  readonly replayRegurgitantFraction: number;
  readonly adversePressureGradientFlowFraction: number;
  readonly diodeImpulseDutyFraction: number;
  readonly qDotClampDutyFraction: number;
  readonly openDirectionChangeCount: number;
  readonly normalizedFlowRmse: number;
  readonly replayPeakFlowMlPerSec: number;
  readonly livePeakFlowMlPerSec: number;
  readonly maxAbsQDotPostMlPerSec2: number;
  readonly preservedForwardVolume: boolean;
  readonly adverseGradientClean: boolean;
  readonly chatterClean: boolean;
};

type ValveRunResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly valveId: ValveId;
  readonly measured: boolean;
  readonly metrics: ValveRunMetrics;
  readonly previewFinalBeatSamples: readonly ReplaySample[];
  readonly failureMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredValveRuns: number;
  readonly avValveRuns: number;
  readonly semilunarValveRuns: number;
  readonly avExtraWaveReducedCount: number;
  readonly avExtraWaveAbsentCount: number;
  readonly mvExtraWaveReducedCount: number;
  readonly mvValveRuns: number;
  readonly tvExtraWaveReducedCount: number;
  readonly tvValveRuns: number;
  readonly preservedForwardVolumeCount: number;
  readonly adverseGradientCleanCount: number;
  readonly chatterCleanCount: number;
  readonly meanNormalizedFlowRmse: number;
  readonly meanReplayAvExtraPeakCount: number;
};

type Classification = {
  readonly liveAvExtraWaveBurden: string;
  readonly bestReplayVariant: string;
  readonly dynamicValveDecision:
    | "supported-for-closed-loop-shadow"
    | "partial-local-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof DYNAMIC_VALVE_LOCAL_BENCH_PHASE5BU_ID;
  readonly phase: "5BU";
  readonly bench: {
    readonly mechanismId: typeof DYNAMIC_VALVE_TRANSITION_V1_ID;
    readonly mode: "live-user0-pressure-flow-replay";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly claimBoundary:
      "local-valve-load-bench-only-no-runtime-default-no-closed-loop-morphology-claim";
    readonly liveClosure:
      "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc";
  };
  readonly points: readonly PointSpec[];
  readonly valves: readonly ValveSpecDigest[];
  readonly variants: readonly Omit<VariantSpec, "parameterOverrides">[];
  readonly liveTraceSummaries: readonly Omit<LivePointTrace, "samples" | "finalBeat">[];
  readonly results: readonly ValveRunResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noClosedLoopMorphologyAcceptance: true;
    readonly noLandAtrialTuning: true;
    readonly noA1A2Reopen: true;
    readonly noValveThresholdTuning: true;
    readonly noQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

type ValveSpecDigest = Pick<
  ValveSpec,
  | "id"
  | "resistanceMmHgSecPerMl"
  | "bernoulliMmHgSec2PerMl2"
  | "inertanceMmHgSec2PerMl"
  | "openGainPerMmHg"
  | "sourceDeadbandMmHg"
  | "tauOpenSec"
  | "tauCloseSec"
>;

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

const profile = resolveVerificationProfile("fitFast");
const FINAL_BEAT_PREVIEW_SAMPLES = 14;

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, runtimeParams: { HR: 75 } },
  { id: "normal-hr90", targetTBVMl: 5600, runtimeParams: { HR: 90 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, runtimeParams: { HR: 75 } },
  { id: "high-preload-hr75", targetTBVMl: 6200, runtimeParams: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, runtimeParams: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, runtimeParams: { HR: 75, pulmonaryResistance: 0.8 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 0.8 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 1.2 } },
];

const VALVES: readonly ValveSpec[] = [
  {
    id: "MV",
    upstreamPressureKey: "LAP",
    downstreamPressureKey: "LVP",
    flowKey: "QMV",
    openKey: "xiMV",
    qDotRawKey: "MV_qDotRaw",
    qDotPostKey: "MV_qDotPost",
    diodeImpulseKey: "MV_diodeImpulse",
    resistanceMmHgSecPerMl: DEFAULT_PARAMS.MV_R,
    bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.MV_B,
    inertanceMmHgSec2PerMl: DEFAULT_PARAMS.MV_L,
    openGainPerMmHg: DEFAULT_PARAMS.MV_kOpen,
    sourceDeadbandMmHg: 0.25,
    tauOpenSec: DEFAULT_PARAMS.MV_tauOpen,
    tauCloseSec: DEFAULT_PARAMS.MV_tauClose,
  },
  {
    id: "AoV",
    upstreamPressureKey: "LVP",
    downstreamPressureKey: "AoP",
    flowKey: "QAo",
    openKey: "xiAoV",
    qDotRawKey: "AoV_qDotRaw",
    qDotPostKey: "AoV_qDotPost",
    diodeImpulseKey: "AoV_diodeImpulse",
    resistanceMmHgSecPerMl: DEFAULT_PARAMS.AoV_R,
    bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.AoV_B,
    inertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L * 2,
    openGainPerMmHg: DEFAULT_PARAMS.AoV_kOpen,
    sourceDeadbandMmHg: 0,
    tauOpenSec: DEFAULT_PARAMS.AoV_tauOpen,
    tauCloseSec: DEFAULT_PARAMS.AoV_tauClose,
  },
  {
    id: "TV",
    upstreamPressureKey: "RAP",
    downstreamPressureKey: "RVP",
    flowKey: "QTV",
    openKey: "xiTV",
    qDotRawKey: "TV_qDotRaw",
    qDotPostKey: "TV_qDotPost",
    diodeImpulseKey: "TV_diodeImpulse",
    resistanceMmHgSecPerMl: DEFAULT_PARAMS.TV_R,
    bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.TV_B,
    inertanceMmHgSec2PerMl: DEFAULT_PARAMS.TV_L,
    openGainPerMmHg: DEFAULT_PARAMS.TV_kOpen,
    sourceDeadbandMmHg: 0,
    tauOpenSec: DEFAULT_PARAMS.TV_tauOpen,
    tauCloseSec: DEFAULT_PARAMS.TV_tauClose,
  },
  {
    id: "PV",
    upstreamPressureKey: "RVP",
    downstreamPressureKey: "PAP",
    flowKey: "QPV",
    openKey: "xiPV",
    qDotRawKey: "PV_qDotRaw",
    qDotPostKey: "PV_qDotPost",
    diodeImpulseKey: "PV_diodeImpulse",
    resistanceMmHgSecPerMl: DEFAULT_PARAMS.PV_R,
    bernoulliMmHgSec2PerMl2: DEFAULT_PARAMS.PV_B,
    inertanceMmHgSec2PerMl: DEFAULT_PARAMS.PV_L,
    openGainPerMmHg: DEFAULT_PARAMS.PV_kOpen,
    sourceDeadbandMmHg: 0,
    tauOpenSec: DEFAULT_PARAMS.PV_tauOpen,
    tauCloseSec: DEFAULT_PARAMS.PV_tauClose,
  },
];

const VARIANTS: readonly VariantSpec[] = [
  {
    id: "live-source-flow",
    label: "Live source flow reference",
    hypothesis: "Records the current live valve flow morphology and diagnostic burden.",
    useLiveOpen01: true,
    usesReplay: false,
    parameterOverrides: {},
  },
  {
    id: "source-ode-current-loss-hard-diode",
    label: "Source-like opening ODE, current-loss flow, hard diode",
    hypothesis: "Replays the current local valve formulas against live pressures without the full closed-loop feedback.",
    useLiveOpen01: false,
    usesReplay: true,
    parameterOverrides: {
      updateMode: "current-loss",
      openMode: "source-ode",
      reverseMode: "hard-diode",
      minEffectiveOpen01: 1,
      lossScalesWithOpenArea: false,
      qDotLimitMlPerSec2: 40_000,
    },
  },
  {
    id: "source-ode-consistent-loss-hard-diode",
    label: "Source-like opening ODE, consistent-loss flow, hard diode",
    hypothesis: "Tests whether solving the implicit loss relation removes local flow artifacts without smoothing the trace.",
    useLiveOpen01: false,
    usesReplay: true,
    parameterOverrides: {
      updateMode: "consistent-loss",
      openMode: "source-ode",
      reverseMode: "hard-diode",
      minEffectiveOpen01: 1,
      lossScalesWithOpenArea: false,
      qDotLimitMlPerSec2: 40_000,
    },
  },
  {
    id: "hysteretic-consistent-soft-reverse",
    label: "Hysteretic opening, consistent-loss flow, open-scaled soft reverse",
    hypothesis: "Tests local anti-chatter hysteresis and bounded reverse flow without changing valve thresholds in runtime.",
    useLiveOpen01: false,
    usesReplay: true,
    parameterOverrides: {
      updateMode: "consistent-loss",
      openMode: "hysteretic-ode",
      reverseMode: "soft-open-scaled-reverse",
      minEffectiveOpen01: 1,
      lossScalesWithOpenArea: false,
      reverseFlowLimitMlPerSec: 18,
      reverseSmoothingEpsilonMlPerSec: 2.5,
      qDotLimitMlPerSec2: 40_000,
    },
  },
  {
    id: "hysteretic-area-consistent-soft-reverse",
    label: "Hysteretic area-aware transition, consistent-loss flow, open-scaled soft reverse",
    hypothesis: "Tests whether valve-area state should be part of a future local valve/load step instead of only diode smoothing.",
    useLiveOpen01: false,
    usesReplay: true,
    parameterOverrides: {
      updateMode: "consistent-loss",
      openMode: "hysteretic-ode",
      reverseMode: "soft-open-scaled-reverse",
      minEffectiveOpen01: 0.08,
      lossScalesWithOpenArea: true,
      reverseFlowLimitMlPerSec: 18,
      reverseSmoothingEpsilonMlPerSec: 2.5,
      qDotLimitMlPerSec2: 40_000,
    },
  },
  {
    id: "delayed-close-hysteretic-area-soft-reverse",
    label: "Delayed-close hysteretic area-aware transition, open-scaled soft reverse",
    hypothesis: "Tests whether closure timing, not just reverse-flow floor shape, drives the extra AV inflow wave.",
    useLiveOpen01: false,
    usesReplay: true,
    parameterOverrides: {
      updateMode: "consistent-loss",
      openMode: "hysteretic-ode",
      reverseMode: "soft-open-scaled-reverse",
      minEffectiveOpen01: 0.08,
      lossScalesWithOpenArea: true,
      reverseFlowLimitMlPerSec: 18,
      reverseSmoothingEpsilonMlPerSec: 2.5,
      qDotLimitMlPerSec2: 40_000,
    },
  },
];

export function buildDynamicValveLocalBenchPhase5BUEvidence(): Evidence {
  const liveTraces = buildLivePointTraces();
  const results = VARIANTS.flatMap((variant) =>
    POINTS.flatMap((point) =>
      VALVES.map((valve) => runValveReplay(variant, point, valve, requiredLiveTrace(liveTraces, point.id))),
    ),
  );
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: DYNAMIC_VALVE_LOCAL_BENCH_PHASE5BU_ID,
    phase: "5BU",
    bench: {
      mechanismId: DYNAMIC_VALVE_TRANSITION_V1_ID,
      mode: "live-user0-pressure-flow-replay",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      claimBoundary: "local-valve-load-bench-only-no-runtime-default-no-closed-loop-morphology-claim",
      liveClosure: "current-user0-lv-rv-la-ra-landatrial-plus-sourced-root-zc",
    },
    points: POINTS,
    valves: VALVES.map(valveDigest),
    variants: VARIANTS.map(({ parameterOverrides: _parameterOverrides, ...variant }) => variant),
    liveTraceSummaries: liveTraces.map(({ samples: _samples, finalBeat: _finalBeat, ...trace }) => trace),
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noClosedLoopMorphologyAcceptance: true,
      noLandAtrialTuning: true,
      noA1A2Reopen: true,
      noValveThresholdTuning: true,
      noQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function buildLivePointTraces(): readonly LivePointTrace[] {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return POINTS.map((point) => {
    try {
      const params = { ...DEFAULT_PARAMS, ...point.runtimeParams };
      const settle = settleToSteadyState(params, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions: resolved.experimentalOptions,
      });
      const measurement = settle.ok
        ? measureSteady(settle.core, settle.settleStatus, {
          targetTBV: point.targetTBVMl,
          dt: profile.dt,
          sampleHz: profile.sampleHz,
          settlePolicy: profile.settlePolicy,
          measureBeats: profile.measureBeats,
          requireProjectorQuiet: profile.requireProjectorQuiet,
          experimentalOptions: resolved.experimentalOptions,
        })
        : null;
      const samples = measurement?.samples ?? [];
      const finalBeat = lastCompleteBeat(samples);
      return {
        pointId: point.id,
        settled: settle.settleStatus.settled,
        settleReason: settle.settleStatus.reason,
        healthStatus: measurement?.health.status ?? settle.core.health().status,
        sampleCount: samples.length,
        finalBeatSampleCount: finalBeat.length,
        metrics: measurement ? metricDigest(measurement.metrics) : null,
        samples,
        finalBeat,
        errorMessage: null,
      };
    } catch (error) {
      return {
        pointId: point.id,
        settled: false,
        settleReason: "exception",
        healthStatus: "exception",
        sampleCount: 0,
        finalBeatSampleCount: 0,
        metrics: null,
        samples: [],
        finalBeat: [],
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

function runValveReplay(
  variant: VariantSpec,
  point: PointSpec,
  valve: ValveSpec,
  liveTrace: LivePointTrace,
): ValveRunResult {
  if (liveTrace.samples.length < 10 || liveTrace.finalBeat.length < 8 || !liveTrace.settled || liveTrace.healthStatus !== "ok") {
    return {
      variantId: variant.id,
      pointId: point.id,
      valveId: valve.id,
      measured: false,
      metrics: emptyValveRunMetrics(),
      previewFinalBeatSamples: [],
      failureMessage: liveTrace.errorMessage ?? `live trace unavailable or unsettled for ${point.id}`,
    };
  }
  const replay = variant.usesReplay
    ? replayValve(variant, valve, liveTrace.samples)
    : liveFlowReplay(valve, liveTrace.samples);
  const finalBeatReplay = replay.filter((sample) => liveTrace.finalBeat.some((live) => Math.abs(live.t - sample.timeSec) < 1e-9));
  const source = finalBeatReplay.length >= 8 ? finalBeatReplay : replay.slice(-liveTrace.finalBeat.length);
  return {
    variantId: variant.id,
    pointId: point.id,
    valveId: valve.id,
    measured: true,
    metrics: computeValveRunMetrics(valve, source),
    previewFinalBeatSamples: previewFinalBeat(source),
    failureMessage: null,
  };
}

function replayValve(
  variant: VariantSpec,
  valve: ValveSpec,
  samples: readonly SimSample[],
): readonly ReplaySample[] {
  const first = samples[0];
  let state: DynamicValveTransitionV1State = initialDynamicValveTransitionV1State(
    numberAt(first, valve.flowKey),
    numberAt(first, valve.openKey),
  );
  const out: ReplaySample[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const sample = samples[index];
    const dtSec = Math.max(sample.t - previous.t, 1e-6);
    const params = paramsForValve(variant, valve);
    const step = stepDynamicValveTransitionV1(
      state,
      {
        dtSec,
        upstreamPressureMmHg: numberAt(sample, valve.upstreamPressureKey),
        downstreamPressureMmHg: numberAt(sample, valve.downstreamPressureKey),
        prescribedOpen01: variant.useLiveOpen01 ? numberAt(sample, valve.openKey) : undefined,
      },
      params,
    );
    state = step.nextState;
    out.push(replaySampleFromStep(sample, valve, step));
  }
  return out;
}

function liveFlowReplay(valve: ValveSpec, samples: readonly SimSample[]): readonly ReplaySample[] {
  return samples.map((sample) => ({
    timeSec: sample.t,
    theta: phaseOf(sample),
    liveFlowMlPerSec: numberAt(sample, valve.flowKey),
    replayFlowMlPerSec: numberAt(sample, valve.flowKey),
    liveOpen01: numberAt(sample, valve.openKey),
    replayOpen01: numberAt(sample, valve.openKey),
    dPMmHg: numberAt(sample, valve.upstreamPressureKey) - numberAt(sample, valve.downstreamPressureKey),
    qDotRawMlPerSec2: optionalNumber(sample, valve.qDotRawKey),
    qDotPostMlPerSec2: optionalNumber(sample, valve.qDotPostKey),
    diodeImpulseMlPerSec: optionalNumber(sample, valve.diodeImpulseKey),
    qDotClampImpulseMlPerSec2: 0,
    adversePressureGradientFlow01: adversePressureGradientFlow(
      numberAt(sample, valve.upstreamPressureKey) - numberAt(sample, valve.downstreamPressureKey),
      numberAt(sample, valve.flowKey),
    ) ? 1 : 0,
  }));
}

function replaySampleFromStep(
  sample: SimSample,
  valve: ValveSpec,
  step: DynamicValveTransitionV1StepResult,
): ReplaySample {
  return {
    timeSec: sample.t,
    theta: phaseOf(sample),
    liveFlowMlPerSec: numberAt(sample, valve.flowKey),
    replayFlowMlPerSec: step.flowMlPerSec,
    liveOpen01: numberAt(sample, valve.openKey),
    replayOpen01: step.open01,
    dPMmHg: step.dPMmHg,
    qDotRawMlPerSec2: step.qDotRawMlPerSec2,
    qDotPostMlPerSec2: step.qDotPostMlPerSec2,
    diodeImpulseMlPerSec: step.diodeImpulseMlPerSec,
    qDotClampImpulseMlPerSec2: step.qDotClampImpulseMlPerSec2,
    adversePressureGradientFlow01: step.adversePressureGradientFlow ? 1 : 0,
  };
}

function paramsForValve(
  variant: VariantSpec,
  valve: ValveSpec,
): DynamicValveTransitionV1Parameters {
  const isDelayedClose = variant.id === "delayed-close-hysteretic-area-soft-reverse";
  const hysteresisScale = valve.id === "MV" || valve.id === "TV" ? 1 : 0.6;
  return {
    mechanismId: `${DYNAMIC_VALVE_TRANSITION_V1_ID}:${variant.id}:${valve.id}`,
    updateMode: "current-loss",
    openMode: "source-ode",
    reverseMode: "hard-diode",
    resistanceMmHgSecPerMl: valve.resistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2: valve.bernoulliMmHgSec2PerMl2,
    inertanceMmHgSec2PerMl: valve.inertanceMmHgSec2PerMl,
    openGainPerMmHg: valve.openGainPerMmHg,
    sourceDeadbandMmHg: valve.sourceDeadbandMmHg,
    openThresholdMmHg: valve.sourceDeadbandMmHg + 0.18 * hysteresisScale,
    closeThresholdMmHg: -0.35 * hysteresisScale,
    tauOpenSec: valve.tauOpenSec,
    tauCloseSec: isDelayedClose ? valve.tauCloseSec * 2.2 : valve.tauCloseSec,
    minEffectiveOpen01: 1,
    lossScalesWithOpenArea: false,
    reverseFlowLimitMlPerSec: 0,
    reverseSmoothingEpsilonMlPerSec: 1,
    qDotLimitMlPerSec2: null,
    ...variant.parameterOverrides,
  };
}

function computeValveRunMetrics(
  valve: ValveSpec,
  samples: readonly ReplaySample[],
): ValveRunMetrics {
  const livePeaks = positivePeaks(samples, "liveFlowMlPerSec", valve.id);
  const replayPeaks = positivePeaks(samples, "replayFlowMlPerSec", valve.id);
  const isAvValve = valve.id === "MV" || valve.id === "TV";
  const liveExtraAvPeakCount = isAvValve ? avExtraPeakCount(livePeaks as readonly Peak[]) : null;
  const replayExtraAvPeakCount = isAvValve ? avExtraPeakCount(replayPeaks as readonly Peak[]) : null;
  const liveForwardVolumeMl = integrateFlow(samples, (sample) => Math.max(0, sample.liveFlowMlPerSec));
  const replayForwardVolumeMl = integrateFlow(samples, (sample) => Math.max(0, sample.replayFlowMlPerSec));
  const liveReverseVolumeMl = integrateFlow(samples, (sample) => Math.max(0, -sample.liveFlowMlPerSec));
  const replayReverseVolumeMl = integrateFlow(samples, (sample) => Math.max(0, -sample.replayFlowMlPerSec));
  const flowScale = Math.max(maxAbs(samples.map((sample) => sample.liveFlowMlPerSec)), 1);
  const normalizedFlowRmse = Math.sqrt(mean(samples.map((sample) =>
    square(sample.replayFlowMlPerSec - sample.liveFlowMlPerSec),
  ))) / flowScale;
  const openDirectionChangeCount = directionChangeCount(samples.map((sample) => sample.replayOpen01), 1e-4);
  const adversePressureGradientFlowFraction = fraction(samples, (sample) => sample.adversePressureGradientFlow01 > 0);
  const diodeImpulseDutyFraction = fraction(samples, (sample) => Math.abs(sample.diodeImpulseMlPerSec) > 1e-6);
  const qDotClampDutyFraction = fraction(samples, (sample) => Math.abs(sample.qDotClampImpulseMlPerSec2) > 1e-6);
  const forwardVolumeRatio = liveForwardVolumeMl > 1e-9 ? replayForwardVolumeMl / liveForwardVolumeMl : null;
  return {
    finalBeatSampleCount: samples.length,
    livePositivePeakCount: livePeaks.length,
    replayPositivePeakCount: replayPeaks.length,
    liveExtraAvPeakCount,
    replayExtraAvPeakCount,
    extraAvPeakReduced: liveExtraAvPeakCount == null || replayExtraAvPeakCount == null
      ? null
      : replayExtraAvPeakCount < liveExtraAvPeakCount,
    liveForwardVolumeMl: round(liveForwardVolumeMl),
    replayForwardVolumeMl: round(replayForwardVolumeMl),
    forwardVolumeRatio: forwardVolumeRatio == null ? null : round(forwardVolumeRatio),
    liveRegurgitantFraction: round(liveReverseVolumeMl / Math.max(liveForwardVolumeMl, 1e-9)),
    replayRegurgitantFraction: round(replayReverseVolumeMl / Math.max(replayForwardVolumeMl, 1e-9)),
    adversePressureGradientFlowFraction: round(adversePressureGradientFlowFraction),
    diodeImpulseDutyFraction: round(diodeImpulseDutyFraction),
    qDotClampDutyFraction: round(qDotClampDutyFraction),
    openDirectionChangeCount,
    normalizedFlowRmse: round(normalizedFlowRmse),
    replayPeakFlowMlPerSec: round(maxFinite(samples.map((sample) => sample.replayFlowMlPerSec))),
    livePeakFlowMlPerSec: round(maxFinite(samples.map((sample) => sample.liveFlowMlPerSec))),
    maxAbsQDotPostMlPerSec2: round(maxAbs(samples.map((sample) => sample.qDotPostMlPerSec2))),
    preservedForwardVolume: forwardVolumeRatio != null && forwardVolumeRatio >= 0.65 && forwardVolumeRatio <= 1.35,
    adverseGradientClean: adversePressureGradientFlowFraction <= 0.03,
    chatterClean: openDirectionChangeCount <= (isAvValve ? 4 : 3),
  };
}

type Peak = { theta: number; value: number };

function positivePeaks(
  samples: readonly ReplaySample[],
  key: "liveFlowMlPerSec" | "replayFlowMlPerSec",
  valveId: ValveId,
): readonly Peak[] {
  if (valveId === "MV" || valveId === "TV") {
    const synthetic = samples.map((sample) => ({
      phi: sample.theta,
      QMV: key === "liveFlowMlPerSec" ? sample.liveFlowMlPerSec : sample.replayFlowMlPerSec,
      QTV: key === "liveFlowMlPerSec" ? sample.liveFlowMlPerSec : sample.replayFlowMlPerSec,
    } as SimSample));
    return positiveValvePeaksDetailed(synthetic, valveId === "MV" ? "QMV" : "QTV", 0.12, 20);
  }
  const maxFlow = Math.max(0, ...samples.map((sample) => sample[key]));
  const threshold = Math.max(valveId === "AoV" ? 15 : 8, 0.12 * maxFlow);
  const raw: Peak[] = [];
  for (let index = 1; index < samples.length - 1; index += 1) {
    const previous = samples[index - 1][key];
    const current = samples[index][key];
    const next = samples[index + 1][key];
    if (current <= threshold || current < previous || current <= next) continue;
    raw.push({ theta: samples[index].theta, value: current });
  }
  return mergeNearbyPeaks(raw, 0.045);
}

function avExtraPeakCount(peaks: readonly Peak[]): number {
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75));
  const aPeaks = peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08));
  const ePeak = maxPeak(ePeaks);
  const aPeak = maxPeak(aPeaks);
  return diastolic.filter((peak) => peak !== ePeak && peak !== aPeak).length;
}

function summarizeVariant(variant: VariantSpec, results: readonly ValveRunResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id && result.measured);
  const avRuns = own.filter((result) => isAvValve(result.valveId));
  const mvRuns = own.filter((result) => result.valveId === "MV");
  const tvRuns = own.filter((result) => result.valveId === "TV");
  const semilunarRuns = own.filter((result) => isSemilunarValve(result.valveId));
  return {
    variantId: variant.id,
    measuredValveRuns: own.length,
    avValveRuns: avRuns.length,
    semilunarValveRuns: semilunarRuns.length,
    avExtraWaveReducedCount: avRuns.filter((result) => result.metrics.extraAvPeakReduced === true).length,
    avExtraWaveAbsentCount: avRuns.filter((result) => (result.metrics.replayExtraAvPeakCount ?? 99) === 0).length,
    mvExtraWaveReducedCount: mvRuns.filter((result) => result.metrics.extraAvPeakReduced === true).length,
    mvValveRuns: mvRuns.length,
    tvExtraWaveReducedCount: tvRuns.filter((result) => result.metrics.extraAvPeakReduced === true).length,
    tvValveRuns: tvRuns.length,
    preservedForwardVolumeCount: own.filter((result) => result.metrics.preservedForwardVolume).length,
    adverseGradientCleanCount: own.filter((result) => result.metrics.adverseGradientClean).length,
    chatterCleanCount: own.filter((result) => result.metrics.chatterClean).length,
    meanNormalizedFlowRmse: round(mean(own.map((result) => result.metrics.normalizedFlowRmse))),
    meanReplayAvExtraPeakCount: round(mean(avRuns.map((result) => result.metrics.replayExtraAvPeakCount ?? 0))),
  };
}

function classify(summaries: readonly VariantSummary[]): Classification {
  const live = requiredSummary(summaries, "live-source-flow");
  const candidates = summaries.filter((summary) => summary.variantId !== "live-source-flow");
  const best = [...candidates].sort((a, b) =>
    b.avExtraWaveReducedCount - a.avExtraWaveReducedCount
    || b.avExtraWaveAbsentCount - a.avExtraWaveAbsentCount
    || b.preservedForwardVolumeCount - a.preservedForwardVolumeCount
    || b.adverseGradientCleanCount - a.adverseGradientCleanCount
    || a.meanNormalizedFlowRmse - b.meanNormalizedFlowRmse,
  )[0];
  const supported =
    !!best
    && best.avValveRuns > 0
    && best.avExtraWaveReducedCount >= Math.ceil(best.avValveRuns * 0.75)
    && best.preservedForwardVolumeCount >= Math.ceil(best.measuredValveRuns * 0.75)
    && best.adverseGradientCleanCount === best.measuredValveRuns
    && best.chatterCleanCount >= Math.ceil(best.measuredValveRuns * 0.75);
  const partial =
    !!best
    && !supported
    && best.avExtraWaveReducedCount > 0
    && best.preservedForwardVolumeCount >= Math.ceil(best.measuredValveRuns * 0.5)
    && best.adverseGradientCleanCount >= Math.ceil(best.measuredValveRuns * 0.75);
  return {
    liveAvExtraWaveBurden: `${live.avValveRuns - live.avExtraWaveAbsentCount}/${live.avValveRuns}`,
    bestReplayVariant: best
      ? `${best.variantId}:reduced=${best.avExtraWaveReducedCount}/${best.avValveRuns},mvReduced=${best.mvExtraWaveReducedCount}/${best.mvValveRuns},tvReduced=${best.tvExtraWaveReducedCount}/${best.tvValveRuns},absent=${best.avExtraWaveAbsentCount}/${best.avValveRuns},preserved=${best.preservedForwardVolumeCount}/${best.measuredValveRuns},adverseGradient=${best.adverseGradientCleanCount}/${best.measuredValveRuns}`
      : "none",
    dynamicValveDecision: supported
      ? "supported-for-closed-loop-shadow"
      : partial
        ? "partial-local-signal"
        : "not-supported",
    notes: [
      `Live source AV extra-wave burden: ${live.avValveRuns - live.avExtraWaveAbsentCount}/${live.avValveRuns}.`,
      `Best local replay variant: ${best?.variantId ?? "none"}.`,
      `Best local replay AV extra-wave reduction: ${best?.avExtraWaveReducedCount ?? 0}/${best?.avValveRuns ?? 0}.`,
      `Best local replay MV extra-wave reduction: ${best?.mvExtraWaveReducedCount ?? 0}/${best?.mvValveRuns ?? 0}; TV extra-wave reduction: ${best?.tvExtraWaveReducedCount ?? 0}/${best?.tvValveRuns ?? 0}.`,
      `Best local replay forward-volume preservation: ${best?.preservedForwardVolumeCount ?? 0}/${best?.measuredValveRuns ?? 0}.`,
      `Best local replay adverse-gradient-clean count: ${best?.adverseGradientCleanCount ?? 0}/${best?.measuredValveRuns ?? 0}.`,
      "This pressure-flow replay is local evidence only; it does not update chamber pressures or prove closed-loop PV dome repair.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.dynamicValveDecision === "supported-for-closed-loop-shadow") {
    return [
      "promote DynamicValveTransitionV1 to an off-by-default closed-loop shadow for MV/AoV first, then mirror TV/PV only if left-sided morphology survives the envelope",
      "run the existing deterministic morphology checker over the same 8-point envelope before any runtime default adoption",
      "keep LandAtrial AV-plane/effective-wall release timing paused until LV/RV PV plus MVF/TVF gross morphology are robust",
    ];
  }
  if (classification.dynamicValveDecision === "partial-local-signal") {
    return [
      "use the best local DynamicValveTransitionV1 variant as a component candidate, but do not wire it into runtime as a standalone fix",
      "combine the local valve transition candidate with the inconclusive SeriesElasticV1 component in a small local LV subsystem bench before closed-loop shadow",
      "do not resume tau/limiter/smoothing sweeps or LandAtrial tuning from this partial signal",
    ];
  }
  return [
    "do not connect DynamicValveTransitionV1 to runtime as a standalone fix",
    "treat the residual gross morphology blocker as coupled chamber mechanics plus valve-load timing, not a local diode/opening-only problem",
    "next structural experiment should be a local LV subsystem bench combining chamber pressure, MV/AoV flows, zeta/series elasticity, and 2-3 Picard corrections before full runtime adoption",
  ];
}

function emptyValveRunMetrics(): ValveRunMetrics {
  return {
    finalBeatSampleCount: 0,
    livePositivePeakCount: 0,
    replayPositivePeakCount: 0,
    liveExtraAvPeakCount: null,
    replayExtraAvPeakCount: null,
    extraAvPeakReduced: null,
    liveForwardVolumeMl: Number.NaN,
    replayForwardVolumeMl: Number.NaN,
    forwardVolumeRatio: null,
    liveRegurgitantFraction: Number.NaN,
    replayRegurgitantFraction: Number.NaN,
    adversePressureGradientFlowFraction: Number.NaN,
    diodeImpulseDutyFraction: Number.NaN,
    qDotClampDutyFraction: Number.NaN,
    openDirectionChangeCount: 0,
    normalizedFlowRmse: Number.NaN,
    replayPeakFlowMlPerSec: Number.NaN,
    livePeakFlowMlPerSec: Number.NaN,
    maxAbsQDotPostMlPerSec2: Number.NaN,
    preservedForwardVolume: false,
    adverseGradientClean: false,
    chatterClean: false,
  };
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function lastCompleteBeat(samples: readonly SimSample[]): readonly SimSample[] {
  const last = samples.at(-1);
  if (!last) return [];
  const beat = Math.floor(last.phi) - 1;
  return samples.filter((sample) => Math.floor(sample.phi) === beat);
}

function requiredLiveTrace(traces: readonly LivePointTrace[], pointId: PointId): LivePointTrace {
  const trace = traces.find((entry) => entry.pointId === pointId);
  if (!trace) throw new Error(`Missing Phase 5BU live trace for ${pointId}.`);
  return trace;
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing Phase 5BU variant summary ${variantId}.`);
  return summary;
}

function valveDigest(valve: ValveSpec): ValveSpecDigest {
  return {
    id: valve.id,
    resistanceMmHgSecPerMl: valve.resistanceMmHgSecPerMl,
    bernoulliMmHgSec2PerMl2: valve.bernoulliMmHgSec2PerMl2,
    inertanceMmHgSec2PerMl: valve.inertanceMmHgSec2PerMl,
    openGainPerMmHg: valve.openGainPerMmHg,
    sourceDeadbandMmHg: valve.sourceDeadbandMmHg,
    tauOpenSec: valve.tauOpenSec,
    tauCloseSec: valve.tauCloseSec,
  };
}

function adversePressureGradientFlow(dPMmHg: number, flowMlPerSec: number): boolean {
  return (dPMmHg < -0.75 && flowMlPerSec > 10) || (dPMmHg > 0.75 && flowMlPerSec < -10);
}

function previewFinalBeat(samples: readonly ReplaySample[]): readonly ReplaySample[] {
  if (samples.length <= FINAL_BEAT_PREVIEW_SAMPLES) return samples.map(roundReplaySample);
  const stride = Math.max(1, Math.floor(samples.length / FINAL_BEAT_PREVIEW_SAMPLES));
  return samples.filter((_sample, index) => index % stride === 0).slice(0, FINAL_BEAT_PREVIEW_SAMPLES).map(roundReplaySample);
}

function roundReplaySample(sample: ReplaySample): ReplaySample {
  return {
    timeSec: round(sample.timeSec),
    theta: round(sample.theta),
    liveFlowMlPerSec: round(sample.liveFlowMlPerSec),
    replayFlowMlPerSec: round(sample.replayFlowMlPerSec),
    liveOpen01: round(sample.liveOpen01),
    replayOpen01: round(sample.replayOpen01),
    dPMmHg: round(sample.dPMmHg),
    qDotRawMlPerSec2: round(sample.qDotRawMlPerSec2),
    qDotPostMlPerSec2: round(sample.qDotPostMlPerSec2),
    diodeImpulseMlPerSec: round(sample.diodeImpulseMlPerSec),
    qDotClampImpulseMlPerSec2: round(sample.qDotClampImpulseMlPerSec2),
    adversePressureGradientFlow01: sample.adversePressureGradientFlow01,
  };
}

function integrateFlow(samples: readonly ReplaySample[], value: (sample: ReplaySample) => number): number {
  let area = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const dt = Math.max(0, samples[index].timeSec - samples[index - 1].timeSec);
    area += 0.5 * dt * (value(samples[index - 1]) + value(samples[index]));
  }
  return area;
}

function directionChangeCount(values: readonly number[], epsilon: number): number {
  let count = 0;
  let previous = 0;
  for (let index = 1; index < values.length; index += 1) {
    const delta = values[index] - values[index - 1];
    const direction = delta > epsilon ? 1 : delta < -epsilon ? -1 : 0;
    if (direction !== 0 && previous !== 0 && direction !== previous) count += 1;
    if (direction !== 0) previous = direction;
  }
  return count;
}

function mergeNearbyPeaks(peaks: readonly Peak[], minSeparationTheta: number): readonly Peak[] {
  const out: Peak[] = [];
  for (const peak of [...peaks].sort((left, right) => left.theta - right.theta)) {
    const last = out.at(-1);
    if (!last || Math.abs(peak.theta - last.theta) > minSeparationTheta) {
      out.push({ ...peak });
    } else if (peak.value > last.value) {
      last.theta = peak.theta;
      last.value = peak.value;
    }
  }
  return out;
}

function maxPeak(peaks: readonly Peak[]): Peak | null {
  return peaks.length === 0
    ? null
    : peaks.reduce((best, peak) => peak.value > best.value ? peak : best, peaks[0]);
}

function isAvValve(valveId: ValveId): valveId is AvValveId {
  return valveId === "MV" || valveId === "TV";
}

function isSemilunarValve(valveId: ValveId): valveId is SemilunarValveId {
  return valveId === "AoV" || valveId === "PV";
}

function numberAt(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : 0;
}

function optionalNumber(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : 0;
}

function fraction<T>(values: readonly T[], predicate: (value: T) => boolean): number {
  if (values.length === 0) return 0;
  return values.filter(predicate).length / values.length;
}

function maxFinite(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : Math.max(...finite);
}

function maxAbs(values: readonly number[]): number {
  return maxFinite(values.map((value) => Math.abs(value)));
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((acc, value) => acc + value, 0) / finite.length;
}

function square(value: number): number {
  return value * value;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

export function writeDynamicValveLocalBenchPhase5BUEvidence(): Evidence {
  const evidence = buildDynamicValveLocalBenchPhase5BUEvidence();
  const outPath = path.resolve(process.cwd(), DYNAMIC_VALVE_LOCAL_BENCH_PHASE5BU_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeDynamicValveLocalBenchPhase5BUEvidence();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
  }, null, 2));
}
