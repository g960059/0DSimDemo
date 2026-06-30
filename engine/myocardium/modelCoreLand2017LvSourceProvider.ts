import type { ActiveStressDebugTerms } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStepSnapshot,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  LAND2017_STATE_INDEX,
  evaluateLand2017ContinuousOutput,
  solveLand2017BackwardEulerSubsteps,
  solveLand2017Sdirk2Step,
  type Land2017EquationParameters,
  type LandSourceOutput,
  type LandStepInput,
  type Land2017StepSolveResult,
} from "@/engine/myocardium/myofilament/land2017";

export const MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID =
  "modelcore-experimental-land2017-lv-source-only-provider-v1";
export const MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID =
  "modelcore-experimental-land2017-rv-source-only-provider-v1";
export const MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID =
  "modelcore-experimental-land2017-la-source-only-provider-v1";
export const MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID =
  "modelcore-experimental-land2017-ra-source-only-provider-v1";

const DEFAULT_INITIAL_LAND_STATE = [0.18, 0.22, 0.04, 0.02, 0, 0] as const;

export type ModelCoreLand2017LvCommitScheme = "BE" | "SDIRK2";
export type ModelCoreLand2017LvKinematicsMode = "raw-wall-lambda" | "filtered-lambda-act";
export type ModelCoreLand2017LvVelocityLengthCouplingMode =
  | "source"
  | "ventricular-valve-load-staged-v1";

export type ModelCoreLand2017LvSourceProviderOptions = {
  readonly commitScheme?: ModelCoreLand2017LvCommitScheme;
  readonly kinematicsMode?: ModelCoreLand2017LvKinematicsMode;
  readonly velocityLengthCouplingMode?: ModelCoreLand2017LvVelocityLengthCouplingMode;
  readonly sourceProviderId?: string;
  readonly parameterSet?: Land2017EquationParameters;
};

export type ModelCoreLand2017LvCalciumScaledSourceProviderOptions =
  ModelCoreLand2017LvSourceProviderOptions & {
    readonly calciumScale: number;
    readonly calciumInputMultiplier?: "none" | "tmax-contractility-user-control";
    readonly calciumInputMultiplierReference?: number;
  };

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
  sdirk2Stage0SolveCount: number;
  sdirk2Stage1SolveCount: number;
  sdirk2Stage0FailureCount: number;
  sdirk2Stage1FailureCount: number;
  maxSdirk2Stage0ResidualNorm: number;
  maxSdirk2Stage1ResidualNorm: number;
  maxSdirk2Stage0Iterations: number;
  maxSdirk2Stage1Iterations: number;
  maxSdirk2Stage0LineSearchSteps: number;
  maxSdirk2Stage1LineSearchSteps: number;
  maxPreviousFreeCalciumMismatchUM: number;
  maxSourceDebugStressDifferencePa: number;
  lastFailureReason: string | null;
  sourcePathAudit: ModelCoreLand2017LvSignalAudit;
  commitPathAudit: ModelCoreLand2017LvSignalAudit;
};

export type ModelCoreLand2017LvProviderState = {
  readonly landState: Float64Array;
  readonly previousFreeCalciumUM: number | null;
  readonly previousFiberEngineeringStrain: number | null;
  readonly previousRawFiberEngineeringStrain: number | null;
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
  readonly rawFiberEngineeringStrain?: number;
  readonly rawFiberEngineeringStrainRatePerSec?: number;
  readonly velocityLengthGate?: number;
  readonly velocityLengthRateLimitHit01?: number;
};

export type ModelCoreLand2017LvRangeAudit = {
  min: number | null;
  max: number | null;
};

