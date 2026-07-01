import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runReservoirSolverAttributionBenchV1,
} from "@/engine/mechanics2/benches/ReservoirSolverAttributionBench";

export const RESERVOIR_SOLVER_ATTRIBUTION_REPORT_PATH_V1 =
  "data/mechanics2/reports/reservoir-solver-attribution-report-v1.json" as const;

export function writeReservoirSolverAttributionReportV1():
ReturnType<typeof runReservoirSolverAttributionBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runReservoirSolverAttributionBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), RESERVOIR_SOLVER_ATTRIBUTION_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeReservoirSolverAttributionReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    sourceReportId: report.sourceReportId,
    bestVariantId: report.bestVariantId,
    acceptedTransferSummary: report.acceptedTransferSummary,
    contractilityLowAttribution: {
      acceptedAbsMismatchMl: report.contractilityLowAttribution.acceptedAbsMismatchMl,
      acceptedTransferMl: report.contractilityLowAttribution.acceptedTransferMl,
      classification: report.contractilityLowAttribution.classification,
      scans: report.contractilityLowAttribution.scans.map((scan) => ({
        scanId: scan.scanId,
        transferBoundMl: scan.transferBoundMl,
        bestMorphologyPreserving: scan.bestMorphologyPreserving,
        bestFlowBalanced: scan.bestFlowBalanced,
      })),
    },
    decision: report.decision,
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
