import { execFileSync, spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { canonicalJsonStringify } from "@/engine/integrity";
import baseline from "@/data/model-baselines/standard70-launch-baseline.json";
import { createMainWireBaselineReferenceResearchV1 } from "@/engine/myocardium/experiments/MainWireBaselineReferenceResearchV1";
import { createMainWirePopulationMomentResearchV1, populationMomentResearchCheckpointContextV1 } from "@/engine/myocardium/experiments/MainWirePopulationMomentResearchV1";
import { comparePopulationMomentPeriodicDiagnosticsV1 } from "@/engine/myocardium/experiments/PopulationMomentPeriodicDiagnosticsV1";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3, runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  type MainWireIntegratedModelCycleFixtureV3, type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import type { MainWireIntegratedModelAcceptedStateV3 as Accepted } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { checkpointMainWireIntegratedModelV3, restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3 } from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import { MainWireIntegratedModelBeatAccumulatorV3, type MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { completeMainWireStandard70TimingAndInletTraceV1,
  measureMainWireIntegratedModelStandard70CandidateEvidenceV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { measureMainWireEjectionShapeDiagnosticsV1 } from "@/analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import type { MainWireIntegratedModelMechanismResearchInputsV3 } from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";

const { values } = parseArgs({ options: { output: { type: "string" }, job: { type: "string" },
  "max-cycles": { type: "string", default: "250" } } });
const maxCycles = Number(values["max-cycles"]);
if (!values.output || !Number.isSafeInteger(maxCycles) || maxCycles < 3 || maxCycles > 250) {
  throw new Error("--output NEW_DIRECTORY [--max-cycles 3..250]");
}
selectHotPathIntegrityTierV1("hot-path-lean");
const output = resolve(values.output), sha = (s: string) => createHash("sha256").update(s).digest("hex");
const write = (file: string, data: unknown) => writeFile(file, JSON.stringify(data,
  (_key, value) => ArrayBuffer.isView(value) ? Array.from(value as unknown as number[]) : value, 2) + "\n", { flag: "wx" });
const base = baseline.candidateInputs;
// Prespecified source-rate contrast: restore source primitives, remove the
// selected added bridge exit, hold every nonmaterial input matched.
const request = {
  hemodynamicResearchInputs: { ...base.hemodynamicResearchInputs, heartRateBpm: 70, totalBloodVolumeMl: 5200, systemicResistance: 1.1 },
  mechanismResearchInputs: { ...base.mechanismResearchInputs, chamberMechanics: { ...base.mechanismResearchInputs.chamberMechanics,
    activeTensionScaleByWall: { ...base.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall, LVFW: 1, SEP: 1, RVFW: 1 },
    passiveStiffnessScaleByWall: { ...base.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall, LVFW: 1.248, SEP: 1.248, RVFW: 1.248 },
  } } as MainWireIntegratedModelMechanismResearchInputsV3,
  parameters: { ventricularTrefPa: 120000, systemicArterialComplianceScale: .6 }, admissionRole: "intervention" as const,
  aorticRootInertanceScale: 0 as const, ventricularCalciumTimeScale: 1.1, ventricularAeff: 25 as const,
  ventricularLandSlackStretch: 1.06 as const, ventricularKineticRestoration: "both" as const, ventricularBridgeExit: "none" as const,
};
const jobs = (["source-land", "moment-phi"] as const).flatMap(law => [.002, .001].map(dt => ({ id: `${law}-${dt * 1000}ms`, law, dt })));
type Job = typeof jobs[number];

async function run<T>(job: Job, fixture: MainWireIntegratedModelCycleFixtureV3<T> & { cold: { acceptedState: Accepted<T> } },
  construction: unknown, context: MainWireIntegratedModelCheckpointContextV3<T>,
  compare: (a: Accepted<T>, b: Accepted<T>) => { maximumNormalizedDelta: number; worstPath: string | null }) {
  const started = performance.now(), accumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  let accepted = fixture.cold.acceptedState, beat: Beat | null = null, trace: readonly Sample[] = [];
  const boundaries = [accepted], cycleEvidence = [];
  let p1Count = 0, p2Count = 0, status = "nonsettled";
  try {
    for (let cycle = 1; cycle <= maxCycles; cycle++) {
      const r = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, accepted, cycle, job.dt, s => { beat = accumulator.accept(s) ?? beat; });
      accepted = r.terminalAcceptedState; trace = r.traceSamples;
      const p1 = compare(accepted, boundaries.at(-1)!);
      const p2 = boundaries.length < 2 ? null : compare(accepted, boundaries.at(-2)!);
      p1Count = p1.maximumNormalizedDelta <= policy.period1NormalizedTolerance ? p1Count + 1 : 0;
      p2Count = p2 !== null && p1.maximumNormalizedDelta >= policy.period2MinimumPeriod1NormalizedDelta
        && p2.maximumNormalizedDelta <= policy.period2NormalizedTolerance ? p2Count + 1 : 0;
      cycleEvidence.push({ cycle, p1, p2, totalBloodVolumeErrorMl: r.maximumGlobalTotalBloodVolumeErrorMl,
        coronaryLedgerErrorMl: r.maximumCoronaryBloodVolumeLedgerResidualMl,
        exactCalciumOwner: r.oneComposedCalciumOwnerOnly, allOff: r.allDynamicMcsAcceptedFlowsExactlyZero });
      boundaries.push(accepted); if (boundaries.length > 2) boundaries.shift();
      if (cycle % 20 === 0) process.stdout.write(`${job.id}: cycle ${cycle}; closure ${p1.maximumNormalizedDelta.toExponential(2)}; ${((performance.now() - started) / 1000).toFixed(1)}s\n`);
      if (p1Count >= policy.consecutiveCycles) { status = "research-period1-converged"; break; }
      if (p2Count >= policy.consecutiveCycles) { status = "period2-suspect"; break; }
    }
    if (beat === null) throw new Error("no complete own beat");
    const timing = completeMainWireStandard70TimingAndInletTraceV1({ terminalTrace: trace, completedBeatEndTimeSec: beat.endTimeSec,
      runLookaheadCycle: () => runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, accepted, cycleEvidence.length + 1, job.dt).traceSamples });
    const measurements = measureMainWireIntegratedModelStandard70CandidateEvidenceV1({ terminalTrace: trace, completedBeat: beat,
      ...timing, timingAndInletObserver: observeMainWireStandard70TimingAndInletV2 });
    let ejectionShape: unknown;
    try { ejectionShape = { status: "measured", ...measureMainWireEjectionShapeDiagnosticsV1(trace) }; }
    catch (error) { ejectionShape = { status: "unavailable", error: String(error) }; }
    const checkpoint = await checkpointMainWireIntegratedModelV3(context, accepted);
    const restored = await restoreMainWireIntegratedModelV3(context, checkpoint);
    // Object insertion order is not checkpoint semantics. Compare every
    // canonical field, including the nested/outer integrity hashes.
    if (canonicalJsonStringify(checkpoint) !== canonicalJsonStringify(await checkpointMainWireIntegratedModelV3(context, restored))) {
      throw new Error("research exact checkpoint roundtrip mismatch");
    }
    // One diagnostic replay only; do not allocate material ledgers during settlement.
    const materialSamples: unknown[] = [];
    const replay = runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, restored, cycleEvidence.length + 1, job.dt, s => {
      materialSamples.push({ acceptedTimeSec: s.acceptedState.acceptedTimeSec,
        materialState: fixture.provider.stateCodec.encode(s.acceptedState.coronary.mechanics.materialState),
        mechanicsReadback: s.coronaryStep.baseStep.mechanicsTrial.diagnostics.readback });
    });
    const replayClosure = compare(replay.terminalAcceptedState, accepted);
    if (status === "research-period1-converged" && replayClosure.maximumNormalizedDelta > policy.period1NormalizedTolerance) {
      throw new Error("material replay left periodic tolerance");
    }
    return { job, request, construction, status, initialization: "own-cold-equilibrium", policy,
      baselineAdopted: false, publishedIdentityMinted: false, publishedModelQualificationClaimed: false,
      cycles: cycleEvidence.length, wallTimeMs: performance.now() - started, measurements, completedBeat: beat,
      ejectionShape, cycleEvidence, terminalTrace: trace, ...timing,
      researchCheckpoint: checkpoint, checkpointExactRoundtripVerified: true,
      materialReplay: { closure: replayClosure, trace: replay.traceSamples, samples: materialSamples },
      preloadAndAfterloadTestsPerformed: false };
  } catch (error) {
    return { job, request, construction, status: "numerical-or-observation-unresolved", previousStatus: status,
      error: error instanceof Error ? error.message : String(error),
      cycles: cycleEvidence.length, wallTimeMs: performance.now() - started, cycleEvidence, completedBeat: beat,
      terminalTrace: trace, baselineAdopted: false, publishedIdentityMinted: false };
  }
}

