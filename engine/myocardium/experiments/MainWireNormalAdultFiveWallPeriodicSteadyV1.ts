import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_NODE_NAMES_V1,
  type NonCoronaryCirculationInitialStateInputV1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryCirculationTrialDiagnosticsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  resolveMainWireAorticRootInertanceResearchProfileV1,
  type MainWireAorticRootInertanceResearchProfileV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import type { EdgeSpec, NodeSpec } from "@/engine/core/topology";
import {
  checkpointMainWireFiveWallNonCoronaryV1,
  initializeMainWireFiveWallNonCoronaryV1,
  restoreMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
  type MainWireFiveWallNonCoronaryCheckpointV1,
  type MainWireFiveWallNonCoronaryStepFailureV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClassificationV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  normalAdultMainWireRuntimeV1,
  type MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1,
  type MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
  resolveMainWireNormalAdultBloodVolumeResearchPointV1,
  type MainWireNormalAdultBloodVolumeOperatingPointAuditV1,
  type MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
  type MainWireNormalAdultBloodVolumeOperatingPointResolvedV1,
  type MainWireNormalAdultStressedVenousVolumeResearchPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
  type MainWireNormalAdultFiveWallMacroPhysiologyPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallMacroPhysiologyPointsV1";
import {
  resolveMainWireAorticOutflowDriverRootAblationArmV1,
  type MainWireAorticOutflowDriverRootAblationArmIdV1,
  type MainWireAorticOutflowDriverRootAblationArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowDriverRootAblationV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  sampleMainWireNormalAdultFiveWallDiagnosticStepV2,
  type MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  createFixedResearchMainWireNormalAdultFiveWallProviderV1,
  resolveMainWireNormalAdultVentricularMaterialResearchPointV1,
  type MainWireNormalAdultLaSlsModeV1,
  type MainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultVentricularMaterialResearchPointV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
  type MainWireNormalAdultCommonPericardiumCaseV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import type {
  MainWireCommonPericardiumBindingV1,
  MainWireCommonPericardiumModeV1,
} from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";
import type {
  MainWireFourValveDiseaseBracketIdV1,
  MainWireFourValveDiseaseResearchInputV1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import {
  resolveMainWireAorticValveResearchProfileV1,
  type MainWireAorticValveResearchProfileIdV1,
  type MainWireAorticValveResearchProfileV1,
} from "@/engine/valves/MainWireAorticValvePressureRecoveryAblationV1";
import {
  MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  type MainWireAorticValveLocalInertanceProfileV1,
} from "@/engine/valves/MainWireAorticValveLocalInertanceAblationV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-steady-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-protocol-identity-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID =
  "main-wire-normal-adult-five-wall-cycle-boundary-warm-start-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1 =
  Object.freeze({
    policyId: "fixed-groupwise-periodic-policy-v1" as const,
    period1NormalizedTolerance: 1e-3,
    period2NormalizedTolerance: 1e-3,
    period2MinimumPeriod1NormalizedDelta: 5e-3,
    consecutiveBeats: 3,
    defaultMaximumBeatCount: 32,
    retainedCompleteBeatCount: 3,
    referenceScaleSetId:
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1.scaleSetId,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1 =
  Object.freeze({
    variant: "pven-to-pvein-10ml" as const,
    sourceNode: "PVen" as const,
    destinationNode: "PVein" as const,
    transferredVolumeMl: 10,
    totalBloodVolumeChangeMl: 0 as const,
  });

export type MainWireNormalAdultFiveWallPeriodicInitializationV1 =
  | "canonical"
  | typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  | "cycle-boundary-warm-start";

export type MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1 =
  Readonly<{
    mechanicsProviderMetadataStableHash: string;
    calciumDriveFixedParamsStableHash: string;
    circulationTopologyGraphStableHash: string;
    circulationRuntimeStableHash: string;
    bloodVolumeOperatingPointStableHash: string;
    commonPericardiumStableHash: string;
    periodicPolicyStableHash: string;
  }>;

export type MainWireNormalAdultFiveWallCycleWarmStartV1 = Readonly<{
  warmStartId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID;
  schemaVersion: 3;
  sourceProtocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  sourceProtocolIdentityHash: string;
  sourceComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  sourcePericardiumMode: MainWireCommonPericardiumModeV1;
  sourcePericardiumParameterSetId: string;
  sourceDtSec: number;
  sourceCompletedBeatCount: number;
  checkpoint: MainWireFiveWallNonCoronaryCheckpointV1;
  claim: Readonly<{
    cycleBoundaryPhase01: 0;
    timeRebasedToZeroOnRestore: true;
    parameterSearch: false;
    pericardiumStateStored: false;
  }>;
  envelopeFingerprint: string;
}>;

export type MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1 = Readonly<{
  identityId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID;
  mechanicsProvider: Readonly<{
    providerId: string;
    parameterSetId: string;
    /** Includes the provider's material, geometry, and internal solver options. */
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  calciumDrive: Readonly<{
    driveId: typeof FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID;
    parameterSetId: string;
    fixedParamsStableHash: string;
  }>;
  circulation: Readonly<{
    topologyGraphSnapshot: Readonly<{
      topologyId: string;
      nodes: readonly Readonly<NodeSpec>[];
      edges: readonly Readonly<EdgeSpec>[];
      scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
    }>;
    topologyGraphStableHash: string;
    runtimeStableHash: string;
    valveResearchInputStableHash: string;
    valveResearchInputSnapshot: MainWireFourValveDiseaseResearchInputV1;
  }>;
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  commonPericardium: Readonly<{
    bindingId: string;
    parameterSetId: string;
    mode: MainWireCommonPericardiumModeV1;
    stableHash: string;
    bindingSnapshot: MainWireCommonPericardiumBindingV1;
  }>;
  periodicPolicy: Readonly<{
    policyId:
      typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId;
    policyStableHash: string;
  }>;
}>;

export type MainWireNormalAdultFiveWallPeriodicOptionsV1 = Readonly<{
  dtSec: number;
  maximumBeatCount?: number;
  laSlsMode?: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode?: MainWireCommonPericardiumModeV1;
  pericardiumCase?: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds?: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization?: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart?: MainWireNormalAdultFiveWallCycleWarmStartV1;
}>;

export type MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticValveResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1 =
  Readonly<{
    dtSec: number;
    maximumBeatCount?: number;
  }>;

export type MainWireNormalAdultFiveWallAorticValveResearchRunV1 = Readonly<{
  configurationRole: "fixed-aortic-valve-research-profile";
  profile: MainWireAorticValveResearchProfileV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    valveDiseaseBracketApplied: false;
    exactRuntimeIdentityIncludesProfile: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallAorticOutflowResearchRunV1 = Readonly<{
  configurationRole: "fixed-aortic-outflow-driver-root-ablation-arm";
  arm: MainWireAorticOutflowDriverRootAblationArmV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  aorticRootInertanceProfile:
    MainWireAorticRootInertanceResearchProfileV1 | null;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    valveDiseaseBracketApplied: false;
    aorticValveConstitutiveLawChanged: false;
    acceptedStateOrCheckpointTopologyChanged: false;
    exactRuntimeIdentityIncludesRootProfileWhenActive: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallAorticValveLocalInertanceResearchRunV1 =
  Readonly<{
    configurationRole: "fixed-aortic-valve-local-inertance-research-profile";
    profile: MainWireAorticValveLocalInertanceProfileV1;
    periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
    externalFlowStateAudit: NonNullable<
      MainWireNormalAdultFiveWallPeriodicResultV1[
        "aorticValveLocalInertanceResearchAudit"
      ]
    >;
    claim: Readonly<{
      sourceResearchRunnerOnly: true;
      independentCanonicalColdStart: true;
      genericParameterPatchAccepted: false;
      valveDiseaseBracketApplied: false;
      externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true;
      canonicalAcceptedStateOrCheckpointChanged: false;
      standardWarmStartEmitted: false;
    }>;
  }>;

export type MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1 = Readonly<{
  configurationRole: "fixed-research-point";
  point: MainWireNormalAdultFiveWallMacroPhysiologyPointV1;
  materialPoint: MainWireNormalAdultVentricularMaterialResearchPointV1;
  stressedVenousVolumePoint:
    MainWireNormalAdultStressedVenousVolumeResearchPointV1;
  resolvedProviderIdentity: Readonly<{
    providerId: string;
    parameterSetId: string;
    parameterIdentityHash: string;
    stateSchemaVersion: number;
  }>;
  resolvedBloodVolumeIdentity:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1;
  periodicResult: MainWireNormalAdultFiveWallPeriodicResultV1;
  claim: Readonly<{
    sourceResearchRunnerOnly: true;
    independentCanonicalColdStart: true;
    warmStartApplied: false;
    genericParameterPatchAccepted: false;
    wholeLoopDirectionIsDescriptiveNotAcceptance: true;
  }>;
}>;

export type MainWireNormalAdultFiveWallRetainedBeatV1 = Readonly<{
  beatIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
}>;

export type MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 =
  | "period1-converged"
  | "period2-suspect"
  | "maximum-beats-reached"
  | "step-failure";

export type MainWireNormalAdultFiveWallPeriodicResultV1 = Readonly<{
  experimentId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID;
  mode: "canonical";
  protocolIdentity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  protocolIdentityHash: string;
  protocolComponentHashes:
    MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
  /** Deterministic construction readback; intentionally excluded from hashes. */
  bloodVolumeOperatingPointAudit:
    MainWireNormalAdultBloodVolumeOperatingPointAuditV1;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  pericardiumParameterSetId: string;
  valveResearchInput: MainWireFourValveDiseaseResearchInputV1;
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  dtSec: number;
  stepsPerBeat: number;
  requestedMaximumBeatCount: number;
  completedBeatCount: number;
  terminationReason:
    MainWireNormalAdultFiveWallPeriodicTerminationReasonV1;
  integrationCompletedWithoutFailure: boolean;
  periodicSteadyStateClaimed: boolean;
  period2OrbitSuspected: boolean;
  periodicity: MainWireFiveWallPeriodicClassificationV1;
  beatClosure: readonly MainWireFiveWallPeriodicBeatObservationV1[];
  retainedCompleteBeats:
    readonly MainWireNormalAdultFiveWallRetainedBeatV1[];
  retainedPartialBeat:
    readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  terminalCycleBoundaryWarmStart:
    MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
  aorticValveLocalInertanceResearchAudit?: Readonly<{
    profileId: MainWireAorticValveLocalInertanceProfileV1["profileId"];
    initialAcceptedFlowMlPerSec: 0;
    terminalAcceptedFlowMlPerSec: number;
    cycleBoundaryAcceptedFlowsMlPerSec: readonly number[];
    period1BoundaryClosureSatisfied: boolean;
    period2BoundaryClosureSatisfied: boolean;
    externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true;
    canonicalAcceptedStateOrCheckpointChanged: false;
    standardWarmStartEmitted: false;
  }>;
  failure: null | Readonly<{
    beatIndex: number;
    stepWithinBeat: number;
    globalStepIndex: number;
    timeSec: number;
    message: string;
    reason: MainWireFiveWallNonCoronaryStepFailureV1<unknown>["reason"];
    circulationFailureReason:
      MainWireFiveWallNonCoronaryStepFailureV1<unknown>[
        "circulationFailureReason"
      ];
    finalizationFailureStage:
      MainWireFiveWallNonCoronaryStepFailureV1<unknown>[
        "finalizationFailureStage"
      ];
    lastAcceptedCandidateNodeVolumesMl: Readonly<Record<string, number>>;
    circulationDiagnostics: NonCoronaryCirculationTrialDiagnosticsV1;
  }>;
  initializationAudit: Readonly<{
    canonicalTotalBloodVolumeMl: number;
    initializedTotalBloodVolumeMl: number;
    totalBloodVolumeDifferenceMl: number;
    chamberVolumesChanged: boolean;
    dynamicEdgeFlowsChanged: boolean;
    valveOpeningStatesChanged: boolean;
    mechanicsColdInputChanged: boolean;
    mechanicsColdStateFingerprintChanged: boolean;
    transferredVolumeMl: number;
    sourceNode: "PVen" | null;
    destinationNode: "PVein" | null;
    pulmonaryNodeVolumeDeltaMl: Readonly<{
      PVen: number;
      PVein: number;
    }>;
    warmStartSourceProtocolIdentityHash: string | null;
    warmStartTargetProtocolIdentityHash: string | null;
    warmStartSourcePericardiumStableHash: string | null;
    warmStartTargetPericardiumStableHash: string | null;
    warmStartProtocolDifference:
      | "not-a-warm-start"
      | "none"
      | "common-pericardium-only";
  }>;
  policy: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  claim: Readonly<{
    heartRateBpm: 60;
    circulation: "main-wire-derived-noncoronary-experimental";
    ordinaryBeatIterationOnly: true;
    shootingOrAndersonAccelerationApplied: false;
    parameterSearch: false;
    initializationVariantChangesRuntimeOrMaterialParameters: false;
    pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true;
    samePeriodicOrbitAcrossInitializationsClaimed: false;
    retainedSamplesAreAtMostTheLastThreeCompleteBeats: true;
    smoothingAppliedToSamples: false;
    pericardialConstraintInterfaceIncluded: true;
    pericardialConstraintEnabled: boolean;
    pericardialConstraintMayBeSlackAtHealthyBaseline: true;
    warmStartIsInitialConditionOnly: true;
    valveDiseaseResearchInputIsProtocolParameterNotAcceptedState: true;
    valveDiseaseBracketIsClinicalDiagnosis: false;
  }>;
}>;

type AcceptedState = MainWireFiveWallNonCoronaryAcceptedStateV1<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

type ResolvedPeriodicAssemblyV1 = Readonly<{
  provider: MainWireNormalAdultFiveWallProviderV1;
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointResolvedV1;
}>;

const CYCLE_LENGTH_SEC = 1;

export function runMainWireNormalAdultFiveWallPeriodicSteadyV1(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const runtime = normalAdultMainWireRuntimeV1(
    options.valveDiseaseBracketIds,
  );
  return runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
    options,
    runtime,
  );
}

/** Fixed-ID-only AoV constitutive ablation from an independent cold start. */
export function runMainWireNormalAdultFiveWallAorticValveResearchProfileV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
  profileId: MainWireAorticValveResearchProfileIdV1,
): MainWireNormalAdultFiveWallAorticValveResearchRunV1 {
  assertExactAorticValveResearchOptions(options);
  const profile = resolveMainWireAorticValveResearchProfileV1(profileId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    aorticValveResearchProfile: profile,
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  return Object.freeze({
    configurationRole: "fixed-aortic-valve-research-profile" as const,
    profile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      exactRuntimeIdentityIncludesProfile: true as const,
    }),
  });
}

/** Fixed 2x2 ventricular-driver/Ao_SA-inertance arm from a cold start. */
export function runMainWireNormalAdultFiveWallAorticOutflowResearchArmV1(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
  armId: MainWireAorticOutflowDriverRootAblationArmIdV1,
): MainWireNormalAdultFiveWallAorticOutflowResearchRunV1 {
  assertExactAorticOutflowResearchOptions(options);
  const arm = resolveMainWireAorticOutflowDriverRootAblationArmV1(armId);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const aorticRootInertanceProfile = arm.aorticRootInertanceProfileId === null
    ? null
    : resolveMainWireAorticRootInertanceResearchProfileV1(
      arm.aorticRootInertanceProfileId,
    );
  const runtime: NonCoronaryCirculationRuntimeParamsV1 =
    aorticRootInertanceProfile === null
      ? baselineRuntime
      : Object.freeze({
        ...baselineRuntime,
        aorticRootInertanceResearchProfile: aorticRootInertanceProfile,
      });
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    arm.ventricularMaterialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      arm.ventricularMaterialPointId,
    );
  const bloodVolumeOperatingPoint =
    resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({ provider, bloodVolumeOperatingPoint }),
    );
  return Object.freeze({
    configurationRole:
      "fixed-aortic-outflow-driver-root-ablation-arm" as const,
    arm,
    materialPoint,
    aorticRootInertanceProfile,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      aorticValveConstitutiveLawChanged: false as const,
      acceptedStateOrCheckpointTopologyChanged: false as const,
      exactRuntimeIdentityIncludesRootProfileWhenActive: true as const,
    }),
  });
}

/** Coupled historical AoV-L retest with runner-owned q and no warm start. */
export function runMainWireNormalAdultFiveWallAorticValveLocalInertanceResearchV1(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
): MainWireNormalAdultFiveWallAorticValveLocalInertanceResearchRunV1 {
  assertExactAorticValveResearchOptions(options);
  const baselineRuntime = normalAdultMainWireRuntimeV1();
  const runtime: NonCoronaryCirculationRuntimeParamsV1 = Object.freeze({
    ...baselineRuntime,
    aorticValveLocalInertanceResearchProfile:
      MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
  });
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
    );
  const externalFlowStateAudit =
    periodicResult.aorticValveLocalInertanceResearchAudit;
  if (externalFlowStateAudit === undefined) {
    throw new Error("AoV local-inertance runner omitted external q audit");
  }
  return Object.freeze({
    configurationRole:
      "fixed-aortic-valve-local-inertance-research-profile" as const,
    profile: MAIN_WIRE_AORTIC_VALVE_LOCAL_INERTANCE_PROFILE_V1,
    periodicResult,
    externalFlowStateAudit,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      genericParameterPatchAccepted: false as const,
      valveDiseaseBracketApplied: false as const,
      externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true as const,
      canonicalAcceptedStateOrCheckpointChanged: false as const,
      standardWarmStartEmitted: false as const,
    }),
  });
}

