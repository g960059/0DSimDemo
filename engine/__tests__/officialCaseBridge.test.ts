import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances } from "@/caseDoc";
import { officialCaseById } from "@/officialCases";
import { remapWorkbenchLoadIds } from "@/workbenchLoad";

describe("official case workbench bridge", () => {
  it("resolves the LV failure teaching case to two workbench instances", () => {
    const doc = officialCaseById("lv-failure-dobutamine");
    expect(doc).toBeDefined();
    expect(caseDocumentToSimInstances(doc!).length).toBe(2);
  });

  it("returns undefined for an unknown official case id", () => {
    expect(officialCaseById("bogus")).toBeUndefined();
  });

  it("remaps loaded instance ids and panel config keys away from the default id", () => {
    const doc = officialCaseById("lv-failure-dobutamine")!;
    const loaded = caseDocumentToSimInstances(doc);
    const remapped = remapWorkbenchLoadIds(loaded, doc.panels, "unit");

    expect(remapped.instances.map((inst) => inst.id)).toEqual(["cunit_1", "cunit_2"]);
    expect(remapped.activeInstanceId).toBe("cunit_1");
    expect(remapped.idMap.get("1")).toBe("cunit_1");
    expect(remapped.idMap.get("2")).toBe("cunit_2");
    expect(remapped.instances.some((inst) => inst.id === "1")).toBe(false);

    const waveform = remapped.panels.find((panel) => panel.id === "p1");
    expect(waveform).toBeDefined();
    expect(Object.keys(waveform!.config)).toEqual(["cunit_1", "cunit_2"]);
    for (const panel of remapped.panels) {
      expect(Object.keys(panel.config)).not.toContain("1");
    }
  });
});
