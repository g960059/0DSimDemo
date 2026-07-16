import {
  KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1,
  TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1,
  TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1,
  createPooledCmrVentricularBsaAnchorV1,
  evaluateKlotz2006NormalizedEdpvrTargetV1,
  invertKlotz2006SinglePointEdpvrV1,
  partitionCmrVentricularMassToTriSegWallsV1,
  type KlotzSinglePointEdpvrInversionV1,
  type PooledCmrVentricularBsaAnchorV1,
  type TriSegWallMassAndVolumePartitionV1,
} from "@/engine/myocardium/fourChamberV1/anatomy/ventricularAnatomyEdpvrTargetsV1";
import {
  PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  buildVentricularStructuralAnatomyV2,
  fitSharedVentricularPassiveEnergyScaleV2,
  type VentricularPassiveScaleFitV2,
  type VentricularStructuralAnatomyV2,
} from "@/engine/myocardium/fourChamberV1/calibration/ventricularStructuralCalibrationV2";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  createFiniteThicknessTriSegBendingPriorV2,
  type FiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";

export const NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_ID =
  "normal-adult-ventricular-mechanics-candidate-v2" as const;

export const NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY =
  Object.freeze({
    policyId: "normal-adult-ventricular-mechanics-candidate-policy-v2",
    anatomySource: "pooled-cmr-bsa-scaled-center" as const,
    septalMassOwnership: "cmr-lv-mass-partitioned-septum-counted-once" as const,
    loadedCoordinateSeed: "published-triseg-2009-table-1" as const,
    homeostaticEndDiastolicFiberStretch: 1.1,
    homeostaticStretchEvidenceStatus:
      "predeclared-construction-prior-not-direct-human-measurement" as const,
    homeostaticStretchRationale:
      "interior point of the declared isolated-Land stretch domain; reference area is inferred, never fit to a loop shape" as const,
    klotzPureTensionInflationFractionsOfEndDiastolicVolume: Object.freeze([
      115 / 144.4,
      130 / 144.4,
      1,
      165 / 144.4,
    ] as const),
    preAConstructionLeftVentricularPressureMmHg: 5,
    preARightVentricularPressureRule:
      "runtime-energy-triseg-prediction-on-proportional-biventricular-klotz-path" as const,
    passiveFitRightVentricularBoundaryRule:
      "simultaneous-proportional-loaded-volume-path-construction-prior-not-klotz-source" as const,
    scalarFitInterpretation:
      "bracketed-klotz-ed-anchor-root-with-runtime-energy-path-and-held-out-multipoint-replay" as const,
    activeStressUsedForPassiveFit: false as const,
    slsUsedForPassiveFit: false as const,
    pericardiumUsedForPassiveFit: false as const,
    effectiveBendingYoungModulusPa: 3_000,
    bendingPoissonRatio: 0.45,
    bendingModulusFitTarget: "none-predeclared-log-midpoint-sensitivity-center" as const,
    pvLoopShapeUsedForFit: false as const,
    acuteBeatAnatomyChangeAllowed: false as const,
    physiologicalValidationClaimed: false as const,
  } as const);

export type NormalAdultVentricularMechanicsCandidateInputV2 = Readonly<{
  bodySurfaceAreaM2: number;
  leftVentricularEndDiastolicPressurePa: number;
}>;

