import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { solveLand2017BackwardEulerStep } from "@/engine/myocardium/myofilament/land2017";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as sourceLand,
  stableHash, deriveLand2017DerivedParameters, type Land2017SourceParameterSet } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { equilibrateFastWeakBridgeV1, liftFastWeakBridgeV1, stepFastWeakBridgeV1,
  fastWeakBridgeNominalStressV1, LAND_FAST_WEAK_BRIDGE_RESEARCH_V1 } from "@/engine/myocardium/experiments/LandFastWeakBridgeResearchV1";
import { evaluateFiveWallNormalCalciumDriveV1, FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  type FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1 } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";
import { land2017LengthFactor } from "@/engine/myocardium/myofilament/land2017/equations";

type Sample = { dt: number; stretch: number; ca: number; sourceStress?: number; flow?: number };
type Family = { id: string; reduced: boolean; parameters: Land2017SourceParameterSet };
type SourceResult = {
  status: string;
  construction: { landParameters: Land2017SourceParameterSet;
    calciumDriveParams: FiveWallNormalCalciumDriveParamsV1; ventricularLandSlackStretch: number };
  mechanismReplay: { samples: { acceptedDtSec: number; freeCalciumUMByWall: { LVFW: number };
    valveFlowMlPerSec: { AoV: number };
    material: { walls: { LVFW: { landStretch: number; activeStressPa: number } } } }[] };
};
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== "--source-result" || args[2] !== "--output") {
  throw new Error("Usage: --source-result settled-research.result.json --output NEW-directory");
}
const sourcePath = resolve(args[1]!), output = resolve(args[3]!);
const raw = await readFile(sourcePath, "utf8"), source = JSON.parse(raw) as SourceResult;
if (source.status !== "settled" || !source.mechanismReplay?.samples?.length) throw new Error("source lacks a settled material cycle");
const cycle = source.construction.calciumDriveParams.cycleLengthSec;
if (Math.abs(cycle - 60 / 70) > 1e-10) throw new Error("this frozen component comparison requires HR70");
const { strongBridgeDeactivationExit: _exit, parameterSetStableHash: _hash,
  ...withoutExit } = source.construction.landParameters;
