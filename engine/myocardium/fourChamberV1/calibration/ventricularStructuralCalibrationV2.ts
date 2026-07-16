import {
  evaluateLandLengthStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateLandNominalToKirchhoffAtStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landNominalToKirchhoffV1";
import {
  assertLandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import {
  compileEquilibriumPassivePriorV1,
  evaluateEquilibriumPassiveEnergyV1,
  type EffectiveOneFiberPassivePriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  solvePhaseB0PublishedTriSegRootV1,
  type PhaseB0PublishedTriSegRootSuccessV1,
  type PhaseB0TriSegCoordinatesV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/publishedTriSegRootV1";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  evaluatePublishedTriSegTaylorOracle2009V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  evaluateEnergyConjugateFiniteThicknessTriSegV2,
  type FiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  solveEnergyConjugateFiniteThicknessTriSegRootV2,
  type EnergyConjugateTriSegRootSuccessV2,
  type EnergyConjugateTriSegRootResultV2,
  type EnergyConjugateTriSegPotentialStabilityV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegRootV2";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID =
  "four-chamber-ventricular-structural-calibration-v2" as const;

export const VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_ID =
  "finite-thickness-runtime-owner-ventricular-isovolumic-pressure-transfer-v3" as const;

export const VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_CLAIM_BOUNDARY =
  Object.freeze({
    activeLoadControl:
      "fixed-wall-kirchhoff-dead-load-mapped-on-passive-root" as const,
    loadingPath:
      "passive-fit-proportional-rv-lv-inflation-nodes-only" as const,
    terminalOrRuntimeTrajectoryReplayed: false as const,
    landActiveStressOrTangentReevaluatedDuringRoot: false as const,
    slsOverstressOrTangentIncluded: false as const,
    monolithicBackwardEulerSchurTangentEvaluated: false as const,
    rejectedSidePseudoArclengthContinuationUsed: false as const,
    rejectedSideMultiStartUsed: false as const,
    newtonRejectionProvesPhysicalFold: false as const,
    solverAcceptanceBoundaryIsClosedLoopContractilityLimit: false as const,
    solverAcceptanceBoundaryIsEndSystolicVolumeLimit: false as const,
  });

export const VENTRICULAR_STRUCTURAL_CALIBRATION_V2_POLICY = Object.freeze({
  policyId: "four-chamber-ventricular-structural-calibration-policy-v2",
  acuteBeatWallRemodelingAllowed: false as const,
  anatomyOwnership: "slow-structural-phenotype-outside-beat-time-state" as const,
  referenceAreaRule:
    "invert-published-triseg-log-strain-at-declared-loaded-geometry" as const,
  passiveIdentification:
    "activation-off-sls-equilibrated-klotz-ed-anchor-with-multipoint-energy-replay" as const,
  passiveFreeAxes: Object.freeze(["shared-tensile-energy-scale"] as const),
  passiveCurvatureFixedDuringScaleFit: false as const,
  fixedBendingPriorReplayedDuringScaleFit: true as const,
  compressionIdentification:
    "not-identified-by-klotz-inflation-retain-independent-source-prior" as const,
  slsIdentification:
    "not-identified-by-equilibrium-klotz-inflation-retain-independent-source-prior" as const,
  activeIdentification:
    "anatomy-and-passive-fixed-before-shared-ventricular-active-scale" as const,
  wallWiseActiveGainAllowed: false as const,
  chamberPressureGainAllowed: false as const,
  atrialPvMorphologyUsedForFit: false as const,
  publishedTaylorUse: "diagnostic-domain-check-only-not-pressure-or-root" as const,
  runtimeAdopted: false as const,
  physiologicalValidationClaimed: false as const,
} as const);

const WALL_IDS = Object.freeze(["LVFW", "SEP", "RVFW"] as const);
const MMHG_TO_PA = 133.322387415;
const VENTRICULAR_STRUCTURAL_ANATOMIES_V2 = new WeakSet<object>();
const VENTRICULAR_PASSIVE_SCALE_FITS_V2 = new WeakSet<object>();

type WallRecord<T> = Readonly<Record<PublishedTriSegWallIdV1, T>>;

export type VentricularLoadedGeometryAnchorV2 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  coordinates: PhaseB0TriSegCoordinatesV1;
}>;

export type VentricularStructuralAnatomyInputV2 = Readonly<{
  wallMaterialVolumeM3ByWall: WallRecord<number>;
  loadedGeometryAnchor: VentricularLoadedGeometryAnchorV2;
  targetFiberStretchAtAnchorByWall: WallRecord<number>;
  provenanceId: string;
}>;

export type VentricularStructuralAnatomyV2 = Readonly<{
  calibrationId: typeof VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID;
  provenanceId: string;
  walls: WallRecord<PublishedTriSegWallGeometryParametersV1>;
  loadedGeometryAnchor: VentricularLoadedGeometryAnchorV2;
  targetFiberStretchAtAnchorByWall: WallRecord<number>;
  replayGeometry: PublishedTriSegGeometryV1;
  maximumAbsoluteTargetLogStrainReplayError: number;
  acuteBeatWallRemodelingAllowed: false;
  referenceAreasAreLoadedCavityAreas: false;
  referenceAreasAreConstitutiveMaterialReferences: true;
  stressFreeUnloadedCoupledGeometryEstablished: false;
  physiologicalValidationClaimed: false;
}>;

export type VentricularPassiveInflationPointV2 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  targetLeftVentricularPressurePa: number;
}>;

export type VentricularPassiveInflationNodeV2 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  targetLeftVentricularPressurePa: number;
  coordinates: PhaseB0TriSegCoordinatesV1;
  geometry: PublishedTriSegGeometryV1;
  fittedLeftVentricularPressurePa: number;
  fittedRightVentricularPressurePa: number;
  fittedPassiveKirchhoffStressPaByWall: WallRecord<number>;
  fittedPassiveTangentPaByWall: WallRecord<number>;
  bendingStoredEnergyJ: number;
  potentialStability: EnergyConjugateTriSegPotentialStabilityV2;
  runtimeEnergyConjugateRootReplayed: true;
  publishedTaylorUsedForPressureOrRoot: false;
  pureTensionBranchByEveryWall: true;
  withinPublishedTaylorTwoPercentTensionErrorDomain: boolean;
}>;

export type VentricularPassiveScaleFitV2 = Readonly<{
  calibrationId: typeof VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID;
  structuralAnatomyProvenanceId: string;
  loadingPathProvenanceId: string;
  fitInterpretation:
    "bracketed-scalar-klotz-ed-anchor-root-with-runtime-energy-multipoint-replay";
  passivePriorId: string;
  bendingPriorId: string;
  scaleMeaning:
    "shared-multiplier-on-pure-tension-energy-stress-and-tangent-not-compression-sls-or-chamber-pressure";
  sharedTensileEnergyScale: number;
  scaledTensileAPa: number;
  fixedPassiveB: number;
  retainedCompressionModulusPa: number;
  scaleBracket: Readonly<{
    lowerScale: number;
    upperScale: number;
    lowerPressureResidualPa: number;
    upperPressureResidualPa: number;
    expansionCount: number;
    bisectionIterationCount: number;
    finalAnchorPressureResidualPa: number;
  }>;
  nodes: readonly VentricularPassiveInflationNodeV2[];
  fittedLeftVentricularPressurePa: readonly number[];
  targetLeftVentricularPressurePa: readonly number[];
  rootMeanSquarePressureErrorPa: number;
  maximumAbsolutePressureErrorPa: number;
  everyNodeRuntimeEnergyConjugateRootReplayed: true;
  everyNodeStrictLocalPotentialMinimum: boolean;
  publishedTaylorUsedForPressureOrRoot: false;
  everyNodeWithinPublishedTaylorTwoPercentTensionErrorDomain: boolean;
  everyNodeOnPureTensionBranch: true;
  compressionScaleIdentified: false;
  slsScaleIdentified: false;
  landActiveStressIncluded: false;
  slsOverstressIncluded: false;
  pericardialPressureIncluded: false;
  chamberPressureGainApplied: false;
  physiologicalValidationClaimed: false;
}>;

