import { describe, expect, it } from "vitest";

import type { NoAvpdFourChamberAtrialLandReportV2 } from
  "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegBenchV2";
import { validateNoAvpdFourChamberAtrialLandDtGridV2 } from
  "@/tools/mechanics2/runNoAvpdFourChamberAtrialLandTriSegDtRefinementV2";

type GridInput = Pick<
  NoAvpdFourChamberAtrialLandReportV2,
  "protocol" | "parameterSnapshot" | "lastBeatSamples"
>;

function gridFixture(
  dtSec = 0.25,
  phases: readonly number[] = [0, 0.25, 0.5, 0.75, 1],
): GridInput {
  const cycleLengthSec = 1;
  return {
    protocol: {
      dtSec,
      stepsPerCycle: Math.round(cycleLengthSec / dtSec),
    },
    parameterSnapshot: { cycleLengthSec },
    lastBeatSamples: phases.map((phase01, index) => ({
      phase01,
      timeSec: 10 + index * 0.25,
    })),
  } as unknown as GridInput;
}

describe("No-AVPD atrial Land V2 dt-refinement grid", () => {
  it("accepts a complete monotone raw endpoint grid", () => {
    expect(validateNoAvpdFourChamberAtrialLandDtGridV2(gridFixture())).toEqual({
      stepsPerCycle: 4,
      cycleLengthSec: 1,
    });
  });

  it("rejects a metadata dt change that retains the old endpoint grid", () => {
    expect(() =>
      validateNoAvpdFourChamberAtrialLandDtGridV2(gridFixture(0.125))
    ).toThrow(/does not retain every final-beat endpoint/);
  });

  it("rejects shifted or duplicated phases", () => {
    expect(() =>
      validateNoAvpdFourChamberAtrialLandDtGridV2(
        gridFixture(0.25, [0, 0.25, 0.51, 0.75, 1]),
      )
    ).toThrow(/grid mismatch/);
    expect(() =>
      validateNoAvpdFourChamberAtrialLandDtGridV2(
        gridFixture(0.25, [0, 0.25, 0.25, 0.75, 1]),
      )
    ).toThrow(/grid mismatch|strictly increasing/);
  });
});
