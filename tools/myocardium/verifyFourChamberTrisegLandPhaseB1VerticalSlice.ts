import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  reconstructPhaseB1DifferentiatedStageKinematicsV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/differentiatedStageKinematicsV1";
import {
  auditPhaseB1EventFreeMonolithicGlobalJacobianV1,
  evaluatePhaseB1EventFreeEndpointV1,
  stepPhaseB1EventFreeMonolithicBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  runPhaseB1EventIntegratedMonolithicTransactionV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventIntegratedMonolithicTransactionV1";
import {
  buildPhaseB1MonolithicVerticalSliceManifestV1,
  phaseB1MonolithicVerticalSliceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/monolithicVerticalSliceManifestV1";
import {
  buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MonolithicVerticalSliceReadinessV1";
import {
  buildFourChamberPhaseB1FoundationStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ReadinessV1";
import {
  buildPhaseB1StateNewtonTopologyV1,
  phaseB1StateNewtonTopologyHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import type {
  PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1RateFreeLandFoundationManifestV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/rateFreeLandFoundationManifestV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1,
  phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticVerticalSliceCaseDescriptorV1";
import {
  PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/verticalSliceEventEvidenceFixtureV1";
import {
  auditPhaseB1WholeHeartMechanicalEnergyV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_SYNTHETIC_CASE_DESCRIPTOR_SHA256 =
  "d2fd8e854e6c520d1ea73be0b3f32005e50e2be282fee94484d2ce6e91ab1d99";
const EXPECTED_VERTICAL_SLICE_MANIFEST_SHA256 =
  "973351efd96000e1a69041eb44b41db44d2e4ecc3556005763f3d1ce672e9d69";
const EXPECTED_VERTICAL_SLICE_READINESS_SHA256 =
  "379fb468c1feba725db39465ea7c7bee24476e60e36265a6dce77bc673a82324";
const EXPECTED_FOUNDATION_MANIFEST_SHA256 =
  "fa588cd7d59169795429679eb5c4c824a8d4f68a20c8868a36ea2d950d6dfd2d";
const EXPECTED_FOUNDATION_READINESS_SHA256 =
  "e8b12dc997c4f9b159db7f6a516bc885a2a7bbb6aee8d0061f6f0a8e474949e6";

const failures: string[] = [];
const eventFixture = PHASE_B1_VERTICAL_SLICE_EVENT_EVIDENCE_FIXTURE_V1;
const descriptor = buildPhaseB1SyntheticVerticalSliceCaseDescriptorV1(sha256);
const manifest = buildPhaseB1MonolithicVerticalSliceManifestV1(
  descriptor,
  sha256,
);
const readiness = buildFourChamberPhaseB1MonolithicVerticalSliceStatusV1(
  manifest,
);
const readinessSha256 = computeCanonicalSha256(readiness, sha256);
const topology = buildPhaseB1StateNewtonTopologyV1(sha256);
const bundle = buildPhaseA1TissueManifestBundleV1(sha256);
const foundation = buildPhaseB1RateFreeLandFoundationManifestV1(
  bundle,
  sha256,
);
const foundationReadiness = buildFourChamberPhaseB1FoundationStatusV1(
  foundation,
);
const foundationReadinessSha256 = computeCanonicalSha256(
  foundationReadiness,
  sha256,
);

verifyCanonicalAndLineage();

const modeMetrics: Record<string, unknown> = {};
for (const slsMode of eventFixture.slsModes) {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const step = stepPhaseB1EventFreeMonolithicBackwardEulerV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    dtSec: manifest.eventFreeProtocol.dtSec,
  });
  if (step.converged === false) {
    failures.push(`${slsMode} event-free step failed: ${step.reason}`);
    continue;
  }
  const jacobian = auditPhaseB1EventFreeMonolithicGlobalJacobianV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    nextEndpointLeftLimit: step.nextEndpointLeftLimit,
    dtSec: manifest.eventFreeProtocol.dtSec,
  });
  const kinematics = reconstructPhaseB1DifferentiatedStageKinematicsV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    nextEndpointLeftLimit: step.nextEndpointLeftLimit,
    dtSec: manifest.eventFreeProtocol.dtSec,
  });
  const slsAudit = auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    nextEndpointLeftLimit: step.nextEndpointLeftLimit,
    dtSec: manifest.eventFreeProtocol.dtSec,
  });
  const energy = auditPhaseB1WholeHeartMechanicalEnergyV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    nextEndpointLeftLimit: step.nextEndpointLeftLimit,
    dtSec: manifest.eventFreeProtocol.dtSec,
  });
  verifyModeEvidence(slsMode, step, jacobian, kinematics, slsAudit, energy);
  verifyNonemptyEventCausality(slsMode);
  modeMetrics[slsMode] = {
    unknownCount: step.unknownCount,
    residualCount: step.residualCount,
    newtonIterations: step.newtonDiagnostics.newtonIterationCount,
    finalScaledResidualInfinityNorm:
      step.newtonDiagnostics.finalResidualInfinityNorm,
    minimumLandSimplexMargin: step.minimumLandSimplexMargin,
    totalBloodVolumeChangeM3: step.totalBloodVolumeChangeM3,
    jacobianDirectionalRelativeTwoNormDifference:
      jacobian.directionalAudit.relativeTwoNormDifference,
    minimumRequiredCrossBlockMagnitude: minimumRequiredCrossBlock(jacobian),
    differentiatedTriSegResidualInfinityNorm:
      kinematics.differentiatedConstraintResidualNPerMSec.infinityNorm,
    slsBackwardEulerIdentityRho: slsAudit.normalizedIdentityResidual,
    landAdapterMaximumRelativeWorkResidual:
      energy.landAdapterWorkClosure.maximumRelativeResidual,
    mechanicalStageEnergyRho: energy.stage.normalizedResidual,
    wholeHeartBackwardEulerDiagnosticRho:
      energy.backwardEulerDiagnostic.normalizedUnresolvedEnergyIncrement,
  };
}

