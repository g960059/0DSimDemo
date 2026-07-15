import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import {
  canonicalizeJson,
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1LandSimplexNewtonDomainV1,
  minimumPhaseB1LandSimplexMarginV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/landSimplexNewtonDomainV1";
import {
  buildFourChamberPhaseB1ProjectSyntheticShortHorizonStatusV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticShortHorizonReadinessV1";
import {
  encodePhaseB1EndpointTopologyVectorsV1,
  type PhaseB1EndpointStateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1EndpointStateV1";
import {
  buildPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1,
  phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonEvidenceManifestV1";
import {
  PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1,
  evaluatePhaseB1ProjectSyntheticTimeStepConvergenceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/projectSyntheticShortHorizonProtocolV1";
import {
  encodePhaseB1StoredDifferentialStateV1,
  type PhaseB1SlsModeV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  auditPhaseB1WholeHeartMechanicalEnergyV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartMechanicalEnergyAuditV1";
import {
  auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/wholeHeartSlsBackwardEulerAuditV1";
import {
  BLOOD_COMPARTMENT_IDS,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

const EXPECTED_SHORT_HORIZON_MANIFEST_SHA256 =
  "f6c71697bcdcefe555dabe69ad9a493d82eebd07c37acd3bf9183ad3bc2fa06c";
const EXPECTED_SHORT_HORIZON_READINESS_SHA256 =
  "dd4c2b2e45d4002c1b33be742005213349ef928989d957cb46b87ac5877d1259";

const failures: string[] = [];
const manifest =
  buildPhaseB1ProjectSyntheticShortHorizonEvidenceManifestV1(sha256);
const readiness =
  buildFourChamberPhaseB1ProjectSyntheticShortHorizonStatusV1(manifest);
const readinessSha256 = computeCanonicalSha256(readiness, sha256);

verifyManifestAndClaims();
const modeMetrics: Record<string, unknown> = {};
for (const slsMode of manifest.protocolDefinition.schedule.slsModes) {
  modeMetrics[slsMode] = verifyMode(slsMode);
}
verifyRuntimeBoundary();

const implementationPass = failures.length === 0;
const report = {
  pass: implementationPass,
  projectSyntheticShortHorizonImplementationPass: implementationPass,
  phaseB1AcceptedReferenceShortHorizonPass: false,
  phaseB1GeneralTimestepConvergencePass: false,
  wholeHeartBackwardEulerEnergyAcceptancePass: false,
  phaseB1AcceptancePass: false,
  supportedEnvelopePass: false,
  physiologicalValidationPass: false,
  releaseRuntimePass: false,
  hashes: {
    shortHorizonManifestSha256: manifest.contentSha256,
    shortHorizonReadinessSha256: readinessSha256,
    verticalSliceDescriptorSha256:
      manifest.lineage.verticalSliceDescriptorSha256,
    verticalSliceManifestSha256:
      manifest.lineage.verticalSliceManifestSha256,
    verticalSliceReadinessSha256:
      manifest.lineage.verticalSliceReadinessSha256,
    protocolDefinitionSha256:
      manifest.bindings.protocolDefinitionSha256,
    scheduleSha256: manifest.bindings.scheduleSha256,
    policySha256: manifest.bindings.policySha256,
    eventsSha256: manifest.bindings.eventsSha256,
    stateScalesSha256: manifest.bindings.stateScalesSha256,
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

function verifyManifestAndClaims(): void {
  if (
    computeCanonicalSha256(
      phaseB1ProjectSyntheticShortHorizonEvidenceManifestHashPayloadV1(
        manifest,
      ),
      sha256,
    ) !== manifest.contentSha256
  ) failures.push("short-horizon manifest hash is not canonical");
  if (manifest.contentSha256 !== EXPECTED_SHORT_HORIZON_MANIFEST_SHA256) {
    failures.push("short-horizon manifest drifted without a version update");
  }
  if (readinessSha256 !== EXPECTED_SHORT_HORIZON_READINESS_SHA256) {
    failures.push("short-horizon readiness drifted without a version update");
  }
  const protocol = manifest.protocolDefinition;
  if (
    manifest.bindings.protocolDefinitionSha256
      !== computeCanonicalSha256(protocol, sha256)
    || manifest.bindings.scheduleSha256
      !== computeCanonicalSha256(protocol.schedule, sha256)
    || manifest.bindings.policySha256
      !== computeCanonicalSha256(protocol.policy, sha256)
    || manifest.bindings.eventsSha256
      !== computeCanonicalSha256(protocol.events, sha256)
    || manifest.bindings.stateScalesSha256
      !== computeCanonicalSha256(protocol.stateScales, sha256)
  ) failures.push("short-horizon inner evidence hashes disagree");
  if (
    Object.values(manifest.implementationClaims).some((value) => value !== true)
    || Object.values(manifest.deferred).some((value) => value !== true)
    || Object.values(manifest.negativeClaims).some((value) => value !== false)
  ) failures.push("short-horizon claim boundary drifted");
  const gates = readiness.evidenceGates;
  if (
    !gates.projectSyntheticShortHorizonImplementationRegressionComplete
    || !gates.projectSyntheticThreeGridStateOrderRegressionComplete
    || gates.phaseB1AcceptedReferenceShortHorizonComplete
    || gates.phaseB1GeneralTimestepConvergenceComplete
    || gates.phaseB1WholeHeartBackwardEulerEnergyAcceptanceComplete
    || gates.phaseB1FullBeatAcceptanceComplete
    || gates.phaseB1AcceptanceComplete
    || gates.supportedEnvelopeComplete
    || gates.closedLoopReleaseEligible
    || gates.clinicalReleaseReady
  ) failures.push("short-horizon readiness overclaims acceptance or release");
}

function verifyMode(slsMode: PhaseB1SlsModeV1): unknown {
  const convergence = evaluatePhaseB1ProjectSyntheticTimeStepConvergenceV1(
    slsMode,
    sha256,
  );
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const domain = buildPhaseB1LandSimplexNewtonDomainV1(slsMode);
  const scaleDescriptor = manifest.protocolDefinition.stateScales[slsMode];
  const gridMetrics: unknown[] = [];
  const successfulRuns: Array<Extract<
    (typeof convergence.runs)[number],
    { completed: true }
  >> = [];
  for (const [gridIndex, run] of convergence.runs.entries()) {
    const grid = manifest.protocolDefinition.schedule.grids[gridIndex];
    if (grid === undefined || run.completed === false) {
      failures.push(`${slsMode} grid ${gridIndex} did not complete`);
      continue;
    }
    successfulRuns.push(run);
    const initialTotalBloodVolumeM3 = totalBloodVolumeM3(run.initialEndpoint);
    let maximumAbsoluteTotalBloodVolumeResidualM3 = 0;
    let maximumAbsolutePerStepTotalBloodVolumeChangeM3 = 0;
    let minimumLandSimplexMargin = Number.POSITIVE_INFINITY;
    let maximumCorrectedStageLedgerRho = 0;
    let maximumSlsIdentityRho = 0;
    let maximumGlobalJacobianDirectionalDifference = 0;
    let eventCount = 0;
    let reinitializationCount = 0;
    if (
      run.requestedStepCount !== grid.requestedStepCount
      || run.acceptedStepCount !== grid.requestedStepCount
      || run.hiddenSubdivisionUsed
    ) failures.push(`${slsMode} ${run.dtSec} grid contract drifted`);
    for (let stepIndex = 0; stepIndex < run.steps.length; stepIndex += 1) {
      const evidence = run.steps[stepIndex];
      const transaction = evidence.transaction;
      const leftEndpoint = transaction.leftLimitStep.nextEndpointLeftLimit;
      const postEndpoint = transaction.nextEndpoint;
      const expectedEvent = evidence.endTimeSec
        === manifest.protocolDefinition.schedule.endpointEventTimeSec;
      if (
        evidence.startTimeSec !== transaction.previousEndpoint.timeSec
        || evidence.endTimeSec !== transaction.nextEndpoint.timeSec
        || evidence.eventCountAtEnd !== (expectedEvent ? 1 : 0)
        || transaction.coordinator.eventCount !== (expectedEvent ? 1 : 0)
        || transaction.algebraicReinitializationCallCount
          !== (expectedEvent ? 1 : 0)
      ) failures.push(`${slsMode} ${run.dtSec} event schedule drifted`);
      if (stepIndex > 0) {
        const previous = run.steps[stepIndex - 1];
        if (
          canonicalizeJson(transaction.previousEndpoint)
            !== canonicalizeJson(previous.transaction.nextEndpoint)
        ) failures.push(`${slsMode} ${run.dtSec} post-jump continuity drifted`);
      }
      eventCount += transaction.coordinator.eventCount;
      reinitializationCount += transaction.algebraicReinitializationCallCount;
      maximumAbsoluteTotalBloodVolumeResidualM3 = Math.max(
        maximumAbsoluteTotalBloodVolumeResidualM3,
        Math.abs(totalBloodVolumeM3(leftEndpoint) - initialTotalBloodVolumeM3),
        Math.abs(totalBloodVolumeM3(postEndpoint) - initialTotalBloodVolumeM3),
      );
      maximumAbsolutePerStepTotalBloodVolumeChangeM3 = Math.max(
        maximumAbsolutePerStepTotalBloodVolumeChangeM3,
        Math.abs(
          totalBloodVolumeM3(leftEndpoint)
          - totalBloodVolumeM3(transaction.previousEndpoint),
        ),
        Math.abs(
          totalBloodVolumeM3(postEndpoint)
          - totalBloodVolumeM3(transaction.previousEndpoint),
        ),
      );
      const topology = encodePhaseB1EndpointTopologyVectorsV1(leftEndpoint);
      const rawUnknown = [
        ...topology.nonCalciumDifferentialState,
        ...topology.algebraicState,
      ];
      minimumLandSimplexMargin = Math.min(
        minimumLandSimplexMargin,
        minimumPhaseB1LandSimplexMarginV1(rawUnknown, domain),
      );
      const slsAudit = auditPhaseB1WholeHeartSlsBackwardEulerIdentityV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: transaction.previousEndpoint,
        nextEndpointLeftLimit: leftEndpoint,
        dtSec: run.dtSec,
      });
      const energy = auditPhaseB1WholeHeartMechanicalEnergyV1({
        model: candidate.model,
        wallMaterialBinding: candidate.wallMaterialBinding,
        previousEndpoint: transaction.previousEndpoint,
        nextEndpointLeftLimit: leftEndpoint,
        dtSec: run.dtSec,
      });
      maximumCorrectedStageLedgerRho = Math.max(
        maximumCorrectedStageLedgerRho,
        energy.stage.normalizedResidual,
      );
      maximumSlsIdentityRho = Math.max(
        maximumSlsIdentityRho,
        slsAudit.normalizedIdentityResidual,
      );
      maximumGlobalJacobianDirectionalDifference = Math.max(
        maximumGlobalJacobianDirectionalDifference,
        energy.kinematics.globalJacobianAudit.directionalAudit
          .relativeTwoNormDifference,
      );
      if (
        maximumAbsoluteTotalBloodVolumeResidualM3
          >= manifest.protocolDefinition.policy
            .totalBloodVolumeAbsoluteToleranceM3
        || maximumAbsolutePerStepTotalBloodVolumeChangeM3
          >= manifest.protocolDefinition.policy
            .totalBloodVolumeAbsoluteToleranceM3
        || !(minimumLandSimplexMargin > 0)
        || transaction.leftLimitStep.newtonDiagnostics
          .finalResidualInfinityNorm === null
        || transaction.leftLimitStep.newtonDiagnostics
          .finalResidualInfinityNorm
          >= candidate.model.newtonScaleRegistry.tolerances
            .globalResidualInfinityNorm
        || transaction.projectionApplied
        || transaction.hiddenStateClippingApplied
        || transaction.leftLimitStep.projectionApplied
        || transaction.leftLimitStep.hiddenStateClippingApplied
        || transaction.leftLimitStep.postStepBloodVolumeProjectionApplied
        || transaction.leftLimitStep.flowClampApplied
        || !slsAudit.normalizedIdentityAccepted
        || slsAudit.normalizedIdentityResidual
          >= manifest.protocolDefinition.policy.normalizedSlsIdentityTolerance
        || !energy.landAdapterWorkClosure.accepted
        || energy.landAdapterWorkClosure.maximumRelativeResidual
          >= manifest.protocolDefinition.policy.landAdapterWorkRelativeTolerance
        || !energy.kinematics.globalJacobianAudit.accepted
        || !energy.kinematics.accepted
        || !energy.correctedStageLedgerAccepted
        || !energy.stage.correctedStageLedgerAccepted
        || energy.stage.normalizedResidual
          >= manifest.protocolDefinition.policy
            .correctedStageLedgerNormalizedResidualTolerance
        || energy.dissipationByBranchW.flowTotal < 0
        || energy.dissipationByBranchW.sls < 0
        || energy.geometryWorkConjugacyAccepted
        || energy.wholeHeartBackwardEulerEnergyAcceptanceClaimed
      ) failures.push(`${slsMode} ${run.dtSec} step ${stepIndex} audit failed`);
    }
    if (eventCount !== 1 || reinitializationCount !== 1) {
      failures.push(`${slsMode} ${run.dtSec} event count drifted`);
    }
    gridMetrics.push({
      dtSec: run.dtSec,
      requestedStepCount: run.requestedStepCount,
      maximumAbsoluteTotalBloodVolumeResidualM3,
      maximumAbsolutePerStepTotalBloodVolumeChangeM3,
      minimumLandSimplexMargin,
      maximumCorrectedStageLedgerRho,
      maximumSlsIdentityRho,
      maximumGlobalJacobianDirectionalDifference,
      eventCount,
      reinitializationCount,
      maximumBackwardEulerUnresolvedEnergyIncrementJ:
        run.diagnostics.maximumAbsoluteBackwardEulerUnresolvedEnergyIncrementJ,
    });
  }
  let coarseToMediumScaledEndpointDifference: number | null = null;
  let mediumToFineScaledEndpointDifference: number | null = null;
  let observedStateOrder: number | null = null;
  if (successfulRuns.length === 3) {
    coarseToMediumScaledEndpointDifference = rawScaledEndpointDistance(
      successfulRuns[0].finalEndpoint,
      successfulRuns[1].finalEndpoint,
      scaleDescriptor.endpointScales,
    );
    mediumToFineScaledEndpointDifference = rawScaledEndpointDistance(
      successfulRuns[1].finalEndpoint,
      successfulRuns[2].finalEndpoint,
      scaleDescriptor.endpointScales,
    );
    observedStateOrder = Math.log2(
      coarseToMediumScaledEndpointDifference
      / mediumToFineScaledEndpointDifference,
    );
    if (
      !(coarseToMediumScaledEndpointDifference > 0)
      || !(mediumToFineScaledEndpointDifference > 0)
      || !Number.isFinite(observedStateOrder)
      || observedStateOrder
        < manifest.protocolDefinition.policy
          .backwardEulerObservedStateOrderThreshold
    ) failures.push(`${slsMode} raw endpoint state order failed`);
  } else {
    failures.push(`${slsMode} lacks three successful grids`);
  }
  return {
    gridMetrics,
    coarseToMediumScaledEndpointDifference,
    mediumToFineScaledEndpointDifference,
    observedStateOrder,
    stateOrderThreshold:
      PHASE_B1_PROJECT_SYNTHETIC_SHORT_HORIZON_POLICY_V1
        .backwardEulerObservedStateOrderThreshold,
  };
}

function rawScaledEndpointDistance(
  left: PhaseB1EndpointStateV1,
  right: PhaseB1EndpointStateV1,
  scales: readonly number[],
): number {
  if (
    left.timeSec !== right.timeSec
    || left.differentialState.slsMode !== right.differentialState.slsMode
  ) throw new Error("raw short-horizon endpoints are incomparable");
  const leftVector = [
    ...encodePhaseB1StoredDifferentialStateV1(left.differentialState),
    left.triSegCoordinates.V_m_S,
    left.triSegCoordinates.y_m,
  ];
  const rightVector = [
    ...encodePhaseB1StoredDifferentialStateV1(right.differentialState),
    right.triSegCoordinates.V_m_S,
    right.triSegCoordinates.y_m,
  ];
  if (leftVector.length !== scales.length || rightVector.length !== scales.length) {
    throw new Error("raw short-horizon scale topology drifted");
  }
  return Math.max(...leftVector.map((value, index) =>
    Math.abs(value - rightVector[index]) / scales[index]));
}

function totalBloodVolumeM3(endpoint: PhaseB1EndpointStateV1): number {
  return BLOOD_COMPARTMENT_IDS.reduce(
    (sum, id) => sum + endpoint.differentialState.bloodVolumesM3[id],
    0,
  );
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

function typescriptFilesRecursively(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return typescriptFilesRecursively(path);
    return stat.isFile() && /\.tsx?$/.test(path) ? [path] : [];
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
