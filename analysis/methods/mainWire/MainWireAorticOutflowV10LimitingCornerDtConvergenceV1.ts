import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowV9PressureStationsV1,
  type MainWireAorticOutflowV9PressureStationSummaryV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_V1_ID,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
  type MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
  type MainWireAorticOutflowV10LimitingCornerV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10LimitingCornerDtConvergenceV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-limiting-corner-dt-convergence-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source:
      "last-retained-complete-beat-from-independent-cold-start-runs" as const,
    cycleMetricsReuse:
      "main-wire-aortic-outflow-calcium-waveform-cycle-v1" as const,
    pressureStationReuse:
      "main-wire-aortic-outflow-v9-pressure-station-reconstruction-v1" as const,
    finestReference:
      "smallest-evaluated-dt-within-the-same-fixed-load-context" as const,
    differencesFromFinestAreSigned: true as const,
    maximumDifferencesFromFinestAreAbsolute: true as const,
    quantitativeConvergenceToleranceOrPassGateSpecified: false as const,
    acceptedStepEventTimesHaveDtQuantization: true as const,
    ejectionTiming:
      "aortic-flow-episode-proxy-and-left-ventricular-valve-event-ET-kept-distinct" as const,
    exactEvaluatorPortReadbackRequiredForExactPortAudit: true as const,
    characteristicLoadExcludedFromValveDissipationAudit: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    structuralTestMayOverrideEvaluatedDtSet: true as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

const EXACT_PORT_READBACK_TOLERANCE_MMHG = 1e-12;
const STATION_RECONSTRUCTION_TOLERANCE_MMHG = 1e-9;
const OPENING_TARGET_TOLERANCE_01 = 1e-12;
const SOURCE_RESISTANCE_TOLERANCE_MMHG_SEC_PER_ML = 1e-12;
const POWER_BALANCE_TOLERANCE_MMHG_ML_PER_SEC = 1e-7;
const ENERGY_LEDGER_TOLERANCE_MMHG_ML = 1e-6;

export type MainWireAorticOutflowV10LimitingCornerDtInputV1 = Readonly<{
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1;
  dtSec: number;
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1;
}>;

export type MainWireAorticOutflowV10LimitingCornerDtMetricsV1 = Readonly<{
  aorticEjectionTimeProxySec: number;
  leftVentricularValveEventEjectionTimeSec: number | null;
  accelerationTimeSec: number;
  strokeVolumeMl: number;
  peakAorticFlowMlPerSec: number;
  meanDopplerGradientMmHg: number;
  peakDopplerGradientMmHg: number;
  isovolumicContractionTimeSec: number | null;
  isovolumicRelaxationTimeSec: number | null;
  leftVentricularTeiIndex: number | null;
  maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec: number;
  minimumNegativeLeftVentricularPressureFallRateMmHgPerSec: number;
  maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec: number;
  strictAorticFlowPeakCountAboveFivePercent: number;
  distinctAorticFlowPeakCountAboveFivePercent: number;
  maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum: number;
  meanRawNodeGradientMmHg: number;
  peakRawNodeGradientMmHg: number;
  meanExactLocalPortGradientMmHg: number;
  peakExactLocalPortGradientMmHg: number;
  meanCharacteristicPressureMmHg: number;
  peakCharacteristicPressureMmHg: number;
  meanLvotCorrectedDopplerGradientMmHg: number;
  peakLvotCorrectedDopplerGradientMmHg: number;
  meanAorticComplianceNodePressureMmHg: number;
  peakAorticComplianceNodePressureMmHg: number;
  meanExactProximalConstitutivePortPressureMmHg: number;
  peakExactProximalConstitutivePortPressureMmHg: number;
}>;

export type MainWireAorticOutflowV10LimitingCornerDtDifferenceV1 = Readonly<{
  [Key in keyof MainWireAorticOutflowV10LimitingCornerDtMetricsV1]:
    MainWireAorticOutflowV10LimitingCornerDtMetricsV1[Key] extends number
      ? number
      : number | null;
}>;

