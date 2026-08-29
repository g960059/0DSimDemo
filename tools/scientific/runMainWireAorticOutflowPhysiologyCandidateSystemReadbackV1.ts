import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1,
} from "@/analysis/methods/mainWire/MainWireAorticProximalCharacteristicImpedanceDecompositionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V3 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V3_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV3";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_SYSTEM_READBACK_V1_ID =
  "main-wire-aortic-outflow-physiology-candidate-system-readback-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const canonicalResult = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
  dtSec,
  maximumBeatCount,
  laSlsMode: "on",
  pericardiumMode: "on",
  pericardiumCase: "healthy-slack",
  initialization: "canonical",
  valveDiseaseBracketIds: Object.freeze([]),
});
const candidateRun =
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
  );

const arms = Object.freeze([
  arm("canonical", canonicalResult, FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1),
  arm("candidate", candidateRun.periodicResult, candidateRun.calciumDriveParams),
]);
const candidateProximalCharacteristicImpedanceDecomposition =
  measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1(
    candidateRun.periodicResult,
    candidateRun.placementProfile!,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_SYSTEM_READBACK_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    independentCanonicalColdStartPerArm: true as const,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V3_CLAIM,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  candidateProximalCharacteristicImpedanceDecomposition,
  interpretationBoundary: Object.freeze({
    allMetricsAreAcceptedLastCompleteBeatReadbacks: true as const,
    mitralDctIsObservedEPeakToValleySurrogateNotClinicalExtrapolatedDct:
      true as const,
    pulmonaryVenousSignalIsAggregateFlowNotVeinDopplerVelocity: true as const,
    formalPressureVolumeAreaComputed: false as const,
    noClinicalPassFailApplied: true as const,
    canonicalAdoptionEstablished: false as const,
  }),
});
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (outputPath === null) {
  process.stdout.write(serialized);
} else {
  const absoluteOutputPath = path.resolve(outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    arms: arms.map((entry) => ({
      armId: entry.armId,
      terminationReason: entry.aorticOutflow.terminationReason,
      ejectionTimeMs: entry.aorticOutflow.aorticEjectionTimeProxySec * 1000,
      isovolumicContractionTimeMs:
        entry.aorticOutflow.leftVentricularIsovolumicContractionTimeSec === null
          ? null
          : entry.aorticOutflow.leftVentricularIsovolumicContractionTimeSec
            * 1000,
      isovolumicRelaxationTimeMs:
        entry.aorticOutflow.leftVentricularIsovolumicRelaxationTimeSec === null
          ? null
          : entry.aorticOutflow.leftVentricularIsovolumicRelaxationTimeSec
            * 1000,
      leftVentricularTeiIndex:
        entry.aorticOutflow.leftVentricularTeiIndex,
      maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
        entry.aorticOutflow
          .maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
        entry.aorticOutflow
          .maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      aorticForwardVolumeMl: entry.aorticOutflow.aorticForwardVolumeMl,
      aorticConfiguredMaximumForwardEoaCm2:
        entry.aorticOutflow.aorticConfiguredMaximumForwardEoaCm2,
      aorticForwardFlowContinuityEquivalentEoaCm2:
        entry.aorticOutflow.aorticForwardFlowContinuityEquivalentEoaCm2,
      aorticMeanGradientEquivalentEoaCm2:
        entry.aorticOutflow.aorticMeanGradientEquivalentEoaCm2,
      meanDopplerGradientMmHg: entry.aorticOutflow.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.aorticOutflow.peakDopplerGradientMmHg,
      aorticDynamicAreaDopplerPenaltyFactor:
        entry.aorticOutflow.aorticDynamicAreaDopplerPenaltyFactor,
      aorticJetVelocityWaveformNonuniformityFactor:
        entry.aorticOutflow.aorticJetVelocityWaveformNonuniformityFactor,
      diastolicFlow: entry.diastolicFlow.value,
      diastolicFlowUnavailabilityReason: entry.diastolicFlow.reason,
      valveAreaCm2: Object.fromEntries(Object.entries(entry.valves.valves)
        .map(([valveId, valve]) => [
          valveId,
          valve.configuredMaximumForwardEoaCm2,
        ])),
    })),
    candidateProximalCharacteristicImpedanceDecomposition,
  })}\n`);
}

function arm(
  armId: "canonical" | "candidate",
  periodicResult: Parameters<
    typeof measureMainWireValveDiseaseCycleMetricsV1
  >[0],
  calciumDriveParams: Parameters<
    typeof measureMainWireAorticOutflowCalciumWaveformCycleV1
  >[1],
) {
  return Object.freeze({
    armId,
    protocolIdentityHash: periodicResult.protocolIdentityHash,
    aorticOutflow: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      periodicResult,
      calciumDriveParams,
      armId,
    ),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        periodicResult,
      ),
    valves: measureMainWireValveDiseaseCycleMetricsV1(periodicResult),
    summary: summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
      periodicResult,
    ),
  });
}

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
