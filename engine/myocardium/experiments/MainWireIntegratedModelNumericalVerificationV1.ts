import {
  NORMAL_CORONARY_DISEASE_INPUT_V2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  createDynamicMechanicalSupportDeviceProfileBindingV1,
  createDynamicMechanicalSupportInertanceProfileV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
  type DynamicRotaryPumpCircuitInertanceV1,
} from "@/engine/devices/dynamicRotaryPumpV1";
import {
  HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
} from "@/engine/devices/defaultsV1";
import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import type { RotarySupportDeviceIdV1 } from "@/engine/devices/typesV1";
import {
  initializeMainWireIntegratedModelV1,
  maximumMainWireIntegratedModelStepDurationV1,
  stepMainWireIntegratedModelV1,
  type MainWireIntegratedModelAcceptedStateV1,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createPeriodicSinusFiveWallRhythmCalciumReplayV1,
} from "@/engine/myocardium/rhythm/acceptedFiveWallRhythmCalciumOwnerV1";

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V1_ID =
  "main-wire-integrated-model-one-cycle-dt-halving-verification-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V1 =
  Object.freeze({
    scope:
      "canonical-provider-one-cycle-base-coronary-v3-sinus-rhythm-and-active-heartmate-ii-r-l" as const,
    evidenceRole: Object.freeze([
      "construction-verification",
      "literature-transcription-verification",
      "bounded-dt-halving-numerical-verification",
    ] as const),
    acceptedTransactionExercised: true as const,
    waveformOrParameterFittingApplied: false as const,
    periodicSteadyStateClaimed: false as const,
    convergenceOrderClaimed: false as const,
    physiologicalAcceptanceClaimed: false as const,
    independentValidationClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
    heartMateIiInertanceProfileReleaseApproved: false as const,
    otherDeviceInertanceTransferClaimed: false as const,
  });

export const MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1 = Object.freeze({
  protocolId: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V1_ID,
  cycleLengthSec: 1,
  heartRateBpm: 60,
  coarseDtSec: 0.002,
  fineDtSec: 0.001,
  maximumAcceptedStepCountPerRun: 1_100,
  invariantTolerance: Object.freeze({
    acceptedOwnerClockSkewSec: 1e-12,
    globalTotalBloodVolumeErrorMl: 1e-8,
    coronaryBloodVolumeLedgerResidualMl: 1e-8,
    dynamicMcsConservationResidualMlPerSec: 1e-12,
  }),
  comparisonMetric: Object.freeze({
    meanLvadFlowMlPerSec: metric(100, 0.05),
    terminalLvadFlowMlPerSec: metric(100, 0.05),
    meanAorticPressureMmHg: metric(100, 0.05),
    terminalAorticPressureMmHg: metric(100, 0.05),
    meanLeftVentricularPressureMmHg: metric(100, 0.05),
    terminalLeftVentricularPressureMmHg: metric(100, 0.05),
    meanLeftVentricularVolumeMl: metric(100, 0.05),
    terminalLeftVentricularVolumeMl: metric(100, 0.05),
    meanTotalCoronaryInletFlowMlPerSec: metric(5, 0.05),
    terminalTotalCoronaryInletFlowMlPerSec: metric(5, 0.05),
    meanLadSubendocardialQmFlowMlPerSec: metric(5, 0.05),
    terminalLadSubendocardialQmFlowMlPerSec: metric(5, 0.05),
  }),
  comparisonInterpretation:
    "absolute-coarse-minus-fine-difference-divided-by-predeclared-numerical-scale-not-a-physiological-range" as const,
});

type SignalMetricIdV1 =
  keyof typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.comparisonMetric;

export type MainWireIntegratedModelVerificationSignalMetricsV1 = Readonly<
  Record<SignalMetricIdV1, number>
>;

