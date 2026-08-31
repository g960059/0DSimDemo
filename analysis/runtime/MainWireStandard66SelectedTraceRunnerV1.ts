import type {
  MainWireLeftVentricularFlowEventTimingInputV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import type {
  MainWireLeftVentricularAbsolutePressureSampleV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import {
  MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1,
  MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1,
  MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1,
} from "@/engine/executionPlan/MainWireNumericalClockV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";
import type {
  MainWireIntegratedModelStandard66OutputIdV1,
  MainWireIntegratedModelStandard66OutputValueV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import type {
  CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
  MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
} from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import {
  MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
  type MainWireIntegratedModelStandard66AcceptedEndpointProjectionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard66TypedAuthoritySessionV1";
import {
  bindExecutionPlanSolveSystemRuntimeV1,
  executionPlanPresentationBaseTickV1,
  executionPlanTimeAtBaseTickV1,
  prepareBoundExecutionPlanSolveGroupV1,
  resolveBoundExecutionPlanUpdateScheduleV1,
  type BoundExecutionPlanUpdateScheduleV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

export const MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID =
  "main-wire-standard66-selected-accepted-endpoint-trace-runner-v1" as const;

export const MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID =
  "main-wire-standard66-selected-trace-production-route-live-session-v1" as const;

export const MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1 =
  0.02 as const;

const LIVE_SESSION_ROUTE_V1 = Symbol(
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
);

export type MainWireStandard66SelectedTraceBoundaryIntervalSecV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1)[number]["requestedStepSec"];

const TRACE_OUTPUT_IDS_V1 = Object.freeze([
  "hemodynamics.flow.valve.MV",
  "hemodynamics.flow.valve.AoV",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.SA",
  "hemodynamics.volume.LV",
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
  "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
  "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.mean.SA",
  "hemodynamics.stroke-volume.LV-extrema",
  "hemodynamics.stroke-volume.LV-event-defined",
  "hemodynamics.valve-volume.forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
  "hemodynamics.duration.valve-forward-flow.AoV",
] as const satisfies readonly MainWireIntegratedModelStandard66OutputIdV1[]);

export type MainWireStandard66SelectedTraceRunnerInputV1 = Readonly<{
  requestedBoundaryIntervalSec:
    MainWireStandard66SelectedTraceBoundaryIntervalSecV1;
  /**
   * Advances with the selected clock arm but does not retain its endpoints.
   * At least one is required because the cold boundary intentionally has no
   * instantaneous accepted numerical readback.
   */
  warmupBoundaryCount?: number;
  /** Number of requested boundaries retained after the preceding endpoint. */
  recordedBoundaryCount: number;
  hemodynamicResearchInputs?:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale?: number;
}>;

export type MainWireStandard66SelectedTraceLiveSessionCreateInputV1 =
  Readonly<{
    hemodynamicResearchInputs?:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
    ventricularContractilityScale?: number;
  }>;

/**
 * A still-live Standard66 Session together with private proof that this module
 * created it using the production compiled plan and Newton workspace binding.
 * Consumers may advance `session`; they cannot synthesize the route proof.
 */
export type MainWireStandard66SelectedTraceLiveSessionV1 = Readonly<{
  routeIdentity:
    typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
  session: MainWireIntegratedModelStandard66TypedAuthoritySessionV1;
  [LIVE_SESSION_ROUTE_V1]: ReturnType<
    typeof createProductionExecutionPlanRouteV1
  >;
}>;

export type MainWireStandard66SelectedTraceLiveContinuationInputV1 =
  Readonly<{
    liveSession: MainWireStandard66SelectedTraceLiveSessionV1;
    requestedBoundaryIntervalSec:
      MainWireStandard66SelectedTraceBoundaryIntervalSecV1;
  }>;

export type MainWireStandard66SelectedTraceSignalsV1 = Readonly<{
  mitralValveFlowMlPerSec: number;
  aorticValveFlowMlPerSec: number;
  absoluteLeftVentricularPressureMmHg: number;
  absoluteHistoricalAorticNodePressureMmHg: number;
  absoluteSystemicArterialPressureMmHg: number;
  leftVentricularVolumeMl: number;
  aorticProximalConstitutivePortPressureMmHg: number | null;
  aorticLocalHydraulicPressureGradientMmHg: number | null;
  aorticVenaContractaBernoulliPressureMmHg: number | null;
}>;

export type MainWireStandard66SelectedTraceLatestBeatMetricsV1 = Readonly<{
  historicalMeanAorticNodePressureMmHg: number | null;
  meanSystemicArterialPressureMmHg: number | null;
  extremaLeftVentricularStrokeVolumeMl: number | null;
  eventDefinedLeftVentricularStrokeVolumeMl: number | null;
  aorticForwardVolumeMl: number | null;
  aorticMeanLocalHydraulicForwardGradientMmHg: number | null;
  aorticPeakLocalHydraulicForwardGradientMmHg: number | null;
  aorticMeanVenaContractaBernoulliForwardGradientMmHg: number | null;
  aorticPeakVenaContractaBernoulliForwardGradientMmHg: number | null;
  /** Model Q_AoV > 0 duration; not a clinical LVET claim. */
  aorticPositiveFlowDurationSec: number | null;
}>;

export type MainWireStandard66SelectedTraceEndpointV1 = Readonly<{
  endpointIndex: number;
  origin: "preceding-window-endpoint" | "accepted-commit";
  actualTimeSec: number;
  acceptedRevision: number;
  enclosingRequestedBoundaryOrdinal: number;
  landedOnRequestedBoundary: boolean;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
  capturedAtrialActivation: CapturedElectricalActivationV2 | null;
  signals: MainWireStandard66SelectedTraceSignalsV1;
  latestCompletedBeatMetrics:
    MainWireStandard66SelectedTraceLatestBeatMetricsV1;
}>;

export type MainWireStandard66SelectedTraceIntervalV1 = Readonly<{
  requestedBoundaryOrdinal: number;
  requestedBoundaryTimeSec: number;
  startAcceptedTimeSec: number;
  endAcceptedTimeSec: number;
  firstAcceptedEndpointIndex: number;
  lastAcceptedEndpointIndex: number;
  internalAcceptedCommitCount: number;
  eventClippedAcceptedCommitCount: number;
}>;

export type MainWireStandard66SelectedTraceCaptureBoundaryV1 = Readonly<{
  endpointIndex: number;
  capturedActivationId: string;
  activationTimeSec: number;
  parentSourceImpulseId: string;
  upstreamCapturedActivationId: string | null;
  sourceKind: CapturedElectricalActivationV2["sourceKind"];
  sourceId: string;
  sourceSequence: number;
  captureOrdinal: number;
}>;

export type MainWireStandard66SelectedTraceV1 = Readonly<{
  runnerId: typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID;
  source: Readonly<{
    modelOwner: "Standard66-selected-typed-authority-session";
    exactModelMutation: false;
    exactFrameOutputReserved: false;
    registryOrModelSurfaceChanged: false;
    sameCompiledExecutionPlanAsProduction: true;
    sameCoupledNewtonWorkspaceBindingAsProduction: true;
  }>;
  clock: Readonly<{
    executionPlanBaseTickSec: number;
    productionPresentationStepSec: number;
    requestedBoundaryIntervalSec:
      MainWireStandard66SelectedTraceBoundaryIntervalSecV1;
    requestedBoundaryRole:
      "research-integration-cap-and-observation-boundary";
    acceptedStepPolicy:
      "backward-euler-accepted-commits-clipped-at-model-event-boundaries";
    fixedStepIntegrationClaimed: false;
    productionPresentationScheduleArm: boolean;
    offProductionScheduleConvergenceArm: boolean;
    minimumAcceptedStepSec: number;
    maximumAcceptedStepSec: number;
  }>;
  window: Readonly<{
    warmupBoundaryCount: number;
    recordedBoundaryCount: number;
    startTimeSec: number;
    endTimeSec: number;
    precedingEndpointIncluded: true;
  }>;
  lastAcceptedAtrialCaptureAtWindowStart: Readonly<{
    capturedActivationId: string;
    activationTimeSec: number;
  }> | null;
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[];
  intervals: readonly MainWireStandard66SelectedTraceIntervalV1[];
  capturedAtrialActivationBoundaries:
    readonly MainWireStandard66SelectedTraceCaptureBoundaryV1[];
  summary: Readonly<{
    acceptedCommitCount: number;
    requestedBoundaryLandingCount: number;
    eventClippedAcceptedCommitCount: number;
    capturedAtrialActivationCount: number;
    maximumObservedPositiveAorticValveFlowMlPerSec: number;
  }>;
}>;

export type MainWireStandard66SelectedTerminalTraceV1 =
  MainWireStandard66SelectedTraceV1 & Readonly<{
    terminalAcquisition: Readonly<{
      liveSessionRouteIdentity:
        typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
      sameSessionContinuedAfterSettling: true;
      zeroAnchoredRequestedBoundaryGrid: true;
      firstZeroAnchoredRequestedBoundaryOrdinal: number;
      lastZeroAnchoredRequestedBoundaryOrdinal: number;
      requiredPressureRateMarginSec:
        typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1;
      startCapturedActivationId: string;
      endCapturedActivationId: string;
      leadingRetainedMarginSec: number;
      trailingRetainedMarginSec: number;
      maximumPermittedContinuationDurationSec: number;
    }>;
  }>;

/**
 * Creates the only live-session handle accepted by the continuation runner.
 * The private route proof binds the exact same compiled execution plan and
 * coupled Newton workspace factory used by the production host.
 */
export async function createMainWireStandard66SelectedTraceLiveSessionV1(
  input: MainWireStandard66SelectedTraceLiveSessionCreateInputV1 = {},
): Promise<MainWireStandard66SelectedTraceLiveSessionV1> {
  const owned = ownLiveSessionCreateInputV1(input);
  const route = createProductionExecutionPlanRouteV1();
  const session =
    await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create(
      owned.hemodynamicResearchInputs,
      owned.ventricularContractilityScale,
      route.initialization,
      owned.mechanismResearchInputs,
    );
  return Object.freeze({
    routeIdentity:
      MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
    session,
    [LIVE_SESSION_ROUTE_V1]: route,
  });
}

/**
 * Runs the selected exact Session through its production compiled-plan and
 * workspace bindings. The requested interval is active numerically: it caps
 * an otherwise ordinary accepted BE step and is also the retained observation
 * boundary. Model events may insert shorter accepted commits, all of which are
 * retained with their registered scalar readbacks.
 */
export async function runMainWireStandard66SelectedTraceV1(
  input: MainWireStandard66SelectedTraceRunnerInputV1,
): Promise<MainWireStandard66SelectedTraceV1> {
  const owned = ownRunnerInputV1(input);
  const liveSession =
    await createMainWireStandard66SelectedTraceLiveSessionV1({
      hemodynamicResearchInputs: owned.hemodynamicResearchInputs,
      mechanismResearchInputs: owned.mechanismResearchInputs,
      ventricularContractilityScale: owned.ventricularContractilityScale,
    });
  const route = liveSession[LIVE_SESSION_ROUTE_V1];
  const productionPresentationStepSec =
    route.schedule.baseTickSec * route.schedule.presentationPeriodTicks;
  const productionPresentationScheduleArm =
    owned.requestedBoundaryIntervalSec === productionPresentationStepSec;
  const session = liveSession.session;

  let lastWarmupLanding:
    MainWireIntegratedModelStandard66AcceptedEndpointProjectionV1 | null =
      null;
  for (
    let absoluteOrdinal = 1;
    absoluteOrdinal <= owned.warmupBoundaryCount;
    absoluteOrdinal += 1
  ) {
    const targetTimeSec = requestedTargetTimeSecV1(
      route.schedule,
      owned.requestedBoundaryIntervalSec,
      absoluteOrdinal,
      productionPresentationScheduleArm,
    );
    if (absoluteOrdinal === owned.warmupBoundaryCount) {
      const traced = session
        .advanceToPresentationTimeWithStandard66AcceptedEndpointProjectionForAnalysisV1(
          targetTimeSec,
          TRACE_OUTPUT_IDS_V1,
      );
      requireAdvancedV1(traced.advance, `warmup boundary ${absoluteOrdinal}`);
      lastWarmupLanding = traced.acceptedEndpoints.at(-1) ?? null;
      if (
        lastWarmupLanding === null
        || !lastWarmupLanding.commit.substep.landedOnPresentationTarget
      ) {
        throw new Error("Standard66 trace warmup omitted its landing endpoint");
      }
    } else {
      const advanced = session
        .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          targetTimeSec,
          Object.freeze([]),
        );
      requireAdvancedV1(
        advanced.advance,
        `warmup boundary ${absoluteOrdinal}`,
      );
    }
  }

  const windowStartState = session.currentAcceptedState();
  const windowStartTimeSec = windowStartState.acceptedTimeSec;
  const initialValues = lastWarmupLanding?.projectedValues
    ?? session.projectCurrentAcceptedStandard66ValuesV1(TRACE_OUTPUT_IDS_V1);
  const endpoints: MainWireStandard66SelectedTraceEndpointV1[] = [
    endpointFromProjectionV1({
      endpointIndex: 0,
      origin: "preceding-window-endpoint",
      actualTimeSec: windowStartTimeSec,
      acceptedRevision: windowStartState.revision,
      enclosingRequestedBoundaryOrdinal: 0,
      landedOnRequestedBoundary: true,
      clippedByCoronaryWindow: false,
      clippedByRhythmBoundary: false,
      rhythmBoundaryTimeSec: null,
      rhythmBoundaryOwners: Object.freeze([]),
      capturedAtrialActivation:
        lastWarmupLanding?.commit.capturedAtrialActivation ?? null,
      projectedValues: initialValues,
    }),
  ];
  const intervals: MainWireStandard66SelectedTraceIntervalV1[] = [];

  for (
    let relativeOrdinal = 1;
    relativeOrdinal <= owned.recordedBoundaryCount;
    relativeOrdinal += 1
  ) {
    const absoluteOrdinal = owned.warmupBoundaryCount + relativeOrdinal;
    const requestedBoundaryTimeSec = requestedTargetTimeSecV1(
      route.schedule,
      owned.requestedBoundaryIntervalSec,
      absoluteOrdinal,
      productionPresentationScheduleArm,
    );
    const startAcceptedTimeSec = endpoints.at(-1)!.actualTimeSec;
    const projected = session
      .advanceToPresentationTimeWithStandard66AcceptedEndpointProjectionForAnalysisV1(
        requestedBoundaryTimeSec,
        TRACE_OUTPUT_IDS_V1,
      );
    const advance = requireAdvancedV1(
      projected.advance,
      `recorded boundary ${relativeOrdinal}`,
    );
    if (
      projected.acceptedEndpoints.length
      !== advance.internalAcceptedSubstepCount
    ) {
      throw new Error(
        "Standard66 trace accepted-endpoint projection lost an internal commit",
      );
    }
    const firstAcceptedEndpointIndex = endpoints.length;
    for (const accepted of projected.acceptedEndpoints) {
      const endpoint = endpointFromAcceptedProjectionV1(
        endpoints.length,
        relativeOrdinal,
        accepted,
      );
      const previous = endpoints.at(-1)!;
      if (!(endpoint.actualTimeSec > previous.actualTimeSec)) {
        throw new Error("Standard66 trace accepted endpoint did not advance");
      }
      if (endpoint.acceptedRevision !== previous.acceptedRevision + 1) {
        throw new Error(
          "Standard66 trace accepted revisions are not contiguous",
        );
      }
      endpoints.push(endpoint);
    }
    const landing = endpoints.at(-1)!;
    if (
      !landing.landedOnRequestedBoundary
      || landing.actualTimeSec !== requestedBoundaryTimeSec
    ) {
      throw new Error("Standard66 trace did not retain its requested landing");
    }
    intervals.push(Object.freeze({
      requestedBoundaryOrdinal: relativeOrdinal,
      requestedBoundaryTimeSec,
      startAcceptedTimeSec,
      endAcceptedTimeSec: landing.actualTimeSec,
      firstAcceptedEndpointIndex,
      lastAcceptedEndpointIndex: endpoints.length - 1,
      internalAcceptedCommitCount: projected.acceptedEndpoints.length,
      eventClippedAcceptedCommitCount: projected.acceptedEndpoints.filter(
        ({ commit }) => !commit.substep.landedOnPresentationTarget,
      ).length,
    }));
  }

  return assembleSelectedTraceV1({
    route,
    requestedBoundaryIntervalSec: owned.requestedBoundaryIntervalSec,
    productionPresentationScheduleArm,
    warmupBoundaryCount: owned.warmupBoundaryCount,
    windowStartState,
    endpoints,
    intervals,
  });
}

/**
 * Continues an already-advanced production-route Session in place and retains
 * a terminal analysis window. Requested boundaries stay on the absolute
 * time-zero grid; model-event commits remain inserted and are all retained.
 *
 * The acquisition stops only after the latest two consecutive atrial captures
 * have 20 ms of retained context on both sides. That context is deliberately
 * wider than the half-window needed by the centered 20 ms dP/dt sensitivity
 * method. A regular-sinus-derived hard horizon prevents an unbounded run.
 */
export function continueMainWireStandard66SelectedTraceFromLiveSessionV1(
  input: MainWireStandard66SelectedTraceLiveContinuationInputV1,
): MainWireStandard66SelectedTerminalTraceV1 {
  const { liveSession } = input;
  if (
    liveSession === null
    || typeof liveSession !== "object"
    || liveSession.routeIdentity
      !== MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
    || liveSession[LIVE_SESSION_ROUTE_V1] === undefined
  ) {
    throw new Error(
      "Standard66 terminal trace requires a production-route live-session handle",
    );
  }
  requireSupportedBoundaryIntervalV1(input.requestedBoundaryIntervalSec);
  const route = liveSession[LIVE_SESSION_ROUTE_V1];
  const session = liveSession.session;
  const windowStartState = session.currentAcceptedState();
  const windowStartTimeSec = windowStartState.acceptedTimeSec;
  const regular = windowStartState.composedRhythm.regularAtrialSourceState;
  if (regular === null) {
    throw new Error(
      "Standard66 terminal trace requires a regular atrial source",
    );
  }
  const cycleLengthSec = regular.configuration.cycleLengthSec;
  if (!Number.isFinite(cycleLengthSec) || cycleLengthSec <= 0) {
    throw new Error("Standard66 terminal trace sinus cycle is invalid");
  }
  const maximumPermittedContinuationDurationSec =
    3 * cycleLengthSec
    + 2 * MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1
    + input.requestedBoundaryIntervalSec;
  const maximumPermittedEndTimeSec =
    windowStartTimeSec + maximumPermittedContinuationDurationSec;
  const productionPresentationStepSec =
    route.schedule.baseTickSec * route.schedule.presentationPeriodTicks;
  const productionPresentationScheduleArm =
    input.requestedBoundaryIntervalSec === productionPresentationStepSec;
  const firstAbsoluteOrdinal = firstZeroAnchoredGridOrdinalAfterTimeV1(
    windowStartTimeSec,
    input.requestedBoundaryIntervalSec,
  );
  let absoluteOrdinal = firstAbsoluteOrdinal;
  let relativeOrdinal = 1;

  const initialValues =
    session.projectCurrentAcceptedStandard66ValuesV1(TRACE_OUTPUT_IDS_V1);
  const endpoints: MainWireStandard66SelectedTraceEndpointV1[] = [
    endpointFromProjectionV1({
      endpointIndex: 0,
      origin: "preceding-window-endpoint",
      actualTimeSec: windowStartTimeSec,
      acceptedRevision: windowStartState.revision,
      enclosingRequestedBoundaryOrdinal: 0,
      landedOnRequestedBoundary: false,
      clippedByCoronaryWindow: false,
      clippedByRhythmBoundary: false,
      rhythmBoundaryTimeSec: null,
      rhythmBoundaryOwners: Object.freeze([]),
      capturedAtrialActivation: null,
      projectedValues: initialValues,
    }),
  ];
  const intervals: MainWireStandard66SelectedTraceIntervalV1[] = [];

  while (true) {
    const requestedBoundaryTimeSec = requestedTargetTimeSecV1(
      route.schedule,
      input.requestedBoundaryIntervalSec,
      absoluteOrdinal,
      productionPresentationScheduleArm,
    );
    if (!(requestedBoundaryTimeSec > endpoints.at(-1)!.actualTimeSec)) {
      throw new Error(
        "Standard66 terminal trace zero-anchored boundary did not advance",
      );
    }
    if (requestedBoundaryTimeSec > maximumPermittedEndTimeSec) {
      throw new Error(
        "Standard66 terminal trace did not retain two captures and margins within its sinus-derived horizon",
      );
    }
    appendRecordedBoundaryV1({
      session,
      requestedBoundaryTimeSec,
      relativeOrdinal,
      endpoints,
      intervals,
      label: `live terminal boundary ${relativeOrdinal}`,
    });

    const retainedAtrialCaptureEndpoints = endpoints.filter((endpoint) =>
      endpoint.capturedAtrialActivation?.chamber === "atrial"
    );
    if (retainedAtrialCaptureEndpoints.length >= 2) {
      const startCaptureEndpoint = retainedAtrialCaptureEndpoints.at(-2)!;
      const endCaptureEndpoint = retainedAtrialCaptureEndpoints.at(-1)!;
      const leadingRetainedMarginSec =
        startCaptureEndpoint.actualTimeSec - windowStartTimeSec;
      const trailingRetainedMarginSec =
        endpoints.at(-1)!.actualTimeSec - endCaptureEndpoint.actualTimeSec;
      if (
        leadingRetainedMarginSec
          >= MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1
        && trailingRetainedMarginSec
          >= MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1
      ) {
        const trace = assembleSelectedTraceV1({
          route,
          requestedBoundaryIntervalSec: input.requestedBoundaryIntervalSec,
          productionPresentationScheduleArm,
          warmupBoundaryCount: 0,
          windowStartState,
          endpoints,
          intervals,
        });
        const captures = trace.capturedAtrialActivationBoundaries;
        const startCapture = captures.at(-2)!;
        const endCapture = captures.at(-1)!;
        return Object.freeze({
          ...trace,
          terminalAcquisition: Object.freeze({
            liveSessionRouteIdentity: liveSession.routeIdentity,
            sameSessionContinuedAfterSettling: true as const,
            zeroAnchoredRequestedBoundaryGrid: true as const,
            firstZeroAnchoredRequestedBoundaryOrdinal: firstAbsoluteOrdinal,
            lastZeroAnchoredRequestedBoundaryOrdinal: absoluteOrdinal,
            requiredPressureRateMarginSec:
              MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1,
            startCapturedActivationId: startCapture.capturedActivationId,
            endCapturedActivationId: endCapture.capturedActivationId,
            leadingRetainedMarginSec,
            trailingRetainedMarginSec,
            maximumPermittedContinuationDurationSec,
          }),
        });
      }
    }
    absoluteOrdinal += 1;
    relativeOrdinal += 1;
  }
}

/** All actual accepted endpoints, directly consumable by the pressure method. */
export function mainWireStandard66SelectedTracePressureSamplesV1(
  trace: MainWireStandard66SelectedTraceV1,
): readonly MainWireLeftVentricularAbsolutePressureSampleV1[] {
  return Object.freeze(trace.endpoints.map((endpoint) => Object.freeze({
    actualTimeSec: endpoint.actualTimeSec,
    absoluteLeftVentricularPressureMmHg:
      endpoint.signals.absoluteLeftVentricularPressureMmHg,
  })));
}

/**
 * Produces the timing method's strict capture-to-capture, all-accepted-
 * endpoints input. Unknown, reversed, or duplicated capture IDs fail closed.
 */
export function mainWireStandard66SelectedTraceFlowTimingInputV1(
  trace: MainWireStandard66SelectedTraceV1,
  startCapturedActivationId: string,
  endCapturedActivationId: string,
): MainWireLeftVentricularFlowEventTimingInputV1 {
  const start = uniqueCaptureBoundaryV1(trace, startCapturedActivationId);
  const end = uniqueCaptureBoundaryV1(trace, endCapturedActivationId);
  if (!(end.endpointIndex > start.endpointIndex)) {
    throw new Error("Standard66 trace capture boundaries are not ordered");
  }
  const contiguousEndpoints = trace.endpoints.slice(
    start.endpointIndex,
    end.endpointIndex + 1,
  );
  if (
    contiguousEndpoints.length
    !== end.endpointIndex - start.endpointIndex + 1
  ) {
    throw new Error("Standard66 trace capture interval is incomplete");
  }
  for (let index = 0; index < contiguousEndpoints.length; index += 1) {
    const endpoint = contiguousEndpoints[index]!;
    const expectedEndpointIndex = start.endpointIndex + index;
    if (endpoint.endpointIndex !== expectedEndpointIndex) {
      throw new Error("Standard66 trace endpoint indices are not contiguous");
    }
    if (index > 0) {
      const previous = contiguousEndpoints[index - 1]!;
      if (
        endpoint.acceptedRevision !== previous.acceptedRevision + 1
        || !(endpoint.actualTimeSec > previous.actualTimeSec)
      ) {
        throw new Error(
          "Standard66 trace capture interval is not an accepted-commit chain",
        );
      }
    }
  }
  return Object.freeze({
    startAtrialCapture: Object.freeze({
      capturedActivationId: start.capturedActivationId,
      timeSec: start.activationTimeSec,
    }),
    endAtrialCapture: Object.freeze({
      capturedActivationId: end.capturedActivationId,
      timeSec: end.activationTimeSec,
    }),
    acceptedEndpoints: Object.freeze(
      contiguousEndpoints.map((endpoint) => Object.freeze({
        timeSec: endpoint.actualTimeSec,
        mitralValveFlowMlPerSec:
          endpoint.signals.mitralValveFlowMlPerSec,
        aorticValveFlowMlPerSec:
          endpoint.signals.aorticValveFlowMlPerSec,
      })),
    ),
  });
}

export function mainWireStandard66SelectedTraceLatestFlowTimingInputV1(
  trace: MainWireStandard66SelectedTraceV1,
): MainWireLeftVentricularFlowEventTimingInputV1 {
  const captures = trace.capturedAtrialActivationBoundaries;
  if (captures.length < 2) {
    throw new Error(
      "Standard66 trace requires two retained atrial captures for timing",
    );
  }
  return mainWireStandard66SelectedTraceFlowTimingInputV1(
    trace,
    captures.at(-2)!.capturedActivationId,
    captures.at(-1)!.capturedActivationId,
  );
}

function appendRecordedBoundaryV1(input: Readonly<{
  session: MainWireIntegratedModelStandard66TypedAuthoritySessionV1;
  requestedBoundaryTimeSec: number;
  relativeOrdinal: number;
  endpoints: MainWireStandard66SelectedTraceEndpointV1[];
  intervals: MainWireStandard66SelectedTraceIntervalV1[];
  label: string;
}>): void {
  const startAcceptedTimeSec = input.endpoints.at(-1)!.actualTimeSec;
  const projected = input.session
    .advanceToPresentationTimeWithStandard66AcceptedEndpointProjectionForAnalysisV1(
      input.requestedBoundaryTimeSec,
      TRACE_OUTPUT_IDS_V1,
    );
  const advance = requireAdvancedV1(projected.advance, input.label);
  if (
    projected.acceptedEndpoints.length
    !== advance.internalAcceptedSubstepCount
  ) {
    throw new Error(
      "Standard66 trace accepted-endpoint projection lost an internal commit",
    );
  }
  const firstAcceptedEndpointIndex = input.endpoints.length;
  for (const accepted of projected.acceptedEndpoints) {
    const endpoint = endpointFromAcceptedProjectionV1(
      input.endpoints.length,
      input.relativeOrdinal,
      accepted,
    );
    const previous = input.endpoints.at(-1)!;
    if (!(endpoint.actualTimeSec > previous.actualTimeSec)) {
      throw new Error("Standard66 trace accepted endpoint did not advance");
    }
    if (endpoint.acceptedRevision !== previous.acceptedRevision + 1) {
      throw new Error("Standard66 trace accepted revisions are not contiguous");
    }
    input.endpoints.push(endpoint);
  }
  const landing = input.endpoints.at(-1)!;
  if (
    !landing.landedOnRequestedBoundary
    || landing.actualTimeSec !== input.requestedBoundaryTimeSec
  ) {
    throw new Error("Standard66 trace did not retain its requested landing");
  }
  input.intervals.push(Object.freeze({
    requestedBoundaryOrdinal: input.relativeOrdinal,
    requestedBoundaryTimeSec: input.requestedBoundaryTimeSec,
    startAcceptedTimeSec,
    endAcceptedTimeSec: landing.actualTimeSec,
    firstAcceptedEndpointIndex,
    lastAcceptedEndpointIndex: input.endpoints.length - 1,
    internalAcceptedCommitCount: projected.acceptedEndpoints.length,
    eventClippedAcceptedCommitCount: projected.acceptedEndpoints.filter(
      ({ commit }) => !commit.substep.landedOnPresentationTarget,
    ).length,
  }));
}

function assembleSelectedTraceV1(input: Readonly<{
  route: ReturnType<typeof createProductionExecutionPlanRouteV1>;
  requestedBoundaryIntervalSec:
    MainWireStandard66SelectedTraceBoundaryIntervalSecV1;
  productionPresentationScheduleArm: boolean;
  warmupBoundaryCount: number;
  windowStartState: ReturnType<
    MainWireIntegratedModelStandard66TypedAuthoritySessionV1["currentAcceptedState"]
  >;
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[];
  intervals: readonly MainWireStandard66SelectedTraceIntervalV1[];
}>): MainWireStandard66SelectedTraceV1 {
  if (input.endpoints.length < 2 || input.intervals.length < 1) {
    throw new Error("Standard66 trace cannot assemble an empty window");
  }
  const captures = Object.freeze(input.endpoints.flatMap((endpoint) => {
    const capture = endpoint.capturedAtrialActivation;
    if (capture === null) return [];
    if (
      capture.chamber !== "atrial"
      || capture.activationTimeSec !== endpoint.actualTimeSec
    ) {
      throw new Error(
        "Standard66 trace atrial-capture provenance is not clock-aligned",
      );
    }
    return [Object.freeze({
      endpointIndex: endpoint.endpointIndex,
      capturedActivationId: capture.capturedActivationId,
      activationTimeSec: capture.activationTimeSec,
      parentSourceImpulseId: capture.parentSourceImpulseId,
      upstreamCapturedActivationId: capture.upstreamCapturedActivationId,
      sourceKind: capture.sourceKind,
      sourceId: capture.sourceId,
      sourceSequence: capture.sourceSequence,
      captureOrdinal: capture.captureOrdinal,
    })];
  }));
  const acceptedStepRangeSec = input.endpoints.slice(1).reduce(
    (range, endpoint, index) => {
      const durationSec =
        endpoint.actualTimeSec - input.endpoints[index]!.actualTimeSec;
      return Object.freeze({
        minimum: Math.min(range.minimum, durationSec),
        maximum: Math.max(range.maximum, durationSec),
      });
    },
    Object.freeze({
      minimum: Number.POSITIVE_INFINITY,
      maximum: Number.NEGATIVE_INFINITY,
    }),
  );
  const eventClippedAcceptedCommitCount = input.intervals.reduce(
    (sum, interval) => sum + interval.eventClippedAcceptedCommitCount,
    0,
  );
  const windowStartAtrialGate = input.windowStartState.composedRhythm
    .electricalCaptureState.atrialGate;
  const lastAcceptedAtrialCaptureAtWindowStart =
    windowStartAtrialGate.lastCapturedActivationId === null
      ? null
      : Object.freeze({
          capturedActivationId:
            windowStartAtrialGate.lastCapturedActivationId,
          activationTimeSec:
            windowStartAtrialGate.lastCapturedActivationTimeSec!,
        });
  const productionPresentationStepSec =
    input.route.schedule.baseTickSec
    * input.route.schedule.presentationPeriodTicks;

  return Object.freeze({
    runnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
    source: Object.freeze({
      modelOwner: "Standard66-selected-typed-authority-session" as const,
      exactModelMutation: false as const,
      exactFrameOutputReserved: false as const,
      registryOrModelSurfaceChanged: false as const,
      sameCompiledExecutionPlanAsProduction: true as const,
      sameCoupledNewtonWorkspaceBindingAsProduction: true as const,
    }),
    clock: Object.freeze({
      executionPlanBaseTickSec: input.route.schedule.baseTickSec,
      productionPresentationStepSec,
      requestedBoundaryIntervalSec: input.requestedBoundaryIntervalSec,
      requestedBoundaryRole:
        "research-integration-cap-and-observation-boundary" as const,
      acceptedStepPolicy:
        "backward-euler-accepted-commits-clipped-at-model-event-boundaries" as const,
      fixedStepIntegrationClaimed: false as const,
      productionPresentationScheduleArm:
        input.productionPresentationScheduleArm,
      offProductionScheduleConvergenceArm:
        !input.productionPresentationScheduleArm,
      minimumAcceptedStepSec: acceptedStepRangeSec.minimum,
      maximumAcceptedStepSec: acceptedStepRangeSec.maximum,
    }),
    window: Object.freeze({
      warmupBoundaryCount: input.warmupBoundaryCount,
      recordedBoundaryCount: input.intervals.length,
      startTimeSec: input.windowStartState.acceptedTimeSec,
      endTimeSec: input.endpoints.at(-1)!.actualTimeSec,
      precedingEndpointIncluded: true as const,
    }),
    lastAcceptedAtrialCaptureAtWindowStart,
    endpoints: Object.freeze([...input.endpoints]),
    intervals: Object.freeze([...input.intervals]),
    capturedAtrialActivationBoundaries: captures,
    summary: Object.freeze({
      acceptedCommitCount: input.endpoints.length - 1,
      requestedBoundaryLandingCount: input.endpoints.filter(
        (endpoint) =>
          endpoint.origin === "accepted-commit"
          && endpoint.landedOnRequestedBoundary,
      ).length,
      eventClippedAcceptedCommitCount,
      capturedAtrialActivationCount: captures.length,
      maximumObservedPositiveAorticValveFlowMlPerSec: input.endpoints.reduce(
        (maximum, endpoint) => Math.max(
          maximum,
          endpoint.signals.aorticValveFlowMlPerSec,
        ),
        0,
      ),
    }),
  });
}

function createProductionExecutionPlanRouteV1() {
  const boundExecutionPlan =
    bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1();
  const schedule = resolveBoundExecutionPlanUpdateScheduleV1(
    boundExecutionPlan,
  );
  const updateGroup = schedule.groups[0];
  if (
    updateGroup === undefined
    || schedule.groups.length !== 1
    || updateGroup.solveGroupId
      !== MAIN_WIRE_COUPLED_HEMODYNAMICS_SOLVE_GROUP_ID_V1
    || schedule.baseTickSec !== MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1
    || schedule.presentationPeriodTicks
      !== MAIN_WIRE_NUMERICAL_PRESENTATION_PERIOD_TICKS_V1
  ) {
    throw new Error("Standard66 trace production execution schedule drifted");
  }
  const prepared = prepareBoundExecutionPlanSolveGroupV1(
    boundExecutionPlan,
    updateGroup.solveGroupId,
  );
  return Object.freeze({
    schedule,
    initialization: Object.freeze({
      boundExecutionPlan,
      coupledNewtonWorkspace: bindExecutionPlanSolveSystemRuntimeV1(
        boundExecutionPlan,
        updateGroup.solveGroupId,
        prepared,
        Object.freeze([Object.freeze({
          systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID,
          bind: bindMainWireFiveWallCoupledExecutionPlanRuntimeV1,
        })]),
      ),
    }),
  });
}

function requestedTargetTimeSecV1(
  schedule: BoundExecutionPlanUpdateScheduleV1,
  requestedBoundaryIntervalSec:
    MainWireStandard66SelectedTraceBoundaryIntervalSecV1,
  absoluteOrdinal: number,
  productionPresentationScheduleArm: boolean,
): number {
  if (productionPresentationScheduleArm) {
    return executionPlanTimeAtBaseTickV1(
      schedule,
      executionPlanPresentationBaseTickV1(
        schedule,
        0,
        absoluteOrdinal,
      ),
    );
  }
  const targetTimeSec = absoluteOrdinal * requestedBoundaryIntervalSec;
  if (!Number.isFinite(targetTimeSec)) {
    throw new Error("Standard66 trace requested target is not finite");
  }
  return targetTimeSec;
}

function firstZeroAnchoredGridOrdinalAfterTimeV1(
  acceptedTimeSec: number,
  requestedBoundaryIntervalSec:
    MainWireStandard66SelectedTraceBoundaryIntervalSecV1,
): number {
  if (!Number.isFinite(acceptedTimeSec) || acceptedTimeSec < 0) {
    throw new Error("Standard66 trace accepted start time is invalid");
  }
  const scaled = acceptedTimeSec / requestedBoundaryIntervalSec;
  if (!Number.isFinite(scaled) || scaled > Number.MAX_SAFE_INTEGER - 1) {
    throw new Error("Standard66 trace zero-anchored grid ordinal overflowed");
  }
  const nearest = Math.round(scaled);
  const scaledTolerance = 32 * Number.EPSILON * Math.max(1, Math.abs(scaled));
  const completedOrdinal = Math.abs(scaled - nearest) <= scaledTolerance
    ? nearest
    : Math.floor(scaled);
  const nextOrdinal = completedOrdinal + 1;
  if (!Number.isSafeInteger(nextOrdinal) || nextOrdinal < 1) {
    throw new Error("Standard66 trace next grid ordinal is invalid");
  }
  return nextOrdinal;
}

function endpointFromAcceptedProjectionV1(
  endpointIndex: number,
  enclosingRequestedBoundaryOrdinal: number,
  accepted:
    MainWireIntegratedModelStandard66AcceptedEndpointProjectionV1,
): MainWireStandard66SelectedTraceEndpointV1 {
  const substep = accepted.commit.substep;
  return endpointFromProjectionV1({
    endpointIndex,
    origin: "accepted-commit",
    actualTimeSec: substep.acceptedTimeSec,
    acceptedRevision: substep.acceptedRevision,
    enclosingRequestedBoundaryOrdinal,
    landedOnRequestedBoundary: substep.landedOnPresentationTarget,
    clippedByCoronaryWindow: substep.clippedByCoronaryWindow,
    clippedByRhythmBoundary: substep.clippedByRhythmBoundary,
    rhythmBoundaryTimeSec: substep.rhythmBoundaryTimeSec,
    rhythmBoundaryOwners: substep.rhythmBoundaryOwners,
    capturedAtrialActivation: accepted.commit.capturedAtrialActivation,
    projectedValues: accepted.projectedValues,
  });
}

function endpointFromProjectionV1(input: Readonly<{
  endpointIndex: number;
  origin: MainWireStandard66SelectedTraceEndpointV1["origin"];
  actualTimeSec: number;
  acceptedRevision: number;
  enclosingRequestedBoundaryOrdinal: number;
  landedOnRequestedBoundary: boolean;
  clippedByCoronaryWindow: boolean;
  clippedByRhythmBoundary: boolean;
  rhythmBoundaryTimeSec: number | null;
  rhythmBoundaryOwners: readonly string[];
  capturedAtrialActivation: CapturedElectricalActivationV2 | null;
  projectedValues: Readonly<
    Record<string, MainWireIntegratedModelStandard66OutputValueV1>
  >;
}>): MainWireStandard66SelectedTraceEndpointV1 {
  const values = input.projectedValues;
  return Object.freeze({
    endpointIndex: input.endpointIndex,
    origin: input.origin,
    actualTimeSec: input.actualTimeSec,
    acceptedRevision: input.acceptedRevision,
    enclosingRequestedBoundaryOrdinal:
      input.enclosingRequestedBoundaryOrdinal,
    landedOnRequestedBoundary: input.landedOnRequestedBoundary,
    clippedByCoronaryWindow: input.clippedByCoronaryWindow,
    clippedByRhythmBoundary: input.clippedByRhythmBoundary,
    rhythmBoundaryTimeSec: input.rhythmBoundaryTimeSec,
    rhythmBoundaryOwners: Object.freeze([...input.rhythmBoundaryOwners]),
    capturedAtrialActivation: input.capturedAtrialActivation,
    signals: Object.freeze({
      mitralValveFlowMlPerSec:
        requiredValueV1(values, "hemodynamics.flow.valve.MV"),
      aorticValveFlowMlPerSec:
        requiredValueV1(values, "hemodynamics.flow.valve.AoV"),
      absoluteLeftVentricularPressureMmHg:
        requiredValueV1(values, "hemodynamics.pressure.absolute.LV"),
      absoluteHistoricalAorticNodePressureMmHg:
        requiredValueV1(values, "hemodynamics.pressure.absolute.Ao"),
      absoluteSystemicArterialPressureMmHg:
        requiredValueV1(values, "hemodynamics.pressure.absolute.SA"),
      leftVentricularVolumeMl:
        requiredValueV1(values, "hemodynamics.volume.LV"),
      aorticProximalConstitutivePortPressureMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port",
      ),
      aorticLocalHydraulicPressureGradientMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV",
      ),
      aorticVenaContractaBernoulliPressureMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.vena-contracta-bernoulli.AoV",
      ),
    }),
    latestCompletedBeatMetrics: Object.freeze({
      historicalMeanAorticNodePressureMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure.mean.Ao",
      ),
      meanSystemicArterialPressureMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure.mean.SA",
      ),
      extremaLeftVentricularStrokeVolumeMl: optionalValueV1(
        values,
        "hemodynamics.stroke-volume.LV-extrema",
      ),
      eventDefinedLeftVentricularStrokeVolumeMl: optionalValueV1(
        values,
        "hemodynamics.stroke-volume.LV-event-defined",
      ),
      aorticForwardVolumeMl: optionalValueV1(
        values,
        "hemodynamics.valve-volume.forward.AoV",
      ),
      aorticMeanLocalHydraulicForwardGradientMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.mean-local-hydraulic-forward.AoV",
      ),
      aorticPeakLocalHydraulicForwardGradientMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.peak-local-hydraulic-forward.AoV",
      ),
      aorticMeanVenaContractaBernoulliForwardGradientMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.mean-vena-contracta-bernoulli-forward.AoV",
      ),
      aorticPeakVenaContractaBernoulliForwardGradientMmHg: optionalValueV1(
        values,
        "hemodynamics.pressure-gradient.valve.peak-vena-contracta-bernoulli-forward.AoV",
      ),
      aorticPositiveFlowDurationSec: optionalValueV1(
        values,
        "hemodynamics.duration.valve-forward-flow.AoV",
      ),
    }),
  });
}

