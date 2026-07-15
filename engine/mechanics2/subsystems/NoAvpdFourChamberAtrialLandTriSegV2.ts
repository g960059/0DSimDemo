import {
  ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  initialPeriodicPrescribedCalciumDriverStateV2,
  trialPeriodicPrescribedCalciumDriverV2,
  type PeriodicPrescribedCalciumDriverParamsV2,
  type PeriodicPrescribedCalciumDriverStateV2,
  type PeriodicPrescribedCalciumDriverTrialV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";
import {
  equilibriumLandFormCaTroponinActivationStateV1,
  LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
} from "@/engine/mechanics2/activation/LandFormCaTroponinActivationV1";
import {
  DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
  commitLand2017ActiveOnlyTrialV1,
  initialLand2017ActiveOnlyStateV1,
  trialLand2017ActiveOnlyV1,
  type Land2017ActiveOnlyParamsV1,
  type Land2017ActiveOnlyStateV1,
  type Land2017ActiveOnlyTrialV1,
} from "@/engine/mechanics2/activation/Land2017ActiveOnlyV1";
import {
  DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
  commitHillCeSeeSlsTrialV1,
  evaluateHillPassiveEquilibriumV1,
  initialHillCeSeeSlsStateV1,
  prepareHillCeSeeSlsParamsV1,
  trialHillCeSeeSlsV1,
  type HillCeSeeSlsParamsV1,
  type HillCeSeeSlsStateV1,
  type HillCeSeeSlsTrialV1,
} from "@/engine/mechanics2/constitutive/HillCeSeeSlsV1";
import {
  commitHillPassiveSlsParallelTrialV1,
  initialHillPassiveSlsParallelStateV1,
  prepareHillPassiveSlsParallelParamsV1,
  trialHillPassiveSlsParallelV1,
  type HillPassiveSlsParallelParamsV1,
  type HillPassiveSlsParallelStateV1,
  type HillPassiveSlsParallelTrialV1,
} from "@/engine/mechanics2/constitutive/HillPassiveSlsParallelV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
  type OneFiberVolumeGeometryParamsV1,
  type OneFiberVolumeGeometryV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";
import {
  DEFAULT_TRISEG_GENERALIZED_FORCE_MAPPING_V1,
  representativeTriSegMidwallTensionFromFiberStressV1,
  solveTriSegAlgebraicEquilibriumV1,
  solveTriSegFullFiberEnergyGradientEquilibriumV1,
  type TriSegAlgebraicCoordinatesV1,
  type TriSegAlgebraicSolutionV1,
  type TriSegFullFiberEnergyGradientSolutionV1,
  type TriSegGeneralizedForceMappingV1,
  type TriSegGeometryValidOutputV1,
  type TriSegWallIdV1,
  type TriSegWallParametersV1,
} from "@/engine/mechanics2/geometry/TriSegGeometryV1";
import {
  solveDampedNewtonV1,
  type DampedNewtonResultV1,
} from "@/engine/mechanics2/solver/DampedNewtonV1";
import {
  evaluateSmoothInertialValveStateV2,
  initialSmoothInertialValveStateV2,
  type SmoothInertialValveOutputV2,
  type SmoothInertialValveParamsV2,
  type SmoothInertialValveStateV2,
} from "@/engine/mechanics2/valve/SmoothInertialValveV2";
import { effectiveCalciumRateTargetAtCycleLength } from
  "@/engine/myocardium/calcium/PrescribedCalciumTransientV1";
import { LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1 } from
  "@/engine/myocardium/atrialLandNiederer2018";

const PA_PER_MMHG = 133.322;
const WALL_IDS: readonly NoAvpdWallIdV1[] = Object.freeze([
  "leftAtrium",
  "rightAtrium",
  "leftFreeWall",
  "septum",
  "rightFreeWall",
]);

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2 =
  "no-avpd-four-chamber-atrial-land-triseg-v2" as const;

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_EQUATIONS_VERSION_ID_V2 =
  "no-avpd-four-chamber-atrial-land-triseg-equations-v2" as const;

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_STATE_LAYOUT_ID_V2 =
  "no-avpd-four-chamber-atrial-land-triseg-state-layout-v2" as const;

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V2 =
  "periodic-five-wall-la-land-ra-lvfw-septum-rvfw-v2" as const;

/**
 * The Land--Niederer atrial rate/sensitivity prior assumed 0.1--0.6 uM at
 * 1 Hz. The PR #467 common atrial driver reaches about 0.85 uM. This V2 scales
 * only the atrial driver's amplitude targets by 2/3 so the 1 Hz target is
 * 0.1 + 0.5 = 0.6 uM; waveform timing is unchanged. This is literature-context
 * alignment, not a normal-human calibration or a stress gain.
 */
export const LAND_NIEDERER_ATRIAL_CALCIUM_CONTEXT_DRIVER_V2 = Object.freeze({
  ...ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  parameterSetId:
    "land-niederer-2018-atrial-calcium-context-0p1-to-0p6um-v2",
  rateTargets: Object.freeze(
    ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1.rateTargets.map((target) =>
      Object.freeze({
        ...target,
        peakAmplitudeUM: target.peakAmplitudeUM * (2 / 3),
      })
    ),
  ),
});

export const NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_CLAIM_BOUNDARY_V2 = Object.freeze(
  {
    adoption: "research-sidecar-only",
    runtimeReplacement: false,
    closedBloodVolumeLedger: true,
    chambers: ["LA", "LV", "RA", "RV"],
    vascularCompartments: [
      "systemicArtery",
      "systemicVein",
      "pulmonaryArtery",
      "pulmonaryVein",
    ],
    myocardialWalls: ["LA", "RA", "LV-free-wall", "septum", "RV-free-wall"],
    activeLaw:
      "LA-Land2017-active-only; RA-LVFW-septum-RVFW-Hill-CE-SEE",
    leftAtrialStressTopology:
      "existing-equilibrium-passive-plus-Land-active-only-plus-existing-one-state-SLS",
    leftAtrialExternalSeriesElasticElement: false,
    leftAtrialPostHocForceVelocityMultiplier: false,
    leftAtrialActiveStressGain: false,
    activationFrontEnd:
      "periodic-event-to-prescribed-free-Ca-to-Land-form-CaTRPN",
    calciumMyofilamentPairing:
      "engineering-pair-not-jointly-calibrated-against-force-calcium-and-twitch-protocols",
    leftAtrialLandParameterPrior:
      "Land-Niederer-2018-human-atrial-literature-prior-not-normal-reference-or-patient-fit",
    leftAtrialLandLiteratureProvenance: Object.freeze({
      equationSourceDoi:
        LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.equationSourceDoi,
      atrialCalibrationDoi:
        LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
          .atrialCalibrationDoi,
      effectiveParameterProvenance:
        LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1
          .effectiveParameterProvenance,
      provenanceBoundary:
        LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.provenanceBoundary,
    }),
    leftAtrialLandCommonProjectCalciumInput:
      "timing-retained-amplitude-aligned-to-land-niederer-assumed-0p1-to-0p6um-context-not-paper-waveform-reproduction",
    calciumCyclingOrTrueCalciumAlternansClaimed: false,
    passiveMemory: "one-state-standard-linear-solid",
    ventricularInteraction: "algebraic-TriSeg",
    triSegGeneralizedForceMappingDefault:
      "lumens-2009-representative-tension-area-work",
    triSegColdInitializationDefault: "legacy-seed",
    fullFiberEnergyGradientAlternative:
      "research-sidecar-opt-in-no-active-potential-claim",
    avPlaneDynamicState: false,
    avpdObserverIncluded: false,
    respirationBaroreflexOrFullPericardiumIncluded: false,
    calibratedNormalHumanOrClinicalValidityClaimed: false,
  } as const,
);

export type NoAvpdWallIdV1 =
  "leftAtrium" | "rightAtrium" | "leftFreeWall" | "septum" | "rightFreeWall";

export type NoAvpdBloodVolumesV1 = {
  readonly leftAtriumMl: number;
  readonly leftVentricleMl: number;
  readonly systemicArteryMl: number;
  readonly systemicVeinMl: number;
  readonly rightAtriumMl: number;
  readonly rightVentricleMl: number;
  readonly pulmonaryArteryMl: number;
  readonly pulmonaryVeinMl: number;
};

export type NoAvpdFlowStateV1 = {
  readonly mitralValve: SmoothInertialValveStateV2;
  readonly aorticValve: SmoothInertialValveStateV2;
  readonly tricuspidValve: SmoothInertialValveStateV2;
  readonly pulmonaryValve: SmoothInertialValveStateV2;
  /** Pulmonary-vein compartment -> LA; may briefly reverse during atrial systole. */
  readonly pulmonaryVenousFlowMlPerSec: number;
  /** Systemic-vein compartment -> RA. */
  readonly systemicVenousFlowMlPerSec: number;
};

export type NoAvpdWallStatesV1 = Readonly<
  Record<NoAvpdWallIdV1, HillCeSeeSlsStateV1>
>;
export type NoAvpdAtrialLandWallStateV2 = {
  readonly kind: "land-active-parallel-passive-sls-v1";
  readonly active: Land2017ActiveOnlyStateV1;
  readonly passiveSls: HillPassiveSlsParallelStateV1;
  readonly materialIdentity: {
    /** Exact canonical identity of all effective Land adapter parameters. */
    readonly landEffectiveParamsCanonicalJson: string;
    /** Exact canonical identity of equilibrium-passive and SLS parameters. */
    readonly passiveSlsEffectiveParamsCanonicalJson: string;
  };
};
export type NoAvpdWallStatesV2 = {
  readonly leftAtrium: NoAvpdAtrialLandWallStateV2;
  readonly rightAtrium: HillCeSeeSlsStateV1;
  readonly leftFreeWall: HillCeSeeSlsStateV1;
  readonly septum: HillCeSeeSlsStateV1;
  readonly rightFreeWall: HillCeSeeSlsStateV1;
};
export type NoAvpdCalciumDriverStatesV1 = Readonly<
  Record<NoAvpdWallIdV1, PeriodicPrescribedCalciumDriverStateV2>
>;

export type NoAvpdFourChamberAtrialLandTriSegStateV2 = {
  /** Exact effective-parameter identity; any change requires a cold state. */
  readonly parameterIdentityCanonicalJson: string;
  readonly timeSec: number;
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
  readonly calciumDrivers: NoAvpdCalciumDriverStatesV1;
  readonly walls: NoAvpdWallStatesV2;
  /** Mapping changes require a cold state reinitialization. */
  readonly triSegGeneralizedForceMapping: TriSegGeneralizedForceMappingV1;
  /** Algebraic warm-start cache only; it is not a physiological dynamic state. */
  readonly triSegContinuation: TriSegAlgebraicCoordinatesV1;
};

export type LinearComplianceCompartmentParamsV1 = {
  readonly unstressedVolumeMl: number;
  readonly complianceMlPerMmHg: number;
};

export type InertialVenousSegmentParamsV1 = {
  readonly resistanceMmHgSecPerMl: number;
  readonly inertanceMmHgSec2PerMl: number;
};

export type NoAvpdAtrialWallParamsV1 = {
  readonly geometry: OneFiberVolumeGeometryParamsV1;
  readonly material: HillCeSeeSlsParamsV1;
};

export type NoAvpdAtrialLandWallParamsV2 = {
  readonly geometry: OneFiberVolumeGeometryParamsV1;
  readonly passiveSlsSourceMaterial: HillPassiveSlsParallelParamsV1;
  readonly active: Land2017ActiveOnlyParamsV1;
};

export type NoAvpdTriSegWallParamsV1 = TriSegWallParametersV1 & {
  readonly material: HillCeSeeSlsParamsV1;
};

export type NoAvpdFourChamberAtrialLandTriSegParamsV2 = {
  readonly cycleLengthSec: number;
  readonly triSegGeneralizedForceMapping: TriSegGeneralizedForceMappingV1;
  readonly triSegColdInitialization: "legacy-seed" | "passive-reequilibrated";
  readonly calciumDrivers: Readonly<
    Record<NoAvpdWallIdV1, PeriodicPrescribedCalciumDriverParamsV2>
  >;
  readonly atria: {
    readonly left: NoAvpdAtrialLandWallParamsV2;
    readonly right: NoAvpdAtrialWallParamsV1;
  };
  readonly triSeg: Readonly<Record<TriSegWallIdV1, NoAvpdTriSegWallParamsV1>>;
  readonly vascular: {
    readonly systemicArtery: LinearComplianceCompartmentParamsV1;
    readonly systemicVein: LinearComplianceCompartmentParamsV1;
    readonly pulmonaryArtery: LinearComplianceCompartmentParamsV1;
    readonly pulmonaryVein: LinearComplianceCompartmentParamsV1;
    readonly systemicResistanceMmHgSecPerMl: number;
    readonly pulmonaryResistanceMmHgSecPerMl: number;
    readonly systemicVenousSegment: InertialVenousSegmentParamsV1;
    readonly pulmonaryVenousSegment: InertialVenousSegmentParamsV1;
  };
  readonly valves: {
    readonly mitral: SmoothInertialValveParamsV2;
    readonly aortic: SmoothInertialValveParamsV2;
    readonly tricuspid: SmoothInertialValveParamsV2;
    readonly pulmonary: SmoothInertialValveParamsV2;
  };
  readonly solver: {
    readonly maxIterations: number;
    readonly residualTolerance: number;
    readonly derivativeRelativeStep: number;
    readonly lineSearchReduction: number;
    readonly minLineSearchStep: number;
    readonly jacobianReuse: {
      readonly maxAcceptedSteps: number;
      readonly refreshWhenResidualRatioExceeds: number;
      readonly retryWithFreshJacobianOnFailure: boolean;
    };
    readonly minimumBloodVolumeMl: number;
    readonly totalBloodVolumeToleranceMl: number;
    readonly triSegMaxIterations: number;
    readonly triSegRelativeResidualTolerance: number;
  };
};

export type NoAvpdPressureReadbackV1 = {
  readonly leftAtriumMmHg: number;
  readonly leftVentricleMmHg: number;
  readonly systemicArteryMmHg: number;
  readonly systemicVeinMmHg: number;
  readonly rightAtriumMmHg: number;
  readonly rightVentricleMmHg: number;
  readonly pulmonaryArteryMmHg: number;
  readonly pulmonaryVeinMmHg: number;
};

export type NoAvpdFlowReadbackV1 = {
  readonly mitralMlPerSec: number;
  readonly aorticMlPerSec: number;
  readonly systemicPeripheralMlPerSec: number;
  readonly systemicVenousMlPerSec: number;
  readonly tricuspidMlPerSec: number;
  readonly pulmonaryValveMlPerSec: number;
  readonly pulmonaryPeripheralMlPerSec: number;
  readonly pulmonaryVenousMlPerSec: number;
};

export type NoAvpdAtrialEvaluationV1 = {
  readonly geometry: OneFiberVolumeGeometryV1;
  readonly materialTrial: HillCeSeeSlsTrialV1;
  readonly transmuralPressureMmHg: number;
};

type NoAvpdAtrialLandMaterialReadbackV2 = {
  readonly freeCalciumUm: number;
  readonly activation01: number;
  readonly stresses: {
    readonly passiveEquilibriumPa: number;
    readonly landActivePa: number;
    readonly slsOverstressPa: number;
    readonly totalTransmittedPa: number;
  };
  readonly tangentsPa: {
    readonly passivePlusSlsAlgorithmicPa: number;
    readonly landAlgorithmicTangentAvailable: false;
  };
};

export type NoAvpdAtrialLandMaterialTrialV2 = {
  readonly activeTrial: Land2017ActiveOnlyTrialV1;
  readonly passiveSlsTrial: HillPassiveSlsParallelTrialV1;
} & (
  | {
      readonly valid: true;
      readonly finite: true;
      readonly readback: NoAvpdAtrialLandMaterialReadbackV2;
    }
  | {
      readonly valid: false;
      readonly finite: boolean;
      readonly readback: null;
    }
);

export type NoAvpdAtrialLandEvaluationV2 = {
  readonly geometry: OneFiberVolumeGeometryV1;
  readonly materialTrial: NoAvpdAtrialLandMaterialTrialV2;
  readonly transmuralPressureMmHg: number;
};

export type NoAvpdVentricularEvaluationV1 = {
  readonly triSeg: NoAvpdTriSegEquilibriumSolutionV1;
  readonly materialTrials: Readonly<
    Record<TriSegWallIdV1, HillCeSeeSlsTrialV1>
  >;
};

export type NoAvpdTriSegEquilibriumSolutionV1 =
  TriSegAlgebraicSolutionV1 | TriSegFullFiberEnergyGradientSolutionV1;

export type NoAvpdFourChamberAtrialLandEvaluationV2 = {
  readonly freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>;
  readonly activations01: Readonly<Record<NoAvpdWallIdV1, number>>;
  readonly pressures: NoAvpdPressureReadbackV1;
  readonly flowReadback: NoAvpdFlowReadbackV1;
  readonly leftAtrium: NoAvpdAtrialLandEvaluationV2;
  readonly rightAtrium: NoAvpdAtrialEvaluationV1;
  readonly ventricles: NoAvpdVentricularEvaluationV1;
  readonly valves: {
    readonly mitral: SmoothInertialValveOutputV2;
    readonly aortic: SmoothInertialValveOutputV2;
    readonly tricuspid: SmoothInertialValveOutputV2;
    readonly pulmonary: SmoothInertialValveOutputV2;
  };
  readonly totalBloodVolumeMl: number;
};

export type NoAvpdFourChamberAtrialLandStepOutputV2 = {
  readonly modelId: typeof NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2;
  readonly accepted: boolean;
  /** Equals previous state exactly whenever accepted=false. */
  readonly state: NoAvpdFourChamberAtrialLandTriSegStateV2;
  readonly candidateState: NoAvpdFourChamberAtrialLandTriSegStateV2 | null;
  readonly evaluation: NoAvpdFourChamberAtrialLandEvaluationV2 | null;
  readonly solver: DampedNewtonResultV1;
  readonly totalBloodVolumeResidualMl: number | null;
  readonly failureReasons: readonly string[];
};

type Candidate = {
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
  readonly evaluation: NoAvpdFourChamberAtrialLandEvaluationV2;
};

type NoAvpdCalciumDriverTrialsV1 = Readonly<
  Record<NoAvpdWallIdV1, PeriodicPrescribedCalciumDriverTrialV2>
>;

const DEFAULT_INITIAL_VOLUMES: NoAvpdBloodVolumesV1 = {
  leftAtriumMl: 65,
  leftVentricleMl: 140,
  systemicArteryMl: 700,
  systemicVeinMl: 3_000,
  rightAtriumMl: 65,
  rightVentricleMl: 150,
  pulmonaryArteryMl: 180,
  pulmonaryVeinMl: 650,
};

export const DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2: NoAvpdFourChamberAtrialLandTriSegParamsV2 =
  createDefaultParams();

const DEFAULT_PARAMETER_IDENTITY_CANONICAL_JSON_V2 = stableStringify(
  DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
);

export function noAvpdFourChamberAtrialLandParameterIdentityV2(
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): string {
  return params === DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2
    ? DEFAULT_PARAMETER_IDENTITY_CANONICAL_JSON_V2
    : stableStringify(params);
}

export function initialNoAvpdFourChamberAtrialLandTriSegStateV2(
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2 = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
  volumeOverrides: Partial<NoAvpdBloodVolumesV1> = {},
): NoAvpdFourChamberAtrialLandTriSegStateV2 {
  assertCalciumDriverOwnership(params);
  if (
    params.triSegGeneralizedForceMapping === "full-fiber-energy-gradient" &&
    params.triSegColdInitialization !== "passive-reequilibrated"
  ) {
    throw new Error(
      "full-fiber-energy-gradient requires passive-reequilibrated cold initialization",
    );
  }
  const volumes = { ...DEFAULT_INITIAL_VOLUMES, ...volumeOverrides };
  const leftAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    volumes.leftAtriumMl,
    params.atria.left.geometry,
  );
  const rightAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    volumes.rightAtriumMl,
    params.atria.right.geometry,
  );
  const triSegGeometry =
    params.triSegColdInitialization === "passive-reequilibrated"
      ? solveNoAvpdPassiveTriSegEquilibriumV1(volumes, params)
      : solveTriSegAlgebraicEquilibriumV1(
          triSegBaseInput(volumes, params),
          { leftFreeWall: 12, septum: 8, rightFreeWall: 8 },
          { junctionRadiusCm: 3.3, septalCapVolumeMl: 0 },
          { relativeResidualTolerance: 1e-8 },
        );
  if (
    params.triSegColdInitialization === "passive-reequilibrated" &&
    !triSegGeometry.converged
  ) {
    throw new Error(
      `initial TriSeg equilibrium failed: ${triSegGeometry.diagnostics.failureReason ?? "unknown"}`,
    );
  }
  if (!triSegGeometry.geometry.valid) {
    throw new Error(
      `initial TriSeg geometry invalid: ${triSegGeometry.geometry.failureReason}`,
    );
  }
  const leftAtrialCalciumTarget = effectiveCalciumRateTargetAtCycleLength(
    params.calciumDrivers.leftAtrium.calcium,
    params.calciumDrivers.leftAtrium.cycleLengthSec,
  );
  const walls: NoAvpdWallStatesV2 = {
    leftAtrium: Object.freeze({
      kind: "land-active-parallel-passive-sls-v1" as const,
      active: initialLand2017ActiveOnlyStateV1(
        leftAtrialGeometry.fiberNaturalStrain,
        leftAtrialCalciumTarget.diastolicCalciumUM,
        params.atria.left.active,
      ),
      passiveSls: initialHillPassiveSlsParallelStateV1(
        leftAtrialGeometry.fiberNaturalStrain,
      ),
      materialIdentity: Object.freeze({
        landEffectiveParamsCanonicalJson:
          stableStringify(params.atria.left.active),
        passiveSlsEffectiveParamsCanonicalJson:
          stableStringify(params.atria.left.passiveSlsSourceMaterial),
      }),
    }),
    rightAtrium: initialWallState(
      rightAtrialGeometry.fiberNaturalStrain,
      params.atria.right.material,
      params.calciumDrivers.rightAtrium,
    ),
    leftFreeWall: initialWallState(
      triSegGeometry.geometry.walls.leftFreeWall.fiberNaturalStrain,
      params.triSeg.leftFreeWall.material,
      params.calciumDrivers.leftFreeWall,
    ),
    septum: initialWallState(
      triSegGeometry.geometry.walls.septum.fiberNaturalStrain,
      params.triSeg.septum.material,
      params.calciumDrivers.septum,
    ),
    rightFreeWall: initialWallState(
      triSegGeometry.geometry.walls.rightFreeWall.fiberNaturalStrain,
      params.triSeg.rightFreeWall.material,
      params.calciumDrivers.rightFreeWall,
    ),
  };
  return {
    parameterIdentityCanonicalJson:
      noAvpdFourChamberAtrialLandParameterIdentityV2(params),
    timeSec: 0,
    volumes,
    flows: {
      mitralValve: initialSmoothInertialValveStateV2(),
      aorticValve: initialSmoothInertialValveStateV2(),
      tricuspidValve: initialSmoothInertialValveStateV2(),
      pulmonaryValve: initialSmoothInertialValveStateV2(),
      pulmonaryVenousFlowMlPerSec: 80,
      systemicVenousFlowMlPerSec: 80,
    },
    calciumDrivers: mapWallIds(() =>
      initialPeriodicPrescribedCalciumDriverStateV2(),
    ),
    walls,
    triSegGeneralizedForceMapping: params.triSegGeneralizedForceMapping,
    triSegContinuation: triSegGeometry.coordinates,
  };
}

