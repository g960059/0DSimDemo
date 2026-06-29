import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ModelCore, defaultParams, type ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import {
  ActiveStressChamberModel,
  defaultActiveLA,
  defaultActiveRA,
  type ActiveChamberParams,
  type Chamber,
  type ChamberCtx,
  type ChamberInternal,
} from "@/engine/chambers";
import { measureSteady } from "@/engine/measure";
import type { SimMetrics, SimSample } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_FIGURE_EIGHT_RA_VARIANT_SWEEP_PHASE5AS_ID =
  "atrial-figure-eight-ra-variant-sweep-phase5as-result-v1";

export const ATRIAL_FIGURE_EIGHT_RA_VARIANT_SWEEP_PHASE5AS_RESULT_PATH =
  "data/myocardium/protocols/atrial-figure-eight-ra-variant-sweep-phase5as-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type VariantId =
  | "refined-a1-v1-reference"
  | "ra-low-threshold-fast-recoil-v1"
  | "ra-strong-reservoir-v1"
  | "ra-soft-sleeve-v1"
  | "ra-soft-sleeve-stronger-v1"
  | "ra-soft-sleeve-slower-v1"
  | "ra-wide-sleeve-v1"
  | "ra-balanced-recoil-v1";

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

type LoopMetrics = {
  readonly pressureRangeMmHg: number;
  readonly volumeRangeMl: number;
  readonly boosterLoopSignedArea: number;
  readonly reservoirLoopSignedArea: number;
  readonly lobeBalance: number;
  readonly signedLobesOpposed: boolean;
  readonly pvSelfIntersections: number;
  readonly roughnessSamplingSpan: number;
  readonly educationalFigureEightReadable: boolean;
  readonly readabilityScore: number;
};

type ValveAttribution = {
  readonly hitsPerBeat: number;
  readonly diodeImpulsePerBeat: number;
  readonly qDotClampHitFraction: number;
};

type Run = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly settled: boolean;
  readonly settleReason: string;
  readonly settleBeats: number;
  readonly healthStatus: string;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LVEDPApprox: number | null;
  readonly RVEDPApprox: number | null;
  readonly LA: LoopMetrics | null;
  readonly RA: LoopMetrics | null;
  readonly valveAttribution: Record<Valve, ValveAttribution>;
  readonly settledLvRvHealthInterpretable: boolean;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly settledPointIds: readonly PointId[];
  readonly readableLaPointIds: readonly PointId[];
  readonly readableRaPointIds: readonly PointId[];
  readonly readableBothPointIds: readonly PointId[];
  readonly hr75BothReadable: boolean;
  readonly hr90BothReadable: boolean;
  readonly settledLvRvHealthOkPointIds: readonly PointId[];
  readonly valveImpulsePerBeatMean: number;
  readonly valveHitPerBeatMean: number;
  readonly meanLaReadabilityScore: number;
  readonly meanRaReadabilityScore: number;
  readonly raOpposedPointIds: readonly PointId[];
  readonly raLobeBalancePassPointIds: readonly PointId[];
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_FIGURE_EIGHT_RA_VARIANT_SWEEP_PHASE5AS_ID;
  readonly phase: "Phase 5AS";
  readonly claimBoundary: "atrial-figure-eight-ra-variant-sweep-no-selection";
  readonly protocol: {
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly variantIds: readonly VariantId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly summary: {
    readonly bestVariantId: VariantId | null;
    readonly bestVariantStatus: "candidate-local-signal" | "not-supported";
    readonly bestVariantReadableBothPointIds: readonly PointId[];
    readonly bestVariantRaOpposedPointIds: readonly PointId[];
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noProductionRuntimeWiring: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noAtrialLandRdqClaim: true;
    readonly noAfValidationClaim: true;
    readonly noFinalAtrialPhysiologyClaim: true;
    readonly noLvRvLandDefaultGate: true;
    readonly noMorphologyAcceptance: true;
  };
  readonly doesNotUnlock: readonly string[];
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001;
const SAMPLE_HZ = 1000;
const MEASURE_BEATS = 3;
const ROUGHNESS_SAMPLE_HZ = [240, 480, 960] as const;
const READABILITY = {
  minPressureRangeMmHg: 1.5,
  minVolumeRangeMl: 12,
  minLobeBalance: 0.08,
  maxRoughnessSamplingSpan: 0.45,
} as const;
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
];

