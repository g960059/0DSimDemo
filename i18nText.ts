import type { TFunction } from "i18next";
import { KNOB_RANGES, type KnobKey } from "./engine/knobs";
import { KNOB_STEPS, readingButtonOptionsFor, roundToStep } from "./knobMetadata";
import { RAW_PARAM_CATEGORY_LABELS, rawParamCatalogEntry, type RawParamCategoryId } from "./rawParameterCatalog";
import type { ControllerItem } from "./types";

type T = TFunction<"translation", undefined>;
type ControllerOption = NonNullable<ControllerItem["options"]>[number];

const KNOB_LABEL_KEY: Record<string, string> = {
  HR: "workbench.controls.knobs.HR",
  contractility: "workbench.controls.knobs.contractility",
  contractilityRV: "workbench.controls.knobs.contractilityRV",
  relaxation: "workbench.controls.knobs.relaxation",
  diastolicStiffness: "workbench.controls.knobs.diastolicStiffness",
  afterload: "workbench.controls.knobs.afterload",
  arterialStiffness: "workbench.controls.knobs.arterialStiffness",
  pulmonaryResistance: "workbench.controls.knobs.pulmonaryResistance",
  venousTone: "workbench.controls.knobs.venousTone",
  peep: "workbench.controls.knobs.peep",
  aorticStenosis: "workbench.controls.knobs.aorticStenosis",
  aorticRegurgitation: "workbench.controls.knobs.aorticRegurgitation",
  mitralStenosis: "workbench.controls.knobs.mitralStenosis",
  mitralRegurgitation: "workbench.controls.knobs.mitralRegurgitation",
  tricuspidRegurgitation: "workbench.controls.knobs.tricuspidRegurgitation",
  pulmonicStenosis: "workbench.controls.knobs.pulmonicStenosis",
};

const CONTROLLER_CATEGORY_KEY: Record<string, string> = {
  "Cardiac Function": "workbench.controls.categories.cardiacFunction",
  "Load & Rate": "workbench.controls.categories.loadRate",
  "Valve Lesions": "workbench.controls.categories.valveLesions",
};

const OPTION_LABEL_KEY: Record<string, string> = {
  low: "workbench.controls.options.low",
  normal: "workbench.controls.options.normal",
  high: "workbench.controls.options.high",
  none: "workbench.controls.options.none",
  moderate: "workbench.controls.options.moderate",
  severe: "workbench.controls.options.severe",
};

const VALVE_LESION_SEVERITY_KEYS = new Set<string>([
  "aorticStenosis",
  "aorticRegurgitation",
  "mitralStenosis",
  "mitralRegurgitation",
  "tricuspidRegurgitation",
  "pulmonicStenosis",
]);

function almostEqual(a: number, b: number, step: number | undefined): boolean {
  return Math.abs(a - b) <= Math.max((step ?? 0) / 2, 1e-6);
}

function rangeOptionLabelKey(item: ControllerItem, value: number): string | undefined {
  const range = KNOB_RANGES[item.paramKey as KnobKey];
  const min = item.min ?? range?.[0];
  const max = item.max ?? range?.[1];
  const step = item.step ?? KNOB_STEPS[item.paramKey as keyof typeof KNOB_STEPS] ?? 0.01;
  if (min == null || max == null) return undefined;
  const mid = roundToStep((min + max) / 2, step);
  if (almostEqual(value, min, step)) return "low";
  if (almostEqual(value, mid, step)) return "normal";
  if (almostEqual(value, max, step)) return "high";
  return undefined;
}

function generatedReadingOptionLabelKey(item: ControllerItem, value: number, baseline: number | undefined): string | undefined {
  if (baseline == null) return undefined;
  const generated = readingButtonOptionsFor(item.paramKey, baseline);
  if (!generated) return undefined;
  const labelKeys = VALVE_LESION_SEVERITY_KEYS.has(item.paramKey)
    ? ["none", "moderate", "severe"]
    : ["low", "normal", "high"];
  const step = item.step ?? KNOB_STEPS[item.paramKey as keyof typeof KNOB_STEPS] ?? 0.01;
  const index = generated.findIndex((option) => almostEqual(option.value, value, step));
  return index >= 0 ? labelKeys[index] : undefined;
}

function optionLabelKeyForValue(item: ControllerItem, option: Pick<ControllerOption, "value" | "labelKey">, baseline?: number): string | undefined {
  return option.labelKey
    ?? generatedReadingOptionLabelKey(item, option.value, baseline)
    ?? rangeOptionLabelKey(item, option.value);
}

export function translatedKnobLabel(t: T, key: string, fallback = key): string {
  const translationKey = KNOB_LABEL_KEY[key];
  if (translationKey) return t(translationKey);
  const raw = rawParamCatalogEntry(key);
  return raw ? t(`workbench.controls.rawParams.${key}`, { defaultValue: fallback }) : fallback;
}

export function translatedControllerCategory(t: T, category: string): string {
  const translationKey = CONTROLLER_CATEGORY_KEY[category];
  if (translationKey) return t(translationKey);
  const fallback = RAW_PARAM_CATEGORY_LABELS[category as RawParamCategoryId];
  return fallback ? t(`workbench.controls.rawCategories.${category}`, { defaultValue: fallback }) : category;
}

export function translatedControllerItemLabel(t: T, item: ControllerItem, fallback = item.paramKey): string {
  if (item.labelKey) return translatedKnobLabel(t, item.labelKey, item.label ?? fallback);
  if (item.label == null) return translatedKnobLabel(t, item.paramKey, fallback);
  return item.label;
}

export function translatedOptionLabel(t: T, option: ControllerOption): string {
  const translationKey = option.labelKey ? OPTION_LABEL_KEY[option.labelKey] : undefined;
  return translationKey ? t(translationKey) : option.label;
}

export function controllerOptionsWithLabelKeys<TOption extends { label: string; value: number; labelKey?: string }>(
  item: ControllerItem,
  options: TOption[],
  baseline?: number,
): TOption[] {
  return options.map((option) => {
    const labelKey = optionLabelKeyForValue(item, option, baseline);
    return labelKey ? { ...option, labelKey } : option;
  });
}

export function translatedControllerOptions<TOption extends { label: string; value: number; labelKey?: string }>(t: T, options: TOption[]): TOption[] {
  return options.map((option) => ({ ...option, label: translatedOptionLabel(t, option) }));
}
