import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  runLeftHeartDynamicReserveContractBenchV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";

export const LEFT_HEART_DYNAMIC_RESERVE_CONTRACT_REPORT_PATH_V1 =
  "data/mechanics2/reports/left-heart-dynamic-reserve-contract-report-v1.json" as const;

export function writeLeftHeartDynamicReserveContractReportV1():
ReturnType<typeof runLeftHeartDynamicReserveContractBenchV1> & {
  readonly normalizedSha256: string;
} {
  const report = runLeftHeartDynamicReserveContractBenchV1();
  const reportWithHash = { ...report, normalizedSha256: hashStable(report) };
  const outPath = path.resolve(process.cwd(), LEFT_HEART_DYNAMIC_RESERVE_CONTRACT_REPORT_PATH_V1);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeLeftHeartDynamicReserveContractReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    decision: report.decision,
    variants: report.variantResults.map((variant) => ({
      variantId: variant.variantId,
      intervention: variant.intervention,
      summary: variant.summary,
      failingPoints: variant.pointResults
        .filter((point) => point.status !== "pass")
        .map((point) => ({
          pointId: point.pointId,
          failureReasons: point.failureReasons,
          classifications: point.classifications,
          finalBeat: point.finalBeat == null ? null : {
            strokeVolumeMl: point.finalBeat.strokeVolumeMl,
            aovEjectedVolumeMl: point.finalBeat.aovEjectedVolumeMl,
            mvForwardVolumeMl: point.finalBeat.mvForwardVolumeMl,
            lvpPeakMmHg: point.finalBeat.lvpPeakMmHg,
            lvpPositiveCurvatureBurden: point.finalBeat.lvpPositiveCurvatureBurden,
            mvForwardPeakCount: point.finalBeat.mvForwardPeakCount,
            mvC1ContinuityScore: point.finalBeat.mvC1ContinuityScore,
            clampCount: point.finalBeat.clampCount,
            laClampCount: point.finalBeat.laClampCount,
            lvClampCount: point.finalBeat.lvClampCount,
            maxSafetyPressureMmHg: point.finalBeat.maxSafetyPressureMmHg,
            maxMvClosureDrive01: point.finalBeat.maxMvClosureDrive01,
            mvClosureDriveDutyFraction: point.finalBeat.mvClosureDriveDutyFraction,
            maxRootOutflowHighPressureDrive01: point.finalBeat.maxRootOutflowHighPressureDrive01,
            maxRootOutflowStatefulDrive01: point.finalBeat.maxRootOutflowStatefulDrive01,
            maxRootOutResistanceEffectiveMmHgSecPerMl: point.finalBeat.maxRootOutResistanceEffectiveMmHgSecPerMl,
          },
          repeatability: point.repeatability,
          dtSensitivity: point.dtSensitivity,
        })),
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
}
