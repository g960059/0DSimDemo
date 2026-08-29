import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCandidateCirculatoryRecalibrationV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCandidateCirculatoryRecalibrationV1";
import type {
  MainWireAorticValveObservationGeometryV1,
} from "@/analysis/methods/mainWire/MainWireAorticValveObservationStationsV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_V1_ID,
  resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowCandidateCirculatoryRecalibrationV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V7 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V7_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV7";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const GEOMETRY = Object.freeze({
  geometryId: "fixed-lvot-d2p3cm-aa-d3p0cm-v1",
  provenance: "fixed-research-bracket" as const,
  lvotCrossSectionalAreaCm2: Math.PI * (2.3 / 2) ** 2,
  ascendingAorticCrossSectionalAreaCm2: Math.PI * (3 / 2) ** 2,
}) satisfies MainWireAorticValveObservationGeometryV1;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const inputs =
  MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CONTEXT_IDS_V1
    .map((contextId) => {
      const context =
        resolveMainWireAorticOutflowCandidateCirculatoryRecalibrationContextV1(
          contextId,
        );
      return Object.freeze({
        contextId,
        run:
          runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
            { dtSec, maximumBeatCount },
            CANDIDATE.kuwProfileId,
            CANDIDATE.complianceProfileId,
            CANDIDATE.characteristicResistancePlacementProfileId,
            CANDIDATE.rootInertanceProfileId,
            CANDIDATE.sarcomereReferenceProfileId,
            CANDIDATE.calciumSensitivityLengthProfileId,
            CANDIDATE.twitchRetentionCandidateId,
            context.circulatoryLoadPointId,
            context.stressedVenousVolumePointId,
            CANDIDATE.trefForceLoadProfileId,
            CANDIDATE.sourceVelocityDistortionProfileId,
            CANDIDATE.strongBridgeDeactivationExitProfileId,
            CANDIDATE.atrioventricularDelayProfileId,
          ),
      });
    });
const analysis =
  measureMainWireAorticOutflowCandidateCirculatoryRecalibrationV1(
    inputs,
    GEOMETRY,
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    geometry: GEOMETRY,
    candidate: CANDIDATE,
    candidateClaim: MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V7_CLAIM,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_CANDIDATE_CIRCULATORY_RECALIBRATION_CLAIM_V1,
  }),
  analysis,
  interpretationBoundary: Object.freeze({
    aorticEtMechanismHeldFixedAcrossFactorial: true as const,
    gridLocalizesCirculatorySideEffects: true as const,
    gridDoesNotDefineClinicalTargetsOrWeights: true as const,
    candidateSelectionOrCanonicalAdoptionEstablished: false as const,
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
    allRunsPeriod1AndIntegrated: analysis.allRunsPeriod1AndIntegrated,
    allArmsHaveOneProminentAorticFlowPeak:
      analysis.allArmsHaveOneProminentAorticFlowPeak,
    maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum:
      analysis
        .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
    rangesAcrossFactorial: analysis.rangesAcrossFactorial,
    arms: analysis.arms.map((arm) => {
      const cycle = arm.readback.cycle;
      const filling = arm.readback.fillingAndPressureReadback;
      const diastolic = arm.diastolicFlow.value;
      return {
        contextId: arm.context.contextId,
        pulmonaryResistanceScale:
          arm.context.pulmonaryResistanceScaleFromBaseline,
        stressedVolumeScale:
          arm.context.canonicalAdditionalStressedVenousVolumeScale,
        fixedTotalBloodVolumeMl: filling.fixedTotalBloodVolumeMl,
        ejectionTimeMs: cycle.aorticEjectionTimeProxySec * 1000,
        isovolumicContractionTimeMs:
          cycle.leftVentricularIsovolumicContractionTimeSec === null
            ? null
            : cycle.leftVentricularIsovolumicContractionTimeSec * 1000,
        leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
        maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec:
          cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
        maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec:
          cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
        aorticForwardVolumeMl: cycle.aorticForwardVolumeMl,
        peakVenaContractaVelocityMPerSec:
          cycle.peakVenaContractaVelocityMPerSec,
        meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
        peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
        meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
        leftVentricularEjectionFraction01:
          cycle.leftVentricularEjectionFraction01,
        meanAbsolutePressureMmHg: arm.system.meanAbsolutePressureMmHg,
        chamberVolumeRangeMl: arm.system.chamberVolumeRangeMl,
        leftVentricularEndDiastolicVolumeMl:
          filling.leftVentricularEndDiastolicVolumeMl,
        ivrtLikeMs: diastolic === null
          ? null
          : diastolic.relaxation.ivrtLikeSec * 1000,
        relaxationTauMs: diastolic?.relaxation.relaxationTauSec === null
          || diastolic === null
          ? null
          : diastolic.relaxation.relaxationTauSec * 1000,
        pulmonaryVenousAtrialReversalVolumeMl: diastolic === null
          ? null
          : diastolic.pulmonaryVenous.atrialReversalVolumeMl,
        terminationReason: cycle.terminationReason,
        flowPeakCount: cycle.aorticFlowPeakCountAboveFivePercent,
        distinctFlowPeakCount:
          cycle.aorticFlowDistinctPeakCountAboveFivePercent,
        maximumSecondaryFlowPeakProminenceFractionOfGlobalMaximum:
          cycle.maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
      };
    }),
    pulmonaryResistanceContrasts: analysis.pulmonaryResistanceContrasts,
    stressedVenousVolumeContrasts: analysis.stressedVenousVolumeContrasts,
  })}\n`);
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
