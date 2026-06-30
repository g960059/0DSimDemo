import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5BIArtifact from "@/data/myocardium/protocols/landatrial-target-scoring-phase5bi-result-v1.json";
import phase5BHArtifact from "@/data/myocardium/protocols/ra-landatrial-calibration-scout-phase5bh-result-v1.json";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import targetPack from "@/data/myocardium/targets/atrial-waveform-targets-v1.json";
import { ModelCore, defaultParams, type ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import { measureSteady } from "@/engine/measure";
import {
  LANDATRIAL_SHADOW_PARAMETER_PACK,
  createAtrialLandShadowSourceProvider,
} from "@/engine/myocardium/atrialLandShadow";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvRangeAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import { atrialLoopShape, phaseOf, phaseInWindow } from "@/engine/verification/shapeMetrics";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy, type SettleStatus } from "@/engine/settling";

export const LANDATRIAL_GEOMETRY_SCOUT_PHASE5BJ_ID =
  "landatrial-geometry-scout-phase5bj-result-v1";
export const LANDATRIAL_GEOMETRY_SCOUT_PHASE5BJ_RESULT_PATH =
  "data/myocardium/protocols/landatrial-geometry-scout-phase5bj-result-v1.json";

type AtrialChamber = "LA" | "RA";
type CandidateId =
  | "promoted-landatrial-shadow-current-geometry"
  | "landatrial-avplane-low-la5-ra6"
  | "landatrial-avplane-high-la15-ra18"
  | "landatrial-avplane-high-la20-ra24"
  | "landatrial-avplane-la20-ra12"
  | "landatrial-avplane-la10-ra24"
  | "landatrial-wall-reference-la50-ra55";
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

type CandidateSpec = {
  readonly id: CandidateId;
  readonly activeOverrides?: Partial<Record<AtrialChamber, Record<string, number>>>;
  readonly rationale: string;
};

type Range = readonly [number, number];
type RangeCompact = { readonly min: number | null; readonly max: number | null };

type InstrumentationCompact = {
  readonly sourceActiveStressPaCalls: number;
  readonly commitProviderStateAfterStepCalls: number;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
  readonly sourceActiveFiberStressPa: RangeCompact;
  readonly fiberEngineeringStrain: RangeCompact;
  readonly freeCalciumUM: RangeCompact;
};

type SettleCompact = {
  readonly settled: boolean;
  readonly reason: SettleStatus["reason"];
  readonly beats: number;
  readonly actualSeconds: number | null;
  readonly worstSignal: SettleStatus["worstSignal"];
  readonly worstDelta: number | null;
  readonly adjacentDelta: number | null;
  readonly periodBeats: SettleStatus["periodBeats"];
  readonly periodDelta: number | null;
  readonly worstDeltaToPrimaryTolerance: number | null;
};

type AtrialVolumeFunction = {
  readonly beatCount: number;
  readonly maxVolumeMl: number | null;
  readonly preAtrialContractionVolumeMl: number | null;
  readonly minVolumeMl: number | null;
  readonly totalEmptyingFraction: number | null;
  readonly passiveEmptyingFraction: number | null;
  readonly activeEmptyingFraction: number | null;
  readonly allBroadPass: boolean;
  readonly broadRangeDistance: number | null;
};

type DirectWallStrain = {
  readonly source: "direct-wall-lambda-readback-v1";
  readonly beatCount: number;
  readonly lambdaMin: number | null;
  readonly lambdaMax: number | null;
  readonly lambdaPreAtrialContraction: number | null;
  readonly reservoirStrain: number | null;
  readonly conduitStrain: number | null;
  readonly contractileStrain: number | null;
  readonly reservoirRangePass: boolean;
  readonly conduitRangePass: boolean;
  readonly contractileRangePass: boolean;
  readonly allRangePass: boolean;
  readonly sourceRangeDistance: number | null;
  readonly avPlaneSensitivity: {
    readonly lambdaWithoutAvPlaneMin: number | null;
    readonly lambdaWithoutAvPlaneMax: number | null;
    readonly maxLambdaDeltaWithoutMinusWithAvPlane: number | null;
    readonly effectiveVolumeCorrectionMl: RangeCompact;
    readonly avPlaneDescent01: RangeCompact;
  };
};

type PressureWaveTiming = {
  readonly aWaveMaxMmHg: number | null;
  readonly vWaveMaxMmHg: number | null;
  readonly xDescentMinMmHg: number | null;
  readonly yDescentMinMmHg: number | null;
  readonly relationSignal: "la-v-ge-a" | "ra-a-ge-v" | "not-supported" | "missing";
};

type RawFigureEightReadability = {
  readonly selfIntersections: number;
  readonly signedAreaMmHgMl: number | null;
  readonly absAreaMmHgMl: number | null;
  readonly midVolumePressureSpreadMmHg: number | null;
  readonly boosterLoopSignedAreaMmHgMl: number | null;
  readonly reservoirLoopSignedAreaMmHgMl: number | null;
  readonly opposingLobes: boolean;
  readonly rawReadableByExistingThreshold: boolean;
};

type ChamberScoring = {
  readonly volumeFunction: AtrialVolumeFunction;
  readonly directWallStrain: DirectWallStrain;
  readonly pressureWaveTiming: PressureWaveTiming;
  readonly rawFigureEightReadability: RawFigureEightReadability;
  readonly pressure: {
    readonly passiveMmHg: RangeCompact;
    readonly activeMmHg: RangeCompact;
    readonly avPlaneDeltaMmHg: RangeCompact;
    readonly floorHit01: RangeCompact;
  };
};