verifyOrderInvariantFiveWallBatch();
verifyOverflowPreflightAndBindingBoundaries();
verifyRuntimeBoundary();
verifyClaimBoundary();

const implementationPass = failures.length === 0;
const report = {
  pass: implementationPass,
  verticalSliceImplementationPass: implementationPass,
  phaseB1MonolithicReferenceCompletePass: false,
  phaseB1AcceptancePass: false,
  supportedEnvelopePass: false,
  physiologicalValidationPass: false,
  releaseRuntimePass: false,
  hashes: {
    syntheticCaseDescriptorSha256: descriptor.contentSha256,
    verticalSliceManifestSha256: manifest.contentSha256,
    verticalSliceReadinessSha256: readinessSha256,
    foundationManifestSha256: foundation.contentSha256,
    foundationReadinessSha256,
    phaseA1TissueManifestBundleSha256: bundle.contentSha256,
    stateNewtonTopologySha256: topology.contentSha256,
    wallMaterialBindingDescriptorSha256:
      manifest.bindings.wallMaterialBindingDescriptorSha256,
    scaffoldConfigurationSha256:
      manifest.bindings.scaffoldConfigurationSha256,
    newtonScaleRegistryContentSha256:
      manifest.bindings.newtonScaleRegistryContentSha256,
    eventFreeNumericalPolicySha256:
      manifest.bindings.eventFreeNumericalPolicySha256,
    exactLandSemismoothPolicySha256:
      manifest.bindings.exactLandSemismoothPolicySha256,
    exactEventEvidenceFixtureSha256:
      manifest.bindings.exactEventEvidenceFixtureSha256,
    mechanicalEnergyAuditPolicySha256:
      manifest.bindings.mechanicalEnergyAuditPolicySha256,
    wholeHeartEnergyNormalizationSha256:
      manifest.bindings.wholeHeartEnergyNormalizationSha256,
    closedLoopParametersSha256:
      descriptor.model.closedLoopParametersSha256,
  },
  evidenceBoundary: readiness.evidenceBoundary,
  modeMetrics,
  deferred: manifest.deferred,
  negativeClaims: manifest.negativeClaims,
  failures,
};

