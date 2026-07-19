import { describe, expect, it } from "vitest";
import {
  CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2,
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_EDGE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_PERFUSED_WALL_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  CORONARY_TOPOLOGY_ID_V2,
  CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
  KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2,
  LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2,
  LOW_RM_70_15_15_REPARTITION_ABLATION_V2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2,
  applyBeatingReferenceR1CalibrationV2,
  buildCoronaryTopologyV2,
  coronaryTopologyPriorFingerprintV2,
  coronaryColdSeedBloodVolumeMlV2,
  createColdCoronaryConstructionSeedV2,
  evaluateCrefAnchoredCollapsiblePvV2,
  initialCoronaryToneStateV2,
  repartitionCoronaryMicrovascularResistanceV2,
  scaleCoronaryLargeArterialComplianceV2,
  scaleCoronaryIntramyocardialComplianceV2,
  validateCoronaryTopologyPriorV2,
  validateCoronaryTopologyV2,
} from "@/engine/coronary";

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe("coronary two-compliance topology/prior V2", () => {
  it("owns sixteen conserved volumes and twenty-two signed, inertance-free edges", () => {
    const topology = buildCoronaryTopologyV2();
    expect(topology.nodes.map((node) => node.nodeId))
      .toEqual([...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2]);
    expect(topology.edges.map((edge) => edge.edgeId))
      .toEqual([...CORONARY_EDGE_IDS_V2]);
    expect(topology.nodes).toHaveLength(16);
    expect(topology.edges).toHaveLength(22);
    expect(topology.edges.every(
      (edge) => edge.flowLawDirectionality === "signed"
        && edge.inertanceMmHgSec2PerMl === null,
    )).toBe(true);
    expect(topology.nodeIndexById.CV).toBe(15);
    expect(topology.edgeIndexById.CV_RA).toBe(21);
    expect(() => validateCoronaryTopologyV2(topology)).not.toThrow();

    for (const node of topology.nodes) {
      const incoming = topology.edges.filter(
        (edge) => edge.downstreamNodeId === node.nodeId,
      );
      const outgoing = topology.edges.filter(
        (edge) => edge.upstreamNodeId === node.nodeId,
      );
      expect(incoming.length, `${node.nodeId} incoming`).toBeGreaterThan(0);
      expect(outgoing.length, `${node.nodeId} outgoing`).toBeGreaterThan(0);
    }
  });

  it("closes the exclusive Kassab structural-volume ledger without scaling it by whole-heart mass", () => {
    const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const topology = buildCoronaryTopologyV2(prior);
    const kassab = KASSAB_CORONARY_BLOOD_VOLUME_PRIOR_V2;
    const fractions = kassab.exclusiveNormalizedFraction01;
    expect(
      fractions.largeArterial + fractions.microvascular + fractions.largeVenous,
    ).toBeCloseTo(1, 14);
    expect(sum(Object.values(kassab.derivedVolumeMlPer100G)))
      .toBeCloseTo(kassab.wholeCoronary, 14);

    const denominatorMassG =
      prior.construction.structuralBloodVolumeScale.kassabDenominatorMassG;
    expect(denominatorMassG).toBeLessThan(
      prior.construction.referenceVentricularMyocardialMassG,
    );
    const scale = denominatorMassG / 100;
    const byClass = (budgetClass: string): number => sum(
      topology.nodes
        .filter((node) => node.structuralBloodVolumeBudgetClass === budgetClass)
        .map((node) => node.coldSeedVolumeMl),
    );
    expect(byClass("large-arterial"))
      .toBeCloseTo(scale * kassab.derivedVolumeMlPer100G.largeArterial, 12);
    expect(byClass("microvascular-c1") + byClass("microvascular-c2"))
      .toBeCloseTo(scale * kassab.derivedVolumeMlPer100G.microvascular, 12);
    expect(byClass("large-venous"))
      .toBeCloseTo(scale * kassab.derivedVolumeMlPer100G.largeVenous, 12);
    expect(coronaryColdSeedBloodVolumeMlV2(prior))
      .toBeCloseTo(scale * kassab.wholeCoronary, 12);
    expect(coronaryColdSeedBloodVolumeMlV2(prior))
      .toBeCloseTo(prior.coldSeedCoronaryBloodVolumeMl, 12);
  });

  it("derives structural ownership from an explicit wall-to-territory-layer mass ledger", () => {
    const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const mass = prior.construction.perfusedMyocardialMass;
    for (const wallId of CORONARY_PERFUSED_WALL_IDS_V2) {
      expect(sum(Object.values(
        mass.wallToTerritoryAllocationFraction01[wallId],
      ))).toBeCloseTo(1, 14);
    }
    const wallMass = sum(Object.values(mass.wallMassG));
    const territoryMass = sum(Object.values(mass.territoryMassG));
    const layerMass = sum(CORONARY_TERRITORY_IDS_V2.flatMap(
      (territoryId) => Object.values(mass.territoryLayerMassG[territoryId]),
    ));
    expect(wallMass).toBeCloseTo(
      prior.construction.referenceVentricularMyocardialMassG,
      12,
    );
    expect(territoryMass).toBeCloseTo(wallMass, 12);
    expect(layerMass).toBeCloseTo(wallMass, 12);

    // Flow target and anatomical ownership are separate axes, even at seed.
    expect(prior.territories.LAD.restingFlowFractionOfTotal01)
      .not.toBeCloseTo(
        prior.territories.LAD.structuralVolumeAllocationFractionOfTotal01,
        6,
      );
  });

  it("maps independent Spaan C1/C2 compliances into monotone absolute PV laws", () => {
    const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const topology = buildCoronaryTopologyV2(prior);
    const c1Nodes = topology.nodes.filter(
      (node) => node.kind === "intramyocardial-c1-proximal-arterial",
    );
    const c2Nodes = topology.nodes.filter(
      (node) => node.kind === "intramyocardial-c2-distal-venous",
    );
    const c1Total = sum(c1Nodes.map((node) => node.effectiveComplianceMlPerMmHg));
    const c2Total = sum(c2Nodes.map((node) => node.effectiveComplianceMlPerMmHg));
    const massScale = prior.construction.referenceVentricularMyocardialMassG / 100;
    expect(c1Total).toBeCloseTo(
      massScale * SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2.c1Proximal.center,
      12,
    );
    expect(c2Total).toBeCloseTo(
      massScale * SPAAN_TWO_COMPARTMENT_COMPLIANCE_PRIOR_V2.c2Distal.center,
      12,
    );
    expect(c2Total / c1Total).toBeCloseTo(20, 12);

    for (const node of [...c1Nodes, ...c2Nodes]) {
      expect("pressureScaleMmHg" in node.pressureVolume).toBe(true);
      if (!("pressureScaleMmHg" in node.pressureVolume)) continue;
      const pv = node.pressureVolume;
      expect(pv.pressureScaleMmHg).toBeCloseTo(
        pv.referenceVolumeMl
        / (pv.referenceComplianceMlPerMmHg
          * (pv.expansionExponent + pv.collapseExponent)),
        14,
      );
      expect(evaluateCrefAnchoredCollapsiblePvV2(
        pv.referenceVolumeMl,
        pv,
      )).toMatchObject({
        transmuralPressureMmHg: 0,
      });
      expect(evaluateCrefAnchoredCollapsiblePvV2(
        pv.referenceVolumeMl,
        pv,
      ).complianceMlPerMmHg).toBeCloseTo(
        pv.referenceComplianceMlPerMmHg,
        12,
      );
      expect(evaluateCrefAnchoredCollapsiblePvV2(
        node.coldSeedVolumeMl,
        pv,
      ).transmuralPressureMmHg).toBeCloseTo(
        pv.loadedSeedTransmuralPressureMmHg,
        10,
      );
      const low = evaluateCrefAnchoredCollapsiblePvV2(
        0.9 * pv.referenceVolumeMl,
        pv,
      ).transmuralPressureMmHg;
      const high = evaluateCrefAnchoredCollapsiblePvV2(
        1.1 * pv.referenceVolumeMl,
        pv,
      ).transmuralPressureMmHg;
      expect(low).toBeLessThan(0);
      expect(high).toBeGreaterThan(0);
    }

    const largeVesselNodes = topology.nodes.filter(
      (node) => node.kind === "territory-large-arterial-storage"
        || node.kind === "common-large-venous-storage",
    );
    expect(largeVesselNodes.every(
      (node) => "pressureScaleMmHg" in node.pressureVolume
        && node.effectiveComplianceMlPerMmHg > 0,
    )).toBe(true);
    for (const node of largeVesselNodes) {
      expect(evaluateCrefAnchoredCollapsiblePvV2(
        node.coldSeedVolumeMl,
        node.pressureVolume,
      ).transmuralPressureMmHg).toBeCloseTo(
        node.pressureVolume.loadedSeedTransmuralPressureMmHg,
        10,
      );
    }
    expect(prior.construction.largeVesselLocalCompliance)
      .toBe(LARGE_VESSEL_LOCAL_COMPLIANCE_PRIOR_V2);
  });

  it("reproduces the 25:68:7 and 60:30:10 pressure-drop ledger on every path", () => {
    const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const topology = buildCoronaryTopologyV2(prior);
    const totalFlowMlPerSec =
      prior.construction.targetTotalRestingFlowMlPerMin / 60;
    const cvEdge = topology.edges[topology.edgeIndexById.CV_RA];
    const cvDrop = cvEdge.referenceResistanceMmHgSecPerMl * totalFlowMlPerSec;
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      const territory = prior.territories[territoryId];
      const territoryFlowMlPerSec = territory.targetRestingFlowMlPerMin / 60;
      const inlet = topology.edges[
        topology.edgeIndexById[`Ao_${territoryId}.Art`]
      ];
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const layer = territory.layers[layerId];
        const layerFlowMlPerSec = territoryFlowMlPerSec
          * layer.restingFlowFractionWithinTerritory01;
        const r1 = topology.edges[topology.edgeIndexById[
          `${territoryId}.Art_${territoryId}.IM.Art.${layerId}`
        ]];
        const rm = topology.edges[topology.edgeIndexById[
          `${territoryId}.IM.Art.${layerId}_${territoryId}.IM.Ven.${layerId}`
        ]];
        const r2 = topology.edges[topology.edgeIndexById[
          `${territoryId}.IM.Ven.${layerId}_CV`
        ]];
        expect(sum([
          inlet.referencePathPressureDropFraction01,
          r1.referencePathPressureDropFraction01,
          rm.referencePathPressureDropFraction01,
          r2.referencePathPressureDropFraction01,
          cvEdge.referencePathPressureDropFraction01,
        ])).toBeCloseTo(1, 14);
        expect(
          inlet.referenceResistanceMmHgSecPerMl * territoryFlowMlPerSec
          + r1.referenceResistanceMmHgSecPerMl * layerFlowMlPerSec
          + rm.referenceResistanceMmHgSecPerMl * layerFlowMlPerSec
          + r2.referenceResistanceMmHgSecPerMl * layerFlowMlPerSec
          + cvDrop,
        ).toBeCloseTo(
          prior.construction.referencePerfusionPressureDropMmHg,
          12,
        );
        expect(r1.toneOwner).toEqual({ territoryId, layerId });
        expect(rm.toneOwner).toBeNull();
        expect(r1.structuralCmdOwner).toEqual({ territoryId, layerId });
        expect(rm.structuralCmdOwner).toEqual({ territoryId, layerId });
      }
    }
    expect(
      prior.construction.baselineResistancePartition
        .microInternalEvidenceBoundary,
    ).toBe("computational-prior-not-directly-identified");
  });

  it("keeps the cold construction seed distinct from a runtime checkpoint", () => {
    const seed = createColdCoronaryConstructionSeedV2();
    expect(seed).toMatchObject({
      schemaId: CORONARY_CONSTRUCTION_SEED_SCHEMA_ID_V2,
      schemaVersion: 2,
      topologyId: CORONARY_TOPOLOGY_ID_V2,
    });
    expect(seed.priorFingerprint).toMatch(/^fnv1a32-[0-9a-f]{8}$/);
    expect(Object.keys(seed.volumeMlByNode))
      .toEqual([...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2]);
    expect(initialCoronaryToneStateV2()).toEqual({
      LAD: { subepicardial: 1, subendocardial: 1 },
      LCx: { subepicardial: 1, subendocardial: 1 },
      RCA: { subepicardial: 1, subendocardial: 1 },
    });
    expect(NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.claims).toMatchObject({
      conservedVolumeNodeCount: 16,
      signedEdgeCount: 22,
      acceptedToneStateCount: 6,
      toneStateGranularity: "territory-layer",
      inertanceIncluded: false,
      hydraulicSolverIncluded: true,
      simulationReady: false,
      largeVesselComplianceIdentificationComplete: false,
      v1CheckpointCompatible: false,
    });
  });

  it("can repartition R1/Rm/R2 for a directional transmural ablation without changing total resistance", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const changed = repartitionCoronaryMicrovascularResistanceV2(
      base,
      CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
    );
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const before = base.territories[territoryId].layers[layerId];
        const after = changed.territories[territoryId].layers[layerId];
        const beforeTotal = before.proximalArteriolarResistanceMmHgSecPerMl
          + before.intermediateCapillaryResistanceMmHgSecPerMl
          + before.distalVenularResistanceMmHgSecPerMl;
        const afterTotal = after.proximalArteriolarResistanceMmHgSecPerMl
          + after.intermediateCapillaryResistanceMmHgSecPerMl
          + after.distalVenularResistanceMmHgSecPerMl;
        expect(afterTotal).toBeCloseTo(beforeTotal, 12);
        const topology = buildCoronaryTopologyV2(changed);
        const r1 = topology.edges[topology.edgeIndexById[
          `${territoryId}.Art_${territoryId}.IM.Art.${layerId}`
        ]];
        const rm = topology.edges[topology.edgeIndexById[
          `${territoryId}.IM.Art.${layerId}_${territoryId}.IM.Ven.${layerId}`
        ]];
        const r2 = topology.edges[topology.edgeIndexById[
          `${territoryId}.IM.Ven.${layerId}_CV`
        ]];
        const macroMicro = changed.construction.baselineResistancePartition
          .macroPathPressureDropFraction01.microvascular;
        const expected =
          CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2[layerId];
        expect(r1.referencePathPressureDropFraction01 / macroMicro)
          .toBeCloseTo(expected.proximalArteriolar, 14);
        expect(rm.referencePathPressureDropFraction01 / macroMicro)
          .toBeCloseTo(expected.intermediateCapillary, 14);
        expect(r2.referencePathPressureDropFraction01 / macroMicro)
          .toBeCloseTo(expected.distalVenular, 14);
      }
      const baseEndo = base.territories[territoryId].layers.subendocardial;
      const changedEndo = changed.territories[territoryId].layers.subendocardial;
      expect(changedEndo.intermediateCapillaryResistanceMmHgSecPerMl)
        .toBeCloseTo(
          0.5 * baseEndo.intermediateCapillaryResistanceMmHgSecPerMl,
          12,
        );
      expect(changedEndo.proximalArteriolarResistanceMmHgSecPerMl)
        .toBeGreaterThan(baseEndo.proximalArteriolarResistanceMmHgSecPerMl);
    }
    expect(changed.territories.LAD.layers.subepicardial
      .proximalArteriolarResistanceMmHgSecPerMl)
      .toBeCloseTo(base.territories.LAD.layers.subepicardial
        .proximalArteriolarResistanceMmHgSecPerMl, 12);
    expect(changed.territories.LAD.layers.subepicardial
      .intermediateCapillaryResistanceMmHgSecPerMl)
      .toBeCloseTo(base.territories.LAD.layers.subepicardial
        .intermediateCapillaryResistanceMmHgSecPerMl, 12);
    expect(changed.territories.LAD.layers.subepicardial
      .distalVenularResistanceMmHgSecPerMl)
      .toBeCloseTo(base.territories.LAD.layers.subepicardial
        .distalVenularResistanceMmHgSecPerMl, 12);
    expect(() => validateCoronaryTopologyPriorV2(changed)).not.toThrow();
  });

  it("rebases only structural R1 and records a mean-flow-only beating reference", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const scale = Object.freeze({
      LAD: Object.freeze({ subepicardial: 0.67, subendocardial: 0.12 }),
      LCx: Object.freeze({ subepicardial: 0.72, subendocardial: 0.12 }),
      RCA: Object.freeze({ subepicardial: 0.77, subendocardial: 0.68 }),
    });
    const calibrated = applyBeatingReferenceR1CalibrationV2(base, {
      calibrationId: "beating-reference-r1-mean-qm-v1",
      proximalArteriolarScaleByTerritoryLayer: scale,
      boundaryFingerprint: "unit-periodic-boundary",
      calibrationToneResistanceScale: 1,
      targetOwner: "mass-territory-layer-resting-flow-prior",
      objective: "accepted-cycle-mean-qm-only",
      waveformObjectiveUsed: false,
    });
    expect(calibrated.construction.beatingReferenceR1Calibration)
      .not.toBeNull();
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const before = base.territories[territoryId].layers[layerId];
        const after = calibrated.territories[territoryId].layers[layerId];
        expect(after.proximalArteriolarResistanceMmHgSecPerMl)
          .toBeCloseTo(
            before.proximalArteriolarResistanceMmHgSecPerMl
            * scale[territoryId][layerId],
            12,
          );
        expect(after.intermediateCapillaryResistanceMmHgSecPerMl)
          .toBe(before.intermediateCapillaryResistanceMmHgSecPerMl);
        expect(after.distalVenularResistanceMmHgSecPerMl)
          .toBe(before.distalVenularResistanceMmHgSecPerMl);
        expect(after.c1ProximalArterial).toBe(before.c1ProximalArterial);
        expect(after.c2DistalVenous).toBe(before.c2DistalVenous);
      }
    }
    expect(() => applyBeatingReferenceR1CalibrationV2(
      calibrated,
      calibrated.construction.beatingReferenceR1Calibration!,
    )).toThrow(/already applied/);
    expect(() => repartitionCoronaryMicrovascularResistanceV2(
      calibrated,
      CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
    )).toThrow(/must precede beating-reference/);
    expect(() => scaleCoronaryLargeArterialComplianceV2(calibrated, 0.8))
      .toThrow(/must precede beating-reference/);
    expect(() => scaleCoronaryIntramyocardialComplianceV2(calibrated, {
      c1Proximal: 1,
      c2Distal: 0.8,
    })).toThrow(/must precede beating-reference/);
  });

  it("labels 70:15:15 as a low-Rm ablation while preserving total resistance", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const changed = repartitionCoronaryMicrovascularResistanceV2(
      base,
      LOW_RM_70_15_15_REPARTITION_ABLATION_V2,
    );
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const before = base.territories[territoryId].layers[layerId];
        const after = changed.territories[territoryId].layers[layerId];
        const total = (layer: typeof before) =>
          layer.proximalArteriolarResistanceMmHgSecPerMl
          + layer.intermediateCapillaryResistanceMmHgSecPerMl
          + layer.distalVenularResistanceMmHgSecPerMl;
        expect(total(after)).toBeCloseTo(total(before), 12);
        expect(after.intermediateCapillaryResistanceMmHgSecPerMl)
          .toBeCloseTo(
            0.5 * before.intermediateCapillaryResistanceMmHgSecPerMl,
            12,
          );
        expect(after.distalVenularResistanceMmHgSecPerMl)
          .toBeCloseTo(
            1.5 * before.distalVenularResistanceMmHgSecPerMl,
            12,
          );
      }
    }
  });

  it("scales epicardial compliance without changing its loaded structural point", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const scaled = scaleCoronaryLargeArterialComplianceV2(base, 0.4);
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      const before = base.territories[territoryId];
      const after = scaled.territories[territoryId];
      expect(after.largeArterialColdSeedVolumeMl)
        .toBe(before.largeArterialColdSeedVolumeMl);
      expect(after.largeArterialPressureVolume.loadedSeedVolumeMl)
        .toBe(before.largeArterialPressureVolume.loadedSeedVolumeMl);
      expect(after.largeArterialPressureVolume.loadedSeedTransmuralPressureMmHg)
        .toBe(before.largeArterialPressureVolume.loadedSeedTransmuralPressureMmHg);
      expect(after.largeArterialPressureVolume.referenceComplianceMlPerMmHg)
        .toBeCloseTo(
          0.4 * before.largeArterialPressureVolume
            .referenceComplianceMlPerMmHg,
          14,
        );
    }
    expect(coronaryColdSeedBloodVolumeMlV2(scaled))
      .toBeCloseTo(coronaryColdSeedBloodVolumeMlV2(base), 14);
  });

  it("scales C1/C2 PV slopes without moving volume, pressure, resistance, or targets", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const scaled = scaleCoronaryIntramyocardialComplianceV2(base, {
      c1Proximal: 1,
      c2Distal: 0.5,
    });
    expect(scaled.construction.intramyocardialComplianceScale).toEqual({
      c1Proximal: 1,
      c2Distal: 0.5,
    });
    expect(coronaryTopologyPriorFingerprintV2(scaled))
      .not.toBe(coronaryTopologyPriorFingerprintV2(base));
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        const before = base.territories[territoryId].layers[layerId];
        const after = scaled.territories[territoryId].layers[layerId];
        expect(after.c1ProximalArterial.effectiveComplianceMlPerMmHg)
          .toBe(before.c1ProximalArterial.effectiveComplianceMlPerMmHg);
        expect(after.c2DistalVenous.effectiveComplianceMlPerMmHg)
          .toBeCloseTo(
            0.5 * before.c2DistalVenous.effectiveComplianceMlPerMmHg,
            14,
          );
        for (const compartment of [
          "c1ProximalArterial",
          "c2DistalVenous",
        ] as const) {
          expect(after[compartment].coldSeedVolumeMl)
            .toBe(before[compartment].coldSeedVolumeMl);
          expect(after[compartment].pressureVolume.loadedSeedVolumeMl)
            .toBe(before[compartment].pressureVolume.loadedSeedVolumeMl);
          expect(
            after[compartment].pressureVolume
              .loadedSeedTransmuralPressureMmHg,
          ).toBe(
            before[compartment].pressureVolume
              .loadedSeedTransmuralPressureMmHg,
          );
        }
        expect(after.proximalArteriolarResistanceMmHgSecPerMl)
          .toBe(before.proximalArteriolarResistanceMmHgSecPerMl);
        expect(after.intermediateCapillaryResistanceMmHgSecPerMl)
          .toBe(before.intermediateCapillaryResistanceMmHgSecPerMl);
        expect(after.distalVenularResistanceMmHgSecPerMl)
          .toBe(before.distalVenularResistanceMmHgSecPerMl);
      }
      expect(scaled.territories[territoryId].targetRestingFlowMlPerMin)
        .toBe(base.territories[territoryId].targetRestingFlowMlPerMin);
    }
    expect(coronaryColdSeedBloodVolumeMlV2(scaled))
      .toBeCloseTo(coronaryColdSeedBloodVolumeMlV2(base), 14);
  });

  it("rejects an overlapping or incomplete structural-volume ledger", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
    const malformed = {
      ...base,
      construction: {
        ...base.construction,
        bloodVolumeMlPer100G: {
          ...base.construction.bloodVolumeMlPer100G,
          exclusiveNormalizedFraction01: {
            ...base.construction.bloodVolumeMlPer100G
              .exclusiveNormalizedFraction01,
            largeVenous: 0.4,
          },
        },
      },
    } as unknown as typeof base;
    expect(() => validateCoronaryTopologyPriorV2(malformed))
      .toThrow(/mutually exclusive structural fractions/);
  });
});
