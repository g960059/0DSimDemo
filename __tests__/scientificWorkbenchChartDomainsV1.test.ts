import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificWorkbenchChartLegendV1,
  scientificChartAxisLabelPositionsV1,
  scientificChartDomainV1,
  scientificChartPlotRectV1,
  scientificChartPlotTopV1,
  scientificPvBoundaryGuidePresentationInputsV1,
  scientificPvRelationDomainPointsV1,
  scientificPvRelationQualityNoticesV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";
import {
  scientificPvAnalysisDemandEnabledV1,
  scientificPvProgressiveBoundaryGuidesForScenarioV1,
  scientificPvRelationOverlaysForScenarioV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import {
  buildScientificPvBoundaryGuideV1,
  buildScientificPvBoundaryGuidesV1,
} from "@/components/scientificProduct/ScientificPvBoundaryGuidesV1";
import type {
  ScientificProductPvRelationProtocolPresentationV1,
  ScientificProductPvRelationProtocolSeriesV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import type {
  MainWireScientificLvPressureVolumeAnalysisV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
  type MainWireScientificPvRelationBeatV2,
  type MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import type {
  MainWireScientificPvRelationBeatV3,
  MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";

describe("scientific Workbench chart domains", () => {
  it("requests PV analysis for either educational guides or advanced overlays", () => {
    expect(scientificPvAnalysisDemandEnabledV1({
      displayMode: "off",
      selectsLv: true,
    })).toBe(true);
    expect(scientificPvAnalysisDemandEnabledV1({
      displayMode: "research",
      showGuides: false,
      selectsLv: true,
    })).toBe(true);
    expect(scientificPvAnalysisDemandEnabledV1({
      displayMode: "off",
      showGuides: false,
      selectsLv: true,
    })).toBe(false);
    expect(scientificPvAnalysisDemandEnabledV1({
      displayMode: "research",
      showGuides: true,
      selectsLv: false,
    })).toBe(false);
  });

  it("keeps the current educational guide dimmed until a pending replacement is renderable", () => {
    const fallback = buildScientificPvBoundaryGuideV1(
      textbookPvSeriesFixture("absolute"),
    )!;
    const resultV2 = pvRelationResultFixture({ fitStatus: "accepted" });
    const current = pvRelationGenerationFixture(
      "parameter-epoch-1",
      resultV2,
      "complete",
      pvRelationResearchResultFixture(resultV2),
    );
    const history = pvRelationGenerationFixture(
      "parameter-epoch-0",
      resultV2,
      "complete",
      pvRelationResearchResultFixture(resultV2),
    );
    const pending = pvRelationGenerationFixture(
      "parameter-epoch-2",
      null,
      "running",
    );

    const guides = scientificPvProgressiveBoundaryGuidesForScenarioV1({
      fallbackGuide: fallback,
      series: pvRelationSeriesFixture({ current, pending, history: [history] }),
    });

    expect(guides).toHaveLength(2);
    expect(guides[0]).toMatchObject({
      generationId: "parameter-epoch-1",
      generationAge: 0,
      opacityMultiplier: 0.55,
      maximumPointCount: 7,
    });
    expect(guides[1]).toMatchObject({
      generationId: "parameter-epoch-0",
      generationAge: 1,
      opacityMultiplier: 0.3,
      sourceRole: "history",
    });
  });

  it("withholds default PV boundary curves until two usable endpoints exist", () => {
    const fallback = buildScientificPvBoundaryGuideV1(
      textbookPvSeriesFixture("absolute"),
    )!;
    const resultV2 = pvRelationResultFixture({ fitStatus: "accepted" });

    const noEndpointGuides = scientificPvProgressiveBoundaryGuidesForScenarioV1({
      fallbackGuide: fallback,
      series: pvRelationSeriesFixture({ current: null }),
    });
    expect(noEndpointGuides).toHaveLength(1);
    expect(noEndpointGuides[0]).toMatchObject({
      espvr: [],
      edpvr: [],
    });
    expect(
      scientificPvBoundaryGuidePresentationInputsV1(noEndpointGuides)[0]!
        .current!.renderable,
    ).toBe(false);

    const completeResearch = pvRelationResearchResultFixture(resultV2);
    const oneEndpoint = Object.freeze({
      ...completeResearch,
      beats: Object.freeze(completeResearch.beats.slice(0, 1)),
    }) as MainWireScientificPvRelationsProtocolResultV3;
    const onePointGuides = scientificPvProgressiveBoundaryGuidesForScenarioV1({
      fallbackGuide: fallback,
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture(
          "parameter-epoch-1",
          resultV2,
          "running",
          oneEndpoint,
        ),
      }),
    });
    expect(onePointGuides).toHaveLength(1);
    expect(onePointGuides[0]).toMatchObject({
      espvr: [],
      edpvr: [],
    });
    expect(
      scientificPvBoundaryGuidePresentationInputsV1(onePointGuides)[0]!
        .current!.renderable,
    ).toBe(false);

    const twoEndpoints = Object.freeze({
      ...completeResearch,
      beats: Object.freeze(completeResearch.beats.slice(0, 2)),
    }) as MainWireScientificPvRelationsProtocolResultV3;
    const twoPointGuides = scientificPvProgressiveBoundaryGuidesForScenarioV1({
      fallbackGuide: fallback,
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture(
          "parameter-epoch-1",
          resultV2,
          "running",
          twoEndpoints,
        ),
      }),
    });
    expect(twoPointGuides).toHaveLength(1);
    expect(twoPointGuides[0]!.espvr.length).toBeGreaterThanOrEqual(2);
    expect(twoPointGuides[0]!.edpvr).toEqual([]);
    expect(
      scientificPvBoundaryGuidePresentationInputsV1(twoPointGuides)[0]!
        .current!.renderable,
    ).toBe(true);
  });

  it("builds immediate textbook boundaries through the current LV contacts", () => {
    const guide = buildScientificPvBoundaryGuideV1(
      textbookPvSeriesFixture("absolute"),
    )!;

    expect(guide.semantics)
      .toBe("single-beat-orientation-guide-not-load-series-fit");
    expect(guide.endSystolicContact).toEqual({
      volumeMl: 65,
      pressureMmHg: 104,
    });
    expect(guide.espvr[0]).toEqual({ volumeMl: 0, pressureMmHg: 4 });
    expect(guide.espvr).toContainEqual(guide.endSystolicContact);
    expect(guide.endDiastolicContact).toEqual({
      volumeMl: 150,
      pressureMmHg: 12,
    });
    expect(guide.edpvr).toContainEqual(guide.endDiastolicContact);
    expect(nonDecreasing(guide.edpvr.map(({ pressureMmHg }) =>
      pressureMmHg))).toBe(true);
    const v0 = 150 * (0.6 - 0.006 * 8);
    const v30 = v0 + (150 - v0) / Math.pow(8 / 28.2, 1 / 2.79);
    for (const point of guide.edpvr.filter(({ volumeMl }) => volumeMl >= v0)) {
      const expected = 4 + 28.2 * Math.pow(
        (point.volumeMl - v0) / (v30 - v0),
        2.79,
      );
      expect(point.pressureMmHg).toBeCloseTo(expected, 9);
    }
  });

  it("keeps transmural offsets and multi-scenario textbook guides isolated", () => {
    const transmural = buildScientificPvBoundaryGuideV1(
      textbookPvSeriesFixture("transmural", "transmural"),
    )!;
    const guides = buildScientificPvBoundaryGuidesV1([
      textbookPvSeriesFixture("absolute", "scenario-a"),
      {
        ...textbookPvSeriesFixture("absolute", "scenario-rv"),
        volumeObservableId: "hemodynamics.volume.RV" as const,
      },
      textbookPvSeriesFixture("absolute", "scenario-b"),
    ]);

    expect(transmural.endSystolicContact.pressureMmHg).toBe(100);
    expect(transmural.endDiastolicContact.pressureMmHg).toBe(8);
    expect(transmural.espvr[0]!.pressureMmHg).toBe(0);
    expect(guides.map(({ scenarioId }) => scenarioId))
      .toEqual(["scenario-a", "scenario-b"]);
  });

  it("fails closed for a Klotz guide outside its supported filling-pressure range", () => {
    const fixture = textbookPvSeriesFixture("transmural", "high-edp");
    const highEdpFrames = fixture.scenario.periodicCycleFrames!.map((frame) =>
      frame.acceptedTimeSec === 0 || frame.acceptedTimeSec === 1
        ? textbookPvFrameFixture(frame.acceptedTimeSec, 150, 35, 31)
        : frame);
    const guide = buildScientificPvBoundaryGuideV1({
      ...fixture,
      scenario: {
        ...fixture.scenario,
        frames: highEdpFrames,
        periodicCycleFrames: highEdpFrames,
      },
    })!;

    expect(guide.espvr.length).toBeGreaterThan(1);
    expect(guide.edpvr).toEqual([]);
  });

  it("rejects non-LV pressure pairings and incomplete cycle fallbacks", () => {
    const fixture = textbookPvSeriesFixture("absolute", "guarded");
    expect(buildScientificPvBoundaryGuideV1({
      ...fixture,
      pressureObservableId:
        "hemodynamics.pressure.absolute.Ao" as MainWireScientificObservableIdV1,
    })).toBeNull();

    expect(buildScientificPvBoundaryGuideV1({
      ...fixture,
      scenario: {
        ...fixture.scenario,
        frames: fixture.scenario.frames.slice(0, 3),
        guideCycleFrames: null,
        periodicCycleFrames: null,
      },
    })).toBeNull();
  });

  it("prefers the mitral-closure event over a later non-monotone volume maximum", () => {
    const fixture = textbookPvSeriesFixture("absolute", "event-ed");
    const eventFrames = [
      textbookPvFrameFixture(0, 140, 10, 6, { MV: 18, AoV: 0 }),
      textbookPvFrameFixture(0.2, 148, 12, 8, { MV: 0, AoV: 0 }),
      textbookPvFrameFixture(0.4, 151, 15, 11, { MV: 0, AoV: 20 }),
      textbookPvFrameFixture(0.6, 65, 104, 100, { MV: 0, AoV: 0 }),
      textbookPvFrameFixture(0.8, 100, 8, 4, { MV: 22, AoV: 0 }),
      textbookPvFrameFixture(1, 140, 10, 6, { MV: 18, AoV: 0 }),
    ];
    const guide = buildScientificPvBoundaryGuideV1({
      ...fixture,
      scenario: {
        ...fixture.scenario,
        frames: eventFrames,
        periodicCycleFrames: eventFrames,
      },
    })!;

    expect(guide.endDiastolicContact).toEqual({
      volumeMl: 148,
      pressureMmHg: 12,
    });
  });

  it("starts nonnegative waveform and PV axes at zero without below-zero padding", () => {
    const pressureDomain = scientificChartDomainV1([5, 80, 120]);
    const volumeDomain = scientificChartDomainV1([40, 90, 160]);

    expect(pressureDomain[0]).toBe(0);
    expect(pressureDomain[1]).toBeCloseTo(129.6, 12);
    expect(volumeDomain[0]).toBe(0);
    expect(volumeDomain[1]).toBeCloseTo(172.8, 12);
    expect(scientificChartDomainV1([0, 0])).toEqual([0, 1]);
  });

  it("retains a negative lower domain only when observed data require it", () => {
    const crossingZero = scientificChartDomainV1([-4, 0, 12]);
    const negativeOnly = scientificChartDomainV1([-8, -4]);

    expect(crossingZero[0]).toBeLessThan(-4);
    expect(crossingZero[1]).toBeGreaterThan(12);
    expect(negativeOnly[0]).toBeLessThan(-8);
    expect(negativeOnly[1]).toBeGreaterThan(-4);
    expect(scientificChartDomainV1([Number.NaN, Number.POSITIVE_INFINITY]))
      .toEqual([0, 1]);
  });

  it("reserves measured top space only for the default legend position", () => {
    expect(scientificChartPlotTopV1(0, true)).toBe(24);
    expect(scientificChartPlotTopV1(36, true)).toBe(52);
    expect(scientificChartPlotTopV1(36, false)).toBe(24);
    expect(scientificChartPlotTopV1(Number.NaN, true)).toBe(24);
  });

  it("reserves a readable responsive gutter for y ticks and the vertical title", () => {
    const wide = scientificChartPlotRectV1(1_120, 720, 72);
    const compact = scientificChartPlotRectV1(280, 320);
    const wideLabels = scientificChartAxisLabelPositionsV1(wide, 720);
    const compactLabels = scientificChartAxisLabelPositionsV1(compact, 320);

    expect(wide.left).toBe(64);
    expect(compact.left).toBe(58);
    expect(wideLabels.yTitle.x).toBe(22);
    expect(compactLabels.yTitle.x).toBe(18);
    expect(wideLabels.yTitle.y).toBe((wide.top + wide.bottom) / 2);
    expect(wideLabels.xTitle.x).toBe((wide.left + wide.right) / 2);
    expect(wideLabels.yTitle.x).toBeGreaterThan(13);
    expect(wide.left - wideLabels.yTitle.x).toBeGreaterThanOrEqual(42);
  });

  it("renders a compact same-scenario legend without repeating the model name", () => {
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkbenchChartLegendV1,
      {
        entries: [
          {
            key: "healthy-aop",
            color: "#38bdf8",
            modelName: "Healthy periodic baseline",
            signalName: "AoP",
          },
          {
            key: "healthy-lvp",
            color: "#60a5fa",
            modelName: "Healthy periodic baseline",
            signalName: "LVP",
          },
        ],
        interaction: {
          panelId: "lv-pv",
          interactive: true,
          onOpenSettings: () => undefined,
          onLegendPositionChange: () => undefined,
        },
      },
    ));

    expect(html).toContain("gap-x-2");
    expect(html).toContain("gap-y-0.5");
    expect(html).toContain("px-1.5");
    expect(html).toContain("py-1");
    expect(html).toContain("tracking-normal");
    expect(html).toContain('role="button"');
    expect(html).toContain('data-legend-placement="default"');
    expect(html).toContain("AoP");
    expect(html).toContain("LVP");
    expect(html).toContain('aria-label="Healthy periodic baseline, AoP"');
    expect(html).not.toContain(">Healthy periodic baseline");
  });

  it("keeps model names when multiple scenarios share a chart", () => {
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkbenchChartLegendV1,
      {
        entries: [
          {
            key: "healthy-lv",
            color: "#38bdf8",
            modelName: "Healthy",
            signalName: "LV",
          },
          {
            key: "as-lv",
            color: "#fbbf24",
            modelName: "Aortic stenosis",
            signalName: "LV",
          },
        ],
      },
    ));

    expect(html).toContain("Healthy · LV");
    expect(html).toContain("Aortic stenosis · LV");
  });

  it("keeps ESPVR and EDPVR out of the visual legend", () => {
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkbenchChartLegendV1,
      {
        entries: [
          {
            key: "healthy-lv",
            color: "#38bdf8",
            modelName: "Healthy",
            signalName: "LV",
          },
        ],
      },
    ));

    expect(html).toContain("LV");
    expect(html).not.toContain("ESPVR");
    expect(html).not.toContain("EDPVR");
  });

  it("uses the observed endpoint envelope when a standard-mode formal fit is rejected", () => {
    const result = pvRelationResultFixture({ fitStatus: "rejected" });
    const overlays = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture("generation-current", result),
      }),
      displayMode: "standard",
      pressureBasis: "intracavitary",
      showSamplePoints: false,
      historyCount: 5,
    });

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      status: "limited",
      pressureBasis: "intracavitary",
    });
    expect(overlays[0]!.espvr).toEqual(
      [...result.beats]
        .map(({ endSystolic }) => Object.freeze({
          volumeMl: endSystolic!.volumeMl,
          pressureMmHg: endSystolic!.absolutePressureMmHg,
        }))
        .sort((left, right) => left.volumeMl - right.volumeMl),
    );
    expect(overlays[0]!.edpvr).toEqual(
      [...result.beats]
        .map(({ endDiastolic }) => Object.freeze({
          volumeMl: endDiastolic!.volumeMl,
          pressureMmHg: endDiastolic!.absolutePressureMmHg,
        }))
        .sort((left, right) => left.volumeMl - right.volumeMl),
    );
    expect(overlays[0]!.espvr).toHaveLength(result.beats.length);
    expect(Math.max(...overlays[0]!.espvr.map(({ pressureMmHg }) =>
      pressureMmHg))).toBeLessThan(200);
    expect(overlays[0]!.endSystolicSamples).toBeUndefined();

    const withoutFormalFit = pvRelationResultFixture({
      fitStatus: "rejected",
      includeFormalFit: false,
    });
    const [observedOnly] = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture(
          "generation-without-fit",
          withoutFormalFit,
        ),
      }),
      displayMode: "standard",
      pressureBasis: "intracavitary",
      showSamplePoints: false,
      historyCount: 0,
    });
    expect(observedOnly).toMatchObject({ status: "limited" });
    expect(observedOnly!.espvr).toHaveLength(withoutFormalFit.beats.length);
    expect(observedOnly!.edpvr).toHaveLength(withoutFormalFit.beats.length);
  });

  it("exposes the rejected formal relation and endpoint samples in research mode", () => {
    const result = pvRelationResultFixture({ fitStatus: "rejected" });
    const [overlay] = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture("generation-current", result),
      }),
      displayMode: "research",
      pressureBasis: "transmural",
      showSamplePoints: true,
      historyCount: 5,
    });

    expect(overlay).toBeDefined();
    expect(overlay!.status).toBe("limited");
    expect(overlay!.espvr).toHaveLength(48);
    expect(Math.min(...overlay!.espvr.map(({ pressureMmHg }) =>
      pressureMmHg))).toBeGreaterThan(500);
    expect(overlay!.endSystolicSamples).toHaveLength(result.beats.length);
    expect(overlay!.endDiastolicSamples).toHaveLength(result.beats.length);
    expect(overlay!.endSystolicSamples).toEqual(
      result.beats.map(({ endSystolic }) => Object.freeze({
        volumeMl: endSystolic!.volumeMl,
        pressureMmHg: endSystolic!.transmuralPressureMmHg,
      })),
    );
  });

  it("keeps V3 higher-loading observations separate from the V2 formal fit", () => {
    const compatibility = pvRelationResultFixture({ fitStatus: "accepted" });
    const research = pvRelationResearchResultFixture(compatibility);
    const [overlay] = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture(
          "generation-bidirectional",
          compatibility,
          "complete",
          research,
        ),
      }),
      displayMode: "standard",
      pressureBasis: "transmural",
      showSamplePoints: false,
      historyCount: 0,
    });

    expect(overlay).toMatchObject({
      status: "limited",
      higherLoadingQuality: "limited",
    });
    expect(overlay!.higherLoadingEndSystolicObserved).toHaveLength(4);
    expect(overlay!.higherLoadingEndDiastolicObserved).toHaveLength(4);
    expect(overlay!.higherLoadingEndDiastolicObserved!.map(({ volumeMl }) =>
      volumeMl)).toEqual([150, 154, 158, 162]);
    expect(overlay!.domainAnchorPoints).toEqual(expect.arrayContaining(
      [...overlay!.higherLoadingEndSystolicObserved!],
    ));
    // The compatibility formal curve remains V2-only; V3 observations are
    // carried in distinct fields and therefore cannot be pooled into the fit.
    expect(overlay!.espvr).toHaveLength(48);
  });

  it("retains current and historical parameter generations while a replacement is pending", () => {
    const current = pvRelationGenerationFixture(
      "parameter-epoch-2",
      pvRelationResultFixture({ fitStatus: "accepted", externalPressureMmHg: 5 }),
    );
    const historical = pvRelationGenerationFixture(
      "parameter-epoch-1",
      pvRelationResultFixture({ fitStatus: "accepted", externalPressureMmHg: 4 }),
    );
    const pending = pvRelationGenerationFixture(
      "parameter-epoch-3",
      null,
      "running",
    );
    const overlays = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({ current, pending, history: [historical] }),
      displayMode: "standard",
      pressureBasis: "intracavitary",
      showSamplePoints: false,
      historyCount: 5,
    });

    expect(overlays.map(({ key }) => key)).toEqual([
      "healthy:parameter-epoch-3:pending",
      "healthy:parameter-epoch-2",
      "healthy:parameter-epoch-1",
    ]);
    expect(overlays[0]).toMatchObject({ status: "running", espvr: [] });
    expect(overlays[0]).toMatchObject({
      generationSequence: 1,
      generationRole: "pending",
      targetPreview: false,
    });
    expect(overlays[1]!.espvr.length).toBeGreaterThan(1);
    expect(overlays[1]!.generationAge).toBe(1);
    expect(overlays[1]!.generationRole).toBe("current");
    expect(overlays[2]!.espvr.length).toBeGreaterThan(1);
    expect(overlays[2]!.generationAge).toBe(2);
    expect(overlays[2]!.generationRole).toBe("history");
    expect(scientificPvRelationDomainPointsV1(overlays)).toEqual([
      ...overlays[1]!.espvr,
      ...overlays[1]!.edpvr,
      ...overlays[1]!.domainAnchorPoints!,
    ]);
  });

  it("marks an independently calculated pending generation as a target preview", () => {
    const pending = pvRelationGenerationFixture(
      "parameter-epoch-4",
      null,
      "running",
    );
    const targetPreview = Object.freeze({
      ...pending,
      sequence: 7,
      source: Object.freeze({
        ...pending.source,
        sourceIdentity: Object.freeze({
          ...pending.source.sourceIdentity,
          calculationSource:
            "independent-case-source-warm-continuation" as const,
        }),
      }),
    });
    const [overlay] = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({ pending: targetPreview }),
      displayMode: "standard",
      pressureBasis: "intracavitary",
      showSamplePoints: false,
      historyCount: 5,
    });

    expect(overlay).toMatchObject({
      generationSequence: 7,
      generationRole: "pending",
      targetPreview: true,
    });
  });

  it("reports limited relations independently from the visual legend", () => {
    const [overlay] = scientificPvRelationOverlaysForScenarioV1({
      scenarioId: "healthy",
      scenarioName: "Healthy",
      color: "#38bdf8",
      series: pvRelationSeriesFixture({
        current: pvRelationGenerationFixture(
          "generation-limited",
          pvRelationResultFixture({ fitStatus: "rejected" }),
        ),
      }),
      displayMode: "standard",
      pressureBasis: "intracavitary",
      showSamplePoints: false,
      historyCount: 0,
    });

    expect(scientificPvRelationQualityNoticesV1([overlay!])).toEqual([
      expect.objectContaining({
        scenarioName: "Healthy",
        relation: "ESPVR",
        quality: "limited",
      }),
      expect.objectContaining({
        scenarioName: "Healthy",
        relation: "EDPVR",
        quality: "limited",
      }),
    ]);
  });

  it("keeps overlay volumes aligned while mapping transmural to intracavitary pressure", () => {
    const externalPressureMmHg = 5;
    const result = pvRelationResultFixture({
      fitStatus: "accepted",
      externalPressureMmHg,
    });
    const series = pvRelationSeriesFixture({
      current: pvRelationGenerationFixture("generation-current", result),
    });
    const shared = {
      scenarioId: "healthy",
      color: "#38bdf8",
      series,
      displayMode: "standard" as const,
      showSamplePoints: true,
      historyCount: 0,
    };
    const [transmural] = scientificPvRelationOverlaysForScenarioV1({
      ...shared,
      pressureBasis: "transmural",
    });
    const [intracavitary] = scientificPvRelationOverlaysForScenarioV1({
      ...shared,
      pressureBasis: "intracavitary",
    });

    expect(transmural).toBeDefined();
    expect(intracavitary).toBeDefined();
    expect(intracavitary!.espvr.map(({ volumeMl }) => volumeMl)).toEqual(
      transmural!.espvr.map(({ volumeMl }) => volumeMl),
    );
    intracavitary!.espvr.forEach((point, index) => {
      expect(point.pressureMmHg - transmural!.espvr[index]!.pressureMmHg)
        .toBeCloseTo(externalPressureMmHg);
    });
    intracavitary!.edpvr.forEach((point, index) => {
      expect(point.pressureMmHg - transmural!.edpvr[index]!.pressureMmHg)
        .toBeCloseTo(externalPressureMmHg);
    });
    intracavitary!.endSystolicSamples!.forEach((point, index) => {
      expect(
        point.pressureMmHg
        - transmural!.endSystolicSamples![index]!.pressureMmHg,
      ).toBeCloseTo(externalPressureMmHg);
    });
  });
});

