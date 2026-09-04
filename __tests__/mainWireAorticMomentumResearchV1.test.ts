import { beforeAll, describe, expect, it } from "vitest";
import launchJson from "@/data/model-baselines/standard70-launch-baseline.json";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { restoreMainWireIntegratedModelStandard70V1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { limitMainWireIntegratedModelCandidateTimeV3, stepMainWireIntegratedModelV3,
  withMainWireIntegratedConstructorFaultForTestV1,
  type MainWireIntegratedModelStepInputV3 } from
  "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { createMainWireAorticMomentumResearchV1, stepMainWireAorticMomentumResearchV1,
  type MainWireAorticMomentumResearchStateV1 } from
  "@/engine/myocardium/experiments/MainWireAorticMomentumResearchV1";
import { MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID } from
  "@/engine/valves/MainWireFixedPathMomentumValveResearchV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

type ResearchState = MainWireAorticMomentumResearchStateV1;
type SourceStep = Parameters<typeof createMainWireAorticMomentumResearchV1>[0]["sourceStep"];
let fixture: MainWireIntegratedModelRegularSinusAllOffFixtureV3;
let sourceStep: SourceStep;
let ejecting: ResearchState;
const sourceCheckpointSha256 = launchJson.qualificationCheckpoint.checkpointSha256;
const inertanceMmHgSec2PerMl = 0.0001;

beforeAll(async () => {
  const inputs = launchJson.candidateInputs as unknown as MainWireBaselineCalibrationCandidateInputsV1;
  const runtime = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
    inputs.hemodynamicResearchInputs, inputs.ventricularContractilityScale, inputs.mechanismResearchInputs);
  fixture = runtime as unknown as MainWireIntegratedModelRegularSinusAllOffFixtureV3;
  const restored = await restoreMainWireIntegratedModelStandard70V1<MainWireNormalAdultFiveWallMechanicsStateV1>({
    base: { ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture),
      mechanismResearchInputs: inputs.mechanismResearchInputs },
    algebraicPulmonaryRootAssemblyId: runtime.algebraicPulmonaryRootAssemblyId,
  }, launchJson.qualificationCheckpoint);
  const observed = stepMainWireIntegratedModelV3(fixture.provider, restored.acceptedState, nextInput(restored.acceptedState));
  if (observed.converged === false) throw new Error(observed.message);
  sourceStep = observed;
  expect(sourceStep.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV.flowMlPerSec).toBe(0);
  ejecting = seed();
  // A short event-aware continuation to first positive flow, not settlement.
  for (let index = 0; index < 150 && ejecting.momentum.flowMlPerSec <= 1; index += 1) {
    const result = stepMainWireAorticMomentumResearchV1(fixture.provider, ejecting, nextInput(ejecting.base));
    if (result.converged === false) throw new Error(result.step.message);
    ejecting = result.state;
  }
  expect(ejecting.momentum.flowMlPerSec).toBeGreaterThan(1);
}, 60_000);

