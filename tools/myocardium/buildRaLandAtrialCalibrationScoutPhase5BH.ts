import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5BGArtifact from "@/data/myocardium/protocols/atrial-land-shadow-settling-attribution-phase5bg-result-v1.json";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { ModelCore, defaultParams, type ModelCoreExperimentalActiveSourceProvider } from "@/engine/ModelCore";
import type { Chamber } from "@/engine/chambers";
import { measureSteady } from "@/engine/measure";
import {
  LANDATRIAL_SHADOW_PARAMETER_PACK,
  createAtrialLandShadowParameterSet,
  createAtrialLandShadowSourceProvider,
} from "@/engine/myocardium/atrialLandShadow";
import { MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE, resolveModelCoreRuntimeActiveSource } from "@/engine/myocardium/runtimeActiveSource";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvRangeAudit,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import { DEFAULT_SETTLE_POLICY, type SettlePolicy, type SettleStatus } from "@/engine/settling";
import type { Land2017SourceParameterSet } from "@/engine/myocardium/myofilament/land2017";

export const RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_ID =
  "ra-landatrial-calibration-scout-phase5bh-result-v1";
export const RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_RESULT_PATH =
  "data/myocardium/protocols/ra-landatrial-calibration-scout-phase5bh-result-v1.json";

type PointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "normal-hr90"
  | "low-preload-hr90"
  | "high-preload-hr90";

type CandidateId =
  | "current-la-ra-landatrial-shadow-pack"
  | "ra-landatrial-moderate-desensitized-v1"
  | "ra-landatrial-conservative-desensitized-v1"
  | "ra-landatrial-slower-kinetics-v1"
  | "ra-landatrial-moderate-desensitized-avplane8-v1"
  | "ra-landatrial-moderate-desensitized-avplane6-v1";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly HR: 75 | 90;
};

type RangeCompact = { readonly min: number | null; readonly max: number | null };

type CandidateSpec = {
  readonly id: CandidateId;
  readonly raParameterSet: Land2017SourceParameterSet;
  readonly raActiveOverrides?: Record<string, number>;
  readonly rationale: string;
};

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

type ChamberFeature = {
  readonly pressureMmHg: RangeCompact;
  readonly activePressureMmHg: RangeCompact;
  readonly passivePressureMmHg: RangeCompact;
  readonly avPlanePressureDeltaMmHg: RangeCompact;
  readonly volumeMl: RangeCompact;
  readonly wallLambda: RangeCompact;
  readonly wallLambdaWithoutAvPlane: RangeCompact;
  readonly wallLambdaDeltaWithoutMinusWithAvPlane: RangeCompact;
  readonly avPlaneEffectiveVolumeCorrectionMl: RangeCompact;
  readonly avValveDiodeImpulseMeanAbs: number | null;
  readonly avValveQDotClampHitFraction: number | null;
};

type Run = {
  readonly candidateId: CandidateId;
  readonly pointId: PointId;
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
  readonly LA: ChamberFeature | null;
  readonly RA: ChamberFeature | null;
  readonly errorMessage: string | null;
};

