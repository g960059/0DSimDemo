import { describe, expect, it } from "vitest";

import {
  ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2,
  commitAcceptedVentricularBackupSourceCandidateV2,
  createAcceptedVentricularBackupSourceConfigurationV2,
  createVentricularBackupSourceResolutionV2,
  evaluateAcceptedVentricularBackupSourceCandidateV2,
  evaluateVentricularBackupSourceProposalV2,
  initializeAcceptedVentricularBackupSourceStateV2,
  maximumAcceptedVentricularBackupSourceStepV2,
  rollbackAcceptedVentricularBackupSourceCandidateV2,
  validateAcceptedVentricularBackupSourceStateV2,
  type AcceptedVentricularBackupSourceConfigurationV2,
  type AcceptedVentricularBackupSourceStateV2,
  type VentricularBackupSourceProposalV2,
} from "@/engine/myocardium/rhythm/acceptedVentricularBackupSourceOwnerV2";
import {
  commitAcceptedElectricalCaptureBatchCandidateV2,
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  rollbackAcceptedElectricalCaptureBatchCandidateV2,
  type CapturedElectricalActivationV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";

describe("accepted ventricular backup source owner V2", () => {
  it("uses only explicit parameters, derives LRI=60/LRL, and accepts signed history", () => {
    const configuration = config({ escapeCycleSec: 1.1, lowerRatePerMin: 50 });
    const state = initialize(configuration, -0.25);

    expect(configuration.vviLowerRateIntervalSec).toBe(1.2);
    expect(state.initialCaptureSeed.activationTimeSec).toBe(-0.25);
    expect(state.nextIntrinsicEscapeDueTimeSec).toBeCloseTo(0.85, 14);
    expect(state.nextVviPaceDueTimeSec).toBeCloseTo(0.95, 14);
    expect(ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2.parameters)
      .toBe("explicit-only-with-no-hidden-clinical-defaults");
    expect(ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2.captureClaimed)
      .toBe(false);
  });

  it("clips at the earliest due owner clock and exposes simultaneous due flags", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 60 }));
    const clipped = maximumAcceptedVentricularBackupSourceStepV2(state, 2);

    expect(clipped).toMatchObject({
      maximumStepSec: 0.8,
      candidateTimeSec: 0.8,
      clippedByDueTime: true,
      boundaryDueTimeSec: 0.8,
      intrinsicEscapeDueAtBoundary: true,
      vviPaceDueAtBoundary: true,
    });
    expect(() => evaluateVentricularBackupSourceProposalV2(state, 0.81))
      .toThrow(/may not cross earliest due time/);
  });

  it("emits intrinsic escape at due time and advances it after failed capture", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 30 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(proposal.sourceImpulsesForNonVviBatch).toHaveLength(1);
    expect(proposal.sourceImpulsesForNonVviBatch[0]).toMatchObject({
      chamber: "ventricular",
      sourceKind: "escape",
      sourceSequence: 0,
      activationTimeSec: 0.8,
    });
    expect(resolution.sourceAttemptResults).toEqual([
      expect.objectContaining({
        sourceKind: "escape",
        outcome: "not-captured",
        capturedActivationId: null,
      }),
    ]);
    expect(candidate.candidateState.nextIntrinsicEscapeDueTimeSec).toBe(1.8);
    expect(candidate.candidateState.nextVviPaceDueTimeSec).toBe(1.8);
    expect(candidate.candidateState.acceptedVentricularCaptureFeedbackCount).toBe(0);
  });

  it("keys a captured escape result to both source impulse and activation lineage", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 30 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const escape = proposal.sourceImpulsesForNonVviBatch[0]!;
    const activation = capturedFrom(escape);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: activation,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const accepted = commitAcceptedVentricularBackupSourceCandidateV2(
      state,
      evaluateAcceptedVentricularBackupSourceCandidateV2(state, proposal, resolution),
    );

    expect(resolution.sourceAttemptResults[0]).toMatchObject({
      sourceImpulseId: escape.sourceImpulseId,
      sourceKind: "escape",
      outcome: "captured",
      capturedActivationId: activation.capturedActivationId,
    });
    expect(accepted.intrinsicEscapeCapturedCount).toBe(1);
    expect(accepted.acceptedVentricularCaptureFeedbackCount).toBe(1);
    expect(accepted.lastAcceptedVentricularActivation)
      .toEqual(activation);
  });

  it("resets both clocks only from an actually accepted external ventricular capture", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 30 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.5);
    expect(proposal.sourceImpulsesForNonVviBatch).toEqual([]);
    const external = capturedFrom(avOutputImpulse(0.5));
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: external,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(candidate.candidateState.nextIntrinsicEscapeDueTimeSec).toBe(2.5);
    expect(candidate.candidateState.nextVviPaceDueTimeSec).toBe(2.5);
    expect(candidate.candidateState.intrinsicEscapeAttemptCount).toBe(0);
    expect(candidate.candidateState.vviPacingAttemptCount).toBe(0);
  });

  it("inhibits due VVI after a non-VVI capture and records no pacing attempt", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const external = capturedFrom(avOutputImpulse(0.8));
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: external,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(proposal.vviPaceDue).toBe(true);
    expect(proposal.conditionalVviPacingSourceImpulse?.sourceKind).toBe("pacing");
    expect(resolution.conditionalVviPacingAttempted).toBe(false);
    expect(resolution.sourceAttemptResults).toEqual([]);
    expect(candidate.candidateState.vviPacingAttemptCount).toBe(0);
    expect(candidate.candidateState.nextVviPaceDueTimeSec).toBe(1.8);
  });

  it("uses exact lineage to accept externally owned pacing as non-VVI feedback", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const authoredPacing = capturedFrom(createSourceImpulseV2({
      sourceImpulseId: "authored-pacing-impulse-0",
      parentCapturedActivationId: null,
      chamber: "ventricular",
      sourceKind: "pacing",
      sourceId: "authored-pacing-replay",
      sourceSequence: 0,
      activationTimeSec: 0.8,
    }));
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: authoredPacing,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );
    const committed = commitAcceptedVentricularBackupSourceCandidateV2(
      state,
      candidate,
    );

    expect(resolution.acceptedCapturePhase).toBe("non-vvi");
    expect(resolution.conditionalVviPacingAttempted).toBe(false);
    expect(resolution.sourceAttemptResults).toEqual([]);
    expect(candidate.candidateState.vviPacingAttemptCount).toBe(0);
    expect(rollbackAcceptedVentricularBackupSourceCandidateV2(
      state,
      candidate,
    )).toBe(state);
    expect(committed.acceptedVentricularCaptureFeedbackCount).toBe(1);
    expect(committed.lastAcceptedVentricularActivation)
      .toEqual(authoredPacing);
    expect(ACCEPTED_VENTRICULAR_BACKUP_SOURCE_CLAIM_V2
      .externalPacingFeedback.distinguishedFromOwnedConditionalVviBy)
      .toMatch(/lineage/);
  });

  it("rejects reserved self-VVI identity when no conditional impulse was issued", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.5);
    expect(proposal.conditionalVviPacingSourceImpulse).toBeNull();
    const spoof = capturedFrom(createSourceImpulseV2({
      sourceImpulseId: proposal.reservedConditionalVviPacingSourceImpulseId,
      parentCapturedActivationId: null,
      chamber: "ventricular",
      sourceKind: "pacing",
      sourceId: "foreign-pacing-source",
      sourceSequence: 44,
      activationTimeSec: 0.5,
    }));

    expect(() => createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: spoof,
      conditionalVviPacingAcceptedVentricularActivation: null,
    })).toThrow(/cannot masquerade as non-VVI feedback/);
  });

  it("rejects non-VVI plus conditional-VVI double feedback at one boundary", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const external = capturedFrom(avOutputImpulse(0.8));
    const conditional = capturedFrom(
      proposal.conditionalVviPacingSourceImpulse!,
    );

    expect(() => createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: external,
      conditionalVviPacingAcceptedVentricularActivation: conditional,
    })).toThrow(/cannot capture after a non-VVI capture/);
  });

  it("advances a due VVI timer after failed capture without resetting escape", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(resolution.conditionalVviPacingAttempted).toBe(true);
    expect(resolution.sourceAttemptResults).toEqual([
      expect.objectContaining({
        sourceKind: "pacing",
        outcome: "not-captured",
        capturedActivationId: null,
      }),
    ]);
    expect(candidate.candidateState.nextVviPaceDueTimeSec).toBe(1.8);
    expect(candidate.candidateState.nextIntrinsicEscapeDueTimeSec).toBe(1.8);
    expect(candidate.candidateState.acceptedVentricularCaptureFeedbackCount).toBe(0);
  });

  it("allows only an actually captured conditional VVI impulse to reset escape", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const pace = proposal.conditionalVviPacingSourceImpulse!;
    const capturedPace = capturedFrom(pace);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: capturedPace,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(resolution.acceptedCapturePhase).toBe("conditional-vvi");
    expect(resolution.sourceAttemptResults[0]).toMatchObject({
      sourceKind: "pacing",
      outcome: "captured",
      capturedActivationId: capturedPace.capturedActivationId,
    });
    expect(candidate.candidateState.nextIntrinsicEscapeDueTimeSec).toBe(2.8);
    expect(candidate.candidateState.nextVviPaceDueTimeSec).toBe(1.8);
    expect(candidate.candidateState.vviPacingCapturedCount).toBe(1);
  });

  it("uses escape before VVI at a simultaneous due time", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const escape = proposal.sourceImpulsesForNonVviBatch[0]!;
    const acceptedEscape = capturedFrom(escape);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: acceptedEscape,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });

    expect(proposal.intrinsicEscapeDue).toBe(true);
    expect(proposal.vviPaceDue).toBe(true);
    expect(escape.capturePriority).toBeLessThan(
      proposal.conditionalVviPacingSourceImpulse!.capturePriority,
    );
    expect(resolution.conditionalVviPacingAttempted).toBe(false);
    expect(resolution.sourceAttemptResults.map((result) => result.sourceKind))
      .toEqual(["escape"]);
  });

  it("attempts VVI after a simultaneous due escape fails to capture", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    const candidate = evaluateAcceptedVentricularBackupSourceCandidateV2(
      state,
      proposal,
      resolution,
    );

    expect(resolution.conditionalVviPacingAttempted).toBe(true);
    expect(resolution.sourceAttemptResults.map((result) => [
      result.sourceKind,
      result.outcome,
    ])).toEqual([
      ["escape", "not-captured"],
      ["pacing", "not-captured"],
    ]);
    expect(candidate.candidateState.intrinsicEscapeAttemptCount).toBe(1);
    expect(candidate.candidateState.vviPacingAttemptCount).toBe(1);
  });

  it("cannot report VVI capture behind a failed same-time higher-priority escape", () => {
    const state = initialize(config({ escapeCycleSec: 1, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const capturedPace = capturedFrom(proposal.conditionalVviPacingSourceImpulse!);

    expect(() => createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: capturedPace,
    })).toThrow(/same-time escape proposal failed/);
  });

  it("previews then recomputes a refractory simultaneous batch from one capture base", () => {
    const initialBackup = initialize(
      config({ escapeCycleSec: 1, lowerRatePerMin: 60 }),
    );
    const backupAtSevenTenths = commitAcceptedVentricularBackupSourceCandidateV2(
      initialBackup,
      failedCandidate(initialBackup, 0.7),
    );
    const proposal = evaluateVentricularBackupSourceProposalV2(
      backupAtSevenTenths,
      0.8,
    );
    const captureConfiguration = createAcceptedElectricalCaptureOwnerConfigurationV2({
      configurationId: "refractory-composition-capture-config",
      ownerInstanceId: "refractory-composition-capture-owner",
      atrialGate: { gateInstanceId: "composition-a", refractoryPeriodSec: 0.2 },
      ventricularGate: { gateInstanceId: "composition-v", refractoryPeriodSec: 0.25 },
    });
    const captureBase = initializeAcceptedElectricalCaptureOwnerStateV2(
      captureConfiguration,
      {
        acceptedTimeSec: 0.7,
        atrialPriorCapture: null,
        ventricularPriorCapture: {
          capturedActivationId: "accepted-v-at-seven-tenths",
          activationTimeSec: 0.7,
        },
      },
    );
    const preview = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      captureBase,
      {
        candidateTimeSec: 0.8,
        sourceImpulses: proposal.sourceImpulsesForNonVviBatch,
      },
    );
    expect(preview.capturedActivations).toEqual([]);
    expect(rollbackAcceptedElectricalCaptureBatchCandidateV2(captureBase, preview))
      .toBe(captureBase);

    const complete = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      captureBase,
      {
        candidateTimeSec: 0.8,
        sourceImpulses: [
          ...proposal.sourceImpulsesForNonVviBatch,
          proposal.conditionalVviPacingSourceImpulse!,
        ],
      },
    );
    expect(complete.capturedActivations).toEqual([]);
    expect(complete.decisions.map((decision) => [
      decision.parentSourceImpulseId,
      decision.outcome,
    ])).toEqual([
      [proposal.sourceImpulsesForNonVviBatch[0]!.sourceImpulseId, "refractory-blocked"],
      [proposal.conditionalVviPacingSourceImpulse!.sourceImpulseId, "refractory-blocked"],
    ]);

    const resolution = createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: null,
    });
    expect(resolution.sourceAttemptResults.map((result) => result.outcome))
      .toEqual(["not-captured", "not-captured"]);
  });

  it("rejects capture feedback that does not match conditional pacing lineage", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const unrelated = capturedFrom(avOutputImpulse(0.8));

    expect(() => createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: null,
      conditionalVviPacingAcceptedVentricularActivation: unrelated,
    })).toThrow(/does not match source-impulse lineage/);
  });

  it("rejects a pacing source masquerading as non-VVI feedback", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const proposal = evaluateVentricularBackupSourceProposalV2(state, 0.8);
    const pacing = capturedFrom(proposal.conditionalVviPacingSourceImpulse!);

    expect(() => createVentricularBackupSourceResolutionV2(proposal, {
      nonVviAcceptedVentricularActivation: pacing,
      conditionalVviPacingAcceptedVentricularActivation: null,
    })).toThrow(/cannot masquerade as non-VVI feedback/);
  });

  it("is pure, exactly recomputes commit, and rolls back by accepted identity", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const first = failedCandidate(state, 0.8);
    const retry = failedCandidate(state, 0.8);

    expect(first).toEqual(retry);
    expect(rollbackAcceptedVentricularBackupSourceCandidateV2(state, first))
      .toBe(state);
    expect(commitAcceptedVentricularBackupSourceCandidateV2(state, first))
      .toEqual(commitAcceptedVentricularBackupSourceCandidateV2(state, retry));
    expect(state.revision).toBe(0);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.resolution.sourceAttemptResults)).toBe(true);
    expect(Object.isFrozen(first.candidateState)).toBe(true);
  });

  it("rejects stale candidates and nonfuture or overflow-prone clocks", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const first = failedCandidate(state, 0.8);
    const accepted = commitAcceptedVentricularBackupSourceCandidateV2(state, first);

    expect(() => commitAcceptedVentricularBackupSourceCandidateV2(accepted, first))
      .toThrow();
    expect(() => evaluateVentricularBackupSourceProposalV2(state, 0)).toThrow(/must exceed/);
    expect(() => maximumAcceptedVentricularBackupSourceStepV2(state, Infinity))
      .toThrow(/must be finite/);
  });

  it("fails closed on tampered accepted-state counters", () => {
    const state = initialize(config({ escapeCycleSec: 2, lowerRatePerMin: 60 }));
    const tampered = Object.freeze({
      ...state,
      intrinsicEscapeCapturedCount: 1,
    }) as AcceptedVentricularBackupSourceStateV2;

    expect(() => validateAcceptedVentricularBackupSourceStateV2(tampered))
      .toThrow(/cannot exceed source attempt count/);
  });
});

