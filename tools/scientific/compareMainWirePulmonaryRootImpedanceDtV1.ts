import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import {
  measureMainWireIntegratedModelBaselineValidationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  compareMainWireIntegratedModelAcceptedStatesV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
type Accepted = ReturnType<
  typeof MainWireIntegratedModelStandard68TypedAuthoritySessionV1.prototype.currentAcceptedState
>;

const nominalDtSec = Object.freeze([0.002, 0.001] as const);
const rootResistanceMmHgSecPerMl = finiteArgumentV1(
  "--root-resistance",
  0.03,
);
const inertanceMmHgSec2PerMl = finiteArgumentV1(
  "--root-inertance",
  0.00025,
);
const profile =
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
    rootResistanceMmHgSecPerMl,
    inertanceMmHgSec2PerMl,
  );
const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
);
const targetFixture =
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    profile,
  );
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(
      checkpointV1,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
      1,
      undefined,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    );
const runs = nominalDtSec.map((dtSec) => runToPeriod1V1(
  restored.currentAcceptedState(),
  dtSec,
));
const summaries = runs.map((run) => summarizeV1(run.trace));

process.stdout.write(`${JSON.stringify({
  comparisonId: "main-wire-standard69-pulmonary-root-impedance-dt-halving-v1",
  candidate: {
    rootResistanceMmHgSecPerMl,
    effectiveRootResistanceMmHgSecPerMl:
      rootResistanceMmHgSecPerMl
      * MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1
        .pulmonaryResistance,
    inertanceMmHgSec2PerMl,
  },
  runs: runs.map((run, index) => Object.freeze({
    nominalDtSec: nominalDtSec[index],
    convergence: run.convergence,
    measurements: summaries[index],
  })),
  fineRelativeToCoarse: Object.freeze({
    scalarRelativeDifference: compareScalarsV1(summaries[0]!, summaries[1]!),
    waveformNormalizedRmse: compareWaveformsV1(
      runs[0]!.trace,
      runs[1]!.trace,
    ),
  }),
  interpretationBoundary:
    "numerical dt-halving characterization only; not clinical validation",
}, null, 2)}\n`);

function runToPeriod1V1(source: Accepted, dtSec: number) {
  let accepted = warmStartMainWireIntegratedModelV3({
    source,
    sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
    targetRuntime: targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
  });
  let trace: readonly Sample[] = [];
  let maximumNormalizedDelta = Number.POSITIVE_INFINITY;
  let consecutivePasses = 0;
  let completedCycles = 0;
  for (let cycle = 1; cycle <= 50; cycle += 1) {
    const prior = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      targetFixture as unknown as
        MainWireIntegratedModelRegularSinusAllOffFixtureV3,
      accepted,
      cycle,
      dtSec,
    );
    accepted = run.terminalAcceptedState;
    trace = run.traceSamples;
    completedCycles = cycle;
    maximumNormalizedDelta = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      prior,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      targetFixture.config,
    ).overall.maximumNormalizedDelta;
    consecutivePasses = maximumNormalizedDelta <= 0.001
      ? consecutivePasses + 1
      : 0;
    if (consecutivePasses >= 3) break;
  }
  return Object.freeze({
    accepted,
    trace,
    convergence: Object.freeze({
      completedCycles,
      consecutivePasses,
      maximumNormalizedDelta,
    }),
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const left = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const pvFlow = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const tvFlow = samples.map((sample) => sample.valveFlowMlPerSec.TV);
  const pap = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const pvOpen = thresholdOpenV1(pvFlow);
  const pvOpening = transitionV1(pvOpen, false, true);
  const pvClosure = nextTransitionV1(pvOpen, pvOpening, true, false);
  const tvOpen = thresholdOpenV1(tvFlow);
  const tvClosure = previousTransitionV1(tvOpen, pvOpening, true, false);
  const tvOpening = nextTransitionV1(tvOpen, pvClosure, false, true);
  const pvIndices = cyclicIndicesV1(samples.length, pvOpening, pvClosure);
  const peakFlowIndex = pvIndices.reduce((best, index) =>
    pvFlow[index]! > pvFlow[best]! ? index : best, pvIndices[0]!);
  const rvRate = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV) / sample.acceptedDtSec);
  return Object.freeze({
    left,
    right: Object.freeze({
      maximumDpDtMmHgPerSec: Math.max(...rvRate),
      minimumDpDtMmHgPerSec: Math.min(...rvRate),
      ictSec: cyclicDurationV1(samples, tvClosure, pvOpening),
      ejectionTimeSec: cyclicDurationV1(samples, pvOpening, pvClosure),
      irtSec: cyclicDurationV1(samples, pvClosure, tvOpening),
    }),
    pulmonaryValve: Object.freeze({
      peakCount: prominentPeakCountV1(samples, pvFlow),
      peakFlowMlPerSec: pvFlow[peakFlowIndex],
      accelerationTimeSec: cyclicDurationV1(
        samples,
        pvOpening,
        (peakFlowIndex + 1) % samples.length,
      ),
    }),
    pulmonaryArtery: Object.freeze({
      peakCount: prominentPeakCountV1(samples, pap),
      minimumMmHg: Math.min(...pap),
      maximumMmHg: Math.max(...pap),
      postClosureReboundMmHg: postClosureReboundV1(
        samples,
        pap,
        pvClosure,
        pvOpening,
      ),
    }),
  });
}

