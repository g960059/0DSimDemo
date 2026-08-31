import {
  MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
  measureMainWireStandard66AorticOutflowShapeDiagnosticV1,
  type MainWireStandard66AorticOutflowShapeDiagnosticV1,
} from "@/analysis/methods/mainWire/MainWireStandard66AorticOutflowShapeDiagnosticV1";
import {
  MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
  measureMainWireStandard66TerminalBeatValidationV1,
  type MainWireStandard66TerminalBeatValidationMeasurementsV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import { MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID } from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1,
  type MainWireStandard66TimestepComparisonArmInputV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TimestepComparisonV1";
import {
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
  MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
  confirmMainWireStandard66P1OnLiveSessionV1,
  runMainWireStandard66P1SettlingOnLiveSessionV1,
  type MainWireStandard66P1ConfirmationResultV1,
  type MainWireStandard66P1SettlingResultV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
  assertMainWireStandard66SelectedTraceLiveSessionV1,
  continueMainWireStandard66SelectedTraceFromLiveSessionV1,
  createMainWireStandard66SelectedTraceLiveSessionV1,
  readMainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTerminalTraceV1,
  type MainWireStandard66SelectedTraceLiveSessionConstructionV1,
  type MainWireStandard66SelectedTraceBoundaryIntervalSecV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import type { MainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID =
  "main-wire-standard66-integrated-single-arm-validation-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID =
  "main-wire-standard66-integrated-single-arm-validation-protocol-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID =
  "main-wire-standard66-clock-independent-validation-comparison-cohort-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1 = Object.freeze({
  source:
    "one-private-brand-production-route-live-session-from-cold-through-terminal-analysis" as const,
  fullAcceptedStateP1RequiredBeforeTerminalAnalysis: true as const,
  freshSameSessionP1ConfirmationRequiredBeforeTerminalAnalysis: true as const,
  rawAcceptedStateRetainedInPublicReport: false as const,
  rawTerminalTraceRetainedInPublicReport: false as const,
  exactModelMutation: false as const,
  exactFrameOutputReserved: false as const,
  registryOrModelSurfaceChanged: false as const,
  singleArmEstablishesNumericalResolutionValidation: false as const,
  physiologicalAcceptanceEstablished: false as const,
  independentValidationEstablished: false as const,
  releaseAcceptanceEstablished: false as const,
  causalAttributionClaimed: false as const,
  clinicalMeasurementEquivalenceClaimed: false as const,
});

export type MainWireStandard66ValidationArmExecutionPurposeV1 =
  "preregistered-validation" | "bounded-smoke";

export type MainWireStandard66ValidationArmRunnerInputV1 = Readonly<{
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  executionPurpose?: MainWireStandard66ValidationArmExecutionPurposeV1;
  /** Required only by the test/diagnostic lane; never establishes outcomes. */
  boundedSmokeHorizonSec?: number;
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale?: number;
}>;

export type MainWireStandard66ValidationArmProtocolIdentityV1 = Readonly<{
  identityId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID;
  runnerId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID;
  executionPurpose: MainWireStandard66ValidationArmExecutionPurposeV1;
  clock: Readonly<{
    armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    requestedBoundaryIntervalSec: MainWireStandard66SelectedTraceBoundaryIntervalSecV1;
    requestedGridOriginSec: 0;
  }>;
  componentIdentities: Readonly<{
    liveSessionRouteId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
    settlingRunnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
    settlingProtocolIdentityId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID;
    confirmationRunnerId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID;
    confirmationProtocolIdentityId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID;
    terminalTraceRunnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
    terminalBeatEvaluatorId: typeof MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID;
    outflowShapeDiagnosticId: typeof MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID;
  }>;
  settlingProtocolId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.protocolId;
  comparisonProtocolIdentityHash: string;
  comparisonCohortIdentityHash: string;
  exactConstruction: MainWireStandard66SelectedTraceLiveSessionConstructionV1;
  configuredAorticValveAreaBinding: Readonly<{
    source: "private-brand-live-session-construction.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2";
    maximumForwardEoaCm2: number;
  }>;
  outcomePolicy: Readonly<{
    terminalOutcomesRequireSettlingStatus: "period1-settled";
    terminalOutcomesRequireFreshConfirmationStatus: "period1-confirmed";
    boundedSmokeCanProduceTerminalOutcomes: false;
    partialTerminalOutcomesReturnedAfterAnalysisFailure: false;
  }>;
}>;

export type MainWireStandard66ValidationComparisonCohortIdentityV1 = Readonly<{
  identityId: typeof MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID;
  preregistrationId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID;
  exactConstruction: MainWireStandard66SelectedTraceLiveSessionConstructionV1;
  configuredAorticValveAreaBinding: MainWireStandard66ValidationArmProtocolIdentityV1["configuredAorticValveAreaBinding"];
  comparisonProtocol: Readonly<{
    settlingProtocolId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.protocolId;
    settlingRunnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
    confirmationRunnerId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID;
    terminalTraceRunnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
    terminalBeatEvaluatorId: typeof MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID;
    flowEventTimingMethodId: typeof MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID;
    primaryPressureRateConfigurationIdentity: string;
    outflowShapeDiagnosticId: typeof MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID;
  }>;
  excludedFromIdentity: readonly [
    "clock-arm",
    "requested-step",
    "execution-purpose",
    "numerical-outcome",
  ];
}>;

export type MainWireStandard66ValidationArmSettlingSummaryV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID;
  protocolIdentityId: typeof MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID;
  protocolIdentityHash: string;
  executionPurpose: MainWireStandard66P1SettlingResultV1["executionPurpose"];
  status: MainWireStandard66P1SettlingResultV1["status"];
  clock: MainWireStandard66P1SettlingResultV1["clock"];
  horizons: MainWireStandard66P1SettlingResultV1["horizons"];
  counters: MainWireStandard66P1SettlingResultV1["counters"];
  latestPeriod1Observation: Readonly<{
    windowIndex: number;
    acceptedTimeSec: number;
    acceptedRevision: number;
    maximumNormalizedDelta: number;
    worstGroup: string;
    worstPath: string;
    withinTolerance: boolean;
    consecutiveClosures: number;
  }> | null;
  numericalPeriod1Established: boolean;
  terminalAcceptedTimeSec: number;
  terminalAcceptedRevision: number;
  failure: MainWireStandard66P1SettlingResultV1["failure"];
}>;

