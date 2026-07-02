import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runAtrialChamberValveTransactionReadinessBenchV1,
} from "@/engine/mechanics2/benches/AtrialChamberValveTransactionReadinessBench";

export const ATRIAL_CHAMBER_VALVE_TRANSACTION_READINESS_REPORT_PATH_V1 =
  "data/mechanics2/reports/atrial-chamber-valve-transaction-readiness-report-v1.json" as const;

export function writeAtrialChamberValveTransactionReadinessReportV1():
ReturnType<typeof runAtrialChamberValveTransactionReadinessBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runAtrialChamberValveTransactionReadinessBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), ATRIAL_CHAMBER_VALVE_TRANSACTION_READINESS_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeAtrialChamberValveTransactionReadinessReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    readinessMode: report.readinessMode,
    summary: report.summary,
    readiness: report.readiness,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