export type MainWireAorticOutflowV10LimitingCornerExactAuditV1 = Readonly<{
  exactEvaluatorPortReadbackAvailableSampleCount: number;
  exactEvaluatorPortReadbackTotalSampleCount: number;
  exactEvaluatorPortReadbackAvailableForEverySample: boolean;
  maximumExactEvaluatorPortReconstructionResidualMmHg: number | null;
  maximumExactReadbackAorticNodeResidualMmHg: number;
  maximumExactReadbackCharacteristicPressureResidualMmHg: number;
  maximumExactReadbackLocalGradientResidualMmHg: number;
  maximumExactReadbackPressureRecoveryResidualMmHg: number;
  maximumStationExactPortReconstructionResidualMmHg: number;
  maximumStationRawNodeReconstructionResidualMmHg: number;
  maximumOpeningTargetStationResidual01: number;
  maximumOpeningEquationResidual01: number;
  maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl: number;
  maximumAbsolutePowerBalanceResidualMmHgMlPerSec: number;
  compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl: number;
  exactPortReadbackWithinTolerance: boolean;
  stationReconstructionWithinTolerance: boolean;
  ownedOpeningTargetWithinTolerance: boolean;
  sourceResistanceReadbackWithinTolerance: boolean;
  exactPowerBalanceWithinTolerance: boolean;
  valveDissipationLedgerWithinTolerance: boolean;
}>;

export type MainWireAorticOutflowV10LimitingCornerDtArmV1 = Readonly<{
  selection: MainWireAorticOutflowV10LimitingCornerV1;
  dtSec: number;
  protocolIdentityHash: string;
  terminationReason: string;
  periodicSteadyStateClaimed: boolean;
  integrationCompletedWithoutFailure: boolean;
  completedBeatCount: number;
  sampleCount: number;
  metrics: MainWireAorticOutflowV10LimitingCornerDtMetricsV1;
  exactAudit: MainWireAorticOutflowV10LimitingCornerExactAuditV1;
  differenceFromFinest:
    MainWireAorticOutflowV10LimitingCornerDtDifferenceV1;
}>;

export type MainWireAorticOutflowV10LimitingCornerDtContextConvergenceV1 =
  Readonly<{
    selection: MainWireAorticOutflowV10LimitingCornerV1;
    finestReferenceDtSec: number;
    arms: readonly MainWireAorticOutflowV10LimitingCornerDtArmV1[];
    maximumAbsoluteDifferenceFromFinest:
      MainWireAorticOutflowV10LimitingCornerDtDifferenceV1;
    protocolIdentityStableAcrossDt: boolean;
    strictPeakCountStableAcrossDt: boolean;
    distinctPeakCountStableAcrossDt: boolean;
  }>;

export type MainWireAorticOutflowV10LimitingCornerDtConvergenceV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_V1_ID;
  experimentId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_V1_ID;
  candidateId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId;
  evaluatedDtValuesSec: readonly number[];
  finestReferenceDtSec: number;
  evaluatedArmCount: number;
  canonicalDesignFullyEvaluated: boolean;
  arms: readonly MainWireAorticOutflowV10LimitingCornerDtArmV1[];
  convergenceByContext:
    readonly MainWireAorticOutflowV10LimitingCornerDtContextConvergenceV1[];
  protocolIdentityStableAcrossDtWithinEveryContext: boolean;
  allContextProtocolIdentitiesDistinct: boolean;
  allRunsPeriod1AndIntegrated: boolean;
  allStrictPeakCountsStableAcrossDt: boolean;
  allDistinctPeakCountsStableAcrossDt: boolean;
  allArmsHaveOneDistinctAorticFlowPeak: boolean;
  allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance: boolean;
  allStationReconstructionResidualsWithinTolerance: boolean;
  allOwnedOpeningTargetsWithinTolerance: boolean;
  allSourceResistanceReadbacksWithinTolerance: boolean;
  allExactPowerBalancesWithinTolerance: boolean;
  allValveDissipationLedgersWithinTolerance: boolean;
  experimentClaim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1;
  analysisClaim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_CLAIM_V1;
}>;

export type MainWireAorticOutflowV10LimitingCornerDtAnalysisOptionsV1 =
  Readonly<{
    expectedDtValuesSec?: readonly number[];
  }>;

type MeasuredArmWithoutDifferenceV1 = Omit<
  MainWireAorticOutflowV10LimitingCornerDtArmV1,
  "differenceFromFinest"
>;

