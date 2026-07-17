import type {
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryCheckpointV1,
  type MainWireFiveWallNonCoronaryColdResultV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationV1,
  type MainWireFiveWallPeriodicClosureReportV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadMainWireScientificResolvedSessionInputV1,
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
  type MainWireScientificResolvedSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  loadSimulationReleaseV1,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type SimulationReleaseV1,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  createMainWireScientificSessionExactCheckpointV3,
  loadMainWireScientificSessionExactCheckpointV3,
  type MainWireScientificSessionExactCheckpointV3,
} from "@/engine/scientific/runtime/MainWireScientificExactCheckpointV3";

export const MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID =
  "main-wire-scientific-session-v1" as const;

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V2_ID =
  "main-wire-scientific-session-exact-checkpoint-v2" as const;

export const MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1 = Object.freeze({
  protocolId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
  protocolVersion: "1.0.0" as const,
  cycleLengthSec: 1 as const,
  dtSec: 0.002 as const,
  stepsPerBeat: 500 as const,
  maximumBeatCount: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
    .defaultMaximumBeatCount,
  maximumStepsPerCall: 500 as const,
  maximumBeatCountPerCall: 1 as const,
  retainedBeatBoundaryCount: 5 as const,
  retainedClosureCount: 3 as const,
  commandProgression:
    "advance-exactly-one-complete-beat-per-call-at-fixed-session-anchor-phase" as const,
  hostCancellationBoundary: "between-calls" as const,
  commitPolicy: "each-step-atomic-partial-progress-retained" as const,
  failedTrialPromotion: false as const,
  trackerCheckpointPolicy:
    "exact-command-continuation-stored-in-exact-checkpoint" as const,
});

/**
 * Transitional vertical slice: one fixed, healthy, five-wall/noncoronary
 * assembly hosted through a release-bound session. The equations remain owned
 * by the accepted main-wire kernels; this host deliberately does not copy them.
 */
export const MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM = Object.freeze({
  assembly: "fixed-normal-adult-five-wall-noncoronary" as const,
  mechanics:
    "full-Land-parallel-SLS-membrane-TriSeg-common-pericardium" as const,
  circulation: "main-wire-derived-15-node-noncoronary" as const,
  valvePreset: "release-resolved-complete-quasi-steady-V2-preset" as const,
  commonPericardium: "healthy-slack-on" as const,
  coronaryCirculationIncluded: false as const,
  deviceGraphIncluded: false as const,
  multipatchIncluded: false as const,
  currentDependencyBoundary:
    "transitional-imports-from-authoritative-main-wire-kernels" as const,
  equationDuplicationInSession: false as const,
  acceptedStateOwner: "session-private" as const,
  stepCommit: "atomic-circulation-and-mechanics" as const,
  failureSemantics: "retain-last-accepted-session-state" as const,
  checkpointKind: "exact-resume-not-warm-start-seed" as const,
  checkpointOuterIntegrity: "canonical-json-sha256" as const,
  periodicSettlement:
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.commandProgression,
  periodicTrackerCheckpointPolicy:
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.trackerCheckpointPolicy,
  legacyInnerTransactionFingerprint:
    "transition-compatibility-only-non-authoritative" as const,
});

type MechanicsState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<MechanicsState>;

export type MainWireScientificSessionSignalAvailabilityV1 =
  | "available"
  | "not-evaluated-at-accepted-state";

