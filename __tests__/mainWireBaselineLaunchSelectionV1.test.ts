import { describe, expect, it } from "vitest";
import { requireQualifiedBaselineLaunchSelectionV1 } from "@/tools/scientific/mainWireBaselineLaunchSelectionV1";

describe("baseline launch selection", () => {
  const selection = () => ({ executionCommit: "a".repeat(40), baselineAdopted: false, qualifiedCandidateIndex: 3,
    qualificationResults: [{ index: 3, qualified: true,
      modes: ["refined", "reserve", "hr60", "cold"].map((mode) => ({ mode, qualified: true,
        resultPath: `3.qualification-${mode}.json` })) }] });
  it("requires the four current conditions, without afterload", () => {
    expect(requireQualifiedBaselineLaunchSelectionV1(selection(), 70)).toEqual({
      index: 3, modes: ["refined", "reserve", "hr60", "cold"], executionCommit: "a".repeat(40),
    });
  });
  it("rejects cold failure, missing HR, duplicate modes and another candidate", () => {
    const mutations = [
      (v: any) => { v.qualificationResults[0].modes[3].qualified = false; },
      (v: any) => { v.qualificationResults[0].modes.splice(2, 1); },
      (v: any) => { v.qualificationResults[0].modes[2] = v.qualificationResults[0].modes[1]; },
      (v: any) => { v.qualificationResults[0].modes[0].resultPath = "4.qualification-refined.json"; },
      (v: any) => { v.qualifiedCandidateIndex = null; },
      (v: any) => { v.qualificationResults[0].qualified = false; },
      (v: any) => { v.qualificationResults.push(v.qualificationResults[0]); },
    ];
    for (const mutate of mutations) {
      const result = selection(); mutate(result);
      expect(() => requireQualifiedBaselineLaunchSelectionV1(result, 70)).toThrow(/complete qualified/);
    }
    expect(() => requireQualifiedBaselineLaunchSelectionV1(selection(), 60)).toThrow();
  });
});
