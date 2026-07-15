import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from
  "@/engine/myocardium/fourChamberV1/ids";
import {
  computeCanonicalSha256,
  assertCanonicalSha256,
  canonicalizeJson,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID,
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
  PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1_ID =
  "phase-b1-normal-sinus-be-three-grid-timestep-comparison-policy-v1" as const;

export const PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_MANIFEST_V1_ID =
  "phase-b1-normal-sinus-be-three-grid-timestep-comparison-manifest-v1" as const;

const FINE_PAIR_MAJOR_SCALAR_NORMALIZED_TOLERANCE = 0.01 as const;
const FINE_PAIR_VALVE_TIMING_TOLERANCE_SEC = 0.002 as const;
const OBSERVED_ORDER_MINIMUM = 0.8 as const;
const OBSERVED_ORDER_FINE_FLOOR = 1e-6 as const;
const NEAR_ZERO_REGURGITANT_VOLUME_M3 = 0.05e-6 as const;

const GRID_INVENTORY = deepFreeze([
  {
    role: "coarse" as const,
    nominalDtSec: 0.001 as const,
    halvingLevel: 0 as const,
    nominalIntervalCountPerCycle: 800 as const,
    nominalSampleCountIncludingCycleStart: 801 as const,
  },
  {
    role: "medium" as const,
    nominalDtSec: 0.0005 as const,
    halvingLevel: 1 as const,
    nominalIntervalCountPerCycle: 1600 as const,
    nominalSampleCountIncludingCycleStart: 1601 as const,
  },
  {
    role: "fine" as const,
    nominalDtSec: 0.00025 as const,
    halvingLevel: 2 as const,
    nominalIntervalCountPerCycle: 3200 as const,
    nominalSampleCountIncludingCycleStart: 3201 as const,
  },
] as const);

const EXTREMA_ORDER = Object.freeze(["minimum", "maximum"] as const);
const VALVE_FLOW_ORDER = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);

