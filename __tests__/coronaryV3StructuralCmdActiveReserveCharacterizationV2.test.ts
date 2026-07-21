import { describe, expect, it } from "vitest";

import { createCoronaryAutoregulationWindowBindingV3 } from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2,
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_CLAIM_V2,
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2,
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_MEASUREMENT_CONTRACT_V2,
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2,
  CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V1_FAILURE_REFERENCE_V2,
  compareCoronaryV3StructuralCmdActiveReserveNumericsV2,
  type CoronaryV3StructuralCmdActiveReserveAtDtV2,
  type CoronaryV3StructuralCmdActiveReserveLevelIdV2,
} from "@/engine/coronary/experiments/CoronaryV3StructuralCmdActiveReserveCharacterizationV2";
import { createCoronaryV3LesionStructuralCmdDiseaseInputV1 } from "@/engine/coronary/experiments/CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";

describe("coronary V3 structural CMD active-rest reserve V2", () => {
  it("pre-registers active convergence/floor rules and preserves the V1 failure", () => {
    expect(CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2).toMatchObject({
      coarseDtSec: 0.002,
      fineDtSec: 0.001,
      acceptedWindowDurationSec: 1,
      maximumRestWindowCount: 250,
      maximumHyperemicWindowCount: 250,
      restMaximumAbsoluteLogToneChangePerWindow: 1e-5,
      restRequiredConsecutiveToneWindows: 3,
      restMaximumRelativeTargetFlowErrorByLadLayer: 0.01,
      maximumPhaseDurationInTimeConstants: 10,
      exactTerminalRawWindowCountPerPhase: 3,
      policyDeclaredBeforeCoarseAndFineOutput: true,
      outputUsedToChooseProtocolOrTolerance: false,
      parameterFittingApplied: false,
      biologicalTolerance: false,
      patientThresholdsApplied: false,
    });
    expect(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_POLICY_V2.hyperemicMaximumNormalizedLogToneDistanceToFloor,
    ).toBeCloseTo(Math.exp(-10), 11);
    expect(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_V1_FAILURE_REFERENCE_V2,
    ).toMatchObject({
      sourceGateId: "structural-R1-Rm-fixed-tone-reserve-does-not-improve",
      sourceGatePassed: false,
      sourceCoarseReserveValues: [
        1.5916808149406, 1.7425633893647314, 1.8503712479404402,
      ],
      v2DoesNotRepairReclassifyOrOverwriteV1: true,
    });
    expect(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_MEASUREMENT_CONTRACT_V2,
    ).toMatchObject({
      finiteTimeHyperemicFloorIsAsymptotic: true,
      numericalFloorSaturationIsExactBoundHit: false,
      FFRClinicalEquivalent: false,
      CFRClinicalEquivalent: false,
      MRRClinicalEquivalent: false,
    });
    expect(CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_CLAIM_V2).toMatchObject({
      priorFixedToneFailureRetainedAndReferenced: true,
      clinicalStructuralCmdClaimed: false,
      FFRClinicalEquivalenceClaimed: false,
      CFRClinicalEquivalenceClaimed: false,
      MRRClinicalEquivalenceClaimed: false,
      biologicalValidationEstablished: false,
      physiologicalAcceptanceEstablished: false,
    });
    expect(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2,
    ).toHaveLength(5);
    expect(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_BLOCKED_GATES_V2.every(
        ({ status, value, fabricatedFallbackApplied }) =>
          status === "blocked" && value === null && !fabricatedFallbackApplied,
      ),
    ).toBe(true);
  });

  it("compares active rest, floor hyperemia, reserve, handoff, and 2/1 ms data", () => {
    const coarse = fixtureAtDt("coarse");
    const fine = fixtureAtDt("fine");
    const beforeCoarse = JSON.stringify(coarse);
    const beforeFine = JSON.stringify(fine);
    const comparison = compare(coarse, fine);

    expect(JSON.stringify(coarse)).toBe(beforeCoarse);
    expect(JSON.stringify(fine)).toBe(beforeFine);
    expect(Object.keys(comparison.crossDtByLevel)).toEqual(
      CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2,
    );
    expect(comparison.restToneConvergenceChecksPassed).toBe(true);
    expect(comparison.restTargetFlowChecksPassed).toBe(true);
    expect(comparison.hyperemicFloorSaturationChecksPassed).toBe(true);
    expect(comparison.exactSameStateHandoffChecksPassed).toBe(true);
    expect(comparison.crossDtNumericalQaPassed).toBe(true);
    expect(comparison.structuralHyperemicFlowDoesNotImprove.passed).toBe(true);
    expect(comparison.structuralActiveReserveDoesNotImprove.passed).toBe(true);
    expect(comparison.characterizationChecksPassed).toBe(true);
  });

  it("reports a reserve/flow improvement and cross-dt drift without retuning", () => {
    const coarse = fixtureAtDt("coarse");
    const fine = fixtureAtDt("fine");
    for (const atDt of [coarse, fine]) {
      setHyperemicTerminalFlow(atDt, "protocol-severe", 2.5);
    }
    const direction = compare(coarse, fine);
    expect(direction.structuralHyperemicFlowDoesNotImprove.passed).toBe(false);
    expect(direction.structuralActiveReserveDoesNotImprove.passed).toBe(false);
    expect(direction.modelMechanismDirectionalChecksPassed).toBe(false);

    const drifted = fixtureAtDt("fine");
    setHyperemicTerminalFlow(drifted, "none", 4);
    const crossDt = compare(fixtureAtDt("coarse"), drifted);
    expect(crossDt.crossDtByLevel.none.passed).toBe(false);
    expect(crossDt.crossDtNumericalQaPassed).toBe(false);
    expect(crossDt.characterizationChecksPassed).toBe(false);
  });

  it("fails closed on missing/nonfinite/owner data and exposes a nonidentical handoff", () => {
    const missing = fixtureAtDt("fine");
    missing.samples.pop();
    expect(() => compare(fixtureAtDt("coarse"), missing)).toThrow(
      /every structural level/,
    );

    const nonfinite = fixtureAtDt("fine");
    nonfinite.samples[0]!.rest.terminalRawAcceptedWindows[0]!.meanLadInletFlowMlPerSec =
      Number.NaN;
    expect(() => compare(fixtureAtDt("coarse"), nonfinite)).toThrow(
      /nonfinite/,
    );

    const owner = fixtureAtDt("fine");
    const disease = structuredClone(owner.samples[1]!.diseaseInput);
    (
      disease.LAD.layers.subepicardial as unknown as {
        structuralRmResistanceScale: number;
      }
    ).structuralRmResistanceScale = 9;
    owner.samples[1]!.diseaseInput = disease;
    expect(() => compare(fixtureAtDt("coarse"), owner)).toThrow(
      /disease owner projection mismatch/,
    );

    const handoff = fixtureAtDt("fine");
    const sample = handoff.samples[0]!;
    sample.hyperemia.startingHydraulicStateFingerprint = "different-state";
    sample.restToHyperemiaHandoff.hyperemiaStartingHydraulicStateFingerprint =
      "different-state";
    sample.restToHyperemiaHandoff.exactSameTerminalStateUsed = false;
    handoff.allExactSameStateHandoffs = false;
    const comparison = compare(fixtureAtDt("coarse"), handoff);
    expect(comparison.exactSameStateHandoffChecksPassed).toBe(false);
    expect(comparison.characterizationChecksPassed).toBe(false);
  });
});

