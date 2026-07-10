import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runMechanisticAtrialOneFiberBenchV1,
} from "@/engine/mechanics2/benches/MechanisticAtrialOneFiberBench";

export const MECHANISTIC_ATRIAL_ONE_FIBER_REPORT_PATH_V1 =
  "data/mechanics2/reports/mechanistic-atrial-one-fiber-report-v1.json" as const;

export function writeMechanisticAtrialOneFiberReportV1() {
  const report = runMechanisticAtrialOneFiberBenchV1();
  const summaryReport = {
    ...report,
    profiles: report.profiles.map(({ samples: _samples, ...profile }) => profile),
  };
  const reportWithHash = {
    ...summaryReport,
    normalizedSha256: createHash("sha256").update(JSON.stringify(summaryReport)).digest("hex"),
  };
  const outputPath = path.resolve(process.cwd(), MECHANISTIC_ATRIAL_ONE_FIBER_REPORT_PATH_V1);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeMechanisticAtrialOneFiberReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gates: report.gates,
    decision: report.decision,
    profiles: report.profiles,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
