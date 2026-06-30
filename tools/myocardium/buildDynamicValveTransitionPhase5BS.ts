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
  type ModelCoreLand2017LvKinematicsMode,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvVelocityLengthCouplingMode,
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
import type { OverrideBlock, SimMetrics, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";

export const DYNAMIC_VALVE_TRANSITION_PHASE5BS_ID =
  "dynamic-valve-transition-phase5bs-result-v1" as const;
export const DYNAMIC_VALVE_TRANSITION_PHASE5BS_RESULT_PATH =
  "data/myocardium/protocols/dynamic-valve-transition-phase5bs-result-v1.json" as const;

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
  | "lv-rv-stateful-zeta-legacy-atria"
  | "lv-rv-stateful-zeta-landatrial-current"
  | "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-15"
  | "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-32"
  | "lv-rv-stateful-zeta-landatrial-all-valves-open-scaled-32"
  | "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-32-avplane-off";

type ValveTransitionMode =
  | "source"
  | "av-valves-open-scaled-reverse-15mlps"
  | "av-valves-open-scaled-reverse-32mlps"
  | "all-valves-open-scaled-reverse-32mlps";

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<typeof DEFAULT_PARAMS>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly hypothesis: string;
  readonly atrialPath: "legacy-active-stress" | "LandAtrial";
  readonly lvTauLambdaActSec: number | null;
  readonly rvTauLambdaActSec: number | null;
  readonly kinematicsMode: ModelCoreLand2017LvKinematicsMode | null;
  readonly velocityLengthCouplingMode: ModelCoreLand2017LvVelocityLengthCouplingMode | null;
  readonly atrialAvPlaneGainMl: number | "runtime-current" | null;
  readonly valveTransition: ValveTransitionMode;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
  readonly instrumentationByChamber: {
    readonly LV?: ModelCoreLand2017LvSourceProviderInstrumentation;
    readonly RV?: ModelCoreLand2017LvSourceProviderInstrumentation;
  };
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
  readonly errorMessage: string | null;
};

