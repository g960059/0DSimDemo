import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  renderMainWireNormalAdultFiveWallPeriodicReviewV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallPeriodicReviewV2";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV3,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const inputPath = requiredValueAfter("--input");
const outputPath = requiredValueAfter("--output");
const svgOutputPath = optionalValueAfter("--svg-output");

const result = JSON.parse(readFileSync(inputPath, "utf8")) as
  MainWireNormalAdultFiveWallPeriodicResultV3;
const rendered = renderMainWireNormalAdultFiveWallPeriodicReviewV2(result);
const html = withTrailingNewline(rendered.html);
const svg = withTrailingNewline(rendered.svg);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
if (svgOutputPath !== null) {
  mkdirSync(path.dirname(svgOutputPath), { recursive: true });
  writeFileSync(svgOutputPath, svg);
}

process.stdout.write(`${JSON.stringify({
  reviewId: rendered.review.reviewId,
  inputPath,
  outputPath,
  svgOutputPath,
  status: rendered.review.status,
  selectedBeatIndex: rendered.review.summary.selectedCycle.beatIndex,
  nominalGridCount: rendered.review.acceptedTimebase.nominalGridCount,
  acceptedIntervalCount:
    rendered.review.acceptedTimebase.acceptedIntervalCount,
  exactAcceptedEventCount:
    rendered.review.acceptedTimebase.exactEvents.length,
  precedingBoundaryAvailable:
    rendered.review.acceptedTimebase.precedingBoundary !== null,
  htmlBytes: Buffer.byteLength(html),
  svgBytes: Buffer.byteLength(svg),
})}\n`);

function withTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}

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
