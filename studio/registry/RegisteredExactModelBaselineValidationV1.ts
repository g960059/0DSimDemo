import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
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
import {
  validateMainWireIntegratedStudioStandard70BaselineValidationV1,
  type MainWireIntegratedStudioStandard70BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import launchBaselineJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/standard70-launch-baseline.json";

const ROUNDED_EJECTION_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    roundedEjectionBaselineValidationJsonV1,
  );
const QUALIFIED_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard69BaselineValidationV1(
    qualifiedBaselineValidationJsonV1,
  );
const ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard70BaselineValidationV1(
    launchBaselineJsonV1.validationReport,
  );

/** Client-side presentation lookup; qualification remains release/mint owned. */
export function resolveRegisteredExactModelBaselineValidationV1(
  modelId: string | null | undefined,
): MainWireIntegratedStudioRoundedEjectionBaselineValidationV1
  | MainWireIntegratedStudioStandard69BaselineValidationV1
  | MainWireIntegratedStudioStandard70BaselineValidationV1
  | null {
  if (modelId === MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1) {
    return ROUNDED_EJECTION_BASELINE_VALIDATION_V1;
  }
  if (modelId === MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1) {
    return QUALIFIED_BASELINE_VALIDATION_V1;
  }
  return modelId
      === MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    ? ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1
    : null;
}
