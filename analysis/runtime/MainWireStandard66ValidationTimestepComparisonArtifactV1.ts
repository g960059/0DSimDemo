import {
  evaluateMainWireStandard66TimestepComparisonV1,
  type MainWireStandard66TimestepComparisonArmInputV1,
  type MainWireStandard66TimestepComparisonResultV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TimestepComparisonV1";
import {
  MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID,
  assertMainWireStandard66ValidationRunArtifactV1,
  parseMainWireStandard66ValidationRunArtifactV1,
  type MainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import { mainWireStandard66ValidationArmTimestepComparisonInputV1 } from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import {
  CANONICAL_JSON_ALGORITHM_V1,
  canonicalJsonStringify,
  deepFreezeCanonicalJson,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  type CanonicalJsonValue,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID =
  "main-wire-standard66-validation-timestep-comparison-artifact-v1" as const;

export const MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1 =
  Object.freeze({
    researchOnly: true as const,
    scope: "preregistered-three-arm-numerical-agreement-only" as const,
    exactlyThreeCanonicalArmArtifactsRequired: true as const,
    sameValidationEnvelopeCaseRequired: true as const,
    sameComparisonProtocolIdentityRequired: true as const,
    sameComparisonCohortIdentityRequired: true as const,
    sourceArtifactsEmbedded: false as const,
    standaloneParseReverifiesSourceArtifacts: false as const,
    sourceArtifactSha256ReferencesAreDigitalSignatures: false as const,
    strictSourceBindingRequiresSerializedRunArtifacts: true as const,
    unavailableInputsProducePartialGateEvaluations: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
    clinicalUseAuthorized: false as const,
    clinicalNormalityEstablished: false as const,
    causalAttributionClaimed: false as const,
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    registryOrModelSurfaceChanged: false as const,
  });

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

export type MainWireStandard66ValidationTimestepComparisonSourceArmV1 =
  Readonly<{
    armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    runArtifactId: typeof MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID;
    runArtifactSha256: string;
    runArtifactPayloadSha256: string;
    armProtocolIdentityHash: string;
    constructionIdentityHash: string;
    comparisonInput: MainWireStandard66TimestepComparisonArmInputV1;
  }>;

export type MainWireStandard66ValidationTimestepComparisonArtifactPayloadV1 =
  Readonly<{
    preregistrationId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID;
    study: Readonly<{
      studyKind: "validation-envelope";
      caseId: EnvelopeCaseIdV1;
    }>;
    comparisonProtocolIdentityHash: string;
    comparisonCohortIdentityHash: string;
    sourceArms: readonly MainWireStandard66ValidationTimestepComparisonSourceArmV1[];
    comparisonResult: MainWireStandard66TimestepComparisonResultV1;
    claim: typeof MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1;
  }>;

export type MainWireStandard66ValidationTimestepComparisonArtifactV1 =
  Readonly<{
    artifactId: typeof MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID;
    canonicalJsonAlgorithm: typeof CANONICAL_JSON_ALGORITHM_V1;
    payloadSha256: string;
    payload: MainWireStandard66ValidationTimestepComparisonArtifactPayloadV1;
  }>;

/**
 * Consumes exactly three canonical arm artifacts. Clock-arm coverage remains
 * owned by the pure evaluator so duplicate/missing-arm reasons are preserved.
 *
 * Topology mismatches are rejected before evaluation. Numerical unavailability
 * is left to the pure evaluator, whose upstream reasons are retained verbatim
 * and whose all-or-nothing gate policy prevents partial comparisons.
 */
export async function createMainWireStandard66ValidationTimestepComparisonArtifactV1(
  runArtifacts: readonly MainWireStandard66ValidationRunArtifactV1[],
): Promise<MainWireStandard66ValidationTimestepComparisonArtifactV1> {
  if (
    runArtifacts.length !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.length
  ) {
    throw new Error(
      "Standard66 timestep comparison requires exactly three canonical arm artifacts",
    );
  }
  await Promise.all(
    runArtifacts.map((artifact) =>
      assertMainWireStandard66ValidationRunArtifactV1(artifact),
    ),
  );

  const first = runArtifacts[0]!;
  const study = requireValidationEnvelopeStudyV1(first);
  const comparisonProtocolIdentityHash =
    first.payload.armResult.comparisonProtocolIdentityHash;
  const comparisonCohortIdentityHash =
    first.payload.armResult.comparisonCohortIdentityHash;
  for (const artifact of runArtifacts.slice(1)) {
    const candidateStudy = requireValidationEnvelopeStudyV1(artifact);
    if (
      canonicalJsonStringify(candidateStudy) !== canonicalJsonStringify(study)
    ) {
      throw new Error(
        "Standard66 timestep comparison arm artifacts must have the exact same validation-envelope coordinate",
      );
    }
    if (
      artifact.payload.armResult.comparisonProtocolIdentityHash !==
      comparisonProtocolIdentityHash
    ) {
      throw new Error(
        "Standard66 timestep comparison arm artifacts must have an identical comparison protocol identity",
      );
    }
    if (
      artifact.payload.armResult.comparisonCohortIdentityHash !==
      comparisonCohortIdentityHash
    ) {
      throw new Error(
        "Standard66 timestep comparison arm artifacts must have an identical comparison cohort identity",
      );
    }
  }

  const sourceArms = await Promise.all(
    runArtifacts.map(async (artifact) => {
      const result = artifact.payload.armResult;
      return ownCanonicalDataV1<MainWireStandard66ValidationTimestepComparisonSourceArmV1>(
        {
          armId: result.protocolIdentity.clock.armId,
          runArtifactId: artifact.artifactId,
          runArtifactSha256: await sha256CanonicalJsonHex(artifact),
          runArtifactPayloadSha256: artifact.payloadSha256,
          armProtocolIdentityHash: result.protocolIdentityHash,
          constructionIdentityHash: result.constructionIdentityHash,
          comparisonInput:
            mainWireStandard66ValidationArmTimestepComparisonInputV1(result),
        },
        "source arm",
      );
    }),
  );
  sourceArms.sort(compareSourceArmsV1);

  const comparisonResult = evaluateMainWireStandard66TimestepComparisonV1({
    expectedComparison: {
      comparisonProtocolIdentity: comparisonProtocolIdentityHash,
      comparisonCohortIdentity: comparisonCohortIdentityHash,
    },
    arms: sourceArms.map(({ comparisonInput }) => comparisonInput),
  });
  const payload =
    ownCanonicalDataV1<MainWireStandard66ValidationTimestepComparisonArtifactPayloadV1>(
      {
        preregistrationId:
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
        study,
        comparisonProtocolIdentityHash,
        comparisonCohortIdentityHash,
        sourceArms,
        comparisonResult,
        claim:
          MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1,
      },
      "payload",
    );
  const artifact =
    ownCanonicalDataV1<MainWireStandard66ValidationTimestepComparisonArtifactV1>(
      {
        artifactId:
          MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID,
        canonicalJsonAlgorithm: CANONICAL_JSON_ALGORITHM_V1,
        payloadSha256: await sha256CanonicalJsonHex(payload),
        payload,
      },
      "artifact",
    );
  await assertMainWireStandard66ValidationTimestepComparisonArtifactV1(
    artifact,
  );
  return artifact;
}

export async function createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1(
  serializedRunArtifacts: readonly string[],
): Promise<MainWireStandard66ValidationTimestepComparisonArtifactV1> {
  if (
    serializedRunArtifacts.length !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.length
  ) {
    throw new Error(
      "Standard66 timestep comparison requires exactly three serialized arm artifacts",
    );
  }
  const artifacts = await Promise.all(
    serializedRunArtifacts.map((serialized) =>
      parseMainWireStandard66ValidationRunArtifactV1(serialized),
    ),
  );
  return createMainWireStandard66ValidationTimestepComparisonArtifactV1(
    artifacts,
  );
}

export async function assertMainWireStandard66ValidationTimestepComparisonArtifactV1(
  candidate: unknown,
): Promise<void> {
  const artifact = requireExactRecordV1(candidate, "artifact", [
    "artifactId",
    "canonicalJsonAlgorithm",
    "payloadSha256",
    "payload",
  ]);
  if (
    artifact.artifactId !==
    MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID
  ) {
    throw new Error(
      "Standard66 timestep comparison artifact identity is invalid",
    );
  }
  if (artifact.canonicalJsonAlgorithm !== CANONICAL_JSON_ALGORITHM_V1) {
    throw new Error(
      "Standard66 timestep comparison canonical JSON identity is invalid",
    );
  }
  requireSha256V1(artifact.payloadSha256, "payload hash");
  if (
    artifact.payloadSha256 !== (await sha256CanonicalJsonHex(artifact.payload))
  ) {
    throw new Error("Standard66 timestep comparison payload hash is invalid");
  }

  const payload = requireExactRecordV1(artifact.payload, "payload", [
    "preregistrationId",
    "study",
    "comparisonProtocolIdentityHash",
    "comparisonCohortIdentityHash",
    "sourceArms",
    "comparisonResult",
    "claim",
  ]);
  if (
    payload.preregistrationId !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID
  ) {
    throw new Error(
      "Standard66 timestep comparison preregistration identity is invalid",
    );
  }
  requireSha256V1(
    payload.comparisonProtocolIdentityHash,
    "comparison protocol identity hash",
  );
  requireSha256V1(
    payload.comparisonCohortIdentityHash,
    "comparison cohort identity hash",
  );
  assertEnvelopeStudyV1(payload.study);
  if (
    canonicalJsonStringify(payload.claim) !==
    canonicalJsonStringify(
      MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_CLAIM_V1,
    )
  ) {
    throw new Error("Standard66 timestep comparison claim boundary is invalid");
  }
  if (!Array.isArray(payload.sourceArms) || payload.sourceArms.length !== 3) {
    throw new Error(
      "Standard66 timestep comparison source arms must contain exactly three records",
    );
  }
  const sourceArms = payload.sourceArms.map((source, index) =>
    assertSourceArmV1(source, index),
  );
  if (
    new Set(
      sourceArms.map(
        ({ constructionIdentityHash }) => constructionIdentityHash,
      ),
    ).size !== 1
  ) {
    throw new Error(
      "Standard66 timestep comparison source arms must have identical construction identity hashes",
    );
  }
  for (const [index, source] of sourceArms.entries()) {
    const previous = sourceArms[index - 1];
    if (previous !== undefined && compareSourceArmsV1(previous, source) > 0) {
      throw new Error(
        "Standard66 timestep comparison source arms are not in canonical clock-arm order",
      );
    }
    if (
      source.comparisonInput.compatibility.comparisonProtocolIdentity !==
        payload.comparisonProtocolIdentityHash ||
      source.comparisonInput.compatibility.comparisonCohortIdentity !==
        payload.comparisonCohortIdentityHash
    ) {
      throw new Error(
        "Standard66 timestep comparison source compatibility identity is inconsistent",
      );
    }
  }
  const recomputed = evaluateMainWireStandard66TimestepComparisonV1({
    expectedComparison: {
      comparisonProtocolIdentity: payload.comparisonProtocolIdentityHash,
      comparisonCohortIdentity: payload.comparisonCohortIdentityHash,
    },
    arms: sourceArms.map(({ comparisonInput }) => comparisonInput),
  });
  if (
    canonicalJsonStringify(payload.comparisonResult) !==
    canonicalJsonStringify(recomputed)
  ) {
    throw new Error(
      "Standard66 timestep comparison result does not match the pure evaluator",
    );
  }
  canonicalJsonStringify(candidate);
}

export async function serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
  artifact: MainWireStandard66ValidationTimestepComparisonArtifactV1,
): Promise<string> {
  await assertMainWireStandard66ValidationTimestepComparisonArtifactV1(
    artifact,
  );
  return canonicalJsonStringify(artifact);
}

export async function parseMainWireStandard66ValidationTimestepComparisonArtifactV1(
  serialized: string,
): Promise<MainWireStandard66ValidationTimestepComparisonArtifactV1> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Standard66 timestep comparison artifact JSON is invalid");
  }
  await assertMainWireStandard66ValidationTimestepComparisonArtifactV1(parsed);
  return ownCanonicalDataV1<MainWireStandard66ValidationTimestepComparisonArtifactV1>(
    parsed,
    "parsed artifact",
  );
}

