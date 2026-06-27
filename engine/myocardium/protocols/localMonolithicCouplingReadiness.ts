import protocolDescriptor from "@/data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json";
import {
  LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
  runLocalMonolithicBeV1ReferenceSuite,
  type LocalMonolithicBeV1ReferenceSuite,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  THICK_SPHERE_V2_SELECTED_BACKEND_ID,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE,
  THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
  THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET,
  THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET,
  computeThickSphereV2SelectedCandidateStableHash,
  computeThickSphereV2SelectedParameterSetStableHash,
} from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
  runSelectedMechanicsCalibrationReadinessReport,
} from "@/engine/myocardium/protocols/selectedMechanicsCalibrationReadiness";

export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID =
  "local-monolithic-coupling-phase5a-protocols-v1";
export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE = "Phase 5A";
export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY =
  "local-monolithic-be-reference-readiness-only";
export const LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS =
  "not-phase5-completion";

export type LocalMonolithicCouplingReadinessStatus =
  | "local-monolithic-be-reference-ready"
  | "local-monolithic-be-reference-review";

export type LocalMonolithicCouplingSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type LocalMonolithicCouplingReadinessSection = {
  readonly id: string;
  readonly status: LocalMonolithicCouplingSectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type Phase4DReadOnlyPinnedEvidence = {
  readonly reusePolicy: "read-only";
  readonly protocolSetId: typeof SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID;
  readonly phase4DReadinessPass: boolean;
  readonly expectedStableSummaryHash: string;
  readonly acceptedStableSummaryHashes: readonly string[];
  readonly stableSummaryHash: string;
  readonly stableSummaryHashMatchesPinned: boolean;
  readonly expectedSelectedCandidateStableHash: string;
  readonly selectedCandidateStableHash: string;
  readonly selectedCandidateStableHashMatchesPinned: boolean;
  readonly expectedLvParameterSetStableHash: string;
  readonly lvParameterSetStableHash: string;
  readonly lvParameterSetStableHashMatchesPinned: boolean;
  readonly expectedRvParameterSetStableHash: string;
  readonly rvParameterSetStableHash: string;
  readonly rvParameterSetStableHashMatchesPinned: boolean;
  readonly selectedCandidateId:
    typeof THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID;
  readonly selectedBackendId: typeof THICK_SPHERE_V2_SELECTED_BACKEND_ID;
  readonly driftPolicy: "fail-if-current-recomputed-values-differ";
  readonly pass: boolean;
};

export type LocalMonolithicCouplingReadinessReport = {
  readonly protocolSetId: typeof LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID;
  readonly phase: typeof LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE;
  readonly phaseCompletionStatus: typeof LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY;
  readonly readinessStatus: LocalMonolithicCouplingReadinessStatus;
  readonly referenceModelId: typeof LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID;
  readonly referenceModelClaimBoundary: typeof LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY;
  readonly referenceModelStatus: "pure-reference-not-runtime-wired";
  readonly sdirk2ReferenceCompletion: "deferred-to-phase5b";
  readonly sdirk2DeferralReason: string;
  readonly phase4DReadOnlyEvidence: Phase4DReadOnlyPinnedEvidence;
  readonly localReferenceSolve: LocalMonolithicBeV1ReferenceSuite;
  readonly localReferenceAcceptance: {
    readonly requiredVentricles: readonly ["LV", "RV"];
    readonly maxLocalForceBalanceResidualAbsPa: number;
    readonly maxLandResidualNorm: number;
    readonly allSamplesPass: boolean;
    readonly landStageScheme: "BE";
    readonly landStageIndex: 0;
    readonly landBeConvergencePass: boolean;
    readonly localForceBalanceResidualPass: boolean;
    readonly newtonEvidencePass: boolean;
    readonly finiteStateHealthPass: boolean;
    readonly derivedLandStrainRateConsistencyPass: boolean;
    readonly deterministicHashPass: boolean;
    readonly pass: boolean;
  };
  readonly claimExclusions: {
    readonly phase5Completion: "not-claimed";
    readonly sdirk2ReferenceCompletion: "not-claimed";
    readonly productionSolverComparison: "not-claimed";
    readonly performanceAcceptance: "not-claimed";
    readonly activeStiffnessProductionCoupling: "not-claimed";
    readonly activeStiffnessPartitionedProductionCoupling: "not-claimed";
    readonly productionMechanics: "not-claimed";
    readonly productionHomogenization: "not-claimed";
    readonly productionPassiveLaw: "not-claimed";
    readonly productionValidation: "not-claimed";
    readonly officialMorphologyOutcome: "not-claimed";
    readonly morphologyPass: "not-claimed";
    readonly robustNoAlternans: "not-claimed";
    readonly calciumCyclingAlternansValidation: "not-claimed";
    readonly liveRuntimeReplacement: "not-claimed";
    readonly runtimeSchemaStateLayoutChange: "not-claimed";
    readonly ModelCoreChamberWiring: "not-claimed";
    readonly chamberWiring: "not-claimed";
    readonly caseWiring: "not-claimed";
    readonly officialCaseWiring: "not-claimed";
    readonly workbenchWiring: "not-claimed";
    readonly septalCoordinateImplementation: "not-claimed";
    readonly septalCouplingImplementation: "not-claimed";
    readonly RVPressureOverloadCoverage: "not-claimed";
    readonly septalBowingCoverage: "not-claimed";
    readonly ventricularInterdependenceCoverage: "not-claimed";
    readonly rightHeartFailureCoverage: "not-claimed";
    readonly TriSegAdoption: "not-claimed";
  };
  readonly runtimeIsolation: {
    readonly status: "no-runtime-wiring";
    readonly scanPolicy: "mirror-phase4d-runtime-target-set";
    readonly runtimeWiringStatus: "not-runtime-wired";
  };
  readonly futureTriSegPath: {
    readonly trisegLiteCandidateId: "triseg-lite-compatible";
    readonly fullTrisegCompatibleCandidateId: "full-triseg-compatible";
    readonly fullTriSegPath: string;
    readonly adoptionStatus: "not-claimed";
  };
  readonly requiredVerificationScripts: readonly string[];
  readonly sections: readonly LocalMonolithicCouplingReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

const REQUIRED_PROTOCOL_IDS = [
  "phase5a-boundary-v1",
  "phase4d-read-only-pin-v1",
  "local-monolithic-be-reference-identity-v1",
  "land-be-convergence-v1",
  "local-force-balance-residual-v1",
  "newton-line-search-evidence-v1",
  "finite-state-health-v1",
  "derived-land-strain-rate-consistency-v1",
  "runtime-isolation-v1",
  "noncoverage-sdirk2-triseg-boundary-v1",
  "deterministic-replay-v1",
] as const;

export function runLocalMonolithicCouplingReadinessReport():
  LocalMonolithicCouplingReadinessReport {
  const phase4DReadOnlyEvidence = phase4DReadOnlyEvidenceSummary();
  const localReferenceSolve = runLocalMonolithicBeV1ReferenceSuite();
  const localReferenceAcceptance = localReferenceAcceptanceSummary(localReferenceSolve);
  const claimExclusions = reportClaimExclusions();
  const runtimeIsolation = reportRuntimeIsolation();
  const futureTriSegPath = reportFutureTriSegPath();

  const sections = [
    phase5ABoundarySection(),
    phase4DReadOnlyPinSection(phase4DReadOnlyEvidence),
    referenceIdentitySection(localReferenceSolve),
    landBeConvergenceSection(localReferenceSolve),
    localForceBalanceResidualSection(localReferenceSolve),
    newtonLineSearchEvidenceSection(localReferenceSolve),
    finiteStateHealthSection(localReferenceSolve),
    derivedLandStrainRateConsistencySection(localReferenceSolve),
    runtimeIsolationSection(runtimeIsolation),
    nonCoverageSdirk2TriSegBoundarySection(claimExclusions, futureTriSegPath),
    deterministicReplaySection(localReferenceSolve),
  ] as const;
  const readinessPass = sections.every((section) => section.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID,
    phase: LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE,
    phaseCompletionStatus: LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS,
    claimBoundary: LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY,
    readinessStatus:
      readinessPass
        ? "local-monolithic-be-reference-ready"
        : "local-monolithic-be-reference-review",
    referenceModelId: LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
    referenceModelClaimBoundary: LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY,
    referenceModelStatus: "pure-reference-not-runtime-wired",
    sdirk2ReferenceCompletion: "deferred-to-phase5b",
    sdirk2DeferralReason: protocolDescriptor.sdirk2DeferralReason,
    phase4DReadOnlyEvidence,
    localReferenceSolve,
    localReferenceAcceptance,
    claimExclusions,
    runtimeIsolation,
    futureTriSegPath,
    requiredVerificationScripts: [...protocolDescriptor.requiredVerificationScripts],
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
    readinessPass,
  };

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  } as LocalMonolithicCouplingReadinessReport;
}

function phase4DReadOnlyEvidenceSummary(): Phase4DReadOnlyPinnedEvidence {
  const phase4DReport = runSelectedMechanicsCalibrationReadinessReport();
  const pinned = protocolDescriptor.phase4DReadOnlyEvidence;
  const selectedCandidateStableHash = computeThickSphereV2SelectedCandidateStableHash();
  const lvParameterSetStableHash =
    computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET);
  const rvParameterSetStableHash =
    computeThickSphereV2SelectedParameterSetStableHash(THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET);
  const acceptedStableSummaryHashes = Array.from(new Set([
    pinned.stableSummaryHash,
    ...pinned.acceptedStableSummaryHashes,
  ]));
  const stableSummaryHashMatchesPinned =
    acceptedStableSummaryHashes.includes(phase4DReport.stableSummaryHash);
  const selectedCandidateStableHashMatchesPinned =
    selectedCandidateStableHash === pinned.selectedCandidateStableHash
    && THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE.candidateStableHash
      === pinned.selectedCandidateStableHash;
  const lvParameterSetStableHashMatchesPinned =
    lvParameterSetStableHash === pinned.lvParameterSetStableHash
    && THICK_SPHERE_V2_SELECTED_LV_PARAMETER_SET.parameterSetStableHash
      === pinned.lvParameterSetStableHash;
  const rvParameterSetStableHashMatchesPinned =
    rvParameterSetStableHash === pinned.rvParameterSetStableHash
    && THICK_SPHERE_V2_SELECTED_RV_PARAMETER_SET.parameterSetStableHash
      === pinned.rvParameterSetStableHash;
  const pass =
    pinned.reusePolicy === "read-only"
    && phase4DReport.protocolSetId === SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID
    && phase4DReport.readinessPass
    && stableSummaryHashMatchesPinned
    && selectedCandidateStableHashMatchesPinned
    && lvParameterSetStableHashMatchesPinned
    && rvParameterSetStableHashMatchesPinned
    && pinned.selectedCandidateId === THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID
    && pinned.selectedBackendId === THICK_SPHERE_V2_SELECTED_BACKEND_ID
    && pinned.driftPolicy === "fail-if-current-recomputed-values-differ";

  return {
    reusePolicy: "read-only",
    protocolSetId: SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
    phase4DReadinessPass: phase4DReport.readinessPass,
    expectedStableSummaryHash: pinned.stableSummaryHash,
    acceptedStableSummaryHashes,
    stableSummaryHash: phase4DReport.stableSummaryHash,
    stableSummaryHashMatchesPinned,
    expectedSelectedCandidateStableHash: pinned.selectedCandidateStableHash,
    selectedCandidateStableHash,
    selectedCandidateStableHashMatchesPinned,
    expectedLvParameterSetStableHash: pinned.lvParameterSetStableHash,
    lvParameterSetStableHash,
    lvParameterSetStableHashMatchesPinned,
    expectedRvParameterSetStableHash: pinned.rvParameterSetStableHash,
    rvParameterSetStableHash,
    rvParameterSetStableHashMatchesPinned,
    selectedCandidateId: THICK_SPHERE_V2_SELECTED_CALIBRATION_CANDIDATE_ID,
    selectedBackendId: THICK_SPHERE_V2_SELECTED_BACKEND_ID,
    driftPolicy: "fail-if-current-recomputed-values-differ",
    pass,
  };
}

