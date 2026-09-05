import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID,
  MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1,
  buildMainWireCardiacCycleMetricsV1,
  requireMainWireCardiacCyclePresentationIntervalSecV1,
  type MainWireCardiacCycleAcceptedSampleV1,
} from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";

import { readFileSync } from "node:fs";
import { importExactExecutableArtifactModuleV2 } from
  "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import type { RegisteredModelSimulationAdapterV2 } from "@/studio/contracts/v2/simulation";
import { REGISTERED_STANDARD70_LAUNCH_BASELINE_V1 as launch } from
  "@/studio/registry/RegisteredModelLaunchBaselineV1";
import { AcceptedScalarAnalysisWindowStoreV1 } from "@/analysis/runtime/AcceptedScalarAnalysisWindowV1";
import previousSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV1";
import cycleSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootSurfaceV2";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from
  "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";

const DT_SEC = 0.002;

describe("Main Wire flow-event timing and windowed pressure-rate analysis V1", () => {
  it("adds seven derived outputs while retaining the complete preceding Surface and PVA method", () => {
    const { surfaceReleaseId: _oldId, predecessorSurfaceReleaseId: _oldParent,
      derivedOutputCatalog: previousOutputs, ...previous } = previousSurface;
    const { surfaceReleaseId: _newId, predecessorSurfaceReleaseId: _newParent,
      derivedOutputCatalog: nextOutputs, ...next } = cycleSurface;
    expect(next).toEqual(previous);
    expect(nextOutputs.slice(0, previousOutputs.length)).toEqual(previousOutputs);
    expect(nextOutputs).toHaveLength(previousOutputs.length + 7);
    const methods = resolveMainWireAnalysisMethodsForSurfaceV1(cycleSurface);
    expect(methods.periodicPvaDerivation).toBe(
      resolveMainWireAnalysisMethodsForSurfaceV1(previousSurface).periodicPvaDerivation);
    expect(methods.cardiacCycleDerivation?.methodId).toBe(MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID);
  });

  it("derives current Standard70 launch frames without adding derived placeholders to the exact artifact", async () => {
    const module = await importExactExecutableArtifactModuleV2(new Uint8Array(readFileSync(
      "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.artifact.mjs",
    )));
    const factory = module.createCircleHeartExactModelReleaseV1 as () => {
      executables: { simulationAdapter: RegisteredModelSimulationAdapterV2 };
    };
    const adapter = factory().executables.simulationAdapter;
    const authority = { runtimeSessionId: "cycle-analysis", scenarioId: "baseline" };
    const store = new AcceptedScalarAnalysisWindowStoreV1({
      expectedFrameIntervalSec: DT_SEC,
      requiredExactOutputIds: MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1,
    });
    await adapter.createSession({ runtimeSessionId: authority.runtimeSessionId,
      scenarios: [{ scenarioId: authority.scenarioId, ...launch.capture }] });
    try {
      let frame = adapter.currentFrame(authority);
      store.appendFrames([frame]);
      for (let index = 0; index < 1_000; index++) {
        frame = await adapter.advanceOnePresentationStep(authority);
        store.appendFrames([frame]);
      }
      for (const id of Object.values(MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1)) {
        expect(frame.outputs[id]).toBeUndefined();
      }
      const result = buildMainWireCardiacCycleMetricsV1(store.getScenarioSamples(authority.scenarioId));
      expect(result.status).toBe("available");
      if (result.status !== "available") return;
      expect(Object.values(result.values).every((value) => typeof value === "number" && Number.isFinite(value))).toBe(true);
      expect(result.source.cycleDurationSec).toBeCloseTo(60 / 70, 9);
      expect(result.values[MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.leftVentricularMaximumPressureRate10Ms]).toBeGreaterThan(0);
      expect(result.values[MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1.rightVentricularMinimumPressureRate10Ms]).toBeLessThan(0);
      store.appendFrames([frame]);
      expect(buildMainWireCardiacCycleMetricsV1(store.getScenarioSamples(authority.scenarioId))).toEqual(result);
      const changed = await adapter.applyControl({ ...authority,
        controlId: "rhythm.heart-rate-bpm", value: 80, expectedInputEpoch: frame.inputEpoch });
      store.appendFrames([changed]);
      expect(buildMainWireCardiacCycleMetricsV1(store.getScenarioSamples(authority.scenarioId)).status).toBe("unavailable");
    } finally {
      adapter.disposeSession(authority.runtimeSessionId);
    }
  }, 30_000);

  it("pins its sampling contract to the exact manifest-owned presentation interval", () => {
    expect(requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.002,
    })).toBe(0.002);
    expect(() => requireMainWireCardiacCyclePresentationIntervalSecV1({
      presentationDtSec: 0.004,
    })).toThrow(/requires the exact 2-ms presentation interval/);
  });

  it("derives flow timing, Tei-like index, and 10-ms windowed pressure rates", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1());

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    expect(result.methodId).toBe(MAIN_WIRE_CARDIAC_CYCLE_METRICS_METHOD_V1_ID);
    expect(result.source).toMatchObject({
      cycleStartTimeSec: 1,
      cycleEndTimeSec: 2,
      cycleDurationSec: 1,
      timebase: "every-exact-presentation-boundary-no-resampling",
    });
    expect(result.aorticEjection.positiveFlowDurationSec).toBeCloseTo(0.3, 12);
    expect(result.aorticEjection.forwardVolumeMl).toBeCloseTo(15, 12);
    expect(result.flowEvents.isovolumicContractionTimeSec).toBeCloseTo(0.02, 12);
    expect(result.flowEvents.isovolumicRelaxationTimeSec).toBeCloseTo(0.08, 12);

    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeCloseTo(20, 12);
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeCloseTo(80, 12);
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeCloseTo(1 / 3, 12);

    for (const [windowSec, maximumOutputId, minimumOutputId] of [
      [0.01, ids.leftVentricularMaximumPressureRate10Ms, ids.leftVentricularMinimumPressureRate10Ms],
    ] as const) {
      const expectedMaximum = 40 * Math.sin(Math.PI * windowSec) / windowSec;
      expect(Math.abs(result.values[maximumOutputId]! - expectedMaximum))
        .toBeLessThan(0.3);
      expect(Math.abs(result.values[minimumOutputId]! + expectedMaximum))
        .toBeLessThan(0.3);
    }
    const expectedRvMaximum = 10 * Math.sin(Math.PI * 0.01) / 0.01;
    expect(Math.abs(
      result.values[ids.rightVentricularMaximumPressureRate10Ms]!
        - expectedRvMaximum,
    )).toBeLessThan(0.1);
    expect(Math.abs(
      result.values[ids.rightVentricularMinimumPressureRate10Ms]!
        + expectedRvMaximum,
    )).toBeLessThan(0.1);
  });

  it("keeps timing components nullable instead of inventing missing mitral events", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      mitralFlow: () => 0,
    }));

    expect(result.status).toBe("available");
    if (result.status !== "available") return;
    const ids = MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1;
    expect(result.values[ids.leftVentricularIsovolumicContractionTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularIsovolumicRelaxationTimeMs]).toBeNull();
    expect(result.values[ids.leftVentricularMyocardialPerformanceIndex]).toBeNull();
  });

  it("fails closed when more than one material forward ejection is present", () => {
    const result = buildMainWireCardiacCycleMetricsV1(samplesV1({
      aorticFlow: (phase) =>
        triangularPulseV1(phase, 0.2, 0.35, 0.5, 100)
        + triangularPulseV1(phase, 0.65, 0.7, 0.75, 40),
    }));

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "multiple-material-aortic-forward-ejections",
    });
  });

  it("rejects omitted or decimated samples rather than treating a visual buffer as exact timing", () => {
    const samples = samplesV1();
    expect(() => buildMainWireCardiacCycleMetricsV1(samples.filter((_, index) => index % 2 === 0)))
      .toThrow(/2-ms grid/);
    expect(() => buildMainWireCardiacCycleMetricsV1([...samples.slice(0, 10), ...samples.slice(11)]))
      .toThrow(/2-ms grid/);
  });

  it("waits for two complete phase boundaries and rejects mixed epochs", () => {
    expect(buildMainWireCardiacCycleMetricsV1(samplesV1().slice(0, Math.round(1.5 / DT_SEC))))
      .toMatchObject({
        status: "unavailable",
        reason: "insufficient-complete-regular-sinus-cycles",
      });
    const mixed = [...samplesV1()];
    mixed[mixed.length - 1] = Object.freeze({
      ...mixed.at(-1)!,
      inputEpoch: 2,
    });
    expect(() => buildMainWireCardiacCycleMetricsV1(mixed))
      .toThrow(/cross input epochs/);
  });
});

