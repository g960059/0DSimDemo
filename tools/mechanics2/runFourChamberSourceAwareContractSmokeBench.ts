import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runFourChamberSourceAwareContractSmokeBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSourceAwareContractSmokeBench";

export const FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_SMOKE_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-source-aware-contract-smoke-report-v1.json" as const;

export function writeFourChamberSourceAwareContractSmokeReportV1():
ReturnType<typeof runFourChamberSourceAwareContractSmokeBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runFourChamberSourceAwareContractSmokeBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), FOUR_CHAMBER_SOURCE_AWARE_CONTRACT_SMOKE_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeFourChamberSourceAwareContractSmokeReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    inputs: report.inputs,
    summary: report.summary,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
