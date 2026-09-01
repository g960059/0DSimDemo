import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAIN_WIRE_RIGHT_HEART_MECHANICS_FACTORIAL_SUMMARY_V1_ID =
  "main-wire-right-heart-mechanics-factorial-summary-v1" as const;

const inputDirectory = path.resolve(argument(
  "--input-directory",
  "artifacts/right-heart-mechanics-factorial",
));
const outputPath = path.resolve(argument(
  "--output",
  `${inputDirectory}/summary.json`,
));

const arms = Object.freeze({
  center: readArtifact(`${inputDirectory}/center.json`),
  lowLow: readArtifact(`${inputDirectory}/low-low.json`),
  lowHigh: readArtifact(`${inputDirectory}/low-high.json`),
  highLow: readArtifact(`${inputDirectory}/high-low.json`),
  highHigh: readArtifact(`${inputDirectory}/high-high.json`),
});

for (const [armId, arm] of Object.entries(arms)) {
  const mechanics = arm.protocol.rightHeartMechanicsScreen;
  const expected = armId === "center"
    ? [1, 1]
    : armId === "lowLow"
      ? [0.75, 0.75]
      : armId === "lowHigh"
        ? [0.75, 1.33]
        : armId === "highLow"
          ? [1.33, 0.75]
          : [1.33, 1.33];
  if (
    mechanics.activeTensionScale !== expected[0]
    || mechanics.passiveStiffnessScale !== expected[1]
  ) {
    throw new Error(`${armId} does not match the preregistered factorial cell`);
  }
}

const metric = Object.freeze({
  lvStrokeVolumeMl: pathMetric("chamber", "LV", "strokeVolumeMl"),
  meanAoPMmHg: pathMetric("pressure", "AoP", "timeWeightedMean"),
  avEjectionTimeSec:
    pathMetric("ventricularTiming", "LV", "ejectionTimeSec"),
  avMeanGradientMmHg:
    pathMetric("valve", "AoV", "forwardFlowTimeMeanGradientMmHg"),
  lvTeiIndex: pathMetric("ventricularTiming", "LV", "teiIndex"),
  mitralMeanGradientMmHg:
    pathMetric("valve", "MV", "forwardFlowTimeMeanGradientMmHg"),
  rvStrokeVolumeMl: pathMetric("chamber", "RV", "strokeVolumeMl"),
  rvEjectionFraction01: pathMetric("chamber", "RV", "ejectionFraction01"),
  meanPAPMmHg: pathMetric("pressure", "PAP", "timeWeightedMean"),
  pvEjectionTimeSec:
    pathMetric("ventricularTiming", "RV", "ejectionTimeSec"),
  pvAccelerationTimeSec: accelerationTime("PV", "pulmonaryEjection"),
  pvMeanGradientMmHg:
    pathMetric("valve", "PV", "forwardFlowTimeMeanGradientMmHg"),
  pvPeakGradientMmHg:
    pathMetric("valve", "PV", "peakForwardGradientMmHg"),
  pvPeakFlowMlPerSec:
    pathMetric("valve", "PV", "maximumForwardFlowMlPerSec"),
  rvIsovolumicContractionTimeSec:
    pathMetric("ventricularTiming", "RV", "isovolumicContractionTimeSec"),
  rvIsovolumicRelaxationTimeSec:
    pathMetric("ventricularTiming", "RV", "isovolumicRelaxationTimeSec"),
  rvTeiIndex: pathMetric("ventricularTiming", "RV", "teiIndex"),
  rvMaximumDpDtMmHgPerSec:
    pathMetric("pressureRateMmHgPerSec", "RV", "maximum"),
  rvMinimumDpDtMmHgPerSec:
    pathMetric("pressureRateMmHgPerSec", "RV", "minimum"),
  tricuspidMeanGradientMmHg:
    pathMetric("valve", "TV", "forwardFlowTimeMeanGradientMmHg"),
  pvFlowReboundMlPerSec: nullablePathMetric(
    "morphology",
    "pulmonaryEjection",
    "PV",
    "largestPostPeakRebound",
    "rise",
  ),
  papDiastolicReboundMmHg: nullablePathMetric(
    "morphology",
    "pulmonaryArteryDiastolicRebound",
    "reboundRiseMmHg",
  ),
} as const satisfies Readonly<Record<string, MetricReader>>);

