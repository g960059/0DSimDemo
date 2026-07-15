import { createHash } from "node:crypto";
import { compilePhaseA1LandWallAdapterContextV1 } from
  "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import {
  FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1,
} from "@/engine/myocardium/fourChamberV1/phaseA1ReadinessV1";
import { bindPhaseA1PassiveSlsFromTissueManifestV1 } from
  "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  auditAtrialLandCandidateAgainstLiteratureV1,
  buildAtrialLandLiteratureReferenceV1,
} from "@/engine/myocardium/fourChamberV1/land/atrialLandLiteratureReferenceV1";
import {
  runAtrialLandLateStretchComponentProtocolV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandLateStretchComponentProtocolV1";
import {
  ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1,
  runAtrialLandGerachCandidateProtocolV1,
} from "@/engine/myocardium/fourChamberV1/protocols/atrialLandGerachCandidateProtocolV1";
import { canonicalizeJson } from
  "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET } from
  "@/engine/myocardium/myofilament/land2017/parameterSets";
import { LAND2017_STATE_SIZE } from
  "@/engine/myocardium/myofilament/land2017/types";
import {
  TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1,
  auditTriSegAppendixAcSeriesOverlapV1,
} from "@/engine/myocardium/fourChamberV1/triseg/appendixAcStableFunctionsV1";
import {
  STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
  STABILIZED_TRISEG_APPENDIX_AC_NORMALIZATION_V1,
  STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS,
  validateStabilizedTriSegAppendixAcHighPrecisionPackV1,
} from "@/engine/myocardium/fourChamberV1/triseg/stabilizedAppendixAcReferenceV1";
import { PUBLISHED_TRISEG_TAYLOR_ACCEPTANCE_POLICY_V1 } from
  "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";

const EXPECTED_COMPLETION_STATUS: string =
  "component-oracles-complete-with-explicit-release-blockers";
const EXPECTED_READINESS_SHA256 =
  "98f593ddd824920bd3261ecd50af840161160f896198e6ccf92de6d1fe8f564a";
const EXPECTED_TAYLOR_POLICY_SHA256 =
  "958b0c1eaab366d69ae3d8c40d0c76582245b27f47244a1d0f4aec16e79f2fe2";
const EXPECTED_APPENDIX_REFERENCE_STATUS_SHA256 =
  "f628b873b4ff47bf35b5dc10216d77f8754c7265bddb18f6247e6af0f9cd1741";
const EXPECTED_APPENDIX_STABLE_FUNCTION_POLICY_SHA256 =
  "6528ea9480b8fb0792a801646a83d7aed0841d52f21e70a0e9a6cf37108fae0e";
const EXPECTED_APPENDIX_NORMALIZATION_SHA256 =
  "81c4e58f30bff635fcc3a67028639ae090d504e17aecb251567290ee9c959483";
const EXPECTED_ATRIAL_LAND_LITERATURE_REFERENCE_SHA256 =
  "3655a58973ac884eefaefc3d7e29555717f4aef36899283a1a51064de3ea27b7";
const EXPECTED_ATRIAL_LAND_CANDIDATE_AUDIT_SHA256 =
  "3b9b106a8971f56fbe5890d49b0ce0d4e765ab0d865e03ad77d9cb6afed38485";
const EXPECTED_ATRIAL_LAND_LATE_STRETCH_RESULT_SHA256 =
  "1de5a8a72c28b648c0f72d1e3dabda330a2a2c5dd9e8b57509649dddd975a8ff";
const EXPECTED_ATRIAL_LAND_GERACH_CANDIDATE_AUDIT_SHA256 =
  "59ffed9b20dc156d83230fdbb4f3128487caeb7cb15e6ea407a15ebbb72c03c4";
const EXPECTED_RELEASE_BLOCKERS: readonly string[] = [
  "Replace source-regression-only Land packs and project-synthetic priors with predeclared experimental acceptance evidence before physiological release claims",
  "Complete Phase B/C closed-loop DAE assembly, root conditioning, whole-heart conservation/work audits, and solver convergence gates",
  "Complete closed-loop-only component gates including active atrial A-wave causality, graded PH roots, valve-floor convergence, and paired SLS-on/off causal attribution without a predeclared morphology outcome",
  "Freeze and content-hash the Phase B valve/inlet numerical policy for A_num, epsilon_P, and epsilon_Q",
];

const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
const atrialParameterSet = buildAtrialHumanPriorLandEquationParametersV1();
const atrialLandLiteratureReference = buildAtrialLandLiteratureReferenceV1(sha256);
const atrialTwitch = bundle.atrialTargetPack.isolatedTwitchTarget;
const atrialLandLiteratureAudit = auditAtrialLandCandidateAgainstLiteratureV1({
  candidateId: bundle.atrialManifest.familyId,
  activeEquationStateCount: LAND2017_STATE_SIZE,
  parameterSetStableHash: atrialParameterSet.parameterSetStableHash,
  targetPackSha256: bundle.atrialTargetPack.contentSha256,
  caT50RefUM: atrialParameterSet.values.CaT50Ref,
  ventricularKwsPerSec: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET.values.kws,
  atrialKwsPerSec: atrialParameterSet.values.kws,
  calciumDiastolicUM: ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1.calciumDiastolicUM,
  calciumPeakUM:
    ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1.calciumDiastolicUM
    + ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1.calciumAmplitudeUM,
  calciumWaveformEvidence: "project-synthetic-biexponential-not-digitized-brixius",
  isolatedTwitch: {
    timeToPeakSec: atrialTwitch.timeToPeakSec,
    relaxationTime50Sec: atrialTwitch.relaxationTime50Sec,
    relaxationTime90Sec: atrialTwitch.relaxationTime90Sec,
  },
  absoluteSarcomereLengthMappingAvailable: false,
  quickLengthStepProtocolImplemented: false,
  slackRestretchKtrProtocolImplemented: false,
  fittedToAtrialPvLoop: bundle.atrialManifest.homogenization.fitToPVLoop,
}, atrialLandLiteratureReference, sha256);
const atrialLandLateStretchProtocol =
  runAtrialLandLateStretchComponentProtocolV1(sha256);
const atrialLandGerachCandidateProtocol =
  runAtrialLandGerachCandidateProtocolV1(sha256);
const actualHashes = {
  bundle: bundle.contentSha256,
  ventricularManifest: bundle.ventricularManifest.contentSha256,
  atrialManifest: bundle.atrialManifest.contentSha256,
  ventricularTargetPack: bundle.ventricularTargetPack.contentSha256,
  atrialTargetPack: bundle.atrialTargetPack.contentSha256,
};
const ventricularLandContext = compilePhaseA1LandWallAdapterContextV1(
  bundle,
  "ventricular",
  sha256,
);
const atrialLandContext = compilePhaseA1LandWallAdapterContextV1(bundle, "atrial", sha256);
const ventricularPassiveSls = bindPhaseA1PassiveSlsFromTissueManifestV1(
  bundle,
  "ventricular",
  sha256,
);
const atrialPassiveSls = bindPhaseA1PassiveSlsFromTissueManifestV1(bundle, "atrial", sha256);
const highPrecisionPack = validateStabilizedTriSegAppendixAcHighPrecisionPackV1(sha256);
const stableFunctionOverlapAudit = auditTriSegAppendixAcSeriesOverlapV1();
const readinessSha256 = sha256(canonicalizeJson(FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1));
const taylorPolicySha256 = sha256(canonicalizeJson(PUBLISHED_TRISEG_TAYLOR_ACCEPTANCE_POLICY_V1));
const appendixReferenceStatusSha256 = sha256(
  canonicalizeJson(STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS),
);
const appendixStableFunctionPolicySha256 = sha256(
  canonicalizeJson(TRISEG_APPENDIX_AC_STABLE_FUNCTION_POLICY_V1),
);
const appendixNormalizationSha256 = sha256(
  canonicalizeJson(STABILIZED_TRISEG_APPENDIX_AC_NORMALIZATION_V1),
);
const failures: string[] = [];

if (canonicalizeJson(actualHashes) !== canonicalizeJson(PHASE_A1_TISSUE_MANIFEST_PINNED_HASHES_V1)) {
  failures.push("Phase A1 tissue manifest or target-pack identity drifted without a version update");
}
if (
  ventricularLandContext.tissueManifestSha256 !== bundle.ventricularManifest.contentSha256
  || atrialLandContext.tissueManifestSha256 !== bundle.atrialManifest.contentSha256
) {
  failures.push("Phase A1 tissue manifests are not consumable by the Land wall adapter contract");
}
if (!ventricularPassiveSls.completeParameterParity || !atrialPassiveSls.completeParameterParity) {
  failures.push("Executed passive/SLS priors do not match their content-hashed manifest owner");
}
if (
  FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.runtimeBoundary.modelCoreIntegration
  || FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.runtimeBoundary.browserRuntimeAdopted
  || FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.runtimeBoundary.mechanics2Dependency
) {
  failures.push("Phase A1 escaped its clean-slate runtime boundary");
}
if (
  STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.status
    !== "canonical-component-reference"
  || !STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS
    .normativeWithinOriginalSphericalOneFiberAssumptions
  || STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.anatomicalTruthClaimed
  || STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.physiologicalValidationClaimed
  || STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.triSegRootAcceptanceImplied
  || STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.closedLoopReleaseEligible
  || appendixReferenceStatusSha256 !== EXPECTED_APPENDIX_REFERENCE_STATUS_SHA256
  || appendixStableFunctionPolicySha256 !== EXPECTED_APPENDIX_STABLE_FUNCTION_POLICY_SHA256
  || appendixNormalizationSha256 !== EXPECTED_APPENDIX_NORMALIZATION_SHA256
  || taylorPolicySha256 !== EXPECTED_TAYLOR_POLICY_SHA256
  || highPrecisionPack.vectors.length !== 11
  || !stableFunctionOverlapAudit.accepted
) {
  failures.push("The stabilized Appendix-A/C component reference or its numerical evidence drifted");
}
if (
  FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.completionStatus
    !== EXPECTED_COMPLETION_STATUS
  || readinessSha256 !== EXPECTED_READINESS_SHA256
  || !FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.phaseA1Complete
  || FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.closedLoopReleaseEligible
  || FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.clinicalReleaseReady
  || bundle.closedLoopReleaseEligible
) {
  failures.push("Phase A1 completion or release claim boundary is inconsistent");
}
if (
  canonicalizeJson(FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.releaseBlockers)
    !== canonicalizeJson(EXPECTED_RELEASE_BLOCKERS)
  || FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.components.signedValveAndInletLoss
    !== "implemented-component-equations-phase-b-selection-policy-unbound"
) {
  failures.push("Phase A1 required release blockers or valve numerical-policy boundary drifted");
}
if (
  atrialLandLiteratureReference.contentSha256
    !== EXPECTED_ATRIAL_LAND_LITERATURE_REFERENCE_SHA256
  || atrialLandLiteratureAudit.contentSha256 !== EXPECTED_ATRIAL_LAND_CANDIDATE_AUDIT_SHA256
  || !atrialLandLiteratureAudit.legacySixStateMapping.exactPrimitiveMappingPass
  || !atrialLandLiteratureAudit.ownership.pvLoopOwnershipPass
  || atrialLandLiteratureAudit.lewalle2026Compatibility
    .publishedParameterSnapshotMayBeImportedDirectly
  || atrialLandLiteratureAudit.releaseGate.experimentalPromotionEligible
  || atrialLandLiteratureAudit.releaseGate.closedLoopReleaseEligible
) {
  failures.push("Atrial Land literature reference, ownership, or release boundary drifted");
}
if (
  atrialLandLateStretchProtocol.resultSummarySha256
    !== EXPECTED_ATRIAL_LAND_LATE_STRETCH_RESULT_SHA256
  || !atrialLandLateStretchProtocol.diagnosticGate.pass
  || atrialLandLateStretchProtocol.morphologyAcceptanceThresholdUsed
  || atrialLandLateStretchProtocol.closedLoopReleaseEligible
  || atrialLandLateStretchProtocol.physiologicalValidationClaimed
) {
  failures.push("Atrial Land late-stretch component protocol or claim boundary drifted");
}
if (
  atrialLandGerachCandidateProtocol.contentSha256
    !== EXPECTED_ATRIAL_LAND_GERACH_CANDIDATE_AUDIT_SHA256
  || atrialLandGerachCandidateProtocol.claimBoundary
    !== ATRIAL_LAND_GERACH_CANDIDATE_CLAIM_BOUNDARY_V1
  || !atrialLandGerachCandidateProtocol.numericalAudit.pass
  || atrialLandGerachCandidateProtocol.pvLoopFitUsed
  || atrialLandGerachCandidateProtocol.pvLoopGateUsed
  || atrialLandGerachCandidateProtocol.runtimeDefaultChanged
  || atrialLandGerachCandidateProtocol.runtimePromotionEligible
  || atrialLandGerachCandidateProtocol.physiologicalValidationClaimed
) {
  failures.push("Atrial Land Gerach competing-candidate protocol or claim boundary drifted");
}

const report = {
  pass: failures.length === 0,
  phase: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.phase,
  completionStatus: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.completionStatus,
  phaseA1Complete: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.phaseA1Complete,
  closedLoopReleaseEligible: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.closedLoopReleaseEligible,
  clinicalReleaseReady: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.clinicalReleaseReady,
  readinessSha256,
  manifestHashes: actualHashes,
  manifestToRuntimeBindings: {
    landWallContexts: true,
    passiveSlsParameterParity: true,
  },
  atrialLandLiteratureEvidence: {
    referenceSha256: atrialLandLiteratureReference.contentSha256,
    candidateAuditSha256: atrialLandLiteratureAudit.contentSha256,
    legacySixStateMapping: atrialLandLiteratureAudit.legacySixStateMapping,
    currentIsolatedTwitch: atrialLandLiteratureAudit.input.isolatedTwitch,
    legacyTwitchContextComparison:
      atrialLandLiteratureAudit.legacyTwitchContextComparison,
    lewalle2026Compatibility: atrialLandLiteratureAudit.lewalle2026Compatibility,
    ownership: atrialLandLiteratureAudit.ownership,
    releaseGate: atrialLandLiteratureAudit.releaseGate,
  },
  atrialLandLateStretchComponentEvidence: {
    resultSummarySha256: atrialLandLateStretchProtocol.resultSummarySha256,
    diagnosticGate: atrialLandLateStretchProtocol.diagnosticGate,
    fineGridSecondaryComponent:
      atrialLandLateStretchProtocol.secondaryComponents.find((component) =>
        component.dtSec === 0.00025),
    morphologyAcceptanceThresholdUsed:
      atrialLandLateStretchProtocol.morphologyAcceptanceThresholdUsed,
    closedLoopReleaseEligible:
      atrialLandLateStretchProtocol.closedLoopReleaseEligible,
  },
  atrialLandGerachCandidateEvidence: {
    contentSha256: atrialLandGerachCandidateProtocol.contentSha256,
    claimBoundary: atrialLandGerachCandidateProtocol.claimBoundary,
    candidateDefinition: atrialLandGerachCandidateProtocol.candidateDefinition,
    controlledProtocol: atrialLandGerachCandidateProtocol.controlledProtocol,
    fineGridComparison:
      atrialLandGerachCandidateProtocol.comparisons.find((comparison) =>
        comparison.dtSec === 0.00025),
    numericalAudit: atrialLandGerachCandidateProtocol.numericalAudit,
    runtimeDefaultChanged: atrialLandGerachCandidateProtocol.runtimeDefaultChanged,
    runtimePromotionEligible:
      atrialLandGerachCandidateProtocol.runtimePromotionEligible,
  },
  triSegTaylorAcceptancePolicy: PUBLISHED_TRISEG_TAYLOR_ACCEPTANCE_POLICY_V1,
  triSegTaylorAcceptancePolicySha256: taylorPolicySha256,
  appendixAcAnalyticalReference: {
    status: STABILIZED_TRISEG_APPENDIX_AC_REFERENCE_V1_STATUS.status,
    normativeScope: "original-spherical-one-fiber-assumptions-only",
    highPrecisionPackSha256: STABILIZED_TRISEG_APPENDIX_AC_HIGH_PRECISION_PACK_V1_SHA256,
    highPrecisionVectorCount: highPrecisionPack.vectors.length,
    stableFunctionOverlapMaximumRelativeDifference:
      stableFunctionOverlapAudit.maximumRelativeDifference,
    statusSha256: appendixReferenceStatusSha256,
    stableFunctionPolicySha256: appendixStableFunctionPolicySha256,
    normalizationSha256: appendixNormalizationSha256,
  },
  runtimeBoundary: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.runtimeBoundary,
  releaseBlockers: FOUR_CHAMBER_PHASE_A1_COMPONENT_STATUS_V1.releaseBlockers,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
