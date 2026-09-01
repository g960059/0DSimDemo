import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_ENVELOPE_SUMMARY_V1_ID =
  "main-wire-proximal-arterial-root-envelope-summary-v1" as const;

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

const metricPaths = Object.freeze({
  lvStrokeVolumeMl: ["chamber", "LV", "strokeVolumeMl"],
  lvEjectionFraction01: ["chamber", "LV", "ejectionFraction01"],
  meanAoPMmHg: ["pressure", "AoP", "timeWeightedMean"],
  avEjectionTimeSec: ["ventricularTiming", "LV", "ejectionTimeSec"],
  lvIsovolumicContractionTimeSec:
    ["ventricularTiming", "LV", "isovolumicContractionTimeSec"],
  lvIsovolumicRelaxationTimeSec:
    ["ventricularTiming", "LV", "isovolumicRelaxationTimeSec"],
  lvTeiIndex: ["ventricularTiming", "LV", "teiIndex"],
  avMeanLocalGradientMmHg:
    ["valve", "AoV", "forwardFlowTimeMeanGradientMmHg"],
  avPeakLocalGradientMmHg:
    ["valve", "AoV", "peakForwardGradientMmHg"],
  avMeanRawLvAoGradientMmHg:
    ["valve", "AoV", "rawLvAoNodeForwardGradient", "meanMmHg"],
  lvMaximumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "LV", "maximum"],
  lvMinimumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "LV", "minimum"],
  lvpEjectionReboundMmHg:
    ["morphology", "aorticEjection", "LVP", "largestPostPeakRebound", "rise"],
  aopEjectionReboundMmHg:
    ["morphology", "aorticEjection", "AoP", "largestPostPeakRebound", "rise"],
  mvMeanGradientMmHg:
    ["valve", "MV", "forwardFlowTimeMeanGradientMmHg"],
  mvPeakGradientMmHg: ["valve", "MV", "peakForwardGradientMmHg"],
  mvForwardVolumeMl: ["valve", "MV", "forwardVolumeMl"],
  mvPeakEToA: ["inflowWaves", "MV", "peakEToA"],
  mvForwardVolumeEToA: ["inflowWaves", "MV", "forwardVolumeEToA"],
  rvStrokeVolumeMl: ["chamber", "RV", "strokeVolumeMl"],
  rvEjectionFraction01: ["chamber", "RV", "ejectionFraction01"],
  meanPAPMmHg: ["pressure", "PAP", "timeWeightedMean"],
  pvEjectionTimeSec: ["ventricularTiming", "RV", "ejectionTimeSec"],
  rvIsovolumicContractionTimeSec:
    ["ventricularTiming", "RV", "isovolumicContractionTimeSec"],
  rvIsovolumicRelaxationTimeSec:
    ["ventricularTiming", "RV", "isovolumicRelaxationTimeSec"],
  rvTeiIndex: ["ventricularTiming", "RV", "teiIndex"],
  pvMeanGradientMmHg:
    ["valve", "PV", "forwardFlowTimeMeanGradientMmHg"],
  pvPeakGradientMmHg: ["valve", "PV", "peakForwardGradientMmHg"],
  rvMaximumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "RV", "maximum"],
  rvMinimumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "RV", "minimum"],
  pvFlowEjectionReboundMlPerSec:
    ["morphology", "pulmonaryEjection", "PV", "largestPostPeakRebound", "rise"],
  papDiastolicReboundMmHg:
    ["morphology", "pulmonaryArteryDiastolicRebound", "reboundRiseMmHg"],
  tvMeanGradientMmHg:
    ["valve", "TV", "forwardFlowTimeMeanGradientMmHg"],
  tvPeakGradientMmHg: ["valve", "TV", "peakForwardGradientMmHg"],
  tvForwardVolumeMl: ["valve", "TV", "forwardVolumeMl"],
  tvPeakEToA: ["inflowWaves", "TV", "peakEToA"],
  tvForwardVolumeEToA: ["inflowWaves", "TV", "forwardVolumeEToA"],
} as const satisfies Readonly<Record<string, readonly string[]>>);

const inputDirectory = path.resolve(argument(
  "--input-directory",
  "artifacts/proximal-root-envelope",
));
const outputPath = path.resolve(argument(
  "--output",
  `${inputDirectory}/root-envelope-summary.json`,
));

const arms = contextIds.map((contextId) => {
  const source = readArtifact(`${inputDirectory}/${contextId}-source.json`);
  const candidate = readArtifact(
    `${inputDirectory}/${contextId}-both-resistive.json`,
  );
  if (
    source.protocol.researchContext.contextId !== contextId
    || candidate.protocol.researchContext.contextId !== contextId
  ) {
    throw new Error(`${contextId} artifact context differs`);
  }
  if (
    source.protocol.nominalDtSec !== candidate.protocol.nominalDtSec
    || source.protocol.cycleCount !== candidate.protocol.cycleCount
  ) {
    throw new Error(`${contextId} source/candidate protocols differ`);
  }
  return Object.freeze({ contextId, source, candidate });
});

