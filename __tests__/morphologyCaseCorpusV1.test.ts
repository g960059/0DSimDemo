import { describe, expect, it } from "vitest";

import {
  MORPHOLOGY_CASE_CORPUS_IDS_V1,
  MORPHOLOGY_CASE_CORPUS_V1,
  morphologyCorpusCaseDocumentV1,
} from "@/tools/myocardium/morphologyCaseCorpusV1";

/**
 * The corpus replaced the retired teaching-case catalogue as the diagnostic's
 * input. These assertions are what keep it a numerical fixture: the same four
 * scenarios with the same instances, and none of the teaching content the
 * catalogue carried.
 */
describe("morphology case corpus V1", () => {
  it("carries exactly the four scenarios the diagnostic runs", () => {
    expect(MORPHOLOGY_CASE_CORPUS_V1.map((entry) => entry.id))
      .toEqual([...MORPHOLOGY_CASE_CORPUS_IDS_V1]);
    expect([...MORPHOLOGY_CASE_CORPUS_IDS_V1]).toEqual([
      "normal-sinus",
      "acute-anterior-mi",
      "systolic-heart-failure",
      "lv-failure-dobutamine",
    ]);
  });

  it("pins each scenario's instances exactly, values included", () => {
    // Names alone would let a knob value or an intervention drift while the
    // contract still passed, and the diagnostic's physiology would move with
    // it. The whole instance is pinned.
    expect(MORPHOLOGY_CASE_CORPUS_V1.map((entry) => [
      entry.id,
      entry.schemaVersion,
      entry.engineVersion,
      entry.knobMappingVersion,
      entry.solver,
      entry.instances,
    ])).toMatchSnapshot();
  });

  it("carries no teaching content, and its documents add none", () => {
    for (const entry of MORPHOLOGY_CASE_CORPUS_V1) {
      // The corpus type has no room for them, so this guards a widening.
      const loose = entry as unknown as Record<string, unknown>;
      for (const forbidden of [
        "notes",
        "panels",
        "reading",
        "i18n",
        "spec",
        "exposedControllers",
        "lesson",
        "views",
      ]) {
        expect(loose[forbidden]).toBeUndefined();
      }

      const doc = morphologyCorpusCaseDocumentV1(entry);
      expect(doc.panels).toEqual([]);
      expect(doc.notes).toBeUndefined();
      expect(doc.reading).toBeUndefined();
      expect(doc.i18n).toBeUndefined();
      expect(doc.spec.description).toBe("");
      expect(doc.spec.modelLimitations).toEqual([]);
      expect(doc.meta.id).toBe(entry.id);
    }
  });
});
