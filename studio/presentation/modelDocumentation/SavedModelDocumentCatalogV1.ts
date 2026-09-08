import standard71 from "./packages/standard71-document-v1.index.json";
import standard72 from "./packages/standard72-document-v1.index.json";
import { savedDocumentMatchesV1, type SavedModelDocumentV1 } from "./SavedModelDocumentV1";

// This local document catalog says nothing about executable-model admission.
// Adding a successor adds data; it does not relabel an earlier document.
export const SAVED_MODEL_DOCUMENT_CATALOG_V1 = [{
  document: standard72 as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 72", badgeLabel: "MW 72",
  limitationsTranslationKey: "modelLimitations.standard72Items" as const,
}, {
  document: standard71 as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 71", badgeLabel: "MW 71",
  limitationsTranslationKey: "modelLimitations.standard71Items" as const,
}] as const;
export function resolveSavedModelDocumentIndexV1(modelId: string | undefined, surfaceReleaseId: string | null | undefined) {
  return SAVED_MODEL_DOCUMENT_CATALOG_V1.find(entry => savedDocumentMatchesV1(entry.document, modelId, surfaceReleaseId))?.document ?? null;
}
