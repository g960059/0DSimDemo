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

export const ATRIAL_FIGURE_EIGHT_AV_PLANE_PHASE5AT_ID =
  "atrial-figure-eight-av-plane-candidate-phase5at-result-v1";

export const ATRIAL_FIGURE_EIGHT_AV_PLANE_PHASE5AT_RESULT_PATH =
  "data/myocardium/protocols/atrial-figure-eight-av-plane-candidate-phase5at-result-v1.json";

type AtrialChamber = "LA" | "RA";
type Valve = "MV" | "TV";
type VariantId =
  | "refined-a1-v1-reference"
  | "single-chamber-av-plane-reference-v1"
  | "refined-a1-explicit-av-plane-v1"
  | "soft-sleeve-explicit-av-plane-v1"
  | "soft-sleeve-strong-av-plane-v1";

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

type AvPlaneShiftMetrics = {
  readonly maxShiftMl: number;
  readonly meanShiftMl: number;
  readonly inletClosedMeanShiftMl: number;
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
  readonly avPlaneShift: Record<AtrialChamber, AvPlaneShiftMetrics>;
  readonly valveAttribution: Record<Valve, ValveAttribution>;
  readonly settledLvRvHealthInterpretable: boolean;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly structuralMechanism: "reference" | "single-chamber-av-plane" | "two-branch-explicit-av-plane";
  readonly settledPointIds: readonly PointId[];
  readonly readableLaPointIds: readonly PointId[];
  readonly readableRaPointIds: readonly PointId[];
  readonly readableBothPointIds: readonly PointId[];
  readonly laOpposedPointIds: readonly PointId[];
  readonly raOpposedPointIds: readonly PointId[];
  readonly settledLvRvHealthOkPointIds: readonly PointId[];
  readonly valveImpulsePerBeatMean: number;
  readonly valveHitPerBeatMean: number;
  readonly meanLaReadabilityScore: number;
  readonly meanRaReadabilityScore: number;
  readonly maxLaAvPlaneShiftMl: number;
  readonly maxRaAvPlaneShiftMl: number;
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_FIGURE_EIGHT_AV_PLANE_PHASE5AT_ID;
  readonly phase: "Phase 5AT";
  readonly claimBoundary: "atrial-figure-eight-av-plane-structural-candidate-no-selection";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-figure-eight-readability-phase5an-result-v1.json",
    "data/myocardium/protocols/atrial-figure-eight-ra-variant-sweep-phase5as-result-v1.json",
  ];
  readonly protocol: {
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly variantIds: readonly VariantId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly explicitAvPlaneCandidateScope: "provider-local-pressure-volume-shift-only";
    readonly noRuntimeDefaultFlip: true;
    readonly noProductionBridgeSelection: true;
    readonly noEngineDefaultParamChange: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly summary: {
    readonly bestStructuralVariantId: VariantId | null;
    readonly bestStructuralStatus: "candidate-local-signal" | "not-supported";
    readonly referenceReadableBothPointIds: readonly PointId[];
    readonly bestStructuralReadableBothPointIds: readonly PointId[];
    readonly bestStructuralRaOpposedPointIds: readonly PointId[];
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

type VariantDefinition = {
  readonly id: VariantId;
  readonly structuralMechanism: VariantSummary["structuralMechanism"];
  readonly laParams: ActiveChamberParams;
  readonly raParams: ActiveChamberParams;
  readonly explicitAvPlaneShiftScale: number;
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
] as const;

const VARIANTS: readonly VariantId[] = [
  "refined-a1-v1-reference",
  "single-chamber-av-plane-reference-v1",
  "refined-a1-explicit-av-plane-v1",
  "soft-sleeve-explicit-av-plane-v1",
  "soft-sleeve-strong-av-plane-v1",
] as const;

export function buildAtrialFigureEightAvPlaneCandidatePhase5ATEvidence(): Evidence {
  const definitions = VARIANTS.map(variantDefinition);
  const runs = definitions.flatMap((definition) => POINTS.map((point) => runPoint(definition, point)));
  const variantSummaries = definitions.map((definition) => summarizeVariant(definition, runs));
  const reference = variantSummaries.find((summary) => summary.variantId === "refined-a1-v1-reference");
  const candidates = variantSummaries.filter((summary) => summary.variantId !== "refined-a1-v1-reference");
  const best = candidates
    .slice()
    .sort((left, right) =>
      right.readableBothPointIds.length - left.readableBothPointIds.length
      || right.readableRaPointIds.length - left.readableRaPointIds.length
      || right.raOpposedPointIds.length - left.raOpposedPointIds.length
      || right.meanRaReadabilityScore - left.meanRaReadabilityScore
      || right.meanLaReadabilityScore - left.meanLaReadabilityScore
    )[0] ?? null;
  const referenceReadable = reference?.readableBothPointIds ?? [];
  const bestStructuralStatus = best && (
    best.readableBothPointIds.length > referenceReadable.length
    || best.raOpposedPointIds.length > (reference?.raOpposedPointIds.length ?? 0)
    || best.meanRaReadabilityScore > (reference?.meanRaReadabilityScore ?? Number.NEGATIVE_INFINITY)
  )
    ? "candidate-local-signal" as const
    : "not-supported" as const;
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_FIGURE_EIGHT_AV_PLANE_PHASE5AT_ID,
    phase: "Phase 5AT",
    claimBoundary: "atrial-figure-eight-av-plane-structural-candidate-no-selection",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-figure-eight-readability-phase5an-result-v1.json",
      "data/myocardium/protocols/atrial-figure-eight-ra-variant-sweep-phase5as-result-v1.json",
    ],
    protocol: {
      pointSource: "hr75-hr90-normal-low-high-preload",
      variantIds: VARIANTS,
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      explicitAvPlaneCandidateScope: "provider-local-pressure-volume-shift-only",
      noRuntimeDefaultFlip: true,
      noProductionBridgeSelection: true,
      noEngineDefaultParamChange: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    points: POINTS,
    runs,
    variantSummaries,
    summary: {
      bestStructuralVariantId: best?.variantId ?? null,
      bestStructuralStatus,
      referenceReadableBothPointIds: referenceReadable,
      bestStructuralReadableBothPointIds: best?.readableBothPointIds ?? [],
      bestStructuralRaOpposedPointIds: best?.raOpposedPointIds ?? [],
      currentInterpretation: interpretation(reference, best, bestStructuralStatus),
      recommendedNext: [
        "treat the single-chamber AV-plane signal as support for AV-plane-driven reservoir mechanics, not as a production bridge candidate",
        "do not promote the current two-branch plus body-AV-plane composition; it did not create both-chamber envelope readability",
        "next structural work should define an AtrialPhysiologyBridgeV2/A2 contract rather than adding more parameter-only sleeve or AV-plane scale sweeps",
        "keep atrial figure-eight work separate from LV/RV Land default and RA Land source-stress sign-semantics work",
      ],
      blockers: [
        "production atrial bridge selection remains blocked",
        "official morphology acceptance remains blocked",
        "atrial Land/RDQ validation remains blocked",
        "AV-plane coupling physiology is diagnostic-only and not calibrated to MAPSE or reservoir fraction targets",
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

function runPoint(definition: VariantDefinition, point: PointSpec): Run {
  const core = new ModelCore({ ...defaultParams(), HR: point.HR }, {
    activeSourceProviders: createVariantProviders(definition),
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
    variantId: definition.id,
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
    avPlaneShift: {
      LA: avPlaneShiftMetrics(runSamples, "LA", definition.laParams, diagnosticAvPlaneShiftScale(definition)),
      RA: avPlaneShiftMetrics(runSamples, "RA", definition.raParams, diagnosticAvPlaneShiftScale(definition)),
    },
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

function createVariantProviders(
  definition: VariantDefinition,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  return {
    LA: sourceProvider(`phase5at-${definition.id}-la`, definition.laParams, definition.explicitAvPlaneShiftScale),
    RA: sourceProvider(`phase5at-${definition.id}-ra`, definition.raParams, definition.explicitAvPlaneShiftScale),
  };
}

function sourceProvider(
  sourceProviderId: string,
  params: ActiveChamberParams,
  explicitAvPlaneShiftScale: number,
): ModelCoreExperimentalActiveSourceProvider {
  const branchModel = new ActiveStressChamberModel(params);
  const bodyAvPlaneModel = new ActiveStressChamberModel({
    ...params,
    reservoirBranchGain: 0,
    reservoirStrokeMl: 0,
    avPlaneGainMl: Math.max(params.avPlaneGainMl ?? 0, 0) * Math.max(explicitAvPlaneShiftScale, 0),
  });
  return {
    sourceProviderId,
    initialInternal: () => branchModel.initialInternal(),
    pressure: ({ volumeMl, internal, chamberCtx }) =>
      pressureWithExplicitAvPlaneReservoir(
        branchModel,
        bodyAvPlaneModel,
        volumeMl,
        internal,
        chamberCtx,
        explicitAvPlaneShiftScale,
      ),
    passivePressure: ({ volumeMl, chamberCtx }) =>
      branchModel.passivePressure(volumeMl, chamberCtx),
    internalDerivatives: ({ volumeMl, internal, chamberCtx }) =>
      branchModel.internalDerivatives(volumeMl, internal, chamberCtx),
  };
}

function pressureWithExplicitAvPlaneReservoir(
  branchModel: ActiveStressChamberModel,
  bodyAvPlaneModel: ActiveStressChamberModel,
  volumeMl: number,
  internal: ChamberInternal,
  ctx: ChamberCtx,
  explicitAvPlaneShiftScale: number,
): number {
  if (explicitAvPlaneShiftScale <= 0) return branchModel.pressure(volumeMl, internal, ctx);
  const state = branchModel.reservoirBranchState(volumeMl, internal, ctx);
  const bodyPressure = bodyAvPlaneModel.pressure(state.vBodyMl, internal, ctx);
  const pressureFloor = branchModel.ap.pressureFloorMmHg ?? -5;
  return clamp(0.5 * (bodyPressure + state.pReservoirMmHg), pressureFloor, 260);
}

function diagnosticAvPlaneShiftScale(definition: VariantDefinition): number {
  if (definition.structuralMechanism === "single-chamber-av-plane") return 1;
  return definition.explicitAvPlaneShiftScale;
}

function avPlaneShiftMl(params: ActiveChamberParams, ctx: ChamberCtx, explicitAvPlaneShiftScale: number): number {
  const gain = Math.max(params.avPlaneGainMl ?? 0, 0) * Math.max(explicitAvPlaneShiftScale, 0);
  if (gain <= 0) return 0;
  const shortening = clamp01(ctx.pairedVentricleShortening01 ?? (ctx.side === "right" ? 0 : (ctx.lvShortening01 ?? 0)));
  const inletOpen = ctx.inletValveOpen01 ?? (ctx.side === "right" ? undefined : ctx.mvOpen01);
  const inletClosed = inletOpen == null ? clamp01(ctx.systolicGate ?? 0) : clamp01(1 - inletOpen);
  return gain * shortening * inletClosed;
}

function variantDefinition(id: VariantId): VariantDefinition {
  if (id === "single-chamber-av-plane-reference-v1") {
    return {
      id,
      structuralMechanism: "single-chamber-av-plane",
      laParams: { ...defaultActiveLA, reservoirBranchGain: 0, reservoirStrokeMl: 0 },
      raParams: { ...defaultActiveRA, reservoirBranchGain: 0, reservoirStrokeMl: 0 },
      explicitAvPlaneShiftScale: 0,
    };
  }
  if (id === "refined-a1-explicit-av-plane-v1") {
    return {
      id,
      structuralMechanism: "two-branch-explicit-av-plane",
      laParams: refinedLaParams(),
      raParams: refinedRaBaseParams(),
      explicitAvPlaneShiftScale: 1.0,
    };
  }
  if (id === "soft-sleeve-explicit-av-plane-v1") {
    return {
      id,
      structuralMechanism: "two-branch-explicit-av-plane",
      laParams: refinedLaParams(),
      raParams: raSoftSleeveParams(),
      explicitAvPlaneShiftScale: 1.0,
    };
  }
  if (id === "soft-sleeve-strong-av-plane-v1") {
    return {
      id,
      structuralMechanism: "two-branch-explicit-av-plane",
      laParams: refinedLaParams(),
      raParams: raSoftSleeveParams(),
      explicitAvPlaneShiftScale: 1.5,
    };
  }
  return {
    id,
    structuralMechanism: "reference",
    laParams: refinedLaParams(),
    raParams: refinedRaBaseParams(),
    explicitAvPlaneShiftScale: 0,
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

function raSoftSleeveParams(): ActiveChamberParams {
  return {
    ...refinedRaBaseParams(),
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

function summarizeVariant(definition: VariantDefinition, runs: readonly Run[]): VariantSummary {
  const variantRuns = runs.filter((run) => run.variantId === definition.id);
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
  const laOpposedPointIds = variantRuns
    .filter((run) => run.LA?.signedLobesOpposed)
    .map((run) => run.pointId);
  const raOpposedPointIds = variantRuns
    .filter((run) => run.RA?.signedLobesOpposed)
    .map((run) => run.pointId);
  return {
    variantId: definition.id,
    structuralMechanism: definition.structuralMechanism,
    settledPointIds,
    readableLaPointIds,
    readableRaPointIds,
    readableBothPointIds,
    laOpposedPointIds,
    raOpposedPointIds,
    settledLvRvHealthOkPointIds,
    valveImpulsePerBeatMean: round(mean(variantRuns.map(totalValveImpulsePerBeat))),
    valveHitPerBeatMean: round(mean(variantRuns.map(totalValveHitsPerBeat))),
    meanLaReadabilityScore: round(mean(variantRuns.map((run) => run.LA?.readabilityScore ?? Number.NaN))),
    meanRaReadabilityScore: round(mean(variantRuns.map((run) => run.RA?.readabilityScore ?? Number.NaN))),
    maxLaAvPlaneShiftMl: round(Math.max(0, ...variantRuns.map((run) => run.avPlaneShift.LA.maxShiftMl))),
    maxRaAvPlaneShiftMl: round(Math.max(0, ...variantRuns.map((run) => run.avPlaneShift.RA.maxShiftMl))),
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

function avPlaneShiftMetrics(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  params: ActiveChamberParams,
  explicitAvPlaneShiftScale: number,
): AvPlaneShiftMetrics {
  if (samples.length === 0 || explicitAvPlaneShiftScale <= 0) {
    return { maxShiftMl: 0, meanShiftMl: 0, inletClosedMeanShiftMl: 0 };
  }
  const ventVolumes = samples.map((sample) => chamber === "LA" ? sample.VLV : sample.VRV);
  const ed = Math.max(...ventVolumes);
  const es = Math.min(...ventVolumes);
  const strokeRef = Math.max(ed - es, 1e-6);
  const shifts = samples.map((sample) => {
    const vent = chamber === "LA" ? sample.VLV : sample.VRV;
    const inlet = chamber === "LA" ? sample.xiMV : sample.xiTV;
    const shortening = clamp01((ed - vent) / strokeRef);
    return Math.max(params.avPlaneGainMl ?? 0, 0) * explicitAvPlaneShiftScale * shortening * clamp01(1 - inlet);
  });
  const closedShifts = shifts.filter((_shift, index) => {
    const inlet = chamber === "LA" ? samples[index].xiMV : samples[index].xiTV;
    return inlet <= 0.2;
  });
  return {
    maxShiftMl: round(Math.max(0, ...shifts)),
    meanShiftMl: round(mean(shifts)),
    inletClosedMeanShiftMl: round(mean(closedShifts)),
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

function interpretation(
  reference: VariantSummary | undefined,
  best: VariantSummary | null,
  status: Evidence["summary"]["bestStructuralStatus"],
): string {
  if (!best || status === "not-supported") {
    return "Explicit AV-plane structural candidates did not improve the focused atrial figure-eight envelope over the refined A1 reference.";
  }
  if (best.variantId === "single-chamber-av-plane-reference-v1") {
    return [
      "The single-chamber AV-plane reference produced the strongest local RA signal, which supports AV-plane-driven reservoir mechanics as a useful axis.",
      `Reference both-chamber readable points: ${reference?.readableBothPointIds.length ? reference.readableBothPointIds.join(", ") : "none"}.`,
      `Single-chamber candidate both-chamber readable points: ${best.readableBothPointIds.length ? best.readableBothPointIds.join(", ") : "none"}.`,
      `Single-chamber candidate RA opposed-lobe points: ${best.raOpposedPointIds.length ? best.raOpposedPointIds.join(", ") : "none"}.`,
      "The explicit two-branch plus body-AV-plane candidates did not create envelope-wide readability, so this is a structural direction signal only, not an A1.1 adoption signal.",
    ].join(" ");
  }
  return [
    `${best.variantId} produced the strongest AV-plane structural signal in this focused diagnostic.`,
    `Reference both-chamber readable points: ${reference?.readableBothPointIds.length ? reference.readableBothPointIds.join(", ") : "none"}.`,
    `Candidate both-chamber readable points: ${best.readableBothPointIds.length ? best.readableBothPointIds.join(", ") : "none"}.`,
    `Candidate RA opposed-lobe points: ${best.raOpposedPointIds.length ? best.raOpposedPointIds.join(", ") : "none"}.`,
    "This is provider-local diagnostic evidence only, not a bridge selection or production wiring claim.",
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

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
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
  const evidence = buildAtrialFigureEightAvPlaneCandidatePhase5ATEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_FIGURE_EIGHT_AV_PLANE_PHASE5AT_RESULT_PATH);
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
    bestStructuralVariantId: evidence.summary.bestStructuralVariantId,
    bestStructuralStatus: evidence.summary.bestStructuralStatus,
    referenceReadableBothPointIds: evidence.summary.referenceReadableBothPointIds,
    bestStructuralReadableBothPointIds: evidence.summary.bestStructuralReadableBothPointIds,
    bestStructuralRaOpposedPointIds: evidence.summary.bestStructuralRaOpposedPointIds,
  }, null, 2));
}
