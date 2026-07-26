import { describe, expect, it } from "vitest";

import {
  commitRecoveryConcealmentAvGateCandidateDecisionV1,
  createRecoveryConcealmentAvGateParametersV1,
  evaluateRecoveryConcealmentAvGateCandidateDecisionV1,
  initializeRecoveryConcealmentAvGateStateV1,
  type RecoveryConcealmentAvGateAcceptedStateV1,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV1";
import {
  RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM,
  commitRecoveryConcealmentAvGateCandidateDecisionV2,
  createRecoveryConcealmentAvGateConfigurationV2,
  evaluateRecoveryConcealmentAvGateCandidateDecisionV2,
  initializeRecoveryConcealmentAvGateStateV2,
  rollbackRecoveryConcealmentAvGateCandidateDecisionV2,
  validateRecoveryConcealmentAvGateStateV2,
  type RecoveryConcealmentAvGateAcceptedStateV2,
  type RecoveryConcealmentAvGateConfigurationInputV2,
} from "@/engine/myocardium/rhythm/recoveryConcealmentAvGateV2";

describe("recovery/concealment proximal AV owner V2", () => {
  it("shadows every V1 equation and decision for matched explicit inputs", () => {
    const v1Parameters = createRecoveryConcealmentAvGateParametersV1({
      parameterSetId: "matched-shadow-parameters",
      parameterProvenance: {
        kind: "explicit-research-parameters",
        sourceId: "matched-shadow-unit-input",
      },
      minimumConductionDelaySec: 0.1,
      recoveryDelayAmplitudeSec: 0.08,
      recoveryTimeConstantSec: 0.5,
      postConductionRefractorySec: 0.2,
      concealedRefractoryExtensionSec: 0.1,
    });
    const v2Configuration = configuration();
    let v1 = initializeRecoveryConcealmentAvGateStateV1(v1Parameters, {
      gateInstanceId: "matched-proximal-owner",
      acceptedTimeSec: -0.5,
    });
    let v2 = initializeRecoveryConcealmentAvGateStateV2(v2Configuration, {
      acceptedAtrialActivationTimeSec: -0.5,
    });
    const times = [-0.5, -0.5, -0.1, 0, 0.9];
    const outcomes: string[] = [];

    times.forEach((timeSec, index) => {
      const v1Decision = evaluateRecoveryConcealmentAvGateCandidateDecisionV1(
        v1,
        { activationId: `matched-${index}`, atrialActivationTimeSec: timeSec },
      );
      const v2Decision = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
        v2,
        {
          atrialActivationId: `matched-${index}`,
          atrialActivationTimeSec: timeSec,
        },
      );
      outcomes.push(v2Decision.outcome);
      expect(v2Decision.outcome).toBe(v1Decision.outcome);
      expect(v2Decision.conductedToProximalAvOutput)
        .toBe(v1Decision.conducted);
      expect(v2Decision.recoveryBeyondProximalAvRefractorySec)
        .toBe(v1Decision.recoveryBeyondRefractorySec);
      expect(v2Decision.proximalAvConductionDelaySec)
        .toBe(v1Decision.conductionDelaySec);
      expect(v2Decision.proximalAvOutputTimeSec)
        .toBe(v1Decision.ventricularActivationTimeSec);
      expect(v2Decision.proximalAvRefractoryUntilBeforeSec)
        .toBe(v1Decision.refractoryUntilBeforeSec);
      expect(v2Decision.proximalAvRefractoryUntilAfterSec)
        .toBe(v1Decision.refractoryUntilAfterSec);
      if (v2Decision.proximalAvOutputTimeSec !== null) {
        expect(v2Decision.proximalAvOutputTimeSec).toBeGreaterThan(timeSec);
      }

      v1 = commitRecoveryConcealmentAvGateCandidateDecisionV1(v1, v1Decision);
      v2 = commitRecoveryConcealmentAvGateCandidateDecisionV2(v2, v2Decision);
      expectMappedStatesEqual(v1, v2);
    });
    expect(outcomes).toEqual([
      "conducted",
      "blocked",
      "conducted",
      "blocked",
      "conducted",
    ]);
  });

  it("conducts exact A=R, blocks only A<R, and extends concealed refractory time", () => {
    const initial = initializeRecoveryConcealmentAvGateStateV2(
      configuration(),
      { acceptedAtrialActivationTimeSec: 0 },
    );
    const first = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      initial,
      { atrialActivationId: "first", atrialActivationTimeSec: 0 },
    );
    const afterFirst = commitRecoveryConcealmentAvGateCandidateDecisionV2(
      initial,
      first,
    );
    const atBoundary = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      afterFirst,
      {
        atrialActivationId: "at-boundary",
        atrialActivationTimeSec: afterFirst.proximalAvRefractoryUntilSec,
      },
    );
    const belowBoundary = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      afterFirst,
      {
        atrialActivationId: "below-boundary",
        atrialActivationTimeSec:
          afterFirst.proximalAvRefractoryUntilSec - 1e-12,
      },
    );

    expect(atBoundary.outcome).toBe("conducted");
    expect(atBoundary.recoveryBeyondProximalAvRefractorySec).toBe(0);
    expect(atBoundary.proximalAvOutputTimeSec)
      .toBeGreaterThan(atBoundary.atrialActivationTimeSec);
    expect(belowBoundary.outcome).toBe("blocked");
    expect(belowBoundary.proximalAvOutputTimeSec).toBeNull();
    expect(belowBoundary.proximalAvRefractoryUntilAfterSec).toBe(
      afterFirst.proximalAvRefractoryUntilSec
        + afterFirst.configuration
          .concealedProximalAvRefractoryExtensionSec,
    );
  });

  it("owns blocked/conducted input sequences without advancing its clock to future output", () => {
    let state = initializeRecoveryConcealmentAvGateStateV2(configuration(), {
      acceptedAtrialActivationTimeSec: 0,
    });
    const times = [0, 0.1, 0.2, 0.4, 0.6, 1.0];
    const outcomes: string[] = [];
    for (const [index, timeSec] of times.entries()) {
      const decision = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
        state,
        {
          atrialActivationId: `sequence-${index}`,
          atrialActivationTimeSec: timeSec,
        },
      );
      outcomes.push(decision.outcome);
      state = commitRecoveryConcealmentAvGateCandidateDecisionV2(
        state,
        decision,
      );
      expect(state.acceptedAtrialActivationTimeSec).toBe(timeSec);
      if (decision.proximalAvOutputTimeSec !== null) {
        expect(decision.proximalAvOutputTimeSec).toBeGreaterThan(
          state.acceptedAtrialActivationTimeSec,
        );
      }
    }
    expect(outcomes).toEqual([
      "conducted",
      "blocked",
      "blocked",
      "blocked",
      "conducted",
      "conducted",
    ]);
    expect(state.acceptedAtrialActivationCount).toBe(6);
    expect(state.conductedAtrialActivationCount).toBe(3);
    expect(state.blockedAtrialActivationCount).toBe(3);
  });

  it("keeps candidate retries and rollback pure and rejects canonical-content tamper", () => {
    const configurationV2 = configuration();
    const accepted = initializeRecoveryConcealmentAvGateStateV2(
      configurationV2,
      { acceptedAtrialActivationTimeSec: 0 },
    );
    const before = structuredClone(accepted);
    const candidate = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      { atrialActivationId: "pure", atrialActivationTimeSec: 0 },
    );
    const retry = evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      { atrialActivationId: "pure", atrialActivationTimeSec: 0 },
    );

    expect(retry).toEqual(candidate);
    expect(accepted).toEqual(before);
    expect(rollbackRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      candidate,
    )).toBe(accepted);
    expect(Object.isFrozen(accepted)).toBe(true);
    expect(Object.isFrozen(accepted.configuration)).toBe(true);
    expect(Object.isFrozen(accepted.configuration.parameterProvenance))
      .toBe(true);
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate.candidateState)).toBe(true);
    expect(candidate).not.toHaveProperty("ventricularActivationTimeSec");
    expect(candidate.candidateState)
      .not.toHaveProperty("lastVentricularActivationTimeSec");

    const forged = {
      ...candidate,
      proximalAvOutputTimeSec: candidate.proximalAvOutputTimeSec! + 1e-6,
    };
    expect(() => commitRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      forged,
    )).toThrow(/does not match|inconsistent/);
    expect(() => rollbackRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      forged,
    )).toThrow(/does not match|inconsistent/);

    const changedContent = structuredClone(candidate) as any;
    changedContent.candidateState.configuration
      .minimumProximalAvConductionDelaySec += 0.01;
    expect(() => commitRecoveryConcealmentAvGateCandidateDecisionV2(
      accepted,
      changedContent,
    )).toThrow(/does not match|inconsistent/);
  });

  it("detaches complete configuration content and fails closed on malformed clocks or fields", () => {
    const mutableInput = configurationInput();
    const created = createRecoveryConcealmentAvGateConfigurationV2(
      mutableInput,
    );
    mutableInput.parameterProvenance.sourceId = "mutated-after-create";
    expect(created.parameterProvenance.sourceId)
      .toBe("proximal-av-v2-unit-input");
    const state = initializeRecoveryConcealmentAvGateStateV2(created, {
      acceptedAtrialActivationTimeSec: -1,
    });
    expect(state.configuration).not.toBe(created);
    expect(state.configuration).toEqual(created);

    expect(() => evaluateRecoveryConcealmentAvGateCandidateDecisionV2(
      state,
      { atrialActivationId: "past", atrialActivationTimeSec: -1.001 },
    )).toThrow(/monotone/);
    expect(() => validateRecoveryConcealmentAvGateStateV2({
      ...state,
      acceptedAtrialActivationCount: 1,
    })).toThrow(/revision/);
    expect(() => validateRecoveryConcealmentAvGateStateV2({
      ...state,
      ventricularActivationTimeSec: 0,
    } as RecoveryConcealmentAvGateAcceptedStateV2)).toThrow(/keys/);
    expect(() => createRecoveryConcealmentAvGateConfigurationV2({
      ...configurationInput(),
      minimumProximalAvConductionDelaySec: 0,
    })).toThrow(/positive/);
  });

  it("claims neither ventricular/His-Purkinje physiology nor Jørgensen end-to-end reproduction", () => {
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM.outputSemantics)
      .toBe("proximal-av-output-proposal-not-ventricular-activation");
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM
      .conductedOutputStrictlyFutureOfAtrialInput).toBe(true);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM
      .exactBoundaryEqualityConducts).toBe(true);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM
      .ventricularActivationClaimed).toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM
      .hisPurkinjePhysiologyClaimed).toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM
      .jorgensenEndToEndReproductionClaimed).toBe(false);
    expect(RECOVERY_CONCEALMENT_AV_GATE_V2_CLAIM.clinicalValidityClaimed)
      .toBe(false);
  });
});

