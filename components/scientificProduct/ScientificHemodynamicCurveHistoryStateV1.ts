export const SCIENTIFIC_HEMODYNAMIC_CURVE_DEFAULT_HISTORY_LIMIT_V1 = 5;

export type ScientificHemodynamicCurveGenerationStatusV1 =
  | "running"
  | "complete";

/**
 * Stable identity supplied by the registry. `sourceIdentityKey` must change
 * whenever the accepted model state changes; the source object is retained so
 * consumers can display or export its release-bound identity without teaching
 * this reducer about a particular protocol.
 */
export type ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity> =
  Readonly<{
    sourceIdentityKey: string;
    sourceIdentity: TSourceIdentity;
    jobId: string;
  }>;

export type ScientificHemodynamicCurveGenerationV1<
  TSourceIdentity,
  TSnapshot,
> = Readonly<{
  generationId: string;
  source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>;
  sequence: number;
  status: ScientificHemodynamicCurveGenerationStatusV1;
  snapshot: TSnapshot | null;
  renderable: boolean;
}>;

export type ScientificHemodynamicCurveGenerationFailureV1<TSourceIdentity> =
  Readonly<{
    generationId: string;
    /**
     * Null when artifact restoration or Worker startup failed before the
     * first job snapshot supplied a source/job identity.
     */
    source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>
      | null;
    sequence: number;
    errorMessage: string;
  }>;

export type ScientificHemodynamicCurveScenarioStateV1<
  TSourceIdentity,
  TSnapshot,
> = Readonly<{
  current: ScientificHemodynamicCurveGenerationV1<
    TSourceIdentity,
    TSnapshot
  > | null;
  pending: ScientificHemodynamicCurveGenerationV1<
    TSourceIdentity,
    TSnapshot
  > | null;
  history: readonly ScientificHemodynamicCurveGenerationV1<
    TSourceIdentity,
    TSnapshot
  >[];
  lastFailure:
    | ScientificHemodynamicCurveGenerationFailureV1<TSourceIdentity>
    | null;
}>;

export type ScientificHemodynamicCurveHistoryStateV1<
  TSourceIdentity,
  TSnapshot,
> = Readonly<{
  historyLimit: number;
  scenarios: Readonly<Record<
    string,
    ScientificHemodynamicCurveScenarioStateV1<TSourceIdentity, TSnapshot>
  >>;
}>;

export type StartScientificHemodynamicCurveGenerationInputV1<
  TSourceIdentity,
> = Readonly<{
  scenarioId: string;
  generationId: string;
  source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>;
}>;

export type ScientificHemodynamicCurveSnapshotUpdateV1<TSnapshot> =
  | Readonly<{
    kind: "snapshot";
    sequence: number;
    status: ScientificHemodynamicCurveGenerationStatusV1;
    snapshot: TSnapshot;
    renderable: boolean;
  }>
  | Readonly<{
    kind: "error";
    sequence: number;
    errorMessage: string;
  }>;

export type ApplyScientificHemodynamicCurveSnapshotInputV1<
  TSourceIdentity,
  TSnapshot,
> = Readonly<{
  scenarioId: string;
  generationId: string;
  source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>;
  update: ScientificHemodynamicCurveSnapshotUpdateV1<TSnapshot>;
}>;

export type RecordScientificHemodynamicCurveAcquisitionFailureInputV1 =
  Readonly<{
    scenarioId: string;
    generationId: string;
    sequence: number;
    errorMessage: string;
  }>;

export function createScientificHemodynamicCurveHistoryStateV1<
  TSourceIdentity,
  TSnapshot,
>(options: Readonly<{ historyLimit?: number }> = {}):
  ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  return Object.freeze({
    historyLimit: normalizeHistoryLimit(options.historyLimit),
    scenarios: Object.freeze({}),
  });
}

export function getScientificHemodynamicCurveScenarioStateV1<
  TSourceIdentity,
  TSnapshot,
