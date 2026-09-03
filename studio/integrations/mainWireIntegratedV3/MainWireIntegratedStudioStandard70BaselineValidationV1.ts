import type {
  MainWireIntegratedModelFormalPreloadReserveQualificationV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1_ID,
  assertMainWireStandard70PreloadReservePassedV1,
} from "@/analysis/policies/mainWire/MainWireStandard70PreloadReservePolicyV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
} from "@/domain/model/MainWireStandardIdentityV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID,
  type MainWireIntegratedModelStandard70BaselineQualificationV1,
  type MainWireIntegratedModelStandard70CandidateInitializationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
  assertMainWireIntegratedModelStandard70BaselinePassedV1,
  type MainWireIntegratedModelStandard70BaselineCheckV1,
  type MainWireIntegratedModelStandard70BaselineMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID,
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "./MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID =
  "circleheart.main-wire.algebraic-pulmonary-root-baseline-validation.v1" as const;

export type MainWireIntegratedStudioStandard70BaselineValidationV1 = Readonly<{
  schemaId:
    typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID;
  modelId:
    typeof MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1;
  qualificationId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID;
  validationMethodId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID;
  preloadReservePolicyId:
    typeof MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1_ID;
  status: "passed";
  nominalDtSec: number;
  initializationKind:
    MainWireIntegratedModelStandard70CandidateInitializationV1["kind"];
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
  measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1;
  checks: readonly MainWireIntegratedModelStandard70BaselineCheckV1[];
  preloadReserve: MainWireIntegratedModelFormalPreloadReserveQualificationV1;
}>;

export function buildMainWireIntegratedStudioStandard70BaselineValidationV1(
  qualification: MainWireIntegratedModelStandard70BaselineQualificationV1,
  preloadReserve: MainWireIntegratedModelFormalPreloadReserveQualificationV1,
): MainWireIntegratedStudioStandard70BaselineValidationV1 {
  if (
    qualification.classification.status !== "period1-converged"
    || qualification.classification.latestPeriod1MaximumNormalizedDelta === null
  ) {
    throw new Error("Standard70 baseline report requires period-1 convergence");
  }
  assertMainWireIntegratedModelStandard70BaselinePassedV1(
    qualification.checks,
    qualification.measurements,
  );
  assertMainWireStandard70PreloadReservePassedV1(preloadReserve);
  return Object.freeze({
    schemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID,
    modelId:
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1,
    qualificationId: qualification.qualificationId,
    validationMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID,
    preloadReservePolicyId:
      MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1_ID,
    status: "passed" as const,
    nominalDtSec: qualification.nominalDtSec,
    initializationKind: qualification.initializationKind,
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
    preloadReserve,
  });
}

export function validateMainWireIntegratedStudioStandard70BaselineValidationV1(
  input: unknown,
): MainWireIntegratedStudioStandard70BaselineValidationV1 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Standard70 baseline validation report must be an object");
  }
  const report = input as Partial<
    MainWireIntegratedStudioStandard70BaselineValidationV1
  >;
  if (
    report.schemaId !==
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID
    || report.modelId !==
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_MODEL_ID_V1
    || report.qualificationId !==
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_QUALIFICATION_V1_ID
    || report.validationMethodId !==
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_VALIDATION_V1_ID
    || report.preloadReservePolicyId !==
      MAIN_WIRE_STANDARD70_PRELOAD_RESERVE_POLICY_V1_ID
    || report.status !== "passed"
    || report.measurements === undefined
    || report.checks === undefined
    || !validRightHeartMeasurementsV1(report.measurements)
  ) {
    throw new Error("Standard70 baseline validation report is invalid");
  }
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1({
    ...report,
    schemaId:
      MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID,
    modelId: MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_MODEL_ID_V1,
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
    validationMethodId:
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  });
  assertMainWireIntegratedModelStandard70BaselinePassedV1(
    report.checks,
    report.measurements,
  );
  assertMainWireStandard70PreloadReservePassedV1(report.preloadReserve!);
  return input as MainWireIntegratedStudioStandard70BaselineValidationV1;
}

function validRightHeartMeasurementsV1(
  measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1,
): boolean {
  const scalarMeasurements = [
    ...Object.values(measurements.pulmonaryValve ?? {}),
    ...Object.values(measurements.rightVentricle ?? {}),
    ...Object.values(measurements.tricuspidFlow ?? {}),
    ...Object.values(measurements.rightTiming ?? {}),
  ];
  const morphology = measurements.pulmonaryRootMorphology;
  return scalarMeasurements.length === 11
    && scalarMeasurements.every(Number.isFinite)
    && morphology !== undefined
    && Number.isSafeInteger(morphology.papSignificantPeakCount)
    && Number.isSafeInteger(morphology.pvForwardEpisodeCount)
    && Number.isSafeInteger(morphology.pvFlowSignificantPeakCount)
    && morphology.papSignificantPeakCount >= 0
    && morphology.pvForwardEpisodeCount >= 0
    && morphology.pvFlowSignificantPeakCount >= 0
    && Number.isFinite(morphology.maximumPostClosurePapReboundMmHg)
    && morphology.maximumPostClosurePapReboundMmHg >= 0;
}
