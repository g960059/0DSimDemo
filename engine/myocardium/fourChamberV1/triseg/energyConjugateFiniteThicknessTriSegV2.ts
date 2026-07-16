import {
  PUBLISHED_TRISEG_WALL_ORDER_V1,
  assertPublishedTriSegGeometryV1Provenance,
  assertPublishedTriSegWallGeometryV1Provenance,
  type PublishedTriSegGeometryV1,
  type PublishedTriSegWallGeometryV1,
  type PublishedTriSegWallIdV1,
} from "@/engine/myocardium/fourChamberV1/triseg/publishedTriSegGeometryV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_V2_ID =
  "energy-conjugate-finite-thickness-triseg-v2" as const;

export const ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_V2_POLICY = Object.freeze({
  membraneRule:
    "frozen-internal-state-wall-stress-times-analytic-log-strain-gradient" as const,
  bendingRule:
    "koiter-curvature-energy-about-declared-moment-free-reference-curvature" as const,
  pressureRule: "partial-potential-by-cavity-volume" as const,
  shapeRule: "partial-potential-by-septal-cap-volume-and-junction-radius" as const,
  publishedTaylorRuntimeOwner: false as const,
  negativeMembraneStressClipped: false as const,
  numericalShapeSpringApplied: false as const,
  pvLoopMorphologyFitAllowed: false as const,
} as const);

export const FINITE_THICKNESS_TRISEG_BENDING_EVIDENCE_SOURCES_V2 = Object.freeze({
  humanPassiveInverseRange: Object.freeze({
    sourceId: "palit-2018-human-myocardium-passive-inverse-range-v2",
    title: "In vivo estimation of passive biomechanical properties of human myocardium",
    doi: "10.1007/s11517-017-1768-x",
    url: "https://doi.org/10.1007/s11517-017-1768-x",
    sourceLocation: "Tables 2-4 and inverse-estimation identifiability discussion",
    claimBoundary:
      "Bounds passive human myocardial material scales but does not directly measure or uniquely identify a reduced-shell bending modulus.",
  }),
} as const);

type WallRecord<T> = Readonly<Record<PublishedTriSegWallIdV1, T>>;

export type FiniteThicknessTriSegBendingPriorV2 = Readonly<{
  priorId: string;
  status: "candidate-prior";
  evidenceClass: "literature-bounded-reduced-shell-construction-prior";
  effectiveBendingYoungModulusPa: number;
  poissonRatio: number;
  referenceCurvaturePerMByWall: WallRecord<number>;
  wallBendingMultiplierByWall: WallRecord<number>;
  modulusRangeEvidenceSourceId:
    "palit-2018-human-myocardium-passive-inverse-range-v2";
  effectiveBendingModulusSensitivityRangePa: readonly [300, 30_000];
  normalCenterSelectionRule:
    "log-midpoint-of-broad-literature-bounded-0p3-to-30-kpa-sensitivity-range";
  referenceCurvatureMeaning:
    "cmr-loaded-end-diastolic-moment-free-construction-reference-not-stress-free-shape";
  modulusIdentificationBoundary:
    "not-identified-from-edpvr-or-pv-loop-morphology";
  diseaseAxisRule:
    "wall-specific-multipliers-fixed-to-one-for-normal-candidate";
}>;

export type FiniteThicknessTriSegWallDerivativeV2 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  dCapHeightDCapVolumeMPerM3: number;
  dCapHeightDJunctionRadiusAtFixedCapVolume: number;
  dFiberLogStrainDCapVolumePerM3: number;
  dFiberLogStrainDJunctionRadiusPerM: number;
  dCurvatureDCapVolumePerM4: number;
  dCurvatureDJunctionRadiusPerM2: number;
}>;

export type FiniteThicknessTriSegWallBendingEvaluationV2 = Readonly<{
  wallId: PublishedTriSegWallIdV1;
  referenceThicknessM: number;
  plateFlexuralRigidityNm: number;
  reducedSphericalBendingRigidityNm: number;
  referenceCurvaturePerM: number;
  curvatureDifferencePerM: number;
  storedEnergyJ: number;
  generalizedForceByCapVolumePa: number;
  generalizedForceByJunctionRadiusN: number;
}>;

