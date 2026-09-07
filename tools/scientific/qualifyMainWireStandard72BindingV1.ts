import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createMainWireFiveWallCoupledPredictorWorkspaceV1, checkpointMainWireFiveWallCoupledPredictorV1 } from "@/engine/vnext/coupled/MainWireFiveWallCoupledPredictorV1";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { canonicalJsonStringify } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { createMainWireIntegratedModelStandard71FixtureV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1 } from "@/domain/model/MainWireStandardIdentityV1";
import { runMainWireIntegratedModelRegularSinusAllOffCycleV3 as runCycle,
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3 as context,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MainWireIntegratedModelBeatAccumulatorV3, type MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { checkpointMainWireIntegratedModelStandardV2 } from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import { checkpointMainWireIntegratedModelStandard72V1 } from "@/engine/myocardium/MainWireIntegratedModelStandard72CheckpointV1";
import { MainWireIntegratedModelStandard72TypedAuthoritySessionV1 as Session } from "@/engine/vnext/MainWireIntegratedModelStandard72TypedAuthoritySessionV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3, type MainWireIntegratedModelPeriodicCycleObservationV3 as Observation } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1, completeMainWireStandard70TimingAndInletTraceV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { buildMainWireIntegratedModelStandard70BaselineChecksV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineValidationV1";
import { observeMainWireStandard70TimingAndInletV2 } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { assessMainWireProspectiveRestV1 } from "@/analysis/policies/mainWire/MainWireProspectiveBaselineAdmissionV1";
import { bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import { resolveBoundExecutionPlanUpdateScheduleV1, executionPlanTimeAtBaseTickV1,
  executionPlanBaseTickAtTimeV1 } from "@/runtime/executionPlan/BoundExecutionPlanV1";

// Local promotion bridge, not a generic certifier: start cold under71 and require
// exact physical replay against the already independently reviewed2ms evidence.
// Never import or re-label the research checkpoint. Does not publish a release.
const { values } = parseArgs({ options: { output: { type: "string" }, coarse: { type: "string" }, admission: { type: "string" } } });
if (!values.output || !values.coarse || !values.admission) throw new Error("--output NEW_DIR --coarse ADMITTED_2MS_RESULT --admission REVIEWED_ASSESSMENT");
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
const same = (a: unknown, b: unknown, label: string) => {
  if (canonicalJsonStringify(a) !== canonicalJsonStringify(b)) throw new Error(`Standard72 parity mismatch: ${label}`);
};
const coarseRaw = await readFile(values.coarse, "utf8"), admissionRaw = await readFile(values.admission, "utf8");
const coarse = JSON.parse(coarseRaw), admission = JSON.parse(admissionRaw);
if (hash(coarseRaw) !== "1ffa46eb77e5325622feda2321298b48ee3de4c2f52c8210e084c0a28a20c1a4"
  || hash(admissionRaw) !== "76f38faf7e685f1447eed6f825452ce5b35c9acf8bffe786a56c913a4f493bf7"
  || admission.status !== "eligible-for-exact-model-promotion"
  || !admission.sources.some((s: { sha256: string; nominalDtSec: number }) => s.sha256 === hash(coarseRaw) && s.nominalDtSec === .002)) {
  throw new Error("Reviewed coarse result and prospective assessment required");
}
selectHotPathIntegrityTierV1("hot-path-lean");
const started = performance.now(), fixture = createMainWireIntegratedModelStandard71FixtureV1();
same(fixture.hemodynamicResearchInputs, coarse.construction.hemodynamicResearchInputs, "hemodynamics");
same(fixture.mechanismResearchInputs, coarse.construction.mechanismResearchInputs, "mechanism inputs");
same(fixture.runtime, coarse.construction.runtime, "vascular/respiratory construction");
let accepted = fixture.cold.acceptedState, beat: Beat | null = null;
let trace: readonly Sample[] = [];
const accumulator = new MainWireIntegratedModelBeatAccumulatorV3(), boundaries = [accepted], observations: Observation[] = [];
const classifierOptions = { period1NormalizedTolerance: policy.period1NormalizedTolerance,
  period2NormalizedTolerance: policy.period2NormalizedTolerance, period2MinimumPeriod1NormalizedDelta: policy.period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles: policy.consecutiveCycles };
let classification = classifyMainWireIntegratedModelPeriodicityV3([], classifierOptions), cycles = 0;
for (let cycle = 1; cycle <= policy.maximumCycleCount; cycle++) {
  const run = runCycle(fixture, accepted, cycle, .002, step => { beat = accumulator.accept(step) ?? beat; });
  accepted = run.terminalAcceptedState;
  const period1 = compareMainWireIntegratedModelAcceptedStatesV3(accepted, boundaries.at(-1)!, scales, fixture.config);
  const period2 = boundaries.length < 2 ? null : compareMainWireIntegratedModelAcceptedStatesV3(accepted, boundaries.at(-2)!, scales, fixture.config);
  observations.push({ cycleIndex: cycle, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: hash(coarseRaw), period1, period2 });
  classification = classifyMainWireIntegratedModelPeriodicityV3(observations, classifierOptions);
  if (observations.length > policy.consecutiveCycles) observations.shift();
  if (!run.allDynamicMcsAcceptedFlowsExactlyZero || !run.oneComposedCalciumOwnerOnly
    || run.maximumGlobalTotalBloodVolumeErrorMl > 1e-8 || run.maximumCoronaryBloodVolumeLedgerResidualMl > 1e-8) {
    throw new Error("Standard72 cold run violates conservation or owner invariants");
  }
  trace = run.traceSamples; boundaries.push(accepted); if (boundaries.length > 3) boundaries.shift(); cycles = cycle;
  if (cycle % 10 === 0) process.stderr.write(`Standard72 cold: cycle ${cycle}, residual ${period1.overall.maximumNormalizedDelta}\n`);
  if (classification.status !== "not-converged") break;
}
if (classification.status !== "period1-converged" || beat === null) throw new Error("Standard72 requires its own settled complete beat");
same(cycles, coarse.completedCycleCount, "cold settling cycles");
same(trace, coarse.terminalTrace, "entire settled terminal trace");
same(beat, coarse.completedBeat, "all completed-beat exact outputs");
const timing = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace: trace, completedBeatEndTimeSec: (beat as Beat).endTimeSec,
  runLookaheadCycle: () => runCycle(fixture, accepted, cycles + 1, .002).traceSamples });
