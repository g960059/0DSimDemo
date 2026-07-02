import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATRIAL_RESERVOIR_TOPOLOGY_ORIENTATION_ATTRIBUTION_REPORT_ID_V1,
  runAtrialReservoirTopologyOrientationAttributionBenchV1,
} from "@/engine/mechanics2/benches/AtrialReservoirTopologyOrientationAttributionBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-reservoir-topology-orientation-attribution-report-v1.json",
);

const report = runAtrialReservoirTopologyOrientationAttributionBenchV1();
const normalized = JSON.stringify(report);
const normalizedSha256 = createHash("sha256").update(normalized).digest("hex");
const reportWithHash = {
  ...report,
  normalizedSha256,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);

console.log(JSON.stringify({
  reportId: ATRIAL_RESERVOIR_TOPOLOGY_ORIENTATION_ATTRIBUTION_REPORT_ID_V1,
  summary: report.summary,
  decision: report.decision,
  normalizedSha256,
}, null, 2));
