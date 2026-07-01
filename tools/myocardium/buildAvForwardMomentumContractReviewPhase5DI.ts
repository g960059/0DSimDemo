import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import type { ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState, type SteadyMeasurement } from "@/engine/measure";
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
import { lastCompleteBeat, phaseOf } from "@/engine/verification/shapeMetrics";

export const AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID =
  "av-forward-momentum-contract-review-phase5di-result-v1" as const;
export const AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_RESULT_PATH =
  "data/myocardium/protocols/av-forward-momentum-contract-review-phase5di-result-v1.json" as const;

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
  | "forward-momentum-projection-tv";

type PointSpec = {
  readonly id: PointId;
  readonly label: string;
  readonly targetTBVMl: number;
  readonly params: Partial<CoreRuntimeParams>;
};

type AtrialAvPlaneActiveOverride = {
  readonly avPlaneGainMl?: number;
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
  readonly atrialAvPlaneOverride: AvPlaneOverride;
  readonly avValveBoundaryMode:
    | "accepted-state-valve-pressure-flow"
    | "accepted-state-valve-pressure-flow-forward-momentum-projection";
  readonly avValveBoundaryTargetValves: readonly ("MV" | "TV")[];
  readonly forwardMomentumMinAreaRatio: number | null;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type ProjectionReadback = {
  readonly dutyFraction: number;
  readonly impulseMeanAbsMlPerSec: number;
  readonly excessMeanMlPerSec: number;
  readonly areaScaleMean: number | null;
  readonly areaScaleMin: number | null;
  readonly ceilingMeanMlPerSec: number | null;
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
  readonly projectionReadbacks: Readonly<Record<"MV" | "TV", ProjectionReadback>> | null;
  readonly visualSvg: string | null;
  readonly messages: readonly string[];
  readonly errorMessage: string | null;
};

type InternalRun = PointResult & {
  readonly measurement: SteadyMeasurement | null;
  readonly beat: readonly SimSample[];
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
  readonly maxTvProjectionDutyFraction: number;
  readonly maxTvProjectionImpulseMeanAbsMlPerSec: number;
  readonly firstFailedPoint: PointId | null;
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID;
  readonly phase: "5DI";
  readonly downloadsDirectory: string;
  readonly downloadsIndexHtml: string;
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "representative-normal-sinus-envelope";
    readonly objective:
      "owner visual trace review plus bounded-duty readbacks for the Phase 5DH forward-momentum projection lead";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly points: readonly PointSpec[];
  readonly results: readonly PointResult[];
  readonly variantSummaries: readonly VariantSummary[];
  readonly classification: {
    readonly baselineGrossPass: string;
    readonly projectionGrossPass: string;
    readonly projectionMvfTvf: { readonly mvfOk: string; readonly tvfOk: string };
    readonly projectionOutputPreserved: string;
    readonly contractilityLowTvfOk: boolean;
    readonly maxTvProjectionDutyFraction: number;
    readonly maxTvProjectionImpulseMeanAbsMlPerSec: number;
    readonly decision:
      | "visual-review-required-before-adoption"
      | "configuration-or-readback-gap"
      | "projection-breaks-envelope";
    readonly notes: readonly string[];
  };
  readonly claimBoundary: {
    readonly noRuntimeDefaultAdoption: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

type Trace = { readonly x: number; readonly y: number };
type Series = {
  readonly label: string;
  readonly color: string;
  readonly points: readonly Trace[];
  readonly dashed?: boolean;
};

const profile = resolveVerificationProfile("fitFast");
const DOWNLOAD_BUNDLE_NAME = "0dsim-morphology-review-phase5di";
const DOWNLOAD_DIR = path.join(os.homedir(), "Downloads", DOWNLOAD_BUNDLE_NAME);
const INDEX_HTML = path.join(DOWNLOAD_DIR, "index.html");
const DISPLAY_DOWNLOAD_DIR = `~/Downloads/${DOWNLOAD_BUNDLE_NAME}`;
const DISPLAY_INDEX_HTML = `${DISPLAY_DOWNLOAD_DIR}/index.html`;

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

export function buildAvForwardMomentumContractReviewPhase5DIEvidence(): Evidence {
  mkdirSync(DOWNLOAD_DIR, { recursive: true });
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
    ),
    acceptedUser0Variant(
      "forward-momentum-projection-tv",
      "TV-only valve-area forward-momentum projection",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-forward-momentum-projection",
      ["TV"],
      0.05,
    ),
  ] as const;

  const runMap = new Map<string, InternalRun>();
  for (const variant of variants) {
    for (const point of POINTS) {
      const run = runPoint(variant, point);
      runMap.set(`${variant.id}:${point.id}`, run);
    }
  }

  const htmlSections: string[] = [];
  for (const point of POINTS) {
    const baseline = requiredRun(runMap, "pressure-flow-user0-inlet-held-release-baseline", point.id);
    const projection = requiredRun(runMap, "forward-momentum-projection-tv", point.id);
    const svgName = `baseline-vs-forward-momentum-tv__${point.id}.svg`;
    writeFileSync(path.join(DOWNLOAD_DIR, svgName), renderComparisonSvg(point, baseline, projection));
    htmlSections.push(renderComparisonHtml(point, baseline, projection, svgName));
  }

  const results = [...runMap.values()].map(stripInternalRun);
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_ID,
    phase: "5DI",
    downloadsDirectory: DISPLAY_DOWNLOAD_DIR,
    downloadsIndexHtml: DISPLAY_INDEX_HTML,
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "representative-normal-sinus-envelope",
      objective:
        "owner visual trace review plus bounded-duty readbacks for the Phase 5DH forward-momentum projection lead",
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
      noValveQdotRootZcTrefSourceStressTuning: true,
      noClinicalScientificValidation: true,
    },
  } satisfies Omit<Evidence, "normalizedSha256">;
  const evidence = {
    ...evidenceWithoutHash,
    normalizedSha256: hashStable(evidenceWithoutHash),
  };
  writeFileSync(INDEX_HTML, renderIndexHtml(evidence, htmlSections));
  writeFileSync(path.join(DOWNLOAD_DIR, "summary.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

function acceptedUser0Variant(
  id: VariantId,
  label: string,
  atrialAvPlaneOverride: AvPlaneOverride,
  avValveBoundaryMode: VariantSpec["avValveBoundaryMode"],
  avValveBoundaryTargetValves: readonly ("MV" | "TV")[],
  forwardMomentumMinAreaRatio: number | null,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id,
    label,
    atrialAvPlaneOverride,
    avValveBoundaryMode,
    avValveBoundaryTargetValves,
    forwardMomentumMinAreaRatio,
    experimentalOptions: withAvBoundaryMode(
      withAtrialAvPlaneOverride(resolved.experimentalOptions, atrialAvPlaneOverride),
      `phase5di-${id}`,
      avValveBoundaryMode,
      avValveBoundaryTargetValves,
      forwardMomentumMinAreaRatio,
    ),
  };
}

function withAvBoundaryMode(
  experimentalOptions: ModelCoreExperimentalOptions,
  mechanismId: string,
  avValveBoundaryMode: VariantSpec["avValveBoundaryMode"],
  avValveBoundaryTargetValves: readonly ("MV" | "TV")[],
  forwardMomentumMinAreaRatio: number | null,
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
      grossVentricularMorphologyOk: grossOk(morphology),
      morphologyStatus: morphology?.status ?? "not-measured",
      failedLabels: morphology
        ? morphology.results.filter((result) => result.status === "failed").map((result) => result.label)
        : ["not-measured"],
      badges: morphology?.badges ?? null,
      metrics: measurement ? metricDigest(measurement.metrics) : null,
      projectionReadbacks: beat.length > 0
        ? { MV: projectionReadback(beat, "MV"), TV: projectionReadback(beat, "TV") }
        : null,
      visualSvg: null,
      messages: morphology ? conciseMorphologyMessages(morphology) : ["Morphology check not measured."],
      errorMessage: null,
      measurement,
      beat,
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
      projectionReadbacks: null,
      visualSvg: null,
      messages: ["Morphology check not measured."],
      errorMessage: error instanceof Error ? error.message : String(error),
      measurement: null,
      beat: [],
    };
  }
}

