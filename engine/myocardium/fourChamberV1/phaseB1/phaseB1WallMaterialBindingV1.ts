import {
  compilePhaseA1LandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import type {
  ExactEventCalciumParametersV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  bindPhaseA1PassiveSlsFromTissueManifestV1,
  type PhaseA1ManifestBoundPassiveSlsV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";
import {
  compileEquilibriumPassivePriorV1,
  type CompiledEquilibriumPassivePriorV1,
} from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  type CompiledOneStateAlphaVSlsV1,
} from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  assertVentricularPassiveScaleFitV2,
  type VentricularPassiveScaleFitV2,
} from "@/engine/myocardium/fourChamberV1/calibration/ventricularStructuralCalibrationV2";
import {
  assertNormalAdultAtrialMechanicsCandidateV3,
  type NormalAdultAtrialMechanicsCandidateV3,
} from "@/engine/myocardium/fourChamberV1/calibration/normalAdultAtrialMechanicsCandidateV3";
import type {
  CompiledMoyer2015AtrialEquibiaxialPassiveV3,
} from "@/engine/myocardium/fourChamberV1/passive/moyer2015AtrialEquibiaxialPassiveV3";
import {
  NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID,
  NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildNormalAdultAtrialActiveLandParameterSetV1,
  normalAdultActiveTissueClassPriorAuditHashPayloadV1,
  type NormalAdultActiveTissueClassPriorAuditV1,
} from "@/engine/myocardium/fourChamberV1/land/normalAdultActiveTissueClassPriorV1";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  validatePhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  WALL_IDS,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
  LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const PHASE_B1_WALL_MATERIAL_BINDING_V1_ID =
  "four-chamber-phase-b1-wall-material-binding-v1" as const;
export const PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-passive-sls-binding-v2" as const;
export const PHASE_B1_MECHANISTIC_REBUILD_ATRIAL_PASSIVE_SLS_BINDING_V3_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-atrial-passive-sls-binding-v3" as const;
export const PHASE_B1_MECHANISTIC_REBUILD_ACTIVE_TISSUE_CLASS_BINDING_V4_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-active-tissue-class-binding-v4" as const;
export const PHASE_B1_MECHANISTIC_REBUILD_VENTRICULAR_CALCIUM_ABLATION_BINDING_V5_ID =
  "four-chamber-phase-b1-mechanistic-rebuild-ventricular-calcium-ablation-binding-v5" as const;

const PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND: unique symbol =
  Symbol("PhaseB1WallRuntimeMaterialV1");
const PHASE_B1_WALL_RUNTIME_MATERIALS_V1 = new WeakSet<object>();
const PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND: unique symbol =
  Symbol("PhaseB1WallMaterialBindingV1");
const PHASE_B1_WALL_MATERIAL_BINDINGS_V1 = new WeakSet<object>();

export type PhaseB1WallTissueClassV1 = "atrial" | "ventricular";

export type PhaseB1WallMaterialDescriptorV1 = Readonly<{
  wallId: FourChamberWallId;
  tissueClass: PhaseB1WallTissueClassV1;
  tissueManifestSha256: string;
  targetPackSha256: string;
  landParameterSetId: string;
  landParameterSetStableHash: string;
  prescribedCalciumEvidenceId: string;
  passivePriorId: string;
  slsPriorId: string;
  lambdaLandSlack: number;
  orientationRuleId: string;
  chiOrient: 1;
  fViable: number;
  passiveCalibration?: Readonly<{
    calibrationId: string;
    sharedTensileEnergyScale: number;
    inflationPointCount: number;
    rootMeanSquarePressureErrorPa: number;
    tensileEnergyStressAndTangentScaledTogether: true;
    compressionScaleIdentifiedByKlotz: false;
    slsScaleIdentifiedByKlotz: false;
    passivePriorId: string;
    structuralAnatomyProvenanceId: string;
    loadingPathProvenanceId: string;
    equilibriumTensileScaleEvidence: "klotz-informed";
    compressionPriorEvidence: "unchanged-independent-phase-a1-prior";
    slsPriorEvidence: "unchanged-independent-phase-a1-prior";
  }>;
  atrialPassiveConstruction?: Readonly<{
    constructionModel: "moyer-equibiaxial-inverse-unloading-v3";
    candidateId: string;
    anatomyAnchorId: string;
    passivePriorId: string;
    isotropicC1Pa: number;
    isotropicC2Pa: number;
    fiberC3Pa: number;
    fiberC4: number;
    unloadedReferenceCavityVolumeM3ByAtrium: Readonly<Record<"LA" | "RA", number>>;
    loadedMinimumFiberLogPrestrainByAtrium: Readonly<Record<"LA" | "RA", number>>;
    minimumPressureUsedForInverseUnloadingByAtrium: Readonly<Record<"LA" | "RA", number>>;
    sameHumanMaterialAppliedToLaAndRa: true;
    chamberPressureGainApplied: false;
    additiveResidualStressApplied: false;
    pvLoopMorphologyUsedForFit: false;
  }>;
  atrialActiveConstruction?: Readonly<{
    constructionModel:
      "primary-human-la-active-force-amplitude-anchored-shared-atrial-tissue-class-candidate-prior";
    priorId: typeof NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID;
    priorContentSha256: string;
    parameterSetId: string;
    parameterSetStableHash: string;
    leftAtrialForceScaleSourceDoi: "10.1016/j.yjmcc.2025.12.001";
    targetSaturatedActiveStressPa: 11600;
    saturationPca: 4.5;
    replayedSaturationFactor: number;
    mappedTrefPa: number;
    sameParameterObjectAppliedToLaAndRa: true;
    rightAtriumIsLaDerivedTissueClassExtrapolation: true;
    chamberSpecificActiveGainApplied: false;
    moyerTmaxUsedAsLandTref: false;
    pvLoopMorphologyUsedForFit: false;
    kineticsClaim:
      "published-atrial-timing-informed-surrogate-not-experimentally-identified-human-atrial-land-kinetics";
  }>;
}>;

