import { describe, expect, it } from "vitest";

import {
  measureMainWireLeftVentricularFlowEventTimingV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularFlowEventTimingV1";
import {
  evaluateMainWireLeftVentricularPressureRateV1,
} from "@/analysis/methods/mainWire/MainWireLeftVentricularPressureRateV1";
import {
  measureMainWireStandard66TerminalBeatValidationV1,
} from "@/analysis/methods/mainWire/MainWireStandard66TerminalBeatValidationMeasurementsV1";
import {
  assertMainWireStandard66ResearchContinuationLiveSessionV1,
  assertMainWireStandard66SelectedTraceLiveSessionV1,
  continueMainWireStandard66SelectedTraceFromLiveSessionV1,
  createMainWireStandard66ResearchContinuationLiveSessionV1,
  createMainWireStandard66SelectedTraceLiveSessionV1,
  mainWireStandard66SelectedTraceLatestFlowTimingInputV1,
  mainWireStandard66SelectedTracePressureSamplesV1,
  readMainWireStandard66ResearchContinuationConstructionV1,
  readMainWireStandard66SelectedTraceLiveSessionConstructionV1,
  runMainWireStandard66SelectedTraceV1,
  type MainWireStandard66SelectedTraceEndpointV1,
  type MainWireStandard66SelectedTraceLiveSessionV1,
} from "@/analysis/runtime/MainWireStandard66SelectedTraceRunnerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

describe("Standard66 selected accepted-endpoint trace runner V1", () => {
  it.each([0.002, 0.001, 0.0005] as const)(
    "runs the %s s research boundary arm in the production typed transaction",
    async (requestedBoundaryIntervalSec) => {
      const trace = await runMainWireStandard66SelectedTraceV1({
        requestedBoundaryIntervalSec,
        recordedBoundaryCount: 4,
      });

      expect(trace.source).toEqual({
        modelOwner: "Standard66-selected-typed-authority-session",
        exactModelMutation: false,
        exactFrameOutputReserved: false,
        registryOrModelSurfaceChanged: false,
        sameCompiledExecutionPlanAsProduction: true,
        sameCoupledNewtonWorkspaceBindingAsProduction: true,
      });
      expect(trace.clock.executionPlanBaseTickSec).toBe(0.002);
      expect(trace.clock.productionPresentationStepSec).toBe(0.002);
      expect(trace.clock.requestedBoundaryIntervalSec)
        .toBe(requestedBoundaryIntervalSec);
      expect(trace.clock.fixedStepIntegrationClaimed).toBe(false);
      expect(trace.clock.productionPresentationScheduleArm)
        .toBe(requestedBoundaryIntervalSec === 0.002);
      expect(trace.clock.offProductionScheduleConvergenceArm)
        .toBe(requestedBoundaryIntervalSec !== 0.002);
      expect(trace.endpoints).toHaveLength(5);
      expect(trace.endpoints[0]?.origin)
        .toBe("preceding-window-endpoint");
      expect(trace.intervals).toHaveLength(4);
      expect(trace.summary.acceptedCommitCount).toBe(4);
      expect(trace.summary.requestedBoundaryLandingCount).toBe(4);
      expect(trace.window.warmupBoundaryCount).toBe(1);
      expect(trace.window.startTimeSec).toBe(requestedBoundaryIntervalSec);
      expect(trace.endpoints.at(-1)?.actualTimeSec)
        .toBe(5 * requestedBoundaryIntervalSec);
      expect(trace.clock.maximumAcceptedStepSec)
        .toBeCloseTo(requestedBoundaryIntervalSec, 14);
      expect(mainWireStandard66SelectedTracePressureSamplesV1(trace))
        .toHaveLength(trace.endpoints.length);
      for (const endpoint of trace.endpoints.slice(1)) {
        expect(endpoint.signals.aorticLocalHydraulicPressureGradientMmHg)
          .not.toBeNull();
        expect(endpoint.signals.aorticProximalConstitutivePortPressureMmHg)
          .not.toBeNull();
      }
    },
    120_000,
  );

  it("keeps the 2 ms landing samples identical to the production host seam", async () => {
    const trace = await runMainWireStandard66SelectedTraceV1({
      requestedBoundaryIntervalSec: 0.002,
      recordedBoundaryCount: 8,
    });
    const host =
      new MainWireIntegratedStudioSelectedAorticOutflowRuntimeHostV1();
    const runtimeSessionId = "selected-trace-production-parity";
    const scenarioId = "scenario";
    await host.createSession(runtimeSessionId, [{
      scenarioId,
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }]);
    host.advanceOnePresentationStep(runtimeSessionId, scenarioId);

    for (let ordinal = 1; ordinal <= 8; ordinal += 1) {
      const frame = host.advanceOnePresentationStep(
        runtimeSessionId,
        scenarioId,
      );
      const endpoint = landingEndpointV1(trace.endpoints, ordinal);
      expect(endpoint.actualTimeSec).toBe(frame.acceptedTimeSec);
      expect(endpoint.acceptedRevision).toBe(frame.acceptedRevision);
      expect(portableSignalsV1(endpoint)).toEqual({
        mitralValveFlowMlPerSec:
          portableNumberV1(frame.outputs["hemodynamics.flow.valve.MV"]!.value),
        aorticValveFlowMlPerSec:
          portableNumberV1(frame.outputs["hemodynamics.flow.valve.AoV"]!.value),
        absoluteLeftVentricularPressureMmHg: portableNumberV1(
          frame.outputs["hemodynamics.pressure.absolute.LV"]!.value,
        ),
        aorticProximalConstitutivePortPressureMmHg: portableNumberV1(
          frame.outputs[
            "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port"
          ]!.value,
        ),
        aorticLocalHydraulicPressureGradientMmHg: portableNumberV1(
          frame.outputs[
            "hemodynamics.pressure-gradient.valve.local-hydraulic.AoV"
          ]!.value,
        ),
      });
    }
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("retains event-clipped commits and exact atrial-capture provenance for pure analyses", async () => {
    const trace = await runMainWireStandard66SelectedTraceV1({
      requestedBoundaryIntervalSec: 0.002,
      recordedBoundaryCount: 680,
      hemodynamicResearchInputs: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
        heartRateBpm: 90,
      }),
    });

    expect(trace.summary.acceptedCommitCount)
      .toBeGreaterThan(trace.window.recordedBoundaryCount);
    expect(trace.summary.eventClippedAcceptedCommitCount).toBeGreaterThan(0);
    expect(trace.capturedAtrialActivationBoundaries.length)
      .toBeGreaterThanOrEqual(2);
    for (const capture of trace.capturedAtrialActivationBoundaries) {
      const endpoint = trace.endpoints[capture.endpointIndex]!;
      expect(capture.activationTimeSec).toBe(endpoint.actualTimeSec);
      expect(endpoint.capturedAtrialActivation?.chamber).toBe("atrial");
      expect(endpoint.landedOnRequestedBoundary).toBe(false);
      expect(endpoint.clippedByRhythmBoundary).toBe(true);
    }

    const timingInput =
      mainWireStandard66SelectedTraceLatestFlowTimingInputV1(trace);
    const retainedCaptures = trace.capturedAtrialActivationBoundaries;
    const startCapture = retainedCaptures.at(-2)!;
    const endCapture = retainedCaptures.at(-1)!;
    expect(timingInput.acceptedEndpoints).toHaveLength(
      endCapture.endpointIndex - startCapture.endpointIndex + 1,
    );
    for (
      let endpointIndex = startCapture.endpointIndex + 1;
      endpointIndex <= endCapture.endpointIndex;
      endpointIndex += 1
    ) {
      expect(trace.endpoints[endpointIndex]!.acceptedRevision).toBe(
        trace.endpoints[endpointIndex - 1]!.acceptedRevision + 1,
      );
    }
    expect(timingInput.acceptedEndpoints[0]?.timeSec)
      .toBe(timingInput.startAtrialCapture.timeSec);
    expect(timingInput.acceptedEndpoints.at(-1)?.timeSec)
      .toBe(timingInput.endAtrialCapture.timeSec);
    const timing = measureMainWireLeftVentricularFlowEventTimingV1(
      timingInput,
    );
    expect(timing.source.sampling).toBe("all-accepted-endpoints");
    expect(timing.source.startAtrialCaptureId)
      .toBe(timingInput.startAtrialCapture.capturedActivationId);
    expect(timing.source.endAtrialCaptureId)
      .toBe(timingInput.endAtrialCapture.capturedActivationId);

    const pressure = evaluateMainWireLeftVentricularPressureRateV1({
      samples: mainWireStandard66SelectedTracePressureSamplesV1(trace),
      windowSec: 0.01,
    });
    expect(pressure.pressureBasis).toBe("absolute-left-ventricular");
    expect(pressure.timeBasis).toBe("actual");
    expect(pressure.positiveExtremum.status).toBe("available");
    expect(pressure.negativeExtremum.status).toBe("available");
  }, 120_000);

  it.each([0.002, 0.001, 0.0005] as const)(
    "continues the same live Session on the zero-anchored %s s grid through a margin-complete terminal beat",
    async (requestedBoundaryIntervalSec) => {
      const liveSession =
        await createMainWireStandard66SelectedTraceLiveSessionV1({
          hemodynamicResearchInputs: Object.freeze({
            ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
            heartRateBpm: 90,
          }),
        });
      const settledStandIn = liveSession.session
        .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          0.053,
          Object.freeze([]),
        );
      expect(settledStandIn.advance.status).toBe("advanced");
      const before = liveSession.session.currentAcceptedState();

      const trace =
        continueMainWireStandard66SelectedTraceFromLiveSessionV1({
          liveSession,
          requestedBoundaryIntervalSec,
        });
      const after = liveSession.session.currentAcceptedState();

      expect(trace.terminalAcquisition.sameSessionContinuedAfterSettling)
        .toBe(true);
      expect(trace.window.startTimeSec).toBe(before.acceptedTimeSec);
      expect(trace.endpoints[0]?.acceptedRevision).toBe(before.revision);
      expect(trace.endpoints[1]?.acceptedRevision).toBe(before.revision + 1);
      expect(trace.window.endTimeSec).toBe(after.acceptedTimeSec);
      expect(trace.endpoints.at(-1)?.acceptedRevision).toBe(after.revision);
      expect(trace.terminalAcquisition.leadingRetainedMarginSec)
        .toBeGreaterThanOrEqual(0.02);
      expect(trace.terminalAcquisition.trailingRetainedMarginSec)
        .toBeGreaterThanOrEqual(0.02);
      expect(trace.capturedAtrialActivationBoundaries.length)
        .toBeGreaterThanOrEqual(2);
      expect(trace.capturedAtrialActivationBoundaries.at(-2)?.capturedActivationId)
        .toBe(trace.terminalAcquisition.startCapturedActivationId);
      expect(trace.capturedAtrialActivationBoundaries.at(-1)?.capturedActivationId)
        .toBe(trace.terminalAcquisition.endCapturedActivationId);

      for (const interval of trace.intervals) {
        const zeroAnchoredOrdinal =
          interval.requestedBoundaryTimeSec / requestedBoundaryIntervalSec;
        expect(zeroAnchoredOrdinal).toBeCloseTo(
          Math.round(zeroAnchoredOrdinal),
          10,
        );
      }
      for (let endpointIndex = 1; endpointIndex < trace.endpoints.length; endpointIndex += 1) {
        expect(trace.endpoints[endpointIndex]!.acceptedRevision).toBe(
          trace.endpoints[endpointIndex - 1]!.acceptedRevision + 1,
        );
      }

      const measured = measureMainWireStandard66TerminalBeatValidationV1(trace);
      expect(measured.source.startAtrialCaptureId)
        .toBe(trace.terminalAcquisition.startCapturedActivationId);
      expect(measured.source.endAtrialCaptureId)
        .toBe(trace.terminalAcquisition.endCapturedActivationId);
      expect(measured.completedBeatAlignmentAudit.allCrossChecksPassed)
        .toBe(true);
    },
    120_000,
  );

  it("rejects a public-identity lookalike without the private route brand", async () => {
    const requestedHemodynamics = {
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 90,
    };
    const genuine =
      await createMainWireStandard66SelectedTraceLiveSessionV1({
        hemodynamicResearchInputs: requestedHemodynamics,
        mechanismResearchInputs:
          MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
        ventricularContractilityScale: 1.1,
      });
    requestedHemodynamics.heartRateBpm = 40;
    const construction =
      readMainWireStandard66SelectedTraceLiveSessionConstructionV1(genuine);
    expect(construction.hemodynamicResearchInputs.heartRateBpm).toBe(90);
    expect(construction.mechanismResearchInputs).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
    );
    expect(construction.ventricularContractilityScale).toBe(1.1);
    expect(Object.isFrozen(construction)).toBe(true);
    expect(Object.isFrozen(construction.hemodynamicResearchInputs)).toBe(true);
    expect(Object.isFrozen(construction.mechanismResearchInputs)).toBe(true);
    expect(Object.isFrozen(construction.mechanismResearchInputs.valveAreas))
      .toBe(true);
    const forged = Object.freeze({ ...genuine });

    expect(() => assertMainWireStandard66SelectedTraceLiveSessionV1(forged))
      .toThrow(/privately branded production-route live-session handle/);
    expect(() => continueMainWireStandard66SelectedTraceFromLiveSessionV1({
      liveSession:
        forged as unknown as MainWireStandard66SelectedTraceLiveSessionV1,
      requestedBoundaryIntervalSec: 0.002,
    })).toThrow(/privately branded production-route live-session handle/);
    const other =
      await createMainWireStandard66SelectedTraceLiveSessionV1();
    const swapped = Object.freeze({
      ...genuine,
      session: other.session,
    });
    expect(() => assertMainWireStandard66SelectedTraceLiveSessionV1(swapped))
      .toThrow(/privately branded production-route live-session handle/);
    expect(genuine.session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: 0,
      revision: 0,
    });
  });

  it("brands a warm research epoch separately and installs a fresh production route", async () => {
    const sourceMechanismInputs = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
      valveAreas: Object.freeze({
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
          .valveAreas,
        AoV: Object.freeze({
          ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3
            .valveAreas.AoV,
          maximumForwardEoaCm2: 3.4,
        }),
      }),
    });
    const source =
      await createMainWireStandard66SelectedTraceLiveSessionV1({
        mechanismResearchInputs: sourceMechanismInputs,
        ventricularContractilityScale: 1.1,
      });
    const targetInputs = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      totalBloodVolumeMl: 5_000,
    });
    await expect(
      createMainWireStandard66ResearchContinuationLiveSessionV1({
        sourceLiveSession: source,
        hemodynamicResearchInputs: Object.freeze({
          ...targetInputs,
          heartRateBpm: 90,
        }),
        sourceEvidenceReference: Object.freeze({
          kind: "bounded-test-only" as const,
          evidenceRunnerId: "selected-trace-heart-rate-rejection-test",
          evidenceIdentityHash: null,
          evidenceStatus: "cold-boundary-test",
        }),
      }),
    ).rejects.toThrow(/requires the same heart rate/);
    const continuation =
      await createMainWireStandard66ResearchContinuationLiveSessionV1({
        sourceLiveSession: source,
        hemodynamicResearchInputs: targetInputs,
        sourceEvidenceReference: Object.freeze({
          kind: "bounded-test-only" as const,
          evidenceRunnerId: "selected-trace-test",
          evidenceIdentityHash: null,
          evidenceStatus: "cold-boundary-test",
        }),
      });
    const construction =
      readMainWireStandard66ResearchContinuationConstructionV1(continuation);
    expect(construction).toMatchObject({
      initialization: "hemodynamic-research-continuation",
      sourceEpoch: {
        acceptedTimeSec: 0,
        acceptedRevision: 0,
        exactEmptyCoronaryWindowBoundary: true,
      },
      target: {
        hemodynamicResearchInputs: targetInputs,
        mechanismResearchInputs: sourceMechanismInputs,
        ventricularContractilityScale: 1.1,
      },
      targetEpoch: {
        acceptedTimeSec: 0,
        acceptedRevision: 0,
        exactEmptyCoronaryWindowBoundary: true,
        initialWindowIndex: 0,
      },
      semantics: {
        beatAnalysisEpochReset: true,
        instantaneousReadbackReset: true,
        coupledPredictorHistoryReset: true,
        sourceEvidenceVerifiedByFactory: false,
        heartRatePreserved: true,
        coronaryWindowAtTarget:
          "preserve-source-exact-boundary-origin-and-index",
        freshProductionExecutionPlanRoute: true,
        formalValidationEligible: false,
      },
    });
    expect(construction.sourceEpoch.constructionIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(construction.sourceEpoch.acceptedStateIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(construction.targetEpoch.acceptedStateIdentitySha256)
      .toMatch(/^[0-9a-f]{64}$/);
    expect(continuation.session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: 0,
      revision: 0,
      coronary: {
        fixedGlobalTotalBloodVolumeMl: 5_000,
        coronaryAutoregulation: {
          windowIndex: 0,
          acceptedDurationSec: 0,
          acceptedStepCount: 0,
        },
      },
    });
    expect(continuation.session.coupledPredictorReport()).toMatchObject({
      hasAcceptedPair: false,
      historyDepth: 0,
    });
    expect(() =>
      assertMainWireStandard66SelectedTraceLiveSessionV1(continuation),
    ).toThrow(/privately branded production-route live-session handle/);

    const chained =
      await createMainWireStandard66ResearchContinuationLiveSessionV1({
        sourceLiveSession: continuation,
        hemodynamicResearchInputs: Object.freeze({
          ...targetInputs,
          totalBloodVolumeMl: 5_100,
        }),
        sourceEvidenceReference: Object.freeze({
          kind: "bounded-test-only" as const,
          evidenceRunnerId: "selected-trace-chained-test",
          evidenceIdentityHash: null,
          evidenceStatus: "exact-boundary-test",
        }),
      });
    expect(readMainWireStandard66ResearchContinuationConstructionV1(chained)
      .target).toMatchObject({
        mechanismResearchInputs: sourceMechanismInputs,
        ventricularContractilityScale: 1.1,
      });

    const advanced = continuation.session
      .advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        0.002,
        Object.freeze([]),
      );
    expect(advanced.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    const forged = Object.freeze({ ...continuation });
    expect(() =>
      assertMainWireStandard66ResearchContinuationLiveSessionV1(forged),
    ).toThrow(/private production-route brand/);
    const swapped = Object.freeze({
      ...continuation,
      session: source.session,
    });
    expect(() =>
      assertMainWireStandard66ResearchContinuationLiveSessionV1(swapped),
    ).toThrow(/private production-route brand/);
  }, 120_000);
});

