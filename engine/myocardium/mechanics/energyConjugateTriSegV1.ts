/**
 * Pure, energy-conjugate three-wall ventricular geometry.
 *
 * This module owns no circulation, valve, activation, or material state. Wall
 * material provides fiber Kirchhoff stress; this geometry maps that stress to
 * cavity pressure and the two internal TriSeg shape forces by virtual work.
 */

export const ENERGY_CONJUGATE_TRISEG_V1_ID =
  "energy-conjugate-three-wall-triseg-v1" as const;

export const TRISEG_WALL_IDS_V1 = Object.freeze([
  "LVFW",
  "SEP",
  "RVFW",
] as const);

export type TriSegWallIdV1 = (typeof TRISEG_WALL_IDS_V1)[number];
export type TriSegWallRecordV1<T> = Readonly<Record<TriSegWallIdV1, T>>;

export const ENERGY_CONJUGATE_TRISEG_CLAIM_V1 = Object.freeze({
  geometry: "lumens-common-junction-signed-spherical-caps" as const,
  strain:
    "finite-thickness-one-fiber-log-strain-with-analytic-coordinate-derivatives" as const,
  membraneVirtualWork:
    "wall-material-volume-times-fiber-kirchhoff-stress-times-log-strain-variation" as const,
  koiterBendingEnergyApplied: false as const,
  bendingMomentApplied: false as const,
  referenceCurvatureFitApplied: false as const,
  internalCoordinates: Object.freeze([
    "septal-midwall-cap-volume",
    "junction-radius",
  ] as const),
  circulationOwnedHere: false as const,
  valvesOwnedHere: false as const,
  wallConstitutiveLawOwnedHere: false as const,
  negativeWallStressClipped: false as const,
  numericalShapeSpringApplied: false as const,
  pvLoopMorphologyFitAllowed: false as const,
});

const SIX_OVER_PI = 6 / Math.PI;

export type TriSegWallGeometryParametersV1 = Readonly<{
  wallMaterialVolumeM3: number;
  referenceMidwallAreaM2: number;
}>;

export type TriSegCoordinatesV1 = Readonly<{
  septalMidwallCapVolumeM3: number;
  junctionRadiusM: number;
}>;

export type TriSegGeometryInputV1 = Readonly<{
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  coordinates: TriSegCoordinatesV1;
  walls: TriSegWallRecordV1<TriSegWallGeometryParametersV1>;
}>;

export type SignedSphericalCapInverseV1 = Readonly<{
  signedMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  signedCapHeightM: number;
  dCapHeightDCapVolumePerM2: number;
  dCapHeightDJunctionRadiusAtFixedVolume: number;
}>;

export type TriSegWallGeometryV1 = Readonly<{
  wallId: TriSegWallIdV1;
  signedMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  signedCapHeightM: number;
  midwallAreaM2: number;
  signedMidwallCurvaturePerM: number;
  thicknessCurvatureRatio: number;
  fiberLogStrain: number;
  geometryStretch: number;
  capInverse: SignedSphericalCapInverseV1;
  parameters: TriSegWallGeometryParametersV1;
}>;

export type TriSegGeometryV1 = Readonly<{
  conventionId: "lumens-2009-common-x-positive-toward-rv-v1";
  leftVentricularCavityVolumeM3: number;
  rightVentricularCavityVolumeM3: number;
  coordinates: TriSegCoordinatesV1;
  walls: TriSegWallRecordV1<TriSegWallGeometryV1>;
}>;

export type TriSegWallDerivativeV1 = Readonly<{
  wallId: TriSegWallIdV1;
  dCapHeightDCapVolumePerM2: number;
  dCapHeightDJunctionRadiusAtFixedVolume: number;
  dFiberLogStrainDCapVolumePerM3: number;
  dFiberLogStrainDJunctionRadiusPerM: number;
}>;

export type TriSegGeneralizedForceV1 = Readonly<{
  leftVentricularPressurePa: number;
  rightVentricularPressurePa: number;
  septalMidwallCapVolumePa: number;
  junctionRadiusN: number;
}>;

