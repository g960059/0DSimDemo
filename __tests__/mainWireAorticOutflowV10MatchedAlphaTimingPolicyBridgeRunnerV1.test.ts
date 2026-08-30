import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1,
  type MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 matched-alpha timing-policy bridge runner V1", () => {
  it("runs only the fixed four profiles on one exact V10 non-calcium assembly", () => {
    const runs = new Map<
      MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileIdV1,
      MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchRunV1
    >();
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_ARM_IDS_V1,
    ).toBe(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
    );

    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeProfileV1(
          profileId,
        );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
          {
            dtSec: profile.cycleLengthSec / 50,
            maximumBeatCount: 1,
          },
          profileId,
        );
      runs.set(profileId, run);

      expect(run.configurationRole).toBe(
        "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-arm",
      );
      expect(run.referenceNonCalciumAssembly).toBe(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
      );
      expect(run.matchedAlphaTimingPolicyBridgeProfile).toBe(profile);
      expect(run.periodicResult.claim.heartRateBpm).toBe(profile.heartRateBpm);
      expect(run.periodicResult.stepsPerBeat).toBe(50);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.completedBeatCount).toBe(1);
      expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
      expect(
        run.periodicResult.protocolIdentity.calciumDrive.parameterSetId,
      ).toBe(run.calciumDriveParams.parameterSetId);
      expect(
        run.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
      ).toBe(run.exactAssemblyAudit.calciumDriveFixedParamsStableHash);
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
        fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true,
        fullV10CandidateIdentityRetained: false,
        V10ReferenceNonCalciumAssemblyHeldExactly: true,
        V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false,
        matchedAlphaWaveformFamilyHeldExactly: true,
        ventricularCalciumExtremaHeldExactly: true,
        onlyVentricularRiseAndDecayTimeConstantsDifferAcrossTimingPolicy: true,
        oldLandCoppiniSourceTraceProfileReturned: false,
        oldAtrioventricularDelayProfileReturned: false,
        systemicOrBloodVolumeRecalibrationApplied: false,
        aorticMaximumForwardEoaHeldAtCm2: 3.5,
        nonHr60V3WarmStartEmissionSuppressed: true,
        nonHr60V3WarmStartRestoreRejected: true,
        profileToCalciumParamsIdentityChecked: true,
        exactProtocolIdentityIncludesCalciumParamsAndAllNonCalciumFactors: true,
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
    ).toHaveProperty("size", 4);
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
    ).toHaveProperty("size", 4);

    for (const heartRateBpm of [50, 90] as const) {
      const fixed = runs.get(
        `matched-alpha-fixed-absolute-time-hr-${heartRateBpm}`,
      )!;
      const rrScaled = runs.get(
        `matched-alpha-rr-scaled-tau-hr-${heartRateBpm}`,
      )!;
      const existingControl =
        runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
          {
            dtSec: fixed.calciumDriveParams.cycleLengthSec / 50,
            maximumBeatCount: 1,
          },
          `absolute-time-alpha-fit-hr-${heartRateBpm}`,
        );
      expect(fixed.calciumDriveParams).toEqual(
        existingControl.calciumDriveParams,
      );
      expect(fixed.periodicResult).toEqual(existingControl.periodicResult);
      expect(fixed.exactAssemblyAudit).toEqual(
        existingControl.exactAssemblyAudit,
      );
      expect(rrScaled.referenceNonCalciumAssembly).toBe(
        fixed.referenceNonCalciumAssembly,
      );
      expect(rrScaled.exactAssemblyAudit).toMatchObject({
        mechanicsProviderParameterIdentityHash:
          fixed.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
        circulationRuntimeStableHash:
          fixed.exactAssemblyAudit.circulationRuntimeStableHash,
        bloodVolumeOperatingPointStableHash:
          fixed.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
      });
    }
  }, 120_000);

  it("rejects profiles and option fields outside the fixed bridge", () => {
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "matched-alpha-rr-scaled-tau-hr-75" as never,
      ),
    ).toThrow(/unsupported V10 matched-alpha timing-policy bridge arm/);
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
        {
          dtSec: 0.02,
          maximumBeatCount: 1,
          calciumDriveParams: {},
        } as never,
        "matched-alpha-fixed-absolute-time-hr-50",
      ),
    ).toThrow(/reject unsupported field: calciumDriveParams/);
  });
});
