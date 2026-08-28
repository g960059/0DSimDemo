import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import {
  compileEquilibriumOneFiberPassiveV1,
  evaluateEquilibriumOneFiberPassiveV1,
  type CompiledEquilibriumOneFiberPassiveV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import {
  cloneLandSlsWallMaterialStateV1,
  evaluateAcceptedLandSlsWallStateV1,
  initializeLandSlsWallAtFixedInputV1,
  trialLandSlsWallMaterialNumericalV1,
  trialLandSlsWallMaterialV1,
  type LandSlsWallEquilibriumPassiveInputV1,
  type LandSlsWallMaterialParamsV1,
  type LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  createMainWireFiveWallLandTriSegProviderV1,
  type MainWireFiveWallFreeCalciumDriveV1,
  type MainWireFiveWallIdV1,
  type MainWireFiveWallLandSlsMaterialKernelV1,
  type MainWireFiveWallLandTriSegProviderV1,
  type MainWireFiveWallLandTriSegStateV1,
  type MainWireFiveWallMaterialEvaluationV1,
  type MainWireFiveWallRecordV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  evaluateMoyer2015AtrialEquibiaxialPassiveV1,
  type CompiledMoyer2015AtrialEquibiaxialPassiveV1,
} from "@/engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
  assertNormalAdultFiveWallPriorV1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  validateAndOwnMainWireFiveWallMechanicsResearchInputsV1,
  type MainWireFiveWallMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";
import { computeLand2017SteadyStateTangentPaFromSolvedState } from "@/engine/myocardium/myofilament/land2017/tangents";
import type {
  WholeHeartMechanicsSerializableValueV1,
  WholeHeartMechanicsStateCodecV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID =
  "main-wire-normal-adult-five-wall-material-adapter-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM = Object.freeze({
  priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.priorId,
  atrialEquilibriumPassiveOwner:
    "Moyer-2015-exact-equibiaxial-reduction" as const,
  ventricularEquilibriumPassiveOwner: "Klotz-normal-center-one-fiber" as const,
  activeOwner: "Land-2017-active-only" as const,
  fullLandKernelOnAllFiveWalls: true as const,
  landStateCountPerWall: 6 as const,
  atrialPopulationOnlyReductionApplied: false as const,
  externalSeriesElementApplied: false as const,
  viscousOwner: "one-state-parallel-SLS" as const,
  passiveStoredEnergyReported: true as const,
  slsStoredEnergyAndDissipationReported: true as const,
  landThermodynamicStoredEnergyClaimed: false as const,
  totalThermodynamicPotentialIncludingLandClaimed: false as const,
  providerTopology: "fixed-two-coordinate-TriSeg" as const,
  parameterFittingIncluded: false as const,
});

/** Mechanics-only fixture; not a circulation cold-state or periodic solution. */
export const MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1 =
  Object.freeze({
    LA: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.LA.cavityBloodVolumeMl
      .minimum,
    LV: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
      .leftVentricularEndDiastolicVolumeMl,
    RA: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.RA.cavityBloodVolumeMl
      .minimum,
    RV: NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg
      .rightVentricularEndDiastolicVolumeMl,
  });

export type MainWireNormalAdultWallEnergyLedgerV1 = Readonly<{
  equilibriumPassiveStoredEnergyDensityJPerM3: number;
  slsPreviousStoredEnergyDensityJPerM3: number;
  slsNextStoredEnergyDensityJPerM3: number;
  slsPhysicalDissipationIncrementDensityJPerM3: number;
  slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: number;
  slsDiscreteEnergyBalanceResidualJPerM3: number;
  slsPassive: boolean;
  landThermodynamicStoredEnergyClaimed: false;
  totalThermodynamicPotentialIncludingLandClaimed: false;
}>;

export type MainWireNormalAdultWallMaterialReadbackV1 = Readonly<{
  adapterId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID;
  wallId: MainWireFiveWallIdV1;
  passiveModelId:
    | "moyer-2015-atrial-equibiaxial-passive-v1"
    | "equilibrium-one-fiber-passive-log-strain-v1";
  passiveParameterIdentityHash: string;
  landParameterSetStableHash: string;
  landActiveKirchhoffStressPa: number;
  slsOverstressPa: number;
  totalKirchhoffStressPa: number;
  energyLedger: MainWireNormalAdultWallEnergyLedgerV1;
  coldFixedInputIterations: number | null;
  coldLandMaximumStateUpdate: number | null;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM;
}>;

export type MainWireNormalAdultFiveWallProviderV1 =
  MainWireFiveWallLandTriSegProviderV1<LandSlsWallMaterialStateV1>;

export type MainWireNormalAdultLaSlsModeV1 = "on" | "exact-off";

/**
 * Bounded global ventricular active-tension scale used by the Standard Studio
 * ABI. The scale owns one honest material operation: Land 2017 `Tref` is
 * changed together for LVFW, SEP, and RVFW. The shared septum means this is
 * deliberately not presented as an independent LV- or RV-only inotropy knob.
 */
export const MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1 =
  Object.freeze({
    minimum: 0.75,
    maximum: 1.33,
    defaultValue: 1,
  });

export const MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1 =
  4 / 3;

export const MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_MATERIAL_RESEARCH_POINT_IDS_V1 =
  Object.freeze([
    "baseline",
    "ventricular-passive-low",
    "ventricular-passive-high",
    "ventricular-tref-low",
    "ventricular-tref-high",
    "ventricular-tref-high-plus-passive-low",
    "ventricular-length-dependence-low",
    "ventricular-length-dependence-half",
    "ventricular-length-dependence-quarter",
    "ventricular-length-dependence-exact-off",
    "ventricular-peak-tension-length-dependence-low",
    "ventricular-calcium-sensitivity-length-dependence-low",
    "ventricular-peak-tension-length-dependence-half",
    "ventricular-calcium-sensitivity-length-dependence-half",
    "ventricular-velocity-distortion-high",
    "ventricular-distortion-recovery-high",
    "ventricular-velocity-distortion-high-plus-recovery-high",
    "ventricular-distortion-transient-twofold",
    "ventricular-distortion-transient-fourfold",
    "ventricular-length-dependence-low-plus-velocity-distortion-high",
  ] as const);

export type MainWireNormalAdultVentricularMaterialResearchPointIdV1 =
  (typeof MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_MATERIAL_RESEARCH_POINT_IDS_V1)[number];

