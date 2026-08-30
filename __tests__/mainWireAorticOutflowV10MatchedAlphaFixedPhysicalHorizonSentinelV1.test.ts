import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaTimingPolicyBridgeV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaTimingPolicyBridgeV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
  runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1,
  runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1,
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

describe("main-wire V10 matched-alpha fixed physical-horizon sentinel V1", () => {
  it("rejects execution options and profiles outside the fixed bridge", () => {
    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1(
        { dtSec: 0.001 } as never,
      ),
    ).toThrow(/accepts only one fixed bridge profile ID and no execution options/);

    const withInjectedOptions =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1 as unknown as (
        profileId: string,
        options: unknown,
      ) => unknown;
    expect(() =>
      withInjectedOptions(
        "matched-alpha-fixed-absolute-time-hr-50",
        { maximumBeatCount: 1 },
      ),
    ).toThrow(/accepts only one fixed bridge profile ID and no execution options/);

    expect(() =>
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1(
        "matched-alpha-rr-scaled-tau-hr-75" as never,
      ),
    ).toThrow(/unsupported V10 matched-alpha timing-policy bridge arm/);
  });

  it("runs all four arms for exactly 48 seconds at 4000 steps per RR", () => {
    const runs =
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_PROFILE_IDS_V1
        .map((profileId) =>
          runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeFixedPhysicalHorizonSentinelResearchV1(
            profileId,
          ));

    for (const run of runs) {
      const profile = run.matchedAlphaTimingPolicyBridgeProfile;
      const expectedBeatCount = profile.heartRateBpm === 50 ? 40 : 72;
      expect(run.configurationRole).toBe(
        "fixed-v10-reference-non-calcium-matched-alpha-timing-policy-bridge-48s-sentinel-arm",
      );
      expect(run.referenceNonCalciumAssembly).toBe(
        MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_TIMING_POLICY_BRIDGE_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
      );
      expect(run.executionPolicy).toEqual({
        policyId: "matched-alpha-fixed-physical-horizon-48s-sentinel-v1",
        fixedPhysicalHorizonSec:
          MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_SEC_V1,
        stepsPerCycle:
          MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
        minimumCompletedBeatCountBeforePeriodicTermination: expectedBeatCount,
        maximumBeatCount: expectedBeatCount,
        periodicTerminationBeforeFixedHorizonAccepted: false,
      });
      expect(run.periodicResult.dtSec).toBe(
        profile.cycleLengthSec
          / MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_FIXED_PHYSICAL_HORIZON_SENTINEL_STEPS_PER_CYCLE_V1,
      );
      expect(run.periodicResult.stepsPerBeat).toBe(4_000);
      expect(run.periodicResult.requestedMaximumBeatCount).toBe(
        expectedBeatCount,
      );
      expect(run.periodicResult.completedBeatCount).toBe(expectedBeatCount);
      expect(
        run.periodicResult.completedBeatCount * profile.cycleLengthSec,
      ).toBe(48);
      expect(
        run.periodicResult.retainedCompleteBeats.at(-1)?.beatIndex,
      ).toBe(expectedBeatCount);
      expect(
        run.periodicResult.retainedCompleteBeats.at(-1)?.endTimeSec,
      ).toBeCloseTo(48, 8);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.failure).toBeNull();
      expect(run.periodicResult.periodicity.status).toBe("period1-converged");
      expect(run.periodicResult.terminationReason).toBe("period1-converged");
      expect(run.periodicResult.periodicSteadyStateClaimed).toBe(true);
      expect(run.periodicResult.terminalCycleBoundaryWarmStart).toBeNull();
      expect(run.claim).toMatchObject({
        publicExecutionOptionsAccepted: false,
        genericParameterPatchAccepted: false,
        fixedMatchedAlphaTimingPolicyBridgeProfileOnly: true,
        fixedPhysicalHorizonSentinelOnly: true,
        fixedPhysicalHorizonSec: 48,
        fixedStepsPerCycle: 4_000,
        minimumAndMaximumBeatCountsEqual: true,
        periodicTerminationBeforeFixedHorizonAccepted: false,
        endpointPeriodicClassificationStillRequiredForP1Claim: true,
        executionHorizonIsExactRunnerPolicyNotPhysiologicalProtocolParameter:
          true,
        fullV10CandidateIdentityRetained: false,
        V10ReferenceNonCalciumAssemblyHeldExactly: true,
        derivedAnalysisStored: false,
        parameterSearchOrFitting: false,
        clinicalValidationClaimed: false,
      });
      expect(Object.prototype.hasOwnProperty.call(run, "comparison")).toBe(
        false,
      );
      expect(Object.prototype.hasOwnProperty.call(run, "metrics")).toBe(false);
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
        runs.map(
          (run) => run.exactAssemblyAudit.circulationRuntimeStableHash,
        ),
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
    ).toHaveProperty("size", 4);
  }, 600_000);

  it("preserves the existing public runner byte anchors", () => {
    const heartRate60 =
      runMainWireNormalAdultFiveWallAorticOutflowV10HeartRateCalciumHypothesisResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "phase-scaled-coppini-hr-60",
      );
    expect(jsonFingerprint(heartRate60)).toEqual({
      bytes: 516_751,
      sha256:
        "6910b8eba3fbf53b7dd8d629294599476137736582a6de097af64824e6983d26",
    });
    expect(jsonFingerprint(heartRate60.periodicResult)).toEqual({
      bytes: 501_324,
      sha256:
        "5091342cc68c67568253c84c296e21033e51d8ae7fa15faa6a4d662e8c4b7393",
    });

    const matchedFixed50 =
      runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaTimingPolicyBridgeResearchV1(
        { dtSec: 1.2 / 50, maximumBeatCount: 1 },
        "matched-alpha-fixed-absolute-time-hr-50",
      );
    expect(jsonFingerprint(matchedFixed50)).toEqual({
      bytes: 493_009,
      sha256:
        "35916c6aa11eed0e15aafb48fc37e5e3cdeb40c18d73e79197b4267cbed5ae1c",
    });
    expect(jsonFingerprint(matchedFixed50.periodicResult)).toEqual({
      bytes: 483_091,
      sha256:
        "a31cdc2113e2194a5056fa0eb90737b00ed071af8b20a8e0414f6d0664dcdfe1",
    });
  });
});
