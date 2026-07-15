import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  BLOOD_COMPARTMENT_IDS,
  DIRECTED_CLOSED_LOOP_EDGES,
  type BloodCompartmentId,
  type FourChamberFlowId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";

export const FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID =
  "four-chamber-eight-volume-incidence-ledger-v1" as const;

export type FourChamberIncidenceEntryV1 = -1 | 0 | 1;

export type FourChamberIncidenceMatrixV1 = readonly (
  readonly FourChamberIncidenceEntryV1[]
)[];

export const FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1: readonly FourChamberFlowId[] =
  Object.freeze(DIRECTED_CLOSED_LOOP_EDGES.map((edge) => edge.flowId));

export const FOUR_CHAMBER_INCIDENCE_MATRIX_V1: FourChamberIncidenceMatrixV1 =
  buildIncidenceMatrixV1();

export type FourChamberVolumeRateEvaluationV1 = Readonly<{
  ledgerId: typeof FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID;
  units: Readonly<{
    flow: "m^3/s";
    volumeRate: "m^3/s";
  }>;
  volumeRatesM3PerSec: Readonly<Record<BloodCompartmentId, number>>;
  totalVolumeRateM3PerSec: number;
  incidenceColumnSums: readonly 0[];
  bloodVolumeProjectionApplied: false;
  flowClampApplied: false;
}>;

export type FourChamberBackwardEulerVolumeResidualInputV1 = Readonly<{
  previousVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  nextVolumesM3: Readonly<Record<BloodCompartmentId, number>>;
  nextFlowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>;
  dtSec: number;
}>;

export type FourChamberBackwardEulerVolumeResidualV1 = Readonly<{
  ledgerId: typeof FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID;
  timeDiscretization: "backward-euler";
  units: Readonly<{
    volume: "m^3";
    flow: "m^3/s";
    residual: "m^3/s";
    time: "s";
  }>;
  dtSec: number;
  nextVolumeRatesM3PerSec: Readonly<Record<BloodCompartmentId, number>>;
  residualsM3PerSec: Readonly<Record<BloodCompartmentId, number>>;
  maximumAbsoluteResidualM3PerSec: number;
  previousTotalBloodVolumeM3: number;
  nextTotalBloodVolumeM3: number;
  totalBloodVolumeChangeM3: number;
  summedResidualM3PerSec: number;
  bloodVolumeProjectionApplied: false;
  flowClampApplied: false;
  fallbackApplied: false;
}>;

/**
 * Evaluates dV/dt = BQ from the single canonical incidence matrix. No
 * compartment balance is re-stated as a separate hand-written equation.
 */
export function evaluateFourChamberVolumeRatesV1(
  flowsM3PerSec: Readonly<Record<FourChamberFlowId, number>>,
): FourChamberVolumeRateEvaluationV1 {
  const flowVector = validateFlowRecordV1(flowsM3PerSec, "flowsM3PerSec");
  const rates = FOUR_CHAMBER_INCIDENCE_MATRIX_V1.map((row) =>
    row.reduce((sum, coefficient, columnIndex) =>
      sum + coefficient * flowVector[columnIndex], 0));
  rates.forEach((rate, rowIndex) => requireFinite(
    rate,
    `volumeRatesM3PerSec.${BLOOD_COMPARTMENT_IDS[rowIndex]}`,
  ));

  const volumeRatesM3PerSec = freezeCompartmentRecord(rates);
  const totalVolumeRateM3PerSec = rates.reduce((sum, rate) => sum + rate, 0);
  requireFinite(totalVolumeRateM3PerSec, "totalVolumeRateM3PerSec");

  return Object.freeze({
    ledgerId: FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID,
    units: Object.freeze({ flow: "m^3/s", volumeRate: "m^3/s" }),
    volumeRatesM3PerSec,
    totalVolumeRateM3PerSec,
    incidenceColumnSums: incidenceColumnSumsV1(),
    bloodVolumeProjectionApplied: false,
    flowClampApplied: false,
  });
}

