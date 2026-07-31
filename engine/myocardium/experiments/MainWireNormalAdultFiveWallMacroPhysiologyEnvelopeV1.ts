import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1_ID,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyPointsV1";
import {
  runMainWireNormalAdultFiveWallMacroPhysiologyResearchPointV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_ENVELOPE_V1_ID =
  "main-wire-normal-adult-five-wall-macro-physiology-envelope-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1 =
  Object.freeze({
    protocolId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_ENVELOPE_V1_ID,
    protocolVersion: "1.0.0" as const,
    pointSetId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1_ID,
    pointOrder:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1,
    points: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINTS_V1,
    fixedConfiguration: Object.freeze({
      heartRateBpm: 60 as const,
      commonPericardiumMode: "on" as const,
      commonPericardiumCase: "healthy-slack" as const,
      valveResearchInput: "healthy-baseline" as const,
      laSlsMode: "on" as const,
      circulationRuntime: "normal-adult-main-wire-baseline" as const,
      initialization: "independent-point-specific-fixed-tbv-cold-start" as const,
    }),
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      oneFactorAtATime: true as const,
      parameterSearchOrFitting: false as const,
      wholeLoopDirectionsAreDescriptive: true as const,
      directionOrMagnitudeAcceptanceApplied: false as const,
      numericalConservationAndIdentityAreHardGates: true as const,
      terminalRetainedCycleTotalBloodVolumeConservationHardGate: true as const,
      wholeRunTotalBloodVolumeConservationClaimed: false as const,
      constitutiveOrderingIsHardTestedAtFixedInput: true as const,
    }),
  });

export type MainWireMacroPhysiologyMetricIdV1 =
  | "leftVentricularEndDiastolicVolumeMl"
  | "leftVentricularEndSystolicVolumeMl"
  | "leftVentricularEjectionFraction01"
  | "rightVentricularEndDiastolicVolumeMl"
  | "rightVentricularEndSystolicVolumeMl"
  | "rightVentricularEjectionFraction01"
  | "netAorticCardiacOutputLPerMin"
  | "aorticMeanPressureMmHg"
  | "aorticSystolicPressureMmHg"
  | "pulmonaryArteryMeanPressureMmHg"
  | "pulmonaryArterySystolicPressureMmHg"
  | "leftAtrialMeanPressureMmHg"
  | "rightAtrialMeanPressureMmHg"
  | "pulmonaryVenousMeanPressureMmHg"
  | "maximumPericardialExcessPressureMmHg"
  | "fixedTotalBloodVolumeMl";

export type MainWireMacroPhysiologyCycleMetricsV1 = Readonly<{
  availability: "available" | "no-complete-cycle";
  values: Readonly<Record<MainWireMacroPhysiologyMetricIdV1, number | null>>;
}>;

export type MainWireMacroPhysiologyDescriptiveDeltaV1 = Readonly<{
  values: Readonly<Record<MainWireMacroPhysiologyMetricIdV1, number | null>>;
  directionByMetric: Readonly<Record<
    MainWireMacroPhysiologyMetricIdV1,
    "increase" | "decrease" | "no-change" | "unavailable"
  >>;
  expectedQualitativeResponse: readonly string[];
  directionOrMagnitudeAcceptanceApplied: false;
}>;

export type MainWireMacroPhysiologyEnvelopeRunV1 = Readonly<{
  point: MainWireNormalAdultFiveWallMacroPhysiologyPointV1;
  pointDefinitionStableHash: string;
  configurationRole: "fixed-research-point";
  resolvedProviderIdentity:
    MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1[
      "resolvedProviderIdentity"
    ];
  resolvedBloodVolumeIdentity:
    MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1[
      "resolvedBloodVolumeIdentity"
    ];
  resolvedMaterialPoint:
    MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1["materialPoint"];
  resolvedStressedVenousVolumePoint:
    MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1[
      "stressedVenousVolumePoint"
    ];
  runnerProtocolIdentityHash: string;
  runnerProtocolComponentHashes:
    MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1[
      "periodicResult"
    ]["protocolComponentHashes"];
  resolvedAssemblyStableHash: string;
  outcome: Readonly<{
    integrationCompletedWithoutFailure: boolean;
    terminationReason: string;
    completedBeatCount: number;
    period1Converged: boolean;
    periodicityStatus: string;
  }>;
  initializationEvidence: Readonly<{
    initialization: "canonical";
    independentColdStart: true;
    warmStartApplied: false;
    totalBloodVolumeDifferenceMl: number;
    chamberVolumesChangedFromPointColdState: boolean;
    mechanicsColdStateChangedFromPointColdState: boolean;
  }>;
  numericalHardGates: Readonly<{
    integrationCompleted: boolean;
    period1Converged: boolean;
    identityMatched: boolean;
    fixedTotalBloodVolumeConservationScope:
      "terminal-retained-complete-cycle";
    fixedTotalBloodVolumeConserved: boolean;
    maximumAbsoluteTotalBloodVolumeErrorMl: number | null;
    allPassed: boolean;
  }>;
  cycleMetrics: MainWireMacroPhysiologyCycleMetricsV1;
  descriptiveDeltaFromBaseline: MainWireMacroPhysiologyDescriptiveDeltaV1;
}>;

