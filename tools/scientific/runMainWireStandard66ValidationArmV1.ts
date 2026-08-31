import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

import {
  createMainWireStandard66ValidationRunArtifactV1,
  serializeMainWireStandard66ValidationRunArtifactV1,
} from "@/analysis/runtime/MainWireStandard66ValidationRunArtifactV1";
import {
  runMainWireStandard66ValidationArmV1,
  type MainWireStandard66ValidationArmResultV1,
} from "@/analysis/runtime/MainWireStandard66ValidationArmRunnerV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1,
  type MainWireIntegratedModelStandard66ValidationClockArmIdV1,
  type MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard66ValidationPreregistrationV1";

export const MAIN_WIRE_STANDARD66_VALIDATION_ARTIFACT_ROOT_V1 =
  "artifacts/standard66-validation-v1" as const;

type EnvelopeCaseIdV1 =
  MainWireIntegratedModelStandard66ValidationEnvelopeCaseV1["caseId"];

export type MainWireStandard66ValidationArmCliArgumentsV1 = Readonly<{
  caseId: EnvelopeCaseIdV1;
  clockArmId: MainWireIntegratedModelStandard66ValidationClockArmIdV1;
  outputPath: string | null;
  boundedSmokeHorizonSec: number | null;
  forceOverwrite: boolean;
}>;

const CLI_VALUE_FLAGS_V1 = Object.freeze([
  "--case",
  "--arm",
  "--output",
  "--bounded-smoke-seconds",
] as const);

const CLI_FORCE_FLAG_V1 = "--force" as const;

/**
 * Runs exactly one authenticated validation-envelope coordinate. Scientific
 * non-settlement is a serializable result, not a CLI failure.
 */
export async function runMainWireStandard66ValidationArmCliV1(
  args: readonly string[] = process.argv.slice(2),
) {
  const startedAtMs = performance.now();
  const parsed = parseMainWireStandard66ValidationArmCliArgumentsV1(args);
  const envelopeCase = requireEnvelopeCaseV1(parsed.caseId);
  const executionPurpose =
    parsed.boundedSmokeHorizonSec === null
      ? ("preregistered-validation" as const)
      : ("bounded-smoke" as const);
  const armResult = await runMainWireStandard66ValidationArmV1({
    clockArmId: parsed.clockArmId,
    executionPurpose,
    boundedSmokeHorizonSec:
      parsed.boundedSmokeHorizonSec === null
        ? undefined
        : parsed.boundedSmokeHorizonSec,
    hemodynamicResearchInputs: envelopeCase.hemodynamicResearchInputs,
  });
  const artifact = await createMainWireStandard66ValidationRunArtifactV1({
    study: Object.freeze({
      studyKind: "validation-envelope" as const,
      caseId: envelopeCase.caseId,
    }),
    armResult,
  });
  const serialized = `${await serializeMainWireStandard66ValidationRunArtifactV1(artifact)}\n`;
  const outputPath = resolveOutputPathV1(parsed, executionPurpose);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, {
    encoding: "utf8",
    flag: parsed.forceOverwrite ? "w" : "wx",
  });

  return Object.freeze({
    artifactId: artifact.artifactId,
    study: artifact.payload.study,
    clockArmId: parsed.clockArmId,
    executionPurpose,
    status: armResult.status,
    outputPath,
    byteLength: Buffer.byteLength(serialized),
    hashes: Object.freeze({
      protocolManifestSha256: artifact.protocolManifestSha256,
      payloadSha256: artifact.payloadSha256,
      armProtocolIdentitySha256: armResult.protocolIdentityHash,
      comparisonProtocolIdentitySha256:
        armResult.comparisonProtocolIdentityHash,
      comparisonCohortIdentitySha256: armResult.comparisonCohortIdentityHash,
      constructionIdentitySha256: armResult.constructionIdentityHash,
    }),
    settlement: compactSettlementV1(armResult),
    confirmation: compactConfirmationV1(armResult),
    keyMetrics: compactKeyMetricsV1(armResult),
    elapsedSeconds: (performance.now() - startedAtMs) / 1_000,
  });
}

