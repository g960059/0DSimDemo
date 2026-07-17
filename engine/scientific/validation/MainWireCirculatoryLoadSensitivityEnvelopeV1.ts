import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1_ID,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1,
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  type MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
  type MainWireNormalAdultFiveWallPeriodicSummaryV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_ID =
  "main-wire-circulatory-load-sensitivity-envelope-v1" as const;

export const MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_PROTOCOL_V1 =
  Object.freeze({
    protocolId: MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_ID,
    protocolVersion: "1.0.0" as const,
    pointSetId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1_ID,
    pointOrder:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1,
    fixedModelConfiguration: Object.freeze({
      heartRateBpm: 60 as const,
      totalBloodVolumeOwner:
        "main-wire-normal-adult-blood-volume-operating-point-v1" as const,
      laSlsMode: "on" as const,
      commonPericardiumMode: "on" as const,
      commonPericardiumCase: "healthy-slack" as const,
      valvePreset: "healthy-baseline" as const,
      initialization: "independent-fixed-tbv-canonical-cold-start" as const,
    }),
    design: Object.freeze({
      oneFactorAtATime: true as const,
      lowAndHighResistanceScalesAreReciprocal: true as const,
      responseDeltasReferenceBaseline: true as const,
      parameterSearchOrOptimization: false as const,
      postHocAcceptanceThresholds: false as const,
    }),
    points: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINTS_V1,
  });

export type MainWireCirculatoryLoadSensitivityEnvelopeOptionsV1 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
}>;

export type MainWireCirculatoryLoadCycleMetricsV1 = Readonly<{
  availability: "available" | "no-complete-cycle";
  leftVentricularEndDiastolicVolumeMl: number | null;
  leftVentricularEndSystolicVolumeMl: number | null;
  leftVentricularEjectionFraction01: number | null;
  rightVentricularEndDiastolicVolumeMl: number | null;
  rightVentricularEndSystolicVolumeMl: number | null;
  rightVentricularEjectionFraction01: number | null;
  netAorticStrokeVolumeMl: number | null;
  netAorticCardiacOutputLPerMin: number | null;
  cardiacIndexLPerMinPerM2: number | null;
  aorticSystolicPressureMmHg: number | null;
  aorticDiastolicPressureMmHg: number | null;
  aorticMeanPressureMmHg: number | null;
  pulmonaryArterySystolicPressureMmHg: number | null;
  pulmonaryArteryDiastolicPressureMmHg: number | null;
  pulmonaryArteryMeanPressureMmHg: number | null;
  leftAtrialMeanPressureMmHg: number | null;
  rightAtrialMeanPressureMmHg: number | null;
  pulmonaryVenousMeanPressureMmHg: number | null;
  maximumMechanicsResidualNorm: number | null;
  maximumCirculationScaledResidualInfinityNorm: number | null;
  maximumAbsoluteContinuityResidualMl: number | null;
  maximumAbsoluteTotalBloodVolumeErrorMl: number | null;
}>;

type DeltaMetricId = Exclude<
  keyof MainWireCirculatoryLoadCycleMetricsV1,
  "availability"
>;

export type MainWireCirculatoryLoadResponseDeltaV1 = Readonly<{
  baselinePointId: "baseline";
  values: Readonly<Record<DeltaMetricId, number | null>>;
  interpretation: Readonly<{
    finiteDifferenceOnly: true;
    directionOrMagnitudeAcceptanceApplied: false;
    causalIsolationBeyondOneFactorAtATimeClaimed: false;
  }>;
}>;

