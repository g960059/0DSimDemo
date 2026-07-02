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
