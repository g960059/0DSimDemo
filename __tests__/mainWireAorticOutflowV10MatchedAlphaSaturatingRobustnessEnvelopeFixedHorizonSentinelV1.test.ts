import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_COMPARISON_METRIC_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_INDEPENDENT_HARD_METRIC_IDS_V1,
  classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAuditDispositionV1,
  compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardClassV1,
  compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricV1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1";
import {
  classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1,
  mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeAnalysisV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_SELECTION_REASON_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 saturating robustness fixed-horizon sentinel V1", () => {
  it("freezes the six-arm primary cycle/2000 limiting union before execution", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARM_IDS_V1,
    ).toEqual([
      "guard__hr-50__rsys-low__stiffness-high__volume-high__tref-low",
      "fraction__hr-50__rsys-low__stiffness-low__volume-low__tref-high",
      "fraction__hr-50__rsys-low__stiffness-high__volume-high__tref-high",
      "fraction__hr-90__rsys-high__stiffness-high__volume-low__tref-low",
      "fraction__hr-90__rsys-high__stiffness-low__volume-high__tref-low",
      "centerline__hr-90",
    ]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1,
    ).toHaveLength(6);
    expect(
      new Set(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.flatMap(
          (arm) => arm.selectionReasons,
        ),
      ),
    ).toEqual(
      new Set(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_SELECTION_REASON_IDS_V1,
      ),
    );
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.every(
        (arm) =>
          arm.selectionFrozenBeforeFixedHorizonExecution &&
          arm.sourcePrimaryExecution ===
            "cycle-over-2000-maximum-72-early-stop" &&
          (arm.sourceEnvelopeArm.heartRateBpm === 50 ||
            arm.sourceEnvelopeArm.heartRateBpm === 90),
      ),
    ).toBe(true);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_CLAIM_V1,
    ).toMatchObject({
      fixedSentinelArmCount: 6,
      frozenSelectionReasonCount: 8,
      sourcePrimaryStepsPerCycle: 2_000,
      sourcePrimaryMaximumBeatCount: 72,
      fixedSentinelStepsPerCycle: 4_000,
      fixedPhysicalHorizonSec: 48,
      publicNumericExecutionOverridesAccepted: false,
      limitingUnionCoversAllThirtySixEnvelopeArms: false,
      continuityEquivalentEoaVariationRecertifiedBySentinel: false,
      horizonAndTimeStepEffectsSeparatedByThisCompoundComparison: false,
    });
  });

  it("owns the nine predeclared max-absolute-or-relative comparison gates", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_COMPARISON_METRIC_IDS_V1,
    ).toEqual([
      "onePercentFlowEjectionTimeSec",
      "isovolumicContractionTimeSec",
      "isovolumicRelaxationTimeSec",
      "strokeVolumeMl",
      "peakVenaContractaVelocityMPerSec",
      "meanDopplerGradientMmHg",
      "peakDopplerGradientMmHg",
      "leftVentricularTeiIndex",
      "maximumPositiveLeftVentricularDpdtMmHgPerSec",
    ]);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "onePercentFlowEjectionTimeSec",
        0.2,
      ),
    ).toBe(0.002);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "isovolumicContractionTimeSec",
        0.05,
      ),
    ).toBe(0.0012);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "strokeVolumeMl",
        80,
      ),
    ).toBe(0.8);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "peakVenaContractaVelocityMPerSec",
        0.5,
      ),
    ).toBe(0.01);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "meanDopplerGradientMmHg",
        4,
      ),
    ).toBe(0.05);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "peakDopplerGradientMmHg",
        8,
      ),
    ).toBe(0.1);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "leftVentricularTeiIndex",
        1,
      ),
    ).toBe(0.01);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "maximumPositiveLeftVentricularDpdtMmHgPerSec",
        2_000,
      ),
    ).toBe(40);
    expect(
      mainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeNumericalToleranceV1(
        "meanAorticPressureMmHg",
        80,
      ),
    ).toBeNull();
  });

  it("fails closed for missing or non-finite numerical and hard-class inputs", () => {
    for (const invalid of [null, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelMetricV1(
          "onePercentFlowEjectionTimeSec",
          invalid,
          0.2,
        ),
      ).toThrow(/requires two finite values/);
      expect(() =>
        compareMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelIndependentHardClassV1(
          "meanDopplerGradientMmHg",
          4,
          invalid,
        ),
      ).toThrow(/requires two finite values/);
    }
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_INDEPENDENT_HARD_METRIC_IDS_V1,
    ).toEqual([
      "peakVenaContractaVelocityMPerSec",
      "meanDopplerGradientMmHg",
      "onePercentFlowEjectionTimeSec",
      "correctedValveEventLvetMs",
      "accelerationTimeSec",
      "activeEoaAtPeakForwardFlowUtilization01",
      "flowWeightedMeanActiveEoaUtilization01",
    ]);
  });

  it("keeps two-sided WASE intervals as readouts and prioritizes invalidity over decomposition", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ANALYSIS_CLAIM_V1.primaryAndFixedTwoSidedRestingReadoutsReportedButNotRequiredForPass,
    ).toBe(true);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "peakVenaContractaVelocityMPerSec",
        0.2,
      ),
    ).toBe(true);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "meanDopplerGradientMmHg",
        0.2,
      ),
    ).toBe(true);
    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeIndependentHardGateV1(
        "peakDopplerGradientMmHg",
        0.2,
      ),
    ).toBeNull();

    expect(
      classifyMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAuditDispositionV1(
        {
          compoundComparisonValidityPassed: false,
          allNumericalComparisonsWithinTolerance: false,
          anyHardPhysiologyClassFlip: true,
          allPrimaryAndFixedArmLevelAvAntiStenosisGatesPassed: false,
        },
      ),
    ).toEqual({
      auditStatus: "non-numerical-audit-failure",
      compoundMismatchDetected: false,
      nonNumericalAuditFailureDetected: true,
      physiologyGateFailureDetected: true,
      decompositionStatus: "not-required",
    });
  });

  it("rejects execution options and envelope arms outside the frozen union", () => {
    const withInjectedOptions =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1 as unknown as (
        armId: string,
        options: unknown,
      ) => unknown;
    expect(() =>
      withInjectedOptions("centerline__hr-90", { maximumBeatCount: 1 }),
    ).toThrow(/one frozen sentinel arm ID and no execution options/);
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1(
        "centerline__hr-60" as never,
      ),
    ).toThrow(
      /unsupported V10 saturating robustness fixed-horizon sentinel arm/,
    );
  });

  it("pairs primary cycle/2000 early-stop with exact 48-second cycle/4000 fixed executions", () => {
    const primaryRuns =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
        (sentinelArm) => {
          const arm = sentinelArm.sourceEnvelopeArm;
          return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeResearchV1(
            {
              dtSec: 60 / arm.heartRateBpm / 2_000,
              maximumBeatCount: 72,
            },
            arm.armId,
          );
        },
      );
    const fixedRuns =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_ROBUSTNESS_ENVELOPE_FIXED_HORIZON_SENTINEL_ARMS_V1.map(
        (sentinelArm) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelResearchV1(
            sentinelArm.sentinelArmId,
          ),
      );
    const analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingRobustnessEnvelopeFixedHorizonSentinelAnalysisV1(
        primaryRuns,
        fixedRuns,
      );

    expect(analysis.pairsInFrozenCatalogOrder).toHaveLength(6);
    expect(analysis.auditedUniqueArmCount).toBe(6);
    expect(analysis.allPairedExactModelIdentitiesMatched).toBe(true);
    expect(analysis.allExecutionContractsPassed).toBe(true);
    expect(analysis.allNumericalComparisonsWithinTolerance).toBe(true);
    expect(analysis.anyHardPhysiologyClassFlip).toBe(false);
    expect(analysis.allPrimaryRunsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(
      analysis.allPrimaryRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    ).toBe(true);
    expect(analysis.allPrimaryExactStationAuditsPassed).toBe(true);
    expect(analysis.allPrimarySimplifiedPeakGradientVmaxIdentitiesPassed).toBe(
      true,
    );
    expect(
      analysis.allPrimaryTwoSidedRestingVmaxAndGradientReadoutsMatched,
    ).toBe(true);
    expect(analysis.allPrimaryArmLevelAvAntiStenosisGatesPassed).toBe(true);
    expect(analysis.allFixedRunsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(
      analysis.allFixedRunsHaveExactlyOneCompleteOnePercentFlowEpisode,
    ).toBe(true);
    expect(analysis.allFixedExactStationAuditsPassed).toBe(true);
    expect(analysis.allFixedSimplifiedPeakGradientVmaxIdentitiesPassed).toBe(
      true,
    );
    expect(analysis.allFixedTwoSidedRestingVmaxAndGradientReadoutsMatched).toBe(
      true,
    );
    expect(analysis.allFixedArmLevelAvAntiStenosisGatesPassed).toBe(true);
    expect(analysis.compoundComparisonValidityPassed).toBe(true);
    expect(analysis.limitingUnionFixedHorizonAuditPassed).toBe(true);
    expect(analysis.auditStatus).toBe("passed");
    expect(analysis.compoundMismatchDetected).toBe(false);
    expect(analysis.nonNumericalAuditFailureDetected).toBe(false);
    expect(analysis.physiologyGateFailureDetected).toBe(false);
    expect(analysis.decompositionStatus).toBe("not-required");
    expect(analysis.horizonAndTimeStepEffectsSeparated).toBe(false);
    expect(analysis.allThirtySixEnvelopeArmsAuditedAtFixedHorizon).toBe(false);
    expect(analysis.continuityEquivalentEoaVariationRecertified).toBe(false);
    expect(
      analysis.pairsInFrozenCatalogOrder.every(
        (pair) =>
          pair.pairPassed &&
          pair.metricComparisons.length === 9 &&
          pair.hardClassComparisons.length === 7 &&
          pair.identityAudit.primaryExpectedFrozenCatalogIdentityPassed &&
          pair.identityAudit.fixedExpectedFrozenCatalogIdentityPassed &&
          pair.executionAudit.primaryColdStartAudit.coldStartAuditPassed &&
          pair.executionAudit.fixedColdStartAudit.coldStartAuditPassed &&
          pair.executionAudit.fixedEndpointTimeMatched48s &&
          pair.fixedHorizonReadout.ledger.period1AndIntegrationPassed,
      ),
    ).toBe(true);
  }, 1_800_000);
});
