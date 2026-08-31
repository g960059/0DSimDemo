import { MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66AorticOutflowShapeDiagnosticV1";
import { MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import { MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID } from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import { mainWireLeftVentricularPressureRateConfigurationIdentityV1 } from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import {
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
  MAIN_WIRE_STANDARD66_P1_SETTLING_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID,
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_ROUTE_V1_ID,
  MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
  type MainWireStandard66SelectedTraceLiveSessionConstructionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1,
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID,
  MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
  MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID,
  type MainWireStandard66ValidationArmResultV1,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import {
  CANONICAL_JSON_ALGORITHM_V1,
  canonicalJsonStringify,
  deepFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_STAGE_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1_ID =
  "main-wire-standard66-validation-run-protocol-manifest-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID =
  "main-wire-standard66-validation-run-artifact-v1" as const;

/**
 * Only owner identities live here. Formulas, catalogs, and numerical outcomes
 * remain in the preregistration and integrated arm result that own them.
 */
export const MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1 =
  Object.freeze({
    manifestId: MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1_ID,
    preregistrationId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
    integratedArmRunnerId: MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID,
    integratedArmProtocolIdentityId:
      MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID,
    comparisonCohortIdentityId:
      MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID,
    laterStudyProtocolIds: Object.freeze({
      geometryProfileId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1.profileId,
      mechanismKnockoutProtocolId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_PROTOCOL_V1.protocolId,
    }),
  } as const);

export const MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1 =
  Object.freeze({
    researchOnly: true as const,
    artifactIntegrityIsIndependentValidation: false as const,
    exactModelContract: false as const,
    exactFrameOutputReserved: false as const,
    outputRegistryContract: false as const,
    modelSurfaceContract: false as const,
    registryOrModelSurfaceChanged: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    clinicalUseAuthorized: false as const,
    clinicalNormalityEstablished: false as const,
    clinicalMeasurementEquivalenceClaimed: false as const,
    causalAttributionClaimed: false as const,
    unauthenticatedVariantLabelsAccepted: false as const,
  });

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

type GeometryStageIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_STAGE_IDS_V1)[number];

type MechanismKnockoutIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1)[number];

export type MainWireStandard66ValidationStudyCoordinateV1 =
  | Readonly<{
      studyKind: "validation-envelope";
      caseId: EnvelopeCaseIdV1;
    }>
  | Readonly<{
      studyKind: "geometry-profile";
      stageId: GeometryStageIdV1;
    }>
  | Readonly<{
      studyKind: "mechanism-knockout";
      mechanismId: MechanismKnockoutIdV1;
      comparisonRole: "reference" | "knockout";
    }>;

export type MainWireStandard66ValidationRunArtifactPayloadV1 = Readonly<{
  preregistrationId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID;
  study: MainWireStandard66ValidationStudyCoordinateV1;
  armResult: MainWireStandard66ValidationArmResultV1;
  claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1;
}>;

export type MainWireStandard66ValidationRunArtifactV1 = Readonly<{
  artifactId: typeof MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID;
  canonicalJsonAlgorithm: typeof CANONICAL_JSON_ALGORITHM_V1;
  protocolManifestId: typeof MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1_ID;
  protocolManifestSha256: string;
  payloadSha256: string;
  payload: MainWireStandard66ValidationRunArtifactPayloadV1;
}>;

/**
 * Adds a deterministic study coordinate and integrity envelope around the
 * arm runner's already-compact public record. It does not copy traces, exact
 * accepted states, formulas, or preregistered catalogs.
 */
export async function createMainWireStandard66ValidationRunArtifactV1(
  input: Readonly<{
    study: MainWireStandard66ValidationStudyCoordinateV1;
    armResult: MainWireStandard66ValidationArmResultV1;
  }>,
): Promise<MainWireStandard66ValidationRunArtifactV1> {
  await assertIntegratedArmResultV1(input.armResult);
  const construction = ownExactConstructionV1(
    input.armResult.protocolIdentity.exactConstruction,
  );
  const study = ownStudyCoordinateV1(input.study, construction);
  const payload =
    ownCanonicalDataV1<MainWireStandard66ValidationRunArtifactPayloadV1>(
      {
        preregistrationId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
        study,
        armResult: input.armResult,
        claim: MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1,
      },
      "payload",
    );
  const artifact =
    ownCanonicalDataV1<MainWireStandard66ValidationRunArtifactV1>(
      {
        artifactId: MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID,
        canonicalJsonAlgorithm: CANONICAL_JSON_ALGORITHM_V1,
        protocolManifestId:
          MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1_ID,
        protocolManifestSha256: await sha256CanonicalJsonHex(
          MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1,
        ),
        payloadSha256: await sha256CanonicalJsonHex(payload),
        payload,
      },
      "artifact",
    );
  await assertMainWireStandard66ValidationRunArtifactV1(artifact);
  return artifact;
}

export async function assertMainWireStandard66ValidationRunArtifactV1(
  candidate: unknown,
): Promise<void> {
  const record = requireExactRecordV1(candidate, "artifact", [
    "artifactId",
    "canonicalJsonAlgorithm",
    "protocolManifestId",
    "protocolManifestSha256",
    "payloadSha256",
    "payload",
  ]);
  if (
    record.artifactId !== MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID
  ) {
    throw new Error("Standard66 validation artifact identity is invalid");
  }
  if (record.canonicalJsonAlgorithm !== CANONICAL_JSON_ALGORITHM_V1) {
    throw new Error(
      "Standard66 validation artifact canonical JSON identity is invalid",
    );
  }
  if (
    record.protocolManifestId !==
    MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1_ID
  ) {
    throw new Error(
      "Standard66 validation artifact protocol manifest identity is invalid",
    );
  }
  requireSha256V1(record.protocolManifestSha256, "protocol manifest hash");
  requireSha256V1(record.payloadSha256, "payload hash");
  if (
    record.protocolManifestSha256 !==
    (await sha256CanonicalJsonHex(
      MAIN_WIRE_STANDARD66_VALIDATION_RUN_PROTOCOL_MANIFEST_V1,
    ))
  ) {
    throw new Error(
      "Standard66 validation artifact protocol manifest hash is invalid",
    );
  }
  if (record.payloadSha256 !== (await sha256CanonicalJsonHex(record.payload))) {
    throw new Error("Standard66 validation artifact payload hash is invalid");
  }
  const payload = requireExactRecordV1(record.payload, "payload", [
    "preregistrationId",
    "study",
    "armResult",
    "claim",
  ]) as unknown as MainWireStandard66ValidationRunArtifactPayloadV1;
  if (
    payload.preregistrationId !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID
  ) {
    throw new Error(
      "Standard66 validation artifact preregistration identity is invalid",
    );
  }
  if (
    canonicalJsonStringify(payload.claim) !==
    canonicalJsonStringify(
      MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_CLAIM_V1,
    )
  ) {
    throw new Error("Standard66 validation artifact claim boundary is invalid");
  }
  await assertIntegratedArmResultV1(payload.armResult);
  ownStudyCoordinateV1(
    payload.study,
    payload.armResult.protocolIdentity.exactConstruction,
  );
  canonicalJsonStringify(candidate);
}

export async function serializeMainWireStandard66ValidationRunArtifactV1(
  artifact: MainWireStandard66ValidationRunArtifactV1,
): Promise<string> {
  await assertMainWireStandard66ValidationRunArtifactV1(artifact);
  return canonicalJsonStringify(artifact);
}

export async function parseMainWireStandard66ValidationRunArtifactV1(
  serialized: string,
): Promise<MainWireStandard66ValidationRunArtifactV1> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Standard66 validation artifact JSON is invalid");
  }
  await assertMainWireStandard66ValidationRunArtifactV1(parsed);
  return ownCanonicalDataV1<MainWireStandard66ValidationRunArtifactV1>(
    parsed,
    "parsed artifact",
  );
}

