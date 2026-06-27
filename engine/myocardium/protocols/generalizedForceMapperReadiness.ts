import protocolDescriptor from "@/data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json";
import ownerSelection from "@/data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json";
import phase4CADescriptor from "@/data/myocardium/protocols/passive-energy-phase4c-protocols.json";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import type { GeneralizedCoordinateUnit } from "@/engine/myocardium/kinematics/contracts";
import type { GeneralizedForceOutput } from "@/engine/myocardium/mechanics";
import { runIdentityForcePhase3BReport } from "@/engine/myocardium/mechanics/identityForcePhase3BReport";
import {
  VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
  evaluateVirtualPowerGeneralizedForceV1,
  type VirtualPowerGeneralizedForceV1Input,
} from "@/engine/myocardium/mechanics";
import {
  LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID,
  runLandActiveStressReplacementReadinessReport,
} from "@/engine/myocardium/protocols/landActiveStressReplacementReadiness";
import {
  LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID,
  runTissueHomogenizationReadinessReport,
} from "@/engine/myocardium/protocols/tissueHomogenizationReadiness";
import {
  PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID,
  runPassiveEnergyReadinessReport,
} from "@/engine/myocardium/protocols/passiveEnergyReadiness";

export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID =
  "generalized-force-mapper-phase4c-b-protocols-v1";
export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE = "Phase 4C-B";
export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY =
  "generalized-force-mapper-readiness-artifact-only";
export const GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS =
  "synthetic-multi-coordinate-virtual-power-closure-only";

export type GeneralizedForceMapperReadinessStatus =
  | "readiness-artifact-ready"
  | "readiness-artifact-review";

export type GeneralizedForceMapperSectionStatus =
  | "readiness-pass"
  | "readiness-fail";

export type GeneralizedForceMapperReadinessSection = {
  readonly id: string;
  readonly status: GeneralizedForceMapperSectionStatus;
  readonly metrics: Record<string, unknown>;
};

export type GeneralizedForceMapperSyntheticSample = {
  readonly id: string;
  readonly coordinateIds: readonly string[];
  readonly coordinateUnitsById: Readonly<Record<string, GeneralizedCoordinateUnit>>;
  readonly dStrainDCoordinate: readonly number[];
  readonly coordinateRatesSI?: readonly number[];
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly activeStressPa: number;
  readonly passiveStressPa: number;
  readonly viscousStressPa: number;
  readonly activeContributionsSI: readonly number[];
  readonly passiveContributionsSI: readonly number[];
  readonly viscousContributionsSI: readonly number[];
  readonly conjugateForcesSI: readonly number[];
  readonly coordinatePowersW: readonly number[];
  readonly stressPowerW: number;
  readonly virtualPowerResidualW: number;
  readonly volumeCoordinatePressurePa?: Readonly<Record<string, number>>;
  readonly contributionSumResidualMaxAbs: number;
  readonly zeroDerivativeContributionsExactZero: boolean;
  readonly pressureMapContainsOnlyM3Coordinates: boolean;
};

export type GeneralizedForceMapperEvidence = {
  readonly modelId: typeof VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID;
  readonly samples: readonly GeneralizedForceMapperSyntheticSample[];
  readonly maxVirtualPowerResidualAbsW: number;
  readonly virtualPowerResidualToleranceW: number;
  readonly directionalClosure: {
    readonly pass: boolean;
    readonly maxResidualAbsW: number;
    readonly toleranceW: number;
    readonly directionIds: readonly string[];
  };
  readonly contributionDecompositionPass: boolean;
  readonly zeroDerivativeExactZero: boolean;
  readonly pressureMapVolumeOnly: boolean;
  readonly multiCoordinateExplicitRatesCovered: boolean;
  readonly singleCoordinateDerivedRateCovered: boolean;
};