type VariantSummary = {
  readonly variantId: VariantId;
  readonly grossPassCount: number;
  readonly measuredCount: number;
  readonly settledOkCount: number;
  readonly failedPointIds: readonly PointId[];
  readonly firstFailedPoint: PointId | null;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type Classification = {
  readonly currentUser0GrossPass: string;
  readonly statefulZetaLegacyAtria: string;
  readonly statefulZetaAllChamber: string;
  readonly bestValveTransitionCandidate: string;
  readonly adoptionDecision: "supported-candidate" | "not-supported";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof DYNAMIC_VALVE_TRANSITION_PHASE5BS_ID;
  readonly phase: "5BS";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource:
      "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly grossGate:
      "LV/RV PV loop plus MVF/TVF must all be ok; LAP/RAP timing is recorded but not used for this gross ventricular/filling pass count";
  };
  readonly variants: readonly Omit<
    VariantSpec,
    "experimentalOptions" | "instrumentationByChamber"
  >[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: Classification;
  readonly recommendedNext: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
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

export function buildDynamicValveTransitionPhase5BSEvidence(): Evidence {
  const variants = [
    legacyVariant(),
    currentUser0Variant(),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-legacy-atria",
      label: "LV/RV stateful zeta-drive coupler with legacy atria",
      hypothesis: "Tests whether preserving raw length while stabilizing Land zeta velocity drive fixes LV/RV PV and AV inflow before LandAtrial coupling.",
      atrialPath: "legacy-active-stress",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: null,
      valveTransition: "source",
    }),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-landatrial-current",
      label: "LV/RV stateful zeta-drive coupler with current LandAtrial AV-plane",
      hypothesis: "Tests the same zeta-drive coupler in the live all-chamber LandAtrial closure.",
      atrialPath: "LandAtrial",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: "runtime-current",
      valveTransition: "source",
    }),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-15",
      label: "LV/RV stateful zeta-drive plus MV/TV openness-scaled reverse-flow transition, 15 mL/s",
      hypothesis: "Tests whether a small valve-state-aware AV inflow transition reduces MVF/TVF artifacts without changing LandAtrial geometry.",
      atrialPath: "LandAtrial",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: "runtime-current",
      valveTransition: "av-valves-open-scaled-reverse-15mlps",
    }),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-32",
      label: "LV/RV stateful zeta-drive plus MV/TV openness-scaled reverse-flow transition, 32 mL/s",
      hypothesis: "Tests whether a wider valve-state-aware AV inflow transition is needed for robust MVF/TVF morphology.",
      atrialPath: "LandAtrial",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: "runtime-current",
      valveTransition: "av-valves-open-scaled-reverse-32mlps",
    }),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-landatrial-all-valves-open-scaled-32",
      label: "LV/RV stateful zeta-drive plus all-valve openness-scaled reverse-flow transition, 32 mL/s",
      hypothesis: "Tests whether the gross envelope needs semilunar valve transition smoothing in addition to AV inflow smoothing.",
      atrialPath: "LandAtrial",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: "runtime-current",
      valveTransition: "all-valves-open-scaled-reverse-32mlps",
    }),
    customVentricularLandVariant({
      id: "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-32-avplane-off",
      label: "LV/RV stateful zeta-drive plus MV/TV transition with LandAtrial AV-plane off",
      hypothesis: "Separates AV inflow transition effects from AV-plane effective-wall release timing; AV-plane-off rescue alone is not adoption evidence.",
      atrialPath: "LandAtrial",
      lvTauLambdaActSec: null,
      rvTauLambdaActSec: null,
      kinematicsMode: "raw-wall-lambda",
      velocityLengthCouplingMode: "ventricular-stateful-zeta-drive-v1",
      atrialAvPlaneGainMl: 0,
      valveTransition: "av-valves-open-scaled-reverse-32mlps",
    }),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: DYNAMIC_VALVE_TRANSITION_PHASE5BS_ID,
    phase: "5BS",
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
    recommendedNext: [
      "adopt neither stateful zeta-drive nor valve transition smoothing unless the current-AV-plane all-chamber composition passes the representative morphology envelope",
      "keep A1/A2 frozen and do not tune LandAtrial by a single combined target-distance score",
      "use this no-go result to avoid more tau/limiter/smoothing sweeps; the next structural experiment should be a ventricular SeriesElasticV1 prescribed-volume bench before runtime adoption",
      "if SeriesElasticV1 leaves AV inflow transition artifacts, then implement fuller DynamicValveTransitionV1 with valve area state, hysteresis, inertance/Bernoulli timing, and anti-regurgitation bounds",
      "split LandAtrial AV-plane/effective-wall release timing from the ventricular/valve fix if AV-plane-off remains the only rescue",
      "treat LAP/RAP pressure timing checks as recorded diagnostics until the checker's pressure-extrema rule is separated from legacy failures",
    ],
    claimBoundary: {
      noRuntimeDefaultAdoption: true,
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
    atrialPath: "legacy-active-stress",
    lvTauLambdaActSec: null,
    rvTauLambdaActSec: null,
    kinematicsMode: null,
    velocityLengthCouplingMode: null,
    atrialAvPlaneGainMl: null,
    valveTransition: "source",
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
    atrialPath: "LandAtrial",
    lvTauLambdaActSec: null,
    rvTauLambdaActSec: null,
    kinematicsMode: "raw-wall-lambda",
    velocityLengthCouplingMode: "source",
    atrialAvPlaneGainMl: "runtime-current",
    valveTransition: "source",
    experimentalOptions: resolved.experimentalOptions,
    instrumentationByChamber: {
      LV: instrumentationByChamber.LV,
      RV: instrumentationByChamber.RV,
    },
  };
}

