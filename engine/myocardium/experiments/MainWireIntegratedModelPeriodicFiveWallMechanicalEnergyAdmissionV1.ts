export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-admission-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1 =
  Object.freeze(["LA", "LVFW", "SEP", "RVFW", "RA"] as const);
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_AGGREGATE_IDS_V1 =
  Object.freeze(["all-five", "ventricular-walls"] as const);
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1 =
  Object.freeze([
    "left-atrium",
    "right-atrium",
    "ventricles-combined",
    "whole-heart",
  ] as const);
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1 =
  Object.freeze(["LV", "RV"] as const);

const STRESS_WORK_COMPONENT_IDS_V1 = Object.freeze([
  "total",
  "land-active",
  "equilibrium-passive",
  "parallel-sls",
] as const);

type WallIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number];
type AggregateIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_AGGREGATE_IDS_V1)[number];
type StressWorkComponentIdV1 = (typeof STRESS_WORK_COMPONENT_IDS_V1)[number];
export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyAggregateIdV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1)[number];
export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureChamberV1 =
  (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1)[number];

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricIdV1 =
  | `wall.${WallIdV1}.stress-work.${StressWorkComponentIdV1}`
  | `wall.${WallIdV1}.equilibrium-passive-stored-energy-change`
  | `wall.${WallIdV1}.parallel-sls-stored-energy-change`
  | `wall.${WallIdV1}.sls-physical-dissipation`
  | `cavity.${"LA" | "LV" | "RA" | "RV"}.work-on-wall`
  | `aggregate.${AggregateIdV1}.stress-work.${StressWorkComponentIdV1}`
  | `aggregate.${AggregateIdV1}.equilibrium-passive-stored-energy-change`
  | `aggregate.${AggregateIdV1}.parallel-sls-stored-energy-change`
  | `aggregate.${AggregateIdV1}.sls-physical-dissipation`;

const wallPhysicalMetricIdsV1 =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.flatMap(
    (wallId) => [
      ...STRESS_WORK_COMPONENT_IDS_V1.map(
        (componentId) => `wall.${wallId}.stress-work.${componentId}` as const,
      ),
      `wall.${wallId}.equilibrium-passive-stored-energy-change` as const,
      `wall.${wallId}.parallel-sls-stored-energy-change` as const,
      `wall.${wallId}.sls-physical-dissipation` as const,
    ],
  );
const aggregatePhysicalMetricIdsV1 =
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_AGGREGATE_IDS_V1.flatMap(
    (aggregateId) => [
      ...STRESS_WORK_COMPONENT_IDS_V1.map(
        (componentId) =>
          `aggregate.${aggregateId}.stress-work.${componentId}` as const,
      ),
      `aggregate.${aggregateId}.equilibrium-passive-stored-energy-change` as const,
      `aggregate.${aggregateId}.parallel-sls-stored-energy-change` as const,
      `aggregate.${aggregateId}.sls-physical-dissipation` as const,
    ],
  );

/** The complete, preregistered 53-scalar physical refinement vector. */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1 =
  Object.freeze([
    ...wallPhysicalMetricIdsV1,
    "cavity.LA.work-on-wall" as const,
    "cavity.LV.work-on-wall" as const,
    "cavity.RA.work-on-wall" as const,
    "cavity.RV.work-on-wall" as const,
    ...aggregatePhysicalMetricIdsV1,
  ] satisfies readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricIdV1[]);

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualIdV1 =
  | `wall.${WallIdV1}.stress-assembly`
  | `wall.${WallIdV1}.parallel-sls.reported-balance`
  | `wall.${WallIdV1}.parallel-sls.reconstructed-balance`
  | `wall.${WallIdV1}.parallel-sls.readback-agreement`;

/** The complete, preregistered 20-scalar algebraically exact residual set. */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1 =
  Object.freeze(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.flatMap(
      (wallId) => [
        `wall.${wallId}.stress-assembly` as const,
        `wall.${wallId}.parallel-sls.reported-balance` as const,
        `wall.${wallId}.parallel-sls.reconstructed-balance` as const,
        `wall.${wallId}.parallel-sls.readback-agreement` as const,
      ],
    ) satisfies readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualIdV1[],
  );

/**
 * Frozen before the independent 0.5 ms run. These are numerical admission
 * limits for a sealed analysis, not biological tolerances or public outputs.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1 =
  Object.freeze({
    policyId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_V1_ID,
    declarationStatus:
      "declared-before-new-0.5ms-mechanical-energy-ledger-result" as const,
    requiredArmId: "normal-default" as const,
    requiredExecutionPurpose: "canonical-evidence" as const,
    requiredNumericalAccessId:
      "main-wire-integrated-model-periodic-work-refinement-1ms-0.5ms-access-v1" as const,
    requiredRequestedMaximumCycleCount: 250 as const,
    independentColdStartRequired: true as const,
    coarseDtSec: 0.001 as const,
    fineDtSec: 0.0005 as const,
    existingPeriod1MaximumNormalizedDelta: 1e-3 as const,
    physicalRefinement: Object.freeze({
      requiredMetricIds:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1,
      requiredMetricCount: 53 as const,
      maximumScaledDifference: 0.01 as const,
      denominatorFloorMilliJ: 1 as const,
      signAgreementThresholdMilliJ: 1 as const,
    }),
    exactAccounting: Object.freeze({
      requiredResidualIds:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1,
      requiredResidualCount: 20 as const,
      maximumAbsoluteResidualMilliJ: 1e-8 as const,
      aggregatePhysicalMetricsAreExactPerWallSums: true as const,
      stressAssemblyResidualsAreCrossFieldReadbacks: true as const,
    }),
    finiteIncrementConjugacy: Object.freeze({
      requiredAggregateIds:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1,
      maximumFineScaledResidual: 2e-3 as const,
      denominatorFloorMilliJ: 1 as const,
      coarseToFineDecreaseRequired: false as const,
    }),
    quadratureBridge: Object.freeze({
      requiredChambers:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1,
      identity:
        "BE-cavity-work-on-wall-plus-trapezoidal-external-work-by-ventricle-minus-endpoint-correction" as const,
      maximumAbsoluteResidualMilliJ: 1e-8 as const,
    }),
    numericalAggregates: Object.freeze({
      allFiveSlsBackwardEulerNumericalDissipationMinimumMilliJ: 0 as const,
      allFiveEquilibriumPassiveBackwardEulerRemainderMinimumMilliJ:
        -1e-8 as const,
      strictCoarseToFineDecreaseRequired: true as const,
    }),
    perStepSlsResidualEvidence: Object.freeze({
      maximumToleranceRatio: 1 as const,
      finiteNonnegativeAbsoluteMaximaRequired: true as const,
      exactFiveWallCoverageRequired: true as const,
    }),
    septalAllocationPermitted: false as const,
    commonPericardialBagRole:
      "readback-and-characterization-only-not-admission" as const,
    backwardEulerLedgerOwnerDistinctFromTrapezoidalPvWorkOwner: true as const,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    publicGraphCatalogAdmissionEstablished: false as const,
    PEEstablished: false as const,
    PVAEstablished: false as const,
    MVO2Established: false as const,
    ATPUseEstablished: false as const,
    mechanicalEfficiencyEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmGateProjectionV1 =
  Readonly<{
    protocolIdentityValid: boolean;
    modelConditionIdentityValid: boolean;
    normalDefaultConditionPassed: boolean;
    canonicalLatestPeriod1Source: boolean;
    sourceCycleIntegrityPassed: boolean;
    sourceCheckpointExactParityPassed: boolean;
    continuationPeriod1Passed: boolean;
    acceptedPathTraceComplete: boolean;
    finiteAcceptedReadback: boolean;
    materialVolumeIdentityPassed: boolean;
    mechanicalSourceIdentityPassed: boolean;
    perStepSlsPassivityPassed: boolean;
    perStepSlsResidualReconstructionPassed: boolean;
    cycleIntegratedSlsDissipationNonnegative: boolean;
    equilibriumPassiveBackwardEulerRemainderNonnegative: boolean;
    algebraicResidualsPassed: boolean;
    measurementExternalWorkQualified: boolean;
    quadratureBridgePassed: boolean;
    continuationCheckpointExactParityPassed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricProjectionV1 =
  Readonly<{ metricId: string; valueMilliJ: number }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyProjectionV1 =
  Readonly<{
    aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyAggregateIdV1;
    residualMilliJ: number;
    wallWorkMilliJ: number;
    cavityWorkMilliJ: number;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualProjectionV1 =
  Readonly<{
    residualId: string;
    valueMilliJ: number;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeProjectionV1 =
  Readonly<{
    chamber: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureChamberV1;
    backwardEulerCavityWorkOnWallMilliJ: number;
    trapezoidalExternalWorkMilliJ: number;
    endpointCorrectionMilliJ: number;
    residualMilliJ: number;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualProjectionV1 =
  Readonly<{
    assessedAcceptedStepCount: number;
    assessedWallStepCount: number;
    maximumAbsoluteReconstructedResidualDensityJPerM3: number;
    maximumAbsoluteReadbackAgreementResidualDensityJPerM3: number;
    maximumReconstructedResidualToleranceRatio: number;
    maximumReadbackAgreementToleranceRatio: number;
  }>;

/**
 * Deliberately model-specific projection. A tool adapter may construct it from
 * a single-arm ledger result without coupling this comparator to that runner.
 */