const MAJOR_SCALAR_INVENTORY = deepFreeze({
  inventoryRule:
    "closed-cartesian-inventory-in-the-declared-orders-with-no-post-result-selection" as const,
  expectedScalarCount: 100 as const,
  compartmentVolumeExtrema: {
    compartmentOrder: Object.freeze([...BLOOD_COMPARTMENT_IDS] as const),
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 16 as const,
    unit: "m3" as const,
    normalizationScaleSource:
      "mode-registry.unknownScales.bloodVolumeM3[compartmentId]" as const,
  },
  compartmentAbsolutePressureExtrema: {
    compartmentOrder: Object.freeze([...BLOOD_COMPARTMENT_IDS] as const),
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 16 as const,
    unit: "Pa" as const,
    normalizationScaleSource:
      "mode-registry.residualScales.pressurePa" as const,
  },
  closedLoopEdgeIntegratedFlow: {
    edgeOrder: Object.freeze([
      ...FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
    ] as const),
    componentOrder: Object.freeze([
      "cycle-mean-signed-flow",
      "forward-volume",
      "regurgitant-volume",
    ] as const),
    scalarCount: 24 as const,
    meanSignedFlowUnit: "m3/s" as const,
    meanSignedFlowNormalizationScaleSource:
      "mode-registry.unknownScales.inertialFlowM3PerSec" as const,
    integratedVolumeUnit: "m3/beat" as const,
    integratedVolumeNormalizationScaleSource:
      "mode-registry.unknownScales.inertialFlowM3PerSec*cycleLengthSec" as const,
    sourceLedgerId:
      PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID,
    sourceLedgerMustBeBuilderIssuedAndBoundToTheSameTerminalCapsule:
      true as const,
    sourceField:
      "terminal-capsule.committedIntervalLedger.integratedEdgeVolumeByFlow" as const,
    quadrature:
      "backward-Euler-next-left-limit-flow-times-actual-committed-duration" as const,
    perCommittedTransactionFormula:
      "actualCommittedDurationSec*leftLimitStep.nextEvaluation.closedLoop.allFlowsM3PerSec[flowId]" as const,
    meanSignedFlowDefinition:
      "ledger.signedVolumeM3/comparison-policy-canonical-cycle-length-sec" as const,
    meanSignedFlowDenominatorIsActualFloatingPointLedgerDuration:
      false as const,
    forwardVolumeDefinition:
      "sum(actualCommittedDurationSec*max(next-left-limit-flow,0))" as const,
    regurgitantVolumeDefinition:
      "sum(actualCommittedDurationSec*max(-next-left-limit-flow,0))" as const,
    canonicalCommittedTransactionsIncludedExactlyOnce: true as const,
    acceptedRetryChildrenIncludedExactlyOnceThroughCommittedLedger:
      true as const,
    failedUncommittedAndSupersededAttemptsIncluded: false as const,
    requestedEndpointTrapezoidalOrInterpolatedQuadratureAllowed:
      false as const,
  },
  valvePeakFlow: {
    valveFlowOrder: VALVE_FLOW_ORDER,
    componentOrder: Object.freeze([
      "peak-forward-flow",
      "peak-reverse-flow-magnitude",
    ] as const),
    scalarCount: 8 as const,
    unit: "m3/s" as const,
    normalizationScaleSource:
      "mode-registry.unknownScales.inertialFlowM3PerSec" as const,
  },
  ventricularVolumeDerived: {
    chamberOrder: Object.freeze(["LV", "RV"] as const),
    scalarOrder: Object.freeze([
      "end-diastolic-volume",
      "end-systolic-volume",
      "stroke-volume",
      "ejection-fraction",
    ] as const),
    scalarCount: 8 as const,
    endDiastolicVolumeDefinition:
      "maximum-cavity-volume-over-the-authenticated-extrema-sample-set" as const,
    endSystolicVolumeDefinition:
      "minimum-cavity-volume-over-the-authenticated-extrema-sample-set" as const,
    strokeVolumeDefinition:
      "end-diastolic-volume-minus-end-systolic-volume" as const,
    ejectionFractionDefinition:
      "stroke-volume-divided-by-end-diastolic-volume" as const,
    volumeUnit: "m3" as const,
    volumeNormalizationScaleSource:
      "mode-registry.unknownScales.bloodVolumeM3[chamberId]" as const,
    ejectionFractionUnit: "1" as const,
    ejectionFractionNormalizationScale: 0.01 as const,
  },
  wallFiberLogStrainExtrema: {
    wallOrder: Object.freeze([...WALL_IDS] as const),
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 10 as const,
    unit: "1" as const,
    normalizationScaleSource:
      "mode-registry.unknownScales.fiberLogStrain" as const,
  },
  wallActiveKirchhoffStressExtrema: {
    wallOrder: Object.freeze([...WALL_IDS] as const),
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 10 as const,
    unit: "Pa" as const,
    normalizationScaleSource:
      "mode-registry.residualScales.tissueStressByWallPa[wallId]" as const,
  },
  septalSignedCurvatureExtrema: {
    wallId: "SEP" as const,
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 2 as const,
    unit: "1/m" as const,
    normalizationScaleSource:
      "1/mode-registry.unknownScales.junctionRadiusM" as const,
  },
  septalMidwallVolumeExtrema: {
    coordinateId: "V_m_S" as const,
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 2 as const,
    unit: "m3" as const,
    normalizationScaleSource:
      "mode-registry.unknownScales.septalMidwallVolumeM3" as const,
  },
  junctionRadiusExtrema: {
    coordinateId: "y_m" as const,
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 2 as const,
    unit: "m" as const,
    normalizationScaleSource:
      "mode-registry.unknownScales.junctionRadiusM" as const,
  },
  pericardialExcessPressureExtrema: {
    scalarId: "pericardium.excessPressurePa" as const,
    extremaOrder: EXTREMA_ORDER,
    scalarCount: 2 as const,
    unit: "Pa" as const,
    normalizationScaleSource:
      "mode-registry.residualScales.pressurePa" as const,
  },
});