type CandidateSummary = {
  readonly candidateId: CandidateId;
  readonly rationale: string;
  readonly raParameterSetStableHash: string;
  readonly raActiveOverrides: Record<string, number> | null;
  readonly measuredPointIds: readonly PointId[];
  readonly healthOkPointIds: readonly PointId[];
  readonly settleFailedPointIds: readonly PointId[];
  readonly runtimeErrorPointIds: readonly PointId[];
  readonly highPreloadHr90Status: Run["status"] | null;
  readonly highPreloadHr90WorstSignal: SettleStatus["worstSignal"] | null;
  readonly highPreloadHr90WorstDeltaToPrimaryTolerance: number | null;
  readonly meanWorstDeltaToPrimaryTolerance: number | null;
  readonly maxRaActivePressureMmHg: number | null;
  readonly maxRaSourceActiveStressPa: number | null;
  readonly maxRaLandSolverResidualNorm: number | null;
  readonly totalLandSolveFailureCount: number;
  readonly outputPreservedPointIds: readonly PointId[];
  readonly supportedForNextShadowPack: boolean;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_ID;
  readonly phase: "Phase 5BH";
  readonly claimBoundary: "ra-landatrial-calibration-scout-no-default-no-a1a2";
  readonly sourceEvidence: readonly [
    "data/myocardium/protocols/atrial-land-shadow-settling-attribution-phase5bg-result-v1.json",
  ];
  readonly protocol: {
    readonly baseRuntimeActiveSourceMode: typeof MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE;
    readonly pointSource: "hr75-hr90-normal-low-high-preload";
    readonly candidateIds: readonly CandidateId[];
    readonly dtSec: typeof DT_SEC;
    readonly sampleHz: typeof SAMPLE_HZ;
    readonly measureBeats: typeof MEASURE_BEATS;
    readonly noA1A2GainSweep: true;
    readonly noRuntimeDefaultFlip: true;
    readonly noTrefOrSourceStressScaling: true;
    readonly noQDotRootZcValveTuning: true;
    readonly noPermanentVerifierOrNpmScriptAdded: true;
  };
  readonly previousPhaseDigest: {
    readonly phase5bgStatus: string;
    readonly phase5bgHash: string;
    readonly phase5bgInterpretation: string;
  };
  readonly candidateDigests: readonly CandidateSummary[];
  readonly runs: readonly Run[];
  readonly summary: {
    readonly diagnosticStatus:
      | "ra-landatrial-candidate-supported-for-next-shadow-pack"
      | "ra-landatrial-promoted-shadow-pack-supported"
      | "ra-landatrial-candidates-unsettled"
      | "ra-landatrial-candidates-output-cost"
      | "ra-landatrial-candidates-runtime-error";
    readonly recommendedCandidateId: CandidateId | null;
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
    id: "current-la-ra-landatrial-shadow-pack",
    raParameterSet: LANDATRIAL_SHADOW_PARAMETER_PACK.chamberParameterSets.RA,
    rationale: "Promoted current RA shadow pack after the Phase 5BH conservative-desensitized selection.",
  },
  {
    id: "ra-landatrial-moderate-desensitized-v1",
    raParameterSet: createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "moderate-desensitized-v1",
      runtimeValueOverrides: {
        kTRPN: 125,
        CaT50Ref: 0.82,
        ku: 900,
        kuw: 180,
        kws: 14,
        gammaS: 9,
        gammaW: 580,
        TRPN50: 0.40,
      },
    }),
    rationale: "Reduce RA Ca sensitivity and crossbridge aggressiveness without Tref/source-stress scaling.",
  },
  {
    id: "ra-landatrial-conservative-desensitized-v1",
    raParameterSet: createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "conservative-desensitized-v1",
      runtimeValueOverrides: {
        kTRPN: 110,
        CaT50Ref: 0.90,
        ku: 750,
        kuw: 150,
        kws: 10,
        gammaS: 8,
        gammaW: 500,
        TRPN50: 0.46,
      },
    }),
    rationale: "Lower RA active stress more strongly to test whether the boundary is overactive RA Land.",
  },
  {
    id: "ra-landatrial-slower-kinetics-v1",
    raParameterSet: createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "slower-kinetics-v1",
      runtimeValueOverrides: {
        kTRPN: 105,
        CaT50Ref: 0.76,
        ku: 650,
        kuw: 120,
        kws: 8,
        gammaS: 7,
        gammaW: 430,
        TRPN50: 0.38,
      },
    }),
    rationale: "Mostly broaden/slow RA kinetics while only modestly reducing Ca sensitivity.",
  },
  {
    id: "ra-landatrial-moderate-desensitized-avplane8-v1",
    raParameterSet: createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "moderate-desensitized-v1",
      runtimeValueOverrides: {
        kTRPN: 125,
        CaT50Ref: 0.82,
        ku: 900,
        kuw: 180,
        kws: 14,
        gammaS: 9,
        gammaW: 580,
        TRPN50: 0.40,
      },
    }),
    raActiveOverrides: { avPlaneGainMl: 8 },
    rationale: "Same moderate RA Land pack with smaller RA AV-plane effective-volume correction.",
  },
  {
    id: "ra-landatrial-moderate-desensitized-avplane6-v1",
    raParameterSet: createAtrialLandShadowParameterSet("RA", {
      parameterSetIdSuffix: "moderate-desensitized-v1",
      runtimeValueOverrides: {
        kTRPN: 125,
        CaT50Ref: 0.82,
        ku: 900,
        kuw: 180,
        kws: 14,
        gammaS: 9,
        gammaW: 580,
        TRPN50: 0.40,
      },
    }),
    raActiveOverrides: { avPlaneGainMl: 6 },
    rationale: "Same moderate RA Land pack with a stronger test of smaller RA AV-plane gain.",
  },
] as const;

