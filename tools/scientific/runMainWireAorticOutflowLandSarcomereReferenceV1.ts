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
  runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_BRACKET_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_PROFILE_IDS_V1,
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_LAND_SARCOMERE_REFERENCE_V1_ID =
  "main-wire-aortic-outflow-land-sarcomere-reference-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument("--maximum-beats", 48);
const outputPath = optionalArgument("--output");
const kuwProfileIds = Object.freeze([
  "land-whole-organ-kuw-nu4",
  "land-whole-organ-kuw-nu7",
] as const satisfies readonly MainWireVentricularLandWholeOrganKuwProfileIdV1[]);

const arms = MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_PROFILE_IDS_V1
  .flatMap((sarcomereReferenceProfileId) => kuwProfileIds.map((kuwProfileId) => {
    const run =
      runMainWireNormalAdultFiveWallAorticOutflowLandCoppiniSourceTraceWindkesselResearchV1(
        { dtSec, maximumBeatCount },
        kuwProfileId,
        "arterial-stiffness-twofold",
        "three-quarters-Ao-SA-resistance-upstream-of-root-compliance",
        "aortic-root-inertance-half",
        sarcomereReferenceProfileId,
      );
    const armId = `${sarcomereReferenceProfileId}__${kuwProfileId}`;
    const material =
      resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
        sarcomereReferenceProfileId,
        kuwProfileId,
      );
    return Object.freeze({
      armId,
      sarcomereReferenceProfile: run.sarcomereReferenceProfile,
      kuwProfile: run.kuwProfile,
      cycle: measureMainWireAorticOutflowCalciumWaveformCycleV1(
        run.periodicResult,
        run.calciumDriveParams,
        armId,
      ),
      closureMechanism: measureMainWireAorticOutflowClosureMechanismAuditV1(
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
  }));

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_AORTIC_OUTFLOW_LAND_SARCOMERE_REFERENCE_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    sarcomereReferenceProfileIds:
      MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_PROFILE_IDS_V1,
    kuwProfileIds,
    calciumProfileId:
      "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
    complianceProfileId: "arterial-stiffness-twofold" as const,
    placementProfileId:
      "three-quarters-Ao-SA-resistance-upstream-of-root-compliance" as const,
    rootInertanceProfileId: "aortic-root-inertance-half" as const,
    bracketClaim:
      MAIN_WIRE_VENTRICULAR_LAND_SARCOMERE_REFERENCE_BRACKET_CLAIM_V1,
    independentCanonicalColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    sourceLandEquationParametersHeldExactly: true as const,
    primaryRepositoryNumericCalciumTraceHeldExactly: true as const,
    passiveAndSlsMaterialHeldExactly: true as const,
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
      sarcomereReferenceScale:
        arm.sarcomereReferenceProfile.landSlackStretchScaleFromBaseline,
      loadedReferenceLandStretch:
        arm.sarcomereReferenceProfile.resolvedLoadedReferenceLandStretch,
      nu: arm.kuwProfile.intactToSkinnedUnboundToWeakRateScaleNu,
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
      onsetLandStretch: arm.landTermBalance.atAorticFlowOnset.landStretch,
      peakLandStretch: arm.landTermBalance.atAorticFlowPeak.landStretch,
      endLandStretch: arm.landTermBalance.atAorticFlowEnd.landStretch,
      endCaTrpn: arm.landTermBalance.atAorticFlowEnd.CaTRPN,
      endStrongPopulation: arm.landTermBalance.atAorticFlowEnd.strongPopulationS,
      peakToEndLengthFactorChange:
        arm.landTermBalance.atAorticFlowEnd.lengthFactorH
        - arm.landTermBalance.atAorticFlowPeak.lengthFactorH,
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
