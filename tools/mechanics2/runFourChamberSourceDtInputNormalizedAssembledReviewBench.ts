import fs from "node:fs";
import path from "node:path";
import {
  runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSourceDtInputNormalizedAssembledReviewBench";

export const FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-source-dt-input-normalized-assembled-review-report-v1.json" as const;

export function writeFourChamberSourceDtInputNormalizedAssembledReviewReportV1():
ReturnType<typeof runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1> & {
  readonly outPath: string;
} {
  const report = runFourChamberSourceDtInputNormalizedAssembledReviewBenchV1();
  const outPath = path.resolve(
    process.cwd(),
    FOUR_CHAMBER_SOURCE_DT_INPUT_NORMALIZED_ASSEMBLED_REVIEW_REPORT_PATH_V1,
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeFourChamberSourceDtInputNormalizedAssembledReviewReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    status: report.decision.sourceDtInputNormalizedAssembledStatus,
    summary: report.summary,
  }, null, 2));
}
