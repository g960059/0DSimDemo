import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import {
  structuralLinearGuyton,
  type VascularReturnSnapshot,
} from "@/engine/guytonVascular";

describe("Guyton vascular structural helpers", () => {
  it("matches the linear RC filling pressure and return resistance", () => {
    const snapshot = linearSnapshot();
    const result = structuralLinearGuyton(snapshot, [0, 2, 4]);

    expect(result.fillingPressureAbsMmHg).toBeCloseTo((120 + 10 * 2 + 20 * 0) / 30, 8);
    expect(result.resistanceMmHgPerLMin).toBeCloseTo((7 / 30) * 1000 / 60, 8);
    expect(result.curve.source).toBe("structural-linearized");
  });

  it("does not use instantaneous node pressure fields as a closed-loop flow proxy", () => {
    const snapshot = linearSnapshot();
    const shiftedPressureSnapshot: VascularReturnSnapshot = {
      ...snapshot,
      nodesDownstreamToUpstream: snapshot.nodesDownstreamToUpstream.map((node) => ({
        ...node,
        Pabs: node.Pabs + 12,
        Ptm: node.Ptm + 12,
      })),
    };

    expect(structuralLinearGuyton(shiftedPressureSnapshot, []).fillingPressureAbsMmHg)
      .toBeCloseTo(structuralLinearGuyton(snapshot, []).fillingPressureAbsMmHg, 12);
  });

  it("shifts filling pressure upward when stressed volume rises", () => {
    const snapshot = linearSnapshot();
    const loaded: VascularReturnSnapshot = {
      ...snapshot,
      totalStressedVolumeMl: snapshot.totalStressedVolumeMl + 30,
      nodesDownstreamToUpstream: snapshot.nodesDownstreamToUpstream.map((node, index) => index === 0
        ? { ...node, stressedVolumeMl: node.stressedVolumeMl + 30, volumeMl: node.volumeMl + 30 }
        : node),
    };

    expect(structuralLinearGuyton(loaded, []).fillingPressureAbsMmHg)
      .toBeGreaterThan(structuralLinearGuyton(snapshot, []).fillingPressureAbsMmHg);
  });

  it("returns finite right and left vascular snapshots from ModelCore", () => {
    const core = new ModelCore(DEFAULT_PARAMS);

    const right = core.vascularReturnSnapshot("right");
    const left = core.vascularReturnSnapshot("left");

    expect(right.nodesDownstreamToUpstream.map((node) => node.name)).toEqual(["VC", "SV", "Cap", "Art", "SA", "Ao"]);
    expect(right.edgesDownstreamToUpstream.map((edge) => edge.name)).toEqual(["VC_RA", "SV_VC", "Cap_SV", "Art_Cap", "SA_Art", "Ao_SA"]);
    expect(left.nodesDownstreamToUpstream.map((node) => node.name)).toEqual(["PVein", "PVen", "PCap"]);
    expect(left.edgesDownstreamToUpstream.map((edge) => edge.name)).toEqual(["PVein_LA", "PVen_PVein", "PCap_PVen"]);

    for (const snapshot of [right, left]) {
      expect(snapshot.totalStressedVolumeMl).toBeGreaterThan(0);
      expect(snapshot.totalComplianceMlPerMmHg).toBeGreaterThan(0);
      for (const node of snapshot.nodesDownstreamToUpstream) {
        expect(Number.isFinite(node.Pabs)).toBe(true);
        expect(Number.isFinite(node.Ptm)).toBe(true);
        expect(Number.isFinite(node.Pext)).toBe(true);
        expect(Number.isFinite(node.stressedVolumeMl)).toBe(true);
        expect(node.complianceEffMlPerMmHg).toBeGreaterThan(0);
      }
      for (const edge of snapshot.edgesDownstreamToUpstream) {
        expect(edge.R_mmHg_s_per_mL).toBeGreaterThan(0);
        expect(edge.B_mmHg_s2_per_mL2).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("samples a finite monotone decreasing structural return curve", () => {
    const result = structuralLinearGuyton(linearSnapshot(), [-2, 0, 2, 4, 6]);

    expect(result.curve.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    for (let i = 1; i < result.curve.points.length; i++) {
      expect(result.curve.points[i].y).toBeLessThanOrEqual(result.curve.points[i - 1].y + 1e-9);
    }
  });
});

function linearSnapshot(): VascularReturnSnapshot {
  return {
    side: "right",
    downstreamNode: "RA",
    nodesDownstreamToUpstream: [
      {
        name: "V1",
        kind: "linear",
        Pabs: 6,
        Ptm: 4,
        Pext: 2,
        volumeMl: 40,
        unstressedVolumeMl: 0,
        stressedVolumeMl: 40,
        complianceEffMlPerMmHg: 10,
        law: { kind: "linear", Vu: 0, C: 10 },
      },
      {
        name: "V2",
        kind: "linear",
        Pabs: 4,
        Ptm: 4,
        Pext: 0,
        volumeMl: 80,
        unstressedVolumeMl: 0,
        stressedVolumeMl: 80,
        complianceEffMlPerMmHg: 20,
        law: { kind: "linear", Vu: 0, C: 20 },
      },
    ],
    edgesDownstreamToUpstream: [
      {
        name: "V1_RA",
        up: "V1",
        down: "RA",
        R_mmHg_s_per_mL: 0.1,
        B_mmHg_s2_per_mL2: 0,
        waterfall: false,
        Pext: 0,
        Pcrit: 0,
      },
      {
        name: "V2_V1",
        up: "V2",
        down: "V1",
        R_mmHg_s_per_mL: 0.2,
        B_mmHg_s2_per_mL2: 0,
        waterfall: false,
        Pext: 0,
        Pcrit: 0,
      },
    ],
    totalStressedVolumeMl: 120,
    totalUnstressedVolumeMl: 0,
    totalComplianceMlPerMmHg: 30,
    externalPressureWeightedMmHg: 20 / 30,
  };
}
