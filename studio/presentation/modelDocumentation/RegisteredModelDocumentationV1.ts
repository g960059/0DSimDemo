import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import algebraicProximalRootsStandard67SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-algebraic-proximal-roots-standard67-v1.json";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind:
    | "main-wire-selected-aortic-outflow-standard66"
    | "main-wire-algebraic-proximal-roots-standard67";
  modelId: string;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
}>;

export type RegisteredModelDisclosureV1 = Readonly<{
  documentation: RegisteredModelDocumentationIdentityV1 | null;
  badgeLabel: string;
  shortLabel: string | null;
  limitationsTranslationKey:
    | "modelLimitations.items"
    | "modelLimitations.standard66Items"
    | "modelLimitations.standard67Items";
}>;

const STANDARD66_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-selected-aortic-outflow-standard66" as const,
  modelId:
    MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
  surfaceReleaseId:
    selectedAorticOutflowStandard66SurfaceV1.surfaceReleaseId,
  surfaceSeriesId:
    selectedAorticOutflowStandard66SurfaceV1.surfaceSeriesId,
});

const STANDARD67_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-algebraic-proximal-roots-standard67" as const,
  modelId:
    MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  surfaceReleaseId:
    algebraicProximalRootsStandard67SurfaceV1.surfaceReleaseId,
  surfaceSeriesId:
    algebraicProximalRootsStandard67SurfaceV1.surfaceSeriesId,
});

/**
 * Client-local availability registry for model documentation.
 *
 * Documentation is presentation, not persisted model state. Resolution still
 * requires the exact model and immutable Surface release pair so an AoP label
 * from one Surface can never be documented against another release.
 */
export function resolveRegisteredModelDocumentationV1(
  modelId: string | undefined,
  surfaceReleaseId: string | null | undefined,
): RegisteredModelDocumentationIdentityV1 | null {
  const identity = modelId === STANDARD66_DOCUMENTATION_IDENTITY_V1.modelId
      && surfaceReleaseId
        === STANDARD66_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
    ? STANDARD66_DOCUMENTATION_IDENTITY_V1
    : modelId === STANDARD67_DOCUMENTATION_IDENTITY_V1.modelId
        && surfaceReleaseId
          === STANDARD67_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
      ? STANDARD67_DOCUMENTATION_IDENTITY_V1
      : null;
  if (identity === null) return null;
  const surface = identity.kind
      === "main-wire-algebraic-proximal-roots-standard67"
    ? algebraicProximalRootsStandard67SurfaceV1
    : selectedAorticOutflowStandard66SurfaceV1;
  if (
    surface.schemaId !== STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID
    || surface.modelFamilyId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
    || surface.surfaceReleaseId !== identity.surfaceReleaseId
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
  const documentation = resolveRegisteredModelDocumentationV1(
    modelId,
    surfaceReleaseId,
  );
  if (documentation === null) {
    return Object.freeze({
      documentation: null,
      badgeLabel: "MW V3",
      shortLabel: null,
      limitationsTranslationKey: "modelLimitations.items" as const,
    });
  }
  return documentation.kind === "main-wire-algebraic-proximal-roots-standard67"
    ? Object.freeze({
        documentation,
        badgeLabel: "MW 67",
        shortLabel: "Main Wire Standard 67",
        limitationsTranslationKey:
          "modelLimitations.standard67Items" as const,
      })
    : Object.freeze({
        documentation,
        badgeLabel: "MW 66",
        shortLabel: "Main Wire Standard 66",
        limitationsTranslationKey:
          "modelLimitations.standard66Items" as const,
      });
}
