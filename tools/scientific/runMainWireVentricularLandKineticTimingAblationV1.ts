import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_V1_ID,
  MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILE_IDS_V1,
  resolveMainWireVentricularLandKineticTimingProfileV1,
  resolveMainWireVentricularLandKineticTimingWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandKineticTimingAblationV1";

const dtSec = numericArgument("--dt", 0.001);
const outputPath = optionalArgument("--output");
const arms = MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILE_IDS_V1.map(
  (profileId) => Object.freeze({
    profile: resolveMainWireVentricularLandKineticTimingProfileV1(profileId),
    isometric: measureMainWireVentricularLandIsometricTwitchAuditV1(
      FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
      { dtSec, fixedLandStretch: 1 },
      resolveMainWireVentricularLandKineticTimingWallMaterialV1(profileId),
    ),
  }),
);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_V1_ID,
  design: Object.freeze({
    dtSec,
    profileOrder: MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_PROFILE_IDS_V1,
    claim: MAIN_WIRE_VENTRICULAR_LAND_KINETIC_TIMING_ABLATION_CLAIM_V1,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    isometricScreenOnly: true as const,
    closedLoopEffectNotInferredFromIsometricTimingAlone: true as const,
    sourceTimingOriginDirectlyReconciled: false as const,
    parameterFitOrCanonicalAdoptionEstablished: false as const,
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
    arms: report.arms.map((arm) => ({
      profileId: arm.profile.profileId,
      changedParameter: arm.profile.changedParameter,
      scaleFromBaseline: arm.profile.scaleFromBaseline,
      resolvedValue: arm.profile.resolvedValue,
      peakKPa: arm.isometric.activeTwitch.peakKPa,
      tensionTimeToPeakMs:
        arm.isometric.activeTwitch.timeToPeakSec * 1000,
      tensionRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      tensionRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      tensionDurationAboveHalfMs:
        arm.isometric.activeTwitch.durationAboveHalfMaximumSec * 1000,
      tensionPeakCount:
        arm.isometric.activeTwitch.localPeakCountAboveFivePercentAmplitude,
      everyStepValid: arm.isometric.numericalHealth.everyStepValid,
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
