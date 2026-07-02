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
  return {
    side: input.side,
    enabled: true,
    zAvNorm,
    zAvDotNormPerSec,
    atrialGeometryDeltaMl: input.atrialGeometryDeltaMl,
    ventricularGeometryDeltaMl: input.ventricularGeometryDeltaMl ?? -input.atrialGeometryDeltaMl,
    hiddenBloodVolumeSourceMl: 0,
    sPrimeProxyCmPerSec: inCircularWindow(input.theta, systolicWindow) ? velocityProxy : null,
    ePrimeProxyCmPerSec: inCircularWindow(input.theta, earlyDiastolicWindow) ? velocityProxy : null,
    aPrimeProxyCmPerSec: inCircularWindow(input.theta, atrialKickWindow) ? velocityProxy : null,
    readbackStatus: "enabled-shadow-readback",
  };
}

function inCircularWindow(theta: number, window: readonly [number, number]): boolean {
  const value = positiveModulo(theta, 1);
  const start = positiveModulo(window[0], 1);
  const end = positiveModulo(window[1], 1);
  return start <= end ? value >= start && value <= end : value >= start || value <= end;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
