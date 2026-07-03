import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1,
  runLAEffectiveCavitySignAuditBenchV1,
} from "@/engine/mechanics2/benches/LAEffectiveCavitySignAuditBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(repoRoot, "data/mechanics2/reports/la-effective-cavity-sign-audit-report-v1.json");

const report = runLAEffectiveCavitySignAuditBenchV1();
if (report.reportId !== LA_EFFECTIVE_CAVITY_SIGN_AUDIT_REPORT_ID_V1) {
  throw new Error(`Unexpected report id: ${report.reportId}`);
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));