export type MainWireStandard66ValidationArmConfirmationSummaryV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID;
  protocolIdentityId: typeof MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID;
  protocolIdentityHash: string;
  settlementProtocolIdentityHash: string;
  status: MainWireStandard66P1ConfirmationResultV1["status"];
  clock: MainWireStandard66P1ConfirmationResultV1["clock"];
  settlementTerminal: MainWireStandard66P1ConfirmationResultV1["settlementTerminal"];
  freshSuffix: MainWireStandard66P1ConfirmationResultV1["freshSuffix"];
  counters: MainWireStandard66P1ConfirmationResultV1["counters"];
  numericalPeriod1Confirmed: boolean;
  terminalAcceptedTimeSec: number;
  terminalAcceptedRevision: number;
  failure: MainWireStandard66P1ConfirmationResultV1["failure"];
}>;

export type MainWireStandard66ValidationArmTerminalTraceProvenanceV1 =
  Readonly<{
    traceRunnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
    source: MainWireStandard66SelectedTerminalTraceV1["source"];
    clock: MainWireStandard66SelectedTerminalTraceV1["clock"];
    window: MainWireStandard66SelectedTerminalTraceV1["window"];
    terminalAcquisition: MainWireStandard66SelectedTerminalTraceV1["terminalAcquisition"];
    summary: MainWireStandard66SelectedTerminalTraceV1["summary"];
    acceptedRevisionRange: Readonly<{ minimum: number; maximum: number }>;
    captureBoundarySummary: Readonly<{
      count: number;
      firstCapturedActivationId: string;
      lastCapturedActivationId: string;
      firstActivationTimeSec: number;
      lastActivationTimeSec: number;
    }>;
  }>;

