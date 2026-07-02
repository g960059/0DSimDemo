import fs from "node:fs";
import path from "node:path";
import {
  runFourChamberSmoothReservoirOwnershipBenchV1,
} from "@/engine/mechanics2/benches/FourChamberSmoothReservoirOwnershipBench";

export const FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_PATH_V1 =
  "data/mechanics2/reports/four-chamber-smooth-reservoir-ownership-report-v1.json" as const;

export function writeFourChamberSmoothReservoirOwnershipReportV1():
ReturnType<typeof runFourChamberSmoothReservoirOwnershipBenchV1> & {
  readonly outPath: string;
} {
  const report = runFourChamberSmoothReservoirOwnershipBenchV1();
  const outPath = path.resolve(process.cwd(), FOUR_CHAMBER_SMOOTH_RESERVOIR_OWNERSHIP_REPORT_PATH_V1);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, outPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = writeFourChamberSmoothReservoirOwnershipReportV1();
  console.log(JSON.stringify({
    reportId: report.reportId,
    outPath: report.outPath,
    selectedCandidate: report.selectedCandidate?.candidateId ?? null,
    status: report.decision.smoothReservoirOwnershipStatus,
    summaries: report.candidateSummaries.map((summary) => ({
      candidateId: summary.candidateId,
      effectivePassCount: summary.effectivePassCount,
      fullEnvelopeLimiterDutyFraction: summary.fullEnvelopeLimiterDutyFraction,
      stressEffectiveStatus: summary.preloadLowStressProbe.effectiveStatus,
      stressLimiterDutyFraction: summary.preloadLowStressProbe.limiterDutyFraction,
      stressFinalReservoirStepMl: summary.preloadLowStressProbe.finalReservoirStepMl,
      maxAbsFeedbackMl: summary.maxAbsReservoirVolumeOwnershipFeedbackMl,
    })),
  }, null, 2));
}
