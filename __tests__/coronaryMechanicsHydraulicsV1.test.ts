import { describe, expect, it } from "vitest";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V1,
  CORONARY_EDGE_IDS_V1,
  NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
  buildCoronaryTopologyV1,
  coronaryColdSeedBloodVolumeMlV1,
  evaluateAllCoronaryImpV1,
  evaluateCollapsibleIntramyocardialPvV1,
  evaluateCoronaryImpV1,
  evaluateSignedLinearQuadraticLossV1,
  evaluateVolumeDependentCoronaryResistanceV1,
  initialCoronaryToneStateV1,
  mapYoungTsaiCoronaryStenosisV1,
  stepCoronaryAutoregulationV1,
  type CollapsibleIntramyocardialPvPriorV1,
  type CoronaryAutoregulationPriorV1,
  type CoronaryMechanicsInputV1,
  type VolumeDependentCoronaryResistancePriorV1,
} from "@/engine/coronary";
import {
  CORONARY_DISEASE_RESEARCH_BRACKET_IDS_V1,
  CORONARY_DISEASE_RESEARCH_BRACKETS_V1,
} from "@/engine/coronary/coronaryDiseaseResearchBracketsV1";

const mechanicsInput: CoronaryMechanicsInputV1 = Object.freeze({
  externalPressureMmHg: 3,
  chamberTransmuralPressureMmHg: Object.freeze({ LV: 117, RV: 27 }),
  landActiveFiberStressPaByWall: Object.freeze({
    LVFW: 120_000,
    SEP: 100_000,
    RVFW: 45_000,
  }),
});

const pvPrior: CollapsibleIntramyocardialPvPriorV1 = Object.freeze({
  referenceVolumeMl: 8,
  pressureScaleMmHg: 8,
  expansionExponent: 1,
  collapseExponent: 2,
});

const resistancePrior: VolumeDependentCoronaryResistancePriorV1 = Object.freeze({
  referenceResistanceMmHgSecPerMl: 30,
  referenceVolumeMl: 8,
  residualHydraulicAreaFraction: 0.1,
});

const tonePrior: CoronaryAutoregulationPriorV1 = Object.freeze({
  minimumResistanceScale: 0.25,
  maximumResistanceScale: 2,
  responseTimeConstantSec: 5,
  referencePerfusionPressureMmHg: 85,
  myogenicPressureGain: 0.25,
  metabolicFlowErrorGain: 1,
  minimumSignalFraction: 0.05,
});