export const PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1 =
  deepFreeze({
    policyId:
      PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1_ID,
    status: "pre-result-comparison-definition-only" as const,
    rhythm: "normal-sinus-project-synthetic" as const,
    integrationMethod: "backward-Euler" as const,
    slsModeOrder: Object.freeze(["off", "on"] as const),
    unlikeSlsTopologiesComparedForTimestepError: false as const,
    eachSlsTopologyMustPassIndependently: true as const,
    cycleLengthSec:
      PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1,
    gridInventory: GRID_INVENTORY,
    adjacentRefinementRatio: 2 as const,
    gridInventoryMustExactlyMatchPeriodicSupportedInventory: true as const,
    scaleRegistryContract: {
      registryScope: "one-canonical-registry-per-sls-mode" as const,
      compiledBeforeAnyGridRunForThatMode: true as const,
      fixedBeforeRunRequired: true as const,
      adaptiveRescalingAllowed: false as const,
      sameRegistryObjectIdentityAcrossAllThreeDtWithinModeRequired:
        true as const,
      sameRegistryContentSha256AcrossAllThreeDtWithinModeRequired:
        true as const,
      crossModeRegistryObjectIdentityOrHashEqualityRequired: false as const,
      everyReferencedScaleMustBePositiveFinite: true as const,
      arbitraryOneMilliliterOrOneMillimeterMercuryFloorsAllowed:
        false as const,
      ejectionFractionScaleIsOnlyNonRegistryScale: true as const,
      ejectionFractionScale: 0.01 as const,
      algebraicAndInertialFlowOutputsUseTheSameFlowUnknownScale:
        true as const,
      flowVolumeScaleRule:
        "mode-registry.unknownScales.inertialFlowM3PerSec*cycleLengthSec" as const,
    },
    phaseAlignment: {
      absoluteCycleIndexExcluded: true as const,
      comparisonCoordinate: "phase-within-terminal-supercycle" as const,
      nominalSamplesLocatedByIntegerGridIndex: true as const,
      floatingPointTimeToleranceLookupAllowed: false as const,
      interpolationOfStateOrMajorScalarSamplesAllowed: false as const,
    },
    extremaSamplingContract: {
      sampleOrder:
        "authenticated-run-initial-endpoint-followed-by-requested-segment-exit-endpoints" as const,
      initialEndpointIncluded: true as const,
      everyRequestedSegmentExitEndpointIncluded: true as const,
      eventOnlyRequestedSegmentExitEndpointsIncluded: true as const,
      acceptedRetryChildEndpointsIncluded: false as const,
      stageSnapshotsIncluded: false as const,
      acceptedTransactionsUsedAsExtremaSource: false as const,
      endpointEvaluation:
        "right-continuous-same-time-level-re-evaluation" as const,
      exactSameModelObjectForEverySampleWithinRunRequired: true as const,
      exactSameWallMaterialBindingObjectForEverySampleWithinRunRequired:
        true as const,
      postEventRequestedExitEvaluatedAfterCommittedEventAndAlgebraicReinitialization:
        true as const,
      nominalGridCoverage: {
        indexDomain: "all-integers-from-0-through-N-inclusive" as const,
        observationIndexField: "sample.nominalGridIndex" as const,
        initialObservationNominalIndex: 0 as const,
        nominalOrCoalescedRequestedSegmentMapping:
          "sample.nominalGridIndex=segment.nominalGridIndex+1" as const,
        coalescedEventAndNominalBoundaryUsesNominalMapping: true as const,
        eventOnlyRequestedSegmentMapping: {
          rawUpcomingNominalGridIndexRetainedForDiagnostics: true as const,
          sampleNominalGridIndex: null,
          rawUpcomingNominalGridIndexClaimsCoverage: false as const,
        },
        NSource: "grid.nominalIntervalCountPerCycle" as const,
        coverageIndexSource:
          "mapped-observation-nominal-indices" as const,
        everyNominalIndexPresentExactlyOnce: true as const,
        missingNominalIndexAllowed: false as const,
        duplicateNominalIndexAllowed: false as const,
        eventOnlyExtraEndpointsMustBeExplicitlyClassified: true as const,
        eventOnlyExtraEndpointsDoNotOwnANominalIndex: true as const,
        runEndNominalBoundaryUsesNominalMapping: true as const,
      },
    },
    majorScalarComparison: {
      inventory: MAJOR_SCALAR_INVENTORY,
      finePair: Object.freeze({
        candidateGridRole: "medium" as const,
        referenceGridRole: "fine" as const,
      }),
      normalizedDistance:
        "abs(candidate-reference)/(declared-mode-registry-scale+abs(reference))" as const,
      maximumNormalizedDistanceTolerance:
        FINE_PAIR_MAJOR_SCALAR_NORMALIZED_TOLERANCE,
      comparisonOperator: "strict-less-than" as const,
      everyDeclaredScalarMustPass: true as const,
      normalizationScalesFixedBeforeNumericalRuns: true as const,
      sameModeRegistryObjectAndHashMustSupplyBothFinePairScales:
        true as const,
      postResultScalarSelectionAllowed: false as const,
    },
    nearZeroRegurgitantVolumeComparison: {
      appliesOnlyTo:
        "fine-pair-valve-regurgitant-volume-components" as const,
      fineReferenceNearZeroRule:
        "fine-reference-regurgitant-volume<=near-zero-threshold" as const,
      regurgitantVolumesMustBeNonNegative: true as const,
      nearZeroThresholdM3PerBeat: NEAR_ZERO_REGURGITANT_VOLUME_M3,
      maximumAbsoluteDifferenceM3PerBeat: NEAR_ZERO_REGURGITANT_VOLUME_M3,
      comparisonOperator: "strict-less-than" as const,
      nonNearZeroRule:
        "abs(medium-regurgitant-volume-fine-regurgitant-volume)/abs(fine-regurgitant-volume)<0.01" as const,
      nonNearZeroRelativeTolerance:
        FINE_PAIR_MAJOR_SCALAR_NORMALIZED_TOLERANCE,
      registryFloorAddedToNonNearZeroRelativeDenominator: false as const,
      absoluteFallbackUsedOnlyForNearZeroFineReference: true as const,
    },
    emergentValveTimingComparison: {
      valveFlowOrder: VALVE_FLOW_ORDER,
      eventOrderWithinValve: Object.freeze([
        "main-signed-forward-flow-lobe-opening",
        "main-signed-forward-flow-lobe-closing",
      ] as const),
      expectedTimingScalarCount: 8 as const,
      semantics:
        "emergent-main-signed-flow-lobe-boundary-not-leaflet-state-or-prescribed-event" as const,
      traceSource:
        "authenticated-terminal-cycle-requested-segment-exit-endpoints-only" as const,
      initialEndpointIncludedInCircularTrace: false as const,
      finalRequestedExitRephasedToCyclePhaseZero: true as const,
      duplicateInitialPhaseEndpointInserted: false as const,
      exactEventSplitRequestedExitsIncluded: true as const,
      positiveForwardFlowRule: "q>0" as const,
      mainLobeSelection:
        "circular-contiguous-positive-lobe-containing-the-maximum-positive-flow" as const,
      peakTieEquality: "exact-binary64-equality" as const,
      equalPeakAcrossDisjointPositiveLobesAccepted: false as const,
      equalPeakAcrossDisjointPositiveLobesClassification:
        "ambiguous-main-lobe" as const,
      equalPeakWithinSelectedLobeTieBreak: "earliest-cycle-phase" as const,
      openingBracket: "q-left<=0-and-q-right>0" as const,
      closingBracket: "q-left>0-and-q-right<=0" as const,
      crossingInterpolation:
        "linear-chord-between-the-two-bracketing-authenticated-endpoints" as const,
      retryChildSignAudit: {
        source:
          "authenticated-accepted-retry-child-endpoints-only" as const,
        auditPartition:
          "independently-within-each-requested-segment-and-valve" as const,
        chronologicalOrder:
          "segment-entry-followed-by-canonical-accepted-transaction-next-endpoints-followed-by-segment-exit" as const,
        canonicalAcceptedTransactionOrderSource:
          "requestedSegment.acceptedTransactions-array-order" as const,
        acceptedTransactionEndpointSide:
          "right-continuous-post-event-nextEndpoint" as const,
        leftLimitEndpointAtTheSameTimeAlsoInserted: false as const,
        reasonLeftLimitEndpointIsNotInserted:
          "calcium-event-commit-and-triseg-reinitialization-do-not-change-inertial-valve-flow-state" as const,
        requestedExitDeduplication:
          "exclude-the-final-accepted-transaction-nextEndpoint-because-it-is-the-requested-segment-exit" as const,
        intermediateAcceptedEndpointDeduplication:
          "none-distinct-committed-retry-child-boundaries-are-retained-in-array-order" as const,
        signPredicate: "q>0" as const,
        requestedTransitionCount:
          "positive-predicate-transition-count-between-segment-entry-and-segment-exit" as const,
        expandedTransitionCount:
          "positive-predicate-transition-count-over-entry-retry-children-exit" as const,
        hiddenSignReversalRule:
          "expanded-transition-count>requested-transition-count" as const,
        hiddenAdditionalPositiveLobeRule:
          "entry<=0-and-exit<=0-and-any-intermediate-retry-child-flow>0" as const,
        circularRunBoundaryOwnedByRequestedEndpointTrace: true as const,
        everyRequestedSegmentAndValveMustPass: true as const,
        retryChildUsedInTimingTrace: false as const,
        retryChildUsedForCrossingInterpolation: false as const,
        hiddenAdditionalPositiveLobeAccepted: false as const,
        hiddenSignReversalAccepted: false as const,
        failureClassification:
          "requested-endpoint-trace-under-resolves-valve-sign-topology" as const,
      },
      cycleBoundaryTreatment: "circular-phase-on-[0,cycle-length)" as const,
      timingDistance:
        "minimum-circular-absolute-phase-distance" as const,
      missingOrUnbracketedMainLobeAccepted: false as const,
      finePair: Object.freeze({
        candidateGridRole: "medium" as const,
        referenceGridRole: "fine" as const,
      }),
      maximumAbsoluteTimingDifferenceSec:
        FINE_PAIR_VALVE_TIMING_TOLERANCE_SEC,
      comparisonOperator: "strict-less-than" as const,
      everyDeclaredTimingScalarMustPass: true as const,
    },
    stateAndMajorScalarOrderDiagnostics: {
      mayBeReported: true as const,
      acceptanceGate: false as const,
      minimumObservedOrderRequired: false as const,
      fineErrorFloorCreatesAcceptance: false as const,
    },
    energyResidualConvergenceComparison: {
      slsModeOrder: Object.freeze(["off", "on"] as const),
      eachSlsModeEvaluatedIndependently: true as const,
      bothModeLimitedGatesRequiredForCombinedPass: true as const,
      sourceAuditPolicyId:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .policyId,
      sourceCycleResidual:
        "official-cycle-balance-normalized-residual" as const,
      sourceStageResidual:
        "maximum-derived-stage-normalized-residual" as const,
      everyGridMaximumStageNormalizedResidualTolerance:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .stageNormalizedResidualTolerance,
      everyGridStageComparisonOperator: "strict-less-than" as const,
      fineGridRole: "fine" as const,
      fineGridNominalDtSec:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .quarterMillisecondNominalDtSec,
      fineGridCycleNormalizedResidualTolerance:
        PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
          .quarterMillisecondCycleNormalizedResidualTolerance,
      fineGridCycleComparisonOperator: "strict-less-than" as const,
      adjacentPairOrder: Object.freeze([
        "coarse-to-medium",
        "medium-to-fine",
      ] as const),
      adjacentObservedOrderFormula:
        "log(coarser-normalized-cycle-residual/finer-normalized-cycle-residual)/log(2)" as const,
      aggregateObservedOrder:
        "minimum-of-the-two-adjacent-observed-orders" as const,
      minimumObservedOrder: OBSERVED_ORDER_MINIMUM,
      minimumObservedOrderComparisonOperator:
        "greater-than-or-equal" as const,
      fineNormalizedCycleResidualFloor: OBSERVED_ORDER_FINE_FLOOR,
      fineResidualFloorComparisonOperator: "strict-less-than" as const,
      acceptanceRule:
        "for-each-sls-mode:every-grid-stage-residual<stage-tolerance-and-fine-cycle-residual<fine-tolerance-and-(fine-cycle-residual<floor-or-(all-three-cycle-residuals>0-and-both-adjacent-observed-orders>=minimum));combined-pass-requires-both-modes" as const,
      zeroFineResidualClassifiedBelowFloor: true as const,
      exactFineResidualFloorExemptsObservedOrder: false as const,
      fineFloorExemptsOnlyObservedOrder: true as const,
      stageAndFineCycleGatesRemainRequiredAtFineFloor: true as const,
      observedOrderRequiredWhenAtOrAboveFineFloor: true as const,
      atOrAboveFineFloorAllThreeCycleResidualsMustBeStrictlyPositive:
        true as const,
      atOrAboveFineFloorBothAdjacentObservedOrdersMustPass: true as const,
      limitedResultGateName:
        "projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass" as const,
      wholeHeartBackwardEulerEnergyAcceptanceOpened: false as const,
      cycleEnergyAcceptanceOpened: false as const,
    },
    resultBoundary: {
      terminalObservationSchemaDefinedHere: false as const,
      terminalObservationComposerImplementedHere: false as const,
      numericalRunExecutedHere: false as const,
      callerSuppliedPassBooleanAccepted: false as const,
      comparisonResultIssuedHere: false as const,
      stateOrMajorScalarObservedOrderUsedAsAcceptanceGate: false as const,
      policyMustBeBoundByCanonicalContentHashBeforeRuns: true as const,
      parentExpectedContentSha256BoundHere: false as const,
      liveParentObjectIdentityBindingDeferredToComposer: true as const,
    },
  });

