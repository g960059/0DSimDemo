import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  alignMainWireIntegratedModelRegularSinusAllOffCandidateV3,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffAlignmentV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
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

export const MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID =
  "main-wire-integrated-regular-sinus-all-off-snapshot-qualification-v5" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_DEFAULT_NOMINAL_DT_SEC_V3 =
  0.002 as const;

export const MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3 =
  deepFreeze({
    scope:
      "bounded-hemodynamic-input-periodic-v3-identity-regular-sinus-all-four-MCS-disabled-and-all-four-inertance-circuits-zero" as const,
    candidateOrigin:
      "exact-MainWireIntegratedModelCheckpointV3-accepted-boundary" as const,
    candidateCheckpointIdentityRequired:
      "periodic-v3-rhythm-profile-config-provider-and-hemodynamic-input-identity" as const,
    coldStartUsed: false as const,
    openCandidateWindow:
      "completed-from-restored-accepted-aggregates-before-full-cycle-classification" as const,
    completeAcceptedStateComparatorReused: true as const,
    canonicalPeriodicPolicyReused: true as const,
    canonicalPeriodicityClassifierReused: true as const,
    acceptedOutcome: "period1-converged-only" as const,
    rejectedOutcomes: Object.freeze([
      "candidate-checkpoint-invalid",
      "period2-suspect",
      "maximum-cycle-cap",
      "numerical-failure",
      "event-identity-failure",
      "conservation-failure",
      "terminal-checkpoint-round-trip-failure",
    ] as const),
    terminalCheckpoint:
      "exact-V4-checkpoint-restore-and-recheckpoint-equality-required" as const,
    snapshotQualificationIsPhysiologicalValidation: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelSnapshotQualificationOptionsV3 = Readonly<{
  candidateCheckpoint: unknown;
  nominalDtSec?: number;
  maximumCycleCount?: number;
  hemodynamicResearchInputs?: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs?: MainWireIntegratedModelMechanismResearchInputsV3;
}>;

export type MainWireIntegratedModelSnapshotQualificationRejectionReasonV3 =
  | "candidate-checkpoint-rejected"
  | "period2-suspect"
  | "maximum-cycles-reached"
  | "protocol-numerical-event-or-conservation-failure"
  | "terminal-checkpoint-round-trip-failed";

export type MainWireIntegratedModelSnapshotQualificationFailureStageV3 =
  | "candidate-restore"
  | "candidate-round-trip"
  | "alignment"
  | "periodic-cycle"
  | "terminal-round-trip";

export type MainWireIntegratedModelSnapshotQualificationAlignmentEvidenceV3 =
  Readonly<{
    alignmentRequired: boolean;
    sourceAcceptedTimeSec: number;
    boundaryAcceptedTimeSec: number;
    acceptedStepCount: number;
    completedWindowIndex: number | null;
    acceptedAtrialCaptureIds: readonly string[];
    acceptedVentricularCaptureIds: readonly string[];
    deliveredCalciumDepositIds: readonly string[];
    maximumGlobalTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    finiteCalciumOwnershipAllOffAndConservationPassed: true;
  }>;

export type MainWireIntegratedModelSnapshotQualificationCycleEvidenceV3 =
  Readonly<{
    cycleIndex: number;
    startTimeSec: number;
    endTimeSec: number;
    acceptedStepCount: number;
    completedWindowIndex: number;
    period1MaximumNormalizedDelta: number;
    period2MaximumNormalizedDelta: number | null;
    finiteConservationAndExactRegularSinusEventsPassed: true;
  }>;

export type MainWireIntegratedModelSnapshotQualificationResultV3 = Readonly<{
  qualificationId: typeof MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID;
  status: "accepted" | "rejected";
  accepted: boolean;
  reason:
    | "period1-converged"
    | MainWireIntegratedModelSnapshotQualificationRejectionReasonV3;
  failureStage: MainWireIntegratedModelSnapshotQualificationFailureStageV3 | null;
  message: string | null;
  protocolIdentityHash: string | null;
  candidateCheckpointSha256: string | null;
  candidateAcceptedRevision: number | null;
  candidateAcceptedTimeSec: number | null;
  candidateCheckpointExactRoundTripVerified: boolean;
  nominalDtSec: number;
  requestedMaximumCycleCount: number;
  alignment: MainWireIntegratedModelSnapshotQualificationAlignmentEvidenceV3 | null;
  completedCycleCount: number;
  classification: MainWireIntegratedModelPeriodicClassificationV3 | null;
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[];
  cycles: readonly MainWireIntegratedModelSnapshotQualificationCycleEvidenceV3[];
  terminalAcceptedRevision: number | null;
  terminalAcceptedTimeSec: number | null;
  terminalCheckpoint: MainWireIntegratedModelCheckpointV3 | null;
  terminalCheckpointExactRoundTripVerified: boolean;
  snapshotQualificationEstablished: boolean;
  physiologicalAcceptanceEstablished: false;
  clinicalValidationClaimed: false;
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  claim: typeof MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3;
}>;

type ResolvedOptions = Readonly<{
  candidateCheckpoint: unknown;
  nominalDtSec: number;
  maximumCycleCount: number;
  hemodynamicResearchInputs: MainWireIntegratedModelHemodynamicResearchInputsV3;
  mechanismResearchInputs: MainWireIntegratedModelMechanismResearchInputsV3;
}>;

type AcceptedState = ReturnType<
  typeof createMainWireIntegratedModelRegularSinusAllOffFixtureV3
>["cold"]["acceptedState"];

/**
 * Qualifies a restored candidate, never a cold substitute. Only a canonical
 * P1 classification returns an accepted checkpoint; every other terminal path
 * is an explicit rejection.
 */
export async function qualifyMainWireIntegratedModelSnapshotV3(
  options: MainWireIntegratedModelSnapshotQualificationOptionsV3,
): Promise<MainWireIntegratedModelSnapshotQualificationResultV3> {
  const resolved = resolveOptions(options);
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3(
    resolved.hemodynamicResearchInputs,
    1,
    resolved.mechanismResearchInputs,
  );
  const checkpointContext =
    createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture);
  const classifierOptions = Object.freeze({
    period1NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
    period2NormalizedTolerance:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period2MinimumPeriod1NormalizedDelta,
    consecutiveCycles:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles,
  });
  let candidateCheckpointSha256: string | null = null;
  let candidateAcceptedRevision: number | null = null;
  let candidateAcceptedTimeSec: number | null = null;
  let candidateCheckpointExactRoundTripVerified = false;
  let protocolIdentityHash: string | null = null;
  let alignment: MainWireIntegratedModelSnapshotQualificationAlignmentEvidenceV3 | null =
    null;
  const observations: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
  const cycles: MainWireIntegratedModelSnapshotQualificationCycleEvidenceV3[] =
    [];
  let classification = classifyMainWireIntegratedModelPeriodicityV3(
    observations,
    classifierOptions,
  );
  let terminalAcceptedRevision: number | null = null;
  let terminalAcceptedTimeSec: number | null = null;

  let candidate: AcceptedState;
  try {
    candidate = await restoreMainWireIntegratedModelV3(
      checkpointContext,
      resolved.candidateCheckpoint,
    );
  } catch (error) {
    return rejection({
      resolved,
      reason: "candidate-checkpoint-rejected",
      failureStage: "candidate-restore",
      message: errorMessage(error),
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification: null,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: false,
    });
  }

  candidateAcceptedRevision = candidate.revision;
  candidateAcceptedTimeSec = candidate.acceptedTimeSec;
  terminalAcceptedRevision = candidate.revision;
  terminalAcceptedTimeSec = candidate.acceptedTimeSec;
  try {
    const restoredCandidateCheckpoint =
      await checkpointMainWireIntegratedModelV3(checkpointContext, candidate);
    if (
      canonicalJsonStringify(restoredCandidateCheckpoint) !==
      canonicalJsonStringify(resolved.candidateCheckpoint)
    ) {
      throw new Error(
        "V3 qualification candidate checkpoint exact round-trip differs",
      );
    }
    candidateCheckpointSha256 = restoredCandidateCheckpoint.checkpointSha256;
    candidateCheckpointExactRoundTripVerified = true;
    protocolIdentityHash = await sha256CanonicalJsonHex(
      Object.freeze({
        qualificationId:
          MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID,
        candidateCheckpointSha256,
        nominalDtSec: resolved.nominalDtSec,
        maximumCycleCount: resolved.maximumCycleCount,
        periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
        referenceScales:
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        provider: Object.freeze({
          contractId: fixture.provider.contractId,
          providerId: fixture.provider.providerId,
          parameterSetId: fixture.provider.parameterSetId,
          parameterIdentityHash: fixture.provider.parameterIdentityHash,
          stateSchemaVersion: fixture.provider.stateSchemaVersion,
        }),
        rhythmConfiguration: fixture.rhythm.configuration,
        dynamicMechanicalSupportProfile: fixture.profile,
        dynamicMechanicalSupportConfig: fixture.config,
        coronaryStepInput: fixture.coronaryStepInput,
        mechanismResearchInputs: fixture.mechanismResearchInputs,
      }),
    );
  } catch (error) {
    return rejection({
      resolved,
      reason: "candidate-checkpoint-rejected",
      failureStage: "candidate-round-trip",
      message: errorMessage(error),
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: false,
    });
  }

  const allAtrialCaptureIds = new Set<string>();
  const allVentricularCaptureIds = new Set<string>();
  const allDepositIds = new Set<string>();
  let accepted = candidate;
  try {
    const aligned = alignMainWireIntegratedModelRegularSinusAllOffCandidateV3(
      fixture,
      candidate,
      resolved.nominalDtSec,
    );
    addUniqueIds(
      allAtrialCaptureIds,
      aligned.acceptedAtrialCaptureIds,
      "alignment atrial capture",
    );
    addUniqueIds(
      allVentricularCaptureIds,
      aligned.acceptedVentricularCaptureIds,
      "alignment ventricular capture",
    );
    addUniqueIds(
      allDepositIds,
      aligned.deliveredCalciumDepositIds,
      "alignment calcium deposit",
    );
    accepted = aligned.terminalAcceptedState;
    terminalAcceptedRevision = accepted.revision;
    terminalAcceptedTimeSec = accepted.acceptedTimeSec;
    alignment = alignmentEvidence(aligned);
  } catch (error) {
    return rejection({
      resolved,
      reason: "protocol-numerical-event-or-conservation-failure",
      failureStage: "alignment",
      message: errorMessage(error),
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: false,
    });
  }

  const boundaries = [accepted];
  try {
    for (
      let cycleIndex = 1;
      cycleIndex <= resolved.maximumCycleCount;
      cycleIndex += 1
    ) {
      const run = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
        fixture,
        accepted,
        cycleIndex,
        resolved.nominalDtSec,
      );
      addUniqueIds(
        allAtrialCaptureIds,
        run.acceptedAtrialCaptureIds,
        "atrial capture",
      );
      addUniqueIds(
        allVentricularCaptureIds,
        run.acceptedVentricularCaptureIds,
        "ventricular capture",
      );
      addUniqueIds(
        allDepositIds,
        run.deliveredCalciumDepositIds,
        "calcium deposit",
      );
      accepted = run.terminalAcceptedState;
      terminalAcceptedRevision = accepted.revision;
      terminalAcceptedTimeSec = accepted.acceptedTimeSec;
      const previous = boundaries.at(-1)!;
      const twoBack = boundaries.length >= 2 ? boundaries.at(-2)! : null;
      const period1 = compareMainWireIntegratedModelAcceptedStatesV3(
        accepted,
        previous,
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
        fixture.config,
      );
      const period2 =
        twoBack === null
          ? null
          : compareMainWireIntegratedModelAcceptedStatesV3(
              accepted,
              twoBack,
              MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
              fixture.config,
            );
      observations.push(
        Object.freeze({
          cycleIndex,
          evidenceRole: "canonical-periodic-protocol" as const,
          protocolIdentityHash: protocolIdentityHash!,
          period1,
          period2,
        }),
      );
      classification = classifyMainWireIntegratedModelPeriodicityV3(
        observations,
        classifierOptions,
      );
      cycles.push(
        Object.freeze({
          cycleIndex,
          startTimeSec: run.startTimeSec,
          endTimeSec: run.endTimeSec,
          acceptedStepCount: run.acceptedStepCount,
          completedWindowIndex: run.coronaryAutoregulationWindow.windowIndex,
          period1MaximumNormalizedDelta: period1.overall.maximumNormalizedDelta,
          period2MaximumNormalizedDelta:
            period2?.overall.maximumNormalizedDelta ?? null,
          finiteConservationAndExactRegularSinusEventsPassed: true as const,
        }),
      );
      boundaries.push(accepted);
      if (boundaries.length > 3) boundaries.shift();
      if (classification.status !== "not-converged") break;
    }
  } catch (error) {
    return rejection({
      resolved,
      reason: "protocol-numerical-event-or-conservation-failure",
      failureStage: "periodic-cycle",
      message: errorMessage(error),
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: false,
    });
  }

  let terminalCheckpoint: MainWireIntegratedModelCheckpointV3;
  try {
    terminalCheckpoint = await checkpointMainWireIntegratedModelV3(
      checkpointContext,
      accepted,
    );
    const restoredTerminal = await restoreMainWireIntegratedModelV3(
      checkpointContext,
      JSON.parse(canonicalJsonStringify(terminalCheckpoint)),
    );
    const restoredTerminalCheckpoint =
      await checkpointMainWireIntegratedModelV3(
        checkpointContext,
        restoredTerminal,
      );
    if (
      canonicalJsonStringify(restoredTerminalCheckpoint) !==
      canonicalJsonStringify(terminalCheckpoint)
    ) {
      throw new Error(
        "V3 qualification terminal checkpoint exact round-trip differs",
      );
    }
  } catch (error) {
    return rejection({
      resolved,
      reason: "terminal-checkpoint-round-trip-failed",
      failureStage: "terminal-round-trip",
      message: errorMessage(error),
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: false,
    });
  }

  if (classification.status !== "period1-converged") {
    return rejection({
      resolved,
      reason:
        classification.status === "period2-suspect"
          ? "period2-suspect"
          : "maximum-cycles-reached",
      failureStage: null,
      message:
        classification.status === "period2-suspect"
          ? "candidate settled into a suspected period-2 orbit"
          : "candidate did not establish period-1 closure before the cycle cap",
      protocolIdentityHash,
      candidateCheckpointSha256,
      candidateAcceptedRevision,
      candidateAcceptedTimeSec,
      candidateCheckpointExactRoundTripVerified,
      alignment,
      classification,
      observations,
      cycles,
      terminalAcceptedRevision,
      terminalAcceptedTimeSec,
      terminalCheckpointExactRoundTripVerified: true,
    });
  }

  return deepFreeze({
    qualificationId: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID,
    status: "accepted" as const,
    accepted: true,
    reason: "period1-converged" as const,
    failureStage: null,
    message: null,
    protocolIdentityHash,
    candidateCheckpointSha256,
    candidateAcceptedRevision,
    candidateAcceptedTimeSec,
    candidateCheckpointExactRoundTripVerified,
    nominalDtSec: resolved.nominalDtSec,
    requestedMaximumCycleCount: resolved.maximumCycleCount,
    alignment,
    completedCycleCount: cycles.length,
    classification,
    observations,
    cycles,
    terminalAcceptedRevision,
    terminalAcceptedTimeSec,
    terminalCheckpoint,
    terminalCheckpointExactRoundTripVerified: true,
    snapshotQualificationEstablished: true,
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    claim: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3,
  });
}

