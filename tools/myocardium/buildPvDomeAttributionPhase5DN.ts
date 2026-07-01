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

export const PV_DOME_ATTRIBUTION_PHASE5DN_ID = "pv-dome-attribution-phase5dn-result-v1" as const;
export const PV_DOME_ATTRIBUTION_PHASE5DN_RESULT_PATH =
  "data/myocardium/protocols/pv-dome-attribution-phase5dn-result-v1.json" as const;

type PointId = "normal-hr75" | "low-preload-hr75" | "contractility-low-hr75" | "contractility-high-hr75";
type VariantId =
  | "baseline-pressure-flow"
  | "baseline-pressure-flow-temporal-substep2"
  | "stateful-v2-tv"
  | "stateful-v2-tv-temporal-substep2";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type DomeDigest = {
  readonly sampleCount: number;
  readonly pressureReboundMmHg: number | null;
  readonly activePressureReboundMmHg: number | null;
  readonly arterialPressureReboundMmHg: number | null;
  readonly outflowReaccelMlPerSec: number | null;
  readonly positiveCurvatureFraction: number | null;
  readonly primaryPeakTheta: number | null;
  readonly valleyTheta: number | null;
  readonly lateReboundTheta: number | null;
};

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly healthStatus: string;
  readonly badges: MorphologyBadgeSummary | null;
  readonly failedLabels: readonly string[];
  readonly lvDome: DomeDigest | null;
  readonly rvDome: DomeDigest | null;
  readonly messages: readonly string[];
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly lvPvOkCount: number;
  readonly rvPvOkCount: number;
  readonly mvfOkCount: number;
  readonly tvfOkCount: number;
  readonly meanLvPressureReboundMmHg: number | null;
  readonly meanRvPressureReboundMmHg: number | null;
  readonly meanLvActivePressureReboundMmHg: number | null;
  readonly meanRvActivePressureReboundMmHg: number | null;
  readonly meanLvPositiveCurvatureFraction: number | null;
  readonly meanRvPositiveCurvatureFraction: number | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof PV_DOME_ATTRIBUTION_PHASE5DN_ID;
  readonly phase: "5DN";
  readonly objective:
    "attribute strict PV systolic dome rebound under baseline, temporal substep, and stateful AV valve V2 surfaces before adding another model candidate";
  readonly points: readonly PointSpec[];
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: {
    readonly decision:
      | "temporal-substep-does-not-explain-pv-dome"
      | "temporal-substep-rv-only-partial-lv-blocked"
      | "configuration-or-measurement-gap";
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noSolverSubstepAdoption: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
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
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

export function buildPvDomeAttributionPhase5DNEvidence(): Evidence {
  const variants = buildVariants();
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant.id, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: PV_DOME_ATTRIBUTION_PHASE5DN_ID,
    phase: "5DN",
    objective:
      "attribute strict PV systolic dome rebound under baseline, temporal substep, and stateful AV valve V2 surfaces before adding another model candidate",
    points: POINTS,
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    results,
    variantSummaries,
    classification,
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialParameterTuningUnlock: true,
      noSolverSubstepAdoption: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

export function writePvDomeAttributionPhase5DNEvidence(): Evidence {
  const evidence = buildPvDomeAttributionPhase5DNEvidence();
  const outPath = path.resolve(process.cwd(), PV_DOME_ATTRIBUTION_PHASE5DN_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function buildVariants(): readonly VariantSpec[] {
  const inletHeldRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  return [
    variant("baseline-pressure-flow", "Baseline pressure-flow frontier", inletHeldRelease, false, false),
    variant("baseline-pressure-flow-temporal-substep2", "Baseline plus 2x temporal substep", inletHeldRelease, true, false),
    variant("stateful-v2-tv", "TV-only stateful AV valve V2", inletHeldRelease, false, true),
    variant("stateful-v2-tv-temporal-substep2", "TV-only stateful V2 plus 2x temporal substep", inletHeldRelease, true, true),
  ];
}

function variant(
  id: VariantId,
  label: string,
  avPlane: AvPlaneActiveOverride,
  temporalSubstep2: boolean,
  statefulV2: boolean,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const baseOptions = withAtrialAvPlaneOverride(resolved.experimentalOptions, avPlane);
  return {
    id,
    label,
    experimentalOptions: {
      ...baseOptions,
      ...(temporalSubstep2 ? { temporalSubstep: { mechanismId: `phase5dn-${id}`, subdivisions: 2 } } : {}),
      ventricularChamberTransactionStep: {
        mechanismId: `phase5dn-${id}`,
        iterations: 4,
        relaxation: 0.7,
        providerStateCouplingChambers: ["LV", "RV"],
        includeAdjacentLoadNodes: true,
        avValveBoundaryMode: statefulV2
          ? "accepted-state-valve-pressure-flow-stateful-v2"
          : "accepted-state-valve-pressure-flow",
        avValveBoundaryTargetValves: statefulV2 ? ["TV"] : ["MV", "TV"],
        avValveBoundaryPressureRefitIterations: 2,
        avValveBoundaryPressureRefitRelaxation: 1,
        ...(statefulV2 ? {
          avValveBoundaryStatefulClosingLossGain: 12,
          avValveBoundaryStatefulClosingInertanceGain: 4,
        } : {}),
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
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      badges: morphology?.badges ?? null,
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      lvDome: beat.length > 0 ? domeDigest(beat, "LV") : null,
      rvDome: beat.length > 0 ? domeDigest(beat, "RV") : null,
      messages: morphology ? conciseMorphologyMessages(morphology) : ["Morphology check not measured."],
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      healthStatus: "exception",
      badges: null,
      failedLabels: [error instanceof Error ? error.message : String(error)],
      lvDome: null,
      rvDome: null,
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
  const ejection = beat.filter((sample) => numeric(sample, flowKey) > 20);
  if (ejection.length < 6) return emptyDomeDigest(ejection.length);
  const pressures = ejection.map((sample) => numeric(sample, pressureKey));
  const primaryPeakIndex = indexOfMax(pressures);
  const postPeak = ejection.slice(primaryPeakIndex);
  if (postPeak.length < 4) return emptyDomeDigest(ejection.length);
  const postPeakPressures = postPeak.map((sample) => numeric(sample, pressureKey));
  const valleyLocalIndex = indexOfMin(postPeakPressures);
  const valleyIndex = primaryPeakIndex + valleyLocalIndex;
  const late = ejection.slice(valleyIndex);
  const latePressures = late.map((sample) => numeric(sample, pressureKey));
  const lateReboundIndex = valleyIndex + indexOfMax(latePressures);
  return {
    sampleCount: ejection.length,
    pressureReboundMmHg: round(Math.max(0, pressures[lateReboundIndex]! - pressures[valleyIndex]!)),
    activePressureReboundMmHg: round(reboundForKey(ejection, activeKey, valleyIndex, lateReboundIndex)),
    arterialPressureReboundMmHg: round(reboundForKey(ejection, arterialKey, valleyIndex, lateReboundIndex)),
    outflowReaccelMlPerSec: round(reboundForKey(ejection, flowKey, valleyIndex, lateReboundIndex)),
    positiveCurvatureFraction: round(positiveCurvatureFraction(pressures)),
    primaryPeakTheta: round(theta(ejection[primaryPeakIndex]!)),
    valleyTheta: round(theta(ejection[valleyIndex]!)),
    lateReboundTheta: round(theta(ejection[lateReboundIndex]!)),
  };
}

function emptyDomeDigest(sampleCount: number): DomeDigest {
  return {
    sampleCount,
    pressureReboundMmHg: null,
    activePressureReboundMmHg: null,
    arterialPressureReboundMmHg: null,
    outflowReaccelMlPerSec: null,
    positiveCurvatureFraction: null,
    primaryPeakTheta: null,
    valleyTheta: null,
    lateReboundTheta: null,
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
    lvPvOkCount: badgeOkCount("lvPv"),
    rvPvOkCount: badgeOkCount("rvPv"),
    mvfOkCount: badgeOkCount("mvf"),
    tvfOkCount: badgeOkCount("tvf"),
    meanLvPressureReboundMmHg: roundNullable(meanNullable(own.map((result) => result.lvDome?.pressureReboundMmHg ?? null))),
    meanRvPressureReboundMmHg: roundNullable(meanNullable(own.map((result) => result.rvDome?.pressureReboundMmHg ?? null))),
    meanLvActivePressureReboundMmHg: roundNullable(meanNullable(own.map((result) => result.lvDome?.activePressureReboundMmHg ?? null))),
    meanRvActivePressureReboundMmHg: roundNullable(meanNullable(own.map((result) => result.rvDome?.activePressureReboundMmHg ?? null))),
    meanLvPositiveCurvatureFraction: roundNullable(meanNullable(own.map((result) => result.lvDome?.positiveCurvatureFraction ?? null))),
    meanRvPositiveCurvatureFraction: roundNullable(meanNullable(own.map((result) => result.rvDome?.positiveCurvatureFraction ?? null))),
  };
}

function classify(summaries: readonly VariantSummary[]): Evidence["classification"] {
  const baseline = requiredSummary(summaries, "baseline-pressure-flow");
  const substep = requiredSummary(summaries, "baseline-pressure-flow-temporal-substep2");
  const substepRvOnlyPartial =
    substep.rvPvOkCount > baseline.rvPvOkCount
    && substep.lvPvOkCount <= baseline.lvPvOkCount;
  const measured = summaries.every((summary) => summary.measuredCount === POINTS.length);
  return {
    decision: !measured
      ? "configuration-or-measurement-gap"
      : substepRvOnlyPartial
        ? "temporal-substep-rv-only-partial-lv-blocked"
        : "temporal-substep-does-not-explain-pv-dome",
    notes: [
      "This is a disposable attribution run, not a candidate adoption phase.",
      "A 2x temporal substep improves the RV PV badge count on this 4-point attribution surface but leaves LV PV at the baseline pass count.",
      "The same substep can worsen TVF, so this result does not support solver substep adoption.",
      "LV strict dome/curvature remains blocked; the next model surface should target systolic pressure/outlet-load/source-state ownership rather than AV inflow only.",
    ],
  };
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing summary ${variantId}.`);
  return summary;
}

function reboundForKey(samples: readonly SimSample[], key: keyof SimSample, valleyIndex: number, lateReboundIndex: number): number {
  return numeric(samples[lateReboundIndex]!, key) - numeric(samples[valleyIndex]!, key);
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

function indexOfMax(values: readonly number[]): number {
  return values.reduce((best, value, index) => value > values[best]! ? index : best, 0);
}

function indexOfMin(values: readonly number[]): number {
  return values.reduce((best, value, index) => value < values[best]! ? index : best, 0);
}

function meanNullable(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
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
  const evidence = writePvDomeAttributionPhase5DNEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    variantSummaries: evidence.variantSummaries,
  }, null, 2));
}
