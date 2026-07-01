import { DEFAULT_PARAMS } from "@/constants";

type ValveId = "MV" | "AoV" | "TV" | "PV";

export const EXISTING_VALVE_AUDIT_REPORT_ID_V1 = "existing-valve-audit-v1" as const;

export type ExistingValveParameterAuditV1 = {
  readonly valveId: ValveId;
  readonly aRefCm2: number;
  readonly aMaxCm2: number;
  readonly aLeakCm2: number;
  readonly kOpen: number;
  readonly tauOpenSec: number;
  readonly tauCloseSec: number;
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
  readonly bernoulliMmHgSec2PerMl2: number;
};

export type ExistingValveAuditReportV1 = {
  readonly reportId: typeof EXISTING_VALVE_AUDIT_REPORT_ID_V1;
  readonly scope: "existing-runtime-valve-semantics-audit";
  readonly valveParameters: readonly ExistingValveParameterAuditV1[];
  readonly reusableSemantics: readonly string[];
  readonly semanticsToChangeBeforeMechanicsCore2Closure: readonly string[];
  readonly requiredReadbacks: readonly string[];
  readonly claimBoundary: {
    readonly noRuntimeChange: true;
    readonly noValveTuning: true;
    readonly noMorphologyAcceptance: true;
  };
};

export function buildExistingValveAuditV1(): ExistingValveAuditReportV1 {
  return {
    reportId: EXISTING_VALVE_AUDIT_REPORT_ID_V1,
    scope: "existing-runtime-valve-semantics-audit",
    valveParameters: (["MV", "AoV", "TV", "PV"] as const).map((valveId) => ({
      valveId,
      aRefCm2: numberParam(`${valveId}_Aref`),
      aMaxCm2: numberParam(`${valveId}_Amax`),
      aLeakCm2: numberParam(`${valveId}_Aleak`),
      kOpen: numberParam(`${valveId}_kOpen`),
      tauOpenSec: numberParam(`${valveId}_tauOpen`),
      tauCloseSec: numberParam(`${valveId}_tauClose`),
      resistanceMmHgSecPerMl: numberParam(`${valveId}_R`),
      inertanceMmHgSec2PerMl: numberParam(`${valveId}_L`),
      bernoulliMmHgSec2PerMl2: numberParam(`${valveId}_B`),
    })),
    reusableSemantics: [
      "all four valves already expose Aref/Amax/Aleak area parameters",
      "all four valves already expose kOpen and tauOpen/tauClose state timing",
      "all four valves already expose R/L/B pressure-flow loss and inertia parameters",
      "ModelCore already records qDot and diode/clamp diagnostics for accepted-boundary experiments",
      "DynamicValveTransitionV1 already implements source/hysteretic/prescribed opening and current/consistent loss modes",
    ],
    semanticsToChangeBeforeMechanicsCore2Closure: [
      "own valve q-state, area/opening state, chamber pressure, and chamber volume in the same MechanicsCore2 transaction",
      "avoid post-hoc projection as a morphology repair path",
      "report passivity/energy and C1 kink metrics from the accepted flow state",
      "separate profile-allowed disease morphology from universal valve artifact guards",
    ],
    requiredReadbacks: [
      "acceptedFlowMlPerSec",
      "acceptedOpen01",
      "acceptedAeffCm2",
      "acceptedPressureGradientMmHg",
      "lossPressureMmHg",
      "inertancePressureMmHg",
      "bernoulliPressureMmHg",
      "diodeImpulseMlPerSec",
      "qDotClampImpulseMlPerSec2",
      "c1KinkSeverity",
      "energyOrPassivityResidual",
    ],
    claimBoundary: {
      noRuntimeChange: true,
      noValveTuning: true,
      noMorphologyAcceptance: true,
    },
  };
}

function numberParam(key: string): number {
  const value = (DEFAULT_PARAMS as unknown as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}
