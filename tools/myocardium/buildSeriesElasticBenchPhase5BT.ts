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
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumInput,
} from "@/engine/myocardium/calcium";
import {
  DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
  SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
  initialSeriesElasticFiberState,
  stepLandWithoutSeriesElastic,
  stepSeriesElasticLandFiberV1,
  type SeriesElasticFiberParameters,
  type SeriesElasticFiberState,
} from "@/engine/myocardium/seriesElasticFiberAdapter";
import type { Land2017SubstepSolveOptions } from "@/engine/myocardium/myofilament/land2017";
import type { CoreRuntimeParams, SimSample } from "@/engine/protocol";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const SERIES_ELASTIC_BENCH_PHASE5BT_ID =
  "series-elastic-bench-phase5bt-result-v1" as const;
export const SERIES_ELASTIC_BENCH_PHASE5BT_RESULT_PATH =
  "data/myocardium/protocols/series-elastic-bench-phase5bt-result-v1.json" as const;

type ChamberId = "LV" | "RV";
type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "current-land-no-se"
  | "no-zeta-drive-diagnostic"
  | "filtered-lambda-tau-35ms"
  | "series-elastic-v1-k0600"
  | "series-elastic-v1-k0600-damped"
  | "series-elastic-v1-k1000-damped";

type PointSpec = {
  readonly id: PointId;
  readonly hrBpm: number;
  readonly targetTBVMl: number;
  readonly runtimeParams: Partial<CoreRuntimeParams>;
  readonly preloadScale: number;
  readonly afterloadTransitionScale: number;
  readonly contractilityScale: number;
};

type ChamberSpec = {
  readonly id: ChamberId;
  readonly initialLambda: number;
  readonly shorteningDelta: number;
  readonly transitionBump: number;
  readonly transitionPhase01: number;
  readonly transitionWidth01: number;
  readonly systolicOnsetPhase01: number;
  readonly systolicDuration01: number;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly seriesElastic: SeriesElasticFiberParameters | null;
  readonly noZetaDrive: boolean;
  readonly tauLambdaSec: number | null;
};

type LiveTraceSample = {
  readonly phase01: number;
  readonly lambda: number;
  readonly liveActiveStressPa: number;
};

type LiveTrace = {
  readonly pointId: PointId;
  readonly chamberId: ChamberId;
  readonly settled: boolean;
  readonly sampleCount: number;
  readonly cycleLengthSec: number;
  readonly samples: readonly LiveTraceSample[];
};

type BenchSample = {
  readonly timeSec: number;
  readonly phase01: number;
  readonly freeCalciumUM: number;
  readonly lambdaTotal: number;
  readonly lambdaTotalDotPerSec: number;
  readonly lambdaSi: number;
  readonly lambdaSiDotPerSec: number;
  readonly lambdaSe: number;
  readonly sigmaCePa: number;
  readonly sigmaSePa: number;
  readonly sigmaMismatchPa: number;
  readonly elasticEnergyJm3: number;
  readonly sePowerDensityWPerM3: number;
  readonly seDissipationDensityWPerM3: number;
};

type RunMetrics = {
  readonly finalBeatSampleCount: number;
  readonly stressPeakCount: number;
  readonly stressProminentPeakCount: number;
  readonly transmittedPeakCount: number;
  readonly transmittedProminentPeakCount: number;
  readonly peakStressPa: number;
  readonly peakTransmittedStressPa: number;
  readonly stressFwhmMs: number;
  readonly transmittedFwhmMs: number;
  readonly timeToPeakStressMs: number;
  readonly maxAbsSigmaMismatchPa: number;
  readonly meanAbsSigmaMismatchPa: number;
  readonly maxAbsLambdaSe: number;
  readonly maxElasticEnergyJm3: number;
  readonly cycleEnergyDriftJm3: number;
  readonly netSePowerJm3: number;
  readonly netCePowerJm3: number;
  readonly netDissipationJm3: number;
  readonly solverFailureCount: number;
  readonly forceBalanceFailureCount: number;
  readonly periodShapeDistance: number;
  readonly doublePeakReducedVsCurrent: boolean | null;
  readonly boundedEnergy: boolean;
  readonly boundedMismatch: boolean;
};

type RunResult = {
  readonly variantId: VariantId;
  readonly chamberId: ChamberId;
  readonly pointId: PointId;
  readonly ok: boolean;
  readonly metrics: RunMetrics;
  readonly previewFinalBeatSamples: readonly BenchSample[];
  readonly failureMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly okCount: number;
  readonly stressSinglePeakCount: number;
  readonly transmittedSinglePeakCount: number;
  readonly doublePeakReducedCount: number;
  readonly boundedEnergyCount: number;
  readonly boundedMismatchCount: number;
  readonly meanTransmittedProminentPeakCount: number;
  readonly meanStressFwhmMs: number;
  readonly meanMaxAbsSigmaMismatchPa: number;
};

