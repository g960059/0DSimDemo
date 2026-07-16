import { describe, expect, it } from "vitest";

import {
  baseNonValveEdgeLossV1,
  downstreamEffectivePressureV1,
  effectiveUnstressedVolumeFromNodeV1,
  respiratoryExternalPressureForKindV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_CIRCULATION_UNITS_V1,
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
  buildNonCoronaryCirculationGraphV1,
  classifyNonCoronaryLineSearchRejectionOwnerV1,
  commitNonCoronaryCirculationTrialV1,
  createInitialNonCoronaryCirculationStateV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  solveSignedLinearQuadraticFlowV1,
  type NonCoronaryCandidateMechanicsCallbackV1,
  type NonCoronaryChamberPressuresMmHgV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { initialMainWireQuasiSteadyOrificeValveStateV1 } from
  "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV1";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

const RUNTIME: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
  vascular: Object.freeze({ venousTone: 0, arterialStiffness: 1 }),
  losses: Object.freeze({ systemicResistance: 1, pulmonaryResistance: 1 }),
  respiratory: Object.freeze({
    PEEP: 0,
    Pth0: 0,
    respAmpTh: 0,
    respAmpAlv: 0,
    respRate: 0,
  }),
});

describe("main-wire-derived non-coronary experimental backward Euler V1", () => {
  it("derives the 15-node scope from the authoritative graph and excludes every coronary element", () => {
    const graph = buildNonCoronaryCirculationGraphV1();
    expect(graph.nodes.map((node) => node.name)).toEqual(
      NON_CORONARY_CIRCULATION_SCOPE_V1.includedNodes,
    );
    expect(graph.edges.map((edge) => edge.name)).toEqual(
      NON_CORONARY_CIRCULATION_SCOPE_V1.includedEdges,
    );
    expect(graph.nodes).toHaveLength(15);
    expect(graph.edges).toHaveLength(15);
    expect(graph.edges.some((edge) => edge.group === "coronary")).toBe(false);
    for (const name of NON_CORONARY_CIRCULATION_SCOPE_V1.excludedCoronaryNodes) {
      expect(graph.nodeIndex.has(name)).toBe(false);
    }
    expect(NON_CORONARY_CIRCULATION_SCOPE_V1.valveOwner)
      .toBe("MainWireQuasiSteadyOrificeValveV1");
    expect(NON_CORONARY_CIRCULATION_SCOPE_V1.valveAcceptedMemory)
      .toBe("leaflet-opening-fraction-only");
    expect(NON_CORONARY_CIRCULATION_SCOPE_V1.valveFlow)
      .toBe("algebraic-candidate-readback");
    expect(NON_CORONARY_CIRCULATION_UNITS_V1.edgeFlow).toBe("mL/s");
    expect(NON_CORONARY_CIRCULATION_UNITS_V1.inertance)
      .toBe("mmHg*s^2/mL");
  });

  it("uses physical node volume and preserves the venous x0-as-Ptm main-wire initialization", () => {
    const graph = buildNonCoronaryCirculationGraphV1();
    const state = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
    });
    for (const name of ["SV", "VC", "PCap", "PVen", "PVein"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(name)!];
      const law = vascularPvLawFromNodeV1(node, RUNTIME.vascular);
      const expectedPhysicalVolumeMl =
        effectiveUnstressedVolumeFromNodeV1(node, RUNTIME.vascular)
        + stressedVolumeFromPtm(law, node.x0);
      expect(state.nodeVolumesMl[name]).toBeCloseTo(expectedPhysicalVolumeMl, 12);
      expect(state.nodeVolumesMl[name]).not.toBe(node.x0);
    }
    for (const name of ["Ao", "SA", "Art", "Cap", "PA", "PArt"] as const) {
      const node = graph.nodes[graph.nodeIndex.get(name)!];
      expect(state.nodeVolumesMl[name]).toBe(node.x0);
    }
  });

  it("keeps a numerically stationary zero-flow state while satisfying TBV and continuity", () => {
    const fixture = steadyStateFixture();
    const sentinel = Object.freeze({ owner: "pure-mechanics-callback", token: 73 });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: 0.005,
      runtime: RUNTIME,
      evaluateCandidateMechanics: (_volumes, timeSec) => Object.freeze({
        absolutePressuresMmHg: fixture.chamberPressures,
        evaluation: Object.freeze({ ...sentinel, timeSec }),
      }),
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(trial.diagnostics.iterations).toBe(0);
    expect(trial.diagnostics.failureNewtonTrace).toEqual([]);
    expect(trial.diagnostics.lineSearchFailure).toBeNull();
    expect(trial.diagnostics.worstIndependentContinuityResidual).not.toBeNull();
    expect(trial.diagnostics.finalMaximumContinuityResidualMl).toBeLessThan(1e-9);
    expect(Math.abs(trial.diagnostics.totalBloodVolumeErrorMl)).toBeLessThan(1e-10);
    expect(Math.abs(trial.diagnostics.dependentNodeContinuityResidualMl))
      .toBeLessThan(1e-9);
    for (const name of NON_CORONARY_NODE_NAMES_V1) {
      expect(trial.candidateNodeVolumesMl[name])
        .toBeCloseTo(fixture.state.nodeVolumesMl[name], 11);
    }
    for (const name of NON_CORONARY_VALVE_NAMES_V1) {
      expect(trial.edgeFlowsMlPerSec[name]).toBe(0);
      expect(trial.candidateValveStates[name].leafletOpeningFraction01).toBe(0);
      expect(Object.keys(trial.candidateValveStates[name]))
        .toEqual(["leafletOpeningFraction01"]);
    }
    expect(trial.candidateMechanicsEvaluation).toEqual({
      ...sentinel,
      timeSec: 0.005,
    });
    expect(trial.mechanicsCommitted).toBe(false);

    const accepted = commitNonCoronaryCirculationTrialV1(fixture.state, trial);
    expect(accepted.revision).toBe(1);
    expect(accepted.totalBloodVolumeMl).toBeCloseTo(
      fixture.state.totalBloodVolumeMl,
      11,
    );
    expect(() => commitNonCoronaryCirculationTrialV1(accepted, trial))
      .toThrow(/stale or foreign/i);
  });

  it("keeps all competent main-wire valves non-regurgitant under adverse gradients", () => {
    const fixture = steadyStateFixture();
    const reversePressures: NonCoronaryChamberPressuresMmHgV1 = Object.freeze({
      LA: 0,
      LV: 5,
      RA: 0,
      RV: 5,
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: () => Object.freeze({
        absolutePressuresMmHg: reversePressures,
        evaluation: null,
      }),
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    for (const name of NON_CORONARY_VALVE_NAMES_V1) {
      expect(trial.edgeFlowsMlPerSec[name]).toBe(0);
      expect(trial.valveEvaluations[name].pathologicalLeakEnabled).toBe(false);
      expect(trial.valveEvaluations[name].state.leafletOpeningFraction01).toBe(0);
      expect(trial.valveEvaluations[name].contactReactionMmHg)
        .toBeGreaterThanOrEqual(0);
      expect(Math.abs(trial.valveEvaluations[name].hydraulicBalanceResidualMmHg))
        .toBeLessThan(1e-8);
    }
    expect(trial.reverseFlowCapOrClampOnNonvalveEdges).toBe(false);
  });

  it("rolls back without mutating accepted circulation or committing mechanics", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
    });
    const snapshot = JSON.stringify(initial);
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.002,
      runtime: RUNTIME,
      evaluateCandidateMechanics: () => {
        throw new Error("intentional mechanics trial failure");
      },
    });
    expect(trial.converged).toBe(false);
    if (trial.converged === true) throw new Error("expected transaction failure");
    expect(trial.reason).toBe("initial-evaluation-failed");
    expect(trial.rollbackState).toEqual(initial);
    expect(trial.rollbackState).not.toBe(initial);
    expect(trial.mechanicsCommitted).toBe(false);
    expect(JSON.stringify(initial)).toBe(snapshot);
  });

  it("classifies line-search rejection ownership without changing solver policy", () => {
    expect(classifyNonCoronaryLineSearchRejectionOwnerV1(3, 0))
      .toBe("candidate-evaluation-exception");
    expect(classifyNonCoronaryLineSearchRejectionOwnerV1(0, 4))
      .toBe("armijo-residual-rejection");
    expect(classifyNonCoronaryLineSearchRejectionOwnerV1(2, 2))
      .toBe("mixed-equal");
    expect(classifyNonCoronaryLineSearchRejectionOwnerV1(0, 0)).toBe("none");
    expect(() => classifyNonCoronaryLineSearchRejectionOwnerV1(-1, 0))
      .toThrow(/nonnegative integer/);
  });

  it("records candidate exceptions separately when every line-search trial is inadmissible", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
    });
    const initialChambers = Object.freeze({
      LA: initial.nodeVolumesMl.LA,
      LV: initial.nodeVolumesMl.LV,
      RA: initial.nodeVolumesMl.RA,
      RV: initial.nodeVolumesMl.RV,
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      options: { maximumLineSearchBacktracks: 1 },
      evaluateCandidateMechanics: (volumes) => {
        const displacementMl = (Object.keys(initialChambers) as
          (keyof typeof initialChambers)[]).reduce(
          (sum, chamber) =>
            sum + Math.abs(volumes[chamber] - initialChambers[chamber]),
          0,
        );
        if (displacementMl > 0.001) {
          throw new Error(`diagnostic admissibility boundary ${displacementMl}`);
        }
        return Object.freeze({
          absolutePressuresMmHg: Object.freeze({
            LA: 12,
            LV: 16,
            RA: 7,
            RV: 11,
          }),
          evaluation: null,
        });
      },
    });

    expect(trial.converged).toBe(false);
    if (trial.converged === true) throw new Error("expected line-search failure");
    expect(trial.reason).toBe("line-search-failed");
    expect(trial.diagnostics.lineSearchFailure).toMatchObject({
      attemptCount: 2,
      candidateEvaluationExceptionCount: 2,
      armijoResidualRejectionCount: 0,
      dominantRejectionOwner: "candidate-evaluation-exception",
    });
    expect(trial.diagnostics.lineSearchFailure!
      .lastCandidateEvaluationException?.message)
      .toMatch(/diagnostic admissibility boundary/);
    expect(trial.diagnostics.lineSearchFailure!.lastArmijoResidualRejection)
      .toBeNull();
    expect(trial.diagnostics.failureNewtonTrace.length).toBeGreaterThan(0);
    expect(trial.diagnostics.failureNewtonTrace.at(-1)).toMatchObject({
      lineSearchAttemptCount: 2,
      candidateEvaluationExceptionCount: 2,
      armijoResidualRejectionCount: 0,
      acceptedStepLength: null,
    });
    expect(trial.diagnostics.worstIndependentContinuityResidual?.node)
      .not.toBe("SV");
    expect(trial.diagnostics.worstIndependentContinuityResidual
      ?.absoluteResidualMl).toBeGreaterThan(0);
  });

  it("solves dynamic constant-L BE and signed resistive laws without a reverse-flow clamp", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
    });
    const callback = elasticMechanicsCallback(initial);
    const dtSec = 0.001;
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec,
      runtime: RUNTIME,
      evaluateCandidateMechanics: callback,
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(trial.diagnostics.mechanicsCallbackCallCount).toBeGreaterThan(0);
    expect(trial.diagnostics.mechanicsCallbackCacheHitCount).toBeGreaterThan(0);
    expect(trial.diagnostics.mechanicsCallbackUniqueCandidateCount)
      .toBe(trial.diagnostics.mechanicsCallbackCallCount);
    const graph = buildNonCoronaryCirculationGraphV1();
    for (const name of NON_CORONARY_DYNAMIC_EDGE_NAMES_V1) {
      const edge = graph.edges[graph.edgeIndex.get(name)!];
      const losses = baseNonValveEdgeLossV1(edge, RUNTIME.losses);
      const q = trial.candidateDynamicEdgeFlowsMlPerSec[name];
      const qPrevious = initial.dynamicEdgeFlowsMlPerSec[name];
      const gradient = trial.nodeAbsolutePressuresMmHg[
        edge.up as keyof typeof trial.nodeAbsolutePressuresMmHg
      ] - trial.nodeAbsolutePressuresMmHg[
        edge.down as keyof typeof trial.nodeAbsolutePressuresMmHg
      ];
      const residualMmHg = (edge.L ?? 0) * (q - qPrevious) / dtSec
        + losses.resistanceMmHgSecPerMl * q
        + losses.quadraticLossMmHgSec2PerMl2 * q * Math.abs(q)
        - gradient;
      expect(Math.abs(residualMmHg)).toBeLessThan(1e-9);
    }

    const reverse = solveSignedLinearQuadraticFlowV1(-10_000, 0.001, 0);
    expect(reverse).toBe(-10_000_000);
    expect(reverse).toBeLessThan(-1_500);
    const nonlinear = solveSignedLinearQuadraticFlowV1(-250, 0.04, 0.002);
    expect(Math.abs(0.04 * nonlinear + 0.002 * nonlinear * Math.abs(nonlinear) + 250))
      .toBeLessThan(1e-9);
  });

  it("uses graph-owned respiratory external pressure and downstream waterfall inside the transaction", () => {
    const runtime = Object.freeze({
      ...RUNTIME,
      respiratory: Object.freeze({
        PEEP: 5,
        Pth0: -2,
        respAmpTh: 0,
        respAmpAlv: 0,
        respRate: 0,
      }),
    });
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime,
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime,
      evaluateCandidateMechanics: elasticMechanicsCallback(initial),
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    const graph = buildNonCoronaryCirculationGraphV1();
    for (const name of ["VC_RA", "PCap_PVen"] as const) {
      const edge = graph.edges[graph.edgeIndex.get(name)!];
      const downstreamPressure = trial.nodeAbsolutePressuresMmHg[
        edge.down as keyof typeof trial.nodeAbsolutePressuresMmHg
      ];
      const extKind = edge.ext === "pth" || edge.ext === "palv"
        ? edge.ext
        : "none";
      const edgeExternalPressure = respiratoryExternalPressureForKindV1(
        extKind,
        trial.candidateTimeSec,
        runtime.respiratory,
      );
      const downstreamEffective = downstreamEffectivePressureV1({
        edge,
        downstreamPressureMmHg: downstreamPressure,
        edgeExternalPressureMmHg: edgeExternalPressure,
      });
      const losses = baseNonValveEdgeLossV1(edge, runtime.losses);
      const expectedFlow = solveSignedLinearQuadraticFlowV1(
        trial.nodeAbsolutePressuresMmHg[
          edge.up as keyof typeof trial.nodeAbsolutePressuresMmHg
        ] - downstreamEffective,
        losses.resistanceMmHgSecPerMl,
        losses.quadraticLossMmHgSec2PerMl2,
      );
      expect(trial.edgeFlowsMlPerSec[name]).toBeCloseTo(expectedFlow, 11);
    }
  });

  it("conserves TBV and shows backward-Euler time-step refinement", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
    });
    const callback = elasticMechanicsCallback(initial);
    const coarse = advance(initial, 0.004, 1, callback);
    const medium = advance(initial, 0.002, 2, callback);
    const fine = advance(initial, 0.001, 4, callback);
    for (const state of [coarse, medium, fine]) {
      expect(state.totalBloodVolumeMl).toBeCloseTo(initial.totalBloodVolumeMl, 10);
    }
    const mediumError = maximumNodeVolumeDifference(coarse, medium);
    const fineError = maximumNodeVolumeDifference(medium, fine);
    expect(mediumError).toBeGreaterThan(0);
    expect(fineError).toBeGreaterThan(0);
    expect(fineError).toBeLessThan(mediumError);

    const finalTrial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fine,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: callback,
    });
    expect(finalTrial.converged).toBe(true);
    if (finalTrial.converged === false) throw new Error(finalTrial.message);
    expect(finalTrial.diagnostics.finalScaledResidualInfinityNorm).toBeLessThan(2e-10);
    expect(finalTrial.diagnostics.finalMaximumContinuityResidualMl).toBeLessThan(2e-7);
    expect(Math.abs(finalTrial.diagnostics.totalBloodVolumeErrorMl)).toBeLessThan(1e-9);
  });
});

