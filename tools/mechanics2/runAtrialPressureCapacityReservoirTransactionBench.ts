import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  runAtrialPressureCapacityReservoirTransactionBenchV1,
} from "@/engine/mechanics2/benches/AtrialPressureCapacityReservoirTransactionBench";

const OUTPUT_PATH =
  "data/mechanics2/reports/atrial-pressure-capacity-reservoir-transaction-report-v1.json" as const;

const report = runAtrialPressureCapacityReservoirTransactionBenchV1();
const reportWithHash = { ...report, normalizedSha256: hashStable(report) };

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(reportWithHash, null, 2)}\n`);

console.log(JSON.stringify({
  reportId: report.reportId,
  gateId: report.gateId,
  mode: report.mode,
  summary: report.summary,
  bestVariant: report.bestVariant,
  decision: report.decision,
  claimBoundary: report.claimBoundary,
  normalizedSha256: reportWithHash.normalizedSha256,
}, null, 2));

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
