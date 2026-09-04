import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V3,
  classifyMainWireIntegratedModelPeriodicityV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
  type MainWireIntegratedModelPeriodicClosureReportV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";

const OPTIONS = Object.freeze({
  period1NormalizedTolerance: 1e-6,
  period2NormalizedTolerance: 1e-6,
  period2MinimumPeriod1NormalizedDelta: 5e-3,
  consecutiveCycles: 3,
});

describe("integrated Main V3 periodic classifier", () => {
  it("requires three linked canonical P1 observations and never promotes numerical closure to physiology", () => {
    const observations = observationSeries(1, 3, 0, 0);
    expect(
      classifyMainWireIntegratedModelPeriodicityV3(observations, OPTIONS),
    ).toMatchObject({
      status: "period1-converged",
      evidenceCycleIndices: [1, 2, 3],
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    });

    const bounded = observations.map((observation) =>
      Object.freeze({
        ...observation,
        evidenceRole: "bounded-exploration-only" as const,
      }),
    );
    expect(
      classifyMainWireIntegratedModelPeriodicityV3(bounded, OPTIONS).status,
    ).toBe("not-converged");
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V3,
    ).toMatchObject({
      period1ComparisonLag: 1,
      period2ComparisonLag: 2,
      fixedHorizonCharacterizationCanEstablishCanonicalPeriodicity: false,
      numericalPeriodicityIsPhysiologicalAcceptance: false,
    });
  });

  it("labels a linked low-P2/high-P1 suffix as suspect and fails closed across protocol identity changes", () => {
    const observations = observationSeries(2, 4, 0.01, 0);
    expect(
      classifyMainWireIntegratedModelPeriodicityV3(observations, OPTIONS),
    ).toMatchObject({
      status: "period2-suspect",
      evidenceCycleIndices: [2, 3, 4],
      physiologicalAcceptanceEstablished: false,
      independentValidationEstablished: false,
      releaseAcceptanceEstablished: false,
    });

    const mixedProtocol = [...observations];
    mixedProtocol[1] = Object.freeze({
      ...mixedProtocol[1]!,
      protocolIdentityHash: "b".repeat(64),
    });
    expect(() =>
      classifyMainWireIntegratedModelPeriodicityV3(mixedProtocol, OPTIONS),
    ).toThrow(/different protocols/);
  });

  it.each([3, 5].flatMap((consecutiveCycles) => [
    "late-p1", "late-p2", "not-converged",
    "bad-protocol", "bad-p2-link", "bad-reference-scale",
  ].map((scenario) => ({ consecutiveCycles, scenario }))))(
    "preserves classification and rejection with bounded history: $consecutiveCycles/$scenario",
    ({ consecutiveCycles, scenario }) => {
      const options = { ...OPTIONS, consecutiveCycles };
      const full: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
      const bounded: MainWireIntegratedModelPeriodicCycleObservationV3[] = [];
      const outcome = (series: readonly MainWireIntegratedModelPeriodicCycleObservationV3[]) => {
        try {
          return ["result", classifyMainWireIntegratedModelPeriodicityV3(series, options)] as const;
        } catch (error) {
          return ["error", error instanceof Error ? error.message : String(error)] as const;
        }
      };
      let terminalStatus = "not-converged";
      let terminalCycle = 0;
      for (let cycle = 1; cycle <= 40; cycle += 1) {
        const late = cycle > 35;
        let observation = observationSeries(cycle, cycle,
          late && scenario === "late-p1" ? 0 : late && scenario === "late-p2" ? 0.01 : 0.1,
          late && scenario === "late-p2" ? 0 : 0.1,
        )[0]!;
        if (cycle === 12 && scenario === "bad-protocol") {
          observation = { ...observation, protocolIdentityHash: "b".repeat(64) };
        } else if (cycle === 12 && scenario === "bad-p2-link") {
          const period2 = observation.period2!;
          observation = { ...observation, period2: { ...period2, provenance: {
            ...period2.provenance, referenceRevision: period2.provenance.referenceRevision + 1,
          } } };
        } else if (cycle === 12 && scenario === "bad-reference-scale") {
          observation = { ...observation, period1: {
            ...observation.period1, referenceScaleSetId: "fixture-drift",
          } };
        }
        full.push(observation);
        bounded.push(observation);
        const expected = outcome(full);
        expect(outcome(bounded)).toEqual(expected);
        // Match the candidate runner: trim only after validating this prefix.
        if (bounded.length > consecutiveCycles) bounded.shift();
        terminalCycle = cycle;
        terminalStatus = expected[0] === "error" ? "rejected" : expected[1].status;
        if (terminalStatus !== "not-converged") break;
      }
      expect(terminalStatus).toBe(scenario.startsWith("bad-") ? "rejected"
        : scenario === "late-p1" ? "period1-converged"
        : scenario === "late-p2" ? "period2-suspect" : "not-converged");
      expect(terminalCycle).toBe(scenario.startsWith("bad-") ? 12
        : scenario === "not-converged" ? 40 : 35 + consecutiveCycles);
    },
  );
});

