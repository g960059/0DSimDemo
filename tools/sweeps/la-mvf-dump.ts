import { measureConverged } from "@/engine/measure";
import { defaultParams } from "@/engine/ModelCore";
import type { SimSample } from "@/engine/protocol";

const dt = Number(process.env.DT ?? 0.001);
const sampleHz = Number(process.env.SAMPLE_HZ ?? 1000);
const measureBeats = Number(process.env.MEASURE_BEATS ?? 3);
const tbv = Number(process.env.TBV ?? 5600);

function beatWindow(samples: SimSample[]): SimSample[] {
  if (samples.length < 3) return samples;
  const finalBeat = Math.floor(samples.at(-1)!.phi);
  const targetBeat = finalBeat - 1;
  const start = samples.findIndex((s) => Math.floor(s.phi) === targetBeat);
  if (start < 0) return samples;
  const after = samples.findIndex((s, i) => i > start && Math.floor(s.phi) > targetBeat);
  return samples.slice(start, after >= 0 ? after + 1 : undefined);
}

const m = measureConverged(defaultParams(), { targetTBV: tbv, dt, sampleHz, measureBeats });
const beat = beatWindow(m.samples);
const phi0 = Math.floor(beat[0].phi);
const out = beat.map((s) => ({
  theta: s.phi - phi0,            // 0..1 within beat
  VLA: s.VLA, LAP: s.LAP, QMV: s.QMV,
  VLV: (s as any).VLV ?? null, LVP: (s as any).LVP ?? null,
}));
console.log(JSON.stringify({
  tbv,
  settleBeats: m.settleStatus.beats,
  LAPMean: m.metrics.LAPMean,
  beat: out,
}));
