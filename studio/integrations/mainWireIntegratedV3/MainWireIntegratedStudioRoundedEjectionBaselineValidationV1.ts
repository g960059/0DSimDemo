import {
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_V1_ID,
  type MainWireIntegratedModelBaselineValidationCheckV1,
  type MainWireIntegratedModelBaselineValidationMeasurementsV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_QUALIFICATION_V1_ID,
  type MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID,
  mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1,
  MainWireIntegratedModelFormalPreloadReserveQualificationV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
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
    preloadReserve:
      MainWireIntegratedModelFormalPreloadReserveQualificationV1;
  }>;

export function buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
  qualification: MainWireIntegratedModelRoundedEjectionBaselineQualificationV1,
  preloadReserve:
    MainWireIntegratedModelFormalPreloadReserveQualificationV1,
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
    preloadReserve,
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
    || !validCardiacSizeAndFunctionV1(
      report.measurements.cardiacSizeAndFunction,
    )
    || !Array.isArray(report.checks)
    || report.checks.length === 0
    || report.checks.some((check) => check.status !== "passed")
    || report.preloadReserve?.status !== "passed"
    || report.preloadReserve.qualificationId !==
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID
    || report.preloadReserve.protocolId !==
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRESSURE_VOLUME_PROTOCOL_V3_ID
    || !Number.isFinite(report.preloadReserve.sourceGlobalTbvMl)
    || !Number.isFinite(report.preloadReserve.hypovolemicGlobalTbvMl)
    || !Number.isFinite(report.preloadReserve.hypovolemicGlobalTbvScale)
    || !Number.isFinite(report.preloadReserve.hypervolemicGlobalTbvMl)
    || !Number.isFinite(report.preloadReserve.hypervolemicGlobalTbvScale)
    || report.preloadReserve.hypovolemicGlobalTbvScale !==
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1
        .hypovolemicGlobalTbvScale
    || report.preloadReserve.hypervolemicGlobalTbvScale !==
      MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1
        .hypervolemicGlobalTbvScale
    || !approximatelyEqualV1(
      report.preloadReserve.hypovolemicGlobalTbvMl,
      report.preloadReserve.sourceGlobalTbvMl *
        report.preloadReserve.hypovolemicGlobalTbvScale,
    )
    || !approximatelyEqualV1(
      report.preloadReserve.hypervolemicGlobalTbvMl,
      report.preloadReserve.sourceGlobalTbvMl *
        report.preloadReserve.hypervolemicGlobalTbvScale,
    )
    || !validPreloadReserveSideV1(report.preloadReserve.left)
    || !validPreloadReserveSideV1(report.preloadReserve.right)
  ) {
    throw new Error("Standard68 baseline validation report is invalid");
  }
  return input as MainWireIntegratedStudioRoundedEjectionBaselineValidationV1;
}

function validPreloadReserveSideV1(
  side: MainWireIntegratedModelFormalPreloadReserveQualificationV1["left"]
    | undefined,
): boolean {
  return side !== undefined
    && validPreloadReserveDirectionV1(side.hypovolemic, "hypovolemic")
    && validPreloadReserveDirectionV1(side.hypervolemic, "hypervolemic");
}

