import type {
  ArtifactGuardDecisionV1,
  ArtifactGuardEvidenceV1,
  AvInflowPatternEvidenceV1,
} from "@/engine/diagnostics/morphology/morphologyDecisionV1";

export function evaluateAvInflowArtifactGuard(
  evidence: AvInflowPatternEvidenceV1,
): ArtifactGuardDecisionV1 {
  const failedArtifactIds: string[] = [];
  if (!evidence.pressureGradientSupported) failedArtifactIds.push("pressure-flow-causality-unsupported");
  if (!evidence.valveStateSupported) failedArtifactIds.push("valve-state-unsupported");
  if (evidence.overlapsValveTransition) failedArtifactIds.push("valve-transition-overlap");
  if (evidence.overlapsClampOrLimiter) failedArtifactIds.push("clamp-or-limiter-overlap");
  if (evidence.overlapsReservoirTransfer) failedArtifactIds.push("reservoir-transfer-overlap");
  if (evidence.activeMultiTwitch) failedArtifactIds.push("active-source-multi-twitch");
  if (evidence.hiddenVolumeSource) failedArtifactIds.push("hidden-volume-source");
  if (!evidence.massLedgerClean) failedArtifactIds.push("mass-ledger-not-clean");
  if (!evidence.energyCoastingClean) failedArtifactIds.push("energy-coasting-not-clean");
  if (evidence.c1KinkSeverity > evidence.c1KinkLimit) failedArtifactIds.push("c1-kink-artifact");
  if (evidence.sharpnessSeverity > evidence.sharpnessLimit) failedArtifactIds.push("unphysiologic-sharpness");
  if (evidence.phaseAlignedDtParityOk === false) failedArtifactIds.push("dt-half-shape-parity-fail");
  if (evidence.beatRepeatabilityOk === false) failedArtifactIds.push("beat-repeatability-fail");

  const guardEvidence: ArtifactGuardEvidenceV1 = {
    pressureFlowCausalityOk: evidence.pressureGradientSupported,
    valveTransitionOverlap: evidence.overlapsValveTransition,
    clampOrLimiterOverlap: evidence.overlapsClampOrLimiter,
    reservoirTransferDominance: evidence.overlapsReservoirTransfer,
    activeMultiTwitch: evidence.activeMultiTwitch,
    hiddenVolumeSource: evidence.hiddenVolumeSource,
    c1KinkSeverity: evidence.c1KinkSeverity,
    c1KinkLimit: evidence.c1KinkLimit,
    sharpnessSeverity: evidence.sharpnessSeverity,
    sharpnessLimit: evidence.sharpnessLimit,
    massLedgerClean: evidence.massLedgerClean,
    energyCoastingClean: evidence.energyCoastingClean,
    dtHalfShapeParityOk: evidence.phaseAlignedDtParityOk,
    beatRepeatabilityOk: evidence.beatRepeatabilityOk,
  };
  return {
    status: failedArtifactIds.length > 0 ? "fail" : "pass",
    failedArtifactIds,
    evidence: guardEvidence,
  };
}

export function mergeArtifactGuardDecisions(
  decisions: readonly (ArtifactGuardDecisionV1 | undefined)[],
): ArtifactGuardDecisionV1["status"] {
  const concrete = decisions.filter((decision): decision is ArtifactGuardDecisionV1 => Boolean(decision));
  if (concrete.length === 0) return "inconclusive";
  if (concrete.some((decision) => decision.status === "fail")) return "fail";
  if (concrete.some((decision) => decision.status === "inconclusive")) return "inconclusive";
  return "pass";
}
