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
  createLand2017AtrialActiveOnlyParamsV1,
  createLand2017VentricularActiveOnlyParamsV1,
} from "@/engine/mechanics2/activation/LiteratureLand2017ActiveOnlyParamsV1";
import {
  commitParallelBodyAppendageWallTrialV1,
  initialParallelBodyAppendageWallStateV1,
  trialParallelBodyAppendageWallAtPartitionV1,
  trialParallelBodyAppendageWallV1,
  type ParallelBodyAppendageWallParamsV1,
  type ParallelBodyAppendageWallStateV1,
  type ParallelBodyAppendageWallTrialV1,
} from "@/engine/mechanics2/atrial/ParallelBodyAppendageWallV1";
import {
  evaluateEquilibriumPassiveStressV1,
  prepareEquilibriumPassiveSlsParallelParamsV1,
} from "@/engine/mechanics2/constitutive/EquilibriumPassiveSlsParallelV1";
import {
  LAND_ACTIVE_PASSIVE_SLS_V1_ID,
  commitLandActivePassiveSlsTrialV1,
  initialLandActivePassiveSlsStateV1,
  landActivePassiveSlsMaterialIdentityV1,
  prepareLandActivePassiveSlsParamsV1,
  trialLandActivePassiveSlsV1,
  type LandActivePassiveSlsParamsV1,
  type LandActivePassiveSlsStateV1,
  type LandActivePassiveSlsTrialV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import {
  evaluateOneFiberVolumeGeometryV1,
  oneFiberCavityPressurePaV1,
  type OneFiberVolumeGeometryParamsV1,
  type OneFiberVolumeGeometryV1,
} from "@/engine/mechanics2/geometry/OneFiberVolumeGeometryV1";
import {
  computeIntrapericardialHeartVolumeMlV1,
  evaluateCommonPericardiumV1,
  type CommonPericardiumOutputV1,
  type CommonPericardiumParamsV1,
} from "@/engine/mechanics2/constraints/CommonPericardiumV1";
import {
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
  solveFivePatchDampedNewtonV1,
  type FivePatchDampedNewtonResultV1,
} from "@/engine/mechanics2/solver/FivePatchDampedNewtonV1";
import {
  evaluateSmoothInertialValveStateV2,
  initialSmoothInertialValveStateV2,
  stepSmoothInertialValveV2,
  type SmoothInertialValveOutputV2,
  type SmoothInertialValveParamsV2,
  type SmoothInertialValveStateV2,
} from "@/engine/mechanics2/valve/SmoothInertialValveV2";
import {
  backwardEulerDynamicValveFlowV1,
  backwardEulerDynamicValveOpeningFractionV1,
  evaluateDynamicInertialValveV1,
  type DynamicInertialValveOutputV1,
  type DynamicInertialValveParamsV1,
} from "@/engine/mechanics2/valve/DynamicInertialValveV1";
import { effectiveCalciumRateTargetAtCycleLength } from "@/engine/myocardium/calcium/PrescribedCalciumTransientV1";
import { LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1 } from "@/engine/myocardium/atrialLandNiederer2018";

const PA_PER_MMHG = 133.322;
const WALL_IDS: readonly NoAvpdWallIdV1[] = Object.freeze([
  "leftAtrium",
  "rightAtrium",
  "leftFreeWall",
  "septum",
  "rightFreeWall",
]);

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1 =
  "no-avpd-five-patch-land-triseg-v1" as const;

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_EQUATIONS_VERSION_ID_V1 =
  "no-avpd-five-patch-land-triseg-equations-v1" as const;

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_STATE_LAYOUT_ID_V1 =
  "no-avpd-five-patch-land-triseg-state-layout-v1" as const;

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_RHYTHM_TOPOLOGY_ID_V1 =
  "periodic-five-wall-land-la-ra-lvfw-septum-rvfw-v1" as const;

/**
 * The Land--Niederer atrial rate/sensitivity prior assumed 0.1--0.6 uM at
 * 1 Hz. The PR #467 common atrial driver reaches about 0.85 uM. This V1 scales
 * only the atrial drivers' amplitude targets by 2/3 so the 1 Hz target is
 * 0.1 + 0.5 = 0.6 uM; waveform timing is unchanged. This is literature-context
 * alignment, not a normal-human calibration or a stress gain.
 */
export const FIVE_PATCH_LAND_ATRIAL_CALCIUM_CONTEXT_DRIVER_V1 = Object.freeze({
  ...ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1,
  parameterSetId: "land-niederer-2018-atrial-calcium-context-0p1-to-0p6um-v1",
  rateTargets: Object.freeze(
    ATRIAL_PRESCRIBED_CALCIUM_REPORT_ONLY_SEED_V1.rateTargets.map((target) =>
      Object.freeze({
        ...target,
        peakAmplitudeUM: target.peakAmplitudeUM * (2 / 3),
      }),
    ),
  ),
});

export const NO_AVPD_FIVE_PATCH_LAND_TRISEG_CLAIM_BOUNDARY_V1 = Object.freeze({
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
  activeLaw: "Land2017-active-only-on-all-five-myocardial-patches",
  activeParameterFamilies:
    "Land-Niederer-2018-atrial-for-LA-RA; Land-2017-intact-human-37C-for-LVFW-septum-RVFW",
  stressTopology:
    "equilibrium-passive-plus-Land-active-only-plus-optional-one-state-parallel-SLS-on-every-patch",
  externalSeriesElasticElement: false,
  postHocForceVelocityMultiplier: false,
  activeHomogenizationScale:
    "explicit-positive-dimensionless-per-wall-composite-parameter-default-one",
  sourceLandTrefOrKineticsModifiedByHomogenization: false,
  activationFrontEnd:
    "periodic-event-to-prescribed-free-Ca-directly-into-each-Land-active-branch",
  calciumMyofilamentPairing:
    "engineering-pair-not-jointly-calibrated-against-force-calcium-and-twitch-protocols",
  parameterPriors: Object.freeze({
    active: "distinct-recognized-atrial-and-ventricular-Land-literature-packs",
    passive:
      "wall-specific-equilibrium-passive-engineering-seeds-not-literature-calibrations",
    sls: "wall-group-one-state-parallel-SLS-engineering-seeds-not-literature-calibrations",
    homogenization:
      "explicit-engineering-seed-default-one-not-source-Land-Tref",
    normalReferenceOrPatientFit: false,
  }),
  leftAtrialLandLiteratureProvenance: Object.freeze({
    equationSourceDoi:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.equationSourceDoi,
    atrialCalibrationDoi:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.atrialCalibrationDoi,
    effectiveParameterProvenance:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.effectiveParameterProvenance,
    provenanceBoundary:
      LAND_NIEDERER_2018_HUMAN_ATRIAL_PARAMETER_PACK_V1.provenanceBoundary,
  }),
  atrialLandCommonProjectCalciumInput:
    "LA-and-RA-timing-retained-amplitude-aligned-to-land-niederer-assumed-0p1-to-0p6um-context-not-paper-waveform-reproduction",
  calciumCyclingOrTrueCalciumAlternansClaimed: false,
  passiveMemory:
    "nested-off-atrial-only-or-all-patch-one-state-standard-linear-solid",
  modelSelectionRole:
    "global-prior-envelope-and-structural-comparator-not-local-shape-fit",
  ventricularInteraction: "algebraic-TriSeg",
  triSegGeneralizedForceMappingDefault:
    "full-fiber-energy-gradient",
  triSegColdInitializationDefault: "passive-reequilibrated",
  coldInitializationSlsHistory:
    "zero-overstress-at-cold-geometry-after-ventricular-passive-reequilibration",
  coldInitializationBasalLandLimitation:
    "Land-is-initialized-at-prescribed-diastolic-free-Ca-so-nonzero-basal-active-stress-may-remain-and-is-not-hidden-in-the-passive-TriSeg-solve",
  representativeTensionMappingComparator:
    "lumens-2009-representative-tension-area-work-not-the-five-patch-default",
  avPlaneDynamicState: false,
  avpdObserverIncluded: false,
  respirationBaroreflexOrFullPericardiumIncluded: false,
  calibratedNormalHumanOrClinicalValidityClaimed: false,
} as const);

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

export type NoAvpdDynamicValveOpeningFractionsV1 = {
  readonly mitral: number;
  readonly aortic: number;
  readonly tricuspid: number;
  readonly pulmonary: number;
};

export type NoAvpdFivePatchLandWallStateV1 = LandActivePassiveSlsStateV1;
export type NoAvpdFivePatchLandWallStatesV1 = Readonly<
  Record<NoAvpdWallIdV1, NoAvpdFivePatchLandWallStateV1>
>;
export type NoAvpdCalciumDriverStatesV1 = Readonly<
  Record<NoAvpdWallIdV1, PeriodicPrescribedCalciumDriverStateV2>
>;

export type NoAvpdFivePatchLandTriSegStateV1 = {
  /** Exact effective-parameter identity; any change requires a cold state. */
  readonly parameterIdentityCanonicalJson: string;
  readonly timeSec: number;
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
  /**
   * Present only in structural V2. V1 retains its exact 14-variable state;
   * V2 owns four independent bounded valve-area memory coordinates.
   */
  readonly dynamicValveOpeningFractions01?:
    NoAvpdDynamicValveOpeningFractionsV1;
  readonly calciumDrivers: NoAvpdCalciumDriverStatesV1;
  readonly walls: NoAvpdFivePatchLandWallStatesV1;
  /** Present only in the structural V2 body--LAA parallel-wall arm. */
  readonly leftAtrialParallelWall?: ParallelBodyAppendageWallStateV1;
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

export type NoAvpdFivePatchLandWallParamsV1 = {
  readonly geometry: OneFiberVolumeGeometryParamsV1;
  readonly material: LandActivePassiveSlsParamsV1;
};

export type NoAvpdTriSegWallParamsV1 = TriSegWallParametersV1 & {
  readonly material: LandActivePassiveSlsParamsV1;
};

export type NoAvpdFivePatchLandTriSegParamsV1 = {
  readonly cycleLengthSec: number;
  readonly triSegGeneralizedForceMapping: TriSegGeneralizedForceMappingV1;
  readonly triSegColdInitialization: "legacy-seed" | "passive-reequilibrated";
  readonly calciumDrivers: Readonly<
    Record<NoAvpdWallIdV1, PeriodicPrescribedCalciumDriverParamsV2>
  >;
  readonly atria: {
    readonly left: NoAvpdFivePatchLandWallParamsV1;
    readonly right: NoAvpdFivePatchLandWallParamsV1;
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
  /**
   * Optional research-sidecar structural factors.  Absence preserves the V1
   * five-wall equations and serialized state exactly.
   */
  readonly structuralExtension?: {
    readonly leftAtrialParallelWall?: ParallelBodyAppendageWallParamsV1;
    readonly commonPericardium?: CommonPericardiumParamsV1;
    readonly dynamicValves?: {
      readonly mitral: DynamicInertialValveParamsV1;
      readonly aortic: DynamicInertialValveParamsV1;
      readonly tricuspid: DynamicInertialValveParamsV1;
      readonly pulmonary: DynamicInertialValveParamsV1;
    };
    readonly intrathoracicPressureMmHg: number;
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

export type NoAvpdFivePatchLandSlsVariantV1 =
  "off" | "atrial-only" | "all-patch";

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

export type NoAvpdTransmuralPressureReadbackV1 = {
  readonly leftAtriumMmHg: number;
  readonly leftVentricleMmHg: number;
  readonly rightAtriumMmHg: number;
  readonly rightVentricleMmHg: number;
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

export type NoAvpdFivePatchLandWallEvaluationV1 = {
  readonly geometry: OneFiberVolumeGeometryV1;
  readonly materialTrial: LandActivePassiveSlsTrialV1;
  readonly transmuralPressureMmHg: number;
  /**
   * Report-only decomposition through the same one-fiber work-conjugate map
   * used by the cavity equation.  It adds no pressure source or state.
   */
  readonly mechanismReadback: NoAvpdOneFiberWallMechanismReadbackV1;
};

export type NoAvpdOneFiberWallMechanismReadbackV1 = {
  readonly fiberLogStrain: number;
  /** Backward difference across this accepted constitutive trial. */
  readonly fiberLogStrainBackwardDifferenceRatePerSec: number;
  readonly pressureComponentsMmHg: {
    readonly equilibriumPassiveMmHg: number;
    readonly effectiveLandActiveMmHg: number;
    readonly slsOverstressMmHg: number;
    readonly totalMmHg: number;
    readonly componentSumMinusTotalMmHg: number;
  };
};

export type NoAvpdVentricularEvaluationV1 = {
  readonly triSeg: NoAvpdTriSegEquilibriumSolutionV1;
  readonly materialTrials: Readonly<
    Record<TriSegWallIdV1, LandActivePassiveSlsTrialV1>
  >;
};

export type NoAvpdTriSegEquilibriumSolutionV1 =
  TriSegAlgebraicSolutionV1 | TriSegFullFiberEnergyGradientSolutionV1;

export type NoAvpdFivePatchLandEvaluationV1 = {
  readonly freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>;
  readonly activations01: Readonly<Record<NoAvpdWallIdV1, number>>;
  readonly pressures: NoAvpdPressureReadbackV1;
  readonly transmuralPressures: NoAvpdTransmuralPressureReadbackV1;
  readonly commonPericardium: CommonPericardiumOutputV1 | null;
  readonly flowReadback: NoAvpdFlowReadbackV1;
  readonly leftAtrium: NoAvpdFivePatchLandWallEvaluationV1;
  readonly leftAtrialParallelWall: ParallelBodyAppendageWallTrialV1 | null;
  readonly rightAtrium: NoAvpdFivePatchLandWallEvaluationV1;
  readonly ventricles: NoAvpdVentricularEvaluationV1;
  readonly valves: {
    readonly mitral: SmoothInertialValveOutputV2 | DynamicInertialValveOutputV1;
    readonly aortic: SmoothInertialValveOutputV2 | DynamicInertialValveOutputV1;
    readonly tricuspid: SmoothInertialValveOutputV2 | DynamicInertialValveOutputV1;
    readonly pulmonary: SmoothInertialValveOutputV2 | DynamicInertialValveOutputV1;
  };
  readonly totalBloodVolumeMl: number;
};

export type NoAvpdFivePatchLandStepOutputV1 = {
  readonly modelId: typeof NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1;
  readonly accepted: boolean;
  /** Equals previous state exactly whenever accepted=false. */
  readonly state: NoAvpdFivePatchLandTriSegStateV1;
  readonly candidateState: NoAvpdFivePatchLandTriSegStateV1 | null;
  readonly evaluation: NoAvpdFivePatchLandEvaluationV1 | null;
  readonly solver: FivePatchDampedNewtonResultV1;
  readonly totalBloodVolumeResidualMl: number | null;
  readonly failureReasons: readonly string[];
  readonly protocolControls: NoAvpdFivePatchLandStepControlsV1;
};

/** Exogenous protocol forcing; it is not part of the model parameter identity. */
export type NoAvpdFivePatchLandStepControlsV1 = {
  readonly prescribedCalciumPeakAboveDiastolicScale01: number;
};

export const DEFAULT_NO_AVPD_FIVE_PATCH_LAND_STEP_CONTROLS_V1 = Object.freeze({
  prescribedCalciumPeakAboveDiastolicScale01: 1,
} satisfies NoAvpdFivePatchLandStepControlsV1);

export type NoAvpdFivePatchGlobalSystemDiagnosticV1 = {
  /** Raw, unscaled residual vector in the same ordering used by global Newton. */
  readonly residuals: readonly number[];
  /** Raw-residual derivative for the requested column, or null for FD columns. */
  readonly analyticJacobianColumn: readonly number[] | null;
  readonly valvePressureGradientsMmHg: {
    readonly mitral: number;
    readonly aortic: number;
    readonly tricuspid: number;
    readonly pulmonary: number;
  };
  readonly valveOpenFractions01: {
    readonly mitral: number;
    readonly aortic: number;
    readonly tricuspid: number;
    readonly pulmonary: number;
  };
};

type Candidate = {
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
  readonly evaluation: NoAvpdFivePatchLandEvaluationV1;
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

export const DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1: NoAvpdFivePatchLandTriSegParamsV1 =
  createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");

const DEFAULT_PARAMETER_IDENTITY_CANONICAL_JSON_V1 = stableStringify(
  DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
);

export function noAvpdFivePatchLandParameterIdentityV1(
  params: NoAvpdFivePatchLandTriSegParamsV1,
): string {
  return params === DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1
    ? DEFAULT_PARAMETER_IDENTITY_CANONICAL_JSON_V1
    : stableStringify(params);
}

export function initialNoAvpdFivePatchLandTriSegStateV1(
  params: NoAvpdFivePatchLandTriSegParamsV1 = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
  volumeOverrides: Partial<NoAvpdBloodVolumesV1> = {},
): NoAvpdFivePatchLandTriSegStateV1 {
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
  const leftAtrialParallelParams =
    params.structuralExtension?.leftAtrialParallelWall;
  const leftAtrialCalciumTarget = effectiveCalciumRateTargetAtCycleLength(
    params.calciumDrivers.leftAtrium.calcium,
    params.calciumDrivers.leftAtrium.cycleLengthSec,
  );
  const leftAtrialParallelWall = leftAtrialParallelParams === undefined
    ? undefined
    : initialParallelBodyAppendageWallStateV1(
        volumes.leftAtriumMl,
        leftAtrialCalciumTarget.diastolicCalciumUM,
        leftAtrialParallelParams,
      );
  const initialLeftAtrialBodyVolumeMl = leftAtrialParallelParams === undefined
    ? volumes.leftAtriumMl
    : volumes.leftAtriumMl *
      (1 - leftAtrialParallelParams.initialAppendageFraction01);
  const leftAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    initialLeftAtrialBodyVolumeMl,
    leftAtrialParallelParams?.body.geometry ?? params.atria.left.geometry,
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
  const walls: NoAvpdFivePatchLandWallStatesV1 = {
    leftAtrium:
      leftAtrialParallelWall?.body ??
      initialWallState(
        leftAtrialGeometry.fiberNaturalStrain,
        params.atria.left.material,
        params.calciumDrivers.leftAtrium,
      ),
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
      noAvpdFivePatchLandParameterIdentityV1(params),
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
    ...(params.structuralExtension?.dynamicValves === undefined
      ? {}
      : {
          dynamicValveOpeningFractions01: Object.freeze({
            mitral: 0,
            aortic: 0,
            tricuspid: 0,
            pulmonary: 0,
          }),
        }),
    calciumDrivers: mapWallIds(() =>
      initialPeriodicPrescribedCalciumDriverStateV2(),
    ),
    walls,
    ...(leftAtrialParallelWall === undefined
      ? {}
      : { leftAtrialParallelWall }),
    triSegGeneralizedForceMapping: params.triSegGeneralizedForceMapping,
    triSegContinuation: triSegGeometry.coordinates,
  };
}

export function stepNoAvpdFivePatchLandTriSegV1(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  dtSec: number,
  params: NoAvpdFivePatchLandTriSegParamsV1 = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
  controls: NoAvpdFivePatchLandStepControlsV1 =
    DEFAULT_NO_AVPD_FIVE_PATCH_LAND_STEP_CONTROLS_V1,
): NoAvpdFivePatchLandStepOutputV1 {
  assertCalciumDriverOwnership(params);
  assertSubsystemParameterOwnership(previous, params);
  assertWallMaterialOwnership(previous.walls, params);
  assertStructuralExtensionOwnership(previous, params);
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
  if (
    !Number.isFinite(controls.prescribedCalciumPeakAboveDiastolicScale01) ||
    controls.prescribedCalciumPeakAboveDiastolicScale01 < 0 ||
    controls.prescribedCalciumPeakAboveDiastolicScale01 > 1
  ) {
    throw new Error(
      "prescribedCalciumPeakAboveDiastolicScale01 must lie in [0, 1]",
    );
  }
  const appliedControls = Object.freeze({ ...controls });
  const nextTimeSec = previous.timeSec + dtSec;
  const calciumTrials = trialCalciumDrivers(
    previous,
    nextTimeSec,
    dtSec,
    params,
    appliedControls,
  );
  const calciumDriversValid = Object.values(calciumTrials).every(
    (trial) => trial.valid,
  );
  const freeCalciumUm = mapWallIds(
    (wallId) => calciumTrials[wallId].freeCalciumUM,
  );
  let initialUnknowns = stateToUnknowns(previous);
  const dynamicValveParams = params.structuralExtension?.dynamicValves;
  if (dynamicValveParams !== undefined && calciumDriversValid) {
    initialUnknowns = dynamicValveMonolithicPredictor(
      previous,
      initialUnknowns,
      dtSec,
      freeCalciumUm,
      params,
    );
  } else if (initialUnknowns.length === 15 && calciumDriversValid) {
    initialUnknowns = structuralMonolithicFlowPredictor(
      previous,
      initialUnknowns,
      dtSec,
      freeCalciumUm,
      params,
    );
  }
  const globalUnknownCount = initialUnknowns.length;
  const parallelGlobalParams =
    params.structuralExtension?.leftAtrialParallelWall;
  let finalCandidate: Candidate | null = null;
  let cachedUnknowns: readonly number[] | null = null;
  let cachedCandidate: Candidate | null = null;
  let cachedCandidateAvailable = false;

  const evaluateUnknowns = (unknowns: readonly number[]): Candidate | null => {
    if (
      cachedCandidateAvailable &&
      cachedUnknowns != null &&
      sameUnknownVector(cachedUnknowns, unknowns)
    ) {
      return cachedCandidate;
    }
    let candidate: Candidate | null = null;
    try {
      if (calciumDriversValid) {
        candidate = evaluateCandidate(
          previous,
          unknowns,
          dtSec,
          freeCalciumUm,
          params,
        );
      }
    } catch {
      candidate = null;
    }
    cachedUnknowns = Object.freeze([...unknowns]);
    cachedCandidate = candidate;
    cachedCandidateAvailable = true;
    return candidate;
  };
  const solver = solveFivePatchDampedNewtonV1(
    initialUnknowns,
    (unknowns) => {
      const candidate = evaluateUnknowns(unknowns);
      if (candidate === null) return null;
      return massAndMomentumResiduals(previous, candidate, dtSec, params);
    },
    {
      unknownScales: [
        65, 140, 700, 3_000, 65, 150, 180, 650, 100, 100, 100, 100, 80, 80,
        ...(parallelGlobalParams === undefined ? [] : [10]),
      ],
      residualScales: new Array<number>(globalUnknownCount).fill(1),
      maxIterations: params.solver.maxIterations,
      residualTolerance: params.solver.residualTolerance,
      derivativeRelativeStep: params.solver.derivativeRelativeStep,
      lineSearchReduction: params.solver.lineSearchReduction,
      minLineSearchStep: params.solver.minLineSearchStep,
      jacobianReuse: params.solver.jacobianReuse,
      analyticJacobianColumn: (unknowns, column) => {
        const analyticColumns = dynamicValveParams === undefined
          ? [2, 3, 6, 7, 8, 9, 10, 11, 12, 13]
          : [8, 9, 10, 11, 12, 13];
        if (!analyticColumns.includes(column)) {
          return null;
        }
        const candidate = evaluateUnknowns(unknowns);
        return candidate == null
          ? null
          : analyticGlobalJacobianColumn(
              previous,
              candidate,
              dtSec,
              params,
              column,
              globalUnknownCount,
            );
      },
      admissible: (unknowns) =>
        unknowns.length === globalUnknownCount &&
        unknowns.every(Number.isFinite) &&
        unknowns
          .slice(0, 8)
          .every((volume) => volume >= params.solver.minimumBloodVolumeMl) &&
        (parallelGlobalParams === undefined ||
          (unknowns[14]! >=
              parallelGlobalParams.minimumAppendageFraction01 *
                unknowns[0]! &&
            unknowns[14]! <=
              parallelGlobalParams.maximumAppendageFraction01 *
                unknowns[0]!)),
    },
  );
  const solverEndpointCandidate = evaluateUnknowns(solver.unknowns);
  if (solver.converged) finalCandidate = solverEndpointCandidate;

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
  if (
    !solver.converged &&
    params.structuralExtension?.leftAtrialParallelWall !== undefined &&
    previous.leftAtrialParallelWall !== undefined &&
    calciumDriversValid
  ) {
    const local = trialParallelBodyAppendageWallV1(
      previous.leftAtrialParallelWall,
      {
        dtSec,
        totalVolumeMl: previous.volumes.leftAtriumMl,
        freeCalciumUm: freeCalciumUm.leftAtrium,
      },
      params.structuralExtension.leftAtrialParallelWall,
    );
    if (!local.valid) {
      failureReasons.push(
        ...local.issues.map((issue) => `left-atrial-parallel:${issue}`),
        `left-atrial-parallel:brackets=${local.pressureBracketCount}`,
        `left-atrial-parallel:monotone=${String(local.residualMonotone)}`,
      );
    }
  }
  if (solverEndpointCandidate === null) {
    failureReasons.push("final-candidate-invalid");
  }
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
    solverEndpointCandidate === null
      ? null
      : totalBloodVolumeMl(solverEndpointCandidate.volumes) -
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
      modelId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1,
      accepted: false,
      state: previous,
      candidateState: null,
      evaluation: solverEndpointCandidate?.evaluation ?? null,
      solver,
      totalBloodVolumeResidualMl,
      failureReasons,
      protocolControls: appliedControls,
    };
  }

  const committedLeftAtrialParallelWall =
    finalCandidate.evaluation.leftAtrialParallelWall === null
      ? undefined
      : commitParallelBodyAppendageWallTrialV1(
          finalCandidate.evaluation.leftAtrialParallelWall,
        );
  const candidateState: NoAvpdFivePatchLandTriSegStateV1 = {
    parameterIdentityCanonicalJson: previous.parameterIdentityCanonicalJson,
    timeSec: nextTimeSec,
    volumes: finalCandidate.volumes,
    flows: finalCandidate.flows,
    ...(params.structuralExtension?.dynamicValves === undefined
      ? {}
      : {
          dynamicValveOpeningFractions01: Object.freeze({
            mitral: finalCandidate.evaluation.valves.mitral.openFraction01,
            aortic: finalCandidate.evaluation.valves.aortic.openFraction01,
            tricuspid:
              finalCandidate.evaluation.valves.tricuspid.openFraction01,
            pulmonary:
              finalCandidate.evaluation.valves.pulmonary.openFraction01,
          }),
        }),
    calciumDrivers: mapWallIds((wallId) => calciumTrials[wallId].nextState),
    walls: {
      leftAtrium:
        committedLeftAtrialParallelWall?.body ??
        commitLandActivePassiveSlsTrialV1(
          finalCandidate.evaluation.leftAtrium.materialTrial,
        ),
      rightAtrium: commitLandActivePassiveSlsTrialV1(
        finalCandidate.evaluation.rightAtrium.materialTrial,
      ),
      leftFreeWall: commitLandActivePassiveSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.leftFreeWall,
      ),
      septum: commitLandActivePassiveSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.septum,
      ),
      rightFreeWall: commitLandActivePassiveSlsTrialV1(
        finalCandidate.evaluation.ventricles.materialTrials.rightFreeWall,
      ),
    },
    ...(committedLeftAtrialParallelWall === undefined
      ? {}
      : { leftAtrialParallelWall: committedLeftAtrialParallelWall }),
    triSegGeneralizedForceMapping: previous.triSegGeneralizedForceMapping,
    triSegContinuation: finalCandidate.evaluation.ventricles.triSeg.coordinates,
  };
  return {
    modelId: NO_AVPD_FIVE_PATCH_LAND_TRISEG_MODEL_ID_V1,
    accepted: true,
    state: candidateState,
    candidateState,
    evaluation: finalCandidate.evaluation,
    solver,
    totalBloodVolumeResidualMl,
    failureReasons: [],
    protocolControls: appliedControls,
  };
}

/**
 * Pure diagnostic view of the global nonlinear system. It neither commits
 * material history nor advances the accepted state. This keeps exact-column
 * parity tests tied to the production residual and candidate evaluation.
 */
export function evaluateNoAvpdFivePatchGlobalSystemDiagnosticV1(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  unknowns: readonly number[],
  dtSec: number,
  column: number,
  params: NoAvpdFivePatchLandTriSegParamsV1 = DEFAULT_NO_AVPD_FIVE_PATCH_LAND_TRISEG_PARAMS_V1,
): NoAvpdFivePatchGlobalSystemDiagnosticV1 | null {
  assertCalciumDriverOwnership(params);
  assertSubsystemParameterOwnership(previous, params);
  assertWallMaterialOwnership(previous.walls, params);
  assertStructuralExtensionOwnership(previous, params);
  if (!Number.isFinite(dtSec) || dtSec <= 0) {
    throw new Error("dtSec must be positive and finite");
  }
  if (!Number.isInteger(column) || column < 0 || column >= 14) {
    throw new Error("global Jacobian column must be an integer in [0, 13]");
  }
  if (
    unknowns.length !== 14 ||
    unknowns.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }
  const calciumTrials = trialCalciumDrivers(
    previous,
    previous.timeSec + dtSec,
    dtSec,
    params,
  );
  if (!Object.values(calciumTrials).every((trial) => trial.valid)) return null;
  const freeCalciumUm = mapWallIds(
    (wallId) => calciumTrials[wallId].freeCalciumUM,
  );
  let candidate: Candidate | null = null;
  try {
    candidate = evaluateCandidate(
      previous,
      unknowns,
      dtSec,
      freeCalciumUm,
      params,
    );
  } catch {
    return null;
  }
  if (candidate === null) return null;
  return Object.freeze({
    residuals: Object.freeze([
      ...massAndMomentumResiduals(previous, candidate, dtSec, params),
    ]),
    analyticJacobianColumn: analyticGlobalJacobianColumn(
      previous,
      candidate,
      dtSec,
      params,
      column,
      14,
    ),
    valvePressureGradientsMmHg: Object.freeze({
      mitral: candidate.evaluation.valves.mitral.pressureGradientMmHg,
      aortic: candidate.evaluation.valves.aortic.pressureGradientMmHg,
      tricuspid: candidate.evaluation.valves.tricuspid.pressureGradientMmHg,
      pulmonary: candidate.evaluation.valves.pulmonary.pressureGradientMmHg,
    }),
    valveOpenFractions01: Object.freeze({
      mitral: candidate.evaluation.valves.mitral.openFraction01,
      aortic: candidate.evaluation.valves.aortic.openFraction01,
      tricuspid: candidate.evaluation.valves.tricuspid.openFraction01,
      pulmonary: candidate.evaluation.valves.pulmonary.openFraction01,
    }),
  });
}

function evaluateCandidate(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  unknowns: readonly number[],
  dtSec: number,
  freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): Candidate | null {
  const leftAtrialParallelParams =
    params.structuralExtension?.leftAtrialParallelWall;
  const dynamicValveParams = params.structuralExtension?.dynamicValves;
  const {
    volumes,
    flows,
    appendageVolumeMl,
  } = unknownsToStateParts(
    unknowns,
    leftAtrialParallelParams !== undefined,
  );
  const leftAtrialParallelTrial =
    leftAtrialParallelParams === undefined
      ? null
      : previous.leftAtrialParallelWall === undefined
        ? null
        : appendageVolumeMl === null
          ? null
          : trialParallelBodyAppendageWallAtPartitionV1(
            previous.leftAtrialParallelWall,
            {
              dtSec,
              totalVolumeMl: volumes.leftAtriumMl,
              appendageVolumeMl,
              freeCalciumUm: freeCalciumUm.leftAtrium,
            },
            leftAtrialParallelParams,
          );
  if (
    leftAtrialParallelParams !== undefined &&
    (leftAtrialParallelTrial === null || !leftAtrialParallelTrial.valid ||
      leftAtrialParallelTrial.body === null)
  ) return null;
  const leftAtrialGeometry = leftAtrialParallelTrial?.body.geometry ??
    evaluateOneFiberVolumeGeometryV1(
      volumes.leftAtriumMl,
      params.atria.left.geometry,
    );
  const rightAtrialGeometry = evaluateOneFiberVolumeGeometryV1(
    volumes.rightAtriumMl,
    params.atria.right.geometry,
  );
  const leftAtrialTrial = leftAtrialParallelTrial?.body.materialTrial ??
    trialLandActivePassiveSlsV1(
      previous.walls.leftAtrium,
      {
        dtSec,
        fiberLogStrain: leftAtrialGeometry.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.leftAtrium,
      },
      params.atria.left.material,
    );
  const rightAtrialTrial = trialLandActivePassiveSlsV1(
    previous.walls.rightAtrium,
    {
      dtSec,
      fiberLogStrain: rightAtrialGeometry.fiberNaturalStrain,
      freeCalciumUm: freeCalciumUm.rightAtrium,
    },
    params.atria.right.material,
  );
  if (
    !trialAccepted(leftAtrialTrial) ||
    !trialAccepted(rightAtrialTrial)
  ) return null;

  const ventricularTrialsAt = (
    geometry: TriSegGeometryValidOutputV1,
  ): Readonly<Record<TriSegWallIdV1, LandActivePassiveSlsTrialV1>> => ({
    leftFreeWall: trialLandActivePassiveSlsV1(
      previous.walls.leftFreeWall,
      {
        dtSec,
        fiberLogStrain: geometry.walls.leftFreeWall.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.leftFreeWall,
      },
      params.triSeg.leftFreeWall.material,
    ),
    septum: trialLandActivePassiveSlsV1(
      previous.walls.septum,
      {
        dtSec,
        fiberLogStrain: geometry.walls.septum.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.septum,
      },
      params.triSeg.septum.material,
    ),
    rightFreeWall: trialLandActivePassiveSlsV1(
      previous.walls.rightFreeWall,
      {
        dtSec,
        fiberLogStrain: geometry.walls.rightFreeWall.fiberNaturalStrain,
        freeCalciumUm: freeCalciumUm.rightFreeWall,
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

  const transmuralPressures: NoAvpdTransmuralPressureReadbackV1 = {
    leftAtriumMmHg:
      leftAtrialParallelTrial?.commonPressureMmHg ??
      oneFiberCavityPressurePaV1(
        leftAtrialGeometry,
        leftAtrialTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG,
    leftVentricleMmHg:
      ventricularPressureReadback.leftVentricleTransmuralMmHg,
    rightAtriumMmHg:
      oneFiberCavityPressurePaV1(
        rightAtrialGeometry,
        rightAtrialTrial.readback.stresses.totalTransmittedPa,
      ) / PA_PER_MMHG,
    rightVentricleMmHg:
      ventricularPressureReadback.rightVentricleTransmuralMmHg,
  };
  if (!Object.values(transmuralPressures).every(Number.isFinite)) return null;

  const pericardiumParams =
    params.structuralExtension?.commonPericardium;
  const commonPericardium = pericardiumParams === undefined
    ? null
    : evaluateCommonPericardiumV1(
        pericardiumParams,
        computeIntrapericardialHeartVolumeMlV1({
          chamberBloodVolumesMl: [
            volumes.leftAtriumMl,
            volumes.leftVentricleMl,
            volumes.rightAtriumMl,
            volumes.rightVentricleMl,
          ],
          wallMaterialVolumesMl: [
            leftAtrialParallelParams === undefined
              ? params.atria.left.geometry.wallVolumeMl
              : leftAtrialParallelParams.body.geometry.wallVolumeMl +
                leftAtrialParallelParams.appendage.geometry.wallVolumeMl,
            params.atria.right.geometry.wallVolumeMl,
            params.triSeg.leftFreeWall.wallVolumeMl,
            params.triSeg.septum.wallVolumeMl,
            params.triSeg.rightFreeWall.wallVolumeMl,
          ],
        }),
      );
  const commonExternalPressureMmHg =
    (params.structuralExtension?.intrathoracicPressureMmHg ?? 0) +
    (commonPericardium?.pressureMmHg ?? 0);
  const pressures: NoAvpdPressureReadbackV1 = {
    leftAtriumMmHg:
      transmuralPressures.leftAtriumMmHg + commonExternalPressureMmHg,
    leftVentricleMmHg:
      transmuralPressures.leftVentricleMmHg + commonExternalPressureMmHg,
    systemicArteryMmHg: vascularPressure(
      volumes.systemicArteryMl,
      params.vascular.systemicArtery,
    ),
    systemicVeinMmHg: vascularPressure(
      volumes.systemicVeinMl,
      params.vascular.systemicVein,
    ),
    rightAtriumMmHg:
      transmuralPressures.rightAtriumMmHg + commonExternalPressureMmHg,
    rightVentricleMmHg:
      transmuralPressures.rightVentricleMmHg + commonExternalPressureMmHg,
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

  const previousDynamicOpenings = previous.dynamicValveOpeningFractions01;
  if (
    dynamicValveParams !== undefined && previousDynamicOpenings === undefined
  ) return null;
  const valves = dynamicValveParams === undefined
    ? {
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
      }
    : {
        mitral: evaluateDynamicInertialValveV1(
          {
            qMlPerSec: previous.flows.mitralValve.qMlPerSec,
            openingFraction01: previousDynamicOpenings!.mitral,
          },
          {
            qMlPerSec: flows.mitralValve.qMlPerSec,
            openingFraction01:
              backwardEulerDynamicValveOpeningFractionV1(
                previousDynamicOpenings!.mitral,
                pressures.leftAtriumMmHg - pressures.leftVentricleMmHg,
                dtSec,
                dynamicValveParams.mitral,
              ),
          },
          {
            dtSec,
            upstreamPressureMmHg: pressures.leftAtriumMmHg,
            downstreamPressureMmHg: pressures.leftVentricleMmHg,
          },
          dynamicValveParams.mitral,
        ),
        aortic: evaluateDynamicInertialValveV1(
          {
            qMlPerSec: previous.flows.aorticValve.qMlPerSec,
            openingFraction01: previousDynamicOpenings!.aortic,
          },
          {
            qMlPerSec: flows.aorticValve.qMlPerSec,
            openingFraction01:
              backwardEulerDynamicValveOpeningFractionV1(
                previousDynamicOpenings!.aortic,
                pressures.leftVentricleMmHg - pressures.systemicArteryMmHg,
                dtSec,
                dynamicValveParams.aortic,
              ),
          },
          {
            dtSec,
            upstreamPressureMmHg: pressures.leftVentricleMmHg,
            downstreamPressureMmHg: pressures.systemicArteryMmHg,
          },
          dynamicValveParams.aortic,
        ),
        tricuspid: evaluateDynamicInertialValveV1(
          {
            qMlPerSec: previous.flows.tricuspidValve.qMlPerSec,
            openingFraction01: previousDynamicOpenings!.tricuspid,
          },
          {
            qMlPerSec: flows.tricuspidValve.qMlPerSec,
            openingFraction01:
              backwardEulerDynamicValveOpeningFractionV1(
                previousDynamicOpenings!.tricuspid,
                pressures.rightAtriumMmHg - pressures.rightVentricleMmHg,
                dtSec,
                dynamicValveParams.tricuspid,
              ),
          },
          {
            dtSec,
            upstreamPressureMmHg: pressures.rightAtriumMmHg,
            downstreamPressureMmHg: pressures.rightVentricleMmHg,
          },
          dynamicValveParams.tricuspid,
        ),
        pulmonary: evaluateDynamicInertialValveV1(
          {
            qMlPerSec: previous.flows.pulmonaryValve.qMlPerSec,
            openingFraction01: previousDynamicOpenings!.pulmonary,
          },
          {
            qMlPerSec: flows.pulmonaryValve.qMlPerSec,
            openingFraction01:
              backwardEulerDynamicValveOpeningFractionV1(
                previousDynamicOpenings!.pulmonary,
                pressures.rightVentricleMmHg - pressures.pulmonaryArteryMmHg,
                dtSec,
                dynamicValveParams.pulmonary,
              ),
          },
          {
            dtSec,
            upstreamPressureMmHg: pressures.rightVentricleMmHg,
            downstreamPressureMmHg: pressures.pulmonaryArteryMmHg,
          },
          dynamicValveParams.pulmonary,
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
    rightAtrium: rightAtrialTrial.readback.activation01,
    leftFreeWall: ventricularTrials.leftFreeWall.readback.activation01,
    septum: ventricularTrials.septum.readback.activation01,
    rightFreeWall: ventricularTrials.rightFreeWall.readback.activation01,
  } as const;

  return {
    volumes,
    flows,
    evaluation: {
      freeCalciumUm,
      activations01,
      pressures,
      transmuralPressures,
      commonPericardium,
      flowReadback,
      leftAtrium: {
        geometry: leftAtrialGeometry,
        materialTrial: leftAtrialTrial,
        transmuralPressureMmHg: transmuralPressures.leftAtriumMmHg,
        mechanismReadback: oneFiberWallMechanismReadbackV1(
          leftAtrialGeometry,
          leftAtrialTrial,
          dtSec,
        ),
      },
      leftAtrialParallelWall: leftAtrialParallelTrial,
      rightAtrium: {
        geometry: rightAtrialGeometry,
        materialTrial: rightAtrialTrial,
        transmuralPressureMmHg: transmuralPressures.rightAtriumMmHg,
        mechanismReadback: oneFiberWallMechanismReadbackV1(
          rightAtrialGeometry,
          rightAtrialTrial,
          dtSec,
        ),
      },
      ventricles: { triSeg, materialTrials: ventricularTrials },
      valves,
      totalBloodVolumeMl: totalBloodVolumeMl(volumes),
    },
  };
}

/**
 * Equation-derived predictor for the structural V2 dynamic-valve solve.
 *
 * The four bounded opening equations are linearly and exactly condensed at
 * each candidate pressure. This predictor evaluates that same backward-Euler
 * update and the corresponding monotone fixed-area momentum solve only to
 * select a nearby Newton starting point.
 */
function dynamicValveMonolithicPredictor(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  seedUnknowns: readonly number[],
  dtSec: number,
  freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): readonly number[] {
  const dynamic = params.structuralExtension?.dynamicValves;
  const previousOpening = previous.dynamicValveOpeningFractions01;
  if (dynamic === undefined || previousOpening === undefined) {
    return seedUnknowns;
  }
  const seedCandidate = evaluateCandidate(
    previous,
    seedUnknowns,
    dtSec,
    freeCalciumUm,
    params,
  );
  if (seedCandidate === null) return seedUnknowns;
  const p = seedCandidate.evaluation.pressures;
  const predicted = [...seedUnknowns];
  const inputs = {
    mitral: {
      dtSec,
      upstreamPressureMmHg: p.leftAtriumMmHg,
      downstreamPressureMmHg: p.leftVentricleMmHg,
    },
    aortic: {
      dtSec,
      upstreamPressureMmHg: p.leftVentricleMmHg,
      downstreamPressureMmHg: p.systemicArteryMmHg,
    },
    tricuspid: {
      dtSec,
      upstreamPressureMmHg: p.rightAtriumMmHg,
      downstreamPressureMmHg: p.rightVentricleMmHg,
    },
    pulmonary: {
      dtSec,
      upstreamPressureMmHg: p.rightVentricleMmHg,
      downstreamPressureMmHg: p.pulmonaryArteryMmHg,
    },
  } as const;
  const valveOrder = [
    ["mitral", 8],
    ["aortic", 9],
    ["tricuspid", 10],
    ["pulmonary", 11],
  ] as const;
  for (const [valveId, flowIndex] of valveOrder) {
    const pressureGradientMmHg =
      inputs[valveId].upstreamPressureMmHg -
      inputs[valveId].downstreamPressureMmHg;
    const openingFraction01 =
      backwardEulerDynamicValveOpeningFractionV1(
        previousOpening[valveId],
        pressureGradientMmHg,
        dtSec,
        dynamic[valveId],
      );
    predicted[flowIndex] = backwardEulerDynamicValveFlowV1(
      {
        qMlPerSec: previous.flows[`${valveId}Valve` as const].qMlPerSec,
        openingFraction01: previousOpening[valveId],
      },
      openingFraction01,
      inputs[valveId],
      dynamic[valveId],
    );
  }
  predicted[12] = linearInertialFlowPredictor(
    p.pulmonaryVeinMmHg - p.leftAtriumMmHg,
    previous.flows.pulmonaryVenousFlowMlPerSec,
    dtSec,
    params.vascular.pulmonaryVenousSegment,
  );
  predicted[13] = linearInertialFlowPredictor(
    p.systemicVeinMmHg - p.rightAtriumMmHg,
    previous.flows.systemicVenousFlowMlPerSec,
    dtSec,
    params.vascular.systemicVenousSegment,
  );
  return predicted;
}

/**
 * Equation-derived predictor for the legacy 15-variable structural solve.
 *
 * A valve may decelerate sharply while its pressure-controlled effective area
 * changes. Starting the coupled Newton step from the previous flow can then
 * jump to a reverse-flow branch before the chamber volumes have moved. This
 * predictor solves each existing valve/venous momentum equation once at the
 * previous accepted volumes and new constitutive forcing. It changes no model
 * equation or parameter and is deliberately confined to the new 15-variable
 * path so the V1 14-variable numerical trajectory remains exact.
 */
function structuralMonolithicFlowPredictor(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  seedUnknowns: readonly number[],
  dtSec: number,
  freeCalciumUm: Readonly<Record<NoAvpdWallIdV1, number>>,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): readonly number[] {
  const seedCandidate = evaluateCandidate(
    previous,
    seedUnknowns,
    dtSec,
    freeCalciumUm,
    params,
  );
  if (seedCandidate === null) return seedUnknowns;
  const p = seedCandidate.evaluation.pressures;
  const predicted = [...seedUnknowns];
  predicted[8] = stepSmoothInertialValveV2(
    previous.flows.mitralValve,
    {
      dtSec,
      upstreamPressureMmHg: p.leftAtriumMmHg,
      downstreamPressureMmHg: p.leftVentricleMmHg,
    },
    params.valves.mitral,
  ).qMlPerSec;
  predicted[9] = stepSmoothInertialValveV2(
    previous.flows.aorticValve,
    {
      dtSec,
      upstreamPressureMmHg: p.leftVentricleMmHg,
      downstreamPressureMmHg: p.systemicArteryMmHg,
    },
    params.valves.aortic,
  ).qMlPerSec;
  predicted[10] = stepSmoothInertialValveV2(
    previous.flows.tricuspidValve,
    {
      dtSec,
      upstreamPressureMmHg: p.rightAtriumMmHg,
      downstreamPressureMmHg: p.rightVentricleMmHg,
    },
    params.valves.tricuspid,
  ).qMlPerSec;
  predicted[11] = stepSmoothInertialValveV2(
    previous.flows.pulmonaryValve,
    {
      dtSec,
      upstreamPressureMmHg: p.rightVentricleMmHg,
      downstreamPressureMmHg: p.pulmonaryArteryMmHg,
    },
    params.valves.pulmonary,
  ).qMlPerSec;
  predicted[12] = linearInertialFlowPredictor(
    p.pulmonaryVeinMmHg - p.leftAtriumMmHg,
    previous.flows.pulmonaryVenousFlowMlPerSec,
    dtSec,
    params.vascular.pulmonaryVenousSegment,
  );
  predicted[13] = linearInertialFlowPredictor(
    p.systemicVeinMmHg - p.rightAtriumMmHg,
    previous.flows.systemicVenousFlowMlPerSec,
    dtSec,
    params.vascular.systemicVenousSegment,
  );
  return predicted;
}

function linearInertialFlowPredictor(
  pressureGradientMmHg: number,
  previousFlowMlPerSec: number,
  dtSec: number,
  segment: {
    readonly resistanceMmHgSecPerMl: number;
    readonly inertanceMmHgSec2PerMl: number;
  },
): number {
  const momentum = segment.inertanceMmHgSec2PerMl / dtSec;
  return (
    pressureGradientMmHg + momentum * previousFlowMlPerSec
  ) / (segment.resistanceMmHgSecPerMl + momentum);
}

function oneFiberWallMechanismReadbackV1(
  geometry: OneFiberVolumeGeometryV1,
  trial: LandActivePassiveSlsTrialV1,
  dtSec: number,
): NoAvpdOneFiberWallMechanismReadbackV1 {
  if (!trialAccepted(trial)) {
    throw new Error("one-fiber mechanism readback requires an accepted trial");
  }
  const readback = trial.readback;
  const pressureFromStressMmHg = (stressPa: number) =>
    oneFiberCavityPressurePaV1(geometry, stressPa) / PA_PER_MMHG;
  const equilibriumPassiveMmHg = pressureFromStressMmHg(
    readback.stresses.passiveEquilibriumPa,
  );
  const effectiveLandActiveMmHg = pressureFromStressMmHg(
    readback.stresses.effectiveTransmittedActivePa,
  );
  const slsOverstressMmHg = pressureFromStressMmHg(
    readback.stresses.slsOverstressPa,
  );
  const totalMmHg = pressureFromStressMmHg(
    readback.stresses.totalTransmittedPa,
  );
  return Object.freeze({
    fiberLogStrain: readback.fiberLogStrain,
    fiberLogStrainBackwardDifferenceRatePerSec:
      (readback.fiberLogStrain -
        trial.previousState.passiveSls.totalStrain) / dtSec,
    pressureComponentsMmHg: Object.freeze({
      equilibriumPassiveMmHg,
      effectiveLandActiveMmHg,
      slsOverstressMmHg,
      totalMmHg,
      componentSumMinusTotalMmHg:
        equilibriumPassiveMmHg + effectiveLandActiveMmHg +
        slsOverstressMmHg - totalMmHg,
    }),
  });
}

function massAndMomentumResiduals(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  candidate: Candidate,
  dtSec: number,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): readonly number[] {
  const v0 = previous.volumes;
  const v = candidate.volumes;
  const q = candidate.evaluation.flowReadback;
  const p = candidate.evaluation.pressures;
  const residuals = [
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
  const parallel = candidate.evaluation.leftAtrialParallelWall;
  if (parallel !== null) {
    if (parallel.pressureMismatchMmHg === null) {
      throw new Error("parallel pressure mismatch is unavailable");
    }
    residuals.push(parallel.pressureMismatchMmHg);
  }
  return residuals;
}

/**
 * Exact columns for the six global flow unknowns and four linear vascular
 * compliance volumes. Chamber-wall and TriSeg derivatives are confined to the
 * remaining chamber-volume columns, so these columns avoid repeating all five
 * Land trials and the algebraic TriSeg solve.
 */
function analyticGlobalJacobianColumn(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  candidate: Candidate,
  dtSec: number,
  params: NoAvpdFivePatchLandTriSegParamsV1,
  column: number,
  globalUnknownCount = 14,
): readonly number[] | null {
  const derivative = new Array<number>(globalUnknownCount).fill(0);
  switch (column) {
    case 2: {
      const pressurePerVolume =
        1 / params.vascular.systemicArtery.complianceMlPerMmHg;
      const peripheralFlowPerVolume = pressurePerVolume /
        params.vascular.systemicResistanceMmHgSecPerMl;
      derivative[2] = 1 + dtSec * peripheralFlowPerVolume;
      derivative[3] = -dtSec * peripheralFlowPerVolume;
      derivative[9] = -pressurePerVolume *
        valvePressureGradientResidualDerivative(
          candidate.evaluation.valves.aortic,
          params.valves.aortic,
        );
      break;
    }
    case 3: {
      const pressurePerVolume =
        1 / params.vascular.systemicVein.complianceMlPerMmHg;
      const peripheralFlowPerVolume = pressurePerVolume /
        params.vascular.systemicResistanceMmHgSecPerMl;
      derivative[2] = -dtSec * peripheralFlowPerVolume;
      derivative[3] = 1 + dtSec * peripheralFlowPerVolume;
      derivative[13] = pressurePerVolume;
      break;
    }
    case 6: {
      const pressurePerVolume =
        1 / params.vascular.pulmonaryArtery.complianceMlPerMmHg;
      const peripheralFlowPerVolume = pressurePerVolume /
        params.vascular.pulmonaryResistanceMmHgSecPerMl;
      derivative[6] = 1 + dtSec * peripheralFlowPerVolume;
      derivative[7] = -dtSec * peripheralFlowPerVolume;
      derivative[11] = -pressurePerVolume *
        valvePressureGradientResidualDerivative(
          candidate.evaluation.valves.pulmonary,
          params.valves.pulmonary,
        );
      break;
    }
    case 7: {
      const pressurePerVolume =
        1 / params.vascular.pulmonaryVein.complianceMlPerMmHg;
      const peripheralFlowPerVolume = pressurePerVolume /
        params.vascular.pulmonaryResistanceMmHgSecPerMl;
      derivative[6] = -dtSec * peripheralFlowPerVolume;
      derivative[7] = 1 + dtSec * peripheralFlowPerVolume;
      derivative[12] = pressurePerVolume;
      break;
    }
    case 8:
      derivative[0] = dtSec;
      derivative[1] = -dtSec;
      derivative[8] = valveFlowResidualDerivative(
        candidate.evaluation.valves.mitral,
        valveFlowSmoothingMlPerSec(params, "mitral"),
        dtSec,
      );
      break;
    case 9:
      derivative[1] = dtSec;
      derivative[2] = -dtSec;
      derivative[9] = valveFlowResidualDerivative(
        candidate.evaluation.valves.aortic,
        valveFlowSmoothingMlPerSec(params, "aortic"),
        dtSec,
      );
      break;
    case 10:
      derivative[4] = dtSec;
      derivative[5] = -dtSec;
      derivative[10] = valveFlowResidualDerivative(
        candidate.evaluation.valves.tricuspid,
        valveFlowSmoothingMlPerSec(params, "tricuspid"),
        dtSec,
      );
      break;
    case 11:
      derivative[5] = dtSec;
      derivative[6] = -dtSec;
      derivative[11] = valveFlowResidualDerivative(
        candidate.evaluation.valves.pulmonary,
        valveFlowSmoothingMlPerSec(params, "pulmonary"),
        dtSec,
      );
      break;
    case 12:
      derivative[0] = -dtSec;
      derivative[7] = dtSec;
      derivative[12] =
        -params.vascular.pulmonaryVenousSegment.resistanceMmHgSecPerMl -
        params.vascular.pulmonaryVenousSegment.inertanceMmHgSec2PerMl /
          dtSec;
      break;
    case 13:
      derivative[3] = dtSec;
      derivative[4] = -dtSec;
      derivative[13] =
        -params.vascular.systemicVenousSegment.resistanceMmHgSecPerMl -
        params.vascular.systemicVenousSegment.inertanceMmHgSec2PerMl /
          dtSec;
      break;
    default:
      return null;
  }
  return Object.freeze(derivative);
}

function valvePressureGradientResidualDerivative(
  valve: Candidate["evaluation"]["valves"]["mitral"],
  params: NoAvpdFivePatchLandTriSegParamsV1["valves"]["mitral"],
): number {
  const openAreaCm2 = Math.max(params.openAreaCm2, 1e-6);
  const leakAreaCm2 = Math.max(
    Math.min(params.leakAreaCm2, openAreaCm2),
    1e-6,
  );
  const openFractionDerivativePerMmHg =
    valve.openFraction01 * (1 - valve.openFraction01) /
    Math.max(params.openingWidthMmHg, 1e-9);
  const relativeAreaDerivativePerMmHg =
    (openAreaCm2 - leakAreaCm2) * openFractionDerivativePerMmHg /
    Math.max(valve.effectiveAreaCm2, 1e-9);
  const q = valve.qMlPerSec;
  const smoothAbs = Math.sqrt(q * q + params.flowSmoothingMlPerSec ** 2);
  return 1 +
    2 * valve.resistanceMmHgSecPerMl * q *
      relativeAreaDerivativePerMmHg +
    valve.inertanceMmHgSec2PerMl * valve.qDotMlPerSec2 *
      relativeAreaDerivativePerMmHg +
    2 * valve.bernoulliMmHgSec2PerMl2 * q * smoothAbs *
      relativeAreaDerivativePerMmHg;
}

function valveFlowResidualDerivative(
  valve: Candidate["evaluation"]["valves"]["mitral"],
  flowSmoothingMlPerSec: number,
  dtSec: number,
): number {
  const q = valve.qMlPerSec;
  const smoothAbs = Math.sqrt(q * q + flowSmoothingMlPerSec ** 2);
  const effectiveDtSec = Math.max(dtSec, 1e-9);
  return -(
    valve.resistanceMmHgSecPerMl +
    valve.inertanceMmHgSec2PerMl / effectiveDtSec +
    valve.bernoulliMmHgSec2PerMl2 *
      (2 * q * q + flowSmoothingMlPerSec ** 2) /
      Math.max(smoothAbs, 1e-9)
  );
}

function valveFlowSmoothingMlPerSec(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  valveId: "mitral" | "aortic" | "tricuspid" | "pulmonary",
): number {
  return params.structuralExtension?.dynamicValves?.[valveId]
    .flowSmoothingMlPerSec ?? params.valves[valveId].flowSmoothingMlPerSec;
}

function sameUnknownVector(
  left: readonly number[],
  right: readonly number[],
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function trialCalciumDrivers(
  previous: NoAvpdFivePatchLandTriSegStateV1,
  nextTimeSec: number,
  dtSec: number,
  params: NoAvpdFivePatchLandTriSegParamsV1,
  controls: NoAvpdFivePatchLandStepControlsV1 =
    DEFAULT_NO_AVPD_FIVE_PATCH_LAND_STEP_CONTROLS_V1,
): NoAvpdCalciumDriverTrialsV1 {
  return mapWallIds((wallId) => {
    const driverParams = params.calciumDrivers[wallId];
    const trial = trialPeriodicPrescribedCalciumDriverV2(
      previous.calciumDrivers[wallId],
      nextTimeSec,
      dtSec,
      driverParams,
    );
    return scalePrescribedCalciumPeakAboveDiastolic(
      trial,
      driverParams,
      controls.prescribedCalciumPeakAboveDiastolicScale01,
    );
  });
}

function scalePrescribedCalciumPeakAboveDiastolic(
  trial: PeriodicPrescribedCalciumDriverTrialV2,
  params: PeriodicPrescribedCalciumDriverParamsV2,
  scale01: number,
): PeriodicPrescribedCalciumDriverTrialV2 {
  if (scale01 === 1 || !trial.valid) return trial;
  const target = effectiveCalciumRateTargetAtCycleLength(
    params.calcium,
    params.cycleLengthSec,
  );
  const scaleReadback = (freeCalciumUM: number) =>
    target.diastolicCalciumUM +
      scale01 * (freeCalciumUM - target.diastolicCalciumUM);
  return Object.freeze({
    ...trial,
    freeCalciumUM: scaleReadback(trial.freeCalciumUM),
    midpointFreeCalciumUM: scaleReadback(trial.midpointFreeCalciumUM),
    releaseDriveUMPerSec: trial.releaseDriveUMPerSec * scale01,
    clearanceDriveUMPerSec: trial.clearanceDriveUMPerSec * scale01,
  });
}

function stateToUnknowns(
  state: NoAvpdFivePatchLandTriSegStateV1,
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
    ...(state.leftAtrialParallelWall === undefined
      ? []
      : [state.leftAtrialParallelWall.appendageVolumeMl]),
  ];
}

function unknownsToStateParts(
  unknowns: readonly number[],
  hasParallelAppendageCoordinate: boolean,
): {
  readonly volumes: NoAvpdBloodVolumesV1;
  readonly flows: NoAvpdFlowStateV1;
  readonly appendageVolumeMl: number | null;
} {
  const expected = hasParallelAppendageCoordinate ? 15 : 14;
  if (unknowns.length !== expected) {
    throw new Error(`expected ${expected} global unknowns`);
  }
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
    appendageVolumeMl: hasParallelAppendageCoordinate
      ? unknowns[14]!
      : null,
  };
}

function triSegBaseInput(
  volumes: NoAvpdBloodVolumesV1,
  params: NoAvpdFivePatchLandTriSegParamsV1,
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
 * it does not reuse Land-active or SLS history and never falls back between
 * mappings.
 */
export function solveNoAvpdPassiveTriSegEquilibriumV1(
  volumes: NoAvpdBloodVolumesV1,
  params: NoAvpdFivePatchLandTriSegParamsV1,
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
        const passive = evaluateEquilibriumPassiveStressV1(
          geometry.walls[wallId].fiberNaturalStrain,
          params.triSeg[wallId].material.passiveSls.passive,
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

type AcceptedLandMaterialTrialV1 = LandActivePassiveSlsTrialV1 & {
  readonly nextState: LandActivePassiveSlsStateV1;
  readonly readback: NonNullable<LandActivePassiveSlsTrialV1["readback"]>;
};

function trialAccepted(
  trial: LandActivePassiveSlsTrialV1,
): trial is AcceptedLandMaterialTrialV1 {
  return (
    trial.valid &&
    trial.finite &&
    trial.nextState !== null &&
    trial.readback !== null
  );
}

function allMaterialTrialsAccepted(
  evaluation: NoAvpdFivePatchLandEvaluationV1,
): boolean {
  return (
    trialAccepted(evaluation.leftAtrium.materialTrial) &&
    (evaluation.leftAtrialParallelWall === null ||
      (evaluation.leftAtrialParallelWall.valid &&
        evaluation.leftAtrialParallelWall.appendage !== null &&
        trialAccepted(
          evaluation.leftAtrialParallelWall.appendage.materialTrial,
        ))) &&
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
  material: LandActivePassiveSlsParamsV1,
  calciumDriverParams: PeriodicPrescribedCalciumDriverParamsV2,
): LandActivePassiveSlsStateV1 {
  const calciumTarget = effectiveCalciumRateTargetAtCycleLength(
    calciumDriverParams.calcium,
    calciumDriverParams.cycleLengthSec,
  );
  return initialLandActivePassiveSlsStateV1(
    totalStrain,
    calciumTarget.diastolicCalciumUM,
    material,
  );
}

function assertCalciumDriverOwnership(
  params: NoAvpdFivePatchLandTriSegParamsV1,
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

function assertWallMaterialOwnership(
  states: NoAvpdFivePatchLandWallStatesV1,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): void {
  for (const wallId of WALL_IDS) {
    const state = states[wallId];
    const material = wallMaterialParams(params, wallId);
    if (state.kind !== LAND_ACTIVE_PASSIVE_SLS_V1_ID) {
      throw new Error(`unsupported ${wallId} constitutive state kind`);
    }
    if (
      state.materialIdentityCanonicalJson !==
      landActivePassiveSlsMaterialIdentityV1(material)
    ) {
      throw new Error(
        `${wallId} material identity changed on an accepted state; cold initialization is required`,
      );
    }
    if (
      Math.abs(
        state.active.previousFiberLogStrain - state.passiveSls.totalStrain,
      ) > 1e-12
    ) {
      throw new Error(
        `accepted ${wallId} Land and passive/SLS strain histories diverged`,
      );
    }
  }
}

function assertStructuralExtensionOwnership(
  state: NoAvpdFivePatchLandTriSegStateV1,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): void {
  const parallelParams =
    params.structuralExtension?.leftAtrialParallelWall;
  const parallelState = state.leftAtrialParallelWall;
  if ((parallelParams === undefined) !== (parallelState === undefined)) {
    throw new Error(
      "left-atrial parallel-wall topology changed; cold initialization is required",
    );
  }
  const dynamicValveParams = params.structuralExtension?.dynamicValves;
  const dynamicValveState = state.dynamicValveOpeningFractions01;
  if (
    (dynamicValveParams === undefined) !== (dynamicValveState === undefined)
  ) {
    throw new Error(
      "dynamic-valve topology changed; cold initialization is required",
    );
  }
  if (
    dynamicValveState !== undefined &&
    Object.values(dynamicValveState).some((opening) =>
      !Number.isFinite(opening) || opening < 0 || opening > 1)
  ) {
    throw new Error("accepted dynamic-valve opening state lies outside [0, 1]");
  }
  const intrathoracicPressureMmHg =
    params.structuralExtension?.intrathoracicPressureMmHg ?? 0;
  if (!Number.isFinite(intrathoracicPressureMmHg)) {
    throw new Error("intrathoracicPressureMmHg must be finite");
  }
  if (parallelParams === undefined || parallelState === undefined) return;
  const aggregate = params.atria.left.geometry;
  const bodyGeometry = parallelParams.body.geometry;
  const appendageGeometry = parallelParams.appendage.geometry;
  if (
    Math.abs(
      bodyGeometry.wallVolumeMl + appendageGeometry.wallVolumeMl -
        aggregate.wallVolumeMl,
    ) > 1e-12 ||
    Math.abs(
      bodyGeometry.referenceCavityVolumeMl +
        appendageGeometry.referenceCavityVolumeMl -
        aggregate.referenceCavityVolumeMl,
    ) > 1e-12
  ) {
    throw new Error(
      "body and appendage wall/reference volumes must exactly partition the aggregate LA prior",
    );
  }
  if (
    parallelState.body.materialIdentityCanonicalJson !==
      landActivePassiveSlsMaterialIdentityV1(parallelParams.body.material) ||
    parallelState.appendage.materialIdentityCanonicalJson !==
      landActivePassiveSlsMaterialIdentityV1(
        parallelParams.appendage.material,
      )
  ) {
    throw new Error(
      "parallel body-appendage material changed; cold initialization is required",
    );
  }
  const acceptedAppendageFraction01 =
    parallelState.appendageVolumeMl / state.volumes.leftAtriumMl;
  if (
    !Number.isFinite(parallelState.appendageVolumeMl) ||
    acceptedAppendageFraction01 <
      parallelParams.minimumAppendageFraction01 ||
    acceptedAppendageFraction01 >
      parallelParams.maximumAppendageFraction01
  ) {
    throw new Error(
      "accepted appendage algebraic coordinate lies outside its declared bounds",
    );
  }
  if (
    parallelState.body.materialIdentityCanonicalJson !==
      state.walls.leftAtrium.materialIdentityCanonicalJson ||
    Math.abs(
      parallelState.body.passiveSls.totalStrain -
        state.walls.leftAtrium.passiveSls.totalStrain,
    ) > 1e-12
  ) {
    throw new Error("aggregate LA body state diverged from parallel-wall body");
  }
}

function wallMaterialParams(
  params: NoAvpdFivePatchLandTriSegParamsV1,
  wallId: NoAvpdWallIdV1,
): LandActivePassiveSlsParamsV1 {
  switch (wallId) {
    case "leftAtrium":
      return params.structuralExtension?.leftAtrialParallelWall?.body
        .material ?? params.atria.left.material;
    case "rightAtrium":
      return params.atria.right.material;
    case "leftFreeWall":
      return params.triSeg.leftFreeWall.material;
    case "septum":
      return params.triSeg.septum.material;
    case "rightFreeWall":
      return params.triSeg.rightFreeWall.material;
  }
}

function assertSubsystemParameterOwnership(
  state: NoAvpdFivePatchLandTriSegStateV1,
  params: NoAvpdFivePatchLandTriSegParamsV1,
): void {
  if (
    state.parameterIdentityCanonicalJson !==
    noAvpdFivePatchLandParameterIdentityV1(params)
  ) {
    throw new Error(
      "effective subsystem parameters changed on an accepted state; cold reinitialization is required",
    );
  }
}

export function createDefaultNoAvpdFivePatchLandTriSegParamsV1(
  slsVariant: NoAvpdFivePatchLandSlsVariantV1 = "all-patch",
): NoAvpdFivePatchLandTriSegParamsV1 {
  if (
    slsVariant !== "off" &&
    slsVariant !== "atrial-only" &&
    slsVariant !== "all-patch"
  ) {
    throw new Error(
      `unsupported five-patch SLS variant: ${String(slsVariant)}`,
    );
  }
  const cycleLengthSec = 1;
  const leftAtrialReferenceShift =
    Math.log((24 + 0.5 * 20) / (60 + 0.5 * 20)) / 3;
  const rightAtrialReferenceShift =
    Math.log((26 + 0.5 * 16) / (40 + 0.5 * 16)) / 3;
  const septalReferenceShift = 0.5 * Math.log(25 / 34);
  const rightFreeWallReferenceShift = 0.5 * Math.log(105 / 110);
  const atrialSlsEnabled = slsVariant !== "off";
  const ventricularSlsEnabled = slsVariant === "all-patch";

  const leftAtrialMaterial = landMaterialParams({
    materialId: "no-avpd-la-land-passive-sls-engineering-seed-v1",
    activeFamily: "atrial",
    activeHomogenizationScale: 1,
    passiveTangentModulusPa: 8_000,
    passiveReferenceStrain: leftAtrialReferenceShift,
    slsEnabled: atrialSlsEnabled,
    slsModulusPa: 4_000,
    slsRelaxationTimeSec: 0.12,
  });
  const rightAtrialMaterial = landMaterialParams({
    materialId: "no-avpd-ra-land-passive-sls-engineering-seed-v1",
    activeFamily: "atrial",
    activeHomogenizationScale: 1,
    passiveTangentModulusPa: 8_000,
    passiveReferenceStrain: rightAtrialReferenceShift,
    slsEnabled: atrialSlsEnabled,
    slsModulusPa: 4_000,
    slsRelaxationTimeSec: 0.12,
  });
  const lvMaterial = landMaterialParams({
    materialId: "no-avpd-lvfw-land-passive-sls-engineering-seed-v1",
    activeFamily: "ventricular",
    activeHomogenizationScale: 1,
    passiveTangentModulusPa: 12_000,
    passiveReferenceStrain: -0.1,
    slsEnabled: ventricularSlsEnabled,
    slsModulusPa: 8_000,
    slsRelaxationTimeSec: 0.12,
  });
  const septalMaterial = landMaterialParams({
    materialId: "no-avpd-septum-land-passive-sls-engineering-seed-v1",
    activeFamily: "ventricular",
    activeHomogenizationScale: 1,
    passiveTangentModulusPa: 12_000,
    passiveReferenceStrain: septalReferenceShift,
    slsEnabled: ventricularSlsEnabled,
    slsModulusPa: 8_000,
    slsRelaxationTimeSec: 0.12,
  });
  const rvMaterial = landMaterialParams({
    materialId: "no-avpd-rvfw-land-passive-sls-engineering-seed-v1",
    activeFamily: "ventricular",
    activeHomogenizationScale: 1,
    passiveTangentModulusPa: 10_000,
    passiveReferenceStrain: rightFreeWallReferenceShift,
    slsEnabled: ventricularSlsEnabled,
    slsModulusPa: 6_000,
    slsRelaxationTimeSec: 0.12,
  });

  return {
    cycleLengthSec,
    // The five-patch material declares natural fiber strain and Kirchhoff
    // fiber stress as its boundary work pair. Use the matching virtual-power
    // gradient for both ventricular pressures and the two algebraic TriSeg
    // equilibrium equations. The literature-faithful representative-tension
    // mapping remains available as a comparator, but is not the default for
    // this composite material class.
    triSegGeneralizedForceMapping: "full-fiber-energy-gradient",
    triSegColdInitialization: "passive-reequilibrated",
    calciumDrivers: {
      leftAtrium: calciumDriver(
        "LA",
        cycleLengthSec,
        0.78,
        FIVE_PATCH_LAND_ATRIAL_CALCIUM_CONTEXT_DRIVER_V1,
      ),
      rightAtrium: calciumDriver(
        "RA",
        cycleLengthSec,
        0.76,
        FIVE_PATCH_LAND_ATRIAL_CALCIUM_CONTEXT_DRIVER_V1,
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
        material: leftAtrialMaterial,
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
      maxIterations: 80,
      residualTolerance: 1e-7,
      derivativeRelativeStep: 2e-6,
      lineSearchReduction: 0.5,
      minLineSearchStep: 1 / 2048,
      jacobianReuse: {
        // With the full-fiber generalized-force TriSeg mapping, the late
        // atrial/MV transition converges in 42 iterations with a freshly
        // evaluated Jacobian at every accepted Newton update. Reusing even one
        // accepted-update Jacobian stalls on the same finite constitutive
        // state. Keep the robust full-Newton policy; no Jacobian is carried
        // across global time steps in either case.
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

function landMaterialParams(input: {
  readonly materialId: string;
  readonly activeFamily: "atrial" | "ventricular";
  readonly activeHomogenizationScale?: number;
  readonly passiveTangentModulusPa: number;
  readonly passiveReferenceStrain: number;
  readonly slsEnabled: boolean;
  readonly slsModulusPa: number;
  readonly slsRelaxationTimeSec: number;
}): LandActivePassiveSlsParamsV1 {
  const passiveSls = prepareEquilibriumPassiveSlsParallelParamsV1({
    parameterSetId: `${input.materialId}-passive-sls`,
    passive: {
      tangentModulusPa: input.passiveTangentModulusPa,
      exponentialSlope: 8,
      referenceStrain: input.passiveReferenceStrain,
      tensionTransitionStrain: 0.02,
    },
    sls: {
      enabled: input.slsEnabled,
      modulusPa: input.slsEnabled ? input.slsModulusPa : 0,
      relaxationTimeSec: input.slsRelaxationTimeSec,
    },
  });
  const active =
    input.activeFamily === "atrial"
      ? createLand2017AtrialActiveOnlyParamsV1()
      : createLand2017VentricularActiveOnlyParamsV1();
  return prepareLandActivePassiveSlsParamsV1({
    materialId: input.materialId,
    active,
    passiveSls,
    activeHomogenizationScale: input.activeHomogenizationScale ?? 1,
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
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  throw new Error(`parameter identity cannot encode ${typeof value}`);
}
