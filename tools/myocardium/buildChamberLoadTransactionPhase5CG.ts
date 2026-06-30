import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  activeSourcePressureContractFromSamples,
  type ActiveSourcePressureContractSummary,
  type AvInflowSourcePressureContract,
  type VentricularSourcePressureContract,
} from "@/engine/verification/activeSourcePressureContract";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const CHAMBER_LOAD_TRANSACTION_PHASE5CG_ID =
  "chamber-load-transaction-phase5cg-result-v1" as const;
export const CHAMBER_LOAD_TRANSACTION_PHASE5CG_RESULT_PATH =
  "data/myocardium/protocols/chamber-load-transaction-phase5cg-result-v1.json" as const;

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
  | "lv-rv-land-legacy-atria"
  | "transaction-user0"
  | "transaction-legacy-atria";

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
  readonly ventricularChamberTransaction: null | {
    readonly mechanismId: string;
    readonly iterations: number;
    readonly relaxation: number;
    readonly chambers: readonly ["LV", "RV"];
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type ContractClassCounts = {
  readonly sourceStateMultipeak: number;
  readonly pressureAdapterGeometryAmplification: number;
  readonly valveLoadOrPassiveCoupling: number;
  readonly mixedContractFailure: number;
  readonly cleanVentricularSide: number;
  readonly inletGradientMultipeak: number;
  readonly valveDiodeOrQdotContamination: number;
  readonly extraWaveWithoutClampDominance: number;
  readonly cleanAvInflow: number;
};

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
  readonly contract: ActiveSourcePressureContractSummary | null;
  readonly contractFailureClasses: readonly string[];
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
  readonly contractClassCounts: ContractClassCounts;
  readonly firstFailedPoint: PointId | null;
  readonly failedPointIds: readonly PointId[];
};

type Classification = {
  readonly legacyGrossPass: string;
  readonly currentUser0GrossPass: string;
  readonly lvRvLandLegacyAtriaGrossPass: string;
  readonly bestTransactionVariant: string;
  readonly currentUser0DominantContractClasses: ContractClassCounts;
  readonly lvRvLandLegacyAtriaDominantContractClasses: ContractClassCounts;
  readonly decision:
    | "contract-clean-enough-for-runtime-shadow"
    | "chamber-load-transaction-redesign-required";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof CHAMBER_LOAD_TRANSACTION_PHASE5CG_ID;
  readonly phase: "5CG";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
    readonly contractReadout:
      "deterministic source-stress, active-pressure, lambda, pressure-gradient, diode, and qDot attribution over the same last complete beat";
    readonly candidateMechanism:
      "ModelCore ventricularChamberTransactionStep local LV/RV plus adjacent-load-node volume-flow-provider-state fixed-point transaction, off by default";
  };
  readonly ownerVisualGateCalibration: {
    readonly sourceArtifactId: "morphology-visual-review-phase5ca-result-v1";
    readonly ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html";
    readonly failedGateExamplesVisuallyUnacceptable: true;
    readonly someOkGateExamplesStillVisuallyUnacceptable: true;
    readonly conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialTuningUnlock: true;
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

export function buildChamberLoadTransactionPhase5CGEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    lvRvLandLegacyAtriaVariant(),
    transactionUser0Variant(),
    transactionLegacyAtriaVariant(),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: CHAMBER_LOAD_TRANSACTION_PHASE5CG_ID,
    phase: "5CG",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      grossGate:
        "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count",
      contractReadout:
        "deterministic source-stress, active-pressure, lambda, pressure-gradient, diode, and qDot attribution over the same last complete beat",
      candidateMechanism:
        "ModelCore ventricularChamberTransactionStep local LV/RV plus adjacent-load-node volume-flow-provider-state fixed-point transaction, off by default",
    },
    ownerVisualGateCalibration: {
      sourceArtifactId: "morphology-visual-review-phase5ca-result-v1",
      ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html",
      failedGateExamplesVisuallyUnacceptable: true,
      someOkGateExamplesStillVisuallyUnacceptable: true,
      conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    points: POINTS,
    results,
    variantSummaries,
    classification,
    recommendedNext: recommendedNext(classification),
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
      noOfficialMorphologyAcceptance: true,
      noLandAtrialTuningUnlock: true,
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
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  });
  return {
    id: "legacy-frozen-reference",
    label: "Frozen legacy active-stress rollback/reference",
    hypothesis: "Positive morphology reference and rollback path.",
    closurePath: "legacy-active-stress",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function currentUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "current-user0-default",
    label: "Current user-0 all-chamber LandAtrial plus sourced root/Zc default",
    hypothesis: "Records active-source/pressure-adapter attribution for the live raw morphology blocker.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function lvRvLandLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "lv-rv-land-legacy-atria",
    label: "LV/RV Land plus legacy atria with sourced root/Zc",
    hypothesis: "Separates ventricular Land source/adapter coupling from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function transactionUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "transaction-user0",
    label: "Current user-0 closure with LV/RV plus adjacent-load-node chamber transaction step",
    hypothesis: "Tests whether solving LV/RV volume, adjacent LA/Ao/RA/PA load-node volume, valve flow, and provider-state advancement in the same fixed-point step rescues raw PV dome and AV inflow morphology.",
    closurePath: "current-user0-all-chamber-landatrial",
    ventricularChamberTransaction: {
      mechanismId: "phase5cg-chamber-load-transaction-user0",
      iterations: 4,
      relaxation: 0.7,
      chambers: ["LV", "RV"],
    },
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5cg-chamber-load-transaction-user0",
    ),
  };
}

function transactionLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "transaction-legacy-atria",
    label: "LV/RV Land legacy atria with LV/RV plus adjacent-load-node chamber transaction step",
    hypothesis: "Separates LV/RV chamber/load-node/valve/provider transaction effects from LandAtrial AV-plane/effective-wall timing.",
    closurePath: "lv-rv-land-legacy-atria",
    ventricularChamberTransaction: {
      mechanismId: "phase5cg-chamber-load-transaction-legacy-atria",
      iterations: 4,
      relaxation: 0.7,
      chambers: ["LV", "RV"],
    },
    experimentalOptions: withVentricularChamberTransactionStep(
      resolved.experimentalOptions,
      "phase5cg-chamber-load-transaction-legacy-atria",
    ),
  };
}

function withVentricularChamberTransactionStep(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
): ModelCoreExperimentalOptions {
  const providers = experimentalOptions.activeSourceProviders;
  if (!providers?.LV || !providers.RV) {
    throw new Error("Phase 5CG chamber-load transaction requires LV and RV source providers.");
  }
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
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
    const contract = measurement ? activeSourcePressureContractFromSamples(measurement.samples) : null;
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
      contract,
      contractFailureClasses: contract?.dominantFailureClasses ?? ["not-measured"],
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
      contract: null,
      contractFailureClasses: ["not-measured"],
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
    outputPreservedCount: own.filter((result) =>
      result.metrics
      && result.metrics.CO_L > 3.5
      && result.metrics.CO_L < 7.5
      && result.metrics.CO_R > 3.5
      && result.metrics.CO_R < 7.5
    ).length,
    contractClassCounts: countContractClasses(own),
    firstFailedPoint: failures[0]?.pointId ?? null,
    failedPointIds: failures.map((result) => result.pointId),
  };
}

function countContractClasses(results: readonly PointResult[]): ContractClassCounts {
  const ventricularContracts = results.flatMap((result) =>
    result.contract ? [result.contract.ventricles.LV, result.contract.ventricles.RV] : []
  );
  const avContracts = results.flatMap((result) =>
    result.contract ? [result.contract.avInflows.MV, result.contract.avInflows.TV] : []
  );
  return {
    sourceStateMultipeak: countVentricular(ventricularContracts, "source-state-multipeak"),
    pressureAdapterGeometryAmplification: countVentricular(ventricularContracts, "pressure-adapter-geometry-amplification"),
    valveLoadOrPassiveCoupling: countVentricular(ventricularContracts, "valve-load-or-passive-coupling"),
    mixedContractFailure: countVentricular(ventricularContracts, "mixed-contract-failure"),
    cleanVentricularSide: countVentricular(ventricularContracts, "clean-single-dome"),
    inletGradientMultipeak: countAv(avContracts, "inlet-gradient-multipeak"),
    valveDiodeOrQdotContamination: countAv(avContracts, "valve-diode-or-qdot-contamination"),
    extraWaveWithoutClampDominance: countAv(avContracts, "extra-wave-without-clamp-dominance"),
    cleanAvInflow: countAv(avContracts, "clean-biphasic"),
  };
}

function countVentricular(
  contracts: readonly VentricularSourcePressureContract[],
  className: VentricularSourcePressureContract["likelyFailureClass"],
): number {
  return contracts.filter((contract) => contract.likelyFailureClass === className).length;
}

