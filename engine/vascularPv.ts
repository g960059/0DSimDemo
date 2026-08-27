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
  termination?: "adaptive" | "fixed-iterations";
};

export type PtmFromStressedVolumeTangentBranch =
  | "arterial-lower-saturation"
  | "arterial-interior"
  | "linear"
  | "venous-lower-saturation"
  | "venous-interior"
  | "venous-upper-saturation";

export type PtmAndVolumeTangent = Readonly<{
  /** Exactly the same primal value returned by ptmFromStressedVolume. */
  transmuralPressure: number;
  /** Constitutive dPtm/d(stressed volume) on the active inverse branch. */
  dPtmDStressedVolume: number;
  branch: PtmFromStressedVolumeTangentBranch;
}>;

export const MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN = Math.log(0.05);
export const MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG = Object.freeze({
  minimum: -20,
  maximum: 45,
});

type VenousPvLawV1 = Extract<VascularPvLaw, { kind: "venous3" }>;

type CompiledVenousPvLawV1 = Readonly<{
  Ccoll: number;
  openComplianceDelta: number;
  distendedComplianceDelta: number;
  openComplianceDeltaTimesWidth: number;
  distendedComplianceDeltaTimesWidth: number;
  Popen: number;
  Pstiff: number;
  dOpen: number;
  dStiff: number;
  zeroOpenSoftplus: number;
  zeroStiffSoftplus: number;
}>;

const COMPILED_FROZEN_VENOUS_PV_LAWS_V1 = new WeakMap<
  VenousPvLawV1,
  CompiledVenousPvLawV1
>();
const VALIDATED_FROZEN_VENOUS_PV_LAWS_V1 = new WeakSet<VenousPvLawV1>();

export function stressedVolumeFromPtm(law: VascularPvLaw, Ptm: number): number {
  if (law.kind === "arterial") {
    const p0 = Math.max(law.P0, 1e-6);
    const pressure = Math.max(Ptm, -0.95 * p0);
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
 * Arterial and venous domains intentionally preserve the admitted saturation
 * semantics. Changing these bounds is a main-wire model change,
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
      MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN,
      targetStressedVolumeMl / vs,
    );
    const pressure = p0 * Math.expm1(strain);
    if (!Number.isFinite(pressure)) {
      throw new RangeError("arterial stressed volume maps outside finite pressure");
    }
    return pressure;
  }

  if (law.kind === "linear") {
    return targetStressedVolumeMl / Math.max(law.C, 1e-6);
  }

  validateVenousLawOncePerFrozenObjectV1(law);
  const compiledLaw = compiledVenousPvLawSnapshotV1(law);
  let lo: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum;
  let hi: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum;

  let loVolume = venousStressedVolumeForInverse(law, compiledLaw, lo);
  let hiVolume = venousStressedVolumeForInverse(law, compiledLaw, hi);
  if (targetStressedVolumeMl <= loVolume) return lo;
  if (targetStressedVolumeMl >= hiVolume) return hi;

  const maxIterations = Math.max(1, Math.floor(options.maxIterations ?? 32));
  const adaptiveTermination = (options.termination ?? "adaptive") === "adaptive";
  const pressureTolerance = Math.max(options.pressureToleranceMmHg ?? 1e-10, 0);
  const volumeTolerance = Math.max(options.stressedVolumeToleranceMl ?? 1e-10, 0);
  if (adaptiveTermination) {
    return solveVenousPressureWithSafeguardedNewtonV1(
      law,
      compiledLaw,
      targetStressedVolumeMl,
      lo,
      hi,
      loVolume,
      hiVolume,
      maxIterations,
      pressureTolerance,
      volumeTolerance,
    );
  }
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const mid = 0.5 * (lo + hi);
    const midVolume = venousStressedVolumeForInverse(law, compiledLaw, mid);
    if (midVolume < targetStressedVolumeMl) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

