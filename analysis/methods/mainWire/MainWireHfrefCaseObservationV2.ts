import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { observeMainWireVentricularValveTimingV2 as valveTiming,
  MainWireBaselineObservationUnavailableErrorV2 } from "./MainWireBaselineObservationV2";
import { readMainWireHfrefBeatV1 as readBeat,
  observeMainWireHfrefTimingContextV1 as inflowContext } from "./MainWireHfrefObservationV1";
import { measureMainWireRelaxationTauV1 as measureTau,
  MAIN_WIRE_RELAXATION_TAU_POLICY_V1 as tauPolicy,
  type MainWireRelaxationTauTraceSampleV1 } from "./MainWireRelaxationTauV1";

export const MAIN_WIRE_HFREF_CASE_OBSERVATION_V2_ID = "main-wire-hfref-case-observation-v2";
type Sample = Parameters<typeof valveTiming>[0]["samples"][number] & MainWireRelaxationTauTraceSampleV1;

/** A contextual E/A failure does not erase LV timing or its pressure-decay fit.
 * Malformed raw data and invalid native closures still throw. */
export function observeMainWireHfrefCaseV2(completedBeat: Beat, samples: readonly Sample[]) {
  const raw = readBeat(completedBeat), inflow = inflowContext(samples, completedBeat);
  let left: ReturnType<typeof valveTiming> | null = null, timingIssue: string | null = null;
  try { left = valveTiming({ samples, completedBeat, side: "left" }); }
  catch (error) {
    if (!(error instanceof MainWireBaselineObservationUnavailableErrorV2)
      || error.code !== "incomplete-filling-phase") throw error;
    timingIssue = error.message;
  }
  const tau = left === null ? null : measureTau(samples, left.events);
  return { methodId: MAIN_WIRE_HFREF_CASE_OBSERVATION_V2_ID,
    values: { ...raw.values,
      etMs: completedBeat.valveForwardPressureGradients.AoV.forwardFlowDurationSec * 1000,
      ictMs: left === null ? null : left.timing.ictSec * 1000,
      irtMs: left === null ? null : left.timing.irtSec * 1000,
      tei: left?.timing.teiIndex ?? null, flowEToA: inflow.observation?.left.inletFlow.peakEToA ?? null,
      weissTauMs: tau?.status === "measured" ? tau.weiss?.tauMs ?? null : null,
      glantzTauMs: tau?.sensitivityStatus === "measured" ? tau.glantz?.tauMs ?? null : null },
    tau, relaxationWindowPressures: tau?.window ? {
      endPressureMmHg: tau.window.nextEdpMmHg + tauPolicy.endPressureAboveNextEdpMmHg,
      startPressureMmHg: tau.window.nextEdpMmHg + tauPolicy.endPressureAboveNextEdpMmHg + tau.window.pressureDropMmHg,
      basis: "end-EDP-plus-5-and-observed-window-pressure-drop" as const,
    } : null,
    timing: left, timingIssue, inflow, pressureFlow: raw.flow,
    waveformReview: "not-performed" as const, publicPromotionAuthorized: false as const };
}
