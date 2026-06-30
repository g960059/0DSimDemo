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
  type ModelCoreLand2017LvPressureSourceMode,
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

export const PRESSURE_SOURCE_CONTRACT_PHASE5CB_ID =
  "pressure-source-contract-phase5cb-result-v1" as const;
export const PRESSURE_SOURCE_CONTRACT_PHASE5CB_RESULT_PATH =
  "data/myocardium/protocols/pressure-source-contract-phase5cb-result-v1.json" as const;

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
  | "committed-output-lag-legacy-atria"
  | "transition-gated-committed-output-legacy-atria"
  | "transition-gated-committed-output-user0"
  | "coupled-be-user0"
  | "coupled-be-pressure-source-user0"
  | "coupled-be-legacy-atria";

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
  readonly pressureSourceContract: null | {
    readonly mode: ModelCoreLand2017LvPressureSourceMode;
    readonly chambers: readonly ["LV", "RV"];
  };
  readonly coupledBackwardEulerStep: null | {
    readonly mechanismId: string;
    readonly iterations: number;
    readonly relaxation: number;
    readonly providerStateCouplingChambers: readonly ["LV", "RV"];
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
  readonly bestPressureSourceVariant: string;
  readonly bestCoupledBackwardEulerVariant: string;
  readonly coupledStepDecision:
    | "supported-for-user0-runtime-default"
    | "partial-structural-signal"
    | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof PRESSURE_SOURCE_CONTRACT_PHASE5CB_ID;
  readonly phase: "5CB";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
  };
  readonly ownerVisualGateCalibration: {
    readonly sourceArtifactId: "morphology-visual-review-phase5ca-result-v1";
    readonly ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html";
    readonly failedGateExamplesVisuallyUnacceptable: true;
    readonly someOkGateExamplesStillVisuallyUnacceptable: true;
    readonly conclusion: "treat-morphology-check-v1-failures-as-real-blockers-and-tighten-not-relax-before-case-fitting";
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

export function buildPressureSourceContractPhase5CBEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    pressureSourceLegacyAtriaVariant({
      id: "committed-output-lag-legacy-atria",
      mode: "committed-output-lag-v1",
      label: "LV/RV Land committed-output pressure source with legacy atria",
      hypothesis: "Tests whether pressure should use the last committed Land source-state output rather than re-evaluating instantaneous stress during valve/load transitions.",
    }),
    pressureSourceLegacyAtriaVariant({
      id: "transition-gated-committed-output-legacy-atria",
      mode: "transition-gated-committed-output-v1",
      label: "LV/RV Land transition-gated committed-output pressure source with legacy atria",
      hypothesis: "Tests whether only valve-transition windows require committed-output pressure source semantics.",
    }),
    pressureSourceUser0Variant({
      id: "transition-gated-committed-output-user0",
      mode: "transition-gated-committed-output-v1",
      label: "Current user-0 all-chamber closure with LV/RV transition-gated committed-output pressure source",
      hypothesis: "Tests the same LV/RV pressure-source contract inside the current all-chamber LandAtrial closure.",
    }),
    coupledBackwardEulerUser0Variant({
      id: "coupled-be-user0",
      label: "Current user-0 closure with coupled backward-Euler LV/RV provider-state step",
      hypothesis: "Tests whether a larger candidate-state BE step couples chamber pressure, valve flow, and LV/RV Land source state strongly enough to remove gross morphology failures.",
    }),
    coupledBackwardEulerUser0Variant({
      id: "coupled-be-pressure-source-user0",
      pressureSourceMode: "transition-gated-committed-output-v1",
      label: "Current user-0 closure with coupled BE plus LV/RV transition-gated committed-output pressure source",
      hypothesis: "Tests whether the coupled BE surface needs the pressure-source contract to stabilize valve-transition windows.",
    }),
    coupledBackwardEulerLegacyAtriaVariant({
      id: "coupled-be-legacy-atria",
      label: "LV/RV Land legacy atria with coupled backward-Euler provider-state step",
      hypothesis: "Separates coupled BE ventricular mechanics from LandAtrial AV-plane/effective-wall timing.",
    }),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variants, variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: PRESSURE_SOURCE_CONTRACT_PHASE5CB_ID,
    phase: "5CB",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      grossGate:
        "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count",
    },
    ownerVisualGateCalibration: {
      sourceArtifactId: "morphology-visual-review-phase5ca-result-v1",
      ownerReviewedDownloadsBundle: "~/Downloads/0dsim-morphology-review-phase5ca/index.html",
      failedGateExamplesVisuallyUnacceptable: true,
      someOkGateExamplesStillVisuallyUnacceptable: true,
      conclusion: "treat-morphology-check-v1-failures-as-real-blockers-and-tighten-not-relax-before-case-fitting",
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
    pressureSourceContract: null,
    coupledBackwardEulerStep: null,
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
    pressureSourceContract: null,
    coupledBackwardEulerStep: null,
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function pressureSourceLegacyAtriaVariant(input: {
  readonly id: VariantId;
  readonly mode: ModelCoreLand2017LvPressureSourceMode;
  readonly label: string;
  readonly hypothesis: string;
}): VariantSpec {
  const { providers, instrumentationByChamber } = pressureSourceVentricularProviders(
    `phase5cb-${input.id}`,
    input.mode,
  );
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
  });
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "lv-rv-land-legacy-atria",
    pressureSourceContract: {
      mode: input.mode,
      chambers: ["LV", "RV"],
    },
    coupledBackwardEulerStep: null,
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders: providers,
    },
    instrumentationByChamber,
  };
}