export type NormalAdultVentricularMechanicsCandidateV2 = Readonly<{
  candidateId: typeof NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_ID;
  input: NormalAdultVentricularMechanicsCandidateInputV2;
  cmrAnchor: PooledCmrVentricularBsaAnchorV1;
  wallPartition: TriSegWallMassAndVolumePartitionV1;
  anatomy: VentricularStructuralAnatomyV2;
  klotzInversion: KlotzSinglePointEdpvrInversionV1;
  passiveFit: VentricularPassiveScaleFitV2;
  preAPassiveConstruction: Readonly<{
    leftVentricularTargetPressurePa: number;
    leftVentricularCavityVolumeM3: number;
    rightVentricularCavityVolumeM3: number;
    fittedLeftVentricularPressurePa: number;
    predictedRightVentricularPressurePa: number;
    rightVentricularPressureSource:
      "runtime-energy-triseg-prediction-not-an-rv-klotz-target";
    usedToIdentifySharedTensileScale: false;
    pvLoopMorphologyUsed: false;
  }>;
  finiteThicknessBendingPrior: FiniteThicknessTriSegBendingPriorV2;
  audit: Readonly<{
    septumCountedExactlyOnce: true;
    referenceAreaDerivedFromLoadedGeometryAndStretch: true;
    tensileScaleAppliedToEnergyStressAndTangent: true;
    compressionScaleIdentifiedByKlotz: false;
    slsScaleIdentifiedByKlotz: false;
    bendingScaleIdentifiedByKlotzOrPvLoop: false;
    fixedBendingPriorIncludedInPassiveScaleRoot: true;
    runtimeEnergyConjugatePassiveFitReplayed: true;
    everyPassiveReplayNodeStrictLocalPotentialMinimum: true;
    publishedTaylorUsedForPassiveFitPressureOrRoot: false;
    publishedTaylorRuntimeOwner: false;
    chamberPressureGainApplied: false;
    wallWiseMaterialScaleApplied: false;
    preARightVentricularPressurePredictedByRuntimeEnergyPath: true;
    pvLoopShapeUsedForFit: false;
    acuteBeatAnatomyChangeAllowed: false;
    physiologicalValidationClaimed: false;
    pass: true;
  }>;
}>;

/**
 * Constructs one auditable normal-adult structural candidate.  The only
 * patient-size input is BSA.  CMR supplies loaded cavity volumes and mass,
 * TriSeg's published seed supplies only the septal partition/coordinate prior,
 * and a Klotz EDPVR supplies a multi-point organ-level passive target.
 */
