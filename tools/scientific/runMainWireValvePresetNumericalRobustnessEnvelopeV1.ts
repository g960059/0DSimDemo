import { pathToFileURL } from "node:url";
import {
  runMainWireValvePresetNumericalRobustnessEnvelopeV1,
} from "./mainWireValvePresetNumericalRobustnessEnvelopeV1";

export function mainWireValvePresetNumericalRobustnessEnvelopeCliV1(
  args: readonly string[] = process.argv.slice(2),
): number {
  const summary = runMainWireValvePresetNumericalRobustnessEnvelopeV1(
    numericArgument(args, "--dt", 0.002),
  );
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary.overallPass ? 0 : 1;
}

function numericArgument(
  args: readonly string[],
  name: string,
  fallback: number,
): number {
  const equalsArgument = args.find((argument) =>
    argument.startsWith(`${name}=`));
  const index = args.indexOf(name);
  const raw = equalsArgument === undefined
    ? index < 0 ? undefined : args[index + 1]
    : equalsArgument.slice(name.length + 1);
  const value = raw === undefined ? fallback : Number(raw);
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${name} must be a positive finite number`);
  }
  return value;
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  process.exitCode = mainWireValvePresetNumericalRobustnessEnvelopeCliV1();
}
