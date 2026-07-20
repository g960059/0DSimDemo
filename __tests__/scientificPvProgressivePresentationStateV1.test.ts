import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_PV_PRESENTATION_CROSSFADE_MS_V1,
  advanceScientificPvProgressivePresentationStateV1,
  createScientificPvProgressivePresentationStateV1,
  presentScientificPvProgressivePresentationStateV1,
  type ScientificPvPresentationDomainV1,
  type ScientificPvPresentationGenerationInputV1,
  type ScientificPvPresentationScenarioInputV1,
  type ScientificPvProgressivePresentationStateV1,
} from "@/components/scientificProduct/ScientificPvProgressivePresentationStateV1";

type Payload = Readonly<{ geometry: string }>;
type State = ScientificPvProgressivePresentationStateV1<Payload>;

describe("scientific PV progressive presentation state", () => {
  it("keeps the old current visible until the replacement becomes renderable", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario("a", generation("old", 0, "complete", "old"))],
    );

    state = step(state, 10, [scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 0, "running", null),
    )]);
    expect(present(state, 170).layers).toEqual([
      expect.objectContaining({
        generationId: "old",
        opacity: 0.55,
        payload: { geometry: "old" },
      }),
    ]);

    state = step(state, 200, [scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 1, "running", "next-1"),
    )]);
    expect(present(state, 200).layers).toEqual([
      expect.objectContaining({ generationId: "old", opacity: 0.55 }),
    ]);
    expect(present(state, 360).layers).toEqual([
      expect.objectContaining({ generationId: "next", opacity: 1 }),
      expect.objectContaining({ generationId: "old", opacity: 0.3 }),
    ]);
  });

  it("updates same-generation geometry atomically without restarting opacity", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario("a", generation("old", 0, "complete", "old"))],
    );
    state = step(state, 100, [scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 1, "running", "next-1"),
    )]);
    const transitionStartedAt = state.scenarios.a!.layers.find(({ generation }) =>
      generation.generationId === "next")!.opacityTransition.startedAtMs;
    const beforeUpdate = present(state, 180).layers.find(({ generationId }) =>
      generationId === "next")!;

    state = step(state, 180, [scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 2, "running", "next-2"),
    )]);
    const nextLayers = state.scenarios.a!.layers.filter(({ generation }) =>
      generation.generationId === "next");
    expect(nextLayers).toHaveLength(1);
    expect(nextLayers[0]!.opacityTransition.startedAtMs).toBe(transitionStartedAt);
    const afterUpdate = present(state, 180).layers.find(({ generationId }) =>
      generationId === "next")!;
    expect(afterUpdate.opacity).toBeCloseTo(beforeUpdate.opacity, 12);
    expect(afterUpdate.sequence).toBe(2);
    expect(afterUpdate.payload).toEqual({ geometry: "next-2" });
    expect(present(state, 260).layers.find(({ generationId }) =>
      generationId === "next")!.opacity).toBe(1);
  });

  it("refreshes the active contact at the same worker sequence but freezes history", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario(
        "a",
        generation("current", 7, "complete", "visible-contact-old"),
        null,
        [generation("history", 4, "complete", "history-original")],
      )],
    );

    state = step(state, 40, [scenario(
      "a",
      generation("current", 7, "complete", "visible-contact-new"),
      null,
      [generation("history", 4, "complete", "history-rebuilt")],
    )]);
    const refreshed = present(state, 40);
    expect(layer(refreshed, "current").payload).toEqual({
      geometry: "visible-contact-new",
    });
    expect(layer(refreshed, "history").payload).toEqual({
      geometry: "history-original",
    });

    state = step(state, 80, [scenario(
      "a",
      generation("current", 7, "complete", "transient-contact"),
      generation("next", 0, "running", null),
      [generation("history", 4, "complete", "history-rebuilt-again")],
    )]);
    expect(layer(present(state, 240), "current").payload).toEqual({
      geometry: "visible-contact-new",
    });
  });

  it("retargets an interrupted replacement from its on-screen opacity", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario("a", generation("a", 0, "complete", "a"))],
    );
    state = step(state, 100, [scenario(
      "a",
      generation("a", 0, "complete", "a"),
      generation("b", 1, "running", "b"),
    )]);
    const beforeInterrupt = present(state, 180);

    state = step(state, 180, [scenario(
      "a",
      generation("b", 1, "running", "b"),
      generation("c", 1, "running", "c"),
      [generation("a", 0, "complete", "a")],
    )]);
    const afterInterrupt = present(state, 180);
    for (const generationId of ["a", "b"]) {
      expect(layer(afterInterrupt, generationId).opacity).toBeCloseTo(
        layer(beforeInterrupt, generationId).opacity,
        12,
      );
    }
    expect(afterInterrupt.layers.some(({ generationId }) =>
      generationId === "c")).toBe(false);

    const settled = present(state, 180 + SCIENTIFIC_PV_PRESENTATION_CROSSFADE_MS_V1);
    expect(settled.layers.map(({ generationId, opacity }) => [
      generationId,
      opacity,
    ])).toEqual([
      ["c", 1],
      ["b", 0.3],
      ["a", 0.14],
    ]);
  });

  it("uses restrained history alpha and dims the old current while pending", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>({
        historyLimit: 2,
      }),
      0,
      [scenario(
        "a",
        generation("current", 3, "complete", "current"),
        null,
        [
          generation("history-1", 2, "complete", "history-1"),
          generation("history-2", 1, "complete", "history-2"),
        ],
      )],
    );
    expect(present(state, 0).layers.map(({ opacity }) => opacity))
      .toEqual([1, 0.3, 0.14]);

    state = step(state, 20, [scenario(
      "a",
      generation("current", 3, "complete", "current"),
      generation("pending", 0, "running", null),
      [
        generation("history-1", 2, "complete", "history-1"),
        generation("history-2", 1, "complete", "history-2"),
      ],
    )]);
    expect(present(state, 180).layers.map(({ opacity }) => opacity))
      .toEqual([0.55, 0.3, 0.14]);
  });

  it("makes reduced-motion replacement opacity immediate", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario("a", generation("old", 0, "complete", "old"))],
    );
    state = step(state, 100, [scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 1, "running", "next"),
    )], true);
    const view = present(state, 100);
    expect(view.crossfadeActive).toBe(false);
    expect(view.layers.map(({ generationId, opacity }) => [
      generationId,
      opacity,
    ])).toEqual([
      ["next", 1],
      ["old", 0.3],
    ]);
  });

  it("snaps an in-flight fade when reduced motion is enabled", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [scenario("a", generation("old", 0, "complete", "old"))],
    );
    const replacement = scenario(
      "a",
      generation("old", 0, "complete", "old"),
      generation("next", 1, "running", "next"),
    );
    state = step(state, 100, [replacement]);
    expect(present(state, 140).crossfadeActive).toBe(true);

    state = step(state, 140, [replacement], true);
    expect(present(state, 140)).toMatchObject({
      crossfadeActive: false,
      layers: [
        { generationId: "next", opacity: 1 },
        { generationId: "old", opacity: 0.3 },
      ],
    });
  });

  it("expands one canvas domain while any scenario runs, then rebases once", () => {
    let state = step(
      createScientificPvProgressivePresentationStateV1<Payload>(),
      0,
      [
        scenario("a", generation(
          "a-1",
          0,
          "complete",
          "a-1",
          domain(0, 100, 0, 120),
        )),
        scenario("b", generation(
          "b-1",
          0,
          "complete",
          "b-1",
          domain(0, 80, 0, 50),
        )),
      ],
    );
    expect(state.domain).toEqual(domain(0, 100, 0, 120));

    state = step(state, 100, [
      scenario(
        "a",
        generation("a-1", 0, "complete", "a-1", domain(0, 100, 0, 120)),
        generation("a-2", 1, "running", "a-2-1", domain(0, 130, 0, 90)),
      ),
      scenario("b", generation(
        "b-1",
        0,
        "complete",
        "b-1",
        domain(0, 80, 0, 50),
      )),
    ]);
    expect(state.domain).toEqual(domain(0, 130, 0, 120));
    expect(state.domainPhase).toBe("expand-only");

    state = step(state, 140, [
      scenario(
        "a",
        generation("a-1", 0, "complete", "a-1", domain(0, 100, 0, 120)),
        generation("a-2", 2, "running", "a-2-2", domain(0, 90, 0, 80)),
      ),
      scenario("b", generation(
        "b-1",
        0,
        "complete",
        "b-1",
        domain(0, 80, 0, 50),
      )),
    ]);
    expect(state.domain).toEqual(domain(0, 130, 0, 120));

    state = step(state, 200, [
      scenario(
        "a",
        generation("a-2", 3, "complete", "a-2-complete", domain(0, 90, 0, 80)),
        null,
        [generation("a-1", 0, "complete", "a-1", domain(0, 100, 0, 120))],
      ),
      scenario("b", generation(
        "b-1",
        0,
        "complete",
        "b-1",
        domain(0, 80, 0, 50),
      )),
    ]);
    expect(state.domain).toEqual(domain(0, 130, 0, 120));
    expect(state.domainPhase).toBe("rebase-after-crossfade");

    state = step(state, 260, [
      scenario(
        "a",
        generation("a-2", 3, "complete", "a-2-complete", domain(0, 90, 0, 80)),
        null,
        [generation("a-1", 0, "complete", "a-1", domain(0, 100, 0, 120))],
      ),
      scenario("b", generation(
        "b-1",
        0,
        "complete",
        "b-1",
        domain(0, 80, 0, 50),
      )),
    ]);
    // The retained history is still visible at reduced alpha, so its extents
    // remain part of the post-crossfade canvas domain.
    expect(state.domain).toEqual(domain(0, 100, 0, 120));
    expect(state.domainPhase).toBe("settled");
    expect(state.domainRebaseCount).toBe(1);

    state = step(state, 320, [
      scenario(
        "a",
        generation("a-2", 3, "complete", "a-2-complete", domain(0, 90, 0, 80)),
        null,
        [generation("a-1", 0, "complete", "a-1", domain(0, 100, 0, 120))],
      ),
      scenario("b", generation(
        "b-1",
        0,
        "complete",
        "b-1",
        domain(0, 80, 0, 50),
      )),
    ]);
    expect(state.domainRebaseCount).toBe(1);

    state = step(state, 400, [
      scenario("a", generation(
        "a-2",
        3,
        "complete",
        "a-2-complete",
        domain(0, 90, 0, 80),
      )),
      scenario(
        "b",
        generation("b-1", 0, "complete", "b-1", domain(0, 80, 0, 50)),
        generation("b-2", 1, "running", "b-2", domain(0, 75, 0, 200)),
      ),
    ]);
    expect(state.domain).toEqual(domain(0, 100, 0, 200));
    expect(state.domainPhase).toBe("expand-only");
  });
});

