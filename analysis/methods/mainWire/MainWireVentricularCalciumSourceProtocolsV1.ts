import land2017Figure6Trace from "@/data/myocardium/source-traces/land2017-figure6-coppini-calcium-trace-v1.json";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_V1_ID =
  "main-wire-ventricular-calcium-source-protocols-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOL_IDS_V1 =
  Object.freeze([
    "land2015-coppini-metric-hunter-construction",
    "land2017-figure6-coppini-digitized",
  ] as const);

export type MainWireVentricularCalciumSourceProtocolIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOL_IDS_V1)[number];

export type MainWireVentricularLandIsometricCalciumInputV1 = Readonly<{
  calciumInputId: string;
  calciumInputKind:
    | "current-analytic-reconstruction"
    | "published-analytic-source-construction"
    | "figure-digitized-source-trace"
    | "primary-repository-numeric-source-trace"
    | "primary-repository-shape-amplitude-bracket";
  cycleLengthSec: number;
  diastolicCalciumUM: number;
  electricalToCalciumDelaySec: number | null;
  sourceDoi: string;
  sourceDescription: string;
  originalNumericSourceTraceUsed: boolean;
  figureDigitizationUsed: boolean;
  smoothingApplied: boolean;
  fittingApplied: boolean;
  evaluateFreeCalciumUM: (timeSec: number) => number;
}>;

export type MainWireVentricularCalciumSourceProtocolV1 = Readonly<{
  protocolId: MainWireVentricularCalciumSourceProtocolIdV1;
  calciumInputKind: Exclude<
    MainWireVentricularLandIsometricCalciumInputV1["calciumInputKind"],
    "current-analytic-reconstruction"
  >;
  cycleLengthSec: 1;
  diastolicCalciumUM: number;
  electricalToCalciumDelaySec: null;
  sourceDoi: string;
  sourceDescription: string;
  comparisonRole:
    | "independent-published-Coppini-metric-construction-not-Land2017-Figure6"
    | "Land2017-Figure6-centerline-digitization";
  originalNumericSourceTraceUsed: false;
  figureDigitizationUsed: boolean;
  smoothingApplied: false;
  fittingApplied: false;
}>;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_CLAIM_V1 =
  Object.freeze({
    role: "offline-source-audit-inputs" as const,
    exactModelStateOrCheckpointChanged: false as const,
    sourceProtocolsUsedByCanonicalModel: false as const,
    sourceProtocolParameterSearchOrFitting: false as const,
    land2015Protocol:
      "published-piecewise-C0-Hunter-construction-using-Coppini-summary-metrics" as const,
    land2017Protocol:
      "Figure-6-centerline-digitization-not-author-supplied-numeric-trace" as const,
    figureDigitizationSmoothingApplied: false as const,
    figureDigitizationCurveFittingApplied: false as const,
    sourceMeasurementUncertaintyAvailable: false as const,
    clinicalValidationClaimed: false as const,
  });

export const LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1 = Object.freeze({
  sourceDoi: "10.1371/journal.pcbi.1004376" as const,
  diastolicCalciumUM: 0.1399,
  transientMagnitudeUM: 0.3431,
  timeToPeakSec: 0.0482,
  reportedTimeTo50PercentRelaxationSec: 0.1759,
  reportedTimeTo90PercentRelaxationSec: 0.3431,
  linearTailStartSec: 2 * 0.3431,
  formula:
    "published-piecewise-C0-Hunter-pulses-followed-by-linear-periodic-tail" as const,
});

const HUNTER_DESCENDING_HALF_NORMALIZED_TIME =
  solveHunterDescendingNormalizedTime(0.5);
const HUNTER_DESCENDING_TENTH_NORMALIZED_TIME =
  solveHunterDescendingNormalizedTime(0.1);
const LAND2015_FIRST_DECAY_TIME_CONSTANT_SEC = (
  LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
    .reportedTimeTo50PercentRelaxationSec
  - LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.timeToPeakSec
) / (HUNTER_DESCENDING_HALF_NORMALIZED_TIME - 1);
const LAND2015_FIRST_DECAY_TIME_SHIFT_SEC =
  LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.timeToPeakSec
  - LAND2015_FIRST_DECAY_TIME_CONSTANT_SEC;
const LAND2015_SECOND_DECAY_TIME_CONSTANT_SEC = (
  LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
    .reportedTimeTo90PercentRelaxationSec
  - LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
    .reportedTimeTo50PercentRelaxationSec
) / (
  HUNTER_DESCENDING_TENTH_NORMALIZED_TIME
  - HUNTER_DESCENDING_HALF_NORMALIZED_TIME
);
const LAND2015_SECOND_DECAY_TIME_SHIFT_SEC =
  LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1
    .reportedTimeTo50PercentRelaxationSec
  - HUNTER_DESCENDING_HALF_NORMALIZED_TIME
  * LAND2015_SECOND_DECAY_TIME_CONSTANT_SEC;

