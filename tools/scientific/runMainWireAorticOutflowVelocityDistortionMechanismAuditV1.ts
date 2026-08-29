import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitShortlistLoadEnvelopeV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_PRIOR_LOAD_ENVELOPE_SELECTED_CANDIDATE_V1 as CANDIDATE,
  MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_SELECTION_CLAIM_V1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowVelocityDistortionCandidateV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1,
  type MainWireVentricularLandSourceVelocityDistortionProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceVelocityDistortionBracketV1";
import {
  summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSummaryV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_MECHANISM_AUDIT_V1_ID =
  "main-wire-aortic-outflow-velocity-distortion-mechanism-audit-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const profiles = Object.freeze([
  "source-Aeff-canonical",
  CANDIDATE.sourceVelocityDistortionProfileId,
] as const satisfies readonly MainWireVentricularLandSourceVelocityDistortionProfileIdV1[]);

const arms = Object.freeze(profiles.map((profileId) => {
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
      profileId,
      CANDIDATE.strongBridgeDeactivationExitProfileId,
    );
  const material =
    resolveMainWireVentricularLandSourceVelocityDistortionWallMaterialV1(
      profileId,
      CANDIDATE.twitchRetentionCandidateId,
      CANDIDATE.trefForceLoadProfileId,
      CANDIDATE.sarcomereReferenceProfileId,
      CANDIDATE.kuwProfileId,
    );
  return Object.freeze({
    profile: run.sourceVelocityDistortionProfile,
    protocolIdentityHash: run.periodicResult.protocolIdentityHash,
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      run.calciumDriveParams,
      profileId,
    ),
    landTermBalance: measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
      run.periodicResult,
      material,
      run.periodicResult.protocolIdentity.mechanicsProvider
        .parameterIdentityHash,
    ),
    closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
      run.periodicResult,
    ),
    diastolicFlow:
      measureMainWireVentricularCalciumSourceTraceFitDiastolicFlowV1(
        run.periodicResult,
      ),
    periodicSummary: summarizeMainWireNormalAdultFiveWallPeriodicSteadyV1(
      run.periodicResult,
    ),
    runnerClaim: run.claim,
  });
}));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_MECHANISM_AUDIT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    profiles,
    selectedCandidate: CANDIDATE,
    selectionClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_VELOCITY_DISTORTION_SELECTION_CLAIM_V1,
    onlyLandAeffDiffersBetweenArms: true as const,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    landTermBalanceIsAcceptedTrajectoryReplayWithoutFeedback: true as const,
    closurePressureSplitIsAcceptedReadbackWithoutFeedback: true as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
    causalClaimLimitedToThisOneFactorIntervention: true as const,
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
    byteLength: Buffer.byteLength(serialized),
    arms: arms.map((arm) => ({
      profileId: arm.profile.profileId,
      aeffScale: arm.profile.aeffScaleFromIntactHumanSource,
      cycle: arm.cycle,
      landTermBalance: arm.landTermBalance,
      closureMechanism: arm.closureMechanism,
      diastolicFlow: arm.diastolicFlow,
      cyclePhysiology: arm.periodicSummary.cyclePhysiology,
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