function localReferenceAcceptanceSummary(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessReport["localReferenceAcceptance"] {
  const acceptance = protocolDescriptor.localReferenceAcceptance;
  const landBeConvergencePass = suite.samples.every((sample) =>
    sample.allLandSolvesOk
    && sample.maxLandResidualNorm <= acceptance.maxLandResidualNorm
    && sample.final.land.method === "writeLand2017BackwardEulerResidual"
    && sample.final.land.residualSource === "Land 2017 backward-Euler residual"
    && sample.final.land.stageScheme === "BE"
    && sample.final.land.stageIndex === 0
    && sample.final.land.nextState.length === 6,
  );
  const localForceBalanceResidualPass =
    suite.maxLocalForceBalanceResidualAbsPa
    <= acceptance.maxLocalForceBalanceResidualAbsPa;
  const newtonEvidencePass = suite.samples.every((sample) =>
    sample.newton.ok
    && sample.newton.unknownVectorDimension === 7
    && sample.newton.iterationCount > 0
    && sample.newton.lineSearchTrialCount >= sample.newton.iterationCount
    && sample.newton.derivativeEvaluationCount > 0
    && sample.newton.residualEvaluationCount > 0
    && Number.isFinite(sample.newton.finalJacobianDeterminant)
    && Number.isFinite(sample.newton.finalVolumeDerivativePaPerM3)
    && sample.newton.finalLandResidualNorm <= acceptance.maxLandResidualNorm,
  );
  const finiteStateHealthPass = suite.samples.every((sample) => sample.finiteHealth.pass);
  const derivedLandStrainRateConsistencyPass =
    suite.samples.every((sample) => sample.final.strainRate.pass);
  const deterministicHashPass =
    suite.samples.every((sample) => /^[0-9a-f]{8}$/.test(sample.deterministicHash))
    && /^[0-9a-f]{8}$/.test(suite.stableSummaryHash);
  const pass =
    suite.modelId === LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    && suite.claimBoundary === LOCAL_MONOLITHIC_BE_V1_CLAIM_BOUNDARY
    && suite.lvCovered
    && suite.rvCovered
    && suite.allSamplesPass
    && landBeConvergencePass
    && localForceBalanceResidualPass
    && newtonEvidencePass
    && finiteStateHealthPass
    && derivedLandStrainRateConsistencyPass
    && deterministicHashPass;

  return {
    requiredVentricles: ["LV", "RV"],
    maxLocalForceBalanceResidualAbsPa: acceptance.maxLocalForceBalanceResidualAbsPa,
    maxLandResidualNorm: acceptance.maxLandResidualNorm,
    allSamplesPass: suite.allSamplesPass,
    landStageScheme: "BE",
    landStageIndex: 0,
    landBeConvergencePass,
    localForceBalanceResidualPass,
    newtonEvidencePass,
    finiteStateHealthPass,
    derivedLandStrainRateConsistencyPass,
    deterministicHashPass,
    pass,
  };
}

function phase5ABoundarySection(): LocalMonolithicCouplingReadinessSection {
  const ok =
    protocolDescriptor.protocolSetId === LOCAL_MONOLITHIC_COUPLING_PHASE5A_PROTOCOL_SET_ID
    && protocolDescriptor.phase === LOCAL_MONOLITHIC_COUPLING_PHASE5A_PHASE
    && protocolDescriptor.phaseCompletionStatus === LOCAL_MONOLITHIC_COUPLING_PHASE5A_COMPLETION_STATUS
    && protocolDescriptor.claimBoundary === LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY
    && protocolDescriptor.statusBoundary === LOCAL_MONOLITHIC_COUPLING_PHASE5A_CLAIM_BOUNDARY
    && protocolDescriptor.referenceModelId === LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    && protocolDescriptor.referenceModelStatus === "pure-reference-not-runtime-wired";
  return section("phase5a-boundary-v1", ok, {
    phase: protocolDescriptor.phase,
    phaseCompletionStatus: protocolDescriptor.phaseCompletionStatus,
    claimBoundary: protocolDescriptor.claimBoundary,
    referenceModelId: protocolDescriptor.referenceModelId,
  });
}

function phase4DReadOnlyPinSection(
  evidence: Phase4DReadOnlyPinnedEvidence,
): LocalMonolithicCouplingReadinessSection {
  return section("phase4d-read-only-pin-v1", evidence.pass, evidence);
}

function referenceIdentitySection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  const ok =
    protocolDescriptor.referenceModelId === LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    && suite.modelId === LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    && protocolDescriptor.modelIds.referenceModelId === LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID
    && protocolDescriptor.modelIds.lvCoordinateId === "lv-cavity-volume"
    && protocolDescriptor.modelIds.rvCoordinateId === "rv-cavity-volume"
    && suite.lvCovered
    && suite.rvCovered;
  return section("local-monolithic-be-reference-identity-v1", ok, {
    modelId: suite.modelId,
    claimBoundary: suite.claimBoundary,
    sampleCount: suite.sampleCount,
    lvCovered: suite.lvCovered,
    rvCovered: suite.rvCovered,
  });
}

