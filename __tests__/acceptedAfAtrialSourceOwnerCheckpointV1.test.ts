import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedAfAtrialSourceStateV1,
  restoreAcceptedAfAtrialSourceStateV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerCheckpointV1";
import {
  commitAcceptedAfAtrialSourceTrialV1,
  createAcceptedAfAtrialSourceConfigurationV1,
  evaluateAcceptedAfAtrialSourceTrialV1,
  initializeAcceptedAfAtrialSourceStateV1,
  type AcceptedAfAtrialSourceConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("accepted AF atrial source owner checkpoint V1", () => {
  it("restores the exact PRNG, Gaussian spare, MA history, lineage, and continuation", async () => {
    const configuration = makeConfiguration();
    let state = initialize(configuration);
    state = commitAcceptedAfAtrialSourceTrialV1(
      state,
      evaluateAcceptedAfAtrialSourceTrialV1(state, 0.7),
    );
    const checkpoint = await checkpointAcceptedAfAtrialSourceStateV1(state);
    const restored = await restoreAcceptedAfAtrialSourceStateV1(
      jsonClone(checkpoint),
      configuration,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(restored.configuration).not.toBe(state.configuration);
    expect(restored.randomState).not.toBe(state.randomState);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.randomState)).toBe(true);
    expect(Object.isFrozen(restored.innovationHistoryNewestFirstSec)).toBe(
      true,
    );
    expect(checkpoint.exactResumeClaim.randomStateExact).toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);
    expect(restored.randomState.pearsonNonpositiveParentRejectedCount).toBe(
      state.randomState.pearsonNonpositiveParentRejectedCount,
    );
    expect(restored.randomState.gammaAttemptCount).toBe(
      state.randomState.gammaAttemptCount,
    );

    const originalNext = evaluateAcceptedAfAtrialSourceTrialV1(state, 2);
    const restoredNext = evaluateAcceptedAfAtrialSourceTrialV1(restored, 2);
    expect(restoredNext).toEqual(originalNext);
    expect(commitAcceptedAfAtrialSourceTrialV1(restored, restoredNext)).toEqual(
      commitAcceptedAfAtrialSourceTrialV1(state, originalNext),
    );
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointAcceptedAfAtrialSourceStateV1(
      initialize(configuration),
    );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(badSha, configuration),
    ).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 2;
    await resign(badSchema);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(badSchema, configuration),
    ).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(badClaim, configuration),
    ).rejects.toThrow(/claim mismatch/);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CHECKPOINT_CLAIM_V1.authenticationClaimed,
    ).toBe(false);

    const extra = { ...checkpoint, extra: "not-accepted" };
    const { checkpointSha256: _old, ...payload } = extra;
    const resignedExtra = {
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    };
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(resignedExtra, configuration),
    ).rejects.toThrow(/keys are invalid/);
  });

  it("rejects same IDs with changed seed, moments, or MA coefficients", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointAcceptedAfAtrialSourceStateV1(
      initialize(configuration),
    );
    const changedSeed = makeConfiguration({ seedUint32: 42 });
    const changedMoments = makeConfiguration({ meanSec: 0.16 });
    const changedFilter = makeConfiguration({
      movingAverageCoefficients: [0.8, 0.2],
    });
    for (const changed of [changedSeed, changedMoments, changedFilter]) {
      await expect(
        restoreAcceptedAfAtrialSourceStateV1(checkpoint, changed),
      ).rejects.toThrow(/expected configuration mismatch/);
    }
  });

  it("rejects re-signed outer/state splits and semantic random-state tamper", async () => {
    const configuration = makeConfiguration();
    let state = initialize(configuration);
    state = commitAcceptedAfAtrialSourceTrialV1(
      state,
      evaluateAcceptedAfAtrialSourceTrialV1(state, 0.7),
    );
    const checkpoint = await checkpointAcceptedAfAtrialSourceStateV1(state);

    const outerClockSplit = jsonClone(checkpoint);
    outerClockSplit.acceptedTimeSec += 0.01;
    await resign(outerClockSplit);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(outerClockSplit, configuration),
    ).rejects.toThrow(/outer and accepted acceptedTimeSec split/);

    const outerRandomSplit = jsonClone(checkpoint);
    outerRandomSplit.randomState.state0 =
      (outerRandomSplit.randomState.state0 ^ 1) >>> 0;
    await resign(outerRandomSplit);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(outerRandomSplit, configuration),
    ).rejects.toThrow(/outer and accepted random state split/);

    const acceptedCountTamper = jsonClone(checkpoint);
    acceptedCountTamper.acceptedState.randomState.pearsonAcceptedCount += 1;
    await resign(acceptedCountTamper);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(acceptedCountTamper, configuration),
    ).rejects.toThrow(/random counters|accepted-innovation count/);

    const signedGammaAttemptTamper = jsonClone(checkpoint);
    signedGammaAttemptTamper.acceptedState.randomState.gammaAttemptCount += 1;
    signedGammaAttemptTamper.randomState.gammaAttemptCount =
      signedGammaAttemptTamper.acceptedState.randomState.gammaAttemptCount;
    await resign(signedGammaAttemptTamper);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(
        signedGammaAttemptTamper,
        configuration,
      ),
    ).rejects.toThrow(/random counters/);

    const lineageTamper = jsonClone(checkpoint);
    lineageTamper.acceptedState.nextSourceSchedulingInterval.aaIntervalSec += 1e-4;
    await resign(lineageTamper);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(lineageTamper, configuration),
    ).rejects.toThrow(/clock arithmetic|moving-average sum/);

    const signedHistorySplit = jsonClone(checkpoint);
    signedHistorySplit.acceptedState.innovationHistoryNewestFirstSec[0] += 1e-4;
    signedHistorySplit.innovationHistoryNewestFirstSec[0] =
      signedHistorySplit.acceptedState.innovationHistoryNewestFirstSec[0];
    await resign(signedHistorySplit);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(signedHistorySplit, configuration),
    ).rejects.toThrow(
      /innovation history and next-source scheduling lineage split/,
    );

    const signedSourceIdTamper = jsonClone(checkpoint);
    signedSourceIdTamper.acceptedState.nextSourceSchedulingInterval.fromSourceImpulseId +=
      ":forged";
    signedSourceIdTamper.nextSourceSchedulingInterval.fromSourceImpulseId =
      signedSourceIdTamper.acceptedState.nextSourceSchedulingInterval.fromSourceImpulseId;
    await resign(signedSourceIdTamper);
    await expect(
      restoreAcceptedAfAtrialSourceStateV1(signedSourceIdTamper, configuration),
    ).rejects.toThrow(/source impulse id is not canonical/);
  });
});

function makeConfiguration(
  overrides: Partial<{
    seedUint32: number;
    meanSec: number;
    movingAverageCoefficients: readonly number[];
  }> = {},
): AcceptedAfAtrialSourceConfigurationV1 {
  return createAcceptedAfAtrialSourceConfigurationV1({
    configurationId: "AF-checkpoint-configuration",
    ownerInstanceId: "AF-checkpoint-owner",
    sourceId: "AF-atrial-source",
    seedUint32: overrides.seedUint32 ?? 1_337,
    pearsonParentMoments: {
      meanSec: overrides.meanSec ?? 0.155,
      standardDeviationSec: 0.022,
      skewness: 1.1,
      kurtosis: 8,
    },
    movingAverageCoefficients: overrides.movingAverageCoefficients ?? [
      0.82, 0.18,
    ],
  });
}

function initialize(configuration: AcceptedAfAtrialSourceConfigurationV1) {
  return initializeAcceptedAfAtrialSourceStateV1(configuration, {
    acceptedTimeSec: 0,
    firstSourceActivationTimeSec: 0.1,
  });
}

function jsonClone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