function landingEndpointV1(
  endpoints: readonly MainWireStandard66SelectedTraceEndpointV1[],
  requestedBoundaryOrdinal: number,
): MainWireStandard66SelectedTraceEndpointV1 {
  const matches = endpoints.filter((endpoint) =>
    endpoint.origin === "accepted-commit"
    && endpoint.enclosingRequestedBoundaryOrdinal === requestedBoundaryOrdinal
    && endpoint.landedOnRequestedBoundary);
  if (matches.length !== 1) {
    throw new Error("selected trace landing endpoint is not unique");
  }
  return matches[0]!;
}

function portableSignalsV1(
  endpoint: MainWireStandard66SelectedTraceEndpointV1,
) {
  return Object.freeze({
    mitralValveFlowMlPerSec:
      portableNumberV1(endpoint.signals.mitralValveFlowMlPerSec),
    aorticValveFlowMlPerSec:
      portableNumberV1(endpoint.signals.aorticValveFlowMlPerSec),
    absoluteLeftVentricularPressureMmHg: portableNumberV1(
      endpoint.signals.absoluteLeftVentricularPressureMmHg,
    ),
    aorticProximalConstitutivePortPressureMmHg: portableNumberV1(
      endpoint.signals.aorticProximalConstitutivePortPressureMmHg,
    ),
    aorticLocalHydraulicPressureGradientMmHg: portableNumberV1(
      endpoint.signals.aorticLocalHydraulicPressureGradientMmHg,
    ),
  });
}

function portableNumberV1(
  value: number | readonly number[] | null,
): number | null {
  if (value === null) return null;
  if (typeof value === "number") return Object.is(value, -0) ? 0 : value;
  throw new Error("selected trace parity output must be scalar");
}
