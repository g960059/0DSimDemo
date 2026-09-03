import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  buildMainWireBaselineConditioningResolutionAuditV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningResolutionAuditV1";

const conditioningArgument = requiredArgumentV1("--conditioning");
const numericalFloorArgument = requiredArgumentV1("--numerical-floor");
const outputArgument = argumentV1("--output");

const [conditioning, numericalFloor] = await Promise.all([
  readJsonV1(conditioningArgument),
  readJsonV1(numericalFloorArgument),
]);
const audit = await buildMainWireBaselineConditioningResolutionAuditV1(
  conditioning,
  numericalFloor,
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

async function readJsonV1(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(path), "utf8")) as unknown;
}

function requiredArgumentV1(name: string): string {
  const value = argumentV1(name);
  if (value === undefined) throw new Error(`${name} is required`);
  return value;
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
