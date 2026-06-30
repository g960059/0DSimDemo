import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import targetPack from "@/data/myocardium/targets/atrial-waveform-targets-v1.json";
import { ModelCore, defaultParams, type ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import { measureSteady } from "@/engine/measure";
import {
  LANDATRIAL_SHADOW_PARAMETER_PACK,
  createAtrialLandShadowSourceProvider,
} from "@/engine/myocardium/atrialLandShadow";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvRangeAudit,
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy } from "@/engine/settling";

export const ATRIAL_LAND_SHADOW_PHASE5BF_ID =
  "atrial-land-shadow-phase5bf-result-v1";
export const ATRIAL_LAND_SHADOW_PHASE5BF_RESULT_PATH =
  "data/myocardium/protocols/atrial-land-shadow-phase5bf-result-v1.json";

type AtrialChamber = "LA" | "RA";
type PointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "normal-hr90"
  | "low-preload-hr90"
  | "high-preload-hr90";
type CandidateId =
  | "runtime-default-atrial-active-reference"
  | "current-all-chamber-land-nonnegative-control"
  | "landatrial-shadow-la-only-signed"
  | "landatrial-shadow-ra-only-signed"
  | "landatrial-shadow-la-ra-signed";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
};

type CandidateSpec = {
  readonly id: CandidateId;
  readonly atrialLandShadowChambers: readonly AtrialChamber[];
  readonly currentAllChamberLandControl: boolean;
};

type Range = readonly [number, number];
type RangeCompact = { readonly min: number | null; readonly max: number | null };

type SignalAuditCompact = {
  readonly sampleCount: number;
  readonly freeCalciumUM: RangeCompact;
  readonly fiberEngineeringStrain: RangeCompact;
  readonly fiberEngineeringStrainRatePerSec: RangeCompact;
  readonly sourceActiveFiberStressPa: RangeCompact;
  readonly boundFraction: RangeCompact;
  readonly finiteHealthAllSamples: boolean;
};

