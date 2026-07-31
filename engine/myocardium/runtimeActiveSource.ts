import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import {
  LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS,
  createLandAtrialRuntimeProviders,
  landAtrialRuntimeNodeOverrides,
} from "@/engine/myocardium/landAtrialRuntime";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  resolveModelCoreRuntimeRootZc,
  type ModelCoreRuntimeRootZcMode,
  type ModelCoreRuntimeRootZcResolution,
} from "@/engine/myocardium/runtimeRootZc";
import { MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1 } from "@/engine/myocardium/runtimeLandCalciumContract";
import {
  MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID,
  MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID,
  MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID,
  MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID,
  calciumScaledLand2017LaSourceOnlyProvider,
  calciumScaledLand2017LvSourceOnlyProvider,
  calciumScaledLand2017RaSourceOnlyProvider,
  calciumScaledLand2017RvSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";

export const MODELCORE_RUNTIME_LV_LAND_MODE =
  "land-active-source-lv-v1" as const;
export const MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE =
  "land-active-source-lv-rv-v1" as const;
export const MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE =
  "land-active-source-lv-rv-reference-v1" as const;
export const MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE =
  "land-active-source-four-chamber-v1" as const;
export const MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE =
  "landatrial-active-source-four-chamber-v1" as const;
export const MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE =
  "baseline-active-stress-v1" as const;

export type ModelCoreRuntimeActiveSourceMode =
  | typeof MODELCORE_RUNTIME_LV_LAND_MODE
  | typeof MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE
  | typeof MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE
  | typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE
  | typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE
  | typeof MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE;

export const MODELCORE_RUNTIME_DEFAULT_ACTIVE_SOURCE_MODE =
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE;

export const MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:runtime-be-calcium-v1`;
export const MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID}:runtime-be-calcium-v1`;
export const MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID}:runtime-be-calcium-v1`;
export const MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID}:runtime-be-calcium-v1`;

export type ModelCoreRuntimeLandInstrumentationByChamber = {
  readonly LV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly LA?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RA?: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export type ModelCoreRuntimeActiveSourceResolution =
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_LAND_MODE;
      readonly sourceProviderScope: "LV-only";
      readonly sourceProviderId: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
      readonly sourceProviderIds: { readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly contractId: typeof MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId;
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReference: number;
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
      readonly instrumentationByChamber: { readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE;
      readonly sourceProviderScope: "LV+RV-base-root";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly contractId: typeof MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId;
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReferenceByChamber: {
          readonly LV: number;
          readonly RV: number;
        };
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
      readonly instrumentationByChamber: {
        readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RV: ModelCoreLand2017LvSourceProviderInstrumentation;
      };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE;
      readonly sourceProviderScope: "LV+RV";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly contractId: typeof MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId;
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReferenceByChamber: {
          readonly LV: number;
          readonly RV: number;
        };
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
      readonly instrumentationByChamber: {
        readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RV: ModelCoreLand2017LvSourceProviderInstrumentation;
      };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE;
      readonly sourceProviderScope: "LV+RV+LA+RA-land";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
        readonly LA: typeof MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID;
        readonly RA: typeof MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly contractId: typeof MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId;
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReferenceByChamber: {
          readonly LV: number;
          readonly RV: number;
          readonly LA: number;
          readonly RA: number;
        };
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
      readonly instrumentationByChamber: {
        readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly LA: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RA: ModelCoreLand2017LvSourceProviderInstrumentation;
      };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE;
      readonly sourceProviderScope: "LV+RV+LA+RA";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
        readonly LA: typeof LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.LA;
        readonly RA: typeof LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.RA;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly contractId: typeof MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId;
        readonly calciumScale: number;
        readonly runtimeUserControlMultiplier: "tmax-contractility-user-control";
        readonly runtimeUserControlReferenceByChamber: {
          readonly LV: number;
          readonly RV: number;
          readonly LA: number;
          readonly RA: number;
        };
        readonly noTuningInRuntimeDefault: true;
      };
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
      readonly instrumentationByChamber: {
        readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RV: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly LA: ModelCoreLand2017LvSourceProviderInstrumentation;
        readonly RA: ModelCoreLand2017LvSourceProviderInstrumentation;
      };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE;
      readonly sourceProviderScope: "none";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {};
      readonly commitScheme: null;
      readonly calciumMapping: null;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
      readonly instrumentation: null;
      readonly instrumentationByChamber: {};
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    };

export type ResolveModelCoreRuntimeActiveSourceInput = {
  readonly mode?: ModelCoreRuntimeActiveSourceMode;
  readonly instrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly rvInstrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly laInstrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly raInstrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly rootZcMode?: ModelCoreRuntimeRootZcMode;
  readonly rootZcBaseAoVInertanceMmHgSec2PerMl?: number;
  readonly runtimeParams?: { readonly AoV_L?: number };
};

let modelCoreRuntimeActiveSourceModeForThisProcess: ModelCoreRuntimeActiveSourceMode =
  MODELCORE_RUNTIME_DEFAULT_ACTIVE_SOURCE_MODE;

export function getModelCoreRuntimeActiveSourceModeForThisProcess(): ModelCoreRuntimeActiveSourceMode {
  return modelCoreRuntimeActiveSourceModeForThisProcess;
}

export function setModelCoreRuntimeActiveSourceModeForThisProcess(
  mode: ModelCoreRuntimeActiveSourceMode,
): ModelCoreRuntimeActiveSourceMode {
  modelCoreRuntimeActiveSourceModeForThisProcess = mode;
  return modelCoreRuntimeActiveSourceModeForThisProcess;
}

export function useBaselineActiveStressForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE,
  ) as typeof MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE;
}