function customVentricularLandVariant(
  spec: Omit<VariantSpec, "experimentalOptions" | "instrumentationByChamber">,
): VariantSpec {
  const calciumScale = phase5QArtifact.calibration.phase2bAbsolutePeakScale;
  const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
  const lvProvider = calciumScaledLand2017LvSourceOnlyProvider(lvInstrumentation, {
    commitScheme: "BE",
    kinematicsMode: spec.kinematicsMode ?? "raw-wall-lambda",
    velocityLengthCouplingMode: spec.velocityLengthCouplingMode ?? "source",
    sourceProviderId: `phase5bs-${spec.id}:LV`,
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: defaultParams().lvTmaxScale * defaultParams().contractility,
  });
  const rvProvider = calciumScaledLand2017RvSourceOnlyProvider(rvInstrumentation, {
    commitScheme: "BE",
    kinematicsMode: spec.kinematicsMode ?? "raw-wall-lambda",
    velocityLengthCouplingMode: spec.velocityLengthCouplingMode ?? "source",
    sourceProviderId: `phase5bs-${spec.id}:RV`,
    calciumScale,
    calciumInputMultiplier: "tmax-contractility-user-control",
    calciumInputMultiplierReference: defaultParams().rvTmaxScale * defaultParams().contractility,
  });
  const baseOptions =
    spec.atrialPath === "LandAtrial"
      ? resolveModelCoreRuntimeActiveSource({
        mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
        rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
        runtimeParams: DEFAULT_PARAMS,
      }).experimentalOptions
      : resolveModelCoreRuntimeRootZc({
        mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
        baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      }).experimentalOptions;
  const basePatch = baseOptions.runtimeParameterPatch ?? {};
  const baseNodes = (basePatch.nodeOverrides ?? {}) as OverrideBlock;
  const lvNode = baseNodes.LV ?? {};
  const rvNode = baseNodes.RV ?? {};
  const laNode = baseNodes.LA ?? {};
  const raNode = baseNodes.RA ?? {};
  const nodeOverrides = {
    ...baseNodes,
    LV: {
      ...lvNode,
      active: { ...activeOverride(lvNode), tauLambdaActSec: spec.lvTauLambdaActSec ?? 0 },
    },
    RV: {
      ...rvNode,
      active: { ...activeOverride(rvNode), tauLambdaActSec: spec.rvTauLambdaActSec ?? 0 },
    },
    ...(spec.atrialPath === "LandAtrial" && typeof spec.atrialAvPlaneGainMl === "number"
      ? {
        LA: {
          ...laNode,
          active: { ...activeOverride(laNode), avPlaneGainMl: spec.atrialAvPlaneGainMl },
        },
        RA: {
          ...raNode,
          active: { ...activeOverride(raNode), avPlaneGainMl: spec.atrialAvPlaneGainMl },
        },
      }
      : {}),
  };
  const valveDiodeSmoothing = valveTransitionSmoothing(spec.valveTransition);
  return {
    ...spec,
    experimentalOptions: {
      ...baseOptions,
      ...(valveDiodeSmoothing ? { valveDiodeSmoothing } : {}),
      activeSourceProviders: {
        ...baseOptions.activeSourceProviders,
        LV: lvProvider,
        RV: rvProvider,
      },
      runtimeParameterPatch: {
        ...basePatch,
        nodeOverrides,
      },
    },
    instrumentationByChamber: { LV: lvInstrumentation, RV: rvInstrumentation },
  };
}

function valveTransitionSmoothing(
  mode: ValveTransitionMode,
): ModelCoreExperimentalOptions["valveDiodeSmoothing"] | undefined {
  if (mode === "source") return undefined;
  const reverseFlowLimitMlPerSec = mode === "av-valves-open-scaled-reverse-15mlps" ? 15 : 32;
  return {
    mechanismId: `phase5bs-${mode}`,
    targetValves: mode === "all-valves-open-scaled-reverse-32mlps"
      ? ["MV", "TV", "AoV", "PV"]
      : ["MV", "TV"],
    reverseFlowLimitMlPerSec,
    smoothingEpsilonMlPerSec: Math.max(reverseFlowLimitMlPerSec * 0.12, 1),
    opennessScaledReverseFlow: true,
  };
}