// eslint-disable-next-line no-console
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;

function verifyCanonicalAndLineage(): void {
  if (
    computeCanonicalSha256(
      phaseB1SyntheticVerticalSliceCaseDescriptorHashPayloadV1(descriptor),
      sha256,
    ) !== descriptor.contentSha256
  ) failures.push("synthetic case descriptor hash is not canonical");
  if (
    computeCanonicalSha256(
      phaseB1MonolithicVerticalSliceManifestHashPayloadV1(manifest),
      sha256,
    ) !== manifest.contentSha256
  ) failures.push("vertical-slice manifest hash is not canonical");
  if (
    computeCanonicalSha256(
      phaseB1StateNewtonTopologyHashPayloadV1(topology),
      sha256,
    ) !== topology.contentSha256
  ) failures.push("state/Newton topology hash is not canonical");
  if (descriptor.contentSha256 !== EXPECTED_SYNTHETIC_CASE_DESCRIPTOR_SHA256) {
    failures.push("synthetic case descriptor drifted without a version update");
  }
  if (manifest.contentSha256 !== EXPECTED_VERTICAL_SLICE_MANIFEST_SHA256) {
    failures.push("vertical-slice manifest drifted without a version update");
  }
  if (readinessSha256 !== EXPECTED_VERTICAL_SLICE_READINESS_SHA256) {
    failures.push("vertical-slice readiness drifted without a version update");
  }
  if (foundation.contentSha256 !== EXPECTED_FOUNDATION_MANIFEST_SHA256) {
    failures.push("frozen foundation manifest changed");
  }
  if (foundationReadinessSha256 !== EXPECTED_FOUNDATION_READINESS_SHA256) {
    failures.push("frozen foundation readiness changed");
  }
  if (
    manifest.lineage.frozenFoundationManifestSha256
      !== EXPECTED_FOUNDATION_MANIFEST_SHA256
    || manifest.lineage.frozenFoundationReadinessSha256
      !== EXPECTED_FOUNDATION_READINESS_SHA256
  ) failures.push("vertical-slice lineage does not bind the frozen foundation");
  if (
    descriptor.bindings.stateNewtonTopologySha256 !== topology.contentSha256
    || manifest.bindings.syntheticCaseDescriptorSha256
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
  ) failures.push("vertical-slice canonical bindings disagree");
}

