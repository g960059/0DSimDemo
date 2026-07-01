import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runLeftHeartArchitectureComparisonBenchV1 } from "@/engine/mechanics2/benches/LeftHeartArchitectureComparisonBench";

export const LEFT_HEART_ARCHITECTURE_COMPARISON_REPORT_PATH_V1 =
  "data/mechanics2/reports/left-heart-architecture-comparison-report-v1.json" as const;

export function writeLeftHeartArchitectureComparisonReportV1(): ReturnType<typeof runLeftHeartArchitectureComparisonBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLeftHeartArchitectureComparisonBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LEFT_HEART_ARCHITECTURE_COMPARISON_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLeftHeartArchitectureComparisonReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    baselineV1Summary: report.baselineV1Summary,
    variantSummaries: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })),
    decision: report.decision,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
