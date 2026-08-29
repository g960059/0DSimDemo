import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireAorticOutflowCalciumWaveformCycleV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  measureMainWireAorticOutflowClosureMechanismAuditV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowClosureMechanismAuditV1";
import {
  measureMainWireVentricularLandAcceptedBeatTermBalanceV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandAcceptedBeatTermBalanceV1";
import {
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniAmplitudeTrefWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_IDS_V1,
  resolveMainWireVentricularLandCoppiniAmplitudeTrefWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandCoppiniAmplitudeTrefPairV1";
import type {
  MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_COPPINI_AMPLITUDE_TREF_V1_ID =
  "main-wire-aortic-outflow-land-coppini-amplitude-tref-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileId = "land-whole-organ-kuw-nu4" as const;
const sarcomereReferenceProfileIds = Object.freeze([
  "land-sarcomere-reference-canonical",
  "land-sarcomere-reference-plus-5-percent",
] as const satisfies readonly MainWireVentricularLandSarcomereReferenceProfileIdV1[]);

const arms = sarcomereReferenceProfileIds.flatMap(
  (sarcomereReferenceProfileId) =>
    MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_IDS_V1.map(
      (pairId) => {
        const run =
          runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniAmplitudeTrefWindkesselResearchV1(
            { dtSec, maximumBeatCount },
            pairId,
            kuwProfileId,
            "arterial-stiffness-twofold",
            "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
            "aortic-root-inertance-half",
            sarcomereReferenceProfileId,
          );
        const armId = `${sarcomereReferenceProfileId}__${pairId}`;
        const material =
          resolveMainWireVentricularLandCoppiniAmplitudeTrefWallMaterialV1(
            pairId,
            sarcomereReferenceProfileId,
            kuwProfileId,
          );
        return Object.freeze({
          armId,
          amplitudeTrefPair: run.amplitudeTrefPair,
          sarcomereReferenceProfile: run.sarcomereReferenceProfile,
          cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
            run.periodicResult,
            run.calciumDriveParams,
            armId,
          ),
          closureMechanism:
            measureMainWireAorticOutflowClosureMechanismAuditV1(
              run.periodicResult,
            ),
          landTermBalance:
            measureMainWireVentricularLandAcceptedBeatTermBalanceV1(
              run.periodicResult,
              material,
              run.periodicResult.protocolIdentity.mechanicsProvider
                .parameterIdentityHash,
            ),
          runnerClaim: run.claim,
        });
      },
    ),
);

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_LAND_COPPINI_AMPLITUDE_TREF_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    pairIds:
      MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_IDS_V1,
    pairClaim:
      MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_TREF_PAIR_CLAIM_V1,
    kuwProfileId,
    sarcomereReferenceProfileIds,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-half" as const,
    independentCanonicalColdStartPerArm: true as const,
    hemodynamicParameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    pairDerivedFromIsometricPeakOnly: true as const,
    sourceLandParametersExceptTrefHeldExactly: true as const,
    sourceCalciumShapeAndPhaseHeldExactly: true as const,
    aorticValveAreaOrLawChanged: false as const,
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
      amplitudeScale:
        arm.amplitudeTrefPair.calciumAmplitudeProfile
          .supraminimumAmplitudeScaleFromSource,
      peakCalciumUM:
        arm.amplitudeTrefPair.calciumAmplitudeProfile.resolvedPeakCalciumUM,
      trefScale: arm.amplitudeTrefPair.ventricularTrefScaleFromSource,
      loadedReferenceLandStretch:
        arm.sarcomereReferenceProfile.resolvedLoadedReferenceLandStretch,
      ejectionTimeMs: arm.cycle.aorticEjectionTimeProxySec * 1000,
      accelerationTimeMs:
        arm.cycle.timeFromAorticFlowOnsetToPeakSec * 1000,
      strokeVolumeMl: arm.cycle.aorticForwardVolumeMl,
      peakFlowMlPerSec: arm.cycle.aorticMaximumFlowMlPerSec,
      peakVenaContractaVelocityMPerSec:
        arm.cycle.peakVenaContractaVelocityMPerSec,
      meanDopplerGradientMmHg: arm.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: arm.cycle.peakDopplerGradientMmHg,
      meanAorticPressureMmHg: arm.cycle.meanAorticAbsolutePressureMmHg,
      leftVentricularEjectionFraction01:
        arm.cycle.leftVentricularEjectionFraction01,
      flowPeakCount: arm.cycle.aorticFlowPeakCountAboveFivePercent,
      endCalciumUM: arm.landTermBalance.atAorticFlowEnd.freeCalciumUM,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endCaTrpn: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      endStrongPopulation: arm.landTermBalance.atAorticFlowEnd.strongPopulationS,
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
