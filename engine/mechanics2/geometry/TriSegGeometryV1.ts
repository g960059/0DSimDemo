/**
 * Research-sidecar implementation of the algebraic TriSeg spherical-cap
 * geometry described by Lumens et al. (2009), doi:10.1007/s10439-009-9774-2.
 *
 * This module deliberately owns no AV-plane/long-axis coordinate, inertia, or
 * damping. LV and RV blood volumes remain circulation-ledger states. The two
 * TriSeg coordinates are algebraic geometry unknowns only.
 */

export const TRISEG_GEOMETRY_MODEL_ID_V1 =
  "algebraic-triseg-spherical-cap-v1" as const;

/**
 * The default is the literature-faithful Lumens et al. representative-tension
 * construction. The alternative is a deliberately opt-in generalized-force
 * mapping of the chosen full-fiber work pair; it is not named or claimed as a
 * correction to the original TriSeg equations or as an active-energy
 * potential.
 */
export type TriSegGeneralizedForceMappingV1 =
  "lumens-2009-representative-tension-area-work" | "full-fiber-energy-gradient";

export const DEFAULT_TRISEG_GENERALIZED_FORCE_MAPPING_V1: TriSegGeneralizedForceMappingV1 =
  "lumens-2009-representative-tension-area-work";

export const TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1 =
  Object.freeze({
    adoption: "research-sidecar-opt-in",
    literatureFaithfulTriSegDefaultPreserved: true,
    mapping: "sum(V_wall*sigma_f*d(epsilon_f)/dq)",
    interpretation:
      "generalized-force-gradient-of-the-chosen-full-fiber-work-pair",
    activeStressStoredEnergyPotentialClaimed: false,
    chemicalEnergyConservationClaimed: false,
    correctedOrExactOriginalTriSegClaimed: false,
    calibratedNormalHumanOrClinicalValidityClaimed: false,
  } as const);

export const TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1 = Object.freeze({
  adoption: "research-sidecar-only",
  runtimeReplacement: false,
  geometry: "three-thick-walled-spherical-caps-with-common-junction-circle",
  equilibrium: "two-algebraic-junction-force-balances",
  avPlaneOrLongAxisState: false,
  artificialMassOrDamping: false,
  pericardiumIncluded: false,
  valveOrCirculationIncluded: false,
  calibrationOrClinicalValidityClaimed: false,
} as const);

export type TriSegWallIdV1 = "leftFreeWall" | "septum" | "rightFreeWall";

export const TRISEG_WALL_IDS_V1: readonly TriSegWallIdV1[] = Object.freeze([
  "leftFreeWall",
  "septum",
  "rightFreeWall",
]);

export type TriSegWallParametersV1 = {
  readonly wallVolumeMl: number;
  readonly referenceMidwallAreaCm2: number;
};

export type TriSegWallParameterSetV1 = Readonly<
  Record<TriSegWallIdV1, TriSegWallParametersV1>
>;

export type TriSegGeometryBaseInputV1 = {
  readonly leftVentricleCavityVolumeMl: number;
  readonly rightVentricleCavityVolumeMl: number;
  readonly walls: TriSegWallParameterSetV1;
};

/** Positive septalCapVolumeMl means that the septal cap bows toward the RV. */
export type TriSegAlgebraicCoordinatesV1 = {
  readonly junctionRadiusCm: number;
  readonly septalCapVolumeMl: number;
};

export type TriSegGeometryInputV1 = TriSegGeometryBaseInputV1 & {
  readonly algebraic: TriSegAlgebraicCoordinatesV1;
};

/**
 * Derivatives are with respect to SI coordinates, even though the public input
 * uses the cardiovascular conventions mL and cm. For a volume coordinate the
 * independent SI unit is m^3; for junctionRadiusM it is m.
 */
export type TriSegGeometryCoordinateSIV1 =
  | "leftVentricleCavityVolumeM3"
  | "rightVentricleCavityVolumeM3"
  | "septalCapVolumeM3"
  | "junctionRadiusM";

export type TriSegWallGeometryDerivativeV1 = {
  readonly dSignedMidwallCapVolumeM3: number;
  readonly dAxialDistanceM: number;
  readonly dMidwallAreaM2: number;
  readonly dCurvaturePerM: number;
  readonly dCurvatureThicknessRatioZ: number;
  readonly dAreaNaturalStrain: number;
  readonly dFiberNaturalStrain: number;
};

export type TriSegWallGeometryV1 = {
  readonly wallId: TriSegWallIdV1;
  readonly signedMidwallCapVolumeMl: number;
  readonly signedMidwallCapVolumeM3: number;
  readonly axialDistanceCm: number;
  readonly axialDistanceM: number;
  readonly junctionRadiusCm: number;
  readonly junctionRadiusM: number;
  readonly midwallAreaCm2: number;
  readonly midwallAreaM2: number;
  readonly referenceMidwallAreaCm2: number;
  readonly curvaturePerCm: number;
  readonly curvaturePerM: number;
  readonly wallVolumeMl: number;
  readonly wallVolumeM3: number;
  /** z = 3 C_m V_w / (2 A_m), using the notation of Lumens et al. */
  readonly curvatureThicknessRatioZ: number;
  readonly areaNaturalStrain: number;
  /** Original TriSeg one-fiber approximation, including curvature correction. */
  readonly fiberNaturalStrain: number;
  readonly derivativesSI: Readonly<
    Record<TriSegGeometryCoordinateSIV1, TriSegWallGeometryDerivativeV1>
  >;
};

export type TriSegWallGeometrySetV1 = Readonly<
  Record<TriSegWallIdV1, TriSegWallGeometryV1>
>;

export type TriSegGeometryValidOutputV1 = {
  readonly modelId: typeof TRISEG_GEOMETRY_MODEL_ID_V1;
  readonly claimBoundary: typeof TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1;
  readonly valid: true;
  readonly finite: true;
  readonly failureReason: null;
  readonly input: TriSegGeometryInputV1;
  readonly walls: TriSegWallGeometrySetV1;
};

export type TriSegGeometryInvalidOutputV1 = {
  readonly modelId: typeof TRISEG_GEOMETRY_MODEL_ID_V1;
  readonly claimBoundary: typeof TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1;
  readonly valid: false;
  readonly finite: false;
  readonly failureReason: string;
  readonly input: TriSegGeometryInputV1;
  readonly walls: null;
};

export type TriSegGeometryOutputV1 =
  TriSegGeometryValidOutputV1 | TriSegGeometryInvalidOutputV1;

export type TriSegWallTensionsV1 = Readonly<Record<TriSegWallIdV1, number>>;
export type TriSegWallFiberStressesPaV1 = Readonly<
  Record<TriSegWallIdV1, number>
>;

export const TRISEG_GENERALIZED_FORCE_UNITS_SI_V1 = Object.freeze({
  leftVentricleCavityVolumeM3: "Pa",
  rightVentricleCavityVolumeM3: "Pa",
  septalCapVolumeM3: "Pa",
  junctionRadiusM: "N",
} as const satisfies Readonly<
  Record<TriSegGeometryCoordinateSIV1, "Pa" | "N">
>);

export type TriSegFullFiberEnergyGradientValidOutputV1 = {
  readonly mapping: "full-fiber-energy-gradient";
  readonly claimBoundary: typeof TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1;
  readonly valid: true;
  readonly finite: true;
  readonly failureReason: null;
  readonly fiberStressesPa: TriSegWallFiberStressesPaV1;
  /** V_wall sigma_f d(epsilon_f)/dq, in Pa for volume q and N for radius q. */
  readonly wallContributionsSI: Readonly<
    Record<
      TriSegWallIdV1,
      Readonly<Record<TriSegGeometryCoordinateSIV1, number>>
    >
  >;
  readonly generalizedForcesSI: Readonly<
    Record<TriSegGeometryCoordinateSIV1, number>
  >;
  readonly residuals: {
    readonly septalCapPressurePa: number;
    readonly junctionRadiusForceN: number;
    readonly septalCapContributionScalePa: number;
    readonly junctionRadiusContributionScaleN: number;
    readonly normalizedSeptalCapResidual: number;
    readonly normalizedJunctionRadiusResidual: number;
    readonly relativeMagnitude: number;
  };
  readonly pressures: {
    readonly leftVentricleTransmuralPa: number;
    readonly rightVentricleTransmuralPa: number;
    readonly leftVentricleTransmuralMmHg: number;
    readonly rightVentricleTransmuralMmHg: number;
  };
};

export type TriSegFullFiberEnergyGradientInvalidOutputV1 = {
  readonly mapping: "full-fiber-energy-gradient";
  readonly claimBoundary: typeof TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1;
  readonly valid: false;
  readonly finite: false;
  readonly failureReason: string;
  readonly fiberStressesPa: null;
  readonly wallContributionsSI: null;
  readonly generalizedForcesSI: null;
  readonly residuals: null;
  readonly pressures: null;
};

export type TriSegFullFiberEnergyGradientOutputV1 =
  | TriSegFullFiberEnergyGradientValidOutputV1
  | TriSegFullFiberEnergyGradientInvalidOutputV1;

export type TriSegWallJunctionMechanicsV1 = {
  readonly tensionNPerM: number;
  readonly axialLineTensionNPerM: number;
  readonly radialLineTensionNPerM: number;
  readonly transmuralPressurePa: number;
  readonly septalCapGeneralizedPressurePa: number;
  readonly junctionRadiusGeneralizedForceN: number;
};

