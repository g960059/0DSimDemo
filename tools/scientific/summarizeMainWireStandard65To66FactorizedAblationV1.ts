import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MAIN_WIRE_STANDARD65_TO_66_FACTORIZED_ABLATION_SUMMARY_V1_ID =
  "main-wire-standard65-to-66-factorized-ablation-summary-v1" as const;

const axes = Object.freeze([
  "ventricularMaterial",
  "calcium",
  "rhythmTimingAndPeriodicSeed",
  "aorticOutflow",
] as const);
type Axis = (typeof axes)[number];

const metricDefinitions = Object.freeze({
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
  avLocalPressureTimeIntegralMmHgSec:
    ["valve", "AoV", "forwardPressureTimeIntegralMmHgSec"],
  avMeanRawLvAoGradientMmHg:
    ["valve", "AoV", "rawLvAoNodeForwardGradient", "meanMmHg"],
  avPeakRawLvAoGradientMmHg:
    ["valve", "AoV", "rawLvAoNodeForwardGradient", "peakMmHg"],
  lvMaximumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "LV", "maximum"],
  lvMinimumDpDtMmHgPerSec:
    ["pressureRateMmHgPerSec", "LV", "minimum"],
  lvpEjectionReboundMmHg:
    ["morphology", "aorticEjection", "LVP", "largestPostPeakRebound", "rise"],
  lvpEjectionCentralHalfRangeFraction: [
    "morphology",
    "aorticEjection",
    "LVP",
    "normalizedContour",
    "centralHalfRangeFractionOfFullRange",
  ],
  lvpEjectionTopNinetyDurationFraction: [
    "morphology",
    "aorticEjection",
    "LVP",
    "normalizedContour",
    "topNinetyPercentRangeDurationFraction",
  ],
  lvpEjectionPeakPhase01: [
    "morphology",
    "aorticEjection",
    "LVP",
    "normalizedContour",
    "peakPhase01",
  ],
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
  "artifacts/standard65-to-66-factorized",
));
const outputPath = path.resolve(argument(
  "--output",
  `${inputDirectory}/factorial-summary.json`,
));
const armIds = allFactorialArmIds();
const arms = armIds.map((armId) => readArtifact(`${inputDirectory}/${armId}.json`));
const official65 = readArtifact(`${inputDirectory}/official-standard65.json`);
const official66 = readArtifact(`${inputDirectory}/official-standard66.json`);
validateCommonProtocol([...arms, official65, official66]);
const endpoint65 = arms.find((arm) => arm.armId === "m65-c65-t65-a65")!;
const endpoint66 = arms.find((arm) => arm.armId === "m66-c66-t66-a66")!;

const perMetric = Object.freeze(Object.fromEntries(Object.entries(
  metricDefinitions,
).map(([metricId, metricPath]) => {
  const values = arms.map((arm) => Object.freeze({
    armId: arm.armId,
    axes: arm.construction.axes,
    value: optionalFiniteNumberAtPath(arm.terminal, metricPath),
  }));
  const complete = values.every((entry) => entry.value !== null);
  if (!complete) {
    return [metricId, Object.freeze({
      status: "not-complete-across-factorial" as const,
      values: Object.freeze(values),
    })];
  }
  const finiteValues = values as Array<typeof values[number] & { value: number }>;
  const terms = factorialTerms(finiteValues);
  return [metricId, Object.freeze({
    status: "available" as const,
    standard65Endpoint: finiteValueAtPath(endpoint65.terminal, metricPath),
    standard66Endpoint: finiteValueAtPath(endpoint66.terminal, metricPath),
    endpointDelta: finiteValueAtPath(endpoint66.terminal, metricPath)
      - finiteValueAtPath(endpoint65.terminal, metricPath),
    grandMean: finiteValues.reduce((sum, entry) => sum + entry.value, 0)
      / finiteValues.length,
    factorialTerms: terms,
    rankedAbsoluteMainEffects: Object.freeze(
      terms.filter((term) => term.axes.length === 1)
        .sort((left, right) => Math.abs(right.effect) - Math.abs(left.effect)),
    ),
    rankedAbsoluteTwoWayInteractions: Object.freeze(
      terms.filter((term) => term.axes.length === 2)
        .sort((left, right) => Math.abs(right.effect) - Math.abs(left.effect)),
    ),
  })];
})));