export type MainWireScientificSessionObservationV1 = Readonly<{
  observationId: "main-wire-scientific-session-observation-v1";
  sessionId: typeof MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID;
  releaseRef: SimulationReleaseRef;
  revision: number;
  acceptedTimeSec: number;
  source: "cold-initialization" | "accepted-step" | "exact-checkpoint-restore";
  chamber: Readonly<Record<"LA" | "LV" | "RA" | "RV", Readonly<{
    volumeMl: number;
    absolutePressureMmHg: number | null;
    transmuralPressureMmHg: number | null;
    pressureAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  vascularPressure: Readonly<Record<"Ao" | "PA" | "PVein", Readonly<{
    absolutePressureMmHg: number | null;
    pressureAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  valve: Readonly<Record<"MV" | "AoV" | "TV" | "PV", Readonly<{
    flowMlPerSec: number | null;
    openingFraction01: number;
    flowAvailability: MainWireScientificSessionSignalAvailabilityV1;
  }>>>;
  pulmonaryVenousFlowMlPerSec: number | null;
  pulmonaryVenousFlowAvailability:
    MainWireScientificSessionSignalAvailabilityV1;
  diagnostics: Readonly<{
    mechanicsResidualNorm: number | null;
    mechanicsIterations: number | null;
    circulationScaledResidualInfinityNorm: number | null;
    maximumContinuityResidualMl: number | null;
    totalBloodVolumeErrorMl: number;
    mechanicsCallbackCount: number | null;
    mechanicsCallbackCacheHits: number | null;
    commonPericardialExcessPressureMmHg: number | null;
  }>;
}>;

export type MainWireScientificSessionPeriodicTrackerCheckpointV1 = Readonly<{
  trackerCheckpointId: "main-wire-periodic-settlement-tracker-checkpoint-v1";
  schemaVersion: 1;
  anchorAcceptedTimeSec: number;
  anchorPhase01: number;
  completedBeatCount: number;
  boundaryTransactions: readonly MainWireFiveWallNonCoronaryCheckpointV1[];
}>;

export type MainWireScientificSessionExactCheckpointV2 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V2_ID;
  schemaVersion: 2;
  releaseRef: SimulationReleaseRef;
  assembly: typeof MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly;
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  periodicSettlementTracker:
    MainWireScientificSessionPeriodicTrackerCheckpointV1 | null;
  claim: Readonly<{
    exactReleaseRequired: true;
    semanticReresolutionAllowedHere: false;
    derivedObservationStored: false;
    outerIntegrity: "canonical-json-sha256";
    innerTransactionFingerprint:
      "transition-compatibility-only-non-authoritative";
    periodicSettlementTrackerStored: true;
    periodicSettlementExactCommandContinuation: true;
  }>;
  checkpointSha256: string;
}>;

type MainWireScientificSessionExactCheckpointPayloadV2 = Omit<
  MainWireScientificSessionExactCheckpointV2,
  "checkpointSha256"
>;

export type MainWireScientificSessionStepResultV1 =
  | Readonly<{
    converged: true;
    observation: MainWireScientificSessionObservationV1;
  }>
  | Readonly<{
    converged: false;
    reason:
      | "circulation-or-mechanics-trial-failed"
      | "step-evaluation-threw";
    message: string;
    acceptedStateUnchanged: true;
    observation: MainWireScientificSessionObservationV1;
  }>;

export type MainWireScientificSessionTransientResultV1 = Readonly<{
  completed: boolean;
  requestedStepCount: number;
  completedStepCount: number;
  observations: readonly MainWireScientificSessionObservationV1[];
  finalObservation: MainWireScientificSessionObservationV1;
  failure: null | Extract<
    MainWireScientificSessionStepResultV1,
    Readonly<{ converged: false }>
  >;
}>;

export type MainWireScientificPeriodicClosureSummaryV1 = Readonly<{
  maximumNormalizedDelta: number;
  worstGroup: MainWireFiveWallPeriodicClosureReportV1["overall"]["worstGroup"];
  worstPath: string;
  elapsedTimeSec: number;
}>;

export type MainWireScientificPeriodicBeatSummaryV1 = Readonly<{
  beatIndex: number;
  period1: MainWireScientificPeriodicClosureSummaryV1 | null;
  period2: MainWireScientificPeriodicClosureSummaryV1 | null;
}>;

export type MainWireScientificPeriodicSettlementStatusV1 =
  | "tracking"
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached";

export type MainWireScientificPeriodicSettlementResultV1 =
  | Readonly<{
    completed: true;
    status: MainWireScientificPeriodicSettlementStatusV1;
    periodicSteadyStateClaimed: boolean;
    period2OrbitSuspected: boolean;
    trackerStartedThisCall: boolean;
    beatCompletedThisCall: boolean;
    completedStepCountThisCall: number;
    completedBeatCount: number;
    anchorAcceptedTimeSec: number;
    anchorPhase01: number;
    periodicity: MainWireFiveWallPeriodicClassificationV1;
    retainedBeatClosure: readonly MainWireScientificPeriodicBeatSummaryV1[];
    finalObservation: MainWireScientificSessionObservationV1;
    executionProtocol: typeof MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1;
  }>
  | Readonly<{
    completed: false;
    status: "step-failure";
    message: string;
    acceptedStateUnchangedForFailedStep: true;
    periodicTrackerReset: true;
    completedStepCountThisCall: number;
    completedBeatCount: 0;
    anchorAcceptedTimeSec: null;
    anchorPhase01: null;
    finalObservation: MainWireScientificSessionObservationV1;
    failure: MainWireScientificSessionStepResultV1 | null;
    executionProtocol: typeof MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1;
  }>;

type PeriodicSettlementTracker = {
  anchorAcceptedTimeSec: number;
  anchorPhase01: number;
  boundaryStates: AcceptedState[];
  observations: MainWireFiveWallPeriodicBeatObservationV1[];
  completedBeatCount: number;
  status: MainWireScientificPeriodicSettlementStatusV1;
  classification: MainWireFiveWallPeriodicClassificationV1;
};

type FixedAssemblyDependencies = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  calciumDriveParams: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
}>;

export class MainWireScientificSessionV1 {
  readonly sessionId = MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID;
  readonly releaseRef: SimulationReleaseRef;
  readonly sessionInput: MainWireScientificResolvedSessionInputV1;
  readonly sessionInputSha256: string;
  readonly claim = MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM;

  private readonly dependencies: FixedAssemblyDependencies;
  private acceptedState: AcceptedState;
  private lastObservation: MainWireScientificSessionObservationV1;
  private periodicSettlementTracker: PeriodicSettlementTracker | null = null;

  private constructor(
    releaseRef: SimulationReleaseRef,
    sessionInput: MainWireScientificResolvedSessionInputV1,
    dependencies: FixedAssemblyDependencies,
    acceptedState: AcceptedState,
    observation: MainWireScientificSessionObservationV1,
    periodicSettlementTracker: PeriodicSettlementTracker | null = null,
  ) {
    assertObservationMatchesAcceptedState(
      releaseRef,
      acceptedState,
      observation,
    );
    if (!sameSimulationReleaseRef(releaseRef, sessionInput.releaseRef)) {
      throw new Error("session input release identity mismatch");
    }
    this.releaseRef = copyReleaseRef(releaseRef);
    this.sessionInput = sessionInput;
    this.sessionInputSha256 = sessionInput.sessionInputSha256;
    this.dependencies = dependencies;
    this.acceptedState = acceptedState;
    this.lastObservation = observation;
    this.periodicSettlementTracker = periodicSettlementTracker;
  }

  static async initialize(
    untrustedRelease: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    const sessionInput = await canonicalHealthySessionInput(release);
    return MainWireScientificSessionV1.constructCold(release, sessionInput);
  }

  static async initializeResolved(
    untrustedRelease: unknown,
    untrustedSessionInput: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    const sessionInput = await loadMainWireScientificResolvedSessionInputV1(
      release,
      untrustedSessionInput,
    );
    return MainWireScientificSessionV1.constructCold(release, sessionInput);
  }

  static async createCanonical(): Promise<MainWireScientificSessionV1> {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const sessionInput = await canonicalHealthySessionInput(release);
    return MainWireScientificSessionV1.constructCold(release, sessionInput);
  }

