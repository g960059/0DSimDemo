import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1,
  MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1,
  evaluateMainWireStandard66TimestepComparisonV1,
  type MainWireStandard66TimestepComparisonArmInputV1,
  type MainWireStandard66TimestepComparisonInputV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TimestepComparisonV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationDtMetricIdV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

const PROTOCOL_IDENTITY = "standard66-integrated-validation-protocol-v1";
const COHORT_IDENTITY = "sha256:same-model-inputs-excluding-clock-arm";

describe("Standard66 preregistered timestep comparison V1", () => {
  it("evaluates every metric over every unordered pair with the fixed 0.5 ms tolerance reference", () => {
    const input = eligibleInputV1();
    const result = evaluateMainWireStandard66TimestepComparisonV1({
      ...input,
      arms: [input.arms[2]!, input.arms[0]!, input.arms[1]!],
    });

    expect(result.status).toBe("pairwise-gates-evaluated");
    if (result.status !== "pairwise-gates-evaluated") {
      throw new Error("expected evaluated timestep comparison");
    }
    expect(result.unavailableReasons).toEqual([]);
    expect(result.pairEvaluations.map(({ pairId }) => pairId)).toEqual([
      "dt-2ms-vs-dt-1ms",
      "dt-1ms-vs-dt-0p5ms",
      "dt-2ms-vs-dt-0p5ms",
    ]);
    expect(result.summary).toEqual({
      pairCount: 3,
      metricCountPerPair: 10,
      gateEvaluationCount: 30,
      passedGateCount: 30,
      failedGateCount: 0,
      allPreregisteredPairwiseNumericalAgreementGatesPassed: true,
    });
    expect(result.reportingReference).toMatchObject({
      armId: "dt-0p5ms-reference",
      privilegedAsPairwiseComparator: false,
    });
    expect(result.claim).toBe(
      MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_CLAIM_V1,
    );
    expect(result.claim).toMatchObject({
      scope: "preregistered-pairwise-numerical-agreement-only",
      referenceArmPrivilegedAsPairwiseComparator: false,
      physiologyEvaluated: false,
      clinicalMeaningClaimed: false,
      releaseReadinessClaimed: false,
      causalAttributionClaimed: false,
    });

    const nonReferencePair = result.pairEvaluations[0]!;
    const meanGradient = nonReferencePair.metricEvaluations.find(
      ({ metricId }) => metricId === "aortic-local-hydraulic-mean-gradient",
    )!;
    expect(meanGradient).toMatchObject({
      pairId: "dt-2ms-vs-dt-1ms",
      referenceMagnitude: 20,
      tolerance: 0.4,
      passed: true,
      semantics: {
        referenceArmId: "dt-0p5ms-reference",
      },
    });
    expect(meanGradient.absoluteDifference).toBeCloseTo(0.3, 14);
  });

  it("reports numerical disagreement without turning it into another kind of claim", () => {
    const input = eligibleInputV1();
    const dt2 = input.arms.find(({ armId }) => armId === "dt-2ms-production")!;
    const dt2Values = availableValuesV1(dt2);
    const result = evaluateMainWireStandard66TimestepComparisonV1({
      ...input,
      arms: input.arms.map((arm) =>
        arm.armId === "dt-2ms-production"
          ? {
              ...arm,
              terminalMeasurements: {
                ...arm.terminalMeasurements,
                preregisteredDtGateValues: {
                  ...dt2Values,
                  "aortic-ejection-time": 0.203,
                },
              },
            }
          : arm,
      ),
    });

    expect(result.status).toBe("pairwise-gates-evaluated");
    if (result.status !== "pairwise-gates-evaluated") {
      throw new Error("expected evaluated timestep comparison");
    }
    expect(result.summary.failedGateCount).toBe(1);
    expect(
      result.summary.allPreregisteredPairwiseNumericalAgreementGatesPassed,
    ).toBe(false);
    expect(result.pairEvaluations[2]).toMatchObject({
      pairId: "dt-2ms-vs-dt-0p5ms",
      failedMetricIds: ["aortic-ejection-time"],
      allPreregisteredNumericalAgreementGatesPassed: false,
    });
    expect(result.claim.physiologyEvaluated).toBe(false);
    expect(result.claim.releaseReadinessClaimed).toBe(false);
  });

  it("fails closed on duplicate, missing, unsupported, or mismatched clock arms", () => {
    const input = eligibleInputV1();
    const duplicate = input.arms[0]!;
    const unsupported = {
      ...input.arms[1]!,
      armId: "dt-4ms-unregistered",
    } as unknown as MainWireStandard66TimestepComparisonArmInputV1;
    const mismatchedStep = {
      ...input.arms[0]!,
      requestedStepSec: 0.001,
      executionPurpose: "bounded-smoke" as const,
    };
    const result = evaluateMainWireStandard66TimestepComparisonV1({
      ...input,
      arms: [mismatchedStep, duplicate, unsupported],
    });

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable timestep comparison");
    }
    expect(result.pairEvaluations).toBeNull();
    expect(result.reportingReference).toBeNull();
    expect(result.summary).toBeNull();
    expect(result.unavailableReasons.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "requested-step-mismatch",
        "execution-purpose-not-preregistered",
        "duplicate-arm-id",
        "unsupported-arm-id",
        "missing-arm-id",
      ]),
    );
  });

  it("preserves each upstream unavailable reason and runs no partial gates", () => {
    const input = eligibleInputV1();
    const reasons = {
      settlement: "maximum-horizon-reached:250s",
      confirmation: "fresh-consecutive-P1-suffix-not-established",
      measurement: "terminal-trace-not-created",
    };
    const result = evaluateMainWireStandard66TimestepComparisonV1({
      ...input,
      arms: input.arms.map((arm) => {
        if (arm.armId === "dt-2ms-production") {
          return {
            ...arm,
            period1Settlement: {
              status: "unavailable" as const,
              reason: reasons.settlement,
            },
          };
        }
        if (arm.armId === "dt-1ms-intermediate") {
          return {
            ...arm,
            freshPeriod1Confirmation: {
              status: "unavailable" as const,
              reason: reasons.confirmation,
            },
          };
        }
        return {
          ...arm,
          terminalMeasurements: {
            status: "unavailable" as const,
            reason: reasons.measurement,
          },
        };
      }),
    });

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable timestep comparison");
    }
    expect(result.pairEvaluations).toBeNull();
    expect(
      result.unavailableReasons.map(({ code, sourceReason }) => ({
        code,
        sourceReason,
      })),
    ).toEqual(
      expect.arrayContaining([
        {
          code: "period1-settlement-unavailable",
          sourceReason: reasons.settlement,
        },
        {
          code: "fresh-period1-confirmation-unavailable",
          sourceReason: reasons.confirmation,
        },
        {
          code: "terminal-measurements-unavailable",
          sourceReason: reasons.measurement,
        },
      ]),
    );
  });

  it("requires common protocol/cohort identities, exact methods, and exactly finite preregistered metrics", () => {
    const input = eligibleInputV1();
    const result = evaluateMainWireStandard66TimestepComparisonV1({
      ...input,
      arms: input.arms.map((arm) => {
        if (arm.armId === "dt-2ms-production") {
          const values = availableValuesV1(arm);
          const { "aortic-vmax": _omitted, ...missingVmax } = values;
          return {
            ...arm,
            compatibility: {
              ...arm.compatibility,
              comparisonProtocolIdentity: "wrong-protocol",
              comparisonCohortIdentity: "wrong-cohort",
              preregistrationId: "wrong-preregistration",
            },
            terminalMeasurements: {
              status: "available" as const,
              methodCompatibility: {
                terminalBeatMeasurementEvaluatorId: "wrong-terminal-method",
                flowEventTimingMethodId: "wrong-flow-method",
                pressureRatePrimaryConfigurationIdentity: "wrong-dpdt-method",
              },
              preregisteredDtGateValues: {
                ...missingVmax,
                "mean-cvp-not-preregistered": 5,
                "stroke-volume": Number.NaN,
              },
            },
          };
        }
        return arm;
      }),
    });

    expect(result.status).toBe("unavailable");
    if (result.status !== "unavailable") {
      throw new Error("expected unavailable timestep comparison");
    }
    expect(result.pairEvaluations).toBeNull();
    expect(result.unavailableReasons.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "preregistration-identity-mismatch",
        "comparison-protocol-identity-mismatch",
        "comparison-cohort-identity-mismatch",
        "terminal-evaluator-identity-mismatch",
        "flow-event-method-identity-mismatch",
        "pressure-rate-configuration-identity-mismatch",
        "metric-id-missing",
        "metric-id-extra",
        "metric-value-nonfinite",
      ]),
    );
    expect(result.unavailableReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "metric-id-missing",
          metricId: "aortic-vmax",
        }),
        expect.objectContaining({
          code: "metric-id-extra",
          metricId: "mean-cvp-not-preregistered",
        }),
        expect.objectContaining({
          code: "metric-value-nonfinite",
          metricId: "stroke-volume",
        }),
      ]),
    );
  });
});

