import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { ACTIVATION_HUXLEY_RESEARCH_V1, activationHuxleyNominalStressV1,
  activationHuxleySteadyActivationV1, activationHuxleyForceVelocityRatioV1,
  equilibrateActivationHuxleyV1, stepActivationHuxleyV1,
  type ActivationHuxleyParametersV1, type ActivationHuxleyStateV1,
  equilibrateCalciumExposureHuxleyV1, stepCalciumExposureHuxleyV1, calciumExposureHuxleyNominalStressV1,
  type CalciumExposureHuxleyStateV1,
} from "@/engine/myocardium/experiments/ActivationHuxleyResearchV1";
import { equilibratePopulationMomentV1 } from "@/engine/myocardium/experiments/LandPopulationMomentResearchV1";
import { solveLand2017BackwardEulerStep } from "@/engine/myocardium/myofilament/land2017";
import { land2017LengthFactor } from "@/engine/myocardium/myofilament/land2017/equations";
import { LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V1 as sourceLand } from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { evaluateFiveWallNormalCalciumDriveV1, type FiveWallNormalCalciumDriveParamsV1 } from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import { resolveMainWireVentricularCalciumMatchedAlphaExactPersistenceV1 as sourceCa } from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1";

const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== "--source-result" || args[2] !== "--output") {
  throw new Error("Usage: --source-result SOURCE-LAND-closed-loop.json --output NEW-directory");
}
const sourcePath = resolve(args[1]!), output = resolve(args[3]!);
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const raw = await readFile(sourcePath, "utf8");
type Recorded = { status: string; construction: { calcium: FiveWallNormalCalciumDriveParamsV1; landSlackStretch: number;
  landParameters: typeof sourceLand }; materialReplay: { trace: {
    acceptedDtSec: number; freeCalciumUMByWall: { LVFW: number }; valveFlowMlPerSec: { AoV: number };
  }[]; samples: { mechanicsReadback: { effectiveFiberLogStrainByWall: { LVFW: number } } }[] } };
