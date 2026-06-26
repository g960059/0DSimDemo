import protocolDescriptor from "@/data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json";
import {
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET,
  PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
  evaluatePrescribedCalciumOutput,
  stepPrescribedCalciumTransientV1,
  type PrescribedCalciumInput,
  type PrescribedCalciumParams,
} from "@/engine/myocardium/calcium";
import {
  IDENTITY_FIBER_NOMINAL_V1_ID,
  IDENTITY_FIBER_NOMINAL_V1_PARAMS,
  IdentityFiberNominalV1,
} from "@/engine/myocardium/homogenization";
import {
  THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET,
  THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
  THICK_SPHERE_SPIKE_V1_ID,
  ThickSphereSpikeV1,
  type ThickSphereSpikeV1ParameterSet,
} from "@/engine/myocardium/kinematics";
import { sanitizeForStableHash, stableHash } from "@/engine/myocardium/kinematics/stableHash";
import {
  VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
  ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
  ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
  VirtualPowerNominalEngineeringV1,
} from "@/engine/myocardium/mechanics";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
  solveLand2017BackwardEulerSubsteps,
  type Land2017SubstepSolveOptions,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY =
  "minimal-loaded-afterload-family-smoke-only";
export const MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS =
  "synthetic-d0-afterload-family-only";
export const TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID = "two-element-afterload-v1";

export const MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS = [
  "afterload-low",
  "afterload-normal",
  "afterload-high",
] as const;

export type MinimalLoadedAfterloadMemberId =
  (typeof MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS)[number];

export type MinimalLoadedAfterloadProtocolStatus =
  | "closure-pass"
  | "closure-fail"
  | "deferred-target";

export type MinimalLoadedAfterloadMetricValue =
  | number
  | string
  | boolean
  | readonly number[]
  | readonly string[]
  | readonly boolean[];

export type MinimalLoadedAfterloadProtocolSection = {
  readonly id: string;
  readonly status: MinimalLoadedAfterloadProtocolStatus;
  readonly metrics: Record<string, MinimalLoadedAfterloadMetricValue>;
};

export type MinimalLoadedAfterloadParameters = {
  readonly resistancePaSecPerM3: number;
  readonly complianceM3PerPa: number;
  readonly initialAfterloadPressurePa: number;
};

export type MinimalLoadedAfterloadMemberDefinition = {
  readonly id: MinimalLoadedAfterloadMemberId;
  readonly afterloadModelId: typeof TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID;
  readonly parameters: MinimalLoadedAfterloadParameters;
  readonly fixedProtocolSettings: MinimalLoadedAfterloadFixedProtocolSettings;
};

export type MinimalLoadedAfterloadFixedProtocolSettings = {
  readonly anatomyParameterSetId: typeof THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID;
  readonly kinematicsModelId: typeof THICK_SPHERE_SPIKE_V1_ID;
  readonly calciumParameterSetId: typeof PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID;
  readonly landParameterSetId: typeof LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID;
  readonly homogenizationModelId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
  readonly generalizedForceModelId: typeof VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID;
  readonly passiveFixtureId: typeof ZERO_PASSIVE_MATERIAL_FIXTURE_ID;
  readonly afterloadModelId: typeof TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID;
  readonly initialCavityVolumeM3: number;
  readonly dtSec: number;
  readonly durationSec: number;
  readonly cycleLengthSec: number;
  readonly activationStrength01: 1;
  readonly useDynamicValve: false;
  readonly useQDotClamp: false;
  readonly useTBVProjection: false;
  readonly allowFreeGeometryScale: false;
  readonly allowFreeHomogenizationGain: false;
  readonly useProductionMechanics: false;
  readonly usePassiveLawAcceptance: false;
  readonly useSeptalPericardialCoupling: false;
  readonly useClosedLoopSteadyState: false;
};

export type MinimalLoadedAfterloadSample = {
  readonly timeSec: number;
  readonly previousCavityVolumeM3: number;
  readonly cavityVolumeM3: number;
  readonly nextCavityVolumeM3: number;
  readonly afterloadPressurePa: number;
  readonly nextAfterloadPressurePa: number;
  readonly internalPressurePa: number;
  readonly resistorFlowM3PerSec: number;
  readonly freeCalciumUM: number;
  readonly previousFiberEngineeringStrain: number;
  readonly stageFiberEngineeringStrain: number;
  readonly dtSec: number;
  readonly derivedFiberEngineeringStrainRatePerSec: number;
  readonly rateAuditResidualPerSec: number;
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveNominalStressPa: number;
  readonly sourceActivePowerDensityWPerM3: number;
  readonly virtualPowerResidualW: number;
  readonly stateConservationResidual: number;
  readonly minimumPopulation: number;
  readonly landHealthFinite: boolean;
  readonly projectionUsed: boolean;
  readonly inCalibrationDomain: boolean;
  readonly kinematicsFinite: boolean;
  readonly solverIterations: number;
  readonly solverResidualNorm: number;
  readonly solverSubsteps: number;
};

export type MinimalLoadedAfterloadMemberMetrics = {
  readonly peakInternalPressurePa: number;
  readonly minInternalPressurePa: number;
  readonly meanInternalPressurePa: number;
  readonly peakAfterloadPressurePa: number;
  readonly meanAfterloadPressurePa: number;
  readonly strokeVolumeM3: number;
  readonly ejectionLikeWorkJ: number;
  readonly forwardFlowDurationMs: number;
  readonly minFiberEngineeringStrain: number;
  readonly maxFiberEngineeringStrain: number;
  readonly peakSourceActiveFiberStressPa: number;
  readonly peakWallActiveNominalStressPa: number;
  readonly maxVirtualPowerResidualW: number;
  readonly solverFailureCount: number;
  readonly maxConservationResidual: number;
  readonly maxRateAuditResidualPerSec: number;
  readonly backflowVolumeM3: number;
  readonly backflowDurationMs: number;
  readonly samples: number;
};

export type MinimalLoadedAfterloadMemberResult = {
  readonly id: MinimalLoadedAfterloadMemberId;
  readonly definition: MinimalLoadedAfterloadMemberDefinition;
  readonly ok: boolean;
  readonly samples: readonly MinimalLoadedAfterloadSample[];
  readonly metrics: MinimalLoadedAfterloadMemberMetrics;
  readonly finalCavityVolumeM3: number;
  readonly finalAfterloadPressurePa: number;
  readonly finalLandState: Float64Array;
  readonly finalCalciumState: Float64Array;
  readonly failureReason?: string;
  readonly failureMessage?: string;
};