>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  scenarioId: string,
): ScientificHemodynamicCurveScenarioStateV1<
  TSourceIdentity,
  TSnapshot
> | null {
  return state.scenarios[scenarioId] ?? null;
}

/**
 * Starts or supersedes a pending generation without removing the currently
 * displayed generation. Repeating the exact same start is idempotent.
 */
export function startScientificHemodynamicCurveGenerationV1<
  TSourceIdentity,
  TSnapshot,
>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  input: StartScientificHemodynamicCurveGenerationInputV1<TSourceIdentity>,
): ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  const scenario = state.scenarios[input.scenarioId]
    ?? emptyScenarioState<TSourceIdentity, TSnapshot>();
  if (
    generationMatches(scenario.pending, input)
    || generationMatches(scenario.current, input)
  ) {
    return state;
  }

  const pending = freezeGeneration<TSourceIdentity, TSnapshot>({
    generationId: input.generationId,
    source: freezeSource(input.source),
    sequence: -1,
    status: "running",
    snapshot: null,
    renderable: false,
  });
  return replaceScenario(state, input.scenarioId, Object.freeze({
    current: scenario.current,
    pending,
    history: scenario.history,
    lastFailure: null,
  }));
}

/**
 * Applies only monotonically newer updates for the exact generation, source,
 * and job. A pending generation becomes current at its first renderable
 * snapshot; the former current generation then enters bounded history.
 */
export function applyScientificHemodynamicCurveSnapshotV1<
  TSourceIdentity,
  TSnapshot,
>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  input: ApplyScientificHemodynamicCurveSnapshotInputV1<
    TSourceIdentity,
    TSnapshot
  >,
): ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  const scenario = state.scenarios[input.scenarioId];
  if (scenario === undefined) return state;

  const targetKind = generationMatches(scenario.pending, input)
    ? "pending"
    : generationMatches(scenario.current, input)
      ? "current"
      : null;
  if (targetKind === null) return state;

  const target = targetKind === "pending"
    ? scenario.pending!
    : scenario.current!;
  if (input.update.sequence <= target.sequence) return state;

  if (input.update.kind === "error") {
    const lastFailure = Object.freeze({
      generationId: target.generationId,
      source: target.source,
      sequence: input.update.sequence,
      errorMessage: input.update.errorMessage,
    });
    return replaceScenario(state, input.scenarioId, Object.freeze({
      current: scenario.current,
      pending: targetKind === "pending" ? null : scenario.pending,
      history: scenario.history,
      lastFailure,
    }));
  }

  const updated = freezeGeneration<TSourceIdentity, TSnapshot>({
    ...target,
    sequence: input.update.sequence,
    status: input.update.status,
    snapshot: input.update.snapshot,
    renderable: target.renderable || input.update.renderable,
  });

  if (targetKind === "pending" && updated.renderable) {
    const replacesSameSourceGeneration = scenario.current?.source
      .sourceIdentityKey === updated.source.sourceIdentityKey;
    const history = scenario.current === null || replacesSameSourceGeneration
      ? scenario.history
      : Object.freeze([
        scenario.current,
        ...scenario.history.filter(({ source }) =>
          source.sourceIdentityKey
            !== scenario.current!.source.sourceIdentityKey
          && source.sourceIdentityKey
            !== updated.source.sourceIdentityKey),
      ].slice(0, state.historyLimit));
    return replaceScenario(state, input.scenarioId, Object.freeze({
      current: updated,
      pending: null,
      history,
      lastFailure: null,
    }));
  }

  return replaceScenario(state, input.scenarioId, Object.freeze({
    current: targetKind === "current" ? updated : scenario.current,
    pending: targetKind === "pending" ? updated : scenario.pending,
    history: scenario.history,
    lastFailure: null,
  }));
}

/**
 * Records a restore/start failure that occurs before the Worker can publish a
 * job identity. The previous renderable generation and its history remain
 * visible while the acquisition error becomes observable to the UI.
 */
export function recordScientificHemodynamicCurveAcquisitionFailureV1<
  TSourceIdentity,
  TSnapshot,
