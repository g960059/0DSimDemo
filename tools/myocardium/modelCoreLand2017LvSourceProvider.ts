import type { ActiveStressDebugTerms } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  LAND2017_STATE_INDEX,
  evaluateLand2017ContinuousOutput,
  solveLand2017BackwardEulerSubsteps,
  type LandSourceOutput,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID =
  "modelcore-experimental-land2017-lv-source-only-provider-v1";

const DEFAULT_INITIAL_LAND_STATE = [0.18, 0.22, 0.04, 0.02, 0, 0] as const;

export type ModelCoreLand2017LvSourceProviderInstrumentation = {
  initialInternal: number;
  initialProviderState: number;
  cloneProviderState: number;
  sourceActiveStressPa: number;
  internalDerivatives: number;
  debugActiveStressTerms: number;
  commitProviderStateAfterStep: number;
  landSolveOkCount: number;
  landSolveFailureCount: number;
  maxSolverResidualNorm: number;
  maxSourceDebugStressDifferencePa: number;
  lastFailureReason: string | null;
};

export type ModelCoreLand2017LvProviderState = {
  readonly landState: Float64Array;
  readonly previousFreeCalciumUM: number | null;
  readonly previousFiberEngineeringStrain: number | null;
  readonly previousDtSec: number | null;
  readonly lastOutput: LandSourceOutput | null;
  readonly lastSolverResidualNorm: number | null;
  readonly lastSolverOk: boolean;
  readonly lastFailureReason: string | null;
  readonly commitCount: number;
};

type LandCallInput = {
  readonly freeCalciumUM: number;
  readonly fiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
};

export function createModelCoreLand2017LvSourceProviderInstrumentation():
ModelCoreLand2017LvSourceProviderInstrumentation {
  return {
    initialInternal: 0,
    initialProviderState: 0,
    cloneProviderState: 0,
    sourceActiveStressPa: 0,
    internalDerivatives: 0,
    debugActiveStressTerms: 0,
    commitProviderStateAfterStep: 0,
    landSolveOkCount: 0,
    landSolveFailureCount: 0,
    maxSolverResidualNorm: 0,
    maxSourceDebugStressDifferencePa: 0,
    lastFailureReason: null,
  };
}

