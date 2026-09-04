import type {
  MainWireIntegratedModelFormalPreloadReserveQualificationV1,
  MainWireIntegratedModelFormalPreloadReserveQualificationV2,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID,
  MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID } from
  "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { validMainWireFixedToneSettlementEvidenceV2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import { observeMainWireStandard70QualificationV2 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_BASELINE_OBSERVATION_V2_ID } from
  "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { assertMainWireBaselinePressureRateQualityV1,
  type MainWireBaselinePressureRateQualityV1 } from
  "@/analysis/methods/mainWire/MainWireBaselinePressureRateQualityV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1 } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import { canonicalJsonStringify } from "@/engine/integrity";
import { MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID, assertMainWireBaselineCheckCoverageV1,
  mainWireBaselineCheckBlocksV1, mainWireBaselineCheckWarnsV1 } from
  "@/analysis/policies/mainWire/MainWireBaselineGateRolesV1";
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
  validHemodynamicPressureV1,
  validCardiacSizeAndFunctionV1,
  validPreloadReserveSideV1,
} from "./MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD70_BASELINE_VALIDATION_V1_SCHEMA_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_INITIALIZATION_KINDS_V1,
  validRightHeartMeasurementsV1, validCanonicalStandard70ChecksV1,
  type MainWireIntegratedStudioStandard70BaselineValidationV1,
} from "./MainWireIntegratedStudioStandard70BaselineValidationV1";

// App/analysis assessment only. The immutable exact artifact keeps its original
// construction report and never imports this prospective admission policy.
export type MainWireIntegratedStudioStandard70BaselineAssessmentV2 = Omit<
  MainWireIntegratedStudioStandard70BaselineValidationV1, "preloadReserve"
> & Readonly<{
  preloadReserve: MainWireIntegratedModelFormalPreloadReserveQualificationV1
    | MainWireIntegratedModelFormalPreloadReserveQualificationV2;
  assessment?: Readonly<{
    policyId: string;
    observationMethodId: typeof MAIN_WIRE_BASELINE_OBSERVATION_V2_ID;
    referenceWarningCheckIds: readonly string[];
    pressureRateQuality: MainWireBaselinePressureRateQualityV1;
  }>;
}>;

export function buildMainWireIntegratedStudioStandard70BaselineValidationV2(
  sourceQualification: MainWireIntegratedModelStandard70BaselineQualificationV1,
  preloadReserve: MainWireIntegratedModelFormalPreloadReserveQualificationV2,
  pressureRateQuality: MainWireBaselinePressureRateQualityV1,
): MainWireIntegratedStudioStandard70BaselineAssessmentV2 {
  const qualification = observeMainWireStandard70QualificationV2(sourceQualification);
  if (
    qualification.classification.status !== "period1-converged"
    || qualification.classification.latestPeriod1MaximumNormalizedDelta === null
  ) {
    throw new Error("Standard70 baseline report requires period-1 convergence");
  }
  assertCurrentChecksV1(qualification.checks);
  if (preloadReserve.protocolId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID
    || preloadReserve.endDiastolicDefinition !== "inlet-valve-closure") {
    throw new Error("Standard70 mint requires aligned V2 preload evidence");
  }
  assertMainWireStandard70PreloadReservePassedV1(preloadReserve);
  const report = Object.freeze({
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
    assessment: Object.freeze({
      policyId: MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID,
      observationMethodId: MAIN_WIRE_BASELINE_OBSERVATION_V2_ID,
      referenceWarningCheckIds: Object.freeze(qualification.checks
        .filter(mainWireBaselineCheckWarnsV1).map(({ checkId }) => checkId)),
      pressureRateQuality,
    }),
  });
  validateCurrentAssessmentV1(report);
  return report;
}

export function validateMainWireIntegratedStudioStandard70BaselineAssessmentV2(
  input: unknown,
): MainWireIntegratedStudioStandard70BaselineAssessmentV2 {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Standard70 baseline validation report must be an object");
  }
  const report = input as Partial<
    MainWireIntegratedStudioStandard70BaselineAssessmentV2
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
  if (report.assessment !== undefined) {
    validateCurrentAssessmentV1(report as MainWireIntegratedStudioStandard70BaselineAssessmentV2);
  } else {
    // Historical admission is not retrospectively upgraded to the new policy.
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
    assertMainWireIntegratedModelStandard70BaselinePassedV1(report.checks, report.measurements);
  }
  assertMainWireStandard70PreloadReservePassedV1(report.preloadReserve!);
  return input as MainWireIntegratedStudioStandard70BaselineAssessmentV2;
}

function assertCurrentChecksV1(checks: readonly MainWireIntegratedModelStandard70BaselineCheckV1[]): void {
  assertMainWireBaselineCheckCoverageV1(checks);
  const failed = checks.filter(mainWireBaselineCheckBlocksV1);
  if (failed.length) throw new Error(`Standard70 baseline assessment rejected: ${failed.map((x) => `${x.checkId}=${x.actual}`).join("; ")}`);
}