export type GeneralizedForceMapperReadinessReport = {
  readonly protocolSetId: typeof GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID;
  readonly phase: typeof GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE;
  readonly claimBoundary: typeof GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS;
  readonly readinessStatus: GeneralizedForceMapperReadinessStatus;
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly decision4Status: "PENDING OWNER";
  readonly decision5Status: "PENDING OWNER";
  readonly decision6Status: "PENDING OWNER";
  readonly decision8Status: "PENDING OWNER";
  readonly decision19Status: "ACCEPTED";
  readonly decision19ReuseStatus: "accepted-owner-selection-read-only";
  readonly productionMechanics: "not-claimed";
  readonly mapperEvidence: GeneralizedForceMapperEvidence;
  readonly priorGateEvidence: {
    readonly phase3BClosurePass: boolean;
    readonly phase3BStableSummaryHash: string;
    readonly phase4BAReadinessPass: boolean;
    readonly phase4BAProtocolSetId: typeof LAND_ACTIVE_STRESS_REPLACEMENT_PHASE4B_PROTOCOL_SET_ID;
    readonly phase4BAStableSummaryHash: string;
    readonly phase4BBReadinessPass: boolean;
    readonly phase4BBProtocolSetId: typeof LAND_TISSUE_HOMOGENIZATION_PHASE4B_PROTOCOL_SET_ID;
    readonly phase4BBStableSummaryHash: string;
    readonly phase4CAReadinessPass: boolean;
    readonly phase4CAProtocolSetId: typeof PASSIVE_ENERGY_PHASE4C_PROTOCOL_SET_ID;
    readonly phase4CAStableSummaryHash: string;
    readonly phase4CAEnableMultiCoordinateGeneralizedForceMapper: boolean;
    readonly decision19OwnerSelectionAccepted: boolean;
    readonly decision19SelectedCandidateId: "thick-sphere-v2-explicit-external-septal-coupling";
    readonly decision19SelectedBackend: "thick-sphere-v2";
  };
  readonly claimExclusions: {
    readonly productionMechanics: "not-claimed";
    readonly productionHomogenization: "not-claimed";
    readonly productionPassiveLaw: "not-claimed";
    readonly officialMorphologyOutcome: "not-claimed";
    readonly liveRuntimeReplacement: "not-claimed";
    readonly productionRuntimeAcceptance: "not-claimed";
    readonly ModelCoreChamberWiring: "not-claimed";
    readonly officialCaseWiring: "not-claimed";
    readonly workbenchWiring: "not-claimed";
    readonly atrialBridgeSelection: "not-claimed";
    readonly RVPressureOverloadCoverage: "not-claimed";
    readonly septalBowingCoverage: "not-claimed";
    readonly ventricularInterdependenceCoverage: "not-claimed";
    readonly rightHeartFailureCoverage: "not-claimed";
  };
  readonly futureTriSegPath: {
    readonly trisegLiteCandidateId: "triseg-lite-compatible";
    readonly fullTrisegCompatibleCandidateId: "full-triseg-compatible";
    readonly fullTriSegPath: string;
  };
  readonly requiredVerificationScripts: readonly string[];
  readonly sections: readonly GeneralizedForceMapperReadinessSection[];
  readonly readinessPass: boolean;
  readonly stableSummaryHash: string;
};

type SyntheticMapperSampleDefinition = {
  readonly id: string;
  readonly coordinateIds: readonly string[];
  readonly coordinateUnitsById: Readonly<Record<string, GeneralizedCoordinateUnit>>;
  readonly dStrainDCoordinate: readonly number[];
  readonly coordinateRatesSI?: readonly number[];
  readonly fiberEngineeringStrainRatePerSec: number;
  readonly wallReferenceVolumeM3: number;
  readonly activeStressPa: number;
  readonly passiveStressPa: number;
  readonly viscousStressPa: number;
};

const REQUIRED_DESCRIPTOR_SOURCE_PATHS = [
  "docs/myocardium/adr/ADR-MYO-001.md",
  "docs/myocardium/model-spec/myocardium-land-v1.md",
  "docs/myocardium/verification/myocardium-v1-verification.md",
  "docs/myocardium/roadmap/myocardium-rebuild-roadmap.md",
  "data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json",
  "data/myocardium/protocols/identity-force-phase3b-protocols.json",
  "data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json",
  "data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json",
  "data/myocardium/protocols/passive-energy-phase4c-protocols.json",
] as const;