function pressureSourceUser0Variant(input: {
  readonly id: VariantId;
  readonly mode: ModelCoreLand2017LvPressureSourceMode;
  readonly label: string;
  readonly hypothesis: string;
}): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const { providers, instrumentationByChamber: pressureInstrumentationByChamber } =
    pressureSourceVentricularProviders(
    `phase5cb-${input.id}`,
    input.mode,
  );
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "current-user0-all-chamber-landatrial",
    pressureSourceContract: {
      mode: input.mode,
      chambers: ["LV", "RV"],
    },
    coupledBackwardEulerStep: null,
    experimentalOptions: {
      ...resolved.experimentalOptions,
      activeSourceProviders: {
        ...(resolved.experimentalOptions.activeSourceProviders ?? {}),
        ...providers,
      },
    },
    instrumentationByChamber: {
      LV: pressureInstrumentationByChamber.LV,
      RV: pressureInstrumentationByChamber.RV,
    },
  };
}

function coupledBackwardEulerUser0Variant(input: {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly pressureSourceMode?: ModelCoreLand2017LvPressureSourceMode;
}): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const pressureOverride = input.pressureSourceMode
    ? pressureSourceVentricularProviders(`phase5cb-${input.id}`, input.pressureSourceMode)
    : null;
  const instrumentationByChamber = pressureOverride?.instrumentationByChamber
    ?? (resolved.instrumentationByChamber as Partial<
      Record<"LV" | "RV", ModelCoreLand2017LvSourceProviderInstrumentation>
    >);
  const coupledBackwardEulerStep = coupledBackwardEulerStepOptions(`coupled-be-v1:phase5cb-${input.id}`);
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "current-user0-all-chamber-landatrial",
    pressureSourceContract: input.pressureSourceMode
      ? { mode: input.pressureSourceMode, chambers: ["LV", "RV"] }
      : null,
    coupledBackwardEulerStep,
    experimentalOptions: {
      ...resolved.experimentalOptions,
      ...(pressureOverride
        ? {
          activeSourceProviders: {
            ...(resolved.experimentalOptions.activeSourceProviders ?? {}),
            ...pressureOverride.providers,
          },
        }
        : {}),
      coupledBackwardEulerStep,
    },
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function coupledBackwardEulerLegacyAtriaVariant(input: {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
}): VariantSpec {
  const { providers, instrumentationByChamber } = pressureSourceVentricularProviders(
    `phase5cb-${input.id}`,
    "instantaneous-state",
  );
  const rootZc = resolveModelCoreRuntimeRootZc({
    mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
    baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
  });
  const coupledBackwardEulerStep = coupledBackwardEulerStepOptions(`coupled-be-v1:phase5cb-${input.id}`);
  return {
    id: input.id,
    label: input.label,
    hypothesis: input.hypothesis,
    closurePath: "lv-rv-land-legacy-atria",
    pressureSourceContract: null,
    coupledBackwardEulerStep,
    experimentalOptions: {
      ...rootZc.experimentalOptions,
      activeSourceProviders: providers,
      coupledBackwardEulerStep,
    },
    instrumentationByChamber,
  };
}

function coupledBackwardEulerStepOptions(mechanismId: string): NonNullable<VariantSpec["coupledBackwardEulerStep"]> {
  return {
    mechanismId,
    iterations: 5,
    relaxation: 0.7,
    providerStateCouplingChambers: ["LV", "RV"],
  };
}

