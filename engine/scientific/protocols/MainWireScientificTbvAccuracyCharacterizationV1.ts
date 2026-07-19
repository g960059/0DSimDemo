import {
  MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1,
  type MainWireScientificFastTbvPreviewLaneV1,
} from "@/engine/scientific/protocols/MainWireScientificFastTbvPreviewV1";

export const MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_V1_ID =
  "main-wire-scientific-rapid-vs-canonical-tbv-accuracy-characterization-v1" as const;

export type MainWireScientificTbvAccuracyMetricV1 =
  | "mean-rap-transmural"
  | "mean-lap-transmural"
  | "net-cardiac-output"
  | "forward-cardiac-output"
  | "lv-end-diastolic-volume"
  | "lv-end-diastolic-transmural-pressure"
  | "lv-end-systolic-volume"
  | "lv-end-systolic-transmural-pressure"
  | "lv-stroke-work";

export type MainWireScientificTbvAccuracyTbvBinV1 =
  | "severe-low-volume"
  | "low-volume"
  | "near-baseline"
  | "high-volume"
  | "severe-high-volume";

export type MainWireScientificTbvAccuracyObservationV1 = Readonly<
  Record<MainWireScientificTbvAccuracyMetricV1, number | null>
>;

type MetricDefinitionV1 = Readonly<{
  unit: "mmHg" | "L/min" | "mL" | "mmHg*mL";
  relativeDenominatorFloor: number;
}>;

export const MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_METRIC_DEFINITIONS_V1 =
  Object.freeze({
    "mean-rap-transmural": Object.freeze({
      unit: "mmHg" as const,
      relativeDenominatorFloor: 1,
    }),
    "mean-lap-transmural": Object.freeze({
      unit: "mmHg" as const,
      relativeDenominatorFloor: 1,
    }),
    "net-cardiac-output": Object.freeze({
      unit: "L/min" as const,
      relativeDenominatorFloor: 0.1,
    }),
    "forward-cardiac-output": Object.freeze({
      unit: "L/min" as const,
      relativeDenominatorFloor: 0.1,
    }),
    "lv-end-diastolic-volume": Object.freeze({
      unit: "mL" as const,
      relativeDenominatorFloor: 1,
    }),
    "lv-end-diastolic-transmural-pressure": Object.freeze({
      unit: "mmHg" as const,
      relativeDenominatorFloor: 1,
    }),
    "lv-end-systolic-volume": Object.freeze({
      unit: "mL" as const,
      relativeDenominatorFloor: 1,
    }),
    "lv-end-systolic-transmural-pressure": Object.freeze({
      unit: "mmHg" as const,
      relativeDenominatorFloor: 1,
    }),
    "lv-stroke-work": Object.freeze({
      unit: "mmHg*mL" as const,
      relativeDenominatorFloor: 100,
    }),
  }) satisfies Readonly<
    Record<MainWireScientificTbvAccuracyMetricV1, MetricDefinitionV1>
  >;

const METRICS = Object.freeze(
  Object.keys(
    MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_METRIC_DEFINITIONS_V1,
  ) as MainWireScientificTbvAccuracyMetricV1[],
);

export const MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1 =
  Object.freeze({
    policyId:
      "main-wire-scientific-tbv-accuracy-characterization-policy-v1" as const,
    role: "scientific-characterization-not-acceptance" as const,
    errorSignConvention: "rapid-minus-canonical-p1" as const,
    relativeErrorSemantics:
      "absolute-error-divided-by-max-absolute-canonical-reference-and-metric-floor" as const,
    pressureRelativeErrorCaveat:
      "Pressure relative errors use a 1 mmHg denominator floor; inspect absolute mmHg error when the canonical pressure is small." as const,
    baselineHandling:
      "separate-canonical-p1-reference-not-a-rapid-error-pair" as const,
    fixedRapidTargetCount: 9,
    tbvBins: Object.freeze({
      severeLowMaximumScaleInclusive: 0.7,
      lowMaximumScaleExclusive: 0.95,
      nearBaselineMaximumScaleInclusive: 1.1,
      highMaximumScaleInclusive: 1.25,
    }),
  });

export type MainWireScientificTbvAccuracyBaselineV1 = Readonly<{
  role: "canonical-source-baseline-reference";
  targetScale: 1;
  fixedTotalBloodVolumeMl: number;
  canonicalStatus: "period1-converged";
  completedBeatCount: number;
  wallClockMs: number;
  observation: MainWireScientificTbvAccuracyObservationV1;
}>;

