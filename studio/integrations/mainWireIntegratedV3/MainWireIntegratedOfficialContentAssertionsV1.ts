import type { OfficialExperimentRecipeV1 } from "@/studio/contracts/v2/content";
import type {
  StudioPressureVolumeCycleEvidenceV1,
  StudioScientificAssertionMeasurementV1,
  StudioScientificAssertionReportV1,
  StudioScientificAssertionV1,
  StudioScientificScenarioEvidenceV1,
} from "@/studio/contracts/v2/scientificAssertion";
import {
  STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/scientificAssertion";
import {
  StudioScientificAssertionRegistryV1,
} from "@/studio/application/authoring/StudioScientificAssertionRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
} from "./MainWireIntegratedStudioModelIdentityV3";

export const MAIN_WIRE_PV_LOOP_PRELOAD_ASSERTION_ID_V1 =
  "circleheart.main-wire.pv-loop.preload-direction.v1" as const;
export const MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1 =
  "circleheart.main-wire.pv-loop.afterload-direction.v1" as const;
export const MAIN_WIRE_PV_LOOP_CONTRACTILITY_ASSERTION_ID_V1 =
  "circleheart.main-wire.pv-loop.contractility-direction.v1" as const;

const BASELINE_SCENARIO_ID_V1 = "baseline" as const;
const PRELOAD_SCENARIO_ID_V1 = "increased-preload" as const;
const AFTERLOAD_SCENARIO_ID_V1 = "increased-afterload" as const;
const CONTRACTILITY_SCENARIO_ID_V1 = "increased-contractility" as const;

const MINIMUM_VOLUME_DIRECTION_ML_V1 = 0.5;
const MINIMUM_PRESSURE_DIRECTION_MMHG_V1 = 1;

export const MAIN_WIRE_INTEGRATED_OFFICIAL_SCIENTIFIC_ASSERTIONS_V1 =
  Object.freeze([
    directionalAssertionV1({
      assertionId: MAIN_WIRE_PV_LOOP_PRELOAD_ASSERTION_ID_V1,
      interventionScenarioId: PRELOAD_SCENARIO_ID_V1,
      checks: Object.freeze([
        increasingCheckV1(
          "end-diastolic-volume",
          "endDiastolicVolumeMl",
          "mL",
          MINIMUM_VOLUME_DIRECTION_ML_V1,
        ),
        increasingCheckV1(
          "stroke-volume",
          "strokeVolumeMl",
          "mL",
          MINIMUM_VOLUME_DIRECTION_ML_V1,
        ),
      ]),
    }),
    directionalAssertionV1({
      assertionId: MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1,
      interventionScenarioId: AFTERLOAD_SCENARIO_ID_V1,
      checks: Object.freeze([
        increasingCheckV1(
          "end-systolic-pressure",
          "endSystolicPressureMmHg",
          "mmHg",
          MINIMUM_PRESSURE_DIRECTION_MMHG_V1,
        ),
        decreasingCheckV1(
          "stroke-volume",
          "strokeVolumeMl",
          "mL",
          MINIMUM_VOLUME_DIRECTION_ML_V1,
        ),
      ]),
    }),
    directionalAssertionV1({
      assertionId: MAIN_WIRE_PV_LOOP_CONTRACTILITY_ASSERTION_ID_V1,
      interventionScenarioId: CONTRACTILITY_SCENARIO_ID_V1,
      checks: Object.freeze([
        decreasingCheckV1(
          "end-systolic-volume",
          "endSystolicVolumeMl",
          "mL",
          MINIMUM_VOLUME_DIRECTION_ML_V1,
        ),
        increasingCheckV1(
          "stroke-volume",
          "strokeVolumeMl",
          "mL",
          MINIMUM_VOLUME_DIRECTION_ML_V1,
        ),
      ]),
    }),
  ] satisfies readonly StudioScientificAssertionV1[]);

export const mainWireIntegratedOfficialScientificAssertionRegistryV1 =
  new StudioScientificAssertionRegistryV1(
    MAIN_WIRE_INTEGRATED_OFFICIAL_SCIENTIFIC_ASSERTIONS_V1,
  );

type PressureVolumeEvidenceKeyV1 = Exclude<
  keyof StudioPressureVolumeCycleEvidenceV1,
  "kind"
>;

type DirectionalCheckV1 = Readonly<{
  measurementId: string;
  key: PressureVolumeEvidenceKeyV1;
  unit: string;
  direction: "increase" | "decrease";
  minimumAbsoluteDelta: number;
}>;