function steadyStateFixture() {
  const graph = buildNonCoronaryCirculationGraphV1();
  const vascularHighMmHg = 20;
  const waterfallDownstreamMmHg = vascularHighMmHg
    - 0.25 ** 2 / (4 * vascularHighMmHg);
  const pressureByNode = Object.freeze({
    Ao: vascularHighMmHg,
    SA: vascularHighMmHg,
    Art: vascularHighMmHg,
    Cap: vascularHighMmHg,
    SV: vascularHighMmHg,
    VC: vascularHighMmHg,
    PA: vascularHighMmHg,
    PArt: vascularHighMmHg,
    PCap: vascularHighMmHg,
    PVen: waterfallDownstreamMmHg,
    PVein: waterfallDownstreamMmHg,
  });
  const chamberPressures: NonCoronaryChamberPressuresMmHgV1 = Object.freeze({
    LA: waterfallDownstreamMmHg,
    LV: 0.5 * (waterfallDownstreamMmHg + vascularHighMmHg),
    RA: waterfallDownstreamMmHg,
    RV: 0.5 * (waterfallDownstreamMmHg + vascularHighMmHg),
  });
  const nodeVolumes = Object.fromEntries(NON_CORONARY_NODE_NAMES_V1.map((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!];
    if (name === "LV" || name === "LA" || name === "RV" || name === "RA") {
      return [name, node.x0];
    }
    const law = vascularPvLawFromNodeV1(node, RUNTIME.vascular);
    const pressure = pressureByNode[name as keyof typeof pressureByNode];
    return [
      name,
      effectiveUnstressedVolumeFromNodeV1(node, RUNTIME.vascular)
        + stressedVolumeFromPtm(law, pressure),
    ];
  })) as NonCoronaryCirculationAcceptedStateV1["nodeVolumesMl"];
  const state = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime: RUNTIME,
    nodeVolumesMl: nodeVolumes,
    dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 0, PA_PArt: 0 }),
    valveStates: Object.freeze({
      MV: initialMainWireQuasiSteadyOrificeValveStateV1(0),
      AoV: initialMainWireQuasiSteadyOrificeValveStateV1(0),
      TV: initialMainWireQuasiSteadyOrificeValveStateV1(0),
      PV: initialMainWireQuasiSteadyOrificeValveStateV1(0),
    }),
  });
  return Object.freeze({ state, chamberPressures });
}