export function stepNoAvpdFourChamberAtrialLandTriSegV2(
  previous: NoAvpdFourChamberAtrialLandTriSegStateV2,
  dtSec: number,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2 = DEFAULT_NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_PARAMS_V2,
): NoAvpdFourChamberAtrialLandStepOutputV2 {
  assertCalciumDriverOwnership(params);
  assertSubsystemParameterOwnership(previous, params);
  assertLeftAtrialMaterialOwnership(previous.walls.leftAtrium, params);
  if (
    previous.triSegGeneralizedForceMapping !==
    params.triSegGeneralizedForceMapping
  ) {
    throw new Error(
      "triSegGeneralizedForceMapping changed on an accepted state; cold reinitialization is required",
    );
  }
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    throw new Error("dtSec must be positive and finite");
  }
  const nextTimeSec = previous.timeSec + dtSec;
  const calciumTrials = trialCalciumDrivers(
    previous,
    nextTimeSec,
    dtSec,
    params,
  );
  const calciumDriversValid = Object.values(calciumTrials).every(
    (trial) => trial.valid,
  );
  const freeCalciumUm = mapWallIds(
    (wallId) => calciumTrials[wallId].freeCalciumUM,
  );
  const midpointFreeCalciumUm = mapWallIds(
    (wallId) => calciumTrials[wallId].midpointFreeCalciumUM,
  );
  const initialUnknowns = stateToUnknowns(previous);
  let finalCandidate: Candidate | null = null;

  const evaluateUnknowns = (unknowns: readonly number[]): Candidate | null => {
    try {
      if (!calciumDriversValid) return null;
      return evaluateCandidate(
        previous,
        unknowns,
        dtSec,
        freeCalciumUm,
        midpointFreeCalciumUm,
        params,
      );
    } catch {
      return null;
    }
  };
  const solver = solveDampedNewtonV1(
    initialUnknowns,
    (unknowns) => {
      const candidate = evaluateUnknowns(unknowns);
      if (candidate === null) return null;
      return massAndMomentumResiduals(previous, candidate, dtSec, params);
    },
    {
      unknownScales: [
        65, 140, 700, 3_000, 65, 150, 180, 650, 100, 100, 100, 100, 80, 80,
      ],
      residualScales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      maxIterations: params.solver.maxIterations,
      residualTolerance: params.solver.residualTolerance,
      derivativeRelativeStep: params.solver.derivativeRelativeStep,
      lineSearchReduction: params.solver.lineSearchReduction,
      minLineSearchStep: params.solver.minLineSearchStep,
      jacobianReuse: params.solver.jacobianReuse,
      admissible: (unknowns) =>
        unknowns.length === 14 &&
        unknowns.every(Number.isFinite) &&
        unknowns
          .slice(0, 8)
          .every((volume) => volume >= params.solver.minimumBloodVolumeMl),
    },
  );
  if (solver.converged) finalCandidate = evaluateUnknowns(solver.unknowns);

  const failureReasons: string[] = [];
  if (!calciumDriversValid) {
    for (const wallId of WALL_IDS) {
      for (const issue of calciumTrials[wallId].issues) {
        failureReasons.push(`calcium-driver:${wallId}:${issue}`);
      }
    }
  }
  if (!solver.converged)
    failureReasons.push(
      `global-solver:${solver.failureReason ?? "not-converged"}`,
    );
  if (finalCandidate === null) failureReasons.push("final-candidate-invalid");
  if (
    finalCandidate !== null &&
    !finalCandidate.evaluation.ventricles.triSeg.converged
  ) {
    failureReasons.push("triseg-not-converged");
  }
  if (
    finalCandidate !== null &&
    !allMaterialTrialsAccepted(finalCandidate.evaluation)
  ) {
    failureReasons.push("local-material-trial-invalid");
  }
  const totalBloodVolumeResidualMl =
    finalCandidate === null
      ? null
      : totalBloodVolumeMl(finalCandidate.volumes) -
        totalBloodVolumeMl(previous.volumes);
  if (
    totalBloodVolumeResidualMl !== null &&
    Math.abs(totalBloodVolumeResidualMl) >
      params.solver.totalBloodVolumeToleranceMl
  ) {
    failureReasons.push("total-blood-volume-ledger");
  }

  if (failureReasons.length > 0 || finalCandidate === null) {
    return {
      modelId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
      accepted: false,
      state: previous,
      candidateState: null,
      evaluation: finalCandidate?.evaluation ?? null,
      solver,
      totalBloodVolumeResidualMl,
      failureReasons,
    };
  }

  const candidateState: NoAvpdFourChamberAtrialLandTriSegStateV2 = {
    parameterIdentityCanonicalJson: previous.parameterIdentityCanonicalJson,
    timeSec: nextTimeSec,
    volumes: finalCandidate.volumes,
    flows: finalCandidate.flows,
    calciumDrivers: mapWallIds((wallId) => calciumTrials[wallId].nextState),
    walls: {
      leftAtrium: Object.freeze({
        kind: "land-active-parallel-passive-sls-v1" as const,
        active: commitLand2017ActiveOnlyTrialV1(
          finalCandidate.evaluation.leftAtrium.materialTrial.activeTrial,
        ),
        passiveSls: commitHillPassiveSlsParallelTrialV1(
          finalCandidate.evaluation.leftAtrium.materialTrial.passiveSlsTrial,
        ),
        materialIdentity: previous.walls.leftAtrium.materialIdentity,
      }),
      rightAtrium: commitHillCeSeeSlsTrialV1(
        finalCandidate.evaluation.rightAtrium.materialTrial,
      ),
      leftFreeWall: commitHillCeSeeSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.leftFreeWall,
      ),
      septum: commitHillCeSeeSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.septum,
      ),
      rightFreeWall: commitHillCeSeeSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.rightFreeWall,
      ),
    },
    triSegGeneralizedForceMapping: previous.triSegGeneralizedForceMapping,
    triSegContinuation: finalCandidate.evaluation.ventricles.triSeg.coordinates,
  };
  return {
    modelId: NO_AVPD_FOUR_CHAMBER_ATRIAL_LAND_TRISEG_MODEL_ID_V2,
    accepted: true,
    state: candidateState,
    candidateState,
    evaluation: finalCandidate.evaluation,
    solver,
    totalBloodVolumeResidualMl,
    failureReasons: [],
  };
}

