import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
  screenMainWireAorticOutflowCalciumCandidateV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumPeakLockedTailParamsV1,
  resolveMainWireVentricularCalciumPeakLockedTailProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumPeakLockedTailAblationV1";
import {
  runMainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_PEAK_LOCKED_TAIL_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-peak-locked-tail-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const rawArms = MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1
  .map((profileId) => {
    const run =
      runMainWireNormalAdultFiveWallVentricularCalciumPeakLockedTailResearchV1(
        { dtSec, maximumBeatCount },
        profileId,
      );
    const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      profileId,
    );
    return Object.freeze({
      profileId,
      profile: resolveMainWireVentricularCalciumPeakLockedTailProfileV1(
        profileId,
      ),
      calciumDriveParams: run.calciumDriveParams,
      cycle,
      isometricAtSourceRestingStretch:
        measureMainWireVentricularLandIsometricTwitchAuditV1(
          run.calciumDriveParams,
          { dtSec, fixedLandStretch: 1 },
        ),
      loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
        run.periodicResult,
        run.calciumDriveParams,
      ),
      runnerClaim: run.claim,
    });
  });
const canonicalCycle = rawArms[0]!.cycle;
const arms = rawArms.map((arm) => Object.freeze({
  ...arm,
  candidateScreen: arm.profileId === "canonical"
    ? null
    : screenMainWireAorticOutflowCalciumCandidateV1(
      arm.cycle,
      canonicalCycle,
    ),
}));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_PEAK_LOCKED_TAIL_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profileOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_PROFILE_IDS_V1,
    ablationClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_PEAK_LOCKED_TAIL_ABLATION_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    profileDerivedFromHemodynamicOutcome: false as const,
    sourceTraceReproductionEstablished: false as const,
    referenceContextIsClinicalPassFail: false as const,
    canonicalAdoptionEstablished: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
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
    arms: report.arms.map((arm) => ({
      profileId: arm.profileId,
      riseTimeConstantSec:
        arm.calciumDriveParams.ventricular.riseTimeConstantSec,
      decayTimeConstantSec:
        arm.calciumDriveParams.ventricular.decayTimeConstantSec,
      calciumPeakAmplitudeUM:
        arm.calciumDriveParams.ventricular.peakAmplitudeUM,
      isometricTensionTimeToPeakMs:
        arm.isometricAtSourceRestingStretch.activeTwitch.timeToPeakSec * 1000,
      isometricTensionRelaxationTime50Ms:
        arm.isometricAtSourceRestingStretch.activeTwitch
          .relaxationTime50Sec! * 1000,
      isometricTensionRelaxationTime95Ms:
        arm.isometricAtSourceRestingStretch.activeTwitch
          .relaxationTime95Sec! * 1000,
      aorticEjectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      aorticMaximumFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      aorticForwardVolumeMl: arm.cycle.aorticForwardVolumeMl,
      netAorticCardiacOutputLPerMin: arm.cycle.netAorticCardiacOutputLPerMin,
      meanAorticAbsolutePressureMmHg:
        arm.cycle.meanAorticAbsolutePressureMmHg,
      peakLeftVentricularPressureMmHg:
        arm.cycle.peakLeftVentricularPressureMmHg,
      aorticFlowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      candidateScreen: arm.candidateScreen,
    })),
  })}\n`);
}

// Retain an explicit resolver use in the experiment boundary so a stale arm
// cannot silently substitute a parameter object with the same profile label.
for (const arm of arms) {
  if (
    arm.calciumDriveParams.parameterSetId
    !== resolveMainWireVentricularCalciumPeakLockedTailParamsV1(
      arm.profileId,
    ).parameterSetId
  ) throw new Error("peak-locked tail experiment parameter identity mismatch");
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
