import { savedDocumentMatchesV1, type SavedModelDocumentV1 } from "./SavedModelDocumentV1";
import { resolveSavedModelDocumentIndexV1 } from "./SavedModelDocumentCatalogV1";

// Each package is a separate chunk. Adding historical documents must not make
// reading the current model download every earlier document and embedded font.
const loaders: Readonly<Record<string, () => Promise<SavedModelDocumentV1>>> = {
  "standard71-document-v1": () => import("./packages/standard71-document-v1.json").then(m => m.default as SavedModelDocumentV1),
  "standard72-document-v1": () => import("./packages/standard72-document-v1.json").then(m => m.default as SavedModelDocumentV1),
  ...(!import.meta.env.PROD ? {
    "hfref-static-case-document-v4": () => import("./packages/hfref-static-case-document-v4.json").then(m => m.default as SavedModelDocumentV1),
  } : {}),
};

export async function resolveSavedModelDocumentV1(modelId: string | undefined,
  surfaceReleaseId: string | null | undefined, documentId?: string | null): Promise<SavedModelDocumentV1 | null> {
  const index = resolveSavedModelDocumentIndexV1(modelId, surfaceReleaseId, documentId);
  if (!index) return null;
  const load = loaders[index.documentId];
  if (!load) throw new Error(`Missing saved document loader: ${index.documentId}`);
  const document = await load();
  if (!savedDocumentMatchesV1(document, modelId, surfaceReleaseId)
    || document.documentId !== index.documentId || document.contentSha256 !== index.contentSha256) {
    throw new Error(`Saved document does not match its registered index: ${index.documentId}`);
  }
  return document;
}