export type TriSegVirtualWorkValidOutputV1 = {
  readonly valid: true;
  readonly finite: true;
  readonly failureReason: null;
  readonly wallMechanics: Readonly<
    Record<TriSegWallIdV1, TriSegWallJunctionMechanicsV1>
  >;
  readonly residuals: {
    /** Original TriSeg T_x balance; zero at algebraic equilibrium. */
    readonly axialLineTensionNPerM: number;
    /** Original TriSeg T_y balance; zero at algebraic equilibrium. */
    readonly radialLineTensionNPerM: number;
    /** Work-conjugate to signed septal cap volume; equals 2 T_x,total / y. */
    readonly septalCapPressurePa: number;
    /** Work-conjugate to junction radius; equals 2 pi y T_y,total. */
    readonly junctionRadiusForceN: number;
    readonly relativeMagnitude: number;
  };
  readonly pressures: {
    readonly leftVentricleTransmuralPa: number;
    readonly rightVentricleTransmuralPa: number;
    readonly leftVentricleTransmuralMmHg: number;
    readonly rightVentricleTransmuralMmHg: number;
  };
  readonly virtualWorkIdentityResiduals: {
    readonly leftVentriclePressurePa: number;
    readonly rightVentriclePressurePa: number;
    readonly septalCapPressurePa: number;
    readonly junctionRadiusForceN: number;
  };
};

export type TriSegVirtualWorkInvalidOutputV1 = {
  readonly valid: false;
  readonly finite: false;
  readonly failureReason: string;
  readonly wallMechanics: null;
  readonly residuals: null;
  readonly pressures: null;
  readonly virtualWorkIdentityResiduals: null;
};

export type TriSegVirtualWorkOutputV1 =
  TriSegVirtualWorkValidOutputV1 | TriSegVirtualWorkInvalidOutputV1;

export type TriSegTensionProviderV1 = (
  geometry: TriSegGeometryValidOutputV1,
) => TriSegWallTensionsV1;

export type TriSegAlgebraicSolverBoundsV1 = {
  readonly junctionRadiusCm: readonly [number, number];
  readonly septalCapVolumeMl: readonly [number, number];
};

export type TriSegAlgebraicSolverOptionsV1 = {
  readonly bounds?: Partial<TriSegAlgebraicSolverBoundsV1>;
  readonly maxIterations?: number;
  readonly relativeResidualTolerance?: number;
  readonly finiteDifferenceRelativeStep?: number;
  readonly minimumLineSearchScale?: number;
};

export type TriSegAlgebraicSolverTracePointV1 = {
  readonly iteration: number;
  readonly coordinates: TriSegAlgebraicCoordinatesV1;
  readonly relativeResidualMagnitude: number;
};

export type TriSegAlgebraicSolverTerminationV1 =
  | "converged"
  | "maximum-iterations"
  | "stagnated"
  | "invalid-base-input"
  | "invalid-bounds"
  | "tension-provider-failure"
  | "fiber-stress-provider-failure"
  | "no-finite-trial";

export type TriSegAlgebraicSolutionV1 = {
  readonly modelId: typeof TRISEG_GEOMETRY_MODEL_ID_V1;
  readonly claimBoundary: typeof TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1;
  readonly converged: boolean;
  readonly coordinates: TriSegAlgebraicCoordinatesV1;
  readonly geometry: TriSegGeometryOutputV1;
  readonly tensionsNPerM: TriSegWallTensionsV1 | null;
  readonly virtualWork: TriSegVirtualWorkValidOutputV1 | null;
  readonly diagnostics: {
    readonly termination: TriSegAlgebraicSolverTerminationV1;
    readonly failureReason: string | null;
    readonly iterations: number;
    readonly functionEvaluations: number;
    readonly initialCoordinatesWereClamped: boolean;
    readonly relativeResidualMagnitude: number;
    readonly bounds: TriSegAlgebraicSolverBoundsV1;
    readonly trace: readonly TriSegAlgebraicSolverTracePointV1[];
  };
};

export type TriSegFiberStressProviderV1 = (
  geometry: TriSegGeometryValidOutputV1,
) => TriSegWallFiberStressesPaV1;

export type TriSegFullFiberEnergyGradientSolutionV1 = {
  readonly modelId: typeof TRISEG_GEOMETRY_MODEL_ID_V1;
  readonly claimBoundary: typeof TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1;
  readonly generalizedForceMapping: "full-fiber-energy-gradient";
  readonly converged: boolean;
  readonly coordinates: TriSegAlgebraicCoordinatesV1;
  readonly geometry: TriSegGeometryOutputV1;
  readonly fiberStressesPa: TriSegWallFiberStressesPaV1 | null;
  readonly fullFiberEnergyGradient: TriSegFullFiberEnergyGradientValidOutputV1 | null;
  readonly diagnostics: TriSegAlgebraicSolutionV1["diagnostics"] & {
    readonly normalization: "separate-sum-absolute-wall-contributions-with-base-scale-fixed-per-jacobian";
    readonly jacobianEvaluations: number;
  };
};

const ML_TO_M3 = 1e-6;
const CM_TO_M = 1e-2;
const CM2_TO_M2 = 1e-4;
const PA_PER_MMHG = 133.322;
const MIN_POSITIVE = 1e-12;
const DEFAULT_MAX_ITERATIONS = 48;
const DEFAULT_RELATIVE_RESIDUAL_TOLERANCE = 1e-9;
const DEFAULT_FINITE_DIFFERENCE_RELATIVE_STEP = 2e-5;
const DEFAULT_MINIMUM_LINE_SEARCH_SCALE = 1 / 2048;

const COORDINATE_IDS: readonly TriSegGeometryCoordinateSIV1[] = [
  "leftVentricleCavityVolumeM3",
  "rightVentricleCavityVolumeM3",
  "septalCapVolumeM3",
  "junctionRadiusM",
];

export function evaluateTriSegGeometryV1(
  input: TriSegGeometryInputV1,
): TriSegGeometryOutputV1 {
  const failureReason = validateGeometryInput(input);
  if (failureReason !== null) {
    return invalidGeometry(input, failureReason);
  }

  const leftMidwallVolumeMl =
    input.leftVentricleCavityVolumeMl +
    0.5 *
      (input.walls.leftFreeWall.wallVolumeMl + input.walls.septum.wallVolumeMl);
  const rightMidwallVolumeMl =
    input.rightVentricleCavityVolumeMl +
    0.5 *
      (input.walls.rightFreeWall.wallVolumeMl +
        input.walls.septum.wallVolumeMl);
  const septalCapVolumeMl = input.algebraic.septalCapVolumeMl;

  const wallInputs: Readonly<Record<TriSegWallIdV1, WallEvaluationInput>> = {
    leftFreeWall: {
      signedCapVolumeMl: septalCapVolumeMl - leftMidwallVolumeMl,
      parameters: input.walls.leftFreeWall,
      capVolumeCoefficients: {
        leftVentricleCavityVolumeM3: -1,
        rightVentricleCavityVolumeM3: 0,
        septalCapVolumeM3: 1,
        junctionRadiusM: 0,
      },
    },
    septum: {
      signedCapVolumeMl: septalCapVolumeMl,
      parameters: input.walls.septum,
      capVolumeCoefficients: {
        leftVentricleCavityVolumeM3: 0,
        rightVentricleCavityVolumeM3: 0,
        septalCapVolumeM3: 1,
        junctionRadiusM: 0,
      },
    },
    rightFreeWall: {
      signedCapVolumeMl: septalCapVolumeMl + rightMidwallVolumeMl,
      parameters: input.walls.rightFreeWall,
      capVolumeCoefficients: {
        leftVentricleCavityVolumeM3: 0,
        rightVentricleCavityVolumeM3: 1,
        septalCapVolumeM3: 1,
        junctionRadiusM: 0,
      },
    },
  };

  const walls = {
    leftFreeWall: evaluateWallGeometry(
      "leftFreeWall",
      input.algebraic.junctionRadiusCm,
      wallInputs.leftFreeWall,
    ),
    septum: evaluateWallGeometry(
      "septum",
      input.algebraic.junctionRadiusCm,
      wallInputs.septum,
    ),
    rightFreeWall: evaluateWallGeometry(
      "rightFreeWall",
      input.algebraic.junctionRadiusCm,
      wallInputs.rightFreeWall,
    ),
  } satisfies TriSegWallGeometrySetV1;

  if (
    !TRISEG_WALL_IDS_V1.every((wallId) => wallGeometryIsFinite(walls[wallId]))
  ) {
    return invalidGeometry(
      input,
      "spherical-cap geometry produced a non-finite result",
    );
  }

  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    valid: true,
    finite: true,
    failureReason: null,
    input,
    walls,
  };
}

/** Original TriSeg approximation mapping representative fiber stress to wall tension. */
export function representativeTriSegMidwallTensionFromFiberStressV1(
  wall: TriSegWallGeometryV1,
  fiberStressPa: number,
): number {
  if (!Number.isFinite(fiberStressPa) || !wallGeometryIsFinite(wall)) {
    return Number.NaN;
  }
  const z2 = wall.curvatureThicknessRatioZ ** 2;
  const geometryCorrection = 1 + z2 / 3 + z2 ** 2 / 5;
  return (
    ((wall.wallVolumeM3 * fiberStressPa) / (2 * wall.midwallAreaM2)) *
    geometryCorrection
  );
}

