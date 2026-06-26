import protocolDescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import {
  THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  ThickSphereSpikeV1,
  computeThickSphereSpikeParameterSetStableHash,
  thickSphereDEngineeringStrainDVolume,
  thickSphereGeometryAtVolume,
  type ThickSphereSpikeV1ParameterSet,
} from "@/engine/myocardium/kinematics/thickSphereSpikeV1";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";

export const THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY = "fixed-thick-sphere-kinematics-only";
export const THICK_SPHERE_PHASE3A_EVIDENCE_STATUS = "synthetic-geometry-closure-only";

export type ThickSpherePhase3AProtocolStatus =
  | "closure-pass"
  | "closure-fail"
  | "deferred-target";

export type ThickSpherePhase3AMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[];

export type ThickSpherePhase3AProtocolSection = {
  readonly id: string;
  readonly status: ThickSpherePhase3AProtocolStatus;
  readonly metrics: Record<string, ThickSpherePhase3AMetricValue>;
};

export type ThickSpherePhase3ASweepSample = {
  readonly cavityVolumeM3: number;
  readonly sarcomereLengthM: number;
  readonly fiberEngineeringStrain: number;
  readonly dStrainDVolume: number;
  readonly finite: boolean;
  readonly inCalibrationDomain: boolean;
};