/**
 * Strictly binds a comparison artifact to the three canonical run artifacts
 * that produced it. Standalone parsing validates the comparison's internal
 * canonical data and pure-evaluator result only; it cannot reverify detached
 * source references without these serialized run artifacts.
 */
export async function verifyMainWireStandard66ValidationTimestepComparisonArtifactAgainstSerializedRunsV1(
  candidate: unknown,
  serializedRunArtifacts: readonly string[],
): Promise<MainWireStandard66ValidationTimestepComparisonArtifactV1> {
  await assertMainWireStandard66ValidationTimestepComparisonArtifactV1(
    candidate,
  );
  const recreated =
    await createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1(
      serializedRunArtifacts,
    );
  if (canonicalJsonStringify(candidate) !== canonicalJsonStringify(recreated)) {
    throw new Error(
      "Standard66 timestep comparison artifact does not match canonical recreation from its serialized run artifacts",
    );
  }
  return ownCanonicalDataV1<MainWireStandard66ValidationTimestepComparisonArtifactV1>(
    candidate,
    "source-bound artifact",
  );
}

function requireValidationEnvelopeStudyV1(
  artifact: MainWireStandard66ValidationRunArtifactV1,
): Readonly<{ studyKind: "validation-envelope"; caseId: EnvelopeCaseIdV1 }> {
  if (artifact.payload.study.studyKind !== "validation-envelope") {
    throw new Error(
      "Standard66 timestep comparison accepts validation-envelope arm artifacts only",
    );
  }
  assertEnvelopeStudyV1(artifact.payload.study);
  return ownCanonicalDataV1(
    artifact.payload.study,
    "validation-envelope study",
  );
}