describe("coronary V1 topology and normal-adult prior", () => {
  it("owns exactly ten conserved volumes, three territory tone states, and no inertance", () => {
    const topology = buildCoronaryTopologyV1();
    expect(topology.nodes.map((node) => node.nodeId))
      .toEqual(CORONARY_CONSERVED_VOLUME_NODE_IDS_V1);
    expect(topology.edges.map((edge) => edge.edgeId))
      .toEqual(CORONARY_EDGE_IDS_V1);
    expect(topology.nodes).toHaveLength(10);
    expect(topology.edges).toHaveLength(16);
    expect(NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1.claims).toMatchObject({
      conservedVolumeNodeCount: 10,
      acceptedToneStateCount: 3,
      inertanceIncluded: false,
      totalBloodVolumeLedgerRequired: true,
      legacyModelCoreCoronaryHeuristicsUsed: false,
    });
    expect(coronaryColdSeedBloodVolumeMlV1()).toBeCloseTo(17.556, 12);
    expect(coronaryColdSeedBloodVolumeMlV1()).toBeCloseTo(
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
        .coldSeedCoronaryBloodVolumeMl,
      12,
    );
  });

  it("binds resting flow and blood volume to modeled ventricular mass", () => {
    const territories = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1.territories;
    const construction = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction;
    expect(construction.referenceVentricularMyocardialMassG)
      .toBeCloseTo(146.3, 12);
    expect(
      territories.LAD.targetRestingFlowMlPerMin
      + territories.LCx.targetRestingFlowMlPerMin
      + territories.RCA.targetRestingFlowMlPerMin,
    ).toBeCloseTo(146.3, 12);
    expect(construction.targetTotalRestingFlowMlPerMin
      / construction.referenceVentricularMyocardialMassG)
      .toBeCloseTo(1, 14);
    for (const territory of Object.values(territories)) {
      const fractions = territory.layers;
      expect(
        fractions.subepicardial.restingFlowFractionWithinTerritory01
        + fractions.subendocardial.restingFlowFractionWithinTerritory01,
      ).toBeCloseTo(1, 14);
      expect(
        fractions.subendocardial.restingFlowFractionWithinTerritory01
        / fractions.subepicardial.restingFlowFractionWithinTerritory01,
      ).toBeCloseTo(1.11, 14);
      for (const layer of Object.values(fractions)) {
        expect(layer.coldSeedVolumeMl / layer.collapsiblePv.referenceVolumeMl)
          .toBeCloseTo(
            construction.loadedToZeroTransmuralIntramyocardialVolumeRatio,
            14,
          );
        expect(evaluateCollapsibleIntramyocardialPvV1(
          layer.coldSeedVolumeMl,
          layer.collapsiblePv,
        ).transmuralPressureMmHg).toBeCloseTo(
          construction.loadedReferenceTransmuralPressureMmHg,
          12,
        );
        expect(layer.collapsiblePv.expansionExponent).toBe(4);
        expect(layer.arteriolarResistance.referenceVolumeMl)
          .toBe(layer.coldSeedVolumeMl);
        expect(layer.venularResistance.referenceVolumeMl)
          .toBe(layer.coldSeedVolumeMl);
      }
    }
  });

  it("rejects malformed nested custom priors when the topology is built", () => {
    const base = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1;
    const invalidPv = {
      ...base,
      territories: {
        ...base.territories,
        LAD: {
          ...base.territories.LAD,
          layers: {
            ...base.territories.LAD.layers,
            subepicardial: {
              ...base.territories.LAD.layers.subepicardial,
              collapsiblePv: {
                ...base.territories.LAD.layers.subepicardial.collapsiblePv,
                pressureScaleMmHg: 0,
              },
            },
          },
        },
      },
    } as typeof base;
    expect(() => buildCoronaryTopologyV1(invalidPv))
      .toThrow(/pressureScaleMmHg/);

    const invalidResistance = {
      ...base,
      territories: {
        ...base.territories,
        LCx: {
          ...base.territories.LCx,
          layers: {
            ...base.territories.LCx.layers,
            subendocardial: {
              ...base.territories.LCx.layers.subendocardial,
              venularResistance: {
                ...base.territories.LCx.layers.subendocardial.venularResistance,
                residualHydraulicAreaFraction: 1,
              },
            },
          },
        },
      },
    } as typeof base;
    expect(() => buildCoronaryTopologyV1(invalidResistance))
      .toThrow(/residual hydraulic area fraction/);

    const invalidStenosis = {
      ...base,
      territories: {
        ...base.territories,
        RCA: {
          ...base.territories.RCA,
          stenosisGeometry: {
            ...base.territories.RCA.stenosisGeometry,
            bloodDynamicViscosityPaSec: Number.NaN,
          },
        },
      },
    } as typeof base;
    expect(() => buildCoronaryTopologyV1(invalidStenosis))
      .toThrow(/bloodDynamicViscosityPaSec/);

    const invalidAutoregulation = {
      ...base,
      territories: {
        ...base.territories,
        LAD: {
          ...base.territories.LAD,
          autoregulation: {
            ...base.territories.LAD.autoregulation,
            responseTimeConstantSec: -1,
          },
        },
      },
    } as typeof base;
    expect(() => buildCoronaryTopologyV1(invalidAutoregulation))
      .toThrow(/responseTimeConstantSec/);
  });

  it("uses Chilian-informed rest-to-hyperemia resistance redistribution without double-counting CS resistance", () => {
    const territory = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1.territories.LAD;
    const layer = territory.layers.subepicardial;
    const layerFlowMlPerSec = territory.targetRestingFlowMlPerMin / 60
      * layer.restingFlowFractionWithinTerritory01;
    const totalFlowMlPerSec = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction.targetTotalRestingFlowMlPerMin / 60;
    const arterialDrop = territory.healthyDistributedArterialResistanceMmHgSecPerMl
      * territory.targetRestingFlowMlPerMin / 60;
    const microDrop = layer.arteriolarResistance.referenceResistanceMmHgSecPerMl
      * layerFlowMlPerSec;
    const venularDrop = layer.venularResistance.referenceResistanceMmHgSecPerMl
      * layerFlowMlPerSec;
    const sinusDrop = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1.coronarySinus
      .outletResistanceMmHgSecPerMl * totalFlowMlPerSec;
    expect(arterialDrop).toBeCloseTo(0.28 * 85, 12);
    expect(microDrop).toBeCloseTo(0.65 * 85, 12);
    expect(venularDrop + sinusDrop).toBeCloseTo(0.07 * 85, 12);
    expect(territory.autoregulation.minimumResistanceScale)
      .toBeCloseTo(4 / 45, 14);
    expect(
      territory.autoregulation.minimumResistanceScale
        ** territory.distributedArterialToneExponent,
    ).toBeCloseTo(6 / 17, 14);
  });
});

