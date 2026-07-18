import { runMainWireNormalAdultFiveWallClosedLoopV1 } from
  "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";

const dtSec = numericArgument("--dt", 0.002);
const beatCount = integerArgument("--beats", 4);
const result = runMainWireNormalAdultFiveWallClosedLoopV1({
  mode: "canonical",
  dtSec,
  beatCount,
});
if (!result.completed) {
  throw new Error(result.failure?.message ?? "main-wire run did not complete");
}
const finalBeatStartSec = beatCount - 1;
const samples = result.samples.filter((sample) =>
  sample.timeSec > finalBeatStartSec + 1e-12);
const wallIds = ["LVFW", "SEP", "RVFW"] as const;
const peakActiveStressPa = Object.fromEntries(wallIds.map((wallId) => [
  wallId,
  Math.max(...samples.map((sample) => sample.wallStressPa[wallId].active)),
]));
const peakLvpMmHg = Math.max(...samples.map((sample) =>
  sample.chamberTransmuralPressureMmHg.LV));
const peakRvpMmHg = Math.max(...samples.map((sample) =>
  sample.chamberTransmuralPressureMmHg.RV));
const pascalPerMmHg = 133.322;
const gammaForTwentyPercentLvPeak =
  0.20 * peakLvpMmHg * pascalPerMmHg / peakActiveStressPa.LVFW;

console.log(JSON.stringify({
  inspectionId: "main-wire-coronary-mechanics-drive-v1",
  role: "prior-audit-not-parameter-fitting",
  dtSec,
  beatCount,
  finalBeatSampleCount: samples.length,
  peakActiveStressPa,
  peakLvpMmHg,
  peakRvpMmHg,
  gammaForTwentyPercentLvPeak,
}, null, 2));

function numericArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return value;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return value;
}