export function parseMainWireStandard66ValidationArmCliArgumentsV1(
  args: readonly string[],
): MainWireStandard66ValidationArmCliArgumentsV1 {
  const values = new Map<(typeof CLI_VALUE_FLAGS_V1)[number], string>();
  let forceOverwrite = false;
  for (let index = 0; index < args.length;) {
    const flag = args[index];
    if (flag === CLI_FORCE_FLAG_V1) {
      if (forceOverwrite) {
        throw new Error(`${CLI_FORCE_FLAG_V1} may be specified only once`);
      }
      forceOverwrite = true;
      index += 1;
      continue;
    }
    if (
      flag === undefined ||
      !CLI_VALUE_FLAGS_V1.includes(flag as (typeof CLI_VALUE_FLAGS_V1)[number])
    ) {
      throw new Error(
        `unsupported argument ${flag ?? "<missing>"}; expected --case and --arm`,
      );
    }
    const typedFlag = flag as (typeof CLI_VALUE_FLAGS_V1)[number];
    if (values.has(typedFlag)) {
      throw new Error(`${typedFlag} may be specified only once`);
    }
    const value = args[index + 1];
    if (value === undefined || value.length === 0 || value.startsWith("--")) {
      throw new Error(`${typedFlag} requires a value`);
    }
    values.set(typedFlag, value);
    index += 2;
  }

  const caseValue = requireArgumentV1(values, "--case");
  const armValue = requireArgumentV1(values, "--arm");
  const envelopeCase =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
      ({ caseId }) => caseId === caseValue,
    );
  if (envelopeCase === undefined) {
    throw new Error(
      `--case must name a preregistered validation-envelope case (${MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.map(({ caseId }) => caseId).join(", ")})`,
    );
  }
  const arm =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.find(
      ({ armId }) => armId === armValue,
    );
  if (arm === undefined) {
    throw new Error(
      `--arm must name a preregistered clock arm (${MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_CLOCK_ARMS_V1.map(({ armId }) => armId).join(", ")})`,
    );
  }

  const outputPath = values.get("--output") ?? null;
  if (
    outputPath !== null &&
    path.extname(outputPath).toLowerCase() !== ".json"
  ) {
    throw new Error("--output must name a .json artifact");
  }
  const boundedSmokeValue = values.get("--bounded-smoke-seconds");
  let boundedSmokeHorizonSec: number | null = null;
  if (boundedSmokeValue !== undefined) {
    boundedSmokeHorizonSec = Number(boundedSmokeValue);
    if (
      !Number.isFinite(boundedSmokeHorizonSec) ||
      boundedSmokeHorizonSec <= 0 ||
      boundedSmokeHorizonSec >
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.initialHorizonSec
    ) {
      throw new Error(
        `--bounded-smoke-seconds must be positive and no greater than the preregistered initial horizon (${MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SETTLING_PROTOCOL_V1.initialHorizonSec})`,
      );
    }
  }

  return Object.freeze({
    caseId: envelopeCase.caseId,
    clockArmId: arm.armId,
    outputPath,
    boundedSmokeHorizonSec,
    forceOverwrite,
  });
}

function requireEnvelopeCaseV1(caseId: EnvelopeCaseIdV1) {
  const envelopeCase =
    MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_VALIDATION_ENVELOPE_V1.find(
      (candidate) => candidate.caseId === caseId,
    );
  if (envelopeCase === undefined) {
    throw new Error("validation-envelope case is no longer preregistered");
  }
  return envelopeCase;
}