export type MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1 = Readonly<{
  envelopeId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_ENVELOPE_V1_ID;
  schemaVersion: 1;
  protocol: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1;
  protocolStableHash: string;
  requestedNumerics: Readonly<{
    dtSec: number;
    maximumBeatCount: number | null;
  }>;
  runs: readonly MainWireMacroPhysiologyEnvelopeRunV1[];
  hardGateSummary: Readonly<{
    passedPointCount: number;
    failedPointCount: number;
    allPointsPassed: boolean;
  }>;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1.claim;
}>;

const METRIC_IDS = Object.freeze([
  "leftVentricularEndDiastolicVolumeMl",
  "leftVentricularEndSystolicVolumeMl",
  "leftVentricularEjectionFraction01",
  "rightVentricularEndDiastolicVolumeMl",
  "rightVentricularEndSystolicVolumeMl",
  "rightVentricularEjectionFraction01",
  "netAorticCardiacOutputLPerMin",
  "aorticMeanPressureMmHg",
  "aorticSystolicPressureMmHg",
  "pulmonaryArteryMeanPressureMmHg",
  "pulmonaryArterySystolicPressureMmHg",
  "leftAtrialMeanPressureMmHg",
  "rightAtrialMeanPressureMmHg",
  "pulmonaryVenousMeanPressureMmHg",
  "maximumPericardialExcessPressureMmHg",
  "fixedTotalBloodVolumeMl",
] as const satisfies readonly MainWireMacroPhysiologyMetricIdV1[]);

export function runMainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
): MainWireNormalAdultFiveWallMacroPhysiologyEnvelopeV1 {
  const rawRuns = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_POINT_IDS_V1
    .map((pointId) => runPoint(options, pointId));
  const baseline = rawRuns.find((entry) => entry.point.pointId === "baseline");
  if (baseline === undefined) throw new Error("macro physiology baseline is missing");
  const runs = Object.freeze(rawRuns.map((entry) => Object.freeze({
    ...entry,
    descriptiveDeltaFromBaseline: descriptiveDelta(
      entry.point,
      entry.cycleMetrics,
      baseline.cycleMetrics,
    ),
  })));
  const passedPointCount = runs.filter((run) =>
    run.numericalHardGates.allPassed).length;
  return Object.freeze({
    envelopeId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_ENVELOPE_V1_ID,
    schemaVersion: 1 as const,
    protocol: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1,
    protocolStableHash: stableHash(sanitizeForStableHash(
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1,
    )),
    requestedNumerics: Object.freeze({
      dtSec: options.dtSec,
      maximumBeatCount: options.maximumBeatCount ?? null,
    }),
    runs,
    hardGateSummary: Object.freeze({
      passedPointCount,
      failedPointCount: runs.length - passedPointCount,
      allPointsPassed: passedPointCount === runs.length,
    }),
    claim:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_MACRO_PHYSIOLOGY_PROTOCOL_V1.claim,
  });
}

