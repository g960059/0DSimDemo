import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { auditMainWireEjectionCouplingV1 } from "@/analysis/methods/mainWire/MainWireEjectionCouplingAuditV1";
import { observeMainWireBaselineV2 } from "@/analysis/methods/mainWire/MainWireBaselineObservationV2";
import { fixedPathInertanceMmHgSec2PerMlV1 } from "@/analysis/methods/mainWire/MainWirePrescribedFlowMomentumV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Inputs } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { MainWireIntegratedModelBeatAccumulatorV3, type MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { restoreMainWireIntegratedModelStandard70V1, type MainWireIntegratedModelStandard70CheckpointV1 as Checkpoint } from
  "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type { MainWireIntegratedModelStepResultV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { createMainWireAorticMomentumResearchV1, stepMainWireAorticMomentumResearchV1 } from
  "@/engine/myocardium/experiments/MainWireAorticMomentumResearchV1";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import { measureMainWireIntegratedModelBaselineValidationV1 } from
  "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";
import { createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  runMainWireIntegratedModelRegularSinusAllOffResearchCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3 as Fixture,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as Sample,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 as WallState } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

// One scoped constitutive contrast, not a parameter optimizer or qualification.
// Never serialize the research wrapper/base as a Standard70 checkpoint.
const { values } = parseArgs({ options: { output: { type: "string" }, evaluation: { type: "string" },
  request: { type: "string" }, "dt-sec": { type: "string", default: ".002" } } });
if (!values.output || Boolean(values.evaluation) !== Boolean(values.request)) {
  throw new Error("--output NEW_DIRECTORY [--evaluation FILE --request FILE] [--dt-sec .002|.001]");
}
const sourcePath = resolve(values.evaluation ?? "data/model-baselines/standard70-launch-baseline.json");
const sourceText = await readFile(sourcePath, "utf8"), raw = JSON.parse(sourceText), evaluation = raw.evaluation ?? raw;
const requestText = values.request ? await readFile(values.request, "utf8") : null;
const requested = requestText ? JSON.parse(requestText) : raw.candidateInputs;
const inputs: Inputs = { hemodynamicResearchInputs: requested.hemodynamicResearchInputs,
  mechanismResearchInputs: requested.mechanismResearchInputs, ventricularContractilityScale: requested.ventricularContractilityScale };
const checkpoint: Checkpoint = values.evaluation ? evaluation.exactResult.checkpoint : raw.qualificationCheckpoint;
const dt = Number(values["dt-sec"]);
if (![0.001, 0.002].includes(dt) || ![60, 70].includes(inputs.hemodynamicResearchInputs.heartRateBpm)
  || (values.evaluation && evaluation.status !== "accepted")) throw new Error("supported timestep, HR60/70 and accepted source required");
selectHotPathIntegrityTierV1("full-invariant");
const runtime = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(inputs.hemodynamicResearchInputs,
  inputs.ventricularContractilityScale, inputs.mechanismResearchInputs);
