import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_V1_ID,
  evaluateMainWireVentricularCalciumSameOnsetTailMixtureV1,
  resolveMainWireVentricularCalciumSameOnsetTailMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSameOnsetTailMixtureV1";

const dtSec = numericArgument("--dt", 0.001);
const outputPath = optionalArgument("--output");
const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
const arms =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILE_IDS_V1.map(
    (profileId) => Object.freeze({
      profile:
        resolveMainWireVentricularCalciumSameOnsetTailMixtureProfileV1(
          profileId,
        ),
      isometric: measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
        Object.freeze({
          calciumInputId: profileId,
          calciumInputKind: "current-analytic-reconstruction" as const,
          cycleLengthSec: prior.cycleLengthSec,
          diastolicCalciumUM: prior.ventricular.diastolicCalciumUM,
          electricalToCalciumDelaySec:
            prior.ventricular.electricalToCalciumDelaySec,
          sourceDoi: "10.1016/j.yjmcc.2017.03.008",
          sourceDescription:
            "state-free same-onset slow-removal-component research screen",
          originalNumericSourceTraceUsed: false as const,
          figureDigitizationUsed: false as const,
          smoothingApplied: false as const,
          fittingApplied: false as const,
          evaluateFreeCalciumUM: (timeSec: number) =>
            evaluateMainWireVentricularCalciumSameOnsetTailMixtureV1(
              timeSec,
              profileId,
            ),
        }),
        { dtSec, fixedLandStretch: 1 },
      ),
    }),
  );
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_V1_ID,
  design: Object.freeze({
    dtSec,
    profileOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_PROFILE_IDS_V1,
    claim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SAME_ONSET_TAIL_MIXTURE_CLAIM_V1,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    offlineIsometricScreenOnly: true as const,
    exactClosedLoopModelChanged: false as const,
    hemodynamicOutcomeUsed: false as const,
    closedLoopEvaluationRequiresExplicitPromotion: true as const,
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
      slowDecayScale: arm.profile.slowDecayTimeScaleFromPrior,
      slowWeight: arm.profile.slowComponentWeight01,
      calciumTimeToPeakMs: arm.profile.mixtureTimeToPeakSec * 1000,
      calciumExposureScale:
        arm.profile.supradiastolicCalciumExposureScaleFromPrior,
      calciumRelaxationTime50Ms:
        arm.isometric.calcium.relaxationTime50Sec! * 1000,
      calciumRelaxationTime95Ms:
        arm.isometric.calcium.relaxationTime95Sec! * 1000,
      tensionPeakKPa: arm.isometric.activeTwitch.peakKPa,
      tensionTimeToPeakMs:
        arm.isometric.activeTwitch.timeToPeakSec * 1000,
      tensionRelaxationTime50Ms:
        arm.isometric.activeTwitch.relaxationTime50Sec! * 1000,
      tensionRelaxationTime95Ms:
        arm.isometric.activeTwitch.relaxationTime95Sec! * 1000,
      calciumPeakCount:
        arm.isometric.calcium.localPeakCountAboveFivePercentAmplitude,
      tensionPeakCount:
        arm.isometric.activeTwitch.localPeakCountAboveFivePercentAmplitude,
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
