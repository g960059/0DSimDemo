import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID,
  createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1,
  serializeMainWireStandard66ValidationTimestepComparisonArtifactV1,
  type MainWireStandard66ValidationTimestepComparisonArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationTimestepComparisonArtifactV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

export type MainWireStandard66ValidationArmArtifactComparisonCliResultV1 =
  Readonly<{
    artifact: MainWireStandard66ValidationTimestepComparisonArtifactV1;
    serialized: string;
    inputPaths: readonly [string, string, string];
    outputPath: string | null;
    receipt: Readonly<{
      artifactId: typeof MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID;
      artifactSha256: string;
      payloadSha256: string;
      comparisonStatus: MainWireStandard66ValidationTimestepComparisonArtifactV1["payload"]["comparisonResult"]["status"];
      numericalAgreementEvaluated: boolean;
      allPreregisteredPairwiseNumericalAgreementGatesPassed: boolean | null;
      gateEvaluationCount: number | null;
      passedGateCount: number | null;
      failedGateCount: number | null;
      inputPaths: readonly [string, string, string];
      outputPath: string | null;
      byteLength: number;
    }>;
  }>;

export type MainWireStandard66ValidationComparisonReceiptGateSummaryV1 =
  Readonly<{
    numericalAgreementEvaluated: boolean;
    allPreregisteredPairwiseNumericalAgreementGatesPassed: boolean | null;
    gateEvaluationCount: number | null;
    passedGateCount: number | null;
    failedGateCount: number | null;
  }>;

type ReceiptComparisonResultV1 =
  | Readonly<{ status: "unavailable" }>
  | Readonly<{
      status: "pairwise-gates-evaluated";
      summary: Readonly<{
        allPreregisteredPairwiseNumericalAgreementGatesPassed: boolean;
        gateEvaluationCount: number;
        passedGateCount: number;
        failedGateCount: number;
      }>;
    }>;

export function summarizeMainWireStandard66ValidationComparisonForReceiptV1(
  comparisonResult: ReceiptComparisonResultV1,
): MainWireStandard66ValidationComparisonReceiptGateSummaryV1 {
  if (comparisonResult.status === "unavailable") {
    return Object.freeze({
      numericalAgreementEvaluated: false,
      allPreregisteredPairwiseNumericalAgreementGatesPassed: null,
      gateEvaluationCount: null,
      passedGateCount: null,
      failedGateCount: null,
    });
  }
  return Object.freeze({
    numericalAgreementEvaluated: true,
    allPreregisteredPairwiseNumericalAgreementGatesPassed:
      comparisonResult.summary
        .allPreregisteredPairwiseNumericalAgreementGatesPassed,
    gateEvaluationCount: comparisonResult.summary.gateEvaluationCount,
    passedGateCount: comparisonResult.summary.passedGateCount,
    failedGateCount: comparisonResult.summary.failedGateCount,
  });
}

/** Reads three existing arm artifacts; it never executes the numerical model. */
export async function compareMainWireStandard66ValidationArmArtifactsCliV1(
  args: readonly string[] = process.argv.slice(2),
): Promise<MainWireStandard66ValidationArmArtifactComparisonCliResultV1> {
  const parsed = parseArgumentsV1(args);
  const serializedRuns = await Promise.all(
    parsed.inputPaths.map((inputPath) => readFile(inputPath, "utf8")),
  );
  const artifact =
    await createMainWireStandard66ValidationTimestepComparisonArtifactFromSerializedRunsV1(
      serializedRuns,
    );
  const serialized =
    await serializeMainWireStandard66ValidationTimestepComparisonArtifactV1(
      artifact,
    );
  const comparisonResult = artifact.payload.comparisonResult;
  const receiptGateSummary =
    summarizeMainWireStandard66ValidationComparisonForReceiptV1(
      comparisonResult,
    );
  if (parsed.outputPath !== null) {
    await mkdir(path.dirname(parsed.outputPath), { recursive: true });
    await writeFile(parsed.outputPath, `${serialized}\n`, {
      encoding: "utf8",
      flag: parsed.forceOverwrite ? "w" : "wx",
    });
  }
  return Object.freeze({
    artifact,
    serialized,
    inputPaths: parsed.inputPaths,
    outputPath: parsed.outputPath,
    receipt: Object.freeze({
      artifactId:
        MAIN_WIRE_STANDARD66_VALIDATION_TIMESTEP_COMPARISON_ARTIFACT_V1_ID,
      artifactSha256: await sha256CanonicalJsonHex(artifact),
      payloadSha256: artifact.payloadSha256,
      comparisonStatus: comparisonResult.status,
      ...receiptGateSummary,
      inputPaths: parsed.inputPaths,
      outputPath: parsed.outputPath,
      byteLength: Buffer.byteLength(`${serialized}\n`),
    }),
  });
}

function parseArgumentsV1(args: readonly string[]): Readonly<{
  inputPaths: readonly [string, string, string];
  outputPath: string | null;
  forceOverwrite: boolean;
}> {
  const inputs: string[] = [];
  let output: string | null = null;
  let forceOverwrite = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === "--force") {
      if (forceOverwrite) {
        throw new Error("--force may be specified only once");
      }
      forceOverwrite = true;
      continue;
    }
    if (argument !== "--input" && argument !== "--output") {
      throw new Error(
        `unknown argument ${argument}; usage: --input arm-2ms.json --input arm-1ms.json --input arm-0p5ms.json [--output comparison.json]`,
      );
    }
    const value = args[index + 1];
    if (value === undefined || value.length === 0 || value.startsWith("--")) {
      throw new Error(`${argument} requires a file path`);
    }
    index += 1;
    if (argument === "--input") {
      inputs.push(path.resolve(value));
    } else {
      if (output !== null) {
        throw new Error("--output may be specified only once");
      }
      output = path.resolve(value);
    }
  }
  if (inputs.length !== 3) {
    throw new Error("exactly three --input arm artifact paths are required");
  }
  if (output !== null && inputs.includes(output)) {
    throw new Error("--output must not overwrite an input arm artifact");
  }
  if (forceOverwrite && output === null) {
    throw new Error("--force requires --output");
  }
  return Object.freeze({
    inputPaths: Object.freeze([inputs[0]!, inputs[1]!, inputs[2]!] as const),
    outputPath: output,
    forceOverwrite,
  });
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  const result = await compareMainWireStandard66ValidationArmArtifactsCliV1();
  if (result.outputPath === null) {
    process.stdout.write(`${result.serialized}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result.receipt)}\n`);
  }
}
