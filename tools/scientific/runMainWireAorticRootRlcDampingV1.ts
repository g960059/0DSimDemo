import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_CLAIM_V1,
  measureMainWireAorticRootRlcDampingAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticRootRlcDampingAuditV1";
import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";
import type {
  MainWireAorticRootResistanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootResistanceResearchProfileV1";
import type {
  MainWireAorticCompliancePartitionResearchProfileIdV1,
} from "@/engine/core/MainWireAorticCompliancePartitionResearchProfileV1";
import {
  runMainWireNormalAdultFiveWallAorticRootRlcDampingResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import type {
  MainWireVentricularLandTwitchTimingCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";

export const MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_EXPERIMENT_V1_ID =
  "main-wire-aortic-root-rlc-damping-experiment-v1" as const;

type Arm = Readonly<{
  armId: string;
  compliancePartitionProfileId:
    MainWireAorticCompliancePartitionResearchProfileIdV1 | null;
  rootResistanceProfileId:
    MainWireAorticRootResistanceResearchProfileIdV1 | null;
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null;
}>;

const rootArms = Object.freeze([
  arm("canonical", null, null, null),
  arm("root-half", "aortic-root-exponential-pv-capacity-half", null, null),
  arm("root-half-r-four-thirds", "aortic-root-exponential-pv-capacity-half",
    "aortic-root-resistance-high", null),
  arm("root-half-l-half", "aortic-root-exponential-pv-capacity-half", null,
    "aortic-root-inertance-half"),
  arm("root-third", "aortic-root-exponential-pv-capacity-one-third", null, null),
  arm("root-third-r-three-halves",
    "aortic-root-exponential-pv-capacity-one-third",
    "aortic-root-resistance-three-halves", null),
  arm("root-third-l-two-fifths",
    "aortic-root-exponential-pv-capacity-one-third", null,
    "aortic-root-inertance-two-fifths"),
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const satisfies readonly MainWireVentricularLandTwitchTimingCandidateIdV1[]);
const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = rootArms.flatMap((rootArm) =>
  timingCandidateIds.map((timingCandidateId) => {
    const run = runMainWireNormalAdultFiveWallAorticRootRlcDampingResearchV1(
      { dtSec, maximumBeatCount },
      rootArm.compliancePartitionProfileId,
      rootArm.rootResistanceProfileId,
      rootArm.rootInertanceProfileId,
      timingCandidateId,
    );
    const baselineRuntime = normalAdultMainWireRuntimeV1();
    const vascular = run.compliancePartitionProfile === null
      ? baselineRuntime.vascular
      : Object.freeze({
        ...baselineRuntime.vascular,
        aorticCompliancePartitionResearchProfile:
          run.compliancePartitionProfile,
      });
    const rScale = run.rootResistanceProfile
      ?.resistanceScaleFromTopology ?? 1;
    const lScale = run.rootInertanceProfile
      ?.inertanceScaleFromTopology ?? 1;
    const armId = `${rootArm.armId}__${timingCandidateId}`;
    return Object.freeze({
      armId,
      rootArm,
      timingCandidate: run.twitchTimingCandidate,
      rlc: measureMainWireAorticRootRlcDampingAuditV1(
        run.periodicResult,
        run.calciumDriveParams,
        vascular,
        rScale,
        lScale,
        armId,
      ),
      runnerClaim: run.claim,
    });
  }),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    rootArms,
    timingCandidateIds,
    dampingAuditClaim: MAIN_WIRE_AORTIC_ROOT_RLC_DAMPING_AUDIT_CLAIM_V1,
    resistanceScalesChosenToApproximatelyRestoreCanonicalReducedDamping:
      true as const,
    inertanceScalesChosenFromEquivalentComplianceRatio: true as const,
    numericHemodynamicTargetFitApplied: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    reducedDampingRatioIsFullClosedLoopEigenanalysis: false as const,
    rootPartitionAnatomicalLengthIdentified: false as const,
    loadEnvelopeTested: false as const,
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
      dampingRatio: entry.rlc.localLinearizedDampingRatio,
      undampedNaturalFrequencyHz:
        entry.rlc.localLinearizedUndampedNaturalFrequencyHz,
      ejectionTimeMs: entry.rlc.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.rlc.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.rlc.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: entry.rlc.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: entry.rlc.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.rlc.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: entry.rlc.cycle.meanAorticAbsolutePressureMmHg,
      rootAccumulationMl: entry.rlc.positiveAorticRootAccumulationVolumeMl,
      flowPeakCount:
        entry.rlc.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: entry.rlc.cycle.terminationReason,
    })),
  })}\n`);
}

function arm(
  armId: string,
  compliancePartitionProfileId:
    MainWireAorticCompliancePartitionResearchProfileIdV1 | null,
  rootResistanceProfileId:
    MainWireAorticRootResistanceResearchProfileIdV1 | null,
  rootInertanceProfileId:
    MainWireAorticRootInertanceResearchProfileIdV1 | null,
): Arm {
  return Object.freeze({
    armId,
    compliancePartitionProfileId,
    rootResistanceProfileId,
    rootInertanceProfileId,
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
