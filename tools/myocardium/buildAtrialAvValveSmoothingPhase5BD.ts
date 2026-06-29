import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ModelCore,
  defaultParams,
  type ModelCoreExperimentalActiveSourceProvider,
  type ModelCoreExperimentalValveDiodeSmoothingOptions,
} from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import { valveFlowIntegral } from "@/engine/flowIntegrals";
import { measureSteady } from "@/engine/measure";
import {
  atrialPhysiologyBridgeV2CandidateParams,
  createAtrialPhysiologyBridgeV2SourceProvider,
  type AtrialPhysiologyBridgeV2Params,
} from "@/engine/myocardium/atrialPhysiologyBridgeV2";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";
import { createAtrialBridgeProviders } from "@/tools/myocardium/buildAtrialBridgeShootout";

export const ATRIAL_AV_VALVE_SMOOTHING_PHASE5BD_ID =
  "atrial-av-valve-smoothing-phase5bd-result-v1";

export const ATRIAL_AV_VALVE_SMOOTHING_PHASE5BD_RESULT_PATH =
  "data/myocardium/protocols/atrial-av-valve-smoothing-phase5bd-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type ClosureId =
  | "current-hard-diode"
  | "mv-tv-soft-floor-5mlps"
  | "mv-tv-soft-floor-15mlps";
type VariantId =
  | "a1-refined-reference"
  | "a2-conduit-full"
  | "a2-conduit-no-booster";
type PointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "normal-hr90"
  | "low-preload-hr90"
  | "high-preload-hr90";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
};

type ClosureSpec = {
  readonly id: ClosureId;
  readonly valveSmoothing: ModelCoreExperimentalValveDiodeSmoothingOptions | null;
};

type LoopMetrics = {
  readonly pressureRangeMmHg: number | null;
  readonly volumeRangeMl: number | null;
  readonly boosterLoopSignedArea: number | null;
  readonly reservoirLoopSignedArea: number | null;
  readonly lobeBalance: number | null;
  readonly signedLobesOpposed: boolean;
  readonly pvSelfIntersections: number | null;
  readonly roughnessSamplingSpan: number | null;
  readonly educationalFigureEightReadable: boolean;
  readonly readabilityScore: number | null;
};

type ValveAttribution = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
  readonly forwardVolumeMl: number;
  readonly reverseVolumeMl: number;
  readonly regurgitantFraction: number;
};

type Run = {
  readonly closureId: ClosureId;
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages">;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LA: LoopMetrics;
  readonly RA: LoopMetrics;
  readonly valveAttribution: Record<Valve, ValveAttribution>;
};

type CandidateComparison = {
  readonly closureId: Exclude<ClosureId, "current-hard-diode">;
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly currentHealthOk: boolean;
  readonly candidateHealthOk: boolean;
  readonly outputPreserved: boolean;
  readonly regurgitationBounded: boolean;
  readonly diodeImpulseReduced: boolean;
  readonly rawBothReadableCurrent: boolean;
  readonly rawBothReadableCandidate: boolean;
  readonly combinedReadabilityScoreGain: number | null;
  readonly totalValveImpulseReductionFraction: number | null;
  readonly maxAvRegurgitantFraction: number | null;
};