/**
 * Runs one of the fixed circulatory-load sensitivity points from an independent
 * canonical cold start. The intentionally narrow option surface prevents this
 * research seam from becoming a generic parameter-patch or warm-start API.
 */
export function runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
  options: MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1,
  pointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  assertExactCirculatoryLoadResearchOptions(options);
  const runtime =
    resolveMainWireNormalAdultFiveWallCirculatoryLoadRuntimeV1(pointId);
  return runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
    Object.freeze({
      dtSec: options.dtSec,
      ...(options.maximumBeatCount === undefined
        ? {}
        : { maximumBeatCount: options.maximumBeatCount }),
      laSlsMode: "on" as const,
      pericardiumMode: "on" as const,
      pericardiumCase: "healthy-slack" as const,
      initialization: "canonical" as const,
      valveDiseaseBracketIds: Object.freeze([]),
    }),
    runtime,
  );
}

/**
 * Fixed-ID-only source research runner. Every call constructs a new provider,
 * a new fixed-TBV cold state, and iterates ordinary beats without warm start.
 */
export function runMainWireNormalAdultFiveWallMacroPhysiologyResearchPointV1(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
  pointId: MainWireNormalAdultFiveWallMacroPhysiologyPointIdV1,
): MainWireNormalAdultFiveWallMacroPhysiologyResearchRunV1 {
  assertExactMacroPhysiologyResearchOptions(options);
  const point = resolveMainWireNormalAdultFiveWallMacroPhysiologyPointV1(pointId);
  const runtime = normalAdultMainWireRuntimeV1();
  const provider = createFixedResearchMainWireNormalAdultFiveWallProviderV1(
    point.materialPointId,
  );
  const materialPoint =
    resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
      point.materialPointId,
    );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeResearchPointV1(
    runtime,
    point.stressedVenousVolumePointId,
  );
  const periodicResult =
    runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
      Object.freeze({
        dtSec: options.dtSec,
        ...(options.maximumBeatCount === undefined
          ? {}
          : { maximumBeatCount: options.maximumBeatCount }),
        laSlsMode: "on" as const,
        pericardiumMode: "on" as const,
        pericardiumCase: "healthy-slack" as const,
        initialization: "canonical" as const,
        valveDiseaseBracketIds: Object.freeze([]),
      }),
      runtime,
      Object.freeze({
        provider,
        bloodVolumeOperatingPoint: bloodVolume.operatingPoint,
      }),
    );
  const resolvedProviderIdentity = Object.freeze({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  if (
    periodicResult.protocolIdentity.mechanicsProvider.providerId
      !== resolvedProviderIdentity.providerId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterSetId
      !== resolvedProviderIdentity.parameterSetId
    || periodicResult.protocolIdentity.mechanicsProvider.parameterIdentityHash
      !== resolvedProviderIdentity.parameterIdentityHash
    || periodicResult.protocolIdentity.bloodVolumeOperatingPoint
      .fixedTotalBloodVolumeMl
      !== bloodVolume.operatingPoint.fixedTotalBloodVolumeMl
  ) throw new Error("macro physiology resolved assembly drifted from protocol identity");
  return Object.freeze({
    configurationRole: "fixed-research-point" as const,
    point,
    materialPoint,
    stressedVenousVolumePoint: bloodVolume.point,
    resolvedProviderIdentity,
    resolvedBloodVolumeIdentity: bloodVolume.operatingPoint.identity,
    periodicResult,
    claim: Object.freeze({
      sourceResearchRunnerOnly: true as const,
      independentCanonicalColdStart: true as const,
      warmStartApplied: false as const,
      genericParameterPatchAccepted: false as const,
      wholeLoopDirectionIsDescriptiveNotAcceptance: true as const,
    }),
  });
}

function runMainWireNormalAdultFiveWallPeriodicSteadyResolvedRuntimeV1(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  resolvedAssembly?: ResolvedPeriodicAssemblyV1,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const resolved = validateAndResolveOptions(options);
  const localAorticValveInertanceProfile =
    runtime.aorticValveLocalInertanceResearchProfile;
  if (
    localAorticValveInertanceProfile !== undefined
    && resolved.warmStart !== null
  ) {
    throw new Error("AoV local-inertance research does not accept standard warm start");
  }
  const provider = resolvedAssembly?.provider
    ?? createCanonicalMainWireNormalAdultFiveWallProviderV1(resolved.laSlsMode);
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    resolved.pericardiumMode,
    resolved.pericardiumCase,
  );
  const bloodVolumeOperatingPoint =
    resolvedAssembly?.bloodVolumeOperatingPoint
    ?? resolveMainWireNormalAdultBloodVolumeOperatingPointV1(runtime);
  const protocol = buildPeriodicProtocolIdentity(
    provider,
    runtime,
    pericardium,
    bloodVolumeOperatingPoint.identity,
  );
  const canonicalCirculation = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
    fixedTotalBloodVolumeMl:
      bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl,
    nodeVolumesMl: bloodVolumeOperatingPoint.nodeVolumesMl,
  });
  const canonicalCold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    circulationInitial: initialStateInput(canonicalCirculation),
  });
  const initializedState = resolved.warmStart !== null
    ? restoreWarmStart(provider, protocol, resolved.warmStart)
    : resolved.initialization === "canonical"
      ? canonicalCold.acceptedState
      : initializeMainWireFiveWallNonCoronaryV1({
        provider,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
        circulationInitial: pulmonaryRedistributionInitialState(
          canonicalCirculation,
        ),
      }).acceptedState;
  const initializationAudit = resolved.warmStart === null
    ? auditInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.initialization,
    )
    : auditWarmStartInitialization(
      provider,
      canonicalCold.acceptedState,
      initializedState,
      resolved.warmStart,
      protocol,
    );

  let state = initializedState;
  let localAorticValveAcceptedFlowMlPerSec =
    localAorticValveInertanceProfile === undefined ? null : 0;
  const localAorticValveBoundaryFlowsMlPerSec: number[] =
    localAorticValveInertanceProfile === undefined ? [] : [0];
  const boundaryStates: AcceptedState[] = [state];
  const observations: MainWireFiveWallPeriodicBeatObservationV1[] = [];
  const retainedCompleteBeats: MainWireNormalAdultFiveWallRetainedBeatV1[] = [];
  let retainedPartialBeat: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
  let classification = classify(observations);
  let failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"] = null;

  beatLoop:
  for (
    let beatIndex = 1;
    beatIndex <= resolved.maximumBeatCount;
    beatIndex += 1
  ) {
    const beatSamples: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
    const startTimeSec = state.acceptedTimeSec;
    for (
      let stepWithinBeat = 1;
      stepWithinBeat <= resolved.stepsPerBeat;
      stepWithinBeat += 1
    ) {
      const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
        dtSec: resolved.dtSec,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
        ...(localAorticValveAcceptedFlowMlPerSec === null
          ? {}
          : {
            aorticValveLocalInertancePreviousAcceptedFlowMlPerSec:
              localAorticValveAcceptedFlowMlPerSec,
          }),
      });
      if (stepped.converged === false) {
        retainedPartialBeat = beatSamples;
        failure = Object.freeze({
          beatIndex,
          stepWithinBeat,
          globalStepIndex:
            (beatIndex - 1) * resolved.stepsPerBeat + stepWithinBeat,
          timeSec: state.acceptedTimeSec + resolved.dtSec,
          message: stepped.message,
          reason: stepped.reason,
          circulationFailureReason: stepped.circulationFailureReason,
          finalizationFailureStage: stepped.finalizationFailureStage,
          lastAcceptedCandidateNodeVolumesMl:
            stepped.lastAcceptedCandidateNodeVolumesMl,
          circulationDiagnostics: stepped.circulationDiagnostics,
        });
        break beatLoop;
      }
      state = stepped.acceptedState;
      if (localAorticValveAcceptedFlowMlPerSec !== null) {
        localAorticValveAcceptedFlowMlPerSec =
          stepped.circulationTrial.edgeFlowsMlPerSec.AoV;
      }
      beatSamples.push(sampleMainWireNormalAdultFiveWallDiagnosticStepV2(stepped));
    }

    boundaryStates.push(state);
    if (localAorticValveAcceptedFlowMlPerSec !== null) {
      localAorticValveBoundaryFlowsMlPerSec.push(
        localAorticValveAcceptedFlowMlPerSec,
      );
    }
    const currentBoundaryIndex = boundaryStates.length - 1;
    const period1 = compareMainWireFiveWallAcceptedStatesV1(
      state,
      boundaryStates[currentBoundaryIndex - 1]!,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );
    const period2 = currentBoundaryIndex >= 2
      ? compareMainWireFiveWallAcceptedStatesV1(
        state,
        boundaryStates[currentBoundaryIndex - 2]!,
        MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
      )
      : null;
    observations.push(Object.freeze({ beatIndex, period1, period2 }));
    classification = classify(observations);
    retainedCompleteBeats.push(Object.freeze({
      beatIndex,
      startTimeSec,
      endTimeSec: state.acceptedTimeSec,
      samples: Object.freeze(beatSamples),
    }));
    if (
      retainedCompleteBeats.length
      > MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
        .retainedCompleteBeatCount
    ) retainedCompleteBeats.shift();
    if (boundaryStates.length > 3) boundaryStates.shift();
    const externalClosure = classifyAorticValveLocalFlowClosure(
      localAorticValveBoundaryFlowsMlPerSec,
    );
    if (
      (
        classification.status === "period1-converged"
        && externalClosure.period1BoundaryClosureSatisfied
      )
      || (
        classification.status === "period2-suspect"
        && externalClosure.period2BoundaryClosureSatisfied
      )
    ) break;
  }

  const externalClosure = classifyAorticValveLocalFlowClosure(
    localAorticValveBoundaryFlowsMlPerSec,
  );
  const terminationReason = resolveTerminationReason(
    failure,
    classification,
    externalClosure,
  );
  const terminalCycleBoundaryWarmStart = failure === null
    && observations.length > 0
    && localAorticValveInertanceProfile === undefined
    ? buildCycleBoundaryWarmStart(
      provider,
      state,
      protocol,
      resolved.dtSec,
      observations.length,
    )
    : null;
  return Object.freeze({
    experimentId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
    mode: "canonical" as const,
    protocolIdentity: protocol.identity,
    protocolIdentityHash: protocol.identityHash,
    protocolComponentHashes: protocol.componentHashes,
    bloodVolumeOperatingPointAudit: bloodVolumeOperatingPoint.audit,
    laSlsMode: resolved.laSlsMode,
    pericardiumMode: resolved.pericardiumMode,
    pericardiumCase: resolved.pericardiumCase,
    pericardiumParameterSetId: pericardium.parameterSetId,
    valveResearchInput: runtime.valveResearchInput,
    initialization: resolved.initialization,
    dtSec: resolved.dtSec,
    stepsPerBeat: resolved.stepsPerBeat,
    requestedMaximumBeatCount: resolved.maximumBeatCount,
    completedBeatCount: observations.length,
    terminationReason,
    integrationCompletedWithoutFailure: failure === null,
    periodicSteadyStateClaimed: terminationReason === "period1-converged",
    period2OrbitSuspected: terminationReason === "period2-suspect",
    periodicity: classification,
    beatClosure: Object.freeze(observations),
    retainedCompleteBeats: Object.freeze(retainedCompleteBeats),
    retainedPartialBeat: Object.freeze(retainedPartialBeat),
    terminalCycleBoundaryWarmStart,
    ...(localAorticValveInertanceProfile === undefined
      || localAorticValveAcceptedFlowMlPerSec === null
      ? {}
      : {
        aorticValveLocalInertanceResearchAudit: Object.freeze({
          profileId: localAorticValveInertanceProfile.profileId,
          initialAcceptedFlowMlPerSec: 0 as const,
          terminalAcceptedFlowMlPerSec:
            localAorticValveAcceptedFlowMlPerSec,
          cycleBoundaryAcceptedFlowsMlPerSec: Object.freeze([
            ...localAorticValveBoundaryFlowsMlPerSec,
          ]),
          ...externalClosure,
          externalFlowPromotedOnlyAfterSuccessfulCoupledStep: true as const,
          canonicalAcceptedStateOrCheckpointChanged: false as const,
          standardWarmStartEmitted: false as const,
        }),
      }),
    failure,
    initializationAudit,
    policy: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
    claim: Object.freeze({
      heartRateBpm: 60 as const,
      circulation: "main-wire-derived-noncoronary-experimental" as const,
      ordinaryBeatIterationOnly: true as const,
      shootingOrAndersonAccelerationApplied: false as const,
      parameterSearch: false as const,
      initializationVariantChangesRuntimeOrMaterialParameters: false as const,
      pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true as const,
      samePeriodicOrbitAcrossInitializationsClaimed: false as const,
      retainedSamplesAreAtMostTheLastThreeCompleteBeats: true as const,
      smoothingAppliedToSamples: false as const,
      pericardialConstraintInterfaceIncluded: true as const,
      pericardialConstraintEnabled: resolved.pericardiumMode === "on",
      pericardialConstraintMayBeSlackAtHealthyBaseline: true as const,
      warmStartIsInitialConditionOnly: true as const,
      valveDiseaseResearchInputIsProtocolParameterNotAcceptedState: true as const,
      valveDiseaseBracketIsClinicalDiagnosis: false as const,
    }),
  });
}

