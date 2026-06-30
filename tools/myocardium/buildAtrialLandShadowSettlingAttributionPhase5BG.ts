import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5BFArtifact from "@/data/myocardium/protocols/atrial-land-shadow-phase5bf-result-v1.json";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
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
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvRangeAudit,
  type ModelCoreLand2017LvSignalAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy, type SettleStatus } from "@/engine/settling";

export const ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_ID =
  "atrial-land-shadow-settling-attribution-phase5bg-result-v1";
export const ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_RESULT_PATH =
  "data/myocardium/protocols/atrial-land-shadow-settling-attribution-phase5bg-result-v1.json";

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

type SettleCompact = {
  readonly settled: boolean;
  readonly reason: SettleStatus["reason"] | null;
  readonly beats: number | null;
  readonly actualSeconds: number | null;
  readonly worstSignal: SettleStatus["worstSignal"] | null;
  readonly worstDelta: number | null;
  readonly adjacentDelta: number | null;
  readonly periodBeats: SettleStatus["periodBeats"] | null;
  readonly periodDelta: number | null;
  readonly worstDeltaToPrimaryTolerance: number | null;
  readonly periodDeltaToShapeTolerance: number | null;
};

type AtrialFeaturePack = {
  readonly sampleCount: number;
  readonly pressureMmHg: RangeCompact;
  readonly passivePressureMmHg: RangeCompact;
  readonly activePressureMmHg: RangeCompact;
  readonly avPlanePressureDeltaMmHg: RangeCompact;
  readonly pressureFloorHitFraction: number | null;
  readonly volumeMl: RangeCompact;
  readonly volumeRateMlPerSec: RangeCompact;
  readonly avPlaneDescent01: RangeCompact;
  readonly avPlaneEffectiveVolumeCorrectionMl: RangeCompact;
  readonly wallVolumeMl: RangeCompact;
  readonly wallLambda: RangeCompact;
  readonly wallLambdaWithoutAvPlane: RangeCompact;
  readonly wallLambdaDeltaWithoutMinusWithAvPlane: RangeCompact;
  readonly wallEngineeringStrain: RangeCompact;
  readonly wallEngineeringStrainWithoutAvPlane: RangeCompact;
  readonly pairedAvValveOpen01: RangeCompact;
  readonly pairedAvValveDiodeImpulseMeanAbs: number | null;
  readonly pairedAvValveDiodeImpulseMaxAbs: number | null;
  readonly pairedAvValveQDotClampHitFraction: number | null;
};

type OutputPack = {
  readonly metrics: Pick<SimMetrics,
    | "AoPMean"
    | "PAPMean"
    | "RAPMean"
    | "LAPMean"
    | "SV_L"
    | "SV_R"
    | "CO_L"
    | "CO_R"
    | "MVRegurgitantFraction"
    | "TVRegurgitantFraction"
    | "TBV"
  > | null;
  readonly forwardCO_L: number | null;
  readonly forwardCO_R: number | null;
};

