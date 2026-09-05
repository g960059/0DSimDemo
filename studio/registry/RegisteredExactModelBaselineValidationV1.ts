import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
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
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID } from "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";

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
): MainWireIntegratedStudioStandard70BaselineAssessmentV2
  | null {
  if (modelId !== MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    || baselineFixture == null) return null;
  const fixture = studioCanonicalJsonStringify(baselineFixture);
  if (fixture === studioCanonicalJsonStringify(launchBaselineJsonV1.capture.fixture)) {
    return ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1;
  }
  return fixture === studioCanonicalJsonStringify(descriptor.defaultFixture)
    ? ORIGINAL_ALGEBRAIC_PULMONARY_ROOT_BASELINE_VALIDATION_V1 : null;
}

/** The report's admitted policy, not the current app policy, owns its meaning. */
export function registeredBaselinePressureRatePresentationV1(
  report: NonNullable<ReturnType<typeof resolveRegisteredExactModelBaselineValidationV1>>,
  side: "left" | "right",
) {
  const referenceOnly = "assessment" in report
    && report.assessment?.policyId === MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID;
  const failed = report.checks.some((check) =>
    [`${side}-ventricle.maximum-dpdt`, `${side}-ventricle.minimum-dpdt`].includes(check.checkId)
    && check.status === "failed");
  return Object.freeze({
    status: referenceOnly ? (failed ? "warning" as const : "reference" as const) : undefined,
    detailKey: side === "left"
      ? referenceOnly ? "workbench.editor.simulationInfo.baselineLvDpDtDetail" as const
        : "workbench.editor.simulationInfo.baselineHistoricalLvDpDtDetail" as const
      : referenceOnly ? "workbench.editor.simulationInfo.baselineRvDpDtDetail" as const
        : "workbench.editor.simulationInfo.baselineHistoricalRvDpDtDetail" as const,
  });
}
