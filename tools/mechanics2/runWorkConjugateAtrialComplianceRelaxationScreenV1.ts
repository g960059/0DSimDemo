import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  runWorkConjugateAtrialComplianceRelaxationScreenV1,
  WORK_CONJUGATE_ATRIAL_COMPLIANCE_RELAXATION_SCREEN_ID_V1,
} from
  "@/engine/mechanics2/benches/WorkConjugateAtrialComplianceRelaxationScreenV1";
import { assertFiniteJsonNumbersV1 } from
  "@/tools/mechanics2/runWorkConjugateAtrialAVPlaneBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/work-conjugate-atrial-compliance-relaxation-screen-v1.json",
);

export function writeWorkConjugateAtrialComplianceRelaxationScreenV1() {
  const report = runWorkConjugateAtrialComplianceRelaxationScreenV1();
  assertFiniteJsonNumbersV1(report);
  const normalized = JSON.stringify(report);
  const artifact = {
    ...report,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  return artifact;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeWorkConjugateAtrialComplianceRelaxationScreenV1();
  console.log(JSON.stringify({
    reportId: WORK_CONJUGATE_ATRIAL_COMPLIANCE_RELAXATION_SCREEN_ID_V1,
    result: report.result,
    cases: report.cases.map((row) => ({
      caseId: row.caseId,
      complianceMlPerMmHg:
        row.fixedZPassiveComplianceReadback.complianceMlPerMmHg,
      rt50Sec: row.activationReadback.rt50Sec,
      xTheta: row.waveformReadback.xTheta,
      xDepthMmHg: row.waveformReadback.cToXDepthMmHg,
      yDepthMmHg: row.waveformReadback.yDepthMmHg,
      fusion: row.waveformReadback.mitralFusionClass,
      velocityAtAtrialOnsetCmPerSec:
        row.waveformReadback.velocityAtAtrialActivationOnsetCmPerSec,
    })),
  }, null, 2));
  process.exitCode = report.result.allCasesPassMechanicalHardGates ? 0 : 1;
}
