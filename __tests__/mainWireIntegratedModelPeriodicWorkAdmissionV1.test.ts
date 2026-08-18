import { describe, expect, it } from "vitest";

import {
  qualifyMainWireIntegratedModelPeriodicExternalWorkV1,
  type MainWireIntegratedModelPeriodicExternalWorkInputV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicExternalWorkV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1,
  assessMainWireIntegratedModelPeriodicPressureBasisArmsV1,
  compareMainWireIntegratedModelPeriodicWorkRefinementV1,
  decideMainWireIntegratedModelPeriodicWorkAdmissionV1,
  qualifyMainWireIntegratedModelPeriodicPressureBasisWorkV1,
  type MainWireIntegratedModelPeriodicPressureBasisArmRunV1,
  type MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1,
  type MainWireIntegratedModelPeriodicPressureBasisWorkV1,
  type MainWireIntegratedModelPeriodicWorkRefinementRunV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicWorkAdmissionV1";
import type {
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

type Point = Readonly<{
  volumeMl: number;
  transmuralPressureMmHg: number;
  externalPressureMmHg: number;
}>;

describe("periodic pressure-basis and work-admission V1", () => {
  it("freezes the unseen 0.5 ms, one-percent, and near-zero policy", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_ADMISSION_POLICY_V1)
      .toMatchObject({
        declarationStatus: "declared-before-new-0.5ms-output",
        coarseDtSec: 0.001,
        fineDtSec: 0.0005,
        maximumScaledDifference: 0.01,
        nearZeroAbsoluteWorkScaleMmHgMl: 1,
        impliedMaximumNearZeroAbsoluteDifferenceMmHgMl: 0.01,
        newFineOutputAvailableWhenDeclared: false,
        newFineOutputUsedToChooseTolerance: false,
        interpolationApplied: false,
        resamplingApplied: false,
        pressureBasis: {
          conventionalPvLoopExternalWork: "cavity-absolute-pressure",
          wallDistendingBoundaryWork: "ventricular-transmural-pressure",
          externalConstraintExchange: "absolute-minus-transmural-pressure",
          conventionalPvaDiagramCoordinate: "cavity-absolute-pressure",
          myocardialLoadingCoordinate: "ventricular-transmural-pressure",
          futurePvaPrimaryBasis: "not-established-by-this-policy",
          pvaEstablishedByThisPolicy: false,
        },
        pressureBasisArms: {
          "normal-default": {
            role: "required",
            peepCmH2O: 0,
            prescribedPericardialFluidVolumeMl: 0,
          },
          "peep-10-cmh2o": {
            role: "required",
            peepCmH2O: 10,
            prescribedPericardialFluidVolumeMl: 0,
          },
          "pericardial-effusion-200ml": {
            role: "characterization-only",
            peepCmH2O: 0,
            prescribedPericardialFluidVolumeMl: 200,
          },
        },
      });
  });

  it("makes a constant external-pressure offset contribute zero work on a closed loop", () => {
    const result = pressureResult([
      point(0, 0, 50),
      point(1, 0, 50),
      point(1, 1, 50),
      point(0, 1, 50),
      point(0, 0, 50),
    ]);

    expect(result.status).toBe("qualified-biventricular");
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: {
        "cavity-absolute-pressure": 1,
        "ventricular-transmural-pressure": 1,
        "external-constraint-pressure": 0,
      },
      decompositionResidualMmHgMl: 0,
      decompositionPassed: true,
      conventionalPvLoopExternalWorkMmHgMl: 1,
      conventionalPvLoopExternalWorkEstablished: true,
      pvaEstablished: false,
      failureReasons: [],
    });
  });

  it("retains variable external-constraint exchange and closes the work identity", () => {
    const result = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 1),
      point(0, 0, 0),
    ]);

    expect(result.leftVentricle.pathWorkMmHgMl).toEqual({
      "cavity-absolute-pressure": 1.5,
      "ventricular-transmural-pressure": 1,
      "external-constraint-pressure": 0.5,
    });
    expect(result.leftVentricle.decompositionResidualMmHgMl).toBe(0);
    expect(result.leftVentricle.conventionalPvLoopExternalWorkMmHgMl)
      .toBe(1.5);
  });

  it("withholds cavity-pressure EW when only the transmural path closes", () => {
    const result = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 0),
      point(0, 0, 1),
    ]);

    expect(result.status).toBe("not-qualified");
    expect(result.leftVentricle).toMatchObject({
      pathWorkMmHgMl: {
        "ventricular-transmural-pressure": 1,
      },
      cavityPressureVolumeClosure: { withinTolerance: false },
      transmuralPressureVolumeClosure: { withinTolerance: true },
      conventionalPvLoopExternalWorkMmHgMl: null,
      conventionalPvLoopExternalWorkEstablished: false,
      failureReasons: ["cavity-pressure-volume-boundary-not-closed"],
    });
  });

  it("admits both pressure bases only when the frozen 1 ms / 0.5 ms metrics pass", () => {
    const base = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 0),
      point(0, 0, 0),
    ]);
    const coarse = refinementRun(
      0.001,
      scaledPressureResult(base, 10_050, 10_040),
      "a".repeat(64),
    );
    const fine = refinementRun(
      0.0005,
      scaledPressureResult(base, 10_000, 10_000),
      "b".repeat(64),
    );
    const comparison = compareMainWireIntegratedModelPeriodicWorkRefinementV1(
      coarse,
      fine,
    );

    expect(comparison.gates).toEqual({
      dtPairMatches: true,
      refinementAccessMatches: true,
      conditionIdentityMatches: true,
      protocolIdentitiesAreDistinct: true,
      bothCanonicalPeriod1: true,
      bothExactCheckpointRoundTrips: true,
      bothPressureBasisQualificationsPassed: true,
    });
    expect(comparison.metrics).toHaveLength(4);
    expect(comparison.metrics.every((metric) => metric.passed)).toBe(true);
    expect(comparison).toMatchObject({
      numericalAdmissionPassed: true,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
  });

  it("requires both declared real pressure arms before admitting an official Experiment output", () => {
    const result = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 0),
      point(0, 0, 0),
    ]);
    const coarse = refinementRun(
      0.001,
      scaledPressureResult(result, 10_050, 10_040),
      "a".repeat(64),
    );
    const fine = refinementRun(
      0.0005,
      scaledPressureResult(result, 10_000, 10_000),
      "b".repeat(64),
    );
    const numerical = compareMainWireIntegratedModelPeriodicWorkRefinementV1(
      coarse,
      fine,
    );
    const pressureBasis =
      assessMainWireIntegratedModelPeriodicPressureBasisArmsV1([
        pressureArmRun(
          "normal-default",
          0,
          0,
          result,
          "c".repeat(64),
          "d".repeat(64),
        ),
        pressureArmRun(
          "peep-10-cmh2o",
          10,
          0,
          result,
          "e".repeat(64),
          "f".repeat(64),
        ),
      ]);
    const decision = decideMainWireIntegratedModelPeriodicWorkAdmissionV1(
      numerical,
      pressureBasis,
    );

    expect(pressureBasis).toMatchObject({
      requiredConditionIdentitiesDistinct: true,
      requiredProtocolIdentitiesDistinct: true,
      requiredArmsPassed: true,
      pressureBasisAdmissionPassed: true,
      characterizationOnlyArmsGateAdmission: false,
    });
    expect(pressureBasis.arms.find((arm) =>
      arm.armId === "pericardial-effusion-200ml"
    )).toMatchObject({
      role: "characterization-only",
      runPresentExactlyOnce: false,
      passed: false,
    });
    expect(decision).toEqual({
      decisionId:
        "main-wire-integrated-model-periodic-work-admission-decision-v1",
      numericalRefinementAdmissionPassed: true,
      pressureBasisAdmissionPassed: true,
      officialExperimentOutputAdmissionEligible: true,
      publicLiveOutputCatalogAdmissionEstablished: false,
      pvaAdmissionEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
  });

  it("withholds admission when a required pressure arm is missing or misdeclared", () => {
    const result = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 0),
      point(0, 0, 0),
    ]);
    const missing =
      assessMainWireIntegratedModelPeriodicPressureBasisArmsV1([
        pressureArmRun(
          "normal-default",
          0,
          0,
          result,
          "c".repeat(64),
          "d".repeat(64),
        ),
      ]);
    const misdeclared =
      assessMainWireIntegratedModelPeriodicPressureBasisArmsV1([
        pressureArmRun(
          "normal-default",
          0,
          0,
          result,
          "c".repeat(64),
          "d".repeat(64),
        ),
        pressureArmRun(
          "peep-10-cmh2o",
          9,
          0,
          result,
          "e".repeat(64),
          "f".repeat(64),
        ),
      ]);

    expect(missing.pressureBasisAdmissionPassed).toBe(false);
    expect(misdeclared.pressureBasisAdmissionPassed).toBe(false);
    expect(misdeclared.arms.find((arm) =>
      arm.armId === "peep-10-cmh2o"
    )).toMatchObject({ declaredInputsMatch: false, passed: false });
  });

  it("fails closed for near-zero drift or a mismatched model condition", () => {
    const base = pressureResult([
      point(0, 0, 0),
      point(1, 0, 0),
      point(1, 1, 0),
      point(0, 1, 0),
      point(0, 0, 0),
    ]);
    const coarse = refinementRun(
      0.001,
      scaledPressureResult(base, 0.52, 0.52),
      "a".repeat(64),
    );
    const fine = {
      ...refinementRun(
        0.0005,
        scaledPressureResult(base, 0.5, 0.5),
        "b".repeat(64),
      ),
      modelConditionIdentityHash: "d".repeat(64),
    };
    const comparison = compareMainWireIntegratedModelPeriodicWorkRefinementV1(
      coarse,
      fine,
    );

    expect(comparison.gates.conditionIdentityMatches).toBe(false);
    for (const metric of comparison.metrics) {
      expect(metric.fineIsNearZero).toBe(true);
      expect(metric.scaledDifference).toBeCloseTo(0.02, 12);
      expect(metric.passed).toBe(false);
    }
    expect(comparison.numericalAdmissionPassed).toBe(false);
  });
});

