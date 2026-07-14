import { describe, expect, it } from "vitest";

import {
  NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1,
  buildNoAvpdPhysiologyMatrixParamsV1,
} from "@/engine/mechanics2/benches/NoAvpdPhysiologyMatrixBenchV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  stepNoAvpdFourChamberHillTriSegV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdPhysiologyMatrixBenchV1", () => {
  it("predeclares a unique baseline plus two faster LV calcium-decay candidates", () => {
    expect(NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.map(
      (candidate) => candidate.candidateId,
    )).toEqual([
      "lv-ca-decay-155ms-baseline",
      "lv-ca-decay-136ms",
      "lv-ca-decay-116ms",
    ]);
    expect(new Set(NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.map(
      (candidate) => candidate.candidateId,
    )).size).toBe(NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1.length);
  });

  it("changes only LVFW and septal decay anchors and preserves HR60 targets", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const candidate = buildNoAvpdPhysiologyMatrixParamsV1("lv-ca-decay-116ms");
    const observedDecayAnchors =
      candidate.calciumDrivers.leftFreeWall.calcium.rateTargets.map(
        (target) => target.decayHalfTimeSec,
      );
    const expectedDecayAnchors = [
      0.115 * 0.116 / 0.155,
      0.135 * 0.116 / 0.155,
      0.116,
    ];
    observedDecayAnchors.forEach((value, index) => {
      expect(value).toBeCloseTo(expectedDecayAnchors[index]!, 14);
    });
    expect(candidate.calciumDrivers.septum.calcium.rateTargets.map(
      (target) => target.decayHalfTimeSec,
    )).toEqual(observedDecayAnchors);
    expect(candidate.calciumDrivers.leftAtrium).toBe(baseline.calciumDrivers.leftAtrium);
    expect(candidate.calciumDrivers.rightAtrium).toBe(baseline.calciumDrivers.rightAtrium);
    expect(candidate.calciumDrivers.rightFreeWall).toBe(
      baseline.calciumDrivers.rightFreeWall,
    );
    expect(candidate.atria).toBe(baseline.atria);
    expect(candidate.triSeg).toBe(baseline.triSeg);
    expect(candidate.vascular).toBe(baseline.vascular);
    expect(candidate.valves).toBe(baseline.valves);
  });

  it("accepts the first transactional step for every candidate", () => {
    for (const spec of NO_AVPD_PHYSIOLOGY_MATRIX_CANDIDATES_V1) {
      const params = buildNoAvpdPhysiologyMatrixParamsV1(spec.candidateId);
      const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);
      const output = stepNoAvpdFourChamberHillTriSegV1(initial, 0.005, params);
      expect(output.accepted, spec.candidateId).toBe(true);
      expect(output.failureReasons, spec.candidateId).toEqual([]);
    }
  });
});