type Run = {
  readonly candidateId: CandidateId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly status: "measured" | "settle-failed" | "runtime-error";
  readonly settle: SettleCompact | null;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages"> | null;
  readonly metrics: Pick<SimMetrics, "CO_L" | "CO_R" | "SV_L" | "SV_R" | "AoPMean" | "PAPMean" | "RAPMean" | "LAPMean" | "TBV"> | null;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly providerIds: Partial<Record<Chamber, string>>;
  readonly instrumentation: {
    readonly LA: InstrumentationCompact | null;
    readonly RA: InstrumentationCompact | null;
  };
  readonly LA: ChamberScoring | null;
  readonly RA: ChamberScoring | null;
  readonly errorMessage: string | null;
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly rationale: string;
  readonly measuredPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly settleFailedPointIds: readonly PointId[];
  readonly runtimeErrorPointIds: readonly PointId[];
  readonly outputPreservedPointIds: readonly PointId[];
  readonly bothAtriaVolumeFunctionPassPointIds: readonly PointId[];
  readonly bothAtriaDirectWallStrainPassPointIds: readonly PointId[];
  readonly laRawReadablePointIds: readonly PointId[];
  readonly raRawReadablePointIds: readonly PointId[];
  readonly bothAtriaRawReadablePointIds: readonly PointId[];
  readonly laPressureRelationSignalPointIds: readonly PointId[];
  readonly raPressureRelationSignalPointIds: readonly PointId[];
  readonly meanLaVolumeDistance: number | null;
  readonly meanRaVolumeDistance: number | null;
  readonly meanLaDirectWallStrainDistance: number | null;
  readonly meanRaDirectWallStrainDistance: number | null;
  readonly meanCombinedTargetDistance: number | null;
  readonly totalLandSolveFailureCount: number;
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof LANDATRIAL_GEOMETRY_SCOUT_PHASE5BJ_ID;
  readonly phase: "Phase 5BJ";
  readonly claimBoundary: "landatrial-avplane-geometry-scout-no-default-no-physiology-acceptance";
  readonly targetPackId: typeof targetPack.id;
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/ra-landatrial-calibration-scout-phase5bh-result-v1.json",
    "data/myocardium/protocols/landatrial-target-scoring-phase5bi-result-v1.json",
    "data/myocardium/protocols/atrial-waveform-target-pack-phase5az-result-v1.json",
    "data/myocardium/protocols/atrial-strain-proxy-scoring-phase5be-result-v1.json",
  ];
  readonly protocol: {
    readonly baseRuntimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly scoredTargets: readonly [
      "volume-derived-emptying-fractions",
      "direct-wall-lambda-strain",
      "a-v-pressure-relation-orientation",
      "raw-figure-eight-readability",
      "av-plane-gain-and-wall-reference-sensitivity",
    ];
    readonly noA1A2GainSweep: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noLandAtrialParameterPackPromotion: true;
    readonly noQDotRootZcValveTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly targetPackDigest: {
    readonly sourceCount: number;
    readonly leftAtriumVolumeBroadRanges: Record<"total" | "passive" | "active", Range>;
    readonly rightAtriumVolumeBroadRanges: Record<"total" | "passive" | "active", Range>;
    readonly leftAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
    readonly rightAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
    readonly strainScoringUpgrade: "uses-direct-wall-lambda-readbacks-not-cuberoot-volume-proxy";
  };
  readonly phase5BHDigest: {
    readonly phase5bhStatus: string;
    readonly phase5bhHash: string;
    readonly phase5bhRecommendedCandidateId: string | null;
    readonly promotedParameterPackId: typeof LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId;
  };
  readonly phase5BIDigest: {
    readonly phase5biStatus: string;
    readonly phase5biHash: string;
    readonly phase5biBestCandidateId: string | null;
    readonly phase5biAvPlaneAblationDelta: number | null;
  };
  readonly points: readonly PointSpec[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly scoutRecommendation: {
    readonly recommendedCandidateId: CandidateId | null;
    readonly recommendedActiveOverrides: Partial<Record<AtrialChamber, Record<string, number>>> | null;
    readonly deltaMeanCombinedTargetDistanceRecommendedMinusCurrent: number | null;
    readonly deltaBothAtriaVolumePassCountRecommendedMinusCurrent: number;
    readonly deltaBothAtriaRawReadableCountRecommendedMinusCurrent: number;
    readonly interpretation: string;
  };
  readonly runs: readonly Run[];
  readonly summary: {
    readonly diagnosticStatus:
      | "landatrial-geometry-scout-candidate-recorded"
      | "landatrial-geometry-scout-health-or-output-blocked"
      | "landatrial-geometry-scout-runtime-error";
    readonly bestCandidateByCombinedTargetDistanceId: CandidateId | null;
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noA1A2Selection: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAfValidationClaim: true;
    readonly noQDotClampRemoval: true;
    readonly noRootZcRetuning: true;
    readonly noValveLoadTimingAcceptance: true;
    readonly noPermanentGate: true;
  };
  readonly normalizedSha256: string;
};

const DT_SEC = 0.001 as const;
const SAMPLE_HZ = 1000 as const;
const MEASURE_BEATS = 3 as const;
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

const CANDIDATES: readonly CandidateSpec[] = [
  {
    id: "promoted-landatrial-shadow-current-geometry",
    rationale: "Promoted Phase 5BH LA+RA LandAtrial shadow pack with current atrial wall geometry and AV-plane gains.",
  },
  {
    id: "landatrial-avplane-low-la5-ra6",
    activeOverrides: {
      LA: { avPlaneGainMl: 5 },
      RA: { avPlaneGainMl: 6 },
    },
    rationale: "Lower AV-plane effective-volume coupling to test whether current gains over-drive wall-geometry target distance.",
  },
  {
    id: "landatrial-avplane-high-la15-ra18",
    activeOverrides: {
      LA: { avPlaneGainMl: 15 },
      RA: { avPlaneGainMl: 18 },
    },
    rationale: "Moderately increase AV-plane effective-volume coupling because Phase 5BI showed AV-plane enabled reduced direct target distance.",
  },
  {
    id: "landatrial-avplane-high-la20-ra24",
    activeOverrides: {
      LA: { avPlaneGainMl: 20 },
      RA: { avPlaneGainMl: 24 },
    },
    rationale: "Stronger symmetric AV-plane coupling stress test before any accepted geometry change.",
  },
  {
    id: "landatrial-avplane-la20-ra12",
    activeOverrides: {
      LA: { avPlaneGainMl: 20 },
      RA: { avPlaneGainMl: 12 },
    },
    rationale: "Left-sided AV-plane gain increase only, to separate LA target-distance movement from RA output/settling effects.",
  },
  {
    id: "landatrial-avplane-la10-ra24",
    activeOverrides: {
      LA: { avPlaneGainMl: 10 },
      RA: { avPlaneGainMl: 24 },
    },
    rationale: "Right-sided AV-plane gain increase only, to test whether RA reservoir/conduit shortfall can improve without changing LA.",
  },
  {
    id: "landatrial-wall-reference-la50-ra55",
    activeOverrides: {
      LA: { Vref: 50 },
      RA: { Vref: 55 },
    },
    rationale: "Wall-reference geometry scout; shifts reference chamber stretch without changing Land source parameters or Tref.",
  },
] as const;

export function buildLandAtrialGeometryScoutPhase5BJEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidate) => POINTS.map((point) => runPoint(candidate, point)));
  const candidateSummaries = CANDIDATES.map((candidate) => summarizeCandidate(candidate, runs));
  const best = candidateSummaries.slice().sort((left, right) =>
    combinedDistance(left) - combinedDistance(right))[0] ?? null;
  const diagnosticStatus = classifyDiagnosticStatus(candidateSummaries);
  const scoutRecommendation = computeScoutRecommendation(candidateSummaries);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: LANDATRIAL_GEOMETRY_SCOUT_PHASE5BJ_ID,
    phase: "Phase 5BJ",
    claimBoundary: "landatrial-avplane-geometry-scout-no-default-no-physiology-acceptance",
    targetPackId: targetPack.id,
    sourceEvidence: [
      "data/myocardium/protocols/ra-landatrial-calibration-scout-phase5bh-result-v1.json",
      "data/myocardium/protocols/landatrial-target-scoring-phase5bi-result-v1.json",
      "data/myocardium/protocols/atrial-waveform-target-pack-phase5az-result-v1.json",
      "data/myocardium/protocols/atrial-strain-proxy-scoring-phase5be-result-v1.json",
    ],
    protocol: {
      baseRuntimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES.map((candidate) => candidate.id),
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      scoredTargets: [
        "volume-derived-emptying-fractions",
        "direct-wall-lambda-strain",
        "a-v-pressure-relation-orientation",
        "raw-figure-eight-readability",
        "av-plane-gain-and-wall-reference-sensitivity",
      ],
      noA1A2GainSweep: true,
      noRuntimeDefaultFlip: true,
      noAtrialPhysiologyAcceptance: true,
      noLandAtrialParameterPackPromotion: true,
      noQDotRootZcValveTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    targetPackDigest: {
      sourceCount: targetPack.sources.length,
      leftAtriumVolumeBroadRanges: {
        total: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.totalEmptyingFraction.broadRange),
        passive: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.passiveEmptyingFraction.broadRange),
        active: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.activeEmptyingFraction.broadRange),
      },
      rightAtriumVolumeBroadRanges: {
        total: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.totalEmptyingFraction.broadRange),
        passive: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.passiveEmptyingFraction.broadRange),
        active: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.activeEmptyingFraction.broadRange),
      },
      leftAtriumStrainSourceRanges: {
        reservoir: asRange(targetPack.strainTargets.leftAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.leftAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.leftAtrium.contractileStrain.normalRange95Ci),
      },
      rightAtriumStrainSourceRanges: {
        reservoir: asRange(targetPack.strainTargets.rightAtrium.reservoirStrain.normalRange95Ci),
        conduit: asRange(targetPack.strainTargets.rightAtrium.conduitStrain.normalRange95Ci),
        contractile: asRange(targetPack.strainTargets.rightAtrium.contractileStrain.normalRange95Ci),
      },
      strainScoringUpgrade: "uses-direct-wall-lambda-readbacks-not-cuberoot-volume-proxy",
    },
    phase5BHDigest: {
      phase5bhStatus: phase5BHArtifact.summary.diagnosticStatus,
      phase5bhHash: phase5BHArtifact.normalizedSha256,
      phase5bhRecommendedCandidateId: phase5BHArtifact.summary.recommendedCandidateId ?? null,
      promotedParameterPackId: LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId,
    },
    phase5BIDigest: {
      phase5biStatus: phase5BIArtifact.summary.diagnosticStatus,
      phase5biHash: phase5BIArtifact.normalizedSha256,
      phase5biBestCandidateId: phase5BIArtifact.summary.bestCandidateByCombinedTargetDistanceId ?? null,
      phase5biAvPlaneAblationDelta:
        phase5BIArtifact.avPlaneAblationDelta.deltaMeanCombinedTargetDistanceBaseMinusAblation ?? null,
    },
    points: POINTS,
    candidateSummaries,
    scoutRecommendation,
    runs,
    summary: {
      diagnosticStatus,
      bestCandidateByCombinedTargetDistanceId: best?.candidateId ?? null,
      currentInterpretation: interpretation(candidateSummaries, best, diagnosticStatus, scoutRecommendation),
      recommendedNext: recommendedNext(diagnosticStatus, scoutRecommendation),
      blockers: [
        "Phase 5BJ scouts LandAtrial AV-plane/effective geometry; it does not promote a new shadow parameter pack, accept atrial physiology, or flip all chambers to runtime default.",
        "A1/A2 are frozen and not used as forward selection candidates in this artifact.",
        "Raw figure-eight readability remains diagnostic until target/function and valve/load timing evidence are jointly accepted.",
      ],
    },
    boundary: {
      noAllChamberRuntimeDefaultFlip: true,
      noAtrialPhysiologyAcceptance: true,
      noA1A2Selection: true,
      noOfficialMorphologyAcceptance: true,
      noAfValidationClaim: true,
      noQDotClampRemoval: true,
      noRootZcRetuning: true,
      noValveLoadTimingAcceptance: true,
      noPermanentGate: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(candidate: CandidateSpec, point: PointSpec): Run {
  try {
    const params: Partial<CoreRuntimeParams> = {
      ...defaultParams(),
      HR: point.HR,
      nodeOverrides: candidate.activeOverrides ? nodeOverrides(candidate.activeOverrides) : undefined,
    };
    const laInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const raInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolution = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      runtimeParams: params,
    });
    const activeSourceProviders: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> = {
      ...(resolution.experimentalOptions.activeSourceProviders ?? {}),
      ...createCandidateProviders(candidate, laInstrumentation, raInstrumentation),
    };
    const core = new ModelCore(params, {
      ...resolution.experimentalOptions,
      activeSourceProviders,
    });
    core.initializeVenousPressuresForTargetTBV(point.targetTBVMl);
    const settleStatus = core.settleToSteady(SETTLE_POLICY, DT_SEC, 480);
    const settled = settleStatus.settled && settleStatus.actualSeconds != null;
    const measurement = settled
      ? measureSteady(core, settleStatus as SettleStatus & { actualSeconds: number }, {
        dt: DT_SEC,
        sampleHz: SAMPLE_HZ,
        measureBeats: MEASURE_BEATS,
        requireProjectorQuiet: false,
      })
      : null;
    const samples = measurement?.samples
      ?? core.runFor(MEASURE_BEATS * 60 / point.HR, DT_SEC, SAMPLE_HZ, { recordHistory: false });
    const health = measurement?.health ?? core.health({ periodBeats: settleStatus.periodBeats });
    const metrics = measurement?.metrics ?? core.metrics({ windowBeats: settleStatus.periodBeats });
    return {
      candidateId: candidate.id,
      pointId: point.id,
      HR: point.HR,
      targetTBVMl: point.targetTBVMl,
      status: settled ? "measured" : "settle-failed",
      settle: compactSettle(settleStatus),
      health: {
        status: health.status,
        periodBeats: health.periodBeats,
        messages: health.messages,
      },
      metrics: compactMetrics(metrics),
      forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
      forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
      providerIds: core.debugExperimentalActiveSourceProviderIds(),
      instrumentation: {
        LA: laInstrumentation ? compactInstrumentation(laInstrumentation) : null,
        RA: raInstrumentation ? compactInstrumentation(raInstrumentation) : null,
      },
      LA: scoreChamber(samples, "LA"),
      RA: scoreChamber(samples, "RA"),
      errorMessage: null,
    };
  } catch (error) {
    return {
      candidateId: candidate.id,
      pointId: point.id,
      HR: point.HR,
      targetTBVMl: point.targetTBVMl,
      status: "runtime-error",
      settle: null,
      health: null,
      metrics: null,
      forwardCO_L: null,
      forwardCO_R: null,
      providerIds: {},
      instrumentation: { LA: null, RA: null },
      LA: null,
      RA: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function createCandidateProviders(
  _candidate: CandidateSpec,
  laInstrumentation: ModelCoreLand2017LvSourceProviderInstrumentation | null,
  raInstrumentation: ModelCoreLand2017LvSourceProviderInstrumentation | null,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (!laInstrumentation || !raInstrumentation) {
    throw new Error("LandAtrial candidate requires LA/RA instrumentation.");
  }
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  return {
    LA: createAtrialLandShadowSourceProvider("LA", laInstrumentation, {
      commitScheme: "BE",
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      signedPressureAdapter: true,
    }),
    RA: createAtrialLandShadowSourceProvider("RA", raInstrumentation, {
      commitScheme: "BE",
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      signedPressureAdapter: true,
    }),
  };
}

function summarizeCandidate(candidate: CandidateSpec, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidate.id);
  return {
    candidateId: candidate.id,
    rationale: candidate.rationale,
    measuredPointIds: candidateRuns.filter((run) => run.status === "measured").map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health?.status === "ok").map((run) => run.pointId),
    settleFailedPointIds: candidateRuns.filter((run) => run.status === "settle-failed").map((run) => run.pointId),
    runtimeErrorPointIds: candidateRuns.filter((run) => run.status === "runtime-error").map((run) => run.pointId),
    outputPreservedPointIds: candidateRuns.filter(outputPreserved).map((run) => run.pointId),
    bothAtriaVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.LA?.volumeFunction.allBroadPass && run.RA?.volumeFunction.allBroadPass)
      .map((run) => run.pointId),
    bothAtriaDirectWallStrainPassPointIds: candidateRuns
      .filter((run) => run.LA?.directWallStrain.allRangePass && run.RA?.directWallStrain.allRangePass)
      .map((run) => run.pointId),
    laRawReadablePointIds: candidateRuns
      .filter((run) => run.LA?.rawFigureEightReadability.rawReadableByExistingThreshold)
      .map((run) => run.pointId),
    raRawReadablePointIds: candidateRuns
      .filter((run) => run.RA?.rawFigureEightReadability.rawReadableByExistingThreshold)
      .map((run) => run.pointId),
    bothAtriaRawReadablePointIds: candidateRuns
      .filter((run) =>
        run.LA?.rawFigureEightReadability.rawReadableByExistingThreshold
        && run.RA?.rawFigureEightReadability.rawReadableByExistingThreshold)
      .map((run) => run.pointId),
    laPressureRelationSignalPointIds: candidateRuns
      .filter((run) => run.LA?.pressureWaveTiming.relationSignal === "la-v-ge-a")
      .map((run) => run.pointId),
    raPressureRelationSignalPointIds: candidateRuns
      .filter((run) => run.RA?.pressureWaveTiming.relationSignal === "ra-a-ge-v")
      .map((run) => run.pointId),
    meanLaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA?.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanRaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA?.volumeFunction.broadRangeDistance ?? Number.NaN))),
    meanLaDirectWallStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA?.directWallStrain.sourceRangeDistance ?? Number.NaN))),
    meanRaDirectWallStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA?.directWallStrain.sourceRangeDistance ?? Number.NaN))),
    meanCombinedTargetDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA?.volumeFunction.broadRangeDistance != null
        && run.RA?.volumeFunction.broadRangeDistance != null
        && run.LA?.directWallStrain.sourceRangeDistance != null
        && run.RA?.directWallStrain.sourceRangeDistance != null
        ? run.LA.volumeFunction.broadRangeDistance
          + run.RA.volumeFunction.broadRangeDistance
          + run.LA.directWallStrain.sourceRangeDistance
          + run.RA.directWallStrain.sourceRangeDistance
        : Number.NaN))),
    totalLandSolveFailureCount: candidateRuns.reduce((sum, run) =>
      sum
      + (run.instrumentation.LA?.landSolveFailureCount ?? 0)
      + (run.instrumentation.RA?.landSolveFailureCount ?? 0), 0),
    selectableByThisArtifact: false,
  };
}

