import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import type { OverrideBlock } from "@/engine/protocol";
import {
  LANDATRIAL_SHADOW_LA_SOURCE_PROVIDER_ID,
  LANDATRIAL_SHADOW_PARAMETER_PACK,
  LANDATRIAL_SHADOW_RA_SOURCE_PROVIDER_ID,
  createAtrialLandShadowSourceProvider,
} from "@/engine/myocardium/atrialLandShadow";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";

export const LANDATRIAL_RUNTIME_CANDIDATE_PHASE5BK_ID =
  "landatrial-shadow-phase5bk-runtime-candidate-v1" as const;
export const LANDATRIAL_RUNTIME_CANDIDATE_CLAIM_BOUNDARY =
  "landatrial-runtime-candidate-user0-staged-default-no-physiology-acceptance" as const;

const LANDATRIAL_RUNTIME_CANDIDATE_BASE_SOURCE_PROVIDER_IDS = {
  LA: `${LANDATRIAL_SHADOW_LA_SOURCE_PROVIDER_ID}:phase5bk-runtime-candidate`,
  RA: `${LANDATRIAL_SHADOW_RA_SOURCE_PROVIDER_ID}:phase5bk-runtime-candidate`,
} as const;

export const LANDATRIAL_RUNTIME_CANDIDATE_SOURCE_PROVIDER_IDS = {
  LA: `${LANDATRIAL_RUNTIME_CANDIDATE_BASE_SOURCE_PROVIDER_IDS.LA}:signed-atrial-pressure-adapter`,
  RA: `${LANDATRIAL_RUNTIME_CANDIDATE_BASE_SOURCE_PROVIDER_IDS.RA}:signed-atrial-pressure-adapter`,
} as const;

export const LANDATRIAL_RUNTIME_CANDIDATE_ACTIVE_OVERRIDES = {
  LA: { avPlaneGainMl: 22 },
  RA: { avPlaneGainMl: 26 },
} as const;

export type LandAtrialRuntimeCandidateInstrumentation = {
  readonly LA: ModelCoreLand2017LvSourceProviderInstrumentation;
  readonly RA: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export function createLandAtrialRuntimeCandidateInstrumentation():
LandAtrialRuntimeCandidateInstrumentation {
  return {
    LA: createModelCoreLand2017LvSourceProviderInstrumentation(),
    RA: createModelCoreLand2017LvSourceProviderInstrumentation(),
  };
}

export function landAtrialRuntimeCandidateNodeOverrides(): OverrideBlock {
  return {
    LA: { active: { ...LANDATRIAL_RUNTIME_CANDIDATE_ACTIVE_OVERRIDES.LA } },
    RA: { active: { ...LANDATRIAL_RUNTIME_CANDIDATE_ACTIVE_OVERRIDES.RA } },
  };
}

export function createLandAtrialRuntimeCandidateProviders(
  instrumentation: LandAtrialRuntimeCandidateInstrumentation =
    createLandAtrialRuntimeCandidateInstrumentation(),
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  return {
    LA: createAtrialLandShadowSourceProvider("LA", instrumentation.LA, {
      commitScheme: "BE",
      sourceProviderId: LANDATRIAL_RUNTIME_CANDIDATE_BASE_SOURCE_PROVIDER_IDS.LA,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      parameterSet: LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.LA,
      signedPressureAdapter: true,
    }),
    RA: createAtrialLandShadowSourceProvider("RA", instrumentation.RA, {
      commitScheme: "BE",
      sourceProviderId: LANDATRIAL_RUNTIME_CANDIDATE_BASE_SOURCE_PROVIDER_IDS.RA,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      parameterSet: LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.RA,
      signedPressureAdapter: true,
    }),
  };
}