  static async restoreLegacyCanonicalExactV2(
    untrustedRelease: unknown,
    checkpoint: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    const validatedCheckpoint = await validateExactCheckpointEnvelope(
      release.ref,
      checkpoint,
    );
    const sessionInput = await canonicalHealthySessionInput(release);
    const dependencies = buildFixedAssemblyDependencies(sessionInput);
    const acceptedState = restoreMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      validatedCheckpoint.transaction,
    );
    const periodicSettlementTracker = restorePeriodicTracker(
      dependencies.provider,
      acceptedState,
      validatedCheckpoint.periodicSettlementTracker,
    );
    return new MainWireScientificSessionV1(
      release.ref,
      sessionInput,
      dependencies,
      acceptedState,
      restoredObservation(release.ref, acceptedState),
      periodicSettlementTracker,
    );
  }

  static async restoreExactV3(
    untrustedRelease: unknown,
    untrustedSessionInput: unknown,
    checkpoint: unknown,
  ): Promise<MainWireScientificSessionV1> {
    const release = await loadFixedAssemblyRelease(untrustedRelease);
    const sessionInput = await loadMainWireScientificResolvedSessionInputV1(
      release,
      untrustedSessionInput,
    );
    const validatedCheckpoint =
      await loadMainWireScientificSessionExactCheckpointV3(
        {
          releaseRef: release.ref,
          sessionInputSha256: sessionInput.sessionInputSha256,
        },
        checkpoint,
      );
    const dependencies = buildFixedAssemblyDependencies(sessionInput);
    const acceptedState = restoreMainWireFiveWallNonCoronaryV1(
      dependencies.provider,
      validatedCheckpoint.transaction,
    );
    const periodicSettlementTracker = restorePeriodicTracker(
      dependencies.provider,
      acceptedState,
      validatedCheckpoint.periodicSettlementTracker,
    );
    return new MainWireScientificSessionV1(
      release.ref,
      sessionInput,
      dependencies,
      acceptedState,
      restoredObservation(release.ref, acceptedState),
      periodicSettlementTracker,
    );
  }

  static async restoreExact(
    untrustedRelease: unknown,
    untrustedSessionInput: unknown,
    checkpoint: unknown,
  ): Promise<MainWireScientificSessionV1> {
    return MainWireScientificSessionV1.restoreExactV3(
      untrustedRelease,
      untrustedSessionInput,
      checkpoint,
    );
  }

  stateIdentity(): Readonly<{
    revision: number;
    acceptedTimeSec: number;
    totalBloodVolumeMl: number;
  }> {
    return Object.freeze({
      revision: this.acceptedState.revision,
      acceptedTimeSec: this.acceptedState.acceptedTimeSec,
      totalBloodVolumeMl: this.acceptedState.circulation.totalBloodVolumeMl,
    });
  }

  observe(): MainWireScientificSessionObservationV1 {
    return this.lastObservation;
  }

  step(dtSec: number): MainWireScientificSessionStepResultV1 {
    return this.advanceAcceptedStep(dtSec, true);
  }

  /**
   * Performs one bounded periodic-settlement chunk. Every active call advances
   * exactly one complete beat at the command-start phase anchor, so the host
   * can observe progress or cancel between calls without a hidden long loop.
   */
  settlePeriodic(): MainWireScientificPeriodicSettlementResultV1 {
    if (this.periodicSettlementTracker !== null) {
      const terminal = this.periodicSettlementTracker.status !== "tracking";
      if (terminal) return this.periodicSuccess(false, false, 0);
      const latestBoundary = this.periodicSettlementTracker.boundaryStates.at(-1);
      if (latestBoundary !== this.acceptedState) {
        this.periodicSettlementTracker = null;
      }
    }

    let trackerStartedThisCall = false;
    if (this.periodicSettlementTracker === null) {
      this.periodicSettlementTracker = newPeriodicTracker(this.acceptedState);
      trackerStartedThisCall = true;
    }

    const advanced = this.advancePeriodicSteps(
      MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat,
    );
    if (advanced.failure !== null) {
      this.periodicSettlementTracker = null;
      return periodicStepFailure(advanced.completedStepCount, advanced.failure);
    }
    this.recordPeriodicBeatBoundary();
    return this.periodicSuccess(
      trackerStartedThisCall,
      true,
      advanced.completedStepCount,
    );
  }

  private advanceAcceptedStep(
    dtSec: number,
    invalidatePeriodicTrackerOnSuccess: boolean,
  ): MainWireScientificSessionStepResultV1 {
    const before = this.acceptedState;
    let stepped;
    try {
      stepped = stepMainWireFiveWallNonCoronaryV1(
        this.dependencies.provider,
        before,
        {
          dtSec,
          runtime: this.dependencies.runtime,
          calciumDriveParams: this.dependencies.calciumDriveParams,
          pericardium: this.dependencies.pericardium,
        },
      );
    } catch (error) {
      assertSessionStateNotPromoted(this.acceptedState, before);
      return Object.freeze({
        converged: false as const,
        reason: "step-evaluation-threw" as const,
        message: errorMessage(error),
        acceptedStateUnchanged: true as const,
        observation: this.lastObservation,
      });
    }
    if (stepped.converged === false) {
      assertSessionStateNotPromoted(this.acceptedState, before);
      if (
        stepped.rollbackState.revision !== before.revision
        || stepped.rollbackState.acceptedTimeSec !== before.acceptedTimeSec
      ) throw new Error("atomic transaction returned a mismatched rollback state");
      return Object.freeze({
        converged: false as const,
        reason: "circulation-or-mechanics-trial-failed" as const,
        message: stepped.message,
        acceptedStateUnchanged: true as const,
        observation: this.lastObservation,
      });
    }

    let observation: MainWireScientificSessionObservationV1;
    try {
      observation = acceptedStepObservation(
        this.releaseRef,
        sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped),
        stepped.acceptedState.revision,
      );
      assertObservationMatchesAcceptedState(
        this.releaseRef,
        stepped.acceptedState,
        observation,
      );
    } catch (error) {
      assertSessionStateNotPromoted(this.acceptedState, before);
      return Object.freeze({
        converged: false as const,
        reason: "step-evaluation-threw" as const,
        message: `accepted observation rejected: ${errorMessage(error)}`,
        acceptedStateUnchanged: true as const,
        observation: this.lastObservation,
      });
    }
    if (invalidatePeriodicTrackerOnSuccess) {
      this.periodicSettlementTracker = null;
    }
    this.acceptedState = stepped.acceptedState;
    this.lastObservation = observation;
    return Object.freeze({
      converged: true as const,
      observation,
    });
  }

  private advancePeriodicSteps(stepCount: number): Readonly<{
    completedStepCount: number;
    failure: Extract<
      MainWireScientificSessionStepResultV1,
      Readonly<{ converged: false }>
    > | null;
  }> {
    for (let index = 0; index < stepCount; index += 1) {
      const result = this.advanceAcceptedStep(
        MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.dtSec,
        false,
      );
      if (result.converged === false) {
        return Object.freeze({
          completedStepCount: index,
          failure: result,
        });
      }
    }
    return Object.freeze({ completedStepCount: stepCount, failure: null });
  }

  private recordPeriodicBeatBoundary(): void {
    const tracker = this.periodicSettlementTracker;
    if (tracker === null) throw new Error("periodic tracker is unavailable");
    const previous = tracker.boundaryStates.at(-1);
    if (previous === undefined) throw new Error("periodic tracker lacks a boundary");
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      this.acceptedState,
      previous,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2Reference = tracker.boundaryStates.at(-2);
    const period2 = period2Reference === undefined
      ? null
      : compareMainWireFiveWallAcceptedStatesV1(
        this.acceptedState,
        period2Reference,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      );
    tracker.completedBeatCount += 1;
    tracker.observations.push(Object.freeze({
      beatIndex: tracker.completedBeatCount,
      period1,
      period2,
    }));
    tracker.boundaryStates.push(this.acceptedState);
    trimFront(
      tracker.observations,
      MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.retainedClosureCount,
    );
    trimFront(
      tracker.boundaryStates,
      MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.retainedBeatBoundaryCount,
    );
    tracker.classification = classifyPeriodicTracker(tracker.observations);
    tracker.status = periodicStatus(
      tracker.classification,
      tracker.completedBeatCount,
    );
  }

  private periodicSuccess(
    trackerStartedThisCall: boolean,
    beatCompletedThisCall: boolean,
    completedStepCountThisCall: number,
  ): Extract<MainWireScientificPeriodicSettlementResultV1, { completed: true }> {
    const tracker = this.periodicSettlementTracker;
    if (tracker === null) throw new Error("periodic tracker is unavailable");
    return Object.freeze({
      completed: true as const,
      status: tracker.status,
      periodicSteadyStateClaimed: tracker.status === "period1-converged",
      period2OrbitSuspected: tracker.status === "period2-suspect",
      trackerStartedThisCall,
      beatCompletedThisCall,
      completedStepCountThisCall,
      completedBeatCount: tracker.completedBeatCount,
      anchorAcceptedTimeSec: tracker.anchorAcceptedTimeSec,
      anchorPhase01: tracker.anchorPhase01,
      periodicity: copyPeriodicClassification(tracker.classification),
      retainedBeatClosure: Object.freeze(
        tracker.observations.map(periodicBeatSummary),
      ),
      finalObservation: this.lastObservation,
      executionProtocol: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
    });
  }

  runTransient(input: Readonly<{
    dtSec: number;
    stepCount: number;
  }>): MainWireScientificSessionTransientResultV1 {
    if (!Number.isInteger(input.stepCount) || input.stepCount < 0) {
      throw new Error("stepCount must be a non-negative integer");
    }
    const observations: MainWireScientificSessionObservationV1[] = [];
    for (let index = 0; index < input.stepCount; index += 1) {
      const result = this.step(input.dtSec);
      if (result.converged === false) {
        return Object.freeze({
          completed: false,
          requestedStepCount: input.stepCount,
          completedStepCount: observations.length,
          observations: Object.freeze(observations),
          finalObservation: this.lastObservation,
          failure: result,
        });
      }
      observations.push(result.observation);
    }
    return Object.freeze({
      completed: true,
      requestedStepCount: input.stepCount,
      completedStepCount: observations.length,
      observations: Object.freeze(observations),
      finalObservation: this.lastObservation,
      failure: null,
    });
  }

  async checkpointLegacyCanonicalExactV2():
  Promise<MainWireScientificSessionExactCheckpointV2> {
    if (this.sessionInput.sourceIntent.parameterOperations.length !== 0) {
      throw new Error(
        "checkpoint V2 is fixed-canonical-only; parameterized sessions require checkpoint V3",
      );
    }
    const payload = exactCheckpointPayload({
      checkpointId: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V2_ID,
      schemaVersion: 2 as const,
      releaseRef: copyReleaseRef(this.releaseRef),
      assembly: MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly,
      transaction: checkpointMainWireFiveWallNonCoronaryV1(
        this.dependencies.provider,
        this.acceptedState,
      ),
      periodicSettlementTracker: checkpointPeriodicTracker(
        this.dependencies.provider,
        this.periodicSettlementTracker,
      ),
      claim: Object.freeze({
        exactReleaseRequired: true as const,
        semanticReresolutionAllowedHere: false as const,
        derivedObservationStored: false as const,
        outerIntegrity: "canonical-json-sha256" as const,
        innerTransactionFingerprint:
          "transition-compatibility-only-non-authoritative" as const,
        periodicSettlementTrackerStored: true as const,
        periodicSettlementExactCommandContinuation: true as const,
      }),
    });
    return Object.freeze({
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    });
  }

  async checkpointExactV3():
  Promise<MainWireScientificSessionExactCheckpointV3> {
    return createMainWireScientificSessionExactCheckpointV3(
      {
        releaseRef: this.releaseRef,
        sessionInputSha256: this.sessionInputSha256,
      },
      {
        transaction: checkpointMainWireFiveWallNonCoronaryV1(
          this.dependencies.provider,
          this.acceptedState,
        ),
        periodicSettlementTracker: checkpointPeriodicTracker(
          this.dependencies.provider,
          this.periodicSettlementTracker,
        ),
      },
    );
  }

  async checkpointExact():
  Promise<MainWireScientificSessionExactCheckpointV3> {
    return this.checkpointExactV3();
  }

  private static constructCold(
    release: SimulationReleaseV1,
    sessionInput: MainWireScientificResolvedSessionInputV1,
  ): MainWireScientificSessionV1 {
    const dependencies = buildFixedAssemblyDependencies(sessionInput);
    if (
      sessionInput.initialization.initialTimeSec !== 0
      || sessionInput.initialization.initialRevision !== 0
    ) throw new Error("resolved cold initialization identity is unsupported");
    const cold = initializeMainWireFiveWallNonCoronaryV1({
      provider: dependencies.provider,
      runtime: dependencies.runtime,
      calciumDriveParams: dependencies.calciumDriveParams,
      pericardium: dependencies.pericardium,
      circulationInitial: Object.freeze({
        fixedTotalBloodVolumeMl:
          sessionInput.initialization.fixedTotalBloodVolumeMl,
        nodeVolumesMl: sessionInput.initialization.resolvedNodeVolumesMl,
      }),
    });
    return new MainWireScientificSessionV1(
      release.ref,
      sessionInput,
      dependencies,
      cold.acceptedState,
      coldObservation(release.ref, cold),
    );
  }
}