const CLAIM_BOUNDARY = deepFreeze({
  comparisonDefinitionFrozenBeforeNumericalResults: true as const,
  canonicalPeriodicParentOrTerminalEvidenceAuthenticatedHere: false as const,
  terminalObservationImplemented: false as const,
  terminalCyclesExecuted: false as const,
  singleStartPeriodOneEstablished: false as const,
  timestepConvergenceEstablished: false as const,
  limitedProjectSyntheticThreeGridEnergyConvergenceEstablished: false as const,
  cycleEnergyAcceptanceEstablished: false as const,
  multiStartAcceptanceEstablished: false as const,
  perturbationAcceptanceEstablished: false as const,
  physiologicalValidationEstablished: false as const,
  phaseB1AcceptanceEstablished: false as const,
  modelCoreIntegrationEstablished: false as const,
  browserRuntimeAdoptionEstablished: false as const,
  releaseRuntimeReachable: false as const,
  testOnly: true as const,
});

const CANONICAL_MANIFESTS = new WeakSet<object>();

export type PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestPayloadV1 =
  Readonly<{
    manifestId:
      typeof PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_MANIFEST_V1_ID;
    status:
      "pre-result-three-grid-comparison-definition-not-numerical-evidence";
    evidenceClass:
      "project-synthetic-periodic-timestep-comparison-policy-manifest";
    bindings: Readonly<{
      periodicConvergenceDefinitionId:
        typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID;
      normalSinusEventScheduleId:
        typeof PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID;
      periodicSupportedNominalDtSec:
        typeof PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1;
      comparisonPolicyContentSha256: string;
      policyAndSupportedGridInventoryExactMatch: true;
    }>;
    comparisonPolicy:
      typeof PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1;
    negativeClaims: Readonly<{
      numericalTerminalObservationEvidenceBuilt: false;
      numericalThreeGridComparisonExecuted: false;
      singleStartPeriodOneAccepted: false;
      timestepConvergenceAccepted: false;
      projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass:
        false;
      fullBeatAccepted: false;
      cycleEnergyAccepted: false;
      normalSinusMultiStartAccepted: false;
      perturbationEnvelopeAccepted: false;
      physiologicalValidation: false;
      phaseB1Acceptance: false;
      modelCoreIntegration: false;
      browserRuntimeAdopted: false;
      releaseRuntimeReachable: false;
    }>;
    claimBoundary: typeof CLAIM_BOUNDARY;
  }>;