export type EnergyConjugateFiniteThicknessTriSegV2 = Readonly<{
  mechanicsId: typeof ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_V2_ID;
  geometry: PublishedTriSegGeometryV1;
  fiberKirchhoffStressPaByWall: WallRecord<number>;
  wallDerivativeByWall: WallRecord<FiniteThicknessTriSegWallDerivativeV2>;
  bendingByWall: WallRecord<FiniteThicknessTriSegWallBendingEvaluationV2>;
  membraneGeneralizedForce: Readonly<{
    leftVentricularPressurePa: number;
    rightVentricularPressurePa: number;
    septalMidwallCapVolumePa: number;
    junctionRadiusN: number;
  }>;
  bendingGeneralizedForce: Readonly<{
    leftVentricularPressurePa: number;
    rightVentricularPressurePa: number;
    septalMidwallCapVolumePa: number;
    junctionRadiusN: number;
  }>;
  totalGeneralizedForce: Readonly<{
    leftVentricularPressurePa: number;
    rightVentricularPressurePa: number;
    septalMidwallCapVolumePa: number;
    junctionRadiusN: number;
  }>;
  cavityTransmuralPressuresPa: Readonly<{ LV: number; RV: number }>;
  equilibriumResidual: Readonly<{
    axialNPerM: number;
    radialNPerM: number;
    euclideanNPerM: number;
  }>;
  bendingStoredEnergyJ: number;
  generalizedForceDefinition:
    "P_L=dPi/dV_L;P_R=dPi/dV_R;G_VS=dPi/dV_S;G_y=dPi/dy";
  publishedTaylorUsedForRuntimePressure: false;
  publishedTaylorUsedForRuntimeEquilibrium: false;
  negativeMembraneStressClipped: false;
  numericalShapeSpringApplied: false;
}>;

export function createFiniteThicknessTriSegBendingPriorV2(input: Readonly<{
  priorId: string;
  effectiveBendingYoungModulusPa: number;
  poissonRatio: number;
  referenceGeometry: PublishedTriSegGeometryV1;
  wallBendingMultiplierByWall: WallRecord<number>;
}>): FiniteThicknessTriSegBendingPriorV2 {
  assertExactPlainRecordV1(input, [
    "priorId",
    "effectiveBendingYoungModulusPa",
    "poissonRatio",
    "referenceGeometry",
    "wallBendingMultiplierByWall",
  ], "finite-thickness TriSeg bending prior input");
  assertPublishedTriSegGeometryV1Provenance(input.referenceGeometry);
  requireNonEmpty(input.priorId, "priorId");
  requirePositiveFinite(
    input.effectiveBendingYoungModulusPa,
    "effectiveBendingYoungModulusPa",
  );
  if (
    !Number.isFinite(input.poissonRatio)
    || input.poissonRatio < 0
    || input.poissonRatio >= 0.5
  ) {
    throw new Error("poissonRatio must be finite and lie in [0, 0.5)");
  }
  assertWallRecord(input.wallBendingMultiplierByWall, "wallBendingMultiplierByWall");
  for (const wallId of PUBLISHED_TRISEG_WALL_ORDER_V1) {
    if (input.wallBendingMultiplierByWall[wallId] !== 1) {
      throw new Error(
        "normal finite-thickness TriSeg candidate fixes every wall bending multiplier to one",
      );
    }
  }
  return Object.freeze({
    priorId: input.priorId,
    status: "candidate-prior" as const,
    evidenceClass: "literature-bounded-reduced-shell-construction-prior" as const,
    effectiveBendingYoungModulusPa: input.effectiveBendingYoungModulusPa,
    poissonRatio: input.poissonRatio,
    referenceCurvaturePerMByWall: wallRecord((wallId) =>
      input.referenceGeometry.walls[wallId].signedMidwallCurvaturePerM),
    wallBendingMultiplierByWall: Object.freeze({
      ...input.wallBendingMultiplierByWall,
    }),
    modulusRangeEvidenceSourceId:
      "palit-2018-human-myocardium-passive-inverse-range-v2" as const,
    effectiveBendingModulusSensitivityRangePa:
      Object.freeze([300, 30_000] as const),
    normalCenterSelectionRule:
      "log-midpoint-of-broad-literature-bounded-0p3-to-30-kpa-sensitivity-range" as const,
    referenceCurvatureMeaning:
      "cmr-loaded-end-diastolic-moment-free-construction-reference-not-stress-free-shape" as const,
    modulusIdentificationBoundary:
      "not-identified-from-edpvr-or-pv-loop-morphology" as const,
    diseaseAxisRule:
      "wall-specific-multipliers-fixed-to-one-for-normal-candidate" as const,
  });
}