export type MainWireIntegratedModelNumericalRunV1 = Readonly<{
  dtSec: number;
  completed: true;
  acceptedStepCount: number;
  acceptedClock: Readonly<{
    integratedTimeSec: number;
    coronaryTimeSec: number;
    circulationTimeSec: number;
    coronaryHydraulicTimeSec: number;
    mechanicsTimeSec: number;
    rhythmCalciumTimeSec: number;
    rhythmScheduleTimeSec: number;
    integratedRevision: number;
    coronaryRevision: number;
    circulationRevision: number;
    coronaryHydraulicRevision: number;
    mechanicsRevision: number;
    rhythmCalciumRevision: number;
    rhythmScheduleRevision: number;
    maximumOwnerClockSkewSec: number;
    allOwnerRevisionsMatch: boolean;
  }>;
  rhythm: Readonly<{
    scheduleId: string;
    scheduleFingerprint: string;
    scheduledEventCount: number;
    scheduledEventIds: readonly string[];
    scheduledActivationTimesSec: readonly number[];
    acceptedEventIds: readonly string[];
    acceptedActivationTimesSec: readonly number[];
    terminalCursor: number;
    terminalCursorMatchesSchedule: boolean;
    acceptedEventSequenceMatchesSchedule: boolean;
  }>;
  invariant: Readonly<{
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    acceptedEndTimeMatchesProtocol: boolean;
    coronaryAutoregulationWindowIndex: number;
    coronaryAutoregulationWindowIsEmptyAtCycleEnd: boolean;
    allWithinTolerance: boolean;
  }>;
  signal: MainWireIntegratedModelVerificationSignalMetricsV1;
  terminalAcceptedState:
    MainWireIntegratedModelAcceptedStateV1<
      MainWireNormalAdultFiveWallMechanicsStateV1
    >;
}>;

export type MainWireIntegratedModelCrossDtComparisonV1 = Readonly<{
  metricId: SignalMetricIdV1;
  coarseValue: number;
  fineValue: number;
  absoluteDelta: number;
  normalizationScale: number;
  normalizedDelta: number;
  numericalToleranceNormalized: number;
  withinTolerance: boolean;
}>;

export type MainWireIntegratedModelNumericalVerificationResultV1 = Readonly<{
  experimentId: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V1_ID;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V1;
  protocol: typeof MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1;
  heartMateIiTranscription: Readonly<{
    profileId: string;
    profileReleaseApproved: false;
    lvadEnabled: true;
    lvadSpeedRpm: 9_000;
    pumpInternalInertanceMmHgSec2PerMl: number;
    drainageInertanceMmHgSec2PerMl: number;
    returnPathInertanceMmHgSec2PerMl: number;
    totalCircuitInertanceMmHgSec2PerMl: number;
  }>;
  coarse: MainWireIntegratedModelNumericalRunV1;
  fine: MainWireIntegratedModelNumericalRunV1;
  crossDt: readonly MainWireIntegratedModelCrossDtComparisonV1[];
  eventIdentityAndCursorMatchAcrossDt: boolean;
  allNumericalChecksPassed: boolean;
}>;

/**
 * Executes exactly one physical cycle at 2 ms and 1 ms. This is deliberately
 * a bounded transcription/integration check, not a physiological acceptance
 * protocol and not a periodic steady-state runner.
 */