function classifyDiagnosticStatus(
  summaries: readonly CandidateSummary[],
): Evidence["summary"]["diagnosticStatus"] {
  if (summaries.some((summary) => summary.runtimeErrorPointIds.length > 0)) {
    return "landatrial-geometry-scout-runtime-error";
  }
  const current = summaries.find((summary) => summary.candidateId === "promoted-landatrial-shadow-current-geometry");
  if (!current || current.healthOkPointIds.length < POINTS.length || current.outputPreservedPointIds.length < POINTS.length) {
    return "landatrial-geometry-scout-health-or-output-blocked";
  }
  return "landatrial-geometry-scout-candidate-recorded";
}

function combinedDistance(summary: CandidateSummary): number {
  return summary.meanCombinedTargetDistance ?? Number.POSITIVE_INFINITY;
}

function computeScoutRecommendation(
  summaries: readonly CandidateSummary[],
): Evidence["scoutRecommendation"] {
  const current = summaries.find((summary) => summary.candidateId === "promoted-landatrial-shadow-current-geometry");
  const eligible = summaries
    .filter((summary) =>
      summary.healthOkPointIds.length === POINTS.length
      && summary.outputPreservedPointIds.length === POINTS.length
      && summary.runtimeErrorPointIds.length === 0
      && summary.settleFailedPointIds.length === 0
      && summary.meanCombinedTargetDistance != null)
    .slice()
    .sort((left, right) => combinedDistance(left) - combinedDistance(right));
  const recommended = eligible[0] ?? null;
  const candidateSpec = recommended ? CANDIDATES.find((candidate) => candidate.id === recommended.candidateId) : null;
  const distanceDelta = recommended?.meanCombinedTargetDistance != null && current?.meanCombinedTargetDistance != null
    ? round(recommended.meanCombinedTargetDistance - current.meanCombinedTargetDistance)
    : null;
  const volumeDelta = (recommended?.bothAtriaVolumeFunctionPassPointIds.length ?? 0)
    - (current?.bothAtriaVolumeFunctionPassPointIds.length ?? 0);
  const readableDelta = (recommended?.bothAtriaRawReadablePointIds.length ?? 0)
    - (current?.bothAtriaRawReadablePointIds.length ?? 0);
  const interpretation = distanceDelta == null
    ? "No finite geometry scout recommendation is available."
    : distanceDelta < 0
      ? `Recommended geometry candidate lowers combined target distance by ${Math.abs(distanceDelta)} versus current LandAtrial shadow geometry.`
      : distanceDelta > 0
        ? "Current LandAtrial shadow geometry remains the lowest combined-distance candidate in this scout."
        : "Recommended geometry candidate ties current LandAtrial shadow geometry by combined target distance.";
  return {
    recommendedCandidateId: recommended?.candidateId ?? null,
    recommendedActiveOverrides: candidateSpec?.activeOverrides ?? null,
    deltaMeanCombinedTargetDistanceRecommendedMinusCurrent: distanceDelta,
    deltaBothAtriaVolumePassCountRecommendedMinusCurrent: volumeDelta,
    deltaBothAtriaRawReadableCountRecommendedMinusCurrent: readableDelta,
    interpretation,
  };
}