type ClosureSummary = {
  readonly closureId: ClosureId;
  readonly healthOkRunCount: number;
  readonly bothReadableRunIds: readonly string[];
  readonly meanCombinedReadabilityScore: number | null;
  readonly meanTotalValveImpulsePerBeat: number | null;
  readonly meanMaxAvRegurgitantFraction: number | null;
  readonly outputPreservedFractionVsCurrent: number | null;
  readonly regurgitationBoundedFraction: number | null;
  readonly diodeImpulseReducedFraction: number | null;
  readonly readabilityGainRunIdsVsCurrent: readonly string[];
  readonly acceptableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_AV_VALVE_SMOOTHING_PHASE5BD_ID;
  readonly phase: "Phase 5BD";
  readonly claimBoundary: "atrial-av-valve-smoothing-diagnostic-no-adoption";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json",
  ];
  readonly protocol: {
    readonly runtimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly closureIds: readonly ClosureId[];
    readonly variantIds: readonly VariantId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly smoothingMechanism: "off-by-default-mv-tv-soft-reverse-flow-floor";
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noValveSmoothingAdoption: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noParameterTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateComparisons: readonly CandidateComparison[];
  readonly closureSummaries: readonly ClosureSummary[];
  readonly summary: {
    readonly bestCandidateClosureId: ClosureId | null;
    readonly diagnosticStatus:
      | "promising-but-not-accepted"
      | "unsafe-regurgitation-or-output-cost"
      | "not-supported";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noValveSmoothingAdoption: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noQDotClampRemoval: true;
    readonly noAtrialBridgeSelection: true;
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAfValidationClaim: true;
  };
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
const READABILITY = {
  minPressureRangeMmHg: 1.5,
  minVolumeRangeMl: 12,
  minLobeBalance: 0.08,
  maxRoughnessSamplingSpan: 0.45,
} as const;
const OUTPUT_RELATIVE_TOLERANCE = 0.25;
const MAX_AV_REGURGITANT_FRACTION = 0.15;
const MIN_DIODE_IMPULSE_REDUCTION_FRACTION = 0.25;
const SETTLE_POLICY: SettlePolicy = {
  ...DEFAULT_SETTLE_POLICY,
  capSeconds: 120,
  postSettleBeats: 2,
};

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, HR: 75 },
  { id: "low-preload-hr75", targetTBVMl: 4800, HR: 75 },
  { id: "high-preload-hr75", targetTBVMl: 6200, HR: 75 },
  { id: "normal-hr90", targetTBVMl: 5600, HR: 90 },
  { id: "low-preload-hr90", targetTBVMl: 4800, HR: 90 },
  { id: "high-preload-hr90", targetTBVMl: 6200, HR: 90 },
] as const;

const VARIANTS: readonly VariantId[] = [
  "a1-refined-reference",
  "a2-conduit-full",
  "a2-conduit-no-booster",
] as const;

const CLOSURES: readonly ClosureSpec[] = [
  { id: "current-hard-diode", valveSmoothing: null },
  {
    id: "mv-tv-soft-floor-5mlps",
    valveSmoothing: {
      mechanismId: "phase5bd-mv-tv-soft-floor-5mlps",
      targetValves: ["MV", "TV"],
      reverseFlowLimitMlPerSec: 5,
      smoothingEpsilonMlPerSec: 0.75,
    },
  },
  {
    id: "mv-tv-soft-floor-15mlps",
    valveSmoothing: {
      mechanismId: "phase5bd-mv-tv-soft-floor-15mlps",
      targetValves: ["MV", "TV"],
      reverseFlowLimitMlPerSec: 15,
      smoothingEpsilonMlPerSec: 2.25,
    },
  },
] as const;

