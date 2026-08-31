import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  writeMainWireFiveWallAcceptedNumericalReadbackV3,
  type MainWireFiveWallSelectedAorticValveReadbackV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";

export const MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_V1_ID =
  "main-wire-selected-aortic-port-session-extension-v1" as const;
export const MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_TICKET_V1_ID =
  "main-wire-selected-aortic-port-session-ticket-v1" as const;

export const MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1 =
  Object.freeze({
    modelOwnerScope: "standard-66-only" as const,
    legacyStandard65InstantiatesExtension: false as const,
    historicalAcceptedReadbackChanged: false as const,
    acceptedHemodynamicStateAdded: false as const,
    candidateReadbackWidthF64:
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
    acceptedReadbackWidthF64:
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
    readbackPublication:
      "committed-clock-and-revision-matched-ticket-promotion-only" as const,
    failedPromotionAcceptedSideEffects: false as const,
    instantaneousReadbackCheckpointed: false as const,
    exactBeatAnalysisStateCheckpointed: false as const,
    acceptedRevisionContinuityOwner: "outer-standard-session" as const,
    acceptedClockCheckpointOwner: "outer-standard-checkpoint" as const,
    restoredInstantaneousReadbackAvailability:
      "unavailable-until-next-accepted-step" as const,
  });

export type MainWireSelectedAorticPortCandidateClockV1 = Readonly<{
  candidateTimeSec: number;
  candidateRevision: number;
}>;

export type MainWireSelectedAorticPortAcceptedReadbackClockV1 = Readonly<{
  acceptedTimeSec: number;
  revision: number;
}>;

export type MainWireSelectedAorticPortCandidateStageInputV1 = Readonly<{
  expectedCandidateTimeSec: number;
  expectedCandidateRevision: number;
  candidateTimeSec: number;
  candidateRevision: number;
  historicalAcceptedNumericalReadback: Float64Array;
  selectedAorticValveReadback: MainWireFiveWallSelectedAorticValveReadbackV1;
}>;

export type MainWireSelectedAorticPortPromotionInputV1 = Readonly<{
  committedAcceptedTimeSec: number;
  committedRevision: number;
}>;

export type MainWireSelectedAorticPortSessionTicketV1 = Readonly<{
  ticketId: typeof MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_TICKET_V1_ID;
  ticketOrdinal: number;
  candidateClock: MainWireSelectedAorticPortCandidateClockV1;
  promote(input: MainWireSelectedAorticPortPromotionInputV1): void;
  /** Idempotently aborts an unpromoted ticket. Safe in a finally block. */
  close(): void;
}>;

type TicketStateV1 = "open" | "promotion-failed" | "promoted" | "closed";

/**
 * Standard66-only transactional owner for the selected instantaneous readback.
 * It does not own beat analysis or persistent checkpoint state. Candidate
 * staging remains separate from accepted publication so a failed numerical
 * transaction cannot expose a readback from an unaccepted state.
 */
export class MainWireSelectedAorticPortSessionExtensionV1 {
  readonly extensionId = MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_V1_ID;

  readonly #candidateNumericalReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  readonly #acceptedNumericalReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  #acceptedReadbackClock: MainWireSelectedAorticPortAcceptedReadbackClockV1
    | null = null;
  #activeTicketOrdinal: number | null = null;
  #nextTicketOrdinal = 1;

  static createColdV1(): MainWireSelectedAorticPortSessionExtensionV1 {
    return new MainWireSelectedAorticPortSessionExtensionV1();
  }

  acceptedReadbackClockV1():
    MainWireSelectedAorticPortAcceptedReadbackClockV1 | null {
    return this.#acceptedReadbackClock;
  }

  /** Guards a synchronous exact-checkpoint capture without persisting readback. */
  assertReadyForExactCheckpointV1(): void {
    if (this.#activeTicketOrdinal !== null) {
      throw new Error(
        "cannot checkpoint selected aortic session with an open ticket",
      );
    }
  }