function verifyModeEvidence(
  slsMode: "on" | "off",
  step: Extract<
    ReturnType<typeof stepPhaseB1EventFreeMonolithicBackwardEulerV1>,
    { converged: true }
  >,
  jacobian: ReturnType<
    typeof auditPhaseB1EventFreeMonolithicGlobalJacobianV1
  >,
  kinematics: ReturnType<
    typeof reconstructPhaseB1DifferentiatedStageKinematicsV1
  >,
  slsAudit: ReturnType<
    typeof auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1
  >,
  energy: ReturnType<typeof auditPhaseB1WholeHeartMechanicalEnergyV1>,
): void {
  const expectedCount = slsMode === "on" ? 51 : 46;
  if (
    step.unknownCount !== expectedCount
    || step.residualCount !== expectedCount
    || step.calciumStoredStateCount !== 10
    || step.calciumNewtonUnknownCount !== 0
    || step.calciumResidualCount !== 0
  ) failures.push(`${slsMode} state/Newton topology drifted`);
  if (
    !(step.minimumLandSimplexMargin > 0)
    || step.newtonDiagnostics.finalResidualInfinityNorm === null
    || step.newtonDiagnostics.finalResidualInfinityNorm
      > descriptor.model.newtonScaleRegistryHashPayload.tolerances
        .globalResidualInfinityNorm
    || Math.abs(step.totalBloodVolumeChangeM3)
      >= manifest.eventFreeProtocol.totalBloodVolumeAbsoluteToleranceM3
    || step.projectionApplied
    || step.hiddenStateClippingApplied
    || step.flowClampApplied
    || step.innerLandSolveUsed
  ) failures.push(`${slsMode} event-free physical/numerical contract failed`);
  if (
    !jacobian.accepted
    || !jacobian.acceptedBaseResidualVerified
    || !jacobian.semismoothDirectionalConsistencyAuditAccepted
    || !jacobian.crossBlockNonzeroAuditAccepted
    || jacobian.directionalAudit.relativeTwoNormDifference
      >= manifest.globalJacobianProtocol.directionalRelativeTwoNormTolerance
    || jacobian.directionalRelativeTwoNormTolerance
      !== manifest.globalJacobianProtocol.directionalRelativeTwoNormTolerance
    || jacobian.crossBlocks.minimumRequiredScaledMagnitude
      !== manifest.globalJacobianProtocol.minimumRequiredScaledCrossBlockMagnitude
    || jacobian.algorithmicJacobian.scaledStep
      !== manifest.globalJacobianProtocol.constructionScaledStep
  ) failures.push(`${slsMode} semismooth Jacobian audit failed`);
  if (
    slsMode === "off"
      ? !jacobian.crossBlocks.slsBlockPhysicallyAbsent
      : jacobian.crossBlocks.slsBlockPhysicallyAbsent
  ) failures.push(`${slsMode} SLS block physical-presence contract failed`);
  if (
    !kinematics.accepted
    || kinematics.landDirectionCount !== 30
    || !kinematics
      .allThirtyLandStateRatesAssembledIntoDifferentiatedConstraintInput
    || !kinematics
      .atrialLandColumnsStructurallyZeroInTriSegEquilibriumRows
    || !kinematics.differentiatedConstraintResidualNPerMSec.accepted
    || kinematics.differentiatedConstraintResidualNPerMSec.infinityNorm
      >= descriptor.model.eventFreeNumericalPolicy
        .differentiatedTriSegConstraintResidualToleranceNPerMSec
    || kinematics.differentiatedConstraintResidualNPerMSec.tolerance
      !== descriptor.model.eventFreeNumericalPolicy
        .differentiatedTriSegConstraintResidualToleranceNPerMSec
    || kinematics.stepHalvingAudit.maximumNormalizedRateDifference
      >= descriptor.model.eventFreeNumericalPolicy
        .differentiatedKinematicsHalvingRelativeTolerance
    || kinematics.stepHalvingAudit.relativeTolerance
      !== descriptor.model.eventFreeNumericalPolicy
        .differentiatedKinematicsHalvingRelativeTolerance
    || kinematics.stepHalvingAudit.coarseDirectionalStepSec
      !== descriptor.model.eventFreeNumericalPolicy
        .differentiatedKinematicsDirectionalStepSec
  ) failures.push(`${slsMode} differentiated kinematics audit failed`);
  if (
    !slsAudit.normalizedIdentityAccepted
    || slsAudit.normalizedIdentityResidual
      >= manifest.energyEvidence.normalizedSlsIdentityTolerance
    || slsAudit.normalizedIdentityResidualTolerance
      !== manifest.energyEvidence.normalizedSlsIdentityTolerance
  ) failures.push(`${slsMode} whole-heart SLS BE identity failed`);
  if (
    !energy.correctedStageLedgerAccepted
    || !energy.landAdapterWorkClosure.accepted
    || energy.landAdapterWorkClosure.maximumRelativeResidual
      >= manifest.energyEvidence.landAdapterWorkClosureTolerance
    || energy.landAdapterWorkClosure.relativeTolerance
      !== manifest.energyEvidence.landAdapterWorkClosureTolerance
    || !energy.stage.correctedStageLedgerAccepted
    || energy.stage.normalizedResidual
      >= manifest.energyEvidence.normalizedMechanicalStageTolerance
    || energy.stage.normalizedResidualTolerance
      !== manifest.energyEvidence.normalizedMechanicalStageTolerance
    || energy.auditPolicyId
      !== manifest.energyEvidence.mechanicalEnergyAuditPolicy.policyId
    || energy.normalizationPowerFloorW
      !== manifest.energyEvidence.normalization.powerFloorW
    || energy.publishedTaylorGeometryPowerAudit.workConjugacyClaimed
    || !energy.publishedTaylorGeometryPowerTreatment.diagnosticOnly
    || !energy.publishedTaylorGeometryPowerTreatment
      .subtractedFromEnergyResidual
    || !energy.backwardEulerDiagnostic
      .diagnosticOnlyNotStageClosureOrAcceptance
    || energy.geometryWorkConjugacyAccepted
    || energy.wholeHeartBackwardEulerEnergyAcceptanceClaimed
  ) failures.push(`${slsMode} whole-heart mechanical stage audit failed`);
  if (
    slsMode === "off"
    && (
      energy.storedEnergyRateByBranchW.sls !== 0
      || energy.dissipationByBranchW.sls !== 0
    )
  ) failures.push("SLS-off mechanical audit retained SLS energy");
}