const RESIDUAL_TOLERANCE_W = 1e-12;
const DIRECTIONAL_RESIDUAL_TOLERANCE_W = 1e-9;

const SAMPLE_DEFINITIONS: readonly SyntheticMapperSampleDefinition[] = Object.freeze([
  {
    id: "multi-coordinate-mixed-volume-displacement",
    coordinateIds: ["cavity-volume", "septal-displacement", "av-plane-displacement"],
    coordinateUnitsById: {
      "cavity-volume": "m3",
      "septal-displacement": "m",
      "av-plane-displacement": "m",
    },
    dStrainDCoordinate: [2000, -0.25, 0],
    coordinateRatesSI: [1.2e-7, -8e-4, 5e-4],
    fiberEngineeringStrainRatePerSec: 4.4e-4,
    wallReferenceVolumeM3: 1.1e-4,
    activeStressPa: 42000,
    passiveStressPa: 8000,
    viscousStressPa: -2000,
  },
  {
    id: "dual-volume-pressure-map",
    coordinateIds: ["lv-cavity-volume", "rv-cavity-volume", "long-axis-displacement"],
    coordinateUnitsById: {
      "lv-cavity-volume": "m3",
      "rv-cavity-volume": "m3",
      "long-axis-displacement": "m",
    },
    dStrainDCoordinate: [1200, -650, 0.12],
    coordinateRatesSI: [2.5e-7, -1.5e-7, 1.25e-3],
    fiberEngineeringStrainRatePerSec: 5.475e-4,
    wallReferenceVolumeM3: 9.5e-5,
    activeStressPa: 36000,
    passiveStressPa: 9000,
    viscousStressPa: 1200,
  },
  {
    id: "single-volume-derived-rate",
    coordinateIds: ["cavity-volume"],
    coordinateUnitsById: { "cavity-volume": "m3" },
    dStrainDCoordinate: [1800],
    fiberEngineeringStrainRatePerSec: 3.6e-4,
    wallReferenceVolumeM3: 1.2e-4,
    activeStressPa: 28000,
    passiveStressPa: 3000,
    viscousStressPa: 500,
  },
] as const);

export function runGeneralizedForceMapperReadinessReport():
  GeneralizedForceMapperReadinessReport {
  const phase3BReport = runIdentityForcePhase3BReport();
  const phase4BAReport = runLandActiveStressReplacementReadinessReport();
  const phase4BBReport = runTissueHomogenizationReadinessReport();
  const phase4CAReport = runPassiveEnergyReadinessReport();
  const mapperEvidence = buildMapperEvidence();

  const sections = [
    sourceDecisionBoundarySection(
      phase3BReport.closurePass,
      phase4BAReport.readinessPass,
      phase4BBReport.readinessPass,
      phase4CAReport.readinessPass,
    ),
    contributionDecompositionSection(mapperEvidence),
    virtualPowerClosureSection(mapperEvidence),
    unitPressureMapSection(mapperEvidence),
    priorGateReadOnlySection(
      phase3BReport.closurePass,
      phase4BAReport.readinessPass,
      phase4BBReport.readinessPass,
      phase4CAReport.readinessPass,
    ),
    nonCoverageTriSegBoundarySection(),
    deterministicReplaySection(),
  ] as const;
  const readinessPass = sections.every((section) => section.status === "readiness-pass");
  const reportWithoutHash = {
    protocolSetId: GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID,
    phase: GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE,
    claimBoundary: GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY,
    evidenceStatus: GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS,
    readinessStatus: readinessPass ? "readiness-artifact-ready" : "readiness-artifact-review",
    ownerAcceptanceStatus: "not-owner-acceptance",
    decision4Status: "PENDING OWNER",
    decision5Status: "PENDING OWNER",
    decision6Status: "PENDING OWNER",
    decision8Status: "PENDING OWNER",
    decision19Status: "ACCEPTED",
    decision19ReuseStatus: "accepted-owner-selection-read-only",
    productionMechanics: "not-claimed",
    mapperEvidence,
    priorGateEvidence: {
      phase3BClosurePass: phase3BReport.closurePass,
      phase3BStableSummaryHash: phase3BReport.stableSummaryHash,
      phase4BAReadinessPass: phase4BAReport.readinessPass,
      phase4BAProtocolSetId: phase4BAReport.protocolSetId,
      phase4BAStableSummaryHash: phase4BAReport.stableSummaryHash,
      phase4BBReadinessPass: phase4BBReport.readinessPass,
      phase4BBProtocolSetId: phase4BBReport.protocolSetId,
      phase4BBStableSummaryHash: phase4BBReport.stableSummaryHash,
      phase4CAReadinessPass: phase4CAReport.readinessPass,
      phase4CAProtocolSetId: phase4CAReport.protocolSetId,
      phase4CAStableSummaryHash: phase4CAReport.stableSummaryHash,
      phase4CAEnableMultiCoordinateGeneralizedForceMapper:
        phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper,
      decision19OwnerSelectionAccepted: ownerSelection.status === "ACCEPTED",
      decision19SelectedCandidateId: ownerSelection.selectedCandidateId,
      decision19SelectedBackend: ownerSelection.selectedBackend,
    },
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
  } as GeneralizedForceMapperReadinessReport;
}

