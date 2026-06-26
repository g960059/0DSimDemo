import phase3ADescriptor from "@/data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json";
import protocolDescriptor from "@/data/myocardium/protocols/identity-force-phase3b-protocols.json";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  IdentityFiberNominalV1,
} from "@/engine/myocardium/homogenization";
import {
  THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_V1_ID,
  ThickSphereSpikeV1,
} from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import type { LandSourceOutput } from "@/engine/myocardium/myofilament/land2017/types";
import {
  VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
  ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
  VirtualPowerNominalEngineeringV1,
} from "@/engine/myocardium/mechanics/virtualPowerNominalEngineeringV1";

export const IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY =
  "identity-homogenization-single-coordinate-force-only";
export const IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS =
  "synthetic-virtual-power-closure-only";

export type IdentityForcePhase3BProtocolStatus =
  | "closure-pass"
  | "closure-fail"
  | "deferred-target";

export type IdentityForcePhase3BMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[];

export type IdentityForcePhase3BProtocolSection = {
  readonly id: string;
  readonly status: IdentityForcePhase3BProtocolStatus;
  readonly metrics: Record<string, IdentityForcePhase3BMetricValue>;
};

export type IdentityForcePhase3BReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly modelIds: {
    readonly homogenizationModelId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
    readonly generalizedForceModelId: typeof VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID;
    readonly kinematicsModelId: typeof THICK_SPHERE_SPIKE_V1_ID;
    readonly passiveFixtureId: typeof ZERO_PASSIVE_MATERIAL_FIXTURE_ID;
  };
  readonly samples: readonly IdentityForcePhase3BSample[];
  readonly sections: readonly IdentityForcePhase3BProtocolSection[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

export type IdentityForcePhase3BSample = {
  readonly id: string;
  readonly cavityVolumeM3: number;
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveNominalStressPa: number;
  readonly dStrainDVolume: number;
  readonly activeContributionSI: number;
  readonly passiveContributionSI: number;
  readonly viscousContributionSI: number;
  readonly conjugateForceSI: number;
  readonly volumeCoordinatePressurePa: number;
  readonly virtualPowerResidualW: number;
  readonly finiteDifferenceVirtualWorkResidualAbs: number;
};

const SOURCE_HEALTH = Object.freeze({
  finite: true,
  stateConservationResidual: 0,
  minimumPopulation: 0.01,
  projectionUsed: false,
});

type IdentityForcePhase3BSampleDefinition = {
  readonly id: string;
  readonly cavityVolumeM3: number;
  readonly rateSI: number;
  readonly sourceActiveFiberStressPa: number;
  readonly stabilizationStiffnessPa: number;
  readonly algorithmicTangentPa?: number;
};

const SAMPLE_DEFINITIONS: readonly IdentityForcePhase3BSampleDefinition[] = Object.freeze([
  {
    id: "low-volume-positive-rate",
    cavityVolumeM3: 7.5e-5,
    rateSI: 1.5e-4,
    sourceActiveFiberStressPa: 28000,
    stabilizationStiffnessPa: 41000,
  },
  {
    id: "anchor-volume-negative-rate",
    cavityVolumeM3: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET.anchorCavityVolumeM3,
    rateSI: -2.5e-4,
    sourceActiveFiberStressPa: 42000,
    stabilizationStiffnessPa: 53000,
    algorithmicTangentPa: 61000,
  },
  {
    id: "high-volume-zero-rate",
    cavityVolumeM3: 1.45e-4,
    rateSI: 0,
    sourceActiveFiberStressPa: 35000,
    stabilizationStiffnessPa: 47000,
  },
] as const);

export function runIdentityForcePhase3BReport(): IdentityForcePhase3BReport {
  const samples = SAMPLE_DEFINITIONS.map(runSample);
  const sections: IdentityForcePhase3BProtocolSection[] = [
    runDescriptorBoundarySection(),
    runIdentityHomogenizationSection(samples),
    runContributionDecompositionSection(samples),
    runVirtualPowerClosureSection(samples),
    runFiniteDifferenceVirtualWorkSection(samples),
    runUnitsSignConventionSection(samples),
    runDeterministicReplaySection(),
    runIntegrationBoundarySection(),
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
    samples: samples.map(compactSample),
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
  };

  return {
    protocolSetId: protocolDescriptor.protocolSetId,
    claimBoundary: IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY,
    evidenceStatus: IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    modelIds: {
      homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
      generalizedForceModelId: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
      kinematicsModelId: THICK_SPHERE_SPIKE_V1_ID,
      passiveFixtureId: ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
    },
    samples,
    sections,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

function runSample(definition: IdentityForcePhase3BSampleDefinition): IdentityForcePhase3BSample {
  const kinematics = ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI: definition.cavityVolumeM3,
          previousValueSI: definition.cavityVolumeM3,
          rateSI: definition.rateSI,
          unit: "m3",
        },
      ],
      instance: { moduleId: "mechanics", instanceId: definition.id },
    },
    THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  );
  const source = syntheticLandSource(definition);
  const active = IdentityFiberNominalV1.evaluate(
    {
      source,
      instance: { moduleId: "homogenization", instanceId: definition.id },
      wallReferenceVolumeM3: kinematics.wallReferenceVolumeM3,
    },
    IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  );
  const force = VirtualPowerNominalEngineeringV1.evaluate({
    kinematics,
    active,
    passive: ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
  });
  return {
    id: definition.id,
    cavityVolumeM3: definition.cavityVolumeM3,
    sourceActiveFiberStressPa: source.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: active.wallActiveNominalStressPa,
    dStrainDVolume: kinematics.dStrainDCoordinate[0],
    activeContributionSI: force.activeContributionsSI[0],
    passiveContributionSI: force.passiveContributionsSI[0],
    viscousContributionSI: force.viscousContributionsSI[0],
    conjugateForceSI: force.conjugateForcesSI[0],
    volumeCoordinatePressurePa: force.volumeCoordinatePressurePa?.[THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID] ?? Number.NaN,
    virtualPowerResidualW: force.virtualPowerResidualW,
    finiteDifferenceVirtualWorkResidualAbs: finiteDifferenceVirtualWorkResidual(
      definition.cavityVolumeM3,
      active.wallActiveNominalStressPa,
    ),
  };
}

