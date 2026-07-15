import {
  PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
  PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
  evaluateAtrialOneFiberGeometryV1,
  type AtrialOneFiberGeometryPriorV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import type {
  SignedFlowLossParametersV1,
  ValveLossParametersV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import type { CanonicalSha256HexProvider } from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  bindPhaseA1PassiveSlsFromTissueManifestV1,
  type PhaseA1ManifestBoundPassiveSlsV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";
import {
  buildPhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestBundleV1,
  type PhaseA1TissueManifestV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  buildFourChamberNewtonScaleRegistryV1,
  type FourChamberNewtonScaleRegistryV1,
} from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import {
  computeIntrapericardialHeartVolumeM3V1,
  evaluateCommonPericardiumV1,
  type CommonPericardiumOutputV1,
  type CommonPericardiumParametersV1,
} from "@/engine/myocardium/fourChamberV1/pericardium/commonPericardiumV1";
import {
  BLOOD_COMPARTMENT_IDS,
  INERTIAL_FLOW_IDS,
  WALL_IDS,
  type AlgebraicFlowId,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import { evaluateSignedSphericalCapVolumeV1 } from "@/engine/myocardium/fourChamberV1/triseg/signedSphericalCapV1";
import type { LinearVascularComplianceParametersV1 } from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

export const SYMMETRIC_CLOSED_LOOP_TARGET_TRANSMURAL_PRESSURE_PA_V1 =
  1_000 as const;
export const SYMMETRIC_CLOSED_LOOP_INITIAL_JUNCTION_RADIUS_M_V1 = 0.03 as const;
export const SYMMETRIC_CLOSED_LOOP_VENTRICULAR_WALL_VOLUME_M3_V1 =
  20e-6 as const;

export const SYMMETRIC_CLOSED_LOOP_VASCULAR_COMPARTMENT_IDS_V1 = Object.freeze([
  "SA",
  "SV",
  "PA",
  "PV",
] as const);
export type SymmetricClosedLoopVascularCompartmentIdV1 =
  (typeof SYMMETRIC_CLOSED_LOOP_VASCULAR_COMPARTMENT_IDS_V1)[number];

export const SYMMETRIC_CLOSED_LOOP_VALVE_FLOW_IDS_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);
export type SymmetricClosedLoopValveFlowIdV1 =
  (typeof SYMMETRIC_CLOSED_LOOP_VALVE_FLOW_IDS_V1)[number];

export const SYMMETRIC_CLOSED_LOOP_INLET_FLOW_IDS_V1 = Object.freeze([
  "Q_VC",
  "Q_PV",
] as const);
export type SymmetricClosedLoopInletFlowIdV1 =
  (typeof SYMMETRIC_CLOSED_LOOP_INLET_FLOW_IDS_V1)[number];

export type SymmetricClosedLoopInitialStateV1 = Readonly<{
  timeSec: 0;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
  triSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
}>;

export type SymmetricClosedLoopTriSegReferenceV1 = Readonly<{
  freeWallSignedCapHeightM: Readonly<Record<"LVFW" | "RVFW", number>>;
  walls: Readonly<
    Record<TriSegWallId, PublishedTriSegWallGeometryParametersV1>
  >;
  referenceAreaDerivation: "A_ref=A_m*exp(-2*(z^2/12+0.019*z^4)); published-Taylor fiber strain is zero";
}>;

export type SymmetricClosedLoopMaterialManifestReferenceV1 = Readonly<{
  tissueClass: "atrial" | "ventricular";
  tissueManifestSha256: string;
  tissueBundleSha256: string;
  targetPackSha256: string;
  passivePriorId: string;
  slsPriorId: string;
  completeParameterParity: true;
}>;

export type SymmetricClosedLoopMaterialManifestReferencesV1 = Readonly<{
  tissueBundleSha256: string;
  atrial: SymmetricClosedLoopMaterialManifestReferenceV1;
  ventricular: SymmetricClosedLoopMaterialManifestReferenceV1;
}>;

export type SymmetricClosedLoopValveNumericsV1 = Readonly<{
  openAreaM2ByValve: Readonly<Record<SymmetricClosedLoopValveFlowIdV1, number>>;
  numericalReverseAreaM2ByValve: Readonly<
    Record<SymmetricClosedLoopValveFlowIdV1, number>
  >;
  pressureGateWidthPaByValve: Readonly<
    Record<SymmetricClosedLoopValveFlowIdV1, number>
  >;
  flowSmoothingM3PerSecByValve: Readonly<
    Record<SymmetricClosedLoopValveFlowIdV1, number>
  >;
}>;

export type SymmetricClosedLoopScaffoldBuildInputV1 = Readonly<{
  sha256Hex: CanonicalSha256HexProvider;
  referenceCenteredGeometryEvidenceId: string;
  valveNumerics: SymmetricClosedLoopValveNumericsV1;
}>;

export type SymmetricClosedLoopScaffoldV1 = Readonly<{
  targetTransmuralPressurePa: typeof SYMMETRIC_CLOSED_LOOP_TARGET_TRANSMURAL_PRESSURE_PA_V1;
  junctionRadiusM: typeof SYMMETRIC_CLOSED_LOOP_INITIAL_JUNCTION_RADIUS_M_V1;
  ventricularWallVolumeM3: typeof SYMMETRIC_CLOSED_LOOP_VENTRICULAR_WALL_VOLUME_M3_V1;
  phaseA1TissueManifestBundle: PhaseA1TissueManifestBundleV1;
  atrialMaterial: PhaseA1ManifestBoundPassiveSlsV1;
  ventricularMaterial: PhaseA1ManifestBoundPassiveSlsV1;
  passiveSlsMaterialByWall: Readonly<
    Record<FourChamberWallId, PhaseA1ManifestBoundPassiveSlsV1>
  >;
  atrialGeometryPriorByChamber: Readonly<
    Record<"LA" | "RA", AtrialOneFiberGeometryPriorV1>
  >;
  triSegReference: SymmetricClosedLoopTriSegReferenceV1;
  initialState: SymmetricClosedLoopInitialStateV1;
  initialTriSegGeometry: PublishedTriSegGeometryV1;
  targetFiberStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  valveLossParametersByFlow: Readonly<
    Record<SymmetricClosedLoopValveFlowIdV1, ValveLossParametersV1>
  >;
  inletLossParametersByFlow: Readonly<
    Record<SymmetricClosedLoopInletFlowIdV1, SignedFlowLossParametersV1>
  >;
  vascularComplianceParametersByCompartment: Readonly<
    Record<
      SymmetricClosedLoopVascularCompartmentIdV1,
      LinearVascularComplianceParametersV1
    >
  >;
  peripheralResistancePaSecPerM3ByFlow: Readonly<
    Record<AlgebraicFlowId, number>
  >;
  initialIntrapericardialHeartVolumeM3: number;
  pericardiumParameters: CommonPericardiumParametersV1;
  initialPericardium: CommonPericardiumOutputV1;
  intrathoracicPressurePa: 0;
  materialManifestReferences: SymmetricClosedLoopMaterialManifestReferencesV1;
  newtonScaleRegistry: FourChamberNewtonScaleRegistryV1;
}>;

/** Builds an active-law-independent, symmetric closed-loop test scaffold. */
export function buildSymmetricClosedLoopScaffoldV1(
  input: SymmetricClosedLoopScaffoldBuildInputV1,
): SymmetricClosedLoopScaffoldV1 {
  const tissueBundle = buildPhaseA1TissueManifestBundleV1(input.sha256Hex);
  const atrialMaterial = bindPhaseA1PassiveSlsFromTissueManifestV1(
    tissueBundle,
    "atrial",
    input.sha256Hex,
  );
  const ventricularMaterial = bindPhaseA1PassiveSlsFromTissueManifestV1(
    tissueBundle,
    "ventricular",
    input.sha256Hex,
  );
  const passiveSlsMaterialByWall = freezeWallRecord((wallId) =>
    wallId === "LA" || wallId === "RA" ? atrialMaterial : ventricularMaterial,
  );

  const junctionRadiusM = SYMMETRIC_CLOSED_LOOP_INITIAL_JUNCTION_RADIUS_M_V1;
  const freeWallHeightMagnitudeM = Math.sqrt(3) * junctionRadiusM;
  const positiveFreeWallCapVolumeM3 = evaluateSignedSphericalCapVolumeV1(
    freeWallHeightMagnitudeM,
    junctionRadiusM,
  );
  const ventricularWallVolumeM3 =
    SYMMETRIC_CLOSED_LOOP_VENTRICULAR_WALL_VOLUME_M3_V1;
  const ventricularCavityVolumeM3 =
    positiveFreeWallCapVolumeM3 -
    0.5 * ventricularWallVolumeM3 -
    0.5 * ventricularWallVolumeM3;
  requirePositiveFinite(ventricularCavityVolumeM3, "ventricularCavityVolumeM3");

  const freeWallMidwallAreaM2 =
    Math.PI *
    (freeWallHeightMagnitudeM * freeWallHeightMagnitudeM +
      junctionRadiusM * junctionRadiusM);
  const freeWallCurvatureMagnitudePerM =
    (2 * freeWallHeightMagnitudeM) /
    (freeWallHeightMagnitudeM * freeWallHeightMagnitudeM +
      junctionRadiusM * junctionRadiusM);
  const freeWallAbsZ =
    (1.5 * freeWallCurvatureMagnitudePerM * ventricularWallVolumeM3) /
    freeWallMidwallAreaM2;
  const freeWallReferenceAreaM2 = taylorZeroStrainReferenceAreaM2(
    freeWallMidwallAreaM2,
    freeWallAbsZ,
  );
  const septalMidwallAreaM2 = Math.PI * junctionRadiusM * junctionRadiusM;
  const triSegWalls = Object.freeze({
    LVFW: Object.freeze({
      wallMaterialVolumeM3: ventricularWallVolumeM3,
      referenceMidwallAreaM2: freeWallReferenceAreaM2,
    }),
    SEP: Object.freeze({
      wallMaterialVolumeM3: ventricularWallVolumeM3,
      referenceMidwallAreaM2: taylorZeroStrainReferenceAreaM2(
        septalMidwallAreaM2,
        0,
      ),
    }),
    RVFW: Object.freeze({
      wallMaterialVolumeM3: ventricularWallVolumeM3,
      referenceMidwallAreaM2: freeWallReferenceAreaM2,
    }),
  }) satisfies Readonly<
    Record<TriSegWallId, PublishedTriSegWallGeometryParametersV1>
  >;
  const triSegReference: SymmetricClosedLoopTriSegReferenceV1 = Object.freeze({
    freeWallSignedCapHeightM: Object.freeze({
      LVFW: -freeWallHeightMagnitudeM,
      RVFW: freeWallHeightMagnitudeM,
    }),
    walls: triSegWalls,
    referenceAreaDerivation:
      "A_ref=A_m*exp(-2*(z^2/12+0.019*z^4)); published-Taylor fiber strain is zero",
  });

  const atrialGeometryPriorByChamber = Object.freeze({
    LA: PHASE_A1_LA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
    RA: PHASE_A1_RA_SELF_SIMILAR_GEOMETRY_PRIOR_V1,
  });
  const bloodVolumesM3 = freezeBloodVolumeRecord({
    LA: atrialGeometryPriorByChamber.LA.referenceCavityVolumeM3,
    LV: ventricularCavityVolumeM3,
    SA: 500e-6,
    SV: 500e-6,
    RA: atrialGeometryPriorByChamber.RA.referenceCavityVolumeM3,
    RV: ventricularCavityVolumeM3,
    PA: 500e-6,
    PV: 500e-6,
  });
  const initialState: SymmetricClosedLoopInitialStateV1 = Object.freeze({
    timeSec: 0,
    bloodVolumesM3,
    inertialFlowsM3PerSec: freezeInertialFlowRecord(() => 0),
    slsAlphaVByWall: freezeWallRecord(() => 0 as const),
    triSegCoordinates: Object.freeze({ V_m_S: 0, y_m: junctionRadiusM }),
  });

  const initialTriSegGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: initialState.triSegCoordinates.V_m_S,
    junctionRadiusM: initialState.triSegCoordinates.y_m,
    walls: triSegWalls,
  });
  assertClose(
    initialTriSegGeometry.walls.LVFW.signedCapHeightM,
    triSegReference.freeWallSignedCapHeightM.LVFW,
    128 * Number.EPSILON,
    "initial LVFW cap height",
  );
  assertClose(
    initialTriSegGeometry.walls.RVFW.signedCapHeightM,
    triSegReference.freeWallSignedCapHeightM.RVFW,
    128 * Number.EPSILON,
    "initial RVFW cap height",
  );

  const targetPressurePa =
    SYMMETRIC_CLOSED_LOOP_TARGET_TRANSMURAL_PRESSURE_PA_V1;
  const commonRepresentativeTensionNPerM =
    (targetPressurePa * junctionRadiusM) / Math.sqrt(3);
  const ventricularTargetStressPa = Object.freeze(
    Object.fromEntries(
      (["LVFW", "SEP", "RVFW"] as const).map((wallId) => {
        const wall = initialTriSegGeometry.walls[wallId];
        const z2 =
          wall.thicknessCurvatureRatioZ * wall.thicknessCurvatureRatioZ;
        const taylorTensionFactor = 1 + z2 / 3 + (z2 * z2) / 5;
        const targetStressPa =
          (commonRepresentativeTensionNPerM * 2 * wall.midwallAreaM2) /
          (wall.parameters.wallMaterialVolumeM3 * taylorTensionFactor);
        return [
          wallId,
          requirePositiveFinite(targetStressPa, `${wallId}.targetStressPa`),
        ];
      }),
    ),
  ) as Readonly<Record<TriSegWallId, number>>;
  const atrialGeometryAtReference = Object.freeze({
    LA: evaluateAtrialOneFiberGeometryV1(
      bloodVolumesM3.LA,
      atrialGeometryPriorByChamber.LA,
    ),
    RA: evaluateAtrialOneFiberGeometryV1(
      bloodVolumesM3.RA,
      atrialGeometryPriorByChamber.RA,
    ),
  });
  const atrialTargetStressPa = Object.freeze({
    LA:
      targetPressurePa /
      (atrialGeometryAtReference.LA.wallReferenceMaterialVolumeM3 *
        atrialGeometryAtReference.LA.dFiberLogStrainDCavityVolumePerM3),
    RA:
      targetPressurePa /
      (atrialGeometryAtReference.RA.wallReferenceMaterialVolumeM3 *
        atrialGeometryAtReference.RA.dFiberLogStrainDCavityVolumePerM3),
  });
  const targetFiberStressPaByWall = Object.freeze({
    LA: requirePositiveFinite(atrialTargetStressPa.LA, "LA.targetStressPa"),
    RA: requirePositiveFinite(atrialTargetStressPa.RA, "RA.targetStressPa"),
    LVFW: ventricularTargetStressPa.LVFW,
    SEP: ventricularTargetStressPa.SEP,
    RVFW: ventricularTargetStressPa.RVFW,
  });

  const valveLossParametersByFlow = freezeValveRecord((flowId) =>
    Object.freeze({
      openAreaM2: requirePositiveFinite(
        input.valveNumerics.openAreaM2ByValve[flowId],
        `valveNumerics.openAreaM2ByValve.${flowId}`,
      ),
      physiologicalRegurgitantAreaM2: 0,
      numericalReverseAreaM2: requirePositiveFinite(
        input.valveNumerics.numericalReverseAreaM2ByValve[flowId],
        `valveNumerics.numericalReverseAreaM2ByValve.${flowId}`,
      ),
      pressureGateWidthPa: requirePositiveFinite(
        input.valveNumerics.pressureGateWidthPaByValve[flowId],
        `valveNumerics.pressureGateWidthPaByValve.${flowId}`,
      ),
      bloodDynamicViscosityPaSec: 0.0035,
      bloodDensityKgPerM3: 1_060,
      viscousEffectiveLengthM: 0.01,
      inertialEffectiveLengthM: 0.01,
      inertialReferenceAreaM2: requirePositiveFinite(
        input.valveNumerics.openAreaM2ByValve[flowId],
        `valveNumerics.openAreaM2ByValve.${flowId}`,
      ),
      flowSmoothingM3PerSec: requirePositiveFinite(
        input.valveNumerics.flowSmoothingM3PerSecByValve[flowId],
        `valveNumerics.flowSmoothingM3PerSecByValve.${flowId}`,
      ),
    }),
  );
  const inletLossParametersByFlow = freezeInletRecord(() =>
    Object.freeze({
      inertancePaSec2PerM3: 2e4,
      linearResistancePaSecPerM3: 1e6,
      quadraticResistancePaSec2PerM6: 1e9,
      flowSmoothingM3PerSec: 1e-9,
    }),
  );

  const vascularComplianceParametersByCompartment = freezeVascularRecord(() =>
    Object.freeze({
      unstressedVolumeM3: 400e-6,
      complianceM3PerPa: 100e-9,
      externalPressurePa: 0,
    }),
  );
  const peripheralResistancePaSecPerM3ByFlow = Object.freeze({
    Q_sys: 5e6,
    Q_pul: 5e6,
  });

  const initialIntrapericardialHeartVolumeM3 =
    computeIntrapericardialHeartVolumeM3V1({
      leftAtrialBloodVolumeM3: bloodVolumesM3.LA,
      leftVentricularBloodVolumeM3: bloodVolumesM3.LV,
      rightAtrialBloodVolumeM3: bloodVolumesM3.RA,
      rightVentricularBloodVolumeM3: bloodVolumesM3.RV,
      wallMaterialVolumesM3: [
        atrialGeometryPriorByChamber.LA.wallReferenceMaterialVolumeM3,
        atrialGeometryPriorByChamber.RA.wallReferenceMaterialVolumeM3,
        ventricularWallVolumeM3,
        ventricularWallVolumeM3,
        ventricularWallVolumeM3,
      ],
    });
  const pericardiumParameters: CommonPericardiumParametersV1 = Object.freeze({
    referenceHeartVolumeM3: 1.01 * initialIntrapericardialHeartVolumeM3,
    exponentialPressureScalePa: 500,
    exponentialStiffness: 8,
    effusionPressurePa: 0,
  });
  const initialPericardium = evaluateCommonPericardiumV1(
    pericardiumParameters,
    initialIntrapericardialHeartVolumeM3,
  );
  if (
    initialPericardium.smoothingBranch !== "zero" ||
    initialPericardium.excessPressurePa !== 0
  ) {
    throw new Error(
      "Symmetric scaffold must start with the pericardium disengaged",
    );
  }

  const materialManifestReferences = materialManifestReferencesV1(
    tissueBundle,
    atrialMaterial,
    ventricularMaterial,
  );
  const newtonScaleRegistry = buildFourChamberNewtonScaleRegistryV1(
    {
      referenceBloodVolumesM3: bloodVolumesM3,
      landDistortionCoefficientsByWall: freezeWallRecord((wallId) => {
        const manifest =
          wallId === "LA" || wallId === "RA"
            ? tissueBundle.atrialManifest
            : tissueBundle.ventricularManifest;
        return Object.freeze({
          Aw: manifestParameterValue(manifest, "derived", "land.Aw"),
          As: manifestParameterValue(manifest, "derived", "land.As"),
        });
      }),
      tissueStressInputsByWall: freezeWallRecord((wallId) => {
        const material = passiveSlsMaterialByWall[wallId];
        const manifest =
          wallId === "LA" || wallId === "RA"
            ? tissueBundle.atrialManifest
            : tissueBundle.ventricularManifest;
        return Object.freeze({
          landReferenceTensionPa: manifestParameterValue(
            manifest,
            "primitive",
            "land.Tref",
          ),
          passiveTensileStressScalePa: material.compiledPassive.prior.APa,
          compressionStressScalePa: material.compiledPassive.prior.KCompEffPa,
        });
      }),
      triSegInputsByWall: Object.freeze({
        LVFW: Object.freeze({
          wallReferenceMaterialVolumeM3: triSegWalls.LVFW.wallMaterialVolumeM3,
          midwallReferenceAreaM2: triSegWalls.LVFW.referenceMidwallAreaM2,
        }),
        SEP: Object.freeze({
          wallReferenceMaterialVolumeM3: triSegWalls.SEP.wallMaterialVolumeM3,
          midwallReferenceAreaM2: triSegWalls.SEP.referenceMidwallAreaM2,
        }),
        RVFW: Object.freeze({
          wallReferenceMaterialVolumeM3: triSegWalls.RVFW.wallMaterialVolumeM3,
          midwallReferenceAreaM2: triSegWalls.RVFW.referenceMidwallAreaM2,
        }),
      }),
      referenceCenteredGeometryOffsets: Object.freeze({
        septalMidwallVolumeM3: initialState.triSegCoordinates.V_m_S,
        junctionRadiusM: initialState.triSegCoordinates.y_m,
        evidenceId: requireNonEmptyString(
          input.referenceCenteredGeometryEvidenceId,
          "referenceCenteredGeometryEvidenceId",
        ),
      }),
    },
    input.sha256Hex,
  );

  return Object.freeze({
    targetTransmuralPressurePa: targetPressurePa,
    junctionRadiusM,
    ventricularWallVolumeM3,
    phaseA1TissueManifestBundle: tissueBundle,
    atrialMaterial,
    ventricularMaterial,
    passiveSlsMaterialByWall,
    atrialGeometryPriorByChamber,
    triSegReference,
    initialState,
    initialTriSegGeometry,
    targetFiberStressPaByWall,
    valveLossParametersByFlow,
    inletLossParametersByFlow,
    vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow,
    initialIntrapericardialHeartVolumeM3,
    pericardiumParameters,
    initialPericardium,
    intrathoracicPressurePa: 0,
    materialManifestReferences,
    newtonScaleRegistry,
  });
}

