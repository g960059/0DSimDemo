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
  buildMainWireIntegratedModelStandard70BaselineChecksV1,
  type MainWireIntegratedModelStandard70BaselineCheckV1,
  type MainWireIntegratedModelStandard70BaselineMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_V1_SCHEMA_ID,
  validateMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "./MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID =
  "circleheart.main-wire.algebraic-pulmonary-root-baseline-validation.v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_INITIALIZATION_KINDS_V1 =
  Object.freeze([
    "cold",
    "standard68-construction-continuation",
    "standard70-exact-checkpoint",
    "standard70-parameter-continuation",
  ] as const);

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
    || !MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_INITIALIZATION_KINDS_V1
      .some((kind) => kind === report.initializationKind)
    || report.measurements === undefined
    || report.checks === undefined
    || !validRightHeartMeasurementsV1(report.measurements)
    || !validCanonicalStandard70ChecksV1(
      report.measurements,
      report.checks,
    )
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

export function validRightHeartMeasurementsV1(
  measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1,
): boolean {
  const morphology = measurements.pulmonaryRootMorphology;
  return validFiniteRecordV1(measurements.pulmonaryValve, [
    "ejectionTimeSec",
    "meanGradientMmHg",
    "peakGradientMmHg",
  ])
    && validFiniteRecordV1(measurements.rightVentricle, [
      "maximumDpDtMmHgPerSec",
      "minimumDpDtMmHgPerSec",
    ])
    && validFiniteRecordV1(measurements.tricuspidFlow, [
      "peakEMlPerSec",
      "peakAMlPerSec",
      "peakEToA",
    ])
    && validFiniteRecordV1(measurements.rightTiming, [
      "ictSec",
      "irtSec",
      "teiIndex",
    ])
    && validFiniteRecordV1(morphology, [
      "papSignificantPeakCount",
      "pvForwardEpisodeCount",
      "pvFlowSignificantPeakCount",
      "maximumPostClosurePapReboundMmHg",
    ])
    && Number.isSafeInteger(morphology.papSignificantPeakCount)
    && Number.isSafeInteger(morphology.pvForwardEpisodeCount)
    && Number.isSafeInteger(morphology.pvFlowSignificantPeakCount)
    && morphology.papSignificantPeakCount >= 0
    && morphology.pvForwardEpisodeCount >= 0
    && morphology.pvFlowSignificantPeakCount >= 0
    && Number.isFinite(morphology.maximumPostClosurePapReboundMmHg)
    && morphology.maximumPostClosurePapReboundMmHg >= 0;
}

function validFiniteRecordV1(
  value: unknown,
  expectedKeys: readonly string[],
): value is Readonly<Record<string, number>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Readonly<Record<string, unknown>>;
  const actualKeys = Object.keys(record);
  return actualKeys.length === expectedKeys.length
    && expectedKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(record, key))
    && expectedKeys.every((key) => Number.isFinite(record[key]));
}

export function validCanonicalStandard70ChecksV1(
  measurements: MainWireIntegratedModelStandard70BaselineMeasurementsV1,
  checks: readonly MainWireIntegratedModelStandard70BaselineCheckV1[],
): boolean {
  if (!Array.isArray(checks)) return false;
  try {
    const expected = buildMainWireIntegratedModelStandard70BaselineChecksV1(
      measurements,
      true,
    );
    return checks.length === expected.length
      && expected.every((expectedCheck, index) => {
        const actualCheck = checks[index];
        return actualCheck !== undefined
          && actualCheck.checkId === expectedCheck.checkId
          && actualCheck.status === expectedCheck.status
          && actualCheck.actual === expectedCheck.actual
          && actualCheck.minimum === expectedCheck.minimum
          && actualCheck.maximum === expectedCheck.maximum
          && actualCheck.unit === expectedCheck.unit;
      });
  } catch {
    return false;
  }
}