function interpretation(
  summaries: readonly CandidateSummary[],
  best: CandidateSummary | null,
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
  scoutRecommendation: Evidence["scoutRecommendation"],
): string {
  const current = summaries.find((summary) => summary.candidateId === "promoted-landatrial-shadow-current-geometry");
  return [
    "Phase 5BJ freezes A1/A2 and scouts LandAtrial AV-plane/effective wall geometry candidates against sourced atrial volume-function targets plus direct wall-lambda strain targets.",
    `Current LandAtrial geometry health-ok=${current?.healthOkPointIds.length ?? 0}/${POINTS.length}, output-preserved=${current?.outputPreservedPointIds.length ?? 0}/${POINTS.length}, Land solve failures=${current?.totalLandSolveFailureCount ?? "missing"}.`,
    `Best combined-distance candidate by this diagnostic artifact: ${best?.candidateId ?? "none"}.`,
    `Scout recommendation: ${scoutRecommendation.interpretation}`,
    `Diagnostic status: ${diagnosticStatus}.`,
  ].join(" ");
}

function recommendedNext(
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
  scoutRecommendation: Evidence["scoutRecommendation"],
): readonly string[] {
  if (diagnosticStatus !== "landatrial-geometry-scout-candidate-recorded") {
    return [
      "repair LandAtrial shadow health/output before target-distance calibration",
      "keep LV+RV Land plus sourced root/Zc fixed while debugging atrial shadow mechanics",
      "do not re-open A1/A2 gain sweeps, qDot/root/Zc tuning, valve threshold tuning, Tref tuning, or source-stress scaling",
    ];
  }
  return [
    scoutRecommendation.recommendedCandidateId
      ? `use ${scoutRecommendation.recommendedCandidateId} as the next LandAtrial shadow geometry/AV-plane candidate input, then rerun target scoring before promotion`
      : "widen the AV-plane/effective geometry search only if no finite candidate is recommended",
    "treat AV-plane and wall-lambda readbacks as live LandAtrial calibration signals rather than tuning A1/A2 bridge gains",
    "keep all-chamber runtime default, official morphology, AF validation, valve/load timing acceptance, and qDot clamp retirement out of this lane until smaller standing gates exist",
  ];
}

