import { it, expect } from "vitest";
import high from "@/data/model-presets/standard73/as-high-gradient-v1.json";
import low from "@/data/model-presets/standard73/as-low-flow-v1.json";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { MainWireCardiacCycleCollectorV1 as Collector } from "@/analysis/methods/mainWire/MainWireCardiacCycleCollectorV1";
import { buildMainWireAorticJetPresentationV1 as build, MAIN_WIRE_AORTIC_JET_PRESENTATION_INPUTS_V1 as inputs,
  MAIN_WIRE_AORTIC_JET_PRESENTATION_OUTPUTS_V1 as outputs, MAIN_WIRE_AORTIC_JET_PRESENTATION_V1_ID as methodId } from "@/analysis/methods/mainWire/MainWireAorticJetPresentationV1";
import { buildMainWireCardiacCycleMetricsV1 as cycle, type MainWireCardiacCycleAcceptedSampleV1 as Sample } from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import { hotPathIntegrityTierV1, selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 as rho, MAIN_WIRE_VALVE_PA_PER_MMHG_V2 as pa } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 as valve } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { completedEjectionWaveformV1 } from "@/components/workbench/presentation/CompletedEjectionWaveformV1";
import { loadStudioLocalCurrentClientCompositionV1 } from "@/studio/composition/StudioDefaultCompositionV2";
import { createDefaultExperimentSurfaceV3 } from "@/components/workbench/WorkbenchSurfaceV3";
import { addWorkbenchSurfacePaneV3 } from "@/components/workbench/WorkbenchSurfacePaneOperationsV3";
import { workbenchPresentationAnalysisSelectionV1 as selected } from "@/components/workbench/presentation/WorkbenchPresentationOutputSelectionV3";

it.each([high, low])("compares the live AS observer with the same ejection's native integrals: $title", async raw => {
  const tier = hotPathIntegrityTierV1(); selectHotPathIntegrityTierV1("hot-path-lean");
  const preset = validateScenarioPresetV2(raw), adapter = release().executables.simulationAdapter;
  const id = { runtimeSessionId: "as-jet", scenarioId: "case" };
  const collector = new Collector({ methodId, requiredIds: inputs, build });
  const samples: Sample[] = [];
  let completed = 0;
  try {
    await adapter.createSession({ runtimeSessionId: id.runtimeSessionId, scenarios: [{ scenarioId: id.scenarioId, ...preset.capture }] });
    for (let i = 0; i < 120; i++) {
      const batch = await adapter.advancePresentationBatch({ ...id, stepCount: 16, presentationOutputIds: inputs });
      const emitted = collector.ingest(batch);
      for (let row = 0; row < batch.acceptedTimesSec.length; row++) samples.push({
        inputEpoch: batch.terminalFrame.inputEpoch, acceptedRevision: batch.acceptedRevisions[row]!, acceptedTimeSec: batch.acceptedTimesSec[row]!,
        values: Object.fromEntries(inputs.map((key, col) => [key, batch.outputStates[row * inputs.length + col]! < 2
          ? batch.outputValues[row * inputs.length + col]! : null])),
      });
      if (!emitted || typeof emitted.payload !== "object" || emitted.payload === null
        || !("status" in emitted.payload) || emitted.payload.status !== "available") continue;
      const direct = build(samples), c = cycle(samples);
      expect(emitted.payload).toEqual(direct); expect(c.status).toBe("available");
      if (c.status !== "available" || direct.status !== "available") throw new Error("No complete ejection");
      const waveform = completedEjectionWaveformV1(direct.cycleWaveform);
      expect(waveform).not.toBeNull();
      expect(waveform!.durationMs).toBeCloseTo(c.aorticEjection.positiveFlowDurationSec * 1000, 8);
      expect(waveform!.peakTimeMs).toBe(direct.values[outputs[3].outputId]);
      expect(Math.max(...waveform!.points.map(p => p[1]))).toBe(direct.values[outputs[0].outputId]);
      const frame = adapter.currentFrame(id), read = (key: string) => {
        const value = frame.outputs[key]?.value; expect(typeof value).toBe("number"); return value as number;
      };
      const sv = read("hemodynamics.valve-volume.forward.AoV"), et = read("hemodynamics.duration.valve-forward-flow.AoV");
      const hydraulic = read("hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV");
      const transformedMean = 4 / (rho / (2 * pa)) * (hydraulic - valve.valves.AoV.backgroundLinearResistanceMmHgSecPerMl * sv / et);
      // Technical agreement budgets, not physiology gates. Native hydraulic
      // endpoint clipping and the 4v² observer have a small closure residual.
      expect(Math.abs(c.aorticEjection.forwardVolumeMl / sv - 1)).toBeLessThan(.005);
      expect(Math.abs(c.aorticEjection.positiveFlowDurationSec - et)).toBeLessThan(.0021);
      expect(Math.abs(Number(direct.values[outputs[1].outputId]) / transformedMean - 1)).toBeLessThan(.015);
      for (const o of outputs) expect(frame.outputs[o.outputId]).toBeUndefined();
      completed++;
    }
    expect(completed).toBeGreaterThanOrEqual(3);
  } finally { adapter.disposeSession(id.runtimeSessionId); selectHotPathIntegrityTierV1(tier); }
}, 40_000);

it("selects one existing observer from the optional graph without output cards or an exact signal placeholder", async () => {
  const { modelSurface: model } = await loadStudioLocalCurrentClientCompositionV1();
  const empty = { ...createDefaultExperimentSurfaceV3(model.contract), outputPanes: [] };
  expect(selected(empty, model.catalog, model.analysis.presentationMethods)).not.toContain(methodId);
  const withGraph = addWorkbenchSurfacePaneV3(empty, "graph", model.contract, "hemodynamics.aortic-jet.cycle").surface;
  expect(selected(withGraph, model.catalog, model.analysis.presentationMethods).filter(id => id === methodId)).toHaveLength(1);
  const pane = withGraph.graphPanes.at(-1)!;
  expect(pane.series).toEqual([]);
  expect(pane.historyDepth).toBeUndefined();
  expect(pane.windowSec).toBeUndefined();
});

it("rejects malformed timing/waveform payloads without drawing fabricated curves", () => {
  const good = { schemaId: "completed-ejection-waveform-v1", unit: "m/s", durationMs: 300, peakTimeMs: 100,
    points: [[0, 0], [100, 4], [300, 0]] };
  expect(completedEjectionWaveformV1(good)).toEqual(good);
  for (const change of [{ peakTimeMs: 400 }, { durationMs: 0 }, { unit: "mmHg" },
    { points: [[0, 0], [100, NaN], [300, 0]] }, { points: [[0, 0], [0, 1], [300, 0]] }])
    expect(completedEjectionWaveformV1({ ...good, ...change })).toBeNull();
});
