import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import algebraicPulmonaryRootStandard70SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import { SAVED_MODEL_DOCUMENT_CATALOG_V1, resolveSavedModelDocumentIndexV1 } from "./SavedModelDocumentCatalogV1";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind: "main-wire-algebraic-pulmonary-root-standard70" | "saved-model-document";
  modelId: string;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
}>;

export type RegisteredModelDisclosureV1 = Readonly<{
  documentation: RegisteredModelDocumentationIdentityV1 | null;
  badgeLabel: string;
  shortLabel: string | null;
  limitationsTranslationKey: "modelLimitations.items" | "modelLimitations.standard70Items" | "modelLimitations.standard71Items";
}>;

const STANDARD70_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-algebraic-pulmonary-root-standard70" as const,
  modelId: MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  surfaceReleaseId: algebraicPulmonaryRootStandard70SurfaceV1.surfaceReleaseId,
  surfaceSeriesId: algebraicPulmonaryRootStandard70SurfaceV1.surfaceSeriesId,
});

/** Document availability never admits an executable model or its baseline. */
export const REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1 = Object.freeze([
  ...SAVED_MODEL_DOCUMENT_CATALOG_V1.map(entry => ({
    label: entry.label,
    identity: { kind: "saved-model-document" as const, modelId: entry.document.identity.modelId,
      surfaceReleaseId: entry.document.identity.surfaceReleaseId, surfaceSeriesId: entry.document.identity.surfaceSeriesId },
    candidate: entry.document.identity.releaseStatus === "local-candidate-not-registered",
  })),
  { label: "Standard 70", identity: STANDARD70_DOCUMENTATION_IDENTITY_V1, candidate: false },
]);

/** Documentation requires the exact model and immutable Surface release pair. */
export function resolveRegisteredModelDocumentationV1(
  modelId: string | undefined,
  surfaceReleaseId: string | null | undefined,
): RegisteredModelDocumentationIdentityV1 | null {
  const saved = resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId);
  if (saved) return { kind: "saved-model-document", modelId: saved.identity.modelId,
    surfaceReleaseId: saved.identity.surfaceReleaseId, surfaceSeriesId: saved.identity.surfaceSeriesId };
  const identity = STANDARD70_DOCUMENTATION_IDENTITY_V1;
  const surface = algebraicPulmonaryRootStandard70SurfaceV1;
  if (
    modelId !== identity.modelId
    || surfaceReleaseId !== identity.surfaceReleaseId
    || surface.schemaId !== STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID
    || surface.modelFamilyId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
    || surface.surfaceSeriesId !== identity.surfaceSeriesId
  ) {
    return null;
  }
  return identity;
}

/** One presentation resolver shared by Workbench and Article Reader. */
export function resolveRegisteredModelDisclosureV1(
  modelId: string | undefined,
  surfaceReleaseId: string | null | undefined,
): RegisteredModelDisclosureV1 {
  const documentation = resolveRegisteredModelDocumentationV1(modelId, surfaceReleaseId);
  if (documentation?.kind === "saved-model-document") {
    const entry = SAVED_MODEL_DOCUMENT_CATALOG_V1.find(e => e.document.identity.modelId === modelId
      && e.document.identity.surfaceReleaseId === surfaceReleaseId)!;
    return Object.freeze({ documentation, badgeLabel: entry.badgeLabel,
      shortLabel: entry.document.identity.title, limitationsTranslationKey: entry.limitationsTranslationKey });
  }
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