export async function createMainWireScientificSessionV1():
Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.createCanonical();
}

export async function initializeMainWireScientificSessionV1(
  untrustedRelease: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.initialize(untrustedRelease);
}

export async function initializeMainWireScientificSessionFromResolvedInputV1(
  untrustedRelease: unknown,
  untrustedSessionInput: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.initializeResolved(
    untrustedRelease,
    untrustedSessionInput,
  );
}

export async function restoreMainWireScientificSessionExactV2(
  untrustedRelease: unknown,
  checkpoint: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.restoreLegacyCanonicalExactV2(
    untrustedRelease,
    checkpoint,
  );
}

export async function restoreMainWireScientificSessionExactV3(
  untrustedRelease: unknown,
  untrustedSessionInput: unknown,
  checkpoint: unknown,
): Promise<MainWireScientificSessionV1> {
  return MainWireScientificSessionV1.restoreExact(
    untrustedRelease,
    untrustedSessionInput,
    checkpoint,
  );
}

function newPeriodicTracker(state: AcceptedState): PeriodicSettlementTracker {
  const observations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  return {
    anchorAcceptedTimeSec: state.acceptedTimeSec,
    anchorPhase01: cyclePhase01(state.acceptedTimeSec),
    boundaryStates: [state],
    observations,
    completedBeatCount: 0,
    status: "tracking",
    classification: classifyPeriodicTracker(observations),
  };
}

