import { describe, expect, it } from "vitest";

import {
  ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CLAIM_V2,
  MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2,
  commitAcceptedElectricalCaptureBatchCandidateV2,
  createAcceptedElectricalCaptureOwnerConfigurationV2,
  createSourceImpulseV2,
  evaluateAcceptedElectricalCaptureBatchCandidateV2,
  initializeAcceptedElectricalCaptureOwnerStateV2,
  rollbackAcceptedElectricalCaptureBatchCandidateV2,
  type AcceptedElectricalCaptureOwnerStateV2,
  type ElectricalCaptureChamberV2,
  type ElectricalImpulseSourceKindV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";

describe("accepted electrical capture owner V2", () => {
  it("canonically arbitrates a same-time batch independently of input order", () => {
    const state = initialState();
    const a = impulse("atrial-a", "atrial", "primary-intrinsic", "a-source", 7, 0.5);
    const z = impulse("atrial-z", "atrial", "primary-intrinsic", "z-source", 1, 0.5);

    const forward = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec: 0.5,
      sourceImpulses: [z, a],
    });
    const reverse = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec: 0.5,
      sourceImpulses: [a, z],
    });

    expect(forward).toEqual(reverse);
    expect(forward.sourceImpulses.map((entry) => entry.sourceImpulseId))
      .toEqual(["atrial-a", "atrial-z"]);
    expect(forward.decisions.map((decision) => [
      decision.parentSourceImpulseId,
      decision.outcome,
    ])).toEqual([
      ["atrial-a", "captured"],
      ["atrial-z", "coincident-suppressed"],
    ]);
  });

  it("lets authored ectopy win an exact-time tie without claiming fusion", () => {
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      {
        candidateTimeSec: 0.5,
        sourceImpulses: [
          impulse("pace", "ventricular", "pacing", "v-pacer", 0, 0.5),
          impulse(
            "intrinsic",
            "ventricular",
            "av-output",
            "his",
            0,
            0.5,
            "captured-atrium-0",
          ),
          impulse("pvc", "ventricular", "authored-ectopy", "pvc-author", 0, 0.5),
        ],
      },
    );

    expect(trial.capturedActivations).toHaveLength(1);
    expect(trial.capturedActivations[0]).toMatchObject({
      parentSourceImpulseId: "pvc",
      sourceKind: "authored-ectopy",
      capturePriority: 10,
    });
    expect(trial.decisions.map((decision) => decision.outcome)).toEqual([
      "captured",
      "coincident-suppressed",
      "coincident-suppressed",
    ]);
    expect(ACCEPTED_ELECTRICAL_CAPTURE_OWNER_CLAIM_V2.fusionClaimed).toBe(false);
  });

  it("lets intrinsic activation inhibit pacing at the same time", () => {
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      {
        candidateTimeSec: 0.4,
        sourceImpulses: [
          impulse("pace", "atrial", "pacing", "atrial-pacer", 0, 0.4),
          impulse("sinus", "atrial", "primary-intrinsic", "sinus", 3, 0.4),
        ],
      },
    );

    expect(outcomeByParent(trial.decisions)).toEqual({
      sinus: "captured",
      pace: "coincident-suppressed",
    });
  });

  it("lets endogenous escape inhibit pacing at the same time", () => {
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      {
        candidateTimeSec: 0.6,
        sourceImpulses: [
          impulse("escape", "ventricular", "escape", "v-escape", 0, 0.6),
          impulse("pace", "ventricular", "pacing", "v-pacer", 0, 0.6),
        ],
      },
    );

    expect(outcomeByParent(trial.decisions)).toEqual({
      escape: "captured",
      pace: "coincident-suppressed",
    });
    expect(trial.capturedActivations[0]).toMatchObject({
      parentSourceImpulseId: "escape",
      capturePriority: 25,
    });
  });

  it("allows atrial and ventricular capture at the same absolute time", () => {
    const initial = initialState();
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(initial, {
      candidateTimeSec: 0.7,
      sourceImpulses: [
        impulse("a", "atrial", "primary-intrinsic", "primary", 0, 0.7),
        impulse(
          "v",
          "ventricular",
          "av-output",
          "primary",
          0,
          0.7,
          "captured-atrium-prior",
        ),
      ],
    });

    expect(trial.capturedActivations.map((activation) => activation.chamber))
      .toEqual(["atrial", "ventricular"]);
    expect(trial.decisions.every((decision) => decision.outcome === "captured"))
      .toBe(true);
    expect(trial.candidateState.atrialGate.capturedActivationCount).toBe(1);
    expect(trial.candidateState.ventricularGate.capturedActivationCount).toBe(1);
  });

  it("captures at exact refractory equality and accepts signed finite history", () => {
    const state = initialState({
      atrialPriorCapture: {
        capturedActivationId: "historical-a-minus-quarter",
        activationTimeSec: -0.25,
      },
    });
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec: 0,
      sourceImpulses: [
        impulse("boundary-a", "atrial", "primary-intrinsic", "sinus", 0, 0),
      ],
    });

    expect(state.atrialGate.refractoryUntilSec).toBe(0);
    expect(trial.decisions[0]?.outcome).toBe("captured");
    expect(trial.candidateState.atrialGate.refractoryUntilSec).toBe(0.25);
  });

  it("blocks every proposal while the chamber is already refractory", () => {
    let state = initialState();
    state = commitAcceptedElectricalCaptureBatchCandidateV2(
      state,
      evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
        candidateTimeSec: 0.1,
        sourceImpulses: [
          impulse(
            "first-v",
            "ventricular",
            "av-output",
            "his",
            0,
            0.1,
            "captured-atrium-0",
          ),
        ],
      }),
    );
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, {
      candidateTimeSec: 0.2,
      sourceImpulses: [
        impulse("pvc", "ventricular", "authored-ectopy", "pvc", 0, 0.2),
        impulse("pace", "ventricular", "pacing", "pace", 0, 0.2),
      ],
    });

    expect(trial.capturedActivations).toEqual([]);
    expect(trial.decisions.map((decision) => decision.outcome)).toEqual([
      "refractory-blocked",
      "refractory-blocked",
    ]);
    expect(trial.decisions.every((decision) =>
      decision.winnerSourceImpulseId === null
      && decision.capturedActivationId === null)).toBe(true);
    expect(trial.candidateState.ventricularGate.lastCapturedActivationId)
      .toBe(state.ventricularGate.lastCapturedActivationId);
    expect(trial.candidateState.ventricularGate.refractoryUntilSec).toBe(0.35);
  });

  it("has complete one-to-one decision lineage and no duplicate activation", () => {
    const sourceImpulses = [
      impulse("a-ectopy", "atrial", "authored-ectopy", "a-ectopy", 0, 0.8),
      impulse("a-sinus", "atrial", "primary-intrinsic", "sinus", 1, 0.8),
      impulse("v-av", "ventricular", "av-output", "av", 1, 0.8, "a-capture-parent"),
      impulse("v-pace", "ventricular", "pacing", "pacer", 1, 0.8),
    ];
    const trial = evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      { candidateTimeSec: 0.8, sourceImpulses },
    );
    const sourceIds = new Set(sourceImpulses.map((entry) => entry.sourceImpulseId));
    const decisionParents = trial.decisions.map(
      (decision) => decision.parentSourceImpulseId,
    );
    const activationParents = trial.capturedActivations.map(
      (activation) => activation.parentSourceImpulseId,
    );

    expect(new Set(decisionParents)).toEqual(sourceIds);
    expect(decisionParents).toHaveLength(sourceIds.size);
    expect(new Set(trial.decisions.map((decision) => decision.decisionId)).size)
      .toBe(trial.decisions.length);
    expect(new Set(trial.capturedActivations.map(
      (activation) => activation.capturedActivationId,
    )).size).toBe(trial.capturedActivations.length);
    expect(activationParents.every((parent) => sourceIds.has(parent))).toBe(true);
    for (const activation of trial.capturedActivations) {
      const matching = trial.decisions.filter((decision) =>
        decision.parentSourceImpulseId === activation.parentSourceImpulseId
        && decision.outcome === "captured"
        && decision.capturedActivationId === activation.capturedActivationId);
      expect(matching).toHaveLength(1);
    }
    expect(trial.capturedActivations.find((entry) => entry.chamber === "ventricular"))
      .toMatchObject({ upstreamCapturedActivationId: "a-capture-parent" });
  });

  it("retries exactly, rolls back by identity, and isolates chamber state", () => {
    const state = initialState();
    const input = {
      candidateTimeSec: 0.5,
      sourceImpulses: [
        impulse("sinus", "atrial", "primary-intrinsic", "sinus", 0, 0.5),
      ],
    } as const;
    const first = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, input);
    const retry = evaluateAcceptedElectricalCaptureBatchCandidateV2(state, input);

    expect(first).toEqual(retry);
    expect(first.candidateState.ventricularGate).toBe(state.ventricularGate);
    expect(rollbackAcceptedElectricalCaptureBatchCandidateV2(state, first))
      .toBe(state);
    expect(commitAcceptedElectricalCaptureBatchCandidateV2(state, first))
      .toEqual(commitAcceptedElectricalCaptureBatchCandidateV2(state, retry));
    expect(state.revision).toBe(0);
    expect(state.atrialGate.lastCapturedActivationTimeSec).toBeNull();
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.sourceImpulses)).toBe(true);
    expect(Object.isFrozen(first.capturedActivations[0]!)).toBe(true);
  });

  it("is exactly chunk invariant across clock-only accepted advances", () => {
    const initial = initialState();
    const event = impulse(
      "v-event",
      "ventricular",
      "av-output",
      "his",
      2,
      0.5,
      "captured-atrium-2",
    );
    const direct = commitAcceptedElectricalCaptureBatchCandidateV2(
      initial,
      evaluateAcceptedElectricalCaptureBatchCandidateV2(initial, {
        candidateTimeSec: 0.5,
        sourceImpulses: [event],
      }),
    );

    let chunked = initial;
    for (const candidateTimeSec of [0.1, 0.23, 0.49]) {
      chunked = commitAcceptedElectricalCaptureBatchCandidateV2(
        chunked,
        evaluateAcceptedElectricalCaptureBatchCandidateV2(chunked, {
          candidateTimeSec,
          sourceImpulses: [],
        }),
      );
    }
    chunked = commitAcceptedElectricalCaptureBatchCandidateV2(
      chunked,
      evaluateAcceptedElectricalCaptureBatchCandidateV2(chunked, {
        candidateTimeSec: 0.5,
        sourceImpulses: [event],
      }),
    );

    expect(chunked).toEqual(direct);
    expect(chunked.revision).toBe(1);
    expect(chunked.acceptedImpulseBatchCount).toBe(1);
  });

  it("rejects an ambiguous complete arbitration key", () => {
    expect(() => evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      {
        candidateTimeSec: 0.5,
        sourceImpulses: [
          impulse("first", "atrial", "primary-intrinsic", "sinus", 1, 0.5),
          impulse("second", "atrial", "primary-intrinsic", "sinus", 1, 0.5),
        ],
      },
    )).toThrow(/complete arbitration key/);
  });

  it("rejects biologically invalid source routes and missing AV parentage", () => {
    expect(() => impulse(
      "ventricular-primary",
      "ventricular",
      "primary-intrinsic",
      "primary",
      0,
      0.5,
    )).toThrow(/primary intrinsic.*atrial/);
    expect(() => impulse(
      "atrial-av-output",
      "atrial",
      "av-output",
      "av",
      0,
      0.5,
      "captured-atrium",
    )).toThrow(/AV output.*ventricular/);
    expect(() => impulse(
      "orphan-av-output",
      "ventricular",
      "av-output",
      "av",
      0,
      0.5,
    )).toThrow(/parent atrial capture/);
    expect(() => impulse(
      "atrial-escape",
      "atrial",
      "escape",
      "escape",
      0,
      0.5,
    )).toThrow(/escape.*ventricular/);
  });

  it("fails instead of truncating an oversized exact-time batch", () => {
    const impulses = Array.from(
      { length: MAX_ELECTRICAL_CAPTURE_IMPULSES_PER_BATCH_V2 + 1 },
      (_, index) => impulse(
        `paced-${index}`,
        "ventricular",
        "pacing",
        "pacer",
        index,
        0.5,
      ),
    );
    expect(() => evaluateAcceptedElectricalCaptureBatchCandidateV2(
      initialState(),
      { candidateTimeSec: 0.5, sourceImpulses: impulses },
    )).toThrow(/hard source-impulse bound/);
  });
});

