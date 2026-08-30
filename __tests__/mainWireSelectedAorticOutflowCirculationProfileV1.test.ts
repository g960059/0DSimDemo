import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  validateMainWireSelectedAorticOutflowCirculationProfileV1,
  type MainWireSelectedAorticOutflowCirculationProfileV1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  buildAuthoritativeCirculationGraphV1,
  effectiveUnstressedVolumeFromNodeV1,
  physicalColdSeedVolumeFromNodeV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
  type VascularPvRuntimeParameterViewV1,
} from "@/engine/core/circulationGraphKernelV1";
import { buildEdges, type NodeSpec } from "@/engine/core/topology";
import { stressedVolumeFromPtm, type VascularPvLaw } from "@/engine/vascularPv";
import { MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1 } from
  "@/engine/valves/MainWireAorticRecoveredRootProfileV1";

const PROFILE =
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1;
const BASE_RUNTIME = Object.freeze({
  venousTone: 0.15,
  arterialStiffness: 0.75,
}) satisfies VascularPvRuntimeParameterViewV1;
const SELECTED_RUNTIME = Object.freeze({
  ...BASE_RUNTIME,
  selectedAorticOutflowProfile: PROFILE,
}) satisfies VascularPvRuntimeParameterViewV1;

describe("selected aortic-outflow circulation profile V1", () => {
  it("is one exact-key-validated fixed assembly with explicit claims", () => {
    expect(validateMainWireSelectedAorticOutflowCirculationProfileV1(PROFILE))
      .toEqual([]);
    expect(Object.keys(PROFILE).sort()).toEqual([
      "aorticValveProfile",
      "ascendingAorticInertanceMmHgSec2PerMl",
      "ascendingAorticInertanceScaleFromTopology",
      "characteristicImpedanceResistanceMmHgSecPerMl",
      "parameterSearchOrFitting",
      "profileId",
      "pulmonaryArterialClaim",
      "pulmonaryArterialNodeIds",
      "pulmonaryArterialTangentStiffnessMultiplier",
      "residualDownstreamResistanceMmHgSecPerMl",
      "sourceDynamicEdgeId",
      "sourceTopologyInertanceMmHgSec2PerMl",
      "sourceTopologyResistanceMmHgSecPerMl",
      "systemicArterialNodeIds",
      "systemicArterialPressureAnchor",
      "systemicArterialTangentClaim",
      "systemicArterialTangentStiffnessMultiplier",
    ]);
    expect(PROFILE.aorticValveProfile)
      .toBe(MAIN_WIRE_AORTIC_RECOVERED_ROOT_PROFILE_V1);
    expect(PROFILE.systemicArterialPressureAnchor)
      .toBe("preserve-absent-profile-pressure-at-topology-x0");
    expect(PROFILE.systemicArterialTangentClaim)
      .toBe("twice-absent-profile-local-volume-tangent-at-topology-x0");
    expect(PROFILE.pulmonaryArterialClaim)
      .toBe("absent-profile-law-bit-identical");
    expect(PROFILE.parameterSearchOrFitting).toBe(false);

    const malformed = {
      ...PROFILE,
      systemicArterialTangentStiffnessMultiplier: 3,
      extraAxis: true,
    };
    expect(validateMainWireSelectedAorticOutflowCirculationProfileV1(
      malformed as unknown as MainWireSelectedAorticOutflowCirculationProfileV1,
    )).toEqual(expect.arrayContaining([
      expect.stringContaining("fields differ"),
      expect.stringContaining("systemicArterialTangentStiffnessMultiplier"),
    ]));
  });

  it("conserves the source Ao-SA resistance split and pins the inertance relation", () => {
    const sourceEdge = buildEdges().find((edge) => edge.name === "Ao_SA");
    expect(sourceEdge?.kind).toBe("dynamic");
    expect(PROFILE.characteristicImpedanceResistanceMmHgSecPerMl
      + PROFILE.residualDownstreamResistanceMmHgSecPerMl)
      .toBe(PROFILE.sourceTopologyResistanceMmHgSecPerMl);
    expect(PROFILE.sourceTopologyResistanceMmHgSecPerMl).toBe(sourceEdge?.R);
    expect(PROFILE.sourceTopologyInertanceMmHgSec2PerMl).toBe(sourceEdge?.L);
    expect(PROFILE.sourceTopologyInertanceMmHgSec2PerMl
      * PROFILE.ascendingAorticInertanceScaleFromTopology)
      .toBe(PROFILE.ascendingAorticInertanceMmHgSec2PerMl);
  });

  it("preserves pressure at topology x0 and doubles the systemic local tangent", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    for (const nodeId of PROFILE.systemicArterialNodeIds) {
      const node = graph.nodes[graph.nodeIndex.get(nodeId)!]!;
      const baseLaw = arterialLaw(node, BASE_RUNTIME);
      const selectedLaw = arterialLaw(node, SELECTED_RUNTIME);
      expect(selectedLaw.VsEff).toBe(baseLaw.VsEff / 2);
      expect(selectedLaw.Vu).toBe(
        node.x0 - (node.x0 - baseLaw.Vu) / 2,
      );
      expect(effectiveUnstressedVolumeFromNodeV1(node, SELECTED_RUNTIME))
        .toBe(selectedLaw.Vu);
      for (const policy of [
        "adaptive-volume-tolerance",
        "fixed-32-iterations",
      ] as const) {
        const basePressure = vascularTransmuralPressureFromPhysicalVolumeV1(
          node,
          node.x0,
          BASE_RUNTIME,
          policy,
        );
        const selectedPressure =
          vascularTransmuralPressureFromPhysicalVolumeV1(
            node,
            node.x0,
            SELECTED_RUNTIME,
            policy,
          );
        expect(selectedPressure).toBe(basePressure);

        const basePaired =
          vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
            node,
            node.x0,
            BASE_RUNTIME,
            policy,
          );
        const selectedPaired =
          vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
            node,
            node.x0,
            SELECTED_RUNTIME,
            policy,
          );
        expect(selectedPaired.transmuralPressureMmHg)
          .toBe(basePaired.transmuralPressureMmHg);
        expect(selectedPaired.dTransmuralPressureDPhysicalVolumeMmHgPerMl)
          .toBeCloseTo(
            2
              * basePaired
                .dTransmuralPressureDPhysicalVolumeMmHgPerMl,
            14,
          );
      }
    }
  });

  it("leaves PA and PArt laws and pressure arithmetic bit-identical", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    for (const nodeId of PROFILE.pulmonaryArterialNodeIds) {
      const node = graph.nodes[graph.nodeIndex.get(nodeId)!]!;
      const baseLaw = arterialLaw(node, BASE_RUNTIME);
      const selectedLaw = arterialLaw(node, SELECTED_RUNTIME);
      expect(selectedLaw).toEqual(baseLaw);
      expect(JSON.stringify(selectedLaw)).toBe(JSON.stringify(baseLaw));
      for (const volumeMl of [0.75 * node.x0, node.x0, 1.25 * node.x0]) {
        for (const policy of [
          "adaptive-volume-tolerance",
          "fixed-32-iterations",
        ] as const) {
          expect(vascularTransmuralPressureFromPhysicalVolumeV1(
            node,
            volumeMl,
            SELECTED_RUNTIME,
            policy,
          )).toBe(vascularTransmuralPressureFromPhysicalVolumeV1(
            node,
            volumeMl,
            BASE_RUNTIME,
            policy,
          ));
        }
      }
    }
  });

  it("keeps selected inverse, tangent, and cold-seed paths consistent", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    for (const nodeId of PROFILE.systemicArterialNodeIds) {
      const node = graph.nodes[graph.nodeIndex.get(nodeId)!]!;
      const law = arterialLaw(node, SELECTED_RUNTIME);
      const coldVolumeMl = physicalColdSeedVolumeFromNodeV1(
        node,
        SELECTED_RUNTIME,
      );
      expect(coldVolumeMl).toBe(node.x0);
      for (const policy of [
        "adaptive-volume-tolerance",
        "fixed-32-iterations",
      ] as const) {
        const pressureMmHg =
          vascularTransmuralPressureFromPhysicalVolumeV1(
            node,
            coldVolumeMl,
            SELECTED_RUNTIME,
            policy,
          );
        const paired =
          vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
            node,
            coldVolumeMl,
            SELECTED_RUNTIME,
            policy,
          );
        expect(paired.transmuralPressureMmHg).toBe(pressureMmHg);
        expect(law.Vu + stressedVolumeFromPtm(law, pressureMmHg))
          .toBeCloseTo(coldVolumeMl, 12);
      }
    }
  });

  it("preserves every absent-profile vascular law exactly", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    for (const node of graph.nodes) {
      if (
        node.kind !== "arterial"
        && node.kind !== "linear"
        && node.kind !== "venousPressure"
      ) continue;
      expect(vascularPvLawFromNodeV1(node, BASE_RUNTIME))
        .toEqual(legacyLawFromNode(node, BASE_RUNTIME));
    }
  });
});

