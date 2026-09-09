import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedTypedAuthoritySessionV1 as BaseSession } from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import { collectMainWireStandard72FittingCycleV1 as collect } from "@/analysis/methods/mainWire/MainWireStandard72BaselineCalibrationEvaluatorV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3 as policy } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_REFERENCE_SCALES_V3 as scales } from "@/engine/myocardium/experiments/MainWireIntegratedModelReferenceScalesV3";
import { compareMainWireIntegratedModelAcceptedStatesV3 as compare } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { classifyMainWireIntegratedModelPeriodicityV3 as classify,
  type MainWireIntegratedModelPeriodicCycleObservationV3 as Cycle } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import { MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
  type MainWireFiveWallLandTriSegReadbackV1 as Readback } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { evaluateTriSegGeometryV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { createHfrefRemodelingResearchFixtureV1 as createFixture } from "./runHfrefRemodelingAblationV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";

// Supplemental, same-construction in-memory audit; not a public restore codec.
// The ordinary rich path materializes its accepted mechanics trial, whereas the
// lean path does not. Compare them explicitly; never fill lean nulls with zero.
const protocol = "hfref-remodeling-rich-readback-versus-lean-audit-v1";
const point = Object.freeze({ active: .35, referenceArea: 1.15, wallVolume: 1.25 });
type Fixture = Awaited<ReturnType<typeof createFixture>>["fixture"];
type State = ReturnType<BaseSession["currentAcceptedState"]>;
type Task = Readonly<{ dt: .002 | .001; preloadScale: 1 | 1.12 }>;
const options = { period1NormalizedTolerance: policy.period1NormalizedTolerance,
  period2NormalizedTolerance: policy.period2NormalizedTolerance,
  period2MinimumPeriod1NormalizedDelta: policy.period2MinimumPeriod1NormalizedDelta,
  consecutiveCycles: policy.consecutiveCycles };

class AuditSession extends BaseSession {
  constructor(private readonly fixture: Fixture, state: State = fixture.cold.acceptedState) {
    super(fixture as unknown as MainWireIntegratedModelRuntimeV3, state, "cold", null);
  }
  forkSameConstructionInMemory() {
    const copy = new AuditSession(this.fixture, this.currentAcceptedState());
    copy.restoreCoupledPredictorContinuationV1(this.checkpointCoupledPredictorContinuationV1());
    return copy;
  }
}

async function run(task: Task, smokeOnly = false) {
  const started = performance.now();
  if (Object.keys(task).sort().join() !== "dt,preloadScale"
    || ![.002, .001].includes(task.dt) || ![1, 1.12].includes(task.preloadScale)) throw new Error("Unregistered audit task");
  const built = await createFixture(point, { totalBloodVolumeMl: 4935 * task.preloadScale, systemicResistance: 1.2 });
  const { fixture } = built;
  const lean = new AuditSession(fixture);
  const boundaries = [lean.currentAcceptedState()], observations: Cycle[] = [];
  let classification = classify(observations, options), cycles = 0;
  for (let i = 1; !smokeOnly && i <= policy.maximumCycleCount; i++) {
    collect(lean, fixture, i, task.dt);
    const current = lean.currentAcceptedState(), previous = boundaries.at(-1)!;
    if (current.composedRhythm.acceptedAtrialCaptureCount - previous.composedRhythm.acceptedAtrialCaptureCount !== 1
      || current.composedRhythm.acceptedVentricularCaptureCount - previous.composedRhythm.acceptedVentricularCaptureCount !== 1) throw new Error("Non-sinus closure evidence");
    observations.push({ cycleIndex: i, evidenceRole: "canonical-periodic-protocol", protocolIdentityHash: built.constructionSha256,
      period1: compare(current, previous, scales, fixture.config),
      period2: boundaries.length < 2 ? null : compare(current, boundaries.at(-2)!, scales, fixture.config) });
    if (observations.length > policy.consecutiveCycles) observations.shift();
    boundaries.push(current); if (boundaries.length > 3) boundaries.shift();
    cycles = i; classification = classify(observations, options);
    if (classification.status !== "not-converged") break;
    if (performance.now() - started > 300_000) throw new Error("Audit cold settle exceeded five minutes");
  }
  if (!smokeOnly && classification.status !== "period1-converged") throw new Error("No period-1 closure before audit");
  const before = lean.currentAcceptedState(), rich = lean.forkSameConstructionInMemory();
  if (!isDeepStrictEqual(before, rich.currentAcceptedState())) throw new Error("In-memory fork changed accepted state");
  const diagnostics: unknown[] = [];
  let maximumStateRelativeDifferenceWithUnitFloor = 0, maximumPressureDifferenceMmHg = 0, maximumFlowDifferenceMlPerSec = 0;
  const exactFieldMismatchPaths = new Set<string>();
  // Same-clock audit, NOT the periodic comparator (which requires a P1/P2
  // time and event-lineage lag). This scalar summary is descriptive, not a
  // physiological tolerance. Raw pressure/flow errors are also reported.
  const compareSameClock = (left: unknown, right: unknown, path = "$"): void => {
    if (typeof left === "number" && typeof right === "number") {
      if (!Number.isFinite(left) || !Number.isFinite(right)) throw new Error("Nonfinite audited state");
      maximumStateRelativeDifferenceWithUnitFloor = Math.max(maximumStateRelativeDifferenceWithUnitFloor,
        Math.abs(left - right) / Math.max(1, Math.abs(left), Math.abs(right)));
    } else if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
      if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) throw new Error(`Audit state type mismatch: ${path}`);
      const leftKeys = Object.keys(left).sort(), rightKeys = Object.keys(right).sort();
      if (!isDeepStrictEqual(leftKeys, rightKeys)) throw new Error(`Audit state shape mismatch: ${path}`);
      for (const key of leftKeys) compareSameClock((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key], `${path}.${key}`);
    } else if (!Object.is(left, right)) exactFieldMismatchPaths.add(path);
  };
  let maximumScaledGeneralizedForce = 0, minimumInternalEigenvalue = Infinity, maximumAntisymmetricRelative = 0;
  let maximumMaterialResidual = 0, maximumInternalResidualNorm = 0;
  const trace = collect({ currentAcceptedState: lean.currentAcceptedState.bind(lean),
    advanceToPresentationTimeWithSelectedOutputProjectionV1: (target, ids) => {
      const projected = lean.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, ids);
      const richAdvance = rich.advanceToPresentationTime(target);
      if (projected.advance.status !== "advanced" || richAdvance.status !== "advanced"
        || projected.advance.internalAcceptedSubstepCount !== 1 || richAdvance.internalAcceptedSubstepCount !== 1) throw new Error("Audit paths did not commit the same one-step clock");
      const richValues = rich.projectCurrentAcceptedValuesV1(ids);
      for (const id of ids) {
        const left = projected.projectedValues?.[id], right = richValues[id];
        if (left?.availability !== "available" || right?.availability !== "available"
          || typeof left.value !== "number" || typeof right.value !== "number"
          || !Number.isFinite(left.value) || !Number.isFinite(right.value)) throw new Error("Audit output unavailable");
        const difference = Math.abs(left.value - right.value);
        if (id.startsWith("hemodynamics.pressure.")) maximumPressureDifferenceMmHg = Math.max(maximumPressureDifferenceMmHg, difference);
        else maximumFlowDifferenceMlPerSec = Math.max(maximumFlowDifferenceMlPerSec, difference);
      }
      const left = lean.currentAcceptedState(), right = rich.currentAcceptedState();
      if (left.acceptedTimeSec !== right.acceptedTimeSec || left.revision !== right.revision) throw new Error("Audit path clocks differ");
      compareSameClock(left, right);
      const trial = rich.observe().lastAcceptedStep?.coronaryStep.baseStep.mechanicsTrial;
      if (!trial || !trial.diagnostics.converged || !trial.diagnostics.finite || trial.diagnostics.errors.length) throw new Error("Missing valid accepted rich mechanics trial");
      const readback = trial.diagnostics.readback as Readback | null;
      if (!readback || readback.providerModelId !== MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID
        || readback.solveMode !== "trial" || !readback.strictLocalStableEquilibrium
        || !readback.jacobianSymmetricWithinTolerance
        || readback.scaledAlgorithmicGeneralizedForceByOneJ.length !== 2) throw new Error("Rich mechanics audit is incomplete or unstable");
      const force = Math.max(...readback.scaledAlgorithmicGeneralizedForceByOneJ.map(Math.abs));
      const numbers = [force, readback.symmetricJacobianMinimumEigenvalueByOneJ,
        readback.jacobianAntisymmetricRelative, readback.maximumMaterialResidualNorm, trial.diagnostics.residualNorm];
      if (!numbers.every(Number.isFinite)) throw new Error("Nonfinite accepted mechanics diagnostics");
      maximumScaledGeneralizedForce = Math.max(maximumScaledGeneralizedForce, force);
      minimumInternalEigenvalue = Math.min(minimumInternalEigenvalue, readback.symmetricJacobianMinimumEigenvalueByOneJ);
      maximumAntisymmetricRelative = Math.max(maximumAntisymmetricRelative, readback.jacobianAntisymmetricRelative);
      maximumMaterialResidual = Math.max(maximumMaterialResidual, readback.maximumMaterialResidualNorm);
      maximumInternalResidualNorm = Math.max(maximumInternalResidualNorm, trial.diagnostics.residualNorm);
      const state = right.coronary;
      diagnostics.push({ acceptedTimeSec: target, acceptedRevision: right.revision,
        geometry: evaluateTriSegGeometryV1({ leftVentricularCavityVolumeM3: state.circulation.nodeVolumesMl.LV * 1e-6,
          rightVentricularCavityVolumeM3: state.circulation.nodeVolumesMl.RV * 1e-6,
          coordinates: state.mechanics.materialState.trisegCoordinates, walls: built.construction.trisegWalls }),
        rawAlgorithmicGeneralizedForce: readback.rawAlgorithmicGeneralizedForce,
        scaledAlgorithmicGeneralizedForceByOneJ: readback.scaledAlgorithmicGeneralizedForceByOneJ,
        symmetricJacobianMinimumEigenvalueByOneJ: readback.symmetricJacobianMinimumEigenvalueByOneJ,
        jacobianAntisymmetricRelative: readback.jacobianAntisymmetricRelative,
        internalResidualNorm: trial.diagnostics.residualNorm, maximumMaterialResidualNorm: readback.maximumMaterialResidualNorm,
        effectiveFiberLogStrainByWall: readback.effectiveFiberLogStrainByWall,
        fiberKirchhoffStressPaByWall: readback.fiberKirchhoffStressPaByWall });
      return projected;
    }, observe: lean.observe.bind(lean) }, fixture, cycles + 1, task.dt);
  const leanClosure = compare(lean.currentAcceptedState(), before, scales, fixture.config);
  const richClosure = compare(rich.currentAcceptedState(), before, scales, fixture.config);
  return { protocol, task, point, constructionSha256: built.constructionSha256, construction: built.construction,
    status: smokeOnly ? "smoke-observed" : "observed", cyclesBeforeAudit: cycles, classification, leanClosure, richClosure, trace, diagnostics,
    summary: { samples: trace.length, maximumStateRelativeDifferenceWithUnitFloor, exactFieldMismatchPaths: [...exactFieldMismatchPaths],
      maximumPressureDifferenceMmHg, maximumFlowDifferenceMlPerSec,
      maximumScaledGeneralizedForce, minimumInternalEigenvalue, maximumAntisymmetricRelative, maximumMaterialResidual, maximumInternalResidualNorm },
    limitations: ["Rich path has its own accepted commits and resets numerical predictor history; equality is measured, not assumed",
      "In-memory fork resets only diagnostic beat accumulation; no numerical state/predictor is discarded",
      "Not a public checkpoint codec, domain-wide proof, or replacement of original lean null residuals"],
    publicCheckpointExported: false, presetQualified: false, wallTimeMs: performance.now() - started };
}

