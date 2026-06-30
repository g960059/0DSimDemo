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
  | "ventricular-valve-load-staged-v1"
  | "ventricular-stateful-zeta-drive-v1";
export type ModelCoreLand2017LvSourceStressPressureAdapterMode =
  | "direct"
  | "tension-state-filter-v1"
  | "transition-gated-tension-filter-v1";

export type ModelCoreLand2017LvSourceProviderOptions = {
  readonly commitScheme?: ModelCoreLand2017LvCommitScheme;
  readonly kinematicsMode?: ModelCoreLand2017LvKinematicsMode;
  readonly velocityLengthCouplingMode?: ModelCoreLand2017LvVelocityLengthCouplingMode;
  readonly sourceStressPressureAdapterMode?: ModelCoreLand2017LvSourceStressPressureAdapterMode;
  readonly sourceStressTensionRiseSec?: number;
  readonly sourceStressTensionFallSec?: number;
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
  maxTraceSamples: number;
  traceDroppedCount: number;
  traceSamples: ModelCoreLand2017LvSourceProviderTraceSample[];
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

export type ModelCoreLand2017LvSourceProviderInstrumentationOptions = {
  readonly maxTraceSamples?: number;
};

export type ModelCoreLand2017LvSourceProviderTraceSample = {
  readonly chamber: string;
  readonly commitIndex: number;
  readonly providerStateVersion: number;
  readonly dtSec: number;
  readonly before: ModelCoreLand2017LvProviderStepTraceSnapshot;
  readonly after: ModelCoreLand2017LvProviderStepTraceSnapshot;
  readonly previousFreeCalciumUM: number;
  readonly freeCalciumUM: number;
  readonly previousLandState: readonly number[];
  readonly nextLandState: readonly number[] | null;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly previousRawFiberEngineeringStrain: number;
  readonly stageRawFiberEngineeringStrain: number;
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly rawFiberEngineeringStrainRatePerSec: number;
  readonly zetaDriveFiberEngineeringStrainRatePerSec: number | null;
  readonly velocityLengthGate: number | null;
  readonly velocityLengthRateLimitHit01: number | null;
  readonly zetaDriveGate: number | null;
  readonly zetaDriveRateLimitHit01: number | null;
  readonly solverOk: boolean;
  readonly solverResidualNorm: number | null;
  readonly solverIterations: number | null;
  readonly solverFailureReason: string | null;
  readonly sourceActiveFiberStressPa: number | null;
  readonly stabilizationStiffnessPa: number | null;
  readonly sourceActivePowerDensityWPerM3: number | null;
  readonly boundFraction: number | null;
  readonly minimumPopulation: number | null;
  readonly stateConservationResidual: number | null;
  readonly finiteHealth: boolean | null;
};

export type ModelCoreLand2017LvProviderStepTraceSnapshot = {
  readonly tSec: number;
  readonly phi: number;
  readonly rawVolumeMl: number;
  readonly effectiveVolumeMl: number;
};

export type ModelCoreLand2017LvProviderState = {
  readonly landState: Float64Array;
  readonly previousFreeCalciumUM: number | null;
  readonly previousFiberEngineeringStrain: number | null;
  readonly previousRawFiberEngineeringStrain: number | null;
  readonly previousZetaDriveFiberEngineeringStrainRatePerSec: number | null;
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
  readonly zetaDriveFiberEngineeringStrainRatePerSec?: number;
  readonly rawFiberEngineeringStrain?: number;
  readonly rawFiberEngineeringStrainRatePerSec?: number;
  readonly velocityLengthGate?: number;
  readonly velocityLengthRateLimitHit01?: number;
  readonly zetaDriveGate?: number;
  readonly zetaDriveRateLimitHit01?: number;
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
  zetaDriveFiberEngineeringStrainRatePerSec?: ModelCoreLand2017LvRangeAudit;
  rawFiberEngineeringStrain?: ModelCoreLand2017LvRangeAudit;
  rawFiberEngineeringStrainRatePerSec?: ModelCoreLand2017LvRangeAudit;
  velocityLengthGate?: ModelCoreLand2017LvRangeAudit;
  velocityLengthRateLimitHit01?: ModelCoreLand2017LvRangeAudit;
  zetaDriveGate?: ModelCoreLand2017LvRangeAudit;
  zetaDriveRateLimitHit01?: ModelCoreLand2017LvRangeAudit;
  sourceActiveFiberStressPa: ModelCoreLand2017LvRangeAudit;
  stabilizationStiffnessPa: ModelCoreLand2017LvRangeAudit;
  sourceActivePowerDensityWPerM3: ModelCoreLand2017LvRangeAudit;
  boundFraction: ModelCoreLand2017LvRangeAudit;
  minimumPopulation: ModelCoreLand2017LvRangeAudit;
  stateConservationResidual: ModelCoreLand2017LvRangeAudit;
  finiteHealthAllSamples: boolean;
  stateRanges: Record<string, ModelCoreLand2017LvRangeAudit>;
};

export function createModelCoreLand2017LvSourceProviderInstrumentation(
  options: ModelCoreLand2017LvSourceProviderInstrumentationOptions = {},
):
ModelCoreLand2017LvSourceProviderInstrumentation {
  const maxTraceSamples =
    Number.isFinite(options.maxTraceSamples) && (options.maxTraceSamples ?? 0) > 0
      ? Math.floor(options.maxTraceSamples ?? 0)
      : 0;
  return {
    maxTraceSamples,
    traceDroppedCount: 0,
    traceSamples: [],
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
  const sourceStressPressureAdapterMode = options.sourceStressPressureAdapterMode ?? "direct";
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
      return sourceStressForPressureAdapterCall(call, output.sourceActiveFiberStressPa, sourceStressPressureAdapterMode);
    },
    internalDerivatives: (call) => {
      instrumentation.internalDerivatives += 1;
      const base = call.activeModel.internalDerivatives(call.volumeMl, call.internal, call.chamberCtx);
      if (
        sourceStressPressureAdapterMode === "direct"
        || (call.chamber !== "LV" && call.chamber !== "RV")
      ) {
        return base;
      }
      const rawSourceStressPa = evaluateLandOutputForCall(
        call,
        asLandProviderState(call.providerState, "internalDerivatives"),
        kinematicsMode,
        velocityLengthCouplingMode,
        parameterSet,
      ).sourceActiveFiberStressPa;
      const current = finiteNonnegativeOr(call.internal.tensionPa, rawSourceStressPa);
      const target = finiteNonnegativeOr(rawSourceStressPa, current);
      const tau = target > current
        ? positiveFiniteOr(options.sourceStressTensionRiseSec, 0.024)
        : positiveFiniteOr(options.sourceStressTensionFallSec, 0.060);
      return {
        ...base,
        tensionPaDot: clampNumber((target - current) / tau, -5000000, 5000000),
      };
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
      const terms = landDebugTermsForCall(call, output, sourceStressPressureAdapterMode);
      instrumentation.maxSourceDebugStressDifferencePa = Math.max(
        instrumentation.maxSourceDebugStressDifferencePa,
        Math.abs(terms.sigmaAct - sourceStressForPressureAdapterCall(
          call,
          output.sourceActiveFiberStressPa,
          sourceStressPressureAdapterMode,
        )),
      );
      return terms;
    },
    commitProviderStateAfterStep: ({
      chamber,
      activeModel,
      previousProviderState,
      previousProviderStateVersion,
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
        previousZetaDriveFiberEngineeringStrainRatePerSec:
          previous.previousZetaDriveFiberEngineeringStrainRatePerSec,
        dtSec: stepDtSec,
        chamberCtx: afterStep.chamberCtx,
        velocityLengthCouplingMode,
      });
      const landInput: LandStepInput = {
        freeCalciumUM: freeCalciumUMFromInternal(afterStep.internal.c),
        previousFiberEngineeringStrain,
        stageFiberEngineeringStrain: stagedKinematics.fiberEngineeringStrain,
        ...(stagedKinematics.zetaDriveFiberEngineeringStrainRatePerSec !== undefined
          ? {
            stageZetaDriveFiberEngineeringStrainRatePerSec:
              stagedKinematics.zetaDriveFiberEngineeringStrainRatePerSec,
          }
          : {}),
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
      recordLandCommitTraceSample(instrumentation, {
        chamber,
        commitIndex: previous.commitCount + 1,
        providerStateVersion: previousProviderStateVersion,
        dtSec: stepDtSec,
        beforeStep,
        afterStep,
        previousFreeCalciumUM,
        landInput,
        previousLandState: previous.landState,
        solved,
        previousFiberEngineeringStrain,
        stageRawFiberEngineeringStrain,
        previousRawFiberEngineeringStrain,
        stagedKinematics,
      });
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
        previousZetaDriveFiberEngineeringStrainRatePerSec:
          stagedKinematics.zetaDriveFiberEngineeringStrainRatePerSec
          ?? stagedKinematics.fiberEngineeringStrainRatePerSec,
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
    previousZetaDriveFiberEngineeringStrainRatePerSec: null,
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
    previousZetaDriveFiberEngineeringStrainRatePerSec:
      state.previousZetaDriveFiberEngineeringStrainRatePerSec,
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
    previousZetaDriveFiberEngineeringStrainRatePerSec:
      state.previousZetaDriveFiberEngineeringStrainRatePerSec,
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

function positiveFiniteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
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
    previousZetaDriveFiberEngineeringStrainRatePerSec:
      state.previousZetaDriveFiberEngineeringStrainRatePerSec,
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
  previousZetaDriveFiberEngineeringStrainRatePerSec,
  dtSec,
  chamberCtx,
  velocityLengthCouplingMode,
}: {
  readonly freeCalciumUM: number;
  readonly rawFiberEngineeringStrain: number;
  readonly previousRawFiberEngineeringStrain: number;
  readonly previousFiberEngineeringStrain: number;
  readonly previousZetaDriveFiberEngineeringStrainRatePerSec: number | null;
  readonly dtSec: number;
  readonly chamberCtx: ModelCoreActiveSourceProviderCall["chamberCtx"];
  readonly velocityLengthCouplingMode: ModelCoreLand2017LvVelocityLengthCouplingMode;
}): LandCallInput {
  const boundedDtSec = Math.max(dtSec, 1e-6);
  const rawFiberEngineeringStrainRatePerSec =
    (rawFiberEngineeringStrain - previousRawFiberEngineeringStrain) / boundedDtSec;
  if (
    velocityLengthCouplingMode === "ventricular-stateful-zeta-drive-v1"
    && (chamberCtx.chamber === "LV" || chamberCtx.chamber === "RV")
  ) {
    const zeta = statefulVentricularZetaDriveRate({
      rawRatePerSec: rawFiberEngineeringStrainRatePerSec,
      previousRatePerSec: previousZetaDriveFiberEngineeringStrainRatePerSec,
      dtSec: boundedDtSec,
      chamberCtx,
    });
    return {
      freeCalciumUM,
      fiberEngineeringStrain: rawFiberEngineeringStrain,
      fiberEngineeringStrainRatePerSec:
        (rawFiberEngineeringStrain - previousRawFiberEngineeringStrain) / boundedDtSec,
      zetaDriveFiberEngineeringStrainRatePerSec: zeta.ratePerSec,
      rawFiberEngineeringStrain,
      rawFiberEngineeringStrainRatePerSec,
      velocityLengthGate: 0,
      velocityLengthRateLimitHit01: 0,
      zetaDriveGate: zeta.gate,
      zetaDriveRateLimitHit01: zeta.rateLimitHit01,
    };
  }

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
      zetaDriveFiberEngineeringStrainRatePerSec: rawFiberEngineeringStrainRatePerSec,
      velocityLengthGate: 0,
      velocityLengthRateLimitHit01: 0,
      zetaDriveGate: 0,
      zetaDriveRateLimitHit01: 0,
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
    zetaDriveFiberEngineeringStrainRatePerSec: stagedRatePerSec,
    rawFiberEngineeringStrain,
    rawFiberEngineeringStrainRatePerSec,
    velocityLengthGate,
    velocityLengthRateLimitHit01,
    zetaDriveGate: 0,
    zetaDriveRateLimitHit01: 0,
  };
}