export function triSegWallTensionsFromFiberStressesV1(
  geometry: TriSegGeometryOutputV1,
  fiberStressesPa: TriSegWallFiberStressesPaV1,
): TriSegWallTensionsV1 | null {
  if (
    !geometry.valid ||
    !TRISEG_WALL_IDS_V1.every((id) => Number.isFinite(fiberStressesPa[id]))
  ) {
    return null;
  }
  const tensions = {
    leftFreeWall: representativeTriSegMidwallTensionFromFiberStressV1(
      geometry.walls.leftFreeWall,
      fiberStressesPa.leftFreeWall,
    ),
    septum: representativeTriSegMidwallTensionFromFiberStressV1(
      geometry.walls.septum,
      fiberStressesPa.septum,
    ),
    rightFreeWall: representativeTriSegMidwallTensionFromFiberStressV1(
      geometry.walls.rightFreeWall,
      fiberStressesPa.rightFreeWall,
    ),
  };
  return TRISEG_WALL_IDS_V1.every((id) => Number.isFinite(tensions[id]))
    ? tensions
    : null;
}

/**
 * Opt-in generalized forces of the declared Hill fiber work pair
 *
 *   delta W = sum_w V_wall,w sigma_f,w delta epsilon_f,w.
 *
 * Derivatives use SI coordinates. Consequently, volume-coordinate gradients
 * are pressures (J/m^3 = Pa) and the radius-coordinate gradient is force
 * (J/m = N). Positive cavity-volume gradients are positive transmural-pressure
 * readbacks, matching evaluateTriSegVirtualWorkV1.
 */
export function evaluateTriSegFullFiberEnergyGradientV1(
  geometry: TriSegGeometryOutputV1,
  fiberStressesPa: TriSegWallFiberStressesPaV1,
): TriSegFullFiberEnergyGradientOutputV1 {
  if (!geometry.valid) {
    return invalidFullFiberEnergyGradient(
      `invalid geometry: ${geometry.failureReason}`,
    );
  }
  if (
    !TRISEG_WALL_IDS_V1.every((wallId) =>
      Number.isFinite(fiberStressesPa[wallId]),
    )
  ) {
    return invalidFullFiberEnergyGradient("all fiber stresses must be finite");
  }

  const wallContributionsSI = Object.fromEntries(
    TRISEG_WALL_IDS_V1.map((wallId) => {
      const wall = geometry.walls[wallId];
      const fiberWorkCoefficientJ = wall.wallVolumeM3 * fiberStressesPa[wallId];
      const contributions = Object.fromEntries(
        COORDINATE_IDS.map((coordinateId) => [
          coordinateId,
          fiberWorkCoefficientJ *
            wall.derivativesSI[coordinateId].dFiberNaturalStrain,
        ]),
      ) as Readonly<Record<TriSegGeometryCoordinateSIV1, number>>;
      return [wallId, contributions];
    }),
  ) as Readonly<
    Record<
      TriSegWallIdV1,
      Readonly<Record<TriSegGeometryCoordinateSIV1, number>>
    >
  >;
  const generalizedForcesSI = Object.fromEntries(
    COORDINATE_IDS.map((coordinateId) => [
      coordinateId,
      TRISEG_WALL_IDS_V1.reduce(
        (sum, wallId) => sum + wallContributionsSI[wallId][coordinateId],
        0,
      ),
    ]),
  ) as Readonly<Record<TriSegGeometryCoordinateSIV1, number>>;
  const septalCapContributionScalePa = Math.max(
    1e-6,
    TRISEG_WALL_IDS_V1.reduce(
      (sum, wallId) =>
        sum + Math.abs(wallContributionsSI[wallId].septalCapVolumeM3),
      0,
    ),
  );
  const junctionRadiusContributionScaleN = Math.max(
    1e-9,
    TRISEG_WALL_IDS_V1.reduce(
      (sum, wallId) =>
        sum + Math.abs(wallContributionsSI[wallId].junctionRadiusM),
      0,
    ),
  );
  const normalizedSeptalCapResidual =
    generalizedForcesSI.septalCapVolumeM3 / septalCapContributionScalePa;
  const normalizedJunctionRadiusResidual =
    generalizedForcesSI.junctionRadiusM / junctionRadiusContributionScaleN;
  const valuesToCheck = [
    ...TRISEG_WALL_IDS_V1.flatMap((wallId) =>
      Object.values(wallContributionsSI[wallId]),
    ),
    ...Object.values(generalizedForcesSI),
    septalCapContributionScalePa,
    junctionRadiusContributionScaleN,
    normalizedSeptalCapResidual,
    normalizedJunctionRadiusResidual,
  ];
  if (!valuesToCheck.every(Number.isFinite)) {
    return invalidFullFiberEnergyGradient(
      "full-fiber energy gradient produced a non-finite result",
    );
  }

  const leftVentricleTransmuralPa =
    generalizedForcesSI.leftVentricleCavityVolumeM3;
  const rightVentricleTransmuralPa =
    generalizedForcesSI.rightVentricleCavityVolumeM3;
  return {
    mapping: "full-fiber-energy-gradient",
    claimBoundary: TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1,
    valid: true,
    finite: true,
    failureReason: null,
    fiberStressesPa,
    wallContributionsSI,
    generalizedForcesSI,
    residuals: {
      septalCapPressurePa: generalizedForcesSI.septalCapVolumeM3,
      junctionRadiusForceN: generalizedForcesSI.junctionRadiusM,
      septalCapContributionScalePa,
      junctionRadiusContributionScaleN,
      normalizedSeptalCapResidual,
      normalizedJunctionRadiusResidual,
      relativeMagnitude: Math.hypot(
        normalizedSeptalCapResidual,
        normalizedJunctionRadiusResidual,
      ),
    },
    pressures: {
      leftVentricleTransmuralPa,
      rightVentricleTransmuralPa,
      leftVentricleTransmuralMmHg: leftVentricleTransmuralPa / PA_PER_MMHG,
      rightVentricleTransmuralMmHg: rightVentricleTransmuralPa / PA_PER_MMHG,
    },
  };
}

export function evaluateTriSegVirtualWorkV1(
  geometry: TriSegGeometryOutputV1,
  tensionsNPerM: TriSegWallTensionsV1,
): TriSegVirtualWorkOutputV1 {
  if (!geometry.valid) {
    return invalidVirtualWork(`invalid geometry: ${geometry.failureReason}`);
  }
  if (
    !TRISEG_WALL_IDS_V1.every((wallId) =>
      Number.isFinite(tensionsNPerM[wallId]),
    )
  ) {
    return invalidVirtualWork(
      "all representative wall tensions must be finite",
    );
  }

  const wallMechanics = {
    leftFreeWall: evaluateWallJunctionMechanics(
      geometry.walls.leftFreeWall,
      tensionsNPerM.leftFreeWall,
    ),
    septum: evaluateWallJunctionMechanics(
      geometry.walls.septum,
      tensionsNPerM.septum,
    ),
    rightFreeWall: evaluateWallJunctionMechanics(
      geometry.walls.rightFreeWall,
      tensionsNPerM.rightFreeWall,
    ),
  } satisfies Readonly<Record<TriSegWallIdV1, TriSegWallJunctionMechanicsV1>>;

  const axialLineTensionNPerM = sumWallValues(
    wallMechanics,
    "axialLineTensionNPerM",
  );
  const radialLineTensionNPerM = sumWallValues(
    wallMechanics,
    "radialLineTensionNPerM",
  );
  const septalCapPressurePa = sumWallValues(
    wallMechanics,
    "septalCapGeneralizedPressurePa",
  );
  const junctionRadiusForceN = sumWallValues(
    wallMechanics,
    "junctionRadiusGeneralizedForceN",
  );
  const tensionScaleNPerM = Math.max(
    1,
    TRISEG_WALL_IDS_V1.reduce(
      (sum, id) => sum + Math.abs(tensionsNPerM[id]),
      0,
    ),
  );
  const relativeMagnitude =
    Math.hypot(axialLineTensionNPerM, radialLineTensionNPerM) /
    tensionScaleNPerM;

  const leftVentricleTransmuralPa =
    -wallMechanics.leftFreeWall.transmuralPressurePa;
  const rightVentricleTransmuralPa =
    wallMechanics.rightFreeWall.transmuralPressurePa;
  const pressureFromAreaDerivative = {
    leftVentricle: generalizedPressureFromAreaDerivatives(
      geometry.walls,
      tensionsNPerM,
      "leftVentricleCavityVolumeM3",
    ),
    rightVentricle: generalizedPressureFromAreaDerivatives(
      geometry.walls,
      tensionsNPerM,
      "rightVentricleCavityVolumeM3",
    ),
    septalCap: generalizedPressureFromAreaDerivatives(
      geometry.walls,
      tensionsNPerM,
      "septalCapVolumeM3",
    ),
    junctionRadius: generalizedPressureFromAreaDerivatives(
      geometry.walls,
      tensionsNPerM,
      "junctionRadiusM",
    ),
  };

  const valuesToCheck = [
    ...TRISEG_WALL_IDS_V1.flatMap((id) => Object.values(wallMechanics[id])),
    axialLineTensionNPerM,
    radialLineTensionNPerM,
    septalCapPressurePa,
    junctionRadiusForceN,
    relativeMagnitude,
    leftVentricleTransmuralPa,
    rightVentricleTransmuralPa,
    ...Object.values(pressureFromAreaDerivative),
  ];
  if (!valuesToCheck.every(Number.isFinite)) {
    return invalidVirtualWork(
      "virtual-work evaluation produced a non-finite result",
    );
  }

  return {
    valid: true,
    finite: true,
    failureReason: null,
    wallMechanics,
    residuals: {
      axialLineTensionNPerM,
      radialLineTensionNPerM,
      septalCapPressurePa,
      junctionRadiusForceN,
      relativeMagnitude,
    },
    pressures: {
      leftVentricleTransmuralPa,
      rightVentricleTransmuralPa,
      leftVentricleTransmuralMmHg: leftVentricleTransmuralPa / PA_PER_MMHG,
      rightVentricleTransmuralMmHg: rightVentricleTransmuralPa / PA_PER_MMHG,
    },
    virtualWorkIdentityResiduals: {
      leftVentriclePressurePa:
        leftVentricleTransmuralPa - pressureFromAreaDerivative.leftVentricle,
      rightVentriclePressurePa:
        rightVentricleTransmuralPa - pressureFromAreaDerivative.rightVentricle,
      septalCapPressurePa:
        septalCapPressurePa - pressureFromAreaDerivative.septalCap,
      junctionRadiusForceN:
        junctionRadiusForceN - pressureFromAreaDerivative.junctionRadius,
    },
  };
}