function validPreloadReserveDirectionV1(
  response:
    MainWireIntegratedModelFormalPreloadReserveQualificationV1["left"]["hypovolemic"]
      | undefined,
  expectedDirection: "hypovolemic" | "hypervolemic",
): boolean {
  if (response?.endpointDirection !== expectedDirection) return false;
  const sign = expectedDirection === "hypervolemic" ? 1 : -1;
  return response.baselineCardiacOutputLPerMin > 0
    && response.baselineEndDiastolicVolumeMl > 0
    && Object.entries(response).every(([key, value]) =>
    key === "endpointDirection" || Number.isFinite(value))
    && approximatelyEqualV1(
      response.directionalFillingPressureChangeMmHg,
      sign * (
        response.endpointFillingPressureMmHg
        - response.baselineFillingPressureMmHg
      ),
    )
    && approximatelyEqualV1(
      response.directionalCardiacOutputChangeLPerMin,
      sign * (
        response.endpointCardiacOutputLPerMin
        - response.baselineCardiacOutputLPerMin
      ),
    )
    && approximatelyEqualV1(
      response.directionalCardiacOutputChangeFraction01,
      response.directionalCardiacOutputChangeLPerMin
        / response.baselineCardiacOutputLPerMin,
    )
    && approximatelyEqualV1(
      response.cardiacOutputSlopeLPerMinPerMmHg,
      response.directionalCardiacOutputChangeLPerMin
        / response.directionalFillingPressureChangeMmHg,
    )
    && approximatelyEqualV1(
      response.directionalEndDiastolicVolumeChangeMl,
      sign * (
        response.endpointEndDiastolicVolumeMl
        - response.baselineEndDiastolicVolumeMl
      ),
    )
    && approximatelyEqualV1(
      response.directionalEndDiastolicVolumeChangeFraction01,
      response.directionalEndDiastolicVolumeChangeMl
        / response.baselineEndDiastolicVolumeMl,
    )
    && approximatelyEqualV1(
      response.directionalEndDiastolicTransmuralPressureChangeMmHg,
      sign * (
        response.endpointEndDiastolicTransmuralPressureMmHg
        - response.baselineEndDiastolicTransmuralPressureMmHg
      ),
    )
    && approximatelyEqualV1(
      response.endDiastolicVolumeResponseMlPerMmHg,
      response.directionalEndDiastolicVolumeChangeMl
        / response.directionalEndDiastolicTransmuralPressureChangeMmHg,
    )
    && mainWireIntegratedModelFormalPreloadReserveDirectionalResponsePassedV1(
      response,
    );
}

function approximatelyEqualV1(left: number, right: number): boolean {
  return Math.abs(left - right) <=
    1e-10 * Math.max(1, Math.abs(left), Math.abs(right));
}

function validCardiacSizeAndFunctionV1(
  value:
    MainWireIntegratedModelBaselineValidationMeasurementsV1["cardiacSizeAndFunction"]
      | undefined,
): boolean {
  if (value === undefined) return false;
  const bsaM2 = value.bodySurfaceAreaM2;
  const ventricles = [value.leftVentricle, value.rightVentricle];
  return bsaM2 ===
      MAIN_WIRE_INTEGRATED_MODEL_BASELINE_VALIDATION_POLICY_V1
        .indexedCardiacSizeAndFunction.bodySurfaceAreaM2
    && [
      ...Object.values(value.leftVentricle),
      ...Object.values(value.rightVentricle),
      ...Object.values(value.systemicForwardFlow),
    ].every((measurement) => Number.isFinite(measurement))
    && ventricles.every((ventricle) =>
      ventricle.endDiastolicVolumeMl > ventricle.endSystolicVolumeMl
      && ventricle.endSystolicVolumeMl > 0
      && ventricle.ejectionFraction01 > 0
      && ventricle.ejectionFraction01 < 1
      && approximatelyEqualV1(
        ventricle.endDiastolicVolumeIndexMlPerM2,
        ventricle.endDiastolicVolumeMl / bsaM2,
      )
      && approximatelyEqualV1(
        ventricle.endSystolicVolumeIndexMlPerM2,
        ventricle.endSystolicVolumeMl / bsaM2,
      )
      && approximatelyEqualV1(
        ventricle.ejectionFraction01,
        (ventricle.endDiastolicVolumeMl - ventricle.endSystolicVolumeMl)
          / ventricle.endDiastolicVolumeMl,
      ))
    && value.systemicForwardFlow.strokeVolumeMl > 0
    && value.systemicForwardFlow.cardiacOutputLPerMin > 0
    && approximatelyEqualV1(
      value.systemicForwardFlow.strokeVolumeIndexMlPerM2,
      value.systemicForwardFlow.strokeVolumeMl / bsaM2,
    )
    && approximatelyEqualV1(
      value.systemicForwardFlow.cardiacIndexLPerMinPerM2,
      value.systemicForwardFlow.cardiacOutputLPerMin / bsaM2,
    );
}