export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1 =
  Readonly<{
    armId: string;
    executionPurpose: string;
    numericalAccessId: string;
    requestedMaximumCycleCount: number;
    independentColdStart: boolean;
    status: "qualified-for-refinement-comparison" | "not-qualified";
    nominalDtSec: number;
    modelConditionIdentityHash: string;
    protocolIdentityHash: string;
    sourceCycleIndex: number;
    sourceAcceptedStepCount: number;
    bridgeCycleIndex: number | null;
    bridgeAcceptedStepCount: number | null;
    measurementCycleIndex: number | null;
    measurementAcceptedStepCount: number | null;
    gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmGateProjectionV1;
    materialVolumeBindingSha256: string | null;
    rawMechanicalTraceSha256: string | null;
    sourceCheckpointSha256: string | null;
    bridgeTerminalAcceptedStepSampleSha256: string | null;
    terminalCheckpointSha256: string | null;
    physicalMetrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricProjectionV1[];
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: number | null;
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: number | null;
    conjugacy: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyProjectionV1[];
    algebraicResiduals: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualProjectionV1[];
    quadratureBridges: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeProjectionV1[];
    perStepSlsResidualEvidence: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPerStepSlsResidualProjectionV1;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricComparisonV1 =
  Readonly<{
    metricId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricIdV1;
    coarseMilliJ: number | null;
    fineMilliJ: number | null;
    absoluteDifferenceMilliJ: number | null;
    denominatorMilliJ: number | null;
    scaledDifference: number | null;
    signAgreementRequired: boolean | null;
    signAgrees: boolean | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyTrendV1 =
  "decreased" | "equal" | "increased" | "not-assessable";

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyComparisonV1 =
  Readonly<{
    aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyAggregateIdV1;
    coarse: Readonly<{
      residualMilliJ: number | null;
      wallWorkMilliJ: number | null;
      cavityWorkMilliJ: number | null;
      recomputedResidualMilliJ: number | null;
      residualReadbackDifferenceMilliJ: number | null;
      scaledResidual: number | null;
      readbackPassed: boolean;
    }>;
    fine: Readonly<{
      residualMilliJ: number | null;
      wallWorkMilliJ: number | null;
      cavityWorkMilliJ: number | null;
      recomputedResidualMilliJ: number | null;
      residualReadbackDifferenceMilliJ: number | null;
      scaledResidual: number | null;
      readbackPassed: boolean;
    }>;
    absoluteResidualTrend: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyTrendV1;
    finePassed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateComparisonV1 =
  Readonly<{
    coarseMilliJ: number | null;
    fineMilliJ: number | null;
    minimumAllowedMilliJ: number;
    finiteAndNonnegative: boolean;
    strictlyDecreased: boolean;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    residualId: string;
    valueMilliJ: number;
    reportedPassed: boolean;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAggregateMetricSumAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    aggregateId: AggregateIdV1;
    aggregateMetricId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricIdV1;
    reportedValueMilliJ: number | null;
    recomputedPerWallSumMilliJ: number | null;
    residualMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyStressAssemblyReadbackAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    wallId: WallIdV1;
    reportedResidualMilliJ: number | null;
    recomputedResidualMilliJ: number | null;
    residualReadbackDifferenceMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyPhysicalVectorBindingAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyAggregateIdV1;
    reportedWallWorkMilliJ: number | null;
    physicalVectorWallWorkMilliJ: number | null;
    wallWorkDifferenceMilliJ: number | null;
    reportedCavityWorkMilliJ: number | null;
    physicalVectorCavityWorkMilliJ: number | null;
    cavityWorkDifferenceMilliJ: number | null;
    reportedResidualMilliJ: number | null;
    physicalVectorResidualMilliJ: number | null;
    residualDifferenceMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadraturePhysicalVectorBindingAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    chamber: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureChamberV1;
    reportedBackwardEulerCavityWorkOnWallMilliJ: number | null;
    physicalVectorCavityWorkOnWallMilliJ: number | null;
    differenceMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateReadbackAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    reportedSlsBackwardEulerNumericalDissipationMilliJ: number | null;
    recomputedSlsBackwardEulerNumericalDissipationMilliJ: number | null;
    slsDifferenceMilliJ: number | null;
    reportedEquilibriumPassiveBackwardEulerRemainderMilliJ: number | null;
    recomputedEquilibriumPassiveBackwardEulerRemainderMilliJ: number | null;
    equilibriumPassiveDifferenceMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySlsBalanceReadbackAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    wallId: WallIdV1;
    reportedBalanceResidualMilliJ: number | null;
    reconstructedBalanceResidualMilliJ: number | null;
    reportedReadbackAgreementResidualMilliJ: number | null;
    recomputedReadbackAgreementResidualMilliJ: number | null;
    differenceMilliJ: number | null;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeAssessmentV1 =
  Readonly<{
    grid: "coarse" | "fine";
    chamber: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureChamberV1;
    reportedResidualMilliJ: number | null;
    recomputedResidualMilliJ: number | null;
    residualReadbackDifferenceMilliJ: number | null;
    reportedPassed: boolean;
    passed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionFailureReasonV1 =
  | "nominal-step-pair-mismatch"
  | "required-normal-default-arm-missing"
  | "canonical-execution-purpose-missing"
  | "work-refinement-numerical-access-missing"
  | "canonical-requested-horizon-mismatch"
  | "independent-cold-start-missing"
  | "single-arm-qualification-failed"
  | "single-arm-gate-failed"
  | "model-condition-identity-invalid"
  | "model-condition-identities-differ"
  | "protocol-identity-invalid"
  | "protocol-identities-not-distinct"
  | "canonical-period1-not-established"
  | "accepted-path-lineage-incomplete"
  | "cycle-or-accepted-step-lineage-invalid"
  | "checkpoint-exact-parity-failed"
  | "source-checkpoint-hash-invalid"
  | "bridge-terminal-sample-hash-invalid"
  | "terminal-checkpoint-hash-invalid"
  | "raw-mechanical-trace-hash-invalid"
  | "material-volume-binding-hash-invalid"
  | "material-volume-bindings-differ"
  | "physical-metric-vector-incomplete"
  | "physical-metric-ids-differ"
  | "physical-metric-value-nonfinite"
  | "aggregate-physical-metric-sum-mismatch"
  | "stress-assembly-residual-readback-mismatch"
  | "sls-balance-readback-mismatch"
  | "numerical-aggregate-scalar-readback-mismatch"
  | "physical-refinement-threshold-failed"
  | "physical-sign-agreement-failed"
  | "sls-be-numerical-dissipation-invalid"
  | "sls-be-numerical-dissipation-not-decreased"
  | "equilibrium-passive-be-remainder-invalid"
  | "equilibrium-passive-be-remainder-not-decreased"
  | "per-step-sls-residual-evidence-invalid"
  | "conjugacy-vector-incomplete"
  | "conjugacy-value-nonfinite"
  | "conjugacy-residual-readback-mismatch"
  | "conjugacy-physical-vector-binding-mismatch"
  | "fine-conjugacy-threshold-failed"
  | "algebraic-residual-vector-invalid"
  | "algebraic-residual-threshold-failed"
  | "quadrature-bridge-vector-incomplete"
  | "quadrature-bridge-value-nonfinite"
  | "quadrature-physical-vector-binding-mismatch"
  | "quadrature-bridge-failed";

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionGatesV1 =
  Readonly<{
    nominalStepPairMatches: boolean;
    bothNormalDefaultArms: boolean;
    bothCanonicalEvidenceExecutions: boolean;
    bothWorkRefinementNumericalAccesses: boolean;
    bothCanonicalRequestedHorizons: boolean;
    bothIndependentColdStarts: boolean;
    bothSingleArmQualified: boolean;
    allSingleArmGatesPassed: boolean;
    modelConditionIdentitiesValid: boolean;
    modelConditionIdentitiesMatch: boolean;
    protocolIdentitiesValid: boolean;
    protocolIdentitiesDistinct: boolean;
    bothCanonicalPeriod1Established: boolean;
    bothAcceptedPathLineagesComplete: boolean;
    bothCycleAndAcceptedStepLineagesValid: boolean;
    bothCheckpointExactParitiesPassed: boolean;
    sourceCheckpointHashesValid: boolean;
    bridgeTerminalSampleHashesValid: boolean;
    terminalCheckpointHashesValid: boolean;
    rawMechanicalTraceHashesValid: boolean;
    materialVolumeBindingHashesValid: boolean;
    materialVolumeBindingsMatch: boolean;
    physicalMetricVectorsComplete: boolean;
    physicalMetricIdsMatch: boolean;
    physicalMetricValuesFinite: boolean;
    aggregatePhysicalMetricSumsPassed: boolean;
    stressAssemblyResidualReadbacksPassed: boolean;
    slsBalanceResidualReadbacksPassed: boolean;
    numericalAggregateScalarReadbacksPassed: boolean;
    physicalRefinementThresholdPassed: boolean;
    physicalSignAgreementPassed: boolean;
    slsBackwardEulerNumericalDissipationFiniteAndNonnegative: boolean;
    slsBackwardEulerNumericalDissipationStrictlyDecreased: boolean;
    equilibriumPassiveBackwardEulerRemainderFiniteAndNonnegative: boolean;
    equilibriumPassiveBackwardEulerRemainderStrictlyDecreased: boolean;
    perStepSlsResidualEvidenceValid: boolean;
    conjugacyVectorsComplete: boolean;
    conjugacyValuesFinite: boolean;
    conjugacyResidualReadbacksPassed: boolean;
    conjugacyPhysicalVectorBindingsPassed: boolean;
    fineConjugacyThresholdPassed: boolean;
    algebraicResidualVectorsValid: boolean;
    algebraicResidualsPassed: boolean;
    quadratureBridgeVectorsComplete: boolean;
    quadratureBridgeValuesFinite: boolean;
    quadraturePhysicalVectorBindingsPassed: boolean;
    quadratureBridgesPassed: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 =
  Readonly<{
    admissionId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_V1_ID;
    status: "comparison-passed" | "comparison-failed";
    coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1;
    fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1;
    gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionGatesV1;
    physicalMetricComparisons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricComparisonV1[];
    aggregateMetricSumAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAggregateMetricSumAssessmentV1[];
    stressAssemblyReadbackAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyStressAssemblyReadbackAssessmentV1[];
    slsBalanceReadbackAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySlsBalanceReadbackAssessmentV1[];
    numericalAggregateReadbackAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateReadbackAssessmentV1[];
    allFiveSlsBackwardEulerNumericalDissipation: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateComparisonV1;
    allFiveEquilibriumPassiveBackwardEulerRemainder: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateComparisonV1;
    conjugacyComparisons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyComparisonV1[];
    conjugacyPhysicalVectorBindingAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyPhysicalVectorBindingAssessmentV1[];
    algebraicResidualAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualAssessmentV1[];
    quadratureBridgeAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeAssessmentV1[];
    quadraturePhysicalVectorBindingAssessments: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadraturePhysicalVectorBindingAssessmentV1[];
    failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionFailureReasonV1[];
    numericalAdmissionConjunctionPassed: boolean;
    officialSealedMechanicalEnergyAnalysisEligible: false;
    publicLiveOutputCatalogAdmissionEstablished: false;
    publicGraphCatalogAdmissionEstablished: false;
    PEEstablished: false;
    PVAEstablished: false;
    MVO2Established: false;
    ATPUseEstablished: false;
    mechanicalEfficiencyEstablished: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
    policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1;
  }>;

export function assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
  coarseInput: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fineInput: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 {
  const coarse = snapshotSingleArmProjectionV1(coarseInput);
  const fine = snapshotSingleArmProjectionV1(fineInput);
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1;
  const physicalMetricComparisons = comparePhysicalMetricsV1(coarse, fine);
  const aggregateMetricSumAssessments = assessAggregateMetricSumsV1(
    coarse,
    fine,
  );
  const stressAssemblyReadbackAssessments = assessStressAssemblyReadbacksV1(
    coarse,
    fine,
  );
  const slsBalanceReadbackAssessments = assessSlsBalanceReadbacksV1(
    coarse,
    fine,
  );
  const numericalAggregateReadbackAssessments =
    assessNumericalAggregateReadbacksV1(coarse, fine);
  const slsAggregate = compareNumericalAggregateV1(
    coarse.allFiveSlsBackwardEulerNumericalDissipationMilliJ,
    fine.allFiveSlsBackwardEulerNumericalDissipationMilliJ,
    policy.numericalAggregates
      .allFiveSlsBackwardEulerNumericalDissipationMinimumMilliJ,
  );
  const equilibriumPassiveAggregate = compareNumericalAggregateV1(
    coarse.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ,
    fine.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ,
    policy.numericalAggregates
      .allFiveEquilibriumPassiveBackwardEulerRemainderMinimumMilliJ,
  );
  const conjugacyComparisons = compareConjugacyV1(coarse, fine);
  const conjugacyPhysicalVectorBindingAssessments =
    assessConjugacyPhysicalVectorBindingsV1(coarse, fine);
  const algebraicResidualAssessments = assessAlgebraicResidualsV1(coarse, fine);
  const quadratureBridgeAssessments = assessQuadratureBridgesV1(coarse, fine);
  const quadraturePhysicalVectorBindingAssessments =
    assessQuadraturePhysicalVectorBindingsV1(coarse, fine);

  const coarsePhysicalIds = coarse.physicalMetrics.map(
    ({ metricId }) => metricId,
  );
  const finePhysicalIds = fine.physicalMetrics.map(({ metricId }) => metricId);
  const physicalMetricVectorsComplete =
    exactUniqueIdSetV1(
      coarsePhysicalIds,
      policy.physicalRefinement.requiredMetricIds,
    ) &&
    exactUniqueIdSetV1(
      finePhysicalIds,
      policy.physicalRefinement.requiredMetricIds,
    );
  const physicalMetricIdsMatch = sameUniqueIdSetV1(
    coarsePhysicalIds,
    finePhysicalIds,
  );
  const physicalMetricValuesFinite = [
    ...coarse.physicalMetrics,
    ...fine.physicalMetrics,
  ].every(({ valueMilliJ }) => Number.isFinite(valueMilliJ));
  const algebraicResidualVectorsValid = validMatchingAlgebraicResidualVectorsV1(
    coarse,
    fine,
  );
  const quadratureBridgeVectorsComplete =
    exactQuadratureVectorV1(coarse) && exactQuadratureVectorV1(fine);
  const quadratureBridgeValuesFinite = [
    ...coarse.quadratureBridges,
    ...fine.quadratureBridges,
  ].every((bridge) =>
    [
      bridge.backwardEulerCavityWorkOnWallMilliJ,
      bridge.trapezoidalExternalWorkMilliJ,
      bridge.endpointCorrectionMilliJ,
      bridge.residualMilliJ,
    ].every(Number.isFinite),
  );
  const conjugacyVectorsComplete =
    exactConjugacyVectorV1(coarse) && exactConjugacyVectorV1(fine);
  const conjugacyValuesFinite = [...coarse.conjugacy, ...fine.conjugacy].every(
    (entry) =>
      [
        entry.residualMilliJ,
        entry.wallWorkMilliJ,
        entry.cavityWorkMilliJ,
      ].every(Number.isFinite),
  );
  const allSingleArmGatesPassed =
    allSingleArmGatesPassedV1(coarse) && allSingleArmGatesPassedV1(fine);
  const bothCycleAndAcceptedStepLineagesValid =
    validCycleAndAcceptedStepLineageV1(coarse) &&
    validCycleAndAcceptedStepLineageV1(fine);
  const gates = Object.freeze({
    nominalStepPairMatches:
      coarse.nominalDtSec === policy.coarseDtSec &&
      fine.nominalDtSec === policy.fineDtSec,
    bothNormalDefaultArms:
      coarse.armId === policy.requiredArmId &&
      fine.armId === policy.requiredArmId &&
      coarse.gates.normalDefaultConditionPassed &&
      fine.gates.normalDefaultConditionPassed,
    bothCanonicalEvidenceExecutions:
      coarse.executionPurpose === policy.requiredExecutionPurpose &&
      fine.executionPurpose === policy.requiredExecutionPurpose,
    bothWorkRefinementNumericalAccesses:
      coarse.numericalAccessId === policy.requiredNumericalAccessId &&
      fine.numericalAccessId === policy.requiredNumericalAccessId,
    bothCanonicalRequestedHorizons:
      coarse.requestedMaximumCycleCount ===
        policy.requiredRequestedMaximumCycleCount &&
      fine.requestedMaximumCycleCount ===
        policy.requiredRequestedMaximumCycleCount,
    bothIndependentColdStarts:
      coarse.independentColdStart && fine.independentColdStart,
    bothSingleArmQualified:
      coarse.status === "qualified-for-refinement-comparison" &&
      fine.status === "qualified-for-refinement-comparison",
    allSingleArmGatesPassed,
    modelConditionIdentitiesValid:
      validSha256V1(coarse.modelConditionIdentityHash) &&
      validSha256V1(fine.modelConditionIdentityHash) &&
      coarse.gates.modelConditionIdentityValid &&
      fine.gates.modelConditionIdentityValid,
    modelConditionIdentitiesMatch:
      coarse.modelConditionIdentityHash === fine.modelConditionIdentityHash,
    protocolIdentitiesValid:
      validSha256V1(coarse.protocolIdentityHash) &&
      validSha256V1(fine.protocolIdentityHash) &&
      coarse.gates.protocolIdentityValid &&
      fine.gates.protocolIdentityValid,
    protocolIdentitiesDistinct:
      coarse.protocolIdentityHash !== fine.protocolIdentityHash,
    bothCanonicalPeriod1Established:
      coarse.gates.canonicalLatestPeriod1Source &&
      fine.gates.canonicalLatestPeriod1Source &&
      coarse.gates.continuationPeriod1Passed &&
      fine.gates.continuationPeriod1Passed,
    bothAcceptedPathLineagesComplete:
      coarse.gates.sourceCycleIntegrityPassed &&
      fine.gates.sourceCycleIntegrityPassed &&
      coarse.gates.acceptedPathTraceComplete &&
      fine.gates.acceptedPathTraceComplete &&
      coarse.gates.materialVolumeIdentityPassed &&
      fine.gates.materialVolumeIdentityPassed &&
      coarse.gates.mechanicalSourceIdentityPassed &&
      fine.gates.mechanicalSourceIdentityPassed &&
      bothCycleAndAcceptedStepLineagesValid,
    bothCycleAndAcceptedStepLineagesValid,
    bothCheckpointExactParitiesPassed:
      coarse.gates.sourceCheckpointExactParityPassed &&
      fine.gates.sourceCheckpointExactParityPassed &&
      coarse.gates.continuationCheckpointExactParityPassed &&
      fine.gates.continuationCheckpointExactParityPassed,
    sourceCheckpointHashesValid:
      validSha256V1(coarse.sourceCheckpointSha256) &&
      validSha256V1(fine.sourceCheckpointSha256),
    bridgeTerminalSampleHashesValid:
      validSha256V1(coarse.bridgeTerminalAcceptedStepSampleSha256) &&
      validSha256V1(fine.bridgeTerminalAcceptedStepSampleSha256),
    terminalCheckpointHashesValid:
      validSha256V1(coarse.terminalCheckpointSha256) &&
      validSha256V1(fine.terminalCheckpointSha256),
    rawMechanicalTraceHashesValid:
      validSha256V1(coarse.rawMechanicalTraceSha256) &&
      validSha256V1(fine.rawMechanicalTraceSha256),
    materialVolumeBindingHashesValid:
      validSha256V1(coarse.materialVolumeBindingSha256) &&
      validSha256V1(fine.materialVolumeBindingSha256),
    materialVolumeBindingsMatch:
      coarse.materialVolumeBindingSha256 === fine.materialVolumeBindingSha256,
    physicalMetricVectorsComplete,
    physicalMetricIdsMatch,
    physicalMetricValuesFinite,
    aggregatePhysicalMetricSumsPassed: aggregateMetricSumAssessments.every(
      ({ passed }) => passed,
    ),
    stressAssemblyResidualReadbacksPassed:
      stressAssemblyReadbackAssessments.every(({ passed }) => passed),
    slsBalanceResidualReadbacksPassed: slsBalanceReadbackAssessments.every(
      ({ passed }) => passed,
    ),
    numericalAggregateScalarReadbacksPassed:
      numericalAggregateReadbackAssessments.every(({ passed }) => passed),
    physicalRefinementThresholdPassed: physicalMetricComparisons.every(
      ({ passed }) => passed,
    ),
    physicalSignAgreementPassed: physicalMetricComparisons.every(
      ({ signAgrees }) => signAgrees === true,
    ),
    slsBackwardEulerNumericalDissipationFiniteAndNonnegative:
      slsAggregate.finiteAndNonnegative,
    slsBackwardEulerNumericalDissipationStrictlyDecreased:
      slsAggregate.strictlyDecreased,
    equilibriumPassiveBackwardEulerRemainderFiniteAndNonnegative:
      equilibriumPassiveAggregate.finiteAndNonnegative,
    equilibriumPassiveBackwardEulerRemainderStrictlyDecreased:
      equilibriumPassiveAggregate.strictlyDecreased,
    perStepSlsResidualEvidenceValid:
      validPerStepSlsResidualEvidenceV1(coarse) &&
      validPerStepSlsResidualEvidenceV1(fine),
    conjugacyVectorsComplete,
    conjugacyValuesFinite,
    conjugacyResidualReadbacksPassed: conjugacyComparisons.every(
      ({ coarse: coarseValue, fine: fineValue }) =>
        coarseValue.readbackPassed && fineValue.readbackPassed,
    ),
    conjugacyPhysicalVectorBindingsPassed:
      conjugacyPhysicalVectorBindingAssessments.every(({ passed }) => passed),
    fineConjugacyThresholdPassed: conjugacyComparisons.every(
      ({ fine }) =>
        fine.scaledResidual !== null &&
        fine.scaledResidual <=
          policy.finiteIncrementConjugacy.maximumFineScaledResidual,
    ),
    algebraicResidualVectorsValid,
    algebraicResidualsPassed:
      algebraicResidualVectorsValid &&
      coarse.gates.algebraicResidualsPassed &&
      fine.gates.algebraicResidualsPassed &&
      algebraicResidualAssessments.every(({ passed }) => passed),
    quadratureBridgeVectorsComplete,
    quadratureBridgeValuesFinite,
    quadraturePhysicalVectorBindingsPassed:
      quadraturePhysicalVectorBindingAssessments.every(({ passed }) => passed),
    quadratureBridgesPassed:
      quadratureBridgeVectorsComplete &&
      quadratureBridgeValuesFinite &&
      coarse.gates.quadratureBridgePassed &&
      fine.gates.quadratureBridgePassed &&
      quadratureBridgeAssessments.every(({ passed }) => passed),
  } satisfies MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionGatesV1);

  const numericalAdmissionConjunctionPassed = Object.values(gates).every(
    (passed) => passed,
  );
  const failureReasons = failureReasonsV1(gates);
  return Object.freeze({
    admissionId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_V1_ID,
    status: numericalAdmissionConjunctionPassed
      ? ("comparison-passed" as const)
      : ("comparison-failed" as const),
    coarse,
    fine,
    gates,
    physicalMetricComparisons,
    aggregateMetricSumAssessments,
    stressAssemblyReadbackAssessments,
    slsBalanceReadbackAssessments,
    numericalAggregateReadbackAssessments,
    allFiveSlsBackwardEulerNumericalDissipation: slsAggregate,
    allFiveEquilibriumPassiveBackwardEulerRemainder:
      equilibriumPassiveAggregate,
    conjugacyComparisons,
    conjugacyPhysicalVectorBindingAssessments,
    algebraicResidualAssessments,
    quadratureBridgeAssessments,
    quadraturePhysicalVectorBindingAssessments,
    failureReasons,
    numericalAdmissionConjunctionPassed,
    officialSealedMechanicalEnergyAnalysisEligible: false as const,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    publicGraphCatalogAdmissionEstablished: false as const,
    PEEstablished: false as const,
    PVAEstablished: false as const,
    MVO2Established: false as const,
    ATPUseEstablished: false as const,
    mechanicalEfficiencyEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy,
  });
}

function snapshotSingleArmProjectionV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1 {
  return Object.freeze({
    ...source,
    gates: Object.freeze({ ...source.gates }),
    physicalMetrics: Object.freeze(
      source.physicalMetrics.map((metric) => Object.freeze({ ...metric })),
    ),
    conjugacy: Object.freeze(
      source.conjugacy.map((entry) => Object.freeze({ ...entry })),
    ),
    algebraicResiduals: Object.freeze(
      source.algebraicResiduals.map((entry) => Object.freeze({ ...entry })),
    ),
    quadratureBridges: Object.freeze(
      source.quadratureBridges.map((entry) => Object.freeze({ ...entry })),
    ),
    perStepSlsResidualEvidence: Object.freeze({
      ...source.perStepSlsResidualEvidence,
    }),
  });
}

function comparePhysicalMetricsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricComparisonV1[] {
  const coarseById = new Map(
    coarse.physicalMetrics.map((metric) => [
      metric.metricId,
      metric.valueMilliJ,
    ]),
  );
  const fineById = new Map(
    fine.physicalMetrics.map((metric) => [metric.metricId, metric.valueMilliJ]),
  );
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1.physicalRefinement;
  return Object.freeze(
    policy.requiredMetricIds.map((metricId) => {
      const coarseMilliJ = coarseById.get(metricId) ?? null;
      const fineMilliJ = fineById.get(metricId) ?? null;
      if (
        coarseMilliJ === null ||
        fineMilliJ === null ||
        !Number.isFinite(coarseMilliJ) ||
        !Number.isFinite(fineMilliJ)
      ) {
        return Object.freeze({
          metricId,
          coarseMilliJ,
          fineMilliJ,
          absoluteDifferenceMilliJ: null,
          denominatorMilliJ: null,
          scaledDifference: null,
          signAgreementRequired: null,
          signAgrees: null,
          passed: false,
        });
      }
      const absoluteDifferenceMilliJ = Math.abs(coarseMilliJ - fineMilliJ);
      const denominatorMilliJ = Math.max(
        Math.abs(fineMilliJ),
        policy.denominatorFloorMilliJ,
      );
      const scaledDifference = absoluteDifferenceMilliJ / denominatorMilliJ;
      const signAgreementRequired =
        Math.abs(fineMilliJ) >= policy.signAgreementThresholdMilliJ;
      const signAgrees =
        !signAgreementRequired ||
        Math.sign(coarseMilliJ) === Math.sign(fineMilliJ);
      return Object.freeze({
        metricId,
        coarseMilliJ,
        fineMilliJ,
        absoluteDifferenceMilliJ,
        denominatorMilliJ,
        scaledDifference,
        signAgreementRequired,
        signAgrees,
        passed:
          Number.isFinite(scaledDifference) &&
          scaledDifference <= policy.maximumScaledDifference &&
          signAgrees,
      });
    }),
  );
}

function assessAggregateMetricSumsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAggregateMetricSumAssessmentV1[] {
  const suffixes = Object.freeze([
    ...STRESS_WORK_COMPONENT_IDS_V1.map(
      (componentId) => `stress-work.${componentId}` as const,
    ),
    "equilibrium-passive-stored-energy-change" as const,
    "parallel-sls-stored-energy-change" as const,
    "sls-physical-dissipation" as const,
  ]);
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .exactAccounting.maximumAbsoluteResidualMilliJ;
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).flatMap(([grid, projection]) => {
      const metricById = new Map(
        projection.physicalMetrics.map((metric) => [
          metric.metricId,
          metric.valueMilliJ,
        ]),
      );
      return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_AGGREGATE_IDS_V1.flatMap(
        (aggregateId) => {
          const wallIds =
            aggregateId === "all-five"
              ? MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1
              : (["LVFW", "SEP", "RVFW"] as const);
          return suffixes.map((suffix) => {
            const aggregateMetricId =
              `aggregate.${aggregateId}.${suffix}` as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricIdV1;
            const reported = metricById.get(aggregateMetricId) ?? null;
            const wallValues = wallIds.map((wallId) =>
              metricById.get(`wall.${wallId}.${suffix}`),
            );
            const finite =
              reported !== null &&
              Number.isFinite(reported) &&
              wallValues.every(
                (value) => value !== undefined && Number.isFinite(value),
              );
            const recomputed = finite
              ? wallValues.reduce((sum, value) => sum + value!, 0)
              : null;
            const residual = recomputed === null ? null : reported - recomputed;
            return Object.freeze({
              grid,
              aggregateId,
              aggregateMetricId,
              reportedValueMilliJ: reported,
              recomputedPerWallSumMilliJ: recomputed,
              residualMilliJ: residual,
              passed: residual !== null && Math.abs(residual) <= tolerance,
            });
          });
        },
      );
    }),
  );
}

function assessStressAssemblyReadbacksV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyStressAssemblyReadbackAssessmentV1[] {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .exactAccounting.maximumAbsoluteResidualMilliJ;
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).flatMap(([grid, projection]) => {
      const metricById = new Map(
        projection.physicalMetrics.map((metric) => [
          metric.metricId,
          metric.valueMilliJ,
        ]),
      );
      const residualById = new Map(
        projection.algebraicResiduals.map((residual) => [
          residual.residualId,
          residual.valueMilliJ,
        ]),
      );
      return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map(
        (wallId) => {
          const total = metricById.get(`wall.${wallId}.stress-work.total`);
          const landActive = metricById.get(
            `wall.${wallId}.stress-work.land-active`,
          );
          const equilibriumPassive = metricById.get(
            `wall.${wallId}.stress-work.equilibrium-passive`,
          );
          const parallelSls = metricById.get(
            `wall.${wallId}.stress-work.parallel-sls`,
          );
          const reported =
            residualById.get(`wall.${wallId}.stress-assembly`) ?? null;
          const finite =
            reported !== null &&
            [
              reported,
              total,
              landActive,
              equilibriumPassive,
              parallelSls,
            ].every((value) => value !== undefined && Number.isFinite(value));
          const recomputed = finite
            ? total! - landActive! - equilibriumPassive! - parallelSls!
            : null;
          const readbackDifference =
            recomputed === null ? null : reported - recomputed;
          return Object.freeze({
            grid,
            wallId,
            reportedResidualMilliJ: reported,
            recomputedResidualMilliJ: recomputed,
            residualReadbackDifferenceMilliJ: readbackDifference,
            passed:
              readbackDifference !== null &&
              Math.abs(readbackDifference) <= tolerance,
          });
        },
      );
    }),
  );
}

function assessSlsBalanceReadbacksV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySlsBalanceReadbackAssessmentV1[] {
  const tolerance = exactToleranceMilliJV1();
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).flatMap(([grid, projection]) => {
      const residualById = new Map(
        projection.algebraicResiduals.map((entry) => [
          entry.residualId,
          entry.valueMilliJ,
        ]),
      );
      return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map(
        (wallId) => {
          const reported =
            residualById.get(`wall.${wallId}.parallel-sls.reported-balance`) ??
            null;
          const reconstructed =
            residualById.get(
              `wall.${wallId}.parallel-sls.reconstructed-balance`,
            ) ?? null;
          const readback =
            residualById.get(
              `wall.${wallId}.parallel-sls.readback-agreement`,
            ) ?? null;
          const finite = [reported, reconstructed, readback].every(
            (value) => value !== null && Number.isFinite(value),
          );
          const recomputed = finite ? reconstructed! - reported! : null;
          const difference =
            recomputed === null ? null : readback! - recomputed;
          return Object.freeze({
            grid,
            wallId,
            reportedBalanceResidualMilliJ: reported,
            reconstructedBalanceResidualMilliJ: reconstructed,
            reportedReadbackAgreementResidualMilliJ: readback,
            recomputedReadbackAgreementResidualMilliJ: recomputed,
            differenceMilliJ: difference,
            passed: difference !== null && Math.abs(difference) <= tolerance,
          });
        },
      );
    }),
  );
}

