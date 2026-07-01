import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  calciumScaledLand2017LvSourceOnlyProvider,
  calciumScaledLand2017RvSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvPressureSourceMode,
  type ModelCoreLand2017LvSourceStressPressureAdapterMode,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
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

export const SOURCE_PRESSURE_OWNERSHIP_PHASE5DP_ID =
  "source-pressure-ownership-phase5dp-result-v1" as const;
export const SOURCE_PRESSURE_OWNERSHIP_PHASE5DP_RESULT_PATH =
  "data/myocardium/protocols/source-pressure-ownership-phase5dp-result-v1.json" as const;

type PointId = "normal-hr75" | "contractility-low-hr75";
type VariantId =
  | "baseline-pressure-flow"
  | "transition-tension-filter-pressure-flow"
  | "transition-committed-output-pressure-flow"
  | "transition-tension-filter-av-v2-semilunar-v2";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly sourcePressureOwnership: string;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type DomeDigest = {
  readonly sampleCount: number;
  readonly positiveCurvatureFraction: number | null;
  readonly pressureDropAfterPeakMmHg: number | null;
  readonly pressureLateRiseMmHg: number | null;
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
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof SOURCE_PRESSURE_OWNERSHIP_PHASE5DP_ID;
  readonly phase: "5DP";
  readonly objective:
    "screen existing source-state and valve-boundary ownership surfaces under strict morphology V1.1 before adding another engine contract";
  readonly points: readonly PointSpec[];
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: {
    readonly decision:
      | "lightweight-source-pressure-surface-improves-frontier"
      | "lightweight-source-pressure-surface-no-go"
      | "configuration-or-measurement-gap";
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noQdotRootZcValveThresholdTrefSourceStressTuning: true;
    readonly noPermanentVerifierAdded: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
];

export function buildSourcePressureOwnershipPhase5DPEvidence(): Evidence {
  const variants = buildVariants();
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant.id, results));
  const classification = classify(variantSummaries);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: SOURCE_PRESSURE_OWNERSHIP_PHASE5DP_ID,
    phase: "5DP",
    objective:
      "screen existing source-state and valve-boundary ownership surfaces under strict morphology V1.1 before adding another engine contract",
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
      noPermanentVerifierAdded: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return { ...evidenceWithoutHash, normalizedSha256: hashStable(evidenceWithoutHash) };
}

