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
  validateMainWireIntegratedStudioStandard70BaselineAssessmentV2,
  type MainWireIntegratedStudioStandard70BaselineAssessmentV2,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineAssessmentV2";
import launchBaselineJsonV1 from
  "@/data/model-baselines/standard70-launch-baseline.json";
import originalBaselineJsonV1 from
  "@/studio/integrations/mainWireIntegratedV3/algebraic-pulmonary-root-standard70-baseline-validation.json";
import descriptor from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json";
import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import type { StudioJsonValueV2 } from "@/studio/contracts/v2/json";

const ROUNDED_EJECTION_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    roundedEjectionBaselineValidationJsonV1,
  );
const QUALIFIED_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard69BaselineValidationV1(
    qualifiedBaselineValidationJsonV1,
  );
const ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(
    launchBaselineJsonV1.validationReport,
  );
const ORIGINAL_ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 =
  validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(originalBaselineJsonV1);

/** Client-side presentation lookup; qualification remains release/mint owned. */
export function resolveRegisteredExactModelBaselineValidationV1(
  modelId: string | null | undefined,
  baselineFixture?: StudioJsonValueV2 | null,
): MainWireIntegratedStudioRoundedEjectionBaselineValidationV1
  | MainWireIntegratedStudioStandard69BaselineValidationV1
  | MainWireIntegratedStudioStandard70BaselineAssessmentV2
  | null {
  if (modelId === MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1) {
    return ROUNDED_EJECTION_BASELINE_VALIDATION_V1;
  }
  if (modelId === MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1) {
    return QUALIFIED_BASELINE_VALIDATION_V1;
  }
  if (modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    || baselineFixture == null) return null;
  const fixture = studioCanonicalJsonStringify(baselineFixture);
  if (fixture === studioCanonicalJsonStringify(launchBaselineJsonV1.capture.fixture)) {
    return ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1;
  }
  return fixture === studioCanonicalJsonStringify(descriptor.defaultFixture)
    ? ORIGINAL_ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 : null;
}
