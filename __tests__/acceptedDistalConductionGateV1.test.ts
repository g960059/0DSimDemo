import { describe, expect, it } from "vitest";

import {
  ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1,
  commitDistalConductionGateCandidateDecisionV1,
  createDistalConductionGateConfigurationV1,
  evaluateDistalConductionGateCandidateDecisionV1,
  initializeAcceptedDistalConductionGateStateV1,
  rollbackDistalConductionGateCandidateDecisionV1,
  validateAcceptedDistalConductionGateStateV1,
  type AcceptedDistalConductionGateStateV1,
  type DistalConductionGateConfigurationV1,
  type DistalConductionGateModeConfigurationInputV1,
} from "@/engine/myocardium/rhythm/acceptedDistalConductionGateV1";

describe("accepted distal conduction gate V1", () => {
  it("passes signed-time proximal lineage into an AV-output capture proposal", () => {
    const state = initialState(configuration("pass", { erpSec: 0 }), -1);
    const candidate = evaluateDistalConductionGateCandidateDecisionV1(state, {
      proximalAvOutputId: "proximal-av:-1",
      parentCapturedActivationId: "captured-atrium:-1",
      proximalArrivalTimeSec: -0.5,
    });

    expect(candidate).toMatchObject({
      arrivalOrdinal: 1,
      outcome: "passed",
      passed: true,
      distalReadyAtBeforeSec: -1,
      distalReadyAtAfterSec: -0.5,
    });
    expect(candidate.ventricularSourceImpulse).toMatchObject({
      sourceImpulseId: "distal-gate:distal-arrival:1",
      parentCapturedActivationId: "captured-atrium:-1",
      chamber: "ventricular",
      sourceKind: "av-output",
      sourceId: "distal-gate",
      sourceSequence: 1,
    });
    expect(candidate.ventricularSourceImpulse?.activationTimeSec)
      .toBeCloseTo(-0.45, 15);
    expect(candidate.candidateState.lastPassedProximalArrivalTimeSec).toBe(-0.5);
    expect(candidate.candidateState.lastVentricularImpulseTimeSec)
      .toBeCloseTo(-0.45, 15);
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate.candidateState)).toBe(true);
    expect(ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1.captureSuccessClaimed)
      .toBe(false);
    expect(ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1
      .anatomyOrBlockLocalizationClaimed).toBe(false);
  });

  it("guarantees pass mode has no additional drop, including ordered equality", () => {
    let state = initialState(configuration("pass", { erpSec: 0 }), 0);
    const first = evaluate(state, "proximal-1", 0.1);
    state = commitDistalConductionGateCandidateDecisionV1(state, first);
    const coincident = evaluate(state, "proximal-2", 0.1);

    expect(first.outcome).toBe("passed");
    expect(coincident.outcome).toBe("passed");
    expect(coincident.arrivalOrdinal).toBe(2);
    expect(coincident.ventricularSourceImpulse?.sourceSequence).toBe(2);
    expect(coincident.candidateState.passedArrivalCount).toBe(2);
  });

  it("drops an early distal arrival without extending readiness and passes equality", () => {
    let state = initialState(configuration("refractory", { erpSec: 0.2 }), 0);
    state = accept(state, "first", 0.1);
    expect(state.distalReadyAtSec).toBeCloseTo(0.3, 15);

    const early = evaluate(state, "early", 0.2);
    expect(early.outcome).toBe("distal-refractory-drop");
    expect(early.ventricularSourceImpulse).toBeNull();
    expect(early.distalReadyAtAfterSec).toBe(state.distalReadyAtSec);
    state = commitDistalConductionGateCandidateDecisionV1(state, early);

    const boundary = evaluate(state, "boundary", state.distalReadyAtSec);
    expect(boundary.outcome).toBe("passed");
    expect(boundary.distalReadyAtBeforeSec).toBe(state.distalReadyAtSec);
    expect(boundary.candidateState.distalRefractoryDropCount).toBe(1);
    expect(boundary.ventricularSourceImpulse?.activationTimeSec)
      .toBeCloseTo(0.35, 15);
  });

  it("advances a repeating authored mask on every proximal arrival", () => {
    const mode = {
      mode: "authored-mask",
      pattern: [true, false, true],
      repeatPolicy: "repeat",
    } as const;
    const config = configuration(mode, { erpSec: 0.2 });
    expect(Object.isFrozen(config.modeConfiguration)).toBe(true);
    expect(Object.isFrozen(
      config.modeConfiguration.mode === "authored-mask"
        ? config.modeConfiguration.pattern
        : [],
    )).toBe(true);
    let state = initialState(config, 0);

    const outcomes = [];
    for (const [id, time] of [
      ["one", 0.1],
      ["two", 0.15],
      ["three", 0.2],
      ["four", 0.1 + 0.2],
    ] as const) {
      const candidate = evaluate(state, id, time);
      outcomes.push([
        candidate.outcome,
        candidate.authoredMaskValue,
        candidate.authoredMaskPositionAfter,
      ]);
      state = commitDistalConductionGateCandidateDecisionV1(state, candidate);
    }

    expect(outcomes).toEqual([
      ["passed", true, 1],
      ["authored-mask-drop", false, 2],
      ["distal-refractory-drop", true, 3],
      ["passed", true, 4],
    ]);
    expect(state.authoredMaskPosition).toBe(4);
    expect(state.authoredMaskDropCount).toBe(1);
    expect(state.distalRefractoryDropCount).toBe(1);
  });

  it("fails closed when a finite authored mask is exhausted without wrapping", () => {
    const config = configuration({
      mode: "authored-mask",
      pattern: [true, false],
      repeatPolicy: "finite-fail-closed",
    }, { erpSec: 0 });
    let state = initialState(config, 0);
    state = accept(state, "one", 0.1);
    state = accept(state, "two", 0.2);
    const exhausted = evaluate(state, "three", 0.3);

    expect(exhausted.outcome).toBe("authored-mask-exhausted-drop");
    expect(exhausted.authoredMaskValue).toBeNull();
    expect(exhausted.ventricularSourceImpulse).toBeNull();
    expect(exhausted.distalReadyAtAfterSec).toBe(state.distalReadyAtSec);
    expect(exhausted.candidateState.authoredMaskPosition).toBe(3);
    expect(exhausted.candidateState.authoredMaskExhaustedDropCount).toBe(1);
  });

  it("disconnects every accepted proximal arrival without concealment", () => {
    const config = configuration("disconnect", { erpSec: 0.2 });
    let state = initialState(config, -0.5);
    const first = evaluate(state, "one", -0.25);
    state = commitDistalConductionGateCandidateDecisionV1(state, first);
    const second = evaluate(state, "two", 0.1);

    expect([first.outcome, second.outcome]).toEqual([
      "disconnected-drop",
      "disconnected-drop",
    ]);
    expect(second.candidateState.distalReadyAtSec).toBe(-0.5);
    expect(second.candidateState.disconnectedDropCount).toBe(2);
    expect(ACCEPTED_DISTAL_CONDUCTION_GATE_CLAIM_V1.concealmentClaimed)
      .toBe(false);
  });

  it("keeps evaluation pure, exactly recomputes commit, and rolls back by identity", () => {
    const state = initialState(configuration("refractory", { erpSec: 0.2 }), 0);
    const snapshot = JSON.stringify(state);
    const candidate = evaluate(state, "one", 0.1);

    expect(JSON.stringify(state)).toBe(snapshot);
    expect(rollbackDistalConductionGateCandidateDecisionV1(state, candidate))
      .toBe(state);
    expect(commitDistalConductionGateCandidateDecisionV1(state, candidate))
      .toEqual(candidate.candidateState);

    const tampered = jsonClone(candidate);
    tampered.outcome = "disconnected-drop";
    tampered.passed = false;
    tampered.ventricularSourceImpulse = null;
    expect(() => commitDistalConductionGateCandidateDecisionV1(
      state,
      tampered as typeof candidate,
    )).toThrow(/does not match/);
  });

  it("rejects malformed configurations and copies the authored pattern", () => {
    expect(() => configuration("pass", { erpSec: 0.1 }))
      .toThrow(/pass mode requires ERP_H/);
    expect(() => configuration("refractory", { erpSec: 0 }))
      .toThrow(/refractory mode requires positive/);
    expect(() => configuration({
      mode: "authored-mask",
      pattern: [],
      repeatPolicy: "repeat",
    }, { erpSec: 0.1 })).toThrow(/nonempty complete boolean array/);
    expect(() => configuration({
      mode: "authored-mask",
      pattern: [true],
      repeatPolicy: "invalid" as "repeat",
    }, { erpSec: 0.1 })).toThrow(/repeatPolicy is invalid/);
    expect(() => configuration("disconnect", { hvSec: 0 }))
      .toThrow(/hvConductionDelaySec.*positive/);

    const pattern = [true, false];
    const config = configuration({
      mode: "authored-mask",
      pattern,
      repeatPolicy: "repeat",
    }, { erpSec: 0 });
    pattern[0] = false;
    expect(config.modeConfiguration.mode === "authored-mask"
      ? config.modeConfiguration.pattern
      : []).toEqual([true, false]);
  });

  it("rejects malformed accepted state invariants and unsafe counters", () => {
    const config = configuration("disconnect", { erpSec: 0.2 });
    const state = accept(initialState(config, 0), "one", 0.1);

    const badSum = jsonClone(state);
    badSum.disconnectedDropCount = 0;
    expect(() => validateAcceptedDistalConductionGateStateV1(
      badSum as AcceptedDistalConductionGateStateV1,
    )).toThrow(/outcome counters/);

    const badReady = jsonClone(state);
    badReady.distalReadyAtSec = 0.2;
    expect(() => validateAcceptedDistalConductionGateStateV1(
      badReady as AcceptedDistalConductionGateStateV1,
    )).toThrow(/retains its initial ready time/);

    const badClock = jsonClone(initialState(config, 0));
    badClock.acceptedTimeSec = 0.1;
    expect(() => validateAcceptedDistalConductionGateStateV1(
      badClock as AcceptedDistalConductionGateStateV1,
    )).toThrow(/retains its initial clock/);

    const maskConfig = configuration({
      mode: "authored-mask",
      pattern: [false, true],
      repeatPolicy: "repeat",
    }, { erpSec: 0 });
    const maskState = accept(initialState(maskConfig, 0), "one", 0.1);
    const badMaskCounter = jsonClone(maskState);
    badMaskCounter.authoredMaskDropCount = 0;
    badMaskCounter.passedArrivalCount = 1;
    badMaskCounter.lastPassedProximalArrivalTimeSec = 0.1;
    badMaskCounter.lastVentricularImpulseTimeSec = 0.15;
    badMaskCounter.distalReadyAtSec = 0.1;
    expect(() => validateAcceptedDistalConductionGateStateV1(
      badMaskCounter as AcceptedDistalConductionGateStateV1,
    )).toThrow(/mask drop count/);

    const maxed = {
      ...initialState(config, 0),
      revision: Number.MAX_SAFE_INTEGER,
      acceptedProximalArrivalCount: Number.MAX_SAFE_INTEGER,
      disconnectedDropCount: Number.MAX_SAFE_INTEGER,
    } as AcceptedDistalConductionGateStateV1;
    validateAcceptedDistalConductionGateStateV1(maxed);
    expect(() => evaluate(maxed, "overflow", 0)).toThrow(/incremented safely/);
  });

  it("rejects retrograde time, malformed lineage, and candidate source tamper", () => {
    const state = initialState(configuration("pass", { erpSec: 0 }), 0);
    expect(() => evaluate(state, "past", -1)).toThrow(/monotone/);
    expect(() => evaluateDistalConductionGateCandidateDecisionV1(state, {
      proximalAvOutputId: "proximal",
      parentCapturedActivationId: "",
      proximalArrivalTimeSec: 0.1,
    })).toThrow(/parent.*nonempty/);
    expect(() => evaluateDistalConductionGateCandidateDecisionV1(state, {
      proximalAvOutputId: "   ",
      parentCapturedActivationId: "parent",
      proximalArrivalTimeSec: 0.1,
    })).toThrow(/proximal.*nonempty/);
    expect(() => evaluateDistalConductionGateCandidateDecisionV1(state, {
      proximalAvOutputId: "masked-drop",
      parentCapturedActivationId: "\t",
      proximalArrivalTimeSec: 0.1,
    })).toThrow(/parent.*nonempty/);

    const candidate = evaluate(state, "valid", 0.1);
    const tampered = jsonClone(candidate);
    if (tampered.ventricularSourceImpulse) {
      tampered.ventricularSourceImpulse.sourceKind = "escape";
    }
    expect(() => commitDistalConductionGateCandidateDecisionV1(
      state,
      tampered as typeof candidate,
    )).toThrow(/source impulse|does not match/);
  });
});

