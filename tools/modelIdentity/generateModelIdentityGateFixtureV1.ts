import { performance } from "node:perf_hooks";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  hotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  validationStampModeV1,
} from "@/engine/validationStampModeV1";
import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";

const MODEL_IDENTITY_GATE_FIXTURE_PATH_V1 =
  "__tests__/fixtures/modelIdentityGateV1.json";
const MAIN_WIRE_INTEGRATED_MODEL_ACCEPTED_STEP_COUNT_V3 = 500;

type ModelIdentityGateFixtureV1 = Readonly<{
  schemaVersion: 1;
  models: readonly Readonly<{
    modelId: string;
    canonicalAcceptedSequenceSha256: string;
    acceptedStepCount: number;
  }>[];
}>;

type CapturedModelIdentityGateFixtureV1 = Readonly<{
  fixture: ModelIdentityGateFixtureV1;
  captureElapsedMs: number;
}>;

export function captureModelIdentityGateFixtureV1():
CapturedModelIdentityGateFixtureV1 {
  const startedAt = performance.now();
  const sequence = captureMainWireIntegratedModelSequenceV3(
    MAIN_WIRE_INTEGRATED_MODEL_ACCEPTED_STEP_COUNT_V3,
  );
  const fixture = Object.freeze({
    schemaVersion: 1 as const,
    models: Object.freeze([
      Object.freeze({
        modelId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
        canonicalAcceptedSequenceSha256:
          mainWireIntegratedModelSequenceSha256V3(
            sequence.canonicalAcceptedStates,
          ),
        acceptedStepCount: sequence.acceptedStepCount,
      }),
    ]),
  });
  return Object.freeze({
    fixture,
    captureElapsedMs: performance.now() - startedAt,
  });
}

export function modelIdentityGateFixtureBytesV1(
  fixture: ModelIdentityGateFixtureV1,
): Buffer {
  return Buffer.from(`${JSON.stringify(fixture, null, 2)}\n`, "utf8");
}

export async function generateModelIdentityGateFixtureCliV1(
  args: readonly string[] = process.argv.slice(2),
  rootDir = process.cwd(),
): Promise<number> {
  const checkOnly = args.includes("--check");
  const captured = captureModelIdentityGateFixtureV1();
  const fixtureBytes = modelIdentityGateFixtureBytesV1(captured.fixture);
  const fixturePath = path.resolve(
    rootDir,
    MODEL_IDENTITY_GATE_FIXTURE_PATH_V1,
  );
  const fixtureMatches = existsSync(fixturePath)
    && readFileSync(fixturePath).equals(fixtureBytes);

  const result = {
    mode: checkOnly ? "check" : "generated",
    fixtureMatches: checkOnly ? fixtureMatches : true,
    fixturePath: MODEL_IDENTITY_GATE_FIXTURE_PATH_V1,
    models: captured.fixture.models,
    hotPathIntegrityTier: hotPathIntegrityTierV1(),
    validationStampMode: validationStampModeV1(),
    captureElapsedMs: captured.captureElapsedMs,
    byteLength: fixtureBytes.byteLength,
  };

  if (checkOnly) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return fixtureMatches ? 0 : 1;
  }

  mkdirSync(path.dirname(fixturePath), { recursive: true });
  writeFileSync(fixturePath, fixtureBytes);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

const entryPath = process.argv[1];
if (
  entryPath !== undefined
  && import.meta.url === pathToFileURL(entryPath).href
) {
  generateModelIdentityGateFixtureCliV1()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.stack : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
