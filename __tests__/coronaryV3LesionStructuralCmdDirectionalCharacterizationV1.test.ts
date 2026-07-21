import { describe, expect, it } from "vitest";

import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  buildCoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_V3_FOCAL_LESION_LEVELS_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_CLAIM_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_LITERATURE_ANCHORS_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1,
  CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1,
  CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1,
  CORONARY_V3_VASODILATORY_FLOOR_LEVELS_V1,
  compareCoronaryV3LesionStructuralCmdNumericsV1,
  createCoronaryV3LesionStructuralCmdDiseaseInputV1,
  createCoronaryV3LesionStructuralCmdToneStateV1,
  type CoronaryV3LesionStructuralCmdAtDtV1,
  type CoronaryV3LesionStructuralCmdAxisV1,
  type CoronaryV3LesionStructuralCmdConditionV1,
  type CoronaryV3LesionStructuralCmdLevelIdV1,
} from "@/engine/coronary/experiments/CoronaryV3LesionStructuralCmdDirectionalCharacterizationV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
} from "@/engine/coronary/topologyPriorV2";

describe("coronary V3 lesion/structural/floor directional characterization", () => {
  it("pre-registers three distinct one-factor owners and blocks clinical equivalence", () => {
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_POLICY_V1).toMatchObject({
      oneFactorSweepsOnly: true,
      fullFactorialApplied: false,
      coarseDtSec: 0.002,
      fineDtSec: 0.001,
      exactRawWindowCountPerCondition: 3,
      policyDeclaredBeforeCoarseAndFineOutput: true,
      outputUsedToChooseProtocolOrTolerance: false,
      parameterFittingApplied: false,
      biologicalTolerance: false,
      patientThresholdsApplied: false,
    });
    expect(CORONARY_V3_FOCAL_LESION_LEVELS_V1.map(
      ({ diameterStenosisFraction01 }) => diameterStenosisFraction01,
    )).toEqual([0, 0.5, 0.7]);
    expect(CORONARY_V3_STRUCTURAL_CMD_LEVELS_V1.map(
      ({ structuralR1ResistanceScale }) => structuralR1ResistanceScale,
    )).toEqual([1, 1.5, 2]);
    expect(CORONARY_V3_VASODILATORY_FLOOR_LEVELS_V1.map(
      ({ vasodilatoryToneMinimumResistanceScale }) =>
        vasodilatoryToneMinimumResistanceScale,
    )).toEqual([4 / 45, 8 / 45, 16 / 45]);
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_OWNER_CONTRACT_V1)
      .toMatchObject({
        threeOwnersAreDistinct: true,
        impairedVasodilatoryToneFloor: {
          clinicalFunctionalCmdEquivalent: false,
        },
      });
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_CLAIM_V1).toMatchObject({
      directionalChecksAreModelMechanismChecksOnly: true,
      clinicalFunctionalCmdClaimed: false,
      clinicalStructuralCmdClaimed: false,
      FFRClinicalEquivalenceClaimed: false,
      CFRClinicalEquivalenceClaimed: false,
      MRRClinicalEquivalenceClaimed: false,
      biologicalValidationEstablished: false,
      physiologicalAcceptanceEstablished: false,
    });
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1)
      .toHaveLength(6);
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_BLOCKED_GATES_V1.every(
      ({ status, value, fabricatedFallbackApplied }) =>
        status === "blocked" && value === null && !fabricatedFallbackApplied,
    )).toBe(true);
    expect(CORONARY_V3_LESION_STRUCTURAL_CMD_LITERATURE_ANCHORS_V1)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ doi: "10.1016/0021-9290(73)90099-7" }),
        expect.objectContaining({ doi: "10.1152/ajpheart.1994.266.6.H2359" }),
        expect.objectContaining({ doi: "10.1152/ajpheart.00663.2015" }),
        expect.objectContaining({ pmcid: "PMC7242900" }),
      ]));
  });

  it("passes fit-free directions, cross-dt checks, and owner separation", () => {
    const coarse = fixtureAtDt("coarse");
    const fine = fixtureAtDt("fine");
    const beforeCoarse = JSON.stringify(coarse);
    const beforeFine = JSON.stringify(fine);
    const comparison = compareCoronaryV3LesionStructuralCmdNumericsV1(
      coarse as CoronaryV3LesionStructuralCmdAtDtV1,
      fine as CoronaryV3LesionStructuralCmdAtDtV1,
    );

    expect(JSON.stringify(coarse)).toBe(beforeCoarse);
    expect(JSON.stringify(fine)).toBe(beforeFine);
    expect(Object.keys(comparison.crossDtBySampleId)).toHaveLength(15);
    expect(comparison.crossDtNumericalQaPassed).toBe(true);
    expect(comparison.lesionDistalPressure.passed).toBe(true);
    expect(comparison.lesionTerritoryFlow.passed).toBe(true);
    expect(comparison.structuralFixedToneTerritoryFlow.passed).toBe(true);
    expect(comparison.structuralFixedToneFlowReserve.passed).toBe(true);
    expect(comparison
      .impairedVasodilatoryFloorActiveHyperemicFlowReserve.passed).toBe(true);
    expect(comparison.ownerSeparation).toMatchObject({
      pathsArePairwiseDistinct: true,
      everyOneFactorSampleKeepsOtherAxesAtReference: true,
      passed: true,
    });
    expect(comparison.characterizationChecksPassed).toBe(true);
  });

  it("reports each directional violation without redefining its tolerance", () => {
    const lesionCoarse = fixtureAtDt("coarse");
    const lesionFine = fixtureAtDt("fine");
    for (const atDt of [lesionCoarse, lesionFine]) {
      setSummaryAndRaw(
        atDt,
        sampleId("focal-epicardial-lesion", "protocol-severe",
          "fixed-hyperemic-tone"),
        "meanDistalPressureMmHg",
        90,
      );
      setSummaryAndRaw(
        atDt,
        sampleId("focal-epicardial-lesion", "protocol-severe",
          "fixed-hyperemic-tone"),
        "meanTerritoryInletFlowMlPerSec",
        3.5,
      );
    }
    const lesion = compare(
      lesionCoarse,
      lesionFine,
    );
    expect(lesion.lesionDistalPressure.passed).toBe(false);
    expect(lesion.lesionTerritoryFlow.passed).toBe(false);

    const structuralCoarse = fixtureAtDt("coarse");
    const structuralFine = fixtureAtDt("fine");
    for (const atDt of [structuralCoarse, structuralFine]) {
      setSummaryAndRaw(
        atDt,
        sampleId("structural-microvascular-resistance", "protocol-severe",
          "fixed-hyperemic-tone"),
        "meanTerritoryInletFlowMlPerSec",
        4.5,
      );
    }
    const structural = compare(structuralCoarse, structuralFine);
    expect(structural.structuralFixedToneTerritoryFlow.passed).toBe(false);
    expect(structural.structuralFixedToneFlowReserve.passed).toBe(false);

    const floorCoarse = fixtureAtDt("coarse");
    const floorFine = fixtureAtDt("fine");
    for (const atDt of [floorCoarse, floorFine]) {
      setSummaryAndRaw(
        atDt,
        sampleId("impaired-vasodilatory-tone-floor", "protocol-severe",
          "active-hyperemic-floor-fixed-point"),
        "meanTerritoryInletFlowMlPerSec",
        4.5,
      );
    }
    const floor = compare(floorCoarse, floorFine);
    expect(floor.impairedVasodilatoryFloorActiveHyperemicFlowReserve.passed)
      .toBe(false);
  });

  it("fails closed on missing/nonfinite/owner-mismatched data and fails cross-dt drift", () => {
    const missing = fixtureAtDt("fine");
    missing.samples.pop();
    expect(() => compare(fixtureAtDt("coarse"), missing))
      .toThrow(/every declared one-factor sample/);

    const nonfinite = fixtureAtDt("fine");
    nonfinite.samples[0]!.rawAcceptedWindows[0]!
      .meanDistalPressureMmHg = Number.NaN;
    expect(() => compare(fixtureAtDt("coarse"), nonfinite))
      .toThrow(/nonfinite/);

    const ownerMismatch = fixtureAtDt("fine");
    const structuralSample = ownerMismatch.samples.find(({ axis }) =>
      axis === "structural-microvascular-resistance")!;
    const mismatchedDisease = structuredClone(structuralSample.diseaseInput);
    (mismatchedDisease.LAD.layers.subepicardial as unknown as {
      structuralR1ResistanceScale: number;
    }).structuralR1ResistanceScale = 9;
    structuralSample.diseaseInput = mismatchedDisease;
    expect(() => compare(fixtureAtDt("coarse"), ownerMismatch))
      .toThrow(/disease owner projection mismatch/);

    const drifted = fixtureAtDt("fine");
    setSummaryAndRaw(
      drifted,
      sampleId("focal-epicardial-lesion", "none", "fixed-hyperemic-tone"),
      "meanTerritoryInletFlowMlPerSec",
      4.2,
    );
    const comparison = compare(fixtureAtDt("coarse"), drifted);
    expect(comparison.crossDtNumericalQaPassed).toBe(false);
    expect(comparison.characterizationChecksPassed).toBe(false);
  });
});

