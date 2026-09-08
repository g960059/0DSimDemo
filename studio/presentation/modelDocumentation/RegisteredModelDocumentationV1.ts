import { SAVED_MODEL_DOCUMENT_CATALOG_V1, resolveSavedModelDocumentIndexV1 } from "./SavedModelDocumentCatalogV1";

export type RegisteredModelDocumentationIdentityV1 = Readonly<{
  kind: "saved-model-document";
  modelId: string;
  surfaceReleaseId: string;
  surfaceSeriesId: string;
  documentId: string;
}>;

export type RegisteredModelDisclosureV1 = Readonly<{
  documentation: RegisteredModelDocumentationIdentityV1 | null;
  badgeLabel: string;
  shortLabel: string | null;
  limitationsTranslationKey: "modelLimitations.items" | "modelLimitations.standard71Items" | "modelLimitations.standard72Items";
}>;

/** Historical document availability never admits an executable or baseline. */
export const REGISTERED_MODEL_DOCUMENTATION_OPTIONS_V1 = Object.freeze(
  SAVED_MODEL_DOCUMENT_CATALOG_V1.map(entry => ({
    label: entry.label,
    identity: { kind: "saved-model-document" as const, modelId: entry.document.identity.modelId,
      surfaceReleaseId: entry.document.identity.surfaceReleaseId, surfaceSeriesId: entry.document.identity.surfaceSeriesId,
      documentId: entry.document.documentId },
    candidate: entry.document.identity.releaseStatus === "local-candidate-not-registered",
  })),
);

/** Documentation requires its exact model and immutable Surface pair. */
export function resolveRegisteredModelDocumentationV1(
  modelId: string | undefined, surfaceReleaseId: string | null | undefined, documentId?: string | null,
): RegisteredModelDocumentationIdentityV1 | null {
  const saved = resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, documentId);
  return saved ? { kind: "saved-model-document", modelId: saved.identity.modelId,
    surfaceReleaseId: saved.identity.surfaceReleaseId, surfaceSeriesId: saved.identity.surfaceSeriesId,
    documentId: saved.documentId } : null;
}

/** Compact index shared by Workbench and Article Reader, without frozen prose. */
export function resolveRegisteredModelDisclosureV1(
  modelId: string | undefined, surfaceReleaseId: string | null | undefined,
): RegisteredModelDisclosureV1 {
  const documentation = resolveRegisteredModelDocumentationV1(modelId, surfaceReleaseId);
  const entry = SAVED_MODEL_DOCUMENT_CATALOG_V1.find(e => e.document.documentId === documentation?.documentId);
  return documentation && entry
    ? Object.freeze({ documentation, badgeLabel: entry.badgeLabel,
        shortLabel: entry.document.identity.title, limitationsTranslationKey: entry.limitationsTranslationKey })
    : Object.freeze({ documentation: null, badgeLabel: "MW V3", shortLabel: null,
        limitationsTranslationKey: "modelLimitations.items" });
}