export function runMainWireIntegratedModelNumericalVerificationV1():
MainWireIntegratedModelNumericalVerificationResultV1 {
  const coarse = runOneCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.coarseDtSec,
  );
  const fine = runOneCycle(
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.fineDtSec,
  );
  const crossDt = compareRuns(coarse, fine);
  const eventIdentityAndCursorMatchAcrossDt =
    arraysEqual(coarse.rhythm.scheduledEventIds, fine.rhythm.scheduledEventIds)
    && arraysEqual(coarse.rhythm.acceptedEventIds, fine.rhythm.acceptedEventIds)
    && arraysEqual(
      coarse.rhythm.scheduledActivationTimesSec,
      fine.rhythm.scheduledActivationTimesSec,
    )
    && arraysEqual(
      coarse.rhythm.acceptedActivationTimesSec,
      fine.rhythm.acceptedActivationTimesSec,
    )
    && coarse.rhythm.terminalCursor === fine.rhythm.terminalCursor;
  const inertance = HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1;
  return Object.freeze({
    experimentId: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_V1_ID,
    claim: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_VERIFICATION_CLAIM_V1,
    protocol: MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1,
    heartMateIiTranscription: Object.freeze({
      profileId: heartMateIiOnlyVerificationProfile().profileId,
      profileReleaseApproved: false as const,
      lvadEnabled: true as const,
      lvadSpeedRpm: 9_000 as const,
      pumpInternalInertanceMmHgSec2PerMl:
        inertance.pumpInternalMmHgSec2PerMl,
      drainageInertanceMmHgSec2PerMl:
        inertance.drainageMmHgSec2PerMl,
      returnPathInertanceMmHgSec2PerMl:
        inertance.returnPathMmHgSec2PerMl,
      totalCircuitInertanceMmHgSec2PerMl:
        inertance.pumpInternalMmHgSec2PerMl
        + inertance.drainageMmHgSec2PerMl
        + inertance.oxygenatorMmHgSec2PerMl
        + inertance.returnPathMmHgSec2PerMl,
    }),
    coarse,
    fine,
    crossDt,
    eventIdentityAndCursorMatchAcrossDt,
    allNumericalChecksPassed:
      coarse.invariant.allWithinTolerance
      && fine.invariant.allWithinTolerance
      && eventIdentityAndCursorMatchAcrossDt
      && crossDt.every((comparison) => comparison.withinTolerance),
  });
}

export function createMainWireIntegratedHeartMateIiVerificationProfileV1():
DynamicMechanicalSupportInertanceProfileV1 {
  return heartMateIiOnlyVerificationProfile();
}