function activeOverride(node: OverrideBlock[string] | undefined): Record<string, number | string> {
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
  return {
    variantId: variant.id,
    grossPassCount: own.filter((result) =>
      result.grossVentricularMorphologyOk && result.settled && result.healthStatus === "ok"
    ).length,
    measuredCount: own.filter((result) => result.morphologyStatus !== "not-measured").length,
    settledOkCount: own.filter((result) => result.settled && result.healthStatus === "ok").length,
    failedPointIds: failures.map((result) => result.pointId),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[], results: readonly PointResult[]): Classification {
  const current = requiredSummary(summaries, "current-user0-default");
  const legacyAtria = requiredSummary(summaries, "lv-rv-stateful-zeta-legacy-atria");
  const allChamber = summaries.filter((summary) =>
    summary.variantId !== "legacy-frozen-reference"
    && summary.variantId !== "current-user0-default"
    && summary.variantId !== "lv-rv-stateful-zeta-legacy-atria"
    && summary.variantId !== "lv-rv-stateful-zeta-landatrial-current"
  );
  const bestAllChamber = [...allChamber].sort((a, b) => b.grossPassCount - a.grossPassCount)[0];
  const currentNormal = requiredResult(results, "current-user0-default", "normal-hr75");
  const legacyAtriaNormal = requiredResult(results, "lv-rv-stateful-zeta-legacy-atria", "normal-hr75");
  const statefulZetaCurrent = requiredSummary(summaries, "lv-rv-stateful-zeta-landatrial-current");
  const adoptionDecision =
    bestAllChamber?.variantId !== "lv-rv-stateful-zeta-landatrial-av-valves-open-scaled-32-avplane-off"
    && bestAllChamber?.grossPassCount === POINTS.length
      ? "supported-candidate"
      : "not-supported";
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    statefulZetaLegacyAtria:
      legacyAtria.grossPassCount === POINTS.length
        ? "robust-envelope-supported"
        : legacyAtriaNormal.grossVentricularMorphologyOk
          ? "normal-improves-but-envelope-not-robust"
          : "not-supported",
    statefulZetaAllChamber:
      statefulZetaCurrent.grossPassCount === POINTS.length
        ? "robust-envelope-supported"
        : `only-${statefulZetaCurrent.grossPassCount}/${POINTS.length}`,
    bestValveTransitionCandidate: bestAllChamber
      ? `${bestAllChamber.variantId}:${bestAllChamber.grossPassCount}/${POINTS.length}`
      : "none",
    adoptionDecision,
    notes: [
      `Current user-0 normal failed labels: ${currentNormal.failedLabels.join(", ") || "none"}.`,
      `LV/RV stateful zeta-drive with legacy atria normal failed labels: ${legacyAtriaNormal.failedLabels.join(", ") || "none"}.`,
      `Stateful zeta-drive with current LandAtrial gross pass count: ${statefulZetaCurrent.grossPassCount}/${POINTS.length}.`,
      `Best valve-transition gross pass count: ${bestAllChamber?.grossPassCount ?? 0}/${POINTS.length} (${bestAllChamber?.variantId ?? "none"}).`,
      "Adoption requires a current-AV-plane all-chamber valve-transition candidate to pass the representative preload/afterload/contractility envelope; AV-plane-off rescue alone is insufficient.",
    ],
  };
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5BS variant summary ${id}.`);
  return summary;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing Phase 5BS result ${variantId}/${pointId}.`);
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

export function writeDynamicValveTransitionPhase5BSEvidence(): Evidence {
  const evidence = buildDynamicValveTransitionPhase5BSEvidence();
  const outPath = path.resolve(process.cwd(), DYNAMIC_VALVE_TRANSITION_PHASE5BS_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeDynamicValveTransitionPhase5BSEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