export type EnergyConjugateTriSegEvaluationV1 = Readonly<{
  mechanicsId: typeof ENERGY_CONJUGATE_TRISEG_V1_ID;
  geometry: TriSegGeometryV1;
  fiberKirchhoffStressPaByWall: TriSegWallRecordV1<number>;
  wallDerivativeByWall: TriSegWallRecordV1<TriSegWallDerivativeV1>;
  membraneGeneralizedForce: TriSegGeneralizedForceV1;
  cavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
  equilibriumResidual: Readonly<{
    axialNPerM: number;
    radialNPerM: number;
    euclideanNPerM: number;
  }>;
  frozenMaterialStateMembranePotentialJ: number;
  membranePotentialClaim:
    "linearized-frozen-stress-virtual-potential-not-the-wall-constitutive-energy";
  generalizedForceDefinition:
    "P_L=dPi/dV_L;P_R=dPi/dV_R;G_VS=dPi/dV_S;G_y=dPi/dy";
  claim: typeof ENERGY_CONJUGATE_TRISEG_CLAIM_V1;
}>;

/** V = pi h (h^2 + 3 y^2) / 6. */
export function evaluateSignedSphericalCapVolumeV1(
  signedCapHeightM: number,
  junctionRadiusM: number,
): number {
  requireFinite(signedCapHeightM, "signedCapHeightM");
  requirePositive(junctionRadiusM, "junctionRadiusM");
  const scaleM = Math.max(Math.abs(signedCapHeightM), junctionRadiusM);
  const normalizedHeight = signedCapHeightM / scaleM;
  const normalizedRadius = junctionRadiusM / scaleM;
  const volumeM3 = (Math.PI / 6)
    * signedCapHeightM * scaleM * scaleM
    * (normalizedHeight ** 2 + 3 * normalizedRadius ** 2);
  return requireFinite(volumeM3, "signed spherical-cap volume");
}

/**
 * Monotone inverse of the signed spherical-cap relation. Scaling and a
 * bracketed Newton step avoid Cardano cancellation around the flat-wall case.
 */
export function invertSignedSphericalCapVolumeV1(
  signedMidwallCapVolumeM3: number,
  junctionRadiusM: number,
): SignedSphericalCapInverseV1 {
  requireFinite(signedMidwallCapVolumeM3, "signedMidwallCapVolumeM3");
  requirePositive(junctionRadiusM, "junctionRadiusM");

  if (signedMidwallCapVolumeM3 === 0) {
    return Object.freeze({
      signedMidwallCapVolumeM3,
      junctionRadiusM,
      signedCapHeightM: 0,
      dCapHeightDCapVolumePerM2:
        2 / (Math.PI * junctionRadiusM * junctionRadiusM),
      dCapHeightDJunctionRadiusAtFixedVolume: 0,
    });
  }

  const sign = Math.sign(signedMidwallCapVolumeM3);
  const absoluteVolumeM3 = Math.abs(signedMidwallCapVolumeM3);
  const scaleM = Math.max(junctionRadiusM, Math.cbrt(absoluteVolumeM3));
  const normalizedRadius = junctionRadiusM / scaleM;
  const linearCoefficient = 3 * normalizedRadius * normalizedRadius;
  const normalizedVolume = SIX_OVER_PI
    * absoluteVolumeM3 / scaleM / scaleM / scaleM;
  let lower = 0;
  let upper = Math.cbrt(normalizedVolume);
  if (linearCoefficient > 0) {
    upper = Math.min(upper, normalizedVolume / linearCoefficient);
  }
  let normalizedHeight = upper;

  for (let iteration = 0; iteration < 48; iteration += 1) {
    const residual = normalizedHeight
      * (normalizedHeight * normalizedHeight + linearCoefficient)
      - normalizedVolume;
    const residualScale = normalizedVolume
      + Math.abs(normalizedHeight
        * (normalizedHeight * normalizedHeight + linearCoefficient));
    if (Math.abs(residual) <= 8 * Number.EPSILON * residualScale) break;
    if (residual > 0) upper = normalizedHeight;
    else lower = normalizedHeight;
    const derivative = 3 * normalizedHeight * normalizedHeight
      + linearCoefficient;
    const newton = normalizedHeight - residual / derivative;
    normalizedHeight = Number.isFinite(newton)
      && newton > lower
      && newton < upper
      ? newton
      : lower + 0.5 * (upper - lower);
  }

  const finalResidual = normalizedHeight
    * (normalizedHeight * normalizedHeight + linearCoefficient)
    - normalizedVolume;
  const reference = normalizedVolume
    + Math.abs(normalizedHeight
      * (normalizedHeight * normalizedHeight + linearCoefficient));
  if (Math.abs(finalResidual) > 64 * Number.EPSILON * reference) {
    throw new Error(`signed spherical-cap inverse failed: ${finalResidual}`);
  }

  const signedCapHeightM = sign * scaleM * normalizedHeight;
  const radiusSquaredM2 = signedCapHeightM * signedCapHeightM
    + junctionRadiusM * junctionRadiusM;
  return Object.freeze({
    signedMidwallCapVolumeM3,
    junctionRadiusM,
    signedCapHeightM,
    dCapHeightDCapVolumePerM2: 2 / (Math.PI * radiusSquaredM2),
    dCapHeightDJunctionRadiusAtFixedVolume:
      -2 * signedCapHeightM * junctionRadiusM / radiusSquaredM2,
  });
}

