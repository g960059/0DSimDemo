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
  validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
  validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3,
  type MainWireIntegratedModelMechanismResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  canonicalCoronaryAutoregulationWindowStartTimeV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_WARM_START_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
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
  isTransitivelyFrozenPlainDataV1,
} from "@/engine/validationStampModeV1";
import {
  sha256BytesHex,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
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

export const MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID =
  "main-wire-standard66-selected-trace-live-session-construction-v1" as const;

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID =
  "main-wire-standard66-research-continuation-production-route-live-session-v1" as const;

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID =
  "main-wire-standard66-research-continuation-construction-v1" as const;

export const MAIN_WIRE_STANDARD66_SELECTED_TRACE_TERMINAL_MARGIN_SEC_V1 =
  0.02 as const;

const LIVE_SESSION_ROUTE_V1 = Symbol(
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
);

const RESEARCH_CONTINUATION_ROUTE_V1 = Symbol(
  MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID,
);

// A Symbol property alone is copyable via object spread or Reflect. These
// registries make the exact factory-minted handle object part of the trust
// boundary, so a clone or a handle with a swapped Session cannot be accepted.
const SELECTED_TRACE_LIVE_SESSION_HANDLES_V1 = new WeakSet<object>();
const RESEARCH_CONTINUATION_LIVE_SESSION_HANDLES_V1 = new WeakSet<object>();

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

export type MainWireStandard66SelectedTraceLiveSessionConstructionV1 =
  Readonly<{
    constructionId:
      typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID;
    hemodynamicResearchInputs:
      MainWireIntegratedModelHemodynamicResearchInputsV3;
    mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
    ventricularContractilityScale: number;
  }>;

/**
 * A still-live Standard66 Session together with private proof that this module
 * created it using the production compiled plan and Newton workspace binding.
 * Consumers may advance `session`; they cannot synthesize the route proof.
 */
export type MainWireStandard66SelectedTraceLiveSessionV1 = Readonly<{
  routeIdentity:
    typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID;
  construction: MainWireStandard66SelectedTraceLiveSessionConstructionV1;
  session: MainWireIntegratedModelStandard66TypedAuthoritySessionV1;
  [LIVE_SESSION_ROUTE_V1]: ReturnType<
    typeof createProductionExecutionPlanRouteV1
  >;
}>;

export type MainWireStandard66ResearchContinuationConstructionV1 =
  Readonly<{
    constructionId:
      typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID;
    initialization: "hemodynamic-research-continuation";
    adaptationId: typeof MAIN_WIRE_INTEGRATED_MODEL_WARM_START_V3_ID;
    sourceEpoch: Readonly<{
      routeIdentity:
        | typeof MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
        | typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID;
      constructionIdentitySha256: string;
      acceptedStateIdentitySha256: string;
      acceptedTimeSec: number;
      acceptedRevision: number;
      exactEmptyCoronaryWindowBoundary: true;
      declaredEvidence: Readonly<{
        kind:
          | "research-p1-confirmed"
          | "phase-lag-anchor"
          | "bounded-test-only";
        evidenceRunnerId: string;
        evidenceIdentityHash: string | null;
        evidenceStatus: string;
      }>;
    }>;
    target: Readonly<{
      hemodynamicResearchInputs:
        MainWireIntegratedModelHemodynamicResearchInputsV3;
      mechanismResearchInputs:
        MainWireIntegratedModelMechanismResearchInputsV3;
      ventricularContractilityScale: number;
    }>;
    targetEpoch: Readonly<{
      acceptedStateIdentitySha256: string;
      acceptedTimeSec: number;
      acceptedRevision: number;
      exactEmptyCoronaryWindowBoundary: true;
      initialWindowIndex: number;
    }>;
    semantics: Readonly<{
      acceptedClockPreserved: true;
      acceptedModelStateAdapted: true;
      beatAnalysisEpochReset: true;
      instantaneousReadbackReset: true;
      coupledPredictorHistoryReset: true;
      sourceEvidenceVerifiedByFactory: false;
      heartRatePreserved: true;
      coronaryWindowAtTarget: "preserve-source-exact-boundary-origin-and-index";
      freshProductionExecutionPlanRoute: true;
      exactModelMutation: false;
      formalValidationEligible: false;
    }>;
  }>;

export type MainWireStandard66ResearchContinuationLiveSessionV1 = Readonly<{
  routeIdentity:
    typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID;
  construction: MainWireStandard66ResearchContinuationConstructionV1;
  session: MainWireIntegratedModelStandard66TypedAuthoritySessionV1;
  [RESEARCH_CONTINUATION_ROUTE_V1]: ReturnType<
    typeof createProductionExecutionPlanRouteV1
  >;
}>;

export type MainWireStandard66ResearchContinuationSourceLiveSessionV1 =
  | MainWireStandard66SelectedTraceLiveSessionV1
  | MainWireStandard66ResearchContinuationLiveSessionV1;

export type MainWireStandard66ResearchContinuationCreateInputV1 = Readonly<{
  sourceLiveSession:
    MainWireStandard66ResearchContinuationSourceLiveSessionV1;
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
  ventricularContractilityScale?: number;
  sourceEvidenceReference: Readonly<{
    kind:
      | "research-p1-confirmed"
      | "phase-lag-anchor"
      | "bounded-test-only";
    evidenceRunnerId: string;
    evidenceIdentityHash: string | null;
    evidenceStatus: string;
  }>;
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
  const handle = Object.freeze({
    routeIdentity:
      MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
    construction: Object.freeze({
      constructionId:
        MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID,
      hemodynamicResearchInputs: owned.hemodynamicResearchInputs,
      mechanismResearchInputs: owned.mechanismResearchInputs,
      ventricularContractilityScale: owned.ventricularContractilityScale,
    }),
    session,
    [LIVE_SESSION_ROUTE_V1]: route,
  });
  SELECTED_TRACE_LIVE_SESSION_HANDLES_V1.add(handle);
  return handle;
}

/**
 * Starts a separately branded research epoch from an exact empty coronary
 * boundary. It reuses neither the source workspace nor any beat-analysis
 * result, and it is intentionally ineligible for the cold formal P1 runner.
 */
export async function createMainWireStandard66ResearchContinuationLiveSessionV1(
  input: MainWireStandard66ResearchContinuationCreateInputV1,
): Promise<MainWireStandard66ResearchContinuationLiveSessionV1> {
  assertMainWireStandard66ResearchContinuationSourceLiveSessionV1(
    input.sourceLiveSession,
  );
  const sourceState = input.sourceLiveSession.session.currentAcceptedState();
  assertExactEmptyCoronaryWindowBoundaryV1(
    sourceState,
    "Standard66 research continuation source",
  );
  const sourceAuthoredInputs =
    readResearchContinuationSourceAuthoredInputsV1(input.sourceLiveSession);
  const owned = ownLiveSessionCreateInputV1({
    hemodynamicResearchInputs: input.hemodynamicResearchInputs,
    mechanismResearchInputs:
      input.mechanismResearchInputs
      ?? sourceAuthoredInputs.mechanismResearchInputs,
    ventricularContractilityScale:
      input.ventricularContractilityScale
      ?? sourceAuthoredInputs.ventricularContractilityScale,
  });
  if (
    owned.hemodynamicResearchInputs.heartRateBpm
      !== sourceAuthoredInputs.hemodynamicResearchInputs.heartRateBpm
  ) {
    throw new Error(
      "Standard66 research continuation requires the same heart rate as its source epoch",
    );
  }
  const sourceEvidenceReference = ownResearchContinuationEvidenceReferenceV1(
    input.sourceEvidenceReference,
  );
  const sourceConstruction = input.sourceLiveSession.construction;
  const sourceConstructionIdentityPromise = sha256CanonicalJsonHex(
    sourceConstruction,
  );
  const sourceAcceptedStateIdentityPromise = sha256BytesHex(
    input.sourceLiveSession.session.snapshotAcceptedStateBytes(),
  );
  const route = createProductionExecutionPlanRouteV1();
  // Start the warm adaptation before the first digest can yield. The source
  // accepted root used by the new Session is therefore the one hashed above.
  const sessionPromise = input.sourceLiveSession.session
      .warmStartWithHemodynamicResearchInputs(
        owned.hemodynamicResearchInputs,
        owned.ventricularContractilityScale,
        route.initialization,
        owned.mechanismResearchInputs,
      );
  const [
    sourceConstructionIdentitySha256,
    sourceAcceptedStateIdentitySha256,
    session,
  ] = await Promise.all([
    sourceConstructionIdentityPromise,
    sourceAcceptedStateIdentityPromise,
    sessionPromise,
  ]);
  const sourceAfterAdaptation =
    input.sourceLiveSession.session.currentAcceptedState();
  if (
    sourceAfterAdaptation.acceptedTimeSec !== sourceState.acceptedTimeSec
    || sourceAfterAdaptation.revision !== sourceState.revision
  ) {
    throw new Error(
      "Standard66 research continuation source epoch advanced during construction",
    );
  }
  const targetState = session.currentAcceptedState();
  if (
    targetState.acceptedTimeSec !== sourceState.acceptedTimeSec
    || targetState.revision !== sourceState.revision
  ) {
    throw new Error(
      "Standard66 research continuation changed the accepted clock",
    );
  }
  assertExactEmptyCoronaryWindowBoundaryV1(
    targetState,
    "Standard66 research continuation target",
  );
  const sourceWindowPolicy = sourceState.coronary
    .coronaryAutoregulationBinding.windowPolicy;
  const targetWindowPolicy = targetState.coronary
    .coronaryAutoregulationBinding.windowPolicy;
  if (
    targetWindowPolicy.originAcceptedTimeSec
      !== sourceWindowPolicy.originAcceptedTimeSec
    || targetWindowPolicy.durationSec !== sourceWindowPolicy.durationSec
    || targetWindowPolicy.interpretation !== sourceWindowPolicy.interpretation
    || targetState.coronary.coronaryAutoregulation.windowIndex
      !== sourceState.coronary.coronaryAutoregulation.windowIndex
  ) {
    throw new Error(
      "Standard66 same-heart-rate continuation changed its coronary window owner",
    );
  }
  const targetAcceptedStateIdentitySha256 = await sha256BytesHex(
    session.snapshotAcceptedStateBytes(),
  );
  const sourceAfterTargetDigest =
    input.sourceLiveSession.session.currentAcceptedState();
  if (
    sourceAfterTargetDigest.acceptedTimeSec !== sourceState.acceptedTimeSec
    || sourceAfterTargetDigest.revision !== sourceState.revision
  ) {
    throw new Error(
      "Standard66 research continuation source epoch advanced during target identity capture",
    );
  }
  const construction = Object.freeze({
    constructionId:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID,
    initialization: "hemodynamic-research-continuation" as const,
    adaptationId: MAIN_WIRE_INTEGRATED_MODEL_WARM_START_V3_ID,
    sourceEpoch: Object.freeze({
      routeIdentity: input.sourceLiveSession.routeIdentity,
      constructionIdentitySha256: sourceConstructionIdentitySha256,
      acceptedStateIdentitySha256: sourceAcceptedStateIdentitySha256,
      acceptedTimeSec: sourceState.acceptedTimeSec,
      acceptedRevision: sourceState.revision,
      exactEmptyCoronaryWindowBoundary: true as const,
      declaredEvidence: sourceEvidenceReference,
    }),
    target: Object.freeze({
      hemodynamicResearchInputs: owned.hemodynamicResearchInputs,
      mechanismResearchInputs: owned.mechanismResearchInputs,
      ventricularContractilityScale: owned.ventricularContractilityScale,
    }),
    targetEpoch: Object.freeze({
      acceptedStateIdentitySha256: targetAcceptedStateIdentitySha256,
      acceptedTimeSec: targetState.acceptedTimeSec,
      acceptedRevision: targetState.revision,
      exactEmptyCoronaryWindowBoundary: true as const,
      initialWindowIndex:
        targetState.coronary.coronaryAutoregulation.windowIndex,
    }),
    semantics: Object.freeze({
      acceptedClockPreserved: true as const,
      acceptedModelStateAdapted: true as const,
      beatAnalysisEpochReset: true as const,
      instantaneousReadbackReset: true as const,
      coupledPredictorHistoryReset: true as const,
      sourceEvidenceVerifiedByFactory: false as const,
      heartRatePreserved: true as const,
      coronaryWindowAtTarget:
        "preserve-source-exact-boundary-origin-and-index" as const,
      freshProductionExecutionPlanRoute: true as const,
      exactModelMutation: false as const,
      formalValidationEligible: false as const,
    }),
  }) satisfies MainWireStandard66ResearchContinuationConstructionV1;
  const handle = Object.freeze({
    routeIdentity:
      MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID,
    construction,
    session,
    [RESEARCH_CONTINUATION_ROUTE_V1]: route,
  });
  RESEARCH_CONTINUATION_LIVE_SESSION_HANDLES_V1.add(handle);
  return handle;
}

/**
 * Verifies the module-private route brand, not merely the public diagnostic
 * identity string. This is the shared trust boundary for analysis runners
 * that continue an existing production-route Session in place.
 */
export function assertMainWireStandard66SelectedTraceLiveSessionV1(
  value: unknown,
): asserts value is MainWireStandard66SelectedTraceLiveSessionV1 {
  if (
    value === null
    || typeof value !== "object"
    || !SELECTED_TRACE_LIVE_SESSION_HANDLES_V1.has(value)
    || !("routeIdentity" in value)
    || value.routeIdentity
      !== MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
    || !(LIVE_SESSION_ROUTE_V1 in value)
    || value[LIVE_SESSION_ROUTE_V1] === undefined
    || !("construction" in value)
    || !isOwnedLiveSessionConstructionV1(value.construction)
    || !("session" in value)
    || !(value.session
      instanceof MainWireIntegratedModelStandard66TypedAuthoritySessionV1)
  ) {
    throw new Error(
      "Standard66 analysis requires a privately branded production-route live-session handle",
    );
  }
}

export function assertMainWireStandard66ResearchContinuationLiveSessionV1(
  value: unknown,
): asserts value is MainWireStandard66ResearchContinuationLiveSessionV1 {
  if (
    value === null
    || typeof value !== "object"
    || !RESEARCH_CONTINUATION_LIVE_SESSION_HANDLES_V1.has(value)
    || !("routeIdentity" in value)
    || value.routeIdentity
      !== MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID
    || !(RESEARCH_CONTINUATION_ROUTE_V1 in value)
    || value[RESEARCH_CONTINUATION_ROUTE_V1] === undefined
    || !("construction" in value)
    || !isOwnedResearchContinuationConstructionV1(value.construction)
    || !("session" in value)
    || !(value.session
      instanceof MainWireIntegratedModelStandard66TypedAuthoritySessionV1)
  ) {
    throw new Error(
      "Standard66 research continuation requires its private production-route brand",
    );
  }
}

export function readMainWireStandard66ResearchContinuationConstructionV1(
  value: unknown,
): MainWireStandard66ResearchContinuationConstructionV1 {
  assertMainWireStandard66ResearchContinuationLiveSessionV1(value);
  return value.construction;
}

/** Returns immutable factory inputs only after the private route-brand check. */
export function readMainWireStandard66SelectedTraceLiveSessionConstructionV1(
  value: unknown,
): MainWireStandard66SelectedTraceLiveSessionConstructionV1 {
  assertMainWireStandard66SelectedTraceLiveSessionV1(value);
  return value.construction;
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
  assertMainWireStandard66SelectedTraceLiveSessionV1(liveSession);
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
  const hemodynamicResearchInputs =
    validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
      input.hemodynamicResearchInputs
        ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    );
  const mechanismResearchInputs =
    validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
      input.mechanismResearchInputs
        ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    );
  return Object.freeze({
    hemodynamicResearchInputs,
    mechanismResearchInputs,
    ventricularContractilityScale,
  });
}