export type MainWireCirculatoryLoadSensitivityRunV1 = Readonly<{
  point: MainWireNormalAdultFiveWallCirculatoryLoadPointV1;
  pointDefinitionSha256: string;
  resolvedRuntime: NonCoronaryCirculationRuntimeParamsV1;
  resolvedRuntimeSha256: string;
  runnerProtocolIdentityHash: string;
  runnerCirculationRuntimeStableHash: string;
  initializationAudit:
    MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"];
  outcome: Readonly<{
    integrationCompletedWithoutFailure: boolean;
    terminationReason:
      MainWireNormalAdultFiveWallPeriodicResultV1["terminationReason"];
    completedBeatCount: number;
    periodicSteadyStateClaimed: boolean;
    periodicityStatus:
      MainWireNormalAdultFiveWallPeriodicResultV1["periodicity"]["status"];
    failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"];
  }>;
  cycleMetrics: MainWireCirculatoryLoadCycleMetricsV1;
  responseDeltaFromBaseline: MainWireCirculatoryLoadResponseDeltaV1;
}>;

export type MainWireCirculatoryLoadSensitivityEnvelopeV1 = Readonly<{
  envelopeId: typeof MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_ID;
  schemaVersion: 1;
  digestSemantics: "sha256-canonical-json";
  protocol: typeof MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_PROTOCOL_V1;
  protocolSha256: string;
  requestedNumerics: Readonly<{
    dtSec: number;
    maximumBeatCount: number | null;
  }>;
  runs: readonly MainWireCirculatoryLoadSensitivityRunV1[];
  claim: Readonly<{
    researchOnly: true;
    authoritativeFiveWallTransactionReused: true;
    secondBackendIntroduced: false;
    eachPointStartedFromIndependentCanonicalColdState: true;
    warmStartAcrossPointsApplied: false;
    totalBloodVolumePerturbed: false;
    heartRatePerturbed: false;
    inotropyOrLusitropyPerturbed: false;
    resistanceIsOnlyPerturbedOwner: true;
    arbitraryParameterPatchAccepted: false;
    parameterSearchOrFittingPerformed: false;
    directionalAcceptanceThresholdApplied: false;
    clinicalOrPatientSpecificClaim: false;
  }>;
  envelopeSha256: string;
}>;

type EnvelopePayload = Omit<
  MainWireCirculatoryLoadSensitivityEnvelopeV1,
  "envelopeSha256"
>;

const METRIC_IDS = Object.freeze([
  "leftVentricularEndDiastolicVolumeMl",
  "leftVentricularEndSystolicVolumeMl",
  "leftVentricularEjectionFraction01",
  "rightVentricularEndDiastolicVolumeMl",
  "rightVentricularEndSystolicVolumeMl",
  "rightVentricularEjectionFraction01",
  "netAorticStrokeVolumeMl",
  "netAorticCardiacOutputLPerMin",
  "cardiacIndexLPerMinPerM2",
  "aorticSystolicPressureMmHg",
  "aorticDiastolicPressureMmHg",
  "aorticMeanPressureMmHg",
  "pulmonaryArterySystolicPressureMmHg",
  "pulmonaryArteryDiastolicPressureMmHg",
  "pulmonaryArteryMeanPressureMmHg",
  "leftAtrialMeanPressureMmHg",
  "rightAtrialMeanPressureMmHg",
  "pulmonaryVenousMeanPressureMmHg",
  "maximumMechanicsResidualNorm",
  "maximumCirculationScaledResidualInfinityNorm",
  "maximumAbsoluteContinuityResidualMl",
  "maximumAbsoluteTotalBloodVolumeErrorMl",
] as const satisfies readonly DeltaMetricId[]);

