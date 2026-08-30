import { describe, expect, it } from "vitest";

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticValveResearchProfileV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
import {
  compareMainWireAorticValveAblationV1,
  type MainWireAorticValveAblationArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveAblationComparisonV1";

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
    expect(result.terminalCycleBoundaryWarmStart).not.toBeNull();
    expect(result.terminalCycleBoundaryWarmStart?.checkpoint.acceptedTimeSec)
      .toBeCloseTo(1, 12);
    expect(result.initializationAudit.totalBloodVolumeDifferenceMl).toBe(0);
    expect(result.initializationAudit.transferredVolumeMl).toBe(0);
    expect(result.claim.ordinaryBeatIterationOnly).toBe(true);
    expect(result.claim.heartRateBpm).toBe(60);
    expect(result.claim.shootingOrAndersonAccelerationApplied).toBe(false);
    expect(result.claim.parameterSearch).toBe(false);
    expect(result.claim.pericardialConstraintInterfaceIncluded).toBe(true);
    expect(result.claim.pericardialConstraintEnabled).toBe(true);
    expect(result.pericardiumMode).toBe("on");
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
    expect(result.protocolIdentity.circulation.topologyGraphSnapshot.nodes)
      .toHaveLength(15);
    expect(result.protocolIdentity.circulation.topologyGraphSnapshot.edges)
      .toHaveLength(15);
    expect(result.protocolIdentity.bloodVolumeOperatingPoint).toEqual({
      ownerId: "main-wire-normal-adult-blood-volume-operating-point-v1",
      parameterSetId:
        "main-wire-normal-adult-noncoronary-fixed-tbv-5522p11ml-v1",
      topologyScopeId: "main-wire-noncoronary-15-node-no-coronary-v1",
      fixedTotalBloodVolumeMl: 5522.11,
      initialDistributionPolicyId: "shared-SV-VC-transmural-offset",
    });
    expect(result.initializationAudit.canonicalTotalBloodVolumeMl)
      .toBeCloseTo(5522.11, 8);
    expect(result.bloodVolumeOperatingPointAudit).toMatchObject({
      coldSeedTotalBloodVolumeMl: expect.closeTo(4589.457569593876, 9),
      resolvedTotalBloodVolumeMl: expect.closeTo(5522.11, 8),
      addedBloodVolumeMl: expect.closeTo(
        5522.11 - 4589.457569593876,
        8,
      ),
      sharedTransmuralPressureOffsetMmHg: expect.closeTo(6.051930745, 8),
      changedNodes: ["SV", "VC"],
      unchangedNodeMaximumAbsoluteDeltaMl: 0,
      excludedCoronaryColdSeedVolumeMl: 77.89,
    });
    expect(Object.keys(result.protocolIdentity))
      .not.toContain("bloodVolumeOperatingPointAudit");
    expect(Object.keys(result.protocolIdentity.bloodVolumeOperatingPoint))
      .toEqual([
        "ownerId",
        "parameterSetId",
        "topologyScopeId",
        "fixedTotalBloodVolumeMl",
        "initialDistributionPolicyId",
      ]);
    expect(result.protocolIdentity.periodicPolicy.policyId)
      .toBe("fixed-groupwise-periodic-policy-v1");
    expect(result.protocolIdentity.commonPericardium).toMatchObject({
      bindingId: "main-wire-common-pericardium-binding-v1",
      mode: "on",
    });
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
    expect(result.protocolIdentity.circulation.valveResearchInputSnapshot)
      .toEqual(result.valveResearchInput);
    expect(result.protocolIdentity.circulation.valveResearchInputStableHash)
      .toMatch(/^[0-9a-f]{8}$/);
    expect(result.protocolComponentHashes.bloodVolumeOperatingPointStableHash)
      .toBe(stableHash(sanitizeForStableHash(
        result.protocolIdentity.bloodVolumeOperatingPoint,
      )));
    expect(result.protocolIdentity.commonPericardium.stableHash)
      .toBe(result.protocolComponentHashes.commonPericardiumStableHash);
    expect(result.protocolIdentity.periodicPolicy.policyStableHash)
      .toBe(result.protocolComponentHashes.periodicPolicyStableHash);
    expect(result.protocolIdentityHash).toBe(stableHash(sanitizeForStableHash(
      result.protocolIdentity,
    )));
  }, 60_000);

  it("runs every fixed AoV research profile with a distinct exact runtime identity", () => {
    const baseline = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
    });
    const inputs: MainWireAorticValveAblationArmInputV1[] = [{
      armId: "canonical",
      periodicResult: baseline,
    }];
    for (const profileId of MAIN_WIRE_AORTIC_VALVE_RESEARCH_PROFILE_IDS_V1) {
      const run = runMainWireNormalAdultFiveWallAorticValveResearchProfileV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        profileId,
      );
      expect(run.configurationRole)
        .toBe("fixed-aortic-valve-research-profile");
      expect(run.profile.profileId).toBe(profileId);
      expect(run.claim.genericParameterPatchAccepted).toBe(false);
      expect(run.periodicResult.integrationCompletedWithoutFailure).toBe(true);
      expect(run.periodicResult.protocolComponentHashes.circulationRuntimeStableHash)
        .not.toBe(
          baseline.protocolComponentHashes.circulationRuntimeStableHash,
        );
      expect(run.periodicResult.protocolIdentityHash)
        .not.toBe(baseline.protocolIdentityHash);
      inputs.push({ armId: profileId, periodicResult: run.periodicResult });
    }
    const comparison = compareMainWireAorticValveAblationV1(inputs);
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.claim.gradientKindsAreNotInterchangeable).toBe(true);
    for (const arm of comparison.arms) {
      expect(arm.sampleCount).toBe(50);
      expect(arm.aorticMaximumFlowMlPerSec).toBeGreaterThan(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeGreaterThanOrEqual(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeLessThanOrEqual(1);
      expect(Number.isFinite(arm.peakVenaContractaGradientMmHg)).toBe(true);
    }
  }, 60_000);

  it("rebases a compatible cycle-boundary warm start and permits pericardium-only continuation", () => {
    const source = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      pericardiumMode: "on",
    });
    const warmStart = source.terminalCycleBoundaryWarmStart;
    if (warmStart === null) throw new Error("source run did not emit warm start");
    const onReplay = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      pericardiumMode: "on",
      warmStart,
    });
    const continued = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      pericardiumMode: "exact-off",
      warmStart,
    });

    expect(continued.integrationCompletedWithoutFailure).toBe(true);
    expect(continued.initialization).toBe("cycle-boundary-warm-start");
    expect(continued.pericardiumMode).toBe("exact-off");
    expect(continued.initializationAudit.totalBloodVolumeDifferenceMl)
      .toBeCloseTo(0, 9);
    expect(continued.initializationAudit.warmStartSourceProtocolIdentityHash)
      .toBe(source.protocolIdentityHash);
    expect(continued.initializationAudit.warmStartTargetProtocolIdentityHash)
      .toBe(continued.protocolIdentityHash);
    expect(continued.initializationAudit.warmStartProtocolDifference)
      .toBe("common-pericardium-only");
    expect(continued.retainedCompleteBeats[0]!.startTimeSec).toBe(0);
    expect(continued.retainedCompleteBeats[0]!.endTimeSec).toBeCloseTo(1, 12);
    expect(continued.terminalCycleBoundaryWarmStart?.sourcePericardiumMode)
      .toBe("exact-off");
    expect(warmStart.schemaVersion).toBe(3);
    expect(warmStart.envelopeFingerprint).toMatch(/^[0-9a-f]{8}$/);

    expect(continued.terminalCycleBoundaryWarmStart?.checkpoint)
      .toEqual(onReplay.terminalCycleBoundaryWarmStart?.checkpoint);
    const withoutPericardium = (
      result: typeof continued,
    ) => result.retainedCompleteBeats.map((beat) => beat.samples.map(
      ({ commonPericardium: _commonPericardium, ...sample }) => sample,
    ));
    expect(withoutPericardium(continued)).toEqual(withoutPericardium(onReplay));
    const pericardiumNumericalProjection = (
      result: typeof continued,
    ) => result.retainedCompleteBeats.map((beat) => beat.samples.map(
      ({ commonPericardium }) => {
        const { smoothingBranch: _smoothingBranch, ...numerical } =
          commonPericardium;
        return numerical;
      },
    ));
    expect(pericardiumNumericalProjection(continued))
      .toEqual(pericardiumNumericalProjection(onReplay));
    expect(onReplay.retainedCompleteBeats.flatMap((beat) => beat.samples)
      .every((sample) => sample.commonPericardium.smoothingBranch === "zero"))
      .toBe(true);
    expect(continued.retainedCompleteBeats.flatMap((beat) => beat.samples)
      .every((sample) => sample.commonPericardium.smoothingBranch === "off"))
      .toBe(true);

    const effusion = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      pericardiumCase: "effusion-300ml-positive-control",
      warmStart,
    });
    expect(effusion.integrationCompletedWithoutFailure).toBe(true);
    expect(effusion.pericardiumCase)
      .toBe("effusion-300ml-positive-control");
    expect(effusion.initializationAudit.warmStartProtocolDifference)
      .toBe("common-pericardium-only");
    expect(effusion.retainedCompleteBeats[0]!.samples.some((sample) =>
      sample.commonPericardium.elasticConstraintEngaged)).toBe(true);
    expect(effusion.retainedCompleteBeats[0]!.samples.every((sample) =>
      Math.abs(sample.commonPericardium.prescribedFluidVolumeMl - 300)
        < 1e-9)).toBe(true);
    expect(effusion.retainedCompleteBeats[0]!.samples.some((sample) =>
      sample.commonPericardium.excessPressureMmHg > 0)).toBe(true);

    const incompatible = Object.freeze({
      ...warmStart,
      sourceComponentHashes: Object.freeze({
        ...warmStart.sourceComponentHashes,
        mechanicsProviderMetadataStableHash: "00000000",
      }),
    });
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: incompatible,
    })).toThrow("warm-start envelope fingerprint mismatch");

    const resignWarmStart = (
      candidate: Omit<typeof warmStart, "envelopeFingerprint">,
    ) => Object.freeze({
      ...candidate,
      envelopeFingerprint: stableHash(sanitizeForStableHash(candidate)),
    });
    const {
      envelopeFingerprint: _oldSchemaFingerprint,
      ...schema3Unsigned
    } = warmStart;
    const schema2Unsigned = { ...schema3Unsigned, schemaVersion: 2 };
    const schema2WarmStart = Object.freeze({
      ...schema2Unsigned,
      envelopeFingerprint: stableHash(sanitizeForStableHash(schema2Unsigned)),
    }) as unknown as typeof warmStart;
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: schema2WarmStart,
    })).toThrow("unsupported five-wall cycle warm start");

    const ownerDriftMl = 5e-10;
    const ownerDriftState = {
      ...warmStart.checkpoint.circulation.state,
      totalBloodVolumeMl:
        warmStart.checkpoint.circulation.state.totalBloodVolumeMl
        + ownerDriftMl,
      nodeVolumesMl: {
        ...warmStart.checkpoint.circulation.state.nodeVolumesMl,
        SV: warmStart.checkpoint.circulation.state.nodeVolumesMl.SV
          + ownerDriftMl,
      },
    };
    const ownerDriftCirculation = {
      checkpointId: warmStart.checkpoint.circulation.checkpointId,
      schemaVersion: warmStart.checkpoint.circulation.schemaVersion,
      state: ownerDriftState,
      stateFingerprint: stableHash(ownerDriftState),
    };
    const ownerDriftCheckpointUnsigned = {
      checkpointId: warmStart.checkpoint.checkpointId,
      schemaVersion: warmStart.checkpoint.schemaVersion,
      transactionId: warmStart.checkpoint.transactionId,
      revision: warmStart.checkpoint.revision,
      acceptedTimeSec: warmStart.checkpoint.acceptedTimeSec,
      circulation: ownerDriftCirculation,
      mechanics: warmStart.checkpoint.mechanics,
    };
    const ownerDriftCheckpoint = {
      ...ownerDriftCheckpointUnsigned,
      checkpointFingerprint: stableHash(ownerDriftCheckpointUnsigned),
    };
    const {
      envelopeFingerprint: _oldOwnerDriftFingerprint,
      ...ownerDriftWarmUnsigned
    } = warmStart;
    const ownerDriftEnvelopeUnsigned = {
      ...ownerDriftWarmUnsigned,
      checkpoint: ownerDriftCheckpoint,
    };
    const ownerDriftWarmStart = Object.freeze({
      ...ownerDriftEnvelopeUnsigned,
      envelopeFingerprint: stableHash(sanitizeForStableHash(
        ownerDriftEnvelopeUnsigned,
      )),
    }) as typeof warmStart;
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: ownerDriftWarmStart,
    })).toThrow(
      "warm-start checkpoint TBV owner does not match protocol identity",
    );

    const differentOwner = Object.freeze({
      ...warmStart.sourceProtocolIdentity.bloodVolumeOperatingPoint,
      fixedTotalBloodVolumeMl:
        warmStart.sourceProtocolIdentity.bloodVolumeOperatingPoint
          .fixedTotalBloodVolumeMl + 1,
    });
    const differentOwnerIdentity = Object.freeze({
      ...warmStart.sourceProtocolIdentity,
      bloodVolumeOperatingPoint: differentOwner,
    });
    const differentOwnerBase = {
      ...warmStart,
      sourceProtocolIdentity: differentOwnerIdentity,
      sourceProtocolIdentityHash: stableHash(sanitizeForStableHash(
        differentOwnerIdentity,
      )),
      sourceComponentHashes: Object.freeze({
        ...warmStart.sourceComponentHashes,
        bloodVolumeOperatingPointStableHash:
          stableHash(sanitizeForStableHash(differentOwner)),
      }),
    };
    const {
      envelopeFingerprint: _oldDifferentOwnerFingerprint,
      ...differentOwnerUnsigned
    } = differentOwnerBase;
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: resignWarmStart(differentOwnerUnsigned),
    })).toThrow(
      "warm-start component mismatch: bloodVolumeOperatingPointStableHash",
    );

    const inconsistentPericardiumIdentity = Object.freeze({
      ...warmStart.sourceProtocolIdentity,
      commonPericardium: Object.freeze({
        ...warmStart.sourceProtocolIdentity.commonPericardium,
        parameterSetId: "tampered-outer-parameter-set",
      }),
    });
    const inconsistentPericardiumBase = {
      ...warmStart,
      sourceProtocolIdentity: inconsistentPericardiumIdentity,
      sourceProtocolIdentityHash: stableHash(sanitizeForStableHash(
        inconsistentPericardiumIdentity,
      )),
      sourcePericardiumParameterSetId: "tampered-outer-parameter-set",
    };
    const {
      envelopeFingerprint: _oldPericardiumFingerprint,
      ...inconsistentPericardiumUnsigned
    } = inconsistentPericardiumBase;
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: resignWarmStart(inconsistentPericardiumUnsigned),
    })).toThrow("warm-start source protocol provenance mismatch");

    const sourceTopology =
      warmStart.sourceProtocolIdentity.circulation.topologyGraphSnapshot;
    const inconsistentTopologyIdentity = Object.freeze({
      ...warmStart.sourceProtocolIdentity,
      circulation: Object.freeze({
        ...warmStart.sourceProtocolIdentity.circulation,
        topologyGraphSnapshot: Object.freeze({
          ...sourceTopology,
          nodes: Object.freeze(sourceTopology.nodes.slice(0, -1)),
        }),
      }),
    });
    const inconsistentTopologyBase = {
      ...warmStart,
      sourceProtocolIdentity: inconsistentTopologyIdentity,
      sourceProtocolIdentityHash: stableHash(sanitizeForStableHash(
        inconsistentTopologyIdentity,
      )),
    };
    const {
      envelopeFingerprint: _oldTopologyFingerprint,
      ...inconsistentTopologyUnsigned
    } = inconsistentTopologyBase;
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      warmStart: resignWarmStart(inconsistentTopologyUnsigned),
    })).toThrow("warm-start source protocol provenance mismatch");
  }, 60_000);

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

  it("rejects a non-integral calcium-cycle grid before running the model", () => {
    expect(() => runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.003,
      maximumBeatCount: 1,
    })).toThrow(
      "dtSec must divide the calcium cycleLengthSec into an exact integer step count",
    );
  });
});
