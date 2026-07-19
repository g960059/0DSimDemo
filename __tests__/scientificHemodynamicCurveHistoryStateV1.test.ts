import { describe, expect, it } from "vitest";

import {
  applyScientificHemodynamicCurveSnapshotV1,
  createScientificHemodynamicCurveHistoryStateV1,
  getScientificHemodynamicCurveScenarioStateV1,
  SCIENTIFIC_HEMODYNAMIC_CURVE_DEFAULT_HISTORY_LIMIT_V1,
  setScientificHemodynamicCurveHistoryLimitV1,
  startScientificHemodynamicCurveGenerationV1,
  type ScientificHemodynamicCurveGenerationSourceV1,
  type ScientificHemodynamicCurveHistoryStateV1,
} from "@/components/scientificProduct/ScientificHemodynamicCurveHistoryStateV1";

type SourceIdentity = Readonly<{ revision: number }>;
type Snapshot = Readonly<{ pointCount: number; label: string }>;
type State = ScientificHemodynamicCurveHistoryStateV1<
  SourceIdentity,
  Snapshot
>;

describe("scientific hemodynamic curve history state V1", () => {
  it("keeps the displayed generation while a replacement is pending", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = snapshot(state, "scenario-a", 1, 0, true, 3);
    const displayed = scenario(state, "scenario-a").current;

    state = start(state, "scenario-a", 2);

    expect(scenario(state, "scenario-a")).toMatchObject({
      current: { generationId: "generation-1" },
      pending: {
        generationId: "generation-2",
        renderable: false,
        snapshot: null,
      },
      history: [],
    });
    expect(scenario(state, "scenario-a").current).toBe(displayed);
  });

  it("accepts partial progress only from the matching source and job", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);

    const wrongJob = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1",
      source: source(1, { jobId: "other-job" }),
      update: progress(0, false, 1),
    });
    const wrongSource = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1",
      source: source(1, { sourceIdentityKey: "other-source" }),
      update: progress(0, false, 1),
    });
    const wrongGeneration = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-stale",
      source: source(1),
      update: progress(0, false, 1),
    });

    expect(wrongJob).toBe(state);
    expect(wrongSource).toBe(state);
    expect(wrongGeneration).toBe(state);

    state = snapshot(state, "scenario-a", 1, 2, false, 2);
    expect(scenario(state, "scenario-a").pending).toMatchObject({
      sequence: 2,
      snapshot: { pointCount: 2 },
      renderable: false,
    });

    const staleSequence = snapshot(state, "scenario-a", 1, 1, true, 9);
    expect(staleSequence).toBe(state);
  });

  it("promotes the first renderable snapshot and updates it without duplicating history", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = snapshot(state, "scenario-a", 1, 0, true, 3);
    state = start(state, "scenario-a", 2);
    state = snapshot(state, "scenario-a", 2, 0, false, 1);

    expect(scenario(state, "scenario-a").current?.generationId)
      .toBe("generation-1");
    expect(scenario(state, "scenario-a").history).toHaveLength(0);

    state = snapshot(state, "scenario-a", 2, 1, true, 2);
    expect(scenario(state, "scenario-a")).toMatchObject({
      current: {
        generationId: "generation-2",
        sequence: 1,
        snapshot: { pointCount: 2 },
      },
      pending: null,
    });
    expect(scenario(state, "scenario-a").history.map(({ generationId }) =>
      generationId)).toEqual(["generation-1"]);

    state = snapshot(state, "scenario-a", 2, 2, true, 5, "complete");
    expect(scenario(state, "scenario-a").current).toMatchObject({
      generationId: "generation-2",
      status: "complete",
      snapshot: { pointCount: 5 },
    });
    expect(scenario(state, "scenario-a").history.map(({ generationId }) =>
      generationId)).toEqual(["generation-1"]);
  });

  it("retains five previous generations by default and can trim the policy", () => {
    let state = createState();
    for (let generation = 1; generation <= 7; generation += 1) {
      state = start(state, "scenario-a", generation);
      state = snapshot(state, "scenario-a", generation, 0, true, generation);
    }

    expect(state.historyLimit)
      .toBe(SCIENTIFIC_HEMODYNAMIC_CURVE_DEFAULT_HISTORY_LIMIT_V1);
    expect(scenario(state, "scenario-a").current?.generationId)
      .toBe("generation-7");
    expect(scenario(state, "scenario-a").history.map(({ generationId }) =>
      generationId)).toEqual([
      "generation-6",
      "generation-5",
      "generation-4",
      "generation-3",
      "generation-2",
    ]);

    state = setScientificHemodynamicCurveHistoryLimitV1(state, 2);
    expect(scenario(state, "scenario-a").history.map(({ generationId }) =>
      generationId)).toEqual(["generation-6", "generation-5"]);
  });

  it("replaces a recalculated detail mode without creating parameter history", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = snapshot(state, "scenario-a", 1, 0, true, 3);
    const firstCalculation = scenario(state, "scenario-a").current;

    state = startScientificHemodynamicCurveGenerationV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1-settled-detail",
      source: source(1, { jobId: "job-1-settled-detail" }),
    });
    state = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1-settled-detail",
      source: source(1, { jobId: "job-1-settled-detail" }),
      update: {
        kind: "snapshot",
        sequence: 0,
        status: "complete",
        snapshot: Object.freeze({ pointCount: 9, label: "settled detail" }),
        renderable: true,
      },
    });

    expect(scenario(state, "scenario-a").current).not.toBe(firstCalculation);
    expect(scenario(state, "scenario-a").current).toMatchObject({
      generationId: "generation-1-settled-detail",
      source: { sourceIdentityKey: "source-1" },
      snapshot: { pointCount: 9 },
    });
    expect(scenario(state, "scenario-a").history).toEqual([]);
  });

  it("does not retain a duplicate when a prior parameter state becomes current again", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = snapshot(state, "scenario-a", 1, 0, true, 3);
    state = start(state, "scenario-a", 2);
    state = snapshot(state, "scenario-a", 2, 0, true, 3);

    state = startScientificHemodynamicCurveGenerationV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1-returned",
      source: source(1, { jobId: "job-1-returned" }),
    });
    state = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-1-returned",
      source: source(1, { jobId: "job-1-returned" }),
      update: {
        kind: "snapshot",
        sequence: 0,
        status: "complete",
        snapshot: Object.freeze({ pointCount: 3, label: "returned state" }),
        renderable: true,
      },
    });

    expect(scenario(state, "scenario-a").current).toMatchObject({
      generationId: "generation-1-returned",
      source: { sourceIdentityKey: "source-1" },
    });
    expect(scenario(state, "scenario-a").history.map(({ source }) =>
      source.sourceIdentityKey)).toEqual(["source-2"]);
  });

  it("keeps the old current generation when the pending job fails", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = snapshot(state, "scenario-a", 1, 0, true, 3);
    state = start(state, "scenario-a", 2);
    const oldCurrent = scenario(state, "scenario-a").current;

    state = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-2",
      source: source(2),
      update: {
        kind: "error",
        sequence: 0,
        errorMessage: "solver stopped",
      },
    });

    expect(scenario(state, "scenario-a").current).toBe(oldCurrent);
    expect(scenario(state, "scenario-a").pending).toBeNull();
    expect(scenario(state, "scenario-a").history).toHaveLength(0);
    expect(scenario(state, "scenario-a").lastFailure).toMatchObject({
      generationId: "generation-2",
      errorMessage: "solver stopped",
    });
  });

  it("isolates generations and stale failures between scenarios", () => {
    let state = createState();
    state = start(state, "scenario-a", 1);
    state = start(state, "scenario-b", 4);
    state = snapshot(state, "scenario-a", 1, 0, true, 2);
    const beforeScenarioB = scenario(state, "scenario-b");

    state = applyScientificHemodynamicCurveSnapshotV1(state, {
      scenarioId: "scenario-a",
      generationId: "generation-stale",
      source: source(99),
      update: {
        kind: "error",
        sequence: 10,
        errorMessage: "stale failure",
      },
    });

    expect(scenario(state, "scenario-a").lastFailure).toBeNull();
    expect(scenario(state, "scenario-b")).toBe(beforeScenarioB);
    expect(scenario(state, "scenario-b").pending?.generationId)
      .toBe("generation-4");
  });
});