function buildMapperEvidence(): GeneralizedForceMapperEvidence {
  const samples = SAMPLE_DEFINITIONS.map(runSyntheticSample);
  const maxVirtualPowerResidualAbsW = Math.max(
    ...samples.map((sample) => Math.abs(sample.virtualPowerResidualW)),
  );
  const contributionDecompositionPass = samples.every(
    (sample) => sample.contributionSumResidualMaxAbs <= 1e-12,
  );
  const directionalClosure = directionalClosureSummary(samples);
  const zeroDerivativeExactZero = samples.some((sample) =>
    sample.zeroDerivativeContributionsExactZero
    && sample.dStrainDCoordinate.some((derivative) => derivative === 0)
  );
  const pressureMapVolumeOnly = samples.every(
    (sample) => sample.pressureMapContainsOnlyM3Coordinates,
  );
  const multiCoordinateExplicitRatesCovered = samples.some(
    (sample) => sample.coordinateIds.length > 1 && sample.coordinateRatesSI !== undefined,
  );
  const singleCoordinateDerivedRateCovered = samples.some(
    (sample) => sample.coordinateIds.length === 1 && sample.coordinateRatesSI === undefined,
  );

  return {
    modelId: VIRTUAL_POWER_GENERALIZED_FORCE_V1_ID,
    samples,
    maxVirtualPowerResidualAbsW,
    virtualPowerResidualToleranceW: RESIDUAL_TOLERANCE_W,
    directionalClosure,
    contributionDecompositionPass,
    zeroDerivativeExactZero,
    pressureMapVolumeOnly,
    multiCoordinateExplicitRatesCovered,
    singleCoordinateDerivedRateCovered,
  };
}

function runSyntheticSample(
  definition: SyntheticMapperSampleDefinition,
): GeneralizedForceMapperSyntheticSample {
  const input = syntheticMapperInput(definition);
  const output = evaluateVirtualPowerGeneralizedForceV1(input);
  const coordinateRatesSI = definition.coordinateRatesSI ?? [
    definition.fiberEngineeringStrainRatePerSec / definition.dStrainDCoordinate[0],
  ];
  const coordinatePowersW = output.conjugateForcesSI.map(
    (force, index) => force * coordinateRatesSI[index],
  );
  const stressPowerW =
    definition.wallReferenceVolumeM3
    * (definition.activeStressPa + definition.passiveStressPa + definition.viscousStressPa)
    * definition.fiberEngineeringStrainRatePerSec;

  return {
    id: definition.id,
    coordinateIds: [...definition.coordinateIds],
    coordinateUnitsById: { ...definition.coordinateUnitsById },
    dStrainDCoordinate: [...definition.dStrainDCoordinate],
    ...(definition.coordinateRatesSI === undefined
      ? {}
      : { coordinateRatesSI: [...definition.coordinateRatesSI] }),
    fiberEngineeringStrainRatePerSec: definition.fiberEngineeringStrainRatePerSec,
    activeStressPa: definition.activeStressPa,
    passiveStressPa: definition.passiveStressPa,
    viscousStressPa: definition.viscousStressPa,
    activeContributionsSI: Array.from(output.activeContributionsSI),
    passiveContributionsSI: Array.from(output.passiveContributionsSI),
    viscousContributionsSI: Array.from(output.viscousContributionsSI),
    conjugateForcesSI: Array.from(output.conjugateForcesSI),
    coordinatePowersW: Array.from(coordinatePowersW),
    stressPowerW,
    virtualPowerResidualW: output.virtualPowerResidualW,
    ...(output.volumeCoordinatePressurePa === undefined
      ? {}
      : { volumeCoordinatePressurePa: output.volumeCoordinatePressurePa }),
    contributionSumResidualMaxAbs: contributionSumResidualMaxAbs(output),
    zeroDerivativeContributionsExactZero: zeroDerivativeContributionsExactZero(
      definition.dStrainDCoordinate,
      output,
    ),
    pressureMapContainsOnlyM3Coordinates: pressureMapContainsOnlyM3Coordinates(
      definition.coordinateUnitsById,
      output.volumeCoordinatePressurePa,
    ),
  };
}

