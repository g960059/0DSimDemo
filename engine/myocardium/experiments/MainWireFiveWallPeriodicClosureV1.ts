import {
  NON_CORONARY_DYNAMIC_EDGE_NAMES_V1,
  NON_CORONARY_NODE_NAMES_V1,
  NON_CORONARY_VALVE_NAMES_V1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
  type MainWireFiveWallNonCoronaryAcceptedStateV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  MAIN_WIRE_FIVE_WALL_IDS_V1,
  type MainWireFiveWallLandTriSegStateV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import type {
  LandSlsWallMaterialStateV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  readMainWireNormalAdultParallelActivationCohortStatesV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  LAND2017_STATE_LABELS,
  LAND2017_STATE_SIZE,
} from "@/engine/myocardium/myofilament/land2017";

export const MAIN_WIRE_FIVE_WALL_PERIODIC_CLOSURE_V1_ID =
  "main-wire-five-wall-periodic-closure-v1" as const;

export const MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1 = Object.freeze({
  scaleSetId: "normal-adult-fixed-dimensional-reference-scales-v1",
  circulationNodeVolumeMl: 100,
  dynamicEdgeFlowMlPerSec: 500,
  valveOpeningFraction01: 1,
  trisegSeptalMidwallCapVolumeM3: 100e-6,
  trisegJunctionRadiusM: 0.04,
  landState01: 1,
  slsViscousLogStrain: 0.1,
  wallFiberLogStrain: 0.1,
  wallFreeCalciumUM: 1,
} as const satisfies MainWireFiveWallPeriodicReferenceScalesV1);

export type MainWireFiveWallPeriodicAcceptedStateV1 =
  MainWireFiveWallNonCoronaryAcceptedStateV1<
    MainWireFiveWallLandTriSegStateV1<LandSlsWallMaterialStateV1>
  >;

export type MainWireFiveWallPeriodicClosureGroupV1 =
  | "circulation-node-volume"
  | "dynamic-edge-flow"
  | "valve-opening"
  | "triseg-coordinate"
  | "land-state"
  | "sls-viscous-strain"
  | "wall-input-history";

export type MainWireFiveWallPeriodicQuantityV1 =
  | "node-volume"
  | "dynamic-edge-flow"
  | "valve-opening-fraction"
  | "septal-midwall-cap-volume"
  | "junction-radius"
  | "land-state"
  | "sls-viscous-log-strain"
  | "wall-fiber-log-strain"
  | "wall-free-calcium";

export type MainWireFiveWallPeriodicUnitV1 =
  | "mL"
  | "mL/s"
  | "fraction"
  | "m3"
  | "m"
  | "dimensionless"
  | "log-strain"
  | "uM";

/**
 * Fixed dimensional scales make closure independent of the instantaneous
 * state magnitude. They are normalization references, not fit targets or
 * physiological acceptance tolerances.
 */
export type MainWireFiveWallPeriodicReferenceScalesV1 = Readonly<{
  scaleSetId: string;
  circulationNodeVolumeMl: number;
  dynamicEdgeFlowMlPerSec: number;
  valveOpeningFraction01: number;
  trisegSeptalMidwallCapVolumeM3: number;
  trisegJunctionRadiusM: number;
  landState01: number;
  slsViscousLogStrain: number;
  wallFiberLogStrain: number;
  wallFreeCalciumUM: number;
}>;

export type MainWireFiveWallPeriodicDeltaEntryV1 = Readonly<{
  group: MainWireFiveWallPeriodicClosureGroupV1;
  quantity: MainWireFiveWallPeriodicQuantityV1;
  unit: MainWireFiveWallPeriodicUnitV1;
  path: string;
  currentValue: number;
  referenceValue: number;
  absoluteDelta: number;
  referenceScale: number;
  normalizedDelta: number;
}>;

export type MainWireFiveWallPeriodicPhysicalMaximumV1 = Readonly<{
  quantity: MainWireFiveWallPeriodicQuantityV1;
  unit: MainWireFiveWallPeriodicUnitV1;
  maximumAbsoluteDelta: number;
  worstPath: string;
  referenceScale: number;
  normalizedDeltaAtPhysicalMaximum: number;
}>;

export type MainWireFiveWallPeriodicClosureGroupReportV1 = Readonly<{
  group: MainWireFiveWallPeriodicClosureGroupV1;
  entryCount: number;
  maximumNormalizedDelta: number;
  worstPath: string;
  worstEntry: MainWireFiveWallPeriodicDeltaEntryV1;
  /** Raw physical maxima remain separated by quantity and unit. */
  physicalMaximumByQuantity:
    Readonly<Partial<Record<
      MainWireFiveWallPeriodicQuantityV1,
      MainWireFiveWallPeriodicPhysicalMaximumV1
    >>>;
}>;

export type MainWireFiveWallPeriodicClosureReportV1 = Readonly<{
  closureId: typeof MAIN_WIRE_FIVE_WALL_PERIODIC_CLOSURE_V1_ID;
  referenceScaleSetId: string;
  currentRevision: number;
  referenceRevision: number;
  elapsedTimeSec: number;
  groups: Readonly<Record<
    MainWireFiveWallPeriodicClosureGroupV1,
    MainWireFiveWallPeriodicClosureGroupReportV1
  >>;
  overall: Readonly<{
    entryCount: number;
    maximumNormalizedDelta: number;
    worstGroup: MainWireFiveWallPeriodicClosureGroupV1;
    worstPath: string;
    worstEntry: MainWireFiveWallPeriodicDeltaEntryV1;
    /** No raw maximum is formed across unlike physical dimensions. */
    physicalMaximumByQuantity:
      Readonly<Partial<Record<
        MainWireFiveWallPeriodicQuantityV1,
        MainWireFiveWallPeriodicPhysicalMaximumV1
      >>>;
  }>;
}>;

export type MainWireFiveWallPeriodicBeatObservationV1 = Readonly<{
  beatIndex: number;
  period1: MainWireFiveWallPeriodicClosureReportV1 | null;
  period2: MainWireFiveWallPeriodicClosureReportV1 | null;
}>;

export type MainWireFiveWallPeriodicClassificationStatusV1 =
  | "period1-converged"
  | "period2-suspect"
  | "not-converged";

export type MainWireFiveWallPeriodicClassifierOptionsV1 = Readonly<{
  period1NormalizedTolerance: number;
  period2NormalizedTolerance: number;
  /** Alternating endpoints must remain this far apart over one period. */
  period2MinimumPeriod1NormalizedDelta: number;
  consecutiveBeats: number;
}>;

export type MainWireFiveWallPeriodicClassificationV1 = Readonly<{
  status: MainWireFiveWallPeriodicClassificationStatusV1;
  latestBeatIndex: number | null;
  consecutiveBeatsRequired: number;
  evidenceBeatIndices: readonly number[];
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
}>;

type DeltaSeed = Readonly<{
  group: MainWireFiveWallPeriodicClosureGroupV1;
  quantity: MainWireFiveWallPeriodicQuantityV1;
  unit: MainWireFiveWallPeriodicUnitV1;
  path: string;
  currentValue: number;
  referenceValue: number;
  referenceScale: number;
}>;

const GROUP_ORDER = Object.freeze([
  "circulation-node-volume",
  "dynamic-edge-flow",
  "valve-opening",
  "triseg-coordinate",
  "land-state",
  "sls-viscous-strain",
  "wall-input-history",
] as const satisfies readonly MainWireFiveWallPeriodicClosureGroupV1[]);

export function compareMainWireFiveWallAcceptedStatesV1(
  current: MainWireFiveWallPeriodicAcceptedStateV1,
  reference: MainWireFiveWallPeriodicAcceptedStateV1,
  scales: MainWireFiveWallPeriodicReferenceScalesV1,
): MainWireFiveWallPeriodicClosureReportV1 {
  validateCompatibleStates(current, reference);
  validateScales(scales);
  const seeds: DeltaSeed[] = [];
  for (const node of NON_CORONARY_NODE_NAMES_V1) {
    seeds.push(seed(
      "circulation-node-volume",
      "node-volume",
      "mL",
      `circulation.nodeVolumesMl.${node}`,
      current.circulation.nodeVolumesMl[node],
      reference.circulation.nodeVolumesMl[node],
      scales.circulationNodeVolumeMl,
    ));
  }
  for (const edge of NON_CORONARY_DYNAMIC_EDGE_NAMES_V1) {
    seeds.push(seed(
      "dynamic-edge-flow",
      "dynamic-edge-flow",
      "mL/s",
      `circulation.dynamicEdgeFlowsMlPerSec.${edge}`,
      current.circulation.dynamicEdgeFlowsMlPerSec[edge],
      reference.circulation.dynamicEdgeFlowsMlPerSec[edge],
      scales.dynamicEdgeFlowMlPerSec,
    ));
  }
  for (const valve of NON_CORONARY_VALVE_NAMES_V1) {
    seeds.push(seed(
      "valve-opening",
      "valve-opening-fraction",
      "fraction",
      `circulation.valveStates.${valve}.leafletOpeningFraction01`,
      current.circulation.valveStates[valve].leafletOpeningFraction01,
      reference.circulation.valveStates[valve].leafletOpeningFraction01,
      scales.valveOpeningFraction01,
    ));
  }
  const currentMechanics = current.mechanics.materialState;
  const referenceMechanics = reference.mechanics.materialState;
  seeds.push(seed(
    "triseg-coordinate",
    "septal-midwall-cap-volume",
    "m3",
    "mechanics.materialState.trisegCoordinates.septalMidwallCapVolumeM3",
    currentMechanics.trisegCoordinates.septalMidwallCapVolumeM3,
    referenceMechanics.trisegCoordinates.septalMidwallCapVolumeM3,
    scales.trisegSeptalMidwallCapVolumeM3,
  ));
  seeds.push(seed(
    "triseg-coordinate",
    "junction-radius",
    "m",
    "mechanics.materialState.trisegCoordinates.junctionRadiusM",
    currentMechanics.trisegCoordinates.junctionRadiusM,
    referenceMechanics.trisegCoordinates.junctionRadiusM,
    scales.trisegJunctionRadiusM,
  ));
  for (const wall of MAIN_WIRE_FIVE_WALL_IDS_V1) {
    const currentWall = currentMechanics.wallStateByWall[wall];
    const referenceWall = referenceMechanics.wallStateByWall[wall];
    validateWallState(currentWall, `current.${wall}`);
    validateWallState(referenceWall, `reference.${wall}`);
    const currentLandCohorts =
      readMainWireNormalAdultParallelActivationCohortStatesV1(currentWall)
      ?? [currentWall];
    const referenceLandCohorts =
      readMainWireNormalAdultParallelActivationCohortStatesV1(referenceWall)
      ?? [referenceWall];
    if (currentLandCohorts.length !== referenceLandCohorts.length) {
      throw new Error(`${wall} periodic activation-cohort count differs`);
    }
    for (
      let cohortIndex = 0;
      cohortIndex < currentLandCohorts.length;
      cohortIndex += 1
    ) {
      const currentCohort = currentLandCohorts[cohortIndex]!;
      const referenceCohort = referenceLandCohorts[cohortIndex]!;
      const cohortPath = currentLandCohorts.length === 1
        ? ""
        : `.activationCohortStateByPoint.${cohortIndex}`;
      for (let index = 0; index < LAND2017_STATE_SIZE; index += 1) {
        const label = LAND2017_STATE_LABELS[index]!;
        seeds.push(seed(
          "land-state",
          "land-state",
          "dimensionless",
          `mechanics.materialState.wallStateByWall.${wall}${cohortPath}.landState.${label}`,
          currentCohort.landState[index]!,
          referenceCohort.landState[index]!,
          scales.landState01,
        ));
      }
      if (currentLandCohorts.length > 1) {
        seeds.push(seed(
          "wall-input-history",
          "wall-free-calcium",
          "uM",
          `mechanics.materialState.wallStateByWall.${wall}${cohortPath}.previousFreeCalciumUM`,
          currentCohort.previousFreeCalciumUM,
          referenceCohort.previousFreeCalciumUM,
          scales.wallFreeCalciumUM,
        ));
      }
    }
    seeds.push(seed(
      "sls-viscous-strain",
      "sls-viscous-log-strain",
      "log-strain",
      `mechanics.materialState.wallStateByWall.${wall}.slsState.viscousLogStrain`,
      currentWall.slsState.viscousLogStrain,
      referenceWall.slsState.viscousLogStrain,
      scales.slsViscousLogStrain,
    ));
    seeds.push(seed(
      "wall-input-history",
      "wall-fiber-log-strain",
      "log-strain",
      `mechanics.materialState.wallStateByWall.${wall}.previousFiberLogStrain`,
      currentWall.previousFiberLogStrain,
      referenceWall.previousFiberLogStrain,
      scales.wallFiberLogStrain,
    ));
    seeds.push(seed(
      "wall-input-history",
      "wall-free-calcium",
      "uM",
      `mechanics.materialState.wallStateByWall.${wall}.previousFreeCalciumUM`,
      currentWall.previousFreeCalciumUM,
      referenceWall.previousFreeCalciumUM,
      scales.wallFreeCalciumUM,
    ));
  }
  const entries = Object.freeze(seeds.map(deltaEntry));
  const groups = Object.freeze(Object.fromEntries(GROUP_ORDER.map((group) => [
    group,
    groupReport(group, entries.filter((entry) => entry.group === group)),
  ]))) as MainWireFiveWallPeriodicClosureReportV1["groups"];
  const worstEntry = maximumNormalizedEntry(entries);
  return Object.freeze({
    closureId: MAIN_WIRE_FIVE_WALL_PERIODIC_CLOSURE_V1_ID,
    referenceScaleSetId: scales.scaleSetId,
    currentRevision: current.revision,
    referenceRevision: reference.revision,
    elapsedTimeSec: current.acceptedTimeSec - reference.acceptedTimeSec,
    groups,
    overall: Object.freeze({
      entryCount: entries.length,
      maximumNormalizedDelta: worstEntry.normalizedDelta,
      worstGroup: worstEntry.group,
      worstPath: worstEntry.path,
      worstEntry,
      physicalMaximumByQuantity: physicalMaximumByQuantity(entries),
    }),
  });
}

/** Classifies already-computed beat-boundary closures without model callbacks. */
export function classifyMainWireFiveWallPeriodicityV1(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
  options: MainWireFiveWallPeriodicClassifierOptionsV1,
): MainWireFiveWallPeriodicClassificationV1 {
  validateClassifierOptions(options);
  validateObservations(observations);
  const latest = observations.at(-1);
  const suffix = observations.slice(-options.consecutiveBeats);
  const enough = suffix.length === options.consecutiveBeats
    && suffix.every((observation, index) => index === 0
      || observation.beatIndex === suffix[index - 1]!.beatIndex + 1);
  const period1 = enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period1.overall.maximumNormalizedDelta
      <= options.period1NormalizedTolerance);
  const period2 = !period1 && enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period2 !== null
    && observation.period1.overall.maximumNormalizedDelta
      >= options.period2MinimumPeriod1NormalizedDelta
    && observation.period2.overall.maximumNormalizedDelta
      <= options.period2NormalizedTolerance);
  const status: MainWireFiveWallPeriodicClassificationStatusV1 = period1
    ? "period1-converged"
    : period2 ? "period2-suspect" : "not-converged";
  return Object.freeze({
    status,
    latestBeatIndex: latest?.beatIndex ?? null,
    consecutiveBeatsRequired: options.consecutiveBeats,
    evidenceBeatIndices: status === "not-converged"
      ? Object.freeze([])
      : Object.freeze(suffix.map((observation) => observation.beatIndex)),
    latestPeriod1MaximumNormalizedDelta:
      latest?.period1?.overall.maximumNormalizedDelta ?? null,
    latestPeriod2MaximumNormalizedDelta:
      latest?.period2?.overall.maximumNormalizedDelta ?? null,
  });
}