function materialManifestReferencesV1(
  bundle: PhaseA1TissueManifestBundleV1,
  atrial: PhaseA1ManifestBoundPassiveSlsV1,
  ventricular: PhaseA1ManifestBoundPassiveSlsV1,
): SymmetricClosedLoopMaterialManifestReferencesV1 {
  const reference = (
    material: PhaseA1ManifestBoundPassiveSlsV1,
  ): SymmetricClosedLoopMaterialManifestReferenceV1 =>
    Object.freeze({
      tissueClass: material.tissueClass,
      tissueManifestSha256: material.tissueManifestSha256,
      tissueBundleSha256: material.tissueBundleSha256,
      targetPackSha256: material.targetPackSha256,
      passivePriorId: material.compiledPassive.prior.priorId,
      slsPriorId: material.compiledSls.prior.priorId,
      completeParameterParity: true,
    });
  return Object.freeze({
    tissueBundleSha256: bundle.contentSha256,
    atrial: reference(atrial),
    ventricular: reference(ventricular),
  });
}

function manifestParameterValue(
  manifest: PhaseA1TissueManifestV1,
  kind: "primitive" | "derived",
  name: string,
): number {
  const groups =
    kind === "primitive"
      ? [
          manifest.land.primitiveParameters,
          manifest.passiveSls.primitiveParameters,
        ]
      : [
          manifest.land.derivedParameters,
          manifest.passiveSls.derivedParameters,
        ];
  const matches = groups.flat().filter((parameter) => parameter.name === name);
  if (matches.length !== 1) {
    throw new Error(
      `${manifest.tissueClass} manifest must contain exactly one ${kind} ${name}`,
    );
  }
  return requireFinite(
    matches[0].runtimeValue,
    `${manifest.tissueClass}.${name}`,
  );
}

