import { describe, expect, it } from "vitest";

import {
  measureMainWireAorticOutflowV10LimitingCornerDtConvergenceV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10LimitingCornerDtConvergenceV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10LimitingCornerDtConvergenceV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 limiting-corner dt convergence V1", () => {
  it("keeps the limiting-context and exact-port structure under a lightweight dt override", () => {
    const testDtValuesSec = Object.freeze([0.02, 0.01] as const);
    const inputs = MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.flatMap(
      (selection) => testDtValuesSec.map((dtSec) => Object.freeze({
        selectionId: selection.selectionId,
        dtSec,
        run:
          runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
            { dtSec, maximumBeatCount: 1 },
            CANDIDATE.kuwProfileId,
            selection.context.complianceProfileId,
            CANDIDATE.characteristicResistancePlacementProfileId,
            CANDIDATE.rootInertanceProfileId,
            CANDIDATE.sarcomereReferenceProfileId,
            CANDIDATE.calciumSensitivityLengthProfileId,
            CANDIDATE.twitchRetentionCandidateId,
            selection.context.circulatoryLoadPointId,
            selection.context.stressedVenousVolumePointId,
            selection.context.trefForceLoadProfileId,
            CANDIDATE.sourceVelocityDistortionProfileId,
            CANDIDATE.strongBridgeDeactivationExitProfileId,
            CANDIDATE.atrioventricularDelayProfileId,
            CANDIDATE.pressureRecoveryProfileId,
            CANDIDATE.recoveredRootPortValveProfileId,
          ),
      })),
    );
    const comparison =
      measureMainWireAorticOutflowV10LimitingCornerDtConvergenceV1(
        inputs,
        { expectedDtValuesSec: testDtValuesSec },
      );

    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1).toHaveLength(4);
    expect(new Set(MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNERS_V1.map(
      (selection) => selection.context.contextId))).toHaveProperty("size", 4);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_VALUES_SEC_V1)
      .toEqual([0.002, 0.001, 0.0005]);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_V10_LIMITING_CORNER_DT_CONVERGENCE_CLAIM_V1)
      .toMatchObject({
        fullDesignArmCount: 12,
        independentCanonicalColdStartPerRun: true,
        parameterSearchOrFitting: false,
      });
    expect(comparison.evaluatedDtValuesSec).toEqual(testDtValuesSec);
    expect(comparison.finestReferenceDtSec).toBe(0.01);
    expect(comparison.evaluatedArmCount).toBe(8);
    expect(comparison.canonicalDesignFullyEvaluated).toBe(false);
    expect(comparison.convergenceByContext).toHaveLength(4);
    expect(comparison.arms).toHaveLength(8);
    expect(comparison.protocolIdentityStableAcrossDtWithinEveryContext)
      .toBe(true);
    expect(comparison.allContextProtocolIdentitiesDistinct).toBe(true);
    expect(
      comparison
        .allExactEvaluatorProximalPortReadbacksAvailableAndWithinTolerance,
    ).toBe(true);
    expect(comparison.allStationReconstructionResidualsWithinTolerance)
      .toBe(true);
    expect(comparison.allOwnedOpeningTargetsWithinTolerance).toBe(true);
    expect(comparison.allSourceResistanceReadbacksWithinTolerance).toBe(true);
    expect(comparison.allExactPowerBalancesWithinTolerance).toBe(true);
    expect(comparison.allValveDissipationLedgersWithinTolerance).toBe(true);
    expect(comparison.arms.every((arm) =>
      arm.exactAudit.exactEvaluatorPortReadbackAvailableSampleCount
        === arm.exactAudit.exactEvaluatorPortReadbackTotalSampleCount
      && arm.exactAudit.exactEvaluatorPortReadbackTotalSampleCount
        === arm.sampleCount)).toBe(true);
    expect(comparison.arms.every((arm) =>
      Object.values(arm.metrics).every((value) =>
        value === null || Number.isFinite(value)))).toBe(true);
    const finestArms = comparison.arms.filter((arm) => arm.dtSec === 0.01);
    expect(finestArms).toHaveLength(4);
    expect(finestArms.every((arm) =>
      Object.values(arm.differenceFromFinest).every((value) =>
        value === null || Object.is(value, 0)))).toBe(true);
    expect(comparison.arms.filter((arm) => arm.dtSec === 0.02).some((arm) =>
      Object.values(arm.differenceFromFinest).some((value) =>
        value !== null && !Object.is(value, 0)))).toBe(true);
    expect(comparison.convergenceByContext.every((entry) =>
      entry.arms.length === 2
      && entry.strictPeakCountStableAcrossDt
      && entry.distinctPeakCountStableAcrossDt)).toBe(true);
  }, 60_000);
});