export type VentricularIsovolumicPressureTransferV2 = Readonly<{
  calibrationId: typeof VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID;
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  prescribedKirchhoffStressPaByWall: WallRecord<number>;
  coordinates: PhaseB0TriSegCoordinatesV1;
  geometry: PublishedTriSegGeometryV1;
  leftVentricularTransmuralPressurePa: number;
  rightVentricularTransmuralPressurePa: number;
  leftVentricularTransmuralPressureMmHg: number;
  rightVentricularTransmuralPressureMmHg: number;
  withinPublishedTaylorTwoPercentTensionErrorDomain: boolean;
  interpretation:
    "geometry-to-pressure-transfer-capacity-not-a-predicted-land-twitch";
  physiologicalValidationClaimed: false;
}>;

export type VentricularActiveWallStressMappingV3 = Readonly<{
  sourceStressMeasure: "land2017-Ta-nominal-conjugate-to-land-stretch";
  wallStressMeasure: "kirchhoff-conjugate-to-fiber-log-strain";
  sourceActiveNominalStressPa: number;
  mappingGeometry: "passive-only-isovolumic-root";
  fiberLogStrain: number;
  geometryStretch: number;
  landStretch: number;
  lambdaLandSlack: number;
  chiOrient: 1;
  fViable: number;
  wallActiveKirchhoffStressPa: number;
  sourceToWallMappingRule:
    "tau_active=lambda_land*chi_orient*f_viable*T_land_nominal";
  freeWallStressGainApplied: false;
  controlledWallKirchhoffStressHeldFixedDuringSolverRoot: true;
}>;

export type VentricularIsovolumicPressureContributionV3 = Readonly<{
  passiveMembranePressurePa: number;
  controlledActiveMembranePressurePa: number;
  finiteThicknessBendingPressurePa: number;
  reconstructedTotalPressurePa: number;
  directSolverRootTotalPressurePa: number;
  reconstructionResidualPa: number;
}>;

export type VentricularIsovolumicPressureTransferNodeV3 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  passiveOnlyCoordinates: PhaseB0TriSegCoordinatesV1;
  solverAcceptedCoordinates: PhaseB0TriSegCoordinatesV1;
  solverAcceptedGeometry: PublishedTriSegGeometryV1;
  requestedSourceActiveNominalStressPaByWall: WallRecord<number>;
  activeWallStressMappingByWall: WallRecord<VentricularActiveWallStressMappingV3>;
  requestedActiveKirchhoffStressPaByWall: WallRecord<number>;
  solverAcceptedScaledSourceStressLabelPaByWall: WallRecord<number>;
  passiveKirchhoffStressPaByWall: WallRecord<number>;
  solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall: WallRecord<number>;
  solverAcceptedTotalKirchhoffStressPaByWall: WallRecord<number>;
  passiveOnlyCavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
  solverAcceptedCavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
  leftVentricularPressureContribution: VentricularIsovolumicPressureContributionV3;
  rightVentricularPressureContribution: VentricularIsovolumicPressureContributionV3;
  solverAcceptedIncrementalLeftVentricularPressurePa: number;
  solverAcceptedIncrementalLeftVentricularPressureMmHg: number;
  solverAcceptedControlledActiveMembraneLeftVentricularPressurePa: number;
  solverAcceptedControlledActiveMembraneLeftVentricularPressureMmHg: number;
  passiveRootPotentialStability: EnergyConjugateTriSegPotentialStabilityV2;
  solverAcceptedRootPotentialStability: EnergyConjugateTriSegPotentialStabilityV2;
  passiveRootScaledResidualInfinityNorm: number;
  solverAcceptedRootScaledResidualInfinityNorm: number;
  passiveRootStrictLocalMinimum: boolean;
  solverAcceptedRootStrictLocalMinimum: boolean;
  energyConjugateMechanicsOwnerReplayed: true;
  publishedTaylorUsedForPressureOrRoot: false;
  slsOverstressIncluded: false;
  pericardialPressureIncluded: false;
  chamberPressureGainApplied: false;
  postMechanicsPressureMultiplier: 1;
  solverContinuationStepCount: number;
  solverBisectionIterationCount: number;
  requestedControlledDeadLoadTargetReachedBySolver: boolean;
  solverAcceptedControlledStressFractionLowerBracketEndpoint: number;
  solverRejectedControlledStressFractionUpperBracketEndpoint: number | null;
  solverTraceStressFractionBracketWidth: number;
  solverRejectedRootReason: string | null;
  controlledWallKirchhoffStressHeldFixedDuringSolverRoot: true;
  interpretation:
    "fixed-kirchhoff-dead-load-solver-trace-not-land-twitch-contractility-fold-or-esv-limit";
}>;

export type VentricularIsovolumicPressureTransferV3 = Readonly<{
  diagnosticId: typeof VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_ID;
  calibrationId: typeof VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID;
  structuralAnatomyProvenanceId: string;
  passiveCalibrationLoadingPathProvenanceId: string;
  runtimePassivePriorId: string;
  bendingPriorId: string;
  ventricularTissueManifestSha256: string;
  sourceActiveStressControlId: string;
  sourceActiveNominalStressPaByWall: WallRecord<number>;
  passiveFitNodeRvToLvVolumeRatio: number;
  passiveFitNodeRvToLvVolumeRatioConstant: true;
  claimBoundary:
    typeof VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_CLAIM_BOUNDARY;
  nodes: readonly VentricularIsovolumicPressureTransferNodeV3[];
  everyNodeEnergyConjugateMechanicsOwnerReplayed: true;
  everyPassiveAndSolverAcceptedRootStrictLocalMinimum: boolean;
  maximumAbsolutePressureReconstructionResidualPa: number;
  sourceToWallMappingUsesCanonicalPowerConjugateAdapter: true;
  wallWiseFreeGainAllowed: false;
  chamberPressureGainApplied: false;
  postMechanicsPressureMultiplier: 1;
  solverContinuationStepCount: number;
  everyRequestedControlledDeadLoadTargetReachedBySolver: boolean;
  minimumSolverAcceptedControlledStressFractionLowerBracketEndpoint: number;
  passiveOwner:
    "same-klotz-scaled-equilibrium-energy-prior-used-by-mechanistic-runtime";
  bendingOwner: "same-fixed-koiter-prior-used-by-mechanistic-runtime";
  activeInputMeaning:
    "controlled-land-source-nominal-stress-label-mapped-on-passive-root-not-tref-or-predicted-twitch";
  activeStressControlRule:
    "map-source-nominal-stress-at-passive-isovolumic-root-then-hold-wall-kirchhoff-dead-load-fixed-during-solver-root";
  slsOverstressIncluded: false;
  pericardialPressureIncluded: false;
  diagnosticOnly: true;
  physiologicalValidationClaimed: false;
}>;

/**
 * Builds the slow structural phenotype.  Reference midwall areas are obtained
 * by analytically inverting the exact fiber-log-strain expression used by the
 * published TriSeg geometry.  This avoids treating a loaded ED cavity area as
 * a constitutive material reference coordinate.
 */
