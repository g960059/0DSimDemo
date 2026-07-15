import {
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
  PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalCycleCapsuleV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1,
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1_ID =
  "phase-b1-paired-live-periodic-diagnostic-config-v1" as const;

export const PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1 =
  Object.freeze({
    configId: PHASE_B1_PAIRED_LIVE_PERIODIC_DIAGNOSTIC_CONFIG_V1_ID,
    modeOrder: PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1,
    executionOrder: "sequential-off-then-on" as const,
    nominalDtMs: 1 as const,
    nominalDtSec:
      PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_NOMINAL_DT_SEC_V1,
    maximumSupercycles:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_MAX_SUPERCYCLES_V1,
    requiredConsecutivePassingSupercycles:
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_REQUIRED_CONSECUTIVE_V1,
    environmentOverridesAccepted: false as const,
    parentAndScheduleBuiltOnce: true as const,
    bothControllersInitializedBeforeFirstAdvance: true as const,
    globalMonotonicJsonlSequenceAcrossModes: true as const,
    stopOnFirstModeFailure: true as const,
    externalPairedFailureRecompositionAllowed: false as const,
    builderIssuedAuthenticationSurvivesSerialization: false as const,
    testOnly: true as const,
  });

export type PhaseB1PairedLivePeriodicModeV1 =
  typeof PHASE_B1_NORMAL_SINUS_BE_PAIRED_PERIODIC_MODE_ORDER_V1[number];

export type PhaseB1PairedLivePeriodicModeClassificationV1 =
  | "converged"
  | "live-periodic-cycle-failure"
  | "maximum-supercycles-exhausted";

export type PhaseB1PairedLivePeriodicModeDispositionV1 = Readonly<{
  mode: PhaseB1PairedLivePeriodicModeV1;
  classification: PhaseB1PairedLivePeriodicModeClassificationV1;
  action:
    | "continue-to-on"
    | "finalize-paired-success"
    | "emit-paired-evidence-not-issued";
  continueToNextMode: boolean;
  pairedEvidenceEligible: boolean;
  stopImmediately: boolean;
  exitCode: 1 | null;
}>;

export function decidePhaseB1PairedLivePeriodicModeDispositionV1(
  input: unknown,
): PhaseB1PairedLivePeriodicModeDispositionV1 {
  assertExactPlainRecordV1(input, [
    "mode",
    "classification",
  ], "Phase B1 paired live-periodic mode disposition input");
  const mode = requireMode(input.mode);
  const classification = requireClassification(input.classification);
  if (classification !== "converged") {
    return Object.freeze({
      mode,
      classification,
      action: "emit-paired-evidence-not-issued" as const,
      continueToNextMode: false,
      pairedEvidenceEligible: false,
      stopImmediately: true,
      exitCode: 1 as const,
    });
  }
  if (mode === "off") {
    return Object.freeze({
      mode,
      classification,
      action: "continue-to-on" as const,
      continueToNextMode: true,
      pairedEvidenceEligible: false,
      stopImmediately: false,
      exitCode: null,
    });
  }
  return Object.freeze({
    mode,
    classification,
    action: "finalize-paired-success" as const,
    continueToNextMode: false,
    pairedEvidenceEligible: true,
    stopImmediately: false,
    exitCode: null,
  });
}

function requireMode(value: unknown): PhaseB1PairedLivePeriodicModeV1 {
  if (value !== "off" && value !== "on") {
    throw new Error("paired live-periodic mode must be exactly off or on");
  }
  return value;
}

function requireClassification(
  value: unknown,
): PhaseB1PairedLivePeriodicModeClassificationV1 {
  if (
    value !== "converged"
    && value !== "live-periodic-cycle-failure"
    && value !== "maximum-supercycles-exhausted"
  ) {
    throw new Error("paired live-periodic classification is not closed");
  }
  return value;
}