const summary = Object.freeze({
  artifactSchemaVersion: 2 as const,
  summaryId: MAIN_WIRE_STANDARD65_TO_66_FACTORIZED_ABLATION_SUMMARY_V1_ID,
  inputDirectory,
  design: Object.freeze({
    axes,
    fullFactorialArmCount: arms.length,
    factorCoding: "standard65=-1-standard66=+1" as const,
    factorialEffectDefinition:
      "mean(value|term-sign=+1)-mean(value|term-sign=-1)" as const,
    noParameterFitting: true as const,
  }),
  endpointParity: Object.freeze({
    official65VersusFactorizedAll65ExactTerminalJsonEqual:
      JSON.stringify(official65.terminal) === JSON.stringify(endpoint65.terminal),
    official66VersusFactorizedAll66ExactTerminalJsonEqual:
      JSON.stringify(official66.terminal) === JSON.stringify(endpoint66.terminal),
  }),
  perMetric,
  armSettlingReadback: Object.freeze(Object.fromEntries(arms.map((arm) => [
    arm.armId,
    arm.settlingReadback,
  ]))),
  interpretationBoundary: Object.freeze({
    mainEffectsAreMarginalAcrossAllOtherAxes: true as const,
    interactionsAreRetainedRatherThanAssignedToOneMechanism: true as const,
    fixedHorizonScreenNotCanonicalPeriodicityEvidence: true as const,
    pressureMorphologyIsDescriptiveWithoutPassFailThreshold: true as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  endpointParity: summary.endpointParity,
  selectedMetrics: Object.fromEntries([
    "avEjectionTimeSec",
    "avMeanLocalGradientMmHg",
    "lvTeiIndex",
    "lvpEjectionReboundMmHg",
    "lvpEjectionCentralHalfRangeFraction",
    "lvpEjectionTopNinetyDurationFraction",
    "lvpEjectionPeakPhase01",
    "papDiastolicReboundMmHg",
    "pvFlowEjectionReboundMlPerSec",
  ].map((metricId) => [metricId, summary.perMetric[metricId]])),
})}\n`);

type Artifact = Readonly<{
  armId: string;
  construction: Readonly<{
    axes: Readonly<Record<Axis, "standard65" | "standard66">> | null;
  }>;
  protocol: Readonly<{
    nominalDtSec: number;
    cycleCount: number;
  }>;
  terminal: unknown;
  settlingReadback: unknown;
}>;

function factorialTerms(
  values: readonly Readonly<{
    axes: Readonly<Record<Axis, "standard65" | "standard66">> | null;
    value: number;
  }>[],
) {
  return nonemptyAxisSubsets(axes).map((termAxes) => {
    let signedSum = 0;
    for (const entry of values) {
      if (entry.axes === null) throw new Error("factorial arm lacks axes");
      const sign = termAxes.reduce((product, axis) =>
        product * (entry.axes[axis] === "standard66" ? 1 : -1), 1);
      signedSum += sign * entry.value;
    }
    return Object.freeze({
      axes: Object.freeze(termAxes),
      order: termAxes.length,
      effect: 2 * signedSum / values.length,
    });
  });
}

function nonemptyAxisSubsets(values: readonly Axis[]) {
  const result: Axis[][] = [];
  for (let bits = 1; bits < 1 << values.length; bits += 1) {
    result.push(values.filter((_, index) => (bits & (1 << index)) !== 0));
  }
  return result;
}

function allFactorialArmIds() {
  const levels = ["65", "66"] as const;
  const result: string[] = [];
  for (const material of levels) {
    for (const calcium of levels) {
      for (const timing of levels) {
        for (const aortic of levels) {
          result.push(`m${material}-c${calcium}-t${timing}-a${aortic}`);
        }
      }
    }
  }
  return result;
}

function readArtifact(filePath: string): Artifact {
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
  if (typeof parsed.armId !== "string" || parsed.terminal === null) {
    throw new Error(`invalid factorized artifact ${filePath}`);
  }
  return parsed;
}

function validateCommonProtocol(values: readonly Artifact[]) {
  const reference = values[0]!.protocol;
  for (const value of values) {
    if (
      value.protocol.nominalDtSec !== reference.nominalDtSec
      || value.protocol.cycleCount !== reference.cycleCount
    ) {
      throw new Error("factorized artifacts do not share one protocol");
    }
  }
}

function optionalFiniteNumberAtPath(
  root: unknown,
  keys: readonly string[],
): number | null {
  let current = root;
  for (const key of keys) {
    if (current === null || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" && Number.isFinite(current)
    ? current
    : null;
}

function finiteValueAtPath(root: unknown, keys: readonly string[]): number {
  const value = optionalFiniteNumberAtPath(root, keys);
  if (value === null) throw new Error(`metric path ${keys.join(".")} is unavailable`);
  return value;
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