const LAND2017_FIGURE6_SAMPLES_UM = Object.freeze([
  ...land2017Figure6Trace.freeCalciumUM,
]);

const LAND2017_FIGURE6_SAMPLE_INTERVAL_SEC =
  land2017Figure6Trace.digitization.uniformSampleIntervalSec;

const LAND2017_FIGURE6_CYCLE_LENGTH_SEC =
  land2017Figure6Trace.digitization.periodicCycleLengthSec;

const LAND2017_FIGURE6_MINIMUM_CALCIUM_UM = minimum(
  LAND2017_FIGURE6_SAMPLES_UM,
);

validateLand2017Figure6Trace();

const SOURCE_PROTOCOLS = Object.freeze({
  "land2015-coppini-metric-hunter-construction": Object.freeze({
    protocolId: "land2015-coppini-metric-hunter-construction" as const,
    calciumInputKind: "published-analytic-source-construction" as const,
    cycleLengthSec: 1 as const,
    diastolicCalciumUM:
      LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.diastolicCalciumUM,
    electricalToCalciumDelaySec: null,
    sourceDoi: LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1.sourceDoi,
    sourceDescription:
      "Coppini summary-metric calcium transient constructed with the published Hunter formula",
    comparisonRole:
      "independent-published-Coppini-metric-construction-not-Land2017-Figure6" as const,
    originalNumericSourceTraceUsed: false as const,
    figureDigitizationUsed: false as const,
    smoothingApplied: false as const,
    fittingApplied: false as const,
  }),
  "land2017-figure6-coppini-digitized": Object.freeze({
    protocolId: "land2017-figure6-coppini-digitized" as const,
    calciumInputKind: "figure-digitized-source-trace" as const,
    cycleLengthSec: 1 as const,
    diastolicCalciumUM: LAND2017_FIGURE6_MINIMUM_CALCIUM_UM,
    electricalToCalciumDelaySec: null,
    sourceDoi: land2017Figure6Trace.source.doi,
    sourceDescription:
      "Land 2017 Figure 6 left-panel calcium centerline digitization",
    comparisonRole: "Land2017-Figure6-centerline-digitization" as const,
    originalNumericSourceTraceUsed: false as const,
    figureDigitizationUsed: true as const,
    smoothingApplied: false as const,
    fittingApplied: false as const,
  }),
} satisfies Readonly<
  Record<
    MainWireVentricularCalciumSourceProtocolIdV1,
    MainWireVentricularCalciumSourceProtocolV1
  >
>);

export function resolveMainWireVentricularCalciumSourceProtocolV1(
  protocolId: MainWireVentricularCalciumSourceProtocolIdV1,
): MainWireVentricularCalciumSourceProtocolV1 {
  const protocol = SOURCE_PROTOCOLS[protocolId];
  if (protocol === undefined) {
    throw new Error(`unknown ventricular calcium source protocol: ${protocolId}`);
  }
  return protocol;
}

export function createMainWireVentricularCalciumSourceAuditInputV1(
  protocolId: MainWireVentricularCalciumSourceProtocolIdV1,
): MainWireVentricularLandIsometricCalciumInputV1 {
  const protocol = resolveMainWireVentricularCalciumSourceProtocolV1(
    protocolId,
  );
  return Object.freeze({
    calciumInputId: protocol.protocolId,
    calciumInputKind: protocol.calciumInputKind,
    cycleLengthSec: protocol.cycleLengthSec,
    diastolicCalciumUM: protocol.diastolicCalciumUM,
    electricalToCalciumDelaySec: protocol.electricalToCalciumDelaySec,
    sourceDoi: protocol.sourceDoi,
    sourceDescription: protocol.sourceDescription,
    originalNumericSourceTraceUsed: protocol.originalNumericSourceTraceUsed,
    figureDigitizationUsed: protocol.figureDigitizationUsed,
    smoothingApplied: protocol.smoothingApplied,
    fittingApplied: protocol.fittingApplied,
    evaluateFreeCalciumUM: (timeSec: number) =>
      evaluateMainWireVentricularCalciumSourceProtocolV1(
        timeSec,
        protocol.protocolId,
      ),
  });
}

