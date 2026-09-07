import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  equilibratePopulationMomentV1, populationMomentNominalStressV1, stepPopulationMomentV1,
  LAND_POPULATION_MOMENT_RESEARCH_V1, type PopulationMomentStateV1,
  type PopulationMomentRecoveryV1,
} from "@/engine/myocardium/experiments/LandPopulationMomentResearchV1";
import { solveLand2017BackwardEulerStep } from "@/engine/myocardium/myofilament/land2017";
import { land2017LengthFactor } from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as sourceLand,
  deriveLand2017DerivedParameters, stableHash, type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { evaluateFiveWallNormalCalciumDriveV1,
  type FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1 } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";

type Family = { id: string; group: string; kind: "land" | "moment";
  recovery?: PopulationMomentRecoveryV1; parameters: Land2017SourceParameterSet };
type Sample = { dt: number; stretch: number; ca: number; flow?: number };
type State = Float64Array | PopulationMomentStateV1;
type RecordRow = { time: number; dt: number; stretch: number; ca: number; nominal: number;
  kirchhoff: number; work: number; strongStress: number; distortionStress: number;
  caTroponin: number; blocked: number; weak: number; strong: number;
  weakMoment: number; strongMoment: number; weakMean: number; strongMean: number;
  flow?: number; state: number[] };
type SourceResult = {
  status: string;
  construction: { landParameters: Land2017SourceParameterSet; calciumDriveParams: FiveWallNormalCalciumDriveParamsV1 };
  mechanismReplay: { samples: { acceptedDtSec: number; freeCalciumUMByWall: { LVFW: number };
    valveFlowMlPerSec: { AoV: number };
    material: { walls: { LVFW: { landStretch: number } } } }[] };
};
const args = process.argv.slice(2), sha = (s: string) => createHash("sha256").update(s).digest("hex");
if (args.length !== 4 || args[0] !== "--source-result" || args[2] !== "--output") {
  throw new Error("Usage: --source-result settled-research.result.json --output NEW-directory");
}
const sourcePath = resolve(args[1]!), output = resolve(args[3]!);
const raw = await readFile(sourcePath, "utf8"), source = JSON.parse(raw) as SourceResult;
if (source.status !== "settled" || !source.mechanismReplay?.samples?.length) throw new Error("complete settled material cycle required");
const cycle = source.construction.calciumDriveParams.cycleLengthSec;
if (Math.abs(cycle - 60 / 70) > 1e-10) throw new Error("comparison is frozen at HR70");
const { strongBridgeDeactivationExit: _exit, parameterSetStableHash: _old,
  ...slowBase } = source.construction.landParameters;