function taylorZeroStrainReferenceAreaM2(
  midwallAreaM2: number,
  z: number,
): number {
  requirePositiveFinite(midwallAreaM2, "midwallAreaM2");
  requireFinite(z, "z");
  const z2 = z * z;
  const taylorStrainCorrection = z2 / 12 + 0.019 * z2 * z2;
  return requirePositiveFinite(
    midwallAreaM2 * Math.exp(-2 * taylorStrainCorrection),
    "referenceMidwallAreaM2",
  );
}

function freezeBloodVolumeRecord(
  values: Readonly<Record<BloodCompartmentId, number>>,
): Readonly<Record<BloodCompartmentId, number>> {
  return Object.freeze(
    Object.fromEntries(
      BLOOD_COMPARTMENT_IDS.map((id) => [
        id,
        requirePositiveFinite(values[id], `bloodVolumesM3.${id}`),
      ]),
    ),
  ) as Readonly<Record<BloodCompartmentId, number>>;
}

function freezeWallRecord<Value>(
  value: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(
    Object.fromEntries(WALL_IDS.map((wallId) => [wallId, value(wallId)])),
  ) as Readonly<Record<FourChamberWallId, Value>>;
}

function freezeInertialFlowRecord(
  value: (flowId: InertialFlowId) => number,
): Readonly<Record<InertialFlowId, number>> {
  return Object.freeze(
    Object.fromEntries(
      INERTIAL_FLOW_IDS.map((flowId) => [
        flowId,
        requireFinite(value(flowId), `inertialFlowsM3PerSec.${flowId}`),
      ]),
    ),
  ) as Readonly<Record<InertialFlowId, number>>;
}

