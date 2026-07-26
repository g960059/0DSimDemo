import { describe, expect, it } from "vitest";

import {
  RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM,
  commitRecoveryConcealmentAvGateCandidateDecisionV1,
  createRecoveryConcealmentAvGateParametersV1,
  evaluateRecoveryConcealmentAvGateCandidateDecisionV1,
  initializeRecoveryConcealmentAvGateStateV1,
  rollbackRecoveryConcealmentAvGateCandidateDecisionV1,
  validateRecoveryConcealmentAvGateStateV1,
  type RecoveryConcealmentAvGateAcceptedStateV1,
  type RecoveryConcealmentAvGateParametersInputV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";

const JORGENSEN_COMPONENT_SOURCE_ID =
  "jorgensen-et-al-2002-pii-s0092824002903137-four-to-one-component";

describe("recovery/concealment AV gate V1", () => {
  it("reproduces the isolated Jørgensen 4:1 component protocol", () => {
    // Construction/component reproduction only: the paper reports atrial
    // 229±5 ms and ventricular 917±7 ms intervals during 4:1 flutter. This
    // protocol uses a 230 ms source interval and tests the selected tuple; it
    // is not an independent validation cohort or a clinical calibration.
    const parameters = createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "jorgensen-four-to-one-component-v1",
      parameterProvenance: {
        kind: "literature-component-reproduction",
        sourceId: JORGENSEN_COMPONENT_SOURCE_ID,
      },
      minimumConductionDelaySec: 0.164,
      recoveryDelayAmplitudeSec: 0,
      recoveryTimeConstantSec: 1,
      postConductionRefractorySec: 0.240,
      concealedRefractoryExtensionSec: 0.160,
    });
    let state = initializeRecoveryConcealmentAvGateStateV1(parameters, {
      gateInstanceId: "av-node-component",
      acceptedTimeSec: 0,
    });
    const outcomes: string[] = [];
    const conductedTimes: number[] = [];

    for (let index = 0; index <= 16; index += 1) {
      const atrialActivationTimeSec = index * 0.23;
      const candidate = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
        state,
        {
          activationId: `A-${index}`,
          atrialActivationTimeSec,
        },
      );
      outcomes.push(candidate.outcome);
      if (candidate.conducted) {
        conductedTimes.push(atrialActivationTimeSec);
        expect(candidate.conductionDelaySec).toBe(0.164);
      }
      state = commitRecoveryConcealmentAvGateCandidateDecisionV1(
        state,
        candidate,
      );
    }

    expect(outcomes).toEqual([
      "conducted", "blocked", "blocked", "blocked",
      "conducted", "blocked", "blocked", "blocked",
      "conducted", "blocked", "blocked", "blocked",
      "conducted", "blocked", "blocked", "blocked",
      "conducted",
    ]);
    expect(conductedTimes).toHaveLength(5);
    [0, 0.92, 1.84, 2.76, 3.68].forEach((expected, index) => {
      expect(conductedTimes[index]).toBeCloseTo(expected, 15);
    });
    const ventricularIntervals = conductedTimes.slice(1).map(
      (time, index) => time - conductedTimes[index]!,
    );
    ventricularIntervals.forEach((interval) => {
      expect(interval).toBeCloseTo(0.92, 15);
    });
    expect(state.acceptedActivationCount).toBe(17);
    expect(state.conductedActivationCount).toBe(5);
    expect(state.blockedActivationCount).toBe(12);
    expect(parameters.parameterProvenance.sourceId)
      .toBe(JORGENSEN_COMPONENT_SOURCE_ID);
  });

  it("conducts at A=R and blocks only for the strict A<R case", () => {
    const parameters = componentParameters();
    const initial = initializeRecoveryConcealmentAvGateStateV1(parameters, {
      gateInstanceId: "boundary-gate",
      acceptedTimeSec: 0,
    });
    const first = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      initial,
      { activationId: "first", atrialActivationTimeSec: 0 },
    );
    const afterFirst = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      initial,
      first,
    );

    const atBoundary = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      afterFirst,
      {
        activationId: "at-R",
        atrialActivationTimeSec: afterFirst.refractoryUntilSec,
      },
    );
    const belowBoundary = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      afterFirst,
      {
        activationId: "below-R",
        atrialActivationTimeSec: afterFirst.refractoryUntilSec - 1e-6,
      },
    );

    expect(atBoundary.outcome).toBe("conducted");
    expect(atBoundary.recoveryBeyondRefractorySec).toBe(0);
    expect(belowBoundary.outcome).toBe("blocked");
    expect(belowBoundary.refractoryUntilAfterSec).toBeCloseTo(
      afterFirst.refractoryUntilSec
        + parameters.concealedRefractoryExtensionSec,
      15,
    );
  });

  it("accepts externally ordered coincident activations without advancing time", () => {
    const parameters = componentParameters();
    const initial = initializeRecoveryConcealmentAvGateStateV1(parameters, {
      gateInstanceId: "coincident-gate",
      acceptedTimeSec: 0,
    });
    const first = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      initial,
      { activationId: "coincident-first", atrialActivationTimeSec: 0 },
    );
    const afterFirst = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      initial,
      first,
    );
    const second = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      afterFirst,
      { activationId: "coincident-second", atrialActivationTimeSec: 0 },
    );
    const afterSecond = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      afterFirst,
      second,
    );

    expect(first.outcome).toBe("conducted");
    expect(second.outcome).toBe("blocked");
    expect(second.activationOrdinal).toBe(2);
    expect(afterSecond.acceptedTimeSec).toBe(0);
    expect(afterSecond.revision).toBe(2);
    expect(afterSecond.acceptedActivationCount).toBe(2);
  });

  it("uses Dmin initially and decreases delay monotonically with recovery", () => {
    const parameters = createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "recovery-monotonicity-v1",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "recovery-monotonicity-unit-protocol-v1",
      },
      minimumConductionDelaySec: 0.1,
      recoveryDelayAmplitudeSec: 0.08,
      recoveryTimeConstantSec: 0.5,
      postConductionRefractorySec: 0.2,
      concealedRefractoryExtensionSec: 0.1,
    });
    let state = initializeRecoveryConcealmentAvGateStateV1(parameters, {
      gateInstanceId: "recovery-gate",
      acceptedTimeSec: 0,
    });
    const initial = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      { activationId: "initial", atrialActivationTimeSec: 0 },
    );
    expect(initial.recoveryBeyondRefractorySec).toBeNull();
    expect(initial.conductionDelaySec).toBe(parameters.minimumConductionDelaySec);
    state = commitRecoveryConcealmentAvGateCandidateDecisionV1(state, initial);

    const zeroRecovery = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      {
        activationId: "recovery-0",
        atrialActivationTimeSec: state.refractoryUntilSec,
      },
    );
    state = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      zeroRecovery,
    );
    const halfSecond = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      {
        activationId: "recovery-0.5",
        atrialActivationTimeSec: state.refractoryUntilSec + 0.5,
      },
    );
    state = commitRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      halfSecond,
    );
    const oneSecond = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      state,
      {
        activationId: "recovery-1",
        atrialActivationTimeSec: state.refractoryUntilSec + 1,
      },
    );

    expect(zeroRecovery.conductionDelaySec).toBeCloseTo(0.18, 15);
    expect(halfSecond.conductionDelaySec)
      .toBeCloseTo(0.1 + 0.08 * Math.exp(-1), 15);
    expect(oneSecond.conductionDelaySec)
      .toBeCloseTo(0.1 + 0.08 * Math.exp(-2), 15);
    expect(zeroRecovery.conductionDelaySec!)
      .toBeGreaterThan(halfSecond.conductionDelaySec!);
    expect(halfSecond.conductionDelaySec!)
      .toBeGreaterThan(oneSecond.conductionDelaySec!);
    expect(oneSecond.conductionDelaySec!)
      .toBeGreaterThan(parameters.minimumConductionDelaySec);
  });

  it("is translation invariant across signed absolute event history", () => {
    const parameters = componentParameters();
    const run = (shiftSec: number) => {
      let state = initializeRecoveryConcealmentAvGateStateV1(parameters, {
        gateInstanceId: "translated-gate",
        acceptedTimeSec: -1 + shiftSec,
      });
      return [-0.5, -0.2, 0.4].map((baseTime, index) => {
        const decision = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
          state,
          {
            activationId: `translated-${index}`,
            atrialActivationTimeSec: baseTime + shiftSec,
          },
        );
        state = commitRecoveryConcealmentAvGateCandidateDecisionV1(
          state,
          decision,
        );
        return decision;
      });
    };
    const signed = run(0);
    const shifted = run(2);

    expect(signed.map((decision) => decision.outcome))
      .toEqual(shifted.map((decision) => decision.outcome));
    signed.forEach((decision, index) => {
      const translated = shifted[index]!;
      expect(translated.conductionDelaySec).toBe(decision.conductionDelaySec);
      if (decision.recoveryBeyondRefractorySec !== null) {
        expect(translated.recoveryBeyondRefractorySec)
          .toBeCloseTo(decision.recoveryBeyondRefractorySec, 15);
      } else {
        expect(translated.recoveryBeyondRefractorySec).toBeNull();
      }
      expect(translated.atrialActivationTimeSec - 2)
        .toBeCloseTo(decision.atrialActivationTimeSec, 15);
      expect(translated.refractoryUntilAfterSec - 2)
        .toBeCloseTo(decision.refractoryUntilAfterSec, 15);
      if (decision.ventricularActivationTimeSec !== null) {
        expect(translated.ventricularActivationTimeSec! - 2)
          .toBeCloseTo(decision.ventricularActivationTimeSec, 15);
      }
    });
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.absoluteEventAndStateTimes)
      .toBe("signed-finite");
  });

  it("keeps retries and rollback pure and rejects a forged candidate", () => {
    const parameters = componentParameters();
    const accepted = initializeRecoveryConcealmentAvGateStateV1(parameters, {
      gateInstanceId: "pure-gate",
      acceptedTimeSec: 0,
    });
    const before = structuredClone(accepted);
    const first = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      accepted,
      { activationId: "A-0", atrialActivationTimeSec: 0 },
    );
    const retry = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      accepted,
      { activationId: "A-0", atrialActivationTimeSec: 0 },
    );

    expect(retry).toEqual(first);
    expect(accepted).toEqual(before);
    expect(rollbackRecoveryConcealmentAvGateCandidateDecisionV1(
      accepted,
      first,
    )).toBe(accepted);
    expect(Object.isFrozen(accepted)).toBe(true);
    expect(Object.isFrozen(accepted.parameters)).toBe(true);
    expect(Object.isFrozen(accepted.parameters.parameterProvenance)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.candidateState)).toBe(true);

    const forged = {
      ...first,
      conductionDelaySec: first.conductionDelaySec! + 1e-3,
    };
    expect(() => commitRecoveryConcealmentAvGateCandidateDecisionV1(
      accepted,
      forged,
    )).toThrow(/does not match/);
  });

  it("fails closed on extra keys, non-monotone clocks, and counter drift", () => {
    const input = componentParameterInput();
    expect(() => createRecoveryConcealmentAvGateParametersV1({
      ...input,
      unownedField: 1,
    } as RecoveryConcealmentAvGateParametersInputV1)).toThrow(/exactly/);
    expect(() => createRecoveryConcealmentAvGateParametersV1({
      ...input,
      parameterProvenance: {
        ...input.parameterProvenance,
        unownedField: true,
      },
    } as RecoveryConcealmentAvGateParametersInputV1)).toThrow(/exactly/);
    expect(() => createRecoveryConcealmentAvGateParametersV1({
      ...input,
      recoveryTimeConstantSec: 0,
    })).toThrow(/greater than zero/);
    expect(() => createRecoveryConcealmentAvGateParametersV1({
      ...input,
      minimumConductionDelaySec: 0,
    })).toThrow(/greater than zero/);
    expect(() => createRecoveryConcealmentAvGateParametersV1({
      ...input,
      postConductionRefractorySec: 0,
    })).toThrow(/greater than zero/);

    const accepted = initializeRecoveryConcealmentAvGateStateV1(
      componentParameters(),
      { gateInstanceId: "validation-gate", acceptedTimeSec: 1 },
    );
    expect(() => evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
      accepted,
      { activationId: "past", atrialActivationTimeSec: 0.999 },
    )).toThrow(/monotone/);
    expect(() => validateRecoveryConcealmentAvGateStateV1({
      ...accepted,
      acceptedActivationCount: 1,
    })).toThrow(/revision/);
    expect(() => validateRecoveryConcealmentAvGateStateV1({
      ...accepted,
      unownedField: true,
    } as RecoveryConcealmentAvGateAcceptedStateV1)).toThrow(/exactly/);
  });

  it("publishes only a component claim, never AF or clinical validity", () => {
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.scope)
      .toBe("isolated-av-recovery-and-concealment-component");
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.atrialFibrillationClaimed)
      .toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.wholeAvNodePhysiologyClaimed)
      .toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.concealmentConsensusClaimed)
      .toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.literatureUse)
      .toBe("construction-and-component-reproduction-not-independent-validation");
    expect(RECOVERY_CONCEALMENT_AV_GATE_V1_CLAIM.clinicalValidityClaimed)
      .toBe(false);
  });
});

function componentParameters() {
  return createRecoveryConcealmentAvGateParametersV1(
    componentParameterInput(),
  );
}

function componentParameterInput(): RecoveryConcealmentAvGateParametersInputV1 {
  return {
    parameterSetId: "boundary-component-v1",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "boundary-component-unit-protocol-v1",
    },
    minimumConductionDelaySec: 0.164,
    recoveryDelayAmplitudeSec: 0,
    recoveryTimeConstantSec: 1,
    postConductionRefractorySec: 0.240,
    concealedRefractoryExtensionSec: 0.160,
  };
}
