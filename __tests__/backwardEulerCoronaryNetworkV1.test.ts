import { describe, expect, it } from "vitest";
import {
  CoronaryBackwardEulerTransactionV1,
  NORMAL_CORONARY_DISEASE_INPUT_V1,
  buildCoronaryEdgeIndexV1,
  createInitialCoronaryAcceptedHydraulicStateV1,
  solveCoronaryBackwardEulerTrialV1,
  type CoronaryBackwardEulerTrialV1,
  type CoronaryDiseaseInputV1,
  type CoronaryHydraulicBoundaryInputV1,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV1";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V1,
  CORONARY_EDGE_IDS_V1,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
  buildCoronaryTopologyV1,
} from "@/engine/coronary/topologyPriorV1";

const DIASTOLIC_BOUNDARY = Object.freeze({
  absoluteAorticPressureMmHg: 95,
  absoluteRightAtrialPressureMmHg: 5,
  perivascularExternalPressureMmHg: 2,
  intramyocardialPressureMmHgByTerritoryLayer: Object.freeze({
    LAD: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
    LCx: Object.freeze({ subepicardial: 6, subendocardial: 10 }),
    RCA: Object.freeze({ subepicardial: 5, subendocardial: 8 }),
  }),
}) satisfies CoronaryHydraulicBoundaryInputV1;

function withTerritoryDisease(
  territoryId: "LAD" | "LCx" | "RCA",
  values: Partial<CoronaryDiseaseInputV1["LAD"]>,
): CoronaryDiseaseInputV1 {
  return Object.freeze({
    ...NORMAL_CORONARY_DISEASE_INPUT_V1,
    [territoryId]: Object.freeze({
      ...NORMAL_CORONARY_DISEASE_INPUT_V1[territoryId],
      ...values,
    }),
  });
}

