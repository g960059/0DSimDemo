import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
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

const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
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
const sourceAccepted = restored.currentAcceptedState();
const sourceCycle = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  sourceFixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  sourceAccepted,
  1,
  0.002,
);
const results = [];
let priorContinuation: Readonly<{
  accepted: typeof sourceAccepted;
  fixture: ReturnType<
    typeof createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1
  >;
}> | null = null;

const preregisteredCandidates = Object.freeze([
  { rootResistanceMmHgSecPerMl: 0.01, inertanceMmHgSec2PerMl: 0 },
  { rootResistanceMmHgSecPerMl: 0.024, inertanceMmHgSec2PerMl: 0 },
  { rootResistanceMmHgSecPerMl: 0.024, inertanceMmHgSec2PerMl: 0.00005 },
  { rootResistanceMmHgSecPerMl: 0.024, inertanceMmHgSec2PerMl: 0.0001 },
  { rootResistanceMmHgSecPerMl: 0.03, inertanceMmHgSec2PerMl: 0.0001 },
  { rootResistanceMmHgSecPerMl: 0.03, inertanceMmHgSec2PerMl: 0.00025 },
  { rootResistanceMmHgSecPerMl: 0.04, inertanceMmHgSec2PerMl: 0.00025 },
  { rootResistanceMmHgSecPerMl: 0.08, inertanceMmHgSec2PerMl: 0.001 },
] as const);

