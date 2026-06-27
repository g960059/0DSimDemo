import protocolDescriptor from "@/data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json";
import {
  LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
  runLocalMonolithicBeV1ReferenceSuite,
  type LocalMonolithicBeV1ReferenceSuite,
} from "@/engine/myocardium/coupling/localMonolithicBeV1";
import {
  LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
  LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
  LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION,
  runLocalMonolithicSdirk2V1ReferenceSuite,
  type LocalMonolithicSdirk2V1ReferenceSuite,
} from "@/engine/myocardium/coupling/localMonolithicSdirk2V1";
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
  LAND2017_SDIRK2_GAMMA,
  LAND2017_SDIRK2_TABLEAU,
} from "@/engine/myocardium/myofilament/land2017";
import {
  SELECTED_MECHANICS_CALIBRATION_PHASE4D_PROTOCOL_SET_ID,
  runSelectedMechanicsCalibrationReadinessReport,
} from "@/engine/myocardium/protocols/selectedMechanicsCalibrationReadiness";

export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID =
  "local-monolithic-coupling-phase5b-sdirk2-protocols-v1";
export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE = "Phase 5B";
export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY =
  "local-monolithic-sdirk2-reference-readiness-only";
export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS =
  "not-phase5-completion";
export const LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION =
  "local-monolithic-synthetic-reference-complete";

export type LocalMonolithicSdirk2ReadinessStatus =
  | "local-monolithic-sdirk2-reference-ready"
  | "local-monolithic-sdirk2-reference-review";