function checkpointPeriodicTracker(
  provider: MainWireNormalAdultFiveWallProviderV1,
  tracker: PeriodicSettlementTracker | null,
): MainWireScientificSessionPeriodicTrackerCheckpointV1 | null {
  if (tracker === null) return null;
  return Object.freeze({
    trackerCheckpointId:
      "main-wire-periodic-settlement-tracker-checkpoint-v1" as const,
    schemaVersion: 1 as const,
    anchorAcceptedTimeSec: tracker.anchorAcceptedTimeSec,
    anchorPhase01: tracker.anchorPhase01,
    completedBeatCount: tracker.completedBeatCount,
    boundaryTransactions: Object.freeze(tracker.boundaryStates.map((state) =>
      checkpointMainWireFiveWallNonCoronaryV1(provider, state))),
  });
}

function restorePeriodicTracker(
  provider: MainWireNormalAdultFiveWallProviderV1,
  acceptedState: AcceptedState,
  checkpoint: MainWireScientificSessionPeriodicTrackerCheckpointV1 | null,
): PeriodicSettlementTracker | null {
  if (checkpoint === null) return null;
  if (!isRecord(checkpoint) || !hasExactKeys(checkpoint, [
    "trackerCheckpointId",
    "schemaVersion",
    "anchorAcceptedTimeSec",
    "anchorPhase01",
    "completedBeatCount",
    "boundaryTransactions",
  ])) throw new Error("periodic settlement tracker checkpoint mismatch");
  if (
    checkpoint.trackerCheckpointId
      !== "main-wire-periodic-settlement-tracker-checkpoint-v1"
    || checkpoint.schemaVersion !== 1
    || !Number.isFinite(checkpoint.anchorAcceptedTimeSec)
    || checkpoint.anchorAcceptedTimeSec < 0
    || !Number.isFinite(checkpoint.anchorPhase01)
    || checkpoint.anchorPhase01 < 0
    || checkpoint.anchorPhase01 >= 1
    || !Number.isSafeInteger(checkpoint.completedBeatCount)
    || checkpoint.completedBeatCount < 0
    || checkpoint.completedBeatCount
      > MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.maximumBeatCount
    || !Array.isArray(checkpoint.boundaryTransactions)
  ) throw new Error("periodic settlement tracker checkpoint mismatch");
  const expectedBoundaryCount = Math.min(
    checkpoint.completedBeatCount + 1,
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.retainedBeatBoundaryCount,
  );
  if (checkpoint.boundaryTransactions.length !== expectedBoundaryCount) {
    throw new Error("periodic settlement tracker boundary count mismatch");
  }
  if (
    cyclePhaseDistance(
      cyclePhase01(checkpoint.anchorAcceptedTimeSec),
      checkpoint.anchorPhase01,
    ) > 1e-12
  ) throw new Error("periodic settlement tracker anchor phase mismatch");
  const boundaryStates = checkpoint.boundaryTransactions.map((transaction) =>
    restoreMainWireFiveWallNonCoronaryV1(provider, transaction));
  const latestTransaction = checkpoint.boundaryTransactions.at(-1)!;
  const acceptedTransaction = checkpointMainWireFiveWallNonCoronaryV1(
    provider,
    acceptedState,
  );
  if (
    latestTransaction.checkpointFingerprint
      !== acceptedTransaction.checkpointFingerprint
  ) throw new Error("periodic settlement tracker terminal state mismatch");
  boundaryStates[boundaryStates.length - 1] = acceptedState;
  const expectedTerminalTimeSec = checkpoint.anchorAcceptedTimeSec
    + checkpoint.completedBeatCount
      * MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.cycleLengthSec;
  if (Math.abs(acceptedState.acceptedTimeSec - expectedTerminalTimeSec) > 1e-9) {
    throw new Error("periodic settlement tracker terminal time mismatch");
  }
  for (let index = 0; index < boundaryStates.length; index += 1) {
    const state = boundaryStates[index]!;
    const expectedPhase = checkpoint.anchorPhase01;
    if (cyclePhaseDistance(cyclePhase01(state.acceptedTimeSec), expectedPhase) > 1e-9) {
      throw new Error("periodic settlement tracker boundary phase mismatch");
    }
    if (index > 0) {
      const elapsed = state.acceptedTimeSec
        - boundaryStates[index - 1]!.acceptedTimeSec;
      if (Math.abs(
        elapsed - MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.cycleLengthSec
      ) > 1e-9) {
        throw new Error("periodic settlement tracker boundary spacing mismatch");
      }
      if (
        state.revision - boundaryStates[index - 1]!.revision
          !== MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.stepsPerBeat
      ) throw new Error("periodic settlement tracker revision spacing mismatch");
    }
  }
  const observations = periodicObservationsFromBoundaries(
    boundaryStates,
    checkpoint.completedBeatCount,
  );
  const classification = classifyPeriodicTracker(observations);
  return {
    anchorAcceptedTimeSec: checkpoint.anchorAcceptedTimeSec,
    anchorPhase01: checkpoint.anchorPhase01,
    boundaryStates,
    observations,
    completedBeatCount: checkpoint.completedBeatCount,
    status: periodicStatus(classification, checkpoint.completedBeatCount),
    classification,
  };
}

