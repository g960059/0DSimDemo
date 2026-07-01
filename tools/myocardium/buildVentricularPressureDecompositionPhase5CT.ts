import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore, type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import { lastCompleteBeat, phaseOf } from "@/engine/verification/shapeMetrics";

export const VENTRICULAR_PRESSURE_DECOMPOSITION_PHASE5CT_ID =
  "ventricular-pressure-decomposition-phase5ct-result-v1" as const;
export const VENTRICULAR_PRESSURE_DECOMPOSITION_PHASE5CT_RESULT_PATH =
  "data/myocardium/protocols/ventricular-pressure-decomposition-phase5ct-result-v1.json" as const;

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
  | "current-user0-default"
  | "lv-rv-land-legacy-atria"
  | "accepted-av-complementarity2-legacy-atria"
  | "accepted-av-complementarity2-user0";

type Side = "LV" | "RV";

type ComponentId = "total" | "unclamped" | "passive" | "active";

type ComponentShape = {
  readonly component: ComponentId;
  readonly measured: boolean;
  readonly sampleCount: number;
  readonly min: number | null;
  readonly max: number | null;
  readonly range: number | null;
  readonly prominentPeakCount: number;
  readonly prominentTroughCount: number;
  readonly dominantPeakTheta: number | null;
  readonly dominantTroughTheta: number | null;
};

type SidePressureDiagnostic = {
  readonly side: Side;
  readonly pvBadge: "ok" | "warning" | "failed" | "pending" | "unknown";
  readonly ejectionSampleCount: number;
  readonly ejectionFlowPeakMlPerSec: number | null;
  readonly pressureProminenceMmHg: number;
  readonly total: ComponentShape;
  readonly unclamped: ComponentShape;
  readonly passive: ComponentShape;
  readonly active: ComponentShape;
  readonly activeFiberStressPeakPa: number | null;
  readonly lambdaRange: number | null;
  readonly sourceComponentHasProminentResidual: boolean;
  readonly totalHasProminentResidual: boolean;
  readonly attribution:
    | "not-measured"
    | "pv-ok"
    | "active-source-component-contributes"
    | "passive-geometry-component-contributes"
    | "total-only-pressure-adapter-or-valve-load"
    | "mixed-pressure-components";
};

