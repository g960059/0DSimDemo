import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  type MainWireIntegratedModelBaselineValidationCheckV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
  type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID =
  "circleheart.main-wire.rounded-ejection-baseline-validation.v1" as const;

export type MainWireIntegratedStudioRoundedEjectionBaselineValidationV1 =
  Readonly<{
    schemaId:
      typeof MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID;
    modelId:
      typeof MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1;
    qualificationId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID;
    validationMethodId:
      typeof MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID;
    status: "passed";
    nominalDtSec: number;
    completedCycleCount: number;
    periodicity: Readonly<{
      status: "period1-converged";
      evidenceCycleIndices: readonly number[];
      latestPeriod1MaximumNormalizedDelta: number;
    }>;
    checkpoint: Readonly<{
      checkpointId: string;
      revision: number;
      acceptedTimeSec: number;
      checkpointSha256: string;
    }>;
    measurements: MainWireIntegratedModelBaselineValidationMeasurementsV1;
    checks: readonly MainWireIntegratedModelBaselineValidationCheckV1[];
  }>;

export function buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
  qualification: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
): MainWireIntegratedStudioRoundedEjectionBaselineValidationV1 {
  if (
    qualification.classification.status !== "period1-converged"
    || qualification.classification.latestPeriod1MaximumNormalizedDelta === null
    || qualification.checks.some(({ status }) => status !== "passed")
  ) {
    throw new Error(
      "Standard68 baseline report requires period-1 convergence and all gates",
    );
  }
  return Object.freeze({
    schemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
    qualificationId: qualification.qualificationId,
    validationMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
    status: "passed" as const,
    nominalDtSec: qualification.nominalDtSec,
    completedCycleCount: qualification.completedCycleCount,
    periodicity: Object.freeze({
      status: "period1-converged" as const,
      evidenceCycleIndices: Object.freeze([
        ...qualification.classification.evidenceCycleIndices,
      ]),
      latestPeriod1MaximumNormalizedDelta:
        qualification.classification.latestPeriod1MaximumNormalizedDelta,
    }),
    checkpoint: Object.freeze({
      checkpointId: qualification.checkpoint.checkpointId,
      revision: qualification.checkpoint.revision,
      acceptedTimeSec: qualification.checkpoint.acceptedTimeSec,
      checkpointSha256: qualification.checkpoint.checkpointSha256,
    }),
    measurements: qualification.measurements,
    checks: qualification.checks,
  });
}

export function validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
  input: unknown,
): MainWireIntegratedStudioRoundedEjectionBaselineValidationV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Standard68 baseline validation report must be an object");
  }
  const report = input as Partial<
    MainWireIntegratedStudioRoundedEjectionBaselineValidationV1
  >;
  if (
    report.schemaId !==
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID
    || report.modelId !==
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1
    || report.qualificationId !==
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID
    || report.validationMethodId !==
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID
    || report.status !== "passed"
    || !Number.isFinite(report.nominalDtSec)
    || !Number.isSafeInteger(report.completedCycleCount)
    || report.periodicity?.status !== "period1-converged"
    || !Number.isFinite(
      report.periodicity.latestPeriod1MaximumNormalizedDelta,
    )
    || report.checkpoint === undefined
    || typeof report.checkpoint.checkpointId !== "string"
    || !Number.isSafeInteger(report.checkpoint.revision)
    || !Number.isFinite(report.checkpoint.acceptedTimeSec)
    || !/^[0-9a-f]{64}$/.test(report.checkpoint.checkpointSha256)
    || report.measurements === undefined
    || !Array.isArray(report.checks)
    || report.checks.length === 0
    || report.checks.some((check) => check.status !== "passed")
  ) {
    throw new Error("Standard68 baseline validation report is invalid");
  }
  return input as MainWireIntegratedStudioRoundedEjectionBaselineValidationV1;
}
