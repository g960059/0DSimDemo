import { describe, expect, it } from "vitest";
import { smoothMax } from "@/engine/math";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import {
  CIRCULATION_GRAPH_KERNEL_V1_BOUNDARY,
  baseNonValveEdgeLossV1,
  buildAuthoritativeCirculationGraphV1,
  downstreamEffectivePressureV1,
  incidenceVolumeRatesFromEdgeFlowsV1,
  respiratoryExternalPressureForKindV1,
  respiratoryExternalPressuresV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import { ptmFromStressedVolume, stressedVolumeFromPtm } from "@/engine/vascularPv";

describe("circulation graph kernel V1", () => {
  it("takes the shipped buildNodes/buildEdges graph as its authoritative topology", () => {
    const graph = buildAuthoritativeCirculationGraphV1();

    expect(graph.nodes).toEqual(buildNodes());
    expect(graph.edges).toEqual(buildEdges());
    expect(graph.nodes).toHaveLength(25);
    expect(graph.edges).toHaveLength(28);
    expect(graph.nodes.map((node) => node.name).slice(0, 10)).toEqual([
      "LV", "LA", "RV", "RA", "Ao", "SA", "Art", "Cap", "SV", "VC",
    ]);
    expect(graph.edges.map((edge) => edge.name).slice(0, 15)).toEqual([
      "MV", "AoV", "TV", "PV",
      "Ao_SA", "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
      "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
    ]);
    expect(graph.nodeIndex.get("PVein")).toBe(14);
    expect(graph.edgeIndex.get("CS_RA")).toBe(27);
    expect(CIRCULATION_GRAPH_KERNEL_V1_BOUNDARY.edgeLosses)
      .toBe("base-nonvalve-noncoronary");
  });

  it("creates arterial, linear, and nonlinear venous laws from NodeSpec and the minimal runtime view", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const params = { venousTone: 0.15, arterialStiffness: 0.75 };
    const ao = vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("Ao")!]!, params);
    const cap = vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("Cap")!]!, params);
    const sv = vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("SV")!]!, params);

    expect(ao).toEqual({ kind: "arterial", Vu: 0, P0: 50, VsEff: 200 });
    expect(cap).toEqual({ kind: "linear", Vu: 0, C: 15 });
    expect(sv).toMatchObject({
      kind: "venous3",
      Vu: 1538.409,
      Ccoll: 15,
      Copen: 130,
      Cdist: 35,
      Popen: -2,
      Pstiff: 16,
      dOpen: 1.5,
      dStiff: 4,
    });
    expect(stressedVolumeFromPtm(sv, 6)).toBeCloseTo(717.3911554131162, 11);
    expect(() => vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("LV")!]!, params)).toThrow(
      "has no vascular PV law",
    );
  });

  it("round-trips inside and saturates outside the authoritative main-wire PV domains", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const params = { venousTone: 0.15, arterialStiffness: 0.75 };
    const node = graph.nodes[graph.nodeIndex.get("SV")!]!;
    const law = vascularPvLawFromNodeV1(node, params);
    if (law.kind !== "venous3") throw new Error("SV must use a venous3 law");

    for (const ptmMmHg of [-20, -5, 0, 6, 20, 45]) {
      const stressedVolumeMl = stressedVolumeFromPtm(law, ptmMmHg);
      expect(ptmFromStressedVolume(law, stressedVolumeMl)).toBeCloseTo(ptmMmHg, 7);
    }
    expect(ptmFromStressedVolume(law, stressedVolumeFromPtm(law, -35))).toBe(-20);
    expect(ptmFromStressedVolume(law, stressedVolumeFromPtm(law, 80))).toBe(45);

    const arterial = vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("Ao")!]!, params);
    const linear = vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get("Cap")!]!, params);
    for (const [lawToCheck, pressures] of [
      [arterial, [-40, 0, 90, 1000]],
      [linear, [-8, 0, 25]],
    ] as const) {
      for (const pressure of pressures) {
        expect(ptmFromStressedVolume(lawToCheck, stressedVolumeFromPtm(lawToCheck, pressure))).toBeCloseTo(
          pressure,
          10,
        );
      }
    }

    if (arterial.kind !== "arterial") throw new Error("Ao must use an arterial law");
    expect(ptmFromStressedVolume(
      arterial,
      stressedVolumeFromPtm(arterial, -1e6),
    )).toBeCloseTo(-0.95 * arterial.P0, 12);

    expect(() => ptmFromStressedVolume({
      ...law,
      Copen: -1,
    }, 0)).toThrow("venous Copen must be positive and finite");
  });

  it("matches the current explicit pth/palv respiratory formulas", () => {
    const params = {
      PEEP: 6,
      Pth0: -3,
      respAmpTh: 2.5,
      respAmpAlv: 1.25,
      respRate: 0.2,
    };
    const timeSec = 1.25;

    expect(respiratoryExternalPressuresV1(timeSec, params)).toEqual({
      pthMmHg: 0.7000000000000002,
      palvMmHg: 7.25,
    });
    expect(respiratoryExternalPressureForKindV1("none", timeSec, params)).toBe(0);
    expect(respiratoryExternalPressureForKindV1("pth", timeSec, params)).toBe(0.7000000000000002);
    expect(respiratoryExternalPressureForKindV1("palv", timeSec, params)).toBe(7.25);
  });

  it("matches the shipped smooth downstream waterfall and leaves ordinary edges unchanged", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const waterfallEdge = graph.edges[graph.edgeIndex.get("VC_RA")!]!;
    const ordinaryEdge = graph.edges[graph.edgeIndex.get("SV_VC")!]!;

    const effective = downstreamEffectivePressureV1({
      edge: waterfallEdge,
      downstreamPressureMmHg: -4,
      edgeExternalPressureMmHg: -1.8,
    });
    expect(effective).toBe(-1.7929205087257734);
    expect(effective).toBe(smoothMax(-4, -1.8, 0.25));
    expect(downstreamEffectivePressureV1({
      edge: ordinaryEdge,
      downstreamPressureMmHg: -4,
      edgeExternalPressureMmHg: -1.8,
    })).toBe(-4);
  });

  it("resolves non-valve systemic and pulmonary losses while leaving valves to their sole owner", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const runtime = {
      systemicResistance: 1.3,
      pulmonaryResistance: 0.625,
    };

    const systemic = baseNonValveEdgeLossV1(
      graph.edges[graph.edgeIndex.get("SA_Art")!]!,
      runtime,
    );
    expect(systemic).toMatchObject({
      resistanceMmHgSecPerMl: 0.096738304,
      quadraticLossMmHgSec2PerMl2: 0,
    });

    const pulmonary = baseNonValveEdgeLossV1(
      graph.edges[graph.edgeIndex.get("PArt_PCap")!]!,
      runtime,
    );
    expect(pulmonary.resistanceMmHgSecPerMl).toBe(0.025);

    expect(() => baseNonValveEdgeLossV1(
      graph.edges[graph.edgeIndex.get("MV")!]!,
      runtime,
    )).toThrow("outside the base non-valve loss boundary");

    expect(() => baseNonValveEdgeLossV1(
      graph.edges[graph.edgeIndex.get("Ao_LAD")!]!,
      runtime,
    )).toThrow("outside the base non-valve loss boundary");
  });

  it("applies incidence continuity with an exactly zero total volume rate", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const flows = Float64Array.from(graph.edges, (_, index) => index + 1);
    const rates = incidenceVolumeRatesFromEdgeFlowsV1(graph, flows);

    expect(rates[graph.nodeIndex.get("LV")!]).toBe(-1);
    expect(rates[graph.nodeIndex.get("LA")!]).toBe(14);
    expect(rates[graph.nodeIndex.get("RV")!]).toBe(-1);
    expect(rates[graph.nodeIndex.get("RA")!]).toBe(35);
    expect(rates[graph.nodeIndex.get("Ao")!]).toBe(-63);
    expect(Array.from(rates).reduce((sum, rate) => sum + rate, 0)).toBe(0);
  });
});