type InstrumentationCompact = {
  readonly providerActive: boolean;
  readonly sourceActiveStressPaCalls: number;
  readonly commitProviderStateAfterStepCalls: number;
  readonly landSolveOkCount: number;
  readonly landSolveFailureCount: number;
  readonly maxSolverResidualNorm: number;
  readonly lastFailureReason: string | null;
  readonly sourcePathAudit: SignalAuditCompact;
  readonly commitPathAudit: SignalAuditCompact;
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

type AtrialDirectWallStrain = {
  readonly metricId: "direct-avplane-wall-lambda-strain-v1";
  readonly beatCount: number;
  readonly reservoirStrain: number | null;
  readonly conduitStrain: number | null;
  readonly contractileStrain: number | null;
  readonly reservoirRangePass: boolean;
  readonly conduitRangePass: boolean;
  readonly contractileRangePass: boolean;
  readonly allRangePass: boolean;
  readonly sourceRangeDistance: number | null;
  readonly finiteSampleFraction: number;
  readonly meanAvPlaneDescent01: number | null;
  readonly maxAvPlaneDescent01: number | null;
  readonly meanEffectiveVolumeCorrectionMl: number | null;
  readonly maxEffectiveVolumeCorrectionMl: number | null;
  readonly meanLambdaDeltaFromAvPlane: number | null;
  readonly maxLambdaDeltaFromAvPlane: number | null;
};

type Run = {
  readonly candidateId: CandidateId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly status: "measured" | "settle-failed" | "runtime-error";
  readonly settled: boolean;
  readonly settleReason: string | null;
  readonly settleBeats: number | null;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages"> | null;
  readonly providerIds: Partial<Record<Chamber, string>>;
  readonly atrialProviderInstrumentation: Partial<Record<AtrialChamber, InstrumentationCompact>>;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
  readonly LA: {
    readonly volumeFunction: AtrialVolumeFunction | null;
    readonly directWallStrain: AtrialDirectWallStrain | null;
  };
  readonly RA: {
    readonly volumeFunction: AtrialVolumeFunction | null;
    readonly directWallStrain: AtrialDirectWallStrain | null;
  };
  readonly errorMessage: string | null;
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly measuredPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly runtimeErrorPointIds: readonly PointId[];
  readonly settleFailedPointIds: readonly PointId[];
  readonly bothAtriaVolumeFunctionPassPointIds: readonly PointId[];
  readonly bothAtriaDirectWallStrainPassPointIds: readonly PointId[];
  readonly meanLaVolumeDistance: number | null;
  readonly meanRaVolumeDistance: number | null;
  readonly meanLaDirectWallStrainDistance: number | null;
  readonly meanRaDirectWallStrainDistance: number | null;
  readonly totalAtrialLandSolveFailureCount: number;
  readonly selectableByThisArtifact: false;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_LAND_SHADOW_PHASE5BF_ID;
  readonly phase: "Phase 5BF";
  readonly claimBoundary: "landatrial-shadow-parameter-pack-direct-avplane-wall-strain-no-default";
  readonly targetPackId: typeof targetPack.id;
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-strain-proxy-scoring-phase5be-result-v1.json",
    "data/myocardium/protocols/atrial-land-ra-source-stress-convention-phase5av-result-v1.json",
  ];
  readonly protocol: {
    readonly baseRuntimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly currentAllChamberControlMode: typeof MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly landAtrialParameterPackId: typeof LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId;
    readonly directReadbacks: readonly [
      "AV-plane descent",
      "effective wall volume correction",
      "wall lambda",
      "wall engineering strain",
    ];
    readonly noRuntimeDefaultFlip: true;
    readonly noAtrialBridgeSelection: true;
    readonly noTrefOrSourceStressScaling: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly landAtrialParameterPackDigest: {
    readonly sourceCore: typeof LANDATRIAL_SHADOW_PARAMETER_PACK.sourceCore;
    readonly sourceTrefUnchanged: true;
    readonly laParameterSetStableHash: string;
    readonly raParameterSetStableHash: string;
    readonly calibrationNotes: readonly string[];
  };
  readonly targetPackDigest: {
    readonly sourceCount: number;
    readonly leftAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
    readonly rightAtriumStrainSourceRanges: Record<"reservoir" | "conduit" | "contractile", Range>;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly summary: {
    readonly bestCandidateByCombinedTargetDistanceId: CandidateId | null;
    readonly landAtrialShadowAllChamberMeasuredPointIds: readonly PointId[];
    readonly landAtrialShadowAllChamberHealthOkPointIds: readonly PointId[];
    readonly landAtrialShadowAllChamberSettleFailedPointIds: readonly PointId[];
    readonly landAtrialShadowAllChamberRuntimeErrorPointIds: readonly PointId[];
    readonly diagnosticStatus:
      | "landatrial-shadow-supported-for-next-calibration"
      | "landatrial-shadow-partial-settle-blocked"
      | "landatrial-shadow-not-supported";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noAtrialBridgeSelection: true;
    readonly noAtrialLandPhysiologyAcceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noAfValidationClaim: true;
    readonly noTrefTuning: true;
    readonly noSourceStressScaling: true;
    readonly noQDotClampRemoval: true;
    readonly noValveLoadTimingAcceptance: true;
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
    id: "runtime-default-atrial-active-reference",
    atrialLandShadowChambers: [],
    currentAllChamberLandControl: false,
  },
  {
    id: "current-all-chamber-land-nonnegative-control",
    atrialLandShadowChambers: [],
    currentAllChamberLandControl: true,
  },
  {
    id: "landatrial-shadow-la-only-signed",
    atrialLandShadowChambers: ["LA"],
    currentAllChamberLandControl: false,
  },
  {
    id: "landatrial-shadow-ra-only-signed",
    atrialLandShadowChambers: ["RA"],
    currentAllChamberLandControl: false,
  },
  {
    id: "landatrial-shadow-la-ra-signed",
    atrialLandShadowChambers: ["LA", "RA"],
    currentAllChamberLandControl: false,
  },
] as const;

export function buildAtrialLandShadowPhase5BFEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidate) => POINTS.map((point) => runPoint(candidate, point)));
  const candidateSummaries = CANDIDATES.map((candidate) => summarizeCandidate(candidate.id, runs));
  const best = candidateSummaries
    .slice()
    .sort((left, right) => combinedDistance(left) - combinedDistance(right))[0] ?? null;
  const landAtrialSummary = candidateSummaries.find((summary) =>
    summary.candidateId === "landatrial-shadow-la-ra-signed");
  const diagnosticStatus = landAtrialSummary
    && landAtrialSummary.runtimeErrorPointIds.length === 0
    && landAtrialSummary.measuredPointIds.length === POINTS.length
    && landAtrialSummary.healthOkPointIds.length === POINTS.length
      ? "landatrial-shadow-supported-for-next-calibration" as const
      : (
        landAtrialSummary
        && landAtrialSummary.runtimeErrorPointIds.length === 0
        && landAtrialSummary.measuredPointIds.length > 0
          ? "landatrial-shadow-partial-settle-blocked" as const
          : "landatrial-shadow-not-supported" as const
      );
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_LAND_SHADOW_PHASE5BF_ID,
    phase: "Phase 5BF",
    claimBoundary: "landatrial-shadow-parameter-pack-direct-avplane-wall-strain-no-default",
    targetPackId: targetPack.id,
    sourceEvidence: [
      "data/myocardium/protocols/atrial-strain-proxy-scoring-phase5be-result-v1.json",
      "data/myocardium/protocols/atrial-land-ra-source-stress-convention-phase5av-result-v1.json",
    ],
    protocol: {
      baseRuntimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      currentAllChamberControlMode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES.map((candidate) => candidate.id),
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      landAtrialParameterPackId: LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId,
      directReadbacks: [
        "AV-plane descent",
        "effective wall volume correction",
        "wall lambda",
        "wall engineering strain",
      ],
      noRuntimeDefaultFlip: true,
      noAtrialBridgeSelection: true,
      noTrefOrSourceStressScaling: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    landAtrialParameterPackDigest: {
      sourceCore: LANDATRIAL_SHADOW_PARAMETER_PACK.sourceCore,
      sourceTrefUnchanged: true,
      laParameterSetStableHash:
        LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.LA.parameterSetStableHash,
      raParameterSetStableHash:
        LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.RA.parameterSetStableHash,
      calibrationNotes: LANDATRIAL_SHADOW_PARAMETER_PACK.calibrationNotes,
    },
    targetPackDigest: {
      sourceCount: targetPack.sources.length,
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
    },
    points: POINTS,
    runs,
    candidateSummaries,
    summary: {
      bestCandidateByCombinedTargetDistanceId: best?.candidateId ?? null,
      landAtrialShadowAllChamberMeasuredPointIds: landAtrialSummary?.measuredPointIds ?? [],
      landAtrialShadowAllChamberHealthOkPointIds: landAtrialSummary?.healthOkPointIds ?? [],
      landAtrialShadowAllChamberSettleFailedPointIds: landAtrialSummary?.settleFailedPointIds ?? [],
      landAtrialShadowAllChamberRuntimeErrorPointIds: landAtrialSummary?.runtimeErrorPointIds ?? [],
      diagnosticStatus,
      currentInterpretation: interpretation(best, landAtrialSummary, diagnosticStatus),
      recommendedNext: [
        "use LandAtrial shadow as the forward atrial active-mechanics path instead of adding A1/A2 gain variants",
        "if high-preload HR90 remains settle-blocked, attribute settling through atrial Ca scale/passive geometry/AV-plane coupling without Tref, source-stress, qDot, valve, or root/Zc tuning",
        "add direct AV-plane/wall-strain score surfaces to future LandAtrial calibration rather than relying on cuberoot volume proxy alone",
      ],
      blockers: [
        "LandAtrial shadow is not an all-chamber runtime default",
        "direct wall-strain readbacks are chamber-geometry proxies, not speckle-tracking strain validation",
        "target-wide atrial figure-eight/function acceptance remains blocked",
      ],
    },
    boundary: {
      noAllChamberRuntimeDefaultFlip: true,
      noAtrialBridgeSelection: true,
      noAtrialLandPhysiologyAcceptance: true,
      noOfficialMorphologyAcceptance: true,
      noAfValidationClaim: true,
      noTrefTuning: true,
      noSourceStressScaling: true,
      noQDotClampRemoval: true,
      noValveLoadTimingAcceptance: true,
    },
  };
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function runPoint(candidate: CandidateSpec, point: PointSpec): Run {
  try {
    const params: Partial<CoreRuntimeParams> = { ...defaultParams(), HR: point.HR };
    const instrumentationByChamber: Partial<Record<AtrialChamber, ModelCoreLand2017LvSourceProviderInstrumentation>> = {};
    const resolution = candidate.currentAllChamberLandControl
      ? resolveModelCoreRuntimeActiveSource({
        mode: MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
        runtimeParams: params,
      })
      : resolveModelCoreRuntimeActiveSource({
        mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
        runtimeParams: params,
      });
    const core = new ModelCore(params, {
      ...resolution.experimentalOptions,
      activeSourceProviders: {
        ...(resolution.experimentalOptions.activeSourceProviders ?? {}),
        ...createLandAtrialProviders(candidate, instrumentationByChamber),
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
      candidateId: candidate.id,
      pointId: point.id,
      HR: point.HR,
      targetTBVMl: point.targetTBVMl,
      status: settled ? "measured" : "settle-failed",
      settled,
      settleReason: settleStatus.reason,
      settleBeats: settleStatus.beats,
      health: {
        status: health.status,
        periodBeats: health.periodBeats,
        messages: health.messages,
      },
      providerIds: core.debugExperimentalActiveSourceProviderIds(),
      atrialProviderInstrumentation: Object.fromEntries(
        (["LA", "RA"] as const).flatMap((chamber) => {
          const instrumentation = instrumentationByChamber[chamber];
          return instrumentation ? [[chamber, compactInstrumentation(instrumentation)]] : [];
        }),
      ) as Partial<Record<AtrialChamber, InstrumentationCompact>>,
      forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
      forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
      LA: {
        volumeFunction: atrialVolumeFunction(samples, "LA"),
        directWallStrain: atrialDirectWallStrain(samples, "LA"),
      },
      RA: {
        volumeFunction: atrialVolumeFunction(samples, "RA"),
        directWallStrain: atrialDirectWallStrain(samples, "RA"),
      },
      errorMessage: null,
    };
  } catch (error) {
    return {
      candidateId: candidate.id,
      pointId: point.id,
      HR: point.HR,
      targetTBVMl: point.targetTBVMl,
      status: "runtime-error",
      settled: false,
      settleReason: null,
      settleBeats: null,
      health: null,
      providerIds: {},
      atrialProviderInstrumentation: {},
      forwardCO_L: null,
      forwardCO_R: null,
      LA: { volumeFunction: null, directWallStrain: null },
      RA: { volumeFunction: null, directWallStrain: null },
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function createLandAtrialProviders(
  candidate: CandidateSpec,
  instrumentationByChamber: Partial<Record<AtrialChamber, ModelCoreLand2017LvSourceProviderInstrumentation>>,
): Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> {
  if (candidate.atrialLandShadowChambers.length === 0) return {};
  const providers: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> = {};
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  for (const chamber of candidate.atrialLandShadowChambers) {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    instrumentationByChamber[chamber] = instrumentation;
    providers[chamber] = createAtrialLandShadowSourceProvider(chamber, instrumentation, {
      commitScheme: "BE",
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().contractility,
      signedPressureAdapter: true,
    });
  }
  return providers;
}

function summarizeCandidate(candidateId: CandidateId, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidateId);
  return {
    candidateId,
    measuredPointIds: candidateRuns.filter((run) => run.status === "measured").map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health?.status === "ok").map((run) => run.pointId),
    runtimeErrorPointIds: candidateRuns.filter((run) => run.status === "runtime-error").map((run) => run.pointId),
    settleFailedPointIds: candidateRuns.filter((run) => run.status === "settle-failed").map((run) => run.pointId),
    bothAtriaVolumeFunctionPassPointIds: candidateRuns
      .filter((run) => run.LA.volumeFunction?.allBroadPass && run.RA.volumeFunction?.allBroadPass)
      .map((run) => run.pointId),
    bothAtriaDirectWallStrainPassPointIds: candidateRuns
      .filter((run) => run.LA.directWallStrain?.allRangePass && run.RA.directWallStrain?.allRangePass)
      .map((run) => run.pointId),
    meanLaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA.volumeFunction?.broadRangeDistance ?? Number.NaN))),
    meanRaVolumeDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA.volumeFunction?.broadRangeDistance ?? Number.NaN))),
    meanLaDirectWallStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA.directWallStrain?.sourceRangeDistance ?? Number.NaN))),
    meanRaDirectWallStrainDistance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA.directWallStrain?.sourceRangeDistance ?? Number.NaN))),
    totalAtrialLandSolveFailureCount: candidateRuns.reduce((sum, run) =>
      sum
      + (run.atrialProviderInstrumentation.LA?.landSolveFailureCount ?? 0)
      + (run.atrialProviderInstrumentation.RA?.landSolveFailureCount ?? 0), 0),
    selectableByThisArtifact: false,
  };
}