function seed(
  group: MainWireFiveWallPeriodicClosureGroupV1,
  quantity: MainWireFiveWallPeriodicQuantityV1,
  unit: MainWireFiveWallPeriodicUnitV1,
  path: string,
  currentValue: number,
  referenceValue: number,
  referenceScale: number,
): DeltaSeed {
  requireFinite(currentValue, `${path} current value`);
  requireFinite(referenceValue, `${path} reference value`);
  return Object.freeze({
    group,
    quantity,
    unit,
    path,
    currentValue,
    referenceValue,
    referenceScale,
  });
}

function deltaEntry(seedValue: DeltaSeed): MainWireFiveWallPeriodicDeltaEntryV1 {
  const absoluteDelta = Math.abs(seedValue.currentValue - seedValue.referenceValue);
  if (!Number.isFinite(absoluteDelta)) {
    throw new Error(`${seedValue.path} physical delta must be finite`);
  }
  return Object.freeze({
    ...seedValue,
    absoluteDelta,
    normalizedDelta: absoluteDelta / seedValue.referenceScale,
  });
}

function groupReport(
  group: MainWireFiveWallPeriodicClosureGroupV1,
  entries: readonly MainWireFiveWallPeriodicDeltaEntryV1[],
): MainWireFiveWallPeriodicClosureGroupReportV1 {
  if (entries.length === 0) throw new Error(`${group} closure group is empty`);
  const worstEntry = maximumNormalizedEntry(entries);
  return Object.freeze({
    group,
    entryCount: entries.length,
    maximumNormalizedDelta: worstEntry.normalizedDelta,
    worstPath: worstEntry.path,
    worstEntry,
    physicalMaximumByQuantity: physicalMaximumByQuantity(entries),
  });
}