function requiredValueV1(
  values: Readonly<
    Record<string, MainWireIntegratedModelStandard66OutputValueV1>
  >,
  outputId: MainWireIntegratedModelStandard66OutputIdV1,
): number {
  const value = optionalValueV1(values, outputId);
  if (value === null) {
    throw new Error(`Standard66 trace required signal ${outputId} is unavailable`);
  }
  return value;
}

function optionalValueV1(
  values: Readonly<
    Record<string, MainWireIntegratedModelStandard66OutputValueV1>
  >,
  outputId: MainWireIntegratedModelStandard66OutputIdV1,
): number | null {
  const projected = values[outputId];
  if (projected === undefined || projected.outputId !== outputId) {
    throw new Error(`Standard66 trace projection omitted ${outputId}`);
  }
  if (projected.value !== null && !Number.isFinite(projected.value)) {
    throw new Error(`Standard66 trace projection ${outputId} is not finite`);
  }
  return projected.value;
}

function uniqueCaptureBoundaryV1(
  trace: MainWireStandard66SelectedTraceV1,
  capturedActivationId: string,
): MainWireStandard66SelectedTraceCaptureBoundaryV1 {
  if (capturedActivationId.trim() === "") {
    throw new Error("Standard66 trace captured activation id is empty");
  }
  const matches = trace.capturedAtrialActivationBoundaries.filter(
    (capture) => capture.capturedActivationId === capturedActivationId,
  );
  if (matches.length !== 1) {
    throw new Error(
      `Standard66 trace capture ${capturedActivationId} is not uniquely retained`,
    );
  }
  return matches[0]!;
}

