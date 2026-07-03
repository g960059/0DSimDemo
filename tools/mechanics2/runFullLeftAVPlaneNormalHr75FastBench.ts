import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1,
  runFullLeftAVPlaneResidualRoutingBenchV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/reports/full-left-av-plane-normal-hr75-fast-report-v1.json",
);

const report = runFullLeftAVPlaneResidualRoutingBenchV1({ profileIds: ["normal-hr75"] });
if (report.reportId !== FULL_LEFT_AV_PLANE_RESIDUAL_ROUTING_REPORT_ID_V1) {
  throw new Error(`Unexpected report id: ${report.reportId}`);
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));
