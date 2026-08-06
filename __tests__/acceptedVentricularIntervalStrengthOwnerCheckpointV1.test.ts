import { describe, expect, it } from "vitest";

import {
  ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1,
  checkpointAcceptedVentricularIntervalStrengthStateV1,
  restoreAcceptedVentricularIntervalStrengthStateV1,
} from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerCheckpointV1";
import {
  commitAcceptedVentricularIntervalStrengthCandidateV1,
  createAcceptedVentricularIntervalStrengthConfigurationV1,
  evaluateAcceptedVentricularIntervalStrengthCandidateV1,
  initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1,
  type AcceptedVentricularIntervalStrengthConfigurationV1,
  type AcceptedVentricularIntervalStrengthStateV1,
} from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("accepted ventricular interval-strength checkpoint V1", () => {
  it("round-trips full SR-load state and resumes exactly", async () => {
    const config = configuration();
    const state = accept(initialState(config), capture("first", 0.2, 2));
    const checkpoint = await checkpointAcceptedVentricularIntervalStrengthStateV1(
      state,
    );
    const restored = await restoreAcceptedVentricularIntervalStrengthStateV1(
      jsonClone(checkpoint),
      config,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.lastAcceptedVentricularActivation)).toBe(true);
    expect(Object.isFrozen(restored.lastDepositMetadata)).toBe(true);
    expect(Object.isFrozen(
      restored.lastDepositMetadata?.capturedVentricularActivation,
    )).toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);

    const next = capture("second", 1.1, 3);
    const originalCandidate = evaluate(state, next);
    const restoredCandidate = evaluate(restored, next);
    expect(restoredCandidate).toEqual(originalCandidate);
    expect(accept(restored, next)).toEqual(accept(state, next));
  });

  it("rejects SHA, schema, exact-claim, and unknown-key tamper", async () => {
    const config = configuration();
    const checkpoint = await checkpointAcceptedVentricularIntervalStrengthStateV1(
      accept(initialState(config), capture("first", 0.2, 2)),
    );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      badSha,
      config,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 2;
    await resign(badSchema);
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      badSchema,
      config,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      badClaim,
      config,
    )).rejects.toThrow(/claim mismatch/);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CHECKPOINT_CLAIM_V1
      .authenticationClaimed).toBe(false);

    const extra = { ...checkpoint, extra: "not-accepted" };
    const { checkpointSha256: _ignored, ...payload } = extra;
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      { ...payload, checkpointSha256: await sha256CanonicalJsonHex(payload) },
      config,
    )).rejects.toThrow(/keys are invalid/);
  });

  it("rejects re-signed state equation, lineage, and outer-clock tamper", async () => {
    const config = configuration();
    const checkpoint = await checkpointAcceptedVentricularIntervalStrengthStateV1(
      accept(initialState(config), capture("first", 0.2, 2)),
    );

    const badLoad = jsonClone(checkpoint);
    badLoad.acceptedState.normalizedSrLoadState += 0.1;
    await resign(badLoad);
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      badLoad,
      config,
    )).rejects.toThrow(/state and last deposit metadata split/);

    const badLineage = jsonClone(checkpoint);
    badLineage.acceptedState.lastAcceptedVentricularActivation
      .capturedActivationId = "captured:other";
    await resign(badLineage);
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      badLineage,
      config,
    )).rejects.toThrow(/state and last deposit metadata split/);

    const clockSplit = jsonClone(checkpoint);
    clockSplit.acceptedTimeSec += 0.1;
    await resign(clockSplit);
    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      clockSplit,
      config,
    )).rejects.toThrow(/outer and accepted clocks split/);
  });

  it("binds the complete expected parameterization, not IDs alone", async () => {
    const config = configuration();
    const checkpoint = await checkpointAcceptedVentricularIntervalStrengthStateV1(
      initialState(config),
    );
    const changed = createAcceptedVentricularIntervalStrengthConfigurationV1({
      configurationId: config.configurationId,
      ownerInstanceId: config.ownerInstanceId,
      parameterProvenance: {
        kind: config.parameterProvenance.kind,
        sourceId: config.parameterProvenance.sourceId,
      },
      recoveryTimeConstantSec: 0.8,
      releaseFractionBeta: config.releaseFractionBeta,
      releasedLoadReturnFractionR: config.releasedLoadReturnFractionR,
      intervalInfluxInhibitionFractionH:
        config.intervalInfluxInhibitionFractionH,
      referenceCycleLengthSec: config.referenceCycleLengthSec,
    });

    await expect(restoreAcceptedVentricularIntervalStrengthStateV1(
      checkpoint,
      changed,
    )).rejects.toThrow(/expected configuration mismatch/);
  });
});

function configuration(): AcceptedVentricularIntervalStrengthConfigurationV1 {
  return createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: "checkpoint-interval-strength-configuration",
    ownerInstanceId: "checkpoint-interval-strength-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "checkpoint-focused-component-test-input",
    },
    recoveryTimeConstantSec: 0.765,
    releaseFractionBeta: 0.5,
    releasedLoadReturnFractionR: 0.75,
    intervalInfluxInhibitionFractionH: 0.27,
    referenceCycleLengthSec: 1,
  });
}

function initialState(
  config: AcceptedVentricularIntervalStrengthConfigurationV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  return initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
    config,
    {
      acceptedTimeSec: 0,
      priorAcceptedVentricularActivation: capture("history", -1, 1),
    },
  );
}

function evaluate(
  state: AcceptedVentricularIntervalStrengthStateV1,
  activation: CapturedElectricalActivationV2,
) {
  return evaluateAcceptedVentricularIntervalStrengthCandidateV1(state, {
    acceptedVentricularActivation: activation,
  });
}

function accept(
  state: AcceptedVentricularIntervalStrengthStateV1,
  activation: CapturedElectricalActivationV2,
): AcceptedVentricularIntervalStrengthStateV1 {
  return commitAcceptedVentricularIntervalStrengthCandidateV1(
    state,
    evaluate(state, activation),
  );
}

function capture(
  id: string,
  timeSec: number,
  ordinal: number,
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2,
    capturedActivationId: `captured:${id}`,
    parentSourceImpulseId: `impulse:${id}`,
    upstreamCapturedActivationId: `atrial:${id}`,
    chamber: "ventricular",
    gateInstanceId: "ventricular-capture-gate",
    activationTimeSec: timeSec,
    sourceKind: "av-output",
    sourceId: "distal-gate",
    sourceSequence: ordinal,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2["av-output"],
    captureOrdinal: ordinal,
    ownerRevision: ordinal,
  });
}

function jsonClone(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
