import { beforeAll, describe, expect, it } from "vitest";

import {
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha saturating heart-rate law ICT mechanism V1", () => {
  let inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismInputV1[];
  let analysis: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1;

  beforeAll(() => {
    inputs = Object.freeze(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.map(
        (arm) => {
          const run =
            runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
              { dtSec: arm.dtSec, maximumBeatCount: 1 },
              arm.calciumProfileId,
            );
          return Object.freeze({
            arm,
            calciumProfile: run.saturatingHeartRateLawProfile,
            calciumDriveParams: run.calciumDriveParams,
            periodicResult: run.periodicResult,
            referenceNonCalciumAssembly: run.referenceNonCalciumAssembly,
            exactAssemblyAudit: run.exactAssemblyAudit,
          });
        },
      ),
    );
    analysis =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        inputs,
      );
  }, 120_000);

  it("keeps the four main a=0.40 catalog identities closed and exposes the shared ledger", () => {
    expect(analysis.designRole).toBe("main-four-heart-rate-design");
    expect(analysis.dimensionlessRateCoefficient).toBe(0.4);
    expect(
      analysis.armsSortedByHeartRate.map(
        (measured) => measured.arm.heartRateBpm,
      ),
    ).toEqual([50, 60, 75, 90]);
    expect(analysis.allNonCalciumExactAssemblyAuditHashesIdentical).toBe(true);
    expect(analysis.allArmsHaveOneDistinctAorticFlowPeak).toBe(true);
    expect(analysis.allExactReadbackStationEquationsWithinTolerance).toBe(true);
    expect(analysis.allIctIdentitiesWithinTolerance).toBe(true);
    expect(analysis.allCalciumRiseReadbacksPassed).toBe(true);
    expect(analysis.allEventDefinitionSensitivitySemanticsAligned).toBe(true);

    for (const [index, measured] of analysis.armsSortedByHeartRate.entries()) {
      expect(measured.selectedBeatSampleCount).toBe(2_000);
      expect(measured.completedBeatCount).toBe(1);
      expect(measured.precedingAcceptedSampleAvailable).toBe(false);
      expect(measured.integrationCompletedWithoutFailure).toBe(true);
      expect(measured.periodicSteadyStateClaimed).toBe(false);
      expect(measured.period1AndIntegrationPassed).toBe(false);
      expect(measured.calciumRiseReadbackPassed).toBe(true);
      expect(measured.interpretationEligible).toBe(false);
      expect(measured.exactReadbackAudit.allSelectedBeatSamplesAvailable).toBe(
        true,
      );

      const shared =
        measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
          {
            sourceLabel: `shared-${measured.arm.armId}`,
            calciumDriveParams: inputs[index]!.calciumDriveParams,
            periodicResult: inputs[index]!.periodicResult,
          },
        );
      expect(shared.ictDecomposition).toEqual(measured.ictDecomposition);
      expect(shared.mitralClosureDefinitions).toEqual(
        measured.mitralClosureDefinitions,
      );
      expect(shared.pressureBuildToLocalOpening).toEqual(
        measured.pressureBuildToLocalOpening,
      );
    }
  });

  it("passes full-P1 gates and all three leaflet statuses on an HR50 sentinel", () => {
    const arm =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.find(
        (entry) => entry.heartRateBpm === 50,
      )!;
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        { dtSec: arm.dtSec },
        arm.calciumProfileId,
      );
    const ledger =
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
        {
          sourceLabel: "full-P1-HR50-sentinel",
          calciumDriveParams: run.calciumDriveParams,
          periodicResult: run.periodicResult,
        },
      );
    expect(ledger.periodicSteadyStateClaimed).toBe(true);
    expect(ledger.completedBeatCount).toBeGreaterThan(1);
    expect(ledger.precedingAcceptedSampleAvailable).toBe(true);
    expect(ledger.period1AndIntegrationPassed).toBe(true);
    expect(ledger.singleDistinctAorticFlowPeakPassed).toBe(true);
    expect(ledger.exactStationAuditPassed).toBe(true);
    expect(ledger.calciumRiseReadbackPassed).toBe(true);
    expect(ledger.interpretationEligible).toBe(true);
    expect(
      ledger.ictDecomposition.calciumOnePercentRiseReadback.bracketSatisfied,
    ).toBe(true);
    expect(ledger.ictDecomposition.systolicEventOrderSatisfied).toBe(true);
    expect(
      ledger.mitralClosureDefinitions.leafletClosureSensitivity.fiftyPercent
        .status,
    ).toBe("already-at-or-below-at-final-target-deactivation");
    expect(
      ledger.mitralClosureDefinitions.leafletClosureSensitivity.tenPercent
        .status,
    ).toBe("crossed-after-final-target-deactivation-before-AVO");
    expect(
      ledger.mitralClosureDefinitions.leafletClosureSensitivity.onePercent
        .status,
    ).toBe("remains-above-at-AVO");
    expect(
      Math.abs(
        ledger.ictDecomposition.calciumOnePercentRiseReadback
          .reconstructionResidualUM,
      ),
    ).toBeLessThanOrEqual(1e-12);
  }, 120_000);

  it("closes the signed ICT causal ledger and aligns the existing strict-flow/local-gradient semantics", () => {
    for (const measured of analysis.armsSortedByHeartRate) {
      const ict = measured.ictDecomposition;
      const thresholds = measured.aorticThresholds;
      expect(ict.canonicalFlowThresholdIctSec).toBeCloseTo(
        ict.mitralClosureToCalciumRiseSignedSec +
          ict.calciumRiseToCanonicalAvoSec,
        12,
      );
      expect(ict.canonicalFlowThresholdIctSec).toBeCloseTo(
        ict.mitralClosureToCalciumRiseSignedSec +
          ict.calciumRiseToExactLocalGradientPositiveSec +
          ict.exactLocalGradientPositiveToStrictPositiveFlowSec +
          ict.strictPositiveFlowToCanonicalOnePercentAvoSec,
        12,
      );
      expect(Math.abs(ict.identityResidualSec)).toBeLessThanOrEqual(1e-10);
      expect(Math.abs(ict.macroIdentityResidualSec)).toBeLessThanOrEqual(1e-10);
      expect(
        Math.abs(ict.canonicalIndexIntervalResidualSec),
      ).toBeLessThanOrEqual(1e-10);
      const calcium = ict.calciumOnePercentRiseReadback;
      expect(calcium.thresholdDefinition).toBe(
        "diastolic-plus-one-percent-configured-peak-amplitude",
      );
      expect(calcium.shiftedSignalInterpolated).toBe(
        "LVFW-free-calcium-minus-threshold",
      );
      expect(calcium.bracketSatisfied).toBe(true);
      expect(calcium.previousAcceptedEndpointCalciumUM).toBeLessThan(
        calcium.thresholdUM,
      );
      expect(calcium.currentAcceptedEndpointCalciumUM).toBeGreaterThanOrEqual(
        calcium.thresholdUM,
      );
      expect(Math.abs(calcium.reconstructionResidualUM)).toBeLessThanOrEqual(
        1e-12,
      );
      expect(calcium.episode.primaryContainsGlobalCalciumPeak).toBe(true);
      expect(ict.systolicEventOrderSatisfied).toBe(true);
      expect(thresholds.strictPositiveFlow).toMatchObject({
        definitionId: "strict-positive-flow",
        predicate: "Q-greater-than-zero",
        threshold: 0,
      });
      expect(thresholds.strictPositiveFlow.openingBoundary.boundaryMethod).toBe(
        "accepted-sample-endpoint",
      );
      expect(
        thresholds.exactLocalGradientPositive.openingBoundary.boundaryMethod,
      ).toBe("linear-zero-crossing-between-accepted-endpoints");
      expect(
        Math.abs(thresholds.localZeroCrossingReconstructionResidualMmHg),
      ).toBeLessThanOrEqual(1e-10);
      expect(thresholds.canonicalAvoIndexMatchesCycleDiagnostics).toBe(true);
      expect(thresholds.noFloorOnePercentOpeningIndexMatchesCanonical).toBe(
        true,
      );
    }
  });

  it("separates mitral flow, pressure, opening-target, and leaflet-trajectory closure definitions", () => {
    for (const measured of analysis.armsSortedByHeartRate) {
      const closure = measured.mitralClosureDefinitions;
      expect(closure.flowMemory).toBe(false);
      expect(closure.inertanceModeled).toBe(false);
      expect(closure.canonicalOnePercentFlowThresholdMvc.boundaryMethod).toBe(
        "accepted-sample-endpoint",
      );
      expect(closure.strictPositiveFlowEpisodeEnd.boundaryMethod).toBe(
        "accepted-sample-endpoint",
      );
      expect(
        closure.leftAtriumMinusLeftVentriclePressureDownwardZeroCrossing
          .boundaryMethod,
      ).toBe("linear-zero-crossing-between-accepted-endpoints");
      expect(
        closure.openingTargetAtOrBelowOnePercentAcceptedEndpoint.boundaryMethod,
      ).toBe("accepted-sample-endpoint");
      expect(closure.openingTargetZeroAcceptedEndpoint.boundaryMethod).toBe(
        "accepted-sample-endpoint",
      );
      expect(
        closure.pressureReversalAndStrictFlowEndShareAcceptedEndpoint,
      ).toBe(true);
      const leafletThresholds = Object.values(
        closure.leafletClosureSensitivity,
      );
      for (const readback of leafletThresholds) {
        expect([
          "already-at-or-below-at-final-target-deactivation",
          "crossed-after-final-target-deactivation-before-AVO",
          "remains-above-at-AVO",
        ]).toContain(readback.status);
        if (
          readback.status ===
          "crossed-after-final-target-deactivation-before-AVO"
        ) {
          expect(readback.crossingBoundary?.boundaryMethod).toBe(
            "linear-zero-crossing-between-accepted-endpoints",
          );
          expect(
            Math.abs(readback.reconstructionResidual01!),
          ).toBeLessThanOrEqual(1e-10);
          expect(
            closure.leafletOpeningFractionAtFinalTargetZero01,
          ).toBeGreaterThan(readback.threshold01);
          expect(
            closure.leafletOpeningFractionAtCanonicalAvo01,
          ).toBeLessThanOrEqual(readback.threshold01);
        } else {
          expect(readback.crossingBoundary).toBeNull();
          expect(readback.crossingMinusCanonicalMvcSec).toBeNull();
          expect(readback.reconstructionResidual01).toBeNull();
          if (
            readback.status ===
            "already-at-or-below-at-final-target-deactivation"
          ) {
            expect(
              closure.leafletOpeningFractionAtFinalTargetZero01,
            ).toBeLessThanOrEqual(readback.threshold01);
          } else {
            expect(
              closure.leafletOpeningFractionAtCanonicalAvo01,
            ).toBeGreaterThan(readback.threshold01);
          }
        }
      }
      expect(
        closure.maximumOpeningTargetAfterFinalZeroBeforeAvo,
      ).toBeGreaterThanOrEqual(0);
      expect(
        closure.maximumOpeningTargetAfterFinalZeroBeforeAvo,
      ).toBeLessThanOrEqual(0.01);
      expect(
        closure.openingTargetReactivationAboveOnePercentAfterFinalZeroBeforeAvo,
      ).toBe(false);
      expect(closure.openingTargetAtCanonicalAvo01).toBeGreaterThanOrEqual(0);
      expect(closure.openingTargetAtCanonicalAvo01).toBeLessThanOrEqual(1);
      expect(
        closure.leafletOpeningFractionAtCanonicalAvo01,
      ).toBeGreaterThanOrEqual(0);
      expect(
        closure.leafletOpeningFractionAtCanonicalAvo01,
      ).toBeLessThanOrEqual(1);
      if (closure.leafletFiftyToOnePercentClosureWidthSec !== null) {
        expect(closure.leafletFiftyToOnePercentClosureWidthSec).toBeGreaterThan(
          0,
        );
      }
      expect(
        Math.abs(closure.pressureZeroCrossingReconstructionResidualMmHg),
      ).toBeLessThanOrEqual(1e-10);
      expect(
        Math.abs(
          closure.canonicalMvcToPressureReversalToAvoIdentityResidualSec,
        ),
      ).toBeLessThanOrEqual(1e-10);
    }
  });

  it("audits event states, pressure-build closure, mitral filling, and HR deltas", () => {
    for (const measured of analysis.armsSortedByHeartRate) {
      for (const event of Object.values(measured.timeline)) {
        expect(event.sampleIndex).toBeGreaterThanOrEqual(0);
        expect(event.sampleIndex).toBeLessThan(2_000);
        expect(event.phase01).toBeGreaterThanOrEqual(0);
        expect(event.phase01).toBeLessThanOrEqual(1);
        expect(Number.isFinite(event.timeSec)).toBe(true);
      }
      for (const state of Object.values(measured.eventSnapshots)) {
        expect(state.rawLeftVentricleMinusAorticNodeGradientMmHg).toBeCloseTo(
          state.exactLocalLeftVentricleMinusProximalPortGradientMmHg +
            state.characteristicImpedancePressureMmHg,
          10,
        );
        expect(
          Math.abs(state.stationAdditivityResidualMmHg),
        ).toBeLessThanOrEqual(1e-9);
      }
      expect(
        Math.abs(
          measured.pressureBuildToLocalOpening
            .deficitClosureIdentityResidualMmHg,
        ),
      ).toBeLessThanOrEqual(1e-9);
      const calciumPressure = measured.calciumRisePressureBuildToLocalOpening;
      expect(calciumPressure.startDefinition).toBe(
        "interpolated-ventricular-calcium-one-percent-rise",
      );
      expect(calciumPressure.stateInterpolation).toBe(
        "linear-between-boundary-bracketing-accepted-endpoint-states",
      );
      expect(calciumPressure.calciumRiseToLocalZeroCrossingSec).toBeCloseTo(
        measured.ictDecomposition.calciumRiseToExactLocalGradientPositiveSec,
        12,
      );
      expect(
        Math.abs(calciumPressure.deficitClosureIdentityResidualMmHg),
      ).toBeLessThanOrEqual(1e-9);
      expect(measured.mitralFilling.cycleDiagnostics).toBeDefined();
      for (const residual of [
        measured.mitralFilling.peakEToAIdentityResidual,
        measured.mitralFilling.forwardVolumeEToAIdentityResidual,
        measured.mitralFilling.modeledVtiEToAIdentityResidual,
      ]) {
        if (residual !== null)
          expect(Math.abs(residual)).toBeLessThanOrEqual(1e-10);
      }
    }

    expect(analysis.adjacentHeartRateDeltas).toHaveLength(3);
    const low = analysis.armsSortedByHeartRate[0]!.trendPoint;
    const high = analysis.armsSortedByHeartRate[3]!.trendPoint;
    expect(
      analysis.heartRate90Minus50.upperMinusLower.canonicalIctSec,
    ).toBeCloseTo(high.canonicalIctSec - low.canonicalIctSec, 12);
    const expectedLeafletDelta =
      high.mitralLeafletOnePercentMinusCanonicalMvcSec === null ||
      low.mitralLeafletOnePercentMinusCanonicalMvcSec === null
        ? null
        : high.mitralLeafletOnePercentMinusCanonicalMvcSec -
          low.mitralLeafletOnePercentMinusCanonicalMvcSec;
    expect(
      analysis.heartRate90Minus50.upperMinusLower
        .mitralLeafletOnePercentMinusCanonicalMvcSec,
    ).toBe(expectedLeafletDelta);
  });

  it("rejects incomplete, duplicate, altered catalog, and altered runner identities", () => {
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        inputs.slice(0, -1),
      ),
    ).toThrow(/missing saturating-law ICT arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        [...inputs.slice(0, -1), inputs[0]!],
      ),
    ).toThrow(/duplicate saturating-law ICT arm/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        [
          Object.freeze({
            ...inputs[0]!,
            arm: Object.freeze({
              ...inputs[0]!.arm,
              dtSec: inputs[0]!.arm.dtSec * 2,
            }),
          }),
          ...inputs.slice(1),
        ],
      ),
    ).toThrow(/arm catalog identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        [
          Object.freeze({
            ...inputs[0]!,
            calciumProfile: inputs[1]!.calciumProfile,
          }),
          ...inputs.slice(1),
        ],
      ),
    ).toThrow(/calcium profile identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        [
          Object.freeze({
            ...inputs[0]!,
            referenceNonCalciumAssembly: Object.freeze({
              ...inputs[0]!.referenceNonCalciumAssembly,
            }),
          }) as never,
          ...inputs.slice(1),
        ],
      ),
    ).toThrow(/reference assembly identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
        [
          Object.freeze({
            ...inputs[0]!,
            exactAssemblyAudit: Object.freeze({
              ...inputs[0]!.exactAssemblyAudit,
              calciumDriveFixedParamsStableHash: "altered",
            }),
          }),
          ...inputs.slice(1),
        ],
      ),
    ).toThrow(/exact assembly audit identity mismatch/);
    expect(() =>
      measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
        {
          sourceLabel: "altered-shared-ledger-params",
          calciumDriveParams: Object.freeze({
            ...inputs[0]!.calciumDriveParams,
            atrioventricularDelaySec:
              inputs[0]!.calciumDriveParams.atrioventricularDelaySec + 0.001,
          }),
          periodicResult: inputs[0]!.periodicResult,
        },
      ),
    ).toThrow(/calcium parameter\/result identity mismatch/);
  });
});
