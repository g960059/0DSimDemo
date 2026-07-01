import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runReservoirStateContractBenchV1,
} from "@/engine/mechanics2/benches/ReservoirStateContractBench";

export const RESERVOIR_STATE_CONTRACT_REPORT_PATH_V1 =
  "data/mechanics2/reports/reservoir-state-contract-report-v1.json" as const;

export function writeReservoirStateContractReportV1():
ReturnType<typeof runReservoirStateContractBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runReservoirStateContractBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), RESERVOIR_STATE_CONTRACT_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeReservoirStateContractReportV1();
  const best = report.variantResults.find((variant) => variant.variantId === report.decision.bestVariantId);
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    decision: report.decision,
    bestSummary: best?.summary ?? null,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
