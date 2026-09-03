import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-settled-baseline-checkpoint.json";

import {
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1,
} from "@/engine/core/MainWireAlgebraicPulmonaryArterialRootProfileV1";
import {
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
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
type Fixture = ReturnType<
  typeof createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1
>;

const defaultHemodynamics =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1;
const rootResistanceMmHgSecPerMl = finiteArgumentV1(
  "--root-resistance",
  0.03,
);
const inertanceMmHgSec2PerMl = finiteArgumentV1(
  "--root-inertance",
  0.00025,
);
const maximumCycles = positiveIntegerArgumentV1("--maximum-cycles", 80);
const requestedConditionId = stringArgumentV1("--condition");
const conditions = Object.freeze([
  conditionV1("baseline", {}),
  conditionV1("pvr-low", { pulmonaryResistance: 0.5 }),
  conditionV1("pvr-high", { pulmonaryResistance: 0.75 }),
  conditionV1("svr-low", { systemicResistance: 0.88 }),
  conditionV1("svr-high", { systemicResistance: 1.08 }),
  conditionV1("venous-tone-low", { venousTone: 0.05 }),
  conditionV1("venous-tone-high", { venousTone: 0.25 }),
  conditionV1("arterial-stiffness-low", { arterialStiffness: 1.17 }),
  conditionV1("arterial-stiffness-high", { arterialStiffness: 1.43 }),
]);
const profile =
  createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
    rootResistanceMmHgSecPerMl,
    inertanceMmHgSec2PerMl,
  );
const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1(
  defaultHemodynamics,
  1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
);
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(
      checkpointV1,
      defaultHemodynamics,
      1,
      undefined,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    );
const sourceBaselineCycle =
  runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    sourceFixture as unknown as
      MainWireIntegratedModelRegularSinusAllOffFixtureV3,
    restored.currentAcceptedState(),
    1,
    0.002,
  );
const baselineFixture = candidateFixtureV1(conditions[0]!.hemodynamics);
const baselineRun = convergeV1({
  sourceAccepted: restored.currentAcceptedState(),
  sourceFixture,
  targetFixture: baselineFixture,
});
const selectedConditions = requestedConditionId === null
  ? conditions
  : conditions.filter((condition) => condition.conditionId === requestedConditionId);
if (selectedConditions.length === 0) {
  throw new Error(`unknown envelope condition: ${requestedConditionId}`);
}
const results = selectedConditions.map((condition) => {
  const fixture = condition.conditionId === "baseline"
    ? baselineFixture
    : candidateFixtureV1(condition.hemodynamics);
  const run = condition.conditionId === "baseline"
    ? baselineRun
    : convergeV1({
        sourceAccepted: baselineRun.accepted,
        sourceFixture: baselineFixture,
        targetFixture: fixture,
      });
  return Object.freeze({
    conditionId: condition.conditionId,
    hemodynamics: condition.hemodynamics,
    convergence: run.convergence,
    metrics: summarizeV1(run.trace),
  });
});

const report = Object.freeze({
  envelopeId: "main-wire-standard69-pulmonary-root-local-load-envelope-v1",
  candidate: {
    rootResistanceMmHgSecPerMl,
    effectiveBaselineRootResistanceMmHgSecPerMl:
      rootResistanceMmHgSecPerMl * defaultHemodynamics.pulmonaryResistance,
    inertanceMmHgSec2PerMl,
  },
  scope:
    "one-at-a-time fixed-HR/fixed-TBV local load envelope; not a clinical validation cohort",
  sourceStandard69Baseline: Object.freeze({
    settledCheckpointTimeSec: restored.currentAcceptedState().acceptedTimeSec,
    metrics: summarizeV1(sourceBaselineCycle.traceSamples),
  }),
  results,
});
process.stdout.write(`${JSON.stringify(
  booleanArgumentV1("--compact") ? compactReportV1(report) : report,
  null,
  2,
)}\n`);

function conditionV1(
  conditionId: string,
  patch: Partial<MainWireIntegratedModelHemodynamicResearchInputsV3>,
) {
  return Object.freeze({
    conditionId,
    hemodynamics: Object.freeze({ ...defaultHemodynamics, ...patch }),
  });
}

function candidateFixtureV1(
  hemodynamics: MainWireIntegratedModelHemodynamicResearchInputsV3,
) {
  return createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    hemodynamics,
    1,
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
    profile,
  );
}