function pressureResult(
  points: readonly Point[],
): MainWireIntegratedModelPeriodicPressureBasisWorkV1 {
  const input = workInput(points);
  const source = qualifyMainWireIntegratedModelPeriodicExternalWorkV1(input);
  return qualifyMainWireIntegratedModelPeriodicPressureBasisWorkV1(
    input,
    source,
  );
}

function workInput(
  points: readonly Point[],
): MainWireIntegratedModelPeriodicExternalWorkInputV1 {
  if (points.length < 2) throw new Error("test path requires two points");
  const cycleIndex = 8;
  const startTimeSec = 10;
  const durationSec = 1;
  const dtSec = durationSec / (points.length - 1);
  const [start, ...accepted] = points;
  const samples = accepted.map((value, index) =>
    sample(cycleIndex, index + 1, startTimeSec, dtSec, value)
  );
  return {
    executionPurpose: "canonical-evidence",
    protocolIdentityHash: "a".repeat(64),
    modelConditionIdentityHash: "c".repeat(64),
    classification: {
      classifierId: "main-wire-integrated-composed-rhythm-periodic-classifier-v3",
      status: "period1-converged",
      latestCycleIndex: cycleIndex,
      consecutiveCyclesRequired: 3,
      minimumConsecutiveCycles: 3,
      acceptedEvidenceRole: "canonical-periodic-protocol",
      evidenceCycleIndices: [6, 7, 8],
      latestPeriod1MaximumNormalizedDelta: 0,
      latestPeriod2MaximumNormalizedDelta: null,
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    },
    terminalObservation: {
      cycleIndex,
      evidenceRole: "canonical-periodic-protocol",
      protocolIdentityHash: "a".repeat(64),
    },
    terminalCycle: {
      cycleIndex,
      startTimeSec,
      endTimeSec: startTimeSec + durationSec,
      acceptedStepCount: samples.length,
      conservation: {
        maximumGlobalTotalBloodVolumeErrorMl: 0,
        maximumCoronaryBloodVolumeLedgerResidualMl: 0,
        maximumDynamicMcsConservationResidualMlPerSec: 0,
        withinInheritedConstructionTolerances: true,
      },
      finiteAndEventIdentityChecks: {
        allRawValuesFinite: true,
        exactlyOneAtrialCapture: true,
        exactlyOneVentricularCapture: true,
        exactlyTwoDeliveredCalciumDeposits: true,
        oneComposedCalciumOwnerOnly: true,
        allDynamicMcsAcceptedFlowsExactlyZero: true,
        passed: true,
      },
    },
    terminalTrace: {
      cycleIndex,
      startTimeSec,
      endTimeSec: startTimeSec + durationSec,
      sampleCount: samples.length,
      samples,
      retainedForGraphShapeInspection: true,
      resamplingApplied: false,
      shapeAcceptanceClaimed: false,
      interpretation:
        "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance",
    },
    startBoundary: {
      source: "previous-cycle-terminal-accepted-endpoint",
      acceptedTimeSec: startTimeSec,
      chamberVolumeMl: { LV: start!.volumeMl, RV: start!.volumeMl },
      absolutePressureMmHg: {
        LV: start!.transmuralPressureMmHg + start!.externalPressureMmHg,
        RV: start!.transmuralPressureMmHg + start!.externalPressureMmHg,
      },
      transmuralPressureMmHg: {
        LV: start!.transmuralPressureMmHg,
        RV: start!.transmuralPressureMmHg,
      },
    },
  };
}

