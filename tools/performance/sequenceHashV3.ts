import { createHash } from "node:crypto";

import {
  captureMainWireIntegratedModelSequenceV3,
  timeMainWireIntegratedModelAcceptedStepsV3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";

const sequence = captureMainWireIntegratedModelSequenceV3(500);
const hash = createHash("sha256");
for (const state of sequence.canonicalAcceptedStates) {
  hash.update(`${Buffer.byteLength(state)}:`);
  hash.update(state);
}
const timings = [
  timeMainWireIntegratedModelAcceptedStepsV3(100),
  timeMainWireIntegratedModelAcceptedStepsV3(100),
];
console.log(JSON.stringify({
  acceptedStepCount: sequence.acceptedStepCount,
  sequenceSha256: hash.digest("hex"),
  msPerAcceptedStep: timings.map((timing) => timing.msPerAcceptedStep),
}, null, 2));
