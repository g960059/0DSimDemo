import {
  stepMainWireIntegratedModelWithCoronaryExecutorV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepInputV3,
  type MainWireIntegratedModelStepResultV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { stepMainWireFiveWallCoronaryV2 } from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import { mainWireFiveWallCoronaryBaseStateV2, promoteMainWireFiveWallCoronaryBaseStepV3 } from
  "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 as WallState } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type { MainWireIntegratedModelRegularSinusAllOffFixtureV3 as Fixture } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_AORTIC_MOMENTUM_RESEARCH_V1_ID = "main-wire-aortic-momentum-research-v1" as const;
type Step = MainWireIntegratedModelStepResultV3<WallState>;
type AcceptedStep = Extract<Step, { converged: true }>;

/** In-memory research construction, NOT a Standard70 accepted model/checkpoint.
 * The substrate owns its existing states; this owner atomically binds the new Q.
 * No persistence, production model registration or qualification API is exposed. */
export type MainWireAorticMomentumResearchStateV1 = Readonly<{
  researchId: typeof MAIN_WIRE_AORTIC_MOMENTUM_RESEARCH_V1_ID;
  sourceCheckpointSha256: string;
  inertanceMmHgSec2PerMl: number;
  base: MainWireIntegratedModelAcceptedStateV3<WallState>;
  momentum: Readonly<{ revision: number; acceptedTimeSec: number; flowMlPerSec: number }>;
}>;

/** Seed only at an observed zero-flow endpoint of an unmodified source run.
 * The new momentum is an explicit research initialization, never a restored
 * production state or a repurposed Ao_SA/PA_PArt flow slot. */
export function createMainWireAorticMomentumResearchV1(input: Readonly<{
  sourceStep: AcceptedStep;
  sourceCheckpointSha256: string;
  inertanceMmHgSec2PerMl: number;
}>): MainWireAorticMomentumResearchStateV1 {
  if (!/^[a-f0-9]{64}$/.test(input.sourceCheckpointSha256)
    || !Number.isFinite(input.inertanceMmHgSec2PerMl) || input.inertanceMmHgSec2PerMl < 0
    || input.sourceStep.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV.flowMlPerSec !== 0) {
    throw new Error("momentum research requires source provenance, nonnegative fixed L and an observed zero-flow seed");
  }
  const base = input.sourceStep.acceptedState;
  return Object.freeze({ researchId: MAIN_WIRE_AORTIC_MOMENTUM_RESEARCH_V1_ID,
    sourceCheckpointSha256: input.sourceCheckpointSha256, inertanceMmHgSec2PerMl: input.inertanceMmHgSec2PerMl,
    base, momentum: Object.freeze({ revision: base.revision, acceptedTimeSec: base.acceptedTimeSec, flowMlPerSec: 0 }) });
}

export function stepMainWireAorticMomentumResearchV1(
  provider: Fixture["provider"], previous: MainWireAorticMomentumResearchStateV1,
  input: MainWireIntegratedModelStepInputV3,
): Readonly<{ converged: false; state: MainWireAorticMomentumResearchStateV1; step: Extract<Step, { converged: false }> }>
  | Readonly<{ converged: true; state: MainWireAorticMomentumResearchStateV1; step: AcceptedStep }> {
  const { base, momentum } = previous;
  if (previous.researchId !== MAIN_WIRE_AORTIC_MOMENTUM_RESEARCH_V1_ID
    || momentum.revision !== base.revision || momentum.acceptedTimeSec !== base.acceptedTimeSec
    || !Number.isFinite(momentum.flowMlPerSec) || momentum.flowMlPerSec < 0
    || !Number.isFinite(previous.inertanceMmHgSec2PerMl) || previous.inertanceMmHgSec2PerMl < 0) {
    throw new Error("momentum research clock/revision/state binding rejected before trial");
  }
  // A frozen trial input holds the same q_n through every Newton evaluation.
  // Nothing inside the candidate executor can promote this research owner.
  const aorticMomentumResearch = Object.freeze({
    inertanceMmHgSec2PerMl: previous.inertanceMmHgSec2PerMl,
    previousAcceptedFlowMlPerSec: momentum.flowMlPerSec,
    baseRevision: base.coronary.circulation.revision,
    baseAcceptedTimeSec: base.coronary.circulation.acceptedTimeSec,
  });
  const step = stepMainWireIntegratedModelWithCoronaryExecutorV3(base, input, (coronaryPrevious, coronaryInput) => ({
    coronaryStep: promoteMainWireFiveWallCoronaryBaseStepV3(coronaryPrevious, coronaryInput,
      stepMainWireFiveWallCoronaryV2(provider, mainWireFiveWallCoronaryBaseStateV2(coronaryPrevious), coronaryInput,
        undefined, undefined, undefined, aorticMomentumResearch)),
  }));
  if (step.converged === false) return Object.freeze({ converged: false, state: previous, step });
  const flowMlPerSec = step.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV.flowMlPerSec;
  if (!Number.isFinite(flowMlPerSec) || flowMlPerSec < 0) {
    throw new Error("competent momentum research returned invalid selected flow; owner not promoted");
  }
  const state = Object.freeze({ ...previous, base: step.acceptedState,
    momentum: Object.freeze({ revision: step.acceptedState.revision,
      acceptedTimeSec: step.acceptedState.acceptedTimeSec, flowMlPerSec }) });
  return Object.freeze({ converged: true, state, step });
}
