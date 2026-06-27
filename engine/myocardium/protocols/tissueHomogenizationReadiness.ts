import phase3BDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import phase4BADescriptor from "@/data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";
import protocolDescriptor from "@/data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json";
import phase3CDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  IdentityFiberNominalV1,
} from "@/engine/myocardium/homogenization";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import type { LandSourceOutput } from "@/engine/myocardium/myofilament/land2017/types";
import { runIdentityForcePhase3BReport } from "@/engine/myocardium/mechanics/identityForcePhase3BReport";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  runLandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import { runMinimalLoadedAfterloadFamilyPhase3CReport } from "@/engine/myocardium/protocols/minimalLoadedAfterloadFamily";

export const LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID =
  "land-tissue-homogenization-phase4b-protocols-v1";
export const LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY =
  "tissue-homogenization-readiness-audit-only";
export const LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE = "Phase 4B-B";
export const LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE =
  "audits the locked shadow adapter candidate";
export const LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS =
  "not-run";

export type TissueHomogenizationReadinessStatus =
  | "readiness-audit-ready"
  | "readiness-audit-review";

export type TissueHomogenizationSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type TissueHomogenizationMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[]
  | readonly boolean[];

export type TissueHomogenizationReadinessSection = {
  readonly id: string;
  readonly status: TissueHomogenizationSectionStatus;
  readonly metrics: Record<string, TissueHomogenizationMetricValue>;
};

export type TissueHomogenizationIdentityParams = {
  readonly activeTissueFraction: 1;
  readonly orientationRuleId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
  readonly allowFreeGain: false;
  readonly fitToPVLoop: false;
};

export type TissueHomogenizationDescriptorIdentityParams = {
  readonly activeTissueFraction: number;
  readonly orientationRuleId: string;
  readonly allowFreeGain: boolean;
  readonly fitToPVLoop: boolean;
};

export type TissueHomogenizationIdentityMappingSmoke = {
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveNominalStressPa: number;
  readonly stressPassThroughResidualPa: number;
  readonly sourceStabilizationStiffnessPa: number;
  readonly wallStabilizationStiffnessPa: number;
  readonly sourceAlgorithmicTangentPa: number;
  readonly wallAlgorithmicTangentPa: number;
  readonly stabilizationAndAlgorithmicTangentDistinct: boolean;
  readonly stressPassThrough: boolean;
  readonly stabilizationPassThrough: boolean;
  readonly algorithmicTangentPassThrough: boolean;
  readonly allowFreeGain: false;
  readonly fitToPVLoop: false;
};

export type TissueHomogenizationReadinessReport = {
  readonly protocolSetId: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID;
  readonly phase: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE;
  readonly claimBoundary: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY;
  readonly readinessStatus: TissueHomogenizationReadinessStatus;
  readonly adapterAuditScope: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE;
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly decision4Status: "PENDING OWNER";
  readonly productionHomogenization: "not-claimed";
  readonly identifiabilityRankStatus: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS;
  readonly auditedAdapterCandidateId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
  readonly phase4BAReuse: {
    readonly status: "read-only";
    readonly reportProtocolSetId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
    readonly stableSummaryHash: string;
    readonly readinessPass: boolean;
  };
  readonly provenance: {
    readonly directAdapterProvenanceComplete: boolean;
    readonly phase3BProtocolSetId: "identity-force-phase3b-protocols-v1";
    readonly phase3CProtocolSetId: "minimal-loaded-phase3c-afterload-protocols-v1";
    readonly phase4BAProtocolSetId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
    readonly phase3BClosurePass: boolean;
    readonly phase3CClosurePass: boolean;
    readonly phase4BAReadinessPass: boolean;
  };
	  readonly identityAdapterCandidate: {
	    readonly homogenizationModelId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
	    readonly params: TissueHomogenizationIdentityParams;
	    readonly descriptorParams: TissueHomogenizationDescriptorIdentityParams;
	    readonly descriptorMatchesRuntimeParams: boolean;
	    readonly claim: "locked-shadow-adapter-candidate-only";
	  };
  readonly scientificLimitations: {
    readonly activeTissueFraction: 1;
    readonly orientationRuleId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
    readonly identityOrientationOnly: true;
    readonly fiberOrientationStatus: "not-modeled";
    readonly dispersionStatus: "not-modeled";
    readonly transmuralVariationStatus: "not-modeled";
    readonly fractionLessThanOneStatus: "not-supported";
    readonly independentDataStatus: "not-run";
    readonly identifiabilityRankStatus: "not-run";
    readonly limitationText: string;
  };
  readonly identityMappingSmoke: TissueHomogenizationIdentityMappingSmoke;
  readonly claimExclusions: {
    readonly productionHomogenization: "not-claimed";
    readonly officialMorphologyOutcome: "not-claimed";
    readonly liveRuntimeReplacement: "not-claimed";
    readonly calciumCyclingAlternansValidation: "not-claimed";
    readonly RVPressureOverloadCoverage: "not-claimed";
    readonly ventricularInterdependenceCoverage: "not-claimed";
    readonly rightHeartFailureCoverage: "not-claimed";
  };
  readonly futureTriSegPath: {
    readonly trisegLiteCandidateId: "triseg-lite-compatible";
    readonly fullTrisegCompatibleCandidateId: "full-triseg-compatible";
    readonly fullTriSegPath: string;
  };
  readonly requiredVerificationScripts: readonly string[];
  readonly sections: readonly TissueHomogenizationReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

const PHASE3B_DESCRIPTOR_PATH = "data/myocardium/protocols/identity-force-phase3b-protocols.json";
const PHASE3C_DESCRIPTOR_PATH = "data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
const PHASE4BA_DESCRIPTOR_PATH =
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json";

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  PHASE3B_DESCRIPTOR_PATH,
  PHASE3C_DESCRIPTOR_PATH,
  PHASE4BA_DESCRIPTOR_PATH,
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
] as const;

