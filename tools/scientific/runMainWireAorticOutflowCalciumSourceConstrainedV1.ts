import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  compareMainWireAorticOutflowCalciumSourceConstrainedV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumSourceConstrainedComparisonV1";
import {
  measureMainWireVentricularLandIsometricTwitchAuditV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumSourceConstrainedParamsV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumSourceConstrainedPriorV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-source-constrained-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const twitchDtSec = numericArgument("--twitch-dt", 0.001);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");

const runs =
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1.map(
    (profileId) =>
      runMainWireNormalAdultFiveWallVentricularCalciumSourceConstrainedResearchV1(
        { dtSec, maximumBeatCount },
        profileId,
      ),
  );
const comparison = compareMainWireAorticOutflowCalciumSourceConstrainedV1(
  runs.map((run) => ({
    profileId: run.profile.profileId,
    periodicResult: run.periodicResult,
  })),
);
const isometricAudits = Object.freeze(Object.fromEntries(
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1.map(
    (profileId) => [
      profileId,
      measureMainWireVentricularLandIsometricTwitchAuditV1(
        resolveMainWireVentricularCalciumSourceConstrainedParamsV1(profileId),
        { dtSec: twitchDtSec, fixedLandStretch: 1 },
      ),
    ],
  ),
));
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_SOURCE_CONSTRAINED_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    twitchDtSec,
    maximumBeatCount,
    profileOrder:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PROFILE_IDS_V1,
    independentCanonicalColdStartPerProfile: true as const,
    commonAorticValveLawAndCirculatoryLoad: true as const,
    commonMechanicalMaterialParams: true as const,
    sourcePriorClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_CONSTRAINED_PRIOR_CLAIM_V1,
  }),
  comparison,
  isometricAudits,
  interpretationBoundary: Object.freeze({
    figureDigitizationIsConstructionEvidenceOnly: true as const,
    originalNumericSourceTraceAvailable: false as const,
    sourceMeasurementUncertaintyAvailable: false as const,
    wholeTraceReproductionEstablished: false as const,
    hemodynamicTargetUsedToDeriveCandidate: false as const,
    clinicalNormalityPassFailApplied: false as const,
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
  const candidate = comparison.arms[1]!;
  const candidateAudit = isometricAudits[
    "land2017-figure6-source-constrained-biexponential"
  ];
  process.stdout.write(`${JSON.stringify({
    experimentId: report.experimentId,
    outputPath: absoluteOutputPath,
    byteLength: Buffer.byteLength(serialized),
    nonCalciumProtocolComponentsCommon:
      comparison.nonCalciumProtocolComponentsCommon,
    sourceApproximation: comparison.sourceApproximation,
    candidateCycle: {
      aorticForwardVolumeMl: candidate.cycle.aorticForwardVolumeMl,
      aorticMaximumFlowMlPerSec: candidate.cycle.aorticMaximumFlowMlPerSec,
      aorticEjectionTimeMs:
        candidate.cycle.aorticEjectionTimeProxySec * 1000,
      meanDopplerGradientMmHg: candidate.cycle.meanDopplerGradientMmHg,
      peakDopplerGradientMmHg: candidate.cycle.peakDopplerGradientMmHg,
      cardiacOutputLPerMin: candidate.cycle.netAorticCardiacOutputLPerMin,
      meanAorticPressureMmHg: candidate.cycle.meanAorticAbsolutePressureMmHg,
    },
    candidateVsCanonical: comparison.candidateVsCanonical,
    candidateScreen: comparison.candidateScreen,
    candidateIsometricAudit: {
      calciumPeakUM: candidateAudit.calcium.maximum,
      calciumTimeToPeakMs: candidateAudit.calcium.timeToPeakSec * 1000,
      activeTwitchPeakKPa: candidateAudit.activeTwitch.peakKPa,
      activeTwitchTimeToPeakMs:
        candidateAudit.activeTwitch.timeToPeakSec * 1000,
      activeTwitchRelaxationTime50Ms:
        candidateAudit.activeTwitch.relaxationTime50Sec === null
          ? null
          : candidateAudit.activeTwitch.relaxationTime50Sec * 1000,
      activeTwitchRelaxationTime95Ms:
        candidateAudit.activeTwitch.relaxationTime95Sec === null
          ? null
          : candidateAudit.activeTwitch.relaxationTime95Sec * 1000,
    },
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