function createState(): State {
  return createScientificHemodynamicCurveHistoryStateV1<
    SourceIdentity,
    Snapshot
  >();
}

function start(
  state: State,
  scenarioId: string,
  generation: number,
): State {
  return startScientificHemodynamicCurveGenerationV1(state, {
    scenarioId,
    generationId: `generation-${generation}`,
    source: source(generation),
  });
}

function snapshot(
  state: State,
  scenarioId: string,
  generation: number,
  sequence: number,
  renderable: boolean,
  pointCount: number,
  status: "running" | "complete" = "running",
): State {
  return applyScientificHemodynamicCurveSnapshotV1(state, {
    scenarioId,
    generationId: `generation-${generation}`,
    source: source(generation),
    update: {
      kind: "snapshot",
      sequence,
      status,
      snapshot: Object.freeze({
        pointCount,
        label: `generation ${generation}`,
      }),
      renderable,
    },
  });
}

function source(
  generation: number,
  overrides: Partial<
    ScientificHemodynamicCurveGenerationSourceV1<SourceIdentity>
  > = {},
): ScientificHemodynamicCurveGenerationSourceV1<SourceIdentity> {
  return Object.freeze({
    sourceIdentityKey: `source-${generation}`,
    sourceIdentity: Object.freeze({ revision: generation }),
    jobId: `job-${generation}`,
    ...overrides,
  });
}

function progress(
  sequence: number,
  renderable: boolean,
  pointCount: number,
): Readonly<{
  kind: "snapshot";
  sequence: number;
  status: "running";
  snapshot: Snapshot;
  renderable: boolean;
}> {
  return Object.freeze({
    kind: "snapshot",
    sequence,
    status: "running",
    snapshot: Object.freeze({ pointCount, label: "partial" }),
    renderable,
  });
}

function scenario(state: State, scenarioId: string) {
  return getScientificHemodynamicCurveScenarioStateV1(state, scenarioId)!;
}
