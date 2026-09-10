import type { RegisteredModelPresentationBatchV2, StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import type { ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";

/** Ephemeral observations of exact samples, never part of an exact checkpoint. */
export type PresentationAnalysisCollectorV1 = Readonly<{
  ingest(batch: RegisteredModelPresentationBatchV2): StudioSimulationAnalysisV2 | undefined;
}>;

export type PresentationAnalysisMethodV1 = Readonly<{
  methodId: string;
  requiredExactOutputIds: readonly string[];
  create(): PresentationAnalysisCollectorV1;
}>;

/** The composition root selects only methods pinned by the session's Surface. */
export type ResolvePresentationAnalysisMethodsV1 = (
  surface: ModelSurfaceReleaseManifestV1,
  exactRuntimeSpecification: unknown,
) => readonly PresentationAnalysisMethodV1[];