function samplesV1(overrides: Readonly<{
  aorticFlow?: (phase: number) => number;
  mitralFlow?: (phase: number) => number;
}> = {}): readonly MainWireCardiacCycleAcceptedSampleV1[] {
  const sampleCount = Math.round(2.01 / DT_SEC) + 1;
  return Object.freeze(Array.from({ length: sampleCount }, (_, index) => {
    const acceptedTimeSec = index * DT_SEC;
    const phase = normalizedPhaseV1(acceptedTimeSec);
    const aorticFlow = overrides.aorticFlow?.(phase)
      ?? triangularPulseV1(phase, 0.2, 0.35, 0.5, 100);
    const mitralFlow = overrides.mitralFlow?.(phase)
      ?? (phase < 0.18 ? 100 * (0.18 - phase) : Math.max(0, 100 * (phase - 0.58)));
    return Object.freeze({
      inputEpoch: 1,
      acceptedRevision: index,
      acceptedTimeSec,
      values: Object.freeze({
        "rhythm.phase.regular-sinus": phase,
        "hemodynamics.flow.valve.MV": mitralFlow,
        "hemodynamics.flow.valve.AoV": aorticFlow,
        "hemodynamics.pressure.absolute.LV":
          80 + 20 * Math.sin(2 * Math.PI * phase),
        "hemodynamics.pressure.absolute.RV":
          20 + 5 * Math.sin(2 * Math.PI * phase),
      }),
    });
  }));
}

function normalizedPhaseV1(timeSec: number): number {
  const rounded = Math.round(timeSec * 1e12) / 1e12;
  const phase = Math.round(
    (rounded - Math.floor(rounded)) * 1e12,
  ) / 1e12;
  return phase >= 1 - 1e-12 ? 0 : phase;
}

function triangularPulseV1(
  phase: number,
  start: number,
  peak: number,
  end: number,
  maximum: number,
): number {
  if (phase <= start || phase >= end) return 0;
  return phase <= peak
    ? maximum * (phase - start) / (peak - start)
    : maximum * (end - phase) / (end - peak);
}