function maximumNormalizedEntry(
  entries: readonly MainWireFiveWallPeriodicDeltaEntryV1[],
): MainWireFiveWallPeriodicDeltaEntryV1 {
  const first = entries[0];
  if (first === undefined) throw new Error("periodic closure entry set is empty");
  return entries.reduce((worst, entry) =>
    entry.normalizedDelta > worst.normalizedDelta ? entry : worst, first);
}

function physicalMaximumByQuantity(
  entries: readonly MainWireFiveWallPeriodicDeltaEntryV1[],
): Readonly<Partial<Record<
  MainWireFiveWallPeriodicQuantityV1,
  MainWireFiveWallPeriodicPhysicalMaximumV1
>>> {
  const worstByQuantity = new Map<
    MainWireFiveWallPeriodicQuantityV1,
    MainWireFiveWallPeriodicDeltaEntryV1
  >();
  for (const entry of entries) {
    const previous = worstByQuantity.get(entry.quantity);
    if (previous === undefined || entry.absoluteDelta > previous.absoluteDelta) {
      worstByQuantity.set(entry.quantity, entry);
    }
  }
  return Object.freeze(Object.fromEntries(Array.from(worstByQuantity, ([quantity, entry]) => [
    quantity,
    Object.freeze({
      quantity,
      unit: entry.unit,
      maximumAbsoluteDelta: entry.absoluteDelta,
      worstPath: entry.path,
      referenceScale: entry.referenceScale,
      normalizedDeltaAtPhysicalMaximum: entry.normalizedDelta,
    }),
  ])));
}