export type MainWireStandard66ValidationArmTerminalOutcomesV1 = Readonly<{
  traceProvenance: MainWireStandard66ValidationArmTerminalTraceProvenanceV1;
  terminalBeatMeasurements: MainWireStandard66TerminalBeatValidationMeasurementsV1;
  aorticOutflowShapeDiagnostic: MainWireStandard66AorticOutflowShapeDiagnosticV1;
}>;

export type MainWireStandard66ValidationArmFailureV1 = Readonly<{
  stage: "settling" | "confirmation" | "terminal-trace-or-analysis";
  message: string;
}>;

export type MainWireStandard66ValidationArmResultV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID;
  protocolIdentity: MainWireStandard66ValidationArmProtocolIdentityV1;
  protocolIdentityHash: string;
  comparisonProtocolIdentityHash: string;
  comparisonCohortIdentity: MainWireStandard66ValidationComparisonCohortIdentityV1;
  comparisonCohortIdentityHash: string;
  constructionIdentityHash: string;
  executionPurpose: MainWireStandard66ValidationArmExecutionPurposeV1;
  status:
    | "terminal-analysis-complete"
    | "bounded-smoke-complete"
    | "settling-not-established"
    | "settling-failed"
    | "confirmation-not-established"
    | "confirmation-failed"
    | "terminal-analysis-failed";
  modeEligibility: Readonly<{
    testOnlyBoundedSmoke: boolean;
    eligibleForPreregisteredSingleArmMeasurement: boolean;
  }>;
  configuredAorticValveAreaBinding: MainWireStandard66ValidationArmProtocolIdentityV1["configuredAorticValveAreaBinding"];
  settlement: MainWireStandard66ValidationArmSettlingSummaryV1;
  confirmation: MainWireStandard66ValidationArmConfirmationSummaryV1 | null;
  /** Null unless both numerical P1 gates and every terminal analysis pass. */
  outcomes: MainWireStandard66ValidationArmTerminalOutcomesV1 | null;
  failure: MainWireStandard66ValidationArmFailureV1 | null;
  claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1;
}>;

/**
 * Runs one preregistered clock arm from a cold production-route Session.
 * The public result is plain serializable data and deliberately excludes the
 * mutable Session, full accepted states, and raw accepted-endpoint trace.
 */