function verifyNonemptyEventCausality(slsMode: "on" | "off"): void {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const dtSec = eventFixture.dtSec;
  const first = runPhaseB1EventIntegratedMonolithicTransactionV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    endTimeSec: dtSec,
    coincidentEventsAtEnd: [calciumEvent(
      eventFixture.causalEvent.wallId,
      `${eventFixture.causalEvent.eventIdPrefix}-${slsMode}`,
      eventFixture.causalEvent.strength,
      eventFixture.causalEvent.calciumDriveTimeSec,
      eventFixture.causalEvent.timingOwner,
    )],
  });
  if (first.ok === false) {
    failures.push(`${slsMode} nonempty event transaction failed: ${first.failureStage}`);
    return;
  }
  if (
    first.coordinator.atomicStepCallCount !== 1
    || !first.coordinator.eventBatchCommitted
    || first.coordinator.algebraicReinitializationCallCount !== 1
    || first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW
      !== first.coordinator.knownFreeCalciumUMByWallAtEndLeftLimit.LVFW
  ) failures.push(`${slsMode} event transaction atomicity drifted`);
  const landAtJump = first.nextEndpoint.differentialState.landByWall.LVFW;
  const second = runPhaseB1EventIntegratedMonolithicTransactionV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: first.nextEndpoint,
    endTimeSec:
      eventFixture.causalEvent.followingIntervalEndTimeMultiplier * dtSec,
    coincidentEventsAtEnd: [],
  });
  if (second.ok === false) {
    failures.push(`${slsMode} post-event causal interval failed`);
    return;
  }
  if (
    second.leftLimitStep.nextEvaluation.freeCalciumUMByWall.LVFW
      <= first.coordinator.freeCalciumUMByWallAfterEventBatch.LVFW
    || vectorsEqual(
      second.nextEndpoint.differentialState.landByWall.LVFW,
      landAtJump,
    )
    || second.coordinator.eventBatchCommitted
    || second.coordinator.algebraicReinitializationCallCount !== 0
  ) failures.push(`${slsMode} post-jump calcium causality failed`);
}