function statefulVentricularZetaDriveRate({
  rawRatePerSec,
  previousRatePerSec,
  dtSec,
  chamberCtx,
}: {
  readonly rawRatePerSec: number;
  readonly previousRatePerSec: number | null;
  readonly dtSec: number;
  readonly chamberCtx: ModelCoreActiveSourceProviderCall["chamberCtx"];
}): {
  readonly ratePerSec: number;
  readonly gate: number;
  readonly rateLimitHit01: number;
} {
  const inletOpen = clamp01(chamberCtx.inletValveOpen01 ?? 0);
  const outletOpen = clamp01(chamberCtx.outletValveOpen01 ?? 0);
  const ejectionGate = outletOpen * (1 - inletOpen);
  const inletHandoffGate = 4 * inletOpen * (1 - inletOpen);
  const outletHandoffGate = 4 * outletOpen * (1 - outletOpen);
  const gate = clamp01(Math.max(ejectionGate, inletHandoffGate, outletHandoffGate));
  const chamberScale = chamberCtx.chamber === "RV" ? 0.85 : 1;
  const shorteningCapPerSec = chamberScale * lerp(10, 3.2, gate);
  const lengtheningCapPerSec = chamberScale * lerp(10, 2.2, gate);
  const limitedRawRate = clampNumber(rawRatePerSec, -shorteningCapPerSec, lengtheningCapPerSec);
  const tauSec = lerp(0.006, 0.028, gate);
  const alpha = clamp01(dtSec / (tauSec + dtSec));
  const previous =
    previousRatePerSec != null && Number.isFinite(previousRatePerSec)
      ? previousRatePerSec
      : limitedRawRate;
  const ratePerSec = previous + alpha * (limitedRawRate - previous);
  const rateLimitHit01 = Math.abs(ratePerSec - rawRatePerSec) > 1e-8 ? 1 : 0;
  return { ratePerSec, gate, rateLimitHit01 };
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
  sourceStressPressureAdapterMode: ModelCoreLand2017LvSourceStressPressureAdapterMode = "direct",
): ActiveStressDebugTerms {
  const pressureSourceStressPa = sourceStressForPressureAdapterCall(
    call,
    output.sourceActiveFiberStressPa,
    sourceStressPressureAdapterMode,
  );
  const pressureTerms = call.activeModel.debugPressureTermsFromActiveFiberStress(
    call.volumeMl,
    call.internal,
    call.chamberCtx,
    pressureSourceStressPa,
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
    sigmaActTarget: pressureSourceStressPa,
    sigmaAct: pressureSourceStressPa,
    activeTargetLimiter: 1,
    lowStretchLimiterGate: 0,
    lowStretchLimiterStrength: 0,
  };
}