function compare(
  coarse: ReturnType<typeof fixtureAtDt>,
  fine: ReturnType<typeof fixtureAtDt>,
) {
  return compareCoronaryV3StructuralCmdActiveReserveNumericsV2(
    coarse as unknown as CoronaryV3StructuralCmdActiveReserveAtDtV2,
    fine as unknown as CoronaryV3StructuralCmdActiveReserveAtDtV2,
  );
}

function fixtureAtDt(role: "coarse" | "fine") {
  const dtSec = role === "coarse" ? (0.002 as const) : (0.001 as const);
  const samples = CORONARY_V3_STRUCTURAL_CMD_ACTIVE_RESERVE_LEVEL_IDS_V2.map(
    (levelId, levelIndex) => fixtureSample(role, dtSec, levelId, levelIndex),
  );
  return {
    role,
    dtSec,
    modelBinding: fixtureModelBinding(),
    samples,
    allFiniteAndConserved: true,
    allRestToneConvergenceAchieved: true,
    allRestTargetFlowsAchieved: true,
    allHyperemicFloorSaturationAchieved: true,
    allExactSameStateHandoffs: true,
    biologicalValidationEstablished: false,
    physiologicalAcceptanceEstablished: false,
  };
}

function fixtureSample(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2,
  levelIndex: number,
) {
  const scale = [1, 1.5, 2][levelIndex]!;
  const restFlow = 1.2;
  const hyperemicFlow = [2, 1.6, 1.3][levelIndex]!;
  const diseaseInput = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    "structural-microvascular-resistance",
    levelId,
  );
  const initialTone = layerRecord(1);
  const restTone = 0.8 - 0.1 * levelIndex;
  const hyperTone = 0.09;
  const restRaw = Array.from({ length: 3 }, (_, index) =>
    rawWindow({
      phase: "active-rest",
      phaseWindowIndex: index,
      globalWindowIndex: index,
      startTimeSec: index,
      dtSec,
      flow: restFlow,
      tone: restTone,
      maximumAbsoluteLogToneChange: 1e-6,
      relativeTargetError: 0.001,
      normalizedFloorDistance: null,
      boundedAt: "interior",
    }),
  );
  const hyperRaw = Array.from({ length: 3 }, (_, index) =>
    rawWindow({
      phase: "active-hyperemia",
      phaseWindowIndex: index,
      globalWindowIndex: 3 + index,
      startTimeSec: 3 + index,
      dtSec,
      flow: hyperemicFlow,
      tone: hyperTone,
      maximumAbsoluteLogToneChange: 1e-4,
      relativeTargetError: 0.4,
      normalizedFloorDistance: index === 2 ? 0 : 0.1 / (index + 1),
      boundedAt: "interior",
    }),
  );
  const stateFingerprint = `${role}:${levelId}:rest-terminal-state`;
  const autoregFingerprint = `${role}:${levelId}:rest-terminal-autoreg`;
  return {
    sampleId: `structural-R1-Rm:${levelId}:active-rest-to-hyperemia`,
    role,
    dtSec,
    levelId,
    structuralR1ResistanceScale: scale,
    structuralRmResistanceScale: scale,
    diseaseInput,
    diseaseFingerprint: coronaryConfigurationFingerprintV2(diseaseInput),
    initialToneResistanceScaleByTerritoryLayer: initialTone,
    initialToneFingerprint: coronaryConfigurationFingerprintV2(initialTone),
    initializerMaximumAbsoluteContinuityResidualMlPerSec: 1e-12,
    rest: {
      controlId: "fixture-rest",
      controlFingerprint: "fixture-rest-control",
      startingHydraulicStateFingerprint: `${role}:${levelId}:initial`,
      startingAutoregulationStateFingerprint: `${role}:${levelId}:initial-ar`,
      terminalHydraulicStateFingerprint: stateFingerprint,
      terminalAutoregulationStateFingerprint: autoregFingerprint,
      completedWindowCount: 3,
      maximumWindowCount: 250,
      stopReason: "tone-change-converged" as const,
      convergenceTrace: restRaw.map((raw, index) => ({
        phaseWindowIndex: index,
        globalWindowIndex: index,
        endTimeSec: raw.endTimeSec,
        maximumAbsoluteLogToneChange: 1e-6,
        toneThresholdSatisfied: true,
        consecutiveToneThresholdWindowCount: index + 1,
        maximumRelativeDemandFlowErrorByTargetLayer: 0.001,
        terminalWindowMeanLadInletFlowMlPerSec: restFlow,
      })),
      terminalConsecutiveToneThresholdWindowCount: 3,
      toneChangeConvergenceAchieved: true,
      targetFlowAchievedByTargetLayer: targetRecord(true),
      restTargetFlowAchieved: true,
      terminalWindowMeanLadInletFlowMlPerSec: restFlow,
      terminalToneResistanceScaleByTargetLayer: targetRecord(restTone),
      terminalRawAcceptedWindows: restRaw,
      allFiniteAndConserved: true,
    },
    restToHyperemiaHandoff: {
      restTerminalHydraulicStateFingerprint: stateFingerprint,
      hyperemiaStartingHydraulicStateFingerprint: stateFingerprint,
      restTerminalAutoregulationStateFingerprint: autoregFingerprint,
      hyperemiaStartingAutoregulationStateFingerprint: autoregFingerprint,
      exactSameTerminalStateUsed: true,
    },
    hyperemia: {
      controlId: "fixture-hyperemia",
      controlFingerprint: "fixture-hyperemia-control",
      startingHydraulicStateFingerprint: stateFingerprint,
      startingAutoregulationStateFingerprint: autoregFingerprint,
      terminalHydraulicStateFingerprint: `${role}:${levelId}:hyper-terminal`,
      terminalAutoregulationStateFingerprint: `${role}:${levelId}:hyper-terminal-ar`,
      completedWindowCount: 3,
      maximumWindowCount: 250,
      stopReason: "numerical-floor-saturated" as const,
      floorTrace: hyperRaw.map((raw, index) => ({
        phaseWindowIndex: index,
        globalWindowIndex: 3 + index,
        endTimeSec: raw.endTimeSec,
        maximumNormalizedLogToneDistanceToFloor:
          index === 2 ? 0 : 0.1 / (index + 1),
        numericalFloorCriterionSatisfied: index === 2,
        exactFloorBoundReachedByBothTargetLayers: false,
        terminalWindowMeanLadInletFlowMlPerSec: hyperemicFlow,
      })),
      initialLogToneDistanceToFloorByTargetLayer: targetRecord(2),
      terminalNormalizedLogToneDistanceToFloorByTargetLayer: targetRecord(0),
      numericalFloorSaturationAchieved: true,
      exactFloorBoundReachedByBothTargetLayers: false,
      terminalWindowMeanLadInletFlowMlPerSec: hyperemicFlow,
      terminalToneResistanceScaleByTargetLayer: targetRecord(hyperTone),
      terminalRawAcceptedWindows: hyperRaw,
      allFiniteAndConserved: true,
    },
    terminalFlowReserveRatio: hyperemicFlow / restFlow,
    allFiniteAndConserved: true,
    biologicalValidationEstablished: false,
    physiologicalAcceptanceEstablished: false,
  };
}

