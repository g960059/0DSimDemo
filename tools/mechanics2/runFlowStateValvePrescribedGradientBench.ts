import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runFlowStateValvePrescribedGradientBenchV1 } from "@/engine/mechanics2/benches/FlowStateValvePrescribedGradientBench";

export const FLOW_STATE_VALVE_PRESCRIBED_GRADIENT_REPORT_PATH_V1 =
  "data/mechanics2/reports/flow-state-valve-prescribed-gradient-report-v1.json" as const;

export function writeFlowStateValvePrescribedGradientReportV1(): ReturnType<typeof runFlowStateValvePrescribedGradientBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runFlowStateValvePrescribedGradientBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), FLOW_STATE_VALVE_PRESCRIBED_GRADIENT_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeFlowStateValvePrescribedGradientReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    summary: report.summary,
    decision: report.decision,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
