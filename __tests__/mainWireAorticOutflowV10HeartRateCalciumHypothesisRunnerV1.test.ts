import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1,
  type MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumHeartRateHypothesesV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10HeartRateCalciumHypothesesV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 heart-rate calcium hypothesis runner V1", () => {
  it("runs only the fixed eight profiles on one shared V10 non-calcium assembly", () => {
    const runs = new Map<
      MainWireVentricularCalciumHeartRateHypothesisProfileIdV1,
      MainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchRunV1
    >();
    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_HEART_RATE_HYPOTHESIS_PROFILE_IDS_V1) {
      const heartRateBpm = Number(profileId.match(/hr-(\d+)$/)?.[1]);
      const cycleLengthSec = 60 / heartRateBpm;
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
          { dtSec: cycleLengthSec / 50, maximumBeatCount: 1 },
          profileId,
        );
      runs.set(profileId, run);

      expect(run.configurationRole).toBe(
        "fixed-v10-reference-non-calcium-heart-rate-calcium-hypothesis-arm",
      );
      expect(run.referenceNonCalciumAssembly).toBe(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_HEART_RATE_CALCIUM_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
      );
      expect(run.calciumHypothesisProfile.profileId).toBe(profileId);
      expect(run.calciumHypothesisProfile.heartRateBpm).toBe(heartRateBpm);
      expect(run.calciumDriveParams.cycleLengthSec).toBe(cycleLengthSec);
      expect(run.periodicResult.claim.heartRateBpm).toBe(heartRateBpm);
      expect(run.periodicResult.stepsPerBeat).toBe(50);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.completedBeatCount).toBe(1);
      expect(run.periodicResult.terminalCycleBoundaryWarmStart === null).toBe(
        heartRateBpm !== 60,
      );
      expect(
        run.periodicResult.protocolIdentity.calciumDrive.parameterSetId,
      ).toBe(run.calciumDriveParams.parameterSetId);
      expect(
        run.periodicResult.valveResearchInput.valves.AoV.maximumForwardEoaCm2,
      ).toBe(3.5);

      expect(run.kuwProfile.profileId).toBe(CANDIDATE.kuwProfileId);
      expect(run.sarcomereReferenceProfile.profileId).toBe(
        CANDIDATE.sarcomereReferenceProfileId,
      );
      expect(run.calciumSensitivityLengthProfile.profileId).toBe(
        CANDIDATE.calciumSensitivityLengthProfileId,
      );
      expect(run.sourceTwitchRetentionCandidate.candidateId).toBe(
        CANDIDATE.twitchRetentionCandidateId,
      );
      expect(run.trefForceLoadProfile.profileId).toBe(
        CANDIDATE.trefForceLoadProfileId,
      );
      expect(run.sourceVelocityDistortionProfile.profileId).toBe(
        CANDIDATE.sourceVelocityDistortionProfileId,
      );
      expect(run.strongBridgeDeactivationExitProfile.profileId).toBe(
        CANDIDATE.strongBridgeDeactivationExitProfileId,
      );
      expect(run.complianceProfile.profileId).toBe(
        CANDIDATE.complianceProfileId,
      );
      expect(run.placementProfile.profileId).toBe(
        CANDIDATE.characteristicResistancePlacementProfileId,
      );
      expect(run.rootInertanceProfile.profileId).toBe(
        CANDIDATE.rootInertanceProfileId,
      );
      expect(run.aorticValveResearchProfile.profileId).toBe(
        CANDIDATE.pressureRecoveryProfileId,
      );
      expect(run.recoveredRootPortValveProfile.profileId).toBe(
        CANDIDATE.recoveredRootPortValveProfileId,
      );
      expect(run.circulatoryLoadPoint.pointId).toBe("baseline");
      expect(run.stressedVenousVolumePoint.pointId).toBe("baseline");

      expect(run.claim).toMatchObject({
        genericParameterPatchAccepted: false,
        fixedCalciumHypothesisProfileOnly: true,
        fullV10CandidateIdentityRetained: false,
        V10ReferenceNonCalciumAssemblyHeldExactly: true,
        V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false,
        oldLandCoppiniSourceTraceProfileReturned: false,
        oldAtrioventricularDelayProfileReturned: false,
        systemicOrBloodVolumeRecalibrationApplied: false,
        aorticMaximumForwardEoaHeldAtCm2: 3.5,
        nonHr60V3WarmStartEmissionSuppressed: true,
        nonHr60V3WarmStartRestoreRejected: true,
        parameterSearchOrFitting: false,
        clinicalValidationClaimed: false,
      });
      expect(
        Object.prototype.hasOwnProperty.call(run, "sourceTraceProfile"),
      ).toBe(false);
      expect(
        Object.prototype.hasOwnProperty.call(
          run,
          "atrioventricularDelayProfile",
        ),
      ).toBe(false);
      expect(
        Object.prototype.hasOwnProperty.call(
          run.claim,
          "primaryNumericSourceCalciumTraceUsed",
        ),
      ).toBe(false);

      const samples = run.periodicResult.retainedCompleteBeats[0]!.samples;
      expect(samples).toHaveLength(50);
      samples.forEach((sample, index) => {
        const expectedPhase01 = ((index + 1) % 50) / 50;
        const phaseDifference01 = Math.abs(
          sample.cyclePhase01 - expectedPhase01,
        );
        expect(
          Math.min(phaseDifference01, Math.abs(1 - phaseDifference01)),
        ).toBeLessThan(1e-12);
        expect(
          sample.valveHydraulics.AoV.recoveredRootPortExactReadback,
        ).toMatchObject({
          openingDrivePressureStation: "LV-minus-proximal-constitutive-port",
        });
      });
    }

    const allRuns = [...runs.values()];
    expect(
      new Set(allRuns.map((run) => run.periodicResult.protocolIdentityHash)),
    ).toHaveProperty("size", 8);
    expect(
      new Set(
        allRuns.map(
          (run) =>
            run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        allRuns.map(
          (run) => run.exactAssemblyAudit.circulationRuntimeStableHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        allRuns.map(
          (run) => run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        allRuns.map(
          (run) => run.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
        ),
      ),
    ).toHaveProperty("size", 8);

    const anchored = runs.get("phase-scaled-coppini-hr-60")!;
    const existingV10 =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
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
        CANDIDATE.pressureRecoveryProfileId,
        CANDIDATE.recoveredRootPortValveProfileId,
      );
    expect(anchored.calciumDriveParams).toEqual(existingV10.calciumDriveParams);
    expect(anchored.periodicResult).toEqual(existingV10.periodicResult);
  }, 120_000);

  it("rejects fields outside dt and the execution beat limit", () => {
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
        {
          dtSec: 0.02,
          maximumBeatCount: 1,
          calciumDriveParams: {},
        } as never,
        "phase-scaled-coppini-hr-60",
      ),
    ).toThrow(/reject unsupported field: calciumDriveParams/);
  });
});
