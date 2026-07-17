import { describe, expect, it } from "vitest";

import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

describe("five-wall normal prescribed calcium drive V1", () => {
  it("is periodic, finite, and exactly shared within each tissue class", () => {
    const first = evaluateFiveWallNormalCalciumDriveV1(0.137);
    const nextCycle = evaluateFiveWallNormalCalciumDriveV1(1.137);
    expect(nextCycle.freeCalciumUMByWall).toEqual(first.freeCalciumUMByWall);
    expect(first.freeCalciumUMByWall.LA).toBe(first.freeCalciumUMByWall.RA);
    expect(first.freeCalciumUMByWall.LVFW).toBe(first.freeCalciumUMByWall.SEP);
    expect(first.freeCalciumUMByWall.SEP).toBe(first.freeCalciumUMByWall.RVFW);
    expect(first.finite).toBe(true);
  });

  it("reaches the declared diastolic floor and peak amplitude", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const samples = Array.from({ length: 20_001 }, (_, index) =>
      evaluateFiveWallNormalCalciumDriveV1(index / 20_000));
    const atrial = samples.map((sample) => sample.freeCalciumUMByWall.LA);
    const ventricular = samples.map((sample) => sample.freeCalciumUMByWall.LVFW);
    expect(Math.min(...atrial)).toBeCloseTo(p.atrial.diastolicCalciumUM, 10);
    expect(Math.max(...atrial)).toBeCloseTo(
      p.atrial.diastolicCalciumUM + p.atrial.peakAmplitudeUM,
      6,
    );
    expect(Math.min(...ventricular)).toBeCloseTo(
      p.ventricular.diastolicCalciumUM,
      10,
    );
    expect(Math.max(...ventricular)).toBeCloseTo(
      p.ventricular.diastolicCalciumUM + p.ventricular.peakAmplitudeUM,
      6,
    );
  });

  it("places the atrial pulse before the ventricular pulse by the AV delay", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const atAtrialOnset = evaluateFiveWallNormalCalciumDriveV1(
      p.cycleLengthSec - p.atrioventricularDelaySec +
        p.atrial.electricalToCalciumDelaySec,
    );
    const atVentricularOnset = evaluateFiveWallNormalCalciumDriveV1(
      p.cycleLengthSec + p.ventricular.electricalToCalciumDelaySec,
    );
    expect(atAtrialOnset.atrialNormalizedPulse01).toBeCloseTo(0, 12);
    expect(atVentricularOnset.ventricularNormalizedPulse01).toBeCloseTo(0, 12);
    expect(atVentricularOnset.atrialTimeSinceCalciumOnsetSec)
      .toBeCloseTo(p.atrioventricularDelaySec, 12);
  });

  it("declares no mechanical feedback or PV morphology input", () => {
    const output = evaluateFiveWallNormalCalciumDriveV1(0.5);
    const forbiddenInputs = ["volume", "pressure", "flow", "strain"];
    expect(forbiddenInputs.every((name) => !Object.hasOwn(output, name))).toBe(true);
    expect(output.claim.pvLoopMorphologyFitAllowed).toBe(false);
    expect(output.claim.conservedCalciumCyclingClaimed).toBe(false);
  });

  it("allows an exact zero transient amplitude for loss-of-drive cases", () => {
    const p = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const noAtrialPulse = {
      ...p,
      parameterSetId: "zero-atrial-calcium-pulse-v1",
      atrial: { ...p.atrial, peakAmplitudeUM: 0 },
    };
    for (const timeSec of [0, 0.25, 0.5, 0.75, 1]) {
      const output = evaluateFiveWallNormalCalciumDriveV1(timeSec, noAtrialPulse);
      expect(output.freeCalciumUMByWall.LA).toBe(p.atrial.diastolicCalciumUM);
      expect(output.freeCalciumUMByWall.RA).toBe(p.atrial.diastolicCalciumUM);
      expect(output.claim.exactZeroPulseAmplitudeAllowed).toBe(true);
    }
  });
});