function convergeV1(input: Readonly<{
  sourceAccepted: ReturnType<
    typeof MainWireIntegratedModelStandard68TypedAuthoritySessionV1.prototype.currentAcceptedState
  >;
  sourceFixture: Fixture | ReturnType<
    typeof createMainWireIntegratedModelRoundedEjectionFixtureV1
  >;
  targetFixture: Fixture;
}>) {
  let accepted = warmStartMainWireIntegratedModelV3({
    source: input.sourceAccepted,
    sourceRuntime: input.sourceFixture as unknown as
      MainWireIntegratedModelRuntimeV3,
    targetRuntime: input.targetFixture as unknown as
      MainWireIntegratedModelRuntimeV3,
  });
  let trace: readonly Sample[] = [];
  let delta = Number.POSITIVE_INFINITY;
  const deltaHistory: number[] = [];
  let consecutivePasses = 0;
  let completedCycles = 0;
  const startedAt = performance.now();
  for (let cycle = 1; cycle <= maximumCycles; cycle += 1) {
    const prior = accepted;
    const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
      input.targetFixture as unknown as
        MainWireIntegratedModelRegularSinusAllOffFixtureV3,
      accepted,
      cycle,
      0.002,
    );
    accepted = run.terminalAcceptedState;
    trace = run.traceSamples;
    completedCycles = cycle;
    delta = compareMainWireIntegratedModelAcceptedStatesV3(
      accepted,
      prior,
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
      input.targetFixture.config,
    ).overall.maximumNormalizedDelta;
    deltaHistory.push(delta);
    consecutivePasses = delta <= 0.001 ? consecutivePasses + 1 : 0;
    if (consecutivePasses >= 3) break;
  }
  return Object.freeze({
    accepted,
    trace,
    convergence: Object.freeze({
      completedCycles,
      consecutivePasses,
      converged: consecutivePasses >= 3,
      delta,
      finalDeltaHistory: Object.freeze(deltaHistory.slice(-12)),
      wallTimeMs: performance.now() - startedAt,
    }),
  });
}

function summarizeV1(samples: readonly Sample[]) {
  const left = measureMainWireIntegratedModelBaselineValidationV1(samples);
  const pvFlow = samples.map((sample) => sample.valveFlowMlPerSec.PV);
  const tvFlow = samples.map((sample) => sample.valveFlowMlPerSec.TV);
  const pvOpen = thresholdOpenV1(pvFlow);
  const pvOpening = transitionV1(pvOpen, false, true);
  const pvClosure = nextTransitionV1(pvOpen, pvOpening, true, false);
  const pvIndices = cyclicIndicesV1(samples.length, pvOpening, pvClosure);
  const peakPvFlowIndex = pvIndices.reduce((best, index) =>
    pvFlow[index]! > pvFlow[best]! ? index : best, pvIndices[0]!);
  const tvOpen = thresholdOpenV1(tvFlow);
  const tvClosure = previousTransitionV1(tvOpen, pvOpening, true, false);
  const tvOpening = nextTransitionV1(tvOpen, pvClosure, false, true);
  const ictSec = cyclicDurationV1(samples, tvClosure, pvOpening);
  const etSec = cyclicDurationV1(samples, pvOpening, pvClosure);
  const irtSec = cyclicDurationV1(samples, pvClosure, tvOpening);
  const pvGradient = samples.map((sample) =>
    sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA);
  const pap = samples.map((sample) => sample.absolutePressureMmHg.PA);
  const pvDuration = samples.reduce((sum, sample, index) =>
    sum + (pvOpen[index] ? sample.acceptedDtSec : 0), 0);
  const lvVolumes = samples.map((sample) => sample.chamberVolumeMl.LV);
  const rvRate = samples.slice(1).map((sample, index) =>
    (sample.absolutePressureMmHg.RV
      - samples[index]!.absolutePressureMmHg.RV) / sample.acceptedDtSec);
  return Object.freeze({
    left,
    strokeVolumeMl: Math.max(...lvVolumes) - Math.min(...lvVolumes),
    rvpMorphology: left.RVP,
    rvPressureRateMmHgPerSec: Object.freeze({
      maximum: Math.max(...rvRate),
      minimum: Math.min(...rvRate),
    }),
    rightTiming: Object.freeze({
      ictSec,
      ejectionTimeSec: etSec,
      irtSec,
      teiIndex: (ictSec + irtSec) / etSec,
    }),
    tricuspidPeakEToA: inletPeakRatioV1(samples, tvOpen, pvOpen),
    pulmonaryValve: Object.freeze({
      peakCount: prominentPeakCountV1(pvFlow),
      peakFlowMlPerSec: pvFlow[peakPvFlowIndex],
      accelerationTimeSec: cyclicDurationV1(
        samples,
        pvOpening,
        (peakPvFlowIndex + 1) % samples.length,
      ),
      meanGradientMmHg: samples.reduce((sum, sample, index) =>
        sum + (pvOpen[index]
          ? pvGradient[index]! * sample.acceptedDtSec
          : 0), 0) / pvDuration,
      peakGradientMmHg: Math.max(
        ...pvGradient.filter((_, index) => pvOpen[index]),
      ),
    }),
    pulmonaryArtery: Object.freeze({
      peakCount: prominentPeakCountV1(pap),
      minimumMmHg: Math.min(...pap),
      maximumMmHg: Math.max(...pap),
      postClosureReboundMmHg:
        postClosureReboundV1(samples, pap, pvClosure, pvOpening),
    }),
  });
}

