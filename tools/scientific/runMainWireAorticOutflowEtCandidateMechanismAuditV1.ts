import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  measureMainWireVentricularLandDistortionProtocolAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandDistortionProtocolAuditV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLoadedShorteningAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLoadedShorteningAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  resolveMainWireVentricularLandEtRefinementWallMaterialV1,
  type MainWireVentricularLandEtRefinementCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandEtRefinementCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_ET_CANDIDATE_MECHANISM_AUDIT_V1_ID =
  "main-wire-aortic-outflow-et-candidate-mechanism-audit-v1" as const;

const CANDIDATE_IDS = Object.freeze([
  "canonical",
  "rw-trpn-aeff-three-halves-tref-four-thirds",
  "rw-trpn-aeff-two-tref-four-thirds",
  "aeff-three-tref-three-halves",
] as const satisfies readonly MainWireVentricularLandEtRefinementCandidateIdV1[]);

const dtSec = numericArgument("--dt", 0.001);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const calcium = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;

const arms = CANDIDATE_IDS.map((candidateId) => {
  const run =
    runMainWireNormalAdultFiveWallAorticOutflowEjectionTimingRefinementResearchV1(
      { dtSec, maximumBeatCount },
      candidateId,
      "baseline",
    );
  const material =
    resolveMainWireVentricularLandEtRefinementWallMaterialV1(candidateId);
  const providerHash = run.periodicResult.protocolIdentity.mechanicsProvider
    .parameterIdentityHash;
  return Object.freeze({
    candidate: run.candidate,
    exactIdentity: Object.freeze({
      protocolIdentityHash: run.periodicResult.protocolIdentityHash,
      protocolComponentHashes: run.periodicResult.protocolComponentHashes,
    }),
    cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
      run.periodicResult,
      calcium,
      candidateId,
    ),
    isometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
      calcium,
      { dtSec, fixedLandStretch: 1 },
      material,
    ),
    sourceInspiredDistortionProtocol:
      measureMainWireVentricularLandDistortionProtocolAuditV1(material),
    loadedShortening: measureMainWireVentricularLoadedShorteningAuditV1(
      run.periodicResult,
      calcium,
      {
        wallMaterialParams: material,
        expectedMechanicsProviderParameterIdentityHash: providerHash,
      },
    ),
    lvfwAcceptedBeatTermBalance:
      measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
        run.periodicResult,
        material,
        providerHash,
      ),
    runnerClaim: run.claim,
  });
});

const canonical = arms[0]!;
const contrastsToCanonical = arms.slice(1).map((candidate) => Object.freeze({
  candidateId: candidate.candidate.candidateId,
  ejectionTimeChangeSec:
    candidate.cycle.aorticEjectionTimeProxySec
    - canonical.cycle.aorticEjectionTimeProxySec,
  accelerationTimeProxyChangeSec:
    candidate.cycle.timeFromAorticFlowOnsetToPeakSec
    - canonical.cycle.timeFromAorticFlowOnsetToPeakSec,
  strokeVolumeChangeMl:
    candidate.cycle.aorticForwardVolumeMl
    - canonical.cycle.aorticForwardVolumeMl,
  meanAorticPressureChangeMmHg:
    candidate.cycle.meanAorticAbsolutePressureMmHg
    - canonical.cycle.meanAorticAbsolutePressureMmHg,
  isometricPeakStressRatio:
    candidate.isometric.activeTwitch.peakKPa
    / canonical.isometric.activeTwitch.peakKPa,
  loadedLvfwPeakStressRatio:
    candidate.loadedShortening.walls.LVFW.recordedWholeHeart
      .peakActiveStressKPa
    / canonical.loadedShortening.walls.LVFW.recordedWholeHeart
      .peakActiveStressKPa,
  quickShorteningEndStressFractionChange:
    candidate.sourceInspiredDistortionProtocol.quickShortening
      .endRampActiveStressFractionOfInitial
    - canonical.sourceInspiredDistortionProtocol.quickShortening
      .endRampActiveStressFractionOfInitial,
  constantVelocityEndStressFractionChange:
    candidate.sourceInspiredDistortionProtocol.constantVelocityShortening
      .endRampActiveStressFractionOfInitial
    - canonical.sourceInspiredDistortionProtocol.constantVelocityShortening
      .endRampActiveStressFractionOfInitial,
  flowPeakNetActiveStateFractionChange:
    candidate.lvfwAcceptedBeatTermBalance.atAorticFlowPeak
      .netActiveStateTermFractionOfUndistortedStrong
    - canonical.lvfwAcceptedBeatTermBalance.atAorticFlowPeak
      .netActiveStateTermFractionOfUndistortedStrong,
}));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_ET_CANDIDATE_MECHANISM_AUDIT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateOrder: CANDIDATE_IDS,
    baselineCirculatoryContextOnly: true as const,
    independentCanonicalColdStartPerArm: true as const,
    sourcePaperDoi: "10.1016/j.yjmcc.2017.03.008" as const,
    sourceInspiredProtocolsAreNotDigitizedDataFits: true as const,
  }),
  arms,
  contrastsToCanonical: Object.freeze(contrastsToCanonical),
  interpretationBoundary: Object.freeze({
    aeffOneAndHalfOrTwoSupportedByNewForceVelocityFit: false as const,
    AeffThreefoldSupportedByDigitizedQuickStretchData: false as const,
    TrefThreeHalvesSupportedByIndependentContractilityData: false as const,
    sourceAeffAndPhiJointRecalibrationStillRequired: true as const,
    hemodynamicTargetOptimizationApplied: false as const,
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
      candidateId: arm.candidate.candidateId,
      terminationReason: arm.cycle.terminationReason,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeProxyMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      isometricPeakStressKPa: arm.isometric.activeTwitch.peakKPa,
      loadedLvfwPeakStressKPa:
        arm.loadedShortening.walls.LVFW.recordedWholeHeart.peakActiveStressKPa,
      Aeff: arm.lvfwAcceptedBeatTermBalance.parameters.Aeff,
      phi: arm.lvfwAcceptedBeatTermBalance.parameters.phi,
      TrefKPa: arm.lvfwAcceptedBeatTermBalance.parameters.TrefPa / 1000,
      strongConstantRateDistortionGainSec:
        arm.lvfwAcceptedBeatTermBalance.parameters
          .strongConstantRateDistortionGainSec,
      quickShorteningEndStressFraction:
        arm.sourceInspiredDistortionProtocol.quickShortening
          .endRampActiveStressFractionOfInitial,
      constantVelocityEndStressFraction:
        arm.sourceInspiredDistortionProtocol.constantVelocityShortening
          .endRampActiveStressFractionOfInitial,
      ejectionMeanNetActiveStateFraction:
        arm.lvfwAcceptedBeatTermBalance.aorticEjectionEpisode
          .meanNetActiveStateTermFractionOfUndistortedStrong,
      flowPeakNetActiveStateFraction:
        arm.lvfwAcceptedBeatTermBalance.atAorticFlowPeak
          .netActiveStateTermFractionOfUndistortedStrong,
      flowPeakDistortionStressKPa:
        arm.lvfwAcceptedBeatTermBalance.atAorticFlowPeak
          .distortionActiveKirchhoffStressKPa,
      termBalanceReplayRelativeResidual:
        arm.lvfwAcceptedBeatTermBalance.replay
          .maximumRelativeRecordedStressResidual,
    })),
    contrastsToCanonical: report.contrastsToCanonical,
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