describe("coronary disease research brackets V1", () => {
  it("keeps focal diameter loss, derived area, and structural CMD independent", () => {
    expect(Object.keys(CORONARY_DISEASE_RESEARCH_BRACKETS_V1))
      .toEqual([...CORONARY_DISEASE_RESEARCH_BRACKET_IDS_V1]);
    const focal = CORONARY_DISEASE_RESEARCH_BRACKETS_V1
      ["LAD-diameter-loss-0p70"];
    expect(focal.disease.LAD.diameterStenosisFraction01).toBe(0.7);
    expect(focal.derivedResidualAreaFraction01ByTerritory.LAD)
      .toBeCloseTo(0.09, 14);
    expect(focal.disease.LAD.microvascularStructuralResistanceScale).toBe(1);

    const cmd = CORONARY_DISEASE_RESEARCH_BRACKETS_V1
      ["diffuse-microvascular-resistance-2p50"];
    expect(cmd.disease.LAD.diameterStenosisFraction01).toBe(0);
    expect(cmd.disease.LAD.microvascularStructuralResistanceScale).toBe(2.5);
    expect(cmd.derivedResidualAreaFraction01ByTerritory.LAD).toBe(1);
  });

  it("labels quantitative brackets without claiming clinical severity", () => {
    for (const bracket of Object.values(CORONARY_DISEASE_RESEARCH_BRACKETS_V1)) {
      expect(bracket.claim).toEqual({
        quantitativeResearchBracketNotClinicalDiagnosis: true,
        diameterLossNotAreaLoss: true,
        focalAndMicrovascularAxesIndependent: true,
        autoregulatoryToneNotEncodedAsDisease: true,
        patientSpecificFittingClaimed: false,
      });
    }
  });
});

