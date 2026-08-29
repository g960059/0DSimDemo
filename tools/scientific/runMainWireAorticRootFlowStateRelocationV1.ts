import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireArterialTangentComplianceReadbackV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowArterialStiffnessAblationV1";
import {
  MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILE_IDS_V1,
} from "@/engine/core/MainWireAorticRootFlowStateRelocationResearchProfileV1";
import {
  runMainWireNormalAdultFiveWallAorticRootFlowStateRelocationResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireArterialCompliancePhysiologyRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";

export const MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_AUDIT_V1_ID =
  "main-wire-aortic-root-flow-state-relocation-audit-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const complianceProfileIds = Object.freeze([
  "canonical",
  "arterial-stiffness-twofold",
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const);

const arms = MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILE_IDS_V1
  .flatMap((relocationProfileId) => complianceProfileIds.flatMap(
    (complianceProfileId) => timingCandidateIds.map((timingCandidateId) => {
      const armId =
        `${relocationProfileId}__${complianceProfileId}__${timingCandidateId}`;
      const run =
        runMainWireNormalAdultFiveWallAorticRootFlowStateRelocationResearchV1(
          { dtSec, maximumBeatCount },
          relocationProfileId,
          complianceProfileId,
          timingCandidateId,
        );
      const beat = run.periodicResult.retainedCompleteBeats.at(-1);
      if (beat === undefined) {
        return Object.freeze({
          armId,
          relocationProfile: run.relocationProfile,
          complianceProfile: run.complianceProfile,
          timingCandidate: run.twitchTimingCandidate,
          compliance: null,
          positiveAorticRootAccumulationVolumeMl: null,
          netAorticRootAccumulationVolumeMl: null,
          aorticRootInflowForwardVolumeMl: null,
          aorticRootOutflowForwardVolumeMl: null,
          cycle: null,
          failure: run.periodicResult.failure,
          terminationReason: run.periodicResult.terminationReason,
          runnerClaim: run.claim,
        });
      }
      const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        armId,
      );
      const compliance = measureMainWireArterialTangentComplianceReadbackV1(
        run.periodicResult,
        resolveMainWireArterialCompliancePhysiologyRuntimeV1(
          complianceProfileId,
        ).vascular,
      );
      const rootFlowDifferenceMlPerSec = beat.samples.map((sample) =>
        sample.circulationEdgeFlowMlPerSec.AoV
          - sample.circulationEdgeFlowMlPerSec.Ao_SA);
      return Object.freeze({
        armId,
        relocationProfile: run.relocationProfile,
        complianceProfile: run.complianceProfile,
        timingCandidate: run.twitchTimingCandidate,
        compliance,
        positiveAorticRootAccumulationVolumeMl:
          rootFlowDifferenceMlPerSec.reduce(
            (sum, difference) => sum + dtSec * Math.max(0, difference),
            0,
          ),
        netAorticRootAccumulationVolumeMl:
          rootFlowDifferenceMlPerSec.reduce(
            (sum, difference) => sum + dtSec * difference,
            0,
          ),
        aorticRootInflowForwardVolumeMl: beat.samples.reduce(
          (sum, sample) => sum + dtSec * Math.max(
            0,
            sample.circulationEdgeFlowMlPerSec.AoV,
          ),
          0,
        ),
        aorticRootOutflowForwardVolumeMl: beat.samples.reduce(
          (sum, sample) => sum + dtSec * Math.max(
            0,
            sample.circulationEdgeFlowMlPerSec.Ao_SA,
          ),
          0,
        ),
        cycle,
        failure: null,
        terminationReason: run.periodicResult.terminationReason,
        runnerClaim: run.claim,
      });
    }),
  ));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_AUDIT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    relocationProfileIds:
      MAIN_WIRE_AORTIC_ROOT_FLOW_STATE_RELOCATION_PROFILE_IDS_V1,
    complianceProfileIds,
    timingCandidateIds,
    sourceAoSaResistanceRedistributedNotAdded: true as const,
    sourceAoSaInertanceRelocatedNotDuplicated: true as const,
    dynamicFlowStateSlotCountChanged: false as const,
    dynamicFlowStateSlotSemanticsChanged: true as const,
    independentColdStarts: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    canonicalCheckpointCompatible: false as const,
    pressureRecoveryApplied: false as const,
    macroHemodynamicRecalibrationApplied: false as const,
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
    arms: arms.map((entry) => ({
      armId: entry.armId,
      summedMeanTangentComplianceMlPerMmHg:
        entry.compliance?.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg ?? null,
      positiveRootAccumulationMl:
        entry.positiveAorticRootAccumulationVolumeMl,
      netRootAccumulationMl: entry.netAorticRootAccumulationVolumeMl,
      ejectionTimeMs: entry.cycle === null
        ? null
        : entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs: entry.cycle === null
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