export function buildNormalAdultVentricularMechanicsCandidateV2(
  input: NormalAdultVentricularMechanicsCandidateInputV2,
): NormalAdultVentricularMechanicsCandidateV2 {
  assertExactPlainRecordV1(
    input,
    ["bodySurfaceAreaM2", "leftVentricularEndDiastolicPressurePa"],
    "normal-adult ventricular mechanics candidate input",
  );
  const bodySurfaceAreaM2 = requirePositiveFinite(
    input.bodySurfaceAreaM2,
    "bodySurfaceAreaM2",
  );
  const leftVentricularEndDiastolicPressurePa = requirePositiveFinite(
    input.leftVentricularEndDiastolicPressurePa,
    "leftVentricularEndDiastolicPressurePa",
  );
  const frozenInput = Object.freeze({
    bodySurfaceAreaM2,
    leftVentricularEndDiastolicPressurePa,
  });
  const cmrAnchor = createPooledCmrVentricularBsaAnchorV1(bodySurfaceAreaM2);
  const wallPartition = partitionCmrVentricularMassToTriSegWallsV1({
    leftVentricularMassIncludingSeptumKg:
      cmrAnchor.leftVentricle.myocardialMassIncludingSeptumKg.center,
    rightVentricularFreeWallMassKg:
      cmrAnchor.rightVentricle.myocardialMassKg.center,
    septalFractionOfLeftVentricularMass:
      TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1
        .septalFractionOfCmrLeftVentricularMass,
    partitionPriorId:
      TRISEG_2009_INITIALIZATION_LV_SEPTAL_PARTITION_PRIOR_V1.partitionPriorId,
  });
  const seed = TRISEG_2009_ORIGINAL_INITIALIZATION_SEED_SI_V1;
  const anatomy = buildVentricularStructuralAnatomyV2({
    wallMaterialVolumeM3ByWall: wallPartition.wallMaterialVolumeM3,
    loadedGeometryAnchor: {
      leftVentricularCavityVolumeM3:
        cmrAnchor.leftVentricle.endDiastolicVolumeM3.center,
      rightVentricularCavityVolumeM3:
        cmrAnchor.rightVentricle.endDiastolicVolumeM3.center,
      coordinates: {
        septalMidwallCapVolumeM3:
          seed.coordinates.septalMidwallCapVolumeM3,
        junctionRadiusM: seed.coordinates.junctionRadiusM,
      },
    },
    targetFiberStretchAtAnchorByWall: {
      LVFW: NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .homeostaticEndDiastolicFiberStretch,
      SEP: NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .homeostaticEndDiastolicFiberStretch,
      RVFW: NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .homeostaticEndDiastolicFiberStretch,
    },
    provenanceId:
      `${NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_ID}:cmr-triseg-klotz`,
  });
  const klotzInversion = invertKlotz2006SinglePointEdpvrV1({
    measuredEndDiastolicVolumeM3:
      anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3,
    measuredEndDiastolicPressurePa:
      leftVentricularEndDiastolicPressurePa,
  });
  const rvToLvLoadedVolumeRatio =
    anatomy.loadedGeometryAnchor.rightVentricularCavityVolumeM3
    / anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3;
  const finiteThicknessBendingPrior = createFiniteThicknessTriSegBendingPriorV2({
    priorId: `${NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_ID}:cmr-moment-free-koiter-v2`,
    effectiveBendingYoungModulusPa:
      NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .effectiveBendingYoungModulusPa,
    poissonRatio:
      NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .bendingPoissonRatio,
    referenceGeometry: anatomy.replayGeometry,
    wallBendingMultiplierByWall: { LVFW: 1, SEP: 1, RVFW: 1 },
  });
  const preALeftVentricularTargetPressurePa =
    NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
      .preAConstructionLeftVentricularPressureMmHg * 133.322387415;
  const normalizedPreAVolume = Math.pow(
    preALeftVentricularTargetPressurePa
      / KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1.normalizedPressureScalePa,
    1 / KLOTZ_2006_NORMALIZED_EDPVR_TARGET_SI_V1.normalizedExponent,
  );
  const preALeftVentricularCavityVolumeM3 =
    klotzInversion.estimatedZeroPressureVolumeM3
    + normalizedPreAVolume * klotzInversion.normalizationVolumeSpanM3;
  const declaredInflationVolumesM3 = [
    ...NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
      .klotzPureTensionInflationFractionsOfEndDiastolicVolume.map((fraction) =>
        fraction * anatomy.loadedGeometryAnchor.leftVentricularCavityVolumeM3),
    preALeftVentricularCavityVolumeM3,
  ].sort((left, right) => left - right);
  const passiveFit = fitSharedVentricularPassiveEnergyScaleV2({
    anatomy,
    basePassivePrior: PHASE_A1_VENTRICULAR_EFFECTIVE_ONE_FIBER_PASSIVE_PRIOR_V1,
    bendingPrior: finiteThicknessBendingPrior,
    loadingPathProvenanceId:
      "cmr-center-rv-to-lv-loaded-volume-ratio-held-over-inflation-path-v2",
    inflationPoints: declaredInflationVolumesM3.map(
      (leftVentricularCavityVolumeM3) => Object.freeze({
        leftVentricularCavityVolumeM3,
        rightVentricularCavityVolumeM3:
          rvToLvLoadedVolumeRatio * leftVentricularCavityVolumeM3,
        targetLeftVentricularPressurePa:
          evaluateKlotz2006NormalizedEdpvrTargetV1(
            leftVentricularCavityVolumeM3,
            klotzInversion,
          ).pressurePa,
      }),
    ),
  });
  const preANode = passiveFit.nodes.find((node) => Math.abs(
    node.leftVentricularCavityVolumeM3 - preALeftVentricularCavityVolumeM3,
  ) <= 1e-12 * preALeftVentricularCavityVolumeM3);
  if (preANode === undefined) {
    throw new Error("ventricular passive replay omitted the declared pre-A node");
  }
  const preAPassiveConstruction = Object.freeze({
    leftVentricularTargetPressurePa: preALeftVentricularTargetPressurePa,
    leftVentricularCavityVolumeM3: preANode.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: preANode.rightVentricularCavityVolumeM3,
    fittedLeftVentricularPressurePa: preANode.fittedLeftVentricularPressurePa,
    predictedRightVentricularPressurePa:
      preANode.fittedRightVentricularPressurePa,
    rightVentricularPressureSource:
      "runtime-energy-triseg-prediction-not-an-rv-klotz-target" as const,
    usedToIdentifySharedTensileScale: false as const,
    pvLoopMorphologyUsed: false as const,
  });
  if (
    !wallPartition.audit.septumCountedExactlyOnce
    || !passiveFit.everyNodeWithinPublishedTaylorTwoPercentTensionErrorDomain
    || passiveFit.landActiveStressIncluded
    || passiveFit.slsOverstressIncluded
    || !passiveFit.everyNodeOnPureTensionBranch
    || passiveFit.compressionScaleIdentified
    || passiveFit.slsScaleIdentified
    || passiveFit.pericardialPressureIncluded
    || passiveFit.chamberPressureGainApplied
    || !passiveFit.everyNodeRuntimeEnergyConjugateRootReplayed
    || !passiveFit.everyNodeStrictLocalPotentialMinimum
    || passiveFit.publishedTaylorUsedForPressureOrRoot
    || Math.abs(
      preAPassiveConstruction.fittedLeftVentricularPressurePa
        - preAPassiveConstruction.leftVentricularTargetPressurePa,
    ) > 2.5 * 133.322387415
    || !(preAPassiveConstruction.predictedRightVentricularPressurePa > 0)
    || finiteThicknessBendingPrior.effectiveBendingYoungModulusPa
      !== NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_POLICY
        .effectiveBendingYoungModulusPa
    || finiteThicknessBendingPrior.modulusIdentificationBoundary
      !== "not-identified-from-edpvr-or-pv-loop-morphology"
  ) {
    throw new Error("normal-adult ventricular mechanics construction audit failed");
  }
  return Object.freeze({
    candidateId: NORMAL_ADULT_VENTRICULAR_MECHANICS_CANDIDATE_V2_ID,
    input: frozenInput,
    cmrAnchor,
    wallPartition,
    anatomy,
    klotzInversion,
    passiveFit,
    preAPassiveConstruction,
    finiteThicknessBendingPrior,
    audit: Object.freeze({
      septumCountedExactlyOnce: true as const,
      referenceAreaDerivedFromLoadedGeometryAndStretch: true as const,
      tensileScaleAppliedToEnergyStressAndTangent: true as const,
      compressionScaleIdentifiedByKlotz: false as const,
      slsScaleIdentifiedByKlotz: false as const,
      bendingScaleIdentifiedByKlotzOrPvLoop: false as const,
      fixedBendingPriorIncludedInPassiveScaleRoot: true as const,
      runtimeEnergyConjugatePassiveFitReplayed: true as const,
      everyPassiveReplayNodeStrictLocalPotentialMinimum: true as const,
      publishedTaylorUsedForPassiveFitPressureOrRoot: false as const,
      publishedTaylorRuntimeOwner: false as const,
      chamberPressureGainApplied: false as const,
      wallWiseMaterialScaleApplied: false as const,
      preARightVentricularPressurePredictedByRuntimeEnergyPath: true as const,
      pvLoopShapeUsedForFit: false as const,
      acuteBeatAnatomyChangeAllowed: false as const,
      physiologicalValidationClaimed: false as const,
      pass: true as const,
    }),
  });
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and positive`);
  }
  return value;
}