/**
 * Bounded, stateless algebraic solve. The tension provider is re-evaluated at
 * every trial geometry so Hill/SLS stress can depend on wall strain. Failure
 * never mutates the caller's continuation state and returns the best finite
 * iterate found. The provider must therefore be a pure trial evaluator: do not
 * commit Hill/SLS state from inside the callback.
 */
export function solveTriSegAlgebraicEquilibriumV1(
  input: TriSegGeometryBaseInputV1,
  tensionProviderOrValues: TriSegTensionProviderV1 | TriSegWallTensionsV1,
  initialCoordinates?: TriSegAlgebraicCoordinatesV1,
  options: TriSegAlgebraicSolverOptionsV1 = {},
): TriSegAlgebraicSolutionV1 {
  const bounds = realizeSolverBounds(input, options.bounds);
  const fallbackCoordinates = defaultInitialCoordinates(input, bounds);
  const requestedInitialCoordinates = initialCoordinates ?? fallbackCoordinates;
  const clampedInitialCoordinates = clampCoordinates(
    requestedInitialCoordinates,
    bounds,
  );
  const initialCoordinatesWereClamped = !coordinatesEqual(
    requestedInitialCoordinates,
    clampedInitialCoordinates,
  );
  const baseGeometryInput: TriSegGeometryInputV1 = {
    ...input,
    algebraic: clampedInitialCoordinates,
  };
  const baseValidationFailure = validateGeometryInput(baseGeometryInput);
  const boundsValidationFailure = validateSolverBounds(bounds);

  if (baseValidationFailure !== null) {
    const geometry = evaluateTriSegGeometryV1(baseGeometryInput);
    return failedSolution(
      geometry,
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "invalid-base-input",
      baseValidationFailure,
    );
  }
  if (boundsValidationFailure !== null) {
    const geometry = evaluateTriSegGeometryV1(baseGeometryInput);
    return failedSolution(
      geometry,
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "invalid-bounds",
      boundsValidationFailure,
    );
  }

  const provider: TriSegTensionProviderV1 =
    typeof tensionProviderOrValues === "function"
      ? tensionProviderOrValues
      : () => tensionProviderOrValues;
  const maxIterations = boundedInteger(
    options.maxIterations,
    DEFAULT_MAX_ITERATIONS,
    1,
    200,
  );
  const tolerance = boundedPositive(
    options.relativeResidualTolerance,
    DEFAULT_RELATIVE_RESIDUAL_TOLERANCE,
    1e-14,
    1e-2,
  );
  const finiteDifferenceRelativeStep = boundedPositive(
    options.finiteDifferenceRelativeStep,
    DEFAULT_FINITE_DIFFERENCE_RELATIVE_STEP,
    1e-8,
    1e-2,
  );
  const minimumLineSearchScale = boundedPositive(
    options.minimumLineSearchScale,
    DEFAULT_MINIMUM_LINE_SEARCH_SCALE,
    1 / 65536,
    0.5,
  );

  let functionEvaluations = 0;
  let providerFailureReason: string | null = null;
  const evaluatePoint = (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ): SolverPoint | null => {
    const geometry = evaluateTriSegGeometryV1({
      ...input,
      algebraic: coordinates,
    });
    functionEvaluations += 1;
    if (!geometry.valid) {
      return null;
    }
    let tensions: TriSegWallTensionsV1;
    try {
      tensions = provider(geometry);
    } catch (error) {
      providerFailureReason =
        error instanceof Error ? error.message : String(error);
      return null;
    }
    const virtualWork = evaluateTriSegVirtualWorkV1(geometry, tensions);
    if (!virtualWork.valid) {
      providerFailureReason = virtualWork.failureReason;
      return null;
    }
    return {
      coordinates,
      geometry,
      tensions,
      virtualWork,
      relativeResidualMagnitude: virtualWork.residuals.relativeMagnitude,
    };
  };

  let current = evaluatePoint(clampedInitialCoordinates);
  if (current === null) {
    const geometry = evaluateTriSegGeometryV1(baseGeometryInput);
    return failedSolution(
      geometry,
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "tension-provider-failure",
      providerFailureReason ??
        "no finite tension/virtual-work evaluation at the initial geometry",
      functionEvaluations,
    );
  }

  let best = current;
  const trace: TriSegAlgebraicSolverTracePointV1[] = [
    {
      iteration: 0,
      coordinates: current.coordinates,
      relativeResidualMagnitude: current.relativeResidualMagnitude,
    },
  ];
  let termination: TriSegAlgebraicSolverTerminationV1 = "maximum-iterations";
  let failureReason: string | null = null;
  let completedIterations = 0;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    completedIterations = iteration;
    if (current.relativeResidualMagnitude <= tolerance) {
      termination = "converged";
      break;
    }

    const coordinateScale = solverCoordinateScale(input, current.coordinates);
    const jacobian = numericalResidualJacobian(
      current,
      input,
      bounds,
      coordinateScale,
      finiteDifferenceRelativeStep,
      evaluatePoint,
    );
    if (jacobian === null) {
      termination = "no-finite-trial";
      failureReason =
        providerFailureReason ??
        "could not construct a finite residual Jacobian";
      break;
    }

    const residual = normalizedResidualVector(current, current.tensions);
    let accepted: SolverPoint | null = null;
    // Numerical regularization only; this is not a physical damping term.
    const regularizationValues = [0, 1e-10, 1e-8, 1e-6, 1e-4, 1e-2, 1, 100];
    for (const regularization of regularizationValues) {
      const normalizedStep = solveLevenbergMarquardtStep(
        jacobian,
        residual,
        regularization,
      );
      if (normalizedStep === null) {
        continue;
      }
      const limitedStep = limitVectorNorm(normalizedStep, 1.5);
      for (
        let lineScale = 1;
        lineScale >= minimumLineSearchScale;
        lineScale *= 0.5
      ) {
        const candidateCoordinates = clampCoordinates(
          {
            junctionRadiusCm:
              current.coordinates.junctionRadiusCm +
              lineScale * limitedStep[0] * coordinateScale.junctionRadiusCm,
            septalCapVolumeMl:
              current.coordinates.septalCapVolumeMl +
              lineScale * limitedStep[1] * coordinateScale.septalCapVolumeMl,
          },
          bounds,
        );
        if (coordinatesEqual(candidateCoordinates, current.coordinates)) {
          continue;
        }
        const candidate = evaluatePoint(candidateCoordinates);
        if (
          candidate !== null &&
          candidate.relativeResidualMagnitude <
            current.relativeResidualMagnitude
        ) {
          accepted = candidate;
          break;
        }
      }
      if (accepted !== null) {
        break;
      }
    }

    if (accepted === null) {
      accepted = bestPatternSearchTrial(
        current,
        coordinateScale,
        bounds,
        evaluatePoint,
      );
    }
    if (accepted === null) {
      termination = "stagnated";
      failureReason =
        providerFailureReason ??
        "bounded line search could not reduce the residual";
      break;
    }

    current = accepted;
    if (current.relativeResidualMagnitude < best.relativeResidualMagnitude) {
      best = current;
    }
    trace.push({
      iteration: iteration + 1,
      coordinates: current.coordinates,
      relativeResidualMagnitude: current.relativeResidualMagnitude,
    });
    completedIterations = iteration + 1;
  }

  if (best.relativeResidualMagnitude <= tolerance) {
    termination = "converged";
    failureReason = null;
  } else if (termination === "maximum-iterations") {
    failureReason = `relative residual ${best.relativeResidualMagnitude} exceeded tolerance ${tolerance}`;
  }

  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    converged: termination === "converged",
    coordinates: best.coordinates,
    geometry: best.geometry,
    tensionsNPerM: best.tensions,
    virtualWork: best.virtualWork,
    diagnostics: {
      termination,
      failureReason,
      iterations: completedIterations,
      functionEvaluations,
      initialCoordinatesWereClamped,
      relativeResidualMagnitude: best.relativeResidualMagnitude,
      bounds,
      trace,
    },
  };
}

