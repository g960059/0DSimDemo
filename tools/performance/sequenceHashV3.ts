import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
  timeMainWireIntegratedModelAcceptedStepsV3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  hotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  cloneLandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  validationStampModeV1,
  validationStampsDisabledV1,
} from "@/engine/validationStampModeV1";

const hotPathIntegrityTier = hotPathIntegrityTierV1();
const validationStampMode = validationStampModeV1();
const manipulationCheck = runTierManipulationCheckV1();
const sequence = captureMainWireIntegratedModelSequenceV3(500);
const timings = [
  timeMainWireIntegratedModelAcceptedStepsV3(500),
];
console.log(JSON.stringify({
  hotPathIntegrityTier,
  validationStampMode,
  validationStampsDisabled: validationStampsDisabledV1(),
  manipulationCheck,
  acceptedStepCount: sequence.acceptedStepCount,
  sequenceSha256: mainWireIntegratedModelSequenceSha256V3(
    sequence.canonicalAcceptedStates,
  ),
  msPerAcceptedStep: timings.map((timing) => timing.msPerAcceptedStep),
}, null, 2));

function runTierManipulationCheckV1() {
  const malformed = {
    landState: new Float64Array(6),
    slsState: { viscousLogStrain: Number.NaN },
    previousFiberLogStrain: 0,
    previousFreeCalciumUM: 0,
  };
  let observed: "accepted" | "rejected";
  try {
    cloneLandSlsWallMaterialStateV1(malformed);
    observed = "accepted";
  } catch {
    observed = "rejected";
  }
  const expected = hotPathIntegrityTier === "full-invariant"
    ? "rejected"
    : "accepted";
  if (observed !== expected) {
    throw new Error(
      `hot-path integrity manipulation check expected ${expected}, observed ${observed}`,
    );
  }
  return Object.freeze({
    probe: "malformed Land/SLS clone with NaN viscous strain",
    expected,
    observed,
    passed: true as const,
  });
}