function compactInstrumentation(
  instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation,
): InstrumentationCompact {
  return {
    providerActive: true,
    sourceActiveStressPaCalls: instrumentation.sourceActiveStressPa,
    commitProviderStateAfterStepCalls: instrumentation.commitProviderStateAfterStep,
    landSolveOkCount: instrumentation.landSolveOkCount,
    landSolveFailureCount: instrumentation.landSolveFailureCount,
    maxSolverResidualNorm: round(instrumentation.maxSolverResidualNorm),
    lastFailureReason: instrumentation.lastFailureReason,
    sourcePathAudit: compactSignalAudit(instrumentation.sourcePathAudit),
    commitPathAudit: compactSignalAudit(instrumentation.commitPathAudit),
  };
}

function compactSignalAudit(audit: ModelCoreLand2017LvSignalAudit): SignalAuditCompact {
  return {
    sampleCount: audit.sampleCount,
    freeCalciumUM: compactRange(audit.freeCalciumUM),
    fiberEngineeringStrain: compactRange(audit.fiberEngineeringStrain),
    fiberEngineeringStrainRatePerSec: compactRange(audit.fiberEngineeringStrainRatePerSec),
    sourceActiveFiberStressPa: compactRange(audit.sourceActiveFiberStressPa),
    boundFraction: compactRange(audit.boundFraction),
    finiteHealthAllSamples: audit.finiteHealthAllSamples,
  };
}

