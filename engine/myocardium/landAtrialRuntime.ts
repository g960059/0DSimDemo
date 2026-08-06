import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import type { OverrideBlock } from "@/engine/protocol";
import {
  LANDATRIAL_LA_SOURCE_PROVIDER_ID,
  LANDATRIAL_PARAMETER_PACK,
  LANDATRIAL_RA_SOURCE_PROVIDER_ID,
  createAtrialLandSourceProvider,
} from "@/engine/myocardium/atrialLandContract";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import { MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1 } from "@/engine/myocardium/runtimeLandCalciumContract";

export const LANDATRIAL_RUNTIME_ID = "landatrial-runtime-v1" as const;

const LANDATRIAL_RUNTIME_BASE_SOURCE_PROVIDER_IDS = {
  LA: `${LANDATRIAL_LA_SOURCE_PROVIDER_ID}:runtime-v1`,
  RA: `${LANDATRIAL_RA_SOURCE_PROVIDER_ID}:runtime-v1`,
} as const;

export const LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS = {
  LA: `${LANDATRIAL_RUNTIME_BASE_SOURCE_PROVIDER_IDS.LA}:signed-atrial-pressure-adapter`,
  RA: `${LANDATRIAL_RUNTIME_BASE_SOURCE_PROVIDER_IDS.RA}:signed-atrial-pressure-adapter`,
} as const;

export const LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES = {
  LA: { avPlaneGainMl: 22 },
  RA: { avPlaneGainMl: 26 },
} as const;

export type LandAtrialRuntimeInstrumentation = {
  readonly LA: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RA: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export function createLandAtrialRuntimeInstrumentation(): LandAtrialRuntimeInstrumentation {
  return {
    LA: createModelCoreLand2017LvSourceProviderInstrumentation(),
    RA: createModelCoreLand2017LvSourceProviderInstrumentation(),
  };
}

export function landAtrialRuntimeNodeOverrides(): OverrideBlock {
  return {
    LA: { active: { ...LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES.LA } },
    RA: { active: { ...LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES.RA } },
  };
}

export function createLandAtrialRuntimeProviders(
  instrumentation: LandAtrialRuntimeInstrumentation = createLandAtrialRuntimeInstrumentation(),
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  const calciumScale = MODELCORE_RUNTIME_LAND_CALCIUM_CONTRACT_V1.calciumScale;
  return {
    LA: createAtrialLandSourceProvider("LA", instrumentation.LA, {
      commitScheme: "BE",
      sourceProviderId: LANDATRIAL_RUNTIME_BASE_SOURCE_PROVIDER_IDS.LA,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      parameterSet: LANDATRIAL_PARAMETER_PACK.chamberParameterSets.LA,
      signedPressureAdapter: true,
    }),
    RA: createAtrialLandSourceProvider("RA", instrumentation.RA, {
      commitScheme: "BE",
      sourceProviderId: LANDATRIAL_RUNTIME_BASE_SOURCE_PROVIDER_IDS.RA,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      parameterSet: LANDATRIAL_PARAMETER_PACK.chamberParameterSets.RA,
      signedPressureAdapter: true,
    }),
  };
}
