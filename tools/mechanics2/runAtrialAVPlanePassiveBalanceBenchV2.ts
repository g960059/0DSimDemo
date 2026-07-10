import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runAtrialAVPlanePassiveBalanceBenchV2 } from
  "@/engine/mechanics2/benches/AtrialAVPlanePassiveBalanceBenchV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/atrial-av-plane-passive-balance-report-v2.json",
);

export function writeAtrialAVPlanePassiveBalanceReportV2() {
  const report = runAtrialAVPlanePassiveBalanceBenchV2();
  const normalized = JSON.stringify(report);
  const reportWithHash = {
    ...report,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeAtrialAVPlanePassiveBalanceReportV2();
  console.log(JSON.stringify({
    reportId: report.reportId,
    gates: report.gates,
    comparisons: report.comparisons,
    envelopeDiagnostics: report.envelopeDiagnostics,
    variants: report.variants.map((row) => ({
      variantId: row.variantId,
      periodic: row.profile.periodicSteadyState,
      avpdCm: row.profile.avPlaneDisplacementCm,
      xDepthMmHg: row.profile.xDescentDepthMmHg,
      eToA: row.profile.mitralPeakVelocityEToARatio,
      aToVAreaRatio: row.profile.aLoopAreaMmHgMl /
        Math.max(row.profile.vLoopAreaMmHgMl, 1e-9),
      crossingPhase: row.profile.figureEightCrossingPhase,
      conduitBelowFraction:
        row.profile.conduitBeforeCrossingBelowReservoirPathFraction,
      diastasis: row.diastasis,
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
