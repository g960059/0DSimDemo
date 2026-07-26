import { describe, expect, it } from "vitest";

import {
  ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedEventTriggeredIabpActuatorStateV1,
  restoreAcceptedEventTriggeredIabpActuatorStateV1,
  type AcceptedEventTriggeredIabpActuatorCheckpointV1,
} from "@/engine/devices/acceptedEventTriggeredIabpActuatorCheckpointV1";
import {
  commitAcceptedEventTriggeredIabpActuatorCandidateV1,
  createAcceptedAorticValveClosureEventV1,
  createAcceptedEventTriggeredIabpActuatorConfigurationV1,
  evaluateAcceptedEventTriggeredIabpActuatorCandidateV1,
  initializeAcceptedEventTriggeredIabpActuatorStateV1,
  type AcceptedEventTriggeredIabpActuatorConfigurationV1,
  type AcceptedEventTriggeredIabpActuatorStateV1,
} from "@/engine/devices/acceptedEventTriggeredIabpActuatorOwnerV1";
import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("accepted-event-triggered IABP actuator checkpoint V1", () => {
  it("restores a detached immutable mid-inflation state and continues exactly", async () => {
    const configuration = checkpointConfiguration();
    const beatOne = ventricularActivation("checkpoint-beat-1", 0.1, 1);
    let state = initialState(configuration);
    state = acceptEvent(state, 0.1, beatOne, null);
    state = acceptEvent(state, 0.15000000000000002, null, null);
    state = acceptEvent(
      state,
      0.3,
      null,
      createAcceptedAorticValveClosureEventV1({
        closureEventId: "checkpoint-closure-1",
        parentCapturedVentricularActivationId: beatOne.capturedActivationId,
        closureTimeSec: 0.3,
        valveId: "AoV",
      }),
    );
    state = acceptEvent(state, 0.35, null, null);
    expect(state.transitionMemory.transitionKind).toBe("inflation");
    expect(state.transitionMemory.endTimeSec).toBeCloseTo(0.4, 15);

    const checkpoint =
      await checkpointAcceptedEventTriggeredIabpActuatorStateV1(state);
    const parsed = jsonClone(checkpoint);
    const restored =
      await restoreAcceptedEventTriggeredIabpActuatorStateV1(
        parsed,
        configuration,
      );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(restored.configuration).not.toBe(state.configuration);
    expect(restored.transitionMemory).not.toBe(state.transitionMemory);
    expect(restored.currentCapturedVentricularActivation)
      .not.toBe(state.currentCapturedVentricularActivation);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.transitionMemory)).toBe(true);
    expect(Object.isFrozen(restored.currentCapturedVentricularActivation))
      .toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);
    expect(checkpoint.exactResumeClaim.migrationClaimed).toBe(false);

    parsed.acceptedState.transitionMemory.transitionId = "mutated-after-restore";
    expect(restored.transitionMemory.transitionId)
      .toBe(state.transitionMemory.transitionId);

    const originalAtBoundary = acceptEvent(state, 0.4, null, null);
    const restoredAtBoundary = acceptEvent(restored, 0.4, null, null);
    expect(restoredAtBoundary).toEqual(originalAtBoundary);

    const beatTwo = ventricularActivation("checkpoint-beat-2", 0.83, 2);
    const originalContinuation = evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
      originalAtBoundary,
      {
        candidateTimeSec: 0.83,
        capturedVentricularActivations: [beatTwo],
        aorticValveClosures: [],
      },
    );
    const restoredContinuation = evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
      restoredAtBoundary,
      {
        candidateTimeSec: 0.83,
        capturedVentricularActivations: [beatTwo],
        aorticValveClosures: [],
      },
    );
    expect(restoredContinuation).toEqual(originalContinuation);
    expect(commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      restoredAtBoundary,
      restoredContinuation,
    )).toEqual(commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      originalAtBoundary,
      originalContinuation,
    ));
  });

  it("rejects digest, schema, claim, and exact-key tamper", async () => {
    const configuration = checkpointConfiguration();
    const checkpoint =
      await checkpointAcceptedEventTriggeredIabpActuatorStateV1(
        initialState(configuration),
      );

    const badDigest = jsonClone(checkpoint);
    badDigest.checkpointSha256 =
      `${badDigest.checkpointSha256[0] === "0" ? "1" : "0"}${badDigest.checkpointSha256.slice(1)}`;
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      badDigest,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 2;
    await resign(badSchema);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      badSchema,
      configuration,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      badClaim,
      configuration,
    )).rejects.toThrow(/claim mismatch/);

    const extraKey = jsonClone(checkpoint);
    extraKey.undocumented = true;
    await resign(extraKey);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      extraKey,
      configuration,
    )).rejects.toThrow(/keys are invalid/);

    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CHECKPOINT_CLAIM_V1
      .authenticationClaimed).toBe(false);
  });

  it("rejects re-signed outer clock, count, capture, closure, and transition lineage splits", async () => {
    const { configuration, state } = await midInflationState();
    const checkpoint =
      await checkpointAcceptedEventTriggeredIabpActuatorStateV1(state);

    for (const mutate of [
      (copy: ReturnType<typeof jsonClone>) => {
        copy.acceptedTimeSec += 0.01;
      },
      (copy: ReturnType<typeof jsonClone>) => {
        copy.revision += 1;
      },
      (copy: ReturnType<typeof jsonClone>) => {
        copy.acceptedVentricularActivationCount += 1;
      },
      (copy: ReturnType<typeof jsonClone>) => {
        copy.currentCapturedVentricularActivationId = "split-capture";
      },
      (copy: ReturnType<typeof jsonClone>) => {
        copy.lastAcceptedAorticValveClosureEventId = "split-closure";
      },
      (copy: ReturnType<typeof jsonClone>) => {
        copy.transitionId = "split-transition";
      },
    ]) {
      const split = jsonClone(checkpoint);
      mutate(split);
      await resign(split);
      await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
        split,
        configuration,
      )).rejects.toThrow(/outer and accepted state lineage split/);
    }

    const noncanonicalTransition = jsonClone(checkpoint);
    noncanonicalTransition.acceptedState.transitionMemory.transitionId =
      "re-signed-but-noncanonical";
    noncanonicalTransition.transitionId = "re-signed-but-noncanonical";
    await resign(noncanonicalTransition);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      noncanonicalTransition,
      configuration,
    )).rejects.toThrow(/transition id is not canonical/);

    const wrongClosureParent = jsonClone(checkpoint);
    wrongClosureParent.acceptedState.lastAcceptedAorticValveClosure
      .parentCapturedVentricularActivationId = "wrong-parent";
    await resign(wrongClosureParent);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      wrongClosureParent,
      configuration,
    )).rejects.toThrow(/prior-beat closure|closure lineage is split/);
  });

  it("rejects exact-ID expected-configuration substitution", async () => {
    const configuration = checkpointConfiguration();
    const checkpoint =
      await checkpointAcceptedEventTriggeredIabpActuatorStateV1(
        initialState(configuration),
      );
    const sameIdsChangedVolume =
      createAcceptedEventTriggeredIabpActuatorConfigurationV1({
        configurationId: configuration.configurationId,
        ownerInstanceId: configuration.ownerInstanceId,
        assistRatio: configuration.assistRatio,
        balloonVolumeMl: 41,
        inflationTransitionDurationSec:
          configuration.inflationTransitionDurationSec,
        deflationTransitionDurationSec:
          configuration.deflationTransitionDurationSec,
        placementNode: configuration.placementNode,
      });

    expect(sameIdsChangedVolume.configurationId)
      .toBe(configuration.configurationId);
    expect(sameIdsChangedVolume.ownerInstanceId)
      .toBe(configuration.ownerInstanceId);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      checkpoint,
      sameIdsChangedVolume,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects re-signed stored configuration/state splits and full-content substitution", async () => {
    const configuration = checkpointConfiguration();
    const checkpoint =
      await checkpointAcceptedEventTriggeredIabpActuatorStateV1(
        initialState(configuration),
      );
    const envelopeSplit = jsonClone(checkpoint);
    envelopeSplit.configuration.balloonVolumeMl = 41;
    await resign(envelopeSplit);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      envelopeSplit,
      configuration,
    )).rejects.toThrow(/configuration and accepted state split/);

    const substituted = jsonClone(checkpoint);
    substituted.configuration.balloonVolumeMl = 41;
    substituted.acceptedState.configuration.balloonVolumeMl = 41;
    await resign(substituted);
    await expect(restoreAcceptedEventTriggeredIabpActuatorStateV1(
      substituted,
      configuration,
    )).rejects.toThrow(/expected configuration mismatch/);
  });
});