export function deriveTriSegMidwallCapVolumesV1(
  input: TriSegGeometryInputV1,
): TriSegWallRecordV1<number> {
  validateGeometryInput(input);
  const leftWallVolume = input.walls.LVFW.wallMaterialVolumeM3;
  const septalWallVolume = input.walls.SEP.wallMaterialVolumeM3;
  const rightWallVolume = input.walls.RVFW.wallMaterialVolumeM3;
  return Object.freeze({
    LVFW: -input.leftVentricularCavityVolumeM3
      - 0.5 * leftWallVolume
      - 0.5 * septalWallVolume
      + input.coordinates.septalMidwallCapVolumeM3,
    SEP: input.coordinates.septalMidwallCapVolumeM3,
    RVFW: input.rightVentricularCavityVolumeM3
      + 0.5 * rightWallVolume
      + 0.5 * septalWallVolume
      + input.coordinates.septalMidwallCapVolumeM3,
  });
}

export function evaluateTriSegWallGeometryV1(
  wallId: TriSegWallIdV1,
  signedMidwallCapVolumeM3: number,
  junctionRadiusM: number,
  parameters: TriSegWallGeometryParametersV1,
): TriSegWallGeometryV1 {
  if (!TRISEG_WALL_IDS_V1.includes(wallId)) {
    throw new Error(`unsupported TriSeg wall ${wallId}`);
  }
  validateWallParameters(parameters, `${wallId}.parameters`);
  const capInverse = invertSignedSphericalCapVolumeV1(
    signedMidwallCapVolumeM3,
    junctionRadiusM,
  );
  const h = capInverse.signedCapHeightM;
  const radiusSquaredM2 = h * h + junctionRadiusM * junctionRadiusM;
  const midwallAreaM2 = Math.PI * radiusSquaredM2;
  const signedMidwallCurvaturePerM = 2 * h / radiusSquaredM2;
  const thicknessCurvatureRatio = 1.5
    * signedMidwallCurvaturePerM
    * parameters.wallMaterialVolumeM3 / midwallAreaM2;
  const z2 = thicknessCurvatureRatio * thicknessCurvatureRatio;
  const fiberLogStrain = 0.5
    * Math.log(midwallAreaM2 / parameters.referenceMidwallAreaM2)
    - z2 / 12
    - 0.019 * z2 * z2;
  const geometryStretch = Math.exp(fiberLogStrain);
  for (const [label, value] of Object.entries({
    midwallAreaM2,
    signedMidwallCurvaturePerM,
    thicknessCurvatureRatio,
    fiberLogStrain,
    geometryStretch,
  })) requireFinite(value, `${wallId}.${label}`);
  requirePositive(midwallAreaM2, `${wallId}.midwallAreaM2`);
  requirePositive(geometryStretch, `${wallId}.geometryStretch`);
  return Object.freeze({
    wallId,
    signedMidwallCapVolumeM3,
    junctionRadiusM,
    signedCapHeightM: h,
    midwallAreaM2,
    signedMidwallCurvaturePerM,
    thicknessCurvatureRatio,
    fiberLogStrain,
    geometryStretch,
    capInverse,
    parameters: Object.freeze({ ...parameters }),
  });
}

