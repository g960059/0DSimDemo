import { KNOB_RANGES, type KnobKey } from "./engine/knobs";
import type { NumericKnobKey } from "./lessonDoc";

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