const source = JSON.parse(raw) as Recorded;
if (source.status !== "research-period1-converged"
  || source.construction.landParameters.strongBridgeDeactivationExit !== undefined
  || !Object.entries(sourceLand.values).every(([k, v]) => source.construction.landParameters.values[k as keyof typeof sourceLand.values] === v)
  || !Object.entries(sourceLand.derived).every(([k, v]) => source.construction.landParameters.derived[k as keyof typeof sourceLand.derived] === v)
  || source.materialReplay.trace.length !== source.materialReplay.samples.length) {
  throw new Error("requires a complete converged source-Land material cycle");
}
const { CaT50Ref, beta1, nTRPN, TRPN50, nTm, beta0, Tref } = sourceLand.values;
const base: ActivationHuxleyParametersV1 = {
  regulatoryTimeConstantSec: .03, basalTurnoverPerSec: 134.31,
  velocityDetachment: 25.184, distortionCoupling: 32.653 / .778,
  steadyForce: { CaT50Ref, beta1, nTRPN, TRPN50, nTm, beta0, Tref },
};
const protocol = {
  id: ACTIVATION_HUXLEY_RESEARCH_V1, createdAt: new Date().toISOString(), sourcePath, sourceSha256: sha(raw),
  purpose: "test a different 3-state material structure before any organ adapter or baseline fitting",
  extension: "after recruitment-lag result, compare exposure-lag with identical static force and XB law; independently refit the same one time constant; no clinical target used",
  sourceSteadyForce: "Land whole-organ equilibrium force-Ca-length curve retained algebraically, not human validation",
  xbRateProvenance: {
    doi: "10.1371/journal.pcbi.1008294", sourceUrl: "https://github.com/FrancescoRegazzoni/cardiac-activation/blob/26f05df28891df7b3c69f16bb136cdced6b63c4d/params/params_RDQ20-MF_human_body-temperature.json",
    fields: { r0: 134.31, alpha: 25.184, mu0_fP: 32.653, mu1_fP: .778 },
    transfer: "XB rates in published human set transferred from rat room-temperature calibration; not measured human normal limits",
    reducedMomentReferenceDoi: "10.1007/s10013-020-00433-z",
    velocityReference: "v=-d(lambda)/dt; assumes a material reference-length mapping, not a measured human sarcomere-length transfer",
    copiedRDQ20Regulation: false, equalRDQ20ModelClaimed: false,
  },
  baseParameters: base,
  fit: { freeVariables: ["one regulatory time constant per regulation order"], gridMs: { minimum: 1, maximum: 120, step: 1 },
    data: "source Land simulated full isometric trace, source-fit HR70 Ca, lambda 1/1.1/1.166, 1ms; not experimental observations",
    objective: "equal per-length mean squared nominal stress error divided by each source trace peak squared; no amplitude adjustment",
    clinicalOutputsUsed: false, candidatePressureUsed: false },
  holdouts: { hr: [60, 70], lengths: [1, 1.1, 1.166, 1.166 * .98, 1.166 * 1.02],
    ca: "source-fit HR60/70 and preceding research alpha-dilated HR70", dtSec: [.002, .001, .0005] },
  ramps: { stretches: [1.1, 1.166], calciumUM: [.3, .6], shortening: [[-.02, .01], [-.1, .1]],
    following: "100ms hold, re-lengthen over original ramp duration, 200ms hold; state never reset" },
  recordedPath: "source-Land own LVFW Ca/stretch, and length-scaled-by-1.1/1.166 counterfactual; each law owns its own periodic state",
  tail: "200ms from each own component state at the SAME recorded AV closure; hold lambda with actual Ca or immediate floor Ca; not a new organ IRT",
  periodic: { absoluteStateTolerance: 1e-10, consecutive: 3, maximumCycles: 80 },
  numerical: "full BE at endpoint inputs, dt refined; no hidden substeps, force clipping, state reset or pressure smoothing",
  priorPreservationScreen: { trainingAndHeldoutWholeTraceRmseOverPeakMax: .1,
    role: "prospective engineering model-reduction fidelity screen only, not a physiological mint gate" },
  publicModelChanged: false, afterloadStressTest: false, automaticAcceptance: false,
};
await mkdir(dirname(output), { recursive: true }); await mkdir(output);
await writeFile(`${output}/protocol.json`, JSON.stringify(protocol, null, 2), { flag: "wx" });
const ownedPaths = ["tools/scientific/runActivationHuxleyResearchV1.ts", "engine/myocardium/experiments/ActivationHuxleyResearchV1.ts",
  "engine/myocardium/experiments/LandPopulationMomentResearchV1.ts",
  ...["parameterSets", "equations", "solver", "residual", "outputs", "types"].map(x => `engine/myocardium/myofilament/land2017/${x}.ts`),
  "engine/myocardium/calcium/fiveWallNormalCalciumDriveV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaExactPersistenceV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1.ts",
  "engine/myocardium/calcium/MainWireVentricularCalciumSourceFitAnchorV1.ts",
  "engine/myocardium/calcium/exactEventPrescribedCalciumV1.ts"];
await writeFile(`${output}/source-snapshot.json`, JSON.stringify({
  head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  files: await Promise.all(ownedPaths.map(async path => {
    const text = await readFile(path, "utf8"); return { path, sha256: sha(text), text };
  })),
}, null, 2), { flag: "wx" });

type State = Float64Array | ActivationHuxleyStateV1 | CalciumExposureHuxleyStateV1;
type Sample = { t: number; dt: number; ca: number; stretch: number };
type Row = Sample & { nominalPa: number; kirchhoffPa: number; workJPerM3: number; state: number[]; steadyActivation: number };
type Family = { id: string; parameters: ActivationHuxleyParametersV1 | null; regulation?: "recruitment-lag" | "exposure-lag" };
const control: Family = { id: "source-land", parameters: null };
function initial(f: Family, s: Sample): State {
  if (f.parameters) return f.regulation === "exposure-lag" ? equilibrateCalciumExposureHuxleyV1(s.ca, s.stretch, f.parameters)
    : equilibrateActivationHuxleyV1(s.ca, s.stretch, f.parameters);
  const a = equilibratePopulationMomentV1(s.ca, s.stretch, sourceLand);
  return Float64Array.of(a.caTroponin, a.blocked, a.weak, a.strong, 0, 0);
}
function vector(s: State): number[] { return s instanceof Float64Array ? [...s]
  : ["activation" in s ? s.activation : s.calciumExposureUM, s.attachedNormalized, s.forceMomentNormalized]; }
function fromVector(f: Family, v: number[]): State { return f.parameters
  ? { ...(f.regulation === "exposure-lag" ? { calciumExposureUM: v[0]! } : { activation: v[0]! }), attachedNormalized: v[1]!, forceMomentNormalized: v[2]! } : Float64Array.from(v); }
