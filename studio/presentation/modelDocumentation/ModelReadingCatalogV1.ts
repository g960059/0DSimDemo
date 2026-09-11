import selection from "@/data/model-baselines/current-baseline-selection-v1.json";
import { SAVED_MODEL_DOCUMENT_CATALOG_V1 } from "./SavedModelDocumentCatalogV1";
import type { Locale } from "@/localeRouting";

/** Current use is catalog metadata, not a rewrite of an archive's creation status. */
export const MODEL_READING_ENTRIES_V1 = SAVED_MODEL_DOCUMENT_CATALOG_V1.map(entry => {
  const isCase = "caseOnly" in entry && entry.caseOnly;
  const research = "research" in entry && entry.research;
  const modelLabel = "modelLabel" in entry ? entry.modelLabel : entry.label;
  const current = entry.document.identity.modelId === selection.modelId
    && (entry.document.identity.surfaceReleaseId === selection.surfaceReleaseId || "activeCase" in entry && entry.activeCase)
    && (isCase || entry.document.documentId === selection.document.documentId
      && entry.document.contentSha256 === selection.document.contentSha256
      && entry.document.identity.baselineId === selection.baselineId);
  return { ...entry.document, state: research ? "research" as const : current ? "current" as const : "archived" as const,
    presetKind: isCase ? "case" as const : "baseline" as const,
    modelLabel: isCase && !("modelLabel" in entry) ? { ja: "HFrEF研究モデル", en: "HFrEF research model" } : { ja: modelLabel, en: modelLabel },
    presetLabel: "presetLabel" in entry ? entry.presetLabel : isCase ? { ja: "HFrEF · 慢性左室拡大型", en: "HFrEF · chronic LV dilation" } : { ja: "baseline", en: "baseline" },
    summary: "summary" in entry ? entry.summary : isCase
      ? { ja: "左室拡大と収縮能低下を組み合わせた、安静時の一症例。", en: "One resting case combining LV dilation and reduced systolic function." }
      : { ja: "安静・洞調律・補助循環なしの基準設定。", en: "Reference resting, sinus, unassisted operating point." },
  };
});

export type ModelReadingEntryV1 = (typeof MODEL_READING_ENTRIES_V1)[number];
export const currentModelReadingEntryV1 = () => MODEL_READING_ENTRIES_V1.find(e => e.state === "current" && e.presetKind === "baseline");
export const MODEL_READING_MODELS_V1 = MODEL_READING_ENTRIES_V1.filter((entry, index, all) =>
  all.findIndex(e => e.identity.modelId === entry.identity.modelId) === index);
export function compatibleReadingEntriesV1(entry: ModelReadingEntryV1) {
  return MODEL_READING_ENTRIES_V1.filter(e => e.identity.modelId === entry.identity.modelId);
}
export function modelReadingPresetLabelV1(entry: ModelReadingEntryV1, locale: Locale) {
  const hasBaseline = compatibleReadingEntriesV1(entry).some(e => e.presetKind === "baseline");
  return locale === "ja" ? hasBaseline ? "baseline・プリセット" : "プリセット"
    : hasBaseline ? "Baseline & presets" : "Presets";
}
export function modelReadingStateLabelV1(state: ModelReadingEntryV1["state"], locale: Locale) {
  return ({ current: { ja: "標準で使用", en: "Current" }, archived: { ja: "保存版", en: "Archived" },
    research: { ja: "研究用", en: "Research" } }[state])[locale];
}