function compactRange(range: ModelCoreLand2017LvRangeAudit): RangeCompact {
  return {
    min: finiteOrNull(range.min),
    max: finiteOrNull(range.max),
  };
}

function atrialVolumeFunction(samples: readonly SimSample[], chamber: AtrialChamber): AtrialVolumeFunction {
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialVolumeFunctionForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialVolumeFunction,
      "maxVolumeMl"
      | "preAtrialContractionVolumeMl"
      | "minVolumeMl"
      | "totalEmptyingFraction"
      | "passiveEmptyingFraction"
      | "activeEmptyingFraction"
    >> => metric != null);
  const maxVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) => metric.maxVolumeMl)));
  const preAtrialContractionVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) =>
    metric.preAtrialContractionVolumeMl)));
  const minVolumeMl = finiteOrNull(mean(beatMetrics.map((metric) => metric.minVolumeMl)));
  const totalEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.totalEmptyingFraction)));
  const passiveEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.passiveEmptyingFraction)));
  const activeEmptyingFraction = finiteOrNull(mean(beatMetrics.map((metric) => metric.activeEmptyingFraction)));
  const ranges = volumeRanges(chamber);
  const distance = rangeDistance(totalEmptyingFraction, ranges.total)
    + rangeDistance(passiveEmptyingFraction, ranges.passive)
    + rangeDistance(activeEmptyingFraction, ranges.active);
  return {
    beatCount: beatMetrics.length,
    maxVolumeMl,
    preAtrialContractionVolumeMl,
    minVolumeMl,
    totalEmptyingFraction,
    passiveEmptyingFraction,
    activeEmptyingFraction,
    allBroadPass:
      inRange(totalEmptyingFraction, ranges.total)
      && inRange(passiveEmptyingFraction, ranges.passive)
      && inRange(activeEmptyingFraction, ranges.active),
    broadRangeDistance: Number.isFinite(distance) ? round(distance) : null,
  };
}

function atrialVolumeFunctionForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialVolumeFunction,
  "maxVolumeMl"
  | "preAtrialContractionVolumeMl"
  | "minVolumeMl"
  | "totalEmptyingFraction"
  | "passiveEmptyingFraction"
  | "activeEmptyingFraction"
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

function atrialDirectWallStrain(samples: readonly SimSample[], chamber: AtrialChamber): AtrialDirectWallStrain {
  const finiteSamples = samples.filter((sample) => Number.isFinite(wallLambda(sample, chamber)));
  const beatMetrics = beatGroups(samples)
    .map((beatSamples) => atrialDirectWallStrainForBeat(beatSamples, chamber))
    .filter((metric): metric is Required<Pick<AtrialDirectWallStrain,
      "reservoirStrain" | "conduitStrain" | "contractileStrain"
    >> => metric != null);
  const reservoirStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.reservoirStrain)));
  const conduitStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.conduitStrain)));
  const contractileStrain = finiteOrNull(mean(beatMetrics.map((metric) => metric.contractileStrain)));
  const ranges = strainRanges(chamber);
  const distance = rangeDistance(reservoirStrain, ranges.reservoir)
    + rangeDistance(conduitStrain, ranges.conduit)
    + rangeDistance(contractileStrain, ranges.contractile);
  const reservoirRangePass = inRange(reservoirStrain, ranges.reservoir);
  const conduitRangePass = inRange(conduitStrain, ranges.conduit);
  const contractileRangePass = inRange(contractileStrain, ranges.contractile);
  const descent = finiteSamples.map((sample) => chamber === "LA"
    ? sample.LAAvPlaneDescent01
    : sample.RAAvPlaneDescent01).filter(isFiniteNumber);
  const correction = finiteSamples.map((sample) => chamber === "LA"
    ? sample.LAAvPlaneEffectiveVolumeCorrectionMl
    : sample.RAAvPlaneEffectiveVolumeCorrectionMl).filter(isFiniteNumber);
  const lambdaDelta = finiteSamples.map((sample) => {
    const without = chamber === "LA" ? sample.LAWallLambdaWithoutAvPlane : sample.RAWallLambdaWithoutAvPlane;
    const withAv = chamber === "LA" ? sample.LAWallLambda : sample.RAWallLambda;
    return without != null && withAv != null ? without - withAv : Number.NaN;
  }).filter(Number.isFinite);
  return {
    metricId: "direct-avplane-wall-lambda-strain-v1",
    beatCount: beatMetrics.length,
    reservoirStrain,
    conduitStrain,
    contractileStrain,
    reservoirRangePass,
    conduitRangePass,
    contractileRangePass,
    allRangePass: reservoirRangePass && conduitRangePass && contractileRangePass,
    sourceRangeDistance: Number.isFinite(distance) ? round(distance) : null,
    finiteSampleFraction: samples.length > 0 ? round(finiteSamples.length / samples.length) : 0,
    meanAvPlaneDescent01: finiteOrNull(mean(descent)),
    maxAvPlaneDescent01: finiteOrNull(max(descent)),
    meanEffectiveVolumeCorrectionMl: finiteOrNull(mean(correction)),
    maxEffectiveVolumeCorrectionMl: finiteOrNull(max(correction)),
    meanLambdaDeltaFromAvPlane: finiteOrNull(mean(lambdaDelta)),
    maxLambdaDeltaFromAvPlane: finiteOrNull(max(lambdaDelta)),
  };
}

