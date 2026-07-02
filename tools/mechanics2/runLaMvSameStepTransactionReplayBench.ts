import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runLaMvSameStepTransactionReplayBenchV1,
} from "@/engine/mechanics2/benches/LaMvSameStepTransactionReplayBench";

export const LA_MV_SAME_STEP_TRANSACTION_REPLAY_REPORT_PATH_V1 =
  "data/mechanics2/reports/la-mv-same-step-transaction-replay-report-v1.json" as const;

export function writeLaMvSameStepTransactionReplayReportV1():
ReturnType<typeof runLaMvSameStepTransactionReplayBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLaMvSameStepTransactionReplayBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LA_MV_SAME_STEP_TRANSACTION_REPLAY_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLaMvSameStepTransactionReplayReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    replayMode: report.replayMode,
    summary: report.summary,
    bestVariant: report.bestVariant,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