async function assertIntegratedArmResultV1(
  result: MainWireStandard66ValidationArmResultV1,
): Promise<void> {
  requireExactRecordV1(result, "arm result", [
    "runnerId",
    "protocolIdentity",
    "protocolIdentityHash",
    "comparisonProtocolIdentityHash",
    "comparisonCohortIdentity",
    "comparisonCohortIdentityHash",
    "constructionIdentityHash",
    "executionPurpose",
    "status",
    "modeEligibility",
    "configuredAorticValveAreaBinding",
    "settlement",
    "confirmation",
    "outcomes",
    "failure",
    "claim",
  ]);
  if (
    result.runnerId !== MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID ||
    result.protocolIdentity.identityId !==
      MAIN_WIRE_STANDARD66_VALIDATION_ARM_PROTOCOL_IDENTITY_V1_ID ||
    result.protocolIdentity.runnerId !==
      MAIN_WIRE_STANDARD66_VALIDATION_ARM_RUNNER_V1_ID ||
    result.comparisonCohortIdentity.identityId !==
      MAIN_WIRE_STANDARD66_VALIDATION_COMPARISON_COHORT_V1_ID
  ) {
    throw new Error("Standard66 validation arm identity is invalid");
  }
  assertKnownArmExecutionPurposeV1(result.executionPurpose);
  for (const [label, hash, value] of [
    ["arm protocol", result.protocolIdentityHash, result.protocolIdentity],
    [
      "comparison protocol",
      result.comparisonProtocolIdentityHash,
      result.comparisonCohortIdentity.comparisonProtocol,
    ],
    [
      "comparison cohort",
      result.comparisonCohortIdentityHash,
      result.comparisonCohortIdentity,
    ],
    [
      "exact construction",
      result.constructionIdentityHash,
      result.protocolIdentity.exactConstruction,
    ],
  ] as const) {
    requireSha256V1(hash, `${label} hash`);
    if (hash !== (await sha256CanonicalJsonHex(value))) {
      throw new Error(`Standard66 validation ${label} hash is invalid`);
    }
  }
  const construction = ownExactConstructionV1(
    result.protocolIdentity.exactConstruction,
  );
  if (
    result.protocolIdentity.comparisonProtocolIdentityHash !==
      result.comparisonProtocolIdentityHash ||
    result.protocolIdentity.comparisonCohortIdentityHash !==
      result.comparisonCohortIdentityHash ||
    canonicalJsonStringify(
      result.comparisonCohortIdentity.exactConstruction,
    ) !== canonicalJsonStringify(construction) ||
    result.comparisonCohortIdentity.preregistrationId !==
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID
  ) {
    throw new Error(
      "Standard66 validation arm comparison cohort is inconsistent",
    );
  }
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      (candidate) => candidate.armId === result.protocolIdentity.clock.armId,
    );
  if (
    arm === undefined ||
    result.protocolIdentity.clock.requestedBoundaryIntervalSec !==
      arm.requestedStepSec ||
    result.settlement.clock.armId !== arm.armId ||
    result.settlement.clock.requestedStepSec !== arm.requestedStepSec ||
    result.executionPurpose !== result.protocolIdentity.executionPurpose
  ) {
    throw new Error(
      "Standard66 validation arm clock or purpose is inconsistent",
    );
  }
  assertKnownMethodIdentitiesV1(result);
  assertConfiguredAorticAreaBindingV1(result, construction);
  if (
    canonicalJsonStringify(result.claim) !==
    canonicalJsonStringify(MAIN_WIRE_STANDARD66_VALIDATION_ARM_CLAIM_V1)
  ) {
    throw new Error("Standard66 validation arm claim boundary is invalid");
  }
  assertArmOutcomeStateV1(result);
  canonicalJsonStringify(result);
}