function nodeOverrides(
  activeOverrides: Partial<Record<AtrialChamber, Record<string, number>>>,
): NonNullable<Partial<CoreRuntimeParams>["nodeOverrides"]> {
  const overrides: NonNullable<Partial<CoreRuntimeParams>["nodeOverrides"]> = {};
  if (activeOverrides.LA) overrides.LA = { active: activeOverrides.LA };
  if (activeOverrides.RA) overrides.RA = { active: activeOverrides.RA };
  return overrides;
}

function scoreChamber(samples: readonly SimSample[], chamber: AtrialChamber): ChamberScoring {
  return {
    volumeFunction: atrialVolumeFunction(samples, chamber),
    directWallStrain: directWallStrain(samples, chamber),
    pressureWaveTiming: pressureWaveTiming(samples, chamber),
    rawFigureEightReadability: rawFigureEightReadability(samples, chamber),
    pressure: {
      passiveMmHg: range(samples.map((sample) => optionalNumber(sample, pressureKey(chamber, "passive")))),
      activeMmHg: range(samples.map((sample) => optionalNumber(sample, pressureKey(chamber, "active")))),
      avPlaneDeltaMmHg: range(samples.map((sample) => optionalNumber(sample, pressureKey(chamber, "avPlane")))),
      floorHit01: range(samples.map((sample) => optionalNumber(sample, pressureKey(chamber, "floorHit")))),
    },
  };
}

