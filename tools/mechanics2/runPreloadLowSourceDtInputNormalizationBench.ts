import fs from "node:fs";
import path from "node:path";
import {
  runPreloadLowSourceDtInputNormalizationBenchV1,
} from "@/engine/mechanics2/benches/PreloadLowSourceDtInputNormalizationBench";

export const PRELOAD_LOW_SOURCE_DT_INPUT_NORMALIZATION_REPORT_PATH_V1 =
  "data/mechanics2/reports/preload-low-source-dt-input-normalization-report-v1.json" as const;

export function writePreloadLowSourceDtInputNormalizationReportV1():
ReturnType<typeof runPreloadLowSourceDtInputNormalizationBenchV1> & {
  readonly outPath: string;
} {
  const report = runPreloadLowSourceDtInputNormalizationBenchV1();
  const outPath = path.resolve(
    process.cwd(),
    PRELOAD_LOW_SOURCE_DT_INPUT_NORMALIZATION_REPORT_PATH_V1,
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writePreloadLowSourceDtInputNormalizationReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    status: report.decision.sourceDtInputNormalizationStatus,
    summary: report.summary,
  }, null, 2));
}