describe("mechanics-driven coronary intramyocardial pressure", () => {
  it("adds the common external pressure exactly once and separates CEP from Land active stress", () => {
    const noStress: CoronaryMechanicsInputV1 = {
      ...mechanicsInput,
      landActiveFiberStressPaByWall: { LVFW: 0, SEP: 0, RVFW: 0 },
    };
    const evaluation = evaluateCoronaryImpV1(
      "LCx",
      "subendocardial",
      noStress,
    );
    expect(evaluation.cavityInducedExtracellularPressureMmHg)
      .toBeCloseTo(3 + 0.75 * 117, 12);
    expect(evaluation.activeStressInducedPressureMmHg).toBe(0);
    expect(evaluation.intramyocardialPressureMmHg)
      .toBe(evaluation.cavityInducedExtracellularPressureMmHg);

    const withStress = evaluateCoronaryImpV1(
      "LCx",
      "subendocardial",
      mechanicsInput,
    );
    expect(withStress.activeStressInducedPressureMmHg)
      .toBeCloseTo(0.06 * 120_000 / 133.322, 12);
    expect(withStress.intramyocardialPressureMmHg)
      .toBeCloseTo(
        withStress.cavityInducedExtracellularPressureMmHg
        + withStress.activeStressInducedPressureMmHg,
        12,
      );
  });

  it("makes LV endocardial IMP exceed epicardial IMP and preserves lower RCA compression", () => {
    const all = evaluateAllCoronaryImpV1(mechanicsInput);
    expect(all.LAD.subendocardial.intramyocardialPressureMmHg)
      .toBeGreaterThan(all.LAD.subepicardial.intramyocardialPressureMmHg);
    expect(all.LCx.subendocardial.intramyocardialPressureMmHg)
      .toBeGreaterThan(all.LCx.subepicardial.intramyocardialPressureMmHg);
    expect(all.RCA.subendocardial.intramyocardialPressureMmHg)
      .toBeLessThan(all.LAD.subendocardial.intramyocardialPressureMmHg);
    expect(all.RCA.subendocardial.intramyocardialPressureMmHg)
      .toBeLessThan(all.LCx.subendocardial.intramyocardialPressureMmHg);
  });

  it("orients septal depth toward LV for LAD and toward RV for RCA", () => {
    const lad = evaluateCoronaryImpV1("LAD", "subendocardial", mechanicsInput);
    const rca = evaluateCoronaryImpV1("RCA", "subendocardial", mechanicsInput);
    expect(lad.derivative.dImpDChamberTransmuralPressure.LV)
      .toBeGreaterThan(lad.derivative.dImpDChamberTransmuralPressure.RV);
    expect(rca.derivative.dImpDChamberTransmuralPressure.RV)
      .toBeGreaterThan(rca.derivative.dImpDChamberTransmuralPressure.LV);
    expect(rca.derivative.dImpDChamberTransmuralPressure.RV)
      .toBeCloseTo(0.75, 14);
  });

  it("reports analytic pressure and stress derivatives matching central differences", () => {
    const base = evaluateCoronaryImpV1("LAD", "subendocardial", mechanicsInput);
    const hPressure = 1e-5;
    const shiftedPressure = (field: "LV" | "RV", delta: number) =>
      evaluateCoronaryImpV1("LAD", "subendocardial", {
        ...mechanicsInput,
        chamberTransmuralPressureMmHg: {
          ...mechanicsInput.chamberTransmuralPressureMmHg,
          [field]: mechanicsInput.chamberTransmuralPressureMmHg[field] + delta,
        },
      }).intramyocardialPressureMmHg;
    for (const field of ["LV", "RV"] as const) {
      const numerical = (
        shiftedPressure(field, hPressure) - shiftedPressure(field, -hPressure)
      ) / (2 * hPressure);
      expect(numerical).toBeCloseTo(
        base.derivative.dImpDChamberTransmuralPressure[field],
        8,
      );
    }

    const hStressPa = 0.1;
    const shiftedStress = (delta: number) => evaluateCoronaryImpV1(
      "LAD",
      "subendocardial",
      {
        ...mechanicsInput,
        landActiveFiberStressPaByWall: {
          ...mechanicsInput.landActiveFiberStressPaByWall,
          LVFW: mechanicsInput.landActiveFiberStressPaByWall.LVFW + delta,
        },
      },
    ).intramyocardialPressureMmHg;
    const stressNumerical = (
      shiftedStress(hStressPa) - shiftedStress(-hStressPa)
    ) / (2 * hStressPa);
    expect(stressNumerical).toBeCloseTo(
      base.derivative.dImpDLandActiveFiberStressPaByWall.LVFW,
      9,
    );
    expect(base.derivative.dImpDExternalPressure).toBe(1);
  });

  it("fails closed on negative active stress or non-normalized territory weights", () => {
    expect(() => evaluateCoronaryImpV1("LAD", "subepicardial", {
      ...mechanicsInput,
      landActiveFiberStressPaByWall: { LVFW: -1, SEP: 0, RVFW: 0 },
    })).toThrow(/non-negative/);
    expect(() => evaluateCoronaryImpV1(
      "LAD",
      "subepicardial",
      mechanicsInput,
      {
        ...NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1,
        perfusedWallWeightByTerritory: {
          ...NORMAL_ADULT_CORONARY_IMP_COUPLING_PRIOR_V1.perfusedWallWeightByTerritory,
          LAD: { LVFW: 1, SEP: 1, RVFW: 0 },
        },
      },
    )).toThrow(/sum to one/);
  });
});