function directionalAssertionV1(input: Readonly<{
  assertionId: string;
  interventionScenarioId: string;
  checks: readonly DirectionalCheckV1[];
}>): StudioScientificAssertionV1 {
  return Object.freeze({
    assertionId: input.assertionId,
    modelFamilyId: MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3,
    requiredScenarioIds: Object.freeze([
      BASELINE_SCENARIO_ID_V1,
      input.interventionScenarioId,
    ]),
    evaluate(evaluationInput) {
      assertRecipeIdentityV1(evaluationInput.recipe, input.assertionId);
      const baseline = requiredEvidenceV1(
        evaluationInput.scenarios,
        BASELINE_SCENARIO_ID_V1,
      );
      const intervention = requiredEvidenceV1(
        evaluationInput.scenarios,
        input.interventionScenarioId,
      );
      const measurements = Object.freeze(input.checks.map((check) =>
        measurementV1(check, baseline, intervention)));
      const failed = measurements.find((measurement, index) => {
        const check = input.checks[index]!;
        return check.direction === "increase"
          ? measurement.delta < check.minimumAbsoluteDelta
          : measurement.delta > -check.minimumAbsoluteDelta;
      });
      return reportV1(
        input.assertionId,
        measurements,
        failed === undefined,
        failed === undefined
          ? "All directional measurements passed."
          : `${failed.measurementId} did not meet its minimum directional delta.`,
      );
    },
  });
}

function increasingCheckV1(
  measurementId: string,
  key: PressureVolumeEvidenceKeyV1,
  unit: string,
  minimumAbsoluteDelta: number,
): DirectionalCheckV1 {
  return Object.freeze({
    measurementId,
    key,
    unit,
    direction: "increase" as const,
    minimumAbsoluteDelta,
  });
}

function decreasingCheckV1(
  measurementId: string,
  key: PressureVolumeEvidenceKeyV1,
  unit: string,
  minimumAbsoluteDelta: number,
): DirectionalCheckV1 {
  return Object.freeze({
    measurementId,
    key,
    unit,
    direction: "decrease" as const,
    minimumAbsoluteDelta,
  });
}

function measurementV1(
  check: DirectionalCheckV1,
  baseline: StudioPressureVolumeCycleEvidenceV1,
  intervention: StudioPressureVolumeCycleEvidenceV1,
): StudioScientificAssertionMeasurementV1 {
  const referenceValue = baseline[check.key];
  const interventionValue = intervention[check.key];
  return Object.freeze({
    measurementId: check.measurementId,
    referenceValue,
    interventionValue,
    delta: interventionValue - referenceValue,
    unit: check.unit,
  });
}

function requiredEvidenceV1(
  scenarios: readonly StudioScientificScenarioEvidenceV1[],
  scenarioId: string,
): StudioPressureVolumeCycleEvidenceV1 {
  const matches = scenarios.filter((scenario) => scenario.scenarioId === scenarioId);
  if (matches.length !== 1) {
    throw new Error(
      `Scientific assertion requires exactly one ${scenarioId} evidence record`,
    );
  }
  const evidence = matches[0]!.evidence;
  if (evidence.kind !== "pressure-volume-cycle") {
    throw new Error(`Scientific assertion ${scenarioId} evidence kind mismatch`);
  }
  for (const [key, value] of Object.entries(evidence)) {
    if (key === "kind") continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Scientific assertion ${scenarioId}.${key} must be finite`);
    }
  }
  return evidence;
}

function assertRecipeIdentityV1(
  recipe: OfficialExperimentRecipeV1,
  assertionId: string,
): void {
  if (recipe.modelFamilyId !== MAIN_WIRE_INTEGRATED_STUDIO_MODEL_FAMILY_ID_V3) {
    throw new Error(`Scientific assertion ${assertionId} model family mismatch`);
  }
  if (!recipe.scientificAssertionIds.includes(assertionId)) {
    throw new Error(`Recipe does not request scientific assertion ${assertionId}`);
  }
}

function reportV1(
  assertionId: string,
  measurements: readonly StudioScientificAssertionMeasurementV1[],
  passed: boolean,
  reason: string,
): StudioScientificAssertionReportV1 {
  return Object.freeze({
    schemaId: STUDIO_SCIENTIFIC_ASSERTION_REPORT_V1_SCHEMA_ID,
    assertionId,
    status: passed ? "passed" as const : "rejected" as const,
    measurements,
    reason,
  });
}