export type MainWireNormalAdultVentricularMaterialResearchPointV1 = Readonly<{
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1;
  ventricularEquilibriumPassiveScaleFromBaseline: number;
  ventricularSlsModulusScaleFromBaseline: number;
  ventricularLandTrefScaleFromBaseline: number;
  /** Common scale applied to both beta0 and beta1; one for split-axis points. */
  ventricularLandLengthDependenceScaleFromBaseline: number;
  ventricularLandPeakTensionLengthDependenceScaleFromBaseline: number;
  ventricularLandCalciumSensitivityLengthDependenceScaleFromBaseline: number;
  ventricularLandVelocityDistortionScaleFromBaseline: number;
  ventricularLandDistortionRecoveryScaleFromBaseline: number;
  resolvedVentricularLandTrefPa: number;
  resolvedVentricularLandBeta0: number;
  resolvedVentricularLandBeta1UM: number;
  resolvedVentricularLandAeff: number;
  resolvedVentricularLandPhi: number;
  wallScope: readonly ["LVFW", "SEP", "RVFW"];
  claim: Readonly<{
    sourceResearchOnly: true;
    fixedPointNotGenericPatch: true;
    geometryExponentAndSlsTauHeldFixed: true;
    equilibriumEnergyStressAndTangentScaledTogether: true;
    septumSharedByBothVentricles: true;
    independentLvAndRvEdpvrClaimed: false;
    landBeta0Scaled: boolean;
    landBeta1Scaled: boolean;
    landBeta0AndBeta1ScaledTogether: boolean;
    landAeffScaledWithDerivedAwAndAs: boolean;
    landPhiScaledWithDerivedCwAndCs: boolean;
    referenceLengthIsometricLandValuesUnchanged: boolean;
  }>;
}>;

type PassiveEvaluationV1 = Readonly<{
  modelId: MainWireNormalAdultWallMaterialReadbackV1["passiveModelId"];
  parameterIdentityHash: string;
  input: LandSlsWallEquilibriumPassiveInputV1;
}>;

type PassiveEvaluatorV1 = (fiberLogStrain: number) => PassiveEvaluationV1;

const LAND_SLS_STATE_CODEC: WholeHeartMechanicsStateCodecV1<LandSlsWallMaterialStateV1> =
  Object.freeze({
    clone: cloneLandSlsWallMaterialStateV1,
    encode: encodeLandSlsState,
    decode: decodeLandSlsState,
  });

export function createCanonicalMainWireNormalAdultFiveWallProviderV1(
  laSlsMode: MainWireNormalAdultLaSlsModeV1 = "on",
): MainWireNormalAdultFiveWallProviderV1 {
  return createNormalAdultProvider(
    laSlsMode,
    resolveVentricularMaterialProfile("baseline"),
  );
}

/**
 * Creates the continuous, bounded contractility variant used by the exact
 * Standard model. Passive material, geometry, calcium ownership, SLS, and the
 * atria remain unchanged; only ventricular Land `Tref` is scaled.
 */
export function createMainWireNormalAdultFiveWallProviderWithVentricularContractilityScaleV1(
  requestedScale: number,
): MainWireNormalAdultFiveWallProviderV1 {
  const profile = continuousVentricularContractilityProfileV1(requestedScale);
  return createNormalAdultProviderFromMaterial(
    "on",
    profile.equilibriumPassive,
    profile.wallMaterial,
    profile.identitySuffix,
  );
}

/**
 * Wall-explicit research provider. "Chamber" bundles remain an authoring
 * concern because SEP is a shared wall; the numerical primitive never labels
 * an LV-only or RV-only scale that would conceal septal coupling.
 */
export function createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsV1(
  requestedInputs: MainWireFiveWallMechanicsResearchInputsV1,
): MainWireNormalAdultFiveWallProviderV1 {
  return createProviderWithMechanicsResearchInputsV1(requestedInputs, 1);
}

/**
 * Fixed post-Pareto composition seam. It reuses the existing Land distortion
 * state and scales Aeff and phi proportionally in LVFW, SEP, and RVFW. Thus the
 * constant-strain-rate zeta gain Aeff/phi is unchanged while its transient
 * response is faster; no valve state, inertance, or mechanics state is added.
 */
export function createMainWireNormalAdultFiveWallProviderWithMechanicsResearchInputsAndFixedVentricularDistortionTransientV1(
  requestedInputs: MainWireFiveWallMechanicsResearchInputsV1,
): MainWireNormalAdultFiveWallProviderV1 {
  return createProviderWithMechanicsResearchInputsV1(
    requestedInputs,
    MAIN_WIRE_NORMAL_ADULT_FIXED_VENTRICULAR_DISTORTION_TRANSIENT_SCALE_V1,
  );
}

function createProviderWithMechanicsResearchInputsV1(
  requestedInputs: MainWireFiveWallMechanicsResearchInputsV1,
  commonVentricularDistortionTransientScale: number,
): MainWireNormalAdultFiveWallProviderV1 {
  const inputs =
    validateAndOwnMainWireFiveWallMechanicsResearchInputsV1(requestedInputs);
  const materialChanged = (
    [
      ...Object.values(inputs.activeTensionScaleByWall),
      ...Object.values(inputs.passiveStiffnessScaleByWall),
    ] as number[]
  ).some((scale) => scale !== 1)
    || commonVentricularDistortionTransientScale !== 1;
  if (!materialChanged)
    return createCanonicalMainWireNormalAdultFiveWallProviderV1();
  const identity = stableHash(
    sanitizeForStableHash(
      Object.freeze({
        activeTensionScaleByWall: inputs.activeTensionScaleByWall,
        passiveStiffnessScaleByWall: inputs.passiveStiffnessScaleByWall,
        commonVentricularDistortionTransientScale,
      }),
    ),
  );
  return createNormalAdultProviderFromKernels(
    "on",
    createMaterialKernelsWithMechanicsResearchInputsV1(
      inputs,
      commonVentricularDistortionTransientScale,
    ),
    `-wall-mechanics-${identity}`,
  );
}

export function createMainWireNormalAdultFiveWallMaterialKernelsWithVentricularContractilityScaleV1(
  requestedScale: number,
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  const profile = continuousVentricularContractilityProfileV1(requestedScale);
  return createMaterialKernelsFromMaterial(
    "on",
    profile.equilibriumPassive,
    profile.wallMaterial,
  );
}

export function createMainWireNormalAdultFiveWallMaterialKernelsV1(
  laSlsMode: MainWireNormalAdultLaSlsModeV1 = "on",
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  return createMaterialKernels(
    laSlsMode,
    resolveVentricularMaterialProfile("baseline"),
  );
}

/**
 * Sealed source-research seam. It accepts only the fixed material point IDs
 * above and deliberately does not expose arbitrary material patches.
 */
export function createFixedResearchMainWireNormalAdultFiveWallProviderV1(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
): MainWireNormalAdultFiveWallProviderV1 {
  return createNormalAdultProvider(
    "on",
    resolveVentricularMaterialProfile(pointId),
  );
}

export function createFixedResearchMainWireNormalAdultFiveWallMaterialKernelsV1(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  return createMaterialKernels(
    "on",
    resolveVentricularMaterialProfile(pointId),
  );
}

export function resolveMainWireNormalAdultVentricularMaterialResearchPointV1(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
): MainWireNormalAdultVentricularMaterialResearchPointV1 {
  return resolveVentricularMaterialProfile(pointId).point;
}

/** Fixed-ID material readback for offline constitutive audits only. */
export function resolveMainWireNormalAdultVentricularWallMaterialResearchV1(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
): LandSlsWallMaterialParamsV1 {
  return resolveVentricularMaterialProfile(pointId).wallMaterial;
}

type ResolvedVentricularMaterialProfileV1 = Readonly<{
  point: MainWireNormalAdultVentricularMaterialResearchPointV1;
  equilibriumPassive: CompiledEquilibriumOneFiberPassiveV1;
  wallMaterial: LandSlsWallMaterialParamsV1;
}>;

