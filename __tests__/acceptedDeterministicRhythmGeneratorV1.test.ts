import { describe, expect, it } from "vitest";

import {
  ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1,
  checkpointAcceptedDeterministicRhythmGeneratorStateV1,
  commitAcceptedDeterministicRhythmGeneratorTrialV1,
  createAcceptedDeterministicRhythmGeneratorConfigV1,
  evaluateAcceptedDeterministicRhythmGeneratorTrialV1,
  initializeAcceptedDeterministicRhythmGeneratorFiniteHistoryStateV1,
  initializeAcceptedDeterministicRhythmGeneratorStateV1,
  maximumAcceptedDeterministicRhythmGeneratorStepV1,
  restoreAcceptedDeterministicRhythmGeneratorStateV1,
  rollbackAcceptedDeterministicRhythmGeneratorTrialV1,
  validateAcceptedDeterministicRhythmGeneratorStateV1,
  type AcceptedDeterministicRhythmGeneratorConfigInputV1,
  type AcceptedDeterministicRhythmGeneratorConfigV1,
  type AcceptedDeterministicRhythmGeneratorStateV1,
} from "@/engine/myocardium/rhythm/acceptedDeterministicRhythmGeneratorV1";
import {
  createRecoveryConcealmentAvGateParametersV1,
  type RecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";

describe("accepted deterministic rhythm generator V1", () => {
  it("replays signed finite history and drains its future calcium event exactly once", () => {
    const config = generatorConfig({
      generatorConfigId: "signed-history-sinus-v1",
      generatorInstanceId: "signed-history-generator",
      sourceId: "signed-history-source",
      sourceAnchorTimeSec: -0.16,
      sourcePeriodSec: 1,
      atrialElectricalToCalciumDelaySec: 0.012,
      ventricularElectricalToCalciumDelaySec: 0.012,
      avGateParameters: avParameters({ minimumConductionDelaySec: 0.16 }),
    });
    let state = initializeAcceptedDeterministicRhythmGeneratorFiniteHistoryStateV1(
      config,
      { acceptedTimeSec: 0, revision: 0 },
    );

    expect(state.nextSourceIndex).toBe(1);
    expect(state.nextSourceActivationTimeSec).toBe(0.84);
    expect(state.avGateState.acceptedActivationCount).toBe(1);
    expect(state.avGateState.lastConductedAtrialActivationTimeSec).toBe(-0.16);
    expect(state.avGateState.lastVentricularActivationTimeSec).toBe(0);
    expect(state.pendingActivationEvents).toHaveLength(1);
    expect(state.pendingActivationEvents[0]).toMatchObject({
      eventId: "signed-history-generator:source:0:ventricles-calcium",
      sourceSequence: 1,
      activationTimeSec: 0.012,
      targetIds: ["LVFW", "RVFW", "SEP"],
    });

    let trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      0.012,
    );
    expect(trial.activationEvents.map((event) => event.eventId)).toEqual([
      "signed-history-generator:source:0:ventricles-calcium",
    ]);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(state, trial);
    trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 0.02);
    expect(trial.activationEvents).toEqual([]);
    expect(trial.candidateState.pendingActivationEvents).toEqual([]);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1
      .finiteHistorySteadyStateClaimed).toBe(false);
  });

  it("generates the legacy-compatible future sinus sequence and explicit delays", () => {
    // Historical t0 calcium is deliberately external. With a future atrial
    // electrical event at 0.84 s, the configured effective atrial event is
    // 0.852 s and the first fully recovered ventricular event is 1.0 s.
    const config = sinusConfig();
    let state = initialState(config);

    const throughAtrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      0.9,
    );
    expect(throughAtrial.sourceImpulses.map((impulse) => [
      impulse.sourceIndex,
      impulse.sourceActivationTimeSec,
      impulse.avGateDecision.outcome,
    ])).toEqual([[0, 0.84, "conducted"]]);
    expect(throughAtrial.activationEvents).toHaveLength(1);
    expect(throughAtrial.activationEvents[0]).toMatchObject({
      eventId: "sinus-generator:source:0:atria-calcium",
      sourceId: "regular-sinus-source",
      sourceSequence: 0,
      beatId: "sinus-generator:beat:0",
      beatOrdinal: 1,
      morphology: "sinus",
      activationTimeSec: 0.852,
      targetIds: ["LA", "RA"],
    });
    expect(throughAtrial.candidateState.pendingActivationEvents).toHaveLength(1);
    expect(throughAtrial.candidateState.pendingActivationEvents[0]!
      .activationTimeSec).toBeCloseTo(1, 15);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      throughAtrial,
    );

    const throughVentricular =
      evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 1);
    expect(throughVentricular.sourceImpulses).toEqual([]);
    expect(throughVentricular.activationEvents).toHaveLength(1);
    expect(throughVentricular.activationEvents[0]).toMatchObject({
      eventId: "sinus-generator:source:0:ventricles-calcium",
      sourceSequence: 1,
      priority: 20,
      activationTimeSec: 1,
      targetIds: ["LVFW", "RVFW", "SEP"],
    });
    expect(throughVentricular.candidateState.nextSourceIndex).toBe(1);
    expect(throughVentricular.candidateState.nextSourceActivationTimeSec)
      .toBeCloseTo(1.84, 15);
  });

  it("reproduces the isolated Jørgensen 4:1 flutter component without coherent atrial calcium", () => {
    const config = generatorConfig({
      generatorConfigId: "flutter-four-to-one-config-v1",
      generatorInstanceId: "flutter-generator",
      sourceId: "regular-flutter-source",
      sourceMode: "regular-atrial-flutter",
      sourceAnchorTimeSec: 0.23,
      sourcePeriodSec: 0.23,
      atrialElectricalToCalciumDelaySec: 0.012,
      ventricularElectricalToCalciumDelaySec: 0,
      avGateParameters: jorgensenFourToOneParameters(),
    });
    const state = initialState(config);
    const trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      4.1,
    );

    expect(trial.sourceImpulses).toHaveLength(17);
    expect(trial.sourceImpulses.map((impulse) => impulse.avGateDecision.outcome))
      .toEqual([
        "conducted", "blocked", "blocked", "blocked",
        "conducted", "blocked", "blocked", "blocked",
        "conducted", "blocked", "blocked", "blocked",
        "conducted", "blocked", "blocked", "blocked",
        "conducted",
      ]);
    expect(trial.activationEvents).toHaveLength(5);
    expect(trial.activationEvents.every((event) =>
      event.targetIds.join(",") === "LVFW,RVFW,SEP")).toBe(true);
    expect(trial.activationEvents.every((event) =>
      event.morphology === "atrial-flutter")).toBe(true);
    expect(trial.activationEvents.map((event) => event.sourceSequence))
      .toEqual([1, 9, 17, 25, 33]);
    trial.activationEvents.forEach((event, index) => {
      expect(event.activationTimeSec)
        .toBeCloseTo(0.23 + index * 0.92 + 0.164, 15);
    });
    expect(trial.candidateState.avGateState.conductedActivationCount).toBe(5);
    expect(trial.candidateState.avGateState.blockedActivationCount).toBe(12);
  });

  it("keeps source identities, AV outcomes, events, and queue chunk invariant", () => {
    const config = sinusConfig();
    const initial = initialState(config);
    const singleTrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      initial,
      3.2,
    );
    const single = commitAcceptedDeterministicRhythmGeneratorTrialV1(
      initial,
      singleTrial,
    );

    let chunked = initial;
    const chunkedEvents: unknown[] = [];
    const chunkedImpulses: unknown[] = [];
    for (const end of [0.17, 0.9, 1, 1.777, 2.6, 3.2]) {
      const trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
        chunked,
        end,
      );
      chunkedEvents.push(...trial.activationEvents);
      chunkedImpulses.push(...trial.sourceImpulses);
      chunked = commitAcceptedDeterministicRhythmGeneratorTrialV1(
        chunked,
        trial,
      );
    }

    expect(chunkedEvents).toEqual(singleTrial.activationEvents);
    expect(chunkedImpulses).toEqual(singleTrial.sourceImpulses);
    expect(chunked.nextSourceIndex).toBe(single.nextSourceIndex);
    expect(chunked.nextSourceActivationTimeSec)
      .toBe(single.nextSourceActivationTimeSec);
    expect(chunked.avGateState).toEqual(single.avGateState);
    expect(chunked.pendingActivationEvents)
      .toEqual(single.pendingActivationEvents);
    // Revision counts accepted intervals; it is intentionally not a
    // physiological state and therefore differs across chunk partitions.
    expect(chunked.revision).toBe(6);
    expect(single.revision).toBe(1);
  });

  it("persists future effective activations and drains each exactly once", () => {
    const config = sinusConfig();
    let state = initialState(config);

    let trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 0.85);
    expect(trial.activationEvents).toEqual([]);
    expect(trial.candidateState.pendingActivationEvents).toHaveLength(2);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(state, trial);

    trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 0.9);
    expect(trial.activationEvents.map((event) => event.eventId))
      .toEqual(["sinus-generator:source:0:atria-calcium"]);
    expect(trial.candidateState.pendingActivationEvents).toHaveLength(1);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(state, trial);

    trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 0.999);
    expect(trial.activationEvents).toEqual([]);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(state, trial);

    trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 1);
    expect(trial.activationEvents.map((event) => event.eventId))
      .toEqual(["sinus-generator:source:0:ventricles-calcium"]);
    state = commitAcceptedDeterministicRhythmGeneratorTrialV1(state, trial);

    trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 1.1);
    expect(trial.activationEvents).toEqual([]);
    expect(trial.candidateState.pendingActivationEvents).toEqual([]);
  });

  it("emits a complete, canonically ordered simultaneous batch", () => {
    const config = generatorConfig({
      sourceAnchorTimeSec: 0.5,
      atrialElectricalToCalciumDelaySec: 0.1,
      ventricularElectricalToCalciumDelaySec: 0,
      avGateParameters: avParameters({
        minimumConductionDelaySec: 0.1,
      }),
    });
    const trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      initialState(config),
      0.6,
    );

    expect(trial.activationEvents).toHaveLength(2);
    expect(trial.activationEvents.map((event) => [
      event.activationTimeSec,
      event.priority,
      event.sourceSequence,
    ])).toEqual([
      [0.6, 10, 0],
      [0.6, 20, 1],
    ]);
    expect(trial.simultaneousBatchCount).toBe(1);
    expect(trial.candidateState.pendingActivationEvents).toEqual([]);
  });

  it("clips mechanics steps at exact pending and generated batch boundaries", () => {
    const config = sinusConfig();
    const initial = initialState(config);
    const preBoundaryTrial =
      evaluateAcceptedDeterministicRhythmGeneratorTrialV1(initial, 0.85);
    const pendingState = commitAcceptedDeterministicRhythmGeneratorTrialV1(
      initial,
      preBoundaryTrial,
    );
    const pendingBefore = structuredClone(pendingState);
    const pendingStep = maximumAcceptedDeterministicRhythmGeneratorStepV1(
      pendingState,
      0.3,
    );
    expect(pendingStep).toMatchObject({
      candidateTimeSec: 0.852,
      clippedByEffectiveActivation: true,
      boundaryEventId: "sinus-generator:source:0:atria-calcium",
      boundaryActivationTimeSec: 0.852,
      boundaryBatchSize: 1,
    });
    expect(pendingStep.maximumStepSec).toBe(0.852 - 0.85);
    expect(pendingState).toEqual(pendingBefore);

    const simultaneousConfig = generatorConfig({
      sourceAnchorTimeSec: 0.5,
      atrialElectricalToCalciumDelaySec: 0.1,
      ventricularElectricalToCalciumDelaySec: 0,
      avGateParameters: avParameters({ minimumConductionDelaySec: 0.1 }),
    });
    const simultaneousState = initialState(simultaneousConfig);
    const generatedStep = maximumAcceptedDeterministicRhythmGeneratorStepV1(
      simultaneousState,
      1,
    );
    expect(generatedStep).toMatchObject({
      candidateTimeSec: 0.6,
      clippedByEffectiveActivation: true,
      boundaryBatchSize: 2,
    });
    const boundaryTrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      simultaneousState,
      generatedStep.candidateTimeSec,
    );
    expect(boundaryTrial.activationEvents).toHaveLength(2);
    expect(boundaryTrial.activationEvents.every((event) =>
      event.activationTimeSec === generatedStep.boundaryActivationTimeSec))
      .toBe(true);
    expect(boundaryTrial.activationEvents[0]!.activationTimeSec)
      .toBe(generatedStep.candidateTimeSec);

    const exactEndpoint = maximumAcceptedDeterministicRhythmGeneratorStepV1(
      simultaneousState,
      0.6,
    );
    expect(exactEndpoint.candidateTimeSec).toBe(0.6);
    expect(exactEndpoint.clippedByEffectiveActivation).toBe(false);
    expect(exactEndpoint.boundaryBatchSize).toBe(2);
  });

  it("keeps retry and rollback pure and rejects forged trials and invalid initialization", () => {
    const config = sinusConfig();
    const state = initialState(config);
    const before = structuredClone(state);
    const trial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 1);
    const retry = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(state, 1);

    expect(retry).toEqual(trial);
    expect(state).toEqual(before);
    expect(rollbackAcceptedDeterministicRhythmGeneratorTrialV1(state, trial))
      .toBe(state);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.configuration)).toBe(true);
    expect(Object.isFrozen(state.avGateState)).toBe(true);
    expect(Object.isFrozen(state.pendingActivationEvents)).toBe(true);

    const forged = {
      ...trial,
      simultaneousBatchCount: trial.simultaneousBatchCount + 1,
    };
    expect(() => commitAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      forged,
    )).toThrow(/exact recomputation/);

    expect(() => initializeAcceptedDeterministicRhythmGeneratorStateV1(
      config,
      {
        acceptedTimeSec: 0.84,
        revision: 0,
        nextSourceIndex: 0,
        nextSourceActivationTimeSec: 0.84,
      },
    )).toThrow(/must exceed accepted start/);
    expect(() => generatorConfig({
      sourceMode: "atrial-fibrillation" as never,
    })).toThrow(/regular-sinus or regular-atrial-flutter/);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1
      .atrialFibrillationClaimed).toBe(false);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1.ecgClaimed)
      .toBe(false);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1
      .clinicalValidityClaimed).toBe(false);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1
      .iabpTriggerSynchronizationClaimed).toBe(false);
    expect(ACCEPTED_DETERMINISTIC_RHYTHM_GENERATOR_CLAIM_V1
      .iabpTriggerRequirement).toMatch(/separate-accepted-actuator-queue/);

    const pendingTrial = evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
      state,
      0.85,
    );
    const pendingEvent = pendingTrial.candidateState.pendingActivationEvents[0]!;
    const duplicatedPendingState = Object.freeze({
      ...pendingTrial.candidateState,
      pendingActivationEvents: Object.freeze([pendingEvent, pendingEvent]),
    });
    expect(() => validateAcceptedDeterministicRhythmGeneratorStateV1(
      duplicatedPendingState,
    )).toThrow(/duplicates a deterministic pending activation/);
  });

  it("checkpoints a pending queue exactly and rejects SHA or config mismatch", async () => {
    const config = sinusConfig();
    const initial = initialState(config);
    const beforeCheckpointTrial =
      evaluateAcceptedDeterministicRhythmGeneratorTrialV1(initial, 0.9);
    const beforeCheckpoint =
      commitAcceptedDeterministicRhythmGeneratorTrialV1(
        initial,
        beforeCheckpointTrial,
      );
    expect(beforeCheckpoint.pendingActivationEvents).toHaveLength(1);

    const checkpoint =
      await checkpointAcceptedDeterministicRhythmGeneratorStateV1(
        beforeCheckpoint,
      );
    const restored = await restoreAcceptedDeterministicRhythmGeneratorStateV1(
      structuredClone(checkpoint),
      config,
    );
    expect(restored).toEqual(beforeCheckpoint);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(Object.isFrozen(restored.pendingActivationEvents[0])).toBe(true);

    const changedConfig = generatorConfig({
      generatorConfigId: config.generatorConfigId,
      generatorInstanceId: config.generatorInstanceId,
      sourceId: config.sourceId,
      sourceMode: config.sourceMode,
      sourceAnchorTimeSec: config.sourceAnchorTimeSec,
      sourcePeriodSec: 1.1,
      atrialElectricalToCalciumDelaySec:
        config.atrialElectricalToCalciumDelaySec,
      ventricularElectricalToCalciumDelaySec:
        config.ventricularElectricalToCalciumDelaySec,
      atrialActivationStrength01: config.atrialActivationStrength01,
      ventricularActivationStrength01: config.ventricularActivationStrength01,
      avGateParameters: config.avGateParameters,
    });
    await expect(restoreAcceptedDeterministicRhythmGeneratorStateV1(
      structuredClone(checkpoint),
      changedConfig,
    )).rejects.toThrow(/configuration mismatch/);

    const tampered = {
      ...structuredClone(checkpoint),
      pendingActivationEvents: checkpoint.pendingActivationEvents.map(
        (event, index) => index === 0
          ? { ...event, activationStrength01: 0.1 }
          : { ...event },
      ),
    };
    await expect(restoreAcceptedDeterministicRhythmGeneratorStateV1(
      tampered,
      config,
    )).rejects.toThrow(/SHA-256 mismatch/);

    const directContinuation =
      evaluateAcceptedDeterministicRhythmGeneratorTrialV1(
        beforeCheckpoint,
        2.1,
      );
    const restoredContinuation =
      evaluateAcceptedDeterministicRhythmGeneratorTrialV1(restored, 2.1);
    expect(restoredContinuation).toEqual(directContinuation);
    expect(commitAcceptedDeterministicRhythmGeneratorTrialV1(
      restored,
      restoredContinuation,
    )).toEqual(commitAcceptedDeterministicRhythmGeneratorTrialV1(
      beforeCheckpoint,
      directContinuation,
    ));
  });
});