function periodicObservationsFromBoundaries(
  boundaryStates: readonly AcceptedState[],
  completedBeatCount: number,
): MainWireFiveWallPeriodicBeatObservationV1[] {
  const firstBoundaryBeatIndex = completedBeatCount - boundaryStates.length + 1;
  const observations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  for (let index = 1; index < boundaryStates.length; index += 1) {
    const current = boundaryStates[index]!;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      current,
      boundaryStates[index - 1]!,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = index >= 2
      ? compareMainWireFiveWallAcceptedStatesV1(
        current,
        boundaryStates[index - 2]!,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      )
      : null;
    observations.push(Object.freeze({
      beatIndex: firstBoundaryBeatIndex + index,
      period1,
      period2,
    }));
  }
  trimFront(
    observations,
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.retainedClosureCount,
  );
  return observations;
}

function cyclePhase01(timeSec: number): number {
  const cycleLengthSec =
    MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.cycleLengthSec;
  const raw = timeSec / cycleLengthSec;
  const phase = raw - Math.floor(raw);
  return phase >= 1 - 1e-12 || phase < 1e-12 ? 0 : phase;
}

function cyclePhaseDistance(left: number, right: number): number {
  const direct = Math.abs(left - right);
  return Math.min(direct, 1 - direct);
}

function classifyPeriodicTracker(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): MainWireFiveWallPeriodicClassificationV1 {
  return classifyMainWireFiveWallPeriodicityV1(
    observations,
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  );
}

function periodicStatus(
  classification: MainWireFiveWallPeriodicClassificationV1,
  completedBeatCount: number,
): MainWireScientificPeriodicSettlementStatusV1 {
  if (classification.status === "period1-converged") {
    return "period1-converged";
  }
  if (classification.status === "period2-suspect") return "period2-suspect";
  if (
    completedBeatCount
      >= MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1.maximumBeatCount
  ) return "maximum-beats-reached";
  return "tracking";
}

function periodicStepFailure(
  completedStepCountThisCall: number,
  failure: Extract<
    MainWireScientificSessionStepResultV1,
    Readonly<{ converged: false }>
  >,
): Extract<MainWireScientificPeriodicSettlementResultV1, { completed: false }> {
  return Object.freeze({
    completed: false as const,
    status: "step-failure" as const,
    message: failure.message,
    acceptedStateUnchangedForFailedStep: true as const,
    periodicTrackerReset: true as const,
    completedStepCountThisCall,
    completedBeatCount: 0 as const,
    anchorAcceptedTimeSec: null,
    anchorPhase01: null,
    finalObservation: failure.observation,
    failure,
    executionProtocol: MAIN_WIRE_SCIENTIFIC_PERIODIC_SETTLEMENT_V1,
  });
}

function periodicBeatSummary(
  observation: MainWireFiveWallPeriodicBeatObservationV1,
): MainWireScientificPeriodicBeatSummaryV1 {
  return Object.freeze({
    beatIndex: observation.beatIndex,
    period1: periodicClosureSummary(observation.period1),
    period2: periodicClosureSummary(observation.period2),
  });
}

function periodicClosureSummary(
  report: MainWireFiveWallPeriodicClosureReportV1 | null,
): MainWireScientificPeriodicClosureSummaryV1 | null {
  if (report === null) return null;
  return Object.freeze({
    maximumNormalizedDelta: report.overall.maximumNormalizedDelta,
    worstGroup: report.overall.worstGroup,
    worstPath: report.overall.worstPath,
    elapsedTimeSec: report.elapsedTimeSec,
  });
}

function copyPeriodicClassification(
  classification: MainWireFiveWallPeriodicClassificationV1,
): MainWireFiveWallPeriodicClassificationV1 {
  return Object.freeze({
    ...classification,
    evidenceBeatIndices: Object.freeze([...classification.evidenceBeatIndices]),
  });
}

function trimFront<T>(values: T[], maximumLength: number): void {
  while (values.length > maximumLength) values.shift();
}

async function loadFixedAssemblyRelease(
  untrustedRelease: unknown,
): Promise<SimulationReleaseV1> {
  const [loaded, canonical] = await Promise.all([
    loadSimulationReleaseV1(untrustedRelease),
    loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
  ]);
  if (!sameSimulationReleaseRef(loaded.ref, canonical.ref)) {
    throw new Error(
      "scientific session release is valid but does not identify the fixed canonical assembly",
    );
  }
  return loaded;
}

function buildFixedAssemblyDependencies(
  sessionInput: MainWireScientificResolvedSessionInputV1,
): FixedAssemblyDependencies {
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  const expectedMechanics = sessionInput.resolvedParameters.mechanics;
  if (
    provider.providerId !== expectedMechanics.providerId
    || provider.parameterSetId !== expectedMechanics.parameterSetId
    || provider.parameterIdentityHash !== expectedMechanics.parameterIdentityHash
    || expectedMechanics.laSlsMode !== "on"
  ) throw new Error("resolved mechanics provider metadata mismatch");
  return Object.freeze({
    provider,
    runtime: sessionInput.resolvedParameters.circulationRuntime,
    pericardium:
      sessionInput.resolvedParameters.commonPericardium.resolvedBinding,
    calciumDriveParams:
      sessionInput.resolvedParameters.calciumDrive.fixedPrior as unknown as
        typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  });
}

async function canonicalHealthySessionInput(
  release: SimulationReleaseV1,
): Promise<MainWireScientificResolvedSessionInputV1> {
  return resolveMainWireScientificSessionInputV1(
    release,
    mainWireScientificSessionIntentV1(release.ref),
  );
}