type ContinuousVentricularContractilityProfileV1 = Readonly<{
  equilibriumPassive: CompiledEquilibriumOneFiberPassiveV1;
  wallMaterial: LandSlsWallMaterialParamsV1;
  identitySuffix: string;
}>;

function continuousVentricularContractilityProfileV1(
  requestedScale: number,
): ContinuousVentricularContractilityProfileV1 {
  const scale = validateVentricularContractilityScaleV1(requestedScale);
  const baseline =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  if (scale === 1) {
    return Object.freeze({
      equilibriumPassive:
        NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
      wallMaterial: baseline,
      identitySuffix: "",
    });
  }
  const scaleIdentity = canonicalScaleIdentityV1(scale);
  return Object.freeze({
    equilibriumPassive:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
    wallMaterial: Object.freeze({
      ...baseline,
      parameterSetId: `${baseline.parameterSetId}-ventricular-contractility-${scaleIdentity}`,
      landEquationParameters: scaledVentricularLandTrefForScale(
        `ventricular-contractility-${scaleIdentity}`,
        scale,
        "bounded global ventricular contractility control",
      ),
    }),
    identitySuffix: `-ventricular-contractility-${scaleIdentity}`,
  });
}

function createMaterialKernels(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
  ventricularProfile: ResolvedVentricularMaterialProfileV1,
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  return createMaterialKernelsFromMaterial(
    laSlsMode,
    ventricularProfile.equilibriumPassive,
    ventricularProfile.wallMaterial,
  );
}

function createMaterialKernelsFromMaterial(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
  ventricularEquilibriumPassive: CompiledEquilibriumOneFiberPassiveV1,
  ventricularWallMaterial: LandSlsWallMaterialParamsV1,
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  return fiveWallRecord((wallId) => {
    const isAtrium = wallId === "LA" || wallId === "RA";
    const passive = isAtrium
      ? createMoyerPassiveEvaluator(prior.passive.atrial.compiled)
      : createKlotzPassiveEvaluator(ventricularEquilibriumPassive);
    const baseParams = isAtrium
      ? prior.active.wallMaterialByWall[wallId]
      : ventricularWallMaterial;
    const materialParams =
      wallId === "LA" && laSlsMode === "exact-off"
        ? exactLaSlsOffParams(baseParams)
        : baseParams;
    return createWallKernel(
      wallId,
      materialParams,
      passive,
      prior.parameterIdentityHash,
    );
  });
}

function createMaterialKernelsWithMechanicsResearchInputsV1(
  inputs: MainWireFiveWallMechanicsResearchInputsV1,
  commonVentricularDistortionTransientScale: number,
): MainWireFiveWallRecordV1<
  MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
> {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  return fiveWallRecord((wallId) => {
    const activeScale = inputs.activeTensionScaleByWall[wallId];
    const passiveScale = inputs.passiveStiffnessScaleByWall[wallId];
    const isAtrium = wallId === "LA" || wallId === "RA";
    const distortionTransientScale = isAtrium
      ? 1
      : commonVentricularDistortionTransientScale;
    const basePassive = isAtrium
      ? createMoyerPassiveEvaluator(prior.passive.atrial.compiled)
      : createKlotzPassiveEvaluator(prior.passive.ventricular.compiled);
    const passive =
      passiveScale === 1
        ? basePassive
        : scaledPassiveEvaluatorV1(basePassive, passiveScale, wallId);
    const baseline = prior.active.wallMaterialByWall[wallId];
    const materialParams =
      activeScale === 1
        && passiveScale === 1
        && distortionTransientScale === 1
        ? baseline
        : Object.freeze({
            ...baseline,
            parameterSetId:
              `${baseline.parameterSetId}-wall-${wallId}` +
              `-active-${canonicalScaleIdentityV1(activeScale)}` +
              `-passive-${canonicalScaleIdentityV1(passiveScale)}` +
              `-distortion-transient-${
                canonicalScaleIdentityV1(distortionTransientScale)
              }`,
            landEquationParameters:
              activeScale === 1 && distortionTransientScale === 1
                ? baseline.landEquationParameters
                : scaledWallLandResearchForScalesV1(
                    baseline.landEquationParameters,
                    `wall-${wallId}` +
                      `-active-${canonicalScaleIdentityV1(activeScale)}` +
                      `-distortion-transient-${
                        canonicalScaleIdentityV1(distortionTransientScale)
                      }`,
                    activeScale,
                    distortionTransientScale,
                    `bounded ${wallId} active-tension research control`,
                  ),
            sls:
              passiveScale === 1
                ? baseline.sls
                : Object.freeze({
                    ...baseline.sls,
                    parameterSetId:
                      `${baseline.sls.parameterSetId}` +
                      `-wall-${wallId}-passive-` +
                      canonicalScaleIdentityV1(passiveScale),
                    branchModulusPa:
                      baseline.sls.branchModulusPa * passiveScale,
                  }),
          });
    return createWallKernel(
      wallId,
      materialParams,
      passive,
      prior.parameterIdentityHash,
    );
  });
}

function createNormalAdultProvider(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
  ventricularProfile: ResolvedVentricularMaterialProfileV1,
): MainWireNormalAdultFiveWallProviderV1 {
  const researchSuffix =
    ventricularProfile.point.pointId === "baseline"
      ? ""
      : `-source-research-${ventricularProfile.point.pointId}`;
  return createNormalAdultProviderFromMaterial(
    laSlsMode,
    ventricularProfile.equilibriumPassive,
    ventricularProfile.wallMaterial,
    researchSuffix,
  );
}

function createNormalAdultProviderFromMaterial(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
  ventricularEquilibriumPassive: CompiledEquilibriumOneFiberPassiveV1,
  ventricularWallMaterial: LandSlsWallMaterialParamsV1,
  identitySuffix: string,
): MainWireNormalAdultFiveWallProviderV1 {
  return createNormalAdultProviderFromKernels(
    laSlsMode,
    createMaterialKernelsFromMaterial(
      laSlsMode,
      ventricularEquilibriumPassive,
      ventricularWallMaterial,
    ),
    identitySuffix,
  );
}

function createNormalAdultProviderFromKernels(
  laSlsMode: MainWireNormalAdultLaSlsModeV1,
  materialByWall: MainWireFiveWallRecordV1<
    MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1>
  >,
  identitySuffix: string,
): MainWireNormalAdultFiveWallProviderV1 {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  assertNormalAdultFiveWallPriorV1(prior);
  return createMainWireFiveWallLandTriSegProviderV1(
    Object.freeze({
      parameterSetId: `${prior.priorId}-${laSlsMode === "on" ? "canonical" : "la-sls-exact-off"}${identitySuffix}`,
      materialByWall,
      atria: Object.freeze({
        LA: atrialGeometry("LA"),
        RA: atrialGeometry("RA"),
      }),
      trisegWalls: prior.anatomy.triSeg.wallGeometryParameters,
      initialTriSegCoordinates: prior.anatomy.triSeg.loadedCoordinates,
      internalCoordinateScales: Object.freeze({
        septalMidwallCapVolumeM3: Math.abs(
          prior.anatomy.triSeg.loadedCoordinates.septalMidwallCapVolumeM3,
        ),
        junctionRadiusM: prior.anatomy.triSeg.loadedCoordinates.junctionRadiusM,
      }),
      fingerprintMaterialStateCanonicalV1:
        fingerprintNormalAdultFiveWallMaterialStateCanonicalV1,
    }),
  );
}

