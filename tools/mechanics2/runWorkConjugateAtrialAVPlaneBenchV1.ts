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
const lvRelaxationPhenotypeOutputPath = resolve(
  repoRoot,
  "data/mechanics2/reports/work-conjugate-atrial-av-plane-lv-relaxation-phenotype-v1.json",
);

export function writeWorkConjugateAtrialAVPlaneReportV1() {
  const fullReport = runWorkConjugateAtrialAVPlaneBenchV1();
  const report = projectWorkConjugateAtrialAVPlaneArtifactV1(fullReport);
  assertFiniteJsonNumbersV1(report);
  const normalized = JSON.stringify(report);
  const reportWithHash = {
    ...report,
    normalizedSha256: createHash("sha256").update(normalized).digest("hex"),
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(reportWithHash, null, 2)}\n`);
  const lvRelaxationPhenotype = fullReport.lvRelaxationPhenotypeScreen;
  assertFiniteJsonNumbersV1(
    lvRelaxationPhenotype,
    "lvRelaxationPhenotypeScreen",
  );
  const normalizedLvRelaxationPhenotype = JSON.stringify(
    lvRelaxationPhenotype,
  );
  const lvRelaxationPhenotypeWithHash = {
    ...lvRelaxationPhenotype,
    normalizedSha256: createHash("sha256")
      .update(normalizedLvRelaxationPhenotype)
      .digest("hex"),
  };
  writeFileSync(
    lvRelaxationPhenotypeOutputPath,
    `${JSON.stringify(lvRelaxationPhenotypeWithHash, null, 2)}\n`,
  );
  return reportWithHash;
}

/**
 * JSON.stringify silently converts NaN and infinities to null.  Report writers
 * must fail closed instead so a numerical failure cannot masquerade as an
 * intentional censored/null measurement.
 */
export function assertFiniteJsonNumbersV1(
  value: unknown,
  path = "root",
  visited = new WeakSet<object>(),
): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} must be a finite JSON number`);
    }
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (visited.has(value)) {
    throw new Error(`${path} contains a circular object reference`);
  }
  visited.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertFiniteJsonNumbersV1(item, `${path}[${index}]`, visited)
    );
  } else {
    for (const [key, item] of Object.entries(value)) {
      assertFiniteJsonNumbersV1(item, `${path}.${key}`, visited);
    }
  }
  visited.delete(value);
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
      mitralMeasurementValid: variant.profile.mitral.measurementValid,
      mitralPeakEToA: variant.profile.mitral.peakEToARatio,
      mitralVtiEToA: variant.profile.mitral.vtiEToARatio,
      xDepthMmHg: variant.profile.xvyPressureReadback.xDescentDepthMmHg,
      yDepthMmHg: variant.profile.xvyPressureReadback.yDescentDepthMmHg,
      yDepthMeasurementStatus:
        variant.profile.xvyPressureReadback.yDescentMeasurementStatus,
      activationModel: variant.profile.activationReadback.modelKind,
      activationTtpSec:
        variant.profile.activationReadback.laEventToContractilePeakSec,
      activationRt50Sec:
        variant.profile.activationReadback.laContractileRt50Sec,
      pressurePeakVolumePositionFraction:
        variant.profile.activationReadback.pressurePeakVolumePosition
          .fractionFromMinimumToEventVolume,
      zExcursionCm: variant.profile.zRangeCm[1] - variant.profile.zRangeCm[0],
      maxAbsVelocityCmPerSec: Math.max(
        Math.abs(variant.profile.uRangeCmPerSec[0]),
        Math.abs(variant.profile.uRangeCmPerSec[1]),
      ),
    })),
    staticRootEnvelope: {
      caseCount: report.staticRootEnvelope.caseCount,
      uniqueStableRootCaseCount:
        report.staticRootEnvelope.uniqueStableRootCaseCount,
      zeroRootCaseCount: report.staticRootEnvelope.zeroRootCaseCount,
      multipleRootCaseCount: report.staticRootEnvelope.multipleRootCaseCount,
      unstableRootCaseCount: report.staticRootEnvelope.unstableRootCaseCount,
      minimumRootBoundaryMarginCm:
        report.staticRootEnvelope.minimumRootBoundaryMarginCm,
      maximumAbsRootForceResidualN:
        report.staticRootEnvelope.maximumAbsRootForceResidualN,
      minimumAbsNetForceDerivativeNPerCm:
        report.staticRootEnvelope.minimumAbsNetForceDerivativeNPerCm,
    },
    activationDtSensitivity: report.activationDtSensitivity,
    phaseAttribution: {
      role: report.phaseAttribution.role,
      physiologyHardGated: report.phaseAttribution.physiologyHardGated,
      literatureContext: report.phaseAttribution.literatureContext,
      reference: report.phaseAttribution.reference.readback,
      factors: report.phaseAttribution.factors.map((factor) => ({
        factorId: factor.factorId,
        parameterPath: factor.parameterPath,
        referenceValue: factor.referenceValue,
        cases: factor.cases.map((row) => ({
          caseId: row.caseId,
          parameterValue: row.parameterValue,
          allHardGatesPass: row.numerics.allHardGatesPass,
          readback: row.readback,
        })),
      })),
    },
    activationAvpdInteraction: {
      role: report.activationAvpdInteraction.role,
      design: report.activationAvpdInteraction.design,
      explicitActivationTimesAvPlaneCrossTerm:
        report.activationAvpdInteraction
          .explicitActivationTimesAvPlaneCrossTerm,
      avPlaneTrajectoryPrescribed:
        report.activationAvpdInteraction.avPlaneTrajectoryPrescribed,
      factors: report.activationAvpdInteraction.factors,
      cases: report.activationAvpdInteraction.cases.map((row) => ({
        caseId: row.caseId,
        riseTauSec: row.activationCalciumRiseTauSec,
        lvLongitudinalActiveStressMaxRatio:
          row.lvLongitudinalToCircumferentialActiveStressMaxRatio,
        changedParameterPaths: row.changedParameterPaths,
        exactDeclaredPathMatch:
          row.configurationAudit.exactDeclaredPathMatch,
        allHardGatesPass: row.numerics.allHardGatesPass,
        readback: row.readback,
      })),
      interactionContrast:
        report.activationAvpdInteraction.interactionContrast,
      discretizationRobustness:
        report.activationAvpdInteraction.discretizationRobustness,
      evidenceBoundary:
        report.activationAvpdInteraction.evidenceBoundary,
    },
    lvRelaxationPhenotypeScreen: {
      role: report.lvRelaxationPhenotypeScreen.role,
      legacyLvSubstitutionStatus:
        report.lvRelaxationPhenotypeScreen.legacyLvSubstitutionAudit
          .calibration.status,
      phenotypeContract:
        report.lvRelaxationPhenotypeScreen.phenotypeContract,
      cases: report.lvRelaxationPhenotypeScreen.cases.map((row) => ({
        caseId: row.caseId,
        rt50DoseFactor: row.rt50DoseFactor,
        calibrationStatus: row.calibration.status,
        localJacobianCondition: row.calibration.localJacobianCondition,
        numerics: row.numerics,
        readback: row.readback,
      })),
      discretizationRobustness:
        report.lvRelaxationPhenotypeScreen.discretizationRobustness,
      result: report.lvRelaxationPhenotypeScreen.result,
    },
    normalizedSha256: report.normalizedSha256,
  }, null, 2));
  const exitCode = workConjugateAtrialAVPlaneVerificationExitCodeV1(report);
  if (exitCode !== 0) {
    console.error("work-conjugate atrial AV-plane canonical hard gates failed; report was written for diagnosis");
  }
  process.exitCode = exitCode;
}
