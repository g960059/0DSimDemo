import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildPhaseB1PairedTerminalWaveformReviewHtmlV1,
} from "@/tools/myocardium/phaseB1PairedTerminalWaveformHtmlV1";

export type RenderPhaseB1PairedTerminalWaveformHtmlOptionsV1 = Readonly<{
  inputPath: string;
  outputPath: string;
}>;

export function parseRenderPhaseB1PairedTerminalWaveformHtmlArgsV1(
  args: readonly string[],
): RenderPhaseB1PairedTerminalWaveformHtmlOptionsV1 {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag !== "--input" && flag !== "--output") {
      throw new Error(`unknown argument: ${flag}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} requires a path`);
    }
    if (flag === "--input") {
      if (inputPath !== undefined) throw new Error("--input may be specified only once");
      inputPath = value;
    } else {
      if (outputPath !== undefined) throw new Error("--output may be specified only once");
      outputPath = value;
    }
    index += 1;
  }
  if (inputPath === undefined || outputPath === undefined) {
    throw new Error("usage: --input <paired.json> --output <review.html>");
  }
  const resolvedInput = path.resolve(inputPath);
  const resolvedOutput = path.resolve(outputPath);
  if (resolvedInput === resolvedOutput) {
    throw new Error("--output must differ from --input so the raw JSON remains unchanged");
  }
  return Object.freeze({ inputPath: resolvedInput, outputPath: resolvedOutput });
}

export async function renderPhaseB1PairedTerminalWaveformHtmlFileV1(
  options: RenderPhaseB1PairedTerminalWaveformHtmlOptionsV1,
): Promise<void> {
  const rawJson = await readFile(options.inputPath, "utf8");
  let artifact: unknown;
  try {
    artifact = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`input is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const html = buildPhaseB1PairedTerminalWaveformReviewHtmlV1(
    artifact,
    (canonicalJsonUtf8) => createHash("sha256").update(canonicalJsonUtf8).digest("hex"),
  );
  await writeUtf8Atomically(options.outputPath, html);
}

async function writeUtf8Atomically(outputPath: string, content: string): Promise<void> {
  const directory = path.dirname(outputPath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = path.join(
    directory,
    `.${path.basename(outputPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

async function main(): Promise<void> {
  const options = parseRenderPhaseB1PairedTerminalWaveformHtmlArgsV1(
    process.argv.slice(2),
  );
  await renderPhaseB1PairedTerminalWaveformHtmlFileV1(options);
  process.stdout.write(`${options.outputPath}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