function trialAtrialLandMaterialV2(
  previous: NoAvpdAtrialLandWallStateV2,
  input: {
    readonly dtSec: number;
    readonly totalStrain: number;
    readonly freeCalciumUm: number;
  },
  params: NoAvpdAtrialLandWallParamsV2,
): NoAvpdAtrialLandMaterialTrialV2 {
  if (
    Math.abs(
      previous.active.previousFiberLogStrain -
        previous.passiveSls.totalStrain,
    ) > 1e-12
  ) {
    throw new Error("accepted LA Land and passive/SLS strain histories diverged");
  }
  const activeTrial = trialLand2017ActiveOnlyV1(
    previous.active,
    {
      dtSec: input.dtSec,
      fiberLogStrain: input.totalStrain,
      freeCalciumUm: input.freeCalciumUm,
    },
    params.active,
  );
  const passiveSlsTrial = trialHillPassiveSlsParallelV1(
    previous.passiveSls,
    { dtSec: input.dtSec, totalStrain: input.totalStrain },
    params.passiveSlsSourceMaterial,
  );
  if (
    !activeTrial.valid ||
    !activeTrial.finite ||
    activeTrial.readback == null ||
    !passiveSlsTrial.valid ||
    !passiveSlsTrial.finite ||
    passiveSlsTrial.readback == null
  ) {
    return Object.freeze({
      activeTrial,
      passiveSlsTrial,
      valid: false,
      finite: activeTrial.finite && passiveSlsTrial.finite,
      readback: null,
    });
  }
  const passive = passiveSlsTrial.readback;
  const activeStressPa = activeTrial.readback.wallActiveKirchhoffStressPa;
  const readback: NoAvpdAtrialLandMaterialReadbackV2 = Object.freeze({
    freeCalciumUm: input.freeCalciumUm,
    activation01: activeTrial.readback.state.CaTRPN,
    stresses: Object.freeze({
      passiveEquilibriumPa: passive.passiveEquilibriumStressPa,
      landActivePa: activeStressPa,
      slsOverstressPa: passive.slsOverstressPa,
      totalTransmittedPa:
        passive.passiveEquilibriumStressPa +
        activeStressPa +
        passive.slsOverstressPa,
    }),
    tangentsPa: Object.freeze({
      passivePlusSlsAlgorithmicPa:
        passive.passivePlusSlsAlgorithmicTangentPa,
      landAlgorithmicTangentAvailable: false,
    }),
  });
  return Object.freeze({
    activeTrial,
    passiveSlsTrial,
    valid: true,
    finite: true,
    readback,
  });
}