>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  input: RecordScientificHemodynamicCurveAcquisitionFailureInputV1,
): ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  const scenario = state.scenarios[input.scenarioId]
    ?? emptyScenarioState<TSourceIdentity, TSnapshot>();
  if (
    scenario.lastFailure?.generationId === input.generationId
    && scenario.lastFailure.sequence >= input.sequence
  ) return state;
  return replaceScenario(state, input.scenarioId, Object.freeze({
    current: scenario.current,
    pending: scenario.pending,
    history: scenario.history,
    lastFailure: Object.freeze({
      generationId: input.generationId,
      source: null,
      sequence: input.sequence,
      errorMessage: input.errorMessage,
    }),
  }));
}

export function setScientificHemodynamicCurveHistoryLimitV1<
  TSourceIdentity,
  TSnapshot,
>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  historyLimit: number,
): ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  const normalized = normalizeHistoryLimit(historyLimit);
  if (normalized === state.historyLimit) return state;

  const scenarios = Object.fromEntries(
    Object.entries(state.scenarios).map(([scenarioId, scenario]) => [
      scenarioId,
      scenario.history.length <= normalized
        ? scenario
        : Object.freeze({
          ...scenario,
          history: Object.freeze(scenario.history.slice(0, normalized)),
        }),
    ]),
  ) as Record<
    string,
    ScientificHemodynamicCurveScenarioStateV1<TSourceIdentity, TSnapshot>
  >;
  return Object.freeze({
    historyLimit: normalized,
    scenarios: Object.freeze(scenarios),
  });
}

function generationMatches<TSourceIdentity, TSnapshot>(
  generation: ScientificHemodynamicCurveGenerationV1<
    TSourceIdentity,
    TSnapshot
  > | null,
  identity: Readonly<{
    generationId: string;
    source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>;
  }>,
): boolean {
  return generation !== null
    && generation.generationId === identity.generationId
    && generation.source.jobId === identity.source.jobId
    && generation.source.sourceIdentityKey
      === identity.source.sourceIdentityKey;
}

function emptyScenarioState<TSourceIdentity, TSnapshot>():
  ScientificHemodynamicCurveScenarioStateV1<TSourceIdentity, TSnapshot> {
  return Object.freeze({
    current: null,
    pending: null,
    history: Object.freeze([]),
    lastFailure: null,
  });
}

function replaceScenario<TSourceIdentity, TSnapshot>(
  state: ScientificHemodynamicCurveHistoryStateV1<
    TSourceIdentity,
    TSnapshot
  >,
  scenarioId: string,
  scenario: ScientificHemodynamicCurveScenarioStateV1<
    TSourceIdentity,
    TSnapshot
  >,
): ScientificHemodynamicCurveHistoryStateV1<TSourceIdentity, TSnapshot> {
  return Object.freeze({
    historyLimit: state.historyLimit,
    scenarios: Object.freeze({
      ...state.scenarios,
      [scenarioId]: scenario,
    }),
  });
}

function freezeGeneration<TSourceIdentity, TSnapshot>(
  generation: ScientificHemodynamicCurveGenerationV1<
    TSourceIdentity,
    TSnapshot
  >,
): ScientificHemodynamicCurveGenerationV1<TSourceIdentity, TSnapshot> {
  return Object.freeze(generation);
}

function freezeSource<TSourceIdentity>(
  source: ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity>,
): ScientificHemodynamicCurveGenerationSourceV1<TSourceIdentity> {
  return Object.freeze({ ...source });
}

function normalizeHistoryLimit(value: number | undefined): number {
  if (value === undefined) {
    return SCIENTIFIC_HEMODYNAMIC_CURVE_DEFAULT_HISTORY_LIMIT_V1;
  }
  if (!Number.isFinite(value)) {
    return SCIENTIFIC_HEMODYNAMIC_CURVE_DEFAULT_HISTORY_LIMIT_V1;
  }
  return Math.max(0, Math.floor(value));
}
