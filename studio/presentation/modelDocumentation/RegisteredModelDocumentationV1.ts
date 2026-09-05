import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import algebraicPulmonaryRootStandard70SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import algebraicPulmonaryRootStandard70SurfaceV2 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV2";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind: "main-wire-algebraic-pulmonary-root-standard70";
  modelId: string;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
}>;

export type RegisteredModelDisclosureV1 = Readonly<{
  documentation: RegisteredModelDocumentationIdentityV1 | null;
  badgeLabel: string;
  shortLabel: string | null;
  limitationsTranslationKey: "modelLimitations.items" | "modelLimitations.standard70Items";
}>;

/** Documentation requires the exact model and immutable Surface release pair. */
export function resolveRegisteredModelDocumentationV1(
  modelId: string | undefined,
  surfaceReleaseId: string | null | undefined,
): RegisteredModelDocumentationIdentityV1 | null {
  const surface = [algebraicPulmonaryRootStandard70SurfaceV1,
    algebraicPulmonaryRootStandard70SurfaceV2]
    .find((candidate) => candidate.surfaceReleaseId === surfaceReleaseId);
  if (
    modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    || surface === undefined
    || surface.schemaId !== STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID
    || surface.modelFamilyId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
  ) {
    return null;
  }
  return Object.freeze({
    kind: "main-wire-algebraic-pulmonary-root-standard70" as const,
    modelId,
    surfaceReleaseId: surface.surfaceReleaseId,
    surfaceSeriesId: surface.surfaceSeriesId,
  });
}

/** One presentation resolver shared by Workbench and Article Reader. */
export function resolveRegisteredModelDisclosureV1(
  modelId: string | undefined,
  surfaceReleaseId: string | null | undefined,
): RegisteredModelDisclosureV1 {
  const documentation = resolveRegisteredModelDocumentationV1(modelId, surfaceReleaseId);
  return documentation === null
    ? Object.freeze({
        documentation: null,
        badgeLabel: "MW V3",
        shortLabel: null,
        limitationsTranslationKey: "modelLimitations.items" as const,
      })
    : Object.freeze({
        documentation,
        badgeLabel: "MW 70",
        shortLabel: "Main Wire Standard 70",
        limitationsTranslationKey: "modelLimitations.standard70Items" as const,
      });
}
