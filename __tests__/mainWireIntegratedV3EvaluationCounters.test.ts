import { describe, expect, it } from "vitest";

import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireFiveWallLandTriSegReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  MainWireNormalAdultWallMaterialReadbackV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import type {
  WholeHeartMechanicsSerializableValueV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

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
    // The analytic tangent owns the ventricular columns. These relationships,
    // rather than counts from one cold fixture, prove that no whole-heart
    // finite-difference probes silently returned.
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
      // Material is solved once per TriSeg solve, while strain is observed once
      // per candidate. The relationships and derived zero-repeat count avoid
      // pinning incidental totals from a particular cold Newton trajectory.
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

  it("keeps the accounting valid after advancing the canonical V3 runtime into active Land stress", async () => {
    const runtime = await createMainWireIntegratedModelRuntimeV3();
    let accepted = runtime.cold.acceptedState;
    let measured: ReturnType<typeof stepMainWireIntegratedModelV3> | null =
      null;
    let nominalGridIndex = 1;
    const targetTimeSec = 2.9;

    while (accepted.acceptedTimeSec < targetTimeSec) {
      let nominalTargetSec = nominalGridIndex * 0.002;
      while (!(nominalTargetSec > accepted.acceptedTimeSec)) {
        nominalGridIndex += 1;
        nominalTargetSec = nominalGridIndex * 0.002;
      }
      const maximum = limitMainWireIntegratedModelCandidateTimeV3(
        accepted,
        nominalTargetSec,
        {
          configuration: runtime.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        runtime.profile,
        runtime.config,
      );
      const collect = maximum.candidateTimeSec === targetTimeSec;
      const stepped = stepMainWireIntegratedModelV3(
        runtime.provider,
        accepted,
        Object.freeze({
          candidateTimeSec: maximum.candidateTimeSec,
          coronary: collect
            ? Object.freeze({
              ...runtime.coronaryStepInput,
              evaluationCounterCollection: "enabled" as const,
            })
            : runtime.coronaryStepInput,
          rhythm: Object.freeze({
            configuration: runtime.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null,
            externalAtrialSourceBatch: null,
          }),
          dynamicMechanicalSupport: runtime.dynamicMechanicalSupport,
        }),
      );
      expect(stepped.converged).toBe(true);
      if (stepped.converged === false) {
        throw new Error(
          `canonical V3 counter fixture failed: ${stepped.message}`,
        );
      }
      accepted = stepped.acceptedState;
      if (accepted.acceptedTimeSec === nominalTargetSec) {
        nominalGridIndex += 1;
      }
      if (collect) measured = stepped;
    }

    expect(measured?.converged).toBe(true);
    if (measured === null || measured.converged === false) {
      throw new Error("canonical V3 counter fixture omitted measured step");
    }
    const diagnostics =
      measured.coronaryStep.baseStep.circulationTrial.diagnostics;
    const counters = diagnostics.evaluationCounters;
    expect(counters).toBeDefined();
    if (counters === undefined) {
      throw new Error("canonical V3 step omitted evaluation counters");
    }
    const mechanics = providerReadback(
      measured.coronaryStep.baseStep.mechanicsTrial.diagnostics.readback,
    );
    const ventricularActiveStressPa = ([
      "LVFW",
      "SEP",
      "RVFW",
    ] as const).map((wallId) =>
      wallReadback(mechanics.wallMaterialReadbackByWall[wallId])
        .landActiveKirchhoffStressPa);

    expect(measured.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec)
      .toEqual({ LVAD: 0, IMPELLA: 0, VA_ECMO: 0, VV_ECMO: 0 });
    expect(Math.max(...ventricularActiveStressPa)).toBeGreaterThan(0);
    expect(counters.coronaryImplicitSensitivities.directionCount)
      .toBeGreaterThan(0);
    expect(counters.coronaryImplicitSensitivities
      .exactZeroBoundaryDirectionCount).toBeLessThan(
        counters.coronaryImplicitSensitivities.directionCount,
      );
    expect(counters.mechanics.lvRvProbeEvaluationCount).toBe(0);
    expect(counters.mechanics
      .ventricularCoronaryBoundaryProbeFallbackCount).toBe(0);
    expect(counters.mechanics.atrialMaterialEvaluationCountByWall.LA)
      .toBe(counters.mechanics.solveInternalCoordinatesCallCount);
    expect(counters.mechanics.atrialMaterialEvaluationCountByWall.RA)
      .toBe(counters.mechanics.solveInternalCoordinatesCallCount);
  }, 30_000);

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

function providerReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireFiveWallLandTriSegReadbackV1 {
  return value as unknown as MainWireFiveWallLandTriSegReadbackV1;
}

function wallReadback(
  value: WholeHeartMechanicsSerializableValueV1 | null,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return value as unknown as MainWireNormalAdultWallMaterialReadbackV1;
}
