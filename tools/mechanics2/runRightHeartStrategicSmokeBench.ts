import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runRightHeartStrategicSmokeBenchV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";

export const RIGHT_HEART_STRATEGIC_SMOKE_REPORT_PATH_V1 =
  "data/mechanics2/reports/right-heart-strategic-smoke-report-v1.json" as const;

export function writeRightHeartStrategicSmokeReportV1():
ReturnType<typeof runRightHeartStrategicSmokeBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runRightHeartStrategicSmokeBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), RIGHT_HEART_STRATEGIC_SMOKE_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeRightHeartStrategicSmokeReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    summary: report.summary,
    decision: report.decision,
    points: report.pointResults.map((point) => ({
      pointId: point.pointId,
      status: point.status,
      failureReasons: point.failureReasons,
      rawFailureReasons: point.rawFailureReasons,
      acceptedPhenotypeReasons: point.acceptedPhenotypeReasons,
      classifications: point.classifications,
      finalBeat: point.finalBeat == null ? null : {
        strokeVolumeMl: point.finalBeat.strokeVolumeMl,
        pvEjectedVolumeMl: point.finalBeat.pvEjectedVolumeMl,
        tvForwardVolumeMl: point.finalBeat.tvForwardVolumeMl,
        rvpPeakMmHg: point.finalBeat.rvpPeakMmHg,
        rvpPositiveCurvatureBurden: point.finalBeat.rvpPositiveCurvatureBurden,
        tvForwardPeakCount: point.finalBeat.tvForwardPeakCount,
        tvC1ContinuityScore: point.finalBeat.tvC1ContinuityScore,
        clampCount: point.finalBeat.clampCount,
        maxSafetyPressureMmHg: point.finalBeat.maxSafetyPressureMmHg,
        maxTvClosureDrive01: point.finalBeat.maxTvClosureDrive01,
        tvClosureDriveDutyFraction: point.finalBeat.tvClosureDriveDutyFraction,
        maxPaOutflowStatefulDrive01: point.finalBeat.maxPaOutflowStatefulDrive01,
        maxPaOutResistanceEffectiveMmHgSecPerMl: point.finalBeat.maxPaOutResistanceEffectiveMmHgSecPerMl,
      },
      repeatability: point.repeatability,
      dtSensitivity: point.dtSensitivity,
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