export function runTissueHomogenizationReadinessReport():
  TissueHomogenizationReadinessReport {
  const phase3BReport = runIdentityForcePhase3BReport();
  const phase3CReport = runMinimalLoadedAfterloadFamilyPhase3CReport();
  const phase4BAReport = runLandActiveStressReplacementReadinessReport();
  const identityMappingSmoke = runIdentityMappingSmoke();

  const descriptorProvenanceSection = runDescriptorDirectProvenanceSection(
    phase3BReport.closurePass,
    phase3CReport.closurePass,
    phase4BAReport.readinessPass,
  );
  const decisionBoundarySection = runDecision4OwnerBoundarySection();
  const identityConstantSection = runIdentityAdapterConstantMatchSection();
  const limitationTextSection = runIdentityAdapterLimitationTextSection();
  const tangentSeparationSection = runIdentityMappingTangentSeparationSection(identityMappingSmoke);
  const futurePathSection = runFutureTriSegNonCoverageSection();
  const deterministicReplaySection = runDeterministicReplaySection();
  const sections = [
    descriptorProvenanceSection,
    decisionBoundarySection,
    identityConstantSection,
    limitationTextSection,
    tangentSeparationSection,
    futurePathSection,
    deterministicReplaySection,
  ] as const;
  const readinessPass = sections.every((candidate) => candidate.status === "readiness-pass");
  const descriptorParams = descriptorIdentityParams();
  const reportWithoutHash = {
    protocolSetId: LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
    phase: LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE,
    claimBoundary: LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY,
    readinessStatus: readinessPass ? "readiness-audit-ready" : "readiness-audit-review",
    adapterAuditScope: LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE,
    ownerAcceptanceStatus: "not-owner-acceptance",
    decision4Status: "PENDING OWNER",
    productionHomogenization: "not-claimed",
    identifiabilityRankStatus: LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS,
    auditedAdapterCandidateId: IDENTITY_FIBER_NOMINAL_V1_ID,
    phase4BAReuse: {
      status: "read-only",
      reportProtocolSetId: phase4BAReport.protocolSetId,
      stableSummaryHash: phase4BAReport.stableSummaryHash,
      readinessPass: phase4BAReport.readinessPass,
    },
    provenance: {
      directAdapterProvenanceComplete:
        descriptorProvenanceSection.metrics.directAdapterProvenanceComplete === true,
      phase3BProtocolSetId: phase3BReport.protocolSetId,
      phase3CProtocolSetId: phase3CReport.protocolSetId,
      phase4BAProtocolSetId: phase4BAReport.protocolSetId,
      phase3BClosurePass: phase3BReport.closurePass,
      phase3CClosurePass: phase3CReport.closurePass,
      phase4BAReadinessPass: phase4BAReport.readinessPass,
    },
    identityAdapterCandidate: {
      homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
      params: runtimeIdentityParams(),
      descriptorParams,
      descriptorMatchesRuntimeParams: identityParamsMatchDescriptor(),
      claim: "locked-shadow-adapter-candidate-only",
    },
    scientificLimitations: scientificLimitations(),
    identityMappingSmoke,
    claimExclusions: reportClaimExclusions(),
    futureTriSegPath: reportFutureTriSegPath(),
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
  } as TissueHomogenizationReadinessReport;
}