function assessNumericalAggregateReadbacksV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateReadbackAssessmentV1[] {
  const tolerance = exactToleranceMilliJV1();
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).map(([grid, projection]) => {
      const metrics = physicalMetricMapV1(projection);
      const residuals = new Map(
        projection.algebraicResiduals.map((entry) => [
          entry.residualId,
          entry.valueMilliJ,
        ]),
      );
      const slsWork = metrics.get(
        "aggregate.all-five.stress-work.parallel-sls",
      );
      const slsStored = metrics.get(
        "aggregate.all-five.parallel-sls-stored-energy-change",
      );
      const slsPhysical = metrics.get(
        "aggregate.all-five.sls-physical-dissipation",
      );
      const reconstructedResiduals =
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map(
          (wallId) =>
            residuals.get(`wall.${wallId}.parallel-sls.reconstructed-balance`),
        );
      const passiveWork = metrics.get(
        "aggregate.all-five.stress-work.equilibrium-passive",
      );
      const passiveStored = metrics.get(
        "aggregate.all-five.equilibrium-passive-stored-energy-change",
      );
      const finiteSls =
        [slsWork, slsStored, slsPhysical].every(
          (value) => value !== undefined && Number.isFinite(value),
        ) &&
        reconstructedResiduals.every(
          (value) => value !== undefined && Number.isFinite(value),
        );
      const finitePassive = [passiveWork, passiveStored].every(
        (value) => value !== undefined && Number.isFinite(value),
      );
      const recomputedSls = finiteSls
        ? slsWork! -
          slsStored! -
          slsPhysical! -
          reconstructedResiduals.reduce<number>((sum, value) => sum + value!, 0)
        : null;
      const recomputedPassive = finitePassive
        ? passiveWork! - passiveStored!
        : null;
      const reportedSls =
        projection.allFiveSlsBackwardEulerNumericalDissipationMilliJ;
      const reportedPassive =
        projection.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ;
      const slsDifference =
        recomputedSls === null ||
        reportedSls === null ||
        !Number.isFinite(reportedSls)
          ? null
          : reportedSls - recomputedSls;
      const passiveDifference =
        recomputedPassive === null ||
        reportedPassive === null ||
        !Number.isFinite(reportedPassive)
          ? null
          : reportedPassive - recomputedPassive;
      return Object.freeze({
        grid,
        reportedSlsBackwardEulerNumericalDissipationMilliJ: reportedSls,
        recomputedSlsBackwardEulerNumericalDissipationMilliJ: recomputedSls,
        slsDifferenceMilliJ: slsDifference,
        reportedEquilibriumPassiveBackwardEulerRemainderMilliJ: reportedPassive,
        recomputedEquilibriumPassiveBackwardEulerRemainderMilliJ:
          recomputedPassive,
        equilibriumPassiveDifferenceMilliJ: passiveDifference,
        passed:
          slsDifference !== null &&
          passiveDifference !== null &&
          Math.abs(slsDifference) <= tolerance &&
          Math.abs(passiveDifference) <= tolerance,
      });
    }),
  );
}

function assessConjugacyPhysicalVectorBindingsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyPhysicalVectorBindingAssessmentV1[] {
  const tolerance = exactToleranceMilliJV1();
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).flatMap(([grid, projection]) => {
      const metrics = physicalMetricMapV1(projection);
      const conjugacy = new Map(
        projection.conjugacy.map((entry) => [entry.aggregateId, entry]),
      );
      return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1.map(
        (aggregateId) => {
          const entry = conjugacy.get(aggregateId) ?? null;
          const expected = conjugacyPhysicalTermsV1(aggregateId, metrics);
          const reportedWall = entry?.wallWorkMilliJ ?? null;
          const reportedCavity = entry?.cavityWorkMilliJ ?? null;
          const reportedResidual = entry?.residualMilliJ ?? null;
          const wallDifference = exactDifferenceV1(
            reportedWall,
            expected.wallWorkMilliJ,
          );
          const cavityDifference = exactDifferenceV1(
            reportedCavity,
            expected.cavityWorkMilliJ,
          );
          const residualDifference = exactDifferenceV1(
            reportedResidual,
            expected.residualMilliJ,
          );
          return Object.freeze({
            grid,
            aggregateId,
            reportedWallWorkMilliJ: reportedWall,
            physicalVectorWallWorkMilliJ: expected.wallWorkMilliJ,
            wallWorkDifferenceMilliJ: wallDifference,
            reportedCavityWorkMilliJ: reportedCavity,
            physicalVectorCavityWorkMilliJ: expected.cavityWorkMilliJ,
            cavityWorkDifferenceMilliJ: cavityDifference,
            reportedResidualMilliJ: reportedResidual,
            physicalVectorResidualMilliJ: expected.residualMilliJ,
            residualDifferenceMilliJ: residualDifference,
            passed: [
              wallDifference,
              cavityDifference,
              residualDifference,
            ].every((value) => value !== null && Math.abs(value) <= tolerance),
          });
        },
      );
    }),
  );
}

function assessQuadraturePhysicalVectorBindingsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadraturePhysicalVectorBindingAssessmentV1[] {
  const tolerance = exactToleranceMilliJV1();
  return Object.freeze(
    (
      [
        ["coarse", coarse],
        ["fine", fine],
      ] as const
    ).flatMap(([grid, projection]) => {
      const metrics = physicalMetricMapV1(projection);
      const bridges = new Map(
        projection.quadratureBridges.map((entry) => [entry.chamber, entry]),
      );
      return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1.map(
        (chamber) => {
          const reported =
            bridges.get(chamber)?.backwardEulerCavityWorkOnWallMilliJ ?? null;
          const physical =
            metrics.get(`cavity.${chamber}.work-on-wall`) ?? null;
          const difference = exactDifferenceV1(reported, physical);
          return Object.freeze({
            grid,
            chamber,
            reportedBackwardEulerCavityWorkOnWallMilliJ: reported,
            physicalVectorCavityWorkOnWallMilliJ: physical,
            differenceMilliJ: difference,
            passed: difference !== null && Math.abs(difference) <= tolerance,
          });
        },
      );
    }),
  );
}

function physicalMetricMapV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): ReadonlyMap<string, number> {
  return new Map(
    projection.physicalMetrics.map((entry) => [
      entry.metricId,
      entry.valueMilliJ,
    ]),
  );
}