const VARIANTS: readonly VariantId[] = [
  "refined-a1-v1-reference",
  "ra-low-threshold-fast-recoil-v1",
  "ra-strong-reservoir-v1",
  "ra-soft-sleeve-v1",
  "ra-soft-sleeve-stronger-v1",
  "ra-soft-sleeve-slower-v1",
  "ra-wide-sleeve-v1",
  "ra-balanced-recoil-v1",
];

export function buildAtrialFigureEightRaVariantSweepPhase5ASEvidence(): Evidence {
  const runs = VARIANTS.flatMap((variantId) => POINTS.map((point) => runPoint(variantId, point)));
  const variantSummaries = VARIANTS.map((variantId) => summarizeVariant(variantId, runs));
  const candidates = variantSummaries.filter((summary) => summary.variantId !== "refined-a1-v1-reference");
  const best = candidates
    .slice()
    .sort((left, right) =>
      right.readableBothPointIds.length - left.readableBothPointIds.length
      || right.readableRaPointIds.length - left.readableRaPointIds.length
      || right.raOpposedPointIds.length - left.raOpposedPointIds.length
      || right.meanRaReadabilityScore - left.meanRaReadabilityScore
    )[0] ?? null;
  const bestVariantStatus = best && (best.readableRaPointIds.length > 0 || best.raOpposedPointIds.length > 0)
    ? "candidate-local-signal" as const
    : "not-supported" as const;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_FIGURE_EIGHT_RA_VARIANT_SWEEP_PHASE5AS_ID,
    phase: "Phase 5AS",
    claimBoundary: "atrial-figure-eight-ra-variant-sweep-no-selection",
    protocol: {
      pointSource: "hr75-hr90-normal-low-high-preload",
      variantIds: VARIANTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    variantSummaries,
    summary: {
      bestVariantId: best?.variantId ?? null,
      bestVariantStatus,
      bestVariantReadableBothPointIds: best?.readableBothPointIds ?? [],
      bestVariantRaOpposedPointIds: best?.raOpposedPointIds ?? [],
      currentInterpretation: interpretation(best, bestVariantStatus),
      recommendedNext: [
        "if a RA variant shows candidate-local signal, promote only that parameter set into an explicit refined A1.1 provider candidate and rerun the Phase 5AN readability comparator",
        "keep atrial figure-eight work separate from LV/RV Land default and RA Land source-stress sign-semantics work",
        "do not select a production atrial bridge from this sweep alone",
      ],
      blockers: [
        "production atrial bridge selection remains blocked",
        "official morphology acceptance remains blocked",
        "atrial Land/RDQ validation remains blocked",
      ],
    },
    boundary: {
      noProductionRuntimeWiring: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noAtrialLandRdqClaim: true,
      noAfValidationClaim: true,
      noFinalAtrialPhysiologyClaim: true,
      noLvRvLandDefaultGate: true,
      noMorphologyAcceptance: true,
    },
    doesNotUnlock: [
      "production atrial bridge wiring",
      "official case reauthoring",
      "Workbench runtime wiring",
      "state schema migration",
      "atrial Land/RDQ validation",
      "AF validation",
      "final atrial physiology acceptance",
      "LV/RV Land default gating",
      "official morphology acceptance",
    ],
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(variantId: VariantId, point: PointSpec): Run {
  const core = new ModelCore({ ...defaultParams(), HR: point.HR }, {
    activeSourceProviders: createVariantProviders(variantId),
  });
  core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
  const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
  const settled = settleStatus.settled && settleStatus.actualSeconds != null;
  const samples = settled
    ? measureSteady(core, settleStatus as typeof settleStatus & { actualSeconds: number }, {
      dt: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      requireProjectorQuiet: false,
    })
    : null;
  const tailSamples = samples == null
    ? core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false })
    : null;
  const health = samples?.health ?? core.health();
  const metrics = samples?.metrics ?? null;
  const runSamples = samples?.samples ?? tailSamples ?? [];
  const valves = {
    MV: valveAttribution(runSamples, "MV", point.HR),
    TV: valveAttribution(runSamples, "TV", point.HR),
  };
  return {
    variantId,
    pointId: point.id,
    HR: point.HR,
    targetTBVMl: point.targetTBVMl,
    settled,
    settleReason: settleStatus.reason,
    settleBeats: settleStatus.beats,
    healthStatus: health.status,
    forwardCO_L: finiteOrNull(samples?.forwardCO_L),
    forwardCO_R: finiteOrNull(samples?.forwardCO_R),
    LVEDPApprox: finiteOrNull(metrics?.LVEDPApprox),
    RVEDPApprox: finiteOrNull(metrics?.RVEDPApprox),
    LA: loopMetrics(runSamples, "LA"),
    RA: loopMetrics(runSamples, "RA"),
    valveAttribution: valves,
    settledLvRvHealthInterpretable:
      settled
      && health.status === "ok"
      && metrics != null
      && isPositiveFinite(samples?.forwardCO_L)
      && isPositiveFinite(samples?.forwardCO_R)
      && Number.isFinite(metrics.LVEDPApprox)
      && Number.isFinite(metrics.RVEDPApprox),
  };
}

