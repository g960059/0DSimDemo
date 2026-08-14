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
    "edec3f9eb3b24eabd690d5451e98245dc44a070b48f75c878b2f669b583a73c9",
  ),
  corpusCase("low-preload", Object.freeze({
    ...DEFAULTS,
    totalBloodVolumeMl: 4_200,
  }), 1, "0f2d56f8f64124ef34e38f423bb626d1077b9e56cdcca889b2c9dee94a6fb791"),
  corpusCase("high-afterload", Object.freeze({
    ...DEFAULTS,
    systemicResistance: 1.25,
  }), 1, "344fce3c46c09adb840ceaa2c9b15e27c596a95d2616bce06b80b6d05250e9ba"),
  corpusCase("high-peep", Object.freeze({
    ...DEFAULTS,
    peepCmH2O: 20,
  }), 1, "e37db2e4356c426970241b7c225f56a16b9f1c6a95a641758e007a87cd6330cc"),
  corpusCase("tachycardia", Object.freeze({
    ...DEFAULTS,
    heartRateBpm: 100,
  }), 1, "84fd0cff65045277a80fa985c570be110467dbe44c01f7cb1144000fd03fd688"),
  corpusCase(
    "high-contractility",
    DEFAULTS,
    1.25,
    "c7fb801121575e8ae801d42a57bd0b89f3b2ca52f3fff5572c433af7031d8655",
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