export function buildVentricularStructuralAnatomyV2(
  input: VentricularStructuralAnatomyInputV2,
): VentricularStructuralAnatomyV2 {
  validateAnatomyInput(input);
  const provisionalWalls = wallRecord((wallId) => Object.freeze({
    wallMaterialVolumeM3: input.wallMaterialVolumeM3ByWall[wallId],
    referenceMidwallAreaM2: 1,
  }));
  const anchorGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3:
      input.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3:
      input.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
    septalMidwallCapVolumeM3:
      input.loadedGeometryAnchor.coordinates.septalMidwallCapVolumeM3,
    junctionRadiusM: input.loadedGeometryAnchor.coordinates.junctionRadiusM,
    walls: provisionalWalls,
  });
  const walls = wallRecord((wallId) => {
    const geometry = anchorGeometry.walls[wallId];
    const targetLogStrain = Math.log(
      input.targetFiberStretchAtAnchorByWall[wallId],
    );
    const zSquared = geometry.thicknessCurvatureRatioZ ** 2;
    const thicknessCorrection = zSquared / 12 + 0.019 * zSquared ** 2;
    const referenceMidwallAreaM2 = geometry.midwallAreaM2
      * Math.exp(-2 * (targetLogStrain + thicknessCorrection));
    return Object.freeze({
      wallMaterialVolumeM3: input.wallMaterialVolumeM3ByWall[wallId],
      referenceMidwallAreaM2: requirePositiveFinite(
        referenceMidwallAreaM2,
        `${wallId}.referenceMidwallAreaM2`,
      ),
    });
  });
  const replayGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3:
      input.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3:
      input.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
    septalMidwallCapVolumeM3:
      input.loadedGeometryAnchor.coordinates.septalMidwallCapVolumeM3,
    junctionRadiusM: input.loadedGeometryAnchor.coordinates.junctionRadiusM,
    walls,
  });
  const maximumAbsoluteTargetLogStrainReplayError = Math.max(
    ...WALL_IDS.map((wallId) => Math.abs(
      replayGeometry.walls[wallId].fiberLogStrain
        - Math.log(input.targetFiberStretchAtAnchorByWall[wallId]),
    )),
  );
  if (maximumAbsoluteTargetLogStrainReplayError > 128 * Number.EPSILON) {
    throw new Error("TriSeg reference-area inverse did not replay target log strain");
  }
  const anatomy = Object.freeze({
    calibrationId: VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID,
    provenanceId: input.provenanceId,
    walls,
    loadedGeometryAnchor: freezeLoadedGeometryAnchor(input.loadedGeometryAnchor),
    targetFiberStretchAtAnchorByWall: Object.freeze({
      ...input.targetFiberStretchAtAnchorByWall,
    }),
    replayGeometry,
    maximumAbsoluteTargetLogStrainReplayError,
    acuteBeatWallRemodelingAllowed: false as const,
    referenceAreasAreLoadedCavityAreas: false as const,
    referenceAreasAreConstitutiveMaterialReferences: true as const,
    stressFreeUnloadedCoupledGeometryEstablished: false as const,
    physiologicalValidationClaimed: false as const,
  });
  VENTRICULAR_STRUCTURAL_ANATOMIES_V2.add(anatomy);
  return anatomy;
}

/**
 * Identifies the one shared tensile-energy multiplier at the measured Klotz
 * ED anchor.  Every scalar trial re-solves the internal shape coordinates
 * with the runtime finite-thickness energy and the fixed bending prior.  This
 * is necessary because fixed bending breaks the scale invariance assumed by
 * the former Taylor/closed-form surrogate.  Remaining Klotz points are
 * strictly held-out replay points, not extra material-fit axes.
 */