function syntheticMapperInput(
  definition: SyntheticMapperSampleDefinition,
): VirtualPowerGeneralizedForceV1Input {
  return {
    kinematics: {
      sarcomereLengthM: 2.1e-6,
      fiberStretchRatio: 1.05,
      fiberEngineeringStrain: 0.05,
      fiberEngineeringStrainRatePerSec: definition.fiberEngineeringStrainRatePerSec,
      coordinateIds: definition.coordinateIds,
      dStrainDCoordinate: Float64Array.from(definition.dStrainDCoordinate),
      wallReferenceVolumeM3: definition.wallReferenceVolumeM3,
      geometryHealth: {
        finite: true,
        inCalibrationDomain: true,
      },
    },
    active: {
      wallActiveNominalStressPa: definition.activeStressPa,
      wallStabilizationStiffnessPa: 50000,
      wallAlgorithmicTangentPa: 60000,
      homogenizationModelId: "synthetic-active-stress-phase4c-b-fixture-v1",
      activeTissueFraction: 1,
      orientationRuleId: "synthetic-orientation-phase4c-b-fixture-v1",
    },
    passive: {
      passiveNominalStressPa: definition.passiveStressPa,
      viscousNominalStressPa: definition.viscousStressPa,
      dPassiveStressDStrainPa: 90000,
      storedEnergyDensityJPerM3: 100,
      dissipationDensityWPerM3: Math.abs(definition.viscousStressPa * definition.fiberEngineeringStrainRatePerSec),
    },
    ...(definition.coordinateRatesSI === undefined
      ? {}
      : { coordinateRatesSI: definition.coordinateRatesSI }),
    coordinateUnitsById: definition.coordinateUnitsById,
  };
}

function contributionSumResidualMaxAbs(output: GeneralizedForceOutput): number {
  let maxResidual = 0;
  for (let index = 0; index < output.conjugateForcesSI.length; index += 1) {
    const residual = Math.abs(
      output.conjugateForcesSI[index]
      - output.activeContributionsSI[index]
      - output.passiveContributionsSI[index]
      - output.viscousContributionsSI[index],
    );
    maxResidual = Math.max(maxResidual, residual);
  }
  return maxResidual;
}

function zeroDerivativeContributionsExactZero(
  derivatives: readonly number[],
  output: GeneralizedForceOutput,
): boolean {
  return derivatives.every((derivative, index) => (
    derivative !== 0
    || (
      output.activeContributionsSI[index] === 0
      && output.passiveContributionsSI[index] === 0
      && output.viscousContributionsSI[index] === 0
      && output.conjugateForcesSI[index] === 0
    )
  ));
}