export function buildRaLandAtrialCalibrationScoutPhase5BHEvidence(): Evidence {
  const runs = CANDIDATES.flatMap((candidate) => POINTS.map((point) => runPoint(candidate, point)));
  const summaries = CANDIDATES.map((candidate) => summarizeCandidate(candidate, runs));
  const recommended = pickRecommendedCandidate(summaries);
  const diagnosticStatus = classifyDiagnosticStatus(summaries, recommended);
  const evidenceWithoutHash: Omit<Evidence, "normalizedSha256"> = {
    schemaVersion: 1,
    id: RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_ID,
    phase: "Phase 5BH",
    claimBoundary: "ra-landatrial-calibration-scout-no-default-no-a1a2",
    sourceEvidence: [
      "data/myocardium/protocols/atrial-land-shadow-settling-attribution-phase5bg-result-v1.json",
    ],
    protocol: {
      baseRuntimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      pointSource: "hr75-hr90-normal-low-high-preload",
      candidateIds: CANDIDATES.map((candidate) => candidate.id),
      dtSec: DT_SEC,
      sampleHz: SAMPLE_HZ,
      measureBeats: MEASURE_BEATS,
      noA1A2GainSweep: true,
      noRuntimeDefaultFlip: true,
      noTrefOrSourceStressScaling: true,
      noQDotRootZcValveTuning: true,
      noPermanentVerifierOrNpmScriptAdded: true,
    },
    previousPhaseDigest: {
      phase5bgStatus: phase5BGArtifact.summary.diagnosticStatus,
      phase5bgHash: phase5BGArtifact.normalizedSha256,
      phase5bgInterpretation: phase5BGArtifact.summary.currentInterpretation,
    },
    candidateDigests: summaries,
    runs,
    summary: {
      diagnosticStatus,
      recommendedCandidateId: recommended?.candidateId ?? null,
      currentInterpretation: interpretation(summaries, recommended, diagnosticStatus),
      recommendedNext: recommendedNext(recommended, diagnosticStatus),
      blockers: [
        "Phase 5BH is a calibration scout; it does not promote a new all-chamber runtime default.",
        "The recommended candidate, if present, is a next shadow-pack input, not atrial physiology acceptance.",
        "A1/A2 remain frozen and are not re-tuned in this phase.",
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
    const params: Partial<CoreRuntimeParams> = {
      ...defaultParams(),
      HR: point.HR,
      nodeOverrides: candidate.raActiveOverrides
        ? { RA: { active: candidate.raActiveOverrides } }
        : undefined,
    };
    const laInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const raInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolution = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      runtimeParams: params,
    });
    const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
    const activeSourceProviders: Partial<Record<Chamber, ModelCoreExperimentalActiveSourceProvider>> = {
      ...(resolution.experimentalOptions.activeSourceProviders ?? {}),
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
        parameterSet: candidate.raParameterSet,
        sourceProviderId: `phase5bh-${candidate.id}`,
        signedPressureAdapter: true,
      }),
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
        LA: compactInstrumentation(laInstrumentation),
        RA: compactInstrumentation(raInstrumentation),
      },
      LA: chamberFeature(samples, "LA"),
      RA: chamberFeature(samples, "RA"),
      errorMessage: null,
    };
  } catch (error) {
    return {
      candidateId: candidate.id,
      pointId: point.id,
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

function summarizeCandidate(candidate: CandidateSpec, runs: readonly Run[]): CandidateSummary {
  const candidateRuns = runs.filter((run) => run.candidateId === candidate.id);
  return {
    candidateId: candidate.id,
    rationale: candidate.rationale,
    raParameterSetStableHash: candidate.raParameterSet.parameterSetStableHash,
    raActiveOverrides: candidate.raActiveOverrides ?? null,
    measuredPointIds: candidateRuns.filter((run) => run.status === "measured").map((run) => run.pointId),
    healthOkPointIds: candidateRuns.filter((run) => run.health?.status === "ok").map((run) => run.pointId),
    settleFailedPointIds: candidateRuns.filter((run) => run.status === "settle-failed").map((run) => run.pointId),
    runtimeErrorPointIds: candidateRuns.filter((run) => run.status === "runtime-error").map((run) => run.pointId),
    highPreloadHr90Status: runByPoint(candidateRuns, "high-preload-hr90")?.status ?? null,
    highPreloadHr90WorstSignal: runByPoint(candidateRuns, "high-preload-hr90")?.settle?.worstSignal ?? null,
    highPreloadHr90WorstDeltaToPrimaryTolerance:
      runByPoint(candidateRuns, "high-preload-hr90")?.settle?.worstDeltaToPrimaryTolerance ?? null,
    meanWorstDeltaToPrimaryTolerance: finiteOrNull(mean(candidateRuns.map((run) =>
      run.settle?.worstDeltaToPrimaryTolerance ?? Number.NaN))),
    maxRaActivePressureMmHg: finiteOrNull(max(candidateRuns.map((run) =>
      run.RA?.activePressureMmHg.max ?? Number.NaN))),
    maxRaSourceActiveStressPa: finiteOrNull(max(candidateRuns.map((run) =>
      run.instrumentation.RA?.sourceActiveFiberStressPa.max ?? Number.NaN))),
    maxRaLandSolverResidualNorm: finiteOrNull(max(candidateRuns.map((run) =>
      run.instrumentation.RA?.maxSolverResidualNorm ?? Number.NaN))),
    totalLandSolveFailureCount: candidateRuns.reduce((sum, run) =>
      sum
      + (run.instrumentation.LA?.landSolveFailureCount ?? 0)
      + (run.instrumentation.RA?.landSolveFailureCount ?? 0), 0),
    outputPreservedPointIds: candidateRuns.filter(outputPreserved).map((run) => run.pointId),
    supportedForNextShadowPack:
      candidateRuns.every((run) => run.status === "measured")
      && candidateRuns.every((run) => run.health?.status === "ok")
      && candidateRuns.every(outputPreserved)
      && candidateRuns.every((run) =>
        (run.instrumentation.LA?.landSolveFailureCount ?? 0) === 0
        && (run.instrumentation.RA?.landSolveFailureCount ?? 0) === 0),
  };
}

function pickRecommendedCandidate(summaries: readonly CandidateSummary[]): CandidateSummary | null {
  const supported = summaries.filter((summary) => summary.supportedForNextShadowPack);
  if (supported.length === 0) return null;
  return supported.slice().sort((left, right) =>
    (left.meanWorstDeltaToPrimaryTolerance ?? Number.POSITIVE_INFINITY)
    - (right.meanWorstDeltaToPrimaryTolerance ?? Number.POSITIVE_INFINITY)
    || (left.maxRaActivePressureMmHg ?? Number.POSITIVE_INFINITY)
    - (right.maxRaActivePressureMmHg ?? Number.POSITIVE_INFINITY))[0] ?? null;
}

function classifyDiagnosticStatus(
  summaries: readonly CandidateSummary[],
  recommended: CandidateSummary | null,
): Evidence["summary"]["diagnosticStatus"] {
  if (recommended?.candidateId === "current-la-ra-landatrial-shadow-pack") {
    return "ra-landatrial-promoted-shadow-pack-supported";
  }
  if (recommended) return "ra-landatrial-candidate-supported-for-next-shadow-pack";
  if (summaries.some((summary) => summary.runtimeErrorPointIds.length > 0)) {
    return "ra-landatrial-candidates-runtime-error";
  }
  if (summaries.every((summary) => summary.settleFailedPointIds.length > 0)) {
    return "ra-landatrial-candidates-unsettled";
  }
  return "ra-landatrial-candidates-output-cost";
}

function interpretation(
  summaries: readonly CandidateSummary[],
  recommended: CandidateSummary | null,
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
): string {
  const current = summaries.find((summary) => summary.candidateId === "current-la-ra-landatrial-shadow-pack");
  const recommendedText = recommended
    ? (
      recommended.candidateId === "current-la-ra-landatrial-shadow-pack"
        ? "The promoted current RA shadow pack is supported by this artifact."
        : `Recommended next shadow-pack candidate is ${recommended.candidateId}.`
    )
    : "No candidate is supported for next shadow-pack promotion by this artifact.";
  return [
    "Phase 5BH keeps A1/A2 frozen and scouts RA LandAtrial parameter/AV-plane candidates after Phase 5BG localized the boundary to RA-dominant high-preload HR90.",
    `Current pack high-preload HR90 status=${current?.highPreloadHr90Status ?? "missing"}.`,
    recommendedText,
    `Diagnostic status: ${diagnosticStatus}.`,
  ].join(" ");
}

function recommendedNext(
  recommended: CandidateSummary | null,
  diagnosticStatus: Evidence["summary"]["diagnosticStatus"],
): readonly string[] {
  if (diagnosticStatus === "ra-landatrial-promoted-shadow-pack-supported") {
    return [
      "use the promoted RA LandAtrial conservative-desensitized shadow pack as the next LandAtrial baseline",
      "advance to atrial target-pack scoring and figure-eight loop calibration with AV-plane/effective-wall readbacks",
      "keep all-chamber runtime default, atrial physiology acceptance, and A1/A2 selection out of scope until waveform/function gates pass",
    ];
  }
  if (recommended) {
    return [
      `promote ${recommended.candidateId} into the LandAtrial shadow RA parameter pack in a follow-on phase, then rerun Phase 5BF/5BG-style envelope evidence`,
      "keep the change shadow-only until atrial waveform/function targets and loop readability are separately accepted",
      "do not re-open A1/A2 gain sweeps, qDot/root/Zc tuning, valve threshold tuning, Tref tuning, or source-stress scaling",
    ];
  }
  if (diagnosticStatus === "ra-landatrial-candidates-unsettled") {
    return [
      "widen the RA geometry/passive/AV-plane diagnostic candidates before changing Land kinetics further",
      "inspect RVEDP-centered settling traces because the boundary stayed on RVEDP in Phase 5BG",
    ];
  }
  return [
    "inspect unsupported candidates for output cost/runtime error before selecting a next RA shadow pack",
    "keep the current LV+RV Land plus root/Zc platform floor fixed",
  ];
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

function compactRange(range: ModelCoreLand2017LvRangeAudit): RangeCompact {
  return {
    min: finiteOrNull(range.min),
    max: finiteOrNull(range.max),
  };
}

function chamberFeature(samples: readonly SimSample[], chamber: "LA" | "RA"): ChamberFeature {
  const pressureKey = chamber === "LA" ? "LAP" : "RAP";
  const volumeKey = chamber === "LA" ? "VLA" : "VRA";
  const passiveKey = chamber === "LA" ? "LAPassivePressureMmHg" : "RAPassivePressureMmHg";
  const activeKey = chamber === "LA" ? "LAActivePressureMmHg" : "RAActivePressureMmHg";
  const avPlanePressureKey = chamber === "LA" ? "LAAvPlanePressureDeltaMmHg" : "RAAvPlanePressureDeltaMmHg";
  const lambdaKey = chamber === "LA" ? "LAWallLambda" : "RAWallLambda";
  const lambdaWithoutKey = chamber === "LA" ? "LAWallLambdaWithoutAvPlane" : "RAWallLambdaWithoutAvPlane";
  const correctionKey = chamber === "LA" ? "LAAvPlaneEffectiveVolumeCorrectionMl" : "RAAvPlaneEffectiveVolumeCorrectionMl";
  const diodeKey = chamber === "LA" ? "MV_diodeImpulse" : "TV_diodeImpulse";
  const qDotHitKey = chamber === "LA" ? "MV_qDotClampHit01" : "TV_qDotClampHit01";
  return {
    pressureMmHg: range(samples.map((sample) => Number(sample[pressureKey]))),
    activePressureMmHg: range(samples.map((sample) => optionalNumber(sample, activeKey))),
    passivePressureMmHg: range(samples.map((sample) => optionalNumber(sample, passiveKey))),
    avPlanePressureDeltaMmHg: range(samples.map((sample) => optionalNumber(sample, avPlanePressureKey))),
    volumeMl: range(samples.map((sample) => Number(sample[volumeKey]))),
    wallLambda: range(samples.map((sample) => optionalNumber(sample, lambdaKey))),
    wallLambdaWithoutAvPlane: range(samples.map((sample) => optionalNumber(sample, lambdaWithoutKey))),
    wallLambdaDeltaWithoutMinusWithAvPlane: range(samples.map((sample) => {
      const without = optionalNumber(sample, lambdaWithoutKey);
      const withAv = optionalNumber(sample, lambdaKey);
      return Number.isFinite(without) && Number.isFinite(withAv) ? without - withAv : Number.NaN;
    })),
    avPlaneEffectiveVolumeCorrectionMl: range(samples.map((sample) => optionalNumber(sample, correctionKey))),
    avValveDiodeImpulseMeanAbs: finiteOrNull(mean(samples.map((sample) => Math.abs(optionalNumber(sample, diodeKey))))),
    avValveQDotClampHitFraction: finiteOrNull(mean(samples.map((sample) => optionalNumber(sample, qDotHitKey)))),
  };
}

function runByPoint(runs: readonly Run[], pointId: PointId): Run | undefined {
  return runs.find((run) => run.pointId === pointId);
}

function range(values: readonly number[]): RangeCompact {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: null, max: null };
  return { min: round(Math.min(...finite)), max: round(Math.max(...finite)) };
}

function optionalNumber<K extends keyof SimSample>(sample: SimSample, key: K): number {
  const value = sample[key];
  return typeof value === "number" ? value : Number.NaN;
}

function mean(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return Number.NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function max(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
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
  const evidence = buildRaLandAtrialCalibrationScoutPhase5BHEvidence();
  const outPath = path.resolve(process.cwd(), RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({
    wrote: RA_LANDATRIAL_CALIBRATION_SCOUT_PHASE5BH_RESULT_PATH,
    hash: evidence.normalizedSha256,
    status: evidence.summary.diagnosticStatus,
    recommendedCandidateId: evidence.summary.recommendedCandidateId,
    interpretation: evidence.summary.currentInterpretation,
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  writeEvidence();
}