function assertExactCirculatoryLoadResearchOptions(
  options: MainWireNormalAdultFiveWallCirculatoryLoadResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("circulatory load research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `circulatory load research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactAorticValveResearchOptions(
  options: MainWireNormalAdultFiveWallAorticValveResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("aortic-valve research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `aortic-valve research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactAorticOutflowResearchOptions(
  options: MainWireNormalAdultFiveWallAorticOutflowResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("aortic-outflow research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `aortic-outflow research options reject unsupported field: ${key}`,
      );
    }
  }
}

function assertExactMacroPhysiologyResearchOptions(
  options: MainWireNormalAdultFiveWallMacroPhysiologyResearchOptionsV1,
): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("macro physiology research options must be an object");
  }
  const allowed = new Set(["dtSec", "maximumBeatCount"]);
  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      throw new Error(
        `macro physiology research options reject unsupported field: ${key}`,
      );
    }
  }
}

function buildPeriodicProtocolIdentity(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  runtime: NonCoronaryCirculationRuntimeParamsV1,
  pericardium: MainWireCommonPericardiumBindingV1,
  bloodVolumeOperatingPoint:
    MainWireNormalAdultBloodVolumeOperatingPointIdentityV1,
): Readonly<{
  identity: MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  identityHash: string;
  componentHashes: MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
}> {
  const mechanicsProvider = deepFreezeProtocolValue({
    providerId: provider.providerId,
    parameterSetId: provider.parameterSetId,
    parameterIdentityHash: provider.parameterIdentityHash,
    stateSchemaVersion: provider.stateSchemaVersion,
  });
  const topologyGraph = buildNonCoronaryCirculationGraphV1();
  const commonPericardium = deepFreezeProtocolValue({
    bindingId: pericardium.bindingId,
    parameterSetId: pericardium.parameterSetId,
    mode: pericardium.mode,
    parameters: pericardium.parameters,
    wallMaterialVolumesM3: pericardium.wallMaterialVolumesM3,
    prescribedPericardialFluidVolumeM3:
      pericardium.prescribedPericardialFluidVolumeM3,
  });
  const topologyGraphSnapshot = deepFreezeProtocolValue({
    topologyId: topologyGraph.topologyId,
    nodes: topologyGraph.nodes,
    edges: topologyGraph.edges,
    scope: topologyGraph.scope,
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1["circulation"]["topologyGraphSnapshot"];
  const componentHashes = Object.freeze({
    mechanicsProviderMetadataStableHash: hashProtocolValue(mechanicsProvider),
    calciumDriveFixedParamsStableHash:
      hashProtocolValue(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1),
    circulationTopologyGraphStableHash:
      hashProtocolValue(topologyGraphSnapshot),
    circulationRuntimeStableHash: hashProtocolValue(runtime),
    bloodVolumeOperatingPointStableHash:
      hashProtocolValue(bloodVolumeOperatingPoint),
    commonPericardiumStableHash: hashProtocolValue(commonPericardium),
    periodicPolicyStableHash:
      hashProtocolValue(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1),
  });
  const identity = deepFreezeProtocolValue({
    identityId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID,
    mechanicsProvider,
    calciumDrive: {
      driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
      parameterSetId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1.parameterSetId,
      fixedParamsStableHash:
        componentHashes.calciumDriveFixedParamsStableHash,
    },
    circulation: {
      topologyGraphSnapshot,
      topologyGraphStableHash:
        componentHashes.circulationTopologyGraphStableHash,
      runtimeStableHash: componentHashes.circulationRuntimeStableHash,
      valveResearchInputStableHash: hashProtocolValue(runtime.valveResearchInput),
      valveResearchInputSnapshot: runtime.valveResearchInput,
    },
    bloodVolumeOperatingPoint,
    commonPericardium: {
      bindingId: pericardium.bindingId,
      parameterSetId: pericardium.parameterSetId,
      mode: pericardium.mode,
      stableHash: componentHashes.commonPericardiumStableHash,
      bindingSnapshot: commonPericardium,
    },
    periodicPolicy: {
      policyId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.policyId,
      policyStableHash: componentHashes.periodicPolicyStableHash,
    },
  }) as MainWireNormalAdultFiveWallPeriodicProtocolIdentityV1;
  return Object.freeze({
    identity,
    identityHash: hashProtocolValue(identity),
    componentHashes,
  });
}

function hashProtocolValue(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}

function deepFreezeProtocolValue<T>(value: T): Readonly<T> {
  const sanitized = sanitizeForStableHash(value) as T;
  return deepFreezeObject(sanitized);
}

function deepFreezeObject<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeObject(child);
    }
    Object.freeze(value);
  }
  return value;
}