function projectionReadback(beat: readonly SimSample[], valve: "MV" | "TV"): ProjectionReadback {
  const prefix = valve === "MV" ? "MV" : "TV";
  const appliedKey = `${prefix}_acceptedBoundaryForwardMomentumProjectionApplied01` as keyof SimSample;
  const impulseKey = `${prefix}_acceptedBoundaryForwardMomentumProjectionImpulse` as keyof SimSample;
  const excessKey = `${prefix}_acceptedBoundaryForwardMomentumExcess` as keyof SimSample;
  const areaScaleKey = `${prefix}_acceptedBoundaryForwardMomentumAreaScale` as keyof SimSample;
  const ceilingKey = `${prefix}_acceptedBoundaryForwardMomentumCeiling` as keyof SimSample;
  return {
    dutyFraction: round(fraction(beat, (sample) => numeric(sample, appliedKey) > 0.5)),
    impulseMeanAbsMlPerSec: round(meanAbsForKey(beat, impulseKey)),
    excessMeanMlPerSec: round(meanForKey(beat, excessKey) ?? 0),
    areaScaleMean: roundNullable(meanForKey(beat, areaScaleKey)),
    areaScaleMin: roundNullable(minForKey(beat, areaScaleKey)),
    ceilingMeanMlPerSec: roundNullable(meanForKey(beat, ceilingKey)),
  };
}