function sourceStressForPressureAdapterCall(
  call: ModelCoreActiveSourceProviderCall,
  rawSourceStressPa: number,
  mode: ModelCoreLand2017LvSourceStressPressureAdapterMode,
): number {
  if (mode === "direct") return rawSourceStressPa;
  if (!Number.isFinite(rawSourceStressPa) || rawSourceStressPa < 0) return rawSourceStressPa;
  const raw = rawSourceStressPa;
  const filtered = finiteNonnegativeOr(call.internal.tensionPa, raw);
  if (mode === "tension-state-filter-v1") return filtered;
  const gate = ventricularTransitionPressureAdapterGate(call);
  return raw + gate * (filtered - raw);
}

function ventricularTransitionPressureAdapterGate(call: ModelCoreActiveSourceProviderCall): number {
  if (call.chamber !== "LV" && call.chamber !== "RV") return 0;
  const inletOpen = clamp01(call.chamberCtx.inletValveOpen01 ?? 0);
  const outletOpen = clamp01(call.chamberCtx.outletValveOpen01 ?? 0);
  const inletHandoff = 4 * inletOpen * (1 - inletOpen);
  const outletHandoff = 4 * outletOpen * (1 - outletOpen);
  const ejection = outletOpen * (1 - inletOpen);
  return clamp01(Math.max(inletHandoff, outletHandoff, 0.35 * ejection));
}

