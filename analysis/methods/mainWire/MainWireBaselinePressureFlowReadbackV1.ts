import type { MainWireIntegratedModelCompletedBeatMetricsV3 } from
  "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";

export const MAIN_WIRE_BASELINE_PRESSURE_FLOW_READBACK_V1_ID =
  "main-wire-baseline-pressure-flow-readback-v1" as const;

/** Same-beat analysis only; no solver, normality threshold or admission vote.
 * Pressure-drop/flow quotients are descriptive effective loads, not identified
 * primitive resistances. LA mean is not measured PAWP and PVein is not a wedge.
 */
export function readMainWireBaselinePressureFlowV1(
  beat: MainWireIntegratedModelCompletedBeatMetricsV3,
  bodySurfaceAreaM2: number,
) {
  const finite = (value: number, name: string) => {
    if (!Number.isFinite(value)) throw new Error(`pressure-flow readback: invalid ${name}`);
    return value;
  };
  const positive = (value: number, name: string) => {
    if (!(finite(value, name) > 0)) throw new Error(`pressure-flow readback: nonpositive ${name}`);
    return value;
  };
  const durationSec = positive(beat.durationSec, "beat duration");
  const bsa = positive(bodySurfaceAreaM2, "BSA");
  const startTimeSec = finite(beat.startTimeSec, "beat start");
  const endTimeSec = finite(beat.endTimeSec, "beat end");
  if (Math.abs(endTimeSec - startTimeSec - durationSec) > 1e-8) {
    throw new Error("pressure-flow readback: inconsistent beat clock");
  }
  const mean = (node: "PA" | "PVein" | "LA" | "RA") =>
    finite(beat.pressureSummaries[node].timeWeightedMeanMmHg, `${node} mean`);
  const flow = (valve: "AoV" | "PV") => {
    const v = beat.valveFlowVolumes[valve];
    const forwardVolumeMl = finite(v.forwardVolumeMl, `${valve} forward volume`);
    const reverseVolumeMl = finite(v.reverseVolumeMl, `${valve} reverse volume`);
    const netVolumeMl = finite(v.netVolumeMl, `${valve} net volume`);
    if (forwardVolumeMl < 0 || reverseVolumeMl < 0
      || Math.abs(forwardVolumeMl - reverseVolumeMl - netVolumeMl) > 1e-7) {
      throw new Error(`pressure-flow readback: inconsistent ${valve} volumes`);
    }
    return { forwardVolumeMl, reverseVolumeMl, netVolumeMl,
      netLPerMin: netVolumeMl * 0.06 / durationSec,
      forwardLPerMin: forwardVolumeMl * 0.06 / durationSec };
  };
  const aortic = flow("AoV"), pulmonary = flow("PV");
  const meanPapMmHg = mean("PA"), meanPulmonaryVenousMmHg = mean("PVein");
  const meanLaMmHg = mean("LA"), meanRaMmHg = mean("RA");
  const quotient = (drop: number) => pulmonary.netLPerMin > 0
    ? finite(drop / pulmonary.netLPerMin, "effective pulmonary load") : null;
  const ed = beat.leftVentricularValveEventMetrics.endDiastolic;
  // Missing closure remains missing, never substituted by a pressure maximum.
  const lvEndDiastolic = ed === null ? null : (() => {
    if (ed.valveId !== "MV" || ed.event !== "valve-closure-zero-flow-crossing"
      || !(finite(ed.timeSec, "LV ED time") >= startTimeSec && ed.timeSec < endTimeSec)) {
      throw new Error("pressure-flow readback: invalid LV inlet-closure event");
    }
    const absolutePressureMmHg = finite(ed.absolutePressureMmHg, "LV EDP");
    const transmuralPressureMmHg = finite(ed.transmuralPressureMmHg, "LV transmural EDP");
    return { timeSec: ed.timeSec, absolutePressureMmHg, transmuralPressureMmHg,
      externalPressureMmHg: absolutePressureMmHg - transmuralPressureMmHg,
      differenceFromMeanLaMmHg: absolutePressureMmHg - meanLaMmHg };
  })();
  return {
    methodId: MAIN_WIRE_BASELINE_PRESSURE_FLOW_READBACK_V1_ID,
    basis: "same-completed-beat-intracavitary-pressure-and-signed-native-valve-flow" as const,
    startTimeSec, endTimeSec, bodySurfaceAreaM2: bsa, heartRateBpm: 60 / durationSec,
    meanPapMmHg, meanPulmonaryVenousMmHg, meanLaMmHg, meanRaMmHg,
    lvEndDiastolic, aortic, pulmonary,
    netCardiacIndexLPerMinPerM2: aortic.netLPerMin / bsa,
    netStrokeVolumeIndexMlPerM2: aortic.netVolumeMl / bsa,
    forwardMinusNetCardiacIndexLPerMinPerM2: (aortic.forwardLPerMin - aortic.netLPerMin) / bsa,
    pulmonaryMinusSystemicNetFlowLPerMin: pulmonary.netLPerMin - aortic.netLPerMin,
    effectivePulmonaryLoadWU: {
      paToPulmonaryVein: quotient(meanPapMmHg - meanPulmonaryVenousMmHg),
      pulmonaryVeinToLa: quotient(meanPulmonaryVenousMmHg - meanLaMmHg),
      paToLa: quotient(meanPapMmHg - meanLaMmHg),
    },
    applicability: "At a settled unassisted nonshunting baseline, signed pulmonary flow supports an effective PA-to-LA load comparison. Finite beat storage, shunts and support invalidate primitive-resistance inference. No respiratory zero or wedged catheter is simulated.",
    physiologicalNormalityClaimed: false as const,
  };
}