function landBeConvergenceSection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  const tolerance = protocolDescriptor.localReferenceAcceptance.maxLandResidualNorm;
  const samples = suite.samples.map((sample) => ({
    id: sample.id,
    ok: sample.final.land.ok,
    residualNorm: sample.final.land.residualNorm,
    residualSource: sample.final.land.residualSource,
    stateUpdateLinf: sample.final.land.stateUpdateLinf,
    stageScheme: sample.final.land.stageScheme,
    stageIndex: sample.final.land.stageIndex,
    nextStateSize: sample.final.land.nextState.length,
  }));
  const ok = samples.every((sample) =>
    sample.ok
    && sample.residualNorm <= tolerance
    && sample.residualSource === "Land 2017 backward-Euler residual"
    && sample.stageScheme === "BE"
    && sample.stageIndex === 0
    && sample.nextStateSize === 6,
  );
  return section("land-be-convergence-v1", ok, {
    tolerance,
    maxLandResidualNorm: suite.maxLandResidualNorm,
    samples,
  });
}

function localForceBalanceResidualSection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  const tolerance = protocolDescriptor.localReferenceAcceptance.maxLocalForceBalanceResidualAbsPa;
  return section(
    "local-force-balance-residual-v1",
    suite.maxLocalForceBalanceResidualAbsPa <= tolerance,
    {
      tolerance,
      maxLocalForceBalanceResidualAbsPa: suite.maxLocalForceBalanceResidualAbsPa,
      samples: suite.samples.map((sample) => ({
        id: sample.id,
        finalResidualAbsPa: sample.newton.finalResidualAbsPa,
        solvedCavityVolumeM3: sample.solvedCavityVolumeM3,
        targetExternalPressurePa: sample.targetExternalPressurePa,
      })),
    },
  );
}