function atrialDirectWallStrainForBeat(
  samples: readonly SimSample[],
  chamber: AtrialChamber,
): Required<Pick<AtrialDirectWallStrain, "reservoirStrain" | "conduitStrain" | "contractileStrain">> | null {
  if (samples.length < 16) return null;
  const lambdas = samples.map((sample) => wallLambda(sample, chamber)).filter((value) =>
    Number.isFinite(value) && value > 0);
  if (lambdas.length === 0) return null;
  const maxLambda = Math.max(...lambdas);
  const minLambda = Math.min(...lambdas);
  const preAtrialContractionLambda = Math.max(wallLambda(nearestThetaSample(samples, 0.76), chamber), 1e-9);
  return {
    reservoirStrain: (maxLambda - minLambda) / Math.max(minLambda, 1e-9),
    conduitStrain: (maxLambda - preAtrialContractionLambda) / Math.max(minLambda, 1e-9),
    contractileStrain: (preAtrialContractionLambda - minLambda) / Math.max(minLambda, 1e-9),
  };
}

function wallLambda(sample: SimSample, chamber: AtrialChamber): number {
  return chamber === "LA" ? sample.LAWallLambda ?? Number.NaN : sample.RAWallLambda ?? Number.NaN;
}

function interpretation(
  best: CandidateSummary | null,
  landAtrialSummary: CandidateSummary | undefined,
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
): string {
  const bestText = best
    ? `Best combined target-distance candidate is ${best.candidateId}.`
    : "No combined target-distance candidate is available.";
  const landText = landAtrialSummary
    ? `LandAtrial all-chamber shadow measured ${landAtrialSummary.measuredPointIds.length}/${POINTS.length} points, health-ok ${landAtrialSummary.healthOkPointIds.length}/${POINTS.length}, runtime errors ${landAtrialSummary.runtimeErrorPointIds.length}.`
    : "LandAtrial all-chamber shadow summary missing.";
  return [
    "Phase 5BF introduces a reusable atrial-calibrated Land shadow provider and direct AV-plane/effective wall-geometry readbacks.",
    bestText,
    landText,
    `Diagnostic status: ${diagnosticStatus}.`,
    "This is a shadow/calibration surface, not all-chamber default or atrial physiology acceptance.",
  ].join(" ");
}

