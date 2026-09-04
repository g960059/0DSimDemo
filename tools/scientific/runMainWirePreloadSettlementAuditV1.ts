import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import { selectHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";
import {
  measureMainWireIntegratedModelFormalPreloadReserveV1,
  measureMainWireIntegratedModelFormalPreloadReserveV2,
  type MainWireIntegratedModelStructuralAnalysisSessionV3 as Session,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import { MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2, MainWireFixedToneVolumeClosureV2 } from
  "@/analysis/methods/mainWire/MainWireFixedToneSettlementV2";
import type { evaluateMainWireStandard70BaselineCalibrationCandidateV1 } from
  "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import type { resolveMainWireFittingReferenceV1 } from
  "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { MainWireIntegratedModelStandard70TypedAuthoritySessionV1 } from
  "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import { limitAcceptedComposedRhythmTransactionCandidateTimeV2 } from
  "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";
import { MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1 } from
  "@/engine/executionPlan/MainWireNumericalClockV1";

type Inputs = ReturnType<typeof resolveMainWireFittingReferenceV1>["selectedConstruction"]["candidateInputs"];
type Evaluation = Awaited<ReturnType<typeof evaluateMainWireStandard70BaselineCalibrationCandidateV1>>;
type State = ReturnType<Session["currentAcceptedState"]>;
type Observation = ReturnType<Session["observe"]>;
type Advance = ReturnType<Session["advanceToPresentationTime"]>;

// With competent valves and all MCS off, the only boundary flows of this
// domain are PV inflow and AoV outflow. Coronary Ao-to-RA flow is outside it.
const LEFT_DOMAIN = ["PA", "PArt", "PCap", "PVen", "PVein", "LA", "LV"] as const;
function leftDomainVolumeMl(state: State): number {
  return LEFT_DOMAIN.reduce((sum, node) => sum + state.coronary.circulation.nodeVolumesMl[node], 0);
}
function snapshot(observation: Observation) {
  const state = observation.acceptedState;
  const beat = observation.completedBeatMetrics;
  return {
    timeSec: state.acceptedTimeSec,
    leftDomainVolumeMl: leftDomainVolumeMl(state),
    nodeVolumesMl: { ...state.coronary.circulation.nodeVolumesMl },
    beat: beat === null ? null : {
      startTimeSec: beat.startTimeSec, endTimeSec: beat.endTimeSec,
      durationSec: beat.durationSec,
      sampleDelayAfterBeatSec: state.acceptedTimeSec - beat.endTimeSec,
      leftForwardCoLPerMin: beat.nativeLeftCardiacOutputLPerMin,
      rightForwardCoLPerMin: beat.nativeRightCardiacOutputLPerMin,
      leftNetVolumeMl: beat.valveFlowVolumes.AoV.netVolumeMl,
      rightNetVolumeMl: beat.valveFlowVolumes.PV.netVolumeMl,
      meanLapMmHg: beat.meanLeftAtrialPressureMmHg,
      meanRapMmHg: beat.meanRightAtrialPressureMmHg,
      meanAoMmHg: beat.meanAorticPressureMmHg,
      lvEd: beat.leftVentricularPressureVolumeLandmarks.endDiastolic,
      rvEd: beat.rightVentricularPressureVolumeLandmarks.endDiastolic,
    },
  };
}

/** Observe the existing protocol without changing its calls or stop policy. */
class ObservedBranch implements Session {
  readonly id: number;
  readonly originTimeSec: number;
  readonly tbvMl: number;
  readonly beats: ReturnType<typeof snapshot>[] = [];
  readonly volumeClosure = new MainWireFixedToneVolumeClosureV2();
  private lastBeatId: string | null;
  constructor(readonly delegate: Session, readonly branches: ObservedBranch[], readonly parentId: number | null) {
    this.id = branches.length;
    this.originTimeSec = delegate.currentAcceptedState().acceptedTimeSec;
    this.tbvMl = delegate.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl;
    this.lastBeatId = delegate.observe().completedBeatMetrics?.endAtrialCaptureId ?? null;
    branches.push(this);
  }
  currentAcceptedState() { return this.delegate.currentAcceptedState(); }
  observe() { return this.delegate.observe(); }
  projectCurrentAcceptedValuesV1: NonNullable<Session["projectCurrentAcceptedValuesV1"]> = (ids) => {
    if (!this.delegate.projectCurrentAcceptedValuesV1) throw new Error("projection unavailable");
    return this.delegate.projectCurrentAcceptedValuesV1(ids);
  };
  private record(advance: Advance): Advance {
    if (advance.status !== "failed") {
      const beat = advance.observation.completedBeatMetrics;
      const state = advance.observation.acceptedState;
      this.volumeClosure.accept({ timeSec: state.acceptedTimeSec,
        volumesMl: { ...state.coronary.circulation.nodeVolumesMl,
          ...Object.fromEntries(Object.entries(state.coronary.coronary.volumeMlByNode)
            .map(([key, value]) => [`coronary.${key}`, value])) } }, beat?.endTimeSec ?? null);
      if (beat !== null && beat.endAtrialCaptureId !== this.lastBeatId) {
        this.beats.push(snapshot(advance.observation));
        this.lastBeatId = beat.endAtrialCaptureId;
      }
    }
    return advance;
  }
  advanceToPresentationTime(time: number) {
    return this.record(this.delegate.advanceToPresentationTime(time));
  }
  advanceStructuralAnalysisToPresentationTimeV1(time: number) {
    return this.record(this.delegate.advanceStructuralAnalysisToPresentationTimeV1?.(time)
      ?? this.delegate.advanceToPresentationTime(time));
  }
  forkAtFixedGlobalTotalBloodVolume(tbv: number) {
    return new ObservedBranch(this.delegate.forkAtFixedGlobalTotalBloodVolume(tbv), this.branches, this.id);
  }
  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(tbv: number) {
    return new ObservedBranch(this.delegate.forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(tbv), this.branches, this.id);
  }
}

function valveFlows(observation: Observation) {
  const trial = observation.lastAcceptedStep?.coronaryStep.baseStep.circulationTrial;
  if (!trial) throw new Error("audit needs accepted full-invariant numerical readback");
  return { AoV: trial.valveEvaluations.AoV.flowMlPerSec, PV: trial.valveEvaluations.PV.flowMlPerSec };
}

// Separate from the unchanged protocol above. Retain every accepted substep
// and compare BE flux against actual volume change on the same time interval.
// The original returned reserve remains intact, even if extension changes it.
function extendHighEndpoint(branch: Session, cycles: number, heartRateBpm: number) {
  const periodSec = 60 / heartRateBpm;
  const origin = branch.currentAcceptedState().acceptedTimeSec;
  const binding = branch.currentAcceptedState().coronary.coronaryAutoregulationBinding.windowPolicy;
  if (origin + cycles * periodSec >= binding.originAcceptedTimeSec + binding.durationSec) {
    throw new Error("extension would leave the fixed-tone window");
  }
  const rows = [];
  let previous = branch.observe();
  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    const start = snapshot(previous);
    let leftBeMl = 0, rightBeMl = 0, leftTrapezoidMl = 0, rightTrapezoidMl = 0;
    let maximumStepContinuityErrorMl = 0, substeps = 0;
    const target = origin + cycle * periodSec;
    const cycleOrigin = previous.acceptedState.acceptedTimeSec;
    let ordinal = 1;
    while (previous.acceptedState.acceptedTimeSec < target) {
      const gridTarget = Math.min(target, cycleOrigin + ordinal * MAIN_WIRE_NUMERICAL_BASE_TICK_SEC_V1);
      // Match the exact event limiter, without introducing a new physical dt.
      const nextTime = limitAcceptedComposedRhythmTransactionCandidateTimeV2(
        previous.acceptedState.composedRhythm, gridTarget, null,
      ).candidateTimeSec;
      const advance = branch.advanceStructuralAnalysisToPresentationTimeV1?.(nextTime)
        ?? branch.advanceToPresentationTime(nextTime);
      if (advance.status !== "advanced") throw new Error(JSON.stringify(advance));
      if (advance.internalAcceptedSubstepCount !== 1) {
        throw new Error(`audit lost internal substeps: ${advance.internalAcceptedSubstepCount}`);
      }
      const next = advance.observation;
      const dt = next.acceptedState.acceptedTimeSec - previous.acceptedState.acceptedTimeSec;
      const beforeFlow = valveFlows(previous), afterFlow = valveFlows(next);
      leftBeMl += afterFlow.AoV * dt;
      rightBeMl += afterFlow.PV * dt;
      leftTrapezoidMl += 0.5 * (beforeFlow.AoV + afterFlow.AoV) * dt;
      rightTrapezoidMl += 0.5 * (beforeFlow.PV + afterFlow.PV) * dt;
      maximumStepContinuityErrorMl = Math.max(maximumStepContinuityErrorMl, Math.abs(
        leftDomainVolumeMl(next.acceptedState) - leftDomainVolumeMl(previous.acceptedState)
          - dt * (afterFlow.PV - afterFlow.AoV),
      ));
      substeps += 1;
      previous = next;
      if (nextTime === gridTarget) ordinal += 1;
    }
    const end = snapshot(previous);
    const volumeChangeMl = end.leftDomainVolumeMl - start.leftDomainVolumeMl;
    const duration = end.timeSec - start.timeSec;
    rows.push({ cycle, start, end, substeps, volumeChangeMl,
      leftBeMl, rightBeMl, leftTrapezoidMl, rightTrapezoidMl,
      leftBeCoLPerMin: leftBeMl * 0.06 / duration,
      rightBeCoLPerMin: rightBeMl * 0.06 / duration,
      beContinuityResidualMl: volumeChangeMl - (rightBeMl - leftBeMl),
      trapezoidContinuityResidualMl: volumeChangeMl - (rightTrapezoidMl - leftTrapezoidMl),
      maximumStepContinuityErrorMl,
    });
    process.stderr.write(`[preload-settlement] extra beat ${cycle}: dV=${volumeChangeMl.toFixed(6)} mL, LV=${(leftBeMl * 0.06 / duration).toFixed(6)}, RV=${(rightBeMl * 0.06 / duration).toFixed(6)} L/min\n`);
  }
  return rows;
}

const { values } = parseArgs({ options: {
  evaluation: { type: "string" }, request: { type: "string" }, output: { type: "string" },
  "extra-cycles": { type: "string", default: "20" },
  settlement: { type: "string", default: "v1" },
} });
if (!values.evaluation || !values.output) throw new Error("--evaluation RESULT_JSON [--request REQUEST_JSON] --output NEW_DIRECTORY");
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw new Error("audit requires a clean committed worktree");
const extraCycles = Number(values["extra-cycles"]);
if (!["v1", "v2"].includes(values.settlement!)) throw new Error("settlement must be v1 or v2");
if (!Number.isInteger(extraCycles) || extraCycles < 1 || extraCycles > 25) throw new Error("extra cycles must be 1..25");
const raw = JSON.parse(await readFile(values.evaluation, "utf8")) as Evaluation & { evaluation?: Evaluation; inputs?: Inputs };
const evaluation = raw.evaluation ?? raw;
const inputs: Inputs = values.request ? JSON.parse(await readFile(values.request, "utf8")) as Inputs : raw.inputs!;
if (evaluation.status !== "accepted" || !inputs || ![60, 70].includes(inputs.hemodynamicResearchInputs.heartRateBpm)) throw new Error("accepted Standard70 result and HR60/70 inputs required");
if (Object.values(inputs.mechanismResearchInputs.valveAreas).some((valve) => valve.closedReverseEroaCm2 !== 0)) throw new Error("domain audit requires competent valves");
const output = resolve(values.output);
await mkdir(output);
selectHotPathIntegrityTierV1("full-invariant");
const protocol = {
  auditId: "main-wire-standard70-preload-settlement-audit-v1",
  executionCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  executionTier: "full-invariant", extraCycles,
  settlement: values.settlement,
  settlementPolicy: values.settlement === "v2" ? MAIN_WIRE_FIXED_TONE_SETTLEMENT_V2 : null,
  sourceEvaluation: resolve(values.evaluation), sourceRequest: values.request ? resolve(values.request) : null,
  checkpointSha256: evaluation.exactResult.checkpoint.checkpointSha256,
  hemodynamicResearchInputs: inputs.hemodynamicResearchInputs,
  mechanismResearchInputs: inputs.mechanismResearchInputs,
  ventricularContractilityScale: inputs.ventricularContractilityScale,
  claim: "diagnostic only; declared formal stop policy followed by fixed-tone extension; no baseline adoption",
};
await writeFile(resolve(output, "protocol.json"), JSON.stringify({ ...protocol, identity: await sha256CanonicalJsonHex(protocol) }, null, 2), { flag: "wx" });
const startMs = performance.now();
const source = await MainWireIntegratedModelStandard70TypedAuthoritySessionV1.restoreStandard70ExactCheckpoint(
  evaluation.exactResult.checkpoint, inputs.hemodynamicResearchInputs,
  inputs.ventricularContractilityScale, undefined, inputs.mechanismResearchInputs,
);
const branches: ObservedBranch[] = [];
const measure = values.settlement === "v2" ? measureMainWireIntegratedModelFormalPreloadReserveV2
  : measureMainWireIntegratedModelFormalPreloadReserveV1;
let reserve: Awaited<ReturnType<typeof measure>>;
try {
  reserve = await measure(new ObservedBranch(source, branches, null), inputs.hemodynamicResearchInputs);
} catch (error) {
  await writeFile(resolve(output, "failure.json"), JSON.stringify({ protocol,
    message: error instanceof Error ? error.message : String(error),
    branches: branches.map((branch) => ({ id: branch.id, tbvMl: branch.tbvMl, beats: branch.beats,
      redistributedVolumeMl: branch.volumeClosure.maximumRecentRedistributedVolumeMl(),
      state: branch.currentAcceptedState() })), baselineAdopted: false }), { flag: "wx" });
  throw error;
}
const originalBranches = branches.map((branch) => ({ id: branch.id, parentId: branch.parentId,
  tbvMl: branch.tbvMl, originTimeSec: branch.originTimeSec,
  endTimeSec: branch.currentAcceptedState().acceptedTimeSec, beats: branch.beats,
}));
const high = branches.filter((branch) => Math.abs(branch.tbvMl - reserve.hypervolemicGlobalTbvMl) < 1e-6).at(-1);
if (!high) throw new Error("high endpoint not retained");
const stoppedState = high.currentAcceptedState();
await writeFile(resolve(output, "original.json"), JSON.stringify({ reserve, branches: originalBranches, stoppedState }), { flag: "wx" });
const extension = extendHighEndpoint(high.delegate, extraCycles, inputs.hemodynamicResearchInputs.heartRateBpm);
await writeFile(resolve(output, "result.json"), JSON.stringify({ protocol, reserve,
  originalBranches, extension, endState: high.currentAcceptedState(),
  wallTimeMs: performance.now() - startMs, baselineAdopted: false }), { flag: "wx" });
process.stdout.write(`${output}/result.json\n`);
