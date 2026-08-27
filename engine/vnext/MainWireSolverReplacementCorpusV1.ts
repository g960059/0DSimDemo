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
    "f20ec198355a9a8f356a12d52c37159f4dd39e4b413c5aa1060b336f3b219638",
  ),
  corpusCase("low-preload", Object.freeze({
    ...DEFAULTS,
    totalBloodVolumeMl: 4_200,
  }), 1, "d41dde54b3bc57fbc2a6185ae9930ae1e038c1c05d91091a23107aa5cad7cc66"),
  corpusCase("high-afterload", Object.freeze({
    ...DEFAULTS,
    systemicResistance: 1.25,
  }), 1, "0e570829ebe3113982543be3e13f15435fb848fd8625816df7493d9eaad91acd"),
  corpusCase("high-peep", Object.freeze({
    ...DEFAULTS,
    peepCmH2O: 20,
  }), 1, "cd8d5a8702aeae1bdf4c7931332242856d569b898fa855b9598294d895fa7778"),
  corpusCase("tachycardia", Object.freeze({
    ...DEFAULTS,
    heartRateBpm: 100,
  }), 1, "0f93a02b5b4a78f8356e77bb676337208183d613c268889a693dc465916b77e0"),
  corpusCase(
    "high-contractility",
    DEFAULTS,
    1.25,
    // Re-pinned when the common convenience control began routing
    // through the wall-explicit LVFW/SEP/RVFW mechanics input. The independent
    // coupled-solver branch/tolerance comparison remains the acceptance owner.
    "c240175fcab98bb93cd593a473e3ffefe2ad8cc2732c3f761e914c845a9b999f",
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
