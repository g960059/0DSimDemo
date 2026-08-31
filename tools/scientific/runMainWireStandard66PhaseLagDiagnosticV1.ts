import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

import {
  runMainWireStandard66PhaseLagDiagnosticV1,
  type MainWireStandard66PhaseLagDiagnosticRunV1,
} from "@/analysis/runtime/MainWireStandard66PhaseLagDiagnosticRunnerV1";
import {
  CANONICAL_JSON_ALGORITHM_V1,
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_ARTIFACT_V1_ID =
  "main-wire-standard66-phase-lag-diagnostic-artifact-v1" as const;

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_ARTIFACT_ROOT_V1 =
  "artifacts/standard66-phase-lag-diagnostic-v1" as const;

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

export type MainWireStandard66PhaseLagDiagnosticCliArgumentsV1 = Readonly<{
  caseId: EnvelopeCaseIdV1;
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  outputPath: string | null;
  forceOverwrite: boolean;
}>;

export type MainWireStandard66PhaseLagDiagnosticArtifactV1 = Readonly<{
  artifactId: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_ARTIFACT_V1_ID;
  canonicalJsonAlgorithm: typeof CANONICAL_JSON_ALGORITHM_V1;
  payloadSha256: string;
  payload: Readonly<{
    study: Readonly<{
      caseId: EnvelopeCaseIdV1;
      clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    }>;
    run: MainWireStandard66PhaseLagDiagnosticRunV1;
    formalProtocolEligibility: false;
    numericalPeriodicityEstablished: false;
  }>;
}>;

export async function runMainWireStandard66PhaseLagDiagnosticCliV1(
  args: readonly string[] = process.argv.slice(2),
) {
  const startedAtMs = performance.now();
  const parsed = parseMainWireStandard66PhaseLagDiagnosticCliArgumentsV1(args);
  const envelopeCase =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
      ({ caseId }) => caseId === parsed.caseId,
    );
  if (envelopeCase === undefined) {
    throw new Error("phase-lag case is no longer preregistered");
  }
  const run = await runMainWireStandard66PhaseLagDiagnosticV1({
    clockArmId: parsed.clockArmId,
    hemodynamicResearchInputs: envelopeCase.hemodynamicResearchInputs,
  });
  const payload = Object.freeze({
    study: Object.freeze({
      caseId: envelopeCase.caseId,
      clockArmId: parsed.clockArmId,
    }),
    run,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
  });
  const artifact: MainWireStandard66PhaseLagDiagnosticArtifactV1 =
    Object.freeze({
      artifactId: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_ARTIFACT_V1_ID,
      canonicalJsonAlgorithm: CANONICAL_JSON_ALGORITHM_V1,
      payloadSha256: await sha256CanonicalJsonHex(payload),
      payload,
    });
  const serialized = `${canonicalJsonStringify(artifact)}\n`;
  const outputPath =
    parsed.outputPath === null
      ? path.resolve(
          MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_ARTIFACT_ROOT_V1,
          parsed.caseId,
          `${parsed.clockArmId}.json`,
        )
      : path.resolve(parsed.outputPath);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, {
    encoding: "utf8",
    flag: parsed.forceOverwrite ? "w" : "wx",
  });
  return Object.freeze({
    artifactId: artifact.artifactId,
    caseId: parsed.caseId,
    clockArmId: parsed.clockArmId,
    status: run.status,
    outputPath,
    payloadSha256: artifact.payloadSha256,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    elapsedSeconds: (performance.now() - startedAtMs) / 1_000,
  });
}

export function parseMainWireStandard66PhaseLagDiagnosticCliArgumentsV1(
  args: readonly string[],
): MainWireStandard66PhaseLagDiagnosticCliArgumentsV1 {
  const values = new Map<"--case" | "--arm" | "--output", string>();
  let forceOverwrite = false;
  for (let index = 0; index < args.length;) {
    const flag = args[index];
    if (flag === "--force") {
      if (forceOverwrite) throw new Error("--force may be specified only once");
      forceOverwrite = true;
      index += 1;
      continue;
    }
    if (flag !== "--case" && flag !== "--arm" && flag !== "--output") {
      throw new Error(
        `unsupported argument ${flag ?? "<missing>"}; expected --case and --arm`,
      );
    }
    if (values.has(flag)) throw new Error(`${flag} may be specified only once`);
    const value = args[index + 1];
    if (value === undefined || value.length === 0 || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    values.set(flag, value);
    index += 2;
  }
  const caseValue = values.get("--case");
  const armValue = values.get("--arm");
  if (caseValue === undefined) throw new Error("--case is required");
  if (armValue === undefined) throw new Error("--arm is required");
  const envelopeCase =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
      ({ caseId }) => caseId === caseValue,
    );
  if (envelopeCase === undefined) {
    throw new Error(
      "--case must name a preregistered validation-envelope case",
    );
  }
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      ({ armId }) => armId === armValue,
    );
  if (arm === undefined) {
    throw new Error("--arm must name a preregistered clock arm");
  }
  const outputPath = values.get("--output") ?? null;
  if (
    outputPath !== null &&
    path.extname(outputPath).toLowerCase() !== ".json"
  ) {
    throw new Error("--output must name a .json artifact");
  }
  return Object.freeze({
    caseId: envelopeCase.caseId,
    clockArmId: arm.armId,
    outputPath,
    forceOverwrite,
  });
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  try {
    const summary = await runMainWireStandard66PhaseLagDiagnosticCliV1();
    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 1;
  }
}
