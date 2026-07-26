import { describe, expect, it } from "vitest";

import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  zeroExactEventCalciumStateV1,
  type ExactEventCalciumParametersV1,
} from "@/engine/myocardium/calcium/exactEventPrescribedCalciumV1";
import {
  createAcceptedDeterministicRhythmGeneratorConfigV1,
} from "@/engine/myocardium/rhythm/acceptedDeterministicRhythmGeneratorV1";
import {
  ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1,
  GENERATED_FIVE_WALL_PERIODIC_SINUS_ABS_TOLERANCE_UM_V1,
  checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  createAcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1,
  evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  initializeAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1,
  restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1,
  rollbackAcceptedGeneratedFiveWallRhythmCalciumTrialV1,
  type AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
  type AcceptedGeneratedFiveWallRhythmCalciumStateV1,
  type GeneratedFiveWallExactEventCalciumParametersV1,
  type GeneratedFiveWallExactEventCalciumStatesV1,
} from "@/engine/myocardium/rhythm/acceptedGeneratedFiveWallRhythmCalciumOwnerV1";
import {
  createRecoveryConcealmentAvGateParametersV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";

const WALLS = ["LA", "RA", "LVFW", "SEP", "RVFW"] as const;

describe("accepted generated five-wall rhythm-calcium owner V1", () => {
  it("matches the fixed prior at off-grid and event boundaries over one cycle", () => {
    const owner = fixedPriorOwner();
    const params = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const generator = owner.acceptedState.generatorState;

    expect(owner.timing).toMatchObject({
      acceptedStartTimeSec: 0,
      cycleLengthSec: 1,
      sourceAnchorTimeSec: -0.16,
      firstFutureAtrialElectricalTimeSec: 0.84,
      atrioventricularMinimumConductionDelaySec: 0.16,
      historicalVentricularElectricalTimeSec: 0,
      atrialElectricalToCalciumDelaySec: 0.012,
      ventricularElectricalToCalciumDelaySec: 0.012,
      firstPendingVentricularCalciumTimeSec: 0.012,
    });
    expect(generator.nextSourceIndex).toBe(1);
    expect(generator.nextSourceActivationTimeSec).toBe(0.84);
    expect(generator.pendingActivationEvents.map((event) => [
      event.activationTimeSec,
      event.targetIds,
    ])).toEqual([[0.012, ["LVFW", "RVFW", "SEP"]]]);
    expect(owner.binding.generatorConfig.avGateParameters
      .minimumConductionDelaySec).toBe(params.atrioventricularDelaySec);
    const firstStep = maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1(
      owner.acceptedState,
      1,
      owner.binding,
    );
    expect(firstStep.candidateTimeSec).toBe(0.012);
    expect(firstStep.generator.boundaryBatchSize).toBe(1);

    const times = [...new Set([
      0.000_37,
      0.011_999,
      0.012,
      0.012_001,
      0.217_31,
      0.851_999,
      0.852,
      0.852_001,
      ...Array.from({ length: 1_000 }, (_, index) => (index + 1) / 1_000),
    ])].sort((left, right) => left - right);
    let state = owner.acceptedState;
    let maximumAbsoluteErrorUM = 0;
    const eventIds: string[] = [];
    for (const timeSec of times) {
      const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        state,
        timeSec,
        owner.binding,
      );
      eventIds.push(...trial.activationEvents.map((event) => event.eventId));
      const legacy = evaluateFiveWallNormalCalciumDriveV1(timeSec, params);
      for (const wall of WALLS) {
        maximumAbsoluteErrorUM = Math.max(
          maximumAbsoluteErrorUM,
          Math.abs(
            trial.candidateFreeCalciumUMByWall[wall]
              - legacy.freeCalciumUMByWall[wall],
          ),
        );
      }
      state = commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        state,
        trial,
        owner.binding,
      );
    }

    expect(maximumAbsoluteErrorUM)
      .toBeLessThanOrEqual(GENERATED_FIVE_WALL_PERIODIC_SINUS_ABS_TOLERANCE_UM_V1);
    expect(eventIds.filter((id) => id.endsWith("ventricles-calcium")))
      .toHaveLength(1);
    expect(eventIds.filter((id) => id.endsWith("atria-calcium")))
      .toHaveLength(1);
    expect(owner.compatibility.exactBitParityClaimed).toBe(false);
  });

  it("is chunk invariant in physiological state while revision follows partitioning", () => {
    const owner = fixedPriorOwner();
    const directTrial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      owner.acceptedState,
      1,
      owner.binding,
    );
    const direct = commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      owner.acceptedState,
      directTrial,
      owner.binding,
    );

    let chunked = owner.acceptedState;
    for (const end of [0.012, 0.123_7, 0.84, 0.852, 1]) {
      const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        chunked,
        end,
        owner.binding,
      );
      chunked = commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
        chunked,
        trial,
        owner.binding,
      );
    }

    for (const wall of WALLS) {
      expect(chunked.calciumStateByWall[wall][0])
        .toBeCloseTo(direct.calciumStateByWall[wall][0], 14);
      expect(chunked.calciumStateByWall[wall][1])
        .toBeCloseTo(direct.calciumStateByWall[wall][1], 14);
    }
    expect(chunked.generatorState.nextSourceIndex)
      .toBe(direct.generatorState.nextSourceIndex);
    expect(chunked.generatorState.nextSourceActivationTimeSec)
      .toBe(direct.generatorState.nextSourceActivationTimeSec);
    expect(chunked.generatorState.avGateState)
      .toEqual(direct.generatorState.avGateState);
    expect(chunked.generatorState.pendingActivationEvents)
      .toEqual(direct.generatorState.pendingActivationEvents);
    expect(chunked.revision).toBe(5);
    expect(direct.revision).toBe(1);
  });

  it("clips at complete simultaneous batches and advances all wall classes", () => {
    const binding = explicitBinding({ simultaneous: true });
    const initial = explicitInitialState(binding);
    const step = maximumAcceptedGeneratedFiveWallRhythmCalciumStepV1(
      initial,
      1,
      binding,
    );
    expect(step.candidateTimeSec).toBe(0.6);
    expect(step.generator.boundaryBatchSize).toBe(2);

    const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      initial,
      step.candidateTimeSec,
      binding,
    );
    expect(trial.activationEvents.map((event) => [
      event.activationTimeSec,
      event.targetIds,
    ])).toEqual([
      [0.6, ["LA", "RA"]],
      [0.6, ["LVFW", "RVFW", "SEP"]],
    ]);
    expect(trial.simultaneousBatchCount).toBe(1);
    for (const wall of WALLS) {
      expect(trial.candidateCalciumStateByWall[wall][0]).toBeGreaterThan(0);
      expect(trial.candidateCalciumStateByWall[wall][1]).toBeGreaterThan(0);
    }
  });

  it("keeps retries and rollback pure and rejects a forged calcium candidate", () => {
    const owner = fixedPriorOwner();
    const accepted = owner.acceptedState;
    const before = structuredClone(accepted);
    const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      accepted,
      0.2,
      owner.binding,
    );
    const retry = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      accepted,
      0.2,
      owner.binding,
    );
    expect(retry).toEqual(trial);
    expect(accepted).toEqual(before);
    expect(rollbackAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      accepted,
      trial,
      owner.binding,
    )).toBe(accepted);

    const forged = {
      ...trial,
      candidateFreeCalciumUMByWall: {
        ...trial.candidateFreeCalciumUMByWall,
        LA: trial.candidateFreeCalciumUMByWall.LA + 0.001,
      },
    };
    expect(() => commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      accepted,
      forged,
      owner.binding,
    )).toThrow(/exact recomputation/);
  });

  it("checkpoints a historical pending event and drains it once after exact restore", async () => {
    const owner = fixedPriorOwner();
    expect(owner.acceptedState.generatorState.pendingActivationEvents)
      .toHaveLength(1);
    const checkpoint =
      await checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1(
        owner.acceptedState,
        owner.binding,
      );
    const restored =
      await restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
        structuredClone(checkpoint),
        owner.binding,
      );
    expect(restored).toEqual(owner.acceptedState);
    expect(evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      restored,
      0.9,
      owner.binding,
    )).toEqual(evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      owner.acceptedState,
      0.9,
      owner.binding,
    ));

    const tampered = {
      ...structuredClone(checkpoint),
      calciumStateByWall: {
        ...checkpoint.calciumStateByWall,
        LA: [
          checkpoint.calciumStateByWall.LA[0],
          checkpoint.calciumStateByWall.LA[1] + 0.001,
        ],
      },
    };
    await expect(restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
      tampered,
      owner.binding,
    )).rejects.toThrow(/SHA-256 mismatch/);

    let trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      restored,
      0.012,
      owner.binding,
    );
    expect(trial.activationEvents).toHaveLength(1);
    expect(trial.activationEvents[0]!.activationTimeSec).toBe(0.012);
    const after = commitAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      restored,
      trial,
      owner.binding,
    );
    trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      after,
      0.02,
      owner.binding,
    );
    expect(trial.activationEvents).toEqual([]);
  });

  it("rejects same-ID generator and calcium content substitutions", async () => {
    const owner = fixedPriorOwner();
    const checkpoint =
      await checkpointAcceptedGeneratedFiveWallRhythmCalciumStateV1(
        owner.acceptedState,
        owner.binding,
      );
    const config = owner.binding.generatorConfig;
    const changedGeneratorConfig = createAcceptedDeterministicRhythmGeneratorConfigV1({
      generatorConfigId: config.generatorConfigId,
      generatorInstanceId: config.generatorInstanceId,
      sourceId: config.sourceId,
      sourceMode: config.sourceMode,
      sourceAnchorTimeSec: config.sourceAnchorTimeSec,
      sourcePeriodSec: config.sourcePeriodSec + 0.001,
      atrialElectricalToCalciumDelaySec:
        config.atrialElectricalToCalciumDelaySec,
      ventricularElectricalToCalciumDelaySec:
        config.ventricularElectricalToCalciumDelaySec,
      atrialActivationStrength01: config.atrialActivationStrength01,
      ventricularActivationStrength01: config.ventricularActivationStrength01,
      avGateParameters: config.avGateParameters,
    });
    const changedGeneratorBinding =
      createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
        bindingId: owner.binding.bindingId,
        generatorConfig: changedGeneratorConfig,
        calciumParametersByWall: owner.binding.calciumParametersByWall,
        parameterProvenance: owner.binding.parameterProvenance,
        sourceParameterSetId: owner.binding.sourceParameterSetId,
      });
    await expect(restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
      structuredClone(checkpoint),
      changedGeneratorBinding,
    )).rejects.toThrow(/binding mismatch/);

    const changedCalcium = {
      ...structuredClone(owner.binding.calciumParametersByWall),
      LA: {
        ...owner.binding.calciumParametersByWall.LA,
        calciumGainUMPerUnitDrive:
          owner.binding.calciumParametersByWall.LA.calciumGainUMPerUnitDrive
          + 0.001,
      },
    };
    const changedCalciumBinding =
      createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
        bindingId: owner.binding.bindingId,
        generatorConfig: owner.binding.generatorConfig,
        calciumParametersByWall: changedCalcium,
        parameterProvenance: owner.binding.parameterProvenance,
        sourceParameterSetId: owner.binding.sourceParameterSetId,
      });
    await expect(restoreAcceptedGeneratedFiveWallRhythmCalciumStateV1(
      structuredClone(checkpoint),
      changedCalciumBinding,
    )).rejects.toThrow(/binding mismatch/);
  });

  it("requires explicit flutter calcium state and never fabricates coherent atrial events", () => {
    const binding = explicitBinding({ flutter: true });
    expect(() => createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
      bindingId: binding.bindingId,
      generatorConfig: binding.generatorConfig,
      calciumParametersByWall: binding.calciumParametersByWall,
      parameterProvenance: "five-wall-normal-periodic-analytic-conversion",
      sourceParameterSetId: "not-a-valid-flutter-periodic-state",
    })).toThrow(/sinus-only/);

    const initial = explicitInitialState(binding);
    expect(initial.initialization).toBe("explicit-accepted-calcium-state");
    const trial = evaluateAcceptedGeneratedFiveWallRhythmCalciumTrialV1(
      initial,
      1.2,
      binding,
    );
    expect(trial.activationEvents.length).toBeGreaterThan(0);
    expect(trial.activationEvents.every((event) =>
      event.targetIds.every((target) => !["LA", "RA"].includes(target))))
      .toBe(true);
    expect(trial.candidateCalciumStateByWall.LA).toEqual(initial.calciumStateByWall.LA);
    expect(trial.candidateCalciumStateByWall.RA).toEqual(initial.calciumStateByWall.RA);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .flutterPeriodicAtrialStateFabricated).toBe(false);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .atrialFibrillationClaimed).toBe(false);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .calciumCyclingClaimed).toBe(false);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .prescribedCalcium).toBe(true);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .ecgClaimed).toBe(false);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .clinicalValidityClaimed).toBe(false);
    expect(ACCEPTED_GENERATED_FIVE_WALL_RHYTHM_CALCIUM_CLAIM_V1
      .iabpTriggerSynchronizationClaimed).toBe(false);
  });
});