export async function runMainWireStandard66ValidationArmV1(
  input: MainWireStandard66ValidationArmRunnerInputV1,
): Promise<MainWireStandard66ValidationArmResultV1> {
  const executionPurpose = ownExecutionPurposeV1(input);
  const arm = requireClockArmV1(input.clockArmId);
  const liveSession = await createMainWireStandard66SelectedTraceLiveSessionV1({
    hemodynamicResearchInputs: input.hemodynamicResearchInputs,
    mechanismResearchInputs: input.mechanismResearchInputs,
    ventricularContractilityScale: input.ventricularContractilityScale,
  });
  assertMainWireStandard66SelectedTraceLiveSessionV1(liveSession);
  const exactConstruction =
    readMainWireStandard66SelectedTraceLiveSessionConstructionV1(liveSession);
  const configuredAorticValveAreaBinding = Object.freeze({
    source:
      "private-brand-live-session-construction.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2" as const,
    maximumForwardEoaCm2:
      exactConstruction.mechanismResearchInputs.valveAreas.AoV
        .maximumForwardEoaCm2,
  });
  const comparisonCohortIdentity: MainWireStandard66ValidationComparisonCohortIdentityV1 =
    Object.freeze({
      identityId: MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID,
      preregistrationId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
      exactConstruction,
      configuredAorticValveAreaBinding,
      comparisonProtocol: Object.freeze({
        settlingProtocolId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.protocolId,
        settlingRunnerId: MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
        confirmationRunnerId: MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
        terminalTraceRunnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
        terminalBeatEvaluatorId:
          MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1.terminalBeatMeasurementEvaluatorId,
        flowEventTimingMethodId:
          MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1.flowEventTimingMethodId,
        primaryPressureRateConfigurationIdentity:
          MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1.pressureRatePrimaryConfigurationIdentity,
        outflowShapeDiagnosticId:
          MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
      }),
      excludedFromIdentity: Object.freeze([
        "clock-arm",
        "requested-step",
        "execution-purpose",
        "numerical-outcome",
      ] as const),
    });
  const [comparisonProtocolIdentityHash, comparisonCohortIdentityHash] =
    await Promise.all([
      sha256CanonicalJsonHex(comparisonCohortIdentity.comparisonProtocol),
      sha256CanonicalJsonHex(comparisonCohortIdentity),
    ]);
  const protocolIdentity: MainWireStandard66ValidationArmProtocolIdentityV1 =
    Object.freeze({
      identityId: MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID,
      runnerId: MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
      executionPurpose,
      clock: Object.freeze({
        armId: arm.armId,
        requestedBoundaryIntervalSec: arm.requestedStepSec,
        requestedGridOriginSec: 0 as const,
      }),
      componentIdentities: Object.freeze({
        liveSessionRouteId:
          MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
        settlingRunnerId: MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
        settlingProtocolIdentityId:
          MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID,
        confirmationRunnerId: MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
        confirmationProtocolIdentityId:
          MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID,
        terminalTraceRunnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
        terminalBeatEvaluatorId:
          MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
        outflowShapeDiagnosticId:
          MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
      }),
      settlingProtocolId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.protocolId,
      comparisonProtocolIdentityHash,
      comparisonCohortIdentityHash,
      exactConstruction,
      configuredAorticValveAreaBinding,
      outcomePolicy: Object.freeze({
        terminalOutcomesRequireSettlingStatus: "period1-settled" as const,
        terminalOutcomesRequireFreshConfirmationStatus:
          "period1-confirmed" as const,
        boundedSmokeCanProduceTerminalOutcomes: false as const,
        partialTerminalOutcomesReturnedAfterAnalysisFailure: false as const,
      }),
    });
  const [protocolIdentityHash, constructionIdentityHash] = await Promise.all([
    sha256CanonicalJsonHex(protocolIdentity),
    sha256CanonicalJsonHex(exactConstruction),
  ]);
  const settled = await runMainWireStandard66P1SettlingOnLiveSessionV1({
    liveSession,
    clockArmId: arm.armId,
    executionPurpose:
      executionPurpose === "bounded-smoke"
        ? "bounded-smoke"
        : "preregistered-settling",
    boundedSmokeHorizonSec:
      executionPurpose === "bounded-smoke"
        ? input.boundedSmokeHorizonSec
        : undefined,
  });
  const settlement = compactSettlingV1(settled);
  const common = Object.freeze({
    runnerId: MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
    protocolIdentity,
    protocolIdentityHash,
    comparisonProtocolIdentityHash,
    comparisonCohortIdentity,
    comparisonCohortIdentityHash,
    constructionIdentityHash,
    executionPurpose,
    configuredAorticValveAreaBinding,
    settlement,
    claim: MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1,
  });

  if (executionPurpose === "bounded-smoke") {
    if (
      settled.status !== "bounded-smoke-complete" ||
      settled.failure !== null
    ) {
      return closedResultV1(common, {
        status: "settling-failed",
        confirmation: null,
        failure: Object.freeze({
          stage: "settling" as const,
          message:
            settled.failure?.message ??
            `unexpected bounded-smoke settling status ${settled.status}`,
        }),
      });
    }
    return closedResultV1(common, {
      status: "bounded-smoke-complete",
      confirmation: null,
      failure: null,
    });
  }
  if (settled.status !== "period1-settled") {
    return closedResultV1(common, {
      status:
        settled.status === "failed"
          ? "settling-failed"
          : "settling-not-established",
      confirmation: null,
      failure:
        settled.status === "failed"
          ? Object.freeze({
              stage: "settling" as const,
              message:
                settled.failure?.message ?? "settling failed without detail",
            })
          : null,
    });
  }

  let confirmed: MainWireStandard66P1ConfirmationResultV1;
  try {
    confirmed = await confirmMainWireStandard66P1OnLiveSessionV1({
      liveSession,
      settled,
    });
  } catch (error) {
    return closedResultV1(common, {
      status: "confirmation-failed",
      confirmation: null,
      failure: Object.freeze({
        stage: "confirmation" as const,
        message: error instanceof Error ? error.message : String(error),
      }),
    });
  }
  const confirmation = compactConfirmationV1(confirmed);
  if (confirmed.status !== "period1-confirmed") {
    return closedResultV1(common, {
      status:
        confirmed.status === "failed"
          ? "confirmation-failed"
          : "confirmation-not-established",
      confirmation,
      failure:
        confirmed.status === "failed"
          ? Object.freeze({
              stage: "confirmation" as const,
              message:
                confirmed.failure?.message ??
                "P1 confirmation failed without detail",
            })
          : null,
    });
  }

  try {
    const trace = continueMainWireStandard66SelectedTraceFromLiveSessionV1({
      liveSession,
      requestedBoundaryIntervalSec: arm.requestedStepSec,
    });
    const terminalBeatMeasurements =
      measureMainWireStandard66TerminalBeatValidationV1(trace);
    const aorticOutflowShapeDiagnostic =
      measureMainWireStandard66AorticOutflowShapeDiagnosticV1({
        trace,
        configuredMaximumForwardEoaCm2:
          configuredAorticValveAreaBinding.maximumForwardEoaCm2,
      });
    return Object.freeze({
      ...common,
      status: "terminal-analysis-complete" as const,
      modeEligibility: Object.freeze({
        testOnlyBoundedSmoke: false,
        eligibleForPreregisteredSingleArmMeasurement: true,
      }),
      confirmation,
      outcomes: Object.freeze({
        traceProvenance: compactTraceProvenanceV1(trace),
        terminalBeatMeasurements,
        aorticOutflowShapeDiagnostic,
      }),
      failure: null,
    });
  } catch (error) {
    return closedResultV1(common, {
      status: "terminal-analysis-failed",
      confirmation,
      failure: Object.freeze({
        stage: "terminal-trace-or-analysis" as const,
        message: error instanceof Error ? error.message : String(error),
      }),
    });
  }
}