function observationSeries(
  firstCycle: number,
  lastCycle: number,
  period1MaximumNormalizedDelta: number,
  period2MaximumNormalizedDelta: number,
): readonly MainWireIntegratedModelPeriodicCycleObservationV3[] {
  return Object.freeze(
    Array.from(
      { length: lastCycle - firstCycle + 1 },
      (_, offset) => firstCycle + offset,
    ).map((cycleIndex) =>
      Object.freeze({
        cycleIndex,
        evidenceRole: "canonical-periodic-protocol" as const,
        protocolIdentityHash: "a".repeat(64),
        period1: report(cycleIndex, 1, period1MaximumNormalizedDelta),
        period2:
          cycleIndex < 2
            ? null
            : report(cycleIndex, 2, period2MaximumNormalizedDelta),
      }),
    ),
  );
}

function report(
  currentBoundary: number,
  periodLag: 1 | 2,
  maximumNormalizedDelta: number,
): MainWireIntegratedModelPeriodicClosureReportV3 {
  const referenceBoundary = currentBoundary - periodLag;
  const revision = (boundary: number) => boundary * 10;
  const coronaryProvenance = Object.freeze({
    currentAutoregulationWindowIndex: currentBoundary,
    referenceAutoregulationWindowIndex: referenceBoundary,
    currentAutoregulationWindowStartRevision: revision(currentBoundary),
    referenceAutoregulationWindowStartRevision: revision(referenceBoundary),
    currentAutoregulationWindowStartAcceptedTimeSec: currentBoundary,
    referenceAutoregulationWindowStartAcceptedTimeSec: referenceBoundary,
  });
  const coronaryClosure = Object.freeze({
    provenance: coronaryProvenance,
    overall: Object.freeze({
      numericEntryCount: 122,
      booleanEntryCount: 3,
      entryCount: 125,
      maximumNormalizedDelta,
    }),
  });
  return Object.freeze({
    closureId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
    referenceScaleSetId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3.scaleSetId,
    coronaryClosure,
    compatibility: Object.freeze({ fixture: "classifier-v3" }),
    provenance: Object.freeze({
      periodLag,
      currentAcceptedTimeSec: currentBoundary,
      referenceAcceptedTimeSec: referenceBoundary,
      currentRevision: revision(currentBoundary),
      referenceRevision: revision(referenceBoundary),
      currentRegularNextSourceSequence: currentBoundary,
      referenceRegularNextSourceSequence: referenceBoundary,
    }),
    gates: Object.freeze({
      ownerClocksAndRevisionsValid: true,
      modelConfigurationsExact: true,
      regularSinusLineageAdvancesByPeriodLag: true,
      captureAvDistalBackupAndIntervalCountersAdvanceByPeriodLag: true,
      withinStateVentricularLineageExact: true,
      pendingQueuesCompletelyPaired: true,
      dynamicMcsAllOffAndZero: true,
      coronaryV3CompatibilityAndEmptyWindowsSatisfied: true,
    }),
    overall: Object.freeze({
      numericEntryCount: 123,
      entryCount: 127,
      maximumNormalizedDelta,
    }),
  } as unknown as MainWireIntegratedModelPeriodicClosureReportV3);
}