function runDescriptorDirectProvenanceSection(
  phase3BClosurePass: boolean,
  phase3CClosurePass: boolean,
  phase4BAReadinessPass: boolean,
): TissueHomogenizationReadinessSection {
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const directAdapterProvenanceComplete = REQUIRED_DESCRIPTOR_SOURCE_PATHS.every((sourcePath) =>
    sourcePaths.includes(sourcePath),
  );
  const descriptorBoundaryOk =
    protocolDescriptor.protocolSetId === LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID
    && protocolDescriptor.phase === LAND_TISSUE_HOMOGENIZATION_PHASE4B_PHASE
    && protocolDescriptor.statusBoundary === LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY
    && protocolDescriptor.claimBoundary === LAND_TISSUE_HOMOGENIZATION_PHASE4B_CLAIM_BOUNDARY
    && protocolDescriptor.auditedAdapterCandidateId === IDENTITY_FIBER_NOMINAL_V1_ID
    && protocolDescriptor.adapterAuditScope === LAND_TISSUE_HOMOGENIZATION_PHASE4B_ADAPTER_AUDIT_SCOPE
    && phase3BDescriptor.protocolSetId === "identity-force-phase3b-protocols-v1"
    && phase3CDescriptor.protocolSetId === "minimal-loaded-phase3c-afterload-protocols-v1"
    && phase4BADescriptor.protocolSetId === LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
  return section(
    "descriptor-direct-provenance-v1",
    descriptorBoundaryOk
      && directAdapterProvenanceComplete
      && phase3BClosurePass
      && phase3CClosurePass
      && phase4BAReadinessPass,
    {
      protocolSetId: protocolDescriptor.protocolSetId,
      phase: protocolDescriptor.phase,
      claimBoundary: protocolDescriptor.claimBoundary,
      auditedAdapterCandidateId: protocolDescriptor.auditedAdapterCandidateId,
      adapterAuditScope: protocolDescriptor.adapterAuditScope,
      directAdapterProvenanceComplete,
      requiredSourcePaths: [...REQUIRED_DESCRIPTOR_SOURCE_PATHS],
      phase3BProtocolSetId: phase3BDescriptor.protocolSetId,
      phase3CProtocolSetId: phase3CDescriptor.protocolSetId,
      phase4BAProtocolSetId: phase4BADescriptor.protocolSetId,
      phase3BClosurePass,
      phase3CClosurePass,
      phase4BAReadinessPass,
    },
  );
}

function runDecision4OwnerBoundarySection(): TissueHomogenizationReadinessSection {
  const decision4 = protocolDescriptor.pendingOwnerDecisions.find(
    (candidate) => candidate.decisionId === 4,
  );
  const settings = protocolDescriptor.protocolSettings;
  const claimExclusions = protocolDescriptor.claimExclusions;
  const ok =
    protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && protocolDescriptor.decision4Status === "PENDING OWNER"
    && protocolDescriptor.productionHomogenization === "not-claimed"
    && protocolDescriptor.identifiabilityRankStatus
      === LAND_TISSUE_HOMOGENIZATION_PHASE4B_IDENTIFIABILITY_RANK_STATUS
    && decision4?.status === "PENDING OWNER"
    && settings.allowFreeHomogenizationGain === false
    && settings.fitToPVLoop === false
    && settings.useProductionHomogenization === false
    && settings.useProductionMechanics === false
    && settings.useRuntimeReplacement === false
    && settings.useModelCoreRuntimeWiring === false
    && settings.useOfficialCaseWiring === false
    && settings.useOfficialMorphologyAcceptance === false
    && settings.useCalciumCyclingAlternansValidation === false
    && settings.runIndependentIdentifiabilityRank === false
    && Object.values(claimExclusions).every((value) => value === "not-claimed");
  return section("decision4-owner-boundary-v1", ok, {
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    decision4Status: protocolDescriptor.decision4Status,
    productionHomogenization: protocolDescriptor.productionHomogenization,
    identifiabilityRankStatus: protocolDescriptor.identifiabilityRankStatus,
    decision4PendingOwner: decision4?.status === "PENDING OWNER",
    allowFreeHomogenizationGain: settings.allowFreeHomogenizationGain,
    fitToPVLoop: settings.fitToPVLoop,
    useProductionHomogenization: settings.useProductionHomogenization,
    useProductionMechanics: settings.useProductionMechanics,
    useRuntimeReplacement: settings.useRuntimeReplacement,
    useModelCoreRuntimeWiring: settings.useModelCoreRuntimeWiring,
    useOfficialCaseWiring: settings.useOfficialCaseWiring,
    runIndependentIdentifiabilityRank: settings.runIndependentIdentifiabilityRank,
  });
}