function assertEnvelopeStudyV1(study: unknown): asserts study is Readonly<{
  studyKind: "validation-envelope";
  caseId: EnvelopeCaseIdV1;
}> {
  const record = requireExactRecordV1(study, "study", ["studyKind", "caseId"]);
  if (record.studyKind !== "validation-envelope") {
    throw new Error(
      "Standard66 timestep comparison study must be a validation-envelope coordinate",
    );
  }
  if (
    !MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.some(
      ({ caseId }) => caseId === record.caseId,
    )
  ) {
    throw new Error(
      "Standard66 timestep comparison validation-envelope case is not preregistered",
    );
  }
}

function assertSourceArmV1(
  source: unknown,
  index: number,
): MainWireStandard66ValidationTimestepComparisonSourceArmV1 {
  const record = requireExactRecordV1(source, `source arm ${index}`, [
    "armId",
    "runArtifactId",
    "runArtifactSha256",
    "runArtifactPayloadSha256",
    "armProtocolIdentityHash",
    "constructionIdentityHash",
    "comparisonInput",
  ]);
  if (
    record.runArtifactId !== MAIN_WIRE_STANDARD66_VALIDATION_RUN_ARTIFACT_V1_ID
  ) {
    throw new Error(
      "Standard66 timestep comparison source run artifact identity is invalid",
    );
  }
  if (
    !MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.some(
      ({ armId }) => armId === record.armId,
    )
  ) {
    throw new Error(
      "Standard66 timestep comparison source clock-arm identity is invalid",
    );
  }
  for (const [label, hash] of [
    ["source artifact", record.runArtifactSha256],
    ["source artifact payload", record.runArtifactPayloadSha256],
    ["arm protocol identity", record.armProtocolIdentityHash],
    ["construction identity", record.constructionIdentityHash],
  ] as const) {
    requireSha256V1(hash, `${label} hash`);
  }
  const comparisonInput = assertComparisonInputShapeV1(record.comparisonInput);
  if (record.armId !== comparisonInput.armId) {
    throw new Error(
      "Standard66 timestep comparison source arm identity is inconsistent",
    );
  }
  return record as unknown as MainWireStandard66ValidationTimestepComparisonSourceArmV1;
}

