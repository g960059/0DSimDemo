import { SAVED_MODEL_DOCUMENT_CATALOG_V1, resolveSavedModelDocumentIndexV1 } from "./SavedModelDocumentCatalogV1";
import qualified from "./packages/standard73-document-v2.index.json";

/** V2 only adds optional beat observations. Link to the original model/case
 * qualification, retaining its Surface ID and archive hash, not relabelling it
 * as a validation of those new observations (defined in the output picker). */
function documentationReferenceSurfaceV1(modelId: string | undefined, surfaceReleaseId: string | null | undefined) {
  return modelId === qualified.identity.modelId
    && surfaceReleaseId === "circleheart.main-wire.surface.static-anatomy.standard-73.workbench-v2"
    ? qualified.identity.surfaceReleaseId : surfaceReleaseId;
}

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
  limitationsTranslationKey: "modelLimitations.items" | "modelLimitations.standard71Items" | "modelLimitations.standard72Items" | "modelLimitations.staticAnatomyItems";
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

/** Returns the document's own immutable identity, including for explicit reuse. */
export function resolveRegisteredModelDocumentationV1(
  modelId: string | undefined, surfaceReleaseId: string | null | undefined, documentId?: string | null,
): RegisteredModelDocumentationIdentityV1 | null {
  const saved = resolveSavedModelDocumentIndexV1(modelId, documentationReferenceSurfaceV1(modelId, surfaceReleaseId), documentId);
  return saved ? { kind: "saved-model-document", modelId: saved.identity.modelId,
    surfaceReleaseId: saved.identity.surfaceReleaseId, surfaceSeriesId: saved.identity.surfaceSeriesId,
    documentId: saved.documentId } : null;
}

export function resolveRegisteredPresetDocumentationV1(modelId: string, surfaceReleaseId: string | null | undefined, presetId: string) {
  const referenceSurface = documentationReferenceSurfaceV1(modelId, surfaceReleaseId);
  const entry = SAVED_MODEL_DOCUMENT_CATALOG_V1.find(e => e.document.identity.modelId === modelId
    && e.document.identity.surfaceReleaseId === referenceSurface && e.document.identity.baselineId === presetId);
  return entry ? resolveRegisteredModelDocumentationV1(modelId, surfaceReleaseId, entry.document.documentId) : null;
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