function ownRunnerInputV1(
  input: MainWireStandard66SelectedTraceRunnerInputV1,
) {
  requireSupportedBoundaryIntervalV1(input.requestedBoundaryIntervalSec);
  const warmupBoundaryCount = input.warmupBoundaryCount ?? 1;
  if (!Number.isSafeInteger(warmupBoundaryCount) || warmupBoundaryCount < 1) {
    throw new Error("Standard66 trace warmup boundary count is invalid");
  }
  if (
    !Number.isSafeInteger(input.recordedBoundaryCount)
    || input.recordedBoundaryCount < 1
  ) {
    throw new Error("Standard66 trace recorded boundary count is invalid");
  }
  const ventricularContractilityScale =
    input.ventricularContractilityScale ?? 1;
  if (
    !Number.isFinite(ventricularContractilityScale)
    || ventricularContractilityScale <= 0
  ) {
    throw new Error("Standard66 trace contractility scale is invalid");
  }
  const maximumTargetTimeSec =
    (warmupBoundaryCount + input.recordedBoundaryCount)
      * input.requestedBoundaryIntervalSec;
  if (!Number.isFinite(maximumTargetTimeSec)) {
    throw new Error("Standard66 trace requested clock range is invalid");
  }
  return Object.freeze({
    requestedBoundaryIntervalSec: input.requestedBoundaryIntervalSec,
    warmupBoundaryCount,
    recordedBoundaryCount: input.recordedBoundaryCount,
    hemodynamicResearchInputs: input.hemodynamicResearchInputs
      ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    mechanismResearchInputs: input.mechanismResearchInputs
      ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    ventricularContractilityScale,
  });
}

