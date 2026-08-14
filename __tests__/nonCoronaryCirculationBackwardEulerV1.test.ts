import { describe, expect, it, vi } from "vitest";

import {
  baseNonValveEdgeLossV1,
  downstreamEffectivePressureV1,
  effectiveUnstressedVolumeFromNodeV1,
  nonValveEdgeLossV1,
  respiratoryExternalPressureForKindV1,
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_CIRCULATION_UNITS_V1,
  NON_CORONARY_ACCEPTED_NUMERICAL_SOURCE_V1_ID,
  NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
  buildNonCoronaryCirculationGraphV1,
  classifyNonCoronaryLineSearchRejectionOwnerV1,
  checkpointNonCoronaryCirculationStateV1,
  commitNonCoronaryCirculationTrialV1,
  commitNonCoronaryCirculationTrialWithConservativeCompanionV1,
  createInitialNonCoronaryCirculationStateV1,
  createNonCoronaryBackwardEulerScratchWorkspaceV1,
  evaluateNonCoronaryCirculationCandidateProbeV1,
  evaluateNonCoronaryCirculationBackwardEulerTrialV1,
  materializeNonCoronaryCirculationCandidateTrialV1,
  prepareNonCoronaryCandidateEvaluatorV1,
  resolveNonCoronaryCirculationColdSeedV1,
  restoreNonCoronaryCirculationStateV1,
  solveSignedLinearQuadraticFlowV1,
  withPreparedNonCoronaryCandidateV1,
  type NonCoronaryCandidateMechanicsCallbackV1,
  type NonCoronaryAbsoluteChamberPressureTangentV1,
  type NonCoronaryChamberPressuresMmHgV1,
  type NonCoronaryCirculationAcceptedStateV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryAcceptedNumericalSourceV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { initialMainWireQuasiSteadyOrificeValveStateV2 } from
  "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
  composeMainWireFourValveDiseaseResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
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
  valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
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
      .toBe("MainWireQuasiSteadyOrificeValveV2");
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
    const coldSeed = resolveNonCoronaryCirculationColdSeedV1(RUNTIME);
    const state = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      fixedTotalBloodVolumeMl: coldSeed.fixedTotalBloodVolumeMl,
    });
    expect(state.nodeVolumesMl).toEqual(coldSeed.nodeVolumesMl);
    expect(state.totalBloodVolumeMl).toBe(coldSeed.fixedTotalBloodVolumeMl);
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

  it("requires an explicit TBV owner that matches the supplied node volumes", () => {
    const coldSeed = resolveNonCoronaryCirculationColdSeedV1(RUNTIME);
    expect(() => createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      fixedTotalBloodVolumeMl: coldSeed.fixedTotalBloodVolumeMl + 1,
      nodeVolumesMl: coldSeed.nodeVolumesMl,
    })).toThrow(/fixed TBV owner/);

    const accepted = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeed,
    });
    expect(accepted.totalBloodVolumeMl)
      .toBe(coldSeed.fixedTotalBloodVolumeMl);
  });

  it("preserves the owner bit-exactly through checkpoint restore and rejects a stale identity", () => {
    const coldSeed = resolveNonCoronaryCirculationColdSeedV1(RUNTIME);
    const accepted = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeed,
    });
    expect(Object.keys(accepted)).toEqual([
      "transactionId",
      "revision",
      "acceptedTimeSec",
      "totalBloodVolumeMl",
      "nodeVolumesMl",
      "dynamicEdgeFlowsMlPerSec",
      "valveStates",
    ]);
    const checkpoint = checkpointNonCoronaryCirculationStateV1(accepted);
    const restored = restoreNonCoronaryCirculationStateV1(
      JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint,
    );
    expect(restored.totalBloodVolumeMl).toBe(accepted.totalBloodVolumeMl);
    expect(restored).toEqual(accepted);

    const staleOwner = Object.freeze({
      ...checkpoint,
      state: Object.freeze({
        ...checkpoint.state,
        totalBloodVolumeMl: checkpoint.state.totalBloodVolumeMl + 1,
      }),
    });
    expect(() => restoreNonCoronaryCirculationStateV1(staleOwner))
      .toThrow(/TBV identity is stale/);
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
    expect("conservativeCompanion" in trial).toBe(false);
    expect(trial.mechanicsCommitted).toBe(false);

    const accepted = commitNonCoronaryCirculationTrialV1(fixture.state, trial);
    expect(accepted.revision).toBe(1);
    expect(accepted.totalBloodVolumeMl)
      .toBe(fixture.state.totalBloodVolumeMl);
    expect(() => commitNonCoronaryCirculationTrialV1(accepted, trial))
      .toThrow(/stale or foreign/i);
  });

  it("materializes an externally solved candidate as the canonical detached trial", () => {
    const fixture = steadyStateFixture();
    const input = Object.freeze({
      previousAcceptedState: fixture.state,
      dtSec: 0.005,
      runtime: RUNTIME,
      evaluateCandidateMechanics: (_volumes: unknown, timeSec: number) =>
        Object.freeze({
          absolutePressuresMmHg: fixture.chamberPressures,
          evaluation: Object.freeze({ timeSec }),
        }),
    });
    const solved = evaluateNonCoronaryCirculationBackwardEulerTrialV1(input);
    expect(solved.converged).toBe(true);
    if (solved.converged === false) throw new Error(solved.message);
    const materialized = materializeNonCoronaryCirculationCandidateTrialV1(
      input,
      Float64Array.from(
        NON_CORONARY_INDEPENDENT_NODE_NAMES_V1,
        (nodeId) => solved.candidateNodeVolumesMl[nodeId],
      ),
      Object.freeze({
        iterations: solved.diagnostics.iterations,
        lineSearchBacktracks: solved.diagnostics.lineSearchBacktracks,
      }),
    );

    expect(materialized).toEqual(solved);
    expect(materialized.candidateNodeVolumesMl)
      .not.toBe(solved.candidateNodeVolumesMl);
  });

  it("reuses opaque Newton scratch without changing or aliasing a trial", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const input = Object.freeze({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(initial, true),
    });
    const baseline = evaluateNonCoronaryCirculationBackwardEulerTrialV1(input);
    const workspace = createNonCoronaryBackwardEulerScratchWorkspaceV1();
    const reused = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      ...input,
      scratchWorkspace: workspace,
    });
    expect(reused).toEqual(baseline);
    expect(reused.converged).toBe(true);
    if (reused.converged === false) throw new Error(reused.message);
    const retainedTrial = structuredClone(reused);
    const nextAccepted = commitNonCoronaryCirculationTrialV1(initial, reused);
    const next = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: nextAccepted,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(nextAccepted, true),
      scratchWorkspace: workspace,
    });
    expect(next.converged).toBe(true);
    expect(reused).toEqual(retainedTrial);
    expect(() => evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      ...input,
      scratchWorkspace: structuredClone(workspace),
    })).toThrow(/scratch workspace is foreign/);
  });

  it("admits an exact typed numerical source and rejects scalar divergence before solving", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    let readCount = 0;
    const source = Object.freeze({
      sourceId: NON_CORONARY_ACCEPTED_NUMERICAL_SOURCE_V1_ID,
      readInto(destination) {
        readCount += 1;
        NON_CORONARY_NODE_NAMES_V1.forEach((name, index) => {
          destination.nodeVolumesMl[index] = initial.nodeVolumesMl[name];
        });
        NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.forEach((name, index) => {
          destination.dynamicEdgeFlowsMlPerSec[index] =
            initial.dynamicEdgeFlowsMlPerSec[name];
        });
        NON_CORONARY_VALVE_NAMES_V1.forEach((name, index) => {
          destination.valveOpeningFractions01[index] =
            initial.valveStates[name].leafletOpeningFraction01;
        });
        destination.revision = initial.revision;
        destination.acceptedTimeSec = initial.acceptedTimeSec;
        destination.totalBloodVolumeMl = initial.totalBloodVolumeMl;
      },
    }) satisfies NonCoronaryAcceptedNumericalSourceV1;
    const input = Object.freeze({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(initial, true),
      scratchWorkspace: createNonCoronaryBackwardEulerScratchWorkspaceV1(),
    });
    const sourced = evaluateNonCoronaryCirculationBackwardEulerTrialV1(
      input,
      source,
    );
    const baseline = evaluateNonCoronaryCirculationBackwardEulerTrialV1(input);
    expect(sourced).toEqual(baseline);
    expect(readCount).toBe(1);

    const roundedTotal = Object.freeze({
      ...source,
      readInto(destination) {
        source.readInto(destination);
        destination.totalBloodVolumeMl += 2 * Number.EPSILON
          * initial.totalBloodVolumeMl;
      },
    }) satisfies NonCoronaryAcceptedNumericalSourceV1;
    expect(evaluateNonCoronaryCirculationBackwardEulerTrialV1(
      input,
      roundedTotal,
    )).toEqual(baseline);

    const divergent = Object.freeze({
      ...source,
      readInto(destination) {
        source.readInto(destination);
        destination.nodeVolumesMl[0] += 1;
      },
    }) satisfies NonCoronaryAcceptedNumericalSourceV1;
    expect(() => evaluateNonCoronaryCirculationBackwardEulerTrialV1(
      input,
      divergent,
    )).toThrow(/LV volume diverged/);

    const divergentTotal = Object.freeze({
      ...source,
      readInto(destination) {
        source.readInto(destination);
        destination.totalBloodVolumeMl += 1e-6;
      },
    }) satisfies NonCoronaryAcceptedNumericalSourceV1;
    expect(() => evaluateNonCoronaryCirculationBackwardEulerTrialV1(
      input,
      divergentTotal,
    )).toThrow(/clock or TBV diverged/);
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
      expect(trial.valveEvaluations[name].reverseRegurgitantFlowEnabled)
        .toBe(false);
      expect(trial.valveEvaluations[name].state.leafletOpeningFraction01).toBe(0);
      expect(trial.valveEvaluations[name].competentReverseClosureReactionMmHg)
        .toBeGreaterThanOrEqual(0);
      expect(Math.abs(trial.valveEvaluations[name].hydraulicBalanceResidualMmHg))
        .toBeLessThan(1e-8);
    }
    expect(trial.reverseFlowCapOrClampOnNonvalveEdges).toBe(false);
  });

  it("applies a disease research input only to the requested reverse EROA", () => {
    const fixture = steadyStateFixture();
    const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
      ...RUNTIME,
      valveResearchInput: composeMainWireFourValveDiseaseResearchInputV1(["MR-moderate"]),
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: 0.001,
      runtime,
      evaluateCandidateMechanics: () => Object.freeze({
        absolutePressuresMmHg: Object.freeze({
          LA: 5,
          LV: 20,
          RA: 2,
          RV: 5,
        }),
        evaluation: null,
      }),
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(trial.edgeFlowsMlPerSec.MV).toBeLessThan(0);
    expect(trial.valveEvaluations.MV.reverseActiveEoaCm2).toBe(0.25);
    expect(trial.valveEvaluations.MV.activeEoaCm2).toBe(0.25);
    expect(trial.valveEvaluations.MV.competentReverseClosureActive).toBe(false);
    for (const name of ["AoV", "TV", "PV"] as const) {
      expect(trial.edgeFlowsMlPerSec[name]).toBe(0);
      expect(trial.valveEvaluations[name].reverseActiveEoaCm2).toBe(0);
      expect(trial.valveEvaluations[name].reverseRegurgitantFlowEnabled)
        .toBe(false);
      if (trial.valveEvaluations[name].pressureGradientMmHg < 0) {
        expect(trial.valveEvaluations[name].competentReverseClosureActive)
          .toBe(true);
      }
    }
  });

  it("rolls back without mutating accepted circulation or committing mechanics", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
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
    expect(trial.rollbackState.totalBloodVolumeMl)
      .toBe(initial.totalBloodVolumeMl);
    expect(trial.mechanicsCommitted).toBe(false);
    expect(JSON.stringify(initial)).toBe(snapshot);
  });

  it("fails closed on an invalid provided pressure tangent instead of hiding it behind FD", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const invalidTangent = Object.freeze({
      rowPressureOrder: Object.freeze(["LA", "LV", "RV", "RA"]),
      columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
      units: "mmHg/mL",
      pressureKind: "absolute",
      derivativeSemantics:
        "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive",
      dPressureDVolumeMmHgPerMl: Object.freeze([
        Object.freeze([0.1, 0, 0, 0]),
        Object.freeze([0, 0.1, 0, 0]),
        Object.freeze([0, 0, 0.1, 0]),
        Object.freeze([0, 0, 0, 0.1]),
      ]),
    }) as unknown as NonCoronaryAbsoluteChamberPressureTangentV1;
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: () => Object.freeze({
        absolutePressuresMmHg: Object.freeze({
          LV: 16,
          LA: 12,
          RV: 11,
          RA: 7,
        }),
        absolutePressureTangent: invalidTangent,
        evaluation: null,
      }),
    });
    expect(trial.converged).toBe(false);
    if (trial.converged === true) throw new Error("expected invalid tangent failure");
    expect(trial.reason).toBe("initial-evaluation-failed");
    expect(trial.message).toMatch(/rowPressureOrder/);
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
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
      ...coldSeedOwner(RUNTIME),
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
      ...coldSeedOwner(RUNTIME),
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
    expect(trial.diagnostics.jacobianMode).toBe("full-fd-fallback");
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackCount)
      .toBeGreaterThan(0);
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackReason)
      .toBe("absolute-chamber-pressure-tangent-not-provided");
    expect(trial.diagnostics.pressureTangentAvailableAtFinalCandidate)
      .toBe(false);
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

  it("matches the full 14-volume finite-difference shadow with fixed-TBV SV chain rule", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const analyticCallback = coupledElasticMechanicsCallback(initial, true);
    const finiteDifferenceCallback = coupledElasticMechanicsCallback(initial, false);
    const analytic = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      options: { analyticJacobianFiniteDifferenceShadow: true },
      evaluateCandidateMechanics: analyticCallback,
    });
    const finiteDifference = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: finiteDifferenceCallback,
    });
    expect(analytic.converged).toBe(true);
    expect(finiteDifference.converged).toBe(true);
    if (analytic.converged === false) throw new Error(analytic.message);
    if (finiteDifference.converged === false) {
      throw new Error(finiteDifference.message);
    }
    expect(analytic.diagnostics.jacobianMode).toBe("analytic-semismooth");
    expect(analytic.diagnostics.analyticJacobianAssemblyCount)
      .toBeGreaterThan(0);
    expect(analytic.diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(analytic.diagnostics.finiteDifferenceJacobianShadowCount)
      .toBe(analytic.diagnostics.analyticJacobianAssemblyCount);
    expect(analytic.diagnostics.pressureTangentAvailableAtFinalCandidate)
      .toBe(true);
    expect(
      analytic.diagnostics
        .jacobianMaximumRelativeFrobeniusShadowDifference,
    ).not.toBeNull();
    expect(
      analytic.diagnostics
        .jacobianMaximumRelativeFrobeniusShadowDifference!,
    ).toBeLessThan(2e-5);
    for (const name of NON_CORONARY_NODE_NAMES_V1) {
      expect(analytic.candidateNodeVolumesMl[name]).toBeCloseTo(
        finiteDifference.candidateNodeVolumesMl[name],
        8,
      );
      expect(analytic.nodeAbsolutePressuresMmHg[name]).toBeCloseTo(
        finiteDifference.nodeAbsolutePressuresMmHg[name],
        8,
      );
    }
    for (const edgeName of NON_CORONARY_CIRCULATION_SCOPE_V1.includedEdges) {
      expect(analytic.edgeFlowsMlPerSec[edgeName]).toBeCloseTo(
        finiteDifference.edgeFlowsMlPerSec[edgeName],
        7,
      );
    }
    expect(Math.abs(analytic.diagnostics.totalBloodVolumeErrorMl))
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
      ...coldSeedOwner(runtime),
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

  it("supports graph-owned collapsible-tube chi without changing the TBV ledger", () => {
    const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
      ...RUNTIME,
      losses: Object.freeze({
        ...RUNTIME.losses,
        useChiResistance: true,
      }),
    });
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime,
      ...coldSeedOwner(runtime),
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime,
      evaluateCandidateMechanics: elasticMechanicsCallback(initial),
    });
    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(Math.abs(trial.diagnostics.totalBloodVolumeErrorMl)).toBeLessThan(1e-10);

    const graph = buildNonCoronaryCirculationGraphV1();
    for (const name of ["VC_RA", "PCap_PVen"] as const) {
      const edge = graph.edges[graph.edgeIndex.get(name)]!;
      const upstreamPressure = trial.nodeAbsolutePressuresMmHg[
        edge.up as keyof typeof trial.nodeAbsolutePressuresMmHg
      ];
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
      const effectiveDownstream = downstreamEffectivePressureV1({
        edge,
        downstreamPressureMmHg: downstreamPressure,
        edgeExternalPressureMmHg: edgeExternalPressure,
      });
      const losses = nonValveEdgeLossV1({
        edge,
        params: runtime.losses,
        upstreamPressureMmHg: upstreamPressure,
        downstreamPressureMmHg: downstreamPressure,
        edgeExternalPressureMmHg: edgeExternalPressure,
      });
      expect(losses.collapsibleTubeApplied).toBe(true);
      expect(trial.edgeFlowsMlPerSec[name]).toBeCloseTo(
        solveSignedLinearQuadraticFlowV1(
          upstreamPressure - effectiveDownstream,
          losses.resistanceMmHgSecPerMl,
          losses.quadraticLossMmHgSec2PerMl2,
        ),
        10,
      );
    }
  });

  it("keeps the protocol resistance seam neutral at unity and applies it only to the selected non-valve edge", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const callback = elasticMechanicsCallback(initial);
    const baseline = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: callback,
    });
    const unity = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      protocolResistanceScaleByEdge: Object.freeze({ VC_RA: 1 }),
      evaluateCandidateMechanics: callback,
    });
    expect(unity).toEqual(baseline);

    const vcRaResistanceScale = 8;
    const occluded = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      protocolResistanceScaleByEdge: Object.freeze({
        VC_RA: vcRaResistanceScale,
      }),
      evaluateCandidateMechanics: callback,
    });
    expect(occluded.converged).toBe(true);
    if (occluded.converged === false) throw new Error(occluded.message);

    const graph = buildNonCoronaryCirculationGraphV1();
    const edge = graph.edges[graph.edgeIndex.get("VC_RA")]!;
    const upstreamPressure = occluded.nodeAbsolutePressuresMmHg.VC;
    const downstreamPressure = occluded.nodeAbsolutePressuresMmHg.RA;
    const edgeExternalPressure = respiratoryExternalPressureForKindV1(
      edge.ext === "pth" || edge.ext === "palv" ? edge.ext : "none",
      occluded.candidateTimeSec,
      RUNTIME.respiratory,
    );
    const effectiveDownstream = downstreamEffectivePressureV1({
      edge,
      downstreamPressureMmHg: downstreamPressure,
      edgeExternalPressureMmHg: edgeExternalPressure,
    });
    const unscaledLosses = nonValveEdgeLossV1({
      edge,
      params: RUNTIME.losses,
      upstreamPressureMmHg: upstreamPressure,
      downstreamPressureMmHg: downstreamPressure,
      edgeExternalPressureMmHg: edgeExternalPressure,
    });
    expect(occluded.edgeFlowsMlPerSec.VC_RA).toBeCloseTo(
      solveSignedLinearQuadraticFlowV1(
        upstreamPressure - effectiveDownstream,
        unscaledLosses.resistanceMmHgSecPerMl * vcRaResistanceScale,
        unscaledLosses.quadraticLossMmHgSec2PerMl2,
      ),
      10,
    );
    expect(Math.abs(occluded.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-9);
    expect(occluded.reverseFlowCapOrClampOnNonvalveEdges).toBe(false);
  });

  it("rejects malformed protocol resistance scales before evaluating mechanics", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const malformed = [
      { label: "zero", scale: { VC_RA: 0 } },
      { label: "non-finite", scale: { VC_RA: Number.NaN } },
      { label: "valve", scale: { MV: 2 } },
      { label: "unknown", scale: { caller_owned_edge: 2 } },
    ] as const;

    for (const fixture of malformed) {
      const callback = vi.fn(elasticMechanicsCallback(initial));
      const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
        previousAcceptedState: initial,
        dtSec: 0.001,
        runtime: RUNTIME,
        protocolResistanceScaleByEdge:
          fixture.scale as unknown as Record<"VC_RA", number>,
        evaluateCandidateMechanics: callback,
      });
      expect(trial.converged, fixture.label).toBe(false);
      if (trial.converged === true) throw new Error("expected invalid input");
      expect(trial.reason, fixture.label).toBe("invalid-input");
      expect(trial.rollbackState, fixture.label).toEqual(initial);
      expect(trial.diagnostics.mechanicsCallbackCallCount, fixture.label).toBe(0);
      expect(callback, fixture.label).not.toHaveBeenCalled();
    }
  });

  it("conserves TBV and shows backward-Euler time-step refinement", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const callback = elasticMechanicsCallback(initial);
    const coarse = advance(initial, 0.004, 1, callback);
    const medium = advance(initial, 0.002, 2, callback);
    const fine = advance(initial, 0.001, 4, callback);
    for (const state of [coarse, medium, fine]) {
      expect(state.totalBloodVolumeMl).toBe(initial.totalBloodVolumeMl);
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
    expect(finalTrial.diagnostics.finalMixedContinuityResidualInfinityNorm)
      .toBeLessThanOrEqual(1);
    expect(finalTrial.diagnostics.absoluteContinuityResidualToleranceMl)
      .toBe(1e-8);
    expect(finalTrial.diagnostics.relativeContinuityResidualTolerance)
      .toBe(2e-10);
    expect(finalTrial.diagnostics.worstMixedContinuityResidual).not.toBeNull();
    expect(finalTrial.diagnostics.worstMixedContinuityResidual!
      .normalizedResidual).toBeLessThanOrEqual(1);
    expect(finalTrial.diagnostics.finalScaledResidualInfinityNorm).toBeLessThan(2e-10);
    expect(finalTrial.diagnostics.finalMaximumContinuityResidualMl).toBeLessThan(2e-7);
    expect(Math.abs(finalTrial.diagnostics.totalBloodVolumeErrorMl)).toBeLessThan(1e-9);
  });

  it("rejects a negative absolute continuity tolerance", () => {
    const initial = createInitialNonCoronaryCirculationStateV1({
      timeSec: 0,
      runtime: RUNTIME,
      ...coldSeedOwner(RUNTIME),
    });
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: initial,
      dtSec: 0.001,
      runtime: RUNTIME,
      options: { absoluteContinuityResidualToleranceMl: -1e-8 },
      evaluateCandidateMechanics: elasticMechanicsCallback(initial),
    });

    expect(trial.converged).toBe(false);
    if (trial.converged === true) throw new Error("expected invalid input");
    expect(trial.reason).toBe("invalid-input");
    expect(trial.message).toMatch(/absoluteContinuityResidualToleranceMl/);
  });

  it("reuses a prepared candidate evaluator without changing the canonical probe", () => {
    const fixture = steadyStateFixture();
    const input = Object.freeze({
      previousAcceptedState: fixture.state,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(fixture.state, true),
    });
    const independentVolumes = Float64Array.from(
      NON_CORONARY_INDEPENDENT_NODE_NAMES_V1.map(
        (name) => fixture.state.nodeVolumesMl[name],
      ),
    );
    const canonical = evaluateNonCoronaryCirculationCandidateProbeV1(
      input,
      independentVolumes,
    );
    let typedReadCount = 0;
    const source = Object.freeze({
      sourceId: NON_CORONARY_ACCEPTED_NUMERICAL_SOURCE_V1_ID,
      readInto(destination) {
        typedReadCount += 1;
        NON_CORONARY_NODE_NAMES_V1.forEach((name, index) => {
          destination.nodeVolumesMl[index] = fixture.state.nodeVolumesMl[name];
        });
        NON_CORONARY_DYNAMIC_EDGE_NAMES_V1.forEach((name, index) => {
          destination.dynamicEdgeFlowsMlPerSec[index] =
            fixture.state.dynamicEdgeFlowsMlPerSec[name];
        });
        NON_CORONARY_VALVE_NAMES_V1.forEach((name, index) => {
          destination.valveOpeningFractions01[index] = fixture.state
            .valveStates[name].leafletOpeningFraction01;
        });
        destination.revision = fixture.state.revision;
        destination.acceptedTimeSec = fixture.state.acceptedTimeSec;
        destination.totalBloodVolumeMl = fixture.state.totalBloodVolumeMl;
      },
    }) satisfies NonCoronaryAcceptedNumericalSourceV1;
    const prepared = prepareNonCoronaryCandidateEvaluatorV1(input, source);
    expect(typedReadCount).toBe(1);
    const observed = withPreparedNonCoronaryCandidateV1(
      prepared,
      independentVolumes,
      (candidate, dependentSvColumn, localJacobian) => {
        expect(() => withPreparedNonCoronaryCandidateV1(
          prepared,
          independentVolumes,
          () => null,
        )).toThrow(/already in use/);
        return {
          candidateTimeSec: candidate.candidateTimeSec,
          nodeVolumesMl: Array.from(candidate.nodeVolumesMl),
          nodeAbsolutePressuresMmHg:
            Array.from(candidate.nodeAbsolutePressuresMmHg),
          vascularPressureTangentMmHgPerMl:
            Array.from(candidate.vascularPressureTangentMmHgPerMl),
          edgeFlowsMlPerSec: Array.from(candidate.edgeFlowsMlPerSec),
          continuityResidualMlByNode:
            Array.from(candidate.continuityResidualMlByNode),
          dependentSvColumn: Array.from(dependentSvColumn),
          localJacobian: localJacobian === null
            ? null
            : Array.from(localJacobian),
        };
      },
    );

    expect(observed.candidateTimeSec).toBe(canonical.candidateTimeSec);
    expect(observed.nodeVolumesMl).toEqual(
      Array.from(canonical.candidateNodeVolumesMl),
    );
    expect(observed.nodeAbsolutePressuresMmHg).toEqual(
      Array.from(canonical.nodeAbsolutePressuresMmHg),
    );
    expect(observed.vascularPressureTangentMmHgPerMl).toEqual(
      Array.from(canonical.vascularPressureTangentMmHgPerMl),
    );
    expect(observed.edgeFlowsMlPerSec).toEqual(
      Array.from(canonical.edgeFlowsMlPerSec),
    );
    expect(observed.continuityResidualMlByNode).toEqual(
      Array.from(canonical.continuityResidualMlByNode),
    );
    expect(observed.dependentSvColumn).toEqual(
      Array.from(
        canonical.localIndependentResidualDDependentSvVolumeMlPerMl!,
      ),
    );
    expect(observed.localJacobian).toEqual(
      Array.from(
        canonical.localIndependentResidualDIndependentVolumeMlPerMl!,
      ),
    );

    const foreign = Object.freeze({ ...prepared }) as typeof prepared;
    expect(() => withPreparedNonCoronaryCandidateV1(
      foreign,
      independentVolumes,
      () => null,
    )).toThrow(/foreign/);

    expect(() => prepareNonCoronaryCandidateEvaluatorV1(
      input,
      Object.freeze({
        ...source,
        readInto(destination) {
          source.readInto(destination);
          destination.dynamicEdgeFlowsMlPerSec[0] += 1;
        },
      }),
    )).toThrow(/Ao_SA flow diverged/);
  });

  it("couples a pure same-candidate companion through the global TBV ledger and companion-aware commit", () => {
    const fixture = steadyStateFixture();
    const previousCompanionBloodVolumeMl = 10;
    const uptakeMlPerSec = 2;
    const dtSec = 0.001;
    const callback = vi.fn((input: Readonly<{
      candidateTimeSec: number;
      independentNodeOrder: readonly string[];
      candidateIndependentNodeVolumesMl: Readonly<Record<string, number>>;
      boundaryAbsolutePressuresMmHg: Readonly<{ Ao: number; RA: number }>;
      candidateMechanicsEvaluation: Readonly<{ token: string }>;
    }>) => Object.freeze({
      candidateCompanionBloodVolumeMl:
        previousCompanionBloodVolumeMl + dtSec * uptakeMlPerSec,
      outerBoundaryNetVolumeRateMlPerSec: Object.freeze({
        Ao: -uptakeMlPerSec,
        RA: 0,
      }),
      candidateCompanionTrial: Object.freeze({
        owner: "test-companion",
        candidateTimeSec: input.candidateTimeSec,
      }),
    }));
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec,
      runtime: RUNTIME,
      evaluateCandidateMechanics: (volumes, candidateTimeSec) =>
        Object.freeze({
          ...coupledElasticMechanicsCallback(fixture.state, true)(
            volumes,
            candidateTimeSec,
          ),
          evaluation: Object.freeze({ token: "opaque-mechanics" }),
        }),
      conservativeCompanion: Object.freeze({
        fixedGlobalTotalBloodVolumeMl:
          fixture.state.totalBloodVolumeMl
            + previousCompanionBloodVolumeMl,
        previousAcceptedCompanionBloodVolumeMl:
          previousCompanionBloodVolumeMl,
        evaluateSameCandidate: callback,
      }),
    });

    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(callback).toHaveBeenCalled();
    const firstInput = callback.mock.calls[0]![0];
    expect(firstInput.independentNodeOrder)
      .toEqual(NON_CORONARY_INDEPENDENT_NODE_NAMES_V1);
    expect(firstInput.candidateIndependentNodeVolumesMl.SV).toBeUndefined();
    expect(Number.isFinite(firstInput.boundaryAbsolutePressuresMmHg.Ao))
      .toBe(true);
    expect(Number.isFinite(firstInput.boundaryAbsolutePressuresMmHg.RA))
      .toBe(true);
    expect(firstInput.candidateMechanicsEvaluation)
      .toEqual({ token: "opaque-mechanics" });
    expect(trial.diagnostics.jacobianMode).toBe("full-fd-fallback");
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackReason)
      .toBe("conservative-companion-sensitivities-not-provided");
    expect(Math.abs(trial.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-9);
    expect(Math.abs(trial.diagnostics.dependentNodeContinuityResidualMl))
      .toBeLessThan(1e-8);
    expect(trial.conservativeCompanion?.candidateCompanionBloodVolumeMl)
      .toBeCloseTo(previousCompanionBloodVolumeMl + dtSec * uptakeMlPerSec, 12);
    expect(sumNodeVolumes(trial.candidateNodeVolumesMl))
      .toBeCloseTo(fixture.state.totalBloodVolumeMl - dtSec * uptakeMlPerSec, 9);
    expect(() => commitNonCoronaryCirculationTrialV1(fixture.state, trial))
      .toThrow(/companion-aware/);

    const committed =
      commitNonCoronaryCirculationTrialWithConservativeCompanionV1(
        fixture.state,
        trial,
      );
    expect(committed.acceptedNonCoronaryPartitionState.totalBloodVolumeMl)
      .toBeCloseTo(fixture.state.totalBloodVolumeMl - dtSec * uptakeMlPerSec, 9);
    expect(committed.acceptedNonCoronaryPartitionState.revision).toBe(1);
    expect(committed.candidateCompanionTrial).toEqual({
      owner: "test-companion",
      candidateTimeSec: dtSec,
    });
  });

  it("uses supplied companion sensitivities in the analytic Schur-complement Jacobian", () => {
    const fixture = steadyStateFixture();
    const previousCompanionBloodVolumeMl = 10;
    const conductanceMlPerSecPerMmHg = 0.1;
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics:
        coupledElasticMechanicsCallback(fixture.state, true),
      conservativeCompanion: Object.freeze({
        fixedGlobalTotalBloodVolumeMl:
          fixture.state.totalBloodVolumeMl
            + previousCompanionBloodVolumeMl,
        previousAcceptedCompanionBloodVolumeMl:
          previousCompanionBloodVolumeMl,
        evaluateSameCandidate: (input) => {
          const pressureTangent =
            input.dBoundaryAbsolutePressureDScaledIndependentVolume;
          if (pressureTangent === null) {
            throw new Error("test companion requires boundary pressure tangent");
          }
          const flowMlPerSec = conductanceMlPerSecPerMmHg * (
            input.boundaryAbsolutePressuresMmHg.Ao
              - input.boundaryAbsolutePressuresMmHg.RA
          );
          const dFlow = pressureTangent.Ao.map((value, index) =>
            conductanceMlPerSecPerMmHg
              * (value - pressureTangent.RA[index]!));
          return Object.freeze({
            candidateCompanionBloodVolumeMl:
              previousCompanionBloodVolumeMl,
            outerBoundaryNetVolumeRateMlPerSec: Object.freeze({
              Ao: -flowMlPerSec,
              RA: flowMlPerSec,
            }),
            candidateCompanionTrial: Object.freeze({ flowMlPerSec }),
            sensitivities: Object.freeze({
              dCandidateCompanionBloodVolumeMlDScaledIndependentVolume:
                Object.freeze(dFlow.map(() => 0)),
              dOuterBoundaryNetVolumeRateMlPerSecDScaledIndependentVolume:
                Object.freeze({
                  Ao: Object.freeze(dFlow.map((value) => -value)),
                  RA: Object.freeze(dFlow),
                }),
            }),
          });
        },
      }),
      options: Object.freeze({
        analyticJacobianFiniteDifferenceShadow: true,
      }),
    });

    expect(trial.converged).toBe(true);
    if (trial.converged === false) throw new Error(trial.message);
    expect(trial.diagnostics.jacobianMode).toBe("analytic-semismooth");
    expect(trial.diagnostics.analyticJacobianAssemblyCount).toBeGreaterThan(0);
    expect(trial.diagnostics.finiteDifferenceJacobianFallbackCount).toBe(0);
    expect(trial.diagnostics.finiteDifferenceJacobianShadowCount)
      .toBeGreaterThan(0);
    expect(trial.diagnostics.jacobianMaximumRelativeFrobeniusShadowDifference!)
      .toBeLessThan(2e-5);
    expect(Math.abs(trial.diagnostics.totalBloodVolumeErrorMl))
      .toBeLessThan(1e-9);
  });

  it("rejects a stale previous companion ledger before evaluating mechanics", () => {
    const fixture = steadyStateFixture();
    const mechanics = vi.fn(coupledElasticMechanicsCallback(fixture.state, true));
    const companion = vi.fn(() => Object.freeze({
      candidateCompanionBloodVolumeMl: 10,
      outerBoundaryNetVolumeRateMlPerSec: Object.freeze({ Ao: 0, RA: 0 }),
      candidateCompanionTrial: null,
    }));
    const trial = evaluateNonCoronaryCirculationBackwardEulerTrialV1({
      previousAcceptedState: fixture.state,
      dtSec: 0.001,
      runtime: RUNTIME,
      evaluateCandidateMechanics: mechanics,
      conservativeCompanion: Object.freeze({
        fixedGlobalTotalBloodVolumeMl:
          fixture.state.totalBloodVolumeMl + 11,
        previousAcceptedCompanionBloodVolumeMl: 10,
        evaluateSameCandidate: companion,
      }),
    });

    expect(trial.converged).toBe(false);
    if (trial.converged === true) throw new Error("expected invalid input");
    expect(trial.reason).toBe("invalid-input");
    expect(trial.message).toMatch(/global TBV/);
    expect(mechanics).not.toHaveBeenCalled();
    expect(companion).not.toHaveBeenCalled();
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
    fixedTotalBloodVolumeMl: sumNodeVolumes(nodeVolumes),
    nodeVolumesMl: nodeVolumes,
    dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 0, PA_PArt: 0 }),
    valveStates: Object.freeze({
      MV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      AoV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      TV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
      PV: initialMainWireQuasiSteadyOrificeValveStateV2(0),
    }),
  });
  return Object.freeze({ state, chamberPressures });
}

