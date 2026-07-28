import { describe, expect, it } from "vitest";

import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

describe("main-wire integrated V3 evaluation counters", () => {
  it("surfaces opt-in per-step counters without changing the accepted state", () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const previous = fixture.cold.acceptedState;
    const maximum = limitMainWireIntegratedModelCandidateTimeV3(
      previous,
      0.002,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    const step = (collect: boolean) => stepMainWireIntegratedModelV3(
      fixture.provider,
      previous,
      Object.freeze({
        candidateTimeSec: maximum.candidateTimeSec,
        coronary: collect
          ? Object.freeze({
            ...fixture.coronaryStepInput,
            evaluationCounterCollection: "enabled" as const,
          })
          : fixture.coronaryStepInput,
        rhythm: Object.freeze({
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
      }),
    );

    const defaultStep = step(false);
    const measuredStep = step(true);
    expect(defaultStep.converged).toBe(true);
    expect(measuredStep.converged).toBe(true);
    if (defaultStep.converged === false || measuredStep.converged === false) {
      throw new Error("integrated V3 counter test step failed");
    }
    expect(defaultStep.coronaryStep.baseStep.circulationTrial.diagnostics
      .evaluationCounters).toBeUndefined();
    const diagnostics =
      measuredStep.coronaryStep.baseStep.circulationTrial.diagnostics;
    const counters = diagnostics.evaluationCounters;
    expect(counters).toBeDefined();
    if (counters === undefined) {
      throw new Error("enabled integrated V3 step omitted evaluation counters");
    }

    expect(measuredStep.acceptedState).toEqual(defaultStep.acceptedState);
    expect(counters.outerCirculationCandidateCount).toBeGreaterThan(0);
    expect(counters.coronaryTrial.invocationCount)
      .toBe(counters.outerCirculationCandidateCount);
    expect(counters.coronaryImplicitSensitivities.invocationCount)
      .toBe(counters.outerCirculationCandidateCount);
    expect(counters.coronaryImplicitSensitivities
      .hydraulicResidualEvaluationCount).toBe(
        counters.coronaryImplicitSensitivities
          .baseResidualProbeEvaluationCount
        + counters.coronaryImplicitSensitivities
          .volumeJacobianProbeEvaluationCount
        + counters.coronaryImplicitSensitivities
          .boundaryResidualProbeEvaluationCount
        + counters.coronaryImplicitSensitivities
          .observableProbeEvaluationCount,
      );

    expect(counters.mechanics.candidateCenterEvaluationCount)
      .toBe(diagnostics.mechanicsCallbackUniqueCandidateCount);
    expect(counters.mechanics.lvRvProbeEvaluationCount)
      .toBe(4 * counters.outerCirculationCandidateCount);
    expect(counters.mechanics.totalEvaluationCount).toBe(
      counters.mechanics.candidateCenterEvaluationCount
      + counters.mechanics.lvRvProbeEvaluationCount,
    );
    expect(counters.mechanics.triSegProviderCounterReadbackCount)
      .toBe(counters.mechanics.totalEvaluationCount);
    expect(counters.mechanics.solveInternalCoordinatesCallCount)
      .toBe(counters.mechanics.totalEvaluationCount);
    expect(counters.mechanics.evaluateCandidateCallCount)
      .toBeGreaterThanOrEqual(
        counters.mechanics.solveInternalCoordinatesCallCount,
      );

    for (const wallId of ["LA", "RA"] as const) {
      expect(counters.mechanics.atrialMaterialEvaluationCountByWall[wallId])
        .toBe(counters.mechanics.evaluateCandidateCallCount);
      expect(counters.mechanics
        .atrialFiberLogStrainObservationCountByWall[wallId])
        .toBe(counters.mechanics.evaluateCandidateCallCount);
      expect(counters.mechanics
        .atrialFiberLogStrainChangeCountByWall[wallId]).toBe(0);
      expect(counters.mechanics
        .atrialFiberLogStrainDistinctInputCountByWall[wallId])
        .toBe(counters.mechanics.solveInternalCoordinatesCallCount);
    }
  });
});