function compare(coarse: ReturnType<typeof fixtureAtDt>, fine: ReturnType<typeof fixtureAtDt>) {
  return compareCoronaryV3LesionStructuralCmdNumericsV1(
    coarse as CoronaryV3LesionStructuralCmdAtDtV1,
    fine as CoronaryV3LesionStructuralCmdAtDtV1,
  );
}

function fixtureAtDt(role: "coarse" | "fine") {
  const dtSec = role === "coarse" ? 0.002 as const : 0.001 as const;
  const prior = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const collapse = buildCoronaryCollapseHydraulicsPriorV2(topology, 0.10);
  const descriptors = fixtureDescriptors();
  return {
    role,
    dtSec,
    modelBinding: {
      topologyId: prior.topologyId,
      topologyPriorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
      collapseHydraulicsFingerprint:
        coronaryConfigurationFingerprintV2(collapse),
      solverOptionsFingerprint: coronaryConfigurationFingerprintV2(
        DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
      ),
    },
    samples: descriptors.map((descriptor) => fixtureSample(
      role,
      dtSec,
      descriptor,
    )),
    allFiniteAndConserved: true as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  };
}

function fixtureSample(
  role: "coarse" | "fine",
  dtSec: 0.002 | 0.001,
  descriptor: ReturnType<typeof fixtureDescriptors>[number],
) {
  const diseaseInput = createCoronaryV3LesionStructuralCmdDiseaseInputV1(
    descriptor.axis,
    descriptor.levelId,
  );
  const initialTone = createCoronaryV3LesionStructuralCmdToneStateV1(
    descriptor.condition,
    diseaseInput,
  );
  const values = fixtureValues(descriptor.axis, descriptor.levelId,
    descriptor.condition);
  const active = descriptor.condition
    === "active-hyperemic-floor-fixed-point";
  const rawAcceptedWindows = Array.from({ length: 3 }, (_, windowIndex) => ({
    windowIndex,
    startTimeSec: windowIndex,
    endTimeSec: windowIndex + 1,
    acceptedStepCount: Math.round(1 / dtSec),
    minimumAcceptedStepDurationSec: dtSec,
    maximumAcceptedStepDurationSec: dtSec,
    meanDistalPressureMmHg: values.distalPressure,
    meanTerritoryInletFlowMlPerSec: values.flow,
    meanTerritoryLargeArterialOutflowMlPerSec: values.flow,
    meanFocalLesionPressureLossMmHg: values.focalLoss,
    meanTotalCoronaryInletFlowMlPerSec: values.flow + 4,
    meanCoronaryBloodVolumeMl: 10,
    startCoronaryBloodVolumeMl: 10,
    endCoronaryBloodVolumeMl: 10,
    signedBoundaryInletVolumeMl: 1,
    signedBoundaryOutletVolumeMl: 1,
    exactWindowBloodVolumeLedgerResidualMl: 0,
    sumOfStepLedgerResidualsMl: 0,
    maximumAbsoluteStepLedgerResidualMl: 0,
    maximumAbsoluteNodeContinuityResidualMl: 0,
    startToneResistanceScaleByTargetLayer: {
      ...initialTone.LAD,
    },
    endToneResistanceScaleByTargetLayer: {
      ...initialTone.LAD,
    },
    activeHyperemiaControlApplied: active,
    activeHyperemiaBoundedAtByTargetLayer: active
      ? { subepicardial: "minimum" as const, subendocardial: "minimum" as const }
      : null,
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
  }));
  return {
    sampleId: descriptor.sampleId,
    role,
    dtSec,
    axis: descriptor.axis,
    levelId: descriptor.levelId,
    condition: descriptor.condition,
    diseaseInput,
    initialToneResistanceScaleByTerritoryLayer: initialTone,
    diseaseFingerprint: coronaryConfigurationFingerprintV2(diseaseInput),
    initialToneFingerprint: coronaryConfigurationFingerprintV2(initialTone),
    initializerMaximumAbsoluteContinuityResidualMlPerSec: 0,
    rawAcceptedWindows,
    summary: {
      acceptedWindowCount: 3 as const,
      observationDurationSec: 3 as const,
      meanDistalPressureMmHg: values.distalPressure,
      meanTerritoryInletFlowMlPerSec: values.flow,
      meanTerritoryLargeArterialOutflowMlPerSec: values.flow,
      meanFocalLesionPressureLossMmHg: values.focalLoss,
      terminalEffectiveToneResistanceScaleByTargetLayer: {
        ...initialTone.LAD,
      },
    },
    allFinite: true as const,
    conservationToleranceSatisfied: true as const,
    biologicalValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
  };
}