type PvRelationGenerationFixture = NonNullable<
  ScientificProductPvRelationProtocolSeriesV1["current"]
>;

function pvRelationSeriesFixture(input: Readonly<{
  current?: PvRelationGenerationFixture | null;
  pending?: PvRelationGenerationFixture | null;
  history?: readonly PvRelationGenerationFixture[];
}>): ScientificProductPvRelationProtocolSeriesV1 {
  return Object.freeze({
    current: input.current ?? null,
    pending: input.pending ?? null,
    history: Object.freeze([...(input.history ?? [])]),
    lastFailure: null,
  });
}

function pvRelationGenerationFixture(
  generationId: string,
  result: MainWireScientificPvRelationsProtocolResultV2 | null,
  status: "running" | "complete" = "complete",
  researchResultV3: MainWireScientificPvRelationsProtocolResultV3 | null = null,
): PvRelationGenerationFixture {
  const presentation: ScientificProductPvRelationProtocolPresentationV1 =
    Object.freeze({
      kind: "pv-relations",
      status,
      calculationSource: "visible-period1-source",
      sourceIdentity: null,
      result,
      researchResultV3,
      jobSnapshot: null,
      errorMessage: null,
    });
  return Object.freeze({
    generationId,
    source: Object.freeze({
      sourceIdentityKey: generationId,
      sourceIdentity: Object.freeze({
        revision: 1,
        acceptedTimeSec: 1,
        totalBloodVolumeMl: 5_522.11,
        parameterEpoch: Number(generationId.match(/\d+/)?.[0] ?? 0),
        controlStateSha256: generationId,
        calculationSource: "visible-period1-source" as const,
      }),
      jobId: `job-${generationId}`,
    }),
    sequence: 1,
    status,
    snapshot: result === null ? null : presentation,
    renderable: result !== null,
  });
}