export function land2017LvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
    initialInternal: ({ activeModel }) => {
      instrumentation.initialInternal += 1;
      return activeModel.initialInternal();
    },
    initialProviderState: () => {
      instrumentation.initialProviderState += 1;
      return initialLandProviderState();
    },
    cloneProviderState: (state) => {
      instrumentation.cloneProviderState += 1;
      return cloneLandProviderState(asLandProviderState(state, "cloneProviderState"));
    },
    debugProviderState: (state) => debugLandProviderState(asLandProviderState(state, "debugProviderState")),
    sourceActiveStressPa: (call) => {
      instrumentation.sourceActiveStressPa += 1;
      const output = evaluateLandOutputForCall(call, asLandProviderState(call.providerState, "sourceActiveStressPa"));
      return output.sourceActiveFiberStressPa;
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      instrumentation.internalDerivatives += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    debugActiveStressTerms: (call) => {
      instrumentation.debugActiveStressTerms += 1;
      const output = evaluateLandOutputForCall(call, asLandProviderState(call.providerState, "debugActiveStressTerms"));
      const terms = landDebugTermsForCall(call, output);
      instrumentation.maxSourceDebugStressDifferencePa = Math.max(
        instrumentation.maxSourceDebugStressDifferencePa,
        Math.abs(terms.sigmaAct - output.sourceActiveFiberStressPa),
      );
      return terms;
    },
    commitProviderStateAfterStep: ({
      activeModel,
      previousProviderState,
      stepDtSec,
      beforeStep,
      afterStep,
    }) => {
      instrumentation.commitProviderStateAfterStep += 1;
      const previous = asLandProviderState(previousProviderState, "commitProviderStateAfterStep");
      const beforeTerms = activeModel.debugActiveStressTerms(
        beforeStep.effectiveVolumeMl,
        beforeStep.internal,
        beforeStep.chamberCtx,
      );
      const afterTerms = activeModel.debugActiveStressTerms(
        afterStep.effectiveVolumeMl,
        afterStep.internal,
        afterStep.chamberCtx,
      );
      const landInput: LandStepInput = {
        freeCalciumUM: freeCalciumUMFromInternal(afterStep.internal.c),
        previousFiberEngineeringStrain: beforeTerms.lambdaRaw - 1,
        stageFiberEngineeringStrain: afterTerms.lambdaRaw - 1,
        dtSec: stepDtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      };
      const solved = solveLand2017BackwardEulerSubsteps(
        previous.landState,
        landInput,
        {
          maxIterations: 16,
          residualTolerance: 1e-8,
          lineSearchMinStep: 1 / 2048,
          substeps: 1,
          previousFreeCalciumUM: previous.previousFreeCalciumUM ?? undefined,
        },
      );
      instrumentation.maxSolverResidualNorm = Math.max(
        instrumentation.maxSolverResidualNorm,
        finiteOrZero(solved.residualNorm),
      );
      if (!solved.ok || !solved.output) {
        instrumentation.landSolveFailureCount += 1;
        instrumentation.lastFailureReason = solved.failureReason ?? "unknown";
        return {
          ...previous,
          lastSolverResidualNorm: solved.residualNorm,
          lastSolverOk: false,
          lastFailureReason: instrumentation.lastFailureReason,
          commitCount: previous.commitCount + 1,
        } satisfies ModelCoreLand2017LvProviderState;
      }
      instrumentation.landSolveOkCount += 1;
      return {
        landState: solved.nextState,
        previousFreeCalciumUM: landInput.freeCalciumUM,
        previousFiberEngineeringStrain: landInput.stageFiberEngineeringStrain,
        previousDtSec: stepDtSec,
        lastOutput: solved.output,
        lastSolverResidualNorm: solved.residualNorm,
        lastSolverOk: true,
        lastFailureReason: null,
        commitCount: previous.commitCount + 1,
      } satisfies ModelCoreLand2017LvProviderState;
    },
  };
}

export function modelCoreLand2017LvSourceProviderIdentity() {
  return {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
    parameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    initialState: DEFAULT_INITIAL_LAND_STATE,
    calciumInput: "ModelCore legacy active chamber internal.c interpreted as freeCalciumUM without tuning",
    kinematicsInput: "ModelCore LV activeModel debug lambdaRaw under the same closure",
    stateLifecycle: "ModelCore providerState with once-per-step BE commit",
    pressurePath: "sourceActiveStressPa through ActiveStressChamberModel.pressureFromActiveFiberStress",
  } as const;
}

function initialLandProviderState(): ModelCoreLand2017LvProviderState {
  return {
    landState: Float64Array.from(DEFAULT_INITIAL_LAND_STATE),
    previousFreeCalciumUM: null,
    previousFiberEngineeringStrain: null,
    previousDtSec: null,
    lastOutput: null,
    lastSolverResidualNorm: null,
    lastSolverOk: true,
    lastFailureReason: null,
    commitCount: 0,
  };
}

function cloneLandProviderState(state: ModelCoreLand2017LvProviderState): ModelCoreLand2017LvProviderState {
  return {
    landState: Float64Array.from(state.landState),
    previousFreeCalciumUM: state.previousFreeCalciumUM,
    previousFiberEngineeringStrain: state.previousFiberEngineeringStrain,
    previousDtSec: state.previousDtSec,
    lastOutput: state.lastOutput,
    lastSolverResidualNorm: state.lastSolverResidualNorm,
    lastSolverOk: state.lastSolverOk,
    lastFailureReason: state.lastFailureReason,
    commitCount: state.commitCount,
  };
}