export function fitSharedVentricularPassiveEnergyScaleV2(input: Readonly<{
  anatomy: VentricularStructuralAnatomyV2;
  basePassivePrior: EffectiveOneFiberPassivePriorV1;
  bendingPrior: FiniteThicknessTriSegBendingPriorV2;
  inflationPoints: readonly VentricularPassiveInflationPointV2[];
  loadingPathProvenanceId: string;
}>): VentricularPassiveScaleFitV2 {
  assertExactPlainRecordV1(
    input,
    [
      "anatomy",
      "basePassivePrior",
      "bendingPrior",
      "inflationPoints",
      "loadingPathProvenanceId",
    ],
    "ventricular passive scale fit input",
  );
  assertStructuralAnatomy(input.anatomy);
  if (!Array.isArray(input.inflationPoints) || input.inflationPoints.length < 2) {
    throw new Error("passive scale fit requires at least two inflation points");
  }
  if (
    typeof input.loadingPathProvenanceId !== "string"
    || input.loadingPathProvenanceId.trim() === ""
  ) throw new Error("passive scale fit loadingPathProvenanceId is required");
  const compiled = compileEquilibriumPassivePriorV1(input.basePassivePrior);
  input.inflationPoints.forEach(validateInflationPoint);
  const anchorIndex = input.inflationPoints.findIndex((point) =>
    Math.abs(
      point.leftVentricularCavityVolumeM3
        - input.anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
    ) <= 1e-12 * input.anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3
    && Math.abs(
      point.rightVentricularCavityVolumeM3
        - input.anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3,
    ) <= 1e-12 * input.anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3);
  if (anchorIndex < 0) {
    throw new Error(
      "passive scale fit requires the measured loaded biventricular ED anchor among its replay points",
    );
  }
  const anchor = input.inflationPoints[anchorIndex];
  const solveAtScale = (
    point: VentricularPassiveInflationPointV2,
    scale: number,
    initialCoordinates: PhaseB0TriSegCoordinatesV1,
  ) => {
    const scaledCompiled = compileEquilibriumPassivePriorV1({
      ...compiled.prior,
      priorId: `${compiled.prior.priorId}:energy-scale-trial`,
      APa: requirePositiveFinite(scale * compiled.prior.APa, "scaled APa"),
      evidenceClass: "literature-informed-organ-scale-edpvr-inverse",
    });
    const initialGeometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: point.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: point.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: initialCoordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: initialCoordinates.junctionRadiusM,
      walls: input.anatomy.walls,
    });
    const initialStress = wallRecord((wallId) =>
      evaluateEquilibriumPassiveEnergyV1(
        initialGeometry.walls[wallId].fiberLogStrain,
        scaledCompiled,
      ).equilibriumKirchhoffStressPa);
    const residualScaleNPerM = Math.max(
      ...WALL_IDS.map((wallId) => Math.abs(initialStress[wallId])
        * input.anatomy.walls[wallId].wallMaterialVolumeM3
        / (2 * initialGeometry.walls[wallId].midwallAreaM2)),
      1e-3,
    );
    const result = solveEnergyConjugateFiniteThicknessTriSegRootV2({
      leftVentricularCavityVolumeM3: point.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: point.rightVentricularCavityVolumeM3,
      walls: input.anatomy.walls,
      bendingPrior: input.bendingPrior,
      initialCoordinates,
      evaluateWallStress: (geometry) => wallRecord((wallId) =>
        evaluateEquilibriumPassiveEnergyV1(
          geometry.walls[wallId].fiberLogStrain,
          scaledCompiled,
        ).equilibriumKirchhoffStressPa),
      unknownScales: {
        septalMidwallCapVolumeM3: Math.max(
          Math.abs(initialCoordinates.septalMidwallCapVolumeM3),
          20e-6,
        ),
        junctionRadiusM: Math.max(initialCoordinates.junctionRadiusM, 0.02),
      },
      equilibriumResidualScaleNPerM: residualScaleNPerM,
      junctionRadiusLowerBoundM: 1e-5,
      algorithmicJacobianScaledStep: 2 ** -18,
    });
    if (result.converged === false) {
      throw new Error(
        `ventricular energy-conjugate TriSeg root failed: ${result.reason}: ${result.message}`,
      );
    }
    if (!result.potentialStability.positiveDefinite) {
      throw new Error(
        "ventricular energy-conjugate TriSeg stationary point is not a strict local potential minimum",
      );
    }
    return Object.freeze({ solution: result, compiled: scaledCompiled });
  };
  const anchorResidual = (scale: number) => {
    const trial = solveAtScale(
      anchor,
      scale,
      input.anatomy.loadedGeometryAnchor.coordinates,
    );
    return Object.freeze({
      ...trial,
      pressureResidualPa:
        trial.solution.mechanics.cavityTransmuralPressuresPa.LV
        - anchor.targetLeftVentricularPressurePa,
    });
  };
  let lowerScale = 1;
  let upperScale = 1;
  let lowerTrial = anchorResidual(lowerScale);
  let upperTrial = lowerTrial;
  let expansionCount = 0;
  if (lowerTrial.pressureResidualPa < 0) {
    do {
      lowerScale = upperScale;
      lowerTrial = upperTrial;
      upperScale *= 2;
      upperTrial = anchorResidual(upperScale);
      expansionCount += 1;
    } while (upperTrial.pressureResidualPa < 0 && expansionCount < 32);
  } else if (lowerTrial.pressureResidualPa > 0) {
    do {
      upperScale = lowerScale;
      upperTrial = lowerTrial;
      lowerScale *= 0.5;
      lowerTrial = anchorResidual(lowerScale);
      expansionCount += 1;
    } while (lowerTrial.pressureResidualPa > 0 && expansionCount < 32);
  }
  if (
    lowerTrial.pressureResidualPa > 0
    || upperTrial.pressureResidualPa < 0
  ) {
    throw new Error(
      "runtime energy Klotz anchor scale root could not be bracketed by deterministic powers of two",
    );
  }
  const pressureTolerancePa = Math.max(
    1e-7,
    1e-10 * anchor.targetLeftVentricularPressurePa,
  );
  let selectedTrial = Math.abs(lowerTrial.pressureResidualPa)
      <= Math.abs(upperTrial.pressureResidualPa)
    ? lowerTrial
    : upperTrial;
  let sharedTensileEnergyScale = selectedTrial === lowerTrial
    ? lowerScale
    : upperScale;
  let bisectionIterationCount = 0;
  while (
    Math.abs(selectedTrial.pressureResidualPa) > pressureTolerancePa
    && bisectionIterationCount < 56
  ) {
    const midpointScale = Math.sqrt(lowerScale * upperScale);
    const midpointTrial = anchorResidual(midpointScale);
    if (midpointTrial.pressureResidualPa < 0) {
      lowerScale = midpointScale;
      lowerTrial = midpointTrial;
    } else {
      upperScale = midpointScale;
      upperTrial = midpointTrial;
    }
    selectedTrial = Math.abs(lowerTrial.pressureResidualPa)
        <= Math.abs(upperTrial.pressureResidualPa)
      ? lowerTrial
      : upperTrial;
    sharedTensileEnergyScale = selectedTrial === lowerTrial
      ? lowerScale
      : upperScale;
    bisectionIterationCount += 1;
  }
  if (Math.abs(selectedTrial.pressureResidualPa) > pressureTolerancePa) {
    throw new Error("runtime energy Klotz anchor scale root did not converge");
  }
  const scaledCompiled = compileEquilibriumPassivePriorV1({
    ...compiled.prior,
    priorId: `${compiled.prior.priorId}:organ-edpvr-energy-replay`,
    APa: sharedTensileEnergyScale * compiled.prior.APa,
    evidenceClass: "literature-informed-organ-scale-edpvr-inverse",
  });
  let coordinates = input.anatomy.loadedGeometryAnchor.coordinates;
  const nodes: VentricularPassiveInflationNodeV2[] = [];
  for (const point of input.inflationPoints) {
    const { solution } = solveAtScale(
      point,
      sharedTensileEnergyScale,
      coordinates,
    );
    coordinates = solution.coordinates;
    const fittedPassiveKirchhoffStressPaByWall = wallRecord((wallId) =>
      evaluateEquilibriumPassiveEnergyV1(
        solution.geometry.walls[wallId].fiberLogStrain,
        scaledCompiled,
      ).equilibriumKirchhoffStressPa);
    const fittedPassiveTangentPaByWall = wallRecord((wallId) =>
      evaluateEquilibriumPassiveEnergyV1(
        solution.geometry.walls[wallId].fiberLogStrain,
        scaledCompiled,
      ).dStressDFiberLogStrainPa);
    const pureTensionBranchByEveryWall = WALL_IDS.every((wallId) =>
      solution.geometry.walls[wallId].fiberLogStrain
        > scaledCompiled.prior.transitionHalfWidthStrain);
    if (!pureTensionBranchByEveryWall) {
      throw new Error(
        "tensile passive scale fit requires every wall at every node to lie on the pure-tension branch",
      );
    }
    const taylorDiagnostic = evaluatePublishedTriSegTaylorOracle2009V1(
      solution.geometry,
      fittedPassiveKirchhoffStressPaByWall,
    );
    nodes.push(Object.freeze({
      ...point,
      coordinates: solution.coordinates,
      geometry: solution.geometry,
      fittedLeftVentricularPressurePa:
        solution.mechanics.cavityTransmuralPressuresPa.LV,
      fittedRightVentricularPressurePa:
        solution.mechanics.cavityTransmuralPressuresPa.RV,
      fittedPassiveKirchhoffStressPaByWall,
      fittedPassiveTangentPaByWall,
      bendingStoredEnergyJ: solution.mechanics.bendingStoredEnergyJ,
      potentialStability: solution.potentialStability,
      runtimeEnergyConjugateRootReplayed: true as const,
      publishedTaylorUsedForPressureOrRoot: false as const,
      pureTensionBranchByEveryWall: true as const,
      withinPublishedTaylorTwoPercentTensionErrorDomain:
        taylorDiagnostic.taylorTensionErrorDomainEligible,
    }));
  }
  if (!nodes.every((node) =>
    node.withinPublishedTaylorTwoPercentTensionErrorDomain)) {
    throw new Error("passive scale fit left the required published Taylor domain");
  }
  const fittedLeftVentricularPressurePa = Object.freeze(nodes.map((node) =>
    node.fittedLeftVentricularPressurePa));
  const targetLeftVentricularPressurePa = Object.freeze(nodes.map((node) =>
    node.targetLeftVentricularPressurePa));
  const errors = fittedLeftVentricularPressurePa.map(
    (pressure, index) => pressure - targetLeftVentricularPressurePa[index],
  );
  const rootMeanSquarePressureErrorPa = Math.sqrt(
    errors.reduce((sum, error) => sum + error ** 2, 0) / errors.length,
  );
  const maximumAbsolutePressureErrorPa = Math.max(
    ...errors.map((error) => Math.abs(error)),
  );
  const fit = Object.freeze({
    calibrationId: VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID,
    structuralAnatomyProvenanceId: input.anatomy.provenanceId,
    loadingPathProvenanceId: input.loadingPathProvenanceId,
    fitInterpretation:
      "bracketed-scalar-klotz-ed-anchor-root-with-runtime-energy-multipoint-replay" as const,
    passivePriorId: compiled.prior.priorId,
    bendingPriorId: input.bendingPrior.priorId,
    scaleMeaning:
      "shared-multiplier-on-pure-tension-energy-stress-and-tangent-not-compression-sls-or-chamber-pressure" as const,
    sharedTensileEnergyScale,
    scaledTensileAPa: sharedTensileEnergyScale * compiled.prior.APa,
    fixedPassiveB: compiled.prior.B,
    retainedCompressionModulusPa: compiled.prior.KCompEffPa,
    scaleBracket: Object.freeze({
      lowerScale,
      upperScale,
      lowerPressureResidualPa: lowerTrial.pressureResidualPa,
      upperPressureResidualPa: upperTrial.pressureResidualPa,
      expansionCount,
      bisectionIterationCount,
      finalAnchorPressureResidualPa: selectedTrial.pressureResidualPa,
    }),
    nodes: Object.freeze(nodes),
    fittedLeftVentricularPressurePa,
    targetLeftVentricularPressurePa,
    rootMeanSquarePressureErrorPa,
    maximumAbsolutePressureErrorPa,
    everyNodeRuntimeEnergyConjugateRootReplayed: true as const,
    everyNodeStrictLocalPotentialMinimum:
      nodes.every((node) => node.potentialStability.positiveDefinite),
    publishedTaylorUsedForPressureOrRoot: false as const,
    everyNodeWithinPublishedTaylorTwoPercentTensionErrorDomain:
      nodes.every((node) =>
        node.withinPublishedTaylorTwoPercentTensionErrorDomain),
    everyNodeOnPureTensionBranch: true as const,
    compressionScaleIdentified: false as const,
    slsScaleIdentified: false as const,
    landActiveStressIncluded: false as const,
    slsOverstressIncluded: false as const,
    pericardialPressureIncluded: false as const,
    chamberPressureGainApplied: false as const,
    physiologicalValidationClaimed: false as const,
  });
  VENTRICULAR_PASSIVE_SCALE_FITS_V2.add(fit);
  return fit;
}

export function assertVentricularPassiveScaleFitV2(
  fit: VentricularPassiveScaleFitV2,
): VentricularPassiveScaleFitV2 {
  if (
    fit === null
    || typeof fit !== "object"
    || !VENTRICULAR_PASSIVE_SCALE_FITS_V2.has(fit)
  ) throw new Error("ventricular passive scale fit must be a live canonical artifact");
  return fit;
}