function alignmentEvidence(
  alignment: MainWireIntegratedModelRegularSinusAllOffAlignmentV3,
): MainWireIntegratedModelSnapshotQualificationAlignmentEvidenceV3 {
  return deepFreeze({
    alignmentRequired: alignment.alignmentRequired,
    sourceAcceptedTimeSec: alignment.sourceAcceptedTimeSec,
    boundaryAcceptedTimeSec: alignment.boundaryAcceptedTimeSec,
    acceptedStepCount: alignment.acceptedStepCount,
    completedWindowIndex: alignment.completedWindowIndex,
    acceptedAtrialCaptureIds: alignment.acceptedAtrialCaptureIds,
    acceptedVentricularCaptureIds: alignment.acceptedVentricularCaptureIds,
    deliveredCalciumDepositIds: alignment.deliveredCalciumDepositIds,
    maximumGlobalTotalBloodVolumeErrorMl:
      alignment.maximumGlobalTotalBloodVolumeErrorMl,
    maximumCoronaryBloodVolumeLedgerResidualMl:
      alignment.maximumCoronaryBloodVolumeLedgerResidualMl,
    maximumDynamicMcsConservationResidualMlPerSec:
      alignment.maximumDynamicMcsConservationResidualMlPerSec,
    finiteCalciumOwnershipAllOffAndConservationPassed: true as const,
  });
}

