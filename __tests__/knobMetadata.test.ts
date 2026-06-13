import { describe, expect, it } from "vitest";
import { KNOB_RANGES } from "@/engine/knobs";
import { defaultControllerItemFor, KNOB_STEPS, readingButtonOptionsFor, roundToStep } from "@/knobMetadata";
import type { NumericKnobKey } from "@/lessonDoc";

describe("knobMetadata controller defaults", () => {
  it("returns ranged slider defaults for raw catalog parameters", () => {
    const item = defaultControllerItemFor("pericardialFluidMl");

    expect(item).toMatchObject({
      paramKey: "pericardialFluidMl",
      kind: "slider",
      label: "Pericardial fluid",
      min: 0,
      max: 1000,
      step: 10,
    });
  });

  it("returns plain slider defaults for contractility knobs", () => {
    for (const key of ["contractility", "contractilityRV"]) {
      const item = defaultControllerItemFor(key);

      expect(item.kind).toBe("slider");
      expect(item.options).toBeUndefined();
      expect(item.min).toBeTypeOf("number");
      expect(item.max).toBeTypeOf("number");
      expect(item.step).toBeTypeOf("number");
    }
  });

  it("leaves non-curated knobs as plain sliders", () => {
    for (const key of ["relaxation", "diastolicStiffness", "afterload", "HR", "aorticStenosis"]) {
      const item = defaultControllerItemFor(key);

      expect(item.kind).toBe("slider");
      expect(item.options).toBeUndefined();
    }
  });

  it("guards preset options behind explicit teaching-safe bands", () => {
    for (const key of Object.keys(KNOB_STEPS) as NumericKnobKey[]) {
      const item = defaultControllerItemFor(key);

      expect(item.options).toBeUndefined();
    }
  });

  it("derives reading buttons for teaching-safe knobs", () => {
    expect(readingButtonOptionsFor("contractility", 1)).toEqual([
      { label: "Low", value: 0.7 },
      { label: "Normal", value: 1 },
      { label: "High", value: 1.4 },
    ]);
  });

  it("uses semantic reading buttons for valve lesion severity knobs", () => {
    const max = KNOB_RANGES.aorticStenosis?.[1] ?? 1;

    expect(readingButtonOptionsFor("aorticStenosis", 0)).toEqual([
      { label: "None", value: 0 },
      { label: "Moderate", value: max / 2 },
      { label: "Severe", value: max },
    ]);
  });

  it("omits reading buttons for knobs without safe reading presets", () => {
    expect(readingButtonOptionsFor("relaxation", 1)).toBeNull();
    expect(readingButtonOptionsFor("diastolicStiffness", 1)).toBeNull();
    expect(readingButtonOptionsFor("venousTone", 0.5)).toBeNull();
  });

  it("omits reading buttons when value dedupe leaves fewer than two distinct options", () => {
    expect(readingButtonOptionsFor("contractility", Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("rounds to step without floating point noise", () => {
    expect(roundToStep(0.625, 0.05)).toBe(0.65);
    expect(roundToStep(1.2000000000000002, 0.05)).toBe(1.2);
  });
});
