import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATRIAL_AV_PLANE_COORDINATE_CONTRACT_REVIEW_REPORT_ID_V1,
  runAtrialAVPlaneCoordinateContractReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneCoordinateContractReviewBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-av-plane-coordinate-contract-review-report-v1.json",
);

const report = runAtrialAVPlaneCoordinateContractReviewBenchV1();
const normalized = JSON.stringify(report);
const normalizedSha256 = createHash("sha256").update(normalized).digest("hex");
const reportWithHash = {
  ...report,
  normalizedSha256,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);

console.log(JSON.stringify({
  reportId: ATRIAL_AV_PLANE_COORDINATE_CONTRACT_REVIEW_REPORT_ID_V1,
  summary: report.summary,
  decision: report.decision,
  normalizedSha256,
}, null, 2));