const noExitInput = { ...withoutExit, parameterSetId: `${withoutExit.parameterSetId}-assay-no-exit` };
const families: Family[] = [
  { id: "current-six-state", reduced: false, parameters: source.construction.landParameters },
  { id: "current-six-state-no-exit", reduced: false,
    parameters: { ...noExitInput, parameterSetStableHash: stableHash(noExitInput) } },
  { id: "source-six-state", reduced: false, parameters: sourceLand },
  ...[{ phiScale: .4, kwsScale: 1 }, { phiScale: .6, kwsScale: 1 },
    { phiScale: .2, kwsScale: 2 }, { phiScale: .4 / 3, kwsScale: 3 }].map(({ phiScale, kwsScale }) => {
    const { parameterSetStableHash: _oldHash, ...base } = sourceLand;
    const values = { ...base.values, phi: base.values.phi * phiScale, kws: base.values.kws * kwsScale };
    const input = { ...base, parameterSetId: kwsScale === 1 ? `source-six-state-phi-${phiScale}`
      : `source-six-state-fast-strong-${kwsScale}`, values,
      derived: deriveLand2017DerivedParameters(values),
      sourceParameters: base.sourceParameters.map(p => p.parameter === "phi" || p.parameter === "kws"
        ? { ...p, location: `${p.location}; uncalibrated component recovery counterfactual`,
          runtime: { ...p.runtime, value: values[p.parameter] } } : p) };
    return { id: input.parameterSetId, reduced: false,
      parameters: { ...input, parameterSetStableHash: stableHash(input) } };
  }),
  { id: "source-fast-weak-four-state", reduced: true, parameters: sourceLand },
];
const currentCa = source.construction.calciumDriveParams;
const drives = [
  { id: "current-matched-alpha", parameters: currentCa },
  { id: "source-fit-at-HR70", parameters: resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(70) },
  ...[.1, currentCa.ventricular.decayTimeConstantSec].map(decayTimeConstantSec => ({
    id: `early-rise-40ms-decay-${decayTimeConstantSec}`,
    parameters: { ...currentCa, ventricular: { ...currentCa.ventricular,
      riseTimeConstantSec: .04, decayTimeConstantSec } },
  })),
  { id: "earlier-component-twitch-prior", parameters: {
    ...FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    cycleLengthSec: cycle, atrioventricularDelaySec: currentCa.atrioventricularDelaySec,
  } },
];
const referenceStretches = [1, 1.1, 1.166, 1.199];
const stretches = [...new Set(referenceStretches.flatMap(s => [.98 * s, s, 1.02 * s]))].sort((a, b) => a - b);
const protocol = {
  id: "active-reference-model-form-component-comparison-v4", createdAt: new Date().toISOString(),
  sourcePath, sourceSha256: sha256(raw), families, drives, referenceStretches, stretches,
  prospectiveScope: "component responses only; source trajectory is already observed construction evidence",
  physicalInterpretation: "lambda is physical material stretch; changing its map is not a harmless coordinate relabelling",
  priorReferenceGeometryStretch: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.targetFiberStretchAtLoadedReference,
  publishedAdditionalLandSlack: MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1,
  currentResearchAdditionalLandSlack: source.construction.ventricularLandSlackStretch,
  capClaim: "Land length-sensitivity cap 1.2 is constitutive, not a human sarcomere normality boundary",
  calciumClaim: "source alpha was fitted to digitized Land Figure 6, not raw numeric Ca; current adds time dilation; early-rise profiles are uncalibrated counterfactuals; earlier prior reconstructs twitch timing",
  tailAssay: "fixed final length after the recorded AV closure; factorial keep/floor Ca and keep/zero distortion; artificial component interventions, never proposed cardiac physiology or exact state projections",
  reductionId: LAND_FAST_WEAK_BRIDGE_RESEARCH_V1,
  reductionClaim: "our quasi-steady elimination of weak population and distortion; not the published Land model",
  dtSec: [.002, .001], period1: { maximumCycles: 80, consecutive: 3, absoluteStateTolerance: 1e-10 },
  matching: "same current isometric peak at lambda 1.166/current Ca; diagnostic amplitude normalization only",
  acceptance: "no clinical gate, no automatic selection, no closed-loop response or baseline claim",
  afterloadStressTest: false, publishedModelChanged: false,
  primarySource: "https://doi.org/10.1016/j.yjmcc.2017.03.008",
};
await mkdir(dirname(output), { recursive: true });
await mkdir(output); // Never overwrite a preceding experiment.
const protocolText = JSON.stringify(protocol, null, 2);
await writeFile(`${output}/protocol.json`, protocolText, { flag: "wx" });
const sourceFiles = ["tools/scientific/runMainWireActiveReferenceModelFormV1.ts",
  "engine/myocardium/experiments/LandFastWeakBridgeResearchV1.ts",
  "engine/myocardium/myofilament/land2017/equations.ts", "engine/myocardium/myofilament/land2017/parameterSets.ts",
  "engine/myocardium/myofilament/land2017/solver.ts", "engine/myocardium/myofilament/land2017/types.ts",
  "engine/myocardium/myofilament/land2017/outputs.ts", "engine/myocardium/myofilament/land2017/strongBridgeDeactivationExitV1.ts",
  "engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts", "engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1.ts",
  "engine/myocardium/calcium/fiveWallNormalCalciumDriveV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1.ts",
  "engine/myocardium/calcium/exactEventPrescribedCalciumV1.ts"];
