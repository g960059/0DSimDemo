import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runSourceSurfaceDtHalfStabilityScanBenchV1,
} from "@/engine/mechanics2/benches/SourceSurfaceDtHalfStabilityScanBench";

export const SOURCE_SURFACE_DTHALF_STABILITY_SCAN_REPORT_PATH_V1 =
  "data/mechanics2/reports/source-surface-dthalf-stability-scan-report-v1.json" as const;

export function writeSourceSurfaceDtHalfStabilityScanReportV1():
ReturnType<typeof runSourceSurfaceDtHalfStabilityScanBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runSourceSurfaceDtHalfStabilityScanBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), SOURCE_SURFACE_DTHALF_STABILITY_SCAN_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeSourceSurfaceDtHalfStabilityScanReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    summary: report.summary,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