function fixedPriorOwner() {
  return createGeneratedPeriodicSinusFiveWallRhythmCalciumOwnerV1(
    FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    {
      bindingId: "generated-fixed-prior-binding-v1",
      generatorConfigId: "generated-fixed-prior-config-v1",
      generatorInstanceId: "generated-fixed-prior-instance-v1",
      sourceId: "generated-fixed-prior-sinus-source-v1",
    },
  );
}

function explicitBinding(options: Readonly<{
  simultaneous?: boolean;
  flutter?: boolean;
}> = {}): AcceptedGeneratedFiveWallRhythmCalciumBindingV1 {
  const avGateParameters = createRecoveryConcealmentAvGateParametersV1({
    parameterSetId: "generated-explicit-av-v1",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "generated-owner-test-v1",
    },
    minimumConductionDelaySec: options.simultaneous ? 0.1 : 0.164,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: 1,
    postConductionRefractorySec: 0.24,
    concealedRefractoryExtensionSec: 0.16,
  });
  const generatorConfig = createAcceptedDeterministicRhythmGeneratorConfigV1({
    generatorConfigId: options.flutter
      ? "generated-flutter-config-v1"
      : "generated-explicit-sinus-config-v1",
    generatorInstanceId: options.flutter
      ? "generated-flutter-instance-v1"
      : "generated-explicit-sinus-instance-v1",
    sourceId: options.flutter
      ? "generated-flutter-source-v1"
      : "generated-explicit-sinus-source-v1",
    sourceMode: options.flutter ? "regular-atrial-flutter" : "regular-sinus",
    sourceAnchorTimeSec: options.flutter ? 0.23 : 0.5,
    sourcePeriodSec: options.flutter ? 0.23 : 1,
    atrialElectricalToCalciumDelaySec: options.simultaneous ? 0.1 : 0.012,
    ventricularElectricalToCalciumDelaySec: 0,
    atrialActivationStrength01: 1,
    ventricularActivationStrength01: 1,
    avGateParameters,
  });
  return createAcceptedGeneratedFiveWallRhythmCalciumBindingV1({
    bindingId: options.flutter
      ? "generated-flutter-binding-v1"
      : "generated-explicit-binding-v1",
    generatorConfig,
    calciumParametersByWall: explicitCalciumParameters(),
    parameterProvenance: "explicit-exact-event-parameters",
    sourceParameterSetId: null,
  });
}