function rawWindow(
  input: Readonly<{
    phase: "active-rest" | "active-hyperemia";
    phaseWindowIndex: number;
    globalWindowIndex: number;
    startTimeSec: number;
    dtSec: 0.002 | 0.001;
    flow: number;
    tone: number;
    maximumAbsoluteLogToneChange: number;
    relativeTargetError: number;
    normalizedFloorDistance: number | null;
    boundedAt: "minimum" | "maximum" | "interior";
  }>,
) {
  const normalized =
    input.normalizedFloorDistance === null
      ? null
      : targetRecord(input.normalizedFloorDistance);
  return {
    phase: input.phase,
    phaseWindowIndex: input.phaseWindowIndex,
    globalWindowIndex: input.globalWindowIndex,
    startTimeSec: input.startTimeSec,
    endTimeSec: input.startTimeSec + 1,
    acceptedStepCount: Math.round(1 / input.dtSec),
    minimumAcceptedStepDurationSec: input.dtSec,
    maximumAcceptedStepDurationSec: input.dtSec,
    meanLadDistalPressureMmHg: 95,
    meanLadInletFlowMlPerSec: input.flow,
    meanLadLargeArterialOutflowMlPerSec: input.flow,
    meanTotalCoronaryInletFlowMlPerSec: 3 * input.flow,
    meanCoronaryBloodVolumeMl: 10,
    meanQmInternalFlowMlPerSecByTargetLayer: targetRecord(0.6),
    demandTargetFlowMlPerSecByTargetLayer: targetRecord(0.6),
    relativeDemandFlowErrorByTargetLayer: targetRecord(
      input.relativeTargetError,
    ),
    startToneResistanceScaleByTargetLayer: targetRecord(input.tone),
    endToneResistanceScaleByTargetLayer: targetRecord(input.tone),
    boundedAtByTargetLayer: targetRecord(input.boundedAt),
    maximumAbsoluteLogToneChange: input.maximumAbsoluteLogToneChange,
    normalizedLogToneDistanceToFloorByTargetLayer: normalized,
    startCoronaryBloodVolumeMl: 10,
    endCoronaryBloodVolumeMl: 10,
    signedBoundaryInletVolumeMl: 1,
    signedBoundaryOutletVolumeMl: 1,
    exactWindowBloodVolumeLedgerResidualMl: 0,
    sumOfStepLedgerResidualsMl: 0,
    maximumAbsoluteStepLedgerResidualMl: 1e-12,
    maximumAbsoluteNodeContinuityResidualMl: 1e-12,
    allFinite: true,
    conservationToleranceSatisfied: true,
  };
}

