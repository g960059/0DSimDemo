import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runLeftHeartPulmonaryBoundaryContractBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartPulmonaryBoundaryContractBench";

export const LEFT_HEART_PULMONARY_BOUNDARY_CONTRACT_REPORT_PATH_V1 =
  "data/mechanics2/reports/left-heart-pulmonary-boundary-contract-report-v1.json" as const;

export function writeLeftHeartPulmonaryBoundaryContractReportV1():
ReturnType<typeof runLeftHeartPulmonaryBoundaryContractBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLeftHeartPulmonaryBoundaryContractBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LEFT_HEART_PULMONARY_BOUNDARY_CONTRACT_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLeftHeartPulmonaryBoundaryContractReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    decision: report.decision,
    variants: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      summary: variant.summary,
      failingPoints: variant.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => ({
          pointId: point.pointId,
          failureReasons: point.failureReasons,
          finalBeat: point.finalBeat == null ? null : {
            strokeVolumeMl: point.finalBeat.strokeVolumeMl,
            aovEjectedVolumeMl: point.finalBeat.aovEjectedVolumeMl,
            mvForwardVolumeMl: point.finalBeat.mvForwardVolumeMl,
            pulmonaryVenousToLaVolumeMl: point.finalBeat.pulmonaryVenousToLaVolumeMl,
            pulmonaryVenousSourceVolumeMl: point.finalBeat.pulmonaryVenousSourceVolumeMl,
            pulmonaryVenousPressureMinMmHg: point.finalBeat.pulmonaryVenousPressureMinMmHg,
            pulmonaryVenousPressureMaxMmHg: point.finalBeat.pulmonaryVenousPressureMaxMmHg,
            laVolumeMinMl: point.finalBeat.laVolumeMinMl,
            laVolumeMaxMl: point.finalBeat.laVolumeMaxMl,
            mvForwardPeakCount: point.finalBeat.mvForwardPeakCount,
            mvC1ContinuityScore: point.finalBeat.mvC1ContinuityScore,
            clampCount: point.finalBeat.clampCount,
          },
          repeatability: point.repeatability,
          dtSensitivity: point.dtSensitivity,
        })),
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
