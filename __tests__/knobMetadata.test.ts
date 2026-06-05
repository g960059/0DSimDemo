import { describe, expect, it } from "vitest";
import { KNOB_TEACHING_SAFE } from "@/engine/knobs";
import { defaultControllerItemFor, KNOB_STEPS, roundToStep } from "@/knobMetadata";
import type { NumericKnobKey } from "@/lessonDoc";

describe("knobMetadata controller defaults", () => {
  it("adds exact slider preset options for teaching-safe contractility knobs", () => {
    const expectedOptions = [
      { label: "Low", value: 0.7 },
      { label: "Normal", value: 1 },
      { label: "High", value: 1.4 },
    ];

    for (const key of ["contractility", "contractilityRV"]) {
      const item = defaultControllerItemFor(key);

      expect(item.kind).toBe("slider");
      expect(item.options).toEqual(expectedOptions);
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

      if (item.options != null) {
        expect(KNOB_TEACHING_SAFE).toHaveProperty(key);
      }
    }
  });

  it("rounds to step without floating point noise", () => {
    expect(roundToStep(0.625, 0.05)).toBe(0.65);
    expect(roundToStep(1.2000000000000002, 0.05)).toBe(1.2);
  });
});