function elasticMechanicsCallback(
  reference: NonCoronaryCirculationAcceptedStateV1,
): NonCoronaryCandidateMechanicsCallbackV1<Readonly<{
  timeSec: number;
  volumeSumMl: number;
}>> {
  return (volumes, timeSec) => Object.freeze({
    absolutePressuresMmHg: Object.freeze({
      LA: 12 + 0.08 * (volumes.LA - reference.nodeVolumesMl.LA),
      LV: 16 + 0.12 * (volumes.LV - reference.nodeVolumesMl.LV),
      RA: 7 + 0.06 * (volumes.RA - reference.nodeVolumesMl.RA),
      RV: 11 + 0.09 * (volumes.RV - reference.nodeVolumesMl.RV),
    }),
    evaluation: Object.freeze({
      timeSec,
      volumeSumMl: volumes.LA + volumes.LV + volumes.RA + volumes.RV,
    }),
  });
}

function advance<TEvaluation>(
  start: NonCoronaryCirculationAcceptedStateV1,
  dtSec: number,
  count: number,
  callback: NonCoronaryCandidateMechanicsCallbackV1<TEvaluation>,
): NonCoronaryCirculationAcceptedStateV1 {
  let state = start;
  for (let step = 0; step < count; step += 1) {
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: state,
      dtSec,
      runtime: RUNTIME,
      evaluateCandidateMechanics: callback,
    });
    if (trial.converged === false) throw new Error(`${trial.reason}: ${trial.message}`);
    state = commitNonCoronaryCirculationTrialV1(state, trial);
  }
  return state;
}

function maximumNodeVolumeDifference(
  left: NonCoronaryCirculationAcceptedStateV1,
  right: NonCoronaryCirculationAcceptedStateV1,
): number {
  return Math.max(...NON_CORONARY_NODE_NAMES_V1.map((name) =>
    Math.abs(left.nodeVolumesMl[name] - right.nodeVolumesMl[name])));
}
