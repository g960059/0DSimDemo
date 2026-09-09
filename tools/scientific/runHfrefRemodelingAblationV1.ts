import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { createMainWireIntegratedModelStandard71FixtureV1 as baseFixture,
  MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as material } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { prepareMainWireIntegratedModelFixtureInputsV3 as prepare,
  assembleMainWireIntegratedModelRegularSinusAllOffFixtureV3 as assemble } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { createMaterialKernelsWithMechanicsResearchInputsV1 as kernels,
  fingerprintNormalAdultFiveWallMaterialStateCanonicalV1 as fingerprint } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 as prior } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { createMainWireFiveWallLandTriSegProviderV1 as provider } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 as coldIterations } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { MainWireIntegratedTypedAuthoritySessionV1 as BaseSession } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { collectMainWireStandard72FittingCycleV1 as collect } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 as compare } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify,
  type MainWireIntegratedModelPeriodicCycleObservationV3 as Cycle } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { completeMainWireStandard70TimingAndInletTraceV1 as completeTiming,
  measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { readMainWireHfrefBeatV1 as readBeat, observeMainWireHfrefTimingContextV1 as timingContext } from "@/analysis/methods/mainWire/MainWireHfrefObservationV1";
import { observeMainWireStandard70TimingAndInletV2 as timingObserver } from "@/analysis/methods/mainWire/MainWireStandard70BaselineAssessmentV2";
import { measureMainWireRelaxationTauV1 as measureTau } from "@/analysis/methods/mainWire/MainWireRelaxationTauV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { evaluateTriSegGeometryV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { evaluateMainWireCommonPericardiumBindingV1 as evaluatePericardium } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import { validateAndOwnMainWireIntegratedModelHemodynamicResearchInputsV3 as ownHemodynamics } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

// Research-only static geometry: no growth law, public parameter, exact-model
// identity, clinical threshold or checkpoint interchange is introduced here.
type Point = Readonly<{ active: number; referenceArea: number; wallVolume: number }>;
type HemodynamicCondition = Readonly<{ totalBloodVolumeMl: number; systemicResistance: number }>;
type MechanisticControl = Readonly<{ pericardiumMode: "exact-off" }>;
const protocol = "hfref-static-lv-septal-remodeling-fixed-coronary-bed-v2";
const fitProtocol = "hfref-static-lv-septal-remodeling-fixed-geometry-hemodynamics-v1";
const releaseProtocol = "hfref-static-lv-septal-remodeling-pericardial-release-control-v1";
const options = { period1NormalizedTolerance: policy.period1NormalizedTolerance,
  period2NormalizedTolerance: policy.period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta: policy.period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles: policy.consecutiveCycles };

function validatePoint(point: Point) {
  if (Object.keys(point).sort().join() !== "active,referenceArea,wallVolume"
    || ![1, .35].includes(point.active) || ![1, 1.15].includes(point.referenceArea)
    || ![1, 1.25].includes(point.wallVolume)) throw new Error("Point is outside the preregistered factorial");
}

export async function createHfrefRemodelingResearchFixtureV1(point: Point, condition?: HemodynamicCondition,
  control?: MechanisticControl) {
  validatePoint(point);
  if (condition !== undefined && (condition === null || typeof condition !== "object"
    || Object.keys(condition).sort().join() !== "systemicResistance,totalBloodVolumeMl")) {
    throw new Error("Research hemodynamic condition must contain exactly TBV and systemic resistance");
  }
  if (control !== undefined && (control === null || typeof control !== "object"
    || Object.keys(control).join() !== "pericardiumMode" || control.pericardiumMode !== "exact-off")) {
    throw new Error("Only the explicit pericardial-release mechanistic control is supported");
  }
  const constructionProtocol = control !== undefined ? releaseProtocol : condition === undefined ? protocol : fitProtocol;
  const source = seed.candidateInputs, m = source.mechanismResearchInputs;
  const mechanism = { ...m, chamberMechanics: { ...m.chamberMechanics,
    activeTensionScaleByWall: { ...m.chamberMechanics.activeTensionScaleByWall, LVFW: point.active, SEP: point.active } } };
  const candidate = { ...source, mechanismResearchInputs: mechanism,
    hemodynamicResearchInputs: condition === undefined ? source.hemodynamicResearchInputs
      : ownHemodynamics({ ...source.hemodynamicResearchInputs, ...condition }) };
  const base = baseFixture(candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale, mechanism);
  const constructionSha256 = await sha256CanonicalJsonHex({ protocol: constructionProtocol, point, candidate,
    ...(control === undefined ? {} : { control }) });
  const prepared = prepare(candidate.hemodynamicResearchInputs, candidate.ventricularContractilityScale, mechanism);
  const geometry = prior.anatomy.triSeg, walls = geometry.wallGeometryParameters;
  const resize = (id: "LVFW" | "SEP") => ({ ...walls[id],
    referenceMidwallAreaM2: walls[id].referenceMidwallAreaM2 * point.referenceArea,
    wallMaterialVolumeM3: walls[id].wallMaterialVolumeM3 * point.wallVolume });
  const atrium = (id: "LA" | "RA") => ({ wallMaterialVolumeM3: prior.anatomy.atria[id].wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3: prior.anatomy.atria[id].inverseUnloadedReferenceCavityVolumeMl * 1e-6 });
  const trisegWalls = { ...walls, LVFW: resize("LVFW"), SEP: resize("SEP") };
  const anatomicalPericardium = point.wallVolume === 1 ? base.pericardium : Object.freeze({ ...base.pericardium,
    parameterSetId: `${constructionProtocol}-${constructionSha256}-actual-wall-occupancy`,
    wallMaterialVolumesM3: Object.freeze([atrium("LA").wallMaterialVolumeM3,
      trisegWalls.LVFW.wallMaterialVolumeM3, trisegWalls.SEP.wallMaterialVolumeM3,
      trisegWalls.RVFW.wallMaterialVolumeM3, atrium("RA").wallMaterialVolumeM3] as const) });
  // Remove pressure, energy and stiffness through the existing exact binding,
  // not by subtracting an output pressure. Anatomy and nominal bag parameters
  // remain recorded; this is not an alternative chronic-disease preset.
  const pericardium = control === undefined ? anatomicalPericardium : Object.freeze({ ...anatomicalPericardium,
    parameterSetId: `${constructionProtocol}-${constructionSha256}-released`, mode: "exact-off" as const });
  const currentMechanicalWallMassG = Object.fromEntries(Object.entries(trisegWalls)
    .map(([id, wall]) => [id, wall.wallMaterialVolumeM3 * prior.myocardialDensityKgPerM3 * 1000]));
  const construction = { trisegWalls, pericardium, currentMechanicalWallMassG,
    coronary: { interpretation: "fixed-baseline-reference-bed-and-flow-demand-NOT-current-anatomical-mass",
      referenceBedWallMassG: base.coronaryStepInput.coronaryPrior.construction.perfusedMyocardialMass.wallMassG,
      perGramPerfusionQualified: false, coronaryRemodelingClaimed: false } };
  const providerParameters = {
    parameterSetId: `${constructionProtocol}-${constructionSha256}`,
    materialByWall: kernels(prepared.chamberMechanics, material, coldIterations),
    atria: { LA: atrium("LA"), RA: atrium("RA") }, trisegWalls,
    initialTriSegCoordinates: geometry.loadedCoordinates,
    internalCoordinateScales: { septalMidwallCapVolumeM3: Math.abs(geometry.loadedCoordinates.septalMidwallCapVolumeM3),
      junctionRadiusM: geometry.loadedCoordinates.junctionRadiusM },
    fingerprintMaterialStateCanonicalV1: fingerprint,
  };
  const fixture = assemble(prepared, {
    createProvider: () => point.referenceArea === 1 && point.wallVolume === 1 ? base.provider
      : provider(providerParameters),
    createVascularRuntime: () => base.runtime.vascular,
    createCalciumDriveParams: () => base.coronaryStepInput.calciumDriveParams,
    createRhythm: () => base.rhythm,
    createPericardium: () => pericardium,
  });
  if (fixture.coronaryStepInput.pericardium !== pericardium
    || pericardium.wallMaterialVolumesM3[1] !== trisegWalls.LVFW.wallMaterialVolumeM3
    || pericardium.wallMaterialVolumesM3[2] !== trisegWalls.SEP.wallMaterialVolumeM3
    || canonicalJsonStringify(pericardium.parameters) !== canonicalJsonStringify(base.pericardium.parameters)) {
    throw new Error("Research wall occupancy or fixed pericardial capacity binding is inconsistent");
  }
  if (control === undefined && point.referenceArea === 1 && point.wallVolume === 1
    && !isDeepStrictEqual(fixture.cold.acceptedState, base.cold.acceptedState)) {
    throw new Error("Research assembly does not reproduce the unmodified production cold control");
  }
  return { fixture, candidate, constructionSha256, construction, providerParameters, protocol: constructionProtocol };
}

class ResearchSession extends BaseSession {
  constructor(fixture: Awaited<ReturnType<typeof createHfrefRemodelingResearchFixtureV1>>["fixture"]) {
    // Same source topology adapter used by the production typed sessions. This
    // research subclass never exports/restores a Standard72 checkpoint.
    super(fixture as unknown as MainWireIntegratedModelRuntimeV3, fixture.cold.acceptedState, "cold", null);
  }
}

export async function runHfrefRemodelingConditionV1(point: Point, dt: .002 | .001, condition?: HemodynamicCondition,
  control?: MechanisticControl) {
  const started = performance.now(); let phase = "construction";
  const runProtocol = control !== undefined ? releaseProtocol : condition === undefined ? protocol : fitProtocol;
  try {
    if (![.002, .001].includes(dt)) throw new Error("Unsupported time step");
    const { fixture, candidate, constructionSha256, construction } = await createHfrefRemodelingResearchFixtureV1(point, condition, control);
    const session = new ResearchSession(fixture), initial = session.currentAcceptedState();
    const boundaries = [initial], observations: Cycle[] = [];
    const cycleEvidence = [];
    let classification = classify(observations, options), terminalTrace: ReturnType<typeof collect> = [];
    let cycles = 0;
    phase = "periodic-settling";
    for (let i = 1; i <= policy.maximumCycleCount; i++) {
      terminalTrace = collect(session, fixture, i, dt);
      const accepted = session.currentAcceptedState(), previous = boundaries.at(-1)!;
      const atrial = accepted.composedRhythm.acceptedAtrialCaptureCount - previous.composedRhythm.acceptedAtrialCaptureCount;
      const ventricular = accepted.composedRhythm.acceptedVentricularCaptureCount - previous.composedRhythm.acceptedVentricularCaptureCount;
      if (atrial !== 1 || ventricular !== 1) throw new Error("Non-sinus capture sequence");
      cycleEvidence.push({ cycle: i, steps: terminalTrace.length,
        maxGlobalVolumeErrorMl: Math.max(...terminalTrace.map(s => s.numerical.globalVolumeErrorMl)),
        maxCoronaryLedgerErrorMl: Math.max(...terminalTrace.map(s => s.numerical.coronaryLedgerErrorMl)) });
      observations.push({ cycleIndex: i, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: constructionSha256,
        period1: compare(accepted, previous, scales, fixture.config),
        period2: boundaries.length < 2 ? null : compare(accepted, boundaries.at(-2)!, scales, fixture.config) });
      classification = classify(observations, options);
      if (observations.length > policy.consecutiveCycles) observations.shift();
      boundaries.push(accepted); if (boundaries.length > 3) boundaries.shift();
      cycles = i;
      if (classification.status !== "not-converged") break;
      if (performance.now() - started > 300_000) throw new Error("Research case exceeded five-minute wall-time bound");
    }
    if (classification.status !== "period1-converged") throw new Error(`No period-1 closure: ${classification.status}`);
    // Collect expensive geometry/readback diagnostics only for one settled beat.
    const mechanicsTrace: unknown[] = [];
    const preAudit = session.currentAcceptedState();
    phase = "settled-mechanics-audit";
    terminalTrace = collect({ currentAcceptedState: session.currentAcceptedState.bind(session),
      advanceToPresentationTimeWithSelectedOutputProjectionV1: session.advanceToPresentationTimeWithSelectedOutputProjectionV1.bind(session),
      observe: () => {
        const observed = session.observe(), state = observed.acceptedState.coronary;
        mechanicsTrace.push({ acceptedTimeSec: observed.acceptedState.acceptedTimeSec,
          geometry: evaluateTriSegGeometryV1({ leftVentricularCavityVolumeM3: state.circulation.nodeVolumesMl.LV * 1e-6,
            rightVentricularCavityVolumeM3: state.circulation.nodeVolumesMl.RV * 1e-6,
            coordinates: state.mechanics.materialState.trisegCoordinates, walls: construction.trisegWalls }),
          pericardium: evaluatePericardium(fixture.pericardium, state.mechanics.acceptedVolumesMl),
          // The lean projection path intentionally omits the rich mechanics
          // trial. Do not substitute zero residuals or rerun a different solver.
          generalizedForceResidual: null, residualStatus: "not-exposed-by-lean-accepted-observation" });
        return observed;
      } }, fixture, cycles + 1, dt);
    const acceptedState = session.currentAcceptedState(), completedBeat = session.observe().completedBeatMetrics;
    const auditClosure = compare(acceptedState, preAudit, scales, fixture.config);
    const auditClassification = classify([...observations.slice(1), { cycleIndex: cycles + 1,
      evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: constructionSha256,
      period1: auditClosure, period2: compare(acceptedState, boundaries.at(-2)!, scales, fixture.config) }], options);
    if (auditClassification.status !== "period1-converged") throw new Error("Settled audit cycle lost period-1 closure");
    cycles++;
    if (!completedBeat || completedBeat.endTimeSec <= initial.acceptedTimeSec) throw new Error("No fresh complete beat");
    phase = "observation";
    const timing = completeTiming({ terminalTrace, completedBeatEndTimeSec: completedBeat.endTimeSec,
      runLookaheadCycle: () => collect(session, fixture, cycles + 1, dt) });
    const raw = readBeat(completedBeat), context = timingContext(timing.timingAndInletTrace ?? terminalTrace, completedBeat);
    const observation = context.observation;
    const tau = observation ? measureTau(timing.timingAndInletTrace ?? terminalTrace, observation.left.events) : null;
    const morphology = observation ? measure({ completedBeat, terminalTrace, ...timing, timingAndInletObserver: timingObserver }) : null;
    return { protocol: runProtocol, point, dt, status: "observed" as const, constructionSha256, construction, candidate, cycles, classification,
      mechanicsTrace, auditClosure, auditClassification,
      cycleEvidence, terminalPeriodicObservations: observations, wallTimeMs: performance.now() - started,
      values: { ...raw.values, etMs: completedBeat.valveForwardPressureGradients.AoV.forwardFlowDurationSec * 1000,
        ictMs: observation ? observation.left.timing.ictSec * 1000 : null,
        irtMs: observation ? observation.left.timing.irtSec * 1000 : null,
        tei: observation?.left.timing.teiIndex ?? null, flowEToA: observation?.left.inletFlow.peakEToA ?? null,
        weissTauMs: tau?.status === "measured" ? tau.weiss?.tauMs ?? null : null,
        glantzTauMs: tau?.sensitivityStatus === "measured" ? tau.glantz?.tauMs ?? null : null },
      context, tau, morphology, completedBeat, terminalTrace, ...timing,
      acceptedStateResearchOnly: acceptedState, publicCheckpointExported: false, presetQualified: false };
  } catch (error) {
    return { protocol: runProtocol, point, dt, status: "unresolved" as const, phase, message: error instanceof Error ? error.message : String(error),
      wallTimeMs: performance.now() - started, presetQualified: false };
  }
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, worker: { type: "boolean" },
    workers: { type: "string" }, dt: { type: "string" } } });
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    const task = await readFittingWorkerStdinV1() as { point: Point; dt: .002 | .001 };
    if (![.002, .001].includes(task.dt)) throw new Error("Unsupported time step");
    process.stdout.write(JSON.stringify(await runHfrefRemodelingConditionV1(task.point, task.dt)) + "\n"); return;
  }
  const workers = Number(values.workers ?? 4), dt = Number(values.dt ?? .002);
  if (!values.output || ![.002, .001].includes(dt) || !Number.isInteger(workers) || workers < 1 || workers > 8) {
    throw new Error("Require NEW --output directory, optional --workers 1..8 and --dt .002 or .001");
  }
  const output = resolve(values.output); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const points: Point[] = [1, .35].flatMap(active => [1, 1.15].flatMap(referenceArea => [1, 1.25].map(wallVolume => ({ active, referenceArea, wallVolume }))));
  const files = [join(output, "plan.json")];
  await writeFile(files[0]!, JSON.stringify({ protocol, sourceSha256: source.sourceSha256, seed: seed.candidateInputs,
    points, dt, workers, initialization: "independent-cold-no-imported-checkpoints", policy,
    rationale: "2x2x2 static LVFW+SEP factors. Area +15% corresponds to about +23% cavity scale only under geometric similarity; volume +25% separates thickness/mass from reference-area effects. Exploratory finite perturbations, NOT human physiological bounds.",
    unchanged: ["RVFW and atrial geometry/material", "Ca source and kinetics", "passive material coefficients", "TBV", "vascular parameters", "valves", "Pericardial capacity/stiffness/fluid volume", "Baseline reference coronary bed and demand"],
    limits: ["Actual tissue volume included in pericardial occupancy", "Coronary reference-bed mass is NOT current anatomical mass; per-gram perfusion and remodeled coronary adequacy unqualified", "Shared septum couples RV", "Reference area changes both passive and active length dependence", "No AMI/regional ischemia/growth process", "No gate or model promotion"] }, null, 2) + "\n", { flag: "wx" });
  process.stderr.write(`Remodeling factorial: ${points.length} independent cold cases, ${workers} workers.\n`);
  const results = await runFittingJsonWorkersV1<Awaited<ReturnType<typeof runHfrefRemodelingConditionV1>>>({ scriptPath: fileURLToPath(import.meta.url), concurrency: workers,
    jobs: points.map(point => ({ args: ["--worker"], input: canonicalJsonStringify({ point, dt }) })) });
  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (canonicalJsonStringify(result.point) !== canonicalJsonStringify(points[i]) || result.dt !== dt || result.protocol !== protocol) throw new Error("Worker request/result mismatch");
    const path = join(output, `case-${i}.json`); files.push(path);
    await writeFile(path, JSON.stringify({ ...result, resultSha256: await sha256CanonicalJsonHex(result) }) + "\n", { flag: "wx" });
  }
  const summary = results.map(r => ({ point: r.point, status: r.status,
    ...(r.status === "observed" ? { cycles: r.cycles, values: r.values } : { phase: r.phase, message: r.message }),
    wallTimeMs: r.wallTimeMs }));
  const summaryPath = join(output, "summary.json"); files.push(summaryPath);
  await writeFile(summaryPath, JSON.stringify(summary, null, 2) + "\n", { flag: "wx" });
  await source.finish(files);
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  // Preserve failed evidence, but do not launch a chained finer run after a
  // construction/measurement failure in the coarse experiment.
  if (results.some(result => result.status !== "observed")) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
}