const METRIC_KEYS = Object.freeze([
  "aorticEjectionTimeProxySec",
  "leftVentricularValveEventEjectionTimeSec",
  "accelerationTimeSec",
  "strokeVolumeMl",
  "peakAorticFlowMlPerSec",
  "meanDopplerGradientMmHg",
  "peakDopplerGradientMmHg",
  "isovolumicContractionTimeSec",
  "isovolumicRelaxationTimeSec",
  "leftVentricularTeiIndex",
  "maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec",
  "minimumNegativeLeftVentricularPressureFallRateMmHgPerSec",
  "maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec",
  "strictAorticFlowPeakCountAboveFivePercent",
  "distinctAorticFlowPeakCountAboveFivePercent",
  "maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum",
  "meanRawNodeGradientMmHg",
  "peakRawNodeGradientMmHg",
  "meanExactLocalPortGradientMmHg",
  "peakExactLocalPortGradientMmHg",
  "meanCharacteristicPressureMmHg",
  "peakCharacteristicPressureMmHg",
  "meanLvotCorrectedDopplerGradientMmHg",
  "peakLvotCorrectedDopplerGradientMmHg",
  "meanAorticComplianceNodePressureMmHg",
  "peakAorticComplianceNodePressureMmHg",
  "meanExactProximalConstitutivePortPressureMmHg",
  "peakExactProximalConstitutivePortPressureMmHg",
] as const satisfies readonly (
  keyof MainWireAorticOutflowV10LimitingCornerDtMetricsV1
)[]);

export function measureMainWireAorticOutflowV10LimitingCornerDtConvergenceV1(
  inputs: readonly MainWireAorticOutflowV10LimitingCornerDtInputV1[],
  options: MainWireAorticOutflowV10LimitingCornerDtAnalysisOptionsV1 = {},
): MainWireAorticOutflowV10LimitingCornerDtConvergenceV1 {
  const expectedDtValuesSec = validateDtValues(
    options.expectedDtValuesSec
      ?? MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
  );
  const expectedArmCount = expectedDtValuesSec.length
    * MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.length;
  if (inputs.length !== expectedArmCount) {
    throw new Error(
      `V10 limiting-corner dt comparison requires ${expectedArmCount} arms`,
    );
  }
  const byKey = new Map<string,
    MainWireAorticOutflowV10LimitingCornerDtInputV1>();
  for (const input of inputs) {
    if (!expectedDtValuesSec.includes(input.dtSec)) {
      throw new Error(`unexpected V10 limiting-corner dt: ${input.dtSec}`);
    }
    const selection = requireSelection(input.selectionId);
    const key = armKey(input.selectionId, input.dtSec);
    if (byKey.has(key)) {
      throw new Error(`duplicate V10 limiting-corner dt arm: ${key}`);
    }
    assertRunMatchesV10LimitingContext(input, selection);
    byKey.set(key, input);
  }

  const measuredWithoutDifference = new Map<string,
    MeasuredArmWithoutDifferenceV1>();
  for (const selection of MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1) {
    for (const dtSec of expectedDtValuesSec) {
      const key = armKey(selection.selectionId, dtSec);
      const input = byKey.get(key);
      if (input === undefined) {
        throw new Error(`missing V10 limiting-corner dt arm: ${key}`);
      }
      measuredWithoutDifference.set(key, measureArm(input, selection));
    }
  }

  const finestReferenceDtSec = Math.min(...expectedDtValuesSec);
  const convergenceByContext = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.map((selection) => {
      const rawArms = expectedDtValuesSec.map((dtSec) =>
        requiredMeasuredArm(
          measuredWithoutDifference,
          selection.selectionId,
          dtSec,
        ));
      const reference = requiredMeasuredArm(
        measuredWithoutDifference,
        selection.selectionId,
        finestReferenceDtSec,
      );
      const arms = Object.freeze(rawArms.map((arm) => Object.freeze({
        ...arm,
        differenceFromFinest: difference(arm.metrics, reference.metrics),
      })));
      return Object.freeze({
        selection,
        finestReferenceDtSec,
        arms,
        maximumAbsoluteDifferenceFromFinest:
          maximumAbsoluteDifference(arms.map((arm) =>
            arm.differenceFromFinest)),
        protocolIdentityStableAcrossDt: allEqualStrings(arms.map((arm) =>
          arm.protocolIdentityHash)),
        strictPeakCountStableAcrossDt: allEqual(arms.map((arm) =>
          arm.metrics.strictAorticFlowPeakCountAboveFivePercent)),
        distinctPeakCountStableAcrossDt: allEqual(arms.map((arm) =>
          arm.metrics.distinctAorticFlowPeakCountAboveFivePercent)),
      });
    }),
  );
  const arms = Object.freeze(convergenceByContext.flatMap((entry) =>
    entry.arms));
  const canonicalDesignFullyEvaluated = sameOrderedValues(
    expectedDtValuesSec,
    MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
  );
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_V1_ID,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
    evaluatedDtValuesSec: expectedDtValuesSec,
    finestReferenceDtSec,
    evaluatedArmCount: arms.length,
    canonicalDesignFullyEvaluated,
    arms,
    convergenceByContext,
    protocolIdentityStableAcrossDtWithinEveryContext:
      convergenceByContext.every((entry) =>
        entry.protocolIdentityStableAcrossDt),
    allContextProtocolIdentitiesDistinct: new Set(
      convergenceByContext.map((entry) =>
        entry.arms[0]!.protocolIdentityHash),
    ).size === convergenceByContext.length,
    allRunsPeriod1AndIntegrated: arms.every((arm) =>
      arm.periodicSteadyStateClaimed
      && arm.integrationCompletedWithoutFailure),
    allStrictPeakCountsStableAcrossDt: convergenceByContext.every((entry) =>
      entry.strictPeakCountStableAcrossDt),
    allDistinctPeakCountsStableAcrossDt: convergenceByContext.every((entry) =>
      entry.distinctPeakCountStableAcrossDt),
    allArmsHaveOneDistinctAorticFlowPeak: arms.every((arm) =>
      arm.metrics.distinctAorticFlowPeakCountAboveFivePercent === 1),
    allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance:
      arms.every((arm) => arm.exactAudit.exactPortReadbackWithinTolerance),
    allStationReconstructionResidualsWithinTolerance: arms.every((arm) =>
      arm.exactAudit.stationReconstructionWithinTolerance),
    allOwnedOpeningTargetsWithinTolerance: arms.every((arm) =>
      arm.exactAudit.ownedOpeningTargetWithinTolerance),
    allSourceResistanceReadbacksWithinTolerance: arms.every((arm) =>
      arm.exactAudit.sourceResistanceReadbackWithinTolerance),
    allExactPowerBalancesWithinTolerance: arms.every((arm) =>
      arm.exactAudit.exactPowerBalanceWithinTolerance),
    allValveDissipationLedgersWithinTolerance: arms.every((arm) =>
      arm.exactAudit.valveDissipationLedgerWithinTolerance),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_ANALYSIS_CLAIM_V1,
  });
}

