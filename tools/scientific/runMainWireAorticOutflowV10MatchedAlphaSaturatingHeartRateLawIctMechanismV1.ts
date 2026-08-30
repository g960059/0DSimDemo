import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.map(
    (arm, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_MAIN_ARMS_V1.length}] ${arm.armId}\n`,
      );
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHeartRateLawResearchV1(
          { dtSec: arm.dtSec, maximumBeatCount: arm.maximumBeatCount },
          arm.calciumProfileId,
        );
      return Object.freeze({ arm, run });
    },
  );

const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1(
    runs.map(({ arm, run }) =>
      Object.freeze({
        arm,
        calciumProfile: run.saturatingHeartRateLawProfile,
        calciumDriveParams: run.calciumDriveParams,
        periodicResult: run.periodicResult,
        referenceNonCalciumAssembly: run.referenceNonCalciumAssembly,
        exactAssemblyAudit: run.exactAssemblyAudit,
      }),
    ),
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  exactIdentities: Object.freeze(
    runs.map(({ arm, run }) =>
      Object.freeze({
        armId: arm.armId,
        protocolIdentityHash: run.periodicResult.protocolIdentityHash,
        protocolComponentHashes: run.periodicResult.protocolComponentHashes,
        exactAssemblyAudit: run.exactAssemblyAudit,
        runnerClaim: run.claim,
      }),
    ),
  ),
  analysis,
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

let resolvedOutputPath: string | null = null;
if (outputPath !== null) {
  resolvedOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, serialized, "utf8");
}

process.stdout.write(
  `${JSON.stringify({
    methodId: analysis.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    allArmsInterpretationEligible: analysis.allArmsInterpretationEligible,
    allIctIdentitiesWithinTolerance: analysis.allIctIdentitiesWithinTolerance,
    allEventDefinitionSensitivitySemanticsAligned:
      analysis.allEventDefinitionSensitivitySemanticsAligned,
    arms: analysis.armsSortedByHeartRate.map((measured) => {
      const ict = measured.ictDecomposition;
      const caPressure = measured.calciumRisePressureBuildToLocalOpening;
      const mitralFlow = measured.mitralFilling.existingDiastolicFlowReadback;
      const closure = measured.mitralClosureDefinitions;
      return Object.freeze({
        armId: measured.arm.armId,
        heartRateBpm: measured.arm.heartRateBpm,
        completedBeatCount: measured.completedBeatCount,
        interpretationEligible: measured.interpretationEligible,
        canonicalIctMs: ict.canonicalFlowThresholdIctSec * 1_000,
        mvcToCalciumOnePercentRiseMs:
          ict.mitralClosureToCalciumRiseSignedSec * 1_000,
        calciumRiseToLocalGradientZeroMs:
          ict.calciumRiseToExactLocalGradientPositiveSec * 1_000,
        localGradientZeroToStrictFlowMs:
          ict.exactLocalGradientPositiveToStrictPositiveFlowSec * 1_000,
        strictFlowToOnePercentAvoMs:
          ict.strictPositiveFlowToCanonicalOnePercentAvoSec * 1_000,
        calciumRiseToOnePercentAvoMs: ict.calciumRiseToCanonicalAvoSec * 1_000,
        calciumRiseInitialLocalPressureDeficitMmHg:
          caPressure.initialProximalPortMinusLeftVentricleDeficitMmHg,
        calciumRiseToLocalGradientZeroLvPressureRiseMmHg:
          caPressure.leftVentricularPressureRiseMmHg,
        calciumRiseToLocalGradientZeroProximalPortPressureChangeMmHg:
          caPressure.proximalPortPressureChangeMmHg,
        calciumRiseToLocalGradientZeroMeanLvPressureRiseRateMmHgPerSec:
          caPressure.meanLeftVentricularPressureRiseRateMmHgPerSec,
        strictMitralFlowEndMinusCanonicalMvcMs:
          closure.strictFlowEndMinusCanonicalMvcSec * 1_000,
        mitralPressureReversalMinusCanonicalMvcMs:
          closure.pressureReversalMinusCanonicalMvcSec * 1_000,
        mitralFinalTargetZeroMinusCanonicalMvcMs:
          closure.openingTargetZeroMinusCanonicalMvcSec * 1_000,
        mitralLeafletClosureSensitivity: Object.fromEntries(
          Object.entries(closure.leafletClosureSensitivity).map(
            ([threshold, readback]) => [
              threshold,
              Object.freeze({
                status: readback.status,
                crossingMinusCanonicalMvcMs:
                  readback.crossingMinusCanonicalMvcSec === null
                    ? null
                    : readback.crossingMinusCanonicalMvcSec * 1_000,
              }),
            ],
          ),
        ),
        mitralOpeningTargetAtCanonicalAvo01:
          closure.openingTargetAtCanonicalAvo01,
        mitralLeafletOpeningFractionAtCanonicalAvo01:
          closure.leafletOpeningFractionAtCanonicalAvo01,
        mitralPeakEToARatio: mitralFlow.peakEToARatio,
        mitralForwardVolumeEToARatio: mitralFlow.forwardVolumeEToARatio,
        mitralModeledVtiEToARatio: mitralFlow.modeledVtiEToARatio,
        mitralFusedOrUnresolved: measured.mitralFilling.fusedOrUnresolved,
        onePercentFlowEjectionTimeMs:
          measured.onePercentFlowEjectionTime.interpolatedEjectionTimeSec *
          1_000,
        strokeVolumeMl: measured.cycleMetrics.aorticForwardVolumeMl,
        meanDopplerGradientMmHg: measured.cycleMetrics.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: measured.cycleMetrics.peakDopplerGradientMmHg,
        maximumPositiveDpdtMmHgPerSec:
          measured.cycleMetrics
            .maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        maximumLeftVentricularVolumeMl:
          measured.cycleMetrics.maximumLeftVentricularVolumeMl,
        meanAorticPressureMmHg:
          measured.cycleMetrics.meanAorticAbsolutePressureMmHg,
      });
    }),
    heartRate90Minus50: analysis.heartRate90Minus50,
  })}\n`,
);

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`),
  );
  if (equalsArgument !== undefined) {
    const value = equalsArgument.slice(name.length + 1);
    if (value === "") throw new Error(`${name} requires a value`);
    return value;
  }
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}