function pvRelationResearchResultFixture(
  compatibilityResultV2: MainWireScientificPvRelationsProtocolResultV2,
): MainWireScientificPvRelationsProtocolResultV3 {
  const externalPressureMmHg = 5;
  const higherBeats = Object.freeze(Array.from({ length: 4 }, (_, beatIndex) => {
    const base = pvRelationBeatFixture(0, externalPressureMmHg);
    return Object.freeze({
      ...base,
      beatId: `higher-beat-${beatIndex}`,
      beatIndex,
      lane: "higher-loading" as const,
      role: beatIndex === 0 ? "baseline" as const : "higher-loading" as const,
      endpointMethod: "end-of-forward-aortic-ejection" as const,
      endDiastolic: pvRelationEndpointFixture(
        150 + beatIndex * 4,
        12 + beatIndex,
        externalPressureMmHg,
      ),
      endSystolic: pvRelationEndpointFixture(
        95 + beatIndex * 3,
        115 + beatIndex * 2,
        externalPressureMmHg,
      ),
    }) as MainWireScientificPvRelationBeatV3;
  }));
  return Object.freeze({
    protocolId: "main-wire-scientific-pv-relations-protocol-v3",
    policy: Object.freeze({
      lowerLoading: compatibilityResultV2.policy,
      higherLoading: Object.freeze({
        ...compatibilityResultV2.policy,
        minimumVcRaResistanceScale: 0.5,
      }),
    }),
    beats: higherBeats,
    lanes: Object.freeze({
      higherLoading: Object.freeze({
        acquisitionStatus: "rejected",
        achievedDeclaredEdvDirection: true,
        beats: higherBeats,
        fitPointSelection: Object.freeze({
          includedBeatIds: Object.freeze(higherBeats.map(({ beatId }) => beatId)),
        }),
      }),
    }),
    compatibilityResultV2,
  }) as unknown as MainWireScientificPvRelationsProtocolResultV3;
}

