import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_PARAMS } from "@/constants";
import { type ModelCoreExperimentalOptions } from "@/engine/ModelCore";
import { measureSteady, settleToSteadyState } from "@/engine/measure";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_DEFAULT_MODE,
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

export const AV_FORWARD_MOMENTUM_PROJECTION_PHASE5DH_ID =
  "av-forward-momentum-projection-phase5dh-result-v1" as const;
export const AV_FORWARD_MOMENTUM_PROJECTION_PHASE5DH_RESULT_PATH =
  "data/myocardium/protocols/av-forward-momentum-projection-phase5dh-result-v1.json" as const;

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
  | "forward-momentum-projection-tv"
  | "forward-momentum-projection-both";

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
  readonly acceptedValveStateMean: number | null;
  readonly acceptedValveStateRange: number | null;
  readonly acceptedAreaRatioMean: number | null;
  readonly acceptedAreaRatioRange: number | null;
  readonly forwardMomentumProjectionAppliedFraction: number;
  readonly forwardMomentumProjectionImpulseIntegralMlPerSec: number;
  readonly passiveDiastasisGuardAppliedFraction: number;
  readonly passiveDiastasisGuardImpulseIntegralMlPerSec: number;
  readonly acceptedAtrialActiveMean: number | null;
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
  readonly baselineGrossPass: string;
  readonly baselineMvfTvf: { readonly mvfOk: string; readonly tvfOk: string };
  readonly bestVariantId: VariantId;
  readonly bestGrossPass: string;
  readonly bestMvfTvf: { readonly mvfOk: string; readonly tvfOk: string };
  readonly bestOutputPreserved: string;
  readonly contractilityLowTvfOutcome: {
    readonly baselineTvfOk: boolean;
    readonly bestTvfOk: boolean;
    readonly bestTvForwardMomentumProjectionAppliedFraction: number | null;
    readonly bestTvForwardMomentumProjectionImpulseIntegralMlPerSec: number | null;
  };
  readonly decision:
    | "forward-momentum-projection-rescues-frontier"
    | "forward-momentum-projection-partial-or-no-go"
    | "forward-momentum-projection-breaks-output-or-mv"
    | "configuration-or-readback-gap";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof AV_FORWARD_MOMENTUM_PROJECTION_PHASE5DH_ID;
  readonly phase: "5DH";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "representative-normal-sinus-envelope";
    readonly diagnosticQuestion:
      "whether valve-area forward-momentum projection removes the remaining contractility-low TVF third wave without weakening the morphology gate";
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
  { id: "high-preload-hr75", targetTBVMl: 6200, params: { HR: 75 } },
  { id: "normal-hr90", targetTBVMl: 5600, params: { HR: 90 } },
  { id: "systemic-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, systemicResistance: 1.25 } },
  { id: "pulmonary-afterload-high-hr75", targetTBVMl: 5600, params: { HR: 75, pulmonaryResistance: 1.35 } },
  { id: "contractility-low-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 0.82 } },
  { id: "contractility-high-hr75", targetTBVMl: 5600, params: { HR: 75, contractility: 1.18 } },
];

export function buildAvForwardMomentumProjectionPhase5DHEvidence(): Evidence {
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
      "Current user0 pressure-flow plus valve-area forward-momentum projection on TV",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-forward-momentum-projection",
      ["TV"],
      0.05,
    ),
    acceptedUser0Variant(
      "forward-momentum-projection-both",
      "Current user0 pressure-flow plus valve-area forward-momentum projection on MV/TV",
      { LA: inletHeldRelease, RA: inletHeldRelease },
      "accepted-state-valve-pressure-flow-forward-momentum-projection",
      ["MV", "TV"],
      0.05,
    ),
  ] as const;
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: AV_FORWARD_MOMENTUM_PROJECTION_PHASE5DH_ID,
    phase: "5DH",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "representative-normal-sinus-envelope",
      diagnosticQuestion:
        "whether valve-area forward-momentum projection removes the remaining contractility-low TVF third wave without weakening the morphology gate",
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

