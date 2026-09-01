import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAIN_WIRE_PULMONARY_ROOT_RESISTANCE_ENVELOPE_SUMMARY_V1_ID =
  "main-wire-pulmonary-root-resistance-envelope-summary-v1" as const;

const contextIds = Object.freeze([
  "baseline",
  "heart-rate-40",
  "heart-rate-100",
  "systemic-resistance-0p75",
  "systemic-resistance-1p25",
  "pulmonary-resistance-0p45",
  "pulmonary-resistance-0p8",
  "arterial-stiffness-0p5",
  "arterial-stiffness-1p0",
  "total-blood-volume-4200",
  "total-blood-volume-7000",
  "venous-tone-0",
  "venous-tone-1",
  "peep-20",
  "contractility-0p75",
  "contractility-1p33",
] as const);

const sourceDirectory = path.resolve(argument(
  "--source-directory",
  "artifacts/proximal-root-envelope",
));
const normalZcDirectory = path.resolve(argument(
  "--normal-zc-directory",
  "artifacts/pulmonary-root-resistance-envelope",
));
const outputPath = path.resolve(argument(
  "--output",
  `${normalZcDirectory}/summary.json`,
));

const metric = Object.freeze({
  lvStrokeVolumeMl: pathMetric("chamber", "LV", "strokeVolumeMl"),
  meanAoPMmHg: pathMetric("pressure", "AoP", "timeWeightedMean"),
  avEjectionTimeSec:
    pathMetric("ventricularTiming", "LV", "ejectionTimeSec"),
  avMeanGradientMmHg:
    pathMetric("valve", "AoV", "forwardFlowTimeMeanGradientMmHg"),
  avPeakGradientMmHg:
    pathMetric("valve", "AoV", "peakForwardGradientMmHg"),
  avAccelerationTimeSec: accelerationTime("AoV", "aorticEjection"),
  lvTeiIndex: pathMetric("ventricularTiming", "LV", "teiIndex"),
  rvStrokeVolumeMl: pathMetric("chamber", "RV", "strokeVolumeMl"),
  rvEjectionFraction01: pathMetric("chamber", "RV", "ejectionFraction01"),
  meanPAPMmHg: pathMetric("pressure", "PAP", "timeWeightedMean"),
  systolicPAPMmHg: pathMetric("pressure", "PAP", "maximum"),
  diastolicPAPMmHg: pathMetric("pressure", "PAP", "minimum"),
  pvEjectionTimeSec:
    pathMetric("ventricularTiming", "RV", "ejectionTimeSec"),
  pvMeanGradientMmHg:
    pathMetric("valve", "PV", "forwardFlowTimeMeanGradientMmHg"),
  pvPeakGradientMmHg:
    pathMetric("valve", "PV", "peakForwardGradientMmHg"),
  pvPeakFlowMlPerSec:
    pathMetric("valve", "PV", "maximumForwardFlowMlPerSec"),
  pvAccelerationTimeSec: accelerationTime("PV", "pulmonaryEjection"),
  rvIsovolumicContractionTimeSec:
    pathMetric("ventricularTiming", "RV", "isovolumicContractionTimeSec"),
  rvIsovolumicRelaxationTimeSec:
    pathMetric("ventricularTiming", "RV", "isovolumicRelaxationTimeSec"),
  rvTeiIndex: pathMetric("ventricularTiming", "RV", "teiIndex"),
  rvMaximumDpDtMmHgPerSec:
    pathMetric("pressureRateMmHgPerSec", "RV", "maximum"),
  rvMinimumDpDtMmHgPerSec:
    pathMetric("pressureRateMmHgPerSec", "RV", "minimum"),
  pvFlowReboundMlPerSec:
    pathMetric(
      "morphology",
      "pulmonaryEjection",
      "PV",
      "largestPostPeakRebound",
      "rise",
    ),
  papDiastolicReboundMmHg:
    pathMetric(
      "morphology",
      "pulmonaryArteryDiastolicRebound",
      "reboundRiseMmHg",
    ),
  tvMeanGradientMmHg:
    pathMetric("valve", "TV", "forwardFlowTimeMeanGradientMmHg"),
  tvPeakGradientMmHg:
    pathMetric("valve", "TV", "peakForwardGradientMmHg"),
} as const satisfies Readonly<Record<string, MetricReader>>);

