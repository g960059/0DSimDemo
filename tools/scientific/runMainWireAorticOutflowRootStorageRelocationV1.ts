import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireArterialCompliancePhysiologyRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_ROOT_STORAGE_RELOCATION_V1_ID =
  "main-wire-aortic-outflow-root-storage-relocation-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const partitionProfileIds = Object.freeze([
  "aortic-root-exponential-pv-capacity-half",
  "aortic-root-exponential-pv-capacity-one-third",
] as const);
const placementProfileIds = Object.freeze([
  "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
  "all-Ao-SA-resistance-upstream-of-root-compliance",
] as const);
const inertanceProfileIds = Object.freeze([
  "aortic-root-inertance-half",
  "aortic-root-inertance-one-quarter",
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const);

const arms = partitionProfileIds.flatMap((partitionProfileId) =>
  placementProfileIds.flatMap((placementProfileId) =>
    inertanceProfileIds.flatMap((inertanceProfileId) =>
      timingCandidateIds.map((timingCandidateId) => {
        const run =
          runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
            { dtSec, maximumBeatCount },
            "arterial-stiffness-twofold",
            placementProfileId,
            timingCandidateId,
            inertanceProfileId,
            partitionProfileId,
          );
        const label =
          `${partitionProfileId}__${placementProfileId}__${inertanceProfileId}__${timingCandidateId}`;
        const beat = run.periodicResult.retainedCompleteBeats.at(-1);
        if (beat === undefined) {
          return Object.freeze({
            armId: label,
            partitionProfile: run.compliancePartitionProfile,
            placementProfile: run.placementProfile,
            inertanceProfile: run.rootInertanceProfile,
            timingCandidate: run.twitchTimingCandidate,
            compliance: null,
            positiveAorticRootAccumulationVolumeMl: null,
            cycle: null,
            failure: run.periodicResult.failure,
            terminationReason: run.periodicResult.terminationReason,
          });
        }
        const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          run.calciumDriveParams,
          label,
        );
        const vascular = Object.freeze({
          ...resolveMainWireArterialCompliancePhysiologyRuntimeV1(
            "arterial-stiffness-twofold",
          ).vascular,
          aorticCompliancePartitionResearchProfile:
            run.compliancePartitionProfile!,
        });
        const compliance = measureMainWireArterialTangentComplianceReadbackV1(
          run.periodicResult,
          vascular,
        );
        return Object.freeze({
          armId: label,
          partitionProfile: run.compliancePartitionProfile,
          placementProfile: run.placementProfile,
          inertanceProfile: run.rootInertanceProfile,
          timingCandidate: run.twitchTimingCandidate,
          compliance,
          positiveAorticRootAccumulationVolumeMl: beat.samples.reduce(
            (sum, sample) => sum + dtSec * Math.max(
              0,
              sample.circulationEdgeFlowMlPerSec.AoV
                - sample.circulationEdgeFlowMlPerSec.Ao_SA,
            ),
            0,
          ),
          cycle,
          failure: null,
          terminationReason: run.periodicResult.terminationReason,
        });
      }))),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_ROOT_STORAGE_RELOCATION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    globalArterialStiffnessScaleFromCanonical: 2 as const,
    partitionProfileIds,
    placementProfileIds,
    inertanceProfileIds,
    timingCandidateIds,
    totalAoSaExponentialPvCapacityPreservedByPartition: true as const,
    dynamicFlowStateCountChanged: false as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    existingAoSaFlowStateIsExactlyValveInputFlow: false as const,
    reducedRootStorageMakesItACloserApproximation: true as const,
    fullTopologyRelocationImplemented: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
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
      meanAorticRootTangentComplianceMlPerMmHg:
        entry.compliance?.byNode.Ao.arithmeticMeanMlPerMmHg ?? null,
      summedMeanTangentComplianceMlPerMmHg:
        entry.compliance?.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg ?? null,
      rootAccumulationMl: entry.positiveAorticRootAccumulationVolumeMl,
      ejectionTimeMs: entry.cycle === null
        ? null
        : entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.cycle === null
          ? null
          : entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.cycle?.aorticForwardVolumeMl ?? null,
      peakAorticFlowMlPerSec: entry.cycle?.aorticMaximumFlowMlPerSec ?? null,
      meanDopplerGradientMmHg: entry.cycle?.meanDopplerGradientMmHg ?? null,
      peakDopplerGradientMmHg: entry.cycle?.peakDopplerGradientMmHg ?? null,
      meanNodeGradientMmHg: entry.cycle?.meanNodeGradientMmHg ?? null,
      peakNodeGradientMmHg: entry.cycle?.peakNodeGradientMmHg ?? null,
      meanAorticPressureMmHg:
        entry.cycle?.meanAorticAbsolutePressureMmHg ?? null,
      flowPeakCount:
        entry.cycle?.aorticFlowPeakCountAboveFivePercent ?? null,
      terminationReason: entry.terminationReason,
      failureReason: entry.failure?.reason ?? null,
    })),
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
