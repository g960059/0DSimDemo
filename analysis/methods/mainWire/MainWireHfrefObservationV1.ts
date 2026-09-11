import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { readMainWireBaselinePressureFlowV1 as readFlow } from "./MainWireBaselinePressureFlowReadbackV1";
import { observeMainWireBaselineV2 as observe, MainWireBaselineObservationUnavailableErrorV2 } from "./MainWireBaselineObservationV2";
import { MAIN_WIRE_HFREF_REFERENCE_V1 as reference } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";


/** Uses native valve-closure volumes, not source-cohort means or fitted Ees.
 * Keep that convention visible: imaging extrema need not coincide exactly. */
export function readMainWireHfrefBeatV1(beat: Beat) {
  return readMainWireRestingCaseBeatV1(beat, reference.scope);
}

/** Shared native measurements; no disease criteria or cohort targets. */
export function readMainWireRestingCaseBeatV1(beat: Beat, scope: { bodySurfaceAreaM2: number; heartRateBpm: number }) {
  const bsa = scope.bodySurfaceAreaM2;
  const flow = readFlow(beat, bsa);
  if (Math.abs(flow.heartRateBpm - scope.heartRateBpm) >= 1e-7) throw new Error("Resting observation HR differs from its reference scope");
  const volume = (side: "left" | "right") => {
    const v = side === "left" ? beat.leftVentricularValveEventMetrics : beat.rightVentricularValveEventMetrics;
    const ed = v.endDiastolic, es = v.endSystolic;
    const inlet = side === "left" ? "MV" : "TV", outlet = side === "left" ? "AoV" : "PV";
    if (!ed || !es || ed.valveId !== inlet || es.valveId !== outlet
      || ed.event !== "valve-closure-zero-flow-crossing" || es.event !== "valve-closure-zero-flow-crossing"
      || ![ed.volumeMl, es.volumeMl, ed.timeSec, es.timeSec].every(Number.isFinite)
      || !(ed.volumeMl > es.volumeMl && es.volumeMl > 0)
      || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec)) {
      throw new Error("Resting observation requires ordered native valve-closure volumes");
    }
    return { edvi: ed.volumeMl / bsa, esvi: es.volumeMl / bsa, ef: 1 - es.volumeMl / ed.volumeMl };
  };
  const lv = volume("left"), rv = volume("right");
  const gradient = beat.valveForwardPressureGradients.AoV;
  const values = {
    lvef: lv.ef, lvedvi: lv.edvi, lvesvi: lv.esvi, rvef: rv.ef, rvedvi: rv.edvi, rvesvi: rv.esvi,
    ci: flow.netCardiacIndexLPerMinPerM2, svi: flow.netStrokeVolumeIndexMlPerM2,
    meanLa: flow.meanLaMmHg, meanRa: flow.meanRaMmHg, meanPap: flow.meanPapMmHg,
    meanAo: beat.pressureSummaries.Ao.timeWeightedMeanMmHg,
    aoNodePeak: beat.pressureSummaries.Ao.maximumMmHg, aoNodeMinimum: beat.pressureSummaries.Ao.minimumMmHg,
    nativeLvEndFillingPressure: flow.lvEndDiastolic?.absolutePressureMmHg ?? null,
    nativeLvEndFillingTransmuralPressure: flow.lvEndDiastolic?.transmuralPressureMmHg ?? null,
    avMeanGradient: gradient.timeWeightedMeanMmHg, avPeakGradient: gradient.peakMmHg,
    positiveDpDt: beat.ventricularAbsolutePressureRateExtrema.LV.maximumMmHgPerSec,
    negativeDpDt: beat.ventricularAbsolutePressureRateExtrema.LV.minimumMmHgPerSec,
    lvTransmuralStrokeWorkJPerM2: beat.leftVentricularTransmuralPressureVolumePathWorkMmHgMl * 0.000133322387415 / bsa,
    ciMinusHrTimesEfEdvi: flow.netCardiacIndexLPerMinPerM2 - flow.heartRateBpm * lv.ef * lv.edvi / 1000,
    pulmonaryMinusAorticNetFlowLPerMin: flow.pulmonaryMinusSystemicNetFlowLPerMin,
  };
  if (Object.values(values).some(v => v === null || !Number.isFinite(v))) throw new Error("Resting beat observation is missing or nonfinite");
  return { values, flow };
}

/** Unresolved E/A is a contextual measurement failure, not failed circulation.
 * Malformed traces, missing capture identity and missing native closures remain
 * errors; do not catch arbitrary engine failures as a physiological warning. */
export function observeMainWireHfrefTimingContextV1(samples: Parameters<typeof observe>[0]["samples"], completedBeat: Beat) {
  try { return { observation: observe({ samples, completedBeat }), issue: null }; }
  catch (error) {
    if (!(error instanceof MainWireBaselineObservationUnavailableErrorV2)
      || !["unresolved-e-wave", "unresolved-a-wave", "incomplete-filling-phase"].includes(error.code)) throw error;
    return { observation: null, issue: { code: error.code, message: error.message } };
  }
}