function initialStateInput(
  state: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  return Object.freeze({
    fixedTotalBloodVolumeMl: state.totalBloodVolumeMl,
    nodeVolumesMl: state.nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: state.dynamicEdgeFlowsMlPerSec,
    valveStates: state.valveStates,
  });
}

function pulmonaryRedistributionInitialState(
  canonical: ReturnType<typeof createInitialNonCoronaryCirculationStateV1>,
): Omit<NonCoronaryCirculationInitialStateInputV1, "timeSec" | "runtime"> {
  const transfer =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl;
  const nodeVolumesMl = Object.freeze({
    ...canonical.nodeVolumesMl,
    PVen: canonical.nodeVolumesMl.PVen - transfer,
    PVein: canonical.nodeVolumesMl.PVein + transfer,
  });
  if (!(nodeVolumesMl.PVen > 0)) {
    throw new Error("fixed pulmonary redistribution made PVen nonpositive");
  }
  const before = sumNodeVolumes(canonical.nodeVolumesMl);
  const after = sumNodeVolumes(nodeVolumesMl);
  if (Math.abs(after - before) > 1e-12) {
    throw new Error("fixed pulmonary redistribution changed total blood volume");
  }
  return Object.freeze({
    fixedTotalBloodVolumeMl: canonical.totalBloodVolumeMl,
    nodeVolumesMl,
    dynamicEdgeFlowsMlPerSec: canonical.dynamicEdgeFlowsMlPerSec,
    valveStates: canonical.valveStates,
  });
}

function auditInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  variant: MainWireNormalAdultFiveWallPeriodicInitializationV1,
): MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"] {
  if (variant === "cycle-boundary-warm-start") {
    throw new Error("warm-start initialization requires its dedicated audit");
  }
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-12) {
    throw new Error("periodic initialization basin audit changed total blood volume");
  }
  const redistributed = variant !== "canonical";
  const transfer = redistributed
    ? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1
      .transferredVolumeMl
    : 0;
  for (const node of NON_CORONARY_NODE_NAMES_V1) {
    const expectedDelta = node === "PVen"
      ? -transfer
      : node === "PVein" ? transfer : 0;
    const actualDelta = initialized.circulation.nodeVolumesMl[node]
      - canonical.circulation.nodeVolumesMl[node];
    if (Math.abs(actualDelta - expectedDelta) > 1e-12) {
      throw new Error(`periodic basin audit changed unexpected node ${node}`);
    }
  }
  for (const chamber of ["LA", "LV", "RA", "RV"] as const) {
    if (
      initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]
    ) throw new Error("periodic basin audit changed a chamber cold volume");
  }
  if (
    JSON.stringify(initialized.circulation.dynamicEdgeFlowsMlPerSec)
      !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec)
  ) throw new Error("periodic basin audit changed a dynamic edge flow");
  if (
    JSON.stringify(initialized.circulation.valveStates)
      !== JSON.stringify(canonical.circulation.valveStates)
  ) throw new Error("periodic basin audit changed a valve opening state");
  const mechanicsChanged = initialized.mechanics.materialStateFingerprint
    !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  if (mechanicsChanged) {
    throw new Error("periodic basin audit changed the mechanics cold state");
  }
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged: false as const,
    dynamicEdgeFlowsChanged: false as const,
    valveOpeningStatesChanged: false as const,
    mechanicsColdInputChanged: false as const,
    mechanicsColdStateFingerprintChanged: false as const,
    transferredVolumeMl: transfer,
    sourceNode: redistributed ? "PVen" as const : null,
    destinationNode: redistributed ? "PVein" as const : null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: -transfer,
      PVein: transfer,
    }),
    warmStartSourceProtocolIdentityHash: null,
    warmStartTargetProtocolIdentityHash: null,
    warmStartSourcePericardiumStableHash: null,
    warmStartTargetPericardiumStableHash: null,
    warmStartProtocolDifference: "not-a-warm-start" as const,
  });
}

function restoreWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): AcceptedState {
  if (
    warmStart.warmStartId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID
    || warmStart.schemaVersion !== 3
  ) throw new Error("unsupported five-wall cycle warm start");
  const { envelopeFingerprint, ...fingerprintedEnvelope } = warmStart;
  if (hashProtocolValue(fingerprintedEnvelope) !== envelopeFingerprint) {
    throw new Error("warm-start envelope fingerprint mismatch");
  }
  if (
    hashProtocolValue(warmStart.sourceProtocolIdentity)
      !== warmStart.sourceProtocolIdentityHash
  ) throw new Error("warm-start source protocol identity hash mismatch");
  validateWarmStartSourceProtocolConsistency(warmStart);
  const targetHashes = targetProtocol.componentHashes;
  for (const key of [
    "mechanicsProviderMetadataStableHash",
    "calciumDriveFixedParamsStableHash",
    "circulationTopologyGraphStableHash",
    "circulationRuntimeStableHash",
    "bloodVolumeOperatingPointStableHash",
    "periodicPolicyStableHash",
  ] as const) {
    if (warmStart.sourceComponentHashes[key] !== targetHashes[key]) {
      throw new Error(`warm-start component mismatch: ${key}`);
    }
  }
  const pericardiumMatches = warmStart.sourceComponentHashes
    .commonPericardiumStableHash === targetHashes.commonPericardiumStableHash;
  const sourceAndTargetIdentityMatch = warmStart.sourceProtocolIdentityHash
    === targetProtocol.identityHash;
  if (pericardiumMatches !== sourceAndTargetIdentityMatch) {
    throw new Error("warm-start protocol difference is not common-pericardium-only");
  }
  const checkpointBloodVolumeOwnerMl =
    warmStart.checkpoint.circulation.state.totalBloodVolumeMl;
  if (
    !Number.isFinite(checkpointBloodVolumeOwnerMl)
    || checkpointBloodVolumeOwnerMl
      !== warmStart.sourceProtocolIdentity.bloodVolumeOperatingPoint
        .fixedTotalBloodVolumeMl
    || checkpointBloodVolumeOwnerMl
      !== targetProtocol.identity.bloodVolumeOperatingPoint.fixedTotalBloodVolumeMl
  ) {
    throw new Error("warm-start checkpoint TBV owner does not match protocol identity");
  }
  const phase = positiveModulo(warmStart.checkpoint.acceptedTimeSec, CYCLE_LENGTH_SEC);
  if (Math.min(phase, CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("warm start must be captured at the HR60 cycle boundary");
  }
  const sourceSteps = CYCLE_LENGTH_SEC / warmStart.sourceDtSec;
  const sourceStepsPerBeat = Math.round(sourceSteps);
  if (
    !(warmStart.sourceDtSec > 0)
    || !Number.isInteger(sourceStepsPerBeat)
    || Math.abs(sourceSteps - sourceStepsPerBeat) > 1e-12
    || !Number.isInteger(warmStart.sourceCompletedBeatCount)
    || warmStart.sourceCompletedBeatCount <= 0
    || warmStart.checkpoint.revision
      !== sourceStepsPerBeat * warmStart.sourceCompletedBeatCount
    || Math.abs(
      warmStart.checkpoint.acceptedTimeSec
        - warmStart.sourceCompletedBeatCount * CYCLE_LENGTH_SEC,
    ) > 1e-9
  ) throw new Error("warm-start source dt/beat/checkpoint provenance mismatch");
  return restoreMainWireFiveWallNonCoronaryV1(
    provider,
    warmStart.checkpoint,
    { revision: 0, acceptedTimeSec: 0 },
  );
}

function validateWarmStartSourceProtocolConsistency(
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
): void {
  const identity = warmStart.sourceProtocolIdentity;
  const hashes = warmStart.sourceComponentHashes;
  if (
    identity.identityId
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_PROTOCOL_IDENTITY_V1_ID
    || hashProtocolValue(identity.mechanicsProvider)
      !== hashes.mechanicsProviderMetadataStableHash
    || identity.calciumDrive.fixedParamsStableHash
      !== hashes.calciumDriveFixedParamsStableHash
    || identity.circulation.topologyGraphStableHash
      !== hashes.circulationTopologyGraphStableHash
    || hashProtocolValue(identity.circulation.topologyGraphSnapshot)
      !== hashes.circulationTopologyGraphStableHash
    || identity.circulation.runtimeStableHash
      !== hashes.circulationRuntimeStableHash
    || hashProtocolValue(identity.circulation.valveResearchInputSnapshot)
      !== identity.circulation.valveResearchInputStableHash
    || identity.bloodVolumeOperatingPoint === undefined
    || hashProtocolValue(identity.bloodVolumeOperatingPoint)
      !== hashes.bloodVolumeOperatingPointStableHash
    || identity.commonPericardium.stableHash
      !== hashes.commonPericardiumStableHash
    || hashProtocolValue(identity.commonPericardium.bindingSnapshot)
      !== hashes.commonPericardiumStableHash
    || identity.commonPericardium.bindingId
      !== identity.commonPericardium.bindingSnapshot.bindingId
    || identity.commonPericardium.parameterSetId
      !== identity.commonPericardium.bindingSnapshot.parameterSetId
    || identity.commonPericardium.mode
      !== identity.commonPericardium.bindingSnapshot.mode
    || identity.periodicPolicy.policyStableHash
      !== hashes.periodicPolicyStableHash
    || identity.commonPericardium.mode !== warmStart.sourcePericardiumMode
    || identity.commonPericardium.parameterSetId
      !== warmStart.sourcePericardiumParameterSetId
    || warmStart.claim.cycleBoundaryPhase01 !== 0
    || warmStart.claim.timeRebasedToZeroOnRestore !== true
    || warmStart.claim.parameterSearch !== false
    || warmStart.claim.pericardiumStateStored !== false
  ) throw new Error("warm-start source protocol provenance mismatch");
}

function buildCycleBoundaryWarmStart(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  state: AcceptedState,
  protocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
  dtSec: number,
  completedBeatCount: number,
): MainWireNormalAdultFiveWallCycleWarmStartV1 {
  const phase = positiveModulo(state.acceptedTimeSec, CYCLE_LENGTH_SEC);
  if (Math.min(phase, CYCLE_LENGTH_SEC - phase) > 1e-9) {
    throw new Error("terminal warm start is not on a cycle boundary");
  }
  const envelope = {
    warmStartId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WARM_START_V1_ID,
    schemaVersion: 3 as const,
    sourceProtocolIdentity: protocol.identity,
    sourceProtocolIdentityHash: protocol.identityHash,
    sourceComponentHashes: Object.freeze({ ...protocol.componentHashes }),
    sourcePericardiumMode: protocol.identity.commonPericardium.mode,
    sourcePericardiumParameterSetId:
      protocol.identity.commonPericardium.parameterSetId,
    sourceDtSec: dtSec,
    sourceCompletedBeatCount: completedBeatCount,
    checkpoint: checkpointMainWireFiveWallNonCoronaryV1(provider, state),
    claim: Object.freeze({
      cycleBoundaryPhase01: 0 as const,
      timeRebasedToZeroOnRestore: true as const,
      parameterSearch: false as const,
      pericardiumStateStored: false as const,
    }),
  };
  return Object.freeze({
    ...envelope,
    envelopeFingerprint: hashProtocolValue(envelope),
  });
}

function auditWarmStartInitialization(
  provider: ReturnType<typeof createCanonicalMainWireNormalAdultFiveWallProviderV1>,
  canonical: AcceptedState,
  initialized: AcceptedState,
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1,
  targetProtocol: ReturnType<typeof buildPeriodicProtocolIdentity>,
): MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"] {
  const canonicalTotal = canonical.circulation.totalBloodVolumeMl;
  const initializedTotal = initialized.circulation.totalBloodVolumeMl;
  const totalDifference = initializedTotal - canonicalTotal;
  if (Math.abs(totalDifference) > 1e-9) {
    throw new Error("cycle warm start changed total blood volume");
  }
  const chamberVolumesChanged = (["LA", "LV", "RA", "RV"] as const)
    .some((chamber) => initialized.circulation.nodeVolumesMl[chamber]
      !== canonical.circulation.nodeVolumesMl[chamber]);
  const dynamicEdgeFlowsChanged = JSON.stringify(
    initialized.circulation.dynamicEdgeFlowsMlPerSec,
  ) !== JSON.stringify(canonical.circulation.dynamicEdgeFlowsMlPerSec);
  const valveOpeningStatesChanged = JSON.stringify(
    initialized.circulation.valveStates,
  ) !== JSON.stringify(canonical.circulation.valveStates);
  const mechanicsColdStateFingerprintChanged =
    initialized.mechanics.materialStateFingerprint
      !== canonical.mechanics.materialStateFingerprint
    || JSON.stringify(provider.stateCodec.encode(initialized.mechanics.materialState))
      !== JSON.stringify(provider.stateCodec.encode(canonical.mechanics.materialState));
  return Object.freeze({
    canonicalTotalBloodVolumeMl: canonicalTotal,
    initializedTotalBloodVolumeMl: initializedTotal,
    totalBloodVolumeDifferenceMl: totalDifference,
    chamberVolumesChanged,
    dynamicEdgeFlowsChanged,
    valveOpeningStatesChanged,
    mechanicsColdInputChanged: chamberVolumesChanged,
    mechanicsColdStateFingerprintChanged,
    transferredVolumeMl: 0,
    sourceNode: null,
    destinationNode: null,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      PVen: initialized.circulation.nodeVolumesMl.PVen
        - canonical.circulation.nodeVolumesMl.PVen,
      PVein: initialized.circulation.nodeVolumesMl.PVein
        - canonical.circulation.nodeVolumesMl.PVein,
    }),
    warmStartSourceProtocolIdentityHash:
      warmStart.sourceProtocolIdentityHash,
    warmStartTargetProtocolIdentityHash: targetProtocol.identityHash,
    warmStartSourcePericardiumStableHash:
      warmStart.sourceComponentHashes.commonPericardiumStableHash,
    warmStartTargetPericardiumStableHash:
      targetProtocol.componentHashes.commonPericardiumStableHash,
    warmStartProtocolDifference:
      warmStart.sourceProtocolIdentityHash === targetProtocol.identityHash
        ? "none" as const
        : "common-pericardium-only" as const,
  });
}