function ownLiveSessionCreateInputV1(
  input: MainWireStandard66SelectedTraceLiveSessionCreateInputV1,
) {
  const ventricularContractilityScale =
    input.ventricularContractilityScale ?? 1;
  if (
    !Number.isFinite(ventricularContractilityScale)
    || ventricularContractilityScale <= 0
  ) {
    throw new Error("Standard66 trace contractility scale is invalid");
  }
  return Object.freeze({
    hemodynamicResearchInputs: input.hemodynamicResearchInputs
      ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    mechanismResearchInputs: input.mechanismResearchInputs
      ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    ventricularContractilityScale,
  });
}

function requireSupportedBoundaryIntervalV1(
  requestedBoundaryIntervalSec: number,
): asserts requestedBoundaryIntervalSec is
  MainWireStandard66SelectedTraceBoundaryIntervalSecV1 {
  if (
    !MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.some(
      ({ requestedStepSec }) =>
        requestedStepSec === requestedBoundaryIntervalSec,
    )
  ) {
    throw new Error("Standard66 trace boundary interval is unsupported");
  }
}

function requireAdvancedV1<T extends Readonly<{
  status: string;
}>>(
  advance: T,
  label: string,
): Extract<T, { status: "advanced" }> {
  if (advance.status !== "advanced") {
    throw new Error(`Standard66 trace ${label} did not advance: ${advance.status}`);
  }
  return advance as Extract<T, { status: "advanced" }>;
}