function createVariantProviders(variantId: VariantId): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  return {
    LA: sourceProvider(`phase5as-${variantId}-la`, refinedLaParams()),
    RA: sourceProvider(`phase5as-${variantId}-ra`, raParamsForVariant(variantId)),
  };
}

function sourceProvider(
  sourceProviderId: string,
  params: ActiveChamberParams,
): ModelCoreExperimentalActiveSourceProvider {
  const model = new ActiveStressChamberModel(params);
  return {
    sourceProviderId,
    initialInternal: () => model.initialInternal(),
    pressure: ({ volumeMl, internal, chamberCtx }) => model.pressure(volumeMl, internal, chamberCtx),
    passivePressure: ({ volumeMl, chamberCtx }) => model.passivePressure(volumeMl, chamberCtx),
    internalDerivatives: ({ volumeMl, internal, chamberCtx }) =>
      model.internalDerivatives(volumeMl, internal, chamberCtx),
  };
}

function refinedLaParams(): ActiveChamberParams {
  return {
    ...defaultActiveLA,
    reservoirBranchGain: 0.72,
    reservoirStrokeMl: 8,
    reservoirSleeveVuMl: 10,
    reservoirSleeveCompliance: 4.5,
    reservoirSleeveMaxVolumeMl: 30,
    reservoirQPressureFloorGuard: 1,
    reservoirSleeveMinPressureGuard: 1,
    reservoirTauFill: 0.135,
    reservoirTauRecoilIVR: 0.070,
    reservoirValveThreshold: 0.28,
  };
}

function refinedRaBaseParams(): ActiveChamberParams {
  return {
    ...defaultActiveRA,
    reservoirBranchGain: 0.70,
    reservoirStrokeMl: 10,
    reservoirSleeveVuMl: 13,
    reservoirSleeveCompliance: 5.25,
    reservoirSleeveMaxVolumeMl: 36,
    reservoirQPressureFloorGuard: 1,
    reservoirSleeveMinPressureGuard: 1,
    reservoirTauFill: 0.150,
    reservoirTauRecoilIVR: 0.080,
    reservoirValveThreshold: 0.28,
  };
}