describe("collapsible intramyocardial PV and volume-dependent resistance", () => {
  it("is smooth, strictly pressure-monotone, and has positive compliance", () => {
    const collapsed = evaluateCollapsibleIntramyocardialPvV1(4, pvPrior);
    const reference = evaluateCollapsibleIntramyocardialPvV1(8, pvPrior);
    const expanded = evaluateCollapsibleIntramyocardialPvV1(12, pvPrior);
    expect(collapsed.transmuralPressureMmHg).toBeLessThan(0);
    expect(reference.transmuralPressureMmHg).toBeCloseTo(0, 14);
    expect(expanded.transmuralPressureMmHg).toBeGreaterThan(0);
    expect(collapsed.transmuralPressureMmHg)
      .toBeLessThan(reference.transmuralPressureMmHg);
    expect(reference.transmuralPressureMmHg)
      .toBeLessThan(expanded.transmuralPressureMmHg);
    for (const value of [collapsed, reference, expanded]) {
      expect(value.complianceMlPerMmHg).toBeGreaterThan(0);
      expect(value.dTransmuralPressureDVolumeMmHgPerMl).toBeGreaterThan(0);
    }
    expect(reference.dTransmuralPressureDVolumeMmHgPerMl)
      .toBeCloseTo(8 * (1 + 2) / 8, 14);
  });

  it("matches the analytic PV tangent and resistance derivative", () => {
    const volume = 6.7;
    const h = 1e-5;
    const pv = evaluateCollapsibleIntramyocardialPvV1(volume, pvPrior);
    const pvNumerical = (
      evaluateCollapsibleIntramyocardialPvV1(volume + h, pvPrior)
        .transmuralPressureMmHg
      - evaluateCollapsibleIntramyocardialPvV1(volume - h, pvPrior)
        .transmuralPressureMmHg
    ) / (2 * h);
    expect(pvNumerical).toBeCloseTo(
      pv.dTransmuralPressureDVolumeMmHgPerMl,
      8,
    );

    const resistance = evaluateVolumeDependentCoronaryResistanceV1(
      volume,
      resistancePrior,
    );
    const resistanceNumerical = (
      evaluateVolumeDependentCoronaryResistanceV1(volume + h, resistancePrior)
        .resistanceMmHgSecPerMl
      - evaluateVolumeDependentCoronaryResistanceV1(volume - h, resistancePrior)
        .resistanceMmHgSecPerMl
    ) / (2 * h);
    expect(resistanceNumerical).toBeCloseTo(
      resistance.dResistanceDVolumeMmHgSecPerMl2,
      7,
    );
  });

  it("owns compression resistance without a second distension-driven hyperemic gain", () => {
    const zero = evaluateVolumeDependentCoronaryResistanceV1(0, resistancePrior);
    const collapsed = evaluateVolumeDependentCoronaryResistanceV1(4, resistancePrior);
    const reference = evaluateVolumeDependentCoronaryResistanceV1(8, resistancePrior);
    const expanded = evaluateVolumeDependentCoronaryResistanceV1(16, resistancePrior);
    expect(zero.resistanceScale).toBeCloseTo(zero.maximumResistanceScale, 12);
    expect(Number.isFinite(zero.resistanceMmHgSecPerMl)).toBe(true);
    expect(zero.resistanceMmHgSecPerMl).toBeGreaterThan(collapsed.resistanceMmHgSecPerMl);
    expect(collapsed.resistanceMmHgSecPerMl).toBeGreaterThan(reference.resistanceMmHgSecPerMl);
    expect(reference.resistanceMmHgSecPerMl).toBeCloseTo(30, 12);
    expect(expanded.resistanceMmHgSecPerMl)
      .toBeCloseTo(reference.resistanceMmHgSecPerMl, 14);
    expect(reference.resistanceMmHgSecPerMl)
      .toBeCloseTo(resistancePrior.referenceResistanceMmHgSecPerMl, 14);
    expect(reference.dResistanceDVolumeMmHgSecPerMl2).toBe(0);
    expect(expanded.dResistanceDVolumeMmHgSecPerMl2).toBe(0);
  });
});