function sinusConfig(): AcceptedDeterministicRhythmGeneratorConfigV1 {
  return generatorConfig({
    generatorConfigId: "legacy-compatible-sinus-config-v1",
    generatorInstanceId: "sinus-generator",
    sourceId: "regular-sinus-source",
    sourceMode: "regular-sinus",
    sourceAnchorTimeSec: 0.84,
    sourcePeriodSec: 1,
    atrialElectricalToCalciumDelaySec: 0.012,
    ventricularElectricalToCalciumDelaySec: 0.012,
    avGateParameters: avParameters({ minimumConductionDelaySec: 0.148 }),
  });
}

function generatorConfig(
  overrides: Partial<AcceptedDeterministicRhythmGeneratorConfigInputV1> = {},
): AcceptedDeterministicRhythmGeneratorConfigV1 {
  const input: AcceptedDeterministicRhythmGeneratorConfigInputV1 = {
    generatorConfigId: "deterministic-rhythm-config-v1",
    generatorInstanceId: "deterministic-rhythm-generator",
    sourceId: "deterministic-rhythm-source",
    sourceMode: "regular-sinus",
    sourceAnchorTimeSec: 0.5,
    sourcePeriodSec: 1,
    atrialElectricalToCalciumDelaySec: 0.012,
    ventricularElectricalToCalciumDelaySec: 0.012,
    atrialActivationStrength01: 1,
    ventricularActivationStrength01: 1,
    avGateParameters: avParameters(),
    ...overrides,
  };
  return createAcceptedDeterministicRhythmGeneratorConfigV1(input);
}

