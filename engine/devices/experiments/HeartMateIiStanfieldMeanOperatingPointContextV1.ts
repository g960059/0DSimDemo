import { mechanicalSupportPresetV1 } from "@/engine/devices/presetsV1";
import { evaluateRotaryPumpV1 } from "@/engine/devices/rotaryPumpV1";
import type {
  HydraulicSegmentV1,
  RotaryPumpDeviceConfigV1,
} from "@/engine/devices/typesV1";

export const HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_V1_ID =
  "heartmate-ii-stanfield-mean-operating-point-context-v1" as const;

export const HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_CLAIM_V1 =
  Object.freeze({
    purpose:
      "held-out-mean-operating-point-context-with-explicit-pressure-station-ambiguity" as const,
    equationParametersInspectedFrom:
      "Wang-Choi-HeartMate-II-construction-source-not-Stanfield" as const,
    independentContextSource:
      "Stanfield-and-Selzman-2013-DOI-10.1115/1.4023525-Table-3-Axial-1" as const,
    comparedDevice: "HeartMate-II-Axial-1-at-9000-rpm" as const,
    comparedQuantities:
      "reported-cycle-mean-pressure-differential-and-flow" as const,
    projections: Object.freeze({
      pumpInternalPressureStation:
        "internal-pump-linear-H-Q-law-with-zero-external-segment-resistance" as const,
      patientNodeWithConfiguredCannulae:
        "internal-pump-law-plus-configured-drainage-and-return-linear-resistance" as const,
    }),
    inertanceContributionToPeriodicMean:
      "zero-only-under-a-closed-periodic-flow-cycle" as const,
    reportedStandardDeviationUse:
      "descriptive-membership-only-not-a-confidence-interval-repeat-uncertainty-or-acceptance-limit" as const,
    sourcePressureDescription:
      "paper-reports-pump-preload-inflow-and-afterload-outflow-fluid-transducers" as const,
    exactSourceTransducerToModelStationMappingAvailable: false as const,
    measurementStationMatched: false as const,
    waveformCompared: false as const,
    pulsatilityIndexCompared: false as const,
    loopTraversalCompared: false as const,
    parameterFittingApplied: false as const,
    independentComponentValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    patientValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });

export const STANFIELD_HEARTMATE_II_AXIAL_1_TABLE_3_CONTEXT_V1 =
  Object.freeze([
    operatingPoint("normotensive", 4.8, 1.6, 55, 24, 0.96),
    operatingPoint("hypertensive", 3.4, 2.5, 70, 38, 2.01),
    operatingPoint("hypotensive", 5.0, 1.3, 53, 19, 0.74),
  ]);

type StanfieldConditionV1 =
  (typeof STANFIELD_HEARTMATE_II_AXIAL_1_TABLE_3_CONTEXT_V1)[number]["condition"];

export type HeartMateIiStanfieldMeanProjectionV1 = Readonly<{
  projectionId: "pump-internal" | "patient-node-with-configured-cannulae";
  predictedMeanFlowLMin: number;
  signedDifferenceFromReportedMeanLMin: number;
  absoluteDifferenceFromReportedMeanLMin: number;
  differenceInReportedFlowStandardDeviations: number;
  descriptivelyWithinReportedMeanPlusOrMinusOneSd: boolean;
  inletSuctionResistanceMmHgSecPerMl: number;
  inletCollapseActive: boolean;
  flowLimitPressureReactionMmHg: number;
  hydraulicResidualMmHg: number;
}>;

export type HeartMateIiStanfieldMeanOperatingPointV1 = Readonly<{
  condition: StanfieldConditionV1;
  speedRpm: 9000;
  reportedMeanFlowLMin: number;
  reportedFlowStandardDeviationLMin: number;
  reportedMeanPressureDifferentialMmHg: number;
  reportedPressureDifferentialStandardDeviationMmHg: number;
  reportedFlowPulsatilityIndex: number;
  pumpInternal: HeartMateIiStanfieldMeanProjectionV1;
  patientNodeWithConfiguredCannulae:
    HeartMateIiStanfieldMeanProjectionV1;
}>;