const slowInput = { ...slowBase, parameterSetId: "selected-slow-no-exit-component-control" };
const groups = [sourceLand, { ...slowInput, parameterSetStableHash: stableHash(slowInput) }];
const families: Family[] = groups.flatMap((p, i) => {
  const group = i === 0 ? "source" : "selected-slow-no-exit";
  const { parameterSetStableHash: _hash, ...base } = p;
  const values = { ...p.values, phi: 1 };
  const phi1 = { ...base, parameterSetId: `${group}-phi1-counterfactual`, values,
    derived: deriveLand2017DerivedParameters(values),
    sourceParameters: p.sourceParameters.map(v => v.parameter === "phi" ? { ...v,
      location: "research control: phi=1, not published calibrated source value",
      runtime: { ...v.runtime, value: 1 } } : v) };
  return [
    { id: `${group}-land`, group, kind: "land", parameters: p },
    { id: `${group}-land-phi1`, group, kind: "land", parameters: { ...phi1, parameterSetStableHash: stableHash(phi1) } },
    { id: `${group}-moment`, group, kind: "moment", parameters: p },
    { id: `${group}-moment-phi`, group, kind: "moment", recovery: "source-phi-turnover-closure", parameters: p },
  ];
});
const drives = [
  { id: "source-fit-HR70", parameters: resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1(70) },
  { id: "research-alpha-dilated", parameters: source.construction.calciumDriveParams },
];
const steps = [.002, .001, .0005];
const protocol = {
  id: LAND_POPULATION_MOMENT_RESEARCH_V1, createdAt: new Date().toISOString(), sourcePath, sourceSha256: sha(raw),
  families, drives, requestedDtSec: steps, isometricStretches: [1, 1.1, 1.166],
  shortening: { initialStretches: [1.1, 1.166], calciumUM: [.3, .6], relativeLengthChange: [-.02, -.1],
    rampDurationSec: [.02, .1], holdDurationSec: .3, tailCalcium: ["held", "floor-0.164321"] },
  path: "piecewise-linear interpolation of recorded LVFW Ca/stretch; optional length map 1.1/1.166; NOT a new coupled PV loop",
  tail: "from each own periodic component state at old recorded AV closure; fixed length with held/floor Ca for 250ms; AV event is assay selection only",
  period1: { tolerance: 1e-10, consecutive: 3, maximumCycles: 80 },
  scheme: "moment first-order frozen-detachment implicit flux; Land full BE; no hidden substeps/projections",
  scientificScope: "own mean-detachment closure; optional phi-turnover is an additional phenomenological relaxation, not strict moment balance, RDQ20, human validation, full ATP thermodynamics or organ IRT/ET",
  publicModelChanged: false, afterloadStressTest: false, automaticAcceptance: false,
  primarySources: ["https://doi.org/10.1016/j.yjmcc.2017.03.008", "https://doi.org/10.1371/journal.pcbi.1008294"],
};
await mkdir(dirname(output), { recursive: true });
await mkdir(output);
const protocolText = JSON.stringify(protocol, null, 2);
await writeFile(`${output}/protocol.json`, protocolText, { flag: "wx" });
const paths = ["tools/scientific/runLandPopulationMomentResearchV1.ts",
  "engine/myocardium/experiments/LandPopulationMomentResearchV1.ts",
  "engine/myocardium/myofilament/land2017/equations.ts", "engine/myocardium/myofilament/land2017/parameterSets.ts",
  "engine/myocardium/myofilament/land2017/solver.ts", "engine/myocardium/myofilament/land2017/outputs.ts",
  "engine/myocardium/myofilament/land2017/types.ts", "engine/myocardium/myofilament/land2017/residual.ts",
  "engine/myocardium/calcium/fiveWallNormalCalciumDriveV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1.ts",
  "engine/myocardium/calcium/exactEventPrescribedCalciumV1.ts"];
await writeFile(`${output}/source-snapshot.json`, JSON.stringify({
  head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  files: await Promise.all(paths.map(async path => ({ path, sha256: sha(await readFile(path, "utf8")) }))),
}, null, 2), { flag: "wx" });

function initial(f: Family, ca: number, stretch: number): State {
  const s = equilibratePopulationMomentV1(ca, stretch, f.parameters);
  return f.kind === "moment" ? s : Float64Array.of(s.caTroponin, s.blocked, s.weak, s.strong, 0, 0);
}
function vector(s: State): number[] { return s instanceof Float64Array ? Array.from(s)
  : [s.caTroponin, s.blocked, s.weak, s.strong, s.weakMoment, s.strongMoment]; }