/**
 * Paired inverse-PV value and constitutive tangent.
 *
 * The primal delegates to `ptmFromStressedVolume`, preserving its accepted
 * value bit-for-bit. The tangent differentiates the underlying constitutive
 * inverse rather than the finite sequence of adaptive bisection iterates.
 * Saturated inverse branches deliberately return zero tangent.
 */
export function ptmAndVolumeTangentFromStressedVolume(
  law: VascularPvLaw,
  targetStressedVolumeMl: number,
  options: PtmFromStressedVolumeOptions = {},
): PtmAndVolumeTangent {
  const transmuralPressure = ptmFromStressedVolume(
    law,
    targetStressedVolumeMl,
    options,
  );

  if (law.kind === "arterial") {
    const vs = Math.max(law.VsEff, 1e-6);
    if (targetStressedVolumeMl / vs <= MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN) {
      return Object.freeze({
        transmuralPressure,
        dPtmDStressedVolume: 0,
        branch: "arterial-lower-saturation" as const,
      });
    }
    const p0 = Math.max(law.P0, 1e-6);
    return Object.freeze({
      transmuralPressure,
      dPtmDStressedVolume: (p0 + transmuralPressure) / vs,
      branch: "arterial-interior" as const,
    });
  }

  if (law.kind === "linear") {
    return Object.freeze({
      transmuralPressure,
      dPtmDStressedVolume: 1 / Math.max(law.C, 1e-6),
      branch: "linear" as const,
    });
  }

  const lowerVolumeMl = stressedVolumeFromPtm(
    law,
    MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum,
  );
  if (targetStressedVolumeMl <= lowerVolumeMl) {
    return Object.freeze({
      transmuralPressure,
      dPtmDStressedVolume: 0,
      branch: "venous-lower-saturation" as const,
    });
  }
  const upperVolumeMl = stressedVolumeFromPtm(
    law,
    MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum,
  );
  if (targetStressedVolumeMl >= upperVolumeMl) {
    return Object.freeze({
      transmuralPressure,
      dPtmDStressedVolume: 0,
      branch: "venous-upper-saturation" as const,
    });
  }
  return Object.freeze({
    transmuralPressure,
    dPtmDStressedVolume: 1 / complianceFromPtm(law, transmuralPressure),
    branch: "venous-interior" as const,
  });
}

function validateVenousLaw(
  law: Extract<VascularPvLaw, { kind: "venous3" }>,
): void {
  requirePositiveFiniteVenousParameterV1(law.Ccoll, "Ccoll");
  requirePositiveFiniteVenousParameterV1(law.Copen, "Copen");
  requirePositiveFiniteVenousParameterV1(law.Cdist, "Cdist");
  requirePositiveFiniteVenousParameterV1(law.dOpen, "dOpen");
  requirePositiveFiniteVenousParameterV1(law.dStiff, "dStiff");
  if (!(law.Copen >= law.Ccoll && law.Copen >= law.Cdist)) {
    throw new RangeError("venous Copen must be at least Ccoll and Cdist");
  }
  if (!Number.isFinite(law.Popen) || !Number.isFinite(law.Pstiff)) {
    throw new RangeError("venous transition pressures must be finite");
  }
}

function validateVenousLawOncePerFrozenObjectV1(law: VenousPvLawV1): void {
  if (VALIDATED_FROZEN_VENOUS_PV_LAWS_V1.has(law)) return;
  validateVenousLaw(law);
  if (Object.isFrozen(law) && plainDataRecord(law)) {
    VALIDATED_FROZEN_VENOUS_PV_LAWS_V1.add(law);
  }
}

function requirePositiveFiniteVenousParameterV1(
  value: number,
  name: string,
): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new RangeError(`venous ${name} must be positive and finite`);
  }
}

