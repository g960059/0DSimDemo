import type { OfficialExperimentRecipeV1 } from "./content";
import { assertPortableModelIdentifierV2 } from "./model";

export const STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID =
  "circleheart-studio-scientific-assertion-report-v1" as const;

export type StudioPressureVolumeCycleEvidenceV1 = Readonly<{
  kind: "pressure-volume-cycle";
  endDiastolicVolumeMl: number;
  endSystolicVolumeMl: number;
  endSystolicPressureMmHg: number;
  strokeVolumeMl: number;
}>;

export type StudioScientificScenarioEvidenceV1 = Readonly<{
  scenarioId: string;
  evidence: StudioPressureVolumeCycleEvidenceV1;
}>;

export type StudioScientificAssertionMeasurementV1 = Readonly<{
  measurementId: string;
  referenceValue: number;
  interventionValue: number;
  delta: number;
  unit: string;
}>;

export type StudioScientificAssertionReportV1 = Readonly<{
  schemaId: typeof STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID;
  assertionId: string;
  status: "passed" | "rejected";
  measurements: readonly StudioScientificAssertionMeasurementV1[];
  reason: string;
}>;

/**
 * Executable, model-family-owned claim used only by reviewed official content.
 * Implementations consume model evidence, never decimated presentation frames.
 */
export interface StudioScientificAssertionV1 {
  readonly assertionId: string;
  readonly modelFamilyId: string;
  readonly requiredScenarioIds: readonly string[];
  evaluate(input: Readonly<{
    recipe: OfficialExperimentRecipeV1;
    scenarios: readonly StudioScientificScenarioEvidenceV1[];
  }>): StudioScientificAssertionReportV1;
}

export class StudioScientificAssertionContractErrorV1 extends Error {
  constructor(path: string, message: string) {
    super(`Studio scientific assertion rejected ${path}: ${message}`);
    this.name = "StudioScientificAssertionContractErrorV1";
  }
}

/** Owns model evidence before released assertion code is allowed to read it. */
export function validateStudioScientificScenarioEvidenceSetV1(
  value: unknown,
  expectedScenarioIds: readonly string[],
): readonly StudioScientificScenarioEvidenceV1[] {
  if (!Array.isArray(value)) {
    throw assertionErrorV1("$.scenarios", "must be an array");
  }
  if (new Set(expectedScenarioIds).size !== expectedScenarioIds.length) {
    throw assertionErrorV1(
      "$.expectedScenarioIds",
      "must contain unique Scenario IDs",
    );
  }
  const expected = new Set(expectedScenarioIds);
  const seen = new Set<string>();
  const scenarios = value.map((candidate, index) => {
    const path = `$.scenarios[${index}]`;
    assertRecordV1(candidate, path);
    assertExactKeysV1(candidate, ["evidence", "scenarioId"], path);
    assertPortableModelIdentifierV2(
      candidate.scenarioId,
      `${path}.scenarioId`,
    );
    if (!expected.has(candidate.scenarioId)) {
      throw assertionErrorV1(
        `${path}.scenarioId`,
        `unexpected Scenario ${candidate.scenarioId}`,
      );
    }
    if (seen.has(candidate.scenarioId)) {
      throw assertionErrorV1(`${path}.scenarioId`, "must be unique");
    }
    seen.add(candidate.scenarioId);
    const evidencePath = `${path}.evidence`;
    assertRecordV1(candidate.evidence, evidencePath);
    assertExactKeysV1(candidate.evidence, [
      "endDiastolicVolumeMl",
      "endSystolicPressureMmHg",
      "endSystolicVolumeMl",
      "kind",
      "strokeVolumeMl",
    ], evidencePath);
    if (candidate.evidence.kind !== "pressure-volume-cycle") {
      throw assertionErrorV1(
        `${evidencePath}.kind`,
        'must be "pressure-volume-cycle"',
      );
    }
    const endDiastolicVolumeMl = finiteNumberV1(
      candidate.evidence.endDiastolicVolumeMl,
      `${evidencePath}.endDiastolicVolumeMl`,
    );
    const endSystolicVolumeMl = finiteNumberV1(
      candidate.evidence.endSystolicVolumeMl,
      `${evidencePath}.endSystolicVolumeMl`,
    );
    const endSystolicPressureMmHg = finiteNumberV1(
      candidate.evidence.endSystolicPressureMmHg,
      `${evidencePath}.endSystolicPressureMmHg`,
    );
    const strokeVolumeMl = finiteNumberV1(
      candidate.evidence.strokeVolumeMl,
      `${evidencePath}.strokeVolumeMl`,
    );
    if (
      endDiastolicVolumeMl < 0
      || endSystolicVolumeMl < 0
      || strokeVolumeMl < 0
      || endSystolicVolumeMl > endDiastolicVolumeMl
    ) {
      throw assertionErrorV1(
        evidencePath,
        "ventricular volumes must define a non-negative stroke volume",
      );
    }
    const expectedStrokeVolumeMl =
      endDiastolicVolumeMl - endSystolicVolumeMl;
    const tolerance = Number.EPSILON * 64 * Math.max(
      1,
      Math.abs(expectedStrokeVolumeMl),
      Math.abs(strokeVolumeMl),
    );
    if (Math.abs(strokeVolumeMl - expectedStrokeVolumeMl) > tolerance) {
      throw assertionErrorV1(
        `${evidencePath}.strokeVolumeMl`,
        "must equal end-diastolic minus end-systolic volume",
      );
    }
    return Object.freeze({
      scenarioId: candidate.scenarioId,
      evidence: Object.freeze({
        kind: "pressure-volume-cycle" as const,
        endDiastolicVolumeMl,
        endSystolicVolumeMl,
        endSystolicPressureMmHg,
        strokeVolumeMl,
      }),
    });
  });
  const missing = expectedScenarioIds.filter((scenarioId) => !seen.has(scenarioId));
  if (missing.length > 0) {
    throw assertionErrorV1(
      "$.scenarios",
      `missing Scenario evidence: ${missing.join(", ")}`,
    );
  }
  return Object.freeze(scenarios);
}

