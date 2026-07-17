import { describe, expect, it } from "vitest";

import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";
import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
  validateRetainedAcceptedIntervalWindowV1,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV2,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall periodic steady runner V3", () => {
  it("runs one canonical coarse beat without overstating periodic closure", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "canonical",
    });
    const exactOff = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.01,
      maximumBeatCount: 1,
      initialization: "canonical",
      pericardiumMode: "exact-off",
    });

    expect(result.experimentId)
      .toBe("main-wire-normal-adult-five-wall-periodic-steady-v3");
    expect(result.schemaVersion).toBe(3);
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
    expect(result.retainedCompleteBeats[0]!.samples[0]!.diagnosticSampleV3Id)
      .toBe("main-wire-normal-adult-five-wall-diagnostic-sample-v3");
    const retainedBeat = result.retainedCompleteBeats[0]!;
    expect(retainedBeat).toMatchObject({
      startRevision: 0,
      endRevision: 100,
      acceptedIntervalCount: 100,
    });
    expect(retainedBeat.endRevision - retainedBeat.startRevision)
      .toBe(retainedBeat.acceptedIntervalCount);
    expect(retainedBeat.acceptedIntervalTrace).toMatchObject({
      timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
      status: "missing-preceding-diagnostic",
      reason: "cold-start",
      startTimeSec: 0,
    });
    expect(retainedBeat.acceptedIntervalTrace.durationSec).toBeCloseTo(1, 12);
    expect(retainedBeat.acceptedIntervalTrace)
      .not.toHaveProperty("precedingSample");
    expect(retainedBeat.acceptedIntervalTrace.intervals).toHaveLength(100);
    retainedBeat.acceptedIntervalTrace.intervals.forEach((interval, index) => {
      expect(interval.endpointSample.sample).toBe(retainedBeat.samples[index]);
      expect(interval.endpointSample.sample.diagnosticSampleV3Id)
        .toBe("main-wire-normal-adult-five-wall-diagnostic-sample-v3");
    });
    expect(result.retainedPartialBeat).toHaveLength(0);
    expect(result.retainedPartialAcceptedIntervals).toHaveLength(0);
    expect(result.initializationAudit.totalBloodVolumeDifferenceMl).toBe(0);
    expect(result.initializationAudit.transferredVolumeMl).toBe(0);
    expect(result.claim.ordinaryBeatIterationOnly).toBe(true);
    expect(result.claim.shootingOrAndersonAccelerationApplied).toBe(false);
    expect(result.claim.parameterSearch).toBe(false);
    expect(result.claim).toMatchObject({
      acceptedIntervalTimebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
      acceptedIntervalOwnership: "open-start-closed-end",
      acceptedIntervalEventsCopiedFromAcceptedCalciumTrial: true,
      retainedIntervalEventScheduleRequeryApplied: false,
      retainedPrecedingDiagnosticFabricated: false,
    });
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
    expect(result.protocolIdentity).toMatchObject({
      identityId:
        "main-wire-normal-adult-five-wall-periodic-protocol-identity-v2",
      schemaVersion: 2,
      commonPericardium: {
        caseId: "healthy-slack",
        binding: {
          bindingId: "main-wire-common-pericardium-binding-v1",
          mode: "on",
        },
      },
    });
    expect(Object.keys(result.protocolComponentHashes).sort()).toEqual([
      "bloodVolumePriorStableHash",
      "calciumDriveFixedParamsStableHash",
      "calciumStateContractStableHash",
      "circulationConfigurationSnapshotStableHash",
      "circulationRuntimeStableHash",
      "circulationTopologyGraphStableHash",
      "commonPericardiumStableHash",
      "mechanicsProviderMetadataStableHash",
      "periodicPolicyStableHash",
    ]);
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
    const healthySamples = result.retainedCompleteBeats[0]!.samples;
    const offSamples = exactOff.retainedCompleteBeats[0]!.samples;
    expect(healthySamples.every((sample) =>
      sample.commonPericardium.excessPressurePa === 0
      && sample.commonPericardium.excessPressureMmHg === 0
      && sample.commonPericardium.storedEnergyMilliJ === 0
      && sample.commonPericardium.pressureDerivativePaPerM3 === 0
      && sample.commonPericardium.elasticConstraintEngaged === false
      && sample.commonPericardium.smoothingBranch === "zero"
    )).toBe(true);
    expect(offSamples.every((sample) =>
      sample.commonPericardium.excessPressurePa === 0
      && sample.commonPericardium.smoothingBranch === "off"
    )).toBe(true);
    expect(legacyV2Projection(healthySamples))
      .toEqual(legacyV2Projection(offSamples));
    expect(stableHash(sanitizeForStableHash(
      legacyV2Projection(healthySamples),
    ))).toBe("58a24381");
    expect(exactOff.protocolComponentHashes).toEqual({
      ...result.protocolComponentHashes,
      commonPericardiumStableHash:
        exactOff.protocolComponentHashes.commonPericardiumStableHash,
    });
    expect(exactOff.protocolComponentHashes.commonPericardiumStableHash)
      .not.toBe(result.protocolComponentHashes.commonPericardiumStableHash);
    expect(exactOff.protocolIdentityHash).not.toBe(result.protocolIdentityHash);
    expect(result.protocolIdentity.periodicPolicy.policyStableHash)
      .toBe(result.protocolComponentHashes.periodicPolicyStableHash);
    expect(result.protocolIdentityHash).toBe(stableHash(sanitizeForStableHash(
      result.protocolIdentity,
    )));
  }, 60_000);

  it("separates analytic-control and exact-event state protocol identities", () => {
    const analytic =
      resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2();
    const exact = resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2({
      calciumRepresentation: "exact-event-state",
    });

    expect(analytic.identity.calciumDrive).toMatchObject({
      representation: "analytic-periodic-control-with-exact-event-shadow",
      stateSchemaId: "five-wall-exact-event-calcium-2state-per-wall-v1",
      stateSchemaVersion: 1,
      initializationId: "regular-periodic-prehistory-from-fixed-prior",
      eventKernelId: "exact-event-two-decay-prescribed-calcium-v1",
      periodicConversionId:
        "analytic-periodic-biexponential-to-exact-event-v1",
    });
    expect(exact.identity.calciumDrive.representation)
      .toBe("exact-event-state");
    expect(exact.identity.calciumDrive.eventScheduleIdentityHash)
      .toBe(analytic.identity.calciumDrive.eventScheduleIdentityHash);
    expect(exact.componentHashes.calciumStateContractStableHash)
      .not.toBe(analytic.componentHashes.calciumStateContractStableHash);
    expect(exact.identityHash).not.toBe(analytic.identityHash);
  });

  it("owns exact-state off-grid events once and completes the second retained window", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 2,
      calciumRepresentation: "exact-event-state",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(result.stepsPerBeat).toBe(50);
    expect(result.retainedCompleteBeats).toHaveLength(2);
    const [firstBeat, secondBeat] = result.retainedCompleteBeats;
    expect(firstBeat).toBeDefined();
    expect(secondBeat).toBeDefined();
    for (const [index, beat] of [firstBeat!, secondBeat!].entries()) {
      expect(beat.acceptedIntervalCount).toBe(52);
      expect(beat.samples).toHaveLength(52);
      expect(beat.acceptedIntervalTrace.intervals).toHaveLength(52);
      expect(beat.endRevision - beat.startRevision).toBe(52);
      expect(beat.endTimeSec - beat.startTimeSec).toBeCloseTo(1, 12);
      expect(beat.acceptedIntervalTrace.durationSec).toBeCloseTo(1, 12);
      expect(beat.startRevision).toBe(index * 52);
      expect(beat.endRevision).toBe((index + 1) * 52);
      beat.acceptedIntervalTrace.intervals.forEach((interval, intervalIndex) => {
        expect(interval.endpointSample.sample).toBe(beat.samples[intervalIndex]);
      });
    }
    expect(firstBeat!.acceptedIntervalTrace).toMatchObject({
      status: "missing-preceding-diagnostic",
      reason: "cold-start",
    });
    expect(firstBeat!.acceptedIntervalTrace)
      .not.toHaveProperty("precedingSample");
    const secondTrace = secondBeat!.acceptedIntervalTrace;
    expect(secondTrace.status).toBe("complete");
    if (secondTrace.status !== "complete") {
      throw new Error("second retained beat must have a complete timebase");
    }
    expect(secondTrace.precedingSample.timeSec)
      .toBeCloseTo(secondBeat!.startTimeSec, 12);
    expect(secondTrace.precedingSample.sample)
      .toBe(firstBeat!.samples.at(-1));
    expect(() => validateRetainedAcceptedIntervalWindowV1(
      secondTrace,
    )).not.toThrow();

    const firstEvents = acceptedEvents(firstBeat!);
    const secondEvents = acceptedEvents(secondBeat!);
    expectEventTimes(firstEvents, [0.012, 0.852]);
    expectEventTimes(secondEvents, [1.012, 1.852]);
    const eventIds = [...firstEvents, ...secondEvents].map(
      (event) => event.eventId,
    );
    expect(new Set(eventIds).size).toBe(4);
    for (const event of [...firstEvents, ...secondEvents]) {
      expect(event.event).toMatchObject({
        source: "accepted-calcium-trial",
        scheduleId: result.protocolIdentity.calciumDrive.eventScheduleId,
        scheduleIdentityHash:
          result.protocolIdentity.calciumDrive.eventScheduleIdentityHash,
      });
      expect(event.eventId)
        .toMatch(/^calcium:[0-9a-f]{8}:r\d+:i\d+:[0-9a-f]{8}$/);
      expect(event.eventId).toBe([
        "calcium",
        event.event.scheduleIdentityHash,
        `r${event.event.acceptedTrialBaseRevision}`,
        `i${event.event.eventIndexWithinAcceptedTrial}`,
        stableHash(sanitizeForStableHash(event.event.calciumEvent)),
      ].join(":"));
      expect(event.timeSec).toBe(event.event.calciumEvent.timeSec);
    }
    expect(result.claim.stepsPerBeatIsNominalGridCount).toBe(true);
    expect(result.claim.acceptedSubstepsMayExceedNominalStepsPerBeat).toBe(true);
    expect(result.claim.exactEventRepresentationIntervalsSplitAtOffGridEvents)
      .toBe(true);
    expect(result.claim.retainedIntervalEventScheduleRequeryApplied).toBe(false);
  }, 120_000);

  it("retains analytic accepted intervals without numerical event splitting", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.02,
      maximumBeatCount: 1,
      calciumRepresentation:
        "analytic-periodic-control-with-exact-event-shadow",
    });

    const beat = result.retainedCompleteBeats[0]!;
    expect(result.integrationCompletedWithoutFailure).toBe(true);
    expect(beat.acceptedIntervalCount).toBe(50);
    expect(beat.samples).toHaveLength(50);
    expect(beat.acceptedIntervalTrace.intervals).toHaveLength(50);
    expect(beat.endRevision - beat.startRevision).toBe(50);
    expect(beat.acceptedIntervalTrace.intervals.every((interval) =>
      Math.abs(interval.durationSec - 0.02) < 1e-12
    )).toBe(true);
    const endpointTimes = beat.samples.map((sample) => sample.timeSec);
    expect(endpointTimes.some((timeSec) => Math.abs(timeSec - 0.012) < 1e-12))
      .toBe(false);
    expect(endpointTimes.some((timeSec) => Math.abs(timeSec - 0.852) < 1e-12))
      .toBe(false);
    expectEventTimes(acceptedEvents(beat), [0.012, 0.852]);
    expect(result.claim.acceptedIntervalEventsCopiedFromAcceptedCalciumTrial)
      .toBe(true);
  }, 60_000);

  it("retains only committed intervals before a deterministic step failure", () => {
    const result = runMainWireNormalAdultFiveWallPeriodicSteadyV3({
      dtSec: 0.04,
      maximumBeatCount: 1,
      bloodVolumePriorVariant:
        "official-target-minus-excluded-coronary-cold-seed",
    });

    expect(result.integrationCompletedWithoutFailure).toBe(false);
    expect(result.terminationReason).toBe("step-failure");
    expect(result.completedBeatCount).toBe(0);
    expect(result.retainedCompleteBeats).toHaveLength(0);
    expect(result.failure).toMatchObject({
      beatIndex: 1,
      stepWithinBeat: 3,
      timeSec: 0.12,
    });
    expect(result.retainedPartialBeat).toHaveLength(2);
    expect(result.retainedPartialAcceptedIntervals).toHaveLength(2);
    expect(result.retainedPartialBeat.map((sample) => sample.timeSec))
      .toEqual([0.04, 0.08]);
    result.retainedPartialAcceptedIntervals.forEach((interval, index) => {
      expect(interval.startTimeSec).toBeCloseTo(index * 0.04, 12);
      expect(interval.endTimeSec).toBeCloseTo((index + 1) * 0.04, 12);
      expect(interval.durationSec).toBeCloseTo(0.04, 12);
      expect(interval.endpointSample.timeSec).toBe(interval.endTimeSec);
      expect(interval.endpointSample.sample)
        .toBe(result.retainedPartialBeat[index]);
    });
    expect(result.retainedPartialAcceptedIntervals
      .some((interval) => Math.abs(interval.endTimeSec - 0.12) < 1e-12))
      .toBe(false);
    expectEventTimes(
      result.retainedPartialAcceptedIntervals.flatMap(
        (interval) => interval.eventsOpenClosed,
      ),
      [0.012],
    );
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

  it("rejects common-pericardium choices outside the fixed registry", () => {
    expect(() => resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2({
      pericardiumMode: "bad" as never,
    })).toThrow(/unsupported normal-adult common-pericardium mode/);
    expect(() => resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2({
      pericardiumCase: "shape-fit" as never,
    })).toThrow(/unsupported normal-adult common-pericardium case/);
  });

  it("rejects a self-consistently rehashed but non-registry pericardium binding", () => {
    const valid =
      resolveMainWireNormalAdultFiveWallPeriodicProtocolIdentityV2();
    const tamperedBinding = Object.freeze({
      ...valid.identity.commonPericardium.binding,
      parameters: Object.freeze({
        ...valid.identity.commonPericardium.binding.parameters,
        exponentialStiffness:
          valid.identity.commonPericardium.binding.parameters
            .exponentialStiffness + 1,
      }),
    });
    const commonPericardiumStableHash = stableHash(sanitizeForStableHash(
      tamperedBinding,
    ));
    const identity = Object.freeze({
      ...valid.identity,
      commonPericardium: Object.freeze({
        ...valid.identity.commonPericardium,
        binding: tamperedBinding,
        bindingStableHash: commonPericardiumStableHash,
      }),
    });
    const componentHashes = Object.freeze({
      ...valid.componentHashes,
      commonPericardiumStableHash,
    });
    expect(() =>
      assertMainWireNormalAdultFiveWallPeriodicProtocolIdentityIntegrityV2({
        identity,
        identityHash: stableHash(sanitizeForStableHash(identity)),
        componentHashes,
        periodicPolicy:
          MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
      })
    ).toThrow("periodic common-pericardium hash is inconsistent");
  });
});

function legacyV2Projection(
  samples: ReturnType<
    typeof runMainWireNormalAdultFiveWallPeriodicSteadyV3
  >["retainedCompleteBeats"][number]["samples"],
): readonly unknown[] {
  return samples.map((sample) => {
    const {
      diagnosticSampleV3Id: _diagnosticSampleV3Id,
      diagnosticSchemaVersion: _diagnosticSchemaVersion,
      commonPericardium: _commonPericardium,
      ...legacyV2
    } = sample;
    return legacyV2;
  });
}

function acceptedEvents(
  beat: ReturnType<
    typeof runMainWireNormalAdultFiveWallPeriodicSteadyV3
  >["retainedCompleteBeats"][number],
) {
  return beat.acceptedIntervalTrace.intervals.flatMap(
    (interval) => interval.eventsOpenClosed,
  );
}

function expectEventTimes(
  events: ReturnType<typeof acceptedEvents>,
  expectedTimesSec: readonly number[],
): void {
  expect(events).toHaveLength(expectedTimesSec.length);
  events.forEach((event, index) => {
    expect(event.timeSec).toBeCloseTo(expectedTimesSec[index]!, 12);
  });
}
