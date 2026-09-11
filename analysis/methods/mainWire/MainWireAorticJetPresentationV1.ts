import { buildMainWireCardiacCycleMetricsV1 as cycle, MAIN_WIRE_CARDIAC_CYCLE_REQUIRED_EXACT_OUTPUT_IDS_V1 as cycleIds,
  type MainWireCardiacCycleAcceptedSampleV1 as Sample } from "./MainWireCardiacCycleMetricsV1";
import { observeMainWireAorticJetV1 as jet } from "./MainWireAorticJetObservationV1";
import { MAIN_WIRE_REFERENCE_BODY_SURFACE_AREA_M2_V1 as bsa } from "./MainWireReferenceIndexingV1";
export const MAIN_WIRE_AORTIC_JET_PRESENTATION_V1_ID = "main-wire-quasi-steady-aortic-jet-presentation-2ms-bsa1p9-v1";
export const MAIN_WIRE_AORTIC_JET_PRESENTATION_INPUTS_V1 = Object.freeze([...cycleIds, "hemodynamics.pressure.absolute.Ao"]);
export const MAIN_WIRE_AORTIC_JET_PRESENTATION_OUTPUTS_V1 = Object.freeze([
  { key: "avVmax", outputId: "hemodynamics.velocity.peak-quasi-steady-jet.AoV", unit: "m/s" },
  { key: "avBernoulliMeanGradient", outputId: "hemodynamics.pressure-gradient.mean-bernoulli-jet.AoV", unit: "mmHg" },
  { key: "avBernoulliPeakGradient", outputId: "hemodynamics.pressure-gradient.peak-bernoulli-jet.AoV", unit: "mmHg" },
  { key: "avAccelerationTimeMs", outputId: "hemodynamics.duration.jet-acceleration.AoV", unit: "ms" },
  { key: "avAtEt", outputId: "hemodynamics.ratio.jet-AT-to-ET.AoV", unit: "1" },
  { key: "avEffectiveAreaCm2", outputId: "hemodynamics.area.forward-SV-over-jet-VTI.AoV", unit: "cm²" },
  { key: "meanEjectionFlowMlPerSec", outputId: "hemodynamics.flow.mean-ejection.AoV", unit: "mL/s" },
  { key: "forwardSvi", outputId: "hemodynamics.stroke-volume-index.forward.AoV-reference-bsa1p9", unit: "mL/m²" },
] as const);

/** Beat-rate observer of every 2-ms presentation endpoint, not a native-step
 * qualification and not an additional simulation. Individual output selection
 * controls whether the existing Worker instantiates this collector at all. */
export function buildMainWireAorticJetPresentationV1(samples: readonly Sample[]) {
  const methodId = MAIN_WIRE_AORTIC_JET_PRESENTATION_V1_ID;
  const unavailable = (reason: string) => ({ methodId, status: "unavailable" as const, reason,
    values: Object.fromEntries(MAIN_WIRE_AORTIC_JET_PRESENTATION_OUTPUTS_V1.map(o => [o.outputId, null])) });
  const c = cycle(samples);
  if (c.status !== "available") return unavailable(c.reason);
  if (c.aorticEjection.additionalForwardEpisodeCount !== 0) return unavailable("aortic-jet-needs-one-forward-episode");
  try {
    const read = (s: Sample, id: string) => {
      const v = s.values[id]; if (v == null || !Number.isFinite(v)) throw new Error("missing-jet-pressure-or-flow"); return v;
    };
    const observed = jet({ startTimeSec: c.source.cycleStartTimeSec, endTimeSec: c.source.cycleEndTimeSec,
      valveForwardPressureGradients: { AoV: { forwardFlowDurationSec: c.aorticEjection.positiveFlowDurationSec } },
      valveFlowVolumes: { AoV: { forwardVolumeMl: c.aorticEjection.forwardVolumeMl } } },
    samples.map(s => ({ acceptedTimeSec: s.acceptedTimeSec, acceptedDtSec: .002,
      absolutePressureMmHg: { LV: read(s, "hemodynamics.pressure.absolute.LV"), Ao: read(s, "hemodynamics.pressure.absolute.Ao") },
      valveFlowMlPerSec: { AoV: read(s, "hemodynamics.flow.valve.AoV") } })), bsa);
    return { methodId, status: "available" as const, source: { ...c.source, bodySurfaceAreaM2: bsa },
      values: Object.fromEntries(MAIN_WIRE_AORTIC_JET_PRESENTATION_OUTPUTS_V1.map(o => [o.outputId, observed.values[o.key]])),
      // Additive presentation payload; same observation, no new solver or
      // changed scalar definition. Keep native presentation points unsmoothed.
      cycleWaveform: { schemaId: "completed-ejection-waveform-v1", unit: "m/s",
        durationMs: observed.forwardFlowDurationSec * 1000,
        peakTimeMs: observed.values.avAccelerationTimeMs,
        points: [[0, 0], ...observed.points.filter(p => p.timeSec > observed.openingTimeSec
          && p.timeSec < observed.openingTimeSec + observed.forwardFlowDurationSec)
          .map(p => [(p.timeSec - observed.openingTimeSec) * 1000, p.velocityMPerSec]),
          [observed.forwardFlowDurationSec * 1000, 0]] },
      limitations: ["2ms-presentation-endpoints-not-native-substeps", "current-quasi-steady-valve-only", "model-equivalent-jet-not-Doppler-acquisition",
        "no-LVOT-inlet-velocity-correction-or-pressure-recovery", "SV-over-VTI-is-not-independent-of-model-EOA", "not-clinical-validation"] };
  } catch (error) { return unavailable(error instanceof Error ? error.message : "aortic-jet-observation-unavailable"); }
}