export function buildAtrialAvValveSmoothingPhase5BDEvidence(): Evidence {
  const runs = CLOSURES.flatMap((closure) =>
    VARIANTS.flatMap((variantId) => POINTS.map((point) => runPoint(closure, variantId, point)))
  );
  const candidateComparisons = compareCandidates(runs);
  const closureSummaries = CLOSURES.map((closure) => summarizeClosure(closure.id, runs, candidateComparisons));
  const best = closureSummaries
    .filter((summary) => summary.closureId !== "current-hard-diode")
    .slice()
    .sort((left, right) =>
      right.readabilityGainRunIdsVsCurrent.length - left.readabilityGainRunIdsVsCurrent.length
      || finiteOrScore(right.diodeImpulseReducedFraction) - finiteOrScore(left.diodeImpulseReducedFraction)
      || finiteOrScore(right.regurgitationBoundedFraction) - finiteOrScore(left.regurgitationBoundedFraction)
    )[0] ?? null;
  const diagnosticStatus = classifyDiagnosticStatus(best);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_AV_VALVE_SMOOTHING_PHASE5BD_ID,
    phase: "Phase 5BD",
    claimBoundary: "atrial-av-valve-smoothing-diagnostic-no-adoption",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-valve-diode-readability-phase5bc-result-v1.json",
    ],
    protocol: {
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      closureIds: CLOSURES.map((closure) => closure.id),
      variantIds: VARIANTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      smoothingMechanism: "off-by-default-mv-tv-soft-reverse-flow-floor",
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noValveSmoothingAdoption: true,
      noValveLoadTimingAcceptance: true,
      noParameterTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    candidateComparisons,
    closureSummaries,
    summary: {
      bestCandidateClosureId: best?.closureId ?? null,
      diagnosticStatus,
      currentInterpretation: interpretation(diagnosticStatus, best),
      recommendedNext: recommendedNext(diagnosticStatus),
      blockers: [
        "experimental AV-valve smoothing is off-by-default and unaccepted",
        "bounded regurgitation and output preservation are diagnostic thresholds only",
        "this does not accept valve/load timing, qDot clamp removal, A2 selection, or official morphology",
      ],
    },
    boundary: {
      noValveSmoothingAdoption: true,
      noValveLoadTimingAcceptance: true,
      noQDotClampRemoval: true,
      noAtrialBridgeSelection: true,
      noAllChamberRuntimeDefaultFlip: true,
      noOfficialMorphologyAcceptance: true,
      noAfValidationClaim: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(closure: ClosureSpec, variantId: VariantId, point: PointSpec): Run {
  const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
  const runtimeResolution = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: params,
  });
  const core = new ModelCore(params, {
    ...runtimeResolution.experimentalOptions,
    ...(closure.valveSmoothing ? { valveDiodeSmoothing: closure.valveSmoothing } : {}),
    activeSourceProviders: {
      ...(runtimeResolution.experimentalOptions.activeSourceProviders ?? {}),
      ...createVariantProviders(variantId),
    },
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  const measurement = settled
    ? measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
    })
    : null;
  const samples = measurement?.samples
    ?? core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false });
  const health = measurement?.health ?? core.health();
  return {
    closureId: closure.id,
    variantId,
    pointId: point.id,
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    settled,
    settleReason: settleStatus.reason,
    settleBeats: settleStatus.beats,
    health: {
      status: health.status,
      periodBeats: health.periodBeats,
      messages: health.messages,
    },
    forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
    forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
    LA: loopMetrics(samples, "LA"),
    RA: loopMetrics(samples, "RA"),
    valveAttribution: {
      MV: valveAttribution(samples, "MV"),
      TV: valveAttribution(samples, "TV"),
    },
  };
}

function createVariantProviders(
  variantId: VariantId,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (variantId === "a1-refined-reference") {
    return createAtrialBridgeProviders("atrial-refined-reservoir-booster-bridge-v1");
  }
  return {
    LA: createAtrialPhysiologyBridgeV2SourceProvider("LA", a2ParamsForVariant(variantId, "LA")),
    RA: createAtrialPhysiologyBridgeV2SourceProvider("RA", a2ParamsForVariant(variantId, "RA")),
  };
}

function a2ParamsForVariant(variantId: VariantId, chamber: AtrialChamber): AtrialPhysiologyBridgeV2Params {
  const base = atrialPhysiologyBridgeV2CandidateParams("atrial-a2-conduit-v1", chamber);
  if (variantId === "a2-conduit-no-booster") {
    return { ...base, activeBoosterGain: 0 };
  }
  return base;
}