function stripInternalRun(run: InternalRun): PointResult {
  const { measurement: _measurement, beat: _beat, ...result } = run;
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
  const tvReadbacks = own.flatMap((result) => result.projectionReadbacks ? [result.projectionReadbacks.TV] : []);
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
    maxTvProjectionDutyFraction: round(Math.max(0, ...tvReadbacks.map((readback) => readback.dutyFraction))),
    maxTvProjectionImpulseMeanAbsMlPerSec: round(Math.max(0, ...tvReadbacks.map((readback) => readback.impulseMeanAbsMlPerSec))),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[], results: readonly PointResult[]): Evidence["classification"] {
  const baseline = requiredSummary(summaries, "pressure-flow-user0-inlet-held-release-baseline");
  const projection = requiredSummary(summaries, "forward-momentum-projection-tv");
  const contractilityLowProjection = requiredResult(results, "forward-momentum-projection-tv", "contractility-low-hr75");
  const readbackGap = results.some((result) =>
    result.variantId === "forward-momentum-projection-tv"
    && (
      !result.projectionReadbacks
      || !Number.isFinite(result.projectionReadbacks.TV.areaScaleMean ?? Number.NaN)
      || !Number.isFinite(result.projectionReadbacks.TV.ceilingMeanMlPerSec ?? Number.NaN)
    )
  );
  const projectionBreaks =
    projection.grossPassCount < baseline.grossPassCount
    || projection.mvfOkCount < baseline.mvfOkCount
    || projection.tvfOkCount < baseline.tvfOkCount;
  return {
    baselineGrossPass: `${baseline.grossPassCount}/${POINTS.length}`,
    projectionGrossPass: `${projection.grossPassCount}/${POINTS.length}`,
    projectionMvfTvf: { mvfOk: `${projection.mvfOkCount}/${POINTS.length}`, tvfOk: `${projection.tvfOkCount}/${POINTS.length}` },
    projectionOutputPreserved: `${projection.outputPreservedCount}/${POINTS.length}`,
    contractilityLowTvfOk: contractilityLowProjection.badges?.tvf === "ok",
    maxTvProjectionDutyFraction: projection.maxTvProjectionDutyFraction,
    maxTvProjectionImpulseMeanAbsMlPerSec: projection.maxTvProjectionImpulseMeanAbsMlPerSec,
    decision: readbackGap
      ? "configuration-or-readback-gap"
      : projectionBreaks
        ? "projection-breaks-envelope"
        : "visual-review-required-before-adoption",
    notes: [
      `Downloads visual review bundle: ${DISPLAY_INDEX_HTML}`,
      `Projection does not unlock runtime adoption until owner visual review accepts the raw traces.`,
      `Output preserved remains ${projection.outputPreservedCount}/${POINTS.length} under the simple CO range because low contractility intentionally lowers CO.`,
    ],
  };
}