function step(
  state: State,
  nowMs: number,
  scenarios: readonly ScientificPvPresentationScenarioInputV1<Payload>[],
  reducedMotion = false,
): State {
  return advanceScientificPvProgressivePresentationStateV1(state, {
    nowMs,
    reducedMotion,
    baseDomain: null,
    scenarios,
  });
}

function present(state: State, nowMs: number) {
  return presentScientificPvProgressivePresentationStateV1(state, nowMs);
}

function layer(
  view: ReturnType<typeof present>,
  generationId: string,
) {
  return view.layers.find((candidate) =>
    candidate.generationId === generationId)!;
}

function scenario(
  scenarioId: string,
  current: ScientificPvPresentationGenerationInputV1<Payload> | null,
  pending: ScientificPvPresentationGenerationInputV1<Payload> | null = null,
  history: readonly ScientificPvPresentationGenerationInputV1<Payload>[] = [],
): ScientificPvPresentationScenarioInputV1<Payload> {
  return Object.freeze({ scenarioId, current, pending, history });
}

function generation(
  generationId: string,
  sequence: number,
  status: "running" | "complete",
  geometry: string | null,
  generationDomain: ScientificPvPresentationDomainV1 = domain(0, 100, 0, 120),
): ScientificPvPresentationGenerationInputV1<Payload> {
  return Object.freeze({
    generationId,
    sequence,
    status,
    renderable: geometry !== null,
    payload: geometry === null ? null : Object.freeze({ geometry }),
    domain: geometry === null ? null : generationDomain,
  });
}

function domain(
  minimumVolumeMl: number,
  maximumVolumeMl: number,
  minimumPressureMmHg: number,
  maximumPressureMmHg: number,
): ScientificPvPresentationDomainV1 {
  return Object.freeze({
    volumeMl: Object.freeze([
      minimumVolumeMl,
      maximumVolumeMl,
    ]) as readonly [number, number],
    pressureMmHg: Object.freeze([
      minimumPressureMmHg,
      maximumPressureMmHg,
    ]) as readonly [number, number],
  });
}