export type ThickSpherePhase3AReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof THICK_SPHERE_PHASE3A_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly modelId: typeof THICK_SPHERE_SPIKE_V1_ID;
  readonly coordinateIds: readonly [typeof THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID];
  readonly parameterSet: {
    readonly parameterSetId: typeof THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID;
    readonly parameterSetStableHash: string;
    readonly status: "candidate";
    readonly evidenceStatus: typeof THICK_SPHERE_PHASE3A_EVIDENCE_STATUS;
    readonly midwallConvention: "arithmetic-mean-midwall-phase3a-only";
  };
  readonly sweepSamples: readonly ThickSpherePhase3ASweepSample[];
  readonly sections: readonly ThickSpherePhase3AProtocolSection[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

export function runThickSpherePhase3AKinematicsReport(
  parameterSet: ThickSphereSpikeV1ParameterSet = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
): ThickSpherePhase3AReport {
  const parameterSetStableHash = computeThickSphereSpikeParameterSetStableHash(parameterSet);
  const sweepSamples = runSweepSamples(parameterSet);
  const finiteDifferenceAudit = runFiniteDifferenceAudit(parameterSet);
  const sections: ThickSpherePhase3AProtocolSection[] = [
    runDescriptorBoundarySection(),
    runParameterProvenanceSection(parameterSet, parameterSetStableHash),
    runFormulaClosureSection(parameterSet, sweepSamples),
    runFiniteDifferenceSection(finiteDifferenceAudit),
    runSweepHealthSection(sweepSamples),
    runRateDiagnosticSection(parameterSet),
    runDeterministicReplaySection(parameterSet),
  ];
  sections.push({
    id: "deferred-owner-decisions-v1",
    status: "deferred-target",
    metrics: {
      decisionIds: protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId),
      experimentalTargets: "deferred",
      ownerAcceptanceStatus: "not-owner-acceptance",
    },
  });
  const closureSections = sections.filter((section) => section.status !== "deferred-target");
  const closurePass = closureSections.every((section) => section.status === "closure-pass");
  const hashInput = {
    parameterSetStableHash,
    sweepSamples: sweepSamples.map(compactSweepSample),
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
  };

  return {
    protocolSetId: protocolDescriptor.protocolSetId,
    claimBoundary: THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY,
    evidenceStatus: THICK_SPHERE_PHASE3A_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    modelId: THICK_SPHERE_SPIKE_V1_ID,
    coordinateIds: [THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID],
    parameterSet: {
      parameterSetId: parameterSet.parameterSetId,
      parameterSetStableHash,
      status: "candidate",
      evidenceStatus: THICK_SPHERE_PHASE3A_EVIDENCE_STATUS,
      midwallConvention: parameterSet.provenance.midwallConvention,
    },
    sweepSamples,
    sections,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

function runSweepSamples(parameterSet: ThickSphereSpikeV1ParameterSet): readonly ThickSpherePhase3ASweepSample[] {
  return sweepVolumes(parameterSet).map((cavityVolumeM3) => {
    const output = ThickSphereSpikeV1.evaluate(
      {
        coordinates: [
          {
            id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
            valueSI: cavityVolumeM3,
            previousValueSI: cavityVolumeM3,
            rateSI: 0,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: "phase3a-report" },
      },
      parameterSet,
    );
    return {
      cavityVolumeM3,
      sarcomereLengthM: output.sarcomereLengthM,
      fiberEngineeringStrain: output.fiberEngineeringStrain,
      dStrainDVolume: output.dStrainDCoordinate[0],
      finite: output.geometryHealth.finite,
      inCalibrationDomain: output.geometryHealth.inCalibrationDomain,
    };
  });
}

function runDescriptorBoundarySection(): ThickSpherePhase3AProtocolSection {
  const decisionIds = protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId);
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const ok =
    protocolDescriptor.protocolSetId === "thick-sphere-phase3a-kinematics-protocols-v1"
    && protocolDescriptor.artifact.id === "thick-sphere-phase3a-kinematics-protocols-v1"
    && protocolDescriptor.phase === "Phase 3A"
    && protocolDescriptor.claimBoundary === THICK_SPHERE_PHASE3A_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === THICK_SPHERE_PHASE3A_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && decisionIds.includes(5)
    && decisionIds.includes(19)
    && sourcePaths.includes("docs/myocardium/model-spec/myocardium-land-v1.md")
    && sourcePaths.includes("docs/myocardium/verification/myocardium-v1-verification.md")
    && sourcePaths.includes("docs/myocardium/roadmap/myocardium-rebuild-roadmap.md");
  return section("descriptor-boundary-v1", ok, {
    protocolSetId: protocolDescriptor.protocolSetId,
    artifactId: protocolDescriptor.artifact.id,
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    pendingOwnerDecisionIds: decisionIds,
  });
}

function runParameterProvenanceSection(
  parameterSet: ThickSphereSpikeV1ParameterSet,
  parameterSetStableHash: string,
): ThickSpherePhase3AProtocolSection {
  const ok =
    parameterSet.modelId === THICK_SPHERE_SPIKE_V1_ID
    && parameterSet.parameterSetId === THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID
    && parameterSet.status === "candidate"
    && parameterSet.evidenceStatus === THICK_SPHERE_PHASE3A_EVIDENCE_STATUS
    && parameterSet.productionMechanics === "not-production-mechanics"
    && parameterSet.provenance.candidateOnly
    && !parameterSet.provenance.fitToPVLoop
    && parameterSet.provenance.midwallConvention === "arithmetic-mean-midwall-phase3a-only"
    && parameterSet.parameterSetStableHash === parameterSetStableHash;
  return section("parameter-provenance-v1", ok, {
    parameterSetId: parameterSet.parameterSetId,
    parameterSetStableHash,
    status: parameterSet.status,
    evidenceStatus: parameterSet.evidenceStatus,
    candidateOnly: parameterSet.provenance.candidateOnly,
    fitToPVLoop: parameterSet.provenance.fitToPVLoop,
    midwallConvention: parameterSet.provenance.midwallConvention,
  });
}

function runFormulaClosureSection(
  parameterSet: ThickSphereSpikeV1ParameterSet,
  samples: readonly ThickSpherePhase3ASweepSample[],
): ThickSpherePhase3AProtocolSection {
  const anchorGeometry = thickSphereGeometryAtVolume(
    parameterSet.anchorCavityVolumeM3,
    parameterSet.wallReferenceVolumeM3,
  );
  const residuals = samples.map((sample) => {
    const geometry = thickSphereGeometryAtVolume(sample.cavityVolumeM3, parameterSet.wallReferenceVolumeM3);
    const expectedSarcomereLengthM =
      parameterSet.anchorSarcomereLengthM * geometry.midwallRadiusM / anchorGeometry.midwallRadiusM;
    const expectedStrain = expectedSarcomereLengthM / parameterSet.slackSarcomereLengthM - 1;
    const expectedDerivative = thickSphereDEngineeringStrainDVolume(
      sample.cavityVolumeM3,
      parameterSet,
      anchorGeometry.midwallRadiusM,
    );
    return Math.max(
      Math.abs(sample.sarcomereLengthM - expectedSarcomereLengthM),
      Math.abs(sample.fiberEngineeringStrain - expectedStrain),
      Math.abs(sample.dStrainDVolume - expectedDerivative),
    );
  });
  const maxFormulaResidual = Math.max(...residuals);
  return section("formula-closure-v1", maxFormulaResidual <= 1e-18, {
    maxFormulaResidual,
    sampleCount: samples.length,
    coordinateId: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
    modelId: THICK_SPHERE_SPIKE_V1_ID,
  });
}

function runFiniteDifferenceSection(
  audit: readonly { readonly cavityVolumeM3: number; readonly residualAbs: number }[],
): ThickSpherePhase3AProtocolSection {
  const maxFiniteDifferenceResidual = Math.max(...audit.map((item) => item.residualAbs));
  return section("finite-difference-derivative-audit-v1", maxFiniteDifferenceResidual <= 2e-5, {
    maxFiniteDifferenceResidual,
    sampleCount: audit.length,
    auditVolumeM3: audit.map((item) => item.cavityVolumeM3),
    tolerance: 2e-5,
  });
}

function runSweepHealthSection(
  samples: readonly ThickSpherePhase3ASweepSample[],
): ThickSpherePhase3AProtocolSection {
  const allFinite = samples.every((sample) => sample.finite);
  const allInDomain = samples.every((sample) => sample.inCalibrationDomain);
  const monotonicStrain = samples.every((sample, index) =>
    index === 0 || sample.fiberEngineeringStrain > samples[index - 1].fiberEngineeringStrain,
  );
  return section("sweep-health-v1", allFinite && allInDomain && monotonicStrain, {
    allFinite,
    allInDomain,
    monotonicStrain,
    minCavityVolumeM3: samples[0]?.cavityVolumeM3 ?? Number.NaN,
    maxCavityVolumeM3: samples[samples.length - 1]?.cavityVolumeM3 ?? Number.NaN,
    sampleCount: samples.length,
  });
}

function runRateDiagnosticSection(parameterSet: ThickSphereSpikeV1ParameterSet): ThickSpherePhase3AProtocolSection {
  const cavityVolumeM3 = parameterSet.anchorCavityVolumeM3;
  const rateSI = -2.5e-4;
  const output = ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI: cavityVolumeM3,
          previousValueSI: cavityVolumeM3,
          rateSI,
          unit: "m3",
        },
      ],
      instance: { moduleId: "kinematics", instanceId: "phase3a-rate-audit" },
    },
    parameterSet,
  );
  const expectedRate = output.dStrainDCoordinate[0] * rateSI;
  const residual = output.fiberEngineeringStrainRatePerSec - expectedRate;
  const outputKeys = Object.keys(output);
  return section("coordinate-rate-diagnostic-v1", Math.abs(residual) <= 1e-16 && !outputKeys.includes("dtSec"), {
    strainRateResidualPerSec: residual,
    inputPolicy: "coordinate-rate-derived",
    coreContractHasDtSec: outputKeys.includes("dtSec"),
  });
}

