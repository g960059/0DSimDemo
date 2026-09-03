import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  runMainWireStandard70BaselineNumericalFloorAuditV1,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineNumericalFloorAuditV1";

const outputArgument = argumentV1("--output");
const coarseDtArgument = argumentV1("--coarse-dt");
const audit = await runMainWireStandard70BaselineNumericalFloorAuditV1(
  coarseDtArgument === undefined ? undefined : Number(coarseDtArgument),
  (runLabel, phase) => {
    process.stderr.write(`[Standard70 numerical-floor] ${runLabel} ${phase}\n`);
  },
);
const serialized = `${JSON.stringify(audit, null, 2)}\n`;
if (outputArgument === undefined) {
  process.stdout.write(serialized);
} else {
  const outputPath = resolve(outputArgument);
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, serialized, "utf8");
  await rename(temporaryPath, outputPath);
  process.stdout.write(`${outputPath}\n`);
}

function argumentV1(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