function pvRelationResultFixture(input: Readonly<{
  fitStatus: "accepted" | "rejected";
  externalPressureMmHg?: number;
  includeFormalFit?: boolean;
}>): MainWireScientificPvRelationsProtocolResultV2 {
  const externalPressureMmHg = input.externalPressureMmHg ?? 5;
  const includeFormalFit = input.includeFormalFit ?? true;
  const beats = Object.freeze(Array.from({ length: 6 }, (_, beatIndex) =>
    pvRelationBeatFixture(beatIndex, externalPressureMmHg)));
  const includedBeatIds = Object.freeze(beats.map(({ beatIndex }) =>
    `ivc-beat-${beatIndex}`));
  const analysis = Object.freeze({
    espvr: Object.freeze({
      status: input.fitStatus,
      fit: includeFormalFit
        ? Object.freeze({
            endSystolicElastanceMmHgPerMl: 10,
            volumeAxisInterceptMl: 0,
          })
        : null,
    }),
    quadraticEspvrSensitivity: null,
    edpvr: Object.freeze({
      status: input.fitStatus,
      fit: includeFormalFit
        ? Object.freeze({
            referenceVolumeMl: 80,
            referencePressureMmHg: 0,
            alphaMmHg: 2,
            betaPerMl: 0.03,
          })
        : null,
    }),
    overallStatus: input.fitStatus,
  }) as MainWireScientificLvPressureVolumeAnalysisV1;
  return Object.freeze({
    protocolId: "main-wire-scientific-pv-relations-protocol-v2",
    protocolVersion: "2.0.0",
    policy: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
    beats,
    fitPointSelection: Object.freeze({
      policy:
        "baseline-plus-monotonic-EDV-reduction-with-configured-minimum-separation",
      minimumEndDiastolicVolumeSeparationMl: 0.5,
      includedBeatIds,
      excludedRedundantBeatIds: Object.freeze([]),
    }),
    analysis,
    failureReason: null,
  }) as unknown as MainWireScientificPvRelationsProtocolResultV2;
}