  withAcceptedReadbackV3<T>(
    expected: MainWireSelectedAorticPortAcceptedReadbackClockV1,
    borrow: (acceptedNumericalReadback: Float64Array) => T,
  ): T | null {
    const expectedClock = ownAcceptedClockV1(
      expected,
      "selected aortic accepted readback expected clock",
    );
    if (typeof borrow !== "function") {
      throw new Error("selected aortic accepted readback borrow must be a function");
    }
    const available = this.#acceptedReadbackClock;
    if (available === null) return null;
    if (
      available.acceptedTimeSec !== expectedClock.acceptedTimeSec
      || available.revision !== expectedClock.revision
    ) {
      throw new Error("selected aortic accepted readback clock does not match");
    }
    if (
      this.#acceptedNumericalReadback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
      ] !== available.acceptedTimeSec
    ) {
      throw new Error("selected aortic accepted readback clock drifted");
    }
    return borrow(this.#acceptedNumericalReadback);
  }

  stageCandidateV1(
    input: MainWireSelectedAorticPortCandidateStageInputV1,
  ): MainWireSelectedAorticPortSessionTicketV1 {
    if (this.#activeTicketOrdinal !== null) {
      throw new Error("selected aortic candidate ticket is already open");
    }
    const stage = ownCandidateStageInputV1(input);
    if (
      stage.candidateTimeSec !== stage.expectedCandidateTimeSec
      || stage.candidateRevision !== stage.expectedCandidateRevision
    ) {
      throw new Error("selected aortic candidate clock does not match expected clock");
    }
    if (
      stage.historicalAcceptedNumericalReadback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
      ] !== stage.candidateTimeSec
    ) {
      throw new Error("selected aortic historical readback clock does not match candidate");
    }
    const acceptedClock = this.#acceptedReadbackClock;
    if (
      acceptedClock !== null
      && (!(stage.candidateTimeSec > acceptedClock.acceptedTimeSec)
        || !(stage.candidateRevision > acceptedClock.revision))
    ) {
      throw new Error("selected aortic candidate clock did not advance");
    }
    writeMainWireFiveWallAcceptedNumericalReadbackV3(
      this.#candidateNumericalReadback,
      stage.historicalAcceptedNumericalReadback,
      stage.selectedAorticValveReadback,
    );
    if (
      this.#candidateNumericalReadback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
      ] !== stage.candidateTimeSec
    ) {
      throw new Error("selected aortic staged readback clock drifted");
    }

    const ticketOrdinal = this.#nextTicketOrdinal;
    this.#nextTicketOrdinal += 1;
    this.#activeTicketOrdinal = ticketOrdinal;
    const candidateClock = Object.freeze({
      candidateTimeSec: stage.candidateTimeSec,
      candidateRevision: stage.candidateRevision,
    });
    let state: TicketStateV1 = "open";
    return Object.freeze({
      ticketId: MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_TICKET_V1_ID,
      ticketOrdinal,
      candidateClock,
      promote: (promotionInput: MainWireSelectedAorticPortPromotionInputV1) => {
        if (state !== "open") {
          throw new Error("selected aortic candidate ticket promotion is not open");
        }
        try {
          this.#promoteCandidateV1(
            ticketOrdinal,
            candidateClock,
            promotionInput,
          );
          state = "promoted";
        } catch (error) {
          state = "promotion-failed";
          throw error;
        }
      },
      close: () => {
        if (state === "open" || state === "promotion-failed") {
          this.#abortCandidateV1(ticketOrdinal);
          state = "closed";
        }
      },
    }) satisfies MainWireSelectedAorticPortSessionTicketV1;
  }

  #promoteCandidateV1(
    ticketOrdinal: number,
    candidateClock: MainWireSelectedAorticPortCandidateClockV1,
    input: MainWireSelectedAorticPortPromotionInputV1,
  ): void {
    if (this.#activeTicketOrdinal !== ticketOrdinal) {
      throw new Error("selected aortic candidate ticket is not the active ticket");
    }
    const promotion = ownPromotionInputV1(input);
    if (
      promotion.committedAcceptedTimeSec !== candidateClock.candidateTimeSec
      || promotion.committedRevision !== candidateClock.candidateRevision
    ) {
      throw new Error("selected aortic committed clock does not match candidate");
    }
    if (
      this.#candidateNumericalReadback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
      ] !== promotion.committedAcceptedTimeSec
    ) {
      throw new Error("selected aortic candidate readback clock does not match commit");
    }

    this.#acceptedNumericalReadback.set(this.#candidateNumericalReadback);
    this.#acceptedReadbackClock = Object.freeze({
      acceptedTimeSec: promotion.committedAcceptedTimeSec,
      revision: promotion.committedRevision,
    });
    this.#activeTicketOrdinal = null;
  }

  #abortCandidateV1(ticketOrdinal: number): void {
    if (this.#activeTicketOrdinal !== ticketOrdinal) {
      throw new Error("selected aortic candidate ticket is not the active ticket");
    }
    this.#activeTicketOrdinal = null;
  }
}

