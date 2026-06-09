import { describe, expect, it } from "vitest";
import { buildStarlingSweepFit } from "@/engine/starlingFit";
import type { GuytonCurvePoint } from "@/engine/guytonStarling";

describe("Starling sweep fit", () => {
  it("builds a finite monotone measured-range PCHIP fit", () => {
    const fit = buildStarlingSweepFit("left", points([
      [2, 3.8, -600],
      [4, 5.0, -300],
      [7, 5.8, 0],
      [11, 6.1, 300],
    ]));

    expect(fit?.kind).toBe("monotone-pchip");
    expect(fit?.sourcePointCount).toBe(4);
    expect(fit?.points.length).toBeGreaterThan(20);
    expect(fit?.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    expectSorted(fit?.points ?? []);
    expectMonotone(fit?.points ?? []);
    expect(fit?.extrapolatedLeft).toBeUndefined();
    expect(fit?.extrapolatedRight).toBeUndefined();
  });

  it("excludes unsettled and non-ok points from the fit", () => {
    const fit = buildStarlingSweepFit("right", [
      ...points([
        [1, 4.5, -300],
        [4, 5.6, 0],
        [8, 6.0, 300],
      ]),
      { x: 12, y: 9, deltaVolumeMl: 600, settled: false, status: "ok" },
      { x: 15, y: 12, deltaVolumeMl: 900, settled: true, status: "warning" },
    ]);

    expect(fit?.sourcePointCount).toBe(3);
    expect(fit?.points.at(-1)?.x).toBeCloseTo(8);
  });

  it("uses isotonic smoothing before interpolation when raw points dip", () => {
    const fit = buildStarlingSweepFit("left", points([
      [2, 4.0, -300],
      [5, 5.3, 0],
      [8, 5.1, 300],
      [12, 6.2, 600],
    ]));

    expect(fit).toBeDefined();
    expectMonotone(fit?.points ?? []);
  });

  it("requires three usable unique pressure points", () => {
    const fit = buildStarlingSweepFit("left", [
      ...points([
        [3, 4.5, -300],
        [5, 5.0, 0],
      ]),
      { x: 8, y: 6.0, deltaVolumeMl: 300, settled: false, status: "ok" },
    ]);

    expect(fit).toBeUndefined();
  });

  it("adds conservative extrapolated tails only when requested", () => {
    const partial = buildStarlingSweepFit("left", points([
      [3, 4.5, -300],
      [6, 5.3, 0],
      [10, 5.9, 300],
    ]));
    const final = buildStarlingSweepFit("left", points([
      [3, 4.5, -300],
      [6, 5.3, 0],
      [10, 5.9, 300],
    ]), { includeExtrapolation: true });

    expect(partial?.extrapolatedLeft).toBeUndefined();
    expect(partial?.extrapolatedRight).toBeUndefined();
    expect(final?.extrapolatedLeft?.[0].x).toBeCloseTo(0);
    expect(final?.extrapolatedRight?.at(-1)?.x).toBeCloseTo(30);
  });
});

function points(values: Array<[number, number, number]>): GuytonCurvePoint[] {
  return values.map(([x, y, deltaVolumeMl]) => ({
    x,
    y,
    deltaVolumeMl,
    settled: true,
    status: "ok",
  }));
}

function expectSorted(points: GuytonCurvePoint[]): void {
  for (let i = 1; i < points.length; i++) expect(points[i].x).toBeGreaterThanOrEqual(points[i - 1].x);
}

function expectMonotone(points: GuytonCurvePoint[]): void {
  for (let i = 1; i < points.length; i++) expect(points[i].y).toBeGreaterThanOrEqual(points[i - 1].y - 1e-9);
}