export function useLvLandForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_LAND_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_LAND_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_LAND_MODE;
}

export function useLvRvLandSourcedRootForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE;
}

export function useLvRvLandBaseRootForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE;
}

export function useAllChamberLandForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE,
  ) as typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE;
}

export function useAllChamberLandAtrialForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
  ) as typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE;
}

export function resolveModelCoreRuntimeActiveSource(
  input: ResolveModelCoreRuntimeActiveSourceInput = {},
): ModelCoreRuntimeActiveSourceResolution {
  const mode = input.mode ?? getModelCoreRuntimeActiveSourceModeForThisProcess();
  if (
    mode === MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE
    && (input.rootZcMode !== undefined || input.rootZcBaseAoVInertanceMmHgSec2PerMl !== undefined)
  ) {
    throw new Error("Baseline active-stress mode cannot be composed with root/Zc options.");
  }
  const rootZcMode = input.rootZcMode ?? defaultRootZcModeFor(mode);
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: rootZcMode,
    baseAoVInertanceMmHgSec2PerMl: rootZcMode === undefined || rootZcMode === MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE
      ? undefined
      : rootZcBaseAoVInertance(input),
  });
  if (mode === MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE) {
    return {
      mode,
      sourceProviderScope: "none",
      sourceProviderId: null,
      sourceProviderIds: {},
      commitScheme: null,
      calciumMapping: null,
      experimentalOptions: rootZc.experimentalOptions,
      instrumentation: null,
      instrumentationByChamber: {},
      rootZc,
    };
  }

  const calciumScale = MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.calciumScale;
  const lvInstrumentation = input.instrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
  const lvRuntimeUserControlReference = defaultParams().lvTmaxScale * defaultParams().contractility;
  const lvProvider = calciumScaledLand2017LvSourceOnlyProvider(lvInstrumentation, {
    commitScheme: "BE",
    sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: lvRuntimeUserControlReference,
  });

  if (
    mode === MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE
    || mode === MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE
  ) {
    const rvInstrumentation = input.rvInstrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
    const laInstrumentation = input.laInstrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
    const raInstrumentation = input.raInstrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvRuntimeUserControlReference = defaultParams().rvTmaxScale * defaultParams().contractility;
    const atrialRuntimeUserControlReference = defaultParams().contractility;
    const rvProvider = calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
      commitScheme: "BE",
      sourceProviderId: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: rvRuntimeUserControlReference,
    });
    const atrialRuntimeCandidateProviders = createLandAtrialRuntimeProviders({
      LA: laInstrumentation,
      RA: raInstrumentation,
    });
    const laProvider = calciumScaledLand2017LaSourceOnlyProvider(laInstrumentation, {
      commitScheme: "BE",
      sourceProviderId: MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: atrialRuntimeUserControlReference,
    });
    const raProvider = calciumScaledLand2017RaSourceOnlyProvider(raInstrumentation, {
      commitScheme: "BE",
      sourceProviderId: MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: atrialRuntimeUserControlReference,
    });
    const runtimeAtrialProviders = mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE
      ? atrialRuntimeCandidateProviders
      : { LA: laProvider, RA: raProvider };

    const shared = {
      sourceProviderId: null as null,
      sourceProviderIds: {
        LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
        RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
      },
      commitScheme: "BE",
      calciumMapping: {
        contractId: MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId,
        calciumScale,
        runtimeUserControlMultiplier: "tmax-contractility-user-control",
        runtimeUserControlReferenceByChamber: {
          LV: lvRuntimeUserControlReference,
          RV: rvRuntimeUserControlReference,
        },
        noTuningInRuntimeDefault: true,
      },
      experimentalOptions: {
        ...rootZc.experimentalOptions,
        activeSourceProviders: { LV: lvProvider, RV: rvProvider },
      },
      instrumentation: lvInstrumentation,
      instrumentationByChamber: { LV: lvInstrumentation, RV: rvInstrumentation },
      rootZc,
    } as const;
    if (mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE) {
      return {
        mode,
        sourceProviderScope: "LV+RV+LA+RA",
        ...shared,
        sourceProviderIds: {
          LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
          RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
          LA: LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.LA,
          RA: LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.RA,
        },
        calciumMapping: {
          ...shared.calciumMapping,
          runtimeUserControlReferenceByChamber: {
            LV: lvRuntimeUserControlReference,
            RV: rvRuntimeUserControlReference,
            LA: atrialRuntimeUserControlReference,
            RA: atrialRuntimeUserControlReference,
          },
        },
        experimentalOptions: {
          ...rootZc.experimentalOptions,
          runtimeParameterPatch: { nodeOverrides: landAtrialRuntimeNodeOverrides() },
          activeSourceProviders: {
            LV: lvProvider,
            RV: rvProvider,
            LA: runtimeAtrialProviders.LA,
            RA: runtimeAtrialProviders.RA,
          },
        },
        instrumentationByChamber: {
          LV: lvInstrumentation,
          RV: rvInstrumentation,
          LA: laInstrumentation,
          RA: raInstrumentation,
        },
      };
    }
    if (mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE) {
      return {
        mode,
        sourceProviderScope: "LV+RV+LA+RA-land",
        ...shared,
        sourceProviderIds: {
          LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
          RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
          LA: MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
          RA: MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
        },
        calciumMapping: {
          ...shared.calciumMapping,
          runtimeUserControlReferenceByChamber: {
            LV: lvRuntimeUserControlReference,
            RV: rvRuntimeUserControlReference,
            LA: atrialRuntimeUserControlReference,
            RA: atrialRuntimeUserControlReference,
          },
        },
        experimentalOptions: {
          ...rootZc.experimentalOptions,
          activeSourceProviders: { LV: lvProvider, RV: rvProvider, LA: laProvider, RA: raProvider },
        },
        instrumentationByChamber: {
          LV: lvInstrumentation,
          RV: rvInstrumentation,
          LA: laInstrumentation,
          RA: raInstrumentation,
        },
      };
    }
    if (mode === MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE) {
      return {
        mode,
        sourceProviderScope: "LV+RV",
        ...shared,
      };
    }
    return {
      mode,
      sourceProviderScope: "LV+RV-base-root",
      ...shared,
    };
  }

  return {
    mode,
    sourceProviderScope: "LV-only",
    sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    sourceProviderIds: { LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID },
    commitScheme: "BE",
    calciumMapping: {
      contractId: MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.contractId,
      calciumScale,
      runtimeUserControlMultiplier: "tmax-contractility-user-control",
      runtimeUserControlReference: lvRuntimeUserControlReference,
      noTuningInRuntimeDefault: true,
    },
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders: { LV: lvProvider },
    },
    instrumentation: lvInstrumentation,
    instrumentationByChamber: { LV: lvInstrumentation },
    rootZc,
  };
}

export function createModelCoreRuntimeExperimentalOptions(
  input: ResolveModelCoreRuntimeActiveSourceInput = {},
): ModelCoreExperimentalOptions {
  return resolveModelCoreRuntimeActiveSource(input).experimentalOptions;
}

function defaultRootZcModeFor(
  mode: ModelCoreRuntimeActiveSourceMode,
): ModelCoreRuntimeRootZcMode | undefined {
  return mode === MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE
    ? MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE
    : undefined;
}

function rootZcBaseAoVInertance(input: ResolveModelCoreRuntimeActiveSourceInput): number | undefined {
  return input.rootZcBaseAoVInertanceMmHgSec2PerMl
    ?? input.runtimeParams?.AoV_L
    ?? defaultParams().AoV_L;
}
