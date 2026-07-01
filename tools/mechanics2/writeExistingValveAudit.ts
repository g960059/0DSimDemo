import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildExistingValveAuditV1 } from "@/engine/mechanics2/audits/ExistingValveAuditV1";

export const EXISTING_VALVE_AUDIT_REPORT_PATH_V1 =
  "data/mechanics2/reports/existing-valve-audit-v1.json" as const;

export function writeExistingValveAuditV1(): ReturnType<typeof buildExistingValveAuditV1> & {
  readonly normalizedSha256: string;
} {
  const report = buildExistingValveAuditV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), EXISTING_VALVE_AUDIT_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeExistingValveAuditV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    valves: report.valveParameters.map((valve) => valve.valveId),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