/** Compact, fail-closed adapter for the pure three-arm timestep evaluator. */
export function mainWireStandard66ValidationArmTimestepComparisonInputV1(
  result: MainWireStandard66ValidationArmResultV1,
): MainWireStandard66TimestepComparisonArmInputV1 {
  const period1Settlement =
    result.settlement.status === "period1-settled" &&
    result.settlement.numericalPeriod1Established
      ? Object.freeze({ status: "period1-settled" as const })
      : Object.freeze({
          status: "unavailable" as const,
          reason: `settling:${result.settlement.status}`,
        });
  const freshPeriod1Confirmation =
    result.confirmation?.status === "period1-confirmed" &&
    result.confirmation.numericalPeriod1Confirmed
      ? Object.freeze({ status: "period1-confirmed" as const })
      : Object.freeze({
          status: "unavailable" as const,
          reason: `confirmation:${result.confirmation?.status ?? "not-run"}`,
        });
  const terminal = result.outcomes?.terminalBeatMeasurements ?? null;
  const primaryPressureRate =
    terminal?.pressureRate.windows.find(({ role }) => role === "primary") ??
    null;
  const terminalMeasurements =
    result.status === "terminal-analysis-complete" &&
    terminal !== null &&
    primaryPressureRate !== null
      ? Object.freeze({
          status: "available" as const,
          methodCompatibility: Object.freeze({
            terminalBeatMeasurementEvaluatorId: terminal.evaluatorId,
            flowEventTimingMethodId: terminal.flowEventTiming.methodId,
            pressureRatePrimaryConfigurationIdentity:
              primaryPressureRate.result.configurationIdentity,
          }),
          preregisteredDtGateValues: terminal.preregisteredDtGateValues,
        })
      : Object.freeze({
          status: "unavailable" as const,
          reason: `terminal:${result.status}`,
        });
  return Object.freeze({
    armId: result.protocolIdentity.clock.armId,
    requestedStepSec:
      result.protocolIdentity.clock.requestedBoundaryIntervalSec,
    executionPurpose: result.executionPurpose,
    compatibility: Object.freeze({
      preregistrationId: result.comparisonCohortIdentity.preregistrationId,
      comparisonProtocolIdentity: result.comparisonProtocolIdentityHash,
      comparisonCohortIdentity: result.comparisonCohortIdentityHash,
    }),
    period1Settlement,
    freshPeriod1Confirmation,
    terminalMeasurements,
  });
}