function runIdentityAdapterConstantMatchSection(): TissueHomogenizationReadinessSection {
  const descriptorParams = descriptorIdentityParams();
  const runtimeParams = runtimeIdentityParams();
  const ok =
    protocolDescriptor.identityAdapterCandidate.homogenizationModelId === IDENTITY_FIBER_NOMINAL_V1_ID
    && protocolDescriptor.identityAdapterCandidate.claim === "locked-shadow-adapter-candidate-only"
    && identityParamsEqual(descriptorParams, runtimeParams);
  return section("identity-adapter-constant-match-v1", ok, {
    homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
    descriptorHomogenizationModelId:
      protocolDescriptor.identityAdapterCandidate.homogenizationModelId,
    activeTissueFraction: runtimeParams.activeTissueFraction,
    descriptorActiveTissueFraction: descriptorParams.activeTissueFraction,
    orientationRuleId: runtimeParams.orientationRuleId,
    descriptorOrientationRuleId: descriptorParams.orientationRuleId,
    allowFreeGain: runtimeParams.allowFreeGain,
    descriptorAllowFreeGain: descriptorParams.allowFreeGain,
    fitToPVLoop: runtimeParams.fitToPVLoop,
    descriptorFitToPVLoop: descriptorParams.fitToPVLoop,
    descriptorMatchesRuntimeParams: ok,
  });
}

function runIdentityAdapterLimitationTextSection(): TissueHomogenizationReadinessSection {
  const limitation = protocolDescriptor.scientificLimitations;
  const text = deepText(limitation).replace(/\s+/g, " ");
  const ok =
    limitation.activeTissueFraction === 1
    && limitation.orientationRuleId === IDENTITY_FIBER_NOMINAL_V1_ID
    && limitation.identityOrientationOnly === true
    && limitation.fiberOrientationStatus === "not-modeled"
    && limitation.dispersionStatus === "not-modeled"
    && limitation.transmuralVariationStatus === "not-modeled"
    && limitation.fractionLessThanOneStatus === "not-supported"
    && limitation.independentDataStatus === "not-run"
    && limitation.identifiabilityRankStatus === "not-run"
    && /activeTissueFraction=1/i.test(text)
    && /identity orientation/i.test(text)
    && /no fiber orientation/i.test(text)
    && /no dispersion/i.test(text)
    && /no transmural variation/i.test(text)
    && /no active tissue fraction<1|no fraction<1/i.test(text)
    && /no independent data/i.test(text)
    && /no independent identifiability rank run|no identifiability rank run/i.test(text);
  return section("identity-adapter-limitation-text-v1", ok, {
    activeTissueFraction: limitation.activeTissueFraction,
    orientationRuleId: limitation.orientationRuleId,
    identityOrientationOnly: limitation.identityOrientationOnly,
    fiberOrientationStatus: limitation.fiberOrientationStatus,
    dispersionStatus: limitation.dispersionStatus,
    transmuralVariationStatus: limitation.transmuralVariationStatus,
    fractionLessThanOneStatus: limitation.fractionLessThanOneStatus,
    independentDataStatus: limitation.independentDataStatus,
    identifiabilityRankStatus: limitation.identifiabilityRankStatus,
    limitationTextIncludesRequiredTokens: ok,
  });
}

