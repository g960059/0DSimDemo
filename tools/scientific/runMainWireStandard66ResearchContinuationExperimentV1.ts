import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

import {
  runMainWireStandard66ResearchContinuationExperimentV1,
  type MainWireStandard66ResearchContinuationExperimentResultV1,
} from "@/analysis/runtime/MainWireStandard66ResearchContinuationExperimentRunnerV1";
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

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_ARTIFACT_V1_ID =
  "main-wire-standard66-research-continuation-artifact-v1" as const;

export const MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_ARTIFACT_ROOT_V1 =
  "artifacts/standard66-research-continuation-v1" as const;

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

export type MainWireStandard66ResearchContinuationCliArgumentsV1 =
  Readonly<{
    sourceCaseId: EnvelopeCaseIdV1;
    targetCaseId: EnvelopeCaseIdV1;
    clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
    maximumContinuationDurationSec: number;
    outputPath: string | null;
    forceOverwrite: boolean;
  }>;

export type MainWireStandard66ResearchContinuationArtifactV1 = Readonly<{
  artifactId:
    typeof MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_ARTIFACT_V1_ID;
  canonicalJsonAlgorithm: typeof CANONICAL_JSON_ALGORITHM_V1;
  payloadSha256: string;
  payload: Readonly<{
    study: Readonly<{
      sourceCaseId: EnvelopeCaseIdV1;
      targetCaseId: EnvelopeCaseIdV1;
      clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
      maximumContinuationDurationSec: number;
    }>;
    run: MainWireStandard66ResearchContinuationExperimentResultV1;
    formalProtocolEligibility: false;
    numericalPeriodicityEstablished: false;
  }>;
}>;

export async function runMainWireStandard66ResearchContinuationCliV1(
  args: readonly string[] = process.argv.slice(2),
) {
  const startedAtMs = performance.now();
  const parsed = parseMainWireStandard66ResearchContinuationCliArgumentsV1(
    args,
  );
  const sourceCase = requireEnvelopeCaseV1(parsed.sourceCaseId);
  const targetCase = requireEnvelopeCaseV1(parsed.targetCaseId);
  const outputPath = parsed.outputPath === null
    ? path.resolve(
        MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_ARTIFACT_ROOT_V1,
        `${parsed.sourceCaseId}-to-${parsed.targetCaseId}`,
        `${parsed.clockArmId}.json`,
      )
    : path.resolve(parsed.outputPath);
  if (!parsed.forceOverwrite && existsSync(outputPath)) {
    throw new Error(
      `continuation artifact already exists: ${outputPath}`,
    );
  }
  const run = await runMainWireStandard66ResearchContinuationExperimentV1({
    sourceHemodynamicResearchInputs: sourceCase.hemodynamicResearchInputs,
    targetHemodynamicResearchInputs: targetCase.hemodynamicResearchInputs,
    clockArmId: parsed.clockArmId,
    maximumContinuationDurationSec:
      parsed.maximumContinuationDurationSec,
  });
  const payload = Object.freeze({
    study: Object.freeze({
      sourceCaseId: sourceCase.caseId,
      targetCaseId: targetCase.caseId,
      clockArmId: parsed.clockArmId,
      maximumContinuationDurationSec:
        parsed.maximumContinuationDurationSec,
    }),
    run,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
  });
  const artifact: MainWireStandard66ResearchContinuationArtifactV1 =
    Object.freeze({
      artifactId:
        MAIN_WIRE_STANDARD66_RESEARCH_CONTINUATION_ARTIFACT_V1_ID,
      canonicalJsonAlgorithm: CANONICAL_JSON_ALGORITHM_V1,
      payloadSha256: await sha256CanonicalJsonHex(payload),
      payload,
    });
  const serialized = `${canonicalJsonStringify(artifact)}\n`;
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, {
    encoding: "utf8",
    flag: parsed.forceOverwrite ? "w" : "wx",
  });
  return Object.freeze({
    artifactId: artifact.artifactId,
    sourceCaseId: parsed.sourceCaseId,
    targetCaseId: parsed.targetCaseId,
    clockArmId: parsed.clockArmId,
    status: run.continuation.status,
    sourceConfirmationTimeSec:
      run.sourceQualification.freshConfirmation.terminalAcceptedTimeSec,
    continuationCandidate: run.continuation.candidate,
    continuationFreshConfirmation: run.continuation.freshConfirmation,
    executionTiming: run.executionTiming,
    latestObservation: run.continuation.observations.at(-1) ?? null,
    outputPath,
    payloadSha256: artifact.payloadSha256,
    formalProtocolEligibility: false as const,
    numericalPeriodicityEstablished: false as const,
    elapsedSeconds: (performance.now() - startedAtMs) / 1_000,
  });
}

