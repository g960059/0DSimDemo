import { describe, expect, it } from "vitest";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_EDGE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  applyBeatingReferenceR1CalibrationV2,
  buildCoronaryTopologyV2,
  evaluateCrefAnchoredCollapsiblePvV2,
  invertCrefAnchoredCollapsiblePvV2,
  initialCoronaryToneStateV2,
  scaleCoronaryLargeArterialComplianceV2,
  type CoronaryEdgeIdV2,
  type CoronaryTopologyV2,
} from "@/engine/coronary";
import {
  CoronaryBackwardEulerTransactionV2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  buildCoronaryEdgeIndexV2,
  computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2,
  evaluateCoronaryHydraulicsV2,
  disableCoronaryCollapseHydraulicsV2,
  initializePressureLadderCoronaryStateV2,
  mapFocalDiameterStenosisV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryAcceptedHydraulicStateV2,
  type CoronaryBackwardEulerTrialInputV2,
  type CoronaryDiseaseInputV2,
  type CoronaryHydraulicBoundaryInputV2,
  type CoronaryImplicitBoundaryDirectionV2,
  type CoronaryLayerDiseaseInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import type {
  NonCoronaryConservativeCompanionSensitivitiesV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";

const DIASTOLIC_BOUNDARY_V2 = Object.freeze({
  absoluteAorticPressureMmHg: 95,
  absoluteRightAtrialPressureMmHg: 5,
  perivascularExternalPressureMmHg: 2,
  intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
    LAD: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
    LCx: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
    RCA: Object.freeze({ subepicardial: 5, subendocardial: 8 }),
  }),
}) satisfies CoronaryHydraulicBoundaryInputV2;

function withLayerDisease(
  territoryId: "LAD" | "LCx" | "RCA",
  layerId: "subepicardial" | "subendocardial",
  values: Partial<CoronaryLayerDiseaseInputV2>,
): CoronaryDiseaseInputV2 {
  const territory = NORMAL_CORONARY_DISEASE_INPUT_V2[territoryId];
  return Object.freeze({
    ...NORMAL_CORONARY_DISEASE_INPUT_V2,
    [territoryId]: Object.freeze({
      ...territory,
      layers: Object.freeze({
        ...territory.layers,
        [layerId]: Object.freeze({
          ...territory.layers[layerId],
          ...values,
        }),
      }),
    }),
  });
}

function withFocalStenosis(
  territoryId: "LAD" | "LCx" | "RCA",
  diameterStenosisFraction01: number,
): CoronaryDiseaseInputV2 {
  return Object.freeze({
    ...NORMAL_CORONARY_DISEASE_INPUT_V2,
    [territoryId]: Object.freeze({
      ...NORMAL_CORONARY_DISEASE_INPUT_V2[territoryId],
      ...mapFocalDiameterStenosisV2(
        territoryId,
        diameterStenosisFraction01,
      ),
    }),
  });
}

function reversedEdgeTopology(): CoronaryTopologyV2 {
  const canonical = buildCoronaryTopologyV2();
  const edges = Object.freeze([...canonical.edges].reverse());
  const edgeIndexById = Object.freeze(Object.fromEntries(
    edges.map((edge, index) => [edge.edgeId, index]),
  )) as CoronaryTopologyV2["edgeIndexById"];
  return Object.freeze({ ...canonical, edges, edgeIndexById });
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map((value) => Math.abs(value)));
}

function finiteDifferenceResolvedDirectionalShadow(
  previous: CoronaryAcceptedHydraulicStateV2,
  baseInput: CoronaryBackwardEulerTrialInputV2,
  direction: CoronaryImplicitBoundaryDirectionV2,
): Readonly<{
  dVolumeMlByNode: Readonly<Record<
    (typeof CORONARY_CONSERVED_VOLUME_NODE_IDS_V2)[number],
    number
  >>;
  dTotalVolumeMl: number;
  dTotalInletFlowMlPerSec: number;
  dCommonVenousOutletFlowMlPerSec: number;
}> {
  const plus = solveCoronaryBackwardEulerTrialV2(previous, {
    ...baseInput,
    boundary: direction.plusBoundary,
  });
  const minus = solveCoronaryBackwardEulerTrialV2(previous, {
    ...baseInput,
    boundary: direction.minusBoundary,
  });
  const denominator = 2 * direction.scaledStep;
  return Object.freeze({
    dVolumeMlByNode: Object.freeze(Object.fromEntries(
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) => [
        nodeId,
        (
          plus.candidateAcceptedState.volumeMlByNode[nodeId]
          - minus.candidateAcceptedState.volumeMlByNode[nodeId]
        ) / denominator,
      ]),
    )) as Readonly<Record<
      (typeof CORONARY_CONSERVED_VOLUME_NODE_IDS_V2)[number],
      number
    >>,
    dTotalVolumeMl:
      (
        plus.diagnostics.candidateCoronaryBloodVolumeMl
        - minus.diagnostics.candidateCoronaryBloodVolumeMl
      ) / denominator,
    dTotalInletFlowMlPerSec:
      (
        plus.diagnostics.hydraulics.totalInletFlowMlPerSec
        - minus.diagnostics.hydraulics.totalInletFlowMlPerSec
      ) / denominator,
    dCommonVenousOutletFlowMlPerSec:
      (
        plus.diagnostics.hydraulics.commonCoronaryVenousOutletFlowMlPerSec
        - minus.diagnostics.hydraulics.commonCoronaryVenousOutletFlowMlPerSec
      ) / denominator,
  });
}

