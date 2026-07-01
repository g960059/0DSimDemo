import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runLeftHeartOutflowRepairBenchV1 } from "@/engine/mechanics2/benches/LeftHeartOutflowRepairBench";

export const LEFT_HEART_OUTFLOW_REPAIR_REPORT_PATH_V1 =
  "data/mechanics2/reports/left-heart-outflow-repair-report-v1.json" as const;

export function writeLeftHeartOutflowRepairReportV1(): ReturnType<typeof runLeftHeartOutflowRepairBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLeftHeartOutflowRepairBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LEFT_HEART_OUTFLOW_REPAIR_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLeftHeartOutflowRepairReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    decision: report.decision,
    variants: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
      failingPoints: variant.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => ({
          pointId: point.pointId,
          failureReasons: point.failureReasons,
          finalBeat: point.finalBeat == null ? null : {
            strokeVolumeMl: point.finalBeat.strokeVolumeMl,
            aovEjectedVolumeMl: point.finalBeat.aovEjectedVolumeMl,
            mvForwardPeakCount: point.finalBeat.mvForwardPeakCount,
            mvC1ContinuityScore: point.finalBeat.mvC1ContinuityScore,
            clampCount: point.finalBeat.clampCount,
          },
          repeatability: point.repeatability,
          dtSensitivity: point.dtSensitivity,
        })),
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
