import {
  assertMainWireStandard69PreloadReservePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard69PreloadReservePolicyV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import type {
  MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import type {
  MainWireIntegratedModelFormalPreloadReserveQualificationV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
  type MainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "./MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

export type MainWireIntegratedStudioStandard69BaselineValidationV1 = Readonly<
  Omit<MainWireIntegratedStudioRoundedEjectionBaselineValidationV1, "modelId">
  & Readonly<{
    modelId: typeof MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1;
  }>
>;

export function buildMainWireIntegratedStudioStandard69BaselineValidationV1(
  qualification: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
  preloadReserve: MainWireIntegratedModelFormalPreloadReserveQualificationV1,
): MainWireIntegratedStudioStandard69BaselineValidationV1 {
  assertMainWireStandard69PreloadReservePassedV1(preloadReserve);
  const base = buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
    qualification,
    preloadReserve,
  );
  return Object.freeze({
    ...base,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1,
  });
}

export function validateMainWireIntegratedStudioStandard69BaselineValidationV1(
  input: unknown,
): MainWireIntegratedStudioStandard69BaselineValidationV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Standard69 baseline validation report must be an object");
  }
  const report = input as Partial<
    MainWireIntegratedStudioStandard69BaselineValidationV1
  >;
  if (
    report.modelId
      !== MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_MODEL_ID_V1
  ) {
    throw new Error("Standard69 baseline validation modelId mismatch");
  }
  const validated = validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1({
    ...report,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
  });
  assertMainWireStandard69PreloadReservePassedV1(validated.preloadReserve);
  return input as MainWireIntegratedStudioStandard69BaselineValidationV1;
}