function pressureMapContainsOnlyM3Coordinates(
  coordinateUnitsById: Readonly<Record<string, GeneralizedCoordinateUnit>>,
  pressureMap: Readonly<Record<string, number>> | undefined,
): boolean {
  const pressureKeys = Object.keys(pressureMap ?? {});
  const m3CoordinateIds = Object.entries(coordinateUnitsById)
    .filter(([, unit]) => unit === "m3")
    .map(([coordinateId]) => coordinateId);
  return (
    pressureKeys.every((coordinateId) => coordinateUnitsById[coordinateId] === "m3")
    && m3CoordinateIds.every((coordinateId) => pressureKeys.includes(coordinateId))
  );
}

function sourceDecisionBoundarySection(
  phase3BClosurePass: boolean,
  phase4BAReadinessPass: boolean,
  phase4BBReadinessPass: boolean,
  phase4CAReadinessPass: boolean,
): GeneralizedForceMapperReadinessSection {
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path);
  const sourceRefsComplete = REQUIRED_DESCRIPTOR_SOURCE_PATHS.every((sourcePath) =>
    sourcePaths.includes(sourcePath),
  );
  const decisions = protocolDescriptor.pendingOwnerDecisions;
  const pendingDecisionIds = decisions
    .filter((decision) => decision.status === "PENDING OWNER")
    .map((decision) => decision.decisionId);
  const acceptedDecision19 = protocolDescriptor.acceptedOwnerDecisionEvidence.find(
    (decision) => decision.decisionId === 19,
  );
  const ok =
    protocolDescriptor.protocolSetId === GENERALIZED_FORCE_MAPPER_PHASE4C_B_PROTOCOL_SET_ID
    && protocolDescriptor.phase === GENERALIZED_FORCE_MAPPER_PHASE4C_B_PHASE
    && protocolDescriptor.claimBoundary === GENERALIZED_FORCE_MAPPER_PHASE4C_B_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === GENERALIZED_FORCE_MAPPER_PHASE4C_B_EVIDENCE_STATUS
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && protocolDescriptor.decision4Status === "PENDING OWNER"
    && protocolDescriptor.decision5Status === "PENDING OWNER"
    && protocolDescriptor.decision6Status === "PENDING OWNER"
    && protocolDescriptor.decision8Status === "PENDING OWNER"
    && protocolDescriptor.decision19Status === "ACCEPTED"
    && protocolDescriptor.decision19ReuseStatus === "accepted-owner-selection-read-only"
    && [4, 5, 6, 8].every((decisionId) => pendingDecisionIds.includes(decisionId))
    && acceptedDecision19?.status === "ACCEPTED"
    && acceptedDecision19?.selectedCandidateId === ownerSelection.selectedCandidateId
    && acceptedDecision19?.selectedBackend === ownerSelection.selectedBackend
    && acceptedDecision19?.reusePolicy === "read-only"
    && ownerSelection.status === "ACCEPTED"
    && sourceRefsComplete
    && phase3BClosurePass
    && phase4BAReadinessPass
    && phase4BBReadinessPass
    && phase4CAReadinessPass
    && phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper === false;
  return section("source-decision-boundary-v1", ok, {
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    pendingDecisionIds,
    decision19Status: protocolDescriptor.decision19Status,
    decision19SelectedCandidateId: ownerSelection.selectedCandidateId,
    decision19SelectedBackend: ownerSelection.selectedBackend,
    sourceRefsComplete,
    phase3BClosurePass,
    phase4BAReadinessPass,
    phase4BBReadinessPass,
    phase4CAReadinessPass,
    phase4CAEnableMultiCoordinateGeneralizedForceMapper:
      phase4CADescriptor.protocolSettings.enableMultiCoordinateGeneralizedForceMapper,
  });
}

function contributionDecompositionSection(
  mapperEvidence: GeneralizedForceMapperEvidence,
): GeneralizedForceMapperReadinessSection {
  return section("contribution-decomposition-v1", mapperEvidence.contributionDecompositionPass, {
    sampleCount: mapperEvidence.samples.length,
    contributionSumResidualMaxAbs: Math.max(
      ...mapperEvidence.samples.map((sample) => sample.contributionSumResidualMaxAbs),
    ),
    zeroDerivativeExactZero: mapperEvidence.zeroDerivativeExactZero,
  });
}