const perMetric = Object.freeze(Object.fromEntries(Object.entries(metric).map(
  ([metricId, readMetric]) => {
    const center = readMetric(arms.center.terminal);
    const lowLow = readMetric(arms.lowLow.terminal);
    const lowHigh = readMetric(arms.lowHigh.terminal);
    const highLow = readMetric(arms.highLow.terminal);
    const highHigh = readMetric(arms.highHigh.terminal);
    const factorialMean = (lowLow + lowHigh + highLow + highHigh) / 4;
    return [metricId, Object.freeze({
      cells: Object.freeze({ center, lowLow, lowHigh, highLow, highHigh }),
      activeTensionMainEffect:
        ((highLow + highHigh) - (lowLow + lowHigh)) / 2,
      passiveStiffnessMainEffect:
        ((lowHigh + highHigh) - (lowLow + highLow)) / 2,
      activeByPassiveInteractionEffect:
        ((lowLow + highHigh) - (lowHigh + highLow)) / 2,
      centerMinusFactorialMean: center - factorialMean,
    })];
  },
)));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  summaryId: MAIN_WIRE_RIGHT_HEART_MECHANICS_FACTORIAL_SUMMARY_V1_ID,
  design: Object.freeze({
    construction:
      "Standard66, both proximal arterial roots resistive, pulmonary root R allocated as normal-human Zc" as const,
    factorLevels: Object.freeze({
      rvfwActiveTensionScale: Object.freeze([0.75, 1.33] as const),
      rvfwPassiveStiffnessScale: Object.freeze([0.75, 1.33] as const),
    }),
    center: Object.freeze({
      rvfwActiveTensionScale: 1 as const,
      rvfwPassiveStiffnessScale: 1 as const,
    }),
    heldAtBaseline: Object.freeze([
      "SEP mechanics",
      "LVFW mechanics",
      "calcium drive",
      "valve areas",
      "vascular and blood-volume inputs",
    ] as const),
    independentColdStarts: true as const,
    cycleCount: 20 as const,
    nominalDtSec: 0.002 as const,
    parameterSearchOrFitting: false as const,
  }),
  perMetric,
  causalReadback: Object.freeze({
    lowerRvfwActiveTensionLengthensPulmonaryEjection:
      perMetric.pvEjectionTimeSec.activeTensionMainEffect < 0,
    lowerRvfwActiveTensionReducesPulmonaryGradient:
      perMetric.pvMeanGradientMmHg.activeTensionMainEffect > 0,
    lowerRvfwActiveTensionImprovesRvTei:
      perMetric.rvTeiIndex.activeTensionMainEffect > 0,
    accelerationTimeInsensitiveAcrossFactorial:
      Math.max(...Object.values(perMetric.pvAccelerationTimeSec.cells))
        - Math.min(...Object.values(perMetric.pvAccelerationTimeSec.cells))
        <= 0.004 + 1e-12,
    noFactorialCellReintroducesPvFlowRebound:
      Math.max(...Object.values(perMetric.pvFlowReboundMlPerSec.cells)) === 0,
    noFactorialCellReintroducesPapDiastolicRebound:
      Math.max(...Object.values(perMetric.papDiastolicReboundMmHg.cells)) === 0,
  }),
  interpretationBoundary: Object.freeze({
    boundedMechanismSensitivityNotCalibration: true as const,
    activeTensionAmplitudeIsNotContractionOrRelaxationKinetics: true as const,
    rvfwOnlyPerturbationDoesNotResolveSharedSeptalContribution: true as const,
    fixedHorizonScreenIsNotCanonicalPeriodicityEvidence: true as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  causalReadback: report.causalReadback,
  keyEffects: Object.fromEntries([
    "pvEjectionTimeSec",
    "pvAccelerationTimeSec",
    "pvMeanGradientMmHg",
    "rvTeiIndex",
    "meanPAPMmHg",
    "rvStrokeVolumeMl",
    "avEjectionTimeSec",
    "avMeanGradientMmHg",
  ].map((metricId) => [metricId, report.perMetric[metricId]])),
})}\n`);

type Artifact = Readonly<{
  protocol: Readonly<{
    rightHeartMechanicsScreen: Readonly<{
      activeTensionScale: number;
      passiveStiffnessScale: number;
    }>;
  }>;
  terminal: unknown;
}>;

type MetricReader = (terminal: unknown) => number;

function readArtifact(filePath: string): Artifact {
  return JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
}

function pathMetric(...keys: readonly string[]): MetricReader {
  return (terminal) => requiredNumber(valueAtPath(terminal, keys), keys);
}

function nullablePathMetric(...keys: readonly string[]): MetricReader {
  return (terminal) => {
    const value = valueAtPath(terminal, keys);
    return value === null || value === undefined
      ? 0
      : requiredNumber(value, keys);
  };
}

function accelerationTime(
  valveId: "PV",
  ejectionId: "pulmonaryEjection",
): MetricReader {
  return (terminal) => {
    const openingTimeSec = requiredNumber(valueAtPath(
      terminal,
      ["valve", valveId, "primaryThresholdEpisode", "openingTimeSec"],
    ), [valveId, "openingTimeSec"]);
    const morphology = valueAtPath(
      terminal,
      ["morphology", ejectionId, valveId],
    ) as Readonly<{
      maximum: number;
      extrema: readonly Readonly<{
        kind: "minimum" | "maximum";
        value: number;
        timeSec: number;
      }>[];
    }>;
    const maxima = morphology.extrema.filter((entry) => entry.kind === "maximum");
    if (maxima.length === 0) throw new Error(`${valveId} has no local maximum`);
    const peak = maxima.reduce((best, entry) =>
      entry.value > best.value ? entry : best, maxima[0]!);
    if (Math.abs(peak.value - morphology.maximum) > 1e-8) {
      throw new Error(`${valveId} global maximum is not retained`);
    }
    return peak.timeSec - openingTimeSec;
  };
}

function valueAtPath(root: unknown, keys: readonly string[]): unknown {
  let current = root;
  for (const key of keys) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function requiredNumber(value: unknown, keys: readonly string[]): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${keys.join(".")} is not finite`);
  }
  return value;
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