function finiteNonnegativeOr(value: number | undefined, fallback: number): number {
  if (value !== undefined && Number.isFinite(value)) return Math.max(0, value);
  return Number.isFinite(fallback) ? Math.max(0, fallback) : 0;
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

function finiteOrNull(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) ? value : null;
}

function recordLandCommitTraceSample(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
  input: {
    readonly chamber: string;
    readonly commitIndex: number;
    readonly providerStateVersion: number;
    readonly dtSec: number;
    readonly beforeStep: ModelCoreActiveSourceProviderStepSnapshot;
    readonly afterStep: ModelCoreActiveSourceProviderStepSnapshot;
    readonly previousFreeCalciumUM: number;
    readonly landInput: LandStepInput;
    readonly previousLandState: Float64Array;
    readonly solved: Land2017StepSolveResult;
    readonly previousFiberEngineeringStrain: number;
    readonly stageRawFiberEngineeringStrain: number;
    readonly previousRawFiberEngineeringStrain: number;
    readonly stagedKinematics: LandCallInput;
  },
): void {
  if (instrumentation.maxTraceSamples <= 0) return;
  if (instrumentation.traceSamples.length >= instrumentation.maxTraceSamples) {
    instrumentation.traceDroppedCount += 1;
    return;
  }
  const output = input.solved.output;
  const nextState = input.solved.ok ? Array.from(input.solved.nextState) : null;
  instrumentation.traceSamples.push({
    chamber: input.chamber,
    commitIndex: input.commitIndex,
    providerStateVersion: input.providerStateVersion,
    dtSec: input.dtSec,
    before: traceSnapshot(input.beforeStep),
    after: traceSnapshot(input.afterStep),
    previousFreeCalciumUM: input.previousFreeCalciumUM,
    freeCalciumUM: input.landInput.freeCalciumUM,
    previousLandState: Array.from(input.previousLandState),
    nextLandState: nextState,
    previousFiberEngineeringStrain: input.previousFiberEngineeringStrain,
    stageFiberEngineeringStrain: input.landInput.stageFiberEngineeringStrain,
    previousRawFiberEngineeringStrain: input.previousRawFiberEngineeringStrain,
    stageRawFiberEngineeringStrain: input.stageRawFiberEngineeringStrain,
    fiberEngineeringStrainRatePerSec:
      (input.landInput.stageFiberEngineeringStrain - input.landInput.previousFiberEngineeringStrain)
      / Math.max(input.landInput.dtSec, 1e-9),
    rawFiberEngineeringStrainRatePerSec:
      (input.stageRawFiberEngineeringStrain - input.previousRawFiberEngineeringStrain)
      / Math.max(input.landInput.dtSec, 1e-9),
    zetaDriveFiberEngineeringStrainRatePerSec:
      input.stagedKinematics.zetaDriveFiberEngineeringStrainRatePerSec ?? null,
    velocityLengthGate: input.stagedKinematics.velocityLengthGate ?? null,
    velocityLengthRateLimitHit01: input.stagedKinematics.velocityLengthRateLimitHit01 ?? null,
    zetaDriveGate: input.stagedKinematics.zetaDriveGate ?? null,
    zetaDriveRateLimitHit01: input.stagedKinematics.zetaDriveRateLimitHit01 ?? null,
    solverOk: input.solved.ok,
    solverResidualNorm: finiteOrNull(input.solved.residualNorm),
    solverIterations: Number.isFinite(input.solved.iterations) ? input.solved.iterations : null,
    solverFailureReason: input.solved.failureReason ?? null,
    sourceActiveFiberStressPa: output ? finiteOrNull(output.sourceActiveFiberStressPa) : null,
    stabilizationStiffnessPa: output ? finiteOrNull(output.stabilizationStiffnessPa) : null,
    sourceActivePowerDensityWPerM3: output ? finiteOrNull(output.sourceActivePowerDensityWPerM3) : null,
    boundFraction: output ? landBoundFractionFromStateLike(input.solved.nextState) : null,
    minimumPopulation: output ? finiteOrNull(output.health.minimumPopulation) : null,
    stateConservationResidual: output ? finiteOrNull(output.health.stateConservationResidual) : null,
    finiteHealth: output ? output.health.finite : null,
  });
}

