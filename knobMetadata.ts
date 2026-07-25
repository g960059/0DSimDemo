import { KNOB_RANGES, KNOB_TEACHING_SAFE, type KnobKey } from "./engine/knobs";
import type { NumericKnobKey } from "./engine/knobs";
import { rawParamCatalogEntry } from "./rawParameterCatalog";
import type { ControllerItem } from "./types";

// Canonical single source of numeric-knob labels/steps.
// The Exposed Knobs UI (components/ExposedKnobs.tsx) imports these so the
// learner-facing label/step values cannot drift from this metadata.
// min/max come from engine/knobs `KNOB_RANGES` (the single source for ranges).
export const KNOB_LABELS: Partial<Record<NumericKnobKey, string>> = {
  HR: "Heart rate",
  contractility: "LV contractility",
  contractilityRV: "RV contractility",
  relaxation: "Relaxation",
  diastolicStiffness: "Diastolic stiffness",
  afterload: "Afterload",
  arterialStiffness: "Arterial stiffness",
  pulmonaryResistance: "Pulmonary resistance",
  venousTone: "Venous tone",
  peep: "PEEP",
  aorticStenosis: "Aortic stenosis",
  aorticRegurgitation: "Aortic regurgitation",
  mitralStenosis: "Mitral stenosis",
  mitralRegurgitation: "Mitral regurgitation",
  tricuspidRegurgitation: "Tricuspid regurgitation",
  pulmonicStenosis: "Pulmonic stenosis",
};

export const KNOB_STEPS: Record<NumericKnobKey, number> = {
  HR: 1,
  contractility: 0.05,
  contractilityRV: 0.05,
  relaxation: 0.05,
  diastolicStiffness: 0.05,
  afterload: 0.05,
  arterialStiffness: 0.05,
  pulmonaryResistance: 0.05,
  venousTone: 0.05,
  peep: 1,
  aorticStenosis: 0.05,
  aorticRegurgitation: 0.05,
  mitralStenosis: 0.05,
  mitralRegurgitation: 0.05,
  tricuspidRegurgitation: 0.05,
  pulmonicStenosis: 0.05,
};

export function knobControllerMetadata(
  paramKey: string,
): { label?: string; min?: number; max?: number; step?: number } | undefined {
  // baroreflexEnabled is a boolean knob, not a numeric controller.
  if (paramKey === "baroreflexEnabled") return undefined;

  const key = paramKey as NumericKnobKey;
  const label = KNOB_LABELS[key];
  const step = KNOB_STEPS[key];
  const range = KNOB_RANGES[key as KnobKey];
  if (label == null && range == null && step == null) return undefined;

  return {
    ...(label != null ? { label } : {}),
    ...(range ? { min: range[0], max: range[1] } : {}),
    ...(step != null ? { step } : {}),
  };
}

export function rawParamControllerMetadata(
  paramKey: string,
): { label?: string; min?: number; max?: number; step?: number; unit?: string } | undefined {
  const entry = rawParamCatalogEntry(paramKey);
  if (!entry) return undefined;
  return {
    label: entry.label,
    min: entry.min,
    max: entry.max,
    step: entry.step,
    ...(entry.unit ? { unit: entry.unit } : {}),
  };
}

// relaxation/diastolicStiffness will gain presets once teaching-safe bands are
// defined in a physiology pass; do not derive presets from the hard clamp.
const VALVE_LESION_SEVERITY_KEYS = new Set<string>([
  "aorticStenosis",
  "aorticRegurgitation",
  "mitralStenosis",
  "mitralRegurgitation",
  "tricuspidRegurgitation",
  "pulmonicStenosis",
]);

function decimalPlaces(value: number): number {
  const text = value.toString().toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  const fraction = text.split(".")[1];
  return fraction?.length ?? 0;
}

export function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
  const precision = Math.min(Math.max(decimalPlaces(step) + 2, 6), 12);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dedupeReadingOptionsByValue(options: { label: string; value: number }[]): { label: string; value: number }[] | null {
  const byValue = new Map<number, { label: string; value: number }>();
  for (const option of options) {
    if (!byValue.has(option.value)) byValue.set(option.value, option);
  }
  const distinctOptions = [...byValue.values()];
  return distinctOptions.length >= 2 ? distinctOptions : null;
}

export function defaultControllerItemFor(paramKey: string): ControllerItem {
  const m = knobControllerMetadata(paramKey) ?? rawParamControllerMetadata(paramKey);
  return {
    paramKey,
    kind: "slider",
    label: m?.label ?? paramKey,
    ...(m?.min != null ? { min: m.min } : {}),
    ...(m?.max != null ? { max: m.max } : {}),
    ...(m?.step != null ? { step: m.step } : {}),
  };
}

export function readingButtonOptionsFor(paramKey: string, baseline: number): { label: string; value: number }[] | null {
  const key = paramKey as KnobKey;
  const range = KNOB_RANGES[key];
  const safeBand = KNOB_TEACHING_SAFE[key];

  if (range && safeBand) {
    const step = KNOB_STEPS[paramKey as NumericKnobKey];
    if (step == null) return null;

    const [min, max] = range;
    const options = [
      { label: "Low", value: clamp(roundToStep((safeBand[0] + baseline) / 2, step), min, max) },
      { label: "Normal", value: clamp(roundToStep(baseline, step), min, max) },
      { label: "High", value: clamp(roundToStep((baseline + safeBand[1]) / 2, step), min, max) },
    ];

    return dedupeReadingOptionsByValue(options);
  }

  if (VALVE_LESION_SEVERITY_KEYS.has(paramKey)) {
    if (!range) return null;
    const step = KNOB_STEPS[paramKey as NumericKnobKey];
    if (step == null) return null;

    const max = range[1];
    return dedupeReadingOptionsByValue([
      { label: "None", value: 0 },
      { label: "Moderate", value: roundToStep(max / 2, step) },
      { label: "Severe", value: max },
    ]);
  }

  return null;
}
