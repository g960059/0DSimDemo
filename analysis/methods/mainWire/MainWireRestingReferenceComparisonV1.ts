import type { MainWireIntegratedModelCompletedBeatMetricsV3 as Beat } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import { MAIN_WIRE_RESTING_REFERENCE_PROFILE_V1 as profile } from
  "@/analysis/registry/MainWireRestingReferenceProfileV1";
import { readMainWireBaselinePressureFlowV1 } from "./MainWireBaselinePressureFlowReadbackV1";

/** Additive same-beat research readback. No source interval becomes a mint gate,
 * no pass-count is returned, and no observed endpoint chooses a demographic.
 */
export function compareMainWireRestingReferencesV1(beat: Beat, bodySurfaceAreaM2: number) {
  const flow = readMainWireBaselinePressureFlowV1(beat, bodySurfaceAreaM2);
  if (bodySurfaceAreaM2 !== profile.subject.bodySurfaceAreaM2
    || !profile.subject.allowedHeartRatesBpm.some(hr => Math.abs(flow.heartRateBpm - hr) < 1e-7)) {
    throw new Error("Resting reference comparison requires declared BSA1.9 and HR60 or70");
  }
  const checked = (x: number, name: string) => {
    if (!Number.isFinite(x)) throw new Error(`Resting reference comparison: invalid ${name}`);
    return x;
  };
  const extrema = (node: "Ao" | "PA") => {
    const p = beat.pressureSummaries[node];
    const lower = checked(p.minimumMmHg, `${node} minimum`), upper = checked(p.maximumMmHg, `${node} maximum`);
    const mean = checked(p.timeWeightedMeanMmHg, `${node} mean`);
    if (!(lower <= mean && mean <= upper)) throw new Error(`Inconsistent ${node} pressure summary`);
    return { lower, upper };
  };
  const ao = extrema("Ao"), pa = extrema("PA");
  const volumes = (side: "left" | "right") => {
    const v = side === "left" ? beat.leftVentricularValveEventMetrics : beat.rightVentricularValveEventMetrics;
    const ed = v.endDiastolic, es = v.endSystolic;
    if (ed === null || es === null) return null;
    const inlet = side === "left" ? "MV" : "TV", outlet = side === "left" ? "AoV" : "PV";
    if (v.inletValveId !== inlet || v.semilunarValveId !== outlet
      || ed.valveId !== inlet || es.valveId !== outlet
      || ed.event !== "valve-closure-zero-flow-crossing" || es.event !== "valve-closure-zero-flow-crossing"
      || !(beat.startTimeSec <= ed.timeSec && ed.timeSec < es.timeSec && es.timeSec < beat.endTimeSec)
      || !(checked(ed.volumeMl, `${side} EDV`) > checked(es.volumeMl, `${side} ESV`) && es.volumeMl > 0)) {
      throw new Error(`Invalid ${side} native volume landmarks`);
    }
    // Derive all three from the same primitive landmarks, not redundant fields.
    return { edvi: ed.volumeMl / bodySurfaceAreaM2, esvi: es.volumeMl / bodySurfaceAreaM2,
      ef: (ed.volumeMl - es.volumeMl) / ed.volumeMl };
  };
  const lv = volumes("left"), rv = volumes("right");
  const et = (id: "AoV" | "PV") => {
    const value = checked(beat.valveForwardPressureGradients[id].forwardFlowDurationSec, `${id} forward duration`);
    if (!(value > 0 && value < beat.durationSec)) throw new Error(`Invalid ${id} forward duration`);
    return value;
  };
  const values: Record<string, number | null> = {
    "aortic-valve.ejection-time": et("AoV"), "pulmonary-valve.ejection-time": et("PV"),
    "aortic-pressure.maximum": ao.upper, "aortic-pressure.minimum": ao.lower,
    "central-venous-pressure.mean": flow.meanRaMmHg,
    "pulmonary-artery-pressure.maximum": pa.upper, "pulmonary-artery-pressure.minimum": pa.lower,
    "pulmonary-artery-pressure.mean": flow.meanPapMmHg, "pcwp-surrogate.mean": flow.meanLaMmHg,
    "left-ventricle.edv-index": lv?.edvi ?? null, "left-ventricle.esv-index": lv?.esvi ?? null,
    "left-ventricle.ejection-fraction": lv?.ef ?? null,
    "right-ventricle.edv-index": rv?.edvi ?? null, "right-ventricle.esv-index": rv?.esvi ?? null,
    "right-ventricle.ejection-fraction": rv?.ef ?? null,
    "systemic-net-flow.cardiac-index": flow.netCardiacIndexLPerMinPerM2,
    "systemic-net-flow.stroke-volume-index": flow.netStrokeVolumeIndexMlPerM2,
  };
  const entries = profile.entries.map(entry => {
    const actual = values[entry.metricId];
    if (actual === undefined) throw new Error(`Missing resting reference observation: ${entry.metricId}`);
    if (actual !== null) checked(actual, entry.metricId);
    return { ...entry, actual,
      observationStatus: actual === null ? "unavailable" as const : "observed" as const,
      comparisons: entry.comparisons.map(comparison => ({ ...comparison,
        // No physiologic epsilon, rounding, or candidate-dependent slack.
        status: actual === null ? "unavailable" as const
          : comparison.statistic === "clinical-upper-limit"
            ? actual <= comparison.range.upper! ? "not-above-source-upper-limit" as const : "above-source-upper-limit" as const
          : ((comparison.range.lower === null || actual >= comparison.range.lower)
            && (comparison.range.upper === null || actual <= comparison.range.upper))
            ? "inside-source-range" as const : "outside-source-range" as const,
      })),
    };
  });
  const ciRange = profile.entries.find(entry => entry.metricId === "systemic-net-flow.cardiac-index")!.comparisons[0]!.range;
  return {
    profileId: profile.profileId, scope: profile.scope, subject: profile.subject,
    startTimeSec: beat.startTimeSec, endTimeSec: beat.endTimeSec, heartRateBpm: flow.heartRateBpm,
    selectionRule: profile.selectionRule, entries,
    flowCoupling: {
      basis: "signed-native-AoV-net-flow" as const,
      ciMinusHrTimesSviOver1000: flow.netCardiacIndexLPerMinPerM2 - flow.heartRateBpm * flow.netStrokeVolumeIndexMlPerM2 / 1000,
      ciConditionalSviIntervalMlPerM2: { lower: ciRange.lower! * 1000 / flow.heartRateBpm,
        upper: ciRange.upper! * 1000 / flow.heartRateBpm },
      conditionalIntervalIsPublishedSviReference: false,
      forwardMinusNetCi: flow.forwardMinusNetCardiacIndexLPerMinPerM2,
      pulmonaryMinusAorticNetFlowLPerMin: flow.pulmonaryMinusSystemicNetFlowLPerMin,
    },
    nativeLvEndDiastolicPressure: flow.lvEndDiastolic,
    observationApplicabilityEstablished: false,
    applicabilityReview: "Caller must separately establish settlement, no support/shunt and correct pressure reference. This readback does not infer those conditions from a plausible scalar or small flow mismatch.",
    admissionDecision: "not-performed" as const,
    physiologicalNormalityClaimed: false,
  };
}
