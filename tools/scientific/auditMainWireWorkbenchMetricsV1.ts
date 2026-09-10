import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireStaticCaseSessionV1 as Session } from "@/engine/vnext/MainWireStaticCaseSessionV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as fixtureFor } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { limitMainWireIntegratedModelCandidateTimeV3 as limitTime } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import type { MainWireIntegratedModelOutputIdV3 as ExactId } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { ownMainWireStaticCaseCandidateV1 as ownCandidate, type MainWireStaticCaseCandidateV1 as Candidate } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";
import { observeMainWireBaselineV2 as nativeFilling, observeMainWireVentricularValveTimingV2 as nativeTiming,
  MainWireBaselineObservationUnavailableErrorV2, type MainWireBaselineObservationTraceSampleV2 as NativeSample } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { buildMainWireCardiacCycleMetricsV1 as cycleMetrics, MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 as cycleInputs,
  MAIN_WIRE_CARDIAC_CYCLE_OUTPUT_IDS_V1 as cycleIds, type MainWireCardiacCycleAcceptedSampleV1 as PresentationSample } from "@/analysis/methods/mainWire/MainWireCardiacCycleMetricsV1";
import { buildMainWireFillingFlowMetricsV1 as fillingMetrics, MAIN_WIRE_FILLING_FLOW_REQUIRED_EXACT_OUTPUT_IDS_V1 as fillingInputs,
  MAIN_WIRE_FILLING_FLOW_OUTPUT_IDS_V1 as fillingIds } from "@/analysis/methods/mainWire/MainWireFillingFlowMetricsV1";
import { createMainWireIntegratedStudioStaticCaseCoreReleaseV1 as release,
  bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1 as bindPlan } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { bindExecutionPlanSolveSystemRuntimeV1, prepareBoundExecutionPlanSolveGroupV1, resolveBoundExecutionPlanUpdateScheduleV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";
import { bindMainWireFiveWallCoupledExecutionPlanRuntimeV1, MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID } from "@/engine/vnext/coupled/MainWireFiveWallCoupledNewtonShadowV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import bundle from "@/data/model-releases/standard73/bundle.json";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

// Numerical replay tolerances, NOT physiological ranges. Splitting a boundary
// into individually observed calls can change the solver's floating-point path.
const replayAbsoluteTolerance = 1e-6, replayRelativeTolerance = 1e-8;
function compareReplayNumbers(a: unknown, b: unknown, requireEquivalent = true) {
  let maximumAbsoluteDifference = 0, maximumScaledError = 0;
  let worst = "";
  const walk = (x: unknown, y: unknown, path = "") => {
    if (typeof x === "number" && typeof y === "number") {
      const difference = Math.abs(x - y);
      maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, difference);
      const scaled = difference / (replayAbsoluteTolerance + replayRelativeTolerance * Math.max(Math.abs(x), Math.abs(y)));
      if (scaled > maximumScaledError) { maximumScaledError = scaled; worst = `${path}: ${x} vs ${y}`; }
    } else if (x !== null && y !== null && typeof x === "object" && typeof y === "object") {
      if (Object.keys(x).sort().join() !== Object.keys(y).sort().join()) throw new Error("Audit replay field mismatch");
      for (const key of Object.keys(x)) walk((x as Record<string, unknown>)[key], (y as Record<string, unknown>)[key], `${path}.${key}`);
    } else if (x !== y) throw new Error("Audit replay event/identity mismatch");
  };
  walk(a, b);
  if (!Number.isFinite(maximumScaledError) || requireEquivalent && maximumScaledError > 1) throw new Error(`Audit replay differs beyond numerical tolerance: ${maximumScaledError} ${worst}`);
  return { maximumAbsoluteDifference, maximumScaledError, worstDifference: worst };
}

/** Read-only audit of published captures. Compare native and presentation
 * methods on ONE native replay, then separately verify that replay against
 * actual Workbench adapter samples. Do not use the fitter's differently
 * anchored grid, or call numerically equivalent replays bitwise identical. */
