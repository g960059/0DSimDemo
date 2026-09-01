import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

import {
  runMainWireIntegratedModelPeriodicSteadyV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type ValveId = keyof Sample["valveFlowMlPerSec"];
type PressureId = keyof Sample["absolutePressureMmHg"];

const standard65 = await runMainWireIntegratedModelPeriodicSteadyV3({
  nominalDtSec: 0.002,
  executionPurpose: "canonical-evidence",
});
const roundedFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const roundedRestored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
const standard68Run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  roundedFixture as unknown as
    MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  roundedRestored.currentAcceptedState(),
  135,
  0.002,
);

const report = Object.freeze({
  comparisonId: "main-wire-standard65-vs-standard68-right-heart-valves-v1",
  measurementBasis:
    "raw accepted endpoints at dt=0.002 s; thresholded morphology is characterization, not a clinical validation claim",
  standard65: Object.freeze({
    completedCycleCount: standard65.completedCycleCount,
    periodicity: standard65.classification.status,
    summary: summarizeV1(standard65.terminalCycleTrace.samples),
  }),
  standard68: Object.freeze({
    settledCheckpointTimeSec:
      roundedRestored.currentAcceptedState().acceptedTimeSec,
    summary: summarizeV1(standard68Run.traceSamples),
  }),
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

function summarizeV1(samples: readonly Sample[]) {
  const valves = Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const).map((valveId) => [
      valveId,
      valveSummaryV1(samples, valveId),
    ]),
  );
  return Object.freeze({
    pressure: Object.fromEntries(
      (["LV", "RV", "Ao", "PA"] as const).map((pressureId) => [
        pressureId,
        pressureSummaryV1(samples, pressureId),
      ]),
    ),
    pressureRateMmHgPerSec: Object.freeze({
      LV: pressureRateV1(samples, "LV"),
      RV: pressureRateV1(samples, "RV"),
    }),
    valve: valves,
    filling: Object.freeze({
      mitral: inletPeakRatioV1(samples, "MV", "AoV"),
      tricuspid: inletPeakRatioV1(samples, "TV", "PV"),
    }),
    timing: Object.freeze({
      left: ventricularTimingV1(samples, "MV", "AoV"),
      right: ventricularTimingV1(samples, "TV", "PV"),
    }),
  });
}

function pressureSummaryV1(
  samples: readonly Sample[],
  pressureId: PressureId,
) {
  const values = samples.map((sample) =>
    sample.absolutePressureMmHg[pressureId]);
  const duration = samples.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  return Object.freeze({
    minimumMmHg: Math.min(...values),
    maximumMmHg: Math.max(...values),
    timeWeightedMeanMmHg: samples.reduce((sum, sample, index) =>
      sum + values[index]! * sample.acceptedDtSec, 0) / duration,
    prominentPeaks: prominentPeaksV1(samples, values),
  });
}

function pressureRateV1(
  samples: readonly Sample[],
  pressureId: "LV" | "RV",
) {
  const rates = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg[pressureId]
      - samples[index]!.absolutePressureMmHg[pressureId])
      / sample.acceptedDtSec);
  return Object.freeze({
    maximum: Math.max(...rates),
    minimum: Math.min(...rates),
  });
}

function valveSummaryV1(samples: readonly Sample[], valveId: ValveId) {
  const flows = samples.map((sample) => sample.valveFlowMlPerSec[valveId]);
  const maximumFlow = Math.max(...flows);
  const morphologyThreshold = Math.max(1, 0.01 * maximumFlow);
  const forward = flows.map((flow) => flow > 0);
  const morphologicalForward = flows.map((flow) =>
    flow > morphologyThreshold);
  const gradients = samples.map((sample) => valveGradientV1(sample, valveId));
  const durationSec = samples.reduce((sum, sample, index) =>
    sum + (forward[index] ? sample.acceptedDtSec : 0), 0);
  const pressureIntegral = samples.reduce((sum, sample, index) =>
    sum + (forward[index]
      ? gradients[index]! * sample.acceptedDtSec
      : 0), 0);
  return Object.freeze({
    forwardEpisodeCount: cyclicEpisodeCountV1(morphologicalForward),
    forwardDurationSec: durationSec,
    forwardVolumeMl: samples.reduce((sum, sample, index) =>
      sum + Math.max(0, flows[index]!) * sample.acceptedDtSec, 0),
    peakFlowMlPerSec: maximumFlow,
    meanHydraulicGradientMmHg:
      durationSec > 0 ? pressureIntegral / durationSec : null,
    peakHydraulicGradientMmHg: Math.max(
      ...gradients.filter((_, index) => forward[index]),
    ),
    prominentFlowPeaks: prominentPeaksV1(samples, flows),
  });
}

function valveGradientV1(sample: Sample, valveId: ValveId): number {
  if (valveId === "MV") {
    return sample.absolutePressureMmHg.LA - sample.absolutePressureMmHg.LV;
  }
  if (valveId === "AoV") {
    return sample.absolutePressureMmHg.LV - sample.absolutePressureMmHg.Ao;
  }
  if (valveId === "TV") {
    return sample.absolutePressureMmHg.RA - sample.absolutePressureMmHg.RV;
  }
  return sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA;
}

