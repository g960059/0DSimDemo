import { softplus } from "@/engine/math";

export type VascularPvLaw =
  | {
      kind: "arterial";
      Vu: number;
      P0: number;
      VsEff: number;
    }
  | {
      kind: "linear";
      Vu: number;
      C: number;
    }
  | {
      kind: "venous3";
      Vu: number;
      Ccoll: number;
      Copen: number;
      Cdist: number;
      Popen: number;
      Pstiff: number;
      dOpen: number;
      dStiff: number;
    };

export type PtmFromStressedVolumeOptions = {
  maxIterations?: number;
  pressureToleranceMmHg?: number;
  stressedVolumeToleranceMl?: number;
};

export const MAIN_WIRE_ARTERIAL_LOG_STRAIN_BOUNDS = Object.freeze({
  minimum: -30,
  maximum: 5,
});
export const MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG = Object.freeze({
  minimum: -20,
  maximum: 45,
});

export function stressedVolumeFromPtm(law: VascularPvLaw, Ptm: number): number {
  if (law.kind === "arterial") {
    const p0 = Math.max(law.P0, 1e-6);
    const minimumPressure = p0 * Math.expm1(MAIN_WIRE_ARTERIAL_LOG_STRAIN_BOUNDS.minimum);
    const maximumPressure = p0 * Math.expm1(MAIN_WIRE_ARTERIAL_LOG_STRAIN_BOUNDS.maximum);
    const pressure = Math.max(minimumPressure, Math.min(maximumPressure, Ptm));
    return Math.max(law.VsEff, 1e-6) * Math.log1p(pressure / p0);
  }
  if (law.kind === "linear") {
    return Math.max(law.C, 1e-6) * Ptm;
  }
  return venousStressedVolume3(law, Ptm);
}

export function complianceFromPtm(law: VascularPvLaw, Ptm: number): number {
  if (law.kind === "arterial") {
    return Math.max(law.VsEff, 1e-6) / Math.max(Math.max(law.P0, 1e-6) + Ptm, 1e-6);
  }
  if (law.kind === "linear") {
    return Math.max(law.C, 1e-6);
  }
  return venousCompliance3(law, Ptm);
}

/**
 * Invert the main-wire vascular PV law in stressed-volume coordinates.
 *
 * Arterial and venous domains intentionally preserve ModelCore's shipped
 * saturation semantics. Changing these bounds is a main-wire model change,
 * not a private inverse-solver option.
 */
export function ptmFromStressedVolume(
  law: VascularPvLaw,
  targetStressedVolumeMl: number,
  options: PtmFromStressedVolumeOptions = {},
): number {
  if (!Number.isFinite(targetStressedVolumeMl)) {
    throw new RangeError("targetStressedVolumeMl must be finite");
  }

  if (law.kind === "arterial") {
    const p0 = Math.max(law.P0, 1e-6);
    const vs = Math.max(law.VsEff, 1e-6);
    const strain = Math.max(
      MAIN_WIRE_ARTERIAL_LOG_STRAIN_BOUNDS.minimum,
      Math.min(
        MAIN_WIRE_ARTERIAL_LOG_STRAIN_BOUNDS.maximum,
        targetStressedVolumeMl / vs,
      ),
    );
    return p0 * Math.expm1(strain);
  }

  if (law.kind === "linear") {
    return targetStressedVolumeMl / Math.max(law.C, 1e-6);
  }

  validateVenousLaw(law);
  let lo: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum;
  let hi: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum;

  let loVolume = stressedVolumeFromPtm(law, lo);
  let hiVolume = stressedVolumeFromPtm(law, hi);
  if (targetStressedVolumeMl <= loVolume) return lo;
  if (targetStressedVolumeMl >= hiVolume) return hi;

  const maxIterations = Math.max(1, Math.floor(options.maxIterations ?? 32));
  const pressureTolerance = Math.max(options.pressureToleranceMmHg ?? 1e-10, 0);
  const volumeTolerance = Math.max(options.stressedVolumeToleranceMl ?? 1e-10, 0);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const mid = 0.5 * (lo + hi);
    const midVolume = stressedVolumeFromPtm(law, mid);
    if (
      Math.abs(midVolume - targetStressedVolumeMl) <= volumeTolerance
      || 0.5 * (hi - lo) <= pressureTolerance
    ) {
      return mid;
    }
    if (midVolume < targetStressedVolumeMl) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

function validateVenousLaw(
  law: Extract<VascularPvLaw, { kind: "venous3" }>,
): void {
  for (const [name, value] of [
    ["Ccoll", law.Ccoll],
    ["Copen", law.Copen],
    ["Cdist", law.Cdist],
    ["dOpen", law.dOpen],
    ["dStiff", law.dStiff],
  ] as const) {
    if (!(value > 0) || !Number.isFinite(value)) {
      throw new RangeError(`venous ${name} must be positive and finite`);
    }
  }
  if (!(law.Copen >= law.Ccoll && law.Copen >= law.Cdist)) {
    throw new RangeError("venous Copen must be at least Ccoll and Cdist");
  }
  if (!Number.isFinite(law.Popen) || !Number.isFinite(law.Pstiff)) {
    throw new RangeError("venous transition pressures must be finite");
  }
}

function venousCompliance3(law: Extract<VascularPvLaw, { kind: "venous3" }>, Ptm: number): number {
  const c = law.Ccoll
    + (law.Copen - law.Ccoll) * sigmoid((Ptm - law.Popen) / Math.max(law.dOpen, 1e-6))
    - (law.Copen - law.Cdist) * sigmoid((Ptm - law.Pstiff) / Math.max(law.dStiff, 1e-6));
  return Math.max(c, 1e-4);
}

function venousStressedVolume3(law: Extract<VascularPvLaw, { kind: "venous3" }>, Ptm: number): number {
  const dOpen = Math.max(law.dOpen, 1e-6);
  const dStiff = Math.max(law.dStiff, 1e-6);
  return law.Ccoll * Ptm
    + (law.Copen - law.Ccoll) * dOpen
      * (softplus((Ptm - law.Popen) / dOpen) - softplus((0 - law.Popen) / dOpen))
    - (law.Copen - law.Cdist) * dStiff
      * (softplus((Ptm - law.Pstiff) / dStiff) - softplus((0 - law.Pstiff) / dStiff));
}

function sigmoid(x: number): number {
  if (x >= 40) return 1;
  if (x <= -40) return 0;
  return 1 / (1 + Math.exp(-x));
}