function virtualPowerClosureSection(
  mapperEvidence: GeneralizedForceMapperEvidence,
): GeneralizedForceMapperReadinessSection {
  return section(
    "multi-coordinate-virtual-power-closure-v1",
    mapperEvidence.maxVirtualPowerResidualAbsW <= mapperEvidence.virtualPowerResidualToleranceW
      && mapperEvidence.directionalClosure.pass
      && mapperEvidence.multiCoordinateExplicitRatesCovered
      && mapperEvidence.singleCoordinateDerivedRateCovered,
    {
      maxVirtualPowerResidualAbsW: mapperEvidence.maxVirtualPowerResidualAbsW,
      toleranceW: mapperEvidence.virtualPowerResidualToleranceW,
      directionalClosureMaxResidualAbsW: mapperEvidence.directionalClosure.maxResidualAbsW,
      directionalClosureDirectionIds: mapperEvidence.directionalClosure.directionIds,
      multiCoordinateExplicitRatesCovered: mapperEvidence.multiCoordinateExplicitRatesCovered,
      singleCoordinateDerivedRateCovered: mapperEvidence.singleCoordinateDerivedRateCovered,
    },
  );
}

function unitPressureMapSection(
  mapperEvidence: GeneralizedForceMapperEvidence,
): GeneralizedForceMapperReadinessSection {
  return section("unit-pressure-map-boundary-v1", mapperEvidence.pressureMapVolumeOnly, {
    pressureMapVolumeOnly: mapperEvidence.pressureMapVolumeOnly,
    samplePressureKeys: mapperEvidence.samples.map((sample) =>
      Object.keys(sample.volumeCoordinatePressurePa ?? {})
    ),
  });
}

function priorGateReadOnlySection(
  phase3BClosurePass: boolean,
  phase4BAReadinessPass: boolean,
  phase4BBReadinessPass: boolean,
  phase4CAReadinessPass: boolean,
): GeneralizedForceMapperReadinessSection {
  const settings = protocolDescriptor.protocolSettings;
  const ok =
    settings.phase3BReusePolicy === "read-only"
    && settings.phase4BAReusePolicy === "read-only"
    && settings.phase4BBReusePolicy === "read-only"
    && settings.phase4CAReusePolicy === "read-only"
    && phase3BClosurePass
    && phase4BAReadinessPass
    && phase4BBReadinessPass
    && phase4CAReadinessPass;
  return section("prior-gate-read-only-evidence-v1", ok, {
    phase3BReusePolicy: settings.phase3BReusePolicy,
    phase4BAReusePolicy: settings.phase4BAReusePolicy,
    phase4BBReusePolicy: settings.phase4BBReusePolicy,
    phase4CAReusePolicy: settings.phase4CAReusePolicy,
    phase3BClosurePass,
    phase4BAReadinessPass,
    phase4BBReadinessPass,
    phase4CAReadinessPass,
  });
}

function nonCoverageTriSegBoundarySection(): GeneralizedForceMapperReadinessSection {
  const descriptorText = deepText(protocolDescriptor);
  const ok =
    /Official morphology[^.]*not covered/i.test(descriptorText)
    && /Atrial bridge selection[^.]*not covered/i.test(descriptorText)
    && /RV pressure overload[^.]*not covered/i.test(descriptorText)
    && /Septal bowing[^.]*not covered/i.test(descriptorText)
    && /Ventricular interdependence[^.]*not covered/i.test(descriptorText)
    && /Right-heart failure[^.]*not covered/i.test(descriptorText)
    && /triseg-lite-compatible/i.test(descriptorText)
    && /full-triseg-compatible/i.test(descriptorText)
    && /full TriSeg/i.test(descriptorText);
  return section("noncoverage-triseg-boundary-v1", ok, {
    officialMorphologyOutcome: protocolDescriptor.claimExclusions.officialMorphologyOutcome,
    atrialBridgeSelection: protocolDescriptor.claimExclusions.atrialBridgeSelection,
    RVPressureOverloadCoverage: protocolDescriptor.claimExclusions.RVPressureOverloadCoverage,
    septalBowingCoverage: protocolDescriptor.claimExclusions.septalBowingCoverage,
    ventricularInterdependenceCoverage:
      protocolDescriptor.claimExclusions.ventricularInterdependenceCoverage,
    rightHeartFailureCoverage: protocolDescriptor.claimExclusions.rightHeartFailureCoverage,
    trisegLiteCandidateId: protocolDescriptor.futureTriSegPath.trisegLiteCandidateId,
    fullTrisegCompatibleCandidateId:
      protocolDescriptor.futureTriSegPath.fullTrisegCompatibleCandidateId,
  });
}