type Classification = {
  readonly currentNoSeriesElasticDoublePeakPoints: string;
  readonly noZetaDiagnosticDoublePeakPoints: string;
  readonly bestSeriesElasticVariant: string;
  readonly seriesElasticDecision:
    | "supported-for-closed-loop-shadow"
    | "not-supported"
    | "inconclusive";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof SERIES_ELASTIC_BENCH_PHASE5BT_ID;
  readonly phase: "5BT";
  readonly bench: {
    readonly adapterId: typeof SERIES_ELASTIC_FIBER_ADAPTER_V1_ID;
    readonly mode: "live-user0-lambda-prescribed";
    readonly sourceStateControl:
      "live-active-stress-positive-control-vs-synthetic-calcium-replay-not-source-state-controlled";
    readonly claimBoundary:
      "isolated-bench-only-no-runtime-default-no-closed-loop-morphology-claim";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly calciumParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
  };
  readonly points: readonly PointSpec[];
  readonly chambers: readonly ChamberSpec[];
  readonly liveTraceSummaries: readonly Omit<LiveTrace, "samples">[];
  readonly variants: readonly Omit<VariantSpec, "seriesElastic">[];
  readonly seriesElasticVariantParameters: Record<string, SeriesElasticParameterDigest | null>;
  readonly results: readonly RunResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noClosedLoopMorphologyAcceptance: true;
    readonly noLandAtrialTuning: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

type SeriesElasticParameterDigest = Pick<
  SeriesElasticFiberParameters,
  | "seriesStiffnessPa"
  | "seriesDampingPaSec"
  | "referenceLambdaSe"
  | "maxLambdaSeAbs"
  | "maxForceBalanceIterations"
  | "forceBalanceTolerancePa"
>;

type SimulatorState = {
  landState: Float64Array;
  filteredLambda: number;
  seriesElasticState: SeriesElasticFiberState | null;
};

const DEFAULT_INITIAL_LAND_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_INITIAL_CALCIUM_STATE = Float64Array.from([0, 0]);
const DT_SEC = 0.002;
const CYCLES = 3;
const FINAL_BEAT_PREVIEW_SAMPLES = 12;
const LAND_SOLVE_OPTIONS: Land2017SubstepSolveOptions = {
  maxIterations: 12,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
  substeps: 2,
};
const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75 }, preloadScale: 1, afterloadTransitionScale: 1, contractilityScale: 1 },
  { id: "normal-hr90", hrBpm: 90, targetTBVMl: 5600, runtimeParams: { HR: 90 }, preloadScale: 1, afterloadTransitionScale: 1, contractilityScale: 1 },
  { id: "low-preload-hr75", hrBpm: 75, targetTBVMl: 4800, runtimeParams: { HR: 75 }, preloadScale: 0.72, afterloadTransitionScale: 1, contractilityScale: 1 },
  { id: "high-preload-hr75", hrBpm: 75, targetTBVMl: 6200, runtimeParams: { HR: 75 }, preloadScale: 1.18, afterloadTransitionScale: 1, contractilityScale: 1 },
  { id: "systemic-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, systemicResistance: 1.25 }, preloadScale: 1, afterloadTransitionScale: 1.35, contractilityScale: 1 },
  { id: "pulmonary-afterload-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, pulmonaryResistance: 0.8 }, preloadScale: 1, afterloadTransitionScale: 1.22, contractilityScale: 1 },
  { id: "contractility-low-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 0.8 }, preloadScale: 1, afterloadTransitionScale: 0.9, contractilityScale: 0.82 },
  { id: "contractility-high-hr75", hrBpm: 75, targetTBVMl: 5600, runtimeParams: { HR: 75, contractility: 1.2 }, preloadScale: 1, afterloadTransitionScale: 1.18, contractilityScale: 1.18 },
];

const CHAMBERS: readonly ChamberSpec[] = [
  {
    id: "LV",
    initialLambda: 1.055,
    shorteningDelta: -0.074,
    transitionBump: 0.018,
    transitionPhase01: 0.27,
    transitionWidth01: 0.027,
    systolicOnsetPhase01: 0.105,
    systolicDuration01: 0.33,
  },
  {
    id: "RV",
    initialLambda: 1.064,
    shorteningDelta: -0.066,
    transitionBump: 0.016,
    transitionPhase01: 0.285,
    transitionWidth01: 0.031,
    systolicOnsetPhase01: 0.115,
    systolicDuration01: 0.36,
  },
];

const VARIANTS: readonly VariantSpec[] = [
  {
    id: "current-land-no-se",
    label: "Current Land prescribed total length, no series elastic element",
    hypothesis: "Positive blocker control: total chamber strain and raw velocity drive Land directly.",
    seriesElastic: null,
    noZetaDrive: false,
    tauLambdaSec: null,
  },
  {
    id: "no-zeta-drive-diagnostic",
    label: "No-zeta-drive diagnostic",
    hypothesis: "Diagnostic ablation mirroring Phase 5BP: removes zeta velocity drive without adding physical compliance.",
    seriesElastic: null,
    noZetaDrive: true,
    tauLambdaSec: null,
  },
  {
    id: "filtered-lambda-tau-35ms",
    label: "Filtered lambda tau 35 ms comparator",
    hypothesis: "Comparator for normal-point tau fixes; not an adoption path if it only filters geometry.",
    seriesElastic: null,
    noZetaDrive: false,
    tauLambdaSec: 0.035,
  },
  {
    id: "series-elastic-v1-k0600",
    label: "SeriesElasticV1 k=0.6 MPa",
    hypothesis: "Tests whether a physical series element absorbs valve-load strain-rate spikes without damping.",
    seriesElastic: seriesElasticParams(600_000, 0),
    noZetaDrive: false,
    tauLambdaSec: null,
  },
  {
    id: "series-elastic-v1-k0600-damped",
    label: "SeriesElasticV1 k=0.6 MPa, c=3.5 kPa*s",
    hypothesis: "Tests minimal physical damping on the same series element.",
    seriesElastic: seriesElasticParams(600_000, 3_500),
    noZetaDrive: false,
    tauLambdaSec: null,
  },
  {
    id: "series-elastic-v1-k1000-damped",
    label: "SeriesElasticV1 k=1.0 MPa, c=5 kPa*s",
    hypothesis: "Tests a stiffer but still compliant series element.",
    seriesElastic: seriesElasticParams(1_000_000, 5_000),
    noZetaDrive: false,
    tauLambdaSec: null,
  },
];

export function buildSeriesElasticBenchPhase5BTEvidence(): Evidence {
  const liveTraces = buildLiveTraces();
  const currentResults = runVariant(VARIANTS[0], liveTraces);
  const otherResults = VARIANTS.slice(1).flatMap((variant) => runVariant(variant, liveTraces, currentResults));
  const results = [...currentResults, ...otherResults];
  const variantSummaries = VARIANTS.map((variant) => summarizeVariant(variant, results));
  const classification = classifyResults(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: SERIES_ELASTIC_BENCH_PHASE5BT_ID,
    phase: "5BT",
    bench: {
      adapterId: SERIES_ELASTIC_FIBER_ADAPTER_V1_ID,
      mode: "live-user0-lambda-prescribed",
      sourceStateControl:
        "live-active-stress-positive-control-vs-synthetic-calcium-replay-not-source-state-controlled",
      claimBoundary: "isolated-bench-only-no-runtime-default-no-closed-loop-morphology-claim",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      calciumParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
    },
    points: POINTS,
    chambers: CHAMBERS,
    liveTraceSummaries: liveTraces.map(({ samples: _samples, ...trace }) => trace),
    variants: VARIANTS.map(({ seriesElastic: _seriesElastic, ...variant }) => variant),
    seriesElasticVariantParameters: Object.fromEntries(
      VARIANTS.map((variant) => [variant.id, variant.seriesElastic ? parameterDigest(variant.seriesElastic) : null]),
    ),
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noClosedLoopMorphologyAcceptance: true,
      noLandAtrialTuning: true,
      noA1A2Reopen: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  const normalizedSha256 = hashStable(evidenceWithoutHash);
  return { ...evidenceWithoutHash, normalizedSha256 };
}

function runVariant(
  variant: VariantSpec,
  liveTraces: readonly LiveTrace[],
  currentResults: readonly RunResult[] = [],
): readonly RunResult[] {
  return POINTS.flatMap((point) =>
    CHAMBERS.map((chamber) => runPoint(
      variant,
      point,
      chamber,
      requiredLiveTrace(liveTraces, point.id, chamber.id),
      currentResults,
    )),
  );
}

function runPoint(
  variant: VariantSpec,
  point: PointSpec,
  chamber: ChamberSpec,
  liveTrace: LiveTrace,
  currentResults: readonly RunResult[],
): RunResult {
  const cycleLengthSec = 60 / point.hrBpm;
  if (liveTrace.samples.length < 10) {
    return {
      variantId: variant.id,
      chamberId: chamber.id,
      pointId: point.id,
      ok: false,
      metrics: emptyRunMetrics(1, 0),
      previewFinalBeatSamples: [],
      failureMessage: `live user-0 trace unavailable for ${point.id}/${chamber.id}`,
    };
  }
  const steps = Math.max(1, Math.round((CYCLES * cycleLengthSec) / DT_SEC));
  const initialLambda = interpolateLiveTrace(liveTrace, 0).lambda;
  const state: SimulatorState = {
    landState: Float64Array.from(DEFAULT_INITIAL_LAND_STATE),
    filteredLambda: initialLambda,
    seriesElasticState: variant.seriesElastic
      ? initialSeriesElasticFiberState(DEFAULT_INITIAL_LAND_STATE, initialLambda)
      : null,
  };
  let calciumState = Float64Array.from(DEFAULT_INITIAL_CALCIUM_STATE);
  let previousFreeCalciumUM = 0;
  let previousLambdaTotal = initialLambda;
  let solverFailureCount = 0;
  let forceBalanceFailureCount = 0;
  let failureMessage: string | null = null;
  const samples: BenchSample[] = [];

  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * DT_SEC;
    const previousTimeSec = (step - 1) * DT_SEC;
    const phase01 = phaseAtTime(timeSec, cycleLengthSec);
    const previousPhase01 = phaseAtTime(previousTimeSec, cycleLengthSec);
    const cycleIndex = Math.floor((timeSec + 1e-12) / cycleLengthSec);
    const liveStage = interpolateLiveTrace(liveTrace, phase01);
    const livePrevious = interpolateLiveTrace(liveTrace, previousPhase01);
    const stageLambdaTotal = liveStage.lambda;
    previousLambdaTotal = livePrevious.lambda;
    const lambdaTotalDotPerSec = (stageLambdaTotal - previousLambdaTotal) / DT_SEC;

    if (variant.id === "current-land-no-se") {
      samples.push({
        timeSec,
        phase01,
        freeCalciumUM: Number.NaN,
        lambdaTotal: stageLambdaTotal,
        lambdaTotalDotPerSec,
        lambdaSi: stageLambdaTotal,
        lambdaSiDotPerSec: lambdaTotalDotPerSec,
        lambdaSe: 0,
        sigmaCePa: liveStage.liveActiveStressPa,
        sigmaSePa: liveStage.liveActiveStressPa,
        sigmaMismatchPa: 0,
        elasticEnergyJm3: 0,
        sePowerDensityWPerM3: 0,
        seDissipationDensityWPerM3: 0,
      });
      continue;
    }

    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      prescribedCalciumInput(
        cycleIndex + 1,
        Math.max(0, timeSec - cycleIndex * cycleLengthSec),
        cycleLengthSec,
        Math.min(1, point.contractilityScale),
      ),
      PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
    );
    calciumState = calciumStep.nextState;
    if (step === 1) previousFreeCalciumUM = calciumStep.output.freeCalciumUM;

    if (variant.seriesElastic && state.seriesElasticState) {
      const result = stepSeriesElasticLandFiberV1(
        state.seriesElasticState,
        {
          freeCalciumUM: calciumStep.output.freeCalciumUM,
          previousFreeCalciumUM,
          previousLambdaTotal,
          stageLambdaTotal,
          dtSec: DT_SEC,
        },
        variant.seriesElastic,
      );
      if (!result.ok) {
        solverFailureCount += 1;
        failureMessage = result.failureMessage ?? result.failureReason ?? "series elastic step failed";
        break;
      }
      if (!result.forceBalanceConverged) forceBalanceFailureCount += 1;
      state.seriesElasticState = result.nextState;
      state.landState = result.nextState.landState;
      samples.push({
        timeSec,
        phase01,
        freeCalciumUM: calciumStep.output.freeCalciumUM,
        lambdaTotal: result.lambdaTotal,
        lambdaTotalDotPerSec: result.lambdaTotalDotPerSec,
        lambdaSi: result.lambdaSi,
        lambdaSiDotPerSec: result.lambdaSiDotPerSec,
        lambdaSe: result.lambdaSe,
        sigmaCePa: result.sigmaCePa,
        sigmaSePa: result.sigmaSePa,
        sigmaMismatchPa: result.sigmaMismatchPa,
        elasticEnergyJm3: result.elasticEnergyJm3,
        sePowerDensityWPerM3: result.sePowerDensityWPerM3,
        seDissipationDensityWPerM3: result.seDissipationDensityWPerM3,
      });
    } else {
      const stageLambdaForLand = filteredLambdaForVariant(variant, state, stageLambdaTotal);
      const previousLambdaForLand = state.filteredLambda;
      state.filteredLambda = stageLambdaForLand;
      const zetaDrive = variant.noZetaDrive
        ? 0
        : (stageLambdaForLand - previousLambdaForLand) / DT_SEC;
      const result = stepLandWithoutSeriesElastic(
        state.landState,
        {
          freeCalciumUM: calciumStep.output.freeCalciumUM,
          previousFreeCalciumUM,
          previousLambdaTotal: previousLambdaForLand,
          stageLambdaTotal: stageLambdaForLand,
          dtSec: DT_SEC,
        },
        LAND_SOLVE_OPTIONS,
        undefined,
        zetaDrive,
      );
      if (!result.ok || !result.output) {
        solverFailureCount += 1;
        failureMessage = result.failureMessage ?? result.failureReason ?? "Land step failed";
        break;
      }
      state.landState = result.nextState;
      samples.push({
        timeSec,
        phase01,
        freeCalciumUM: calciumStep.output.freeCalciumUM,
        lambdaTotal: stageLambdaTotal,
        lambdaTotalDotPerSec,
        lambdaSi: stageLambdaForLand,
        lambdaSiDotPerSec: zetaDrive,
        lambdaSe: 0,
        sigmaCePa: result.output.sourceActiveFiberStressPa,
        sigmaSePa: result.output.sourceActiveFiberStressPa,
        sigmaMismatchPa: 0,
        elasticEnergyJm3: 0,
        sePowerDensityWPerM3: 0,
        seDissipationDensityWPerM3: 0,
      });
    }
    previousFreeCalciumUM = calciumStep.output.freeCalciumUM;
  }

  const ok = solverFailureCount === 0 && samples.length > 0;
  const current = currentResults.find((entry) => entry.pointId === point.id && entry.chamberId === chamber.id);
  const metrics = computeRunMetrics(samples, cycleLengthSec, solverFailureCount, forceBalanceFailureCount, current);
  return {
    variantId: variant.id,
    chamberId: chamber.id,
    pointId: point.id,
    ok,
    metrics,
    previewFinalBeatSamples: previewFinalBeat(samples, cycleLengthSec),
    failureMessage,
  };
}

function filteredLambdaForVariant(
  variant: VariantSpec,
  state: SimulatorState,
  stageLambdaTotal: number,
): number {
  if (variant.tauLambdaSec === null) return stageLambdaTotal;
  const alpha = DT_SEC / Math.max(DT_SEC, variant.tauLambdaSec);
  return state.filteredLambda + alpha * (stageLambdaTotal - state.filteredLambda);
}

function computeRunMetrics(
  samples: readonly BenchSample[],
  cycleLengthSec: number,
  solverFailureCount: number,
  forceBalanceFailureCount: number,
  current: RunResult | undefined,
): RunMetrics {
  const finalBeat = finalBeatSamples(samples, cycleLengthSec);
  const previousBeat = previousBeatSamples(samples, cycleLengthSec);
  const stress = finalBeat.map((sample) => sample.sigmaCePa);
  const transmitted = finalBeat.map((sample) => sample.sigmaSePa);
  const times = finalBeat.map((sample) => sample.timeSec - (finalBeat[0]?.timeSec ?? 0));
  const peakStress = maxFinite(stress);
  const peakTransmittedStress = maxFinite(transmitted);
  const stressProminentPeakCount = prominentPeakCount(stress);
  const transmittedProminentPeakCount = prominentPeakCount(transmitted);
  const currentPeaks = current?.metrics.transmittedProminentPeakCount;
  const maxAbsSigmaMismatchPa = maxFinite(finalBeat.map((sample) => Math.abs(sample.sigmaMismatchPa)));
  const meanAbsSigmaMismatchPa = mean(finalBeat.map((sample) => Math.abs(sample.sigmaMismatchPa)));
  const maxAbsLambdaSe = maxFinite(finalBeat.map((sample) => Math.abs(sample.lambdaSe)));
  const maxElasticEnergyJm3 = maxFinite(finalBeat.map((sample) => sample.elasticEnergyJm3));
  const cycleEnergyDriftJm3 =
    (finalBeat[finalBeat.length - 1]?.elasticEnergyJm3 ?? 0) - (finalBeat[0]?.elasticEnergyJm3 ?? 0);
  const netSePowerJm3 = integrate(finalBeat.map((sample) => sample.sePowerDensityWPerM3), DT_SEC);
  const netCePowerJm3 = integrate(finalBeat.map((sample) => sample.sigmaCePa * sample.lambdaSiDotPerSec), DT_SEC);
  const netDissipationJm3 = integrate(finalBeat.map((sample) => sample.seDissipationDensityWPerM3), DT_SEC);
  const boundedEnergy =
    Number.isFinite(maxElasticEnergyJm3)
    && maxElasticEnergyJm3 < 2_500
    && Math.abs(cycleEnergyDriftJm3) < 500
    && netDissipationJm3 >= -1e-9;
  const boundedMismatch =
    Number.isFinite(maxAbsSigmaMismatchPa)
    && maxAbsSigmaMismatchPa < 8_000;
  return {
    finalBeatSampleCount: finalBeat.length,
    stressPeakCount: localPeakCount(stress),
    stressProminentPeakCount,
    transmittedPeakCount: localPeakCount(transmitted),
    transmittedProminentPeakCount,
    peakStressPa: round(peakStress),
    peakTransmittedStressPa: round(peakTransmittedStress),
    stressFwhmMs: round(widthAtFractionMs(times, stress, 0.5)),
    transmittedFwhmMs: round(widthAtFractionMs(times, transmitted, 0.5)),
    timeToPeakStressMs: round(timeToPeakMs(times, stress)),
    maxAbsSigmaMismatchPa: round(maxAbsSigmaMismatchPa),
    meanAbsSigmaMismatchPa: round(meanAbsSigmaMismatchPa),
    maxAbsLambdaSe: round(maxAbsLambdaSe),
    maxElasticEnergyJm3: round(maxElasticEnergyJm3),
    cycleEnergyDriftJm3: round(cycleEnergyDriftJm3),
    netSePowerJm3: round(netSePowerJm3),
    netCePowerJm3: round(netCePowerJm3),
    netDissipationJm3: round(netDissipationJm3),
    solverFailureCount,
    forceBalanceFailureCount,
    periodShapeDistance: round(periodShapeDistance(previousBeat, finalBeat)),
    doublePeakReducedVsCurrent:
      currentPeaks === undefined ? null : transmittedProminentPeakCount < currentPeaks,
    boundedEnergy,
    boundedMismatch,
  };
}

function emptyRunMetrics(
  solverFailureCount: number,
  forceBalanceFailureCount: number,
): RunMetrics {
  return {
    finalBeatSampleCount: 0,
    stressPeakCount: 0,
    stressProminentPeakCount: 0,
    transmittedPeakCount: 0,
    transmittedProminentPeakCount: 0,
    peakStressPa: Number.NaN,
    peakTransmittedStressPa: Number.NaN,
    stressFwhmMs: Number.NaN,
    transmittedFwhmMs: Number.NaN,
    timeToPeakStressMs: Number.NaN,
    maxAbsSigmaMismatchPa: Number.NaN,
    meanAbsSigmaMismatchPa: Number.NaN,
    maxAbsLambdaSe: Number.NaN,
    maxElasticEnergyJm3: Number.NaN,
    cycleEnergyDriftJm3: Number.NaN,
    netSePowerJm3: Number.NaN,
    netCePowerJm3: Number.NaN,
    netDissipationJm3: Number.NaN,
    solverFailureCount,
    forceBalanceFailureCount,
    periodShapeDistance: Number.NaN,
    doublePeakReducedVsCurrent: null,
    boundedEnergy: false,
    boundedMismatch: false,
  };
}

function summarizeVariant(
  variant: VariantSpec,
  results: readonly RunResult[],
): VariantSummary {
  const entries = results.filter((result) => result.variantId === variant.id);
  const measuredEntries = entries.filter((entry) => entry.ok);
  return {
    variantId: variant.id,
    measuredCount: measuredEntries.length,
    okCount: measuredEntries.length,
    stressSinglePeakCount: measuredEntries.filter((entry) => entry.metrics.stressProminentPeakCount <= 1).length,
    transmittedSinglePeakCount: measuredEntries.filter((entry) => entry.metrics.transmittedProminentPeakCount <= 1).length,
    doublePeakReducedCount: measuredEntries.filter((entry) => entry.metrics.doublePeakReducedVsCurrent === true).length,
    boundedEnergyCount: measuredEntries.filter((entry) => entry.metrics.boundedEnergy).length,
    boundedMismatchCount: measuredEntries.filter((entry) => entry.metrics.boundedMismatch).length,
    meanTransmittedProminentPeakCount: round(mean(measuredEntries.map((entry) => entry.metrics.transmittedProminentPeakCount))),
    meanStressFwhmMs: round(mean(measuredEntries.map((entry) => entry.metrics.stressFwhmMs))),
    meanMaxAbsSigmaMismatchPa: round(mean(measuredEntries.map((entry) => entry.metrics.maxAbsSigmaMismatchPa))),
  };
}

function classifyResults(
  summaries: readonly VariantSummary[],
  results: readonly RunResult[],
): Classification {
  const current = requiredSummary(summaries, "current-land-no-se");
  const noZeta = requiredSummary(summaries, "no-zeta-drive-diagnostic");
  const seSummaries = summaries.filter((summary) => summary.variantId.startsWith("series-elastic"));
  const bestSeriesElastic = [...seSummaries].sort((a, b) =>
    b.transmittedSinglePeakCount - a.transmittedSinglePeakCount
    || b.doublePeakReducedCount - a.doublePeakReducedCount
    || a.meanMaxAbsSigmaMismatchPa - b.meanMaxAbsSigmaMismatchPa,
  )[0];
  const currentDoublePeakPoints = current.measuredCount - current.transmittedSinglePeakCount;
  const noZetaDoublePeakPoints = noZeta.measuredCount - noZeta.transmittedSinglePeakCount;
  const seriesSupported =
    !!bestSeriesElastic
    && bestSeriesElastic.measuredCount > 0
    && bestSeriesElastic.okCount === bestSeriesElastic.measuredCount
    && bestSeriesElastic.doublePeakReducedCount >= Math.ceil(bestSeriesElastic.measuredCount * 0.75)
    && bestSeriesElastic.boundedEnergyCount === bestSeriesElastic.measuredCount
    && bestSeriesElastic.boundedMismatchCount >= Math.ceil(bestSeriesElastic.measuredCount * 0.75);
  const inconclusive =
    !!bestSeriesElastic
    && bestSeriesElastic.measuredCount > 0
    && bestSeriesElastic.doublePeakReducedCount > 0
    && !seriesSupported;
  const bestNormalLv = results.find((entry) =>
    entry.variantId === bestSeriesElastic?.variantId && entry.pointId === "normal-hr75" && entry.chamberId === "LV"
  );
  return {
    currentNoSeriesElasticDoublePeakPoints: `${currentDoublePeakPoints}/${current.measuredCount}`,
    noZetaDiagnosticDoublePeakPoints: `${noZetaDoublePeakPoints}/${noZeta.measuredCount}`,
    bestSeriesElasticVariant: bestSeriesElastic
      ? `${bestSeriesElastic.variantId}:singlePeak=${bestSeriesElastic.transmittedSinglePeakCount}/${bestSeriesElastic.measuredCount},reduced=${bestSeriesElastic.doublePeakReducedCount}/${bestSeriesElastic.measuredCount}`
      : "none",
    seriesElasticDecision: seriesSupported
      ? "supported-for-closed-loop-shadow"
      : inconclusive
        ? "inconclusive"
        : "not-supported",
    notes: [
      `Current no-SE transmitted double-peak points: ${currentDoublePeakPoints}/${current.measuredCount}.`,
      `No-zeta synthetic replay transmitted double-peak points: ${noZetaDoublePeakPoints}/${noZeta.measuredCount}.`,
      `Best SeriesElastic normal-HR75 LV transmitted peaks: ${bestNormalLv?.metrics.transmittedProminentPeakCount ?? "missing"}.`,
      `Best SeriesElastic double-peak reduction count: ${bestSeriesElastic?.doublePeakReducedCount ?? 0}/${bestSeriesElastic?.measuredCount ?? 0}.`,
      "Normal-HR90 live user-0 traces were unavailable because the current closure did not settle under the fitFast live-trace extraction.",
      "Replay variants use synthetic calcium and default initial Land state, so they are not source-state-controlled against the live current stress trace.",
      "This is an isolated prescribed-strain bench only; runtime adoption requires a later closed-loop morphology envelope pass.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.seriesElasticDecision === "supported-for-closed-loop-shadow") {
    return [
      "run a closed-loop LV/RV SeriesElasticV1 shadow over the same 8-point gross morphology envelope with legacy atria first",
      "keep LandAtrial AV-plane/effective-wall timing paused until LV/RV PV and MVF/TVF gross morphology are robust",
      "carry energy/mismatch readbacks into the closed-loop shadow sidecar before considering runtime adoption",
    ];
  }
  if (classification.seriesElasticDecision === "inconclusive") {
    return [
      "keep SeriesElasticV1 as a possible component, but do not connect it to runtime as the next standalone adoption candidate",
      "run a fuller DynamicValveTransitionV1/MV-AoV local bench next; this bench is not source-state-controlled enough to justify standalone SE or zeta/tau runtime adoption",
      "carry the live-user0 prescribed-lambda trace harness forward as the positive-control bench input for local valve/load solver work",
      "keep LandAtrial, A1/A2, qDot, root/Zc, Tref, and source-stress tuning out of the ventricular gross morphology fix lane",
    ];
  }
  return [
    "do not connect SeriesElasticV1 to runtime until it shows a decisive isolated-bench signal",
    "if residual failures remain valve-transition-shaped, test a fuller DynamicValveTransitionV1/MV-AoV local bench rather than more tau/limiter sweeps",
    "keep LandAtrial, A1/A2, qDot, root/Zc, Tref, and source-stress tuning out of the ventricular gross morphology fix lane",
  ];
}

function buildLiveTraces(): readonly LiveTrace[] {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return POINTS.flatMap((point) => {
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
    return CHAMBERS.map((chamber) =>
      liveTraceFromSamples(point, chamber.id, measurement?.samples ?? [], settle.ok),
    );
  });
}

function liveTraceFromSamples(
  point: PointSpec,
  chamberId: ChamberId,
  samples: readonly SimSample[],
  settled: boolean,
): LiveTrace {
  const cycleLengthSec = 60 / point.hrBpm;
  const finalBeat = samples.length > 0
    ? samples.filter((sample) => sample.t >= (samples[samples.length - 1]?.t ?? 0) - cycleLengthSec)
    : [];
  const traceSamples = finalBeat
    .map((sample) => {
      const lambda = chamberId === "LV" ? sample.LVFiberLambda : sample.RVFiberLambda;
      const liveActiveStressPa = chamberId === "LV" ? sample.LVActiveFiberStressPa : sample.RVActiveFiberStressPa;
      return {
        phase01: sample.phi - Math.floor(sample.phi),
        lambda: Number(lambda),
        liveActiveStressPa: Math.max(0, Number(liveActiveStressPa)),
      };
    })
    .filter((sample) =>
      Number.isFinite(sample.phase01)
      && Number.isFinite(sample.lambda)
      && Number.isFinite(sample.liveActiveStressPa),
    )
    .sort((left, right) => left.phase01 - right.phase01);
  return {
    pointId: point.id,
    chamberId,
    settled,
    sampleCount: traceSamples.length,
    cycleLengthSec,
    samples: traceSamples,
  };
}

function requiredLiveTrace(
  traces: readonly LiveTrace[],
  pointId: PointId,
  chamberId: ChamberId,
): LiveTrace {
  const trace = traces.find((entry) => entry.pointId === pointId && entry.chamberId === chamberId);
  if (!trace) throw new Error(`Missing live trace for ${pointId}/${chamberId}`);
  return trace;
}

function interpolateLiveTrace(trace: LiveTrace, phase01: number): LiveTraceSample {
  const samples = trace.samples;
  const phase = ((phase01 % 1) + 1) % 1;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) {
    return { phase01: phase, lambda: 1, liveActiveStressPa: 0 };
  }
  let previous = last;
  let next = first;
  let previousPhase = last.phase01 - 1;
  let nextPhase = first.phase01;
  if (phase > last.phase01) {
    previous = last;
    next = first;
    previousPhase = last.phase01;
    nextPhase = first.phase01 + 1;
  } else {
    for (let index = 0; index < samples.length; index += 1) {
      const candidate = samples[index];
      if (!candidate) continue;
      if (candidate.phase01 >= phase) {
        next = candidate;
        previous = samples[index - 1] ?? last;
        previousPhase = samples[index - 1] ? previous.phase01 : last.phase01 - 1;
        nextPhase = candidate.phase01;
        break;
      }
    }
  }
  const denominator = Math.max(1e-9, nextPhase - previousPhase);
  const alpha = clamp((phase - previousPhase) / denominator, 0, 1);
  return {
    phase01: phase,
    lambda: interpolate(previous?.lambda ?? 1, next?.lambda ?? 1, alpha),
    liveActiveStressPa: interpolate(
      previous?.liveActiveStressPa ?? 0,
      next?.liveActiveStressPa ?? 0,
      alpha,
    ),
  };
}

function lambdaAtTime(
  chamber: ChamberSpec,
  point: PointSpec,
  timeSec: number,
  cycleLengthSec: number,
): number {
  return lambdaAtPhase(chamber, point, phaseAtTime(timeSec, cycleLengthSec));
}

function lambdaAtPhase(chamber: ChamberSpec, point: PointSpec, phase01: number): number {
  const preloadShift = (point.preloadScale - 1) * 0.036;
  const initialLambda = chamber.initialLambda + preloadShift;
  const shorteningDelta = chamber.shorteningDelta * point.preloadScale * point.contractilityScale;
  const systolicProgress = smoothStep(
    (phase01 - chamber.systolicOnsetPhase01) / chamber.systolicDuration01,
  );
  const baseShortening = shorteningDelta * systolicProgress;
  const transition =
    chamber.transitionBump
    * point.afterloadTransitionScale
    * Math.exp(-0.5 * square((phase01 - chamber.transitionPhase01) / chamber.transitionWidth01));
  const lateRelaxation =
    -0.35
    * shorteningDelta
    * smoothStep((phase01 - 0.47) / 0.2);
  return initialLambda + baseShortening + transition + lateRelaxation;
}

function prescribedCalciumInput(
  beatIndex: number,
  timeSinceActivationSec: number,
  cycleLengthSec: number,
  contractilityScale: number,
): PrescribedCalciumInput {
  return {
    targetId: "phase5bt-series-elastic-prescribed-ca",
    activationEventId: beatIndex,
    timeSinceActivationSec,
    cycleLengthSec,
    dtSec: DT_SEC,
    activationStrength01: clamp(contractilityScale, 0.6, 1.4),
  };
}

function finalBeatSamples(samples: readonly BenchSample[], cycleLengthSec: number): readonly BenchSample[] {
  const end = samples[samples.length - 1]?.timeSec ?? 0;
  const start = end - cycleLengthSec + 0.5 * DT_SEC;
  return samples.filter((sample) => sample.timeSec >= start);
}

function previousBeatSamples(samples: readonly BenchSample[], cycleLengthSec: number): readonly BenchSample[] {
  const end = samples[samples.length - 1]?.timeSec ?? 0;
  const start = end - 2 * cycleLengthSec + 0.5 * DT_SEC;
  const stop = end - cycleLengthSec + 0.5 * DT_SEC;
  return samples.filter((sample) => sample.timeSec >= start && sample.timeSec < stop);
}

function previewFinalBeat(samples: readonly BenchSample[], cycleLengthSec: number): readonly BenchSample[] {
  const finalBeat = finalBeatSamples(samples, cycleLengthSec);
  if (finalBeat.length <= FINAL_BEAT_PREVIEW_SAMPLES) return finalBeat.map(roundSample);
  const stride = Math.max(1, Math.floor(finalBeat.length / FINAL_BEAT_PREVIEW_SAMPLES));
  return finalBeat.filter((_sample, index) => index % stride === 0).slice(0, FINAL_BEAT_PREVIEW_SAMPLES).map(roundSample);
}

function roundSample(sample: BenchSample): BenchSample {
  return {
    timeSec: round(sample.timeSec),
    phase01: round(sample.phase01),
    freeCalciumUM: round(sample.freeCalciumUM),
    lambdaTotal: round(sample.lambdaTotal),
    lambdaTotalDotPerSec: round(sample.lambdaTotalDotPerSec),
    lambdaSi: round(sample.lambdaSi),
    lambdaSiDotPerSec: round(sample.lambdaSiDotPerSec),
    lambdaSe: round(sample.lambdaSe),
    sigmaCePa: round(sample.sigmaCePa),
    sigmaSePa: round(sample.sigmaSePa),
    sigmaMismatchPa: round(sample.sigmaMismatchPa),
    elasticEnergyJm3: round(sample.elasticEnergyJm3),
    sePowerDensityWPerM3: round(sample.sePowerDensityWPerM3),
    seDissipationDensityWPerM3: round(sample.seDissipationDensityWPerM3),
  };
}

function localPeakCount(values: readonly number[]): number {
  return localPeaks(values).length;
}

function prominentPeakCount(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 3) return 0;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min;
  if (!(range > 0)) return 0;
  return localPeaks(values).filter((index) => {
    const value = values[index] ?? Number.NaN;
    const leftMin = Math.min(...values.slice(Math.max(0, index - 35), index + 1));
    const rightMin = Math.min(...values.slice(index, Math.min(values.length, index + 36)));
    const prominence = value - Math.max(leftMin, rightMin);
    return value > min + 0.24 * range && prominence > 0.08 * range;
  }).length;
}