export function evaluateTriSegGeometryV1(
  input: TriSegGeometryInputV1,
): TriSegGeometryV1 {
  const capVolumes = deriveTriSegMidwallCapVolumesV1(input);
  const walls = wallRecord((wallId) => evaluateTriSegWallGeometryV1(
    wallId,
    capVolumes[wallId],
    input.coordinates.junctionRadiusM,
    input.walls[wallId],
  ));
  return Object.freeze({
    conventionId: "lumens-2009-common-x-positive-toward-rv-v1" as const,
    leftVentricularCavityVolumeM3: input.leftVentricularCavityVolumeM3,
    rightVentricularCavityVolumeM3: input.rightVentricularCavityVolumeM3,
    coordinates: Object.freeze({ ...input.coordinates }),
    walls,
  });
}

export function evaluateTriSegWallDerivativeV1(
  geometry: TriSegWallGeometryV1,
): TriSegWallDerivativeV1 {
  const h = geometry.signedCapHeightM;
  const y = geometry.junctionRadiusM;
  const r2 = h * h + y * y;
  const area = geometry.midwallAreaM2;
  const dHeightDVolume = 2 / area;
  const dHeightDyAtFixedVolume = -2 * h * y / r2;
  const dAreaDHeight = 2 * Math.PI * h;
  const dAreaDyAtFixedHeight = 2 * Math.PI * y;
  const dAreaDVolume = dAreaDHeight * dHeightDVolume;
  const dAreaDyAtFixedVolume = dAreaDyAtFixedHeight
    + dAreaDHeight * dHeightDyAtFixedVolume;

  const curvatureCoefficient = 3
    * geometry.parameters.wallMaterialVolumeM3 / Math.PI;
  const dZetaDHeight = curvatureCoefficient * (y * y - 3 * h * h)
    / (r2 * r2 * r2);
  const dZetaDyAtFixedHeight = -4 * curvatureCoefficient * h * y
    / (r2 * r2 * r2);
  const dZetaDVolume = dZetaDHeight * dHeightDVolume;
  const dZetaDyAtFixedVolume = dZetaDyAtFixedHeight
    + dZetaDHeight * dHeightDyAtFixedVolume;
  const zeta = geometry.thicknessCurvatureRatio;
  const dStrainDZeta = -zeta / 6 - 0.076 * zeta ** 3;
  const dStrainDVolume = 0.5 * dAreaDVolume / area
    + dStrainDZeta * dZetaDVolume;
  const dStrainDyAtFixedVolume = 0.5 * dAreaDyAtFixedVolume / area
    + dStrainDZeta * dZetaDyAtFixedVolume;

  const result = {
    wallId: geometry.wallId,
    dCapHeightDCapVolumePerM2: dHeightDVolume,
    dCapHeightDJunctionRadiusAtFixedVolume: dHeightDyAtFixedVolume,
    dFiberLogStrainDCapVolumePerM3: dStrainDVolume,
    dFiberLogStrainDJunctionRadiusPerM: dStrainDyAtFixedVolume,
  } as const;
  for (const [label, value] of Object.entries(result)) {
    if (label !== "wallId") requireFinite(value as number, `${geometry.wallId}.${label}`);
  }
  return Object.freeze(result);
}