type PointSpec = {
  readonly id: PointId;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type VariantSpec = {
  readonly id: VariantId;
  readonly label: string;
  readonly closurePath: "current-user0-all-chamber-landatrial" | "lv-rv-land-legacy-atria";
  readonly avValveBoundary: null | {
    readonly mode: "accepted-state-av-boundary-fixedpoint";
    readonly targetValves: readonly ["MV", "TV"];
    readonly iterations: 2;
    readonly relaxation: 1;
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
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
  readonly pressureDiagnostics: Readonly<Record<Side, SidePressureDiagnostic>> | null;
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
  readonly failedPvSideCount: number;
  readonly failedPvWithActiveSourceResidualCount: number;
  readonly failedPvWithPassiveGeometryResidualCount: number;
  readonly failedPvWithTotalOnlyResidualCount: number;
  readonly failedPvWithMixedPressureResidualCount: number;
  readonly firstFailedPoint: PointId | null;
};

type Classification = {
  readonly currentUser0GrossPass: string;
  readonly lvRvLandLegacyAtriaGrossPass: string;
  readonly acceptedLegacyGrossPass: string;
  readonly acceptedUser0TransferGrossPass: string;
  readonly preAcceptedPressureAttribution: {
    readonly currentUser0FailedPvSideCount: number;
    readonly currentUser0FailedPvWithActiveSourceResidualCount: number;
    readonly currentUser0FailedPvWithMixedPressureResidualCount: number;
    readonly lvRvLandLegacyAtriaFailedPvSideCount: number;
    readonly lvRvLandLegacyAtriaFailedPvWithActiveSourceResidualCount: number;
    readonly lvRvLandLegacyAtriaFailedPvWithMixedPressureResidualCount: number;
  };
  readonly acceptedLegacyPressureAttribution: {
    readonly failedPvSideCount: number;
    readonly failedPvWithActiveSourceResidualCount: number;
    readonly failedPvWithPassiveGeometryResidualCount: number;
    readonly failedPvWithTotalOnlyResidualCount: number;
    readonly failedPvWithMixedPressureResidualCount: number;
  };
  readonly decision:
    | "pressure-decomposition-readback-missing"
    | "active-source-component-is-primary-suspect"
    | "pressure-adapter-or-valve-load-primary-suspect"
    | "mixed-pressure-components-require-new-contract"
    | "accepted-complementarity-clears-pv-pressure-residuals-av-inflow-remains"
    | "no-new-signal";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof VENTRICULAR_PRESSURE_DECOMPOSITION_PHASE5CT_ID;
  readonly phase: "5CT";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly diagnosticQuestion:
      "whether LV/RV gross PV failures localize to active-source pressure, passive/geometry pressure, or total pressure adapter/valve-load coupling";
  };
  readonly ownerVisualGateCalibration: {
    readonly sourceArtifactId: "morphology-visual-review-phase5ca-result-v1";
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
const PRESSURE_PROMINENCE_MMHG = 4;

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

export function buildVentricularPressureDecompositionPhase5CTEvidence(): Evidence {
  const variants = [
    currentUser0Variant(),
    lvRvLandLegacyAtriaVariant(),
    acceptedComplementarityLegacyAtriaVariant(),
    acceptedComplementarityUser0Variant(),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: VENTRICULAR_PRESSURE_DECOMPOSITION_PHASE5CT_ID,
    phase: "5CT",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      diagnosticQuestion:
        "whether LV/RV gross PV failures localize to active-source pressure, passive/geometry pressure, or total pressure adapter/valve-load coupling",
    },
    ownerVisualGateCalibration: {
      sourceArtifactId: "morphology-visual-review-phase5ca-result-v1",
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

function currentUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "current-user0-default",
    label: "Current user-0 all-chamber LandAtrial plus sourced root/Zc default",
    closurePath: "current-user0-all-chamber-landatrial",
    avValveBoundary: null,
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
    closurePath: "lv-rv-land-legacy-atria",
    avValveBoundary: null,
    experimentalOptions: resolved.experimentalOptions,
  };
}

function acceptedComplementarityLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-complementarity2-legacy-atria",
    label: "LV/RV Land legacy atria with 2x accepted-state AV valve fixed-point complementarity",
    closurePath: "lv-rv-land-legacy-atria",
    avValveBoundary: {
      mode: "accepted-state-av-boundary-fixedpoint",
      targetValves: ["MV", "TV"],
      iterations: 2,
      relaxation: 1,
    },
    experimentalOptions: withAcceptedComplementarity(resolved.experimentalOptions, "phase5ct-accepted-legacy-atria"),
  };
}

function acceptedComplementarityUser0Variant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-complementarity2-user0",
    label: "Current user-0 closure with 2x accepted-state AV valve fixed-point complementarity",
    closurePath: "current-user0-all-chamber-landatrial",
    avValveBoundary: {
      mode: "accepted-state-av-boundary-fixedpoint",
      targetValves: ["MV", "TV"],
      iterations: 2,
      relaxation: 1,
    },
    experimentalOptions: withAcceptedComplementarity(resolved.experimentalOptions, "phase5ct-accepted-user0"),
  };
}

