import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  cloneAndFreezeCanonicalJson,
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  sha256CanonicalJsonHex,
  simulationReleaseRefIssuesV1,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import type {
  MainWireScientificSessionPeriodicTrackerCheckpointV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import {
  MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
} from "@/engine/scientific/inputs";

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID =
  "main-wire-scientific-session-exact-checkpoint-v3" as const;

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ASSEMBLY =
  "fixed-normal-adult-five-wall-noncoronary" as const;

export const MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_DIGEST_SEMANTICS_V1 =
  MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS;

export type MainWireScientificSessionExactCheckpointV3 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID;
  schemaVersion: 3;
  releaseRef: SimulationReleaseRef;
  sessionInputSha256: string;
  assembly:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ASSEMBLY;
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  periodicSettlementTracker:
    MainWireScientificSessionPeriodicTrackerCheckpointV1 | null;
  claim: Readonly<{
    exactReleaseRequired: true;
    exactSessionInputRequired: true;
    sessionInputDigestSemantics:
      typeof MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_DIGEST_SEMANTICS_V1;
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

export type MainWireScientificSessionExactCheckpointIdentityV3 = Readonly<{
  releaseRef: SimulationReleaseRef;
  sessionInputSha256: string;
}>;

export type MainWireScientificSessionExactCheckpointSourceV3 = Readonly<{
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  periodicSettlementTracker:
    MainWireScientificSessionPeriodicTrackerCheckpointV1 | null;
}>;

/**
 * Builds the parameterized-session checkpoint envelope. The resolved input is
 * deliberately referenced by its exact content digest rather than embedded or
 * re-resolved here; callers must retain/load that independently verified input.
 */
export async function createMainWireScientificSessionExactCheckpointV3(
  identity: MainWireScientificSessionExactCheckpointIdentityV3,
  source: MainWireScientificSessionExactCheckpointSourceV3,
): Promise<MainWireScientificSessionExactCheckpointV3> {
  assertExpectedIdentity(identity);
  const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    checkpointId: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID,
    schemaVersion: 3,
    releaseRef: identity.releaseRef,
    sessionInputSha256: identity.sessionInputSha256,
    assembly: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ASSEMBLY,
    transaction: source.transaction,
    periodicSettlementTracker: source.periodicSettlementTracker,
    claim: {
      exactReleaseRequired: true,
      exactSessionInputRequired: true,
      sessionInputDigestSemantics:
        MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_DIGEST_SEMANTICS_V1,
      semanticReresolutionAllowedHere: false,
      derivedObservationStored: false,
      outerIntegrity: "canonical-json-sha256",
      innerTransactionFingerprint:
        "transition-compatibility-only-non-authoritative",
      periodicSettlementTrackerStored: true,
      periodicSettlementExactCommandContinuation: true,
    },
  });
  const checkpoint = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
  return loadMainWireScientificSessionExactCheckpointV3(
    identity,
    checkpoint,
  );
}

/**
 * Strictly loads a V3 checkpoint against both identities supplied by the
 * independently verified release and resolved session input. V2 is not
 * accepted here and there is no semantic fallback or migration path.
 */
export async function loadMainWireScientificSessionExactCheckpointV3(
  expectedIdentity: MainWireScientificSessionExactCheckpointIdentityV3,
  value: unknown,
): Promise<MainWireScientificSessionExactCheckpointV3> {
  assertExpectedIdentity(expectedIdentity);
  const safe = cloneCheckpointCandidate(value);
  assertEnvelope(safe);
  const typed = safe as unknown as MainWireScientificSessionExactCheckpointV3;

  if (!sameSimulationReleaseRef(expectedIdentity.releaseRef, typed.releaseRef)) {
    throw checkpointError("release identity mismatch");
  }
  if (typed.sessionInputSha256 !== expectedIdentity.sessionInputSha256) {
    throw checkpointError("resolved session-input identity mismatch");
  }

  const { checkpointSha256, ...payload } = typed;
  const expectedCheckpointSha256 = await sha256CanonicalJsonHex(payload);
  if (checkpointSha256 !== expectedCheckpointSha256) {
    throw checkpointError("outer SHA-256 mismatch");
  }
  return typed;
}