function ownCandidateStageInputV1(
  input: unknown,
): MainWireSelectedAorticPortCandidateStageInputV1 {
  const label = "selected aortic candidate stage input";
  const record = plainExactRecordV1(
    input,
    [
      "expectedCandidateTimeSec",
      "expectedCandidateRevision",
      "candidateTimeSec",
      "candidateRevision",
      "historicalAcceptedNumericalReadback",
      "selectedAorticValveReadback",
    ],
    label,
  );
  const historicalAcceptedNumericalReadback =
    record.historicalAcceptedNumericalReadback;
  if (
    !(historicalAcceptedNumericalReadback instanceof Float64Array)
    || historicalAcceptedNumericalReadback.length
      !== MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1
  ) {
    throw new RangeError(
      "selected aortic historical readback must contain exactly "
        + `${MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1} f64 values`,
    );
  }
  if (
    record.selectedAorticValveReadback === null
    || typeof record.selectedAorticValveReadback !== "object"
  ) {
    throw new Error(`${label} selected valve readback must be an object`);
  }
  return Object.freeze({
    expectedCandidateTimeSec: nonnegativeFiniteV1(
      record.expectedCandidateTimeSec,
      `${label} expected candidate time`,
    ),
    expectedCandidateRevision: positiveSafeIntegerV1(
      record.expectedCandidateRevision,
      `${label} expected candidate revision`,
    ),
    candidateTimeSec: nonnegativeFiniteV1(
      record.candidateTimeSec,
      `${label} candidate time`,
    ),
    candidateRevision: positiveSafeIntegerV1(
      record.candidateRevision,
      `${label} candidate revision`,
    ),
    historicalAcceptedNumericalReadback,
    selectedAorticValveReadback: record.selectedAorticValveReadback as
      MainWireFiveWallSelectedAorticValveReadbackV1,
  });
}

function ownPromotionInputV1(
  input: unknown,
): MainWireSelectedAorticPortPromotionInputV1 {
  const label = "selected aortic candidate promotion input";
  const record = plainExactRecordV1(
    input,
    ["committedAcceptedTimeSec", "committedRevision"],
    label,
  );
  return Object.freeze({
    committedAcceptedTimeSec: nonnegativeFiniteV1(
      record.committedAcceptedTimeSec,
      `${label} committed accepted time`,
    ),
    committedRevision: positiveSafeIntegerV1(
      record.committedRevision,
      `${label} committed revision`,
    ),
  });
}

function ownAcceptedClockV1(
  input: unknown,
  label: string,
): MainWireSelectedAorticPortAcceptedReadbackClockV1 {
  const record = plainExactRecordV1(
    input,
    ["acceptedTimeSec", "revision"],
    label,
  );
  return Object.freeze({
    acceptedTimeSec: nonnegativeFiniteV1(
      record.acceptedTimeSec,
      `${label} accepted time`,
    ),
    revision: nonnegativeSafeIntegerV1(record.revision, `${label} revision`),
  });
}

function plainExactRecordV1(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
  const ownKeys = Reflect.ownKeys(input);
  if (ownKeys.some((key) => typeof key !== "string")) {
    throw new Error(`${label} contains a non-string key`);
  }
  const actual = [...(ownKeys as string[])].sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} has an unexpected field set`);
  }
  return input as Record<string, unknown>;
}

function nonnegativeFiniteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative`);
  }
  return value;
}

function positiveSafeIntegerV1(value: unknown, label: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value <= 0
  ) {
    throw new Error(`${label} must be a positive safe integer`);
  }
  return value;
}

function nonnegativeSafeIntegerV1(value: unknown, label: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 0
  ) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}
