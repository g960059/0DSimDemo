import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

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
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

type Sample = MainWireIntegratedModelPeriodicTerminalTraceSampleV3;

const sourceFixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const targetFixture =
  createMainWireIntegratedModelRoundedEjectionPulmonaryRootAblationFixtureV1(
    undefined,
    1,
    undefined,
    createMainWireAlgebraicPulmonaryArterialRootResistanceResearchProfileV1(
      0.03,
      0.00025,
    ),
  );
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
let accepted = warmStartMainWireIntegratedModelV3({
  source: restored.currentAcceptedState(),
  sourceRuntime: sourceFixture as unknown as MainWireIntegratedModelRuntimeV3,
  targetRuntime: targetFixture as unknown as MainWireIntegratedModelRuntimeV3,
});
let trace: readonly Sample[] = [];
let consecutivePasses = 0;
let delta = Number.POSITIVE_INFINITY;
let completedCycles = 0;
for (let cycle = 1; cycle <= 30; cycle += 1) {
  const prior = accepted;
  const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    targetFixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
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
    targetFixture.config,
  ).overall.maximumNormalizedDelta;
  consecutivePasses = delta <= 0.001 ? consecutivePasses + 1 : 0;
  if (consecutivePasses >= 3) break;
}

const flow = trace.map((sample) => sample.valveFlowMlPerSec.PV);
const threshold = Math.max(1, 0.01 * Math.max(...flow));
const open = flow.map((value) => value > threshold);
const opening = transitionV1(open, false, true);
const closure = nextTransitionV1(open, opening, true, false);
const ejection = cyclicIndicesV1(trace.length, opening, closure);
const peakFlow = Math.max(...ejection.map((index) => flow[index]!));
const profile = Array.from({ length: 21 }, (_, ordinal) => {
  const fraction = ordinal / 20;
  const position = Math.min(
    ejection.length - 1,
    Math.round(fraction * (ejection.length - 1)),
  );
  const index = ejection[position]!;
  const sample = trace[index]!;
  return Object.freeze({
    ejectionFraction01: fraction,
    elapsedSec: ejection.slice(0, position).reduce(
      (sum, sampleIndex) => sum + trace[sampleIndex]!.acceptedDtSec,
      0,
    ),
    pulmonaryFlowMlPerSec: flow[index],
    normalizedPulmonaryFlow: flow[index]! / peakFlow,
    rvpMmHg: sample.absolutePressureMmHg.RV,
    papMmHg: sample.absolutePressureMmHg.PA,
    rvToPaGradientMmHg:
      sample.absolutePressureMmHg.RV - sample.absolutePressureMmHg.PA,
  });
});

process.stdout.write(`${JSON.stringify({
  candidate: {
    rootResistanceMmHgSecPerMl: 0.03,
    effectiveRootResistanceMmHgSecPerMl: 0.01875,
    inertanceMmHgSec2PerMl: 0.00025,
  },
  convergence: { completedCycles, consecutivePasses, delta },
  ejectionDurationSec: ejection.reduce(
    (sum, index) => sum + trace[index]!.acceptedDtSec,
    0,
  ),
  peakFlowMlPerSec: peakFlow,
  profile,
}, null, 2)}\n`);

function transitionV1(
  values: readonly boolean[],
  from: boolean,
  to: boolean,
) {
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

function cyclicIndicesV1(length: number, start: number, end: number) {
  const result: number[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const index = (start + offset) % length;
    if (index === end) break;
    result.push(index);
  }
  return result;
}