function syntheticLandSource(definition: IdentityForcePhase3BSampleDefinition): LandSourceOutput {
  return {
    sourceActiveFiberStressPa: definition.sourceActiveFiberStressPa,
    sourceStressConvention: "land2017-Ta",
    stabilizationStiffnessPa: definition.stabilizationStiffnessPa,
    ...(definition.algorithmicTangentPa === undefined
      ? {}
      : { algorithmicTangentPa: definition.algorithmicTangentPa }),
    sourceActivePowerDensityWPerM3: definition.sourceActiveFiberStressPa * 0.2,
    health: SOURCE_HEALTH,
  };
}

function runDescriptorBoundarySection(): IdentityForcePhase3BProtocolSection {
  const decisionIds = protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId);
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path).filter(Boolean);
  const ok =
    protocolDescriptor.protocolSetId === "identity-force-phase3b-protocols-v1"
    && protocolDescriptor.artifact.id === "identity-force-phase3b-protocols-v1"
    && protocolDescriptor.phase === "Phase 3B"
    && protocolDescriptor.claimBoundary === IDENTITY_FORCE_PHASE3B_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === IDENTITY_FORCE_PHASE3B_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && [4, 5, 6, 8, 19].every((decisionId) => decisionIds.includes(decisionId))
    && sourcePaths.includes("docs/myocardium/model-spec/myocardium-land-v1.md")
    && sourcePaths.includes("docs/myocardium/verification/myocardium-v1-verification.md")
    && sourcePaths.includes("docs/myocardium/roadmap/myocardium-rebuild-roadmap.md")
    && sourcePaths.includes("data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json")
    && sourcePaths.includes("data/myocardium/protocols/land2017-phase1c-source-protocols.json")
    && phase3ADescriptor.claimBoundary === "fixed-thick-sphere-kinematics-only";
  return section("descriptor-boundary-v1", ok, {
    protocolSetId: protocolDescriptor.protocolSetId,
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    pendingOwnerDecisionIds: decisionIds,
  });
}

function runIdentityHomogenizationSection(
  samples: readonly IdentityForcePhase3BSample[],
): IdentityForcePhase3BProtocolSection {
  const residuals = samples.map((sample) =>
    Math.abs(sample.wallActiveNominalStressPa - sample.sourceActiveFiberStressPa),
  );
  const maxStressPassThroughResidualPa = Math.max(...residuals);
  const ok =
    maxStressPassThroughResidualPa === 0
    && IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction === 1
    && IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain === false
    && IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop === false;
  return section("identity-homogenization-closure-v1", ok, {
    maxStressPassThroughResidualPa,
    activeTissueFraction: IDENTITY_FIBER_NOMINAL_V1_PARAMS.activeTissueFraction,
    allowFreeGain: IDENTITY_FIBER_NOMINAL_V1_PARAMS.allowFreeGain,
    fitToPVLoop: IDENTITY_FIBER_NOMINAL_V1_PARAMS.fitToPVLoop,
    homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
  });
}

function runContributionDecompositionSection(
  samples: readonly IdentityForcePhase3BSample[],
): IdentityForcePhase3BProtocolSection {
  const maxResidual = Math.max(...samples.map((sample) =>
    Math.abs(
      sample.conjugateForceSI
      - sample.activeContributionSI
      - sample.passiveContributionSI
      - sample.viscousContributionSI,
    ),
  ));
  const zeroPassiveViscous = samples.every((sample) =>
    sample.passiveContributionSI === 0 && sample.viscousContributionSI === 0,
  );
  return section("contribution-decomposition-v1", maxResidual <= 1e-12 && zeroPassiveViscous, {
    maxContributionResidualSI: maxResidual,
    zeroPassiveViscous,
    passiveFixtureId: ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
  });
}

