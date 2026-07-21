import { describe, expect, it } from "vitest";

import {
  advanceCoronaryAcceptedAutoregulationV3,
  createCoronaryAcceptedAutoregulationStateV3,
  createCoronaryAutoregulationWindowBindingV3,
  createDefaultCoronaryAutoregulationWindowControlV3,
  maximumCoronaryAutoregulationStepDurationV3,
  validateCoronaryAcceptedAutoregulationStateV3,
  validateCoronaryAutoregulationWindowBindingV3,
  type CoronaryAutoregulationWindowControlV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  initialCoronaryToneStateV2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
  type CoronaryToneStateV2,
} from "@/engine/coronary/typesV2";

const binding = createCoronaryAutoregulationWindowBindingV3({
  originAcceptedTimeSec: 0,
  durationSec: 1,
  interpretation: "periodic-sinus-cycle-aligned",
});

describe("accepted physical-time coronary autoregulation window V3", () => {
  it("uses BE duration weights and updates tone once at the exact boundary", () => {
    let state = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    let tone = initialCoronaryToneStateV2();
    const samples = [
      { end: 0.1, q: 1, post: 50 },
      { end: 0.3, q: 2, post: 60 },
      { end: 1, q: 3, post: 80 },
    ] as const;
    let start = 0;
    let completion: ReturnType<
      typeof advanceCoronaryAcceptedAutoregulationV3
    >["completedWindow"] = null;
    samples.forEach((sample, index) => {
      const advanced = advanceCoronaryAcceptedAutoregulationV3(
        binding,
        state,
        tone,
        {
          previousAcceptedTimeSec: start,
          candidateAcceptedTimeSec: sample.end,
          candidateRevision: index + 1,
          finalQmInternalFlowMlPerSecByTerritoryLayer:
            layerRecord(sample.q),
          finalPostFocalLesionPressureMmHgByTerritory:
            territoryRecord(sample.post),
          finalCommonCoronaryVenousPressureMmHg: 10,
        },
      );
      if (index < samples.length - 1) {
        expect(advanced.completedWindow).toBeNull();
        expect(advanced.nextToneResistanceScaleByTerritoryLayer).toBe(tone);
      }
      state = advanced.nextState;
      tone = advanced.nextToneResistanceScaleByTerritoryLayer;
      completion = advanced.completedWindow;
      start = sample.end;
    });

    expect(completion).not.toBeNull();
    expect(completion!.acceptedStepCount).toBe(3);
    expect(completion!.aggregate.acceptedWindowDurationSec).toBeCloseTo(1, 15);
    expect(completion!.aggregate
      .meanTissueFlowMlPerSecByTerritoryLayer.LAD.subendocardial)
      .toBeCloseTo(2.6, 14);
    expect(completion!.aggregate.meanPerfusionPressureMmHgByTerritory.LAD)
      .toBeCloseTo(63, 14);
    expect(state.windowIndex).toBe(1);
    expect(state.acceptedDurationSec).toBe(0);
    expect(state.acceptedStepCount).toBe(0);
    expect(state.windowControl).toBeNull();
    expect(tone.LAD.subendocardial).toBeGreaterThan(1);
  });

  it("is pure under retry and rejects a step that crosses a window boundary", () => {
    const state = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    const tone = initialCoronaryToneStateV2();
    const input = {
      previousAcceptedTimeSec: 0,
      candidateAcceptedTimeSec: 0.4,
      candidateRevision: 1,
      finalQmInternalFlowMlPerSecByTerritoryLayer: layerRecord(1),
      finalPostFocalLesionPressureMmHgByTerritory: territoryRecord(80),
      finalCommonCoronaryVenousPressureMmHg: 5,
    } as const;
    const before = JSON.stringify({ state, tone });
    const first = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      state,
      tone,
      input,
    );
    const retry = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      state,
      tone,
      input,
    );
    expect(retry).toEqual(first);
    expect(JSON.stringify({ state, tone })).toBe(before);
    expect(maximumCoronaryAutoregulationStepDurationV3(
      binding,
      first.nextState,
      0.4,
    )).toBeCloseTo(0.6, 15);
    expect(() => advanceCoronaryAcceptedAutoregulationV3(
      binding,
      first.nextState,
      tone,
      {
        ...input,
        previousAcceptedTimeSec: 0.4,
        candidateAcceptedTimeSec: 1.01,
        candidateRevision: 2,
      },
    )).toThrow(/crosses.*window boundary/);
  });

  it("latches control mid-window and permits a new control only after reset", () => {
    const initial = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    const tone = initialCoronaryToneStateV2();
    const baseline = createDefaultCoronaryAutoregulationWindowControlV3();
    const changed = Object.freeze({
      ...baseline,
      controlId: "hyperemia-test-control",
      hyperemia01ByTerritoryLayer: layerRecord(1),
    }) satisfies CoronaryAutoregulationWindowControlV3;
    const partial = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      initial,
      tone,
      sampleInput(0, 0.5, 1, baseline),
    );
    expect(() => advanceCoronaryAcceptedAutoregulationV3(
      binding,
      partial.nextState,
      tone,
      sampleInput(0.5, 1, 2, changed),
    )).toThrow(/cannot change mid-window/);
    const completed = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      partial.nextState,
      tone,
      sampleInput(0.5, 1, 2, baseline),
    );
    expect(completed.completedWindow).not.toBeNull();
    const next = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      completed.nextState,
      completed.nextToneResistanceScaleByTerritoryLayer,
      sampleInput(1, 1.25, 3, changed),
    );
    expect(next.nextState.windowControl?.controlId)
      .toBe("hyperemia-test-control");
  });

  it("allows instantaneous reverse Qm but fails closed on a negative window mean", () => {
    const initial = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    const tone = initialCoronaryToneStateV2();
    const reverse = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      initial,
      tone,
      {
        ...sampleInput(0, 0.2, 1),
        finalQmInternalFlowMlPerSecByTerritoryLayer: layerRecord(-1),
      },
    );
    const recovered = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      reverse.nextState,
      tone,
      {
        ...sampleInput(0.2, 1, 2),
        finalQmInternalFlowMlPerSecByTerritoryLayer: layerRecord(1),
      },
    );
    expect(recovered.completedWindow!.aggregate
      .meanTissueFlowMlPerSecByTerritoryLayer.LAD.subepicardial)
      .toBeCloseTo(0.6, 14);

    expect(() => advanceCoronaryAcceptedAutoregulationV3(
      binding,
      initial,
      tone,
      {
        ...sampleInput(0, 1, 1),
        finalQmInternalFlowMlPerSecByTerritoryLayer: layerRecord(-1),
      },
    )).toThrow(/flow and perfusion pressure must be non-negative/);
  });

  it("uses the disease floor as anti-windup during sustained hyperemia", () => {
    let state = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    let tone: CoronaryToneStateV2 = initialCoronaryToneStateV2();
    const floor = 0.5;
    const control = Object.freeze({
      controlId: "cmd-floor-hyperemia-test",
      demandScaleByTerritoryLayer: layerRecord(1),
      hyperemia01ByTerritoryLayer: layerRecord(1),
      effectiveMinimumToneScaleByTerritoryLayer: layerRecord(floor),
    }) satisfies CoronaryAutoregulationWindowControlV3;
    for (let window = 0; window < 250; window += 1) {
      const advanced = advanceCoronaryAcceptedAutoregulationV3(
        binding,
        state,
        tone,
        sampleInput(window, window + 1, window + 1, control),
      );
      state = advanced.nextState;
      tone = advanced.nextToneResistanceScaleByTerritoryLayer;
    }
    expect(tone.LAD.subendocardial).toBeGreaterThanOrEqual(floor);
    expect(tone.LAD.subendocardial).toBeCloseTo(floor, 4);
  });

  it("gives the same constant-signal tone update at 2 ms and 1 ms", () => {
    const coarse = completeConstantWindow(0.002, 2);
    const fine = completeConstantWindow(0.001, 2);
    expect(coarse.state).toMatchObject({
      windowIndex: 1,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    expect(fine.state).toMatchObject({
      windowIndex: 1,
      acceptedDurationSec: 0,
      acceptedStepCount: 0,
      windowControl: null,
    });
    for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
      for (const layerId of CORONARY_LAYER_IDS_V2) {
        expect(coarse.tone[territoryId][layerId])
          .toBeCloseTo(fine.tone[territoryId][layerId], 13);
      }
    }
  });

  it("rejects hidden fields in binding, state, and fixed-dimension records", () => {
    const bindingWithHiddenField = Object.freeze({
      ...binding,
      hiddenLawState: 1,
    }) as typeof binding;
    expect(() => validateCoronaryAutoregulationWindowBindingV3(
      bindingWithHiddenField,
    )).toThrow(/binding keys mismatch/);

    const state = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 0,
    });
    const stateWithHiddenRecord = Object.freeze({
      ...state,
      qmTimeIntegralMlByTerritoryLayer: Object.freeze({
        ...state.qmTimeIntegralMlByTerritoryLayer,
        hiddenTerritory: Object.freeze({
          subepicardial: 0,
          subendocardial: 0,
        }),
      }),
    }) as typeof state;
    expect(() => validateCoronaryAcceptedAutoregulationStateV3(
      binding,
      stateWithHiddenRecord,
      { acceptedTimeSec: 0, maximumRevision: 0 },
    )).toThrow(/Qm time integral keys mismatch/);
  });

  it("binds accepted step count exactly to the enclosing revision", () => {
    const initial = createCoronaryAcceptedAutoregulationStateV3(binding, {
      acceptedTimeSec: 0,
      revision: 7,
    });
    expect(() => advanceCoronaryAcceptedAutoregulationV3(
      binding,
      initial,
      initialCoronaryToneStateV2(),
      sampleInput(0, 0.1, 9),
    )).toThrow(/revision.*exactly one step/);

    const partial = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      initial,
      initialCoronaryToneStateV2(),
      sampleInput(0, 0.1, 8),
    );
    expect(() => validateCoronaryAcceptedAutoregulationStateV3(
      binding,
      partial.nextState,
      { acceptedTimeSec: 0.1, maximumRevision: 9 },
    )).toThrow(/step count differs from accepted revision/);
  });
});

