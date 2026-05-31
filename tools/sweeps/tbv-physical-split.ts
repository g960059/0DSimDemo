import { defaultParams } from "@/engine/ModelCore";
import { measureConverged } from "@/engine/measure";

console.warn = () => {};

const tbvs = (process.env.TBVS ?? "4800,5600,6200")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter((v) => Number.isFinite(v) && v > 0);

for (const targetTBV of tbvs) {
  const r = measureConverged(defaultParams(), {
    targetTBV,
    measureBeats: Number(process.env.BEATS ?? 3),
    sampleHz: Number(process.env.SAMPLE_HZ ?? 240),
    requireProjectorQuiet: false,
  });
  const o = r.core.debugObservables();
  console.log(JSON.stringify({
    tbv: targetTBV,
    settled: {
      ok: r.settleStatus.settled,
      reason: r.settleStatus.reason,
      seconds: Number(r.settleStatus.actualSeconds.toFixed(3)),
      beats: r.settleStatus.beats,
      worst: r.settleStatus.worstSignal,
      worstDelta: Number(r.settleStatus.worstDelta.toExponential(3)),
    },
    projectorQuiet: r.projectorQuiet,
    netCO: {
      left: Number(r.netCO_L.toFixed(3)),
      right: Number(r.netCO_R.toFixed(3)),
      diff: Number(r.netCODiffLMin.toFixed(4)),
    },
    forwardCO: {
      left: Number(r.forwardCO_L.toFixed(3)),
      right: Number(r.forwardCO_R.toFixed(3)),
      diff: Number(r.forwardCODiffLMin.toFixed(4)),
    },
    pressures: {
      LAP: Number(r.metrics.LAPMean.toFixed(3)),
      RAP: Number(r.metrics.RAPMean.toFixed(3)),
      gradient: Number((r.metrics.LAPMean - r.metrics.RAPMean).toFixed(3)),
      PVeinVC: Number(o.pVeinVcGradient.toFixed(3)),
    },
    atria: {
      LA: {
        max: Number(r.LA.volumeMax.toFixed(3)),
        min: Number(r.LA.volumeMin.toFixed(3)),
        ef: Number(r.LA.emptyingFraction.toFixed(3)),
        collapse: r.LA.collapse,
        intersections: r.LA.selfIntersections,
      },
      RA: {
        max: Number(r.RA.volumeMax.toFixed(3)),
        min: Number(r.RA.volumeMin.toFixed(3)),
        ef: Number(r.RA.emptyingFraction.toFixed(3)),
        collapse: r.RA.collapse,
        intersections: r.RA.selfIntersections,
      },
    },
    volumes: {
      pulmonaryVenous: Number(o.pulmonaryVenousVolume.toFixed(3)),
      pulmonaryVenousPct: Number((100 * o.pulmonaryVenousVolume / r.metrics.TBV).toFixed(2)),
      TBV: Number(r.metrics.TBV.toFixed(3)),
      driftMl: Number(r.tbvDriftMl.toFixed(6)),
      correctionPerBeat: Number(o.tbvCorrectionMagPerBeat.toFixed(6)),
      venousResidual: Number(r.venousBalances.maxResidualMl.toFixed(6)),
    },
    EF_R: Number(r.metrics.EF_RApprox.toFixed(3)),
    health: {
      status: r.health.status,
      clamps: r.health.clampHitCount,
      tbvDriftMl: Number(r.health.tbvDriftMl.toFixed(6)),
    },
  }));
}
