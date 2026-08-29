import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_CLAIM_V1,
  resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSourceTwitchRetentionCandidatesV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_TWITCH_RETENTION_V1_ID =
  "main-wire-aortic-outflow-land-source-twitch-retention-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const closedLoopKuwProfileId = "land-whole-organ-kuw-nu4" as const;
const sourceIsometricScreenKuwProfileId =
  "land-whole-organ-kuw-nu7" as const;
const sarcomereReferenceProfileId =
  "land-sarcomere-reference-plus-5-percent" as const;
const complianceProfileId = "arterial-stiffness-twofold" as const;
const placementProfileId =
  "Land2017-characteristic-impedance-matched" as const;
const rootInertanceProfileId = "aortic-root-inertance-two-fifths" as const;

const arms = MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1
  .map((candidateId) => {
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
        { dtSec, maximumBeatCount },
        closedLoopKuwProfileId,
        complianceProfileId,
        placementProfileId,
        rootInertanceProfileId,
        sarcomereReferenceProfileId,
        "land-beta1-canonical",
        candidateId,
      );
    const closedLoopMaterial =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        candidateId,
        sarcomereReferenceProfileId,
        closedLoopKuwProfileId,
      );
    const sourceIsometricScreenMaterial =
      resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
        candidateId,
        sarcomereReferenceProfileId,
        sourceIsometricScreenKuwProfileId,
      );
    const calciumInput = Object.freeze({
      calciumInputId: run.calciumDriveParams.parameterSetId,
      calciumInputKind:
        "primary-repository-numeric-source-trace" as const,
      cycleLengthSec: run.calciumDriveParams.cycleLengthSec,
      diastolicCalciumUM:
        run.calciumDriveParams.ventricular.diastolicCalciumUM,
      electricalToCalciumDelaySec: 0,
      sourceDoi: "10.1016/j.yjmcc.2017.03.008",
      sourceDescription: "primary-repository numeric Coppini calcium trace",
      originalNumericSourceTraceUsed: true as const,
      figureDigitizationUsed: false as const,
      smoothingApplied: false as const,
      fittingApplied: false as const,
      evaluateFreeCalciumUM: (timeSec: number) =>
        evaluateFiveWallNormalCalciumDriveV1(
          timeSec,
          run.calciumDriveParams,
        ).freeCalciumUMByWall.LVFW,
    });
    return Object.freeze({
      armId: candidateId,
      candidate: run.sourceTwitchRetentionCandidate,
      isometric:
        measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
          calciumInput,
          { dtSec: 0.001, fixedLandStretch: 1 },
          sourceIsometricScreenMaterial,
        ),
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        candidateId,
      ),
      closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
        run.periodicResult,
      ),
      landTermBalance:
        measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
          run.periodicResult,
          closedLoopMaterial,
          run.periodicResult.protocolIdentity.mechanicsProvider
            .parameterIdentityHash,
        ),
      runnerClaim: run.claim,
    });
  });

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_SOURCE_TWITCH_RETENTION_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    candidateIds:
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1,
    candidateClaim:
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_CLAIM_V1,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    closedLoopKuwProfileId,
    sourceIsometricScreenKuwProfileId,
    sarcomereReferenceProfileId,
    complianceProfileId,
    placementProfileId,
    rootInertanceProfileId,
    independentCanonicalColdStartPerArm: true as const,
    hemodynamicParameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    initialCandidatesFixedFromSourceIsometricScreenBeforeClosedLoop:
      true as const,
    ETCompletionCandidateScalesInformedByPriorLoadEnvelope: true as const,
    primaryRepositoryNumericCalciumTraceHeldExactly: true as const,
    aorticValveAreaOrOpeningLawChanged: false as const,
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
    arms: arms.map((arm) => ({
      armId: arm.armId,
      changedKineticParameters: arm.candidate.changedKineticParameters,
      kineticParameterScaleFromSourceByParameter:
        arm.candidate.kineticParameterScaleFromSourceByParameter,
      trefScale: arm.candidate.ventricularTrefScaleFromSource,
      isometricPeakKPa: arm.isometric.activeTwitch.peakKPa,
      isometricFivePercentRiseToPeakMs:
        arm.isometric.activeTwitch
          .timeFromRisingFivePercentAmplitudeToPeakSec! * 1000,
      isometricRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      isometricRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      fullyOpenUniformFlowDopplerGradientLowerBoundMmHg:
        arm.cycle.aorticFullyOpenUniformFlowDopplerGradientLowerBoundMmHg,
      dynamicAreaDopplerPenaltyFactor:
        arm.cycle.aorticDynamicAreaDopplerPenaltyFactor,
      jetVelocityWaveformNonuniformityFactor:
        arm.cycle.aorticJetVelocityWaveformNonuniformityFactor,
      meanDopplerExcessOverFullyOpenUniformFlowFactor:
        arm.cycle.aorticMeanDopplerExcessOverFullyOpenUniformFlowFactor,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endCaTrpn: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      endStrongPopulation:
        arm.landTermBalance.atAorticFlowEnd.strongPopulationS,
      endNetActiveKirchhoffStressKPa:
        arm.landTermBalance.atAorticFlowEnd.netActiveKirchhoffStressKPa,
      finalTwentyMsActivePressureChangeMmHg:
        arm.closureMechanism.finalTwentyMillisecondsToThresholdEnd
          .triSegPressureChangeByComponentMmHg.active,
      terminationReason: arm.cycle.terminationReason,
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