function renderComparisonSvg(point: PointSpec, baseline: InternalRun, projection: InternalRun): string {
  const baselineSamples = baseline.beat.length > 0 ? baseline.beat : baseline.measurement?.samples ?? [];
  const projectionSamples = projection.beat.length > 0 ? projection.beat : projection.measurement?.samples ?? [];
  const width = 1320;
  const panelWidth = 420;
  const panelHeight = 290;
  const gap = 20;
  const left = 42;
  const top = 120;
  const rowGap = 52;
  const panel = (col: number, row: number) => ({
    x: left + col * (panelWidth + gap),
    y: top + row * (panelHeight + rowGap),
    width: panelWidth,
    height: panelHeight,
  });
  const panels = [
    renderPanel(panel(0, 0), "LV PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "baseline", color: "#ef4444", dashed: true, points: baselineSamples.map((s) => ({ x: s.VLV, y: s.LVP })) },
      { label: "projection", color: "#22c55e", points: projectionSamples.map((s) => ({ x: s.VLV, y: s.LVP })) },
    ]),
    renderPanel(panel(1, 0), "RV PV", "Volume (mL)", "Pressure (mmHg)", [
      { label: "baseline", color: "#ef4444", dashed: true, points: baselineSamples.map((s) => ({ x: s.VRV, y: s.RVP })) },
      { label: "projection", color: "#22c55e", points: projectionSamples.map((s) => ({ x: s.VRV, y: s.RVP })) },
    ]),
    renderPanel(panel(2, 0), "AV inflow", "Theta", "Flow (mL/s)", [
      { label: "QMV base", color: "#f472b6", dashed: true, points: baselineSamples.map((s) => ({ x: phaseOf(s), y: s.QMV })) },
      { label: "QMV proj", color: "#db2777", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: s.QMV })) },
      { label: "QTV base", color: "#38bdf8", dashed: true, points: baselineSamples.map((s) => ({ x: phaseOf(s), y: s.QTV })) },
      { label: "QTV proj", color: "#22c55e", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: s.QTV })) },
    ]),
    renderPanel(panel(0, 1), "TV accepted state/readback", "Theta", "Value", [
      { label: "xiTV", color: "#38bdf8", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: s.xiTV })) },
      { label: "area scale", color: "#facc15", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: num(s, "TV_acceptedBoundaryForwardMomentumAreaScale") })) },
      { label: "duty", color: "#f97316", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: num(s, "TV_acceptedBoundaryForwardMomentumProjectionApplied01") })) },
    ]),
    renderPanel(panel(1, 1), "Right pressure timing", "Theta", "Pressure (mmHg)", [
      { label: "RVP base", color: "#60a5fa", dashed: true, points: baselineSamples.map((s) => ({ x: phaseOf(s), y: s.RVP })) },
      { label: "RVP proj", color: "#2563eb", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: s.RVP })) },
      { label: "RAP base", color: "#67e8f9", dashed: true, points: baselineSamples.map((s) => ({ x: phaseOf(s), y: s.RAP })) },
      { label: "RAP proj", color: "#22d3ee", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: s.RAP })) },
    ]),
    renderPanel(panel(2, 1), "Projection impulse/excess", "Theta", "mL/s", [
      { label: "impulse", color: "#f97316", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: num(s, "TV_acceptedBoundaryForwardMomentumProjectionImpulse") })) },
      { label: "excess", color: "#facc15", points: projectionSamples.map((s) => ({ x: phaseOf(s), y: num(s, "TV_acceptedBoundaryForwardMomentumExcess") })) },
    ]),
  ].join("\n");
  const projectionTv = projection.projectionReadbacks?.TV;
  const title = `${point.label}: baseline vs TV forward-momentum projection`;
  const badgeText = `baseline ${badgeString(baseline.badges)}  ->  projection ${badgeString(projection.badges)}`;
  const projectionText = projectionTv
    ? `TV projection duty ${projectionTv.dutyFraction}, impulseMeanAbs ${projectionTv.impulseMeanAbsMlPerSec} mL/s, excessMean ${projectionTv.excessMeanMlPerSec} mL/s, areaScaleMin ${projectionTv.areaScaleMin}`
    : "TV projection readback unavailable";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="830" viewBox="0 0 ${width} 830">
  <rect width="100%" height="100%" fill="#0b1120"/>
  <text x="42" y="40" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(title)}</text>
  <text x="42" y="68" fill="#a7b0c0" font-family="Arial, sans-serif" font-size="14">${escapeXml(badgeText)}</text>
  <text x="42" y="90" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">${escapeXml(projectionText)}</text>
  ${panels}