export function writeSourcePressureOwnershipPhase5DPEvidence(): Evidence {
  const evidence = buildSourcePressureOwnershipPhase5DPEvidence();
  const outPath = path.resolve(process.cwd(), SOURCE_PRESSURE_OWNERSHIP_PHASE5DP_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function buildVariants(): readonly VariantSpec[] {
  return [
    variant("baseline-pressure-flow", "Phase 5DO baseline inlet-held user0 pressure-flow frontier", {
      sourcePressureOwnership: "AV pressure-flow only; no source-state residual recomputation",
      avValveBoundaryMode: "accepted-state-valve-pressure-flow",
      avValveBoundaryTargetValves: ["MV", "TV"],
    }),
    variant("transition-tension-filter-pressure-flow", "Transition-gated tension-state source pressure with AV pressure-flow", {
      sourcePressureOwnership: "Use the provider tension state only during valve handoff/ejection transition windows",
      avValveBoundaryMode: "accepted-state-valve-pressure-flow",
      avValveBoundaryTargetValves: ["MV", "TV"],
      providerAdapterMode: "transition-gated-tension-filter-v1",
    }),
    variant("transition-committed-output-pressure-flow", "Transition-gated committed Land output with AV pressure-flow", {
      sourcePressureOwnership: "Use the last committed Land source output only during valve handoff/ejection transition windows",
      avValveBoundaryMode: "accepted-state-valve-pressure-flow",
      avValveBoundaryTargetValves: ["MV", "TV"],
      pressureSourceMode: "transition-gated-committed-output-v1",
    }),
    variant("transition-tension-filter-av-v2-semilunar-v2", "Transition-gated tension-state pressure plus AV/semilunar V2", {
      sourcePressureOwnership: "Combine the lightweight source-pressure adapter with the 5DM/5DO valve-law component lead",
      avValveBoundaryMode: "accepted-state-valve-pressure-flow-stateful-v2",
      avValveBoundaryTargetValves: ["TV"],
      semilunarValveBoundaryMode: "accepted-state-valve-pressure-flow-stateful-v2",
      semilunarValveBoundaryTargetValves: ["AoV", "PV"],
      providerAdapterMode: "transition-gated-tension-filter-v1",
    }),
  ];
}

function variant(
  id: VariantId,
  label: string,
  input: Partial<NonNullable<ModelCoreExperimentalOptions["ventricularChamberTransactionStep"]>> & {
    readonly sourcePressureOwnership: string;
    readonly pressureSourceMode?: ModelCoreLand2017LvPressureSourceMode;
    readonly providerAdapterMode?: ModelCoreLand2017LvSourceStressPressureAdapterMode;
  },
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const baseOptions = withAtrialAvPlaneOverride(resolved.experimentalOptions, {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  });
  const { sourcePressureOwnership, pressureSourceMode, providerAdapterMode, ...tx } = input;
  const activeSourceProviders = pressureSourceMode || providerAdapterMode
    ? {
      ...(baseOptions.activeSourceProviders ?? {}),
      ...ventricularProviderOverride(id, { pressureSourceMode, providerAdapterMode }),
    }
    : baseOptions.activeSourceProviders;
  return {
    id,
    label,
    sourcePressureOwnership,
    experimentalOptions: {
      ...baseOptions,
      activeSourceProviders,
      ventricularChamberTransactionStep: {
        mechanismId: `phase5dp-${id}`,
        iterations: 4,
        relaxation: 0.7,
        providerStateCouplingChambers: ["LV", "RV"],
        includeAdjacentLoadNodes: true,
        avValveBoundaryPressureRefitIterations: 2,
        avValveBoundaryPressureRefitRelaxation: 1,
        avValveBoundaryStatefulClosingLossGain: 12,
        avValveBoundaryStatefulClosingInertanceGain: 4,
        semilunarValveBoundaryMode: "current",
        semilunarValveBoundaryPressureRefitIterations: 2,
        semilunarValveBoundaryPressureRefitRelaxation: 0.8,
        semilunarValveBoundaryStatefulClosingLossGain: 8,
        semilunarValveBoundaryStatefulClosingInertanceGain: 3,
        ...tx,
        avValveBoundaryMode: tx.avValveBoundaryMode ?? "accepted-state-valve-pressure-flow",
      },
    },
  };
}

function ventricularProviderOverride(
  id: VariantId,
  options: {
    readonly pressureSourceMode?: ModelCoreLand2017LvPressureSourceMode;
    readonly providerAdapterMode?: ModelCoreLand2017LvSourceStressPressureAdapterMode;
  },
): NonNullable<ModelCoreExperimentalOptions["activeSourceProviders"]> {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  return {
    LV: calciumScaledLand2017LvSourceOnlyProvider(lvInstrumentation, {
      commitScheme: "BE",
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "source",
      pressureSourceMode: options.pressureSourceMode,
      sourceStressPressureAdapterMode: options.providerAdapterMode,
      sourceStressTensionRiseSec: 0.024,
      sourceStressTensionFallSec: 0.060,
      sourceProviderId: `phase5dp-${id}:LV`,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
    }),
    RV: calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
      commitScheme: "BE",
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "source",
      pressureSourceMode: options.pressureSourceMode,
      sourceStressPressureAdapterMode: options.providerAdapterMode,
      sourceStressTensionRiseSec: 0.024,
      sourceStressTensionFallSec: 0.060,
      sourceProviderId: `phase5dp-${id}:RV`,
      calciumScale,
      calciumInputMultiplier: "tmax-contractility-user-control",
      calciumInputMultiplierReference: defaultParams().rvTmaxScale * defaultParams().contractility,
    }),
  };
}