function atrialVolumeFunction(samples: readonly SimSample[], chamber: AtrialChamber): AtrialVolumeFunction {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialVolumeFunctionForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialVolumeFunction,
      "maxVolumeMl" | "preAtrialContractionVolumeMl" | "minVolumeMl"
      | "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
    >> => metric != null);
  const averaged = {
    maxVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.maxVolumeMl))),
    preAtrialContractionVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.preAtrialContractionVolumeMl))),
    minVolumeMl: finiteOrNull(mean(beatMetrics.map((metric) => metric.minVolumeMl))),
    totalEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.totalEmptyingFraction))),
    passiveEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.passiveEmptyingFraction))),
    activeEmptyingFraction: finiteOrNull(mean(beatMetrics.map((metric) => metric.activeEmptyingFraction))),
  };
  const ranges = volumeRanges(chamber);
  const distance = rangeDistance(averaged.totalEmptyingFraction, ranges.total)
    + rangeDistance(averaged.passiveEmptyingFraction, ranges.passive)
    + rangeDistance(averaged.activeEmptyingFraction, ranges.active);
  return {
    beatCount: beatMetrics.length,
    ...averaged,
    allBroadPass:
      inRange(averaged.totalEmptyingFraction, ranges.total)
      && inRange(averaged.passiveEmptyingFraction, ranges.passive)
      && inRange(averaged.activeEmptyingFraction, ranges.active),
    broadRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialVolumeFunctionForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialVolumeFunction,
  "maxVolumeMl" | "preAtrialContractionVolumeMl" | "minVolumeMl"
  | "totalEmptyingFraction" | "passiveEmptyingFraction" | "activeEmptyingFraction"
>> | null {
  if (samples.length < 16) return null;
  const volume = (sample: SimSample): number => chamber === "LA" ? sample.VLA : sample.VRA;
  const volumes = samples.map(volume).filter(Number.isFinite);
  if (volumes.length === 0) return null;
  const maxVolumeMl = Math.max(...volumes);
  const minVolumeMl = Math.min(...volumes);
  const preAtrialContractionVolumeMl = volume(nearestThetaSample(samples, 0.76));
  return {
    maxVolumeMl,
    preAtrialContractionVolumeMl,
    minVolumeMl,
    totalEmptyingFraction: (maxVolumeMl - minVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    passiveEmptyingFraction: (maxVolumeMl - preAtrialContractionVolumeMl) / Math.max(maxVolumeMl, 1e-9),
    activeEmptyingFraction: (preAtrialContractionVolumeMl - minVolumeMl)
      / Math.max(preAtrialContractionVolumeMl, 1e-9),
  };
}

function directWallStrain(samples: readonly SimSample[], chamber: AtrialChamber): DirectWallStrain {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => directWallStrainForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<DirectWallStrain,
      "lambdaMin" | "lambdaMax" | "lambdaPreAtrialContraction"
      | "reservoirStrain" | "conduitStrain" | "contractileStrain"
    >> => metric != null);
  const averaged = {
    lambdaMin: finiteOrNull(mean(beatMetrics.map((metric) => metric.lambdaMin))),
    lambdaMax: finiteOrNull(mean(beatMetrics.map((metric) => metric.lambdaMax))),
    lambdaPreAtrialContraction: finiteOrNull(mean(beatMetrics.map((metric) =>
      metric.lambdaPreAtrialContraction))),
    reservoirStrain: finiteOrNull(mean(beatMetrics.map((metric) => metric.reservoirStrain))),
    conduitStrain: finiteOrNull(mean(beatMetrics.map((metric) => metric.conduitStrain))),
    contractileStrain: finiteOrNull(mean(beatMetrics.map((metric) => metric.contractileStrain))),
  };
  const ranges = strainRanges(chamber);
  const reservoirRangePass = inRange(averaged.reservoirStrain, ranges.reservoir);
  const conduitRangePass = inRange(averaged.conduitStrain, ranges.conduit);
  const contractileRangePass = inRange(averaged.contractileStrain, ranges.contractile);
  const distance = rangeDistance(averaged.reservoirStrain, ranges.reservoir)
    + rangeDistance(averaged.conduitStrain, ranges.conduit)
    + rangeDistance(averaged.contractileStrain, ranges.contractile);
  const lambdaKey = chamber === "LA" ? "LAWallLambdaWithoutAvPlane" : "RAWallLambdaWithoutAvPlane";
  const effectiveCorrectionKey = chamber === "LA"
    ? "LAAvPlaneEffectiveVolumeCorrectionMl"
    : "RAAvPlaneEffectiveVolumeCorrectionMl";
  const descentKey = chamber === "LA" ? "LAAvPlaneDescent01" : "RAAvPlaneDescent01";
  return {
    source: "direct-wall-lambda-readback-v1",
    beatCount: beatMetrics.length,
    ...averaged,
    reservoirRangePass,
    conduitRangePass,
    contractileRangePass,
    allRangePass: reservoirRangePass && conduitRangePass && contractileRangePass,
    sourceRangeDistance: Number.isFinite(distance) ? round(distance) : null,
    avPlaneSensitivity: {
      lambdaWithoutAvPlaneMin: finiteOrNull(min(samples.map((sample) => optionalNumber(sample, lambdaKey)))),
      lambdaWithoutAvPlaneMax: finiteOrNull(max(samples.map((sample) => optionalNumber(sample, lambdaKey)))),
      maxLambdaDeltaWithoutMinusWithAvPlane: finiteOrNull(max(samples.map((sample) => {
        const without = optionalNumber(sample, lambdaKey);
        const withAv = wallLambda(sample, chamber);
        return Number.isFinite(without) && Number.isFinite(withAv) ? without - withAv : Number.NaN;
      }))),
      effectiveVolumeCorrectionMl: range(samples.map((sample) => optionalNumber(sample, effectiveCorrectionKey))),
      avPlaneDescent01: range(samples.map((sample) => optionalNumber(sample, descentKey))),
    },
  };
}

function directWallStrainForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<DirectWallStrain,
  "lambdaMin" | "lambdaMax" | "lambdaPreAtrialContraction"
  | "reservoirStrain" | "conduitStrain" | "contractileStrain"
>> | null {
  if (samples.length < 16) return null;
  const lambdas = samples.map((sample) => wallLambda(sample, chamber)).filter(Number.isFinite);
  if (lambdas.length === 0) return null;
  const lambdaMin = Math.min(...lambdas);
  const lambdaMax = Math.max(...lambdas);
  const lambdaPreAtrialContraction = wallLambda(nearestThetaSample(samples, 0.76), chamber);
  if (!Number.isFinite(lambdaPreAtrialContraction)) return null;
  return {
    lambdaMin,
    lambdaMax,
    lambdaPreAtrialContraction,
    reservoirStrain: (lambdaMax - lambdaMin) / Math.max(lambdaMin, 1e-9),
    conduitStrain: (lambdaMax - lambdaPreAtrialContraction) / Math.max(lambdaMin, 1e-9),
    contractileStrain: (lambdaPreAtrialContraction - lambdaMin) / Math.max(lambdaMin, 1e-9),
  };
}

function pressureWaveTiming(samples: readonly SimSample[], chamber: AtrialChamber): PressureWaveTiming {
  const pressure = (sample: SimSample): number => chamber === "LA" ? sample.LAP : sample.RAP;
  const aWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.76, 1], [0, 0.14]]));
  const vWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.18, 0.72]]));
  const xWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.1, 0.45]]));
  const yWindow = samples.filter((sample) => thetaIn(sample.phi, [[0.48, 0.76]]));
  const aWaveMax = maxNullable(aWindow.map(pressure));
  const vWaveMax = maxNullable(vWindow.map(pressure));
  let relationSignal: PressureWaveTiming["relationSignal"] = "missing";
  if (aWaveMax != null && vWaveMax != null) {
    if (chamber === "LA") {
      relationSignal = vWaveMax >= 0.85 * aWaveMax ? "la-v-ge-a" : "not-supported";
    } else {
      relationSignal = aWaveMax >= 0.85 * vWaveMax ? "ra-a-ge-v" : "not-supported";
    }
  }
  return {
    aWaveMaxMmHg: finiteOrNull(aWaveMax),
    vWaveMaxMmHg: finiteOrNull(vWaveMax),
    xDescentMinMmHg: finiteOrNull(minNullable(xWindow.map(pressure))),
    yDescentMinMmHg: finiteOrNull(minNullable(yWindow.map(pressure))),
    relationSignal,
  };
}