type Run = {
  readonly candidateId: CandidateId;
  readonly pointId: PointId;
  readonly HR: 75 | 90;
  readonly targetTBVMl: number;
  readonly status: "measured" | "settle-failed" | "runtime-error";
  readonly settle: SettleCompact;
  readonly health: Pick<SimulationHealth, "status" | "periodBeats" | "messages"> | null;
  readonly providerIds: Partial<Record<Chamber, string>>;
  readonly atrialProviderInstrumentation: Partial<Record<AtrialChamber, InstrumentationCompact>>;
  readonly output: OutputPack;
  readonly LA: AtrialFeaturePack | null;
  readonly RA: AtrialFeaturePack | null;
  readonly errorMessage: string | null;
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly measuredPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly runtimeErrorPointIds: readonly PointId[];
  readonly settleFailedPointIds: readonly PointId[];
  readonly highPreloadHr90Status: Run["status"] | null;
  readonly highPreloadHr90WorstSignal: SettleStatus["worstSignal"] | null;
  readonly highPreloadHr90WorstDeltaToPrimaryTolerance: number | null;
  readonly totalAtrialLandSolveFailureCount: number;
  readonly minSourceActiveStressPa: number | null;
  readonly maxSourceActiveStressPa: number | null;
  readonly meanMvDiodeImpulseAbs: number | null;
  readonly meanTvDiodeImpulseAbs: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_ID;
  readonly phase: "Phase 5BG";
  readonly claimBoundary: "landatrial-shadow-settling-attribution-no-tuning-no-default";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-land-shadow-phase5bf-result-v1.json",
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
    readonly settlePolicy: Pick<SettlePolicy, "tolPrimary" | "tolShape" | "consecutiveBeats" | "minBeats" | "capSeconds" | "postSettleBeats">;
    readonly landAtrialParameterPackId: typeof LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId;
    readonly noA1A2GainSweep: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noTrefOrSourceStressScaling: true;
    readonly noQDotRootZcValveTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly previousPhaseDigest: {
    readonly phase5bfStatus: string;
    readonly phase5bfHash: string;
    readonly phase5bfAllChamberSettleFailedPointIds: readonly string[];
  };
  readonly landAtrialParameterPackDigest: {
    readonly sourceCore: typeof LANDATRIAL_SHADOW_PARAMETER_PACK.sourceCore;
    readonly sourceTrefUnchanged: true;
    readonly laParameterSetStableHash: string;
    readonly raParameterSetStableHash: string;
  };
  readonly points: readonly PointSpec[];
  readonly runs: readonly Run[];
  readonly candidateSummaries: readonly CandidateSummary[];
  readonly summary: {
    readonly diagnosticStatus:
      | "ra-dominant-landatrial-settling-boundary"
      | "bilateral-landatrial-settling-boundary"
      | "landatrial-settling-boundary-not-localized"
      | "landatrial-shadow-settling-supported";
    readonly currentInterpretation: string;
    readonly recommendedNext: readonly string[];
    readonly blockers: readonly string[];
  };
  readonly boundary: {
    readonly noAllChamberRuntimeDefaultFlip: true;
    readonly noAtrialPhysiologyAcceptance: true;
    readonly noA1A2Selection: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noSourceStressClamp: true;
    readonly noSourceStressScaling: true;
    readonly noTrefTuning: true;
    readonly noQDotClampRemoval: true;
    readonly noRootZcRetuning: true;
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

export function buildAtrialLandShadowSettlingPhase5BGEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidate) => POINTS.map((point) => runPoint(candidate, point)));
  const candidateSummaries = CANDIDATES.map((candidate) => summarizeCandidate(candidate.id, runs));
  const diagnosticStatus = classifyDiagnosticStatus(runs);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_ID,
    phase: "Phase 5BG",
    claimBoundary: "landatrial-shadow-settling-attribution-no-tuning-no-default",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-land-shadow-phase5bf-result-v1.json",
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
      settlePolicy: {
        tolPrimary: SETTLE_POLICY.tolPrimary,
        tolShape: SETTLE_POLICY.tolShape,
        consecutiveBeats: SETTLE_POLICY.consecutiveBeats,
        minBeats: SETTLE_POLICY.minBeats,
        capSeconds: SETTLE_POLICY.capSeconds,
        postSettleBeats: SETTLE_POLICY.postSettleBeats,
      },
      landAtrialParameterPackId: LANDATRIAL_SHADOW_PARAMETER_PACK.parameterPackId,
      noA1A2GainSweep: true,
      noRuntimeDefaultFlip: true,
      noTrefOrSourceStressScaling: true,
      noQDotRootZcValveTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    previousPhaseDigest: {
      phase5bfStatus: phase5BFArtifact.summary.diagnosticStatus,
      phase5bfHash: phase5BFArtifact.normalizedSha256,
      phase5bfAllChamberSettleFailedPointIds:
        phase5BFArtifact.summary.landAtrialShadowAllChamberSettleFailedPointIds,
    },
    landAtrialParameterPackDigest: {
      sourceCore: LANDATRIAL_SHADOW_PARAMETER_PACK.sourceCore,
      sourceTrefUnchanged: true,
      laParameterSetStableHash:
        LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.LA.parameterSetStableHash,
      raParameterSetStableHash:
        LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.RA.parameterSetStableHash,
    },
    points: POINTS,
    runs,
    candidateSummaries,
    summary: {
      diagnosticStatus,
      currentInterpretation: interpretation(runs, diagnosticStatus),
      recommendedNext: recommendedNext(diagnosticStatus),
      blockers: [
        "LandAtrial remains shadow-only and not an all-chamber runtime default",
        "Phase 5BG attributes settling boundaries only; it does not tune atrial Land, AV-plane coupling, qDot clamps, root/Zc, or valves",
        "A1/A2 remain frozen diagnostic scaffolds/comparators, not physiology selection candidates",
      ],
    },
    boundary: {
      noAllChamberRuntimeDefaultFlip: true,
      noAtrialPhysiologyAcceptance: true,
      noA1A2Selection: true,
      noOfficialMorphologyAcceptance: true,
      noSourceStressClamp: true,
      noSourceStressScaling: true,
      noTrefTuning: true,
      noQDotClampRemoval: true,
      noRootZcRetuning: true,
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
      providerIds: core.debugExperimentalActiveSourceProviderIds(),
      atrialProviderInstrumentation: Object.fromEntries(
        (["LA", "RA"] as const).flatMap((chamber) => {
          const instrumentation = instrumentationByChamber[chamber];
          return instrumentation ? [[chamber, compactInstrumentation(instrumentation)]] : [];
        }),
      ) as Partial<Record<AtrialChamber, InstrumentationCompact>>,
      output: outputPack(measurement?.metrics ?? core.metrics({ windowBeats: settleStatus.periodBeats }), measurement),
      LA: atrialFeatures(samples, "LA"),
      RA: atrialFeatures(samples, "RA"),
      errorMessage: null,
    };
  } catch (error) {
    return {
      candidateId: candidate.id,
      pointId: point.id,
      HR: point.HR,
      targetTBVMl: point.targetTBVMl,
      status: "runtime-error",
      settle: emptySettle(),
      health: null,
      providerIds: {},
      atrialProviderInstrumentation: {},
      output: { metrics: null, forwardCO_L: null, forwardCO_R: null },
      LA: null,
      RA: null,
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
  const sourceRanges = candidateRuns.flatMap((run) =>
    (["LA", "RA"] as const).flatMap((chamber) => {
      const audit = run.atrialProviderInstrumentation[chamber]?.sourcePathAudit.sourceActiveFiberStressPa;
      return audit ? [audit] : [];
    }));
  return {
    candidateId,
    measuredPointIds: candidateRuns.filter((run) => run.status === "measured").map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health?.status === "ok").map((run) => run.pointId),
    runtimeErrorPointIds: candidateRuns.filter((run) => run.status === "runtime-error").map((run) => run.pointId),
    settleFailedPointIds: candidateRuns.filter((run) => run.status === "settle-failed").map((run) => run.pointId),
    highPreloadHr90Status: runByPoint(candidateRuns, "high-preload-hr90")?.status ?? null,
    highPreloadHr90WorstSignal: runByPoint(candidateRuns, "high-preload-hr90")?.settle.worstSignal ?? null,
    highPreloadHr90WorstDeltaToPrimaryTolerance:
      runByPoint(candidateRuns, "high-preload-hr90")?.settle.worstDeltaToPrimaryTolerance ?? null,
    totalAtrialLandSolveFailureCount: candidateRuns.reduce((sum, run) =>
      sum
      + (run.atrialProviderInstrumentation.LA?.landSolveFailureCount ?? 0)
      + (run.atrialProviderInstrumentation.RA?.landSolveFailureCount ?? 0), 0),
    minSourceActiveStressPa: finiteOrNull(Math.min(...sourceRanges.map((range) =>
      range.min ?? Number.POSITIVE_INFINITY))),
    maxSourceActiveStressPa: finiteOrNull(Math.max(...sourceRanges.map((range) =>
      range.max ?? Number.NEGATIVE_INFINITY))),
    meanMvDiodeImpulseAbs: finiteOrNull(mean(candidateRuns.map((run) =>
      run.LA?.pairedAvValveDiodeImpulseMeanAbs ?? Number.NaN))),
    meanTvDiodeImpulseAbs: finiteOrNull(mean(candidateRuns.map((run) =>
      run.RA?.pairedAvValveDiodeImpulseMeanAbs ?? Number.NaN))),
  };
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
    periodDeltaToShapeTolerance: finiteOrNull(status.periodDelta / SETTLE_POLICY.tolShape),
  };
}