function compareScalarsV1(
  coarse: ReturnType<typeof summarizeV1>,
  fine: ReturnType<typeof summarizeV1>,
) {
  const pairs = Object.freeze({
    avEjectionTime: [
      coarse.left.aorticValve.ejectionTimeSec,
      fine.left.aorticValve.ejectionTimeSec,
    ],
    avMeanGradient: [
      coarse.left.aorticValve.meanGradientMmHg,
      fine.left.aorticValve.meanGradientMmHg,
    ],
    avPeakGradient: [
      coarse.left.aorticValve.peakGradientMmHg,
      fine.left.aorticValve.peakGradientMmHg,
    ],
    lvMaximumDpDt: [
      coarse.left.leftVentricle.maximumDpDtMmHgPerSec,
      fine.left.leftVentricle.maximumDpDtMmHgPerSec,
    ],
    lvMinimumDpDt: [
      coarse.left.leftVentricle.minimumDpDtMmHgPerSec,
      fine.left.leftVentricle.minimumDpDtMmHgPerSec,
    ],
    mitralPeakEToA: [
      coarse.left.mitralFlow.peakEToA,
      fine.left.mitralFlow.peakEToA,
    ],
    lvTeiIndex: [
      coarse.left.timing.teiIndex,
      fine.left.timing.teiIndex,
    ],
    rvEjectionTime: [coarse.right.ejectionTimeSec, fine.right.ejectionTimeSec],
    rvMaximumDpDt: [
      coarse.right.maximumDpDtMmHgPerSec,
      fine.right.maximumDpDtMmHgPerSec,
    ],
    rvMinimumDpDt: [
      coarse.right.minimumDpDtMmHgPerSec,
      fine.right.minimumDpDtMmHgPerSec,
    ],
    pvPeakFlow: [
      coarse.pulmonaryValve.peakFlowMlPerSec,
      fine.pulmonaryValve.peakFlowMlPerSec,
    ],
    pvAccelerationTime: [
      coarse.pulmonaryValve.accelerationTimeSec,
      fine.pulmonaryValve.accelerationTimeSec,
    ],
    paMinimumPressure: [
      coarse.pulmonaryArtery.minimumMmHg,
      fine.pulmonaryArtery.minimumMmHg,
    ],
    paMaximumPressure: [
      coarse.pulmonaryArtery.maximumMmHg,
      fine.pulmonaryArtery.maximumMmHg,
    ],
  } as const);
  return Object.freeze(Object.fromEntries(Object.entries(pairs).map(
    ([key, [coarseValue, fineValue]]) => [key, Object.freeze({
      coarse: coarseValue,
      fine: fineValue,
      relativeDifference: relativeDifferenceV1(coarseValue, fineValue),
    })],
  )));
}

function compareWaveformsV1(
  coarse: readonly Sample[],
  fine: readonly Sample[],
) {
  const signals = Object.freeze({
    LVP: (sample: Sample) => sample.absolutePressureMmHg.LV,
    RVP: (sample: Sample) => sample.absolutePressureMmHg.RV,
    PAP: (sample: Sample) => sample.absolutePressureMmHg.PA,
    PVFlow: (sample: Sample) => sample.valveFlowMlPerSec.PV,
  });
  return Object.freeze(Object.fromEntries(Object.entries(signals).map(
    ([signalId, value]) => {
      const left = resampleCycleV1(coarse, value);
      const right = resampleCycleV1(fine, value);
      const range = Math.max(...left) - Math.min(...left);
      const scale = Math.max(range, Math.max(...left.map(Math.abs)), 1e-12);
      const rmse = Math.sqrt(left.reduce((sum, candidate, index) =>
        sum + (candidate - right[index]!) ** 2, 0) / left.length);
      return [signalId, rmse / scale];
    },
  )));
}