function rawFigureEightReadability(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): RawFigureEightReadability {
  const beat = lastCompleteBeat(samples);
  if (beat.length < 16) {
    return {
      selfIntersections: 0,
      signedAreaMmHgMl: null,
      absAreaMmHgMl: null,
      midVolumePressureSpreadMmHg: null,
      boosterLoopSignedAreaMmHgMl: null,
      reservoirLoopSignedAreaMmHgMl: null,
      opposingLobes: false,
      rawReadableByExistingThreshold: false,
    };
  }
  const shape = atrialLoopShape(beat, chamber);
  const boosterSigned = phaseLoopArea(beat, chamber, [[0.75, 1], [0, 0.15]]);
  const reservoirSigned = phaseLoopArea(beat, chamber, [[0.20, 0.75]]);
  const areaThreshold = chamber === "LA" ? 20 : 30;
  const spreadThreshold = chamber === "LA" ? 1.5 : 2;
  return {
    selfIntersections: shape.selfIntersections,
    signedAreaMmHgMl: round(shape.signedArea),
    absAreaMmHgMl: round(shape.absArea),
    midVolumePressureSpreadMmHg: round(shape.midVolumePressureSpread),
    boosterLoopSignedAreaMmHgMl: finiteOrNull(boosterSigned),
    reservoirLoopSignedAreaMmHgMl: finiteOrNull(reservoirSigned),
    opposingLobes: Number.isFinite(boosterSigned)
      && Number.isFinite(reservoirSigned)
      && boosterSigned * reservoirSigned < 0,
    rawReadableByExistingThreshold:
      shape.selfIntersections >= 1
      && shape.absArea > areaThreshold
      && shape.midVolumePressureSpread > spreadThreshold,
  };
}

function phaseLoopArea(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
  windows: readonly (readonly [number, number])[],
): number {
  const selected = samples
    .filter((sample) => windows.some(([lo, hi]) => phaseInWindow(phaseOf(sample), lo, hi)))
    .map((sample) => ({
      x: chamber === "LA" ? sample.VLA : sample.VRA,
      y: chamber === "LA" ? sample.LAP : sample.RAP,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (selected.length < 3) return Number.NaN;
  let area = 0;
  for (let i = 0; i < selected.length - 1; i++) {
    const current = selected[i];
    const next = selected[i + 1];
    area += current.x * next.y - next.x * current.y;
  }
  return 0.5 * area;
}

function beatGroups(samples: readonly SimSample[]): readonly SimSample[][] {
  const groups = new Map<number, SimSample[]>();
  for (const sample of samples) {
    const beat = Math.floor(sample.phi);
    const group = groups.get(beat) ?? [];
    group.push(sample);
    groups.set(beat, group);
  }
  return Array.from(groups.values()).filter((group) => group.length >= 16).slice(-MEASURE_BEATS);
}

function lastCompleteBeat(samples: readonly SimSample[]): SimSample[] {
  const groups = beatGroups(samples);
  return groups.at(-1) ?? [];
}

function nearestThetaSample(samples: readonly SimSample[], targetTheta: number): SimSample {
  return samples
    .slice()
    .sort((left, right) => thetaDistance(left.phi, targetTheta) - thetaDistance(right.phi, targetTheta))[0]
    ?? samples[0];
}

function thetaDistance(phi: number, targetTheta: number): number {
  const theta = frac(phi);
  const distance = Math.abs(theta - targetTheta);
  return Math.min(distance, 1 - distance);
}

function thetaIn(phi: number, windows: readonly (readonly [number, number])[]): boolean {
  const theta = frac(phi);
  return windows.some(([lo, hi]) => theta >= lo && theta < hi);
}

function volumeRanges(chamber: AtrialChamber): Record<"total" | "passive" | "active", Range> {
  if (chamber === "LA") {
    return {
      total: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.totalEmptyingFraction.broadRange),
      passive: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.passiveEmptyingFraction.broadRange),
      active: asRange(targetPack.volumeDerivedFunctionTargets.leftAtrium.activeEmptyingFraction.broadRange),
    };
  }
  return {
    total: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.totalEmptyingFraction.broadRange),
    passive: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.passiveEmptyingFraction.broadRange),
    active: asRange(targetPack.volumeDerivedFunctionTargets.rightAtrium.activeEmptyingFraction.broadRange),
  };
}

