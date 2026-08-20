import {
  ENERGY_CONJUGATE_TRISEG_V1_ID,
  evaluateEnergyConjugateTriSegV1,
  evaluateTriSegGeometryV1,
  evaluateTriSegWallSecondDerivativeV1,
  TRISEG_WALL_IDS_V1,
  type TriSegWallIdV1,
  type TriSegWallRecordV1,
} from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import {
  EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
  evaluateEquilibriumOneFiberPassiveV1,
} from "@/engine/myocardium/mechanics/equilibriumOneFiberPassiveV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3,
  type MainWireNormalAdultPassiveEquilibriumCoordinatesV3,
  type MainWireNormalAdultPassiveEquilibriumMatrix2V3,
} from "@/engine/myocardium/experiments/MainWirePassiveEquilibriumPointSolverComparisonDefinitionV1";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID =
  "main-wire-normal-adult-five-wall-passive-equilibrium-ventricular-candidate-engineering-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM =
  Object.freeze({
    status: "engineering-unqualified" as const,
    chamberScope: Object.freeze(["LV", "RV"] as const),
    wallScope: TRISEG_WALL_IDS_V1,
    equilibriumPassiveOnly: true as const,
    activeStressIncluded: false as const,
    slsHistoryIncluded: false as const,
    atriaIncluded: false as const,
    pericardiumIncluded: false as const,
    circulationIncluded: false as const,
    pointLocalRootEstablished: false as const,
    branchEstablished: false as const,
    surfaceEstablished: false as const,
    edpvrEstablished: false as const,
    pvaEstablished: false as const,
    officialQualificationEstablished: false as const,
    publicCatalogEligibilityEstablished: false as const,
  });

export type MainWireNormalAdultPassiveEquilibriumWallPointEngineeringV1 =
  Readonly<{
    wallId: TriSegWallIdV1;
    wallMaterialVolumeM3: number;
    fiberLogStrain: number;
    equilibriumKirchhoffStressPa: number;
    dStressDFiberLogStrainPa: number;
    storedEnergyJ: number;
    constitutiveParameterSetId: string;
    constitutiveParameterIdentityHash: string;
  }>;

export type MainWireNormalAdultPassiveEquilibriumMatrix4V3 = Readonly<{
  coordinateOrder: readonly ["LV", "RV", "VS", "y"];
  values: readonly [
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
    readonly [number, number, number, number],
  ];
}>;

export type MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1 =
  Readonly<{
    ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID;
    status: "candidate-evaluated";
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
    wallEquilibriumPassiveByWall: TriSegWallRecordV1<MainWireNormalAdultPassiveEquilibriumWallPointEngineeringV1>;
    rawStoredEnergyJ: number;
    intrinsicPressuresPa: Readonly<{ LV: number; RV: number }>;
    rawCoupledGradient: readonly [number, number, number, number];
    rawCoupledHessian: MainWireNormalAdultPassiveEquilibriumMatrix4V3;
    scaledGradient: readonly [number, number];
    scaledForceInfinityNorm: number;
    scaledInternalHessian: MainWireNormalAdultPassiveEquilibriumMatrix2V3;
    scaledInternalHessianEigenvaluesAscending: readonly [number, number];
    minimumScaledInternalHessianEigenvalue: number;
    strictLocalStabilityPassed: boolean;
    junctionRadiusPassed: boolean;
    allNumericalFieldsFinite: true;
    qualification: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM;
    sourceBindings: Readonly<{
      priorId: typeof NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID;
      geometryId: typeof ENERGY_CONJUGATE_TRISEG_V1_ID;
      materialId: typeof EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID;
    }>;
  }>;

type MaterialPointByWall =
  TriSegWallRecordV1<MainWireNormalAdultPassiveEquilibriumWallPointEngineeringV1>;

const ENERGY_SCALE_J = 1;
const MINIMUM_SCALED_HESSIAN_EIGENVALUE_EXCLUSIVE = 1e-10;
const MINIMUM_JUNCTION_RADIUS_M_EXCLUSIVE = 1e-5;