const sourceSnapshot = await Promise.all(sourceFiles.map(async path => ({ path, sha256: sha256(await readFile(path, "utf8")) })));
await writeFile(`${output}/source-snapshot.json`, JSON.stringify({
  head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  dirtyDiffSha256: sha256(execFileSync("git", ["diff"], { encoding: "utf8" })),
  files: sourceSnapshot,
}, null, 2), { flag: "wx" });

function summarize(records: { time: number; dt: number; stress: number; work: number; stretch: number }[]) {
  const peak = Math.max(...records.map(r => r.stress)), minimum = Math.min(...records.map(r => r.stress));
  const peakIndex = records.findIndex(r => r.stress === peak), peakTime = records[peakIndex]!.time;
  function relaxation(fraction: number) {
    const level = minimum + (peak - minimum) * fraction;
    for (let offset = 1; offset < records.length; ++offset) {
      const a = records[(peakIndex + offset - 1) % records.length]!;
      const b = records[(peakIndex + offset) % records.length]!;
      if (a.stress > level && b.stress <= level) {
        const end = b.time + (peakIndex + offset >= records.length ? cycle : 0);
        return 1000 * (end - b.dt * (level - b.stress) / (a.stress - b.stress) - peakTime);
      }
    }
    return null;
  }
  const filling = records.filter(r => r.time / cycle >= .6 && r.time / cycle <= .9);
  return { peakKirchhoffStressPa: peak, minimumKirchhoffStressPa: minimum,
    peakPhase01: peakTime / cycle, relaxation50Ms: relaxation(.5), relaxation90Ms: relaxation(.1), relaxation95Ms: relaxation(.05),
    halfAmplitudeDurationMs: 1000 * records.filter(r => r.stress >= minimum + .5 * (peak - minimum)).reduce((a, r) => a + r.dt, 0),
    fillingMeanKirchhoffStressPa: filling.reduce((a, r) => a + r.stress * r.dt, 0) / filling.reduce((a, r) => a + r.dt, 0),
    cycleShorteningWorkJPerM3: records.reduce((a, r) => a + r.work, 0),
    lengthCapExposureFraction: records.filter(r => r.stretch >= 1.2).reduce((a, r) => a + r.dt, 0) / cycle };
}

function run(f: Family, samples: Sample[], retainState = false) {
  const started = performance.now();
  const duration = samples.reduce((a, s) => a + s.dt, 0);
  if (Math.abs(duration - cycle) > 1e-7 || samples.some(s => ![s.dt, s.stretch, s.ca].every(Number.isFinite)
    || s.dt <= 0 || s.stretch <= 0 || s.ca <= 0)) throw new Error("incomplete or invalid prescribed component cycle");
  const last = samples.at(-1)!;
  const noExit = f.parameters.strongBridgeDeactivationExit === undefined ? f.parameters :
    { ...f.parameters, strongBridgeDeactivationExit: undefined };
  let reduced = equilibrateFastWeakBridgeV1(last.ca, last.stretch, noExit);
  let full = liftFastWeakBridgeV1(reduced, { calciumUM: last.ca, stretch: last.stretch, stretchRatePerSec: 0 }, noExit);
  let previousStretch = last.stretch, consecutive = 0, closure = Infinity, cycles = 0;
  let records: { time: number; dt: number; stress: number; work: number; stretch: number; ca: number; state?: number[] }[] = [];
  for (cycles = 1; cycles <= 80; ++cycles) {
    const before = f.reduced ? [reduced.caTroponin, reduced.blocked, reduced.strong, reduced.strongDistortion] : Array.from(full);
    records = []; let time = 0;
    for (const s of samples) {
      const rate = (s.stretch - previousStretch) / s.dt;
      let nominal: number;
      if (f.reduced) {
        const input = { calciumUM: s.ca, stretch: s.stretch, stretchRatePerSec: rate };
        reduced = stepFastWeakBridgeV1(reduced, input, s.dt, f.parameters);
        nominal = fastWeakBridgeNominalStressV1(reduced, input, f.parameters);
      } else {
        const next = solveLand2017BackwardEulerStep(full, { freeCalciumUM: s.ca,
          previousFiberEngineeringStrain: previousStretch - 1, stageFiberEngineeringStrain: s.stretch - 1,
          dtSec: s.dt, stage: { scheme: "BE", stageIndex: 0 } }, {}, f.parameters);
        if (!next.ok || !next.output?.health.finite) throw new Error(`${f.id}: ${next.failureMessage}`);
        full = next.nextState;
        nominal = next.output.sourceActiveFiberStressPa;
      }
      const stress = s.stretch * nominal;
      if (!Number.isFinite(stress)) throw new Error("nonfinite component stress");
      time += s.dt;
      records.push({ time, dt: s.dt, stress, stretch: s.stretch, ca: s.ca,
        ...(retainState ? { state: f.reduced ? Array.from(liftFastWeakBridgeV1(reduced,
          { calciumUM: s.ca, stretch: s.stretch, stretchRatePerSec: rate }, f.parameters)) : Array.from(full) } : {}),
        work: -stress * Math.log(s.stretch / previousStretch) });
      previousStretch = s.stretch;
    }
    const after = f.reduced ? [reduced.caTroponin, reduced.blocked, reduced.strong, reduced.strongDistortion] : Array.from(full);
    closure = Math.max(...after.map((x, i) => Math.abs(x - before[i]!)));
    consecutive = closure < 1e-10 ? consecutive + 1 : 0;
    if (consecutive === 3) break;
  }
  if (consecutive !== 3) throw new Error(`${f.id}: component did not settle`);
  return { familyId: f.id, cycles, closure, wallTimeMs: performance.now() - started,
    ...summarize(records), records };
}

