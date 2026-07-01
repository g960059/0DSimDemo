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
import type { CoreRuntimeParams, OverrideBlock, SimSample } from "@/engine/protocol";
import {
  conciseMorphologyMessages,
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { lastCompleteBeat } from "@/engine/verification/shapeMetrics";

export const SYSTOLIC_OUTFLOW_CONTRACT_PHASE5DO_ID = "systolic-outflow-contract-phase5do-result-v1" as const;
export const SYSTOLIC_OUTFLOW_CONTRACT_PHASE5DO_RESULT_PATH =
  "data/myocardium/protocols/systolic-outflow-contract-phase5do-result-v1.json" as const;

type PointId =
  | "normal-hr75"
  | "low-preload-hr75"
  | "systemic-afterload-high-hr75"
  | "pulmonary-afterload-high-hr75"
  | "contractility-low-hr75"
  | "contractility-high-hr75";

type VariantId =
  | "baseline-pressure-flow"
  | "semilunar-pressure-flow-both"
  | "semilunar-stateful-v2-both"
  | "semilunar-stateful-v2-aov-only"
  | "semilunar-stateful-v2-pv-only"
  | "av-v2-tv-plus-semilunar-stateful-v2-both";

type SemilunarMode =
  | "current"
  | "accepted-state-valve-pressure-flow"
  | "accepted-state-valve-pressure-flow-stateful-v2";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly semilunarMode: SemilunarMode;
  readonly semilunarTargets: readonly ("AoV" | "PV")[];
  readonly avV2Tv: boolean;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type DomeDigest = {
  readonly sampleCount: number;
  readonly positiveCurvatureFraction: number | null;
  readonly pressureDropAfterPeakMmHg: number | null;
  readonly pressureLateRiseMmHg: number | null;
  readonly activePressureLateRiseMmHg: number | null;
  readonly arterialPressureLateRiseMmHg: number | null;
  readonly outflowLateRiseMlPerSec: number | null;
  readonly peakTheta: number | null;
  readonly valleyTheta: number | null;
  readonly lateTheta: number | null;
};

type BoundaryReadbackDigest = {
  readonly appliedFraction: number;
  readonly statefulDutyFraction: number;
  readonly maxLossScale: number | null;
  readonly maxInertanceScale: number | null;
  readonly qDotClampHitFraction: number;
  readonly diodeHitFraction: number;
  readonly maxComplementarityResidualMlPerSec: number | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly healthStatus: string;
  readonly grossMorphologyOk: boolean;
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly lvDome: DomeDigest | null;
  readonly rvDome: DomeDigest | null;
  readonly aovBoundary: BoundaryReadbackDigest | null;
  readonly pvBoundary: BoundaryReadbackDigest | null;
  readonly messages: readonly string[];
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly grossPassCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly meanLvPositiveCurvatureFraction: number | null;
  readonly meanRvPositiveCurvatureFraction: number | null;
  readonly maxAoVStatefulDutyFraction: number;
  readonly maxPVStatefulDutyFraction: number;
  readonly maxAoVLossScale: number | null;
  readonly maxPVLossScale: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof SYSTOLIC_OUTFLOW_CONTRACT_PHASE5DO_ID;
  readonly phase: "5DO";
  readonly objective:
    "test selected semilunar accepted-state pressure-flow/loss/inertance candidates on a systolic-focused morphology envelope";
  readonly points: readonly PointSpec[];
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: {
    readonly decision:
      | "semilunar-contract-frontier-improves"
      | "semilunar-contract-side-specific-partial"
      | "semilunar-contract-no-frontier-improvement"
      | "configuration-or-measurement-gap";
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noQdotRootZcValveThresholdTrefSourceStressTuning: true;
  };
  readonly normalizedSha256: string;
};

type AvPlaneActiveOverride = {
  readonly avPlaneDescentRiseTauSec?: number;
  readonly avPlaneDescentReleaseTauSec?: number;
  readonly avPlaneDescentMaxRiseVelocity01PerSec?: number;
  readonly avPlaneDescentMaxReleaseVelocity01PerSec?: number;
  readonly avPlaneDescentReleaseInletOpenHold?: number;
  readonly avPlaneDescentReleaseInletOpenThreshold?: number;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 1.35 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

export function buildSystolicOutflowContractPhase5DOEvidence(): Evidence {
  const variants = buildVariants();
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant.id, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: SYSTOLIC_OUTFLOW_CONTRACT_PHASE5DO_ID,
    phase: "5DO",
    objective:
      "test selected semilunar accepted-state pressure-flow/loss/inertance candidates on a systolic-focused morphology envelope",
    points: POINTS,
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    results,
    variantSummaries,
    classification,
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noA1A2Reopen: true,
      noQdotRootZcValveThresholdTrefSourceStressTuning: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

export function writeSystolicOutflowContractPhase5DOEvidence(): Evidence {
  const evidence = buildSystolicOutflowContractPhase5DOEvidence();
  const outPath = path.resolve(process.cwd(), SYSTOLIC_OUTFLOW_CONTRACT_PHASE5DO_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function buildVariants(): readonly VariantSpec[] {
  return [
    variant("baseline-pressure-flow", "Baseline AV pressure-flow frontier", "current", ["AoV", "PV"], false),
    variant("semilunar-pressure-flow-both", "Semilunar accepted pressure-flow on AoV+PV", "accepted-state-valve-pressure-flow", ["AoV", "PV"], false),
    variant("semilunar-stateful-v2-both", "Semilunar stateful V2 on AoV+PV", "accepted-state-valve-pressure-flow-stateful-v2", ["AoV", "PV"], false),
    variant("av-v2-tv-plus-semilunar-stateful-v2-both", "TV AV V2 plus semilunar stateful V2 on AoV+PV", "accepted-state-valve-pressure-flow-stateful-v2", ["AoV", "PV"], true),
  ];
}

function variant(
  id: VariantId,
  label: string,
  semilunarMode: SemilunarMode,
  semilunarTargets: readonly ("AoV" | "PV")[],
  avV2Tv: boolean,
): VariantSpec {
  const inletHeldRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const baseOptions = withAtrialAvPlaneOverride(resolved.experimentalOptions, inletHeldRelease);
  return {
    id,
    label,
    semilunarMode,
    semilunarTargets,
    avV2Tv,
    experimentalOptions: {
      ...baseOptions,
      ventricularChamberTransactionStep: {
        mechanismId: `phase5do-${id}`,
        iterations: 4,
        relaxation: 0.7,
        providerStateCouplingChambers: ["LV", "RV"],
        includeAdjacentLoadNodes: true,
        avValveBoundaryMode: avV2Tv
          ? "accepted-state-valve-pressure-flow-stateful-v2"
          : "accepted-state-valve-pressure-flow",
        avValveBoundaryTargetValves: avV2Tv ? ["TV"] : ["MV", "TV"],
        avValveBoundaryPressureRefitIterations: 2,
        avValveBoundaryPressureRefitRelaxation: 1,
        avValveBoundaryStatefulClosingLossGain: 12,
        avValveBoundaryStatefulClosingInertanceGain: 4,
        semilunarValveBoundaryMode: semilunarMode,
        semilunarValveBoundaryTargetValves: semilunarTargets,
        semilunarValveBoundaryPressureRefitIterations: 2,
        semilunarValveBoundaryPressureRefitRelaxation: 0.8,
        semilunarValveBoundaryStatefulClosingLossGain: 8,
        semilunarValveBoundaryStatefulClosingInertanceGain: 3,
      },
    },
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  activeOverride: AvPlaneActiveOverride,
): ModelCoreExperimentalOptions {
  const basePatch = experimentalOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  return {
    ...experimentalOptions,
    runtimeParameterPatch: {
      ...basePatch,
      nodeOverrides: {
        ...baseNodes,
        LA: { ...(baseNodes.LA ?? {}), active: { ...activeBlock(baseNodes.LA), ...activeOverride } },
        RA: { ...(baseNodes.RA ?? {}), active: { ...activeBlock(baseNodes.RA), ...activeOverride } },
      },
    },
  };
}

function activeBlock(node: OverrideBlock[string] | undefined): Record<string, number | string> {
  const active = node?.active;
  return active && typeof active === "object" && !Array.isArray(active)
    ? active as Record<string, number | string>
    : {};
}

function runPoint(variant: VariantSpec, point: PointSpec): PointResult {
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
    const badges = morphology?.badges ?? null;
    const grossMorphologyOk = badges?.lvPv === "ok" && badges.rvPv === "ok" && badges.mvf === "ok" && badges.tvf === "ok";
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossMorphologyOk,
      badges,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      lvDome: beat.length > 0 ? domeDigest(beat, "LV") : null,
      rvDome: beat.length > 0 ? domeDigest(beat, "RV") : null,
      aovBoundary: beat.length > 0 ? boundaryDigest(beat, "AoV") : null,
      pvBoundary: beat.length > 0 ? boundaryDigest(beat, "PV") : null,
      messages: morphology ? conciseMorphologyMessages(morphology) : ["Morphology check not measured."],
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      healthStatus: "exception",
      grossMorphologyOk: false,
      badges: null,
      failedLabels: [error instanceof Error ? error.message : String(error)],
      lvDome: null,
      rvDome: null,
      aovBoundary: null,
      pvBoundary: null,
      messages: ["Morphology check not measured."],
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function domeDigest(beat: readonly SimSample[], chamber: "LV" | "RV"): DomeDigest {
  const flowKey = chamber === "LV" ? "QAo" : "QPV";
  const pressureKey = chamber === "LV" ? "LVP" : "RVP";
  const activeKey = chamber === "LV" ? "LVActivePressureMmHg" : "RVActivePressureMmHg";
  const arterialKey = chamber === "LV" ? "AoP" : "PAP";
  const flowMax = Math.max(0, ...beat.map((sample) => numeric(sample, flowKey)));
  const ejection = beat.filter((sample) => numeric(sample, flowKey) > Math.max(10, 0.08 * flowMax));
  if (ejection.length < 8) return emptyDomeDigest(ejection.length);
  const pressures = ejection.map((sample) => numeric(sample, pressureKey));
  const peakIndex = indexOfMax(pressures);
  const tail = ejection.slice(peakIndex);
  const tailPressures = tail.map((sample) => numeric(sample, pressureKey));
  const valleyIndex = peakIndex + indexOfMin(tailPressures);
  const late = ejection.slice(valleyIndex);
  const latePressures = late.map((sample) => numeric(sample, pressureKey));
  const lateIndex = valleyIndex + indexOfMax(latePressures);
  return {
    sampleCount: ejection.length,
    positiveCurvatureFraction: round(positiveCurvatureFraction(pressures)),
    pressureDropAfterPeakMmHg: round(Math.max(0, pressures[peakIndex]! - pressures[valleyIndex]!)),
    pressureLateRiseMmHg: round(Math.max(0, pressures[lateIndex]! - pressures[valleyIndex]!)),
    activePressureLateRiseMmHg: round(reboundForKey(ejection, activeKey, valleyIndex, lateIndex)),
    arterialPressureLateRiseMmHg: round(reboundForKey(ejection, arterialKey, valleyIndex, lateIndex)),
    outflowLateRiseMlPerSec: round(reboundForKey(ejection, flowKey, valleyIndex, lateIndex)),
    peakTheta: round(theta(ejection[peakIndex]!)),
    valleyTheta: round(theta(ejection[valleyIndex]!)),
    lateTheta: round(theta(ejection[lateIndex]!)),
  };
}

function emptyDomeDigest(sampleCount: number): DomeDigest {
  return {
    sampleCount,
    positiveCurvatureFraction: null,
    pressureDropAfterPeakMmHg: null,
    pressureLateRiseMmHg: null,
    activePressureLateRiseMmHg: null,
    arterialPressureLateRiseMmHg: null,
    outflowLateRiseMlPerSec: null,
    peakTheta: null,
    valleyTheta: null,
    lateTheta: null,
  };
}

function boundaryDigest(beat: readonly SimSample[], valve: "AoV" | "PV"): BoundaryReadbackDigest {
  const prefix = `${valve}_acceptedBoundary` as const;
  return {
    appliedFraction: round(fractionAtLeast(beat, `${prefix}Applied01` as keyof SimSample, 0.5)),
    statefulDutyFraction: round(fractionAtLeast(beat, `${prefix}StatefulV2Applied01` as keyof SimSample, 1e-6)),
    maxLossScale: roundNullable(maxNullable(beat.map((sample) => numericOrNull(sample, `${prefix}StatefulV2LossScale` as keyof SimSample)))),
    maxInertanceScale: roundNullable(maxNullable(beat.map((sample) => numericOrNull(sample, `${prefix}StatefulV2InertanceScale` as keyof SimSample)))),
    qDotClampHitFraction: round(fractionAtLeast(beat, `${prefix}QDotClampHit01` as keyof SimSample, 0.5)),
    diodeHitFraction: round(fractionNonZero(beat, `${prefix}DiodeImpulse` as keyof SimSample)),
    maxComplementarityResidualMlPerSec: roundNullable(maxNullable(
      beat.map((sample) => numericOrNull(sample, `${prefix}ComplementarityResidualMlPerSec` as keyof SimSample)),
    )),
  };
}

function summarizeVariant(variantId: VariantId, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variantId);
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  return {
    variantId,
    measuredCount: own.filter((result) => result.badges !== null).length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    grossPassCount: own.filter((result) => result.grossMorphologyOk).length,
    lvPvOkCount: badgeOkCount("lvPv"),
    rvPvOkCount: badgeOkCount("rvPv"),
    mvfOkCount: badgeOkCount("mvf"),
    tvfOkCount: badgeOkCount("tvf"),
    meanLvPositiveCurvatureFraction: roundNullable(meanNullable(own.map((result) => result.lvDome?.positiveCurvatureFraction ?? null))),
    meanRvPositiveCurvatureFraction: roundNullable(meanNullable(own.map((result) => result.rvDome?.positiveCurvatureFraction ?? null))),
    maxAoVStatefulDutyFraction: round(maxOrZero(own.map((result) => result.aovBoundary?.statefulDutyFraction ?? 0))),
    maxPVStatefulDutyFraction: round(maxOrZero(own.map((result) => result.pvBoundary?.statefulDutyFraction ?? 0))),
    maxAoVLossScale: roundNullable(maxNullable(own.map((result) => result.aovBoundary?.maxLossScale ?? null))),
    maxPVLossScale: roundNullable(maxNullable(own.map((result) => result.pvBoundary?.maxLossScale ?? null))),
  };
}

function classify(summaries: readonly VariantSummary[]): Evidence["classification"] {
  const baseline = requiredSummary(summaries, "baseline-pressure-flow");
  const measured = summaries.every((summary) => summary.measuredCount === POINTS.length);
  const candidates = summaries.filter((summary) => summary.variantId !== "baseline-pressure-flow");
  const bestGross = Math.max(...candidates.map((summary) => summary.grossPassCount));
  const bestLv = Math.max(...candidates.map((summary) => summary.lvPvOkCount));
  const bestRv = Math.max(...candidates.map((summary) => summary.rvPvOkCount));
  const nonRegressingFlowLead = candidates.some((summary) =>
    summary.lvPvOkCount >= baseline.lvPvOkCount
    && summary.rvPvOkCount >= baseline.rvPvOkCount
    && summary.mvfOkCount >= baseline.mvfOkCount
    && summary.tvfOkCount >= baseline.tvfOkCount
    && (summary.grossPassCount > baseline.grossPassCount || summary.lvPvOkCount > baseline.lvPvOkCount || summary.rvPvOkCount > baseline.rvPvOkCount)
  );
  return {
    decision: !measured
      ? "configuration-or-measurement-gap"
      : nonRegressingFlowLead
        ? "semilunar-contract-frontier-improves"
        : bestLv > baseline.lvPvOkCount || bestRv > baseline.rvPvOkCount || bestGross > baseline.grossPassCount
          ? "semilunar-contract-side-specific-partial"
          : "semilunar-contract-no-frontier-improvement",
    notes: [
      "This phase tests a structural semilunar pressure-flow/loss/inertance contract, not a post-hoc projection.",
      "A candidate must improve strict LV/RV PV dome badges without worsening MVF/TVF before any runtime/default discussion.",
      "LandAtrial tuning remains locked until LV/RV PV plus MVF/TVF morphology is robust under the strict checker.",
    ],
  };
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing summary ${variantId}.`);
  return summary;
}

function reboundForKey(samples: readonly SimSample[], key: keyof SimSample, valleyIndex: number, lateIndex: number): number {
  return numeric(samples[lateIndex]!, key) - numeric(samples[valleyIndex]!, key);
}

function positiveCurvatureFraction(values: readonly number[]): number {
  if (values.length < 3) return 0;
  const span = Math.max(...values) - Math.min(...values);
  const threshold = Math.max(span * 0.015, 0.25);
  let positive = 0;
  let total = 0;
  for (let i = 1; i < values.length - 1; i++) {
    const second = values[i + 1]! - 2 * values[i]! + values[i - 1]!;
    if (second > threshold) positive++;
    total++;
  }
  return total > 0 ? positive / total : 0;
}

function theta(sample: SimSample): number {
  return ((sample.phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI);
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numericOrNull(sample: SimSample, key: keyof SimSample): number | null {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function indexOfMax(values: readonly number[]): number {
  return values.reduce((best, value, index) => value > values[best]! ? index : best, 0);
}

function indexOfMin(values: readonly number[]): number {
  return values.reduce((best, value, index) => value < values[best]! ? index : best, 0);
}

function fractionAtLeast(samples: readonly SimSample[], key: keyof SimSample, threshold: number): number {
  if (samples.length === 0) return 0;
  return samples.filter((sample) => numeric(sample, key) >= threshold).length / samples.length;
}

function fractionNonZero(samples: readonly SimSample[], key: keyof SimSample): number {
  if (samples.length === 0) return 0;
  return samples.filter((sample) => Math.abs(numeric(sample, key)) > 1e-9).length / samples.length;
}

function meanNullable(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function maxNullable(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return finite.length > 0 ? Math.max(...finite) : null;
}

function maxOrZero(values: readonly number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
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
  const evidence = writeSystolicOutflowContractPhase5DOEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    variantSummaries: evidence.variantSummaries,
  }, null, 2));
}
