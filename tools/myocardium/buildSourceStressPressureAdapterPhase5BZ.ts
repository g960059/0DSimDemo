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
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  resolveModelCoreRuntimeRootZc,
} from "@/engine/myocardium/runtimeRootZc";
import type { CoreRuntimeParams, SimMetrics, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const SOURCE_STRESS_PRESSURE_ADAPTER_PHASE5BZ_ID =
  "source-stress-pressure-adapter-phase5bz-result-v1" as const;
export const SOURCE_STRESS_PRESSURE_ADAPTER_PHASE5BZ_RESULT_PATH =
  "data/myocardium/protocols/source-stress-pressure-adapter-phase5bz-result-v1.json" as const;

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
  | "legacy-frozen-reference"
  | "current-user0-default"
  | "source-filter-medium-legacy-atria"
  | "temporal-substep2-user0"
  | "source-filter-medium-legacy-atria-substep2";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly closurePath:
    | "legacy-active-stress"
    | "current-user0-all-chamber-landatrial"
    | "lv-rv-land-legacy-atria";
  readonly sourceStressPressureAdapter: null | {
    readonly mode: "tension-state-filter-v1";
    readonly riseSec: number;
    readonly fallSec: number;
  };
  readonly graphCoupledStep: null | {
    readonly mechanismId: string;
    readonly iterations: number;
    readonly relaxation: number;
  };
  readonly temporalSubstep: null | {
    readonly mechanismId: string;
    readonly subdivisions: number;
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
  readonly instrumentationByChamber: {
    readonly LV?: ModelCoreLand2017LvSourceProviderInstrumentation;
    readonly RV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  };
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type PointResult = {
  readonly variantId: VariantId;
  readonly pointId: PointId;
  readonly settled: boolean;
  readonly settleReason: SettleStatus["reason"] | "exception";
  readonly healthStatus: SimulationHealth["status"] | "exception";
  readonly grossVentricularMorphologyOk: boolean;
  readonly morphologyStatus: MorphologyCheckSummary["status"] | "not-measured";
  readonly failedLabels: readonly string[];
  readonly badges: MorphologyBadgeSummary | null;
  readonly metrics: MetricDigest | null;
  readonly landSolveFailures: Readonly<Record<"LV" | "RV", number | null>>;
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
  readonly firstFailedPoint: PointId | null;
  readonly failedPointIds: readonly PointId[];
  readonly outputPreservedCount: number;
  readonly totalLandSolveFailures: number;
};

type Classification = {
  readonly currentUser0GrossPass: string;
  readonly bestSourceAdapterVariant: string;
  readonly bestTemporalSubstepVariant: string;
  readonly sourceStressAdapterDecision:
    | "supported-for-user0-runtime-default"
    | "partial-structural-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof SOURCE_STRESS_PRESSURE_ADAPTER_PHASE5BZ_ID;
  readonly phase: "5BZ";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions" | "instrumentationByChamber">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoptionUnlessFullEnvelopePass: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialPhysiologyAcceptance: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "normal-hr90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
  { id: "high-preload-hr75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 0.8 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.8 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.2 } },
];

export function buildSourceStressPressureAdapterPhase5BZEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    sourceFilterLegacyAtriaVariant(),
    temporalSubstepUser0Variant({
      id: "temporal-substep2-user0",
      label: "Current user-0 closure with 2x temporal substep",
      hypothesis: "Tests whether valve/load/chamber pressure transition artifacts are primarily solver-step excitation.",
      subdivisions: 2,
    }),
    sourceFilterLegacyAtriaVariant({ temporalSubdivisions: 2 }),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variants, variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: SOURCE_STRESS_PRESSURE_ADAPTER_PHASE5BZ_ID,
    phase: "5BZ",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      grossGate:
        "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, instrumentationByChamber: _instrumentationByChamber, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoptionUnlessFullEnvelopePass: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialPhysiologyAcceptance: true,
      noA1A2Reopen: true,
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  return {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
}

function legacyVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({ mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE });
  return {
    id: "legacy-frozen-reference",
    label: "Frozen legacy active-stress rollback/reference",
    hypothesis: "Reference for gross raw morphology across the same representative envelope.",
    closurePath: "legacy-active-stress",
    sourceStressPressureAdapter: null,
    graphCoupledStep: null,
    temporalSubstep: null,
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {},
  };
}

function currentUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const instrumentationByChamber = resolved.instrumentationByChamber as Partial<
    Record<"LV" | "RV", ModelCoreLand2017LvSourceProviderInstrumentation>
  >;
  return {
    id: "current-user0-default",
    label: "Current user-0 staged all-chamber LandAtrial default",
    hypothesis: "Records the current live raw morphology failure surface.",
    closurePath: "current-user0-all-chamber-landatrial",
    sourceStressPressureAdapter: null,
    graphCoupledStep: null,
    temporalSubstep: null,
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function sourceFilterLegacyAtriaVariant(input: { readonly temporalSubdivisions?: number } = {}): VariantSpec {
  const { providers, instrumentationByChamber } = filteredVentricularProviders(
    input.temporalSubdivisions
      ? `phase5bz-source-filter-medium-legacy-atria-substep${input.temporalSubdivisions}`
      : "phase5bz-source-filter-medium-legacy-atria",
    0.030,
    0.075,
  );
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
  });
  const temporalSubstep = input.temporalSubdivisions
    ? {
      mechanismId: `temporal-substep-v1:phase5bz-source-filter-medium-legacy-atria-substep${input.temporalSubdivisions}`,
      subdivisions: input.temporalSubdivisions,
    }
    : null;
  return {
    id: input.temporalSubdivisions
      ? "source-filter-medium-legacy-atria-substep2"
      : "source-filter-medium-legacy-atria",
    label: input.temporalSubdivisions
      ? "LV/RV Land source-stress tension filter with legacy atria plus 2x temporal substep"
      : "LV/RV Land source-stress tension filter with legacy atria",
    hypothesis: input.temporalSubdivisions
      ? "Tests whether legacy-atria residual AV inflow failures are numerical valve/load temporal-resolution artifacts."
      : "Separates ventricular pressure-adapter filtering from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    sourceStressPressureAdapter: {
      mode: "tension-state-filter-v1",
      riseSec: 0.030,
      fallSec: 0.075,
    },
    graphCoupledStep: null,
    temporalSubstep,
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders: providers,
      ...(temporalSubstep ? { temporalSubstep } : {}),
    },
    instrumentationByChamber,
  };
}

