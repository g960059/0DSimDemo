const SIX_OVER_PI = 6 / Math.PI;

export type SignedSphericalCapInverseV1 = Readonly<{
  signedMidwallCapVolumeM3: number;
  junctionRadiusM: number;
  signedCapHeightM: number;
  capHeightDerivativeByVolumePerM2: number;
  capHeightDerivativeByJunctionRadiusAtFixedVolume: number;
}>;

/**
 * Signed spherical-cap volume used by the common-axis TriSeg convention.
 *
 * V_m = pi x_m (x_m^2 + 3 y_m^2) / 6.
 */
export function evaluateSignedSphericalCapVolumeV1(
  signedCapHeightM: number,
  junctionRadiusM: number,
): number {
  assertFinite("signedCapHeightM", signedCapHeightM);
  assertPositiveFinite("junctionRadiusM", junctionRadiusM);

  const scaleM = Math.max(Math.abs(signedCapHeightM), junctionRadiusM);
  const normalizedHeight = signedCapHeightM / scaleM;
  const normalizedRadius = junctionRadiusM / scaleM;
  const volumeM3 = (Math.PI / 6)
    * ((signedCapHeightM * scaleM) * scaleM)
    * (normalizedHeight ** 2 + 3 * normalizedRadius ** 2);
  assertFinite("signed spherical-cap volume", volumeM3);
  return volumeM3;
}

/**
 * Inverts the strictly monotone signed spherical-cap relation.
 *
 * The cubic is solved after scaling by max(y, cbrt(|V|)). This avoids the
 * cancellation of Cardano's direct formula near the flat-wall limit V=0 and
 * avoids forming V/y^3 when the two length scales are very different.
 */
export function invertSignedSphericalCapVolumeV1(
  signedMidwallCapVolumeM3: number,
  junctionRadiusM: number,
): SignedSphericalCapInverseV1 {
  assertFinite("signedMidwallCapVolumeM3", signedMidwallCapVolumeM3);
  assertPositiveFinite("junctionRadiusM", junctionRadiusM);

  if (signedMidwallCapVolumeM3 === 0) {
    const derivative = 2 / (Math.PI * junctionRadiusM * junctionRadiusM);
    assertPositiveFinite("flat-cap inverse derivative", derivative);
    return Object.freeze({
      signedMidwallCapVolumeM3,
      junctionRadiusM,
      signedCapHeightM: 0,
      capHeightDerivativeByVolumePerM2: derivative,
      capHeightDerivativeByJunctionRadiusAtFixedVolume: 0,
    });
  }

  const sign = Math.sign(signedMidwallCapVolumeM3);
  const absoluteVolumeM3 = Math.abs(signedMidwallCapVolumeM3);
  const scaleM = Math.max(junctionRadiusM, Math.cbrt(absoluteVolumeM3));
  const normalizedRadius = junctionRadiusM / scaleM;
  const linearCoefficient = 3 * normalizedRadius * normalizedRadius;
  const normalizedVolume = SIX_OVER_PI
    * (((absoluteVolumeM3 / scaleM) / scaleM) / scaleM);
  assertPositiveFinite("scaled signed-cap volume", normalizedVolume);

  // For u^3 + a u = c with a,c >= 0, both cbrt(c) and c/a are upper bounds.
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
      + Math.abs(normalizedHeight * (normalizedHeight * normalizedHeight + linearCoefficient));
    if (Math.abs(residual) <= 8 * Number.EPSILON * residualScale) {
      break;
    }

    if (residual > 0) {
      upper = normalizedHeight;
    } else {
      lower = normalizedHeight;
    }
    const derivative = 3 * normalizedHeight * normalizedHeight + linearCoefficient;
    const newton = normalizedHeight - residual / derivative;
    normalizedHeight = Number.isFinite(newton) && newton > lower && newton < upper
      ? newton
      : lower + 0.5 * (upper - lower);
  }

  const finalScaledResidual = normalizedHeight
    * (normalizedHeight * normalizedHeight + linearCoefficient)
    - normalizedVolume;
  const finalScaledResidualReference = normalizedVolume
    + Math.abs(normalizedHeight * (normalizedHeight * normalizedHeight + linearCoefficient));
  if (Math.abs(finalScaledResidual) > 64 * Number.EPSILON * finalScaledResidualReference) {
    throw new Error(`signed spherical-cap inverse did not converge, scaled residual ${finalScaledResidual}`);
  }

  const signedCapHeightM = sign * scaleM * normalizedHeight;
  assertFinite("signedCapHeightM", signedCapHeightM);
  const radiusSquaredM2 = signedCapHeightM * signedCapHeightM
    + junctionRadiusM * junctionRadiusM;
  assertPositiveFinite("cap radius squared", radiusSquaredM2);
  const capHeightDerivativeByVolumePerM2 = 2 / (Math.PI * radiusSquaredM2);
  const capHeightDerivativeByJunctionRadiusAtFixedVolume = -2
    * signedCapHeightM
    * junctionRadiusM
    / radiusSquaredM2;
  assertPositiveFinite("capHeightDerivativeByVolumePerM2", capHeightDerivativeByVolumePerM2);
  assertFinite(
    "capHeightDerivativeByJunctionRadiusAtFixedVolume",
    capHeightDerivativeByJunctionRadiusAtFixedVolume,
  );

  return Object.freeze({
    signedMidwallCapVolumeM3,
    junctionRadiusM,
    signedCapHeightM,
    capHeightDerivativeByVolumePerM2,
    capHeightDerivativeByJunctionRadiusAtFixedVolume,
  });
}

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite, got ${value}`);
  }
}

function assertPositiveFinite(label: string, value: number): void {
  if (!Number.isFinite(value) || !(value > 0)) {
    throw new Error(`${label} must be finite and > 0, got ${value}`);
  }
}
