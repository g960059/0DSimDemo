import { beforeAll, describe, expect, it } from "vitest";

import {
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1";
import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import { MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayBracketV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha saturating HR90 atrioventricular-delay mechanism V1", () => {
  let runs: readonly MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1[];
  let analysis: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1;

  beforeAll(() => {
    runs = Object.freeze(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
            { dtSec: 60 / 90 / 500, maximumBeatCount: 72 },
            profileId,
          ),
      ),
    );
    analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
        runs,
      );
  }, 120_000);

  it("keeps the fixed three-arm catalog, exact control, and non-calcium assembly isolated at full P1", () => {
    expect(
      analysis.armsInCatalogOrder.map(({ profile }) => profile.profileId),
    ).toEqual(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
    );
    expect(
      analysis.armsInCatalogOrder.map(
        ({ profile }) => profile.atrioventricularDelaySec,
      ),
    ).toEqual([0.12, 0.11, 0.1]);
    expect(analysis.controlCalciumParamsIdentityReusedExactly).toBe(true);
    expect(analysis.stepsPerCycle).toBe(500);
    expect(analysis.dtSec).toBe(60 / 90 / 500);
    expect(analysis.executionRole).toBe("focused-cycle-over-500-regression");
    expect(analysis.allReferenceNonCalciumAssemblyIdentitiesExact).toBe(true);
    expect(analysis.allNonCalciumExactAssemblyAuditHashesIdentical).toBe(true);
    expect(analysis.allCalciumDriveHashesDistinct).toBe(true);
    expect(analysis.allProtocolIdentityHashesDistinct).toBe(true);
    expect(analysis.allArmsPeriod1AndIntegrationPassed).toBe(true);
    expect(analysis.allArmsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(analysis.allExactReadbackStationEquationsWithinTolerance).toBe(true);
    expect(analysis.allIctIdentitiesWithinTolerance).toBe(true);
    expect(analysis.allArmsInterpretationEligible).toBe(true);
    expect(analysis.allShorterDelayArmsShortenFlowDerivedCanonicalIct).toBe(
      true,
    );
    expect(
      analysis.delay100NonEquivalentCopenhagenReferenceOverlayCorrectedIctSec,
    ).toBeCloseTo(0.0855, 9);
    expect(
      analysis.analysisClaim.nonEquivalentCopenhagenIvctReferenceOverlay
        .clinicalPredictionIntervalClassificationApplied,
    ).toBe(false);
    expect(
      analysis.analysisClaim.nonEquivalentCopenhagenIvctReferenceOverlay
        .normalOrAbnormalClassificationClaimed,
    ).toBe(false);

    for (const [index, arm] of analysis.armsInCatalogOrder.entries()) {
      expect(arm.ledger.heartRateBpm).toBe(90);
      expect(arm.ledger.selectedBeatSampleCount).toBe(500);
      expect(arm.ledger.periodicSteadyStateClaimed).toBe(true);
      expect(arm.ledger.integrationCompletedWithoutFailure).toBe(true);
      expect(arm.ledger.interpretationEligible).toBe(true);
      expect(arm.calciumDifferenceKeysFromControl).toEqual(
        index === 0 ? [] : ["atrioventricularDelaySec", "parameterSetId"],
      );
    }
    expect(
      new Set(
        analysis.armsInCatalogOrder.map(
          ({ nonCalciumExactAssemblyAuditHash }) =>
            nonCalciumExactAssemblyAuditHash,
        ),
      ).size,
    ).toBe(1);
  });

  it("returns the unmodified shared ICT ledger and exact candidate-minus-control metric deltas", () => {
    for (const [index, arm] of analysis.armsInCatalogOrder.entries()) {
      const direct =
        measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
          {
            sourceLabel: arm.profile.profileId,
            calciumDriveParams: runs[index]!.calciumDriveParams,
            periodicResult: runs[index]!.periodicResult,
          },
        );
      expect(arm.ledger).toEqual(direct);
      for (const key of Object.keys(
        arm.metrics,
      ) as (keyof typeof arm.metrics)[]) {
        const candidate = arm.metrics[key];
        const control = analysis.armsInCatalogOrder[0]!.metrics[key];
        expect(arm.controlRelativeDelta[key]).toBe(
          candidate === null || control === null ? null : candidate - control,
        );
      }
    }
  });

  it("predominantly localizes the ICT shortening to earlier ventricular timing while exposing small flow and A-wave changes", () => {
    const control = analysis.armsInCatalogOrder[0]!;
    const delay110 = analysis.armsInCatalogOrder[1]!;
    const delay100 = analysis.armsInCatalogOrder[2]!;

    expect(delay110.controlRelativeDelta.canonicalIctSec).toBeCloseTo(
      -0.009333333333333332,
      12,
    );
    expect(delay100.controlRelativeDelta.canonicalIctSec).toBeCloseTo(
      -0.018666666666666665,
      12,
    );
    for (const candidate of [delay110, delay100]) {
      const mvcToCalciumShareOfIctShortening =
        candidate.controlRelativeDelta.mvcToCalciumRiseSignedSec! /
        candidate.controlRelativeDelta.canonicalIctSec!;
      expect(
        Math.abs(candidate.controlRelativeDelta.calciumRiseToCanonicalAvoSec!),
      ).toBeLessThanOrEqual(0.001);
      expect(mvcToCalciumShareOfIctShortening).toBeGreaterThan(0.9);
      expect(mvcToCalciumShareOfIctShortening).toBeLessThanOrEqual(1.05);
      expect(analysis.analysisClaim.resolutionRoles.focusedRegression).toBe(
        "cycle-over-500-full-P1-identity-and-direction-regression-only",
      );
      expect(
        Math.abs(candidate.controlRelativeDelta.onePercentFlowEjectionTimeSec!),
      ).toBeLessThan(0.002);
      expect(
        Math.abs(candidate.controlRelativeDelta.meanDopplerGradientMmHg!),
      ).toBeLessThan(0.05);
      expect(
        Math.abs(candidate.controlRelativeDelta.strokeVolumeMl!),
      ).toBeLessThan(0.7);
      expect(candidate.aWaveFlags.fusedOrUnresolved).toBe(false);
      expect(
        candidate.aWaveFlags.newCategoricalAReadbackLossRelativeToControl,
      ).toBe(false);
      expect(
        candidate.aWaveFlags.newAModeledVtiUnavailableRelativeToControl,
      ).toBe(false);
      expect(
        candidate.aWaveFlags.newAForwardDurationUnavailableRelativeToControl,
      ).toBe(false);
      expect(candidate.aWaveFlags.aPeakReducedRelativeToControl).toBe(true);
      expect(candidate.aWaveFlags.aForwardVolumeReducedRelativeToControl).toBe(
        true,
      );
    }
    expect(
      control.aWaveFlags.anyDirectionalAWaveReductionRelativeToControl,
    ).toBe(false);
    expect(analysis.anyCandidateNewFusionOrUnresolved).toBe(false);
    expect(analysis.anyCandidateNewCategoricalAReadbackLoss).toBe(false);
  });

  it("rejects incomplete, duplicate, and exact-identity-corrupted inputs", () => {
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
        runs.slice(0, 2),
      ),
    ).toThrow(/missing HR90 AV-delay mechanism arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
        [runs[0]!, runs[0]!, runs[2]!],
      ),
    ).toThrow(/duplicate HR90 AV-delay mechanism arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
        [
          {
            ...runs[0]!,
            exactAssemblyAudit: {
              ...runs[0]!.exactAssemblyAudit,
              circulationRuntimeStableHash: "corrupted",
            },
          },
          runs[1]!,
          runs[2]!,
        ],
      ),
    ).toThrow(/HR90 AV-delay exact identity mismatch/);
  });

  it("does not emit directional interpretations when the three-arm result is ineligible", () => {
    const transient =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
        MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
          (profileId) =>
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
              { dtSec: 60 / 90 / 500, maximumBeatCount: 1 },
              profileId,
            ),
        ),
      );

    expect(transient.allArmsInterpretationEligible).toBe(false);
    expect(transient.allShorterDelayArmsShortenFlowDerivedCanonicalIct).toBe(
      false,
    );
    expect(transient.anyCandidateNewFusionOrUnresolved).toBe(false);
    expect(transient.anyCandidateNewCategoricalAReadbackLoss).toBe(false);
    for (const arm of transient.armsInCatalogOrder) {
      expect(arm.aWaveFlags.newFusionOrUnresolvedRelativeToControl).toBe(false);
      expect(arm.aWaveFlags.newCategoricalAReadbackLossRelativeToControl).toBe(
        false,
      );
      expect(arm.aWaveFlags.anyDirectionalAWaveReductionRelativeToControl).toBe(
        false,
      );
    }
  });
});
