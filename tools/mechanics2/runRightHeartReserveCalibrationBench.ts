import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runRightHeartReserveCalibrationBenchV1,
} from "@/engine/mechanics2/benches/RightHeartReserveCalibrationBench";

export const RIGHT_HEART_RESERVE_CALIBRATION_REPORT_PATH_V1 =
  "data/mechanics2/reports/right-heart-reserve-calibration-report-v1.json" as const;

export function writeRightHeartReserveCalibrationReportV1():
ReturnType<typeof runRightHeartReserveCalibrationBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runRightHeartReserveCalibrationBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), RIGHT_HEART_RESERVE_CALIBRATION_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeRightHeartReserveCalibrationReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    decision: report.decision,
    variants: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      intervention: variant.intervention,
      summary: variant.summary,
      maxSafetyPressureMmHg: variant.maxSafetyPressureMmHg,
      minStrokeVolumeMl: variant.minStrokeVolumeMl,
      failingPoints: variant.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => ({
          pointId: point.pointId,
          failureReasons: point.failureReasons,
          rawFailureReasons: point.rawFailureReasons,
          classifications: point.classifications,
          finalBeat: point.finalBeat == null ? null : {
            strokeVolumeMl: point.finalBeat.strokeVolumeMl,
            pvEjectedVolumeMl: point.finalBeat.pvEjectedVolumeMl,
            tvForwardVolumeMl: point.finalBeat.tvForwardVolumeMl,
            rvpPeakMmHg: point.finalBeat.rvpPeakMmHg,
            tvForwardPeakCount: point.finalBeat.tvForwardPeakCount,
            tvC1ContinuityScore: point.finalBeat.tvC1ContinuityScore,
            maxSafetyPressureMmHg: point.finalBeat.maxSafetyPressureMmHg,
          },
        })),
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