function completeConstantWindow(
  dtSec: number,
  targetMultiple: number,
): Readonly<{
  state: ReturnType<typeof createCoronaryAcceptedAutoregulationStateV3>;
  tone: CoronaryToneStateV2;
}> {
  const stepCount = Math.round(1 / dtSec);
  const target = targetFlowRecord();
  let state = createCoronaryAcceptedAutoregulationStateV3(binding, {
    acceptedTimeSec: 0,
    revision: 0,
  });
  let tone: CoronaryToneStateV2 = initialCoronaryToneStateV2();
  for (let index = 1; index <= stepCount; index += 1) {
    const previousAcceptedTimeSec = (index - 1) * dtSec;
    const candidateAcceptedTimeSec = index === stepCount ? 1 : index * dtSec;
    const advanced = advanceCoronaryAcceptedAutoregulationV3(
      binding,
      state,
      tone,
      {
        ...sampleInput(
          previousAcceptedTimeSec,
          candidateAcceptedTimeSec,
          index,
        ),
        finalQmInternalFlowMlPerSecByTerritoryLayer: layerRecord(
          (territoryId, layerId) => targetMultiple
            * target[territoryId][layerId],
        ),
      },
    );
    state = advanced.nextState;
    tone = advanced.nextToneResistanceScaleByTerritoryLayer;
  }
  return Object.freeze({ state, tone });
}