</svg>`;
}

function renderComparisonHtml(point: PointSpec, baseline: InternalRun, projection: InternalRun, svgName: string): string {
  const rows = [
    ["baseline badges", badgeString(baseline.badges)],
    ["projection badges", badgeString(projection.badges)],
    ["baseline metrics", baseline.metrics ? JSON.stringify(baseline.metrics) : "n/a"],
    ["projection metrics", projection.metrics ? JSON.stringify(projection.metrics) : "n/a"],
    ["TV projection", projection.projectionReadbacks ? JSON.stringify(projection.projectionReadbacks.TV) : "n/a"],
  ].map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join("");
  const messages = projection.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("");
  const ok = projection.grossVentricularMorphologyOk && projection.settled && projection.healthStatus === "ok";
  return `<section class="run ${ok ? "ok" : "fail"}">
  <header>
    <div>
      <h2>${escapeHtml(point.label)}</h2>
      <p>Baseline vs TV-only forward-momentum projection. Inspect raw PV and AV inflow traces before any adoption.</p>
    </div>
    <strong>${ok ? "OK" : "CHECK"}</strong>
  </header>
  <img src="${escapeHtml(svgName)}" alt="${escapeHtml(point.label)}"/>
  <details open><summary>details</summary><table>${rows}</table><ul>${messages}</ul></details>
</section>`;
}

function renderPanel(
  rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  title: string,
  xLabel: string,
  yLabel: string,
  series: readonly Series[],
): string {
  const finitePoints = series.flatMap((line) => line.points).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const xs = finitePoints.map((point) => point.x);
  const ys = finitePoints.map((point) => point.y);
  const xDomain = paddedDomain(xs);
  const yDomain = paddedDomain(ys);
  const plot = { x: rect.x + 44, y: rect.y + 30, width: rect.width - 64, height: rect.height - 62 };
  const sx = (value: number) => plot.x + ((value - xDomain[0]) / Math.max(xDomain[1] - xDomain[0], 1e-9)) * plot.width;
  const sy = (value: number) => plot.y + plot.height - ((value - yDomain[0]) / Math.max(yDomain[1] - yDomain[0], 1e-9)) * plot.height;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const x = plot.x + plot.width * fraction;
    const y = plot.y + plot.height * fraction;
    return `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="#1f2937" stroke-width="1"/>
<line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#1f2937" stroke-width="1"/>`;
  }).join("\n");
  const lines = series.map((line) => {
    const points = line.points
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => `${round(sx(point.x))},${round(sy(point.y))}`)
      .join(" ");
    return `<polyline points="${points}" fill="none" stroke="${line.color}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"${line.dashed ? ' stroke-dasharray="7 6"' : ""}/>`;
  }).join("\n");
  const legend = series.map((line, index) =>
    `<text x="${plot.x + 6 + index * 78}" y="${rect.y + 22}" fill="${line.color}" font-family="Arial, sans-serif" font-size="11">${escapeXml(line.label)}</text>`
  ).join("\n");
  return `<g>
  <text x="${rect.x}" y="${rect.y + 20}" fill="#e5e7eb" font-family="Arial, sans-serif" font-size="16" font-weight="700">${escapeXml(title)}</text>
  ${legend}
  <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#111827" stroke="#334155" stroke-width="1"/>
  ${grid}
  ${lines}
  <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 8}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">${escapeXml(xLabel)}</text>
  <text x="${rect.x + 12}" y="${plot.y + plot.height / 2}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" transform="rotate(-90 ${rect.x + 12} ${plot.y + plot.height / 2})" text-anchor="middle">${escapeXml(yLabel)}</text>
</g>`;
}

