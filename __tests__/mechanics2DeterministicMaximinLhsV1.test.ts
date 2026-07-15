import { describe, expect, it } from "vitest";

import {
  generateDeterministicMaximinLhsV1,
  minimumPairwiseDistanceV1,
} from "@/engine/mechanics2/envelope/DeterministicMaximinLhsV1";
import protocol from
  "@/data/mechanics2/protocols/five-patch-model-envelope-v1.json";

const options = {
  sampleCount: protocol.design.sampleCount,
  dimensionCount: protocol.design.dimensionCount,
  candidateSeeds: protocol.design.candidateSeeds,
};

describe("DeterministicMaximinLhsV1", () => {
  it("pins the committed 64 x 16 maximin design", () => {
    const first = generateDeterministicMaximinLhsV1(options);
    const repeated = generateDeterministicMaximinLhsV1(options);

    expect(first).toEqual(repeated);
    expect(first.sampleCount).toBe(64);
    expect(first.dimensionCount).toBe(16);
    expect(first.points).toHaveLength(64);
    expect(first.points.every((point) => point.length === 16)).toBe(true);
    expect(first.selectedSeed).toBe(protocol.design.selectedSeed);
    expect(first.selectedMinimumPairwiseDistance).toBeCloseTo(
      protocol.design.selectedMinimumPairwiseDistance,
      14,
    );
    expect(minimumPairwiseDistanceV1(first.points)).toBe(
      first.selectedMinimumPairwiseDistance,
    );
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.points)).toBe(true);
    expect(Object.isFrozen(first.points[0])).toBe(true);
  });

  it("occupies each Latin stratum exactly once in every dimension", () => {
    const design = generateDeterministicMaximinLhsV1(options);
    for (let dimension = 0; dimension < design.dimensionCount; dimension += 1) {
      const strata = design.points
        .map((point) => {
          expect(point[dimension]).toBeGreaterThan(0);
          expect(point[dimension]).toBeLessThan(1);
          return Math.floor(point[dimension]! * design.sampleCount);
        })
        .sort((left, right) => left - right);
      expect(strata).toEqual(
        Array.from({ length: design.sampleCount }, (_, index) => index),
      );
    }
  });

  it("selects the geometric maximin candidate without model outcomes", () => {
    const selected = generateDeterministicMaximinLhsV1(options);
    const candidateDistances = options.candidateSeeds.map((seed) =>
      generateDeterministicMaximinLhsV1({
        sampleCount: options.sampleCount,
        dimensionCount: options.dimensionCount,
        candidateSeeds: [seed],
      }).selectedMinimumPairwiseDistance
    );
    expect(selected.selectedMinimumPairwiseDistance).toBe(
      Math.max(...candidateDistances),
    );
  });

  it("rejects malformed or duplicate design inputs", () => {
    expect(() => generateDeterministicMaximinLhsV1({
      sampleCount: 1,
      dimensionCount: 2,
      candidateSeeds: [1],
    })).toThrow(/sampleCount/);
    expect(() => generateDeterministicMaximinLhsV1({
      sampleCount: 2,
      dimensionCount: 0,
      candidateSeeds: [1],
    })).toThrow(/dimensionCount/);
    expect(() => generateDeterministicMaximinLhsV1({
      sampleCount: 2,
      dimensionCount: 2,
      candidateSeeds: [1, 1],
    })).toThrow(/unique/);
  });
});