function newtonLineSearchEvidenceSection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  const ok = suite.samples.every((sample) =>
    sample.newton.ok
    && sample.newton.unknownVectorDimension === 7
    && sample.newton.iterationCount > 0
    && sample.newton.lineSearchTrialCount >= sample.newton.iterationCount
    && sample.newton.derivativeEvaluationCount > 0
    && sample.newton.residualEvaluationCount > 0
    && Number.isFinite(sample.newton.finalJacobianDeterminant)
    && Number.isFinite(sample.newton.finalVolumeDerivativePaPerM3),
  );
  return section("newton-line-search-evidence-v1", ok, {
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      iterationCount: sample.newton.iterationCount,
      lineSearchTrialCount: sample.newton.lineSearchTrialCount,
      lineSearchBacktrackCount: sample.newton.lineSearchBacktrackCount,
      derivativeEvaluationCount: sample.newton.derivativeEvaluationCount,
      residualEvaluationCount: sample.newton.residualEvaluationCount,
      unknownVectorDimension: sample.newton.unknownVectorDimension,
      coupledUnknowns: sample.newton.coupledUnknowns,
      finalResidualNorm: sample.newton.finalResidualNorm,
      finalLandResidualNorm: sample.newton.finalLandResidualNorm,
      finalJacobianDeterminant: sample.newton.finalJacobianDeterminant,
      finalVolumeDerivativePaPerM3: sample.newton.finalVolumeDerivativePaPerM3,
      residualHistoryPa: sample.newton.residualHistoryPa,
      residualNormHistory: sample.newton.residualNormHistory,
    })),
  });
}