export function evaluateFourChamberBackwardEulerVolumeResidualV1(
  input: FourChamberBackwardEulerVolumeResidualInputV1,
): FourChamberBackwardEulerVolumeResidualV1 {
  assertExactPlainRecordV1(input, [
    "previousVolumesM3",
    "nextVolumesM3",
    "nextFlowsM3PerSec",
    "dtSec",
  ], "input");
  const previousVolumes = validateVolumeRecordV1(input.previousVolumesM3, "input.previousVolumesM3");
  const nextVolumes = validateVolumeRecordV1(input.nextVolumesM3, "input.nextVolumesM3");
  const dtSec = requirePositiveFinite(input.dtSec, "input.dtSec");
  const rateEvaluation = evaluateFourChamberVolumeRatesV1(input.nextFlowsM3PerSec);

  const residuals = BLOOD_COMPARTMENT_IDS.map((compartmentId, rowIndex) => {
    const residual = (nextVolumes[rowIndex] - previousVolumes[rowIndex]) / dtSec
      - rateEvaluation.volumeRatesM3PerSec[compartmentId];
    return requireFinite(residual, `residualsM3PerSec.${compartmentId}`);
  });
  const previousTotalBloodVolumeM3 = previousVolumes.reduce((sum, volume) => sum + volume, 0);
  const nextTotalBloodVolumeM3 = nextVolumes.reduce((sum, volume) => sum + volume, 0);
  const totalBloodVolumeChangeM3 = nextTotalBloodVolumeM3 - previousTotalBloodVolumeM3;
  const summedResidualM3PerSec = residuals.reduce((sum, residual) => sum + residual, 0);
  const maximumAbsoluteResidualM3PerSec = Math.max(...residuals.map(Math.abs));
  [
    previousTotalBloodVolumeM3,
    nextTotalBloodVolumeM3,
    totalBloodVolumeChangeM3,
    summedResidualM3PerSec,
    maximumAbsoluteResidualM3PerSec,
  ].forEach((value, index) => requireFinite(value, `backwardEulerDerived[${index}]`));

  return Object.freeze({
    ledgerId: FOUR_CHAMBER_INCIDENCE_LEDGER_V1_ID,
    timeDiscretization: "backward-euler",
    units: Object.freeze({
      volume: "m^3",
      flow: "m^3/s",
      residual: "m^3/s",
      time: "s",
    }),
    dtSec,
    nextVolumeRatesM3PerSec: rateEvaluation.volumeRatesM3PerSec,
    residualsM3PerSec: freezeCompartmentRecord(residuals),
    maximumAbsoluteResidualM3PerSec,
    previousTotalBloodVolumeM3,
    nextTotalBloodVolumeM3,
    totalBloodVolumeChangeM3,
    summedResidualM3PerSec,
    bloodVolumeProjectionApplied: false,
    flowClampApplied: false,
    fallbackApplied: false,
  });
}

function buildIncidenceMatrixV1(): FourChamberIncidenceMatrixV1 {
  if (
    BLOOD_COMPARTMENT_IDS.length !== 8
    || DIRECTED_CLOSED_LOOP_EDGES.length !== 8
  ) {
    throw new Error("four-chamber incidence ledger requires exactly eight compartments and eight edges");
  }
  const flowIds = DIRECTED_CLOSED_LOOP_EDGES.map((edge) => edge.flowId);
  if (new Set(flowIds).size !== flowIds.length) {
    throw new Error("four-chamber closed-loop flow IDs must be unique");
  }

  const mutable = BLOOD_COMPARTMENT_IDS.map(() =>
    Array.from(
      { length: DIRECTED_CLOSED_LOOP_EDGES.length },
      () => 0 as FourChamberIncidenceEntryV1,
    ));
  DIRECTED_CLOSED_LOOP_EDGES.forEach((edge, columnIndex) => {
    const upstreamRow = BLOOD_COMPARTMENT_IDS.indexOf(edge.upstream);
    const downstreamRow = BLOOD_COMPARTMENT_IDS.indexOf(edge.downstream);
    if (upstreamRow < 0 || downstreamRow < 0 || upstreamRow === downstreamRow) {
      throw new Error(`Invalid directed closed-loop edge ${edge.flowId}`);
    }
    mutable[upstreamRow][columnIndex] = -1;
    mutable[downstreamRow][columnIndex] = 1;
  });

  const matrix = Object.freeze(mutable.map((row) => Object.freeze(row.slice())));
  for (let columnIndex = 0; columnIndex < DIRECTED_CLOSED_LOOP_EDGES.length; columnIndex += 1) {
    const column = matrix.map((row) => row[columnIndex]);
    if (
      column.filter((value) => value === -1).length !== 1
      || column.filter((value) => value === 1).length !== 1
      || column.reduce<number>((sum, value) => sum + value, 0) !== 0
    ) {
      throw new Error(`Incidence column ${columnIndex} must contain one -1, one +1, and sum to zero`);
    }
  }
  return matrix;
}

function incidenceColumnSumsV1(): readonly 0[] {
  return Object.freeze(FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((_, columnIndex) => {
    const sum = FOUR_CHAMBER_INCIDENCE_MATRIX_V1.reduce<number>(
      (columnSum, row) => columnSum + row[columnIndex],
      0,
    );
    if (sum !== 0) throw new Error(`Incidence column ${columnIndex} lost its zero-sum invariant`);
    return 0 as const;
  }));
}

function validateFlowRecordV1(
  flows: Readonly<Record<FourChamberFlowId, number>>,
  field: string,
): readonly number[] {
  assertExactPlainRecordV1(flows, FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1, field);
  return Object.freeze(FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) =>
    requireFinite(flows[flowId], `${field}.${flowId}`)));
}

function validateVolumeRecordV1(
  volumes: Readonly<Record<BloodCompartmentId, number>>,
  field: string,
): readonly number[] {
  assertExactPlainRecordV1(volumes, BLOOD_COMPARTMENT_IDS, field);
  return Object.freeze(BLOOD_COMPARTMENT_IDS.map((compartmentId) =>
    requirePositiveFinite(volumes[compartmentId], `${field}.${compartmentId}`)));
}

function freezeCompartmentRecord(
  values: readonly number[],
): Readonly<Record<BloodCompartmentId, number>> {
  if (values.length !== BLOOD_COMPARTMENT_IDS.length) {
    throw new Error("Compartment record values must have length eight");
  }
  return Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((compartmentId, index) => [compartmentId, values[index]]),
  )) as Readonly<Record<BloodCompartmentId, number>>;
}

function requireFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`);
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}