const CANONICAL_FINGERPRINT_WALL_ORDER_V1 = Object.freeze([
  "LA",
  "LVFW",
  "RA",
  "RVFW",
  "SEP",
] as const);

function updateCanonicalFingerprintTextV1(
  initialHash: number,
  text: string,
): number {
  let hash = initialHash;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

function updateCanonicalFingerprintNumberV1(
  initialHash: number,
  value: number,
): number {
  if (!Number.isFinite(value)) {
    throw new Error(
      "normal-adult material fingerprint requires finite numbers",
    );
  }
  return updateCanonicalFingerprintTextV1(initialHash, JSON.stringify(value));
}

function updateCanonicalLandSlsWallStateV1(
  initialHash: number,
  state: LandSlsWallMaterialStateV1,
): number {
  if (
    !(state.landState instanceof Float64Array) ||
    state.landState.length !== 6
  ) {
    throw new Error(
      "normal-adult material fingerprint requires six Land states",
    );
  }
  let hash = updateCanonicalFingerprintTextV1(initialHash, '{"landState":[');
  for (let index = 0; index < state.landState.length; index += 1) {
    if (index !== 0) hash = updateCanonicalFingerprintTextV1(hash, ",");
    hash = updateCanonicalFingerprintNumberV1(hash, state.landState[index]!);
  }
  hash = updateCanonicalFingerprintTextV1(hash, '],"previousFiberLogStrain":');
  hash = updateCanonicalFingerprintNumberV1(hash, state.previousFiberLogStrain);
  hash = updateCanonicalFingerprintTextV1(hash, ',"previousFreeCalciumUM":');
  hash = updateCanonicalFingerprintNumberV1(hash, state.previousFreeCalciumUM);
  hash = updateCanonicalFingerprintTextV1(
    hash,
    ',"slsState":{"viscousLogStrain":',
  );
  hash = updateCanonicalFingerprintNumberV1(
    hash,
    state.slsState.viscousLogStrain,
  );
  return updateCanonicalFingerprintTextV1(hash, "}}");
}

/** Exact FNV-1a hash of the state codec's sorted-key canonical JSON. */
export function fingerprintNormalAdultFiveWallMaterialStateCanonicalV1(
  state: MainWireFiveWallLandTriSegStateV1<LandSlsWallMaterialStateV1>,
): string {
  let hash = updateCanonicalFingerprintTextV1(
    0x811c9dc5,
    '{"schemaVersion":2,"trisegCoordinates":{"junctionRadiusM":',
  );
  hash = updateCanonicalFingerprintNumberV1(
    hash,
    state.trisegCoordinates.junctionRadiusM,
  );
  hash = updateCanonicalFingerprintTextV1(hash, ',"septalMidwallCapVolumeM3":');
  hash = updateCanonicalFingerprintNumberV1(
    hash,
    state.trisegCoordinates.septalMidwallCapVolumeM3,
  );
  hash = updateCanonicalFingerprintTextV1(hash, '},"wallStateByWall":{');
  for (
    let index = 0;
    index < CANONICAL_FINGERPRINT_WALL_ORDER_V1.length;
    index += 1
  ) {
    if (index !== 0) hash = updateCanonicalFingerprintTextV1(hash, ",");
    const wallId = CANONICAL_FINGERPRINT_WALL_ORDER_V1[index]!;
    hash = updateCanonicalFingerprintTextV1(hash, `"${wallId}":`);
    hash = updateCanonicalLandSlsWallStateV1(
      hash,
      state.wallStateByWall[wallId],
    );
  }
  hash = updateCanonicalFingerprintTextV1(hash, "}}");
  return hash.toString(16).padStart(8, "0");
}

function resolveVentricularMaterialProfile(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
): ResolvedVentricularMaterialProfileV1 {
  if (
    !MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_MATERIAL_RESEARCH_POINT_IDS_V1.includes(
      pointId,
    )
  ) {
    throw new Error(
      `unsupported fixed ventricular material research point: ${String(pointId)}`,
    );
  }
  const passiveScale =
    pointId === "ventricular-passive-low"
      || pointId === "ventricular-tref-high-plus-passive-low"
      ? 0.75
      : pointId === "ventricular-passive-high"
        ? 4 / 3
        : 1;
  const trefScale =
    pointId === "ventricular-tref-low"
      ? 0.75
      : pointId === "ventricular-tref-high"
        || pointId === "ventricular-tref-high-plus-passive-low"
        ? 4 / 3
        : 1;
  const lengthDependenceScale =
    pointId === "ventricular-length-dependence-low"
        || pointId
          === "ventricular-length-dependence-low-plus-velocity-distortion-high"
      ? 0.75
      : pointId === "ventricular-length-dependence-half"
        ? 0.5
        : pointId === "ventricular-length-dependence-quarter"
          ? 0.25
          : pointId === "ventricular-length-dependence-exact-off"
            ? 0
            : 1;
  const peakTensionLengthDependenceScale =
    pointId === "ventricular-peak-tension-length-dependence-half"
      ? 0.5
      : pointId === "ventricular-peak-tension-length-dependence-low"
      ? 0.75
      : lengthDependenceScale;
  const calciumSensitivityLengthDependenceScale =
    pointId === "ventricular-calcium-sensitivity-length-dependence-half"
      ? 0.5
      : pointId === "ventricular-calcium-sensitivity-length-dependence-low"
      ? 0.75
      : lengthDependenceScale;
  const velocityDistortionScale =
    pointId === "ventricular-distortion-transient-twofold"
      ? 2
      : pointId === "ventricular-distortion-transient-fourfold"
        ? 4
        : pointId === "ventricular-velocity-distortion-high"
        || pointId
          === "ventricular-velocity-distortion-high-plus-recovery-high"
        || pointId
          === "ventricular-length-dependence-low-plus-velocity-distortion-high"
          ? 4 / 3
          : 1;
  const distortionRecoveryScale =
    pointId === "ventricular-distortion-transient-twofold"
      ? 2
      : pointId === "ventricular-distortion-transient-fourfold"
        ? 4
        : pointId === "ventricular-distortion-recovery-high"
        || pointId
          === "ventricular-velocity-distortion-high-plus-recovery-high"
          ? 4 / 3
          : 1;
  const baselinePassive = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular;
  const baselineMaterial =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  const equilibriumPassive =
    passiveScale === 1
      ? baselinePassive.compiled
      : compileEquilibriumOneFiberPassiveV1(
          Object.freeze({
            ...baselinePassive.compiled.params,
            parameterSetId: `${baselinePassive.compiled.params.parameterSetId}-${pointId}`,
            centralTangentPa:
              baselinePassive.compiled.params.centralTangentPa * passiveScale,
            tensionScalePa:
              baselinePassive.compiled.params.tensionScalePa * passiveScale,
            compressionAdditionalTangentPa:
              baselinePassive.compiled.params.compressionAdditionalTangentPa *
              passiveScale,
          }),
        );
  const landEquationParameters =
    pointId === "ventricular-tref-low"
      || pointId === "ventricular-tref-high"
      || pointId === "ventricular-tref-high-plus-passive-low"
      ? scaledVentricularLandTref(pointId, trefScale)
      : peakTensionLengthDependenceScale !== 1
          || calciumSensitivityLengthDependenceScale !== 1
          || velocityDistortionScale !== 1
          || distortionRecoveryScale !== 1
        ? scaledVentricularLandKinematicDependence(
          pointId,
          peakTensionLengthDependenceScale,
          calciumSensitivityLengthDependenceScale,
          velocityDistortionScale,
          distortionRecoveryScale,
        )
        : baselineMaterial.landEquationParameters;
  const sls =
    passiveScale === 1
      ? baselineMaterial.sls
      : Object.freeze({
          ...baselineMaterial.sls,
          parameterSetId: `${baselineMaterial.sls.parameterSetId}-${pointId}`,
          branchModulusPa: baselineMaterial.sls.branchModulusPa * passiveScale,
        });
  const wallMaterial =
    passiveScale === 1
        && trefScale === 1
        && peakTensionLengthDependenceScale === 1
        && calciumSensitivityLengthDependenceScale === 1
        && velocityDistortionScale === 1
        && distortionRecoveryScale === 1
      ? baselineMaterial
      : Object.freeze({
          ...baselineMaterial,
          parameterSetId: `${baselineMaterial.parameterSetId}-${pointId}`,
          landEquationParameters,
          sls,
        });
  const point = Object.freeze({
    pointId,
    ventricularEquilibriumPassiveScaleFromBaseline: passiveScale,
    ventricularSlsModulusScaleFromBaseline: passiveScale,
    ventricularLandTrefScaleFromBaseline: trefScale,
    ventricularLandLengthDependenceScaleFromBaseline:
      lengthDependenceScale,
    ventricularLandPeakTensionLengthDependenceScaleFromBaseline:
      peakTensionLengthDependenceScale,
    ventricularLandCalciumSensitivityLengthDependenceScaleFromBaseline:
      calciumSensitivityLengthDependenceScale,
    ventricularLandVelocityDistortionScaleFromBaseline:
      velocityDistortionScale,
    ventricularLandDistortionRecoveryScaleFromBaseline:
      distortionRecoveryScale,
    resolvedVentricularLandTrefPa: landEquationParameters.values.Tref,
    resolvedVentricularLandBeta0: landEquationParameters.values.beta0,
    resolvedVentricularLandBeta1UM: landEquationParameters.values.beta1,
    resolvedVentricularLandAeff: landEquationParameters.values.Aeff,
    resolvedVentricularLandPhi: landEquationParameters.values.phi,
    wallScope: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    claim: Object.freeze({
      sourceResearchOnly: true as const,
      fixedPointNotGenericPatch: true as const,
      geometryExponentAndSlsTauHeldFixed: true as const,
      equilibriumEnergyStressAndTangentScaledTogether: true as const,
      septumSharedByBothVentricles: true as const,
      independentLvAndRvEdpvrClaimed: false as const,
      landBeta0Scaled: peakTensionLengthDependenceScale !== 1,
      landBeta1Scaled: calciumSensitivityLengthDependenceScale !== 1,
      landBeta0AndBeta1ScaledTogether:
        peakTensionLengthDependenceScale !== 1
        && peakTensionLengthDependenceScale
          === calciumSensitivityLengthDependenceScale,
      landAeffScaledWithDerivedAwAndAs:
        velocityDistortionScale !== 1,
      landPhiScaledWithDerivedCwAndCs:
        distortionRecoveryScale !== 1,
      referenceLengthIsometricLandValuesUnchanged:
        (
          peakTensionLengthDependenceScale !== 1
          || calciumSensitivityLengthDependenceScale !== 1
          || velocityDistortionScale !== 1
          || distortionRecoveryScale !== 1
        )
        && passiveScale === 1
        && trefScale === 1,
    }),
  });
  return Object.freeze({ point, equilibriumPassive, wallMaterial });
}

function scaledVentricularLandKinematicDependence(
  pointId: MainWireNormalAdultVentricularMaterialResearchPointIdV1,
  peakTensionLengthDependenceScale: number,
  calciumSensitivityLengthDependenceScale: number,
  velocityDistortionScale: number,
  distortionRecoveryScale: number,
): Land2017SourceParameterSet {
  const baseline = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  const values = Object.freeze({
    ...baseline.values,
    Aeff: baseline.values.Aeff * velocityDistortionScale,
    phi: baseline.values.phi * distortionRecoveryScale,
    beta0: peakTensionLengthDependenceScale === 0
      ? 0
      : baseline.values.beta0 * peakTensionLengthDependenceScale,
    beta1: calciumSensitivityLengthDependenceScale === 0
      ? 0
      : baseline.values.beta1 * calciumSensitivityLengthDependenceScale,
  });
  const peakTensionLengthProvenance =
    `fixed peak-tension length-dependence research scale ${
      peakTensionLengthDependenceScale
    }`;
  const calciumSensitivityLengthProvenance =
    `fixed calcium-sensitivity length-dependence research scale ${
      calciumSensitivityLengthDependenceScale
    }`;
  const velocityProvenance =
    `fixed velocity-distortion research scale ${velocityDistortionScale}`;
  const recoveryProvenance =
    `fixed distortion-recovery research scale ${distortionRecoveryScale}`;
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseline.parameterSetId}-${pointId}`,
      sourceId: baseline.sourceId,
      doi: baseline.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(
        baseline.sourceParameters.map((entry) => {
          const scaledValue = entry.parameter === "Aeff"
            ? values.Aeff
            : entry.parameter === "phi"
              ? values.phi
            : entry.parameter === "beta0"
              ? values.beta0
              : entry.parameter === "beta1"
                ? values.beta1
                : null;
          const provenanceLabel = entry.parameter === "Aeff"
            ? velocityProvenance
            : entry.parameter === "phi"
              ? recoveryProvenance
            : entry.parameter === "beta0"
              ? peakTensionLengthProvenance
              : calciumSensitivityLengthProvenance;
          return Object.freeze({
            ...entry,
            ...(scaledValue === null
              ? {}
              : {
                location: `${entry.location}; ${provenanceLabel}`,
              }),
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({
              ...entry.runtime,
              ...(scaledValue === null ? {} : { value: scaledValue }),
            }),
          });
        }),
      ),
      derivedParameters: Object.freeze(
        baseline.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
}

function scaledVentricularLandTref(
  pointId:
    | "ventricular-tref-low"
    | "ventricular-tref-high"
    | "ventricular-tref-high-plus-passive-low",
  scale: number,
): Land2017SourceParameterSet {
  return scaledVentricularLandTrefForScale(
    pointId,
    scale,
    "fixed source-research envelope",
  );
}

function scaledVentricularLandTrefForScale(
  identitySuffix: string,
  scale: number,
  provenanceLabel: string,
): Land2017SourceParameterSet {
  const baseline = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  return scaledWallLandTrefForScaleV1(
    baseline,
    identitySuffix,
    scale,
    provenanceLabel,
  );
}

function scaledWallLandResearchForScalesV1(
  baseline: Land2017SourceParameterSet,
  identitySuffix: string,
  activeTensionScale: number,
  distortionTransientScale: number,
  activeTensionProvenanceLabel: string,
): Land2017SourceParameterSet {
  if (distortionTransientScale === 1) {
    return scaledWallLandTrefForScaleV1(
      baseline,
      identitySuffix,
      activeTensionScale,
      activeTensionProvenanceLabel,
    );
  }
  const values = Object.freeze({
    ...baseline.values,
    Tref: baseline.values.Tref * activeTensionScale,
    Aeff: baseline.values.Aeff * distortionTransientScale,
    phi: baseline.values.phi * distortionTransientScale,
  });
  const distortionProvenanceLabel =
    "fixed common-ventricular proportional Land distortion transient";
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseline.parameterSetId}-${identitySuffix}`,
      sourceId: baseline.sourceId,
      doi: baseline.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(
        baseline.sourceParameters.map((entry) => {
          const scaledValue = entry.parameter === "Tref"
            && activeTensionScale !== 1
            ? values.Tref
            : entry.parameter === "Aeff"
              ? values.Aeff
              : entry.parameter === "phi"
                ? values.phi
                : null;
          const provenanceLabel = entry.parameter === "Tref"
            ? `${activeTensionProvenanceLabel} scale ${activeTensionScale}`
            : `${distortionProvenanceLabel} scale ${distortionTransientScale}`;
          return Object.freeze({
            ...entry,
            ...(scaledValue === null
              ? {}
              : { location: `${entry.location}; ${provenanceLabel}` }),
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({
              ...entry.runtime,
              ...(scaledValue === null ? {} : { value: scaledValue }),
            }),
          });
        }),
      ),
      derivedParameters: Object.freeze(
        baseline.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
}

function scaledWallLandTrefForScaleV1(
  baseline: Land2017SourceParameterSet,
  identitySuffix: string,
  scale: number,
  provenanceLabel: string,
): Land2017SourceParameterSet {
  const values = Object.freeze({
    ...baseline.values,
    Tref: baseline.values.Tref * scale,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseline.parameterSetId}-${identitySuffix}`,
      sourceId: baseline.sourceId,
      doi: baseline.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(
        baseline.sourceParameters.map((entry) =>
          entry.parameter === "Tref"
            ? Object.freeze({
                ...entry,
                location: `${entry.location}; ${provenanceLabel} scale ${scale}`,
                original: Object.freeze({ ...entry.original }),
                runtime: Object.freeze({
                  ...entry.runtime,
                  value: values.Tref,
                }),
              })
            : Object.freeze({
                ...entry,
                original: Object.freeze({ ...entry.original }),
                runtime: Object.freeze({ ...entry.runtime }),
              }),
        ),
      ),
      derivedParameters: Object.freeze(
        baseline.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
}

function validateVentricularContractilityScaleV1(value: number): number {
  const range = MAIN_WIRE_NORMAL_ADULT_VENTRICULAR_CONTRACTILITY_SCALE_RANGE_V1;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    value < range.minimum ||
    value > range.maximum
  ) {
    throw new Error(
      "ventricular contractility scale must be finite within " +
        `[${range.minimum}, ${range.maximum}]`,
    );
  }
  return value;
}

function canonicalScaleIdentityV1(value: number): string {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function exactLaSlsOffParams(
  base: LandSlsWallMaterialParamsV1,
): LandSlsWallMaterialParamsV1 {
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-la-sls-exact-off`,
    sls: Object.freeze({
      ...base.sls,
      parameterSetId: `${base.sls.parameterSetId}-la-exact-off`,
      branchModulusPa: 0,
    }),
  });
}