function row(f: Family, state: State, s: Sample, previousStretch: number, time: number): RecordRow {
  const land = state instanceof Float64Array;
  const caTroponin = land ? state[0]! : state.caTroponin, blocked = land ? state[1]! : state.blocked;
  const weak = land ? state[2]! : state.weak, strong = land ? state[3]! : state.strong;
  const weakMoment = land ? weak * state[4]! : state.weakMoment;
  const strongMoment = land ? strong * state[5]! : state.strongMoment;
  const scale = land2017LengthFactor(s.stretch, f.parameters.values) * f.parameters.values.Tref / f.parameters.values.rs;
  const nominal = land ? scale * (strong + strongMoment + weakMoment)
    : populationMomentNominalStressV1(state, s.stretch, f.parameters);
  return { ...s, time, nominal, kirchhoff: s.stretch * nominal,
    work: -nominal * (s.stretch - previousStretch),
    strongStress: s.stretch * scale * strong, distortionStress: s.stretch * scale * (weakMoment + strongMoment),
    caTroponin, blocked, weak, strong, weakMoment, strongMoment,
    weakMean: land ? state[4]! : weak === 0 ? 0 : weakMoment / weak,
    strongMean: land ? state[5]! : strong === 0 ? 0 : strongMoment / strong, state: vector(state) };
}
function advance(f: Family, state: State, s: Sample, previousStretch: number): State {
  if (!(state instanceof Float64Array)) return stepPopulationMomentV1(state,
    { calciumUM: s.ca, stretch: s.stretch, stretchRatePerSec: (s.stretch - previousStretch) / s.dt }, s.dt, f.parameters, f.recovery);
  const result = solveLand2017BackwardEulerStep(state, { freeCalciumUM: s.ca,
    previousFiberEngineeringStrain: previousStretch - 1, stageFiberEngineeringStrain: s.stretch - 1,
    dtSec: s.dt, stage: { scheme: "BE", stageIndex: 0 } }, {}, f.parameters);
  if (!result.ok) throw new Error(`${f.id}: ${result.failureMessage}`);
  return result.nextState;
}
function summarize(rows: RecordRow[]) {
  const peak = Math.max(...rows.map(r => r.kirchhoff)), minimum = Math.min(...rows.map(r => r.kirchhoff));
  const peakIndex = rows.findIndex(r => r.kirchhoff === peak), peakTime = rows[peakIndex]!.time;
  const duration = rows.at(-1)!.time;
  const relaxation = (remaining: number) => {
    const level = minimum + remaining * (peak - minimum);
    for (let j = 1; j < rows.length; ++j) {
      const a = rows[(peakIndex + j - 1) % rows.length]!, b = rows[(peakIndex + j) % rows.length]!;
      if (a.kirchhoff > level && b.kirchhoff <= level) return 1000 * (b.time
        + (peakIndex + j >= rows.length ? duration : 0) - b.dt * (level - b.kirchhoff) / (a.kirchhoff - b.kirchhoff) - peakTime);
    }
    return null;
  };
  return { peakPa: peak, minimumPa: minimum, peakTimeMs: 1000 * peakTime,
    relaxation50Ms: relaxation(.5), relaxation95Ms: relaxation(.05),
    shorteningWorkJPerM3: rows.reduce((a, r) => a + r.work, 0),
    maxAbsWeakMean: Math.max(...rows.map(r => Math.abs(r.weakMean))),
    maxAbsStrongMean: Math.max(...rows.map(r => Math.abs(r.strongMean))),
    minimumPopulation: Math.min(...rows.map(r => Math.min(r.blocked, r.weak, r.strong, 1 - r.blocked - r.weak - r.strong))) };
}
function periodic(f: Family, samples: Sample[]) {
  const last = samples.at(-1)!;
  if (Math.abs(samples.reduce((a, s) => a + s.dt, 0) - cycle) > 1e-7) throw new Error("incomplete material cycle");
  let state = initial(f, last.ca, last.stretch), previousStretch = last.stretch, consecutive = 0, closure = Infinity;
  for (let cycles = 1; cycles <= 80; ++cycles) {
    const before = vector(state); let time = 0; const records = [];
    for (const s of samples) {
      state = advance(f, state, s, previousStretch); time += s.dt;
      records.push(row(f, state, s, previousStretch, time)); previousStretch = s.stretch;
    }
    closure = Math.max(...vector(state).map((v, i) => Math.abs(v - before[i]!)));
    consecutive = closure < 1e-10 ? consecutive + 1 : 0;
    if (consecutive === 3) return { familyId: f.id, cycles, closure, ...summarize(records), records };
  }
  throw new Error(`${f.id}: period1 failure ${closure}`);
}

const began = performance.now();
const isometric = drives.flatMap(drive => steps.flatMap(requestedDt => {
  const n = Math.ceil(cycle / requestedDt), dt = cycle / n;
  return [1, 1.1, 1.166].flatMap(stretch => families.map(f => ({ driveId: drive.id, requestedDt, stretch,
    ...periodic(f, Array.from({ length: n }, (_, i) => ({ dt, stretch,
      ca: evaluateFiveWallNormalCalciumDriveV1((i + 1) * dt, drive.parameters).freeCalciumUMByWall.LVFW }))) })));
}));
const shortening = [.02, .1].flatMap(relativeDrop => [1.1, 1.166].flatMap(startStretch => [.3, .6].flatMap(calciumUM => [.02, .1].flatMap(rampSec =>
  [false, true].flatMap(calciumOff => steps.flatMap(requestedDt => families.map(f => {
    const n = Math.round((rampSec + .3) / requestedDt), dt = (rampSec + .3) / n;
    let state = initial(f, calciumUM, startStretch), previousStretch = startStretch;
    const start = row(f, state, { dt: 0, stretch: startStretch, ca: calciumUM }, startStretch, 0), records = [start];
    for (let i = 1; i <= n; ++i) {
      const time = i * dt;
      const s = { dt, stretch: startStretch * (1 - relativeDrop * Math.min(time / rampSec, 1)),
        ca: calciumOff && time > rampSec + 1e-12 ? .164321 : calciumUM };
      state = advance(f, state, s, previousStretch);
      records.push(row(f, state, s, previousStretch, time)); previousStretch = s.stretch;
    }
    const at = (t: number) => records.reduce((a, b) => Math.abs(a.time - t) < Math.abs(b.time - t) ? a : b);
    const stop = at(rampSec), tail = records.filter(r => r.time > rampSec + 1e-12);
    return { familyId: f.id, relativeDrop, startStretch, calciumUM, rampSec, calciumOff, requestedDt,
      initialStressPa: start.kirchhoff, stopStressPa: stop.kirchhoff,
      stress50msAfterStopPa: at(rampSec + .05).kirchhoff, stress100msAfterStopPa: at(rampSec + .1).kirchhoff,
      stress250msAfterStopPa: at(rampSec + .25).kirchhoff,
      reboundAfterStopPa: Math.max(0, ...tail.map(r => r.kirchhoff - stop.kirchhoff)),
      minimumPa: Math.min(...records.map(r => r.kirchhoff)), records };
  })))))));
