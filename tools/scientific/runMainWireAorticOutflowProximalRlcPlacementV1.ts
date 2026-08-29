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

export const MAIN_WIRE_AORTIC_OUTFLOW_PROXIMAL_RLC_PLACEMENT_V1_ID =
  "main-wire-aortic-outflow-proximal-rlc-placement-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const complianceProfileIds = Object.freeze([
  "canonical",
  "arterial-stiffness-twofold",
] as const);
const placementProfileIds = Object.freeze([
  "half-Ao-SA-resistance-upstream-of-root-compliance",
  "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
  "all-Ao-SA-resistance-upstream-of-root-compliance",
] as const);
const inertanceProfileIds = Object.freeze([
  null,
  "aortic-root-inertance-half",
] as const);
const timingCandidateIds = Object.freeze([
  "canonical",
  "land-rw-three-quarters-trpn50-six-fifths",
] as const);

const arms = complianceProfileIds.flatMap((complianceProfileId) =>
  placementProfileIds.flatMap((placementProfileId) =>
    inertanceProfileIds.flatMap((inertanceProfileId) =>
      timingCandidateIds.map((timingCandidateId) => {
        const run =
          runMainWireNormalAdultFiveWallAorticOutflowLowOrderMechanismCombinationResearchV1(
            { dtSec, maximumBeatCount },
            complianceProfileId,
            placementProfileId,
            timingCandidateId,
            inertanceProfileId,
          );
        const cycle = measureMainWireAorticOutflowCalciumWaveformCycleV1(
          run.periodicResult,
          run.calciumDriveParams,
          `${complianceProfileId}__${placementProfileId}__${inertanceProfileId ?? "canonical-L"}__${timingCandidateId}`,
        );
        const tangentCompliance =
          measureMainWireArterialTangentComplianceReadbackV1(
            run.periodicResult,
            resolveMainWireArterialCompliancePhysiologyRuntimeV1(
              complianceProfileId,
            ).vascular,
          );
        const cAo = tangentCompliance.byNode.Ao.arithmeticMeanMlPerMmHg;
        const cSa = tangentCompliance.byNode.SA.arithmeticMeanMlPerMmHg;
        const equivalentCompliance = 1 / (1 / cAo + 1 / cSa);
        const topologyEdge = run.periodicResult.protocolIdentity.circulation
          .topologyGraphSnapshot.edges.find((edge) => edge.name === "Ao_SA")!;
        if (topologyEdge.kind !== "dynamic") {
          throw new Error("Ao_SA must remain dynamic");
        }
        const downstreamResistance = topologyEdge.R
          * run.placementProfile!.downstreamDynamicEdgeResistanceScaleFromTopology;
        const inertance = topologyEdge.L
          * (run.rootInertanceProfile?.inertanceScaleFromTopology ?? 1);
        return Object.freeze({
          armId:
            `${complianceProfileId}__${placementProfileId}__${inertanceProfileId ?? "canonical-L"}__${timingCandidateId}`,
          complianceProfile: run.complianceProfile,
          placementProfile: run.placementProfile,
          rootInertanceProfile: run.rootInertanceProfile,
          timingCandidate: run.twitchTimingCandidate,
          cycle,
          reducedDownstreamRlc: Object.freeze({
            equivalentComplianceMlPerMmHg: equivalentCompliance,
            downstreamResistanceMmHgSecPerMl: downstreamResistance,
            inertanceMmHgSec2PerMl: inertance,
            dampingRatio: downstreamResistance * 0.5
              * Math.sqrt(equivalentCompliance / inertance),
          }),
          runnerClaim: run.claim,
        });
      })),
    ),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_PROXIMAL_RLC_PLACEMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    complianceProfileIds,
    placementProfileIds,
    inertanceProfileIds,
    timingCandidateIds,
    sourceAoSaResistanceRedistributedNotAdded: true as const,
    graphOwnedAoSaInertanceScaledNotDuplicated: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    reducedDownstreamDampingExcludesUpstreamResistanceFeedback: true as const,
    proximalPressureStationReconstructionImplemented: false as const,
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
      downstreamDampingRatio: entry.reducedDownstreamRlc.dampingRatio,
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
