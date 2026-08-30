import { describe, expect, it } from "vitest";

import {
  measureMainWireAorticOutflowV10CombinedLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10CombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateCombinedLoadEnvelopeV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire V10 combined-load envelope V1", () => {
  it("preserves exact local-port and energy ownership at all 16 corners", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_COMBINED_LOAD_CONTEXTS_V1
        .map((context) => Object.freeze({
          contextId: context.contextId,
          run:
            runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              CANDIDATE.kuwProfileId,
              context.complianceProfileId,
              CANDIDATE.characteristicResistancePlacementProfileId,
              CANDIDATE.rootInertanceProfileId,
              CANDIDATE.sarcomereReferenceProfileId,
              CANDIDATE.calciumSensitivityLengthProfileId,
              CANDIDATE.twitchRetentionCandidateId,
              context.circulatoryLoadPointId,
              context.stressedVenousVolumePointId,
              context.trefForceLoadProfileId,
              CANDIDATE.sourceVelocityDistortionProfileId,
              CANDIDATE.strongBridgeDeactivationExitProfileId,
              CANDIDATE.atrioventricularDelayProfileId,
              CANDIDATE.pressureRecoveryProfileId,
              CANDIDATE.recoveredRootPortValveProfileId,
            ),
        }));
    const envelope =
      measureMainWireAorticOutflowV10CombinedLoadEnvelopeV1(inputs);

    expect(envelope.stationArms).toHaveLength(16);
    expect(envelope.baseEnvelope.factorialTerms).toHaveLength(15);
    expect(envelope.baseEnvelope.allProtocolIdentitiesDistinct).toBe(true);
    expect(envelope.baseEnvelope.arms.every((arm) =>
      arm.cycle.integrationCompletedWithoutFailure)).toBe(true);
    expect(envelope.allOwnedOpeningTargetsWithinTolerance).toBe(true);
    expect(envelope.allSourceResistanceReadbacksWithinTolerance).toBe(true);
    expect(envelope.allExactPowerBalancesWithinTolerance).toBe(true);
    expect(envelope.allValveDissipationLedgersWithinTolerance).toBe(true);
    expect(envelope.allStationReconstructionResidualsWithinTolerance)
      .toBe(true);
    expect(envelope.stationRanges.meanLocalPortGradientMmHg.minimum)
      .toBeGreaterThan(0);
    expect(envelope.stationRanges.meanRawNodeGradientMmHg.minimum)
      .toBeGreaterThan(
        envelope.stationRanges.meanLocalPortGradientMmHg.minimum,
      );
    expect(envelope.experimentClaim).toMatchObject({
      fullFactorialCornerCount: 16,
      pressureRecoveryAndLocalPortOwnershipHeldAtV10: true,
      newContinuousStateAdded: false,
    });
  }, 60_000);
});
