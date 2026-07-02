import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runBoundedReservoirVolumeOwnershipBenchV1 } from "@/engine/mechanics2/benches/BoundedReservoirVolumeOwnershipBench";

const report = runBoundedReservoirVolumeOwnershipBenchV1();
const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
const outPath = resolve(
  process.cwd(),
  "data/mechanics2/reports/bounded-reservoir-volume-ownership-report-v1.json",
);

writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
console.log(JSON.stringify({
  reportId: reportWithHash.reportId,
  status: reportWithHash.decision.boundedReservoirVolumeStatus,
  bestVariantId: reportWithHash.summary.bestVariantId,
  bestPassCount: reportWithHash.summary.bestPassCount,
  bestMaxAbsReservoirVolumeMl: reportWithHash.summary.bestMaxAbsReservoirVolumeMl,
  normalizedSha256: reportWithHash.normalizedSha256,
}, null, 2));

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
