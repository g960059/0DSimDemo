import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  warmStartMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type {
  MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
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
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;

const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
const sourceAccepted = restored.currentAcceptedState();
const results = [];
let scale1Continuation: Readonly<{
  accepted: typeof sourceAccepted;
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1
  >;
}> | null = null;
let priorContinuation: typeof scale1Continuation = null;

for (const rvfwActiveTensionScale of [1, 0.9, 0.8, 0.75, 1.1]) {
  const base = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3;
  const mechanism = Object.freeze({
    ...base,
    chamberMechanics: Object.freeze({
      ...base.chamberMechanics,
      activeTensionScaleByWall: Object.freeze({
        ...base.chamberMechanics.activeTensionScaleByWall,
        RVFW: rvfwActiveTensionScale,
      }),
    }),
  });
  const targetFixture =
    createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    undefined,
    1,
    mechanism,
  );
  const continuationSource = rvfwActiveTensionScale === 1.1
    ? scale1Continuation
    : priorContinuation;
  let accepted = warmStartMainWireIntegratedModelV3({
    source: continuationSource?.accepted ?? sourceAccepted,
    sourceRuntime: (continuationSource?.fixture ?? sourceFixture) as unknown as
      MainWireIntegratedModelRuntimeV3,
    targetRuntime: targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
  });
  let trace: readonly Sample[] = [];
  let latestPeriod1MaximumNormalizedDelta = Number.POSITIVE_INFINITY;
  let consecutivePeriod1Passes = 0;
  let completedCycles = 0;
  for (let cycle = 1; cycle <= 30; cycle += 1) {
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
    latestPeriod1MaximumNormalizedDelta =
      compareMainWireIntegratedModelAcceptedStatesV3(
        accepted,
        prior,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        targetFixture.config,
      ).overall.maximumNormalizedDelta;
    consecutivePeriod1Passes = latestPeriod1MaximumNormalizedDelta <= 0.001
      ? consecutivePeriod1Passes + 1
      : 0;
    if (consecutivePeriod1Passes >= 3) break;
  }
  const completedContinuation = Object.freeze({ accepted, fixture: targetFixture });
  if (rvfwActiveTensionScale === 1) scale1Continuation = completedContinuation;
  priorContinuation = completedContinuation;
  results.push(Object.freeze({
    rvfwActiveTensionScale,
    completedCycles,
    consecutivePeriod1Passes,
    latestPeriod1MaximumNormalizedDelta,
    ...rightHeartSummaryV1(trace),
  }));
}

process.stdout.write(`${JSON.stringify({
  sweepId:
    "main-wire-rounded-ejection-pulmonary-root-ablation-rvfw-active-tension-sweep-v1",
  rootTreatment: "PA_PArt-momentum-memory-removed",
  continuationPolicy:
    "nearest prior scale except 1.1 branches from converged scale 1; stop after three period1 deltas <=0.001 or 30 cycles",
  results: [...results].sort((left, right) =>
    left.rvfwActiveTensionScale - right.rvfwActiveTensionScale),
}, null, 2)}\n`);

function rightHeartSummaryV1(samples: readonly Sample[]) {
  const baseline = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const timing = rightTimingV1(samples);
  const rvRates = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV)
      / sample.acceptedDtSec);
  const pulmonaryFlow = samples.map((sample) =>
    sample.valveFlowMlPerSec.PV);
  const pulmonaryPeakIndex = pulmonaryFlow.indexOf(Math.max(...pulmonaryFlow));
  const pulmonaryOpen = thresholdOpenV1(pulmonaryFlow);
  const pulmonaryOpening = transitionV1(pulmonaryOpen, false, true);
  return Object.freeze({
    rvp: baseline.RVP,
    rvDpDtMmHgPerSec: Object.freeze({
      maximum: Math.max(...rvRates),
      minimum: Math.min(...rvRates),
    }),
    rightTiming: timing,
    pulmonaryAccelerationTimeSec:
      cyclicDurationV1(samples, pulmonaryOpening, pulmonaryPeakIndex),
    pulmonaryValveProminentPeakCount:
      prominentPeakCountV1(pulmonaryFlow),
    pulmonaryArteryProminentPeakCount: prominentPeakCountV1(
      samples.map((sample) => sample.absolutePressureMmHg.PA),
    ),
    pulmonaryArteryMmHg: Object.freeze({
      minimum: Math.min(...samples.map((sample) =>
        sample.absolutePressureMmHg.PA)),
      maximum: Math.max(...samples.map((sample) =>
        sample.absolutePressureMmHg.PA)),
    }),
  });
}

function rightTimingV1(samples: readonly Sample[]) {
  const tricuspid = thresholdOpenV1(samples.map((sample) =>
    sample.valveFlowMlPerSec.TV));
  const pulmonary = thresholdOpenV1(samples.map((sample) =>
    sample.valveFlowMlPerSec.PV));
  const pulmonaryOpening = transitionV1(pulmonary, false, true);
  const pulmonaryClosure = nextTransitionV1(
    pulmonary,
    pulmonaryOpening,
    true,
    false,
  );
  const tricuspidClosure = previousTransitionV1(
    tricuspid,
    pulmonaryOpening,
    true,
    false,
  );
  const tricuspidOpening = nextTransitionV1(
    tricuspid,
    pulmonaryClosure,
    false,
    true,
  );
  const ictSec = cyclicDurationV1(
    samples,
    tricuspidClosure,
    pulmonaryOpening,
  );
  const etSec = cyclicDurationV1(
    samples,
    pulmonaryOpening,
    pulmonaryClosure,
  );
  const irtSec = cyclicDurationV1(
    samples,
    pulmonaryClosure,
    tricuspidOpening,
  );
  return Object.freeze({
    ictSec,
    ejectionTimeSec: etSec,
    irtSec,
    teiIndex: (ictSec + irtSec) / etSec,
  });
}

function thresholdOpenV1(values: readonly number[]): readonly boolean[] {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((value) => value > threshold);
}

function prominentPeakCountV1(raw: readonly number[]): number {
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
    if (selected.every((other) => {
      const distance = Math.min(
        Math.abs(index - other),
        raw.length - Math.abs(index - other),
      );
      return distance * 0.002 >= 0.05;
    })) selected.push(index);
  }
  return selected.length;
}

function transitionV1(
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
  throw new Error("required previous cyclic transition is unavailable");
}

function cyclicDurationV1(
  samples: readonly Sample[],
  start: number,
  end: number,
) {
  let duration = 0;
  for (let offset = 0; offset < samples.length; offset += 1) {
    const index = (start + offset) % samples.length;
    if (index === end) break;
    duration += samples[index]!.acceptedDtSec;
  }
  return duration;
}
