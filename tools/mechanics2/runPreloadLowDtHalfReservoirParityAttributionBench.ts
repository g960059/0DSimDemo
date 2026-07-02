import fs from "node:fs";
import path from "node:path";
import {
  runPreloadLowDtHalfReservoirParityAttributionBenchV1,
} from "@/engine/mechanics2/benches/PreloadLowDtHalfReservoirParityAttributionBench";

export const PRELOAD_LOW_DTHALF_RESERVOIR_PARITY_ATTRIBUTION_REPORT_PATH_V1 =
  "data/mechanics2/reports/preload-low-dthalf-reservoir-parity-attribution-report-v1.json" as const;

export function writePreloadLowDtHalfReservoirParityAttributionReportV1():
ReturnType<typeof runPreloadLowDtHalfReservoirParityAttributionBenchV1> & {
  readonly outPath: string;
} {
  const report = runPreloadLowDtHalfReservoirParityAttributionBenchV1();
  const outPath = path.resolve(
    process.cwd(),
    PRELOAD_LOW_DTHALF_RESERVOIR_PARITY_ATTRIBUTION_REPORT_PATH_V1,
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writePreloadLowDtHalfReservoirParityAttributionReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    status: report.decision.attributionStatus,
    owner: report.attribution.owner,
    preloadLowParity: report.preloadLowParity,
  }, null, 2));
}