function assertKnownMethodIdentitiesV1(
  result: MainWireStandard66ValidationArmResultV1,
): void {
  const expectedComponents = Object.freeze({
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
  });
  if (
    canonicalJsonStringify(result.protocolIdentity.componentIdentities) !==
    canonicalJsonStringify(expectedComponents)
  ) {
    throw new Error(
      "Standard66 validation arm component identities are invalid",
    );
  }
  const expectedComparisonProtocol = Object.freeze({
    settlingProtocolId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.protocolId,
    settlingRunnerId: MAIN_WIRE_STANDARD66_P1_SETTLING_RUNNER_V1_ID,
    confirmationRunnerId: MAIN_WIRE_STANDARD66_P1_CONFIRMATION_RUNNER_V1_ID,
    terminalTraceRunnerId: MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID,
    terminalBeatEvaluatorId:
      MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
    flowEventTimingMethodId: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
    primaryPressureRateConfigurationIdentity:
      mainWireLeftVentricularPressureRateConfigurationIdentityV1(0.01),
    outflowShapeDiagnosticId:
      MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID,
  });
  if (
    canonicalJsonStringify(
      result.comparisonCohortIdentity.comparisonProtocol,
    ) !== canonicalJsonStringify(expectedComparisonProtocol)
  ) {
    throw new Error(
      "Standard66 validation comparison method identities are invalid",
    );
  }
}