export type LocalMonolithicSdirk2SectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type LocalMonolithicSdirk2ReadinessSection = {
  readonly id: string;
  readonly status: LocalMonolithicSdirk2SectionStatus;
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

export type BeVsSdirk2DiscrepancySample = {
  readonly ventricle: "LV" | "RV";
  readonly beSampleId: string;
  readonly sdirk2SampleId: string;
  readonly cavityVolumeAbsDiffM3: number;
  readonly landStateLinfDiff: number;
  readonly finite: boolean;
  readonly notIdentical: boolean;
  readonly withinBounds: boolean;
  readonly pass: boolean;
};

export type BeVsSdirk2DiscrepancyEvidence = {
  readonly beReferenceModelId: typeof LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID;
  readonly sdirk2ReferenceModelId: typeof LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID;
  readonly beStableSummaryHash: string;
  readonly sdirk2StableSummaryHash: string;
  readonly maxCavityVolumeAbsDiffM3: number;
  readonly maxLandStateLinfDiff: number;
  readonly maxAllowedCavityVolumeAbsDiffM3: number;
  readonly maxAllowedLandStateLinfDiff: number;
  readonly allFinite: boolean;
  readonly allNotIdentical: boolean;
  readonly allWithinBounds: boolean;
  readonly samples: readonly BeVsSdirk2DiscrepancySample[];
  readonly pass: boolean;
};

export type LocalMonolithicSdirk2ReadinessReport = {
  readonly protocolSetId: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID;
  readonly phase: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE;
  readonly phaseCompletionStatus: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS;
  readonly claimBoundary: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY;
  readonly readinessStatus: LocalMonolithicSdirk2ReadinessStatus;
  readonly referenceModelId: typeof LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID;
  readonly referenceModelClaimBoundary: typeof LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY;
  readonly referenceModelStatus: "pure-reference-not-runtime-wired";
  readonly sdirk2ReferenceCompletion: typeof LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION;
  readonly sdirk2ReferenceScope: string;
  readonly tableau: typeof LAND2017_SDIRK2_TABLEAU;
  readonly stageSemantics: {
    readonly stageSolvePolicy: "sequential-7-unknown-stage-solves";
    readonly simultaneous14UnknownSolve: false;
    readonly finalStateSource: "Y1";
    readonly calciumDtSecSemantics: "sequential-stage-increment";
  };
  readonly phase4DReadOnlyEvidence: Phase4DReadOnlyPinnedEvidence;
  readonly localReferenceSolve: LocalMonolithicSdirk2V1ReferenceSuite;
  readonly beFallbackReference: LocalMonolithicBeV1ReferenceSuite;
  readonly beVsSdirk2Discrepancy: BeVsSdirk2DiscrepancyEvidence;
  readonly localReferenceAcceptance: {
    readonly requiredVentricles: readonly ["LV", "RV"];
    readonly gamma: number;
    readonly tableauPass: boolean;
    readonly stifflyAccurateFinalStatePass: boolean;
    readonly stageSolvePolicyPass: boolean;
    readonly landStageConvergencePass: boolean;
    readonly localForceBalanceResidualPass: boolean;
    readonly newtonFdLineSearchEvidencePass: boolean;
    readonly finiteStateHealthPass: boolean;
    readonly stageRateDerivationPass: boolean;
    readonly calciumStageSemanticsPass: boolean;
    readonly beVsSdirk2DiscrepancyPass: boolean;
    readonly deterministicHashPass: boolean;
    readonly pass: boolean;
  };
  readonly claimScope: Record<string, "claimed" | "not-claimed">;
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
  readonly sections: readonly LocalMonolithicSdirk2ReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

const REQUIRED_PROTOCOL_IDS = [
  "phase5b-boundary-v1",
  "phase4d-read-only-pin-v1",
  "sdirk2-tableau-v1",
  "land-sdirk2-entrypoint-v1",
  "stage-rate-derivation-v1",
  "stage-land-convergence-v1",
  "local-force-balance-residual-v1",
  "newton-fd-line-search-evidence-v1",
  "finite-state-health-v1",
  "be-vs-sdirk2-discrepancy-v1",
  "runtime-isolation-v1",
  "noncoverage-boundary-v1",
  "deterministic-replay-v1",
] as const;

export function runLocalMonolithicSdirk2ReadinessReport():
  LocalMonolithicSdirk2ReadinessReport {
  const phase4DReadOnlyEvidence = phase4DReadOnlyEvidenceSummary();
  const localReferenceSolve = runLocalMonolithicSdirk2V1ReferenceSuite();
  const beFallbackReference = runLocalMonolithicBeV1ReferenceSuite();
  const beVsSdirk2Discrepancy =
    beVsSdirk2DiscrepancyEvidence(beFallbackReference, localReferenceSolve);
  const localReferenceAcceptance =
    localReferenceAcceptanceSummary(localReferenceSolve, beVsSdirk2Discrepancy);
  const claimScope = reportClaimScope();
  const runtimeIsolation = reportRuntimeIsolation();
  const futureTriSegPath = reportFutureTriSegPath();

  const sections = [
    phase5BBoundarySection(),
    phase4DReadOnlyPinSection(phase4DReadOnlyEvidence),
    sdirk2TableauSection(localReferenceSolve),
    landSdirk2EntrypointSection(),
    stageRateDerivationSection(localReferenceSolve),
    stageLandConvergenceSection(localReferenceSolve),
    localForceBalanceResidualSection(localReferenceSolve),
    newtonFdLineSearchEvidenceSection(localReferenceSolve),
    finiteStateHealthSection(localReferenceSolve),
    beVsSdirk2DiscrepancySection(beVsSdirk2Discrepancy),
    runtimeIsolationSection(runtimeIsolation),
    nonCoverageBoundarySection(claimScope, futureTriSegPath),
    deterministicReplaySection(localReferenceSolve),
  ] as const;
  const readinessPass = sections.every((entry) => entry.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID,
    phase: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE,
    phaseCompletionStatus: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS,
    claimBoundary: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY,
    readinessStatus:
      readinessPass
        ? "local-monolithic-sdirk2-reference-ready"
        : "local-monolithic-sdirk2-reference-review",
    referenceModelId: LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    referenceModelClaimBoundary: LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY,
    referenceModelStatus: "pure-reference-not-runtime-wired",
    sdirk2ReferenceCompletion: LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION,
    sdirk2ReferenceScope: protocolDescriptor.sdirk2ReferenceScope,
    tableau: LAND2017_SDIRK2_TABLEAU,
    stageSemantics: {
      stageSolvePolicy: "sequential-7-unknown-stage-solves",
      simultaneous14UnknownSolve: false,
      finalStateSource: "Y1",
      calciumDtSecSemantics: "sequential-stage-increment",
    },
    phase4DReadOnlyEvidence,
    localReferenceSolve,
    beFallbackReference,
    beVsSdirk2Discrepancy,
    localReferenceAcceptance,
    claimScope,
    runtimeIsolation,
    futureTriSegPath,
    requiredVerificationScripts: [...protocolDescriptor.requiredVerificationScripts],
    sections: sections.map((entry) => ({
      id: entry.id,
      status: entry.status,
      metrics: entry.metrics,
    })),
    readinessPass,
  };

  return {
    ...reportWithoutHash,
    stableSummaryHash: stableHash(sanitizeForStableHash(reportWithoutHash)),
  } as LocalMonolithicSdirk2ReadinessReport;
}

function localReferenceAcceptanceSummary(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
  discrepancy: BeVsSdirk2DiscrepancyEvidence,
): LocalMonolithicSdirk2ReadinessReport["localReferenceAcceptance"] {
  const acceptance = protocolDescriptor.localReferenceAcceptance;
  const tableauPass =
    suite.tableau.gamma === LAND2017_SDIRK2_GAMMA
    && suite.tableau.a00 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.a10 === 1 - LAND2017_SDIRK2_GAMMA
    && suite.tableau.a11 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.c0 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.c1 === 1
    && suite.tableau.finalStateSource === "Y1";
  const stifflyAccurateFinalStatePass =
    suite.finalStateSource === "Y1"
    && suite.samples.every((sample) =>
      sample.finalStageIndex === 1
      && sample.finalStateSource === "Y1"
      && arraysEqual(sample.finalLandState, sample.stages[1].final.land.stageState),
    );
  const stageSolvePolicyPass =
    suite.stageSolvePolicy === "sequential-7-unknown-stage-solves"
    && suite.samples.every((sample) =>
      sample.stages.length === 2
      && sample.stages.every((stage) =>
        stage.newton.unknownVectorDimension === LOCAL_MONOLITHIC_SDIRK2_V1_UNKNOWN_VECTOR_DIMENSION,
      ),
    );
  const landStageConvergencePass = suite.samples.every((sample) =>
    sample.allStageLandSolvesOk
    && sample.maxLandResidualNorm <= acceptance.maxLandResidualNorm
    && sample.stages.every((stage) =>
      stage.final.land.method === "writeLand2017Sdirk2StageResidual"
      && stage.final.land.residualSource === "Land 2017 SDIRK2 stage residual"
      && stage.final.land.stageScheme === "SDIRK2"
      && stage.final.land.gamma === LAND2017_SDIRK2_GAMMA
      && stage.final.land.stageState.length === 6
      && stage.final.land.residualNorm <= acceptance.maxLandResidualNorm,
    ),
  );
  const localForceBalanceResidualPass =
    suite.maxLocalForceBalanceResidualAbsPa
    <= acceptance.maxLocalForceBalanceResidualAbsPa;
  const newtonFdLineSearchEvidencePass = suite.samples.every((sample) =>
    sample.stages.every((stage) =>
      stage.newton.ok
      && stage.newton.unknownVectorDimension === 7
      && stage.newton.iterationCount > 0
      && stage.newton.lineSearchTrialCount >= stage.newton.iterationCount
      && stage.newton.derivativeEvaluationCount > 0
      && stage.newton.residualEvaluationCount > 0
      && Number.isFinite(stage.newton.finalJacobianDeterminant)
      && Number.isFinite(stage.newton.finalVolumeDerivativePaPerM3)
      && stage.newton.finalLandResidualNorm <= acceptance.maxLandResidualNorm,
    ),
  );
  const finiteStateHealthPass =
    suite.samples.every((sample) => sample.finiteHealthPass);
  const stageRateDerivationPass = suite.samples.every((sample) =>
    sample.stages.every((stage) => stage.final.rateDerivation.pass),
  );
  const calciumStageSemanticsPass = suite.samples.every((sample) =>
    sample.stages[0].calcium.dtSecSemantics === "sequential-stage-increment"
    && sample.stages[1].calcium.dtSecSemantics === "sequential-stage-increment"
    && Math.abs(sample.stages[0].calcium.stageIncrementDtSec - LAND2017_SDIRK2_GAMMA * 0.001) < 1e-18
    && Math.abs(sample.stages[1].calcium.stageIncrementDtSec - (1 - LAND2017_SDIRK2_GAMMA) * 0.001) < 1e-18,
  );
  const deterministicHashPass =
    suite.samples.every((sample) => /^[0-9a-f]{8}$/.test(sample.deterministicHash))
    && /^[0-9a-f]{8}$/.test(suite.stableSummaryHash);
  const pass =
    suite.modelId === LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    && suite.claimBoundary === LOCAL_MONOLITHIC_SDIRK2_V1_CLAIM_BOUNDARY
    && suite.lvCovered
    && suite.rvCovered
    && suite.allSamplesPass
    && tableauPass
    && stifflyAccurateFinalStatePass
    && stageSolvePolicyPass
    && landStageConvergencePass
    && localForceBalanceResidualPass
    && newtonFdLineSearchEvidencePass
    && finiteStateHealthPass
    && stageRateDerivationPass
    && calciumStageSemanticsPass
    && discrepancy.pass
    && deterministicHashPass;

  return {
    requiredVentricles: ["LV", "RV"],
    gamma: LAND2017_SDIRK2_GAMMA,
    tableauPass,
    stifflyAccurateFinalStatePass,
    stageSolvePolicyPass,
    landStageConvergencePass,
    localForceBalanceResidualPass,
    newtonFdLineSearchEvidencePass,
    finiteStateHealthPass,
    stageRateDerivationPass,
    calciumStageSemanticsPass,
    beVsSdirk2DiscrepancyPass: discrepancy.pass,
    deterministicHashPass,
    pass,
  };
}

function beVsSdirk2DiscrepancyEvidence(
  beSuite: LocalMonolithicBeV1ReferenceSuite,
  sdirk2Suite: LocalMonolithicSdirk2V1ReferenceSuite,
): BeVsSdirk2DiscrepancyEvidence {
  const maxAllowedCavityVolumeAbsDiffM3 =
    protocolDescriptor.localReferenceAcceptance.maxBeVsSdirk2CavityVolumeAbsDiffM3;
  const maxAllowedLandStateLinfDiff =
    protocolDescriptor.localReferenceAcceptance.maxBeVsSdirk2LandStateLinf;
  const samples = sdirk2Suite.samples.map((sdirk2Sample) => {
    const beSample = beSuite.samples.find((candidate) =>
      candidate.ventricle === sdirk2Sample.ventricle,
    );
    if (!beSample) {
      return {
        ventricle: sdirk2Sample.ventricle,
        beSampleId: "missing",
        sdirk2SampleId: sdirk2Sample.id,
        cavityVolumeAbsDiffM3: Number.NaN,
        landStateLinfDiff: Number.NaN,
        finite: false,
        notIdentical: false,
        withinBounds: false,
        pass: false,
      };
    }
    const cavityVolumeAbsDiffM3 =
      Math.abs(beSample.solvedCavityVolumeM3 - sdirk2Sample.solvedCavityVolumeM3);
    const landStateLinfDiff =
      linfDiff(beSample.final.land.nextState, sdirk2Sample.finalLandState);
    const finite =
      Number.isFinite(cavityVolumeAbsDiffM3)
      && Number.isFinite(landStateLinfDiff);
    const notIdentical = cavityVolumeAbsDiffM3 > 1e-16 || landStateLinfDiff > 1e-16;
    const withinBounds =
      cavityVolumeAbsDiffM3 <= maxAllowedCavityVolumeAbsDiffM3
      && landStateLinfDiff <= maxAllowedLandStateLinfDiff;
    return {
      ventricle: sdirk2Sample.ventricle,
      beSampleId: beSample.id,
      sdirk2SampleId: sdirk2Sample.id,
      cavityVolumeAbsDiffM3,
      landStateLinfDiff,
      finite,
      notIdentical,
      withinBounds,
      pass: finite && notIdentical && withinBounds,
    };
  });
  const maxCavityVolumeAbsDiffM3 = Math.max(
    ...samples.map((sample) => sample.cavityVolumeAbsDiffM3),
  );
  const maxLandStateLinfDiff = Math.max(...samples.map((sample) => sample.landStateLinfDiff));
  const allFinite = samples.every((sample) => sample.finite);
  const allNotIdentical = samples.every((sample) => sample.notIdentical);
  const allWithinBounds = samples.every((sample) => sample.withinBounds);

  return {
    beReferenceModelId: LOCAL_MONOLITHIC_BE_V1_REFERENCE_MODEL_ID,
    sdirk2ReferenceModelId: LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID,
    beStableSummaryHash: beSuite.stableSummaryHash,
    sdirk2StableSummaryHash: sdirk2Suite.stableSummaryHash,
    maxCavityVolumeAbsDiffM3,
    maxLandStateLinfDiff,
    maxAllowedCavityVolumeAbsDiffM3,
    maxAllowedLandStateLinfDiff,
    allFinite,
    allNotIdentical,
    allWithinBounds,
    samples,
    pass: samples.length >= 2 && allFinite && allNotIdentical && allWithinBounds,
  };
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

function phase5BBoundarySection(): LocalMonolithicSdirk2ReadinessSection {
  const ok =
    protocolDescriptor.protocolSetId === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PROTOCOL_SET_ID
    && protocolDescriptor.phase === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_PHASE
    && protocolDescriptor.phaseCompletionStatus === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_COMPLETION_STATUS
    && protocolDescriptor.claimBoundary === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_CLAIM_BOUNDARY
    && protocolDescriptor.referenceModelId === LOCAL_MONOLITHIC_SDIRK2_V1_REFERENCE_MODEL_ID
    && protocolDescriptor.sdirk2ReferenceCompletion === LOCAL_MONOLITHIC_SDIRK2_PHASE5B_REFERENCE_COMPLETION
    && /local-monolithic-sdirk2-v1/.test(protocolDescriptor.sdirk2ReferenceScope);
  return section("phase5b-boundary-v1", ok, {
    phase: protocolDescriptor.phase,
    phaseCompletionStatus: protocolDescriptor.phaseCompletionStatus,
    referenceModelId: protocolDescriptor.referenceModelId,
    sdirk2ReferenceCompletion: protocolDescriptor.sdirk2ReferenceCompletion,
    sdirk2ReferenceScope: protocolDescriptor.sdirk2ReferenceScope,
  });
}

function phase4DReadOnlyPinSection(
  evidence: Phase4DReadOnlyPinnedEvidence,
): LocalMonolithicSdirk2ReadinessSection {
  return section("phase4d-read-only-pin-v1", evidence.pass, evidence);
}

function sdirk2TableauSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const ok =
    suite.tableau.gamma === LAND2017_SDIRK2_GAMMA
    && suite.tableau.a00 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.a10 === 1 - LAND2017_SDIRK2_GAMMA
    && suite.tableau.a11 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.c0 === LAND2017_SDIRK2_GAMMA
    && suite.tableau.c1 === 1
    && suite.finalStateSource === "Y1"
    && protocolDescriptor.sdirk2Tableau.stifflyAccurate === true;
  return section("sdirk2-tableau-v1", ok, {
    gamma: LAND2017_SDIRK2_GAMMA,
    tableau: suite.tableau,
  });
}

function landSdirk2EntrypointSection(): LocalMonolithicSdirk2ReadinessSection {
  const ok =
    protocolDescriptor.stageSemantics.stage1HistoryContract.includes("stage0State")
    && protocolDescriptor.stageSemantics.rejectIndependentInputs.includes("rhs0")
    && protocolDescriptor.stageSemantics.rejectIndependentInputs.includes("stageCoordinateRateSI");
  return section("land-sdirk2-entrypoint-v1", ok, {
    historyContract: protocolDescriptor.stageSemantics.stage1HistoryContract,
    rejectIndependentInputs: protocolDescriptor.stageSemantics.rejectIndependentInputs,
  });
}

function stageRateDerivationSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const ok = suite.samples.every((sample) =>
    sample.stages.every((stage) => stage.final.rateDerivation.pass),
  );
  return section("stage-rate-derivation-v1", ok, {
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      rates: sample.stages.map((stage) => stage.final.rateDerivation),
    })),
  });
}

function stageLandConvergenceSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const tolerance = protocolDescriptor.localReferenceAcceptance.maxLandResidualNorm;
  const ok = suite.samples.every((sample) =>
    sample.allStageLandSolvesOk
    && sample.maxLandResidualNorm <= tolerance
    && sample.stages.every((stage) =>
      stage.final.land.ok
      && stage.final.land.stageScheme === "SDIRK2"
      && stage.final.land.residualNorm <= tolerance
      && stage.final.land.stageState.length === 6,
    ),
  );
  return section("stage-land-convergence-v1", ok, {
    tolerance,
    maxLandResidualNorm: suite.maxLandResidualNorm,
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      stages: sample.stages.map((stage) => ({
        stageIndex: stage.stageIndex,
        residualNorm: stage.final.land.residualNorm,
        residualVector: stage.final.land.residualVector,
      })),
    })),
  });
}

function localForceBalanceResidualSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const tolerance = protocolDescriptor.localReferenceAcceptance.maxLocalForceBalanceResidualAbsPa;
  return section(
    "local-force-balance-residual-v1",
    suite.maxLocalForceBalanceResidualAbsPa <= tolerance,
    {
      tolerance,
      maxLocalForceBalanceResidualAbsPa: suite.maxLocalForceBalanceResidualAbsPa,
      samples: suite.samples.map((sample) => ({
        id: sample.id,
        stages: sample.stages.map((stage) => ({
          stageIndex: stage.stageIndex,
          finalResidualAbsPa: stage.newton.finalResidualAbsPa,
          solvedCavityVolumeM3: stage.solvedCavityVolumeM3,
          targetExternalPressurePa: stage.targetExternalPressurePa,
        })),
      })),
    },
  );
}

function newtonFdLineSearchEvidenceSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const ok = suite.samples.every((sample) =>
    sample.stages.every((stage) =>
      stage.newton.ok
      && stage.newton.unknownVectorDimension === 7
      && stage.newton.iterationCount > 0
      && stage.newton.lineSearchTrialCount >= stage.newton.iterationCount
      && stage.newton.derivativeEvaluationCount > 0
      && stage.newton.residualEvaluationCount > 0
      && Number.isFinite(stage.newton.finalJacobianDeterminant)
      && Number.isFinite(stage.newton.finalVolumeDerivativePaPerM3),
    ),
  );
  return section("newton-fd-line-search-evidence-v1", ok, {
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      stages: sample.stages.map((stage) => ({
        stageIndex: stage.stageIndex,
        iterationCount: stage.newton.iterationCount,
        lineSearchTrialCount: stage.newton.lineSearchTrialCount,
        lineSearchBacktrackCount: stage.newton.lineSearchBacktrackCount,
        derivativeEvaluationCount: stage.newton.derivativeEvaluationCount,
        residualEvaluationCount: stage.newton.residualEvaluationCount,
        finalJacobianDeterminant: stage.newton.finalJacobianDeterminant,
        finalVolumeDerivativePaPerM3: stage.newton.finalVolumeDerivativePaPerM3,
      })),
    })),
  });
}

