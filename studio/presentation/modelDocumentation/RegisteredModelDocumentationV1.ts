import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/modelSurface";
import selectedAorticOutflowStandard66SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-selected-aortic-outflow-standard66-v2.json";
import algebraicProximalRootsStandard67SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-algebraic-proximal-roots-standard67-v1.json";
import roundedEjectionStandard68SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionSurfaceV1";
import qualifiedBaselineStandard69SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineSurfaceV1";
import algebraicPulmonaryRootStandard70SurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import { SAVED_MODEL_DOCUMENT_CATALOG_V1, resolveSavedModelDocumentIndexV1 } from "./SavedModelDocumentCatalogV1";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind:
    | "main-wire-selected-aortic-outflow-standard66"
    | "main-wire-algebraic-proximal-roots-standard67"
    | "main-wire-rounded-ejection-standard68"
    | "main-wire-qualified-baseline-standard69"
    | "main-wire-algebraic-pulmonary-root-standard70"
    | "saved-model-document";
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
    | "modelLimitations.standard67Items"
    | "modelLimitations.standard68Items"
    | "modelLimitations.standard70Items"
    | "modelLimitations.standard71Items";
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

const STANDARD68_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-rounded-ejection-standard68" as const,
  modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  surfaceReleaseId: roundedEjectionStandard68SurfaceV1.surfaceReleaseId,
  surfaceSeriesId: roundedEjectionStandard68SurfaceV1.surfaceSeriesId,
});

const STANDARD69_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-qualified-baseline-standard69" as const,
  modelId: MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  surfaceReleaseId: qualifiedBaselineStandard69SurfaceV1.surfaceReleaseId,
  surfaceSeriesId: qualifiedBaselineStandard69SurfaceV1.surfaceSeriesId,
});

const STANDARD70_DOCUMENTATION_IDENTITY_V1 = Object.freeze({
  kind: "main-wire-algebraic-pulmonary-root-standard70" as const,
  modelId:
    MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  surfaceReleaseId:
    algebraicPulmonaryRootStandard70SurfaceV1.surfaceReleaseId,
  surfaceSeriesId:
    algebraicPulmonaryRootStandard70SurfaceV1.surfaceSeriesId,
});

/** Availability of documentation is not admission of a runnable model. */
export const REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1 = Object.freeze([
  ...SAVED_MODEL_DOCUMENT_CATALOG_V1.map(entry => ({ label: entry.label,
    identity: { kind: "saved-model-document" as const, modelId: entry.document.identity.modelId,
      surfaceReleaseId: entry.document.identity.surfaceReleaseId, surfaceSeriesId: entry.document.identity.surfaceSeriesId },
    candidate: entry.document.identity.releaseStatus === "local-candidate-not-registered" })),
  { label: "Standard 70", identity: STANDARD70_DOCUMENTATION_IDENTITY_V1, candidate: false },
  { label: "Standard 69", identity: STANDARD69_DOCUMENTATION_IDENTITY_V1, candidate: false },
  { label: "Standard 68", identity: STANDARD68_DOCUMENTATION_IDENTITY_V1, candidate: false },
  { label: "Standard 67", identity: STANDARD67_DOCUMENTATION_IDENTITY_V1, candidate: false },
  { label: "Standard 66", identity: STANDARD66_DOCUMENTATION_IDENTITY_V1, candidate: false },
]);

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
  let identity: RegisteredModelDocumentationIdentityV1 | null = null;
  const saved = resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId);
  if (saved) return { kind: "saved-model-document", modelId: saved.identity.modelId,
    surfaceReleaseId: saved.identity.surfaceReleaseId, surfaceSeriesId: saved.identity.surfaceSeriesId };
  if (
    modelId === STANDARD66_DOCUMENTATION_IDENTITY_V1.modelId
    && surfaceReleaseId
      === STANDARD66_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
  ) {
    identity = STANDARD66_DOCUMENTATION_IDENTITY_V1;
  } else if (
    modelId === STANDARD67_DOCUMENTATION_IDENTITY_V1.modelId
    && surfaceReleaseId
      === STANDARD67_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
  ) {
    identity = STANDARD67_DOCUMENTATION_IDENTITY_V1;
  } else if (
    modelId === STANDARD68_DOCUMENTATION_IDENTITY_V1.modelId
    && surfaceReleaseId
      === STANDARD68_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
  ) {
    identity = STANDARD68_DOCUMENTATION_IDENTITY_V1;
  } else if (
    modelId === STANDARD69_DOCUMENTATION_IDENTITY_V1.modelId
    && surfaceReleaseId
      === STANDARD69_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
  ) {
    identity = STANDARD69_DOCUMENTATION_IDENTITY_V1;
  } else if (
    modelId === STANDARD70_DOCUMENTATION_IDENTITY_V1.modelId
    && surfaceReleaseId
      === STANDARD70_DOCUMENTATION_IDENTITY_V1.surfaceReleaseId
  ) {
    identity = STANDARD70_DOCUMENTATION_IDENTITY_V1;
  }
  if (identity === null) return null;
  const surface = identity.kind
      === "main-wire-algebraic-pulmonary-root-standard70"
    ? algebraicPulmonaryRootStandard70SurfaceV1
    : identity.kind === "main-wire-qualified-baseline-standard69"
      ? qualifiedBaselineStandard69SurfaceV1
    : identity.kind === "main-wire-rounded-ejection-standard68"
      ? roundedEjectionStandard68SurfaceV1
    : identity.kind === "main-wire-algebraic-proximal-roots-standard67"
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
  if (documentation.kind === "saved-model-document") {
    const entry = SAVED_MODEL_DOCUMENT_CATALOG_V1.find(e => e.document.identity.modelId === modelId
      && e.document.identity.surfaceReleaseId === surfaceReleaseId)!;
    return Object.freeze({ documentation, badgeLabel: entry.badgeLabel, shortLabel: entry.document.identity.title,
      limitationsTranslationKey: entry.limitationsTranslationKey });
  }
  if (documentation.kind === "main-wire-rounded-ejection-standard68") {
    return Object.freeze({
      documentation,
      badgeLabel: "MW 68",
      shortLabel: "Main Wire Standard 68",
      limitationsTranslationKey:
        "modelLimitations.standard68Items" as const,
    });
  }
  if (documentation.kind === "main-wire-qualified-baseline-standard69") {
    return Object.freeze({
      documentation,
      badgeLabel: "MW 69",
      shortLabel: "Main Wire Standard 69",
      limitationsTranslationKey:
        "modelLimitations.standard68Items" as const,
    });
  }
  if (
    documentation.kind === "main-wire-algebraic-pulmonary-root-standard70"
  ) {
    return Object.freeze({
      documentation,
      badgeLabel: "MW 70",
      shortLabel: "Main Wire Standard 70",
      limitationsTranslationKey:
        "modelLimitations.standard70Items" as const,
    });
  }
  if (documentation.kind === "main-wire-algebraic-proximal-roots-standard67") {
    return Object.freeze({
      documentation,
      badgeLabel: "MW 67",
      shortLabel: "Main Wire Standard 67",
      limitationsTranslationKey:
        "modelLimitations.standard67Items" as const,
    });
  }
  return Object.freeze({
    documentation,
    badgeLabel: "MW 66",
    shortLabel: "Main Wire Standard 66",
    limitationsTranslationKey:
      "modelLimitations.standard66Items" as const,
  });
}
