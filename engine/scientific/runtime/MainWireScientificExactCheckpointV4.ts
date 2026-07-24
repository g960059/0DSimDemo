import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  loadMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
} from "@/engine/scientific/inputs";
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

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ID =
  "main-wire-scientific-session-exact-checkpoint-v4" as const;

export const MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ASSEMBLY =
  "fixed-normal-adult-five-wall-noncoronary" as const;

export type MainWireScientificSessionStateCodecIdentityV4 = Readonly<{
  stateSchemaId: string;
  stateSchemaVersion: number;
  transactionCheckpointId:
    "main-wire-five-wall-noncoronary-checkpoint-v1";
  transactionCheckpointSchemaVersion: 1;
}>;

export type MainWireScientificSessionCanonicalPhaseV4 = Readonly<{
  driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
  driveParameterSetId:
    typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId;
  cycleLengthSec:
    typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec;
  phase01: number;
  derivation: "accepted-time-positive-modulo-drive-cycle";
}>;

export type MainWireScientificSessionExactCheckpointV4 = Readonly<{
  checkpointId:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ID;
  schemaVersion: 4;
  releaseRef: SimulationReleaseRef;
  baseSessionInputSha256: string;
  assembly:
    typeof MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ASSEMBLY;
  controlTargetState: MainWireScientificResearchControlTargetStateV0;
  controlTargetStateSha256: string;
  parameterEpoch: number;
  stateCodec: MainWireScientificSessionStateCodecIdentityV4;
  canonicalPhase: MainWireScientificSessionCanonicalPhaseV4;
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  periodicSettlementTracker:
    MainWireScientificSessionPeriodicTrackerCheckpointV1 | null;
  claim: Readonly<{
    exactReleaseRequired: true;
    exactBaseSessionInputRequired: true;
    baseSessionInputDigestSemantics:
      typeof MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS;
    completeControlTargetStateStored: true;
    controlTargetStateDigestStored: true;
    parameterEpochStored: true;
    stateCodecIdentityStored: true;
    canonicalPhaseStored: true;
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

export type MainWireScientificSessionExactCheckpointIdentityV4 = Readonly<{
  releaseRef: SimulationReleaseRef;
  baseSessionInputSha256: string;
  stateCodec: MainWireScientificSessionStateCodecIdentityV4;
}>;

export type MainWireScientificSessionExactCheckpointSourceV4 = Readonly<{
  controlTargetState: MainWireScientificResearchControlTargetStateV0;
  parameterEpoch: number;
  transaction: MainWireFiveWallNonCoronaryCheckpointV1;
  periodicSettlementTracker:
    MainWireScientificSessionPeriodicTrackerCheckpointV1 | null;
}>;

export async function createMainWireScientificSessionExactCheckpointV4(
  identity: MainWireScientificSessionExactCheckpointIdentityV4,
  source: MainWireScientificSessionExactCheckpointSourceV4,
): Promise<MainWireScientificSessionExactCheckpointV4> {
  assertExpectedIdentity(identity);
  assertParameterEpoch(source.parameterEpoch);
  const controlTargetState =
    await loadMainWireScientificResearchControlTargetStateV0(
      source.controlTargetState,
    );
  if (!sameSimulationReleaseRef(identity.releaseRef, controlTargetState.releaseRef)) {
    throw checkpointError("control target release identity mismatch");
  }
  const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
    checkpointId: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ID,
    schemaVersion: 4,
    releaseRef: identity.releaseRef,
    baseSessionInputSha256: identity.baseSessionInputSha256,
    assembly: MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ASSEMBLY,
    controlTargetState,
    controlTargetStateSha256: controlTargetState.targetStateSha256,
    parameterEpoch: source.parameterEpoch,
    stateCodec: identity.stateCodec,
    canonicalPhase: canonicalPhase(source.transaction.acceptedTimeSec),
    transaction: source.transaction,
    periodicSettlementTracker: source.periodicSettlementTracker,
    claim: {
      exactReleaseRequired: true,
      exactBaseSessionInputRequired: true,
      baseSessionInputDigestSemantics:
        MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS,
      completeControlTargetStateStored: true,
      controlTargetStateDigestStored: true,
      parameterEpochStored: true,
      stateCodecIdentityStored: true,
      canonicalPhaseStored: true,
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
  return loadMainWireScientificSessionExactCheckpointV4(identity, checkpoint);
}

export async function loadMainWireScientificSessionExactCheckpointV4(
  expectedIdentity: MainWireScientificSessionExactCheckpointIdentityV4,
  value: unknown,
): Promise<MainWireScientificSessionExactCheckpointV4> {
  assertExpectedIdentity(expectedIdentity);
  const safe = cloneCheckpointCandidate(value);
  assertEnvelope(safe);
  const typed = safe as unknown as MainWireScientificSessionExactCheckpointV4;

  if (!sameSimulationReleaseRef(expectedIdentity.releaseRef, typed.releaseRef)) {
    throw checkpointError("release identity mismatch");
  }
  if (
    typed.baseSessionInputSha256
      !== expectedIdentity.baseSessionInputSha256
  ) {
    throw checkpointError("base resolved session-input identity mismatch");
  }
  if (!sameStateCodec(expectedIdentity.stateCodec, typed.stateCodec)) {
    throw checkpointError("state-codec identity mismatch");
  }

  const { checkpointSha256, ...payload } = typed;
  const expectedCheckpointSha256 = await sha256CanonicalJsonHex(payload);
  if (checkpointSha256 !== expectedCheckpointSha256) {
    throw checkpointError("outer SHA-256 mismatch");
  }

  const controlTargetState =
    await loadMainWireScientificResearchControlTargetStateV0(
      typed.controlTargetState,
    );
  if (!sameSimulationReleaseRef(typed.releaseRef, controlTargetState.releaseRef)) {
    throw checkpointError("control target release identity mismatch");
  }
  if (
    typed.controlTargetStateSha256
      !== controlTargetState.targetStateSha256
  ) throw checkpointError("control target digest mismatch");

  return typed;
}

function canonicalPhase(
  acceptedTimeSec: number,
): MainWireScientificSessionCanonicalPhaseV4 {
  const evaluated = evaluateFiveWallNormalCalciumDriveV1(
    acceptedTimeSec,
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  );
  return Object.freeze({
    driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
    driveParameterSetId:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId,
    cycleLengthSec:
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec,
    phase01: evaluated.cyclePhase01,
    derivation: "accepted-time-positive-modulo-drive-cycle" as const,
  });
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
  identity: MainWireScientificSessionExactCheckpointIdentityV4,
): void {
  const releaseIssues = simulationReleaseRefIssuesV1(identity?.releaseRef);
  if (releaseIssues.length > 0) {
    throw checkpointError(`invalid expected releaseRef: ${releaseIssues.join("; ")}`);
  }
  if (
    typeof identity.baseSessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(identity.baseSessionInputSha256)
  ) throw checkpointError("invalid expected base resolved session-input SHA-256");
  assertStateCodec(identity.stateCodec, "expected stateCodec");
}

function assertEnvelope(value: CanonicalJsonObject): void {
  if (!hasExactKeys(value, [
    "checkpointId",
    "schemaVersion",
    "releaseRef",
    "baseSessionInputSha256",
    "assembly",
    "controlTargetState",
    "controlTargetStateSha256",
    "parameterEpoch",
    "stateCodec",
    "canonicalPhase",
    "transaction",
    "periodicSettlementTracker",
    "claim",
    "checkpointSha256",
  ])) throw checkpointError("envelope mismatch");

  const releaseIssues = simulationReleaseRefIssuesV1(value.releaseRef);
  const claim = recordOrNull(value.claim);
  if (
    value.checkpointId !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ID
    || value.schemaVersion !== 4
    || value.assembly
      !== MAIN_WIRE_SCIENTIFIC_SESSION_EXACT_CHECKPOINT_V4_ASSEMBLY
    || releaseIssues.length > 0
    || typeof value.baseSessionInputSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.baseSessionInputSha256)
    || typeof value.controlTargetStateSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.controlTargetStateSha256)
    || typeof value.checkpointSha256 !== "string"
    || !SHA256_HEX_PATTERN.test(value.checkpointSha256)
    || claim === null
    || !hasExactKeys(claim, [
      "exactReleaseRequired",
      "exactBaseSessionInputRequired",
      "baseSessionInputDigestSemantics",
      "completeControlTargetStateStored",
      "controlTargetStateDigestStored",
      "parameterEpochStored",
      "stateCodecIdentityStored",
      "canonicalPhaseStored",
      "semanticReresolutionAllowedHere",
      "derivedObservationStored",
      "outerIntegrity",
      "innerTransactionFingerprint",
      "periodicSettlementTrackerStored",
      "periodicSettlementExactCommandContinuation",
    ])
    || claim.exactReleaseRequired !== true
    || claim.exactBaseSessionInputRequired !== true
    || claim.baseSessionInputDigestSemantics
      !== MAIN_WIRE_SCIENTIFIC_SESSION_INPUT_V1_DIGEST_SEMANTICS
    || claim.completeControlTargetStateStored !== true
    || claim.controlTargetStateDigestStored !== true
    || claim.parameterEpochStored !== true
    || claim.stateCodecIdentityStored !== true
    || claim.canonicalPhaseStored !== true
    || claim.semanticReresolutionAllowedHere !== false
    || claim.derivedObservationStored !== false
    || claim.outerIntegrity !== "canonical-json-sha256"
    || claim.innerTransactionFingerprint
      !== "transition-compatibility-only-non-authoritative"
    || claim.periodicSettlementTrackerStored !== true
    || claim.periodicSettlementExactCommandContinuation !== true
  ) throw checkpointError("envelope mismatch");

  assertParameterEpoch(value.parameterEpoch);
  assertStateCodec(value.stateCodec, "stateCodec");
  assertTransactionEnvelope(value.transaction, "transaction");
  assertCanonicalPhase(value.canonicalPhase, value.transaction);
  assertPeriodicTrackerEnvelope(value.periodicSettlementTracker);
}

function assertStateCodec(value: unknown, path: string): void {
  const stateCodec = recordOrNull(value);
  if (
    stateCodec === null
    || !hasExactKeys(stateCodec, [
      "stateSchemaId",
      "stateSchemaVersion",
      "transactionCheckpointId",
      "transactionCheckpointSchemaVersion",
    ])
    || typeof stateCodec.stateSchemaId !== "string"
    || stateCodec.stateSchemaId.trim() === ""
    || !Number.isSafeInteger(stateCodec.stateSchemaVersion)
    || (stateCodec.stateSchemaVersion as number) <= 0
    || stateCodec.transactionCheckpointId
      !== "main-wire-five-wall-noncoronary-checkpoint-v1"
    || stateCodec.transactionCheckpointSchemaVersion !== 1
  ) throw checkpointError(`${path} mismatch`);
}

function assertCanonicalPhase(
  value: unknown,
  untrustedTransaction: unknown,
): void {
  const phase = recordOrNull(value);
  const transaction = recordOrNull(untrustedTransaction);
  if (
    phase === null
    || transaction === null
    || !hasExactKeys(phase, [
      "driveId",
      "driveParameterSetId",
      "cycleLengthSec",
      "phase01",
      "derivation",
    ])
    || phase.driveId !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID
    || phase.driveParameterSetId
      !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId
    || phase.cycleLengthSec
      !== FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.cycleLengthSec
    || !finiteInHalfOpenUnitInterval(phase.phase01)
    || phase.derivation !== "accepted-time-positive-modulo-drive-cycle"
  ) throw checkpointError("canonical phase mismatch");
  const expected = canonicalPhase(transaction.acceptedTimeSec as number);
  if (phase.phase01 !== expected.phase01) {
    throw checkpointError("canonical phase does not match accepted time");
  }
}

function assertParameterEpoch(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw checkpointError("parameter epoch must be a non-negative safe integer");
  }
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

function sameStateCodec(
  left: MainWireScientificSessionStateCodecIdentityV4,
  right: MainWireScientificSessionStateCodecIdentityV4,
): boolean {
  return left.stateSchemaId === right.stateSchemaId
    && left.stateSchemaVersion === right.stateSchemaVersion
    && left.transactionCheckpointId === right.transactionCheckpointId
    && left.transactionCheckpointSchemaVersion
      === right.transactionCheckpointSchemaVersion;
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
  return new Error(`main-wire scientific exact checkpoint V4 rejected: ${message}`);
}
