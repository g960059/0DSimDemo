import {
  LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES,
  LANDATRIAL_RUNTIME_ID,
  LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS,
} from "@/engine/myocardium/landAtrialRuntime";
import { LANDATRIAL_PARAMETER_PACK_ID } from "@/engine/myocardium/atrialLandContract";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
} from "@/engine/myocardium/runtimeActiveSource";
import { MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE } from "@/engine/myocardium/runtimeRootZc";

export const LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID =
  "landatrial-runtime-la22-ra26-v1" as const;

export const LANDATRIAL_RUNTIME_CONTRACT_V1 = deepFreeze({
  contractId: "landatrial-runtime-contract-v1",
  selectedConfigurationId: LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID,
  runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
  rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  sourceProviderIds: {
    LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
    RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
    LA: LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.LA,
    RA: LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.RA,
  },
  atrialParameterPackId: LANDATRIAL_PARAMETER_PACK_ID,
  atrialRuntimeId: LANDATRIAL_RUNTIME_ID,
  atrialActiveOverrides: LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES,
} as const);

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (entry && typeof entry === "object" && !Object.isFrozen(entry)) deepFreeze(entry);
  }
  return value;
}
