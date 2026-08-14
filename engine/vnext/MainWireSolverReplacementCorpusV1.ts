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
  legacyAcceptedSequenceSha256: string;
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
    "ba589801e07b218123950e1aa3d86e374622ae8d1fd80c6029669e3b014a67ea",
  ),
  corpusCase("low-preload", Object.freeze({
    ...DEFAULTS,
    totalBloodVolumeMl: 4_200,
  }), 1, "bba1b48847b30ac2b57aafc53a619566f2ae3500d4b9f22f1b3388cada8505e2"),
  corpusCase("high-afterload", Object.freeze({
    ...DEFAULTS,
    systemicResistance: 1.25,
  }), 1, "65c790244b15a17403ff31a8895417d0b67f4989068ffe17a2190cef35547574"),
  corpusCase("high-peep", Object.freeze({
    ...DEFAULTS,
    peepCmH2O: 20,
  }), 1, "9dbe1b7d44f1f1cf243eb408eaadbd9fb9655dcebbebb07df146771236573272"),
  corpusCase("tachycardia", Object.freeze({
    ...DEFAULTS,
    heartRateBpm: 100,
  }), 1, "299ef9c9e412325d35375b0cc2c614e3fd3c66ee3c00c4894922b98a4a7e9d1c"),
  corpusCase(
    "high-contractility",
    DEFAULTS,
    1.25,
    "7cb17043e3fe8ada0df73693406d52ac113fce3b2682546123a26c130eea9af4",
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
    legacySequenceHashIsAcceptanceAuthority: false as const,
    clinicalValidationClaimed: false as const,
  });

function corpusCase(
  caseId: MainWireSolverReplacementCorpusCaseV1["caseId"],
  hemodynamicResearchInputs:
    MainWireIntegratedModelHemodynamicResearchInputsV3,
  ventricularContractilityScale: number,
  legacyAcceptedSequenceSha256: string,
): MainWireSolverReplacementCorpusCaseV1 {
  return Object.freeze({
    caseId,
    acceptedStepCount: 500 as const,
    hemodynamicResearchInputs,
    ventricularContractilityScale,
    legacyAcceptedSequenceSha256,
  });
}
