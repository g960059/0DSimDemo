import { MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID } from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import { mainWireLeftVentricularPressureRateConfigurationIdentityV1 } from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import { MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID } from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  evaluateMainWireIntegratedModelStandard66ValidationDtGateV1,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationClockPairIdV1,
  type MainWireIntegratedModelStandard66ValidationDtGateEvaluationV1,
  type MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_V1_ID =
  "main-wire-standard66-preregistered-timestep-comparison-v1" as const;

export const MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1 =
  Object.freeze({
    terminalBeatMeasurementEvaluatorId:
      MAIN_WIRE_STANDARD66_TERMINAL_BEAT_VALIDATION_MEASUREMENTS_V1_ID,
    flowEventTimingMethodId: MAIN_WIRE_LEFT_VENTRICULAR_FLOW_EVENT_TIMING_V1_ID,
    pressureRatePrimaryConfigurationIdentity:
      mainWireLeftVentricularPressureRateConfigurationIdentityV1(0.01),
  });

export const MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1 = Object.freeze({
  scope: "preregistered-pairwise-numerical-agreement-only" as const,
  requiredClockArmCoverage: "exactly-2ms-1ms-and-0p5ms" as const,
  pairCoverageWhenEvaluated: "all-unordered-preregistered-pairs" as const,
  fixedReferenceArmUsedOnlyForToleranceScalingAndReporting: true as const,
  referenceArmPrivilegedAsPairwiseComparator: false as const,
  unavailableArmFabricated: false as const,
  nonfiniteMetricFabricated: false as const,
  exactModelMutation: false as const,
  exactFrameOutputReserved: false as const,
  registryOrModelSurfaceChanged: false as const,
  physiologyEvaluated: false as const,
  clinicalMeaningClaimed: false as const,
  releaseReadinessClaimed: false as const,
  causalAttributionClaimed: false as const,
});

export type MainWireStandard66TimestepComparisonSettlementInputV1 =
  | Readonly<{
      status: "period1-settled";
    }>
  | Readonly<{
      status: "unavailable";
      /** Preserved verbatim in an unavailable comparison result. */
      reason: string;
    }>;

export type MainWireStandard66TimestepComparisonConfirmationInputV1 =
  | Readonly<{
      status: "period1-confirmed";
    }>
  | Readonly<{
      status: "unavailable";
      /** Preserved verbatim in an unavailable comparison result. */
      reason: string;
    }>;

export type MainWireStandard66TimestepComparisonMeasurementInputV1 =
  | Readonly<{
      status: "available";
      methodCompatibility: Readonly<{
        terminalBeatMeasurementEvaluatorId: string;
        flowEventTimingMethodId: string;
        pressureRatePrimaryConfigurationIdentity: string;
      }>;
      /** Runtime validation requires exactly the ten preregistered metric IDs. */
      preregisteredDtGateValues: Readonly<Record<string, unknown>>;
    }>
  | Readonly<{
      status: "unavailable";
      /** Preserved verbatim in an unavailable comparison result. */
      reason: string;
    }>;

export type MainWireStandard66TimestepComparisonArmInputV1 = Readonly<{
  armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  requestedStepSec: number;
  executionPurpose: "preregistered-validation" | "bounded-smoke";
  compatibility: Readonly<{
    preregistrationId: string;
    /**
     * Common protocol identity excluding the clock-arm choice. It must be the
     * same for all three arms and must not be an arm-specific settling hash.
     */
    comparisonProtocolIdentity: string;
    /**
     * Common canonical identity of the case and exact construction inputs,
     * excluding the clock-arm choice.
     */
    comparisonCohortIdentity: string;
  }>;
  period1Settlement: MainWireStandard66TimestepComparisonSettlementInputV1;
  freshPeriod1Confirmation: MainWireStandard66TimestepComparisonConfirmationInputV1;
  terminalMeasurements: MainWireStandard66TimestepComparisonMeasurementInputV1;
}>;