export async function runMainWireCirculatoryLoadSensitivityEnvelopeV1(
  options: MainWireCirculatoryLoadSensitivityEnvelopeOptionsV1,
): Promise<MainWireCirculatoryLoadSensitivityEnvelopeV1> {
  assertExactEnvelopeOptions(options);
  const protocolSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_PROTOCOL_V1,
  );
  const withoutDeltas = [] as Array<Omit<
    MainWireCirculatoryLoadSensitivityRunV1,
    "responseDeltaFromBaseline"
  >>;

  for (const pointId of
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CIRCULATORY_LOAD_POINT_IDS_V1) {
    const point = resolveMainWireNormalAdultFiveWallCirculatoryLoadPointV1(
      pointId,
    );
    const runtime =
      resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(pointId);
    const result =
      runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
        options,
        pointId,
      );
    const runtimeStableHash = stableHash(sanitizeForStableHash(runtime));
    if (
      result.protocolComponentHashes.circulationRuntimeStableHash
        !== runtimeStableHash
    ) {
      throw new Error(
        `resolved load runtime drifted from runner identity at ${pointId}`,
      );
    }
    const summary = summarizeIfComplete(result);
    withoutDeltas.push(Object.freeze({
      point,
      pointDefinitionSha256: await sha256CanonicalJsonHex(point),
      resolvedRuntime: runtime,
      resolvedRuntimeSha256: await sha256CanonicalJsonHex(runtime),
      runnerProtocolIdentityHash: result.protocolIdentityHash,
      runnerCirculationRuntimeStableHash:
        runtimeStableHash,
      initializationAudit: result.initializationAudit,
      outcome: Object.freeze({
        integrationCompletedWithoutFailure:
          result.integrationCompletedWithoutFailure,
        terminationReason: result.terminationReason,
        completedBeatCount: result.completedBeatCount,
        periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
        periodicityStatus: result.periodicity.status,
        failure: result.failure,
      }),
      cycleMetrics: measureCycleMetrics(result, summary),
    }));
  }

  const baseline = withoutDeltas.find((run) => run.point.pointId === "baseline");
  if (baseline === undefined) throw new Error("load sensitivity baseline is missing");
  const runs = Object.freeze(withoutDeltas.map((run) => Object.freeze({
    ...run,
    responseDeltaFromBaseline: responseDelta(
      run.cycleMetrics,
      baseline.cycleMetrics,
    ),
  })));
  const payload = Object.freeze({
    envelopeId: MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_ENVELOPE_V1_ID,
    schemaVersion: 1 as const,
    digestSemantics: "sha256-canonical-json" as const,
    protocol: MAIN_WIRE_CIRCULATORY_LOAD_SENSITIVITY_PROTOCOL_V1,
    protocolSha256,
    requestedNumerics: Object.freeze({
      dtSec: options.dtSec,
      maximumBeatCount: options.maximumBeatCount ?? null,
    }),
    runs,
    claim: Object.freeze({
      researchOnly: true as const,
      authoritativeFiveWallTransactionReused: true as const,
      secondBackendIntroduced: false as const,
      eachPointStartedFromIndependentCanonicalColdState: true as const,
      warmStartAcrossPointsApplied: false as const,
      totalBloodVolumePerturbed: false as const,
      heartRatePerturbed: false as const,
      inotropyOrLusitropyPerturbed: false as const,
      resistanceIsOnlyPerturbedOwner: true as const,
      arbitraryParameterPatchAccepted: false as const,
      parameterSearchOrFittingPerformed: false as const,
      directionalAcceptanceThresholdApplied: false as const,
      clinicalOrPatientSpecificClaim: false as const,
    }),
  }) satisfies EnvelopePayload;
  return Object.freeze({
    ...payload,
    envelopeSha256: await sha256CanonicalJsonHex(payload),
  });
}