export type MainWireScientificTbvAccuracyPairInputV1 = Readonly<{
  pairId: string;
  targetId: string;
  lane: MainWireScientificFastTbvPreviewLaneV1;
  targetOrdinal: number;
  targetScale: number;
  fixedTotalBloodVolumeMl: number;
  rapid: Readonly<{
    evidenceClass:
      | "near-period1-estimate"
      | "finite-hold-unclassified"
      | "failure";
    completedNaturalBeatCount: number;
    wallClockMs: number;
    latestPeriod1MaximumNormalizedDelta: number | null;
    failureReason: string | null;
    observation: MainWireScientificTbvAccuracyObservationV1 | null;
  }>;
  canonical: Readonly<{
    status:
      | "period1-converged"
      | "period2-suspect"
      | "not-converged"
      | "maximum-beats-reached"
      | "step-failure";
    acceptedForPeriod1Locus: boolean;
    completedBeatCount: number;
    wallClockMs: number;
    latestPeriod1MaximumNormalizedDelta: number | null;
    latestPeriod2MaximumNormalizedDelta: number | null;
    failureReason: string | null;
    observation: MainWireScientificTbvAccuracyObservationV1 | null;
  }>;
}>;

export type MainWireScientificTbvAccuracyMetricErrorV1 = Readonly<{
  metric: MainWireScientificTbvAccuracyMetricV1;
  unit: MetricDefinitionV1["unit"];
  rapidValue: number;
  canonicalP1Value: number;
  signedError: number;
  absoluteError: number;
  relativeErrorFraction: number;
  relativeDenominator: number;
  relativeDenominatorFloor: number;
  relativeDenominatorFloorApplied: boolean;
}>;

export type MainWireScientificTbvAccuracyPairV1 = Readonly<{
  pairId: string;
  targetId: string;
  lane: MainWireScientificFastTbvPreviewLaneV1;
  tbvBin: MainWireScientificTbvAccuracyTbvBinV1;
  targetOrdinal: number;
  targetScale: number;
  fixedTotalBloodVolumeMl: number;
  comparisonStatus:
    | "paired-p1-complete"
    | "paired-p1-with-missing-metrics"
    | "rapid-failure"
    | "canonical-period2"
    | "canonical-unresolved"
    | "canonical-failure";
  rapid: MainWireScientificTbvAccuracyPairInputV1["rapid"];
  canonical: MainWireScientificTbvAccuracyPairInputV1["canonical"];
  errors: readonly MainWireScientificTbvAccuracyMetricErrorV1[];
}>;

export type MainWireScientificTbvAccuracyDistributionV1 = Readonly<{
  observationCount: number;
  meanSignedError: number | null;
  meanAbsoluteError: number | null;
  medianAbsoluteError: number | null;
  maximumAbsoluteError: number | null;
  meanRelativeErrorFraction: number | null;
  medianRelativeErrorFraction: number | null;
  maximumRelativeErrorFraction: number | null;
  relativeDenominatorFloorApplicationCount: number;
}>;

export type MainWireScientificTbvAccuracyMetricSummaryV1 = Readonly<{
  metric: MainWireScientificTbvAccuracyMetricV1;
  unit: MetricDefinitionV1["unit"];
  relativeDenominatorFloor: number;
  overall: MainWireScientificTbvAccuracyDistributionV1;
  byLane: Readonly<
    Record<
      MainWireScientificFastTbvPreviewLaneV1,
      MainWireScientificTbvAccuracyDistributionV1
    >
  >;
  byTbvBin: readonly Readonly<{
    tbvBin: MainWireScientificTbvAccuracyTbvBinV1;
    distribution: MainWireScientificTbvAccuracyDistributionV1;
  }>[];
  byRapidCompletedNaturalBeatCount: readonly Readonly<{
    completedNaturalBeatCount: number;
    distribution: MainWireScientificTbvAccuracyDistributionV1;
  }>[];
}>;