function conjugacyPhysicalTermsV1(
  aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyAggregateIdV1,
  metrics: ReadonlyMap<string, number>,
): Readonly<{
  wallWorkMilliJ: number | null;
  cavityWorkMilliJ: number | null;
  residualMilliJ: number | null;
}> {
  const wallMetricId =
    aggregateId === "left-atrium"
      ? "wall.LA.stress-work.total"
      : aggregateId === "right-atrium"
        ? "wall.RA.stress-work.total"
        : aggregateId === "ventricles-combined"
          ? "aggregate.ventricular-walls.stress-work.total"
          : "aggregate.all-five.stress-work.total";
  const cavityMetricIds =
    aggregateId === "left-atrium"
      ? ["cavity.LA.work-on-wall"]
      : aggregateId === "right-atrium"
        ? ["cavity.RA.work-on-wall"]
        : aggregateId === "ventricles-combined"
          ? ["cavity.LV.work-on-wall", "cavity.RV.work-on-wall"]
          : [
              "cavity.LA.work-on-wall",
              "cavity.LV.work-on-wall",
              "cavity.RA.work-on-wall",
              "cavity.RV.work-on-wall",
            ];
  const wall = metrics.get(wallMetricId);
  const cavities = cavityMetricIds.map((id) => metrics.get(id));
  if (
    wall === undefined ||
    !Number.isFinite(wall) ||
    cavities.some((value) => value === undefined || !Number.isFinite(value))
  ) {
    return Object.freeze({
      wallWorkMilliJ: wall ?? null,
      cavityWorkMilliJ: null,
      residualMilliJ: null,
    });
  }
  const cavity = cavities.reduce<number>((sum, value) => sum + value!, 0);
  return Object.freeze({
    wallWorkMilliJ: wall,
    cavityWorkMilliJ: cavity,
    residualMilliJ: wall - cavity,
  });
}

