import {
  decodeCanonicalFlatDataV1,
  encodeCanonicalFlatDataIntoV1,
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";
import type {
  AcceptedStateAuthorityV1,
  AcceptedStateValidatorV1,
} from "@/engine/core/acceptedStateAuthorityV1";

export const FLAT_ACCEPTED_STATE_AUTHORITY_V1_ID =
  "circleheart-flat-accepted-state-authority-v1" as const;
export const FLAT_ACCEPTED_STATE_DEFAULT_CAPACITY_BYTES_V1 =
  512 * 1024;

export type FlatAcceptedStateAuthorityReportV1 = Readonly<{
  authorityId: typeof FLAT_ACCEPTED_STATE_AUTHORITY_V1_ID;
  capacityBytesPerBuffer: number;
  currentLengthBytes: number;
  highWaterLengthBytes: number;
  commitCount: number;
  activeBufferIndex: 0 | 1;
  fixedBufferCount: 2;
  poisonedReason: string | null;
}>;

/**
 * Phase 1b accepted-state authority. Only bytes that survive encode, decode,
 * and model validation can become current. Buffer identities and capacity are
 * fixed for the lifetime of the authority; no lifetime string table exists.
 */
export class FlatAcceptedStateAuthorityV1<TState>
  implements AcceptedStateAuthorityV1<TState> {
  readonly authorityId = FLAT_ACCEPTED_STATE_AUTHORITY_V1_ID;

  readonly #buffers: readonly [Uint8Array, Uint8Array];
  readonly #validate: AcceptedStateValidatorV1<TState>;
  #currentIndex: 0 | 1 = 0;
  #currentLength = 0;
  #currentState: TState;
  #highWaterLength = 0;
  #commitCount = 0;
  #poisonedReason: string | null = null;

  constructor(
    initialState: TState,
    validate: AcceptedStateValidatorV1<TState>,
    capacityBytes = FLAT_ACCEPTED_STATE_DEFAULT_CAPACITY_BYTES_V1,
  ) {
    if (
      !Number.isSafeInteger(capacityBytes)
      || capacityBytes < 1
      || capacityBytes > 0x7fff_ffff
    ) {
      throw new Error("Flat accepted-state capacity is invalid");
    }
    this.#buffers = Object.freeze([
      new Uint8Array(capacityBytes),
      new Uint8Array(capacityBytes),
    ]);
    this.#validate = validate;
    const initialLength = encodeCanonicalFlatDataIntoV1(
      initialState,
      this.#buffers[0],
    );
    const owned = validate(
      decodeCanonicalFlatDataV1(this.#buffers[0], initialLength),
    );
    this.#currentLength = initialLength;
    this.#highWaterLength = initialLength;
    this.#currentState = owned;
  }

  current(): TState {
    this.assertHealthy();
    return this.#currentState;
  }

  snapshot(): TState {
    this.assertHealthy();
    return this.#validate(decodeCanonicalFlatDataV1(
      this.#buffers[this.#currentIndex],
      this.#currentLength,
    ));
  }

  commit(candidate: TState): TState {
    this.assertHealthy();
    const candidateIndex = this.#currentIndex === 0 ? 1 : 0;
    const destination = this.#buffers[candidateIndex];
    try {
      const length = encodeCanonicalFlatDataIntoV1(candidate, destination);
      const owned = this.#validate(
        decodeCanonicalFlatDataV1(destination, length),
      );
      this.#currentIndex = candidateIndex;
      this.#currentLength = length;
      this.#highWaterLength = Math.max(this.#highWaterLength, length);
      this.#currentState = owned;
      this.#commitCount += 1;
      return owned;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.#poisonedReason = `candidate commit failed: ${message}`;
      throw new Error(
        `Flat accepted-state authority is poisoned: ${this.#poisonedReason}`,
      );
    }
  }

  snapshotCurrentBytes(): Uint8Array {
    this.assertHealthy();
    return this.#buffers[this.#currentIndex].slice(0, this.#currentLength);
  }

  report(): FlatAcceptedStateAuthorityReportV1 {
    return Object.freeze({
      authorityId: FLAT_ACCEPTED_STATE_AUTHORITY_V1_ID,
      capacityBytesPerBuffer: this.#buffers[0].byteLength,
      currentLengthBytes: this.#currentLength,
      highWaterLengthBytes: this.#highWaterLength,
      commitCount: this.#commitCount,
      activeBufferIndex: this.#currentIndex,
      fixedBufferCount: 2 as const,
      poisonedReason: this.#poisonedReason,
    });
  }

  /** Exact encoded size without allocating or mutating either authority buffer. */
  measureCandidate(candidate: TState): number {
    this.assertHealthy();
    return measureCanonicalFlatDataV1(candidate);
  }

  private assertHealthy(): void {
    if (this.#poisonedReason !== null) {
      throw new Error(
        `Flat accepted-state authority is poisoned: ${this.#poisonedReason}`,
      );
    }
  }
}