function assertConfiguredAorticAreaBindingV1(
  result: MainWireStandard66ValidationArmResultV1,
  construction: MainWireStandard66SelectedTraceLiveSessionConstructionV1,
): void {
  const expectedArea =
    construction.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2;
  if (
    result.configuredAorticValveAreaBinding.maximumForwardEoaCm2 !==
      expectedArea ||
    canonicalJsonStringify(result.configuredAorticValveAreaBinding) !==
      canonicalJsonStringify(
        result.protocolIdentity.configuredAorticValveAreaBinding,
      ) ||
    canonicalJsonStringify(result.configuredAorticValveAreaBinding) !==
      canonicalJsonStringify(
        result.comparisonCohortIdentity.configuredAorticValveAreaBinding,
      )
  ) {
    throw new Error(
      "Standard66 validation configured aortic area is inconsistent",
    );
  }
}

function assertArmOutcomeStateV1(
  result: MainWireStandard66ValidationArmResultV1,
): void {
  const purpose = result.executionPurpose;
  const expectedSettlingPurpose =
    purpose === "preregistered-validation"
      ? "preregistered-settling"
      : purpose === "research-screening"
        ? "research-eager"
        : "bounded-smoke";
  if (result.settlement.executionPurpose !== expectedSettlingPurpose) {
    throw new Error(
      "Standard66 validation arm and settling execution purposes are inconsistent",
    );
  }
  const expectedOutcomePolicy = Object.freeze({
    terminalOutcomesRequireSettlingStatus:
      purpose === "research-screening"
        ? ("research-period1-candidate" as const)
        : ("period1-settled" as const),
    terminalOutcomesRequireFreshConfirmationStatus:
      "period1-confirmed" as const,
    boundedSmokeCanProduceTerminalOutcomes: false as const,
    partialTerminalOutcomesReturnedAfterAnalysisFailure: false as const,
  });
  if (
    canonicalJsonStringify(result.protocolIdentity.outcomePolicy) !==
    canonicalJsonStringify(expectedOutcomePolicy)
  ) {
    throw new Error("Standard66 validation outcome policy is inconsistent");
  }

  const terminalComplete = result.status === "terminal-analysis-complete";
  const researchComplete = result.status === "research-screening-complete";
  const terminalOutcomesComplete = terminalComplete || researchComplete;
  const outcomesAvailable = result.outcomes !== null;
  if (
    terminalComplete !==
      (purpose === "preregistered-validation" && outcomesAvailable) ||
    researchComplete !==
      (purpose === "research-screening" && outcomesAvailable) ||
    terminalOutcomesComplete !== outcomesAvailable
  ) {
    throw new Error(
      "Standard66 validation arm outcome availability is inconsistent",
    );
  }
  const allowedStatuses: readonly MainWireStandard66ValidationArmResultV1["status"][] =
    purpose === "bounded-smoke"
      ? ["bounded-smoke-complete", "settling-failed"]
      : purpose === "preregistered-validation"
        ? [
            "terminal-analysis-complete",
            "settling-not-established",
            "settling-failed",
            "confirmation-not-established",
            "confirmation-failed",
            "terminal-analysis-failed",
          ]
        : [
            "research-screening-complete",
            "settling-not-established",
            "settling-failed",
            "confirmation-not-established",
            "confirmation-failed",
            "terminal-analysis-failed",
          ];
  if (!allowedStatuses.includes(result.status)) {
    throw new Error(
      "Standard66 validation arm purpose and status are inconsistent",
    );
  }
  const expectedModeEligibility = Object.freeze({
    testOnlyBoundedSmoke: purpose === "bounded-smoke",
    eligibleForPreregisteredSingleArmMeasurement:
      purpose === "preregistered-validation" && terminalComplete,
  });
  if (
    canonicalJsonStringify(result.modeEligibility) !==
    canonicalJsonStringify(expectedModeEligibility)
  ) {
    throw new Error(
      "Standard66 validation arm mode eligibility is inconsistent",
    );
  }
  if (
    result.executionPurpose === "bounded-smoke" &&
    (result.confirmation !== null || result.outcomes !== null)
  ) {
    throw new Error("Standard66 bounded-smoke arm overclaims an outcome");
  }
  const settled =
    purpose === "research-screening"
      ? result.settlement.status === "research-period1-candidate" &&
        !result.settlement.numericalPeriod1Established
      : result.settlement.status === "period1-settled" &&
        result.settlement.numericalPeriod1Established;
  const confirmed =
    result.confirmation?.status === "period1-confirmed" &&
    result.confirmation.numericalPeriod1Confirmed;
  if (
    terminalOutcomesComplete &&
    (!settled || !confirmed || result.failure !== null)
  ) {
    throw new Error("Standard66 terminal outcomes lack settled confirmation");
  }
  if (terminalOutcomesComplete) {
    const requiredClosures =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.consecutiveP1ClosuresRequired;
    const period1Tolerance =
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance;
    const latest = result.settlement.latestPeriod1Observation;
    if (
      result.settlement.failure !== null ||
      latest === null ||
      !latest.withinTolerance ||
      latest.maximumNormalizedDelta < 0 ||
      latest.maximumNormalizedDelta > period1Tolerance ||
      (researchComplete
        ? latest.consecutiveClosures !== requiredClosures
        : latest.consecutiveClosures < requiredClosures)
    ) {
      throw new Error(
        "Standard66 terminal outcomes lack a passing settling suffix",
      );
    }
    const fresh = result.confirmation?.freshSuffix;
    const freshObservations = fresh?.observations;
    const finalFreshObservation = Array.isArray(freshObservations)
      ? freshObservations.at(-1)
      : undefined;
    if (
      result.confirmation === null ||
      result.confirmation.failure !== null ||
      fresh === undefined ||
      fresh.requiredConsecutivePeriod1Closures !== requiredClosures ||
      fresh.comparisonCount < requiredClosures ||
      fresh.consecutivePeriod1Closures !== requiredClosures ||
      fresh.failedClosureResetsConsecutiveCount !== true ||
      !Array.isArray(freshObservations) ||
      freshObservations.length !== requiredClosures ||
      freshObservations.some(
        (observation, index) =>
          !observation.withinPeriod1Tolerance ||
          observation.period1MaximumNormalizedDelta < 0 ||
          observation.period1MaximumNormalizedDelta > period1Tolerance ||
          observation.consecutivePeriod1Closures !== index + 1,
      ) ||
      finalFreshObservation === undefined ||
      finalFreshObservation.acceptedTimeSec !==
        result.confirmation.terminalAcceptedTimeSec ||
      finalFreshObservation.acceptedRevision !==
        result.confirmation.terminalAcceptedRevision
    ) {
      throw new Error(
        "Standard66 terminal outcomes lack an exact fresh confirmation suffix",
      );
    }
    const settlementTerminal = result.confirmation.settlementTerminal;
    const firstReferenceIsSettlementTerminal =
      fresh.firstReferenceBoundaryTimeSec ===
        result.settlement.terminalAcceptedTimeSec &&
      fresh.firstReferenceBoundaryRevision ===
        result.settlement.terminalAcceptedRevision;
    const firstReferenceFollowsSettlementTerminal =
      typeof fresh.firstReferenceBoundaryTimeSec === "number" &&
      typeof fresh.firstReferenceBoundaryRevision === "number" &&
      fresh.firstReferenceBoundaryTimeSec >
        result.settlement.terminalAcceptedTimeSec &&
      fresh.firstReferenceBoundaryRevision >
        result.settlement.terminalAcceptedRevision;
    if (
      (settlementTerminal.wasExactCoronaryWindowBoundary &&
        !firstReferenceIsSettlementTerminal) ||
      (!settlementTerminal.wasExactCoronaryWindowBoundary &&
        !firstReferenceFollowsSettlementTerminal)
    ) {
      throw new Error(
        "Standard66 fresh confirmation reference does not follow settlement",
      );
    }
    if (
      researchComplete &&
      (latest.acceptedTimeSec !== result.settlement.terminalAcceptedTimeSec ||
        latest.acceptedRevision !==
          result.settlement.terminalAcceptedRevision ||
        result.confirmation.settlementTerminal
          .wasExactCoronaryWindowBoundary !== true)
    ) {
      throw new Error(
        "Standard66 research outcome is not anchored at its candidate boundary",
      );
    }
  }
  if (
    result.confirmation !== null &&
    (!settled ||
      result.confirmation.settlementProtocolIdentityHash !==
        result.settlement.protocolIdentityHash ||
      result.confirmation.settlementTerminal.acceptedTimeSec !==
        result.settlement.terminalAcceptedTimeSec ||
      result.confirmation.settlementTerminal.acceptedRevision !==
        result.settlement.terminalAcceptedRevision)
  ) {
    throw new Error(
      "Standard66 confirmation is not a continuation of settling",
    );
  }
  if (result.outcomes !== null) {
    const measurements = result.outcomes.terminalBeatMeasurements;
    const outflow = result.outcomes.aorticOutflowShapeDiagnostic;
    if (
      result.outcomes.traceProvenance.traceRunnerId !==
        MAIN_WIRE_STANDARD66_SELECTED_TRACE_RUNNER_V1_ID ||
      measurements.evaluatorId !==
        MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID ||
      outflow.methodId !==
        MAIN_WIRE_STANDARD66_AORTIC_OUTFLOW_SHAPE_DIAGNOSTIC_V1_ID ||
      measurements.source.startAtrialCaptureId !==
        outflow.source.startAtrialCaptureId ||
      measurements.source.endAtrialCaptureId !==
        outflow.source.endAtrialCaptureId
    ) {
      throw new Error(
        "Standard66 terminal outcome identities are inconsistent",
      );
    }
  }
}