export type MainWireStandard66TimestepComparisonInputV1 = Readonly<{
  expectedComparison: Readonly<{
    comparisonProtocolIdentity: string;
    comparisonCohortIdentity: string;
  }>;
  arms: readonly MainWireStandard66TimestepComparisonArmInputV1[];
}>;

export type MainWireStandard66TimestepComparisonUnavailableReasonCodeV1 =
  | "arm-count-not-exact"
  | "unsupported-arm-id"
  | "duplicate-arm-id"
  | "missing-arm-id"
  | "requested-step-mismatch"
  | "execution-purpose-not-preregistered"
  | "preregistration-identity-mismatch"
  | "expected-protocol-identity-empty"
  | "expected-cohort-identity-empty"
  | "comparison-protocol-identity-mismatch"
  | "comparison-cohort-identity-mismatch"
  | "period1-settlement-unavailable"
  | "fresh-period1-confirmation-unavailable"
  | "terminal-measurements-unavailable"
  | "terminal-evaluator-identity-mismatch"
  | "flow-event-method-identity-mismatch"
  | "pressure-rate-configuration-identity-mismatch"
  | "metric-id-missing"
  | "metric-id-extra"
  | "metric-value-nonfinite";

export type MainWireStandard66TimestepComparisonUnavailableReasonV1 = Readonly<{
  code: MainWireStandard66TimestepComparisonUnavailableReasonCodeV1;
  armId: string | null;
  metricId: string | null;
  /** Exact source reason when an upstream availability union supplied one. */
  sourceReason: string | null;
  message: string;
}>;

export type MainWireStandard66TimestepComparisonPairEvaluationV1 = Readonly<{
  pairId: MainWireIntegratedModelStandard66ValidationClockPairIdV1;
  firstArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  secondArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  metricEvaluations: readonly MainWireIntegratedModelStandard66ValidationDtGateEvaluationV1[];
  failedMetricIds: readonly MainWireIntegratedModelStandard66ValidationDtMetricIdV1[];
  allPreregisteredNumericalAgreementGatesPassed: boolean;
}>;

export type MainWireStandard66TimestepComparisonResultV1 =
  | Readonly<{
      evaluatorId: typeof MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_V1_ID;
      status: "unavailable";
      unavailableReasons: readonly MainWireStandard66TimestepComparisonUnavailableReasonV1[];
      pairEvaluations: null;
      reportingReference: null;
      summary: null;
      claim: typeof MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1;
    }>
  | Readonly<{
      evaluatorId: typeof MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_V1_ID;
      status: "pairwise-gates-evaluated";
      unavailableReasons: readonly [];
      pairEvaluations: readonly MainWireStandard66TimestepComparisonPairEvaluationV1[];
      reportingReference: Readonly<{
        armId: typeof MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1;
        values: Readonly<
          Record<
            MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
            number
          >
        >;
        privilegedAsPairwiseComparator: false;
      }>;
      summary: Readonly<{
        pairCount: number;
        metricCountPerPair: number;
        gateEvaluationCount: number;
        passedGateCount: number;
        failedGateCount: number;
        allPreregisteredPairwiseNumericalAgreementGatesPassed: boolean;
      }>;
      claim: typeof MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1;
    }>;

/**
 * Pure fail-closed evaluator for the three-arm Standard66 dt comparison.
 *
 * This adapter-shaped input deliberately does not depend on a particular
 * integrated validation runner. Upstream runtime results must first expose
 * settlement, a fresh same-session confirmation, method identities, and the
 * ten terminal values. No pair gate is run unless every required arm and
 * compatibility condition is eligible.
 */