export type MainWireScientificTbvAccuracyCharacterizationV1 = Readonly<{
  characterizationId: typeof MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_V1_ID;
  characterizationVersion: "1.0.0";
  policy: typeof MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1;
  sourceFingerprint: string;
  sourceSessionUnchanged: boolean;
  claimBoundary: Readonly<{
    characterizationIsAnAccuracyAcceptanceGate: false;
    characterizationChangesProductionScientificClaims: false;
    rapidPointsAreCanonicalPeriodicSolutions: false;
    nonP1CanonicalPointsEnterErrorStatistics: false;
    baselineEntersRapidErrorStatistics: false;
  }>;
  baseline: MainWireScientificTbvAccuracyBaselineV1;
  pairs: readonly MainWireScientificTbvAccuracyPairV1[];
  summary: Readonly<{
    targetPairCount: 9;
    pairedP1CompleteCount: number;
    pairedP1WithMissingMetricsCount: number;
    rapidFailureCount: number;
    canonicalPeriod2Count: number;
    canonicalUnresolvedCount: number;
    canonicalFailureCount: number;
    timing: Readonly<{
      benchmarkWallClockMs: number;
      projectedTwoLaneWallClockMs: number;
      baselineWallClockMs: number;
      rapidTargetWallClockMs: number;
      canonicalTargetWallClockMs: number;
      rapidCompletedNaturalBeatCount: number;
      canonicalCompletedBeatCount: number;
      byLane: Readonly<
        Record<
          MainWireScientificFastTbvPreviewLaneV1,
          Readonly<{
            rapidWallClockMs: number;
            canonicalWallClockMs: number;
            rapidCompletedNaturalBeatCount: number;
            canonicalCompletedBeatCount: number;
          }>
        >
      >;
      byRapidCompletedNaturalBeatCount: readonly Readonly<{
        completedNaturalBeatCount: number;
        targetPairCount: number;
        rapidWallClockMs: number;
        canonicalWallClockMs: number;
      }>[];
    }>;
    metrics: readonly MainWireScientificTbvAccuracyMetricSummaryV1[];
  }>;
}>;

const TBV_BINS: readonly MainWireScientificTbvAccuracyTbvBinV1[] =
  Object.freeze([
    "severe-low-volume",
    "low-volume",
    "near-baseline",
    "high-volume",
    "severe-high-volume",
  ]);

export function mainWireScientificTbvAccuracyTbvBinV1(
  targetScale: number,
): MainWireScientificTbvAccuracyTbvBinV1 {
  const bins =
    MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1.tbvBins;
  if (targetScale <= bins.severeLowMaximumScaleInclusive) {
    return "severe-low-volume";
  }
  if (targetScale < bins.lowMaximumScaleExclusive) return "low-volume";
  if (targetScale <= bins.nearBaselineMaximumScaleInclusive) {
    return "near-baseline";
  }
  if (targetScale <= bins.highMaximumScaleInclusive) return "high-volume";
  return "severe-high-volume";
}

export function characterizeMainWireScientificTbvAccuracyPairV1(
  input: MainWireScientificTbvAccuracyPairInputV1,
): MainWireScientificTbvAccuracyPairV1 {
  validatePairInput(input);
  const canonicalIsP1 =
    input.canonical.status === "period1-converged" &&
    input.canonical.acceptedForPeriod1Locus;
  const errors =
    input.rapid.observation === null ||
    input.canonical.observation === null ||
    !canonicalIsP1
      ? Object.freeze([])
      : Object.freeze(
          METRICS.flatMap((metric) => {
            const rapidValue = input.rapid.observation![metric];
            const canonicalP1Value = input.canonical.observation![metric];
            if (rapidValue === null || canonicalP1Value === null) return [];
            const definition =
              MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_METRIC_DEFINITIONS_V1[metric];
            const signedError = rapidValue - canonicalP1Value;
            const absoluteError = Math.abs(signedError);
            const canonicalMagnitude = Math.abs(canonicalP1Value);
            const relativeDenominator = Math.max(
              canonicalMagnitude,
              definition.relativeDenominatorFloor,
            );
            return [
              Object.freeze({
                metric,
                unit: definition.unit,
                rapidValue,
                canonicalP1Value,
                signedError,
                absoluteError,
                relativeErrorFraction: absoluteError / relativeDenominator,
                relativeDenominator,
                relativeDenominatorFloor:
                  definition.relativeDenominatorFloor,
                relativeDenominatorFloorApplied:
                  canonicalMagnitude < definition.relativeDenominatorFloor,
              }),
            ];
          }),
        );
  const comparisonStatus = pairComparisonStatus(input, errors.length);
  return Object.freeze({
    pairId: input.pairId,
    targetId: input.targetId,
    lane: input.lane,
    tbvBin: mainWireScientificTbvAccuracyTbvBinV1(input.targetScale),
    targetOrdinal: input.targetOrdinal,
    targetScale: input.targetScale,
    fixedTotalBloodVolumeMl: input.fixedTotalBloodVolumeMl,
    comparisonStatus,
    rapid: input.rapid,
    canonical: input.canonical,
    errors,
  });
}