function expectMappedStatesEqual(
  v1: RecoveryConcealmentAvGateAcceptedStateV1,
  v2: RecoveryConcealmentAvGateAcceptedStateV2,
): void {
  expect(v2.revision).toBe(v1.revision);
  expect(v2.acceptedAtrialActivationTimeSec).toBe(v1.acceptedTimeSec);
  expect(v2.acceptedAtrialActivationCount).toBe(v1.acceptedActivationCount);
  expect(v2.conductedAtrialActivationCount)
    .toBe(v1.conductedActivationCount);
  expect(v2.blockedAtrialActivationCount).toBe(v1.blockedActivationCount);
  expect(v2.hasPriorProximalAvOutput).toBe(v1.hasPriorConduction);
  expect(v2.proximalAvRefractoryUntilSec).toBe(v1.refractoryUntilSec);
  expect(v2.lastConductedAtrialActivationTimeSec)
    .toBe(v1.lastConductedAtrialActivationTimeSec);
  expect(v2.lastProximalAvOutputTimeSec)
    .toBe(v1.lastVentricularActivationTimeSec);
}

function configuration() {
  return createRecoveryConcealmentAvGateConfigurationV2(configurationInput());
}

function configurationInput(): RecoveryConcealmentAvGateConfigurationInputV2 & {
  parameterProvenance: { kind: "explicit-research-parameters"; sourceId: string };
} {
  return {
    configurationId: "proximal-av-v2-unit-configuration",
    proximalAvOwnerInstanceId: "matched-proximal-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "proximal-av-v2-unit-input",
    },
    minimumProximalAvConductionDelaySec: 0.1,
    proximalAvRecoveryDelayAmplitudeSec: 0.08,
    proximalAvRecoveryTimeConstantSec: 0.5,
    postProximalAvOutputRefractorySec: 0.2,
    concealedProximalAvRefractoryExtensionSec: 0.1,
  };
}