function validateCompatibleStates(
  current: MainWireFiveWallPeriodicAcceptedStateV1,
  reference: MainWireFiveWallPeriodicAcceptedStateV1,
): void {
  validateAcceptedState(current, "current");
  validateAcceptedState(reference, "reference");
  const compatible = current.transactionId === reference.transactionId
    && current.circulation.transactionId === reference.circulation.transactionId
    && current.mechanics.contractId === reference.mechanics.contractId
    && current.mechanics.providerId === reference.mechanics.providerId
    && current.mechanics.parameterSetId === reference.mechanics.parameterSetId
    && current.mechanics.parameterIdentityHash
      === reference.mechanics.parameterIdentityHash
    && current.mechanics.stateSchemaVersion
      === reference.mechanics.stateSchemaVersion;
  if (!compatible) throw new Error("periodic closure state identities differ");
}

function validateAcceptedState(
  state: MainWireFiveWallPeriodicAcceptedStateV1,
  label: string,
): void {
  if (state.transactionId !== MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID) {
    throw new Error(`${label} periodic state has the wrong transaction identity`);
  }
  if (
    state.revision !== state.circulation.revision
    || state.revision !== state.mechanics.revision
    || state.acceptedTimeSec !== state.circulation.acceptedTimeSec
    || state.acceptedTimeSec !== state.mechanics.acceptedTimeSec
  ) throw new Error(`${label} periodic state revision or time is inconsistent`);
  requireFinite(state.acceptedTimeSec, `${label}.acceptedTimeSec`);
}