function runPoint(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
): Omit<MainWireMacroPhysiologyEnvelopeRunV1, "descriptiveDeltaFromBaseline"> {
  const run = runMainWireNormalAdultFiveWallMacroPhysiologyResearchPointV1(
    options,
    pointId,
  );
  const result = run.periodicResult;
  const summary = result.retainedCompleteBeats.at(-1)?.samples.length
      === result.stepsPerBeat
    ? summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result)
    : null;
  const maximumAbsoluteTotalBloodVolumeErrorMl = summary === null
    ? null
    : summary.residualMaxima.absoluteTotalBloodVolumeErrorMl;
  const identityMatched =
    stableHash(sanitizeForStableHash(result.protocolIdentity))
      === result.protocolIdentityHash
    && stableHash(sanitizeForStableHash(
      result.protocolIdentity.mechanicsProvider,
    )) === result.protocolComponentHashes.mechanicsProviderMetadataStableHash
    && stableHash(sanitizeForStableHash(
      result.protocolIdentity.bloodVolumeOperatingPoint,
    )) === result.protocolComponentHashes.bloodVolumeOperatingPointStableHash
    && result.protocolIdentity.mechanicsProvider.providerId
      === run.resolvedProviderIdentity.providerId
    && result.protocolIdentity.mechanicsProvider.parameterSetId
      === run.resolvedProviderIdentity.parameterSetId
    && result.protocolIdentity.mechanicsProvider.parameterIdentityHash
      === run.resolvedProviderIdentity.parameterIdentityHash
    && result.protocolIdentity.mechanicsProvider.stateSchemaVersion
      === run.resolvedProviderIdentity.stateSchemaVersion
    && stableHash(sanitizeForStableHash(
      result.protocolIdentity.bloodVolumeOperatingPoint,
    )) === stableHash(sanitizeForStableHash(run.resolvedBloodVolumeIdentity))
    && run.materialPoint.pointId === run.point.materialPointId
    && run.stressedVenousVolumePoint.pointId
      === run.point.stressedVenousVolumePointId;
  const fixedTotalBloodVolumeConserved =
    maximumAbsoluteTotalBloodVolumeErrorMl !== null
    && maximumAbsoluteTotalBloodVolumeErrorMl <= 1e-8;
  const numericalHardGates = Object.freeze({
    integrationCompleted: result.integrationCompletedWithoutFailure,
    period1Converged: result.periodicSteadyStateClaimed,
    identityMatched,
    fixedTotalBloodVolumeConservationScope:
      "terminal-retained-complete-cycle" as const,
    fixedTotalBloodVolumeConserved,
    maximumAbsoluteTotalBloodVolumeErrorMl,
    allPassed: result.integrationCompletedWithoutFailure
      && result.periodicSteadyStateClaimed
      && identityMatched
      && fixedTotalBloodVolumeConserved,
  });
  return Object.freeze({
    point: run.point,
    pointDefinitionStableHash: stableHash(sanitizeForStableHash(run.point)),
    configurationRole: run.configurationRole,
    resolvedProviderIdentity: run.resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: run.resolvedBloodVolumeIdentity,
    resolvedMaterialPoint: run.materialPoint,
    resolvedStressedVenousVolumePoint: run.stressedVenousVolumePoint,
    runnerProtocolIdentityHash: result.protocolIdentityHash,
    runnerProtocolComponentHashes: result.protocolComponentHashes,
    resolvedAssemblyStableHash: stableHash(sanitizeForStableHash({
      point: run.point,
      provider: run.resolvedProviderIdentity,
      bloodVolume: run.resolvedBloodVolumeIdentity,
      materialPoint: run.materialPoint,
      stressedVenousVolumePoint: run.stressedVenousVolumePoint,
    })),
    outcome: Object.freeze({
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
      terminationReason: result.terminationReason,
      completedBeatCount: result.completedBeatCount,
      period1Converged: result.periodicSteadyStateClaimed,
      periodicityStatus: result.periodicity.status,
    }),
    initializationEvidence: Object.freeze({
      initialization: "canonical" as const,
      independentColdStart: true as const,
      warmStartApplied: false as const,
      totalBloodVolumeDifferenceMl:
        result.initializationAudit.totalBloodVolumeDifferenceMl,
      chamberVolumesChangedFromPointColdState:
        result.initializationAudit.chamberVolumesChanged,
      mechanicsColdStateChangedFromPointColdState:
        result.initializationAudit.mechanicsColdStateFingerprintChanged,
    }),
    numericalHardGates,
    cycleMetrics: cycleMetrics(run, summary),
  });
}