function compareCandidates(runs: readonly Run[]): readonly CandidateComparison[] {
  const currentRuns = runs.filter((run) => run.closureId === "current-hard-diode");
  return runs
    .filter((run): run is Run & { readonly closureId: Exclude<ClosureId, "current-hard-diode"> } =>
      run.closureId !== "current-hard-diode"
    )
    .map((candidate) => {
      const current = currentRuns.find((run) =>
        run.variantId === candidate.variantId && run.pointId === candidate.pointId
      );
      const currentImpulse = current ? totalValveImpulsePerBeat(current) : null;
      const candidateImpulse = totalValveImpulsePerBeat(candidate);
      const totalValveImpulseReductionFraction = currentImpulse != null && currentImpulse > 1e-9
        ? (currentImpulse - candidateImpulse) / currentImpulse
        : null;
      const maxAvRegurgitantFraction = Math.max(
        candidate.valveAttribution.MV.regurgitantFraction,
        candidate.valveAttribution.TV.regurgitantFraction,
      );
      return {
        closureId: candidate.closureId,
        variantId: candidate.variantId,
        pointId: candidate.pointId,
        currentHealthOk: current?.health.status === "ok",
        candidateHealthOk: candidate.health.status === "ok",
        outputPreserved: current != null && outputPreserved(current, candidate),
        regurgitationBounded: maxAvRegurgitantFraction <= MAX_AV_REGURGITANT_FRACTION,
        diodeImpulseReduced:
          totalValveImpulseReductionFraction != null
          && totalValveImpulseReductionFraction >= MIN_DIODE_IMPULSE_REDUCTION_FRACTION,
        rawBothReadableCurrent: current != null && bothReadable(current),
        rawBothReadableCandidate: bothReadable(candidate),
        combinedReadabilityScoreGain: current != null
          ? finiteOrNull(combinedScore(candidate) - combinedScore(current))
          : null,
        totalValveImpulseReductionFraction: finiteOrNull(totalValveImpulseReductionFraction),
        maxAvRegurgitantFraction: finiteOrNull(maxAvRegurgitantFraction),
      };
    });
}

function summarizeClosure(
  closureId: ClosureId,
  runs: readonly Run[],
  comparisons: readonly CandidateComparison[],
): ClosureSummary {
  const closureRuns = runs.filter((run) => run.closureId === closureId);
  const closureComparisons = comparisons.filter((comparison) => comparison.closureId === closureId);
  const readabilityGainRunIds = closureComparisons
    .filter((comparison) => !comparison.rawBothReadableCurrent && comparison.rawBothReadableCandidate)
    .map(runId);
  return {
    closureId,
    healthOkRunCount: closureRuns.filter((run) => run.health.status === "ok").length,
    bothReadableRunIds: closureRuns.filter(bothReadable).map((run) => runId(run)),
    meanCombinedReadabilityScore: finiteOrNull(mean(closureRuns.map(combinedScore))),
    meanTotalValveImpulsePerBeat: finiteOrNull(mean(closureRuns.map(totalValveImpulsePerBeat))),
    meanMaxAvRegurgitantFraction: finiteOrNull(mean(closureRuns.map((run) =>
      Math.max(run.valveAttribution.MV.regurgitantFraction, run.valveAttribution.TV.regurgitantFraction)))),
    outputPreservedFractionVsCurrent: fraction(closureComparisons, (comparison) => comparison.outputPreserved),
    regurgitationBoundedFraction: fraction(closureComparisons, (comparison) => comparison.regurgitationBounded),
    diodeImpulseReducedFraction: fraction(closureComparisons, (comparison) => comparison.diodeImpulseReduced),
    readabilityGainRunIdsVsCurrent: readabilityGainRunIds,
    acceptableByThisArtifact: false,
  };
}

function classifyDiagnosticStatus(best: ClosureSummary | null): Evidence["summary"]["diagnosticStatus"] {
  if (!best || best.readabilityGainRunIdsVsCurrent.length === 0) return "not-supported";
  if (
    (best.outputPreservedFractionVsCurrent ?? 0) >= 0.8
    && (best.regurgitationBoundedFraction ?? 0) >= 0.8
  ) {
    return "promising-but-not-accepted";
  }
  return "unsafe-regurgitation-or-output-cost";
}

