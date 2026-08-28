import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumWaveformParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";

export const MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_EXPERIMENT_V1_ID =
  "main-wire-ventricular-land-isometric-twitch-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.001);
const outputPath = optionalArgument("--output");
const sourceRestingStretch = 1;
const normalPriorLoadedReferenceStretch = 1.1;
const calciumProfiles = Object.freeze([
  Object.freeze({
    profileId: "canonical" as const,
    params: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  }),
  ...MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1
    .filter((profileId) => profileId !== "canonical")
    .map((profileId) => Object.freeze({
      profileId,
      params: resolveMainWireVentricularCalciumWaveformParamsV1(profileId),
    })),
  ...MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
    (profileId) => Object.freeze({
      profileId,
      params: resolveMainWireVentricularCalciumDelayedMixtureParamsV1(profileId),
    }),
  ),
]);
const stretches = Object.freeze([
  Object.freeze({
    context: "Land-source-resting-extension-ratio" as const,
    fixedLandStretch: sourceRestingStretch,
  }),
  Object.freeze({
    context: "normal-prior-loaded-reference-stretch" as const,
    fixedLandStretch: normalPriorLoadedReferenceStretch,
  }),
]);
const arms = calciumProfiles.flatMap(({ profileId, params }) =>
  stretches.map(({ context, fixedLandStretch }) => Object.freeze({
    profileId,
    stretchContext: context,
    result: measureMainWireVentricularLandIsometricTwitchAuditV1(
      params,
      { dtSec, fixedLandStretch },
    ),
  })));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    calciumProfileOrder: Object.freeze(
      calciumProfiles.map(({ profileId }) => profileId),
    ),
    stretches,
    auditClaim:
      MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
    independentColdStartPerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  arms,
  interpretationBoundary: Object.freeze({
    Land2017ReferenceUsesCoppiniCalciumTrace: true as const,
    thisExperimentUsesOriginalNumericCoppiniTrace: false as const,
    currentInputsAreAnalyticReconstructionsNotDigitizedSourceTrace:
      true as const,
    sourceMetricScreensAreDirectionalOnly: true as const,
    loadedWholeHeartBehaviorEstablished: false as const,
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
    arms: report.arms.map(({ profileId, stretchContext, result }) => ({
      profileId,
      stretchContext,
      converged: result.periodicClosure.converged,
      calciumPeakCount:
        result.calcium.localPeakCountAboveFivePercentAmplitude,
      tensionPeakCount:
        result.activeTwitch.localPeakCountAboveFivePercentAmplitude,
      tensionTimeToPeakMs: result.activeTwitch.timeToPeakSec * 1000,
      tensionRelaxationTime50Ms:
        result.activeTwitch.relaxationTime50Sec === null
          ? null
          : result.activeTwitch.relaxationTime50Sec * 1000,
      tensionRelaxationTime95Ms:
        result.activeTwitch.relaxationTime95Sec === null
          ? null
          : result.activeTwitch.relaxationTime95Sec * 1000,
      peakTensionKPa: result.activeTwitch.peakKPa,
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