function measureArm(
  input: MainWireAorticOutflowV10LimitingCornerDtInputV1,
  selection: MainWireAorticOutflowV10LimitingCornerV1,
): MeasuredArmWithoutDifferenceV1 {
  const result = input.run.periodicResult;
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    result,
    input.run.calciumDriveParams,
    `${selection.selectionId}@dt-${input.dtSec}`,
  );
  const pressureStations = measureMainWireAorticOutflowV9PressureStationsV1(
    result,
    input.run,
    "garcia-energy-loss-plus-downstream-kinetic-flux",
  );
  const metrics = metricsFromCycleAndStations(cycle, pressureStations);
  return Object.freeze({
    selection,
    dtSec: input.dtSec,
    protocolIdentityHash: result.protocolIdentityHash,
    terminationReason: result.terminationReason,
    periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
    integrationCompletedWithoutFailure:
      result.integrationCompletedWithoutFailure,
    completedBeatCount: result.completedBeatCount,
    sampleCount: cycle.sampleCount,
    metrics,
    exactAudit: measureExactAudit(input.run, pressureStations),
  });
}

function metricsFromCycleAndStations(
  cycle: ReturnType<typeof measureMainWireAorticOutflowCalciumWaveformCycleV1>,
  pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1,
): MainWireAorticOutflowV10LimitingCornerDtMetricsV1 {
  return Object.freeze({
    aorticEjectionTimeProxySec: cycle.aorticEjectionTimeProxySec,
    leftVentricularValveEventEjectionTimeSec:
      cycle.leftVentricularValveEventEjectionTimeSec,
    accelerationTimeSec: cycle.timeFromAorticFlowOnsetToPeakSec,
    strokeVolumeMl: cycle.aorticForwardVolumeMl,
    peakAorticFlowMlPerSec: cycle.aorticMaximumFlowMlPerSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    isovolumicContractionTimeSec:
      cycle.leftVentricularIsovolumicContractionTimeSec,
    isovolumicRelaxationTimeSec:
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    minimumNegativeLeftVentricularPressureFallRateMmHgPerSec:
      cycle.minimumNegativeLeftVentricularPressureFallRateMmHgPerSec,
    maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
      cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
    strictAorticFlowPeakCountAboveFivePercent:
      cycle.aorticFlowPeakCountAboveFivePercent,
    distinctAorticFlowPeakCountAboveFivePercent:
      cycle.aorticFlowDistinctPeakCountAboveFivePercent,
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
      cycle.maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
    meanRawNodeGradientMmHg:
      pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode,
    peakRawNodeGradientMmHg:
      pressureStations.peakInstantaneousGradientMmHg.rawLvMinusReservoirNode,
    meanExactLocalPortGradientMmHg:
      pressureStations.timeMeanGradientMmHg.exactLvMinusProximalPort,
    peakExactLocalPortGradientMmHg:
      pressureStations.peakInstantaneousGradientMmHg
        .exactLvMinusProximalPort,
    meanCharacteristicPressureMmHg:
      pressureStations.timeMeanGradientMmHg.proximalCharacteristic,
    peakCharacteristicPressureMmHg:
      pressureStations.peakInstantaneousGradientMmHg.proximalCharacteristic,
    meanLvotCorrectedDopplerGradientMmHg:
      pressureStations.timeMeanGradientMmHg.lvotCorrectedDoppler,
    peakLvotCorrectedDopplerGradientMmHg:
      pressureStations.peakInstantaneousGradientMmHg.lvotCorrectedDoppler,
    meanAorticComplianceNodePressureMmHg:
      pressureStations.absolutePressureMmHg.meanAorticReservoirNode,
    peakAorticComplianceNodePressureMmHg:
      pressureStations.absolutePressureMmHg.peakAorticReservoirNode,
    meanExactProximalConstitutivePortPressureMmHg:
      pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort,
    peakExactProximalConstitutivePortPressureMmHg:
      pressureStations.absolutePressureMmHg.peakAlgebraicProximalPort,
  });
}

