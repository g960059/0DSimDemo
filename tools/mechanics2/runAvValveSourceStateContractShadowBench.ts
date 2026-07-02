import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runAvValveSourceStateContractShadowBenchV1,
} from "@/engine/mechanics2/benches/AvValveSourceStateContractShadowBench";

export const AV_VALVE_SOURCE_STATE_CONTRACT_SHADOW_REPORT_PATH_V1 =
  "data/mechanics2/reports/av-valve-source-state-contract-shadow-report-v1.json" as const;

export function writeAvValveSourceStateContractShadowReportV1():
ReturnType<typeof runAvValveSourceStateContractShadowBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runAvValveSourceStateContractShadowBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), AV_VALVE_SOURCE_STATE_CONTRACT_SHADOW_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeAvValveSourceStateContractShadowReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gateId: report.gateId,
    upstreamAtrialShadow: report.upstreamAtrialShadow,
    directGradientReference: report.directGradientReference,
    replayMode: report.replayMode,
    variantSummaries: report.variantSummaries,
    bestFixedVariant: report.bestFixedVariant,
    oracleCeilingSummary: report.oracleCeilingSummary,
    summary: report.summary,
    decision: report.decision,
    claimBoundary: report.claimBoundary,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
