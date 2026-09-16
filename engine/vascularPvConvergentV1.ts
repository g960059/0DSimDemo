import {
  complianceFromPtm,
  stressedVolumeFromPtm,
  ptmFromStressedVolume as previousInverse,
  ptmAndVolumeTangentFromStressedVolume as previousPairedInverse,
  MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG,
  type VascularPvLaw,
  type PtmFromStressedVolumeOptions,
  type PtmAndVolumeTangent,
} from "./vascularPvConstitutiveV1";
import { softplus } from "./math";

export * from "./vascularPvConstitutiveV1";
export const VASCULAR_PRESSURE_INVERSE_POLICY_V1 =
  "bracketed-step-contraction-venous-inverse-v1" as const;

type VenousLaw = Extract<VascularPvLaw, { kind: "venous3" }>;
type PreparedVenousLaw = Readonly<{
  volume(pressure: number): number;
  compliance(pressure: number): number;
  lowerVolume: number;
  upperVolume: number;
}>;
const preparedLaws = new WeakMap<VenousLaw, PreparedVenousLaw>();
const defaults = Object.freeze({});

export class VenousPressureInverseConvergenceErrorV1 extends Error {
  readonly reason = "venous-pressure-inverse-not-converged";
  constructor(readonly diagnostic: Readonly<{
    iterations: number;
    targetStressedVolumeMl: number;
    pressureMmHg: number;
    volumeResidualMl: number;
    lowerPressureMmHg: number;
    upperPressureMmHg: number;
  }>) {
    super(`Venous pressure inverse did not converge after ${diagnostic.iterations} evaluations: volume residual ${diagnostic.volumeResidualMl} mL`);
    this.name = "VenousPressureInverseConvergenceErrorV1";
  }
}

/** Same physical law and saturation bounds; never returns an unverified
 * adaptive iterate. Pressure-bracket bisection does not subdivide model time. */
export function ptmFromStressedVolume(
  law: VascularPvLaw,
  targetStressedVolumeMl: number,
  options: PtmFromStressedVolumeOptions = defaults,
): number {
  if (!Number.isFinite(targetStressedVolumeMl)) throw new RangeError("targetStressedVolumeMl must be finite");
  if (law.kind !== "venous3" || options.termination === "fixed-iterations")
    return previousInverse(law, targetStressedVolumeMl, options);
  return invert(law, targetStressedVolumeMl, options, prepareLaw(law));
}

function invert(law: VenousLaw, targetStressedVolumeMl: number,
  options: PtmFromStressedVolumeOptions, prepared: PreparedVenousLaw | null): number {
  const maximumIterations = options.maxIterations ?? 96;
  const pressureTolerance = options.pressureToleranceMmHg ?? 1e-10;
  const volumeTolerance = options.stressedVolumeToleranceMl ?? 1e-10;
  if (!Number.isSafeInteger(maximumIterations) || maximumIterations < 1
    || !Number.isFinite(pressureTolerance) || pressureTolerance < 0
    || !Number.isFinite(volumeTolerance) || volumeTolerance < 0
    || (options.termination !== undefined && options.termination !== "adaptive"))
    throw new RangeError("Venous inverse requires a finite positive iteration budget and finite nonnegative tolerances");

  let lowerPressureMmHg: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum;
  let upperPressureMmHg: number = MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum;
  const lowerVolume = prepared?.lowerVolume ?? stressedVolumeFromPtm(law, lowerPressureMmHg);
  const upperVolume = prepared?.upperVolume ?? stressedVolumeFromPtm(law, upperPressureMmHg);
  if (!Number.isFinite(lowerVolume) || !Number.isFinite(upperVolume) || !(upperVolume > lowerVolume))
    throw new RangeError("Venous inverse requires a finite increasing volume bracket");
  if (targetStressedVolumeMl <= lowerVolume) return lowerPressureMmHg;
  if (targetStressedVolumeMl >= upperVolume) return upperPressureMmHg;
  let previousStep = upperPressureMmHg - lowerPressureMmHg;
  let pressureMmHg = lowerPressureMmHg
    + (targetStressedVolumeMl - lowerVolume) * previousStep / (upperVolume - lowerVolume);
  if (!Number.isFinite(pressureMmHg) || !(pressureMmHg > lowerPressureMmHg && pressureMmHg < upperPressureMmHg))
    pressureMmHg = (lowerPressureMmHg + upperPressureMmHg) / 2;
  let volumeResidualMl = Number.POSITIVE_INFINITY;
  for (let iteration = 0; iteration < maximumIterations; iteration++) {
    volumeResidualMl = (prepared ? prepared.volume(pressureMmHg) : stressedVolumeFromPtm(law, pressureMmHg)) - targetStressedVolumeMl;
    if (!Number.isFinite(volumeResidualMl)) throw new RangeError("Venous inverse produced a nonfinite volume residual");
    if (Math.abs(volumeResidualMl) <= volumeTolerance) return pressureMmHg;
    if (volumeResidualMl < 0) lowerPressureMmHg = pressureMmHg;
    else upperPressureMmHg = pressureMmHg;
    const midpoint = (lowerPressureMmHg + upperPressureMmHg) / 2;
    if ((upperPressureMmHg - lowerPressureMmHg) / 2 <= pressureTolerance) return midpoint;
    // Do not report an unevaluated final trial as the failed candidate.
    if (iteration + 1 === maximumIterations) break;
    const newtonPressure = pressureMmHg - volumeResidualMl / (prepared ? prepared.compliance(pressureMmHg) : complianceFromPtm(law, pressureMmHg));
    const next = Number.isFinite(newtonPressure)
      && newtonPressure > lowerPressureMmHg && newtonPressure < upperPressureMmHg
      && Math.abs(newtonPressure - pressureMmHg) <= previousStep / 2
      ? newtonPressure : midpoint;
    previousStep = Math.abs(next - pressureMmHg);
    pressureMmHg = next;
  }
  throw new VenousPressureInverseConvergenceErrorV1(Object.freeze({
    iterations: maximumIterations, targetStressedVolumeMl, pressureMmHg,
    volumeResidualMl, lowerPressureMmHg, upperPressureMmHg,
  }));
}

