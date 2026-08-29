import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  evaluateFiveWallNormalCalciumDriveV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_BRACKET_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumLandCoppiniAmplitudeParamsV1,
  resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumLandCoppiniAmplitudeBracketV1";
import {
  resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";

export const MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_ISOMETRIC_V1_ID =
  "main-wire-ventricular-land-coppini-amplitude-isometric-v1" as const;

const dtSec = numericArgument("--dt", 0.001);
const outputPath = optionalArgument("--output");
const targetPeakStressKPa = 51;
const material = resolveMainWireVentricularLandWholeOrganKuwWallMaterialV1(
  "land-whole-organ-kuw-nu4",
);
const arms =
  MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_PROFILE_IDS_V1.map(
    (profileId) => {
      const profile =
        resolveMainWireVentricularCalciumLandCoppiniAmplitudeProfileV1(
          profileId,
        );
      const calciumDriveParams =
        resolveMainWireVentricularCalciumLandCoppiniAmplitudeParamsV1(
          profileId,
        );
      const isometric =
        measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
          Object.freeze({
            calciumInputId: calciumDriveParams.parameterSetId,
            calciumInputKind:
              "primary-repository-shape-amplitude-bracket" as const,
            cycleLengthSec: calciumDriveParams.cycleLengthSec,
            diastolicCalciumUM:
              calciumDriveParams.ventricular.diastolicCalciumUM,
            electricalToCalciumDelaySec:
              calciumDriveParams.ventricular.electricalToCalciumDelaySec,
            sourceDoi: "10.1016/j.yjmcc.2017.03.008",
            sourceDescription:
              "primary-repository humanCai shape with fixed supraminimum amplitude scale",
            originalNumericSourceTraceUsed:
              profile.supraminimumAmplitudeScaleFromSource === 1,
            figureDigitizationUsed: false as const,
            smoothingApplied: false as const,
            fittingApplied: false as const,
            evaluateFreeCalciumUM: (timeSec: number) =>
              evaluateFiveWallNormalCalciumDriveV1(
                timeSec,
                calciumDriveParams,
              ).freeCalciumUMByWall.LVFW,
          }),
          { dtSec, fixedLandStretch: 1 },
          material,
        );
      return Object.freeze({
        profile,
        calciumDriveParams,
        isometric,
        exactTrefScaleForTargetPeakStress:
          targetPeakStressKPa / isometric.activeTwitch.peakKPa,
      });
    },
  );

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_LAND_COPPINI_AMPLITUDE_ISOMETRIC_V1_ID,
  design: Object.freeze({
    dtSec,
    fixedLandStretch: 1 as const,
    kuwProfileId: "land-whole-organ-kuw-nu4" as const,
    targetPeakStressKPa,
    amplitudeClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_LAND_COPPINI_AMPLITUDE_BRACKET_CLAIM_V1,
    hemodynamicOutcomeUsed: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    trefCompensationUsesExactStressLinearity: true as const,
    compensatedTwitchTimingRequiresNoResimulation: true as const,
    loadedOrClosedLoopOutcomeUsed: false as const,
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
      amplitudeScale: arm.profile.supraminimumAmplitudeScaleFromSource,
      peakCalciumUM: arm.profile.resolvedPeakCalciumUM,
      timeToPeakMs: arm.isometric.activeTwitch.timeToPeakSec * 1000,
      relaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      relaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      uncompensatedPeakStressKPa: arm.isometric.activeTwitch.peakKPa,
      exactTrefScaleFor51KPa: arm.exactTrefScaleForTargetPeakStress,
      resolvedCompensatedTrefKPa:
        material.landEquationParameters.values.Tref
        * arm.exactTrefScaleForTargetPeakStress,
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