const metrics = Object.freeze(Object.fromEntries(Object.entries(metricPaths).map(
  ([metricId, metricPath]) => {
    const byContext = arms.map(({ contextId, source, candidate }) => {
      const sourceValue = valueAtPath(source.terminal, metricPath);
      const candidateValue = valueAtPath(candidate.terminal, metricPath);
      return Object.freeze({
        contextId,
        source: sourceValue,
        candidate: candidateValue,
        absoluteChange: candidateValue - sourceValue,
        relativeChange: sourceValue === 0
          ? null
          : (candidateValue - sourceValue) / sourceValue,
      });
    });
    const finiteRelative = byContext.flatMap((entry) =>
      entry.relativeChange === null ? [] : [entry.relativeChange]);
    return [metricId, Object.freeze({
      sourceRange: range(byContext.map((entry) => entry.source)),
      candidateRange: range(byContext.map((entry) => entry.candidate)),
      absoluteChangeRange: range(byContext.map((entry) => entry.absoluteChange)),
      relativeChangeRange: range(finiteRelative),
      maximumAbsoluteRelativeChange: finiteRelative.length === 0
        ? null
        : Math.max(...finiteRelative.map(Math.abs)),
      byContext: Object.freeze(byContext),
    })];
  },
)));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  summaryId: MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_ENVELOPE_SUMMARY_V1_ID,
  design: Object.freeze({
    contextOrder: contextIds,
    contextCount: contextIds.length,
    comparison: "Standard66-source-roots-versus-both-resistive-roots" as const,
    oneFactorAtATimeRangeEndpointsPlusBaseline: true as const,
    independentColdStartPerArm: true as const,
    fixedHorizonScreen: true as const,
    parameterSearchOrFitting: false as const,
  }),
  metrics,
  maximumCandidateMorphologyRebound: Object.freeze({
    lvpEjectionMmHg: metrics.lvpEjectionReboundMmHg.candidateRange.maximum,
    aopEjectionMmHg: metrics.aopEjectionReboundMmHg.candidateRange.maximum,
    pvFlowEjectionMlPerSec:
      metrics.pvFlowEjectionReboundMlPerSec.candidateRange.maximum,
    papDiastolicMmHg:
      metrics.papDiastolicReboundMmHg.candidateRange.maximum,
  }),
  maximumSourceMorphologyRebound: Object.freeze({
    lvpEjectionMmHg: metrics.lvpEjectionReboundMmHg.sourceRange.maximum,
    aopEjectionMmHg: metrics.aopEjectionReboundMmHg.sourceRange.maximum,
    pvFlowEjectionMlPerSec:
      metrics.pvFlowEjectionReboundMlPerSec.sourceRange.maximum,
    papDiastolicMmHg:
      metrics.papDiastolicReboundMmHg.sourceRange.maximum,
  }),
  settlingReadback: Object.freeze(Object.fromEntries(arms.map(
    ({ contextId, source, candidate }) => [contextId, Object.freeze({
      source: source.settlingReadback,
      candidate: candidate.settlingReadback,
    })],
  ))),
  interpretationBoundary: Object.freeze({
    rangeEndpointScreenDoesNotProveInteriorMonotonicity: true as const,
    fixedHorizonScreenIsNotCanonicalPeriodicityEvidence: true as const,
    morphologyPassFailThresholdApplied: false as const,
    v1CompatibilityFlowCacheStillRequiresNewExactStateSchema:
      true as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  maximumSourceMorphologyRebound: report.maximumSourceMorphologyRebound,
  maximumCandidateMorphologyRebound: report.maximumCandidateMorphologyRebound,
  selectedMetricRanges: Object.fromEntries([
    "lvStrokeVolumeMl",
    "meanAoPMmHg",
    "avEjectionTimeSec",
    "avMeanLocalGradientMmHg",
    "lvTeiIndex",
    "rvStrokeVolumeMl",
    "meanPAPMmHg",
    "pvEjectionTimeSec",
    "pvMeanGradientMmHg",
    "rvTeiIndex",
  ].map((metricId) => [metricId, Object.freeze({
    source: report.metrics[metricId].sourceRange,
    candidate: report.metrics[metricId].candidateRange,
    relativeChange: report.metrics[metricId].relativeChangeRange,
  })])),
})}\n`);

type Artifact = Readonly<{
  protocol: Readonly<{
    nominalDtSec: number;
    cycleCount: number;
    researchContext: Readonly<{ contextId: string }>;
  }>;
  terminal: unknown;
  settlingReadback: unknown;
}>;

function readArtifact(filePath: string): Artifact {
  return JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
}

function valueAtPath(root: unknown, keys: readonly string[]): number {
  let value = root;
  for (const key of keys) {
    if (value === null || typeof value !== "object") return 0;
    value = (value as Record<string, unknown>)[key];
  }
  if (value === null || value === undefined) return 0;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`metric ${keys.join(".")} is not finite`);
  }
  return value;
}

function range(values: readonly number[]) {
  if (values.length === 0) return null;
  return Object.freeze({ minimum: Math.min(...values), maximum: Math.max(...values) });
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