function atrialGeometry(atriumId: "LA" | "RA") {
  const anatomy = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria[atriumId];
  return Object.freeze({
    wallMaterialVolumeM3: anatomy.wallMaterialVolumeMl * 1e-6,
    referenceCavityBloodVolumeM3:
      anatomy.inverseUnloadedReferenceCavityVolumeMl * 1e-6,
  });
}

function createWallKernel(
  wallId: MainWireFiveWallIdV1,
  params: LandSlsWallMaterialParamsV1,
  evaluatePassive: PassiveEvaluatorV1,
  priorIdentityHash: string,
): MainWireFiveWallLandSlsMaterialKernelV1<LandSlsWallMaterialStateV1> {
  const passiveAtZero = evaluatePassive(0);
  const parameterIdentityHash = stableHash(
    sanitizeForStableHash({
      adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
      priorIdentityHash,
      wallId,
      passiveModelId: passiveAtZero.modelId,
      passiveParameterIdentityHash: passiveAtZero.parameterIdentityHash,
      landSls: landSlsParameterHashInput(params),
    }),
  );
  type TrialInput = Readonly<{
    previousAcceptedState: LandSlsWallMaterialStateV1;
    candidateFiberLogStrain: number;
    candidateFreeCalciumUM: number;
    stepDtSec: number;
  }>;
  const evaluateTrial = (
    input: TrialInput,
    includeReadback: boolean,
  ): MainWireFiveWallMaterialEvaluationV1<LandSlsWallMaterialStateV1> => {
    const passive = evaluatePassive(input.candidateFiberLogStrain);
    const trial = trialLandSlsWallMaterialV1(
      input.previousAcceptedState,
      {
        nextFiberLogStrain: input.candidateFiberLogStrain,
        nextFreeCalciumUM: input.candidateFreeCalciumUM,
        dtSec: input.stepDtSec,
        equilibriumPassive: passive.input,
      },
      params,
    );
    const residualNorm = Math.max(
      Math.abs(trial.landSolverResidualNorm),
      Math.abs(trial.sls.stateResidual),
    );
    return materialEvaluation({
      wallId,
      state: trial.state,
      fiberLogStrain: input.candidateFiberLogStrain,
      stressPa: trial.totalKirchhoffStressPa,
      activeFiberKirchhoffStressPa: trial.activeKirchhoffStressPa,
      algorithmicFiberTangentPa: trial.totalAlgorithmicTangentPa,
      activeFiberAlgorithmicTangentPa: trial.activeAlgorithmicTangentPa,
      iterationCount: trial.landSolverIterations,
      residualNorm,
      finite: trial.finite,
      valid: trial.valid,
      errors: trial.issues,
      readback: includeReadback
        ? wallReadback({
            wallId,
            passive,
            params,
            landActiveKirchhoffStressPa: trial.activeKirchhoffStressPa,
            slsOverstressPa: trial.sls.nextOverstressPa,
            totalKirchhoffStressPa: trial.totalKirchhoffStressPa,
            energyLedger: Object.freeze({
              equilibriumPassiveStoredEnergyDensityJPerM3:
                passive.input.storedEnergyDensityJPerM3,
              slsPreviousStoredEnergyDensityJPerM3:
                trial.sls.previousStoredEnergyDensityJPerM3,
              slsNextStoredEnergyDensityJPerM3:
                trial.sls.nextStoredEnergyDensityJPerM3,
              slsPhysicalDissipationIncrementDensityJPerM3:
                trial.sls.physicalDissipationIncrementDensityJPerM3,
              slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
                trial.sls
                  .backwardEulerNumericalDissipationIncrementDensityJPerM3,
              slsDiscreteEnergyBalanceResidualJPerM3:
                trial.sls.discreteEnergyBalanceResidualJPerM3,
              slsPassive: trial.sls.passive,
              landThermodynamicStoredEnergyClaimed: false as const,
              totalThermodynamicPotentialIncludingLandClaimed: false as const,
            }),
            coldFixedInputIterations: null,
            coldLandMaximumStateUpdate: null,
          })
        : null,
    });
  };
  const evaluateNumericalTrial = (
    input: TrialInput,
  ): MainWireFiveWallMaterialEvaluationV1<LandSlsWallMaterialStateV1> => {
    const passive = evaluatePassive(input.candidateFiberLogStrain);
    const trial = trialLandSlsWallMaterialNumericalV1(
      input.previousAcceptedState,
      {
        nextFiberLogStrain: input.candidateFiberLogStrain,
        nextFreeCalciumUM: input.candidateFreeCalciumUM,
        dtSec: input.stepDtSec,
        equilibriumPassive: passive.input,
      },
      params,
    );
    return materialEvaluation({
      wallId,
      state: trial.state,
      fiberLogStrain: trial.fiberLogStrain,
      stressPa: trial.totalKirchhoffStressPa,
      activeFiberKirchhoffStressPa: trial.activeKirchhoffStressPa,
      algorithmicFiberTangentPa: trial.totalAlgorithmicTangentPa,
      activeFiberAlgorithmicTangentPa: trial.activeAlgorithmicTangentPa,
      iterationCount: trial.landSolverIterations,
      residualNorm: trial.residualNorm,
      finite: true,
      valid: true,
      errors: [],
      readback: null,
    });
  };
  return Object.freeze({
    modelId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    parameterSetId: `${params.parameterSetId}-${wallId}`,
    parameterIdentityHash,
    topology:
      "Land-active-plus-equilibrium-passive-plus-parallel-one-state-SLS" as const,
    stateCodec: LAND_SLS_STATE_CODEC,
    acceptedStateInputMode: "trusted-read-only" as const,
    evaluationStateOwnershipMode: "exclusive-result" as const,
    initializeColdAtFixedInput: ({ fiberLogStrain, freeCalciumUM }) => {
      const passive = evaluatePassive(fiberLogStrain);
      const cold = initializeLandSlsWallAtFixedInputV1(
        fiberLogStrain,
        freeCalciumUM,
        params,
      );
      const accepted = evaluateAcceptedLandSlsWallStateV1(
        cold.state,
        passive.input,
        params,
      );
      const errors = [
        ...(cold.converged
          ? []
          : ["Land fixed-input cold iteration did not converge"]),
        ...accepted.issues,
      ];
      const landStretch = Math.exp(fiberLogStrain) * params.landSlackStretch;
      const activeNominalTangentPa =
        computeLand2017SteadyStateTangentPaFromSolvedState(
          cold.state.landState,
          freeCalciumUM,
          landStretch - 1,
          params.landEquationParameters,
        );
      const activeKirchhoffTangentPa =
        params.orientationFraction01 *
        params.viableActiveFraction01 *
        (landStretch * accepted.activeNominalStressPa +
          landStretch * landStretch * activeNominalTangentPa);
      return materialEvaluation({
        wallId,
        state: cold.state,
        fiberLogStrain,
        stressPa: accepted.totalKirchhoffStressPa,
        activeFiberKirchhoffStressPa: accepted.activeKirchhoffStressPa,
        algorithmicFiberTangentPa:
          passive.input.tangentPa + activeKirchhoffTangentPa,
        activeFiberAlgorithmicTangentPa: activeKirchhoffTangentPa,
        iterationCount: cold.fixedInputIterations,
        residualNorm: cold.maximumStateUpdate,
        finite: accepted.finite && Number.isFinite(cold.maximumStateUpdate),
        valid: cold.converged && accepted.valid,
        errors,
        readback: wallReadback({
          wallId,
          passive,
          params,
          landActiveKirchhoffStressPa: accepted.activeKirchhoffStressPa,
          slsOverstressPa: accepted.slsOverstressPa,
          totalKirchhoffStressPa: accepted.totalKirchhoffStressPa,
          energyLedger: zeroSlsEnergyLedger(passive.input),
          coldFixedInputIterations: cold.fixedInputIterations,
          coldLandMaximumStateUpdate: cold.maximumStateUpdate,
        }),
      });
    },
    evaluateTrialFromAccepted: (input) => evaluateTrial(input, true),
    evaluateNumericalTrialFromAccepted: evaluateNumericalTrial,
  });
}