function strainRanges(chamber: AtrialChamber): Record<"reservoir" | "conduit" | "contractile", Range> {
  if (chamber === "LA") {
    return {
      reservoir: asRange(targetPack.strainTargets.leftAtrium.reservoirStrain.normalRange95Ci),
      conduit: asRange(targetPack.strainTargets.leftAtrium.conduitStrain.normalRange95Ci),
      contractile: asRange(targetPack.strainTargets.leftAtrium.contractileStrain.normalRange95Ci),
    };
  }
  return {
    reservoir: asRange(targetPack.strainTargets.rightAtrium.reservoirStrain.normalRange95Ci),
    conduit: asRange(targetPack.strainTargets.rightAtrium.conduitStrain.normalRange95Ci),
    contractile: asRange(targetPack.strainTargets.rightAtrium.contractileStrain.normalRange95Ci),
  };
}

function pressureKey(
  chamber: AtrialChamber,
  component: "passive" | "active" | "avPlane" | "floorHit",
): keyof SimSample {
  if (chamber === "LA") {
    return {
      passive: "LAPassivePressureMmHg",
      active: "LAActivePressureMmHg",
      avPlane: "LAAvPlanePressureDeltaMmHg",
      floorHit: "LAPressureFloorHit01",
    }[component] as keyof SimSample;
  }
  return {
    passive: "RAPassivePressureMmHg",
    active: "RAActivePressureMmHg",
    avPlane: "RAAvPlanePressureDeltaMmHg",
    floorHit: "RAPressureFloorHit01",
  }[component] as keyof SimSample;
}

function wallLambda(sample: SimSample, chamber: AtrialChamber): number {
  return chamber === "LA" ? sample.LAWallLambda ?? Number.NaN : sample.RAWallLambda ?? Number.NaN;
}

function optionalNumber(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

function compactSettle(status: SettleStatus): SettleCompact {
  return {
    settled: status.settled,
    reason: status.reason,
    beats: status.beats,
    actualSeconds: finiteOrNull(status.actualSeconds),
    worstSignal: status.worstSignal,
    worstDelta: finiteOrNull(status.worstDelta),
    adjacentDelta: finiteOrNull(status.adjacentDelta),
    periodBeats: status.periodBeats,
    periodDelta: finiteOrNull(status.periodDelta),
    worstDeltaToPrimaryTolerance: finiteOrNull(status.worstDelta / SETTLE_POLICY.tolPrimary),
  };
}

function compactMetrics(metrics: SimMetrics): Run["metrics"] {
  return {
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    SV_L: round(metrics.SV_L),
    SV_R: round(metrics.SV_R),
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    RAPMean: round(metrics.RAPMean),
    LAPMean: round(metrics.LAPMean),
    TBV: round(metrics.TBV),
  };
}

function compactInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): InstrumentationCompact {
  return {
    sourceActiveStressPaCalls: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCalls: instrumentation.commitProviderStateAfterStep,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
    sourceActiveFiberStressPa: compactRange(instrumentation.sourcePathAudit.sourceActiveFiberStressPa),
    fiberEngineeringStrain: compactRange(instrumentation.sourcePathAudit.fiberEngineeringStrain),
    freeCalciumUM: compactRange(instrumentation.sourcePathAudit.freeCalciumUM),
  };
}

function compactRange(rangeAudit: ModelCoreLand2017LvRangeAudit): RangeCompact {
  return {
    min: finiteOrNull(rangeAudit.min),
    max: finiteOrNull(rangeAudit.max),
  };
}

function range(values: readonly number[]): RangeCompact {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return {
    min: round(Math.min(...finite)),
    max: round(Math.max(...finite)),
  };
}

function outputPreserved(run: Run): boolean {
  const metrics = run.metrics;
  if (!metrics) return false;
  return metrics.CO_L >= 3.5
    && metrics.CO_L <= 7.5
    && metrics.CO_R >= 3.5
    && metrics.CO_R <= 7.5
    && Math.abs(metrics.CO_L - metrics.CO_R) <= 0.35
    && metrics.AoPMean >= 60
    && metrics.AoPMean <= 120
    && metrics.PAPMean >= 8
    && metrics.PAPMean <= 45
    && metrics.TBV >= 4700
    && metrics.TBV <= 6300;
}

function asRange(value: readonly number[]): Range {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error("Atrial waveform target range must contain two finite numbers.");
  }
  return [value[0], value[1]];
}

function inRange(value: number | null, rangeValue: Range): boolean {
  return value != null && value >= rangeValue[0] && value <= rangeValue[1];
}

function rangeDistance(value: number | null, rangeValue: Range): number {
  if (value == null) return Number.POSITIVE_INFINITY;
  if (value < rangeValue[0]) return rangeValue[0] - value;
  if (value > rangeValue[1]) return value - rangeValue[1];
  return 0;
}

function maxNullable(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.max(...finite);
}

function minNullable(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? null : Math.min(...finite);
}

function max(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : Math.max(...finite);
}

function min(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : Math.min(...finite);
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
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
  const evidence = buildLandAtrialGeometryScoutPhase5BJEvidence();
  const outPath = path.resolve(process.cwd(), LANDATRIAL_GEOMETRY_SCOUT_PHASE5BJ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isDirectRun = process.argv[1] != null
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const evidence = writeEvidence();
  const current = evidence.candidateSummaries
    .find((summary) => summary.candidateId === "promoted-landatrial-shadow-current-geometry");
  const recommended = evidence.scoutRecommendation.recommendedCandidateId
    ? evidence.candidateSummaries.find((summary) =>
      summary.candidateId === evidence.scoutRecommendation.recommendedCandidateId)
    : null;
  console.log(JSON.stringify({
    id: evidence.id,
    hash: evidence.normalizedSha256,
    diagnosticStatus: evidence.summary.diagnosticStatus,
    bestCandidateByCombinedTargetDistanceId: evidence.summary.bestCandidateByCombinedTargetDistanceId,
    currentGeometryHealthOkPointIds: current?.healthOkPointIds ?? [],
    currentGeometryMeanCombinedTargetDistance: current?.meanCombinedTargetDistance ?? null,
    recommendedCandidateId: evidence.scoutRecommendation.recommendedCandidateId,
    recommendedMeanCombinedTargetDistance: recommended?.meanCombinedTargetDistance ?? null,
    scoutRecommendation: evidence.scoutRecommendation,
  }, null, 2));
}