function summarizeIfComplete(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicSummaryV1 | null {
  const complete = result.retainedCompleteBeats.at(-1);
  if (complete === undefined || complete.samples.length !== result.stepsPerBeat) {
    return null;
  }
  return summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(result);
}

function measureCycleMetrics(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  summary: MainWireNormalAdultFiveWallPeriodicSummaryV1 | null,
): MainWireCirculatoryLoadCycleMetricsV1 {
  if (summary === null) return unavailableMetrics();
  const samples = result.retainedCompleteBeats.at(-1)!.samples;
  const chamberVolume = summary.ranges.chamberVolumeMl;
  return Object.freeze({
    availability: "available" as const,
    leftVentricularEndDiastolicVolumeMl: chamberVolume.LV.maximum,
    leftVentricularEndSystolicVolumeMl: chamberVolume.LV.minimum,
    leftVentricularEjectionFraction01:
      summary.hemodynamics.leftVentricularEjectionFraction01,
    rightVentricularEndDiastolicVolumeMl: chamberVolume.RV.maximum,
    rightVentricularEndSystolicVolumeMl: chamberVolume.RV.minimum,
    rightVentricularEjectionFraction01:
      summary.hemodynamics.rightVentricularEjectionFraction01,
    netAorticStrokeVolumeMl: summary.hemodynamics.netAorticStrokeVolumeMl,
    netAorticCardiacOutputLPerMin:
      summary.hemodynamics.netAorticCardiacOutputLPerMin,
    cardiacIndexLPerMinPerM2:
      summary.hemodynamics.cardiacIndexLPerMinPerM2,
    aorticSystolicPressureMmHg:
      summary.ranges.absolutePressureMmHg.Ao.maximum,
    aorticDiastolicPressureMmHg:
      summary.ranges.absolutePressureMmHg.Ao.minimum,
    aorticMeanPressureMmHg:
      summary.hemodynamics.meanAorticAbsolutePressureMmHg,
    pulmonaryArterySystolicPressureMmHg:
      summary.ranges.absolutePressureMmHg.PA.maximum,
    pulmonaryArteryDiastolicPressureMmHg:
      summary.ranges.absolutePressureMmHg.PA.minimum,
    pulmonaryArteryMeanPressureMmHg: mean(samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.PA)),
    leftAtrialMeanPressureMmHg: mean(samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.LA)),
    rightAtrialMeanPressureMmHg: mean(samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.RA)),
    pulmonaryVenousMeanPressureMmHg: mean(samples.map((sample) =>
      sample.nodeAbsolutePressureMmHg.PVein)),
    maximumMechanicsResidualNorm:
      summary.residualMaxima.mechanicsResidualNorm,
    maximumCirculationScaledResidualInfinityNorm:
      summary.residualMaxima.circulationScaledResidualInfinityNorm,
    maximumAbsoluteContinuityResidualMl:
      summary.residualMaxima.absoluteContinuityResidualMl,
    maximumAbsoluteTotalBloodVolumeErrorMl:
      summary.residualMaxima.absoluteTotalBloodVolumeErrorMl,
  });
}

function unavailableMetrics(): MainWireCirculatoryLoadCycleMetricsV1 {
  return Object.freeze(Object.fromEntries([
    ["availability", "no-complete-cycle"],
    ...METRIC_IDS.map((metricId) => [metricId, null] as const),
  ]) as MainWireCirculatoryLoadCycleMetricsV1);
}

function responseDelta(
  point: MainWireCirculatoryLoadCycleMetricsV1,
  baseline: MainWireCirculatoryLoadCycleMetricsV1,
): MainWireCirculatoryLoadResponseDeltaV1 {
  return Object.freeze({
    baselinePointId: "baseline" as const,
    values: Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) => {
      const pointValue = point[metricId];
      const baselineValue = baseline[metricId];
      return [
        metricId,
        pointValue === null || baselineValue === null
          ? null
          : pointValue - baselineValue,
      ];
    }))) as Readonly<Record<DeltaMetricId, number | null>>,
    interpretation: Object.freeze({
      finiteDifferenceOnly: true as const,
      directionOrMagnitudeAcceptanceApplied: false as const,
      causalIsolationBeyondOneFactorAtATimeClaimed: false as const,
    }),
  });
}

function assertExactEnvelopeOptions(
  options: MainWireCirculatoryLoadSensitivityEnvelopeOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("load sensitivity envelope options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(`load sensitivity envelope rejects unsupported field: ${key}`);
    }
  }
}

function mean(values: readonly number[]): number {
  if (values.length === 0) throw new Error("cannot average an empty cycle");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
