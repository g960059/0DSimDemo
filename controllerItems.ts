import { CONTROLLER_CATALOG } from "./controllerCatalog";
import { KNOB_RANGES, type KnobKey } from "./engine/knobs";
import { KNOB_STEPS, roundToStep } from "./knobMetadata";
import type { ControllerItem } from "./types";

const VALID_KINDS = new Set<ControllerItem["kind"]>(["slider", "buttonGroup", "knob", "custom"]);
const catalogByKey = new Map(CONTROLLER_CATALOG.map((entry) => [entry.key, entry]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stepFor(paramKey: string): number {
  const catalogStep = catalogByKey.get(paramKey as keyof typeof KNOB_STEPS)?.step;
  return catalogStep ?? KNOB_STEPS[paramKey as keyof typeof KNOB_STEPS] ?? 0.01;
}

function normalizedLabel(value: unknown, fallback: string): string {
  return (value == null ? "" : String(value).trim()) || fallback;
}

export function buttonOptionsFromRange(item: ControllerItem): { label: string; value: number }[] {
  const range = KNOB_RANGES[item.paramKey as KnobKey];
  const min = finiteOr(item.min, range?.[0] ?? 0);
  const max = finiteOr(item.max, range?.[1] ?? 1);
  const step = finiteOr(item.step, stepFor(item.paramKey));
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
    const catalog = catalogByKey.get(item.paramKey as keyof typeof KNOB_STEPS);
    if (!catalog) {
      warnings.push(`Dropped unknown controller item "${item.paramKey}".`);
      continue;
    }
    if (seenItems.has(item.paramKey)) {
      warnings.push(`Dropped duplicate controller item "${item.paramKey}".`);
      continue;
    }
    seenItems.add(item.paramKey);

    const range = KNOB_RANGES[item.paramKey as KnobKey];
    const rangeMin = range?.[0] ?? 0;
    const rangeMax = range?.[1] ?? 1;
    const step = stepFor(item.paramKey);
    const rawMin = finiteOr(item.min, rangeMin);
    const rawMax = finiteOr(item.max, rangeMax);
    let min = roundToStep(clamp(rawMin, rangeMin, rangeMax), step);
    let max = roundToStep(clamp(rawMax, rangeMin, rangeMax), step);
    if (min > max) {
      warnings.push(`Reset inverted range for "${item.paramKey}".`);
      min = rangeMin;
      max = rangeMax;
    }

    let kind: ControllerItem["kind"] = VALID_KINDS.has(item.kind) ? item.kind : "slider";
    if (kind !== item.kind) warnings.push(`Coerced invalid kind for "${item.paramKey}" to slider.`);

    const label = normalizedLabel(item.label, catalog.label);
    const next: ControllerItem = {
      paramKey: item.paramKey,
      kind,
      label,
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
          optionsByValue.set(value, { label: normalizedLabel(option.label, String(value)), value });
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