function isOwnedLiveSessionConstructionV1(
  value: unknown,
): value is MainWireStandard66SelectedTraceLiveSessionConstructionV1 {
  if (
    value === null
    || typeof value !== "object"
    || !isTransitivelyFrozenPlainDataV1(value)
  ) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [
    "constructionId",
    "hemodynamicResearchInputs",
    "mechanismResearchInputs",
    "ventricularContractilityScale",
  ].sort();
  return actualKeys.length === expectedKeys.length
    && actualKeys.every((key, index) => key === expectedKeys[index])
    && record.constructionId
      === MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID
    && typeof record.ventricularContractilityScale === "number"
    && Number.isFinite(record.ventricularContractilityScale)
    && record.ventricularContractilityScale > 0;
}

function assertMainWireStandard66ResearchContinuationSourceLiveSessionV1(
  value: unknown,
): asserts value is MainWireStandard66ResearchContinuationSourceLiveSessionV1 {
  if (
    value !== null
    && typeof value === "object"
    && "routeIdentity" in value
    && value.routeIdentity
      === MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
  ) {
    assertMainWireStandard66SelectedTraceLiveSessionV1(value);
    return;
  }
  assertMainWireStandard66ResearchContinuationLiveSessionV1(value);
}

function readResearchContinuationSourceAuthoredInputsV1(
  source: MainWireStandard66ResearchContinuationSourceLiveSessionV1,
) {
  if (
    source.routeIdentity
      === MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
  ) {
    return source.construction;
  }
  return source.construction.target;
}