function cloneCheckpointCandidate(value: unknown): CanonicalJsonObject {
  try {
    return cloneAndFreezeCanonicalJson<CanonicalJsonObject>(value);
  } catch (error) {
    throw checkpointError(
      `non-canonical JSON input: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function assertExpectedIdentity(
  identity: MainWireScientificSessionExactCheckpointIdentityV3,
): void {
  const releaseIssues = simulationReleaseRefIssuesV1(identity?.releaseRef);
  if (releaseIssues.length > 0) {
    throw checkpointError(`invalid expected releaseRef: ${releaseIssues.join("; ")}`);
  }
  if (
    typeof identity.sessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(identity.sessionInputSha256)
  ) throw checkpointError("invalid expected resolved session-input SHA-256");
}

function assertEnvelope(value: CanonicalJsonObject): void {
  if (!hasExactKeys(value, [
    "checkpointId",
    "schemaVersion",
    "releaseRef",
    "sessionInputSha256",
    "assembly",
    "transaction",
    "periodicSettlementTracker",
    "claim",
    "checkpointSha256",
  ])) throw checkpointError("envelope mismatch");

  const releaseIssues = simulationReleaseRefIssuesV1(value.releaseRef);
  const claim = recordOrNull(value.claim);
  if (
    value.checkpointId !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ID
    || value.schemaVersion !== 3
    || value.assembly
      !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V3_ASSEMBLY
    || releaseIssues.length > 0
    || typeof value.sessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.sessionInputSha256)
    || typeof value.checkpointSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.checkpointSha256)
    || claim === null
    || !hasExactKeys(claim, [
      "exactReleaseRequired",
      "exactSessionInputRequired",
      "sessionInputDigestSemantics",
      "semanticReresolutionAllowedHere",
      "derivedObservationStored",
      "outerIntegrity",
      "innerTransactionFingerprint",
      "periodicSettlementTrackerStored",
      "periodicSettlementExactCommandContinuation",
    ])
    || claim.exactReleaseRequired !== true
    || claim.exactSessionInputRequired !== true
    || claim.sessionInputDigestSemantics
      !== MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_DIGEST_SEMANTICS_V1
    || claim.semanticReresolutionAllowedHere !== false
    || claim.derivedObservationStored !== false
    || claim.outerIntegrity !== "canonical-json-sha256"
    || claim.innerTransactionFingerprint
      !== "transition-compatibility-only-non-authoritative"
    || claim.periodicSettlementTrackerStored !== true
    || claim.periodicSettlementExactCommandContinuation !== true
  ) throw checkpointError("envelope mismatch");

  assertTransactionEnvelope(value.transaction, "transaction");
  assertPeriodicTrackerEnvelope(value.periodicSettlementTracker);
}

function assertPeriodicTrackerEnvelope(value: unknown): void {
  if (value === null) return;
  const tracker = recordOrNull(value);
  if (
    tracker === null
    || !hasExactKeys(tracker, [
      "trackerCheckpointId",
      "schemaVersion",
      "anchorAcceptedTimeSec",
      "anchorPhase01",
      "completedBeatCount",
      "boundaryTransactions",
    ])
    || tracker.trackerCheckpointId
      !== "main-wire-periodic-settlement-tracker-checkpoint-v1"
    || tracker.schemaVersion !== 1
    || !finiteNonnegative(tracker.anchorAcceptedTimeSec)
    || !finiteInHalfOpenUnitInterval(tracker.anchorPhase01)
    || !Number.isSafeInteger(tracker.completedBeatCount)
    || (tracker.completedBeatCount as number) < 0
    || !Array.isArray(tracker.boundaryTransactions)
  ) throw checkpointError("periodic settlement tracker envelope mismatch");

  const expectedBoundaryCount = Math.min(
    (tracker.completedBeatCount as number) + 1,
    5,
  );
  if (tracker.boundaryTransactions.length !== expectedBoundaryCount) {
    throw checkpointError("periodic settlement tracker boundary count mismatch");
  }
  tracker.boundaryTransactions.forEach((transaction, index) =>
    assertTransactionEnvelope(
      transaction,
      `periodicSettlementTracker.boundaryTransactions[${index}]`,
    ));
}

function assertTransactionEnvelope(value: unknown, path: string): void {
  const transaction = recordOrNull(value);
  if (
    transaction === null
    || !hasExactKeys(transaction, [
      "checkpointId",
      "schemaVersion",
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "circulation",
      "mechanics",
      "checkpointFingerprint",
    ])
    || transaction.checkpointId
      !== "main-wire-five-wall-noncoronary-checkpoint-v1"
    || transaction.schemaVersion !== 1
    || transaction.transactionId
      !== "main-wire-five-wall-noncoronary-transaction-v1"
    || !Number.isSafeInteger(transaction.revision)
    || (transaction.revision as number) < 0
    || !finiteNonnegative(transaction.acceptedTimeSec)
    || recordOrNull(transaction.circulation) === null
    || recordOrNull(transaction.mechanics) === null
    || typeof transaction.checkpointFingerprint !== "string"
    || !/^[0-9a-f]{8}$/.test(transaction.checkpointFingerprint)
  ) throw checkpointError(`${path} envelope mismatch`);
}

function finiteNonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function finiteInHalfOpenUnitInterval(value: unknown): value is number {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= 0
    && value < 1;
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function hasExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function checkpointError(message: string): Error {
  return new Error(`main-wire scientific exact checkpoint V3 rejected: ${message}`);
}
