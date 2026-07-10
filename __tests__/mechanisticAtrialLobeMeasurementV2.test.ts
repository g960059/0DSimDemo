import { describe, expect, it } from "vitest";

import {
  measureLaPvTwoLobesV2,
  type LaPvLobePointV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";

function bowtie(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
    { laVolumeMl: 1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: -1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
  ];
}

function sampledVertexBowtie(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: 0, laActivation01: 0.5, phase: "transition" },
    { laVolumeMl: 1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: -1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
  ];
}

function resampledSampledVertexBowtie(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
    { laVolumeMl: -0.5, laPressureMmHg: -0.5, laActivation01: 0.25, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: 0, laActivation01: 0.5, phase: "transition" },
    { laVolumeMl: 0.5, laPressureMmHg: 0.5, laActivation01: 0.75, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: -1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
  ];
}

function bothBranchesReachMaxActivation(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: 0, laActivation01: 0, phase: "transition" },
    { laVolumeMl: 1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: -1, laPressureMmHg: 1, laActivation01: 1, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: -1, laActivation01: 1, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: -1, laActivation01: 0, phase: "reservoir" },
  ];
}

function partialActivationCoverageBowtie(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -1, laActivation01: 1, phase: "reservoir" },
    { laVolumeMl: 1, laPressureMmHg: 1, phase: "pumping" },
    { laVolumeMl: -1, laPressureMmHg: 1, phase: "pumping" },
    { laVolumeMl: 1, laPressureMmHg: -1, laActivation01: 1, phase: "reservoir" },
  ];
}

function endpointKiss(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -0.2, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: 0, phase: "transition" },
    { laVolumeMl: -1, laPressureMmHg: 0.8, phase: "reservoir" },
    { laVolumeMl: 1, laPressureMmHg: 0.8, phase: "pumping" },
    { laVolumeMl: 0, laPressureMmHg: 0, phase: "transition" },
    { laVolumeMl: 1, laPressureMmHg: -0.2, phase: "pumping" },
  ];
}

function endpointCuspAgainstSegment(): readonly LaPvLobePointV2[] {
  return [
    { laVolumeMl: -1, laPressureMmHg: -0.2, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: 0, phase: "transition" },
    { laVolumeMl: -1, laPressureMmHg: 0.8, phase: "reservoir" },
    { laVolumeMl: 0, laPressureMmHg: -1, phase: "pumping" },
    { laVolumeMl: 0, laPressureMmHg: 1, phase: "pumping" },
  ];
}

function roundedPath(path: readonly { readonly laVolumeMl: number; readonly laPressureMmHg: number }[]) {
  return path.map((point) => [
    Number(point.laVolumeMl.toFixed(6)),
    Number(point.laPressureMmHg.toFixed(6)),
  ]);
}