function runOneCycle(dtSec: number): MainWireIntegratedModelNumericalRunV1 {
  const protocol = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1;
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const runtime = normalAdultMainWireRuntimeV1();
  const pericardium = createMainWireNormalAdultCommonPericardiumV1();
  const replay = createPeriodicSinusFiveWallRhythmCalciumReplayV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      scheduleId: "integrated-numerical-verification-sinus-v1",
      bindingId: "integrated-numerical-verification-sinus-binding-v1",
      acceptedTimeSec: 0,
      endTimeSec: protocol.cycleLengthSec,
      revision: 0,
    },
  );
  const profile = heartMateIiOnlyVerificationProfile();
  const config = mechanicalSupportPresetV1("lvad-hmii-9000");
  const rhythm = Object.freeze({
    binding: replay.binding,
    schedule: replay.schedule,
  });
  const dynamicMechanicalSupport = Object.freeze({
    config,
    heartRateBpm: protocol.heartRateBpm,
    profile,
  });
  const coronaryStepInput = Object.freeze({
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    circulationNewtonOptions:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
  });
  const cold = initializeMainWireIntegratedModelV1({
    coronary: {
      provider,
      runtime,
      calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      pericardium,
      coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
      coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
      collapseHydraulics:
        MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPrior:
        NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
      fixedGlobalTotalBloodVolumeMl:
        MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
          .fullGraphReferenceTotalBloodVolumeMl,
      autoregulationWindow: Object.freeze({
        durationSec: protocol.cycleLengthSec,
        interpretation: "periodic-sinus-cycle-aligned" as const,
      }),
    },
    rhythm: {
      ...rhythm,
      acceptedState: replay.acceptedState,
    },
    dynamicMechanicalSupport,
  });

  let accepted = cold.acceptedState;
  let acceptedStepCount = 0;
  let nominalGridIndex = 1;
  let maximumGlobalTotalBloodVolumeErrorMl = 0;
  let maximumCoronaryBloodVolumeLedgerResidualMl = 0;
  let maximumDynamicMcsConservationResidualMlPerSec = 0;
  const acceptedEventIds: string[] = [];
  const acceptedActivationTimesSec: number[] = [];
  const integral = emptySignalAccumulator();
  let terminal: SignalSnapshotV1 | null = null;

  while (accepted.acceptedTimeSec < protocol.cycleLengthSec) {
    if (acceptedStepCount >= protocol.maximumAcceptedStepCountPerRun) {
      throw new Error("integrated numerical verification exceeded step bound");
    }
    const nominalTargetTimeSec = Math.min(
      protocol.cycleLengthSec,
      nominalGridIndex * dtSec,
    );
    const requestedStepSec = nominalTargetTimeSec - accepted.acceptedTimeSec;
    if (!(requestedStepSec > 0)) {
      nominalGridIndex += 1;
      continue;
    }
    const maximum = maximumMainWireIntegratedModelStepDurationV1(
      accepted,
      requestedStepSec,
      rhythm,
      profile,
      config,
    );
    const actualDtSec = maximum.maximumStepSec;
    const stepped = stepMainWireIntegratedModelV1(provider, accepted, {
      dtSec: actualDtSec,
      coronary: coronaryStepInput,
      rhythm,
      dynamicMechanicalSupport,
    });
    if (stepped.converged === false) {
      throw new Error(
        `integrated numerical verification failed at ${accepted.acceptedTimeSec}s: ${stepped.message}`,
      );
    }
    accepted = stepped.acceptedState;
    acceptedStepCount += 1;
    if (Math.abs(accepted.acceptedTimeSec - nominalTargetTimeSec) <= 1e-14) {
      nominalGridIndex += 1;
    }

    maximumGlobalTotalBloodVolumeErrorMl = Math.max(
      maximumGlobalTotalBloodVolumeErrorMl,
      Math.abs(
        stepped.coronaryStep.baseStep.circulationTrial.diagnostics
          .totalBloodVolumeErrorMl,
      ),
    );
    maximumCoronaryBloodVolumeLedgerResidualMl = Math.max(
      maximumCoronaryBloodVolumeLedgerResidualMl,
      Math.abs(
        stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
          .exactBloodVolumeLedgerResidualMl,
      ),
    );
    maximumDynamicMcsConservationResidualMlPerSec = Math.max(
      maximumDynamicMcsConservationResidualMlPerSec,
      Math.abs(
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
      ),
    );
    for (const event of stepped.rhythmTrial.activationEvents) {
      acceptedEventIds.push(event.eventId);
      acceptedActivationTimesSec.push(event.activationTimeSec);
    }
    terminal = signalSnapshot(stepped);
    accumulateSignals(integral, terminal, actualDtSec);
  }
  if (terminal === null) throw new Error("integrated verification took no steps");

  const clock = acceptedClock(accepted, acceptedStepCount);
  const invariantTolerance = protocol.invariantTolerance;
  const autoregulation = accepted.coronary.coronaryAutoregulation;
  const scheduledEventIds = replay.schedule.events.map(
    (event) => event.eventId,
  );
  const scheduledActivationTimesSec = replay.schedule.events.map(
    (event) => event.activationTimeSec,
  );
  const terminalCursorMatchesSchedule =
    accepted.rhythmCalcium.rhythmSchedule.cursor === replay.schedule.eventCount;
  const acceptedEventSequenceMatchesSchedule =
    arraysEqual(acceptedEventIds, scheduledEventIds)
    && arraysEqual(acceptedActivationTimesSec, scheduledActivationTimesSec);
  const invariant = Object.freeze({
    maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec,
    acceptedEndTimeMatchesProtocol:
      accepted.acceptedTimeSec === protocol.cycleLengthSec,
    coronaryAutoregulationWindowIndex: autoregulation.windowIndex,
    coronaryAutoregulationWindowIsEmptyAtCycleEnd:
      autoregulation.windowIndex === 1
      && autoregulation.acceptedDurationSec === 0
      && autoregulation.acceptedStepCount === 0
      && autoregulation.windowControl === null,
    allWithinTolerance:
      clock.maximumOwnerClockSkewSec
        <= invariantTolerance.acceptedOwnerClockSkewSec
      && clock.allOwnerRevisionsMatch
      && accepted.acceptedTimeSec === protocol.cycleLengthSec
      && terminalCursorMatchesSchedule
      && acceptedEventSequenceMatchesSchedule
      && maximumGlobalTotalBloodVolumeErrorMl
        <= invariantTolerance.globalTotalBloodVolumeErrorMl
      && maximumCoronaryBloodVolumeLedgerResidualMl
        <= invariantTolerance.coronaryBloodVolumeLedgerResidualMl
      && maximumDynamicMcsConservationResidualMlPerSec
        <= invariantTolerance.dynamicMcsConservationResidualMlPerSec
      && autoregulation.windowIndex === 1
      && autoregulation.acceptedDurationSec === 0
      && autoregulation.acceptedStepCount === 0
      && autoregulation.windowControl === null,
  });
  return Object.freeze({
    dtSec,
    completed: true as const,
    acceptedStepCount,
    acceptedClock: clock,
    rhythm: Object.freeze({
      scheduleId: replay.schedule.scheduleId,
      scheduleFingerprint: replay.schedule.scheduleFingerprint,
      scheduledEventCount: replay.schedule.eventCount,
      scheduledEventIds: Object.freeze(scheduledEventIds),
      scheduledActivationTimesSec: Object.freeze(scheduledActivationTimesSec),
      acceptedEventIds: Object.freeze(acceptedEventIds),
      acceptedActivationTimesSec: Object.freeze(acceptedActivationTimesSec),
      terminalCursor: accepted.rhythmCalcium.rhythmSchedule.cursor,
      terminalCursorMatchesSchedule,
      acceptedEventSequenceMatchesSchedule,
    }),
    invariant,
    signal: finalizeSignals(integral, terminal, protocol.cycleLengthSec),
    terminalAcceptedState: accepted,
  });
}