export function evaluateFiniteThicknessTriSegWallDerivativeV2(
  geometry: PublishedTriSegWallGeometryV1,
): FiniteThicknessTriSegWallDerivativeV2 {
  assertPublishedTriSegWallGeometryV1Provenance(geometry);
  const h = geometry.signedCapHeightM;
  const y = geometry.junctionRadiusM;
  const rSquared = h * h + y * y;
  const area = geometry.midwallAreaM2;
  const dHeightDVolume = 2 / area;
  const dHeightDyAtFixedVolume = -2 * h * y / rSquared;
  const dAreaDHeight = 2 * Math.PI * h;
  const dAreaDyAtFixedHeight = 2 * Math.PI * y;
  const dAreaDVolume = dAreaDHeight * dHeightDVolume;
  const dAreaDyAtFixedVolume = dAreaDyAtFixedHeight
    + dAreaDHeight * dHeightDyAtFixedVolume;

  const wallVolume = geometry.parameters.wallMaterialVolumeM3;
  const curvatureCoefficient = 3 * wallVolume / Math.PI;
  const dZetaDHeight = curvatureCoefficient
    * (y * y - 3 * h * h)
    / (rSquared * rSquared * rSquared);
  const dZetaDyAtFixedHeight = -4 * curvatureCoefficient * h * y
    / (rSquared * rSquared * rSquared);
  const dZetaDVolume = dZetaDHeight * dHeightDVolume;
  const dZetaDyAtFixedVolume = dZetaDyAtFixedHeight
    + dZetaDHeight * dHeightDyAtFixedVolume;
  const zeta = geometry.thicknessCurvatureRatioZ;
  const dStrainDZeta = -zeta / 6 - 0.076 * zeta * zeta * zeta;
  const dStrainDVolume = 0.5 * dAreaDVolume / area
    + dStrainDZeta * dZetaDVolume;
  const dStrainDyAtFixedVolume = 0.5 * dAreaDyAtFixedVolume / area
    + dStrainDZeta * dZetaDyAtFixedVolume;

  const dCurvatureDHeight = 2 * (y * y - h * h)
    / (rSquared * rSquared);
  const dCurvatureDyAtFixedHeight = -4 * h * y
    / (rSquared * rSquared);
  const dCurvatureDVolume = dCurvatureDHeight * dHeightDVolume;
  const dCurvatureDyAtFixedVolume = dCurvatureDyAtFixedHeight
    + dCurvatureDHeight * dHeightDyAtFixedVolume;

  const values = {
    dCapHeightDCapVolumeMPerM3: dHeightDVolume,
    dCapHeightDJunctionRadiusAtFixedCapVolume: dHeightDyAtFixedVolume,
    dFiberLogStrainDCapVolumePerM3: dStrainDVolume,
    dFiberLogStrainDJunctionRadiusPerM: dStrainDyAtFixedVolume,
    dCurvatureDCapVolumePerM4: dCurvatureDVolume,
    dCurvatureDJunctionRadiusPerM2: dCurvatureDyAtFixedVolume,
  };
  for (const [field, value] of Object.entries(values)) {
    requireFinite(value, `${geometry.wallId}.${field}`);
  }
  return Object.freeze({ wallId: geometry.wallId, ...values });
}

