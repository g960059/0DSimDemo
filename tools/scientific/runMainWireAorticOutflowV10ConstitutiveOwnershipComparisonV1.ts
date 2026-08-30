import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowV10ConstitutiveOwnershipV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10ConstitutiveOwnershipComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V10 as CANDIDATE,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV10";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1,
  resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10ConstitutiveOwnershipAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const inputs = MAIN_WIRE_AORTIC_OUTFLOW_V10_CONSTITUTIVE_OWNERSHIP_ARM_IDS_V1
  .map((armId) => {
    const arm = resolveMainWireAorticOutflowV10ConstitutiveOwnershipArmV1(
      armId,
    );
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
        { dtSec, maximumBeatCount },
        CANDIDATE.kuwProfileId,
        CANDIDATE.complianceProfileId,
        CANDIDATE.characteristicResistancePlacementProfileId,
        CANDIDATE.rootInertanceProfileId,
        CANDIDATE.sarcomereReferenceProfileId,
        CANDIDATE.calciumSensitivityLengthProfileId,
        CANDIDATE.twitchRetentionCandidateId,
        "baseline",
        "baseline",
        CANDIDATE.trefForceLoadProfileId,
        CANDIDATE.sourceVelocityDistortionProfileId,
        CANDIDATE.strongBridgeDeactivationExitProfileId,
        CANDIDATE.atrioventricularDelayProfileId,
        arm.pressureRecoveryProfileId,
        arm.recoveredRootPortValveProfileId,
      );
    return Object.freeze({ arm, run });
  });

const comparison =
  compareMainWireAorticOutflowV10ConstitutiveOwnershipV1(inputs);
const artifact = Object.freeze({
  artifactSchemaVersion: 1 as const,
  dtSec,
  maximumBeatCount,
  comparison,
});
const serialized = `${JSON.stringify(artifact, null, 2)}\n`;

if (outputPath !== null) {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
}

process.stdout.write(`${JSON.stringify({
  methodId: comparison.methodId,
  dtSec,
  maximumBeatCount,
  outputPath: outputPath === null ? null : path.resolve(outputPath),
  allProtocolIdentitiesDistinct: comparison.allProtocolIdentitiesDistinct,
  allRunsPeriod1AndIntegrated: comparison.allRunsPeriod1AndIntegrated,
  allOwnedOpeningTargetsWithinTolerance:
    comparison.allOwnedOpeningTargetsWithinTolerance,
  allResistanceReadbacksWithinTolerance:
    comparison.allResistanceReadbacksWithinTolerance,
  allExactPowerBalancesWithinTolerance:
    comparison.allExactPowerBalancesWithinTolerance,
  v10ExactEvaluatorProximalPortReadbackAvailableAndWithinTolerance:
    comparison
      .v10ExactEvaluatorProximalPortReadbackAvailableAndWithinTolerance,
  v10CompatibilityDissipationMatchesReconstructedValveIrreversibleEnergy:
    comparison
      .v10CompatibilityDissipationMatchesReconstructedValveIrreversibleEnergy,
  arms: comparison.arms.map((measured) => ({
    armId: measured.arm.armId,
    candidateId: measured.arm.candidateId,
    openingDrivePressureStation:
      measured.arm.openingDrivePressureStation,
    protocolIdentityHash: measured.protocolIdentityHash,
    terminationReason: measured.cycle.terminationReason,
    completedBeatCount: measured.cycle.completedBeatCount,
    ejectionTimeMs: measured.cycle.aorticEjectionTimeProxySec * 1000,
    accelerationTimeMs:
      measured.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
    strokeVolumeMl: measured.cycle.aorticForwardVolumeMl,
    peakFlowMlPerSec: measured.cycle.aorticMaximumFlowMlPerSec,
    meanDopplerGradientMmHg: measured.cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: measured.cycle.peakDopplerGradientMmHg,
    meanLvotCorrectedDopplerGradientMmHg:
      measured.pressureStations.timeMeanGradientMmHg.lvotCorrectedDoppler,
    peakLvotCorrectedDopplerGradientMmHg:
      measured.pressureStations.peakInstantaneousGradientMmHg
        .lvotCorrectedDoppler,
    meanRawNodeGradientMmHg:
      measured.pressureStations.timeMeanGradientMmHg.rawLvMinusReservoirNode,
    peakRawNodeGradientMmHg:
      measured.pressureStations.peakInstantaneousGradientMmHg
        .rawLvMinusReservoirNode,
    meanLocalPortGradientMmHg:
      measured.pressureStations.timeMeanGradientMmHg
        .exactLvMinusProximalPort,
    peakLocalPortGradientMmHg:
      measured.pressureStations.peakInstantaneousGradientMmHg
        .exactLvMinusProximalPort,
    meanAorticComplianceNodePressureMmHg:
      measured.pressureStations.absolutePressureMmHg.meanAorticReservoirNode,
    meanProximalConstitutivePortPressureMmHg:
      measured.pressureStations.absolutePressureMmHg
        .meanAlgebraicProximalPort,
    ictMs: measured.cycle.leftVentricularIsovolumicContractionTimeSec === null
      ? null
      : measured.cycle.leftVentricularIsovolumicContractionTimeSec * 1000,
    ivrtMs:
      measured.cycle.leftVentricularIsovolumicRelaxationTimeSec === null
        ? null
        : measured.cycle.leftVentricularIsovolumicRelaxationTimeSec * 1000,
    teiIndex: measured.cycle.leftVentricularTeiIndex,
    maximumPositiveDPressureDtMmHgPerSec:
      measured.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    maximumNegativeDPressureDtMagnitudeMmHgPerSec:
      measured.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
    leftVentricularEjectionFraction01:
      measured.cycle.leftVentricularEjectionFraction01,
    aorticDistinctPeakCount:
      measured.cycle.aorticFlowDistinctPeakCountAboveFivePercent,
    constitutiveAudit: measured.constitutiveAudit,
  })),
  contrasts: comparison.contrasts,
})}\n`);

function optionalArgument(name: string): string | null {
  const equalsArgument = process.argv.find((argument) =>
    argument.startsWith(`${name}=`));
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

function numericArgument(name: string, fallback: number): number {
  const value = optionalArgument(name);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!(parsed > 0) || !Number.isFinite(parsed)) {
    throw new Error(`${name} must be positive and finite`);
  }
  return parsed;
}

function integerArgument(name: string, fallback: number): number {
  const value = numericArgument(name, fallback);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
}