function resolveOutputPathV1(
  args: MainWireStandard66ValidationArmCliArgumentsV1,
  executionPurpose: "preregistered-validation" | "bounded-smoke",
): string {
  if (args.outputPath !== null) return path.resolve(args.outputPath);
  const lane =
    executionPurpose === "preregistered-validation"
      ? "preregistered"
      : "bounded-smoke";
  return path.resolve(
    MAIN_WIRE_STANDARD66_VALIDATION_ARTIFACT_ROOT_V1,
    lane,
    args.caseId,
    `${args.clockArmId}.json`,
  );
}

function compactSettlementV1(result: MainWireStandard66ValidationArmResultV1) {
  return Object.freeze({
    status: result.settlement.status,
    protocolIdentitySha256: result.settlement.protocolIdentityHash,
    numericalPeriod1Established: result.settlement.numericalPeriod1Established,
    settledAtHorizonSec: result.settlement.horizons.settledAtHorizonSec,
    evaluatedHorizonCount: result.settlement.horizons.evaluated.length,
    latestPeriod1Observation: result.settlement.latestPeriod1Observation,
    terminalAcceptedTimeSec: result.settlement.terminalAcceptedTimeSec,
    terminalAcceptedRevision: result.settlement.terminalAcceptedRevision,
    counters: result.settlement.counters,
  });
}

function compactConfirmationV1(
  result: MainWireStandard66ValidationArmResultV1,
) {
  if (result.confirmation === null) return null;
  return Object.freeze({
    status: result.confirmation.status,
    protocolIdentitySha256: result.confirmation.protocolIdentityHash,
    numericalPeriod1Confirmed: result.confirmation.numericalPeriod1Confirmed,
    settlementTerminal: result.confirmation.settlementTerminal,
    freshSuffix: Object.freeze({
      comparisonCount: result.confirmation.freshSuffix.comparisonCount,
      consecutivePeriod1Closures:
        result.confirmation.freshSuffix.consecutivePeriod1Closures,
      requiredConsecutivePeriod1Closures:
        result.confirmation.freshSuffix.requiredConsecutivePeriod1Closures,
    }),
    terminalAcceptedTimeSec: result.confirmation.terminalAcceptedTimeSec,
    terminalAcceptedRevision: result.confirmation.terminalAcceptedRevision,
    counters: result.confirmation.counters,
  });
}

function compactKeyMetricsV1(result: MainWireStandard66ValidationArmResultV1) {
  const outcomes = result.outcomes;
  if (outcomes === null) return null;
  const measurements = outcomes.terminalBeatMeasurements;
  const timing = measurements.requiredFlowEventMeasurements;
  const shape = outcomes.aorticOutflowShapeDiagnostic;
  return Object.freeze({
    preregisteredDtGateValues: measurements.preregisteredDtGateValues,
    modelFlowEventIsovolumicContractionDurationSec:
      timing.isovolumicContractionDurationSec.value,
    modelFlowEventIsovolumicRelaxationDurationSec:
      timing.isovolumicRelaxationDurationSec.value,
    modelFlowEventTeiLike: timing.teiLike.value,
    positiveAorticFlowDurationSec:
      measurements.aorticFlowDurationAudit.positiveFlowDurationSec,
    configuredMaximumForwardEoaCm2: shape.configuredMaximumForwardEoa.areaCm2,
    maximumReconstructedActiveEoaCm2:
      shape.reconstructedActiveEoa.maximumAcceptedEndpoint.areaCm2,
    flowWeightedMeanActiveEoaCm2:
      shape.reconstructedActiveEoa.flowWeightedMeanAreaCm2,
  });
}

function requireArgumentV1(
  values: ReadonlyMap<(typeof CLI_VALUE_FLAGS_V1)[number], string>,
  name: "--case" | "--arm",
): string {
  const value = values.get(name);
  if (value === undefined) throw new Error(`${name} is required`);
  return value;
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined &&
  import.meta.url === pathToFileURL(entryPath).href
) {
  try {
    const summary = await runMainWireStandard66ValidationArmCliV1();
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