export type PhaseB1MechanisticRebuildPassiveSlsBindingV2 = Readonly<{
  bindingId: typeof PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID;
  tissueClass: "ventricular";
  tissueManifestSha256: string;
  tissueBundleSha256: string;
  targetPackSha256: string;
  completeParameterParity: false;
  compiledPassive: CompiledEquilibriumPassivePriorV1;
  compiledSls: CompiledOneStateAlphaVSlsV1;
  calibration: Readonly<{
    calibrationId: string;
    sharedTensileEnergyScale: number;
    inflationPointCount: number;
    rootMeanSquarePressureErrorPa: number;
    tensileEnergyStressAndTangentScaledTogether: true;
    compressionScaleIdentifiedByKlotz: false;
    slsScaleIdentifiedByKlotz: false;
    chamberPressureGainApplied: false;
    wallWiseScaleApplied: false;
    passivePriorId: string;
    structuralAnatomyProvenanceId: string;
    loadingPathProvenanceId: string;
    equilibriumTensileScaleEvidence: "klotz-informed";
    compressionPriorEvidence: "unchanged-independent-phase-a1-prior";
    slsPriorEvidence: "unchanged-independent-phase-a1-prior";
  }>;
  candidatePrior: true;
  closedLoopReleaseEligible: false;
}>;

export type PhaseB1MechanisticRebuildAtrialPassiveSlsBindingV3 = Readonly<{
  bindingId:
    typeof PHASE_B1_MECHANISTIC_REBUILD_ATRIAL_PASSIVE_SLS_BINDING_V3_ID;
  tissueClass: "atrial";
  tissueManifestSha256: string;
  tissueBundleSha256: string;
  targetPackSha256: string;
  completeParameterParity: false;
  compiledPassive: CompiledMoyer2015AtrialEquibiaxialPassiveV3;
  compiledSls: CompiledOneStateAlphaVSlsV1;
  atrialConstruction: Extract<
    NonNullable<PhaseB1WallMaterialDescriptorV1["atrialPassiveConstruction"]>,
    { constructionModel: "moyer-equibiaxial-inverse-unloading-v3" }
  >;
  candidatePrior: true;
  closedLoopReleaseEligible: false;
}>;

export type PhaseB1PassiveSlsRuntimeBindingV1 =
  | PhaseA1ManifestBoundPassiveSlsV1
  | PhaseB1MechanisticRebuildPassiveSlsBindingV2
  | PhaseB1MechanisticRebuildAtrialPassiveSlsBindingV3;

export type PhaseB1WallMaterialBindingDescriptorV1 = Readonly<{
  bindingId: typeof PHASE_B1_WALL_MATERIAL_BINDING_V1_ID;
  status: "candidate-prior-component-binding-not-phase-b1-acceptance";
  phaseA1TissueManifestBundleSha256: string;
  wallOrder: typeof WALL_IDS;
  wallBindings: readonly PhaseB1WallMaterialDescriptorV1[];
  atrialWalls: readonly ["LA", "RA"];
  ventricularWalls: readonly ["LVFW", "SEP", "RVFW"];
  activeModel: "Land-2017-active-only-rate-free-xi";
  passiveOwner: "independent-equilibrium-passive-plus-optional-one-state-SLS";
  wallWiseFreeGainAllowed: false;
  pvLoopShapeFittingAllowed: false;
  physiologicalValidationClaimed: false;
  phaseB1AcceptanceClaimed: false;
}>;

