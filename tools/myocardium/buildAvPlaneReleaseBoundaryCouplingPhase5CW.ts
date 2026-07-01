import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  resolveModelCoreRuntimeActiveSource,
} from "@/engine/myocardium/runtimeActiveSource";
import type { CoreRuntimeParams, OverrideBlock, SimMetrics, SimSample, SimulationHealth } from "@/engine/protocol";
import type { SettleStatus } from "@/engine/settling";
import {
  morphologyCheckSummaryFromSamples,
  type MorphologyBadgeSummary,
  type MorphologyCheckSummary,
} from "@/engine/verification/morphologyCheck";
import { resolveVerificationProfile } from "@/engine/verification/profiles";
import {
  lastCompleteBeat,
  localExtrema,
  phaseInWindow,
  phaseOf,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";

export const AVPLANE_RELEASE_BOUNDARY_COUPLING_PHASE5CW_ID =
  "avplane-release-boundary-coupling-phase5cw-result-v1" as const;
export const AVPLANE_RELEASE_BOUNDARY_COUPLING_PHASE5CW_RESULT_PATH =
  "data/myocardium/protocols/avplane-release-boundary-coupling-phase5cw-result-v1.json" as const;

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
  | "accepted-av-complementarity2-legacy-atria"
  | "accepted-av-complementarity2-user0-current-avplane"
  | "accepted-av-complementarity2-user0-both-avplane-off-reference"
  | "accepted-av-complementarity2-user0-both-stateful-release"
  | "accepted-av-complementarity2-user0-la-inlet-held-release"
  | "accepted-av-complementarity2-user0-ra-inlet-held-release"
  | "accepted-av-complementarity2-user0-both-inlet-held-release";

type ResidualCause =
  | "not-measured"
  | "clean-biphasic"
  | "accepted-boundary-diode-or-qdot"
  | "accepted-boundary-complementarity-leak"
  | "av-plane-release-aligned"
  | "atrial-pressure-waveform-aligned"
  | "pressure-gradient-second-pulse"
  | "valve-state-chatter"
  | "extra-wave-unattributed";

type PointSpec = {
  readonly id: PointId;
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
  readonly closurePath: "lv-rv-land-legacy-atria" | "current-user0-all-chamber-landatrial";
  readonly atrialAvPlaneOverride: AvPlaneOverride | null;
  readonly experimentalOptions: ModelCoreExperimentalOptions;
};

type MetricDigest = Pick<
  SimMetrics,
  "AoPMean" | "PAPMean" | "CO_L" | "CO_R" | "LAPMean" | "RAPMean" | "EF_LApprox" | "EF_RApprox"
>;

type AvResidual = {
  readonly valve: "MV" | "TV";
  readonly measured: boolean;
  readonly morphologyOk: boolean;
  readonly likelyCause: ResidualCause;
  readonly diastolicPeakCount: number | null;
  readonly extraPeakCount: number | null;
  readonly ePeakTheta: number | null;
  readonly aPeakTheta: number | null;
  readonly extraPeakTheta: number | null;
  readonly acceptedAppliedFraction: number;
  readonly acceptedDiodeHitFraction: number;
  readonly acceptedQDotHitFraction: number;
  readonly acceptedComplementarityLeakFraction: number;
  readonly atrialPressurePeakCount: number | null;
  readonly atrialPressureTroughCount: number | null;
  readonly atrialPressureExtraAlignmentTheta: number | null;
  readonly pressureGradientPeakCount: number | null;
  readonly pressureGradientTroughCount: number | null;
  readonly pressureGradientExtraAlignmentTheta: number | null;
  readonly valveStateExtremaCount: number | null;
  readonly valveStateExtraAlignmentTheta: number | null;
  readonly avPlaneReadbackAvailable: boolean;
  readonly avPlaneVelocityExtremaCount: number | null;
  readonly avPlaneVelocityExtraAlignmentTheta: number | null;
  readonly avPlaneEffectiveVolumeCorrectionRangeMl: number | null;
  readonly avPlaneReleaseInletOpenHoldMean: number | null;
  readonly avPlaneReleaseInletOpenThresholdMean: number | null;
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
  readonly avResiduals: Readonly<Record<"MV" | "TV", AvResidual>> | null;
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
  readonly causeCounts: Readonly<Record<ResidualCause, number>>;
  readonly mvCauseCounts: Readonly<Record<ResidualCause, number>>;
  readonly tvCauseCounts: Readonly<Record<ResidualCause, number>>;
  readonly firstFailedPoint: PointId | null;
};

type Classification = {
  readonly acceptedLegacyGrossPass: string;
  readonly user0CurrentAvPlaneGrossPass: string;
  readonly user0StaticBothAvPlaneOffReferenceGrossPass: string;
  readonly user0BothStatefulReleaseGrossPass: string;
  readonly user0LaInletHeldReleaseGrossPass: string;
  readonly user0RaInletHeldReleaseGrossPass: string;
  readonly user0BothInletHeldReleaseGrossPass: string;
  readonly user0CurrentMvfTvf: {
    readonly mvfOk: string;
    readonly tvfOk: string;
  };
  readonly releaseCouplingMvfTvf: {
    readonly bothStatefulMvfOk: string;
    readonly bothStatefulTvfOk: string;
    readonly laInletHeldMvfOk: string;
    readonly laInletHeldTvfOk: string;
    readonly raInletHeldMvfOk: string;
    readonly raInletHeldTvfOk: string;
    readonly bothInletHeldMvfOk: string;
    readonly bothInletHeldTvfOk: string;
  };
  readonly decision:
    | "inlet-held-release-improves-user0-transfer"
    | "inlet-held-release-partial-but-static-off-reference-remains-better"
    | "inlet-held-release-does-not-rescue-user0-transfer"
    | "accepted-legacy-baseline-unusable"
    | "configuration-or-readback-gap";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AVPLANE_RELEASE_BOUNDARY_COUPLING_PHASE5CW_ID;
  readonly phase: "5CW";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "targeted-normal-low-preload-smoke";
    readonly diagnosticQuestion:
      "whether holding stateful LandAtrial AV-plane release during AV-inlet opening separates AV-plane recoil from accepted-boundary AV inflow residuals";
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
    readonly noLandAtrialParameterTuningUnlock: true;
    readonly noA1A2Reopen: true;
    readonly noValveQdotRootZcTrefSourceStressTuning: true;
    readonly noClinicalScientificValidation: true;
  };
  readonly normalizedSha256: string;
};

