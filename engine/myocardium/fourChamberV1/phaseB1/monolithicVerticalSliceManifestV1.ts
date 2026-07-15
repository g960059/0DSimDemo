import {
  WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
} from "@/engine/myocardium/fourChamberV1/energy/wholeHeartEnergyNormalizationV1";
import {
  EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/closedLoopSameTimeLevelV1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  EXACT_LAND_SEMISMOOTH_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/land/exactSemismoothPolicyV1";
import {
  RATE_FREE_LAND2017_V1_ID,
} from "@/engine/myocardium/fourChamberV1/land/rateFreeLand2017V1";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
} from "@/engine/myocardium/fourChamberV1/numerics/scaledFivePointAlgorithmicJacobianV1";
import {
  PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/differentiatedStageKinematicsV1";
import {
  PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID,
  PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/exactCalciumEventTransactionV1";
import {
  PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  PHASE_B1_ENDPOINT_STATE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  PHASE_B1_WALL_MATERIAL_BINDING_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialBindingV1";
import {
  PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WallMaterialKernelV1";
import {
  PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1WholeHeartExactCalciumEventCoordinatorV1";
import {
  PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/postEventTriSegReinitializationV1";
import {
  validatePhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  type PhaseB1SyntheticVerticalSliceCaseDescriptorV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticVerticalSliceCaseDescriptorV1";
import {
  PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
  phaseB1VerticalSliceEventEvidenceFixtureSha256V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/verticalSliceEventEvidenceFixtureV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditPolicyV1";
import {
  PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
  PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  PUBLISHED_TRISEG_ROOT_V1_ID,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegRootV1";

export const PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFEST_V1_ID =
  "four-chamber-phase-b1-monolithic-vertical-slice-manifest-v1" as const;

export const PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1 =
  "fa588cd7d59169795429679eb5c4c824a8d4f68a20c8868a36ea2d950d6dfd2d" as const;
export const PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1 =
  "e8b12dc997c4f9b159db7f6a516bc885a2a7bbb6aee8d0061f6f0a8e474949e6" as const;

const PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFESTS_V1 =
  new WeakSet<object>();

export type PhaseB1MonolithicVerticalSliceManifestHashPayloadV1 = Readonly<{
  manifestId: typeof PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFEST_V1_ID;
  status:
    "synthetic-monolithic-vertical-slice-implemented-not-phase-b1-acceptance";
  evidenceClass:
    "project-synthetic-single-substep-and-endpoint-event-implementation-regression";
  lineage: Readonly<{
    frozenFoundationManifestSha256:
      typeof PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1;
    frozenFoundationReadinessSha256:
      typeof PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1;
    frozenFoundationArtifactsReproduceCanonicalHashes: true;
  }>;
  bindings: Readonly<{
    syntheticCaseDescriptorSha256: string;
    phaseA1TissueManifestBundleSha256: string;
    stateNewtonTopologySha256: string;
    wallMaterialBindingDescriptorSha256: string;
    scaffoldConfigurationSha256: string;
    newtonScaleRegistryContentSha256: string;
    eventFreeNumericalPolicySha256: string;
    exactLandSemismoothPolicySha256: string;
    exactEventEvidenceFixtureSha256: string;
    mechanicalEnergyAuditPolicySha256: string;
    wholeHeartEnergyNormalizationSha256: string;
    componentIds: Readonly<{
      rateFreeLand: typeof RATE_FREE_LAND2017_V1_ID;
      exactSemismoothPolicy: typeof EXACT_LAND_SEMISMOOTH_POLICY_V1.id;
      wallMaterialBinding: typeof PHASE_B1_WALL_MATERIAL_BINDING_V1_ID;
      wallMaterialKernel: typeof PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID;
      stateNewtonTopology:
        typeof PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID;
      endpointState: typeof PHASE_B1_ENDPOINT_STATE_V1_ID;
      landSimplexDomain: typeof PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID;
      eventFreeMonolithicSolver:
        typeof PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID;
      globalJacobianAudit:
        typeof PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID;
      exactCalcium: typeof EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID;
      exactCalciumTransaction:
        typeof PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID;
      wholeHeartEventCoordinator:
        typeof PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID;
      eventIntegratedTransaction:
        typeof PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID;
      postEventTriSegReinitialization:
        typeof PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID;
      differentiatedStageKinematics:
        typeof PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID;
      wholeHeartSlsBackwardEulerAudit:
        typeof PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID;
      wholeHeartMechanicalEnergyAudit:
        typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID;
      wholeHeartMechanicalEnergyAuditPolicy:
        typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId;
      sameTimeLevelClosedLoop:
        typeof FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID;
      incidenceLedger: typeof FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID;
      scaledFivePointJacobian:
        typeof SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID;
      publishedTriSegRoot: typeof PUBLISHED_TRISEG_ROOT_V1_ID;
    }>;
  }>;
  evidenceFixtures: Readonly<{
    exactEventRegression:
      typeof PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1;
  }>;
  topologyContract: Readonly<{
    slsOnStoredStateCount: 59;
    slsOffStoredStateCount: 54;
    slsOnUnknownAndResidualCount: 51;
    slsOffUnknownAndResidualCount: 46;
    landStateCount: 30;
    storedCalciumStateCount: 10;
    calciumNewtonUnknownCount: 0;
    calciumResidualCount: 0;
    triSegAlgebraicUnknownCount: 2;
    slsOffPhysicallyRemovesFiveStates: true;
  }>;
  eventFreeProtocol: Readonly<{
    slsModes: readonly ["on", "off"];
    dtSec: 0.00025;
    stepCountPerMode: 1;
    allFiveLandSystemsInsideGlobalNewton: true;
    innerLandSolveUsed: false;
    exactLeftLimitCalciumKnownForcing: true;
    totalBloodVolumeAbsoluteToleranceM3: 1e-17;
    projectionAllowed: false;
    hiddenClippingAllowed: false;
    flowClampAllowed: false;
  }>;
  simplexProtocol: Readonly<{
    strictInterior: true;
    fractionToBoundarySafety: 0.995;
    acceptedMinimumMarginMustBePositive: true;
    projectionAllowed: false;
  }>;
  globalJacobianProtocol: Readonly<{
    exactLandSemismoothPolicy: typeof EXACT_LAND_SEMISMOOTH_POLICY_V1;
    topologies: readonly ["on", "off"];
    constructionMap: "accepted-base-frozen-active-set-semismooth-residual";
    constructionScaledStep: number;
    directionalAuditStepRatio: number;
    directionCountPerTopology: 1;
    directionalRelativeTwoNormTolerance: number;
    minimumRequiredScaledCrossBlockMagnitude: number;
    slsOffRequiresPhysicalBlockAbsence: true;
    sameFrozenSemismoothMapUsedByBothStencils: true;
    constitutivePartialsIndependentlyValidated: false;
    nonlinearResidualUsedAsIndependentKinkOracle: false;
  }>;
  exactEventProtocol: Readonly<{
    forcingSide: "pre-jump-left-limit";
    allFiveCalciumPairsPropagatedExactly: true;
    coincidentEventsAggregatedInCanonicalWallAndEventOrder: true;
    aggregateBatchCommittedOnce: true;
    nonemptyEventTransactionRegressedInBothTopologies: true;
    postEventDifferentialStateChangedOnlyInCalcium: true;
    postEventTriSegReinitializationCount: "zero-or-one";
    emptyBatchSkipsReinitialization: true;
    overflowPreflightBeforeAtomicSolve: true;
    immutableEndpointRollbackSnapshotReturnedAndNoInternalCommitBeforeSuccess:
      true;
    followingIntervalUsesPostJumpCalcium: true;
  }>;
  materialBindingProtocol: Readonly<{
    canonicalDescriptorContentHashed: true;
    processLocalIdentityRequired: true;
    wallKeyMustMatchMaterialWallId: true;
    copiedBindingRejected: true;
    accessorForgedBindingRejectedWithoutGetterEvaluation: true;
    wallWiseFreeGainAllowed: false;
    pvLoopShapeFittingAllowed: false;
  }>;
  energyEvidence: Readonly<{
    mechanicalEnergyAuditPolicy:
      typeof PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1;
    normalization: Readonly<{
      powerReferenceW: typeof WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1;
      powerFloorW: typeof WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1;
    }>;
    differentiatedLandKinematicsImplemented: true;
    allThirtyLandStateRatesAssembledInDifferentiatedConstraintInput: true;
    atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true;
    landAdapterWorkClosureTolerance: 1e-12;
    wholeHeartSlsBackwardEulerIdentityImplemented: true;
    normalizedSlsIdentityTolerance:
      typeof PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1;
    wholeHeartMechanicalCorrectedEndpointStageLedgerImplemented: true;
    normalizedMechanicalStageTolerance: 1e-5;
    publishedTaylorGeometryDefectRetained: true;
    publishedTaylorGeometryDefectSubtractedFromCorrectedLedger: true;
    publishedTaylorGeometryDiagnosticOnly: true;
    publishedTaylorWorkConjugacyClaimed: false;
    atpChemicalEnergyOrEfficiencyClaimed: false;
    backwardEulerWholeHeartEnergyAcceptanceGateImplemented: false;
  }>;
  implementationClaims: Readonly<{
    eventFreeMonolithicVerticalSlice: true;
    exactEndpointEventTransactionalVerticalSlice: true;
    canonicalMaterialBinding: true;
    strictLandSimplex: true;
    semismoothGlobalJacobianDirectionalConsistencyAudit: true;
    requiredGlobalCrossBlocksNonzeroAudit: true;
    differentiatedStageKinematics: true;
    wholeHeartSlsBackwardEulerIdentityAudit: true;
    wholeHeartMechanicalCorrectedEndpointStageEnergyAudit: true;
  }>;
  deferred: Readonly<{
    acceptedColdInitialization: true;
    materialHomotopyAndBranchProvenance: true;
    phaseB0SupportedEnvelopeClosure: true;
    shortHorizonIntegration: true;
    timestepHalvingAndOrder: true;
    fullBeatPeriodicAttractor: true;
    fullBeatConservationAndEnergy: true;
    multistartAndPerturbationAcceptance: true;
    pathologicalSupportedEnvelope: true;
    physiologicalValidation: true;
    releaseRuntimeIntegration: true;
  }>;
  negativeClaims: Readonly<{
    phaseB1MonolithicReferenceComplete: false;
    phaseB1Acceptance: false;
    supportedEnvelope: false;
    physiologicalValidation: false;
    experimentalLandValidation: false;
    modelCoreIntegration: false;
    browserRuntimeAdopted: false;
    releaseRuntimeReachable: false;
  }>;
}>;

export type PhaseB1MonolithicVerticalSliceManifestV1 =
  PhaseB1MonolithicVerticalSliceManifestHashPayloadV1 & Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export function buildPhaseB1MonolithicVerticalSliceManifestV1(
  descriptor: PhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1MonolithicVerticalSliceManifestV1 {
  validatePhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    descriptor,
    sha256Hex,
  );
  const policy = descriptor.model.eventFreeNumericalPolicy;
  const energyNormalization = Object.freeze({
    powerReferenceW: WHOLE_HEART_ENERGY_POWER_REFERENCE_W_V1,
    powerFloorW: WHOLE_HEART_ENERGY_POWER_FLOOR_W_V1,
  });
  const payload: PhaseB1MonolithicVerticalSliceManifestHashPayloadV1 =
    Object.freeze({
      manifestId: PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFEST_V1_ID,
      status:
        "synthetic-monolithic-vertical-slice-implemented-not-phase-b1-acceptance",
      evidenceClass:
        "project-synthetic-single-substep-and-endpoint-event-implementation-regression",
      lineage: Object.freeze({
        frozenFoundationManifestSha256:
          PHASE_B1_FROZEN_FOUNDATION_MANIFEST_SHA256_V1,
        frozenFoundationReadinessSha256:
          PHASE_B1_FROZEN_FOUNDATION_READINESS_SHA256_V1,
        frozenFoundationArtifactsReproduceCanonicalHashes: true,
      }),
      bindings: Object.freeze({
        syntheticCaseDescriptorSha256: descriptor.contentSha256,
        phaseA1TissueManifestBundleSha256:
          descriptor.bindings.phaseA1TissueManifestBundleSha256,
        stateNewtonTopologySha256:
          descriptor.bindings.stateNewtonTopologySha256,
        wallMaterialBindingDescriptorSha256:
          descriptor.bindings.wallMaterialBindingDescriptorSha256,
        scaffoldConfigurationSha256:
          descriptor.bindings.scaffoldConfigurationSha256,
        newtonScaleRegistryContentSha256:
          descriptor.model.newtonScaleRegistryContentSha256,
        eventFreeNumericalPolicySha256:
          descriptor.model.eventFreeNumericalPolicySha256,
        exactLandSemismoothPolicySha256: computeCanonicalSha256(
          EXACT_LAND_SEMISMOOTH_POLICY_V1,
          sha256Hex,
        ),
        exactEventEvidenceFixtureSha256:
          phaseB1VerticalSliceEventEvidenceFixtureSha256V1(sha256Hex),
        mechanicalEnergyAuditPolicySha256: computeCanonicalSha256(
          PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
          sha256Hex,
        ),
        wholeHeartEnergyNormalizationSha256: computeCanonicalSha256(
          energyNormalization,
          sha256Hex,
        ),
        componentIds: Object.freeze({
          rateFreeLand: RATE_FREE_LAND2017_V1_ID,
          exactSemismoothPolicy: EXACT_LAND_SEMISMOOTH_POLICY_V1.id,
          wallMaterialBinding: PHASE_B1_WALL_MATERIAL_BINDING_V1_ID,
          wallMaterialKernel: PHASE_B1_WALL_MATERIAL_KERNEL_V1_ID,
          stateNewtonTopology:
            PHASE_B1_STORED_STATE_NEWTON_TOPOLOGY_V1_ID,
          endpointState: PHASE_B1_ENDPOINT_STATE_V1_ID,
          landSimplexDomain: PHASE_B1_LAND_SIMPLEX_NEWTON_DOMAIN_V1_ID,
          eventFreeMonolithicSolver: PHASE_B1_EVENT_FREE_MONOLITHIC_BE_V1_ID,
          globalJacobianAudit:
            PHASE_B1_EVENT_FREE_GLOBAL_JACOBIAN_AUDIT_V1_ID,
          exactCalcium: EXACT_EVENT_PRESCRIBED_CALCIUM_V1_ID,
          exactCalciumTransaction:
            PHASE_B1_EXACT_CALCIUM_EVENT_TRANSACTION_V1_ID,
          wholeHeartEventCoordinator:
            PHASE_B1_WHOLE_HEART_CALCIUM_EVENT_COORDINATOR_V1_ID,
          eventIntegratedTransaction:
            PHASE_B1_EVENT_INTEGRATED_MONOLITHIC_TRANSACTION_V1_ID,
          postEventTriSegReinitialization:
            PHASE_B1_POST_EVENT_TRISEG_REINITIALIZATION_V1_ID,
          differentiatedStageKinematics:
            PHASE_B1_DIFFERENTIATED_STAGE_KINEMATICS_V1_ID,
          wholeHeartSlsBackwardEulerAudit:
            PHASE_B1_WHOLE_HEART_SLS_BE_AUDIT_V1_ID,
          wholeHeartMechanicalEnergyAudit:
            PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_V1_ID,
          wholeHeartMechanicalEnergyAuditPolicy:
            PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1.policyId,
          sameTimeLevelClosedLoop:
            FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID,
          incidenceLedger: FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID,
          scaledFivePointJacobian:
            SCALED_FIVE_POINT_ALGORITHMIC_JACOBIAN_V1_ID,
          publishedTriSegRoot: PUBLISHED_TRISEG_ROOT_V1_ID,
        }),
      }),
      evidenceFixtures: Object.freeze({
        exactEventRegression:
          PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
      }),
      topologyContract: Object.freeze({
        slsOnStoredStateCount: 59,
        slsOffStoredStateCount: 54,
        slsOnUnknownAndResidualCount: 51,
        slsOffUnknownAndResidualCount: 46,
        landStateCount: 30,
        storedCalciumStateCount: 10,
        calciumNewtonUnknownCount: 0,
        calciumResidualCount: 0,
        triSegAlgebraicUnknownCount: 2,
        slsOffPhysicallyRemovesFiveStates: true,
      }),
      eventFreeProtocol: Object.freeze({
        slsModes: Object.freeze(["on", "off"] as const),
        dtSec: 0.00025,
        stepCountPerMode: 1,
        allFiveLandSystemsInsideGlobalNewton: true,
        innerLandSolveUsed: false,
        exactLeftLimitCalciumKnownForcing: true,
        totalBloodVolumeAbsoluteToleranceM3: 1e-17,
        projectionAllowed: false,
        hiddenClippingAllowed: false,
        flowClampAllowed: false,
      }),
      simplexProtocol: Object.freeze({
        strictInterior: true,
        fractionToBoundarySafety: 0.995,
        acceptedMinimumMarginMustBePositive: true,
        projectionAllowed: false,
      }),
      globalJacobianProtocol: Object.freeze({
        exactLandSemismoothPolicy: EXACT_LAND_SEMISMOOTH_POLICY_V1,
        topologies: Object.freeze(["on", "off"] as const),
        constructionMap:
          "accepted-base-frozen-active-set-semismooth-residual",
        constructionScaledStep: policy.algorithmicJacobianScaledStep,
        directionalAuditStepRatio:
          policy.independentDirectionalAuditStepRatioToConstruction,
        directionCountPerTopology: 1,
        directionalRelativeTwoNormTolerance:
          policy.semismoothDirectionalConsistencyRelativeTwoNormTolerance,
        minimumRequiredScaledCrossBlockMagnitude:
          policy.minimumRequiredScaledCrossBlockMagnitude,
        slsOffRequiresPhysicalBlockAbsence: true,
        sameFrozenSemismoothMapUsedByBothStencils: true,
        constitutivePartialsIndependentlyValidated: false,
        nonlinearResidualUsedAsIndependentKinkOracle: false,
      }),
      exactEventProtocol: Object.freeze({
        forcingSide: "pre-jump-left-limit",
        allFiveCalciumPairsPropagatedExactly: true,
        coincidentEventsAggregatedInCanonicalWallAndEventOrder: true,
        aggregateBatchCommittedOnce: true,
        nonemptyEventTransactionRegressedInBothTopologies: true,
        postEventDifferentialStateChangedOnlyInCalcium: true,
        postEventTriSegReinitializationCount: "zero-or-one",
        emptyBatchSkipsReinitialization: true,
        overflowPreflightBeforeAtomicSolve: true,
        immutableEndpointRollbackSnapshotReturnedAndNoInternalCommitBeforeSuccess:
          true,
        followingIntervalUsesPostJumpCalcium: true,
      }),
      materialBindingProtocol: Object.freeze({
        canonicalDescriptorContentHashed: true,
        processLocalIdentityRequired: true,
        wallKeyMustMatchMaterialWallId: true,
        copiedBindingRejected: true,
        accessorForgedBindingRejectedWithoutGetterEvaluation: true,
        wallWiseFreeGainAllowed: false,
        pvLoopShapeFittingAllowed: false,
      }),
      energyEvidence: Object.freeze({
        mechanicalEnergyAuditPolicy:
          PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
        normalization: energyNormalization,
        differentiatedLandKinematicsImplemented: true,
        allThirtyLandStateRatesAssembledInDifferentiatedConstraintInput: true,
        atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows: true,
        landAdapterWorkClosureTolerance:
          PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
            .landAdapterWorkRelativeTolerance,
        wholeHeartSlsBackwardEulerIdentityImplemented: true,
        normalizedSlsIdentityTolerance:
          PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1,
        wholeHeartMechanicalCorrectedEndpointStageLedgerImplemented: true,
        normalizedMechanicalStageTolerance:
          PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
            .correctedStageLedgerNormalizedResidualTolerance,
        publishedTaylorGeometryDefectRetained: true,
        publishedTaylorGeometryDefectSubtractedFromCorrectedLedger: true,
        publishedTaylorGeometryDiagnosticOnly: true,
        publishedTaylorWorkConjugacyClaimed: false,
        atpChemicalEnergyOrEfficiencyClaimed: false,
        backwardEulerWholeHeartEnergyAcceptanceGateImplemented: false,
      }),
      implementationClaims: Object.freeze({
        eventFreeMonolithicVerticalSlice: true,
        exactEndpointEventTransactionalVerticalSlice: true,
        canonicalMaterialBinding: true,
        strictLandSimplex: true,
        semismoothGlobalJacobianDirectionalConsistencyAudit: true,
        requiredGlobalCrossBlocksNonzeroAudit: true,
        differentiatedStageKinematics: true,
        wholeHeartSlsBackwardEulerIdentityAudit: true,
        wholeHeartMechanicalCorrectedEndpointStageEnergyAudit: true,
      }),
      deferred: Object.freeze({
        acceptedColdInitialization: true,
        materialHomotopyAndBranchProvenance: true,
        phaseB0SupportedEnvelopeClosure: true,
        shortHorizonIntegration: true,
        timestepHalvingAndOrder: true,
        fullBeatPeriodicAttractor: true,
        fullBeatConservationAndEnergy: true,
        multistartAndPerturbationAcceptance: true,
        pathologicalSupportedEnvelope: true,
        physiologicalValidation: true,
        releaseRuntimeIntegration: true,
      }),
      negativeClaims: Object.freeze({
        phaseB1MonolithicReferenceComplete: false,
        phaseB1Acceptance: false,
        supportedEnvelope: false,
        physiologicalValidation: false,
        experimentalLandValidation: false,
        modelCoreIntegration: false,
        browserRuntimeAdopted: false,
        releaseRuntimeReachable: false,
      }),
    });
  const manifest = Object.freeze({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
  PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFESTS_V1.add(manifest);
  return validatePhaseB1MonolithicVerticalSliceManifestV1(
    manifest,
    descriptor,
    sha256Hex,
  );
}

export function assertCanonicalPhaseB1MonolithicVerticalSliceManifestV1(
  manifest: PhaseB1MonolithicVerticalSliceManifestV1,
): PhaseB1MonolithicVerticalSliceManifestV1 {
  if (
    manifest === null
    || typeof manifest !== "object"
    || !PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFESTS_V1.has(manifest)
  ) {
    throw new Error(
      "Phase B1 monolithic vertical-slice manifest must be canonically built in this process",
    );
  }
  return manifest;
}

export function validatePhaseB1MonolithicVerticalSliceManifestV1(
  manifest: PhaseB1MonolithicVerticalSliceManifestV1,
  descriptor: PhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1MonolithicVerticalSliceManifestV1 {
  assertCanonicalPhaseB1MonolithicVerticalSliceManifestV1(manifest);
  validatePhaseB1SyntheticVerticalSliceCaseDescriptorV1(
    descriptor,
    sha256Hex,
  );
  if (
    manifest.manifestId !== PHASE_B1_MONOLITHIC_VERTICAL_SLICE_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
  ) throw new Error("Phase B1 vertical-slice manifest identity drifted");
  assertCanonicalSha256(
    phaseB1MonolithicVerticalSliceManifestHashPayloadV1(manifest),
    manifest.contentSha256,
    sha256Hex,
  );
  const normalizationSha256 = computeCanonicalSha256(
    manifest.energyEvidence.normalization,
    sha256Hex,
  );
  if (
    manifest.bindings.syntheticCaseDescriptorSha256
      !== descriptor.contentSha256
    || manifest.bindings.phaseA1TissueManifestBundleSha256
      !== descriptor.bindings.phaseA1TissueManifestBundleSha256
    || manifest.bindings.stateNewtonTopologySha256
      !== descriptor.bindings.stateNewtonTopologySha256
    || manifest.bindings.wallMaterialBindingDescriptorSha256
      !== descriptor.bindings.wallMaterialBindingDescriptorSha256
    || manifest.bindings.scaffoldConfigurationSha256
      !== descriptor.bindings.scaffoldConfigurationSha256
    || manifest.bindings.newtonScaleRegistryContentSha256
      !== descriptor.model.newtonScaleRegistryContentSha256
    || manifest.bindings.eventFreeNumericalPolicySha256
      !== descriptor.model.eventFreeNumericalPolicySha256
    || manifest.bindings.exactEventEvidenceFixtureSha256
      !== phaseB1VerticalSliceEventEvidenceFixtureSha256V1(sha256Hex)
    || manifest.bindings.exactEventEvidenceFixtureSha256
      !== computeCanonicalSha256(
        manifest.evidenceFixtures.exactEventRegression,
        sha256Hex,
      )
    || manifest.bindings.exactLandSemismoothPolicySha256
      !== computeCanonicalSha256(EXACT_LAND_SEMISMOOTH_POLICY_V1, sha256Hex)
    || manifest.bindings.exactLandSemismoothPolicySha256
      !== computeCanonicalSha256(
        manifest.globalJacobianProtocol.exactLandSemismoothPolicy,
        sha256Hex,
      )
    || manifest.bindings.mechanicalEnergyAuditPolicySha256
      !== computeCanonicalSha256(
        PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1,
        sha256Hex,
      )
    || manifest.bindings.mechanicalEnergyAuditPolicySha256
      !== computeCanonicalSha256(
        manifest.energyEvidence.mechanicalEnergyAuditPolicy,
        sha256Hex,
      )
    || manifest.bindings.wholeHeartEnergyNormalizationSha256
      !== normalizationSha256
  ) throw new Error("Phase B1 vertical-slice evidence binding drifted");
  const eventFixture = manifest.evidenceFixtures.exactEventRegression;
  const numericalPolicy = descriptor.model.eventFreeNumericalPolicy;
  if (
    descriptor.oneStepDtSec !== manifest.eventFreeProtocol.dtSec
    || descriptor.oneStepDtSec !== eventFixture.dtSec
    || eventFixture.causalEvent.calciumDriveTimeSec !== eventFixture.dtSec
    || eventFixture.slsModes.length !== descriptor.slsModes.length
    || eventFixture.slsModes.some(
      (mode, index) => mode !== descriptor.slsModes[index],
    )
    || !eventFixture.fiveWallCanonicalBatch.reverseInputOrderCompared
    || !eventFixture.emptyBatchRegressedInBothTopologies
    || manifest.simplexProtocol.fractionToBoundarySafety
      !== numericalPolicy.fractionToBoundarySafety
    || manifest.globalJacobianProtocol.constructionScaledStep
      !== numericalPolicy.algorithmicJacobianScaledStep
    || manifest.globalJacobianProtocol.directionalAuditStepRatio
      !== numericalPolicy.independentDirectionalAuditStepRatioToConstruction
    || manifest.globalJacobianProtocol.directionalRelativeTwoNormTolerance
      !== numericalPolicy
        .semismoothDirectionalConsistencyRelativeTwoNormTolerance
    || manifest.globalJacobianProtocol.minimumRequiredScaledCrossBlockMagnitude
      !== numericalPolicy.minimumRequiredScaledCrossBlockMagnitude
    || manifest.energyEvidence.landAdapterWorkClosureTolerance
      !== PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .landAdapterWorkRelativeTolerance
    || manifest.energyEvidence.normalizedSlsIdentityTolerance
      !== PHASE_B1_WHOLE_HEART_SLS_BE_NORMALIZED_IDENTITY_TOLERANCE_V1
    || manifest.energyEvidence.normalizedMechanicalStageTolerance
      !== PHASE_B1_WHOLE_HEART_MECHANICAL_ENERGY_AUDIT_POLICY_V1
        .correctedStageLedgerNormalizedResidualTolerance
  ) throw new Error("Phase B1 vertical-slice protocol values disagree");
  if (
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) throw new Error("Phase B1 vertical-slice claim boundary drifted");
  return manifest;
}

export function phaseB1MonolithicVerticalSliceManifestHashPayloadV1(
  manifest: PhaseB1MonolithicVerticalSliceManifestV1,
): PhaseB1MonolithicVerticalSliceManifestHashPayloadV1 {
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = manifest;
  return Object.freeze(payload);
}
