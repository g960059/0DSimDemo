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
import {
  lastCompleteBeat,
  phaseInWindow,
  positiveValvePeaksDetailed,
} from "@/engine/verification/shapeMetrics";

export const ACCEPTED_AV_BOUNDARY_DIAGNOSTICS_PHASE5CQ_ID =
  "accepted-av-boundary-diagnostics-phase5cq-result-v1" as const;
export const ACCEPTED_AV_BOUNDARY_DIAGNOSTICS_PHASE5CQ_RESULT_PATH =
  "data/myocardium/protocols/accepted-av-boundary-diagnostics-phase5cq-result-v1.json" as const;

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

type ResidualCause =
  | "not-measured"
  | "clean-biphasic"
  | "standard-diode-or-qdot"
  | "accepted-boundary-diode-or-qdot"
  | "accepted-boundary-complementarity-leak"
  | "extra-wave-unattributed";

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

type RefitConfigurationAudit = {
  readonly variantId: VariantId;
  readonly requestedIterations: number | null;
  readonly effectiveIterations: number | null;
  readonly requestedRelaxation: number | null;
  readonly effectiveRelaxation: number | null;
  readonly matches: boolean;
};

type ResidualDiagnostic = {
  readonly valve: "MV" | "TV";
  readonly measured: boolean;
  readonly morphologyOk: boolean;
  readonly standardCause: ResidualCause;
  readonly acceptedCause: ResidualCause;
  readonly diagnosticMismatch: boolean;
  readonly acceptedAppliedFraction: number;
  readonly standardDiodeHitFraction: number;
  readonly acceptedDiodeHitFraction: number;
  readonly standardQDotHitFraction: number;
  readonly acceptedQDotHitFraction: number;
  readonly acceptedComplementarityLeakFraction: number;
  readonly extraPeakCount: number | null;
  readonly ePeakTheta: number | null;
  readonly aPeakTheta: number | null;
  readonly extraPeakTheta: number | null;
  readonly message: string;
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
  readonly avResiduals: Readonly<Record<"MV" | "TV", ResidualDiagnostic>> | null;
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
  readonly acceptedDiagnosticsAvailableCount: number;
  readonly diagnosticMismatchCount: number;
  readonly standardCauseCounts: Readonly<Record<ResidualCause, number>>;
  readonly acceptedCauseCounts: Readonly<Record<ResidualCause, number>>;
  readonly firstFailedPoint: PointId | null;
};

type Classification = {
  readonly currentUser0GrossPass: string;
  readonly lvRvLandLegacyAtriaGrossPass: string;
  readonly acceptedLegacyGrossPass: string;
  readonly acceptedUser0TransferGrossPass: string;
  readonly acceptedLegacyDiagnostics: {
    readonly acceptedDiagnosticsAvailableCount: number;
    readonly diagnosticMismatchCount: number;
    readonly standardCauseCounts: Readonly<Record<ResidualCause, number>>;
    readonly acceptedCauseCounts: Readonly<Record<ResidualCause, number>>;
  };
  readonly decision:
    | "configuration-integrity-failed"
    | "accepted-boundary-diagnostics-change-interpretation"
    | "accepted-boundary-diagnostics-confirm-redesign-required"
    | "accepted-boundary-diagnostics-clean-enough-for-next-contract";
  readonly notes: readonly string[];
};