type SignalSnapshotV1 = Readonly<{
  lvadFlowMlPerSec: number;
  aorticPressureMmHg: number;
  leftVentricularPressureMmHg: number;
  leftVentricularVolumeMl: number;
  totalCoronaryInletFlowMlPerSec: number;
  ladSubendocardialQmFlowMlPerSec: number;
}>;

type SignalAccumulatorV1 = {
  lvadFlowMl: number;
  aorticPressureMmHgSec: number;
  leftVentricularPressureMmHgSec: number;
  leftVentricularVolumeMlSec: number;
  totalCoronaryInletFlowMl: number;
  ladSubendocardialQmFlowMl: number;
};

function signalSnapshot(
  stepped: Extract<
    ReturnType<typeof stepMainWireIntegratedModelV1<
      MainWireNormalAdultFiveWallMechanicsStateV1
    >>,
    { converged: true }
  >,
): SignalSnapshotV1 {
  const circulation = stepped.coronaryStep.baseStep.circulationTrial;
  const coronary = stepped.coronaryStep.baseStep.coronaryTrial.diagnostics
    .hydraulics;
  return Object.freeze({
    lvadFlowMlPerSec:
      stepped.dynamicMechanicalSupportTrial.pump.LVAD.flowMlPerSec,
    aorticPressureMmHg: circulation.nodeAbsolutePressuresMmHg.Ao,
    leftVentricularPressureMmHg: circulation.nodeAbsolutePressuresMmHg.LV,
    leftVentricularVolumeMl: circulation.candidateNodeVolumesMl.LV,
    totalCoronaryInletFlowMlPerSec: coronary.totalInletFlowMlPerSec,
    ladSubendocardialQmFlowMlPerSec:
      coronary.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
  });
}

