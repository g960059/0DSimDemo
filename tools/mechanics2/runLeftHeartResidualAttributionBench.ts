import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runLeftHeartResidualAttributionBenchV1 } from "@/engine/mechanics2/benches/LeftHeartResidualAttributionBench";

export const LEFT_HEART_RESIDUAL_ATTRIBUTION_REPORT_PATH_V1 =
  "data/mechanics2/reports/left-heart-residual-attribution-report-v1.json" as const;

export function writeLeftHeartResidualAttributionReportV1(): ReturnType<typeof runLeftHeartResidualAttributionBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLeftHeartResidualAttributionBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LEFT_HEART_RESIDUAL_ATTRIBUTION_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLeftHeartResidualAttributionReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    sourceComparison: report.sourceComparison,
    pointAttributions: report.pointAttributions.map((point) => ({
      pointId: point.pointId,
      status: point.status,
      classification: point.classification,
      strokeVolumeMl: point.strokeVolumeMl,
      mvForwardPeakCount: point.mvForwardPeakCount,
      mvC1ContinuityScore: point.mvC1ContinuityScore,
      flags: point.attributionFlags,
    })),
    decision: report.decision,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
