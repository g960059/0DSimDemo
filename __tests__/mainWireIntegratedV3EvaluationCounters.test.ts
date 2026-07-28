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
    // This previously measured 12 whole-heart mechanics probes per step.
    // The analytic tangent replaced those finite-difference probes, and these
    // counters now prove that they are gone rather than merely unobserved.
    expect(counters.mechanics.lvRvProbeEvaluationCount)
      .toBe(0);
    expect(counters.mechanics
      .ventricularCoronaryBoundaryProbeFallbackCount).toBe(0);
    expect(counters.mechanics.totalEvaluationCount)
      .toBe(diagnostics.mechanicsCallbackUniqueCandidateCount);
    expect(counters.mechanics.totalEvaluationCount)
      .toBe(counters.mechanics.candidateCenterEvaluationCount);
    expect(counters.mechanics.triSegProviderCounterReadbackCount)
      .toBe(counters.mechanics.totalEvaluationCount);
    expect(counters.mechanics.solveInternalCoordinatesCallCount)
      .toBe(counters.mechanics.totalEvaluationCount);
    expect(counters.mechanics.evaluateCandidateCallCount)
      .toBeGreaterThanOrEqual(
        counters.mechanics.solveInternalCoordinatesCallCount,
      );

    for (const wallId of ["LA", "RA"] as const) {
      // This used to expect evaluateCandidateCallCount (40), recording 25
      // repeated material evaluations per atrial wall per step. Those repeats
      // were the target: material is now solved once per TriSeg solve (15),
      // while strain below is still observed once per candidate. The derived
      // repeat counters prove the redundant material solves are gone.
      expect(counters.mechanics.atrialMaterialEvaluationCountByWall[wallId])
        .toBe(counters.mechanics.solveInternalCoordinatesCallCount);
      expect(counters.mechanics
        .atrialFiberLogStrainObservationCountByWall[wallId])
        .toBe(counters.mechanics.evaluateCandidateCallCount);
      expect(counters.mechanics
        .atrialFiberLogStrainChangeCountByWall[wallId]).toBe(0);
      expect(counters.mechanics
        .atrialFiberLogStrainDistinctInputCountByWall[wallId])
        .toBe(counters.mechanics.solveInternalCoordinatesCallCount);
    }
    const laCacheableRepeatMaterialEvaluationCount =
      counters.mechanics.atrialMaterialEvaluationCountByWall.LA
      - counters.mechanics.atrialFiberLogStrainDistinctInputCountByWall.LA;
    const raCacheableRepeatMaterialEvaluationCount =
      counters.mechanics.atrialMaterialEvaluationCountByWall.RA
      - counters.mechanics.atrialFiberLogStrainDistinctInputCountByWall.RA;
    expect(laCacheableRepeatMaterialEvaluationCount).toBe(0);
    expect(raCacheableRepeatMaterialEvaluationCount).toBe(0);
  });

  it("falls back to mechanics probes when the optional ventricular rows are absent", () => {
    const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const providerWithoutAnalyticRows = Object.freeze({
      ...fixture.provider,
      evaluateTrial: (
        input: Parameters<typeof fixture.provider.evaluateTrial>[0],
      ) => {
        const evaluation = fixture.provider.evaluateTrial(input);
        const readback = evaluation.diagnostics.readback;
        if (
          readback === null
          || typeof readback !== "object"
          || Array.isArray(readback)
        ) {
          throw new Error("production trial omitted its mechanics readback");
        }
        const readbackWithoutAnalyticRows = Object.freeze(
          Object.fromEntries(
            Object.entries(readback).filter(
              ([key]) => key !== "ventricularCoronaryBoundaryTangent",
            ),
          ),
        );
        return Object.freeze({
          ...evaluation,
          diagnostics: Object.freeze({
            ...evaluation.diagnostics,
            readback: readbackWithoutAnalyticRows,
          }),
        });
      },
    });
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
    const stepped = stepMainWireIntegratedModelV3(
      providerWithoutAnalyticRows,
      previous,
      Object.freeze({
        candidateTimeSec: maximum.candidateTimeSec,
        coronary: Object.freeze({
          ...fixture.coronaryStepInput,
          evaluationCounterCollection: "enabled" as const,
        }),
        rhythm: Object.freeze({
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
      }),
    );

    expect(stepped.converged).toBe(true);
    if (stepped.converged === false) {
      throw new Error(`ventricular-row fallback failed: ${stepped.message}`);
    }
    const counters = stepped.coronaryStep.baseStep.circulationTrial.diagnostics
      .evaluationCounters;
    expect(counters).toBeDefined();
    if (counters === undefined) {
      throw new Error("ventricular-row fallback omitted evaluation counters");
    }
    expect(counters.mechanics
      .ventricularCoronaryBoundaryProbeFallbackCount).toBeGreaterThan(0);
    expect(counters.mechanics.lvRvProbeEvaluationCount).toBe(
      2 * counters.mechanics
        .ventricularCoronaryBoundaryProbeFallbackCount,
    );
  }, 60_000);
});