function config(options: {
  escapeCycleSec?: number;
  lowerRatePerMin?: number;
  configurationId?: string;
} = {}): AcceptedVentricularBackupSourceConfigurationV2 {
  return createAcceptedVentricularBackupSourceConfigurationV2({
    configurationId: options.configurationId ?? "backup-config",
    ownerInstanceId: "backup-owner",
    parameterProvenance: {
      kind: "literature-construction",
      sourceId: "explicit-test-construction",
    },
    intrinsicEscapeSourceId: "intrinsic-ventricular-escape",
    intrinsicEscapeCycleLengthSec: options.escapeCycleSec ?? 1,
    vviPacingSourceId: "simple-vvi",
    vviLowerRateLimitPerMin: options.lowerRatePerMin ?? 60,
  });
}

function initialize(
  configuration: AcceptedVentricularBackupSourceConfigurationV2,
  priorCaptureTimeSec = -0.2,
): AcceptedVentricularBackupSourceStateV2 {
  return initializeAcceptedVentricularBackupSourceStateV2(configuration, {
    acceptedTimeSec: 0,
    priorAcceptedVentricularCapture: {
      capturedActivationId: "prior-accepted-v",
      parentSourceImpulseId: "prior-source-impulse",
      sourceKind: "av-output",
      sourceId: "prior-av-output",
      sourceSequence: 0,
      activationTimeSec: priorCaptureTimeSec,
    },
  });
}