function configuration(
  mode: DistalConductionGateModeConfigurationInputV1 | "pass" | "refractory" | "disconnect",
  overrides: Readonly<{ erpSec?: number; hvSec?: number }> = {},
): DistalConductionGateConfigurationV1 {
  const modeConfiguration = typeof mode === "string" ? { mode } : mode;
  return createDistalConductionGateConfigurationV1({
    configurationId: "distal-configuration",
    gateInstanceId: "distal-gate",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "focused-component-test-input",
    },
    hvConductionDelaySec: overrides.hvSec ?? 0.05,
    distalEffectiveRefractoryPeriodSec: overrides.erpSec ?? 0.2,
    modeConfiguration,
  });
}

function initialState(
  config: DistalConductionGateConfigurationV1,
  acceptedTimeSec: number,
): AcceptedDistalConductionGateStateV1 {
  return initializeAcceptedDistalConductionGateStateV1(config, {
    acceptedTimeSec,
  });
}

function evaluate(
  state: AcceptedDistalConductionGateStateV1,
  proximalAvOutputId: string,
  proximalArrivalTimeSec: number,
) {
  return evaluateDistalConductionGateCandidateDecisionV1(state, {
    proximalAvOutputId,
    parentCapturedActivationId: `parent:${proximalAvOutputId}`,
    proximalArrivalTimeSec,
  });
}

function accept(
  state: AcceptedDistalConductionGateStateV1,
  proximalAvOutputId: string,
  proximalArrivalTimeSec: number,
): AcceptedDistalConductionGateStateV1 {
  return commitDistalConductionGateCandidateDecisionV1(
    state,
    evaluate(state, proximalAvOutputId, proximalArrivalTimeSec),
  );
}

function jsonClone(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}
