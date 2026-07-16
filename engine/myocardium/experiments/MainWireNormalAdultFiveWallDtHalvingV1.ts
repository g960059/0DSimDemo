import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicInitializationV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultLaSlsModeV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_V1_ID =
  "main-wire-normal-adult-five-wall-dt-halving-difference-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_SIGNAL_SCALES_V1 =
  Object.freeze({
    laBloodVolumeMl: 100,
    lvBloodVolumeMl: 150,
    laAbsolutePressureMmHg: 10,
    lvAbsolutePressureMmHg: 100,
    mitralFlowMlPerSec: 500,
    pulmonaryVeinToLaFlowMlPerSec: 500,
    laTotalWallStressPa: 100_000,
    laFiberLogStrain: 0.1,
  } as const);

export type MainWireNormalAdultFiveWallDtHalvingSignalIdV1 =
  keyof typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_SIGNAL_SCALES_V1;

export type MainWireNormalAdultFiveWallDtHalvingSignalUnitV1 =
  | "mL"
  | "mmHg"
  | "mL/s"
  | "Pa"
  | "log-strain";

export type MainWireNormalAdultFiveWallDtHalvingSignalMetricV1 = Readonly<{
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1;
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1;
  referenceScale: number;
  maximumAbsoluteDifference: number;
  fixedScaleNormalizedMaximumDifference: number;
  /** Fine-grid discrete L2 norm is the denominator; null means it is zero. */
  relativeL2Difference: number | null;
  worstCoarseAcceptedSampleIndex: number;
  worstFineAcceptedSampleIndex: number;
  worstCyclePhase01: number;
}>;

export type MainWireNormalAdultFiveWallDtHalvingInterpretabilityReasonV1 =
  | "fine-dt-is-not-half-coarse-dt"
  | "steps-per-beat-are-not-two-to-one"
  | "la-sls-mode-mismatch"
  | "initialization-mismatch"
  | "maximum-beat-count-mismatch"
  | "coarse-period1-not-converged"
  | "fine-period1-not-converged"
  | "coarse-final-complete-beat-missing-or-incomplete"
  | "fine-final-complete-beat-missing-or-incomplete"
  | "common-accepted-grid-phase-mismatch";

export type MainWireNormalAdultFiveWallDtHalvingComparisonV1 = Readonly<{
  comparisonId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_V1_ID;
  coarseDtSec: number;
  fineDtSec: number;
  fineAcceptedStepsPerCoarseAcceptedStep: 2 | null;
  coarseFinalBeatIndex: number | null;
  fineFinalBeatIndex: number | null;
  bothPeriod1Converged: boolean;
  interpretable: boolean;
  interpretabilityReasons:
    readonly MainWireNormalAdultFiveWallDtHalvingInterpretabilityReasonV1[];
  commonAcceptedSampleMapping: readonly Readonly<{
    coarseAcceptedSampleIndex: number;
    fineAcceptedSampleIndex: number;
    cyclePhase01: number;
  }>[];
  signalMetrics: Readonly<Record<
    MainWireNormalAdultFiveWallDtHalvingSignalIdV1,
    MainWireNormalAdultFiveWallDtHalvingSignalMetricV1
  >> | null;
  claim: Readonly<{
    comparisonKind: "dt-halving-difference-not-convergence-order";
    fineGridUsedAsDifferenceReference: true;
    interpolationApplied: false;
    comparedBeat: "last-retained-complete-period1-beat-only";
    physiologicalOrNumericalPassThresholdApplied: false;
    parameterSearch: false;
  }>;
}>;

export type MainWireNormalAdultFiveWallDtHalvingRunOptionsV1 = Readonly<{
  coarseDtSec: number;
  maximumBeatCount?: number;
  laSlsMode?: MainWireNormalAdultLaSlsModeV1;
  initialization?: MainWireNormalAdultFiveWallPeriodicInitializationV1;
}>;

export type MainWireNormalAdultFiveWallDtHalvingRunResultV1 = Readonly<{
  experimentId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_V1_ID;
  coarse: MainWireNormalAdultFiveWallPeriodicResultV1;
  fine: MainWireNormalAdultFiveWallPeriodicResultV1;
  comparison: MainWireNormalAdultFiveWallDtHalvingComparisonV1;
}>;

type SignalDefinition = Readonly<{
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1;
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1;
  referenceScale: number;
  read(sample: MainWireNormalAdultFiveWallDiagnosticSampleV2): number;
}>;

