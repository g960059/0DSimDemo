import { describe, expect, it } from "vitest";

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall periodic steady runner V1", () => {
  it("runs one canonical coarse beat without overstating periodic closure", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "canonical",
    });

    expect(result.terminationReason).toBe("maximum-beats-reached");
    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.periodicSteadyStateClaimed).toBe(false);
    expect(result.period2OrbitSuspected).toBe(false);
    expect(result.periodicity.status).toBe("not-converged");
    expect(result.completedBeatCount).toBe(1);
    expect(result.beatClosure).toHaveLength(1);
    expect(result.beatClosure[0]!.period1).not.toBeNull();
    expect(result.beatClosure[0]!.period2).toBeNull();
    expect(result.beatClosure[0]!.period1!.elapsedTimeSec).toBeCloseTo(1, 12);
    expect(result.retainedCompleteBeats).toHaveLength(1);
    expect(result.retainedCompleteBeats[0]!.beatIndex).toBe(1);
    expect(result.retainedCompleteBeats[0]!.samples).toHaveLength(100);
    expect(result.retainedCompleteBeats[0]!.samples[0]!.diagnosticSampleId)
      .toBe("main-wire-normal-adult-five-wall-diagnostic-sample-v2");
    expect(result.retainedPartialBeat).toHaveLength(0);
    expect(result.initializationAudit.totalBloodVolumeDifferenceMl).toBe(0);
    expect(result.initializationAudit.transferredVolumeMl).toBe(0);
    expect(result.claim.ordinaryBeatIterationOnly).toBe(true);
    expect(result.claim.shootingOrAndersonAccelerationApplied).toBe(false);
    expect(result.claim.parameterSearch).toBe(false);
    expect(result.policy.retainedCompleteBeatCount).toBe(3);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .period1NormalizedTolerance).toBe(1e-3);
    expect(result.protocolIdentity.mechanicsProvider).toMatchObject({
      providerId: "main-wire-five-wall-land-triseg-provider-v1",
      parameterSetId: expect.stringContaining("canonical"),
      stateSchemaVersion: 2,
    });
    expect(result.protocolIdentity.mechanicsProvider.parameterIdentityHash)
      .toMatch(/^[0-9a-f]{8}$/);
    expect(result.protocolIdentity.calciumDrive).toMatchObject({
      driveId: "five-wall-normal-prescribed-calcium-drive-v1",
      parameterSetId: "five-wall-normal-calcium-component-timing-prior-v1",
    });
    expect(result.calciumDrivePriorVariant)
      .toBe("land-atrial-twitch-output");
    expect(result.calciumDriveFixedParams.parameterSetId)
      .toBe(result.protocolIdentity.calciumDrive.parameterSetId);
    expect(result.bloodVolumePriorVariant).toBe("cold-seed-control");
    expect(result.bloodVolumePriorAudit.resolvedTotalBloodVolumeMl)
      .toBeCloseTo(4589.457569593876, 9);
    expect(result.protocolIdentity.operatingPoint.bloodVolumePriorSnapshot.variant)
      .toBe("cold-seed-control");
    expect(result.protocolIdentity.circulation.topologyGraphSnapshot.nodes)
      .toHaveLength(15);
    expect(result.protocolIdentity.circulation.topologyGraphSnapshot.edges)
      .toHaveLength(15);
    expect(result.protocolIdentity.periodicPolicy.policyId)
      .toBe("fixed-groupwise-periodic-policy-v1");
    expect(Object.values(result.protocolComponentHashes))
      .toHaveLength(7);
    expect(Object.values(result.protocolComponentHashes)
      .every((hash) => /^[0-9a-f]{8}$/.test(hash))).toBe(true);
    expect(result.protocolIdentity.calciumDrive.fixedParamsStableHash)
      .toBe(result.protocolComponentHashes.calciumDriveFixedParamsStableHash);
    expect(result.protocolIdentity.circulation.topologyGraphStableHash)
      .toBe(result.protocolComponentHashes.circulationTopologyGraphStableHash);
    expect(result.protocolIdentity.circulation.runtimeStableHash)
      .toBe(result.protocolComponentHashes.circulationRuntimeStableHash);
    expect(result.protocolIdentity.circulation.configurationSnapshotStableHash)
      .toBe(result.protocolComponentHashes
        .circulationConfigurationSnapshotStableHash);
    expect(
      result.protocolIdentity.operatingPoint.bloodVolumePriorSnapshotStableHash,
    ).toBe(result.protocolComponentHashes.bloodVolumePriorStableHash);
    expect(stableHash(sanitizeForStableHash(
      result.protocolIdentity.circulation.configurationSnapshot,
    ))).toBe(result.protocolIdentity.circulation.configurationSnapshotStableHash);
    expect(stableHash(sanitizeForStableHash(
      result.protocolIdentity.circulation.configurationSnapshot
        .effective.topology,
    ))).toBe(result.protocolComponentHashes.circulationTopologyGraphStableHash);
    expect(stableHash(sanitizeForStableHash(
      result.protocolIdentity.circulation.configurationSnapshot
        .effective.runtime,
    ))).toBe(result.protocolComponentHashes.circulationRuntimeStableHash);
    expect(result.protocolComponentHashes.circulationTopologyGraphStableHash)
      .toBe("27a8ce3f");
    expect(result.protocolComponentHashes.circulationRuntimeStableHash)
      .toBe("6a2d35d3");
    expect(stableHash(sanitizeForStableHash(
      result.retainedCompleteBeats[0]!.samples,
    ))).toBe("58a24381");
    expect(result.protocolIdentity.periodicPolicy.policyStableHash)
      .toBe(result.protocolComponentHashes.periodicPolicyStableHash);
    expect(result.protocolIdentityHash).toBe(stableHash(sanitizeForStableHash(
      result.protocolIdentity,
    )));
  }, 60_000);

  it("changes only the calcium protocol component for the fixed biomarker challenger", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
    });
    const challenger = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      calciumDrivePriorVariant: "human-atrial-calcium-biomarker",
    });

    expect(challenger.integrationCompletedWithoutFailure).toBe(true);
    expect(challenger.calciumDrivePriorVariant)
      .toBe("human-atrial-calcium-biomarker");
    expect(challenger.protocolIdentity.calciumDrive.parameterSetId)
      .toBe("five-wall-normal-human-atrial-calcium-biomarker-prior-v1");
    expect(challenger.protocolComponentHashes.calciumDriveFixedParamsStableHash)
      .not.toBe(canonical.protocolComponentHashes.calciumDriveFixedParamsStableHash);
    expect(challenger.protocolIdentityHash).not.toBe(canonical.protocolIdentityHash);
    expect(challenger.protocolComponentHashes).toEqual({
      ...canonical.protocolComponentHashes,
      calciumDriveFixedParamsStableHash:
        challenger.protocolComponentHashes.calciumDriveFixedParamsStableHash,
    });
    expect(challenger.claim.calciumDriveSelectionIsFixedRegistryVariant)
      .toBe(true);
    expect(challenger.claim.calciumDriveParameterSearch).toBe(false);
  }, 90_000);

  it("changes only the fixed blood-volume operating-point component for the challenger", () => {
    const control = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
    });
    const challenger = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      bloodVolumePriorVariant:
        "official-target-minus-excluded-coronary-cold-seed",
    });

    expect(challenger.integrationCompletedWithoutFailure).toBe(true);
    expect(challenger.bloodVolumePriorAudit.targetTotalBloodVolumeMl)
      .toBeCloseTo(5522.11, 8);
    expect(challenger.initializationAudit.canonicalTotalBloodVolumeMl)
      .toBeCloseTo(5522.11, 8);
    expect(challenger.protocolComponentHashes.bloodVolumePriorStableHash)
      .not.toBe(control.protocolComponentHashes.bloodVolumePriorStableHash);
    expect(challenger.protocolComponentHashes).toEqual({
      ...control.protocolComponentHashes,
      bloodVolumePriorStableHash:
        challenger.protocolComponentHashes.bloodVolumePriorStableHash,
    });
    expect(challenger.claim.bloodVolumePriorSelectionIsFixedRegistryVariant)
      .toBe(true);
    expect(challenger.claim.bloodVolumePriorParameterSearch).toBe(false);
  }, 90_000);

  it("keeps the fixed PVen-to-PVein basin audit exactly TBV-neutral", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "pven-to-pvein-10ml",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.initializationAudit).toMatchObject({
      totalBloodVolumeDifferenceMl: 0,
      chamberVolumesChanged: false,
      dynamicEdgeFlowsChanged: false,
      valveOpeningStatesChanged: false,
      mechanicsColdInputChanged: false,
      mechanicsColdStateFingerprintChanged: false,
      transferredVolumeMl: 10,
      sourceNode: "PVen",
      destinationNode: "PVein",
      pulmonaryNodeVolumeDeltaMl: {
        PVen: -10,
        PVein: 10,
      },
    });
    expect(result.claim.initializationVariantChangesRuntimeOrMaterialParameters)
      .toBe(false);
    expect(result.claim.pulmonaryRedistributionIsInitialConditionBasinAuditOnly)
      .toBe(true);
    expect(result.claim.samePeriodicOrbitAcrossInitializationsClaimed).toBe(false);
    expect(result.periodicSteadyStateClaimed).toBe(false);
    expect(result.protocolIdentityHash).toMatch(/^[0-9a-f]{8}$/);
  }, 60_000);

  it("rejects a non-integral HR60 beat grid before running the model", () => {
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.003,
      maximumBeatCount: 1,
    })).toThrow("dtSec must divide the fixed HR60 one-second cycle exactly");
  });

  it("rejects calcium waveforms outside the fixed registry", () => {
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      calciumDrivePriorVariant: "pv-shape-fit" as never,
    })).toThrow(/unsupported five-wall calcium drive prior variant/);
  });

  it("rejects blood-volume operating points outside the fixed registry", () => {
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.01,
      maximumBeatCount: 1,
      bloodVolumePriorVariant: "shape-fit" as never,
    })).toThrow(/unsupported blood-volume prior variant/);
  });
});