function finiteStateHealthSection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  return section("finite-state-health-v1", suite.samples.every((sample) => sample.finiteHealth.pass), {
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      finiteHealth: sample.finiteHealth,
      calciumFinite: sample.calcium.finite,
      finalFinite: sample.final.finite,
    })),
  });
}

function derivedLandStrainRateConsistencySection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  return section(
    "derived-land-strain-rate-consistency-v1",
    suite.samples.every((sample) => sample.final.strainRate.pass),
    {
      samples: suite.samples.map((sample) => ({
        id: sample.id,
        strainRate: sample.final.strainRate,
      })),
    },
  );
}

function runtimeIsolationSection(
  runtimeIsolation: LocalMonolithicCouplingReadinessReport["runtimeIsolation"],
): LocalMonolithicCouplingReadinessSection {
  const ok =
    runtimeIsolation.status === "no-runtime-wiring"
    && runtimeIsolation.scanPolicy === "mirror-phase4d-runtime-target-set"
    && runtimeIsolation.runtimeWiringStatus === "not-runtime-wired"
    && protocolDescriptor.runtimeIsolation.status === "no-runtime-wiring"
    && protocolDescriptor.runtimeIsolation.scanPolicy === "mirror-phase4d-runtime-target-set";
  return section("runtime-isolation-v1", ok, runtimeIsolation);
}