function validateWallState(state: LandSlsWallMaterialStateV1, label: string): void {
  const cohorts =
    readMainWireNormalAdultParallelActivationCohortStatesV1(state) ?? [state];
  cohorts.forEach((cohort, cohortIndex) => {
    const cohortLabel = cohorts.length === 1
      ? label
      : `${label}.activationCohortStateByPoint[${cohortIndex}]`;
    if (cohort.landState.length !== LAND2017_STATE_SIZE) {
      throw new Error(
        `${cohortLabel}.landState must contain ${LAND2017_STATE_SIZE} values`,
      );
    }
    Array.from(cohort.landState).forEach((value, index) =>
      requireFinite(value, `${cohortLabel}.landState[${index}]`));
    requireFinite(
      cohort.previousFreeCalciumUM,
      `${cohortLabel}.previousFreeCalciumUM`,
    );
  });
  requireFinite(state.slsState.viscousLogStrain, `${label}.slsState.viscousLogStrain`);
  requireFinite(state.previousFiberLogStrain, `${label}.previousFiberLogStrain`);
  requireFinite(state.previousFreeCalciumUM, `${label}.previousFreeCalciumUM`);
}

function validateScales(scales: MainWireFiveWallPeriodicReferenceScalesV1): void {
  if (typeof scales.scaleSetId !== "string" || scales.scaleSetId.length === 0) {
    throw new Error("periodic reference scaleSetId must be non-empty");
  }
  for (const [name, value] of Object.entries(scales)) {
    if (name !== "scaleSetId"
        && (!((value as number) > 0) || !Number.isFinite(value))) {
      throw new Error(`periodic reference scale ${name} must be positive and finite`);
    }
  }
}