function coldObservation(
  releaseRef: SimulationReleaseRef,
  cold: MainWireFiveWallNonCoronaryColdResultV1<MechanicsState>,
): MainWireScientificSessionObservationV1 {
  const state = cold.acceptedState;
  const pressureOffsetMmHg = cold.commonIntrathoracicPressureMmHg
    + cold.pericardium.excessPressureMmHg;
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    releaseRef: copyReleaseRef(releaseRef),
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    source: "cold-initialization" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: state.circulation.nodeVolumesMl[chamber],
      absolutePressureMmHg:
        cold.transmuralPressuresMmHg[chamber] + pressureOffsetMmHg,
      transmuralPressureMmHg: cold.transmuralPressuresMmHg[chamber],
      pressureAvailability: "available" as const,
    })),
    vascularPressure: vascularPressureRecord(() => Object.freeze({
      absolutePressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: null,
      openingFraction01:
        state.circulation.valveStates[valve].leafletOpeningFraction01,
      flowAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    pulmonaryVenousFlowMlPerSec: null,
    pulmonaryVenousFlowAvailability:
      "not-evaluated-at-accepted-state" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: null,
      mechanicsIterations: null,
      circulationScaledResidualInfinityNorm: null,
      maximumContinuityResidualMl: null,
      totalBloodVolumeErrorMl: 0,
      mechanicsCallbackCount: null,
      mechanicsCallbackCacheHits: null,
      commonPericardialExcessPressureMmHg:
        cold.pericardium.excessPressureMmHg,
    }),
  });
}

function acceptedStepObservation(
  releaseRef: SimulationReleaseRef,
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  revision: number,
): MainWireScientificSessionObservationV1 {
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    releaseRef: copyReleaseRef(releaseRef),
    revision,
    acceptedTimeSec: sample.timeSec,
    source: "accepted-step" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: sample.nodeVolumeMl[chamber],
      absolutePressureMmHg: sample.nodeAbsolutePressureMmHg[chamber],
      transmuralPressureMmHg: sample.chamberTransmuralPressureMmHg[chamber],
      pressureAvailability: "available" as const,
    })),
    vascularPressure: vascularPressureRecord((node) => Object.freeze({
      absolutePressureMmHg: sample.nodeAbsolutePressureMmHg[node],
      pressureAvailability: "available" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: sample.flowMlPerSec[valve],
      openingFraction01: sample.valveOpeningFraction01[valve],
      flowAvailability: "available" as const,
    })),
    pulmonaryVenousFlowMlPerSec: sample.flowMlPerSec.PVein_LA,
    pulmonaryVenousFlowAvailability: "available" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: sample.diagnostics.mechanicsResidualNorm,
      mechanicsIterations: sample.diagnostics.mechanicsIterations,
      circulationScaledResidualInfinityNorm:
        sample.diagnostics.circulationScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        sample.diagnostics.maximumContinuityResidualMl,
      totalBloodVolumeErrorMl: sample.diagnostics.totalBloodVolumeErrorMl,
      mechanicsCallbackCount: sample.diagnostics.mechanicsCallbackCount,
      mechanicsCallbackCacheHits:
        sample.diagnostics.mechanicsCallbackCacheHits,
      commonPericardialExcessPressureMmHg:
        sample.commonPericardium.excessPressureMmHg,
    }),
  });
}

