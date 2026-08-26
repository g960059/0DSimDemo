import type {
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelKernelManifestV3,
  MaterializedModelSurfaceV1,
  ModelSurfaceReleaseManifestV1,
  StudioReleaseStageV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";

export type ModelSurfacePresentationBundleV1<AnalysisMethods> = Readonly<{
  identity: Readonly<{
    modelFamilyId: string;
    surfaceReleaseId: string;
    surfaceSeriesId: string;
    stage: StudioReleaseStageV1;
  }>;
  contract: ModelContractV2;
  catalog: MaterializedModelSurfaceV1;
  analysis: AnalysisMethods;
}>;

export type ModelSurfaceRuntimeBundleV1<AnalysisMethods> = Readonly<{
  exactContract: ModelContractV2;
  contract: ModelContractV2;
  catalog: MaterializedModelSurfaceV1;
  analysis: AnalysisMethods;
}>;

/** Shared Worker/client materialization before client-only lifecycle metadata. */
export function materializeModelSurfaceV1<
  AnalysisMethods extends Readonly<{ capabilities: readonly string[] }>,
>(
  input: Readonly<{
    kernel: ExactModelKernelManifestV3;
    surfaceRelease: ModelSurfaceReleaseManifestV1;
    analysis: AnalysisMethods;
  }>,
): ModelSurfaceRuntimeBundleV1<AnalysisMethods> {
  const composed = composeStandardModelContractV1(
    input.kernel,
    input.surfaceRelease,
    input.analysis.capabilities,
  );
  return Object.freeze({
    exactContract: composed.exactContract,
    contract: composed.contract,
    catalog: composed.surface,
    analysis: input.analysis,
  });
}

/**
 * Materializes one exact model and one immutable Surface as a single client
 * presentation authority. Analysis selection and exposed catalogs therefore
 * cannot be accidentally mixed across Surface releases.
 */
export function composeModelSurfacePresentationBundleV1<
  AnalysisMethods extends Readonly<{ capabilities: readonly string[] }>,
>(
  input: Readonly<{
    kernel: ExactModelKernelManifestV3;
    surfaceRelease: ModelSurfaceReleaseManifestV1;
    stage: StudioReleaseStageV1;
    analysis: AnalysisMethods;
  }>,
): ModelSurfacePresentationBundleV1<AnalysisMethods> {
  const materialized = materializeModelSurfaceV1(input);
  return Object.freeze({
    identity: Object.freeze({
      modelFamilyId: input.surfaceRelease.modelFamilyId,
      surfaceReleaseId: input.surfaceRelease.surfaceReleaseId,
      surfaceSeriesId: input.surfaceRelease.surfaceSeriesId,
      stage: input.stage,
    }),
    contract: materialized.contract,
    catalog: materialized.catalog,
    analysis: materialized.analysis,
  });
}
