import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_CLAIM_V1,
  measureMainWireAtrioventricularDelayBracketV1,
} from "@/analysis/methods/mainWire/MainWireAtrioventricularDelayBracketV1";
import {
  MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
  MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_V1_ID,
  MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
} from "@/engine/myocardium/calcium/MainWireAtrioventricularDelayBracketV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8_CLAIM,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowPhysiologyCandidateV8";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_RUNNER_V1_ID =
  "main-wire-atrioventricular-delay-bracket-runner-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const runs = MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
  (profileId) => {
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
        profileId,
      );
    return Object.freeze({ profileId, run });
  },
);

const analysis = measureMainWireAtrioventricularDelayBracketV1(
  runs.map(({ profileId, run }) => Object.freeze({
    profileId,
    calciumDriveParams: run.calciumDriveParams,
    periodicResult: run.periodicResult,
  })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_RUNNER_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    bracketId: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_V1_ID,
    profileIds: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
    bracketClaim: MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_ATRIOVENTRICULAR_DELAY_BRACKET_ANALYSIS_CLAIM_V1,
    fixedAorticOutflowCandidateExceptBracketedAtrioventricularDelayAxis:
      CANDIDATE,
    fixedAorticOutflowCandidateClaimExceptBracketedAtrioventricularDelayAxis:
      MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGY_CANDIDATE_V8_CLAIM,
    independentCanonicalColdStartPerArm: true as const,
    parameterOptimizationOrFitApplied: false as const,
  }),
  exactIdentities: Object.freeze(runs.map(({ profileId, run }) =>
    Object.freeze({
      profileId,
      calciumParameterSetId: run.calciumDriveParams.parameterSetId,
      protocolIdentityHash: run.periodicResult.protocolIdentityHash,
      protocolComponentHashes: run.periodicResult.protocolComponentHashes,
      runnerClaim: run.claim,
    }))),
  analysis,
  interpretationBoundary: Object.freeze({
    atrioventricularDelayIsRelativeElectricalOnsetTimingNotPrInterval:
      true as const,
    modelHasNoExplicitAtrioventricularNodeElectrophysiology: true as const,
    ventricularCalciumTraceAndContractileCandidateHeldExactly: true as const,
    aorticValveAreaAndOpeningLawHeldExactly: true as const,
    systemicAndPulmonaryLoadHeldExactly: true as const,
    mitralAndPulmonaryVenousEffectsAreRequiredCoupledReadbacks: true as const,
    clinicalValidationClaimed: false as const,
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
    ranges: analysis.ranges,
    allRunsPeriod1AndIntegrated: analysis.allRunsPeriod1AndIntegrated,
    allCyclePhysiologyReadbacksAvailable:
      analysis.allCyclePhysiologyReadbacksAvailable,
    allDiastolicFlowReadbacksAvailable:
      analysis.allDiastolicFlowReadbacksAvailable,
    allProtocolIdentitiesDistinct: analysis.allProtocolIdentitiesDistinct,
    arms: analysis.arms.map((arm) => Object.freeze({
      profileId: arm.profile.profileId,
      atrioventricularDelayMs:
        arm.profile.atrioventricularDelaySec * 1000,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      ictMs: milliseconds(
        arm.cycle.leftVentricularIsovolumicContractionTimeSec,
      ),
      ivrtMs: milliseconds(
        arm.cycle.leftVentricularIsovolumicRelaxationTimeSec,
      ),
      teiIndex: arm.cycle.leftVentricularTeiIndex,
      maximumPositiveDpDtMmHgPerSec:
        arm.cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
      maximumNegativeDpDtMagnitudeMmHgPerSec:
        arm.cycle.maximumLeftVentricularPressureFallRateMagnitudeMmHgPerSec,
      mitralClosureToVentricularCalciumRiseMs:
        arm.timing
          .mitralClosureToVentricularCalciumOnePercentRiseSignedSec * 1000,
      ventricularCalciumRiseToAorticOpeningMs:
        arm.timing.ventricularCalciumOnePercentRiseToAorticOpeningSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakVelocityMPerSec: arm.cycle.peakVenaContractaVelocityMPerSec,
      meanGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg:
        arm.cycle.meanAorticAbsolutePressureMmHg,
      meanLeftAtrialPressureMmHg:
        arm.meanAbsolutePressureMmHg.leftAtrium,
      meanCentralVenousPressureMmHg:
        arm.meanAbsolutePressureMmHg.centralVein,
      mitral: arm.diastolicFlow.value?.mitral ?? null,
      pulmonaryVenous: arm.diastolicFlow.value?.pulmonaryVenous ?? null,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      distinctFlowPeakCount:
        arm.cycle.aorticFlowDistinctPeakCountAboveFivePercent,
      maximumSecondaryFlowPeakProminenceFraction:
        arm.cycle
          .maximumSecondaryAorticFlowPeakProminenceFractionOfGlobalMaximum,
      relativeToSource160ms: arm.relativeToSource160ms,
    })),
  })}\n`);
}

function milliseconds(value: number | null): number | null {
  return value === null ? null : value * 1000;
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
