import type {
  NonCoronaryCirculationNewtonOptionsV1,
  NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  DEFAULT_CORONARY_BACKWARD_EULER_SOLVER_OPTIONS_V2,
  NORMAL_CORONARY_DISEASE_INPUT_V2,
  type CoronaryAcceptedHydraulicStateV2,
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
  CORONARY_ACCEPTED_AUTOREGULATION_BINDING_V3_ID,
  createDefaultCoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
  initializeMainWireFiveWallCoronaryV3,
  stepMainWireFiveWallCoronaryV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  type FiveWallNormalCalciumDriveParamsV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  classifyMainWireFiveWallCoronaryPeriodicityV3,
  compareMainWireFiveWallCoronaryAcceptedStatesV3,
  type MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  type MainWireFiveWallCoronaryPeriodicBeatObservationV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";
import type {
  MainWireFiveWallCoronaryPeriodicClassificationV2,
  MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_CIRCULATION_NEWTON_POLICY_V2,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
  acceptedBoundaryTimeToleranceSecV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCoronaryPeriodicSteadyV2";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
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
import type {
  WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V3_ID =
  "main-wire-normal-adult-five-wall-coronary-periodic-steady-v3" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PROFILE_IDENTITY_V3_ID =
  "main-wire-normal-adult-five-wall-coronary-profile-identity-v3" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V3_ID =
  "main-wire-normal-adult-five-wall-coronary-periodic-protocol-identity-v3" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3 =
  Object.freeze({
    ...MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V2,
    policyId: "provisional-full-accepted-state-periodic-policy-v3" as const,
    minimumRetainedBoundaryCount: 3,
    boundedSmokeDefaultMaximumBeatCount: 1,
    boundedSmokeMaximumBeatCount: 2,
    boundedSmokeMaximumStepCount: 2_000,
    referenceScaleSetId:
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3.scaleSetId,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V3 =
  Object.freeze({
    executionLane: "accepted-physical-time-autoregulation-v3" as const,
    ordinaryAtomicStepIterationOnly: true as const,
    exactAcceptedCycleBoundarySampling: true as const,
    autoregulationWindowAdvancedInsideAcceptedTransaction: true as const,
    autoregulationWindowEmptyAtComparedSinusBoundaries: true as const,
    completeAcceptedStateComparator: true as const,
    protocolAndProfileSha256Bound: true as const,
    constructionSeedIsIndependentValidation: false as const,
    constructionSeedInheritsPeriodicEvidence: false as const,
    restingFlowConstructionTargetCountedAsValidation: false as const,
    independentValidationClaimed: false as const,
    waveformFittingApplied: false as const,
    shootingOrAccelerationApplied: false as const,
    physiologicalAcceptanceClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export type MainWireNormalAdultFiveWallCoronaryInitializationV3 =
  | Readonly<{
    kind: "canonical-cold-start";
  }>
  | Readonly<{
    kind: "construction-seed";
    seedId: string;
    sourceArtifactId: string;
    coronaryHydraulicState: CoronaryAcceptedHydraulicStateV2;
  }>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV3 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
  /** Includes the current and prior exact accepted cycle-boundary snapshots. */
  retainedBoundaryCount?: number;
  executionPurpose?: "canonical-evidence" | "bounded-smoke";
  initialization?: MainWireNormalAdultFiveWallCoronaryInitializationV3;
}>;

export type MainWireNormalAdultFiveWallCoronaryProfileIdentityV3 = Readonly<{
  identityId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PROFILE_IDENTITY_V3_ID;
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
  autoregulation: Readonly<{
    bindingId: typeof CORONARY_ACCEPTED_AUTOREGULATION_BINDING_V3_ID;
    law: "integral-flow-homeostasis-v2";
    prior: typeof NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2;
    defaultControl:
      ReturnType<typeof createDefaultCoronaryAutoregulationWindowControlV3>;
    flowObservable: "final-candidate-layer-qm-internal-flow-ml-per-sec";
    perfusionPressureObservable:
      "final-candidate-post-focal-lesion-pressure-minus-common-cv-pressure";
    quadrature: "backward-euler-right-endpoint";
  }>;
  solvers: Readonly<{
    circulationNewton: Required<NonCoronaryCirculationNewtonOptionsV1>;
    coronaryBackwardEuler: CoronaryBackwardEulerSolverOptionsV2;
  }>;
  fixedGlobalTotalBloodVolumeMl: number;
}>;

export type MainWireNormalAdultFiveWallCoronaryInitializationProvenanceV3 =
  | Readonly<{
    kind: "canonical-cold-start";
    initialAcceptedStateHash: string;
    constructionSeedHydraulicStateHash: null;
    evidenceClassification:
      "protocol-execution-not-itself-independent-validation";
    independentValidationEligible: true;
    fullAcceptedStateWarmStart: false;
    coronaryHydraulicConstructionSeed: false;
    inheritedPeriodicEvidence: false;
    restingFlowTargetUsedAsValidation: false;
  }>
  | Readonly<{
    kind: "construction-seed";
    seedId: string;
    sourceArtifactId: string;
    initialAcceptedStateHash: string;
    constructionSeedHydraulicStateHash: string;
    evidenceClassification:
      "coronary-hydraulic-construction-seed-only-not-independent-validation";
    independentValidationEligible: false;
    fullAcceptedStateWarmStart: false;
    coronaryHydraulicConstructionSeed: true;
    inheritedPeriodicEvidence: false;
    restingFlowTargetUsedAsValidation: false;
  }>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV3 =
  Readonly<{
    identityId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V3_ID;
    runnerId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V3_ID;
    transactionId: typeof MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID;
    executionPurpose: "canonical-evidence" | "bounded-smoke";
    profileIdentity: MainWireNormalAdultFiveWallCoronaryProfileIdentityV3;
    profileIdentityHash: string;
    initialization:
      MainWireNormalAdultFiveWallCoronaryInitializationProvenanceV3;
    integration: Readonly<{
      dtSec: number;
      cycleLengthSec: number;
      exactStepsPerCycle: number;
      maximumBeatCount: number;
      retainedBoundaryCount: number;
      boundaryCapture: "accepted-state-after-exact-integer-step-count";
      boundedSmokeStepLimit: number | null;
    }>;
    periodicity: Readonly<{
      closureId:
        typeof MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID;
      referenceScaleSetId: string;
      classifier: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2;
      rhythmInterpretation: "periodic-sinus-cycle-aligned";
      toleranceStatus: "provisional-not-release-acceptance";
    }>;
    exclusions: Readonly<{
      independentValidationClaim: true;
      waveformFitting: true;
      shootingOrAcceleration: true;
      offlineAutoregulationShadow: true;
    }>;
  }>;

export type MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV3 = Readonly<{
  beatIndex: number;
  expectedBoundaryTimeSec: number;
  acceptedState: MainWireFiveWallCoronaryPeriodicAcceptedStateV3;
}>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicTerminationReasonV3 =
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached"
  | "step-failure";

export type MainWireNormalAdultFiveWallCoronaryPeriodicFailureV3 = Readonly<{
  reason: "atomic-step-rejected";
  beatIndex: number;
  stepWithinBeat: number;
  globalStepIndex: number;
  candidateTimeSec: number;
  message: string;
  transactionFailureReason: string;
  circulationFailureReason: string | null;
  rollbackPreserved: boolean;
  mechanicsCommitted: false;
  circulationCommitted: false;
  coronaryCommitted: false;
  mvcReferenceCommitted: false;
  autoregulationCommitted: false;
}>;

export type MainWireNormalAdultFiveWallCoronaryPeriodicResultV3 = Readonly<{
  experimentId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V3_ID;
  mode: "canonical-periodic-v3-accepted-autoregulation";
  executionPurpose: "canonical-evidence" | "bounded-smoke";
  profileIdentityHash: string;
  protocolIdentity: MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV3;
  protocolIdentityHash: string;
  initializationProvenance:
    MainWireNormalAdultFiveWallCoronaryInitializationProvenanceV3;
  dtSec: number;
  cycleLengthSec: number;
  stepsPerBeat: number;
  requestedMaximumBeatCount: number;
  retainedBoundaryCount: number;
  completedBeatCount: number;
  attemptedStepCount: number;
  committedStepCount: number;
  completedAutoregulationWindowCount: number;
  terminationReason:
    MainWireNormalAdultFiveWallCoronaryPeriodicTerminationReasonV3;
  integrationCompletedWithoutFailure: boolean;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  independentValidationClaimed: false;
  terminalState: MainWireFiveWallCoronaryPeriodicAcceptedStateV3;
  observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV3[];
  classification: MainWireFiveWallCoronaryPeriodicClassificationV2;
  retainedBoundaries:
    readonly MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV3[];
  failure: MainWireNormalAdultFiveWallCoronaryPeriodicFailureV3 | null;
  performance: Readonly<{
    wallTimeMs: number;
    clock: "performance-now" | "date-now";
  }>;
  policy:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3;
  claim:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V3;
}>;

type ResolvedProtocolV3 = Readonly<{
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

type ResolvedRunOptionsV3 = Readonly<{
  dtSec: number;
  cycleLengthSec: number;
  stepsPerBeat: number;
  maximumBeatCount: number;
  retainedBoundaryCount: number;
  executionPurpose: "canonical-evidence" | "bounded-smoke";
  initialization: MainWireNormalAdultFiveWallCoronaryInitializationV3;
}>;

/**
 * Runs only ordinary V3 accepted transactions. Autoregulation is therefore
 * integrated in physical accepted time; no offline beat shadow, shooting, or
 * post-hoc tone fitting participates in this protocol.
 */
export async function runMainWireNormalAdultFiveWallCoronaryPeriodicSteadyV3(
  options: MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV3,
): Promise<MainWireNormalAdultFiveWallCoronaryPeriodicResultV3> {
  const wallClock = wallClockV3();
  const startedAt = wallClock.now();
  const protocol = resolveCanonicalProtocolV3();
  const resolved = resolveRunOptionsV3(
    options,
    protocol.calciumDriveParams.cycleLengthSec,
  );
  const classifierOptions = classifierOptionsV3();
  const profileIdentity = buildProfileIdentityV3(protocol);
  const profileIdentityHash = await sha256CanonicalJsonHex(profileIdentity);
  const constructionSeed = await resolveConstructionSeedV3(
    resolved.initialization,
  );
  const cold = initializeMainWireFiveWallCoronaryV3({
    provider: protocol.provider,
    runtime: protocol.runtime,
    calciumDriveParams: protocol.calciumDriveParams,
    pericardium: protocol.pericardium,
    coronaryInitial: constructionSeed.coronaryInitial,
    coronaryPrior: protocol.coronaryPrior,
    coronaryDisease: protocol.coronaryDisease,
    collapseHydraulics: protocol.collapseHydraulics,
    impMechanism: protocol.impMechanism,
    shorteningImpPrior: protocol.shorteningImpPrior,
    fixedGlobalTotalBloodVolumeMl: protocol.fixedGlobalTotalBloodVolumeMl,
    autoregulationWindow: Object.freeze({
      durationSec: resolved.cycleLengthSec,
      interpretation: "periodic-sinus-cycle-aligned" as const,
    }),
  });
  const initialAcceptedStateHash = await hashAcceptedStateV3(
    cold.acceptedState,
    protocol.provider,
  );
  const initializationProvenance = constructionSeed.provenance(
    initialAcceptedStateHash,
  );
  const protocolIdentity = buildProtocolIdentityV3(
    profileIdentity,
    profileIdentityHash,
    initializationProvenance,
    resolved,
    classifierOptions,
  );
  const protocolIdentityHash = await sha256CanonicalJsonHex(protocolIdentity);

  let state = cold.acceptedState;
  assertExactAcceptedBoundaryV3(state, 0, 0, 0);
  const retainedBoundaries:
    MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV3[] = [
      boundaryRecordV3(0, 0, state),
    ];
  const comparisonHistory:
    MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV3[] = [
      retainedBoundaries[0]!,
    ];
  const observations: MainWireFiveWallCoronaryPeriodicBeatObservationV3[] = [];
  let classification = periodicClassificationV3(
    observations,
    classifierOptions,
  );
  let completedBeatCount = 0;
  let attemptedStepCount = 0;
  let committedStepCount = 0;
  let completedAutoregulationWindowCount = 0;
  let failure: MainWireNormalAdultFiveWallCoronaryPeriodicFailureV3 | null = null;

  beatLoop:
  for (let beatIndex = 1; beatIndex <= resolved.maximumBeatCount; beatIndex += 1) {
    for (
      let stepWithinBeat = 1;
      stepWithinBeat <= resolved.stepsPerBeat;
      stepWithinBeat += 1
    ) {
      attemptedStepCount += 1;
      const previous = state;
      const stepped = stepMainWireFiveWallCoronaryV3(
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
        const baseFailure = stepped.baseStep.converged === false
          ? stepped.baseStep
          : null;
        failure = Object.freeze({
          reason: "atomic-step-rejected" as const,
          beatIndex,
          stepWithinBeat,
          globalStepIndex: attemptedStepCount,
          candidateTimeSec: previous.acceptedTimeSec + resolved.dtSec,
          message: stepped.message,
          transactionFailureReason: stepped.reason,
          circulationFailureReason:
            baseFailure?.circulationFailureReason ?? null,
          rollbackPreserved: acceptedTupleJsonV3(stepped.rollbackState)
            === acceptedTupleJsonV3(previous),
          mechanicsCommitted: stepped.mechanicsCommitted,
          circulationCommitted: stepped.circulationCommitted,
          coronaryCommitted: stepped.coronaryCommitted,
          mvcReferenceCommitted: stepped.mvcReferenceCommitted,
          autoregulationCommitted: stepped.autoregulationCommitted,
        });
        break beatLoop;
      }
      state = stepped.acceptedState;
      committedStepCount += 1;
      if (stepped.autoregulationWindowCompleted) {
        completedAutoregulationWindowCount += 1;
      }
    }

    const expectedBoundaryTimeSec = beatIndex * resolved.cycleLengthSec;
    assertExactAcceptedBoundaryV3(
      state,
      expectedBoundaryTimeSec,
      committedStepCount,
      beatIndex,
    );
    completedBeatCount = beatIndex;
    const currentBoundary = boundaryRecordV3(
      beatIndex,
      expectedBoundaryTimeSec,
      state,
    );
    const previousBoundary = comparisonHistory.at(-1)!;
    const twoBackBoundary = comparisonHistory.length >= 2
      ? comparisonHistory.at(-2)!
      : null;
    const period1 = compareMainWireFiveWallCoronaryAcceptedStatesV3(
      currentBoundary.acceptedState,
      previousBoundary.acceptedState,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    );
    const period2 = twoBackBoundary === null
      ? null
      : compareMainWireFiveWallCoronaryAcceptedStatesV3(
        currentBoundary.acceptedState,
        twoBackBoundary.acceptedState,
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      );
    observations.push(Object.freeze({
      beatIndex,
      evidenceRole: "canonical-periodic-protocol" as const,
      protocolIdentityHash,
      period1,
      period2,
    }));
    classification = periodicClassificationV3(
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
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V3_ID,
    mode: "canonical-periodic-v3-accepted-autoregulation" as const,
    executionPurpose: resolved.executionPurpose,
    profileIdentityHash,
    protocolIdentity,
    protocolIdentityHash,
    initializationProvenance,
    dtSec: resolved.dtSec,
    cycleLengthSec: resolved.cycleLengthSec,
    stepsPerBeat: resolved.stepsPerBeat,
    requestedMaximumBeatCount: resolved.maximumBeatCount,
    retainedBoundaryCount: resolved.retainedBoundaryCount,
    completedBeatCount,
    attemptedStepCount,
    committedStepCount,
    completedAutoregulationWindowCount,
    terminationReason,
    integrationCompletedWithoutFailure: failure === null,
    periodicSteadyStateClaimed:
      resolved.executionPurpose === "canonical-evidence"
      && failure === null
      && classification.status === "period1-converged",
    period2OrbitSuspected:
      failure === null && classification.status === "period2-suspect",
    independentValidationClaimed: false as const,
    terminalState: state,
    observations: Object.freeze(observations),
    classification,
    retainedBoundaries: Object.freeze(retainedBoundaries),
    failure,
    performance: Object.freeze({
      wallTimeMs: wallClock.now() - startedAt,
      clock: wallClock.clock,
    }),
    policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_CLAIM_V3,
  });
}

function resolveCanonicalProtocolV3(): ResolvedProtocolV3 {
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

function classifierOptionsV3():
MainWireFiveWallCoronaryPeriodicClassifierOptionsV2 {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3;
  return Object.freeze({
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

function resolveRunOptionsV3(
  options: MainWireNormalAdultFiveWallCoronaryPeriodicOptionsV3,
  cycleLengthSec: number,
): ResolvedRunOptionsV3 {
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
  if (stepsPerBeat <= 0
    || Math.abs(ratio - stepsPerBeat) > 1e-12 * Math.max(1, ratio)
    || exactDivisionError > divisionTolerance) {
    throw new RangeError(
      "dtSec must divide the calcium cycleLengthSec into an exact integer step count",
    );
  }
  const executionPurpose = options.executionPurpose ?? "canonical-evidence";
  if (executionPurpose !== "canonical-evidence"
    && executionPurpose !== "bounded-smoke") {
    throw new RangeError("unsupported periodic V3 executionPurpose");
  }
  const maximumBeatCount = options.maximumBeatCount
    ?? (executionPurpose === "bounded-smoke"
      ? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3
        .boundedSmokeDefaultMaximumBeatCount
      : MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3
        .defaultMaximumBeatCount);
  const retainedBoundaryCount = options.retainedBoundaryCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3
      .defaultRetainedBoundaryCount;
  requirePositiveIntegerV3(maximumBeatCount, "maximumBeatCount");
  requirePositiveIntegerV3(retainedBoundaryCount, "retainedBoundaryCount");
  if (retainedBoundaryCount
    < MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3
      .minimumRetainedBoundaryCount) {
    throw new RangeError(
      "retainedBoundaryCount must retain at least current, P1, and P2 boundaries",
    );
  }
  if (executionPurpose === "bounded-smoke") {
    const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3;
    if (maximumBeatCount > policy.boundedSmokeMaximumBeatCount) {
      throw new RangeError("bounded-smoke maximumBeatCount exceeds its cap");
    }
    if (maximumBeatCount * stepsPerBeat > policy.boundedSmokeMaximumStepCount) {
      throw new RangeError("bounded-smoke requested step count exceeds its cap");
    }
  }
  return Object.freeze({
    dtSec: options.dtSec,
    cycleLengthSec,
    stepsPerBeat,
    maximumBeatCount,
    retainedBoundaryCount,
    executionPurpose,
    initialization: options.initialization
      ?? Object.freeze({ kind: "canonical-cold-start" as const }),
  });
}

function buildProfileIdentityV3(
  protocol: ResolvedProtocolV3,
): MainWireNormalAdultFiveWallCoronaryProfileIdentityV3 {
  return Object.freeze({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PROFILE_IDENTITY_V3_ID,
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
    autoregulation: Object.freeze({
      bindingId: CORONARY_ACCEPTED_AUTOREGULATION_BINDING_V3_ID,
      law: "integral-flow-homeostasis-v2" as const,
      prior: NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
      defaultControl: createDefaultCoronaryAutoregulationWindowControlV3(),
      flowObservable:
        "final-candidate-layer-qm-internal-flow-ml-per-sec" as const,
      perfusionPressureObservable:
        "final-candidate-post-focal-lesion-pressure-minus-common-cv-pressure" as const,
      quadrature: "backward-euler-right-endpoint" as const,
    }),
    solvers: Object.freeze({
      circulationNewton: protocol.circulationNewtonOptions,
      coronaryBackwardEuler: protocol.coronarySolverOptions,
    }),
    fixedGlobalTotalBloodVolumeMl: protocol.fixedGlobalTotalBloodVolumeMl,
  });
}

function buildProtocolIdentityV3(
  profileIdentity: MainWireNormalAdultFiveWallCoronaryProfileIdentityV3,
  profileIdentityHash: string,
  initialization:
    MainWireNormalAdultFiveWallCoronaryInitializationProvenanceV3,
  resolved: ResolvedRunOptionsV3,
  classifier: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
): MainWireNormalAdultFiveWallCoronaryPeriodicProtocolIdentityV3 {
  return Object.freeze({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_PROTOCOL_IDENTITY_V3_ID,
    runnerId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_STEADY_V3_ID,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
    executionPurpose: resolved.executionPurpose,
    profileIdentity,
    profileIdentityHash,
    initialization,
    integration: Object.freeze({
      dtSec: resolved.dtSec,
      cycleLengthSec: resolved.cycleLengthSec,
      exactStepsPerCycle: resolved.stepsPerBeat,
      maximumBeatCount: resolved.maximumBeatCount,
      retainedBoundaryCount: resolved.retainedBoundaryCount,
      boundaryCapture:
        "accepted-state-after-exact-integer-step-count" as const,
      boundedSmokeStepLimit: resolved.executionPurpose === "bounded-smoke"
        ? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CORONARY_PERIODIC_POLICY_V3
          .boundedSmokeMaximumStepCount
        : null,
    }),
    periodicity: Object.freeze({
      closureId: MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_V3_ID,
      referenceScaleSetId:
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3.scaleSetId,
      classifier,
      rhythmInterpretation: "periodic-sinus-cycle-aligned" as const,
      toleranceStatus: "provisional-not-release-acceptance" as const,
    }),
    exclusions: Object.freeze({
      independentValidationClaim: true as const,
      waveformFitting: true as const,
      shootingOrAcceleration: true as const,
      offlineAutoregulationShadow: true as const,
    }),
  });
}

async function resolveConstructionSeedV3(
  initialization: MainWireNormalAdultFiveWallCoronaryInitializationV3,
): Promise<Readonly<{
  coronaryInitial: CoronaryAcceptedHydraulicStateV2 | undefined;
  provenance: (
    initialAcceptedStateHash: string,
  ) => MainWireNormalAdultFiveWallCoronaryInitializationProvenanceV3;
}>> {
  if (initialization.kind === "canonical-cold-start") {
    return Object.freeze({
      coronaryInitial: undefined,
      provenance: (initialAcceptedStateHash) => Object.freeze({
        kind: "canonical-cold-start" as const,
        initialAcceptedStateHash,
        constructionSeedHydraulicStateHash: null,
        evidenceClassification:
          "protocol-execution-not-itself-independent-validation" as const,
        independentValidationEligible: true as const,
        fullAcceptedStateWarmStart: false as const,
        coronaryHydraulicConstructionSeed: false as const,
        inheritedPeriodicEvidence: false as const,
        restingFlowTargetUsedAsValidation: false as const,
      }),
    });
  }
  requireNonemptyStringV3(initialization.seedId, "construction seedId");
  requireNonemptyStringV3(
    initialization.sourceArtifactId,
    "construction sourceArtifactId",
  );
  const coronaryInitial = Object.freeze({
    ...initialization.coronaryHydraulicState,
    acceptedTimeSec: 0,
    revision: 0,
  });
  const constructionSeedHydraulicStateHash =
    await sha256CanonicalJsonHex(coronaryInitial);
  return Object.freeze({
    coronaryInitial,
    provenance: (initialAcceptedStateHash) => Object.freeze({
      kind: "construction-seed" as const,
      seedId: initialization.seedId,
      sourceArtifactId: initialization.sourceArtifactId,
      initialAcceptedStateHash,
      constructionSeedHydraulicStateHash,
      evidenceClassification:
        "coronary-hydraulic-construction-seed-only-not-independent-validation" as const,
      independentValidationEligible: false as const,
      fullAcceptedStateWarmStart: false as const,
      coronaryHydraulicConstructionSeed: true as const,
      inheritedPeriodicEvidence: false as const,
      restingFlowTargetUsedAsValidation: false as const,
    }),
  });
}

async function hashAcceptedStateV3(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  provider: MainWireNormalAdultFiveWallProviderV1,
): Promise<string> {
  const materialState = provider.stateCodec.encode(
    state.mechanics.materialState as MainWireNormalAdultFiveWallMechanicsStateV1,
  );
  const capsule = Object.freeze({
    transactionId: state.transactionId,
    revision: state.revision,
    acceptedTimeSec: state.acceptedTimeSec,
    fixedGlobalTotalBloodVolumeMl: state.fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: state.coronaryBinding,
    circulation: state.circulation,
    coronary: state.coronary,
    mechanics: Object.freeze({
      contractId: state.mechanics.contractId,
      providerId: state.mechanics.providerId,
      parameterSetId: state.mechanics.parameterSetId,
      parameterIdentityHash: state.mechanics.parameterIdentityHash,
      stateSchemaVersion: state.mechanics.stateSchemaVersion,
      revision: state.mechanics.revision,
      acceptedTimeSec: state.mechanics.acceptedTimeSec,
      acceptedVolumesMl: state.mechanics.acceptedVolumesMl,
      materialState: materialState as WholeHeartMechanicsSerializableValueV1,
      materialStateFingerprint: state.mechanics.materialStateFingerprint,
    }),
    mvcReferenceState: state.mvcReferenceState,
    coronaryAutoregulationBinding: state.coronaryAutoregulationBinding,
    coronaryAutoregulation: state.coronaryAutoregulation,
  });
  return sha256CanonicalJsonHex(capsule);
}

function periodicClassificationV3(
  observations: readonly MainWireFiveWallCoronaryPeriodicBeatObservationV3[],
  options: MainWireFiveWallCoronaryPeriodicClassifierOptionsV2,
): MainWireFiveWallCoronaryPeriodicClassificationV2 {
  const result = classifyMainWireFiveWallCoronaryPeriodicityV3({
    rhythmInterpretation: "periodic-sinus-cycle-aligned",
    observations,
    options,
  });
  if (result.applicability !== "applicable") {
    throw new Error("sinus periodic V3 classification became inapplicable");
  }
  return result.classification;
}

function boundaryRecordV3(
  beatIndex: number,
  expectedBoundaryTimeSec: number,
  acceptedState: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
): MainWireNormalAdultFiveWallCoronaryRetainedBoundaryV3 {
  return Object.freeze({ beatIndex, expectedBoundaryTimeSec, acceptedState });
}

function assertExactAcceptedBoundaryV3(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  expectedTimeSec: number,
  expectedRevision: number,
  expectedWindowIndex: number,
): void {
  const acceptedTimes = Object.freeze([
    state.acceptedTimeSec,
    state.circulation.acceptedTimeSec,
    state.coronary.acceptedTimeSec,
    state.mechanics.acceptedTimeSec,
  ]);
  if (acceptedTimes.some((timeSec) => !Number.isFinite(timeSec))) {
    throw new Error("atomic V3 accepted boundary time was not finite");
  }
  if (acceptedTimes.some((timeSec) => !Object.is(timeSec, state.acceptedTimeSec))) {
    throw new Error("atomic V3 accepted owners did not share one exact boundary clock");
  }
  if (expectedRevision === 0) {
    if (state.acceptedTimeSec !== expectedTimeSec) {
      throw new Error("atomic V3 initial boundary time differs");
    }
  } else {
    const tolerance = acceptedBoundaryTimeToleranceSecV2(
      expectedTimeSec,
      expectedRevision,
    );
    if (Math.abs(state.acceptedTimeSec - expectedTimeSec) > tolerance) {
      throw new Error("atomic V3 state did not land on the counted cycle boundary");
    }
  }
  if (state.revision !== expectedRevision
    || state.circulation.revision !== expectedRevision
    || state.coronary.revision !== expectedRevision
    || state.mechanics.revision !== expectedRevision) {
    throw new Error("atomic V3 accepted owners differ from the counted revision");
  }
  const window = state.coronaryAutoregulation;
  if (window.windowIndex !== expectedWindowIndex
    || window.windowStartRevision !== expectedRevision
    || Math.abs(window.windowStartAcceptedTimeSec - state.acceptedTimeSec)
      > 64 * Number.EPSILON
        * Math.max(1, Math.abs(state.acceptedTimeSec))
    || window.acceptedDurationSec !== 0
    || window.acceptedStepCount !== 0
    || window.windowControl !== null
    || Object.values(window.qmTimeIntegralMlByTerritoryLayer)
      .some((layers) => Object.values(layers).some((value) => value !== 0))
    || Object.values(window.perfusionPressureTimeIntegralMmHgSecByTerritory)
      .some((value) => value !== 0)) {
    throw new Error("atomic V3 sinus boundary did not own an empty accepted window");
  }
}

function acceptedTupleJsonV3(
  state: MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
): string {
  return JSON.stringify(state);
}

function requirePositiveIntegerV3(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function requireNonemptyStringV3(value: string, name: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RangeError(`${name} must be a non-empty string`);
  }
}

function wallClockV3(): Readonly<{
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