function ownResearchContinuationEvidenceReferenceV1(
  value: MainWireStandard66ResearchContinuationCreateInputV1[
    "sourceEvidenceReference"
  ],
): MainWireStandard66ResearchContinuationConstructionV1[
  "sourceEpoch"
]["declaredEvidence"] {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.keys(value).sort().join("|")
      !== [
        "evidenceIdentityHash",
        "evidenceRunnerId",
        "evidenceStatus",
        "kind",
      ].sort().join("|")
    || (
      value.kind !== "research-p1-confirmed"
      && value.kind !== "phase-lag-anchor"
      && value.kind !== "bounded-test-only"
    )
    || typeof value.evidenceRunnerId !== "string"
    || value.evidenceRunnerId.trim() === ""
    || (
      value.evidenceIdentityHash !== null
      && (
        typeof value.evidenceIdentityHash !== "string"
        || !/^[0-9a-f]{64}$/.test(value.evidenceIdentityHash)
      )
    )
    || typeof value.evidenceStatus !== "string"
    || value.evidenceStatus.trim() === ""
  ) {
    throw new Error(
      "Standard66 research continuation source evidence reference is invalid",
    );
  }
  if (
    value.kind !== "bounded-test-only"
    && value.evidenceIdentityHash === null
  ) {
    throw new Error(
      "Standard66 research continuation evidence reference requires an identity hash",
    );
  }
  return Object.freeze({
    kind: value.kind,
    evidenceRunnerId: value.evidenceRunnerId,
    evidenceIdentityHash: value.evidenceIdentityHash,
    evidenceStatus: value.evidenceStatus,
  });
}