function exactDifferenceV1(
  reported: number | null,
  recomputed: number | null,
): number | null {
  return reported === null ||
    recomputed === null ||
    !Number.isFinite(reported) ||
    !Number.isFinite(recomputed)
    ? null
    : reported - recomputed;
}

function exactToleranceMilliJV1(): number {
  return MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
    .exactAccounting.maximumAbsoluteResidualMilliJ;
}

function compareNumericalAggregateV1(
  coarseMilliJ: number | null,
  fineMilliJ: number | null,
  minimumAllowedMilliJ: number,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyNumericalAggregateComparisonV1 {
  const finiteAndNonnegative =
    coarseMilliJ !== null &&
    fineMilliJ !== null &&
    Number.isFinite(coarseMilliJ) &&
    Number.isFinite(fineMilliJ) &&
    coarseMilliJ >= minimumAllowedMilliJ &&
    fineMilliJ >= minimumAllowedMilliJ;
  const strictlyDecreased = finiteAndNonnegative && fineMilliJ < coarseMilliJ;
  return Object.freeze({
    coarseMilliJ,
    fineMilliJ,
    minimumAllowedMilliJ,
    finiteAndNonnegative,
    strictlyDecreased,
    passed: finiteAndNonnegative && strictlyDecreased,
  });
}

function compareConjugacyV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyComparisonV1[] {
  const coarseById = new Map(
    coarse.conjugacy.map((entry) => [entry.aggregateId, entry]),
  );
  const fineById = new Map(
    fine.conjugacy.map((entry) => [entry.aggregateId, entry]),
  );
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1.finiteIncrementConjugacy;
  return Object.freeze(
    policy.requiredAggregateIds.map((aggregateId) => {
      const coarseEntry = coarseById.get(aggregateId) ?? null;
      const fineEntry = fineById.get(aggregateId) ?? null;
      const coarseValues = conjugacyValuesV1(coarseEntry);
      const fineValues = conjugacyValuesV1(fineEntry);
      const absoluteResidualTrend = conjugacyTrendV1(
        coarseValues.residualMilliJ,
        fineValues.residualMilliJ,
      );
      return Object.freeze({
        aggregateId,
        coarse: coarseValues,
        fine: fineValues,
        absoluteResidualTrend,
        finePassed:
          fineValues.scaledResidual !== null &&
          fineValues.scaledResidual <= policy.maximumFineScaledResidual &&
          fineValues.readbackPassed,
      });
    }),
  );
}

function conjugacyValuesV1(
  entry: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyProjectionV1 | null,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyComparisonV1["coarse"] {
  if (
    entry === null ||
    ![entry.residualMilliJ, entry.wallWorkMilliJ, entry.cavityWorkMilliJ].every(
      Number.isFinite,
    )
  ) {
    return Object.freeze({
      residualMilliJ: entry?.residualMilliJ ?? null,
      wallWorkMilliJ: entry?.wallWorkMilliJ ?? null,
      cavityWorkMilliJ: entry?.cavityWorkMilliJ ?? null,
      recomputedResidualMilliJ: null,
      residualReadbackDifferenceMilliJ: null,
      scaledResidual: null,
      readbackPassed: false,
    });
  }
  const recomputedResidualMilliJ =
    entry.wallWorkMilliJ - entry.cavityWorkMilliJ;
  const residualReadbackDifferenceMilliJ =
    entry.residualMilliJ - recomputedResidualMilliJ;
  const readbackPassed =
    Math.abs(residualReadbackDifferenceMilliJ) <=
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .exactAccounting.maximumAbsoluteResidualMilliJ;
  const denominator = Math.max(
    Math.abs(entry.wallWorkMilliJ),
    Math.abs(entry.cavityWorkMilliJ),
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .finiteIncrementConjugacy.denominatorFloorMilliJ,
  );
  return Object.freeze({
    residualMilliJ: entry.residualMilliJ,
    wallWorkMilliJ: entry.wallWorkMilliJ,
    cavityWorkMilliJ: entry.cavityWorkMilliJ,
    recomputedResidualMilliJ,
    residualReadbackDifferenceMilliJ,
    scaledResidual: Math.abs(entry.residualMilliJ) / denominator,
    readbackPassed,
  });
}

function conjugacyTrendV1(
  coarseResidualMilliJ: number | null,
  fineResidualMilliJ: number | null,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyTrendV1 {
  if (
    coarseResidualMilliJ === null ||
    fineResidualMilliJ === null ||
    !Number.isFinite(coarseResidualMilliJ) ||
    !Number.isFinite(fineResidualMilliJ)
  )
    return "not-assessable";
  const coarseMagnitude = Math.abs(coarseResidualMilliJ);
  const fineMagnitude = Math.abs(fineResidualMilliJ);
  return fineMagnitude < coarseMagnitude
    ? "decreased"
    : fineMagnitude > coarseMagnitude
      ? "increased"
      : "equal";
}

function assessAlgebraicResidualsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualAssessmentV1[] {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .exactAccounting.maximumAbsoluteResidualMilliJ;
  return Object.freeze(
    (
      [
        ["coarse", coarse.algebraicResiduals],
        ["fine", fine.algebraicResiduals],
      ] as const
    ).flatMap(([grid, residuals]) =>
      residuals.map((residual) =>
        Object.freeze({
          grid,
          residualId: residual.residualId,
          valueMilliJ: residual.valueMilliJ,
          reportedPassed: residual.passed,
          passed:
            residual.passed &&
            Number.isFinite(residual.valueMilliJ) &&
            Math.abs(residual.valueMilliJ) <= tolerance,
        }),
      ),
    ),
  );
}

function assessQuadratureBridgesV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeAssessmentV1[] {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ADMISSION_POLICY_V1
      .quadratureBridge.maximumAbsoluteResidualMilliJ;
  return Object.freeze(
    (
      [
        ["coarse", coarse.quadratureBridges],
        ["fine", fine.quadratureBridges],
      ] as const
    ).flatMap(([grid, bridges]) =>
      bridges.map((bridge) => {
        const finite = [
          bridge.backwardEulerCavityWorkOnWallMilliJ,
          bridge.trapezoidalExternalWorkMilliJ,
          bridge.endpointCorrectionMilliJ,
          bridge.residualMilliJ,
        ].every(Number.isFinite);
        const recomputedResidualMilliJ = finite
          ? bridge.backwardEulerCavityWorkOnWallMilliJ +
            bridge.trapezoidalExternalWorkMilliJ -
            bridge.endpointCorrectionMilliJ
          : null;
        const residualReadbackDifferenceMilliJ =
          recomputedResidualMilliJ === null
            ? null
            : recomputedResidualMilliJ - bridge.residualMilliJ;
        return Object.freeze({
          grid,
          chamber: bridge.chamber,
          reportedResidualMilliJ: finite ? bridge.residualMilliJ : null,
          recomputedResidualMilliJ,
          residualReadbackDifferenceMilliJ,
          reportedPassed: bridge.passed,
          passed:
            bridge.passed &&
            finite &&
            Math.abs(bridge.residualMilliJ) <= tolerance &&
            Math.abs(recomputedResidualMilliJ!) <= tolerance &&
            Math.abs(residualReadbackDifferenceMilliJ!) <= tolerance,
        });
      }),
    ),
  );
}

function allSingleArmGatesPassedV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  return Object.values(projection.gates).every((passed) => passed);
}

function validPerStepSlsResidualEvidenceV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  const evidence = projection.perStepSlsResidualEvidence;
  return (
    Number.isSafeInteger(evidence.assessedAcceptedStepCount) &&
    evidence.assessedAcceptedStepCount > 0 &&
    evidence.assessedAcceptedStepCount ===
      projection.measurementAcceptedStepCount &&
    Number.isSafeInteger(evidence.assessedWallStepCount) &&
    evidence.assessedWallStepCount ===
      evidence.assessedAcceptedStepCount *
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.length &&
    Number.isFinite(
      evidence.maximumAbsoluteReconstructedResidualDensityJPerM3,
    ) &&
    evidence.maximumAbsoluteReconstructedResidualDensityJPerM3 >= 0 &&
    Number.isFinite(
      evidence.maximumAbsoluteReadbackAgreementResidualDensityJPerM3,
    ) &&
    evidence.maximumAbsoluteReadbackAgreementResidualDensityJPerM3 >= 0 &&
    Number.isFinite(evidence.maximumReconstructedResidualToleranceRatio) &&
    evidence.maximumReconstructedResidualToleranceRatio >= 0 &&
    evidence.maximumReconstructedResidualToleranceRatio <= 1 &&
    Number.isFinite(evidence.maximumReadbackAgreementToleranceRatio) &&
    evidence.maximumReadbackAgreementToleranceRatio >= 0 &&
    evidence.maximumReadbackAgreementToleranceRatio <= 1
  );
}

function validCycleAndAcceptedStepLineageV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  const positiveSafeInteger = (value: number | null): value is number =>
    value !== null && Number.isSafeInteger(value) && value > 0;
  return (
    positiveSafeInteger(projection.sourceCycleIndex) &&
    positiveSafeInteger(projection.bridgeCycleIndex) &&
    positiveSafeInteger(projection.measurementCycleIndex) &&
    projection.bridgeCycleIndex === projection.sourceCycleIndex + 1 &&
    projection.measurementCycleIndex === projection.sourceCycleIndex + 2 &&
    positiveSafeInteger(projection.sourceAcceptedStepCount) &&
    positiveSafeInteger(projection.bridgeAcceptedStepCount) &&
    positiveSafeInteger(projection.measurementAcceptedStepCount)
  );
}

