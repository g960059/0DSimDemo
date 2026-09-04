import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { auditMainWireEjectionCouplingV1 } from "@/analysis/methods/mainWire/MainWireEjectionCouplingAuditV1";
import { characterizePrescribedFlowMomentumV1, fixedPathInertanceMmHgSec2PerMlV1 } from
  "@/analysis/methods/mainWire/MainWirePrescribedFlowMomentumV1";
import type { MainWireBaselineCalibrationCandidateInputsV1 as Inputs } from "@/analysis/policies/mainWire/MainWireBaselineCalibrationParametersV1";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import { restoreMainWireIntegratedModelStandard70V1, type MainWireIntegratedModelStandard70CheckpointV1 as Checkpoint } from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { stepMainWireIntegratedModelV3 } from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import { createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
  runMainWireIntegratedModelRegularSinusAllOffResearchCycleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3 as Fixture,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3 as TraceSample,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type { MainWireNormalAdultFiveWallMechanicsStateV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type { MainWireFiveWallLandTriSegReadbackV1 } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type { MainWireNormalAdultWallMaterialReadbackV1 } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1 } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { LAND2017_STATE_INDEX } from "@/engine/myocardium/myofilament/land2017/types";
import { evaluateTriSegGeometryV1, evaluateTriSegWallDerivativeV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import { buildNonCoronaryCirculationGraphV1 } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { baseNonValveEdgeLossV1, vascularPvLawFromNodeV1,
  vascularTransmuralPressureAndVolumeTangentFromLawV1 } from "@/engine/core/circulationGraphKernelV1";
import { splitMainWireAcceptedProductV1, decomposeMainWireAorticStorageIntervalV1 } from
  "@/analysis/methods/mainWire/MainWireEjectionBalanceDecompositionV1";

// Analysis-only: unchanged accepted solver/checkpoint semantics, no fitting,
// physiological pass/fail, model mint, or Surface registration.
const wallIds = ["LVFW", "SEP", "RVFW"] as const;
type Wall = typeof wallIds[number];
type Detailed = TraceSample & {
  aorticEffectiveAreaCm2?: number;
  mechanism?: {
    aorticOpeningFraction01: number;
    proximalAorticFlowMlPerSec: number;
    aorticDissipativePowerMmHgMlPerSec: number;
    aorticPowerResidualMmHgMlPerSec: number;
    lvGeometryMmHgPerPa: number;
    lvReconstructedTransmuralMmHg: number;
    thoracicPressureMmHg: number;
    pericardialExcessPressureMmHg: number;
    trisegCoordinates: MainWireFiveWallLandTriSegReadbackV1["internalCoordinates"];
    trisegGeneralizedForce: MainWireFiveWallLandTriSegReadbackV1["rawAlgorithmicGeneralizedForce"];
    arteries: Record<"Ao" | "SA", { volumeMl: number; absolutePressureMmHg: number;
      transmuralPressureMmHg: number; tangentMmHgPerMl: number }>;
    aorticCoronaryInletMlPerSec: number;
    aorticOtherNetInflowMlPerSecByBranch: Record<string, number>;
    systemicArterialOutflowMlPerSec: number;
    walls: Record<Wall, { activeStressPa: number; passiveStressPa: number; slsStressPa: number;
      totalStressPa: number; geometryLogStrain: number; thicknessCurvatureRatio: number;
      landStretch: number; troponinBoundFraction01: number; strongBridgeFraction01: number }>;
  };
};
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const { values } = parseArgs({ options: {
  evaluation: { type: "string" }, request: { type: "string" }, output: { type: "string" },
  "replay-cycles": { type: "string", default: "0" }, "dt-sec": { type: "string" },
} });
const cycles = Number(values["replay-cycles"]);
if (!values.output || ![0, 2, 3].includes(cycles) || (values.request && !values.evaluation)) {
  throw new Error("--output NEW_DIRECTORY [--evaluation FILE --request FILE] [--replay-cycles 0|2|3 --dt-sec .002|.001|.0005|.00025]; without evaluation use registered baseline and replay 2 or 3 cycles");
}
const sourcePath = resolve(values.evaluation ?? "studio/integrations/mainWireIntegratedV3/standard70-launch-baseline.json");
const sourceText = await readFile(sourcePath, "utf8");
const raw = JSON.parse(sourceText);
const evaluation = raw.evaluation ?? raw;
const requestText = values.request ? await readFile(values.request, "utf8") : null;
const requested = requestText ? JSON.parse(requestText) : raw.inputs ?? raw.candidateInputs;
const inputs: Inputs = requested && { hemodynamicResearchInputs: requested.hemodynamicResearchInputs,
  ventricularContractilityScale: requested.ventricularContractilityScale,
  mechanismResearchInputs: requested.mechanismResearchInputs };
const checkpoint: Checkpoint = values.evaluation ? evaluation.exactResult?.checkpoint : raw.qualificationCheckpoint;
const sourceDt = values.evaluation ? evaluation.exactResult?.nominalDtSec : 0.002;
if (![0.001, 0.002].includes(sourceDt) || (values.evaluation && evaluation.nominalDtSec !== sourceDt)) {
  throw new Error("evaluation and exact-result nominal timestep must agree");
}
const dt = Number(values["dt-sec"] ?? sourceDt);
if (!inputs || !checkpoint || ![60, 70].includes(inputs.hemodynamicResearchInputs.heartRateBpm)
  || ![0.00025, 0.0005, 0.001, 0.002].includes(dt) || (values.evaluation && evaluation.status !== "accepted")
  || (!values.evaluation && cycles === 0) || (cycles === 0 && values["dt-sec"])) {
  throw new Error("requires accepted Standard70 data, matching inputs, HR60/70, and a supported replay timestep");
}
// Bind supplied inputs to exact checkpoint identity even for stored-trace-only
// analysis. Restoration validates construction, payload and clock without stepping.
selectHotPathIntegrityTierV1("full-invariant");
const runtime = createMainWireIntegratedModelAlgebraicPulmonaryRootFixtureV1(
  inputs.hemodynamicResearchInputs, inputs.ventricularContractilityScale, inputs.mechanismResearchInputs);
const fixture = runtime as unknown as Fixture;
const graph = buildNonCoronaryCirculationGraphV1();
const arterialLaws = Object.fromEntries((["Ao", "SA"] as const).map((name) => [name,
  vascularPvLawFromNodeV1(graph.nodes[graph.nodeIndex.get(name)!]!, runtime.runtime.vascular)]));
if (arterialLaws.Ao?.kind !== "arterial" || arterialLaws.SA?.kind !== "arterial") throw new Error("ordinary arterial Ao/SA required");
const aorticLaw = arterialLaws.Ao;
const proximalEdge = graph.edges[graph.edgeIndex.get("Ao_SA")!]!;
const proximalLoss = baseNonValveEdgeLossV1(proximalEdge, runtime.runtime.losses);
if (proximalLoss.collapsibleTubeCorrectionDeferred || proximalEdge.waterfall) throw new Error("unsupported Ao_SA pressure law");
const restored = await restoreMainWireIntegratedModelStandard70V1<MainWireNormalAdultFiveWallMechanicsStateV1>({
  base: { ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(fixture),
    mechanismResearchInputs: inputs.mechanismResearchInputs },
  algebraicPulmonaryRootAssemblyId: runtime.algebraicPulmonaryRootAssemblyId,
}, checkpoint);
const geometry = { bloodDensityKgPerM3: 1060, equivalentLengthCm: 1.5, physicalPathAreaCm2: 4 };
const inertance = fixedPathInertanceMmHgSec2PerMlV1(geometry);
const output = resolve(values.output);
await mkdir(output);
const protocol = {
  studyId: "main-wire-ejection-coupling-audit-v1", executionCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  workingTreeDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()),
  sourcePath, sourceFileSha256: sha(sourceText), sourceCheckpointSha256: checkpoint.checkpointSha256,
  requestPath: values.request ? resolve(values.request) : null, requestFileSha256: requestText ? sha(requestText) : null,
  inputSha256: sha(JSON.stringify(inputs)), inputs, replayCycles: cycles, nominalDtSec: dt,
  sourceNominalDtSec: sourceDt, replayNominalDtSec: cycles ? dt : null,
  executionTier: cycles ? "full-invariant" : "no-integration-stored-trace",
  analysisSources: Object.fromEntries(await Promise.all([
    "tools/scientific/auditMainWireEjectionCouplingV1.ts",
    "analysis/methods/mainWire/MainWireEjectionCouplingAuditV1.ts",
    "analysis/methods/mainWire/MainWirePrescribedFlowMomentumV1.ts",
    "analysis/methods/mainWire/MainWireEjectionBalanceDecompositionV1.ts",
    "engine/myocardium/mechanics/energyConjugateTriSegV1.ts",
    "engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1.ts",
    "engine/myocardium/mechanics/MainWireRoundedEjectionFiveWallProviderV1.ts",
    "engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts",
    "engine/myocardium/mechanics/equilibriumOneFiberPassiveV1.ts",
    "engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3.ts",
    "engine/core/circulationGraphKernelV1.ts",
    "engine/core/nonCoronaryCirculationBackwardEulerV1.ts",
    "engine/vascularPv.ts",
  ].map(async (path) => [path, sha(await readFile(path, "utf8"))]))),
  balanceDecomposition: { arterialLaws, proximalLoss, proximalInertanceMmHgSec2PerMl: proximalEdge.L,
    passiveBaseParams: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled.params,
    paPerMmHg: 133.322, pressureMechanism: "accepted-TriSeg-LVFW-virtual-work-coefficient-times-total-Kirchhoff-stress",
    changeAllocation: "symmetric-exact-product-split; observed-path-accounting-not-independent-causal-effects",
    arterialBalance: "endpoint-flows-with-coronary-and-device-boundaries; exact-law-secant-not-tangent-times-finite-volume-change" },
  prescribedMomentum: { geometry, inertanceMmHgSec2PerMl: inertance,
    geometryProvenance: "illustrative uniform-path engineering assumption, not a healthy reference or fitted coefficient",
    claim: "scaling diagnostic on unchanged flow only; no pressure correction, new state, closure law, or coupled counterfactual" },
  claim: "descriptive accepted-step pressure-flow/material readback; not clinical reference validation, causal identification, or fresh periodic qualification",
  modelChanged: false, baselineAdopted: false,
};
await writeFile(resolve(output, "protocol.json"), JSON.stringify(protocol, null, 2), { flag: "wx" });
const started = performance.now();
let samples: Detailed[] = [];
let completedBeat: Beat | null = checkpoint.baseStandardCheckpointV2.completedBeatMetrics;
const replayBeats: Beat[] = [];
if (cycles === 0) {
  samples = evaluation.exactResult.terminalTrace;
} else {
  let accepted = restored.acceptedState;
  const accumulator = restored.beatAccumulator;
  completedBeat = restored.completedBeatMetrics;
  for (let cycle = 1; cycle <= cycles; cycle++) {
    const details = new Map<number, Pick<Detailed, "aorticEffectiveAreaCm2" | "mechanism">>();
    // Finer steps are a research-only resolution check of unchanged physics,
    // never a new qualification timestep or production model configuration.
    const runCycle: typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3 = dt < .001
      ? (f, a, c, h, observer) => runMainWireIntegratedModelRegularSinusAllOffResearchCycleV3(f, a, c, h,
        (previous, input) => stepMainWireIntegratedModelV3(f.provider, previous, input), observer)
      : runMainWireIntegratedModelRegularSinusAllOffCycleV3;
    const run = runCycle(fixture, accepted, cycle, dt, (step) => {
      const beat = accumulator.accept(step);
      if (beat) { completedBeat = beat; replayBeats.push(beat); }
      const base = step.coronaryStep.baseStep;
      const readback = base.mechanicsTrial.diagnostics.readback as unknown as MainWireFiveWallLandTriSegReadbackV1;
      const states = step.acceptedState.coronary.mechanics.materialState.wallStateByWall;
      const valve = base.circulationTrial.valveEvaluations.AoV;
      const geo = evaluateTriSegGeometryV1({
        leftVentricularCavityVolumeM3: base.mechanicsTrial.candidateVolumesMl.LV * 1e-6,
        rightVentricularCavityVolumeM3: base.mechanicsTrial.candidateVolumesMl.RV * 1e-6,
        coordinates: readback.internalCoordinates,
        walls: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters,
      });
      const lvGeometryMmHgPerPa = -geo.walls.LVFW.parameters.wallMaterialVolumeM3
        * evaluateTriSegWallDerivativeV1(geo.walls.LVFW).dFiberLogStrainDCapVolumePerM3 / 133.322;
      const walls = Object.fromEntries(wallIds.map((wall) => {
        const material = readback.wallMaterialReadbackByWall[wall] as unknown as MainWireNormalAdultWallMaterialReadbackV1;
        if (!Number.isFinite(material?.landActiveKirchhoffStressPa)) throw new Error("missing accepted wall stress");
        return [wall, { activeStressPa: material.landActiveKirchhoffStressPa,
          passiveStressPa: material.totalKirchhoffStressPa - material.landActiveKirchhoffStressPa - material.slsOverstressPa,
          slsStressPa: material.slsOverstressPa,
          totalStressPa: material.totalKirchhoffStressPa,
          geometryLogStrain: geo.walls[wall].fiberLogStrain,
          thicknessCurvatureRatio: geo.walls[wall].thicknessCurvatureRatio,
          landStretch: MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1 * Math.exp(states[wall].previousFiberLogStrain),
          troponinBoundFraction01: states[wall].landState[LAND2017_STATE_INDEX.CaTRPN],
          strongBridgeFraction01: states[wall].landState[LAND2017_STATE_INDEX.S] }];
      })) as NonNullable<Detailed["mechanism"]>["walls"];
      const circulation = base.circulationTrial;
      const coronaryBoundary = circulation.conservativeCompanion?.outerBoundaryNetVolumeRateMlPerSec.Ao;
      if (!Number.isFinite(coronaryBoundary)) throw new Error("missing exact coronary Ao boundary");
      const support = circulation.dynamicMechanicalSupport ?? circulation.mechanicalSupport;
      if (!support || Object.values(support.nodeNetVolumeRateMlPerSec).some((q) => q !== 0)) {
        throw new Error("balance audit requires explicit all-off support node flows");
      }
      const arteries = Object.fromEntries((["Ao", "SA"] as const).map((name) => {
        const volumeMl = circulation.candidateNodeVolumesMl[name];
        const pv = vascularTransmuralPressureAndVolumeTangentFromLawV1(arterialLaws[name]!, volumeMl, "adaptive-volume-tolerance");
        if (pv.branch !== "arterial-interior") throw new Error("unsaturated arterial branch required");
        return [name, { volumeMl, absolutePressureMmHg: circulation.nodeAbsolutePressuresMmHg[name],
          transmuralPressureMmHg: pv.transmuralPressureMmHg,
          tangentMmHgPerMl: pv.dTransmuralPressureDPhysicalVolumeMmHgPerMl }];
      })) as NonNullable<Detailed["mechanism"]>["arteries"];
      const otherAoFlows = Object.fromEntries(graph.edges.filter((edge) => edge.name !== "AoV" && edge.name !== "Ao_SA"
        && (edge.up === "Ao" || edge.down === "Ao")).map((edge) => [edge.name,
        (edge.down === "Ao" ? 1 : -1) * circulation.edgeFlowsMlPerSec[edge.name as keyof typeof circulation.edgeFlowsMlPerSec]]));
      otherAoFlows.allOffMechanicalSupport = support.nodeNetVolumeRateMlPerSec.Ao;
      const reconstructed = lvGeometryMmHgPerPa * walls.LVFW.totalStressPa;
      if (Math.abs(reconstructed - readback.triseg.leftVentricularPressurePa / 133.322) > 1e-8) {
        throw new Error("accepted geometry/stress pressure reconstruction mismatch");
      }
      details.set(step.acceptedState.acceptedTimeSec, {
        aorticEffectiveAreaCm2: valve.activeEoaCm2,
        mechanism: { aorticOpeningFraction01: valve.state.leafletOpeningFraction01,
          proximalAorticFlowMlPerSec: base.circulationTrial.edgeFlowsMlPerSec.Ao_SA,
          aorticDissipativePowerMmHgMlPerSec: valve.dissipativePowerMmHgMlPerSec,
          aorticPowerResidualMmHgMlPerSec: valve.powerBalanceResidualMmHgMlPerSec,
          lvGeometryMmHgPerPa, lvReconstructedTransmuralMmHg: reconstructed,
          thoracicPressureMmHg: base.commonIntrathoracicPressureMmHg,
          pericardialExcessPressureMmHg: base.pericardium.excessPressureMmHg,
          trisegCoordinates: readback.internalCoordinates, trisegGeneralizedForce: readback.rawAlgorithmicGeneralizedForce,
          arteries, aorticCoronaryInletMlPerSec: -coronaryBoundary!,
          aorticOtherNetInflowMlPerSecByBranch: otherAoFlows,
          systemicArterialOutflowMlPerSec: circulation.edgeFlowsMlPerSec.SA_Art, walls },
      });
    });
    for (const row of run.traceSamples) {
      const extra = details.get(row.acceptedTimeSec);
      if (!extra) throw new Error("accepted trace and mechanism observer do not align");
      samples.push({ ...row, ...extra });
    }
    accepted = run.terminalAcceptedState;
    process.stderr.write(`[ejection-audit] completed replay cycle ${cycle}/${cycles}\n`);
  }
}
if (!completedBeat || !samples.length) throw new Error("no complete accepted beat/trace");
if (samples.some((s) => s.acceptedDtSec > dt + 1e-10)) throw new Error("accepted interval exceeds declared nominal timestep");
const audit = auditMainWireEjectionCouplingV1({ samples, completedBeat });
const forwardRows = audit.alignedSamples.map((s) => samples[s.sourceSampleIndex]!);
const momentum = characterizePrescribedFlowMomentumV1(forwardRows.map((s) => ({
  acceptedTimeSec: s.acceptedTimeSec, flowMlPerSec: s.valveFlowMlPerSec.AoV })), inertance);
const peak = (read: (s: Detailed) => number) => {
  if (!forwardRows.every((s) => Number.isFinite(read(s)))) return null;
  const at = forwardRows.reduce((a, b) => read(b) > read(a) ? b : a);
  return { value: read(at), timeSec: at.acceptedTimeSec,
    timeFromOpeningSec: at.acceptedTimeSec - audit.ejection.opening.timeSec };
};
const mechanism = {
  claim: "accepted positive-flow sample peaks and nearest-volume samples; associations, not causal effects",
  eoaPeak: peak((s) => s.aorticEffectiveAreaCm2 ?? NaN),
  proximalFlowPeak: peak((s) => s.mechanism?.proximalAorticFlowMlPerSec ?? NaN),
  wallPeaks: Object.fromEntries(wallIds.map((wall) => [wall, {
    freeCalciumUM: peak((s) => s.freeCalciumUMByWall[wall]),
    activeStressPa: peak((s) => s.mechanism?.walls[wall].activeStressPa ?? NaN),
    troponinBoundFraction01: peak((s) => s.mechanism?.walls[wall].troponinBoundFraction01 ?? NaN),
    strongBridgeFraction01: peak((s) => s.mechanism?.walls[wall].strongBridgeFraction01 ?? NaN),
  }])),
  volumeLandmarks: [0.1, 0.3, 0.5, 0.6, 0.725, 0.85, 0.9].map((target) => {
    const at = audit.alignedSamples.reduce((a, b) =>
      Math.abs(b.expelledVolumeFraction01! - target) < Math.abs(a.expelledVolumeFraction01! - target) ? b : a);
    return { targetExpelledVolumeFraction01: target, aligned: at, mechanism: samples[at.sourceSampleIndex]!.mechanism ?? null };
  }),
};
const momentumSummary = { claim: momentum.claim, geometry, inertanceMmHgSec2PerMl: inertance,
  coverage: "consecutive strictly positive-flow samples; zero-flow endpoint intervals excluded",
  minimumContributionMmHg: Math.min(...momentum.intervals.map((s) => s.inertialPressureContributionMmHg)),
  maximumContributionMmHg: Math.max(...momentum.intervals.map((s) => s.inertialPressureContributionMmHg)),
  maximumAbsoluteEnergyIdentityResidualMmHgMl: Math.max(...momentum.intervals.map((s) => Math.abs(s.backwardEulerEnergyBalanceResidualMmHgMl))),
};
const balances = cycles ? decomposeBalances() : null;
await writeFile(resolve(output, "result.json"), JSON.stringify({ protocol, wallTimeMs: performance.now() - started,
  audit, mechanism, momentum, balances, completedBeat, replayBeats, samples }), { flag: "wx" });
await writeFile(resolve(output, "summary.json"), JSON.stringify({ ...audit, alignedSamples: undefined, mechanism,
  prescribedMomentum: momentumSummary, balances: balances && { ...balances, rows: undefined } }, null, 2), { flag: "wx" });
await writeFile(resolve(output, "waveforms.svg"), render(samples, completedBeat, audit.ejection), { flag: "wx" });
if (balances) await writeFile(resolve(output, "balances.svg"), renderBalances(balances.rows), { flag: "wx" });
process.stdout.write(`${output}/summary.json\n`);

function decomposeBalances() {
  const rows: Array<Record<string, number>> = [];
  const first = forwardRows[0]!.mechanism!;
  const cumulative = { activeChange: 0, passiveChange: 0, slsChange: 0, geometryChange: 0, externalChange: 0,
    aorticInflow: 0, aorticOutflow: 0, coronaryOutflow: 0, otherAorticInflow: 0, aorticExternalChange: 0,
    aorticNumericalResidual: 0 };
  const residuals = { pressureReconstructionMmHg: 0, absolutePressureReconstructionMmHg: 0,
    materialChangeMmHg: 0, aorticContinuityMl: 0, aorticConstitutiveMmHg: 0,
    aorticFlowPressureMmHg: 0, coronaryBoundaryMlPerSec: 0, proximalMomentumMmHg: 0,
    lvEjectionContinuityMl: 0, geometryLogStrain: 0, chordMaterialMmHg: 0, chordPathMmHg: 0,
    chordPressurePortsMmHg: 0, chordAorticStorageMmHg: 0, chordAorticStorageBeforeNumericalResidualMmHg: 0 };
  for (let i = 0; i < forwardRows.length; i++) {
    const s = forwardRows[i]!, m = s.mechanism!, w = m.walls.LVFW;
    const a = m.arteries.Ao, sa = m.arteries.SA;
    const ext = m.thoracicPressureMmHg + m.pericardialExcessPressureMmHg;
    residuals.pressureReconstructionMmHg = Math.max(residuals.pressureReconstructionMmHg,
      Math.abs(m.lvReconstructedTransmuralMmHg - s.transmuralPressureMmHg.LV));
    residuals.absolutePressureReconstructionMmHg = Math.max(residuals.absolutePressureReconstructionMmHg,
      Math.abs(m.lvReconstructedTransmuralMmHg + ext - s.absolutePressureMmHg.LV));
    residuals.coronaryBoundaryMlPerSec = Math.max(residuals.coronaryBoundaryMlPerSec,
      Math.abs(m.aorticCoronaryInletMlPerSec - s.coronary.totalInletFlowMlPerSec));
    residuals.geometryLogStrain = Math.max(residuals.geometryLogStrain,
      Math.abs(w.geometryLogStrain - Math.log(w.landStretch / MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_LAND_SLACK_STRETCH_V1)));
    let intervalValues = { lvChangeRate: NaN, aoChangeRate: NaN, valveDropChangeRate: NaN,
      activeChangeRate: NaN, passiveChangeRate: NaN, slsChangeRate: NaN, geometryChangeRate: NaN,
      aorticNetInflow: s.valveFlowMlPerSec.AoV - m.proximalAorticFlowMlPerSec - m.aorticCoronaryInletMlPerSec
        + Object.values(m.aorticOtherNetInflowMlPerSecByBranch).reduce((sum, q) => sum + q, 0),
      proximalInertialDrop: NaN };
    if (i > 0) {
      const p = forwardRows[i - 1]!, pm = p.mechanism!, pw = pm.walls.LVFW, pa = pm.arteries.Ao;
      const interval = { startTimeSec: p.acceptedTimeSec, endTimeSec: s.acceptedTimeSec, acceptedDtSec: s.acceptedDtSec };
      const parts = (["activeStressPa", "passiveStressPa", "slsStressPa"] as const).map((key) =>
        splitMainWireAcceptedProductV1({ ...interval, aStart: pm.lvGeometryMmHgPerPa, aEnd: m.lvGeometryMmHgPerPa,
          bStart: pw[key], bEnd: w[key] }));
      const activeChange = parts[0]!.bChangeContribution, passiveChange = parts[1]!.bChangeContribution;
      const slsChange = parts[2]!.bChangeContribution, geometryChange = parts.reduce((sum, part) => sum + part.aChangeContribution, 0);
      const externalChange = ext - pm.thoracicPressureMmHg - pm.pericardialExcessPressureMmHg;
      cumulative.activeChange += activeChange; cumulative.passiveChange += passiveChange;
      cumulative.slsChange += slsChange; cumulative.geometryChange += geometryChange; cumulative.externalChange += externalChange;
      const lvDelta = s.absolutePressureMmHg.LV - p.absolutePressureMmHg.LV;
      residuals.materialChangeMmHg = Math.max(residuals.materialChangeMmHg,
        Math.abs(lvDelta - activeChange - passiveChange - slsChange - geometryChange - externalChange));
      const volumeStrainChange = (a.volumeMl - pa.volumeMl) / aorticLaw.VsEff;
      // expm1(x)/x is the exact exponential-law secant multiplier; its x=0 limit is one.
      const secant = pa.tangentMmHgPerMl * (volumeStrainChange === 0 ? 1 : Math.expm1(volumeStrainChange) / volumeStrainChange);
      const storage = decomposeMainWireAorticStorageIntervalV1({
        previous: { ...pa, timeSec: p.acceptedTimeSec }, next: { ...a, timeSec: s.acceptedTimeSec, acceptedDtSec: s.acceptedDtSec },
        constitutiveSecantMmHgPerMl: secant,
        endFlows: { aorticValveMlPerSec: s.valveFlowMlPerSec.AoV, aortaToSystemicMlPerSec: m.proximalAorticFlowMlPerSec,
          coronary: { connected: true, inletFlowMlPerSec: m.aorticCoronaryInletMlPerSec },
          otherNetInflowMlPerSecByBranch: m.aorticOtherNetInflowMlPerSecByBranch },
      });
      for (const branch of storage.branches) {
        const key = branch.branchId === "AoV" ? "aorticInflow" : branch.branchId === "Ao_SA" ? "aorticOutflow"
          : branch.branchId === "coronary" ? "coronaryOutflow" : "otherAorticInflow";
        cumulative[key] += branch.transmuralPressureChangeMmHg!;
      }
      cumulative.aorticExternalChange += storage.pressure.externalChangeMmHg;
      // The nonlinear solve's admitted residual is numerical, not physiology.
      // Keep its cumulative contribution instead of hiding it in a flow term.
      cumulative.aorticNumericalResidual += storage.pressure.continuityResidualContributionMmHg!
        + storage.pressure.constitutiveResidualMmHg!;
      residuals.aorticContinuityMl = Math.max(residuals.aorticContinuityMl, Math.abs(storage.volume.continuityResidualMl));
      residuals.aorticConstitutiveMmHg = Math.max(residuals.aorticConstitutiveMmHg, Math.abs(storage.pressure.constitutiveResidualMmHg!));
      residuals.aorticFlowPressureMmHg = Math.max(residuals.aorticFlowPressureMmHg,
        Math.abs(storage.pressure.observedTransmuralChangeMmHg - storage.pressure.flowStorageChangeMmHg!));
      const h = s.acceptedDtSec, q = m.proximalAorticFlowMlPerSec;
      const inertialDrop = proximalEdge.L! * (q - pm.proximalAorticFlowMlPerSec) / h;
      const loss = proximalLoss.resistanceMmHgSecPerMl * q + proximalLoss.quadraticLossMmHgSec2PerMl2 * q * Math.abs(q);
      residuals.proximalMomentumMmHg = Math.max(residuals.proximalMomentumMmHg,
        Math.abs(a.absolutePressureMmHg - sa.absolutePressureMmHg - inertialDrop - loss));
      residuals.lvEjectionContinuityMl = Math.max(residuals.lvEjectionContinuityMl,
        Math.abs(s.chamberVolumeMl.LV - p.chamberVolumeMl.LV - h * (s.valveFlowMlPerSec.MV - s.valveFlowMlPerSec.AoV)));
      intervalValues = { ...intervalValues, proximalInertialDrop: inertialDrop,
        lvChangeRate: lvDelta / h, aoChangeRate: storage.pressure.observedAbsoluteChangeMmHg / h,
        valveDropChangeRate: (lvDelta - storage.pressure.observedAbsoluteChangeMmHg) / h,
        activeChangeRate: activeChange / h, passiveChangeRate: passiveChange / h,
        slsChangeRate: slsChange / h, geometryChangeRate: geometryChange / h };
    }
    rows.push({ timeSec: s.acceptedTimeSec, timeFromOpeningMs: (s.acceptedTimeSec - audit.ejection.opening.timeSec) * 1000,
      expelledFraction: audit.alignedSamples[i]!.expelledVolumeFraction01!, lvVolume: s.chamberVolumeMl.LV,
      lvPressure: s.absolutePressureMmHg.LV, aoPressure: a.absolutePressureMmHg,
      avDrop: s.absolutePressureMmHg.LV - a.absolutePressureMmHg, activePressure: m.lvGeometryMmHgPerPa * w.activeStressPa,
      passivePressure: m.lvGeometryMmHgPerPa * w.passiveStressPa, slsPressure: m.lvGeometryMmHgPerPa * w.slsStressPa,
      passiveCentralPressure: m.lvGeometryMmHgPerPa * NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled.params.centralTangentPa
        * inputs.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LVFW * w.geometryLogStrain,
      passiveRecruitedPressure: m.lvGeometryMmHgPerPa * (w.passiveStressPa
        - NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled.params.centralTangentPa
        * inputs.mechanismResearchInputs.chamberMechanics.passiveStiffnessScaleByWall.LVFW * w.geometryLogStrain),
      geometryGainRatio: m.lvGeometryMmHgPerPa / first.lvGeometryMmHgPerPa,
      geometryMmHgPerPa: m.lvGeometryMmHgPerPa, totalStressKPa: w.totalStressPa / 1000, activeStressKPa: w.activeStressPa / 1000,
      landStretch: w.landStretch, geometryLogStrain: w.geometryLogStrain, thicknessCurvatureRatio: w.thicknessCurvatureRatio,
      aorticFlow: s.valveFlowMlPerSec.AoV, proximalFlow: m.proximalAorticFlowMlPerSec,
      systemicOutflow: m.systemicArterialOutflowMlPerSec, aorticCoronaryInlet: m.aorticCoronaryInletMlPerSec,
      aorticCompliance: 1 / a.tangentMmHgPerMl, aorticVolume: a.volumeMl, systemicVolume: sa.volumeMl,
      ...intervalValues, ...cumulative });
  }
  const interpolate = (x: number, key: string) => {
    const j = rows.findIndex((r) => r.expelledFraction! >= x);
    if (j < 1) throw new Error("balance landmark not bracketed by positive-flow samples");
    const a = rows[j - 1]!, b = rows[j]!, fraction = (x - a.expelledFraction!) / (b.expelledFraction! - a.expelledFraction!);
    return a[key]! + fraction * (b[key]! - a[key]!);
  };
  const fields = Object.keys(rows[1]!);
  const landmarks = [0.1, 0.3, 0.5, 0.6, 0.725, 0.85, 0.9].map((x) => ({ targetExpelledFraction: x,
    values: Object.fromEntries(fields.map((key) => [key, interpolate(x, key)])) }));
  const windows = [[0.1, 0.9], [0.6, 0.85]].map(([from, to]) => ({ from, to,
    basis: "linear-interpolation-in-observed-expelled-volume; chord-residual-not-a-normal-range",
    contributions: Object.fromEntries(["lvPressure", "aoPressure", "avDrop", "activePressure", "passivePressure", "slsPressure",
      "passiveCentralPressure", "passiveRecruitedPressure",
      ...Object.keys(cumulative)].map((key) => {
      const start = interpolate(from!, key), end = interpolate(to!, key), mid = interpolate((from! + to!) / 2, key);
      return [key, { start, end, change: end - start, midpointChordResidualMmHg: mid - (start + end) / 2 }];
    })) }));
  for (const window of windows) {
    const c = window.contributions, value = (key: string) => c[key]!.midpointChordResidualMmHg;
    const sum = (...keys: string[]) => keys.reduce((total, key) => total + value(key), 0);
    residuals.chordMaterialMmHg = Math.max(residuals.chordMaterialMmHg, Math.abs(value("lvPressure")
      - sum("activePressure", "passivePressure", "slsPressure", "externalChange")));
    residuals.chordPathMmHg = Math.max(residuals.chordPathMmHg, Math.abs(value("lvPressure")
      - sum("activeChange", "passiveChange", "slsChange", "geometryChange", "externalChange")));
    residuals.chordPressurePortsMmHg = Math.max(residuals.chordPressurePortsMmHg,
      Math.abs(value("lvPressure") - sum("aoPressure", "avDrop")));
    const storageDifference = value("aoPressure")
      - sum("aorticInflow", "aorticOutflow", "coronaryOutflow", "otherAorticInflow", "aorticExternalChange");
    residuals.chordAorticStorageBeforeNumericalResidualMmHg = Math.max(residuals.chordAorticStorageBeforeNumericalResidualMmHg,
      Math.abs(storageDifference));
    residuals.chordAorticStorageMmHg = Math.max(residuals.chordAorticStorageMmHg,
      Math.abs(storageDifference - value("aorticNumericalResidual")));
  }
  const transitionWidth = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled.params.transitionWidthStrain;
  const passiveTransition = { basis: "accepted-strain-crossing-brackets; interpolated-times-not-exact-events", transitionWidth,
    interiorSampleCount: rows.filter((r) => r.geometryLogStrain! > 0 && r.geometryLogStrain! < transitionWidth).length,
    boundaries: [transitionWidth, 0].map((strain) => {
      const index = rows.findIndex((r, i) => i > 0 && rows[i - 1]!.geometryLogStrain! > strain && r.geometryLogStrain! <= strain);
      if (index < 1) return { strain, observed: false as const };
      const a = rows[index - 1]!, b = rows[index]!, f = (strain - a.geometryLogStrain!) / (b.geometryLogStrain! - a.geometryLogStrain!);
      return { strain, observed: true as const, before: { timeFromOpeningMs: a.timeFromOpeningMs, strain: a.geometryLogStrain },
        after: { timeFromOpeningMs: b.timeFromOpeningMs, strain: b.geometryLogStrain },
        interpolatedTimeFromOpeningMs: a.timeFromOpeningMs! + f * (b.timeFromOpeningMs! - a.timeFromOpeningMs!) };
    }) };
  if (Object.values(residuals).some((v) => !Number.isFinite(v))
    || residuals.absolutePressureReconstructionMmHg > 1e-7 || residuals.aorticContinuityMl > 1e-7
    || residuals.materialChangeMmHg > 1e-7 || residuals.aorticConstitutiveMmHg > 1e-7
    || residuals.proximalMomentumMmHg > 1e-7 || residuals.coronaryBoundaryMlPerSec > 1e-7
    || residuals.chordMaterialMmHg > 1e-7 || residuals.chordPathMmHg > 1e-7
    || residuals.chordAorticStorageMmHg > 1e-7 || residuals.chordPressurePortsMmHg > 1e-7) {
    throw new Error(`balance reconstruction failed: ${JSON.stringify(residuals)}`);
  }
  return { claim: "unchanged accepted path; exact algebraic accounting, not independent causal identification or normality",
    coverage: "one completed-beat ejection; intervals between consecutive strictly positive AoV flow samples",
    endpointRates: "accepted-interval differences, not instantaneous derivatives",
    residuals, passiveTransition, landmarks, windows, rows };
}

function renderBalances(rows: Array<Record<string, number>>) {
  const panels = [
    { title: "LV = Ao + AV drop (mmHg)", fields: ["lvPressure", "aoPressure", "avDrop"] },
    { title: "Passive/SLS pressure components (mmHg)", fields: ["passiveCentralPressure", "passiveRecruitedPressure", "slsPressure"] },
    { title: "Geometry pressure gain / first forward sample", fields: ["geometryGainRatio"] },
    { title: "Accepted-path pressure changes (mmHg)", fields: ["activeChange", "geometryChange", "slsChange", "passiveChange"] },
    { title: "Native flows and Ao net storage rate (mL/s)", fields: ["aorticFlow", "proximalFlow", "aorticNetInflow"] },
    { title: "Interval pressure rates (mmHg/s; not dP/dt max)", fields: ["lvChangeRate", "aoChangeRate", "valveDropChangeRate"] },
  ];
  const colors = ["#d84460", "#0784b5", "#8562bc", "#278365"];
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1100" viewBox="0 0 1240 1100"><rect width="1240" height="1100" fill="white"/><g font-family="Arial,sans-serif" font-size="12" fill="#26323d"><text x="35" y="27" font-size="18">LV ejection: pressure, material/geometry and arterial balance</text><text x="35" y="49">Unchanged accepted path · no smoothing · shaded volume window 0.60–0.85 · no physiological pass/fail</text>';
  panels.forEach((p, i) => {
    const x0 = 80 + i % 2 * 605, y0 = 115 + Math.floor(i / 2) * 325, width = 505, height = 225;
    const valid = rows.filter((r) => p.fields.every((f) => Number.isFinite(r[f])));
    const ys = valid.flatMap((r) => p.fields.map((f) => r[f]!));
    const min = Math.min(0, ...ys), max = Math.max(...ys), pad = (max - min || 1) * .08;
    const px = (x: number) => x0 + x * width, py = (y: number) => y0 + height - (y - min + pad) / (max - min + 2 * pad) * height;
    svg += `<text x="${x0}" y="${y0 - 39}" font-size="14">${p.title}</text><rect x="${px(.6)}" y="${y0}" width="${width * .25}" height="${height}" fill="#f2f4f7"/>`;
    for (let tick = 0; tick <= 4; tick++) {
      const y = min - pad + tick / 4 * (max - min + 2 * pad);
      svg += `<path d="M${x0},${py(y)}h${width}" stroke="#dde3e8"/><text x="${x0 - 8}" y="${py(y) + 4}" text-anchor="end">${y.toFixed(max < 3 ? 2 : 0)}</text><text x="${px(tick / 4)}" y="${y0 + height + 18}" text-anchor="middle">${(tick / 4).toFixed(2)}</text>`;
    }
    p.fields.forEach((f, j) => {
      const label = ({ passiveCentralPressure: "passive central", passiveRecruitedPressure: "passive recruited",
        geometryGainRatio: "geometry gain", aorticNetInflow: "Ao net inflow", valveDropChangeRate: "AV drop rate" } as Record<string, string>)[f] ?? f;
      svg += `<text x="${x0 + j * 125}" y="${y0 - 14}" font-size="11" fill="${colors[j]}">${label}</text><polyline fill="none" stroke="${colors[j]}" stroke-width="2" points="${valid.map((r) => `${px(r.expelledFraction!).toFixed(2)},${py(r[f]!).toFixed(2)}`).join(" ")}"/>`;
    });
    svg += `<text x="${x0 + width / 2}" y="${y0 + height + 38}" text-anchor="middle">Expelled fraction of ejection volume (not time)</text>`;
  });
  return svg + "</g></svg>";
}

function render(all: Detailed[], beat: Beat, ejection: typeof audit.ejection): string {
  const rows = all.filter((s) => s.acceptedTimeSec >= beat.startTimeSec && s.acceptedTimeSec <= beat.endTimeSec);
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const colors = ["#e84f64", "#149bd0", "#a377dc"];
  const t = (s: Detailed) => (s.acceptedTimeSec - beat.startTimeSec) * 1000;
  type Series = { label: string; y: (s: Detailed) => number | undefined };
  const panels: { title: string; x?: (s: Detailed) => number; series: Series[] }[] = [
    { title: "LV / Ao intracavitary pressure (mmHg)", series: [
      { label: "LV", y: (s) => s.absolutePressureMmHg.LV }, { label: "Ao", y: (s) => s.absolutePressureMmHg.Ao }] },
    { title: "Forward ejection flow (mL/s)", series: [
      { label: "AoV", y: (s) => s.valveFlowMlPerSec.AoV }, { label: "Ao-SA", y: (s) => s.mechanism?.proximalAorticFlowMlPerSec }] },
    { title: "AV active effective orifice area (cm²)", series: [{ label: "EOA", y: (s) => s.aorticEffectiveAreaCm2 }] },
    { title: "Active Kirchhoff stress (kPa; not LV pressure)", series: wallIds.map((wall) => ({ label: wall,
      y: (s) => s.mechanism ? s.mechanism.walls[wall].activeStressPa / 1000 : undefined })) },
    { title: "Free intracellular calcium (µM)", series: wallIds.map((wall) => ({ label: wall, y: (s) => s.freeCalciumUMByWall[wall] })) },
    { title: "LV PV loop: transmural pressure (mmHg)", x: (s) => s.chamberVolumeMl.LV,
      series: [{ label: "LV", y: (s) => s.transmuralPressureMmHg.LV }] },
  ];
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1080" viewBox="0 0 1240 1080"><rect width="1240" height="1080" fill="#fff"/><g font-family="Arial,sans-serif" font-size="13" fill="#26323d">';
  svg += '<text x="35" y="28" font-size="18">Accepted-step LV ejection coupling — descriptive research audit</text>';
  const incomplete = rows[0]!.acceptedTimeSec - rows[0]!.acceptedDtSec > beat.startTimeSec + 1e-9
    || rows[rows.length - 1]!.acceptedTimeSec < beat.endTimeSec - 1e-9;
  svg += `<text x="35" y="49">HR ${Math.round(60 / beat.durationSec)} · no display smoothing · ${incomplete ? "PARTIAL BEAT: complete ejection only; PV trace not closed" : "complete beat"} · no physiological pass/fail</text>`;
  panels.forEach((panel, i) => {
    const left = 75 + (i % 2) * 605, top = 98 + Math.floor(i / 2) * 325, w = 505, h = 235;
    const x = panel.x ?? t;
    const series = panel.series.filter((line) => rows.every((s) => Number.isFinite(line.y(s))));
    svg += `<text x="${left}" y="${top - 22}" font-size="15">${esc(panel.title)}</text>`;
    if (!series.length) { svg += `<text x="${left}" y="${top + 30}">Unavailable in stored trace; use checkpoint replay.</text>`; return; }
    const xs = rows.map(x), ys = rows.flatMap((s) => series.map((line) => line.y(s)!));
    const xmin = panel.x ? Math.min(...xs) - 5 : 0, xmax = panel.x ? Math.max(...xs) + 5 : beat.durationSec * 1000;
    const ymin = Math.min(0, ...ys), ymax = Math.max(...ys) * 1.08 || 1;
    const px = (n: number) => left + (n - xmin) / (xmax - xmin) * w;
    const py = (n: number) => top + h - (n - ymin) / (ymax - ymin) * h;
    for (let tick = 0; tick <= 4; tick++) {
      const yy = top + h - tick * h / 4, val = ymin + tick * (ymax - ymin) / 4;
      svg += `<path d="M${left},${yy}h${w}" stroke="#e2e7eb"/><text x="${left - 8}" y="${yy + 4}" text-anchor="end">${val.toFixed(ymax < 5 ? 2 : 0)}</text>`;
      const xx = left + tick * w / 4;
      svg += `<text x="${xx}" y="${top + h + 20}" text-anchor="middle">${(xmin + tick * (xmax - xmin) / 4).toFixed(0)}</text>`;
    }
    svg += `<path d="M${left},${top}v${h}h${w}" fill="none" stroke="#7d8b97"/>`;
    if (!panel.x) for (const event of [ejection.opening, ejection.closure]) {
      const xx = px((event.timeSec - beat.startTimeSec) * 1000);
      svg += `<path d="M${xx},${top}v${h}" stroke="#adb8bf" stroke-dasharray="3 4"/><text x="${xx + 4}" y="${top + 13}" font-size="11">${event.kind === "opening" ? "AVO" : "AVC"}</text>`;
    }
    series.forEach((line, j) => {
      svg += `<polyline fill="none" stroke="${colors[j]}" stroke-width="2" points="${rows.map((s) => `${px(x(s)).toFixed(2)},${py(line.y(s)!).toFixed(2)}`).join(" ")}"/>`;
      svg += `<text x="${left + j * 110}" y="${top - 5}" fill="${colors[j]}">${esc(line.label)}</text>`;
    });
    svg += `<text x="${left + w / 2}" y="${top + h + 39}" text-anchor="middle">${panel.x ? "Volume (mL)" : "Time from beat start (ms)"}</text>`;
  });
  return svg + "</g></svg>";
}