function pvRelationBeatFixture(
  beatIndex: number,
  externalPressureMmHg: number,
): MainWireScientificPvRelationBeatV2 {
  const endDiastolicVolumeMl = 150 - beatIndex * 5;
  const endSystolicVolumeMl = 95 - beatIndex * 5;
  return Object.freeze({
    beatIndex,
    role: beatIndex === 0 ? "baseline" : "preload-reduction",
    vcRaResistanceScaleStart: Math.max(1, beatIndex),
    vcRaResistanceScaleEnd: Math.max(1, beatIndex + 1),
    resistanceScaleAtEndDiastole: Math.max(1, beatIndex + 1),
    resistanceScaleAtEndSystole: Math.max(1, beatIndex + 1),
    interventionRampCompletedBeforeEndDiastole: true,
    fixedTotalBloodVolumeMl: 5_522.11,
    samples: Object.freeze([]),
    endDiastolic: pvRelationEndpointFixture(
      endDiastolicVolumeMl,
      12 - beatIndex * 1.25,
      externalPressureMmHg,
    ),
    endSystolic: pvRelationEndpointFixture(
      endSystolicVolumeMl,
      115 - beatIndex * 5,
      externalPressureMmHg,
    ),
    strokeWorkTransmuralMmHgMl: 8_000 - beatIndex * 500,
    meanRapTransmuralMmHg: 5,
    meanLapTransmuralMmHg: 10,
    netCardiacOutputLMin: 5,
    totalBloodVolumeAbsoluteErrorMl: 0,
    maximumContinuityAbsoluteResidualMl: 0,
    classification: "fit-eligible",
    valid: true,
    rejectionReason: null,
  });
}