function combinedDistance(summary: CandidateSummary): number {
  return (summary.meanLaVolumeDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanRaVolumeDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanLaDirectWallStrainDistance ?? Number.POSITIVE_INFINITY)
    + (summary.meanRaDirectWallStrainDistance ?? Number.POSITIVE_INFINITY);
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

function inRange(value: number | null, range: Range): boolean {
  return value != null && value >= range[0] && value <= range[1];
}

function rangeDistance(value: number | null, range: Range): number {
  if (value == null) return Number.POSITIVE_INFINITY;
  if (value < range[0]) return range[0] - value;
  if (value > range[1]) return value - range[1];
  return 0;
}

function asRange(value: readonly number[]): Range {
  if (value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) {
    throw new Error("Atrial target range must contain two finite numbers.");
  }
  return [value[0], value[1]];
}

function finiteOrNull(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? round(value) : null;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function max(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length === 0 ? Number.NaN : Math.max(...finite);
}

function frac(value: number): number {
  return value - Math.floor(value);
}

function isFiniteNumber(value: number | undefined): value is number {
  return value != null && Number.isFinite(value);
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
  const evidence = buildAtrialLandShadowPhase5BFEvidence();
  const outputPath = path.resolve(process.cwd(), ATRIAL_LAND_SHADOW_PHASE5BF_RESULT_PATH);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    diagnosticStatus: evidence.summary.diagnosticStatus,
    bestCandidateByCombinedTargetDistanceId: evidence.summary.bestCandidateByCombinedTargetDistanceId,
    landAtrialShadowAllChamberHealthOkPointIds:
      evidence.summary.landAtrialShadowAllChamberHealthOkPointIds,
    landAtrialShadowAllChamberSettleFailedPointIds:
      evidence.summary.landAtrialShadowAllChamberSettleFailedPointIds,
    landAtrialShadowAllChamberRuntimeErrorPointIds:
      evidence.summary.landAtrialShadowAllChamberRuntimeErrorPointIds,
  }, null, 2));
}
