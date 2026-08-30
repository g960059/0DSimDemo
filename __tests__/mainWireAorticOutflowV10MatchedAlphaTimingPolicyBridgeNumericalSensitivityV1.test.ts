import { beforeAll, describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1,
  measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1,
  type MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const QUICK_EXECUTION_DESIGN = Object.freeze({
  designId: "analysis-only-one-beat-50-vs-100-steps-per-RR-v1",
  provenance: "analysis-only-test-override" as const,
  primary: Object.freeze({
    stepsPerCycle: 50,
    maximumBeatCountByHeartRateBpm: Object.freeze({ 50: 1, 90: 1 }),
    terminationPolicy: "stop-at-first-accepted-classification" as const,
  }),
  sentinel: Object.freeze({
    policyId: "analysis-only-one-beat-sentinel-v1",
    stepsPerCycle: 100,
    fixedPhysicalHorizonSecByHeartRateBpm: Object.freeze({
      50: 60 / 50,
      90: 60 / 90,
    }),
    maximumBeatCountByHeartRateBpm: Object.freeze({ 50: 1, 90: 1 }),
    periodicTerminationBeforeFixedHorizonAccepted: false as const,
  }),
}) satisfies MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeExpectedExecutionDesignV1 &
  Readonly<{ provenance: "analysis-only-test-override" }>;

describe("main-wire V10 matched-alpha bridge numerical sensitivity V1", () => {
  let inputs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1[];
  let comparison: MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1;

  beforeAll(() => {
    inputs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARMS_V1.map(
        (arm) => {
          const primary =
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
              {
                dtSec:
                  arm.cycleLengthSec /
                  QUICK_EXECUTION_DESIGN.primary.stepsPerCycle,
                maximumBeatCount: 1,
              },
              arm.calciumProfileId,
            );
          const sentinel =
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
              {
                dtSec:
                  arm.cycleLengthSec /
                  QUICK_EXECUTION_DESIGN.sentinel.stepsPerCycle,
                maximumBeatCount: 1,
              },
              arm.calciumProfileId,
            );
          expect(sentinel.calciumDriveParams).toEqual(
            primary.calciumDriveParams,
          );
          return Object.freeze({
            arm,
            calciumProfile: primary.matchedAlphaTimingPolicyBridgeProfile,
            calciumDriveParams: primary.calciumDriveParams,
            primaryPeriodicResult: primary.periodicResult,
            sentinelPeriodicResult: sentinel.periodicResult,
            primaryRunnerAssemblyIdentity: Object.freeze({
              referenceNonCalciumAssembly: primary.referenceNonCalciumAssembly,
              exactAssemblyAudit: primary.exactAssemblyAudit,
            }),
            sentinelRunnerAssemblyIdentity: Object.freeze({
              referenceNonCalciumAssembly: sentinel.referenceNonCalciumAssembly,
              exactAssemblyAudit: sentinel.exactAssemblyAudit,
            }),
            sentinelExecutionPolicy: Object.freeze({
              policyId: QUICK_EXECUTION_DESIGN.sentinel.policyId,
              fixedPhysicalHorizonSec:
                QUICK_EXECUTION_DESIGN.sentinel
                  .fixedPhysicalHorizonSecByHeartRateBpm[arm.heartRateBpm],
              stepsPerCycle: QUICK_EXECUTION_DESIGN.sentinel.stepsPerCycle,
              minimumCompletedBeatCountBeforePeriodicTermination: 1,
              maximumBeatCount: 1,
              periodicTerminationBeforeFixedHorizonAccepted: false as const,
            }),
          });
        },
      ),
    );
    comparison =
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        inputs,
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      );
  }, 120_000);

  it("keeps the canonical compound design while explicitly reporting the quick override", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_CANONICAL_NUMERICAL_SENSITIVITY_EXECUTION_DESIGN_V1,
    ).toMatchObject({
      provenance: "canonical",
      primary: {
        stepsPerCycle: 2_000,
        maximumBeatCountByHeartRateBpm: { 50: 40, 90: 72 },
        terminationPolicy: "stop-at-first-accepted-classification",
      },
      sentinel: {
        policyId: "matched-alpha-fixed-physical-horizon-48s-sentinel-v1",
        stepsPerCycle: 4_000,
        fixedPhysicalHorizonSecByHeartRateBpm: { 50: 48, 90: 48 },
        maximumBeatCountByHeartRateBpm: { 50: 40, 90: 72 },
        periodicTerminationBeforeFixedHorizonAccepted: false,
      },
    });
    expect(comparison.comparisonKind).toBe(
      "compound-time-step-and-execution-horizon-sensitivity",
    );
    expect(comparison.pureTimeStepConvergenceClaimed).toBe(false);
    expect(
      comparison.quantitativeNumericalSensitivityPassToleranceSpecified,
    ).toBe(false);
    expect(comparison.analysisClaim.parameterSearchOrFittingApplied).toBe(
      false,
    );
    expect(comparison.analysisOnlyExecutionDesignOverrideApplied).toBe(true);
    expect(comparison.canonicalDesignFullyEvaluated).toBe(false);
    expect(comparison.evaluatedExecutionDesign).toEqual(QUICK_EXECUTION_DESIGN);
    expect(comparison.pairs).toHaveLength(4);
    expect(comparison.allPhysicalIdentitiesStableAcrossExecutionDesign).toBe(
      true,
    );

    for (const pair of comparison.pairs) {
      expect(pair.physicalIdentityAudit.allChecksPassed).toBe(true);
      expect(pair.primary.stepsPerCycle).toBe(50);
      expect(pair.sentinel.stepsPerCycle).toBe(100);
      expect(pair.primary.completedBeatCount).toBe(1);
      expect(pair.sentinel.completedBeatCount).toBe(1);
      expect(pair.primary.selectedBeatSampleCount).toBe(50);
      expect(pair.sentinel.selectedBeatSampleCount).toBe(100);
      expect(pair.primary.completedPhysicalTimeSec).toBeCloseTo(
        pair.arm.cycleLengthSec,
        12,
      );
      expect(pair.sentinel.completedPhysicalTimeSec).toBeCloseTo(
        pair.arm.cycleLengthSec,
        12,
      );
      expect(pair.primary.protocolIdentityHash).toBe(
        pair.sentinel.protocolIdentityHash,
      );
    }
  });

  it("owns signed sentinel-minus-primary metrics and four-arm maximum absolute deltas", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1,
    ).toHaveLength(23);
    for (const pair of comparison.pairs) {
      expect(
        pair.primary.metrics.strokeVolumePerOnePercentEjectionTimeMlPerSec,
      ).toBeCloseTo(
        pair.primary.metrics.strokeVolumeMl /
          pair.primary.metrics.onePercentInterpolatedEjectionTimeSec,
        12,
      );
      expect(
        pair.sentinel.metrics.strokeVolumePerOnePercentEjectionTimeMlPerSec,
      ).toBeCloseTo(
        pair.sentinel.metrics.strokeVolumeMl /
          pair.sentinel.metrics.onePercentInterpolatedEjectionTimeSec,
        12,
      );
      expect(pair.primary.metrics.meanRawNodeGradientMmHg).toBeCloseTo(
        pair.primary.metrics.meanExactLocalGradientMmHg +
          pair.primary.metrics.meanCharacteristicPressureMmHg,
        10,
      );
      expect(pair.sentinel.metrics.meanRawNodeGradientMmHg).toBeCloseTo(
        pair.sentinel.metrics.meanExactLocalGradientMmHg +
          pair.sentinel.metrics.meanCharacteristicPressureMmHg,
        10,
      );
      for (const key of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1) {
        const primaryValue = pair.primary.metrics[key];
        const sentinelValue = pair.sentinel.metrics[key];
        const difference = pair.signedSentinelMinusPrimary[key];
        if (primaryValue === null || sentinelValue === null) {
          expect(difference).toBeNull();
        } else {
          expect(difference).toBeCloseTo(sentinelValue - primaryValue, 12);
        }
      }
    }

    for (const key of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_NUMERICAL_SENSITIVITY_METRIC_KEYS_V1) {
      const available = comparison.pairs.flatMap((pair) => {
        const value = pair.signedSentinelMinusPrimary[key];
        return value === null ? [] : [Math.abs(value)];
      });
      expect(comparison.maximumAbsoluteSentinelMinusPrimary[key]).toBeCloseTo(
        Math.max(...available),
        12,
      );
    }
    expect(
      Object.values(comparison.maximumAbsoluteSentinelMinusPrimary).some(
        (value) => value !== null && value > 0,
      ),
    ).toBe(true);
  });

  it("audits integration, P1, single peaks, and every exact proximal-port station", () => {
    expect(comparison.allRunsIntegratedWithoutFailure).toBe(true);
    expect(comparison.allRunsPeriod1Converged).toBe(false);
    expect(comparison.allRunsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(
      comparison.allExactReadbacksAvailableAndStationIdentitiesWithinTolerance,
    ).toBe(true);
    expect(comparison.allPairsInterpretationEligible).toBe(false);
    for (const pair of comparison.pairs) {
      for (const run of [pair.primary, pair.sentinel]) {
        expect(run.integrationCompletedWithoutFailure).toBe(true);
        expect(run.periodicSteadyStateClaimed).toBe(false);
        expect(run.singleDistinctAorticFlowPeakPassed).toBe(true);
        expect(run.exactStationAuditPassed).toBe(true);
        expect(run.interpretationEligible).toBe(false);
        expect(run.exactReadbackAudit.availableExactReadbackSampleCount).toBe(
          run.exactReadbackAudit.requiredSelectedBeatSampleCount,
        );
        expect(
          run.exactReadbackAudit.maximumAbsoluteStationAdditivityResidualMmHg,
        ).toBeLessThanOrEqual(1e-9);
      }
    }
  });

  it("rejects missing, duplicate, mismatched, and non-default execution identities", () => {
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        inputs.slice(0, -1),
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      ),
    ).toThrow(/exactly four paired arms/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        [...inputs.slice(0, -1), inputs[0]!],
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      ),
    ).toThrow(/duplicate matched-alpha numerical-sensitivity arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        [
          Object.freeze({
            ...inputs[0]!,
            calciumProfile: inputs[1]!.calciumProfile,
          }),
          ...inputs.slice(1),
        ],
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      ),
    ).toThrow(/calcium profile identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        inputs,
      ),
    ).toThrow(/primary execution design mismatch/);
  });

  it("rejects every independently drifted sentinel execution-policy field", () => {
    const policy = inputs[0]!.sentinelExecutionPolicy;
    const drifts: readonly Readonly<Partial<typeof policy>>[] = Object.freeze([
      Object.freeze({ policyId: "tampered-policy" }),
      Object.freeze({ fixedPhysicalHorizonSec: 48 }),
      Object.freeze({ stepsPerCycle: policy.stepsPerCycle + 1 }),
      Object.freeze({ minimumCompletedBeatCountBeforePeriodicTermination: 2 }),
      Object.freeze({ maximumBeatCount: 2 }),
      Object.freeze({
        periodicTerminationBeforeFixedHorizonAccepted: true,
      }) as never,
    ]);
    for (const drift of drifts) {
      expect(() =>
        measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
          replaceFirstInput(inputs, {
            sentinelExecutionPolicy: Object.freeze({
              ...policy,
              ...drift,
            }) as typeof policy,
          }),
          { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
        ),
      ).toThrow(/sentinel execution-policy mismatch/);
    }
  });

  it("rejects V10 reference provenance and exact assembly-audit tampering", () => {
    const first = inputs[0]!;
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        replaceFirstInput(inputs, {
          primaryRunnerAssemblyIdentity: Object.freeze({
            ...first.primaryRunnerAssemblyIdentity,
            referenceNonCalciumAssembly: Object.freeze({
              ...first.primaryRunnerAssemblyIdentity
                .referenceNonCalciumAssembly,
              aorticMaximumForwardEoaCm2: 3.4,
            }) as unknown as typeof first.primaryRunnerAssemblyIdentity.referenceNonCalciumAssembly,
          }),
        }),
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      ),
    ).toThrow(/V10 reference non-calcium assembly provenance mismatch/);

    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityV1(
        replaceFirstInput(inputs, {
          sentinelRunnerAssemblyIdentity: Object.freeze({
            ...first.sentinelRunnerAssemblyIdentity,
            exactAssemblyAudit: Object.freeze({
              ...first.sentinelRunnerAssemblyIdentity.exactAssemblyAudit,
              circulationRuntimeStableHash: "tampered-runtime-hash",
            }),
          }),
        }),
        { expectedExecutionDesignOverride: QUICK_EXECUTION_DESIGN },
      ),
    ).toThrow(/exact assembly audit mismatch/);
  });
});

function replaceFirstInput(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1[],
  replacement: Partial<MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1>,
): readonly MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeNumericalSensitivityInputV1[] {
  return Object.freeze([
    Object.freeze({ ...inputs[0]!, ...replacement }),
    ...inputs.slice(1),
  ]);
}