export function evaluateEnergyConjugateTriSegV1(input: Readonly<{
  geometry: TriSegGeometryV1;
  fiberKirchhoffStressPaByWall: TriSegWallRecordV1<number>;
}>): EnergyConjugateTriSegEvaluationV1 {
  assertWallRecord(input.fiberKirchhoffStressPaByWall, "fiberKirchhoffStressPaByWall");
  const derivativeByWall = wallRecord((wallId) =>
    evaluateTriSegWallDerivativeV1(input.geometry.walls[wallId]));
  const membraneCapForcePa = wallRecord((wallId) => {
    const stressPa = requireFinite(
      input.fiberKirchhoffStressPaByWall[wallId],
      `${wallId}.fiberKirchhoffStressPa`,
    );
    return input.geometry.walls[wallId].parameters.wallMaterialVolumeM3
      * stressPa
      * derivativeByWall[wallId].dFiberLogStrainDCapVolumePerM3;
  });
  const membraneRadiusForceN = wallRecord((wallId) =>
    input.geometry.walls[wallId].parameters.wallMaterialVolumeM3
      * input.fiberKirchhoffStressPaByWall[wallId]
      * derivativeByWall[wallId].dFiberLogStrainDJunctionRadiusPerM);
  const membrane = generalizedForceFromWallForces(
    membraneCapForcePa,
    membraneRadiusForceN,
  );
  const y = input.geometry.coordinates.junctionRadiusM;
  const axialNPerM = 0.5 * y * membrane.septalMidwallCapVolumePa;
  const radialNPerM = membrane.junctionRadiusN / (2 * Math.PI * y);
  const frozenMaterialStateMembranePotentialJ = sumWalls((wallId) => {
    const wall = input.geometry.walls[wallId];
    return wall.parameters.wallMaterialVolumeM3
      * input.fiberKirchhoffStressPaByWall[wallId]
      * wall.fiberLogStrain;
  });

  return Object.freeze({
    mechanicsId: ENERGY_CONJUGATE_TRISEG_V1_ID,
    geometry: input.geometry,
    fiberKirchhoffStressPaByWall: Object.freeze({
      ...input.fiberKirchhoffStressPaByWall,
    }),
    wallDerivativeByWall: derivativeByWall,
    membraneGeneralizedForce: membrane,
    cavityTransmuralPressuresPa: Object.freeze({
      LV: membrane.leftVentricularPressurePa,
      RV: membrane.rightVentricularPressurePa,
    }),
    equilibriumResidual: Object.freeze({
      axialNPerM,
      radialNPerM,
      euclideanNPerM: Math.hypot(axialNPerM, radialNPerM),
    }),
    frozenMaterialStateMembranePotentialJ,
    membranePotentialClaim:
      "linearized-frozen-stress-virtual-potential-not-the-wall-constitutive-energy" as const,
    generalizedForceDefinition:
      "P_L=dPi/dV_L;P_R=dPi/dV_R;G_VS=dPi/dV_S;G_y=dPi/dy" as const,
    claim: ENERGY_CONJUGATE_TRISEG_CLAIM_V1,
  });
}

function validateGeometryInput(input: TriSegGeometryInputV1): void {
  requireNonnegative(input.leftVentricularCavityVolumeM3, "LV cavity volume");
  requireNonnegative(input.rightVentricularCavityVolumeM3, "RV cavity volume");
  requireFinite(
    input.coordinates.septalMidwallCapVolumeM3,
    "septal midwall cap volume",
  );
  requirePositive(input.coordinates.junctionRadiusM, "junction radius");
  assertWallRecord(input.walls, "walls");
  for (const wallId of TRISEG_WALL_IDS_V1) {
    validateWallParameters(input.walls[wallId], `${wallId}.parameters`);
  }
}

function validateWallParameters(
  parameters: TriSegWallGeometryParametersV1,
  label: string,
): void {
  requirePositive(parameters.wallMaterialVolumeM3, `${label}.wallMaterialVolumeM3`);
  requirePositive(parameters.referenceMidwallAreaM2, `${label}.referenceMidwallAreaM2`);
}

function generalizedForceFromWallForces(
  capForcePa: TriSegWallRecordV1<number>,
  radiusForceN: TriSegWallRecordV1<number>,
): TriSegGeneralizedForceV1 {
  return Object.freeze({
    leftVentricularPressurePa: canonicalZero(-capForcePa.LVFW),
    rightVentricularPressurePa: canonicalZero(capForcePa.RVFW),
    septalMidwallCapVolumePa: canonicalZero(
      sumWalls((wallId) => capForcePa[wallId]),
    ),
    junctionRadiusN: canonicalZero(
      sumWalls((wallId) => radiusForceN[wallId]),
    ),
  });
}

function wallRecord<T>(
  build: (wallId: TriSegWallIdV1) => T,
): TriSegWallRecordV1<T> {
  return Object.freeze(Object.fromEntries(
    TRISEG_WALL_IDS_V1.map((wallId) => [wallId, build(wallId)]),
  )) as TriSegWallRecordV1<T>;
}

function sumWalls(build: (wallId: TriSegWallIdV1) => number): number {
  return TRISEG_WALL_IDS_V1.reduce((sum, wallId) => sum + build(wallId), 0);
}

function assertWallRecord<T>(
  value: TriSegWallRecordV1<T>,
  label: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a wall record`);
  }
  const keys = Object.keys(value).sort();
  const expected = [...TRISEG_WALL_IDS_V1].sort();
  if (keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly LVFW, SEP, and RVFW`);
  }
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be positive and finite`);
  }
  return value;
}

function requireNonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be nonnegative and finite`);
  }
  return value;
}

function canonicalZero(value: number): number {
  return value === 0 ? 0 : value;
}
