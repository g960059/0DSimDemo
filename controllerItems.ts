import { CONTROLLER_CATALOG } from "./controllerCatalog";
import { KNOB_RANGES, type KnobKey } from "./engine/knobs";
import { KNOB_STEPS, roundToStep } from "./knobMetadata";
import { rawParamCatalogEntry } from "./rawParameterCatalog";
import type { ControllerItem } from "./types";

const VALID_KINDS = new Set<ControllerItem["kind"]>(["slider", "buttonGroup", "knob", "custom"]);
const catalogByKey = new Map<string, (typeof CONTROLLER_CATALOG)[number]>(CONTROLLER_CATALOG.map((entry) => [entry.key, entry]));
const AUTHORED_CATEGORY_LABEL_MIN_ITEMS = 7;

export type ControllerItemGroup = {
  category: string;
  items: ControllerItem[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function catalogDefaultsFor(paramKey: string): { label: string; rangeMin: number; rangeMax: number; step: number } | undefined {
  const clinical = catalogByKey.get(paramKey);
  if (clinical) {
    const range = KNOB_RANGES[paramKey as KnobKey];
    return {
      label: clinical.label,
      rangeMin: range?.[0] ?? 0,
      rangeMax: range?.[1] ?? 1,
      step: clinical.step ?? KNOB_STEPS[paramKey as keyof typeof KNOB_STEPS] ?? 0.01,
    };
  }

  const raw = rawParamCatalogEntry(paramKey);
  if (!raw) return undefined;
  return {
    label: raw.label,
    rangeMin: raw.min,
    rangeMax: raw.max,
    step: raw.step,
  };
}

export function controllerItemCategory(item: Pick<ControllerItem, "paramKey">): string {
  return catalogByKey.get(item.paramKey)?.category
    ?? rawParamCatalogEntry(item.paramKey)?.category
    ?? "other";
}

export function groupControllerItemsByCategory(items: ControllerItem[]): ControllerItemGroup[] {
  if (items.length === 0) return [];

  const categories = items.map(controllerItemCategory);
  const shouldGroup = items.length >= AUTHORED_CATEGORY_LABEL_MIN_ITEMS && new Set(categories).size > 1;
  if (!shouldGroup) {
    return [{ category: categories[0] ?? "other", items: [...items] }];
  }

  const groups: ControllerItemGroup[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const category = categories[index] ?? "other";
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.category === category) {
      currentGroup.items.push(item);
    } else {
      groups.push({ category, items: [item] });
    }
  }
  return groups;
}

function stepFor(paramKey: string): number {
  return catalogDefaultsFor(paramKey)?.step ?? 0.01;
}

function normalizedStep(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizedLabel(value: unknown, fallback: string): string {
  return (value == null ? "" : String(value).trim()) || fallback;
}

function normalizedLabelKey(value: unknown): string | undefined {
  const key = value == null ? "" : String(value).trim();
  return key || undefined;
}

export function buttonOptionsFromRange(item: ControllerItem): { label: string; value: number }[] {
  const defaults = catalogDefaultsFor(item.paramKey);
  const min = finiteOr(item.min, defaults?.rangeMin ?? 0);
  const max = finiteOr(item.max, defaults?.rangeMax ?? 1);
  const step = normalizedStep(item.step, defaults?.step ?? stepFor(item.paramKey));
  const mid = roundToStep((min + max) / 2, step);
  return [
    { label: "Low", value: roundToStep(min, step) },
    { label: "Normal", value: mid },
    { label: "High", value: roundToStep(max, step) },
  ];
}

export function normalizeControllerItems(items: ControllerItem[]): { items: ControllerItem[]; warnings: string[] } {
  const warnings: string[] = [];
  const seenItems = new Set<string>();
  const normalized: ControllerItem[] = [];

  for (const item of items) {
    const defaults = catalogDefaultsFor(item.paramKey);
    if (!defaults) {
      warnings.push(`Dropped unknown controller item "${item.paramKey}".`);
      continue;
    }
    if (seenItems.has(item.paramKey)) {
      warnings.push(`Dropped duplicate controller item "${item.paramKey}".`);
      continue;
    }
    seenItems.add(item.paramKey);

    const { rangeMin, rangeMax } = defaults;
    const step = normalizedStep(item.step, defaults.step);
    const rawMin = finiteOr(item.min, rangeMin);
    const rawMax = finiteOr(item.max, rangeMax);
    let min = roundToStep(clamp(rawMin, rangeMin, rangeMax), step);
    let max = roundToStep(clamp(rawMax, rangeMin, rangeMax), step);
    if (min > max) {
      warnings.push(`Reset inverted range for "${item.paramKey}".`);
      min = roundToStep(rangeMin, step);
      max = roundToStep(rangeMax, step);
    }

    let kind: ControllerItem["kind"] = VALID_KINDS.has(item.kind) ? item.kind : "slider";
    if (kind !== item.kind) warnings.push(`Coerced invalid kind for "${item.paramKey}" to slider.`);

    const label = normalizedLabel(item.label, defaults.label);
    const next: ControllerItem = {
      paramKey: item.paramKey,
      kind,
      label,
      ...(normalizedLabelKey(item.labelKey) ? { labelKey: normalizedLabelKey(item.labelKey) } : {}),
      min,
      max,
      step,
    };

    if (kind === "buttonGroup") {
      const optionsByValue = new Map<number, { label: string; value: number }>();
      for (const option of item.options ?? []) {
        if (typeof option.value !== "number" || !Number.isFinite(option.value)) {
          warnings.push(`Dropped non-finite option for "${item.paramKey}".`);
          continue;
        }
        const value = roundToStep(clamp(option.value, rangeMin, rangeMax), step);
        if (!optionsByValue.has(value)) {
          const labelKey = normalizedLabelKey(option.labelKey);
          optionsByValue.set(value, {
            label: normalizedLabel(option.label, String(value)),
            value,
            ...(labelKey ? { labelKey } : {}),
          });
        }
      }
      const options = [...optionsByValue.values()];
      if (options.length > 3) warnings.push(`Capped "${item.paramKey}" button options at 3.`);
      const cappedOptions = options.slice(0, 3);
      if (cappedOptions.length >= 2) {
        next.options = cappedOptions;
      } else {
        warnings.push(`Coerced "${item.paramKey}" to slider because it has fewer than 2 distinct button values.`);
        next.kind = "slider";
        delete next.options;
      }
    }

    normalized.push(next);
  }

  return { items: normalized, warnings };
}