function assertComparisonInputShapeV1(
  input: unknown,
): MainWireStandard66TimestepComparisonArmInputV1 {
  const record = requireExactRecordV1(input, "source comparison input", [
    "armId",
    "requestedStepSec",
    "executionPurpose",
    "compatibility",
    "period1Settlement",
    "freshPeriod1Confirmation",
    "terminalMeasurements",
  ]);
  requireExactRecordV1(record.compatibility, "source compatibility", [
    "preregistrationId",
    "comparisonProtocolIdentity",
    "comparisonCohortIdentity",
  ]);
  assertAvailabilityUnionV1(
    record.period1Settlement,
    "period1-settled",
    "source settlement",
  );
  assertAvailabilityUnionV1(
    record.freshPeriod1Confirmation,
    "period1-confirmed",
    "source confirmation",
  );
  const terminal = requirePlainRecordV1(
    record.terminalMeasurements,
    "source terminal measurements",
  );
  if (terminal.status === "available") {
    requireExactRecordV1(terminal, "source available terminal measurements", [
      "status",
      "methodCompatibility",
      "preregisteredDtGateValues",
    ]);
    requireExactRecordV1(
      terminal.methodCompatibility,
      "source terminal method compatibility",
      [
        "terminalBeatMeasurementEvaluatorId",
        "flowEventTimingMethodId",
        "pressureRatePrimaryConfigurationIdentity",
      ],
    );
    requirePlainRecordV1(
      terminal.preregisteredDtGateValues,
      "source terminal gate values",
    );
  } else if (terminal.status === "unavailable") {
    requireExactRecordV1(terminal, "source unavailable terminal measurements", [
      "status",
      "reason",
    ]);
    if (typeof terminal.reason !== "string") {
      throw new Error(
        "Standard66 timestep comparison source terminal reason must be a string",
      );
    }
  } else {
    throw new Error(
      "Standard66 timestep comparison source terminal availability is invalid",
    );
  }
  return record as unknown as MainWireStandard66TimestepComparisonArmInputV1;
}

