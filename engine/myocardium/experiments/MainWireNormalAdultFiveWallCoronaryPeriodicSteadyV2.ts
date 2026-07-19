import type {
  NonCoronaryCirculationNewtonOptionsV1,
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  type CoronaryBackwardEulerSolverOptionsV2,
  type CoronaryCollapseHydraulicsPriorV2,
  type CoronaryDiseaseInputV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  type MainWireCoronaryImpMechanismV2,
  type MainWireCoronaryShorteningImpGainPriorV2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import type {
  CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
  initializeMainWireFiveWallCoronaryV2,
  stepMainWireFiveWallCoronaryV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
  classifyMainWireFiveWallCoronaryPeriodicityV2,
  compareMainWireFiveWallCoronaryAcceptedStatesV2,
  type MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  type MainWireFiveWallCoronaryPeriodicBeatObservationV2,
  type MainWireFiveWallCoronaryPeriodicClassificationV2,
  type MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumBindingV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V2_ID =
  "main-wire-normal-adult-five-wall-coronary-periodic-steady-v2" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V2_ID =
  "main-wire-normal-adult-five-wall-coronary-periodic-protocol-identity-v2" as const;

/**
 * This runner pins the circulation solver policy explicitly instead of relying
 * on an unversioned internal default. It therefore participates in the source
 * protocol digest and is passed to every atomic step unchanged.
 */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2 =
  Object.freeze({
    maxIterations: 30,
    absoluteContinuityResidualToleranceMl: 1e-8,
    scaledResidualInfinityTolerance: 2e-10,
    scaledUpdateInfinityTolerance: 2e-11,
    finiteDifferenceScaledStep: 2e-6,
    maximumLineSearchBacktracks: 24,
    analyticJacobianFiniteDifferenceShadow: false,
  }) satisfies Required<NonCoronaryCirculationNewtonOptionsV1>;

/**
 * The V1 numerical tolerances are retained only as a provisional starting
 * policy. They are full-state numerical closure tolerances, not physiological
 * acceptance bands and not a release qualification.
 */
export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2 =
  Object.freeze({
    policyId: "provisional-full-accepted-state-periodic-policy-v2" as const,
    evidenceStatus: "provisional-not-release-acceptance" as const,
    period1NormalizedTolerance: 1e-3,
    period2NormalizedTolerance: 1e-3,
    period2MinimumPeriod1NormalizedDelta: 5e-3,
    consecutiveBeats: 3,
    defaultMaximumBeatCount: 32,
    defaultRetainedBoundaryCount: 3,
    minimumRetainedBoundaryCount: 3,
    referenceScaleSetId:
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2.scaleSetId,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V2 =
  Object.freeze({
    executionLane: "canonical-periodic-only" as const,
    rapidPresentationLaneUsed: false as const,
    exactAcceptedCycleBoundarySampling: true as const,
    completeAcceptedStateComparator: true as const,
    threeConsecutiveCanonicalObservationsRequired: true as const,
    period1Reference: "immediately-prior-cycle-boundary" as const,
    period2Reference: "two-cycle-boundaries-back" as const,
    ordinaryAtomicStepIterationOnly: true as const,
    waveformFittingApplied: false as const,
    physiologicalAcceptanceClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export type MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV2 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
  /** Includes the current and prior exact accepted cycle-boundary snapshots. */
  retainedBoundaryCount?: number;
}>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV2 =
  Readonly<{
    identityId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V2_ID;
    runnerId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V2_ID;
    transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID;
    evidenceRole: "canonical-periodic-protocol";
    providerIdentity: Readonly<{
      contractId: string;
      providerId: string;
      parameterSetId: string;
      parameterIdentityHash: string;
      stateSchemaVersion: number;
    }>;
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    calciumDrive: Readonly<{
      driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
      parameters: FiveWallNormalCalciumDriveParamsV1;
    }>;
    commonPericardium: MainWireCommonPericardiumBindingV1;
    coronary: Readonly<{
      prior: CoronaryTopologyPriorV2;
      collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
      impMechanism: MainWireCoronaryImpMechanismV2;
      shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2;
      disease: CoronaryDiseaseInputV2;
    }>;
    solvers: Readonly<{
      circulationNewton: Required<NonCoronaryCirculationNewtonOptionsV1>;
      coronaryBackwardEuler: CoronaryBackwardEulerSolverOptionsV2;
    }>;
    fixedGlobalTotalBloodVolumeMl: number;
    integration: Readonly<{
      dtSec: number;
      cycleLengthSec: number;
      exactStepsPerCycle: number;
      maximumBeatCount: number;
      retainedBoundaryCount: number;
      boundaryCapture: "accepted-state-after-exact-integer-step-count";
    }>;
    periodicity: Readonly<{
      closureId:
        typeof MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID;
      referenceScaleSetId: string;
      classifier: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2;
      toleranceStatus: "provisional-not-release-acceptance";
    }>;
    exclusions: Readonly<{
      rapidPresentationEvidence: true;
      waveformFitting: true;
      shootingOrAcceleration: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV2 = Readonly<{
  beatIndex: number;
  expectedBoundaryTimeSec: number;
  acceptedState: MainWireFiveWallCoronaryPeriodicAcceptedStateV2;
}>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicTerminationReasonV2 =
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached"
  | "step-failure";

export type MainWireNormalAdultFiveWallCoronaryPeriodicFailureV2 = Readonly<{
  reason: "atomic-step-rejected";
  beatIndex: number;
  stepWithinBeat: number;
  globalStepIndex: number;
  candidateTimeSec: number;
  message: string;
  circulationFailureReason: string;
  rollbackPreserved: boolean;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
}>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicResultV2 = Readonly<{
  experimentId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V2_ID;
  mode: "canonical-periodic-v2";
  protocolIdentity: MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV2;
  protocolIdentityHash: string;
  dtSec: number;
  cycleLengthSec: number;
  stepsPerBeat: number;
  requestedMaximumBeatCount: number;
  retainedBoundaryCount: number;
  completedBeatCount: number;
  attemptedStepCount: number;
  committedStepCount: number;
  terminationReason:
    MainWireNormalAdultFiveWallCoronaryPeriodicTerminationReasonV2;
  integrationCompletedWithoutFailure: boolean;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  terminalState: MainWireFiveWallCoronaryPeriodicAcceptedStateV2;
  observations:
    readonly MainWireFiveWallCoronaryPeriodicBeatObservationV2[];
  classification: MainWireFiveWallCoronaryPeriodicClassificationV2;
  retainedBoundaries:
    readonly MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV2[];
  failure: MainWireNormalAdultFiveWallCoronaryPeriodicFailureV2 | null;
  performance: Readonly<{
    wallTimeMs: number;
    clock: "performance-now" | "date-now";
  }>;
  policy:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V2;
}>;

type ResolvedProtocolV2 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  calciumDriveParams: FiveWallNormalCalciumDriveParamsV1;
  pericardium: MainWireCommonPericardiumBindingV1;
  coronaryPrior: CoronaryTopologyPriorV2;
  collapseHydraulics: CoronaryCollapseHydraulicsPriorV2;
  impMechanism: MainWireCoronaryImpMechanismV2;
  shorteningImpPrior: MainWireCoronaryShorteningImpGainPriorV2;
  coronaryDisease: CoronaryDiseaseInputV2;
  coronarySolverOptions: CoronaryBackwardEulerSolverOptionsV2;
  circulationNewtonOptions: Required<NonCoronaryCirculationNewtonOptionsV1>;
  fixedGlobalTotalBloodVolumeMl: number;
}>;

type ResolvedRunOptionsV2 = Readonly<{
  dtSec: number;
  cycleLengthSec: number;
  stepsPerBeat: number;
  maximumBeatCount: number;
  retainedBoundaryCount: number;
}>;

/**
 * Runs ordinary V2 atomic steps from a canonical cold start. The Promise is
 * intentional: the complete resolved source protocol is SHA-256-bound before
 * the first state is admitted as periodic evidence.
 */
export async function runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2(
  options: MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV2,
): Promise<MainWireNormalAdultFiveWallCoronaryPeriodicResultV2> {
  const wallClock = wallClockV2();
  const startedAt = wallClock.now();
  const protocol = resolveCanonicalProtocolV2();
  const resolved = resolveRunOptionsV2(
    options,
    protocol.calciumDriveParams.cycleLengthSec,
  );
  const classifierOptions = classifierOptionsV2();
  const protocolIdentity = buildProtocolIdentityV2(
    protocol,
    resolved,
    classifierOptions,
  );
  const protocolIdentityHash = await sha256CanonicalJsonHex(protocolIdentity);
  const cold = initializeMainWireFiveWallCoronaryV2({
    provider: protocol.provider,
    runtime: protocol.runtime,
    calciumDriveParams: protocol.calciumDriveParams,
    pericardium: protocol.pericardium,
    coronaryPrior: protocol.coronaryPrior,
    coronaryDisease: protocol.coronaryDisease,
    collapseHydraulics: protocol.collapseHydraulics,
    impMechanism: protocol.impMechanism,
    shorteningImpPrior: protocol.shorteningImpPrior,
    fixedGlobalTotalBloodVolumeMl: protocol.fixedGlobalTotalBloodVolumeMl,
  });

  let state = cold.acceptedState;
  const retainedBoundaries:
    MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV2[] = [
      boundaryRecordV2(0, 0, state),
    ];
  const comparisonHistory:
    MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV2[] = [
      retainedBoundaries[0]!,
    ];
  const observations: MainWireFiveWallCoronaryPeriodicBeatObservationV2[] = [];
  let classification = classifyMainWireFiveWallCoronaryPeriodicityV2(
    observations,
    classifierOptions,
  );
  let completedBeatCount = 0;
  let attemptedStepCount = 0;
  let committedStepCount = 0;
  let failure: MainWireNormalAdultFiveWallCoronaryPeriodicFailureV2 | null = null;

  beatLoop:
  for (let beatIndex = 1; beatIndex <= resolved.maximumBeatCount; beatIndex += 1) {
    for (
      let stepWithinBeat = 1;
      stepWithinBeat <= resolved.stepsPerBeat;
      stepWithinBeat += 1
    ) {
      attemptedStepCount += 1;
      const previous = state;
      const stepped = stepMainWireFiveWallCoronaryV2(
        protocol.provider,
        previous,
        {
          dtSec: resolved.dtSec,
          runtime: protocol.runtime,
          calciumDriveParams: protocol.calciumDriveParams,
          pericardium: protocol.pericardium,
          coronaryPrior: protocol.coronaryPrior,
          coronaryDisease: protocol.coronaryDisease,
          collapseHydraulics: protocol.collapseHydraulics,
          impMechanism: protocol.impMechanism,
          shorteningImpPrior: protocol.shorteningImpPrior,
          coronarySolverOptions: protocol.coronarySolverOptions,
          circulationNewtonOptions: protocol.circulationNewtonOptions,
        },
      );
      if (stepped.converged === false) {
        failure = Object.freeze({
          reason: "atomic-step-rejected" as const,
          beatIndex,
          stepWithinBeat,
          globalStepIndex: attemptedStepCount,
          candidateTimeSec: previous.acceptedTimeSec + resolved.dtSec,
          message: stepped.message,
          circulationFailureReason: stepped.circulationFailureReason,
          rollbackPreserved: acceptedTupleJsonV2(stepped.rollbackState)
            === acceptedTupleJsonV2(previous),
          mechanicsCommitted: stepped.mechanicsCommitted,
          circulationCommitted: stepped.circulationCommitted,
          coronaryCommitted: stepped.coronaryCommitted,
          mvcReferenceCommitted: stepped.mvcReferenceCommitted,
        });
        break beatLoop;
      }
      state = stepped.acceptedState;
      committedStepCount += 1;
    }

    const expectedBoundaryTimeSec = beatIndex * resolved.cycleLengthSec;
    assertExactAcceptedBoundaryV2(
      state,
      expectedBoundaryTimeSec,
      committedStepCount,
    );
    completedBeatCount = beatIndex;
    const currentBoundary = boundaryRecordV2(
      beatIndex,
      expectedBoundaryTimeSec,
      state,
    );
    const previousBoundary = comparisonHistory.at(-1)!;
    const twoBackBoundary = comparisonHistory.length >= 2
      ? comparisonHistory.at(-2)!
      : null;
    const period1 = compareMainWireFiveWallCoronaryAcceptedStatesV2(
      currentBoundary.acceptedState,
      previousBoundary.acceptedState,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    );
    const period2 = twoBackBoundary === null
      ? null
      : compareMainWireFiveWallCoronaryAcceptedStatesV2(
        currentBoundary.acceptedState,
        twoBackBoundary.acceptedState,
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
      );
    observations.push(Object.freeze({
      beatIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash,
      period1,
      period2,
    }));
    classification = classifyMainWireFiveWallCoronaryPeriodicityV2(
      observations,
      classifierOptions,
    );

    comparisonHistory.push(currentBoundary);
    if (comparisonHistory.length > 3) comparisonHistory.shift();
    retainedBoundaries.push(currentBoundary);
    if (retainedBoundaries.length > resolved.retainedBoundaryCount) {
      retainedBoundaries.shift();
    }
    if (classification.status !== "not-converged") break;
  }

  const terminationReason = failure !== null
    ? "step-failure" as const
    : classification.status === "period1-converged"
      ? "period1-converged" as const
      : classification.status === "period2-suspect"
        ? "period2-suspect" as const
        : "maximum-beats-reached" as const;
  return Object.freeze({
    experimentId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V2_ID,
    mode: "canonical-periodic-v2" as const,
    protocolIdentity,
    protocolIdentityHash,
    dtSec: resolved.dtSec,
    cycleLengthSec: resolved.cycleLengthSec,
    stepsPerBeat: resolved.stepsPerBeat,
    requestedMaximumBeatCount: resolved.maximumBeatCount,
    retainedBoundaryCount: resolved.retainedBoundaryCount,
    completedBeatCount,
    attemptedStepCount,
    committedStepCount,
    terminationReason,
    integrationCompletedWithoutFailure: failure === null,
    periodicSteadyStateClaimed:
      failure === null && classification.status === "period1-converged",
    period2OrbitSuspected:
      failure === null && classification.status === "period2-suspect",
    terminalState: state,
    observations: Object.freeze(observations),
    classification,
    retainedBoundaries: Object.freeze(retainedBoundaries),
    failure,
    performance: Object.freeze({
      wallTimeMs: wallClock.now() - startedAt,
      clock: wallClock.clock,
    }),
    policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V2,
  });
}

function resolveCanonicalProtocolV2(): ResolvedProtocolV2 {
  return Object.freeze({
    provider: createCanonicalMainWireNormalAdultFiveWallProviderV1(),
    runtime: normalAdultMainWireRuntimeV1(),
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium: createMainWireNormalAdultCommonPericardiumV1(),
    coronaryPrior: MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    coronaryDisease: NORMAL_CORONARY_DISEASE_INPUT_V2,
    coronarySolverOptions:
      DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
    circulationNewtonOptions:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
    fixedGlobalTotalBloodVolumeMl:
      MAIN_WIRE_NORMAL_ADULT_BLOOD_VOLUME_PROVENANCE_V1
        .fullGraphReferenceTotalBloodVolumeMl,
  });
}

function classifierOptionsV2():
MainWireFiveWallCoronaryPeriodicClassifierOptionsV2 {
  const policy =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2;
  return Object.freeze({
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

function resolveRunOptionsV2(
  options: MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV2,
  cycleLengthSec: number,
): ResolvedRunOptionsV2 {
  if (!Number.isFinite(options.dtSec) || options.dtSec <= 0) {
    throw new RangeError("dtSec must be positive and finite");
  }
  if (!Number.isFinite(cycleLengthSec) || cycleLengthSec <= 0) {
    throw new RangeError("calcium cycleLengthSec must be positive and finite");
  }
  const ratio = cycleLengthSec / options.dtSec;
  const stepsPerBeat = Math.round(ratio);
  const exactDivisionError = Math.abs(
    stepsPerBeat * options.dtSec - cycleLengthSec,
  );
  const divisionTolerance = 1e-12 * Math.max(1, cycleLengthSec);
  if (
    stepsPerBeat <= 0
    || Math.abs(ratio - stepsPerBeat) > 1e-12 * Math.max(1, ratio)
    || exactDivisionError > divisionTolerance
  ) {
    throw new RangeError(
      "dtSec must divide the calcium cycleLengthSec into an exact integer step count",
    );
  }
  const maximumBeatCount = options.maximumBeatCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .defaultMaximumBeatCount;
  const retainedBoundaryCount = options.retainedBoundaryCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .defaultRetainedBoundaryCount;
  requirePositiveIntegerV2(maximumBeatCount, "maximumBeatCount");
  requirePositiveIntegerV2(retainedBoundaryCount, "retainedBoundaryCount");
  if (
    retainedBoundaryCount
    < MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2
      .minimumRetainedBoundaryCount
  ) {
    throw new RangeError(
      "retainedBoundaryCount must retain at least current, P1, and P2 boundaries",
    );
  }
  return Object.freeze({
    dtSec: options.dtSec,
    cycleLengthSec,
    stepsPerBeat,
    maximumBeatCount,
    retainedBoundaryCount,
  });
}

function buildProtocolIdentityV2(
  protocol: ResolvedProtocolV2,
  resolved: ResolvedRunOptionsV2,
  classifier: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
): MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV2 {
  return Object.freeze({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V2_ID,
    runnerId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V2_ID,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    evidenceRole: "canonical-periodic-protocol" as const,
    providerIdentity: Object.freeze({
      contractId: protocol.provider.contractId,
      providerId: protocol.provider.providerId,
      parameterSetId: protocol.provider.parameterSetId,
      parameterIdentityHash: protocol.provider.parameterIdentityHash,
      stateSchemaVersion: protocol.provider.stateSchemaVersion,
    }),
    runtime: protocol.runtime,
    calciumDrive: Object.freeze({
      driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
      parameters: protocol.calciumDriveParams,
    }),
    commonPericardium: protocol.pericardium,
    coronary: Object.freeze({
      prior: protocol.coronaryPrior,
      collapseHydraulics: protocol.collapseHydraulics,
      impMechanism: protocol.impMechanism,
      shorteningImpPrior: protocol.shorteningImpPrior,
      disease: protocol.coronaryDisease,
    }),
    solvers: Object.freeze({
      circulationNewton: protocol.circulationNewtonOptions,
      coronaryBackwardEuler: protocol.coronarySolverOptions,
    }),
    fixedGlobalTotalBloodVolumeMl: protocol.fixedGlobalTotalBloodVolumeMl,
    integration: Object.freeze({
      dtSec: resolved.dtSec,
      cycleLengthSec: resolved.cycleLengthSec,
      exactStepsPerCycle: resolved.stepsPerBeat,
      maximumBeatCount: resolved.maximumBeatCount,
      retainedBoundaryCount: resolved.retainedBoundaryCount,
      boundaryCapture:
        "accepted-state-after-exact-integer-step-count" as const,
    }),
    periodicity: Object.freeze({
      closureId: MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V2_ID,
      referenceScaleSetId:
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2.scaleSetId,
      classifier,
      toleranceStatus: "provisional-not-release-acceptance" as const,
    }),
    exclusions: Object.freeze({
      rapidPresentationEvidence: true as const,
      waveformFitting: true as const,
      shootingOrAcceleration: true as const,
    }),
  });
}

function boundaryRecordV2(
  beatIndex: number,
  expectedBoundaryTimeSec: number,
  acceptedState: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
): MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV2 {
  return Object.freeze({
    beatIndex,
    expectedBoundaryTimeSec,
    acceptedState,
  });
}

function assertExactAcceptedBoundaryV2(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
  expectedTimeSec: number,
  expectedRevision: number,
): void {
  const acceptedTimes = Object.freeze([
    state.acceptedTimeSec,
    state.circulation.acceptedTimeSec,
    state.coronary.acceptedTimeSec,
    state.mechanics.acceptedTimeSec,
  ]);
  if (acceptedTimes.some((timeSec) => !Number.isFinite(timeSec))) {
    throw new Error("atomic V2 accepted boundary time was not finite");
  }
  if (acceptedTimes.some((timeSec) => !Object.is(timeSec, state.acceptedTimeSec))) {
    throw new Error(
      "atomic V2 accepted owners did not share one exact boundary clock",
    );
  }
  const timeTolerance = acceptedBoundaryTimeToleranceSecV2(
    expectedTimeSec,
    expectedRevision,
  );
  if (Math.abs(state.acceptedTimeSec - expectedTimeSec) > timeTolerance) {
    throw new Error(
      "atomic V2 accepted state did not land on the exact counted cycle boundary",
    );
  }
  if (
    state.revision !== expectedRevision
    || state.circulation.revision !== expectedRevision
    || state.coronary.revision !== expectedRevision
    || state.mechanics.revision !== expectedRevision
  ) {
    throw new Error(
      "atomic V2 accepted owners did not share the exact counted boundary revision",
    );
  }
}

/**
 * Error budget for a clock obtained by sequentially adding a positive fixed
 * time step. The Higham gamma bound scales with the actual committed step
 * count; a fixed multiple of EPSILON is not valid for a many-beat run.
 *
 * This only admits floating-point accumulation error. Exact owner-clock
 * identity and exact integer revision identity are checked separately.
 */
export function acceptedBoundaryTimeToleranceSecV2(
  expectedTimeSec: number,
  committedStepCount: number,
): number {
  requireNonnegativeFiniteV2(expectedTimeSec, "expectedTimeSec");
  requirePositiveIntegerV2(committedStepCount, "committedStepCount");
  const unitRoundoff = Number.EPSILON / 2;
  const accumulatedRoundoff = committedStepCount * unitRoundoff;
  if (accumulatedRoundoff >= 1) {
    throw new RangeError("committedStepCount is too large for a finite gamma bound");
  }
  const gamma = accumulatedRoundoff / (1 - accumulatedRoundoff);
  const expectedTimeRounding = 4 * Number.EPSILON
    * Math.max(1, Math.abs(expectedTimeSec));
  return gamma * Math.abs(expectedTimeSec) + expectedTimeRounding;
}

function acceptedTupleJsonV2(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
): string {
  return JSON.stringify(state);
}

function requirePositiveIntegerV2(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function requireNonnegativeFiniteV2(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be nonnegative and finite`);
  }
}

function wallClockV2(): Readonly<{
  now: () => number;
  clock: "performance-now" | "date-now";
}> {
  if (globalThis.performance !== undefined
      && typeof globalThis.performance.now === "function") {
    return Object.freeze({
      now: () => globalThis.performance.now(),
      clock: "performance-now" as const,
    });
  }
  return Object.freeze({
    now: () => Date.now(),
    clock: "date-now" as const,
  });
}
