import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
  compareMainWireAorticOutflowCalciumComplianceFactorialV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumComplianceFactorialV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1,
  runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_EXPERIMENT_V1_ID =
  "main-wire-aortic-outflow-calcium-compliance-factorial-experiment-v1" as const;

const dtSec = numericArgument("--dt", 0.002);
const maximumBeatCount = integerArgument(
  "--maximum-beats",
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_POLICY_V1.defaultMaximumBeatCount,
);
const outputPath = optionalArgument("--output");
const options = Object.freeze({ dtSec, maximumBeatCount });

const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
  ...options,
  laSlsMode: "on",
  pericardiumMode: "on",
  pericardiumCase: "healthy-slack",
  initialization: "canonical",
  valveDiseaseBracketIds: Object.freeze([]),
});
const calciumOnly =
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
    options,
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
  );
const capacityOnly =
  runMainWireNormalAdultFiveWallAorticCompliancePartitionResearchV1(
    options,
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
  );
const combined =
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureCompliancePartitionResearchV1(
    options,
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
  );
const inputs = Object.freeze([
  Object.freeze({
    armId: "canonical" as const,
    periodicResult: canonical,
  }),
  Object.freeze({
    armId: "delayed-calcium-only" as const,
    periodicResult: calciumOnly.periodicResult,
  }),
  Object.freeze({
    armId: "low-root-capacity-only" as const,
    periodicResult: capacityOnly.periodicResult,
  }),
  Object.freeze({
    armId: "delayed-calcium-plus-low-root-capacity" as const,
    periodicResult: combined.periodicResult,
  }),
]);
const comparison =
  compareMainWireAorticOutflowCalciumComplianceFactorialV1(inputs);
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId:
    MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_FACTORIAL_EXPERIMENT_V1_ID,
  design: Object.freeze({
    dtSec,
    maximumBeatCount,
    armOrder: MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_ARM_IDS_V1,
    calciumProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_CALCIUM_PROFILE_ID_V1,
    compliancePartitionProfileId:
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_COMPLIANCE_PARTITION_PROFILE_ID_V1,
    independentCanonicalColdStartPerArm: true as const,
    factorsSelectedAfterSeparateFixedBrackets: true as const,
    outcomeInformedFactorSelection: true as const,
    numericParameterFittingOrOptimization: false as const,
  }),
  exactIdentities: Object.freeze(inputs.map((input) => Object.freeze({
    armId: input.armId,
    protocolIdentityHash: input.periodicResult.protocolIdentityHash,
    calciumDriveStableHash:
      input.periodicResult.protocolComponentHashes
        .calciumDriveFixedParamsStableHash,
    circulationRuntimeStableHash:
      input.periodicResult.protocolComponentHashes
        .circulationRuntimeStableHash,
  }))),
  runnerClaims: Object.freeze({
    delayedCalciumOnly: calciumOnly.claim,
    lowRootCapacityOnly: capacityOnly.claim,
    combined: combined.claim,
  }),
  comparison,
  interpretationBoundary: Object.freeze({
    proximalAorticAnatomicalSupportLengthIdentified: false as const,
    capacityRedistributionIsAnatomicalCalibration: false as const,
    physiologicalAcceptanceEstablished: false as const,
    canonicalAdoptionEstablished: false as const,
    referenceContextIsClinicalPassFail: false as const,
    dtRefinementRequiredBeforeAdoption: true as const,
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
    allRunsPeriod1AndIntegrated:
      comparison.allRunsPeriod1AndIntegrated,
    morphologyPreservedAcrossFactorial:
      comparison.morphologyPreservedAcrossFactorial,
    combinedMorphologySafeDirectionalCandidate:
      comparison.combinedMorphologySafeDirectionalCandidate,
    combinedReferenceNormalizedCandidate:
      comparison.combinedReferenceNormalizedCandidate,
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