for (const {
  rootResistanceMmHgSecPerMl,
  inertanceMmHgSec2PerMl,
} of preregisteredCandidates) {
  const rootProfile =
    createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
      rootResistanceMmHgSecPerMl,
      inertanceMmHgSec2PerMl,
    );
  const targetFixture =
    createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    rootProfile,
  );
  let accepted = warmStartMainWireIntegratedModelV3({
    source: priorContinuation?.accepted ?? sourceAccepted,
    sourceRuntime: (priorContinuation?.fixture ?? sourceFixture) as unknown as
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
  priorContinuation = completedContinuation;
  results.push(Object.freeze({
    rootResistanceMmHgSecPerMl,
    inertanceMmHgSec2PerMl,
    effectiveRootResistanceMmHgSecPerMl:
      rootResistanceMmHgSecPerMl *
        targetFixture.hemodynamicResearchInputs.pulmonaryResistance,
    completedCycles,
    consecutivePeriod1Passes,
    latestPeriod1MaximumNormalizedDelta,
    ...rightHeartSummaryV1(
      trace,
      rootResistanceMmHgSecPerMl *
        targetFixture.hemodynamicResearchInputs.pulmonaryResistance,
      inertanceMmHgSec2PerMl,
    ),
  }));
}

process.stdout.write(`${JSON.stringify({
  sweepId:
    "main-wire-standard69-pulmonary-root-impedance-factor-sweep-v1",
  sourceStandard69Baseline: rightHeartSummaryV1(
    sourceCycle.traceSamples,
    0.01 * MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1
      .pulmonaryResistance,
    0.004,
  ),
  rootTreatment:
    "PA_PArt source L=0.004 replaced by bounded low-L and characteristic-resistance factor candidates",
  continuationPolicy:
    "listed nearest-neighbor continuation; stop after three period1 deltas <=0.001 or 30 cycles",
  results,
}, null, 2)}\n`);

function rightHeartSummaryV1(
  samples: readonly Sample[],
  effectiveRootResistanceMmHgSecPerMl: number,
  inertanceMmHgSec2PerMl: number,
) {
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
  const pulmonaryClosure = nextTransitionV1(
    pulmonaryOpen,
    pulmonaryOpening,
    true,
    false,
  );
  const gradients = samples.map((sample) =>
    sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA);
  const forwardDurationSec = samples.reduce((sum, sample, index) =>
    sum + (pulmonaryOpen[index] ? sample.acceptedDtSec : 0), 0);
  const pulmonaryPressure = samples.map((sample) =>
    sample.absolutePressureMmHg.PA);
  const durationSec = samples.reduce((sum, sample) =>
    sum + sample.acceptedDtSec, 0);
  const meanPa = samples.reduce((sum, sample, index) =>
    sum + pulmonaryPressure[index]! * sample.acceptedDtSec, 0) / durationSec;
  const meanPulmonaryFlowMlPerSec = samples.reduce((sum, sample) =>
    sum + sample.valveFlowMlPerSec.PV * sample.acceptedDtSec, 0)
      / durationSec;
  const meanPArt = meanPa
    - effectiveRootResistanceMmHgSecPerMl * meanPulmonaryFlowMlPerSec;
  const stiffness =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1
      .arterialStiffness;
  const cPa = (60 / stiffness) / (meanPa + 20);
  const cPArt = (90 / stiffness) / (meanPArt + 20);
  const differentialCompliance = cPa * cPArt / (cPa + cPArt);
  const dampingRatio = inertanceMmHgSec2PerMl === 0
    ? null
    : effectiveRootResistanceMmHgSecPerMl / 2
      * Math.sqrt(differentialCompliance / inertanceMmHgSec2PerMl);
  return Object.freeze({
    rvp: baseline.RVP,
    rvDpDtMmHgPerSec: Object.freeze({
      maximum: Math.max(...rvRates),
      minimum: Math.min(...rvRates),
    }),
    rightTiming: timing,
    pulmonaryAccelerationTimeSec:
      cyclicDurationV1(samples, pulmonaryOpening, pulmonaryPeakIndex),
    pulmonaryValve: Object.freeze({
      forwardDurationSec,
      maximumFlowMlPerSec: Math.max(...pulmonaryFlow),
      meanGradientMmHg: samples.reduce((sum, sample, index) =>
        sum + (pulmonaryOpen[index]
          ? gradients[index]! * sample.acceptedDtSec
          : 0), 0) / forwardDurationSec,
      peakGradientMmHg: Math.max(
        ...gradients.filter((_, index) => pulmonaryOpen[index]),
      ),
    }),
    pulmonaryValveProminentPeakCount:
      prominentPeakCountV1(pulmonaryFlow),
    pulmonaryArteryProminentPeakCount: prominentPeakCountV1(
      samples.map((sample) => sample.absolutePressureMmHg.PA),
    ),
    pulmonaryArteryMmHg: Object.freeze({
      minimum: Math.min(...pulmonaryPressure),
      maximum: Math.max(...pulmonaryPressure),
      postClosureRebound: postClosureReboundV1(
        samples,
        pulmonaryPressure,
        pulmonaryClosure,
        pulmonaryOpening,
      ),
    }),
    localLinearizedRootMode: Object.freeze({
      meanPaMmHg: meanPa,
      meanPArtMmHg: meanPArt,
      meanPArtDerivation:
        "periodic mean PA minus effective root resistance times mean PV flow",
      differentialComplianceMlPerMmHg: differentialCompliance,
      dampingRatio,
      dampedNaturalPeriodSec:
        inertanceMmHgSec2PerMl === 0 || dampingRatio === null
          ? null
          : dampingRatio >= 1
            ? null
            : 2 * Math.PI / (
                Math.sqrt(1 / (
                  inertanceMmHgSec2PerMl * differentialCompliance
                )) * Math.sqrt(1 - dampingRatio ** 2)
              ),
    }),
    leftGateReadback: Object.freeze({
      aorticValve: baseline.aorticValve,
      leftVentricle: baseline.leftVentricle,
      mitralFlow: baseline.mitralFlow,
      timing: baseline.timing,
    }),
  });
}

function postClosureReboundV1(
  samples: readonly Sample[],
  pressure: readonly number[],
  closure: number,
  nextOpening: number,
) {
  let runningMinimum = Number.POSITIVE_INFINITY;
  let rebound = 0;
  for (let offset = 0; offset < samples.length; offset += 1) {
    const index = (closure + offset) % samples.length;
    if (index === nextOpening) break;
    runningMinimum = Math.min(runningMinimum, pressure[index]!);
    rebound = Math.max(rebound, pressure[index]! - runningMinimum);
  }
  return rebound;
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
