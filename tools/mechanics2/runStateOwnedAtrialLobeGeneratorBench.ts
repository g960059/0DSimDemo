import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import {
  runStateOwnedAtrialLobeGeneratorBenchV1,
} from "@/engine/mechanics2/benches/StateOwnedAtrialLobeGeneratorBench";

const OUTPUT_PATH =
  "data/mechanics2/reports/state-owned-atrial-lobe-generator-report-v1.json" as const;

const report = runStateOwnedAtrialLobeGeneratorBenchV1();
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