function pvRelationEndpointFixture(
  volumeMl: number,
  transmuralPressureMmHg: number,
  externalPressureMmHg: number,
) {
  return Object.freeze({
    sampleIndex: 0,
    phase01: 0,
    volumeMl,
    absolutePressureMmHg: transmuralPressureMmHg + externalPressureMmHg,
    transmuralPressureMmHg,
    externalPressureMmHg,
  });
}

function textbookPvSeriesFixture(
  basis: "absolute" | "transmural",
  scenarioId = "scenario-a",
) {
  const frames = [
    textbookPvFrameFixture(0, 150, 12, 8),
    textbookPvFrameFixture(0.15, 140, 84, 80),
    textbookPvFrameFixture(0.3, 100, 124, 120),
    textbookPvFrameFixture(0.45, 65, 104, 100),
    textbookPvFrameFixture(0.6, 65, 44, 40),
    textbookPvFrameFixture(0.8, 105, 9, 5),
    textbookPvFrameFixture(1, 150, 12, 8),
  ];
  return Object.freeze({
    key: `${scenarioId}:lv`,
    color: "#2dd4bf",
    volumeObservableId: "hemodynamics.volume.LV" as const,
    pressureObservableId: basis === "transmural"
      ? "hemodynamics.pressure.transmural.LV" as const
      : "hemodynamics.pressure.absolute.LV" as const,
    scenario: Object.freeze({
      id: scenarioId,
      frames,
      periodicCycleFrames: frames,
      cycleDurationSec: 1,
    }),
  });
}

