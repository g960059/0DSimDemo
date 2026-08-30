import { describe, expect, it } from "vitest";

import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE } from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1,
  type MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const CALCIUM_PROFILE_ID =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CALCIUM_PROFILE_ID_V1;
const CONTROL_ARM_ID =
  "rsys-baseline__stressed-volume-baseline" as const;

describe("main-wire V10 matched-alpha saturating HR90 opening-load mechanism runner V1", () => {
  it("owns exactly the closed two-by-two catalog without arbitrary numeric load inputs", () => {
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1,
    ).toEqual([
      "rsys-baseline__stressed-volume-baseline",
      "rsys-baseline__stressed-volume-high",
      "rsys-low__stressed-volume-baseline",
      "rsys-low__stressed-volume-high",
    ]);
    expect(
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1,
    ).toMatchObject({
      calciumProfileId: CALCIUM_PROFILE_ID,
      heartRateHeldAtBpm: 90,
      dimensionlessRateCoefficientHeldAt: 0.4,
      systemicResistanceLevels: ["baseline", "low"],
      systemicResistanceScalesFromBaseline: [1, 0.75],
      stressedVenousVolumeLevels: ["baseline", "high"],
      canonicalAdditionalStressedVenousVolumeScales: [1, 4 / 3],
      circulatoryLoadIdsResolvedThroughAuthoritativeCatalog: true,
      stressedVenousVolumeIdsResolvedThroughAuthoritativeCatalog: true,
      mechanicsValveComplianceAndTrefAssemblyHeldExactly: true,
      calciumAndAtrioventricularTimingHeldExactly: true,
      fixedFourArmFactorialOnly: true,
      arbitraryNumericLoadInputExposed: false,
      parameterSearchOrFitting: false,
      hemodynamicOutcomeUsedToDeriveArms: false,
    });

    for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1) {
      const arm =
        resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
          armId,
        );
      expect(arm.armId).toBe(armId);
      expect(arm.calciumProfileId).toBe(CALCIUM_PROFILE_ID);
      expect(arm.heartRateBpm).toBe(90);
      expect(arm.dimensionlessRateCoefficient).toBe(0.4);
      expect(arm.circulatoryLoadPointId).toBe(
        arm.systemicResistanceLevel === "baseline"
          ? "baseline"
          : "systemic-resistance-low",
      );
      expect(arm.stressedVenousVolumePointId).toBe(
        arm.stressedVenousVolumeLevel === "baseline"
          ? "baseline"
          : "stressed-venous-volume-high",
      );
      expect(Object.isFrozen(arm)).toBe(true);
    }
  });

  it("keeps the baseline-by-baseline control exactly equal to the existing narrow HR90 runner", () => {
    const options = Object.freeze({
      dtSec: 60 / 90 / 50,
      maximumBeatCount: 1,
    });
    const openingLoad =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
        options,
        CONTROL_ARM_ID,
      );
    const existing =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
        options,
        CALCIUM_PROFILE_ID,
      );

    expect(openingLoad.calciumDriveParams).toBe(existing.calciumDriveParams);
    expect(openingLoad.periodicResult).toEqual(existing.periodicResult);
    expect(JSON.stringify(openingLoad.periodicResult)).toBe(
      JSON.stringify(existing.periodicResult),
    );
    expect(openingLoad.exactAssemblyAudit).toEqual(
      existing.exactAssemblyAudit,
    );
    expect(openingLoad.referenceNonCalciumAssembly).toBe(
      existing.referenceNonCalciumAssembly,
    );
  });

  it("reaches P1 in all four arms and isolates only the two catalog load axes", () => {
    const calciumProfile =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
        CALCIUM_PROFILE_ID,
      );
    const calciumParams =
      resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
        CALCIUM_PROFILE_ID,
      );
    const runs: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1[] =
      [];

    for (const armId of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARM_IDS_V1) {
      const arm =
        resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
          armId,
        );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
          {
            dtSec: calciumProfile.cycleLengthSec / 500,
            maximumBeatCount: 72,
          },
          armId,
        );
      runs.push(run);

      expect(run.configurationRole).toBe(
        "fixed-v10-matched-alpha-saturating-hr90-opening-load-mechanism-arm",
      );
      expect(run.openingLoadMechanismArm).toBe(arm);
      expect(run.saturatingHeartRateLawProfile).toBe(calciumProfile);
      expect(run.calciumDriveParams).toBe(calciumParams);
      expect(run.circulatoryLoadPoint.pointId).toBe(
        arm.circulatoryLoadPointId,
      );
      expect(run.stressedVenousVolumePoint.pointId).toBe(
        arm.stressedVenousVolumePointId,
      );
      expect(
        run.periodicResult.protocolIdentity.bloodVolumeOperatingPoint
          .fixedTotalBloodVolumeMl,
      ).toBe(run.stressedVenousVolumePoint.fixedTotalBloodVolumeMl);
      expect(
        run.periodicResult.bloodVolumeOperatingPointAudit
          .resolvedTotalBloodVolumeMl,
      ).toBeCloseTo(run.stressedVenousVolumePoint.fixedTotalBloodVolumeMl, 6);
      expect(
        Math.abs(
          run.periodicResult.bloodVolumeOperatingPointAudit.targetResidualMl,
        ),
      ).toBeLessThanOrEqual(1e-6);
      expect(
        run.circulatoryLoadPoint.systemicResistanceScaleFromBaseline,
      ).toBe(arm.systemicResistanceScaleFromBaseline);
      expect(
        run.stressedVenousVolumePoint
          .canonicalAdditionalSvVcVolumeScale,
      ).toBe(arm.canonicalAdditionalStressedVenousVolumeScale);
      expect(run.circulatoryLoadPoint.pulmonaryResistanceScaleFromBaseline)
        .toBe(1);
      expect(run.circulatoryLoadPoint.arterialStiffnessScaleFromBaseline)
        .toBe(1);
      expect(run.periodicResult.stepsPerBeat).toBe(500);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.failure).toBeNull();
      expect(run.periodicResult.periodicity.status).toBe("period1-converged");
      expect(run.periodicResult.terminationReason).toBe("period1-converged");
      expect(run.periodicResult.periodicSteadyStateClaimed).toBe(true);
      expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
      expect(run.periodicResult.claim.heartRateBpm).toBe(90);
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
      expect(run.claim).toMatchObject({
        exactResearchOptionsLimitedToDtAndMaximumBeatCount: true,
        genericParameterPatchAccepted: false,
        fixedFourArmOpeningLoadFactorialOnly: true,
        arbitraryNumericLoadInputExposed: false,
        V10ReferenceNonLoadAssemblyHeldExactly: true,
        heartRateHeldAtBpm: 90,
        matchedAlphaSaturatingRateCoefficientHeldAt: 0.4,
        calciumAndAtrioventricularTimingHeldExactly: true,
        mechanicsProviderHeldExactly: true,
        valveAndPressureStationAssemblyHeldExactly: true,
        complianceAndTrefAssemblyHeldExactly: true,
        circulatoryLoadResolvedByFixedCatalogId: true,
        stressedVenousVolumeResolvedByFixedCatalogId: true,
        systemicResistanceChanged:
          arm.systemicResistanceLevel !== "baseline",
        stressedVenousVolumeChanged:
          arm.stressedVenousVolumeLevel !== "baseline",
        outcomeTargetedRecalibrationApplied: false,
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
      new Set(runs.map((run) => run.periodicResult.protocolIdentityHash)),
    ).toHaveProperty("size", 4);
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
        runs.map(
          (run) => run.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
        ),
      ),
    ).toHaveProperty("size", 1);
    expect(
      new Set(
        runs.map((run) => run.exactAssemblyAudit.circulationRuntimeStableHash),
      ),
    ).toHaveProperty("size", 2);
    expect(
      new Set(
        runs.map(
          (run) =>
            run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
        ),
      ),
    ).toHaveProperty("size", 2);
    for (const hashKey of [
      "circulationTopologyGraphStableHash",
      "commonPericardiumStableHash",
      "periodicPolicyStableHash",
    ] as const) {
      expect(
        new Set(
          runs.map((run) => run.periodicResult.protocolComponentHashes[hashKey]),
        ),
      ).toHaveProperty("size", 1);
    }
    const fixedTotalBloodVolumeByLevel = Object.freeze({
      baseline: runs.find(
        (run) =>
          run.openingLoadMechanismArm.stressedVenousVolumeLevel === "baseline",
      )!.stressedVenousVolumePoint.fixedTotalBloodVolumeMl,
      high: runs.find(
        (run) =>
          run.openingLoadMechanismArm.stressedVenousVolumeLevel === "high",
      )!.stressedVenousVolumePoint.fixedTotalBloodVolumeMl,
    });
    expect(fixedTotalBloodVolumeByLevel.high).toBeGreaterThan(
      fixedTotalBloodVolumeByLevel.baseline,
    );
    for (const systemicResistanceLevel of ["baseline", "low"] as const) {
      expect(
        new Set(
          runs
            .filter(
              (run) =>
                run.openingLoadMechanismArm.systemicResistanceLevel ===
                  systemicResistanceLevel,
            )
            .map(
              (run) => run.exactAssemblyAudit.circulationRuntimeStableHash,
            ),
        ),
      ).toHaveProperty("size", 1);
    }
    for (const stressedVenousVolumeLevel of ["baseline", "high"] as const) {
      expect(
        new Set(
          runs
            .filter(
              (run) =>
                run.openingLoadMechanismArm.stressedVenousVolumeLevel ===
                  stressedVenousVolumeLevel,
            )
            .map(
              (run) =>
                run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash,
            ),
        ),
      ).toHaveProperty("size", 1);
    }
  }, 180_000);

  it("rejects non-catalog arms and generic load patches", () => {
    expect(() =>
      resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
        "rsys-low__stressed-volume-low" as MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1,
      ),
    ).toThrow(/unsupported V10 matched-alpha saturating HR90 opening-load mechanism arm/);
    expect(() =>
      resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
        "__proto__" as MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmIdV1,
      ),
    ).toThrow(/unsupported V10 matched-alpha saturating HR90 opening-load mechanism arm/);
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
        {
          dtSec: 0.01,
          maximumBeatCount: 1,
          systemicResistanceScaleFromBaseline: 0.9,
        } as never,
        CONTROL_ARM_ID,
      ),
    ).toThrow(/aortic-outflow research options reject unsupported field/);
  });
});