type Evidence = {
  readonly schemaVersion: 1;
  readonly id: typeof ACCEPTED_AV_BOUNDARY_DIAGNOSTICS_PHASE5CQ_ID;
  readonly phase: "5CQ";
  readonly profile: {
    readonly verificationProfile: "fitFast";
    readonly morphologyProfileId: "normal_sinus_default";
    readonly pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope";
    readonly diagnosticQuestion:
      "whether accepted-state AV boundary candidates emit transaction-specific diode/qDot/complementarity readbacks that change residual interpretation";
  };
  readonly ownerVisualGateCalibration: {
    readonly sourceArtifactId: "morphology-visual-review-phase5ca-result-v1";
    readonly failedGateExamplesVisuallyUnacceptable: true;
    readonly someOkGateExamplesStillVisuallyUnacceptable: true;
    readonly conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts";
  };
  readonly variants: readonly Omit<VariantSpec, "experimentalOptions">[];
  readonly refitConfigurationAudits: readonly RefitConfigurationAudit[];
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

export function buildAcceptedAvBoundaryDiagnosticsPhase5CQEvidence(): Evidence {
  const variants = [
    currentUser0Variant(),
    lvRvLandLegacyAtriaVariant(),
    acceptedComplementarityLegacyAtriaVariant(),
    acceptedComplementarityUser0Variant(),
  ] as const;
  const refitConfigurationAudits = variants.map(refitConfigurationAudit);
  const results = variants.flatMap((variant) => POINTS.map((point) => runPoint(variant, point)));
  const variantSummaries = variants.map((variant) => summarizeVariant(variant, results));
  const classification = classify(variantSummaries, results, refitConfigurationAudits);
  const evidenceWithoutHash = {
    schemaVersion: 1,
    id: ACCEPTED_AV_BOUNDARY_DIAGNOSTICS_PHASE5CQ_ID,
    phase: "5CQ",
    profile: {
      verificationProfile: "fitFast",
      morphologyProfileId: "normal_sinus_default",
      pointSource: "normal-hr75-hr90-preload-afterload-contractility-representative-envelope",
      diagnosticQuestion:
        "whether accepted-state AV boundary candidates emit transaction-specific diode/qDot/complementarity readbacks that change residual interpretation",
    },
    ownerVisualGateCalibration: {
      sourceArtifactId: "morphology-visual-review-phase5ca-result-v1",
      failedGateExamplesVisuallyUnacceptable: true,
      someOkGateExamplesStillVisuallyUnacceptable: true,
      conclusion: "do-not-relax-morphology-check-v1-for-failed-gross-pv-or-av-inflow-artifacts",
    },
    variants: variants.map(({ experimentalOptions: _experimentalOptions, ...variant }) => variant),
    refitConfigurationAudits,
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
    experimentalOptions: withAcceptedComplementarity(resolved.experimentalOptions, "phase5cq-accepted-legacy-atria"),
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
    experimentalOptions: withAcceptedComplementarity(resolved.experimentalOptions, "phase5cq-accepted-user0"),
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

function refitConfigurationAudit(variant: VariantSpec): RefitConfigurationAudit {
  const effective = new ModelCore(DEFAULT_PARAMS, variant.experimentalOptions)
    .debugExperimentalVentricularChamberTransactionStep();
  const requestedIterations = variant.avValveBoundary?.iterations ?? null;
  const requestedRelaxation = variant.avValveBoundary?.relaxation ?? null;
  const effectiveIterations = effective?.avValveBoundaryPressureRefitIterations ?? null;
  const effectiveRelaxation = effective?.avValveBoundaryPressureRefitRelaxation ?? null;
  return {
    variantId: variant.id,
    requestedIterations,
    effectiveIterations,
    requestedRelaxation,
    effectiveRelaxation,
    matches:
      requestedIterations === effectiveIterations
      && requestedRelaxation === effectiveRelaxation,
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
      avResiduals: measurement
        ? {
          MV: residualDiagnostic(measurement.samples, "MV", morphology?.badges.mvf === "ok"),
          TV: residualDiagnostic(measurement.samples, "TV", morphology?.badges.tvf === "ok"),
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

function residualDiagnostic(
  samples: readonly SimSample[],
  valve: "MV" | "TV",
  morphologyOk: boolean,
): ResidualDiagnostic {
  const beat = lastCompleteBeat([...samples]);
  if (beat.length === 0) return unmeasuredResidual(valve, "no complete beat");
  const flowKey = valve === "MV" ? "QMV" : "QTV";
  const standardDiodeKey = valve === "MV" ? "MV_diodeImpulse" : "TV_diodeImpulse";
  const standardQDotKey = valve === "MV" ? "MV_qDotClampHit01" : "TV_qDotClampHit01";
  const acceptedAppliedKey = valve === "MV" ? "MV_acceptedBoundaryApplied01" : "TV_acceptedBoundaryApplied01";
  const acceptedDiodeKey = valve === "MV" ? "MV_acceptedBoundaryDiodeImpulse" : "TV_acceptedBoundaryDiodeImpulse";
  const acceptedQDotKey = valve === "MV" ? "MV_acceptedBoundaryQDotClampHit01" : "TV_acceptedBoundaryQDotClampHit01";
  const acceptedComplementarityKey = valve === "MV"
    ? "MV_acceptedBoundaryComplementarityResidualMlPerSec"
    : "TV_acceptedBoundaryComplementarityResidualMlPerSec";
  const peaks = positiveValvePeaksDetailed([...beat], flowKey, 0.12, 20);
  const diastolic = peaks.filter((peak) => phaseInWindow(peak.theta, 0.25, 0.12));
  const ePeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.30, 0.75)));
  const aPeak = maxPeak(peaks.filter((peak) => phaseInWindow(peak.theta, 0.85, 0.08)));
  const extraPeak = diastolic
    .filter((peak) => peak !== ePeak && peak !== aPeak)
    .sort((a, b) => b.value - a.value)[0] ?? null;
  const extraPeakCount = Math.max(0, diastolic.length - 2);
  const standardDiodeHitFraction = fraction(beat, (sample) => Math.abs(numeric(sample, standardDiodeKey)) > 1e-9);
  const standardQDotHitFraction = fraction(beat, (sample) => numeric(sample, standardQDotKey) > 0.5);
  const acceptedAppliedFraction = fraction(beat, (sample) => numeric(sample, acceptedAppliedKey) > 0.5);
  const acceptedDiodeHitFraction = fraction(beat, (sample) => Math.abs(numeric(sample, acceptedDiodeKey)) > 1e-9);
  const acceptedQDotHitFraction = fraction(beat, (sample) => numeric(sample, acceptedQDotKey) > 0.5);
  const acceptedComplementarityLeakFraction =
    fraction(beat, (sample) => numeric(sample, acceptedComplementarityKey) > 10);
  const standardCause = classifyResidualCause({
    morphologyOk,
    extraPeakCount,
    diodeHitFraction: standardDiodeHitFraction,
    qDotHitFraction: standardQDotHitFraction,
    accepted: false,
    complementarityLeakFraction: 0,
  });
  const acceptedCause = acceptedAppliedFraction > 0.5
    ? classifyResidualCause({
      morphologyOk,
      extraPeakCount,
      diodeHitFraction: acceptedDiodeHitFraction,
      qDotHitFraction: acceptedQDotHitFraction,
      accepted: true,
      complementarityLeakFraction: acceptedComplementarityLeakFraction,
    })
    : standardCause;
  const diagnosticMismatch = acceptedAppliedFraction > 0.5
    && (
      standardCause !== acceptedCause
      || Math.abs(standardDiodeHitFraction - acceptedDiodeHitFraction) > 0.1
      || Math.abs(standardQDotHitFraction - acceptedQDotHitFraction) > 0.05
    );
  return {
    valve,
    measured: true,
    morphologyOk,
    standardCause,
    acceptedCause,
    diagnosticMismatch,
    acceptedAppliedFraction: round(acceptedAppliedFraction),
    standardDiodeHitFraction: round(standardDiodeHitFraction),
    acceptedDiodeHitFraction: round(acceptedDiodeHitFraction),
    standardQDotHitFraction: round(standardQDotHitFraction),
    acceptedQDotHitFraction: round(acceptedQDotHitFraction),
    acceptedComplementarityLeakFraction: round(acceptedComplementarityLeakFraction),
    extraPeakCount,
    ePeakTheta: roundNullable(ePeak?.theta ?? null),
    aPeakTheta: roundNullable(aPeak?.theta ?? null),
    extraPeakTheta: roundNullable(extraPeak?.theta ?? null),
    message: diagnosticMismatch
      ? `${valve} accepted-boundary diagnostics change the local residual interpretation.`
      : `${valve} accepted-boundary diagnostics preserve the local residual interpretation.`,
  };
}

function classifyResidualCause(input: {
  readonly morphologyOk: boolean;
  readonly extraPeakCount: number;
  readonly diodeHitFraction: number;
  readonly qDotHitFraction: number;
  readonly accepted: boolean;
  readonly complementarityLeakFraction: number;
}): ResidualCause {
  if (input.morphologyOk && input.extraPeakCount === 0) return "clean-biphasic";
  if (input.accepted && input.complementarityLeakFraction > 0.05) {
    return "accepted-boundary-complementarity-leak";
  }
  if (input.diodeHitFraction > 0.12 || input.qDotHitFraction > 0.05) {
    return input.accepted ? "accepted-boundary-diode-or-qdot" : "standard-diode-or-qdot";
  }
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
    acceptedDiagnosticsAvailableCount: residuals.filter((residual) => residual.acceptedAppliedFraction > 0.5).length,
    diagnosticMismatchCount: residuals.filter((residual) => residual.diagnosticMismatch).length,
    standardCauseCounts: countCauses(residuals.map((residual) => residual.standardCause)),
    acceptedCauseCounts: countCauses(residuals.map((residual) => residual.acceptedCause)),
    firstFailedPoint: failures[0]?.pointId ?? null,
  };
}

function classify(
  summaries: readonly VariantSummary[],
  results: readonly PointResult[],
  audits: readonly RefitConfigurationAudit[],
): Classification {
  const current = requiredSummary(summaries, "current-user0-default");
  const lvRv = requiredSummary(summaries, "lv-rv-land-legacy-atria");
  const acceptedLegacy = requiredSummary(summaries, "accepted-av-complementarity2-legacy-atria");
  const acceptedUser0 = requiredSummary(summaries, "accepted-av-complementarity2-user0");
  const configOk = audits.every((audit) =>
    audit.requestedIterations == null
    || audit.matches
  );
  const acceptedLegacyResidualNotes = failedResidualNotes(results, acceptedLegacy.variantId);
  const acceptedDiagnosticsChangeInterpretation =
    acceptedLegacy.diagnosticMismatchCount > 0
    || acceptedUser0.diagnosticMismatchCount > 0;
  return {
    currentUser0GrossPass: `${current.grossPassCount}/${POINTS.length}`,
    lvRvLandLegacyAtriaGrossPass: `${lvRv.grossPassCount}/${POINTS.length}`,
    acceptedLegacyGrossPass: `${acceptedLegacy.grossPassCount}/${POINTS.length}`,
    acceptedUser0TransferGrossPass: `${acceptedUser0.grossPassCount}/${POINTS.length}`,
    acceptedLegacyDiagnostics: {
      acceptedDiagnosticsAvailableCount: acceptedLegacy.acceptedDiagnosticsAvailableCount,
      diagnosticMismatchCount: acceptedLegacy.diagnosticMismatchCount,
      standardCauseCounts: acceptedLegacy.standardCauseCounts,
      acceptedCauseCounts: acceptedLegacy.acceptedCauseCounts,
    },
    decision: !configOk
      ? "configuration-integrity-failed"
      : acceptedDiagnosticsChangeInterpretation
        ? "accepted-boundary-diagnostics-change-interpretation"
        : acceptedLegacy.grossPassCount >= 7 && acceptedUser0.grossPassCount >= 7
          ? "accepted-boundary-diagnostics-clean-enough-for-next-contract"
          : "accepted-boundary-diagnostics-confirm-redesign-required",
    notes: [
      `Accepted legacy residual notes: ${acceptedLegacyResidualNotes.join(" | ") || "none"}.`,
      `Accepted legacy diagnostic mismatches: ${acceptedLegacy.diagnosticMismatchCount}.`,
      `Accepted user0 diagnostic mismatches: ${acceptedUser0.diagnosticMismatchCount}.`,
      `Accepted legacy standard causes: ${formatCounts(acceptedLegacy.standardCauseCounts)}.`,
      `Accepted legacy accepted-boundary causes: ${formatCounts(acceptedLegacy.acceptedCauseCounts)}.`,
      `Accepted user0 standard causes: ${formatCounts(acceptedUser0.standardCauseCounts)}.`,
      `Accepted user0 accepted-boundary causes: ${formatCounts(acceptedUser0.acceptedCauseCounts)}.`,
    ],
  };
}

function recommendedNext(classification: Classification): readonly string[] {
  if (classification.decision === "configuration-integrity-failed") {
    return [
      "do not interpret morphology counts until accepted-boundary requested/effective settings match",
      "fix option normalization or runner labels, then rerun the same 8-point envelope",
    ];
  }
  if (classification.decision === "accepted-boundary-diagnostics-change-interpretation") {
    return [
      "use accepted-boundary diagnostic fields for future AV residual attribution instead of standard diode/qDot fields",
      "rerun any adoption-relevant residual classification with acceptedBoundaryApplied diagnostics before broader transaction design",
      "do not tune LandAtrial or valve/root/qDot parameters to chase the reclassified residuals",
    ];
  }
  if (classification.decision === "accepted-boundary-diagnostics-clean-enough-for-next-contract") {
    return [
      "carry accepted-boundary diagnostics forward as the required readback for the next chamber pressure/valve/load transaction",
      "start the broader transaction design only after preserving these readbacks in its samples",
    ];
  }
  return [
    "accepted-boundary diagnostics do not rescue the 5CO/5CP no-go interpretation; proceed to a broader chamber pressure/valve/load transaction",
    "keep accepted-boundary transaction-specific diode/qDot/complementarity fields as mandatory readbacks for the next phase",
    "do not spend more phases on fixed-point iterations, scalar pressure caps, zeta/tau/smoothing/substeps, qDot/root/Zc/valve-threshold retuning, Tref, source-stress scaling, or LandAtrial parameter tuning while this blocker is active",
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

function failedResidualNotes(results: readonly PointResult[], variantId: VariantId): readonly string[] {
  return results
    .filter((result) => result.variantId === variantId && result.avResiduals)
    .flatMap((result) => {
      const residuals = result.avResiduals!;
      return (["MV", "TV"] as const)
        .filter((valve) => residuals[valve].acceptedCause !== "clean-biphasic")
        .map((valve) => {
          const residual = residuals[valve];
          return `${result.pointId}/${valve}: standard=${residual.standardCause}, accepted=${residual.acceptedCause}, standardDiode=${residual.standardDiodeHitFraction}, acceptedDiode=${residual.acceptedDiodeHitFraction}, acceptedLeak=${residual.acceptedComplementarityLeakFraction}`;
        });
    });
}

function unmeasuredResidual(valve: "MV" | "TV", reason: string): ResidualDiagnostic {
  return {
    valve,
    measured: false,
    morphologyOk: false,
    standardCause: "not-measured",
    acceptedCause: "not-measured",
    diagnosticMismatch: false,
    acceptedAppliedFraction: 0,
    standardDiodeHitFraction: 0,
    acceptedDiodeHitFraction: 0,
    standardQDotHitFraction: 0,
    acceptedQDotHitFraction: 0,
    acceptedComplementarityLeakFraction: 0,
    extraPeakCount: null,
    ePeakTheta: null,
    aPeakTheta: null,
    extraPeakTheta: null,
    message: `${valve} residual attribution not measured: ${reason}.`,
  };
}

function maxPeak<T extends { readonly value: number }>(peaks: readonly T[]): T | null {
  return peaks.length === 0 ? null : [...peaks].sort((a, b) => b.value - a.value)[0];
}

function fraction(samples: readonly SimSample[], predicate: (sample: SimSample) => boolean): number {
  if (samples.length === 0) return 0;
  return samples.filter(predicate).length / samples.length;
}

function numeric(sample: SimSample, key: keyof SimSample): number {
  const value = Number(sample[key]);
  return Number.isFinite(value) ? value : 0;
}

function countCauses(causes: readonly ResidualCause[]): Readonly<Record<ResidualCause, number>> {
  const out: Record<ResidualCause, number> = {
    "not-measured": 0,
    "clean-biphasic": 0,
    "standard-diode-or-qdot": 0,
    "accepted-boundary-diode-or-qdot": 0,
    "accepted-boundary-complementarity-leak": 0,
    "extra-wave-unattributed": 0,
  };
  for (const cause of causes) out[cause]++;
  return out;
}

function requiredSummary(summaries: readonly VariantSummary[], id: VariantId): VariantSummary {
  const summary = summaries.find((entry) => entry.variantId === id);
  if (!summary) throw new Error(`Missing Phase 5CQ variant summary ${id}.`);
  return summary;
}

function formatCounts(counts: Readonly<Record<string, number>>): string {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${key}=${count}`)
    .join(", ") || "none";
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

export function writeAcceptedAvBoundaryDiagnosticsPhase5CQEvidence(): Evidence {
  const evidence = buildAcceptedAvBoundaryDiagnosticsPhase5CQEvidence();
  const outPath = path.resolve(process.cwd(), ACCEPTED_AV_BOUNDARY_DIAGNOSTICS_PHASE5CQ_RESULT_PATH);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const evidence = writeAcceptedAvBoundaryDiagnosticsPhase5CQEvidence();
  console.log(JSON.stringify({
    id: evidence.id,
    normalizedSha256: evidence.normalizedSha256,
    classification: evidence.classification,
    recommendedNext: evidence.recommendedNext,
  }, null, 2));
}
