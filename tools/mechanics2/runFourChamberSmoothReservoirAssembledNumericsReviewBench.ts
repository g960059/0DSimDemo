import fs from "node:fs";
import path from "node:path";
import {
  runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirAssembledNumericsReviewBench";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_ASSEMBLED_NUMERICS_REVIEW_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-smooth-reservoir-assembled-numerics-review-report-v1.json" as const;

export function writeFourChamberSmoothReservoirAssembledNumericsReviewReportV1():
ReturnType<typeof runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1> & {
  readonly outPath: string;
} {
  const report = runFourChamberSmoothReservoirAssembledNumericsReviewBenchV1();
  const outPath = path.resolve(
    process.cwd(),
    FOUR_CHAMBER_SMOOTH_RESERVOIR_ASSEMBLED_NUMERICS_REVIEW_REPORT_PATH_V1,
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeFourChamberSmoothReservoirAssembledNumericsReviewReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    status: report.decision.assembledNumericsStatus,
    summary: report.summary,
    parityFailures: report.profileParity
      .filter((profile) => !profile.dtHalfReservoirParityOk)
      .map((profile) => ({
        profileId: profile.profileId,
        dtHalfMaxReservoirDeltaMl: profile.dtHalfMaxReservoirDeltaMl,
        nominalMaxAbsReservoirVolumeMl: profile.nominalMaxAbsReservoirVolumeMl,
        dtHalfMaxAbsReservoirVolumeMl: profile.dtHalfMaxAbsReservoirVolumeMl,
      })),
  }, null, 2));
}
