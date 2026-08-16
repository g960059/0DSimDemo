import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
  type MainWireIntegratedModelHemodynamicResearchInputsV3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

export const MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID =
  "main-wire-solver-replacement-corpus-v1" as const;

export type MainWireSolverReplacementCorpusCaseV1 = Readonly<{
  caseId:
    | "baseline"
    | "low-preload"
    | "high-afterload"
    | "high-peep"
    | "tachycardia"
    | "high-contractility";
  acceptedStepCount: 500;
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3;
  ventricularContractilityScale: number;
  referenceAcceptedSequenceSha256: string;
}>;

const DEFAULTS = MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3;

/**
 * Replacement evidence is frozen before the coupled solver is evaluated.
 * These cases are numerical construction probes, not clinical reference
 * intervals or claims that the current nested solver is scientific truth.
 */
export const MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_CASES_V1:
readonly MainWireSolverReplacementCorpusCaseV1[] = Object.freeze([
  corpusCase(
    "baseline",
    DEFAULTS,
    1,
    "ecef2bee1b4542f72ec3cf3d9f33f76c64579866ef611e22f2f52138f811a741",
  ),
  corpusCase("low-preload", Object.freeze({
    ...DEFAULTS,
    totalBloodVolumeMl: 4_200,
  }), 1, "f95540d4fd698ad6912a24b7557a51781f0753e7d2e5bfdf5be9904646a2f490"),
  corpusCase("high-afterload", Object.freeze({
    ...DEFAULTS,
    systemicResistance: 1.25,
  }), 1, "ee30e633e5fadd5cd46c054496c33e68769cdc577563e368646ce9d1acce6be0"),
  corpusCase("high-peep", Object.freeze({
    ...DEFAULTS,
    peepCmH2O: 20,
  }), 1, "25fd53633b87ce7de313eedcbdb3a036c46634da043d9ab96fe9e86efee20665"),
  corpusCase("tachycardia", Object.freeze({
    ...DEFAULTS,
    heartRateBpm: 100,
  }), 1, "ffdfb313568789166cb9b482ba958cc17d28c35462026c4b43b0dc0e27bf8814"),
  corpusCase(
    "high-contractility",
    DEFAULTS,
    1.25,
    "d832aff1dbe67be880d7de342693e0cbc42b30ee9bda61df5c98aef547c4b59f",
  ),
]);

/**
 * The candidate solver must satisfy these limits independently of any legacy
 * accepted-state hash. A new algorithm may legitimately choose a different
 * floating-point path, but it may not weaken these limits after its output is
 * inspected without an explicit policy revision.
 */
export const MAIN_WIRE_SOLVER_REPLACEMENT_ACCEPTANCE_POLICY_V1 =
  Object.freeze({
    policyId: "main-wire-solver-replacement-acceptance-policy-v1" as const,
    acceptedClockAbsoluteToleranceSec: 1e-12,
    totalBloodVolumeAbsoluteToleranceMl: 1e-8,
    continuityResidualInfinityToleranceMl: 1e-8,
    coronaryLedgerAbsoluteToleranceMl: 1e-8,
    pressureAbsoluteToleranceMmHg: 1e-4,
    chamberVolumeAbsoluteToleranceMl: 1e-5,
    flowAbsoluteToleranceMlPerSec: 1e-4,
    relativeObservableTolerance: 1e-6,
    exactEventOrderRequired: true as const,
    rejectedStepMustBeAtomic: true as const,
    checkpointContinuationMustBeExactWithinCandidateRelease: true as const,
    referenceSequenceHashIsAcceptanceAuthority: false as const,
    clinicalValidationClaimed: false as const,
  });

function corpusCase(
  caseId: MainWireSolverReplacementCorpusCaseV1["caseId"],
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  referenceAcceptedSequenceSha256: string,
): MainWireSolverReplacementCorpusCaseV1 {
  return Object.freeze({
    caseId,
    acceptedStepCount: 500 as const,
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    referenceAcceptedSequenceSha256,
  });
}
