import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MAIN_WIRE_FITTING_SEED_V1 as seed } from "@/analysis/registry/MainWireFittingSeedV1";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { observeMainWireHfrefCaseV2 as observe } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { assessMainWireHfrefDilatedRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { runHfrefRemodelingConditionV1 as run } from "./runHfrefRemodelingAblationV1";
import { readHfrefRemodelingAssessmentBatchV1 as readControl } from "./reassessHfrefRemodelingV1";
import { runFittingJsonWorkersV1, readFittingWorkerStdinV1 } from "./runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { MAIN_WIRE_INTEGRATED_MODEL_FORMAL_PRELOAD_RESERVE_POLICY_V1 as preloadPolicy } from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";

// Finite research screen, not a new optimizer, parameter domain or public case.
const protocol = "hfref-static-lv-septal-remodeling-fixed-geometry-hemodynamics-v1";
const releaseProtocol = "hfref-static-lv-septal-remodeling-pericardial-release-control-v1";
const point = { active: .35, referenceArea: 1.15, wallVolume: 1.25 };
const conditions = [4935, 5035, 5135].flatMap(totalBloodVolumeMl =>
  [1.04, 1.12, 1.20].map(systemicResistance => ({ totalBloodVolumeMl, systemicResistance })));
type Task = { caseIndex: number; dt: .002 | .001; preloadScale?: number; pericardiumMode?: "on" | "exact-off" };
type Result = Awaited<ReturnType<typeof run>>;
const preloadScales = [preloadPolicy.hypovolemicGlobalTbvScale, preloadPolicy.hypervolemicGlobalTbvScale];

function conditionFor(task: Task) {
  if (!Number.isInteger(task.caseIndex) || !conditions[task.caseIndex] || ![.002, .001].includes(task.dt)) {
    throw new Error("Request outside the fixed-geometry nine-condition plan");
  }
  if (task.preloadScale !== undefined && !preloadScales.some(s => s === task.preloadScale)) throw new Error("Unsupported preload endpoint");
  const condition = conditions[task.caseIndex]!;
  return { ...condition, totalBloodVolumeMl: condition.totalBloodVolumeMl * (task.preloadScale ?? 1) };
}

function controlFor(task: Task) {
  if (task.pericardiumMode !== undefined && !["on", "exact-off"].includes(task.pericardiumMode)) throw new Error("Unsupported pericardial control");
  return task.pericardiumMode === "exact-off" ? { pericardiumMode: "exact-off" as const } : undefined;
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, control: { type: "string" },
    worker: { type: "boolean" }, workers: { type: "string" }, dt: { type: "string" }, cases: { type: "string" }, preload: { type: "boolean" },
    "pericardial-ablation": { type: "boolean" } } });
  selectHotPathIntegrityTierV1("hot-path-lean");
  if (values.worker) {
    const task = await readFittingWorkerStdinV1() as Task, condition = conditionFor(task);
    process.stdout.write(JSON.stringify({ task, result: await run(point, task.dt, condition, controlFor(task)) }) + "\n");
    return;
  }
  const workers = Number(values.workers ?? 8), dt = Number(values.dt ?? .002), ablation = values["pericardial-ablation"] === true;
  const indices = values.cases === undefined ? conditions.map((_, i) => i) : values.cases.split(",").map(Number);
  if (!values.output || !values.control || ![.002, .001].includes(dt) || !Number.isInteger(workers)
    || workers < 1 || workers > 8 || !indices.length || new Set(indices).size !== indices.length
    || ((values.preload || ablation) && (values.cases === undefined || indices.length !== 1)) || (values.preload && ablation)) {
    throw new Error("Require --output NEW_DIRECTORY --control SEALED_FACTORIAL, optional --workers 1..8 --dt .002|.001 --cases indices; --preload or --pericardial-ablation requires exactly one selected case and cannot be combined");
  }
  const tasks: Task[] = indices.flatMap(caseIndex => ablation
    ? (["on", "exact-off"] as const).flatMap(pericardiumMode => [preloadScales[0]!, undefined, preloadScales[1]!]
      .map(preloadScale => ({ caseIndex, dt: dt as Task["dt"], pericardiumMode, ...(preloadScale === undefined ? {} : { preloadScale }) })))
    : values.preload
    ? preloadScales.map(preloadScale => ({ caseIndex, dt: dt as Task["dt"], preloadScale }))
    : [{ caseIndex, dt: dt as Task["dt"] }]);
  tasks.forEach(conditionFor);
  tasks.forEach(controlFor);
  const healthyControl = await readControl(values.control);
  if (healthyControl.dt !== dt) throw new Error("Healthy descriptive comparator must use the same dt");
  const output = resolve(values.output); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const reference = resolveMainWireFittingReferenceV1("hfref-chronic-dilated-v1");
  const responseOnly = values.preload || ablation;
  const plan = { protocol: ablation ? "hfref-pericardial-on-off-three-volume-comparison-v1" : protocol,
    point, conditions, selectedIndices: indices, tasks, dt, workers,
    sourceSha256: source.sourceSha256, seed: seed.candidateInputs, reference,
    referenceSha256: await sha256CanonicalJsonHex(reference), control: healthyControl.origin,
    comparator: { caseIndex: 0, resultSha256: healthyControl.cases[0]!.originalResultSha256,
      role: "healthy-descriptive-not-load-matched" },
    initialization: "independent-cold-no-imported-checkpoints",
    purpose: ablation ? "mechanistic-pericardial-release-comparison-not-a-preset" : values.preload ? "cold-fixed-control-preload-response-not-formal-reservoir-protocol" : "finite-resting-phenotype-fit",
    rationale: ablation
      ? "Same low/rest/high blood volumes, all parameters fixed, existing pericardium on versus exact-off binding from cold. Pressure/energy/stiffness removed together. Release is a causal diagnostic, not chronic adaptation or a candidate for adoption."
      : values.preload
      ? "Reuse existing low/high TBV scales 0.88/1.12, but independent cold settling, not the formal reservoir fork protocol. Do not apply healthy preload-response thresholds or resting phenotype targets to perturbed endpoints."
      : "Only TBV +0/100/200 mL and existing systemic resistance 1.04/1.12/1.20. Fixed low active tension, geometry and tissue volume. Joint existing phenotype intervals, no EF-first fitting or new threshold.",
    selection: responseOnly ? "no candidate ranking or resting-phenotype verdict for mechanistic/volume endpoints"
      : "screen and complete target groups first, existing interval ranking, then ascending preregistered case index; no reward for pushing farther inside an interval",
    unchanged: ["LVFW/SEP active scale, reference area, tissue volume", "RV and atrial mechanics", "Ca/Land kinetics and passive material",
      "HR 70, BSA 1.9", "venous tone, pulmonary resistance, arterial stiffness, PEEP", "valves", "pericardial capacity/stiffness", "fixed coronary reference bed and demand"],
    qualificationHolds: ["conditional passive audit is not clinical dynamic EDPVR", "geometry/pericardium/coronary compatibility requires explicit disposition",
      "no public checkpoint or preset", "selected candidate requires cold/fine and raw-waveform/preload review"],
    afterloadQualificationTest: false, publicPromotionAuthorized: false };
  const files = [join(output, "plan.json")];
  await writeFile(files[0]!, JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
  process.stderr.write(`Fixed-geometry HFrEF ${ablation ? "pericardial ablation" : values.preload ? "preload response" : "rest screen"}: ${tasks.length} independent cold conditions, ${workers} workers, dt=${dt}.\n`);
  const started = performance.now();
  const rows = await runFittingJsonWorkersV1<{ task: Task; result: Result }>({ scriptPath: fileURLToPath(import.meta.url), concurrency: workers,
    jobs: tasks.map(task => ({ args: ["--worker"], input: canonicalJsonStringify(task) })) });
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const { task, result } = rows[i]!, expected = tasks[i]!, condition = conditionFor(expected);
    const control = controlFor(expected), expectedProtocol = control === undefined ? protocol : releaseProtocol;
    if (canonicalJsonStringify(task) !== canonicalJsonStringify(expected) || result.protocol !== expectedProtocol
      || result.dt !== dt || canonicalJsonStringify(result.point) !== canonicalJsonStringify(point)) throw new Error("Worker request/result mismatch");
    if (result.status === "observed") {
      const c = result.candidate, m = seed.candidateInputs.mechanismResearchInputs;
      const expectedCandidate = { ...seed.candidateInputs,
        hemodynamicResearchInputs: { ...seed.candidateInputs.hemodynamicResearchInputs, ...condition },
        mechanismResearchInputs: { ...m, chamberMechanics: { ...m.chamberMechanics,
          activeTensionScaleByWall: { ...m.chamberMechanics.activeTensionScaleByWall, LVFW: .35, SEP: .35 } } } };
      if (canonicalJsonStringify(c) !== canonicalJsonStringify(expectedCandidate)
        || result.constructionSha256 !== await sha256CanonicalJsonHex({ protocol: expectedProtocol, point, candidate: c,
          ...(control === undefined ? {} : { control }) })
        || result.construction.pericardium.mode !== (control?.pericardiumMode ?? "on")
        || result.classification.status !== "period1-converged" || result.auditClassification.status !== "period1-converged"
        || result.presetQualified !== false || result.publicCheckpointExported !== false) throw new Error("Unbound or unclosed research condition");
    }
    const observation = result.status === "observed" ? observe(result.completedBeat, result.timingAndInletTrace ?? result.terminalTrace) : null;
    const assessment = observation === null || responseOnly ? null : assess(observation, healthyControl.cases[0]!.observation);
    const body = { task, condition, result, observation, assessment,
      assessmentRole: responseOnly ? "record-response-without-resting-phenotype-verdict" : "resting-phenotype-screen-and-preferences" };
    const path = join(output, `case-${task.caseIndex}${task.preloadScale === undefined ? "" : `-tbv-${task.preloadScale}`}${task.pericardiumMode === undefined ? "" : `-pericardium-${task.pericardiumMode}`}.json`); files.push(path);
    await writeFile(path, JSON.stringify({ ...body, resultSha256: await sha256CanonicalJsonHex(body) }) + "\n", { flag: "wx" });
    results.push({ caseIndex: task.caseIndex, preloadScale: task.preloadScale ?? null, pericardiumMode: task.pericardiumMode ?? "on", condition, status: result.status,
      cycles: result.status === "observed" ? result.cycles : null, wallTimeMs: result.wallTimeMs,
      values: observation?.values ?? null, screen: assessment?.status ?? null,
      preference: assessment?.preferenceStatus ?? null, ranking: assessment?.ranking ?? null,
      morphology: result.status === "observed" ? result.morphology : null,
      issue: result.status === "unresolved" ? `${result.phase}: ${result.message}` : null });
  }
  const report = { plan, wallTimeMs: performance.now() - started, results,
    targetMatchedIndices: results.filter(r => r.screen === "passed" && r.preference === "met").map(r => r.caseIndex),
    publicPromotionAuthorized: false, finalQualificationPerformed: false };
  const reportPath = join(output, "report.json"); files.push(reportPath);
  await writeFile(reportPath, JSON.stringify({ ...report, reportSha256: await sha256CanonicalJsonHex(report) }, null, 2) + "\n", { flag: "wx" });
  await source.finish(files);
  process.stdout.write(JSON.stringify({ output, wallTimeMs: report.wallTimeMs, targetMatchedIndices: report.targetMatchedIndices,
    results: results.map(({ morphology: _, ...rest }) => rest) }, null, 2) + "\n");
  if (results.some(r => r.status !== "observed")) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
}