const SIGNAL_DEFINITIONS: readonly SignalDefinition[] = Object.freeze([
  signal("laBloodVolumeMl", "mL", (sample) => sample.nodeVolumeMl.LA),
  signal("lvBloodVolumeMl", "mL", (sample) => sample.nodeVolumeMl.LV),
  signal("laAbsolutePressureMmHg", "mmHg", (sample) =>
    sample.nodeAbsolutePressureMmHg.LA),
  signal("lvAbsolutePressureMmHg", "mmHg", (sample) =>
    sample.nodeAbsolutePressureMmHg.LV),
  signal("mitralFlowMlPerSec", "mL/s", (sample) =>
    sample.flowMlPerSec.MV),
  signal("pulmonaryVeinToLaFlowMlPerSec", "mL/s", (sample) =>
    sample.flowMlPerSec.PVein_LA),
  signal("laTotalWallStressPa", "Pa", (sample) =>
    sample.wallStressPa.LA.total),
  signal("laFiberLogStrain", "log-strain", (sample) =>
    sample.wallFiberLogStrain.LA),
]);

/**
 * Compares accepted samples at the common points of a strict 2:1 nested grid.
 * It neither interpolates nor estimates a convergence order from two grids.
 */
export function compareMainWireNormalAdultFiveWallDtHalvingV1(
  coarse: MainWireNormalAdultFiveWallPeriodicResultV1,
  fine: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallDtHalvingComparisonV1 {
  validateResultGridMetadata(coarse, "coarse");
  validateResultGridMetadata(fine, "fine");
  const reasons: MainWireNormalAdultFiveWallDtHalvingInterpretabilityReasonV1[] = [];
  const dtHalved = nearlyEqual(coarse.dtSec, 2 * fine.dtSec);
  if (!dtHalved) reasons.push("fine-dt-is-not-half-coarse-dt");
  const stepsNested = fine.stepsPerBeat === 2 * coarse.stepsPerBeat;
  if (!stepsNested) reasons.push("steps-per-beat-are-not-two-to-one");
  if (coarse.laSlsMode !== fine.laSlsMode) reasons.push("la-sls-mode-mismatch");
  if (coarse.initialization !== fine.initialization) {
    reasons.push("initialization-mismatch");
  }
  if (coarse.requestedMaximumBeatCount !== fine.requestedMaximumBeatCount) {
    reasons.push("maximum-beat-count-mismatch");
  }
  if (!coarse.periodicSteadyStateClaimed) {
    reasons.push("coarse-period1-not-converged");
  }
  if (!fine.periodicSteadyStateClaimed) {
    reasons.push("fine-period1-not-converged");
  }
  const coarseBeat = coarse.retainedCompleteBeats.at(-1) ?? null;
  const fineBeat = fine.retainedCompleteBeats.at(-1) ?? null;
  if (coarseBeat === null || coarseBeat.samples.length !== coarse.stepsPerBeat) {
    reasons.push("coarse-final-complete-beat-missing-or-incomplete");
  }
  if (fineBeat === null || fineBeat.samples.length !== fine.stepsPerBeat) {
    reasons.push("fine-final-complete-beat-missing-or-incomplete");
  }

  let mapping: MainWireNormalAdultFiveWallDtHalvingComparisonV1[
    "commonAcceptedSampleMapping"
  ] = Object.freeze([]);
  if (dtHalved && stepsNested && coarseBeat !== null && fineBeat !== null
      && coarseBeat.samples.length === coarse.stepsPerBeat
      && fineBeat.samples.length === fine.stepsPerBeat) {
    const candidate = coarseBeat.samples.map((coarseSample, coarseIndex) => {
      const fineIndex = 2 * (coarseIndex + 1) - 1;
      const fineSample = fineBeat.samples[fineIndex]!;
      return Object.freeze({
        coarseAcceptedSampleIndex: coarseIndex,
        fineAcceptedSampleIndex: fineIndex,
        cyclePhase01: coarseSample.cyclePhase01,
        phaseDifference: circularPhaseDifference(
          coarseSample.cyclePhase01,
          fineSample.cyclePhase01,
        ),
      });
    });
    if (candidate.some((entry) => entry.phaseDifference > 1e-10)) {
      reasons.push("common-accepted-grid-phase-mismatch");
    } else {
      mapping = Object.freeze(candidate.map(({ phaseDifference: _ignored, ...entry }) =>
        Object.freeze(entry)));
    }
  }

  const interpretable = reasons.length === 0;
  const signalMetrics = interpretable && coarseBeat !== null && fineBeat !== null
    ? compareSignals(coarseBeat.samples, fineBeat.samples, mapping)
    : null;
  return Object.freeze({
    comparisonId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_V1_ID,
    coarseDtSec: coarse.dtSec,
    fineDtSec: fine.dtSec,
    fineAcceptedStepsPerCoarseAcceptedStep: dtHalved && stepsNested ? 2 : null,
    coarseFinalBeatIndex: coarseBeat?.beatIndex ?? null,
    fineFinalBeatIndex: fineBeat?.beatIndex ?? null,
    bothPeriod1Converged:
      coarse.periodicSteadyStateClaimed && fine.periodicSteadyStateClaimed,
    interpretable,
    interpretabilityReasons: Object.freeze(reasons),
    commonAcceptedSampleMapping: mapping,
    signalMetrics,
    claim: Object.freeze({
      comparisonKind: "dt-halving-difference-not-convergence-order" as const,
      fineGridUsedAsDifferenceReference: true as const,
      interpolationApplied: false as const,
      comparedBeat: "last-retained-complete-period1-beat-only" as const,
      physiologicalOrNumericalPassThresholdApplied: false as const,
      parameterSearch: false as const,
    }),
  });
}

/** Runs identical cases at dt and dt/2, then applies the pure comparison. */
export function runMainWireNormalAdultFiveWallDtHalvingV1(
  options: MainWireNormalAdultFiveWallDtHalvingRunOptionsV1,
): MainWireNormalAdultFiveWallDtHalvingRunResultV1 {
  if (!(options.coarseDtSec > 0) || !Number.isFinite(options.coarseDtSec)) {
    throw new Error("coarseDtSec must be positive and finite");
  }
  const shared = Object.freeze({
    maximumBeatCount: options.maximumBeatCount,
    laSlsMode: options.laSlsMode,
    initialization: options.initialization,
  });
  const coarse = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
    ...shared,
    dtSec: options.coarseDtSec,
  });
  const fine = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
    ...shared,
    dtSec: options.coarseDtSec / 2,
  });
  return Object.freeze({
    experimentId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_V1_ID,
    coarse,
    fine,
    comparison: compareMainWireNormalAdultFiveWallDtHalvingV1(coarse, fine),
  });
}

