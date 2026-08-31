import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID,
  summarizeMainWireStandard66ValidationEnvelopeV1,
  type MainWireStandard66ValidationEnvelopeSummaryResultV1,
} from "@/analysis/methods/mainWire/MainWireStandard66ValidationEnvelopeSummaryV1";
import { parseMainWireStandard66ValidationRunArtifactV1 } from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import { MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

const REQUIRED_INPUT_COUNT_V1 =
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.length;

export type MainWireStandard66ValidationEnvelopeSummaryCliResultV1 =
  Readonly<{
    summary: MainWireStandard66ValidationEnvelopeSummaryResultV1;
    serialized: string;
    inputPaths: readonly string[];
    outputPath: string | null;
    receipt: Readonly<{
      evaluatorId: typeof MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID;
      summarySha256: string;
      status: MainWireStandard66ValidationEnvelopeSummaryResultV1["status"];
      caseCount: number | null;
      metricCount: number | null;
      unavailableReasonCount: number | null;
      inputPaths: readonly string[];
      outputPath: string | null;
      byteLength: number;
    }>;
  }>;

/**
 * Reads and summarizes existing canonical run artifacts only. This command
 * never constructs a model session or advances the numerical model.
 */
export async function summarizeMainWireStandard66ValidationEnvelopeCliV1(
  args: readonly string[] = process.argv.slice(2),
): Promise<MainWireStandard66ValidationEnvelopeSummaryCliResultV1> {
  const parsed = parseArgumentsV1(args);
  const artifacts = await Promise.all(
    parsed.inputPaths.map(async (inputPath) =>
      parseMainWireStandard66ValidationRunArtifactV1(
        await readFile(inputPath, "utf8"),
      ),
    ),
  );
  const summary =
    await summarizeMainWireStandard66ValidationEnvelopeV1(artifacts);
  const serialized = canonicalJsonStringify(summary);

  if (parsed.outputPath !== null) {
    await mkdir(path.dirname(parsed.outputPath), { recursive: true });
    await writeFile(parsed.outputPath, `${serialized}\n`, {
      encoding: "utf8",
      flag: parsed.forceOverwrite ? "w" : "wx",
    });
  }

  const available = summary.status === "envelope-summarized";
  return Object.freeze({
    summary,
    serialized,
    inputPaths: parsed.inputPaths,
    outputPath: parsed.outputPath,
    receipt: Object.freeze({
      evaluatorId: MAIN_WIRE_STANDARD66_VALIDATION_ENVELOPE_SUMMARY_V1_ID,
      summarySha256: await sha256CanonicalJsonHex(summary),
      status: summary.status,
      caseCount: available ? summary.caseRows.length : null,
      metricCount: available ? summary.metricExtrema.length : null,
      unavailableReasonCount: available
        ? null
        : summary.unavailableReasons.length,
      inputPaths: parsed.inputPaths,
      outputPath: parsed.outputPath,
      byteLength: Buffer.byteLength(`${serialized}\n`),
    }),
  });
}

function parseArgumentsV1(args: readonly string[]): Readonly<{
  inputPaths: readonly string[];
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
        `unknown argument ${argument}; usage: repeat --input run.json exactly ${REQUIRED_INPUT_COUNT_V1} times [--output envelope-summary.json] [--force]`,
      );
    }
    const value = args[index + 1];
    if (value === undefined || value.length === 0 || value.startsWith("--")) {
      throw new Error(`${argument} requires a file path`);
    }
    index += 1;
    if (argument === "--input") {
      inputs.push(path.resolve(value));
      continue;
    }
    if (output !== null) {
      throw new Error("--output may be specified only once");
    }
    output = path.resolve(value);
  }

  if (inputs.length !== REQUIRED_INPUT_COUNT_V1) {
    throw new Error(
      `exactly ${REQUIRED_INPUT_COUNT_V1} --input validation-envelope artifact paths are required`,
    );
  }
  if (output !== null && inputs.includes(output)) {
    throw new Error("--output must not overwrite an input run artifact");
  }
  if (forceOverwrite && output === null) {
    throw new Error("--force requires --output");
  }

  return Object.freeze({
    inputPaths: Object.freeze(inputs),
    outputPath: output,
    forceOverwrite,
  });
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  const result = await summarizeMainWireStandard66ValidationEnvelopeCliV1();
  process.stdout.write(
    result.outputPath === null
      ? `${result.serialized}\n`
      : `${canonicalJsonStringify(result.receipt)}\n`,
  );
}
