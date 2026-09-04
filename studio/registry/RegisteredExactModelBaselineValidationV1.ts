import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  validateMainWireIntegratedStudioStandard70BaselineValidationV1,
  type MainWireIntegratedStudioStandard70BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
import algebraicPulmonaryRootValidationJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";

const ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard70BaselineValidationV1(
    algebraicPulmonaryRootValidationJsonV1,
  );

/** Client-side presentation lookup; qualification remains release/mint owned. */
export function resolveRegisteredExactModelBaselineValidationV1(
  modelId: string | null | undefined,
): MainWireIntegratedStudioStandard70BaselineValidationV1
  | null {
  return modelId
      === MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    ? ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1
    : null;
}