function inletPeakRatioV1(
  samples: readonly Sample[],
  inletOpen: readonly boolean[],
  outletOpen: readonly boolean[],
) {
  const outletClosure = nextTransitionV1(
    outletOpen,
    transitionV1(outletOpen, false, true),
    true,
    false,
  );
  const inletClosure = nextTransitionV1(
    inletOpen,
    outletClosure,
    true,
    false,
  );
  const indices = cyclicIndicesV1(samples.length, outletClosure, inletClosure);
  const peaks = indices.filter((index, position) => {
    const prior = indices[(position - 1 + indices.length) % indices.length]!;
    const next = indices[(position + 1) % indices.length]!;
    const value = samples[index]!.valveFlowMlPerSec.TV;
    return value > samples[prior]!.valveFlowMlPerSec.TV
      && value >= samples[next]!.valveFlowMlPerSec.TV
      && value > 1;
  }).sort((left, right) =>
    samples[right]!.valveFlowMlPerSec.TV
      - samples[left]!.valveFlowMlPerSec.TV)
    .reduce<number[]>((selected, index) => selected.every((other) =>
      Math.min(
        Math.abs(index - other),
        samples.length - Math.abs(index - other),
      ) * 0.002 >= 0.08) ? [...selected, index] : selected, [])
    .slice(0, 2)
    .sort((left, right) =>
      ((left - outletClosure + samples.length) % samples.length)
        - ((right - outletClosure + samples.length) % samples.length));
  return peaks.length < 2
    ? null
    : samples[peaks[0]!]!.valveFlowMlPerSec.TV
      / samples[peaks[1]!]!.valveFlowMlPerSec.TV;
}

function thresholdOpenV1(values: readonly number[]) {
  const threshold = Math.max(1, 0.01 * Math.max(...values));
  return values.map((value) => value > threshold);
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

function compactReportV1(input: typeof report) {
  return Object.freeze({
    envelopeId: input.envelopeId,
    candidate: input.candidate,
    scope: input.scope,
    sourceStandard69Baseline: Object.freeze({
      settledCheckpointTimeSec:
        input.sourceStandard69Baseline.settledCheckpointTimeSec,
      metrics: compactMetricsV1(input.sourceStandard69Baseline.metrics),
    }),
    results: input.results.map((result) => Object.freeze({
      conditionId: result.conditionId,
      convergence: result.convergence,
      metrics: compactMetricsV1(result.metrics),
    })),
  });
}

function compactMetricsV1(metrics: ReturnType<typeof summarizeV1>) {
  return Object.freeze({
    strokeVolumeMl: metrics.strokeVolumeMl,
    lvpMorphology: metrics.left.LVP,
    rvpMorphology: metrics.rvpMorphology,
    aorticValve: metrics.left.aorticValve,
    leftTiming: metrics.left.timing,
    rightTiming: metrics.rightTiming,
    leftVentricleDpDtMmHgPerSec: metrics.left.leftVentricle,
    rightVentricleDpDtMmHgPerSec: metrics.rvPressureRateMmHgPerSec,
    mitralPeakEToA: metrics.left.mitralFlow.peakEToA,
    tricuspidPeakEToA: metrics.tricuspidPeakEToA,
    pulmonaryValve: metrics.pulmonaryValve,
    pulmonaryArtery: metrics.pulmonaryArtery,
    aorticPressure: metrics.left.hemodynamicPressure.aortic,
    centralVenousMeanMmHg:
      metrics.left.hemodynamicPressure.centralVenousMeanMmHg,
    pcwpSurrogateMeanMmHg:
      metrics.left.hemodynamicPressure.pcwpSurrogateMeanMmHg,
    cardiacSizeAndFunction: metrics.left.cardiacSizeAndFunction,
  });
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

function positiveIntegerArgumentV1(name: string, fallback: number): number {
  const value = finiteArgumentV1(name, fallback);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function stringArgumentV1(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function booleanArgumentV1(name: string): boolean {
  return process.argv.includes(name);
}
