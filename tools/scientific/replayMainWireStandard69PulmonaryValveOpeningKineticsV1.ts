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
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import {
  createMainWireFourValveContinuousAreaResearchInputV1,
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  stepMainWireQuasiSteadyOrificeValveScalarsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;

const rootProfile =
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
    0.024,
    0,
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
    rootProfile,
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
let accepted = warmStartMainWireIntegratedModelV3({
  source: restored.currentAcceptedState(),
  sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
  targetRuntime: targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
});
let trace: readonly Sample[] = [];
let maximumNormalizedDelta = Number.POSITIVE_INFINITY;
let consecutivePasses = 0;
let completedCycles = 0;
for (let cycle = 1; cycle <= 40; cycle += 1) {
  const prior = accepted;
  const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    targetFixture as unknown as
      MainWireIntegratedModelRegularSinusAllOffFixtureV3,
    accepted,
    cycle,
    0.002,
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

const baselinePv = createMainWireFourValveContinuousAreaResearchInputV1(
  MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1,
).valves.PV;
const openingTimeConstantsSec = Object.freeze([
  0.002,
  0.005,
  0.01,
  0.02,
  0.04,
  0.08,
] as const);
const results = openingTimeConstantsSec.map((openingTimeConstantSec) => {
  const params = Object.freeze({
    ...baselinePv,
    parameterSetId:
      `open-loop-pv-opening-tau-${openingTimeConstantSec}-sec-v1`,
    openingTimeConstantSec,
  });
  let opening01 = 0;
  let cycleStartOpening01 = opening01;
  let replayedFlow: readonly number[] = [];
  let completedReplayCycles = 0;
  for (let cycle = 1; cycle <= 100; cycle += 1) {
    cycleStartOpening01 = opening01;
    const flow: number[] = [];
    for (const sample of trace) {
      const evaluation = stepMainWireQuasiSteadyOrificeValveScalarsV2(
        opening01,
        sample.acceptedDtSec,
        sample.absolutePressureMmHg.RV,
        sample.absolutePressureMmHg.PA,
        params,
      );
      if (!evaluation.valid) {
        throw new Error(evaluation.issues.join("; "));
      }
      opening01 = evaluation.state.leafletOpeningFraction01;
      flow.push(evaluation.flowMlPerSec);
    }
    replayedFlow = Object.freeze(flow);
    completedReplayCycles = cycle;
    if (Math.abs(opening01 - cycleStartOpening01) <= 1e-12) break;
  }
  return Object.freeze({
    openingTimeConstantSec,
    completedReplayCycles,
    periodicOpeningResidual01: Math.abs(opening01 - cycleStartOpening01),
    metrics: summarizeFlowV1(trace, replayedFlow),
  });
});

const reference = results.find((result) =>
  result.openingTimeConstantSec === baselinePv.openingTimeConstantSec);
if (reference === undefined) {
  throw new Error("source PV opening-time reference was not replayed");
}

process.stdout.write(`${JSON.stringify({
  replayId: "main-wire-standard69-pv-opening-kinetics-open-loop-replay-v1",
  pressureSource: Object.freeze({
    rootResistanceMmHgSecPerMl: 0.024,
    rootInertanceMmHgSec2PerMl: 0,
    completedCycles,
    consecutivePasses,
    maximumNormalizedDelta,
  }),
  fixedFactors:
    "settled RV and PA pressure waveforms; only the existing PV opening time constant is replayed",
  interpretationBoundary:
    "open-loop causal screen only; changed flow does not feed back into pressure, volume, or valve events",
  referenceOpeningTimeConstantSec: baselinePv.openingTimeConstantSec,
  referenceForwardVolumeMl: reference.metrics.forwardVolumeMl,
  results,
}, null, 2)}\n`);

function summarizeFlowV1(
  samples: readonly Sample[],
  flow: readonly number[],
) {
  const peakFlowMlPerSec = Math.max(...flow);
  const open = flow.map((value) =>
    value > Math.max(1, 0.01 * peakFlowMlPerSec));
  const opening = transitionV1(open, false, true);
  const closure = nextTransitionV1(open, opening, true, false);
  const ejection = cyclicIndicesV1(samples.length, opening, closure);
  const peakIndex = ejection.reduce((best, index) =>
    flow[index]! > flow[best]! ? index : best, ejection[0]!);
  return Object.freeze({
    peakFlowMlPerSec,
    forwardVolumeMl: samples.reduce((sum, sample, index) =>
      sum + Math.max(0, flow[index]!) * sample.acceptedDtSec, 0),
    forwardDurationSec: cyclicDurationV1(samples, opening, closure),
    accelerationTimeSec: cyclicDurationV1(
      samples,
      opening,
      (peakIndex + 1) % samples.length,
    ),
    peakPhaseWithinEjection01:
      cyclicDurationV1(samples, opening, (peakIndex + 1) % samples.length)
      / cyclicDurationV1(samples, opening, closure),
    prominentPeakCount: prominentPeakCountV1(flow),
  });
}

function prominentPeakCountV1(raw: readonly number[]) {
  const smooth = raw.map((_, index) => {
    let total = 0;
    for (let offset = -2; offset <= 2; offset += 1) {
      total += raw[(index + offset + raw.length) % raw.length]!;
    }
    return total / 5;
  });
  const minimum = Math.min(...smooth)
    + 0.1 * (Math.max(...smooth) - Math.min(...smooth));
  const candidates = smooth.flatMap((value, index) => {
    const prior = smooth[(index - 1 + smooth.length) % smooth.length]!;
    const next = smooth[(index + 1) % smooth.length]!;
    return value > prior && value >= next && value >= minimum ? [index] : [];
  }).sort((left, right) => smooth[right]! - smooth[left]!);
  const selected: number[] = [];
  for (const index of candidates) {
    if (selected.every((other) => Math.min(
      Math.abs(index - other),
      raw.length - Math.abs(index - other),
    ) * 0.002 >= 0.05)) selected.push(index);
  }
  return selected.length;
}

function transitionV1(values: readonly boolean[], from: boolean, to: boolean) {
  const index = values.findIndex((value, candidate) =>
    value === to
    && values[(candidate - 1 + values.length) % values.length] === from);
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
