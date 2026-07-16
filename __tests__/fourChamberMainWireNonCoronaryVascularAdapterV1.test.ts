import { describe, expect, it } from "vitest";
import { defaultParams } from "@/engine/core/params";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import {
  MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  mainWireDefaultHemodynamicRuntimeControlsV1,
  resolveMainWireNonCoronaryHemodynamicGraphV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1,
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
  MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";
import {
  compileMainWireVascularPvLawSiV1,
  evaluateMainWireVascularPvAtPressureSiV1,
  evaluateMainWireVascularPvAtVolumeSiV1,
  mainWireVascularComplianceM3PerPaFromPtmPaV1,
  mainWireVascularPhysicalVolumeM3FromPtmPaV1,
  mainWireVascularPtmPaFromPhysicalVolumeM3V1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1";

const DEFAULT_PV_MODIFIERS = Object.freeze({
  venousTone: defaultParams().venousTone,
  arterialStiffness: defaultParams().arterialStiffness,
});

describe("four-chamber non-coronary main-wire vascular adapter V1", () => {
  it("selects exactly the reviewed 15 nodes and 11 vascular edges from the main-wire owners", () => {
    const contract = MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1;
    expect(MAIN_WIRE_HEART_BOUNDARY_NODE_NAMES_V1).toEqual(["LV", "LA", "RV", "RA"]);
    expect(MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1).toEqual([
      "Ao", "SA", "Art", "Cap", "SV", "VC",
      "PA", "PArt", "PCap", "PVen", "PVein",
    ]);
    expect(MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1).toEqual([
      "LV", "LA", "RV", "RA",
      "Ao", "SA", "Art", "Cap", "SV", "VC",
      "PA", "PArt", "PCap", "PVen", "PVein",
    ]);
    expect(MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1).toEqual([
      "Ao_SA", "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
      "PA_PArt", "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
    ]);
    expect(contract.circulationNodeNames).toHaveLength(15);
    expect(contract.vascularNodes.map((node) => node.name)).toEqual(
      MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    );
    expect(contract.edges.map((edge) => edge.name)).toEqual(
      MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
    );

    const sourceNodeNames = new Set(buildNodes().map((node) => node.name));
    const sourceEdgeNames = new Set(buildEdges().map((edge) => edge.name));
    expect(contract.circulationNodeNames.every((name) => sourceNodeNames.has(name))).toBe(true);
    expect(contract.edges.every((edge) => sourceEdgeNames.has(edge.name))).toBe(true);
    expect(contract.provenance).toMatchObject({
      graphResolverOwner: "engine/core/mainWireHemodynamicGraphV1.ts",
      topologyOwnerModule: "engine/core/topology.ts",
      nodeOwnerExport: "buildNodes",
      edgeOwnerExport: "buildEdges",
      defaultParameterOwner: "engine/core/params.ts#defaultParams",
      unitTransformationOnly: true,
    });
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.edges)).toBe(true);
  });

  it("is a replace-only distributed graph and does not duplicate the four-aggregate scaffold", () => {
    const contract = MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1;
    expect(contract.scope).toEqual({
      coronaryNetworkIncluded: false,
      heartValvesIncluded: false,
      heartChambersAreBoundaryNodes: true,
      solverIntegrationOwnedByThisContract: false,
      legacyAggregateFlowsIncludedInThisContract: false,
      legacyAggregateSolverCoexistsElsewhere: true,
      intendedIntegrationMode: "replace-not-augment",
    });
    expect(contract.vascularNodes.map((node) => node.name)).not.toContain("PV");
    expect(contract.edges.map((edge) => edge.name)).not.toEqual(
      expect.arrayContaining(["Q_sys", "Q_pul", "Q_VC", "Q_PV"]),
    );
    expect(contract.vascularNodes.map((node) => node.name)).toEqual(
      expect.arrayContaining(["Ao", "Art", "Cap", "VC", "PArt", "PCap", "PVen", "PVein"]),
    );
  });

  it("builds conservative directed incidence with one -1, one +1, and zero sum per edge", () => {
    const contract = MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1;
    expect(contract.incidenceMatrix).toHaveLength(15);
    expect(contract.incidenceMatrix.every((row) => row.length === 11)).toBe(true);
    expect(contract.incidenceColumnSums).toEqual(Array(11).fill(0));
    contract.edges.forEach((edge, columnIndex) => {
      const column = contract.incidenceMatrix.map((row) => row[columnIndex]);
      expect(column.filter((entry) => entry === -1)).toHaveLength(1);
      expect(column.filter((entry) => entry === 1)).toHaveLength(1);
      expect(column.reduce((sum, entry) => sum + entry, 0)).toBe(0);
      expect(column).toEqual(edge.incidenceColumn);
      expect(column[contract.circulationNodeNames.indexOf(edge.upstream)]).toBe(-1);
      expect(column[contract.circulationNodeNames.indexOf(edge.downstream)]).toBe(1);
    });
  });

  it("normalizes PVein_LA with zero ostial inertance as algebraic while retaining two root flow states", () => {
    const graph = MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1;
    expect(graph.dynamicEdgeNames).toEqual(["Ao_SA", "PA_PArt"]);
    expect(graph.algebraicEdgeNames).toEqual([
      "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
      "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
    ]);
    const ostium = graph.edges.find((edge) => edge.name === "PVein_LA");
    expect(ostium).toMatchObject({
      sourceKind: "resistive",
      normalizedKind: "resistive",
      integrationClass: "algebraic-flow",
      effectiveInertanceMmHgSec2PerMl: 0,
    });
    expect(ostium?.sourceSpecMainWireUnits.pvOstialInertanceL).toBe(0);
  });

  it("uses defaultParams and exactly resolves effective Vu, stiffness, and group resistance scaling", () => {
    const defaults = defaultParams();
    expect(mainWireDefaultHemodynamicRuntimeControlsV1()).toEqual({
      venousTone: defaults.venousTone,
      arterialStiffness: defaults.arterialStiffness,
      systemicResistance: defaults.systemicResistance,
      pulmonaryResistance: defaults.pulmonaryResistance,
      useChiResistance: defaults.useChiResistance,
    });
    const graph = MAIN_WIRE_NON_CORONARY_DEFAULT_HEMODYNAMIC_GRAPH_V1;
    const sv = graph.vascularNodes.find((node) => node.name === "SV");
    expect(sv?.effectiveUnstressedVolumeMl).toBeCloseTo(1590.909 - 350 * defaults.venousTone, 14);
    const ao = graph.vascularNodes.find((node) => node.name === "Ao");
    expect(ao?.pvLawMainWireUnits).toMatchObject({
      kind: "arterial",
      VsEff: 150 / defaults.arterialStiffness,
    });
    const paPArt = graph.edges.find((edge) => edge.name === "PA_PArt");
    expect(paPArt?.effectiveResistanceMmHgSecPerMl).toBeCloseTo(
      0.01 * defaults.pulmonaryResistance,
      15,
    );
    const altered = resolveMainWireNonCoronaryHemodynamicGraphV1({
      venousTone: 0.4,
      arterialStiffness: 1.5,
      systemicResistance: 1.2,
      pulmonaryResistance: 0.8,
      useChiResistance: false,
    });
    expect(altered.vascularNodes.find((node) => node.name === "SV")?.effectiveUnstressedVolumeMl)
      .toBeCloseTo(1590.909 - 350 * 0.4, 14);
    expect(altered.vascularNodes.find((node) => node.name === "Ao")?.pvLawMainWireUnits)
      .toMatchObject({ kind: "arterial", VsEff: 100 });
    expect(altered.edges.find((edge) => edge.name === "Ao_SA")?.effectiveResistanceMmHgSecPerMl)
      .toBeCloseTo(0.0465088 * 1.2, 15);
    expect(() => resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      useChiResistance: true,
    })).toThrow(/pressure-dependent chi/);
  });

  it("does not silently floor disease/runtime parameters", () => {
    const compliant = resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      arterialStiffness: 0.1,
    });
    expect(compliant.vascularNodes.find((node) => node.name === "Ao")?.pvLawMainWireUnits)
      .toMatchObject({ kind: "arterial", VsEff: 1500 });
    expect(() => resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      nodeOverrides: { Cap: { C: 0 } },
    })).toThrow(/Cap\.C.*positive/);
    expect(() => resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      edgeOverrides: { Art_Cap: { R: 0 } },
    })).toThrow(/Art_Cap\.effectiveR.*positive/);
    expect(() => resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      edgeOverrides: { PVein_LA: { L: -1e-3 } },
    })).toThrow(/PVein_LA\.pvOstialInertanceL.*non-negative/);
    expect(() => resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      venousTone: 10,
    })).toThrow(/effectiveUnstressedVolumeMl.*non-negative/);
  });

  it("applies CoreRuntimeParams-compatible vascular node and edge overrides", () => {
    const graph = resolveMainWireNonCoronaryHemodynamicGraphV1({
      ...mainWireDefaultHemodynamicRuntimeControlsV1(),
      nodeOverrides: {
        SA: { Vu: 12, P0: 60, Vs: 450 },
        PVein: { Vu: 250, Copen: 5.5 },
      },
      edgeOverrides: {
        Art_Cap: { R: 0.72 },
        PVein_LA: { R: 0.02, L: 0, B: 2e-5 },
      },
    });
    expect(graph.provenance).toMatchObject({
      modelCoreParameterApplicationReference:
        "engine/ModelCore.ts#setImmediateParameters",
      modelCoreNumericalRuntimeParityClaimed: false,
      numericalSemanticsOwner: "four-chamber-main-wire-non-coronary-kernel",
    });
    const sa = graph.vascularNodes.find((node) => node.name === "SA")!;
    expect(sa.sourceSpecMainWireUnits).toMatchObject({ Vu: 12, P0: 60, Vs: 450 });
    expect(sa.effectiveUnstressedVolumeMl).toBe(12);
    expect(sa.pvLawMainWireUnits).toMatchObject({
      kind: "arterial",
      Vu: 12,
      P0: 60,
      VsEff: 600,
    });
    const pVein = graph.vascularNodes.find((node) => node.name === "PVein")!;
    expect(pVein.pvLawMainWireUnits).toMatchObject({
      kind: "venous3",
      Vu: 250,
      Copen: 5.5,
    });
    expect(graph.edges.find((edge) => edge.name === "Art_Cap"))
      .toMatchObject({ effectiveResistanceMmHgSecPerMl: 0.72 });

    const ostium = graph.edges.find((edge) => edge.name === "PVein_LA")!;
    expect(ostium).toMatchObject({
      normalizedKind: "resistive",
      integrationClass: "algebraic-flow",
      effectiveResistanceMmHgSecPerMl: 0.02,
      effectiveInertanceMmHgSec2PerMl: 0,
      effectiveQuadraticLossMmHgSec2PerMl2: 2e-5,
    });
    expect(ostium.sourceSpecMainWireUnits).toMatchObject({
      R: 0.02,
      L: 0,
      B: 2e-5,
      pvOstialResistanceR: 0.02,
      pvOstialInertanceL: 0,
      pvOstialQuadraticB: 2e-5,
    });
  });

  it("passes selected node overrides through the SI PV compiler", () => {
    const compiled = compileMainWireVascularPvLawSiV1("PVein", {
      ...DEFAULT_PV_MODIFIERS,
      nodeOverrides: {
        PVein: { Vu: 260, Copen: 6 },
      },
    });
    expect(compiled.effectiveUnstressedVolumeMl).toBe(260);
    expect(compiled.runtimeModifiers.nodeOverrides).toEqual({
      PVein: { Vu: 260, Copen: 6 },
    });
    expect(compiled.sourceLawMainWireUnits).toMatchObject({
      kind: "venous3",
      Vu: 260,
      Copen: 6,
    });
    expect(compiled.modelCoreInverseClippingReused).toBe(false);
    expect(compiled.outOfDomainPolicy).toBe("throw-not-modelcore-clip");
  });

  it("applies the exact mmHg/mL/s to Pa/m3/s coefficient conversions", () => {
    expect(MAIN_WIRE_RESISTANCE_SI_FACTOR_V1).toBe(MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e6);
    expect(MAIN_WIRE_INERTANCE_SI_FACTOR_V1).toBe(MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e6);
    expect(MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1).toBe(
      MAIN_WIRE_PASCAL_PER_MMHG_V1 * 1e12,
    );
    for (const edge of MAIN_WIRE_NON_CORONARY_VASCULAR_TOPOLOGY_V1.edges) {
      expect(edge.coefficients.resolvedMainWireDefaultsSi.resistancePaSecPerM3).toBe(
        edge.coefficients.resolvedMainWireDefaults.resistanceMmHgSecPerMl
          * MAIN_WIRE_RESISTANCE_SI_FACTOR_V1,
      );
      expect(edge.coefficients.resolvedMainWireDefaultsSi.inertancePaSec2PerM3).toBe(
        edge.coefficients.resolvedMainWireDefaults.inertanceMmHgSec2PerMl
          * MAIN_WIRE_INERTANCE_SI_FACTOR_V1,
      );
      expect(edge.coefficients.resolvedMainWireDefaultsSi.quadraticLossPaSec2PerM6).toBe(
        edge.coefficients.resolvedMainWireDefaults.quadraticLossMmHgSec2PerMl2
          * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
      );
    }
  });

  it("round-trips all 11 distributed vascular PV laws in SI with positive compliance", () => {
    const pressureMmHgByNode = {
      Ao: 90,
      SA: 85,
      Art: 70,
      Cap: 25,
      SV: 6,
      VC: 4,
      PA: 16,
      PArt: 13,
      PCap: 8,
      PVen: 6,
      PVein: 5,
    } as const;
    for (const nodeName of MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1) {
      const compiled = compileMainWireVascularPvLawSiV1(nodeName, DEFAULT_PV_MODIFIERS);
      const pressurePa = pressureMmHgByNode[nodeName] * MAIN_WIRE_PASCAL_PER_MMHG_V1;
      const volumeM3 = mainWireVascularPhysicalVolumeM3FromPtmPaV1(compiled, pressurePa);
      const recoveredPressurePa = mainWireVascularPtmPaFromPhysicalVolumeM3V1(
        compiled,
        volumeM3,
      );
      expect(recoveredPressurePa).toBeCloseTo(pressurePa, 8);
      expect(mainWireVascularComplianceM3PerPaFromPtmPaV1(compiled, pressurePa)).toBeGreaterThan(0);
      const evaluated = evaluateMainWireVascularPvAtVolumeSiV1(compiled, volumeM3, -250);
      expect(evaluated.transmuralPressurePa).toBeCloseTo(pressurePa, 8);
      expect(evaluated.absoluteMinusExternalPressurePa).toBeCloseTo(pressurePa, 10);
      expect(evaluated.absolutePressurePa).toBeCloseTo(pressurePa - 250, 10);
      expect(evaluated.complianceM3PerPa).toBeGreaterThan(0);
    }
  });

  it("keeps external pressure out of PV storage and satisfies dPsi/dV = Pabs - Pext", () => {
    const cases = [
      { nodeName: "Ao" as const, pressureMmHg: 90 },
      { nodeName: "Cap" as const, pressureMmHg: 25 },
      { nodeName: "SV" as const, pressureMmHg: 6 },
      { nodeName: "PCap" as const, pressureMmHg: 8 },
      { nodeName: "PVein" as const, pressureMmHg: 5 },
    ];
    for (const sample of cases) {
      const compiled = compileMainWireVascularPvLawSiV1(sample.nodeName, DEFAULT_PV_MODIFIERS);
      const pressurePa = sample.pressureMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1;
      const center = evaluateMainWireVascularPvAtPressureSiV1(compiled, pressurePa, 310);
      const deltaPressurePa = 0.005 * MAIN_WIRE_PASCAL_PER_MMHG_V1;
      const deltaVolumeM3 = center.complianceM3PerPa * deltaPressurePa;
      const plus = evaluateMainWireVascularPvAtVolumeSiV1(
        compiled,
        center.physicalVolumeM3 + deltaVolumeM3,
        310,
      );
      const minus = evaluateMainWireVascularPvAtVolumeSiV1(
        compiled,
        center.physicalVolumeM3 - deltaVolumeM3,
        310,
      );
      const energyDerivativePa = (plus.elasticEnergyJ - minus.elasticEnergyJ)
        / (2 * deltaVolumeM3);
      expect(Math.abs(energyDerivativePa - center.absoluteMinusExternalPressurePa)
        / Math.max(1, Math.abs(center.transmuralPressurePa))).toBeLessThan(2e-6);

      const shiftedExternal = evaluateMainWireVascularPvAtPressureSiV1(
        compiled,
        pressurePa,
        -520,
      );
      expect(shiftedExternal.physicalVolumeM3).toBe(center.physicalVolumeM3);
      expect(shiftedExternal.elasticEnergyJ).toBe(center.elasticEnergyJ);
      expect(shiftedExternal.absolutePressurePa - center.absolutePressurePa).toBe(-830);
      expect(center.elasticEnergyIncludesExternalPressure).toBe(false);
    }
  });

  it("fails closed on a positive-plateau override with nonpositive raw venous compliance", () => {
    expect(() => compileMainWireVascularPvLawSiV1("PVein", {
      ...DEFAULT_PV_MODIFIERS,
      nodeOverrides: {
        PVein: {
          Ccoll: 1,
          Copen: 10,
          Cdist: 1,
          Popen: 20,
          Pstiff: -10,
          dOpen: 1,
          dStiff: 1,
        },
      },
    })).toThrow(/raw venous compliance.*not work-conjugate|positivity cannot be certified/);
  });

  it("preserves dV/dP and dPsi/dV work conjugacy for a nondefault venous law", () => {
    const compiled = compileMainWireVascularPvLawSiV1("PVein", {
      ...DEFAULT_PV_MODIFIERS,
      nodeOverrides: {
        PVein: {
          Ccoll: 0.8,
          Copen: 7,
          Cdist: 1.1,
          Popen: -3,
          Pstiff: 18,
          dOpen: 0.8,
          dStiff: 4,
        },
      },
    });
    for (const pressureMmHg of [-12, -2, 8, 30]) {
      const pressurePa = pressureMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1;
      const center = evaluateMainWireVascularPvAtPressureSiV1(
        compiled,
        pressurePa,
        275,
      );
      const deltaPressurePa = 0.002 * MAIN_WIRE_PASCAL_PER_MMHG_V1;
      const volumePlus = mainWireVascularPhysicalVolumeM3FromPtmPaV1(
        compiled,
        pressurePa + deltaPressurePa,
      );
      const volumeMinus = mainWireVascularPhysicalVolumeM3FromPtmPaV1(
        compiled,
        pressurePa - deltaPressurePa,
      );
      const finiteDifferenceCompliance =
        (volumePlus - volumeMinus) / (2 * deltaPressurePa);
      expect(Math.abs(finiteDifferenceCompliance - center.complianceM3PerPa)
        / center.complianceM3PerPa).toBeLessThan(2e-7);

      const deltaVolumeM3 = center.complianceM3PerPa * deltaPressurePa;
      const plus = evaluateMainWireVascularPvAtVolumeSiV1(
        compiled,
        center.physicalVolumeM3 + deltaVolumeM3,
        275,
      );
      const minus = evaluateMainWireVascularPvAtVolumeSiV1(
        compiled,
        center.physicalVolumeM3 - deltaVolumeM3,
        275,
      );
      const energyDerivativePa =
        (plus.elasticEnergyJ - minus.elasticEnergyJ) / (2 * deltaVolumeM3);
      expect(Math.abs(energyDerivativePa - pressurePa)
        / Math.max(1, Math.abs(pressurePa))).toBeLessThan(3e-6);
    }
  });

  it("fails closed outside the shared inverse domain rather than clipping pressure", () => {
    const pVein = compileMainWireVascularPvLawSiV1("PVein", DEFAULT_PV_MODIFIERS);
    expect(() => mainWireVascularPhysicalVolumeM3FromPtmPaV1(
      pVein,
      46 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
    )).toThrow(/outside main-wire inverse support/);
    expect(() => compileMainWireVascularPvLawSiV1("Ao", {
      venousTone: 0.15,
      arterialStiffness: 0,
    })).toThrow(/arterialStiffness/);
  });
});