describe("in-memory atomic aortic momentum research owner", () => {
  it("requires an observed zero-Q source and keeps momentum outside the production-shaped substrate", () => {
    const state = seed();
    expect(state.base).toBe(sourceStep.acceptedState);
    expect(state.sourceCheckpointSha256).toBe(sourceCheckpointSha256);
    expect(state.momentum).toEqual({ revision: sourceStep.acceptedState.revision,
      acceptedTimeSec: sourceStep.acceptedState.acceptedTimeSec, flowMlPerSec: 0 });
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.momentum)).toBe(true);
    expect(state.base.coronary.circulation).not.toHaveProperty("aorticMomentum");
    expect(state).not.toHaveProperty("checkpointId");
    expect(() => createMainWireAorticMomentumResearchV1({ sourceStep, sourceCheckpointSha256: "not-a-hash",
      inertanceMmHgSec2PerMl })).toThrow(/source provenance/);
    expect(() => createMainWireAorticMomentumResearchV1({ sourceStep, sourceCheckpointSha256,
      inertanceMmHgSec2PerMl: -1 })).toThrow(/nonnegative fixed L/);
    const nonzeroSource: SourceStep = { ...sourceStep, coronaryStep: { ...sourceStep.coronaryStep,
      baseStep: { ...sourceStep.coronaryStep.baseStep, circulationTrial: { ...sourceStep.coronaryStep.baseStep.circulationTrial,
        valveEvaluations: { ...sourceStep.coronaryStep.baseStep.circulationTrial.valveEvaluations,
          AoV: { ...sourceStep.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV, flowMlPerSec: 1 } } } } } };
    expect(() => createMainWireAorticMomentumResearchV1({ sourceStep: nonzeroSource, sourceCheckpointSha256,
      inertanceMmHgSec2PerMl })).toThrow(/observed zero-flow seed/);
  });

  it("rejects stale momentum clocks and invalid flow before invoking candidate mechanics", () => {
    let candidateCalls = 0;
    const provider = { ...fixture.provider, evaluateTrial: (input: Parameters<typeof fixture.provider.evaluateTrial>[0]) => {
      candidateCalls += 1;
      return fixture.provider.evaluateTrial(input);
    } };
    for (const momentum of [
      { ...ejecting.momentum, revision: ejecting.momentum.revision - 1 },
      { ...ejecting.momentum, acceptedTimeSec: ejecting.momentum.acceptedTimeSec - 0.001 },
      { ...ejecting.momentum, flowMlPerSec: NaN },
      { ...ejecting.momentum, flowMlPerSec: -1 },
    ]) expect(() => stepMainWireAorticMomentumResearchV1(provider, { ...ejecting, momentum }, nextInput(ejecting.base)))
      .toThrow(/clock\/revision\/state binding/);
    expect(candidateCalls).toBe(0);
  });

  it("retries deterministically and promotes selected Q, time and revision together", () => {
    const before = JSON.stringify(ejecting);
    const input = nextInput(ejecting.base);
    const first = stepMainWireAorticMomentumResearchV1(fixture.provider, ejecting, input);
    const retry = stepMainWireAorticMomentumResearchV1(fixture.provider, ejecting, input);
    expect(first.converged).toBe(true);
    expect(retry).toEqual(first);
    expect(JSON.stringify(ejecting)).toBe(before);
    if (first.converged === false) throw new Error(first.step.message);
    const valve = first.step.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV;
    expect(valve.modelId).toBe(MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID);
    expect(first.state.base).toBe(first.step.acceptedState);
    expect(first.state.momentum).toEqual({ revision: ejecting.base.revision + 1,
      acceptedTimeSec: input.candidateTimeSec, flowMlPerSec: valve.flowMlPerSec });
    expect(first.state.momentum.flowMlPerSec).toBeGreaterThan(0);
    expect(first.state.momentum.acceptedTimeSec).toBe(first.state.base.coronary.circulation.acceptedTimeSec);
    expect(first.state.momentum.revision).toBe(first.state.base.coronary.circulation.revision);
    if (valve.modelId === MAIN_WIRE_FIXED_PATH_MOMENTUM_VALVE_RESEARCH_V1_ID) {
      expect(valve.previousAcceptedFlowMlPerSec).toBe(ejecting.momentum.flowMlPerSec);
    }
  });

  it("retains the identical research wrapper after candidate and boundary failures", () => {
    const before = JSON.stringify(ejecting);
    let candidateCalls = 0;
    const provider = { ...fixture.provider, evaluateTrial: (input: Parameters<typeof fixture.provider.evaluateTrial>[0]) => {
      candidateCalls += 1;
      const result = fixture.provider.evaluateTrial(input);
      return { ...result, diagnostics: { ...result.diagnostics, converged: false, errors: ["forced research candidate failure"] } };
    } };
    const failed = stepMainWireAorticMomentumResearchV1(provider, ejecting, nextInput(ejecting.base));
    expect(candidateCalls).toBeGreaterThan(0);
    expect(failed.converged).toBe(false);
    expect(failed.state).toBe(ejecting);
    if (failed.converged === false) {
      expect(failed.step.rollbackState).toBe(ejecting.base);
      expectAllCommitFlagsFalse(failed.step);
    }
    candidateCalls = 0;
    const boundary = stepMainWireAorticMomentumResearchV1(provider, ejecting,
      { ...nextInput(ejecting.base), candidateTimeSec: ejecting.base.acceptedTimeSec + fixture.cycleLengthSec });
    expect(boundary.converged).toBe(false);
    expect(boundary.state).toBe(ejecting);
    expect(candidateCalls).toBe(0);
    if (boundary.converged === false) {
      expect(boundary.step.reason).toBe("outer-input-clock-binding-or-boundary-rejected");
      expect(boundary.step.rollbackState).toBe(ejecting.base);
      expectAllCommitFlagsFalse(boundary.step);
    }
    expect(JSON.stringify(ejecting)).toBe(before);
  });

  it("does not advance momentum when outer promotion rejects a converged coronary candidate", () => {
    const before = JSON.stringify(ejecting);
    const failed = withMainWireIntegratedConstructorFaultForTestV1("outer-accepted-time-ahead-of-owners", () =>
      stepMainWireAorticMomentumResearchV1(fixture.provider, ejecting, nextInput(ejecting.base)));
    expect(failed.converged).toBe(false);
    expect(failed.state).toBe(ejecting);
    if (failed.converged === false) {
      expect(failed.step.reason).toBe("integrated-promotion-rejected");
      expect(failed.step.coronaryStep?.converged).toBe(true);
      expect(failed.step.rollbackState).toBe(ejecting.base);
      expectAllCommitFlagsFalse(failed.step);
    }
    expect(JSON.stringify(ejecting)).toBe(before);
  });

  it("is exactly canonical at L=0 through the first forward-flow samples", () => {
    let research = seed(0);
    let observedForwardSamples = 0;
    for (let index = 0; index < 150 && observedForwardSamples < 3; index += 1) {
      const input = nextInput(research.base);
      const canonical = stepMainWireIntegratedModelV3(fixture.provider, research.base, input);
      const result = stepMainWireAorticMomentumResearchV1(fixture.provider, research, input);
      expect(result.converged).toBe(true);
      expect(result.step).toEqual(canonical);
      if (result.converged === false) throw new Error(result.step.message);
      if (result.state.momentum.flowMlPerSec > 0) observedForwardSamples += 1;
      research = result.state;
    }
    expect(observedForwardSamples).toBe(3);
  }, 60_000);
});