function failedCandidate(
  state: AcceptedVentricularBackupSourceStateV2,
  timeSec: number,
) {
  const proposal = evaluateVentricularBackupSourceProposalV2(state, timeSec);
  const resolution = createVentricularBackupSourceResolutionV2(proposal, {
    nonVviAcceptedVentricularActivation: null,
    conditionalVviPacingAcceptedVentricularActivation: null,
  });
  return evaluateAcceptedVentricularBackupSourceCandidateV2(
    state,
    proposal,
    resolution,
  );
}

function avOutputImpulse(timeSec: number): SourceImpulseV2 {
  return createSourceImpulseV2({
    sourceImpulseId: `external-av-${timeSec}`,
    parentCapturedActivationId: "accepted-atrial-parent",
    chamber: "ventricular",
    sourceKind: "av-output",
    sourceId: "external-av",
    sourceSequence: 0,
    activationTimeSec: timeSec,
  });
}

function capturedFrom(impulse: SourceImpulseV2): CapturedElectricalActivationV2 {
  const configuration = createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: "capture-config",
    ownerInstanceId: "capture-owner",
    atrialGate: { gateInstanceId: "atrial-gate", refractoryPeriodSec: 0.2 },
    ventricularGate: { gateInstanceId: "ventricular-gate", refractoryPeriodSec: 0.25 },
  });
  const state = initializeAcceptedElectricalCaptureOwnerStateV2(configuration, {
    acceptedTimeSec: 0,
    atrialPriorCapture: null,
    ventricularPriorCapture: null,
  });
  const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
    candidateTimeSec: impulse.activationTimeSec,
    sourceImpulses: [impulse],
  });
  commitAcceptedElectricalCaptureBatchCandidateV2(state, trial);
  const activation = trial.capturedActivations[0];
  if (activation === undefined) throw new Error("test impulse did not capture");
  return activation;
}
