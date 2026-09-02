import {
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
  type MainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";
import roundedEjectionBaselineValidationJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/rounded-ejection-standard68-baseline-validation.json";
import {
  validateMainWireIntegratedStudioStandard69BaselineValidationV1,
  type MainWireIntegratedStudioStandard69BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard69BaselineValidationV1";
import qualifiedBaselineValidationJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/qualified-baseline-standard69-baseline-validation.json";

const ROUNDED_EJECTION_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    roundedEjectionBaselineValidationJsonV1,
  );
const QUALIFIED_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard69BaselineValidationV1(
    qualifiedBaselineValidationJsonV1,
  );

/** Client-side presentation lookup; qualification remains release/mint owned. */
export function resolveRegisteredExactModelBaselineValidationV1(
  modelId: string | null | undefined,
): MainWireIntegratedStudioRoundedEjectionBaselineValidationV1
  | MainWireIntegratedStudioStandard69BaselineValidationV1
  | null {
  if (modelId === MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1) {
    return ROUNDED_EJECTION_BASELINE_VALIDATION_V1;
  }
  return modelId === MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1
    ? QUALIFIED_BASELINE_VALIDATION_V1
    : null;
}