export type ModelCoreLand2017LvSignalAudit = {
  sampleCount: number;
  freeCalciumUM: ModelCoreLand2017LvRangeAudit;
  fiberEngineeringStrain: ModelCoreLand2017LvRangeAudit;
  fiberEngineeringStrainRatePerSec: ModelCoreLand2017LvRangeAudit;
  rawFiberEngineeringStrain?: ModelCoreLand2017LvRangeAudit;
  rawFiberEngineeringStrainRatePerSec?: ModelCoreLand2017LvRangeAudit;
  velocityLengthGate?: ModelCoreLand2017LvRangeAudit;
  velocityLengthRateLimitHit01?: ModelCoreLand2017LvRangeAudit;
  sourceActiveFiberStressPa: ModelCoreLand2017LvRangeAudit;
  stabilizationStiffnessPa: ModelCoreLand2017LvRangeAudit;
  sourceActivePowerDensityWPerM3: ModelCoreLand2017LvRangeAudit;
  boundFraction: ModelCoreLand2017LvRangeAudit;
  minimumPopulation: ModelCoreLand2017LvRangeAudit;
  stateConservationResidual: ModelCoreLand2017LvRangeAudit;
  finiteHealthAllSamples: boolean;
  stateRanges: Record<string, ModelCoreLand2017LvRangeAudit>;
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
    sdirk2Stage0SolveCount: 0,
    sdirk2Stage1SolveCount: 0,
    sdirk2Stage0FailureCount: 0,
    sdirk2Stage1FailureCount: 0,
    maxSdirk2Stage0ResidualNorm: 0,
    maxSdirk2Stage1ResidualNorm: 0,
    maxSdirk2Stage0Iterations: 0,
    maxSdirk2Stage1Iterations: 0,
    maxSdirk2Stage0LineSearchSteps: 0,
    maxSdirk2Stage1LineSearchSteps: 0,
    maxPreviousFreeCalciumMismatchUM: 0,
    maxSourceDebugStressDifferencePa: 0,
    lastFailureReason: null,
    sourcePathAudit: createLandSignalAudit(),
    commitPathAudit: createLandSignalAudit(),
  };
}

export function land2017LvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: ModelCoreLand2017LvSourceProviderOptions = {},
): ModelCoreExperimentalActiveSourceProvider {
  const commitScheme = options.commitScheme ?? "BE";
  const kinematicsMode = options.kinematicsMode ?? "raw-wall-lambda";
  const velocityLengthCouplingMode = options.velocityLengthCouplingMode ?? "source";
  const parameterSet = options.parameterSet ?? LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET;
  return {
    sourceProviderId:
      options.sourceProviderId
      ?? (
        commitScheme === "BE"
          ? MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID
          : `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:sdirk2-commit`
      ),
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
      const state = asLandProviderState(call.providerState, "sourceActiveStressPa");
      const input = landContinuousInputForCall(call, state, kinematicsMode, velocityLengthCouplingMode);
      const output = evaluateLandOutputForInput(state, input, parameterSet);
      recordLandSignalAuditSample(instrumentation.sourcePathAudit, state.landState, input, output);
      return output.sourceActiveFiberStressPa;
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      instrumentation.internalDerivatives += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    debugActiveStressTerms: (call) => {
      instrumentation.debugActiveStressTerms += 1;
      const output = evaluateLandOutputForCall(
        call,
        asLandProviderState(call.providerState, "debugActiveStressTerms"),
        kinematicsMode,
        velocityLengthCouplingMode,
        parameterSet,
      );
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
      const beforeTerms = activeModel.debugPressureTerms(
        beforeStep.effectiveVolumeMl,
        beforeStep.internal,
        beforeStep.chamberCtx,
      );
      const afterTerms = activeModel.debugPressureTerms(
        afterStep.effectiveVolumeMl,
        afterStep.internal,
        afterStep.chamberCtx,
      );
      const previousRawFiberEngineeringStrain = fiberEngineeringStrainForStep(
        activeModel,
        beforeStep.effectiveVolumeMl,
        beforeStep.internal,
        beforeStep.chamberCtx,
        kinematicsMode,
        beforeTerms.lambda - 1,
      );
      const stageRawFiberEngineeringStrain = fiberEngineeringStrainForStep(
        activeModel,
        afterStep.effectiveVolumeMl,
        afterStep.internal,
        afterStep.chamberCtx,
        kinematicsMode,
        afterTerms.lambda - 1,
      );
      const previousFiberEngineeringStrain =
        previous.previousFiberEngineeringStrain ?? previousRawFiberEngineeringStrain;
      const stagedKinematics = landKinematicsForRawStrain({
        freeCalciumUM: freeCalciumUMFromInternal(afterStep.internal.c),
        rawFiberEngineeringStrain: stageRawFiberEngineeringStrain,
        previousRawFiberEngineeringStrain:
          previous.previousRawFiberEngineeringStrain ?? previousRawFiberEngineeringStrain,
        previousFiberEngineeringStrain,
        dtSec: stepDtSec,
        chamberCtx: afterStep.chamberCtx,
        velocityLengthCouplingMode,
      });
      const landInput: LandStepInput = {
        freeCalciumUM: freeCalciumUMFromInternal(afterStep.internal.c),
        previousFiberEngineeringStrain,
        stageFiberEngineeringStrain: stagedKinematics.fiberEngineeringStrain,
        dtSec: stepDtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      };
      const previousFreeCalciumUM =
        previous.previousFreeCalciumUM
        ?? freeCalciumUMFromInternal(beforeStep.internal.c);
      instrumentation.maxPreviousFreeCalciumMismatchUM = Math.max(
        instrumentation.maxPreviousFreeCalciumMismatchUM,
        Math.abs(previousFreeCalciumUM - freeCalciumUMFromInternal(beforeStep.internal.c)),
      );
      const solveOptions = {
        maxIterations: commitScheme === "BE" ? 16 : 20,
        residualTolerance: 1e-8,
        lineSearchMinStep: 1 / 2048,
        previousFreeCalciumUM,
      } as const;
      const solved =
        commitScheme === "BE"
          ? solveLand2017BackwardEulerSubsteps(previous.landState, landInput, {
            ...solveOptions,
            substeps: 1,
          }, parameterSet)
          : solveLand2017Sdirk2Step(previous.landState, landInput, solveOptions, parameterSet);
      if (commitScheme === "SDIRK2") {
        recordSdirk2SolveInstrumentation(instrumentation, solved);
      }
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
      recordLandSignalAuditSample(instrumentation.commitPathAudit, solved.nextState, {
        ...stagedKinematics,
        freeCalciumUM: landInput.freeCalciumUM,
        fiberEngineeringStrain: landInput.stageFiberEngineeringStrain,
        fiberEngineeringStrainRatePerSec:
          (landInput.stageFiberEngineeringStrain - landInput.previousFiberEngineeringStrain)
          / landInput.dtSec,
      }, solved.output);
      return {
        landState: solved.nextState,
        previousFreeCalciumUM: landInput.freeCalciumUM,
        previousFiberEngineeringStrain: landInput.stageFiberEngineeringStrain,
        previousRawFiberEngineeringStrain: stageRawFiberEngineeringStrain,
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

export function calciumScaledLand2017LvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): ModelCoreExperimentalActiveSourceProvider {
  if (!Number.isFinite(options.calciumScale) || options.calciumScale <= 0) {
    throw new Error("Calcium-scaled Land 2017 LV source provider requires a positive finite calciumScale.");
  }
  const base = land2017LvSourceOnlyProvider(instrumentation, options);
  return {
    ...base,
    sourceActiveStressPa: (call) =>
      base.sourceActiveStressPa?.(mapActiveCallCalcium(call, activeCalciumScale(call, options))) ?? 0,
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) {
        throw new Error(`${base.sourceProviderId} must define debugActiveStressTerms.`);
      }
      return base.debugActiveStressTerms(mapActiveCallCalcium(call, activeCalciumScale(call, options)));
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(mapCommitCallCalcium(call, options)),
  };
}

export function calciumScaledLand2017RvSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): ModelCoreExperimentalActiveSourceProvider {
  return calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
    ...options,
    sourceProviderId: options.sourceProviderId ?? MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID,
  });
}