export function evaluateMainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1(
  input: Readonly<{
    chamberVolumesM3: Readonly<{ LV: number; RV: number }>;
    internalCoordinates: MainWireNormalAdultPassiveEquilibriumCoordinatesV3;
  }>,
): MainWireNormalAdultPassiveEquilibriumVentricularCandidateEngineeringV1 {
  requireFiniteV3(input.chamberVolumesM3.LV, "LV cavity volume");
  requireFiniteV3(input.chamberVolumesM3.RV, "RV cavity volume");
  requireFiniteV3(
    input.internalCoordinates.septalMidwallCapVolumeM3,
    "septal midwall cap volume",
  );
  requireFiniteV3(input.internalCoordinates.junctionRadiusM, "junction radius");

  const geometry = evaluateTriSegGeometryV1({
    leftVentricularCavityVolumeM3: input.chamberVolumesM3.LV,
    rightVentricularCavityVolumeM3: input.chamberVolumesM3.RV,
    coordinates: input.internalCoordinates,
    walls:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.wallGeometryParameters,
  });
  const materialByWall = wallRecordV3((wallId) => {
    const material = evaluateEquilibriumOneFiberPassiveV1(
      geometry.walls[wallId].fiberLogStrain,
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.passive.ventricular.compiled,
    );
    return Object.freeze({
      wallId,
      wallMaterialVolumeM3:
        geometry.walls[wallId].parameters.wallMaterialVolumeM3,
      fiberLogStrain: geometry.walls[wallId].fiberLogStrain,
      equilibriumKirchhoffStressPa: material.equilibriumKirchhoffStressPa,
      dStressDFiberLogStrainPa: material.dStressDFiberLogStrainPa,
      storedEnergyJ:
        material.storedEnergyDensityJPerM3 *
        geometry.walls[wallId].parameters.wallMaterialVolumeM3,
      constitutiveParameterSetId: material.parameterSetId,
      constitutiveParameterIdentityHash: material.parameterIdentityHash,
    });
  });
  const virtualWork = evaluateEnergyConjugateTriSegV1({
    geometry,
    fiberKirchhoffStressPaByWall: wallRecordV3(
      (wallId) => materialByWall[wallId].equilibriumKirchhoffStressPa,
    ),
  });
  const rawCoupledGradient = Object.freeze([
    virtualWork.membraneGeneralizedForce.leftVentricularPressurePa,
    virtualWork.membraneGeneralizedForce.rightVentricularPressurePa,
    virtualWork.membraneGeneralizedForce.septalMidwallCapVolumePa,
    virtualWork.membraneGeneralizedForce.junctionRadiusN,
  ] as const);
  const rawCoupledHessian = analyticCoupledHessianV3(
    geometry,
    virtualWork.wallDerivativeByWall,
    materialByWall,
  );
  const volumeScale =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.septalMidwallCapVolumeM3;
  const radiusScale =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_COORDINATE_SCALES_V3.junctionRadiusM;
  const scaledGradient = Object.freeze([
    (rawCoupledGradient[2] * volumeScale) / ENERGY_SCALE_J,
    (rawCoupledGradient[3] * radiusScale) / ENERGY_SCALE_J,
  ] as const);
  const scaledInternalHessian = freezeMatrix2V3(
    (rawCoupledHessian.values[2][2] * volumeScale * volumeScale) /
      ENERGY_SCALE_J,
    (rawCoupledHessian.values[2][3] * volumeScale * radiusScale) /
      ENERGY_SCALE_J,
    (rawCoupledHessian.values[3][3] * radiusScale * radiusScale) /
      ENERGY_SCALE_J,
  );
  const eigenvalues = symmetricMatrix2EigenvaluesV3(scaledInternalHessian);
  const rawStoredEnergyJ =
    materialByWall.LVFW.storedEnergyJ +
    materialByWall.SEP.storedEnergyJ +
    materialByWall.RVFW.storedEnergyJ;
  const scaledForceInfinityNorm = Math.max(
    Math.abs(scaledGradient[0]),
    Math.abs(scaledGradient[1]),
  );

  for (const [label, value] of Object.entries({
    rawStoredEnergyJ,
    leftVentricularPressurePa: rawCoupledGradient[0],
    rightVentricularPressurePa: rawCoupledGradient[1],
    scaledGradient0: scaledGradient[0],
    scaledGradient1: scaledGradient[1],
    scaledForceInfinityNorm,
    minimumScaledInternalHessianEigenvalue: eigenvalues[0],
    maximumScaledInternalHessianEigenvalue: eigenvalues[1],
  }))
    requireFiniteV3(value, label);

  return deepFreezeV3({
    ownerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_ID,
    status: "candidate-evaluated",
    chamberVolumesM3: { ...input.chamberVolumesM3 },
    internalCoordinates: { ...input.internalCoordinates },
    wallEquilibriumPassiveByWall: materialByWall,
    rawStoredEnergyJ,
    intrinsicPressuresPa: {
      LV: rawCoupledGradient[0],
      RV: rawCoupledGradient[1],
    },
    rawCoupledGradient,
    rawCoupledHessian,
    scaledGradient,
    scaledForceInfinityNorm,
    scaledInternalHessian,
    scaledInternalHessianEigenvaluesAscending: eigenvalues,
    minimumScaledInternalHessianEigenvalue: eigenvalues[0],
    strictLocalStabilityPassed:
      eigenvalues[0] > MINIMUM_SCALED_HESSIAN_EIGENVALUE_EXCLUSIVE,
    junctionRadiusPassed:
      input.internalCoordinates.junctionRadiusM >
      MINIMUM_JUNCTION_RADIUS_M_EXCLUSIVE,
    allNumericalFieldsFinite: true,
    qualification:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_VENTRICULAR_CANDIDATE_ENGINEERING_V1_CLAIM,
    sourceBindings: {
      priorId: NORMAL_ADULT_FIVE_WALL_PRIOR_V1_ID,
      geometryId: ENERGY_CONJUGATE_TRISEG_V1_ID,
      materialId: EQUILIBRIUM_ONE_FIBER_PASSIVE_V1_ID,
    },
  });
}

