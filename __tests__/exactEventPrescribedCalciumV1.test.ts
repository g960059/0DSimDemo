import { describe, expect, it } from "vitest";

import {
  advanceExactEventCalciumV1,
  applyExactEventCalciumStimulusV1,
  convertPeriodicBiexponentialToExactEventCalciumV1,
  evaluateExactEventCalciumV1,
  propagateExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

describe("exact-event prescribed calcium V1", () => {
  it("has the exact exponential semigroup between events", () => {
    const conversion = baselineAtrialConversion();
    const initial = Object.freeze([0.37, 0.91]) as ExactEventCalciumStateV1;
    const direct = propagateExactEventCalciumV1(
      initial,
      0.287,
      conversion.parameters,
    );
    const split = propagateExactEventCalciumV1(
      propagateExactEventCalciumV1(initial, 0.103, conversion.parameters),
      0.184,
      conversion.parameters,
    );

    expect(split[0]).toBeCloseTo(direct[0], 15);
    expect(split[1]).toBeCloseTo(direct[1], 15);
    expect(split[1]).toBeGreaterThanOrEqual(split[0]);
  });

  it("keeps calcium continuous while an event increments both states", () => {
    const conversion = baselineAtrialConversion();
    const before = propagateExactEventCalciumV1(
      conversion.periodicStateImmediatelyAfterEvent,
      0.137,
      conversion.parameters,
    );
    const calciumBefore = evaluateExactEventCalciumV1(
      before,
      conversion.parameters,
    ).freeCalciumUM;
    const after = applyExactEventCalciumStimulusV1(before, 0.73);
    const calciumAfter = evaluateExactEventCalciumV1(
      after,
      conversion.parameters,
    ).freeCalciumUM;

    expect(after[0] - before[0]).toBeCloseTo(0.73, 15);
    expect(after[1] - before[1]).toBeCloseTo(0.73, 15);
    expect(calciumAfter).toBeCloseTo(calciumBefore, 15);
  });

  it("adds coincident events independently of their input order", () => {
    const conversion = baselineAtrialConversion();
    const ordered = [
      { timeSec: 0.2, strength: 0.3 },
      { timeSec: 0.2, strength: 0.1 },
      { timeSec: 0.2, strength: 0.2 },
    ] as const;
    const permuted = [ordered[2], ordered[0], ordered[1]] as const;
    const first = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.7,
      ordered,
      conversion.parameters,
    );
    const second = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.7,
      permuted,
      conversion.parameters,
    );
    const combined = advanceExactEventCalciumV1(
      zeroExactEventCalciumStateV1(),
      0,
      0.7,
      [{ timeSec: 0.2, strength: 0.6 }],
      conversion.parameters,
    );

    expect(first).toEqual(second);
    expect(first[0]).toBeCloseTo(combined[0], 15);
    expect(first[1]).toBeCloseTo(combined[1], 15);
  });

  it("retains residual calcium after a dropped beat and decays toward rest without a reset", () => {
    const conversion = baselineAtrialConversion();
    const peakState = propagateExactEventCalciumV1(
      conversion.periodicStateImmediatelyAfterEvent,
      conversion.reference.timeToPeakSec,
      conversion.parameters,
    );
    const afterOneDroppedCycle = propagateExactEventCalciumV1(
      peakState,
      conversion.reference.cycleLengthSec,
      conversion.parameters,
    );
    const afterThreeDroppedCycles = propagateExactEventCalciumV1(
      peakState,
      3 * conversion.reference.cycleLengthSec,
      conversion.parameters,
    );
    const afterTwelveDroppedCycles = propagateExactEventCalciumV1(
      peakState,
      12 * conversion.reference.cycleLengthSec,
      conversion.parameters,
    );
    const calciumOne = evaluateExactEventCalciumV1(
      afterOneDroppedCycle,
      conversion.parameters,
    ).freeCalciumUM;
    const calciumThree = evaluateExactEventCalciumV1(
      afterThreeDroppedCycles,
      conversion.parameters,
    ).freeCalciumUM;
    const calciumTwelve = evaluateExactEventCalciumV1(
      afterTwelveDroppedCycles,
      conversion.parameters,
    ).freeCalciumUM;

    expect(calciumOne).toBeGreaterThan(calciumThree);
    expect(calciumThree).toBeGreaterThan(calciumTwelve);
    expect(calciumTwelve).toBeCloseTo(conversion.parameters.calciumRestUM, 15);
  });

  it("analytically reproduces all currently selected periodic tissue priors to machine precision", () => {
    const cases = [
      {
        label: "atrial Land-output baseline",
        prior: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        tissueClass: "atrial",
      },
      {
        label: "ventricular baseline",
        prior: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        tissueClass: "ventricular",
      },
    ] as const;

    for (const candidate of cases) {
      const tissue = candidate.prior[candidate.tissueClass];
      const conversion = convertPeriodicBiexponentialToExactEventCalciumV1(
        tissue,
        candidate.prior.cycleLengthSec,
      );
      let maximumAbsoluteErrorUM = 0;
      for (let index = 0; index <= 10_000; index += 1) {
        const timeSec = candidate.prior.cycleLengthSec * index / 10_000;
        const existing = evaluateFiveWallNormalCalciumDriveV1(
          timeSec,
          candidate.prior,
        );
        const timeSinceEventSec = candidate.tissueClass === "atrial"
          ? existing.atrialTimeSinceCalciumOnsetSec
          : existing.ventricularTimeSinceCalciumOnsetSec;
        const eventState = propagateExactEventCalciumV1(
          conversion.periodicStateImmediatelyAfterEvent,
          timeSinceEventSec,
          conversion.parameters,
        );
        const actualUM = evaluateExactEventCalciumV1(
          eventState,
          conversion.parameters,
        ).freeCalciumUM;
        const expectedUM = candidate.tissueClass === "atrial"
          ? existing.freeCalciumUMByWall.LA
          : existing.freeCalciumUMByWall.LVFW;
        maximumAbsoluteErrorUM = Math.max(
          maximumAbsoluteErrorUM,
          Math.abs(actualUM - expectedUM),
        );
      }
      expect(
        maximumAbsoluteErrorUM,
        `${candidate.label} maximum absolute error`,
      ).toBeLessThanOrEqual(Number.EPSILON);
    }
  });
});

function baselineAtrialConversion() {
  const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  return convertPeriodicBiexponentialToExactEventCalciumV1(
    prior.atrial,
    prior.cycleLengthSec,
  );
}
