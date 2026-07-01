import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  conciseMorphologyMessages,
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { lastCompleteBeat } from "@/engine/verification/shapeMetrics";

export const AV_VALVE_BOUNDARY_CONTRACT_V2_PHASE5DM_ID =
  "av-valve-boundary-contract-v2-phase5dm-result-v1" as const;
export const AV_VALVE_BOUNDARY_CONTRACT_V2_PHASE5DM_RESULT_PATH =
  "data/myocardium/protocols/av-valve-boundary-contract-v2-phase5dm-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "normal-hr90"
  | "low-preload-hr75"
  | "high-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "pressure-flow-user0-inlet-held-release-baseline"
  | "forward-momentum-projection-tv-reference"
  | "stateful-v2-tv-loss12-inertance4"
  | "stateful-v2-both-loss12-inertance4";

type BoundaryMode =
  | "accepted-state-valve-pressure-flow"
  | "accepted-state-valve-pressure-flow-forward-momentum-projection"
  | "accepted-state-valve-pressure-flow-stateful-v2";

type PointSpec = {
  readonly id: PointId;
  readonly label: string;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type AtrialAvPlaneActiveOverride = {
  readonly avPlaneDescentRiseTauSec?: number;
  readonly avPlaneDescentReleaseTauSec?: number;
  readonly avPlaneDescentMaxRiseVelocity01PerSec?: number;
  readonly avPlaneDescentMaxReleaseVelocity01PerSec?: number;
  readonly avPlaneDescentReleaseInletOpenHold?: number;
  readonly avPlaneDescentReleaseInletOpenThreshold?: number;
};

type AvPlaneOverride = {
  readonly LA?: AtrialAvPlaneActiveOverride;
  readonly RA?: AtrialAvPlaneActiveOverride;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly avValveBoundaryMode: BoundaryMode;
  readonly avValveBoundaryTargetValves: readonly ("MV" | "TV")[];
  readonly statefulClosingLossGain: number | null;
  readonly statefulClosingInertanceGain: number | null;
  readonly forwardMomentumMinAreaRatio: number | null;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type StatefulV2Readback = {
  readonly dutyFraction: number;
  readonly closingMean: number | null;
  readonly closingMax: number | null;
  readonly lossScaleMean: number | null;
  readonly lossScaleMax: number | null;
  readonly inertanceScaleMean: number | null;
  readonly inertanceScaleMax: number | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly grossMorphologyOk: boolean;
  readonly morphologyStatus: MorphologyCheckSummary["status"] | "not-measured";
  readonly failedLabels: readonly string[];
  readonly badges: MorphologyBadgeSummary | null;
  readonly metrics: MetricDigest | null;
  readonly statefulV2Readbacks: Readonly<Record<"MV" | "TV", StatefulV2Readback>> | null;
  readonly messages: readonly string[];
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly grossPassCount: number;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly outputPreservedCount: number;
  readonly maxTvStatefulDutyFraction: number;
  readonly maxTvStatefulLossScale: number | null;
  readonly firstFailedPoint: PointId | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AV_VALVE_BOUNDARY_CONTRACT_V2_PHASE5DM_ID;
  readonly phase: "5DM";
  readonly objective:
    "test stateful AV valve pressure-flow/loss/inertance contract V2 against the strict morphology V1.1 envelope without post-hoc projection adoption";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "representative-normal-sinus-envelope";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: {
    readonly decision:
      | "stateful-v2-partial-positive"
      | "stateful-v2-no-frontier-improvement"
      | "stateful-v2-breaks-envelope"
      | "configuration-or-readback-gap";
    readonly baselineCounts: CountsDigest;
    readonly projectionReferenceCounts: CountsDigest;
    readonly bestStatefulV2VariantId: VariantId;
    readonly bestStatefulV2Counts: CountsDigest;
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noValveThresholdQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

type CountsDigest = {
  readonly grossOk: string;
  readonly lvPvOk: string;
  readonly rvPvOk: string;
  readonly mvfOk: string;
  readonly tvfOk: string;
  readonly outputPreserved: string;
};

type InternalRun = PointResult & {
  readonly beat: readonly SimSample[];
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", label: "Normal HR75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "low-preload-hr75", label: "Low preload HR75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", label: "High preload HR75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "normal-hr90", label: "Normal HR90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "systemic-afterload-high-hr75", label: "Systemic afterload high HR75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", label: "Pulmonary afterload high HR75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 1.35 } },
  { id: "contractility-low-hr75", label: "Contractility low HR75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", label: "Contractility high HR75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

export function buildAvValveBoundaryContractV2Phase5DMEvidence(): Evidence {
  const inletHeldRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  const variants = [
    acceptedUser0Variant(
      "pressure-flow-user0-inlet-held-release-baseline",
      "Current user0 pressure-flow frontier with inlet-held LA/RA AV-plane release",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow",
      ["MV", "TV"],
      null,
      null,
      null,
    ),
    acceptedUser0Variant(
      "forward-momentum-projection-tv-reference",
      "Rejected TV-only forward-momentum projection reference",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-forward-momentum-projection",
      ["TV"],
      0.05,
      null,
      null,
    ),
    acceptedUser0Variant(
      "stateful-v2-tv-loss12-inertance4",
      "TV-only stateful V2 loss/inertance contract",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-stateful-v2",
      ["TV"],
      null,
      12,
      4,
    ),
    acceptedUser0Variant(
      "stateful-v2-both-loss12-inertance4",
      "MV+TV stateful V2 loss/inertance contract",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-stateful-v2",
      ["MV", "TV"],
      null,
      12,
      4,
    ),
  ] as const;

  const runs: InternalRun[] = [];
  for (const variant of variants) {
    for (const point of POINTS) {
      runs.push(runPoint(variant, point));
    }
  }

  const results = runs.map(stripInternalRun);
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AV_VALVE_BOUNDARY_CONTRACT_V2_PHASE5DM_ID,
    phase: "5DM",
    objective:
      "test stateful AV valve pressure-flow/loss/inertance contract V2 against the strict morphology V1.1 envelope without post-hoc projection adoption",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "representative-normal-sinus-envelope",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    classification,
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noA1A2Reopen: true,
      noValveThresholdQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

export function writeAvValveBoundaryContractV2Phase5DMEvidence(): Evidence {
  const evidence = buildAvValveBoundaryContractV2Phase5DMEvidence();
  const outPath = path.resolve(process.cwd(), AV_VALVE_BOUNDARY_CONTRACT_V2_PHASE5DM_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function acceptedUser0Variant(
  id: VariantId,
  label: string,
  atrialAvPlaneOverride: AvPlaneOverride,
  avValveBoundaryMode: BoundaryMode,
  avValveBoundaryTargetValves: readonly ("MV" | "TV")[],
  forwardMomentumMinAreaRatio: number | null,
  statefulClosingLossGain: number | null,
  statefulClosingInertanceGain: number | null,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label,
    avValveBoundaryMode,
    avValveBoundaryTargetValves,
    forwardMomentumMinAreaRatio,
    statefulClosingLossGain,
    statefulClosingInertanceGain,
    experimentalOptions: withAvBoundaryMode(
      withAtrialAvPlaneOverride(resolved.experimentalOptions, atrialAvPlaneOverride),
      `phase5dm-${id}`,
      avValveBoundaryMode,
      avValveBoundaryTargetValves,
      forwardMomentumMinAreaRatio,
      statefulClosingLossGain,
      statefulClosingInertanceGain,
    ),
  };
}

function withAvBoundaryMode(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
  avValveBoundaryMode: BoundaryMode,
  avValveBoundaryTargetValves: readonly ("MV" | "TV")[],
  forwardMomentumMinAreaRatio: number | null,
  statefulClosingLossGain: number | null,
  statefulClosingInertanceGain: number | null,
): ModelCoreExperimentalOptions {
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode,
      avValveBoundaryTargetValves,
      avValveBoundaryPressureRefitIterations: 2,
      avValveBoundaryPressureRefitRelaxation: 1,
      ...(forwardMomentumMinAreaRatio == null ? {} : {
        avValveBoundaryForwardMomentumMinAreaRatio: forwardMomentumMinAreaRatio,
      }),
      ...(statefulClosingLossGain == null ? {} : {
        avValveBoundaryStatefulClosingLossGain: statefulClosingLossGain,
      }),
      ...(statefulClosingInertanceGain == null ? {} : {
        avValveBoundaryStatefulClosingInertanceGain: statefulClosingInertanceGain,
      }),
    },
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  atrialAvPlaneOverride: AvPlaneOverride,
): ModelCoreExperimentalOptions {
  const basePatch = experimentalOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  const nodeOverrides: OverrideBlock = { ...baseNodes };
  if (atrialAvPlaneOverride.LA !== undefined) {
    const laNode = baseNodes.LA ?? {};
    nodeOverrides.LA = {
      ...laNode,
      active: { ...activeOverride(laNode), ...atrialAvPlaneOverride.LA },
    };
  }
  if (atrialAvPlaneOverride.RA !== undefined) {
    const raNode = baseNodes.RA ?? {};
    nodeOverrides.RA = {
      ...raNode,
      active: { ...activeOverride(raNode), ...atrialAvPlaneOverride.RA },
    };
  }
  return {
    ...experimentalOptions,
    runtimeParameterPatch: {
      ...basePatch,
      nodeOverrides,
    },
  };
}

function activeOverride(node: OverrideBlock[string] | undefined): Record<string, number | string> {
  const active = node?.active;
  return active && typeof active === "object" && !Array.isArray(active)
    ? active as Record<string, number | string>
    : {};
}

function runPoint(variant: VariantSpec, point: PointSpec): InternalRun {
  try {
    const params = { ...DEFAULT_PARAMS, ...point.params };
    const settle = settleToSteadyState(params, {
      targetTBV: point.targetTBVMl,
      dt: profile.dt,
      sampleHz: profile.sampleHz,
      settlePolicy: profile.settlePolicy,
      measureBeats: profile.measureBeats,
      requireProjectorQuiet: profile.requireProjectorQuiet,
      experimentalOptions: variant.experimentalOptions,
    });
    const measurement = settle.ok
      ? measureSteady(settle.core, settle.settleStatus, {
        targetTBV: point.targetTBVMl,
        dt: profile.dt,
        sampleHz: profile.sampleHz,
        settlePolicy: profile.settlePolicy,
        measureBeats: profile.measureBeats,
        requireProjectorQuiet: profile.requireProjectorQuiet,
        experimentalOptions: variant.experimentalOptions,
      })
      : null;
    const morphology = measurement ? morphologyCheckSummaryFromSamples(measurement.samples) : null;
    const beat = measurement ? lastCompleteBeat([...measurement.samples]) : [];
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossMorphologyOk: grossOk(morphology),
      morphologyStatus: morphology?.status ?? "not-measured",
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      badges: morphology?.badges ?? null,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      statefulV2Readbacks: beat.length > 0
        ? { MV: statefulV2Readback(beat, "MV"), TV: statefulV2Readback(beat, "TV") }
        : null,
      messages: morphology ? conciseMorphologyMessages(morphology) : ["Morphology check not measured."],
      errorMessage: null,
      beat,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      grossMorphologyOk: false,
      morphologyStatus: "not-measured",
      failedLabels: [error instanceof Error ? error.message : String(error)],
      badges: null,
      metrics: null,
      statefulV2Readbacks: null,
      messages: ["Morphology check not measured."],
      errorMessage: error instanceof Error ? error.message : String(error),
      beat: [],
    };
  }
}

function statefulV2Readback(beat: readonly SimSample[], valve: "MV" | "TV"): StatefulV2Readback {
  const prefix = valve === "MV" ? "MV" : "TV";
  const appliedKey = `${prefix}_acceptedBoundaryStatefulV2Applied01` as keyof SimSample;
  const closingKey = `${prefix}_acceptedBoundaryStatefulV2Closing01` as keyof SimSample;
  const lossKey = `${prefix}_acceptedBoundaryStatefulV2LossScale` as keyof SimSample;
  const inertanceKey = `${prefix}_acceptedBoundaryStatefulV2InertanceScale` as keyof SimSample;
  return {
    dutyFraction: round(fraction(beat, (sample) => numeric(sample, appliedKey) > 0.01)),
    closingMean: roundNullable(meanForKey(beat, closingKey)),
    closingMax: roundNullable(maxForKey(beat, closingKey)),
    lossScaleMean: roundNullable(meanForKey(beat, lossKey)),
    lossScaleMax: roundNullable(maxForKey(beat, lossKey)),
    inertanceScaleMean: roundNullable(meanForKey(beat, inertanceKey)),
    inertanceScaleMax: roundNullable(maxForKey(beat, inertanceKey)),
  };
}

function stripInternalRun(run: InternalRun): PointResult {
  const { beat: _beat, ...result } = run;
  return result;
}

function metricDigest(metrics: SimMetrics): MetricDigest {
  return {
    AoPMean: round(metrics.AoPMean),
    PAPMean: round(metrics.PAPMean),
    CO_L: round(metrics.CO_L),
    CO_R: round(metrics.CO_R),
    LAPMean: round(metrics.LAPMean),
    RAPMean: round(metrics.RAPMean),
    EF_LApprox: round(metrics.EF_LApprox),
    EF_RApprox: round(metrics.EF_RApprox),
  };
}

function grossOk(morphology: MorphologyCheckSummary | null): boolean {
  return Boolean(
    morphology?.badges.lvPv === "ok"
    && morphology.badges.rvPv === "ok"
    && morphology.badges.mvf === "ok"
    && morphology.badges.tvf === "ok",
  );
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  const tvReadbacks = own.flatMap((result) => result.statefulV2Readbacks ? [result.statefulV2Readbacks.TV] : []);
  const failures = own.filter((result) =>
    !result.grossMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  return {
    variantId: variant.id,
    grossPassCount: own.filter((result) =>
      result.grossMorphologyOk && result.settled && result.healthStatus === "ok"
    ).length,
    measuredCount: own.filter((result) => result.morphologyStatus !== "not-measured").length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    lvPvOkCount: badgeOkCount("lvPv"),
    rvPvOkCount: badgeOkCount("rvPv"),
    mvfOkCount: badgeOkCount("mvf"),
    tvfOkCount: badgeOkCount("tvf"),
    outputPreservedCount: own.filter((result) =>
      result.metrics
      && result.metrics.CO_L > 3.5
      && result.metrics.CO_L < 7.5
      && result.metrics.CO_R > 3.5
      && result.metrics.CO_R < 7.5
    ).length,
    maxTvStatefulDutyFraction: round(Math.max(0, ...tvReadbacks.map((readback) => readback.dutyFraction))),
    maxTvStatefulLossScale: roundNullable(maxNullable(tvReadbacks.map((readback) => readback.lossScaleMax))),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[]): Evidence["classification"] {
  const baseline = requiredSummary(summaries, "pressure-flow-user0-inlet-held-release-baseline");
  const projection = requiredSummary(summaries, "forward-momentum-projection-tv-reference");
  const tvV2 = requiredSummary(summaries, "stateful-v2-tv-loss12-inertance4");
  const bothV2 = requiredSummary(summaries, "stateful-v2-both-loss12-inertance4");
  const statefulCandidates = [tvV2, bothV2].sort((a, b) =>
    b.grossPassCount - a.grossPassCount
    || b.tvfOkCount - a.tvfOkCount
    || b.mvfOkCount - a.mvfOkCount
    || b.lvPvOkCount + b.rvPvOkCount - (a.lvPvOkCount + a.rvPvOkCount)
  );
  const best = statefulCandidates[0]!;
  const readbackGap = [tvV2, bothV2].some((summary) =>
    summary.maxTvStatefulDutyFraction <= 0 || summary.maxTvStatefulLossScale == null || summary.maxTvStatefulLossScale <= 1
  );
  const breaksEnvelope =
    best.grossPassCount < baseline.grossPassCount
    || best.lvPvOkCount < baseline.lvPvOkCount
    || best.rvPvOkCount < baseline.rvPvOkCount
    || best.mvfOkCount < baseline.mvfOkCount
    || best.tvfOkCount < baseline.tvfOkCount;
  const improvesFrontier =
    best.grossPassCount > baseline.grossPassCount
    || best.tvfOkCount > baseline.tvfOkCount
    || best.mvfOkCount > baseline.mvfOkCount;
  return {
    decision: readbackGap
      ? "configuration-or-readback-gap"
      : breaksEnvelope
        ? "stateful-v2-breaks-envelope"
        : improvesFrontier
          ? "stateful-v2-partial-positive"
          : "stateful-v2-no-frontier-improvement",
    baselineCounts: countsDigest(baseline),
    projectionReferenceCounts: countsDigest(projection),
    bestStatefulV2VariantId: best.variantId,
    bestStatefulV2Counts: countsDigest(best),
    notes: [
      "V2 changes the pressure-flow equation by scaling accepted-state valve loss/inertance during closure; it does not post-project q after solving.",
      "The rejected forward-momentum projection remains included only as a reference because owner visual review and Phase 5DL rejected its PV/QTV shape.",
      "Any stateful V2 result below the strict V1.1 morphology frontier is a no-go for adoption.",
    ],
  };
}

function countsDigest(summary: VariantSummary): CountsDigest {
  return {
    grossOk: `${summary.grossPassCount}/8`,
    lvPvOk: `${summary.lvPvOkCount}/8`,
    rvPvOk: `${summary.rvPvOkCount}/8`,
    mvfOk: `${summary.mvfOkCount}/8`,
    tvfOk: `${summary.tvfOkCount}/8`,
    outputPreserved: `${summary.outputPreservedCount}/8`,
  };
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing variant summary: ${variantId}`);
  return summary;
}

function fraction(samples: readonly SimSample[], predicate: (sample: SimSample) => boolean): number {
  if (samples.length === 0) return 0;
  return samples.filter(predicate).length / samples.length;
}

function meanForKey(samples: readonly SimSample[], key: keyof SimSample): number | null {
  const values = samples.map((sample) => numeric(sample, key)).filter(Number.isFinite);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxForKey(samples: readonly SimSample[], key: keyof SimSample): number | null {
  return maxNullable(samples.map((sample) => numeric(sample, key)));
}

function maxNullable(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return Math.max(...finite);
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number, digits = 6): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundNullable(value: number | null, digits = 6): number | null {
  return value == null ? null : round(value, digits);
}

function stable(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stable(value)).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAvValveBoundaryContractV2Phase5DMEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    variantSummaries: evidence.variantSummaries,
  }, null, 2));
}