/** Isolates the geometry/wall-mass transfer from prescribed wall stress to pressure. */
export function evaluateVentricularIsovolumicPressureTransferV2(input: Readonly<{
  anatomy: VentricularStructuralAnatomyV2;
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  prescribedKirchhoffStressPaByWall: WallRecord<number>;
  initialCoordinates?: PhaseB0TriSegCoordinatesV1;
}>): VentricularIsovolumicPressureTransferV2 {
  assertExactPlainRecordV1(
    input,
    input.initialCoordinates === undefined
      ? [
        "anatomy",
        "leftVentricularCavityVolumeM3",
        "rightVentricularCavityVolumeM3",
        "prescribedKirchhoffStressPaByWall",
      ]
      : [
        "anatomy",
        "leftVentricularCavityVolumeM3",
        "rightVentricularCavityVolumeM3",
        "prescribedKirchhoffStressPaByWall",
        "initialCoordinates",
      ],
    "ventricular isovolumic pressure-transfer input",
  );
  assertStructuralAnatomy(input.anatomy);
  requirePositiveFinite(
    input.leftVentricularCavityVolumeM3,
    "leftVentricularCavityVolumeM3",
  );
  requirePositiveFinite(
    input.rightVentricularCavityVolumeM3,
    "rightVentricularCavityVolumeM3",
  );
  assertWallRecord(input.prescribedKirchhoffStressPaByWall, "prescribed stress");
  WALL_IDS.forEach((wallId) => requireFinite(
    input.prescribedKirchhoffStressPaByWall[wallId],
    `${wallId}.prescribedKirchhoffStressPa`,
  ));
  const solution = solveTriSegEquilibrium({
    walls: input.anatomy.walls,
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    initialCoordinates:
      input.initialCoordinates ?? input.anatomy.loadedGeometryAnchor.coordinates,
    evaluateStress: () => input.prescribedKirchhoffStressPaByWall,
  });
  if (!solution.oracle.taylorTensionErrorDomainEligible) {
    throw new Error("isovolumic pressure transfer left the required published Taylor domain");
  }
  const leftVentricularTransmuralPressurePa =
    solution.oracle.cavityTransmuralPressuresPa.LV;
  const rightVentricularTransmuralPressurePa =
    solution.oracle.cavityTransmuralPressuresPa.RV;
  return Object.freeze({
    calibrationId: VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID,
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    prescribedKirchhoffStressPaByWall: Object.freeze({
      ...input.prescribedKirchhoffStressPaByWall,
    }),
    coordinates: solution.coordinates,
    geometry: solution.geometry,
    leftVentricularTransmuralPressurePa,
    rightVentricularTransmuralPressurePa,
    leftVentricularTransmuralPressureMmHg:
      leftVentricularTransmuralPressurePa / MMHG_TO_PA,
    rightVentricularTransmuralPressureMmHg:
      rightVentricularTransmuralPressurePa / MMHG_TO_PA,
    withinPublishedTaylorTwoPercentTensionErrorDomain:
      solution.oracle.taylorTensionErrorDomainEligible,
    interpretation:
      "geometry-to-pressure-transfer-capacity-not-a-predicted-land-twitch" as const,
    physiologicalValidationClaimed: false as const,
  });
}

/**
 * Replays the passive-calibration loading nodes through the finite-thickness
 * energy-conjugate mechanics that own the mechanistic runtime.  The loading
 * nodes are only the passive-fit proportional RV/LV inflation path; no
 * terminal-beat or runtime ejection trajectory is replayed.  A declared
 * Land-source nominal active-stress label is mapped to wall Kirchhoff stress
 * by the canonical power-conjugate wall adapter at the passive isovolumic
 * root, then held as a fixed Kirchhoff dead load while the solver is
 * continued.  Land active-stress/length tangent, SLS tangent, and the
 * monolithic-BE Schur tangent are deliberately absent.
 *
 * SLS overstress and pericardial pressure are held at zero.  No multiplier is
 * applied after the wall stresses enter the mechanics.  This makes the
 * passive membrane, controlled-active membrane, and finite-thickness bending
 * pressure contributions exactly auditable at the solver-accepted root.  A
 * Newton rejection is only a solver-trace boundary: rejected-side multistart
 * and pseudo-arclength continuation are not performed, so it is not evidence
 * of a physical fold, closed-loop contractility limit, or ESV limit.
 */