export type PhaseB1WallRuntimeMaterialV1 = Readonly<{
  [PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND]: true;
  wallId: FourChamberWallId;
  tissueClass: PhaseB1WallTissueClassV1;
  landEquationParameters: Land2017SourceParameterSet;
  prescribedCalciumParameters: Readonly<ExactEventCalciumParametersV1>;
  passiveSls: PhaseB1PassiveSlsRuntimeBindingV1;
  landWallAdapterContext: LandWallAdapterContextV1;
}>;

export type PhaseB1WallMaterialBindingV1 = Readonly<{
  [PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND]: true;
  descriptor: PhaseB1WallMaterialBindingDescriptorV1;
  contentSha256: string;
  runtimeByWall: Readonly<Record<FourChamberWallId, PhaseB1WallRuntimeMaterialV1>>;
}>;

export type PhaseB1ExponentialWallRuntimeMaterialV1 = Readonly<
  Omit<PhaseB1WallRuntimeMaterialV1, "passiveSls"> & {
    passiveSls: Exclude<
      PhaseB1PassiveSlsRuntimeBindingV1,
      PhaseB1MechanisticRebuildAtrialPassiveSlsBindingV3
    >;
  }
>;

export type PhaseB1ExponentialWallMaterialBindingV1 = Readonly<
  Omit<PhaseB1WallMaterialBindingV1, "runtimeByWall"> & {
    runtimeByWall: Readonly<Record<
      FourChamberWallId,
      PhaseB1ExponentialWallRuntimeMaterialV1
    >>;
  }
>;

export function buildPhaseB1WallMaterialBindingV1(
  bundle: PhaseA1TissueManifestBundleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ExponentialWallMaterialBindingV1 {
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_SOURCE_PARAMETER_SET,
    sha256Hex,
    null,
    null,
    null,
    false,
  ) as PhaseB1ExponentialWallMaterialBindingV1;
}

/**
 * Mechanistic-rebuild variant: identical material schema, prescribed calcium,
 * passive/SLS ownership, and atrial material, with the ventricular Land Tref
 * selected from the explicit 120 kPa whole-organ source column.  This is a
 * model alternative, not a wall-wise gain or a mutation of the v1 source set.
 */
export function buildPhaseB1WholeOrganVentricularWallMaterialBindingV2(
  bundle: PhaseA1TissueManifestBundleV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ExponentialWallMaterialBindingV1 {
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    sha256Hex,
    null,
    null,
    null,
    false,
  ) as PhaseB1ExponentialWallMaterialBindingV1;
}

/**
 * Full ventricular material alternative used by the structural rebuild.  The
 * Klotz-derived multiplier is identified only on the pure-tension inflation
 * branch and therefore scales only that branch's energy, stress, and tangent.
 * Compression and the independent SLS element retain their Phase A1 priors;
 * neither is identifiable from an equilibrium EDPVR.  No multiplier is
 * applied to chamber pressure, and the tensile scale is shared by
 * LVFW/SEP/RVFW.
 */
export function buildPhaseB1MechanisticRebuildWallMaterialBindingV2(
  bundle: PhaseA1TissueManifestBundleV1,
  passiveCalibration: VentricularPassiveScaleFitV2,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1ExponentialWallMaterialBindingV1 {
  assertVentricularPassiveScaleFitV2(passiveCalibration);
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    sha256Hex,
    passiveCalibration,
    null,
    null,
    false,
  ) as PhaseB1ExponentialWallMaterialBindingV1;
}

/**
 * Loaded-reference atrial alternative. The atria use the exact equibiaxial
 * reduction of the Moyer human LA passive law and chamber-specific inverse
 * unloading. The independent Phase A1 SLS remains unchanged.
 */
export function buildPhaseB1FullMechanisticRebuildWallMaterialBindingV3(
  bundle: PhaseA1TissueManifestBundleV1,
  passiveCalibration: VentricularPassiveScaleFitV2,
  atrialCandidate: NormalAdultAtrialMechanicsCandidateV3,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1WallMaterialBindingV1 {
  assertVentricularPassiveScaleFitV2(passiveCalibration);
  assertNormalAdultAtrialMechanicsCandidateV3(atrialCandidate);
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    sha256Hex,
    passiveCalibration,
    atrialCandidate,
    null,
    false,
  );
}

/**
 * Active-tissue-class alternative used by the mechanistic rebuild.  The
 * atria share one LA-tissue-anchored Land amplitude and one calcium candidate;
 * the ventricles retain one shared 120 kPa Land material and their legacy
 * prescribed-calcium forcing so the atrial causal change remains isolated.
 * No chamber-specific active gain or PV-loop observable participates in this
 * construction.
 */
