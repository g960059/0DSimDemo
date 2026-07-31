import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceCheckpointV1";
import {
  commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1,
  createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
  evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1,
  initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1,
  type AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedAuthoredVentricularPacingReplaySourceV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("accepted authored ventricular pacing replay checkpoint V1", () => {
  it("restores exact history, cursor, counters, and deterministic continuation", async () => {
    const configuration = replayConfiguration();
    let state = initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
      configuration,
      0,
    );
    state = commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      state,
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(state, 0.3),
    );
    const checkpoint =
      await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        state,
      );
    const restored =
      await restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
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

    const originalNext =
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(state, 0.6);
    const restoredNext =
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        restored,
        0.6,
      );
    expect(restoredNext).toEqual(originalNext);
    expect(
      commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        restored,
        restoredNext,
      ),
    ).toEqual(
      commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        state,
        originalNext,
      ),
    );
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const configuration = replayConfiguration();
    const checkpoint =
      await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
          configuration,
        ),
      );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        badSha,
        configuration,
      ),
    ).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 2;
    await resign(badSchema);
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        badSchema,
        configuration,
      ),
    ).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        badClaim,
        configuration,
      ),
    ).rejects.toThrow(/claim mismatch/);
    expect(
      ACCEPTED_AUTHORED_VENTRICULAR_PACING_REPLAY_SOURCE_CHECKPOINT_CLAIM_V1.authenticationClaimed,
    ).toBe(false);

    const extra = { ...checkpoint, extra: "not-accepted" };
    const { checkpointSha256: _old, ...payload } = extra;
    const resignedExtra = {
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    };
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        resignedExtra,
        configuration,
      ),
    ).rejects.toThrow(/keys are invalid/);
  });

  it("rejects same IDs with changed replay time, sequence, or source content", async () => {
    const configuration = replayConfiguration();
    const checkpoint =
      await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
          configuration,
        ),
      );
    const changedTime = replayConfiguration({ lastTimeSec: 0.55 });
    const changedSequence = replayConfiguration({ lastSequence: 3 });
    const changedSource = replayConfiguration({ sourceId: "changed-source" });
    for (const changed of [changedTime, changedSequence, changedSource]) {
      await expect(
        restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
          checkpoint,
          changed,
        ),
      ).rejects.toThrow(/expected configuration mismatch/);
    }
  });

  it("rejects re-signed outer/state splits and semantic cursor/configuration tamper", async () => {
    const configuration = replayConfiguration();
    let state = initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
      configuration,
      0,
    );
    state = commitAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
      state,
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(state, 0.3),
    );
    const checkpoint =
      await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        state,
      );

    const outerSplit = jsonClone(checkpoint);
    outerSplit.cursor = 0;
    await resign(outerSplit);
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        outerSplit,
        configuration,
      ),
    ).rejects.toThrow(/outer and accepted state split/);

    const cursorTamper = jsonClone(checkpoint);
    cursorTamper.acceptedState.cursor += 1;
    await resign(cursorTamper);
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        cursorTamper,
        configuration,
      ),
    ).rejects.toThrow(/cursor does not match accepted time/);

    const configurationSplit = jsonClone(checkpoint);
    configurationSplit.configuration.events[1].activationTimeSec = 0.21;
    await resign(configurationSplit);
    await expect(
      restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        configurationSplit,
        configuration,
      ),
    ).rejects.toThrow(/configuration and accepted state split/);
  });

  it("restores a safe upper-bound revision but refuses an unsafe next increment", async () => {
    const configuration =
      createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
        configurationId: "counter-configuration",
        ownerInstanceId: "counter-owner",
        replayId: "counter-replay",
        sourceId: "counter-pacing-source",
        events: [],
      });
    const checkpoint = jsonClone(
      await checkpointAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        initializeAcceptedAuthoredVentricularPacingReplaySourceStateV1(
          configuration,
        ),
      ),
    );
    checkpoint.revision = Number.MAX_SAFE_INTEGER;
    checkpoint.acceptedTimeSec = 0.1;
    checkpoint.acceptedState.revision = Number.MAX_SAFE_INTEGER;
    checkpoint.acceptedState.acceptedTimeSec = 0.1;
    await resign(checkpoint);

    const restored =
      await restoreAcceptedAuthoredVentricularPacingReplaySourceStateV1(
        checkpoint,
        configuration,
      );
    expect(restored.revision).toBe(Number.MAX_SAFE_INTEGER);
    expect(() =>
      evaluateAcceptedAuthoredVentricularPacingReplaySourceTrialV1(
        restored,
        0.2,
      ),
    ).toThrow(/cannot be incremented safely/);
  });
});

function replayConfiguration(
  overrides: Partial<{
    lastTimeSec: number;
    lastSequence: number;
    sourceId: string;
  }> = {},
): AcceptedAuthoredVentricularPacingReplaySourceConfigurationV1 {
  return createAcceptedAuthoredVentricularPacingReplaySourceConfigurationV1({
    configurationId: "checkpoint-authored-pacing-replay-configuration",
    ownerInstanceId: "checkpoint-authored-pacing-replay-owner",
    replayId: "checkpoint-authored-pacing-replay",
    sourceId: overrides.sourceId ?? "validation-ventricular-pacing-source",
    events: [
      {
        pacingEventId: "history",
        sourceSequence: 0,
        activationTimeSec: -0.1,
      },
      {
        pacingEventId: "first",
        sourceSequence: 1,
        activationTimeSec: 0.2,
      },
      {
        pacingEventId: "last",
        sourceSequence: overrides.lastSequence ?? 2,
        activationTimeSec: overrides.lastTimeSec ?? 0.5,
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
