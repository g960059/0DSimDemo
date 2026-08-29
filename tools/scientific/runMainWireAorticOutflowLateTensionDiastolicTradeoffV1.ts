import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1,
  type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LATE_TENSION_DIASTOLIC_TRADEOFF_V1_ID =
  "main-wire-aortic-outflow-late-tension-diastolic-tradeoff-v1" as const;

const candidateIds = Object.freeze([
  "source-twitch-retention-canonical",
  "source-twitch-retention-kws-seventeen-twentieths-peak-compensated",
  "source-twitch-retention-kws-four-fifths-peak-compensated",
  "source-twitch-retention-kws-three-quarters-peak-compensated",
  "source-twitch-retention-kws-29-of-40-peak-compensated",
  "source-twitch-retention-kws-seven-tenths-peak-compensated",
  "source-twitch-retention-kws-thirteen-twentieths-peak-compensated",
  "source-twitch-retention-kws-three-fifths-peak-compensated",
  "source-twitch-retention-kws-four-fifths-ntm-four-fifths-peak-compensated",
  "source-twitch-retention-kws-three-quarters-ntm-four-fifths-peak-compensated",
  "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated",
  "source-twitch-retention-rw-three-quarters-peak-compensated",
  "source-twitch-retention-ntm-four-fifths-peak-compensated",
  "source-twitch-retention-ntm-three-fifths-peak-compensated",
] as const satisfies readonly MainWireVentricularLandSourceTwitchRetentionCandidateIdV1[]);

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const arms = Object.freeze(candidateIds.map((candidateId) => {
  const candidate =
    resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1(candidateId);
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
      { dtSec, maximumBeatCount },
      "land-whole-organ-kuw-nu4",
      "arterial-stiffness-twofold",
      "all-Ao-SA-resistance-upstream-of-root-compliance",
      "aortic-root-inertance-two-fifths",
      "land-sarcomere-reference-plus-5-percent",
      "land-beta1-canonical",
      candidateId,
      "baseline",
      "baseline",
      "tref-force-load-baseline",
      "source-Aeff-canonical",
    );
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    run.periodicResult,
    run.calciumDriveParams,
    candidateId,
  );
  return Object.freeze({
    candidate,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    cycle,
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        run.periodicResult,
        run.calciumDriveParams,
      ),
    runnerClaim: run.claim,
  });
}));
const canonical = arms[0]!;
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LATE_TENSION_DIASTOLIC_TRADEOFF_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateIds,
    commonProtocol: Object.freeze({
      calciumProfileId:
        "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
      kuwProfileId: "land-whole-organ-kuw-nu4" as const,
      sarcomereReferenceProfileId:
        "land-sarcomere-reference-plus-5-percent" as const,
      complianceProfileId: "arterial-stiffness-twofold" as const,
      characteristicResistancePlacementProfileId:
        "all-Ao-SA-resistance-upstream-of-root-compliance" as const,
      rootInertanceProfileId: "aortic-root-inertance-two-fifths" as const,
      sourceVelocityDistortionProfileId: "source-Aeff-canonical" as const,
      aorticMaximumForwardEoaCm2: 3.5 as const,
    }),
    independentCanonicalColdStartPerArm: true as const,
    parameterOptimizationOrFitApplied: false as const,
  }),
  arms: Object.freeze(arms.map((arm) => Object.freeze({
    ...arm,
    relativeToCanonical: Object.freeze({
      ejectionTime: relative(
        arm.cycle.aorticEjectionTimeProxySec,
        canonical.cycle.aorticEjectionTimeProxySec,
      ),
      aorticForwardVolume: relative(
        arm.cycle.aorticForwardVolumeMl,
        canonical.cycle.aorticForwardVolumeMl,
      ),
      peakVenaContractaVelocity: relative(
        arm.cycle.peakVenaContractaVelocityMPerSec,
        canonical.cycle.peakVenaContractaVelocityMPerSec,
      ),
      meanDopplerGradient: relative(
        arm.cycle.meanDopplerGradientMmHg,
        canonical.cycle.meanDopplerGradientMmHg,
      ),
      meanAorticPressure: relative(
        arm.cycle.meanAorticAbsolutePressureMmHg,
        canonical.cycle.meanAorticAbsolutePressureMmHg,
      ),
    }),
  }))),
  interpretationBoundary: Object.freeze({
    isometricSourceTraceUsedToConstructCandidates: true as const,
    closedLoopOutcomesUsedToConstructAllCandidates: false as const,
    someBoundedEtCompletionCandidatesWereLaterLoadInformed: true as const,
    diastolicReadbacksAreModelSignalsNotClinicalMeasurements: true as const,
    macroHemodynamicRecalibrationApplied: false as const,
    sourceAeffChanged: false as const,
    stateCountChanged: false as const,
    clinicalValidationEstablished: false as const,
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
    arms: report.arms.map((arm) => ({
      candidateId: arm.candidate.candidateId,
      changedKineticParameters: arm.candidate.changedKineticParameters,
      kineticParameterScaleFromSourceByParameter:
        arm.candidate.kineticParameterScaleFromSourceByParameter,
      isometricScreen: arm.candidate.sourceOnlyIsometricScreen,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      diastolicFlow: arm.diastolicFlow.value,
      diastolicFlowUnavailabilityReason: arm.diastolicFlow.reason,
      relativeToCanonical: arm.relativeToCanonical,
    })),
  })}\n`);
}

function relative(value: number, reference: number): number {
  return (value - reference) / Math.max(Math.abs(reference), 1e-12);
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