export function calciumScaledLand2017LaSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): ModelCoreExperimentalActiveSourceProvider {
  return calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
    ...options,
    sourceProviderId: options.sourceProviderId ?? MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID,
  });
}

export function calciumScaledLand2017RaSourceOnlyProvider(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation =
    createModelCoreLand2017LvSourceProviderInstrumentation(),
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): ModelCoreExperimentalActiveSourceProvider {
  return calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
    ...options,
    sourceProviderId: options.sourceProviderId ?? MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID,
  });
}

export function modelCoreLand2017LvSourceProviderIdentity() {
  return {
    sourceProviderId: MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
    parameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    initialState: DEFAULT_INITIAL_LAND_STATE,
    calciumInput: "ModelCore legacy active chamber internal.c interpreted as freeCalciumUM without tuning",
    kinematicsInput: "ModelCore activeModel pressure-adapter lambda under the same closure",
    stateLifecycle: "ModelCore providerState with once-per-step BE commit by default; SDIRK2 commit is experimental evidence-only",
    pressurePath: "sourceActiveStressPa through ActiveStressChamberModel.pressureFromActiveFiberStress",
  } as const;
}

function initialLandProviderState(): ModelCoreLand2017LvProviderState {
  return {
    landState: Float64Array.from(DEFAULT_INITIAL_LAND_STATE),
    previousFreeCalciumUM: null,
    previousFiberEngineeringStrain: null,
    previousRawFiberEngineeringStrain: null,
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
    previousRawFiberEngineeringStrain: state.previousRawFiberEngineeringStrain,
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
    previousRawFiberEngineeringStrain: state.previousRawFiberEngineeringStrain,
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
  kinematicsMode: ModelCoreLand2017LvKinematicsMode,
  velocityLengthCouplingMode: ModelCoreLand2017LvVelocityLengthCouplingMode,
  parameterSet: Land2017EquationParameters,
): LandSourceOutput {
  const input = landContinuousInputForCall(call, state, kinematicsMode, velocityLengthCouplingMode);
  return evaluateLandOutputForInput(state, input, parameterSet);
}

function mapActiveCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
  calciumScale: number,
): ModelCoreActiveSourceProviderCall {
  const mappedC = mapCalcium(call.internal.c, calciumScale);
  return { ...call, internal: { ...call.internal, c: mappedC } };
}

function mapCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): ModelCoreActiveSourceProviderStateCommitCall {
  return {
    ...call,
    beforeStep: {
      ...call.beforeStep,
      internal: {
        ...call.beforeStep.internal,
        c: mapCalcium(call.beforeStep.internal.c, stepCalciumScale(call.beforeStep.chamberCtx, options)),
      },
    },
    afterStep: {
      ...call.afterStep,
      internal: {
        ...call.afterStep.internal,
        c: mapCalcium(call.afterStep.internal.c, stepCalciumScale(call.afterStep.chamberCtx, options)),
      },
    },
  };
}

function activeCalciumScale(
  call: ModelCoreActiveSourceProviderCall,
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): number {
  return stepCalciumScale(call.chamberCtx, options);
}

function stepCalciumScale(
  chamberCtx: ModelCoreActiveSourceProviderStepSnapshot["chamberCtx"],
  options: ModelCoreLand2017LvCalciumScaledSourceProviderOptions,
): number {
  if (options.calciumInputMultiplier !== "tmax-contractility-user-control") {
    return options.calciumScale;
  }
  return options.calciumScale
    * positiveFiniteOrOne(chamberCtx.tmaxScale)
    * positiveFiniteOrOne(chamberCtx.contractility)
    / positiveFiniteOrOne(options.calciumInputMultiplierReference ?? 1);
}

function positiveFiniteOrOne(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function mapCalcium(value: number, calciumScale: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Calcium-scaled Land 2017 LV source provider calcium input must be finite.");
  }
  return Math.max(0, value) * calciumScale;
}

function evaluateLandOutputForInput(
  state: ModelCoreLand2017LvProviderState,
  input: LandCallInput,
  parameterSet: Land2017EquationParameters,
): LandSourceOutput {
  return evaluateLand2017ContinuousOutput(state.landState, input, parameterSet);
}

function landContinuousInputForCall(
  call: ModelCoreActiveSourceProviderCall,
  state: ModelCoreLand2017LvProviderState,
  kinematicsMode: ModelCoreLand2017LvKinematicsMode,
  velocityLengthCouplingMode: ModelCoreLand2017LvVelocityLengthCouplingMode,
): LandCallInput {
  const rawFiberEngineeringStrain = fiberEngineeringStrainForStep(
    call.activeModel,
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    kinematicsMode,
  );
  const dtSec = Math.max(state.previousDtSec ?? 0, 1e-6);
  return landKinematicsForRawStrain({
    freeCalciumUM: freeCalciumUMFromInternal(call.internal.c),
    rawFiberEngineeringStrain,
    previousRawFiberEngineeringStrain: state.previousRawFiberEngineeringStrain ?? rawFiberEngineeringStrain,
    previousFiberEngineeringStrain: state.previousFiberEngineeringStrain ?? rawFiberEngineeringStrain,
    dtSec,
    chamberCtx: call.chamberCtx,
    velocityLengthCouplingMode,
  });
}

