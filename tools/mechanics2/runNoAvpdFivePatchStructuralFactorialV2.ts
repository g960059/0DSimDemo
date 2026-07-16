import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  runNoAvpdFivePatchStructuralFactorialV2,
} from "@/engine/mechanics2/benches/NoAvpdFivePatchStructuralFactorialV2";

export const DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_REPORT_V2 =
  resolve(
    "data/mechanics2/reports/no-avpd-five-patch-structural-factorial-v2.json",
  );

export function runNoAvpdFivePatchStructuralFactorialCliV2(
  args: readonly string[] = process.argv.slice(2),
) {
  let candidateIndex = 0;
  let scenarioId = "hr60-reference";
  let beats = 1;
  let dtSec = 0.005;
  let calciumRamp: "off-full-amplitude" | "envelope-common-ramp" =
    "off-full-amplitude";
  let output = DEFAULT_NO_AVPD_FIVE_PATCH_STRUCTURAL_FACTORIAL_REPORT_V2;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    const value = args[index + 1];
    if (value == null) throw new Error(`missing value after ${argument}`);
    switch (argument) {
      case "--candidate":
        candidateIndex = Number(value);
        break;
      case "--scenario":
        scenarioId = value;
        break;
      case "--beats":
        beats = Number(value);
        break;
      case "--dt":
        dtSec = Number(value);
        break;
      case "--calcium-ramp":
        if (value !== "off-full-amplitude" && value !== "envelope-common-ramp") {
          throw new Error("unsupported --calcium-ramp value");
        }
        calciumRamp = value;
        break;
      case "--output":
        output = resolve(value);
        break;
      default:
        throw new Error(`unknown argument: ${argument}`);
    }
    index += 1;
  }
  const report = runNoAvpdFivePatchStructuralFactorialV2({
    candidateIndex,
    scenarioId,
    beats,
    dtSec,
    calciumRamp,
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return Object.freeze({
    output,
    candidateId: report.candidateId,
    arms: report.arms.map((arm) => Object.freeze({
      armId: arm.armId,
      status: arm.status,
      stepsAccepted: arm.stepsAccepted,
      periodicityStatus: arm.periodicity.status,
    })),
  });
}

const invokedPath = process.argv[1];
if (
  invokedPath != null &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    process.stdout.write(
      `${JSON.stringify(runNoAvpdFivePatchStructuralFactorialCliV2())}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