export function validateStudioScientificAssertionReportV1(
  value: unknown,
  expectedAssertionId: string,
): StudioScientificAssertionReportV1 {
  assertRecordV1(value, "$.report");
  assertExactKeysV1(value, [
    "assertionId",
    "measurements",
    "reason",
    "schemaId",
    "status",
  ], "$.report");
  if (value.schemaId !== STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID) {
    throw assertionErrorV1("$.report.schemaId", "schema identity mismatch");
  }
  if (value.assertionId !== expectedAssertionId) {
    throw assertionErrorV1(
      "$.report.assertionId",
      `must equal ${expectedAssertionId}`,
    );
  }
  if (value.status !== "passed" && value.status !== "rejected") {
    throw assertionErrorV1(
      "$.report.status",
      'must be "passed" or "rejected"',
    );
  }
  if (
    typeof value.reason !== "string"
    || value.reason.length === 0
    || value.reason !== value.reason.trim()
  ) {
    throw assertionErrorV1(
      "$.report.reason",
      "must be a non-empty trimmed string",
    );
  }
  if (!Array.isArray(value.measurements) || value.measurements.length === 0) {
    throw assertionErrorV1(
      "$.report.measurements",
      "must be a non-empty array",
    );
  }
  const measurementIds = new Set<string>();
  const measurements = value.measurements.map((candidate, index) => {
    const path = `$.report.measurements[${index}]`;
    assertRecordV1(candidate, path);
    assertExactKeysV1(candidate, [
      "delta",
      "interventionValue",
      "measurementId",
      "referenceValue",
      "unit",
    ], path);
    assertPortableModelIdentifierV2(
      candidate.measurementId,
      `${path}.measurementId`,
    );
    if (measurementIds.has(candidate.measurementId)) {
      throw assertionErrorV1(`${path}.measurementId`, "must be unique");
    }
    measurementIds.add(candidate.measurementId);
    const referenceValue = finiteNumberV1(
      candidate.referenceValue,
      `${path}.referenceValue`,
    );
    const interventionValue = finiteNumberV1(
      candidate.interventionValue,
      `${path}.interventionValue`,
    );
    const delta = finiteNumberV1(candidate.delta, `${path}.delta`);
    if (
      typeof candidate.unit !== "string"
      || candidate.unit.length === 0
      || candidate.unit !== candidate.unit.trim()
    ) {
      throw assertionErrorV1(`${path}.unit`, "must be a non-empty unit");
    }
    const expectedDelta = interventionValue - referenceValue;
    const tolerance = Number.EPSILON * 64 * Math.max(
      1,
      Math.abs(expectedDelta),
      Math.abs(delta),
    );
    if (Math.abs(delta - expectedDelta) > tolerance) {
      throw assertionErrorV1(
        `${path}.delta`,
        "must equal intervention minus reference",
      );
    }
    return Object.freeze({
      measurementId: candidate.measurementId,
      referenceValue,
      interventionValue,
      delta,
      unit: candidate.unit,
    });
  });
  return Object.freeze({
    schemaId: STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID,
    assertionId: expectedAssertionId,
    status: value.status,
    measurements: Object.freeze(measurements),
    reason: value.reason,
  });
}

function assertRecordV1(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
  ) {
    throw assertionErrorV1(path, "must be a plain object");
  }
}

function assertExactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw assertionErrorV1(
      path,
      `keys must be exactly ${sortedExpected.join(", ")}`,
    );
  }
}

function finiteNumberV1(value: unknown, path: string): number {
  if (
    typeof value !== "number"
    || !Number.isFinite(value)
    || Object.is(value, -0)
  ) {
    throw assertionErrorV1(path, "must be finite and not negative zero");
  }
  return value;
}

function assertionErrorV1(path: string, message: string): Error {
  return new StudioScientificAssertionContractErrorV1(path, message);
}