function emptySignalAccumulator(): SignalAccumulatorV1 {
  return {
    lvadFlowMl: 0,
    aorticPressureMmHgSec: 0,
    leftVentricularPressureMmHgSec: 0,
    leftVentricularVolumeMlSec: 0,
    totalCoronaryInletFlowMl: 0,
    ladSubendocardialQmFlowMl: 0,
  };
}

function accumulateSignals(
  accumulator: SignalAccumulatorV1,
  signal: SignalSnapshotV1,
  dtSec: number,
): void {
  accumulator.lvadFlowMl += signal.lvadFlowMlPerSec * dtSec;
  accumulator.aorticPressureMmHgSec += signal.aorticPressureMmHg * dtSec;
  accumulator.leftVentricularPressureMmHgSec +=
    signal.leftVentricularPressureMmHg * dtSec;
  accumulator.leftVentricularVolumeMlSec +=
    signal.leftVentricularVolumeMl * dtSec;
  accumulator.totalCoronaryInletFlowMl +=
    signal.totalCoronaryInletFlowMlPerSec * dtSec;
  accumulator.ladSubendocardialQmFlowMl +=
    signal.ladSubendocardialQmFlowMlPerSec * dtSec;
}

function finalizeSignals(
  integral: SignalAccumulatorV1,
  terminal: SignalSnapshotV1,
  durationSec: number,
): MainWireIntegratedModelVerificationSignalMetricsV1 {
  return Object.freeze({
    meanLvadFlowMlPerSec: integral.lvadFlowMl / durationSec,
    terminalLvadFlowMlPerSec: terminal.lvadFlowMlPerSec,
    meanAorticPressureMmHg: integral.aorticPressureMmHgSec / durationSec,
    terminalAorticPressureMmHg: terminal.aorticPressureMmHg,
    meanLeftVentricularPressureMmHg:
      integral.leftVentricularPressureMmHgSec / durationSec,
    terminalLeftVentricularPressureMmHg:
      terminal.leftVentricularPressureMmHg,
    meanLeftVentricularVolumeMl:
      integral.leftVentricularVolumeMlSec / durationSec,
    terminalLeftVentricularVolumeMl: terminal.leftVentricularVolumeMl,
    meanTotalCoronaryInletFlowMlPerSec:
      integral.totalCoronaryInletFlowMl / durationSec,
    terminalTotalCoronaryInletFlowMlPerSec:
      terminal.totalCoronaryInletFlowMlPerSec,
    meanLadSubendocardialQmFlowMlPerSec:
      integral.ladSubendocardialQmFlowMl / durationSec,
    terminalLadSubendocardialQmFlowMlPerSec:
      terminal.ladSubendocardialQmFlowMlPerSec,
  });
}

function acceptedClock(
  state: MainWireIntegratedModelAcceptedStateV1<
    MainWireNormalAdultFiveWallMechanicsStateV1
  >,
  acceptedStepCount: number,
): MainWireIntegratedModelNumericalRunV1["acceptedClock"] {
  const times = [
    state.acceptedTimeSec,
    state.coronary.acceptedTimeSec,
    state.coronary.circulation.acceptedTimeSec,
    state.coronary.coronary.acceptedTimeSec,
    state.coronary.mechanics.acceptedTimeSec,
    state.rhythmCalcium.acceptedTimeSec,
    state.rhythmCalcium.rhythmSchedule.acceptedTimeSec,
  ];
  const revisions = [
    state.revision,
    state.coronary.revision,
    state.coronary.circulation.revision,
    state.coronary.coronary.revision,
    state.coronary.mechanics.revision,
    state.rhythmCalcium.revision,
    state.rhythmCalcium.rhythmSchedule.revision,
  ];
  const maximumOwnerClockSkewSec = Math.max(...times)
    - Math.min(...times);
  return Object.freeze({
    integratedTimeSec: times[0]!,
    coronaryTimeSec: times[1]!,
    circulationTimeSec: times[2]!,
    coronaryHydraulicTimeSec: times[3]!,
    mechanicsTimeSec: times[4]!,
    rhythmCalciumTimeSec: times[5]!,
    rhythmScheduleTimeSec: times[6]!,
    integratedRevision: revisions[0]!,
    coronaryRevision: revisions[1]!,
    circulationRevision: revisions[2]!,
    coronaryHydraulicRevision: revisions[3]!,
    mechanicsRevision: revisions[4]!,
    rhythmCalciumRevision: revisions[5]!,
    rhythmScheduleRevision: revisions[6]!,
    maximumOwnerClockSkewSec,
    allOwnerRevisionsMatch:
      revisions.every((revision) => revision === acceptedStepCount),
  });
}