describe("mechanistic atrial lobe measurement v2", () => {
  it("extracts opposed A and v lobes from a canonical periodic figure-eight", () => {
    const result = measureLaPvTwoLobesV2(bowtie());

    expect(result.status).toBe("measurable");
    if (result.status !== "measurable") throw new Error(result.reason);

    expect(result.selfIntersectionCount).toBe(1);
    expect(result.crossing.volumeMl).toBeCloseTo(0);
    expect(result.crossing.pressureMmHg).toBeCloseTo(0);
    expect(result.crossing.angleDeg).toBeCloseTo(90);
    expect(result.aLobe.areaMmHgMl).toBeCloseTo(1);
    expect(result.vLobe.areaMmHgMl).toBeCloseTo(1);
    expect(result.aLobe.signedAreaMmHgMl * result.vLobe.signedAreaMmHgMl)
      .toBeLessThan(0);
    expect(result.opposedLobeOrientation).toBe(true);
    expect(result.aLobe.maxActivation01).toBe(1);
    expect(result.vLobe.maxActivation01).toBe(0);
  });

  it("clusters a true crossing sampled as a nonadjacent endpoint", () => {
    const sampled = measureLaPvTwoLobesV2(sampledVertexBowtie());
    const resampled = measureLaPvTwoLobesV2(resampledSampledVertexBowtie());

    expect(sampled.status).toBe("measurable");
    expect(resampled.status).toBe("measurable");
    if (sampled.status !== "measurable") throw new Error(sampled.reason);
    if (resampled.status !== "measurable") throw new Error(resampled.reason);

    expect(sampled.selfIntersectionCount).toBe(1);
    expect(sampled.rawSelfIntersectionCount).toBeGreaterThan(1);
    expect(sampled.crossing.rawIntersectionCount).toBe(sampled.rawSelfIntersectionCount);
    expect(sampled.crossing.volumeMl).toBeCloseTo(0);
    expect(sampled.crossing.pressureMmHg).toBeCloseTo(0);
    expect(resampled.selfIntersectionCount).toBe(1);
    expect(resampled.rawSelfIntersectionCount).toBeGreaterThan(1);
    expect(resampled.crossing.volumeMl).toBeCloseTo(sampled.crossing.volumeMl);
    expect(resampled.crossing.pressureMmHg).toBeCloseTo(sampled.crossing.pressureMmHg);
    expect(resampled.aLobe.areaMmHgMl).toBeCloseTo(sampled.aLobe.areaMmHgMl);
    expect(resampled.vLobe.areaMmHgMl).toBeCloseTo(sampled.vLobe.areaMmHgMl);
  });

  it("selects the A lobe by weighted activation burden before max activation", () => {
    const result = measureLaPvTwoLobesV2(bothBranchesReachMaxActivation());

    expect(result.status).toBe("measurable");
    if (result.status !== "measurable") throw new Error(result.reason);

    expect(result.selectionEvidenceSource).toBe("activation-burden");
    expect(result.activationEvidenceCoverage01).toBe(1);
    expect(result.aLobe.maxActivation01).toBe(1);
    expect(result.vLobe.maxActivation01).toBe(1);
    expect(result.aLobe.activationBurden01).toBeGreaterThan(
      result.vLobe.activationBurden01,
    );
    expect(roundedPath(result.aLobe.path)).toContainEqual([-1, 1]);
    expect(roundedPath(result.vLobe.path)).toContainEqual([1, -1]);
  });

  it("falls back to pumping evidence when activation coverage is partial", () => {
    const result = measureLaPvTwoLobesV2(partialActivationCoverageBowtie());

    expect(result.status).toBe("measurable");
    if (result.status !== "measurable") throw new Error(result.reason);

    expect(result.selectionEvidenceSource).toBe("pumping-fraction");
    expect(result.activationEvidenceCoverage01).toBeLessThan(0.95);
    expect(result.aLobe.pumpingFraction01).toBeGreaterThan(result.vLobe.pumpingFraction01);
    expect(roundedPath(result.aLobe.path)).toContainEqual([1, 1]);
    expect(roundedPath(result.aLobe.path)).toContainEqual([-1, 1]);
  });

  it("returns explicit non-measurable output when there is no self-intersection", () => {
    const result = measureLaPvTwoLobesV2([
      { laVolumeMl: 0, laPressureMmHg: 0, laActivation01: 0 },
      { laVolumeMl: 1, laPressureMmHg: 0, laActivation01: 1 },
      { laVolumeMl: 1, laPressureMmHg: 1, laActivation01: 1 },
      { laVolumeMl: 0, laPressureMmHg: 1, laActivation01: 0 },
    ]);

    expect(result).toMatchObject({
      status: "not-measurable",
      reason: "no-self-intersection",
      selfIntersectionCount: 0,
      opposedLobeOrientation: false,
    });
  });

  it("rejects multiple and degenerate self-intersections conservatively", () => {
    const multiple = measureLaPvTwoLobesV2([
      { laVolumeMl: 0, laPressureMmHg: 1, laActivation01: 1 },
      { laVolumeMl: 0.588, laPressureMmHg: -0.809, laActivation01: 0 },
      { laVolumeMl: -0.951, laPressureMmHg: 0.309, laActivation01: 1 },
      { laVolumeMl: 0.951, laPressureMmHg: 0.309, laActivation01: 0 },
      { laVolumeMl: -0.588, laPressureMmHg: -0.809, laActivation01: 0 },
    ]);
    const degenerate = measureLaPvTwoLobesV2([
      { laVolumeMl: 0, laPressureMmHg: 0, laActivation01: 0 },
      { laVolumeMl: 2, laPressureMmHg: 0, laActivation01: 1 },
      { laVolumeMl: 1, laPressureMmHg: 0, laActivation01: 1 },
      { laVolumeMl: 3, laPressureMmHg: 0, laActivation01: 0 },
      { laVolumeMl: 3, laPressureMmHg: 1, laActivation01: 0 },
      { laVolumeMl: 0, laPressureMmHg: 1, laActivation01: 0 },
    ]);

    expect(multiple.status).toBe("not-measurable");
    expect(multiple.reason).toBe("multiple-self-intersections");
    expect(multiple.selfIntersectionCount).toBeGreaterThan(1);
    expect(multiple.rawSelfIntersectionCount).toBeGreaterThanOrEqual(
      multiple.selfIntersectionCount,
    );
    expect(multiple.crossings).toHaveLength(multiple.selfIntersectionCount);
    expect(new Set(multiple.crossings.map((crossing) =>
      `${crossing.volumeMl.toFixed(4)}:${crossing.pressureMmHg.toFixed(4)}`
    )).size).toBe(multiple.selfIntersectionCount);
    expect(multiple.crossingSummaryTruncated).toBe(false);
    expect(degenerate).toMatchObject({
      status: "not-measurable",
      reason: "degenerate-self-intersection",
      opposedLobeOrientation: false,
    });
  });

  it("rejects non-parallel endpoint kisses and cusps without side alternation", () => {
    const kiss = measureLaPvTwoLobesV2(endpointKiss());
    const cusp = measureLaPvTwoLobesV2(endpointCuspAgainstSegment());

    expect(kiss).toMatchObject({
      status: "not-measurable",
      reason: "degenerate-self-intersection",
      opposedLobeOrientation: false,
    });
    expect(cusp).toMatchObject({
      status: "not-measurable",
      reason: "degenerate-self-intersection",
      opposedLobeOrientation: false,
    });
  });

  it("uses inserted intersection points instead of a synthetic phase-closing chord", () => {
    const result = measureLaPvTwoLobesV2(bowtie());

    expect(result.status).toBe("measurable");
    if (result.status !== "measurable") throw new Error(result.reason);

    expect(roundedPath(result.aLobe.path)).toEqual([
      [0, 0],
      [1, 1],
      [-1, 1],
      [0, 0],
    ]);
    expect(roundedPath(result.vLobe.path)).toEqual([
      [0, 0],
      [1, -1],
      [-1, -1],
      [0, 0],
    ]);
    expect(result.aLobe.path.at(0)).toEqual(result.aLobe.path.at(-1));
    expect(result.vLobe.path.at(0)).toEqual(result.vLobe.path.at(-1));
  });

  it("handles a 1600-sample non-intersecting loop without path dumping", () => {
    const ellipse = Array.from({ length: 1600 }, (_, index): LaPvLobePointV2 => {
      const theta = index / 1600;
      const angle = 2 * Math.PI * theta;
      return {
        theta,
        laVolumeMl: 70 + 5 * Math.cos(angle),
        laPressureMmHg: 10 + 2 * Math.sin(angle),
        laActivation01: 0,
        phase: theta > 0.75 ? "pumping" : "reservoir",
      };
    });
    const result = measureLaPvTwoLobesV2(ellipse);

    expect(result).toMatchObject({
      status: "not-measurable",
      reason: "no-self-intersection",
      selfIntersectionCount: 0,
      rawSelfIntersectionCount: 0,
      crossings: [],
    });
  });
});