export type MinimalLoadedAfterloadProtocolReport = {
  readonly protocolSetId: string;
  readonly claimBoundary: typeof MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY;
  readonly evidenceStatus: typeof MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS;
  readonly experimentalTargets: "deferred";
  readonly ownerAcceptanceStatus: "not-owner-acceptance";
  readonly phaseOwnerGateStatus: "not-recorded";
  readonly modelIds: {
    readonly calciumModelId: "prescribed-calcium-transient-v1";
    readonly landModelId: "land2017-myofilament-v1";
    readonly kinematicsModelId: typeof THICK_SPHERE_SPIKE_V1_ID;
    readonly homogenizationModelId: typeof IDENTITY_FIBER_NOMINAL_V1_ID;
    readonly generalizedForceModelId: typeof VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID;
    readonly passiveFixtureId: typeof ZERO_PASSIVE_MATERIAL_FIXTURE_ID;
    readonly afterloadModelId: typeof TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID;
  };
  readonly fixedProtocolSettings: MinimalLoadedAfterloadFixedProtocolSettings;
  readonly fixedSettingsStableHash: string;
  readonly familyMembers: readonly MinimalLoadedAfterloadMemberDefinition[];
  readonly memberResults: readonly MinimalLoadedAfterloadMemberResult[];
  readonly sections: readonly MinimalLoadedAfterloadProtocolSection[];
  readonly closurePass: boolean;
  readonly stableSummaryHash: string;
};

export type MinimalLoadedAfterloadRunOptions = {
  readonly calciumParams?: PrescribedCalciumParams;
  readonly anatomyParams?: ThickSphereSpikeV1ParameterSet;
  readonly initialLandState?: ArrayLike<number>;
  readonly initialCalciumState?: ArrayLike<number>;
  readonly landSolveOptions?: Land2017SubstepSolveOptions;
  readonly fixedProtocolSettings?: MinimalLoadedAfterloadFixedProtocolSettings;
  readonly family?: readonly MinimalLoadedAfterloadMemberDefinition[];
};

const DEFAULT_INITIAL_LAND_STATE = Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]);
const DEFAULT_INITIAL_CALCIUM_STATE = Float64Array.from([0, 0]);
const DEFAULT_LAND_SOLVE_OPTIONS: Land2017SubstepSolveOptions = {
  maxIterations: 16,
  residualTolerance: 1e-8,
  lineSearchMinStep: 1 / 2048,
  substeps: 4,
};
const HEALTH_TOLERANCES = Object.freeze({
  maxVirtualPowerResidualW: 1e-10,
  maxConservationResidual: 1e-10,
  maxRateAuditResidualPerSec: 1e-12,
});

export const MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS:
  MinimalLoadedAfterloadFixedProtocolSettings = Object.freeze({
    anatomyParameterSetId: THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET_ID,
    kinematicsModelId: THICK_SPHERE_SPIKE_V1_ID,
    calciumParameterSetId: PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET_ID,
    landParameterSetId: LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET_ID,
    homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
    generalizedForceModelId: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
    passiveFixtureId: ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
    afterloadModelId: TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
    initialCavityVolumeM3: 1.38e-4,
    dtSec: 0.001,
    durationSec: 0.8,
    cycleLengthSec: 0.8,
    activationStrength01: 1,
    useDynamicValve: false,
    useQDotClamp: false,
    useTBVProjection: false,
    allowFreeGeometryScale: false,
    allowFreeHomogenizationGain: false,
    useProductionMechanics: false,
    usePassiveLawAcceptance: false,
    useSeptalPericardialCoupling: false,
    useClosedLoopSteadyState: false,
  });

export const MINIMAL_LOADED_AFTERLOAD_FAMILY:
  readonly MinimalLoadedAfterloadMemberDefinition[] = Object.freeze([
    afterloadMember("afterload-low", {
      resistancePaSecPerM3: 1.45e8,
      complianceM3PerPa: 1.8e-8,
      initialAfterloadPressurePa: 1800,
    }),
    afterloadMember("afterload-normal", {
      resistancePaSecPerM3: 1.9e8,
      complianceM3PerPa: 1.35e-8,
      initialAfterloadPressurePa: 3200,
    }),
    afterloadMember("afterload-high", {
      resistancePaSecPerM3: 2.55e8,
      complianceM3PerPa: 1.05e-8,
      initialAfterloadPressurePa: 4700,
    }),
  ]);

export function runMinimalLoadedAfterloadFamilyPhase3CReport(
  options: MinimalLoadedAfterloadRunOptions = {},
): MinimalLoadedAfterloadProtocolReport {
  const fixedSettings = options.fixedProtocolSettings ?? MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS;
  const familyMembers = options.family ?? MINIMAL_LOADED_AFTERLOAD_FAMILY;
  const fixedSettingsStableHash = stableHash(sanitizeForStableHash(fixedSettings));
  const memberResults = runMinimalLoadedAfterloadFamily(options);
  const sections: MinimalLoadedAfterloadProtocolSection[] = [
    runDescriptorBoundarySection(),
    runProtocolFamilyCompletionSection(memberResults, familyMembers, fixedSettingsStableHash),
    runDynamicRateConsistencySection(memberResults),
    runAfterloadOrderingSmokeSection(memberResults),
    runSourceKinematicsVirtualPowerHealthSection(memberResults),
    runForbiddenClaimBoundarySection(memberResults),
    runDeterministicReplaySection(options),
  ];
  sections.push({
    id: "deferred-owner-decisions-v1",
    status: "deferred-target",
    metrics: {
      decisionIds: protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId),
      experimentalTargets: "deferred",
      ownerAcceptanceStatus: "not-owner-acceptance",
      phaseOwnerGateStatus: "not-recorded",
    },
  });

  const closureSections = sections.filter((section) => section.status !== "deferred-target");
  const closurePass = closureSections.every((section) => section.status === "closure-pass");
  const hashInput = {
    fixedSettingsStableHash,
    members: memberResults.map(compactMemberResult),
    sections: sections.map((section) => ({
      id: section.id,
      status: section.status,
      metrics: section.metrics,
    })),
  };

  return {
    protocolSetId: protocolDescriptor.protocolSetId,
    claimBoundary: MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY,
    evidenceStatus: MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS,
    experimentalTargets: "deferred",
    ownerAcceptanceStatus: "not-owner-acceptance",
    phaseOwnerGateStatus: "not-recorded",
    modelIds: {
      calciumModelId: "prescribed-calcium-transient-v1",
      landModelId: "land2017-myofilament-v1",
      kinematicsModelId: THICK_SPHERE_SPIKE_V1_ID,
      homogenizationModelId: IDENTITY_FIBER_NOMINAL_V1_ID,
      generalizedForceModelId: VIRTUAL_POWER_NOMINAL_ENGINEERING_V1_ID,
      passiveFixtureId: ZERO_PASSIVE_MATERIAL_FIXTURE_ID,
      afterloadModelId: TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
    },
    fixedProtocolSettings: fixedSettings,
    fixedSettingsStableHash,
    familyMembers,
    memberResults,
    sections,
    closurePass,
    stableSummaryHash: stableHash(sanitizeForStableHash(hashInput)),
  };
}