function deterministicReplaySection(): GeneralizedForceMapperReadinessSection {
  const firstHash = stableHash(sanitizeForStableHash(buildMapperEvidence()));
  const secondHash = stableHash(sanitizeForStableHash(buildMapperEvidence()));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function reportClaimExclusions():
  GeneralizedForceMapperReadinessReport["claimExclusions"] {
  return {
    productionMechanics: "not-claimed",
    productionHomogenization: "not-claimed",
    productionPassiveLaw: "not-claimed",
    officialMorphologyOutcome: "not-claimed",
    liveRuntimeReplacement: "not-claimed",
    productionRuntimeAcceptance: "not-claimed",
    ModelCoreChamberWiring: "not-claimed",
    officialCaseWiring: "not-claimed",
    workbenchWiring: "not-claimed",
    atrialBridgeSelection: "not-claimed",
    RVPressureOverloadCoverage: "not-claimed",
    septalBowingCoverage: "not-claimed",
    ventricularInterdependenceCoverage: "not-claimed",
    rightHeartFailureCoverage: "not-claimed",
  };
}

function reportFutureTriSegPath():
  GeneralizedForceMapperReadinessReport["futureTriSegPath"] {
  return {
    trisegLiteCandidateId: "triseg-lite-compatible",
    fullTrisegCompatibleCandidateId: "full-triseg-compatible",
    fullTriSegPath:
      "A full TriSeg escalation path remains preserved before RV pressure overload, septal bowing, ventricular interdependence, or right-heart failure are claimed as covered primary mechanisms.",
  };
}

function directionalClosureSummary(
  samples: readonly GeneralizedForceMapperSyntheticSample[],
): GeneralizedForceMapperEvidence["directionalClosure"] {
  const residuals = samples.flatMap((sample) =>
    directionVectors(sample.coordinateIds.length).map((direction) =>
      directionalClosureResidualAbs(sample, direction.values)
    )
  );
  const maxResidualAbsW = Math.max(...residuals);
  return {
    pass: maxResidualAbsW <= DIRECTIONAL_RESIDUAL_TOLERANCE_W,
    maxResidualAbsW,
    toleranceW: DIRECTIONAL_RESIDUAL_TOLERANCE_W,
    directionIds: directionVectors(3).map((direction) => direction.id),
  };
}

function directionalClosureResidualAbs(
  sample: GeneralizedForceMapperSyntheticSample,
  direction: readonly number[],
): number {
  const scale = stressScaleSI(sample);
  const generalizedWork = sample.conjugateForcesSI.reduce(
    (sum, force, index) => sum + force * direction[index],
    0,
  );
  const strainDirection = sample.dStrainDCoordinate.reduce(
    (sum, derivative, index) => sum + derivative * direction[index],
    0,
  );
  return Math.abs(generalizedWork - scale * strainDirection);
}

function stressScaleSI(sample: GeneralizedForceMapperSyntheticSample): number {
  const index = sample.dStrainDCoordinate.findIndex((derivative) => derivative !== 0);
  return index === -1 ? 0 : sample.conjugateForcesSI[index] / sample.dStrainDCoordinate[index];
}

function directionVectors(length: number): readonly { readonly id: string; readonly values: readonly number[] }[] {
  return [
    {
      id: "alternating-unit",
      values: Array.from({ length }, (_, index) => (index % 2 === 0 ? 1 : -1)),
    },
    {
      id: "seeded-fractional",
      values: Array.from({ length }, (_, index) => (((index + 2) * 17) % 23) / 10 - 1.1),
    },
  ];
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, unknown>,
): GeneralizedForceMapperReadinessSection {
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
