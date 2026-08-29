import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import type {
  MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallCirculatoryLoadPointsV1";
import type {
  MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CORRECTED_LOAD_ENVELOPE_V1_ID =
  "main-wire-aortic-outflow-corrected-load-envelope-v1" as const;

const candidateSpecs = Object.freeze([
  Object.freeze({
    candidateId: "c2-r75-lhalf-rw-trpn",
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
  }),
  Object.freeze({
    candidateId: "c2-rall-lhalf-rw-trpn",
    placementProfileId:
      "all-Ao-SA-resistance-upstream-of-root-compliance" as const,
  }),
]);
type Context = Readonly<{
  contextId: string;
  circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1;
  bloodVolumePointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1;
}>;
const contexts = Object.freeze([
  context("systemic-resistance-low", "systemic-resistance-low", "baseline"),
  context("baseline", "baseline", "baseline"),
  context("systemic-resistance-high", "systemic-resistance-high", "baseline"),
  context("stressed-venous-volume-low", "baseline", "stressed-venous-volume-low"),
  context("stressed-venous-volume-high", "baseline", "stressed-venous-volume-high"),
]);
const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = candidateSpecs.flatMap((candidate) => contexts.map((loadContext) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
      { dtSec, maximumBeatCount },
      "arterial-stiffness-twofold",
      candidate.placementProfileId,
      "land-rw-three-quarters-trpn50-six-fifths",
      "aortic-root-inertance-half",
      null,
      loadContext.circulatoryLoadPointId,
      loadContext.bloodVolumePointId,
    );
  const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
    run.periodicResult,
    run.calciumDriveParams,
    `${candidate.candidateId}__${loadContext.contextId}`,
  );
  const samples = run.periodicResult.retainedCompleteBeats.at(-1)!.samples;
  return Object.freeze({
    candidate,
    context: loadContext,
    fixedTotalBloodVolumeMl:
      run.periodicResult.bloodVolumeOperatingPointAudit
        .resolvedTotalBloodVolumeMl,
    cycle,
    monitoring: Object.freeze({
      meanRightAtrialPressureMmHg: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.RA)),
      meanCentralVenousPressureMmHg: mean(samples.map((sample) =>
        sample.circulationNodeAbsolutePressureMmHg.VC)),
    }),
  });
}));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_CORRECTED_LOAD_ENVELOPE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateSpecs,
    contexts,
    oneSystemicLoadAxisAtATime: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    etIsPrimary: true as const,
    macroHemodynamicRecalibrationApplied: false as const,
    loadEnvelopeIsRobustnessProbeNotFit: true as const,
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
      candidateId: entry.candidate.candidateId,
      contextId: entry.context.contextId,
      fixedTotalBloodVolumeMl: entry.fixedTotalBloodVolumeMl,
      ejectionTimeMs: entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: entry.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: entry.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: entry.cycle.meanAorticAbsolutePressureMmHg,
      meanRightAtrialPressureMmHg:
        entry.monitoring.meanRightAtrialPressureMmHg,
      meanCentralVenousPressureMmHg:
        entry.monitoring.meanCentralVenousPressureMmHg,
      flowPeakCount: entry.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: entry.cycle.terminationReason,
    })),
  })}\n`);
}

function context(
  contextId: string,
  circulatoryLoadPointId: MainWireNormalAdultFiveWallCirculatoryLoadPointIdV1,
  bloodVolumePointId: MainWireNormalAdultStressedVenousVolumeResearchPointIdV1,
): Context {
  return Object.freeze({
    contextId,
    circulatoryLoadPointId,
    bloodVolumePointId,
  });
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
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