async function main() {
  const { values } = parseArgs({ options: { worker: { type: "boolean" }, output: { type: "string" }, workers: { type: "string" }, smoke: { type: "boolean" } } });
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) { process.stdout.write(JSON.stringify(await run(await readFittingWorkerStdinV1() as Task, values.smoke)) + "\n"); return; }
  const workers = Number(values.workers ?? 4);
  if (!values.output || !Number.isInteger(workers) || workers < 1 || workers > 4) throw new Error("Require NEW --output and --workers 1..4");
  const output = resolve(values.output); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const tasks: Task[] = values.smoke ? [{ dt: .002, preloadScale: 1 }]
    : ([.002, .001] as const).flatMap(dt => ([1, 1.12] as const).map(preloadScale => ({ dt, preloadScale })));
  const files = [join(output, "plan.json")];
  await writeFile(files[0]!, JSON.stringify({ protocol, sourceSha256: source.sourceSha256, point, tasks, workers,
    initialization: "independent-cold-then-same-construction-in-memory-twin-with-identical-predictor", smokeOnly: values.smoke ?? false,
    noNewPhysiologicalThreshold: true, publicCheckpointOrAdoption: false }, null, 2) + "\n", { flag: "wx" });
  const results = await runFittingJsonWorkersV1<Awaited<ReturnType<typeof run>>>({ scriptPath: fileURLToPath(import.meta.url), concurrency: workers,
    jobs: tasks.map(task => ({ args: ["--worker", ...(values.smoke ? ["--smoke"] : [])], input: canonicalJsonStringify(task) })) });
  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    if (result.protocol !== protocol || canonicalJsonStringify(result.task) !== canonicalJsonStringify(tasks[i])) throw new Error("Audit worker task mismatch");
    const path = join(output, `case-${i}.json`); files.push(path);
    await writeFile(path, JSON.stringify({ ...result, resultSha256: await sha256CanonicalJsonHex(result) }) + "\n", { flag: "wx" });
  }
  await source.finish(files);
  process.stdout.write(JSON.stringify(results.map(result => ({ task: result.task, ...result.summary,
    leanClosure: result.leanClosure.overall.maximumNormalizedDelta, richClosure: result.richClosure.overall.maximumNormalizedDelta,
    wallTimeMs: result.wallTimeMs })), null, 2) + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  process.stderr.write(String(error) + "\n"); process.exitCode = 1;
});
