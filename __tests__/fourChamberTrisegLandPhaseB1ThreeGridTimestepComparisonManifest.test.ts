import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalizeJson,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeCommittedCycleMechanicalEnergyAuditV1";
import {
  PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1BackwardEulerCommittedIntervalLedgerV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBePeriodicConvergenceV1";
import {
  PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1,
  assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1,
  phaseB1NormalSinusBeThreeGridTimestepComparisonManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1";

const EXPECTED_MANIFEST_SHA256 =
  "e067078d52e4ed5d289996cee0ace2b1ff8f26ef90e94e8c4c5b5783c7af7de6";

describe("four-chamber Phase B1 three-grid timestep comparison manifest", () => {
  const manifest =
    buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
      sha256Hex: sha256,
    });
  const policy = manifest.comparisonPolicy;

  it("freezes the existing 1/0.5/0.25 ms protocol before any result", () => {
    expect(policy).toBe(
      PHASE_B1_NORMAL_SINUS_BE_THREE_GRID_TIMESTEP_COMPARISON_POLICY_V1,
    );
    expect(policy.gridInventory).toEqual([
      {
        role: "coarse",
        nominalDtSec: 0.001,
        halvingLevel: 0,
        nominalIntervalCountPerCycle: 800,
        nominalSampleCountIncludingCycleStart: 801,
      },
      {
        role: "medium",
        nominalDtSec: 0.0005,
        halvingLevel: 1,
        nominalIntervalCountPerCycle: 1600,
        nominalSampleCountIncludingCycleStart: 1601,
      },
      {
        role: "fine",
        nominalDtSec: 0.00025,
        halvingLevel: 2,
        nominalIntervalCountPerCycle: 3200,
        nominalSampleCountIncludingCycleStart: 3201,
      },
    ]);
    expect(policy.gridInventory.map((grid) => grid.nominalDtSec)).toEqual(
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
    );
    expect(manifest.bindings.periodicSupportedNominalDtSec).toBe(
      PHASE_B1_NORMAL_SINUS_BE_PERIODIC_SUPPORTED_DT_SEC_V1,
    );
    expect(policy.adjacentRefinementRatio).toBe(2);
    expect(policy.slsModeOrder).toEqual(["off", "on"]);
    expect(policy.unlikeSlsTopologiesComparedForTimestepError).toBe(false);
  });

  it("closes the 100-scalar fine-pair inventory in canonical orders", () => {
    const comparison = policy.majorScalarComparison;
    expect(comparison.finePair).toEqual({
      candidateGridRole: "medium",
      referenceGridRole: "fine",
    });
    expect(comparison.maximumNormalizedDistanceTolerance).toBe(0.01);
    expect(comparison.comparisonOperator).toBe("strict-less-than");
    expect(comparison.everyDeclaredScalarMustPass).toBe(true);
    expect(comparison.postResultScalarSelectionAllowed).toBe(false);
    expect(comparison.inventory.expectedScalarCount).toBe(100);
    const inventory = comparison.inventory;
    expect(
      inventory.compartmentVolumeExtrema.scalarCount
      + inventory.compartmentAbsolutePressureExtrema.scalarCount
      + inventory.closedLoopEdgeIntegratedFlow.scalarCount
      + inventory.valvePeakFlow.scalarCount
      + inventory.ventricularVolumeDerived.scalarCount
      + inventory.wallFiberLogStrainExtrema.scalarCount
      + inventory.wallActiveKirchhoffStressExtrema.scalarCount
      + inventory.septalSignedCurvatureExtrema.scalarCount
      + inventory.septalMidwallVolumeExtrema.scalarCount
      + inventory.junctionRadiusExtrema.scalarCount
      + inventory.pericardialExcessPressureExtrema.scalarCount,
    ).toBe(inventory.expectedScalarCount);
    expect(inventory.compartmentVolumeExtrema.compartmentOrder).toEqual([
      "LA", "LV", "SA", "SV", "RA", "RV", "PA", "PV",
    ]);
    expect(inventory.closedLoopEdgeIntegratedFlow.edgeOrder).toEqual([
      "Q_PV", "Q_MV", "Q_AoV", "Q_sys",
      "Q_VC", "Q_TV", "Q_PuV", "Q_pul",
    ]);
    expect(inventory.closedLoopEdgeIntegratedFlow.componentOrder).toEqual([
      "cycle-mean-signed-flow", "forward-volume", "regurgitant-volume",
    ]);
    expect(inventory.valvePeakFlow.valveFlowOrder).toEqual([
      "Q_MV", "Q_AoV", "Q_TV", "Q_PuV",
    ]);
    expect(inventory.valvePeakFlow.componentOrder).toEqual([
      "peak-forward-flow", "peak-reverse-flow-magnitude",
    ]);
    expect(inventory.wallFiberLogStrainExtrema.wallOrder).toEqual([
      "LA", "RA", "LVFW", "SEP", "RVFW",
    ]);
    expect(inventory.wallActiveKirchhoffStressExtrema.wallOrder).toEqual([
      "LA", "RA", "LVFW", "SEP", "RVFW",
    ]);
    expect(inventory.ventricularVolumeDerived).toMatchObject({
      chamberOrder: ["LV", "RV"],
      scalarOrder: [
        "end-diastolic-volume",
        "end-systolic-volume",
        "stroke-volume",
        "ejection-fraction",
      ],
      endDiastolicVolumeDefinition:
        "maximum-cavity-volume-over-the-authenticated-extrema-sample-set",
      endSystolicVolumeDefinition:
        "minimum-cavity-volume-over-the-authenticated-extrema-sample-set",
      strokeVolumeDefinition:
        "end-diastolic-volume-minus-end-systolic-volume",
      ejectionFractionDefinition:
        "stroke-volume-divided-by-end-diastolic-volume",
    });
  });

  it("uses one fixed Newton scale registry per SLS mode without arbitrary floors", () => {
    const registry = policy.scaleRegistryContract;
    expect(registry).toMatchObject({
      registryScope: "one-canonical-registry-per-sls-mode",
      compiledBeforeAnyGridRunForThatMode: true,
      fixedBeforeRunRequired: true,
      adaptiveRescalingAllowed: false,
      sameRegistryObjectIdentityAcrossAllThreeDtWithinModeRequired: true,
      sameRegistryContentSha256AcrossAllThreeDtWithinModeRequired: true,
      crossModeRegistryObjectIdentityOrHashEqualityRequired: false,
      everyReferencedScaleMustBePositiveFinite: true,
      arbitraryOneMilliliterOrOneMillimeterMercuryFloorsAllowed: false,
      ejectionFractionScaleIsOnlyNonRegistryScale: true,
      ejectionFractionScale: 0.01,
    });
    expect(registry.flowVolumeScaleRule).toBe(
      "mode-registry.unknownScales.inertialFlowM3PerSec*cycleLengthSec",
    );
    const inventory = policy.majorScalarComparison.inventory;
    expect(inventory.compartmentVolumeExtrema.normalizationScaleSource).toBe(
      "mode-registry.unknownScales.bloodVolumeM3[compartmentId]",
    );
    expect(
      inventory.compartmentAbsolutePressureExtrema.normalizationScaleSource,
    ).toBe("mode-registry.residualScales.pressurePa");
    expect(
      inventory.closedLoopEdgeIntegratedFlow
        .meanSignedFlowNormalizationScaleSource,
    ).toBe("mode-registry.unknownScales.inertialFlowM3PerSec");
    expect(
      inventory.closedLoopEdgeIntegratedFlow
        .integratedVolumeNormalizationScaleSource,
    ).toBe(registry.flowVolumeScaleRule);
    expect(inventory.wallFiberLogStrainExtrema.normalizationScaleSource).toBe(
      "mode-registry.unknownScales.fiberLogStrain",
    );
    expect(
      inventory.wallActiveKirchhoffStressExtrema.normalizationScaleSource,
    ).toBe("mode-registry.residualScales.tissueStressByWallPa[wallId]");
    expect(
      inventory.septalSignedCurvatureExtrema.normalizationScaleSource,
    ).toBe("1/mode-registry.unknownScales.junctionRadiusM");
    expect(inventory.septalMidwallVolumeExtrema.normalizationScaleSource).toBe(
      "mode-registry.unknownScales.septalMidwallVolumeM3",
    );
    expect(inventory.junctionRadiusExtrema.normalizationScaleSource).toBe(
      "mode-registry.unknownScales.junctionRadiusM",
    );
    expect(
      inventory.pericardialExcessPressureExtrema.normalizationScaleSource,
    ).toBe("mode-registry.residualScales.pressurePa");
    expect(inventory.ventricularVolumeDerived.ejectionFractionNormalizationScale)
      .toBe(0.01);
    expect(policy.majorScalarComparison.normalizedDistance).toBe(
      "abs(candidate-reference)/(declared-mode-registry-scale+abs(reference))",
    );
    expect(
      policy.majorScalarComparison
        .sameModeRegistryObjectAndHashMustSupplyBothFinePairScales,
    ).toBe(true);
  });

  it("fixes authenticated extrema sampling and nominal-index coverage", () => {
    const sampling = policy.extremaSamplingContract;
    expect(sampling).toMatchObject({
      sampleOrder:
        "authenticated-run-initial-endpoint-followed-by-requested-segment-exit-endpoints",
      initialEndpointIncluded: true,
      everyRequestedSegmentExitEndpointIncluded: true,
      eventOnlyRequestedSegmentExitEndpointsIncluded: true,
      acceptedRetryChildEndpointsIncluded: false,
      stageSnapshotsIncluded: false,
      acceptedTransactionsUsedAsExtremaSource: false,
      endpointEvaluation: "right-continuous-same-time-level-re-evaluation",
      exactSameModelObjectForEverySampleWithinRunRequired: true,
      exactSameWallMaterialBindingObjectForEverySampleWithinRunRequired: true,
      postEventRequestedExitEvaluatedAfterCommittedEventAndAlgebraicReinitialization:
        true,
    });
    expect(sampling.nominalGridCoverage).toEqual({
      indexDomain: "all-integers-from-0-through-N-inclusive",
      observationIndexField: "sample.nominalGridIndex",
      initialObservationNominalIndex: 0,
      nominalOrCoalescedRequestedSegmentMapping:
        "sample.nominalGridIndex=segment.nominalGridIndex+1",
      coalescedEventAndNominalBoundaryUsesNominalMapping: true,
      eventOnlyRequestedSegmentMapping: {
        rawUpcomingNominalGridIndexRetainedForDiagnostics: true,
        sampleNominalGridIndex: null,
        rawUpcomingNominalGridIndexClaimsCoverage: false,
      },
      NSource: "grid.nominalIntervalCountPerCycle",
      coverageIndexSource: "mapped-observation-nominal-indices",
      everyNominalIndexPresentExactlyOnce: true,
      missingNominalIndexAllowed: false,
      duplicateNominalIndexAllowed: false,
      eventOnlyExtraEndpointsMustBeExplicitlyClassified: true,
      eventOnlyExtraEndpointsDoNotOwnANominalIndex: true,
      runEndNominalBoundaryUsesNominalMapping: true,
    });
  });

  it("uses an absolute 0.05 mL/beat fallback only for near-zero regurgitation", () => {
    const nearZero = policy.nearZeroRegurgitantVolumeComparison;
    expect(nearZero.fineReferenceNearZeroRule).toBe(
      "fine-reference-regurgitant-volume<=near-zero-threshold",
    );
    expect(nearZero.regurgitantVolumesMustBeNonNegative).toBe(true);
    expect(nearZero.nearZeroThresholdM3PerBeat).toBe(0.05e-6);
    expect(nearZero.maximumAbsoluteDifferenceM3PerBeat).toBe(0.05e-6);
    expect(nearZero.comparisonOperator).toBe("strict-less-than");
    expect(nearZero.nonNearZeroRule).toBe(
      "abs(medium-regurgitant-volume-fine-regurgitant-volume)/abs(fine-regurgitant-volume)<0.01",
    );
    expect(nearZero.nonNearZeroRelativeTolerance).toBe(0.01);
    expect(nearZero.registryFloorAddedToNonNearZeroRelativeDenominator)
      .toBe(false);
    expect(nearZero.absoluteFallbackUsedOnlyForNearZeroFineReference).toBe(true);
  });

  it("binds all integrated-flow scalars to the authenticated BE committed ledger", () => {
    const integrated = policy.majorScalarComparison.inventory
      .closedLoopEdgeIntegratedFlow;
    expect(integrated).toMatchObject({
      sourceLedgerId:
        PHASE_B1_BACKWARD_EULER_COMMITTED_INTERVAL_LEDGER_V1_ID,
      sourceLedgerMustBeBuilderIssuedAndBoundToTheSameTerminalCapsule: true,
      sourceField:
        "terminal-capsule.committedIntervalLedger.integratedEdgeVolumeByFlow",
      quadrature:
        "backward-Euler-next-left-limit-flow-times-actual-committed-duration",
      perCommittedTransactionFormula:
        "actualCommittedDurationSec*leftLimitStep.nextEvaluation.closedLoop.allFlowsM3PerSec[flowId]",
      meanSignedFlowDefinition:
        "ledger.signedVolumeM3/comparison-policy-canonical-cycle-length-sec",
      meanSignedFlowDenominatorIsActualFloatingPointLedgerDuration: false,
      canonicalCommittedTransactionsIncludedExactlyOnce: true,
      acceptedRetryChildrenIncludedExactlyOnceThroughCommittedLedger: true,
      failedUncommittedAndSupersededAttemptsIncluded: false,
      requestedEndpointTrapezoidalOrInterpolatedQuadratureAllowed: false,
    });
  });

  it("defines an auditable circular valve trace and strict 2 ms fine-pair gate", () => {
    const timing = policy.emergentValveTimingComparison;
    expect(timing.valveFlowOrder).toEqual([
      "Q_MV", "Q_AoV", "Q_TV", "Q_PuV",
    ]);
    expect(timing.eventOrderWithinValve).toEqual([
      "main-signed-forward-flow-lobe-opening",
      "main-signed-forward-flow-lobe-closing",
    ]);
    expect(timing.expectedTimingScalarCount).toBe(8);
    expect(timing.finePair).toEqual({
      candidateGridRole: "medium",
      referenceGridRole: "fine",
    });
    expect(timing.maximumAbsoluteTimingDifferenceSec).toBe(0.002);
    expect(timing.comparisonOperator).toBe("strict-less-than");
    expect(timing.missingOrUnbracketedMainLobeAccepted).toBe(false);
    expect(timing.semantics).toContain("not-leaflet-state");
    expect(timing.cycleBoundaryTreatment).toContain("circular-phase");
    expect(timing.traceSource).toBe(
      "authenticated-terminal-cycle-requested-segment-exit-endpoints-only",
    );
    expect(timing.initialEndpointIncludedInCircularTrace).toBe(false);
    expect(timing.finalRequestedExitRephasedToCyclePhaseZero).toBe(true);
    expect(timing.duplicateInitialPhaseEndpointInserted).toBe(false);
    expect(timing.exactEventSplitRequestedExitsIncluded).toBe(true);
    expect(timing.peakTieEquality).toBe("exact-binary64-equality");
    expect(timing.equalPeakAcrossDisjointPositiveLobesAccepted).toBe(false);
    expect(timing.equalPeakAcrossDisjointPositiveLobesClassification).toBe(
      "ambiguous-main-lobe",
    );
    expect(timing.equalPeakWithinSelectedLobeTieBreak).toBe(
      "earliest-cycle-phase",
    );
    expect(timing.retryChildSignAudit).toEqual({
      source: "authenticated-accepted-retry-child-endpoints-only",
      auditPartition:
        "independently-within-each-requested-segment-and-valve",
      chronologicalOrder:
        "segment-entry-followed-by-canonical-accepted-transaction-next-endpoints-followed-by-segment-exit",
      canonicalAcceptedTransactionOrderSource:
        "requestedSegment.acceptedTransactions-array-order",
      acceptedTransactionEndpointSide:
        "right-continuous-post-event-nextEndpoint",
      leftLimitEndpointAtTheSameTimeAlsoInserted: false,
      reasonLeftLimitEndpointIsNotInserted:
        "calcium-event-commit-and-triseg-reinitialization-do-not-change-inertial-valve-flow-state",
      requestedExitDeduplication:
        "exclude-the-final-accepted-transaction-nextEndpoint-because-it-is-the-requested-segment-exit",
      intermediateAcceptedEndpointDeduplication:
        "none-distinct-committed-retry-child-boundaries-are-retained-in-array-order",
      signPredicate: "q>0",
      requestedTransitionCount:
        "positive-predicate-transition-count-between-segment-entry-and-segment-exit",
      expandedTransitionCount:
        "positive-predicate-transition-count-over-entry-retry-children-exit",
      hiddenSignReversalRule:
        "expanded-transition-count>requested-transition-count",
      hiddenAdditionalPositiveLobeRule:
        "entry<=0-and-exit<=0-and-any-intermediate-retry-child-flow>0",
      circularRunBoundaryOwnedByRequestedEndpointTrace: true,
      everyRequestedSegmentAndValveMustPass: true,
      retryChildUsedInTimingTrace: false,
      retryChildUsedForCrossingInterpolation: false,
      hiddenAdditionalPositiveLobeAccepted: false,
      hiddenSignReversalAccepted: false,
      failureClassification:
        "requested-endpoint-trace-under-resolves-valve-sign-topology",
    });
  });

  it("keeps state order diagnostic and gates energy independently in both SLS modes", () => {
    expect(policy.stateAndMajorScalarOrderDiagnostics).toEqual({
      mayBeReported: true,
      acceptanceGate: false,
      minimumObservedOrderRequired: false,
      fineErrorFloorCreatesAcceptance: false,
    });
    const energy = policy.energyResidualConvergenceComparison;
    expect(energy.slsModeOrder).toEqual(["off", "on"]);
    expect(energy.eachSlsModeEvaluatedIndependently).toBe(true);
    expect(energy.bothModeLimitedGatesRequiredForCombinedPass).toBe(true);
    expect(energy.everyGridMaximumStageNormalizedResidualTolerance).toBe(1e-5);
    expect(energy.fineGridRole).toBe("fine");
    expect(energy.fineGridNominalDtSec).toBe(0.00025);
    expect(energy.fineGridCycleNormalizedResidualTolerance).toBe(1e-3);
    expect(energy.minimumObservedOrder).toBe(0.8);
    expect(energy.fineNormalizedCycleResidualFloor).toBe(1e-6);
    expect(energy.fineResidualFloorComparisonOperator).toBe(
      "strict-less-than",
    );
    expect(energy.adjacentPairOrder).toEqual([
      "coarse-to-medium", "medium-to-fine",
    ]);
    expect(energy.aggregateObservedOrder).toBe(
      "minimum-of-the-two-adjacent-observed-orders",
    );
    expect(energy.fineFloorExemptsOnlyObservedOrder).toBe(true);
    expect(energy.stageAndFineCycleGatesRemainRequiredAtFineFloor).toBe(true);
    expect(energy.zeroFineResidualClassifiedBelowFloor).toBe(true);
    expect(energy.exactFineResidualFloorExemptsObservedOrder).toBe(false);
    expect(energy.observedOrderRequiredWhenAtOrAboveFineFloor).toBe(true);
    expect(energy.atOrAboveFineFloorAllThreeCycleResidualsMustBeStrictlyPositive)
      .toBe(true);
    expect(energy.atOrAboveFineFloorBothAdjacentObservedOrdersMustPass)
      .toBe(true);
    expect(energy.acceptanceRule).toContain("fine-cycle-residual<floor");
    expect(energy.acceptanceRule).not.toContain("fine-cycle-residual<=floor");
    expect(energy.acceptanceRule).toContain("all-three-cycle-residuals>0");
    expect(energy.acceptanceRule).toContain(
      "both-adjacent-observed-orders>=minimum",
    );
    expect(energy.acceptanceRule).toContain("combined-pass-requires-both-modes");
    expect(energy.sourceAuditPolicyId).toBe(
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .policyId,
    );
    expect(energy.everyGridMaximumStageNormalizedResidualTolerance).toBe(
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .stageNormalizedResidualTolerance,
    );
    expect(energy.fineGridCycleNormalizedResidualTolerance).toBe(
      PHASE_B1_NORMAL_SINUS_BE_COMMITTED_CYCLE_MECHANICAL_ENERGY_POLICY_V1
        .quarterMillisecondCycleNormalizedResidualTolerance,
    );
    expect(energy.wholeHeartBackwardEulerEnergyAcceptanceOpened).toBe(false);
    expect(energy.cycleEnergyAcceptanceOpened).toBe(false);
    expect(energy.limitedResultGateName).toBe(
      "projectSyntheticNormalSinusSingleStartBeThreeGridEnergyConvergencePass",
    );
  });

  it("pins canonical hashes, deep freezing, and the result-free claim boundary", () => {
    const payload =
      phaseB1NormalSinusBeThreeGridTimestepComparisonManifestHashPayloadV1(
        manifest,
      );
    expect(manifest.contentSha256).toBe(sha256(canonicalizeJson(payload)));
    expect(manifest.contentSha256).toBe(EXPECTED_MANIFEST_SHA256);
    expect(manifest.bindings.comparisonPolicyContentSha256).toBe(
      sha256(canonicalizeJson(manifest.comparisonPolicy)),
    );
    expect(isDeepFrozen(manifest)).toBe(true);
    expect(Object.values(manifest.negativeClaims).every((value) => !value))
      .toBe(true);
    const {
      comparisonDefinitionFrozenBeforeNumericalResults,
      testOnly,
      ...broadClaims
    } = manifest.claimBoundary;
    expect(comparisonDefinitionFrozenBeforeNumericalResults).toBe(true);
    expect(testOnly).toBe(true);
    expect(Object.values(broadClaims).every((value) => !value)).toBe(true);
    expect(policy.resultBoundary).toMatchObject({
      terminalObservationSchemaDefinedHere: false,
      terminalObservationComposerImplementedHere: false,
      numericalRunExecutedHere: false,
      callerSuppliedPassBooleanAccepted: false,
      comparisonResultIssuedHere: false,
      stateOrMajorScalarObservedOrderUsedAsAcceptanceGate: false,
      policyMustBeBoundByCanonicalContentHashBeforeRuns: true,
      parentExpectedContentSha256BoundHere: false,
      liveParentObjectIdentityBindingDeferredToComposer: true,
    });
    expect("periodicConvergenceExpectedContentSha256" in manifest.bindings)
      .toBe(false);
  });

  it("rejects open inputs, invalid hash providers, copied manifests, and open hash records", () => {
    expect(() =>
      buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
        sha256Hex: sha256,
        timestepConvergenceAccepted: true,
      } as never)).toThrow(/must contain exactly/i);
    expect(() =>
      buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
        {} as never,
      )).toThrow(/must contain exactly/i);
    expect(() =>
      buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
        sha256Hex: null,
      } as never)).toThrow(/requires a SHA-256 provider/i);
    expect(() =>
      buildPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1({
        sha256Hex: () => "not-a-digest",
      })).toThrow(/lowercase 64-hex digest/i);

    const copied = Object.freeze({ ...manifest }) as typeof manifest;
    expect(() =>
      assertCanonicalPhaseB1NormalSinusBeThreeGridTimestepComparisonManifestV1(
        copied,
      )).toThrow(/canonically built/i);
    expect(() =>
      phaseB1NormalSinusBeThreeGridTimestepComparisonManifestHashPayloadV1({
        ...manifest,
        numericalResult: true,
      } as never)).toThrow(/must contain exactly/i);
  });
});

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function isDeepFrozen(value: unknown, visited = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (visited.has(value)) return true;
  visited.add(value);
  return Object.isFrozen(value)
    && Object.values(value).every((child) => isDeepFrozen(child, visited));
}
