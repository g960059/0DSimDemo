import { MAIN_WIRE_VALVE_PA_PER_MMHG_V2 } from
  "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_PRESCRIBED_FLOW_MOMENTUM_CLAIM_V1 = Object.freeze({
  interpretation: "prescribed-trajectory diagnostic, not corrected pressure/coupled simulation" as const,
  inertance: "fixed-physical-path-not-time-varying-effective-orifice-area" as const,
  derivative: "consecutive-accepted-endpoint-secant-no-resampling" as const,
  energy: "fixed-inertance-kinetic-energy-and-backward-euler-numerical-dissipation" as const,
  closureLawModeled: false as const,
  physiologicalBoundsOrPresetApplied: false as const,
});

export type MainWirePrescribedFlowSampleV1 = Readonly<{
  acceptedTimeSec: number;
  flowMlPerSec: number;
}>;

/** rho * integral(dx/A); a uniform equivalent physical path, not valve EOA. */
export function fixedPathInertanceMmHgSec2PerMlV1(input: Readonly<{
  bloodDensityKgPerM3: number;
  equivalentLengthCm: number;
  physicalPathAreaCm2: number;
}>): number {
  const { bloodDensityKgPerM3: rho, equivalentLengthCm: length,
    physicalPathAreaCm2: area } = input;
  finite(rho, "bloodDensityKgPerM3");
  finite(length, "equivalentLengthCm");
  finite(area, "physicalPathAreaCm2");
  if (rho <= 0 || length < 0 || area <= 0) {
    throw new Error("fixed path requires positive density/area and nonnegative length");
  }
  // cm -> m, cm² -> m², mL/s -> m³/s, Pa -> mmHg.
  const inertance = rho * (length * 1e-2) / (area * 1e-4)
    * 1e-6 / MAIN_WIRE_VALVE_PA_PER_MMHG_V2;
  finite(inertance, "fixed path inertance");
  return inertance;
}

/** No pressure is corrected and no flow/state is solved or fed back. */
export function characterizePrescribedFlowMomentumV1(
  samples: readonly MainWirePrescribedFlowSampleV1[],
  inertanceMmHgSec2PerMl: number,
) {
  const L = inertanceMmHgSec2PerMl;
  finite(L, "inertanceMmHgSec2PerMl");
  if (L < 0) throw new Error("fixed inertance must be nonnegative");
  if (samples.length < 2) throw new Error("at least two accepted samples are required");
  for (const sample of samples) {
    finite(sample.acceptedTimeSec, "acceptedTimeSec");
    finite(sample.flowMlPerSec, "flowMlPerSec");
  }
  const intervals = samples.slice(1).map((end, index) => {
    const start = samples[index]!;
    const dtSec = end.acceptedTimeSec - start.acceptedTimeSec;
    finite(dtSec, "accepted interval dtSec");
    if (dtSec <= 0) throw new Error("accepted timestamps must be strictly increasing");
    const deltaQ = end.flowMlPerSec - start.flowMlPerSec;
    const accelerationMlPerSec2 = deltaQ / dtSec;
    const inertialPressureContributionMmHg = L === 0 || deltaQ === 0
      ? 0 : L * accelerationMlPerSec2;
    const kineticEnergyStartMmHgMl = 0.5 * L * start.flowMlPerSec ** 2;
    const kineticEnergyEndMmHgMl = 0.5 * L * end.flowMlPerSec ** 2;
    const backwardEulerNumericalDissipationMmHgMl = 0.5 * L * deltaQ ** 2;
    const backwardEulerPressureWorkMmHgMl = inertialPressureContributionMmHg === 0
      || end.flowMlPerSec === 0 ? 0
      : dtSec * inertialPressureContributionMmHg * end.flowMlPerSec;
    // h (L ΔQ/h) Q_end = Δ(1/2 L Q²) + 1/2 L (ΔQ)².
    const interval = {
      startTimeSec: start.acceptedTimeSec,
      endTimeSec: end.acceptedTimeSec,
      dtSec,
      startFlowMlPerSec: start.flowMlPerSec,
      endFlowMlPerSec: end.flowMlPerSec,
      accelerationMlPerSec2,
      inertialPressureContributionMmHg,
      kineticEnergyStartMmHgMl,
      kineticEnergyEndMmHgMl,
      backwardEulerNumericalDissipationMmHgMl,
      backwardEulerPressureWorkMmHgMl,
      backwardEulerEnergyBalanceResidualMmHgMl: backwardEulerPressureWorkMmHgMl
        - (kineticEnergyEndMmHgMl - kineticEnergyStartMmHgMl)
        - backwardEulerNumericalDissipationMmHgMl,
    };
    for (const [name, value] of Object.entries(interval)) finite(value, name);
    return Object.freeze(interval);
  });
  return Object.freeze({
    claim: MAIN_WIRE_PRESCRIBED_FLOW_MOMENTUM_CLAIM_V1,
    inertanceMmHgSec2PerMl,
    intervals: Object.freeze(intervals),
  });
}

export type MainWirePrescribedFlowMomentumV1 = ReturnType<
  typeof characterizePrescribedFlowMomentumV1
>;

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