export function runMinimalLoadedAfterloadFamily(
  options: MinimalLoadedAfterloadRunOptions = {},
): readonly MinimalLoadedAfterloadMemberResult[] {
  const fixedSettings = options.fixedProtocolSettings ?? MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS;
  const familyMembers = options.family ?? MINIMAL_LOADED_AFTERLOAD_FAMILY;
  return familyMembers.map((definition) => runMember(definition, fixedSettings, options));
}

function runMember(
  definition: MinimalLoadedAfterloadMemberDefinition,
  fixedSettings: MinimalLoadedAfterloadFixedProtocolSettings,
  options: MinimalLoadedAfterloadRunOptions,
): MinimalLoadedAfterloadMemberResult {
  const anatomyParams = options.anatomyParams ?? THICK_SPHERE_SPIKE_PHASE3A_CANDIDATE_PARAMETER_SET;
  const calciumParams = options.calciumParams ?? PRESCRIBED_CALCIUM_SYNTHETIC_SMOKE_PARAMETER_SET;
  const landSolveOptions = { ...DEFAULT_LAND_SOLVE_OPTIONS, ...options.landSolveOptions };
  let previousCavityVolumeM3 = fixedSettings.initialCavityVolumeM3;
  let cavityVolumeM3 = fixedSettings.initialCavityVolumeM3;
  let afterloadPressurePa = definition.parameters.initialAfterloadPressurePa;
  let calciumState = Float64Array.from(options.initialCalciumState ?? DEFAULT_INITIAL_CALCIUM_STATE);
  let landState = Float64Array.from(options.initialLandState ?? DEFAULT_INITIAL_LAND_STATE);
  let previousFreeCalciumUM = initialPrescribedFreeCalciumUM(
    calciumState,
    calciumParams,
    fixedSettings.cycleLengthSec,
    fixedSettings.dtSec,
  );
  const samples: MinimalLoadedAfterloadSample[] = [];
  const steps = Math.max(1, Math.round(fixedSettings.durationSec / fixedSettings.dtSec));

  for (let step = 1; step <= steps; step += 1) {
    const timeSec = step * fixedSettings.dtSec;
    const previousKinematics = ThickSphereSpikeV1.evaluate(
      {
        coordinates: [
          {
            id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
            valueSI: previousCavityVolumeM3,
            previousValueSI: previousCavityVolumeM3,
            rateSI: 0,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: `${definition.id}-previous` },
      },
      anatomyParams,
    );
    const currentKinematics = ThickSphereSpikeV1.evaluate(
      {
        coordinates: [
          {
            id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
            valueSI: cavityVolumeM3,
            previousValueSI: previousCavityVolumeM3,
            rateSI: (cavityVolumeM3 - previousCavityVolumeM3) / fixedSettings.dtSec,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: definition.id },
      },
      anatomyParams,
    );
    const kinematicsOk =
      previousKinematics.geometryHealth.finite
      && previousKinematics.geometryHealth.inCalibrationDomain
      && currentKinematics.geometryHealth.finite
      && currentKinematics.geometryHealth.inCalibrationDomain;
    if (!kinematicsOk) {
      return failedMember(
        definition,
        samples,
        cavityVolumeM3,
        afterloadPressurePa,
        landState,
        calciumState,
        "volume-domain-failure",
        "Phase 3A kinematics were non-finite or outside the calibration volume sweep.",
      );
    }

    const calciumStep = stepPrescribedCalciumTransientV1(
      calciumState,
      {
        targetId: "minimal-loaded-afterload-family-phase3c",
        activationEventId: 0,
        timeSinceActivationSec: timeSec,
        cycleLengthSec: fixedSettings.cycleLengthSec,
        activationStrength01: fixedSettings.activationStrength01,
        dtSec: fixedSettings.dtSec,
      },
      calciumParams,
    );
    const previousFiberEngineeringStrain = previousKinematics.fiberEngineeringStrain;
    const stageFiberEngineeringStrain = currentKinematics.fiberEngineeringStrain;
    const derivedFiberEngineeringStrainRatePerSec =
      (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / fixedSettings.dtSec;
    const landInput: LandStepInput = {
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec: fixedSettings.dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const landSolved = solveLand2017BackwardEulerSubsteps(
      landState,
      landInput,
      { ...landSolveOptions, previousFreeCalciumUM },
    );
    if (!landSolved.ok || !landSolved.output) {
      return failedMember(
        definition,
        samples,
        cavityVolumeM3,
        afterloadPressurePa,
        landState,
        calciumState,
        landSolved.failureReason ?? "land-solver-failure",
        landSolved.failureMessage ?? "Land BE solve did not produce a finite source output.",
      );
    }

    const active = IdentityFiberNominalV1.evaluate(
      {
        source: landSolved.output,
        instance: { moduleId: "homogenization", instanceId: definition.id },
        wallReferenceVolumeM3: currentKinematics.wallReferenceVolumeM3,
      },
      IDENTITY_FIBER_NOMINAL_V1_PARAMS,
    );
    const force = VirtualPowerNominalEngineeringV1.evaluate({
      kinematics: currentKinematics,
      active,
      passive: ZERO_PASSIVE_MATERIAL_PHASE3B_FIXTURE,
    });
    const internalPressurePa =
      force.volumeCoordinatePressurePa?.[THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID] ?? Number.NaN;
    const resistorFlowM3PerSec =
      (internalPressurePa - afterloadPressurePa) / definition.parameters.resistancePaSecPerM3;
    const nextCavityVolumeM3 = cavityVolumeM3 - resistorFlowM3PerSec * fixedSettings.dtSec;
    const nextAfterloadPressurePa =
      afterloadPressurePa
      + (resistorFlowM3PerSec * fixedSettings.dtSec) / definition.parameters.complianceM3PerPa;

    const sample: MinimalLoadedAfterloadSample = {
      timeSec,
      previousCavityVolumeM3,
      cavityVolumeM3,
      nextCavityVolumeM3,
      afterloadPressurePa,
      nextAfterloadPressurePa,
      internalPressurePa,
      resistorFlowM3PerSec,
      freeCalciumUM: calciumStep.output.freeCalciumUM,
      previousFiberEngineeringStrain,
      stageFiberEngineeringStrain,
      dtSec: fixedSettings.dtSec,
      derivedFiberEngineeringStrainRatePerSec,
      rateAuditResidualPerSec:
        derivedFiberEngineeringStrainRatePerSec
        - (stageFiberEngineeringStrain - previousFiberEngineeringStrain) / fixedSettings.dtSec,
      sourceActiveFiberStressPa: landSolved.output.sourceActiveFiberStressPa,
      wallActiveNominalStressPa: active.wallActiveNominalStressPa,
      sourceActivePowerDensityWPerM3: landSolved.output.sourceActivePowerDensityWPerM3,
      virtualPowerResidualW: force.virtualPowerResidualW,
      stateConservationResidual: landSolved.output.health.stateConservationResidual,
      minimumPopulation: landSolved.output.health.minimumPopulation,
      landHealthFinite: landSolved.output.health.finite,
      projectionUsed: landSolved.output.health.projectionUsed,
      inCalibrationDomain: currentKinematics.geometryHealth.inCalibrationDomain,
      kinematicsFinite: currentKinematics.geometryHealth.finite,
      solverIterations: landSolved.iterations,
      solverResidualNorm: landSolved.residualNorm,
      solverSubsteps: landSolved.substeps,
    };
    samples.push(sample);

    const nextKinematics = ThickSphereSpikeV1.evaluate(
      {
        coordinates: [
          {
            id: THICK_SPHERE_CAVITY_VOLUME_COORDINATE_ID,
            valueSI: nextCavityVolumeM3,
            previousValueSI: cavityVolumeM3,
            rateSI: (nextCavityVolumeM3 - cavityVolumeM3) / fixedSettings.dtSec,
            unit: "m3",
          },
        ],
        instance: { moduleId: "kinematics", instanceId: `${definition.id}-next` },
      },
      anatomyParams,
    );
    if (!nextKinematics.geometryHealth.finite || !nextKinematics.geometryHealth.inCalibrationDomain) {
      return failedMember(
        definition,
        samples,
        nextCavityVolumeM3,
        nextAfterloadPressurePa,
        landSolved.nextState,
        calciumStep.nextState,
        "volume-domain-failure",
        `Updated cavity volume ${nextCavityVolumeM3} left the Phase 3A sweep domain.`,
      );
    }
    if (![internalPressurePa, resistorFlowM3PerSec, nextAfterloadPressurePa].every(Number.isFinite)) {
      return failedMember(
        definition,
        samples,
        nextCavityVolumeM3,
        nextAfterloadPressurePa,
        landSolved.nextState,
        calciumStep.nextState,
        "nonfinite-loaded-state",
        "Loaded afterload update produced a non-finite pressure or flow.",
      );
    }

    previousCavityVolumeM3 = cavityVolumeM3;
    cavityVolumeM3 = nextCavityVolumeM3;
    afterloadPressurePa = nextAfterloadPressurePa;
    landState = landSolved.nextState;
    calciumState = calciumStep.nextState;
    previousFreeCalciumUM = calciumStep.output.freeCalciumUM;
  }

  return {
    id: definition.id,
    definition,
    ok: true,
    samples,
    metrics: computeMemberMetrics(samples, 0),
    finalCavityVolumeM3: cavityVolumeM3,
    finalAfterloadPressurePa: afterloadPressurePa,
    finalLandState: landState,
    finalCalciumState: calciumState,
  };
}

function runDescriptorBoundarySection(): MinimalLoadedAfterloadProtocolSection {
  const decisionIds = protocolDescriptor.pendingOwnerDecisions.map((decision) => decision.decisionId);
  const phase0DecisionIds = protocolDescriptor.phase0DecisionBoundary.map((decision) => decision.decisionId);
  const descriptorMemberIds = protocolDescriptor.protocolSettings.memberIds;
  const sourcePaths = protocolDescriptor.sourceDocuments.map((source) => source.path).filter(Boolean);
  const settings = protocolDescriptor.protocolSettings;
  const pendingOwnerDecisionSetExact = sameOrderedSet(decisionIds, [4, 5, 6, 8, 10, 12, 19]);
  const descriptorMemberIdsExact = sameOrderedSet(
    descriptorMemberIds,
    MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS,
  );
  const phase0GovernanceInputOnly =
    protocolDescriptor.phase0DecisionBoundary.length === 2
    && [14, 15].every((decisionId) => phase0DecisionIds.includes(decisionId))
    && protocolDescriptor.phase0DecisionBoundary.every(
      (decision) => decision.status === "Phase 0 accepted governance input",
    );
  const ok =
    protocolDescriptor.protocolSetId === "minimal-loaded-phase3c-afterload-protocols-v1"
    && protocolDescriptor.artifact.id === "minimal-loaded-phase3c-afterload-protocols-v1"
    && protocolDescriptor.phase === "Phase 3C"
    && protocolDescriptor.claimBoundary === MINIMAL_LOADED_AFTERLOAD_PHASE3C_CLAIM_BOUNDARY
    && protocolDescriptor.evidenceStatus === MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS
    && protocolDescriptor.experimentalTargets === "deferred"
    && protocolDescriptor.ownerAcceptanceStatus === "not-owner-acceptance"
    && protocolDescriptor.phaseOwnerGateStatus === "not-recorded"
    && pendingOwnerDecisionSetExact
    && descriptorMemberIdsExact
    && phase0GovernanceInputOnly
    && sourcePaths.includes("docs/myocardium/model-spec/myocardium-land-v1.md")
    && sourcePaths.includes("docs/myocardium/verification/myocardium-v1-verification.md")
    && sourcePaths.includes("docs/myocardium/roadmap/myocardium-rebuild-roadmap.md")
    && sourcePaths.includes("data/myocardium/protocols/thick-sphere-phase3a-kinematics-protocols.json")
    && sourcePaths.includes("data/myocardium/protocols/identity-force-phase3b-protocols.json")
    && sourcePaths.includes("data/myocardium/protocols/prescribed-calcium-phase2a-synthetic-protocols.json")
    && sourcePaths.includes("data/myocardium/protocols/land2017-phase1c-source-protocols.json")
    && protocolDescriptor.modelIds.afterloadModelId === TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID
    && settings.memberDifferencePolicy
      === "Members differ only in resistancePaSecPerM3, complianceM3PerPa, and initialAfterloadPressurePa."
    && settings.afterloadFlowLaw === "bidirectional-linear-resistor"
    && settings.flowEquation === "flowM3PerSec=(internalPressurePa-afterloadPressurePa)/resistancePaSecPerM3"
    && settings.afterloadPressureUpdate === "afterloadPressurePa += flowM3PerSec*dtSec/complianceM3PerPa"
    && settings.volumeUpdate === "cavityVolumeM3 -= flowM3PerSec*dtSec"
    && settings.useDynamicValve === false
    && settings.useQDotClamp === false
    && settings.useTBVProjection === false
    && settings.allowFreeGeometryScale === false
    && settings.allowFreeHomogenizationGain === false
    && settings.useProductionMechanics === false
    && settings.usePassiveLawAcceptance === false
    && settings.useSeptalPericardialCoupling === false
    && settings.useClosedLoopSteadyState === false
    && settings.phaseOwnerGateStatus === "not-recorded";
  return section("descriptor-boundary-v1", ok, {
    protocolSetId: protocolDescriptor.protocolSetId,
    phase: protocolDescriptor.phase,
    claimBoundary: protocolDescriptor.claimBoundary,
    evidenceStatus: protocolDescriptor.evidenceStatus,
    experimentalTargets: protocolDescriptor.experimentalTargets,
    ownerAcceptanceStatus: protocolDescriptor.ownerAcceptanceStatus,
    descriptorPhaseOwnerGateStatus: protocolDescriptor.phaseOwnerGateStatus,
    pendingOwnerDecisionIds: decisionIds,
    pendingOwnerDecisionSetExact,
    descriptorMemberIds,
    descriptorMemberIdsExact,
    phase0GovernanceInputDecisionIds: phase0DecisionIds,
    phase0GovernanceInputOnly,
    afterloadFlowLaw: settings.afterloadFlowLaw,
    memberDifferencePolicy: settings.memberDifferencePolicy,
    dynamicValve: settings.useDynamicValve,
    qDotClamp: settings.useQDotClamp,
    tbvProjection: settings.useTBVProjection,
    allowFreeGeometryScale: settings.allowFreeGeometryScale,
    allowFreeHomogenizationGain: settings.allowFreeHomogenizationGain,
    useProductionMechanics: settings.useProductionMechanics,
    usePassiveLawAcceptance: settings.usePassiveLawAcceptance,
    useSeptalPericardialCoupling: settings.useSeptalPericardialCoupling,
    useClosedLoopSteadyState: settings.useClosedLoopSteadyState,
    protocolSettingsPhaseOwnerGateStatus: settings.phaseOwnerGateStatus,
  });
}

function runProtocolFamilyCompletionSection(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
  familyMembers: readonly MinimalLoadedAfterloadMemberDefinition[],
  fixedSettingsStableHash: string,
): MinimalLoadedAfterloadProtocolSection {
  const memberIds = memberResults.map((member) => member.id);
  const expectedIds = [...MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS];
  const fixedHashes = familyMembers.map((member) =>
    stableHash(sanitizeForStableHash(member.fixedProtocolSettings)),
  );
  const allowedAfterloadFields = [
    "resistancePaSecPerM3",
    "complianceM3PerPa",
    "initialAfterloadPressurePa",
  ] as const;
  const allowedAfterloadFieldSet = new Set<string>(allowedAfterloadFields);
  const parameterKeySets = familyMembers.map((member) => Object.keys(member.parameters).sort());
  const afterloadParameterKeysOnly = parameterKeySets.every((keys) =>
    keys.length === allowedAfterloadFields.length
    && keys.every((key) => allowedAfterloadFieldSet.has(key)),
  );
  const afterloadModelIdStable = familyMembers.every(
    (member) => member.afterloadModelId === TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
  );
  const fixedSettingsEqual = fixedHashes.every((hash) => hash === fixedSettingsStableHash);
  const memberDifferenceInvariant =
    fixedSettingsEqual && afterloadModelIdStable && afterloadParameterKeysOnly;
  const onlyExpectedIds =
    memberIds.length === expectedIds.length
    && expectedIds.every((id, index) => memberIds[index] === id);
  const allMembersOk = memberResults.every((member) => member.ok);
  const allHaveSamples = memberResults.every((member) => member.metrics.samples > 0);
  return section(
    "protocol-family-completion-v1",
    onlyExpectedIds && memberDifferenceInvariant && allMembersOk && allHaveSamples,
    {
      memberIds,
      expectedMemberIds: expectedIds,
      fixedSettingsStableHash,
      fixedSettingsEqual,
      afterloadModelIdStable,
      afterloadParameterKeysOnly,
      memberDifferenceInvariant,
      allowedDifferingAfterloadFields: allowedAfterloadFields,
      parameterKeySets: parameterKeySets.map((keys) => keys.join(",")),
      allMembersOk,
      failedMemberCount: memberResults.filter((member) => !member.ok).length,
      samplesPerMember: memberResults.map((member) => member.metrics.samples),
    },
  );
}

function runDynamicRateConsistencySection(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
): MinimalLoadedAfterloadProtocolSection {
  const maxRateAuditResidual = maxMemberMetric(memberResults, "maxRateAuditResidualPerSec");
  const backflowVolumeM3 = memberResults.map((member) => member.metrics.backflowVolumeM3);
  const backflowDurationMs = memberResults.map((member) => member.metrics.backflowDurationMs);
  const allSamplesUseDerivedRate = memberResults.every((member) =>
    member.samples.every((sample) =>
      Math.abs(
        sample.derivedFiberEngineeringStrainRatePerSec
        - (sample.stageFiberEngineeringStrain - sample.previousFiberEngineeringStrain) / sample.dtSec,
      ) <= HEALTH_TOLERANCES.maxRateAuditResidualPerSec,
    ),
  );
  return section(
    "dynamic-rate-consistency-v1",
    allSamplesUseDerivedRate
      && Number.isFinite(maxRateAuditResidual)
      && maxRateAuditResidual <= HEALTH_TOLERANCES.maxRateAuditResidualPerSec,
    {
      maxRateAuditResidualPerSec: maxRateAuditResidual,
      tolerance: HEALTH_TOLERANCES.maxRateAuditResidualPerSec,
      landRateDerivedFromPreviousAndStageStrainOnly: true,
      bidirectionalLinearResistor: true,
      dynamicValve: false,
      qDotClamp: false,
      tbvProjection: false,
      backflowVolumeM3,
      backflowDurationMs,
    },
  );
}

function runAfterloadOrderingSmokeSection(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
): MinimalLoadedAfterloadProtocolSection {
  const ordered = MINIMAL_LOADED_AFTERLOAD_EXPECTED_MEMBER_IDS.map((id) =>
    requireMember(memberResults, id),
  );
  const peakAfterloadPressurePa = ordered.map((member) => member.metrics.peakAfterloadPressurePa);
  const meanAfterloadPressurePa = ordered.map((member) => member.metrics.meanAfterloadPressurePa);
  const strokeVolumeM3 = ordered.map((member) => member.metrics.strokeVolumeM3);
  const ejectionLikeWorkJ = ordered.map((member) => member.metrics.ejectionLikeWorkJ);
  const afterloadPressureOrdered =
    strictlyIncreasing(peakAfterloadPressurePa) && strictlyIncreasing(meanAfterloadPressurePa);
  const responseFinite =
    [...strokeVolumeM3, ...ejectionLikeWorkJ].every(Number.isFinite)
    && strokeVolumeM3.every((value) => value >= 0)
    && ejectionLikeWorkJ.every((value) => value >= 0);
  const responseNonDegenerate =
    !allClose(strokeVolumeM3, 1e-12) && !allClose(ejectionLikeWorkJ, 1e-9);
  return section(
    "afterload-ordering-smoke-v1",
    afterloadPressureOrdered && responseFinite && responseNonDegenerate,
    {
      memberIds: ordered.map((member) => member.id),
      peakAfterloadPressurePa,
      meanAfterloadPressurePa,
      strokeVolumeM3,
      ejectionLikeWorkJ,
      afterloadPressureOrdered,
      responseNonDegenerate,
    },
  );
}

function runSourceKinematicsVirtualPowerHealthSection(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
): MinimalLoadedAfterloadProtocolSection {
  const maxVirtualPowerResidualW = maxMemberMetric(memberResults, "maxVirtualPowerResidualW");
  const maxConservationResidual = maxMemberMetric(memberResults, "maxConservationResidual");
  const solverFailureCount = memberResults.reduce(
    (sum, member) => sum + member.metrics.solverFailureCount,
    0,
  );
  const allFiniteInDomain = memberResults.every((member) =>
    member.ok
    && member.samples.every((sample) =>
      [
        sample.internalPressurePa,
        sample.afterloadPressurePa,
        sample.nextAfterloadPressurePa,
        sample.resistorFlowM3PerSec,
        sample.cavityVolumeM3,
        sample.nextCavityVolumeM3,
        sample.sourceActiveFiberStressPa,
        sample.wallActiveNominalStressPa,
        sample.sourceActivePowerDensityWPerM3,
      ].every(Number.isFinite)
      && sample.landHealthFinite
      && sample.kinematicsFinite
      && sample.inCalibrationDomain,
    ),
  );
  const noProjection = memberResults.every((member) =>
    member.samples.every((sample) => sample.projectionUsed === false),
  );
  return section(
    "source-kinematics-virtual-power-health-v1",
    allFiniteInDomain
      && noProjection
      && solverFailureCount === 0
      && maxVirtualPowerResidualW <= HEALTH_TOLERANCES.maxVirtualPowerResidualW
      && maxConservationResidual <= HEALTH_TOLERANCES.maxConservationResidual,
    {
      allFiniteInDomain,
      noProjection,
      solverFailureCount,
      maxVirtualPowerResidualW,
      maxVirtualPowerResidualToleranceW: HEALTH_TOLERANCES.maxVirtualPowerResidualW,
      maxConservationResidual,
      maxConservationResidualTolerance: HEALTH_TOLERANCES.maxConservationResidual,
      peakSourceActiveFiberStressPa: memberResults.map((member) => member.metrics.peakSourceActiveFiberStressPa),
      peakWallActiveNominalStressPa: memberResults.map((member) => member.metrics.peakWallActiveNominalStressPa),
      minFiberEngineeringStrain: memberResults.map((member) => member.metrics.minFiberEngineeringStrain),
      maxFiberEngineeringStrain: memberResults.map((member) => member.metrics.maxFiberEngineeringStrain),
    },
  );
}

function runForbiddenClaimBoundarySection(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
): MinimalLoadedAfterloadProtocolSection {
  const descriptorText = JSON.stringify(protocolDescriptor);
  const compactReportText = JSON.stringify({
    evidenceStatus: MINIMAL_LOADED_AFTERLOAD_PHASE3C_EVIDENCE_STATUS,
    members: memberResults.map(compactMemberResult),
  });
  const forbiddenPositiveClaimPattern =
    /experimentalPass|targetPass|acceptedTarget|acceptedThreshold|acceptancePass|validationPass|fitPass|ownerGOPass|ownerGatePass|downstreamPass|morphologyPass|production(?:Mechanics|Homogenization|Loaded)?Pass|singleChamberSolverPass|dynamicValveState|qDotClampState|tbvProjectionState/i;
  const forbiddenWiringPattern =
    /modelCoreWired|chamberWired|runtimeWired|officialCaseWired|schemaMigrationWired/i;
  const positiveClaimScanClean =
    !forbiddenPositiveClaimPattern.test(descriptorText)
    && !forbiddenPositiveClaimPattern.test(compactReportText);
  const wiringScanClean =
    !forbiddenWiringPattern.test(descriptorText)
    && !forbiddenWiringPattern.test(compactReportText);
  const ok =
    positiveClaimScanClean
    && wiringScanClean
    && protocolDescriptor.claimExclusions.ownerGateOutcome === "not-claimed"
    && protocolDescriptor.claimExclusions.productionMechanics === "not-claimed"
    && protocolDescriptor.claimExclusions.productionHomogenization === "not-claimed"
    && protocolDescriptor.claimExclusions.passiveLawAcceptance === "not-claimed"
    && protocolDescriptor.claimExclusions.fitOutcome === "not-claimed"
    && protocolDescriptor.claimExclusions.targetValidationOutcome === "not-claimed"
    && protocolDescriptor.claimExclusions.loadedTargetOutcome === "not-claimed"
    && protocolDescriptor.claimExclusions.morphologyOutcome === "not-claimed"
    && protocolDescriptor.claimExclusions.dynamicValve === "not-claimed"
    && protocolDescriptor.claimExclusions.qDotClamp === "not-claimed"
    && protocolDescriptor.claimExclusions.tbvProjection === "not-claimed"
    && protocolDescriptor.claimExclusions.modelCoreChamberRuntimeWiring === "not-claimed"
    && protocolDescriptor.claimExclusions.schemaOfficialCaseWiring === "not-claimed"
    && protocolDescriptor.claimExclusions.hiddenFreeGeometryScale === "not-claimed"
    && protocolDescriptor.claimExclusions.hiddenFreeHomogenizationGain === "not-claimed"
    && protocolDescriptor.claimExclusions.septalPericardialCoupling === "not-claimed"
    && protocolDescriptor.claimExclusions.closedLoopSteadyState === "not-claimed"
    && protocolDescriptor.protocolSettings.useDynamicValve === false
    && protocolDescriptor.protocolSettings.useQDotClamp === false
    && protocolDescriptor.protocolSettings.useTBVProjection === false
    && protocolDescriptor.protocolSettings.useProductionMechanics === false
    && protocolDescriptor.protocolSettings.usePassiveLawAcceptance === false
    && protocolDescriptor.protocolSettings.useSeptalPericardialCoupling === false
    && protocolDescriptor.protocolSettings.useClosedLoopSteadyState === false
    && protocolDescriptor.protocolSettings.phaseOwnerGateStatus === "not-recorded";
  return section("forbidden-claim-boundary-v1", ok, {
    positiveClaimScanClean,
    wiringScanClean,
    ownerGateOutcome: protocolDescriptor.claimExclusions.ownerGateOutcome,
    productionMechanics: protocolDescriptor.claimExclusions.productionMechanics,
    productionHomogenization: protocolDescriptor.claimExclusions.productionHomogenization,
    passiveLawAcceptance: protocolDescriptor.claimExclusions.passiveLawAcceptance,
    fitOutcome: protocolDescriptor.claimExclusions.fitOutcome,
    targetValidationOutcome: protocolDescriptor.claimExclusions.targetValidationOutcome,
    loadedTargetOutcome: protocolDescriptor.claimExclusions.loadedTargetOutcome,
    morphologyOutcome: protocolDescriptor.claimExclusions.morphologyOutcome,
    dynamicValve: protocolDescriptor.claimExclusions.dynamicValve,
    qDotClamp: protocolDescriptor.claimExclusions.qDotClamp,
    tbvProjection: protocolDescriptor.claimExclusions.tbvProjection,
    modelCoreChamberRuntimeWiring: protocolDescriptor.claimExclusions.modelCoreChamberRuntimeWiring,
    schemaOfficialCaseWiring: protocolDescriptor.claimExclusions.schemaOfficialCaseWiring,
    hiddenFreeGeometryScale: protocolDescriptor.claimExclusions.hiddenFreeGeometryScale,
    hiddenFreeHomogenizationGain: protocolDescriptor.claimExclusions.hiddenFreeHomogenizationGain,
    septalPericardialCoupling: protocolDescriptor.claimExclusions.septalPericardialCoupling,
    closedLoopSteadyState: protocolDescriptor.claimExclusions.closedLoopSteadyState,
    protocolSettingsPhaseOwnerGateStatus: protocolDescriptor.protocolSettings.phaseOwnerGateStatus,
  });
}

function runDeterministicReplaySection(
  options: MinimalLoadedAfterloadRunOptions,
): MinimalLoadedAfterloadProtocolSection {
  const first = runMinimalLoadedAfterloadFamily(options);
  const second = runMinimalLoadedAfterloadFamily(options);
  const firstHash = stableHash(sanitizeForStableHash(first.map(compactMemberResult)));
  const secondHash = stableHash(sanitizeForStableHash(second.map(compactMemberResult)));
  return section("deterministic-replay-v1", firstHash === secondHash, {
    firstHash,
    secondHash,
    deterministic: firstHash === secondHash,
  });
}

function computeMemberMetrics(
  samples: readonly MinimalLoadedAfterloadSample[],
  solverFailureCount: number,
): MinimalLoadedAfterloadMemberMetrics {
  const internalPressure = samples.map((sample) => sample.internalPressurePa);
  const afterloadPressure = samples.map((sample) => sample.afterloadPressurePa);
  const strains = samples.map((sample) => sample.stageFiberEngineeringStrain);
  const forwardSamples = samples.filter((sample) => sample.resistorFlowM3PerSec > 0);
  const backflowSamples = samples.filter((sample) => sample.resistorFlowM3PerSec < 0);
  const strokeVolumeM3 = forwardSamples.reduce(
    (sum, sample) => sum + sample.resistorFlowM3PerSec * sample.dtSec,
    0,
  );
  const ejectionLikeWorkJ = forwardSamples.reduce(
    (sum, sample) => sum + sample.internalPressurePa * sample.resistorFlowM3PerSec * sample.dtSec,
    0,
  );
  const backflowVolumeM3 = backflowSamples.reduce(
    (sum, sample) => sum + Math.abs(sample.resistorFlowM3PerSec) * sample.dtSec,
    0,
  );
  return {
    peakInternalPressurePa: maxOrNaN(internalPressure),
    minInternalPressurePa: minOrNaN(internalPressure),
    meanInternalPressurePa: meanOrNaN(internalPressure),
    peakAfterloadPressurePa: maxOrNaN(afterloadPressure),
    meanAfterloadPressurePa: meanOrNaN(afterloadPressure),
    strokeVolumeM3,
    ejectionLikeWorkJ,
    forwardFlowDurationMs: forwardSamples.reduce((sum, sample) => sum + sample.dtSec * 1000, 0),
    minFiberEngineeringStrain: minOrNaN(strains),
    maxFiberEngineeringStrain: maxOrNaN(strains),
    peakSourceActiveFiberStressPa: maxOrNaN(samples.map((sample) => sample.sourceActiveFiberStressPa)),
    peakWallActiveNominalStressPa: maxOrNaN(samples.map((sample) => sample.wallActiveNominalStressPa)),
    maxVirtualPowerResidualW: maxAbsOrNaN(samples.map((sample) => sample.virtualPowerResidualW)),
    solverFailureCount,
    maxConservationResidual: maxAbsOrNaN(samples.map((sample) => sample.stateConservationResidual)),
    maxRateAuditResidualPerSec: maxAbsOrNaN(samples.map((sample) => sample.rateAuditResidualPerSec)),
    backflowVolumeM3,
    backflowDurationMs: backflowSamples.reduce((sum, sample) => sum + sample.dtSec * 1000, 0),
    samples: samples.length,
  };
}

function failedMember(
  definition: MinimalLoadedAfterloadMemberDefinition,
  samples: readonly MinimalLoadedAfterloadSample[],
  finalCavityVolumeM3: number,
  finalAfterloadPressurePa: number,
  finalLandState: Float64Array,
  finalCalciumState: Float64Array,
  failureReason: string,
  failureMessage: string,
): MinimalLoadedAfterloadMemberResult {
  return {
    id: definition.id,
    definition,
    ok: false,
    samples,
    metrics: computeMemberMetrics(samples, 1),
    finalCavityVolumeM3,
    finalAfterloadPressurePa,
    finalLandState,
    finalCalciumState,
    failureReason,
    failureMessage,
  };
}

function afterloadMember(
  id: MinimalLoadedAfterloadMemberId,
  parameters: MinimalLoadedAfterloadParameters,
): MinimalLoadedAfterloadMemberDefinition {
  return Object.freeze({
    id,
    afterloadModelId: TWO_ELEMENT_AFTERLOAD_PHASE3C_MODEL_ID,
    parameters,
    fixedProtocolSettings: MINIMAL_LOADED_AFTERLOAD_FIXED_PROTOCOL_SETTINGS,
  });
}

function section(
  id: string,
  ok: boolean,
  metrics: Record<string, MinimalLoadedAfterloadMetricValue>,
): MinimalLoadedAfterloadProtocolSection {
  return {
    id,
    status: ok ? "closure-pass" : "closure-fail",
    metrics,
  };
}

function requireMember(
  members: readonly MinimalLoadedAfterloadMemberResult[],
  id: MinimalLoadedAfterloadMemberId,
): MinimalLoadedAfterloadMemberResult {
  const member = members.find((candidate) => candidate.id === id);
  if (member === undefined) {
    throw new Error(`Missing minimal loaded afterload member ${id}`);
  }
  return member;
}

function compactMemberResult(member: MinimalLoadedAfterloadMemberResult): unknown {
  return {
    id: member.id,
    ok: member.ok,
    failureReason: member.failureReason,
    parameters: member.definition.parameters,
    metrics: member.metrics,
    finalCavityVolumeM3: member.finalCavityVolumeM3,
    finalAfterloadPressurePa: member.finalAfterloadPressurePa,
    samples: member.samples.map((sample) => ({
      timeSec: sample.timeSec,
      cavityVolumeM3: sample.cavityVolumeM3,
      afterloadPressurePa: sample.afterloadPressurePa,
      internalPressurePa: sample.internalPressurePa,
      resistorFlowM3PerSec: sample.resistorFlowM3PerSec,
      freeCalciumUM: sample.freeCalciumUM,
      previousFiberEngineeringStrain: sample.previousFiberEngineeringStrain,
      stageFiberEngineeringStrain: sample.stageFiberEngineeringStrain,
      derivedFiberEngineeringStrainRatePerSec: sample.derivedFiberEngineeringStrainRatePerSec,
      rateAuditResidualPerSec: sample.rateAuditResidualPerSec,
      sourceActiveFiberStressPa: sample.sourceActiveFiberStressPa,
      wallActiveNominalStressPa: sample.wallActiveNominalStressPa,
      virtualPowerResidualW: sample.virtualPowerResidualW,
      stateConservationResidual: sample.stateConservationResidual,
      landHealthFinite: sample.landHealthFinite,
      inCalibrationDomain: sample.inCalibrationDomain,
      kinematicsFinite: sample.kinematicsFinite,
    })),
  };
}

function maxMemberMetric(
  memberResults: readonly MinimalLoadedAfterloadMemberResult[],
  metric: keyof MinimalLoadedAfterloadMemberMetrics,
): number {
  const values = memberResults.map((member) => member.metrics[metric]).filter((value): value is number =>
    typeof value === "number",
  );
  return maxOrNaN(values);
}

function strictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, index) =>
    Number.isFinite(value) && (index === 0 || value > values[index - 1]),
  );
}

function allClose(values: readonly number[], tolerance: number): boolean {
  if (values.length <= 1) return true;
  return values.every((value) => Math.abs(value - values[0]) <= tolerance);
}

function sameOrderedSet<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return actual.length === expected.length && expected.every((value, index) => actual[index] === value);
}

function meanOrNaN(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxOrNaN(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : Math.max(...values);
}

function minOrNaN(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : Math.min(...values);
}

function maxAbsOrNaN(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : Math.max(...values.map(Math.abs));
}

function initialPrescribedFreeCalciumUM(
  calciumState: ArrayLike<number>,
  params: PrescribedCalciumParams,
  cycleLengthSec: number,
  dtSec: number,
): number {
  return evaluatePrescribedCalciumOutput(
    calciumState,
    prescribedCalciumInput(1, 0, cycleLengthSec, dtSec),
    params,
  ).freeCalciumUM;
}

function prescribedCalciumInput(
  activationEventId: number,
  timeSinceActivationSec: number,
  cycleLengthSec: number,
  dtSec: number,
): PrescribedCalciumInput {
  return {
    targetId: "minimal-loaded-afterload-family-phase3c",
    activationEventId,
    timeSinceActivationSec,
    cycleLengthSec,
    activationStrength01: 1,
    dtSec,
  };
}
