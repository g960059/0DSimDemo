import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1,
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1,
  compareMainWireVentricularLandCalciumSourcesV1,
  type MainWireVentricularLandCalciumSourceArmInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandCalciumSourceComparisonV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_CLAIM_V1,
  createMainWireVentricularCalciumSourceAuditInputV1,
  resolveMainWireVentricularCalciumSourceProtocolV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceProtocolsV1";
import {
  MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
  measureMainWireVentricularLandIsometricTwitchAuditV1,
  measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1,
} from "@/analysis/methods/mainWire/MainWireVentricularLandIsometricTwitchAuditV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";

export const MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_AUDIT_EXPERIMENT_V1_ID =
  "main-wire-ventricular-land-calcium-source-audit-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.001);
const outputPath = optionalArgument("--output");

const arms: MainWireVentricularLandCalciumSourceArmInputV1[] = [];
for (const inputId of
  MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1) {
  for (const stretch of
    MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1) {
    const audit = inputId === "current-analytic-biexponential"
      ? measureMainWireVentricularLandIsometricTwitchAuditV1(
        FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        { dtSec, fixedLandStretch: stretch.fixedLandStretch },
      )
      : measureMainWireVentricularLandIsometricTwitchFromCalciumInputV1(
        createMainWireVentricularCalciumSourceAuditInputV1(inputId),
        { dtSec, fixedLandStretch: stretch.fixedLandStretch },
      );
    arms.push(Object.freeze({
      inputId,
      stretchContextId: stretch.contextId,
      audit,
    }));
  }
}

const comparison = compareMainWireVentricularLandCalciumSourcesV1(arms);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_AUDIT_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    inputOrder: MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_INPUT_IDS_V1,
    stretches:
      MAIN_WIRE_VENTRICULAR_LAND_CALCIUM_SOURCE_STRETCH_CONTEXTS_V1,
    sourceProtocols: Object.freeze([
      resolveMainWireVentricularCalciumSourceProtocolV1(
        "land2015-coppini-metric-hunter-construction",
      ),
      resolveMainWireVentricularCalciumSourceProtocolV1(
        "land2017-figure6-coppini-digitized",
      ),
    ]),
    sourceProtocolClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_SOURCE_PROTOCOLS_CLAIM_V1,
    auditClaim: MAIN_WIRE_VENTRICULAR_LAND_ISOMETRIC_TWITCH_AUDIT_CLAIM_V1,
    commonLandParameterSetAcrossArms: true as const,
    independentPeriodicClosurePerArm: true as const,
    parameterSearchOrFitting: false as const,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    originalNumericCoppiniTraceAvailable: false as const,
    Figure6DigitizationIsConstructionEvidenceOnly: true as const,
    sourceMeasurementUncertaintyAvailable: false as const,
    sourceTraceReproductionEstablished: false as const,
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
    allArmsPeriodicallyClosed:
      report.comparison.allArmsPeriodicallyClosed,
    arms: report.comparison.arms.map((arm) => ({
      inputId: arm.inputId,
      stretchContextId: arm.stretchContextId,
      calciumPeakUM: arm.calciumPeakUM,
      calciumTimeToPeakMs: arm.calciumTimeToPeakSec * 1000,
      activeTwitchPeakKPa: arm.activeTwitchPeakKPa,
      activeTwitchTimeToPeakMs: arm.activeTwitchTimeToPeakSec * 1000,
      activeTwitchRelaxationTime50Ms:
        arm.activeTwitchRelaxationTime50Sec === null
          ? null
          : arm.activeTwitchRelaxationTime50Sec * 1000,
      activeTwitchRelaxationTime95Ms:
        arm.activeTwitchRelaxationTime95Sec === null
          ? null
          : arm.activeTwitchRelaxationTime95Sec * 1000,
      calciumPeakCount:
        arm.calciumLocalPeakCountAboveFivePercentAmplitude,
      tensionPeakCount:
        arm.activeTwitchLocalPeakCountAboveFivePercentAmplitude,
    })),
    Land2017Figure6RestingStretchTargetResiduals:
      report.comparison.Land2017Figure6RestingStretchTargetResiduals,
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
