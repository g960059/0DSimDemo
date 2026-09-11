import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { readMainWireRestingCaseBeatV1 as readBeat } from "./MainWireHfrefObservationV1";
import { observeMainWireValveCycleV3 as cycle } from "./MainWireValveCycleObservationV3";
import { observeMainWireAorticJetV1 as jet } from "./MainWireAorticJetObservationV1";
import { measureMainWireRelaxationTauV1 as tau, type MainWireRelaxationTauTraceSampleV1 } from "./MainWireRelaxationTauV1";
import { MAIN_WIRE_REFERENCE_BODY_SURFACE_AREA_M2_V1 as bsa } from "./MainWireReferenceIndexingV1";
export const MAIN_WIRE_AS_CASE_OBSERVATION_V1_ID = "main-wire-as-case-observation-v1";
type Sample = Parameters<typeof cycle>[0]["samples"][number] & Parameters<typeof jet>[1][number] & MainWireRelaxationTauTraceSampleV1;
export function observeMainWireAsCaseV1(completedBeat: Beat, samples: readonly Sample[]) {
  const raw = readBeat(completedBeat, { heartRateBpm: 70, bodySurfaceAreaM2: bsa });
  const aorticJet = jet(completedBeat, samples, bsa), valves = cycle({ samples, completedBeat });
  const left = valves.left.timing, relaxation = left ? tau(samples, left.events) : null;
  return { methodId: MAIN_WIRE_AS_CASE_OBSERVATION_V1_ID, values: { ...raw.values, ...aorticJet.values,
    etMs: aorticJet.forwardFlowDurationSec * 1000,
    ictMs: left ? left.timing.ictSec * 1000 : null, irtMs: left ? left.timing.irtSec * 1000 : null,
    tei: left?.timing.teiIndex ?? null, flowEToA: valves.left.inletFlow?.peakEToA ?? null,
    weissTauMs: relaxation?.status === "measured" ? relaxation.weiss?.tauMs ?? null : null },
    aorticJet, valves, tau: relaxation, pressureFlow: raw.flow,
    measurementReview: { status: valves.reviewIssues.length ? "required" as const : "clear" as const, issues: valves.reviewIssues },
    waveformReview: "not-performed" as const, publicPromotionAuthorized: false as const };
}
