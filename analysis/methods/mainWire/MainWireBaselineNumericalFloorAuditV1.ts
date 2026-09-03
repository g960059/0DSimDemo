import type {
  MainWireIntegratedModelBaselineValidationCheckIdV1,
  MainWireIntegratedModelBaselineValidationCheckV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelBaselineValidationV1";

export type MainWireBaselineNumericalFloorMetricV1 = Readonly<{
  checkId: MainWireIntegratedModelBaselineValidationCheckIdV1;
  unit: string;
  constructionMinimum: number;
  constructionMaximum: number;
  constructionCorridorWidth: number;
  coldRepeatAbsoluteDifference: number;
  coldCheckpointAbsoluteDifference: number;
  dtHalvingAbsoluteDifference: number;
  numericalFloorAbsolute: number;
  numericalFloorFractionOfCorridor: number | null;
}>;

export function buildMainWireBaselineNumericalFloorMetricV1(
  coldA: MainWireIntegratedModelBaselineValidationCheckV1,
  coldB: MainWireIntegratedModelBaselineValidationCheckV1,
  compatibleCheckpoint: MainWireIntegratedModelBaselineValidationCheckV1,
  fineCold: MainWireIntegratedModelBaselineValidationCheckV1,
): MainWireBaselineNumericalFloorMetricV1 {
  if (
    coldA.checkId !== coldB.checkId
    || coldA.checkId !== compatibleCheckpoint.checkId
    || coldA.checkId !== fineCold.checkId
    || coldA.unit !== coldB.unit
    || coldA.unit !== compatibleCheckpoint.unit
    || coldA.unit !== fineCold.unit
    || coldA.minimum !== coldB.minimum
    || coldA.minimum !== compatibleCheckpoint.minimum
    || coldA.minimum !== fineCold.minimum
    || coldA.maximum !== coldB.maximum
    || coldA.maximum !== compatibleCheckpoint.maximum
    || coldA.maximum !== fineCold.maximum
  ) {
    throw new Error("numerical-floor metric comparison requires one frozen check");
  }
  const coldRepeatAbsoluteDifference = Math.abs(coldA.actual - coldB.actual);
  const coldCheckpointAbsoluteDifference = Math.abs(
    coldA.actual - compatibleCheckpoint.actual,
  );
  const dtHalvingAbsoluteDifference = Math.abs(
    coldA.actual - fineCold.actual,
  );
  const numericalFloorAbsolute = Math.max(
    coldRepeatAbsoluteDifference,
    coldCheckpointAbsoluteDifference,
    dtHalvingAbsoluteDifference,
  );
  const constructionCorridorWidth = coldA.maximum - coldA.minimum;
  return Object.freeze({
    checkId: coldA.checkId,
    unit: coldA.unit,
    constructionMinimum: coldA.minimum,
    constructionMaximum: coldA.maximum,
    constructionCorridorWidth,
    coldRepeatAbsoluteDifference,
    coldCheckpointAbsoluteDifference,
    dtHalvingAbsoluteDifference,
    numericalFloorAbsolute,
    numericalFloorFractionOfCorridor: constructionCorridorWidth > 0
      ? numericalFloorAbsolute / constructionCorridorWidth
      : null,
  });
}

export function assertMainWireBaselineNumericalFloorMetricV1(
  value: unknown,
  label: string,
): asserts value is MainWireBaselineNumericalFloorMetricV1 {
  const metric = recordV1(value, label);
  if (typeof metric.checkId !== "string" || metric.checkId.length === 0) {
    throw new Error(`${label}.checkId must be a non-empty string`);
  }
  if (typeof metric.unit !== "string" || metric.unit.length === 0) {
    throw new Error(`${label}.unit must be a non-empty string`);
  }
  const minimum = finiteV1(
    metric.constructionMinimum,
    `${label}.constructionMinimum`,
  );
  const maximum = finiteV1(
    metric.constructionMaximum,
    `${label}.constructionMaximum`,
  );
  const width = nonNegativeFiniteV1(
    metric.constructionCorridorWidth,
    `${label}.constructionCorridorWidth`,
  );
  const coldRepeat = nonNegativeFiniteV1(
    metric.coldRepeatAbsoluteDifference,
    `${label}.coldRepeatAbsoluteDifference`,
  );
  const coldCheckpoint = nonNegativeFiniteV1(
    metric.coldCheckpointAbsoluteDifference,
    `${label}.coldCheckpointAbsoluteDifference`,
  );
  const dtHalving = nonNegativeFiniteV1(
    metric.dtHalvingAbsoluteDifference,
    `${label}.dtHalvingAbsoluteDifference`,
  );
  const floor = nonNegativeFiniteV1(
    metric.numericalFloorAbsolute,
    `${label}.numericalFloorAbsolute`,
  );
  if (
    maximum < minimum
    || width !== maximum - minimum
    || floor !== Math.max(coldRepeat, coldCheckpoint, dtHalving)
  ) {
    throw new Error(`${label} is internally inconsistent`);
  }
  const expectedFraction = width > 0 ? floor / width : null;
  if (metric.numericalFloorFractionOfCorridor !== expectedFraction) {
    throw new Error(`${label}.numericalFloorFractionOfCorridor is inconsistent`);
  }
}

function recordV1(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function finiteV1(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
  return value;
}

function nonNegativeFiniteV1(value: unknown, label: string): number {
  const resolved = finiteV1(value, label);
  if (resolved < 0) throw new Error(`${label} must be non-negative`);
  return resolved;
}