function ventricularTimingV1(
  samples: readonly Sample[],
  inletId: "MV" | "TV",
  outletId: "AoV" | "PV",
) {
  const inlet = thresholdedOpenV1(samples, inletId);
  const outlet = thresholdedOpenV1(samples, outletId);
  const outletOpen = firstTransitionV1(outlet, false, true);
  const outletClose = nextTransitionV1(outlet, outletOpen, true, false);
  const inletClose = previousTransitionV1(inlet, outletOpen, true, false);
  const inletOpen = nextTransitionV1(inlet, outletClose, false, true);
  const ictSec = cyclicDurationV1(samples, inletClose, outletOpen);
  const etSec = cyclicDurationV1(samples, outletOpen, outletClose);
  const irtSec = cyclicDurationV1(samples, outletClose, inletOpen);
  return Object.freeze({
    ictSec,
    ejectionTimeSec: etSec,
    irtSec,
    teiIndex: (ictSec + irtSec) / etSec,
  });
}

function inletPeakRatioV1(
  samples: readonly Sample[],
  inletId: "MV" | "TV",
  outletId: "AoV" | "PV",
) {
  const inlet = thresholdedOpenV1(samples, inletId);
  const outlet = thresholdedOpenV1(samples, outletId);
  const outletClose = nextTransitionV1(
    outlet,
    firstTransitionV1(outlet, false, true),
    true,
    false,
  );
  const inletClose = nextTransitionV1(inlet, outletClose, true, false);
  const indices = cyclicIndicesV1(samples.length, outletClose, inletClose);
  const candidates = indices.filter((index, position) => {
    const prior = indices[(position - 1 + indices.length) % indices.length]!;
    const next = indices[(position + 1) % indices.length]!;
    const value = samples[index]!.valveFlowMlPerSec[inletId];
    return value > samples[prior]!.valveFlowMlPerSec[inletId]
      && value >= samples[next]!.valveFlowMlPerSec[inletId]
      && value > 1;
  });
  const separated = [...candidates]
    .sort((left, right) =>
      samples[right]!.valveFlowMlPerSec[inletId]
        - samples[left]!.valveFlowMlPerSec[inletId])
    .reduce<number[]>((selected, index) => {
      const farEnough = selected.every((other) => {
        const distance = Math.min(
          Math.abs(index - other),
          samples.length - Math.abs(index - other),
        );
        return distance * 0.002 >= 0.08;
      });
      return farEnough ? [...selected, index] : selected;
    }, [])
    .slice(0, 2)
    .sort((left, right) =>
      cyclicOffsetV1(samples.length, outletClose, left)
        - cyclicOffsetV1(samples.length, outletClose, right));
  const early = separated[0];
  const late = separated[1];
  if (early === undefined || late === undefined) {
    return Object.freeze({ status: "two-peaks-not-resolved" as const });
  }
  const peakE = samples[early]!.valveFlowMlPerSec[inletId];
  const peakA = samples[late]!.valveFlowMlPerSec[inletId];
  return Object.freeze({
    status: "resolved" as const,
    peakEMlPerSec: peakE,
    peakAMlPerSec: peakA,
    peakEToA: peakE / peakA,
  });
}

function prominentPeaksV1(
  samples: readonly Sample[],
  rawValues: readonly number[],
) {
  const smoothed = rawValues.map((_, index) => {
    let total = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      total += rawValues[(index + offset + rawValues.length)
        % rawValues.length]!;
    }
    return total / 5;
  });
  const range = Math.max(...smoothed) - Math.min(...smoothed);
  const minimum = Math.min(...smoothed) + 0.1 * range;
  const candidates = smoothed.flatMap((value, index) => {
    const prior = smoothed[(index - 1 + smoothed.length) % smoothed.length]!;
    const next = smoothed[(index + 1) % smoothed.length]!;
    return value > prior && value >= next && value >= minimum ? [index] : [];
  });
  const selected = [...candidates]
    .sort((left, right) => smoothed[right]! - smoothed[left]!)
    .reduce<number[]>((kept, index) => kept.every((other) => {
      const distance = Math.min(
        Math.abs(index - other),
        samples.length - Math.abs(index - other),
      );
      return distance * 0.002 >= 0.05;
    }) ? [...kept, index] : kept, [])
    .sort((left, right) => left - right);
  return Object.freeze(selected.map((index) => Object.freeze({
    phase01: samples[index]!.cyclePhase01,
    value: rawValues[index],
  })));
}

function thresholdedOpenV1(
  samples: readonly Sample[],
  valveId: ValveId,
) {
  const peak = Math.max(...samples.map((sample) =>
    sample.valveFlowMlPerSec[valveId]));
  const threshold = Math.max(1, 0.01 * peak);
  return samples.map((sample) =>
    sample.valveFlowMlPerSec[valveId] > threshold);
}

function cyclicEpisodeCountV1(values: readonly boolean[]): number {
  return values.filter((value, index) =>
    value && !values[(index - 1 + values.length) % values.length]).length;
}

function firstTransitionV1(
  values: readonly boolean[],
  from: boolean,
  to: boolean,
): number {
  const index = values.findIndex((value, candidate) =>
    value === to
    && values[(candidate - 1 + values.length) % values.length] === from);
  if (index < 0) throw new Error("required cyclic transition is unavailable");
  return index;
}

function nextTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 1; offset <= values.length; offset += 1) {
    const index = (start + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required next cyclic transition is unavailable");
}

function previousTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
): number {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (start - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required prior cyclic transition is unavailable");
}

function cyclicDurationV1(
  samples: readonly Sample[],
  start: number,
  end: number,
): number {
  return cyclicIndicesV1(samples.length, start, end).reduce(
    (sum, index) => sum + samples[index]!.acceptedDtSec,
    0,
  );
}

function cyclicIndicesV1(
  length: number,
  start: number,
  end: number,
): readonly number[] {
  const indices: number[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset) % length;
    if (index === end) break;
    indices.push(index);
  }
  return indices;
}

function cyclicOffsetV1(length: number, start: number, index: number) {
  return (index - start + length) % length;
}