function sample(
  cycleIndex: number,
  index: number,
  startTimeSec: number,
  dtSec: number,
  value: Point,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const pressure = value.transmuralPressureMmHg + value.externalPressureMmHg;
  return {
    cycleIndex,
    acceptedStepIndexWithinCycle: index,
    acceptedTimeSec: startTimeSec + index * dtSec,
    cyclePhase01: index * dtSec,
    acceptedDtSec: dtSec,
    chamberVolumeMl: {
      LA: 10,
      LV: value.volumeMl,
      RA: 10,
      RV: value.volumeMl,
    },
    absolutePressureMmHg: {
      LA: pressure,
      LV: pressure,
      RA: pressure,
      RV: pressure,
      Ao: 80,
      PA: 15,
      PVein: 5,
    },
    transmuralPressureMmHg: {
      LV: value.transmuralPressureMmHg,
      RV: value.transmuralPressureMmHg,
    },
    valveFlowMlPerSec: { MV: 0, AoV: 0, TV: 0, PV: 0 },
    coronary: {
      totalInletFlowMlPerSec: 1,
      ladSubendocardialQmFlowMlPerSec: 0.1,
    },
    freeCalciumUMByWall: { LA: 0, LVFW: 0, SEP: 0, RVFW: 0, RA: 0 },
    dynamicMcsAcceptedFlowMlPerSec: {
      LVAD: 0,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    },
    acceptedEventIdentity: {
      atrialCapturedActivationId: null,
      ventricularCapturedActivationId: null,
      deliveredCalciumDepositIds: [],
      scheduledCalciumDepositIds: [],
    },
    diagnostics: {
      mechanicsResidualNorm: 0,
      circulationScaledResidualInfinityNorm: 0,
      maximumContinuityResidualMl: 0,
      totalBloodVolumeErrorMl: 0,
      coronaryBloodVolumeLedgerResidualMl: 0,
      dynamicMcsConservationResidualMlPerSec: 0,
    },
  };
}

