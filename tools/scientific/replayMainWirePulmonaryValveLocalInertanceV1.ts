import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  createMainWireProximalArterialRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireProximalArterialRootInertanceResearchProfileV1";
import {
  MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1,
} from "@/engine/core/MainWirePulmonaryCharacteristicResistanceResearchProfileV1";
import {
  createMainWireIntegratedModelStandard65To66FactorizedResearchFixtureV1,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_REPLAY_V1_ID =
  "main-wire-pulmonary-valve-local-inertance-replay-v1" as const;

const nominalDtSec = numberArgument("--dt", 0.002);
const cycleCount = integerArgument("--cycles", 20);
const outputPath = path.resolve(argument(
  "--output",
  "artifacts/pulmonary-valve-local-inertance-replay/report.json",
));

const bloodDensityKgPerM3 = 1_060;
const effectiveRvotAreaCm2 = 4;
const columnLengthsCm = Object.freeze([0, 2, 4, 7] as const);
const profiles = Object.freeze(columnLengthsCm.map((columnLengthCm) =>
  Object.freeze({
    profileId: columnLengthCm === 0
      ? "quasi-steady-zero-local-inertance"
      : `rvot-${columnLengthCm}-cm-local-inertance`,
    columnLengthCm,
    localInertanceMmHgSec2PerMl: inertanceFromColumn(
      bloodDensityKgPerM3,
      columnLengthCm,
      effectiveRvotAreaCm2,
    ),
  })));

const fixture = createMainWireIntegratedModelStandard65To66FactorizedResearchFixtureV1(
  Object.freeze({
    ventricularMaterial: "standard66" as const,
    calcium: "standard66" as const,
    rhythmTimingAndPeriodicSeed: "standard66" as const,
    aorticOutflow: "standard66" as const,
  }),
  undefined,
  1,
  undefined,
  createMainWireProximalArterialRootInertanceResearchProfileV1({
    aorticRootMode: "resistive-root",
    pulmonaryRootMode: "resistive-root",
  }),
  MAIN_WIRE_PULMONARY_CHARACTERISTIC_RESISTANCE_RESEARCH_PROFILE_V1,
);
const cycleFixture = fixture as unknown as Parameters<
  typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
>[0];
const pulmonaryValveParams = fixture.runtime.valveResearchInput.valves.PV;
let accepted = cycleFixture.cold.acceptedState;
const replayByProfile = new Map(profiles.map((profile) => [
  profile.profileId,
  { opening01: 0, flowMlPerSec: 0, terminalCycle: [] as ReplaySample[] },
]));
let actualTerminalTrace:
  readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] = [];

for (let cycleIndex = 1; cycleIndex <= cycleCount; cycleIndex += 1) {
  const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    cycleFixture,
    accepted,
    cycleIndex,
    nominalDtSec,
  );
  accepted = run.terminalAcceptedState;
  const retain = cycleIndex === cycleCount;
  if (retain) actualTerminalTrace = run.traceSamples;
  for (const profile of profiles) {
    const replay = replayByProfile.get(profile.profileId)!;
    if (retain) replay.terminalCycle = [];
    for (const sample of run.traceSamples) {
      const step = inertialValveReplayStep(
        replay.opening01,
        replay.flowMlPerSec,
        sample.acceptedDtSec,
        sample.absolutePressureMmHg.RV,
        sample.absolutePressureMmHg.PA,
        pulmonaryValveParams,
        profile.localInertanceMmHgSec2PerMl,
      );
      replay.opening01 = step.opening01;
      replay.flowMlPerSec = step.flowMlPerSec;
      if (retain) replay.terminalCycle.push(Object.freeze({
        timeSec: sample.acceptedTimeSec,
        dtSec: sample.acceptedDtSec,
        pressureGradientMmHg:
          sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA,
        opening01: step.opening01,
        flowMlPerSec: step.flowMlPerSec,
      }));
    }
  }
}