function setHyperemicTerminalFlow(
  atDt: ReturnType<typeof fixtureAtDt>,
  levelId: CoronaryV3StructuralCmdActiveReserveLevelIdV2,
  flow: number,
): void {
  const sample = atDt.samples.find(
    (candidate) => candidate.levelId === levelId,
  )!;
  sample.hyperemia.terminalWindowMeanLadInletFlowMlPerSec = flow;
  sample.hyperemia.terminalRawAcceptedWindows.at(-1)!.meanLadInletFlowMlPerSec =
    flow;
  sample.terminalFlowReserveRatio =
    flow / sample.rest.terminalWindowMeanLadInletFlowMlPerSec;
}

function fixtureModelBinding() {
  const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  return {
    topologyId: prior.topologyId,
    topologyPriorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    collapseHydraulicsFingerprint: coronaryConfigurationFingerprintV2(
      buildCoronaryCollapseHydraulicsPriorV2(topology, 0.1),
    ),
    solverOptionsFingerprint: coronaryConfigurationFingerprintV2(
      DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    ),
    autoregulationPriorFingerprint: createCoronaryAutoregulationWindowBindingV3(
      {
        originAcceptedTimeSec: 0,
        durationSec: 1,
        interpretation: "irregular-rhythm-stationary",
      },
    ).priorFingerprint,
  };
}

function layerRecord(value: number) {
  return Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
      ),
    ]),
  );
}

function targetRecord<T>(value: T) {
  return { subepicardial: value, subendocardial: value };
}
