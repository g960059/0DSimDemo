import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

function jsonFingerprint(value: unknown): Readonly<{
  bytes: number;
  sha256: string;
}> {
  const serialized = JSON.stringify(value);
  return Object.freeze({
    bytes: Buffer.byteLength(serialized),
    sha256: createHash("sha256").update(serialized).digest("hex"),
  });
}

describe("main-wire V10 matched-alpha saturating heart-rate law runner V1", () => {
  it("runs only the fixed eight profiles on one exact V10 non-calcium assembly", () => {
    const runs = new Map<
      MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileIdV1,
      MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchRunV1
    >();

    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
          profileId,
        );
      const arm =
        resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawArmV1(
          profileId,
        );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
          {
            dtSec: profile.cycleLengthSec / 50,
            maximumBeatCount: 1,
          },
          profileId,
        );
      runs.set(profileId, run);

      expect(run.configurationRole).toBe(
        "fixed-v10-reference-non-calcium-matched-alpha-saturating-heart-rate-law-arm",
      );
      expect(run.referenceNonCalciumAssembly).toBe(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
      );
      expect(run.saturatingHeartRateLawProfile).toBe(profile);
      expect(run.calciumDriveParams).toBe(params);
      expect(arm).toMatchObject({
        armId: profileId,
        calciumProfileId: profileId,
        designRole: profile.designRole,
        heartRateBpm: profile.heartRateBpm,
        dimensionlessRateCoefficient: profile.dimensionlessRateCoefficient,
      });
      expect(run.activeDesign).toEqual(
        profile.designRole === "main-four-heart-rate-design"
          ? {
              designRole: "main-four-heart-rate-design",
              experimentRole: "primary-fixed-heart-rate-trend-test",
              mainDesign: true,
              priorSensitivityDesign: false,
            }
          : {
              designRole: "endpoint-prior-sensitivity",
              experimentRole:
                "fixed-prior-endpoint-sensitivity-not-an-optimizer",
              mainDesign: false,
              priorSensitivityDesign: true,
            },
      );

      expect(run.periodicResult.claim.heartRateBpm).toBe(profile.heartRateBpm);
      expect(run.periodicResult.stepsPerBeat).toBe(50);
      expect(run.periodicResult.completedBeatCount).toBe(1);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.failure).toBeNull();
      expect(run.periodicResult.terminalCycleBoundaryWarmStart === null).toBe(
        profile.heartRateBpm !== 60,
      );
      expect(
        run.periodicResult.protocolIdentity.calciumDrive.parameterSetId,
      ).toBe(params.parameterSetId);
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
        independentCanonicalColdStart: true,
        warmStartApplied: false,
        exactResearchOptionsLimitedToDtAndMaximumBeatCount: true,
        genericParameterPatchAccepted: false,
        fixedSaturatingHeartRateLawProfileOnly: true,
        arbitraryNumericHeartRateOrCoefficientInputExposed: false,
        mainAndPriorSensitivityDesignsRemainDistinct: true,
        activeDesignMembershipCheckedAgainstCatalog: true,
        catalogArmExecutionDefaultsReturnedAsApplied: false,
        fullV10CandidateIdentityRetained: false,
        V10ReferenceNonCalciumAssemblyHeldExactly: true,
        V10CalciumAndAtrioventricularTimingIdentityHeldFixed: false,
        matchedAlphaWaveformFamilyHeldExactly: true,
        onlyVentricularRiseAndDecayTimeConstantsEligibleToDifferFromFixedHeartRateControl: true,
        hr60MainArmReusesAbsoluteTimeAlphaFitControlParamsExactly: true,
        systemicOrBloodVolumeRecalibrationApplied: false,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        nonHr60V3WarmStartEmissionSuppressed: true,
        nonHr60V3WarmStartRestoreRejected: true,
        profileToCalciumParamsIdentityChecked: true,
        derivedAnalysisStored: false,
        parameterSearchOrFitting: false,
        clinicalValidationClaimed: false,
        canonicalAdoptionEstablished: false,
      });
      for (const absentProperty of [
        "sourceTraceProfile",
        "atrioventricularDelayProfile",
        "state",
        "checkpoint",
        "comparison",
        "metrics",
      ]) {
        expect(Object.prototype.hasOwnProperty.call(run, absentProperty)).toBe(
          false,
        );
      }
    }

    const allRuns = [...runs.values()];
    expect(allRuns.filter((run) => run.activeDesign.mainDesign)).toHaveLength(
      4,
    );
    expect(
      allRuns.filter((run) => run.activeDesign.priorSensitivityDesign),
    ).toHaveLength(4);
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
  }, 120_000);

  it("is exactly anchored to the existing HR60 absolute-time-alpha H2 arm", () => {
    const options = Object.freeze({ dtSec: 0.02, maximumBeatCount: 1 });
    const saturating =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        options,
        "matched-alpha-saturating-hr-law-a040-hr-60",
      );
    const existingH2 =
      runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
        options,
        "absolute-time-alpha-fit-hr-60",
      );

    expect(saturating.calciumDriveParams).toBe(existingH2.calciumDriveParams);
    expect(saturating.periodicResult).toEqual(existingH2.periodicResult);
    expect(saturating.exactAssemblyAudit).toEqual(
      existingH2.exactAssemblyAudit,
    );
    expect(saturating.referenceNonCalciumAssembly).toBe(
      existingH2.referenceNonCalciumAssembly,
    );
    expect(jsonFingerprint(existingH2)).toEqual({
      bytes: 511_691,
      sha256:
        "443918f595730353be5ce1a4a0ca5848a32c61809d122e6e51d90d3e25d85515",
    });
    expect(jsonFingerprint(existingH2.periodicResult)).toEqual({
      bytes: 502_361,
      sha256:
        "619cf55be3e4d5da10179ff3a1c4c1013175d05c21450d35b5ac3313b7e64638",
    });
  });

  it("rejects profiles and option fields outside the closed experiment", () => {
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "matched-alpha-saturating-hr-law-a040-hr-55" as never,
      ),
    ).toThrow(/unsupported V10 matched-alpha saturating heart-rate law arm/);
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        {
          dtSec: 0.02,
          maximumBeatCount: 1,
          calciumDriveParams: {},
        } as never,
        "matched-alpha-saturating-hr-law-a040-hr-60",
      ),
    ).toThrow(/aortic-outflow research options reject unsupported field/);
  });
});
