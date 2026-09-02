import type {
  MainWireIntegratedModelStandard68CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard68CheckpointV1";
import { cloneAndFreezeStudioJson } from "@/domain/json/CanonicalJson";
import {
  createMainWireIntegratedStudioRoundedEjectionReleaseV1,
  type MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1,
} from "./MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "./MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";
import settledBaselineCheckpointJsonV1 from
  "./rounded-ejection-standard68-settled-baseline-checkpoint.json";
import baselineValidationJsonV1 from
  "./rounded-ejection-standard68-baseline-validation.json";

/**
 * Standard68's release entry owns its verified default start. Keeping this
 * wrapper separate prevents the large settled checkpoint from entering the
 * immutable Standard66/67 artifacts that share the generic runtime host.
 */
export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1 =
  cloneAndFreezeStudioJson(
    settledBaselineCheckpointJsonV1,
  ) as unknown as MainWireIntegratedModelStandard68CheckpointV1;

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1 =
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    cloneAndFreezeStudioJson(baselineValidationJsonV1),
  );

const baselineClock =
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1
    .checkpoint;
const settledCheckpoint =
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1;
if (
  settledCheckpoint.checkpointId !== baselineClock.checkpointId
  || settledCheckpoint.revision !== baselineClock.revision
  || settledCheckpoint.acceptedTimeSec !== baselineClock.acceptedTimeSec
  || settledCheckpoint.checkpointSha256 !== baselineClock.checkpointSha256
) {
  throw new Error(
    "Standard68 settled checkpoint and baseline validation report disagree",
  );
}

export function createCircleHeartExactModelReleaseV1():
  MainWireIntegratedStudioSelectedAorticOutflowExactReleaseV1 {
  return createMainWireIntegratedStudioRoundedEjectionReleaseV1(
    settledCheckpoint,
  );
}

export const createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1 =
  createCircleHeartExactModelReleaseV1;
