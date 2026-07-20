import { describe, expect, it } from "vitest";

import type {
  ScientificPvBoundaryGuideV1,
} from "@/components/scientificProduct/ScientificPvBoundaryGuidesV1";
import {
  buildScientificPvProgressiveBoundaryGuideV1,
  selectScientificPvProgressiveGuideBeatIdsV1,
} from "@/components/scientificProduct/ScientificPvProgressiveBoundaryGuidesV1";
import type {
  MainWireScientificPvRelationBeatV3,
  MainWireScientificPvRelationsProgressV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

describe("progressive educational LV PV boundary guides", () => {
  it("keeps both default curves hidden until endpoint evidence is usable", () => {
    const fallback = fallbackGuideFixture();
    const guide = buildScientificPvProgressiveBoundaryGuideV1({
      fallbackGuide: fallback,
      generationId: "generation-a",
      generationStatus: "running",
      sourceRole: "target-preview",
      progress: progressFixture([]),
      result: null,
    });

    expect(guide.espvr).toEqual([]);
    expect(guide.edpvr).toEqual([]);
    expect(guide.completedPointCount).toBe(0);
    expect(guide.maximumPointCount).toBe(7);
    expect(guide.sourceRole).toBe("target-preview");
    expect(guide.opacityMultiplier).toBe(0.82);
  });

  it("does not expose either default curve from only one usable endpoint", () => {
    const fallback = fallbackGuideFixture();
    const baseline = beatFixture({
      beatId: "baseline",
      role: "baseline",
      lane: "lower-loading",
      edvMl: 150,
      edpMmHg: 10,
      esvMl: 90,
      espMmHg: 100,
    });

    const guide = progressiveGuideFixture(fallback, [baseline]);

    expect(guide.espvr).toEqual([]);
    expect(guide.edpvr).toEqual([]);
    expect(guide.progressiveEvidence).toMatchObject({
      selectedBeatIds: ["baseline"],
      espvrPointCount: 1,
      edpvrPointCount: 0,
      espvrRefined: false,
      edpvrRefined: false,
    });
  });

  it("shows ESPVR at two points while independently withholding EDPVR", () => {
    const fallback = fallbackGuideFixture();
    const baseline = beatFixture({
      beatId: "baseline",
      role: "baseline",
      lane: "lower-loading",
      edvMl: 150,
      edpMmHg: 10,
      esvMl: 90,
      espMmHg: 100,
    });
    const lower = beatFixture({
      beatId: "lower-1",
      role: "lower-loading",
      lane: "lower-loading",
      edvMl: 120,
      edpMmHg: 5,
      esvMl: 60,
      espMmHg: 70,
    });
    const guide = progressiveGuideFixture(fallback, [baseline, lower]);

    expect(guide.semantics)
      .toBe("progressive-model-derived-orientation-guide-not-formal-fit");
    expect(guide.espvr).not.toEqual(fallback.espvr);
    expect(guide.edpvr).toEqual([]);
    expect(guide.espvr).toContainEqual({ volumeMl: 90, pressureMmHg: 105 });
    expect(guide.endSystolicContact).toEqual({
      volumeMl: 90,
      pressureMmHg: 105,
    });
    expect(guide.progressiveEvidence).toMatchObject({
      selectedBeatIds: ["baseline", "lower-1"],
      espvrPointCount: 2,
      edpvrPointCount: 0,
      espvrRefined: true,
      edpvrRefined: false,
      pooledFormalRelationClaimed: false,
      extrapolationPolicy: "bounded-educational-orientation-only",
    });
  });

  it("keeps the educational ESPVR anchored to the visible loop contact", () => {
    const fallback = fallbackGuideFixture({
      endSystolicContact: Object.freeze({
        volumeMl: 70,
        pressureMmHg: 110,
      }),
    });
    const baseline = beatFixture({
      beatId: "baseline",
      role: "baseline",
      lane: "lower-loading",
      edvMl: 150,
      edpMmHg: 10,
      esvMl: 90,
      espMmHg: 100,
    });
    const lower = beatFixture({
      beatId: "lower-1",
      role: "lower-loading",
      lane: "lower-loading",
      edvMl: 120,
      edpMmHg: 5,
      esvMl: 60,
      espMmHg: 70,
    });

    const guide = progressiveGuideFixture(fallback, [baseline, lower]);

    expect(guide.progressiveEvidence?.espvrRefined).toBe(true);
    expect(guide.endSystolicContact).toEqual(
      fallback.endSystolicContact,
    );
    expect(guide.espvr).toContainEqual(fallback.endSystolicContact);
    expect(guide.endSystolicContact).not.toEqual({
      volumeMl: baseline.endSystolic!.volumeMl,
      pressureMmHg: baseline.endSystolic!.absolutePressureMmHg,
    });
  });

  it("never trades visible-loop contact for the progressive slope guard", () => {
    const fallback = fallbackGuideFixture({
      endSystolicContact: Object.freeze({
        volumeMl: 55,
        pressureMmHg: 150,
      }),
    });
    const guide = progressiveGuideFixture(fallback, [
      beatFixture({
        beatId: "baseline",
        role: "baseline",
        lane: "lower-loading",
        edvMl: 150,
        edpMmHg: 10,
        esvMl: 90,
        espMmHg: 80,
      }),
      beatFixture({
        beatId: "lower-1",
        role: "lower-loading",
        lane: "lower-loading",
        edvMl: 120,
        edpMmHg: 5,
        esvMl: 60,
        espMmHg: 20,
      }),
    ]);

    expect(guide.endSystolicContact).toEqual(
      fallback.endSystolicContact,
    );
    expect(guide.espvr).toContainEqual(fallback.endSystolicContact);
  });

  it("requires lower and higher EDV evidence before refining EDPVR", () => {
    const fallback = fallbackGuideFixture();
    const baseline = beatFixture({
      beatId: "baseline",
      role: "baseline",
      lane: "lower-loading",
      edvMl: 150,
      edpMmHg: 10,
      esvMl: 90,
      espMmHg: 100,
    });
    const lower = beatFixture({
      beatId: "lower",
      role: "lower-loading",
      lane: "lower-loading",
      edvMl: 120,
      edpMmHg: 5,
      esvMl: 60,
      espMmHg: 70,
    });
    const secondLower = beatFixture({
      beatId: "lower-2",
      role: "lower-loading",
      lane: "lower-loading",
      edvMl: 105,
      edpMmHg: 3,
      esvMl: 50,
      espMmHg: 58,
    });
    const withoutHigher = progressiveGuideFixture(
      fallback,
      [baseline, lower, secondLower],
    );
    expect(withoutHigher.edpvr).toEqual([]);

    const higher = beatFixture({
      beatId: "higher",
      role: "higher-loading",
      lane: "higher-loading",
      edvMl: 180,
      edpMmHg: 18,
      esvMl: 120,
      espMmHg: 130,
    });
    const bidirectional = progressiveGuideFixture(
      fallback,
      [baseline, lower, higher],
    );

    expect(bidirectional.edpvr).not.toEqual(fallback.edpvr);
    expect(bidirectional.edpvr).toContainEqual({
      volumeMl: 150,
      pressureMmHg: 15,
    });
    expect(bidirectional.endDiastolicContact).toEqual({
      volumeMl: 150,
      pressureMmHg: 15,
    });
    expect(bidirectional.progressiveEvidence).toMatchObject({
      lowerPointCount: 1,
      higherPointCount: 1,
      edpvrPointCount: 3,
      edpvrRefined: true,
    });

    const nonMonotoneHigher = beatFixture({
      beatId: "higher-non-monotone",
      role: "higher-loading",
      lane: "higher-loading",
      edvMl: 180,
      edpMmHg: 8,
      esvMl: 120,
      espMmHg: 130,
    });
    const guarded = progressiveGuideFixture(
      fallback,
      [baseline, lower, secondLower, nonMonotoneHigher],
    );
    expect(guarded.edpvr).toEqual([]);
    expect(guarded.progressiveEvidence?.edpvrRefined).toBe(false);
  });

  it("selects a deterministic seven-point EDV envelope", () => {
    const baseline = beatFixture({
      beatId: "baseline",
      role: "baseline",
      lane: "lower-loading",
      edvMl: 150,
      edpMmHg: 10,
      esvMl: 90,
      espMmHg: 100,
    });
    const lower = [145, 140, 130, 120, 100].map((edvMl, index) =>
      beatFixture({
        beatId: `lower-${index}`,
        role: "lower-loading",
        lane: "lower-loading",
        edvMl,
        edpMmHg: 2 + 0.05 * edvMl,
        esvMl: edvMl - 60,
        espMmHg: edvMl - 50,
      }));
    const higher = [155, 160, 170, 185, 210].map((edvMl, index) =>
      beatFixture({
        beatId: `higher-${index}`,
        role: "higher-loading",
        lane: "higher-loading",
        edvMl,
        edpMmHg: 2 + 0.05 * edvMl,
        esvMl: edvMl - 60,
        espMmHg: edvMl - 50,
      }));
    const wrongDirection = beatFixture({
      beatId: "wrong-direction",
      role: "lower-loading",
      lane: "lower-loading",
      edvMl: 165,
      edpMmHg: 12,
      esvMl: 100,
      espMmHg: 110,
    });

    expect(selectScientificPvProgressiveGuideBeatIdsV1([
      baseline,
      ...lower,
      wrongDirection,
      ...higher,
    ])).toEqual([
      "baseline",
      "lower-4",
      "lower-2",
      "lower-0",
      "higher-0",
      "higher-2",
      "higher-4",
    ]);
  });

  it("preserves pressure-basis offsets without changing derived mechanics", () => {
    const beats = [
      beatFixture({
        beatId: "baseline",
        role: "baseline",
        lane: "lower-loading",
        edvMl: 150,
        edpMmHg: 10,
        esvMl: 90,
        espMmHg: 100,
      }),
      beatFixture({
        beatId: "lower",
        role: "lower-loading",
        lane: "lower-loading",
        edvMl: 120,
        edpMmHg: 5,
        esvMl: 60,
        espMmHg: 70,
      }),
      beatFixture({
        beatId: "higher",
        role: "higher-loading",
        lane: "higher-loading",
        edvMl: 180,
        edpMmHg: 18,
        esvMl: 120,
        espMmHg: 130,
      }),
    ];
    const absoluteFallback = fallbackGuideFixture();
    const transmuralFallback = Object.freeze({
      ...absoluteFallback,
      pressureBasis: "transmural" as const,
      espvr: Object.freeze(absoluteFallback.espvr.map((point) =>
        Object.freeze({
          volumeMl: point.volumeMl,
          pressureMmHg: point.pressureMmHg - 5,
        }))),
      edpvr: Object.freeze(absoluteFallback.edpvr.map((point) =>
        Object.freeze({
          volumeMl: point.volumeMl,
          pressureMmHg: point.pressureMmHg - 5,
        }))),
      endSystolicContact: Object.freeze({
        volumeMl: absoluteFallback.endSystolicContact.volumeMl,
        pressureMmHg:
          absoluteFallback.endSystolicContact.pressureMmHg - 5,
      }),
      endDiastolicContact: Object.freeze({
        volumeMl: absoluteFallback.endDiastolicContact.volumeMl,
        pressureMmHg:
          absoluteFallback.endDiastolicContact.pressureMmHg - 5,
      }),
    });
    const absolute = progressiveGuideFixture(absoluteFallback, beats);
    const transmural = progressiveGuideFixture(
      transmuralFallback,
      beats,
    );

    absolute.espvr.forEach((point, index) => {
      expect(point.pressureMmHg - transmural.espvr[index]!.pressureMmHg)
        .toBeCloseTo(5, 10);
    });
    absolute.edpvr.forEach((point, index) => {
      expect(point.pressureMmHg - transmural.edpvr[index]!.pressureMmHg)
        .toBeCloseTo(5, 10);
    });
  });

  it("exposes bounded history opacity and pending-replacement demotion", () => {
    const fallback = fallbackGuideFixture();
    const history = buildScientificPvProgressiveBoundaryGuideV1({
      fallbackGuide: fallback,
      generationId: "old",
      generationAge: 2,
      generationStatus: "complete",
      sourceRole: "history",
      progress: progressFixture([]),
      result: null,
    });
    const pendingReplacement = buildScientificPvProgressiveBoundaryGuideV1({
      fallbackGuide: fallback,
      generationId: "current",
      generationStatus: "complete",
      sourceRole: "visible-current",
      replacementPending: true,
      progress: progressFixture([]),
      result: null,
    });

    expect(history.status).toBe("stale");
    expect(history.opacityMultiplier).toBe(0.14);
    expect(pendingReplacement.opacityMultiplier).toBe(0.55);
  });
});

function progressiveGuideFixture(
  fallbackGuide: ScientificPvBoundaryGuideV1,
  beats: readonly MainWireScientificPvRelationBeatV3[],
) {
  return buildScientificPvProgressiveBoundaryGuideV1({
    fallbackGuide,
    generationId: "generation-a",
    generationStatus: "running",
    sourceRole: "target-preview",
    progress: progressFixture(beats),
    result: null,
  });
}

function fallbackGuideFixture(overrides: Partial<
  ScientificPvBoundaryGuideV1
> = {}): ScientificPvBoundaryGuideV1 {
  const endSystolicContact = overrides.endSystolicContact ?? Object.freeze({
    volumeMl: 90,
    pressureMmHg: 105,
  });
  return Object.freeze({
    key: "scenario-a:lv:textbook-boundaries",
    scenarioId: "scenario-a",
    color: "#2dd4bf",
    pressureBasis: "intracavitary",
    espvr: Object.freeze([
      Object.freeze({ volumeMl: 0, pressureMmHg: 5 }),
      endSystolicContact,
    ]),
    edpvr: Object.freeze([
      Object.freeze({ volumeMl: 0, pressureMmHg: 5 }),
      Object.freeze({ volumeMl: 150, pressureMmHg: 15 }),
    ]),
    endSystolicContact,
    endDiastolicContact: Object.freeze({
      volumeMl: 150,
      pressureMmHg: 15,
    }),
    semantics: "single-beat-orientation-guide-not-load-series-fit",
    ...overrides,
  });
}

function progressFixture(
  beats: readonly MainWireScientificPvRelationBeatV3[],
): MainWireScientificPvRelationsProgressV3 {
  return Object.freeze({
    beats: Object.freeze([...beats]),
  }) as unknown as MainWireScientificPvRelationsProgressV3;
}

function beatFixture(input: Readonly<{
  beatId: string;
  role: "baseline" | "lower-loading" | "higher-loading";
  lane: "lower-loading" | "higher-loading";
  edvMl: number;
  edpMmHg: number;
  esvMl: number;
  espMmHg: number;
  externalPressureMmHg?: number;
}>): MainWireScientificPvRelationBeatV3 {
  const externalPressureMmHg = input.externalPressureMmHg ?? 5;
  return Object.freeze({
    beatId: input.beatId,
    role: input.role,
    lane: input.lane,
    valid: true,
    classification: "fit-eligible",
    endDiastolic: endpointFixture(
      input.edvMl,
      input.edpMmHg,
      externalPressureMmHg,
    ),
    endSystolic: endpointFixture(
      input.esvMl,
      input.espMmHg,
      externalPressureMmHg,
    ),
  }) as unknown as MainWireScientificPvRelationBeatV3;
}

function endpointFixture(
  volumeMl: number,
  transmuralPressureMmHg: number,
  externalPressureMmHg: number,
) {
  return Object.freeze({
    sampleIndex: 0,
    phase01: 0,
    volumeMl,
    transmuralPressureMmHg,
    absolutePressureMmHg: transmuralPressureMmHg + externalPressureMmHg,
    externalPressureMmHg,
  });
}