function assertKnownArmExecutionPurposeV1(
  value: unknown,
): asserts value is MainWireStandard66ValidationArmResultV1["executionPurpose"] {
  if (
    value !== "preregistered-validation" &&
    value !== "research-screening" &&
    value !== "bounded-smoke"
  ) {
    throw new Error("Standard66 validation arm execution purpose is invalid");
  }
}

function ownStudyCoordinateV1(
  study: MainWireStandard66ValidationStudyCoordinateV1,
  construction: MainWireStandard66SelectedTraceLiveSessionConstructionV1,
): MainWireStandard66ValidationStudyCoordinateV1 {
  if (study.studyKind === "validation-envelope") {
    const envelopeCase =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
        (candidate) => candidate.caseId === study.caseId,
      );
    if (envelopeCase === undefined) {
      throw new Error("Standard66 artifact envelope case is not preregistered");
    }
    assertCanonicalEqualV1(
      construction.hemodynamicResearchInputs,
      envelopeCase.hemodynamicResearchInputs,
      "construction differs from envelope case",
    );
  } else if (study.studyKind === "geometry-profile") {
    const stage =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1.orderedStages.find(
        (candidate) => candidate.stageId === study.stageId,
      );
    if (stage === undefined) {
      throw new Error(
        "Standard66 artifact geometry stage is not preregistered",
      );
    }
    if (stage.heldOutLoadId === null) {
      throw new Error(
        "Standard66 artifact local-diameter stage requires an authenticated geometry variant identity",
      );
    }
    const load =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_GEOMETRY_PROFILE_V1.heldOutLoads.find(
        (candidate) => candidate.loadId === stage.heldOutLoadId,
      );
    if (load === undefined) {
      throw new Error("Standard66 artifact held-out geometry load is invalid");
    }
    assertCanonicalEqualV1(
      construction.hemodynamicResearchInputs,
      load.hemodynamicResearchInputs,
      "construction differs from held-out geometry load",
    );
  } else if (study.studyKind === "mechanism-knockout") {
    if (
      !MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_MECHANISM_KNOCKOUT_IDS_V1.includes(
        study.mechanismId,
      ) ||
      (study.comparisonRole !== "reference" &&
        study.comparisonRole !== "knockout")
    ) {
      throw new Error(
        "Standard66 artifact mechanism knockout coordinate is invalid",
      );
    }
    throw new Error(
      "Standard66 artifact mechanism knockout requires an authenticated mechanism variant identity",
    );
  } else {
    throw new Error("Standard66 artifact study kind is invalid");
  }
  return ownCanonicalDataV1(study, "study coordinate");
}

