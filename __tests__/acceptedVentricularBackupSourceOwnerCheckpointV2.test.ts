import { describe, expect, it } from "vitest";

import {
  ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2,
  checkpointAcceptedVentricularBackupSourceStateV2,
  restoreAcceptedVentricularBackupSourceStateV2,
} from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerCheckpointV2";
import {
  commitAcceptedVentricularBackupSourceCandidateV2,
  createAcceptedVentricularBackupSourceConfigurationV2,
  createVentricularBackupSourceResolutionV2,
  evaluateAcceptedVentricularBackupSourceCandidateV2,
  evaluateVentricularBackupSourceProposalV2,
  initializeAcceptedVentricularBackupSourceStateV2,
  type AcceptedVentricularBackupSourceConfigurationV2,
} from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";
import {
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";

describe("accepted ventricular backup source owner checkpoint V2", () => {
  it("round-trips the exact full state into detached recursive immutability", async () => {
    const configuration = config();
    const initial = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const proposal = evaluateVentricularBackupSourceProposalV2(initial, 0.8);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const advanced = commitAcceptedVentricularBackupSourceCandidateV2(
      initial,
      evaluateAcceptedVentricularBackupSourceCandidateV2(
        initial,
        proposal,
        resolution,
      ),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(
      advanced,
    );
    const parsed = JSON.parse(JSON.stringify(checkpoint));
    const restored = await restoreAcceptedVentricularBackupSourceStateV2(
      parsed,
      configuration,
    );

    expect(restored).toEqual(advanced);
    expect(restored).not.toBe(advanced);
    expect(restored.configuration).not.toBe(configuration);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.configuration)).toBe(true);
    expect(Object.isFrozen(restored.configuration.parameterProvenance)).toBe(true);
    expect(Object.isFrozen(restored.lastVviPacingAttemptResult!)).toBe(true);
    expect(checkpoint.exactResumeClaim.authenticationClaimed).toBe(false);
  });

  it("rejects payload mutation under the original SHA-256", async () => {
    const configuration = config();
    const state = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(state);
    const tampered = JSON.parse(JSON.stringify(checkpoint));
    tampered.acceptedState.nextVviPaceDueTimeSec += 0.01;

    await expect(restoreAcceptedVentricularBackupSourceStateV2(
      tampered,
      configuration,
    )).rejects.toThrow(/SHA-256 mismatch/);
  });

  it("round-trips external pacing feedback without converting it to owned VVI", async () => {
    const configuration = config();
    const initial = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const proposal = evaluateVentricularBackupSourceProposalV2(initial, 0.5);
    const externalPacing = capturedExternalPacing(0.5);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: externalPacing,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const advanced = commitAcceptedVentricularBackupSourceCandidateV2(
      initial,
      evaluateAcceptedVentricularBackupSourceCandidateV2(
        initial,
        proposal,
        resolution,
      ),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(
      advanced,
    );
    const restored = await restoreAcceptedVentricularBackupSourceStateV2(
      JSON.parse(JSON.stringify(checkpoint)),
      configuration,
    );

    expect(restored).toEqual(advanced);
    expect(restored.acceptedVentricularCaptureFeedbackCount).toBe(1);
    expect(restored.vviPacingAttemptCount).toBe(0);
    expect(restored.vviPacingCapturedCount).toBe(0);
    expect(restored.lastAcceptedVentricularActivation?.sourceKind)
      .toBe("pacing");
    expect(restored.lastAcceptedVentricularActivation?.sourceId)
      .toBe("external-authored-pacing");
  });

  it("rejects complete expected-configuration mismatch rather than matching IDs", async () => {
    const configuration = config();
    const state = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(state);
    const sameIdsDifferentRate = createAcceptedVentricularBackupSourceConfigurationV2({
      configurationId: configuration.configurationId,
      ownerInstanceId: configuration.ownerInstanceId,
      parameterProvenance: {
        kind: configuration.parameterProvenance.kind,
        sourceId: configuration.parameterProvenance.sourceId,
      },
      intrinsicEscapeSourceId: configuration.intrinsicEscapeSourceId,
      intrinsicEscapeCycleLengthSec: configuration.intrinsicEscapeCycleLengthSec,
      vviPacingSourceId: configuration.vviPacingSourceId,
      vviLowerRateLimitPerMin: 55,
    });

    await expect(restoreAcceptedVentricularBackupSourceStateV2(
      checkpoint,
      sameIdsDifferentRate,
    )).rejects.toThrow(/expected configuration mismatch/);
  });

  it("rejects claim substitution even with a recomputed unkeyed digest", async () => {
    const configuration = config();
    const state = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(state);
    const replacement = JSON.parse(JSON.stringify(checkpoint));
    replacement.exactResumeClaim.captureClaimed = true;
    delete replacement.checkpointSha256;
    replacement.checkpointSha256 = await sha256CanonicalJsonHex(replacement);

    await expect(restoreAcceptedVentricularBackupSourceStateV2(
      replacement,
      configuration,
    )).rejects.toThrow(/claim mismatch/);
    expect(ACCEPTED_VENTRICULAR_BACKUP_SOURCE_OWNER_CHECKPOINT_CLAIM_V2
      .authenticationClaimed).toBe(false);
  });

  it("cross-checks duplicated outer clocks after valid rehash", async () => {
    const configuration = config();
    const state = initializeAcceptedVentricularBackupSourceStateV2(
      configuration,
      initialInput(),
    );
    const checkpoint = await checkpointAcceptedVentricularBackupSourceStateV2(state);
    const replacement = JSON.parse(JSON.stringify(checkpoint));
    replacement.nextIntrinsicEscapeDueTimeSec += 0.1;
    delete replacement.checkpointSha256;
    replacement.checkpointSha256 = await sha256CanonicalJsonHex(replacement);

    await expect(restoreAcceptedVentricularBackupSourceStateV2(
      replacement,
      configuration,
    )).rejects.toThrow(/outer and accepted clocks split/);
  });
});

function config(): AcceptedVentricularBackupSourceConfigurationV2 {
  return createAcceptedVentricularBackupSourceConfigurationV2({
    configurationId: "checkpoint-backup-config",
    ownerInstanceId: "checkpoint-backup-owner",
    parameterProvenance: {
      kind: "authored",
      sourceId: "checkpoint-test",
    },
    intrinsicEscapeSourceId: "escape-source",
    intrinsicEscapeCycleLengthSec: 2,
    vviPacingSourceId: "vvi-source",
    vviLowerRateLimitPerMin: 60,
  });
}

function initialInput() {
  return {
    acceptedTimeSec: 0,
    priorAcceptedVentricularCapture: {
      capturedActivationId: "prior-v-capture",
      parentSourceImpulseId: "prior-v-impulse",
      sourceKind: "av-output" as const,
      sourceId: "prior-av",
      sourceSequence: 0,
      activationTimeSec: -0.2,
    },
  } as const;
}

function capturedExternalPacing(timeSec: number) {
  const captureConfiguration =
    createAcceptedElectricalCaptureOwnerConfigurationV2({
      configurationId: "checkpoint-external-pacing-capture-config",
      ownerInstanceId: "checkpoint-external-pacing-capture-owner",
      atrialGate: {
        gateInstanceId: "checkpoint-external-pacing-atrial-gate",
        refractoryPeriodSec: 0.2,
      },
      ventricularGate: {
        gateInstanceId: "checkpoint-external-pacing-ventricular-gate",
        refractoryPeriodSec: 0.25,
      },
    });
  const captureState = initializeAcceptedElectricalCaptureOwnerStateV2(
    captureConfiguration,
    {
      acceptedTimeSec: 0,
      atrialPriorCapture: null,
      ventricularPriorCapture: null,
    },
  );
  const impulse = createSourceImpulseV2({
    sourceImpulseId: "checkpoint-external-authored-pacing-impulse-0",
    parentCapturedActivationId: null,
    chamber: "ventricular",
    sourceKind: "pacing",
    sourceId: "external-authored-pacing",
    sourceSequence: 0,
    activationTimeSec: timeSec,
  });
  const activation = evaluateAcceptedElectricalCaptureBatchCandidateV2(
    captureState,
    { candidateTimeSec: timeSec, sourceImpulses: [impulse] },
  ).capturedActivations[0];
  if (activation === undefined) {
    throw new Error("external pacing test impulse did not capture");
  }
  return activation;
}