function finiteStateHealthSection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  return section("finite-state-health-v1", suite.samples.every((sample) => sample.finiteHealthPass), {
    samples: suite.samples.map((sample) => ({
      id: sample.id,
      stages: sample.stages.map((stage) => ({
        stageIndex: stage.stageIndex,
        finiteHealth: stage.finiteHealth,
        calciumFinite: stage.calcium.finite,
        finalFinite: stage.final.finite,
      })),
    })),
  });
}

function beVsSdirk2DiscrepancySection(
  discrepancy: BeVsSdirk2DiscrepancyEvidence,
): LocalMonolithicSdirk2ReadinessSection {
  return section("be-vs-sdirk2-discrepancy-v1", discrepancy.pass, discrepancy as unknown as Record<string, unknown>);
}

function runtimeIsolationSection(
  runtimeIsolation: LocalMonolithicSdirk2ReadinessReport["runtimeIsolation"],
): LocalMonolithicSdirk2ReadinessSection {
  const ok =
    runtimeIsolation.status === "no-runtime-wiring"
    && runtimeIsolation.scanPolicy === "mirror-phase4d-runtime-target-set"
    && runtimeIsolation.runtimeWiringStatus === "not-runtime-wired"
    && protocolDescriptor.runtimeIsolation.status === "no-runtime-wiring";
  return section("runtime-isolation-v1", ok, runtimeIsolation);
}