function localPeaks(values: readonly number[]): number[] {
  const peaks: number[] = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    const previous = values[index - 1] ?? Number.NaN;
    const current = values[index] ?? Number.NaN;
    const next = values[index + 1] ?? Number.NaN;
    if (Number.isFinite(current) && current > previous && current >= next) peaks.push(index);
  }
  return peaks;
}

function widthAtFractionMs(times: readonly number[], values: readonly number[], fraction: number): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return Number.NaN;
  const baseline = Math.min(...finite);
  const peak = Math.max(...finite);
  const threshold = baseline + fraction * (peak - baseline);
  const activeTimes = times.filter((time, index) => (values[index] ?? Number.NEGATIVE_INFINITY) >= threshold);
  if (activeTimes.length < 2) return 0;
  return (activeTimes[activeTimes.length - 1] - activeTimes[0]) * 1000;
}

function timeToPeakMs(times: readonly number[], values: readonly number[]): number {
  let peak = Number.NEGATIVE_INFINITY;
  let peakTime = Number.NaN;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index] ?? Number.NaN;
    if (Number.isFinite(value) && value > peak) {
      peak = value;
      peakTime = times[index] ?? Number.NaN;
    }
  }
  return peakTime * 1000;
}

function periodShapeDistance(
  previousBeat: readonly BenchSample[],
  finalBeat: readonly BenchSample[],
): number {
  const count = Math.min(previousBeat.length, finalBeat.length);
  if (count < 10) return Number.NaN;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < count; index += 1) {
    const a = previousBeat[index]?.sigmaSePa ?? 0;
    const b = finalBeat[index]?.sigmaSePa ?? 0;
    numerator += square(a - b);
    denominator += square(b);
  }
  return Math.sqrt(numerator / Math.max(1, denominator));
}

