import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_ABLATION_SUMMARY_V1_ID =
  "main-wire-proximal-arterial-root-ablation-summary-v1" as const;

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
  "artifacts/proximal-root-ablation",
));
const outputPath = path.resolve(argument(
  "--output",
  `${inputDirectory}/root-ablation-summary.json`,
));
const source = readArtifact(`${inputDirectory}/standard66-source-inertance.json`);
const aortic = readArtifact(`${inputDirectory}/standard66-aortic-resistive.json`);
const pulmonary = readArtifact(`${inputDirectory}/standard66-pulmonary-resistive.json`);
const both = readArtifact(`${inputDirectory}/standard66-both-resistive.json`);
const sourceDt1 = readArtifact(
  `${inputDirectory}/standard66-source-inertance-dt1ms.json`,
);
const bothDt1 = readArtifact(
  `${inputDirectory}/standard66-both-resistive-dt1ms.json`,
);
validateProtocol(source, aortic, pulmonary, both);

const metrics = Object.freeze(Object.fromEntries(Object.entries(metricPaths).map(
  ([metricId, metricPath]) => {
    const sourceValue = valueAtPath(source.terminal, metricPath);
    const aorticValue = valueAtPath(aortic.terminal, metricPath);
    const pulmonaryValue = valueAtPath(pulmonary.terminal, metricPath);
    const bothValue = valueAtPath(both.terminal, metricPath);
    return [metricId, Object.freeze({
      source: sourceValue,
      aorticResistive: aorticValue,
      pulmonaryResistive: pulmonaryValue,
      bothResistive: bothValue,
      aorticRootEffect: change(sourceValue, aorticValue),
      pulmonaryRootEffect: change(sourceValue, pulmonaryValue),
      bothVersusSource: change(sourceValue, bothValue),
      twoRootInteraction:
        bothValue - aorticValue - pulmonaryValue + sourceValue,
      dtHalving: Object.freeze({
        sourceDt1MinusDt2:
          valueAtPath(sourceDt1.terminal, metricPath) - sourceValue,
        bothResistiveDt1MinusDt2:
          valueAtPath(bothDt1.terminal, metricPath) - bothValue,
      }),
    })];
  },
)));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  summaryId: MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_ABLATION_SUMMARY_V1_ID,
  inputDirectory,
  design: Object.freeze({
    standard66MechanismsHeldFixed: true as const,
    aorticAndPulmonaryRootInertanceTwoByTwo: true as const,
    sourceNominalDtSec: source.protocol.nominalDtSec,
    dtHalvingSec: sourceDt1.protocol.nominalDtSec,
    cycleCount: source.protocol.cycleCount,
    independentColdStarts: true as const,
    parameterSearchOrFitting: false as const,
  }),
  metrics,
  interpretationBoundary: Object.freeze({
    resistiveRootMeansSameResistanceAndQuadraticLossWithZeroInertance:
      true as const,
    v1AcceptedDynamicFlowFieldRetainedAsDerivedCompatibilityCache:
      true as const,
    compatibilityCacheIsNotUsedAsPriorFlowForResistiveRoot: true as const,
    promotableExactStateAndCheckpointSchemaEstablished: false as const,
    numericalPeriodicityClaimed: false as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  selectedMetrics: Object.fromEntries([
    "avEjectionTimeSec",
    "avMeanLocalGradientMmHg",
    "lvStrokeVolumeMl",
    "lvpEjectionReboundMmHg",
    "aopEjectionReboundMmHg",
    "pvEjectionTimeSec",
    "rvTeiIndex",
    "pvFlowEjectionReboundMlPerSec",
    "papDiastolicReboundMmHg",
  ].map((metricId) => [metricId, report.metrics[metricId]])),
})}\n`);

type Artifact = Readonly<{
  protocol: Readonly<{ nominalDtSec: number; cycleCount: number }>;
  terminal: unknown;
}>;

function readArtifact(filePath: string): Artifact {
  return JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
}

function validateProtocol(...artifacts: readonly Artifact[]): void {
  const expected = artifacts[0]!.protocol;
  if (artifacts.some((artifact) =>
    artifact.protocol.nominalDtSec !== expected.nominalDtSec
    || artifact.protocol.cycleCount !== expected.cycleCount)) {
    throw new Error("root ablation artifacts do not share one protocol");
  }
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

function change(sourceValue: number, candidateValue: number) {
  return Object.freeze({
    absolute: candidateValue - sourceValue,
    relative: sourceValue === 0
      ? null
      : (candidateValue - sourceValue) / sourceValue,
  });
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
