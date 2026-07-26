import { describe, expect, it } from "vitest";

import {
  ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2,
  checkpointAcceptedElectricalCaptureOwnerStateV2,
  restoreAcceptedElectricalCaptureOwnerStateV2,
  type AcceptedElectricalCaptureOwnerCheckpointV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerCheckpointV2";
import {
  commitAcceptedElectricalCaptureBatchCandidateV2,
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  type AcceptedElectricalCaptureOwnerConfigurationV2,
  type AcceptedElectricalCaptureOwnerStateV2,
  type ElectricalCaptureChamberV2,
  type ElectricalImpulseSourceKindV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";

describe("accepted electrical capture owner checkpoint V2", () => {
  it("round-trips mixed A/V capture and refractory block with exact continuation", async () => {
    const configuration = captureConfiguration();
    let state = initialState(configuration);
    state = acceptBatch(state, 0.1, [
      impulse("a-primary-1", "atrial", "primary-intrinsic", "sinus", 1, 0.1),
      impulse(
        "v-av-1",
        "ventricular",
        "av-output",
        "av-gate",
        1,
        0.1,
        "checkpoint-capture-owner:batch:1:atrial:capture:a-primary-1",
      ),
    ]);
    state = acceptBatch(state, 0.2, [
      impulse("a-early", "atrial", "authored-ectopy", "a-ectopy", 1, 0.2),
      impulse("v-early", "ventricular", "authored-ectopy", "v-ectopy", 1, 0.2),
    ]);

    expect(state.atrialGate.refractoryBlockedCount).toBe(1);
    expect(state.ventricularGate.refractoryBlockedCount).toBe(1);
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      state,
    );
    const parsed = JSON.parse(JSON.stringify(checkpoint)) as unknown;
    const restored = await restoreAcceptedElectricalCaptureOwnerStateV2(
      parsed,
      configuration,
    );

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.configuration.atrialGate)).toBe(true);
    expect(Object.isFrozen(restored.atrialGate)).toBe(true);
    expect(Object.isFrozen(restored.ventricularGate)).toBe(true);
    expect(checkpoint.exactResumeClaim.captureOwnerSemantics
      .hardFailureBatchBound).toBe(4_096);
    expect(checkpoint.exactResumeClaim.captureOwnerSemantics
      .sourceRouteSemantics.avOutput)
      .toBe("ventricular-myocardium-with-required-parent-atrial-capture");

    const continuationImpulses = [
      impulse("a-primary-2", "atrial", "primary-intrinsic", "sinus", 2, 0.4),
      impulse(
        "v-av-2",
        "ventricular",
        "av-output",
        "av-gate",
        2,
        0.4,
        "checkpoint-capture-owner:batch:3:atrial:capture:a-primary-2",
      ),
    ];
    const originalContinuation = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      state,
      { candidateTimeSec: 0.4, sourceImpulses: continuationImpulses },
    );
    const restoredContinuation = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      restored,
      { candidateTimeSec: 0.4, sourceImpulses: continuationImpulses },
    );
    expect(restoredContinuation).toEqual(originalContinuation);
    expect(commitAcceptedElectricalCaptureBatchCandidateV2(
      restored,
      restoredContinuation,
    )).toEqual(commitAcceptedElectricalCaptureBatchCandidateV2(
      state,
      originalContinuation,
    ));
  });

  it("rejects SHA, schema, and claim tamper", async () => {
    const configuration = captureConfiguration();
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      acceptBatch(initialState(configuration), 0.1, [
        impulse("a", "atrial", "primary-intrinsic", "sinus", 1, 0.1),
      ]),
    );

    const badSha = jsonClone(checkpoint);
    badSha.checkpointSha256 = `${badSha.checkpointSha256[0] === "0" ? "1" : "0"}${badSha.checkpointSha256.slice(1)}`;
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badSha,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const badSchema = jsonClone(checkpoint);
    badSchema.schemaVersion = 3;
    await resign(badSchema);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badSchema,
      configuration,
    )).rejects.toThrow(/unsupported.*schema/);

    const badClaim = jsonClone(checkpoint);
    badClaim.exactResumeClaim.authenticationClaimed = true;
    await resign(badClaim);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badClaim,
      configuration,
    )).rejects.toThrow(/claim mismatch/);
    expect(ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CHECKPOINT_CLAIM_V2
      .authenticationClaimed).toBe(false);
  });

  it("rejects re-signed nested counter and refractory tamper", async () => {
    const configuration = captureConfiguration();
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      acceptBatch(initialState(configuration), 0.1, [
        impulse("a", "atrial", "primary-intrinsic", "sinus", 1, 0.1),
        impulse("v", "ventricular", "pacing", "v-pacer", 1, 0.1),
      ]),
    );

    const badCounter = jsonClone(checkpoint);
    badCounter.acceptedState.atrialGate.processedImpulseCount += 1;
    await resign(badCounter);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badCounter,
      configuration,
    )).rejects.toThrow(/outcome counters/);

    const badCoupledCounter = jsonClone(checkpoint);
    badCoupledCounter.acceptedState.atrialGate.revision = 2;
    badCoupledCounter.acceptedState.atrialGate.acceptedBatchCount = 2;
    badCoupledCounter.acceptedState.atrialGate.processedImpulseCount = 2;
    badCoupledCounter.acceptedState.atrialGate.capturedActivationCount = 2;
    await resign(badCoupledCounter);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badCoupledCounter,
      configuration,
    )).rejects.toThrow(/chamber batch counts cannot exceed owner/);

    const badRefractory = jsonClone(checkpoint);
    badRefractory.acceptedState.ventricularGate.refractoryUntilSec += 0.01;
    await resign(badRefractory);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      badRefractory,
      configuration,
    )).rejects.toThrow(/refractory boundary is inconsistent/);
  });

  it("rejects an exact-ID but changed expected configuration", async () => {
    const configuration = captureConfiguration();
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      initialState(configuration),
    );
    const sameIdsChangedContent = captureConfiguration({
      ventricularRefractoryPeriodSec: 0.3,
    });

    expect(sameIdsChangedContent.configurationId)
      .toBe(configuration.configurationId);
    expect(sameIdsChangedContent.ownerInstanceId)
      .toBe(configuration.ownerInstanceId);
    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      checkpoint,
      sameIdsChangedContent,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects a re-signed outer/accepted clock split", async () => {
    const configuration = captureConfiguration();
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      acceptBatch(initialState(configuration), 0.1, [
        impulse("a", "atrial", "primary-intrinsic", "sinus", 1, 0.1),
      ]),
    );
    const split = jsonClone(checkpoint);
    split.acceptedTimeSec = 0.2;
    await resign(split);

    await expect(restoreAcceptedElectricalCaptureOwnerStateV2(
      split,
      configuration,
    )).rejects.toThrow(/clocks split/);
  });

  it("resumes exactly at refractory equality and captures", async () => {
    const configuration = captureConfiguration();
    let state = acceptBatch(initialState(configuration), 0.1, [
      impulse("a-first", "atrial", "primary-intrinsic", "sinus", 1, 0.1),
    ]);
    state = acceptBatch(state, 0.2, []);
    const boundaryTimeSec = state.atrialGate.refractoryUntilSec;
    const checkpoint = await checkpointAcceptedElectricalCaptureOwnerStateV2(
      state,
    );
    const restored = await restoreAcceptedElectricalCaptureOwnerStateV2(
      JSON.parse(JSON.stringify(checkpoint)),
      configuration,
    );
    const boundaryImpulse = impulse(
      "a-boundary",
      "atrial",
      "primary-intrinsic",
      "sinus",
      2,
      boundaryTimeSec,
    );
    const original = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec: boundaryTimeSec,
      sourceImpulses: [boundaryImpulse],
    });
    const resumed = evaluateAcceptedElectricalCaptureBatchCandidateV2(restored, {
      candidateTimeSec: boundaryTimeSec,
      sourceImpulses: [boundaryImpulse],
    });

    expect(resumed).toEqual(original);
    expect(resumed.decisions[0]?.outcome).toBe("captured");
    expect(commitAcceptedElectricalCaptureBatchCandidateV2(restored, resumed))
      .toEqual(commitAcceptedElectricalCaptureBatchCandidateV2(state, original));
  });
});