function rejection(
  input: Readonly<{
    resolved: ResolvedOptions;
    reason: MainWireIntegratedModelSnapshotQualificationRejectionReasonV3;
    failureStage: MainWireIntegratedModelSnapshotQualificationFailureStageV3 | null;
    message: string;
    protocolIdentityHash: string | null;
    candidateCheckpointSha256: string | null;
    candidateAcceptedRevision: number | null;
    candidateAcceptedTimeSec: number | null;
    candidateCheckpointExactRoundTripVerified: boolean;
    alignment: MainWireIntegratedModelSnapshotQualificationAlignmentEvidenceV3 | null;
    classification: MainWireIntegratedModelPeriodicClassificationV3 | null;
    observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[];
    cycles: readonly MainWireIntegratedModelSnapshotQualificationCycleEvidenceV3[];
    terminalAcceptedRevision: number | null;
    terminalAcceptedTimeSec: number | null;
    terminalCheckpointExactRoundTripVerified: boolean;
  }>,
): MainWireIntegratedModelSnapshotQualificationResultV3 {
  return deepFreeze({
    qualificationId: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_V3_ID,
    status: "rejected" as const,
    accepted: false,
    reason: input.reason,
    failureStage: input.failureStage,
    message: input.message,
    protocolIdentityHash: input.protocolIdentityHash,
    candidateCheckpointSha256: input.candidateCheckpointSha256,
    candidateAcceptedRevision: input.candidateAcceptedRevision,
    candidateAcceptedTimeSec: input.candidateAcceptedTimeSec,
    candidateCheckpointExactRoundTripVerified:
      input.candidateCheckpointExactRoundTripVerified,
    nominalDtSec: input.resolved.nominalDtSec,
    requestedMaximumCycleCount: input.resolved.maximumCycleCount,
    alignment: input.alignment,
    completedCycleCount: input.cycles.length,
    classification: input.classification,
    observations: input.observations,
    cycles: input.cycles,
    terminalAcceptedRevision: input.terminalAcceptedRevision,
    terminalAcceptedTimeSec: input.terminalAcceptedTimeSec,
    terminalCheckpoint: null,
    terminalCheckpointExactRoundTripVerified:
      input.terminalCheckpointExactRoundTripVerified,
    snapshotQualificationEstablished: false,
    physiologicalAcceptanceEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    claim: MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_CLAIM_V3,
  });
}