/**
 * Bounded algebraic solve for the opt-in full-fiber work-gradient mapping.
 * The stress provider is a pure trial evaluator and is re-evaluated at every
 * geometry. No representative T_m/T_x/T_y is invented for this mapping.
 *
 * Q_s [Pa] and Q_y [N] are normalized separately by their sum-absolute wall
 * contributions. During each finite-difference Jacobian the base-point scales
 * are held fixed, so unit mixing or scale derivatives cannot enter the Newton
 * matrix.
 */
export function solveTriSegFullFiberEnergyGradientEquilibriumV1(
  input: TriSegGeometryBaseInputV1,
  stressProviderOrValues:
    TriSegFiberStressProviderV1 | TriSegWallFiberStressesPaV1,
  initialCoordinates?: TriSegAlgebraicCoordinatesV1,
  options: TriSegAlgebraicSolverOptionsV1 = {},
): TriSegFullFiberEnergyGradientSolutionV1 {
  const bounds = realizeSolverBounds(input, options.bounds);
  const fallbackCoordinates = defaultInitialCoordinates(input, bounds);
  const requestedInitialCoordinates = initialCoordinates ?? fallbackCoordinates;
  const clampedInitialCoordinates = clampCoordinates(
    requestedInitialCoordinates,
    bounds,
  );
  const initialCoordinatesWereClamped = !coordinatesEqual(
    requestedInitialCoordinates,
    clampedInitialCoordinates,
  );
  const baseGeometryInput: TriSegGeometryInputV1 = {
    ...input,
    algebraic: clampedInitialCoordinates,
  };
  const baseValidationFailure = validateGeometryInput(baseGeometryInput);
  const boundsValidationFailure = validateSolverBounds(bounds);

  if (baseValidationFailure !== null) {
    return failedFullFiberEnergyGradientSolution(
      evaluateTriSegGeometryV1(baseGeometryInput),
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "invalid-base-input",
      baseValidationFailure,
    );
  }
  if (boundsValidationFailure !== null) {
    return failedFullFiberEnergyGradientSolution(
      evaluateTriSegGeometryV1(baseGeometryInput),
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "invalid-bounds",
      boundsValidationFailure,
    );
  }

  const provider: TriSegFiberStressProviderV1 =
    typeof stressProviderOrValues === "function"
      ? stressProviderOrValues
      : () => stressProviderOrValues;
  const maxIterations = boundedInteger(
    options.maxIterations,
    DEFAULT_MAX_ITERATIONS,
    1,
    200,
  );
  const tolerance = boundedPositive(
    options.relativeResidualTolerance,
    DEFAULT_RELATIVE_RESIDUAL_TOLERANCE,
    1e-14,
    1e-2,
  );
  const finiteDifferenceRelativeStep = boundedPositive(
    options.finiteDifferenceRelativeStep,
    DEFAULT_FINITE_DIFFERENCE_RELATIVE_STEP,
    1e-8,
    1e-2,
  );
  const minimumLineSearchScale = boundedPositive(
    options.minimumLineSearchScale,
    DEFAULT_MINIMUM_LINE_SEARCH_SCALE,
    1 / 65536,
    0.5,
  );

  let functionEvaluations = 0;
  let jacobianEvaluations = 0;
  let providerFailureReason: string | null = null;
  const evaluatePoint = (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ): FullFiberSolverPoint | null => {
    const geometry = evaluateTriSegGeometryV1({
      ...input,
      algebraic: coordinates,
    });
    functionEvaluations += 1;
    if (!geometry.valid) return null;
    let fiberStressesPa: TriSegWallFiberStressesPaV1;
    try {
      fiberStressesPa = provider(geometry);
    } catch (error) {
      providerFailureReason =
        error instanceof Error ? error.message : String(error);
      return null;
    }
    const fullFiberEnergyGradient = evaluateTriSegFullFiberEnergyGradientV1(
      geometry,
      fiberStressesPa,
    );
    if (!fullFiberEnergyGradient.valid) {
      providerFailureReason = fullFiberEnergyGradient.failureReason;
      return null;
    }
    return {
      coordinates,
      geometry,
      fiberStressesPa,
      fullFiberEnergyGradient,
      relativeResidualMagnitude:
        fullFiberEnergyGradient.residuals.relativeMagnitude,
    };
  };

  let current = evaluatePoint(clampedInitialCoordinates);
  if (current === null) {
    return failedFullFiberEnergyGradientSolution(
      evaluateTriSegGeometryV1(baseGeometryInput),
      clampedInitialCoordinates,
      bounds,
      initialCoordinatesWereClamped,
      "fiber-stress-provider-failure",
      providerFailureReason ??
        "no finite fiber-stress/work-gradient evaluation at the initial geometry",
      functionEvaluations,
    );
  }

  let best = current;
  const trace: TriSegAlgebraicSolverTracePointV1[] = [
    {
      iteration: 0,
      coordinates: current.coordinates,
      relativeResidualMagnitude: current.relativeResidualMagnitude,
    },
  ];
  let termination: TriSegAlgebraicSolverTerminationV1 = "maximum-iterations";
  let failureReason: string | null = null;
  let completedIterations = 0;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    completedIterations = iteration;
    if (current.relativeResidualMagnitude <= tolerance) {
      termination = "converged";
      break;
    }

    const coordinateScale = solverCoordinateScale(input, current.coordinates);
    const jacobian = numericalFullFiberResidualJacobian(
      current,
      bounds,
      coordinateScale,
      finiteDifferenceRelativeStep,
      evaluatePoint,
    );
    jacobianEvaluations += 1;
    if (jacobian === null) {
      termination = "no-finite-trial";
      failureReason =
        providerFailureReason ??
        "could not construct a finite residual Jacobian";
      break;
    }

    const residual = normalizedFullFiberResidualVector(current, current);
    const currentBaseScaleResidualNorm = Math.hypot(...residual);
    let accepted: FullFiberSolverPoint | null = null;
    for (const regularization of [0, 1e-10, 1e-8, 1e-6, 1e-4, 1e-2, 1, 100]) {
      const normalizedStep = solveLevenbergMarquardtStep(
        jacobian,
        residual,
        regularization,
      );
      if (normalizedStep === null) continue;
      const limitedStep = limitVectorNorm(normalizedStep, 1.5);
      for (
        let lineScale = 1;
        lineScale >= minimumLineSearchScale;
        lineScale *= 0.5
      ) {
        const candidateCoordinates = clampCoordinates(
          {
            junctionRadiusCm:
              current.coordinates.junctionRadiusCm +
              lineScale * limitedStep[0] * coordinateScale.junctionRadiusCm,
            septalCapVolumeMl:
              current.coordinates.septalCapVolumeMl +
              lineScale * limitedStep[1] * coordinateScale.septalCapVolumeMl,
          },
          bounds,
        );
        if (coordinatesEqual(candidateCoordinates, current.coordinates))
          continue;
        const candidate = evaluatePoint(candidateCoordinates);
        if (
          candidate !== null &&
          fullFiberResidualNormWithScales(candidate, current) <
            currentBaseScaleResidualNorm
        ) {
          accepted = candidate;
          break;
        }
      }
      if (accepted !== null) break;
    }

    if (accepted === null) {
      accepted = bestFullFiberPatternSearchTrial(
        current,
        coordinateScale,
        bounds,
        evaluatePoint,
      );
    }
    if (accepted === null) {
      termination = "stagnated";
      failureReason =
        providerFailureReason ??
        "bounded line search could not reduce the residual";
      break;
    }

    current = accepted;
    if (current.relativeResidualMagnitude < best.relativeResidualMagnitude)
      best = current;
    trace.push({
      iteration: iteration + 1,
      coordinates: current.coordinates,
      relativeResidualMagnitude: current.relativeResidualMagnitude,
    });
    completedIterations = iteration + 1;
  }

  if (best.relativeResidualMagnitude <= tolerance) {
    termination = "converged";
    failureReason = null;
  } else if (termination === "maximum-iterations") {
    failureReason = `relative residual ${best.relativeResidualMagnitude} exceeded tolerance ${tolerance}`;
  }

  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    generalizedForceMapping: "full-fiber-energy-gradient",
    converged: termination === "converged",
    coordinates: best.coordinates,
    geometry: best.geometry,
    fiberStressesPa: best.fiberStressesPa,
    fullFiberEnergyGradient: best.fullFiberEnergyGradient,
    diagnostics: {
      termination,
      failureReason,
      iterations: completedIterations,
      functionEvaluations,
      initialCoordinatesWereClamped,
      relativeResidualMagnitude: best.relativeResidualMagnitude,
      bounds,
      trace,
      normalization:
        "separate-sum-absolute-wall-contributions-with-base-scale-fixed-per-jacobian",
      jacobianEvaluations,
    },
  };
}

type WallEvaluationInput = {
  readonly signedCapVolumeMl: number;
  readonly parameters: TriSegWallParametersV1;
  readonly capVolumeCoefficients: Readonly<
    Record<TriSegGeometryCoordinateSIV1, number>
  >;
};

type SolverPoint = {
  readonly coordinates: TriSegAlgebraicCoordinatesV1;
  readonly geometry: TriSegGeometryValidOutputV1;
  readonly tensions: TriSegWallTensionsV1;
  readonly virtualWork: TriSegVirtualWorkValidOutputV1;
  readonly relativeResidualMagnitude: number;
};

