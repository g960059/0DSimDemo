import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_CLAIM_V1,
  auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1,
  classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1";
import { MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1 } from "@/analysis/methods/mainWire/MainWireAorticValveLvotKineticCorrectionV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_PROFILES_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchRunV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 saturating pressure-recovery geometry sentinel V1", () => {
  it("declares an analysis-only closed 18-cell by 3-LVOT audit", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_ANALYSIS_CLAIM_V1,
    ).toMatchObject({
      closedExactCellCount: 18,
      reusedD3p0ExactExecutionCount: 6,
      newExactExecutionCount: 12,
      fixedLvotObservationCount: 54,
      characteristicImpedancePressureAudit:
        "independent-placement-profile-resistance-times-forward-flow-reconstruction",
      hydraulicPowerResidualAudit:
        "independent-raw-input-minus-source-linear-minus-irreversible-minus-AA-kinetic-minus-Zc-power-reconstruction",
      evaluatorPowerBalanceResidualUsedAsSoleIndependentEvidence: false,
      evaluatorPowerBalanceResidualComparedWithIndependentReconstruction: true,
      tripletInvariantScope: "enumerated-owner-hash-and-readback-fields-only",
      allNonAaInvariantBooleanUsesEnumeratedScopeOnly: true,
      completeCirculationRuntimeSnapshotMinusAaDiffClaimed: false,
      wholeBeatOutcomeMonotonicityIsHardGate: false,
      lvotCorrectedMeanHasSameDomainAsExistingMeanDopplerGradient: false,
      existingMeanAndPeakDopplerGradientsOverwritten: false,
      allThirtySixEnvelopeArmsAuditedAcrossGeometry: false,
      continuousGeometryEnvelopeEstablished: false,
      populationNormalRangeEstablished: false,
      exactFrameMutation: false,
      exactModelFeedback: false,
      clinicalValidationClaimed: false,
      canonicalAdoptionEstablished: false,
    });
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1,
    ).toHaveLength(18);
    expect(
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1,
    ).toHaveLength(3);
    const retainedD3p0 =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_PROFILES_V1.find(
        (profile) => profile.geometryId === "d3p0",
      );
    expect(retainedD3p0?.geometryProvenance).toBe(
      "retained-current-model-d3p0cm-reference-with-ASE-small-aorta-pressure-recovery-context",
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.d3p0IsRetainedCurrentModelReferenceWithAseSmallAortaPressureRecoveryContext,
    ).toBe(true);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.geometryAxisChangesOnlyFixedAscendingAorticPressureRecoveryStationArea,
    ).toBe(true);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.aorticCharacteristicImpedanceChangedByGeometryAxis,
    ).toBe(false);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.arterialComplianceChangedByGeometryAxis,
    ).toBe(false);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.vascularVolumeOrUnstressedVolumeChangedByGeometryAxis,
    ).toBe(false);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_SENTINEL_CLAIM_V1.wholeVesselGeometryChangeModeled,
    ).toBe(false);
  });

  it("independently reconstructs Zc and the five-term forward hydraulic power ledger", () => {
    const exact = Object.freeze({
      forwardFlowMlPerSec: 100,
      rawLvMinusAorticNodeGradientMmHg: 5.1,
      sourceLinearValvePressureMmHg: 0.1,
      irreversiblePressureMmHg: 1,
      ascendingAorticKineticPressureMmHg: 0.5,
      placementCharacteristicImpedanceResistanceMmHgSecPerMl: 0.035,
      evaluatorCharacteristicImpedancePressureMmHg: 3.5,
      evaluatorPowerBalanceResidualMmHgMlPerSec: 0,
    });
    const passed =
      auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
        exact,
      );
    expect(passed).toMatchObject({
      characteristicImpedancePressureReconstructionPassed: true,
      independentlyReconstructedHydraulicPowerResidualPassed: true,
      evaluatorPowerBalanceResidualPassed: true,
      evaluatorPowerResidualMatchedIndependentReconstruction: true,
      auditPassed: true,
    });
    expect(passed.reconstructedCharacteristicImpedancePressureMmHg).toBeCloseTo(
      3.5,
      14,
    );
    expect(
      Math.abs(passed.reconstructedHydraulicPowerResidualMmHgMlPerSec),
    ).toBeLessThan(1e-10);

    expect(
      auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
        {
          ...exact,
          evaluatorCharacteristicImpedancePressureMmHg: 3.500001,
        },
      ).auditPassed,
    ).toBe(false);
    expect(
      auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
        { ...exact, evaluatorPowerBalanceResidualMmHgMlPerSec: 1e-4 },
      ).auditPassed,
    ).toBe(false);
    expect(
      auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
        { ...exact, rawLvMinusAorticNodeGradientMmHg: 5.2 },
      ).independentlyReconstructedHydraulicPowerResidualPassed,
    ).toBe(false);
    expect(() =>
      auditMainWireAorticOutflowV10PressureRecoveryIndependentPowerReconstructionV1(
        { ...exact, forwardFlowMlPerSec: 0 },
      ),
    ).toThrow(/forward-domain inputs/);
  });

  it("orders audit dispositions so structural failures cannot be hidden by physiology", () => {
    const allPassed = Object.freeze({
      allCatalogAndIdentityAuditsPassed: true,
      allExecutionContractsPassed: true,
      allPressureRecoveryComponentLedgersPassed: true,
      allLvotAuditsPassed: true,
      limitedUnionContinuityEoaVariationPassed: true,
      allArmAntiStenosisGatesPassed: true,
    });
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1(
        allPassed,
      ),
    ).toBe("passed");
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1(
        {
          ...allPassed,
          allCatalogAndIdentityAuditsPassed: false,
          allArmAntiStenosisGatesPassed: false,
        },
      ),
    ).toBe("catalog-or-identity-failure");

    const orderedFailures = Object.freeze([
      ["allExecutionContractsPassed", "execution-contract-failure"],
      [
        "allPressureRecoveryComponentLedgersPassed",
        "pressure-recovery-ledger-failure",
      ],
      ["allLvotAuditsPassed", "lvot-audit-failure"],
      [
        "limitedUnionContinuityEoaVariationPassed",
        "continuity-eoa-variation-failure",
      ],
      ["allArmAntiStenosisGatesPassed", "physiology-gate-failure"],
    ] as const);
    for (const [key, expected] of orderedFailures) {
      expect(
        classifyMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAuditDispositionV1(
          { ...allPassed, [key]: false },
        ),
      ).toBe(expected);
    }
  });

  it("fails closed before derivation for missing or duplicate exact catalogs", () => {
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
        { reusedD3p0Runs: [], newGeometryRuns: [] },
      ),
    ).toThrow(/exactly six reused d3p0 runs and twelve new geometry runs/);

    const duplicateD3p0 = Object.freeze({
      fixedHorizonSentinelArm:
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1[0]!,
    }) as unknown as MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1;
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
        {
          reusedD3p0Runs: Array.from({ length: 6 }, () => duplicateD3p0),
          newGeometryRuns: Array.from(
            { length: 12 },
            () =>
              Object.freeze(
                {},
              ) as MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchRunV1,
          ),
        },
      ),
    ).toThrow(/duplicate reused d3p0 sentinel arm/);

    const uniqueD3p0Shells =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
        (fixedHorizonSentinelArm) =>
          Object.freeze({
            fixedHorizonSentinelArm,
          }) as unknown as MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchRunV1,
      );
    const duplicateNewGeometry = Object.freeze({
      pressureRecoveryGeometryCell:
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_CELLS_V1.find(
          (cell) => cell.newExactSimulationRequired,
        )!,
    }) as unknown as MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchRunV1;
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
        {
          reusedD3p0Runs: uniqueD3p0Shells,
          newGeometryRuns: Array.from(
            { length: 12 },
            () => duplicateNewGeometry,
          ),
        },
      ),
    ).toThrow(/duplicate new pressure-recovery geometry cell/);
  });

  it("reuses six d3p0 runs, executes twelve new endpoint cells, and passes the integrated audit", () => {
    const reusedD3p0Runs =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
        (sentinelArm) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1(
            sentinelArm.sentinelArmId,
          ),
      );
    const newGeometryRuns =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_PRESSURE_RECOVERY_GEOMETRY_NEW_EXACT_SIMULATION_CELL_IDS_V1.map(
        (cellId) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelResearchV1(
            cellId,
          ),
      );
    const analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingPressureRecoveryGeometrySentinelAnalysisV1(
        { reusedD3p0Runs, newGeometryRuns },
      );

    expect(analysis.cellsInClosedCatalogOrder).toHaveLength(18);
    expect(analysis.lvotSummariesInClosedCatalogOrder).toHaveLength(54);
    expect(analysis.geometryTripletsInFrozenSentinelOrder).toHaveLength(6);
    expect(analysis.auditedExactCellCount).toBe(18);
    expect(analysis.auditedCompactLvotObservationCount).toBe(54);
    expect(analysis.allCellExpectedIdentityAuditsPassed).toBe(true);
    expect(analysis.allProtocolIdentityHashesDistinctAcrossClosedCatalog).toBe(
      true,
    );
    expect(analysis.allExecutionContractsPassed).toBe(true);
    expect(analysis.allCellsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(analysis.allCellsHaveExactlyOneCompleteOnePercentFlowEpisode).toBe(
      true,
    );
    expect(analysis.allExactStationEquationsPassed).toBe(true);
    expect(analysis.allSimplifiedPeakGradientVmaxIdentitiesPassed).toBe(true);
    expect(analysis.allArmAntiStenosisGatesPassed).toBe(true);
    expect(analysis.allConfiguredAorticMaximumEoaValuesEqual3p5Cm2).toBe(true);
    expect(analysis.allForwardPressureRecoveryComponentLedgersPassed).toBe(
      true,
    );
    expect(
      analysis.allTripletNonAaInvariantAndIntendedAaVariationAuditsPassed,
    ).toBe(true);
    expect(analysis.allLvotSourceEpisodeAndAlgebraicAuditsPassed).toBe(true);
    expect(analysis.allLvotCorrectedGradientsIncreaseWithLvotArea).toBe(true);
    expect(analysis.limitedUnionContinuityEoaVariation.internalGatePassed).toBe(
      true,
    );
    expect(
      analysis.limitedUnionContinuityEoaVariation.coefficientOfVariation01,
    ).toBeLessThanOrEqual(0.05);
    expect(analysis.geometryStressAuditPassed).toBe(true);
    expect(analysis.auditStatus).toBe("passed");

    expect(
      analysis.cellsInClosedCatalogOrder.every(
        (cell) =>
          cell.cellAuditPassed &&
          cell.identityAudit.exactIdentityAuditPassed &&
          cell.executionAudit.period1AndIntegrationPassed &&
          cell.forwardPressureRecoveryComponentLedger.componentLedgerPassed &&
          cell.lvotSummaryIds.length === 3,
      ),
    ).toBe(true);
    expect(
      analysis.geometryTripletsInFrozenSentinelOrder.every(
        (triplet) =>
          triplet.tripletAuditPassed &&
          triplet.invariantAudit.invariantScope ===
            "enumerated-owner-hash-and-readback-fields-only" &&
          triplet.invariantAudit
            .allNonAaIdentitiesHashesAndReadbacksInvariantIsEnumeratedScopeOnly ===
            true &&
          triplet.invariantAudit
            .completeCirculationRuntimeSnapshotMinusAaDiffClaimed === false &&
          triplet.cellIdsInGeometryOrder.length === 3 &&
          triplet.endpointMinusD3p0MetricDeltas.length === 2,
      ),
    ).toBe(true);
    expect(
      analysis.cellsInClosedCatalogOrder.every((cell) => {
        const residual =
          cell.forwardPressureRecoveryComponentLedger.residualAudit;
        return (
          residual.allCharacteristicImpedancePressureReconstructionsPassed &&
          residual.allIndependentHydraulicPowerReconstructionsPassed &&
          residual.allEvaluatorPowerResidualReadbacksMatchedIndependentReconstructions &&
          Number.isFinite(
            residual.maximumAbsoluteCharacteristicImpedancePressureReconstructionResidualMmHg,
          ) &&
          Number.isFinite(
            residual.maximumAbsoluteIndependentlyReconstructedHydraulicPowerResidualMmHgMlPerSec,
          ) &&
          Number.isFinite(
            residual.maximumAbsoluteEvaluatorMinusReconstructedPowerResidualMmHgMlPerSec,
          )
        );
      }),
    ).toBe(true);
    expect(
      new Set(
        analysis.lvotSummariesInClosedCatalogOrder.map(
          (summary) => summary.summaryId,
        ),
      ).size,
    ).toBe(54);
    expect(
      analysis.lvotSummariesInClosedCatalogOrder.every(
        (summary) =>
          summary.pointArraysRetainedInOutput === false &&
          !("points" in summary) &&
          summary.correctedMeanIsResearchOnlyAndHasDifferentDomainFromExistingMpg,
      ),
    ).toBe(true);
    expect(
      new Set(
        analysis.cellsInClosedCatalogOrder.map(
          (cell) => cell.protocolIdentityHash,
        ),
      ).size,
    ).toBe(18);
  }, 1_800_000);
});