export function ptmAndVolumeTangentFromStressedVolume(
  law: VascularPvLaw,
  targetStressedVolumeMl: number,
  options: PtmFromStressedVolumeOptions = defaults,
): PtmAndVolumeTangent {
  if (law.kind !== "venous3" || options.termination === "fixed-iterations")
    return previousPairedInverse(law, targetStressedVolumeMl, options);
  if (!Number.isFinite(targetStressedVolumeMl)) throw new RangeError("targetStressedVolumeMl must be finite");
  const prepared = prepareLaw(law);
  const transmuralPressure = invert(law, targetStressedVolumeMl, options, prepared);
  const lower = targetStressedVolumeMl <= (prepared?.lowerVolume ?? stressedVolumeFromPtm(law, MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum));
  const upper = targetStressedVolumeMl >= (prepared?.upperVolume ?? stressedVolumeFromPtm(law, MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum));
  return Object.freeze({ transmuralPressure,
    dPtmDStressedVolume: lower || upper ? 0 : 1 / (prepared ? prepared.compliance(transmuralPressure) : complianceFromPtm(law, transmuralPressure)),
    branch: lower ? "venous-lower-saturation" : upper ? "venous-upper-saturation" : "venous-interior",
  });
}

function prepareLaw(law: VenousLaw): PreparedVenousLaw | null {
  const cached = preparedLaws.get(law);
  if (cached) return cached;
  for (const key of ["Ccoll", "Copen", "Cdist", "dOpen", "dStiff"] as const)
    if (!Number.isFinite(law[key]) || !(law[key] > 0)) throw new RangeError(`Venous ${key} must be positive and finite`);
  if (law.Copen < law.Ccoll || law.Copen < law.Cdist || !Number.isFinite(law.Popen) || !Number.isFinite(law.Pstiff))
    throw new RangeError("Invalid venous compliance or transition pressures");
  const prototype = Object.getPrototypeOf(law);
  // Never snapshot mutable, accessor-backed, or inherited coefficients.
  if (!Object.isFrozen(law) || (prototype !== null && prototype !== Object.prototype)
    || !Reflect.ownKeys(law).every(key => "value" in Object.getOwnPropertyDescriptor(law, key)!)
    || !["Ccoll", "Copen", "Cdist", "Popen", "Pstiff", "dOpen", "dStiff"].every(key => Object.hasOwn(law, key))) return null;
  const { Ccoll, Popen, Pstiff } = law;
  const dOpen = Math.max(law.dOpen, 1e-6), dStiff = Math.max(law.dStiff, 1e-6);
  const openDelta = law.Copen - Ccoll, stiffDelta = law.Copen - law.Cdist;
  const openWidth = openDelta * dOpen, stiffWidth = stiffDelta * dStiff;
  const zeroOpen = softplus((0 - Popen) / dOpen), zeroStiff = softplus((0 - Pstiff) / dStiff);
  // Preserve the constitutive arithmetic order in vascularPv exactly. Only
  // preparation/lookup work moves out of the inverse's iteration loop.
  const volume = (p: number) => Ccoll * p
    + openWidth * (softplus((p - Popen) / dOpen) - zeroOpen)
    - stiffWidth * (softplus((p - Pstiff) / dStiff) - zeroStiff);
  const compliance = (p: number) => Math.max(Ccoll
    + openDelta * sigmoid((p - Popen) / dOpen)
    - stiffDelta * sigmoid((p - Pstiff) / dStiff), 1e-4);
  const prepared = Object.freeze({ volume, compliance,
    lowerVolume: volume(MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum),
    upperVolume: volume(MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum) });
  preparedLaws.set(law, prepared);
  return prepared;
}

function sigmoid(x: number): number {
  if (x >= 40) return 1;
  if (x <= -40) return 0;
  return 1 / (1 + Math.exp(-x));
}