function textbookPvFrameFixture(
  acceptedTimeSec: number,
  volumeMl: number,
  absolutePressureMmHg: number,
  transmuralPressureMmHg: number,
  valveFlows?: Readonly<{ MV: number; AoV: number }>,
): MainWireScientificObservableFrameV1 {
  const value = (
    observableId: MainWireScientificObservableIdV1,
    candidate: number,
  ) => Object.freeze({
    observableId,
    value: candidate,
    availability: "available" as const,
    quality: "authoritative-state" as const,
  });
  return {
    acceptedTimeSec,
    values: {
      "hemodynamics.volume.LV": value(
        "hemodynamics.volume.LV",
        volumeMl,
      ),
      "hemodynamics.pressure.absolute.LV": value(
        "hemodynamics.pressure.absolute.LV",
        absolutePressureMmHg,
      ),
      "hemodynamics.pressure.transmural.LV": value(
        "hemodynamics.pressure.transmural.LV",
        transmuralPressureMmHg,
      ),
      ...(valveFlows === undefined ? {} : {
        "valve.MV.flow": value("valve.MV.flow", valveFlows.MV),
        "valve.AoV.flow": value("valve.AoV.flow", valveFlows.AoV),
      }),
    },
  } as unknown as MainWireScientificObservableFrameV1;
}

function nonDecreasing(values: readonly number[]): boolean {
  return values.slice(1).every((value, index) => value >= values[index]! - 1e-9);
}
