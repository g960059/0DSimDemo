import { describe, expect, it } from "vitest";
import { runScenario } from "@/engine/harness";
import { DEFAULT_PARAMS } from "@/constants";

/**
 * Health = MODEL/NUMERICAL validity, not physiological normalcy (S2b).
 * Abnormal-but-stable scenarios must NOT be flagged just for being far from
 * normal-adult values — simulating pathology is a primary use case.
 */
describe("health semantics: abnormal physiology is not a warning", () => {
  const scenarios: Array<[string, Partial<typeof DEFAULT_PARAMS>]> = [
    ["severe vasoconstriction (hypertension)", { systemicResistance: 2.8 }],
    ["depressed contractility (shock)", { lvTmaxScale: 0.3, contractility: 0.5 }],
    ["hyperdynamic / vasodilated", { systemicResistance: 0.5, contractility: 1.8 }],
  ];

  for (const [name, patch] of scenarios) {
    it(`'${name}' produces no physiological-range warning`, () => {
      const r = runScenario({ ...DEFAULT_PARAMS, ...patch });
      // The model may still be perfectly valid even far from normal values.
      expect(r.health.physiologicalRange).toBe("ok");
      for (const msg of r.health.messages) {
        expect(msg).not.toMatch(/normal-adult|broad preview|physiology range/i);
      }
    });
  }
});