function step(f: Family, previous: State, s: Sample, oldStretch: number): State {
  if (!(previous instanceof Float64Array)) {
    const input = { calciumUM: s.ca, stretch: s.stretch, stretchRatePerSec: (s.stretch - oldStretch) / s.dt };
    return "activation" in previous ? stepActivationHuxleyV1(previous, input, s.dt, f.parameters!)
      : stepCalciumExposureHuxleyV1(previous, input, s.dt, f.parameters!);
  }
  const r = solveLand2017BackwardEulerStep(previous, { freeCalciumUM: s.ca,
    previousFiberEngineeringStrain: oldStretch - 1, stageFiberEngineeringStrain: s.stretch - 1,
    dtSec: s.dt, stage: { scheme: "BE", stageIndex: 0 } }, {}, sourceLand);
  if (!r.ok) throw new Error(`source component failure ${r.failureMessage}`);
  return r.nextState;
}
function force(f: Family, s: State, stretch: number) {
  return s instanceof Float64Array ? sourceLand.values.Tref / sourceLand.values.rs * land2017LengthFactor(stretch, sourceLand.values)
    * (s[3]! * (1 + s[5]!) + s[2]! * s[4]!) : "activation" in s ? activationHuxleyNominalStressV1(s, stretch, f.parameters!)
      : calciumExposureHuxleyNominalStressV1(s, stretch, f.parameters!);
}
function run(f: Family, state: State, samples: Sample[], previousStretch: number) {
  const rows: Row[] = [];
  for (const s of samples) {
    state = step(f, state, s, previousStretch);
    const nominalPa = force(f, state, s.stretch);
    rows.push({ ...s, nominalPa, kirchhoffPa: s.stretch * nominalPa, workJPerM3: -nominalPa * (s.stretch - previousStretch),
      state: vector(state), steadyActivation: activationHuxleySteadyActivationV1(s.ca, s.stretch, base) });
    previousStretch = s.stretch;
  }
  return { state, rows };
}
function periodic(f: Family, samples: Sample[]) {
  const last = samples.at(-1)!; let state = initial(f, last), consecutive = 0;
  for (let cycles = 1; cycles <= 80; ++cycles) {
    const before = vector(state), next = run(f, state, samples, last.stretch); state = next.state;
    const closure = Math.max(...vector(state).map((x, i) => Math.abs(x - before[i]!)));
    consecutive = closure < 1e-10 ? consecutive + 1 : 0;
    if (consecutive === 3) return { familyId: f.id, cycles, closure, rows: next.rows, metrics: summary(next.rows) };
  }
  throw new Error(`${f.id} component periodicity failed`);
}
function summary(rows: Row[]) {
  const peak = Math.max(...rows.map(x => x.nominalPa)), minimum = Math.min(...rows.map(x => x.nominalPa));
  const index = rows.findIndex(x => x.nominalPa === peak), pt = rows[index]!.t, duration = rows.at(-1)!.t;
  const relaxation = (rem: number) => {
    const level = minimum + rem * (peak - minimum);
    for (let j = index + 1; j < index + rows.length; j++) {
      const a = rows[(j - 1) % rows.length]!, b = rows[j % rows.length]!;
      if (a.nominalPa > level && b.nominalPa <= level) {
        return 1000 * (b.t + (j >= rows.length ? duration : 0) - pt
          - b.dt * (level - b.nominalPa) / (a.nominalPa - b.nominalPa));
      }
    }
    return null;
  };
  return { peakNominalPa: peak, minimumNominalPa: minimum, peakTimeMs: pt * 1000,
    rt50Ms: relaxation(.5), rt95Ms: relaxation(.05), workJPerM3: rows.reduce((s, x) => s + x.workJPerM3, 0) };
}
function grid(cycle: number, dt: number, at: (t: number) => { ca: number; stretch: number }): Sample[] {
  const count = Math.ceil(cycle / dt), h = cycle / count;
  return Array.from({ length: count }, (_, i) => ({ t: (i + 1) * h, dt: h, ...at((i + 1) * h) }));
}
const driveList = [{ id: "source-HR70", p: sourceCa(70) }, { id: "source-HR60", p: sourceCa(60) },
  { id: "research-alpha-dilated-HR70", p: source.construction.calcium }];
const isoSamples = (p: FiveWallNormalCalciumDriveParamsV1, stretch: number, dt: number) => grid(p.cycleLengthSec, dt,
  t => ({ ca: evaluateFiveWallNormalCalciumDriveV1(t, p).freeCalciumUMByWall.LVFW, stretch }));