function resampleCycleV1(
  samples: readonly Sample[],
  value: (sample: Sample) => number,
) {
  const cycleLengthSec = samples.reduce(
    (sum, sample) => sum + sample.acceptedDtSec,
    0,
  );
  const cycleStartSec = samples.at(-1)!.acceptedTimeSec - cycleLengthSec;
  const points = [
    Object.freeze({ t: 0, value: value(samples.at(-1)!) }),
    ...samples.slice(0, -1).map((sample) => Object.freeze({
      t: sample.acceptedTimeSec - cycleStartSec,
      value: value(sample),
    })),
    Object.freeze({ t: cycleLengthSec, value: value(samples.at(-1)!) }),
  ].sort((left, right) => left.t - right.t);
  let right = 1;
  return Array.from({ length: 1000 }, (_, index) => {
    const target = index * cycleLengthSec / 1000;
    while (right < points.length - 1 && points[right]!.t < target) right += 1;
    const left = points[right - 1]!;
    const next = points[right]!;
    const fraction = next.t === left.t ? 0 : (target - left.t) / (next.t - left.t);
    return left.value + fraction * (next.value - left.value);
  });
}

function prominentPeakCountV1(
  samples: readonly Sample[],
  values: readonly number[],
) {
  const resampled = resampleCycleV1(
    samples,
    (sample) => values[samples.indexOf(sample)]!,
  );
  const smooth = resampled.map((_, index) => {
    let total = 0;
    for (let offset = -4; offset <= 4; offset += 1) {
      total += resampled[(index + offset + resampled.length) % resampled.length]!;
    }
    return total / 9;
  });
  const minimum = Math.min(...smooth)
    + 0.1 * (Math.max(...smooth) - Math.min(...smooth));
  const candidates = smooth.flatMap((candidate, index) => {
    const prior = smooth[(index - 1 + smooth.length) % smooth.length]!;
    const next = smooth[(index + 1) % smooth.length]!;
    return candidate > prior && candidate >= next && candidate >= minimum
      ? [index]
      : [];
  }).sort((left, right) => smooth[right]! - smooth[left]!);
  const selected: number[] = [];
  for (const index of candidates) {
    if (selected.every((other) => Math.min(
      Math.abs(index - other),
      smooth.length - Math.abs(index - other),
    ) >= 50)) selected.push(index);
  }
  return selected.length;
}

function postClosureReboundV1(
  samples: readonly Sample[],
  values: readonly number[],
  closure: number,
  opening: number,
) {
  let minimum = Number.POSITIVE_INFINITY;
  let rebound = 0;
  for (const index of cyclicIndicesV1(samples.length, closure, opening)) {
    minimum = Math.min(minimum, values[index]!);
    rebound = Math.max(rebound, values[index]! - minimum);
  }
  return rebound;
}

function thresholdOpenV1(values: readonly number[]) {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((candidate) => candidate > threshold);
}

function transitionV1(values: readonly boolean[], from: boolean, to: boolean) {
  const index = values.findIndex((candidate, position) =>
    candidate === to
    && values[(position - 1 + values.length) % values.length] === from);
  if (index < 0) throw new Error("required transition unavailable");
  return index;
}

function nextTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
) {
  for (let offset = 1; offset <= values.length; offset += 1) {
    const index = (start + offset) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required next transition unavailable");
}

function previousTransitionV1(
  values: readonly boolean[],
  start: number,
  from: boolean,
  to: boolean,
) {
  for (let offset = 0; offset < values.length; offset += 1) {
    const index = (start - offset + values.length) % values.length;
    const prior = (index - 1 + values.length) % values.length;
    if (values[prior] === from && values[index] === to) return index;
  }
  throw new Error("required previous transition unavailable");
}

function cyclicDurationV1(
  samples: readonly Sample[],
  start: number,
  end: number,
) {
  return cyclicIndicesV1(samples.length, start, end).reduce(
    (sum, index) => sum + samples[index]!.acceptedDtSec,
    0,
  );
}

function cyclicIndicesV1(length: number, start: number, end: number) {
  const result: number[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset) % length;
    if (index === end) break;
    result.push(index);
  }
  return result;
}

function relativeDifferenceV1(left: number, right: number) {
  return Math.abs(right - left) / Math.max(Math.abs(left), Math.abs(right), 1e-12);
}

function finiteArgumentV1(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const raw = process.argv[index + 1];
  if (raw === undefined || raw.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  return value;
}
