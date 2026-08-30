import {
  measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1,
  type MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  measureMainWireAorticOutflowV9PressureStationsV1,
  type MainWireAorticOutflowV9PressureStationSummaryV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV9PressureRecoveryBaselineComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_V1_ID,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10CombinedLoadEnvelopeV1";
import {
  evaluateMainWireValveOpeningTargetAndTangentV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-combined-load-envelope-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat-per-independent-cold-run" as const,
    baseFactorialAnalysis:
      "main-wire-aortic-outflow-physiology-candidate-combined-load-envelope-analysis-v1" as const,
    pressureStationExtension:
      "V10-exact-Ao-compliance-node-plus-characteristic-proximal-port" as const,
    localValveGradient:
      "LV-minus-proximal-constitutive-port" as const,
    pressureStationGradientAggregation:
      "arithmetic-mean-of-strictly-positive-accepted-AoV-flow-samples" as const,
    exactBeatAccumulatorZeroCrossingInterpolationUsed: false as const,
    proximalPortUsesExactEvaluatorReadback: true as const,
    independentPeakComponentsAdditive: false as const,
    openingTargetAuditedAtLocalPortPressurePointwise: true as const,
    characteristicLoadExcludedFromValveDissipationPointwise: true as const,
    exactFrameMutation: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type NumericRangeV1 = Readonly<{ minimum: number; maximum: number }>;

export type MainWireAorticOutflowV10LoadStationArmV1 = Readonly<{
  contextId: string;
  protocolIdentityHash: string;
  pressureStations: MainWireAorticOutflowV9PressureStationSummaryV1;
  maximumOpeningTargetStationResidual01: number;
  maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl: number;
  maximumAbsolutePowerBalanceResidualMmHgMlPerSec: number;
  compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl: number;
}>;

export type MainWireAorticOutflowV10CombinedLoadStationRangesV1 = Readonly<{
  ejectionTimeSec: NumericRangeV1;
  meanRawNodeGradientMmHg: NumericRangeV1;
  peakRawNodeGradientMmHg: NumericRangeV1;
  meanLocalPortGradientMmHg: NumericRangeV1;
  peakLocalPortGradientMmHg: NumericRangeV1;
  meanSimplifiedDopplerGradientMmHg: NumericRangeV1;
  peakSimplifiedDopplerGradientMmHg: NumericRangeV1;
  meanLvotCorrectedDopplerGradientMmHg: NumericRangeV1;
  peakLvotCorrectedDopplerGradientMmHg: NumericRangeV1;
  meanCharacteristicPressureMmHg: NumericRangeV1;
  peakCharacteristicPressureMmHg: NumericRangeV1;
  meanAorticComplianceNodePressureMmHg: NumericRangeV1;
  meanProximalConstitutivePortPressureMmHg: NumericRangeV1;
}>;

export type MainWireAorticOutflowV10CombinedLoadEnvelopeV1 = Readonly<{
  methodId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID;
  experimentId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_V1_ID;
  candidateId:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId;
  baseEnvelope:
    MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1;
  stationArms: readonly MainWireAorticOutflowV10LoadStationArmV1[];
  stationRanges: MainWireAorticOutflowV10CombinedLoadStationRangesV1;
  allExpectedContextsPresent: true;
  allRunsPeriod1AndIntegrated: boolean;
  allOwnedOpeningTargetsWithinTolerance: boolean;
  allSourceResistanceReadbacksWithinTolerance: boolean;
  allExactPowerBalancesWithinTolerance: boolean;
  allValveDissipationLedgersWithinTolerance: boolean;
  allStationReconstructionResidualsWithinTolerance: boolean;
  allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance: boolean;
  experimentClaim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_CLAIM_V1;
  analysisClaim:
    typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1;
}>;

export function measureMainWireAorticOutflowV10CombinedLoadEnvelopeV1(
  inputs:
    readonly MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1[],
): MainWireAorticOutflowV10CombinedLoadEnvelopeV1 {
  const baseEnvelope =
    measureMainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1(
      inputs,
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
        .twitchRetentionCandidateId,
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10
        .strongBridgeDeactivationExitProfileId,
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10,
    );
  const byContext = new Map(inputs.map((input) => [input.contextId, input]));
  const stationArms = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
      .map((context) => {
        const input = byContext.get(context.contextId);
        if (input === undefined) {
          throw new Error(`missing V10 station context: ${context.contextId}`);
        }
        return measureStationArm(input);
      }),
  );
  const baseByContext = new Map(baseEnvelope.arms.map((arm) =>
    [arm.context.contextId, arm]));
  const read = (
    select: (arm: MainWireAorticOutflowV10LoadStationArmV1) => number,
  ): NumericRangeV1 => range(stationArms.map(select));
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_V1_ID,
    experimentId: MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_V1_ID,
    candidateId: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10.candidateId,
    baseEnvelope,
    stationArms,
    stationRanges: Object.freeze({
      ejectionTimeSec: range(stationArms.map((arm) => {
        const base = baseByContext.get(arm.contextId);
        if (base === undefined) throw new Error("missing base envelope arm");
        return base.coreMetrics.ejectionTimeSec;
      })),
      meanRawNodeGradientMmHg: read((arm) =>
        arm.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode),
      peakRawNodeGradientMmHg: read((arm) =>
        arm.pressureStations.peakInstantaneousGradientMmHg
          .rawLvMinusReservoirNode),
      meanLocalPortGradientMmHg: read((arm) =>
        arm.pressureStations.timeMeanGradientMmHg
          .exactLvMinusProximalPort),
      peakLocalPortGradientMmHg: read((arm) =>
        arm.pressureStations.peakInstantaneousGradientMmHg
          .exactLvMinusProximalPort),
      meanSimplifiedDopplerGradientMmHg: read((arm) =>
        arm.pressureStations.timeMeanGradientMmHg.simplifiedDoppler),
      peakSimplifiedDopplerGradientMmHg: read((arm) =>
        arm.pressureStations.peakInstantaneousGradientMmHg.simplifiedDoppler),
      meanLvotCorrectedDopplerGradientMmHg: read((arm) =>
        arm.pressureStations.timeMeanGradientMmHg.lvotCorrectedDoppler),
      peakLvotCorrectedDopplerGradientMmHg: read((arm) =>
        arm.pressureStations.peakInstantaneousGradientMmHg
          .lvotCorrectedDoppler),
      meanCharacteristicPressureMmHg: read((arm) =>
        arm.pressureStations.timeMeanGradientMmHg.proximalCharacteristic),
      peakCharacteristicPressureMmHg: read((arm) =>
        arm.pressureStations.peakInstantaneousGradientMmHg
          .proximalCharacteristic),
      meanAorticComplianceNodePressureMmHg: read((arm) =>
        arm.pressureStations.absolutePressureMmHg.meanAorticReservoirNode),
      meanProximalConstitutivePortPressureMmHg: read((arm) =>
        arm.pressureStations.absolutePressureMmHg.meanAlgebraicProximalPort),
    }),
    allExpectedContextsPresent: true as const,
    allRunsPeriod1AndIntegrated: baseEnvelope.allRunsPeriod1AndIntegrated,
    allOwnedOpeningTargetsWithinTolerance: stationArms.every((arm) =>
      arm.maximumOpeningTargetStationResidual01 <= 1e-12),
    allSourceResistanceReadbacksWithinTolerance: stationArms.every((arm) =>
      arm.maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl <= 1e-12),
    allExactPowerBalancesWithinTolerance: stationArms.every((arm) =>
      arm.maximumAbsolutePowerBalanceResidualMmHgMlPerSec <= 1e-7),
    allValveDissipationLedgersWithinTolerance: stationArms.every((arm) =>
      Math.abs(
        arm.compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl,
      ) <= 1e-6),
    allStationReconstructionResidualsWithinTolerance: stationArms.every((arm) =>
      arm.pressureStations.maximumAbsoluteResidualMmHg
        .exactPortReconstruction <= 1e-9
      && arm.pressureStations.maximumAbsoluteResidualMmHg
        .rawNodeReconstruction <= 1e-9),
    allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance:
      stationArms.every((arm) => {
        const readback =
          arm.pressureStations.exactEvaluatorProximalPortReadback;
        return readback.availableSampleCount === readback.totalSampleCount
          && readback.maximumAbsoluteReconstructionResidualMmHg !== null
          && readback.maximumAbsoluteReconstructionResidualMmHg <= 1e-12;
      }),
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_COMBINED_LOAD_ENVELOPE_ANALYSIS_CLAIM_V1,
  });
}

