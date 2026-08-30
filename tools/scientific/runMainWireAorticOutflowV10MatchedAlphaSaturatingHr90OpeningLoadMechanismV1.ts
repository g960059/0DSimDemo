import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1 } from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismV1";
import { runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const outputPath = optionalArgument("--output");
const cycleLengthSec = 60 / 90;

const runs =
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.map(
    (arm, index) => {
      process.stderr.write(
        `[${index + 1}/${MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.length}] ${arm.armId}\n`,
      );
      return runMainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchV1(
        { dtSec: cycleLengthSec / 2_000, maximumBeatCount: 72 },
        arm.armId,
      );
    },
  );

const analysis =
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
    runs,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  protocol: Object.freeze({
    heartRateBpm: 90 as const,
    stepsPerBeat: 2_000 as const,
    maximumBeatCount: 72 as const,
    independentCanonicalColdStartPerArm: true as const,
    mechanismAblationOnly: true as const,
    resolutionRole: "primary-scientific-readout" as const,
    volumeAxisIntervention: Object.freeze({
      ...analysis.analysisClaim.volumeAxisIntervention,
    }),
    canonicalHeartRateDependentLoadRecalibrationProposed: false as const,
  }),
  exactIdentities: Object.freeze(
    runs.map((run) =>
      Object.freeze({
        armId: run.openingLoadMechanismArm.armId,
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

const contrastById = new Map(
  analysis.factorialContrasts.map((contrast) => [contrast.metricId, contrast]),
);
process.stdout.write(
  `${JSON.stringify({
    methodId: analysis.methodId,
    outputPath: resolvedOutputPath,
    byteLength: Buffer.byteLength(serialized),
    mechanismAblationOnly: analysis.analysisClaim.mechanismAblationOnly,
    resolutionRole: "primary-scientific-readout" as const,
    stepsPerBeat: 2_000 as const,
    volumeAxisIntervention: analysis.analysisClaim.volumeAxisIntervention,
    canonicalHeartRateDependentLoadRecalibrationProposed: false,
    allArmsPeriod1AndIntegrationPassed:
      analysis.allArmsPeriod1AndIntegrationPassed,
    allArmsInterpretationEligible: analysis.allArmsInterpretationEligible,
    hashIsolation: analysis.hashIsolation,
    arms: analysis.armsInCatalogOrder.map((measured) => {
      const metrics = measured.metrics;
      return Object.freeze({
        armId: measured.arm.armId,
        completedBeatCount: measured.ledger.completedBeatCount,
        canonicalIctMs: milliseconds(metrics.canonicalIctSec),
        mvcToCalciumRiseMs: milliseconds(
          metrics.mitralClosureToCalciumRiseSignedSec,
        ),
        calciumRiseToLocalGradientZeroMs: milliseconds(
          metrics.calciumRiseToExactLocalGradientPositiveSec,
        ),
        localGradientZeroToStrictFlowMs: milliseconds(
          metrics.exactLocalGradientPositiveToStrictPositiveFlowSec,
        ),
        strictFlowToCanonicalAvoMs: milliseconds(
          metrics.strictPositiveFlowToCanonicalOnePercentAvoSec,
        ),
        calciumRiseToCanonicalAvoMs: milliseconds(
          metrics.calciumRiseToCanonicalAvoSec,
        ),
        calciumRiseD0MmHg:
          metrics.calciumRiseInitialProximalPortMinusLvDeficitMmHg,
        calciumRiseInitialLvPressureMmHg:
          metrics.calciumRiseInitialLvPressureMmHg,
        calciumRiseInitialProximalPortPressureMmHg:
          metrics.calciumRiseInitialProximalPortPressureMmHg,
        lvPressureRiseToLocalZeroMmHg:
          metrics.calciumRiseLvPressureRiseToLocalZeroMmHg,
        proximalPortPressureChangeToLocalZeroMmHg:
          metrics.calciumRiseProximalPortPressureChangeToLocalZeroMmHg,
        meanLvPressureRiseRateMmHgPerSec:
          metrics.calciumRiseMeanLvPressureRiseRateMmHgPerSec,
        meanProximalPortPressureChangeRateMmHgPerSec:
          metrics.calciumRiseMeanProximalPortPressureChangeRateMmHgPerSec,
        maximumLeftVentricularVolumeMl: metrics.maximumLeftVentricularVolumeMl,
        calciumRiseAcceptedEndpointLeftVentricularVolumeMl:
          metrics.calciumRiseAcceptedEndpointLeftVentricularVolumeMl,
        onePercentFlowEjectionTimeMs: milliseconds(
          metrics.onePercentFlowInterpolatedEjectionTimeSec,
        ),
        meanDopplerGradientMmHg: metrics.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: metrics.peakDopplerGradientMmHg,
        strokeVolumeMl: metrics.strokeVolumeMl,
        meanAorticPressureMmHg: metrics.meanAorticPressureMmHg,
        maximumPositiveLeftVentricularDpdtMmHgPerSec:
          metrics.maximumPositiveLeftVentricularDpdtMmHgPerSec,
        leftVentricularTeiIndex: metrics.leftVentricularTeiIndex,
        leftVentricularIvrtMs: milliseconds(metrics.leftVentricularIvrtSec),
        mitralPeakEToARatio: metrics.mitralPeakEToARatio,
        mitralForwardVolumeEToARatio: metrics.mitralForwardVolumeEToARatio,
        mitralModeledVtiEToARatio: metrics.mitralModeledVtiEToARatio,
      });
    }),
    primaryMechanismContrasts: Object.freeze({
      canonicalIct: contrastById.get("canonicalIctSec"),
      mvcToCalciumRise: contrastById.get("mitralClosureToCalciumRiseSignedSec"),
      calciumRiseToLocalGradientZero: contrastById.get(
        "calciumRiseToExactLocalGradientPositiveSec",
      ),
      calciumRiseD0: contrastById.get(
        "calciumRiseInitialProximalPortMinusLvDeficitMmHg",
      ),
      lvPressureRiseToLocalZero: contrastById.get(
        "calciumRiseLvPressureRiseToLocalZeroMmHg",
      ),
      proximalPortPressureChangeToLocalZero: contrastById.get(
        "calciumRiseProximalPortPressureChangeToLocalZeroMmHg",
      ),
    }),
    factorialContrasts: analysis.factorialContrasts,
  })}\n`,
);

function milliseconds(value: number | null): number | null {
  return value === null ? null : value * 1_000;
}

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
