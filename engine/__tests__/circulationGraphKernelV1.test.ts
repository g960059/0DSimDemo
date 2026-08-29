import { describe, expect, it } from "vitest";
import { smoothMax } from "@/engine/math";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import {
  CIRCULATION_GRAPH_KERNEL_V1_BOUNDARY,
  baseNonValveEdgeLossV1,
  buildAuthoritativeCirculationGraphV1,
  collapsibleTubeAreaRatioV1,
  downstreamEffectivePressureV1,
  incidenceVolumeRatesFromEdgeFlowsV1,
  nonValveEdgeLossV1,
  physicalColdSeedVolumeFromNodeV1,
  respiratoryExternalPressureForKindV1,
  respiratoryExternalPressuresV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1,
  MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_CLAIM_V1,
  resolveMainWireAorticCompliancePartitionCapacitySnapshotV1,
  resolveMainWireAorticCompliancePartitionResearchProfileV1,
  validateMainWireAorticCompliancePartitionResearchProfileV1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import {
  complianceFromPtm,
  ptmFromStressedVolume,
  stressedVolumeFromPtm,
} from "@/engine/vascularPv";

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
      .toBe("nonvalve-noncoronary-with-optional-chi");
    expect(CIRCULATION_GRAPH_KERNEL_V1_BOUNDARY.excluded)
      .not.toContain("collapsible-tube-chi");
  });

  it("preserves the shipped physical-volume-to-pressure domains", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const params = { venousTone: 0.15, arterialStiffness: 0.75 };
    const ao = graph.nodes[graph.nodeIndex.get("Ao")]!;
    const aoLaw = vascularPvLawFromNodeV1(ao, params);
    if (aoLaw.kind !== "arterial") throw new Error("Ao must be arterial");
    for (const logStrain of [-40, -5, 0, 3, 8]) {
      const physicalVolumeMl = aoLaw.Vu + aoLaw.VsEff * logStrain;
      const clamped = Math.max(-30, Math.min(5, logStrain));
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        ao,
        physicalVolumeMl,
        params,
        "fixed-32-iterations",
      )).toBe(aoLaw.P0 * (Math.exp(clamped) - 1));
    }

    const sv = graph.nodes[graph.nodeIndex.get("SV")]!;
    const svLaw = vascularPvLawFromNodeV1(sv, params);
    for (const pressureMmHg of [-20, -5, 0, 6, 20, 45]) {
      const physicalVolumeMl = svLaw.Vu
        + stressedVolumeFromPtm(svLaw, pressureMmHg);
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        sv,
        physicalVolumeMl,
        params,
        "fixed-32-iterations",
      )).toBeCloseTo(pressureMmHg, 7);
    }
    expect(vascularTransmuralPressureFromPhysicalVolumeV1(
      sv,
      svLaw.Vu + stressedVolumeFromPtm(svLaw, -35),
      params,
      "fixed-32-iterations",
    )).toBe(-20);
    expect(vascularTransmuralPressureFromPhysicalVolumeV1(
      sv,
      svLaw.Vu + stressedVolumeFromPtm(svLaw, 80),
      params,
      "fixed-32-iterations",
    )).toBe(45);
    const adaptivePhysicalVolumeMl = svLaw.Vu
      + stressedVolumeFromPtm(svLaw, 6.123456789);
    expect(vascularTransmuralPressureFromPhysicalVolumeV1(
      sv,
      adaptivePhysicalVolumeMl,
      params,
      "adaptive-volume-tolerance",
    )).toBe(ptmFromStressedVolume(
      svLaw,
      adaptivePhysicalVolumeMl - svLaw.Vu,
    ));
  });

  it("owns the main-wire x0-to-physical-cold-volume interpretation", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const params = { venousTone: 0.15, arterialStiffness: 0.75 };
    const lv = graph.nodes[graph.nodeIndex.get("LV")]!;
    const lad = graph.nodes[graph.nodeIndex.get("LAD_Art")]!;
    const sv = graph.nodes[graph.nodeIndex.get("SV")]!;
    const svLaw = vascularPvLawFromNodeV1(sv, params);

    expect(physicalColdSeedVolumeFromNodeV1(lv, params)).toBe(lv.x0);
    expect(physicalColdSeedVolumeFromNodeV1(lad, params)).toBe(lad.x0);
    expect(physicalColdSeedVolumeFromNodeV1(sv, params)).toBe(
      svLaw.Vu + stressedVolumeFromPtm(svLaw, sv.x0),
    );
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

  it("changes systemic arterial tangent stiffness about its topology-design pressure", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const baselineParams = { venousTone: 0.15, arterialStiffness: 0.75 };
    const scaledParams = {
      ...baselineParams,
      systemicArterialStiffnessScaleFromGlobal: 1.5,
    };

    for (const name of ["Ao", "SA", "Art"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(name)]!;
      const baselineLaw = vascularPvLawFromNodeV1(node, baselineParams);
      const scaledLaw = vascularPvLawFromNodeV1(node, scaledParams);
      if (baselineLaw.kind !== "arterial" || scaledLaw.kind !== "arterial") {
        throw new Error(`${name} must be arterial`);
      }
      const topologyDesignPressure =
        vascularTransmuralPressureFromPhysicalVolumeV1(
          node,
          node.x0,
          { ...baselineParams, arterialStiffness: 1 },
          "fixed-32-iterations",
        );
      const globalLawReferenceVolumeMl = baselineLaw.Vu
        + stressedVolumeFromPtm(baselineLaw, topologyDesignPressure);
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        globalLawReferenceVolumeMl,
        baselineParams,
        "fixed-32-iterations",
      )).toBeCloseTo(topologyDesignPressure, 12);
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        globalLawReferenceVolumeMl,
        scaledParams,
        "fixed-32-iterations",
      )).toBeCloseTo(topologyDesignPressure, 12);
      expect(scaledLaw.VsEff).toBeCloseTo(baselineLaw.VsEff / 1.5, 12);
      expect(complianceFromPtm(scaledLaw, topologyDesignPressure))
        .toBeCloseTo(
          complianceFromPtm(baselineLaw, topologyDesignPressure) / 1.5,
          12,
        );
    }

    for (const name of ["PA", "PArt"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(name)]!;
      expect(vascularPvLawFromNodeV1(node, scaledParams))
        .toEqual(vascularPvLawFromNodeV1(node, baselineParams));
    }

    const scaleOneParams = {
      ...baselineParams,
      systemicArterialStiffnessScaleFromGlobal: 1,
    };
    for (const name of ["Ao", "SA", "Art", "PA", "PArt"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(name)]!;
      expect(vascularPvLawFromNodeV1(node, scaleOneParams))
        .toEqual(vascularPvLawFromNodeV1(node, baselineParams));
    }
  });

  it("redistributes Ao-to-SA exponential PV capacity without changing its sum", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const ao = graph.nodes[graph.nodeIndex.get("Ao")]!;
    const sa = graph.nodes[graph.nodeIndex.get("SA")]!;
    const art = graph.nodes[graph.nodeIndex.get("Art")]!;
    const baselineParams = { venousTone: 0.15, arterialStiffness: 0.75 };
    const baselineAo = vascularPvLawFromNodeV1(ao, baselineParams);
    const baselineSa = vascularPvLawFromNodeV1(sa, baselineParams);
    const baselineArt = vascularPvLawFromNodeV1(art, baselineParams);
    for (const profileId of
      MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireAorticCompliancePartitionResearchProfileV1(profileId);
      const capacity =
        resolveMainWireAorticCompliancePartitionCapacitySnapshotV1(profile);
      expect(capacity.totalVsResidualMl).toBe(0);
      const params = {
        ...baselineParams,
        aorticCompliancePartitionResearchProfile: profile,
      };
      const resolvedAo = vascularPvLawFromNodeV1(ao, params);
      const resolvedSa = vascularPvLawFromNodeV1(sa, params);
      const resolvedArt = vascularPvLawFromNodeV1(art, params);
      if (
        baselineAo.kind !== "arterial"
        || baselineSa.kind !== "arterial"
        || resolvedAo.kind !== "arterial"
        || resolvedSa.kind !== "arterial"
      ) throw new Error("Ao and SA must be arterial");
      expect(resolvedAo.VsEff + resolvedSa.VsEff)
        .toBeCloseTo(baselineAo.VsEff + baselineSa.VsEff, 12);
      expect(
        complianceFromPtm(resolvedAo, 90)
        + complianceFromPtm(resolvedSa, 90),
      ).toBeCloseTo(
        complianceFromPtm(baselineAo, 90)
          + complianceFromPtm(baselineSa, 90),
        12,
      );
      expect(resolvedArt).toEqual(baselineArt);
      expect(validateMainWireAorticCompliancePartitionResearchProfileV1(
        profile,
      )).toEqual([]);
    }
    expect(MAIN_WIRE_AORTIC_COMPLIANCE_PARTITION_RESEARCH_CLAIM_V1)
      .toMatchObject({
        aorticRootPlusSystemicArteryVsSumPreservedExactly: true,
        acceptedStateOrCheckpointTopologyChanged: false,
        anatomicalSupportLengthIdentified: false,
      });
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

  it("compiles pure venous law constants without changing the fixed32 inverse", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const params = { venousTone: 0.15, arterialStiffness: 0.75 };
    const node = graph.nodes[graph.nodeIndex.get("SV")!]!;
    const mutableLaw = vascularPvLawFromNodeV1(node, params);
    if (mutableLaw.kind !== "venous3") throw new Error("SV must use a venous3 law");
    const frozenLaw = Object.freeze({ ...mutableLaw });

    for (const pressureMmHg of [-20, -8.25, 0, 6.123456789, 20, 45]) {
      expect(stressedVolumeFromPtm(frozenLaw, pressureMmHg))
        .toBe(stressedVolumeFromPtm(mutableLaw, pressureMmHg));
    }

    const legacyFixed32Inverse = (targetStressedVolumeMl: number): number => {
      let lowerPressureMmHg = -20;
      let upperPressureMmHg = 45;
      const lowerVolumeMl = stressedVolumeFromPtm(mutableLaw, lowerPressureMmHg);
      const upperVolumeMl = stressedVolumeFromPtm(mutableLaw, upperPressureMmHg);
      if (targetStressedVolumeMl <= lowerVolumeMl) return lowerPressureMmHg;
      if (targetStressedVolumeMl >= upperVolumeMl) return upperPressureMmHg;
      for (let iteration = 0; iteration < 32; iteration += 1) {
        const midpointMmHg = 0.5 * (lowerPressureMmHg + upperPressureMmHg);
        if (stressedVolumeFromPtm(mutableLaw, midpointMmHg) < targetStressedVolumeMl) {
          lowerPressureMmHg = midpointMmHg;
        } else {
          upperPressureMmHg = midpointMmHg;
        }
      }
      return 0.5 * (lowerPressureMmHg + upperPressureMmHg);
    };

    for (const targetPressureMmHg of [-25, -8.25, 0, 6.123456789, 20, 60]) {
      const targetVolumeMl = stressedVolumeFromPtm(mutableLaw, targetPressureMmHg);
      const expectedPressureMmHg = legacyFixed32Inverse(targetVolumeMl);
      expect(ptmFromStressedVolume(frozenLaw, targetVolumeMl, {
        maxIterations: 32,
        termination: "fixed-iterations",
      })).toBe(expectedPressureMmHg);
      expect(vascularTransmuralPressureFromPhysicalVolumeV1(
        node,
        mutableLaw.Vu + targetVolumeMl,
        params,
        "fixed-32-iterations",
      )).toBe(expectedPressureMmHg);
    }
  });

  it("keeps the adaptive venous inverse bracketed and more accurate across every graph law", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const pressuresMmHg = [-19.75, -12.5, -5, 0, 6.123456789, 12, 20, 37.25, 44.75];
    for (const venousTone of [0, 0.15, 1]) {
      const params = { venousTone, arterialStiffness: 0.75 };
      for (const node of graph.nodes) {
        if (node.kind !== "venousPressure") continue;
        const law = Object.freeze({
          ...vascularPvLawFromNodeV1(node, params),
        });
        if (law.kind !== "venous3") {
          throw new Error(`${node.name} must resolve to a venous3 law`);
        }
        for (const expectedPressureMmHg of pressuresMmHg) {
          const targetVolumeMl = stressedVolumeFromPtm(
            law,
            expectedPressureMmHg,
          );
          const adaptivePressureMmHg = ptmFromStressedVolume(
            law,
            targetVolumeMl,
          );
          const fixed32PressureMmHg = ptmFromStressedVolume(
            law,
            targetVolumeMl,
            { maxIterations: 32, termination: "fixed-iterations" },
          );
          const adaptiveErrorMmHg = Math.abs(
            adaptivePressureMmHg - expectedPressureMmHg,
          );
          const fixed32ErrorMmHg = Math.abs(
            fixed32PressureMmHg - expectedPressureMmHg,
          );
          expect(adaptiveErrorMmHg).toBeLessThanOrEqual(
            fixed32ErrorMmHg + 1e-12,
          );
          expect(Math.abs(
            stressedVolumeFromPtm(law, adaptivePressureMmHg)
              - targetVolumeMl,
          )).toBeLessThanOrEqual(2e-10);
        }
      }
    }
  });

  it("solves future topology-independent venous laws across their full pressure domain", () => {
    const laws = [
      {
        kind: "venous3" as const,
        Vu: 0,
        Ccoll: 2,
        Copen: 120,
        Cdist: 8,
        Popen: -3,
        Pstiff: 12,
        dOpen: 0.35,
        dStiff: 1.5,
      },
      {
        kind: "venous3" as const,
        Vu: 75,
        Ccoll: 12,
        Copen: 48,
        Cdist: 20,
        Popen: 2,
        Pstiff: 28,
        dOpen: 8,
        dStiff: 10,
      },
      {
        kind: "venous3" as const,
        Vu: 400,
        Ccoll: 15,
        Copen: 15,
        Cdist: 15,
        Popen: -10,
        Pstiff: 35,
        dOpen: 0.1,
        dStiff: 0.1,
      },
    ].map((law) => Object.freeze(law));
    for (const law of laws) {
      let previousVolumeMl = -Infinity;
      for (let index = 0; index <= 256; index += 1) {
        const expectedPressureMmHg = -19.9 + index * (64.8 / 256);
        const targetVolumeMl = stressedVolumeFromPtm(
          law,
          expectedPressureMmHg,
        );
        expect(targetVolumeMl).toBeGreaterThan(previousVolumeMl);
        const actualPressureMmHg = ptmFromStressedVolume(
          law,
          targetVolumeMl,
        );
        expect(actualPressureMmHg).toBeGreaterThanOrEqual(-20);
        expect(actualPressureMmHg).toBeLessThanOrEqual(45);
        expect(Math.abs(actualPressureMmHg - expectedPressureMmHg))
          .toBeLessThanOrEqual(2e-9);
        expect(Math.abs(
          stressedVolumeFromPtm(law, actualPressureMmHg) - targetVolumeMl,
        )).toBeLessThanOrEqual(2e-10);
        previousVolumeMl = targetVolumeMl;
      }
    }
  });

  it("does not cache mutable or accessor-backed venous law values", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const node = graph.nodes[graph.nodeIndex.get("SV")!]!;
    const baseLaw = vascularPvLawFromNodeV1(node, {
      venousTone: 0.15,
      arterialStiffness: 0.75,
    });
    if (baseLaw.kind !== "venous3") throw new Error("SV must use a venous3 law");

    const targetVolumeMl = stressedVolumeFromPtm(baseLaw, 6);
    const beforeMutation = ptmFromStressedVolume(baseLaw, targetVolumeMl);
    baseLaw.Copen *= 1.1;
    expect(ptmFromStressedVolume(baseLaw, targetVolumeMl)).not.toBe(beforeMutation);

    let accessorCopen = baseLaw.Copen;
    const accessorLaw = Object.freeze({
      ...baseLaw,
      get Copen() {
        return accessorCopen;
      },
    });
    const beforeAccessorMutation = stressedVolumeFromPtm(accessorLaw, 6);
    accessorCopen *= 1.1;
    expect(stressedVolumeFromPtm(accessorLaw, 6)).not.toBe(beforeAccessorMutation);
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

  it("applies pressure-translation-invariant chi to raw pressures and is an exact off no-op", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const edge = graph.edges[graph.edgeIndex.get("VC_RA")]!;
    const params = { systemicResistance: 1.3, pulmonaryResistance: 0.625 };
    const base = baseNonValveEdgeLossV1(edge, params);
    const raw = {
      edge,
      upstreamPressureMmHg: -3,
      downstreamPressureMmHg: -10,
      edgeExternalPressureMmHg: -2,
    };
    const translated = collapsibleTubeAreaRatioV1({
      ...raw,
      upstreamPressureMmHg: raw.upstreamPressureMmHg + 7,
      downstreamPressureMmHg: raw.downstreamPressureMmHg + 7,
      edgeExternalPressureMmHg: raw.edgeExternalPressureMmHg + 7,
    });
    const areaRatio = collapsibleTubeAreaRatioV1(raw);
    expect(translated).toBe(areaRatio);

    const off = nonValveEdgeLossV1({
      ...raw,
      params,
    });
    expect(off).toEqual({
      resistanceMmHgSecPerMl: base.resistanceMmHgSecPerMl,
      quadraticLossMmHgSec2PerMl2: base.quadraticLossMmHgSec2PerMl2,
      areaRatio: 1,
      collapsibleTubeApplied: false,
    });

    const on = nonValveEdgeLossV1({
      ...raw,
      params: { ...params, useChiResistance: true },
    });
    expect(on.areaRatio).toBe(areaRatio);
    expect(on.areaRatio).toBeLessThan(1);
    expect(on.resistanceMmHgSecPerMl).toBeGreaterThan(base.resistanceMmHgSecPerMl);

    const waterfallDownstream = downstreamEffectivePressureV1({
      edge,
      downstreamPressureMmHg: raw.downstreamPressureMmHg,
      edgeExternalPressureMmHg: raw.edgeExternalPressureMmHg,
    });
    expect(areaRatio).not.toBe(collapsibleTubeAreaRatioV1({
      ...raw,
      downstreamPressureMmHg: waterfallDownstream,
    }));
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
