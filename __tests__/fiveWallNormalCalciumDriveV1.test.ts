import { describe, expect, it } from "vitest";

import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_HUMAN_ATRIAL_CALCIUM_BIOMARKER_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_PROVENANCE_V1,
  assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1,
  evaluateFiveWallNormalCalciumDriveV1,
  resolveFiveWallNormalCalciumDriveFixedPriorV1,
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

  it("offers one fixed human-atrial calcium-biomarker timing challenger", () => {
    const baseline = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const challenger =
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_HUMAN_ATRIAL_CALCIUM_BIOMARKER_PRIOR_V1;

    expect(resolveFiveWallNormalCalciumDriveFixedPriorV1(
      "land-atrial-twitch-output",
    )).toBe(baseline);
    expect(resolveFiveWallNormalCalciumDriveFixedPriorV1(
      "human-atrial-calcium-biomarker",
    )).toBe(challenger);
    expect(challenger.cycleLengthSec).toBe(baseline.cycleLengthSec);
    expect(challenger.atrioventricularDelaySec).toBe(
      baseline.atrioventricularDelaySec,
    );
    expect(challenger.ventricular).toBe(baseline.ventricular);
    expect(challenger.atrial).toEqual({
      ...baseline.atrial,
      riseTimeConstantSec: 0.0195,
      decayTimeConstantSec: 0.233,
    });
    expect(() => assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1(
      "human-atrial-calcium-biomarker",
      challenger,
    )).not.toThrow();
    expect(() => assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1(
      "human-atrial-calcium-biomarker",
      Object.freeze({
        ...challenger,
        atrial: Object.freeze({
          ...challenger.atrial,
          peakAmplitudeUM: challenger.atrial.peakAmplitudeUM + 0.01,
        }),
      }),
    )).toThrow(/fixed params do not match registry variant/);
  });

  it("analytically reproduces the fixed human atrial TTP and RT50 biomarkers", () => {
    const challenger =
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_HUMAN_ATRIAL_CALCIUM_BIOMARKER_PRIOR_V1;
    const { timeToPeakSec, relaxationTime50Sec } = periodicBiomarkers(
      challenger.cycleLengthSec,
      challenger.atrial.riseTimeConstantSec,
      challenger.atrial.decayTimeConstantSec,
    );

    expect(timeToPeakSec * 1_000).toBeCloseTo(52.5, 1);
    expect(relaxationTime50Sec * 1_000).toBeCloseTo(177.5, 1);
    expect(FIVE_WALL_NORMAL_CALCIUM_DRIVE_PROVENANCE_V1
      .humanAtrialCalciumBiomarkerTimingSource).toMatchObject({
      doi: "10.1113/JP283974",
      construction: "analytic-periodic-biexponential-biomarker-construction",
      digitizedTraceUsed: false,
      pvLoopMorphologyFitUsed: false,
      conservedCalciumCyclingClaimed: false,
    });
  });
});

function periodicBiomarkers(
  cycleLengthSec: number,
  riseTimeConstantSec: number,
  decayTimeConstantSec: number,
): Readonly<{ timeToPeakSec: number; relaxationTime50Sec: number }> {
  const decayCarry = 1 / (1 - Math.exp(-cycleLengthSec / decayTimeConstantSec));
  const riseCarry = 1 / (1 - Math.exp(-cycleLengthSec / riseTimeConstantSec));
  const raw = (timeSec: number): number =>
    decayCarry * Math.exp(-timeSec / decayTimeConstantSec) -
    riseCarry * Math.exp(-timeSec / riseTimeConstantSec);
  const timeToPeakSec = Math.log(
    (riseCarry / riseTimeConstantSec) /
      (decayCarry / decayTimeConstantSec),
  ) / (1 / riseTimeConstantSec - 1 / decayTimeConstantSec);
  const minimum = raw(0);
  const amplitude = raw(timeToPeakSec) - minimum;
  const normalized = (timeSec: number): number =>
    (raw(timeSec) - minimum) / amplitude;
  let lowerSec = timeToPeakSec;
  let upperSec = cycleLengthSec;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const midpointSec = (lowerSec + upperSec) / 2;
    if (normalized(midpointSec) > 0.5) lowerSec = midpointSec;
    else upperSec = midpointSec;
  }
  return Object.freeze({
    timeToPeakSec,
    relaxationTime50Sec: (lowerSec + upperSec) / 2 - timeToPeakSec,
  });
}