function nonCoverageBoundarySection(
  claimScope: LocalMonolithicSdirk2ReadinessReport["claimScope"],
  futureTriSegPath: LocalMonolithicSdirk2ReadinessReport["futureTriSegPath"],
): LocalMonolithicSdirk2ReadinessSection {
  const ok =
    claimScope.localMonolithicSdirk2ReferenceCompletion === "claimed"
    && Object.entries(claimScope)
      .filter(([key]) => key !== "localMonolithicSdirk2ReferenceCompletion")
      .every(([, value]) => value === "not-claimed")
    && futureTriSegPath.adoptionStatus === "not-claimed"
    && /full TriSeg/.test(futureTriSegPath.fullTriSegPath);
  return section("noncoverage-boundary-v1", ok, {
    claimScope,
    futureTriSegPath,
  });
}

function deterministicReplaySection(
  suite: LocalMonolithicSdirk2V1ReferenceSuite,
): LocalMonolithicSdirk2ReadinessSection {
  const second = runLocalMonolithicSdirk2V1ReferenceSuite();
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

function reportClaimScope(): LocalMonolithicSdirk2ReadinessReport["claimScope"] {
  return {
    localMonolithicSdirk2ReferenceCompletion: "claimed",
    phase5Completion: "not-claimed",
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

function reportRuntimeIsolation(): LocalMonolithicSdirk2ReadinessReport["runtimeIsolation"] {
  return {
    status: "no-runtime-wiring",
    scanPolicy: "mirror-phase4d-runtime-target-set",
    runtimeWiringStatus: "not-runtime-wired",
  };
}

function reportFutureTriSegPath(): LocalMonolithicSdirk2ReadinessReport["futureTriSegPath"] {
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
): LocalMonolithicSdirk2ReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function arraysEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function linfDiff(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff = Math.max(diff, Math.abs(left[index] - right[index]));
  }
  return diff;
}