export function evaluateMainWireStandard66TimestepComparisonV1(
  input: MainWireStandard66TimestepComparisonInputV1,
): MainWireStandard66TimestepComparisonResultV1 {
  const reasons: MainWireStandard66TimestepComparisonUnavailableReasonV1[] = [];
  const expectedProtocolIdentity =
    input.expectedComparison.comparisonProtocolIdentity;
  const expectedCohortIdentity =
    input.expectedComparison.comparisonCohortIdentity;
  if (expectedProtocolIdentity.length === 0) {
    reasons.push(
      reasonV1(
        "expected-protocol-identity-empty",
        null,
        null,
        null,
        "Standard66 timestep comparison protocol identity must be nonempty",
      ),
    );
  }
  if (expectedCohortIdentity.length === 0) {
    reasons.push(
      reasonV1(
        "expected-cohort-identity-empty",
        null,
        null,
        null,
        "Standard66 timestep comparison cohort identity must be nonempty",
      ),
    );
  }
  if (
    input.arms.length !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.length
  ) {
    reasons.push(
      reasonV1(
        "arm-count-not-exact",
        null,
        null,
        null,
        `Standard66 timestep comparison requires exactly ${MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.length} arms`,
      ),
    );
  }

  const armsById = new Map<
    MainWireIntegratedModelStandard66ValidationClockArmIdV1,
    MainWireStandard66TimestepComparisonArmInputV1
  >();
  for (const arm of input.arms) {
    const runtimeArmId = String(arm.armId);
    const armDefinition =
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
        ({ armId }) => armId === runtimeArmId,
      );
    if (armDefinition === undefined) {
      reasons.push(
        reasonV1(
          "unsupported-arm-id",
          runtimeArmId,
          null,
          null,
          `Unsupported Standard66 timestep arm: ${runtimeArmId}`,
        ),
      );
      continue;
    }
    const armId = armDefinition.armId;
    validateArmV1(
      arm,
      armDefinition.requestedStepSec,
      expectedProtocolIdentity,
      expectedCohortIdentity,
      reasons,
    );
    if (armsById.has(armId)) {
      reasons.push(
        reasonV1(
          "duplicate-arm-id",
          armId,
          null,
          null,
          `Duplicate Standard66 timestep arm: ${armId}`,
        ),
      );
      continue;
    }
    armsById.set(armId, arm);
  }
  for (const {
    armId,
  } of MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1) {
    if (!armsById.has(armId)) {
      reasons.push(
        reasonV1(
          "missing-arm-id",
          armId,
          null,
          null,
          `Missing Standard66 timestep arm: ${armId}`,
        ),
      );
    }
  }

  if (reasons.length > 0) {
    return unavailableResultV1(reasons);
  }

  const metricValuesByArm = new Map<
    MainWireIntegratedModelStandard66ValidationClockArmIdV1,
    Readonly<
      Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
    >
  >();
  for (const {
    armId,
  } of MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1) {
    const measurement = armsById.get(armId)!.terminalMeasurements;
    if (measurement.status !== "available") {
      throw new Error(
        "Standard66 timestep comparison internal availability drifted",
      );
    }
    metricValuesByArm.set(
      armId,
      freezeExactMetricValuesV1(measurement.preregisteredDtGateValues),
    );
  }

  const pairEvaluations =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_PAIRS_V1.map(
      ({ pairId, firstArmId, secondArmId }) => {
        const metricEvaluations =
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1.map(
            ({ metricId }) => {
              const valuesByArm = Object.freeze(
                Object.fromEntries(
                  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.map(
                    ({ armId }) => [
                      armId,
                      metricValuesByArm.get(armId)![metricId],
                    ],
                  ),
                ),
              ) as Readonly<
                Record<
                  MainWireIntegratedModelStandard66ValidationClockArmIdV1,
                  number
                >
              >;
              return evaluateMainWireIntegratedModelStandard66ValidationDtGateV1(
                metricId,
                firstArmId,
                secondArmId,
                valuesByArm,
              );
            },
          );
        const failedMetricIds = metricEvaluations
          .filter(({ passed }) => !passed)
          .map(({ metricId }) => metricId);
        return Object.freeze({
          pairId,
          firstArmId,
          secondArmId,
          metricEvaluations: Object.freeze(metricEvaluations),
          failedMetricIds: Object.freeze(failedMetricIds),
          allPreregisteredNumericalAgreementGatesPassed:
            failedMetricIds.length === 0,
        });
      },
    );
  const gateEvaluationCount = pairEvaluations.reduce(
    (sum, pair) => sum + pair.metricEvaluations.length,
    0,
  );
  const passedGateCount = pairEvaluations.reduce(
    (sum, pair) =>
      sum + pair.metricEvaluations.filter(({ passed }) => passed).length,
    0,
  );
  const failedGateCount = gateEvaluationCount - passedGateCount;
  const referenceValues = metricValuesByArm.get(
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1,
  )!;

  return Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_V1_ID,
    status: "pairwise-gates-evaluated" as const,
    unavailableReasons: Object.freeze([]) as readonly [],
    pairEvaluations: Object.freeze(pairEvaluations),
    reportingReference: Object.freeze({
      armId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATE_REFERENCE_ARM_ID_V1,
      values: referenceValues,
      privilegedAsPairwiseComparator: false as const,
    }),
    summary: Object.freeze({
      pairCount: pairEvaluations.length,
      metricCountPerPair:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1.length,
      gateEvaluationCount,
      passedGateCount,
      failedGateCount,
      allPreregisteredPairwiseNumericalAgreementGatesPassed:
        failedGateCount === 0,
    }),
    claim: MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1,
  });
}