export function buildMainWireScientificTbvAccuracyCharacterizationV1(
  input: Readonly<{
    sourceFingerprint: string;
    sourceSessionUnchanged: boolean;
    benchmarkWallClockMs: number;
    baseline: MainWireScientificTbvAccuracyBaselineV1;
    pairs: readonly MainWireScientificTbvAccuracyPairInputV1[];
  }>,
): MainWireScientificTbvAccuracyCharacterizationV1 {
  validateReportInput(input);
  const pairs = Object.freeze(
    input.pairs.map(characterizeMainWireScientificTbvAccuracyPairV1),
  );
  const laneTiming = (lane: MainWireScientificFastTbvPreviewLaneV1) => {
    const selected = pairs.filter((pair) => pair.lane === lane);
    return Object.freeze({
      rapidWallClockMs: sum(
        selected.map(({ rapid }) => rapid.wallClockMs),
      ),
      canonicalWallClockMs: sum(
        selected.map(({ canonical }) => canonical.wallClockMs),
      ),
      rapidCompletedNaturalBeatCount: sum(
        selected.map(({ rapid }) => rapid.completedNaturalBeatCount),
      ),
      canonicalCompletedBeatCount: sum(
        selected.map(({ canonical }) => canonical.completedBeatCount),
      ),
    });
  };
  const count = (
    status: MainWireScientificTbvAccuracyPairV1["comparisonStatus"],
  ) => pairs.filter((pair) => pair.comparisonStatus === status).length;
  const lowerLaneTiming = laneTiming("lower-volume");
  const higherLaneTiming = laneTiming("higher-volume");
  const rapidBeatCounts = uniqueRapidBeatCounts(pairs);
  return Object.freeze({
    characterizationId:
      MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_V1_ID,
    characterizationVersion: "1.0.0" as const,
    policy: MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1,
    sourceFingerprint: input.sourceFingerprint,
    sourceSessionUnchanged: input.sourceSessionUnchanged,
    claimBoundary: Object.freeze({
      characterizationIsAnAccuracyAcceptanceGate: false as const,
      characterizationChangesProductionScientificClaims: false as const,
      rapidPointsAreCanonicalPeriodicSolutions: false as const,
      nonP1CanonicalPointsEnterErrorStatistics: false as const,
      baselineEntersRapidErrorStatistics: false as const,
    }),
    baseline: input.baseline,
    pairs,
    summary: Object.freeze({
      targetPairCount: 9 as const,
      pairedP1CompleteCount: count("paired-p1-complete"),
      pairedP1WithMissingMetricsCount: count(
        "paired-p1-with-missing-metrics",
      ),
      rapidFailureCount: count("rapid-failure"),
      canonicalPeriod2Count: pairs.filter(
        ({ canonical }) => canonical.status === "period2-suspect",
      ).length,
      canonicalUnresolvedCount: pairs.filter(
        ({ canonical }) =>
          canonical.status !== "period1-converged" &&
          canonical.status !== "period2-suspect" &&
          canonical.status !== "step-failure",
      ).length,
      canonicalFailureCount: pairs.filter(
        ({ canonical }) => canonical.status === "step-failure",
      ).length,
      timing: Object.freeze({
        benchmarkWallClockMs: input.benchmarkWallClockMs,
        projectedTwoLaneWallClockMs:
          input.baseline.wallClockMs +
          // Production exposes the complete rapid locus before either lane
          // starts canonical continuation, so the two phases have separate
          // lane barriers rather than one fused per-lane makespan.
          Math.max(
            lowerLaneTiming.rapidWallClockMs,
            higherLaneTiming.rapidWallClockMs,
          ) +
          Math.max(
            lowerLaneTiming.canonicalWallClockMs,
            higherLaneTiming.canonicalWallClockMs,
          ),
        baselineWallClockMs: input.baseline.wallClockMs,
        rapidTargetWallClockMs: sum(
          pairs.map(({ rapid }) => rapid.wallClockMs),
        ),
        canonicalTargetWallClockMs: sum(
          pairs.map(({ canonical }) => canonical.wallClockMs),
        ),
        rapidCompletedNaturalBeatCount: sum(
          pairs.map(({ rapid }) => rapid.completedNaturalBeatCount),
        ),
        canonicalCompletedBeatCount: sum(
          pairs.map(({ canonical }) => canonical.completedBeatCount),
        ),
        byLane: Object.freeze({
          "lower-volume": lowerLaneTiming,
          "higher-volume": higherLaneTiming,
        }),
        byRapidCompletedNaturalBeatCount: Object.freeze(
          rapidBeatCounts.map((completedNaturalBeatCount) => {
            const selected = pairs.filter(
              ({ rapid }) =>
                rapid.completedNaturalBeatCount === completedNaturalBeatCount,
            );
            return Object.freeze({
              completedNaturalBeatCount,
              targetPairCount: selected.length,
              rapidWallClockMs: sum(
                selected.map(({ rapid }) => rapid.wallClockMs),
              ),
              canonicalWallClockMs: sum(
                selected.map(({ canonical }) => canonical.wallClockMs),
              ),
            });
          }),
        ),
      }),
      metrics: Object.freeze(METRICS.map((metric) => metricSummary(metric, pairs))),
    }),
  });
}