function raParamsForVariant(variantId: VariantId): ActiveChamberParams {
  const base = refinedRaBaseParams();
  if (variantId === "ra-low-threshold-fast-recoil-v1") {
    return {
      ...base,
      reservoirBranchGain: 0.82,
      reservoirStrokeMl: 12,
      reservoirTauFill: 0.120,
      reservoirTauRecoilIVR: 0.045,
      reservoirValveThreshold: 0.12,
    };
  }
  if (variantId === "ra-strong-reservoir-v1") {
    return {
      ...base,
      reservoirBranchGain: 1.0,
      reservoirStrokeMl: 16,
      reservoirSleeveVuMl: 12,
      reservoirSleeveCompliance: 4.2,
      reservoirSleeveMaxVolumeMl: 44,
      reservoirTauFill: 0.100,
      reservoirTauRecoilIVR: 0.055,
      reservoirValveThreshold: 0.18,
    };
  }
  if (variantId === "ra-soft-sleeve-v1") {
    return {
      ...base,
      reservoirBranchGain: 0.88,
      reservoirStrokeMl: 14,
      reservoirSleeveVuMl: 14,
      reservoirSleeveCompliance: 7.5,
      reservoirSleeveMaxVolumeMl: 46,
      reservoirTauFill: 0.150,
      reservoirTauRecoilIVR: 0.065,
      reservoirValveThreshold: 0.20,
    };
  }
  if (variantId === "ra-balanced-recoil-v1") {
    return {
      ...base,
      reservoirBranchGain: 0.92,
      reservoirStrokeMl: 13,
      reservoirSleeveVuMl: 12,
      reservoirSleeveCompliance: 5.5,
      reservoirSleeveMaxVolumeMl: 42,
      reservoirTauFill: 0.115,
      reservoirTauRecoilIVR: 0.040,
      reservoirValveThreshold: 0.24,
    };
  }
  if (variantId === "ra-soft-sleeve-stronger-v1") {
    return {
      ...base,
      reservoirBranchGain: 1.05,
      reservoirStrokeMl: 18,
      reservoirSleeveVuMl: 14,
      reservoirSleeveCompliance: 8.5,
      reservoirSleeveMaxVolumeMl: 52,
      reservoirTauFill: 0.160,
      reservoirTauRecoilIVR: 0.070,
      reservoirValveThreshold: 0.20,
    };
  }
  if (variantId === "ra-soft-sleeve-slower-v1") {
    return {
      ...base,
      reservoirBranchGain: 0.96,
      reservoirStrokeMl: 16,
      reservoirSleeveVuMl: 15,
      reservoirSleeveCompliance: 9.5,
      reservoirSleeveMaxVolumeMl: 54,
      reservoirTauFill: 0.190,
      reservoirTauRecoilIVR: 0.095,
      reservoirValveThreshold: 0.22,
    };
  }
  if (variantId === "ra-wide-sleeve-v1") {
    return {
      ...base,
      reservoirBranchGain: 1.0,
      reservoirStrokeMl: 17,
      reservoirSleeveVuMl: 10,
      reservoirSleeveCompliance: 8.0,
      reservoirSleeveMaxVolumeMl: 56,
      reservoirTauFill: 0.150,
      reservoirTauRecoilIVR: 0.060,
      reservoirValveThreshold: 0.18,
    };
  }
  return base;
}

function summarizeVariant(variantId: VariantId, runs: readonly Run[]): VariantSummary {
  const variantRuns = runs.filter((run) => run.variantId === variantId);
  const settledPointIds = variantRuns.filter((run) => run.settled).map((run) => run.pointId);
  const readableLaPointIds = variantRuns
    .filter((run) => run.LA?.educationalFigureEightReadable)
    .map((run) => run.pointId);
  const readableRaPointIds = variantRuns
    .filter((run) => run.RA?.educationalFigureEightReadable)
    .map((run) => run.pointId);
  const readableBothPointIds = variantRuns
    .filter((run) => run.LA?.educationalFigureEightReadable && run.RA?.educationalFigureEightReadable)
    .map((run) => run.pointId);
  const settledLvRvHealthOkPointIds = variantRuns
    .filter((run) => run.settledLvRvHealthInterpretable)
    .map((run) => run.pointId);
  const raOpposedPointIds = variantRuns
    .filter((run) => run.RA?.signedLobesOpposed)
    .map((run) => run.pointId);
  const raLobeBalancePassPointIds = variantRuns
    .filter((run) => (run.RA?.lobeBalance ?? 0) >= READABILITY.minLobeBalance)
    .map((run) => run.pointId);
  return {
    variantId,
    settledPointIds,
    readableLaPointIds,
    readableRaPointIds,
    readableBothPointIds,
    hr75BothReadable: envelopeReadable(readableBothPointIds, 75),
    hr90BothReadable: envelopeReadable(readableBothPointIds, 90),
    settledLvRvHealthOkPointIds,
    valveImpulsePerBeatMean: round(mean(variantRuns.map(totalValveImpulsePerBeat))),
    valveHitPerBeatMean: round(mean(variantRuns.map(totalValveHitsPerBeat))),
    meanLaReadabilityScore: round(mean(variantRuns.map((run) => run.LA?.readabilityScore ?? Number.NaN))),
    meanRaReadabilityScore: round(mean(variantRuns.map((run) => run.RA?.readabilityScore ?? Number.NaN))),
    raOpposedPointIds,
    raLobeBalancePassPointIds,
    selectableByThisArtifact: false,
  };
}