describe("Young-Tsai-style coronary stenosis loss", () => {
  const geometry = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
    .territories.LAD.stenosisGeometry;

  it("maps zero stenosis to zero additional loss and increases both coefficients monotonically", () => {
    const healthy = mapYoungTsaiCoronaryStenosisV1(0, geometry);
    const moderate = mapYoungTsaiCoronaryStenosisV1(0.5, geometry);
    const severe = mapYoungTsaiCoronaryStenosisV1(0.8, geometry);
    expect(healthy.additionalLinearResistanceMmHgSecPerMl).toBeCloseTo(0, 14);
    expect(healthy.additionalQuadraticResistanceMmHgSec2PerMl2).toBeCloseTo(0, 14);
    expect(moderate.additionalLinearResistanceMmHgSecPerMl)
      .toBeGreaterThan(healthy.additionalLinearResistanceMmHgSecPerMl);
    expect(severe.additionalLinearResistanceMmHgSecPerMl)
      .toBeGreaterThan(moderate.additionalLinearResistanceMmHgSecPerMl);
    expect(moderate.additionalQuadraticResistanceMmHgSec2PerMl2)
      .toBeGreaterThan(healthy.additionalQuadraticResistanceMmHgSec2PerMl2);
    expect(severe.additionalQuadraticResistanceMmHgSec2PerMl2)
      .toBeGreaterThan(moderate.additionalQuadraticResistanceMmHgSec2PerMl2);
    expect(severe.residualAreaFraction01).toBeCloseTo(0.04, 14);
    expect(severe.inertanceIncluded).toBe(false);
  });

  it("is odd in signed flow, strictly dissipative, and exposes the exact flow tangent", () => {
    const coefficients = mapYoungTsaiCoronaryStenosisV1(0.7, geometry);
    const R = 0.2 + coefficients.additionalLinearResistanceMmHgSecPerMl;
    const B = coefficients.additionalQuadraticResistanceMmHgSec2PerMl2;
    const forward = evaluateSignedLinearQuadraticLossV1(2.3, R, B);
    const reverse = evaluateSignedLinearQuadraticLossV1(-2.3, R, B);
    expect(reverse.pressureLossMmHg).toBeCloseTo(-forward.pressureLossMmHg, 12);
    expect(forward.dissipatedPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(reverse.dissipatedPowerMmHgMlPerSec).toBeGreaterThan(0);
    expect(forward.dPressureLossDFlowMmHgSecPerMl).toBeGreaterThan(0);

    const h = 1e-6;
    const numerical = (
      evaluateSignedLinearQuadraticLossV1(2.3 + h, R, B).pressureLossMmHg
      - evaluateSignedLinearQuadraticLossV1(2.3 - h, R, B).pressureLossMmHg
    ) / (2 * h);
    expect(numerical).toBeCloseTo(
      forward.dPressureLossDFlowMmHgSecPerMl,
      7,
    );
    expect(evaluateSignedLinearQuadraticLossV1(0, R, B)).toMatchObject({
      pressureLossMmHg: 0,
      dPressureLossDFlowMmHgSecPerMl: R,
      dissipatedPowerMmHgMlPerSec: 0,
    });
  });
});

describe("bounded accepted-state coronary autoregulation", () => {
  const step = (
    stateScale: number,
    flow: number,
    pressure: number,
    hyperemia01 = 0,
    stepDtSec = 5,
  ) => stepCoronaryAutoregulationV1(
    initialCoronaryToneStateV1(stateScale),
    {
      stepDtSec,
      acceptedMeanFlowMlPerSec: flow,
      demandTargetFlowMlPerSec: 2,
      acceptedMeanPerfusionPressureMmHg: pressure,
      hyperemia01,
    },
    tonePrior,
  );

  it("dilates for supply below demand and constricts for excess flow or pressure", () => {
    const underSupplied = step(1, 1, 85);
    const reference = step(1, 2, 85);
    const overSupplied = step(1, 3, 85);
    const hypertension = step(1, 2, 140);
    expect(underSupplied.targetResistanceScale).toBeLessThan(1);
    expect(underSupplied.state.resistanceScale).toBeLessThan(1);
    expect(reference.targetResistanceScale).toBeCloseTo(1, 14);
    expect(reference.state.resistanceScale).toBeCloseTo(1, 14);
    expect(overSupplied.targetResistanceScale).toBeGreaterThan(1);
    expect(overSupplied.state.resistanceScale).toBeGreaterThan(1);
    expect(hypertension.targetResistanceScale).toBeGreaterThan(1);
  });

  it("keeps tone bounded and drives full hyperemia toward maximal dilation", () => {
    let state = initialCoronaryToneStateV1(1);
    let result = stepCoronaryAutoregulationV1(state, {
      stepDtSec: 0,
      acceptedMeanFlowMlPerSec: 2,
      demandTargetFlowMlPerSec: 2,
      acceptedMeanPerfusionPressureMmHg: 85,
      hyperemia01: 1,
    }, tonePrior);
    expect(result.state).toEqual(state);
    expect(result.targetResistanceScale).toBeCloseTo(0.25, 14);
    for (let index = 0; index < 40; index += 1) {
      result = stepCoronaryAutoregulationV1(state, {
        stepDtSec: 1,
        acceptedMeanFlowMlPerSec: 2,
        demandTargetFlowMlPerSec: 2,
        acceptedMeanPerfusionPressureMmHg: 85,
        hyperemia01: 1,
      }, tonePrior);
      state = result.state;
      expect(state.resistanceScale).toBeGreaterThanOrEqual(0.25);
      expect(state.resistanceScale).toBeLessThanOrEqual(2);
      expect(result.tone01).toBeGreaterThanOrEqual(0);
      expect(result.tone01).toBeLessThanOrEqual(1);
    }
    expect(state.resistanceScale).toBeCloseTo(0.25, 3);
  });

  it("uses exact first-order relaxation independent of accepted update partition", () => {
    const oneStep = step(1, 1, 85, 0, 4).state.resistanceScale;
    let splitState = initialCoronaryToneStateV1(1);
    for (let index = 0; index < 4; index += 1) {
      splitState = stepCoronaryAutoregulationV1(splitState, {
        stepDtSec: 1,
        acceptedMeanFlowMlPerSec: 1,
        demandTargetFlowMlPerSec: 2,
        acceptedMeanPerfusionPressureMmHg: 85,
        hyperemia01: 0,
      }, tonePrior).state;
    }
    expect(splitState.resistanceScale).toBeCloseTo(oneStep, 14);
  });
});