function seriesElasticParams(
  stiffnessPa: number,
  dampingPaSec: number,
): SeriesElasticFiberParameters {
  return {
    ...DEFAULT_SERIES_ELASTIC_FIBER_PARAMETERS,
    seriesStiffnessPa: stiffnessPa,
    seriesDampingPaSec: dampingPaSec,
    landSolveOptions: LAND_SOLVE_OPTIONS,
  };
}

function parameterDigest(params: SeriesElasticFiberParameters): SeriesElasticParameterDigest {
  return {
    seriesStiffnessPa: params.seriesStiffnessPa,
    seriesDampingPaSec: params.seriesDampingPaSec,
    referenceLambdaSe: params.referenceLambdaSe,
    maxLambdaSeAbs: params.maxLambdaSeAbs,
    maxForceBalanceIterations: params.maxForceBalanceIterations,
    forceBalanceTolerancePa: params.forceBalanceTolerancePa,
  };
}

function requiredSummary(
  summaries: readonly VariantSummary[],
  id: VariantId,
): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5BT summary for ${id}`);
  return summary;
}

function phaseAtTime(timeSec: number, cycleLengthSec: number): number {
  return ((timeSec % cycleLengthSec) + cycleLengthSec) % cycleLengthSec / cycleLengthSec;
}

function smoothStep(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function square(value: number): number {
  return value * value;
}

function interpolate(left: number, right: number, alpha: number): number {
  return left + (right - left) * alpha;
}

function maxFinite(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function integrate(values: readonly number[], dtSec: number): number {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0) * dtSec, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

export function writeSeriesElasticBenchPhase5BTEvidence(): Evidence {
  const evidence = buildSeriesElasticBenchPhase5BTEvidence();
  const outPath = path.resolve(process.cwd(), SERIES_ELASTIC_BENCH_PHASE5BT_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeSeriesElasticBenchPhase5BTEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