const fixture = runtime as unknown as Fixture;
const restored = await restoreMainWireIntegratedModelStandard70V1<WallState>({
  base: { ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture),
    mechanismResearchInputs: inputs.mechanismResearchInputs },
  algebraicPulmonaryRootAssemblyId: runtime.algebraicPulmonaryRootAssemblyId,
}, checkpoint);
type Success = Extract<MainWireIntegratedModelStepResultV3<WallState>, { converged: true }>;
type Detail = Sample & { aorticEffectiveAreaCm2: number; valveReadback: Success["coronaryStep"]["baseStep"]["circulationTrial"]["valveEvaluations"]["AoV"] };
let sourceStep: Success | null = null;
runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, restored.acceptedState, 1, dt, (step) => { sourceStep = step; });
if (!sourceStep) throw new Error("no unmodified source step");
const source = sourceStep as Success;
const geometry = { bloodDensityKgPerM3: 1060, equivalentLengthCm: 1.5, physicalPathAreaCm2: 4 };
const L = fixedPathInertanceMmHgSec2PerMlV1(geometry);
const output = resolve(values.output);
await mkdir(output);
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const protocol = { studyId: "main-wire-aortic-momentum-coupled-probe-v1", executionTier: "full-invariant",
  executionCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  workingTreeDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()),
  sourcePath, sourceFileSha256: sha(sourceText), requestFileSha256: requestText ? sha(requestText) : null,
  sourceCheckpointSha256: checkpoint.checkpointSha256, sourceObservedTimeSec: source.acceptedState.acceptedTimeSec,
  sourceObservedAorticFlowMlPerSec: source.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV.flowMlPerSec,
  inputs, nominalDtSec: dt, cyclesPerArm: 3, geometry,
  geometryProvenance: "illustrative uniform physical path, not fitted or established healthy reference",
  contrast: "canonical source law; research zero-L dispatch; fixed LV-to-Ao path L with forward-area momentum closure",
  preserved: "Ao_SA inertia, all vascular/material/calcium parameters, HR/TBV, event scheduler and full invariants",
  claim: "three-cycle transient constitutive comparison; not periodic qualification, causal proof of clinical abnormality, or baseline adoption",
  baselineAdopted: false, productionModelChanged: false, checkpointExported: false,
  sources: Object.fromEntries(await Promise.all([
    "tools/scientific/probeMainWireAorticMomentumV1.ts",
    "engine/myocardium/experiments/MainWireAorticMomentumResearchV1.ts",
    "engine/valves/MainWireFixedPathMomentumValveResearchV1.ts",
    "engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts",
    "engine/core/nonCoronaryCirculationBackwardEulerV1.ts",
    "engine/myocardium/MainWireFiveWallCoronaryTransactionV2.ts",
    "analysis/methods/mainWire/MainWireEjectionCouplingAuditV1.ts",
  ].map(async (path) => [path, sha(await readFile(path, "utf8"))]))),
};
await writeFile(resolve(output, "protocol.json"), JSON.stringify(protocol, null, 2), { flag: "wx" });
const results = [];
for (const arm of [{ id: "canonical", L: 0 }, { id: "zero-L", L: 0 }, { id: "fixed-L", L }]) {
  const started = performance.now();
  let state = createMainWireAorticMomentumResearchV1({ sourceStep: source,
    sourceCheckpointSha256: checkpoint.checkpointSha256, inertanceMmHgSec2PerMl: arm.L });
  let accepted = source.acceptedState;
  const accumulator = new MainWireIntegratedModelBeatAccumulatorV3(), beats: Beat[] = [], samples: Detail[] = [], cycleSummaries = [];
  const cycleTraces: Sample[][] = [];
  let failure: string | null = null;
  for (let cycle = 1; cycle <= 3; cycle++) {
    const readbacks = new Map<number, Detail["valveReadback"]>();
    const observer = (step: Success) => {
      const beat = accumulator.accept(step);
      if (beat) beats.push(beat);
      readbacks.set(step.acceptedState.acceptedTimeSec, step.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV);
    };
    try {
      const run = arm.id === "canonical"
        ? runMainWireIntegratedModelRegularSinusAllOffCycleV3(fixture, accepted, cycle, dt, observer)
        : runMainWireIntegratedModelRegularSinusAllOffResearchCycleV3(fixture, accepted, cycle, dt, (previous, input) => {
          if (previous !== state.base) throw new Error("research cycle lost atomic state ownership");
          const attempted = stepMainWireAorticMomentumResearchV1(fixture.provider, state, input);
          state = attempted.state;
          return attempted.step;
        }, observer);
      accepted = run.terminalAcceptedState;
      cycleTraces.push([...run.traceSamples]);
      for (const row of run.traceSamples) {
        const valveReadback = readbacks.get(row.acceptedTimeSec);
        if (!valveReadback) throw new Error("missing selected accepted valve readback");
        samples.push({ ...row, aorticEffectiveAreaCm2: valveReadback.activeEoaCm2, valveReadback });
      }
      const { terminalAcceptedState: _notPersisted, traceSamples: _trace, ...summary } = run;
      cycleSummaries.push(summary);
      process.stderr.write(`[momentum-probe] ${arm.id} cycle ${cycle}/3\n`);
    } catch (error) { failure = error instanceof Error ? error.message : String(error); break; }
  }
  // Use the middle observed beat: the following REAL cycle supplies its next
  // inlet closure. No periodic seam or unobserved E/A endpoint is synthesized.
  const beat = beats.length >= 2 ? beats.at(-2)! : null;
  let observation = null, audit = null, morphology = null;
  if (failure === null && beat) {
    try {
      audit = auditMainWireEjectionCouplingV1({ samples, completedBeat: beat });
      observation = observeMainWireBaselineV2({ samples, completedBeat: beat });
      const left = observation.left;
      const measured = measureMainWireIntegratedModelBaselineValidationV1(cycleTraces[1]!, {
        ejectionTimeSec: left.timing.ejectionTimeSec, inletFlow: left.inletFlow, timing: left.timing,
      });
      morphology = { LVP: measured.LVP, RVP: measured.RVP,
        caveat: "existing morphology descriptors on middle real scheduler cycle; no gate adoption" };
    } catch (error) { failure = `observation unavailable: ${error instanceof Error ? error.message : String(error)}`; }
  }
  const selected = audit?.alignedSamples.map((s) => samples[s.sourceSampleIndex]!) ?? [];
  const mean = (read: (s: Detail) => number) => {
    if (selected.length < 2) return null;
    let integral = 0;
    for (let i = 1; i < selected.length; i++) integral += (read(selected[i - 1]!) + read(selected[i]!)) / 2
      * (selected[i]!.acceptedTimeSec - selected[i - 1]!.acceptedTimeSec);
    return integral / (selected.at(-1)!.acceptedTimeSec - selected[0]!.acceptedTimeSec);
  };
  const bernoulli = (s: Detail) => s.valveReadback.bernoulliMmHgSec2PerMl2 * s.valveReadback.flowMlPerSec ** 2;
  const hydraulics = selected.length === 0 ? null : {
    meanAndPeakScope: "same strictly positive-flow sample interval as audit.gradient; not a measured Doppler gradient",
    invariantExtremaScope: "all accepted samples across all three observed cycles",
    meanBernoulliLossMmHg: mean(bernoulli), peakBernoulliLossMmHg: Math.max(...selected.map(bernoulli)),
    meanDissipativePressureMmHg: mean((s) => s.valveReadback.dissipativePressureMmHg),
    meanInertialPressureMmHg: mean((s) => "inertialPressureMmHg" in s.valveReadback ? s.valveReadback.inertialPressureMmHg : 0),
    minimumDissipativePowerMmHgMlPerSec: Math.min(...samples.map((s) => s.valveReadback.dissipativePowerMmHgMlPerSec)),
    maximumAbsoluteHydraulicBalanceResidualMmHg: Math.max(...samples.map((s) => Math.abs(s.valveReadback.hydraulicBalanceResidualMmHg))),
    maximumAbsolutePowerBalanceResidualMmHgMlPerSec: Math.max(...samples.map((s) => Math.abs(s.valveReadback.powerBalanceResidualMmHgMlPerSec))),
    maximumAbsoluteBackwardEulerEnergyBalanceResidualMmHgMl: Math.max(...samples.map((s) => "backwardEulerEnergyBalanceResidualMmHgMl" in s.valveReadback
      ? Math.abs(s.valveReadback.backwardEulerEnergyBalanceResidualMmHgMl) : 0)),
  };
  const result = { arm, wallTimeMs: performance.now() - started, failure, audit, observation, morphology, hydraulics,
    completedBeat: beat, beats, cycleSummaries, samples };
  results.push(result);
  await writeFile(resolve(output, `${arm.id}.json`), JSON.stringify(result), { flag: "wx" });
}
const [canonical, zero] = results;
const zeroLNativeTraceExactlyEqual = canonical!.failure === null && zero!.failure === null
  && canonical!.samples.length > 0 && JSON.stringify(canonical!.samples.map(({ aorticEffectiveAreaCm2: _a, valveReadback: _v, ...s }) => s))
  === JSON.stringify(zero!.samples.map(({ aorticEffectiveAreaCm2: _a, valveReadback: _v, ...s }) => s));