function compareSignals(
  coarseSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  fineSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  mapping: MainWireNormalAdultFiveWallDtHalvingComparisonV1[
    "commonAcceptedSampleMapping"
  ],
): NonNullable<MainWireNormalAdultFiveWallDtHalvingComparisonV1["signalMetrics"]> {
  return Object.freeze(Object.fromEntries(SIGNAL_DEFINITIONS.map((definition) => {
    let maximumAbsoluteDifference = -1;
    let worstMappingIndex = 0;
    let squaredDifferenceSum = 0;
    let squaredFineSum = 0;
    mapping.forEach((entry, mappingIndex) => {
      const coarseValue = requireFinite(
        definition.read(coarseSamples[entry.coarseAcceptedSampleIndex]!),
        `${definition.signalId} coarse value`,
      );
      const fineValue = requireFinite(
        definition.read(fineSamples[entry.fineAcceptedSampleIndex]!),
        `${definition.signalId} fine value`,
      );
      const difference = coarseValue - fineValue;
      const absoluteDifference = Math.abs(difference);
      if (absoluteDifference > maximumAbsoluteDifference) {
        maximumAbsoluteDifference = absoluteDifference;
        worstMappingIndex = mappingIndex;
      }
      squaredDifferenceSum += difference * difference;
      squaredFineSum += fineValue * fineValue;
    });
    if (!Number.isFinite(squaredDifferenceSum) || !Number.isFinite(squaredFineSum)) {
      throw new Error(`${definition.signalId} L2 accumulation must be finite`);
    }
    const worst = mapping[worstMappingIndex]!;
    const relativeL2Difference = squaredFineSum === 0
      ? squaredDifferenceSum === 0 ? 0 : null
      : Math.sqrt(squaredDifferenceSum / squaredFineSum);
    const metric: MainWireNormalAdultFiveWallDtHalvingSignalMetricV1 =
      Object.freeze({
        signalId: definition.signalId,
        unit: definition.unit,
        referenceScale: definition.referenceScale,
        maximumAbsoluteDifference,
        fixedScaleNormalizedMaximumDifference:
          maximumAbsoluteDifference / definition.referenceScale,
        relativeL2Difference,
        worstCoarseAcceptedSampleIndex: worst.coarseAcceptedSampleIndex,
        worstFineAcceptedSampleIndex: worst.fineAcceptedSampleIndex,
        worstCyclePhase01: worst.cyclePhase01,
      });
    return [definition.signalId, metric];
  }))) as NonNullable<
    MainWireNormalAdultFiveWallDtHalvingComparisonV1["signalMetrics"]
  >;
}

function signal(
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1,
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1,
  read: SignalDefinition["read"],
): SignalDefinition {
  return Object.freeze({
    signalId,
    unit,
    referenceScale:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_SIGNAL_SCALES_V1[signalId],
    read,
  });
}

function validateResultGridMetadata(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  label: string,
): void {
  if (!(result.dtSec > 0) || !Number.isFinite(result.dtSec)) {
    throw new Error(`${label} dtSec must be positive and finite`);
  }
  if (!Number.isInteger(result.stepsPerBeat) || result.stepsPerBeat <= 0) {
    throw new Error(`${label} stepsPerBeat must be a positive integer`);
  }
}

function circularPhaseDifference(a: number, b: number): number {
  requirePhase(a, "coarse cycle phase");
  requirePhase(b, "fine cycle phase");
  const raw = Math.abs(a - b);
  return Math.min(raw, Math.abs(1 - raw));
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePhase(value: number, label: string): number {
  requireFinite(value, label);
  if (!(value >= 0 && value < 1)) {
    throw new Error(`${label} must be in [0, 1)`);
  }
  return value;
}
