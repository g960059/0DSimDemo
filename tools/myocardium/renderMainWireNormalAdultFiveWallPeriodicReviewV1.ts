import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  renderMainWireNormalAdultFiveWallPeriodicReviewV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallPeriodicReviewV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredValueAfter("--input");
const outputPath = requiredValueAfter("--output");
const svgOutputPath = optionalValueAfter("--svg-output");

const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV1;
const rendered = renderMainWireNormalAdultFiveWallPeriodicReviewV1(result);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, rendered.html);
if (svgOutputPath !== null) {
  mkdirSync(path.dirname(svgOutputPath), { recursive: true });
  writeFileSync(svgOutputPath, `${rendered.svg}\n`);
}

process.stdout.write(`${JSON.stringify({
  reviewId: rendered.review.reviewId,
  inputPath,
  outputPath,
  svgOutputPath,
  latestBeatIndex: rendered.review.run.latestBeatIndex,
  periodicSteadyStateClaimed:
    rendered.review.run.periodicSteadyStateClaimed,
  terminationReason: rendered.review.run.terminationReason,
  htmlBytes: Buffer.byteLength(rendered.html),
  svgBytes: Buffer.byteLength(rendered.svg),
})}\n`);

function requiredValueAfter(name: string): string {
  const value = optionalValueAfter(name);
  if (value === null) throw new Error(`${name} is required`);
  return value;
}

function optionalValueAfter(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