function fixtureDescriptors() {
  const output: Array<{
    sampleId: string;
    axis: CoronaryV3LesionStructuralCmdAxisV1;
    levelId: CoronaryV3LesionStructuralCmdLevelIdV1;
    condition: CoronaryV3LesionStructuralCmdConditionV1;
  }> = [];
  for (const levelId of CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1) {
    output.push({
      sampleId: sampleId("focal-epicardial-lesion", levelId,
        "fixed-hyperemic-tone"),
      axis: "focal-epicardial-lesion",
      levelId,
      condition: "fixed-hyperemic-tone",
    });
    for (const condition of ["fixed-rest-tone", "fixed-hyperemic-tone"] as const) {
      output.push({
        sampleId: sampleId("structural-microvascular-resistance", levelId,
          condition),
        axis: "structural-microvascular-resistance",
        levelId,
        condition,
      });
    }
    for (const condition of [
      "fixed-rest-tone",
      "active-hyperemic-floor-fixed-point",
    ] as const) {
      output.push({
        sampleId: sampleId("impaired-vasodilatory-tone-floor", levelId,
          condition),
        axis: "impaired-vasodilatory-tone-floor",
        levelId,
        condition,
      });
    }
  }
  return output;
}

function fixtureValues(
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
  condition: CoronaryV3LesionStructuralCmdConditionV1,
) {
  const ordinal = CORONARY_V3_LESION_STRUCTURAL_CMD_LEVEL_IDS_V1
    .indexOf(levelId);
  if (axis === "focal-epicardial-lesion") {
    return {
      distalPressure: [95, 85, 70][ordinal]!,
      flow: [4, 3, 2][ordinal]!,
      focalLoss: [0, 15, 30][ordinal]!,
    };
  }
  if (axis === "structural-microvascular-resistance") {
    return {
      distalPressure: 95,
      flow: condition === "fixed-rest-tone"
        ? [1, 0.9, 0.8][ordinal]!
        : [4, 2.8, 1.8][ordinal]!,
      focalLoss: 0,
    };
  }
  return {
    distalPressure: 95,
    flow: condition === "fixed-rest-tone"
      ? 1
      : [4, 3, 2][ordinal]!,
    focalLoss: 0,
  };
}

function sampleId(
  axis: CoronaryV3LesionStructuralCmdAxisV1,
  levelId: CoronaryV3LesionStructuralCmdLevelIdV1,
  condition: CoronaryV3LesionStructuralCmdConditionV1,
): string {
  return `${axis}:${levelId}:${condition}`;
}

function setSummaryAndRaw(
  atDt: ReturnType<typeof fixtureAtDt>,
  id: string,
  key: "meanDistalPressureMmHg" | "meanTerritoryInletFlowMlPerSec",
  value: number,
): void {
  const sample = atDt.samples.find((candidate) => candidate.sampleId === id)!;
  sample.summary[key] = value;
  for (const raw of sample.rawAcceptedWindows) raw[key] = value;
}