function createMoyerPassiveEvaluator(
  compiled: CompiledMoyer2015AtrialEquibiaxialPassiveV1,
): PassiveEvaluatorV1 {
  return (fiberLogStrain) => {
    const evaluated = evaluateMoyer2015AtrialEquibiaxialPassiveV1(
      fiberLogStrain,
      compiled,
    );
    return Object.freeze({
      modelId: evaluated.modelId,
      parameterIdentityHash: evaluated.parameterIdentityHash,
      input: Object.freeze({
        stressPa: evaluated.equilibriumKirchhoffStressPa,
        tangentPa: evaluated.dStressDFiberLogStrainPa,
        storedEnergyDensityJPerM3: evaluated.storedEnergyDensityJPerM3,
      }),
    });
  };
}

function createKlotzPassiveEvaluator(
  compiled: CompiledEquilibriumOneFiberPassiveV1,
): PassiveEvaluatorV1 {
  return (fiberLogStrain) => {
    const evaluated = evaluateEquilibriumOneFiberPassiveV1(
      fiberLogStrain,
      compiled,
    );
    return Object.freeze({
      modelId: evaluated.modelId,
      parameterIdentityHash: evaluated.parameterIdentityHash,
      input: Object.freeze({
        stressPa: evaluated.equilibriumKirchhoffStressPa,
        tangentPa: evaluated.dStressDFiberLogStrainPa,
        storedEnergyDensityJPerM3: evaluated.storedEnergyDensityJPerM3,
      }),
    });
  };
}