function analyticCoupledHessianV3(
  geometry: ReturnType<typeof evaluateTriSegGeometryV1>,
  wallDerivativeByWall: ReturnType<
    typeof evaluateEnergyConjugateTriSegV1
  >["wallDerivativeByWall"],
  materialByWall: MaterialPointByWall,
): MainWireNormalAdultPassiveEquilibriumMatrix4V3 {
  const values = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  const capGradientByWall = {
    LVFW: [-1, 0, 1] as const,
    SEP: [0, 0, 1] as const,
    RVFW: [0, 1, 1] as const,
  };
  for (const wallId of TRISEG_WALL_IDS_V1) {
    const first = wallDerivativeByWall[wallId];
    const second = evaluateTriSegWallSecondDerivativeV1(geometry.walls[wallId]);
    const capGradient = capGradientByWall[wallId];
    const strainGradient = [
      capGradient[0] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[1] * first.dFiberLogStrainDCapVolumePerM3,
      capGradient[2] * first.dFiberLogStrainDCapVolumePerM3,
      first.dFiberLogStrainDJunctionRadiusPerM,
    ] as const;
    const wall = materialByWall[wallId];
    for (let row = 0; row < 4; row += 1) {
      for (let column = row; column < 4; column += 1) {
        let strainSecondDerivative: number;
        if (row === 3 && column === 3) {
          strainSecondDerivative = second.d2FiberLogStrainDJunctionRadius2PerM2;
        } else if (column === 3) {
          strainSecondDerivative =
            capGradient[row]! *
            second.d2FiberLogStrainDCapVolumeDJunctionRadiusPerM4;
        } else {
          strainSecondDerivative =
            capGradient[row]! *
            capGradient[column]! *
            second.d2FiberLogStrainDCapVolume2PerM6;
        }
        const contribution =
          wall.wallMaterialVolumeM3 *
          (wall.dStressDFiberLogStrainPa *
            strainGradient[row]! *
            strainGradient[column]! +
            wall.equilibriumKirchhoffStressPa * strainSecondDerivative);
        values[row]![column] += contribution;
        if (row !== column) values[column]![row] += contribution;
      }
    }
  }
  for (const row of values) {
    for (const value of row)
      requireFiniteV3(value, "raw coupled Hessian entry");
  }
  return deepFreezeV3({
    coordinateOrder: ["LV", "RV", "VS", "y"],
    values:
      values as unknown as MainWireNormalAdultPassiveEquilibriumMatrix4V3["values"],
  });
}

function symmetricMatrix2EigenvaluesV3(
  matrix: MainWireNormalAdultPassiveEquilibriumMatrix2V3,
): readonly [number, number] {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const d = matrix[1][1];
  const center = 0.5 * (a + d);
  const radius = Math.hypot(0.5 * (a - d), b);
  return Object.freeze([center - radius, center + radius] as const);
}

function freezeMatrix2V3(
  h00: number,
  h01: number,
  h11: number,
): MainWireNormalAdultPassiveEquilibriumMatrix2V3 {
  return Object.freeze([
    Object.freeze([h00, h01] as const),
    Object.freeze([h01, h11] as const),
  ] as const);
}

function wallRecordV3<T>(
  factory: (wallId: TriSegWallIdV1) => T,
): TriSegWallRecordV1<T> {
  return Object.freeze({
    LVFW: factory("LVFW"),
    SEP: factory("SEP"),
    RVFW: factory("RVFW"),
  });
}

function requireFiniteV3(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function deepFreezeV3<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeV3(child);
    Object.freeze(value);
  }
  return value;
}
