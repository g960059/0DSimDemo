import { describe, expect, it, vi } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
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

  it("preserves every accepted state with validation stamps enabled or disabled in one runtime", () => {
    const previous = validationStampModeV1();
    try {
      // Historical full-precision hashes are not portable across Node/V8 and
      // platforms. Validation shortcuts must still preserve every state exactly.
      selectValidationStampModeV1("validation-stamps-enabled");
      expect(validationStampModeV1()).toBe("validation-stamps-enabled");
      expect(validationStampsDisabledV1()).toBe(false);
      const enabled = captureMainWireIntegratedModelSequenceV3(500);
      selectValidationStampModeV1("validation-stamps-disabled");
      expect(validationStampModeV1()).toBe("validation-stamps-disabled");
      expect(validationStampsDisabledV1()).toBe(true);
      const disabled = captureMainWireIntegratedModelSequenceV3(500);
      for (const sequence of [enabled, disabled]) {
        expect(sequence.acceptedStepCount).toBe(500);
        expect(sequence.canonicalAcceptedStates).toHaveLength(500);
      }
      enabled.canonicalAcceptedStates.forEach((state, index) => {
        expect(disabled.canonicalAcceptedStates[index]).toBe(state);
      });
    } finally {
      selectValidationStampModeV1(previous);
    }
    expect(validationStampModeV1()).toBe(previous);
  }, 60_000);
});