function scaledPassiveEvaluatorV1(
  base: PassiveEvaluatorV1,
  scale: number,
  wallId: MainWireFiveWallIdV1,
): PassiveEvaluatorV1 {
  return (fiberLogStrain) => {
    const evaluated = base(fiberLogStrain);
    return Object.freeze({
      modelId: evaluated.modelId,
      parameterIdentityHash: stableHash(
        sanitizeForStableHash({
          sourceParameterIdentityHash: evaluated.parameterIdentityHash,
          wallId,
          equilibriumPassiveScale: scale,
        }),
      ),
      input: Object.freeze({
        stressPa: evaluated.input.stressPa * scale,
        tangentPa: evaluated.input.tangentPa * scale,
        storedEnergyDensityJPerM3:
          evaluated.input.storedEnergyDensityJPerM3 * scale,
      }),
    });
  };
}

function materialEvaluation(
  input: Readonly<{
    wallId: MainWireFiveWallIdV1;
    state: LandSlsWallMaterialStateV1;
    fiberLogStrain: number;
    stressPa: number;
    activeFiberKirchhoffStressPa: number;
    algorithmicFiberTangentPa: number;
    activeFiberAlgorithmicTangentPa: number;
    iterationCount: number;
    residualNorm: number;
    finite: boolean;
    valid: boolean;
    errors: readonly string[];
    readback: MainWireNormalAdultWallMaterialReadbackV1 | null;
  }>,
): MainWireFiveWallMaterialEvaluationV1<LandSlsWallMaterialStateV1> {
  const finite =
    input.finite &&
    [
      input.fiberLogStrain,
      input.stressPa,
      input.activeFiberKirchhoffStressPa,
      input.residualNorm,
      input.algorithmicFiberTangentPa,
      input.activeFiberAlgorithmicTangentPa,
    ].every(Number.isFinite);
  return Object.freeze({
    // Cold/trial evaluation created this state exclusively for this result.
    // The material-kernel capability lets the provider retain it without a
    // second typed-array copy; public mechanics boundaries still snapshot it.
    state: input.state,
    fiberLogStrain: input.fiberLogStrain,
    fiberKirchhoffStressPa: input.stressPa,
    activeFiberKirchhoffStressPa: input.activeFiberKirchhoffStressPa,
    algorithmicFiberTangentPa: input.algorithmicFiberTangentPa,
    activeFiberAlgorithmicTangentPa: input.activeFiberAlgorithmicTangentPa,
    iterationCount: input.iterationCount,
    residualNorm: input.residualNorm,
    finite,
    valid: finite && input.valid && input.errors.length === 0,
    errors: Object.freeze([...input.errors]),
    warnings: Object.freeze([]),
    readback: input.readback,
  });
}