function verifyOrderInvariantFiveWallBatch(): void {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "off",
    sha256,
  );
  const batch = eventFixture.fiveWallCanonicalBatch;
  const events = batch.wallOrder.flatMap((wallId, index) => [
    calciumEvent(
      wallId,
      `${wallId}-${batch.secondEventIdSuffix}`,
      batch.secondStrengthPerOneBasedWallIndex * (index + 1),
      eventFixture.dtSec,
      eventFixture.causalEvent.timingOwner,
    ),
    calciumEvent(
      wallId,
      `${wallId}-${batch.firstEventIdSuffix}`,
      batch.firstStrengthPerOneBasedWallIndex * (index + 1),
      eventFixture.dtSec,
      eventFixture.causalEvent.timingOwner,
    ),
  ]);
  const run = (batch: typeof events) =>
    runPhaseB1EventIntegratedMonolithicTransactionV1({
      model: candidate.model,
      wallMaterialBinding: candidate.wallMaterialBinding,
      previousEndpoint: candidate.warmStart.endpoint,
      endTimeSec: manifest.eventFreeProtocol.dtSec,
      coincidentEventsAtEnd: batch,
    });
  const forward = run(events);
  const reverseEvents = batch.reverseInputOrderCompared
    ? [...events].reverse()
    : events;
  const reverse = run(reverseEvents);
  if (forward.ok === false || reverse.ok === false) {
    failures.push("five-wall order-invariant event batch failed");
    return;
  }
  if (
    canonicalizeJson(forward.nextEndpoint)
      !== canonicalizeJson(reverse.nextEndpoint)
    || canonicalizeJson(forward.coordinator.eventKeys)
      !== canonicalizeJson(reverse.coordinator.eventKeys)
    || forward.coordinator.atomicStepCallCount !== 1
    || forward.coordinator.algebraicReinitializationCallCount !== 1
  ) failures.push("five-wall event aggregation is not canonical/atomic");
}

function verifyOverflowPreflightAndBindingBoundaries(): void {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "off",
    sha256,
  );
  const copiedBinding = Object.freeze({ ...candidate.wallMaterialBinding });
  let copyRejected = false;
  try {
    evaluatePhaseB1EventFreeEndpointV1(
      candidate.model,
      copiedBinding,
      candidate.warmStart.endpoint,
    );
  } catch {
    copyRejected = true;
  }
  if (!copyRejected) failures.push("copied wall material binding was accepted");

  let accessorReadCount = 0;
  const accessorBinding = Object.freeze(Object.defineProperty(
    { ...candidate.wallMaterialBinding },
    "runtimeByWall",
    {
      enumerable: true,
      configurable: false,
      get: () => {
        accessorReadCount += 1;
        return candidate.wallMaterialBinding.runtimeByWall;
      },
    },
  ));
  const accessorResult = runPhaseB1EventIntegratedMonolithicTransactionV1({
    model: candidate.model,
    wallMaterialBinding: accessorBinding,
    previousEndpoint: candidate.warmStart.endpoint,
    endTimeSec: manifest.eventFreeProtocol.dtSec,
    coincidentEventsAtEnd: [],
  });
  if (accessorResult.ok || accessorReadCount !== 0) {
    failures.push("accessor-forged binding was read before canonical rejection");
  }

  const overflowEndpoint = structuredClone(
    candidate.warmStart.endpoint,
  ) as PhaseB1EndpointStateV1;
  const pair = overflowEndpoint.differentialState.calciumByWall.LVFW as {
    r: number;
    d: number;
  };
  pair.r = eventFixture.overflowPreflight.startRiseDrive;
  pair.d = eventFixture.overflowPreflight.startDecayDrive;
  const overflow = runPhaseB1EventIntegratedMonolithicTransactionV1({
    model: candidate.model,
    wallMaterialBinding: candidate.wallMaterialBinding,
    previousEndpoint: overflowEndpoint,
    endTimeSec: manifest.eventFreeProtocol.dtSec,
    coincidentEventsAtEnd: [
      calciumEvent(
        eventFixture.overflowPreflight.wallId,
        eventFixture.overflowPreflight.eventId,
        eventFixture.overflowPreflight.eventStrength,
        eventFixture.dtSec,
        eventFixture.causalEvent.timingOwner,
      ),
    ],
  });
  if (overflow.ok !== false) {
    failures.push("overflow was not preflighted into immutable rollback");
  } else if (
    overflow.failureStage !== "event-batch-preparation"
    || overflow.coordinator?.atomicStepCallCount
      !== eventFixture.overflowPreflight.expectedAtomicStepCallCount
    || !overflow.rollbackSnapshotReturned
  ) failures.push("overflow was not preflighted into immutable rollback");
}

