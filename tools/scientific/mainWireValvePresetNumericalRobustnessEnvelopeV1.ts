import type {
  NonCoronaryCirculationTrialDiagnosticsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  initializeMainWireFiveWallNonCoronaryV1,
  stepMainWireFiveWallNonCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1,
  type MainWireFourValveDiseaseBracketIdV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

export const MAIN_WIRE_VALVE_PRESET_NUMERICAL_ROBUSTNESS_ENVELOPE_V1_ID =
  "main-wire-valve-preset-numerical-robustness-envelope-v1" as const;

export const MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1 =
  Object.freeze({
    maximumContinuityResidualMl: 1e-6,
    maximumAbsoluteTotalBloodVolumeErrorMl: 1e-8,
    maximumMechanicsIterations: 30,
    maximumCirculationIterations: 30,
    finiteDifferenceJacobianFallbackCount: 0,
    pressureTangentUnavailableStepCount: 0,
  });

export const MAIN_WIRE_VALVE_PRESET_NUMERICAL_CASES_V1 = Object.freeze([
  Object.freeze({
    caseId: "healthy" as const,
    valveDiseaseBracketIds: Object.freeze(
      [] as MainWireFourValveDiseaseBracketIdV1[],
    ),
  }),
  ...MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1.map((lesionCode) =>
    Object.freeze({
      caseId: `${lesionCode}-severe` as const,
      valveDiseaseBracketIds: Object.freeze([
        `${lesionCode}-severe` as MainWireFourValveDiseaseBracketIdV1,
      ]),
    })),
]);

const CHAMBERS = Object.freeze(["LA", "LV", "RA", "RV"] as const);
const VALVES = Object.freeze(["MV", "AoV", "TV", "PV"] as const);

type Chamber = (typeof CHAMBERS)[number];
type Valve = (typeof VALVES)[number];
type NumericalRangeV1 = Readonly<{
  minimum: number | null;
  maximum: number | null;
}>;

export type MainWireValvePresetNumericalCaseSummaryV1 = Readonly<{
  caseId: string;
  valveDiseaseBracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
  completed: boolean;
  requestedStepCount: number;
  completedStepCount: number;
  failure: null | Readonly<{
    stepIndex: number;
    timeSec: number;
    kind: "transaction-failure" | "exception" | "non-finite-readback";
    message: string;
  }>;
  allNumericReadbacksFinite: boolean;
  jacobianMode:
    | NonCoronaryCirculationTrialDiagnosticsV1["jacobianMode"]
    | "multiple"
    | "not-evaluated";
  jacobianModesObserved:
    readonly NonCoronaryCirculationTrialDiagnosticsV1["jacobianMode"][];
  pressureTangentUnavailableStepCount: number;
  finiteDifferenceJacobianFallbackCountSum: number;
  finiteDifferenceJacobianFallbackCountMaximum: number;
  maximumContinuityResidualMl: number | null;
  maximumAbsoluteTotalBloodVolumeErrorMl: number | null;
  maximumMechanicsIterations: number | null;
  maximumCirculationIterations: number | null;
  maximumMechanicsCallbackCount: number | null;
  chamberAbsolutePressureMmHg: Readonly<Record<Chamber, NumericalRangeV1>>;
  chamberVolumeMl: Readonly<Record<Chamber, NumericalRangeV1>>;
  valveIntegratedVolumeMl: Readonly<Record<Valve, Readonly<{
    forward: number;
    reverse: number;
    integration: "backward-euler-accepted-endpoint";
  }>>>;
  numericalHealthPass: boolean;
}>;

export type MainWireValvePresetNumericalEnvelopeSummaryV1 = Readonly<{
  envelopeId:
    typeof MAIN_WIRE_VALVE_PRESET_NUMERICAL_ROBUSTNESS_ENVELOPE_V1_ID;
  role:
    "numerical-robustness-only-not-parameter-fitting-or-physiology-grade";
  dtSec: number;
  beatCount: 1;
  stepsPerBeat: number;
  requestedCaseCount: number;
  completedCaseCount: number;
  numericalHealthThresholds:
    typeof MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1;
  cases: readonly MainWireValvePresetNumericalCaseSummaryV1[];
  overallPass: boolean;
}>;

export function runMainWireValvePresetNumericalRobustnessEnvelopeV1(
  dtSec = 0.002,
): MainWireValvePresetNumericalEnvelopeSummaryV1 {
  if (!(dtSec > 0) || !Number.isFinite(dtSec)) {
    throw new Error("dtSec must be positive and finite");
  }
  const stepsPerBeat = Math.round(1 / dtSec);
  if (Math.abs(stepsPerBeat * dtSec - 1) > 1e-12) {
    throw new Error("dtSec must divide the fixed one-second cycle exactly");
  }
  const cases = MAIN_WIRE_VALVE_PRESET_NUMERICAL_CASES_V1.map((definition) =>
    runCase(definition, dtSec, stepsPerBeat));
  return Object.freeze({
    envelopeId:
      MAIN_WIRE_VALVE_PRESET_NUMERICAL_ROBUSTNESS_ENVELOPE_V1_ID,
    role:
      "numerical-robustness-only-not-parameter-fitting-or-physiology-grade" as const,
    dtSec,
    beatCount: 1 as const,
    stepsPerBeat,
    requestedCaseCount: cases.length,
    completedCaseCount: cases.filter(({ completed }) => completed).length,
    numericalHealthThresholds:
      MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1,
    cases: Object.freeze(cases),
    overallPass: cases.every(({ numericalHealthPass }) =>
      numericalHealthPass),
  });
}

function runCase(
  definition: (typeof MAIN_WIRE_VALVE_PRESET_NUMERICAL_CASES_V1)[number],
  dtSec: number,
  requestedStepCount: number,
): MainWireValvePresetNumericalCaseSummaryV1 {
  try {
    return runInitializedCase(definition, dtSec, requestedStepCount);
  } catch (error) {
    return initializationFailureSummary(
      definition,
      requestedStepCount,
      errorMessage(error),
    );
  }
}

function runInitializedCase(
  definition: (typeof MAIN_WIRE_VALVE_PRESET_NUMERICAL_CASES_V1)[number],
  dtSec: number,
  requestedStepCount: number,
): MainWireValvePresetNumericalCaseSummaryV1 {
  const runtime = normalAdultMainWireRuntimeV1(
    definition.valveDiseaseBracketIds,
  );
  const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
  const pericardium = createMainWireNormalAdultCommonPericardiumV1(
    "on",
    "healthy-slack",
  );
  const bloodVolume = resolveMainWireNormalAdultBloodVolumeOperatingPointV1(
    runtime,
  );
  const cold = initializeMainWireFiveWallNonCoronaryV1({
    provider,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
    circulationInitial: Object.freeze({
      fixedTotalBloodVolumeMl: bloodVolume.fixedTotalBloodVolumeMl,
      nodeVolumesMl: bloodVolume.nodeVolumesMl,
    }),
  });
  let state = cold.acceptedState;
  let completedStepCount = 0;
  let failure: MainWireValvePresetNumericalCaseSummaryV1["failure"] = null;
  let allNumericReadbacksFinite = true;
  const jacobianModes = new Set<
    NonCoronaryCirculationTrialDiagnosticsV1["jacobianMode"]
  >();
  let pressureTangentUnavailableStepCount = 0;
  let fallbackCountSum = 0;
  let fallbackCountMaximum = 0;
  let maximumContinuityResidualMl: number | null = null;
  let maximumAbsoluteTbvErrorMl: number | null = null;
  let maximumMechanicsIterations: number | null = null;
  let maximumCirculationIterations: number | null = null;
  let maximumMechanicsCallbackCount: number | null = null;
  const pressureRange = mutableChamberRanges();
  const volumeRange = mutableChamberRanges();
  const valveVolume = mutableValveVolumes();

  for (let stepIndex = 1; stepIndex <= requestedStepCount; stepIndex += 1) {
    try {
      const stepped = stepMainWireFiveWallNonCoronaryV1(provider, state, {
        dtSec,
        runtime,
        calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
        pericardium,
      });
      if (stepped.converged === false) {
        failure = Object.freeze({
          stepIndex,
          timeSec: state.acceptedTimeSec + dtSec,
          kind: "transaction-failure" as const,
          message: stepped.message,
        });
        break;
      }
      if (!numericLeaves(stepped).every(Number.isFinite)) {
        allNumericReadbacksFinite = false;
        failure = Object.freeze({
          stepIndex,
          timeSec: stepped.acceptedState.acceptedTimeSec,
          kind: "non-finite-readback" as const,
          message: "accepted step contains a non-finite numeric readback",
        });
        break;
      }
      state = stepped.acceptedState;
      completedStepCount += 1;
      const circulation = stepped.circulationTrial;
      const diagnostics = circulation.diagnostics;
      jacobianModes.add(diagnostics.jacobianMode);
      if (!diagnostics.pressureTangentAvailableAtFinalCandidate) {
        pressureTangentUnavailableStepCount += 1;
      }
      fallbackCountSum += diagnostics.finiteDifferenceJacobianFallbackCount;
      fallbackCountMaximum = Math.max(
        fallbackCountMaximum,
        diagnostics.finiteDifferenceJacobianFallbackCount,
      );
      maximumContinuityResidualMl = nullableMaximum(
        maximumContinuityResidualMl,
        Math.abs(diagnostics.finalMaximumContinuityResidualMl),
      );
      maximumAbsoluteTbvErrorMl = nullableMaximum(
        maximumAbsoluteTbvErrorMl,
        Math.abs(diagnostics.totalBloodVolumeErrorMl),
      );
      maximumMechanicsIterations = nullableMaximum(
        maximumMechanicsIterations,
        stepped.mechanicsTrial.diagnostics.iterationCount,
      );
      maximumCirculationIterations = nullableMaximum(
        maximumCirculationIterations,
        diagnostics.iterations,
      );
      maximumMechanicsCallbackCount = nullableMaximum(
        maximumMechanicsCallbackCount,
        diagnostics.mechanicsCallbackCallCount,
      );
      for (const chamber of CHAMBERS) {
        extendRange(
          pressureRange[chamber],
          circulation.nodeAbsolutePressuresMmHg[chamber],
        );
        extendRange(
          volumeRange[chamber],
          circulation.candidateNodeVolumesMl[chamber],
        );
      }
      for (const valve of VALVES) {
        const flowMlPerSec = circulation.edgeFlowsMlPerSec[valve];
        valveVolume[valve].forward += Math.max(flowMlPerSec, 0) * dtSec;
        valveVolume[valve].reverse += Math.max(-flowMlPerSec, 0) * dtSec;
      }
    } catch (error) {
      failure = Object.freeze({
        stepIndex,
        timeSec: state.acceptedTimeSec + dtSec,
        kind: "exception" as const,
        message: errorMessage(error),
      });
      break;
    }
  }

  const completed = failure === null
    && completedStepCount === requestedStepCount;
  const jacobianModesObserved = Object.freeze([...jacobianModes].sort());
  const jacobianMode = jacobianModesObserved.length === 0
    ? "not-evaluated" as const
    : jacobianModesObserved.length === 1
      ? jacobianModesObserved[0]!
      : "multiple" as const;
  const thresholds = MAIN_WIRE_VALVE_PRESET_NUMERICAL_HEALTH_THRESHOLDS_V1;
  const analyticPathOnly = jacobianModesObserved.every((mode) =>
    mode === "analytic-semismooth" || mode === "not-required");
  const numericalHealthPass = completed
    && allNumericReadbacksFinite
    && analyticPathOnly
    && pressureTangentUnavailableStepCount
      === thresholds.pressureTangentUnavailableStepCount
    && fallbackCountSum
      === thresholds.finiteDifferenceJacobianFallbackCount
    && (maximumContinuityResidualMl ?? Number.POSITIVE_INFINITY)
      <= thresholds.maximumContinuityResidualMl
    && (maximumAbsoluteTbvErrorMl ?? Number.POSITIVE_INFINITY)
      <= thresholds.maximumAbsoluteTotalBloodVolumeErrorMl
    && (maximumMechanicsIterations ?? Number.POSITIVE_INFINITY)
      <= thresholds.maximumMechanicsIterations
    && (maximumCirculationIterations ?? Number.POSITIVE_INFINITY)
      <= thresholds.maximumCirculationIterations;

  return Object.freeze({
    caseId: definition.caseId,
    valveDiseaseBracketIds: Object.freeze([
      ...definition.valveDiseaseBracketIds,
    ]),
    completed,
    requestedStepCount,
    completedStepCount,
    failure,
    allNumericReadbacksFinite,
    jacobianMode,
    jacobianModesObserved,
    pressureTangentUnavailableStepCount,
    finiteDifferenceJacobianFallbackCountSum: fallbackCountSum,
    finiteDifferenceJacobianFallbackCountMaximum: fallbackCountMaximum,
    maximumContinuityResidualMl,
    maximumAbsoluteTotalBloodVolumeErrorMl: maximumAbsoluteTbvErrorMl,
    maximumMechanicsIterations,
    maximumCirculationIterations,
    maximumMechanicsCallbackCount,
    chamberAbsolutePressureMmHg: freezeChamberRanges(pressureRange),
    chamberVolumeMl: freezeChamberRanges(volumeRange),
    valveIntegratedVolumeMl: freezeValveVolumes(valveVolume),
    numericalHealthPass,
  });
}

function initializationFailureSummary(
  definition: (typeof MAIN_WIRE_VALVE_PRESET_NUMERICAL_CASES_V1)[number],
  requestedStepCount: number,
  message: string,
): MainWireValvePresetNumericalCaseSummaryV1 {
  return Object.freeze({
    caseId: definition.caseId,
    valveDiseaseBracketIds: Object.freeze([
      ...definition.valveDiseaseBracketIds,
    ]),
    completed: false,
    requestedStepCount,
    completedStepCount: 0,
    failure: Object.freeze({
      stepIndex: 0,
      timeSec: 0,
      kind: "exception" as const,
      message,
    }),
    allNumericReadbacksFinite: false,
    jacobianMode: "not-evaluated" as const,
    jacobianModesObserved: Object.freeze([]),
    pressureTangentUnavailableStepCount: 0,
    finiteDifferenceJacobianFallbackCountSum: 0,
    finiteDifferenceJacobianFallbackCountMaximum: 0,
    maximumContinuityResidualMl: null,
    maximumAbsoluteTotalBloodVolumeErrorMl: null,
    maximumMechanicsIterations: null,
    maximumCirculationIterations: null,
    maximumMechanicsCallbackCount: null,
    chamberAbsolutePressureMmHg: freezeChamberRanges(mutableChamberRanges()),
    chamberVolumeMl: freezeChamberRanges(mutableChamberRanges()),
    valveIntegratedVolumeMl: freezeValveVolumes(mutableValveVolumes()),
    numericalHealthPass: false,
  });
}

type MutableRange = { minimum: number | null; maximum: number | null };
type MutableValveVolume = { forward: number; reverse: number };

function mutableChamberRanges(): Record<Chamber, MutableRange> {
  return Object.fromEntries(CHAMBERS.map((chamber) => [
    chamber,
    { minimum: null, maximum: null },
  ])) as Record<Chamber, MutableRange>;
}

function mutableValveVolumes(): Record<Valve, MutableValveVolume> {
  return Object.fromEntries(VALVES.map((valve) => [
    valve,
    { forward: 0, reverse: 0 },
  ])) as Record<Valve, MutableValveVolume>;
}

function extendRange(range: MutableRange, value: number): void {
  if (!Number.isFinite(value)) throw new Error("range value must be finite");
  range.minimum = range.minimum === null ? value : Math.min(range.minimum, value);
  range.maximum = range.maximum === null ? value : Math.max(range.maximum, value);
}

function freezeChamberRanges(
  source: Record<Chamber, MutableRange>,
): Readonly<Record<Chamber, NumericalRangeV1>> {
  return Object.freeze(Object.fromEntries(CHAMBERS.map((chamber) => [
    chamber,
    Object.freeze({ ...source[chamber] }),
  ]))) as Readonly<Record<Chamber, NumericalRangeV1>>;
}

function freezeValveVolumes(
  source: Record<Valve, MutableValveVolume>,
): MainWireValvePresetNumericalCaseSummaryV1["valveIntegratedVolumeMl"] {
  return Object.freeze(Object.fromEntries(VALVES.map((valve) => [
    valve,
    Object.freeze({
      ...source[valve],
      integration: "backward-euler-accepted-endpoint" as const,
    }),
  ]))) as MainWireValvePresetNumericalCaseSummaryV1[
    "valveIntegratedVolumeMl"
  ];
}

function nullableMaximum(current: number | null, candidate: number): number {
  if (!Number.isFinite(candidate)) {
    throw new Error("numerical audit value must be finite");
  }
  return current === null ? candidate : Math.max(current, candidate);
}

function numericLeaves(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(numericLeaves);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