function restoredObservation(
  releaseRef: SimulationReleaseRef,
  state: AcceptedState,
): MainWireScientificSessionObservationV1 {
  return Object.freeze({
    observationId: "main-wire-scientific-session-observation-v1" as const,
    sessionId: MAIN_WIRE_SCIENTIFIC_SESSION_V1_ID,
    releaseRef: copyReleaseRef(releaseRef),
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    source: "exact-checkpoint-restore" as const,
    chamber: chamberRecord((chamber) => Object.freeze({
      volumeMl: state.circulation.nodeVolumesMl[chamber],
      absolutePressureMmHg: null,
      transmuralPressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    vascularPressure: vascularPressureRecord(() => Object.freeze({
      absolutePressureMmHg: null,
      pressureAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    valve: valveRecord((valve) => Object.freeze({
      flowMlPerSec: null,
      openingFraction01:
        state.circulation.valveStates[valve].leafletOpeningFraction01,
      flowAvailability: "not-evaluated-at-accepted-state" as const,
    })),
    pulmonaryVenousFlowMlPerSec: null,
    pulmonaryVenousFlowAvailability:
      "not-evaluated-at-accepted-state" as const,
    diagnostics: Object.freeze({
      mechanicsResidualNorm: null,
      mechanicsIterations: null,
      circulationScaledResidualInfinityNorm: null,
      maximumContinuityResidualMl: null,
      totalBloodVolumeErrorMl: 0,
      mechanicsCallbackCount: null,
      mechanicsCallbackCacheHits: null,
      commonPericardialExcessPressureMmHg: null,
    }),
  });
}

async function validateExactCheckpointEnvelope(
  expectedReleaseRef: SimulationReleaseRef,
  checkpoint: unknown,
): Promise<MainWireScientificSessionExactCheckpointV2> {
  if (
    !isRecord(checkpoint)
    || !hasExactKeys(checkpoint, [
      "checkpointId",
      "schemaVersion",
      "releaseRef",
      "assembly",
      "transaction",
      "periodicSettlementTracker",
      "claim",
      "checkpointSha256",
    ])
    || !isRecord(checkpoint.transaction)
    || !isRecord(checkpoint.claim)
    || !hasExactKeys(checkpoint.claim, [
      "exactReleaseRequired",
      "semanticReresolutionAllowedHere",
      "derivedObservationStored",
      "outerIntegrity",
      "innerTransactionFingerprint",
      "periodicSettlementTrackerStored",
      "periodicSettlementExactCommandContinuation",
    ])
  ) {
    throw new Error("scientific session exact-checkpoint envelope mismatch");
  }
  const releaseIssues = simulationReleaseRefIssuesV1(checkpoint.releaseRef);
  if (
    checkpoint.checkpointId
      !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V2_ID
    || checkpoint.schemaVersion !== 2
    || checkpoint.assembly !== MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM.assembly
    || checkpoint.claim.exactReleaseRequired !== true
    || checkpoint.claim.semanticReresolutionAllowedHere !== false
    || checkpoint.claim.derivedObservationStored !== false
    || checkpoint.claim.outerIntegrity !== "canonical-json-sha256"
    || checkpoint.claim.innerTransactionFingerprint
      !== "transition-compatibility-only-non-authoritative"
    || checkpoint.claim.periodicSettlementTrackerStored !== true
    || checkpoint.claim.periodicSettlementExactCommandContinuation !== true
    || (
      checkpoint.periodicSettlementTracker !== null
      && !isRecord(checkpoint.periodicSettlementTracker)
    )
    || typeof checkpoint.checkpointSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(checkpoint.checkpointSha256)
    || releaseIssues.length > 0
  ) throw new Error("scientific session exact-checkpoint envelope mismatch");
  if (!sameSimulationReleaseRef(
    expectedReleaseRef,
    checkpoint.releaseRef as SimulationReleaseRef,
  )) {
    throw new Error("scientific session release identity mismatch");
  }
  const typed = checkpoint as unknown as
    MainWireScientificSessionExactCheckpointV2;
  const { checkpointSha256, ...payload } = typed;
  const expectedCheckpointSha256 = await sha256CanonicalJsonHex(payload);
  if (checkpointSha256 !== expectedCheckpointSha256) {
    throw new Error("scientific session exact-checkpoint outer SHA-256 mismatch");
  }
  return typed;
}

function exactCheckpointPayload(
  payload: MainWireScientificSessionExactCheckpointPayloadV2,
): MainWireScientificSessionExactCheckpointPayloadV2 {
  return Object.freeze(payload);
}

function copyReleaseRef(ref: SimulationReleaseRef): SimulationReleaseRef {
  return Object.freeze({
    id: ref.id,
    version: ref.version,
    sha256: ref.sha256,
  });
}

function assertSessionStateNotPromoted(
  current: AcceptedState,
  before: AcceptedState,
): void {
  if (
    current !== before
    || current.revision !== before.revision
    || current.acceptedTimeSec !== before.acceptedTimeSec
  ) throw new Error("failed scientific step promoted session state");
}

function assertObservationMatchesAcceptedState(
  releaseRef: SimulationReleaseRef,
  state: AcceptedState,
  observation: MainWireScientificSessionObservationV1,
): void {
  if (!sameSimulationReleaseRef(releaseRef, observation.releaseRef)) {
    throw new Error("observation release identity mismatch");
  }
  if (
    observation.revision !== state.revision
    || observation.acceptedTimeSec !== state.acceptedTimeSec
  ) throw new Error("observation accepted-state identity mismatch");
  if (!Number.isSafeInteger(observation.revision) || observation.revision < 0) {
    throw new Error("observation revision must be a non-negative safe integer");
  }
  requireFiniteObservationValue(
    observation.acceptedTimeSec,
    "observation.acceptedTimeSec",
  );
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    const value = observation.chamber[chamber];
    requireFiniteObservationValue(value.volumeMl, `${chamber}.volumeMl`);
    if (!(value.volumeMl > 0)) throw new Error(`${chamber}.volumeMl must be positive`);
    if (value.volumeMl !== state.circulation.nodeVolumesMl[chamber]) {
      throw new Error(`${chamber}.volumeMl does not match accepted state`);
    }
    assertAvailableObservationValue(
      value.absolutePressureMmHg,
      value.pressureAvailability,
      `${chamber}.absolutePressureMmHg`,
    );
    assertAvailableObservationValue(
      value.transmuralPressureMmHg,
      value.pressureAvailability,
      `${chamber}.transmuralPressureMmHg`,
    );
  }
  for (const node of ["Ao", "PA", "PVein"] as const) {
    const value = observation.vascularPressure[node];
    assertAvailableObservationValue(
      value.absolutePressureMmHg,
      value.pressureAvailability,
      `${node}.absolutePressureMmHg`,
    );
  }
  for (const valve of ["MV", "AoV", "TV", "PV"] as const) {
    const value = observation.valve[valve];
    requireFiniteObservationValue(
      value.openingFraction01,
      `${valve}.openingFraction01`,
    );
    if (value.openingFraction01 < 0 || value.openingFraction01 > 1) {
      throw new Error(`${valve}.openingFraction01 must be within [0, 1]`);
    }
    if (
      value.openingFraction01
        !== state.circulation.valveStates[valve].leafletOpeningFraction01
    ) throw new Error(`${valve}.openingFraction01 does not match accepted state`);
    assertAvailableObservationValue(
      value.flowMlPerSec,
      value.flowAvailability,
      `${valve}.flowMlPerSec`,
    );
  }
  assertAvailableObservationValue(
    observation.pulmonaryVenousFlowMlPerSec,
    observation.pulmonaryVenousFlowAvailability,
    "pulmonaryVenousFlowMlPerSec",
  );
  for (const [name, value] of Object.entries(observation.diagnostics)) {
    if (value !== null) requireFiniteObservationValue(value, `diagnostics.${name}`);
  }
}

function assertAvailableObservationValue(
  value: number | null,
  availability: MainWireScientificSessionSignalAvailabilityV1,
  label: string,
): void {
  if (availability === "available") {
    if (value === null) throw new Error(`${label} is available but null`);
    requireFiniteObservationValue(value, label);
    return;
  }
  if (value !== null) {
    throw new Error(`${label} is unevaluated but carries a value`);
  }
}

function requireFiniteObservationValue(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function chamberRecord<T>(
  build: (chamber: "LA" | "LV" | "RA" | "RV") => T,
): Readonly<Record<"LA" | "LV" | "RA" | "RV", T>> {
  return Object.freeze(Object.fromEntries(
    (["LA", "LV", "RA", "RV"] as const)
      .map((chamber) => [chamber, build(chamber)]),
  )) as Readonly<Record<"LA" | "LV" | "RA" | "RV", T>>;
}

function valveRecord<T>(
  build: (valve: "MV" | "AoV" | "TV" | "PV") => T,
): Readonly<Record<"MV" | "AoV" | "TV" | "PV", T>> {
  return Object.freeze(Object.fromEntries(
    (["MV", "AoV", "TV", "PV"] as const)
      .map((valve) => [valve, build(valve)]),
  )) as Readonly<Record<"MV" | "AoV" | "TV" | "PV", T>>;
}

function vascularPressureRecord<T>(
  build: (node: "Ao" | "PA" | "PVein") => T,
): Readonly<Record<"Ao" | "PA" | "PVein", T>> {
  return Object.freeze(Object.fromEntries(
    (["Ao", "PA", "PVein"] as const)
      .map((node) => [node, build(node)]),
  )) as Readonly<Record<"Ao" | "PA" | "PVein", T>>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}