function classify(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): MainWireFiveWallPeriodicClassificationV1 {
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  return classifyMainWireFiveWallPeriodicityV1(observations, {
    period1NormalizedTolerance: policy.period1NormalizedTolerance,
    period2NormalizedTolerance: policy.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      policy.period2MinimumPeriod1NormalizedDelta,
    consecutiveBeats: policy.consecutiveBeats,
  });
}

type MainWireAorticValveLocalFlowClosureV1 = Readonly<{
  period1BoundaryClosureSatisfied: boolean;
  period2BoundaryClosureSatisfied: boolean;
}>;

function classifyAorticValveLocalFlowClosure(
  boundaryFlowsMlPerSec: readonly number[],
): MainWireAorticValveLocalFlowClosureV1 {
  if (boundaryFlowsMlPerSec.length === 0) {
    return Object.freeze({
      period1BoundaryClosureSatisfied: true,
      period2BoundaryClosureSatisfied: true,
    });
  }
  const policy = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1;
  const scaleMlPerSec = 1_000;
  const consecutive = policy.consecutiveBeats;
  const period1BoundaryClosureSatisfied =
    boundaryFlowsMlPerSec.length >= consecutive + 1
    && Array.from({ length: consecutive }, (_, offset) => {
      const index = boundaryFlowsMlPerSec.length - 1 - offset;
      return Math.abs(
        boundaryFlowsMlPerSec[index]!
          - boundaryFlowsMlPerSec[index - 1]!,
      ) / scaleMlPerSec;
    }).every((delta) => delta <= policy.period1NormalizedTolerance);
  const period2BoundaryClosureSatisfied =
    boundaryFlowsMlPerSec.length >= consecutive + 2
    && Array.from({ length: consecutive }, (_, offset) => {
      const index = boundaryFlowsMlPerSec.length - 1 - offset;
      return Math.abs(
        boundaryFlowsMlPerSec[index]!
          - boundaryFlowsMlPerSec[index - 2]!,
      ) / scaleMlPerSec;
    }).every((delta) => delta <= policy.period2NormalizedTolerance);
  return Object.freeze({
    period1BoundaryClosureSatisfied,
    period2BoundaryClosureSatisfied,
  });
}

