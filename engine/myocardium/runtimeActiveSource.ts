import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import {
  LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS,
  createLandAtrialRuntimeCandidateProviders,
  landAtrialRuntimeCandidateNodeOverrides,
} from "@/engine/myocardium/landAtrialRuntimeCandidate";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  resolveModelCoreRuntimeRootZc,
  type ModelCoreRuntimeRootZcMode,
  type ModelCoreRuntimeRootZcResolution,
} from "@/engine/myocardium/runtimeRootZc";
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

export const MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE =
  "lv-land-phase5q-user0-staged-default-v1" as const;
export const MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE =
  "lv-rv-land-phase5ao-user0-staged-default-v1" as const;
export const MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE =
  "lv-rv-land-phase5al-default-candidate-v1" as const;
export const MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE =
  "all-chamber-land-phase5aq-default-candidate-v1" as const;
export const MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE =
  "all-chamber-landatrial-phase5bk-user0-staged-default-v1" as const;
export const MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE =
  "legacy-active-stress-frozen-reference-rollback-v0" as const;

export type ModelCoreRuntimeActiveSourceMode =
  | typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE
  | typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE
  | typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE
  | typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE
  | typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE
  | typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;

export const MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE =
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE;

export const MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LV_SOURCE_ONLY_PROVIDER_ID}:phase5ak-user0-staged-default-be-phase5q-calcium`;
export const MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_RV_SOURCE_ONLY_PROVIDER_ID}:phase5al-default-candidate-be-phase5q-calcium`;
export const MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_LA_SOURCE_ONLY_PROVIDER_ID}:phase5aq-default-candidate-be-phase5q-calcium`;
export const MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID =
  `${MODELCORE_EXPERIMENTAL_LAND2017_RA_SOURCE_ONLY_PROVIDER_ID}:phase5aq-default-candidate-be-phase5q-calcium`;

export type ModelCoreRuntimeLandInstrumentationByChamber = {
  readonly LV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly LA?: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RA?: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export type ModelCoreRuntimeActiveSourceResolution =
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE;
      readonly claimBoundary: "user0-staged-lv-land-default-no-clinical-validation";
      readonly sourceProviderScope: "LV-only";
      readonly sourceProviderId: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
      readonly sourceProviderIds: { readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID };
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
      readonly instrumentationByChamber: { readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation };
      readonly rootZc: ModelCoreRuntimeRootZcResolution;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE;
      readonly claimBoundary: "lv-rv-land-default-candidate-evidence-no-runtime-flip";
      readonly sourceProviderScope: "LV+RV-candidate";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly sourceArtifactId: typeof phase5QArtifact.id;
        readonly scenarioId: "phase2b-absolute-peak-ca";
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
      readonly mode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
      readonly claimBoundary: "user0-staged-lv-rv-land-default-no-clinical-validation";
      readonly sourceProviderScope: "LV+RV";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly sourceArtifactId: typeof phase5QArtifact.id;
        readonly scenarioId: "phase2b-absolute-peak-ca";
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
      readonly mode: typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE;
      readonly claimBoundary: "all-chamber-land-default-candidate-evidence-no-runtime-flip";
      readonly sourceProviderScope: "LV+RV+LA+RA-candidate";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
        readonly LA: typeof MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID;
        readonly RA: typeof MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly sourceArtifactId: typeof phase5QArtifact.id;
        readonly scenarioId: "phase2b-absolute-peak-ca";
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
      readonly mode: typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE;
      readonly claimBoundary: "user0-staged-all-chamber-landatrial-default-no-clinical-validation";
      readonly sourceProviderScope: "LV+RV+LA+RA";
      readonly sourceProviderId: null;
      readonly sourceProviderIds: {
        readonly LV: typeof MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID;
        readonly RV: typeof MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID;
        readonly LA: typeof LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.LA;
        readonly RA: typeof LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.RA;
      };
      readonly commitScheme: "BE";
      readonly calciumMapping: {
        readonly sourceArtifactId: typeof phase5QArtifact.id;
        readonly scenarioId: "phase2b-absolute-peak-ca";
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
      readonly mode: typeof MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE;
      readonly claimBoundary: "legacy-active-stress-frozen-reference-rollback";
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
  MODELCORE_RUNTIME_USER0_STAGED_DEFAULT_MODE;

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

export function useLvRvLandDefaultForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
}

export function useLvRvLandDefaultCandidateForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE,
  ) as typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE;
}

export function useAllChamberLandDefaultCandidateForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
  ) as typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE;
}

export function useAllChamberLandAtrialDefaultForModelCoreRuntimeForThisProcess():
typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE {
  return setModelCoreRuntimeActiveSourceModeForThisProcess(
    MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  ) as typeof MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE;
}

export function resolveModelCoreRuntimeActiveSource(
  input: ResolveModelCoreRuntimeActiveSourceInput = {},
): ModelCoreRuntimeActiveSourceResolution {
  const mode = input.mode ?? getModelCoreRuntimeActiveSourceModeForThisProcess();
  if (
    mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE
    && (input.rootZcMode !== undefined || input.rootZcBaseAoVInertanceMmHgSec2PerMl !== undefined)
  ) {
    throw new Error("Legacy active-stress rollback cannot be composed with experimental root/Zc options.");
  }
  const rootZcMode = input.rootZcMode ?? defaultRootZcModeFor(mode);
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: rootZcMode,
    baseAoVInertanceMmHgSec2PerMl: rootZcMode === undefined || rootZcMode === MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE
      ? undefined
      : rootZcBaseAoVInertance(input),
  });
  if (mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE) {
    return {
      mode,
      claimBoundary: "legacy-active-stress-frozen-reference-rollback",
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

  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
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
    mode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE
    || mode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE
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
    const atrialRuntimeCandidateProviders = createLandAtrialRuntimeCandidateProviders({
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
    const runtimeAtrialProviders = mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE
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
        sourceArtifactId: phase5QArtifact.id,
        scenarioId: "phase2b-absolute-peak-ca",
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
    if (mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE) {
      return {
        mode,
        claimBoundary: "user0-staged-all-chamber-landatrial-default-no-clinical-validation",
        sourceProviderScope: "LV+RV+LA+RA",
        ...shared,
        sourceProviderIds: {
          LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
          RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
          LA: LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.LA,
          RA: LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS.RA,
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
          runtimeParameterPatch: { nodeOverrides: landAtrialRuntimeCandidateNodeOverrides() },
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
    if (mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE) {
      return {
        mode,
        claimBoundary: "all-chamber-land-default-candidate-evidence-no-runtime-flip",
        sourceProviderScope: "LV+RV+LA+RA-candidate",
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
    if (mode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE) {
      return {
        mode,
        claimBoundary: "user0-staged-lv-rv-land-default-no-clinical-validation",
        sourceProviderScope: "LV+RV",
        ...shared,
      };
    }
    return {
      mode,
      claimBoundary: "lv-rv-land-default-candidate-evidence-no-runtime-flip",
      sourceProviderScope: "LV+RV-candidate",
      ...shared,
    };
  }

  return {
    mode,
    claimBoundary: "user0-staged-lv-land-default-no-clinical-validation",
    sourceProviderScope: "LV-only",
    sourceProviderId: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    sourceProviderIds: { LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID },
    commitScheme: "BE",
    calciumMapping: {
      sourceArtifactId: phase5QArtifact.id,
      scenarioId: "phase2b-absolute-peak-ca",
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
  return mode === MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE
    || mode === MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE
    ? MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE
    : undefined;
}

function rootZcBaseAoVInertance(input: ResolveModelCoreRuntimeActiveSourceInput): number | undefined {
  return input.rootZcBaseAoVInertanceMmHgSec2PerMl
    ?? input.runtimeParams?.AoV_L
    ?? defaultParams().AoV_L;
}
