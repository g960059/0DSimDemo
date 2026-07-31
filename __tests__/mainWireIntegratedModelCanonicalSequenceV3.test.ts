import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  captureMainWireIntegratedModelSequenceV3,
  mainWireIntegratedModelSequenceSha256V3,
} from "@/tools/performance/verifyMainWireIntegratedModelValidationOnceV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  selectValidationStampModeV1,
  validationStampModeV1,
  validationStampsDisabledV1,
} from "@/engine/validationStampModeV1";

const FIXTURE_PATH =
  "__tests__/fixtures/modelIdentityGateV1.json";
const IDENTITY_RULE_MESSAGE =
  "Model identity rule violated: if the accepted trajectory changes, "
  + "the modelId must change with it. Either the change altered the model's "
  + "semantics and needs a new modelId, or the modelId was legitimately "
  + "bumped and the fixture must be regenerated with "
  + "`npm run generate:model-identity-fixture`.";

type ModelIdentityGateEntryV1 = Readonly<{
  modelId: string;
  canonicalAcceptedSequenceSha256: string;
  acceptedStepCount: number;
}>;

describe("main-wire integrated V3 model identity gate", () => {
  it("binds the modelId to every accepted state over the captured step count", () => {
    assertCurrentModelSequenceMatchesFixtureV1();
  }, 60_000);

  it("pins the same accepted sequence with validation stamps disabled", () => {
    const previous = validationStampModeV1();
    selectValidationStampModeV1("validation-stamps-disabled");
    try {
      expect(validationStampModeV1()).toBe("validation-stamps-disabled");
      expect(validationStampsDisabledV1()).toBe(true);
      assertCurrentModelSequenceMatchesFixtureV1();
    } finally {
      selectValidationStampModeV1(previous);
    }
    expect(validationStampModeV1()).toBe(previous);
  }, 60_000);

  it("keeps the generated hash fixture outside product imports", () => {
    const violations = ["engine", "components", "studio"]
      .flatMap((root) => sourceFilesV1(path.resolve(root)))
      .flatMap((file) => importedSpecifiersV1(readFileSync(file, "utf8"))
        .filter((specifier) =>
          specifier.includes("modelIdentityGateV1.json")
          || specifier.includes(FIXTURE_PATH))
        .map((specifier) =>
          `${relativePathV1(file)} imports test fixture ${specifier}`));

    expect(violations).toEqual([]);
  });
});

function assertCurrentModelSequenceMatchesFixtureV1(): void {
  const expected = loadModelIdentityGateFixtureV1().find(
    ({ modelId }) =>
      modelId === MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
  );
  if (expected === undefined) {
    throw new Error(
      `${IDENTITY_RULE_MESSAGE} No fixture entry exists for current modelId `
      + `"${MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID}".`,
    );
  }

  const sequence = captureMainWireIntegratedModelSequenceV3(
    expected.acceptedStepCount,
  );
  const actualSha256 = mainWireIntegratedModelSequenceSha256V3(
    sequence.canonicalAcceptedStates,
  );
  if (actualSha256 !== expected.canonicalAcceptedSequenceSha256) {
    throw new Error(
      `${IDENTITY_RULE_MESSAGE} modelId `
      + `"${MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID}" expected `
      + `${expected.canonicalAcceptedSequenceSha256} over `
      + `${expected.acceptedStepCount} accepted steps, but recaptured `
      + `${actualSha256}.`,
    );
  }
}

function loadModelIdentityGateFixtureV1():
readonly ModelIdentityGateEntryV1[] {
  const value: unknown = JSON.parse(readFileSync(
    path.resolve(FIXTURE_PATH),
    "utf8",
  ));
  if (
    !isRecordV1(value)
    || value.schemaVersion !== 1
    || !Array.isArray(value.models)
  ) {
    throw new Error(`${FIXTURE_PATH} has an invalid top-level shape`);
  }
  const models = value.models.map((entry, index) => {
    if (
      !isRecordV1(entry)
      || typeof entry.modelId !== "string"
      || entry.modelId.length === 0
      || typeof entry.canonicalAcceptedSequenceSha256 !== "string"
      || !/^[0-9a-f]{64}$/.test(entry.canonicalAcceptedSequenceSha256)
      || !Number.isInteger(entry.acceptedStepCount)
      || !(Number(entry.acceptedStepCount) > 0)
    ) {
      throw new Error(`${FIXTURE_PATH} models[${index}] is invalid`);
    }
    return Object.freeze({
      modelId: entry.modelId,
      canonicalAcceptedSequenceSha256:
        entry.canonicalAcceptedSequenceSha256,
      acceptedStepCount: Number(entry.acceptedStepCount),
    });
  });
  if (new Set(models.map(({ modelId }) => modelId)).size !== models.length) {
    throw new Error(`${FIXTURE_PATH} contains duplicate modelIds`);
  }
  return Object.freeze(models);
}

function isRecordV1(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sourceFilesV1(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesV1(absolute);
    return entry.isFile() && /\.(?:[cm]?js|tsx?)$/.test(entry.name)
      ? [absolute]
      : [];
  });
}

function importedSpecifiersV1(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.push(match[1]!);
  }
  return specifiers;
}

function relativePathV1(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}