export function parseMainWireStandard66ResearchContinuationCliArgumentsV1(
  args: readonly string[],
): MainWireStandard66ResearchContinuationCliArgumentsV1 {
  const values = new Map<
    "--source-case" | "--target-case" | "--arm" | "--max-seconds" | "--output",
    string
  >();
  let forceOverwrite = false;
  for (let index = 0; index < args.length;) {
    const flag = args[index];
    if (flag === "--force") {
      if (forceOverwrite) throw new Error("--force may be specified only once");
      forceOverwrite = true;
      index += 1;
      continue;
    }
    if (
      flag !== "--source-case"
      && flag !== "--target-case"
      && flag !== "--arm"
      && flag !== "--max-seconds"
      && flag !== "--output"
    ) {
      throw new Error(
        "continuation experiment requires --source-case, --target-case, and --arm",
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
  const sourceCase = requireEnvelopeCaseV1(
    requiredValueV1(values, "--source-case"),
  );
  const targetCase = requireEnvelopeCaseV1(
    requiredValueV1(values, "--target-case"),
  );
  if (sourceCase.caseId === targetCase.caseId) {
    throw new Error("continuation source and target cases must differ");
  }
  if (
    sourceCase.hemodynamicResearchInputs.heartRateBpm
      !== targetCase.hemodynamicResearchInputs.heartRateBpm
  ) {
    throw new Error(
      "continuation source and target cases must have the same heart rate",
    );
  }
  const armValue = requiredValueV1(values, "--arm");
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      ({ armId }) => armId === armValue,
    );
  if (arm === undefined) {
    throw new Error("--arm must name a preregistered clock arm");
  }
  const maximumContinuationDurationSec = Number(
    values.get("--max-seconds") ?? "120",
  );
  if (
    !Number.isFinite(maximumContinuationDurationSec)
    || maximumContinuationDurationSec <= 0
    || maximumContinuationDurationSec > 250
  ) {
    throw new Error("--max-seconds must be within (0, 250]");
  }
  const outputPath = values.get("--output") ?? null;
  if (outputPath !== null && path.extname(outputPath).toLowerCase() !== ".json") {
    throw new Error("--output must name a .json artifact");
  }
  return Object.freeze({
    sourceCaseId: sourceCase.caseId,
    targetCaseId: targetCase.caseId,
    clockArmId: arm.armId,
    maximumContinuationDurationSec,
    outputPath,
    forceOverwrite,
  });
}

function requireEnvelopeCaseV1(
  caseId: string,
): MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1 {
  const envelopeCase =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
      (candidate) => candidate.caseId === caseId,
    );
  if (envelopeCase === undefined) {
    throw new Error("case must name a preregistered validation-envelope case");
  }
  return envelopeCase;
}

function requiredValueV1(
  values: ReadonlyMap<string, string>,
  flag: string,
): string {
  const value = values.get(flag);
  if (value === undefined) throw new Error(`${flag} is required`);
  return value;
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined
  && import.meta.url === pathToFileURL(entryPath).href
) {
  try {
    const summary = await runMainWireStandard66ResearchContinuationCliV1();
    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    })}\n`);
    process.exitCode = 1;
  }
}