function traceSnapshot(
  snapshot: ModelCoreActiveSourceProviderStepSnapshot,
): ModelCoreLand2017LvProviderStepTraceSnapshot {
  return {
    tSec: snapshot.tSec,
    phi: snapshot.phi,
    rawVolumeMl: snapshot.rawVolumeMl,
    effectiveVolumeMl: snapshot.effectiveVolumeMl,
  };
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
    zetaDriveFiberEngineeringStrainRatePerSec: emptyRangeAudit(),
    rawFiberEngineeringStrain: emptyRangeAudit(),
    rawFiberEngineeringStrainRatePerSec: emptyRangeAudit(),
    velocityLengthGate: emptyRangeAudit(),
    velocityLengthRateLimitHit01: emptyRangeAudit(),
    zetaDriveGate: emptyRangeAudit(),
    zetaDriveRateLimitHit01: emptyRangeAudit(),
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
    audit.zetaDriveFiberEngineeringStrainRatePerSec
      ?? (audit.zetaDriveFiberEngineeringStrainRatePerSec = emptyRangeAudit()),
    input.zetaDriveFiberEngineeringStrainRatePerSec ?? input.fiberEngineeringStrainRatePerSec,
  );
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
  updateRange(audit.zetaDriveGate ?? (audit.zetaDriveGate = emptyRangeAudit()), input.zetaDriveGate ?? 0);
  updateRange(
    audit.zetaDriveRateLimitHit01 ?? (audit.zetaDriveRateLimitHit01 = emptyRangeAudit()),
    input.zetaDriveRateLimitHit01 ?? 0,
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