function compactSettlingV1(
  settled: MainWireStandard66P1SettlingResultV1,
): MainWireStandard66ValidationArmSettlingSummaryV1 {
  const latest = settled.retainedPeriod1Observations.at(-1) ?? null;
  return Object.freeze({
    runnerId: settled.runnerId,
    protocolIdentityId: settled.protocolIdentity.identityId,
    protocolIdentityHash: settled.protocolIdentityHash,
    executionPurpose: settled.executionPurpose,
    status: settled.status,
    clock: settled.clock,
    horizons: settled.horizons,
    counters: settled.counters,
    latestPeriod1Observation:
      latest === null
        ? null
        : Object.freeze({
            windowIndex: latest.windowIndex,
            acceptedTimeSec: latest.acceptedTimeSec,
            acceptedRevision: latest.acceptedRevision,
            maximumNormalizedDelta: latest.period1MaximumNormalizedDelta,
            worstGroup: latest.period1.overall.worstGroup,
            worstPath: latest.period1.overall.worstPath,
            withinTolerance: latest.withinPeriod1Tolerance,
            consecutiveClosures: latest.consecutivePeriod1Closures,
          }),
    numericalPeriod1Established: settled.numericalPeriod1Established,
    terminalAcceptedTimeSec: settled.terminalAcceptedTimeSec,
    terminalAcceptedRevision: settled.terminalAcceptedRevision,
    failure: settled.failure,
  });
}

function compactConfirmationV1(
  confirmed: MainWireStandard66P1ConfirmationResultV1,
): MainWireStandard66ValidationArmConfirmationSummaryV1 {
  return Object.freeze({
    runnerId: confirmed.runnerId,
    protocolIdentityId: confirmed.protocolIdentity.identityId,
    protocolIdentityHash: confirmed.protocolIdentityHash,
    settlementProtocolIdentityHash:
      confirmed.protocolIdentity.settlementProtocolIdentityHash,
    status: confirmed.status,
    clock: confirmed.clock,
    settlementTerminal: confirmed.settlementTerminal,
    freshSuffix: confirmed.freshSuffix,
    counters: confirmed.counters,
    numericalPeriod1Confirmed: confirmed.numericalPeriod1Confirmed,
    terminalAcceptedTimeSec: confirmed.terminalAcceptedTimeSec,
    terminalAcceptedRevision: confirmed.terminalAcceptedRevision,
    failure: confirmed.failure,
  });
}