function acceptedUser0Variant(
  id: VariantId,
  label: string,
  atrialAvPlaneOverride: AvPlaneOverride | null,
  avValveBoundaryMode: VariantSpec["avValveBoundaryMode"],
  avValveBoundaryTargetValves: readonly ("MV" | "TV")[],
  forwardMomentumMinAreaRatio: number | null,
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
    avValveBoundaryMode,
    avValveBoundaryTargetValves,
    forwardMomentumMinAreaRatio,
    experimentalOptions: withAvBoundaryMode(
      experimentalOptions,
      `phase5dh-${id}`,
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
      acceptedValveState: "MV_acceptedBoundaryValveState01" as const,
      acceptedAreaRatio: "MV_acceptedBoundaryAreaRatio" as const,
      acceptedAtrialActive: "MV_acceptedBoundaryAtrialActive01" as const,
      forwardMomentumProjectionApplied: "MV_acceptedBoundaryForwardMomentumProjectionApplied01" as const,
      forwardMomentumProjectionImpulse: "MV_acceptedBoundaryForwardMomentumProjectionImpulse" as const,
      passiveGuardApplied: "MV_acceptedBoundaryPassiveDiastasisGuardApplied01" as const,
      passiveGuardImpulse: "MV_acceptedBoundaryPassiveDiastasisGuardImpulse" as const,
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
      acceptedValveState: "TV_acceptedBoundaryValveState01" as const,
      acceptedAreaRatio: "TV_acceptedBoundaryAreaRatio" as const,
      acceptedAtrialActive: "TV_acceptedBoundaryAtrialActive01" as const,
      forwardMomentumProjectionApplied: "TV_acceptedBoundaryForwardMomentumProjectionApplied01" as const,
      forwardMomentumProjectionImpulse: "TV_acceptedBoundaryForwardMomentumProjectionImpulse" as const,
      passiveGuardApplied: "TV_acceptedBoundaryPassiveDiastasisGuardApplied01" as const,
      passiveGuardImpulse: "TV_acceptedBoundaryPassiveDiastasisGuardImpulse" as const,
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
  const acceptedValveStateMean = meanForKey(beat, keys.acceptedValveState);
  const acceptedValveStateRange = rangeForKey(beat, keys.acceptedValveState);
  const acceptedAreaRatioMean = meanForKey(beat, keys.acceptedAreaRatio);
  const acceptedAreaRatioRange = rangeForKey(beat, keys.acceptedAreaRatio);
  const forwardMomentumProjectionAppliedFraction =
    fraction(beat, (sample) => numeric(sample, keys.forwardMomentumProjectionApplied) > 0.5);
  const forwardMomentumProjectionImpulseIntegralMlPerSec =
    beat.reduce((sum, sample) => sum + Math.abs(numeric(sample, keys.forwardMomentumProjectionImpulse)), 0) / Math.max(beat.length, 1);
  const passiveDiastasisGuardAppliedFraction =
    fraction(beat, (sample) => numeric(sample, keys.passiveGuardApplied) > 0.5);
  const passiveDiastasisGuardImpulseIntegralMlPerSec =
    beat.reduce((sum, sample) => sum + Math.abs(numeric(sample, keys.passiveGuardImpulse)), 0) / Math.max(beat.length, 1);
  const acceptedAtrialActiveMean = meanForKey(beat, keys.acceptedAtrialActive);
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
    acceptedValveStateMean: roundNullable(acceptedValveStateMean),
    acceptedValveStateRange: round(acceptedValveStateRange),
    acceptedAreaRatioMean: roundNullable(acceptedAreaRatioMean),
    acceptedAreaRatioRange: round(acceptedAreaRatioRange),
    forwardMomentumProjectionAppliedFraction: round(forwardMomentumProjectionAppliedFraction),
    forwardMomentumProjectionImpulseIntegralMlPerSec: round(forwardMomentumProjectionImpulseIntegralMlPerSec),
    passiveDiastasisGuardAppliedFraction: round(passiveDiastasisGuardAppliedFraction),
    passiveDiastasisGuardImpulseIntegralMlPerSec: round(passiveDiastasisGuardImpulseIntegralMlPerSec),
    acceptedAtrialActiveMean: roundNullable(acceptedAtrialActiveMean),
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
  const baseline = requiredSummary(summaries, "pressure-flow-user0-inlet-held-release-baseline");
  const guardSummaries = summaries.filter((summary) => summary.variantId !== baseline.variantId);
  const best = [...guardSummaries].sort((a, b) => {
    const grossDelta = b.grossPassCount - a.grossPassCount;
    if (grossDelta !== 0) return grossDelta;
    const tvfDelta = b.tvfOkCount - a.tvfOkCount;
    if (tvfDelta !== 0) return tvfDelta;
    return b.outputPreservedCount - a.outputPreservedCount;
  })[0] ?? baseline;
  const missingReadback = results.some((result) =>
    result.avResiduals
    && (
      !Number.isFinite(result.avResiduals.MV.acceptedValveStateMean ?? Number.NaN)
      || !Number.isFinite(result.avResiduals.TV.acceptedValveStateMean ?? Number.NaN)
    )
  );
  const breaksMvOrOutput =
    best.mvfOkCount < baseline.mvfOkCount
    || best.outputPreservedCount < baseline.outputPreservedCount;
  const baselineContractilityLow = resultFor(results, baseline.variantId, "contractility-low-hr75");
  const bestContractilityLow = resultFor(results, best.variantId, "contractility-low-hr75");
  const bestTvProjection = bestContractilityLow?.avResiduals?.TV ?? null;
  const bestImproves =
    best.tvfOkCount > baseline.tvfOkCount
    || best.grossPassCount > baseline.grossPassCount;
  return {
    baselineGrossPass: `${baseline.grossPassCount}/${POINTS.length}`,
    baselineMvfTvf: { mvfOk: `${baseline.mvfOkCount}/${POINTS.length}`, tvfOk: `${baseline.tvfOkCount}/${POINTS.length}` },
    bestVariantId: best.variantId,
    bestGrossPass: `${best.grossPassCount}/${POINTS.length}`,
    bestMvfTvf: { mvfOk: `${best.mvfOkCount}/${POINTS.length}`, tvfOk: `${best.tvfOkCount}/${POINTS.length}` },
    bestOutputPreserved: `${best.outputPreservedCount}/${POINTS.length}`,
    contractilityLowTvfOutcome: {
      baselineTvfOk: baselineContractilityLow?.badges?.tvf === "ok",
      bestTvfOk: bestContractilityLow?.badges?.tvf === "ok",
      bestTvForwardMomentumProjectionAppliedFraction: bestTvProjection?.forwardMomentumProjectionAppliedFraction ?? null,
      bestTvForwardMomentumProjectionImpulseIntegralMlPerSec:
        bestTvProjection?.forwardMomentumProjectionImpulseIntegralMlPerSec ?? null,
    },
    decision: missingReadback
        ? "configuration-or-readback-gap"
        : breaksMvOrOutput
          ? "forward-momentum-projection-breaks-output-or-mv"
          : bestImproves && bestContractilityLow?.badges?.tvf === "ok"
            ? "forward-momentum-projection-rescues-frontier"
            : "forward-momentum-projection-partial-or-no-go",
    notes: [
      `Baseline causes: ${formatCounts(baseline.causeCounts)}.`,
      `Best projection variant: ${best.variantId}, causes: ${formatCounts(best.causeCounts)}.`,
      `Baseline residual notes: ${residualNotes(results, baseline.variantId).join(" | ") || "none"}.`,
      `Best projection residual notes: ${residualNotes(results, best.variantId).join(" | ") || "none"}.`,
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "configuration-or-readback-gap") {
    return [
      "fix accepted valve-state/area readbacks before interpreting the pressure-flow contract ablation",
      "do not tune LandAtrial or valve parameters from this artifact",
    ];
  }
  if (classification.decision === "forward-momentum-projection-rescues-frontier") {
    return [
      "treat valve-area forward-momentum projection as strong component evidence for a broader AV valve/load/complementarity boundary contract",
      "do not adopt this local projection directly; next formalize the contract with duty limits, pressure-flow energy readbacks, and owner visual trace review",
    ];
  }
  if (classification.decision === "forward-momentum-projection-breaks-output-or-mv") {
    return [
      "do not continue this forward-momentum projection because it breaks MV/output while trying to repair TVF",
      "move to a broader chamber pressure/valve/load residual contract rather than another local boundary variant",
    ];
  }
  return [
    "valve-area forward-momentum projection does not cleanly rescue the targeted user0 TVF residual",
    "keep A1/A2 frozen and do not use scalar braking, qDot, valve threshold, root/Zc, or Land parameter tuning as an adoption path",
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
          return `${result.pointId}/${valve}: cause=${residual.likelyCause}, extra=${residual.extraPeakCount}, acceptedDiode=${residual.acceptedDiodeHitFraction}, acceptedLeak=${residual.acceptedComplementarityLeakFraction}, acceptedValveStateMean=${residual.acceptedValveStateMean}, acceptedAreaRatioMean=${residual.acceptedAreaRatioMean}, forwardMomentumDuty=${residual.forwardMomentumProjectionAppliedFraction}, forwardMomentumImpulse=${residual.forwardMomentumProjectionImpulseIntegralMlPerSec}, passiveGuardDuty=${residual.passiveDiastasisGuardAppliedFraction}, avPlaneAlign=${residual.avPlaneVelocityExtraAlignmentTheta}, atrialPressureAlign=${residual.atrialPressureExtraAlignmentTheta}, releaseHold=${residual.avPlaneReleaseInletOpenHoldMean}`;
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
    acceptedValveStateMean: null,
    acceptedValveStateRange: null,
    acceptedAreaRatioMean: null,
    acceptedAreaRatioRange: null,
    forwardMomentumProjectionAppliedFraction: 0,
    forwardMomentumProjectionImpulseIntegralMlPerSec: 0,
    passiveDiastasisGuardAppliedFraction: 0,
    passiveDiastasisGuardImpulseIntegralMlPerSec: 0,
    acceptedAtrialActiveMean: null,
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
  if (!summary) throw new Error(`Missing Phase 5DH variant summary ${id}.`);
  return summary;
}

function resultFor(
  results: readonly PointResult[],
  variantId: VariantId,
  pointId: PointId,
): PointResult | null {
  return results.find((result) => result.variantId === variantId && result.pointId === pointId) ?? null;
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

export function writeAvForwardMomentumProjectionPhase5DHEvidence(): Evidence {
  const evidence = buildAvForwardMomentumProjectionPhase5DHEvidence();
  const outPath = path.resolve(process.cwd(), AV_FORWARD_MOMENTUM_PROJECTION_PHASE5DH_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAvForwardMomentumProjectionPhase5DHEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