function captureConfiguration(overrides: Readonly<{
  ventricularRefractoryPeriodSec?: number;
}> = {}): AcceptedElectricalCaptureOwnerConfigurationV2 {
  return createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: "checkpoint-capture-configuration-v2",
    ownerInstanceId: "checkpoint-capture-owner",
    atrialGate: {
      gateInstanceId: "checkpoint-atrial-gate",
      refractoryPeriodSec: 0.25,
    },
    ventricularGate: {
      gateInstanceId: "checkpoint-ventricular-gate",
      refractoryPeriodSec:
        overrides.ventricularRefractoryPeriodSec ?? 0.25,
    },
  });
}

function initialState(
  configuration: AcceptedElectricalCaptureOwnerConfigurationV2,
): AcceptedElectricalCaptureOwnerStateV2 {
  return initializeAcceptedElectricalCaptureOwnerStateV2(configuration, {
    acceptedTimeSec: 0,
    atrialPriorCapture: null,
    ventricularPriorCapture: null,
  });
}

function acceptBatch(
  state: AcceptedElectricalCaptureOwnerStateV2,
  candidateTimeSec: number,
  sourceImpulses: readonly SourceImpulseV2[],
): AcceptedElectricalCaptureOwnerStateV2 {
  return commitAcceptedElectricalCaptureBatchCandidateV2(
    state,
    evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec,
      sourceImpulses,
    }),
  );
}

function impulse(
  sourceImpulseId: string,
  chamber: ElectricalCaptureChamberV2,
  sourceKind: ElectricalImpulseSourceKindV2,
  sourceId: string,
  sourceSequence: number,
  activationTimeSec: number,
  parentCapturedActivationId: string | null = null,
): SourceImpulseV2 {
  return createSourceImpulseV2({
    sourceImpulseId,
    parentCapturedActivationId,
    chamber,
    sourceKind,
    sourceId,
    sourceSequence,
    activationTimeSec,
  });
}

function jsonClone(
  checkpoint: AcceptedElectricalCaptureOwnerCheckpointV2,
): any {
  return JSON.parse(JSON.stringify(checkpoint));
}

async function resign(checkpoint: any): Promise<void> {
  const { checkpointSha256: _discarded, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