function validateCurrentAssessmentV1(report: MainWireIntegratedStudioStandard70BaselineAssessmentV2): void {
  const reserve = report.preloadReserve;
  const assessment = report.assessment!;
  assertMainWireBaselinePressureRateQualityV1(assessment.pressureRateQuality);
  const expectedWarnings = report.checks.filter(mainWireBaselineCheckWarnsV1).map(({ checkId }) => checkId);
  const near = (a: number, b: number) => Number.isFinite(a) && Number.isFinite(b)
    && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  if (assessment.policyId !== MAIN_WIRE_BASELINE_GATE_ROLES_V1_ID
    || assessment.observationMethodId !== MAIN_WIRE_BASELINE_OBSERVATION_V2_ID
    || JSON.stringify(assessment.referenceWarningCheckIds) !== JSON.stringify(expectedWarnings)
    || !(report.nominalDtSec > 0) || !Number.isFinite(report.nominalDtSec)
    || !Number.isSafeInteger(report.completedCycleCount) || report.completedCycleCount < 3
    || report.periodicity?.status !== "period1-converged"
    || !Number.isFinite(report.periodicity.latestPeriod1MaximumNormalizedDelta)
    || report.periodicity.latestPeriod1MaximumNormalizedDelta < 0
    || report.periodicity.latestPeriod1MaximumNormalizedDelta > MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance
    || !Array.isArray(report.periodicity.evidenceCycleIndices)
    || report.periodicity.evidenceCycleIndices.length !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.consecutiveCycles
    || report.periodicity.evidenceCycleIndices.some((cycle, index, cycles) =>
      !Number.isSafeInteger(cycle) || cycle < 1 || cycle > report.completedCycleCount
      || (index > 0 && cycle !== cycles[index - 1]! + 1))
    || report.periodicity.evidenceCycleIndices.at(-1) !== report.completedCycleCount
    || !report.checkpoint || typeof report.checkpoint.checkpointId !== "string"
    || !Number.isSafeInteger(report.checkpoint.revision)
    || !Number.isFinite(report.checkpoint.acceptedTimeSec)
    || !/^[0-9a-f]{64}$/.test(report.checkpoint.checkpointSha256)
    || !validHemodynamicPressureV1(report.measurements.hemodynamicPressure)
    || !validCardiacSizeAndFunctionV1(report.measurements.cardiacSizeAndFunction)
    || ![report.measurements.mitralFlow, report.measurements.tricuspidFlow].every((flow) =>
      flow && Number.isFinite(flow.peakEMlPerSec) && flow.peakEMlPerSec > 0
      && Number.isFinite(flow.peakAMlPerSec) && flow.peakAMlPerSec > 0
      && near(flow.peakEToA, flow.peakEMlPerSec / flow.peakAMlPerSec))
    || assessment.pressureRateQuality.grids.coarse.checkpointSha256 !== report.checkpoint.checkpointSha256
    || assessment.pressureRateQuality.grids.coarse.nominalDtSec !== report.nominalDtSec
    || canonicalJsonStringify(assessment.pressureRateQuality.grids.coarse.modelIdentity)
      !== canonicalJsonStringify(MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1)
    || assessment.pressureRateQuality.checks.some((check) => {
      const ventricle = check.checkId.startsWith("left-") ? report.measurements.leftVentricle : report.measurements.rightVentricle;
      return !near(check.coarse.reportedMmHgPerSec!, check.checkId.includes(".maximum-")
        ? ventricle.maximumDpDtMmHgPerSec : ventricle.minimumDpDtMmHgPerSec);
    })
    || !reserve
    || reserve.qualificationId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_QUALIFICATION_V1_ID
    || reserve.protocolId !== MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_PROTOCOL_V2_ID
    || reserve.endDiastolicDefinition !== "inlet-valve-closure"
    || (["center", "hypovolemic", "hypervolemic"] as const)
      .some((key) => !validMainWireFixedToneSettlementEvidenceV2(reserve.settlement?.[key]))
    || reserve.status !== "passed"
    || !validPreloadReserveSideV1(reserve.left) || !validPreloadReserveSideV1(reserve.right)
    || !near(reserve.hypovolemicGlobalTbvScale, 0.88)
    || !near(reserve.hypervolemicGlobalTbvScale, 1.12)
    || !(reserve.sourceGlobalTbvMl > 0)
    || !near(reserve.hypovolemicGlobalTbvMl, reserve.sourceGlobalTbvMl * reserve.hypovolemicGlobalTbvScale)
    || !near(reserve.hypervolemicGlobalTbvMl, reserve.sourceGlobalTbvMl * reserve.hypervolemicGlobalTbvScale)
    || !near(report.measurements.timing.teiIndex,
      (report.measurements.timing.ictSec + report.measurements.timing.irtSec) / report.measurements.aorticValve.ejectionTimeSec)
    || !near(report.measurements.rightTiming.teiIndex,
      (report.measurements.rightTiming.ictSec + report.measurements.rightTiming.irtSec) / report.measurements.pulmonaryValve.ejectionTimeSec)) {
    throw new Error("Standard70 current baseline assessment is invalid");
  }
  assertCurrentChecksV1(report.checks);
}