function loopMetrics(samples: readonly SimSample[], chamber: AtrialChamber): LoopMetrics | null {
  if (samples.length < 16) return null;
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
  const intersections = countSelfIntersections(volumes, pressures);
  const signedLobesOpposed = boosterSigned * reservoirSigned < 0;
  const educationalFigureEightReadable =
    pressureRange >= READABILITY.minPressureRangeMmHg
    && volumeRange >= READABILITY.minVolumeRangeMl
    && signedLobesOpposed
    && lobeBalance >= READABILITY.minLobeBalance
    && roughnessSamplingSpan <= READABILITY.maxRoughnessSamplingSpan
    && intersections > 0;
  return {
    pressureRangeMmHg: round(pressureRange),
    volumeRangeMl: round(volumeRange),
    boosterLoopSignedArea: round(boosterSigned),
    reservoirLoopSignedArea: round(reservoirSigned),
    lobeBalance: round(lobeBalance),
    signedLobesOpposed,
    pvSelfIntersections: intersections,
    roughnessSamplingSpan: round(roughnessSamplingSpan),
    educationalFigureEightReadable,
    readabilityScore: round(readabilityScore({
      pressureRange,
      volumeRange,
      lobeBalance,
      roughnessSamplingSpan,
      intersections,
      signedLobesOpposed,
    })),
  };
}

function valveAttribution(samples: readonly SimSample[], valve: Valve, HR: number): ValveAttribution {
  const hitValues = samples.map((sample) => valueAt(sample, `${valve}_diodeImpulse`) > 0 ? 1 : 0);
  const impulses = samples.map((sample) => Math.max(0, valueAt(sample, `${valve}_diodeImpulse`)));
  const qDotHitValues = samples.map((sample) => valueAt(sample, `${valve}_qDotClampHit01`) > 0 ? 1 : 0);
  const beats = MEASURE_BEATS;
  return {
    hitsPerBeat: round(hitValues.reduce((sum, value) => sum + value, 0) / beats),
    diodeImpulsePerBeat: round(impulses.reduce((sum, value) => sum + value, 0) / beats),
    qDotClampHitFraction: round(qDotHitValues.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1)),
  };
}

function totalValveHitsPerBeat(run: Run): number {
  return run.valveAttribution.MV.hitsPerBeat + run.valveAttribution.TV.hitsPerBeat;
}

function totalValveImpulsePerBeat(run: Run): number {
  return run.valveAttribution.MV.diodeImpulsePerBeat + run.valveAttribution.TV.diodeImpulsePerBeat;
}

function envelopeReadable(pointIds: readonly PointId[], HR: 75 | 90): boolean {
  const suffix = `hr${HR}`;
  return (["normal", "low-preload", "high-preload"] as const).every((preload) =>
    pointIds.includes(`${preload}-${suffix}` as PointId)
  );
}

function interpretation(best: VariantSummary | null, status: Evidence["summary"]["bestVariantStatus"]): string {
  if (!best || status === "not-supported") {
    return "No RA-local reservoir/booster variant produced a useful candidate-local signal in this sweep.";
  }
  return [
    `${best.variantId} produced the strongest RA-local figure-eight signal in this sweep.`,
    `Both-chamber readable points: ${best.readableBothPointIds.length > 0 ? best.readableBothPointIds.join(", ") : "none"}.`,
    `RA opposed-lobe points: ${best.raOpposedPointIds.length > 0 ? best.raOpposedPointIds.join(", ") : "none"}.`,
    "This is a parameter-space signal only, not a bridge selection.",
  ].join(" ");
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

function countSelfIntersections(xs: readonly number[], ys: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < xs.length - 3; i++) {
    for (let j = i + 2; j < xs.length - 1; j++) {
      if (j === i + 1) continue;
      if (segmentsIntersect(
        xs[i], ys[i],
        xs[i + 1], ys[i + 1],
        xs[j], ys[j],
        xs[j + 1], ys[j + 1],
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
  return t > 0 && t < 1 && u > 0 && u < 1;
}

function valueAt(sample: SimSample, key: string): number {
  const value = (sample as unknown as Record<string, number | undefined>)[key];
  return Number.isFinite(value) ? value! : 0;
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function isPositiveFinite(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value > 0;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function frac(value: number): number {
  return value - Math.floor(value);
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
  const evidence = buildAtrialFigureEightRaVariantSweepPhase5ASEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_FIGURE_EIGHT_RA_VARIANT_SWEEP_PHASE5AS_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    bestVariantId: evidence.summary.bestVariantId,
    bestVariantStatus: evidence.summary.bestVariantStatus,
    bestVariantReadableBothPointIds: evidence.summary.bestVariantReadableBothPointIds,
    bestVariantRaOpposedPointIds: evidence.summary.bestVariantRaOpposedPointIds,
  }, null, 2));
}
