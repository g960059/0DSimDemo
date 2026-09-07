import standard71 from "./packages/standard71-document-v1.json";
import { savedDocumentMatchesV1, type SavedModelDocumentV1 } from "./SavedModelDocumentV1";

// Loaded with the documentation route only, not with workbench info/labels.
export const SAVED_MODEL_DOCUMENTS_V1: readonly SavedModelDocumentV1[] = [standard71 as SavedModelDocumentV1];
export function resolveSavedModelDocumentV1(modelId: string | undefined, surfaceReleaseId: string | null | undefined) {
  return SAVED_MODEL_DOCUMENTS_V1.find(document => savedDocumentMatchesV1(document, modelId, surfaceReleaseId)) ?? null;
}
