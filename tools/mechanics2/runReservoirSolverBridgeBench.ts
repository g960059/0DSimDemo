import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runReservoirSolverBridgeBenchV1,
} from "@/engine/mechanics2/benches/ReservoirSolverBridgeBench";

export const RESERVOIR_SOLVER_BRIDGE_REPORT_PATH_V1 =
  "data/mechanics2/reports/reservoir-solver-bridge-report-v1.json" as const;

export function writeReservoirSolverBridgeReportV1():
ReturnType<typeof runReservoirSolverBridgeBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runReservoirSolverBridgeBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), RESERVOIR_SOLVER_BRIDGE_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeReservoirSolverBridgeReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    sourceSurfaces: report.sourceSurfaces,
    decision: report.decision,
    summaries: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
