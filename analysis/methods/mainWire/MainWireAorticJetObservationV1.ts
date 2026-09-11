import { forwardPressureGradientIncrementV3 as integrateForward,
  type MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 as rho,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2 as paPerMmHg } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import { MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 as valves } from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { MainWireBaselineObservationUnavailableErrorV2 } from "./MainWireBaselineObservationV2";

export const MAIN_WIRE_AORTIC_JET_OBSERVATION_V1_ID = "main-wire-quasi-steady-aortic-jet-observation-v1";
const resistance = valves.valves.AoV.backgroundLinearResistanceMmHgSecPerMl;
const k = rho / (2 * paPerMmHg);
type Sample = { acceptedTimeSec: number; acceptedDtSec: number;
  absolutePressureMmHg: { LV: number; Ao: number }; valveFlowMlPerSec: { AoV: number } };
type JetWindow = Pick<Beat, "startTimeSec" | "endTimeSec"> & {
  valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: number } };
  valveFlowVolumes: { AoV: { forwardVolumeMl: number } };
};

/** Only for the current quasi-steady orifice law with its fixed R_bg. EOA
 * already includes contraction; do not add a second discharge coefficient.
 * Not valid for an inertial/recovered-root valve construction. */
export function mainWireAorticJetVelocityV1(lvMmHg: number, aoMmHg: number, forwardFlowMlPerSec: number) {
  if (![lvMmHg, aoMmHg, forwardFlowMlPerSec].every(Number.isFinite)) throw new Error("Nonfinite aortic jet input");
  if (forwardFlowMlPerSec <= 0) return 0;
  const loss = lvMmHg - aoMmHg - resistance * forwardFlowMlPerSec;
  if (loss < -1e-6) throw new Error("Pressure/flow violates the quasi-steady aortic jet law");
  return Math.sqrt(Math.max(0, loss) / k);
}

/** Native endpoints and real dt; linear positive-flow clipping. Integrate the
 * endpoint-derived 4v², not 4(mean v)² and not peak-to-peak LV/Ao pressure.
 * This is a model-equivalent jet, not a simulated Doppler acquisition. */
export function observeMainWireAorticJetV1(beat: JetWindow, samples: readonly Sample[], bsa?: number) {
  if (bsa !== undefined && (!(bsa > 0) || !Number.isFinite(bsa)) || samples.length < 3
    || samples[0]!.acceptedTimeSec > beat.startTimeSec || samples.at(-1)!.acceptedTimeSec < beat.endTimeSec)
    throw new Error("Aortic jet needs a complete native beat and BSA");
  let duration = 0, integral = 0, vtiCm = 0, peak = 0, peakTime = 0, opening: number | null = null, episodes = 0;
  const points: { timeSec: number; velocityMPerSec: number; bernoulliMmHg: number }[] = [];
  const sampleAt = (a: Sample, b: Sample, t: number) => {
    const f = (t - a.acceptedTimeSec) / (b.acceptedTimeSec - a.acceptedTimeSec);
    const lerp = (x: number, y: number) => x + f * (y - x);
    const q = lerp(a.valveFlowMlPerSec.AoV, b.valveFlowMlPerSec.AoV);
    const v = mainWireAorticJetVelocityV1(lerp(a.absolutePressureMmHg.LV, b.absolutePressureMmHg.LV),
      lerp(a.absolutePressureMmHg.Ao, b.absolutePressureMmHg.Ao), q);
    return { q, v, t };
  };
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!, b = samples[i]!;
    if (!(b.acceptedDtSec > 0) || Math.abs(b.acceptedTimeSec - a.acceptedTimeSec - b.acceptedDtSec) > 1e-8)
      throw new Error("Aortic jet trace is not native and contiguous");
    const lo = Math.max(a.acceptedTimeSec, beat.startTimeSec), hi = Math.min(b.acceptedTimeSec, beat.endTimeSec);
    if (!(hi > lo)) continue;
    const x = sampleAt(a, b, lo), y = sampleAt(a, b, hi), dt = hi - lo;
    if (x.q <= 0 && y.q > 0) { episodes++; opening ??= lo + dt * x.q / (x.q - y.q); }
    const g = integrateForward(x.q, y.q, 4 * x.v ** 2, 4 * y.v ** 2, dt);
    duration += g.forwardFlowDurationSec; integral += g.pressureIntegralMmHgSec;
    vtiCm += integrateForward(x.q, y.q, 100 * x.v, 100 * y.v, dt).pressureIntegralMmHgSec;
    for (const p of [x, y]) if (p.q > 0 && p.v > peak) { peak = p.v; peakTime = p.t; }
    points.push({ timeSec: hi, velocityMPerSec: y.v, bernoulliMmHg: 4 * y.v ** 2 });
  }
  if (!(duration > 0 && peak > 0 && vtiCm > 0) || opening === null || episodes !== 1
    || Math.abs(duration - beat.valveForwardPressureGradients.AoV.forwardFlowDurationSec) > 1e-8)
    throw new MainWireBaselineObservationUnavailableErrorV2("incomplete-ejection", "left", "Aortic jet requires one complete native forward-flow episode");
  const forwardVolumeMl = beat.valveFlowVolumes.AoV.forwardVolumeMl;
  return { methodId: MAIN_WIRE_AORTIC_JET_OBSERVATION_V1_ID, values: {
    avVmax: peak, avBernoulliMeanGradient: integral / duration, avBernoulliPeakGradient: 4 * peak ** 2,
    avVtiCm: vtiCm, avEffectiveAreaCm2: forwardVolumeMl / vtiCm, forwardSvi: bsa === undefined ? null : forwardVolumeMl / bsa,
    avAccelerationTimeMs: (peakTime - opening) * 1000, avAtEt: (peakTime - opening) / duration,
    meanEjectionFlowMlPerSec: forwardVolumeMl / duration,
  }, openingTimeSec: opening, peakTimeSec: peakTime, forwardFlowDurationSec: duration, points,
    convention: "native endpoint quadrature; current fixed-R quasi-steady EOA jet; simplified 4v²; no LVOT velocity correction, pressure recovery, Doppler beam or spatial waveform",
    dependencies: "peak gradient=4 Vmax²; SV/VTI area derives from the same model law, not independent planimetry; CI=HR*net SVI/1000" };
}