function expectStrictDirectionalAgreement(
  actual: number,
  shadow: number,
  absoluteTolerance: number,
  relativeTolerance: number,
): void {
  expect(Math.abs(actual - shadow)).toBeLessThanOrEqual(
    absoluteTolerance + relativeTolerance * Math.abs(shadow),
  );
}

describe("sixteen-volume coronary backward-Euler hydraulic network V2", () => {
  it("inverts the coercive PV law and keeps loaded hydraulic area distinct from zero-Ptm Vref", () => {
    const topology = buildCoronaryTopologyV2();
    const collapse = buildCoronaryCollapseHydraulicsPriorV2(topology);
    expect(collapse.referenceOwner)
      .toBe("loaded-cold-volume-ablation-prior-not-zero-ptm-pv-volume");
    let distinctReferenceCount = 0;
    for (const node of topology.nodes) {
      for (const pressure of [-40, -5, 0, 5, 40]) {
        const volume = invertCrefAnchoredCollapsiblePvV2(
          pressure,
          node.pressureVolume,
        );
        expect(evaluateCrefAnchoredCollapsiblePvV2(
          volume,
          node.pressureVolume,
        ).transmuralPressureMmHg).toBeCloseTo(pressure, 9);
      }
      expect(collapse.hydraulicAreaReferenceVolumeMlByNode[node.nodeId])
        .toBeCloseTo(node.coldSeedVolumeMl, 14);
      if (
        Math.abs(
          node.coldSeedVolumeMl - node.pressureVolume.referenceVolumeMl,
        ) > 1e-12
      ) {
        distinctReferenceCount += 1;
      }
    }
    expect(distinctReferenceCount).toBe(16);
  });

  it("constructs a constant-boundary steady pressure ladder and reports, rather than hides, TBV transfer", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const { diagnostics } = initialized;
    expect(diagnostics.maximumAbsoluteNodeContinuityResidualMlPerSec)
      .toBeLessThan(1e-10);
    const expectedFlowMlPerMin =
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.construction
        .targetTotalRestingFlowMlPerMin
      * (95 - 5)
      / NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.construction
        .referencePerfusionPressureDropMmHg;
    expect(diagnostics.hydraulics.totalInletFlowMlPerSec * 60)
      .toBeCloseTo(expectedFlowMlPerMin, 9);
    expect(diagnostics.hydraulics.commonCoronaryVenousOutletFlowMlPerSec)
      .toBeCloseTo(diagnostics.hydraulics.totalInletFlowMlPerSec, 10);
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      const hydraulics = diagnostics.hydraulics;
      const expectedOutflow = CORONARY_LAYER_IDS_V2.reduce(
        (total, layerId) => total
          + hydraulics.layerR1FlowMlPerSecByTerritory[territoryId][layerId],
        0,
      );
      expect(hydraulics.largeArterialOutflowMlPerSecByTerritory[territoryId])
        .toBeCloseTo(expectedOutflow, 14);
      expect(hydraulics.largeArterialStorageRateMlPerSecByTerritory[territoryId])
        .toBeCloseTo(
          hydraulics.inletFlowMlPerSecByTerritory[territoryId]
            - expectedOutflow,
          14,
        );
      expect(hydraulics.largeArterialStorageRateMlPerSecByTerritory[territoryId])
        .toBeCloseTo(0, 10);
    }
    expect(diagnostics.requiredCoronaryVolumeTransferMl).toBeCloseTo(
      diagnostics.pressureConsistentCoronaryBloodVolumeMl
      - diagnostics.structuralPriorCoronaryBloodVolumeMl,
      14,
    );
    // The anatomical Kassab ledger is not an isolated steady-volume clamp.
    expect(Math.abs(diagnostics.requiredCoronaryVolumeTransferMl))
      .toBeGreaterThan(0.1);

    const pressure = diagnostics.hydraulics.absolutePressureMmHgByNode;
    expect(pressure.Ao).toBeGreaterThan(pressure["LAD.Art"]);
    expect(pressure["LAD.Art"])
      .toBeGreaterThan(pressure["LAD.IM.Art.subepicardial"]);
    expect(pressure["LAD.IM.Art.subepicardial"])
      .toBeGreaterThan(pressure["LAD.IM.Ven.subepicardial"]);
    expect(pressure["LAD.IM.Ven.subepicardial"]).toBeGreaterThan(pressure.CV);
    expect(pressure.CV).toBeGreaterThan(pressure.RA);

    const stationary = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      { dtSec: 0.01, boundary: DIASTOLIC_BOUNDARY_V2 },
    );
    expect(stationary.diagnostics.newtonIterations).toBe(0);
    expect(maximumAbsolute(Object.values(
      stationary.diagnostics.storageRateMlPerSecByNode,
    ))).toBeLessThan(1e-12);
    expect(NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.claims.simulationReady)
      .toBe(false);
  });

  it("matches full-resolve central shadows with implicit sensitivities at the normal operating point", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const baseInput = Object.freeze({
      dtSec: 0.005,
      boundary: DIASTOLIC_BOUNDARY_V2,
    }) satisfies CoronaryBackwardEulerTrialInputV2;
    const baseTrial = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      baseInput,
    );
    const h = 1e-3;
    const directions = Object.freeze([
      Object.freeze({
        scaledStep: h,
        minusBoundary: Object.freeze({
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteAorticPressureMmHg:
            DIASTOLIC_BOUNDARY_V2.absoluteAorticPressureMmHg - 0.01,
        }),
        plusBoundary: Object.freeze({
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteAorticPressureMmHg:
            DIASTOLIC_BOUNDARY_V2.absoluteAorticPressureMmHg + 0.01,
        }),
      }),
      Object.freeze({
        scaledStep: h,
        minusBoundary: Object.freeze({
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteRightAtrialPressureMmHg:
            DIASTOLIC_BOUNDARY_V2.absoluteRightAtrialPressureMmHg - 0.004,
          intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
            LAD: Object.freeze({ subepicardial: 5.98, subendocardial: 9.97 }),
            LCx: Object.freeze({ subepicardial: 5.98, subendocardial: 9.97 }),
            RCA: Object.freeze({ subepicardial: 4.99, subendocardial: 7.98 }),
          }),
        }),
        plusBoundary: Object.freeze({
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteRightAtrialPressureMmHg:
            DIASTOLIC_BOUNDARY_V2.absoluteRightAtrialPressureMmHg + 0.004,
          intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
            LAD: Object.freeze({ subepicardial: 6.02, subendocardial: 10.03 }),
            LCx: Object.freeze({ subepicardial: 6.02, subendocardial: 10.03 }),
            RCA: Object.freeze({ subepicardial: 5.01, subendocardial: 8.02 }),
          }),
        }),
      }),
    ]) satisfies readonly CoronaryImplicitBoundaryDirectionV2[];
    const implicit =
      computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
        previousAcceptedState: initialized.acceptedState,
        trialInput: baseInput,
        baseTrial,
        boundaryDirections: directions,
      });
    const companionShape: NonCoronaryConservativeCompanionSensitivitiesV1 =
      implicit.conservativeCompanionSensitivities;
    expect(companionShape
      .dCandidateCompanionBloodVolumeMlDScaledIndependentVolume)
      .toBe(implicit.dCandidateCoronaryBloodVolumeMlDScaledVariable);
    expect(companionShape
      .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume.Ao)
      .toEqual(implicit.dTotalInletFlowMlPerSecDScaledVariable.map(
        (value) => -value,
      ));
    expect(companionShape
      .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume.RA)
      .toBe(
        implicit.dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable,
      );
    // The previous counts described finite-difference observable probes.
    // Analytic observable and boundary paths replaced them; the resolved
    // finite-difference shadow below now verifies correctness.
    expect(implicit.diagnostics).toMatchObject({
      baseTrialReusedWithoutResolve: true,
      candidateTrialResolveCount: 0,
      directionCount: 2,
      exactZeroBoundaryDirectionCount: 0,
      baseResidualProbeEvaluationCount: 1,
      volumeJacobianProbeEvaluationCount: 0,
      boundaryResidualProbeEvaluationCount: 0,
      observableProbeEvaluationCount: 0,
      implicitLinearSolveCount: 2,
      hydraulicResidualEvaluationCount: 1,
    });
    expect(implicit.diagnostics.maximumAbsoluteReconstructedBaseResidualMl)
      .toBeLessThan(1e-9);
    expect(implicit.diagnostics
      .maximumAbsoluteLinearizedResidualMlPerScaledVariable)
      .toBeLessThan(1e-8);

    directions.forEach((direction, directionIndex) => {
      const shadow = finiteDifferenceResolvedDirectionalShadow(
        initialized.acceptedState,
        baseInput,
        direction,
      );
      for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
        expectStrictDirectionalAgreement(
          implicit.dCandidateVolumeMlByNodeDScaledVariable[directionIndex][nodeId],
          shadow.dVolumeMlByNode[nodeId],
          2e-6,
          2e-4,
        );
      }
      expectStrictDirectionalAgreement(
        implicit.dCandidateCoronaryBloodVolumeMlDScaledVariable[directionIndex],
        shadow.dTotalVolumeMl,
        3e-6,
        2e-4,
      );
      expectStrictDirectionalAgreement(
        implicit.dTotalInletFlowMlPerSecDScaledVariable[directionIndex],
        shadow.dTotalInletFlowMlPerSec,
        3e-5,
        3e-4,
      );
      expectStrictDirectionalAgreement(
        implicit
          .dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable[directionIndex],
        shadow.dCommonVenousOutletFlowMlPerSec,
        3e-5,
        3e-4,
      );
    });

    expect(() => computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
      previousAcceptedState: initialized.acceptedState,
      trialInput: baseInput,
      baseTrial,
      boundaryDirections: [{
        ...directions[0],
        scaledStep: 0,
      }],
    })).toThrow(/scaledStep must be positive/);
    expect(() => computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
      previousAcceptedState: initialized.acceptedState,
      trialInput: baseInput,
      baseTrial,
      boundaryDirections: [{
        scaledStep: 1,
        minusBoundary: {
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteAorticPressureMmHg: -1e8,
        },
        plusBoundary: {
          ...DIASTOLIC_BOUNDARY_V2,
          absoluteAorticPressureMmHg: 1e8,
        },
      }],
    })).toThrow(/positive domain/);
  });

  it("returns exact zero sensitivities without direction probes for exact base-boundary directions", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const baseInput = Object.freeze({
      dtSec: 0.005,
      boundary: DIASTOLIC_BOUNDARY_V2,
    }) satisfies CoronaryBackwardEulerTrialInputV2;
    const baseTrial = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      baseInput,
    );
    const numericallyIdenticalBoundary = Object.freeze({
      ...DIASTOLIC_BOUNDARY_V2,
      intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
        LAD: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
        LCx: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
        RCA: Object.freeze({ subepicardial: 5, subendocardial: 8 }),
      }),
    }) satisfies CoronaryHydraulicBoundaryInputV2;
    const implicit =
      computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
        previousAcceptedState: initialized.acceptedState,
        trialInput: baseInput,
        baseTrial,
        boundaryDirections: Object.freeze([
          Object.freeze({
            scaledStep: 2e-6,
            minusBoundary: DIASTOLIC_BOUNDARY_V2,
            plusBoundary: DIASTOLIC_BOUNDARY_V2,
          }),
          Object.freeze({
            scaledStep: 7e-4,
            minusBoundary: numericallyIdenticalBoundary,
            plusBoundary: numericallyIdenticalBoundary,
          }),
        ]),
      });

    expect(implicit.dCandidateVolumeMlByNodeDScaledVariable).toHaveLength(2);
    implicit.dCandidateVolumeMlByNodeDScaledVariable.forEach((direction) => {
      expect(Object.values(direction).every((value) => value === 0)).toBe(true);
    });
    expect(implicit.dCandidateCoronaryBloodVolumeMlDScaledVariable)
      .toEqual([0, 0]);
    expect(implicit.dTotalInletFlowMlPerSecDScaledVariable).toEqual([0, 0]);
    expect(implicit.dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable)
      .toEqual([0, 0]);
    expect(implicit.conservativeCompanionSensitivities
      .dCandidateCompanionBloodVolumeMlDScaledIndependentVolume)
      .toEqual([0, 0]);
    expect(implicit.conservativeCompanionSensitivities
      .dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume)
      .toEqual({ Ao: [0, 0], RA: [0, 0] });
    expect(implicit.diagnostics).toMatchObject({
      candidateTrialResolveCount: 0,
      directionCount: 2,
      exactZeroBoundaryDirectionCount: 2,
      baseResidualProbeEvaluationCount: 1,
      volumeJacobianProbeEvaluationCount: 0,
      boundaryResidualProbeEvaluationCount: 0,
      observableProbeEvaluationCount: 0,
      implicitLinearSolveCount: 0,
      hydraulicResidualEvaluationCount: 1,
      maximumAbsoluteLinearizedResidualMlPerScaledVariable: 0,
    });
    expect(implicit.diagnostics.maximumAbsoluteReconstructedBaseResidualMl)
      .toBeLessThan(1e-9);
  });

  it("keeps the implicit shadow accurate with collapse and focal stenosis active", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const topology = buildCoronaryTopologyV2();
    const collapsedPrevious = Object.freeze({
      ...initialized.acceptedState,
      volumeMlByNode: Object.freeze({
        ...initialized.acceptedState.volumeMlByNode,
        "LAD.IM.Art.subendocardial":
          0.75 * topology.nodes[
            topology.nodeIndexById["LAD.IM.Art.subendocardial"]
          ].coldSeedVolumeMl,
        "LAD.IM.Ven.subendocardial":
          0.80 * topology.nodes[
            topology.nodeIndexById["LAD.IM.Ven.subendocardial"]
          ].coldSeedVolumeMl,
      }),
    }) satisfies CoronaryAcceptedHydraulicStateV2;
    const compressedBoundary = Object.freeze({
      ...DIASTOLIC_BOUNDARY_V2,
      absoluteAorticPressureMmHg: 105,
      intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
        LAD: Object.freeze({ subepicardial: 90, subendocardial: 170 }),
        LCx: Object.freeze({ subepicardial: 75, subendocardial: 145 }),
        RCA: Object.freeze({ subepicardial: 25, subendocardial: 45 }),
      }),
    }) satisfies CoronaryHydraulicBoundaryInputV2;
    const collapse = buildCoronaryCollapseHydraulicsPriorV2(
      topology,
      0.05,
    );
    const baseInput = Object.freeze({
      dtSec: 0.001,
      boundary: compressedBoundary,
      disease: withFocalStenosis("LAD", 0.7),
      collapseHydraulics: collapse,
    }) satisfies CoronaryBackwardEulerTrialInputV2;
    const baseTrial = solveCoronaryBackwardEulerTrialV2(
      collapsedPrevious,
      baseInput,
    );
    const h = 5e-4;
    const direction = Object.freeze({
      scaledStep: h,
      minusBoundary: Object.freeze({
        ...compressedBoundary,
        absoluteAorticPressureMmHg: 104.995,
        intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
          ...compressedBoundary.intramyocardialPressureMmHgByTerritoryLayer,
          LAD: Object.freeze({ subepicardial: 89.985, subendocardial: 169.97 }),
        }),
      }),
      plusBoundary: Object.freeze({
        ...compressedBoundary,
        absoluteAorticPressureMmHg: 105.005,
        intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
          ...compressedBoundary.intramyocardialPressureMmHgByTerritoryLayer,
          LAD: Object.freeze({ subepicardial: 90.015, subendocardial: 170.03 }),
        }),
      }),
    }) satisfies CoronaryImplicitBoundaryDirectionV2;
    const implicit =
      computeCoronaryBackwardEulerImplicitDirectionalSensitivitiesV2({
        previousAcceptedState: collapsedPrevious,
        trialInput: baseInput,
        baseTrial,
        boundaryDirections: [direction],
      });
    const shadow = finiteDifferenceResolvedDirectionalShadow(
      collapsedPrevious,
      baseInput,
      direction,
    );
    for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
      expectStrictDirectionalAgreement(
        implicit.dCandidateVolumeMlByNodeDScaledVariable[0][nodeId],
        shadow.dVolumeMlByNode[nodeId],
        4e-6,
        4e-4,
      );
    }
    expectStrictDirectionalAgreement(
      implicit.dCandidateCoronaryBloodVolumeMlDScaledVariable[0],
      shadow.dTotalVolumeMl,
      5e-6,
      4e-4,
    );
    expectStrictDirectionalAgreement(
      implicit.dTotalInletFlowMlPerSecDScaledVariable[0],
      shadow.dTotalInletFlowMlPerSec,
      8e-5,
      5e-4,
    );
    expectStrictDirectionalAgreement(
      implicit.dCommonCoronaryVenousOutletFlowMlPerSecDScaledVariable[0],
      shadow.dCommonVenousOutletFlowMlPerSec,
      8e-5,
      5e-4,
    );
    expect(baseTrial.diagnostics.hydraulics
      .quadraticResistanceMmHgSec2PerMl2ByEdge["Ao_LAD.Art"])
      .toBeGreaterThan(0);
    expect(baseTrial.diagnostics.hydraulics
      .effectiveLinearResistanceMmHgSecPerMlByEdge[
        "LAD.Art_LAD.IM.Art.subendocardial"
      ])
      .toBeGreaterThan(
        topology.edges[
          topology.edgeIndexById[
            "LAD.Art_LAD.IM.Art.subendocardial"
          ]
        ].referenceResistanceMmHgSecPerMl,
      );
  });

  it("uses bounded collapse-only phi1, phi2, and geometric phi-m without distension gain", () => {
    const topology = buildCoronaryTopologyV2();
    const collapse = buildCoronaryCollapseHydraulicsPriorV2(topology);
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const c1Id = "LAD.IM.Art.subepicardial" as const;
    const c2Id = "LAD.IM.Ven.subepicardial" as const;
    const compressedVolumes = Object.freeze({
      ...initialized.acceptedState.volumeMlByNode,
      [c1Id]: 0.5 * collapse.hydraulicAreaReferenceVolumeMlByNode[c1Id],
      [c2Id]: 0.75 * collapse.hydraulicAreaReferenceVolumeMlByNode[c2Id],
    });
    const compressed = evaluateCoronaryHydraulicsV2(
      compressedVolumes,
      initialized.acceptedState.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
    );
    const area = (x: number): number => {
      const smooth = x * x * (3 - 2 * x);
      return 0.10 + 0.90 * smooth;
    };
    const phi1 = area(0.5) ** -2;
    const phi2 = area(0.75) ** -2;
    const r1Id = "LAD.Art_LAD.IM.Art.subepicardial" as const;
    const rmId = "LAD.IM.Art.subepicardial_LAD.IM.Ven.subepicardial" as const;
    const r2Id = "LAD.IM.Ven.subepicardial_CV" as const;
    expect(compressed.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id]
      / topology.edges[topology.edgeIndexById[r1Id]].referenceResistanceMmHgSecPerMl)
      .toBeCloseTo(phi1, 12);
    expect(compressed.effectiveLinearResistanceMmHgSecPerMlByEdge[rmId]
      / topology.edges[topology.edgeIndexById[rmId]].referenceResistanceMmHgSecPerMl)
      .toBeCloseTo(Math.sqrt(phi1 * phi2), 12);
    expect(compressed.effectiveLinearResistanceMmHgSecPerMlByEdge[r2Id]
      / topology.edges[topology.edgeIndexById[r2Id]].referenceResistanceMmHgSecPerMl)
      .toBeCloseTo(phi2, 12);

    const distendedVolumes = Object.freeze({
      ...initialized.acceptedState.volumeMlByNode,
      [c1Id]: 1.2 * collapse.hydraulicAreaReferenceVolumeMlByNode[c1Id],
      [c2Id]: 1.3 * collapse.hydraulicAreaReferenceVolumeMlByNode[c2Id],
    });
    const distended = evaluateCoronaryHydraulicsV2(
      distendedVolumes,
      initialized.acceptedState.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
    );
    for (const edgeId of [r1Id, rmId, r2Id]) {
      expect(distended.effectiveLinearResistanceMmHgSecPerMlByEdge[edgeId])
        .toBeCloseTo(
          topology.edges[topology.edgeIndexById[edgeId]]
            .referenceResistanceMmHgSecPerMl,
          12,
        );
    }
  });

  it("closes graph-incidence continuity exactly and keeps every signed edge passive", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const compressed: CoronaryHydraulicBoundaryInputV2 = Object.freeze({
      ...DIASTOLIC_BOUNDARY_V2,
      absoluteAorticPressureMmHg: 105,
      intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
        ...DIASTOLIC_BOUNDARY_V2.intramyocardialPressureMmHgByTerritoryLayer,
        LAD: Object.freeze({ subepicardial: 90, subendocardial: 175 }),
        LCx: Object.freeze({ subepicardial: 90, subendocardial: 175 }),
      }),
    });
    const trial = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      { dtSec: 0.001, boundary: compressed },
    );
    expect(trial.diagnostics.maximumAbsoluteNodeContinuityResidualMl)
      .toBeLessThan(1e-9);
    expect(Math.abs(trial.diagnostics.exactBloodVolumeLedgerResidualMl))
      .toBeLessThan(1e-10);
    expect(trial.diagnostics.hydraulics.layerR1FlowMlPerSecByTerritory
      .LAD.subendocardial).toBeLessThan(0);
    expect(trial.diagnostics.hydraulics.layerR2FlowMlPerSecByTerritory
      .LAD.subendocardial).toBeGreaterThan(0);

    const topology = buildCoronaryTopologyV2();
    const pressure = trial.diagnostics.hydraulics.absolutePressureMmHgByNode;
    const flow = trial.diagnostics.hydraulics.signedFlowMlPerSecByEdge;
    const power = trial.diagnostics.hydraulics
      .dissipatedPowerMmHgMlPerSecByEdge;
    for (const edge of topology.edges) {
      const pressureDrop = pressure[edge.upstreamNodeId]
        - pressure[edge.downstreamNodeId];
      expect(pressureDrop * flow[edge.edgeId]).toBeGreaterThanOrEqual(-1e-12);
      expect(power[edge.edgeId]).toBeGreaterThanOrEqual(-1e-12);
      expect(power[edge.edgeId]).toBeCloseTo(
        pressureDrop * flow[edge.edgeId],
        9,
      );
    }
  });

  it("disables only the collapse resistance multiplier for mechanism ablation", () => {
    const topology = buildCoronaryTopologyV2();
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const c1Id = "LAD.IM.Art.subendocardial" as const;
    const c2Id = "LAD.IM.Ven.subendocardial" as const;
    const compressedVolumes = Object.freeze({
      ...initialized.acceptedState.volumeMlByNode,
      [c1Id]: 0.55 * topology.nodes[topology.nodeIndexById[c1Id]].coldSeedVolumeMl,
      [c2Id]: 0.60 * topology.nodes[topology.nodeIndexById[c2Id]].coldSeedVolumeMl,
    });
    const enabledPrior = buildCoronaryCollapseHydraulicsPriorV2(topology);
    const disabledPrior = disableCoronaryCollapseHydraulicsV2(
      enabledPrior,
      topology,
    );
    const enabled = evaluateCoronaryHydraulicsV2(
      compressedVolumes,
      initialCoronaryToneStateV2(),
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      topology,
      enabledPrior,
    );
    const disabled = evaluateCoronaryHydraulicsV2(
      compressedVolumes,
      initialCoronaryToneStateV2(),
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      topology,
      disabledPrior,
    );
    for (const edgeId of [
      "LAD.Art_LAD.IM.Art.subendocardial",
      "LAD.IM.Art.subendocardial_LAD.IM.Ven.subendocardial",
      "LAD.IM.Ven.subendocardial_CV",
    ] as const) {
      const reference = topology.edges[topology.edgeIndexById[edgeId]]
        .referenceResistanceMmHgSecPerMl;
      expect(disabled.effectiveLinearResistanceMmHgSecPerMlByEdge[edgeId])
        .toBeCloseTo(reference, 12);
      expect(enabled.effectiveLinearResistanceMmHgSecPerMlByEdge[edgeId])
        .toBeGreaterThan(reference);
    }
  });

  it("rebases accepted tone into structural R1 without changing hydraulics", () => {
    const tone = Object.freeze({
      LAD: Object.freeze({ subepicardial: 0.67, subendocardial: 0.12 }),
      LCx: Object.freeze({ subepicardial: 0.72, subendocardial: 0.12 }),
      RCA: Object.freeze({ subepicardial: 0.77, subendocardial: 0.68 }),
    });
    const calibratedPrior = applyBeatingReferenceR1CalibrationV2(
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      {
        calibrationId: "beating-reference-r1-mean-qm-v1",
        proximalArteriolarScaleByTerritoryLayer: tone,
        boundaryFingerprint: "algebraic-rebase-unit-test",
        calibrationToneResistanceScale: 1,
        targetOwner: "mass-territory-layer-resting-flow-prior",
        objective: "accepted-cycle-mean-qm-only",
        waveformObjectiveUsed: false,
      },
    );
    const baseTopology = buildCoronaryTopologyV2();
    const calibratedTopology = buildCoronaryTopologyV2(calibratedPrior);
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const base = evaluateCoronaryHydraulicsV2(
      initialized.acceptedState.volumeMlByNode,
      tone,
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      baseTopology,
    );
    const rebased = evaluateCoronaryHydraulicsV2(
      initialized.acceptedState.volumeMlByNode,
      initialCoronaryToneStateV2(),
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      calibratedPrior,
      calibratedTopology,
    );
    for (const edgeId of CORONARY_EDGE_IDS_V2) {
      expect(rebased.signedFlowMlPerSecByEdge[edgeId])
        .toBeCloseTo(base.signedFlowMlPerSecByEdge[edgeId], 12);
      expect(rebased.effectiveLinearResistanceMmHgSecPerMlByEdge[edgeId])
        .toBeCloseTo(
          base.effectiveLinearResistanceMmHgSecPerMlByEdge[edgeId],
          12,
        );
      expect(rebased.dissipatedPowerMmHgMlPerSecByEdge[edgeId])
        .toBeCloseTo(base.dissipatedPowerMmHgMlPerSecByEdge[edgeId], 12);
    }
    for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
      expect(rebased.absolutePressureMmHgByNode[nodeId])
        .toBeCloseTo(base.absolutePressureMmHgByNode[nodeId], 12);
    }
  });

  it("is invariant to edge-array reordering because incidence owns edge identity", () => {
    const canonical = buildCoronaryTopologyV2();
    const reordered = reversedEdgeTopology();
    const edgeIndex = buildCoronaryEdgeIndexV2(reordered);
    for (const edgeId of CORONARY_EDGE_IDS_V2) {
      expect(reordered.edges[edgeIndex[edgeId]].edgeId).toBe(edgeId);
    }
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const canonicalHydraulics = evaluateCoronaryHydraulicsV2(
      initialized.acceptedState.volumeMlByNode,
      initialized.acceptedState.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      canonical,
    );
    const reorderedHydraulics = evaluateCoronaryHydraulicsV2(
      initialized.acceptedState.volumeMlByNode,
      initialized.acceptedState.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
      NORMAL_CORONARY_DISEASE_INPUT_V2,
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      reordered,
    );
    for (const edgeId of CORONARY_EDGE_IDS_V2) {
      expect(reorderedHydraulics.signedFlowMlPerSecByEdge[edgeId])
        .toBeCloseTo(canonicalHydraulics.signedFlowMlPerSecByEdge[edgeId], 12);
    }
    const perturbedBoundary = Object.freeze({
      ...DIASTOLIC_BOUNDARY_V2,
      absoluteAorticPressureMmHg: 96,
    });
    const canonicalTrial = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      { dtSec: 0.002, boundary: perturbedBoundary },
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      canonical,
    );
    const reorderedTrial = solveCoronaryBackwardEulerTrialV2(
      initialized.acceptedState,
      { dtSec: 0.002, boundary: perturbedBoundary },
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      reordered,
    );
    for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
      expect(reorderedTrial.candidateAcceptedState.volumeMlByNode[nodeId])
        .toBeCloseTo(
          canonicalTrial.candidateAcceptedState.volumeMlByNode[nodeId],
          12,
        );
    }
  });

  it("keeps focal stenosis, R1/Rm structural CMD, and vasodilatory floor as separate owners", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const state: CoronaryAcceptedHydraulicStateV2 = Object.freeze({
      ...initialized.acceptedState,
      toneResistanceScaleByTerritoryLayer: Object.freeze({
        LAD: Object.freeze({
          subepicardial: 4 / 45,
          subendocardial: 4 / 45,
        }),
        LCx: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
        RCA: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
      }),
    });
    const healthy = evaluateCoronaryHydraulicsV2(
      state.volumeMlByNode,
      state.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
    );
    const floorDisease = withLayerDisease("LAD", "subendocardial", {
      vasodilatoryToneMinimumResistanceScale: 0.6,
    });
    const floor = evaluateCoronaryHydraulicsV2(
      state.volumeMlByNode,
      state.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
      floorDisease,
    );
    const r1Id = "LAD.Art_LAD.IM.Art.subendocardial" as CoronaryEdgeIdV2;
    const rmId = (
      "LAD.IM.Art.subendocardial_LAD.IM.Ven.subendocardial"
    ) as CoronaryEdgeIdV2;
    expect(floor.effectiveToneResistanceScaleByTerritoryLayer.LAD.subendocardial)
      .toBe(0.6);
    expect(floor.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id])
      .toBeGreaterThan(healthy.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id]);
    expect(floor.effectiveLinearResistanceMmHgSecPerMlByEdge[rmId])
      .toBeCloseTo(healthy.effectiveLinearResistanceMmHgSecPerMlByEdge[rmId], 12);

    const structural = evaluateCoronaryHydraulicsV2(
      state.volumeMlByNode,
      state.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
      withLayerDisease("LAD", "subendocardial", {
        structuralR1ResistanceScale: 2,
        structuralRmResistanceScale: 3,
      }),
    );
    expect(structural.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id]
      / healthy.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id])
      .toBeCloseTo(2, 12);
    expect(structural.effectiveLinearResistanceMmHgSecPerMlByEdge[rmId]
      / healthy.effectiveLinearResistanceMmHgSecPerMlByEdge[rmId])
      .toBeCloseTo(3, 12);

    const focal = evaluateCoronaryHydraulicsV2(
      state.volumeMlByNode,
      state.toneResistanceScaleByTerritoryLayer,
      DIASTOLIC_BOUNDARY_V2,
      withFocalStenosis("LAD", 0.65),
    );
    expect(focal.quadraticResistanceMmHgSec2PerMl2ByEdge["Ao_LAD.Art"])
      .toBeGreaterThan(0);
    expect(focal.focalStenosisPressureLossMmHgByTerritory.LAD)
      .toBeGreaterThan(0);
    expect(focal.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id])
      .toBeCloseTo(healthy.effectiveLinearResistanceMmHgSecPerMlByEdge[r1Id], 12);
  });

  it("keeps trials pure and rejects stale transaction commits", () => {
    const initialized = initializePressureLadderCoronaryStateV2({
      boundary: DIASTOLIC_BOUNDARY_V2,
    });
    const transaction = new CoronaryBackwardEulerTransactionV2(
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      initialized.acceptedState,
    );
    const acceptedBefore = transaction.getAcceptedState();
    const input = { dtSec: 0.01, boundary: DIASTOLIC_BOUNDARY_V2 } as const;
    const first = transaction.beginTrial(input);
    const second = transaction.beginTrial(input);
    expect(second).toEqual(first);
    expect(transaction.getAcceptedState()).toBe(acceptedBefore);
    transaction.commit(first);
    expect(() => transaction.commit(second)).toThrow(/stale or foreign/);
    expect(transaction.getAcceptedState().revision).toBe(1);
    expect(Object.keys(transaction.getAcceptedState().volumeMlByNode))
      .toEqual([...CORONARY_CONSERVED_VOLUME_NODE_IDS_V2]);
    expect(Object.keys(
      transaction.getAcceptedState().toneResistanceScaleByTerritoryLayer,
    )).toEqual([...CORONARY_TERRITORY_IDS_V2]);
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      expect(Object.keys(
        transaction.getAcceptedState()
          .toneResistanceScaleByTerritoryLayer[territoryId],
      )).toEqual([...CORONARY_LAYER_IDS_V2]);
    }
    const ownedCollapse = buildCoronaryCollapseHydraulicsPriorV2(
      buildCoronaryTopologyV2(),
      0.2,
    );
    expect(() => transaction.beginTrial({
      ...input,
      collapseHydraulics: ownedCollapse,
    })).toThrow(/transaction owns collapse hydraulics/);

    const checkpoint = transaction.createCheckpoint();
    const changedPrior = scaleCoronaryLargeArterialComplianceV2(
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
      0.4,
    );
    const changedInitialization = initializePressureLadderCoronaryStateV2(
      { boundary: DIASTOLIC_BOUNDARY_V2 },
      changedPrior,
    );
    const incompatibleTransaction = new CoronaryBackwardEulerTransactionV2(
      changedPrior,
      changedInitialization.acceptedState,
    );
    expect(() => incompatibleTransaction.restoreCheckpoint(checkpoint))
      .toThrow(/parameter mismatch/);
  });
});