function measureStationArm(
  input: MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeInputV1,
): MainWireAorticOutflowV10LoadStationArmV1 {
  const result = input.run.periodicResult;
  const pressureStations = measureMainWireAorticOutflowV9PressureStationsV1(
    result,
    input.run,
    "garcia-energy-loss-plus-downstream-kinetic-flux",
  );
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined) throw new Error("V10 load station audit requires a beat");
  const params = result.valveResearchInput.valves.AoV;
  const zc = input.run.placementProfile!
    .upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  let maximumOpeningTargetStationResidual01 = 0;
  let maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl = 0;
  let maximumAbsolutePowerBalanceResidualMmHgMlPerSec = 0;
  let compatibilityDissipativeEnergyMmHgMl = 0;
  for (const sample of beat.samples) {
    const valve = sample.valveHydraulics.AoV;
    const localGradient = valve.pressureGradientMmHg - zc * valve.flowMlPerSec;
    const expectedTarget = evaluateMainWireValveOpeningTargetAndTangentV2(
      localGradient,
      params,
    ).openingTarget01;
    maximumOpeningTargetStationResidual01 = Math.max(
      maximumOpeningTargetStationResidual01,
      Math.abs(valve.openingTarget01 - expectedTarget),
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
  }
  const reconstructedValveIrreversibleEnergyMmHgMl =
    pressureStations.cycleEnergyMmHgMl.sourceValveLinearDissipation
    + pressureStations.cycleEnergyMmHgMl
      .geometryIrreversibleConvectiveDissipation;
  return Object.freeze({
    contextId: input.contextId,
    protocolIdentityHash: result.protocolIdentityHash,
    pressureStations,
    maximumOpeningTargetStationResidual01,
    maximumForwardSourceResistanceReadbackResidualMmHgSecPerMl,
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec,
    compatibilityMinusReconstructedValveIrreversibleEnergyMmHgMl:
      compatibilityDissipativeEnergyMmHgMl
      - reconstructedValveIrreversibleEnergyMmHgMl,
  });
}

function range(values: readonly number[]): NumericRangeV1 {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("V10 load station range requires finite values");
  }
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}
