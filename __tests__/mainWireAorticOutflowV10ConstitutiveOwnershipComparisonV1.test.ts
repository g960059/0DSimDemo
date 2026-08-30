import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowV10ConstitutiveOwnershipV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10ConstitutiveOwnershipComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1,
  resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10ConstitutiveOwnershipAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 constitutive ownership comparison V1", () => {
  it("separates the local opening station and exact energy ownership", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1.map(
        (armId) => {
          const arm =
            resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1(armId);
          return Object.freeze({ arm, run: runArm(arm) });
        },
      );
    const comparison =
      compareMainWireAorticOutflowV10ConstitutiveOwnershipV1(inputs);
    const naive = comparison.arms.find((measured) =>
      measured.arm.armId === "v9-garcia-recovery-raw-opening")!;
    const v10 = comparison.arms.find((measured) =>
      measured.arm.armId === "v10-garcia-recovery-local-port-opening")!;
    const v10Input = inputs.find((input) =>
      input.arm.armId === "v10-garcia-recovery-local-port-opening")!;

    expect(comparison.allExpectedArmsPresent).toBe(true);
    expect(comparison.allProtocolIdentitiesDistinct).toBe(true);
    expect(comparison.allOwnedOpeningTargetsWithinTolerance).toBe(true);
    expect(comparison.allResistanceReadbacksWithinTolerance).toBe(true);
    expect(comparison.allExactPowerBalancesWithinTolerance).toBe(true);
    expect(
      comparison
        .v10ExactEvaluatorProximalPortReadbackAvailableAndWithinTolerance,
    ).toBe(true);
    expect(comparison
      .v10CompatibilityDissipationMatchesReconstructedValveIrreversibleEnergy)
      .toBe(true);
    expect(v10.arm.openingDrivePressureStation)
      .toBe("LV-minus-proximal-constitutive-port");
    expect(v10.constitutiveAudit.expectedForwardResistanceReadbackMmHgSecPerMl)
      .toBeCloseTo(
        v10Input.run.periodicResult.valveResearchInput.valves.AoV
          .backgroundLinearResistanceMmHgSecPerMl,
        14,
      );
    expect(v10.constitutiveAudit
      .compatibilityMinusReconstructedValveEnergyMmHgMl)
      .toBeCloseTo(0, 8);
    expect(naive.constitutiveAudit
      .compatibilityMinusReconstructedValveEnergyMmHgMl)
      .toBeCloseTo(
        naive.constitutiveAudit.reconstructedCharacteristicWaveLoadMmHgMl,
        8,
      );
    expect(v10.cycle.aorticFlowDistinctPeakCountAboveFivePercent).toBe(1);
    expect(MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10_CLAIM)
      .toMatchObject({
        systemicRecalibrationAppliedAfterPortLawChange: false,
        newContinuousStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
  });
});

function runArm(
  arm: ReturnType<
    typeof resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1
  >,
) {
  return runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
    { dtSec: 0.02, maximumBeatCount: 1 },
    CANDIDATE.kuwProfileId,
    CANDIDATE.complianceProfileId,
    CANDIDATE.characteristicResistancePlacementProfileId,
    CANDIDATE.rootInertanceProfileId,
    CANDIDATE.sarcomereReferenceProfileId,
    CANDIDATE.calciumSensitivityLengthProfileId,
    CANDIDATE.twitchRetentionCandidateId,
    "baseline",
    "baseline",
    CANDIDATE.trefForceLoadProfileId,
    CANDIDATE.sourceVelocityDistortionProfileId,
    CANDIDATE.strongBridgeDeactivationExitProfileId,
    CANDIDATE.atrioventricularDelayProfileId,
    arm.pressureRecoveryProfileId,
    arm.recoveredRootPortValveProfileId,
  );
}
