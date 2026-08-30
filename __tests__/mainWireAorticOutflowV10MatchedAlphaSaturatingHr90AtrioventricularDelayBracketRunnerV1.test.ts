import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayBracketV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const BASE_PROFILE_ID = "matched-alpha-saturating-hr-law-a040-hr-90" as const;

function changedKeys(
  control: Readonly<Record<string, unknown>>,
  candidate: Readonly<Record<string, unknown>>,
): readonly string[] {
  return Array.from(
    new Set([...Object.keys(control), ...Object.keys(candidate)]),
  )
    .filter((key) => control[key] !== candidate[key])
    .sort();
}

describe("main-wire V10 matched-alpha saturating HR90 atrioventricular-delay bracket runner V1", () => {
  it("owns only the fixed 120/110/100 ms profiles and retains every non-delay calcium field", () => {
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
    ).toEqual([
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms",
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms",
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms",
    ]);
    const baseProfile =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
        BASE_PROFILE_ID,
      );
    const baseParams =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        BASE_PROFILE_ID,
      );
    const expectedDelayByProfile = Object.freeze({
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms": 0.12,
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms": 0.11,
      "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-100ms": 0.1,
    } satisfies Readonly<
      Record<
        MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
        0.12 | 0.11 | 0.1
      >
    >);

    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1(
          profileId,
        );
      const control = expectedDelayByProfile[profileId] === 0.12;

      expect(profile).toMatchObject({
        profileId,
        designRole: "fixed-three-point-hr90-av-electrical-onset-delay-bracket",
        heartRateBpm: 90,
        cycleLengthSec: baseProfile.cycleLengthSec,
        dimensionlessRateCoefficient: 0.4,
        atrioventricularDelaySec: expectedDelayByProfile[profileId],
        controlAtrioventricularDelaySec: 0.12,
        controlParamsIdentityReusedExactly: control,
        baseSaturatingHeartRateLawProfileId: BASE_PROFILE_ID,
        baseSaturatingHeartRateLawParamsIdentityRetainedExceptParameterSetIdAndAtrioventricularDelay: true,
        atrialParamsRetainedByIdentity: true,
        ventricularParamsRetainedByIdentity: true,
        fixedDiscreteCandidate: true,
        arbitraryNumericResolverExposed: false,
        surfaceEcgPrIntervalEquivalenceClaimed: false,
        parameterSearchOrFitting: false,
        hemodynamicOutcomeUsedToDeriveProfile: false,
      });
      expect(params.atrioventricularDelaySec).toBe(
        expectedDelayByProfile[profileId],
      );
      expect(params.cycleLengthSec).toBe(baseParams.cycleLengthSec);
      expect(params.atrial).toBe(baseParams.atrial);
      expect(params.ventricular).toBe(baseParams.ventricular);
      expect(changedKeys(baseParams, params)).toEqual(
        control ? [] : ["atrioventricularDelaySec", "parameterSetId"],
      );
      expect(params === baseParams).toBe(control);
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(params)).toBe(true);
    }

    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
    ).toMatchObject({
      heartRateHeldAtBpm: 90,
      rateCoefficientHeldAt: 0.4,
      atrioventricularDelayCandidatesSec: [0.12, 0.11, 0.1],
      controlParamsIdentityReusedExactly: true,
      onlyParameterSetIdAndAtrioventricularDelayEligibleToDifferFromControl: true,
      arbitraryNumericResolverExposed: false,
      surfaceEcgPrIntervalEquivalenceClaimed: false,
      parameterSearchOrFitting: false,
      hemodynamicOutcomeUsedToDeriveCandidates: false,
    });
    expect(
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1
        .evidence.humanRatePrDirection,
    ).toEqual({
      classification: "data-supported-direction-only",
      scope:
        "surface-ECG PR interval diminished as heart rate increased during exercise and isoprenaline infusion in healthy young adults",
      doi: "10.1111/j.1365-2125.1987.tb03043.x",
      limitation:
        "surface-ECG PR interval is not identical to this model's atrial-to-ventricular electrical-onset delay and does not select 100, 110, or 120 ms",
    });
  });

  it("keeps the 120 ms runner control structurally equal to the existing HR90 saturating arm", () => {
    const options = Object.freeze({
      dtSec: 60 / 90 / 50,
      maximumBeatCount: 1,
    });
    const bracket =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
        options,
        "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms",
      );
    const existing =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        options,
        BASE_PROFILE_ID,
      );

    expect(bracket.calciumDriveParams).toBe(existing.calciumDriveParams);
    expect(bracket.periodicResult).toEqual(existing.periodicResult);
    expect(bracket.exactAssemblyAudit).toEqual(existing.exactAssemblyAudit);
    expect(bracket.referenceNonCalciumAssembly).toBe(
      existing.referenceNonCalciumAssembly,
    );
    expect(bracket.claim.controlArmReusesBaseCalciumParamsByIdentity).toBe(
      true,
    );
  });

  it("reaches P1 for all three closed arms and preserves one exact V10 non-calcium assembly", () => {
    const baseParams =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        BASE_PROFILE_ID,
      );
    const runs: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1[] =
      [];

    for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1) {
      const profile =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1(
          profileId,
        );
      const params =
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1(
          profileId,
        );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
          {
            dtSec: profile.cycleLengthSec / 500,
            maximumBeatCount: 72,
          },
          profileId,
        );
      runs.push(run);

      expect(run.configurationRole).toBe(
        "fixed-v10-reference-non-calcium-matched-alpha-saturating-hr90-atrioventricular-delay-bracket-arm",
      );
      expect(run.referenceNonCalciumAssembly).toBe(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
      );
      expect(run.baseSaturatingHeartRateLawProfile).toBe(
        resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
          BASE_PROFILE_ID,
        ),
      );
      expect(run.atrioventricularDelayBracketProfile).toBe(profile);
      expect(run.calciumDriveParams).toBe(params);
      expect(run.calciumDriveParams.atrial).toBe(baseParams.atrial);
      expect(run.calciumDriveParams.ventricular).toBe(baseParams.ventricular);
      expect(run.periodicResult.stepsPerBeat).toBe(500);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.failure).toBeNull();
      expect(run.periodicResult.periodicity.status).toBe("period1-converged");
      expect(run.periodicResult.terminationReason).toBe("period1-converged");
      expect(run.periodicResult.periodicSteadyStateClaimed).toBe(true);
      expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
      expect(run.periodicResult.claim.heartRateBpm).toBe(90);
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
        fixedThreePointAtrioventricularDelayProfileOnly: true,
        arbitraryNumericAtrioventricularDelayInputExposed: false,
        V10ReferenceNonCalciumAssemblyHeldExactly: true,
        heartRateHeldAtBpm: 90,
        matchedAlphaSaturatingRateCoefficientHeldAt: 0.4,
        onlyParameterSetIdAndAtrioventricularDelayEligibleToDifferFromControl: true,
        atrialParamsHeldByIdentity: true,
        ventricularParamsHeldByIdentity: true,
        cycleLengthHeldExactly: true,
        surfaceEcgPrIntervalEquivalenceClaimed: false,
        literatureUsedForDirectionOnly: true,
        parameterSearchOrFitting: false,
        clinicalValidationClaimed: false,
        canonicalAdoptionEstablished: false,
      });
      for (const absentProperty of [
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

    expect(
      new Set(
        runs.map(
          (run) =>
            run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        runs.map((run) => run.exactAssemblyAudit.circulationRuntimeStableHash),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        runs.map(
          (run) => run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        runs.map(
          (run) => run.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
        ),
      ),
    ).toHaveProperty("size", 3);
  }, 120_000);

  it("rejects arbitrary delay profiles and generic parameter patches", () => {
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1(
        "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-105ms" as MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
      ),
    ).toThrow(
      /unsupported matched-alpha saturating HR90 atrioventricular-delay profile/,
    );
    expect(() =>
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1(
        "__proto__" as MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
      ),
    ).toThrow(
      /unsupported matched-alpha saturating HR90 atrioventricular-delay profile/,
    );
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchV1(
        {
          dtSec: 0.01,
          maximumBeatCount: 1,
          atrioventricularDelaySec: 0.105,
        } as never,
        "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-110ms",
      ),
    ).toThrow(/aortic-outflow research options reject unsupported field/);
  });
});