function verifyRuntimeBoundary(): void {
  const root = process.cwd();
  const phaseB1SourceRoot = join(
    root,
    "engine",
    "myocardium",
    "fourChamberV1",
    "phaseB1",
  );
  const files = typescriptFilesRecursively(join(root, "engine"))
    .filter((path) => !path.startsWith(`${phaseB1SourceRoot}${sep}`));
  const reached = files.filter((path) => {
    const source = readFileSync(path, "utf8");
    if (/fourChamberV1\/phaseB1(?:\/|["'])/.test(source)) return true;
    const specifierPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;
    for (const match of source.matchAll(specifierPattern)) {
      const specifier = match[1];
      if (!specifier?.startsWith(".")) continue;
      const resolvedSpecifier = resolve(dirname(path), specifier);
      if (
        resolvedSpecifier === phaseB1SourceRoot
        || resolvedSpecifier.startsWith(`${phaseB1SourceRoot}${sep}`)
      ) return true;
    }
    return false;
  });
  if (reached.length > 0) {
    failures.push(`Phase B1 sidecar reached runtime-facing sources: ${reached.join(",")}`);
  }
}

function verifyClaimBoundary(): void {
  if (
    eventFixture.slsModes.length !== descriptor.slsModes.length
    || eventFixture.slsModes.some(
      (mode, index) => mode !== descriptor.slsModes[index],
    )
    || !eventFixture.fiveWallCanonicalBatch.reverseInputOrderCompared
    || !eventFixture.emptyBatchRegressedInBothTopologies
    ||
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) failures.push("vertical-slice manifest claim boundary drifted");
  const gates = readiness.evidenceGates;
  if (
    !gates.phaseB1OneStepEndpointEventVerticalSliceImplementationComplete
    || !gates.phaseB1EventFreeSingleStepRegressionComplete
    || !gates.phaseB1ExactEventTransactionRegressionComplete
    || gates.phaseB1ShortHorizonAcceptanceComplete
    || gates.phaseB1TimestepConvergenceComplete
    || gates.phaseB1FullBeatAcceptanceComplete
    || gates.phaseB1AcceptanceComplete
    || gates.supportedEnvelopeComplete
    || gates.closedLoopReleaseEligible
    || gates.clinicalReleaseReady
  ) failures.push("vertical-slice readiness overclaims acceptance or release");
}

function minimumRequiredCrossBlock(
  audit: ReturnType<typeof auditPhaseB1EventFreeMonolithicGlobalJacobianV1>,
): number {
  return Math.min(...[
    audit.crossBlocks.landResidualByMechanicalGeometry,
    audit.crossBlocks.hydraulicMomentumByLandState,
    audit.crossBlocks.triSegEquilibriumByLandState,
    audit.crossBlocks.slsResidualByMechanicalGeometry,
    audit.crossBlocks.hydraulicMomentumBySlsState,
    audit.crossBlocks.triSegEquilibriumBySlsState,
  ].filter((value): value is number => value !== null));
}

function calciumEvent(
  wallId: FourChamberWallId,
  eventId: string,
  strength: number,
  calciumDriveTimeSec: number,
  timingOwner: "tissue-manifest-electrical-to-calcium-delay",
) {
  return Object.freeze({
    wallId,
    eventId,
    calciumDriveTimeSec,
    strength,
    timingOwner,
  });
}

function vectorsEqual(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): boolean {
  return left.length === right.length
    && Array.from(left).every((value, index) => value === right[index]);
}

function typescriptFilesRecursively(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    if (statSync(child).isDirectory()) return typescriptFilesRecursively(child);
    return child.endsWith(".ts") ? [child] : [];
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