type FullFiberSolverPoint = {
  readonly coordinates: TriSegAlgebraicCoordinatesV1;
  readonly geometry: TriSegGeometryValidOutputV1;
  readonly fiberStressesPa: TriSegWallFiberStressesPaV1;
  readonly fullFiberEnergyGradient: TriSegFullFiberEnergyGradientValidOutputV1;
  readonly relativeResidualMagnitude: number;
};

function evaluateWallGeometry(
  wallId: TriSegWallIdV1,
  junctionRadiusCm: number,
  input: WallEvaluationInput,
): TriSegWallGeometryV1 {
  const signedCapVolumeM3 = input.signedCapVolumeMl * ML_TO_M3;
  const junctionRadiusM = junctionRadiusCm * CM_TO_M;
  const axialDistanceM = axialDistanceFromCapVolume(
    signedCapVolumeM3,
    junctionRadiusM,
  );
  const squaredRadius = axialDistanceM ** 2 + junctionRadiusM ** 2;
  const midwallAreaM2 = Math.PI * squaredRadius;
  const curvaturePerM = (2 * axialDistanceM) / squaredRadius;
  const wallVolumeM3 = input.parameters.wallVolumeMl * ML_TO_M3;
  const referenceMidwallAreaM2 =
    input.parameters.referenceMidwallAreaCm2 * CM2_TO_M2;
  const curvatureThicknessRatioZ =
    (3 * curvaturePerM * wallVolumeM3) / (2 * midwallAreaM2);
  const areaNaturalStrain =
    0.5 * Math.log(midwallAreaM2 / referenceMidwallAreaM2);
  const fiberNaturalStrain =
    areaNaturalStrain -
    curvatureThicknessRatioZ ** 2 / 12 -
    0.019 * curvatureThicknessRatioZ ** 4;

  const dXdCapVolume = 2 / midwallAreaM2;
  const dXdJunctionRadius =
    (-2 * axialDistanceM * junctionRadiusM) / squaredRadius;
  const dAreaDCapVolume = (4 * axialDistanceM) / squaredRadius;
  const dAreaDJunctionRadius =
    (2 *
      Math.PI *
      junctionRadiusM *
      (junctionRadiusM ** 2 - axialDistanceM ** 2)) /
    squaredRadius;
  const dCurvatureDCapVolume =
    (4 * (junctionRadiusM ** 2 - axialDistanceM ** 2)) /
    (Math.PI * squaredRadius ** 3);
  const dCurvatureDJunctionRadius =
    (-8 * axialDistanceM * junctionRadiusM ** 3) / squaredRadius ** 3;

  const derivativesSI = Object.fromEntries(
    COORDINATE_IDS.map((coordinateId) => {
      const isRadiusCoordinate = coordinateId === "junctionRadiusM";
      const capVolumeCoefficient = input.capVolumeCoefficients[coordinateId];
      const dSignedMidwallCapVolumeM3 = isRadiusCoordinate
        ? 0
        : capVolumeCoefficient;
      const dAxialDistanceM = isRadiusCoordinate
        ? dXdJunctionRadius
        : dXdCapVolume * capVolumeCoefficient;
      const dMidwallAreaM2 = isRadiusCoordinate
        ? dAreaDJunctionRadius
        : dAreaDCapVolume * capVolumeCoefficient;
      const dCurvaturePerM = isRadiusCoordinate
        ? dCurvatureDJunctionRadius
        : dCurvatureDCapVolume * capVolumeCoefficient;
      const dCurvatureThicknessRatioZ =
        ((3 * wallVolumeM3) / 2) *
        (dCurvaturePerM / midwallAreaM2 -
          (curvaturePerM * dMidwallAreaM2) / midwallAreaM2 ** 2);
      const dAreaNaturalStrain = (0.5 * dMidwallAreaM2) / midwallAreaM2;
      const dFiberNaturalStrain =
        dAreaNaturalStrain -
        (curvatureThicknessRatioZ / 6 + 0.076 * curvatureThicknessRatioZ ** 3) *
          dCurvatureThicknessRatioZ;
      return [
        coordinateId,
        {
          dSignedMidwallCapVolumeM3,
          dAxialDistanceM,
          dMidwallAreaM2,
          dCurvaturePerM,
          dCurvatureThicknessRatioZ,
          dAreaNaturalStrain,
          dFiberNaturalStrain,
        } satisfies TriSegWallGeometryDerivativeV1,
      ];
    }),
  ) as Record<TriSegGeometryCoordinateSIV1, TriSegWallGeometryDerivativeV1>;

  return {
    wallId,
    signedMidwallCapVolumeMl: input.signedCapVolumeMl,
    signedMidwallCapVolumeM3: signedCapVolumeM3,
    axialDistanceCm: axialDistanceM / CM_TO_M,
    axialDistanceM,
    junctionRadiusCm,
    junctionRadiusM,
    midwallAreaCm2: midwallAreaM2 / CM2_TO_M2,
    midwallAreaM2,
    referenceMidwallAreaCm2: input.parameters.referenceMidwallAreaCm2,
    curvaturePerCm: curvaturePerM * CM_TO_M,
    curvaturePerM,
    wallVolumeMl: input.parameters.wallVolumeMl,
    wallVolumeM3,
    curvatureThicknessRatioZ,
    areaNaturalStrain,
    fiberNaturalStrain,
    derivativesSI,
  };
}

function axialDistanceFromCapVolume(
  signedCapVolumeM3: number,
  junctionRadiusM: number,
): number {
  // Stable real root of x^3 + 3 y^2 x - 6 V/pi = 0.
  const argument = (3 * signedCapVolumeM3) / (Math.PI * junctionRadiusM ** 3);
  return 2 * junctionRadiusM * Math.sinh(Math.asinh(argument) / 3);
}

function evaluateWallJunctionMechanics(
  wall: TriSegWallGeometryV1,
  tensionNPerM: number,
): TriSegWallJunctionMechanicsV1 {
  const x = wall.axialDistanceM;
  const y = wall.junctionRadiusM;
  const squaredRadius = x ** 2 + y ** 2;
  const axialLineTensionNPerM = (tensionNPerM * 2 * x * y) / squaredRadius;
  const radialLineTensionNPerM =
    (tensionNPerM * (y ** 2 - x ** 2)) / squaredRadius;
  const transmuralPressurePa = (2 * axialLineTensionNPerM) / y;
  return {
    tensionNPerM,
    axialLineTensionNPerM,
    radialLineTensionNPerM,
    transmuralPressurePa,
    septalCapGeneralizedPressurePa: transmuralPressurePa,
    junctionRadiusGeneralizedForceN: 2 * Math.PI * y * radialLineTensionNPerM,
  };
}

function generalizedPressureFromAreaDerivatives(
  walls: TriSegWallGeometrySetV1,
  tensions: TriSegWallTensionsV1,
  coordinateId: TriSegGeometryCoordinateSIV1,
): number {
  return TRISEG_WALL_IDS_V1.reduce(
    (sum, wallId) =>
      sum +
      tensions[wallId] *
        walls[wallId].derivativesSI[coordinateId].dMidwallAreaM2,
    0,
  );
}

function sumWallValues(
  values: Readonly<Record<TriSegWallIdV1, TriSegWallJunctionMechanicsV1>>,
  key: keyof TriSegWallJunctionMechanicsV1,
): number {
  return TRISEG_WALL_IDS_V1.reduce(
    (sum, wallId) => sum + values[wallId][key],
    0,
  );
}

function validateGeometryInput(input: TriSegGeometryInputV1): string | null {
  if (
    !Number.isFinite(input.leftVentricleCavityVolumeMl) ||
    input.leftVentricleCavityVolumeMl < 0
  ) {
    return "leftVentricleCavityVolumeMl must be finite and nonnegative";
  }
  if (
    !Number.isFinite(input.rightVentricleCavityVolumeMl) ||
    input.rightVentricleCavityVolumeMl < 0
  ) {
    return "rightVentricleCavityVolumeMl must be finite and nonnegative";
  }
  if (
    !Number.isFinite(input.algebraic.junctionRadiusCm) ||
    input.algebraic.junctionRadiusCm <= MIN_POSITIVE
  ) {
    return "junctionRadiusCm must be finite and positive";
  }
  if (!Number.isFinite(input.algebraic.septalCapVolumeMl)) {
    return "septalCapVolumeMl must be finite";
  }
  for (const wallId of TRISEG_WALL_IDS_V1) {
    const wall = input.walls[wallId];
    if (wall === undefined) {
      return `missing wall parameters for ${wallId}`;
    }
    if (
      !Number.isFinite(wall.wallVolumeMl) ||
      wall.wallVolumeMl <= MIN_POSITIVE
    ) {
      return `${wallId}.wallVolumeMl must be finite and positive`;
    }
    if (
      !Number.isFinite(wall.referenceMidwallAreaCm2) ||
      wall.referenceMidwallAreaCm2 <= MIN_POSITIVE
    ) {
      return `${wallId}.referenceMidwallAreaCm2 must be finite and positive`;
    }
  }
  return null;
}

function wallGeometryIsFinite(wall: TriSegWallGeometryV1): boolean {
  return (
    [
      wall.signedMidwallCapVolumeM3,
      wall.axialDistanceM,
      wall.junctionRadiusM,
      wall.midwallAreaM2,
      wall.curvaturePerM,
      wall.wallVolumeM3,
      wall.curvatureThicknessRatioZ,
      wall.areaNaturalStrain,
      wall.fiberNaturalStrain,
      ...COORDINATE_IDS.flatMap((coordinateId) =>
        Object.values(wall.derivativesSI[coordinateId]),
      ),
    ].every(Number.isFinite) && wall.midwallAreaM2 > 0
  );
}