export async function auditMainWireWorkbenchMetricsV1(preset: typeof bundle.baseline) {
  const c = ownCandidate({ anatomyId: preset.capture.fixture.anatomyId,
    hemodynamicResearchInputs: preset.capture.fixture.hemodynamicResearchInputs,
    mechanismResearchInputs: preset.capture.fixture.mechanismResearchInputs, ventricularContractilityScale: 1 } as Candidate);
  const fixture = fixtureFor(c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
  const boundExecutionPlan = bindPlan(), group = resolveBoundExecutionPlanUpdateScheduleV1(boundExecutionPlan).groups[0]!;
  const plan = { boundExecutionPlan, coupledNewtonWorkspace: bindExecutionPlanSolveSystemRuntimeV1(boundExecutionPlan,
    group.solveGroupId, prepareBoundExecutionPlanSolveGroupV1(boundExecutionPlan, group.solveGroupId),
    [{ systemKernelId: MAIN_WIRE_FIVE_WALL_COUPLED_SYSTEM_KERNEL_V1_ID, bind: bindMainWireFiveWallCoupledExecutionPlanRuntimeV1 }]) };
  const session = await Session.restore(preset.capture.checkpoint.payload, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs, plan);
  const exact = release(), adapter = exact.executables.simulationAdapter;
  const identity = { runtimeSessionId: "metric-audit", scenarioId: "case" };
  const ids = [...new Set<ExactId>([...cycleInputs, ...fillingInputs, "hemodynamics.flow.valve.TV", "hemodynamics.flow.valve.PV"])];
  const samples: PresentationSample[] = [], adapterSamples: PresentationSample[] = [], nativeSamples: NativeSample[] = [], beats: Beat[] = [];
  let maximumPresentationDifference = 0, maximumScaledPresentationError = 0, nativeAcceptedSteps = 0, adapterAcceptedSteps = 0;
  let completedBeatReplayComparison: ReturnType<typeof compareReplayNumbers> | null = null;
  let extremaLandmarkReplayComparison: { comparison: ReturnType<typeof compareReplayNumbers>; adapter: unknown; replay: unknown; interpretation: string } | null = null;
  await adapter.createSession({ runtimeSessionId: identity.runtimeSessionId, scenarios: [{ scenarioId: identity.scenarioId, ...preset.capture }] });
  try {
    // Four complete cycles plus the following A wave, without settlement or
    // replacing the already qualified launch capture.
    for (let batchIndex = 0; batchIndex < Math.ceil(5 * fixture.cycleLengthSec / .032); batchIndex++) {
      const batch = await adapter.advancePresentationBatch({ ...identity, stepCount: 16, presentationOutputIds: ids });
      for (let row = 0; row < batch.acceptedRevisions.length; row++) {
        const target = batch.acceptedTimesSec[row]!;
        const previousRevision = session.currentAcceptedState().revision;
        let nativeValues: ReturnType<Session["projectCurrentAcceptedValuesV1"]> | null = null;
        while (session.currentAcceptedState().acceptedTimeSec < target) {
          const previous = session.currentAcceptedState();
          const nextTime = limitTime(previous, target, { configuration: fixture.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null }, fixture.profile, fixture.config).candidateTimeSec;
          const projected = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(nextTime, ids);
          if (projected.advance.status !== "advanced" || projected.advance.internalAcceptedSubstepCount !== 1 || projected.projectedValues === null)
            throw new Error("Audit lost an accepted native endpoint");
          nativeValues = projected.projectedValues;
          const observation = session.observe(), event = observation.lastAcceptedStep?.composedRhythmCandidate;
          const flow = (id: "MV" | "AoV" | "TV" | "PV") => {
            const value = projected.projectedValues![`hemodynamics.flow.valve.${id}`];
            if (value.availability !== "available" || typeof value.value !== "number") throw new Error("Native flow unavailable");
            return value.value;
          };
          nativeSamples.push({ acceptedTimeSec: nextTime, acceptedDtSec: nextTime - previous.acceptedTimeSec,
            valveFlowMlPerSec: { MV: flow("MV"), AoV: flow("AoV"), TV: flow("TV"), PV: flow("PV") },
            acceptedEventIdentity: { atrialCapturedActivationId: event?.capturedAtrialActivation?.capturedActivationId ?? null } });
          nativeAcceptedSteps++;
          if (observation.completedBeatMetrics !== null && observation.completedBeatMetrics.endTimeSec !== beats.at(-1)?.endTimeSec)
            beats.push(observation.completedBeatMetrics);
        }
        const state = session.currentAcceptedState();
        if (state.acceptedTimeSec !== target || state.revision !== batch.acceptedRevisions[row])
          throw new Error("Native and Workbench trajectories have different clocks/revisions");
        adapterAcceptedSteps += state.revision - previousRevision;
        if (nativeValues === null) throw new Error("Audit presentation endpoint was not advanced");
        const values = Object.fromEntries(ids.map((id, column) => {
          const value = batch.outputStates[row * ids.length + column]! < 2 ? batch.outputValues[row * ids.length + column]! : null;
          const direct = nativeValues![id];
          if (value === null || direct.availability !== "available" || typeof direct.value !== "number")
            throw new Error(`Audit exact output unavailable: ${id}`);
          maximumPresentationDifference = Math.max(maximumPresentationDifference, Math.abs(value - direct.value));
          maximumScaledPresentationError = Math.max(maximumScaledPresentationError, compareReplayNumbers(value, direct.value).maximumScaledError);
          return [id, value];
        }));
        const clock = { inputEpoch: batch.terminalFrame.inputEpoch, acceptedRevision: state.revision, acceptedTimeSec: target };
        adapterSamples.push({ ...clock, values });
        samples.push({ ...clock, values: Object.fromEntries(ids.map(id => [id, nativeValues![id].value as number])) });
      }
    }
    const model = composeStandardModelContractV1(exact.manifest, surface, resolveMainWireAnalysisMethodsForSurfaceV1(surface).capabilities).contract;
    const captured = await exact.executables.experimentCapture.captureAcceptedCandidate({ experimentId: "metric-audit", model,
      desiredContent: { modelId: model.modelId, surfaceSeriesId: surface.surfaceSeriesId,
        scenarios: [{ scenarioId: identity.scenarioId, label: "case", fixture: preset.capture.fixture }],
        surface: { graphPanes: [], outputPanes: [], controlPanes: [], note: { text: "" } } },
      correlation: { runtimeSessionId: identity.runtimeSessionId, scenarios: [{ scenarioId: identity.scenarioId, expectedInputEpoch: 0 }] } });
    const finalCapture = captured.content.scenarios[0]!.capture.checkpoint;
    // Capture shape is adapter-owned; callers cannot manufacture a native beat
    // that merely has a similar duration.
    const restoredAdapter = await Session.restore(finalCapture.payload, c.anatomyId, c.hemodynamicResearchInputs, 1, c.mechanismResearchInputs);
    const adapterBeat = restoredAdapter.observe().completedBeatMetrics, replayBeat = session.observe().completedBeatMetrics;
    if (adapterBeat === null || replayBeat === null) throw new Error("Audit completed beat unavailable");
    const { leftVentricularPressureVolumeLandmarks: adapterLvExtrema, rightVentricularPressureVolumeLandmarks: adapterRvExtrema, ...adapterCore } = adapterBeat;
    const { leftVentricularPressureVolumeLandmarks: replayLvExtrema, rightVentricularPressureVolumeLandmarks: replayRvExtrema, ...replayCore } = replayBeat;
    const adapterExtrema = { LV: adapterLvExtrema, RV: adapterRvExtrema }, replayExtrema = { LV: replayLvExtrema, RV: replayRvExtrema };
    completedBeatReplayComparison = compareReplayNumbers(adapterCore, replayCore);
    extremaLandmarkReplayComparison = { comparison: compareReplayNumbers(adapterExtrema, replayExtrema, false),
      adapter: adapterExtrema, replay: replayExtrema,
      interpretation: "Volume-extremum landmarks can select different points on an isovolumic plateau. Record their pressure/time differences separately; these are NOT the flow-closure landmarks used for timing and event-defined EF." };
  } finally { adapter.disposeSession(identity.runtimeSessionId); }

  const filling = fillingMetrics(samples);
  if (filling.source === null) throw new Error("No complete filling sequence in audit");
  // The filling method needs one more cycle to observe the FOLLOWING A wave.
  // Truncate only the timing input so its last complete beat is that same beat.
  const cycle = cycleMetrics(samples.filter(s => s.acceptedTimeSec <= filling.source!.atrialActivationTimeSec + .002));
  if (cycle.status !== "available") throw new Error("No matching Workbench timing beat");
  const matches = beats.filter(b => Math.abs(b.startTimeSec - cycle.source.cycleStartTimeSec) <= .002
    && Math.abs(b.endTimeSec - cycle.source.cycleEndTimeSec) <= .002);
  if (matches.length !== 1 || Math.abs(cycle.source.cycleStartTimeSec - filling.source.cycleStartTimeSec) > 1e-10)
    throw new Error("Audit requires one identical observed beat, including the following A wave");
  const beat = matches[0]!;
  const adapterFilling = fillingMetrics(adapterSamples);
  const adapterCycle = cycleMetrics(adapterSamples.filter(s => s.acceptedTimeSec <= filling.source!.atrialActivationTimeSec + .002));
  if (adapterCycle.status !== "available") throw new Error("Workbench replay timing unavailable");
  const analysisReplayComparison = { cycle: compareReplayNumbers(cycle.values, adapterCycle.values),
    filling: compareReplayNumbers(filling.values, adapterFilling.values) };
  const attempt = <T>(f: () => T) => {
    try { return { status: "available" as const, value: f() }; }
    catch (error) {
      if (!(error instanceof MainWireBaselineObservationUnavailableErrorV2)) throw error;
      return { status: "unavailable" as const, code: error.code, side: error.side, message: error.message };
    }
  };
  const timing = attempt(() => nativeTiming({ samples: nativeSamples, completedBeat: beat, side: "left" }));
  const inlet = attempt(() => nativeFilling({ samples: nativeSamples, completedBeat: beat }));
  const comparison = (metric: string, native: number | null, workbench: number | null, interpretation: string) =>
    ({ metric, native, workbench, difference: native === null || workbench === null ? null : workbench - native, interpretation });
  const comparisons = [
    comparison("LV ICT (ms)", timing.value?.timing.ictSec === undefined ? null : timing.value.timing.ictSec * 1000,
      cycle.values[cycleIds.leftVentricularIsovolumicContractionTimeMs], "native-event endpoints versus 2-ms presentation flow crossings"),
    comparison("LV IRT (ms)", timing.value?.timing.irtSec === undefined ? null : timing.value.timing.irtSec * 1000,
      cycle.values[cycleIds.leftVentricularIsovolumicRelaxationTimeMs], "native-event endpoints versus 2-ms presentation flow crossings"),
    comparison("LV Tei", timing.value?.timing.teiIndex ?? null, cycle.values[cycleIds.leftVentricularMyocardialPerformanceIndex], "ratio of each method's timing intervals"),
    comparison("AV ET (ms)", beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec * 1000,
      cycle.aorticEjection.positiveFlowDurationSec * 1000, "native integrated forward duration versus 2-ms presentation flow crossings"),
    comparison("MV E/A", inlet.value?.left.inletFlow.peakEToA ?? null, filling.values[fillingIds.mitralPeakEToA], "both volumetric; same E and following A, native versus 2-ms sampled peaks"),
    ...(["LV", "RV"] as const).flatMap(side => (["maximum", "minimum"] as const).map(direction => comparison(`${side} ${direction} dP/dt (mmHg/s)`,
      beat.ventricularAbsolutePressureRateExtrema[side][`${direction}MmHgPerSec`],
      cycle.values[`hemodynamics.pressure-rate.${direction}-windowed-10ms.absolute.${side}`],
      "different estimands: accepted-step extrema versus 10-ms secant extrema; no equality or normality gate"))),
  ];
  return { schemaId: "main-wire-workbench-same-beat-audit-v1", modelId: bundle.manifest.modelId, presetId: preset.presetId,
    checkpointSha256: preset.capture.checkpoint.payload.checkpointSha256,
    trajectory: { maximumPresentationDifference, maximumScaledPresentationError, nativeAcceptedSteps, adapterAcceptedSteps, presentationSamples: samples.length,
      completedBeatReplayComparison, extremaLandmarkReplayComparison, analysisReplayComparison, replayAbsoluteTolerance, replayRelativeTolerance,
      sampling: "same-native-replay-with-all-substeps-and-actual-adapter-2ms-times", bitwiseIdentityClaimed: false },
    beat: { startTimeSec: beat.startTimeSec, endTimeSec: beat.endTimeSec, endAtrialCaptureId: beat.endAtrialCaptureId },
    native: { timing, inlet, beat }, workbench: { cycle, filling }, actualAdapter: { cycle: adapterCycle, filling: adapterFilling }, comparisons,
    notes: ["DT and pulmonary venous metrics have no same-method legacy fitting comparator.",
      "Unavailable A/Ar durations remain unavailable; no synthetic zero crossing or substitution.",
      "This is measurement concordance, not clinical validation or a new physiological gate."],
    publicPromotionAuthorized: false, presentationSamples: samples, adapterPresentationSamples: adapterSamples, nativeSamples };
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" } } });
  if (!values.output) throw new Error("Usage: npm run audit:case-metrics -- --output NEW_DIRECTORY");
  selectHotPathIntegrityTierV1("hot-path-lean");
  const output = resolve(values.output); await mkdir(output);
  const snapshot = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const files: string[] = [];
  try {
    for (const [index, preset] of [bundle.baseline, ...bundle.presets].entries()) {
      const result = await auditMainWireWorkbenchMetricsV1(preset);
      const path = join(output, `${index === 0 ? "baseline" : "hfref"}.json`);
      await writeFile(path, JSON.stringify(result, null, 2) + "\n", { flag: "wx" }); files.push(path);
      process.stdout.write(JSON.stringify({ presetId: result.presetId, trajectory: result.trajectory, comparisons: result.comparisons,
        unavailableReasons: result.workbench.filling.unavailableReasons }) + "\n");
    }
  } finally { await snapshot.finish(files); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