const arms = contextIds.map((contextId) => Object.freeze({
  contextId,
  source: readArtifact(`${sourceDirectory}/${contextId}-source.json`),
  sameResistance: readArtifact(
    `${sourceDirectory}/${contextId}-both-resistive.json`,
  ),
  normalZc: readArtifact(
    `${normalZcDirectory}/${contextId}-both-resistive-normal-zc.json`,
  ),
}));
for (const arm of arms) {
  for (const artifact of [arm.source, arm.sameResistance, arm.normalZc]) {
    if (artifact.protocol.researchContext.contextId !== arm.contextId) {
      throw new Error(`${arm.contextId} artifact context differs`);
    }
  }
}

const perMetric = Object.freeze(Object.fromEntries(Object.entries(metric).map(
  ([metricId, readMetric]) => {
    const byContext = arms.map((arm) => {
      const source = readMetric(arm.source.terminal);
      const sameResistance = readMetric(arm.sameResistance.terminal);
      const normalZc = readMetric(arm.normalZc.terminal);
      return Object.freeze({
        contextId: arm.contextId,
        source,
        sameResistance,
        normalZc,
        normalZcVersusSource: change(source, normalZc),
        normalZcVersusSameResistance: change(sameResistance, normalZc),
      });
    });
    return [metricId, Object.freeze({
      sourceRange: range(byContext.map((entry) => entry.source)),
      sameResistanceRange:
        range(byContext.map((entry) => entry.sameResistance)),
      normalZcRange: range(byContext.map((entry) => entry.normalZc)),
      normalZcVersusSourceRelativeChangeRange: range(byContext.map((entry) =>
        entry.normalZcVersusSource.relative)),
      normalZcVersusSameResistanceRelativeChangeRange: range(
        byContext.map((entry) =>
          entry.normalZcVersusSameResistance.relative),
      ),
      byContext: Object.freeze(byContext),
    })];
  },
)));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  summaryId:
    MAIN_WIRE_PULMONARY_ROOT_RESISTANCE_ENVELOPE_SUMMARY_V1_ID,
  design: Object.freeze({
    contextOrder: contextIds,
    contextCount: contextIds.length,
    constructions: Object.freeze([
      "Standard66 source Ao/PA inertance",
      "Standard66 both roots resistive with source R allocation",
      "Standard66 both roots resistive with normal-human pulmonary Zc allocation",
    ] as const),
    normalPulmonaryCharacteristicResistanceMmHgSecPerMl: 0.015,
    normalPulmonaryCharacteristicResistanceSource:
      "Murgo-Westerhof-1984-PMID-6733863" as const,
    referenceBaselineProximalSeriesResistancePreserved: true as const,
    parameterSearchOrFitting: false as const,
  }),
  observationalAnchors: Object.freeze({
    role: "context-only-no-direct-pass-fail" as const,
    pulmonaryFlow: Object.freeze({
      study:
        "Kitabatake-et-al-1984-20-normal-adults-PII-0002870384903806" as const,
      peakVelocityCmPerSec: 63,
      accelerationTimeSec: 0.159,
      ejectionTimeSec: 0.331,
    }),
    pulmonaryAccelerationTime: Object.freeze({
      study: "Dabestani-et-al-1987-PMID-3825910" as const,
      normalPressureSubjectCount: 16,
      meanSec: 0.134,
      standardDeviationSec: 0.020,
    }),
    conventionalDopplerRvTei: Object.freeze({
      study: "Yeo-et-al-1998-PMID-9605059" as const,
      normalMean: 0.28,
      normalStandardDeviation: 0.04,
    }),
  }),
  perMetric,
  morphology: Object.freeze({
    maximumSourcePvFlowReboundMlPerSec:
      perMetric.pvFlowReboundMlPerSec.sourceRange.maximum,
    maximumSameResistancePvFlowReboundMlPerSec:
      perMetric.pvFlowReboundMlPerSec.sameResistanceRange.maximum,
    maximumNormalZcPvFlowReboundMlPerSec:
      perMetric.pvFlowReboundMlPerSec.normalZcRange.maximum,
    maximumSourcePapDiastolicReboundMmHg:
      perMetric.papDiastolicReboundMmHg.sourceRange.maximum,
    maximumSameResistancePapDiastolicReboundMmHg:
      perMetric.papDiastolicReboundMmHg.sameResistanceRange.maximum,
    maximumNormalZcPapDiastolicReboundMmHg:
      perMetric.papDiastolicReboundMmHg.normalZcRange.maximum,
  }),
  interpretationBoundary: Object.freeze({
    modelValveFlowThresholdTimingIsNotDopplerSampleTiming: true as const,
    modelPeakFlowDividedByMaximumEoaIsNotReportedAsMeasuredVelocity:
      true as const,
    observationalAnchorsDidNotSetCandidateParameters: true as const,
    fixedHorizonScreenIsNotCanonicalPeriodicityEvidence: true as const,
    normalZcDoesNotResolveVentricularConstitutiveTiming: true as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  morphology: report.morphology,
  baseline: Object.fromEntries([
    "pvAccelerationTimeSec",
    "pvEjectionTimeSec",
    "pvMeanGradientMmHg",
    "pvPeakGradientMmHg",
    "rvTeiIndex",
    "meanPAPMmHg",
    "rvStrokeVolumeMl",
  ].map((metricId) => [
    metricId,
    report.perMetric[metricId].byContext[0],
  ])),
})}\n`);

type Artifact = Readonly<{
  protocol: Readonly<{
    researchContext: Readonly<{ contextId: string }>;
  }>;
  terminal: unknown;
}>;

type MetricReader = (terminal: unknown) => number;

function pathMetric(...keys: readonly string[]): MetricReader {
  return (terminal) => valueAtPath(terminal, keys);
}

function accelerationTime(
  valveId: "AoV" | "PV",
  ejectionId: "aorticEjection" | "pulmonaryEjection",
): MetricReader {
  return (terminal) => {
    const openingTimeSec = valueAtPath(
      terminal,
      ["valve", valveId, "primaryThresholdEpisode", "openingTimeSec"],
    );
    const morphology = valueAtPathUnknown(
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
    if (maxima.length === 0) {
      throw new Error(`${valveId} morphology has no local maximum`);
    }
    const globalPeak = maxima.reduce((best, entry) =>
      entry.value > best.value ? entry : best, maxima[0]!);
    if (Math.abs(globalPeak.value - morphology.maximum) > 1e-8) {
      throw new Error(`${valveId} morphology global maximum is not retained`);
    }
    return globalPeak.timeSec - openingTimeSec;
  };
}

function valueAtPath(root: unknown, keys: readonly string[]): number {
  const value = valueAtPathUnknown(root, keys);
  if (value === null || value === undefined) return 0;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`metric ${keys.join(".")} is not finite`);
  }
  return value;
}

function valueAtPathUnknown(root: unknown, keys: readonly string[]): unknown {
  let value = root;
  for (const key of keys) {
    if (value === null || typeof value !== "object") return null;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function change(source: number, candidate: number) {
  return Object.freeze({
    absolute: candidate - source,
    relative: source === 0 ? 0 : (candidate - source) / source,
  });
}

function range(values: readonly number[]) {
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function readArtifact(filePath: string): Artifact {
  return JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