function measureExactAudit(
  run:
    MainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchRunV1,
  pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1,
): MainWireAorticOutflowV10LimitingCornerExactAuditV1 {
  const result = run.periodicResult;
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error("V10 limiting-corner exact audit requires a beat");
  }
  const params = result.valveResearchInput.valves.AoV;
  const characteristicResistance = run.placementProfile!
    .upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  let maximumExactReadbackAorticNodeResidualMmHg = 0;
  let maximumExactReadbackCharacteristicPressureResidualMmHg = 0;
  let maximumExactReadbackLocalGradientResidualMmHg = 0;
  let maximumExactReadbackPressureRecoveryResidualMmHg = 0;
  let maximumOpeningTargetStationResidual01 = 0;
  let maximumOpeningEquationResidual01 = 0;
  let maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl = 0;
  let maximumAbsolutePowerBalanceResidualMmHgMlPerSec = 0;
  let compatibilityDissipativeEnergyMmHgMl = 0;
  let exactReadbackCount = 0;
  for (let index = 0; index < beat.samples.length; index += 1) {
    const sample = beat.samples[index]!;
    const valve = sample.valveHydraulics.AoV;
    const exact = valve.recoveredRootPortExactReadback;
    const lv = sample.circulationNodeAbsolutePressureMmHg.LV;
    const ao = sample.circulationNodeAbsolutePressureMmHg.Ao;
    const characteristicPressure = characteristicResistance
      * valve.flowMlPerSec;
    const reconstructedPort = ao + characteristicPressure;
    const localGradient = exact?.localValvePressureGradientMmHg
      ?? lv - reconstructedPort;
    const expectedTarget = evaluateMainWireValveOpeningTargetAndTangentV2(
      localGradient,
      params,
    ).openingTarget01;
    maximumOpeningTargetStationResidual01 = Math.max(
      maximumOpeningTargetStationResidual01,
      Math.abs(valve.openingTarget01 - expectedTarget),
    );
    maximumOpeningEquationResidual01 = Math.max(
      maximumOpeningEquationResidual01,
      Math.abs(valve.openingEquationResidual01),
    );
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec = Math.max(
      maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
      Math.abs(valve.powerBalanceResidualMmHgMlPerSec),
    );
    compatibilityDissipativeEnergyMmHgMl +=
      valve.dissipativePowerProxyMmHgMlPerSec * result.dtSec;
    if (valve.flowMlPerSec > 0) {
      maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl = Math.max(
        maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl,
        Math.abs(
          valve.resistanceMmHgSecPerMl
          - params.backgroundLinearResistanceMmHgSecPerMl,
        ),
      );
    }
    if (exact !== undefined) {
      exactReadbackCount += 1;
      maximumExactReadbackAorticNodeResidualMmHg = Math.max(
        maximumExactReadbackAorticNodeResidualMmHg,
        Math.abs(exact.aorticComplianceNodePressureMmHg - ao),
      );
      maximumExactReadbackCharacteristicPressureResidualMmHg = Math.max(
        maximumExactReadbackCharacteristicPressureResidualMmHg,
        Math.abs(
          exact.characteristicImpedancePressureMmHg - characteristicPressure,
        ),
      );
      maximumExactReadbackLocalGradientResidualMmHg = Math.max(
        maximumExactReadbackLocalGradientResidualMmHg,
        Math.abs(
          exact.localValvePressureGradientMmHg
          - (lv - exact.algebraicProximalConstitutivePortPressureMmHg),
        ),
      );
      const stationWaveform = pressureStations.waveform[index];
      if (
        stationWaveform !== undefined
        && stationWaveform.geometryRecoveredStaticAorticPressureMmHg !== null
      ) {
        const venaContractaStaticPressure = stationWaveform
          .venaContractaStaticPressureReadbackMmHg;
        if (venaContractaStaticPressure === null) continue;
        maximumExactReadbackPressureRecoveryResidualMmHg = Math.max(
          maximumExactReadbackPressureRecoveryResidualMmHg,
          Math.abs(
            exact.recoveredStaticPressureMmHg
            - (
              stationWaveform.geometryRecoveredStaticAorticPressureMmHg
              - venaContractaStaticPressure
            ),
          ),
        );
      }
    }
  }
  const reconstructedValveIrreversibleEnergyMmHgMl =
    pressureStations.cycleEnergyMmHgMl.sourceValveLinearDissipation
    + pressureStations.cycleEnergyMmHgMl
      .geometryIrreversibleConvectiveDissipation;
  const compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl =
    compatibilityDissipativeEnergyMmHgMl
    - reconstructedValveIrreversibleEnergyMmHgMl;
  const readback = pressureStations.exactEvaluatorProximalPortReadback;
  const exactEvaluatorPortReadbackAvailableForEverySample =
    exactReadbackCount === beat.samples.length
    && readback.availableSampleCount === readback.totalSampleCount
    && readback.totalSampleCount === beat.samples.length;
  const maximumExactEvaluatorPortReconstructionResidualMmHg =
    readback.maximumAbsoluteReconstructionResidualMmHg;
  const exactPortReadbackWithinTolerance =
    exactEvaluatorPortReadbackAvailableForEverySample
    && maximumExactEvaluatorPortReconstructionResidualMmHg !== null
    && maximumExactEvaluatorPortReconstructionResidualMmHg
      <= EXACT_PORT_READBACK_TOLERANCE_MMHG
    && maximumExactReadbackAorticNodeResidualMmHg
      <= EXACT_PORT_READBACK_TOLERANCE_MMHG
    && maximumExactReadbackCharacteristicPressureResidualMmHg
      <= EXACT_PORT_READBACK_TOLERANCE_MMHG
    && maximumExactReadbackLocalGradientResidualMmHg
      <= EXACT_PORT_READBACK_TOLERANCE_MMHG
    && maximumExactReadbackPressureRecoveryResidualMmHg
      <= EXACT_PORT_READBACK_TOLERANCE_MMHG;
  const stationReconstructionWithinTolerance =
    pressureStations.maximumAbsoluteResidualMmHg.exactPortReconstruction
      <= STATION_RECONSTRUCTION_TOLERANCE_MMHG
    && pressureStations.maximumAbsoluteResidualMmHg.rawNodeReconstruction
      <= STATION_RECONSTRUCTION_TOLERANCE_MMHG;
  return Object.freeze({
    exactEvaluatorPortReadbackAvailableSampleCount: exactReadbackCount,
    exactEvaluatorPortReadbackTotalSampleCount: beat.samples.length,
    exactEvaluatorPortReadbackAvailableForEverySample,
    maximumExactEvaluatorPortReconstructionResidualMmHg,
    maximumExactReadbackAorticNodeResidualMmHg,
    maximumExactReadbackCharacteristicPressureResidualMmHg,
    maximumExactReadbackLocalGradientResidualMmHg,
    maximumExactReadbackPressureRecoveryResidualMmHg,
    maximumStationExactPortReconstructionResidualMmHg:
      pressureStations.maximumAbsoluteResidualMmHg.exactPortReconstruction,
    maximumStationRawNodeReconstructionResidualMmHg:
      pressureStations.maximumAbsoluteResidualMmHg.rawNodeReconstruction,
    maximumOpeningTargetStationResidual01,
    maximumOpeningEquationResidual01,
    maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl,
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
    compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl,
    exactPortReadbackWithinTolerance,
    stationReconstructionWithinTolerance,
    ownedOpeningTargetWithinTolerance:
      maximumOpeningTargetStationResidual01 <= OPENING_TARGET_TOLERANCE_01,
    sourceResistanceReadbackWithinTolerance:
      maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl
        <= SOURCE_RESISTANCE_TOLERANCE_MMHG_SEC_PER_ML,
    exactPowerBalanceWithinTolerance:
      maximumAbsolutePowerBalanceResidualMmHgMlPerSec
        <= POWER_BALANCE_TOLERANCE_MMHG_ML_PER_SEC,
    valveDissipationLedgerWithinTolerance:
      Math.abs(compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl)
        <= ENERGY_LEDGER_TOLERANCE_MMHG_ML,
  });
}