function scaledPressureResult(
  source: MainWireIntegratedModelPeriodicPressureBasisWorkV1,
  cavityWork: number,
  transmuralWork: number,
): MainWireIntegratedModelPeriodicPressureBasisWorkV1 {
  const scale = (
    chamber: MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1,
  ): MainWireIntegratedModelPeriodicPressureBasisChamberWorkV1 => ({
    ...chamber,
    pathWorkMmHgMl: {
      "cavity-absolute-pressure": cavityWork,
      "ventricular-transmural-pressure": transmuralWork,
      "external-constraint-pressure": cavityWork - transmuralWork,
    },
    qualifiedWorkMmHgMl: {
      "cavity-absolute-pressure": cavityWork,
      "ventricular-transmural-pressure": transmuralWork,
      "external-constraint-pressure": cavityWork - transmuralWork,
    },
    decompositionResidualMmHgMl: 0,
    decompositionPassed: true,
    conventionalPvLoopExternalWorkMmHgMl: cavityWork,
    conventionalPvLoopExternalWorkEstablished: true,
    failureReasons: [],
  });
  return {
    ...source,
    status: "qualified-biventricular",
    leftVentricle: scale(source.leftVentricle),
    rightVentricle: scale(source.rightVentricle),
    conventionalPvLoopExternalWorkEstablishedBiventricular: true,
  };
}

function refinementRun(
  nominalDtSec: number,
  terminalPressureBasisWork: MainWireIntegratedModelPeriodicPressureBasisWorkV1,
  protocolIdentityHash: string,
): MainWireIntegratedModelPeriodicWorkRefinementRunV1 {
  return {
    executionPurpose: "canonical-evidence",
    numericalAccess: {
      accessId:
        "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1",
      minimumNominalDtSec: 0.0005,
      maximumNominalDtSec: 0.001,
      maximumAcceptedStepCountPerCycle: 2_200,
      refinementEvidenceOnly: true,
    },
    nominalDtSec,
    modelConditionIdentityHash: "c".repeat(64),
    protocolIdentityHash,
    numericalPeriod1Established: true,
    terminalCheckpointExactRoundTripVerified: true,
    terminalPressureBasisWork,
  };
}

function pressureArmRun(
  armId: MainWireIntegratedModelPeriodicPressureBasisArmRunV1["armId"],
  peepCmH2O: number,
  prescribedPericardialFluidVolumeMl: number,
  terminalPressureBasisWork: MainWireIntegratedModelPeriodicPressureBasisWorkV1,
  modelConditionIdentityHash: string,
  protocolIdentityHash: string,
): MainWireIntegratedModelPeriodicPressureBasisArmRunV1 {
  return {
    armId,
    peepCmH2O,
    prescribedPericardialFluidVolumeMl,
    executionPurpose: "canonical-evidence",
    numericalAccess: {
      accessId:
        "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1",
      minimumNominalDtSec: 0.0005,
      maximumNominalDtSec: 0.001,
      maximumAcceptedStepCountPerCycle: 2_200,
      refinementEvidenceOnly: true,
    },
    nominalDtSec: 0.001,
    modelConditionIdentityHash,
    protocolIdentityHash,
    numericalPeriod1Established: true,
    terminalCheckpointExactRoundTripVerified: true,
    terminalPressureBasisWork,
  };
}

function point(
  volumeMl: number,
  transmuralPressureMmHg: number,
  externalPressureMmHg: number,
): Point {
  return { volumeMl, transmuralPressureMmHg, externalPressureMmHg };
}