function explicitInitialState(
  binding: AcceptedGeneratedFiveWallRhythmCalciumBindingV1,
): AcceptedGeneratedFiveWallRhythmCalciumStateV1 {
  return initializeAcceptedGeneratedFiveWallRhythmCalciumStateV1(binding, {
    acceptedTimeSec: 0,
    revision: 0,
    nextSourceIndex: 0,
    nextSourceActivationTimeSec: binding.generatorConfig.sourceAnchorTimeSec,
    calciumStateByWall: zeroStates(),
  });
}

function explicitCalciumParameters(): GeneratedFiveWallExactEventCalciumParametersV1 {
  const parameter: ExactEventCalciumParametersV1 = Object.freeze({
    tauRiseSec: 0.05,
    tauDecaySec: 0.2,
    calciumRestUM: 0.1,
    calciumGainUMPerUnitDrive: 1,
  });
  return Object.freeze({
    LA: parameter,
    RA: parameter,
    LVFW: parameter,
    SEP: parameter,
    RVFW: parameter,
  });
}

function zeroStates(): GeneratedFiveWallExactEventCalciumStatesV1 {
  return Object.freeze({
    LA: zeroExactEventCalciumStateV1(),
    RA: zeroExactEventCalciumStateV1(),
    LVFW: zeroExactEventCalciumStateV1(),
    SEP: zeroExactEventCalciumStateV1(),
    RVFW: zeroExactEventCalciumStateV1(),
  });
}