function assertRunMatchesV10LimitingContext(
  input: MainWireAorticOutflowV10LimitingCornerDtInputV1,
  selection: MainWireAorticOutflowV10LimitingCornerV1,
): void {
  const run = input.run;
  const result = run.periodicResult;
  const candidate = MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10;
  const expected = selection.context;
  const mismatches = [
    mismatch("result dt", result.dtSec, input.dtSec),
    mismatch("calcium profile", run.sourceTraceProfile.profileId,
      candidate.calciumProfileId),
    mismatch("kuw profile", run.kuwProfile.profileId, candidate.kuwProfileId),
    mismatch("compliance profile", run.complianceProfile.profileId,
      expected.complianceProfileId),
    mismatch("placement profile", run.placementProfile?.profileId ?? null,
      candidate.characteristicResistancePlacementProfileId),
    mismatch("root inertance profile",
      run.rootInertanceProfile?.profileId ?? null,
      candidate.rootInertanceProfileId),
    mismatch("sarcomere reference profile",
      run.sarcomereReferenceProfile.profileId,
      candidate.sarcomereReferenceProfileId),
    mismatch("calcium sensitivity-length profile",
      run.calciumSensitivityLengthProfile.profileId,
      candidate.calciumSensitivityLengthProfileId),
    mismatch("twitch-retention candidate",
      run.sourceTwitchRetentionCandidate.candidateId,
      candidate.twitchRetentionCandidateId),
    mismatch("circulatory load point", run.circulatoryLoadPoint.pointId,
      expected.circulatoryLoadPointId),
    mismatch("stressed venous volume point",
      run.stressedVenousVolumePoint.pointId,
      expected.stressedVenousVolumePointId),
    mismatch("Tref force-load profile", run.trefForceLoadProfile.profileId,
      expected.trefForceLoadProfileId),
    mismatch("velocity-distortion profile",
      run.sourceVelocityDistortionProfile.profileId,
      candidate.sourceVelocityDistortionProfileId),
    mismatch("strong-bridge deactivation profile",
      run.strongBridgeDeactivationExitProfile.profileId,
      candidate.strongBridgeDeactivationExitProfileId),
    mismatch("atrioventricular-delay profile",
      run.atrioventricularDelayProfile.profileId,
      candidate.atrioventricularDelayProfileId),
    mismatch("pressure-recovery profile",
      run.aorticValveResearchProfile?.profileId ?? null,
      candidate.pressureRecoveryProfileId),
    mismatch("recovered-root-port profile",
      run.recoveredRootPortValveProfile?.profileId ?? null,
      candidate.recoveredRootPortValveProfileId),
    mismatch("maximum aortic forward EOA",
      result.valveResearchInput.valves.AoV.maximumForwardEoaCm2,
      candidate.aorticMaximumForwardEoaCm2),
  ].filter((issue): issue is string => issue !== null);
  if (
    !run.claim.independentCanonicalColdStart
    || run.claim.warmStartApplied
    || run.claim.genericParameterPatchAccepted
    || run.claim.valveDiseaseBracketApplied
    || !run.claim.aorticValveConstitutiveLawChanged
    || !run.claim.aorticValvePressureStationOwnershipChanged
    || run.claim.aorticMaximumForwardEoaChanged
    || run.claim.acceptedStateOrCheckpointTopologyChanged
  ) {
    mismatches.push("research-run claim does not preserve fixed V10 cold-start semantics");
  }
  if (mismatches.length > 0) {
    throw new Error(
      `V10 limiting-corner identity mismatch for ${selection.selectionId}: ${mismatches.join("; ")}`,
    );
  }
}