function cycleMetrics(
  run: MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1,
  summary: ReturnType<
    typeof summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1
  > | null,
): MainWireMacroPhysiologyCycleMetricsV1 {
  if (summary === null) return unavailableMetrics();
  const samples = run.periodicResult.retainedCompleteBeats.at(-1)!.samples;
  return Object.freeze({
    availability: "available" as const,
    values: Object.freeze({
      leftVentricularEndDiastolicVolumeMl:
        summary.ranges.chamberVolumeMl.LV.maximum,
      leftVentricularEndSystolicVolumeMl:
        summary.ranges.chamberVolumeMl.LV.minimum,
      leftVentricularEjectionFraction01:
        summary.hemodynamics.leftVentricularEjectionFraction01,
      rightVentricularEndDiastolicVolumeMl:
        summary.ranges.chamberVolumeMl.RV.maximum,
      rightVentricularEndSystolicVolumeMl:
        summary.ranges.chamberVolumeMl.RV.minimum,
      rightVentricularEjectionFraction01:
        summary.hemodynamics.rightVentricularEjectionFraction01,
      netAorticCardiacOutputLPerMin:
        summary.hemodynamics.netAorticCardiacOutputLPerMin,
      aorticMeanPressureMmHg:
        summary.hemodynamics.meanAorticAbsolutePressureMmHg,
      aorticSystolicPressureMmHg:
        summary.ranges.absolutePressureMmHg.Ao.maximum,
      pulmonaryArteryMeanPressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.PA)),
      pulmonaryArterySystolicPressureMmHg:
        summary.ranges.absolutePressureMmHg.PA.maximum,
      leftAtrialMeanPressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.LA)),
      rightAtrialMeanPressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.RA)),
      pulmonaryVenousMeanPressureMmHg: mean(samples.map((sample) =>
        sample.nodeAbsolutePressureMmHg.PVein)),
      maximumPericardialExcessPressureMmHg:
        summary.ranges.commonPericardium.excessPressureMmHg.maximum,
      fixedTotalBloodVolumeMl:
        run.resolvedBloodVolumeIdentity.fixedTotalBloodVolumeMl,
    }),
  });
}

function unavailableMetrics(): MainWireMacroPhysiologyCycleMetricsV1 {
  return Object.freeze({
    availability: "no-complete-cycle" as const,
    values: Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) =>
      [metricId, null]))) as Readonly<Record<
      MainWireMacroPhysiologyMetricIdV1,
      null
    >>,
  });
}

function descriptiveDelta(
  point: MainWireNormalAdultFiveWallMacroPhysiologyPointV1,
  current: MainWireMacroPhysiologyCycleMetricsV1,
  baseline: MainWireMacroPhysiologyCycleMetricsV1,
): MainWireMacroPhysiologyDescriptiveDeltaV1 {
  const values = Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) => {
    const currentValue = current.values[metricId];
    const baselineValue = baseline.values[metricId];
    return [metricId, currentValue === null || baselineValue === null
      ? null
      : currentValue - baselineValue];
  }))) as Readonly<Record<MainWireMacroPhysiologyMetricIdV1, number | null>>;
  const directionByMetric = Object.freeze(Object.fromEntries(METRIC_IDS.map(
    (metricId) => {
      const delta = values[metricId];
      return [metricId, delta === null
        ? "unavailable"
        : Math.abs(delta) <= 1e-12
          ? "no-change"
          : delta > 0 ? "increase" : "decrease"];
    },
  ))) as MainWireMacroPhysiologyDescriptiveDeltaV1["directionByMetric"];
  return Object.freeze({
    values,
    directionByMetric,
    expectedQualitativeResponse: expectedQualitativeResponse(point),
    directionOrMagnitudeAcceptanceApplied: false as const,
  });
}

function expectedQualitativeResponse(
  point: MainWireNormalAdultFiveWallMacroPhysiologyPointV1,
): readonly string[] {
  if (point.level === "baseline") return Object.freeze([]);
  const sign = point.level === "high" ? "higher" : "lower";
  switch (point.axis) {
    case "common-ventricular-passive-material":
      return Object.freeze([
        `${sign} fixed-input passive energy, stress, and tangent`,
        point.level === "high"
          ? "likely lower ventricular EDV with potentially higher filling pressures"
          : "likely higher ventricular EDV with potentially lower filling pressures",
        "ESV, EF, and cardiac output are coupling-dependent",
      ]);
    case "common-ventricular-land-tref":
      return Object.freeze([
        `${sign} fixed-state Land active stress and tangent`,
        point.level === "high"
          ? "likely lower ESV and higher EF, stroke volume, and peak pressure"
          : "likely higher ESV and lower EF, stroke volume, and peak pressure",
        "EDV and filling-pressure redistribution are coupling-dependent",
      ]);
    case "stressed-venous-volume":
      return Object.freeze([
        `${sign} fixed TBV and shared SV/VC transmural pressure offset`,
        point.level === "high"
          ? "likely higher EDV and atrial or venous pressure"
          : "likely lower EDV and atrial or venous pressure",
        "pericardial engagement may blunt cardiac-output direction",
      ]);
    case "baseline":
      return Object.freeze([]);
  }
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
