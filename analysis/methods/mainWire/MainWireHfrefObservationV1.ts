import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import type { executeMainWireStandard72FittingCandidateV1 as evaluate } from "./MainWireStandard72BaselineCalibrationEvaluatorV1";
import { readMainWireBaselinePressureFlowV1 as readFlow } from "./MainWireBaselinePressureFlowReadbackV1";
import { observeMainWireBaselineV2 as observe, MainWireBaselineObservationUnavailableErrorV2 } from "./MainWireBaselineObservationV2";
import { measureMainWireRelaxationTauV1 as measureTau } from "./MainWireRelaxationTauV1";
import { measureMainWireIntegratedModelStandard70CandidateEvidenceV1 as measure } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import { observeMainWireStandard70TimingAndInletV2 as timing } from "./MainWireStandard70BaselineAssessmentV2";
import { MAIN_WIRE_HFREF_REFERENCE_V1 as reference } from "@/analysis/policies/mainWire/MainWireHfrefReferenceV1";
import { canonicalJsonStringify } from "@/engine/integrity";

type Accepted = Extract<Awaited<ReturnType<typeof evaluate>>, { status: "accepted" }>;
export const MAIN_WIRE_HFREF_OBSERVATION_V1_ID = "main-wire-hfref-observation-v1";

/** Uses native valve-closure volumes, not source-cohort means or fitted Ees.
 * Keep that convention visible: imaging extrema need not coincide exactly. */
export function readMainWireHfrefBeatV1(beat: Beat) {
  const bsa = reference.scope.bodySurfaceAreaM2;
  const flow = readFlow(beat, bsa);
  if (Math.abs(flow.heartRateBpm - reference.scope.heartRateBpm) >= 1e-7) throw new Error("HFrEF reference requires HR70");
  const volume = (side: "left" | "right") => {
    const v = side === "left" ? beat.leftVentricularValveEventMetrics : beat.rightVentricularValveEventMetrics;
    const ed = v.endDiastolic, es = v.endSystolic;
    const inlet = side === "left" ? "MV" : "TV", outlet = side === "left" ? "AoV" : "PV";
    if (!ed || !es || ed.valveId !== inlet || es.valveId !== outlet
      || ed.event !== "valve-closure-zero-flow-crossing" || es.event !== "valve-closure-zero-flow-crossing"
      || ![ed.volumeMl, es.volumeMl, ed.timeSec, es.timeSec].every(Number.isFinite)
      || !(ed.volumeMl > es.volumeMl && es.volumeMl > 0)
      || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec)) {
      throw new Error("HFrEF observation requires ordered native valve-closure volumes");
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
  if (Object.values(values).some(v => v === null || !Number.isFinite(v))) throw new Error("HFrEF beat observation is missing or nonfinite");
  return { values, flow };
}

export function observeMainWireHfrefV1(e: Accepted) {
  const d = e.diagnostics;
  if (!d || d.terminalTrace.length < 3 || !d.allOffAndOwnerClocksCheckedEveryStep
    || e.classification.status !== "period1-converged"
    || d.terminalTrace.at(-1)!.acceptedTimeSec !== e.checkpoint.acceptedTimeSec
    || canonicalJsonStringify(d.completedBeat) !== canonicalJsonStringify(e.checkpoint.baseStandardCheckpointV2.completedBeatMetrics)
    || !(d.completedBeat.endTimeSec <= e.checkpoint.acceptedTimeSec
      && e.checkpoint.acceptedTimeSec - d.completedBeat.endTimeSec < d.completedBeat.durationSec)) {
    throw new Error("HFrEF assessment requires fresh exact terminal evidence");
  }
  const raw = readMainWireHfrefBeatV1(d.completedBeat);
  const samples = d.timingAndInletTrace ?? d.terminalTrace;
  const context = observeMainWireHfrefTimingContextV1(samples, d.completedBeat);
  const observation = context.observation;
  const tau = observation === null ? null : measureTau(samples, observation.left.events);
  const measured = observation === null ? null : measure({ ...d, timingAndInletObserver: timing });
  return {
    methodId: MAIN_WIRE_HFREF_OBSERVATION_V1_ID,
    values: { ...raw.values, etMs: d.completedBeat.valveForwardPressureGradients.AoV.forwardFlowDurationSec * 1000,
      ictMs: observation === null ? null : observation.left.timing.ictSec * 1000,
      irtMs: observation === null ? null : observation.left.timing.irtSec * 1000,
      tei: observation?.left.timing.teiIndex ?? null, flowEToA: observation?.left.inletFlow.peakEToA ?? null,
      weissTauMs: tau?.status === "measured" ? tau.weiss?.tauMs ?? null : null,
      glantzTauMs: tau?.sensitivityStatus === "measured" ? tau.glantz?.tauMs ?? null : null },
    gradientBasis: "hydraulic-upstream-minus-downstream-during-forward-flow-NOT-Doppler-or-Bernoulli",
    timingAndInlet: context, pressureFlow: raw.flow, tau,
    measuredMorphology: measured,
    healthyReferenceAssessed: false,
    unmeasured: ["formalEspvr", "formalPva", "decelerationTime", "tissueDoppler"],
    waveformReview: "pending", numericalQuality: "periodic-rest-only-cold-and-half-step-pending",
  };
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