function debugLandProviderState(state: ModelCoreLand2017LvProviderState) {
  return {
    landState: Array.from(state.landState),
    previousFreeCalciumUM: state.previousFreeCalciumUM,
    previousFiberEngineeringStrain: state.previousFiberEngineeringStrain,
    previousDtSec: state.previousDtSec,
    lastSourceActiveFiberStressPa: state.lastOutput?.sourceActiveFiberStressPa ?? null,
    lastHealthFinite: state.lastOutput?.health.finite ?? null,
    lastStateConservationResidual: state.lastOutput?.health.stateConservationResidual ?? null,
    lastMinimumPopulation: state.lastOutput?.health.minimumPopulation ?? null,
    lastSolverResidualNorm: state.lastSolverResidualNorm,
    lastSolverOk: state.lastSolverOk,
    lastFailureReason: state.lastFailureReason,
    commitCount: state.commitCount,
  };
}

function evaluateLandOutputForCall(
  call: ModelCoreActiveSourceProviderCall,
  state: ModelCoreLand2017LvProviderState,
): LandSourceOutput {
  const input = landContinuousInputForCall(call, state);
  return evaluateLand2017ContinuousOutput(state.landState, input);
}

function landContinuousInputForCall(
  call: ModelCoreActiveSourceProviderCall,
  state: ModelCoreLand2017LvProviderState,
): LandCallInput {
  const legacyTerms = call.activeModel.debugActiveStressTerms(call.volumeMl, call.internal, call.chamberCtx);
  const fiberEngineeringStrain = legacyTerms.lambdaRaw - 1;
  const previousStrain = state.previousFiberEngineeringStrain ?? fiberEngineeringStrain;
  const dtSec = Math.max(state.previousDtSec ?? 0, 1e-6);
  return {
    freeCalciumUM: freeCalciumUMFromInternal(call.internal.c),
    fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: (fiberEngineeringStrain - previousStrain) / dtSec,
  };
}

function landDebugTermsForCall(
  call: ModelCoreActiveSourceProviderCall,
  output: LandSourceOutput,
): ActiveStressDebugTerms {
  const pressureTerms = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    output.sourceActiveFiberStressPa,
  );
  const legacyTerms = call.activeModel.debugActiveStressTerms(call.volumeMl, call.internal, call.chamberCtx);
  const landBoundFraction = landBoundFractionFromState(
    asLandProviderState(call.providerState, "debugActiveStressTerms.boundFraction").landState,
  );
  return {
    ...legacyTerms,
    ...pressureTerms,
    c: freeCalciumUMFromInternal(call.internal.c),
    a: landBoundFraction,
    sigmaActTargetRaw: output.sourceActiveFiberStressPa,
    sigmaActTarget: output.sourceActiveFiberStressPa,
    sigmaAct: output.sourceActiveFiberStressPa,
    activeTargetLimiter: 1,
    lowStretchLimiterGate: 0,
    lowStretchLimiterStrength: 0,
  };
}

function asLandProviderState(value: unknown, label: string): ModelCoreLand2017LvProviderState {
  if (!value || typeof value !== "object") {
    throw new Error(`Land 2017 LV source provider state missing for ${label}`);
  }
  const candidate = value as ModelCoreLand2017LvProviderState;
  if (!(candidate.landState instanceof Float64Array) || candidate.landState.length !== DEFAULT_INITIAL_LAND_STATE.length) {
    throw new Error(`Land 2017 LV source provider state has invalid landState for ${label}`);
  }
  return candidate;
}

function freeCalciumUMFromInternal(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Land 2017 LV source provider free calcium input must be finite");
  return Math.max(value, 0);
}

function landBoundFractionFromState(state: Float64Array): number {
  return clamp01(state[LAND2017_STATE_INDEX.B] + state[LAND2017_STATE_INDEX.W] + state[LAND2017_STATE_INDEX.S]);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