function venousCompliance3(law: Extract<VascularPvLaw, { kind: "venous3" }>, Ptm: number): number {
  const c = law.Ccoll
    + (law.Copen - law.Ccoll) * sigmoid((Ptm - law.Popen) / Math.max(law.dOpen, 1e-6))
    - (law.Copen - law.Cdist) * sigmoid((Ptm - law.Pstiff) / Math.max(law.dStiff, 1e-6));
  return Math.max(c, 1e-4);
}

function venousStressedVolume3(law: VenousPvLawV1, Ptm: number): number {
  const compiledLaw = cachedFrozenVenousPvLawV1(law);
  return compiledLaw === null
    ? venousStressedVolume3Dynamic(law, Ptm)
    : venousStressedVolume3Compiled(compiledLaw, Ptm);
}

function venousStressedVolumeForInverse(
  law: VenousPvLawV1,
  compiledLaw: CompiledVenousPvLawV1 | null,
  Ptm: number,
): number {
  return compiledLaw === null
    ? venousStressedVolume3Dynamic(law, Ptm)
    : venousStressedVolume3Compiled(compiledLaw, Ptm);
}

function solveVenousPressureWithSafeguardedNewtonV1(
  law: VenousPvLawV1,
  compiledLaw: CompiledVenousPvLawV1 | null,
  targetStressedVolumeMl: number,
  initialLowerPressureMmHg: number,
  initialUpperPressureMmHg: number,
  initialLowerVolumeMl: number,
  initialUpperVolumeMl: number,
  maximumIterations: number,
  pressureToleranceMmHg: number,
  stressedVolumeToleranceMl: number,
): number {
  let lowerPressureMmHg = initialLowerPressureMmHg;
  let upperPressureMmHg = initialUpperPressureMmHg;
  let lowerVolumeMl = initialLowerVolumeMl;
  let upperVolumeMl = initialUpperVolumeMl;
  let pressureMmHg = lowerPressureMmHg
    + (targetStressedVolumeMl - lowerVolumeMl)
      * (upperPressureMmHg - lowerPressureMmHg)
      / (upperVolumeMl - lowerVolumeMl);
  if (
    !Number.isFinite(pressureMmHg)
    || !(pressureMmHg > lowerPressureMmHg)
    || !(pressureMmHg < upperPressureMmHg)
  ) {
    pressureMmHg = 0.5 * (lowerPressureMmHg + upperPressureMmHg);
  }

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const volumeMl = venousStressedVolumeForInverse(
      law,
      compiledLaw,
      pressureMmHg,
    );
    const volumeResidualMl = volumeMl - targetStressedVolumeMl;
    if (Math.abs(volumeResidualMl) <= stressedVolumeToleranceMl) {
      return pressureMmHg;
    }
    if (volumeResidualMl < 0) {
      lowerPressureMmHg = pressureMmHg;
      lowerVolumeMl = volumeMl;
    } else {
      upperPressureMmHg = pressureMmHg;
      upperVolumeMl = volumeMl;
    }
    const midpointMmHg = 0.5 * (
      lowerPressureMmHg + upperPressureMmHg
    );
    if (
      0.5 * (upperPressureMmHg - lowerPressureMmHg)
      <= pressureToleranceMmHg
    ) {
      return midpointMmHg;
    }
    const complianceMlPerMmHg = venousComplianceForInverseV1(
      law,
      compiledLaw,
      pressureMmHg,
    );
    const newtonPressureMmHg = pressureMmHg
      - volumeResidualMl / complianceMlPerMmHg;
    pressureMmHg = Number.isFinite(newtonPressureMmHg)
      && newtonPressureMmHg > lowerPressureMmHg
      && newtonPressureMmHg < upperPressureMmHg
      ? newtonPressureMmHg
      : midpointMmHg;
  }
  return 0.5 * (lowerPressureMmHg + upperPressureMmHg);
}