function interpretation(
  status: Evidence["summary"]["diagnosticStatus"],
  best: ClosureSummary | null,
): string {
  if (!best) {
    return "No AV-valve smoothing candidate produced raw both-chamber readability gains over the current hard-diode reference.";
  }
  if (status === "promising-but-not-accepted") {
    return [
      `${best.closureId} produced raw both-chamber readability gains while preserving output and bounding AV regurgitation in most paired points.`,
      "This supports moving from post-processed diode cleanup to a narrower real valve/load timing candidate, but it does not adopt smoothing.",
    ].join(" ");
  }
  if (status === "unsafe-regurgitation-or-output-cost") {
    return [
      `${best.closureId} produced readability gains, but output preservation or AV regurgitation thresholds were not met.`,
      "This supports the valve path as a mechanism but blocks adoption of this soft-floor candidate.",
    ].join(" ");
  }
  return "The off-by-default AV-valve smoothing candidates did not convert the Phase 5BC post-processed signal into raw loop readability gains.";
}

function recommendedNext(status: Evidence["summary"]["diagnosticStatus"]): readonly string[] {
  if (status === "promising-but-not-accepted") {
    return [
      "turn the best soft-floor signal into a narrower valve/load timing candidate with explicit regurgitation and output guardrails",
      "keep A2 and A1 diagnostic-only until valve/load timing is accepted",
      "do not tune A2 gains to compensate for valve event artifacts",
    ];
  }
  if (status === "unsafe-regurgitation-or-output-cost") {
    return [
      "do not adopt this AV-valve smoothing candidate",
      "try a stricter complementarity formulation or smaller reverse-flow floor if continuing valve diagnostics",
      "continue LandAtrial shadow work in parallel because smoothing alone was not clean enough",
    ];
  }
  return [
    "do not continue AV-valve smoothing from these candidates alone",
    "continue LandAtrial shadow plus wall/AV-plane strain proxy work as the primary atrial physiology path",
    "keep valve contamination as a measurement confounder but not a solved mechanism",
  ];
}

function loopMetrics(samples: readonly SimSample[], chamber: AtrialChamber): LoopMetrics {
  if (samples.length < 16) return emptyLoopMetrics();
  const loopSamples = samples.map((sample) => ({
    t: sample.t,
    phi: sample.phi,
    volumeMl: chamber === "LA" ? sample.VLA : sample.VRA,
    pressureMmHg: chamber === "LA" ? sample.LAP : sample.RAP,
  }));
  const pressures = loopSamples.map((sample) => sample.pressureMmHg);
  const volumes = loopSamples.map((sample) => sample.volumeMl);
  const boosterSigned = phaseLoopArea(loopSamples, [
    [0.76, 1.0],
    [0.0, 0.14],
  ]);
  const reservoirSigned = phaseLoopArea(loopSamples, [[0.18, 0.72]]);
  const boosterAbs = Math.abs(boosterSigned);
  const reservoirAbs = Math.abs(reservoirSigned);
  const lobeBalance = Math.min(boosterAbs, reservoirAbs) / Math.max(boosterAbs, reservoirAbs, 1e-9);
  const roughnessValues = ROUGHNESS_SAMPLE_HZ.map((hz) => pvLoopRoughness(downsample(loopSamples, hz)));
  const roughnessSamplingSpan = relativeSpan(roughnessValues);
  const pressureRange = Math.max(...pressures) - Math.min(...pressures);
  const volumeRange = Math.max(...volumes) - Math.min(...volumes);
  const intersections = countSelfIntersections(downsample(loopSamples, 240));
  const signedLobesOpposed = boosterSigned * reservoirSigned < 0;
  const educationalFigureEightReadable =
    pressureRange >= READABILITY.minPressureRangeMmHg
    && volumeRange >= READABILITY.minVolumeRangeMl
    && signedLobesOpposed
    && lobeBalance >= READABILITY.minLobeBalance
    && roughnessSamplingSpan <= READABILITY.maxRoughnessSamplingSpan
    && intersections > 0;
  return {
    pressureRangeMmHg: finiteOrNull(pressureRange),
    volumeRangeMl: finiteOrNull(volumeRange),
    boosterLoopSignedArea: finiteOrNull(boosterSigned),
    reservoirLoopSignedArea: finiteOrNull(reservoirSigned),
    lobeBalance: finiteOrNull(lobeBalance),
    signedLobesOpposed,
    pvSelfIntersections: intersections,
    roughnessSamplingSpan: finiteOrNull(roughnessSamplingSpan),
    educationalFigureEightReadable,
    readabilityScore: finiteOrNull(readabilityScore({
      pressureRange,
      volumeRange,
      lobeBalance,
      roughnessSamplingSpan,
      intersections,
      signedLobesOpposed,
    })),
  };
}