export function evaluateEnergyConjugateFiniteThicknessTriSegV2(input: Readonly<{
  geometry: PublishedTriSegGeometryV1;
  fiberKirchhoffStressPaByWall: WallRecord<number>;
  bendingPrior: FiniteThicknessTriSegBendingPriorV2;
}>): EnergyConjugateFiniteThicknessTriSegV2 {
  assertExactPlainRecordV1(input, [
    "geometry",
    "fiberKirchhoffStressPaByWall",
    "bendingPrior",
  ], "energy-conjugate finite-thickness TriSeg input");
  assertPublishedTriSegGeometryV1Provenance(input.geometry);
  assertWallRecord(input.fiberKirchhoffStressPaByWall, "fiberKirchhoffStressPaByWall");
  validateBendingPrior(input.bendingPrior);
  const derivativeByWall = wallRecord((wallId) =>
    evaluateFiniteThicknessTriSegWallDerivativeV2(input.geometry.walls[wallId]));
  const membraneCapForcePa = wallRecord((wallId) => {
    const wall = input.geometry.walls[wallId];
    const stress = requireFinite(
      input.fiberKirchhoffStressPaByWall[wallId],
      `${wallId}.fiberKirchhoffStressPa`,
    );
    return wall.parameters.wallMaterialVolumeM3
      * stress
      * derivativeByWall[wallId].dFiberLogStrainDCapVolumePerM3;
  });
  const membraneYForceN = wallRecord((wallId) => {
    const wall = input.geometry.walls[wallId];
    return wall.parameters.wallMaterialVolumeM3
      * input.fiberKirchhoffStressPaByWall[wallId]
      * derivativeByWall[wallId].dFiberLogStrainDJunctionRadiusPerM;
  });
  const membrane = Object.freeze({
    leftVentricularPressurePa: -membraneCapForcePa.LVFW,
    rightVentricularPressurePa: membraneCapForcePa.RVFW,
    septalMidwallCapVolumePa: sumWallValues(membraneCapForcePa),
    junctionRadiusN: sumWallValues(membraneYForceN),
  });

  const bendingByWall = wallRecord((wallId) => {
    const wall = input.geometry.walls[wallId];
    const referenceThicknessM = wall.parameters.wallMaterialVolumeM3
      / wall.parameters.referenceMidwallAreaM2;
    const poisson = input.bendingPrior.poissonRatio;
    const plateFlexuralRigidityNm = input.bendingPrior.effectiveBendingYoungModulusPa
      * referenceThicknessM ** 3
      / (12 * (1 - poisson * poisson));
    // The geometry exposes the curvature trace C = kappa_1 + kappa_2 = 2/R,
    // not either individual spherical principal curvature.  For equal
    // principal-curvature increments, isotropic Koiter energy is
    // W_b/A = D(1+nu)(delta C)^2/4.  In the 0.5*B*(delta C)^2 form below,
    // B = D(1+nu)/2.
    const reducedSphericalBendingRigidityNm = (1 + poisson) / 2
      * plateFlexuralRigidityNm
      * input.bendingPrior.wallBendingMultiplierByWall[wallId];
    const referenceCurvaturePerM =
      input.bendingPrior.referenceCurvaturePerMByWall[wallId];
    const curvatureDifferencePerM = wall.signedMidwallCurvaturePerM
      - referenceCurvaturePerM;
    const coefficientJm2 = reducedSphericalBendingRigidityNm
      * wall.parameters.referenceMidwallAreaM2;
    const storedEnergyJ = 0.5 * coefficientJm2
      * curvatureDifferencePerM * curvatureDifferencePerM;
    const generalizedForceByCapVolumePa = coefficientJm2
      * curvatureDifferencePerM
      * derivativeByWall[wallId].dCurvatureDCapVolumePerM4;
    const generalizedForceByJunctionRadiusN = coefficientJm2
      * curvatureDifferencePerM
      * derivativeByWall[wallId].dCurvatureDJunctionRadiusPerM2;
    for (const [field, value] of Object.entries({
      referenceThicknessM,
      plateFlexuralRigidityNm,
      reducedSphericalBendingRigidityNm,
      referenceCurvaturePerM,
      curvatureDifferencePerM,
      storedEnergyJ,
      generalizedForceByCapVolumePa,
      generalizedForceByJunctionRadiusN,
    })) {
      requireFinite(value, `${wallId}.bending.${field}`);
    }
    requirePositiveFinite(referenceThicknessM, `${wallId}.referenceThicknessM`);
    requirePositiveFinite(plateFlexuralRigidityNm, `${wallId}.plateFlexuralRigidityNm`);
    requirePositiveFinite(
      reducedSphericalBendingRigidityNm,
      `${wallId}.reducedSphericalBendingRigidityNm`,
    );
    return Object.freeze({
      wallId,
      referenceThicknessM,
      plateFlexuralRigidityNm,
      reducedSphericalBendingRigidityNm,
      referenceCurvaturePerM,
      curvatureDifferencePerM,
      storedEnergyJ,
      generalizedForceByCapVolumePa,
      generalizedForceByJunctionRadiusN,
    });
  });
  const bendingCapForcePa = wallRecord((wallId) =>
    bendingByWall[wallId].generalizedForceByCapVolumePa);
  const bendingYForceN = wallRecord((wallId) =>
    bendingByWall[wallId].generalizedForceByJunctionRadiusN);
  const bending = Object.freeze({
    leftVentricularPressurePa: -bendingCapForcePa.LVFW,
    rightVentricularPressurePa: bendingCapForcePa.RVFW,
    septalMidwallCapVolumePa: sumWallValues(bendingCapForcePa),
    junctionRadiusN: sumWallValues(bendingYForceN),
  });
  const total = Object.freeze({
    leftVentricularPressurePa:
      membrane.leftVentricularPressurePa + bending.leftVentricularPressurePa,
    rightVentricularPressurePa:
      membrane.rightVentricularPressurePa + bending.rightVentricularPressurePa,
    septalMidwallCapVolumePa:
      membrane.septalMidwallCapVolumePa + bending.septalMidwallCapVolumePa,
    junctionRadiusN: membrane.junctionRadiusN + bending.junctionRadiusN,
  });
  const y = input.geometry.junctionRadiusM;
  const axialNPerM = 0.5 * y * total.septalMidwallCapVolumePa;
  const radialNPerM = total.junctionRadiusN / (2 * Math.PI * y);
  const euclideanNPerM = Math.hypot(axialNPerM, radialNPerM);
  const bendingStoredEnergyJ = sumWallValues(wallRecord((wallId) =>
    bendingByWall[wallId].storedEnergyJ));
  for (const [field, value] of Object.entries({
    ...total,
    axialNPerM,
    radialNPerM,
    euclideanNPerM,
    bendingStoredEnergyJ,
  })) {
    requireFinite(value, `finiteThicknessTriSeg.${field}`);
  }
  return Object.freeze({
    mechanicsId: ENERGY_CONJUGATE_FINITE_THICKNESS_TRISEG_V2_ID,
    geometry: input.geometry,
    fiberKirchhoffStressPaByWall: Object.freeze({
      ...input.fiberKirchhoffStressPaByWall,
    }),
    wallDerivativeByWall: derivativeByWall,
    bendingByWall,
    membraneGeneralizedForce: membrane,
    bendingGeneralizedForce: bending,
    totalGeneralizedForce: total,
    cavityTransmuralPressuresPa: Object.freeze({
      LV: total.leftVentricularPressurePa,
      RV: total.rightVentricularPressurePa,
    }),
    equilibriumResidual: Object.freeze({
      axialNPerM,
      radialNPerM,
      euclideanNPerM,
    }),
    bendingStoredEnergyJ,
    generalizedForceDefinition:
      "P_L=dPi/dV_L;P_R=dPi/dV_R;G_VS=dPi/dV_S;G_y=dPi/dy" as const,
    publishedTaylorUsedForRuntimePressure: false as const,
    publishedTaylorUsedForRuntimeEquilibrium: false as const,
    negativeMembraneStressClipped: false as const,
    numericalShapeSpringApplied: false as const,
  });
}

