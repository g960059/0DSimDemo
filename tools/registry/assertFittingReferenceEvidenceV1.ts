import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessMainWireBaselineGateProvenanceV1 } from
  "@/analysis/registry/MainWireBaselineGateProvenanceV1";
import { assertFittingGateProvenanceReadyV1 } from
  "@/analysis/registry/FittingGateProvenanceV1";

const root = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));

export function assessRegisteredFittingReferenceEvidenceV1(referenceId: string) {
  if (referenceId !== "baseline") throw new Error(`Unregistered fitting reference: ${referenceId}`);
  return assessMainWireBaselineGateProvenanceV1(ref => {
    try {
      const file = realpathSync(path.resolve(root, ref.path));
      return file.startsWith(root + path.sep) && readFileSync(file, "utf8").includes(ref.locator);
    } catch { return false; }
  });
}

/** Called before baseline-generation writes; research fitting remains available. */
export function assertRegisteredFittingReferenceEvidenceReadyV1(referenceId: string): void {
  assertFittingGateProvenanceReadyV1(assessRegisteredFittingReferenceEvidenceV1(referenceId));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assessment = assessRegisteredFittingReferenceEvidenceV1("baseline");
  process.stdout.write(`${JSON.stringify(assessment, null, 2)}\n`);
  if (assessment.status !== "evidence-ready") process.exitCode = 1;
}
