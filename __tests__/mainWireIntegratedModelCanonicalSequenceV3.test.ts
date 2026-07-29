import { describe, expect, it } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3,
} from "@/engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3";
import {
  selectValidationStampModeV1,
  validationStampModeV1,
  validationStampsDisabledV1,
} from "@/engine/validationStampModeV1";

describe("main-wire integrated V3 canonical accepted sequence", () => {
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
