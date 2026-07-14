import { describe, expect, it } from "vitest";

import {
  NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_CANDIDATES_V1,
  NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1,
  buildNoAvpdAtrialMorphologyOwnerParamsV1,
} from "@/engine/mechanics2/benches/NoAvpdAtrialMorphologyOwnerScreenV1";
import {
  DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1,
  initialNoAvpdFourChamberHillTriSegStateV1,
  stepNoAvpdFourChamberHillTriSegV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFourChamberHillTriSegV1";

describe("NoAvpdAtrialMorphologyOwnerScreenV1", () => {
  it("predeclares the shared baseline and exactly three LA-owner OFAT candidates", () => {
    expect(
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_CANDIDATES_V1.map(
        (candidate) => candidate.candidateId,
      ),
    ).toEqual(["B", "V1", "A1", "A2"]);
    expect(
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.comparisonPolicy
        .eaSeparationObjectiveApplied,
    ).toBe(false);
    expect(
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.comparisonPolicy
        .eaSeparationGateApplied,
    ).toBe(false);
    expect(
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.timeStepConfirmation
        .automaticWinnerSelection,
    ).toBe(false);
    expect(
      NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_SCREEN_PROTOCOL_V1.timeStepConfirmation
        .currentStatus,
    ).toBe("not-run-no-candidate-promoted");
  });

  it("changes only the declared LA SLS owner in V1", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const candidate = buildNoAvpdAtrialMorphologyOwnerParamsV1("V1");
    expect(candidate.atria.left.material.sls.modulusPa).toBe(8_000);
    expect(candidate.atria.left.material.sls.relaxationTimeSec).toBe(
      baseline.atria.left.material.sls.relaxationTimeSec,
    );
    expect(candidate.atria.left.geometry).toBe(baseline.atria.left.geometry);
    expect(candidate.atria.right).toBe(baseline.atria.right);
    expect(candidate.calciumDrivers).toBe(baseline.calciumDrivers);
    expect(candidate.triSeg).toBe(baseline.triSeg);
    expect(candidate.vascular).toBe(baseline.vascular);
    expect(candidate.valves).toBe(baseline.valves);
  });

  it("scales every LA calcium decay anchor so the HR60 value is 90 ms in A1", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const candidate = buildNoAvpdAtrialMorphologyOwnerParamsV1("A1");
    const scale = 0.09 / 0.105;
    candidate.calciumDrivers.leftAtrium.calcium.rateTargets.forEach(
      (target, index) => {
        expect(target.decayHalfTimeSec).toBeCloseTo(
          baseline.calciumDrivers.leftAtrium.calcium.rateTargets[index]!
            .decayHalfTimeSec * scale,
          14,
        );
      },
    );
    expect(
      candidate.calciumDrivers.leftAtrium.calcium.rateTargets.find(
        (target) => target.cycleLengthSec === 1,
      )?.decayHalfTimeSec,
    ).toBeCloseTo(0.09, 14);
    expect(candidate.calciumDrivers.rightAtrium).toBe(
      baseline.calciumDrivers.rightAtrium,
    );
    expect(candidate.calciumDrivers.leftFreeWall).toBe(
      baseline.calciumDrivers.leftFreeWall,
    );
    expect(candidate.atria).toBe(baseline.atria);
    expect(candidate.triSeg).toBe(baseline.triSeg);
    expect(candidate.vascular).toBe(baseline.vascular);
    expect(candidate.valves).toBe(baseline.valves);
  });

  it("changes only the LA thin-filament sigmoid sharpness in A2", () => {
    const baseline = DEFAULT_NO_AVPD_FOUR_CHAMBER_HILL_TRISEG_PARAMS_V1;
    const candidate = buildNoAvpdAtrialMorphologyOwnerParamsV1("A2");
    expect(
      candidate.atria.left.material.calciumTroponinActivation
        .thinFilamentCooperativity,
    ).toBe(2.2);
    expect(candidate.atria.left.material.sls).toEqual(
      baseline.atria.left.material.sls,
    );
    expect(candidate.atria.left.material.contractileElement).toEqual(
      baseline.atria.left.material.contractileElement,
    );
    expect(candidate.atria.left.geometry).toBe(baseline.atria.left.geometry);
    expect(candidate.atria.right).toBe(baseline.atria.right);
    expect(candidate.calciumDrivers).toBe(baseline.calciumDrivers);
    expect(candidate.triSeg).toBe(baseline.triSeg);
    expect(candidate.vascular).toBe(baseline.vascular);
    expect(candidate.valves).toBe(baseline.valves);
  });

  it("accepts the first 5 ms transactional step for every candidate", () => {
    for (const candidate of NO_AVPD_ATRIAL_MORPHOLOGY_OWNER_CANDIDATES_V1) {
      const params = buildNoAvpdAtrialMorphologyOwnerParamsV1(
        candidate.candidateId,
      );
      const initial = initialNoAvpdFourChamberHillTriSegStateV1(params);
      const output = stepNoAvpdFourChamberHillTriSegV1(initial, 0.005, params);
      expect(output.accepted, candidate.candidateId).toBe(true);
      expect(output.failureReasons, candidate.candidateId).toEqual([]);
    }
  });
});