function coldSeedOwner(
  runtime: NonCoronaryCirculationRuntimeParamsV1,
): Readonly<{ fixedTotalBloodVolumeMl: number }> {
  return Object.freeze({
    fixedTotalBloodVolumeMl:
      resolveNonCoronaryCirculationColdSeedV1(runtime)
        .fixedTotalBloodVolumeMl,
  });
}

function sumNodeVolumes(
  volumes: NonCoronaryCirculationAcceptedStateV1["nodeVolumesMl"],
): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, name) => sum + volumes[name],
    0,
  );
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

function coupledElasticMechanicsCallback(
  reference: NonCoronaryCirculationAcceptedStateV1,
  includeTangent: boolean,
): NonCoronaryCandidateMechanicsCallbackV1<null> {
  const base = [16, 12, 11, 7] as const;
  const tangentMatrix:
    NonCoronaryAbsoluteChamberPressureTangentV1[
      "dPressureDVolumeMmHgPerMl"
    ] = [
      [0.12, 0.004, 0.006, 0],
      [0.004, 0.08, 0, 0.003],
      [0.006, 0, 0.09, 0.002],
      [0, 0.003, 0.002, 0.06],
    ];
  const tangent: NonCoronaryAbsoluteChamberPressureTangentV1 = Object.freeze({
    rowPressureOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    columnVolumeOrder: NON_CORONARY_CHAMBER_TANGENT_ORDER_V1,
    units: "mmHg/mL" as const,
    pressureKind: "absolute" as const,
    derivativeSemantics:
      "candidate-algorithmic-at-fixed-accepted-state-time-dt-and-drive" as const,
    dPressureDVolumeMmHgPerMl: tangentMatrix,
  });
  const referenceVolumes = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
    (name) => reference.nodeVolumesMl[name],
  );
  return (volumes) => {
    const delta = NON_CORONARY_CHAMBER_TANGENT_ORDER_V1.map(
      (name, index) => volumes[name] - referenceVolumes[index]!,
    );
    const pressures = tangentMatrix.map((row, pressureIndex) =>
      base[pressureIndex]!
      + row.reduce(
        (sum, coefficient, volumeIndex) =>
          sum + coefficient * delta[volumeIndex]!,
        0,
      ));
    return Object.freeze({
      absolutePressuresMmHg: Object.freeze({
        LV: pressures[0]!,
        LA: pressures[1]!,
        RV: pressures[2]!,
        RA: pressures[3]!,
      }),
      ...(includeTangent ? { absolutePressureTangent: tangent } : {}),
      evaluation: null,
    });
  };
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