function runFor(
  durationSec: number,
  dtSec: number,
  boundary: CoronaryHydraulicBoundaryInputV1 = DIASTOLIC_BOUNDARY,
  disease: CoronaryDiseaseInputV1 = NORMAL_CORONARY_DISEASE_INPUT_V1,
  acceptedToneResistanceScale = 1,
): { transaction: CoronaryBackwardEulerTransactionV1; last: CoronaryBackwardEulerTrialV1 } {
  const initial = createInitialCoronaryAcceptedHydraulicStateV1(
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
    Object.freeze({
      LAD: acceptedToneResistanceScale,
      LCx: acceptedToneResistanceScale,
      RCA: acceptedToneResistanceScale,
    }),
  );
  const transaction = new CoronaryBackwardEulerTransactionV1(
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
    initial,
  );
  let last = transaction.beginTrial({ dtSec, boundary, disease });
  transaction.commit(last);
  const stepCount = Math.round(durationSec / dtSec);
  for (let step = 1; step < stepCount; step += 1) {
    last = transaction.beginTrial({ dtSec, boundary, disease });
    transaction.commit(last);
  }
  return { transaction, last };
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

describe("ten-volume coronary backward-Euler hydraulic network", () => {
  it("owns edge-array ordering through the topology incidence map", () => {
    const canonical = buildCoronaryTopologyV1();
    const reordered = Object.freeze({
      ...canonical,
      edges: Object.freeze([...canonical.edges].reverse()),
    });
    const edgeIndexById = buildCoronaryEdgeIndexV1(reordered);
    for (const edgeId of CORONARY_EDGE_IDS_V1) {
      expect(reordered.edges[edgeIndexById[edgeId]]?.edgeId).toBe(edgeId);
    }
  });

  it("converges from the cold seed to a physiological static-boundary flow with an exact ledger", () => {
    const { last } = runFor(40, 0.02);
    const diagnostics = last.diagnostics;
    const flowMlPerMin = diagnostics.hydraulics.totalInletFlowMlPerSec * 60;
    const targetFlowMlPerMin = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction.targetTotalRestingFlowMlPerMin;
    expect(flowMlPerMin).toBeGreaterThan(0.7 * targetFlowMlPerMin);
    // This is a broad hydraulic smoke envelope, not a fitted resting-flow gate;
    // slow accepted-state autoregulation is intentionally outside this trial.
    expect(flowMlPerMin).toBeLessThan(1.5 * targetFlowMlPerMin);
    expect(
      Math.abs(
        diagnostics.hydraulics.totalInletFlowMlPerSec
        - diagnostics.hydraulics.coronarySinusOutletFlowMlPerSec,
      ),
    ).toBeLessThan(0.03);
    expect(maximumAbsolute(Object.values(diagnostics.storageRateMlPerSecByNode)))
      .toBeLessThan(0.03);
    expect(diagnostics.maximumAbsoluteNodeContinuityResidualMl).toBeLessThan(1e-8);
    expect(Math.abs(diagnostics.exactBloodVolumeLedgerResidualMl)).toBeLessThan(1e-8);
    expect(Object.keys(last.candidateAcceptedState.volumeMlByNode))
      .toEqual([...CORONARY_CONSERVED_VOLUME_NODE_IDS_V1]);
  });

  it("turns LV systolic compression into reduced and reversible endocardial arteriolar flow", () => {
    const { transaction, last: diastolic } = runFor(4, 0.01);
    const compressedBoundary: CoronaryHydraulicBoundaryInputV1 = {
      ...DIASTOLIC_BOUNDARY,
      absoluteAorticPressureMmHg: 105,
      intramyocardialPressureMmHgByTerritoryLayer: {
        ...DIASTOLIC_BOUNDARY.intramyocardialPressureMmHgByTerritoryLayer,
        LAD: { subepicardial: 90, subendocardial: 175 },
        LCx: { subepicardial: 90, subendocardial: 175 },
      },
    };
    const systolic = transaction.beginTrial({
      dtSec: 0.001,
      boundary: compressedBoundary,
    });
    expect(
      systolic.diagnostics.hydraulics
        .layerArteriolarFlowMlPerSecByTerritory.LAD.subendocardial,
    ).toBeLessThan(0);
    expect(
      systolic.diagnostics.hydraulics
        .layerArteriolarFlowMlPerSecByTerritory.LAD.subendocardial,
    ).toBeLessThan(
      diastolic.diagnostics.hydraulics
        .layerArteriolarFlowMlPerSecByTerritory.LAD.subendocardial,
    );
    expect(
      systolic.diagnostics.hydraulics
        .layerVenularFlowMlPerSecByTerritory.LAD.subendocardial,
    ).toBeGreaterThan(
      diastolic.diagnostics.hydraulics
        .layerVenularFlowMlPerSecByTerritory.LAD.subendocardial,
    );
  });

  it("makes focal diameter stenosis monotonically reduce territory flow and distal pressure", () => {
    const healthy = runFor(6, 0.02).last.diagnostics.hydraulics;
    const moderate = runFor(
      6,
      0.02,
      DIASTOLIC_BOUNDARY,
      withTerritoryDisease("LAD", { diameterStenosisFraction01: 0.5 }),
    ).last.diagnostics.hydraulics;
    const severe = runFor(
      6,
      0.02,
      DIASTOLIC_BOUNDARY,
      withTerritoryDisease("LAD", { diameterStenosisFraction01: 0.7 }),
    ).last.diagnostics.hydraulics;
    expect(healthy.inletFlowMlPerSecByTerritory.LAD)
      .toBeGreaterThan(moderate.inletFlowMlPerSecByTerritory.LAD);
    expect(moderate.inletFlowMlPerSecByTerritory.LAD)
      .toBeGreaterThan(severe.inletFlowMlPerSecByTerritory.LAD);
    expect(healthy.absolutePressureMmHgByNode["LAD.Art"])
      .toBeGreaterThan(moderate.absolutePressureMmHgByNode["LAD.Art"]);
    expect(moderate.absolutePressureMmHgByNode["LAD.Art"])
      .toBeGreaterThan(severe.absolutePressureMmHgByNode["LAD.Art"]);
  });

  it("separates CMD from epicardial stenosis by their opposite distal-pressure direction", () => {
    const healthy = runFor(6, 0.02).last.diagnostics.hydraulics;
    const cmd = runFor(
      6,
      0.02,
      DIASTOLIC_BOUNDARY,
      withTerritoryDisease("LAD", {
        microvascularStructuralResistanceScale: 2.5,
      }),
    ).last.diagnostics.hydraulics;
    const stenosis = runFor(
      6,
      0.02,
      DIASTOLIC_BOUNDARY,
      withTerritoryDisease("LAD", { diameterStenosisFraction01: 0.65 }),
    ).last.diagnostics.hydraulics;
    expect(cmd.inletFlowMlPerSecByTerritory.LAD)
      .toBeLessThan(healthy.inletFlowMlPerSecByTerritory.LAD);
    expect(cmd.absolutePressureMmHgByNode["LAD.Art"])
      .toBeGreaterThan(healthy.absolutePressureMmHgByNode["LAD.Art"]);
    expect(stenosis.inletFlowMlPerSecByTerritory.LAD)
      .toBeLessThan(healthy.inletFlowMlPerSecByTerritory.LAD);
    expect(stenosis.absolutePressureMmHgByNode["LAD.Art"])
      .toBeLessThan(healthy.absolutePressureMmHgByNode["LAD.Art"]);
    expect(cmd.postLesionAbsolutePressureMmHgByTerritory.LAD)
      .toBeCloseTo(DIASTOLIC_BOUNDARY.absoluteAorticPressureMmHg, 10);
    expect(stenosis.postLesionAbsolutePressureMmHgByTerritory.LAD)
      .toBeLessThan(healthy.postLesionAbsolutePressureMmHgByTerritory.LAD);
  });

  it("keeps healthy post-lesion Pd/Pa at one and gives a physiological maximal-dilation reserve", () => {
    const restRun = runFor(40, 0.02);
    const rest = restRun.last.diagnostics.hydraulics;
    const minimumTone = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .territories.LAD.autoregulation.minimumResistanceScale;
    const hyperemiaRun = runFor(
      40,
      0.02,
      DIASTOLIC_BOUNDARY,
      NORMAL_CORONARY_DISEASE_INPUT_V1,
      minimumTone,
    );
    const hyperemia = hyperemiaRun.last.diagnostics.hydraulics;
    const reserve = hyperemia.totalInletFlowMlPerSec
      / rest.totalInletFlowMlPerSec;
    const myocardialMassG = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction.referenceVentricularMyocardialMassG;
    const restMbfMlPerMinPerG =
      rest.totalInletFlowMlPerSec * 60 / myocardialMassG;
    const stressMbfMlPerMinPerG =
      hyperemia.totalInletFlowMlPerSec * 60 / myocardialMassG;
    expect(rest.postLesionAbsolutePressureMmHgByTerritory.LAD)
      .toBeCloseTo(DIASTOLIC_BOUNDARY.absoluteAorticPressureMmHg, 10);
    expect(hyperemia.postLesionAbsolutePressureMmHgByTerritory.LAD)
      .toBeCloseTo(DIASTOLIC_BOUNDARY.absoluteAorticPressureMmHg, 10);
    expect(hyperemia.distributedArterialResistanceScaleByTerritory.LAD)
      .toBeCloseTo(6 / 17, 10);
    expect(reserve).toBeGreaterThan(2.5);
    expect(reserve).toBeLessThan(5);
    expect(restMbfMlPerMinPerG).toBeGreaterThan(0.7);
    expect(restMbfMlPerMinPerG).toBeLessThan(1.4);
    expect(stressMbfMlPerMinPerG).toBeGreaterThan(2);
    expect(stressMbfMlPerMinPerG).toBeLessThan(6);
    const intramyocardialVolumeMl = (
      run: ReturnType<typeof runFor>,
    ) => Object.entries(run.transaction.getAcceptedState().volumeMlByNode)
      .filter(([nodeId]) => nodeId.includes(".IM."))
      .reduce((sum, [, volume]) => sum + volume, 0);
    const totalCoronaryVolumeMl = (run: ReturnType<typeof runFor>) =>
      Object.values(run.transaction.getAcceptedState().volumeMlByNode)
        .reduce((sum, volume) => sum + volume, 0);
    expect(intramyocardialVolumeMl(hyperemiaRun)
      / intramyocardialVolumeMl(restRun)).toBeLessThan(1.5);
    expect(totalCoronaryVolumeMl(hyperemiaRun)
      / totalCoronaryVolumeMl(restRun)).toBeLessThan(1.2);
  });

  it("keeps trial, rollback, commit, and checkpoint state ownership explicit", () => {
    const transaction = new CoronaryBackwardEulerTransactionV1();
    const initial = transaction.getAcceptedState();
    const first = transaction.beginTrial({ dtSec: 0.01, boundary: DIASTOLIC_BOUNDARY });
    const repeated = transaction.beginTrial({ dtSec: 0.01, boundary: DIASTOLIC_BOUNDARY });
    expect(repeated.candidateAcceptedState).toEqual(first.candidateAcceptedState);
    expect(transaction.rollback(first)).toBe(initial);
    expect(transaction.getAcceptedState()).toBe(initial);
    expect(() => transaction.commit(first)).toThrow(/stale|foreign/);

    const accepted = transaction.commit(repeated);
    expect(accepted.revision).toBe(1);
    const checkpoint = transaction.createCheckpoint();
    const later = transaction.beginTrial({ dtSec: 0.01, boundary: DIASTOLIC_BOUNDARY });
    transaction.commit(later);
    expect(transaction.getAcceptedState().revision).toBe(2);
    expect(transaction.restoreCheckpoint(checkpoint)).toEqual(accepted);
    expect(transaction.getAcceptedState().revision).toBe(1);
  });

  it("shows first-order backward-Euler dt refinement without continuity drift", () => {
    const coarse = runFor(0.5, 0.01).last;
    const fine = runFor(0.5, 0.005).last;
    for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V1) {
      expect(
        Math.abs(
          coarse.candidateAcceptedState.volumeMlByNode[nodeId]
          - fine.candidateAcceptedState.volumeMlByNode[nodeId],
        ),
      ).toBeLessThan(0.04);
    }
    expect(Math.abs(coarse.diagnostics.exactBloodVolumeLedgerResidualMl))
      .toBeLessThan(1e-10);
    expect(Math.abs(fine.diagnostics.exactBloodVolumeLedgerResidualMl))
      .toBeLessThan(1e-10);
  });

  it("fails closed on invalid boundaries, diseases, and non-positive volumes", () => {
    const initial = createInitialCoronaryAcceptedHydraulicStateV1();
    expect(() => solveCoronaryBackwardEulerTrialV1(initial, {
      dtSec: 0,
      boundary: DIASTOLIC_BOUNDARY,
    })).toThrow(/dt/);
    expect(() => solveCoronaryBackwardEulerTrialV1(initial, {
      dtSec: 0.01,
      boundary: DIASTOLIC_BOUNDARY,
      disease: withTerritoryDisease("LAD", { diameterStenosisFraction01: 1 }),
    })).toThrow(/stenosis/);
    expect(() => solveCoronaryBackwardEulerTrialV1({
      ...initial,
      volumeMlByNode: { ...initial.volumeMlByNode, CS: 0 },
    }, {
      dtSec: 0.01,
      boundary: DIASTOLIC_BOUNDARY,
    })).toThrow(/positive physical domain/);
  });
});