function exactConjugacyVectorV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  return exactUniqueIdSetV1(
    projection.conjugacy.map(({ aggregateId }) => aggregateId),
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CONJUGACY_AGGREGATE_IDS_V1,
  );
}

function exactQuadratureVectorV1(
  projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  return exactUniqueIdSetV1(
    projection.quadratureBridges.map(({ chamber }) => chamber),
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_QUADRATURE_CHAMBERS_V1,
  );
}

function validMatchingAlgebraicResidualVectorsV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
): boolean {
  const coarseIds = coarse.algebraicResiduals.map(
    ({ residualId }) => residualId,
  );
  const fineIds = fine.algebraicResiduals.map(({ residualId }) => residualId);
  const requiredIds =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_ALGEBRAIC_RESIDUAL_IDS_V1;
  return (
    exactUniqueIdSetV1(coarseIds, requiredIds) &&
    exactUniqueIdSetV1(fineIds, requiredIds) &&
    sameUniqueIdSetV1(coarseIds, fineIds) &&
    [...coarse.algebraicResiduals, ...fine.algebraicResiduals].every(
      ({ valueMilliJ }) => Number.isFinite(valueMilliJ),
    )
  );
}

function exactUniqueIdSetV1(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    expected.every((id) => actual.includes(id))
  );
}

function sameUniqueIdSetV1(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    new Set(left).size === left.length &&
    new Set(right).size === right.length &&
    left.every((id) => right.includes(id))
  );
}

function validSha256V1(value: string | null): value is string {
  return value !== null && /^[0-9a-f]{64}$/.test(value);
}

function failureReasonsV1(
  gates: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionGatesV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionFailureReasonV1[] {
  const reasons: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionFailureReasonV1[] =
    [];
  const add = (
    passed: boolean,
    reason: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionFailureReasonV1,
  ) => {
    if (!passed) reasons.push(reason);
  };
  add(gates.nominalStepPairMatches, "nominal-step-pair-mismatch");
  add(gates.bothNormalDefaultArms, "required-normal-default-arm-missing");
  add(
    gates.bothCanonicalEvidenceExecutions,
    "canonical-execution-purpose-missing",
  );
  add(
    gates.bothWorkRefinementNumericalAccesses,
    "work-refinement-numerical-access-missing",
  );
  add(
    gates.bothCanonicalRequestedHorizons,
    "canonical-requested-horizon-mismatch",
  );
  add(gates.bothIndependentColdStarts, "independent-cold-start-missing");
  add(gates.bothSingleArmQualified, "single-arm-qualification-failed");
  add(gates.allSingleArmGatesPassed, "single-arm-gate-failed");
  add(gates.modelConditionIdentitiesValid, "model-condition-identity-invalid");
  add(gates.modelConditionIdentitiesMatch, "model-condition-identities-differ");
  add(gates.protocolIdentitiesValid, "protocol-identity-invalid");
  add(gates.protocolIdentitiesDistinct, "protocol-identities-not-distinct");
  add(
    gates.bothCanonicalPeriod1Established,
    "canonical-period1-not-established",
  );
  add(
    gates.bothAcceptedPathLineagesComplete,
    "accepted-path-lineage-incomplete",
  );
  add(
    gates.bothCycleAndAcceptedStepLineagesValid,
    "cycle-or-accepted-step-lineage-invalid",
  );
  add(
    gates.bothCheckpointExactParitiesPassed,
    "checkpoint-exact-parity-failed",
  );
  add(gates.sourceCheckpointHashesValid, "source-checkpoint-hash-invalid");
  add(
    gates.bridgeTerminalSampleHashesValid,
    "bridge-terminal-sample-hash-invalid",
  );
  add(gates.terminalCheckpointHashesValid, "terminal-checkpoint-hash-invalid");
  add(gates.rawMechanicalTraceHashesValid, "raw-mechanical-trace-hash-invalid");
  add(
    gates.materialVolumeBindingHashesValid,
    "material-volume-binding-hash-invalid",
  );
  add(gates.materialVolumeBindingsMatch, "material-volume-bindings-differ");
  add(gates.physicalMetricVectorsComplete, "physical-metric-vector-incomplete");
  add(gates.physicalMetricIdsMatch, "physical-metric-ids-differ");
  add(gates.physicalMetricValuesFinite, "physical-metric-value-nonfinite");
  add(
    gates.aggregatePhysicalMetricSumsPassed,
    "aggregate-physical-metric-sum-mismatch",
  );
  add(
    gates.stressAssemblyResidualReadbacksPassed,
    "stress-assembly-residual-readback-mismatch",
  );
  add(gates.slsBalanceResidualReadbacksPassed, "sls-balance-readback-mismatch");
  add(
    gates.numericalAggregateScalarReadbacksPassed,
    "numerical-aggregate-scalar-readback-mismatch",
  );
  add(
    gates.physicalRefinementThresholdPassed,
    "physical-refinement-threshold-failed",
  );
  add(gates.physicalSignAgreementPassed, "physical-sign-agreement-failed");
  add(
    gates.slsBackwardEulerNumericalDissipationFiniteAndNonnegative,
    "sls-be-numerical-dissipation-invalid",
  );
  add(
    gates.slsBackwardEulerNumericalDissipationStrictlyDecreased,
    "sls-be-numerical-dissipation-not-decreased",
  );
  add(
    gates.equilibriumPassiveBackwardEulerRemainderFiniteAndNonnegative,
    "equilibrium-passive-be-remainder-invalid",
  );
  add(
    gates.equilibriumPassiveBackwardEulerRemainderStrictlyDecreased,
    "equilibrium-passive-be-remainder-not-decreased",
  );
  add(
    gates.perStepSlsResidualEvidenceValid,
    "per-step-sls-residual-evidence-invalid",
  );
  add(gates.conjugacyVectorsComplete, "conjugacy-vector-incomplete");
  add(gates.conjugacyValuesFinite, "conjugacy-value-nonfinite");
  add(
    gates.conjugacyResidualReadbacksPassed,
    "conjugacy-residual-readback-mismatch",
  );
  add(
    gates.conjugacyPhysicalVectorBindingsPassed,
    "conjugacy-physical-vector-binding-mismatch",
  );
  add(gates.fineConjugacyThresholdPassed, "fine-conjugacy-threshold-failed");
  add(gates.algebraicResidualVectorsValid, "algebraic-residual-vector-invalid");
  add(gates.algebraicResidualsPassed, "algebraic-residual-threshold-failed");
  add(
    gates.quadratureBridgeVectorsComplete,
    "quadrature-bridge-vector-incomplete",
  );
  add(gates.quadratureBridgeValuesFinite, "quadrature-bridge-value-nonfinite");
  add(
    gates.quadraturePhysicalVectorBindingsPassed,
    "quadrature-physical-vector-binding-mismatch",
  );
  add(gates.quadratureBridgesPassed, "quadrature-bridge-failed");
  return Object.freeze(reasons);
}