function countAv(
  contracts: readonly AvInflowSourcePressureContract[],
  className: AvInflowSourcePressureContract["likelyFailureClass"],
): number {
  return contracts.filter((contract) => contract.likelyFailureClass === className).length;
}

function classify(
  summaries: readonly VariantSummary[],
  results: readonly PointResult[],
): Classification {
  const legacy = requiredSummary(summaries, "legacy-frozen-reference");
  const current = requiredSummary(summaries, "current-user0-default");
  const lvRv = requiredSummary(summaries, "lv-rv-land-legacy-atria");
  const v2User0 = requiredSummary(summaries, "transaction-user0");
  const v2LegacyAtria = requiredSummary(summaries, "transaction-legacy-atria");
  const bestTransaction = bestSummary([v2User0, v2LegacyAtria]);
  const normalCurrent = requiredResult(results, "current-user0-default", "normal-hr75");
  const normalLvRv = requiredResult(results, "lv-rv-land-legacy-atria", "normal-hr75");
  const normalBestTransaction = requiredResult(results, bestTransaction.variantId, "normal-hr75");
  const contractCleanEnough =
    bestTransaction.grossPassCount === POINTS.length
    && bestTransaction.contractClassCounts.cleanVentricularSide >= POINTS.length * 2
    && bestTransaction.contractClassCounts.cleanAvInflow >= POINTS.length * 2;
  return {
    legacyGrossPass: `${legacy.grossPassCount}/${POINTS.length}`,
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    lvRvLandLegacyAtriaGrossPass: `${lvRv.grossPassCount}/${POINTS.length}`,
    bestTransactionVariant: `${bestTransaction.variantId}:${bestTransaction.grossPassCount}/${POINTS.length}`,
    currentUser0DominantContractClasses: current.contractClassCounts,
    lvRvLandLegacyAtriaDominantContractClasses: lvRv.contractClassCounts,
    decision: contractCleanEnough
      ? "contract-clean-enough-for-runtime-shadow"
      : "chamber-load-transaction-redesign-required",
    notes: [
      `Current user-0 normal failed labels: ${normalCurrent.failedLabels.join(", ") || "none"}.`,
      `LV/RV Land legacy-atria normal failed labels: ${normalLvRv.failedLabels.join(", ") || "none"}.`,
      `Best transaction normal failed labels: ${normalBestTransaction.failedLabels.join(", ") || "none"}.`,
      `Best transaction gross pass count: ${bestTransaction.grossPassCount}/${POINTS.length}.`,
      `Current user-0 contract classes: ${formatCounts(current.contractClassCounts)}.`,
      `LV/RV Land legacy-atria contract classes: ${formatCounts(lvRv.contractClassCounts)}.`,
      "A robust fix must improve the representative envelope, not only the normal point.",
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "contract-clean-enough-for-runtime-shadow") {
    return [
      "rerun the full morphology envelope with the same active-source/pressure contract before runtime shadow",
      "resume LandAtrial AV-plane/effective-wall release timing only after LV/RV PV plus MVF/TVF remain robust",
    ];
  }
  return [
    "do not adopt the adjacent-load-node ventricularChamberTransactionStep candidate unless it passes the full morphology envelope",
    "if the adjacent-load-node chamber transaction remains partial, the next surface must solve a broader graph-level chamber/load transaction or change the chamber pressure adapter contract",
    "do not spend more phases on zeta/tau/smoothing/substeps, qDot/root/Zc/valve-threshold retuning, Tref, source-stress scaling, or LandAtrial parameter tuning while this blocker is active",
  ];
}

function bestSummary(summaries: readonly VariantSummary[]): VariantSummary {
  return [...summaries].sort((a, b) => {
    const gross = b.grossPassCount - a.grossPassCount;
    if (gross !== 0) return gross;
    const badges =
      (b.lvPvOkCount + b.rvPvOkCount + b.mvfOkCount + b.tvfOkCount)
      - (a.lvPvOkCount + a.rvPvOkCount + a.mvfOkCount + a.tvfOkCount);
    if (badges !== 0) return badges;
    return b.outputPreservedCount - a.outputPreservedCount;
  })[0];
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CG variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5CG result ${variantId}/${pointId}.`);
  return result;
}

function formatCounts(counts: ContractClassCounts): string {
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ") || "none";
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

export function writeChamberLoadTransactionPhase5CGEvidence(): Evidence {
  const evidence = buildChamberLoadTransactionPhase5CGEvidence();
  const outPath = path.resolve(process.cwd(), CHAMBER_LOAD_TRANSACTION_PHASE5CG_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeChamberLoadTransactionPhase5CGEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