function renderIndexHtml(evidence: Evidence, sections: readonly string[]): string {
  const summaries = evidence.variantSummaries.map((summary) =>
    `<tr><td>${escapeHtml(summary.variantId)}</td><td>${summary.grossPassCount}/${POINTS.length}</td><td>${summary.lvPvOkCount}/${POINTS.length}</td><td>${summary.rvPvOkCount}/${POINTS.length}</td><td>${summary.mvfOkCount}/${POINTS.length}</td><td>${summary.tvfOkCount}/${POINTS.length}</td><td>${summary.outputPreservedCount}/${POINTS.length}</td><td>${summary.maxTvProjectionDutyFraction}</td><td>${summary.maxTvProjectionImpulseMeanAbsMlPerSec}</td></tr>`
  ).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>0DSim Morphology Visual Review Phase 5DI</title>
  <style>
    body { margin: 0; padding: 28px; background: #050816; color: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .meta, p, li, td, th { color: #a7b0c0; }
    .meta { margin-bottom: 22px; }
    table { border-collapse: collapse; margin: 14px 0 24px; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #1f2937; padding: 7px 9px; vertical-align: top; }
    th { color: #d1d5db; text-align: left; background: #111827; }
    .run { border: 1px solid #1f2937; border-radius: 8px; margin: 22px 0; padding: 14px; background: #0b1120; }
    .run header { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
    .run h2 { margin: 0; font-size: 20px; }
    .run strong { border-radius: 999px; padding: 6px 10px; font-size: 12px; letter-spacing: .05em; }
    .run.ok strong { background: #064e3b; color: #a7f3d0; }
    .run.fail strong { background: #7f1d1d; color: #fecaca; }
    img { width: 100%; max-width: 1320px; display: block; margin: 12px auto; border: 1px solid #1f2937; border-radius: 6px; }
    details { margin-top: 10px; }
    summary { cursor: pointer; color: #d1d5db; }
    code { color: #f8fafc; background: #111827; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>0DSim Morphology Visual Review Phase 5DI</h1>
  <div class="meta">
    <div>Purpose: owner visual review for the Phase 5DH TV forward-momentum projection lead.</div>
    <div>Artifact hash: <code>${escapeHtml(evidence.normalizedSha256)}</code></div>
    <div>Decision: <code>${escapeHtml(evidence.classification.decision)}</code></div>
    <div>Claim boundary: no runtime/default adoption; visual review required before shadow/default claim.</div>
  </div>
  <table>
    <thead><tr><th>Variant</th><th>Gross</th><th>LV PV</th><th>RV PV</th><th>MVF</th><th>TVF</th><th>Output</th><th>Max TV duty</th><th>Max TV impulse</th></tr></thead>
    <tbody>${summaries}</tbody>
  </table>
  ${sections.join("\n")}
</body>
</html>`;
}

function requiredRun(map: ReadonlyMap<string, InternalRun>, variantId: VariantId, pointId: PointId): InternalRun {
  const run = map.get(`${variantId}:${pointId}`);
  if (!run) throw new Error(`Missing run ${variantId}/${pointId}.`);
  return run;
}

function requiredResult(results: readonly PointResult[], variantId: VariantId, pointId: PointId): PointResult {
  const result = results.find((entry) => entry.variantId === variantId && entry.pointId === pointId);
  if (!result) throw new Error(`Missing result ${variantId}/${pointId}.`);
  return result;
}

function requiredSummary(summaries: readonly VariantSummary[], variantId: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === variantId);
  if (!summary) throw new Error(`Missing summary ${variantId}.`);
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

function meanAbsForKey(samples: readonly SimSample[], key: keyof SimSample): number {
  const values = samples.map((sample) => Math.abs(numeric(sample, key))).filter(Number.isFinite);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function minForKey(samples: readonly SimSample[], key: keyof SimSample): number | null {
  const values = samples.map((sample) => numeric(sample, key)).filter(Number.isFinite);
  if (values.length === 0) return null;
  return Math.min(...values);
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = sample[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

function num(sample: SimSample, key: keyof SimSample): number {
  const value = numeric(sample, key);
  return Number.isFinite(value) ? value : 0;
}

function badgeString(badges: MorphologyBadgeSummary | null): string {
  return badges
    ? `LV ${badges.lvPv}, RV ${badges.rvPv}, LA ${badges.laPv}, RA ${badges.raPv}, MVF ${badges.mvf}, TVF ${badges.tvf}, LAP ${badges.lapWaveform}, RAP ${badges.rapWaveform}`
    : "n/a";
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (Math.abs(max - min) < 1e-9) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.06;
  return [min - pad, max + pad];
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value;
}

function roundNullable(value: number | null): number | null {
  return value == null ? null : round(value);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeHtml(value: string): string {
  return escapeXml(value);
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

export function writeAvForwardMomentumContractReviewPhase5DIEvidence(): Evidence {
  const evidence = buildAvForwardMomentumContractReviewPhase5DIEvidence();
  const outPath = path.resolve(process.cwd(), AV_FORWARD_MOMENTUM_CONTRACT_REVIEW_PHASE5DI_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAvForwardMomentumContractReviewPhase5DIEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    downloadsIndexHtml: evidence.downloadsIndexHtml,
    classification: evidence.classification,
  }, null, 2));
}