function seed(inertance = inertanceMmHgSec2PerMl) {
  return createMainWireAorticMomentumResearchV1({ sourceStep, sourceCheckpointSha256, inertanceMmHgSec2PerMl: inertance });
}
function nextInput(previous: ResearchState["base"]): MainWireIntegratedModelStepInputV3 {
  const limited = limitMainWireIntegratedModelCandidateTimeV3(previous, previous.acceptedTimeSec + 0.002,
    { configuration: fixture.rhythm.configuration, externalAfNextBoundaryTimeSec: null }, fixture.profile, fixture.config);
  return { candidateTimeSec: limited.candidateTimeSec, coronary: fixture.coronaryStepInput,
    rhythm: { configuration: fixture.rhythm.configuration, externalAfNextBoundaryTimeSec: null, externalAtrialSourceBatch: null },
    dynamicMechanicalSupport: fixture.dynamicMechanicalSupport };
}
function expectAllCommitFlagsFalse(step: Extract<ReturnType<typeof stepMainWireAorticMomentumResearchV1>, { converged: false }>["step"]) {
  for (const key of ["mechanicsCommitted", "circulationCommitted", "coronaryCommitted", "mvcReferenceCommitted",
    "autoregulationCommitted", "composedRhythmCommitted", "dynamicMechanicalSupportCommitted"] as const) expect(step[key]).toBe(false);
}