const rmse = (a: Row[], b: Row[]) => {
  if (a.length !== b.length || a.some((r, i) => Math.abs(r.t - b[i]!.t) > 1e-9)) throw new Error("unaligned component comparison");
  const peak = Math.max(...a.map(x => Math.abs(x.nominalPa)));
  return Math.sqrt(a.reduce((s, r, i) => s + (r.nominalPa - b[i]!.nominalPa) ** 2 * r.dt, 0) / a.at(-1)!.t) / peak;
};
const began = performance.now();
const training = [1, 1.1, 1.166].map(stretch => {
  const samples = isoSamples(sourceCa(70), stretch, .001);
  return { stretch, samples, reference: periodic(control, samples) };
});
const fitting = (["recruitment-lag", "exposure-lag"] as const).flatMap(regulation => Array.from({ length: 120 }, (_, i) => {
  const tau = (i + 1) / 1000, f = { id: `fit-${regulation}-tau-${i + 1}ms`, regulation, parameters: { ...base, regulatoryTimeConstantSec: tau } };
  const errors = training.map(t => rmse(t.reference.rows, periodic(f, t.samples).rows));
  return { regulation, tauSec: tau, perLengthRmseOverPeak: errors, meanSquaredError: errors.reduce((s, x) => s + x * x, 0) / errors.length };
}));
const selected = (["recruitment-lag", "exposure-lag"] as const).map(mode => fitting.filter(x => x.regulation === mode)
  .reduce((a, b) => b.meanSquaredError < a.meanSquaredError ? b : a));
const families: Family[] = [control, { id: "two-moment-algebraic-regulation-control", parameters: { ...base, regulatoryTimeConstantSec: 0 } },
  ...selected.map(s => ({ id: s.regulation === "recruitment-lag" ? "three-state-fitted-regulation" : "three-state-exposure-lag",
    regulation: s.regulation, parameters: { ...base, regulatoryTimeConstantSec: s.tauSec } }))];
const isometric = driveList.flatMap(d => [.002, .001, .0005].flatMap(dt => [1, 1.1, 1.166, 1.166 * .98, 1.166 * 1.02].flatMap(stretch => {
  const samples = isoSamples(d.p, stretch, dt), reference = periodic(control, samples);
  return families.map(f => {
    const result = f.parameters ? periodic(f, samples) : reference;
    return { driveId: d.id, requestedDtSec: dt, stretch, ...result, rmseOverSourcePeak: rmse(reference.rows, result.rows),
      timeToPeakFromCaOnsetMs: result.metrics.peakTimeMs - d.p.ventricular.electricalToCalciumDelaySec * 1000 };
  });
})));

const recordedCycle = source.construction.calcium.cycleLengthSec;
let time = 0;
const recorded = source.materialReplay.trace.map((s, i) => ({ t: time += s.acceptedDtSec,
  ca: s.freeCalciumUMByWall.LVFW, stretch: source.construction.landSlackStretch
    * Math.exp(source.materialReplay.samples[i]!.mechanicsReadback.effectiveFiberLogStrainByWall.LVFW),
  flow: s.valveFlowMlPerSec.AoV }));
