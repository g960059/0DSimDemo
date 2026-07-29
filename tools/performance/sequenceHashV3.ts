import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
  timeMainWireIntegratedModelAcceptedStepsV3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  selectHotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";

selectHotPathIntegrityTierV1("hot-path-lean");
const sequence = captureMainWireIntegratedModelSequenceV3(500);
const timings = [
  timeMainWireIntegratedModelAcceptedStepsV3(500),
  timeMainWireIntegratedModelAcceptedStepsV3(500),
];
console.log(JSON.stringify({
  hotPathIntegrityTier: "hot-path-lean",
  acceptedStepCount: sequence.acceptedStepCount,
  sequenceSha256: mainWireIntegratedModelSequenceSha256V3(
    sequence.canonicalAcceptedStates,
  ),
  msPerAcceptedStep: timings.map((timing) => timing.msPerAcceptedStep),
}, null, 2));