function assertAvailabilityUnionV1(
  value: unknown,
  availableStatus: "period1-settled" | "period1-confirmed",
  label: string,
): void {
  const record = requirePlainRecordV1(value, label);
  if (record.status === availableStatus) {
    requireExactRecordV1(record, label, ["status"]);
  } else if (record.status === "unavailable") {
    requireExactRecordV1(record, label, ["status", "reason"]);
    if (typeof record.reason !== "string") {
      throw new Error(
        `Standard66 timestep comparison ${label} reason must be a string`,
      );
    }
  } else {
    throw new Error(
      `Standard66 timestep comparison ${label} status is invalid`,
    );
  }
}

function clockArmOrderV1(
  armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
): number {
  const index =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.findIndex(
      (arm) => arm.armId === armId,
    );
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}

function compareSourceArmsV1(
  first: MainWireStandard66ValidationTimestepComparisonSourceArmV1,
  second: MainWireStandard66ValidationTimestepComparisonSourceArmV1,
): number {
  const armOrder = clockArmOrderV1(first.armId) - clockArmOrderV1(second.armId);
  return armOrder === 0
    ? first.runArtifactSha256.localeCompare(second.runArtifactSha256)
    : armOrder;
}

function requireExactRecordV1(
  value: unknown,
  label: string,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  const record = requirePlainRecordV1(value, label);
  const actualKeys = Object.keys(record).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  if (
    actualKeys.length !== sortedExpectedKeys.length ||
    actualKeys.some((key, index) => key !== sortedExpectedKeys[index])
  ) {
    throw new Error(
      `Standard66 timestep comparison ${label} fields must match exactly`,
    );
  }
  return record;
}

function requirePlainRecordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new Error(
      `Standard66 timestep comparison ${label} must be a plain object`,
    );
  }
  return value as Record<string, unknown>;
}

function requireSha256V1(
  value: unknown,
  label: string,
): asserts value is string {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN.test(value)) {
    throw new Error(`Standard66 timestep comparison ${label} is invalid`);
  }
}

function ownCanonicalDataV1<T>(value: unknown, label: string): T {
  try {
    return deepFreezeCanonicalJson(
      JSON.parse(canonicalJsonStringify(value)) as CanonicalJsonValue,
    ) as T;
  } catch (error) {
    throw new Error(
      `Standard66 timestep comparison ${label} is not canonical JSON data: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