function nonCoverageSdirk2TriSegBoundarySection(
  claimExclusions: LocalMonolithicCouplingReadinessReport["claimExclusions"],
  futureTriSegPath: LocalMonolithicCouplingReadinessReport["futureTriSegPath"],
): LocalMonolithicCouplingReadinessSection {
  const settings = protocolDescriptor.protocolSettings;
  const ok =
    protocolDescriptor.sdirk2ReferenceCompletion === "deferred-to-phase5b"
    && /deriveLand2017StepKinematics\(\).*throws.*SDIRK2/i.test(protocolDescriptor.sdirk2DeferralReason)
    && Object.values(claimExclusions).every((value) => value === "not-claimed")
    && Object.values(protocolDescriptor.claimExclusions).every((value) => value === "not-claimed")
    && settings.useSDIRK2ReferenceCompletion === false
    && settings.useProductionSolverComparison === false
    && settings.usePerformanceAcceptance === false
    && settings.useActiveStiffnessProductionCoupling === false
    && settings.useRuntimeReplacement === false
    && settings.useModelCoreRuntimeWiring === false
    && settings.useChamberRuntimeWiring === false
    && settings.useCaseRuntimeWiring === false
    && settings.useOfficialCaseWiring === false
    && settings.useWorkbenchRuntimeWiring === false
    && settings.useOfficialMorphologyAcceptance === false
    && settings.useRobustNoAlternansAcceptance === false
    && settings.useCalciumCyclingAlternansValidation === false
    && settings.validateRVPressureOverload === false
    && settings.validateVentricularInterdependence === false
    && settings.validateRightHeartFailure === false
    && settings.adoptTriSeg === false
    && futureTriSegPath.adoptionStatus === "not-claimed"
    && /full TriSeg/.test(futureTriSegPath.fullTriSegPath);
  return section("noncoverage-sdirk2-triseg-boundary-v1", ok, {
    sdirk2ReferenceCompletion: protocolDescriptor.sdirk2ReferenceCompletion,
    sdirk2DeferralReason: protocolDescriptor.sdirk2DeferralReason,
    claimExclusions,
    futureTriSegPath,
  });
}

