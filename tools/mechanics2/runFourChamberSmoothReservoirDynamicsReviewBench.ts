import fs from "node:fs";
import path from "node:path";
import {
  runFourChamberSmoothReservoirDynamicsReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirDynamicsReviewBench";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-smooth-reservoir-dynamics-review-report-v1.json" as const;

export function writeFourChamberSmoothReservoirDynamicsReviewReportV1():
ReturnType<typeof runFourChamberSmoothReservoirDynamicsReviewBenchV1> & {
  readonly outPath: string;
} {
  const report = runFourChamberSmoothReservoirDynamicsReviewBenchV1();
  const outPath = path.resolve(process.cwd(), FOUR_CHAMBER_SMOOTH_RESERVOIR_DYNAMICS_REVIEW_REPORT_PATH_V1);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeFourChamberSmoothReservoirDynamicsReviewReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    status: report.decision.smoothReservoirDynamicsStatus,
    summary: report.summary,
    stress: report.dynamicsPoints
      .filter((point) => String(point.scenarioId).startsWith("stress"))
      .map((point) => ({
        scenarioId: point.scenarioId,
        status: point.status,
        maxAbsReservoirVolumeMl: point.maxAbsReservoirVolumeMl,
        finalReservoirStepMl: point.finalReservoirStepMl,
        hardLimiterDutyFraction: point.hardLimiterDutyFraction,
        feedbackDutyFraction: point.feedbackDutyFraction,
      })),
  }, null, 2));
}
