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
 * One control command may replace several existing fixture fields. Consumers
 * must validate the complete patch before making any change visible.
 */
export type StudioFixturePatchV2 = Readonly<{
  changes: readonly StudioFixtureFieldChangeV2[];
}>;

/**
 * Ephemeral direct control input. It is reduced into the complete current
 * fixture immediately and is never a durable domain entity.
 */
export type StudioControlActionV2 = Readonly<{
  kind: "control";
  patch: StudioFixturePatchV2;
  requestCorrelation?: string;
}>;

/**
 * Ephemeral model-level knob input. A knob is allowed to fan out to multiple
 * fixture fields through the model adapter seam below.
 */
export type StudioKnobActionV2 = Readonly<{
  kind: "knob";
  knobKey: string;
  value: StudioJsonValueV2;
  requestCorrelation?: string;
}>;

export type StudioFixtureActionV2 =
  | StudioControlActionV2
  | StudioKnobActionV2;

export type StudioModelKnobReductionInputV2 = Readonly<{
  context: StudioScenarioRuntimeContextV2;
  fixture: StudioDesiredFixtureV2;
  action: StudioKnobActionV2;
}>;

/**
 * Exact-model adapter seam for fixture actions.
 *
 * Every action validates the complete resulting fixture. Complex knobs may
 * additionally translate one semantic action into an atomic fixture patch.
 */
export type StudioModelFixtureAdapterV2 = Readonly<{
  modelId: ModelIdV2;
  fixtureSchemaId: string;
  validateCompleteFixture(input: Readonly<{
    context: StudioScenarioRuntimeContextV2;
    fixture: StudioDesiredFixtureV2;
  }>): void;
  reduceKnobAction?: (
    input: StudioModelKnobReductionInputV2,
  ) => StudioFixturePatchV2;
}>;

export type StudioFixtureReductionInputV2 = Readonly<{
  desiredFixture: StudioDesiredFixtureV2;
  action: StudioFixtureActionV2;
  context: StudioScenarioRuntimeContextV2;
}>;