function deterministicReplaySection(
  suite: LocalMonolithicBeV1ReferenceSuite,
): LocalMonolithicCouplingReadinessSection {
  const second = runLocalMonolithicBeV1ReferenceSuite();
  const ok =
    suite.stableSummaryHash === second.stableSummaryHash
    && suite.samples.length === second.samples.length
    && suite.samples.every((sample, index) =>
      sample.deterministicHash === second.samples[index]?.deterministicHash,
    );
  return section("deterministic-replay-v1", ok, {
    firstHash: suite.stableSummaryHash,
    secondHash: second.stableSummaryHash,
    deterministic: ok,
    sampleHashes: suite.samples.map((sample) => sample.deterministicHash),
  });
}

function reportClaimExclusions():
  LocalMonolithicCouplingReadinessReport["claimExclusions"] {
  return {
    phase5Completion: "not-claimed",
    sdirk2ReferenceCompletion: "not-claimed",
    productionSolverComparison: "not-claimed",
    performanceAcceptance: "not-claimed",
    activeStiffnessProductionCoupling: "not-claimed",
    activeStiffnessPartitionedProductionCoupling: "not-claimed",
    productionMechanics: "not-claimed",
    productionHomogenization: "not-claimed",
    productionPassiveLaw: "not-claimed",
    productionValidation: "not-claimed",
    officialMorphologyOutcome: "not-claimed",
    morphologyPass: "not-claimed",
    robustNoAlternans: "not-claimed",
    calciumCyclingAlternansValidation: "not-claimed",
    liveRuntimeReplacement: "not-claimed",
    runtimeSchemaStateLayoutChange: "not-claimed",
    ModelCoreChamberWiring: "not-claimed",
    chamberWiring: "not-claimed",
    caseWiring: "not-claimed",
    officialCaseWiring: "not-claimed",
    workbenchWiring: "not-claimed",
    septalCoordinateImplementation: "not-claimed",
    septalCouplingImplementation: "not-claimed",
    RVPressureOverloadCoverage: "not-claimed",
    septalBowingCoverage: "not-claimed",
    ventricularInterdependenceCoverage: "not-claimed",
    rightHeartFailureCoverage: "not-claimed",
    TriSegAdoption: "not-claimed",
  };
}

function reportRuntimeIsolation():
  LocalMonolithicCouplingReadinessReport["runtimeIsolation"] {
  return {
    status: "no-runtime-wiring",
    scanPolicy: "mirror-phase4d-runtime-target-set",
    runtimeWiringStatus: "not-runtime-wired",
  };
}

function reportFutureTriSegPath():
  LocalMonolithicCouplingReadinessReport["futureTriSegPath"] {
  return {
    trisegLiteCandidateId: "triseg-lite-compatible",
    fullTrisegCompatibleCandidateId: "full-triseg-compatible",
    fullTriSegPath:
      "A full TriSeg escalation path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed as covered primary mechanisms.",
    adoptionStatus: "not-claimed",
  };
}

function section(
  id: typeof REQUIRED_PROTOCOL_IDS[number],
  ok: boolean,
  metrics: Record<string, unknown>,
): LocalMonolithicCouplingReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}
