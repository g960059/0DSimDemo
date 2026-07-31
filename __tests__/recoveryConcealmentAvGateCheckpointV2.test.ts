import { describe, expect, it } from "vitest";

import {
  RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2,
  checkpointRecoveryConcealmentAvGateStateV2,
  restoreRecoveryConcealmentAvGateStateV2,
  type RecoveryConcealmentAvGateCheckpointV2,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateCheckpointV2";
import {
  commitRecoveryConcealmentAvGateCandidateDecisionV2,
  createRecoveryConcealmentAvGateConfigurationV2,
  evaluateRecoveryConcealmentAvGateCandidateDecisionV2,
  initializeRecoveryConcealmentAvGateStateV2,
  type RecoveryConcealmentAvGateAcceptedStateV2,
  type RecoveryConcealmentAvGateConfigurationV2,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV2";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("recovery/concealment proximal AV checkpoint V2", () => {
  it("round-trips the input clock, concealed refractory state, and exact continuation", async () => {
    const configuration = makeConfiguration();
    let state = initializeRecoveryConcealmentAvGateStateV2(configuration, {
      acceptedAtrialActivationTimeSec: 0,
    });
    state = accept(state, "first", 0);
    state = accept(state, "concealed", 0.1);
    const checkpoint = await checkpointRecoveryConcealmentAvGateStateV2(
      state,
    );
    const restored = await restoreRecoveryConcealmentAvGateStateV2(
      JSON.parse(JSON.stringify(checkpoint)),
      configuration,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.configuration.parameterProvenance))
      .toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);
    expect(checkpoint.exactResumeClaim.ventricularActivationCheckpointClaimed)
      .toBe(false);

    const nextTime = restored.proximalAvRefractoryUntilSec;
    const originalCandidate = evaluate(state, "next", nextTime);
    const restoredCandidate = evaluate(restored, "next", nextTime);
    expect(restoredCandidate).toEqual(originalCandidate);
    expect(commitRecoveryConcealmentAvGateCandidateDecisionV2(
      restored,
      restoredCandidate,
    )).toEqual(commitRecoveryConcealmentAvGateCandidateDecisionV2(
      state,
      originalCandidate,
    ));
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointRecoveryConcealmentAvGateStateV2(
      accept(initial(configuration), "first", 0),
    );

    const badSha = clone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      badSha,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = clone(checkpoint);
    badSchema.schemaVersion = 1 as 2;
    await resign(badSchema);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      badSchema,
      configuration,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = clone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true as false;
    await resign(badClaim);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      badClaim,
      configuration,
    )).rejects.toThrow(/claim mismatch/);
    expect(RECOVERY_CONCEALMENT_AV_GATE_CHECKPOINT_CLAIM_V2
      .authenticationClaimed).toBe(false);

    const extra = { ...checkpoint, ventricularActivationTimeSec: 1 };
    const { checkpointSha256: _old, ...payload } = extra;
    const resignedExtra = {
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    };
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      resignedExtra,
      configuration,
    )).rejects.toThrow(/keys/);
  });

  it("rejects re-signed counter and proximal-output/refractory inconsistency", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointRecoveryConcealmentAvGateStateV2(
      accept(initial(configuration), "first", 0),
    );

    const badCounter = clone(checkpoint);
    badCounter.acceptedState.blockedAtrialActivationCount += 1;
    await resign(badCounter);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      badCounter,
      configuration,
    )).rejects.toThrow(/counters/);

    const badOutput = clone(checkpoint);
    badOutput.acceptedState.lastProximalAvOutputTimeSec! += 1;
    await resign(badOutput);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      badOutput,
      configuration,
    )).rejects.toThrow(/refractory boundary/);
  });

  it("rejects same IDs with changed complete expected configuration", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointRecoveryConcealmentAvGateStateV2(
      initial(configuration),
    );
    const changed = createRecoveryConcealmentAvGateConfigurationV2({
      configurationId: configuration.configurationId,
      proximalAvOwnerInstanceId: configuration.proximalAvOwnerInstanceId,
      parameterProvenance: {
        kind: configuration.parameterProvenance.kind,
        sourceId: configuration.parameterProvenance.sourceId,
      },
      minimumProximalAvConductionDelaySec: 0.11,
      proximalAvRecoveryDelayAmplitudeSec:
        configuration.proximalAvRecoveryDelayAmplitudeSec,
      proximalAvRecoveryTimeConstantSec:
        configuration.proximalAvRecoveryTimeConstantSec,
      postProximalAvOutputRefractorySec:
        configuration.postProximalAvOutputRefractorySec,
      concealedProximalAvRefractoryExtensionSec:
        configuration.concealedProximalAvRefractoryExtensionSec,
    });

    await expect(restoreRecoveryConcealmentAvGateStateV2(
      checkpoint,
      changed,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects re-signed outer/state input-clock and configuration splits", async () => {
    const configuration = makeConfiguration();
    const checkpoint = await checkpointRecoveryConcealmentAvGateStateV2(
      accept(initial(configuration), "first", 0),
    );

    const clockSplit = clone(checkpoint);
    clockSplit.acceptedAtrialActivationTimeSec = 0.1;
    await resign(clockSplit);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      clockSplit,
      configuration,
    )).rejects.toThrow(/clocks split/);

    const configurationSplit = clone(checkpoint);
    configurationSplit.configuration.minimumProximalAvConductionDelaySec
      += 0.01;
    await resign(configurationSplit);
    await expect(restoreRecoveryConcealmentAvGateStateV2(
      configurationSplit,
      configuration,
    )).rejects.toThrow(/configuration and accepted state split/);
  });
});

function makeConfiguration(): RecoveryConcealmentAvGateConfigurationV2 {
  return createRecoveryConcealmentAvGateConfigurationV2({
    configurationId: "checkpoint-proximal-av-configuration",
    proximalAvOwnerInstanceId: "checkpoint-proximal-av-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "checkpoint-proximal-av-unit-input",
    },
    minimumProximalAvConductionDelaySec: 0.1,
    proximalAvRecoveryDelayAmplitudeSec: 0.08,
    proximalAvRecoveryTimeConstantSec: 0.5,
    postProximalAvOutputRefractorySec: 0.2,
    concealedProximalAvRefractoryExtensionSec: 0.1,
  });
}

function initial(
  configuration: RecoveryConcealmentAvGateConfigurationV2,
): RecoveryConcealmentAvGateAcceptedStateV2 {
  return initializeRecoveryConcealmentAvGateStateV2(configuration, {
    acceptedAtrialActivationTimeSec: 0,
  });
}

function evaluate(
  state: RecoveryConcealmentAvGateAcceptedStateV2,
  id: string,
  timeSec: number,
) {
  return evaluateRecoveryConcealmentAvGateCandidateDecisionV2(state, {
    atrialActivationId: id,
    atrialActivationTimeSec: timeSec,
  });
}

function accept(
  state: RecoveryConcealmentAvGateAcceptedStateV2,
  id: string,
  timeSec: number,
): RecoveryConcealmentAvGateAcceptedStateV2 {
  return commitRecoveryConcealmentAvGateCandidateDecisionV2(
    state,
    evaluate(state, id, timeSec),
  );
}

function clone(value: RecoveryConcealmentAvGateCheckpointV2): any {
  return JSON.parse(JSON.stringify(value));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