export function buildPhaseB1MechanisticRebuildWallMaterialBindingV4(
  bundle: PhaseA1TissueManifestBundleV1,
  passiveCalibration: VentricularPassiveScaleFitV2,
  atrialCandidate: NormalAdultAtrialMechanicsCandidateV3,
  activeTissueClassPrior: NormalAdultActiveTissueClassPriorAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1WallMaterialBindingV1 {
  assertVentricularPassiveScaleFitV2(passiveCalibration);
  assertNormalAdultAtrialMechanicsCandidateV3(atrialCandidate);
  assertNormalAdultActiveTissueClassPriorForBindingV1(
    activeTissueClassPrior,
    sha256Hex,
  );
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    sha256Hex,
    passiveCalibration,
    atrialCandidate,
    activeTissueClassPrior,
    false,
  );
}

/**
 * Causal ablation of V4.  It changes only the ventricular prescribed-calcium
 * reconstruction relative to V4.  Because that two-exponential candidate does
 * not reproduce the published RT90 context, this builder is deliberately not
 * the canonical normal-adult case.
 */
export function buildPhaseB1MechanisticRebuildVentricularCalciumAblationBindingV5(
  bundle: PhaseA1TissueManifestBundleV1,
  passiveCalibration: VentricularPassiveScaleFitV2,
  atrialCandidate: NormalAdultAtrialMechanicsCandidateV3,
  activeTissueClassPrior: NormalAdultActiveTissueClassPriorAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1WallMaterialBindingV1 {
  assertVentricularPassiveScaleFitV2(passiveCalibration);
  assertNormalAdultAtrialMechanicsCandidateV3(atrialCandidate);
  assertNormalAdultActiveTissueClassPriorForBindingV1(
    activeTissueClassPrior,
    sha256Hex,
  );
  return buildPhaseB1WallMaterialBindingWithVentricularLand(
    bundle,
    LAND2017_INTACT_HUMAN_37C_WHOLE_ORGAN_PARAMETER_SET_V2,
    sha256Hex,
    passiveCalibration,
    atrialCandidate,
    activeTissueClassPrior,
    true,
  );
}

function buildPhaseB1WallMaterialBindingWithVentricularLand(
  bundle: PhaseA1TissueManifestBundleV1,
  ventricularLand: Land2017SourceParameterSet,
  sha256Hex: CanonicalSha256HexProvider,
  passiveCalibration: VentricularPassiveScaleFitV2 | null,
  atrialCandidate: NormalAdultAtrialMechanicsCandidateV3 | null,
  activeTissueClassPrior: NormalAdultActiveTissueClassPriorAuditV1 | null,
  useReconstructedVentricularCalcium: boolean,
): PhaseB1WallMaterialBindingV1 {
  validatePhaseA1TissueManifestBundleV1(bundle, sha256Hex);
  const atrialLand = activeTissueClassPrior === null
    ? buildAtrialHumanPriorLandEquationParametersV1()
    : buildNormalAdultAtrialActiveLandParameterSetV1();
  const atrialCalcium = activeTissueClassPrior === null
    ? ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1
    : NORMAL_ADULT_ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
  const ventricularCalcium = activeTissueClassPrior !== null
      && useReconstructedVentricularCalcium
    ? NORMAL_ADULT_VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1
    : VENTRICULAR_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1;
  if (
    activeTissueClassPrior !== null
    && (
      atrialLand.parameterSetStableHash
        !== activeTissueClassPrior.atrialClass.parameterSetStableHash
      || !Object.is(
        atrialLand.values.Tref,
        activeTissueClassPrior.atrialClass.saturationMapping.mappedTrefPa,
      )
    )
  ) {
    throw new Error(
      "active tissue-class prior and reconstructed atrial Land material disagree",
    );
  }
  const atrialPassiveSlsSource = bindPhaseA1PassiveSlsFromTissueManifestV1(
    bundle,
    "atrial",
    sha256Hex,
  );
  const atrialPassiveSls = atrialCandidate === null
    ? atrialPassiveSlsSource
    : buildMechanisticRebuildAtrialPassiveSlsBindingV3(
      atrialPassiveSlsSource,
      atrialCandidate,
    );
  const ventricularPassiveSlsSource = bindPhaseA1PassiveSlsFromTissueManifestV1(
    bundle,
    "ventricular",
    sha256Hex,
  );
  const ventricularPassiveSls = passiveCalibration === null
    ? ventricularPassiveSlsSource
    : buildMechanisticRebuildPassiveSlsBinding(
      ventricularPassiveSlsSource,
      passiveCalibration,
    );
  const atrialAdapter = compilePhaseA1LandWallAdapterContextV1(
    bundle,
    "atrial",
    sha256Hex,
  );
  const ventricularAdapter = compilePhaseA1LandWallAdapterContextV1(
    bundle,
    "ventricular",
    sha256Hex,
  );

  const runtimeEntries = WALL_IDS.map((wallId) => {
    const tissueClass = tissueClassForWall(wallId);
    const atrial = tissueClass === "atrial";
    const runtime: PhaseB1WallRuntimeMaterialV1 = {
      [PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND]: true,
      wallId,
      tissueClass,
      landEquationParameters: atrial ? atrialLand : ventricularLand,
      prescribedCalciumParameters: atrial
        ? atrialCalcium
        : ventricularCalcium,
      passiveSls: atrial ? atrialPassiveSls : ventricularPassiveSls,
      landWallAdapterContext: atrial ? atrialAdapter : ventricularAdapter,
    };
    PHASE_B1_WALL_RUNTIME_MATERIALS_V1.add(runtime);
    return [wallId, Object.freeze(runtime)] as const;
  });
  const runtimeByWall = Object.freeze(Object.fromEntries(runtimeEntries)) as
    Readonly<Record<FourChamberWallId, PhaseB1WallRuntimeMaterialV1>>;
  const atrialActiveConstructionDescriptor = activeTissueClassPrior === null
    ? null
    : Object.freeze({
      constructionModel:
        "primary-human-la-active-force-amplitude-anchored-shared-atrial-tissue-class-candidate-prior" as const,
      priorId: NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID,
      priorContentSha256: activeTissueClassPrior.contentSha256,
      parameterSetId: activeTissueClassPrior.atrialClass.parameterSetId,
      parameterSetStableHash:
        activeTissueClassPrior.atrialClass.parameterSetStableHash,
      leftAtrialForceScaleSourceDoi: "10.1016/j.yjmcc.2025.12.001" as const,
      targetSaturatedActiveStressPa: 11_600 as const,
      saturationPca: 4.5 as const,
      replayedSaturationFactor:
        activeTissueClassPrior.atrialClass.saturationMapping
          .replayedSaturationFactor,
      mappedTrefPa:
        activeTissueClassPrior.atrialClass.saturationMapping.mappedTrefPa,
      sameParameterObjectAppliedToLaAndRa: true as const,
      rightAtriumIsLaDerivedTissueClassExtrapolation: true as const,
      chamberSpecificActiveGainApplied: false as const,
      moyerTmaxUsedAsLandTref: false as const,
      pvLoopMorphologyUsedForFit: false as const,
      kineticsClaim:
        "published-atrial-timing-informed-surrogate-not-experimentally-identified-human-atrial-land-kinetics" as const,
    });
  const wallBindings = Object.freeze(WALL_IDS.map((wallId) => {
    const runtime = runtimeByWall[wallId];
    const passiveCalibrationDescriptor = "calibration" in runtime.passiveSls
      ? Object.freeze({
        calibrationId: runtime.passiveSls.calibration.calibrationId,
        sharedTensileEnergyScale:
          runtime.passiveSls.calibration.sharedTensileEnergyScale,
        inflationPointCount:
          runtime.passiveSls.calibration.inflationPointCount,
        rootMeanSquarePressureErrorPa:
          runtime.passiveSls.calibration.rootMeanSquarePressureErrorPa,
        tensileEnergyStressAndTangentScaledTogether: true as const,
        compressionScaleIdentifiedByKlotz: false as const,
        slsScaleIdentifiedByKlotz: false as const,
        passivePriorId: runtime.passiveSls.calibration.passivePriorId,
        structuralAnatomyProvenanceId:
          runtime.passiveSls.calibration.structuralAnatomyProvenanceId,
        loadingPathProvenanceId:
          runtime.passiveSls.calibration.loadingPathProvenanceId,
        equilibriumTensileScaleEvidence:
          runtime.passiveSls.calibration.equilibriumTensileScaleEvidence,
        compressionPriorEvidence:
          runtime.passiveSls.calibration.compressionPriorEvidence,
        slsPriorEvidence:
          runtime.passiveSls.calibration.slsPriorEvidence,
      })
      : null;
    const atrialPassiveConstructionDescriptor =
      "atrialConstruction" in runtime.passiveSls
        ? runtime.passiveSls.atrialConstruction
        : null;
    return Object.freeze({
      wallId,
      tissueClass: runtime.tissueClass,
      tissueManifestSha256: runtime.passiveSls.tissueManifestSha256,
      targetPackSha256: runtime.passiveSls.targetPackSha256,
      landParameterSetId: runtime.landEquationParameters.parameterSetId,
      landParameterSetStableHash:
        runtime.landEquationParameters.parameterSetStableHash,
      prescribedCalciumEvidenceId:
        runtime.prescribedCalciumParameters.evidenceId,
      passivePriorId: runtime.passiveSls.compiledPassive.prior.priorId,
      slsPriorId: runtime.passiveSls.compiledSls.prior.priorId,
      lambdaLandSlack: runtime.landWallAdapterContext.lambdaLandSlack,
      orientationRuleId: runtime.landWallAdapterContext.orientationRuleId,
      chiOrient: runtime.landWallAdapterContext.chiOrient,
      fViable: runtime.landWallAdapterContext.fViable,
      ...(passiveCalibrationDescriptor === null
        ? {}
        : { passiveCalibration: passiveCalibrationDescriptor }),
      ...(atrialPassiveConstructionDescriptor === null
        ? {}
        : { atrialPassiveConstruction: atrialPassiveConstructionDescriptor }),
      ...(runtime.tissueClass !== "atrial"
          || atrialActiveConstructionDescriptor === null
        ? {}
        : { atrialActiveConstruction: atrialActiveConstructionDescriptor }),
    });
  }));
  const descriptor: PhaseB1WallMaterialBindingDescriptorV1 = Object.freeze({
    bindingId: PHASE_B1_WALL_MATERIAL_BINDING_V1_ID,
    status: "candidate-prior-component-binding-not-phase-b1-acceptance",
    phaseA1TissueManifestBundleSha256: bundle.contentSha256,
    wallOrder: WALL_IDS,
    wallBindings,
    atrialWalls: Object.freeze(["LA", "RA"] as const),
    ventricularWalls: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    activeModel: "Land-2017-active-only-rate-free-xi",
    passiveOwner:
      "independent-equilibrium-passive-plus-optional-one-state-SLS",
    wallWiseFreeGainAllowed: false,
    pvLoopShapeFittingAllowed: false,
    physiologicalValidationClaimed: false,
    phaseB1AcceptanceClaimed: false,
  });
  const binding: PhaseB1WallMaterialBindingV1 = {
    [PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND]: true,
    descriptor,
    contentSha256: computeCanonicalSha256(descriptor, sha256Hex),
    runtimeByWall,
  };
  PHASE_B1_WALL_MATERIAL_BINDINGS_V1.add(binding);
  return Object.freeze(binding);
}

function buildMechanisticRebuildAtrialPassiveSlsBindingV3(
  source: PhaseA1ManifestBoundPassiveSlsV1,
  candidateInput: NormalAdultAtrialMechanicsCandidateV3,
): PhaseB1MechanisticRebuildAtrialPassiveSlsBindingV3 {
  const candidate = assertNormalAdultAtrialMechanicsCandidateV3(candidateInput);
  if (
    source.tissueClass !== "atrial"
    || !candidate.audit.cmrMinimumTreatedAsLoaded
    || !candidate.audit.sameHumanPassiveMaterialAppliedToLaAndRa
    || !candidate.audit.passiveEnergyStrictlyConvexOnSupport
    || candidate.audit.chamberPressureGainApplied
    || candidate.audit.additiveResidualStressApplied
    || candidate.audit.pvLoopMorphologyUsedForFit
  ) {
    throw new Error(
      "atrial v3 binding requires convex Moyer material and inverse-unloaded geometry without gains or loop fitting",
    );
  }
  const prior = candidate.compiledPassive.prior;
  const atrialConstruction = Object.freeze({
    constructionModel: "moyer-equibiaxial-inverse-unloading-v3" as const,
    candidateId: candidate.candidateId,
    anatomyAnchorId: candidate.anatomy.anchorId,
    passivePriorId: prior.priorId,
    isotropicC1Pa: prior.isotropicC1Pa,
    isotropicC2Pa: prior.isotropicC2Pa,
    fiberC3Pa: prior.fiberC3Pa,
    fiberC4: prior.fiberC4,
    unloadedReferenceCavityVolumeM3ByAtrium: Object.freeze({
      LA: candidate.inverseUnloadingByAtrium.LA.unloadedReferenceCavityVolumeM3,
      RA: candidate.inverseUnloadingByAtrium.RA.unloadedReferenceCavityVolumeM3,
    }),
    loadedMinimumFiberLogPrestrainByAtrium: Object.freeze({
      LA: candidate.inverseUnloadingByAtrium.LA.loadedMinimumFiberLogPrestrain,
      RA: candidate.inverseUnloadingByAtrium.RA.loadedMinimumFiberLogPrestrain,
    }),
    minimumPressureUsedForInverseUnloadingByAtrium: Object.freeze({
      LA: candidate.inverseUnloadingByAtrium.LA.targetMinimumTransmuralPressurePa,
      RA: candidate.inverseUnloadingByAtrium.RA.targetMinimumTransmuralPressurePa,
    }),
    sameHumanMaterialAppliedToLaAndRa: true as const,
    chamberPressureGainApplied: false as const,
    additiveResidualStressApplied: false as const,
    pvLoopMorphologyUsedForFit: false as const,
  });
  return Object.freeze({
    bindingId:
      PHASE_B1_MECHANISTIC_REBUILD_ATRIAL_PASSIVE_SLS_BINDING_V3_ID,
    tissueClass: "atrial" as const,
    tissueManifestSha256: source.tissueManifestSha256,
    tissueBundleSha256: source.tissueBundleSha256,
    targetPackSha256: source.targetPackSha256,
    completeParameterParity: false as const,
    compiledPassive: candidate.compiledPassive,
    compiledSls: source.compiledSls,
    atrialConstruction,
    candidatePrior: true as const,
    closedLoopReleaseEligible: false as const,
  });
}

function buildMechanisticRebuildPassiveSlsBinding(
  source: PhaseA1ManifestBoundPassiveSlsV1,
  calibrationInput: VentricularPassiveScaleFitV2,
): PhaseB1MechanisticRebuildPassiveSlsBindingV2 {
  assertVentricularPassiveScaleFitV2(calibrationInput);
  const scale = calibrationInput.sharedTensileEnergyScale;
  const sourcePassive = source.compiledPassive.prior;
  if (
    calibrationInput.passivePriorId !== sourcePassive.priorId
    || !Object.is(calibrationInput.fixedPassiveB, sourcePassive.B)
    || !Object.is(calibrationInput.scaledTensileAPa, scale * sourcePassive.APa)
    || !Object.is(
      calibrationInput.retainedCompressionModulusPa,
      sourcePassive.KCompEffPa,
    )
    || !calibrationInput.everyNodeOnPureTensionBranch
    || calibrationInput.compressionScaleIdentified
    || calibrationInput.slsScaleIdentified
    || !calibrationInput.everyNodeWithinPublishedTaylorTwoPercentTensionErrorDomain
    || !calibrationInput.everyNodeRuntimeEnergyConjugateRootReplayed
    || !calibrationInput.everyNodeStrictLocalPotentialMinimum
    || calibrationInput.publishedTaylorUsedForPressureOrRoot
  ) {
    throw new Error(
      "ventricular passive fit does not match the manifest-bound source prior, runtime-energy replay, stability, or diagnostic Taylor domain",
    );
  }
  const compiledPassive = compileEquilibriumPassivePriorV1({
    ...sourcePassive,
    priorId:
      `${sourcePassive.priorId}:organ-edpvr:${calibrationInput.structuralAnatomyProvenanceId}`,
    evidenceClass: "literature-informed-organ-scale-edpvr-inverse",
    APa: scale * sourcePassive.APa,
    KCompEffPa: sourcePassive.KCompEffPa,
  });
  const compiledSls = source.compiledSls;
  const calibration = Object.freeze({
    calibrationId:
      `${calibrationInput.calibrationId}:${calibrationInput.structuralAnatomyProvenanceId}`,
    sharedTensileEnergyScale: scale,
    inflationPointCount: calibrationInput.nodes.length,
    rootMeanSquarePressureErrorPa: calibrationInput.rootMeanSquarePressureErrorPa,
    tensileEnergyStressAndTangentScaledTogether: true as const,
    compressionScaleIdentifiedByKlotz: false as const,
    slsScaleIdentifiedByKlotz: false as const,
    chamberPressureGainApplied: false as const,
    wallWiseScaleApplied: false as const,
    passivePriorId: calibrationInput.passivePriorId,
    structuralAnatomyProvenanceId:
      calibrationInput.structuralAnatomyProvenanceId,
    loadingPathProvenanceId: calibrationInput.loadingPathProvenanceId,
    equilibriumTensileScaleEvidence: "klotz-informed" as const,
    compressionPriorEvidence: "unchanged-independent-phase-a1-prior" as const,
    slsPriorEvidence: "unchanged-independent-phase-a1-prior" as const,
  });
  return Object.freeze({
    bindingId: PHASE_B1_MECHANISTIC_REBUILD_PASSIVE_SLS_BINDING_V2_ID,
    tissueClass: "ventricular" as const,
    tissueManifestSha256: source.tissueManifestSha256,
    tissueBundleSha256: source.tissueBundleSha256,
    targetPackSha256: source.targetPackSha256,
    completeParameterParity: false as const,
    compiledPassive,
    compiledSls,
    calibration,
    candidatePrior: true as const,
    closedLoopReleaseEligible: false as const,
  });
}

function assertNormalAdultActiveTissueClassPriorForBindingV1(
  prior: NormalAdultActiveTissueClassPriorAuditV1,
  sha256Hex: CanonicalSha256HexProvider,
): void {
  assertCanonicalSha256(
    normalAdultActiveTissueClassPriorAuditHashPayloadV1(prior),
    prior.contentSha256,
    sha256Hex,
  );
  if (
    prior.schemaId !== NORMAL_ADULT_ACTIVE_TISSUE_CLASS_PRIOR_V1_ID
    || prior.status !== "candidate-prior"
    || prior.atrialClass.sharedBy[0] !== "LA"
    || prior.atrialClass.sharedBy[1] !== "RA"
    || !prior.atrialClass.allOtherPrimitiveValuesBitExact
    || !prior.atrialClass.derivedKineticsBitExact
    || prior.exclusionBoundary.pvLoopOrPvMorphologyFitUsed
    || prior.exclusionBoundary.moyerPassiveMaterialUsed
    || prior.exclusionBoundary.passiveMaterialCalibrationUsed
    || prior.exclusionBoundary.chamberSpecificActiveGainUsed
    || prior.exclusionBoundary.lewalleMicroscopicParameterVectorTransplanted
    || prior.exclusionBoundary.closedLoopPhysiologyValidated
  ) {
    throw new Error(
      "active tissue-class binding requires the canonical shared candidate without gains, passive fitting, or closed-loop claims",
    );
  }
}

export function assertPhaseB1WallMaterialBindingV1(
  binding: PhaseB1WallMaterialBindingV1,
): PhaseB1WallMaterialBindingV1 {
  if (
    binding === null
    || typeof binding !== "object"
    || binding[PHASE_B1_WALL_MATERIAL_BINDING_V1_BRAND] !== true
    || !PHASE_B1_WALL_MATERIAL_BINDINGS_V1.has(binding)
  ) {
    throw new Error(
      "Phase B1 wall material binding must be the canonical compiled binding",
    );
  }
  for (const wallId of WALL_IDS) {
    const material = assertPhaseB1WallRuntimeMaterialV1(
      binding.runtimeByWall[wallId],
    );
    if (material.wallId !== wallId) {
      throw new Error(
        `Phase B1 wall binding key ${wallId} contains material ${material.wallId}`,
      );
    }
  }
  return binding;
}

export function assertPhaseB1WallRuntimeMaterialV1(
  material: PhaseB1WallRuntimeMaterialV1,
): PhaseB1WallRuntimeMaterialV1 {
  if (
    material === null
    || typeof material !== "object"
    || material[PHASE_B1_WALL_RUNTIME_MATERIAL_V1_BRAND] !== true
    || !PHASE_B1_WALL_RUNTIME_MATERIALS_V1.has(material)
  ) {
    throw new Error(
      "Phase B1 wall material must be compiled from the canonical Phase A1 binding",
    );
  }
  if (material.tissueClass !== tissueClassForWall(material.wallId)) {
    throw new Error("Phase B1 wall material tissue class does not match its wall");
  }
  if (
    material.passiveSls.tissueManifestSha256
      !== material.landWallAdapterContext.tissueManifestSha256
  ) {
    throw new Error("Phase B1 wall material manifest bindings disagree");
  }
  return material;
}

export function getPhaseB1WallPassiveStressScalesV1(
  materialInput: PhaseB1WallRuntimeMaterialV1,
): Readonly<{
  tensileStressScalePa: number;
  compressionStressScalePa: number;
}> {
  const material = assertPhaseB1WallRuntimeMaterialV1(materialInput);
  const compiled = material.passiveSls.compiledPassive;
  if (compiled.modelId === "moyer-2015-atrial-equibiaxial-passive-v3") {
    return Object.freeze({
      tensileStressScalePa: compiled.zeroStrainTangentPa,
      compressionStressScalePa: compiled.minimumSupportedTangentPa,
    });
  }
  return Object.freeze({
    tensileStressScalePa: compiled.prior.APa,
    compressionStressScalePa: compiled.prior.KCompEffPa,
  });
}

export function tissueClassForWall(
  wallId: FourChamberWallId,
): PhaseB1WallTissueClassV1 {
  if (wallId === "LA" || wallId === "RA") return "atrial";
  if (wallId === "LVFW" || wallId === "SEP" || wallId === "RVFW") {
    return "ventricular";
  }
  throw new Error("Unknown four-chamber wall ID " + String(wallId));
}