function initialState(overrides: Readonly<{
  atrialPriorCapture?: Readonly<{
    capturedActivationId: string;
    activationTimeSec: number;
  }> | null;
  ventricularPriorCapture?: Readonly<{
    capturedActivationId: string;
    activationTimeSec: number;
  }> | null;
}> = {}): AcceptedElectricalCaptureOwnerStateV2 {
  const configuration = createAcceptedElectricalCaptureOwnerConfigurationV2({
    configurationId: "capture-foundation-config-v2",
    ownerInstanceId: "capture-foundation-owner",
    atrialGate: {
      gateInstanceId: "atrial-capture-gate",
      refractoryPeriodSec: 0.25,
    },
    ventricularGate: {
      gateInstanceId: "ventricular-capture-gate",
      refractoryPeriodSec: 0.25,
    },
  });
  return initializeAcceptedElectricalCaptureOwnerStateV2(configuration, {
    acceptedTimeSec: 0,
    atrialPriorCapture: overrides.atrialPriorCapture ?? null,
    ventricularPriorCapture: overrides.ventricularPriorCapture ?? null,
  });
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

function outcomeByParent(
  decisions: readonly Readonly<{
    parentSourceImpulseId: string;
    outcome: string;
  }>[],
): Record<string, string> {
  return Object.fromEntries(decisions.map((decision) => [
    decision.parentSourceImpulseId,
    decision.outcome,
  ]));
}
