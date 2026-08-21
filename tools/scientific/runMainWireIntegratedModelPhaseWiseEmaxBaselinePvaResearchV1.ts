import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import { analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import { runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";

const ledgerPath = join(
  process.cwd(),
  "artifacts/mechanical-port-ledger/periodic-five-wall-mechanical-port-ledger-dt-characterization-v1.json",
);
const passivePath = join(
  process.cwd(),
  "artifacts/transient-preload/pva-diastolic-reference-comparison-v1.json",
);
const outputPath = join(
  process.cwd(),
  "artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json",
);

const [trajectory, ledgerReport, passiveComparison] = await Promise.all([
  runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryV1(),
  readJsonV1<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1>(
    ledgerPath,
  ),
  readJsonV1<MainWireIntegratedModelPvaDiastolicReferenceComparisonV1>(
    passivePath,
  ),
]);

if (trajectory.status !== "completed") {
  throw new Error(
    `transient research trajectory failed: ${trajectory.failureEvidence.failureClass}: ${trajectory.failureEvidence.message}`,
  );
}

const result = analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1(
  trajectory.rawBeats,
  ledgerReport,
  passiveComparison,
  ledgerReport.payload.sourceOutcome.status === "source-p1-established"
    ? {
        transientSource: trajectory.sourceOutcome.summary,
        periodicLedgerSource: ledgerReport.payload.sourceOutcome.summary,
      }
    : null,
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      summary: result.summary,
      candidates: result.candidates.map((candidate) => ({
        ventricleId: candidate.ventricleId,
        phaseIndex: candidate.selectedPhaseIndex,
        phase01: candidate.selectedPhase01,
        elastanceMmHgPerMl: candidate.selectedRelation.slopeMmHgPerMl,
        volumeAxisInterceptMl: candidate.selectedRelation.volumeAxisInterceptMl,
      })),
      baselinePva: result.baselinePva.map((row) => ({
        ventricleId: row.ventricleId,
        status: row.status,
        externalWorkJ: row.periodicExternalWorkJ,
        potentialEnergyJ: row.reportedPotentialEnergyJ,
        pvaJ: row.reportedPressureVolumeAreaJ,
      })),
    },
    null,
    2,
  ),
);

async function readJsonV1<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