function landKinematicsForRawStrain({
  freeCalciumUM,
  rawFiberEngineeringStrain,
  previousRawFiberEngineeringStrain,
  previousFiberEngineeringStrain,
  dtSec,
  chamberCtx,
  velocityLengthCouplingMode,
}: {
  readonly freeCalciumUM: number;
  readonly rawFiberEngineeringStrain: number;
  readonly previousRawFiberEngineeringStrain: number;
  readonly previousFiberEngineeringStrain: number;
  readonly dtSec: number;
  readonly chamberCtx: ModelCoreActiveSourceProviderCall["chamberCtx"];
  readonly velocityLengthCouplingMode: ModelCoreLand2017LvVelocityLengthCouplingMode;
}): LandCallInput {
  const boundedDtSec = Math.max(dtSec, 1e-6);
  const rawFiberEngineeringStrainRatePerSec =
    (rawFiberEngineeringStrain - previousRawFiberEngineeringStrain) / boundedDtSec;
  if (
    velocityLengthCouplingMode !== "ventricular-valve-load-staged-v1"
    || (chamberCtx.chamber !== "LV" && chamberCtx.chamber !== "RV")
  ) {
    return {
      freeCalciumUM,
      fiberEngineeringStrain: rawFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec:
        (rawFiberEngineeringStrain - previousFiberEngineeringStrain) / boundedDtSec,
      rawFiberEngineeringStrain,
      rawFiberEngineeringStrainRatePerSec,
      velocityLengthGate: 0,
      velocityLengthRateLimitHit01: 0,
    };
  }

  const inletOpen = clamp01(chamberCtx.inletValveOpen01 ?? 0);
  const outletOpen = clamp01(chamberCtx.outletValveOpen01 ?? 0);
  const ejectionGate = outletOpen * (1 - inletOpen);
  const inletHandoffGate = 4 * inletOpen * (1 - inletOpen);
  const outletHandoffGate = 4 * outletOpen * (1 - outletOpen);
  const velocityLengthGate = clamp01(Math.max(ejectionGate, inletHandoffGate, outletHandoffGate));
  const shorteningCapPerSec = lerp(8, 2.5, velocityLengthGate);
  const lengtheningCapPerSec = lerp(8, 1.5, velocityLengthGate);
  const stagedRatePerSec = clampNumber(
    (rawFiberEngineeringStrain - previousFiberEngineeringStrain) / boundedDtSec,
    -shorteningCapPerSec,
    lengtheningCapPerSec,
  );
  const fiberEngineeringStrain = previousFiberEngineeringStrain + stagedRatePerSec * boundedDtSec;
  const velocityLengthRateLimitHit01 =
    Math.abs(fiberEngineeringStrain - rawFiberEngineeringStrain) > 1e-10 ? 1 : 0;
  return {
    freeCalciumUM,
    fiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec: stagedRatePerSec,
    rawFiberEngineeringStrain,
    rawFiberEngineeringStrainRatePerSec,
    velocityLengthGate,
    velocityLengthRateLimitHit01,
  };
}

function fiberEngineeringStrainForStep(
  activeModel: ModelCoreActiveSourceProviderCall["activeModel"],
  volumeMl: number,
  internal: ModelCoreActiveSourceProviderCall["internal"],
  chamberCtx: ModelCoreActiveSourceProviderCall["chamberCtx"],
  kinematicsMode: ModelCoreLand2017LvKinematicsMode,
  rawFallback?: number,
): number {
  if (kinematicsMode === "filtered-lambda-act") {
    return activeModel.debugActiveStressTerms(volumeMl, internal, chamberCtx).lambdaAct - 1;
  }
  return rawFallback ?? activeModel.debugPressureTerms(volumeMl, internal, chamberCtx).lambda - 1;
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

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function recordSdirk2SolveInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  solved: Land2017StepSolveResult,
): void {
  if (solved.sdirk2Stage0) {
    instrumentation.sdirk2Stage0SolveCount += 1;
    if (!solved.sdirk2Stage0.ok) instrumentation.sdirk2Stage0FailureCount += 1;
    instrumentation.maxSdirk2Stage0ResidualNorm = Math.max(
      instrumentation.maxSdirk2Stage0ResidualNorm,
      finiteOrZero(solved.sdirk2Stage0.residualNorm),
    );
    instrumentation.maxSdirk2Stage0Iterations = Math.max(
      instrumentation.maxSdirk2Stage0Iterations,
      solved.sdirk2Stage0.iterations,
    );
    instrumentation.maxSdirk2Stage0LineSearchSteps = Math.max(
      instrumentation.maxSdirk2Stage0LineSearchSteps,
      solved.sdirk2Stage0.lineSearchSteps,
    );
  }
  if (solved.sdirk2Stage1) {
    instrumentation.sdirk2Stage1SolveCount += 1;
    if (!solved.sdirk2Stage1.ok) instrumentation.sdirk2Stage1FailureCount += 1;
    instrumentation.maxSdirk2Stage1ResidualNorm = Math.max(
      instrumentation.maxSdirk2Stage1ResidualNorm,
      finiteOrZero(solved.sdirk2Stage1.residualNorm),
    );
    instrumentation.maxSdirk2Stage1Iterations = Math.max(
      instrumentation.maxSdirk2Stage1Iterations,
      solved.sdirk2Stage1.iterations,
    );
    instrumentation.maxSdirk2Stage1LineSearchSteps = Math.max(
      instrumentation.maxSdirk2Stage1LineSearchSteps,
      solved.sdirk2Stage1.lineSearchSteps,
    );
  }
}

