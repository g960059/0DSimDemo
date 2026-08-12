import { describe, expect, it, vi } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3,
} from "@/engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3";
import {
  isTransitivelyFrozenPlainDataV1,
  selectValidationStampModeV1,
  validationStampModeV1,
  validationStampsDisabledV1,
} from "@/engine/validationStampModeV1";

describe("main-wire integrated V3 canonical accepted sequence", () => {
  it("recognizes only transitively frozen plain-data graphs", () => {
    const frozen = Object.freeze({
      nested: Object.freeze([Object.freeze({ value: 1 })]),
    });
    const mutableDescendant = Object.freeze({ nested: { value: 1 } });
    const cyclic: { self?: unknown; value: number } = { value: 1 };
    cyclic.self = cyclic;
    Object.freeze(cyclic);

    expect(isTransitivelyFrozenPlainDataV1(frozen)).toBe(true);
    // Re-entry exercises the retained identity proof.
    expect(isTransitivelyFrozenPlainDataV1(frozen)).toBe(true);
    expect(isTransitivelyFrozenPlainDataV1(mutableDescendant)).toBe(false);
    expect(isTransitivelyFrozenPlainDataV1(cyclic)).toBe(true);
    expect(isTransitivelyFrozenPlainDataV1(Object.freeze(new Date(0))))
      .toBe(false);
  });

  it("bypasses retained transitive proofs while validation stamps are disabled", () => {
    const frozen = Object.freeze({
      nested: Object.freeze({ value: 1 }),
    });
    expect(isTransitivelyFrozenPlainDataV1(frozen)).toBe(true);

    const previous = validationStampModeV1();
    const originalIsFrozen = Object.isFrozen;
    let rootChecks = 0;
    const isFrozen = vi.spyOn(Object, "isFrozen").mockImplementation((value) => {
      if (value === frozen) rootChecks += 1;
      return originalIsFrozen(value);
    });
    selectValidationStampModeV1("validation-stamps-disabled");
    try {
      expect(isTransitivelyFrozenPlainDataV1(frozen)).toBe(true);
      expect(rootChecks).toBeGreaterThan(0);
    } finally {
      selectValidationStampModeV1(previous);
      isFrozen.mockRestore();
    }
  });

  it("pins every accepted state over the first canonical second", () => {
    // Regenerate deliberately: npm exec vite-node -- --script tools/performance/sequenceHashV3.ts
    const sequence = captureMainWireIntegratedModelSequenceV3(
      MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3
        .acceptedStepCount,
    );

    expect(sequence.acceptedStepCount).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3
        .acceptedStepCount,
    );
    expect(mainWireIntegratedModelSequenceSha256V3(
      sequence.canonicalAcceptedStates,
    )).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3.sha256,
    );
  }, 60_000);

  it("pins the same accepted sequence with validation stamps disabled", () => {
    const previous = validationStampModeV1();
    selectValidationStampModeV1("validation-stamps-disabled");
    try {
      expect(validationStampModeV1()).toBe("validation-stamps-disabled");
      expect(validationStampsDisabledV1()).toBe(true);
      const sequence = captureMainWireIntegratedModelSequenceV3(
        MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3
          .acceptedStepCount,
      );
      expect(mainWireIntegratedModelSequenceSha256V3(
        sequence.canonicalAcceptedStates,
      )).toBe(
        MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3.sha256,
      );
    } finally {
      selectValidationStampModeV1(previous);
    }
    expect(validationStampModeV1()).toBe(previous);
  }, 60_000);
});