function withAcceptedComplementarity(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
): ModelCoreExperimentalOptions {
  return {
    ...experimentalOptions,
    ventricularChamberTransactionStep: {
      mechanismId,
      iterations: 4,
      relaxation: 0.7,
      providerStateCouplingChambers: ["LV", "RV"],
      includeAdjacentLoadNodes: true,
      avValveBoundaryMode: "accepted-state-av-boundary-fixedpoint",
      avValveBoundaryTargetValves: ["MV", "TV"],
      avValveBoundaryPressureRefitIterations: 2,
      avValveBoundaryPressureRefitRelaxation: 1,
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
      pressureDiagnostics: measurement
        ? {
          LV: sidePressureDiagnostic(measurement.samples, "LV", morphology?.badges.lvPv ?? "unknown"),
          RV: sidePressureDiagnostic(measurement.samples, "RV", morphology?.badges.rvPv ?? "unknown"),
        }
        : null,
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
      pressureDiagnostics: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function sidePressureDiagnostic(
  samples: readonly SimSample[],
  side: Side,
  pvBadge: SidePressureDiagnostic["pvBadge"],
): SidePressureDiagnostic {
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) return unmeasuredSidePressureDiagnostic(side, pvBadge, "no complete beat");
  const flowKey = side === "LV" ? "QAo" : "QPV";
  const flowPeak = Math.max(...beat.map((sample) => numeric(sample, flowKey)));
  if (!Number.isFinite(flowPeak) || flowPeak <= 0) {
    return unmeasuredSidePressureDiagnostic(side, pvBadge, "no positive ejection flow");
  }
  const threshold = Math.max(5, flowPeak * 0.08);
  const ejection = beat.filter((sample) => numeric(sample, flowKey) >= threshold);
  if (ejection.length < 8) return unmeasuredSidePressureDiagnostic(side, pvBadge, "ejection window too short");
  const total = componentShape(ejection, "total", side === "LV" ? "LVP" : "RVP");
  const unclamped = componentShape(ejection, "unclamped", side === "LV" ? "LVPressureUnclampedMmHg" : "RVPressureUnclampedMmHg");
  const passive = componentShape(ejection, "passive", side === "LV" ? "LVPassivePressureMmHg" : "RVPassivePressureMmHg");
  const active = componentShape(ejection, "active", side === "LV" ? "LVActivePressureMmHg" : "RVActivePressureMmHg");
  const stressPeak = maxFinite(ejection.map((sample) =>
    numeric(sample, side === "LV" ? "LVActiveFiberStressPa" : "RVActiveFiberStressPa")
  ));
  const lambdas = ejection
    .map((sample) => numeric(sample, side === "LV" ? "LVFiberLambda" : "RVFiberLambda"))
    .filter(Number.isFinite);
  const sourceComponentHasProminentResidual = hasResidual(active);
  const passiveGeometryHasProminentResidual = hasResidual(passive);
  const totalHasProminentResidual = hasResidual(total);
  return {
    side,
    pvBadge,
    ejectionSampleCount: ejection.length,
    ejectionFlowPeakMlPerSec: round(flowPeak),
    pressureProminenceMmHg: PRESSURE_PROMINENCE_MMHG,
    total,
    unclamped,
    passive,
    active,
    activeFiberStressPeakPa: roundNullable(stressPeak),
    lambdaRange: lambdas.length > 0 ? round(Math.max(...lambdas) - Math.min(...lambdas)) : null,
    sourceComponentHasProminentResidual,
    totalHasProminentResidual,
    attribution: attribution({
      pvBadge,
      measured: total.measured && active.measured && passive.measured,
      totalHasProminentResidual,
      activeHasProminentResidual: sourceComponentHasProminentResidual,
      passiveHasProminentResidual: passiveGeometryHasProminentResidual,
    }),
  };
}

function componentShape(
  samples: readonly SimSample[],
  component: ComponentId,
  key: keyof SimSample,
): ComponentShape {
  const series = samples
    .map((sample) => ({ theta: phaseOf(sample), value: numeric(sample, key) }))
    .filter((point) => Number.isFinite(point.value));
  if (series.length < 8) {
    return {
      component,
      measured: false,
      sampleCount: series.length,
      min: null,
      max: null,
      range: null,
      prominentPeakCount: 0,
      prominentTroughCount: 0,
      dominantPeakTheta: null,
      dominantTroughTheta: null,
    };
  }
  const values = series.map((point) => point.value);
  const peaks = localExtremaSeries(series, "max", PRESSURE_PROMINENCE_MMHG);
  const troughs = localExtremaSeries(series, "min", PRESSURE_PROMINENCE_MMHG);
  const dominantPeak = maxByMagnitude(peaks);
  const dominantTrough = maxByMagnitude(troughs);
  return {
    component,
    measured: true,
    sampleCount: series.length,
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
    range: round(Math.max(...values) - Math.min(...values)),
    prominentPeakCount: peaks.length,
    prominentTroughCount: troughs.length,
    dominantPeakTheta: roundNullable(dominantPeak?.theta ?? null),
    dominantTroughTheta: roundNullable(dominantTrough?.theta ?? null),
  };
}

function localExtremaSeries(
  series: readonly { readonly theta: number; readonly value: number }[],
  mode: "max" | "min",
  prominence: number,
): readonly { readonly theta: number; readonly value: number }[] {
  const window = 4;
  const extrema: { theta: number; value: number }[] = [];
  for (let i = window; i < series.length - window; i++) {
    const prev = series[i - 1].value;
    const cur = series[i].value;
    const next = series[i + 1].value;
    const isExtremum = mode === "max" ? cur > prev && cur >= next : cur < prev && cur <= next;
    if (!isExtremum) continue;
    const left = series.slice(i - window, i).map((point) => point.value);
    const right = series.slice(i + 1, i + 1 + window).map((point) => point.value);
    const localProminence = mode === "max"
      ? cur - Math.max(Math.min(...left), Math.min(...right))
      : Math.min(Math.max(...left), Math.max(...right)) - cur;
    if (localProminence < prominence) continue;
    extrema.push({ theta: series[i].theta, value: cur });
  }
  return mergeNearbyExtrema(extrema, 0.035, mode);
}

function mergeNearbyExtrema(
  extrema: readonly { readonly theta: number; readonly value: number }[],
  minThetaGap: number,
  mode: "max" | "min",
): readonly { readonly theta: number; readonly value: number }[] {
  const out: { theta: number; value: number }[] = [];
  for (const extremum of [...extrema].sort((a, b) => a.theta - b.theta)) {
    const last = out.at(-1);
    if (!last || Math.abs(extremum.theta - last.theta) > minThetaGap) {
      out.push({ ...extremum });
    } else if (mode === "max" ? extremum.value > last.value : extremum.value < last.value) {
      last.theta = extremum.theta;
      last.value = extremum.value;
    }
  }
  return out;
}

function attribution(input: {
  readonly pvBadge: SidePressureDiagnostic["pvBadge"];
  readonly measured: boolean;
  readonly totalHasProminentResidual: boolean;
  readonly activeHasProminentResidual: boolean;
  readonly passiveHasProminentResidual: boolean;
}): SidePressureDiagnostic["attribution"] {
  if (!input.measured) return "not-measured";
  if (input.pvBadge === "ok" && !input.totalHasProminentResidual) return "pv-ok";
  if (input.activeHasProminentResidual && !input.passiveHasProminentResidual) return "active-source-component-contributes";
  if (input.passiveHasProminentResidual && !input.activeHasProminentResidual) return "passive-geometry-component-contributes";
  if (input.totalHasProminentResidual && !input.activeHasProminentResidual && !input.passiveHasProminentResidual) {
    return "total-only-pressure-adapter-or-valve-load";
  }
  return "mixed-pressure-components";
}

function unmeasuredSidePressureDiagnostic(
  side: Side,
  pvBadge: SidePressureDiagnostic["pvBadge"],
  _reason: string,
): SidePressureDiagnostic {
  const empty = (component: ComponentId): ComponentShape => ({
    component,
    measured: false,
    sampleCount: 0,
    min: null,
    max: null,
    range: null,
    prominentPeakCount: 0,
    prominentTroughCount: 0,
    dominantPeakTheta: null,
    dominantTroughTheta: null,
  });
  return {
    side,
    pvBadge,
    ejectionSampleCount: 0,
    ejectionFlowPeakMlPerSec: null,
    pressureProminenceMmHg: PRESSURE_PROMINENCE_MMHG,
    total: empty("total"),
    unclamped: empty("unclamped"),
    passive: empty("passive"),
    active: empty("active"),
    activeFiberStressPeakPa: null,
    lambdaRange: null,
    sourceComponentHasProminentResidual: false,
    totalHasProminentResidual: false,
    attribution: "not-measured",
  };
}

function hasResidual(shape: ComponentShape): boolean {
  return shape.measured && (shape.prominentPeakCount > 1 || shape.prominentTroughCount > 0);
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const failures = own.filter((result) =>
    !result.grossVentricularMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  const sideDiagnostics = own.flatMap((result) =>
    result.pressureDiagnostics ? [result.pressureDiagnostics.LV, result.pressureDiagnostics.RV] : []
  );
  const failedPvSides = sideDiagnostics.filter((diagnostic) => diagnostic.pvBadge !== "ok");
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
    failedPvSideCount: failedPvSides.length,
    failedPvWithActiveSourceResidualCount: failedPvSides.filter((entry) =>
      entry.attribution === "active-source-component-contributes"
    ).length,
    failedPvWithPassiveGeometryResidualCount: failedPvSides.filter((entry) =>
      entry.attribution === "passive-geometry-component-contributes"
    ).length,
    failedPvWithTotalOnlyResidualCount: failedPvSides.filter((entry) =>
      entry.attribution === "total-only-pressure-adapter-or-valve-load"
    ).length,
    failedPvWithMixedPressureResidualCount: failedPvSides.filter((entry) =>
      entry.attribution === "mixed-pressure-components"
    ).length,
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[], results: readonly PointResult[]): Classification {
  const current = requiredSummary(summaries, "current-user0-default");
  const lvRv = requiredSummary(summaries, "lv-rv-land-legacy-atria");
  const acceptedLegacy = requiredSummary(summaries, "accepted-av-complementarity2-legacy-atria");
  const acceptedUser0 = requiredSummary(summaries, "accepted-av-complementarity2-user0");
  const acceptedLegacyNotes = failedPressureNotes(results, acceptedLegacy.variantId);
  const readbacksMissing = results.some((result) =>
    result.pressureDiagnostics
    && (["LV", "RV"] as const).some((side) =>
      !result.pressureDiagnostics![side].unclamped.measured
      || !result.pressureDiagnostics![side].active.measured
      || !result.pressureDiagnostics![side].passive.measured
    )
  );
  const activeDominant =
    acceptedLegacy.failedPvWithActiveSourceResidualCount > acceptedLegacy.failedPvWithTotalOnlyResidualCount
    && acceptedLegacy.failedPvWithActiveSourceResidualCount > acceptedLegacy.failedPvWithPassiveGeometryResidualCount;
  const adapterDominant =
    acceptedLegacy.failedPvWithTotalOnlyResidualCount >= acceptedLegacy.failedPvWithActiveSourceResidualCount
    && acceptedLegacy.failedPvWithTotalOnlyResidualCount >= acceptedLegacy.failedPvWithPassiveGeometryResidualCount
    && acceptedLegacy.failedPvWithTotalOnlyResidualCount > 0;
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    lvRvLandLegacyAtriaGrossPass: `${lvRv.grossPassCount}/${POINTS.length}`,
    acceptedLegacyGrossPass: `${acceptedLegacy.grossPassCount}/${POINTS.length}`,
    acceptedUser0TransferGrossPass: `${acceptedUser0.grossPassCount}/${POINTS.length}`,
    preAcceptedPressureAttribution: {
      currentUser0FailedPvSideCount: current.failedPvSideCount,
      currentUser0FailedPvWithActiveSourceResidualCount: current.failedPvWithActiveSourceResidualCount,
      currentUser0FailedPvWithMixedPressureResidualCount: current.failedPvWithMixedPressureResidualCount,
      lvRvLandLegacyAtriaFailedPvSideCount: lvRv.failedPvSideCount,
      lvRvLandLegacyAtriaFailedPvWithActiveSourceResidualCount: lvRv.failedPvWithActiveSourceResidualCount,
      lvRvLandLegacyAtriaFailedPvWithMixedPressureResidualCount: lvRv.failedPvWithMixedPressureResidualCount,
    },
    acceptedLegacyPressureAttribution: {
      failedPvSideCount: acceptedLegacy.failedPvSideCount,
      failedPvWithActiveSourceResidualCount: acceptedLegacy.failedPvWithActiveSourceResidualCount,
      failedPvWithPassiveGeometryResidualCount: acceptedLegacy.failedPvWithPassiveGeometryResidualCount,
      failedPvWithTotalOnlyResidualCount: acceptedLegacy.failedPvWithTotalOnlyResidualCount,
      failedPvWithMixedPressureResidualCount: acceptedLegacy.failedPvWithMixedPressureResidualCount,
    },
    decision: readbacksMissing
      ? "pressure-decomposition-readback-missing"
      : acceptedLegacy.failedPvSideCount === 0
        && acceptedUser0.failedPvSideCount === 0
        && (acceptedLegacy.grossPassCount < POINTS.length || acceptedUser0.grossPassCount < POINTS.length)
        ? "accepted-complementarity-clears-pv-pressure-residuals-av-inflow-remains"
        : activeDominant
        ? "active-source-component-is-primary-suspect"
        : adapterDominant
          ? "pressure-adapter-or-valve-load-primary-suspect"
          : acceptedLegacy.failedPvWithMixedPressureResidualCount > 0
            ? "mixed-pressure-components-require-new-contract"
            : "no-new-signal",
    notes: [
      `Accepted legacy pressure notes: ${acceptedLegacyNotes.join(" | ") || "none"}.`,
      `Accepted legacy gross pass: ${acceptedLegacy.grossPassCount}/${POINTS.length}.`,
      `Accepted user0 transfer gross pass: ${acceptedUser0.grossPassCount}/${POINTS.length}.`,
      `Current user0 failed PV sides: ${current.failedPvSideCount}; active-source residual ${current.failedPvWithActiveSourceResidualCount}; mixed residual ${current.failedPvWithMixedPressureResidualCount}.`,
      `LV/RV Land legacy-atria failed PV sides: ${lvRv.failedPvSideCount}; active-source residual ${lvRv.failedPvWithActiveSourceResidualCount}; mixed residual ${lvRv.failedPvWithMixedPressureResidualCount}.`,
      `Accepted legacy failed PV sides: ${acceptedLegacy.failedPvSideCount}.`,
      `Accepted legacy failed PV with active-source residual: ${acceptedLegacy.failedPvWithActiveSourceResidualCount}.`,
      `Accepted legacy failed PV with passive/geometry residual: ${acceptedLegacy.failedPvWithPassiveGeometryResidualCount}.`,
      `Accepted legacy failed PV with total-only residual: ${acceptedLegacy.failedPvWithTotalOnlyResidualCount}.`,
      `Accepted legacy failed PV with mixed pressure residual: ${acceptedLegacy.failedPvWithMixedPressureResidualCount}.`,
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "pressure-decomposition-readback-missing") {
    return [
      "do not interpret Phase 5CT until LV/RV pressure decomposition fields are present for all measured active-stress points",
      "fix sample readbacks before designing another chamber pressure/valve/load contract",
    ];
  }
  if (classification.decision === "active-source-component-is-primary-suspect") {
    return [
      "inspect accepted-lambda and source-state advancement semantics before writing another valve-boundary refit",
      "do not tune Land parameters; test source-state/mechanics coupling with the same morphology envelope",
    ];
  }
  if (classification.decision === "pressure-adapter-or-valve-load-primary-suspect") {
    return [
      "design the next pressure adapter/valve-load contract around total-pressure assembly rather than source-stress or Land parameter tuning",
      "preserve LV/RV pressure decomposition readbacks as mandatory diagnostics for any next transaction candidate",
      "continue keeping LandAtrial, qDot/root/Zc, valve thresholds, Tref, and source-stress scaling frozen",
    ];
  }
  if (classification.decision === "mixed-pressure-components-require-new-contract") {
    return [
      "treat the residual as a coupled chamber mechanical-contract problem, not a scalar cap/refit problem",
      "next candidate should own source-state commit, chamber pressure assembly, accepted volume, and AV valve flow in one residual surface",
    ];
  }
  if (classification.decision === "accepted-complementarity-clears-pv-pressure-residuals-av-inflow-remains") {
    return [
      "stop chasing LV/RV systolic PV pressure decomposition on the accepted-complementarity surface; LV/RV PV is already 8/8 there",
      "focus the next phase on AV inflow residuals and all-chamber user0 transfer under the same accepted-boundary readbacks",
      "use the pre-accepted active/mixed pressure residuals only as evidence that raw user0 needs the accepted-state chamber/valve contract before atrial tuning resumes",
    ];
  }
  return [
    "Phase 5CT does not add enough localization to justify runtime adoption",
    "keep the morphology checker as the gate and do not reopen LandAtrial tuning",
  ];
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

function failedPressureNotes(results: readonly PointResult[], variantId: VariantId): readonly string[] {
  return results
    .filter((result) => result.variantId === variantId && result.pressureDiagnostics)
    .flatMap((result) => {
      const diagnostics = result.pressureDiagnostics!;
      return (["LV", "RV"] as const)
        .filter((side) => diagnostics[side].pvBadge !== "ok")
        .map((side) => {
          const diagnostic = diagnostics[side];
          return `${result.pointId}/${side}: pv=${diagnostic.pvBadge}, attribution=${diagnostic.attribution}, totalPeaks=${diagnostic.total.prominentPeakCount}, totalTroughs=${diagnostic.total.prominentTroughCount}, activePeaks=${diagnostic.active.prominentPeakCount}, activeTroughs=${diagnostic.active.prominentTroughCount}, passivePeaks=${diagnostic.passive.prominentPeakCount}, passiveTroughs=${diagnostic.passive.prominentTroughCount}`;
        });
    });
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CT variant summary ${id}.`);
  return summary;
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : Number.NaN;
}

function maxFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : null;
}

function maxByMagnitude<T extends { readonly value: number }>(values: readonly T[]): T | null {
  return values.length > 0 ? [...values].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0] : null;
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null ? null : round(value);
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

export function writeVentricularPressureDecompositionPhase5CTEvidence(): Evidence {
  const evidence = buildVentricularPressureDecompositionPhase5CTEvidence();
  const outPath = path.resolve(process.cwd(), VENTRICULAR_PRESSURE_DECOMPOSITION_PHASE5CT_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeVentricularPressureDecompositionPhase5CTEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