function validateArmV1(
  arm: MainWireStandard66TimestepComparisonArmInputV1,
  expectedRequestedStepSec: number,
  expectedProtocolIdentity: string,
  expectedCohortIdentity: string,
  reasons: MainWireStandard66TimestepComparisonUnavailableReasonV1[],
): void {
  const armId = String(arm.armId);
  if (
    !Number.isFinite(arm.requestedStepSec) ||
    arm.requestedStepSec !== expectedRequestedStepSec
  ) {
    reasons.push(
      reasonV1(
        "requested-step-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} requested step does not match its preregistered arm`,
      ),
    );
  }
  if (arm.executionPurpose !== "preregistered-validation") {
    reasons.push(
      reasonV1(
        "execution-purpose-not-preregistered",
        armId,
        null,
        null,
        `Standard66 ${armId} is not a preregistered-validation execution`,
      ),
    );
  }
  if (
    arm.compatibility.preregistrationId !==
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID
  ) {
    reasons.push(
      reasonV1(
        "preregistration-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} preregistration identity is incompatible`,
      ),
    );
  }
  if (
    arm.compatibility.comparisonProtocolIdentity !== expectedProtocolIdentity
  ) {
    reasons.push(
      reasonV1(
        "comparison-protocol-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} comparison protocol identity is incompatible`,
      ),
    );
  }
  if (arm.compatibility.comparisonCohortIdentity !== expectedCohortIdentity) {
    reasons.push(
      reasonV1(
        "comparison-cohort-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} comparison cohort identity is incompatible`,
      ),
    );
  }
  if (arm.period1Settlement.status !== "period1-settled") {
    reasons.push(
      reasonV1(
        "period1-settlement-unavailable",
        armId,
        null,
        arm.period1Settlement.reason,
        `Standard66 ${armId} P1 settlement is unavailable: ${arm.period1Settlement.reason}`,
      ),
    );
  }
  if (arm.freshPeriod1Confirmation.status !== "period1-confirmed") {
    reasons.push(
      reasonV1(
        "fresh-period1-confirmation-unavailable",
        armId,
        null,
        arm.freshPeriod1Confirmation.reason,
        `Standard66 ${armId} fresh P1 confirmation is unavailable: ${arm.freshPeriod1Confirmation.reason}`,
      ),
    );
  }
  const measurement = arm.terminalMeasurements;
  if (measurement.status !== "available") {
    reasons.push(
      reasonV1(
        "terminal-measurements-unavailable",
        armId,
        null,
        measurement.reason,
        `Standard66 ${armId} terminal measurements are unavailable: ${measurement.reason}`,
      ),
    );
    return;
  }
  validateMeasurementV1(armId, measurement, reasons);
}