export function evaluateVentricularIsovolumicPressureTransferV3(input: Readonly<{
  anatomy: VentricularStructuralAnatomyV2;
  passiveCalibration: VentricularPassiveScaleFitV2;
  sourcePassivePrior: EffectiveOneFiberPassivePriorV1;
  bendingPrior: FiniteThicknessTriSegBendingPriorV2;
  ventricularLandWallAdapterContext: LandWallAdapterContextV1;
  sourceActiveStressControlId: string;
  sourceActiveNominalStressPaByWall: WallRecord<number>;
}>): VentricularIsovolumicPressureTransferV3 {
  assertExactPlainRecordV1(
    input,
    [
      "anatomy",
      "passiveCalibration",
      "sourcePassivePrior",
      "bendingPrior",
      "ventricularLandWallAdapterContext",
      "sourceActiveStressControlId",
      "sourceActiveNominalStressPaByWall",
    ],
    "finite-thickness ventricular isovolumic pressure-transfer v3 input",
  );
  assertStructuralAnatomy(input.anatomy);
  const passiveCalibration = assertVentricularPassiveScaleFitV2(
    input.passiveCalibration,
  );
  const adapterContext = assertLandWallAdapterContextV1(
    input.ventricularLandWallAdapterContext,
  );
  if (
    typeof input.sourceActiveStressControlId !== "string"
    || input.sourceActiveStressControlId.trim() === ""
  ) {
    throw new Error("sourceActiveStressControlId must be non-empty");
  }
  assertWallRecord(
    input.sourceActiveNominalStressPaByWall,
    "sourceActiveNominalStressPaByWall",
  );
  WALL_IDS.forEach((wallId) => requireNonNegativeFinite(
    input.sourceActiveNominalStressPaByWall[wallId],
    `${wallId}.sourceActiveNominalStressPa`,
  ));
  if (
    passiveCalibration.structuralAnatomyProvenanceId
      !== input.anatomy.provenanceId
  ) {
    throw new Error(
      "finite-thickness pressure transfer requires the passive fit owned by the supplied anatomy",
    );
  }
  if (passiveCalibration.bendingPriorId !== input.bendingPrior.priorId) {
    throw new Error(
      "finite-thickness pressure transfer requires the bending prior used by the passive fit",
    );
  }
  if (passiveCalibration.nodes.length === 0) {
    throw new Error("finite-thickness pressure transfer requires passive-fit nodes");
  }
  const passiveFitNodeRvToLvVolumeRatio =
    passiveCalibration.nodes[0].rightVentricularCavityVolumeM3
    / passiveCalibration.nodes[0].leftVentricularCavityVolumeM3;
  requirePositiveFinite(
    passiveFitNodeRvToLvVolumeRatio,
    "passiveFitNodeRvToLvVolumeRatio",
  );
  for (const node of passiveCalibration.nodes) {
    const ratio = node.rightVentricularCavityVolumeM3
      / node.leftVentricularCavityVolumeM3;
    if (
      Math.abs(ratio - passiveFitNodeRvToLvVolumeRatio)
        > 1e-12 * Math.max(1, Math.abs(passiveFitNodeRvToLvVolumeRatio))
    ) {
      throw new Error(
        "finite-thickness pressure-transfer v3 is restricted to the passive-fit proportional RV/LV inflation path",
      );
    }
  }
  const sourcePassive = compileEquilibriumPassivePriorV1(
    input.sourcePassivePrior,
  ).prior;
  if (
    passiveCalibration.passivePriorId !== sourcePassive.priorId
    || !Object.is(passiveCalibration.fixedPassiveB, sourcePassive.B)
    || !Object.is(
      passiveCalibration.scaledTensileAPa,
      passiveCalibration.sharedTensileEnergyScale * sourcePassive.APa,
    )
    || !Object.is(
      passiveCalibration.retainedCompressionModulusPa,
      sourcePassive.KCompEffPa,
    )
  ) {
    throw new Error(
      "finite-thickness pressure transfer requires the source passive prior used by the canonical scale fit",
    );
  }
  const runtimePassive = compileEquilibriumPassivePriorV1({
    ...sourcePassive,
    priorId:
      `${sourcePassive.priorId}:organ-edpvr:${passiveCalibration.structuralAnatomyProvenanceId}`,
    evidenceClass: "literature-informed-organ-scale-edpvr-inverse",
    APa: passiveCalibration.scaledTensileAPa,
    KCompEffPa: sourcePassive.KCompEffPa,
  });
  const evaluatePassiveStress = (geometry: PublishedTriSegGeometryV1) =>
    wallRecord((wallId) => evaluateEquilibriumPassiveEnergyV1(
      geometry.walls[wallId].fiberLogStrain,
      runtimePassive,
    ).equilibriumKirchhoffStressPa);
  const mapActiveStress = (geometry: PublishedTriSegGeometryV1) =>
    wallRecord((wallId): VentricularActiveWallStressMappingV3 => {
      const length = evaluateLandLengthStateV1(adapterContext, {
        fiberLogStrain: geometry.walls[wallId].fiberLogStrain,
      });
      const sourceActiveNominalStressPa =
        input.sourceActiveNominalStressPaByWall[wallId];
      const mapped = evaluateLandNominalToKirchhoffAtStateV1(
        adapterContext,
        {
          sourceStressConvention: "land2017-Ta",
          landActiveNominalStressPa: sourceActiveNominalStressPa,
          length,
        },
      );
      return Object.freeze({
        sourceStressMeasure:
          "land2017-Ta-nominal-conjugate-to-land-stretch" as const,
        wallStressMeasure:
          "kirchhoff-conjugate-to-fiber-log-strain" as const,
        sourceActiveNominalStressPa,
        mappingGeometry: "passive-only-isovolumic-root" as const,
        fiberLogStrain: length.passiveAndSlsLogStrain,
        geometryStretch: length.geometryStretch,
        landStretch: length.landStretch,
        lambdaLandSlack: adapterContext.lambdaLandSlack,
        chiOrient: adapterContext.chiOrient,
        fViable: adapterContext.fViable,
        wallActiveKirchhoffStressPa: mapped.wallActiveKirchhoffStressPa,
        sourceToWallMappingRule:
          "tau_active=lambda_land*chi_orient*f_viable*T_land_nominal" as const,
        freeWallStressGainApplied: false as const,
        controlledWallKirchhoffStressHeldFixedDuringSolverRoot: true as const,
      });
    });
  const solveRoot = (
    node: VentricularPassiveInflationNodeV2,
    initialCoordinates: PhaseB0TriSegCoordinatesV1,
    controlledActiveKirchhoffStressPaByWall: WallRecord<number>,
    controlledActiveStressScale: number,
  ): EnergyConjugateTriSegRootResultV2 => {
    requireNonNegativeFinite(
      controlledActiveStressScale,
      "controlledActiveStressScale",
    );
    if (controlledActiveStressScale > 1) {
      throw new Error("controlledActiveStressScale must not exceed one");
    }
    const initialGeometry = evaluatePublishedTriSegGeometryV1({
      leftVentricularCavityVolumeM3: node.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: node.rightVentricularCavityVolumeM3,
      septalMidwallCapVolumeM3: initialCoordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: initialCoordinates.junctionRadiusM,
      walls: input.anatomy.walls,
    });
    const initialPassiveStress = evaluatePassiveStress(initialGeometry);
    const initialTotalStress = wallRecord((wallId) =>
      initialPassiveStress[wallId]
        + controlledActiveStressScale
          * controlledActiveKirchhoffStressPaByWall[wallId]);
    const equilibriumResidualScaleNPerM = Math.max(
      ...WALL_IDS.map((wallId) => Math.abs(initialTotalStress[wallId])
        * input.anatomy.walls[wallId].wallMaterialVolumeM3
        / (2 * initialGeometry.walls[wallId].midwallAreaM2)),
      1e-3,
    );
    const result = solveEnergyConjugateFiniteThicknessTriSegRootV2({
      leftVentricularCavityVolumeM3: node.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3: node.rightVentricularCavityVolumeM3,
      walls: input.anatomy.walls,
      bendingPrior: input.bendingPrior,
      initialCoordinates,
      evaluateWallStress: (geometry) => {
        const passive = evaluatePassiveStress(geometry);
        if (controlledActiveStressScale === 0) return passive;
        return wallRecord((wallId) => passive[wallId]
          + controlledActiveStressScale
            * controlledActiveKirchhoffStressPaByWall[wallId]);
      },
      unknownScales: {
        septalMidwallCapVolumeM3: Math.max(
          Math.abs(initialCoordinates.septalMidwallCapVolumeM3),
          20e-6,
        ),
        junctionRadiusM: Math.max(initialCoordinates.junctionRadiusM, 0.02),
      },
      equilibriumResidualScaleNPerM,
      junctionRadiusLowerBoundM: 1e-5,
      algorithmicJacobianScaledStep: 2 ** -18,
    });
    return result;
  };
  const controlledActiveStressContinuationStepCount = 16;
  const maximumControlledActiveStressBisectionIterations = 16;
  const isStableRoot = (
    result: EnergyConjugateTriSegRootResultV2,
  ): result is EnergyConjugateTriSegRootSuccessV2 =>
    result.converged && result.potentialStability.positiveDefinite;
  const rejectionReason = (
    result: EnergyConjugateTriSegRootResultV2,
  ): string => "reason" in result
    ? `${result.reason}:${result.message}`
    : `not-a-strict-local-potential-minimum:min-eigenvalue-J=${result.potentialStability.minimumEigenvalueJ}`;
  const nodes: VentricularIsovolumicPressureTransferNodeV3[] = [];
  for (const passiveFitNode of passiveCalibration.nodes) {
    const zeroActiveKirchhoffStressPaByWall = wallRecord(() => 0);
    const passiveResult = solveRoot(
      passiveFitNode,
      passiveFitNode.coordinates,
      zeroActiveKirchhoffStressPaByWall,
      0,
    );
    if (!isStableRoot(passiveResult)) {
      throw new Error(
        `finite-thickness pressure-transfer passive root did not replay its strict local minimum: ${rejectionReason(passiveResult)}`,
      );
    }
    const passiveRoot = passiveResult;
    const activeWallStressMappingByWall = mapActiveStress(passiveRoot.geometry);
    const requestedActiveKirchhoffStressPaByWall = wallRecord((wallId) =>
      activeWallStressMappingByWall[wallId].wallActiveKirchhoffStressPa);
    let solverAcceptedRoot = passiveRoot;
    let solverAcceptedControlledStressFractionLowerBracketEndpoint = 0;
    let solverRejectedControlledStressFractionUpperBracketEndpoint:
      number | null = null;
    let solverRejectedRootReason: string | null = null;
    for (
      let step = 1;
      step <= controlledActiveStressContinuationStepCount;
      step += 1
    ) {
      const fraction = step / controlledActiveStressContinuationStepCount;
      const result = solveRoot(
        passiveFitNode,
        solverAcceptedRoot.coordinates,
        requestedActiveKirchhoffStressPaByWall,
        fraction,
      );
      if (!isStableRoot(result)) {
        solverRejectedControlledStressFractionUpperBracketEndpoint = fraction;
        solverRejectedRootReason = rejectionReason(result);
        break;
      }
      solverAcceptedRoot = result;
      solverAcceptedControlledStressFractionLowerBracketEndpoint = fraction;
    }
    let solverBisectionIterationCount = 0;
    if (solverRejectedControlledStressFractionUpperBracketEndpoint !== null) {
      while (
        solverBisectionIterationCount
          < maximumControlledActiveStressBisectionIterations
      ) {
        const midpoint = 0.5 * (
          solverAcceptedControlledStressFractionLowerBracketEndpoint
          + solverRejectedControlledStressFractionUpperBracketEndpoint
        );
        const result = solveRoot(
          passiveFitNode,
          solverAcceptedRoot.coordinates,
          requestedActiveKirchhoffStressPaByWall,
          midpoint,
        );
        if (isStableRoot(result)) {
          solverAcceptedRoot = result;
          solverAcceptedControlledStressFractionLowerBracketEndpoint = midpoint;
        } else {
          solverRejectedControlledStressFractionUpperBracketEndpoint = midpoint;
          solverRejectedRootReason = rejectionReason(result);
        }
        solverBisectionIterationCount += 1;
      }
    }
    const requestedControlledDeadLoadTargetReachedBySolver =
      solverRejectedControlledStressFractionUpperBracketEndpoint === null;
    const solverAcceptedControlledStressFraction =
      requestedControlledDeadLoadTargetReachedBySolver
        ? 1
        : solverAcceptedControlledStressFractionLowerBracketEndpoint;
    const solverAcceptedScaledSourceStressLabelPaByWall = wallRecord((wallId) =>
      solverAcceptedControlledStressFraction
        * input.sourceActiveNominalStressPaByWall[wallId]);
    const solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall = wallRecord(
      (wallId) => solverAcceptedControlledStressFraction
        * requestedActiveKirchhoffStressPaByWall[wallId],
    );
    const passiveKirchhoffStressPaByWall = evaluatePassiveStress(
      solverAcceptedRoot.geometry,
    );
    const solverAcceptedTotalKirchhoffStressPaByWall = wallRecord((wallId) =>
      passiveKirchhoffStressPaByWall[wallId]
        + solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall[wallId]);
    const passiveMechanicsAtSolverAcceptedRoot =
      evaluateEnergyConjugateFiniteThicknessTriSegV2({
        geometry: solverAcceptedRoot.geometry,
        fiberKirchhoffStressPaByWall: passiveKirchhoffStressPaByWall,
        bendingPrior: input.bendingPrior,
      });
    const controlledDeadLoadMechanicsAtSolverAcceptedRoot =
      evaluateEnergyConjugateFiniteThicknessTriSegV2({
        geometry: solverAcceptedRoot.geometry,
        fiberKirchhoffStressPaByWall:
          solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall,
        bendingPrior: input.bendingPrior,
      });
    const contribution = (
      chamber: "LV" | "RV",
    ): VentricularIsovolumicPressureContributionV3 => {
      const field = chamber === "LV"
        ? "leftVentricularPressurePa"
        : "rightVentricularPressurePa";
      const passiveMembranePressurePa =
        passiveMechanicsAtSolverAcceptedRoot.membraneGeneralizedForce[field];
      const controlledActiveMembranePressurePa =
        controlledDeadLoadMechanicsAtSolverAcceptedRoot
          .membraneGeneralizedForce[field];
      const finiteThicknessBendingPressurePa =
        solverAcceptedRoot.mechanics.bendingGeneralizedForce[field];
      const reconstructedTotalPressurePa = passiveMembranePressurePa
        + controlledActiveMembranePressurePa
        + finiteThicknessBendingPressurePa;
      const directSolverRootTotalPressurePa =
        solverAcceptedRoot.mechanics.cavityTransmuralPressuresPa[chamber];
      return Object.freeze({
        passiveMembranePressurePa,
        controlledActiveMembranePressurePa,
        finiteThicknessBendingPressurePa,
        reconstructedTotalPressurePa,
        directSolverRootTotalPressurePa,
        reconstructionResidualPa:
          directSolverRootTotalPressurePa - reconstructedTotalPressurePa,
      });
    };
    const leftVentricularPressureContribution = contribution("LV");
    const rightVentricularPressureContribution = contribution("RV");
    const solverAcceptedIncrementalLeftVentricularPressurePa =
      solverAcceptedRoot.mechanics.cavityTransmuralPressuresPa.LV
      - passiveRoot.mechanics.cavityTransmuralPressuresPa.LV;
    const solverAcceptedControlledActiveMembraneLeftVentricularPressurePa =
      leftVentricularPressureContribution.controlledActiveMembranePressurePa;
    nodes.push(Object.freeze({
      leftVentricularCavityVolumeM3:
        passiveFitNode.leftVentricularCavityVolumeM3,
      rightVentricularCavityVolumeM3:
        passiveFitNode.rightVentricularCavityVolumeM3,
      passiveOnlyCoordinates: passiveRoot.coordinates,
      solverAcceptedCoordinates: solverAcceptedRoot.coordinates,
      solverAcceptedGeometry: solverAcceptedRoot.geometry,
      requestedSourceActiveNominalStressPaByWall: Object.freeze({
        ...input.sourceActiveNominalStressPaByWall,
      }),
      activeWallStressMappingByWall,
      requestedActiveKirchhoffStressPaByWall,
      solverAcceptedScaledSourceStressLabelPaByWall,
      passiveKirchhoffStressPaByWall,
      solverAcceptedFixedActiveKirchhoffDeadLoadPaByWall,
      solverAcceptedTotalKirchhoffStressPaByWall,
      passiveOnlyCavityTransmuralPressuresPa: Object.freeze({
        ...passiveRoot.mechanics.cavityTransmuralPressuresPa,
      }),
      solverAcceptedCavityTransmuralPressuresPa: Object.freeze({
        ...solverAcceptedRoot.mechanics.cavityTransmuralPressuresPa,
      }),
      leftVentricularPressureContribution,
      rightVentricularPressureContribution,
      solverAcceptedIncrementalLeftVentricularPressurePa,
      solverAcceptedIncrementalLeftVentricularPressureMmHg:
        solverAcceptedIncrementalLeftVentricularPressurePa / MMHG_TO_PA,
      solverAcceptedControlledActiveMembraneLeftVentricularPressurePa,
      solverAcceptedControlledActiveMembraneLeftVentricularPressureMmHg:
        solverAcceptedControlledActiveMembraneLeftVentricularPressurePa
          / MMHG_TO_PA,
      passiveRootPotentialStability: passiveRoot.potentialStability,
      solverAcceptedRootPotentialStability:
        solverAcceptedRoot.potentialStability,
      passiveRootScaledResidualInfinityNorm:
        passiveRoot.scaledResidualInfinityNorm,
      solverAcceptedRootScaledResidualInfinityNorm:
        solverAcceptedRoot.scaledResidualInfinityNorm,
      passiveRootStrictLocalMinimum: true as const,
      solverAcceptedRootStrictLocalMinimum: true as const,
      energyConjugateMechanicsOwnerReplayed: true as const,
      publishedTaylorUsedForPressureOrRoot: false as const,
      slsOverstressIncluded: false as const,
      pericardialPressureIncluded: false as const,
      chamberPressureGainApplied: false as const,
      postMechanicsPressureMultiplier: 1 as const,
      solverContinuationStepCount: controlledActiveStressContinuationStepCount,
      solverBisectionIterationCount,
      requestedControlledDeadLoadTargetReachedBySolver,
      solverAcceptedControlledStressFractionLowerBracketEndpoint:
        solverAcceptedControlledStressFraction,
      solverRejectedControlledStressFractionUpperBracketEndpoint,
      solverTraceStressFractionBracketWidth:
        solverRejectedControlledStressFractionUpperBracketEndpoint === null
          ? 0
          : solverRejectedControlledStressFractionUpperBracketEndpoint
            - solverAcceptedControlledStressFraction,
      solverRejectedRootReason,
      controlledWallKirchhoffStressHeldFixedDuringSolverRoot: true as const,
      interpretation:
        "fixed-kirchhoff-dead-load-solver-trace-not-land-twitch-contractility-fold-or-esv-limit" as const,
    }));
  }
  const maximumAbsolutePressureReconstructionResidualPa = Math.max(
    ...nodes.flatMap((node) => [
      Math.abs(node.leftVentricularPressureContribution.reconstructionResidualPa),
      Math.abs(node.rightVentricularPressureContribution.reconstructionResidualPa),
    ]),
  );
  return Object.freeze({
    diagnosticId: VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_ID,
    calibrationId: VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID,
    structuralAnatomyProvenanceId: input.anatomy.provenanceId,
    passiveCalibrationLoadingPathProvenanceId:
      passiveCalibration.loadingPathProvenanceId,
    runtimePassivePriorId: runtimePassive.prior.priorId,
    bendingPriorId: input.bendingPrior.priorId,
    ventricularTissueManifestSha256: adapterContext.tissueManifestSha256,
    sourceActiveStressControlId: input.sourceActiveStressControlId,
    sourceActiveNominalStressPaByWall: Object.freeze({
      ...input.sourceActiveNominalStressPaByWall,
    }),
    passiveFitNodeRvToLvVolumeRatio,
    passiveFitNodeRvToLvVolumeRatioConstant: true as const,
    claimBoundary: VENTRICULAR_ISOVOLUMIC_PRESSURE_TRANSFER_V3_CLAIM_BOUNDARY,
    nodes: Object.freeze(nodes),
    everyNodeEnergyConjugateMechanicsOwnerReplayed: true as const,
    everyPassiveAndSolverAcceptedRootStrictLocalMinimum: nodes.every((node) =>
      node.passiveRootPotentialStability.positiveDefinite
        && node.solverAcceptedRootPotentialStability.positiveDefinite),
    maximumAbsolutePressureReconstructionResidualPa,
    sourceToWallMappingUsesCanonicalPowerConjugateAdapter: true as const,
    wallWiseFreeGainAllowed: false as const,
    chamberPressureGainApplied: false as const,
    postMechanicsPressureMultiplier: 1 as const,
    solverContinuationStepCount: controlledActiveStressContinuationStepCount,
    everyRequestedControlledDeadLoadTargetReachedBySolver: nodes.every((node) =>
      node.requestedControlledDeadLoadTargetReachedBySolver),
    minimumSolverAcceptedControlledStressFractionLowerBracketEndpoint: Math.min(
      ...nodes.map((node) =>
        node.solverAcceptedControlledStressFractionLowerBracketEndpoint),
    ),
    passiveOwner:
      "same-klotz-scaled-equilibrium-energy-prior-used-by-mechanistic-runtime" as const,
    bendingOwner:
      "same-fixed-koiter-prior-used-by-mechanistic-runtime" as const,
    activeInputMeaning:
      "controlled-land-source-nominal-stress-label-mapped-on-passive-root-not-tref-or-predicted-twitch" as const,
    activeStressControlRule:
      "map-source-nominal-stress-at-passive-isovolumic-root-then-hold-wall-kirchhoff-dead-load-fixed-during-solver-root" as const,
    slsOverstressIncluded: false as const,
    pericardialPressureIncluded: false as const,
    diagnosticOnly: true as const,
    physiologicalValidationClaimed: false as const,
  });
}