function validateClassifierOptions(
  options: MainWireFiveWallPeriodicClassifierOptionsV1,
): void {
  for (const [name, value] of Object.entries({
    period1NormalizedTolerance: options.period1NormalizedTolerance,
    period2NormalizedTolerance: options.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      options.period2MinimumPeriod1NormalizedDelta,
  })) {
    if (!(value >= 0) || !Number.isFinite(value)) {
      throw new Error(`${name} must be nonnegative and finite`);
    }
  }
  if (!Number.isInteger(options.consecutiveBeats) || options.consecutiveBeats <= 0) {
    throw new Error("consecutiveBeats must be a positive integer");
  }
  if (
    options.period2MinimumPeriod1NormalizedDelta
    <= options.period1NormalizedTolerance
  ) {
    throw new Error(
      "period2MinimumPeriod1NormalizedDelta must exceed period1NormalizedTolerance",
    );
  }
}

function validateObservations(
  observations: readonly MainWireFiveWallPeriodicBeatObservationV1[],
): void {
  let previousBeatIndex = -1;
  let referenceScaleSetId: string | null = null;
  for (const observation of observations) {
    if (!Number.isInteger(observation.beatIndex) || observation.beatIndex < 0) {
      throw new Error("periodic observation beatIndex must be a nonnegative integer");
    }
    if (observation.beatIndex <= previousBeatIndex) {
      throw new Error("periodic observations must have strictly increasing beatIndex");
    }
    previousBeatIndex = observation.beatIndex;
    for (const report of [observation.period1, observation.period2]) {
      if (report === null) continue;
      if (!(report.overall.maximumNormalizedDelta >= 0)
          || !Number.isFinite(report.overall.maximumNormalizedDelta)) {
        throw new Error("periodic observation closure must be nonnegative and finite");
      }
      referenceScaleSetId ??= report.referenceScaleSetId;
      if (report.referenceScaleSetId !== referenceScaleSetId) {
        throw new Error("periodic observations use different reference scale sets");
      }
    }
  }
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}