function venousComplianceForInverseV1(
  law: VenousPvLawV1,
  compiledLaw: CompiledVenousPvLawV1 | null,
  pressureMmHg: number,
): number {
  if (compiledLaw === null) return venousCompliance3(law, pressureMmHg);
  const compliance = compiledLaw.Ccoll
    + compiledLaw.openComplianceDelta
      * sigmoid(
        (pressureMmHg - compiledLaw.Popen) / compiledLaw.dOpen,
      )
    - compiledLaw.distendedComplianceDelta
      * sigmoid(
        (pressureMmHg - compiledLaw.Pstiff) / compiledLaw.dStiff,
      );
  return Math.max(compliance, 1e-4);
}

function venousStressedVolume3Dynamic(law: VenousPvLawV1, Ptm: number): number {
  const dOpen = Math.max(law.dOpen, 1e-6);
  const dStiff = Math.max(law.dStiff, 1e-6);
  return law.Ccoll * Ptm
    + (law.Copen - law.Ccoll) * dOpen
      * (softplus((Ptm - law.Popen) / dOpen) - softplus((0 - law.Popen) / dOpen))
    - (law.Copen - law.Cdist) * dStiff
      * (softplus((Ptm - law.Pstiff) / dStiff) - softplus((0 - law.Pstiff) / dStiff));
}

function venousStressedVolume3Compiled(
  law: CompiledVenousPvLawV1,
  Ptm: number,
): number {
  return law.Ccoll * Ptm
    + law.openComplianceDeltaTimesWidth
      * (softplus((Ptm - law.Popen) / law.dOpen) - law.zeroOpenSoftplus)
    - law.distendedComplianceDeltaTimesWidth
      * (softplus((Ptm - law.Pstiff) / law.dStiff) - law.zeroStiffSoftplus);
}

function cachedFrozenVenousPvLawV1(
  law: VenousPvLawV1,
): CompiledVenousPvLawV1 | null {
  const cached = COMPILED_FROZEN_VENOUS_PV_LAWS_V1.get(law);
  if (cached !== undefined) return cached;
  if (!Object.isFrozen(law) || !plainDataRecord(law)) return null;
  const compiled = compileVenousPvLawV1(law);
  COMPILED_FROZEN_VENOUS_PV_LAWS_V1.set(law, compiled);
  return compiled;
}

function compiledVenousPvLawSnapshotV1(
  law: VenousPvLawV1,
): CompiledVenousPvLawV1 | null {
  const cached = COMPILED_FROZEN_VENOUS_PV_LAWS_V1.get(law);
  if (cached !== undefined) return cached;
  if (!plainDataRecord(law)) return null;
  const compiled = compileVenousPvLawV1(law);
  if (Object.isFrozen(law)) {
    COMPILED_FROZEN_VENOUS_PV_LAWS_V1.set(law, compiled);
  }
  return compiled;
}

function compileVenousPvLawV1(law: VenousPvLawV1): CompiledVenousPvLawV1 {
  const dOpen = Math.max(law.dOpen, 1e-6);
  const dStiff = Math.max(law.dStiff, 1e-6);
  const openComplianceDelta = law.Copen - law.Ccoll;
  const distendedComplianceDelta = law.Copen - law.Cdist;
  const compiled = Object.freeze({
    Ccoll: law.Ccoll,
    openComplianceDelta,
    distendedComplianceDelta,
    openComplianceDeltaTimesWidth: openComplianceDelta * dOpen,
    distendedComplianceDeltaTimesWidth: distendedComplianceDelta * dStiff,
    Popen: law.Popen,
    Pstiff: law.Pstiff,
    dOpen,
    dStiff,
    zeroOpenSoftplus: softplus((0 - law.Popen) / dOpen),
    zeroStiffSoftplus: softplus((0 - law.Pstiff) / dStiff),
  });
  return compiled;
}

function plainDataRecord(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype) return false;
  return Reflect.ownKeys(value).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && "value" in descriptor;
  });
}

function sigmoid(x: number): number {
  if (x >= 40) return 1;
  if (x <= -40) return 0;
  return 1 / (1 + Math.exp(-x));
}