function sampleInput(
  start: number,
  end: number,
  revision: number,
  control = createDefaultCoronaryAutoregulationWindowControlV3(),
) {
  return {
    previousAcceptedTimeSec: start,
    candidateAcceptedTimeSec: end,
    candidateRevision: revision,
    finalQmInternalFlowMlPerSecByTerritoryLayer: targetFlowRecord(),
    finalPostFocalLesionPressureMmHgByTerritory: territoryRecord(80),
    finalCommonCoronaryVenousPressureMmHg: 5,
    control,
  } as const;
}

function targetFlowRecord(): CoronaryTerritoryLayerRecordV2<number> {
  return layerRecord((territoryId, layerId) => {
    const territory = NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2
      .territories[territoryId];
    return territory.targetRestingFlowMlPerMin / 60
      * territory.layers[layerId].restingFlowFractionWithinTerritory01;
  });
}

function layerRecord(
  value: number | ((
    territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
    layerId: (typeof CORONARY_LAYER_IDS_V2)[number],
  ) => number),
): CoronaryTerritoryLayerRecordV2<number> {
  const resolve = typeof value === "number" ? () => value : value;
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        resolve(territoryId, layerId),
      ]),
    ))],
  ))) as CoronaryTerritoryLayerRecordV2<number>;
}

function territoryRecord(value: number): CoronaryTerritoryRecordV2<number> {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, value],
  ))) as CoronaryTerritoryRecordV2<number>;
}