function resolveOptions(
  options: MainWireIntegratedModelSnapshotQualificationOptionsV3,
): ResolvedOptions {
  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new Error("V3 snapshot qualification options must be an object");
  }
  const keys = Object.keys(options);
  if (
    keys.some(
      (key) =>
        ![
          "candidateCheckpoint",
          "nominalDtSec",
          "maximumCycleCount",
          "hemodynamicResearchInputs",
          "mechanismResearchInputs",
        ].includes(key),
    )
  ) {
    throw new Error(
      "V3 snapshot qualification options contain unexpected fields",
    );
  }
  if (!("candidateCheckpoint" in options)) {
    throw new Error("V3 snapshot qualification requires candidateCheckpoint");
  }
  const policy = MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3;
  const nominalDtSec =
    options.nominalDtSec ??
    MAIN_WIRE_INTEGRATED_MODEL_SNAPSHOT_QUALIFICATION_DEFAULT_NOMINAL_DT_SEC_V3;
  if (
    !Number.isFinite(nominalDtSec) ||
    nominalDtSec < policy.minimumNominalDtSec ||
    nominalDtSec > policy.maximumNominalDtSec
  ) {
    throw new RangeError(
      `nominalDtSec must be from ${policy.minimumNominalDtSec} through ${policy.maximumNominalDtSec}`,
    );
  }
  const maximumCycleCount =
    options.maximumCycleCount ?? policy.defaultMaximumCycleCount;
  if (
    !Number.isSafeInteger(maximumCycleCount) ||
    maximumCycleCount < 1 ||
    maximumCycleCount > policy.maximumCycleCount
  ) {
    throw new RangeError(
      `maximumCycleCount must be an integer from 1 through ${policy.maximumCycleCount}`,
    );
  }
  return Object.freeze({
    candidateCheckpoint: options.candidateCheckpoint,
    nominalDtSec,
    maximumCycleCount,
    hemodynamicResearchInputs:
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        options.hemodynamicResearchInputs ??
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      ),
    mechanismResearchInputs:
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        options.mechanismResearchInputs ??
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
      ),
  });
}

function addUniqueIds(
  accepted: Set<string>,
  candidate: readonly string[],
  label: string,
): void {
  for (const id of candidate) {
    if (accepted.has(id)) {
      throw new Error(`duplicate V3 qualification ${label} identity`);
    }
    accepted.add(id);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === "object" &&
    !ArrayBuffer.isView(value)
  ) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
