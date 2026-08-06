import type { ActiveStressDebugTerms } from "@/engine/chambers";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";

export const MODELCORE_ACTIVE_SOURCE_PRESSURE_ADAPTER_ID =
  "modelcore-active-source-pressure-adapter-v1";

export type ModelCoreActiveSourcePressureAdapterInvocationCounts = {
  initialInternal: number;
  sourceActiveStressPa: number;
  internalDerivatives: number;
  debugActiveStressTerms: number;
};

export type ModelCoreActiveSourcePressureAdapterOptions = {
  readonly sourceProviderId: string;
  readonly readSourceActiveStressPa: (input: ModelCoreActiveSourceProviderCall) => number;
  readonly debugActiveStressTerms: (input: ModelCoreActiveSourceProviderCall) => ActiveStressDebugTerms;
  readonly invocationCounts?: ModelCoreActiveSourcePressureAdapterInvocationCounts;
};

export function createModelCoreActiveSourcePressureAdapterInvocationCounts():
ModelCoreActiveSourcePressureAdapterInvocationCounts {
  return {
    initialInternal: 0,
    sourceActiveStressPa: 0,
    internalDerivatives: 0,
    debugActiveStressTerms: 0,
  };
}

export function modelCoreActiveSourcePressureAdapterProvider(
  options: ModelCoreActiveSourcePressureAdapterOptions,
): ModelCoreExperimentalActiveSourceProvider {
  const invocationCounts = options.invocationCounts
    ?? createModelCoreActiveSourcePressureAdapterInvocationCounts();
  const readSourceActiveStressPa = (input: ModelCoreActiveSourceProviderCall): number => {
    invocationCounts.sourceActiveStressPa += 1;
    return options.readSourceActiveStressPa(input);
  };
  return {
    sourceProviderId: options.sourceProviderId,
    initialInternal: ({ activeModel }) => {
      invocationCounts.initialInternal += 1;
      return activeModel.initialInternal();
    },
    sourceActiveStressPa: readSourceActiveStressPa,
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) => {
      invocationCounts.internalDerivatives += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    debugActiveStressTerms: (input) => {
      invocationCounts.debugActiveStressTerms += 1;
      return options.debugActiveStressTerms(input);
    },
  };
}
