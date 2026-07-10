import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1,
  projectWorkConjugateAtrialAVPlaneArtifactV1,
  runWorkConjugateAtrialAVPlaneBenchV1,
} from "@/engine/mechanics2/benches/WorkConjugateAtrialAVPlaneBenchV1";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/work-conjugate-atrial-av-plane-report-v1.json",
);

export function writeWorkConjugateAtrialAVPlaneReportV1() {
  const fullReport = runWorkConjugateAtrialAVPlaneBenchV1();
  const report = projectWorkConjugateAtrialAVPlaneArtifactV1(fullReport);
  const normalized = JSON.stringify(report);
  const reportWithHash = {
    ...report,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  return reportWithHash;
}

export function workConjugateAtrialAVPlaneVerificationExitCodeV1(
  report: { readonly canonicalHardGates: { readonly allHardGatesPass: boolean } },
): 0 | 1 {
  return report.canonicalHardGates.allHardGatesPass ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const report = writeWorkConjugateAtrialAVPlaneReportV1();
  console.log(JSON.stringify({
    reportId: WORK_CONJUGATE_ATRIAL_AV_PLANE_REPORT_ID_V1,
    decision: report.decision,
    canonicalHardGates: report.canonicalHardGates,
    modelOrderResult: report.modelOrderResult,
    variants: report.variants.map((variant) => ({
      variantId: variant.variantId,
      hardGatePass: variant.hardGates.allHardGatesPass,
      allFinite: variant.profile.allFinite,
      allStepsConverged: variant.profile.allStepsConverged,
      allAcceptedSteps: variant.profile.allAcceptedSteps,
      periodic: variant.profile.periodicSteadyState,
      beats: variant.profile.beatsSimulated,
      aLoopAreaMmHgMl: variant.profile.laPvLobes.aLoopAreaMmHgMl,
      vLoopAreaMmHgMl: variant.profile.laPvLobes.vLoopAreaMmHgMl,
      aToVAreaRatio: variant.profile.laPvLobes.aToVAreaRatio,
      conduitBelowReservoir:
        variant.profile.pathOrdering.conduitBeforeCrossingBelowReservoirPathFraction,
      pumpingAboveReservoir:
        variant.profile.pathOrdering.pumpingAfterCrossingAboveReservoirPathFraction,
      mitralPeakEToA: variant.profile.mitral.peakEToARatio,
      mitralVtiEToA: variant.profile.mitral.vtiEToARatio,
      xDepthMmHg: variant.profile.xvyPressureReadback.xDescentDepthMmHg,
      zExcursionCm: variant.profile.zRangeCm[1] - variant.profile.zRangeCm[0],
      maxAbsVelocityCmPerSec: Math.max(
        Math.abs(variant.profile.uRangeCmPerSec[0]),
        Math.abs(variant.profile.uRangeCmPerSec[1]),
      ),
    })),
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
  const exitCode = workConjugateAtrialAVPlaneVerificationExitCodeV1(report);
  if (exitCode !== 0) {
    console.error("work-conjugate atrial AV-plane canonical hard gates failed; report was written for diagnosis");
  }
  process.exitCode = exitCode;
}