function isOwnedResearchContinuationConstructionV1(
  value: unknown,
): value is MainWireStandard66ResearchContinuationConstructionV1 {
  if (
    value === null
    || typeof value !== "object"
    || !isTransitivelyFrozenPlainDataV1(value)
  ) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [
    "constructionId",
    "initialization",
    "adaptationId",
    "sourceEpoch",
    "target",
    "targetEpoch",
    "semantics",
  ].sort();
  if (
    actualKeys.length !== expectedKeys.length
    || actualKeys.some((key, index) => key !== expectedKeys[index])
    || record.constructionId
      !== MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_CONSTRUCTION_V1_ID
    || record.initialization !== "hemodynamic-research-continuation"
    || record.adaptationId !== MAIN_WIRE_INTEGRATED_MODEL_WARM_START_V3_ID
  ) {
    return false;
  }
  if (
    record.sourceEpoch === null
    || typeof record.sourceEpoch !== "object"
    || record.target === null
    || typeof record.target !== "object"
    || record.targetEpoch === null
    || typeof record.targetEpoch !== "object"
    || record.semantics === null
    || typeof record.semantics !== "object"
  ) {
    return false;
  }
  const source = record.sourceEpoch as Record<string, unknown>;
  const target = record.target as Record<string, unknown>;
  const targetEpoch = record.targetEpoch as Record<string, unknown>;
  const semantics = record.semantics as Record<string, unknown>;
  return (
    Object.keys(source).length === 7
    && (
      source.routeIdentity
        === MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID
      || source.routeIdentity
        === MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_LIVE_SESSION_ROUTE_V1_ID
    )
    && typeof source.constructionIdentitySha256 === "string"
    && /^[0-9a-f]{64}$/.test(source.constructionIdentitySha256)
    && typeof source.acceptedStateIdentitySha256 === "string"
    && /^[0-9a-f]{64}$/.test(source.acceptedStateIdentitySha256)
    && typeof source.acceptedTimeSec === "number"
    && Number.isFinite(source.acceptedTimeSec)
    && source.acceptedTimeSec >= 0
    && typeof source.acceptedRevision === "number"
    && Number.isSafeInteger(source.acceptedRevision)
    && source.acceptedRevision >= 0
    && source.exactEmptyCoronaryWindowBoundary === true
    && source.declaredEvidence !== null
    && typeof source.declaredEvidence === "object"
    && Object.keys(source.declaredEvidence).length === 4
    && Object.keys(target).length === 3
    && typeof target.ventricularContractilityScale === "number"
    && Number.isFinite(target.ventricularContractilityScale)
    && target.ventricularContractilityScale > 0
    && Object.keys(targetEpoch).length === 5
    && typeof targetEpoch.acceptedStateIdentitySha256 === "string"
    && /^[0-9a-f]{64}$/.test(targetEpoch.acceptedStateIdentitySha256)
    && typeof targetEpoch.acceptedTimeSec === "number"
    && Number.isFinite(targetEpoch.acceptedTimeSec)
    && targetEpoch.acceptedTimeSec >= 0
    && typeof targetEpoch.acceptedRevision === "number"
    && Number.isSafeInteger(targetEpoch.acceptedRevision)
    && targetEpoch.acceptedRevision >= 0
    && targetEpoch.exactEmptyCoronaryWindowBoundary === true
    && typeof targetEpoch.initialWindowIndex === "number"
    && Number.isSafeInteger(targetEpoch.initialWindowIndex)
    && targetEpoch.initialWindowIndex >= 0
    && Object.keys(semantics).length === 11
    && semantics.acceptedClockPreserved === true
    && semantics.acceptedModelStateAdapted === true
    && semantics.beatAnalysisEpochReset === true
    && semantics.instantaneousReadbackReset === true
    && semantics.coupledPredictorHistoryReset === true
    && semantics.sourceEvidenceVerifiedByFactory === false
    && semantics.heartRatePreserved === true
    && semantics.coronaryWindowAtTarget
      === "preserve-source-exact-boundary-origin-and-index"
    && semantics.freshProductionExecutionPlanRoute === true
    && semantics.exactModelMutation === false
    && semantics.formalValidationEligible === false
  );
}