async function evaluate(job: Job) {
  const f = job.law === "source-land" ? createMainWireBaselineReferenceResearchV1(request) : createMainWirePopulationMomentResearchV1(request);
  const construction = { id: f.researchConstructionId, identity: f.researchParameterIdentity,
    providerIdentity: f.provider.parameterIdentityHash, landParameters: f.researchLandParameters,
    landSlackStretch: f.researchLandSlackStretch, calcium: f.coronaryStepInput.calciumDriveParams,
    runtime: f.runtime, claim: f.researchClaim };
  // Keep generic state types separate; never cast a moment state as executable Land.
  if ("researchRecovery" in f) return run(job, f, construction, populationMomentResearchCheckpointContextV1(f),
    (a, b) => comparePopulationMomentPeriodicDiagnosticsV1(a, b, f.config));
  return run(job, f, construction, createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(f),
    (a, b) => compareMainWireIntegratedModelAcceptedStatesV3(a, b, scales, f.config).overall);
}

if (values.job) {
  const job = jobs.find(j => j.id === values.job);
  if (!job) throw new Error("unknown prespecified contrast job");
  const result = await evaluate(job).catch(error => ({ job, status: "initialization-rejected", cycles: 0,
    wallTimeMs: 0, error: String(error) }));
  await write(output, result);
  process.stdout.write(`${job.id}: ${result.status}; ${result.cycles} cycles; ${(result.wallTimeMs / 1000).toFixed(1)}s\n`);
} else {
  await mkdir(output);
  const paths = ["tools/scientific/runMainWirePopulationMomentContrastV1.ts", "engine/myocardium/experiments/LandPopulationMomentResearchV1.ts",
    "engine/myocardium/experiments/LandPopulationMomentTangentResearchV1.ts", "engine/myocardium/experiments/PopulationMomentWallResearchV1.ts",
    "engine/myocardium/experiments/MainWirePopulationMomentResearchV1.ts", "engine/myocardium/experiments/PopulationMomentPeriodicDiagnosticsV1.ts",
    "engine/myocardium/experiments/MainWireBaselineReferenceResearchV1.ts", "engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts",
    "engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1.ts", "engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1.ts",
    "engine/myocardium/MainWireIntegratedModelBeatMetricsV3.ts", "engine/coronary/mainWireMechanicsCouplingV1.ts",
    "engine/core/circulationGraphKernelV1.ts", "engine/core/nonCoronaryCirculationBackwardEulerV1.ts",
    "engine/myocardium/myofilament/land2017/parameterSets.ts", "data/model-baselines/standard70-launch-baseline.json",
    "analysis/methods/mainWire/MainWireEjectionShapeDiagnosticsV1.ts", "analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2.ts"];
  const sources = Object.fromEntries(await Promise.all(paths.map(async p => [p, await readFile(p, "utf8")] as const)));
  await write(`${output}/source-snapshot.json`, sources);
  await writeFile(`${output}/working-tree.diff`, execFileSync("git", ["diff", "HEAD"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }), { flag: "wx" });
  await write(`${output}/protocol.json`, { jobs, request, maxCycles, policy, scales, tier: "hot-path-lean",
    hypothesis: "Does replacing steady-population mean-distortion recovery with actual-turnover population moments retain source force while improving coupled timing/shape?",
    interpretation: "prespecified matched research contrast; no fitting; no normality threshold changes; source-phi is phenomenological, not an exact PDE/chemical-energy closure",
    metrics: "existing exact accepted-beat metrics and pinned timing/inlet observer; AV gradient is forward-flow LV-Ao NODE difference, not Doppler or pressure-recovered catheter gradient",
    checkpointScope: "own exact construction and own wall codecs; never public Standard70", initialization: "cold for all four jobs",
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    sources: Object.fromEntries(Object.entries(sources).map(([p, s]) => [p, sha(s)])), baselineAdoption: false });
  const started = performance.now();
  const exits = await Promise.all(jobs.map(job => new Promise((res, rej) => {
    const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script", resolve("tools/scientific/runMainWirePopulationMomentContrastV1.ts"),
      "--output", `${output}/${job.id}.json`, "--job", job.id, "--max-cycles", String(maxCycles)], { stdio: "inherit" });
    child.on("error", rej); child.on("exit", code => res({ job: job.id, code }));
  })));
  await write(`${output}/execution.json`, { exits, wallTimeMs: performance.now() - started });
}