function runDeterministicReplaySection(parameterSet: ThickSphereSpikeV1ParameterSet): ThickSpherePhase3AProtocolSection {
  const first = runSweepSamples(parameterSet).map(compactSweepSample);
  const second = runSweepSamples(parameterSet).map(compactSweepSample);
  const firstHash = stableHash(sanitizeForStableHash(first));
  const secondHash = stableHash(sanitizeForStableHash(second));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function runFiniteDifferenceAudit(
  parameterSet: ThickSphereSpikeV1ParameterSet,
): readonly { readonly cavityVolumeM3: number; readonly residualAbs: number }[] {
  const auditVolumes = [
    parameterSet.sweepCavityVolumeMinM3 + 0.15 * sweepWidth(parameterSet),
    parameterSet.anchorCavityVolumeM3,
    parameterSet.sweepCavityVolumeMinM3 + 0.65 * sweepWidth(parameterSet),
    parameterSet.sweepCavityVolumeMaxM3 - 0.15 * sweepWidth(parameterSet),
  ];
  return auditVolumes.map((cavityVolumeM3) => {
    const h = Math.min(
      cavityVolumeM3 * 1e-5,
      (cavityVolumeM3 - parameterSet.sweepCavityVolumeMinM3) * 0.25,
      (parameterSet.sweepCavityVolumeMaxM3 - cavityVolumeM3) * 0.25,
    );
    const derivativeFiniteDifference =
      (strainAtVolume(cavityVolumeM3 + h, parameterSet) - strainAtVolume(cavityVolumeM3 - h, parameterSet))
      / (2 * h);
    const derivativeAnalytic = thickSphereDEngineeringStrainDVolume(cavityVolumeM3, parameterSet);
    return {
      cavityVolumeM3,
      residualAbs: Math.abs(derivativeAnalytic - derivativeFiniteDifference),
    };
  });
}

function strainAtVolume(cavityVolumeM3: number, parameterSet: ThickSphereSpikeV1ParameterSet): number {
  return ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI: cavityVolumeM3,
          previousValueSI: cavityVolumeM3,
          rateSI: 0,
          unit: "m3",
        },
      ],
      instance: { moduleId: "kinematics", instanceId: "phase3a-finite-difference" },
    },
    parameterSet,
  ).fiberEngineeringStrain;
}

function sweepVolumes(parameterSet: ThickSphereSpikeV1ParameterSet): readonly number[] {
  const count = 9;
  return Array.from({ length: count }, (_, index) =>
    parameterSet.sweepCavityVolumeMinM3 + (sweepWidth(parameterSet) * index) / (count - 1),
  );
}

function sweepWidth(parameterSet: ThickSphereSpikeV1ParameterSet): number {
  return parameterSet.sweepCavityVolumeMaxM3 - parameterSet.sweepCavityVolumeMinM3;
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, ThickSpherePhase3AMetricValue>,
): ThickSpherePhase3AProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function compactSweepSample(sample: ThickSpherePhase3ASweepSample): unknown {
  return {
    cavityVolumeM3: sample.cavityVolumeM3,
    sarcomereLengthM: sample.sarcomereLengthM,
    fiberEngineeringStrain: sample.fiberEngineeringStrain,
    dStrainDVolume: sample.dStrainDVolume,
    finite: sample.finite,
    inCalibrationDomain: sample.inCalibrationDomain,
  };
}