function arterialLaw(
  node: NodeSpec,
  runtime: VascularPvRuntimeParameterViewV1,
): Extract<VascularPvLaw, { kind: "arterial" }> {
  const law = vascularPvLawFromNodeV1(node, runtime);
  if (law.kind !== "arterial") throw new Error(`${node.name} is not arterial`);
  return law;
}

function legacyLawFromNode(
  node: NodeSpec,
  params: VascularPvRuntimeParameterViewV1,
): VascularPvLaw {
  const Vu = (node.Vu ?? 0)
    - (node.venousToneGain ?? 0) * params.venousTone;
  if (node.kind === "arterial") {
    return {
      kind: "arterial",
      Vu,
      P0: node.P0 ?? 50,
      VsEff: Math.max(
        (node.Vs ?? 100) / Math.max(params.arterialStiffness, 0.25),
        1,
      ),
    };
  }
  if (node.kind === "linear") {
    return { kind: "linear", Vu, C: Math.max(node.C ?? 1, 1e-6) };
  }
  if (node.kind === "venousPressure") {
    return {
      kind: "venous3",
      Vu,
      Ccoll: node.Ccoll ?? 5,
      Copen: node.Copen ?? 50,
      Cdist: node.Cdist ?? 15,
      Popen: node.Popen ?? -1,
      Pstiff: node.Pstiff ?? 14,
      dOpen: Math.max(node.dOpen ?? 1, 1e-6),
      dStiff: Math.max(node.dStiff ?? 3, 1e-6),
    };
  }
  throw new Error(`${node.name} has no vascular law`);
}