function runIdentityMappingTangentSeparationSection(
  smoke: TissueHomogenizationIdentityMappingSmoke,
): TissueHomogenizationReadinessSection {
  const ok =
    smoke.stressPassThrough
    && smoke.stabilizationPassThrough
    && smoke.algorithmicTangentPassThrough
    && smoke.stabilizationAndAlgorithmicTangentDistinct
    && smoke.allowFreeGain === false
    && smoke.fitToPVLoop === false;
  return section("identity-mapping-tangent-separation-v1", ok, {
    sourceActiveFiberStressPa: smoke.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: smoke.wallActiveNominalStressPa,
    stressPassThroughResidualPa: smoke.stressPassThroughResidualPa,
    sourceStabilizationStiffnessPa: smoke.sourceStabilizationStiffnessPa,
    wallStabilizationStiffnessPa: smoke.wallStabilizationStiffnessPa,
    sourceAlgorithmicTangentPa: smoke.sourceAlgorithmicTangentPa,
    wallAlgorithmicTangentPa: smoke.wallAlgorithmicTangentPa,
    stabilizationAndAlgorithmicTangentDistinct:
      smoke.stabilizationAndAlgorithmicTangentDistinct,
    stressPassThrough: smoke.stressPassThrough,
    stabilizationPassThrough: smoke.stabilizationPassThrough,
    algorithmicTangentPassThrough: smoke.algorithmicTangentPassThrough,
  });
}

function runFutureTriSegNonCoverageSection(): TissueHomogenizationReadinessSection {
  const text = deepText({
    nonCoverage: protocolDescriptor.nonCoverage,
    futureTriSegPath: protocolDescriptor.futureTriSegPath,
  }).replace(/\s+/g, " ");
  const ok =
    /RV pressure overload/i.test(text)
    && /septal bowing/i.test(text)
    && /ventricular interdependence/i.test(text)
    && /right[- ]heart failure/i.test(text)
    && /not covered/i.test(text)
    && /triseg-lite-compatible/i.test(text)
    && /full-triseg-compatible/i.test(text)
    && /full TriSeg/i.test(text)
    && /before[^.]{0,180}claim/i.test(text);
  return section("future-triseg-noncoverage-v1", ok, {
    rvPressureOverloadNonCoverage: /RV pressure overload/i.test(text),
    septalBowingNonCoverage: /septal bowing/i.test(text),
    ventricularInterdependenceNonCoverage: /ventricular interdependence/i.test(text),
    rightHeartFailureNonCoverage: /right[- ]heart failure/i.test(text),
    trisegLiteCandidateId: protocolDescriptor.futureTriSegPath.trisegLiteCandidateId,
    fullTrisegCompatibleCandidateId:
      protocolDescriptor.futureTriSegPath.fullTrisegCompatibleCandidateId,
    fullTriSegPathPreserved: /full TriSeg/i.test(text),
  });
}

function runDeterministicReplaySection(): TissueHomogenizationReadinessSection {
  const firstHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  const secondHash = stableHash(sanitizeForStableHash(buildReplayPayload()));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
    stableHashUtility: "engine/myocardium/kinematics/stableHash",
  });
}

function buildReplayPayload(): unknown {
  const phase3BReport = runIdentityForcePhase3BReport();
  const phase3CReport = runMinimalLoadedAfterloadFamilyPhase3CReport();
  const phase4BAReport = runLandActiveStressReplacementReadinessReport();
  return {
    phase3BStableSummaryHash: phase3BReport.stableSummaryHash,
    phase3CStableSummaryHash: phase3CReport.stableSummaryHash,
    phase4BAStableSummaryHash: phase4BAReport.stableSummaryHash,
    identityAdapterCandidate: {
      params: runtimeIdentityParams(),
      descriptorParams: descriptorIdentityParams(),
      descriptorMatchesRuntimeParams: identityParamsMatchDescriptor(),
    },
    scientificLimitations: scientificLimitations(),
    identityMappingSmoke: runIdentityMappingSmoke(),
  };
}

function runIdentityMappingSmoke(): TissueHomogenizationIdentityMappingSmoke {
  const source = syntheticLandSource();
  const active = IdentityFiberNominalV1.evaluate(
    {
      source,
      instance: { moduleId: "homogenization", instanceId: "phase4bb-readiness-smoke" },
      wallReferenceVolumeM3: 1.25e-4,
    },
    IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  );
  const sourceAlgorithmicTangentPa = source.algorithmicTangentPa ?? Number.NaN;
  const wallAlgorithmicTangentPa = active.wallAlgorithmicTangentPa ?? Number.NaN;
  const stressPassThroughResidualPa = Math.abs(
    active.wallActiveNominalStressPa - source.sourceActiveFiberStressPa,
  );
  return {
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: active.wallActiveNominalStressPa,
    stressPassThroughResidualPa,
    sourceStabilizationStiffnessPa: source.stabilizationStiffnessPa,
    wallStabilizationStiffnessPa: active.wallStabilizationStiffnessPa,
    sourceAlgorithmicTangentPa,
    wallAlgorithmicTangentPa,
    stabilizationAndAlgorithmicTangentDistinct:
      source.stabilizationStiffnessPa !== sourceAlgorithmicTangentPa
      && active.wallStabilizationStiffnessPa !== wallAlgorithmicTangentPa,
    stressPassThrough: stressPassThroughResidualPa === 0,
    stabilizationPassThrough:
      active.wallStabilizationStiffnessPa === source.stabilizationStiffnessPa,
    algorithmicTangentPassThrough: wallAlgorithmicTangentPa === sourceAlgorithmicTangentPa,
    allowFreeGain: IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain,
    fitToPVLoop: IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop,
  };
}

