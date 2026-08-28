import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  fitMainWireVentricularCalciumSourceTraceV1,
  fitMainWireVentricularCalciumSourceTraceUnconstrainedAmplitudeSensitivityV1,
} from "@/analysis/methods/mainWire/MainWireVentricularCalciumSourceTraceFitV1";

const outputPath = optionalArgument("--output");
const fit = fitMainWireVentricularCalciumSourceTraceV1();
const unconstrainedAmplitudeSensitivity =
  fitMainWireVentricularCalciumSourceTraceUnconstrainedAmplitudeSensitivityV1();
const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  experimentId: "main-wire-ventricular-calcium-source-trace-fit-experiment-v1" as const,
  fit,
  unconstrainedAmplitudeSensitivity,
  interpretationBoundary: Object.freeze({
    figureDigitizationIsConstructionEvidenceOnly: true as const,
    sourceMeasurementCovarianceAvailable: false as const,
    sourceBiologicalConditionResolved: false as const,
    electricalToCalciumDelayIdentified: false as const,
    hemodynamicOutcomeUsed: false as const,
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
    parameters: fit.parameters,
    shape: fit.shape,
    approximation: fit.approximation,
    optimization: fit.optimization,
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
