const ML_TO_M3 = 1e-6;

export type OneFiberVolumeGeometryParamsV1 = {
  readonly wallVolumeMl: number;
  readonly referenceCavityVolumeMl: number;
  /** Neutral surface location within the wall: 0=endocardium, 1=epicardium. */
  readonly midwallFraction01: number;
};

export type OneFiberVolumeGeometryV1 = {
  readonly cavityVolumeMl: number;
  readonly wallVolumeMl: number;
  readonly midwallVolumeMl: number;
  readonly referenceMidwallVolumeMl: number;
  readonly midwallAreaCm2: number;
  readonly referenceMidwallAreaCm2: number;
  readonly fiberNaturalStrain: number;
  readonly dFiberStrainDVolumePerMl: number;
};

/**
 * Incompressible spherical one-fiber geometry.  Fiber stretch is the square
 * root of midwall area stretch, hence lambda_f=(V_m/V_m,ref)^(1/3).
 */
export function evaluateOneFiberVolumeGeometryV1(
  cavityVolumeMl: number,
  params: OneFiberVolumeGeometryParamsV1,
): OneFiberVolumeGeometryV1 {
  assertParams(params);
  requirePositive(cavityVolumeMl, "cavityVolumeMl");
  const midwallVolumeMl = cavityVolumeMl
    + params.midwallFraction01 * params.wallVolumeMl;
  const referenceMidwallVolumeMl = params.referenceCavityVolumeMl
    + params.midwallFraction01 * params.wallVolumeMl;
  const midwallAreaCm2 = sphereAreaCm2FromVolumeMl(midwallVolumeMl);
  const referenceMidwallAreaCm2 = sphereAreaCm2FromVolumeMl(referenceMidwallVolumeMl);
  return {
    cavityVolumeMl,
    wallVolumeMl: params.wallVolumeMl,
    midwallVolumeMl,
    referenceMidwallVolumeMl,
    midwallAreaCm2,
    referenceMidwallAreaCm2,
    fiberNaturalStrain: Math.log(midwallVolumeMl / referenceMidwallVolumeMl) / 3,
    dFiberStrainDVolumePerMl: 1 / (3 * midwallVolumeMl),
  };
}

/** Pressure follows directly from delta W = V_wall sigma_f delta epsilon_f. */
export function oneFiberCavityPressurePaV1(
  geometry: OneFiberVolumeGeometryV1,
  totalFiberStressPa: number,
): number {
  requireFinite(totalFiberStressPa, "totalFiberStressPa");
  return geometry.wallVolumeMl
    * totalFiberStressPa
    * geometry.dFiberStrainDVolumePerMl;
}

/** dW/dA for epsilon_f=0.5 ln(A/A_ref). */
export function oneFiberMidwallTensionNPerMV1(
  geometry: OneFiberVolumeGeometryV1,
  totalFiberStressPa: number,
): number {
  requireFinite(totalFiberStressPa, "totalFiberStressPa");
  const wallVolumeM3 = geometry.wallVolumeMl * ML_TO_M3;
  const midwallAreaM2 = geometry.midwallAreaCm2 * 1e-4;
  return wallVolumeM3 * totalFiberStressPa / (2 * midwallAreaM2);
}

export function sphereAreaCm2FromVolumeMl(volumeMl: number): number {
  requirePositive(volumeMl, "volumeMl");
  // 1 mL == 1 cm^3, so the result is directly in cm^2.
  return Math.cbrt(36 * Math.PI * volumeMl * volumeMl);
}

function assertParams(params: OneFiberVolumeGeometryParamsV1): void {
  requirePositive(params.wallVolumeMl, "wallVolumeMl");
  requirePositive(params.referenceCavityVolumeMl, "referenceCavityVolumeMl");
  if (
    !Number.isFinite(params.midwallFraction01)
    || params.midwallFraction01 < 0
    || params.midwallFraction01 > 1
  ) {
    throw new Error("midwallFraction01 must be in [0, 1]");
  }
}

function requireFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
}

function requirePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
}