export type HeartMateIiStanfieldMeanOperatingPointContextResultV1 =
  Readonly<{
    experimentId:
      typeof HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_V1_ID;
    source: Readonly<{
      citation:
        "Stanfield JR, Selzman CH. J Biomech Eng. 2013;135:034505";
      doi: "10.1115/1.4023525";
      table: "Table 3, Axial 1 (HeartMate II)";
      mockLoopHeartRateBpm: 100;
      mockLoopSystemicComplianceMlPerMmHg: 0.5;
      replicateCount: 3;
      exactTransducerToModelStationMappingAvailable: false;
    }>;
    configuredModel: Readonly<{
      speedRpm: 9000;
      idealPumpHeadMmHg: number;
      internalLinearLossMmHgSecPerMl: number;
      configuredDrainageLinearResistanceMmHgSecPerMl: number;
      configuredReturnLinearResistanceMmHgSecPerMl: number;
      quadraticLossPresent: false;
    }>;
    operatingPoints: readonly HeartMateIiStanfieldMeanOperatingPointV1[];
    descriptiveOneSdMembershipCount: Readonly<{
      pumpInternal: number;
      patientNodeWithConfiguredCannulae: number;
      denominator: 3;
    }>;
    allCalculationsFiniteAndUnconstrained: boolean;
    measurementStationMatched: false;
    independentComponentValidationEstablished: false;
    physiologicalAcceptanceEstablished: false;
    releaseAcceptanceEstablished: false;
    claim:
      typeof HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_CLAIM_V1;
  }>;

const ZERO_SEGMENT: HydraulicSegmentV1 = Object.freeze({
  linearResistanceMmHgSecPerMl: 0,
  quadraticResistanceMmHgSec2PerMl2: 0,
});

export function runHeartMateIiStanfieldMeanOperatingPointContextV1():
HeartMateIiStanfieldMeanOperatingPointContextResultV1 {
  const patientNodeConfig = mechanicalSupportPresetV1("lvad-hmii-9000").lvad;
  if (patientNodeConfig.speedRpm !== 9_000
    || patientNodeConfig.curve.quadraticLossMmHgSec2PerMl2 !== 0
    || patientNodeConfig.drainage.quadraticResistanceMmHgSec2PerMl2 !== 0
    || patientNodeConfig.returnPath.quadraticResistanceMmHgSec2PerMl2 !== 0) {
    throw new Error("Stanfield context requires the declared linear 9000-rpm HMII profile");
  }
  const pumpInternalConfig: RotaryPumpDeviceConfigV1 = Object.freeze({
    ...patientNodeConfig,
    drainage: ZERO_SEGMENT,
    oxygenator: ZERO_SEGMENT,
    returnPath: ZERO_SEGMENT,
  });
  const operatingPoints = STANFIELD_HEARTMATE_II_AXIAL_1_TABLE_3_CONTEXT_V1
    .map((point) => Object.freeze({
      ...point,
      pumpInternal: projectAtReportedMeanHead(
        "pump-internal",
        pumpInternalConfig,
        point.reportedMeanPressureDifferentialMmHg,
        point.reportedMeanFlowLMin,
        point.reportedFlowStandardDeviationLMin,
      ),
      patientNodeWithConfiguredCannulae: projectAtReportedMeanHead(
        "patient-node-with-configured-cannulae",
        patientNodeConfig,
        point.reportedMeanPressureDifferentialMmHg,
        point.reportedMeanFlowLMin,
        point.reportedFlowStandardDeviationLMin,
      ),
    }));
  const projections = operatingPoints.flatMap((point) => [
    point.pumpInternal,
    point.patientNodeWithConfiguredCannulae,
  ]);
  const allCalculationsFiniteAndUnconstrained = projections.every(
    (projection) => Object.values(projection).every((value) =>
      typeof value !== "number" || Number.isFinite(value))
      && projection.inletSuctionResistanceMmHgSecPerMl === 0
      && projection.inletCollapseActive === false
      && projection.flowLimitPressureReactionMmHg === 0
      && Math.abs(projection.hydraulicResidualMmHg) <= 1e-10,
  );

  return Object.freeze({
    experimentId:
      HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_V1_ID,
    source: Object.freeze({
      citation:
        "Stanfield JR, Selzman CH. J Biomech Eng. 2013;135:034505" as const,
      doi: "10.1115/1.4023525" as const,
      table: "Table 3, Axial 1 (HeartMate II)" as const,
      mockLoopHeartRateBpm: 100 as const,
      mockLoopSystemicComplianceMlPerMmHg: 0.5 as const,
      replicateCount: 3 as const,
      exactTransducerToModelStationMappingAvailable: false as const,
    }),
    configuredModel: Object.freeze({
      speedRpm: 9_000 as const,
      idealPumpHeadMmHg: evaluateRotaryPumpV1(
        "LVAD",
        patientNodeConfig,
        { inletPressureMmHg: 10, outletPressureMmHg: 10, inletVolumeMl: 100 },
      ).idealPumpHeadMmHg,
      internalLinearLossMmHgSecPerMl:
        patientNodeConfig.curve.linearLossMmHgSecPerMl,
      configuredDrainageLinearResistanceMmHgSecPerMl:
        patientNodeConfig.drainage.linearResistanceMmHgSecPerMl,
      configuredReturnLinearResistanceMmHgSecPerMl:
        patientNodeConfig.returnPath.linearResistanceMmHgSecPerMl,
      quadraticLossPresent: false as const,
    }),
    operatingPoints: Object.freeze(operatingPoints),
    descriptiveOneSdMembershipCount: Object.freeze({
      pumpInternal: operatingPoints.filter((point) =>
        point.pumpInternal.descriptivelyWithinReportedMeanPlusOrMinusOneSd)
        .length,
      patientNodeWithConfiguredCannulae: operatingPoints.filter((point) =>
        point.patientNodeWithConfiguredCannulae
          .descriptivelyWithinReportedMeanPlusOrMinusOneSd)
        .length,
      denominator: 3 as const,
    }),
    allCalculationsFiniteAndUnconstrained,
    measurementStationMatched: false as const,
    independentComponentValidationEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    claim: HEARTMATE_II_STANFIELD_MEAN_OPERATING_POINT_CONTEXT_CLAIM_V1,
  });
}