function solveTriSegEquilibrium(input: Readonly<{
  walls: WallRecord<PublishedTriSegWallGeometryParametersV1>;
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  initialCoordinates: PhaseB0TriSegCoordinatesV1;
  evaluateStress: (geometry: PublishedTriSegGeometryV1) => WallRecord<number>;
}>): PhaseB0PublishedTriSegRootSuccessV1 {
  const initialGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    septalMidwallCapVolumeM3:
      input.initialCoordinates.septalMidwallCapVolumeM3,
    junctionRadiusM: input.initialCoordinates.junctionRadiusM,
    walls: input.walls,
  });
  const initialStress = input.evaluateStress(initialGeometry);
  const representativeTensionScaleNPerM = Math.max(
    ...WALL_IDS.map((wallId) => {
      const wall = initialGeometry.walls[wallId];
      return Math.abs(initialStress[wallId])
        * wall.parameters.wallMaterialVolumeM3
        / (2 * wall.midwallAreaM2);
    }),
    1e-6,
  );
  const result = solvePhaseB0PublishedTriSegRootV1({
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    walls: input.walls,
    initialCoordinates: input.initialCoordinates,
    evaluateWallStress: (geometry) => Object.freeze({
      fiberKirchhoffStressPa: input.evaluateStress(geometry),
    }),
    unknownScales: Object.freeze({
      septalMidwallCapVolumeM3: Math.max(
        Math.abs(input.initialCoordinates.septalMidwallCapVolumeM3),
        20e-6,
      ),
      junctionRadiusM: Math.max(
        input.initialCoordinates.junctionRadiusM,
        0.02,
      ),
    }),
    equilibriumResidualScaleNPerM: representativeTensionScaleNPerM,
    junctionRadiusLowerBoundM: 1e-5,
    algorithmicJacobianScaledStep: 2 ** -18,
  });
  if (result.converged === false) {
    throw new Error(
      `ventricular structural TriSeg root failed: ${result.reason}: ${result.message}`,
    );
  }
  return result;
}