function compactTraceProvenanceV1(
  trace: MainWireStandard66SelectedTerminalTraceV1,
): MainWireStandard66ValidationArmTerminalTraceProvenanceV1 {
  const firstEndpoint = trace.endpoints[0]!;
  const lastEndpoint = trace.endpoints.at(-1)!;
  const firstCapture = trace.capturedAtrialActivationBoundaries[0]!;
  const lastCapture = trace.capturedAtrialActivationBoundaries.at(-1)!;
  return Object.freeze({
    traceRunnerId: trace.runnerId,
    source: trace.source,
    clock: trace.clock,
    window: trace.window,
    terminalAcquisition: trace.terminalAcquisition,
    summary: trace.summary,
    acceptedRevisionRange: Object.freeze({
      minimum: firstEndpoint.acceptedRevision,
      maximum: lastEndpoint.acceptedRevision,
    }),
    captureBoundarySummary: Object.freeze({
      count: trace.capturedAtrialActivationBoundaries.length,
      firstCapturedActivationId: firstCapture.capturedActivationId,
      lastCapturedActivationId: lastCapture.capturedActivationId,
      firstActivationTimeSec: firstCapture.activationTimeSec,
      lastActivationTimeSec: lastCapture.activationTimeSec,
    }),
  });
}

function closedResultV1(
  common: Readonly<{
    runnerId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID;
    protocolIdentity: MainWireStandard66ValidationArmProtocolIdentityV1;
    protocolIdentityHash: string;
    comparisonProtocolIdentityHash: string;
    comparisonCohortIdentity: MainWireStandard66ValidationComparisonCohortIdentityV1;
    comparisonCohortIdentityHash: string;
    constructionIdentityHash: string;
    executionPurpose: MainWireStandard66ValidationArmExecutionPurposeV1;
    configuredAorticValveAreaBinding: MainWireStandard66ValidationArmProtocolIdentityV1["configuredAorticValveAreaBinding"];
    settlement: MainWireStandard66ValidationArmSettlingSummaryV1;
    claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1;
  }>,
  closed: Readonly<{
    status: Exclude<
      MainWireStandard66ValidationArmResultV1["status"],
      "terminal-analysis-complete"
    >;
    confirmation: MainWireStandard66ValidationArmConfirmationSummaryV1 | null;
    failure: MainWireStandard66ValidationArmFailureV1 | null;
  }>,
): MainWireStandard66ValidationArmResultV1 {
  return Object.freeze({
    ...common,
    status: closed.status,
    modeEligibility: Object.freeze({
      testOnlyBoundedSmoke: common.executionPurpose === "bounded-smoke",
      eligibleForPreregisteredSingleArmMeasurement: false,
    }),
    confirmation: closed.confirmation,
    outcomes: null,
    failure: closed.failure,
  });
}

function ownExecutionPurposeV1(
  input: MainWireStandard66ValidationArmRunnerInputV1,
): MainWireStandard66ValidationArmExecutionPurposeV1 {
  const purpose = input.executionPurpose ?? "preregistered-validation";
  if (purpose !== "preregistered-validation" && purpose !== "bounded-smoke") {
    throw new Error("Standard66 validation-arm execution purpose is invalid");
  }
  if (purpose === "preregistered-validation") {
    if (input.boundedSmokeHorizonSec !== undefined) {
      throw new Error(
        "Standard66 preregistered validation arm cannot override settling horizons",
      );
    }
  } else if (
    input.boundedSmokeHorizonSec === undefined ||
    !Number.isFinite(input.boundedSmokeHorizonSec) ||
    input.boundedSmokeHorizonSec <= 0 ||
    input.boundedSmokeHorizonSec >
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.initialHorizonSec
  ) {
    throw new Error(
      "Standard66 bounded-smoke validation arm requires a positive finite horizon",
    );
  }
  return purpose;
}

function requireClockArmV1(
  armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
) {
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      (candidate) => candidate.armId === armId,
    );
  if (arm === undefined) {
    throw new Error("Standard66 validation-arm clock is unsupported");
  }
  return arm;
}
