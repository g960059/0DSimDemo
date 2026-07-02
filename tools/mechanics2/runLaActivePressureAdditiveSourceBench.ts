import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runLaActivePressureAdditiveSourceBenchV1,
} from "@/engine/mechanics2/benches/LaActivePressureAdditiveSourceBench";

export const LA_ACTIVE_PRESSURE_ADDITIVE_SOURCE_REPORT_PATH_V1 =
  "data/mechanics2/reports/la-active-pressure-additive-source-report-v1.json" as const;

export function writeLaActivePressureAdditiveSourceReportV1():
ReturnType<typeof runLaActivePressureAdditiveSourceBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLaActivePressureAdditiveSourceBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LA_ACTIVE_PRESSURE_ADDITIVE_SOURCE_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLaActivePressureAdditiveSourceReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    sourceMode: report.sourceMode,
    summary: report.summary,
    bestVariant: report.bestVariant,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