function wallReadback(
  input: Readonly<{
    wallId: MainWireFiveWallIdV1;
    passive: PassiveEvaluationV1;
    params: LandSlsWallMaterialParamsV1;
    landActiveKirchhoffStressPa: number;
    slsOverstressPa: number;
    totalKirchhoffStressPa: number;
    energyLedger: MainWireNormalAdultWallEnergyLedgerV1;
    coldFixedInputIterations: number | null;
    coldLandMaximumStateUpdate: number | null;
  }>,
): MainWireNormalAdultWallMaterialReadbackV1 {
  return Object.freeze({
    adapterId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_ID,
    wallId: input.wallId,
    passiveModelId: input.passive.modelId,
    passiveParameterIdentityHash: input.passive.parameterIdentityHash,
    landParameterSetStableHash:
      input.params.landEquationParameters.parameterSetStableHash,
    landActiveKirchhoffStressPa: input.landActiveKirchhoffStressPa,
    slsOverstressPa: input.slsOverstressPa,
    totalKirchhoffStressPa: input.totalKirchhoffStressPa,
    energyLedger: input.energyLedger,
    coldFixedInputIterations: input.coldFixedInputIterations,
    coldLandMaximumStateUpdate: input.coldLandMaximumStateUpdate,
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_ADAPTER_V1_CLAIM,
  });
}

function zeroSlsEnergyLedger(
  passive: LandSlsWallEquilibriumPassiveInputV1,
): MainWireNormalAdultWallEnergyLedgerV1 {
  return Object.freeze({
    equilibriumPassiveStoredEnergyDensityJPerM3:
      passive.storedEnergyDensityJPerM3,
    slsPreviousStoredEnergyDensityJPerM3: 0,
    slsNextStoredEnergyDensityJPerM3: 0,
    slsPhysicalDissipationIncrementDensityJPerM3: 0,
    slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0,
    slsDiscreteEnergyBalanceResidualJPerM3: 0,
    slsPassive: true,
    landThermodynamicStoredEnergyClaimed: false,
    totalThermodynamicPotentialIncludingLandClaimed: false,
  });
}

function landSlsParameterHashInput(params: LandSlsWallMaterialParamsV1) {
  return {
    parameterSetId: params.parameterSetId,
    landParameterSetStableHash:
      params.landEquationParameters.parameterSetStableHash,
    landSlackStretch: params.landSlackStretch,
    orientationFraction01: params.orientationFraction01,
    viableActiveFraction01: params.viableActiveFraction01,
    sls: params.sls,
  };
}

function encodeLandSlsState(
  state: LandSlsWallMaterialStateV1,
): WholeHeartMechanicsSerializableValueV1 {
  const cloned = cloneLandSlsWallMaterialStateV1(state);
  return Object.freeze({
    landState: Object.freeze(Array.from(cloned.landState)),
    slsState: Object.freeze({ ...cloned.slsState }),
    previousFiberLogStrain: cloned.previousFiberLogStrain,
    previousFreeCalciumUM: cloned.previousFreeCalciumUM,
  });
}

function decodeLandSlsState(
  encoded: WholeHeartMechanicsSerializableValueV1,
): LandSlsWallMaterialStateV1 {
  if (
    encoded === null ||
    Array.isArray(encoded) ||
    typeof encoded !== "object"
  ) {
    throw new Error("encoded Land/SLS wall state must be a record");
  }
  const record = encoded as Record<
    string,
    WholeHeartMechanicsSerializableValueV1
  >;
  assertExactKeys(
    record,
    [
      "landState",
      "slsState",
      "previousFiberLogStrain",
      "previousFreeCalciumUM",
    ],
    "encoded Land/SLS wall state",
  );
  const landState = record.landState;
  const slsState = record.slsState;
  if (
    !Array.isArray(landState) ||
    landState.length !== 6 ||
    !landState.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  )
    throw new Error("encoded Land state must contain six finite numbers");
  if (
    slsState === null ||
    Array.isArray(slsState) ||
    typeof slsState !== "object"
  ) {
    throw new Error("encoded SLS state must be a record");
  }
  const slsRecord = slsState as Record<
    string,
    WholeHeartMechanicsSerializableValueV1
  >;
  assertExactKeys(slsRecord, ["viscousLogStrain"], "encoded SLS state");
  const viscous = slsRecord.viscousLogStrain;
  const previousFiberLogStrain = record.previousFiberLogStrain;
  const previousFreeCalciumUM = record.previousFreeCalciumUM;
  for (const [label, value] of Object.entries({
    viscousLogStrain: viscous,
    previousFiberLogStrain,
    previousFreeCalciumUM,
  })) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`encoded ${label} must be finite`);
    }
  }
  if ((previousFreeCalciumUM as number) < 0) {
    throw new Error("encoded previousFreeCalciumUM must be nonnegative");
  }
  return cloneLandSlsWallMaterialStateV1({
    landState: Float64Array.from(landState as number[]),
    slsState: Object.freeze({ viscousLogStrain: viscous as number }),
    previousFiberLogStrain: previousFiberLogStrain as number,
    previousFreeCalciumUM: previousFreeCalciumUM as number,
  });
}

function fiveWallRecord<T>(
  build: (wallId: MainWireFiveWallIdV1) => T,
): MainWireFiveWallRecordV1<T> {
  const wallIds: readonly MainWireFiveWallIdV1[] = [
    "LA",
    "LVFW",
    "SEP",
    "RVFW",
    "RA",
  ];
  return Object.freeze(
    Object.fromEntries(wallIds.map((wallId) => [wallId, build(wallId)])),
  ) as MainWireFiveWallRecordV1<T>;
}

export function asMainWireFiveWallFreeCalciumDriveV1(
  values: Readonly<Record<MainWireFiveWallIdV1, number>>,
): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze({ ...values }),
  });
}

function assertExactKeys(
  value: Readonly<Record<string, unknown>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  )
    throw new Error(`${label} has an unexpected schema`);
}