function withAtrialAvPlaneOverride(
  experimentalOptions: ModelCoreExperimentalOptions,
  activeOverride: Record<string, number>,
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
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossMorphologyOk: badges?.lvPv === "ok" && badges.rvPv === "ok" && badges.mvf === "ok" && badges.tvf === "ok",
      badges,
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
      grossMorphologyOk: false,
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
  const flowMax = Math.max(0, ...beat.map((sample) => numeric(sample, flowKey)));
  const ejection = beat.filter((sample) => numeric(sample, flowKey) > Math.max(10, 0.08 * flowMax));
  if (ejection.length < 8) return { sampleCount: ejection.length, positiveCurvatureFraction: null, pressureDropAfterPeakMmHg: null, pressureLateRiseMmHg: null };
  const pressures = ejection.map((sample) => numeric(sample, pressureKey));
  const peakIndex = indexOfMax(pressures);
  const tail = ejection.slice(peakIndex);
  const valleyIndex = peakIndex + indexOfMin(tail.map((sample) => numeric(sample, pressureKey)));
  const lateIndex = valleyIndex + indexOfMax(ejection.slice(valleyIndex).map((sample) => numeric(sample, pressureKey)));
  return {
    sampleCount: ejection.length,
    positiveCurvatureFraction: round(positiveCurvatureFraction(pressures)),
    pressureDropAfterPeakMmHg: round(Math.max(0, pressures[peakIndex]! - pressures[valleyIndex]!)),
    pressureLateRiseMmHg: round(Math.max(0, pressures[lateIndex]! - pressures[valleyIndex]!)),
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
    meanLvPositiveCurvatureFraction: meanNullable(own.map((result) => result.lvDome?.positiveCurvatureFraction ?? null)),
    meanRvPositiveCurvatureFraction: meanNullable(own.map((result) => result.rvDome?.positiveCurvatureFraction ?? null)),
  };
}

function classify(summaries: readonly VariantSummary[]): Evidence["classification"] {
  const baseline = requiredSummary(summaries, "baseline-pressure-flow");
  const best = summaries
    .filter((summary) => summary.variantId !== "baseline-pressure-flow")
    .sort((a, b) =>
      b.grossPassCount - a.grossPassCount
      || b.lvPvOkCount - a.lvPvOkCount
      || b.rvPvOkCount - a.rvPvOkCount
      || b.mvfOkCount - a.mvfOkCount
      || b.tvfOkCount - a.tvfOkCount
    )[0];
  const improves = best
    && (
      best.grossPassCount > baseline.grossPassCount
      || best.lvPvOkCount > baseline.lvPvOkCount
      || best.rvPvOkCount > baseline.rvPvOkCount
    );
  const measuredOk = summaries.every((summary) => summary.measuredCount === POINTS.length);
  return {
    decision: !measuredOk
      ? "configuration-or-measurement-gap"
      : improves
        ? "lightweight-source-pressure-surface-improves-frontier"
        : "lightweight-source-pressure-surface-no-go",
    notes: [
      `Baseline gross/LV/RV/MVF/TVF: ${formatSummary(baseline)}.`,
      best ? `Best candidate ${best.variantId} gross/LV/RV/MVF/TVF: ${formatSummary(best)}.` : "No candidate summary available.",
      "This screen intentionally uses a two-point smoke before paying for a broader envelope.",
    ],
  };
}

function formatSummary(summary: VariantSummary): string {
  return `${summary.grossPassCount}/${POINTS.length},${summary.lvPvOkCount}/${POINTS.length},${summary.rvPvOkCount}/${POINTS.length},${summary.mvfOkCount}/${POINTS.length},${summary.tvfOkCount}/${POINTS.length}`;
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((candidate) => candidate.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5DP variant summary ${id}.`);
  return summary;
}

function positiveCurvatureFraction(values: readonly number[]): number {
  let positive = 0;
  let total = 0;
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i + 1]! - 2 * values[i]! + values[i - 1]! > 0) positive++;
    total++;
  }
  return total > 0 ? positive / total : 0;
}

function indexOfMax(values: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i]! > values[best]!) best = i;
  return best;
}

function indexOfMin(values: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i]! < values[best]!) best = i;
  return best;
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function meanNullable(values: readonly (number | null)[]): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return finite.length > 0 ? round(finite.reduce((sum, value) => sum + value, 0) / finite.length) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeSourcePressureOwnershipPhase5DPEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    phase: evidence.phase,
    classification: evidence.classification,
    variantSummaries: evidence.variantSummaries,
    normalizedSha256: evidence.normalizedSha256,
  }, null, 2));
}