function runVirtualPowerClosureSection(
  samples: readonly IdentityForcePhase3BSample[],
): IdentityForcePhase3BProtocolSection {
  const maxVirtualPowerResidualAbsW = Math.max(...samples.map((sample) =>
    Math.abs(sample.virtualPowerResidualW),
  ));
  return section("virtual-power-closure-v1", maxVirtualPowerResidualAbsW <= 1e-12, {
    maxVirtualPowerResidualAbsW,
    sampleCount: samples.length,
    generalizedForceModelId: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  });
}

function runFiniteDifferenceVirtualWorkSection(
  samples: readonly IdentityForcePhase3BSample[],
): IdentityForcePhase3BProtocolSection {
  const maxFiniteDifferenceVirtualWorkResidualAbs =
    Math.max(...samples.map((sample) => sample.finiteDifferenceVirtualWorkResidualAbs));
  return section("finite-difference-virtual-work-v1", maxFiniteDifferenceVirtualWorkResidualAbs <= 2e-6, {
    maxFiniteDifferenceVirtualWorkResidualAbs,
    tolerance: 2e-6,
    sampleCount: samples.length,
  });
}

function runUnitsSignConventionSection(
  samples: readonly IdentityForcePhase3BSample[],
): IdentityForcePhase3BProtocolSection {
  const pressureMirrorsForce = samples.every((sample) =>
    sample.volumeCoordinatePressurePa === sample.conjugateForceSI,
  );
  const finite = samples.every((sample) =>
    Number.isFinite(sample.conjugateForceSI)
    && Number.isFinite(sample.volumeCoordinatePressurePa)
    && sample.dStrainDVolume > 0,
  );
  return section("units-sign-convention-v1", pressureMirrorsForce && finite, {
    pressureMirrorsForce,
    finite,
    coordinateId: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
    volumeCoordinateForceUnit: "Pa",
    pressureInterpretation: "internal-virtual-power-conjugate-only",
  });
}

function runDeterministicReplaySection(): IdentityForcePhase3BProtocolSection {
  const first = SAMPLE_DEFINITIONS.map(runSample).map(compactSample);
  const second = SAMPLE_DEFINITIONS.map(runSample).map(compactSample);
  const firstHash = stableHash(sanitizeForStableHash(first));
  const secondHash = stableHash(sanitizeForStableHash(second));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function runIntegrationBoundarySection(): IdentityForcePhase3BProtocolSection {
  return section("integration-boundary-v1", true, {
    modelCoreIntegration: false,
    chamberRuntimeIntegration: false,
    afterloadFamily: "deferred-to-phase3c",
    loadedPressureOutcome: "not-claimed",
  });
}

function finiteDifferenceVirtualWorkResidual(cavityVolumeM3: number, stressPa: number): number {
  const params = THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
  const h = Math.min(
    cavityVolumeM3 * 1e-5,
    (cavityVolumeM3 - params.sweepCavityVolumeMinM3) * 0.25,
    (params.sweepCavityVolumeMaxM3 - cavityVolumeM3) * 0.25,
  );
  const base = ThickSphereSpikeV1.evaluate(
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
      instance: { moduleId: "mechanics", instanceId: "virtual-work-base" },
    },
    params,
  );
  const plus = ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI: cavityVolumeM3 + h,
          previousValueSI: cavityVolumeM3,
          rateSI: 0,
          unit: "m3",
        },
      ],
      instance: { moduleId: "mechanics", instanceId: "virtual-work-plus" },
    },
    params,
  );
  const minus = ThickSphereSpikeV1.evaluate(
    {
      coordinates: [
        {
          id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
          valueSI: cavityVolumeM3 - h,
          previousValueSI: cavityVolumeM3,
          rateSI: 0,
          unit: "m3",
        },
      ],
      instance: { moduleId: "mechanics", instanceId: "virtual-work-minus" },
    },
    params,
  );
  const force = params.wallReferenceVolumeM3 * stressPa * base.dStrainDCoordinate[0];
  const virtualWorkLeft = force * (2 * h);
  const virtualWorkRight =
    params.wallReferenceVolumeM3 * stressPa * (plus.fiberEngineeringStrain - minus.fiberEngineeringStrain);
  return Math.abs(virtualWorkLeft - virtualWorkRight);
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, IdentityForcePhase3BMetricValue>,
): IdentityForcePhase3BProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function compactSample(sample: IdentityForcePhase3BSample): unknown {
  return {
    id: sample.id,
    cavityVolumeM3: sample.cavityVolumeM3,
    sourceActiveFiberStressPa: sample.sourceActiveFiberStressPa,
    wallActiveNominalStressPa: sample.wallActiveNominalStressPa,
    dStrainDVolume: sample.dStrainDVolume,
    activeContributionSI: sample.activeContributionSI,
    passiveContributionSI: sample.passiveContributionSI,
    viscousContributionSI: sample.viscousContributionSI,
    conjugateForceSI: sample.conjugateForceSI,
    virtualPowerResidualW: sample.virtualPowerResidualW,
    finiteDifferenceVirtualWorkResidualAbs: sample.finiteDifferenceVirtualWorkResidualAbs,
  };
}
