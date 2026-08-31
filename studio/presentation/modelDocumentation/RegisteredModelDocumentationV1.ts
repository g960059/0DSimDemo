import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v1.json";
import selectedAorticOutflowStandard66SurfaceV2 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind: "main-wire-selected-aortic-outflow-standard66";
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
    | "modelLimitations.standard66Items";
}>;

const STANDARD66_DOCUMENTATION_SURFACES_V1 = Object.freeze([
  selectedAorticOutflowStandard66SurfaceV1,
  selectedAorticOutflowStandard66SurfaceV2,
]);
const STANDARD66_DOCUMENTATION_IDENTITIES_V1 = Object.freeze(
  STANDARD66_DOCUMENTATION_SURFACES_V1.map((surface) => Object.freeze({
    kind: "main-wire-selected-aortic-outflow-standard66" as const,
    modelId:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
    surfaceReleaseId: surface.surfaceReleaseId,
    surfaceSeriesId: surface.surfaceSeriesId,
  })),
);

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
  const identity = STANDARD66_DOCUMENTATION_IDENTITIES_V1.find(
    (candidate) =>
      candidate.modelId === modelId
      && candidate.surfaceReleaseId === surfaceReleaseId,
  );
  if (identity === undefined) return null;
  const surface = STANDARD66_DOCUMENTATION_SURFACES_V1.find(
    (candidate) => candidate.surfaceReleaseId === identity.surfaceReleaseId,
  );
  if (
    surface === undefined
    || surface.schemaId !== STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID
    || surface.modelFamilyId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3
    || surface.surfaceReleaseId
      !== identity.surfaceReleaseId
    || surface.surfaceSeriesId
      !== identity.surfaceSeriesId
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
  return documentation === null
    ? Object.freeze({
        documentation: null,
        badgeLabel: "MW V3",
        shortLabel: null,
        limitationsTranslationKey: "modelLimitations.items" as const,
      })
    : Object.freeze({
        documentation,
        badgeLabel: "MW 66",
        shortLabel: "Main Wire Standard 66",
        limitationsTranslationKey:
          "modelLimitations.standard66Items" as const,
      });
}