function pressureSourceVentricularProviders(
  idPrefix: string,
  pressureSourceMode: ModelCoreLand2017LvPressureSourceMode,
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
        pressureSourceMode,
        sourceProviderId: `${idPrefix}:LV`,
        calciumScale,
        calciumInputMultiplier: "tmax-contractility-user-control",
        calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
      }),
      RV: calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
        commitScheme: "BE",
        kinematicsMode: "raw-wall-lambda",
        velocityLengthCouplingMode: "source",
        pressureSourceMode,
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
  const pressureSourceCandidates = summaries.filter((summary) =>
    Boolean(variantById.get(summary.variantId)?.pressureSourceContract)
  );
  const coupledCandidates = summaries.filter((summary) =>
    Boolean(variantById.get(summary.variantId)?.coupledBackwardEulerStep)
  );
  const bestPressureSource = bestSummary(pressureSourceCandidates);
  const bestCoupled = bestSummary(coupledCandidates);
  const currentNormal = requiredResult(results, "current-user0-default", "normal-hr75");
  const bestPressureSourceNormal = bestPressureSource ? requiredResult(results, bestPressureSource.variantId, "normal-hr75") : null;
  const bestCoupledNormal = bestCoupled ? requiredResult(results, bestCoupled.variantId, "normal-hr75") : null;
  const fullPass = bestCoupled?.grossPassCount === POINTS.length && bestCoupled.settledOkCount === POINTS.length;
  const partialSignal = Boolean(bestCoupled && bestCoupled.grossPassCount > current.grossPassCount);
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    bestPressureSourceVariant: bestPressureSource
      ? `${bestPressureSource.variantId}:${bestPressureSource.grossPassCount}/${POINTS.length}`
      : "none",
    bestCoupledBackwardEulerVariant: bestCoupled
      ? `${bestCoupled.variantId}:${bestCoupled.grossPassCount}/${POINTS.length}`
      : "none",
    coupledStepDecision: fullPass
      ? "supported-for-user0-runtime-default"
      : partialSignal
        ? "partial-structural-signal"
        : "not-supported",
    notes: [
      `Current user-0 normal failed labels: ${currentNormal.failedLabels.join(", ") || "none"}.`,
      `Best pressure-source normal failed labels: ${bestPressureSourceNormal?.failedLabels.join(", ") || "none"}.`,
      `Best pressure-source gross pass count: ${bestPressureSource?.grossPassCount ?? 0}/${POINTS.length}.`,
      `Best coupled-BE normal failed labels: ${bestCoupledNormal?.failedLabels.join(", ") || "none"}.`,
      `Best coupled-BE gross pass count: ${bestCoupled?.grossPassCount ?? 0}/${POINTS.length}.`,
      "Coupled-step adoption requires full representative morphology envelope pass, not a normal-point or single-badge rescue.",
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
  if (classification.coupledStepDecision === "supported-for-user0-runtime-default") {
    return [
      "promote the coupled LV/RV mechanics step to the user-0 staged runtime default after focused runtime tests",
      "rerun Workbench/user0 and official smoke surfaces with morphology-check-v1",
      "resume LandAtrial AV-plane/effective-wall release timing only after LV/RV PV plus MVF/TVF remain robust",
    ];
  }
  if (classification.coupledStepDecision === "partial-structural-signal") {
    return [
      "keep coupled BE off by default and inspect residual failed badges",
      "use the residual pattern to decide whether a real candidate-pressure-after-step Newton block is needed",
      "do not tune LandAtrial, root/Zc, qDot, valve thresholds, Tref, or source-stress scale to buy morphology",
    ];
  }
  return [
    "do not adopt the committed-output pressure-source contract or the current fixed-point coupled BE surface",
    "move to a deeper candidate-pressure-after-step Newton/residual block rather than more filter/tau/smoothing sweeps",
    "keep A1/A2, LandAtrial parameters, qDot/rootZc, valve thresholds, Tref, and source-stress scale frozen while this blocker is active",
  ];
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CB variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5CB result ${variantId}/${pointId}.`);
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

export function writePressureSourceContractPhase5CBEvidence(): Evidence {
  const evidence = buildPressureSourceContractPhase5CBEvidence();
  const outPath = path.resolve(process.cwd(), PRESSURE_SOURCE_CONTRACT_PHASE5CB_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writePressureSourceContractPhase5CBEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