function projectAtReportedMeanHead(
  projectionId: HeartMateIiStanfieldMeanProjectionV1["projectionId"],
  config: RotaryPumpDeviceConfigV1,
  reportedMeanHeadMmHg: number,
  reportedMeanFlowLMin: number,
  reportedFlowSdLMin: number,
): HeartMateIiStanfieldMeanProjectionV1 {
  const evaluation = evaluateRotaryPumpV1("LVAD", config, {
    inletPressureMmHg: 10,
    outletPressureMmHg: 10 + reportedMeanHeadMmHg,
    inletVolumeMl: 100,
  });
  const signedDifference = evaluation.flowLMin - reportedMeanFlowLMin;
  return Object.freeze({
    projectionId,
    predictedMeanFlowLMin: evaluation.flowLMin,
    signedDifferenceFromReportedMeanLMin: signedDifference,
    absoluteDifferenceFromReportedMeanLMin: Math.abs(signedDifference),
    differenceInReportedFlowStandardDeviations:
      signedDifference / reportedFlowSdLMin,
    descriptivelyWithinReportedMeanPlusOrMinusOneSd:
      Math.abs(signedDifference) <= reportedFlowSdLMin,
    inletSuctionResistanceMmHgSecPerMl:
      evaluation.inletSuctionResistanceMmHgSecPerMl,
    inletCollapseActive: evaluation.inletCollapseActive,
    flowLimitPressureReactionMmHg: evaluation.flowLimitPressureReactionMmHg,
    hydraulicResidualMmHg: evaluation.hydraulicResidualMmHg,
  });
}

function operatingPoint(
  condition: "normotensive" | "hypertensive" | "hypotensive",
  reportedMeanFlowLMin: number,
  reportedFlowStandardDeviationLMin: number,
  reportedMeanPressureDifferentialMmHg: number,
  reportedPressureDifferentialStandardDeviationMmHg: number,
  reportedFlowPulsatilityIndex: number,
) {
  return Object.freeze({
    condition,
    speedRpm: 9_000 as const,
    reportedMeanFlowLMin,
    reportedFlowStandardDeviationLMin,
    reportedMeanPressureDifferentialMmHg,
    reportedPressureDifferentialStandardDeviationMmHg,
    reportedFlowPulsatilityIndex,
  });
}
