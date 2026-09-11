import standard71 from "./packages/standard71-document-v1.index.json";
import standard72 from "./packages/standard72-document-v1.index.json";
import hfrefCase from "./packages/hfref-static-case-document-v4.index.json";
import standard73 from "./packages/standard73-document-v2.index.json";
import standard73Hfref from "./packages/standard73-hfref-document-v2.index.json";
import standard73AsHigh from "./packages/standard73-as-high-gradient-document-v1.index.json";
import standard73AsLow from "./packages/standard73-as-low-flow-document-v1.index.json";
import selection from "@/data/model-baselines/current-baseline-selection-v1.json";
import { savedDocumentMatchesV1, type SavedModelDocumentV1 } from "./SavedModelDocumentV1";

// This local document catalog says nothing about executable-model admission.
// Adding a successor adds data; it does not relabel an earlier document.
export const SAVED_MODEL_DOCUMENT_CATALOG_V1 = [{
  document: standard73 as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 73", badgeLabel: "MW 73",
  limitationsTranslationKey: "modelLimitations.staticAnatomyItems" as const,
}, {
  document: standard73Hfref as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 73 · HFrEF", badgeLabel: "MW 73", modelLabel: "Standard 73",
  limitationsTranslationKey: "modelLimitations.staticAnatomyItems" as const, caseOnly: true as const,
}, {
  document: standard73AsHigh as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 73 · AS high gradient", badgeLabel: "MW 73", modelLabel: "Standard 73",
  limitationsTranslationKey: "modelLimitations.staticAnatomyItems" as const, caseOnly: true as const, activeCase: true as const,
  presetLabel: { ja: "AS · 弁狭窄のみ・高勾配", en: "AS · valve-only high gradient" },
  summary: { ja: "baselineから弁口面積だけを小さくした、圧負荷の比較例。", en: "A pressure-load comparison changing only the baseline valve area." },
}, {
  document: standard73AsLow as Pick<SavedModelDocumentV1, "schemaId" | "documentId" | "identity" | "contentSha256">,
  label: "Standard 73 · AS low flow", badgeLabel: "MW 73", modelLabel: "Standard 73",
  limitationsTranslationKey: "modelLimitations.staticAnatomyItems" as const, caseOnly: true as const, activeCase: true as const,
  presetLabel: { ja: "AS · 低EF・低流量・低勾配", en: "AS · low EF, low flow, low gradient" },
  summary: { ja: "左室拡大・収縮能低下の背景に狭い弁を加え、低い勾配と狭窄が両立することを示す例。", en: "A narrow valve on a dilated, low-contractility LV background illustrates low gradient despite stenosis." },
}, {
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
  research: true as const, caseOnly: true as const,
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
