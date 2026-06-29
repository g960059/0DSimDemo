import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  calciumScaledLand2017LvSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE =
  "lv-land-phase5q-user0-staged-default-v1" as const;
export const MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE =
  "legacy-active-stress-frozen-reference-rollback-v0" as const;

export type ModelCoreRuntimeActiveSourceMode =
  | typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE
  | typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;

export const MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:phase5ak-user0-staged-default-be-phase5q-calcium`;

export type ModelCoreRuntimeActiveSourceResolution =
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;
      readonly claimBoundary: "user0-staged-lv-land-default-no-clinical-validation";
      readonly sourceProviderScope: "LV-only";
      readonly sourceProviderId: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly sourceArtifactId: typeof phase5QArtifact.id;
        readonly scenarioId: "phase2b-absolute-peak-ca";
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReference: number;
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
      readonly claimBoundary: "legacy-active-stress-frozen-reference-rollback";
      readonly sourceProviderScope: "none";
      readonly sourceProviderId: null;
      readonly commitScheme: null;
      readonly calciumMapping: null;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: null;
    };

export type ResolveModelCoreRuntimeActiveSourceInput = {
  readonly mode?: ModelCoreRuntimeActiveSourceMode;
  readonly instrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
};

let modelCoreRuntimeActiveSourceModeForThisProcess: ModelCoreRuntimeActiveSourceMode =
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;

export function getModelCoreRuntimeActiveSourceModeForThisProcess(): ModelCoreRuntimeActiveSourceMode {
  return modelCoreRuntimeActiveSourceModeForThisProcess;
}

export function setModelCoreRuntimeActiveSourceModeForThisProcess(
  mode: ModelCoreRuntimeActiveSourceMode,
): ModelCoreRuntimeActiveSourceMode {
  modelCoreRuntimeActiveSourceModeForThisProcess = mode;
  return modelCoreRuntimeActiveSourceModeForThisProcess;
}

export function useLegacyActiveStressForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  ) as typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
}

export function useLvLandDefaultForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;
}

export function resolveModelCoreRuntimeActiveSource(
  input: ResolveModelCoreRuntimeActiveSourceInput = {},
): ModelCoreRuntimeActiveSourceResolution {
  const mode = input.mode ?? getModelCoreRuntimeActiveSourceModeForThisProcess();
  if (mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE) {
    return {
      mode,
      claimBoundary: "legacy-active-stress-frozen-reference-rollback",
      sourceProviderScope: "none",
      sourceProviderId: null,
      commitScheme: null,
      calciumMapping: null,
      experimentalOptions: {},
      instrumentation: null,
    };
  }

  const instrumentation = input.instrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const runtimeUserControlReference = defaultParams().lvTmaxScale * defaultParams().contractility;
  const provider = calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
    commitScheme: "BE",
    sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: runtimeUserControlReference,
  });

  return {
    mode,
    claimBoundary: "user0-staged-lv-land-default-no-clinical-validation",
    sourceProviderScope: "LV-only",
    sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    commitScheme: "BE",
    calciumMapping: {
      sourceArtifactId: phase5QArtifact.id,
      scenarioId: "phase2b-absolute-peak-ca",
      calciumScale,
      runtimeUserControlMultiplier: "tmax-contractility-user-control",
      runtimeUserControlReference,
      noTuningInRuntimeDefault: true,
    },
    experimentalOptions: { activeSourceProviders: { LV: provider } },
    instrumentation,
  };
}

export function createModelCoreRuntimeExperimentalOptions(
  input: ResolveModelCoreRuntimeActiveSourceInput = {},
): ModelCoreExperimentalOptions {
  return resolveModelCoreRuntimeActiveSource(input).experimentalOptions;
}