function evaluateCandidate(
  previous: NoAvpdFourChamberAtrialLandTriSegStateV2,
  unknowns: readonly number[],
  dtSec: number,
  freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>,
  midpointFreeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): Candidate | null {
  const { volumes, flows } = unknownsToStateParts(unknowns);
  const leftAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    volumes.leftAtriumMl,
    params.atria.left.geometry,
  );
  const rightAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    volumes.rightAtriumMl,
    params.atria.right.geometry,
  );
  const leftAtrialTrial = trialAtrialLandMaterialV2(
    previous.walls.leftAtrium,
    {
      dtSec,
      totalStrain: leftAtrialGeometry.fiberNaturalStrain,
      freeCalciumUm: freeCalciumUm.leftAtrium,
    },
    params.atria.left,
  );
  const rightAtrialTrial = trialHillCeSeeSlsV1(
    previous.walls.rightAtrium,
    {
      dtSec,
      totalStrain: rightAtrialGeometry.fiberNaturalStrain,
      freeCalciumUm: freeCalciumUm.rightAtrium,
      midpointFreeCalciumUm: midpointFreeCalciumUm.rightAtrium,
    },
    params.atria.right.material,
  );
  if (!leftAtrialTrial.valid || !trialAccepted(rightAtrialTrial))
    return null;

  const ventricularTrialsAt = (
    geometry: TriSegGeometryValidOutputV1,
  ): Readonly<Record<TriSegWallIdV1, HillCeSeeSlsTrialV1>> => ({
    leftFreeWall: trialHillCeSeeSlsV1(
      previous.walls.leftFreeWall,
      {
        dtSec,
        totalStrain: geometry.walls.leftFreeWall.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.leftFreeWall,
        midpointFreeCalciumUm: midpointFreeCalciumUm.leftFreeWall,
      },
      params.triSeg.leftFreeWall.material,
    ),
    septum: trialHillCeSeeSlsV1(
      previous.walls.septum,
      {
        dtSec,
        totalStrain: geometry.walls.septum.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.septum,
        midpointFreeCalciumUm: midpointFreeCalciumUm.septum,
      },
      params.triSeg.septum.material,
    ),
    rightFreeWall: trialHillCeSeeSlsV1(
      previous.walls.rightFreeWall,
      {
        dtSec,
        totalStrain: geometry.walls.rightFreeWall.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.rightFreeWall,
        midpointFreeCalciumUm: midpointFreeCalciumUm.rightFreeWall,
      },
      params.triSeg.rightFreeWall.material,
    ),
  });
  const ventricularStressesAt = (geometry: TriSegGeometryValidOutputV1) => {
    const trials = ventricularTrialsAt(geometry);
    for (const wallId of ["leftFreeWall", "septum", "rightFreeWall"] as const) {
      if (!trialAccepted(trials[wallId])) {
        throw new Error(`invalid ${wallId} material trial`);
      }
    }
    return {
      leftFreeWall: trials.leftFreeWall.readback.stresses.totalTransmittedPa,
      septum: trials.septum.readback.stresses.totalTransmittedPa,
      rightFreeWall: trials.rightFreeWall.readback.stresses.totalTransmittedPa,
    };
  };
  const triSegSolverOptions = {
    maxIterations: params.solver.triSegMaxIterations,
    relativeResidualTolerance: params.solver.triSegRelativeResidualTolerance,
  } as const;
  const triSeg: NoAvpdTriSegEquilibriumSolutionV1 =
    params.triSegGeneralizedForceMapping === "full-fiber-energy-gradient"
      ? solveTriSegFullFiberEnergyGradientEquilibriumV1(
          triSegBaseInput(volumes, params),
          ventricularStressesAt,
          previous.triSegContinuation,
          triSegSolverOptions,
        )
      : solveTriSegAlgebraicEquilibriumV1(
          triSegBaseInput(volumes, params),
          (geometry) => {
            const stresses = ventricularStressesAt(geometry);
            return {
              leftFreeWall: representativeTriSegMidwallTensionFromFiberStressV1(
                geometry.walls.leftFreeWall,
                stresses.leftFreeWall,
              ),
              septum: representativeTriSegMidwallTensionFromFiberStressV1(
                geometry.walls.septum,
                stresses.septum,
              ),
              rightFreeWall:
                representativeTriSegMidwallTensionFromFiberStressV1(
                  geometry.walls.rightFreeWall,
                  stresses.rightFreeWall,
                ),
            };
          },
          previous.triSegContinuation,
          triSegSolverOptions,
        );
  if (!triSeg.converged || !triSeg.geometry.valid) return null;
  const ventricularPressureReadback =
    "generalizedForceMapping" in triSeg
      ? (triSeg.fullFiberEnergyGradient?.pressures ?? null)
      : (triSeg.virtualWork?.pressures ?? null);
  if (ventricularPressureReadback === null) return null;
  const ventricularTrials = ventricularTrialsAt(triSeg.geometry);
  if (!Object.values(ventricularTrials).every(trialAccepted)) return null;

  const pressures: NoAvpdPressureReadbackV1 = {
    leftAtriumMmHg:
      oneFiberCavityPressurePaV1(
        leftAtrialGeometry,
        leftAtrialTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG,
    leftVentricleMmHg: ventricularPressureReadback.leftVentricleTransmuralMmHg,
    systemicArteryMmHg: vascularPressure(
      volumes.systemicArteryMl,
      params.vascular.systemicArtery,
    ),
    systemicVeinMmHg: vascularPressure(
      volumes.systemicVeinMl,
      params.vascular.systemicVein,
    ),
    rightAtriumMmHg:
      oneFiberCavityPressurePaV1(
        rightAtrialGeometry,
        rightAtrialTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG,
    rightVentricleMmHg:
      ventricularPressureReadback.rightVentricleTransmuralMmHg,
    pulmonaryArteryMmHg: vascularPressure(
      volumes.pulmonaryArteryMl,
      params.vascular.pulmonaryArtery,
    ),
    pulmonaryVeinMmHg: vascularPressure(
      volumes.pulmonaryVeinMl,
      params.vascular.pulmonaryVein,
    ),
  };
  if (!Object.values(pressures).every(Number.isFinite)) return null;

  const valves = {
    mitral: evaluateSmoothInertialValveStateV2(
      previous.flows.mitralValve,
      flows.mitralValve,
      {
        dtSec,
        upstreamPressureMmHg: pressures.leftAtriumMmHg,
        downstreamPressureMmHg: pressures.leftVentricleMmHg,
      },
      params.valves.mitral,
    ),
    aortic: evaluateSmoothInertialValveStateV2(
      previous.flows.aorticValve,
      flows.aorticValve,
      {
        dtSec,
        upstreamPressureMmHg: pressures.leftVentricleMmHg,
        downstreamPressureMmHg: pressures.systemicArteryMmHg,
      },
      params.valves.aortic,
    ),
    tricuspid: evaluateSmoothInertialValveStateV2(
      previous.flows.tricuspidValve,
      flows.tricuspidValve,
      {
        dtSec,
        upstreamPressureMmHg: pressures.rightAtriumMmHg,
        downstreamPressureMmHg: pressures.rightVentricleMmHg,
      },
      params.valves.tricuspid,
    ),
    pulmonary: evaluateSmoothInertialValveStateV2(
      previous.flows.pulmonaryValve,
      flows.pulmonaryValve,
      {
        dtSec,
        upstreamPressureMmHg: pressures.rightVentricleMmHg,
        downstreamPressureMmHg: pressures.pulmonaryArteryMmHg,
      },
      params.valves.pulmonary,
    ),
  };
  const flowReadback: NoAvpdFlowReadbackV1 = {
    mitralMlPerSec: flows.mitralValve.qMlPerSec,
    aorticMlPerSec: flows.aorticValve.qMlPerSec,
    systemicPeripheralMlPerSec:
      (pressures.systemicArteryMmHg - pressures.systemicVeinMmHg) /
      params.vascular.systemicResistanceMmHgSecPerMl,
    systemicVenousMlPerSec: flows.systemicVenousFlowMlPerSec,
    tricuspidMlPerSec: flows.tricuspidValve.qMlPerSec,
    pulmonaryValveMlPerSec: flows.pulmonaryValve.qMlPerSec,
    pulmonaryPeripheralMlPerSec:
      (pressures.pulmonaryArteryMmHg - pressures.pulmonaryVeinMmHg) /
      params.vascular.pulmonaryResistanceMmHgSecPerMl,
    pulmonaryVenousMlPerSec: flows.pulmonaryVenousFlowMlPerSec,
  };
  if (!Object.values(flowReadback).every(Number.isFinite)) return null;

  const activations01 = {
    leftAtrium: leftAtrialTrial.readback.activation01,
    rightAtrium: rightAtrialTrial.readback.thinFilamentAvailability01,
    leftFreeWall:
      ventricularTrials.leftFreeWall.readback.thinFilamentAvailability01,
    septum: ventricularTrials.septum.readback.thinFilamentAvailability01,
    rightFreeWall:
      ventricularTrials.rightFreeWall.readback.thinFilamentAvailability01,
  } as const;

  return {
    volumes,
    flows,
    evaluation: {
      freeCalciumUm,
      activations01,
      pressures,
      flowReadback,
      leftAtrium: {
        geometry: leftAtrialGeometry,
        materialTrial: leftAtrialTrial,
        transmuralPressureMmHg: pressures.leftAtriumMmHg,
      },
      rightAtrium: {
        geometry: rightAtrialGeometry,
        materialTrial: rightAtrialTrial,
        transmuralPressureMmHg: pressures.rightAtriumMmHg,
      },
      ventricles: { triSeg, materialTrials: ventricularTrials },
      valves,
      totalBloodVolumeMl: totalBloodVolumeMl(volumes),
    },
  };
}

function massAndMomentumResiduals(
  previous: NoAvpdFourChamberAtrialLandTriSegStateV2,
  candidate: Candidate,
  dtSec: number,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): readonly number[] {
  const v0 = previous.volumes;
  const v = candidate.volumes;
  const q = candidate.evaluation.flowReadback;
  const p = candidate.evaluation.pressures;
  return [
    v.leftAtriumMl -
      v0.leftAtriumMl -
      dtSec * (q.pulmonaryVenousMlPerSec - q.mitralMlPerSec),
    v.leftVentricleMl -
      v0.leftVentricleMl -
      dtSec * (q.mitralMlPerSec - q.aorticMlPerSec),
    v.systemicArteryMl -
      v0.systemicArteryMl -
      dtSec * (q.aorticMlPerSec - q.systemicPeripheralMlPerSec),
    v.systemicVeinMl -
      v0.systemicVeinMl -
      dtSec * (q.systemicPeripheralMlPerSec - q.systemicVenousMlPerSec),
    v.rightAtriumMl -
      v0.rightAtriumMl -
      dtSec * (q.systemicVenousMlPerSec - q.tricuspidMlPerSec),
    v.rightVentricleMl -
      v0.rightVentricleMl -
      dtSec * (q.tricuspidMlPerSec - q.pulmonaryValveMlPerSec),
    v.pulmonaryArteryMl -
      v0.pulmonaryArteryMl -
      dtSec * (q.pulmonaryValveMlPerSec - q.pulmonaryPeripheralMlPerSec),
    v.pulmonaryVeinMl -
      v0.pulmonaryVeinMl -
      dtSec * (q.pulmonaryPeripheralMlPerSec - q.pulmonaryVenousMlPerSec),
    candidate.evaluation.valves.mitral.pressureFlowResidualMmHg,
    candidate.evaluation.valves.aortic.pressureFlowResidualMmHg,
    candidate.evaluation.valves.tricuspid.pressureFlowResidualMmHg,
    candidate.evaluation.valves.pulmonary.pressureFlowResidualMmHg,
    p.pulmonaryVeinMmHg -
      p.leftAtriumMmHg -
      params.vascular.pulmonaryVenousSegment.resistanceMmHgSecPerMl *
        q.pulmonaryVenousMlPerSec -
      (params.vascular.pulmonaryVenousSegment.inertanceMmHgSec2PerMl *
        (q.pulmonaryVenousMlPerSec -
          previous.flows.pulmonaryVenousFlowMlPerSec)) /
        dtSec,
    p.systemicVeinMmHg -
      p.rightAtriumMmHg -
      params.vascular.systemicVenousSegment.resistanceMmHgSecPerMl *
        q.systemicVenousMlPerSec -
      (params.vascular.systemicVenousSegment.inertanceMmHgSec2PerMl *
        (q.systemicVenousMlPerSec -
          previous.flows.systemicVenousFlowMlPerSec)) /
        dtSec,
  ];
}

function trialCalciumDrivers(
  previous: NoAvpdFourChamberAtrialLandTriSegStateV2,
  nextTimeSec: number,
  dtSec: number,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): NoAvpdCalciumDriverTrialsV1 {
  return mapWallIds((wallId) =>
    trialPeriodicPrescribedCalciumDriverV2(
      previous.calciumDrivers[wallId],
      nextTimeSec,
      dtSec,
      params.calciumDrivers[wallId],
    ),
  );
}

function stateToUnknowns(
  state: NoAvpdFourChamberAtrialLandTriSegStateV2,
): readonly number[] {
  const v = state.volumes;
  return [
    v.leftAtriumMl,
    v.leftVentricleMl,
    v.systemicArteryMl,
    v.systemicVeinMl,
    v.rightAtriumMl,
    v.rightVentricleMl,
    v.pulmonaryArteryMl,
    v.pulmonaryVeinMl,
    state.flows.mitralValve.qMlPerSec,
    state.flows.aorticValve.qMlPerSec,
    state.flows.tricuspidValve.qMlPerSec,
    state.flows.pulmonaryValve.qMlPerSec,
    state.flows.pulmonaryVenousFlowMlPerSec,
    state.flows.systemicVenousFlowMlPerSec,
  ];
}

function unknownsToStateParts(unknowns: readonly number[]): {
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
} {
  if (unknowns.length !== 14) throw new Error("expected 14 global unknowns");
  return {
    volumes: {
      leftAtriumMl: unknowns[0]!,
      leftVentricleMl: unknowns[1]!,
      systemicArteryMl: unknowns[2]!,
      systemicVeinMl: unknowns[3]!,
      rightAtriumMl: unknowns[4]!,
      rightVentricleMl: unknowns[5]!,
      pulmonaryArteryMl: unknowns[6]!,
      pulmonaryVeinMl: unknowns[7]!,
    },
    flows: {
      mitralValve: { qMlPerSec: unknowns[8]! },
      aorticValve: { qMlPerSec: unknowns[9]! },
      tricuspidValve: { qMlPerSec: unknowns[10]! },
      pulmonaryValve: { qMlPerSec: unknowns[11]! },
      pulmonaryVenousFlowMlPerSec: unknowns[12]!,
      systemicVenousFlowMlPerSec: unknowns[13]!,
    },
  };
}

function triSegBaseInput(
  volumes: NoAvpdBloodVolumesV1,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
) {
  return {
    leftVentricleCavityVolumeMl: volumes.leftVentricleMl,
    rightVentricleCavityVolumeMl: volumes.rightVentricleMl,
    walls: {
      leftFreeWall: stripMaterial(params.triSeg.leftFreeWall),
      septum: stripMaterial(params.triSeg.septum),
      rightFreeWall: stripMaterial(params.triSeg.rightFreeWall),
    },
  };
}

/**
 * Fixed-volume, zero-activation, long-time passive TriSeg re-equilibration.
 * This is the public cold-start comparator for both generalized-force mappings;
 * it does not reuse Hill, SLS, or CaTRPN history and never falls back between
 * mappings.
 */
export function solveNoAvpdPassiveTriSegEquilibriumV1(
  volumes: NoAvpdBloodVolumesV1,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): NoAvpdTriSegEquilibriumSolutionV1 {
  const baseInput = triSegBaseInput(volumes, params);
  const initialCoordinates = {
    junctionRadiusCm: 3.3,
    septalCapVolumeMl: 0,
  } as const;
  const solverOptions = {
    maxIterations: params.solver.triSegMaxIterations,
    relativeResidualTolerance: params.solver.triSegRelativeResidualTolerance,
  } as const;
  const passiveStressesAt = (geometry: TriSegGeometryValidOutputV1) =>
    Object.fromEntries(
      (["leftFreeWall", "septum", "rightFreeWall"] as const).map((wallId) => {
        const passive = evaluateHillPassiveEquilibriumV1(
          geometry.walls[wallId].fiberNaturalStrain,
          params.triSeg[wallId].material,
        );
        if (!passive.valid) {
          throw new Error(
            `invalid passive ${wallId} evaluation: ${passive.failureReason}`,
          );
        }
        return [wallId, passive.stressPa];
      }),
    ) as Readonly<Record<TriSegWallIdV1, number>>;

  if (params.triSegGeneralizedForceMapping === "full-fiber-energy-gradient") {
    return solveTriSegFullFiberEnergyGradientEquilibriumV1(
      baseInput,
      passiveStressesAt,
      initialCoordinates,
      solverOptions,
    );
  }
  return solveTriSegAlgebraicEquilibriumV1(
    baseInput,
    (geometry) => {
      const stresses = passiveStressesAt(geometry);
      return {
        leftFreeWall: representativeTriSegMidwallTensionFromFiberStressV1(
          geometry.walls.leftFreeWall,
          stresses.leftFreeWall,
        ),
        septum: representativeTriSegMidwallTensionFromFiberStressV1(
          geometry.walls.septum,
          stresses.septum,
        ),
        rightFreeWall: representativeTriSegMidwallTensionFromFiberStressV1(
          geometry.walls.rightFreeWall,
          stresses.rightFreeWall,
        ),
      };
    },
    initialCoordinates,
    solverOptions,
  );
}

function stripMaterial(
  params: NoAvpdTriSegWallParamsV1,
): TriSegWallParametersV1 {
  return {
    wallVolumeMl: params.wallVolumeMl,
    referenceMidwallAreaCm2: params.referenceMidwallAreaCm2,
  };
}

function vascularPressure(
  volumeMl: number,
  params: LinearComplianceCompartmentParamsV1,
): number {
  return (volumeMl - params.unstressedVolumeMl) / params.complianceMlPerMmHg;
}

export function totalBloodVolumeMl(volumes: NoAvpdBloodVolumesV1): number {
  return Object.values(volumes).reduce((sum, volume) => sum + volume, 0);
}

function trialAccepted(trial: HillCeSeeSlsTrialV1): boolean {
  return trial.valid && trial.finite && trial.solver.converged;
}

function allMaterialTrialsAccepted(
  evaluation: NoAvpdFourChamberAtrialLandEvaluationV2,
): boolean {
  return (
    evaluation.leftAtrium.materialTrial.valid &&
    evaluation.leftAtrium.materialTrial.finite &&
    trialAccepted(evaluation.rightAtrium.materialTrial) &&
    Object.values(evaluation.ventricles.materialTrials).every(trialAccepted)
  );
}

function mapWallIds<T>(
  factory: (wallId: NoAvpdWallIdV1) => T,
): Readonly<Record<NoAvpdWallIdV1, T>> {
  return {
    leftAtrium: factory("leftAtrium"),
    rightAtrium: factory("rightAtrium"),
    leftFreeWall: factory("leftFreeWall"),
    septum: factory("septum"),
    rightFreeWall: factory("rightFreeWall"),
  };
}

function initialWallState(
  totalStrain: number,
  material: HillCeSeeSlsParamsV1,
  calciumDriverParams: PeriodicPrescribedCalciumDriverParamsV2,
): HillCeSeeSlsStateV1 {
  const calciumTarget = effectiveCalciumRateTargetAtCycleLength(
    calciumDriverParams.calcium,
    calciumDriverParams.cycleLengthSec,
  );
  const caTroponin = equilibriumLandFormCaTroponinActivationStateV1(
    calciumTarget.diastolicCalciumUM,
    totalStrain,
    material.calciumTroponinActivation,
  );
  return initialHillCeSeeSlsStateV1(
    totalStrain,
    totalStrain,
    0,
    caTroponin.caTroponin01,
    caTroponin.thinFilamentAvailability01,
  );
}

function assertCalciumDriverOwnership(
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): void {
  if (!Number.isFinite(params.cycleLengthSec) || params.cycleLengthSec <= 0) {
    throw new Error("cycleLengthSec must be finite and positive");
  }
  if (
    params.triSegGeneralizedForceMapping !==
      "lumens-2009-representative-tension-area-work" &&
    params.triSegGeneralizedForceMapping !== "full-fiber-energy-gradient"
  ) {
    throw new Error("unsupported triSegGeneralizedForceMapping");
  }
  if (
    params.triSegColdInitialization !== "legacy-seed" &&
    params.triSegColdInitialization !== "passive-reequilibrated"
  ) {
    throw new Error("unsupported triSegColdInitialization");
  }
  const targetIds = new Set<string>();
  for (const wallId of WALL_IDS) {
    const driver = params.calciumDrivers[wallId];
    if (Math.abs(driver.cycleLengthSec - params.cycleLengthSec) > 1e-12) {
      throw new Error(
        `${wallId} calcium-driver cycle length must equal subsystem cycle length`,
      );
    }
    if (targetIds.has(driver.targetId)) {
      throw new Error(
        `calcium-driver targetId must be unique: ${driver.targetId}`,
      );
    }
    targetIds.add(driver.targetId);
  }
}

function assertLeftAtrialMaterialOwnership(
  state: NoAvpdAtrialLandWallStateV2,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): void {
  if (state.kind !== "land-active-parallel-passive-sls-v1") {
    throw new Error("unsupported left-atrial constitutive state kind");
  }
  if (
    state.materialIdentity.landEffectiveParamsCanonicalJson !==
      stableStringify(params.atria.left.active) ||
    state.materialIdentity.passiveSlsEffectiveParamsCanonicalJson !==
      stableStringify(params.atria.left.passiveSlsSourceMaterial)
  ) {
    throw new Error(
      "left-atrial material identity changed on an accepted state; cold reinitialization is required",
    );
  }
  if (
    Math.abs(
      state.active.previousFiberLogStrain - state.passiveSls.totalStrain,
    ) > 1e-12
  ) {
    throw new Error("accepted LA Land and passive/SLS strain histories diverged");
  }
}

function assertSubsystemParameterOwnership(
  state: NoAvpdFourChamberAtrialLandTriSegStateV2,
  params: NoAvpdFourChamberAtrialLandTriSegParamsV2,
): void {
  if (
    state.parameterIdentityCanonicalJson !==
      noAvpdFourChamberAtrialLandParameterIdentityV2(params)
  ) {
    throw new Error(
      "effective subsystem parameters changed on an accepted state; cold reinitialization is required",
    );
  }
}

function createDefaultParams(): NoAvpdFourChamberAtrialLandTriSegParamsV2 {
  const cycleLengthSec = 1;
  // Geometry re-referencing below only normalizes the Land CE stretch domain.
  // Shift the pre-existing passive/overlap references by the same log-strain
  // coordinate offsets so this is not an unlabelled stiffness retune.
  const leftAtrialReferenceShift =
    Math.log((24 + 0.5 * 20) / (60 + 0.5 * 20)) / 3;
  const rightAtrialReferenceShift =
    Math.log((26 + 0.5 * 16) / (40 + 0.5 * 16)) / 3;
  const septalReferenceShift = 0.5 * Math.log(25 / 34);
  const rightFreeWallReferenceShift = 0.5 * Math.log(105 / 110);
  const leftAtrialPassiveSlsMaterial = passiveSlsMaterialParams({
    parameterSetId: "no-avpd-la-passive-sls-engineering-seed-v2",
    passiveTangentModulusPa: 8_000,
    passiveReferenceStrain: leftAtrialReferenceShift,
    slsModulusPa: 4_000,
    slsRelaxationTimeSec: 0.12,
  });
  const rightAtrialMaterial = materialParams({
    parameterSetId: "no-avpd-ra-hill-ce-see-sls-engineering-seed-v1",
    maximumIsometricTensionPa: 75_000,
    optimalStrain: 0.2 + rightAtrialReferenceShift,
    passiveTangentModulusPa: 8_000,
    passiveReferenceStrain: rightAtrialReferenceShift,
    slsModulusPa: 4_000,
    slsRelaxationTimeSec: 0.12,
  });
  const lvMaterial = materialParams({
    parameterSetId: "no-avpd-lvfw-hill-ce-see-sls-engineering-seed-v1",
    maximumIsometricTensionPa: 350_000,
    optimalStrain: 0.1,
    passiveTangentModulusPa: 12_000,
    passiveReferenceStrain: -0.1,
    slsModulusPa: 8_000,
    slsRelaxationTimeSec: 0.12,
  });
  const septalMaterial = materialParams({
    parameterSetId: "no-avpd-septum-hill-ce-see-sls-engineering-seed-v1",
    maximumIsometricTensionPa: 320_000,
    optimalStrain: 0.1 + septalReferenceShift,
    passiveTangentModulusPa: 12_000,
    passiveReferenceStrain: septalReferenceShift,
    slsModulusPa: 8_000,
    slsRelaxationTimeSec: 0.12,
  });
  const rvMaterial = materialParams({
    parameterSetId: "no-avpd-rvfw-hill-ce-see-sls-engineering-seed-v1",
    maximumIsometricTensionPa: 230_000,
    optimalStrain: 0.1 + rightFreeWallReferenceShift,
    passiveTangentModulusPa: 10_000,
    passiveReferenceStrain: rightFreeWallReferenceShift,
    slsModulusPa: 6_000,
    slsRelaxationTimeSec: 0.12,
  });
  return {
    cycleLengthSec,
    triSegGeneralizedForceMapping: DEFAULT_TRISEG_GENERALIZED_FORCE_MAPPING_V1,
    triSegColdInitialization: "legacy-seed",
    calciumDrivers: {
      leftAtrium: calciumDriver(
        "LA",
        cycleLengthSec,
        0.78,
        LAND_NIEDERER_ATRIAL_CALCIUM_CONTEXT_DRIVER_V2,
      ),
      rightAtrium: calciumDriver(
        "RA",
        cycleLengthSec,
        0.76,
        ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
      ),
      leftFreeWall: calciumDriver(
        "LVFW",
        cycleLengthSec,
        0,
        VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
      ),
      septum: calciumDriver(
        "SEP",
        cycleLengthSec,
        0,
        VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
      ),
      rightFreeWall: calciumDriver(
        "RVFW",
        cycleLengthSec,
        0.01,
        VENTRICULAR_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
      ),
    },
    atria: {
      left: {
        geometry: {
          wallVolumeMl: 20,
          referenceCavityVolumeMl: 60,
          midwallFraction01: 0.5,
        },
        passiveSlsSourceMaterial: leftAtrialPassiveSlsMaterial,
        active: DEFAULT_LAND2017_ATRIAL_ACTIVE_ONLY_PARAMS_V1,
      },
      right: {
        geometry: {
          wallVolumeMl: 16,
          referenceCavityVolumeMl: 40,
          midwallFraction01: 0.5,
        },
        material: rightAtrialMaterial,
      },
    },
    triSeg: {
      leftFreeWall: {
        wallVolumeMl: 75,
        referenceMidwallAreaCm2: 100,
        material: lvMaterial,
      },
      septum: {
        wallVolumeMl: 40,
        referenceMidwallAreaCm2: 34,
        material: septalMaterial,
      },
      rightFreeWall: {
        wallVolumeMl: 35,
        referenceMidwallAreaCm2: 110,
        material: rvMaterial,
      },
    },
    vascular: {
      systemicArtery: { unstressedVolumeMl: 550, complianceMlPerMmHg: 1.7 },
      systemicVein: { unstressedVolumeMl: 2_700, complianceMlPerMmHg: 100 },
      pulmonaryArtery: { unstressedVolumeMl: 120, complianceMlPerMmHg: 5 },
      pulmonaryVein: { unstressedVolumeMl: 450, complianceMlPerMmHg: 25 },
      systemicResistanceMmHgSecPerMl: 1.2,
      pulmonaryResistanceMmHgSecPerMl: 0.05,
      systemicVenousSegment: {
        resistanceMmHgSecPerMl: 0.025,
        inertanceMmHgSec2PerMl: 0.0015,
      },
      pulmonaryVenousSegment: {
        resistanceMmHgSecPerMl: 0.04,
        inertanceMmHgSec2PerMl: 0.002,
      },
    },
    valves: {
      mitral: valveParams("MV", 4.5, 0.03, 0.004, 0.00025, 2e-5, 0.12, 0.1),
      aortic: valveParams("AoV", 3.2, 0.015, 0.002, 0.0002, 4e-5, 0.5, 0.2),
      tricuspid: valveParams("TV", 6, 0.04, 0.003, 0.0002, 1.5e-5, 0.1, 0.1),
      pulmonary: valveParams("PV", 3.5, 0.02, 0.002, 0.0002, 3e-5, 0.3, 0.15),
    },
    solver: {
      // The raw atrial Land prior is much stiffer than the PR #467 Hill
      // control. Keep every finite-difference Jacobian fresh in this V2 rather
      // than hiding that stiffness with a constitutive gain.
      maxIterations: 40,
      residualTolerance: 1e-7,
      derivativeRelativeStep: 2e-6,
      lineSearchReduction: 0.5,
      minLineSearchStep: 1 / 2048,
      jacobianReuse: {
        maxAcceptedSteps: 0,
        refreshWhenResidualRatioExceeds: 0.75,
        retryWithFreshJacobianOnFailure: true,
      },
      minimumBloodVolumeMl: 1,
      totalBloodVolumeToleranceMl: 1e-6,
      triSegMaxIterations: 40,
      triSegRelativeResidualTolerance: 1e-7,
    },
  };
}

function passiveSlsMaterialParams(input: {
  readonly parameterSetId: string;
  readonly passiveTangentModulusPa: number;
  readonly passiveReferenceStrain: number;
  readonly slsModulusPa: number;
  readonly slsRelaxationTimeSec: number;
}): HillPassiveSlsParallelParamsV1 {
  return prepareHillPassiveSlsParallelParamsV1({
    parameterSetId: input.parameterSetId,
    passive: {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.passive,
      tangentModulusPa: input.passiveTangentModulusPa,
      referenceStrain: input.passiveReferenceStrain,
    },
    sls: {
      enabled: true,
      modulusPa: input.slsModulusPa,
      relaxationTimeSec: input.slsRelaxationTimeSec,
    },
  });
}

function materialParams(input: {
  readonly parameterSetId: string;
  readonly maximumIsometricTensionPa: number;
  readonly optimalStrain: number;
  readonly passiveTangentModulusPa: number;
  readonly passiveReferenceStrain: number;
  readonly slsModulusPa: number;
  readonly slsRelaxationTimeSec: number;
}): HillCeSeeSlsParamsV1 {
  return prepareHillCeSeeSlsParamsV1({
    ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1,
    parameterSetId: input.parameterSetId,
    calciumTroponinActivation: LAND_FORM_CA_TROPONIN_NTM_3_CANDIDATE_PARAMS_V1,
    passive: {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.passive,
      tangentModulusPa: input.passiveTangentModulusPa,
      referenceStrain: input.passiveReferenceStrain,
    },
    contractileElement: {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.contractileElement,
      maximumIsometricTensionPa: input.maximumIsometricTensionPa,
      optimalStrain: input.optimalStrain,
      // Length-dependent CaT50 owns physiological recruitment.  This broad
      // envelope only suppresses clearly out-of-range overlap.
      lengthWidth: 0.45,
      minimumLengthFactor: 0.75,
    },
    // A near-isometric active stress around 100 kPa should stretch the serial
    // elastic branch by order 8--10%, not the ~30% produced by the generic
    // constitutive engineering seed.
    seriesElasticElement: {
      ...DEFAULT_HILL_CE_SEE_SLS_PARAMS_V1.seriesElasticElement,
      linearStiffnessPa: 1_000_000,
      cubicStiffnessPa: 5_000_000,
    },
    sls: {
      enabled: true,
      modulusPa: input.slsModulusPa,
      relaxationTimeSec: input.slsRelaxationTimeSec,
    },
  });
}

function calciumDriver(
  targetId: string,
  cycleLengthSec: number,
  eventOnsetSec: number,
  calcium: PeriodicPrescribedCalciumDriverParamsV2["calcium"],
): PeriodicPrescribedCalciumDriverParamsV2 {
  return {
    targetId,
    cycleLengthSec,
    eventOnsetSec,
    eventStrength01: 1,
    calcium,
    minimumReleaseSamples: 4,
  };
}

function valveParams(
  valveId: SmoothInertialValveParamsV2["valveId"],
  openAreaCm2: number,
  leakAreaCm2: number,
  openResistanceMmHgSecPerMl: number,
  openInertanceMmHgSec2PerMl: number,
  openBernoulliMmHgSec2PerMl2: number,
  openingMidpointMmHg: number,
  openingWidthMmHg: number,
): SmoothInertialValveParamsV2 {
  return {
    valveId,
    openAreaCm2,
    leakAreaCm2,
    openingMidpointMmHg,
    openingWidthMmHg,
    openResistanceMmHgSecPerMl,
    openInertanceMmHgSec2PerMl,
    openBernoulliMmHgSec2PerMl2,
    flowSmoothingMlPerSec: 0.5,
    newtonIterations: 8,
  };
}

/** Exact, key-order-independent identity for the JSON-like parameter tree. */
function stableStringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("parameter identity cannot encode non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort();
    return `{${keys.map((key) =>
      `${JSON.stringify(key)}:${stableStringify(record[key])}`
    ).join(",")}}`;
  }
  throw new Error(`parameter identity cannot encode ${typeof value}`);
}