export type PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1 =
  PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestPayloadV1 &
  Readonly<{
    hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
    contentSha256: string;
  }>;

export type BuildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestInputV1 =
  Readonly<{
    sha256Hex: CanonicalSha256HexProvider;
  }>;

export function buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
  input: BuildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestInputV1,
): PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1 {
  assertExactPlainRecordV1(
    input,
    ["sha256Hex"],
    "Phase B1 three-grid timestep comparison manifest input",
  );
  if (typeof input.sha256Hex !== "function") {
    throw new Error(
      "Phase B1 three-grid timestep comparison manifest requires a SHA-256 provider",
    );
  }
  const policyContentSha256 = computeCanonicalSha256(
    PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1,
    input.sha256Hex,
  );
  const payload = deepFreeze<
    PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestPayloadV1
  >({
    manifestId:
      PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_MANIFEST_V1_ID,
    status:
      "pre-result-three-grid-comparison-definition-not-numerical-evidence",
    evidenceClass:
      "project-synthetic-periodic-timestep-comparison-policy-manifest",
    bindings: {
      periodicConvergenceDefinitionId:
        PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID,
      normalSinusEventScheduleId:
        PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID,
      periodicSupportedNominalDtSec:
        PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
      comparisonPolicyContentSha256: policyContentSha256,
      policyAndSupportedGridInventoryExactMatch: true,
    },
    comparisonPolicy:
      PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1,
    negativeClaims: {
      numericalTerminalObservationEvidenceBuilt: false,
      numericalThreeGridComparisonExecuted: false,
      singleStartPeriodOneAccepted: false,
      timestepConvergenceAccepted: false,
      projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass:
        false,
      fullBeatAccepted: false,
      cycleEnergyAccepted: false,
      normalSinusMultiStartAccepted: false,
      perturbationEnvelopeAccepted: false,
      physiologicalValidation: false,
      phaseB1Acceptance: false,
      modelCoreIntegration: false,
      browserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
    },
    claimBoundary: CLAIM_BOUNDARY,
  });
  const manifest = deepFreeze<
    PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1
  >({
    ...payload,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
  CANONICAL_MANIFESTS.add(manifest);
  return validatePhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
    manifest,
    input.sha256Hex,
  );
}

export function assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
  value: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
): PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1 {
  if (
    value === null
    || typeof value !== "object"
    || !CANONICAL_MANIFESTS.has(value)
  ) {
    throw new Error(
      "Phase B1 three-grid timestep comparison manifest must be canonically built in this process",
    );
  }
  return value;
}

