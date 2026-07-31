import type {
  ModelIdV2,
  ScenarioIdV2,
} from "./ids";
import type {
  StudioJsonValueV2,
} from "./json";

/**
 * Runtime context for a current scenario fixture. Identity stays outside the
 * model-owned fixture JSON, so the same fixture can be captured or replayed
 * without injecting Studio bookkeeping into the model schema.
 */
export type StudioScenarioRuntimeContextV2 = Readonly<{
  scenarioId: ScenarioIdV2;
  modelId: ModelIdV2;
}>;

/**
 * A complete model-owned desired fixture after the latest ephemeral action.
 *
 * This is deliberately JSON rather than a Studio-owned parameter entity. It
 * is not an accepted Scenario capture until the runtime applies it at an
 * accepted boundary and pairs it with a fresh checkpoint.
 */
export type StudioDesiredFixtureV2 = StudioJsonValueV2;

export type StudioFixturePathSegmentV2 = string | number;
export type StudioFixturePathV2 = readonly [
  StudioFixturePathSegmentV2,
  ...StudioFixturePathSegmentV2[],
];

export type StudioFixtureFieldChangeV2 = Readonly<{
  path: StudioFixturePathV2;
  value: StudioJsonValueV2;
}>;

/**
 * One model-owned control reduction may replace several existing fixture
 * fields. This path-level value never crosses the public UI command boundary.
 */
export type StudioFixturePatchV2 = Readonly<{
  changes: readonly StudioFixtureFieldChangeV2[];
}>;

/**
 * Ephemeral semantic control input. The model-owned adapter resolves
 * `controlId + value` into an atomic fixture patch; callers cannot name raw
 * fixture paths. The action ends after the desired fixture is updated.
 */
export type StudioControlActionV2 = Readonly<{
  kind: "control";
  controlId: string;
  value: StudioJsonValueV2;
  requestCorrelation?: string;
}>;

export type StudioFixtureActionV2 = StudioControlActionV2;

export type StudioModelControlReductionInputV2 = Readonly<{
  context: StudioScenarioRuntimeContextV2;
  fixture: StudioDesiredFixtureV2;
  action: StudioControlActionV2;
}>;

/**
 * Exact-model adapter seam for fixture actions.
 *
 * Every action validates the complete resulting fixture. One semantic control
 * may translate into an atomic multi-field fixture patch.
 */
export type StudioModelFixtureAdapterV2 = Readonly<{
  modelId: ModelIdV2;
  fixtureSchemaId: string;
  validateCompleteFixture(input: Readonly<{
    context: StudioScenarioRuntimeContextV2;
    fixture: StudioDesiredFixtureV2;
  }>): void;
  reduceControlAction?: (
    input: StudioModelControlReductionInputV2,
  ) => StudioFixturePatchV2;
}>;

export type StudioFixtureReductionInputV2 = Readonly<{
  desiredFixture: StudioDesiredFixtureV2;
  action: StudioFixtureActionV2;
  context: StudioScenarioRuntimeContextV2;
}>;