function invalidGeometry(
  input: TriSegGeometryInputV1,
  failureReason: string,
): TriSegGeometryInvalidOutputV1 {
  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    valid: false,
    finite: false,
    failureReason,
    input,
    walls: null,
  };
}

function invalidVirtualWork(
  failureReason: string,
): TriSegVirtualWorkInvalidOutputV1 {
  return {
    valid: false,
    finite: false,
    failureReason,
    wallMechanics: null,
    residuals: null,
    pressures: null,
    virtualWorkIdentityResiduals: null,
  };
}

function invalidFullFiberEnergyGradient(
  failureReason: string,
): TriSegFullFiberEnergyGradientInvalidOutputV1 {
  return {
    mapping: "full-fiber-energy-gradient",
    claimBoundary: TRISEG_FULL_FIBER_ENERGY_GRADIENT_CLAIM_BOUNDARY_V1,
    valid: false,
    finite: false,
    failureReason,
    fiberStressesPa: null,
    wallContributionsSI: null,
    generalizedForcesSI: null,
    residuals: null,
    pressures: null,
  };
}

function realizeSolverBounds(
  input: TriSegGeometryBaseInputV1,
  overrides: Partial<TriSegAlgebraicSolverBoundsV1> | undefined,
): TriSegAlgebraicSolverBoundsV1 {
  const totalScaleMl = Math.max(
    1,
    input.leftVentricleCavityVolumeMl +
      input.rightVentricleCavityVolumeMl +
      TRISEG_WALL_IDS_V1.reduce(
        (sum, id) => sum + (input.walls[id]?.wallVolumeMl ?? 0),
        0,
      ),
  );
  const volumeRadiusCm = Math.cbrt((3 * totalScaleMl) / (4 * Math.PI));
  const defaultBounds: TriSegAlgebraicSolverBoundsV1 = {
    junctionRadiusCm: [0.1, Math.max(12, 3 * volumeRadiusCm)],
    septalCapVolumeMl: [
      -Math.max(500, 2 * totalScaleMl),
      Math.max(500, 2 * totalScaleMl),
    ],
  };
  return {
    junctionRadiusCm:
      overrides?.junctionRadiusCm ?? defaultBounds.junctionRadiusCm,
    septalCapVolumeMl:
      overrides?.septalCapVolumeMl ?? defaultBounds.septalCapVolumeMl,
  };
}

function validateSolverBounds(
  bounds: TriSegAlgebraicSolverBoundsV1,
): string | null {
  const [yMin, yMax] = bounds.junctionRadiusCm;
  const [vMin, vMax] = bounds.septalCapVolumeMl;
  if (![yMin, yMax, vMin, vMax].every(Number.isFinite)) {
    return "all algebraic solver bounds must be finite";
  }
  if (yMin <= 0 || yMax <= yMin) {
    return "junctionRadiusCm bounds must satisfy 0 < min < max";
  }
  if (vMax <= vMin) {
    return "septalCapVolumeMl bounds must satisfy min < max";
  }
  return null;
}

function defaultInitialCoordinates(
  input: TriSegGeometryBaseInputV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
): TriSegAlgebraicCoordinatesV1 {
  const totalMidwallVolumeMl =
    input.leftVentricleCavityVolumeMl +
    input.rightVentricleCavityVolumeMl +
    0.5 *
      (input.walls.leftFreeWall.wallVolumeMl +
        input.walls.rightFreeWall.wallVolumeMl +
        2 * input.walls.septum.wallVolumeMl);
  const radiusScaleCm = Math.cbrt(
    (Math.max(totalMidwallVolumeMl, 1) * 3) / (4 * Math.PI),
  );
  return clampCoordinates(
    {
      junctionRadiusCm: Math.max(1, 0.8 * radiusScaleCm),
      septalCapVolumeMl: 0,
    },
    bounds,
  );
}

function clampCoordinates(
  coordinates: TriSegAlgebraicCoordinatesV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
): TriSegAlgebraicCoordinatesV1 {
  return {
    junctionRadiusCm: clampFinite(
      coordinates.junctionRadiusCm,
      bounds.junctionRadiusCm[0],
      bounds.junctionRadiusCm[1],
    ),
    septalCapVolumeMl: clampFinite(
      coordinates.septalCapVolumeMl,
      bounds.septalCapVolumeMl[0],
      bounds.septalCapVolumeMl[1],
    ),
  };
}

function clampFinite(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return 0.5 * (minimum + maximum);
  }
  return Math.min(maximum, Math.max(minimum, value));
}

function coordinatesEqual(
  left: TriSegAlgebraicCoordinatesV1,
  right: TriSegAlgebraicCoordinatesV1,
): boolean {
  return (
    left.junctionRadiusCm === right.junctionRadiusCm &&
    left.septalCapVolumeMl === right.septalCapVolumeMl
  );
}

function solverCoordinateScale(
  input: TriSegGeometryBaseInputV1,
  coordinates: TriSegAlgebraicCoordinatesV1,
): TriSegAlgebraicCoordinatesV1 {
  const totalMidwallVolumeMl = Math.max(
    1,
    input.leftVentricleCavityVolumeMl +
      input.rightVentricleCavityVolumeMl +
      0.5 *
        (input.walls.leftFreeWall.wallVolumeMl +
          input.walls.rightFreeWall.wallVolumeMl +
          2 * input.walls.septum.wallVolumeMl),
  );
  return {
    junctionRadiusCm: Math.max(0.5, Math.abs(coordinates.junctionRadiusCm)),
    septalCapVolumeMl: Math.max(
      10,
      Math.abs(coordinates.septalCapVolumeMl),
      0.25 * totalMidwallVolumeMl,
    ),
  };
}

function normalizedResidualVector(
  point: SolverPoint,
  tensions: TriSegWallTensionsV1,
): readonly [number, number] {
  const scale = Math.max(
    1,
    TRISEG_WALL_IDS_V1.reduce((sum, id) => sum + Math.abs(tensions[id]), 0),
  );
  return [
    point.virtualWork.residuals.axialLineTensionNPerM / scale,
    point.virtualWork.residuals.radialLineTensionNPerM / scale,
  ];
}

function normalizedFullFiberResidualVector(
  point: FullFiberSolverPoint,
  scalePoint: FullFiberSolverPoint,
): readonly [number, number] {
  return [
    point.fullFiberEnergyGradient.residuals.septalCapPressurePa /
      scalePoint.fullFiberEnergyGradient.residuals.septalCapContributionScalePa,
    point.fullFiberEnergyGradient.residuals.junctionRadiusForceN /
      scalePoint.fullFiberEnergyGradient.residuals
        .junctionRadiusContributionScaleN,
  ];
}

function fullFiberResidualNormWithScales(
  point: FullFiberSolverPoint,
  scalePoint: FullFiberSolverPoint,
): number {
  return Math.hypot(...normalizedFullFiberResidualVector(point, scalePoint));
}

function numericalFullFiberResidualJacobian(
  base: FullFiberSolverPoint,
  bounds: TriSegAlgebraicSolverBoundsV1,
  scale: TriSegAlgebraicCoordinatesV1,
  relativeStep: number,
  evaluatePoint: (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ) => FullFiberSolverPoint | null,
): readonly [readonly [number, number], readonly [number, number]] | null {
  const baseResidual = normalizedFullFiberResidualVector(base, base);
  const columns: Array<readonly [number, number]> = [];
  const coordinateKeys = ["junctionRadiusCm", "septalCapVolumeMl"] as const;
  for (const key of coordinateKeys) {
    const step = relativeStep * scale[key];
    const lowerValue = Math.max(bounds[key][0], base.coordinates[key] - step);
    const upperValue = Math.min(bounds[key][1], base.coordinates[key] + step);
    const lower =
      lowerValue < base.coordinates[key]
        ? evaluatePoint({ ...base.coordinates, [key]: lowerValue })
        : null;
    const upper =
      upperValue > base.coordinates[key]
        ? evaluatePoint({ ...base.coordinates, [key]: upperValue })
        : null;
    let derivative: readonly [number, number] | null = null;
    if (lower !== null && upper !== null) {
      const deltaNormalized = (upperValue - lowerValue) / scale[key];
      const lowerResidual = normalizedFullFiberResidualVector(lower, base);
      const upperResidual = normalizedFullFiberResidualVector(upper, base);
      derivative = [
        (upperResidual[0] - lowerResidual[0]) / deltaNormalized,
        (upperResidual[1] - lowerResidual[1]) / deltaNormalized,
      ];
    } else if (upper !== null) {
      const deltaNormalized = (upperValue - base.coordinates[key]) / scale[key];
      const upperResidual = normalizedFullFiberResidualVector(upper, base);
      derivative = [
        (upperResidual[0] - baseResidual[0]) / deltaNormalized,
        (upperResidual[1] - baseResidual[1]) / deltaNormalized,
      ];
    } else if (lower !== null) {
      const deltaNormalized = (base.coordinates[key] - lowerValue) / scale[key];
      const lowerResidual = normalizedFullFiberResidualVector(lower, base);
      derivative = [
        (baseResidual[0] - lowerResidual[0]) / deltaNormalized,
        (baseResidual[1] - lowerResidual[1]) / deltaNormalized,
      ];
    }
    if (derivative === null || !derivative.every(Number.isFinite)) return null;
    columns.push(derivative);
  }
  return [
    [columns[0][0], columns[1][0]],
    [columns[0][1], columns[1][1]],
  ];
}