function checkpointConfiguration(): AcceptedEventTriggeredIabpActuatorConfigurationV1 {
  return createAcceptedEventTriggeredIabpActuatorConfigurationV1({
    configurationId: "checkpoint-event-iabp-configuration-v1",
    ownerInstanceId: "checkpoint-event-iabp-owner-v1",
    assistRatio: 2,
    balloonVolumeMl: 40,
    inflationTransitionDurationSec: 0.1,
    deflationTransitionDurationSec: 0.05,
    placementNode: "SA",
  });
}

function initialState(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  return initializeAcceptedEventTriggeredIabpActuatorStateV1(configuration, {
    acceptedTimeSec: 0,
  });
}

function ventricularActivation(
  id: string,
  activationTimeSec: number,
  ordinal: number,
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: id,
    parentSourceImpulseId: `source:${id}`,
    upstreamCapturedActivationId: null,
    chamber: "ventricular" as const,
    gateInstanceId: "checkpoint-ventricular-capture-gate",
    activationTimeSec,
    sourceKind: "pacing" as const,
    sourceId: "checkpoint-pacer",
    sourceSequence: ordinal,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2.pacing,
    captureOrdinal: ordinal,
    ownerRevision: ordinal,
  });
}

function acceptEvent(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  candidateTimeSec: number,
  activation: CapturedElectricalActivationV2 | null,
  closure: ReturnType<typeof createAcceptedAorticValveClosureEventV1> | null,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  return commitAcceptedEventTriggeredIabpActuatorCandidateV1(
    state,
    evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(state, {
      candidateTimeSec,
      capturedVentricularActivations:
        activation === null ? [] : [activation],
      aorticValveClosures: closure === null ? [] : [closure],
    }),
  );
}

async function midInflationState(): Promise<Readonly<{
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1;
  state: AcceptedEventTriggeredIabpActuatorStateV1;
}>> {
  const configuration = checkpointConfiguration();
  const activation = ventricularActivation("tamper-beat-1", 0.1, 1);
  let state = initialState(configuration);
  state = acceptEvent(state, 0.1, activation, null);
  state = acceptEvent(state, 0.15000000000000002, null, null);
  state = acceptEvent(
    state,
    0.3,
    null,
    createAcceptedAorticValveClosureEventV1({
      closureEventId: "tamper-closure-1",
      parentCapturedVentricularActivationId: activation.capturedActivationId,
      closureTimeSec: 0.3,
      valveId: "AoV",
    }),
  );
  state = acceptEvent(state, 0.35, null, null);
  return { configuration, state };
}

function jsonClone(
  checkpoint: AcceptedEventTriggeredIabpActuatorCheckpointV1,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _discarded, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