function compareRuns(
  coarse: MainWireIntegratedModelNumericalRunV1,
  fine: MainWireIntegratedModelNumericalRunV1,
): readonly MainWireIntegratedModelCrossDtComparisonV1[] {
  return Object.freeze(
    (Object.keys(
      MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1.comparisonMetric,
    ) as SignalMetricIdV1[]).map((metricId) => {
      const policy = MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_PROTOCOL_V1
        .comparisonMetric[metricId];
      const coarseValue = coarse.signal[metricId];
      const fineValue = fine.signal[metricId];
      const absoluteDelta = Math.abs(coarseValue - fineValue);
      const normalizedDelta = absoluteDelta / policy.normalizationScale;
      return Object.freeze({
        metricId,
        coarseValue,
        fineValue,
        absoluteDelta,
        normalizationScale: policy.normalizationScale,
        normalizedDelta,
        numericalToleranceNormalized: policy.numericalToleranceNormalized,
        withinTolerance:
          normalizedDelta <= policy.numericalToleranceNormalized,
      });
    }),
  );
}

function heartMateIiOnlyVerificationProfile():
DynamicMechanicalSupportInertanceProfileV1 {
  const zero = Object.freeze({
    unitSystemId: DYNAMIC_ROTARY_PUMP_UNIT_SYSTEM_V1_ID,
    pumpInternalMmHgSec2PerMl: 0,
    drainageMmHgSec2PerMl: 0,
    oxygenatorMmHgSec2PerMl: 0,
    returnPathMmHgSec2PerMl: 0,
  }) satisfies DynamicRotaryPumpCircuitInertanceV1;
  return createDynamicMechanicalSupportInertanceProfileV1({
    profileId:
      "heartmate-ii-literature-r-l-dt-halving-verification-not-release-approved",
    profileBindingSha256: "b".repeat(64),
    deviceProfileBindingByDevice: Object.freeze({
      LVAD: verificationBinding("LVAD", "1"),
      IMPELLA: verificationBinding("IMPELLA", "2"),
      VA_ECMO: verificationBinding("VA_ECMO", "3"),
      VV_ECMO: verificationBinding("VV_ECMO", "4"),
    }),
    inertanceByDevice: Object.freeze({
      LVAD: HEARTMATE_II_LITERATURE_CIRCUIT_INERTANCE_V1,
      IMPELLA: zero,
      VA_ECMO: zero,
      VV_ECMO: zero,
    }),
  });
}

function verificationBinding(
  deviceId: RotarySupportDeviceIdV1,
  digit: string,
) {
  return createDynamicMechanicalSupportDeviceProfileBindingV1({
    deviceId,
    circuitProfileId:
      `integrated-numerical-${deviceId.toLowerCase()}-not-release-approved`,
    circuitProfileBindingSha256: digit.repeat(64),
  });
}

function metric(normalizationScale: number, numericalToleranceNormalized: number) {
  return Object.freeze({ normalizationScale, numericalToleranceNormalized });
}

function arraysEqual(
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
