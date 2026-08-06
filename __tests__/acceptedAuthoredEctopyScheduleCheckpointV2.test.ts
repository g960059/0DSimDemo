import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2,
  checkpointAcceptedAuthoredEctopyScheduleStateV2,
  restoreAcceptedAuthoredEctopyScheduleStateV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleCheckpointV2";
import {
  commitAcceptedAuthoredEctopyScheduleTrialV2,
  createAcceptedAuthoredEctopyScheduleConfigurationV2,
  evaluateAcceptedAuthoredEctopyScheduleTrialV2,
  initializeAcceptedAuthoredEctopyScheduleStateV2,
  type AcceptedAuthoredEctopyScheduleConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedAuthoredEctopyScheduleV2";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("accepted authored ectopy schedule checkpoint V2", () => {
  it("restores exact history, cursor, counters, and deterministic continuation", async () => {
    const configuration = scheduleConfiguration();
    let state = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
      0,
    );
    state = commitAcceptedAuthoredEctopyScheduleTrialV2(
      state,
      evaluateAcceptedAuthoredEctopyScheduleTrialV2(state, 0.3),
    );
    const checkpoint = await checkpointAcceptedAuthoredEctopyScheduleStateV2(
      state,
    );
    const restored = await restoreAcceptedAuthoredEctopyScheduleStateV2(
      jsonClone(checkpoint),
      configuration,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(restored.configuration).not.toBe(state.configuration);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.configuration.events)).toBe(true);
    expect(Object.isFrozen(restored.configuration.events[0])).toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);

    const originalNext = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
      state,
      0.6,
    );
    const restoredNext = evaluateAcceptedAuthoredEctopyScheduleTrialV2(
      restored,
      0.6,
    );
    expect(restoredNext).toEqual(originalNext);
    expect(commitAcceptedAuthoredEctopyScheduleTrialV2(restored, restoredNext))
      .toEqual(commitAcceptedAuthoredEctopyScheduleTrialV2(state, originalNext));
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const configuration = scheduleConfiguration();
    const checkpoint = await checkpointAcceptedAuthoredEctopyScheduleStateV2(
      initializeAcceptedAuthoredEctopyScheduleStateV2(configuration),
    );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      badSha,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 1;
    await resign(badSchema);
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      badSchema,
      configuration,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      badClaim,
      configuration,
    )).rejects.toThrow(/claim mismatch/);
    expect(ACCEPTED_AUTHORED_ECTOPY_SCHEDULE_CHECKPOINT_CLAIM_V2
      .authenticationClaimed).toBe(false);

    const extra = { ...checkpoint, extra: "not-accepted" };
    const { checkpointSha256: _ignored, ...payload } = extra;
    const resignedExtra = {
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    };
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      resignedExtra,
      configuration,
    )).rejects.toThrow(/keys are invalid/);
  });

  it("rejects same IDs with changed complete schedule content", async () => {
    const configuration = scheduleConfiguration();
    const checkpoint = await checkpointAcceptedAuthoredEctopyScheduleStateV2(
      initializeAcceptedAuthoredEctopyScheduleStateV2(configuration),
    );
    const changedReset = createAcceptedAuthoredEctopyScheduleConfigurationV2({
      configurationId: configuration.configurationId,
      ownerInstanceId: configuration.ownerInstanceId,
      scheduleId: configuration.scheduleId,
      events: [
        {
          eventKind: "pvc",
          authoredEctopyId: "history-pvc",
          sourceId: "ventricular-focus",
          sourceSequence: 0,
          activationTimeSec: -0.1,
          chamber: "ventricular",
        },
        {
          eventKind: "pac",
          authoredEctopyId: "pac-one",
          sourceId: "atrial-focus",
          sourceSequence: 0,
          activationTimeSec: 0.2,
          chamber: "atrial",
          sinusResetPolicy: "preserve",
        },
        {
          eventKind: "pvc",
          authoredEctopyId: "pvc-one",
          sourceId: "ventricular-focus",
          sourceSequence: 1,
          activationTimeSec: 0.5,
          chamber: "ventricular",
        },
      ],
    });

    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      checkpoint,
      changedReset,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects re-signed outer/state splits and semantic state tamper", async () => {
    const configuration = scheduleConfiguration();
    let state = initializeAcceptedAuthoredEctopyScheduleStateV2(
      configuration,
      0,
    );
    state = commitAcceptedAuthoredEctopyScheduleTrialV2(
      state,
      evaluateAcceptedAuthoredEctopyScheduleTrialV2(state, 0.3),
    );
    const checkpoint = await checkpointAcceptedAuthoredEctopyScheduleStateV2(
      state,
    );

    const outerSplit = jsonClone(checkpoint);
    outerSplit.cursor = 0;
    await resign(outerSplit);
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      outerSplit,
      configuration,
    )).rejects.toThrow(/outer and accepted clocks split/);

    const emittedCountTamper = jsonClone(checkpoint);
    emittedCountTamper.acceptedState.acceptedEmittedImpulseCount += 1;
    await resign(emittedCountTamper);
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      emittedCountTamper,
      configuration,
    )).rejects.toThrow(/emitted count/);

    const configurationSplit = jsonClone(checkpoint);
    configurationSplit.configuration.events[1].sinusResetPolicy = "preserve";
    await resign(configurationSplit);
    await expect(restoreAcceptedAuthoredEctopyScheduleStateV2(
      configurationSplit,
      configuration,
    )).rejects.toThrow(/configuration and accepted state split/);
  });

  it("restores a safe upper-bound counter but refuses an unsafe next increment", async () => {
    const configuration = createAcceptedAuthoredEctopyScheduleConfigurationV2({
      configurationId: "counter-configuration",
      ownerInstanceId: "counter-owner",
      scheduleId: "counter-schedule",
      events: [],
    });
    const checkpoint = jsonClone(
      await checkpointAcceptedAuthoredEctopyScheduleStateV2(
        initializeAcceptedAuthoredEctopyScheduleStateV2(configuration),
      ),
    );
    checkpoint.revision = Number.MAX_SAFE_INTEGER;
    checkpoint.acceptedTimeSec = 0.1;
    checkpoint.acceptedState.revision = Number.MAX_SAFE_INTEGER;
    checkpoint.acceptedState.acceptedTimeSec = 0.1;
    await resign(checkpoint);

    const restored = await restoreAcceptedAuthoredEctopyScheduleStateV2(
      checkpoint,
      configuration,
    );
    expect(restored.revision).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => evaluateAcceptedAuthoredEctopyScheduleTrialV2(restored, 0.2))
      .toThrow(/cannot be incremented safely/);
  });
});

function scheduleConfiguration(): AcceptedAuthoredEctopyScheduleConfigurationV2 {
  return createAcceptedAuthoredEctopyScheduleConfigurationV2({
    configurationId: "checkpoint-authored-ectopy-configuration",
    ownerInstanceId: "checkpoint-authored-ectopy-owner",
    scheduleId: "checkpoint-authored-ectopy-schedule",
    events: [
      {
        eventKind: "pvc",
        authoredEctopyId: "history-pvc",
        sourceId: "ventricular-focus",
        sourceSequence: 0,
        activationTimeSec: -0.1,
        chamber: "ventricular",
      },
      {
        eventKind: "pac",
        authoredEctopyId: "pac-one",
        sourceId: "atrial-focus",
        sourceSequence: 0,
        activationTimeSec: 0.2,
        chamber: "atrial",
        sinusResetPolicy: "reset",
      },
      {
        eventKind: "pvc",
        authoredEctopyId: "pvc-one",
        sourceId: "ventricular-focus",
        sourceSequence: 1,
        activationTimeSec: 0.5,
        chamber: "ventricular",
      },
    ],
  });
}

function jsonClone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
