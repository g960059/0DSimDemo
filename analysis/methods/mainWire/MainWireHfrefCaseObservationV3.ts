import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { observeMainWireValveCycleV3 as cycle } from "./MainWireValveCycleObservationV3";
import { readMainWireHfrefBeatV1 as readBeat } from "./MainWireHfrefObservationV1";
import { measureMainWireRelaxationTauV1 as measureTau, MAIN_WIRE_RELAXATION_TAU_POLICY_V1 as tauPolicy,
  type MainWireRelaxationTauTraceSampleV1 } from "./MainWireRelaxationTauV1";

export const MAIN_WIRE_HFREF_CASE_OBSERVATION_V3_ID = "main-wire-hfref-case-observation-v3";
type Sample = Parameters<typeof cycle>[0]["samples"][number] & MainWireRelaxationTauTraceSampleV1;

/** Independent side/timing/inflow availability. Numerical/native beat contracts
 * still fail closed; a contextual RV observation cannot erase valid LV data.
 * Review issues retain the result for diagnosis, not for automatic admission. */
export function observeMainWireHfrefCaseV3(completedBeat: Beat, samples: readonly Sample[]) {
  const raw = readBeat(completedBeat), valves = cycle({ samples, completedBeat });
  const left = valves.left.timing, right = valves.right.timing;
  const tau = left === null ? null : measureTau(samples, left.events);
  return { methodId: MAIN_WIRE_HFREF_CASE_OBSERVATION_V3_ID,
    values: { ...raw.values,
      etMs: completedBeat.valveForwardPressureGradients.AoV.forwardFlowDurationSec * 1000,
      ictMs: left === null ? null : left.timing.ictSec * 1000, irtMs: left === null ? null : left.timing.irtSec * 1000,
      tei: left?.timing.teiIndex ?? null, flowEToA: valves.left.inletFlow?.peakEToA ?? null,
      rvIctMs: right === null ? null : right.timing.ictSec * 1000, rvIrtMs: right === null ? null : right.timing.irtSec * 1000,
      rvTei: right?.timing.teiIndex ?? null, tricuspidFlowEToA: valves.right.inletFlow?.peakEToA ?? null,
      weissTauMs: tau?.status === "measured" ? tau.weiss?.tauMs ?? null : null,
      glantzTauMs: tau?.sensitivityStatus === "measured" ? tau.glantz?.tauMs ?? null : null },
    tau, relaxationWindowPressures: tau?.window ? {
      endPressureMmHg: tau.window.nextEdpMmHg + tauPolicy.endPressureAboveNextEdpMmHg,
      startPressureMmHg: tau.window.nextEdpMmHg + tauPolicy.endPressureAboveNextEdpMmHg + tau.window.pressureDropMmHg,
      basis: "end-EDP-plus-5-and-observed-window-pressure-drop" as const } : null,
    valves, measurementReview: { status: valves.reviewIssues.length ? "required" as const : "clear" as const, issues: valves.reviewIssues },
    pressureFlow: raw.flow, volumeBasis: "unchanged-native-first-inlet-and-outlet-closure" as const,
    waveformReview: "not-performed" as const, publicPromotionAuthorized: false as const };
}