function temporalSubstepUser0Variant(input: {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly subdivisions: number;
}): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const instrumentationByChamber = resolved.instrumentationByChamber as Partial<
    Record<"LV" | "RV", ModelCoreLand2017LvSourceProviderInstrumentation>
  >;
  const temporalSubstep = {
    mechanismId: `temporal-substep-v1:phase5bz-${input.id}`,
    subdivisions: input.subdivisions,
  };
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "current-user0-all-chamber-landatrial",
    sourceStressPressureAdapter: null,
    graphCoupledStep: null,
    temporalSubstep,
    experimentalOptions: {
      ...resolved.experimentalOptions,
      temporalSubstep,
    },
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function filteredVentricularProviders(
  idPrefix: string,
  riseSec: number,
  fallSec: number,
): {
  readonly providers: NonNullable<ModelCoreExperimentalOptions["activeSourceProviders"]>;
  readonly instrumentationByChamber: {
    readonly LV: ModelCoreLand2017LvSourceProviderInstrumentation;
    readonly RV: ModelCoreLand2017LvSourceProviderInstrumentation;
  };
} {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  return {
    providers: {
      LV: calciumScaledLand2017LvSourceOnlyProvider(lvInstrumentation, {
        commitScheme: "BE",
        kinematicsMode: "raw-wall-lambda",
        velocityLengthCouplingMode: "source",
        sourceStressPressureAdapterMode: "tension-state-filter-v1",
        sourceStressTensionRiseSec: riseSec,
        sourceStressTensionFallSec: fallSec,
        sourceProviderId: `${idPrefix}:LV`,
        calciumScale,
        calciumInputMultiplier: "tmax-contractility-user-control",
        calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
      }),
      RV: calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
        commitScheme: "BE",
        kinematicsMode: "raw-wall-lambda",
        velocityLengthCouplingMode: "source",
        sourceStressPressureAdapterMode: "tension-state-filter-v1",
        sourceStressTensionRiseSec: riseSec,
        sourceStressTensionFallSec: fallSec,
        sourceProviderId: `${idPrefix}:RV`,
        calciumScale,
        calciumInputMultiplier: "tmax-contractility-user-control",
        calciumInputMultiplierReference: defaultParams().rvTmaxScale * defaultParams().contractility,
      }),
    },
    instrumentationByChamber: {
      LV: lvInstrumentation,
      RV: rvInstrumentation,
    },
  };
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
    const grossVentricularMorphologyOk = Boolean(
      morphology?.badges.lvPv === "ok"
      && morphology.badges.rvPv === "ok"
      && morphology.badges.mvf === "ok"
      && morphology.badges.tvf === "ok",
    );
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: settle.settleStatus.settled,
      settleReason: settle.settleStatus.reason,
      healthStatus: measurement?.health.status ?? settle.core.health().status,
      grossVentricularMorphologyOk,
      morphologyStatus: morphology?.status ?? "not-measured",
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      badges: morphology?.badges ?? null,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      landSolveFailures: landSolveFailures(variant),
      errorMessage: null,
    };
  } catch (error) {
    return {
      variantId: variant.id,
      pointId: point.id,
      settled: false,
      settleReason: "exception",
      healthStatus: "exception",
      grossVentricularMorphologyOk: false,
      morphologyStatus: "not-measured",
      failedLabels: [error instanceof Error ? error.message : String(error)],
      badges: null,
      metrics: null,
      landSolveFailures: landSolveFailures(variant),
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
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

function landSolveFailures(variant: VariantSpec): Readonly<Record<"LV" | "RV", number | null>> {
  return {
    LV: variant.instrumentationByChamber.LV?.landSolveFailureCount ?? null,
    RV: variant.instrumentationByChamber.RV?.landSolveFailureCount ?? null,
  };
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const failures = own.filter((result) =>
    !result.grossVentricularMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  return {
    variantId: variant.id,
    grossPassCount: own.filter((result) =>
      result.grossVentricularMorphologyOk && result.settled && result.healthStatus === "ok"
    ).length,
    measuredCount: own.filter((result) => result.morphologyStatus !== "not-measured").length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    lvPvOkCount: badgeOkCount("lvPv"),
    rvPvOkCount: badgeOkCount("rvPv"),
    mvfOkCount: badgeOkCount("mvf"),
    tvfOkCount: badgeOkCount("tvf"),
    firstFailedPoint: failures[0]?.pointId ?? null,
    failedPointIds: failures.map((result) => result.pointId),
    outputPreservedCount: own.filter((result) =>
      result.metrics
      && result.metrics.CO_L > 3.5
      && result.metrics.CO_L < 7.5
      && result.metrics.CO_R > 3.5
      && result.metrics.CO_R < 7.5
    ).length,
    totalLandSolveFailures: own.reduce((acc, result) =>
      acc + (result.landSolveFailures.LV ?? 0) + (result.landSolveFailures.RV ?? 0), 0),
  };
}

function classify(
  variants: readonly VariantSpec[],
  summaries: readonly VariantSummary[],
  results: readonly PointResult[],
): Classification {
  const current = requiredSummary(summaries, "current-user0-default");
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const sourceAdapterCandidates = summaries.filter((summary) =>
    Boolean(variantById.get(summary.variantId)?.sourceStressPressureAdapter)
  );
  const temporalSubstepCandidates = summaries.filter((summary) =>
    Boolean(variantById.get(summary.variantId)?.temporalSubstep)
  );
  const bestSourceAdapter = bestSummary(sourceAdapterCandidates);
  const bestTemporalSubstep = bestSummary(temporalSubstepCandidates);
  const currentNormal = requiredResult(results, "current-user0-default", "normal-hr75");
  const bestSourceAdapterNormal = bestSourceAdapter ? requiredResult(results, bestSourceAdapter.variantId, "normal-hr75") : null;
  const fullPass = bestSourceAdapter?.grossPassCount === POINTS.length && bestSourceAdapter.settledOkCount === POINTS.length;
  const partialSignal = Boolean(bestSourceAdapter && bestSourceAdapter.grossPassCount > current.grossPassCount);
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    bestSourceAdapterVariant: bestSourceAdapter
      ? `${bestSourceAdapter.variantId}:${bestSourceAdapter.grossPassCount}/${POINTS.length}`
      : "none",
    bestTemporalSubstepVariant: bestTemporalSubstep
      ? `${bestTemporalSubstep.variantId}:${bestTemporalSubstep.grossPassCount}/${POINTS.length}`
      : "none",
    sourceStressAdapterDecision: fullPass
      ? "supported-for-user0-runtime-default"
      : partialSignal
        ? "partial-structural-signal"
        : "not-supported",
    notes: [
      `Current user-0 normal failed labels: ${currentNormal.failedLabels.join(", ") || "none"}.`,
      `Best source-adapter normal failed labels: ${bestSourceAdapterNormal?.failedLabels.join(", ") || "none"}.`,
      `Best source-adapter gross pass count: ${bestSourceAdapter?.grossPassCount ?? 0}/${POINTS.length}.`,
      `Best temporal-substep gross pass count: ${bestTemporalSubstep?.grossPassCount ?? 0}/${POINTS.length}.`,
      "Source-stress adapter adoption requires full representative morphology envelope pass, not pressure smoothing or temporal substepping alone.",
    ],
  };
}

function bestSummary(summaries: readonly VariantSummary[]): VariantSummary | null {
  return [...summaries].sort((a, b) => {
    const gross = b.grossPassCount - a.grossPassCount;
    if (gross !== 0) return gross;
    const badges =
      (b.lvPvOkCount + b.rvPvOkCount + b.mvfOkCount + b.tvfOkCount)
      - (a.lvPvOkCount + a.rvPvOkCount + a.mvfOkCount + a.tvfOkCount);
    if (badges !== 0) return badges;
    return b.outputPreservedCount - a.outputPreservedCount;
  })[0] ?? null;
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.sourceStressAdapterDecision === "supported-for-user0-runtime-default") {
    return [
      "promote the source-stress tension-state pressure adapter to the user-0 staged runtime default after focused runtime tests",
      "rerun Workbench/user0 and official smoke surfaces with morphology-check-v1",
      "resume LandAtrial AV-plane/effective-wall release timing only after LV/RV PV plus MVF/TVF remain robust",
    ];
  }
  if (classification.sourceStressAdapterDecision === "partial-structural-signal") {
    return [
      "keep source-stress pressure adapter off by default and inspect residual failed badges",
      "combine only with a deeper implicit valve/load solve if failures localize to AV inflow transitions",
      "do not tune LandAtrial, root/Zc, qDot, valve thresholds, Tref, or source-stress scale to buy morphology",
    ];
  }
  return [
    "do not adopt the source-stress pressure adapter",
    "move to a deeper chamber pressure adapter or graph-level implicit valve/load solve rather than more filter/tau sweeps",
    "keep A1/A2, LandAtrial parameters, qDot/rootZc, valve thresholds, Tref, and source-stress scale frozen while this blocker is active",
  ];
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5BZ variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5BZ result ${variantId}/${pointId}.`);
  return result;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
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

export function writeSourceStressPressureAdapterPhase5BZEvidence(): Evidence {
  const evidence = buildSourceStressPressureAdapterPhase5BZEvidence();
  const outPath = path.resolve(process.cwd(), SOURCE_STRESS_PRESSURE_ADAPTER_PHASE5BZ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeSourceStressPressureAdapterPhase5BZEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
