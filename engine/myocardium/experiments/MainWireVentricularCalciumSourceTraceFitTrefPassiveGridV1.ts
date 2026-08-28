import {
  MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1,
  validateAndOwnMainWireFiveWallMechanicsResearchInputsV1,
  type MainWireFiveWallMechanicsResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallMechanicsResearchInputsV1";

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_GRID_V1_ID =
  "main-wire-ventricular-calcium-source-trace-fit-tref-passive-grid-v1" as const;

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_LEVELS_V1 =
  Object.freeze([1, 1.1, 1.2, 1.3] as const);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PASSIVE_LEVELS_V1 =
  Object.freeze([1, 0.875, 0.75] as const);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1 =
  Object.freeze([
    "tref-1p00-passive-1p000",
    "tref-1p00-passive-0p875",
    "tref-1p00-passive-0p750",
    "tref-1p10-passive-1p000",
    "tref-1p10-passive-0p875",
    "tref-1p10-passive-0p750",
    "tref-1p20-passive-1p000",
    "tref-1p20-passive-0p875",
    "tref-1p20-passive-0p750",
    "tref-1p30-passive-1p000",
    "tref-1p30-passive-0p875",
    "tref-1p30-passive-0p750",
  ] as const);

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILE_IDS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitTrefLevelV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_LEVELS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitPassiveLevelV1 =
  (typeof MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PASSIVE_LEVELS_V1)[number];

export type MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1 =
  Readonly<{
    profileId:
      MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1;
    ventricularLandTrefScaleFromBaseline:
      MainWireVentricularCalciumSourceTraceFitTrefLevelV1;
    ventricularEquilibriumPassiveScaleFromBaseline:
      MainWireVentricularCalciumSourceTraceFitPassiveLevelV1;
    ventricularSlsModulusScaleFromBaseline:
      MainWireVentricularCalciumSourceTraceFitPassiveLevelV1;
    wallScope: readonly ["LVFW", "SEP", "RVFW"];
    claim: typeof CLAIM;
  }>;

const CLAIM = Object.freeze({
  role: "fixed-bounded-source-calcium-tref-passive-factorial" as const,
  fullFactorial: true as const,
  fixedProfileNotGenericPatch: true as const,
  ventricularTrefLevels: MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_LEVELS_V1,
  ventricularPassiveLevels:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_PASSIVE_LEVELS_V1,
  commonVentricularWallScope: Object.freeze([
    "LVFW", "SEP", "RVFW",
  ] as const),
  atrialMaterialChanged: false as const,
  passiveEquilibriumStressEnergyTangentScaledTogether: true as const,
  ventricularSlsModulusScaledWithEquilibriumPassive: true as const,
  ventricularSlsTimeConstantChanged: false as const,
  ventricularCalciumDriveChanged: false as const,
  LandStateCountChanged: false as const,
  circulationRuntimeChanged: false as const,
  fixedTotalBloodVolumeChanged: false as const,
  aorticValveAreaOrLawChanged: false as const,
  vascularUnstressedVolumesChanged: false as const,
  numericOutcomeOptimizationOrFit: false as const,
  patientFitOrCanonicalAdoption: false as const,
});

const PROFILES = Object.freeze([
  profile("tref-1p00-passive-1p000", 1, 1),
  profile("tref-1p00-passive-0p875", 1, 0.875),
  profile("tref-1p00-passive-0p750", 1, 0.75),
  profile("tref-1p10-passive-1p000", 1.1, 1),
  profile("tref-1p10-passive-0p875", 1.1, 0.875),
  profile("tref-1p10-passive-0p750", 1.1, 0.75),
  profile("tref-1p20-passive-1p000", 1.2, 1),
  profile("tref-1p20-passive-0p875", 1.2, 0.875),
  profile("tref-1p20-passive-0p750", 1.2, 0.75),
  profile("tref-1p30-passive-1p000", 1.3, 1),
  profile("tref-1p30-passive-0p875", 1.3, 0.875),
  profile("tref-1p30-passive-0p750", 1.3, 0.75),
] satisfies readonly MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1[]);

export const MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_TRACE_FIT_TREF_PASSIVE_PROFILES_V1 =
  PROFILES;

export function resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1(
  profileId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1 {
  const resolved = PROFILES.find((profile) => profile.profileId === profileId);
  if (resolved === undefined) {
    throw new Error(`unsupported source-calcium Tref/passive profile: ${
      String(profileId)}`);
  }
  return resolved;
}

export function resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveMechanicsInputV1(
  profileId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
): MainWireFiveWallMechanicsResearchInputsV1 {
  const resolved =
    resolveMainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1(
      profileId,
    );
  const baseline = MAIN_WIRE_FIVE_WALL_DEFAULT_MECHANICS_RESEARCH_INPUTS_V1;
  return validateAndOwnMainWireFiveWallMechanicsResearchInputsV1({
    ...baseline,
    activeTensionScaleByWall: {
      ...baseline.activeTensionScaleByWall,
      LVFW: resolved.ventricularLandTrefScaleFromBaseline,
      SEP: resolved.ventricularLandTrefScaleFromBaseline,
      RVFW: resolved.ventricularLandTrefScaleFromBaseline,
    },
    passiveStiffnessScaleByWall: {
      ...baseline.passiveStiffnessScaleByWall,
      LVFW: resolved.ventricularEquilibriumPassiveScaleFromBaseline,
      SEP: resolved.ventricularEquilibriumPassiveScaleFromBaseline,
      RVFW: resolved.ventricularEquilibriumPassiveScaleFromBaseline,
    },
  });
}

function profile(
  profileId:
    MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileIdV1,
  ventricularLandTrefScaleFromBaseline:
    MainWireVentricularCalciumSourceTraceFitTrefLevelV1,
  ventricularPassiveScaleFromBaseline:
    MainWireVentricularCalciumSourceTraceFitPassiveLevelV1,
): MainWireVentricularCalciumSourceTraceFitTrefPassiveProfileV1 {
  return Object.freeze({
    profileId,
    ventricularLandTrefScaleFromBaseline,
    ventricularEquilibriumPassiveScaleFromBaseline:
      ventricularPassiveScaleFromBaseline,
    ventricularSlsModulusScaleFromBaseline:
      ventricularPassiveScaleFromBaseline,
    wallScope: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    claim: CLAIM,
  });
}
