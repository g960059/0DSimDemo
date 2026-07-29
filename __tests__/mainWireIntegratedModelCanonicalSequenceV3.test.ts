import { describe, expect, it } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3,
} from "@/engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3";

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
});