const actualSamples = actualTerminalTrace.map((sample) => Object.freeze({
  timeSec: sample.acceptedTimeSec,
  dtSec: sample.acceptedDtSec,
  pressureGradientMmHg:
    sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA,
  opening01: Number.NaN,
  flowMlPerSec: sample.valveFlowMlPerSec.PV,
}));
const actualMetrics = summarizeFlow(actualSamples);
const arms = Object.freeze(profiles.map((profile) => {
  const samples = replayByProfile.get(profile.profileId)!.terminalCycle;
  const metrics = summarizeFlow(samples);
  return Object.freeze({
    profile,
    metrics,
    versusActual: relativeMetrics(actualMetrics, metrics),
  });
}));
const zeroReplay = arms[0]!.metrics;
const maximumZeroReplayFlowDifferenceMlPerSec = Math.max(
  ...actualSamples.map((sample, index) => Math.abs(
    sample.flowMlPerSec
      - replayByProfile.get(profiles[0]!.profileId)!.terminalCycle[index]!
        .flowMlPerSec,
  )),
);

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_PULMONARY_VALVE_LOCAL_INERTANCE_REPLAY_V1_ID,
  construction: Object.freeze({
    exactClosedLoop:
      "Standard66-both-proximal-roots-resistive-normal-human-pulmonary-Zc" as const,
    replayPressureSource: "terminal-accepted-exact-RVP-minus-PAP" as const,
    bloodDensityKgPerM3,
    effectiveRvotAreaCm2,
    columnLengthsCm,
    inertanceFormula:
      "L=rho*length/area with SI-to-mmHg-s2-per-mL conversion" as const,
    parameterSearchOrFitting: false as const,
  }),
  protocol: Object.freeze({
    nominalDtSec,
    cycleCount,
    replayCarriedContinuouslyAcrossCycles: true as const,
    terminalCycleOnlyMeasured: true as const,
    backwardEulerMomentumReplay: true as const,
    unilateralCompetentClosure: true as const,
    openingKineticsRetained: true as const,
  }),
  actualClosedLoop: actualMetrics,
  maximumZeroReplayFlowDifferenceMlPerSec,
  arms,
  interpretationBoundary: Object.freeze({
    pressureAndChamberStateFeedbackDisabled: true as const,
    replayCanFalsifyWaveformPromiseButCannotEstablishClosedLoopAcceptance:
      true as const,
    localFlowStateNotAddedToExactModelOrCheckpoint: true as const,
    physicalColumnLengthsAreBracketsNotAnatomicalFits: true as const,
    clinicalValidationClaimed: false as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  actualClosedLoop: report.actualClosedLoop,
  maximumZeroReplayFlowDifferenceMlPerSec,
  arms: report.arms,
})}\n`);

type ReplaySample = Readonly<{
  timeSec: number;
  dtSec: number;
  pressureGradientMmHg: number;
  opening01: number;
  flowMlPerSec: number;
}>;

function inertialValveReplayStep(
  previousOpening01: number,
  previousFlowMlPerSec: number,
  dtSec: number,
  upstreamPressureMmHg: number,
  downstreamPressureMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
  inertanceMmHgSec2PerMl: number,
) {
  const gradient = upstreamPressureMmHg - downstreamPressureMmHg;
  const quasiSteady = stepMainWireQuasiSteadyOrificeValveScalarsV2(
    previousOpening01,
    dtSec,
    upstreamPressureMmHg,
    downstreamPressureMmHg,
    params,
  );
  if (!quasiSteady.valid) {
    throw new Error(`PV replay opening step failed: ${quasiSteady.issues.join("; ")}`);
  }
  const opening01 = quasiSteady.state.leafletOpeningFraction01;
  if (inertanceMmHgSec2PerMl === 0) {
    return Object.freeze({
      opening01,
      flowMlPerSec: quasiSteady.flowMlPerSec,
    });
  }
  const areaCm2 = quasiSteady.forwardActiveEoaCm2;
  if (areaCm2 === 0) return Object.freeze({ opening01, flowMlPerSec: 0 });
  const bernoulli = quasiSteady.bernoulliMmHgSec2PerMl2;
  const effectiveGradient = gradient
    + inertanceMmHgSec2PerMl * previousFlowMlPerSec / dtSec;
  const effectiveResistance =
    params.backgroundLinearResistanceMmHgSecPerMl
    + inertanceMmHgSec2PerMl / dtSec;
  return Object.freeze({
    opening01,
    flowMlPerSec: Math.max(0, solveExactSignedQAbsQRoot(
      effectiveGradient,
      effectiveResistance,
      bernoulli,
    )),
  });
}

function solveExactSignedQAbsQRoot(
  pressureGradientMmHg: number,
  resistanceMmHgSecPerMl: number,
  bernoulliMmHgSec2PerMl2: number,
): number {
  if (pressureGradientMmHg === 0) return 0;
  const pressureMagnitude = Math.abs(pressureGradientMmHg);
  const discriminant = Math.sqrt(
    resistanceMmHgSecPerMl ** 2
      + 4 * bernoulliMmHgSec2PerMl2 * pressureMagnitude,
  );
  const flowMagnitude = 2 * pressureMagnitude
    / (resistanceMmHgSecPerMl + discriminant);
  return Math.sign(pressureGradientMmHg) * flowMagnitude;
}

function summarizeFlow(samples: readonly ReplaySample[]) {
  const maximumFlowMlPerSec = Math.max(...samples.map((sample) =>
    sample.flowMlPerSec));
  const thresholdMlPerSec = Math.max(1, 0.01 * maximumFlowMlPerSec);
  const active = samples.map((sample) => sample.flowMlPerSec > thresholdMlPerSec);
  const episodes: Array<[number, number]> = [];
  for (let index = 0; index < active.length; index += 1) {
    if (!active[index] || active[index - 1]) continue;
    let end = index;
    while (end + 1 < active.length && active[end + 1]) end += 1;
    episodes.push([index, end]);
  }
  if (episodes.length === 0) throw new Error("replay has no pulmonary ejection");
  const episode = episodes.reduce((best, candidate) => {
    const bestPeak = maximumInRange(samples, best[0], best[1]);
    const candidatePeak = maximumInRange(samples, candidate[0], candidate[1]);
    return candidatePeak.value > bestPeak.value ? candidate : best;
  }, episodes[0]!);
  const peak = maximumInRange(samples, episode[0], episode[1]);
  const localPeaks = localMaxima(samples, episode[0], episode[1])
    .filter((entry) => entry.value >= 0.05 * maximumFlowMlPerSec);
  const forwardVolumeMl = samples.reduce((sum, sample) =>
    sum + Math.max(0, sample.flowMlPerSec) * sample.dtSec, 0);
  const meanPositiveGradientMmHg = weightedMean(
    samples.filter((sample) => sample.flowMlPerSec > 0),
    (sample) => sample.pressureGradientMmHg,
  );
  return Object.freeze({
    maximumFlowMlPerSec,
    thresholdMlPerSec,
    thresholdEpisodeCount: episodes.length,
    ejectionTimeSec: samples[episode[1]]!.timeSec
      - samples[episode[0]]!.timeSec + samples[episode[1]]!.dtSec,
    accelerationTimeSec: peak.timeSec - samples[episode[0]]!.timeSec,
    localPeakCountAboveFivePercent: localPeaks.length,
    localPeaksAboveFivePercent: Object.freeze(localPeaks),
    forwardVolumeMl,
    meanPositiveGradientMmHg,
    minimumGradientDuringForwardFlowMmHg: Math.min(...samples
      .filter((sample) => sample.flowMlPerSec > 0)
      .map((sample) => sample.pressureGradientMmHg)),
  });
}

function relativeMetrics(
  reference: ReturnType<typeof summarizeFlow>,
  candidate: ReturnType<typeof summarizeFlow>,
) {
  return Object.freeze(Object.fromEntries([
    "maximumFlowMlPerSec",
    "ejectionTimeSec",
    "accelerationTimeSec",
    "forwardVolumeMl",
    "meanPositiveGradientMmHg",
  ].map((key) => {
    const typedKey = key as keyof typeof reference;
    const before = reference[typedKey];
    const after = candidate[typedKey];
    if (typeof before !== "number" || typeof after !== "number") {
      throw new Error(`${key} is not numeric`);
    }
    return [key, Object.freeze({
      absolute: after - before,
      relative: before === 0 ? null : after / before - 1,
    })];
  })));
}

function maximumInRange(
  samples: readonly ReplaySample[],
  start: number,
  end: number,
) {
  let best = Object.freeze({
    index: start,
    timeSec: samples[start]!.timeSec,
    value: samples[start]!.flowMlPerSec,
  });
  for (let index = start + 1; index <= end; index += 1) {
    if (samples[index]!.flowMlPerSec > best.value) {
      best = Object.freeze({
        index,
        timeSec: samples[index]!.timeSec,
        value: samples[index]!.flowMlPerSec,
      });
    }
  }
  return best;
}

function localMaxima(
  samples: readonly ReplaySample[],
  start: number,
  end: number,
) {
  const maxima: Array<Readonly<{ timeSec: number; value: number }>> = [];
  for (let index = Math.max(start + 1, 1); index < Math.min(end, samples.length - 1); index += 1) {
    if (
      samples[index]!.flowMlPerSec > samples[index - 1]!.flowMlPerSec
      && samples[index]!.flowMlPerSec >= samples[index + 1]!.flowMlPerSec
    ) {
      maxima.push(Object.freeze({
        timeSec: samples[index]!.timeSec,
        value: samples[index]!.flowMlPerSec,
      }));
    }
  }
  return maxima;
}

function weightedMean(
  samples: readonly ReplaySample[],
  value: (sample: ReplaySample) => number,
): number {
  const weight = samples.reduce((sum, sample) => sum + sample.dtSec, 0);
  if (!(weight > 0)) throw new Error("weighted mean has no positive duration");
  return samples.reduce((sum, sample) =>
    sum + value(sample) * sample.dtSec, 0) / weight;
}

function inertanceFromColumn(
  densityKgPerM3: number,
  lengthCm: number,
  areaCm2: number,
): number {
  if (lengthCm === 0) return 0;
  const siKgPerM4 = densityKgPerM3 * (lengthCm / 100) / (areaCm2 / 10_000);
  return siKgPerM4 * 1e-6 * 0.0075006168270417;
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function numberArgument(name: string, fallback: number): number {
  const value = Number(argument(name, String(fallback)));
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numberArgument(name, fallback);
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