const begun = performance.now();
const isometric = drives.flatMap(drive => [.002, .001].flatMap(requestedDt => {
  const n = Math.ceil(cycle / requestedDt), dt = cycle / n;
  return stretches.flatMap(stretch => {
    const samples: Sample[] = Array.from({ length: n }, (_, i) => ({ dt, stretch,
      ca: evaluateFiveWallNormalCalciumDriveV1((i + 1) * dt, drive.parameters).freeCalciumUMByWall.LVFW }));
    return families.map(f => ({ driveId: drive.id, requestedDt, actualDt: dt, stretch, ...run(f, samples) }));
  });
}));
const referencePeak = isometric.find(r => r.familyId === "current-six-state" && r.driveId === drives[0]!.id
  && r.requestedDt === .001 && r.stretch === 1.166)!.peakKirchhoffStressPa;
const matches = families.map(f => {
  const r = isometric.find(r => r.familyId === f.id && r.driveId === drives[0]!.id
    && r.requestedDt === .001 && r.stretch === 1.166)!;
  const scale = referencePeak / r.peakKirchhoffStressPa;
  return { familyId: f.id, diagnosticStressScale: scale, equivalentTrefPa: scale * f.parameters.values.Tref,
    physiologicalAdmissionClaimed: false };
});
const sourceSamples: Sample[] = source.mechanismReplay.samples.map(s => ({ dt: s.acceptedDtSec,
  stretch: s.material.walls.LVFW.landStretch, ca: s.freeCalciumUMByWall.LVFW,
  sourceStress: s.material.walls.LVFW.activeStressPa, flow: s.valveFlowMlPerSec.AoV }));
const prescribedPath = [1, 1.1 / 1.166].flatMap(stretchMapRatio => families.map(f => {
  const samples = sourceSamples.map(s => ({ ...s, stretch: s.stretch * stretchMapRatio }));
  const result = run(f, samples, true), match = matches.find(m => m.familyId === f.id)!;
  return { stretchMapRatio, ...result, diagnosticStressScale: match.diagnosticStressScale,
    sourceReplayMaxDifferencePa: f.id === "current-six-state" && stretchMapRatio === 1
      ? Math.max(...result.records.map((r, i) => Math.abs(r.stress - sourceSamples[i]!.sourceStress!))) : null,
    scope: "prescribed old LVFW length/Ca trajectory; not a new PV loop, pressure, ET, CI or reserve prediction" };
}));