function avParameters(
  overrides: Partial<{
    minimumConductionDelaySec: number;
    recoveryDelayAmplitudeSec: number;
    recoveryTimeConstantSec: number;
    postConductionRefractorySec: number;
    concealedRefractoryExtensionSec: number;
  }> = {},
): RecoveryConcealmentAvGateParametersV1 {
  return createRecoveryConcealmentAvGateParametersV1({
    parameterSetId: "deterministic-generator-av-gate-v1",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "deterministic-generator-component-test-v1",
    },
    minimumConductionDelaySec: 0.16,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: 1,
    postConductionRefractorySec: 0.24,
    concealedRefractoryExtensionSec: 0.16,
    ...overrides,
  });
}

function jorgensenFourToOneParameters(): RecoveryConcealmentAvGateParametersV1 {
  return createRecoveryConcealmentAvGateParametersV1({
    parameterSetId: "jorgensen-four-to-one-component-v1",
    parameterProvenance: {
      kind: "literature-component-reproduction",
      sourceId:
        "jorgensen-et-al-2002-pii-s0092824002903137-four-to-one-component",
    },
    minimumConductionDelaySec: 0.164,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: 1,
    postConductionRefractorySec: 0.240,
    concealedRefractoryExtensionSec: 0.160,
  });
}

function initialState(
  config: AcceptedDeterministicRhythmGeneratorConfigV1,
): AcceptedDeterministicRhythmGeneratorStateV1 {
  return initializeAcceptedDeterministicRhythmGeneratorStateV1(config, {
    acceptedTimeSec: 0,
    revision: 0,
    nextSourceIndex: 0,
    nextSourceActivationTimeSec: config.sourceAnchorTimeSec,
  });
}
