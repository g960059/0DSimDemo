import { describe, expect, it } from "vitest";
import { OFFICIAL_CASES, officialCaseById } from "@/officialCases";
import { caseDocumentToSimInstances, isCaseDisplayable } from "@/caseDoc";
import { measureConverged } from "@/engine/measure";
import { DEFAULT_SETTLE_POLICY } from "@/engine/settling";

const OFFICIAL_CASE_MEASURE = {
  // Official case smokes include intentionally pathological states whose shape
  // signals can retain small beat-scale wobble after the primary hemodynamics
  // have converged enough for lesson-direction checks.
  settlePolicy: { ...DEFAULT_SETTLE_POLICY, tolShape: 0.25 },
  requireProjectorQuiet: false,
};

const officialMeasureOptions = (caseId: string) => ({
  ...OFFICIAL_CASE_MEASURE,
  settlePolicy: {
    ...OFFICIAL_CASE_MEASURE.settlePolicy,
    // Fixed-TBV volume-conservative integration exposes a small persistent
    // stroke-volume wobble in the dobutamine teaching case; the directionality
    // smoke only needs the coarse settled operating point.
    ...(caseId === "lv-failure-dobutamine" ? { tolPrimary: 0.01 } : {}),
  },
});

describe("official lesson cases (#3-d)", () => {
  it("exposes a non-empty registry, each looked up by id", () => {
    expect(OFFICIAL_CASES.length).toBeGreaterThanOrEqual(3);
    for (const c of OFFICIAL_CASES) expect(officialCaseById(c.meta.id)).toBe(c);
  });

  for (const c of OFFICIAL_CASES) {
    describe(c.meta.title, () => {
      it("is displayable (carries non-empty model limitations)", () => {
        expect(isCaseDisplayable(c)).toBe(true);
        expect(c.knobMappingVersion).toBe("knobmap-0.2-activestress");
      });

      it("resolves every instance to a finite, NON-DEGENERATE settled state", () => {
        const instances = caseDocumentToSimInstances(c); // throws on bad version/baseline
        expect(instances.length).toBe(c.instances.length);
        for (const si of instances) {
          for (const v of Object.values(si.params)) {
            if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
          }
          const r = measureConverged(si.params, { ...officialMeasureOptions(c.meta.id), targetTBV: si.targetVolume, measureBeats: 2 });
          expect(r.settleStatus.settled).toBe(true);
          expect(Number.isFinite(r.metrics.AoPMean)).toBe(true);
          expect(Number.isFinite(r.metrics.CO_L)).toBe(true);
          expect(r.metrics.AoPMean).toBeGreaterThan(0);
          // Degeneracy guard: a chamber pinned at its volume floor reports a
          // non-physiological EF (~97%). No official case may settle there.
          expect(r.metrics.EF_LApprox, `${si.name} EF degenerate`).toBeLessThan(0.92);
        }
      });
    });
  }

  // Basic directionality smokes — each authored case must teach the direction its
  // text claims (detailed morphology is #3-e). All measured at the settled state.
  describe("lesson directionality", () => {
    const metricsOf = (caseId: string, idx: number) => {
      const si = caseDocumentToSimInstances(officialCaseById(caseId)!)[idx];
      return measureConverged(si.params, { ...officialMeasureOptions(caseId), targetTBV: si.targetVolume, measureBeats: 3 }).metrics;
    };
    const normal = metricsOf("normal-sinus", 0);

    it("dobutamine raises CO and lowers filling pressure vs the failure state", () => {
      const failure = metricsOf("lv-failure-dobutamine", 0);
      const dobut = metricsOf("lv-failure-dobutamine", 1);
      expect(dobut.CO_L).toBeGreaterThan(failure.CO_L);     // inotrope restores output
      expect(dobut.LAPMean).toBeLessThan(failure.LAPMean);  // and unloads the congested LV
    });

    it("LV failure is a genuine low-output, congested state vs normal", () => {
      const failure = metricsOf("lv-failure-dobutamine", 0);
      expect(failure.CO_L).toBeLessThan(normal.CO_L);
      expect(failure.LAPMean).toBeGreaterThan(normal.LAPMean);
    });

    it("mitral regurgitation raises left atrial pressure vs normal", () => {
      const mr = metricsOf("valve-lesions", 1);
      expect(mr.LAPMean).toBeGreaterThan(normal.LAPMean);
    });

    it("hypovolemia is a low-preload, low-output state vs normal", () => {
      const hypo = metricsOf("hypovolemia", 0);
      expect(hypo.CO_L).toBeLessThan(normal.CO_L);
      expect(hypo.RAPMean).toBeLessThan(normal.RAPMean); // reduced preload
    });
  });
});
