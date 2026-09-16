import type { ScenarioPresetV2 } from "@/studio/contracts/v2/content";

export const STUDIO_PRESET_GROUPS_V1 = [
  "baseline", "heartFailure", "valves", "other", "loaded",
] as const;
export type StudioPresetGroupV1 = typeof STUDIO_PRESET_GROUPS_V1[number];

type LocalizedText = Readonly<{ ja: string; en: string }>;
type PresetPresentation = Readonly<{
  group: StudioPresetGroupV1;
  englishLabel?: string;
  summary: LocalizedText;
  aliases: readonly string[];
}>;

// Browsing copy belongs to presentation, not the preset's exact capture.
const PRESENTATION: Readonly<Record<string, PresetPresentation>> = {
  "standard74-baseline-v1": {
    group: "baseline",
    summary: {
      ja: "このモデルに登録された基準設定と保存状態です。ほかのプリセットとの比較の出発点になります。",
      en: "The registered reference settings and saved state for this model. Use it as a starting point for comparisons.",
    },
    aliases: ["baseline", "基準", "ベースライン", "reference"],
  },
  "standard74-hfref-chronic-dilated-v1": {
    group: "heartFailure",
    englishLabel: "HFrEF · Chronic LV dilation",
    summary: {
      ja: "左室拡大と収縮機能低下を組み合わせた、安静時の教育例です。その状態での循環動態を比較します。",
      en: "An educational resting-state example combining LV dilation with reduced contractility, for exploring the resulting hemodynamics.",
    },
    aliases: ["HFrEF", "heart failure", "reduced ejection fraction", "心不全", "左室拡大", "収縮機能低下"],
  },
  "standard74-as-high-gradient-valve-only-v1": {
    group: "valves",
    englishLabel: "AS · Valve-only, high gradient",
    summary: {
      ja: "baselineから大動脈弁の最大有効弁口面積だけを変更した比較例です。心室の設定を保ったまま、弁狭窄による循環動態の変化を観察します。",
      en: "Changes only the maximum effective aortic valve area from baseline, to explore valve narrowing while keeping the ventricular settings unchanged.",
    },
    aliases: ["AS", "aortic stenosis", "high gradient", "valve only", "大動脈弁狭窄", "高勾配", "弁膜症"],
  },
  "standard74-as-low-flow-reduced-ef-v1": {
    group: "valves",
    englishLabel: "AS · Low EF, low flow, low gradient",
    summary: {
      ja: "左室拡大・収縮機能低下と大動脈弁狭窄を組み合わせた教育例です。低流量・低勾配の条件で、弁狭窄と左室機能の関係を観察します。",
      en: "An educational example combining aortic stenosis with LV dilation and reduced contractility, to explore low-flow, low-gradient hemodynamics.",
    },
    aliases: ["AS", "HFrEF", "aortic stenosis", "low EF", "low flow", "low gradient", "LFLG", "大動脈弁狭窄", "低EF", "低流量", "低勾配", "心不全", "弁膜症"],
  },
  "preset/workbench-loaded-state": {
    group: "loaded",
    summary: {
      ja: "このシミュレーションを開いた時点の設定と保存状態です。",
      en: "The settings and saved state from when this experiment was opened.",
    },
    aliases: ["loaded state", "読込", "読み込み", "保存状態"],
  },
};

export function studioPresetPresentationV1(preset: ScenarioPresetV2, locale: "ja" | "en") {
  const entry = Object.hasOwn(PRESENTATION, preset.presetId) ? PRESENTATION[preset.presetId] : undefined;
  const label = locale === "en" ? entry?.englishLabel ?? preset.title : preset.title;
  const description = preset.description.trim();
  return {
    group: entry?.group ?? "other" as StudioPresetGroupV1,
    label,
    summary: entry?.summary[locale] ?? (description === preset.title.trim() ? "" : description),
    searchTerms: [preset.title, label, entry?.englishLabel ?? "", ...(entry?.aliases ?? [])],
  };
}

export function studioPresetMatchesSearchV1(terms: readonly string[], query: string): boolean {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();
  const haystack = terms.map(normalize).join(" ");
  return normalize(query).split(/\s+/).every(word => haystack.includes(word));
}