function validateMeasurementV1(
  armId: string,
  measurement: Extract<
    MainWireStandard66TimestepComparisonMeasurementInputV1,
    { status: "available" }
  >,
  reasons: MainWireStandard66TimestepComparisonUnavailableReasonV1[],
): void {
  const expected =
    MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1;
  if (
    measurement.methodCompatibility.terminalBeatMeasurementEvaluatorId !==
    expected.terminalBeatMeasurementEvaluatorId
  ) {
    reasons.push(
      reasonV1(
        "terminal-evaluator-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} terminal evaluator identity is incompatible`,
      ),
    );
  }
  if (
    measurement.methodCompatibility.flowEventTimingMethodId !==
    expected.flowEventTimingMethodId
  ) {
    reasons.push(
      reasonV1(
        "flow-event-method-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} flow-event method identity is incompatible`,
      ),
    );
  }
  if (
    measurement.methodCompatibility.pressureRatePrimaryConfigurationIdentity !==
    expected.pressureRatePrimaryConfigurationIdentity
  ) {
    reasons.push(
      reasonV1(
        "pressure-rate-configuration-identity-mismatch",
        armId,
        null,
        null,
        `Standard66 ${armId} pressure-rate configuration identity is incompatible`,
      ),
    );
  }

  const values = measurement.preregisteredDtGateValues;
  const expectedMetricIds =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1.map(
      ({ metricId }) => metricId,
    );
  const actualMetricIds = Object.keys(values);
  for (const metricId of expectedMetricIds) {
    if (!Object.hasOwn(values, metricId)) {
      reasons.push(
        reasonV1(
          "metric-id-missing",
          armId,
          metricId,
          null,
          `Standard66 ${armId} is missing preregistered metric ${metricId}`,
        ),
      );
      continue;
    }
    if (!Number.isFinite(values[metricId])) {
      reasons.push(
        reasonV1(
          "metric-value-nonfinite",
          armId,
          metricId,
          null,
          `Standard66 ${armId} metric ${metricId} must be finite`,
        ),
      );
    }
  }
  for (const metricId of actualMetricIds) {
    if (
      !expectedMetricIds.includes(
        metricId as MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
      )
    ) {
      reasons.push(
        reasonV1(
          "metric-id-extra",
          armId,
          metricId,
          null,
          `Standard66 ${armId} supplies non-preregistered metric ${metricId}`,
        ),
      );
    }
  }
}

function freezeExactMetricValuesV1(
  input: Readonly<Record<string, unknown>>,
): Readonly<
  Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_DT_GATES_V1.map(
        ({ metricId }) => [metricId, input[metricId] as number],
      ),
    ),
  ) as Readonly<
    Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
  >;
}

function unavailableResultV1(
  reasons: readonly MainWireStandard66TimestepComparisonUnavailableReasonV1[],
): MainWireStandard66TimestepComparisonResultV1 {
  return Object.freeze({
    evaluatorId: MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_V1_ID,
    status: "unavailable" as const,
    unavailableReasons: Object.freeze([...reasons]),
    pairEvaluations: null,
    reportingReference: null,
    summary: null,
    claim: MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1,
  });
}

function reasonV1(
  code: MainWireStandard66TimestepComparisonUnavailableReasonCodeV1,
  armId: string | null,
  metricId: string | null,
  sourceReason: string | null,
  message: string,
): MainWireStandard66TimestepComparisonUnavailableReasonV1 {
  return Object.freeze({ code, armId, metricId, sourceReason, message });
}

if (
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1
    .aorticEjectionTime.analysisMethodId !==
    MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1.flowEventTimingMethodId ||
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_MEASUREMENT_BINDINGS_V1
    .leftVentricularPressureRate.primaryConfigurationIdentity !==
    MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1.pressureRatePrimaryConfigurationIdentity
) {
  throw new Error("Standard66 timestep comparison method binding drifted");
}