const sourceSamples: Sample[] = source.mechanismReplay.samples.map(s => ({ dt: s.acceptedDtSec,
  stretch: s.material.walls.LVFW.landStretch, ca: s.freeCalciumUMByWall.LVFW, flow: s.valveFlowMlPerSec.AoV }));
function resample(requestedDt: number, ratio: number): Sample[] {
  return sourceSamples.flatMap((s, i) => {
    const before = sourceSamples[(i + sourceSamples.length - 1) % sourceSamples.length]!;
    const n = Math.ceil(s.dt / requestedDt - 1e-10);
    return Array.from({ length: n }, (_, j) => ({ dt: s.dt / n,
      stretch: ratio * (before.stretch + (s.stretch - before.stretch) * (j + 1) / n),
      ca: before.ca + (s.ca - before.ca) * (j + 1) / n, flow: s.flow }));
  });
}
const prescribedPath = [1, 1.1 / 1.166].flatMap(stretchMapRatio => steps.flatMap(requestedDt =>
  families.map(f => ({ requestedDt, stretchMapRatio, ...periodic(f, resample(requestedDt, stretchMapRatio)) }))));
const tailAssays = prescribedPath.filter(p => p.stretchMapRatio === 1).flatMap(replay => {
  const f = families.find(f => f.id === replay.familyId)!;
  const closureIndex = replay.records.reduce((i, r, j) => r.flow! > 0 ? j : i, -1) + 1;
  if (closureIndex <= 1 || closureIndex >= replay.records.length) throw new Error("tail requires recorded closure");
  const start = replay.records[closureIndex]!;
  return [false, true].map(calciumOff => {
    let state: State = f.kind === "land" ? Float64Array.from(start.state) : {
      caTroponin: start.caTroponin, blocked: start.blocked, weak: start.weak, strong: start.strong,
      weakMoment: start.weakMoment, strongMoment: start.strongMoment };
    const n = Math.ceil(.25 / replay.requestedDt), dt = .25 / n, records = [];
    for (let i = 1; i <= n; ++i) {
      const s = { dt, stretch: start.stretch, ca: calciumOff ? .164321 : start.ca };
      state = advance(f, state, s, start.stretch); records.push(row(f, state, s, start.stretch, i * dt));
    }
    const at = (t: number) => records.reduce((a, b) => Math.abs(a.time - t) < Math.abs(b.time - t) ? a : b);
    return { familyId: f.id, requestedDt: replay.requestedDt, calciumOff, start,
      stress50MsPa: at(.05).kirchhoff, stress100MsPa: at(.1).kirchhoff, stress250MsPa: at(.25).kirchhoff,
      reboundPa: Math.max(0, ...records.map(r => r.kirchhoff - start.kirchhoff)), records };
  });
});
const result = { protocolSha256: sha(protocolText), isometric, shortening, prescribedPath, tailAssays,
  wallTimeMs: performance.now() - began };
await writeFile(`${output}/results.json`, JSON.stringify(result), { flag: "wx" });
console.log(JSON.stringify({ output, counts: { isometric: isometric.length, shortening: shortening.length,
  prescribedPath: prescribedPath.length, tailAssays: tailAssays.length }, wallTimeMs: result.wallTimeMs }));