function numericalResidualJacobian(
  base: SolverPoint,
  input: TriSegGeometryBaseInputV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
  scale: TriSegAlgebraicCoordinatesV1,
  relativeStep: number,
  evaluatePoint: (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ) => SolverPoint | null,
): readonly [readonly [number, number], readonly [number, number]] | null {
  const baseResidual = normalizedResidualVector(base, base.tensions);
  const columns: Array<readonly [number, number]> = [];
  const coordinateKeys = ["junctionRadiusCm", "septalCapVolumeMl"] as const;
  for (const key of coordinateKeys) {
    const step = relativeStep * scale[key];
    const lowerBound = bounds[key][0];
    const upperBound = bounds[key][1];
    const lowerValue = Math.max(lowerBound, base.coordinates[key] - step);
    const upperValue = Math.min(upperBound, base.coordinates[key] + step);
    const lower =
      lowerValue < base.coordinates[key]
        ? evaluatePoint({ ...base.coordinates, [key]: lowerValue })
        : null;
    const upper =
      upperValue > base.coordinates[key]
        ? evaluatePoint({ ...base.coordinates, [key]: upperValue })
        : null;
    const tensionScale = Math.max(
      1,
      TRISEG_WALL_IDS_V1.reduce(
        (sum, id) => sum + Math.abs(base.tensions[id]),
        0,
      ),
    );
    let derivative: readonly [number, number] | null = null;
    if (lower !== null && upper !== null) {
      const deltaNormalized = (upperValue - lowerValue) / scale[key];
      derivative = [
        (upper.virtualWork.residuals.axialLineTensionNPerM -
          lower.virtualWork.residuals.axialLineTensionNPerM) /
          tensionScale /
          deltaNormalized,
        (upper.virtualWork.residuals.radialLineTensionNPerM -
          lower.virtualWork.residuals.radialLineTensionNPerM) /
          tensionScale /
          deltaNormalized,
      ];
    } else if (upper !== null) {
      const deltaNormalized = (upperValue - base.coordinates[key]) / scale[key];
      derivative = [
        (upper.virtualWork.residuals.axialLineTensionNPerM / tensionScale -
          baseResidual[0]) /
          deltaNormalized,
        (upper.virtualWork.residuals.radialLineTensionNPerM / tensionScale -
          baseResidual[1]) /
          deltaNormalized,
      ];
    } else if (lower !== null) {
      const deltaNormalized = (base.coordinates[key] - lowerValue) / scale[key];
      derivative = [
        (baseResidual[0] -
          lower.virtualWork.residuals.axialLineTensionNPerM / tensionScale) /
          deltaNormalized,
        (baseResidual[1] -
          lower.virtualWork.residuals.radialLineTensionNPerM / tensionScale) /
          deltaNormalized,
      ];
    }
    if (derivative === null || !derivative.every(Number.isFinite)) {
      return null;
    }
    columns.push(derivative);
  }
  return [
    [columns[0][0], columns[1][0]],
    [columns[0][1], columns[1][1]],
  ];
}

function solveLevenbergMarquardtStep(
  jacobian: readonly [readonly [number, number], readonly [number, number]],
  residual: readonly [number, number],
  regularization: number,
): readonly [number, number] | null {
  const [[j00, j01], [j10, j11]] = jacobian;
  const a00 = j00 ** 2 + j10 ** 2 + regularization;
  const a01 = j00 * j01 + j10 * j11;
  const a11 = j01 ** 2 + j11 ** 2 + regularization;
  const b0 = -(j00 * residual[0] + j10 * residual[1]);
  const b1 = -(j01 * residual[0] + j11 * residual[1]);
  const determinant = a00 * a11 - a01 ** 2;
  const determinantScale = Math.max(1, Math.abs(a00 * a11), Math.abs(a01 ** 2));
  if (
    !Number.isFinite(determinant) ||
    Math.abs(determinant) <= 1e-15 * determinantScale
  ) {
    return null;
  }
  const step: readonly [number, number] = [
    (b0 * a11 - b1 * a01) / determinant,
    (a00 * b1 - a01 * b0) / determinant,
  ];
  return step.every(Number.isFinite) ? step : null;
}

function limitVectorNorm(
  vector: readonly [number, number],
  maximumNorm: number,
): readonly [number, number] {
  const norm = Math.hypot(vector[0], vector[1]);
  if (norm <= maximumNorm || norm === 0) {
    return vector;
  }
  const scale = maximumNorm / norm;
  return [vector[0] * scale, vector[1] * scale];
}

function bestPatternSearchTrial(
  current: SolverPoint,
  scale: TriSegAlgebraicCoordinatesV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
  evaluatePoint: (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ) => SolverPoint | null,
): SolverPoint | null {
  const directions: readonly (readonly [number, number])[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let best: SolverPoint | null = null;
  for (const stepMagnitude of [0.1, 0.03, 0.01, 0.003]) {
    for (const [dy, dv] of directions) {
      const coordinates = clampCoordinates(
        {
          junctionRadiusCm:
            current.coordinates.junctionRadiusCm +
            dy * stepMagnitude * scale.junctionRadiusCm,
          septalCapVolumeMl:
            current.coordinates.septalCapVolumeMl +
            dv * stepMagnitude * scale.septalCapVolumeMl,
        },
        bounds,
      );
      if (coordinatesEqual(coordinates, current.coordinates)) {
        continue;
      }
      const candidate = evaluatePoint(coordinates);
      if (
        candidate !== null &&
        candidate.relativeResidualMagnitude <
          current.relativeResidualMagnitude &&
        (best === null ||
          candidate.relativeResidualMagnitude < best.relativeResidualMagnitude)
      ) {
        best = candidate;
      }
    }
    if (best !== null) {
      return best;
    }
  }
  return null;
}

function bestFullFiberPatternSearchTrial(
  current: FullFiberSolverPoint,
  scale: TriSegAlgebraicCoordinatesV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
  evaluatePoint: (
    coordinates: TriSegAlgebraicCoordinatesV1,
  ) => FullFiberSolverPoint | null,
): FullFiberSolverPoint | null {
  const directions: readonly (readonly [number, number])[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let best: FullFiberSolverPoint | null = null;
  for (const stepMagnitude of [0.1, 0.03, 0.01, 0.003]) {
    for (const [dy, dv] of directions) {
      const coordinates = clampCoordinates(
        {
          junctionRadiusCm:
            current.coordinates.junctionRadiusCm +
            dy * stepMagnitude * scale.junctionRadiusCm,
          septalCapVolumeMl:
            current.coordinates.septalCapVolumeMl +
            dv * stepMagnitude * scale.septalCapVolumeMl,
        },
        bounds,
      );
      if (coordinatesEqual(coordinates, current.coordinates)) continue;
      const candidate = evaluatePoint(coordinates);
      if (
        candidate !== null &&
        fullFiberResidualNormWithScales(candidate, current) <
          fullFiberResidualNormWithScales(current, current) &&
        (best === null ||
          fullFiberResidualNormWithScales(candidate, current) <
            fullFiberResidualNormWithScales(best, current))
      ) {
        best = candidate;
      }
    }
    if (best !== null) return best;
  }
  return null;
}

function failedSolution(
  geometry: TriSegGeometryOutputV1,
  coordinates: TriSegAlgebraicCoordinatesV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
  initialCoordinatesWereClamped: boolean,
  termination: TriSegAlgebraicSolverTerminationV1,
  failureReason: string,
  functionEvaluations = 0,
): TriSegAlgebraicSolutionV1 {
  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    converged: false,
    coordinates,
    geometry,
    tensionsNPerM: null,
    virtualWork: null,
    diagnostics: {
      termination,
      failureReason,
      iterations: 0,
      functionEvaluations,
      initialCoordinatesWereClamped,
      relativeResidualMagnitude: Number.POSITIVE_INFINITY,
      bounds,
      trace: [],
    },
  };
}

function failedFullFiberEnergyGradientSolution(
  geometry: TriSegGeometryOutputV1,
  coordinates: TriSegAlgebraicCoordinatesV1,
  bounds: TriSegAlgebraicSolverBoundsV1,
  initialCoordinatesWereClamped: boolean,
  termination: TriSegAlgebraicSolverTerminationV1,
  failureReason: string,
  functionEvaluations = 0,
): TriSegFullFiberEnergyGradientSolutionV1 {
  return {
    modelId: TRISEG_GEOMETRY_MODEL_ID_V1,
    claimBoundary: TRISEG_GEOMETRY_CLAIM_BOUNDARY_V1,
    generalizedForceMapping: "full-fiber-energy-gradient",
    converged: false,
    coordinates,
    geometry,
    fiberStressesPa: null,
    fullFiberEnergyGradient: null,
    diagnostics: {
      termination,
      failureReason,
      iterations: 0,
      functionEvaluations,
      initialCoordinatesWereClamped,
      relativeResidualMagnitude: Number.POSITIVE_INFINITY,
      bounds,
      trace: [],
      normalization:
        "separate-sum-absolute-wall-contributions-with-base-scale-fixed-per-jacobian",
      jacobianEvaluations: 0,
    },
  };
}

function boundedPositive(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(Math.min(maximum, Math.max(minimum, value)));
}
