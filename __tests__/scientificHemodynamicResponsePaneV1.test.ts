import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificCardiacOutputFillingPressurePaneV1,
  scientificCardiacOutputFillingPressureTitleV1,
  scientificProtocolAxisDomainV1,
  type ScientificCardiacOutputFillingPressurePaneDataV1,
  type ScientificHemodynamicResponseGenerationV1,
} from "@/components/scientificProduct/ScientificHemodynamicProtocolPanesV1";
import {
  scientificQuickResponseQualityV1,
} from "@/components/scientificProduct/ScientificWorkbenchRuntimeRendererV1";

const status = Object.freeze({
  status: "complete" as const,
  label: "Ready",
  qc: Object.freeze({ level: "pass" as const, summary: "Accepted" }),
});

function generation(id: string, shift = 0): ScientificHemodynamicResponseGenerationV1 {
  return Object.freeze({
    id,
    vascularReturnCurve: Object.freeze([
      { pressureMmHg: -2, flowLPerMin: 7 + shift },
      { pressureMmHg: 12, flowLPerMin: 2 + shift },
    ]),
    estimatedCardiacSegments: Object.freeze([Object.freeze([
      { pressureMmHg: 2, flowLPerMin: 2.5 + shift },
      { pressureMmHg: 10, flowLPerMin: 6 + shift },
    ])]),
    settledCardiacSegments: Object.freeze([Object.freeze([
      { pressureMmHg: 2, flowLPerMin: 2.7 + shift },
      { pressureMmHg: 10, flowLPerMin: 6.2 + shift },
    ])]),
    estimatedPoints: Object.freeze([
      { id: `${id}-estimate`, pressureMmHg: 2, flowLPerMin: 2.5 + shift, classification: "estimated" as const },
    ]),
    settledPoints: Object.freeze([
      { id: `${id}-settled`, pressureMmHg: 10, flowLPerMin: 6.2 + shift, classification: "period1" as const },
    ]),
  });
}

describe("cardiac output and filling pressure pane V1", () => {
  it("keeps provisional short-horizon points distinct from a settled claim", () => {
    expect(scientificQuickResponseQualityV1({
      nearSteadyPointCount: 0,
      provisionalPointCount: 9,
      failureCount: 0,
    })).toEqual({
      status: "partial",
      qcLevel: "warning",
      summary: expect.stringContaining(
        "directional response curve, not a periodic steady-state claim",
      ),
    });
    expect(scientificQuickResponseQualityV1({
      nearSteadyPointCount: 9,
      provisionalPointCount: 0,
      failureCount: 0,
    })).toMatchObject({ status: "complete", qcLevel: "pass" });
  });

  it("uses clinical titles and clips the normal pressure domain at zero", () => {
    expect(scientificCardiacOutputFillingPressureTitleV1("right"))
      .toBe("Right heart: cardiac output & CVP");
    expect(scientificCardiacOutputFillingPressureTitleV1("left"))
      .toBe("Left heart: cardiac output & PCWP");
    expect(scientificProtocolAxisDomainV1([-8, 2, 10], {
      includeZero: true,
      clampLowerBoundZero: true,
    })[0]).toBe(0);
  });

  it("renders one legend row per scenario, solid evidence curves, and five history generations", () => {
    const data: ScientificCardiacOutputFillingPressurePaneDataV1 = {
      side: "left",
      displayMode: "both",
      status,
      scenarios: [{
        id: "healthy",
        name: "Healthy baseline",
        color: "#38bdf8",
        current: generation("current"),
        history: [1, 2, 3, 4, 5, 6].map((index) => generation(`history-${index}`, index / 10)),
        warnings: ["One low-volume point was excluded"],
      }, {
        id: "comparison",
        name: "Comparison",
        color: "#fb923c",
        current: generation("comparison"),
      }],
    };

    const html = renderToStaticMarkup(React.createElement(
      ScientificCardiacOutputFillingPressurePaneV1,
      {
        data,
        legendInteraction: {
          panelId: "left-response",
          interactive: true,
          onOpenSettings: () => undefined,
          onLegendPositionChange: () => undefined,
          legendPosition: { xPct: 0.24, yPct: 0.18 },
          ariaLabel: "Open cardiac output pane settings",
        },
      },
    ));

    expect(html).toContain("Left heart: cardiac output &amp; PCWP");
    expect(html.match(/data-scenario-legend=/g)).toHaveLength(2);
    expect(html).toContain('stroke="#38bdf8"');
    expect(html).toContain('stroke="#fb923c"');
    expect(html).not.toContain("stroke-dasharray=\"5 4\"");
    expect(html).toContain('data-point-evidence="settled"');
    expect(html).toContain('fill="var(--wb-app-bg)"');
    expect(html).toContain('data-generation-id="history-5"');
    expect(html).not.toContain('data-generation-id="history-6"');
    expect(html).toContain("One low-volume point was excluded");
    expect(html).toContain('data-testid="scientific-hemodynamic-scenario-legend-v1"');
    expect(html).toContain('data-legend-placement="custom"');
    expect(html).toContain('role="button"');
    expect(html).toContain('aria-label="Open cardiac output pane settings"');
    expect(html).toContain("cursor-grab");
    expect(html).not.toContain("max-h-[88px]");
  });

  it("honors the ordinary graph legend visibility setting", () => {
    const data: ScientificCardiacOutputFillingPressurePaneDataV1 = {
      side: "right",
      showLegend: false,
      status,
      scenarios: [{
        id: "healthy",
        name: "Healthy baseline",
        color: "#38bdf8",
        current: generation("current"),
      }],
    };

    const html = renderToStaticMarkup(React.createElement(
      ScientificCardiacOutputFillingPressurePaneV1,
      { data },
    ));

    expect(html).not.toContain("scientific-hemodynamic-scenario-legend-v1");
    expect(html).toContain('data-scenario-id="healthy"');
  });
});
