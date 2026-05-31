import { describe, expect, it } from "vitest";
import { OFFICIAL_CASES, officialCaseById } from "@/officialCases";
import { caseDocumentToSimInstances, isCaseDisplayable } from "@/caseDoc";
import { runScenario } from "@/engine/harness";

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

      it("resolves every instance to finite params and settles", () => {
        const instances = caseDocumentToSimInstances(c); // throws on bad version/baseline
        expect(instances.length).toBe(c.instances.length);
        for (const si of instances) {
          for (const v of Object.values(si.params)) {
            if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
          }
          const r = runScenario(si.params, { settleMode: "converge", targetTBV: si.targetVolume, measureSeconds: 2 });
          expect(r.settleStatus).toBeDefined();
          expect(Number.isFinite(r.metrics.AoPMean)).toBe(true);
          expect(Number.isFinite(r.metrics.CO_L)).toBe(true);
          expect(r.metrics.AoPMean).toBeGreaterThan(0);
        }
      });
    });
  }
});
