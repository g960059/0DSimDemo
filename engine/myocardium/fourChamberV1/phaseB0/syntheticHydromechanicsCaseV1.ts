import {
  evaluateAtrialOneFiberGeometryV1,
  evaluateAtrialOneFiberPressureV1,
  type AtrialOneFiberGeometryPriorV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import type {
  SignedFlowLossParametersV1,
  ValveLossParametersV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import { NORMATIVE_MANIFEST_HASH_ALGORITHM } from "@/engine/myocardium/fourChamberV1/ids";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import type { PhaseA1ManifestBoundPassiveSlsV1 } from "@/engine/myocardium/fourChamberV1/manifests/phaseA1PassiveSlsBindingV1";
import type { PhaseA1TissueManifestBundleV1 } from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import type { FourChamberNewtonScaleRegistryV1 } from "@/engine/myocardium/fourChamberV1/numerics/newtonScaleRegistryV1";
import { evaluateEquilibriumPassiveEnergyV1 } from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import { evaluateOneStateAlphaVSlsContinuousV1 } from "@/engine/myocardium/fourChamberV1/passive/oneStateAlphaVSlsV1";
import {
  evaluateCommonPericardiumV1,
  type CommonPericardiumParametersV1,
} from "@/engine/myocardium/fourChamberV1/pericardium/commonPericardiumV1";
import {
  evaluatePhaseB0SmoothActiveStressDoubleV1,
  type PhaseB0SmoothActiveStressDoubleParametersV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/smoothActiveStressDoubleV1";
import {
  buildPhaseB0ValveNumericalPolicyCandidateV1,
  type PhaseB0ValveFlowIdV1,
  type PhaseB0ValveNumericalPolicyCandidateV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/valveNumericalPolicyV1";
import {
  PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1,
  type PhaseB0MonolithicBeNumericalPolicyV1,
} from "@/engine/myocardium/fourChamberV1/phaseB0/numericalPolicyV1";
import {
  FOUR_CHAMBER_SI_UNITS,
  WALL_IDS,
  type AlgebraicFlowId,
  type BloodCompartmentId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import { evaluatePublishedTriSegTaylorOracle2009V1 } from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  SYMMETRIC_CLOSED_LOOP_INITIAL_JUNCTION_RADIUS_M_V1,
  SYMMETRIC_CLOSED_LOOP_TARGET_TRANSMURAL_PRESSURE_PA_V1,
  SYMMETRIC_CLOSED_LOOP_VENTRICULAR_WALL_VOLUME_M3_V1,
  buildSymmetricClosedLoopScaffoldV1,
} from "@/engine/myocardium/fourChamberV1/testSupport/symmetricClosedLoopScaffoldV1";
import {
  evaluateLinearVascularComplianceV1,
  type LinearVascularComplianceParametersV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

export const PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID =
  "four-chamber-phase-b0-symmetric-initial-rest-hydromechanics-v1" as const;

export const PHASE_B0_SYNTHETIC_INITIAL_TRANSMURAL_PRESSURE_PA_V1 =
  SYMMETRIC_CLOSED_LOOP_TARGET_TRANSMURAL_PRESSURE_PA_V1;
export const PHASE_B0_SYNTHETIC_INITIAL_JUNCTION_RADIUS_M_V1 =
  SYMMETRIC_CLOSED_LOOP_INITIAL_JUNCTION_RADIUS_M_V1;
export const PHASE_B0_SYNTHETIC_VENTRICULAR_WALL_VOLUME_M3_V1 =
  SYMMETRIC_CLOSED_LOOP_VENTRICULAR_WALL_VOLUME_M3_V1;
export const PHASE_B0_SYNTHETIC_ACTIVE_STRESS_PERIOD_SEC_V1 = 0.8 as const;

export const PHASE_B0_VASCULAR_COMPARTMENT_IDS_V1 = Object.freeze([
  "SA",
  "SV",
  "PA",
  "PV",
] as const);
export type PhaseB0VascularCompartmentIdV1 =
  (typeof PHASE_B0_VASCULAR_COMPARTMENT_IDS_V1)[number];

export const PHASE_B0_INLET_FLOW_IDS_V1 = Object.freeze([
  "Q_VC",
  "Q_PV",
] as const);
export type PhaseB0InletFlowIdV1 = (typeof PHASE_B0_INLET_FLOW_IDS_V1)[number];

export type PhaseB0SyntheticInitialStateV1 = Readonly<{
  timeSec: 0;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  slsAlphaVByWall: Readonly<Record<FourChamberWallId, number>>;
  triSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
}>;

export type PhaseB0SyntheticTriSegReferenceV1 = Readonly<{
  freeWallSignedCapHeightM: Readonly<Record<"LVFW" | "RVFW", number>>;
  walls: Readonly<
    Record<TriSegWallId, PublishedTriSegWallGeometryParametersV1>
  >;
  referenceAreaDerivation: "A_ref=A_m*exp(-2*(z^2/12+0.019*z^4)); published-Taylor fiber strain is zero";
}>;

export type PhaseB0SyntheticMaterialManifestReferenceV1 = Readonly<{
  tissueClass: "atrial" | "ventricular";
  tissueManifestSha256: string;
  tissueBundleSha256: string;
  targetPackSha256: string;
  passivePriorId: string;
  slsPriorId: string;
  completeParameterParity: true;
}>;

export type PhaseB0SyntheticMaterialManifestReferencesV1 = Readonly<{
  tissueBundleSha256: string;
  atrial: PhaseB0SyntheticMaterialManifestReferenceV1;
  ventricular: PhaseB0SyntheticMaterialManifestReferenceV1;
}>;

export type PhaseB0SyntheticInitialEquilibriumV1 = Readonly<{
  targetTransmuralPressurePa: 1_000;
  instantaneousMechanicalEquilibrium: true;
  analyticallyZeroFiberLogStrainByWall: Readonly<Record<FourChamberWallId, 0>>;
  evaluatedFiberLogStrainByWall: Readonly<Record<FourChamberWallId, number>>;
  maximumAbsoluteEvaluatedFiberLogStrain: number;
  slsAlphaVEqualsAnalyticFiberLogStrain: true;
  equilibriumPassiveStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  slsOverstressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  targetFiberStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  activeStressAtTimeZeroPaByWall: Readonly<Record<FourChamberWallId, number>>;
  activeStressTimeDerivativeAtTimeZeroPaPerSecByWall: Readonly<
    Record<FourChamberWallId, number>
  >;
  activeNormalizedPulseAtTimeZeroByWall: Readonly<
    Record<FourChamberWallId, number>
  >;
  chamberTransmuralPressurePa: Readonly<
    Record<"LA" | "LV" | "RA" | "RV", number>
  >;
  triSegRepresentativeTensionNPerMByWall: Readonly<
    Record<TriSegWallId, number>
  >;
  triSegEquilibriumResidualNPerM: Readonly<{
    axial: number;
    radial: number;
    euclidean: number;
  }>;
  vascularAbsolutePressurePaByCompartment: Readonly<
    Record<PhaseB0VascularCompartmentIdV1, number>
  >;
  algebraicFlowsM3PerSec: Readonly<Record<AlgebraicFlowId, number>>;
  initialIntrapericardialHeartVolumeM3: number;
  initialPericardialExcessPressurePa: number;
  initialPericardialSmoothingBranch: "zero";
}>;

export type PhaseB0SyntheticHydromechanicsCaseHashPayloadV1 = Readonly<{
  caseId: typeof PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID;
  evidenceClass: "project-synthetic-test-only";
  initialState: PhaseB0SyntheticInitialStateV1;
  atrialGeometryPriorByChamber: Readonly<
    Record<"LA" | "RA", AtrialOneFiberGeometryPriorV1>
  >;
  triSegReference: PhaseB0SyntheticTriSegReferenceV1;
  activeStressParameters: PhaseB0SmoothActiveStressDoubleParametersV1;
  targetFiberStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
  vascularComplianceParametersByCompartment: Readonly<
    Record<PhaseB0VascularCompartmentIdV1, LinearVascularComplianceParametersV1>
  >;
  peripheralResistancePaSecPerM3ByFlow: Readonly<
    Record<AlgebraicFlowId, number>
  >;
  valveNumericalPolicy: PhaseB0ValveNumericalPolicyCandidateV1;
  valveLossParametersByFlow: Readonly<
    Record<PhaseB0ValveFlowIdV1, ValveLossParametersV1>
  >;
  inletLossParametersByFlow: Readonly<
    Record<PhaseB0InletFlowIdV1, SignedFlowLossParametersV1>
  >;
  pericardiumParameters: CommonPericardiumParametersV1;
  intrathoracicPressurePa: 0;
  materialManifestReferences: PhaseB0SyntheticMaterialManifestReferencesV1;
  newtonScaleRegistryContentSha256: string;
  numericalPolicy: PhaseB0MonolithicBeNumericalPolicyV1;
  initialEquilibrium: PhaseB0SyntheticInitialEquilibriumV1;
  testOnly: true;
  physiologicalValidation: false;
  releaseRuntimeReachable: false;
  valveFloorSelectionCompleted: false;
  units: typeof FOUR_CHAMBER_SI_UNITS;
}>;

export type PhaseB0SyntheticHydromechanicsCaseV1 =
  PhaseB0SyntheticHydromechanicsCaseHashPayloadV1 &
    Readonly<{
      phaseA1TissueManifestBundle: PhaseA1TissueManifestBundleV1;
      passiveSlsMaterialByWall: Readonly<
        Record<FourChamberWallId, PhaseA1ManifestBoundPassiveSlsV1>
      >;
      initialTriSegGeometry: PublishedTriSegGeometryV1;
      newtonScaleRegistry: FourChamberNewtonScaleRegistryV1;
      hashAlgorithm: typeof NORMATIVE_MANIFEST_HASH_ALGORITHM;
      contentSha256: string;
    }>;

/**
 * Builds the deliberately symmetric, test-only Phase B0 instantaneous-rest
 * case. It is a hydromechanics integration fixture, not a human baseline.
 */
export function buildPhaseB0SyntheticHydromechanicsCaseV1(
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0SyntheticHydromechanicsCaseV1 {
  const valveOpenAreaM2 = 3e-4;
  const valveNumericalPolicy = buildPhaseB0ValveNumericalPolicyCandidateV1(
    {
      nominalSetId: "phase-b0-symmetric-initial-rest-valves-v1",
      evidenceClass: "project-synthetic-test-only-nominal",
      numericalReverseAreaRatio: 3e-3,
      baselineOpenAreaM2ByValve: freezeValveRecord(() => valveOpenAreaM2),
      pressureGateWidthPaByValve: freezeValveRecord(() => 20),
      flowSmoothingM3PerSecByValve: freezeValveRecord(() => 1e-9),
    },
    sha256Hex,
  );
  const scaffold = buildSymmetricClosedLoopScaffoldV1({
    sha256Hex,
    referenceCenteredGeometryEvidenceId:
      "phase-b0-symmetric-initial-rest-reference-center-v1",
    valveNumerics: Object.freeze({
      openAreaM2ByValve: valveNumericalPolicy.baselineOpenAreaM2ByValve,
      numericalReverseAreaM2ByValve:
        valveNumericalPolicy.absoluteNumericalReverseAreaM2ByValve,
      pressureGateWidthPaByValve:
        valveNumericalPolicy.pressureGateWidthPaByValve,
      flowSmoothingM3PerSecByValve:
        valveNumericalPolicy.flowSmoothingM3PerSecByValve,
    }),
  });
  const {
    targetTransmuralPressurePa: targetPressurePa,
    phaseA1TissueManifestBundle: tissueBundle,
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
    materialManifestReferences,
    newtonScaleRegistry,
  } = scaffold;

  const activeStressParameters: PhaseB0SmoothActiveStressDoubleParametersV1 =
    Object.freeze({
      parameterSetId: "phase-b0-symmetric-initial-rest-active-stress-double-v1",
      evidenceClass: "project-synthetic-test-only",
      periodSec: PHASE_B0_SYNTHETIC_ACTIVE_STRESS_PERIOD_SEC_V1,
      walls: freezeWallRecord((wallId) =>
        Object.freeze({
          baselineStressPa: 0.8 * targetFiberStressPaByWall[wallId],
          pulseAmplitudePa: 0.4 * targetFiberStressPaByWall[wallId],
          peakPhaseFraction: 0.25,
        }),
      ),
      testOnly: true,
      releaseRuntimeReachable: false,
    });
  const activeAtTimeZero = evaluatePhaseB0SmoothActiveStressDoubleV1(
    0,
    activeStressParameters,
  );

  const initialEquilibrium = buildInitialEquilibriumEvidenceV1({
    targetPressurePa,
    initialState,
    targetFiberStressPaByWall,
    activeAtTimeZero,
    passiveSlsMaterialByWall,
    atrialGeometryPriorByChamber,
    initialTriSegGeometry,
    vascularComplianceParametersByCompartment,
    initialIntrapericardialHeartVolumeM3,
    initialPericardium,
  });

  const payload: PhaseB0SyntheticHydromechanicsCaseHashPayloadV1 =
    Object.freeze({
      caseId: PHASE_B0_SYNTHETIC_HYDROMECHANICS_CASE_V1_ID,
      evidenceClass: "project-synthetic-test-only",
      initialState,
      atrialGeometryPriorByChamber,
      triSegReference,
      activeStressParameters,
      targetFiberStressPaByWall,
      vascularComplianceParametersByCompartment,
      peripheralResistancePaSecPerM3ByFlow,
      valveNumericalPolicy,
      valveLossParametersByFlow,
      inletLossParametersByFlow,
      pericardiumParameters,
      intrathoracicPressurePa: 0,
      materialManifestReferences,
      newtonScaleRegistryContentSha256:
        newtonScaleRegistry.registryContentSha256,
      numericalPolicy: PHASE_B0_MONOLITHIC_BE_NUMERICAL_POLICY_V1,
      initialEquilibrium,
      testOnly: true,
      physiologicalValidation: false,
      releaseRuntimeReachable: false,
      valveFloorSelectionCompleted: false,
      units: FOUR_CHAMBER_SI_UNITS,
    });

  return Object.freeze({
    ...payload,
    phaseA1TissueManifestBundle: tissueBundle,
    passiveSlsMaterialByWall,
    initialTriSegGeometry,
    newtonScaleRegistry,
    hashAlgorithm: NORMATIVE_MANIFEST_HASH_ALGORITHM,
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB0SyntheticHydromechanicsCaseHashPayloadV1(
  value: PhaseB0SyntheticHydromechanicsCaseV1,
): PhaseB0SyntheticHydromechanicsCaseHashPayloadV1 {
  return Object.freeze({
    caseId: value.caseId,
    evidenceClass: value.evidenceClass,
    initialState: value.initialState,
    atrialGeometryPriorByChamber: value.atrialGeometryPriorByChamber,
    triSegReference: value.triSegReference,
    activeStressParameters: value.activeStressParameters,
    targetFiberStressPaByWall: value.targetFiberStressPaByWall,
    vascularComplianceParametersByCompartment:
      value.vascularComplianceParametersByCompartment,
    peripheralResistancePaSecPerM3ByFlow:
      value.peripheralResistancePaSecPerM3ByFlow,
    valveNumericalPolicy: value.valveNumericalPolicy,
    valveLossParametersByFlow: value.valveLossParametersByFlow,
    inletLossParametersByFlow: value.inletLossParametersByFlow,
    pericardiumParameters: value.pericardiumParameters,
    intrathoracicPressurePa: value.intrathoracicPressurePa,
    materialManifestReferences: value.materialManifestReferences,
    newtonScaleRegistryContentSha256: value.newtonScaleRegistryContentSha256,
    numericalPolicy: value.numericalPolicy,
    initialEquilibrium: value.initialEquilibrium,
    testOnly: value.testOnly,
    physiologicalValidation: value.physiologicalValidation,
    releaseRuntimeReachable: value.releaseRuntimeReachable,
    valveFloorSelectionCompleted: value.valveFloorSelectionCompleted,
    units: value.units,
  });
}

function buildInitialEquilibriumEvidenceV1(
  input: Readonly<{
    targetPressurePa: 1_000;
    initialState: PhaseB0SyntheticInitialStateV1;
    targetFiberStressPaByWall: Readonly<Record<FourChamberWallId, number>>;
    activeAtTimeZero: ReturnType<
      typeof evaluatePhaseB0SmoothActiveStressDoubleV1
    >;
    passiveSlsMaterialByWall: Readonly<
      Record<FourChamberWallId, PhaseA1ManifestBoundPassiveSlsV1>
    >;
    atrialGeometryPriorByChamber: Readonly<
      Record<"LA" | "RA", AtrialOneFiberGeometryPriorV1>
    >;
    initialTriSegGeometry: PublishedTriSegGeometryV1;
    vascularComplianceParametersByCompartment: Readonly<
      Record<
        PhaseB0VascularCompartmentIdV1,
        LinearVascularComplianceParametersV1
      >
    >;
    initialIntrapericardialHeartVolumeM3: number;
    initialPericardium: ReturnType<typeof evaluateCommonPericardiumV1>;
  }>,
): PhaseB0SyntheticInitialEquilibriumV1 {
  const evaluatedFiberLogStrainByWall = Object.freeze({
    LA: evaluateAtrialOneFiberGeometryV1(
      input.initialState.bloodVolumesM3.LA,
      input.atrialGeometryPriorByChamber.LA,
    ).fiberLogStrain,
    RA: evaluateAtrialOneFiberGeometryV1(
      input.initialState.bloodVolumesM3.RA,
      input.atrialGeometryPriorByChamber.RA,
    ).fiberLogStrain,
    LVFW: input.initialTriSegGeometry.walls.LVFW.fiberLogStrain,
    SEP: input.initialTriSegGeometry.walls.SEP.fiberLogStrain,
    RVFW: input.initialTriSegGeometry.walls.RVFW.fiberLogStrain,
  });
  const maximumAbsoluteEvaluatedFiberLogStrain = Math.max(
    ...WALL_IDS.map((wallId) =>
      Math.abs(evaluatedFiberLogStrainByWall[wallId]),
    ),
  );
  if (maximumAbsoluteEvaluatedFiberLogStrain > 1e-14) {
    throw new Error(
      `Initial Taylor/atrial reference construction did not yield zero strain: ${maximumAbsoluteEvaluatedFiberLogStrain}`,
    );
  }

  const equilibriumPassiveStressPaByWall = freezeWallRecord(
    (wallId) =>
      evaluateEquilibriumPassiveEnergyV1(
        0,
        input.passiveSlsMaterialByWall[wallId].compiledPassive,
      ).equilibriumKirchhoffStressPa,
  );
  const slsOverstressPaByWall = freezeWallRecord(
    (wallId) =>
      evaluateOneStateAlphaVSlsContinuousV1(
        {
          fiberLogStrain: 0,
          fiberLogStrainRatePerSec: 0,
          alphaV: input.initialState.slsAlphaVByWall[wallId],
        },
        input.passiveSlsMaterialByWall[wallId].compiledSls,
      ).overstressPa,
  );
  for (const wallId of WALL_IDS) {
    if (
      equilibriumPassiveStressPaByWall[wallId] !== 0 ||
      slsOverstressPaByWall[wallId] !== 0
    ) {
      throw new Error(
        `${wallId} passive and SLS stress must both be zero at the reference state`,
      );
    }
  }

  const activeStressAtTimeZeroPaByWall = freezeWallRecord(
    (wallId) =>
      input.activeAtTimeZero.walls[wallId].scalarKirchhoffFiberStressPa,
  );
  const activeStressTimeDerivativeAtTimeZeroPaPerSecByWall = freezeWallRecord(
    (wallId) =>
      input.activeAtTimeZero.walls[wallId]
        .scalarKirchhoffFiberStressTimeDerivativePaPerSec,
  );
  const activeNormalizedPulseAtTimeZeroByWall = freezeWallRecord(
    (wallId) => input.activeAtTimeZero.walls[wallId].normalizedPulse,
  );
  for (const wallId of WALL_IDS) {
    assertClose(
      activeNormalizedPulseAtTimeZeroByWall[wallId],
      0.5,
      32 * Number.EPSILON,
      `${wallId}.initial normalized active pulse`,
    );
    assertClose(
      activeStressAtTimeZeroPaByWall[wallId],
      input.targetFiberStressPaByWall[wallId],
      64 * Number.EPSILON,
      `${wallId}.initial active stress`,
    );
    if (!(activeStressTimeDerivativeAtTimeZeroPaPerSecByWall[wallId] > 0)) {
      throw new Error(
        `${wallId} initial active-stress derivative must be nonzero and positive`,
      );
    }
  }

  const atrialPressure = Object.freeze({
    LA: evaluateAtrialOneFiberPressureV1(
      {
        cavityVolumeM3: input.initialState.bloodVolumesM3.LA,
        kirchhoffFiberStressPa: activeStressAtTimeZeroPaByWall.LA,
        dKirchhoffStressDFiberLogStrainPa: 0,
      },
      input.atrialGeometryPriorByChamber.LA,
    ).transmuralPressurePa,
    RA: evaluateAtrialOneFiberPressureV1(
      {
        cavityVolumeM3: input.initialState.bloodVolumesM3.RA,
        kirchhoffFiberStressPa: activeStressAtTimeZeroPaByWall.RA,
        dKirchhoffStressDFiberLogStrainPa: 0,
      },
      input.atrialGeometryPriorByChamber.RA,
    ).transmuralPressurePa,
  });
  const triSegOracle = evaluatePublishedTriSegTaylorOracle2009V1(
    input.initialTriSegGeometry,
    Object.freeze({
      LVFW: activeStressAtTimeZeroPaByWall.LVFW,
      SEP: activeStressAtTimeZeroPaByWall.SEP,
      RVFW: activeStressAtTimeZeroPaByWall.RVFW,
    }),
  );
  const chamberTransmuralPressurePa = Object.freeze({
    LA: atrialPressure.LA,
    LV: triSegOracle.cavityTransmuralPressuresPa.LV,
    RA: atrialPressure.RA,
    RV: triSegOracle.cavityTransmuralPressuresPa.RV,
  });
  for (const [chamber, pressure] of Object.entries(
    chamberTransmuralPressurePa,
  )) {
    assertClose(
      pressure,
      input.targetPressurePa,
      512 * Number.EPSILON,
      `${chamber}.initial transmural pressure`,
    );
  }

  const triSegRepresentativeTensionNPerMByWall = Object.freeze({
    LVFW: triSegOracle.walls.LVFW.representativeMidwallTensionNPerM,
    SEP: triSegOracle.walls.SEP.representativeMidwallTensionNPerM,
    RVFW: triSegOracle.walls.RVFW.representativeMidwallTensionNPerM,
  });
  const commonTension = triSegRepresentativeTensionNPerMByWall.SEP;
  assertClose(
    triSegRepresentativeTensionNPerMByWall.LVFW,
    commonTension,
    512 * Number.EPSILON,
    "LVFW/SEP representative tension",
  );
  assertClose(
    triSegRepresentativeTensionNPerMByWall.RVFW,
    commonTension,
    512 * Number.EPSILON,
    "RVFW/SEP representative tension",
  );

  const vascularAbsolutePressurePaByCompartment = freezeVascularRecord(
    (compartmentId) =>
      evaluateLinearVascularComplianceV1(
        input.vascularComplianceParametersByCompartment[compartmentId],
        input.initialState.bloodVolumesM3[compartmentId],
      ).absolutePressurePa,
  );
  for (const compartmentId of PHASE_B0_VASCULAR_COMPARTMENT_IDS_V1) {
    assertClose(
      vascularAbsolutePressurePaByCompartment[compartmentId],
      input.targetPressurePa,
      64 * Number.EPSILON,
      `${compartmentId}.initial absolute pressure`,
    );
  }

  return Object.freeze({
    targetTransmuralPressurePa: input.targetPressurePa,
    instantaneousMechanicalEquilibrium: true,
    analyticallyZeroFiberLogStrainByWall: freezeWallRecord(() => 0 as const),
    evaluatedFiberLogStrainByWall,
    maximumAbsoluteEvaluatedFiberLogStrain,
    slsAlphaVEqualsAnalyticFiberLogStrain: true,
    equilibriumPassiveStressPaByWall,
    slsOverstressPaByWall,
    targetFiberStressPaByWall: input.targetFiberStressPaByWall,
    activeStressAtTimeZeroPaByWall,
    activeStressTimeDerivativeAtTimeZeroPaPerSecByWall,
    activeNormalizedPulseAtTimeZeroByWall,
    chamberTransmuralPressurePa,
    triSegRepresentativeTensionNPerMByWall,
    triSegEquilibriumResidualNPerM: Object.freeze({
      axial: triSegOracle.equilibriumResidual.axialNPerM,
      radial: triSegOracle.equilibriumResidual.radialNPerM,
      euclidean: triSegOracle.equilibriumResidual.euclideanNPerM,
    }),
    vascularAbsolutePressurePaByCompartment,
    algebraicFlowsM3PerSec: Object.freeze({ Q_sys: 0, Q_pul: 0 }),
    initialIntrapericardialHeartVolumeM3:
      input.initialIntrapericardialHeartVolumeM3,
    initialPericardialExcessPressurePa:
      input.initialPericardium.excessPressurePa,
    initialPericardialSmoothingBranch: "zero",
  });
}

function freezeWallRecord<Value>(
  value: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(
    Object.fromEntries(WALL_IDS.map((wallId) => [wallId, value(wallId)])),
  ) as Readonly<Record<FourChamberWallId, Value>>;
}

function freezeValveRecord<Value>(
  value: (flowId: PhaseB0ValveFlowIdV1) => Value,
): Readonly<Record<PhaseB0ValveFlowIdV1, Value>> {
  return Object.freeze({
    Q_MV: value("Q_MV"),
    Q_AoV: value("Q_AoV"),
    Q_TV: value("Q_TV"),
    Q_PuV: value("Q_PuV"),
  });
}

function freezeVascularRecord<Value>(
  value: (compartmentId: PhaseB0VascularCompartmentIdV1) => Value,
): Readonly<Record<PhaseB0VascularCompartmentIdV1, Value>> {
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

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}
