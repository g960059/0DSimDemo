import {
  measureLaPvReservoirConduitOrderV1,
  type LaPvReservoirConduitOrderV1,
} from "@/engine/mechanics2/diagnostics/LaPvReservoirConduitOrderV1";
import {
  measureLaPvTwoLobesV2,
  type LaPvLobeMeasurementV2,
  type LaPvMeasuredLobeV2,
} from "@/engine/mechanics2/diagnostics/LaPvLobeMeasurementV2";
import {
  assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  acceptedIntervalTimeWeightedMeanV1,
  backwardEulerEndpointIntegralV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import {
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV2,
  type MainWireNormalAdultFiveWallCycleDiagnosticsV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV2";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV3,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV3";
import {
  resolveMainWireNormalAdultFiveWallSelectedCycleContextV2,
  type MainWireNormalAdultFiveWallSelectedCycleContextV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallSelectedCycleContextV2";
import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV2,
  type MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V2_ID =
  "main-wire-normal-adult-five-wall-periodic-summary-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V2 =
  Object.freeze({
    input: "periodic-runner-retained-accepted-intervals" as const,
    selectedCycle: "last-retained-complete-beat" as const,
    acceptedIntervalQuadrature: "backward-Euler-endpoint" as const,
    nominalGridCountUsedForPhysicalIntegration: false as const,
    precedingDiagnosticFabricated: false as const,
    rawEndpointRangesAvailableWithoutPredecessor: true as const,
    differenceBasedPhysiologyRequiresRealPredecessor: true as const,
    addsDynamicState: false as const,
    changesPhysiologyOrMaterialParameters: false as const,
    parameterSearchOrTuning: false as const,
    timeSeriesSmoothingApplied: false as const,
    timeSeriesResamplingOrInterpolationApplied: false as const,
    piecewiseLinearPvGeometryInterpolationApplied: true as const,
    morphologyInterpretationRequiresPeriod1Convergence: true as const,
    timeStepRobustnessAssessedBySummary: false as const,
  });

type ChamberId = "LA" | "LV" | "RA" | "RV";
type FlowId = "MV" | "AoV" | "TV" | "PV" | "PVein_LA";
type AbsolutePressureId = "Ao" | "PA" | "PVein";
type ValveId = "MV" | "AoV" | "TV" | "PV";

export type MainWireNormalAdultFiveWallRangeV2 = Readonly<{
  minimum: number;
  maximum: number;
}>;

export type MainWireNormalAdultFiveWallAcceptedFlowLedgerV2 = Readonly<{
  quadrature: "backward-Euler-endpoint";
  durationSec: number;
  signedVolumeMl: number;
  forwardVolumeMl: number;
  reverseVolumeMl: number;
}>;

export type MainWireNormalAdultFiveWallCompactLobeV2 = Readonly<
  Omit<LaPvMeasuredLobeV2, "path"> & { pointCount: number }
>;

export type MainWireNormalAdultFiveWallCompactTwoLobesV2 =
  | Readonly<
    Omit<
      Extract<LaPvLobeMeasurementV2, { status: "measurable" }>,
      "aLobe" | "vLobe"
    > & {
      aLobe: MainWireNormalAdultFiveWallCompactLobeV2;
      vLobe: MainWireNormalAdultFiveWallCompactLobeV2;
    }
  >
  | Extract<LaPvLobeMeasurementV2, { status: "not-measurable" }>;

export type MainWireNormalAdultFiveWallCompactBranchOrderV2 = Readonly<
  Omit<LaPvReservoirConduitOrderV1, "probes">
>;

export type MainWireNormalAdultFiveWallJacobianWidthAuditV2 = Readonly<{
  nominalScaledStep: number;
  acceptedStepCount: number;
  nominalStepCount: number;
  alternateStepCount: number;
  histogram: readonly Readonly<{
    absoluteScaledStep: number;
    count: number;
    classification: "nominal" | "alternate";
  }>[];
}>;

type SelectedCycleReadbackV2 = Readonly<{
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  nominalGridCount: number;
  acceptedIntervalCount: number;
  minimumAcceptedDtSec: number;
  maximumAcceptedDtSec: number;
  acceptedEventCount: number;
  acceptedEvents:
    MainWireNormalAdultFiveWallSelectedCycleContextV2["acceptedEvents"];
  precedingAcceptedSampleAvailable: boolean;
  rangeBoundaryCoverage:
    | "real-predecessor-and-accepted-endpoints"
    | "accepted-endpoints-only";
  jacobianFiniteDifferenceWidthAudit:
    MainWireNormalAdultFiveWallJacobianWidthAuditV2;
}>;

type RawRangesV2 = Readonly<{
  boundaryCoverage: SelectedCycleReadbackV2["rangeBoundaryCoverage"];
  chamberVolumeMl: Readonly<Record<ChamberId,
    MainWireNormalAdultFiveWallRangeV2>>;
  chamberTransmuralPressureMmHg: Readonly<Record<ChamberId,
    MainWireNormalAdultFiveWallRangeV2>>;
  absolutePressureMmHg: Readonly<Record<AbsolutePressureId,
    MainWireNormalAdultFiveWallRangeV2>>;
  flowMlPerSec: Readonly<Record<FlowId,
    MainWireNormalAdultFiveWallRangeV2>>;
}>;

type CommonSummaryV2 = Readonly<{
  summaryId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V2_ID;
  protocol: Readonly<{
    identity: MainWireNormalAdultFiveWallPeriodicResultV3["protocolIdentity"];
    identityHash: string;
    componentHashes:
      MainWireNormalAdultFiveWallPeriodicResultV3["protocolComponentHashes"];
  }>;
  source: Readonly<{
    experimentId: MainWireNormalAdultFiveWallPeriodicResultV3["experimentId"];
    schemaVersion: MainWireNormalAdultFiveWallPeriodicResultV3["schemaVersion"];
    initialization:
      MainWireNormalAdultFiveWallPeriodicResultV3["initialization"];
    laSlsMode: MainWireNormalAdultFiveWallPeriodicResultV3["laSlsMode"];
    calciumDrivePriorVariant:
      MainWireNormalAdultFiveWallPeriodicResultV3["calciumDrivePriorVariant"];
    calciumRepresentation:
      MainWireNormalAdultFiveWallPeriodicResultV3["calciumRepresentation"];
    bloodVolumePriorVariant:
      MainWireNormalAdultFiveWallPeriodicResultV3["bloodVolumePriorVariant"];
    bloodVolumePriorAudit:
      MainWireNormalAdultFiveWallPeriodicResultV3["bloodVolumePriorAudit"];
    nominalDtSec: number;
    requestedMaximumBeatCount: number;
    completedBeatCount: number;
    terminationReason:
      MainWireNormalAdultFiveWallPeriodicResultV3["terminationReason"];
    integrationCompletedWithoutFailure: boolean;
    failure: MainWireNormalAdultFiveWallPeriodicResultV3["failure"];
  }>;
  convergence: Readonly<{
    policy: MainWireNormalAdultFiveWallPeriodicResultV3["policy"];
    classifier: MainWireNormalAdultFiveWallPeriodicResultV3["periodicity"];
    periodicSteadyStateClaimed: boolean;
    period2OrbitSuspected: boolean;
    beatClosure: MainWireNormalAdultFiveWallPeriodicResultV3["beatClosure"];
  }>;
  morphologyInterpretation: Readonly<{
    eligible: boolean;
    scope: "current-accepted-timebase-period1-only";
    timeStepRobustnessEstablished: false;
    reason:
      | "eligible-current-accepted-timebase-period1-only"
      | "ineligible-period2-suspect"
      | "ineligible-period1-not-converged";
  }>;
  selectedCycle: SelectedCycleReadbackV2;
  fixedActivationPrior: Readonly<{
    variant:
      MainWireNormalAdultFiveWallPeriodicResultV3["calciumDrivePriorVariant"];
    parameterSetId: string;
    atrialRiseTimeConstantSec: number;
    atrialDecayTimeConstantSec: number;
    purpose:
      "normalized-Ca-lobe-selection-proxy-not-event-timing-or-tension-law";
    activationNormalization:
      "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)";
  }>;
  rawRanges: RawRangesV2;
  residualMaxima: Readonly<{
    mechanicsResidualNorm: number;
    circulationScaledResidualInfinityNorm: number;
    absoluteContinuityResidualMl: number;
    absoluteTotalBloodVolumeErrorMl: number;
    absoluteValvePowerBalanceResidualMmHgMlPerSec: Readonly<Record<
      ValveId,
      number
    >>;
  }>;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V2;
}>;

export type MainWireNormalAdultFiveWallPeriodicSummaryUnavailableV2 =
  Readonly<CommonSummaryV2 & {
    status: "not-measurable";
    reason: "missing-preceding-diagnostic";
    physiologyAvailability: Readonly<{
      status: "not-measurable";
      reason: "missing-preceding-diagnostic";
      detail: "cold-start";
    }>;
    flowLedgers: null;
    hemodynamics: null;
    cyclePhysiology: null;
    workEnergy: null;
    laPvMorphology: null;
  }>;

export type MainWireNormalAdultFiveWallPeriodicSummaryCompleteV2 =
  Readonly<CommonSummaryV2 & {
    status: "complete";
    reason: "complete-accepted-window";
    physiologyAvailability:
      | Readonly<{ status: "measurable"; reason: "measurable" }>
      | Readonly<{
        status: "not-measurable";
        reason:
          | "no-left-atrial-calcium-onset-event"
          | "multiple-left-atrial-calcium-onset-events";
      }>;
    flowLedgers: Readonly<Record<FlowId,
      MainWireNormalAdultFiveWallAcceptedFlowLedgerV2>>;
    hemodynamics: Readonly<{
      leftVentricularEjectionFraction01: number;
      rightVentricularEjectionFraction01: number;
      netAorticStrokeVolumeMl: number;
      forwardAorticStrokeVolumeMl: number;
      netAorticCardiacOutputLPerMin: number;
      cardiacIndexLPerMinPerM2: number;
      meanAorticAbsolutePressureMmHg: number;
    }>;
    cyclePhysiology: MainWireNormalAdultFiveWallCycleDiagnosticsV2;
    workEnergy:
      | Extract<MainWireNormalAdultFiveWallCycleDiagnosticsV2,
        { status: "measurable" }>["workEnergy"]
      | null;
    laPvMorphology:
      | Readonly<{
        status: "measured";
        cycleClosureBoundary:
          "last-accepted-endpoint-to-real-preceding-sample";
        twoLobes: MainWireNormalAdultFiveWallCompactTwoLobesV2;
        reservoirConduitEqualVolumeOrder:
          MainWireNormalAdultFiveWallCompactBranchOrderV2;
      }>
      | Readonly<{
        status: "not-measurable";
        reason:
          | "no-left-atrial-calcium-onset-event"
          | "multiple-left-atrial-calcium-onset-events";
      }>;
  }>;

export type MainWireNormalAdultFiveWallPeriodicSummaryV2 =
  | MainWireNormalAdultFiveWallPeriodicSummaryUnavailableV2
  | MainWireNormalAdultFiveWallPeriodicSummaryCompleteV2;

/**
 * Accepted-timebase summary of the final retained beat.
 *
 * The cold first beat deliberately returns a not-measurable branch: endpoint
 * ranges remain inspectable, while every difference-based quantity is absent.
 */
export function summarizeMainWireNormalAdultFiveWallPeriodicSteadyV2(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): MainWireNormalAdultFiveWallPeriodicSummaryV2 {
  assertProtocolAndCalcium(result);
  const context =
    resolveMainWireNormalAdultFiveWallSelectedCycleContextV2(result);
  const endpointSamples = context.samples;
  const rangeSamples = context.status === "complete"
    ? Object.freeze([
      context.window.precedingSample.sample,
      ...endpointSamples,
    ])
    : endpointSamples;
  const boundaryCoverage = context.status === "complete"
    ? "real-predecessor-and-accepted-endpoints" as const
    : "accepted-endpoints-only" as const;
  const common = commonSummary(
    result,
    context,
    rangeSamples,
    boundaryCoverage,
  );
  if (context.status !== "complete") {
    return Object.freeze({
      ...common,
      status: "not-measurable" as const,
      reason: "missing-preceding-diagnostic" as const,
      physiologyAvailability: Object.freeze({
        status: "not-measurable" as const,
        reason: "missing-preceding-diagnostic" as const,
        detail: context.reason,
      }),
      flowLedgers: null,
      hemodynamics: null,
      cyclePhysiology: null,
      workEnergy: null,
      laPvMorphology: null,
    });
  }

  const cycle = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
    window: context.window,
    wallMaterialVolumeMlByWall: wallMaterialVolumesMl(),
  });
  const flowLedgers = flowRecord((flow) =>
    acceptedFlowLedger(context.window, flow));
  const netAorticStrokeVolumeMl = flowLedgers.AoV.signedVolumeMl;
  const hemodynamics = Object.freeze({
    leftVentricularEjectionFraction01: ejectionFraction(
      rangeSamples.map((sample) => sample.nodeVolumeMl.LV),
    ),
    rightVentricularEjectionFraction01: ejectionFraction(
      rangeSamples.map((sample) => sample.nodeVolumeMl.RV),
    ),
    netAorticStrokeVolumeMl,
    forwardAorticStrokeVolumeMl: flowLedgers.AoV.forwardVolumeMl,
    netAorticCardiacOutputLPerMin:
      netAorticStrokeVolumeMl / context.durationSec * 60 / 1000,
    cardiacIndexLPerMinPerM2:
      netAorticStrokeVolumeMl / context.durationSec * 60 / 1000
      / NORMAL_ADULT_FIVE_WALL_PRIOR_V1.bodySurfaceAreaM2,
    meanAorticAbsolutePressureMmHg:
      acceptedIntervalTimeWeightedMeanV1(
        context.window,
        (sample) => sample.nodeAbsolutePressureMmHg.Ao,
      ),
  });
  const physiologyAvailability = cycle.status === "measurable"
    ? Object.freeze({
      status: "measurable" as const,
      reason: "measurable" as const,
    })
    : Object.freeze({
      status: "not-measurable" as const,
      reason: cycle.reason,
    });
  const morphology = cycle.status === "measurable"
    ? measureMorphology(context, cycle, result.calciumDriveFixedParams)
    : Object.freeze({
      status: "not-measurable" as const,
      reason: cycle.reason,
    });
  return Object.freeze({
    ...common,
    status: "complete" as const,
    reason: "complete-accepted-window" as const,
    physiologyAvailability,
    flowLedgers,
    hemodynamics,
    cyclePhysiology: cycle,
    workEnergy: cycle.status === "measurable" ? cycle.workEnergy : null,
    laPvMorphology: morphology,
  });
}

function commonSummary(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
  context: MainWireNormalAdultFiveWallSelectedCycleContextV2,
  rangeSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV3[],
  boundaryCoverage: SelectedCycleReadbackV2["rangeBoundaryCoverage"],
): CommonSummaryV2 {
  return Object.freeze({
    summaryId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_V2_ID,
    protocol: Object.freeze({
      identity: result.protocolIdentity,
      identityHash: result.protocolIdentityHash,
      componentHashes: result.protocolComponentHashes,
    }),
    source: Object.freeze({
      experimentId: result.experimentId,
      schemaVersion: result.schemaVersion,
      initialization: result.initialization,
      laSlsMode: result.laSlsMode,
      calciumDrivePriorVariant: result.calciumDrivePriorVariant,
      calciumRepresentation: result.calciumRepresentation,
      bloodVolumePriorVariant: result.bloodVolumePriorVariant,
      bloodVolumePriorAudit: result.bloodVolumePriorAudit,
      nominalDtSec: result.dtSec,
      requestedMaximumBeatCount: result.requestedMaximumBeatCount,
      completedBeatCount: result.completedBeatCount,
      terminationReason: result.terminationReason,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
      failure: result.failure,
    }),
    convergence: Object.freeze({
      policy: result.policy,
      classifier: result.periodicity,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      period2OrbitSuspected: result.period2OrbitSuspected,
      beatClosure: result.beatClosure,
    }),
    morphologyInterpretation: morphologyInterpretation(result),
    selectedCycle: Object.freeze({
      beatIndex: context.beatIndex,
      startTimeSec: context.startTimeSec,
      endTimeSec: context.endTimeSec,
      durationSec: context.durationSec,
      nominalGridCount: context.nominalGridCount,
      acceptedIntervalCount: context.acceptedIntervalCount,
      minimumAcceptedDtSec: context.minimumAcceptedDtSec,
      maximumAcceptedDtSec: context.maximumAcceptedDtSec,
      acceptedEventCount: context.acceptedEventCount,
      acceptedEvents: context.acceptedEvents,
      precedingAcceptedSampleAvailable: context.status === "complete",
      rangeBoundaryCoverage: boundaryCoverage,
      jacobianFiniteDifferenceWidthAudit:
        summarizeJacobianFiniteDifferenceWidths(context.samples),
    }),
    fixedActivationPrior: Object.freeze({
      variant: result.calciumDrivePriorVariant,
      parameterSetId: result.calciumDriveFixedParams.parameterSetId,
      atrialRiseTimeConstantSec:
        result.calciumDriveFixedParams.atrial.riseTimeConstantSec,
      atrialDecayTimeConstantSec:
        result.calciumDriveFixedParams.atrial.decayTimeConstantSec,
      purpose:
        "normalized-Ca-lobe-selection-proxy-not-event-timing-or-tension-law" as const,
      activationNormalization:
        "clamp((freeCa-diastolicCa)/peakAmplitude,0,1)" as const,
    }),
    rawRanges: Object.freeze({
      boundaryCoverage,
      chamberVolumeMl: chamberRecord((chamber) =>
        range(rangeSamples.map((sample) => sample.nodeVolumeMl[chamber]))),
      chamberTransmuralPressureMmHg: chamberRecord((chamber) =>
        range(rangeSamples.map((sample) =>
          sample.chamberTransmuralPressureMmHg[chamber]))),
      absolutePressureMmHg: absolutePressureRecord((node) =>
        range(rangeSamples.map((sample) =>
          sample.nodeAbsolutePressureMmHg[node]))),
      flowMlPerSec: flowRecord((flow) =>
        range(rangeSamples.map((sample) => sample.flowMlPerSec[flow]))),
    }),
    residualMaxima: Object.freeze({
      mechanicsResidualNorm: maximumAbsolute(rangeSamples.map((sample) =>
        sample.diagnostics.mechanicsResidualNorm)),
      circulationScaledResidualInfinityNorm:
        maximumAbsolute(rangeSamples.map((sample) =>
          sample.diagnostics.circulationScaledResidualInfinityNorm)),
      absoluteContinuityResidualMl: maximumAbsolute(rangeSamples.map((sample) =>
        sample.diagnostics.maximumContinuityResidualMl)),
      absoluteTotalBloodVolumeErrorMl: maximumAbsolute(rangeSamples.map((sample) =>
        sample.diagnostics.totalBloodVolumeErrorMl)),
      absoluteValvePowerBalanceResidualMmHgMlPerSec: valveRecord((valve) =>
        maximumAbsolute(rangeSamples.map((sample) =>
          sample.valveHydraulics[valve]
            .powerBalanceResidualMmHgMlPerSec))),
    }),
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_SUMMARY_CLAIM_V2,
  });
}

function acceptedFlowLedger(
  window: Extract<MainWireNormalAdultFiveWallSelectedCycleContextV2,
    { status: "complete" }>["window"],
  flow: FlowId,
): MainWireNormalAdultFiveWallAcceptedFlowLedgerV2 {
  const integral = backwardEulerEndpointIntegralV1(
    window,
    (sample) => sample.flowMlPerSec[flow],
  );
  return Object.freeze({
    quadrature: "backward-Euler-endpoint" as const,
    durationSec: integral.durationSec,
    signedVolumeMl: integral.signed,
    forwardVolumeMl: integral.positive,
    reverseVolumeMl: integral.negativeMagnitude,
  });
}

function measureMorphology(
  context: Extract<MainWireNormalAdultFiveWallSelectedCycleContextV2,
    { status: "complete" }>,
  cycle: Extract<MainWireNormalAdultFiveWallCycleDiagnosticsV2,
    { status: "measurable" }>,
  calcium: FiveWallNormalCalciumDriveParamsV1,
): MainWireNormalAdultFiveWallPeriodicSummaryCompleteV2["laPvMorphology"] {
  const samples = context.samples;
  const closedSamples = Object.freeze([
    context.window.precedingSample.sample,
    ...samples,
  ]);
  const closedPhases = Object.freeze([
    cycle.phaseByAcceptedIntervalEndpoint.at(-1)!,
    ...cycle.phaseByAcceptedIntervalEndpoint,
  ]);
  const lobeMeasurement = measureLaPvTwoLobesV2(closedSamples.map(
    (sample, index) => Object.freeze({
      theta: (sample.timeSec - context.startTimeSec) / context.durationSec,
      laVolumeMl: sample.nodeVolumeMl.LA,
      laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
      laActivation01: atrialActivation01(sample, calcium),
      phase: closedPhases[index]!,
    }),
  ));
  const reservoir = physiologicalCyclicSegment(
    context,
    cycle.events.mitralValveClosure.sampleIndex,
    cycle.events.mitralValveOpening.sampleIndex,
  ).map(pvPoint);
  const conduit = physiologicalCyclicSegment(
    context,
    cycle.events.mitralValveOpening.sampleIndex,
    cycle.events.atrialCalciumOnset.firstAcceptedEndpoint.sampleIndex,
  ).map(pvPoint);
  return Object.freeze({
    status: "measured" as const,
    cycleClosureBoundary:
      "last-accepted-endpoint-to-real-preceding-sample" as const,
    twoLobes: compactTwoLobes(lobeMeasurement),
    reservoirConduitEqualVolumeOrder: compactBranchOrder(
      measureLaPvReservoirConduitOrderV1({ reservoir, conduit }),
    ),
  });
}

function physiologicalCyclicSegment(
  context: Extract<MainWireNormalAdultFiveWallSelectedCycleContextV2,
    { status: "complete" }>,
  startIndex: number,
  endIndex: number,
): readonly MainWireNormalAdultFiveWallDiagnosticSampleV3[] {
  const segment: MainWireNormalAdultFiveWallDiagnosticSampleV3[] = [];
  let index = startIndex;
  for (let guard = 0; guard <= context.samples.length; guard += 1) {
    segment.push(context.samples[index]!);
    if (index === endIndex) return Object.freeze(segment);
    if (index === context.samples.length - 1) {
      segment.push(context.window.precedingSample.sample);
    }
    index = (index + 1) % context.samples.length;
  }
  throw new Error("cyclic physiological event segment did not terminate");
}

function summarizeJacobianFiniteDifferenceWidths(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV3[],
): MainWireNormalAdultFiveWallJacobianWidthAuditV2 {
  const nominalScaledStep =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1;
  const counts = new Map<number, number>();
  for (const sample of samples) {
    const absoluteScaledStep = Math.abs(
      sample.acceptedMechanicsJacobianAudit.finiteDifferenceScaledStepUsed,
    );
    if (!(absoluteScaledStep > 0) || !Number.isFinite(absoluteScaledStep)) {
      throw new Error(
        "accepted mechanics Jacobian finite-difference step must be positive and finite",
      );
    }
    counts.set(absoluteScaledStep, (counts.get(absoluteScaledStep) ?? 0) + 1);
  }
  const histogram = Object.freeze(Array.from(
    counts,
    ([absoluteScaledStep, count]) => Object.freeze({
      absoluteScaledStep,
      count,
      classification: absoluteScaledStep === nominalScaledStep
        ? "nominal" as const
        : "alternate" as const,
    }),
  ).sort((left, right) => left.absoluteScaledStep - right.absoluteScaledStep));
  const nominalStepCount = histogram
    .filter((entry) => entry.classification === "nominal")
    .reduce((sum, entry) => sum + entry.count, 0);
  return Object.freeze({
    nominalScaledStep,
    acceptedStepCount: samples.length,
    nominalStepCount,
    alternateStepCount: samples.length - nominalStepCount,
    histogram,
  });
}

function assertProtocolAndCalcium(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): void {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV2({
    identity: result.protocolIdentity,
    identityHash: result.protocolIdentityHash,
    componentHashes: result.protocolComponentHashes,
    periodicPolicy: result.policy,
  });
  const calcium = result.calciumDriveFixedParams;
  assertFiveWallNormalCalciumDriveMatchesFixedRegistryV1(
    result.calciumDrivePriorVariant,
    calcium,
  );
  const calciumHash = stableHash(sanitizeForStableHash(calcium));
  if (
    result.protocolIdentity.calciumDrive.driveId
      !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID
    || result.protocolIdentity.calciumDrive.parameterSetId
      !== calcium.parameterSetId
    || result.protocolIdentity.calciumDrive.fixedParamsStableHash
      !== calciumHash
    || result.protocolComponentHashes.calciumDriveFixedParamsStableHash
      !== calciumHash
  ) {
    throw new Error(
      "periodic summary calcium identity/hash does not match fixed params",
    );
  }
}

function morphologyInterpretation(
  result: MainWireNormalAdultFiveWallPeriodicResultV3,
): CommonSummaryV2["morphologyInterpretation"] {
  const eligible = result.integrationCompletedWithoutFailure
    && result.terminationReason === "period1-converged"
    && result.periodicity.status === "period1-converged"
    && result.periodicSteadyStateClaimed;
  return Object.freeze({
    eligible,
    scope: "current-accepted-timebase-period1-only" as const,
    timeStepRobustnessEstablished: false as const,
    reason: eligible
      ? "eligible-current-accepted-timebase-period1-only" as const
      : result.terminationReason === "period2-suspect"
          || result.periodicity.status === "period2-suspect"
        ? "ineligible-period2-suspect" as const
        : "ineligible-period1-not-converged" as const,
  });
}

function compactTwoLobes(
  measured: LaPvLobeMeasurementV2,
): MainWireNormalAdultFiveWallCompactTwoLobesV2 {
  if (measured.status === "not-measurable") return measured;
  return Object.freeze({
    ...measured,
    aLobe: compactLobe(measured.aLobe),
    vLobe: compactLobe(measured.vLobe),
  });
}

function compactLobe(
  lobe: LaPvMeasuredLobeV2,
): MainWireNormalAdultFiveWallCompactLobeV2 {
  const { path, ...withoutPath } = lobe;
  return Object.freeze({ ...withoutPath, pointCount: path.length });
}

function compactBranchOrder(
  measured: LaPvReservoirConduitOrderV1,
): MainWireNormalAdultFiveWallCompactBranchOrderV2 {
  const { probes: _probes, ...withoutProbes } = measured;
  return Object.freeze(withoutProbes);
}

function atrialActivation01(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV3,
  calcium: FiveWallNormalCalciumDriveParamsV1,
): number {
  return clamp01(
    (sample.freeCalciumUM.LA - calcium.atrial.diastolicCalciumUM)
      / calcium.atrial.peakAmplitudeUM,
  );
}

function wallMaterialVolumesMl() {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  const ventricular = prior.anatomy.triSeg.wallGeometryParameters;
  const values = Object.freeze({
    LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
    LVFW: ventricular.LVFW.wallMaterialVolumeM3 * 1e6,
    SEP: ventricular.SEP.wallMaterialVolumeM3 * 1e6,
    RVFW: ventricular.RVFW.wallMaterialVolumeM3 * 1e6,
    RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
  });
  for (const wall of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
    if (!(values[wall] > 0)) throw new Error(`${wall} wall volume is invalid`);
  }
  return values;
}

function pvPoint(sample: MainWireNormalAdultFiveWallDiagnosticSampleV3) {
  return Object.freeze({
    laVolumeMl: sample.nodeVolumeMl.LA,
    laPressureMmHg: sample.chamberTransmuralPressureMmHg.LA,
  });
}

function ejectionFraction(values: readonly number[]): number {
  const measured = range(values);
  return (measured.maximum - measured.minimum) / measured.maximum;
}

function range(values: readonly number[]): MainWireNormalAdultFiveWallRangeV2 {
  if (values.length === 0 || !values.every(Number.isFinite)) {
    throw new Error("cannot measure range of empty or non-finite values");
  }
  return Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
}

function maximumAbsolute(values: readonly number[]): number {
  return Math.max(...values.map(Math.abs));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function chamberRecord<T>(
  build: (chamber: ChamberId) => T,
): Readonly<Record<ChamberId, T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const).map((chamber) =>
      [chamber, build(chamber)]),
  )) as Readonly<Record<ChamberId, T>>;
}

function absolutePressureRecord<T>(
  build: (node: AbsolutePressureId) => T,
): Readonly<Record<AbsolutePressureId, T>> {
  return Object.freeze(Object.fromEntries(
    (["Ao", "PA", "PVein"] as const).map((node) => [node, build(node)]),
  )) as Readonly<Record<AbsolutePressureId, T>>;
}

function flowRecord<T>(
  build: (flow: FlowId) => T,
): Readonly<Record<FlowId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV", "PVein_LA"] as const).map((flow) =>
      [flow, build(flow)]),
  )) as Readonly<Record<FlowId, T>>;
}

function valveRecord<T>(
  build: (valve: ValveId) => T,
): Readonly<Record<ValveId, T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const).map((valve) =>
      [valve, build(valve)]),
  )) as Readonly<Record<ValveId, T>>;
}