function validateAnatomyInput(input: VentricularStructuralAnatomyInputV2): void {
  assertExactPlainRecordV1(
    input,
    [
      "wallMaterialVolumeM3ByWall",
      "loadedGeometryAnchor",
      "targetFiberStretchAtAnchorByWall",
      "provenanceId",
    ],
    "ventricular structural anatomy input",
  );
  assertWallRecord(input.wallMaterialVolumeM3ByWall, "wallMaterialVolumeM3ByWall");
  assertWallRecord(
    input.targetFiberStretchAtAnchorByWall,
    "targetFiberStretchAtAnchorByWall",
  );
  WALL_IDS.forEach((wallId) => {
    requirePositiveFinite(
      input.wallMaterialVolumeM3ByWall[wallId],
      `${wallId}.wallMaterialVolumeM3`,
    );
    requirePositiveFinite(
      input.targetFiberStretchAtAnchorByWall[wallId],
      `${wallId}.targetFiberStretchAtAnchor`,
    );
  });
  if (typeof input.provenanceId !== "string" || input.provenanceId.trim() === "") {
    throw new Error("provenanceId must be non-empty");
  }
  validateLoadedGeometryAnchor(input.loadedGeometryAnchor);
}

function validateLoadedGeometryAnchor(anchor: VentricularLoadedGeometryAnchorV2): void {
  assertExactPlainRecordV1(
    anchor,
    [
      "leftVentricularCavityVolumeM3",
      "rightVentricularCavityVolumeM3",
      "coordinates",
    ],
    "ventricular loaded geometry anchor",
  );
  assertExactPlainRecordV1(
    anchor.coordinates,
    ["septalMidwallCapVolumeM3", "junctionRadiusM"],
    "ventricular loaded geometry anchor coordinates",
  );
  requirePositiveFinite(
    anchor.leftVentricularCavityVolumeM3,
    "anchor.leftVentricularCavityVolumeM3",
  );
  requirePositiveFinite(
    anchor.rightVentricularCavityVolumeM3,
    "anchor.rightVentricularCavityVolumeM3",
  );
  requireFinite(
    anchor.coordinates.septalMidwallCapVolumeM3,
    "anchor.coordinates.septalMidwallCapVolumeM3",
  );
  requirePositiveFinite(
    anchor.coordinates.junctionRadiusM,
    "anchor.coordinates.junctionRadiusM",
  );
}

function freezeLoadedGeometryAnchor(
  anchor: VentricularLoadedGeometryAnchorV2,
): VentricularLoadedGeometryAnchorV2 {
  return Object.freeze({
    leftVentricularCavityVolumeM3: anchor.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: anchor.rightVentricularCavityVolumeM3,
    coordinates: Object.freeze({ ...anchor.coordinates }),
  });
}

function validateInflationPoint(point: VentricularPassiveInflationPointV2): void {
  assertExactPlainRecordV1(
    point,
    [
      "leftVentricularCavityVolumeM3",
      "rightVentricularCavityVolumeM3",
      "targetLeftVentricularPressurePa",
    ],
    "ventricular passive inflation point",
  );
  requirePositiveFinite(
    point.leftVentricularCavityVolumeM3,
    "inflationPoint.leftVentricularCavityVolumeM3",
  );
  requirePositiveFinite(
    point.rightVentricularCavityVolumeM3,
    "inflationPoint.rightVentricularCavityVolumeM3",
  );
  requirePositiveFinite(
    point.targetLeftVentricularPressurePa,
    "inflationPoint.targetLeftVentricularPressurePa",
  );
}

function assertStructuralAnatomy(
  anatomy: VentricularStructuralAnatomyV2,
): void {
  if (
    !VENTRICULAR_STRUCTURAL_ANATOMIES_V2.has(anatomy)
    || anatomy.calibrationId !== VENTRICULAR_STRUCTURAL_CALIBRATION_V2_ID
    || anatomy.acuteBeatWallRemodelingAllowed !== false
    || anatomy.referenceAreasAreLoadedCavityAreas !== false
    || anatomy.referenceAreasAreConstitutiveMaterialReferences !== true
    || anatomy.stressFreeUnloadedCoupledGeometryEstablished !== false
    || anatomy.physiologicalValidationClaimed !== false
  ) {
    throw new Error("invalid ventricular structural anatomy v2 boundary");
  }
}

function assertWallRecord(value: unknown, label: string): asserts value is WallRecord<number> {
  assertExactPlainRecordV1(value, WALL_IDS, label);
}

function wallRecord<T>(
  build: (wallId: PublishedTriSegWallIdV1) => T,
): WallRecord<T> {
  return Object.freeze({
    LVFW: build("LVFW"),
    SEP: build("SEP"),
    RVFW: build("RVFW"),
  });
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and > 0`);
  }
  return value;
}

function requireNonNegativeFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and >= 0`);
  }
  return value;
}
