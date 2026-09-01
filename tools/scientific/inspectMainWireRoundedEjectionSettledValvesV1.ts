import checkpointV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-settled-baseline-checkpoint.json";

import {
  measureMainWireIntegratedModelBaselineValidationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  createMainWireIntegratedModelRoundedEjectionFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionFixtureV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";

const fixture = createMainWireIntegratedModelRoundedEjectionFixtureV1();
const restored =
  await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
    .restoreStandard68ExactCheckpoint(checkpointV1);
const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
  fixture as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3,
  restored.currentAcceptedState(),
  Math.floor(restored.currentAcceptedState().acceptedTimeSec) + 1,
  0.002,
);
const mitral = run.traceSamples.map((sample, index) => Object.freeze({
  index,
  phase: sample.cyclePhase01,
  flow: sample.valveFlowMlPerSec.MV,
}));
const peaks = mitral.filter((sample, index) =>
  index > 0 && index < mitral.length - 1
  && sample.flow > mitral[index - 1]!.flow
  && sample.flow >= mitral[index + 1]!.flow
  && sample.flow > 1
).sort((left, right) => right.flow - left.flow);
const thresholdTimings = [0, 0.1, 1, 0.01, 0.02, 0.05].map((threshold) => {
  const mvPeak = Math.max(...run.traceSamples.map((sample) =>
    sample.valveFlowMlPerSec.MV));
  const aovPeak = Math.max(...run.traceSamples.map((sample) =>
    sample.valveFlowMlPerSec.AoV));
  const absolute = threshold < 0.1
    ? Object.freeze({ mv: threshold * mvPeak, aov: threshold * aovPeak })
    : Object.freeze({ mv: threshold, aov: threshold });
  const mvOpen = run.traceSamples.map((sample) =>
    sample.valveFlowMlPerSec.MV > absolute.mv);
  const aovOpen = run.traceSamples.map((sample) =>
    sample.valveFlowMlPerSec.AoV > absolute.aov);
  const transitions = (values: readonly boolean[]) => values.flatMap(
    (value, index) => {
      const prior = values[(index - 1 + values.length) % values.length]!;
      return value !== prior ? [Object.freeze({ index, value })] : [];
    },
  );
  const mv = transitions(mvOpen);
  const aov = transitions(aovOpen);
  const aovOpening = aov.find(({ value }) => value)?.index ?? -1;
  const aovClosure = aov.find(({ value }) => !value)?.index ?? -1;
  const nextMvOpening = mv.find(({ index, value }) =>
    value && index > aovClosure)?.index ?? mv.find(({ value }) => value)?.index
    ?? -1;
  const priorMvClosure = [...mv].reverse().find(({ index, value }) =>
    !value && index < aovOpening)?.index
    ?? [...mv].reverse().find(({ value }) => !value)?.index ?? -1;
  const delta = (from: number, to: number) =>
    ((to - from + run.traceSamples.length) % run.traceSamples.length) * 0.002;
  return Object.freeze({
    threshold,
    absolute,
    ictSec: delta(priorMvClosure, aovOpening),
    etSec: delta(aovOpening, aovClosure),
    irtSec: delta(aovClosure, nextMvOpening),
  });
});
process.stdout.write(`${JSON.stringify({
  measurements: measureMainWireIntegratedModelBaselineValidationV1(
    run.traceSamples,
  ),
  mitralLocalPeaks: peaks.slice(0, 12),
  thresholdTimings,
}, null, 2)}\n`);