function syntheticLandSource(): LandSourceOutput {
  return {
    sourceActiveFiberStressPa: 34567,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa: 45678,
    algorithmicTangentPa: 56789,
    sourceActivePowerDensityWPerM3: 6913.4,
    health: {
      finite: true,
      stateConservationResidual: 0,
      minimumPopulation: 0.01,
      projectionUsed: false,
    },
  };
}

function scientificLimitations(): TissueHomogenizationReadinessReport["scientificLimitations"] {
  return {
    activeTissueFraction: IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction,
    orientationRuleId: IDENTITY_FIBER_NOMINAL_V1_PARAMS.orientationRuleId,
    identityOrientationOnly: true,
    fiberOrientationStatus: "not-modeled",
    dispersionStatus: "not-modeled",
    transmuralVariationStatus: "not-modeled",
    fractionLessThanOneStatus: "not-supported",
    independentDataStatus: "not-run",
    identifiabilityRankStatus: "not-run",
    limitationText:
      "The current identity adapter has activeTissueFraction=1 and identity orientation only: no fiber orientation model, no dispersion model, no transmural variation, no active tissue fraction<1 behavior, no independent data fit, and no independent identifiability rank run.",
  };
}

function reportClaimExclusions(): TissueHomogenizationReadinessReport["claimExclusions"] {
  return {
    productionHomogenization: "not-claimed",
    officialMorphologyOutcome: "not-claimed",
    liveRuntimeReplacement: "not-claimed",
    calciumCyclingAlternansValidation: "not-claimed",
    RVPressureOverloadCoverage: "not-claimed",
    ventricularInterdependenceCoverage: "not-claimed",
    rightHeartFailureCoverage: "not-claimed",
  };
}

function reportFutureTriSegPath(): TissueHomogenizationReadinessReport["futureTriSegPath"] {
  return {
    trisegLiteCandidateId: "triseg-lite-compatible",
    fullTrisegCompatibleCandidateId: "full-triseg-compatible",
    fullTriSegPath:
      "A full TriSeg escalation path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed as covered primary mechanisms.",
  };
}

function runtimeIdentityParams(): TissueHomogenizationIdentityParams {
  return {
    activeTissueFraction: IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction,
    orientationRuleId: IDENTITY_FIBER_NOMINAL_V1_PARAMS.orientationRuleId,
    allowFreeGain: IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain,
    fitToPVLoop: IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop,
  };
}

function descriptorIdentityParams(): TissueHomogenizationDescriptorIdentityParams {
  const params = protocolDescriptor.identityAdapterCandidate.parameters;
  return {
    activeTissueFraction: params.activeTissueFraction,
    orientationRuleId: params.orientationRuleId,
    allowFreeGain: params.allowFreeGain,
    fitToPVLoop: params.fitToPVLoop,
  };
}

function identityParamsMatchDescriptor(): boolean {
  return identityParamsEqual(descriptorIdentityParams(), runtimeIdentityParams());
}

function identityParamsEqual(
  left: TissueHomogenizationDescriptorIdentityParams,
  right: TissueHomogenizationIdentityParams,
): boolean {
  return left.activeTissueFraction === right.activeTissueFraction
    && left.orientationRuleId === right.orientationRuleId
    && left.allowFreeGain === right.allowFreeGain
    && left.fitToPVLoop === right.fitToPVLoop;
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, TissueHomogenizationMetricValue>,
): TissueHomogenizationReadinessSection {
  return {
    id,
    status: ok ? "readiness-pass" : "readiness-fail",
    metrics,
  };
}

function deepText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((entry) => deepText(entry)).join(" ");
  if (typeof value === "object" && value !== null) {
    return Object.values(value).map((entry) => deepText(entry)).join(" ");
  }
  return "";
}