function pairComparisonStatus(
  input: MainWireScientificTbvAccuracyPairInputV1,
  errorCount: number,
): MainWireScientificTbvAccuracyPairV1["comparisonStatus"] {
  if (input.rapid.evidenceClass === "failure") return "rapid-failure";
  if (input.canonical.status === "period2-suspect") {
    return "canonical-period2";
  }
  if (input.canonical.status === "step-failure") return "canonical-failure";
  if (
    input.canonical.status !== "period1-converged" ||
    !input.canonical.acceptedForPeriod1Locus
  ) {
    return "canonical-unresolved";
  }
  return errorCount === METRICS.length
    ? "paired-p1-complete"
    : "paired-p1-with-missing-metrics";
}

function metricSummary(
  metric: MainWireScientificTbvAccuracyMetricV1,
  pairs: readonly MainWireScientificTbvAccuracyPairV1[],
): MainWireScientificTbvAccuracyMetricSummaryV1 {
  const definition =
    MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_METRIC_DEFINITIONS_V1[metric];
  const errorsFor = (
    selected: readonly MainWireScientificTbvAccuracyPairV1[],
  ) =>
    selected.flatMap((pair) =>
      pair.errors.filter((error) => error.metric === metric),
    );
  return Object.freeze({
    metric,
    unit: definition.unit,
    relativeDenominatorFloor: definition.relativeDenominatorFloor,
    overall: distribution(errorsFor(pairs)),
    byLane: Object.freeze({
      "lower-volume": distribution(
        errorsFor(pairs.filter((pair) => pair.lane === "lower-volume")),
      ),
      "higher-volume": distribution(
        errorsFor(pairs.filter((pair) => pair.lane === "higher-volume")),
      ),
    }),
    byTbvBin: Object.freeze(
      TBV_BINS.map((tbvBin) =>
        Object.freeze({
          tbvBin,
          distribution: distribution(
            errorsFor(pairs.filter((pair) => pair.tbvBin === tbvBin)),
          ),
        }),
      ),
    ),
    byRapidCompletedNaturalBeatCount: Object.freeze(
      uniqueRapidBeatCounts(pairs).map((completedNaturalBeatCount) =>
        Object.freeze({
          completedNaturalBeatCount,
          distribution: distribution(
            errorsFor(
              pairs.filter(
                ({ rapid }) =>
                  rapid.completedNaturalBeatCount === completedNaturalBeatCount,
              ),
            ),
          ),
        }),
      ),
    ),
  });
}

function distribution(
  errors: readonly MainWireScientificTbvAccuracyMetricErrorV1[],
): MainWireScientificTbvAccuracyDistributionV1 {
  if (errors.length === 0) {
    return Object.freeze({
      observationCount: 0,
      meanSignedError: null,
      meanAbsoluteError: null,
      medianAbsoluteError: null,
      maximumAbsoluteError: null,
      meanRelativeErrorFraction: null,
      medianRelativeErrorFraction: null,
      maximumRelativeErrorFraction: null,
      relativeDenominatorFloorApplicationCount: 0,
    });
  }
  const absolute = errors.map(({ absoluteError }) => absoluteError);
  const relative = errors.map(({ relativeErrorFraction }) => relativeErrorFraction);
  return Object.freeze({
    observationCount: errors.length,
    meanSignedError: mean(errors.map(({ signedError }) => signedError)),
    meanAbsoluteError: mean(absolute),
    medianAbsoluteError: median(absolute),
    maximumAbsoluteError: Math.max(...absolute),
    meanRelativeErrorFraction: mean(relative),
    medianRelativeErrorFraction: median(relative),
    maximumRelativeErrorFraction: Math.max(...relative),
    relativeDenominatorFloorApplicationCount: errors.filter(
      ({ relativeDenominatorFloorApplied }) => relativeDenominatorFloorApplied,
    ).length,
  });
}