function emptyLoopMetrics(): LoopMetrics {
  return {
    pressureRangeMmHg: null,
    volumeRangeMl: null,
    boosterLoopSignedArea: null,
    reservoirLoopSignedArea: null,
    lobeBalance: null,
    signedLobesOpposed: false,
    pvSelfIntersections: null,
    roughnessSamplingSpan: null,
    educationalFigureEightReadable: false,
    readabilityScore: null,
  };
}

function valveAttribution(samples: readonly SimSample[], valve: Valve): ValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  const flow = valveFlowIntegral(samples, valve === "MV" ? "QMV" : "QTV");
  return {
    hitsPerBeat: round(hitValues.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    diodeImpulsePerBeat: round(impulses.reduce((sum, value) => sum + value, 0) / MEASURE_BEATS),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
    forwardVolumeMl: round(flow.forwardVolumeMl),
    reverseVolumeMl: round(flow.reverseVolumeMl),
    regurgitantFraction: round(flow.regurgitantFraction),
  };
}

function outputPreserved(reference: Run, candidate: Run): boolean {
  return relativeWithin(reference.forwardCO_L, candidate.forwardCO_L, OUTPUT_RELATIVE_TOLERANCE)
    && relativeWithin(reference.forwardCO_R, candidate.forwardCO_R, OUTPUT_RELATIVE_TOLERANCE);
}

function relativeWithin(reference: number | null, candidate: number | null, tolerance: number): boolean {
  if (reference == null || candidate == null) return false;
  return Math.abs(candidate - reference) / Math.max(Math.abs(reference), 1e-9) <= tolerance;
}

function bothReadable(run: Run): boolean {
  return run.LA.educationalFigureEightReadable && run.RA.educationalFigureEightReadable;
}

function combinedScore(run: Run): number {
  return (run.LA.readabilityScore ?? Number.NaN) + (run.RA.readabilityScore ?? Number.NaN);
}

function totalValveImpulsePerBeat(run: Run): number {
  return run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat;
}

function runId(run: Pick<Run, "closureId" | "variantId" | "pointId">): string;
function runId(run: Pick<CandidateComparison, "closureId" | "variantId" | "pointId">): string;
function runId(run: Pick<Run, "closureId" | "variantId" | "pointId">): string {
  return `${run.closureId}:${run.variantId}:${run.pointId}`;
}

function phaseLoopArea(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number; readonly phi: number }[],
  windows: readonly (readonly [number, number])[],
): number {
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const theta = frac(samples[i].phi);
    if (!windows.some(([lo, hi]) => theta >= lo && theta < hi)) continue;
    area += 0.5 * (
      samples[i - 1].volumeMl * samples[i].pressureMmHg
      - samples[i].volumeMl * samples[i - 1].pressureMmHg
    );
  }
  return area;
}