function ownExactConstructionV1(
  construction: MainWireStandard66SelectedTraceLiveSessionConstructionV1,
): MainWireStandard66SelectedTraceLiveSessionConstructionV1 {
  if (
    construction.constructionId !==
    MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID
  ) {
    throw new Error(
      "Standard66 artifact exact construction identity is invalid",
    );
  }
  if (
    !Number.isFinite(construction.ventricularContractilityScale) ||
    construction.ventricularContractilityScale <= 0
  ) {
    throw new Error("Standard66 artifact contractility scale is invalid");
  }
  return Object.freeze({
    constructionId:
      MAIN_WIRE_STANDARD66_SELECTED_TRACE_LIVE_SESSION_CONSTRUCTION_V1_ID,
    hemodynamicResearchInputs:
      validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3(
        construction.hemodynamicResearchInputs,
      ),
    mechanismResearchInputs:
      validateAndOwnMainWireIntegratedModelMechanismResearchInputsV3(
        construction.mechanismResearchInputs,
      ),
    ventricularContractilityScale: construction.ventricularContractilityScale,
  });
}

function assertCanonicalEqualV1(
  actual: unknown,
  expected: unknown,
  message: string,
): void {
  if (canonicalJsonStringify(actual) !== canonicalJsonStringify(expected)) {
    throw new Error(`Standard66 artifact ${message}`);
  }
}

function requireExactRecordV1(
  value: unknown,
  label: string,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(`Standard66 validation ${label} must be a plain object`);
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new Error(`Standard66 validation ${label} fields must match exactly`);
  }
  return record;
}

function requireSha256V1(
  value: unknown,
  label: string,
): asserts value is string {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    throw new Error(`Standard66 validation ${label} is invalid`);
  }
}

function ownCanonicalDataV1<T>(value: unknown, label: string): T {
  try {
    return deepFreezeCanonicalJson(
      JSON.parse(canonicalJsonStringify(value)) as CanonicalJsonValue,
    ) as T;
  } catch (error) {
    throw new Error(
      `Standard66 validation ${label} is not canonical JSON data: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