function eligibleInputV1(): MainWireStandard66TimestepComparisonInputV1 {
  return {
    expectedComparison: {
      comparisonProtocolIdentity: PROTOCOL_IDENTITY,
      comparisonCohortIdentity: COHORT_IDENTITY,
    },
    arms: [
      armV1("dt-2ms-production", 0.002, {
        "aortic-ejection-time": 0.202,
        "aortic-local-hydraulic-mean-gradient": 20.4,
      }),
      armV1("dt-1ms-intermediate", 0.001, {
        "aortic-ejection-time": 0.201,
        "aortic-local-hydraulic-mean-gradient": 20.1,
      }),
      armV1("dt-0p5ms-reference", 0.0005, {
        "aortic-ejection-time": 0.2,
        "aortic-local-hydraulic-mean-gradient": 20,
      }),
    ],
  };
}

function armV1(
  armId: MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  requestedStepSec: number,
  overrides: Partial<
    Record<MainWireIntegratedModelStandard66ValidationDtMetricIdV1, number>
  > = {},
): MainWireStandard66TimestepComparisonArmInputV1 {
  return {
    armId,
    requestedStepSec,
    executionPurpose: "preregistered-validation",
    compatibility: {
      preregistrationId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_PREREGISTRATION_V1_ID,
      comparisonProtocolIdentity: PROTOCOL_IDENTITY,
      comparisonCohortIdentity: COHORT_IDENTITY,
    },
    period1Settlement: { status: "period1-settled" },
    freshPeriod1Confirmation: { status: "period1-confirmed" },
    terminalMeasurements: {
      status: "available",
      methodCompatibility:
        MAIN_WIRE_STANDARD66_TIMESTEP_COMPARISON_METHOD_COMPATIBILITY_V1,
      preregisteredDtGateValues: {
        "aortic-ejection-time": 0.2,
        "aortic-local-hydraulic-mean-gradient": 20,
        "aortic-local-hydraulic-peak-gradient": 30,
        "aortic-vena-contracta-bernoulli-mean-gradient": 20,
        "aortic-vena-contracta-bernoulli-peak-gradient": 30,
        "stroke-volume": 70,
        "mean-arterial-pressure": 90,
        "aortic-vmax": 2.5,
        "lv-pressure-maximum-dp-dt": 1_200,
        "lv-pressure-minimum-dp-dt": -1_000,
        ...overrides,
      },
    },
  };
}

function availableValuesV1(
  arm: MainWireStandard66TimestepComparisonArmInputV1,
): Readonly<Record<string, unknown>> {
  if (arm.terminalMeasurements.status !== "available") {
    throw new Error("test arm unexpectedly lacks terminal measurements");
  }
  return arm.terminalMeasurements.preregisteredDtGateValues;
}
