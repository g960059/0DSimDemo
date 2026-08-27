import {
  resolveMainWireAnalysisMethodsForSurfaceV1,
  type ResolvedMainWireAnalysisMethodsV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type {
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from
  "@/domain/model/MainWireStandardIdentityV1";

/** Union point for analysis method packs shipped by this client release. */
export type RegisteredAnalysisMethodsV1 = ResolvedMainWireAnalysisMethodsV1;

/**
 * Resolves code-owned method packs against one Surface. Adding another model
 * family extends this registry; generic loaders never import that family.
 */
export function resolveRegisteredAnalysisMethodsV1(
  surface: ModelSurfaceReleaseManifestV1,
): RegisteredAnalysisMethodsV1 {
  if (
    surface.modelFamilyId === MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
  ) {
    return resolveMainWireAnalysisMethodsForSurfaceV1(surface);
  }
  throw new Error(
    `No analysis method registry is available for model family ${surface.modelFamilyId}`,
  );
}
