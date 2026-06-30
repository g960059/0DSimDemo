import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import { defaultParams } from "@/engine/core/params";
import type { Chamber } from "@/engine/chambers";
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

export const GRAPH_COUPLED_STEP_PHASE5BY_ID =
  "graph-coupled-step-phase5by-result-v1" as const;
export const GRAPH_COUPLED_STEP_PHASE5BY_RESULT_PATH =
  "data/myocardium/protocols/graph-coupled-step-phase5by-result-v1.json" as const;

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
  | "user0-graph-lvrv-iter2"
  | "user0-graph-lvrv-iter4-relaxed"
  | "user0-graph-allchamber-iter2"
  | "lv-rv-land-legacy-atria-graph-lvrv-iter2";

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
  readonly graphCoupledStep: null | {
    readonly mechanismId: string;
    readonly iterations: number;
    readonly relaxation: number;
    readonly providerStateCouplingChambers: readonly Chamber[];
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
  readonly totalLandSolveFailures: number;
};

type Classification = {
  readonly currentUser0GrossPass: string;
  readonly bestGraphCoupledVariant: string;
  readonly graphCoupledStepDecision:
    | "supported-for-user0-runtime-default"
    | "partial-structural-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof GRAPH_COUPLED_STEP_PHASE5BY_ID;
  readonly phase: "5BY";
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

export function buildGraphCoupledStepPhase5BYEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    user0GraphCoupledVariant({
      id: "user0-graph-lvrv-iter2",
      label: "Current user-0 closure with graph-coupled LV/RV provider state, 2 iterations",
      hypothesis: "Tests whether same-step ventricular source-state/pressure/valve-load coupling fixes gross LV/RV PV plus MVF/TVF morphology.",
      mechanismId: "graph-coupled-active-provider-step-v1:lvrv-iter2",
      iterations: 2,
      relaxation: 1,
      providerStateCouplingChambers: ["LV", "RV"],
    }),
    user0GraphCoupledVariant({
      id: "user0-graph-lvrv-iter4-relaxed",
      label: "Current user-0 closure with graph-coupled LV/RV provider state, 4 relaxed iterations",
      hypothesis: "Tests whether a stronger but damped coupled-step solve is needed for robust ventricular morphology.",
      mechanismId: "graph-coupled-active-provider-step-v1:lvrv-iter4-relaxed",
      iterations: 4,
      relaxation: 0.65,
      providerStateCouplingChambers: ["LV", "RV"],
    }),
    user0GraphCoupledVariant({
      id: "user0-graph-allchamber-iter2",
      label: "Current user-0 closure with graph-coupled all-chamber provider state, 2 iterations",
      hypothesis: "Tests whether atrial provider-state coupling is required after the ventricular source-state surface is coupled.",
      mechanismId: "graph-coupled-active-provider-step-v1:allchamber-iter2",
      iterations: 2,
      relaxation: 1,
      providerStateCouplingChambers: ["LV", "RV", "LA", "RA"],
    }),
    lvRvLandLegacyAtriaGraphCoupledVariant(),
  ] as const;

  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: GRAPH_COUPLED_STEP_PHASE5BY_ID,
    phase: "5BY",
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
    graphCoupledStep: null,
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
    graphCoupledStep: null,
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function user0GraphCoupledVariant(input: {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly mechanismId: string;
  readonly iterations: number;
  readonly relaxation: number;
  readonly providerStateCouplingChambers: readonly Chamber[];
}): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const instrumentationByChamber = resolved.instrumentationByChamber as Partial<
    Record<"LV" | "RV", ModelCoreLand2017LvSourceProviderInstrumentation>
  >;
  const graphCoupledStep = {
    mechanismId: input.mechanismId,
    iterations: input.iterations,
    relaxation: input.relaxation,
    providerStateCouplingChambers: input.providerStateCouplingChambers,
  };
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "current-user0-all-chamber-landatrial",
    graphCoupledStep,
    experimentalOptions: {
      ...resolved.experimentalOptions,
      graphCoupledStep,
    },
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function lvRvLandLegacyAtriaGraphCoupledVariant(): VariantSpec {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const lvProvider = calciumScaledLand2017LvSourceOnlyProvider(lvInstrumentation, {
    commitScheme: "BE",
    kinematicsMode: "raw-wall-lambda",
    velocityLengthCouplingMode: "source",
    sourceProviderId: "phase5by-lv-rv-land-legacy-atria-graph-lvrv-iter2:LV",
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
  });
  const rvProvider = calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
    commitScheme: "BE",
    kinematicsMode: "raw-wall-lambda",
    velocityLengthCouplingMode: "source",
    sourceProviderId: "phase5by-lv-rv-land-legacy-atria-graph-lvrv-iter2:RV",
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: defaultParams().rvTmaxScale * defaultParams().contractility,
  });
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
  });
  const graphCoupledStep = {
    mechanismId: "graph-coupled-active-provider-step-v1:lvrv-iter2-legacy-atria",
    iterations: 2,
    relaxation: 1,
    providerStateCouplingChambers: ["LV", "RV"] as const,
  };
  return {
    id: "lv-rv-land-legacy-atria-graph-lvrv-iter2",
    label: "LV/RV Land with legacy atria plus graph-coupled LV/RV provider state",
    hypothesis: "Separates graph-level ventricular source-state coupling from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    graphCoupledStep,
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders: {
        LV: lvProvider,
        RV: rvProvider,
      },
      graphCoupledStep,
    },
    instrumentationByChamber: { LV: lvInstrumentation, RV: rvInstrumentation },
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
    totalLandSolveFailures: own.reduce((acc, result) =>
      acc + (result.landSolveFailures.LV ?? 0) + (result.landSolveFailures.RV ?? 0), 0),
  };
}

