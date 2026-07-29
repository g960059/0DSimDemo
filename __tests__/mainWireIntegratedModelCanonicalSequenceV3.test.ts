import { describe, expect, it } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";

const CANONICAL_ACCEPTED_STEP_COUNT_V3 = 500;
const CANONICAL_ACCEPTED_SEQUENCE_SHA256_V3 =
  "edec3f9eb3b24eabd690d5451e98245dc44a070b48f75c878b2f669b583a73c9";

describe("main-wire integrated V3 canonical accepted sequence", () => {
  it("pins every accepted state over the first canonical second", () => {
    // Regenerate deliberately: npm exec vite-node -- --script tools/performance/sequenceHashV3.ts
    const sequence = captureMainWireIntegratedModelSequenceV3(
      CANONICAL_ACCEPTED_STEP_COUNT_V3,
    );

    expect(sequence.acceptedStepCount).toBe(
      CANONICAL_ACCEPTED_STEP_COUNT_V3,
    );
    expect(mainWireIntegratedModelSequenceSha256V3(
      sequence.canonicalAcceptedStates,
    )).toBe(CANONICAL_ACCEPTED_SEQUENCE_SHA256_V3);
  }, 60_000);
});