function assertExactEmptyCoronaryWindowBoundaryV1(
  state: ReturnType<
    MainWireIntegratedModelStandard66TypedAuthoritySessionV1[
      "currentAcceptedState"
    ]
  >,
  label: string,
): void {
  const window = state.coronary.coronaryAutoregulation;
  const binding = state.coronary.coronaryAutoregulationBinding;
  const canonicalStart = canonicalCoronaryAutoregulationWindowStartTimeV3(
    binding,
    window.windowIndex,
  );
  if (
    window.windowStartRevision !== state.revision
    || window.windowOriginAcceptedTimeSec
      !== binding.windowPolicy.originAcceptedTimeSec
    || window.windowStartAcceptedTimeSec !== canonicalStart
    || state.acceptedTimeSec !== canonicalStart
    || window.acceptedDurationSec !== 0
    || window.acceptedStepCount !== 0
    || window.windowControl !== null
    || Object.values(window.qmTimeIntegralMlByTerritoryLayer).some((layers) =>
      Object.values(layers).some((entry) => entry !== 0),
    )
    || Object.values(
      window.perfusionPressureTimeIntegralMmHgSecByTerritory,
    ).some((entry) => entry !== 0)
  ) {
    throw new Error(`${label} is not an exact empty coronary-window boundary`);
  }
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