export function validatePhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
  value: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1 {
  const manifest =
    assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
      value,
    );
  if (typeof sha256Hex !== "function") {
    throw new Error("three-grid manifest validation requires a SHA-256 provider");
  }
  assertExactPlainRecordV1(manifest, [
    "manifestId",
    "status",
    "evidenceClass",
    "bindings",
    "comparisonPolicy",
    "negativeClaims",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 three-grid timestep comparison manifest");
  if (
    manifest.manifestId
      !== PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_MANIFEST_V1_ID
    || manifest.hashAlgorithm !== NORMATIVE_MANIFEST_HASH_ALGORITHM
    || manifest.bindings.periodicConvergenceDefinitionId
      !== PHASE_B1_NORMAL_SINUS_BE_PERIODIC_CONVERGENCE_DEFINITION_V1_ID
    || manifest.bindings.normalSinusEventScheduleId
      !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_EVENT_SCHEDULE_V1_ID
  ) {
    throw new Error("Phase B1 three-grid timestep manifest identity drifted");
  }
  assertCanonicalSha256(
    phaseB1NormalSinusBeThreeGridTimestepComparisonManifestHashPayloadV1(
      manifest,
    ),
    manifest.contentSha256,
    sha256Hex,
  );
  if (
    manifest.bindings.comparisonPolicyContentSha256
      !== computeCanonicalSha256(manifest.comparisonPolicy, sha256Hex)
    || canonicalizeJson(manifest.comparisonPolicy)
      !== canonicalizeJson(
        PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1,
      )
    || !sameNumberArray(
      manifest.bindings.periodicSupportedNominalDtSec,
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
    )
    || !sameNumberArray(
      manifest.comparisonPolicy.gridInventory.map((grid) =>
        grid.nominalDtSec),
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
    )
  ) {
    throw new Error("Phase B1 three-grid timestep policy binding drifted");
  }
  validateGridInventory(manifest.comparisonPolicy.gridInventory);
  if (
    manifest.comparisonPolicy.majorScalarComparison.inventory
      .expectedScalarCount !== 100
    || manifest.comparisonPolicy.emergentValveTimingComparison
      .expectedTimingScalarCount !== 8
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
    || Object.entries(manifest.claimBoundary).some(([key, value]) =>
      key === "comparisonDefinitionFrozenBeforeNumericalResults"
        || key === "testOnly"
        ? value !== true
        : value !== false)
  ) {
    throw new Error("Phase B1 three-grid timestep claim boundary drifted");
  }
  assertDeepFrozenPlainData(manifest, "three-grid manifest");
  return manifest;
}

export function phaseB1NormalSinusBeThreeGridTimestepComparisonManifestHashPayloadV1(
  value: PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
): PhaseB1NormalSinusBeThreeGridTimestepComparisonManifestPayloadV1 {
  assertExactPlainRecordV1(value, [
    "manifestId",
    "status",
    "evidenceClass",
    "bindings",
    "comparisonPolicy",
    "negativeClaims",
    "claimBoundary",
    "hashAlgorithm",
    "contentSha256",
  ], "Phase B1 three-grid timestep comparison manifest hash input");
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = value;
  return deepFreeze(payload);
}

function validateGridInventory(
  grids:
    typeof PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1.gridInventory,
): void {
  assertDensePlainArrayV1(grids, 3, "three-grid policy gridInventory");
  const expectedRoles = ["coarse", "medium", "fine"] as const;
  const expectedIntervals = [800, 1600, 3200] as const;
  for (let index = 0; index < grids.length; index += 1) {
    const grid = grids[index];
    assertExactPlainRecordV1(grid, [
      "role",
      "nominalDtSec",
      "halvingLevel",
      "nominalIntervalCountPerCycle",
      "nominalSampleCountIncludingCycleStart",
    ], `three-grid policy gridInventory[${index}]`);
    if (
      grid.role !== expectedRoles[index]
      || grid.halvingLevel !== index
      || grid.nominalIntervalCountPerCycle !== expectedIntervals[index]
      || grid.nominalSampleCountIncludingCycleStart
        !== expectedIntervals[index] + 1
      || grid.nominalDtSec * grid.nominalIntervalCountPerCycle
        !== PHASE_B1_PROJECT_SYNTHETIC_NORMAL_SINUS_CYCLE_LENGTH_SEC_V1
      || (
        index > 0
        && grids[index - 1].nominalDtSec / grid.nominalDtSec !== 2
      )
    ) {
      throw new Error("Phase B1 three-grid timestep inventory drifted");
    }
  }
}

function sameNumberArray(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => Object.is(value, right[index]));
}

function assertDeepFrozenPlainData(
  value: unknown,
  field: string,
  visited = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);
  if (!Object.isFrozen(value)) {
    throw new Error(`${field} must be deeply frozen`);
  }
  if (Array.isArray(value)) {
    assertDensePlainArrayV1(value, undefined, field);
    value.forEach((child, index) =>
      assertDeepFrozenPlainData(child, `${field}[${index}]`, visited));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${field} must contain only plain data`);
  }
  for (const [key, child] of Object.entries(value)) {
    assertDeepFrozenPlainData(child, `${field}.${key}`, visited);
  }
}

function deepFreeze<Value>(value: Value, visited = new WeakSet<object>()): Value {
  if (value === null || typeof value !== "object") return value;
  if (visited.has(value)) return value;
  visited.add(value);
  for (const child of Object.values(value)) deepFreeze(child, visited);
  return Object.freeze(value);
}