if (Math.abs(time - recordedCycle) > 1e-8) throw new Error("incomplete recorded cycle");
const nodes = [{ ...recorded.at(-1)!, t: 0 }, ...recorded];
function recordedAt(t: number, scale = 1) {
  t = ((t % recordedCycle) + recordedCycle) % recordedCycle;
  let lo = 0, hi = nodes.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (nodes[m]!.t < t) lo = m; else hi = m; }
  const a = nodes[lo]!, b = nodes[hi]!, u = (t - a.t) / (b.t - a.t);
  return { ca: a.ca + u * (b.ca - a.ca), stretch: scale * (a.stretch + u * (b.stretch - a.stretch)) };
}
const forward = recorded.flatMap((r, i) => r.flow > 0 ? [i] : []);
if (!forward.length || forward.some((x, i) => i > 0 && x !== forward[i - 1]! + 1)) throw new Error("single complete AV episode required");
const recordedClosureSec = recorded[forward.at(-1)! + 1]!.t;
const paths = [.002, .001, .0005].flatMap(dt => [1, 1.1 / 1.166].flatMap(lengthScale => families.map(f => {
  const samples = grid(recordedCycle, dt, t => recordedAt(t, lengthScale));
  return { requestedDtSec: dt, lengthScale, ...periodic(f, samples) };
})));
const tails = paths.flatMap(path => {
  const f = families.find(f => f.id === path.familyId)!;
  const start = path.rows.find(r => r.t >= recordedClosureSec)!;
  return ["actual-Ca", "floor-Ca"].map(mode => {
    const samples = grid(.2, path.requestedDtSec, t => ({ stretch: start.stretch,
      ca: mode === "floor-Ca" ? source.construction.calcium.ventricular.diastolicCalciumUM : recordedAt(start.t + t).ca }));
    const trial = run(f, fromVector(f, start.state), samples, start.stretch);
    const relativeAt = (t: number) => {
      const i = trial.rows.findIndex(r => r.t >= t - 1e-12), b = trial.rows[i]!, a = i === 0
        ? { ...start, t: 0 } : trial.rows[i - 1]!;
      return (a.nominalPa + (b.nominalPa - a.nominalPa) * (t - a.t) / (b.t - a.t)) / start.nominalPa;
    };
    return { familyId: f.id, lengthScale: path.lengthScale, requestedDtSec: path.requestedDtSec, mode,
      recordedClosureSec, startTimeSec: start.t, initialNominalPa: start.nominalPa, initialCaUM: start.ca,
      initialStretch: start.stretch, remaining50ms: relativeAt(.05), remaining100ms: relativeAt(.1),
      remaining200ms: relativeAt(.2), rows: trial.rows };
  });
});
const ramps = [.002, .001, .0005].flatMap(dt => [1.1, 1.166].flatMap(stretch => [.3, .6].flatMap(ca =>
  [[-.02, .01], [-.1, .1]].flatMap(([delta, duration]) => families.map(f => {
    const t1 = duration!, t2 = t1 + .1, t3 = t2 + duration!, end = t3 + .2;
    // Exact segment boundaries; no dt-dependent delay of the imposed motion.
    const samples = [[0, t1], [t1, t2], [t2, t3], [t3, end]].flatMap(([a, b]) =>
      grid(b! - a!, dt, t => ({ ca, stretch: stretch * (1 + delta! * (a === 0 ? t / duration!
        : a === t1 ? 1 : a === t2 ? 1 - t / duration! : 0)) })).map(s => ({ ...s, t: s.t + a! })));
    const state = initial(f, { t: 0, dt, ca, stretch }), initialPa = force(f, state, stretch);
    const result = run(f, state, samples, stretch);
    return { familyId: f.id, requestedDtSec: dt, stretch, ca, relativeLengthChange: delta, durationSec: duration,
      initialPa, minimumForceRatio: Math.min(...result.rows.map(r => r.nominalPa)) / initialPa,
      endShorteningForceRatio: result.rows.find(r => Math.abs(r.t - t1) < 1e-10)!.nominalPa / initialPa,
      endRelengtheningForceRatio: result.rows.find(r => Math.abs(r.t - t3) < 1e-10)!.nominalPa / initialPa,
      rows: result.rows };
  }))))) ;
const fidelity = families.filter(f => f.regulation).map(f => {
  const values = isometric.filter(x => x.familyId === f.id && x.requestedDtSec === .001);
  return { familyId: f.id, maximumRmseOverPeak: Math.max(...values.map(x => x.rmseOverSourcePeak)),
    passed: values.every(x => x.rmseOverSourcePeak <= protocol.priorPreservationScreen.trainingAndHeldoutWholeTraceRmseOverPeakMax) };
});
const result = { protocolId: protocol.id, numericalWallTimeSec: (performance.now() - began) / 1000,
  selected, fitting, families, isometric, paths, tails, ramps,
  staticForceVelocity: Array.from({ length: 41 }, (_, i) => ({ shorteningPerSec: i / 5,
    forceOverIsometric: activationHuxleyForceVelocityRatioV1(i / 5, base) })),
  priorPreservationScreen: { perFamily: fidelity, physiologicalQualification: false, automaticPromotion: false },
};
await writeFile(`${output}/results.json`, JSON.stringify(result), { flag: "wx" });
console.log(JSON.stringify({ output, selected, screen: result.priorPreservationScreen,
  numericalWallTimeSec: result.numericalWallTimeSec,
  counts: { calibration: fitting.length * training.length, isometric: isometric.length, paths: paths.length, tails: tails.length, ramps: ramps.length } }, null, 2));