function freezeValveRecord<Value>(
  value: (flowId: SymmetricClosedLoopValveFlowIdV1) => Value,
): Readonly<Record<SymmetricClosedLoopValveFlowIdV1, Value>> {
  return Object.freeze({
    Q_MV: value("Q_MV"),
    Q_AoV: value("Q_AoV"),
    Q_TV: value("Q_TV"),
    Q_PuV: value("Q_PuV"),
  });
}

function freezeInletRecord<Value>(
  value: (flowId: SymmetricClosedLoopInletFlowIdV1) => Value,
): Readonly<Record<SymmetricClosedLoopInletFlowIdV1, Value>> {
  return Object.freeze({ Q_VC: value("Q_VC"), Q_PV: value("Q_PV") });
}

function freezeVascularRecord<Value>(
  value: (compartmentId: SymmetricClosedLoopVascularCompartmentIdV1) => Value,
): Readonly<Record<SymmetricClosedLoopVascularCompartmentIdV1, Value>> {
  return Object.freeze({
    SA: value("SA"),
    SV: value("SV"),
    PA: value("PA"),
    PV: value("PV"),
  });
}

function assertClose(
  actual: number,
  expected: number,
  relativeTolerance: number,
  field: string,
): void {
  requireFinite(actual, field);
  requireFinite(expected, `${field}.expected`);
  const error = Math.abs(actual - expected);
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  if (error > relativeTolerance * scale) {
    throw new Error(
      `${field} mismatch: actual=${actual}, expected=${expected}`,
    );
  }
}

function requireNonEmptyString(value: string, field: string): string {
  if (value.trim().length === 0) throw new Error(`${field} must be non-empty`);
  return value;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
