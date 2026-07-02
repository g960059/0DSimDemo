import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runStatefulLaChamberContractSmokeBenchV1,
} from "@/engine/mechanics2/benches/StatefulLaChamberContractSmokeBench";

export const STATEFUL_LA_CHAMBER_CONTRACT_SMOKE_REPORT_PATH_V1 =
  "data/mechanics2/reports/stateful-la-chamber-contract-smoke-report-v1.json" as const;

export function writeStatefulLaChamberContractSmokeReportV1():
ReturnType<typeof runStatefulLaChamberContractSmokeBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runStatefulLaChamberContractSmokeBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), STATEFUL_LA_CHAMBER_CONTRACT_SMOKE_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeStatefulLaChamberContractSmokeReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    smokeMode: report.smokeMode,
    summary: report.summary,
    selectedVariant: report.selectedVariant,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