function resolveTerminationReason(
  failure: MainWireNormalAdultFiveWallPeriodicResultV1["failure"],
  classification: MainWireFiveWallPeriodicClassificationV1,
  externalClosure: MainWireAorticValveLocalFlowClosureV1,
): MainWireNormalAdultFiveWallPeriodicTerminationReasonV1 {
  if (failure !== null) return "step-failure";
  if (
    classification.status === "period1-converged"
    && externalClosure.period1BoundaryClosureSatisfied
  ) {
    return "period1-converged";
  }
  if (
    classification.status === "period2-suspect"
    && externalClosure.period2BoundaryClosureSatisfied
  ) return "period2-suspect";
  return "maximum-beats-reached";
}

function validateAndResolveOptions(
  options: MainWireNormalAdultFiveWallPeriodicOptionsV1,
): Readonly<{
  dtSec: number;
  stepsPerBeat: number;
  maximumBeatCount: number;
  laSlsMode: MainWireNormalAdultLaSlsModeV1;
  pericardiumMode: MainWireCommonPericardiumModeV1;
  pericardiumCase: MainWireNormalAdultCommonPericardiumCaseV1;
  valveDiseaseBracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
  initialization: MainWireNormalAdultFiveWallPeriodicInitializationV1;
  warmStart: MainWireNormalAdultFiveWallCycleWarmStartV1 | null;
}> {
  if (!(options.dtSec > 0) || !Number.isFinite(options.dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const steps = CYCLE_LENGTH_SEC / options.dtSec;
  const stepsPerBeat = Math.round(steps);
  if (!Number.isInteger(stepsPerBeat) || Math.abs(steps - stepsPerBeat) > 1e-12) {
    throw new Error("dtSec must divide the fixed HR60 one-second cycle exactly");
  }
  const maximumBeatCount = options.maximumBeatCount
    ?? MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1
      .defaultMaximumBeatCount;
  if (!Number.isInteger(maximumBeatCount) || maximumBeatCount <= 0) {
    throw new Error("maximumBeatCount must be a positive integer");
  }
  const laSlsMode = options.laSlsMode ?? "on";
  if (laSlsMode !== "on" && laSlsMode !== "exact-off") {
    throw new Error("unsupported LA SLS mode");
  }
  const pericardiumMode = options.pericardiumMode ?? "on";
  if (pericardiumMode !== "on" && pericardiumMode !== "exact-off") {
    throw new Error("unsupported common-pericardium mode");
  }
  const pericardiumCase = options.pericardiumCase ?? "healthy-slack";
  if (
    pericardiumCase !== "healthy-slack"
    && pericardiumCase !== "effusion-300ml-positive-control"
    && pericardiumCase
      !== "global-capacity-vh0-430ml-positive-control"
  ) throw new Error("unsupported common-pericardium case");
  const warmStart = options.warmStart ?? null;
  const requestedInitialization = options.initialization ?? "canonical";
  if (warmStart !== null && requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start") {
    throw new Error("warm start cannot be combined with another initialization variant");
  }
  if (warmStart === null
    && requestedInitialization === "cycle-boundary-warm-start") {
    throw new Error("cycle-boundary-warm-start requires a warmStart payload");
  }
  if (
    requestedInitialization !== "canonical"
    && requestedInitialization !== "cycle-boundary-warm-start"
    && requestedInitialization
      !== MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PULMONARY_REDISTRIBUTION_V1.variant
  ) throw new Error("unsupported periodic initialization variant");
  const initialization = warmStart === null
    ? requestedInitialization
    : "cycle-boundary-warm-start" as const;
  return Object.freeze({
    dtSec: options.dtSec,
    stepsPerBeat,
    maximumBeatCount,
    laSlsMode,
    pericardiumMode,
    pericardiumCase,
    valveDiseaseBracketIds: Object.freeze([
      ...(options.valveDiseaseBracketIds ?? []),
    ]),
    initialization,
    warmStart,
  });
}

function sumNodeVolumes(
  volumes: Readonly<Record<(typeof NON_CORONARY_NODE_NAMES_V1)[number], number>>,
): number {
  return NON_CORONARY_NODE_NAMES_V1.reduce(
    (sum, node) => sum + volumes[node],
    0,
  );
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}
