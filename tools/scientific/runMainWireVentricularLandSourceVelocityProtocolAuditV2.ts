import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2,
  measureMainWireVentricularLandSourceVelocityProtocolAuditV2,
} from "@/analysis/methods/mainWire/MainWireVentricularLandSourceVelocityProtocolAuditV2";
import {
  LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1,
  deriveLand2017DerivedParameters,
  stableHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_EXPERIMENT_V2_ID =
  "main-wire-ventricular-land-source-velocity-protocol-experiment-v2" as const;

const AeffScales = Object.freeze([1, 1.25, 4 / 3, 1.5, 5 / 3, 2] as const);
const dtSec = numericArgument("--dt", 0.00025);
const outputPath = optionalArgument("--output");
const source = LAND2017_SKINNED_HUMAN_37C_SOURCE_PARAMETER_SET_V1;
const arms = Object.freeze(AeffScales.map((AeffScale) => {
  const parameterSet = AeffScale === 1
    ? source
    : scaledAeffParameterSet(source, AeffScale);
  return Object.freeze({
    AeffScale,
    sourceIdentityClaimed: AeffScale === 1,
    parameterSetId: parameterSet.parameterSetId,
    parameterSetStableHash: parameterSet.parameterSetStableHash,
    resolvedAeff: parameterSet.values.Aeff,
    audit: measureMainWireVentricularLandSourceVelocityProtocolAuditV2(
      parameterSet,
      { dtSec },
    ),
  });
}));
const canonical = arms[0]!;
const report = Object.freeze({
  artifactSchemaVersion: 2 as const,
  experimentId:
    MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_EXPERIMENT_V2_ID,
  design: Object.freeze({
    dtSec,
    AeffScales,
    sourceParameterSetId: source.parameterSetId,
    sourceParameterSetStableHash: source.parameterSetStableHash,
    protocolClaim:
      MAIN_WIRE_VENTRICULAR_LAND_SOURCE_VELOCITY_PROTOCOL_CLAIM_V2,
    hemodynamicOutcomeUsedInThisAudit: false as const,
  }),
  arms: Object.freeze(arms.map((arm) => Object.freeze({
    ...arm,
    relativeToCanonical: Object.freeze({
      initialActiveStressRatio:
        arm.audit.initialActiveStressPa / canonical.audit.initialActiveStressPa,
      constantVelocityEndRampStressFractionDifferences:
        Object.freeze(arm.audit.constantVelocityShortening.map((point, index) =>
          point.endRampActiveStressFractionOfInitial
          - canonical.audit.constantVelocityShortening[index]!
            .endRampActiveStressFractionOfInitial)),
      quickStretchAcuteIncrementRatios:
        Object.freeze(arm.audit.quickStretch.map((point, index) =>
          point.acuteEndRampStressIncrementFractionOfInitial
          / canonical.audit.quickStretch[index]!
            .acuteEndRampStressIncrementFractionOfInitial)),
    }),
  }))),
  interpretationBoundary: Object.freeze({
    sourceAeffWasFitToQuickStretchInstantaneousResponse: true as const,
    sourcePaperStatesAeffWasWeaklyConstrainedByNarrowTimeWindow: true as const,
    passingConstantVelocityCostAloneValidatesAeff: false as const,
    noncanonicalQuickStretchFitEstablished: false as const,
    noncanonicalProfilesMayRemainWholeOrganCouplingHypotheses: true as const,
    directSourceParameterIdentityForNoncanonicalProfiles: false as const,
    aorticValveOrHemodynamicCalibrationClaimed: false as const,
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
    dtSec,
    arms: report.arms.map((arm) => ({
      AeffScale: arm.AeffScale,
      resolvedAeff: arm.resolvedAeff,
      sourceConstantVelocityCost: arm.audit.sourceConstantVelocityCost,
      passesSourceConstantVelocityShortlistThreshold:
        arm.audit.passesSourceConstantVelocityShortlistThreshold,
      constantVelocityEndRampStressFractions:
        arm.audit.constantVelocityShortening.map((point) =>
          point.endRampActiveStressFractionOfInitial),
      quickStretchEndRampStressFractions:
        arm.audit.quickStretch.map((point) =>
          point.endRampActiveStressFractionOfInitial),
      quickStretchAcuteIncrementRatios:
        arm.relativeToCanonical.quickStretchAcuteIncrementRatios,
    })),
  })}\n`);
}

function scaledAeffParameterSet(
  base: Land2017SourceParameterSet,
  AeffScale: number,
): Land2017SourceParameterSet {
  const values: Land2017RuntimeParameters = Object.freeze({
    ...base.values,
    Aeff: base.values.Aeff * AeffScale,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${base.parameterSetId}-Aeff-scale-${AeffScale}`,
    sourceId: base.sourceId,
    doi: base.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(base.sourceParameters.map((entry) =>
      entry.parameter === "Aeff"
        ? Object.freeze({
          ...entry,
          location: `${entry.location}; non-source constitutive audit scale ${AeffScale}`,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime, value: values.Aeff }),
        })
        : Object.freeze({
          ...entry,
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({ ...entry.runtime }),
        }))),
    derivedParameters: Object.freeze(base.derivedParameters.map((entry) =>
      Object.freeze({ ...entry }))),
  };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableHash(hashInput),
  });
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
