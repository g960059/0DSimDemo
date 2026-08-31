import { describe, expect, it } from "vitest";

import {
  runMainWireStandard66ResearchContinuationPhaseScreenV1,
} from "@/analysis/runtime/MainWireStandard66ResearchContinuationPhaseScreenRunnerV1";
import {
  createMainWireStandard66ResearchContinuationLiveSessionV1,
  createMainWireStandard66SelectedTraceLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  parseMainWireStandard66ResearchContinuationCliArgumentsV1,
} from "@/tools/scientific/runMainWireStandard66ResearchContinuationExperimentV1";

describe("Standard66 research continuation phase screen V1", () => {
  it("uses the smallest zero-grid phase-matched lag without claiming formal periodicity", async () => {
    const source =
      await createMainWireStandard66SelectedTraceLiveSessionV1();
    const continuation =
      await createMainWireStandard66ResearchContinuationLiveSessionV1({
        sourceLiveSession: source,
        hemodynamicResearchInputs:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        sourceEvidenceReference: Object.freeze({
          kind: "bounded-test-only" as const,
          evidenceRunnerId: "phase-screen-test",
          evidenceIdentityHash: null,
          evidenceStatus: "cold-boundary-test",
        }),
      });
    const result =
      await runMainWireStandard66ResearchContinuationPhaseScreenV1({
        liveSession: continuation,
        clockArmId: "dt-2ms-production",
        maximumContinuationDurationSec: 3.1,
      });

    expect(result.status).toBe("maximum-duration-reached");
    expect(result.source).toMatchObject({
      coldStartForThisArm: false,
      warmResearchContinuation: true,
      sameCompiledExecutionPlanAsProduction: true,
      sameCoupledNewtonWorkspaceBindingAsProduction: true,
      formalValidationEligible: false,
    });
    expect(result.clock).toMatchObject({
      requestedStepSec: 0.002,
      anchoredRequestedGridOriginSec: 0,
    });
    expect(result.periodicBoundary).toMatchObject({
      cycleLengthSec: 1,
      coronaryWindowDurationSec: 1,
      expectedLagCycles: 1,
      candidateConsecutiveComparisonsRequired: 3,
      freshConfirmationConsecutiveComparisonsRequired: 3,
    });
    expect(result.observations).toHaveLength(3);
    expect(result.counters.requestedGridLandingCount).toBe(1_550);
    expect(result.observations.at(-1)).toMatchObject({
      stage: "candidate-screen",
      expectedLagCycles: 1,
      currentWindowIndex: 3,
      referenceWindowIndex: 2,
      acceptedTimeSec: 3,
      anchoredGridPhase: {
        currentPhaseSec: 0,
        referencePhaseSec: 0,
        circularAbsoluteDifferenceSec: 0,
        phaseMatched: true,
      },
    });
    expect(result.formalProtocolEligibility).toBe(false);
    expect(result.numericalPeriodicityEstablished).toBe(false);
    expect(result.claim.acceptedStatesPersisted).toBe(false);
    expect(Object.keys(result.terminalCompletedBeatProjection)).toHaveLength(10);
    for (const projected of
      Object.values(result.terminalCompletedBeatProjection)) {
      expect(projected.availability).toBe("available");
      expect(projected.value).toEqual(expect.any(Number));
    }
    expect(JSON.stringify(result)).not.toContain('"acceptedState":');
    expect(result.failure).toBeNull();
  }, 120_000);

  it("preserves the absolute zero grid after a non-grid warm transition", async () => {
    const highRateInputs = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 90,
    });
    const source =
      await createMainWireStandard66SelectedTraceLiveSessionV1({
        hemodynamicResearchInputs: highRateInputs,
      });
    const firstCycleSec = 60 / 90;
    for (let ordinal = 1; ordinal <= 333; ordinal += 1) {
      const gridAdvance = source.session
        .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          ordinal * 0.002,
          Object.freeze([]),
        );
      expect(gridAdvance.advance.status).toBe("advanced");
    }
    const sourceAdvance = source.session
      .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        firstCycleSec,
        Object.freeze([]),
      );
    expect(sourceAdvance.advance.status).toBe("advanced");
    const sourceBoundary = source.session.currentAcceptedState();
    expect(sourceBoundary.coronary.coronaryAutoregulation.windowIndex).toBe(1);
    const continuation =
      await createMainWireStandard66ResearchContinuationLiveSessionV1({
        sourceLiveSession: source,
        hemodynamicResearchInputs: Object.freeze({
          ...highRateInputs,
          systemicResistance: 1.2,
        }),
        sourceEvidenceReference: Object.freeze({
          kind: "bounded-test-only" as const,
          evidenceRunnerId: "phase-screen-non-grid-test",
          evidenceIdentityHash: null,
          evidenceStatus: "exact-boundary-test",
        }),
      });
    expect(source.session.currentAcceptedState()).toEqual(sourceBoundary);

    const result =
      await runMainWireStandard66ResearchContinuationPhaseScreenV1({
        liveSession: continuation,
        clockArmId: "dt-2ms-production",
        maximumContinuationDurationSec: 2.05,
      });
    expect(result.clock.anchoredRequestedGridOriginSec).toBe(0);
    expect(result.transition.acceptedTimeSec).toBe(firstCycleSec);
    expect(result.transition.zeroAnchoredRequestedGridPhaseSec)
      .toBeCloseTo(0.0006666666666666, 12);
    expect(result.periodicBoundary.expectedLagCycles).toBe(3);
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0]).toMatchObject({
      expectedLagCycles: 3,
      currentWindowIndex: 4,
      referenceWindowIndex: 1,
      anchoredGridPhase: {
        phaseMatched: true,
      },
    });
    expect(result.observations[0]!.anchoredGridPhase.currentPhaseSec)
      .toBeCloseTo(
        result.observations[0]!.anchoredGridPhase.referencePhaseSec,
        12,
      );
    expect(JSON.stringify(result)).not.toContain('"acceptedState":');
  }, 120_000);

  it("rejects cross-heart-rate envelope pairs before running the experiment", () => {
    expect(() =>
      parseMainWireStandard66ResearchContinuationCliArgumentsV1([
        "--source-case",
        "resolution-iv-08",
        "--target-case",
        "resolution-iv-09",
        "--arm",
        "dt-2ms-production",
      ])
    ).toThrow(/must have the same heart rate/);
    expect(
      parseMainWireStandard66ResearchContinuationCliArgumentsV1([
        "--source-case",
        "resolution-iv-08",
        "--target-case",
        "resolution-iv-07",
        "--arm",
        "dt-2ms-production",
      ]),
    ).toMatchObject({
      sourceCaseId: "resolution-iv-08",
      targetCaseId: "resolution-iv-07",
      clockArmId: "dt-2ms-production",
    });
  });
});
