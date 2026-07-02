import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  runAtrialLobeFailureAttributionBenchV1,
} from "@/engine/mechanics2/benches/AtrialLobeFailureAttributionBench";

const OUTPUT_PATH =
  "data/mechanics2/reports/atrial-lobe-failure-attribution-report-v1.json" as const;

const report = runAtrialLobeFailureAttributionBenchV1();
const reportWithHash = { ...report, normalizedSha256: hashStable(report) };

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(reportWithHash, null, 2)}\n`);

console.log(JSON.stringify({
  reportId: report.reportId,
  gateId: report.gateId,
  attributionMode: report.attributionMode,
  summary: report.summary,
  decision: report.decision,
  claimBoundary: report.claimBoundary,
  normalizedSha256: reportWithHash.normalizedSha256,
}, null, 2));

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