await writeFile(resolve(output, "summary.json"), JSON.stringify({ protocol, zeroLNativeTraceExactlyEqual,
  results: results.map(({ samples: _samples, audit, ...r }) => ({ ...r, audit: audit && { ...audit, alignedSamples: undefined } })) }, null, 2), { flag: "wx" });
if (results.every((r) => r.failure === null && r.audit !== null && r.completedBeat !== null)) {
  await writeFile(resolve(output, "comparison.svg"), renderComparison(results), { flag: "wx" });
}
process.stdout.write(`${output}/summary.json\n`);
if (!zeroLNativeTraceExactlyEqual || results.some((r) => r.failure !== null || r.audit === null)) process.exitCode = 1;

function renderComparison(all: typeof results): string {
  const arms = all.filter((r) => r.arm.id !== "zero-L");
  const colors = ["#167eae", "#d76812"];
  const panels = ["LV / Ao pressure (mmHg; Ao dashed)", "AV volumetric flow (mL/s)",
    "Raw LV minus Ao: positive-flow samples (mmHg)", "AV active EOA (cm²)",
    "LV transmural PV loop (mmHg)", "Late PV roof (mmHg; descriptive zoom)"];
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1100" viewBox="0 0 1240 1100"><rect width="1240" height="1100" fill="white"/><g font-family="Arial,sans-serif" font-size="13" fill="#25313b">';
  svg += `<text x="35" y="27" font-size="19">Coupled LV-to-Ao momentum probe · dt ${dt * 1000} ms · HR ${inputs.hemodynamicResearchInputs.heartRateBpm}</text>`;
  svg += '<text x="35" y="48">Transient research comparison — no smoothing, periodic qualification or baseline adoption</text>';
  svg += `<text x="35" y="70" fill="${colors[0]}">Current law (L=0)</text><text x="240" y="70" fill="${colors[1]}">Fixed path L=${L.toPrecision(4)} mmHg·s²/mL</text>`;
  panels.forEach((title, panel) => {
    const left = 75 + panel % 2 * 605, top = 113 + Math.floor(panel / 2) * 325, w = 505, h = 235;
    const lines = arms.flatMap((r, index) => {
      const a = r.audit!, b = r.completedBeat!;
      const rows = r.samples.filter((s) => s.acceptedTimeSec >= b.startTimeSec && s.acceptedTimeSec <= b.endTimeSec);
      const time = (s: Detail) => (s.acceptedTimeSec - a.ejection.opening.timeSec) * 1000;
      const make = (values: Array<[number, number]>, dashed = false) => ({ values, color: colors[index]!, dashed });
      if (panel === 5) return [make(a.alignedSamples.filter((s) => s.expelledVolumeFraction01! >= 0.5
        && s.expelledVolumeFraction01! <= 0.9).map((s) => [s.expelledVolumeFraction01!, s.lvTransmuralMmHg]))];
      if (panel === 2) return [make(a.alignedSamples.map((s) => [s.timeFromOpeningSec * 1000, s.signedLvAoGradientMmHg]))];
      if (panel === 4) return [make(rows.map((s) => [s.chamberVolumeMl.LV, s.transmuralPressureMmHg.LV]))];
      const ejection = rows.filter((s) => time(s) >= -20 && time(s) <= 330);
      if (panel === 0) return [make(ejection.map((s) => [time(s), s.absolutePressureMmHg.LV])),
        make(ejection.map((s) => [time(s), s.absolutePressureMmHg.Ao]), true)];
      return [make(ejection.map((s) => [time(s), panel === 1 ? s.valveFlowMlPerSec.AoV
        : s.aorticEffectiveAreaCm2]))];
    });
    const points = lines.flatMap((l) => l.values), xs = points.map((v) => v[0]), ys = points.map((v) => v[1]);
    const xmin = panel === 5 ? 0.5 : panel === 4 ? Math.min(...xs) - 5 : -20;
    const xmax = panel === 5 ? 0.9 : panel === 4 ? Math.max(...xs) + 5 : 330;
    const ymin = panel === 5 ? Math.floor(Math.min(...ys) - 0.2) : Math.min(0, Math.floor(Math.min(...ys)));
    const ymax = panel === 5 ? Math.ceil(Math.max(...ys) + 0.2) : Math.max(...ys) * 1.08;
    const x = (v: number) => left + (v - xmin) / (xmax - xmin) * w;
    const y = (v: number) => top + h - (v - ymin) / (ymax - ymin) * h;
    svg += `<text x="${left}" y="${top - 16}" font-size="15">${title}</text>`;
    for (let k = 0; k <= 4; k++) {
      const yy = top + h - k * h / 4, xx = left + k * w / 4;
      svg += `<path d="M${left},${yy}h${w}" stroke="#e0e5e9"/><text x="${left - 8}" y="${yy + 4}" text-anchor="end">${(ymin + k * (ymax - ymin) / 4).toFixed(panel === 3 ? 1 : 0)}</text>`;
      svg += `<text x="${xx}" y="${top + h + 19}" text-anchor="middle">${(xmin + k * (xmax - xmin) / 4).toFixed(panel === 5 ? 1 : 0)}</text>`;
    }
    svg += `<path d="M${left},${top}v${h}h${w}" stroke="#7e8b96" fill="none"/>`;
    for (const line of lines) svg += `<polyline fill="none" stroke="${line.color}" stroke-width="2" ${line.dashed ? 'stroke-dasharray="5 4"' : ""} points="${line.values.map(([xx, yy]) => `${x(xx).toFixed(2)},${y(yy).toFixed(2)}`).join(" ")}"/>`;
    svg += `<text x="${left + w / 2}" y="${top + h + 40}" text-anchor="middle">${panel === 5 ? "Fraction of ejection volume expelled" : panel === 4 ? "LV volume (mL)" : "Time from observed AV opening (ms)"}</text>`;
  });
  return svg + "</g></svg>";
}
