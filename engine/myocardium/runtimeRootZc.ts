import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";

export const MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE =
  "root-zc-base-aortic-valve-inertance-v1" as const;
export const MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE =
  "root-zc-sourced-boundary-v1" as const;
export const MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID =
  "aortic-boundary-root-inertance-v1" as const;
export const MODELCORE_RUNTIME_ROOT_ZC_EFFECTIVE_INERTANCE_MULTIPLIER = 2 as const;

export type ModelCoreRuntimeRootZcMode =
  | typeof MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE
  | typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;

export type ResolveModelCoreRuntimeRootZcInput = {
  readonly mode?: ModelCoreRuntimeRootZcMode;
  readonly baseAoVInertanceMmHgSec2PerMl?: number;
};

export type ModelCoreRuntimeRootZcResolution =
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE;
      readonly mechanismId: null;
      readonly additionalAorticRootInertanceMmHgSec2PerMl: 0;
      readonly equivalentEffectiveAoVInertanceMultiple: 1;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
    }
  | {
      readonly mode: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE;
      readonly mechanismId: typeof MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID;
      readonly additionalAorticRootInertanceMmHgSec2PerMl: number;
      readonly equivalentEffectiveAoVInertanceMultiple:
        typeof MODELCORE_RUNTIME_ROOT_ZC_EFFECTIVE_INERTANCE_MULTIPLIER;
      readonly experimentalOptions: ModelCoreExperimentalOptions;
    };

export function resolveModelCoreRuntimeRootZc(
  input: ResolveModelCoreRuntimeRootZcInput = {},
): ModelCoreRuntimeRootZcResolution {
  const mode = input.mode ?? MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE;
  if (mode === MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE) {
    if (input.baseAoVInertanceMmHgSec2PerMl !== undefined) {
      throw new Error("Runtime root/Zc base AoV inertance is only valid for sourced boundary/root modes.");
    }
    return {
      mode,
      mechanismId: null,
      additionalAorticRootInertanceMmHgSec2PerMl: 0,
      equivalentEffectiveAoVInertanceMultiple: 1,
      experimentalOptions: {},
    };
  }

  const additional = normalizeBaseAoVInertance(input.baseAoVInertanceMmHgSec2PerMl);
  return {
    mode,
    mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
    additionalAorticRootInertanceMmHgSec2PerMl: additional,
    equivalentEffectiveAoVInertanceMultiple:
      MODELCORE_RUNTIME_ROOT_ZC_EFFECTIVE_INERTANCE_MULTIPLIER,
    experimentalOptions: {
      boundaryRootInertance: {
        mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
        additionalAorticRootInertanceMmHgSec2PerMl: additional,
      },
    },
  };
}

function normalizeBaseAoVInertance(value: number | undefined): number {
  if (value === undefined) {
    throw new Error("Runtime root/Zc sourced boundary/root mode requires explicit base AoV inertance.");
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Runtime root/Zc sourced boundary/root mode requires explicit finite positive base AoV inertance.");
  }
  return value;
}