const profile = resolveVerificationProfile("fitFast");

const POINTS: readonly PointSpec[] = [
  { id: "normal-hr75", targetTBVMl: 5600, params: { HR: 75 } },
  { id: "low-preload-hr75", targetTBVMl: 4800, params: { HR: 75 } },
];

export function buildAvPlaneReleaseBoundaryCouplingPhase5CWEvidence(): Evidence {
  const slowRelease = {
    avPlaneDescentRiseTauSec: 0.018,
    avPlaneDescentReleaseTauSec: 0.140,
    avPlaneDescentMaxRiseVelocity01PerSec: 24,
    avPlaneDescentMaxReleaseVelocity01PerSec: 7,
  } as const;
  const inletHeldRelease = {
    ...slowRelease,
    avPlaneDescentReleaseInletOpenHold: 1,
    avPlaneDescentReleaseInletOpenThreshold: 0.08,
  } as const;
  const variants = [
    acceptedLegacyAtriaVariant(),
    acceptedUser0Variant("accepted-av-complementarity2-user0-current-avplane", "Current user0 LandAtrial AV-plane", null),
    acceptedUser0Variant(
      "accepted-av-complementarity2-user0-both-avplane-off-reference",
      "Current user0 with LA/RA AV-plane gains off reference",
      { LA: { avPlaneGainMl: 0 }, RA: { avPlaneGainMl: 0 } },
    ),
    acceptedUser0Variant(
      "accepted-av-complementarity2-user0-both-stateful-release",
      "Current user0 with LA/RA stateful asymmetric AV-plane release",
      { LA: slowRelease, RA: slowRelease },
    ),
    acceptedUser0Variant(
      "accepted-av-complementarity2-user0-la-inlet-held-release",
      "Current user0 with LA stateful AV-plane release held during MV opening",
      { LA: inletHeldRelease },
    ),
    acceptedUser0Variant(
      "accepted-av-complementarity2-user0-ra-inlet-held-release",
      "Current user0 with RA stateful AV-plane release held during TV opening",
      { RA: inletHeldRelease },
    ),
    acceptedUser0Variant(
      "accepted-av-complementarity2-user0-both-inlet-held-release",
      "Current user0 with LA/RA stateful AV-plane release held during AV inlet opening",
      { LA: inletHeldRelease, RA: inletHeldRelease },
    ),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AVPLANE_RELEASE_BOUNDARY_COUPLING_PHASE5CW_ID,
    phase: "5CW",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "targeted-normal-low-preload-smoke",
      diagnosticQuestion:
        "whether holding stateful LandAtrial AV-plane release during AV-inlet opening separates AV-plane recoil from accepted-boundary AV inflow residuals",
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
      noLandAtrialParameterTuningUnlock: true,
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

function acceptedLegacyAtriaVariant(): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  return {
    id: "accepted-av-complementarity2-legacy-atria",
    label: "LV/RV Land legacy atria with accepted-state AV complementarity",
    closurePath: "lv-rv-land-legacy-atria",
    atrialAvPlaneOverride: null,
    experimentalOptions: withAcceptedComplementarity(resolved.experimentalOptions, "phase5cw-accepted-legacy-atria"),
  };
}

function acceptedUser0Variant(
  id: Exclude<VariantId, "accepted-av-complementarity2-legacy-atria">,
  label: string,
  atrialAvPlaneOverride: AvPlaneOverride | null,
): VariantSpec {
  const resolved = resolveModelCoreRuntimeActiveSource({
    mode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
    runtimeParams: DEFAULT_PARAMS,
  });
  const experimentalOptions = atrialAvPlaneOverride
    ? withAtrialAvPlaneOverride(resolved.experimentalOptions, atrialAvPlaneOverride)
    : resolved.experimentalOptions;
  return {
    id,
    label,
    closurePath: "current-user0-all-chamber-landatrial",
    atrialAvPlaneOverride,
    experimentalOptions: withAcceptedComplementarity(experimentalOptions, `phase5cw-${id}`),
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
      avResiduals: measurement
        ? {
          MV: avResidual(measurement.samples, "MV", morphology?.badges.mvf === "ok"),
          TV: avResidual(measurement.samples, "TV", morphology?.badges.tvf === "ok"),
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
      avResiduals: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function avResidual(
  samples: readonly SimSample[],
  valve: "MV" | "TV",
  morphologyOk: boolean,
): AvResidual {
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) return unmeasuredResidual(valve);
  const keys = valve === "MV"
    ? {
      flow: "QMV" as const,
      gradient: "dP_MV" as const,
      atrialPressure: "LAP" as const,
      valveState: "xiMV" as const,
      acceptedApplied: "MV_acceptedBoundaryApplied01" as const,
      acceptedDiode: "MV_acceptedBoundaryDiodeImpulse" as const,
      acceptedQDot: "MV_acceptedBoundaryQDotClampHit01" as const,
      acceptedComplementarity: "MV_acceptedBoundaryComplementarityResidualMlPerSec" as const,
      avPlaneVelocity: "LAAvPlaneDescentVelocity01PerSec" as const,
      avPlaneCorrection: "LAAvPlaneEffectiveVolumeCorrectionMl" as const,
      avPlaneReleaseHold: "LAAvPlaneDescentReleaseInletOpenHold" as const,
      avPlaneReleaseThreshold: "LAAvPlaneDescentReleaseInletOpenThreshold" as const,
    }
    : {
      flow: "QTV" as const,
      gradient: "dP_TV" as const,
      atrialPressure: "RAP" as const,
      valveState: "xiTV" as const,
      acceptedApplied: "TV_acceptedBoundaryApplied01" as const,
      acceptedDiode: "TV_acceptedBoundaryDiodeImpulse" as const,
      acceptedQDot: "TV_acceptedBoundaryQDotClampHit01" as const,
      acceptedComplementarity: "TV_acceptedBoundaryComplementarityResidualMlPerSec" as const,
      avPlaneVelocity: "RAAvPlaneDescentVelocity01PerSec" as const,
      avPlaneCorrection: "RAAvPlaneEffectiveVolumeCorrectionMl" as const,
      avPlaneReleaseHold: "RAAvPlaneDescentReleaseInletOpenHold" as const,
      avPlaneReleaseThreshold: "RAAvPlaneDescentReleaseInletOpenThreshold" as const,
    };
  const peaks = positiveValvePeaksDetailed([...beat], keys.flow, 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeak = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value)[0] ?? null;
  const extraPeakCount = Math.max(0, diastolic.length - 2);
  const extraPeakTheta = extraPeak?.theta ?? null;
  const acceptedAppliedFraction = fraction(beat, (sample) => numeric(sample, keys.acceptedApplied) > 0.5);
  const acceptedDiodeHitFraction = fraction(beat, (sample) => Math.abs(numeric(sample, keys.acceptedDiode)) > 1e-9);
  const acceptedQDotHitFraction = fraction(beat, (sample) => numeric(sample, keys.acceptedQDot) > 0.5);
  const acceptedComplementarityLeakFraction =
    fraction(beat, (sample) => numeric(sample, keys.acceptedComplementarity) > 10);
  const pressureGradientProminence = Math.max(valve === "MV" ? 0.5 : 0.35, 0.12 * rangeForKey(beat, keys.gradient));
  const gradientExtrema = [
    ...localExtrema([...beat], keys.gradient, "max", pressureGradientProminence),
    ...localExtrema([...beat], keys.gradient, "min", pressureGradientProminence),
  ];
  const atrialPressureProminence = Math.max(valve === "MV" ? 0.35 : 0.45, 0.12 * rangeForKey(beat, keys.atrialPressure));
  const atrialPressurePeaks = localExtrema([...beat], keys.atrialPressure, "max", atrialPressureProminence);
  const atrialPressureTroughs = localExtrema([...beat], keys.atrialPressure, "min", atrialPressureProminence);
  const valveStateRange = rangeForKey(beat, keys.valveState);
  const valveStateExtrema = [
    ...localExtrema([...beat], keys.valveState, "max", Math.max(0.03, 0.12 * valveStateRange)),
    ...localExtrema([...beat], keys.valveState, "min", Math.max(0.03, 0.12 * valveStateRange)),
  ];
  const avPlaneReadbackAvailable = beat.some((sample) => Number.isFinite(numeric(sample, keys.avPlaneVelocity)));
  const avPlaneVelocityExtrema = avPlaneReadbackAvailable
    ? [
      ...localExtrema([...beat], keys.avPlaneVelocity, "max", Math.max(0.05, 0.12 * rangeForKey(beat, keys.avPlaneVelocity))),
      ...localExtrema([...beat], keys.avPlaneVelocity, "min", Math.max(0.05, 0.12 * rangeForKey(beat, keys.avPlaneVelocity))),
    ]
    : [];
  const avPlaneEffectiveVolumeCorrectionRangeMl = avPlaneReadbackAvailable
    ? rangeForKey(beat, keys.avPlaneCorrection)
    : null;
  const avPlaneReleaseInletOpenHoldMean = avPlaneReadbackAvailable
    ? meanForKey(beat, keys.avPlaneReleaseHold)
    : null;
  const avPlaneReleaseInletOpenThresholdMean = avPlaneReadbackAvailable
    ? meanForKey(beat, keys.avPlaneReleaseThreshold)
    : null;
  const atrialPressureExtraAlignmentTheta =
    nearestThetaDistance(extraPeakTheta, [...atrialPressurePeaks, ...atrialPressureTroughs]);
  const pressureGradientExtraAlignmentTheta = nearestThetaDistance(extraPeakTheta, gradientExtrema);
  const valveStateExtraAlignmentTheta = nearestThetaDistance(extraPeakTheta, valveStateExtrema);
  const avPlaneVelocityExtraAlignmentTheta = avPlaneReadbackAvailable
    ? nearestThetaDistance(extraPeakTheta, avPlaneVelocityExtrema)
    : null;
  return {
    valve,
    measured: true,
    morphologyOk: morphologyOk || extraPeakCount === 0,
    likelyCause: classifyResidual({
      morphologyOk: morphologyOk || extraPeakCount === 0,
      extraPeakCount,
      acceptedDiodeHitFraction,
      acceptedQDotHitFraction,
      acceptedComplementarityLeakFraction,
      avPlaneReadbackAvailable,
      avPlaneVelocityExtremaCount: avPlaneVelocityExtrema.length,
      avPlaneVelocityExtraAlignmentTheta,
      atrialPressureExtraAlignmentTheta,
      pressureGradientExtraAlignmentTheta,
      valveStateExtraAlignmentTheta,
    }),
    diastolicPeakCount: diastolic.length,
    extraPeakCount,
    ePeakTheta: roundNullable(ePeak?.theta ?? null),
    aPeakTheta: roundNullable(aPeak?.theta ?? null),
    extraPeakTheta: roundNullable(extraPeakTheta),
    acceptedAppliedFraction: round(acceptedAppliedFraction),
    acceptedDiodeHitFraction: round(acceptedDiodeHitFraction),
    acceptedQDotHitFraction: round(acceptedQDotHitFraction),
    acceptedComplementarityLeakFraction: round(acceptedComplementarityLeakFraction),
    atrialPressurePeakCount: atrialPressurePeaks.length,
    atrialPressureTroughCount: atrialPressureTroughs.length,
    atrialPressureExtraAlignmentTheta: roundNullable(atrialPressureExtraAlignmentTheta),
    pressureGradientPeakCount: gradientExtrema.filter((entry) => entry.value >= 0).length,
    pressureGradientTroughCount: gradientExtrema.filter((entry) => entry.value < 0).length,
    pressureGradientExtraAlignmentTheta: roundNullable(pressureGradientExtraAlignmentTheta),
    valveStateExtremaCount: valveStateExtrema.length,
    valveStateExtraAlignmentTheta: roundNullable(valveStateExtraAlignmentTheta),
    avPlaneReadbackAvailable,
    avPlaneVelocityExtremaCount: avPlaneReadbackAvailable ? avPlaneVelocityExtrema.length : null,
    avPlaneVelocityExtraAlignmentTheta: roundNullable(avPlaneVelocityExtraAlignmentTheta),
    avPlaneEffectiveVolumeCorrectionRangeMl: roundNullable(avPlaneEffectiveVolumeCorrectionRangeMl),
    avPlaneReleaseInletOpenHoldMean: roundNullable(avPlaneReleaseInletOpenHoldMean),
    avPlaneReleaseInletOpenThresholdMean: roundNullable(avPlaneReleaseInletOpenThresholdMean),
  };
}

function classifyResidual(input: {
  readonly morphologyOk: boolean;
  readonly extraPeakCount: number;
  readonly acceptedDiodeHitFraction: number;
  readonly acceptedQDotHitFraction: number;
  readonly acceptedComplementarityLeakFraction: number;
  readonly avPlaneReadbackAvailable: boolean;
  readonly avPlaneVelocityExtremaCount: number;
  readonly avPlaneVelocityExtraAlignmentTheta: number | null;
  readonly atrialPressureExtraAlignmentTheta: number | null;
  readonly pressureGradientExtraAlignmentTheta: number | null;
  readonly valveStateExtraAlignmentTheta: number | null;
}): ResidualCause {
  if (input.morphologyOk && input.extraPeakCount === 0) return "clean-biphasic";
  if (input.acceptedComplementarityLeakFraction > 0.05) return "accepted-boundary-complementarity-leak";
  if (input.acceptedDiodeHitFraction > 0.12 || input.acceptedQDotHitFraction > 0.05) {
    return "accepted-boundary-diode-or-qdot";
  }
  if (
    input.avPlaneReadbackAvailable
    && input.avPlaneVelocityExtremaCount > 2
    && aligned(input.avPlaneVelocityExtraAlignmentTheta, 0.08)
  ) {
    return "av-plane-release-aligned";
  }
  if (aligned(input.atrialPressureExtraAlignmentTheta, 0.08)) return "atrial-pressure-waveform-aligned";
  if (aligned(input.pressureGradientExtraAlignmentTheta, 0.08)) return "pressure-gradient-second-pulse";
  if (aligned(input.valveStateExtraAlignmentTheta, 0.08)) return "valve-state-chatter";
  return input.extraPeakCount > 0 ? "extra-wave-unattributed" : "clean-biphasic";
}

function summarizeVariant(variant: VariantSpec, results: readonly PointResult[]): VariantSummary {
  const own = results.filter((result) => result.variantId === variant.id);
  const failures = own.filter((result) =>
    !result.grossVentricularMorphologyOk || !result.settled || result.healthStatus !== "ok"
  );
  const badgeOkCount = (badge: keyof MorphologyBadgeSummary) =>
    own.filter((result) => result.badges?.[badge] === "ok").length;
  const residuals = own.flatMap((result) =>
    result.avResiduals ? [result.avResiduals.MV, result.avResiduals.TV] : []
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
    causeCounts: countCauses(residuals.map((residual) => residual.likelyCause)),
    mvCauseCounts: countCauses(own.flatMap((result) => result.avResiduals ? [result.avResiduals.MV.likelyCause] : [])),
    tvCauseCounts: countCauses(own.flatMap((result) => result.avResiduals ? [result.avResiduals.TV.likelyCause] : [])),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(summaries: readonly VariantSummary[], results: readonly PointResult[]): Classification {
  const legacy = requiredSummary(summaries, "accepted-av-complementarity2-legacy-atria");
  const current = requiredSummary(summaries, "accepted-av-complementarity2-user0-current-avplane");
  const staticOff = requiredSummary(summaries, "accepted-av-complementarity2-user0-both-avplane-off-reference");
  const bothStateful = requiredSummary(summaries, "accepted-av-complementarity2-user0-both-stateful-release");
  const laInletHeld = requiredSummary(summaries, "accepted-av-complementarity2-user0-la-inlet-held-release");
  const raInletHeld = requiredSummary(summaries, "accepted-av-complementarity2-user0-ra-inlet-held-release");
  const bothInletHeld = requiredSummary(summaries, "accepted-av-complementarity2-user0-both-inlet-held-release");
  const currentGross = current.grossPassCount;
  const bestReleaseGross = Math.max(
    bothStateful.grossPassCount,
    laInletHeld.grossPassCount,
    raInletHeld.grossPassCount,
    bothInletHeld.grossPassCount,
  );
  const bestReleaseMvfTvf = Math.max(
    bothStateful.mvfOkCount + bothStateful.tvfOkCount,
    laInletHeld.mvfOkCount + laInletHeld.tvfOkCount,
    raInletHeld.mvfOkCount + raInletHeld.tvfOkCount,
    bothInletHeld.mvfOkCount + bothInletHeld.tvfOkCount,
  );
  const currentMvfTvf = current.mvfOkCount + current.tvfOkCount;
  const missingReadback = results.some((result) =>
    result.variantId !== "accepted-av-complementarity2-legacy-atria"
    && result.avResiduals
    && (!result.avResiduals.MV.avPlaneReadbackAvailable || !result.avResiduals.TV.avPlaneReadbackAvailable)
  );
  return {
    acceptedLegacyGrossPass: `${legacy.grossPassCount}/${POINTS.length}`,
    user0CurrentAvPlaneGrossPass: `${current.grossPassCount}/${POINTS.length}`,
    user0StaticBothAvPlaneOffReferenceGrossPass: `${staticOff.grossPassCount}/${POINTS.length}`,
    user0BothStatefulReleaseGrossPass: `${bothStateful.grossPassCount}/${POINTS.length}`,
    user0LaInletHeldReleaseGrossPass: `${laInletHeld.grossPassCount}/${POINTS.length}`,
    user0RaInletHeldReleaseGrossPass: `${raInletHeld.grossPassCount}/${POINTS.length}`,
    user0BothInletHeldReleaseGrossPass: `${bothInletHeld.grossPassCount}/${POINTS.length}`,
    user0CurrentMvfTvf: {
      mvfOk: `${current.mvfOkCount}/${POINTS.length}`,
      tvfOk: `${current.tvfOkCount}/${POINTS.length}`,
    },
    releaseCouplingMvfTvf: {
      bothStatefulMvfOk: `${bothStateful.mvfOkCount}/${POINTS.length}`,
      bothStatefulTvfOk: `${bothStateful.tvfOkCount}/${POINTS.length}`,
      laInletHeldMvfOk: `${laInletHeld.mvfOkCount}/${POINTS.length}`,
      laInletHeldTvfOk: `${laInletHeld.tvfOkCount}/${POINTS.length}`,
      raInletHeldMvfOk: `${raInletHeld.mvfOkCount}/${POINTS.length}`,
      raInletHeldTvfOk: `${raInletHeld.tvfOkCount}/${POINTS.length}`,
      bothInletHeldMvfOk: `${bothInletHeld.mvfOkCount}/${POINTS.length}`,
      bothInletHeldTvfOk: `${bothInletHeld.tvfOkCount}/${POINTS.length}`,
    },
    decision: legacy.grossPassCount < Math.ceil(0.5 * POINTS.length)
      ? "accepted-legacy-baseline-unusable"
      : missingReadback
        ? "configuration-or-readback-gap"
        : bestReleaseGross > currentGross || bestReleaseMvfTvf > currentMvfTvf
          ? (
            staticOff.grossPassCount > bestReleaseGross
              ? "inlet-held-release-partial-but-static-off-reference-remains-better"
              : "inlet-held-release-improves-user0-transfer"
          )
          : "inlet-held-release-does-not-rescue-user0-transfer",
    notes: [
      `Accepted legacy causes: ${formatCounts(legacy.causeCounts)}.`,
      `Current user0 causes: ${formatCounts(current.causeCounts)}.`,
      `Static both-off reference causes: ${formatCounts(staticOff.causeCounts)}.`,
      `Both stateful-release causes: ${formatCounts(bothStateful.causeCounts)}.`,
      `LA inlet-held release causes: ${formatCounts(laInletHeld.causeCounts)}.`,
      `RA inlet-held release causes: ${formatCounts(raInletHeld.causeCounts)}.`,
      `Both inlet-held release causes: ${formatCounts(bothInletHeld.causeCounts)}.`,
      `Current user0 residual notes: ${residualNotes(results, current.variantId).join(" | ") || "none"}.`,
      `Both inlet-held release residual notes: ${residualNotes(results, bothInletHeld.variantId).join(" | ") || "none"}.`,
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "configuration-or-readback-gap") {
    return [
      "fix AV-plane/readback availability before interpreting the user0 transfer ablation",
      "do not tune LandAtrial or valve parameters from this artifact",
    ];
  }
  if (classification.decision === "accepted-legacy-baseline-unusable") {
    return [
      "restore the accepted-complementarity legacy-atria baseline before attributing user0 transfer residuals",
    ];
  }
  if (classification.decision === "inlet-held-release-improves-user0-transfer") {
    return [
      "carry inlet-open-held AV-plane release timing into the next user0 transfer experiment without claiming atrial physiology acceptance",
      "preserve accepted-boundary complementarity and morphology checker gates; do not retune Land/source/root/qDot",
    ];
  }
  if (classification.decision === "inlet-held-release-partial-but-static-off-reference-remains-better") {
    return [
      "treat inlet-open-held AV-plane release timing as a contributor, but do not adopt it because static-off reference remains stronger",
      "next step should split atrial pressure waveform/release timing from accepted-boundary residuals before more LandAtrial tuning",
    ];
  }
  return [
    "inlet-open-held AV-plane release does not rescue user0 transfer; focus next on atrial pressure waveform and accepted AV boundary residuals before LandAtrial tuning",
    "keep A1/A2 frozen and do not use simple AV-plane gain off or release timing as an adoption path",
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

function residualNotes(results: readonly PointResult[], variantId: VariantId): readonly string[] {
  return results
    .filter((result) => result.variantId === variantId && result.avResiduals)
    .flatMap((result) => {
      const residuals = result.avResiduals!;
      return (["MV", "TV"] as const)
        .filter((valve) => residuals[valve].likelyCause !== "clean-biphasic")
        .map((valve) => {
          const residual = residuals[valve];
          return `${result.pointId}/${valve}: cause=${residual.likelyCause}, extra=${residual.extraPeakCount}, acceptedDiode=${residual.acceptedDiodeHitFraction}, acceptedLeak=${residual.acceptedComplementarityLeakFraction}, avPlaneAlign=${residual.avPlaneVelocityExtraAlignmentTheta}, atrialPressureAlign=${residual.atrialPressureExtraAlignmentTheta}, releaseHold=${residual.avPlaneReleaseInletOpenHoldMean}`;
        });
    });
}

function unmeasuredResidual(valve: "MV" | "TV"): AvResidual {
  return {
    valve,
    measured: false,
    morphologyOk: false,
    likelyCause: "not-measured",
    diastolicPeakCount: null,
    extraPeakCount: null,
    ePeakTheta: null,
    aPeakTheta: null,
    extraPeakTheta: null,
    acceptedAppliedFraction: 0,
    acceptedDiodeHitFraction: 0,
    acceptedQDotHitFraction: 0,
    acceptedComplementarityLeakFraction: 0,
    atrialPressurePeakCount: null,
    atrialPressureTroughCount: null,
    atrialPressureExtraAlignmentTheta: null,
    pressureGradientPeakCount: null,
    pressureGradientTroughCount: null,
    pressureGradientExtraAlignmentTheta: null,
    valveStateExtremaCount: null,
    valveStateExtraAlignmentTheta: null,
    avPlaneReadbackAvailable: false,
    avPlaneVelocityExtremaCount: null,
    avPlaneVelocityExtraAlignmentTheta: null,
    avPlaneEffectiveVolumeCorrectionRangeMl: null,
    avPlaneReleaseInletOpenHoldMean: null,
    avPlaneReleaseInletOpenThresholdMean: null,
  };
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CW variant summary ${id}.`);
  return summary;
}

function countCauses(causes: readonly ResidualCause[]): Readonly<Record<ResidualCause, number>> {
  const out: Record<ResidualCause, number> = {
    "not-measured": 0,
    "clean-biphasic": 0,
    "accepted-boundary-diode-or-qdot": 0,
    "accepted-boundary-complementarity-leak": 0,
    "av-plane-release-aligned": 0,
    "atrial-pressure-waveform-aligned": 0,
    "pressure-gradient-second-pulse": 0,
    "valve-state-chatter": 0,
    "extra-wave-unattributed": 0,
  };
  for (const cause of causes) out[cause]++;
  return out;
}

function formatCounts(counts: Readonly<Record<string, number>>): string {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${key}=${count}`)
    .join(", ") || "none";
}

function maxPeak<T extends { readonly value: number }>(peaks: readonly T[]): T | null {
  return peaks.length === 0 ? null : [...peaks].sort((a, b) => b.value - a.value)[0];
}

function fraction(samples: readonly SimSample[], predicate: (sample: SimSample) => boolean): number {
  return samples.length > 0 ? samples.filter(predicate).length / samples.length : 0;
}

function rangeForKey(samples: readonly SimSample[], key: keyof SimSample): number {
  const values = samples.map((sample) => numeric(sample, key)).filter(Number.isFinite);
  return values.length > 0 ? Math.max(...values) - Math.min(...values) : 0;
}

function meanForKey(samples: readonly SimSample[], key: keyof SimSample): number | null {
  const values = samples.map((sample) => numeric(sample, key)).filter(Number.isFinite);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function nearestThetaDistance(theta: number | null, points: readonly { readonly theta: number }[]): number | null {
  if (theta == null || points.length === 0) return null;
  return points.reduce((best, point) => Math.min(best, circularDistance(theta, point.theta)), Number.POSITIVE_INFINITY);
}

function circularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

function aligned(distance: number | null, tolerance: number): boolean {
  return distance != null && distance <= tolerance;
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : Number.NaN;
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

export function writeAvPlaneReleaseBoundaryCouplingPhase5CWEvidence(): Evidence {
  const evidence = buildAvPlaneReleaseBoundaryCouplingPhase5CWEvidence();
  const outPath = path.resolve(process.cwd(), AVPLANE_RELEASE_BOUNDARY_COUPLING_PHASE5CW_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAvPlaneReleaseBoundaryCouplingPhase5CWEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
