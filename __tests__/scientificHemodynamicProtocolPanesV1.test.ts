import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificGuytonStarlingPaneV1,
  scientificGuytonAxisLabelsV1,
  scientificProtocolAxisDomainV1,
  scientificSvgPathV1,
  type ScientificGuytonStarlingPaneDataV1,
} from "@/components/scientificProduct/ScientificHemodynamicProtocolPanesV1";

const completeStatus = Object.freeze({
  status: "complete" as const,
  label: "Protocol complete",
  qc: Object.freeze({
    level: "pass" as const,
    summary: "P1 span and recovery accepted",
  }),
});

describe("scientific hemodynamic protocol panes V1", () => {
  it("keeps the clinically familiar Guyton pressure names explicitly transmural", () => {
    expect(scientificGuytonAxisLabelsV1("right")).toEqual({
      x: "Mean transmural RAP / CVP (mmHg)",
      xLong: "CVP is the cycle-mean transmural right-atrial pressure",
    });
    expect(scientificGuytonAxisLabelsV1("left")).toEqual({
      x: "Mean transmural LAP / PCWP surrogate (mmHg)",
      xLong: "PCWP surrogate is the cycle-mean transmural left-atrial pressure",
    });
  });

  it("renders P1, P2 and rejected sweep points without conflating their fit eligibility", () => {
    const data: ScientificGuytonStarlingPaneDataV1 = {
      side: "left",
      vascularReturnCurve: [
        { pressureMmHg: 2, flowLPerMin: 7 },
        { pressureMmHg: 14, flowLPerMin: 2 },
      ],
      cardiacPreloadLocus: [
        { pressureMmHg: 5, flowLPerMin: 3.5 },
        { pressureMmHg: 8, flowLPerMin: 4.8 },
        { pressureMmHg: 12, flowLPerMin: 6 },
      ],
      cardiacPreloadSegments: [[
        { pressureMmHg: 5, flowLPerMin: 3.5 },
        { pressureMmHg: 8, flowLPerMin: 4.8 },
      ], [
        { pressureMmHg: 8, flowLPerMin: 4.8 },
        { pressureMmHg: 12, flowLPerMin: 6 },
      ]],
      estimatedCardiacSegments: [[
        { pressureMmHg: 3, flowLPerMin: 2.5 },
        { pressureMmHg: 5, flowLPerMin: 3.4 },
        { pressureMmHg: 9, flowLPerMin: 5.1 },
      ]],
      sweepPoints: [
        { id: "estimate", pressureMmHg: 5, flowLPerMin: 3.4, classification: "estimated" },
        { id: "finite-hold", pressureMmHg: 3, flowLPerMin: 2.5, classification: "unclassified" },
        { id: "low", pressureMmHg: 5, flowLPerMin: 3.5, classification: "period1" },
        { id: "audit", pressureMmHg: 8, flowLPerMin: 4.8, classification: "audit-suspect", reason: "path dependence" },
        { id: "p2", pressureMmHg: 7, flowLPerMin: 4, classification: "period2", reason: "alternans" },
        { id: "bad", pressureMmHg: 3, flowLPerMin: 2, classification: "rejected", reason: "step failure" },
      ],
      operatingPoint: { pressureMmHg: 9, flowLPerMin: 5.2 },
      status: completeStatus,
    };

    const html = renderToStaticMarkup(React.createElement(
      ScientificGuytonStarlingPaneV1,
      { data },
    ));

    expect(html).toContain("PCWP (mmHg)");
    expect(html).toContain('data-point-classification="period1"');
    expect(html).toContain('data-point-classification="estimated"');
    expect(html).toContain('data-point-classification="unclassified"');
    expect(html).toContain('data-point-classification="audit-suspect"');
    expect(html).toContain('data-point-classification="period2"');
    expect(html).toContain('data-point-classification="rejected"');
    expect(html).toContain("Alternating response · excluded");
    const settledPaths = html.match(/<path[^>]*data-series="cardiac-preload-locus"[^>]*>/g) ?? [];
    const rapidPaths = html.match(/<path[^>]*data-series="rapid-finite-hold-preview"[^>]*>/g) ?? [];
    const settledPathMarkup = settledPaths.join("");
    expect(settledPaths).toHaveLength(2);
    expect(settledPathMarkup).not.toContain("stroke-dasharray");
    expect(rapidPaths).toHaveLength(1);
    expect(rapidPaths[0]).not.toContain("stroke-dasharray");
    expect(rapidPaths[0]).toContain('data-evidence="estimated"');
    expect(html).toContain("Estimated response");
  });

  it("builds stable zero-aware domains and refuses a one-point SVG path", () => {
    const nonnegative = scientificProtocolAxisDomainV1(
      [80, 120],
      { includeZero: true, lowerBoundZeroWhenNonnegative: true },
    );
    expect(nonnegative[0]).toBe(0);
    expect(nonnegative[1]).toBeGreaterThan(120);
    expect(scientificSvgPathV1([{ x: 1, y: 2 }])).toBeNull();
    expect(scientificSvgPathV1([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M1,2 L3,4");
  });

});