function createLandSignalAudit(): ModelCoreLand2017LvSignalAudit {
  return {
    sampleCount: 0,
    freeCalciumUM: emptyRangeAudit(),
    fiberEngineeringStrain: emptyRangeAudit(),
    fiberEngineeringStrainRatePerSec: emptyRangeAudit(),
    rawFiberEngineeringStrain: emptyRangeAudit(),
    rawFiberEngineeringStrainRatePerSec: emptyRangeAudit(),
    velocityLengthGate: emptyRangeAudit(),
    velocityLengthRateLimitHit01: emptyRangeAudit(),
    sourceActiveFiberStressPa: emptyRangeAudit(),
    stabilizationStiffnessPa: emptyRangeAudit(),
    sourceActivePowerDensityWPerM3: emptyRangeAudit(),
    boundFraction: emptyRangeAudit(),
    minimumPopulation: emptyRangeAudit(),
    stateConservationResidual: emptyRangeAudit(),
    finiteHealthAllSamples: true,
    stateRanges: Object.fromEntries(
      Object.keys(LAND2017_STATE_INDEX).map((label) => [label, emptyRangeAudit()]),
    ),
  };
}

function emptyRangeAudit(): ModelCoreLand2017LvRangeAudit {
  return { min: null, max: null };
}

function recordLandSignalAuditSample(
  audit: ModelCoreLand2017LvSignalAudit,
  state: ArrayLike<number>,
  input: LandCallInput,
  output: LandSourceOutput,
): void {
  audit.sampleCount += 1;
  updateRange(audit.freeCalciumUM, input.freeCalciumUM);
  updateRange(audit.fiberEngineeringStrain, input.fiberEngineeringStrain);
  updateRange(audit.fiberEngineeringStrainRatePerSec, input.fiberEngineeringStrainRatePerSec);
  updateRange(
    audit.rawFiberEngineeringStrain ?? (audit.rawFiberEngineeringStrain = emptyRangeAudit()),
    input.rawFiberEngineeringStrain ?? input.fiberEngineeringStrain,
  );
  updateRange(
    audit.rawFiberEngineeringStrainRatePerSec
      ?? (audit.rawFiberEngineeringStrainRatePerSec = emptyRangeAudit()),
    input.rawFiberEngineeringStrainRatePerSec ?? input.fiberEngineeringStrainRatePerSec,
  );
  updateRange(audit.velocityLengthGate ?? (audit.velocityLengthGate = emptyRangeAudit()), input.velocityLengthGate ?? 0);
  updateRange(
    audit.velocityLengthRateLimitHit01 ?? (audit.velocityLengthRateLimitHit01 = emptyRangeAudit()),
    input.velocityLengthRateLimitHit01 ?? 0,
  );
  updateRange(audit.sourceActiveFiberStressPa, output.sourceActiveFiberStressPa);
  updateRange(audit.stabilizationStiffnessPa, output.stabilizationStiffnessPa);
  updateRange(audit.sourceActivePowerDensityWPerM3, output.sourceActivePowerDensityWPerM3);
  updateRange(audit.boundFraction, landBoundFractionFromStateLike(state));
  updateRange(audit.minimumPopulation, output.health.minimumPopulation);
  updateRange(audit.stateConservationResidual, output.health.stateConservationResidual);
  audit.finiteHealthAllSamples = audit.finiteHealthAllSamples && output.health.finite;
  for (const [label, index] of Object.entries(LAND2017_STATE_INDEX)) {
    updateRange(audit.stateRanges[label] ?? (audit.stateRanges[label] = emptyRangeAudit()), state[index]);
  }
}

function updateRange(range: ModelCoreLand2017LvRangeAudit, value: number): void {
  if (!Number.isFinite(value)) return;
  range.min = range.min == null ? value : Math.min(range.min, value);
  range.max = range.max == null ? value : Math.max(range.max, value);
}

function landBoundFractionFromStateLike(state: ArrayLike<number>): number {
  return clamp01(
    state[LAND2017_STATE_INDEX.B]
    + state[LAND2017_STATE_INDEX.W]
    + state[LAND2017_STATE_INDEX.S],
  );
}