function pvLoopRoughness(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number }[],
): number {
  if (samples.length < 5) return Number.POSITIVE_INFINITY;
  let curvature = 0;
  let slope = 0;
  for (let i = 2; i < samples.length; i++) {
    const p0 = samples[i - 2].pressureMmHg;
    const p1 = samples[i - 1].pressureMmHg;
    const p2 = samples[i].pressureMmHg;
    const v0 = samples[i - 2].volumeMl;
    const v1 = samples[i - 1].volumeMl;
    const v2 = samples[i].volumeMl;
    const s1 = (p1 - p0) / Math.max(Math.abs(v1 - v0), 1e-6);
    const s2 = (p2 - p1) / Math.max(Math.abs(v2 - v1), 1e-6);
    curvature += Math.abs(s2 - s1);
    slope += Math.abs(s2);
  }
  return curvature / Math.max(slope, 1e-9);
}

function countSelfIntersections(
  samples: readonly { readonly volumeMl: number; readonly pressureMmHg: number }[],
): number {
  let count = 0;
  for (let i = 0; i < samples.length - 3; i++) {
    for (let j = i + 2; j < samples.length - 1; j++) {
      if (segmentsIntersect(
        samples[i].volumeMl,
        samples[i].pressureMmHg,
        samples[i + 1].volumeMl,
        samples[i + 1].pressureMmHg,
        samples[j].volumeMl,
        samples[j].pressureMmHg,
        samples[j + 1].volumeMl,
        samples[j + 1].pressureMmHg,
      )) {
        count += 1;
      }
    }
  }
  return count;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const abx = bx - ax;
  const aby = by - ay;
  const cdx = dx - cx;
  const cdy = dy - cy;
  const denom = abx * cdy - aby * cdx;
  if (Math.abs(denom) < 1e-9) return false;
  const acx = cx - ax;
  const acy = cy - ay;
  const t = (acx * cdy - acy * cdx) / denom;
  const u = (acx * aby - acy * abx) / denom;
  return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6;
}

function readabilityScore(input: {
  readonly pressureRange: number;
  readonly volumeRange: number;
  readonly lobeBalance: number;
  readonly roughnessSamplingSpan: number;
  readonly intersections: number;
  readonly signedLobesOpposed: boolean;
}): number {
  const pressureScore = clamp01(input.pressureRange / READABILITY.minPressureRangeMmHg);
  const volumeScore = clamp01(input.volumeRange / READABILITY.minVolumeRangeMl);
  const balanceScore = clamp01(input.lobeBalance / READABILITY.minLobeBalance);
  const roughnessScore = clamp01(1 - input.roughnessSamplingSpan / READABILITY.maxRoughnessSamplingSpan);
  const intersectionScore = input.intersections > 0 ? 1 : 0;
  const signScore = input.signedLobesOpposed ? 1 : 0;
  return (pressureScore + volumeScore + balanceScore + roughnessScore + intersectionScore + signScore) / 6;
}

function downsample<T extends { readonly t: number }>(samples: readonly T[], targetHz: number): readonly T[] {
  if (samples.length <= 2) return samples;
  const duration = samples.at(-1)!.t - samples[0].t;
  const sourceHz = samples.length / Math.max(duration, 1e-9);
  const stride = Math.max(1, Math.round(sourceHz / targetHz));
  return samples.filter((_sample, index) => index % stride === 0);
}

function relativeSpan(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.POSITIVE_INFINITY;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  return (max - min) / Math.max(Math.abs(max), Math.abs(min), 1e-9);
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function finiteOrScore(value: number | null): number {
  return value ?? Number.NEGATIVE_INFINITY;
}

function fraction<T>(values: readonly T[], predicate: (value: T) => boolean): number | null {
  if (values.length === 0) return null;
  return round(values.filter(predicate).length / values.length);
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForHash(entry)]),
  );
}

function writeEvidence(): Evidence {
  const evidence = buildAtrialAvValveSmoothingPhase5BDEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_AV_VALVE_SMOOTHING_PHASE5BD_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    diagnosticStatus: evidence.summary.diagnosticStatus,
    bestCandidateClosureId: evidence.summary.bestCandidateClosureId,
  }, null, 2));
}