function difference(
  value: MainWireAorticOutflowV10LimitingCornerDtMetricsV1,
  reference: MainWireAorticOutflowV10LimitingCornerDtMetricsV1,
): MainWireAorticOutflowV10LimitingCornerDtDifferenceV1 {
  return Object.freeze(Object.fromEntries(METRIC_KEYS.map((key) => {
    const left = value[key];
    const right = reference[key];
    return [key, left === null || right === null ? null : left - right];
  }))) as MainWireAorticOutflowV10LimitingCornerDtDifferenceV1;
}

function maximumAbsoluteDifference(
  differences:
    readonly MainWireAorticOutflowV10LimitingCornerDtDifferenceV1[],
): MainWireAorticOutflowV10LimitingCornerDtDifferenceV1 {
  return Object.freeze(Object.fromEntries(METRIC_KEYS.map((key) => {
    const available = differences.flatMap((entry) =>
      entry[key] === null ? [] : [Math.abs(entry[key])]);
    return [key, available.length === 0 ? null : Math.max(...available)];
  }))) as MainWireAorticOutflowV10LimitingCornerDtDifferenceV1;
}

function requiredMeasuredArm(
  measured: ReadonlyMap<string, MeasuredArmWithoutDifferenceV1>,
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
  dtSec: number,
): MeasuredArmWithoutDifferenceV1 {
  const arm = measured.get(armKey(selectionId, dtSec));
  if (arm === undefined) {
    throw new Error(`missing measured V10 limiting-corner arm: ${selectionId}`);
  }
  return arm;
}