function emptySettle(): SettleCompact {
  return {
    settled: false,
    reason: null,
    beats: null,
    actualSeconds: null,
    worstSignal: null,
    worstDelta: null,
    adjacentDelta: null,
    periodBeats: null,
    periodDelta: null,
    worstDeltaToPrimaryTolerance: null,
    periodDeltaToShapeTolerance: null,
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

function atrialFeatures(samples: readonly SimSample[], chamber: AtrialChamber): AtrialFeaturePack {
  const pressureKey = chamber === "LA" ? "LAP" : "RAP";
  const volumeKey = chamber === "LA" ? "VLA" : "VRA";
  const rateKey = chamber === "LA" ? "dVLAdtMlPerSec" : "dVRAdtMlPerSec";
  const passiveKey = chamber === "LA" ? "LAPassivePressureMmHg" : "RAPassivePressureMmHg";
  const activeKey = chamber === "LA" ? "LAActivePressureMmHg" : "RAActivePressureMmHg";
  const avPlanePressureKey = chamber === "LA" ? "LAAvPlanePressureDeltaMmHg" : "RAAvPlanePressureDeltaMmHg";
  const floorKey = chamber === "LA" ? "LAPressureFloorHit01" : "RAPressureFloorHit01";
  const descentKey = chamber === "LA" ? "LAAvPlaneDescent01" : "RAAvPlaneDescent01";
  const correctionKey = chamber === "LA" ? "LAAvPlaneEffectiveVolumeCorrectionMl" : "RAAvPlaneEffectiveVolumeCorrectionMl";
  const wallVolumeKey = chamber === "LA" ? "LAWallVolumeMl" : "RAWallVolumeMl";
  const lambdaKey = chamber === "LA" ? "LAWallLambda" : "RAWallLambda";
  const lambdaWithoutKey = chamber === "LA" ? "LAWallLambdaWithoutAvPlane" : "RAWallLambdaWithoutAvPlane";
  const strainKey = chamber === "LA" ? "LAWallEngineeringStrain" : "RAWallEngineeringStrain";
  const strainWithoutKey = chamber === "LA" ? "LAWallEngineeringStrainWithoutAvPlane" : "RAWallEngineeringStrainWithoutAvPlane";
  const valveOpenKey = chamber === "LA" ? "xiMV" : "xiTV";
  const valveDiodeImpulseKey = chamber === "LA" ? "MV_diodeImpulse" : "TV_diodeImpulse";
  const valveQDotClampHitKey = chamber === "LA" ? "MV_qDotClampHit01" : "TV_qDotClampHit01";
  return {
    sampleCount: samples.length,
    pressureMmHg: range(samples.map((sample) => Number(sample[pressureKey]))),
    passivePressureMmHg: range(samples.map((sample) => optionalNumber(sample, passiveKey))),
    activePressureMmHg: range(samples.map((sample) => optionalNumber(sample, activeKey))),
    avPlanePressureDeltaMmHg: range(samples.map((sample) => optionalNumber(sample, avPlanePressureKey))),
    pressureFloorHitFraction: finiteOrNull(mean(samples.map((sample) => optionalNumber(sample, floorKey)))),
    volumeMl: range(samples.map((sample) => Number(sample[volumeKey]))),
    volumeRateMlPerSec: range(samples.map((sample) => optionalNumber(sample, rateKey))),
    avPlaneDescent01: range(samples.map((sample) => optionalNumber(sample, descentKey))),
    avPlaneEffectiveVolumeCorrectionMl: range(samples.map((sample) => optionalNumber(sample, correctionKey))),
    wallVolumeMl: range(samples.map((sample) => optionalNumber(sample, wallVolumeKey))),
    wallLambda: range(samples.map((sample) => optionalNumber(sample, lambdaKey))),
    wallLambdaWithoutAvPlane: range(samples.map((sample) => optionalNumber(sample, lambdaWithoutKey))),
    wallLambdaDeltaWithoutMinusWithAvPlane: range(samples.map((sample) => {
      const without = optionalNumber(sample, lambdaWithoutKey);
      const withAv = optionalNumber(sample, lambdaKey);
      return Number.isFinite(without) && Number.isFinite(withAv) ? without - withAv : Number.NaN;
    })),
    wallEngineeringStrain: range(samples.map((sample) => optionalNumber(sample, strainKey))),
    wallEngineeringStrainWithoutAvPlane: range(samples.map((sample) => optionalNumber(sample, strainWithoutKey))),
    pairedAvValveOpen01: range(samples.map((sample) => Number(sample[valveOpenKey]))),
    pairedAvValveDiodeImpulseMeanAbs: finiteOrNull(mean(samples.map((sample) =>
      Math.abs(optionalNumber(sample, valveDiodeImpulseKey))))),
    pairedAvValveDiodeImpulseMaxAbs: finiteOrNull(max(samples.map((sample) =>
      Math.abs(optionalNumber(sample, valveDiodeImpulseKey))))),
    pairedAvValveQDotClampHitFraction: finiteOrNull(mean(samples.map((sample) =>
      optionalNumber(sample, valveQDotClampHitKey)))),
  };
}

function outputPack(
  metrics: SimMetrics | null,
  measurement: { forwardCO_L: number; forwardCO_R: number } | null,
): OutputPack {
  return {
    metrics: metrics
      ? {
        AoPMean: round(metrics.AoPMean),
        PAPMean: round(metrics.PAPMean),
        RAPMean: round(metrics.RAPMean),
        LAPMean: round(metrics.LAPMean),
        SV_L: round(metrics.SV_L),
        SV_R: round(metrics.SV_R),
        CO_L: round(metrics.CO_L),
        CO_R: round(metrics.CO_R),
        MVRegurgitantFraction: round(metrics.MVRegurgitantFraction),
        TVRegurgitantFraction: round(metrics.TVRegurgitantFraction),
        TBV: round(metrics.TBV),
      }
      : null,
    forwardCO_L: finiteOrNull(measurement?.forwardCO_L),
    forwardCO_R: finiteOrNull(measurement?.forwardCO_R),
  };
}

function classifyDiagnosticStatus(runs: readonly Run[]): Evidence["summary"]["diagnosticStatus"] {
  const all = runByCandidatePoint(runs, "landatrial-shadow-la-ra-signed", "high-preload-hr90");
  const la = runByCandidatePoint(runs, "landatrial-shadow-la-only-signed", "high-preload-hr90");
  const ra = runByCandidatePoint(runs, "landatrial-shadow-ra-only-signed", "high-preload-hr90");
  if (all?.status === "measured") return "landatrial-shadow-settling-supported";
  if (all?.status === "settle-failed" && la?.status === "measured" && ra?.status === "settle-failed") {
    return "ra-dominant-landatrial-settling-boundary";
  }
  if (all?.status === "settle-failed" && la?.status === "settle-failed" && ra?.status === "settle-failed") {
    return "bilateral-landatrial-settling-boundary";
  }
  return "landatrial-settling-boundary-not-localized";
}

function interpretation(
  runs: readonly Run[],
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
): string {
  const all = runByCandidatePoint(runs, "landatrial-shadow-la-ra-signed", "high-preload-hr90");
  const la = runByCandidatePoint(runs, "landatrial-shadow-la-only-signed", "high-preload-hr90");
  const ra = runByCandidatePoint(runs, "landatrial-shadow-ra-only-signed", "high-preload-hr90");
  const control = runByCandidatePoint(runs, "current-all-chamber-land-nonnegative-control", "low-preload-hr90");
  return [
    "Phase 5BG keeps A1/A2 frozen and attributes the Phase 5BF LandAtrial settling boundary without tuning.",
    `High-preload HR90 statuses: LA-only=${la?.status ?? "missing"}, RA-only=${ra?.status ?? "missing"}, LA+RA=${all?.status ?? "missing"}.`,
    `LA+RA worst signal=${all?.settle.worstSignal ?? "missing"}, worstDelta/tolPrimary=${all?.settle.worstDeltaToPrimaryTolerance ?? "missing"}.`,
    `Current all-chamber nonnegative control at low-preload HR90 remains ${control?.status ?? "missing"}.`,
    `Diagnostic status: ${diagnosticStatus}.`,
  ].join(" ");
}

function recommendedNext(
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
): readonly string[] {
  if (diagnosticStatus === "ra-dominant-landatrial-settling-boundary") {
    return [
      "calibrate the RA LandAtrial shadow path first: RA atrial parameter pack, RA geometry/passive anchor, and RA AV-plane/effective-wall coupling diagnostics",
      "keep LA LandAtrial parameter work separate because LA-only does not reproduce the high-preload HR90 settle boundary",
      "do not solve the RA boundary with source-stress clamps, Tref/source-stress scaling, qDot/root/Zc retuning, valve-threshold tuning, or A1/A2 gain sweeps",
    ];
  }
  if (diagnosticStatus === "bilateral-landatrial-settling-boundary") {
    return [
      "inspect shared atrial LandAtrial pressure-adapter and AV-plane/effective-wall geometry terms before chamber-specific calibration",
      "keep A1/A2 frozen and use them only as diagnostic comparators",
      "do not tune qDot/root/Zc/valves or source stress to buy settling",
    ];
  }
  if (diagnosticStatus === "landatrial-shadow-settling-supported") {
    return [
      "move from settling attribution to atrial-calibrated Land target-pack scoring across HR75/90 preload envelope",
      "keep all-chamber default flip out of scope until atrial waveform/function evidence is accepted",
    ];
  }
  return [
    "tighten LandAtrial attribution with a smaller chamber-specific diagnostic matrix before calibration",
    "inspect runtime errors, settling status, and provider instrumentation before adding new model knobs",
  ];
}

function runByCandidatePoint(
  runs: readonly Run[],
  candidateId: CandidateId,
  pointId: PointId,
): Run | undefined {
  return runs.find((run) => run.candidateId === candidateId && run.pointId === pointId);
}

function runByPoint(runs: readonly Run[], pointId: PointId): Run | undefined {
  return runs.find((run) => run.pointId === pointId);
}

function range(values: readonly number[]): RangeCompact {
  const finite = values.filter(isFiniteNumber);
  if (finite.length === 0) return { min: null, max: null };
  return {
    min: round(Math.min(...finite)),
    max: round(Math.max(...finite)),
  };
}

function optionalNumber<K extends keyof SimSample>(sample: SimSample, key: K): number {
  const value = sample[key];
  return typeof value === "number" ? value : Number.NaN;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(isFiniteNumber);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function max(values: readonly number[]): number {
  const finite = values.filter(isFiniteNumber);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function finiteOrNull(value: number | undefined | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value) : null;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number.parseFloat(value.toFixed(6));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function writeEvidence(): void {
  const evidence = buildAtrialLandShadowSettlingPhase5BGEvidence();
  const outPath = path.resolve(process.cwd(), ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    wrote: ATRIAL_LAND_SHADOW_SETTLING_PHASE5BG_RESULT_PATH,
    hash: evidence.normalizedSha256,
    status: evidence.summary.diagnosticStatus,
    interpretation: evidence.summary.currentInterpretation,
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeEvidence();
}
