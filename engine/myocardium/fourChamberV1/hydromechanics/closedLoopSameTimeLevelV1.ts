import {
  evaluateAtrialOneFiberGeometryV1,
  evaluateAtrialOneFiberPressureV1,
  type AtrialOneFiberGeometryEvaluationV1,
  type AtrialOneFiberGeometryPriorV1,
  type AtrialOneFiberPressureEvaluationV1,
} from "@/engine/myocardium/fourChamberV1/atria/atrialOneFiberGeometryV1";
import {
  evaluateSignedFlowMomentumV1,
  evaluateValveMomentumV1,
  type SignedFlowLossParametersV1,
  type SignedFlowMomentumOutputV1,
  type ValveLossParametersV1,
  type ValveMomentumOutputV1,
} from "@/engine/myocardium/fourChamberV1/flows/signedFlowLossV1";
import type { EquilibriumPassiveEvaluationV1 } from "@/engine/myocardium/fourChamberV1/passive/equilibriumPassiveEnergyC2V1";
import {
  composeFourChamberCavityPressuresV1,
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
  type FourChamberFlowId,
  type FourChamberWallId,
  type InertialFlowId,
  type TriSegWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  evaluatePublishedTriSegGeometryV1,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryParametersV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  evaluatePublishedTriSegTaylorOracle2009V1,
  type PublishedTriSegTaylorOracle2009V1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTaylorOracle2009V1";
import {
  evaluateEnergyConjugateFiniteThicknessTriSegV2,
  type EnergyConjugateFiniteThicknessTriSegV2,
  type FiniteThicknessTriSegBendingPriorV2,
} from "@/engine/myocardium/fourChamberV1/triseg/energyConjugateFiniteThicknessTriSegV2";
import {
  evaluateLinearVascularComplianceV1,
  type LinearVascularComplianceOutputV1,
  type LinearVascularComplianceParametersV1,
} from "@/engine/myocardium/fourChamberV1/vascular/linearComplianceV1";

export const FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID =
  "four-chamber-closed-loop-same-time-level-v1" as const;

export type FourChamberClosedLoopStateV1 = Readonly<{
  timeSec: number;
  bloodVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  inertialFlowsM3PerSec: Readonly<Record<InertialFlowId, number>>;
  triSegCoordinates: Readonly<{
    V_m_S: number;
    y_m: number;
  }>;
}>;

export type FourChamberClosedLoopWallEvaluationInputV1 = Readonly<{
  wallId: FourChamberWallId;
  fiberLogStrain: number;
  wallReferenceMaterialVolumeM3: number;
}>;

/**
 * Constitutive contribution required by the material-independent closed-loop
 * assembly. The callback is evaluated exactly once for every wall at the
 * current same-time-level geometry.
 */
export type FourChamberClosedLoopWallEvaluationV1 = Readonly<{
  equilibriumPassive: EquilibriumPassiveEvaluationV1;
  activeKirchhoffStressPa: number;
  activeStressTimeDerivativePaPerSec: number;
  slsOverstressPa: number;
  slsStoredEnergyJ: number;
  slsPhysicalDissipationW: number;
  totalKirchhoffStressPa: number;
  totalTangentAtFixedInternalStatePa: number;
}>;

export type FourChamberClosedLoopWallEvaluatorV1 = (
  input: FourChamberClosedLoopWallEvaluationInputV1,
) => FourChamberClosedLoopWallEvaluationV1;

export type FourChamberClosedLoopWallMechanicsV1 =
  FourChamberClosedLoopWallEvaluationInputV1 &
    FourChamberClosedLoopWallEvaluationV1;

export type FourChamberClosedLoopSameTimeLevelInputV1 = Readonly<{
  state: FourChamberClosedLoopStateV1;
  atrialGeometryPriorByChamber: Readonly<
    Record<"LA" | "RA", AtrialOneFiberGeometryPriorV1>
  >;
  triSegWalls: Readonly<
    Record<TriSegWallId, PublishedTriSegWallGeometryParametersV1>
  >;
  /** Absent on the preserved legacy Taylor path; present only on rebuild v2. */
  finiteThicknessTriSegBendingPriorV2?: FiniteThicknessTriSegBendingPriorV2;
  vascularComplianceParametersByCompartment: Readonly<
    Record<"SA" | "SV" | "PA" | "PV", LinearVascularComplianceParametersV1>
  >;
  peripheralResistancePaSecPerM3ByFlow: Readonly<
    Record<AlgebraicFlowId, number>
  >;
  valveLossParametersByFlow: Readonly<
    Record<"Q_MV" | "Q_AoV" | "Q_TV" | "Q_PuV", ValveLossParametersV1>
  >;
  inletLossParametersByFlow: Readonly<
    Record<"Q_VC" | "Q_PV", SignedFlowLossParametersV1>
  >;
  pericardiumParameters: CommonPericardiumParametersV1;
  intrathoracicPressurePa: number;
  evaluateWall: FourChamberClosedLoopWallEvaluatorV1;
}>;

export type FourChamberClosedLoopAtrialEvaluationV1 = Readonly<{
  geometry: AtrialOneFiberGeometryEvaluationV1;
  pressure: AtrialOneFiberPressureEvaluationV1;
}>;

export type FourChamberClosedLoopSameTimeLevelEvaluationV1 = Readonly<{
  evaluationId: typeof FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID;
  state: FourChamberClosedLoopStateV1;
  activeStressTimeDerivativePaPerSecByWall: Readonly<
    Record<FourChamberWallId, number>
  >;
  wallMechanics: Readonly<
    Record<FourChamberWallId, FourChamberClosedLoopWallMechanicsV1>
  >;
  atria: Readonly<Record<"LA" | "RA", FourChamberClosedLoopAtrialEvaluationV1>>;
  triSegGeometry: PublishedTriSegGeometryV1;
  /** Runtime owner on rebuild v2; omitted rather than serialized as null on legacy cases. */
  energyConjugateTriSeg?: EnergyConjugateFiniteThicknessTriSegV2;
  /** Preserved as a diagnostic on rebuild v2 and as the runtime owner on legacy cases. */
  triSegOracle: PublishedTriSegTaylorOracle2009V1;
  pericardium: CommonPericardiumOutputV1;
  chamberTransmuralPressurePa: Readonly<
    Record<"LA" | "LV" | "RA" | "RV", number>
  >;
  chamberAbsolutePressurePa: Readonly<
    Record<"LA" | "LV" | "RA" | "RV", number>
  >;
  vascular: Readonly<
    Record<"SA" | "SV" | "PA" | "PV", LinearVascularComplianceOutputV1>
  >;
  compartmentAbsolutePressurePa: Readonly<Record<BloodCompartmentId, number>>;
  algebraicFlowsM3PerSec: Readonly<Record<AlgebraicFlowId, number>>;
  allFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
  inertialMomentum: Readonly<
    Record<InertialFlowId, SignedFlowMomentumOutputV1 | ValveMomentumOutputV1>
  >;
  projectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
}>;

/**
 * Assemble geometry, chamber and vascular pressures, and all eight flows at
 * one common time level. Constitutive behavior is supplied only through
 * evaluateWall, so multiple material models can share the closed-loop
 * equations without duplicating their geometry or flow path.
 */
export function evaluateFourChamberClosedLoopSameTimeLevelV1(
  input: FourChamberClosedLoopSameTimeLevelInputV1,
): FourChamberClosedLoopSameTimeLevelEvaluationV1 {
  validateInput(input);
  const { state } = input;
  const triSegGeometry = evaluatePublishedTriSegGeometryV1({
    leftVentricularCavityVolumeM3: state.bloodVolumesM3.LV,
    rightVentricularCavityVolumeM3: state.bloodVolumesM3.RV,
    septalMidwallCapVolumeM3: state.triSegCoordinates.V_m_S,
    junctionRadiusM: state.triSegCoordinates.y_m,
    walls: input.triSegWalls,
  });
  const atrialGeometry = Object.freeze({
    LA: evaluateAtrialOneFiberGeometryV1(
      state.bloodVolumesM3.LA,
      input.atrialGeometryPriorByChamber.LA,
    ),
    RA: evaluateAtrialOneFiberGeometryV1(
      state.bloodVolumesM3.RA,
      input.atrialGeometryPriorByChamber.RA,
    ),
  });
  const fiberLogStrainByWall: Readonly<Record<FourChamberWallId, number>> =
    Object.freeze({
      LA: atrialGeometry.LA.fiberLogStrain,
      RA: atrialGeometry.RA.fiberLogStrain,
      LVFW: triSegGeometry.walls.LVFW.fiberLogStrain,
      SEP: triSegGeometry.walls.SEP.fiberLogStrain,
      RVFW: triSegGeometry.walls.RVFW.fiberLogStrain,
    });
  const wallReferenceMaterialVolumeM3ByWall: Readonly<
    Record<FourChamberWallId, number>
  > = Object.freeze({
    LA: input.atrialGeometryPriorByChamber.LA.wallReferenceMaterialVolumeM3,
    RA: input.atrialGeometryPriorByChamber.RA.wallReferenceMaterialVolumeM3,
    LVFW: input.triSegWalls.LVFW.wallMaterialVolumeM3,
    SEP: input.triSegWalls.SEP.wallMaterialVolumeM3,
    RVFW: input.triSegWalls.RVFW.wallMaterialVolumeM3,
  });
  const wallMechanics = wallRecord((wallId) => {
    const wallInput = Object.freeze({
      wallId,
      fiberLogStrain: fiberLogStrainByWall[wallId],
      wallReferenceMaterialVolumeM3:
        wallReferenceMaterialVolumeM3ByWall[wallId],
    });
    const material = input.evaluateWall(wallInput);
    validateWallEvaluation(material, wallId);
    return Object.freeze({ ...wallInput, ...material });
  });
  const activeStressTimeDerivativePaPerSecByWall = wallRecord(
    (wallId) => wallMechanics[wallId].activeStressTimeDerivativePaPerSec,
  );

  const triSegOracle = evaluatePublishedTriSegTaylorOracle2009V1(
    triSegGeometry,
    {
      LVFW: wallMechanics.LVFW.totalKirchhoffStressPa,
      SEP: wallMechanics.SEP.totalKirchhoffStressPa,
      RVFW: wallMechanics.RVFW.totalKirchhoffStressPa,
    },
  );
  const energyConjugateTriSeg = input.finiteThicknessTriSegBendingPriorV2
    === undefined
    ? null
    : evaluateEnergyConjugateFiniteThicknessTriSegV2({
      geometry: triSegGeometry,
      fiberKirchhoffStressPaByWall: {
        LVFW: wallMechanics.LVFW.totalKirchhoffStressPa,
        SEP: wallMechanics.SEP.totalKirchhoffStressPa,
        RVFW: wallMechanics.RVFW.totalKirchhoffStressPa,
      },
      bendingPrior: input.finiteThicknessTriSegBendingPriorV2,
    });
  const atria = Object.freeze({
    LA: Object.freeze({
      geometry: atrialGeometry.LA,
      pressure: evaluateAtrialOneFiberPressureV1(
        {
          cavityVolumeM3: state.bloodVolumesM3.LA,
          kirchhoffFiberStressPa: wallMechanics.LA.totalKirchhoffStressPa,
          dKirchhoffStressDFiberLogStrainPa:
            wallMechanics.LA.totalTangentAtFixedInternalStatePa,
        },
        input.atrialGeometryPriorByChamber.LA,
      ),
    }),
    RA: Object.freeze({
      geometry: atrialGeometry.RA,
      pressure: evaluateAtrialOneFiberPressureV1(
        {
          cavityVolumeM3: state.bloodVolumesM3.RA,
          kirchhoffFiberStressPa: wallMechanics.RA.totalKirchhoffStressPa,
          dKirchhoffStressDFiberLogStrainPa:
            wallMechanics.RA.totalTangentAtFixedInternalStatePa,
        },
        input.atrialGeometryPriorByChamber.RA,
      ),
    }),
  });

  const totalHeartVolumeM3 = computeIntrapericardialHeartVolumeM3V1({
    leftAtrialBloodVolumeM3: state.bloodVolumesM3.LA,
    leftVentricularBloodVolumeM3: state.bloodVolumesM3.LV,
    rightAtrialBloodVolumeM3: state.bloodVolumesM3.RA,
    rightVentricularBloodVolumeM3: state.bloodVolumesM3.RV,
    wallMaterialVolumesM3: WALL_IDS.map(
      (wallId) => wallMechanics[wallId].wallReferenceMaterialVolumeM3,
    ) as [number, number, number, number, number],
  });
  const pericardium = evaluateCommonPericardiumV1(
    input.pericardiumParameters,
    totalHeartVolumeM3,
  );
  const chamberTransmuralPressurePa = Object.freeze({
    LA: atria.LA.pressure.transmuralPressurePa,
    LV: energyConjugateTriSeg?.cavityTransmuralPressuresPa.LV
      ?? triSegOracle.cavityTransmuralPressuresPa.LV,
    RA: atria.RA.pressure.transmuralPressurePa,
    RV: energyConjugateTriSeg?.cavityTransmuralPressuresPa.RV
      ?? triSegOracle.cavityTransmuralPressuresPa.RV,
  });
  const chamberComposed = composeFourChamberCavityPressuresV1(
    chamberTransmuralPressurePa,
    input.intrathoracicPressurePa,
    pericardium.excessPressurePa,
  );
  const chamberAbsolutePressurePa = Object.freeze({
    LA: chamberComposed.LA,
    LV: chamberComposed.LV,
    RA: chamberComposed.RA,
    RV: chamberComposed.RV,
  });
  const vascular = Object.freeze({
    SA: evaluateLinearVascularComplianceV1(
      input.vascularComplianceParametersByCompartment.SA,
      state.bloodVolumesM3.SA,
    ),
    SV: evaluateLinearVascularComplianceV1(
      input.vascularComplianceParametersByCompartment.SV,
      state.bloodVolumesM3.SV,
    ),
    PA: evaluateLinearVascularComplianceV1(
      input.vascularComplianceParametersByCompartment.PA,
      state.bloodVolumesM3.PA,
    ),
    PV: evaluateLinearVascularComplianceV1(
      input.vascularComplianceParametersByCompartment.PV,
      state.bloodVolumesM3.PV,
    ),
  });
  const compartmentAbsolutePressurePa = Object.freeze({
    LA: chamberAbsolutePressurePa.LA,
    LV: chamberAbsolutePressurePa.LV,
    SA: vascular.SA.absolutePressurePa,
    SV: vascular.SV.absolutePressurePa,
    RA: chamberAbsolutePressurePa.RA,
    RV: chamberAbsolutePressurePa.RV,
    PA: vascular.PA.absolutePressurePa,
    PV: vascular.PV.absolutePressurePa,
  });
  const algebraicFlowsM3PerSec = Object.freeze({
    Q_sys:
      (compartmentAbsolutePressurePa.SA - compartmentAbsolutePressurePa.SV) /
      input.peripheralResistancePaSecPerM3ByFlow.Q_sys,
    Q_pul:
      (compartmentAbsolutePressurePa.PA - compartmentAbsolutePressurePa.PV) /
      input.peripheralResistancePaSecPerM3ByFlow.Q_pul,
  });
  const allFlowsM3PerSec = Object.freeze({
    ...state.inertialFlowsM3PerSec,
    ...algebraicFlowsM3PerSec,
  });
  const pressureDrop = (
    upstream: BloodCompartmentId,
    downstream: BloodCompartmentId,
  ) =>
    compartmentAbsolutePressurePa[upstream] -
    compartmentAbsolutePressurePa[downstream];
  const inertialMomentum = Object.freeze({
    Q_MV: evaluateValveMomentumV1(
      input.valveLossParametersByFlow.Q_MV,
      pressureDrop("LA", "LV"),
      state.inertialFlowsM3PerSec.Q_MV,
    ),
    Q_AoV: evaluateValveMomentumV1(
      input.valveLossParametersByFlow.Q_AoV,
      pressureDrop("LV", "SA"),
      state.inertialFlowsM3PerSec.Q_AoV,
    ),
    Q_TV: evaluateValveMomentumV1(
      input.valveLossParametersByFlow.Q_TV,
      pressureDrop("RA", "RV"),
      state.inertialFlowsM3PerSec.Q_TV,
    ),
    Q_PuV: evaluateValveMomentumV1(
      input.valveLossParametersByFlow.Q_PuV,
      pressureDrop("RV", "PA"),
      state.inertialFlowsM3PerSec.Q_PuV,
    ),
    Q_VC: evaluateSignedFlowMomentumV1(
      input.inletLossParametersByFlow.Q_VC,
      pressureDrop("SV", "RA"),
      state.inertialFlowsM3PerSec.Q_VC,
    ),
    Q_PV: evaluateSignedFlowMomentumV1(
      input.inletLossParametersByFlow.Q_PV,
      pressureDrop("PV", "LA"),
      state.inertialFlowsM3PerSec.Q_PV,
    ),
  });
  return Object.freeze({
    evaluationId: FOUR_CHAMBER_CLOSED_LOOP_SAME_TIME_LEVEL_V1_ID,
    state,
    activeStressTimeDerivativePaPerSecByWall,
    wallMechanics,
    atria,
    triSegGeometry,
    ...(energyConjugateTriSeg === null ? {} : { energyConjugateTriSeg }),
    triSegOracle,
    pericardium,
    chamberTransmuralPressurePa,
    chamberAbsolutePressurePa,
    vascular,
    compartmentAbsolutePressurePa,
    algebraicFlowsM3PerSec,
    allFlowsM3PerSec,
    inertialMomentum,
    projectionApplied: false,
    flowClampApplied: false,
    fallbackApplied: false,
  });
}

/** Selects the declared runtime mechanics while keeping Taylor available as a diagnostic. */
export function getRuntimeTriSegEquilibriumResidualV2(
  evaluation: FourChamberClosedLoopSameTimeLevelEvaluationV1,
): Readonly<{ axialNPerM: number; radialNPerM: number; euclideanNPerM: number }> {
  return evaluation.energyConjugateTriSeg?.equilibriumResidual
    ?? evaluation.triSegOracle.equilibriumResidual;
}

function validateInput(input: FourChamberClosedLoopSameTimeLevelInputV1): void {
  requireNonNegativeFinite(input.state.timeSec, "state.timeSec");
  for (const compartmentId of BLOOD_COMPARTMENT_IDS) {
    requirePositiveFinite(
      input.state.bloodVolumesM3[compartmentId],
      `state.bloodVolumesM3.${compartmentId}`,
    );
  }
  for (const flowId of INERTIAL_FLOW_IDS) {
    requireFinite(
      input.state.inertialFlowsM3PerSec[flowId],
      `state.inertialFlowsM3PerSec.${flowId}`,
    );
  }
  requireFinite(
    input.state.triSegCoordinates.V_m_S,
    "state.triSegCoordinates.V_m_S",
  );
  requirePositiveFinite(
    input.state.triSegCoordinates.y_m,
    "state.triSegCoordinates.y_m",
  );
  requireFinite(input.intrathoracicPressurePa, "intrathoracicPressurePa");
  for (const flowId of ["Q_sys", "Q_pul"] as const) {
    requirePositiveFinite(
      input.peripheralResistancePaSecPerM3ByFlow[flowId],
      `peripheralResistancePaSecPerM3ByFlow.${flowId}`,
    );
  }
  if (typeof input.evaluateWall !== "function") {
    throw new Error("evaluateWall must be a function");
  }
}

function validateWallEvaluation(
  wall: FourChamberClosedLoopWallEvaluationV1,
  wallId: FourChamberWallId,
): void {
  const fields = [
    "activeKirchhoffStressPa",
    "activeStressTimeDerivativePaPerSec",
    "slsOverstressPa",
    "slsStoredEnergyJ",
    "slsPhysicalDissipationW",
    "totalKirchhoffStressPa",
    "totalTangentAtFixedInternalStatePa",
  ] as const;
  for (const field of fields) {
    requireFinite(wall[field], `${wallId}.${field}`);
  }
  if (wall.slsStoredEnergyJ < 0) {
    throw new Error(`${wallId}.slsStoredEnergyJ must be nonnegative`);
  }
  if (wall.slsPhysicalDissipationW < 0) {
    throw new Error(`${wallId}.slsPhysicalDissipationW must be nonnegative`);
  }
}

function wallRecord<T>(
  value: (wallId: FourChamberWallId) => T,
): Readonly<Record<FourChamberWallId, T>> {
  return Object.freeze(
    Object.fromEntries(WALL_IDS.map((id) => [id, value(id)])),
  ) as Readonly<Record<FourChamberWallId, T>>;
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

function requireNonNegativeFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be nonnegative and finite`);
  }
  return value;
}
