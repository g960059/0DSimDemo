import {
  resolveMainWireAnalysisMethodsForSurfaceV1,
  type ResolvedMainWireAnalysisMethodsV1,
} from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import type {
  ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";

/** Union point for analysis method packs shipped by this client release. */
export type RegisteredAnalysisMethodsV1 = ResolvedMainWireAnalysisMethodsV1;

/**
 * Resolves code-owned method packs against one Surface. Adding another model
 * family extends this registry; generic loaders never import that family.
 */
export function resolveRegisteredAnalysisMethodsV1(
  surface: ModelSurfaceReleaseManifestV1,
  exactOutputs: readonly Readonly<{ outputId: string }>[],
): RegisteredAnalysisMethodsV1 {
  return resolveMainWireAnalysisMethodsForSurfaceV1(surface, exactOutputs);
}
