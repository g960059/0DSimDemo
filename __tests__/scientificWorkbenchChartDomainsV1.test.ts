import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificWorkbenchChartLegendV1,
  scientificChartAxisLabelPositionsV1,
  scientificChartDomainV1,
  scientificChartPlotRectV1,
  scientificChartPlotTopV1,
  scientificPvRelationDomainPointsV1,
  scientificPvRelationQualityNoticesV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";
import {
  scientificPvRelationOverlaysForScenarioV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";
import type {
  ScientificProductPvRelationProtocolPresentationV1,
  ScientificProductPvRelationProtocolSeriesV1,
} from "@/components/scientificProduct/ScientificProductScenarioRegistryV1";
import type {
  MainWireScientificLvPressureVolumeAnalysisV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicAnalysisV1";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_POLICY_V2,
  type MainWireScientificPvRelationBeatV2,
  type MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";

describe("scientific Workbench chart domains", () => {
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
    expect(overlays[1]!.espvr.length).toBeGreaterThan(1);
    expect(overlays[1]!.generationAge).toBe(1);
    expect(overlays[2]!.espvr.length).toBeGreaterThan(1);
    expect(overlays[2]!.generationAge).toBe(2);
    expect(scientificPvRelationDomainPointsV1(overlays)).toEqual([
      ...overlays[1]!.espvr,
      ...overlays[1]!.edpvr,
      ...overlays[1]!.domainAnchorPoints!,
    ]);
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
): PvRelationGenerationFixture {
  const presentation: ScientificProductPvRelationProtocolPresentationV1 =
    Object.freeze({
      kind: "pv-relations",
      status,
      calculationSource: "visible-period1-source",
      sourceIdentity: null,
      result,
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
