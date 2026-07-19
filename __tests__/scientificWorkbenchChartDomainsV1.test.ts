import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificWorkbenchChartLegendV1,
  scientificChartDomainV1,
  scientificChartPlotTopV1,
} from "@/components/scientificProduct/ScientificWorkbenchAnimatedChartsV1";

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
});
