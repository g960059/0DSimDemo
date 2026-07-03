export type AVPlaneSideV1 = "left" | "right";

export type AVPlaneGeometryStateV1 = {
  readonly side: AVPlaneSideV1;
  readonly enabled: boolean;
  readonly zAvNorm: number;
  readonly zAvDotNormPerSec: number;
};

export type AVPlaneGeometryReadbackV1 = {
  readonly side: AVPlaneSideV1;
  readonly enabled: boolean;
  readonly zAvNorm: number;
  readonly zAvDotNormPerSec: number;
  readonly atrialGeometryDeltaMl: number;
  readonly ventricularGeometryDeltaMl: number;
  readonly hiddenBloodVolumeSourceMl: number;
  readonly sPrimeProxyCmPerSec: number | null;
  readonly ePrimeProxyCmPerSec: number | null;
  readonly aPrimeProxyCmPerSec: number | null;
  readonly readbackStatus:
    | "disabled-placeholder-no-velocity-claim"
    | "enabled-shadow-readback";
};

export type AVPlaneGeometryShadowReadbackInputV1 = {
  readonly side: AVPlaneSideV1;
  readonly theta: number;
  readonly zAvNorm: number;
  readonly zAvDotNormPerSec: number;
  readonly atrialGeometryDeltaMl: number;
  readonly ventricularGeometryDeltaMl?: number;
  readonly velocityScaleCmPerSec?: number;
  readonly systolicVelocityWindow?: readonly [number, number];
  readonly earlyDiastolicVelocityWindow?: readonly [number, number];
  readonly atrialKickVelocityWindow?: readonly [number, number];
  readonly velocityWindowTaperFraction?: number;
};

export function initialDisabledAVPlaneGeometryStateV1(side: AVPlaneSideV1): AVPlaneGeometryStateV1 {
  return {
    side,
    enabled: false,
    zAvNorm: 0,
    zAvDotNormPerSec: 0,
  };
}

export function disabledAVPlaneGeometryReadbackV1(
  state: AVPlaneGeometryStateV1,
): AVPlaneGeometryReadbackV1 {
  return {
    side: state.side,
    enabled: false,
    zAvNorm: 0,
    zAvDotNormPerSec: 0,
    atrialGeometryDeltaMl: 0,
    ventricularGeometryDeltaMl: 0,
    hiddenBloodVolumeSourceMl: 0,
    sPrimeProxyCmPerSec: null,
    ePrimeProxyCmPerSec: null,
    aPrimeProxyCmPerSec: null,
    readbackStatus: "disabled-placeholder-no-velocity-claim",
  };
}

export function enabledAVPlaneGeometryShadowReadbackV1(
  input: AVPlaneGeometryShadowReadbackInputV1,
): AVPlaneGeometryReadbackV1 {
  const zAvNorm = clamp(input.zAvNorm, 0, 1);
  const zAvDotNormPerSec = input.zAvDotNormPerSec;
  const velocityScale = input.velocityScaleCmPerSec ?? 8;
  const velocityProxy = zAvDotNormPerSec * velocityScale;
  const systolicWindow = input.systolicVelocityWindow ?? [0.06, 0.42];
  const earlyDiastolicWindow = input.earlyDiastolicVelocityWindow ?? [0.43, 0.72];
  const atrialKickWindow = input.atrialKickVelocityWindow ?? [0.74, 0.99];
  const taperFraction = Math.max(0, input.velocityWindowTaperFraction ?? 0);
  const sPrimeWeight = velocityWindowWeight(input.theta, systolicWindow, taperFraction);
  const ePrimeWeight = velocityWindowWeight(input.theta, earlyDiastolicWindow, taperFraction);
  const aPrimeWeight = velocityWindowWeight(input.theta, atrialKickWindow, taperFraction);
  return {
    side: input.side,
    enabled: true,
    zAvNorm,
    zAvDotNormPerSec,
    atrialGeometryDeltaMl: input.atrialGeometryDeltaMl,
    ventricularGeometryDeltaMl: input.ventricularGeometryDeltaMl ?? -input.atrialGeometryDeltaMl,
    hiddenBloodVolumeSourceMl: 0,
    sPrimeProxyCmPerSec: sPrimeWeight > 1e-6 ? velocityProxy * sPrimeWeight : null,
    ePrimeProxyCmPerSec: ePrimeWeight > 1e-6 ? velocityProxy * ePrimeWeight : null,
    aPrimeProxyCmPerSec: aPrimeWeight > 1e-6 ? velocityProxy * aPrimeWeight : null,
    readbackStatus: "enabled-shadow-readback",
  };
}

function velocityWindowWeight(theta: number, window: readonly [number, number], taperFraction: number): number {
  const value = positiveModulo(theta, 1);
  const start = positiveModulo(window[0], 1);
  const end = positiveModulo(window[1], 1);
  const rawWidth = start <= end ? end - start : 1 - start + end;
  const width = Math.max(rawWidth, 1e-9);
  const offset = start <= end
    ? value - start
    : value >= start
      ? value - start
      : 1 - start + value;
  if (offset < 0 || offset > width) return 0;
  if (taperFraction <= 0) return 1;
  const edge = Math.max(1e-9, Math.min(0.49, taperFraction) * width);
  const rise = smoothstep01(offset / edge);
  const fall = smoothstep01((width - offset) / edge);
  return rise * fall;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep01(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}
