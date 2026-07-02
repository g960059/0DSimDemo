import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATRIAL_AV_PLANE_MV_OWNERSHIP_REVIEW_REPORT_ID_V1,
  runAtrialAVPlaneMvOwnershipReviewBenchV1,
} from "@/engine/mechanics2/benches/AtrialAVPlaneMvOwnershipReviewBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-av-plane-mv-ownership-review-report-v1.json",
);

const report = runAtrialAVPlaneMvOwnershipReviewBenchV1();
const normalized = JSON.stringify(report);
const normalizedSha256 = createHash("sha256").update(normalized).digest("hex");
const reportWithHash = {
  ...report,
  normalizedSha256,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);

console.log(JSON.stringify({
  reportId: ATRIAL_AV_PLANE_MV_OWNERSHIP_REVIEW_REPORT_ID_V1,
  summary: report.summary,
  decision: report.decision,
  normalizedSha256,
}, null, 2));