function validatePairInput(input: MainWireScientificTbvAccuracyPairInputV1) {
  if (!(input.targetScale > 0) || input.targetScale === 1) {
    throw new Error("accuracy pair target scale must be positive and non-baseline");
  }
  if (!(input.fixedTotalBloodVolumeMl > 0)) {
    throw new Error("accuracy pair TBV must be positive");
  }
  if (!input.pairId || !input.targetId) {
    throw new Error("accuracy pair identifiers must be non-empty");
  }
  const values = [
    input.targetScale,
    input.fixedTotalBloodVolumeMl,
    input.rapid.wallClockMs,
    input.canonical.wallClockMs,
  ];
  if (!values.every(Number.isFinite)) {
    throw new Error("accuracy pair contains a non-finite target or timing");
  }
  if (
    !Number.isInteger(input.rapid.completedNaturalBeatCount) ||
    input.rapid.completedNaturalBeatCount < 0
  ) {
    throw new Error("rapid completed natural beat count must be a non-negative integer");
  }
}

function validateReportInput(input: Readonly<{
  sourceFingerprint: string;
  sourceSessionUnchanged: boolean;
  benchmarkWallClockMs: number;
  baseline: MainWireScientificTbvAccuracyBaselineV1;
  pairs: readonly MainWireScientificTbvAccuracyPairInputV1[];
}>) {
  if (!input.sourceFingerprint) {
    throw new Error("accuracy characterization source fingerprint is required");
  }
  if (
    input.baseline.canonicalStatus !== "period1-converged" ||
    input.baseline.targetScale !== 1
  ) {
    throw new Error("accuracy characterization requires a separate canonical P1 baseline");
  }
  if (
    input.pairs.length !==
    MAIN_WIRE_SCIENTIFIC_TBV_ACCURACY_CHARACTERIZATION_POLICY_V1.fixedRapidTargetCount
  ) {
    throw new Error("accuracy characterization requires the fixed nine-target rapid grid");
  }
  const expectedByLane = Object.freeze({
    "lower-volume":
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.lowerTargetScales,
    "higher-volume":
      MAIN_WIRE_SCIENTIFIC_FAST_TBV_PREVIEW_POLICY_V1.higherTargetScales,
  });
  for (const lane of ["lower-volume", "higher-volume"] as const) {
    const actual = input.pairs
      .filter((pair) => pair.lane === lane)
      .sort((left, right) => left.targetOrdinal - right.targetOrdinal)
      .map(({ targetScale }) => targetScale);
    if (JSON.stringify(actual) !== JSON.stringify(expectedByLane[lane])) {
      throw new Error(`accuracy characterization ${lane} grid does not match rapid policy`);
    }
  }
  if (new Set(input.pairs.map(({ pairId }) => pairId)).size !== input.pairs.length) {
    throw new Error("accuracy characterization pair identifiers must be unique");
  }
  for (const pair of input.pairs) {
    const expectedTbvMl =
      input.baseline.fixedTotalBloodVolumeMl * pair.targetScale;
    if (Math.abs(pair.fixedTotalBloodVolumeMl - expectedTbvMl) > 1e-6) {
      throw new Error("accuracy characterization pair TBV does not match baseline scale");
    }
  }
  if (!Number.isFinite(input.benchmarkWallClockMs)) {
    throw new Error("accuracy characterization benchmark timing must be finite");
  }
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueRapidBeatCounts(
  pairs: readonly MainWireScientificTbvAccuracyPairV1[],
): readonly number[] {
  return [...new Set(pairs.map(({ rapid }) => rapid.completedNaturalBeatCount))]
    .sort((left, right) => left - right);
}

function mean(values: readonly number[]): number {
  return sum(values) / values.length;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}