export function evaluateMainWireVentricularCalciumSourceProtocolV1(
  timeSec: number,
  protocolId: MainWireVentricularCalciumSourceProtocolIdV1,
): number {
  if (!Number.isFinite(timeSec)) {
    throw new Error("ventricular calcium source protocol time must be finite");
  }
  const phaseSec = positiveModulo(timeSec, 1);
  if (protocolId === "land2015-coppini-metric-hunter-construction") {
    const source = LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1;
    if (phaseSec < source.timeToPeakSec) {
      return evaluateHunterCalciumPulse(
        phaseSec,
        source.timeToPeakSec,
      );
    }
    if (phaseSec < source.reportedTimeTo50PercentRelaxationSec) {
      return evaluateHunterCalciumPulse(
        phaseSec - LAND2015_FIRST_DECAY_TIME_SHIFT_SEC,
        LAND2015_FIRST_DECAY_TIME_CONSTANT_SEC,
      );
    }
    if (phaseSec < source.linearTailStartSec) {
      return evaluateHunterCalciumPulse(
        phaseSec - LAND2015_SECOND_DECAY_TIME_SHIFT_SEC,
        LAND2015_SECOND_DECAY_TIME_CONSTANT_SEC,
      );
    }
    const tailStartCalciumUM = evaluateHunterCalciumPulse(
      source.linearTailStartSec - LAND2015_SECOND_DECAY_TIME_SHIFT_SEC,
      LAND2015_SECOND_DECAY_TIME_CONSTANT_SEC,
    );
    const tailFraction = (phaseSec - source.linearTailStartSec)
      / (1 - source.linearTailStartSec);
    return tailStartCalciumUM
      + tailFraction * (source.diastolicCalciumUM - tailStartCalciumUM);
  }
  if (protocolId === "land2017-figure6-coppini-digitized") {
    const position = phaseSec / LAND2017_FIGURE6_SAMPLE_INTERVAL_SEC;
    const leftIndex = Math.floor(position)
      % LAND2017_FIGURE6_SAMPLES_UM.length;
    const rightIndex = (leftIndex + 1) % LAND2017_FIGURE6_SAMPLES_UM.length;
    const fraction = position - Math.floor(position);
    return (1 - fraction) * LAND2017_FIGURE6_SAMPLES_UM[leftIndex]!
      + fraction * LAND2017_FIGURE6_SAMPLES_UM[rightIndex]!;
  }
  throw new Error(`unknown ventricular calcium source protocol: ${protocolId}`);
}

function validateLand2017Figure6Trace(): void {
  if (
    land2017Figure6Trace.schemaVersion !== 1
    || land2017Figure6Trace.traceId
      !== "land2017-figure6-coppini-calcium-trace-v1"
    || LAND2017_FIGURE6_SAMPLE_INTERVAL_SEC !== 0.001
    || LAND2017_FIGURE6_CYCLE_LENGTH_SEC !== 1
    || LAND2017_FIGURE6_SAMPLES_UM.length !== 1000
    || land2017Figure6Trace.digitization.sampleCount
      !== LAND2017_FIGURE6_SAMPLES_UM.length
  ) throw new Error("Land 2017 Figure 6 calcium trace identity mismatch");
  if (LAND2017_FIGURE6_SAMPLES_UM.some((value) =>
    !(value > 0) || !Number.isFinite(value))) {
    throw new Error("Land 2017 Figure 6 calcium trace requires positive samples");
  }
  const maximumCalciumUM = maximum(LAND2017_FIGURE6_SAMPLES_UM);
  const maximumIndex = LAND2017_FIGURE6_SAMPLES_UM.indexOf(maximumCalciumUM);
  const readback = land2017Figure6Trace.extractionReadback;
  if (
    Math.abs(LAND2017_FIGURE6_MINIMUM_CALCIUM_UM
      - readback.minimumCalciumUM) > 0.5e-6
    || Math.abs(maximumCalciumUM - readback.maximumCalciumUM) > 0.5e-6
    || maximumIndex * LAND2017_FIGURE6_SAMPLE_INTERVAL_SEC
      !== readback.maximumSampleTimeSec
  ) throw new Error("Land 2017 Figure 6 calcium trace readback mismatch");
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function evaluateHunterCalciumPulse(
  timeSec: number,
  timeConstantSec: number,
): number {
  const source = LAND2015_COPPINI_HUNTER_CONSTRUCTION_V1;
  const normalizedTime = timeSec / timeConstantSec;
  return source.diastolicCalciumUM
    + source.transientMagnitudeUM
    * normalizedTime
    * Math.exp(1 - normalizedTime);
}

function solveHunterDescendingNormalizedTime(
  targetFraction: number,
): number {
  if (!(targetFraction > 0 && targetFraction < 1)) {
    throw new Error("Hunter descending target fraction must be in (0, 1)");
  }
  let lower = 1;
  let upper = 20;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const middle = 0.5 * (lower + upper);
    const fraction = middle * Math.exp(1 - middle);
    if (fraction > targetFraction) lower = middle;
    else upper = middle;
  }
  return 0.5 * (lower + upper);
}

function minimum(values: readonly number[]): number {
  let result = Number.POSITIVE_INFINITY;
  for (const value of values) result = Math.min(result, value);
  if (!Number.isFinite(result)) throw new Error("minimum requires values");
  return result;
}

function maximum(values: readonly number[]): number {
  let result = Number.NEGATIVE_INFINITY;
  for (const value of values) result = Math.max(result, value);
  if (!Number.isFinite(result)) throw new Error("maximum requires values");
  return result;
}