same(timing.timingAndInletTrace, coarse.timingAndInletTrace, "native-event observation window");
const measurements = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ terminalTrace: trace, completedBeat: beat,
  ...timing, timingAndInletObserver: observeMainWireStandard70TimingAndInletV2 });
const rest = assessMainWireProspectiveRestV1(beat, buildMainWireIntegratedModelStandard70BaselineChecksV1(measurements, true),
  measurements.cardiacSizeAndFunction.bodySurfaceAreaM2);
if (rest.status !== "passed") throw new Error("Standard72 fresh rest admission failed");
const base = await checkpointMainWireIntegratedModelStandardV2({ ...context(fixture), mechanismResearchInputs: fixture.mechanismResearchInputs },
  accepted, accumulator, beat);
// runCycle uses the public model transaction, which has no extrapolation
// predictor. This explicitly captured empty workspace records that numerical
// path; it is not an inferred upgrade of a71/research checkpoint.
const predictor = checkpointMainWireFiveWallCoupledPredictorV1(createMainWireFiveWallCoupledPredictorWorkspaceV1());
const checkpoint = await checkpointMainWireIntegratedModelStandard72V1(fixture.standard71AssemblyId, base, predictor);
const restored = await Session.restoreStandard72ExactCheckpoint(checkpoint);
same(await restored.checkpointStandard72Exact(), checkpoint, "own checkpoint roundtrip");
same(restored.observe().completedBeatMetrics, beat, "restored exact outputs");
const schedule = resolveBoundExecutionPlanUpdateScheduleV1(bindMainWireIntegratedStudioSelectedAorticOutflowExecutionPlanV1());
const launchTimeSec = executionPlanTimeAtBaseTickV1(schedule, Math.ceil(checkpoint.acceptedTimeSec / schedule.baseTickSec));
const launchAdvance = restored.advanceStructuralAnalysisToPresentationTimeV1(launchTimeSec);
if (launchAdvance.status !== "advanced" || launchTimeSec - checkpoint.acceptedTimeSec > .002) throw new Error("Standard72 launch needs one bounded real grid-alignment advance");
executionPlanBaseTickAtTimeV1(schedule, restored.currentAcceptedState().acceptedTimeSec);
const launchCheckpoint = await restored.checkpointStandard72Exact();
same(restored.observe().completedBeatMetrics, beat, "launch complete beat unchanged");
same(await (await Session.restoreStandard72ExactCheckpoint(launchCheckpoint)).checkpointStandard72Exact(), launchCheckpoint, "launch roundtrip");
const output = resolve(values.output);
await mkdir(output, { recursive: false });
const report = { schemaId: "main-wire-standard72-local-binding-evidence-v1", modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD72_MODEL_ID_V1,
  status: "cold-replay-and-checkpoint-parity-passed", clinicalNormalityClaimed: false, published: false,
  initialization: "own-standard72-reference-cold",
  solverPath: "public-model-transaction-without-history-predictor",
  physicalFixtureId: fixture.standard71AssemblyId, priorCheckpointImported: false,
  nominalDtSec: .002, cycles, classification,
  checkpoint: { checkpointId: checkpoint.checkpointId, acceptedTimeSec: checkpoint.acceptedTimeSec, revision: checkpoint.revision, checkpointSha256: checkpoint.checkpointSha256 },
  launchPreparation: { sourceCheckpointSha256: checkpoint.checkpointSha256, sourceAcceptedTimeSec: checkpoint.acceptedTimeSec,
    targetCheckpointSha256: launchCheckpoint.checkpointSha256, targetAcceptedTimeSec: launchCheckpoint.acceptedTimeSec,
    targetRevision: launchCheckpoint.revision, advancedDurationSec: launchTimeSec - checkpoint.acceptedTimeSec,
    baseTickSec: schedule.baseTickSec, completedBeatUnchanged: true },
  sources: { coarse: { path: values.coarse, sha256: hash(coarseRaw) }, admission: { path: values.admission, sha256: hash(admissionRaw) } },
  parity: { terminalTrace: "exact", completedBeat: "exact", nativeEventWindow: "exact", checkpointRoundtrip: "exact" },
  rest, referenceFlags: admission.referenceFlags,
  inheritedQualification: "Fine-step pressure-rate and preload-reserve evidence belongs to the reviewed identical physical research construction; not a new72 fine/reserve run. Live adapter/analysis parity remains separate.",
  wallTimeMs: performance.now() - started };
await writeFile(resolve(output, "checkpoint.json"), JSON.stringify(checkpoint, null, 2) + "\n", { flag: "wx" });
await writeFile(resolve(output, "launch-checkpoint.json"), JSON.stringify(launchCheckpoint, null, 2) + "\n", { flag: "wx" });
await writeFile(resolve(output, "binding-evidence.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
process.stdout.write(JSON.stringify({ status: report.status, cycles, seconds: report.wallTimeMs / 1000, checkpointSha256: checkpoint.checkpointSha256, output }) + "\n");
