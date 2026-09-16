import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Illustration only: an isolated time-varying elastance + resistive valves +
// two-element Windkessel. This is NOT an exact model/Surface or a saved Snapshot.
// Generate the four fixed, warmed-up beats offline. No numerical solver runs on
// the Home request or in the visitor's browser, and no settling is implied by UI.
export function generateHeroDemoV1() {
  const dt = 0.001,
    period = 0.8,
    n = 800;
  const activation = Array.from({ length: n }, (_, i) => {
    const t = i * dt;
    const a = (t / (0.269 * period)) ** 1.32;
    return a / (1 + a) / (1 + (t / (0.452 * period)) ** 21.9);
  });
  const peak = Math.max(...activation);
  activation.forEach((a, i) => (activation[i] = a / peak));
  return [
    { id: "baseline", preload: 8, resistance: 1, ees: 2 },
    { id: "contractility", preload: 8, resistance: 1, ees: 1.2 },
    { id: "afterload", preload: 8, resistance: 1.6, ees: 2 },
    { id: "preload", preload: 12, resistance: 1, ees: 2 },
  ].map((p) => {
    let volume = 125,
      atrialVolume = 60,
      aorticPressure = 80;
    const points: number[][] = [];
    for (let beat = 0; beat < 40; beat++)
      for (let i = 0; i < n; i++) {
        const a = activation[i];
        const pressure =
          a * p.ees * (volume - 10) +
          (1 - a) * 0.16 * (Math.exp(0.028 * (volume - 10)) - 1);
        const atrialPressure = Math.max(0, (atrialVolume - 20) / 8);
        const mitralFlow = Math.max(0, (atrialPressure - pressure) / 0.006);
        const aorticFlow = Math.max(0, (pressure - aorticPressure) / 0.008);
        if (beat === 39 && i % 8 === 0)
          points.push(
            [i * dt, volume, pressure, aorticPressure, atrialPressure].map(
              (v) => Math.round(v * 100) / 100,
            ),
          );
        volume += (mitralFlow - aorticFlow) * dt;
        atrialVolume += ((p.preload - atrialPressure) / 0.03 - mitralFlow) * dt;
        aorticPressure +=
          ((aorticFlow - (aorticPressure - p.preload) / p.resistance) / 1.4) *
          dt;
      }
    const edv = Math.max(...points.map((v) => v[1])),
      esv = Math.min(...points.map((v) => v[1]));
    return {
      ...p,
      period,
      points,
      strokeVolume: Math.round(edv - esv),
      ejectionFraction: Math.round(((edv - esv) / edv) * 100),
    };
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  writeFileSync(
    new URL("../../components/home/HomeHeroBeatsV1.json", import.meta.url),
    JSON.stringify(generateHeroDemoV1()) + "\n",
  );
