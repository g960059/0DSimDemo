import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import type {
  ModelCoreActiveSourceProviderCall,
  ModelCoreActiveSourceProviderStateCommitCall,
  ModelCoreExperimentalActiveSourceProvider,
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  land2017LvSourceOnlyProvider,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID =
  "developer-only-lv-land-runtime-flag-rfc-v1";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT =
  "developer-only-no-production-case-workbench-runtime" as const;

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagAcknowledgement =
  typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT;

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagFactoryInput = {
  readonly acknowledgement: MyocardiumDeveloperOnlyLvLandRuntimeFlagAcknowledgement;
  readonly instrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagOptions = {
  readonly flagId: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID;
  readonly claimBoundary: "developer-only-rfc-helper-not-production-runtime";
  readonly sourceProviderScope: "LV-only";
  readonly sourceProviderId: string;
  readonly commitScheme: "BE";
  readonly calciumMapping: {
    readonly sourceArtifactId: typeof phase5QArtifact.id;
    readonly scenarioId: "phase2b-absolute-peak-ca";
    readonly calciumScale: number;
    readonly noTuningInHelper: true;
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
  readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export function createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions(
  input: MyocardiumDeveloperOnlyLvLandRuntimeFlagFactoryInput,
): MyocardiumDeveloperOnlyLvLandRuntimeFlagOptions {
  if (input.acknowledgement !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT) {
    throw new Error("Developer-only LV Land runtime flag requires explicit non-production acknowledgement.");
  }
  const instrumentation = input.instrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
  const sourceProviderId =
    "modelcore-experimental-land2017-lv-source-only-provider-v1:phase5u-developer-only-be-phase5q-calcium";
  const provider = phase5QCalciumMappedLandProvider(sourceProviderId, instrumentation);
  return {
    flagId: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID,
    claimBoundary: "developer-only-rfc-helper-not-production-runtime",
    sourceProviderScope: "LV-only",
    sourceProviderId,
    commitScheme: "BE",
    calciumMapping: {
      sourceArtifactId: phase5QArtifact.id,
      scenarioId: "phase2b-absolute-peak-ca",
      calciumScale: phase5QArtifact.calibration.phase2bAbsolutePeakScale,
      noTuningInHelper: true,
    },
    experimentalOptions: { activeSourceProviders: { LV: provider } },
    instrumentation,
  };
}

function phase5QCalciumMappedLandProvider(
  sourceProviderId: string,
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): ModelCoreExperimentalActiveSourceProvider {
  const base = land2017LvSourceOnlyProvider(instrumentation, {
    commitScheme: "BE",
    sourceProviderId,
  });
  return {
    ...base,
    sourceActiveStressPa: (call) =>
      base.sourceActiveStressPa?.(mapActiveCallCalcium(call)) ?? 0,
    debugActiveStressTerms: (call) => {
      if (!base.debugActiveStressTerms) throw new Error(`${sourceProviderId} must define debugActiveStressTerms.`);
      return base.debugActiveStressTerms(mapActiveCallCalcium(call));
    },
    commitProviderStateAfterStep: (call) =>
      base.commitProviderStateAfterStep?.(mapCommitCallCalcium(call)),
  };
}

function mapActiveCallCalcium(
  call: ModelCoreActiveSourceProviderCall,
): ModelCoreActiveSourceProviderCall {
  const mappedC = mapCalcium(call.internal.c);
  return { ...call, internal: { ...call.internal, c: mappedC } };
}

function mapCommitCallCalcium(
  call: ModelCoreActiveSourceProviderStateCommitCall,
): ModelCoreActiveSourceProviderStateCommitCall {
  return {
    ...call,
    beforeStep: {
      ...call.beforeStep,
      internal: {
        ...call.beforeStep.internal,
        c: mapCalcium(call.beforeStep.internal.c),
      },
    },
    afterStep: {
      ...call.afterStep,
      internal: {
        ...call.afterStep.internal,
        c: mapCalcium(call.afterStep.internal.c),
      },
    },
  };
}

function mapCalcium(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Developer-only LV Land runtime flag calcium input must be finite.");
  return Math.max(0, value) * phase5QArtifact.calibration.phase2bAbsolutePeakScale;
}
