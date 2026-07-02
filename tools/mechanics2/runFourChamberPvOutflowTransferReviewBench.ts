import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runFourChamberPvOutflowTransferReviewBenchV1,
} from "@/engine/mechanics2/benches/FourChamberPvOutflowTransferReviewBench";

export const FOUR_CHAMBER_PV_OUTFLOW_TRANSFER_REVIEW_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-pv-outflow-transfer-review-report-v1.json" as const;

export function writeFourChamberPvOutflowTransferReviewReportV1():
ReturnType<typeof runFourChamberPvOutflowTransferReviewBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runFourChamberPvOutflowTransferReviewBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), FOUR_CHAMBER_PV_OUTFLOW_TRANSFER_REVIEW_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeFourChamberPvOutflowTransferReviewReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    summary: report.summary,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