function classify(
  summaries: readonly VariantSummary[],
  results: readonly PointResult[],
): Classification {
  const current = requiredSummary(summaries, "current-user0-default");
  const graphCandidates = summaries.filter((summary) =>
    summary.variantId !== "legacy-frozen-reference" && summary.variantId !== "current-user0-default"
  );
  const best = [...graphCandidates].sort((a, b) => {
    const gross = b.grossPassCount - a.grossPassCount;
    if (gross !== 0) return gross;
    const pvFlow =
      (b.lvPvOkCount + b.rvPvOkCount + b.mvfOkCount + b.tvfOkCount)
      - (a.lvPvOkCount + a.rvPvOkCount + a.mvfOkCount + a.tvfOkCount);
    return pvFlow;
  })[0];
  const currentNormal = requiredResult(results, "current-user0-default", "normal-hr75");
  const bestNormal = best ? requiredResult(results, best.variantId, "normal-hr75") : null;
  const fullPass = best?.grossPassCount === POINTS.length && best.settledOkCount === POINTS.length;
  const partialSignal = Boolean(best && best.grossPassCount > current.grossPassCount);
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    bestGraphCoupledVariant: best
      ? `${best.variantId}:${best.grossPassCount}/${POINTS.length}`
      : "none",
    graphCoupledStepDecision: fullPass
      ? "supported-for-user0-runtime-default"
      : partialSignal
        ? "partial-structural-signal"
        : "not-supported",
    notes: [
      `Current user-0 normal failed labels: ${currentNormal.failedLabels.join(", ") || "none"}.`,
      `Best graph-coupled normal failed labels: ${bestNormal?.failedLabels.join(", ") || "none"}.`,
      `Best graph-coupled gross pass count: ${best?.grossPassCount ?? 0}/${POINTS.length}.`,
      "Graph-coupled step adoption requires the full representative morphology envelope, not a normal-point rescue.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.graphCoupledStepDecision === "supported-for-user0-runtime-default") {
    return [
      "promote graph-coupled active-provider step to the user-0 staged runtime default after focused runtime tests",
      "rerun the reusable morphology checker in Workbench/user0 and official case smoke surfaces",
      "only after LV/RV PV plus MVF/TVF remain robust, resume LandAtrial AV-plane/effective-wall release timing work",
    ];
  }
  if (classification.graphCoupledStepDecision === "partial-structural-signal") {
    return [
      "keep graph-coupled step off by default and inspect the remaining failed badges before adopting",
      "use the same morphology envelope to decide whether the next structural change belongs in pressure-adapter semantics or graph-level implicit valve/load solve",
      "do not resume LandAtrial tuning until LV/RV PV plus MVF/TVF failures are robustly removed",
    ];
  }
  return [
    "do not adopt the graph-coupled step surface",
    "move from provider-state coupling to a deeper chamber pressure adapter or graph-level implicit valve/load solve",
    "keep A1/A2, LandAtrial parameters, qDot/rootZc, valve thresholds, Tref, and source-stress scale frozen while this blocker is active",
  ];
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5BY variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5BY result ${variantId}/${pointId}.`);
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

export function writeGraphCoupledStepPhase5BYEvidence(): Evidence {
  const evidence = buildGraphCoupledStepPhase5BYEvidence();
  const outPath = path.resolve(process.cwd(), GRAPH_COUPLED_STEP_PHASE5BY_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeGraphCoupledStepPhase5BYEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
