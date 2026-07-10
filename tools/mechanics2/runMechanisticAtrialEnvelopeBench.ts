import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runMechanisticAtrialEnvelopeBenchV1 } from
  "@/engine/mechanics2/benches/MechanisticAtrialEnvelopeBench";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/mechanistic-atrial-envelope-report-v1.json",
);
const report = runMechanisticAtrialEnvelopeBenchV1();
const summaryReport = {
  ...report,
  cases: report.cases.map(({ result, ...row }) => ({
    ...row,
    result: (({ samples: _samples, ...summary }) => summary)(result),
  })),
};
const normalized = JSON.stringify(summaryReport);
const reportWithHash = {
  ...summaryReport,
  normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
console.log(JSON.stringify({
  reportId: report.reportId,
  gates: report.gates,
  directionalChecks: report.directionalChecks,
  dtRelativeErrors: report.dtRelativeErrors,
  cases: report.cases.map(({ caseId, result }) => ({
    caseId,
    periodic: result.periodicSteadyState,
    coLPerMin: result.cardiacOutputLPerMin,
    laPressure: result.pressureRangeLaMmHg,
    lvPeakMmHg: result.pressureRangeLvMmHg[1],
    avpdCm: result.avPlaneDisplacementCm,
    trueLobeMeasurement: {
      status: result.lobeMeasurementStatus,
      reason: result.lobeMeasurementReason,
      phaseCrossingMatchPass: result.lobePhaseCrossingMatchPass,
      selfIntersectionAngleDeg: result.lobeSelfIntersectionAngleDeg,
      opposedLobeOrientation: result.opposedLobeOrientation,
    },
    legacyPhaseEnvelope: {
      crossingPhase: result.figureEightCrossingPhase,
      crossingInPreferredWindow: result.figureEightCrossingInPreferredWindow,
      reservoirConduitIntersection: result.reservoirConduitIntersection,
      reservoirPumpingIntersection: result.reservoirPumpingIntersection,
    },
  })),
  normalizedSha256: reportWithHash.normalizedSha256,
}, null, 2));