function validateBendingPrior(prior: FiniteThicknessTriSegBendingPriorV2): void {
  assertExactPlainRecordV1(prior, [
    "priorId",
    "status",
    "evidenceClass",
    "effectiveBendingYoungModulusPa",
    "poissonRatio",
    "referenceCurvaturePerMByWall",
    "wallBendingMultiplierByWall",
    "modulusRangeEvidenceSourceId",
    "effectiveBendingModulusSensitivityRangePa",
    "normalCenterSelectionRule",
    "referenceCurvatureMeaning",
    "modulusIdentificationBoundary",
    "diseaseAxisRule",
  ], "finite-thickness TriSeg bending prior");
  requireNonEmpty(prior.priorId, "bendingPrior.priorId");
  requirePositiveFinite(
    prior.effectiveBendingYoungModulusPa,
    "bendingPrior.effectiveBendingYoungModulusPa",
  );
  if (
    prior.status !== "candidate-prior"
    || prior.evidenceClass
      !== "literature-bounded-reduced-shell-construction-prior"
    || prior.referenceCurvatureMeaning
      !== "cmr-loaded-end-diastolic-moment-free-construction-reference-not-stress-free-shape"
    || prior.modulusIdentificationBoundary
      !== "not-identified-from-edpvr-or-pv-loop-morphology"
    || prior.diseaseAxisRule
      !== "wall-specific-multipliers-fixed-to-one-for-normal-candidate"
    || prior.modulusRangeEvidenceSourceId
      !== "palit-2018-human-myocardium-passive-inverse-range-v2"
    || prior.normalCenterSelectionRule
      !== "log-midpoint-of-broad-literature-bounded-0p3-to-30-kpa-sensitivity-range"
  ) {
    throw new Error("finite-thickness TriSeg bending prior provenance is invalid");
  }
  if (!Number.isFinite(prior.poissonRatio) || prior.poissonRatio < 0
    || prior.poissonRatio >= 0.5) {
    throw new Error("bendingPrior.poissonRatio must lie in [0, 0.5)");
  }
  assertWallRecord(prior.referenceCurvaturePerMByWall, "referenceCurvaturePerMByWall");
  assertWallRecord(prior.wallBendingMultiplierByWall, "wallBendingMultiplierByWall");
  if (
    prior.effectiveBendingModulusSensitivityRangePa.length !== 2
    || prior.effectiveBendingModulusSensitivityRangePa[0] !== 300
    || prior.effectiveBendingModulusSensitivityRangePa[1] !== 30_000
    || prior.effectiveBendingYoungModulusPa < 300
    || prior.effectiveBendingYoungModulusPa > 30_000
  ) {
    throw new Error("finite-thickness TriSeg bending modulus left its declared sensitivity range");
  }
  for (const wallId of PUBLISHED_TRISEG_WALL_ORDER_V1) {
    requireFinite(
      prior.referenceCurvaturePerMByWall[wallId],
      `${wallId}.referenceCurvaturePerM`,
    );
    if (prior.wallBendingMultiplierByWall[wallId] !== 1) {
      throw new Error("normal candidate wall bending multipliers must remain one");
    }
  }
}

function assertWallRecord<T>(value: WallRecord<T>, field: string): void {
  assertExactPlainRecordV1(value, PUBLISHED_TRISEG_WALL_ORDER_V1, field);
}

function wallRecord<T>(
  build: (wallId: PublishedTriSegWallIdV1) => T,
): WallRecord<T> {
  return Object.freeze(Object.fromEntries(
    PUBLISHED_TRISEG_WALL_ORDER_V1.map((wallId) => [wallId, build(wallId)]),
  )) as WallRecord<T>;
}

function sumWallValues(values: WallRecord<number>): number {
  return PUBLISHED_TRISEG_WALL_ORDER_V1.reduce(
    (sum, wallId) => sum + values[wallId],
    0,
  );
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${field} must be finite and positive`);
  }
  return value;
}

function requireNonEmpty(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}