// Reuse the same periodic component history, then intervene AFTER the final
// forward-flow sample. No causal effect on the whole-heart loop is asserted.
const closureIndex = sourceSamples.reduce((last, s, i) => s.flow! > 0 ? i : last, -1) + 1;
if (closureIndex <= 1 || closureIndex >= sourceSamples.length || sourceSamples[closureIndex]!.flow !== 0) {
  throw new Error("tail assay requires a complete, single forward ejection followed by closure");
}
const closureTime = sourceSamples.slice(0, closureIndex + 1).reduce((a, s) => a + s.dt, 0);
const tailAssays = families.filter(f => !f.reduced).flatMap(f => {
  const replay = prescribedPath.find(r => r.familyId === f.id && r.stretchMapRatio === 1)!;
  const start = replay.records[closureIndex]!;
  return [false, true].flatMap(calciumOff => [false, true].map(zeroDistortion => {
    if (start.state === undefined) throw new Error("tail assay requires retained component state");
    let state = Float64Array.from(start.state);
    if (zeroDistortion) { state[4] = 0; state[5] = 0; }
    let elapsed = 0;
    const records = [];
    for (let i = closureIndex + 1; i < sourceSamples.length && elapsed < .25; ++i) {
      const s = sourceSamples[i]!, ca = calciumOff ? currentCa.ventricular.diastolicCalciumUM : s.ca;
      const next = solveLand2017BackwardEulerStep(state, { freeCalciumUM: ca,
        previousFiberEngineeringStrain: start.stretch - 1, stageFiberEngineeringStrain: start.stretch - 1,
        dtSec: s.dt, stage: { scheme: "BE", stageIndex: 0 } }, {}, f.parameters);
      if (!next.ok || !next.output?.health.finite) throw new Error(`tail assay failed: ${next.failureMessage}`);
      state = next.nextState; elapsed += s.dt;
      const scale = start.stretch * land2017LengthFactor(start.stretch, f.parameters.values)
        * f.parameters.values.Tref / f.parameters.values.rs;
      const populationOnlyStressPa = scale * state[3]!;
      const distortionStressPa = scale * (state[3]! * state[5]! + state[2]! * state[4]!);
      const stressPa = start.stretch * next.output.sourceActiveFiberStressPa;
      if (Math.abs(stressPa - populationOnlyStressPa - distortionStressPa) > 1e-7) {
        throw new Error("tail force reconstruction failed");
      }
      records.push({ elapsed, ca, stressPa, populationOnlyStressPa, distortionStressPa, state: Array.from(state) });
    }
    if (elapsed < .2) throw new Error("tail assay does not retain 200ms before the next beat");
    const at = (t: number) => records.reduce((best, r) => Math.abs(r.elapsed - t) < Math.abs(best.elapsed - t) ? r : best);
    return { familyId: f.id, calciumOff, zeroDistortion, start, closureTime,
      stress50MsPa: at(.05).stressPa, stress100MsPa: at(.1).stressPa, stress200MsPa: at(.2).stressPa,
      peakAfterClosurePa: Math.max(...records.map(r => r.stressPa)), records };
  }));
});
await writeFile(`${output}/results.json`, JSON.stringify({
  protocolSha256: sha256(protocolText), isometric, matches, prescribedPath, tailAssays,
  wallTimeMs: performance.now() - begun,
}, null, 2), { flag: "wx" });
for (const r of isometric.filter(r => referenceStretches.includes(r.stretch) && r.requestedDt === .001)) {
  const { records: _, ...summary } = r;
  console.log(JSON.stringify(summary));
}
console.log(JSON.stringify({ matches, sourceReplayMaxDifferencePa: prescribedPath[0]!.sourceReplayMaxDifferencePa,
  wallTimeMs: performance.now() - begun, output }));
