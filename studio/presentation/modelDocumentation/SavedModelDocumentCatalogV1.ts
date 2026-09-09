import standard71 from "./packages/standard71-document-v1.index.json";
import standard72 from "./packages/standard72-document-v1.index.json";
import hfrefCase from "./packages/hfref-static-case-document-v4.index.json";
import selection from "@/data/model-baselines/current-baseline-selection-v1.json";
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
}, ...(!import.meta.env.PROD ? [{
  document: hfrefCase as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "HFrEF · 慢性左室拡大型", badgeLabel: "HFrEF",
  limitationsTranslationKey: "modelLimitations.items" as const,
  caseOnly: true as const,
}] : [])] as const;
export function resolveSavedModelDocumentIndexV1(modelId: string | undefined, surfaceReleaseId: string | null | undefined,
  documentId?: string | null) {
  const selected = !documentId && modelId === selection.modelId && surfaceReleaseId === selection.surfaceReleaseId;
  const requested = documentId || (selected ? selection.document.documentId : undefined);
  const found = SAVED_MODEL_DOCUMENT_CATALOG_V1.find(entry =>
    savedDocumentMatchesV1(entry.document, modelId, surfaceReleaseId)
      // A disease-case explanation is never substituted for a model's baseline.
      && (!("caseOnly" in entry) || !!requested)
      && (!requested || entry.document.documentId === requested))?.document ?? null;
  // An absent or mismatched selected archive must not silently display an older baseline.
  if (selected && (found?.contentSha256 !== selection.document.contentSha256
    || found.identity.baselineId !== selection.baselineId)) return null;
  return found;
}
