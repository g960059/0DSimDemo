import { describe, expect, it } from "vitest";

import {
  ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedDistalConductionGateStateV1,
  restoreAcceptedDistalConductionGateStateV1,
  type AcceptedDistalConductionGateCheckpointV1,
} from "@/engine/myocardium/rhythm/acceptedDistalConductionGateCheckpointV1";
import {
  commitDistalConductionGateCandidateDecisionV1,
  createDistalConductionGateConfigurationV1,
  evaluateDistalConductionGateCandidateDecisionV1,
  initializeAcceptedDistalConductionGateStateV1,
  type AcceptedDistalConductionGateStateV1,
  type DistalConductionGateConfigurationV1,
} from "@/engine/myocardium/rhythm/acceptedDistalConductionGateV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("accepted distal conduction gate checkpoint V1", () => {
  it("round-trips mask position, distinct drops, readiness, and exact continuation", async () => {
    const configuration = maskConfiguration();
    let state = initialState(configuration);
    state = accept(state, "one", 0.1);
    state = accept(state, "two", 0.15);
    state = accept(state, "three", 0.2);

    expect(state.authoredMaskPosition).toBe(3);
    expect(state.authoredMaskDropCount).toBe(1);
    expect(state.distalRefractoryDropCount).toBe(1);
    const checkpoint = await checkpointAcceptedDistalConductionGateStateV1(state);
    const restored = await restoreAcceptedDistalConductionGateStateV1(
      JSON.parse(JSON.stringify(checkpoint)),
      configuration,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.configuration.modeConfiguration)).toBe(true);
    if (restored.configuration.modeConfiguration.mode === "authored-mask") {
      expect(Object.isFrozen(restored.configuration.modeConfiguration.pattern))
        .toBe(true);
    }
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);

    const originalCandidate = evaluate(state, "four", 0.3);
    const restoredCandidate = evaluate(restored, "four", 0.3);
    expect(restoredCandidate).toEqual(originalCandidate);
    expect(commitDistalConductionGateCandidateDecisionV1(
      restored,
      restoredCandidate,
    )).toEqual(commitDistalConductionGateCandidateDecisionV1(
      state,
      originalCandidate,
    ));
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const configuration = maskConfiguration();
    const checkpoint = await checkpointAcceptedDistalConductionGateStateV1(
      accept(initialState(configuration), "one", 0.1),
    );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badSha,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 2 as 1;
    await resign(badSchema);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badSchema,
      configuration,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true as false;
    await resign(badClaim);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badClaim,
      configuration,
    )).rejects.toThrow(/claim mismatch/);
    expect(ACCEPTED_DISTAL_CONDUCTION_GATE_CHECKPOINT_CLAIM_V1
      .authenticationClaimed).toBe(false);

    const extra = {
      ...checkpoint,
      extra: "not-accepted",
    };
    const { checkpointSha256: _ignored, ...payload } = extra;
    const resignedExtra = {
      ...payload,
      checkpointSha256: await sha256CanonicalJsonHex(payload),
    };
    await expect(restoreAcceptedDistalConductionGateStateV1(
      resignedExtra,
      configuration,
    )).rejects.toThrow(/keys are invalid/);
  });

  it("rejects re-signed counter, readiness, and mask-position tamper", async () => {
    const configuration = maskConfiguration();
    const checkpoint = await checkpointAcceptedDistalConductionGateStateV1(
      accept(initialState(configuration), "one", 0.1),
    );

    const badCounter = jsonClone(checkpoint);
    badCounter.acceptedState.passedArrivalCount += 1;
    await resign(badCounter);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badCounter,
      configuration,
    )).rejects.toThrow(/outcome counters/);

    const badReady = jsonClone(checkpoint);
    badReady.acceptedState.distalReadyAtSec += 0.01;
    await resign(badReady);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badReady,
      configuration,
    )).rejects.toThrow(/ready time is inconsistent/);

    const badMaskPosition = jsonClone(checkpoint);
    badMaskPosition.acceptedState.authoredMaskPosition = 0;
    await resign(badMaskPosition);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      badMaskPosition,
      configuration,
    )).rejects.toThrow(/mask position/);
  });

  it("rejects same IDs with changed complete expected configuration", async () => {
    const configuration = maskConfiguration();
    const checkpoint = await checkpointAcceptedDistalConductionGateStateV1(
      initialState(configuration),
    );
    const changed = createDistalConductionGateConfigurationV1({
      configurationId: configuration.configurationId,
      gateInstanceId: configuration.gateInstanceId,
      parameterProvenance: {
        kind: configuration.parameterProvenance.kind,
        sourceId: configuration.parameterProvenance.sourceId,
      },
      hvConductionDelaySec: 0.06,
      distalEffectiveRefractoryPeriodSec: 0.2,
      modeConfiguration: {
        mode: "authored-mask",
        pattern: [true, false, true],
        repeatPolicy: "repeat",
      },
    });

    await expect(restoreAcceptedDistalConductionGateStateV1(
      checkpoint,
      changed,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects re-signed outer/state clock and configuration splits", async () => {
    const configuration = maskConfiguration();
    const checkpoint = await checkpointAcceptedDistalConductionGateStateV1(
      accept(initialState(configuration), "one", 0.1),
    );

    const clockSplit = jsonClone(checkpoint);
    clockSplit.acceptedTimeSec = 0.2;
    await resign(clockSplit);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      clockSplit,
      configuration,
    )).rejects.toThrow(/clocks split/);

    const configSplit = jsonClone(checkpoint);
    configSplit.configuration.hvConductionDelaySec = 0.06;
    await resign(configSplit);
    await expect(restoreAcceptedDistalConductionGateStateV1(
      configSplit,
      configuration,
    )).rejects.toThrow(/configuration and state split/);
  });
});

function maskConfiguration(): DistalConductionGateConfigurationV1 {
  return createDistalConductionGateConfigurationV1({
    configurationId: "checkpoint-distal-configuration",
    gateInstanceId: "checkpoint-distal-gate",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "checkpoint-component-test-input",
    },
    hvConductionDelaySec: 0.05,
    distalEffectiveRefractoryPeriodSec: 0.2,
    modeConfiguration: {
      mode: "authored-mask",
      pattern: [true, false, true],
      repeatPolicy: "repeat",
    },
  });
}

function initialState(
  configuration: DistalConductionGateConfigurationV1,
): AcceptedDistalConductionGateStateV1 {
  return initializeAcceptedDistalConductionGateStateV1(configuration, {
    acceptedTimeSec: 0,
  });
}

function evaluate(
  state: AcceptedDistalConductionGateStateV1,
  id: string,
  timeSec: number,
) {
  return evaluateDistalConductionGateCandidateDecisionV1(state, {
    proximalAvOutputId: id,
    parentCapturedActivationId: `captured-parent:${id}`,
    proximalArrivalTimeSec: timeSec,
  });
}

function accept(
  state: AcceptedDistalConductionGateStateV1,
  id: string,
  timeSec: number,
): AcceptedDistalConductionGateStateV1 {
  return commitDistalConductionGateCandidateDecisionV1(
    state,
    evaluate(state, id, timeSec),
  );
}

function jsonClone(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
