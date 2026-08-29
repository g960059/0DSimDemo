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
  type MainWireArterialCompliancePhysiologyProfileIdV1,
} from "@/engine/myocardium/experiments/MainWireArterialCompliancePhysiologyBracketV1";
import type {
  MainWireAorticRootInertanceResearchProfileIdV1,
} from "@/engine/core/MainWireAorticRootInertanceResearchProfileV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGIC_COMPLIANCE_RLC_REFINEMENT_V1_ID =
  "main-wire-aortic-outflow-physiologic-compliance-rlc-refinement-v1" as const;

type ComplianceInertancePair = Readonly<{
  complianceProfileId: Extract<
    MainWireArterialCompliancePhysiologyProfileIdV1,
    "arterial-stiffness-threefold" | "arterial-stiffness-fourfold"
  >;
  inertanceProfileId: MainWireAorticRootInertanceResearchProfileIdV1;
}>;

const complianceInertancePairs = Object.freeze([
  Object.freeze({
    complianceProfileId: "arterial-stiffness-threefold" as const,
    inertanceProfileId: "aortic-root-inertance-two-fifths" as const,
  }),
  Object.freeze({
    complianceProfileId: "arterial-stiffness-threefold" as const,
    inertanceProfileId: "aortic-root-inertance-one-third" as const,
  }),
  Object.freeze({
    complianceProfileId: "arterial-stiffness-fourfold" as const,
    inertanceProfileId: "aortic-root-inertance-one-third" as const,
  }),
  Object.freeze({
    complianceProfileId: "arterial-stiffness-fourfold" as const,
    inertanceProfileId: "aortic-root-inertance-one-quarter" as const,
  }),
] as const satisfies readonly ComplianceInertancePair[]);
const placementProfileIds = Object.freeze([
  "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
  "all-Ao-SA-resistance-upstream-of-root-compliance",
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const);
const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");

const arms = complianceInertancePairs.flatMap((pair) =>
  placementProfileIds.flatMap((placementProfileId) =>
    timingCandidateIds.map((timingCandidateId) => {
      const run =
        runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
          { dtSec, maximumBeatCount },
          pair.complianceProfileId,
          placementProfileId,
          timingCandidateId,
          pair.inertanceProfileId,
        );
      const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        `${pair.complianceProfileId}__${placementProfileId}__${pair.inertanceProfileId}__${timingCandidateId}`,
      );
      const tangentCompliance =
        measureMainWireArterialTangentComplianceReadbackV1(
          run.periodicResult,
          resolveMainWireArterialCompliancePhysiologyRuntimeV1(
            pair.complianceProfileId,
          ).vascular,
        );
      return Object.freeze({
        armId:
          `${pair.complianceProfileId}__${placementProfileId}__${pair.inertanceProfileId}__${timingCandidateId}`,
        pair,
        placementProfile: run.placementProfile,
        timingCandidate: run.twitchTimingCandidate,
        tangentCompliance,
        strokeVolumeOverAorticPulsePressureMlPerMmHg:
          cycle.aorticForwardVolumeMl / (
            cycle.maximumAorticRootPressureMmHg
            - cycle.minimumAorticRootPressureMmHg
          ),
        cycle,
      });
    })),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_PHYSIOLOGIC_COMPLIANCE_RLC_REFINEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    complianceInertancePairs,
    placementProfileIds,
    timingCandidateIds,
    complianceMagnitudeContext: Object.freeze({
      framinghamMeanMlPerMmHg: 1.71,
      framinghamDoi: "10.1161/CIRCULATIONAHA.110.937805" as const,
      landWholeOrganWindkesselMlPerMmHg: 2.73,
      landDoi: "10.1016/j.yjmcc.2017.03.008" as const,
      modelSummedNodeTangentComplianceDirectlyEqualsClinicalTac: false as const,
    }),
    inertanceScalesBracketComplianceScaleReciprocal: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    primaryQuestion:
      "whether-source-magnitude-compatible-total-compliance-and-matched-proximal-inertance-remove-bimodality-and-normalize-AT-and-ET" as const,
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
      summedMeanTangentComplianceMlPerMmHg:
        entry.tangentCompliance.summedAllThreeArterialNodes
          .arithmeticMeanMlPerMmHg,
      strokeVolumeOverPulsePressureMlPerMmHg:
        entry.strokeVolumeOverAorticPulsePressureMlPerMmHg,
      ejectionTimeMs: entry.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        entry.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      aorticForwardVolumeMl: entry.cycle.aorticForwardVolumeMl,
      peakAorticFlowMlPerSec: entry.cycle.aorticMaximumFlowMlPerSec,
      meanDopplerGradientMmHg: entry.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: entry.cycle.peakDopplerGradientMmHg,
      meanNodeGradientMmHg: entry.cycle.meanNodeGradientMmHg,
      peakNodeGradientMmHg: entry.cycle.peakNodeGradientMmHg,
      meanAorticPressureMmHg: entry.cycle.meanAorticAbsolutePressureMmHg,
      pulsePressureMmHg:
        entry.cycle.maximumAorticRootPressureMmHg
        - entry.cycle.minimumAorticRootPressureMmHg,
      flowPeakCount: entry.cycle.aorticFlowPeakCountAboveFivePercent,
      terminationReason: entry.cycle.terminationReason,
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