function requireSelection(
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
): MainWireAorticOutflowV10LimitingCornerV1 {
  const selection = MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.find(
    (candidate) => candidate.selectionId === selectionId,
  );
  if (selection === undefined) {
    throw new Error(`unsupported V10 limiting-corner selection: ${selectionId}`);
  }
  return selection;
}

function validateDtValues(values: readonly number[]): readonly number[] {
  if (
    values.length === 0
    || values.some((value) => !(value > 0) || !Number.isFinite(value))
    || new Set(values).size !== values.length
  ) {
    throw new Error("V10 limiting-corner dt values must be unique positive finite values");
  }
  return Object.freeze([...values]);
}

function armKey(
  selectionId: MainWireAorticOutflowV10LimitingCornerSelectionIdV1,
  dtSec: number,
): string {
  return `${selectionId}@${dtSec}`;
}

function mismatch(
  label: string,
  actual: string | number | boolean | null,
  expected: string | number | boolean | null,
): string | null {
  return actual === expected
    ? null
    : `${label} expected ${String(expected)}, received ${String(actual)}`;
}

function allEqual(values: readonly number[]): boolean {
  return values.every((value) => value === values[0]);
}

function allEqualStrings(values: readonly string[]): boolean {
  return values.every((value) => value === values[0]);
}

function sameOrderedValues(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}
