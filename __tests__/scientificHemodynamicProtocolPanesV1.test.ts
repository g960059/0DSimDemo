import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificGuytonStarlingPaneV1,
  ScientificPvRelationPaneV1,
  scientificGuytonAxisLabelsV1,
  scientificProtocolAxisDomainV1,
  scientificSvgPathV1,
  type ScientificGuytonStarlingPaneDataV1,
  type ScientificPvRelationPaneDataV1,
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
        { pressureMmHg: 12, flowLPerMin: 6 },
      ],
      sweepPoints: [
        { id: "low", pressureMmHg: 5, flowLPerMin: 3.5, classification: "period1" },
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

    expect(html).toContain("Mean transmural LAP / PCWP surrogate (mmHg)");
    expect(html).toContain('data-point-classification="period1"');
    expect(html).toContain('data-point-classification="period2"');
    expect(html).toContain('data-point-classification="rejected"');
    expect(html).toContain("P2 suspect · excluded");
    expect(html).toContain("one-dimensional operating locus");
  });

  it("renders PV relation fits and an explicit reason when a fit is withheld", () => {
    const data: ScientificPvRelationPaneDataV1 = {
      beats: [{
        id: "beat-1",
        classification: "fit-eligible",
        points: [
          { volumeMl: 120, transmuralPressureMmHg: 8 },
          { volumeMl: 55, transmuralPressureMmHg: 110 },
          { volumeMl: 120, transmuralPressureMmHg: 8 },
        ],
        endDiastolic: {
          event: "end-diastole",
          volumeMl: 120,
          transmuralPressureMmHg: 8,
        },
        endSystolic: {
          event: "end-systole",
          volumeMl: 55,
          transmuralPressureMmHg: 110,
        },
      }, {
        id: "beat-2-alternans-suspect",
        classification: "alternans-suspect-high",
        points: [
          { volumeMl: 115, transmuralPressureMmHg: 7 },
          { volumeMl: 53, transmuralPressureMmHg: 108 },
          { volumeMl: 115, transmuralPressureMmHg: 7 },
        ],
        rejectionReason:
          "alternans-suspect during changing-load ramp",
      }],
      espvr: {
        status: "valid",
        linear: {
          points: [
            { volumeMl: 40, transmuralPressureMmHg: 70 },
            { volumeMl: 70, transmuralPressureMmHg: 130 },
          ],
          endSystolicElastanceMmHgPerMl: 2,
          volumeAxisInterceptMl: 5,
          rSquared: 0.99,
        },
        quadraticSensitivity: {
          points: [
            { volumeMl: 40, transmuralPressureMmHg: 68 },
            { volumeMl: 70, transmuralPressureMmHg: 133 },
          ],
          rmseImprovementPercent: 12,
        },
      },
      edpvr: {
        status: "invalid",
        invalidReason: "Insufficient end-diastolic pressure span",
      },
      prsw: {
        status: "valid",
        slopeMmHg: 72,
        rSquared: 0.98,
      },
      status: {
        status: "partial",
        label: "Partial protocol",
        qc: {
          level: "warning",
          summary: "ESPVR accepted; EDPVR withheld",
        },
      },
    };

    const html = renderToStaticMarkup(React.createElement(
      ScientificPvRelationPaneV1,
      { data },
    ));

    expect(html).toContain('data-series="espvr-linear"');
    expect(html).toContain('data-series="espvr-quadratic-sensitivity"');
    expect(html).toContain('data-anchor-event="end-diastole"');
    expect(html).toContain('data-anchor-event="end-systole"');
    expect(html).toContain('data-beat-classification="alternans-suspect-high"');
    expect(html).toContain("Alternans suspect · excluded");
    expect(html).toContain("PRSW Mw 72.0 mmHg");
    expect(html).toContain("Fit withheld.");
    expect(html).toContain("Insufficient end-diastolic pressure span");
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

  it("draws a rejected ESPVR only as a labelled diagnostic curve", () => {
    const data: ScientificPvRelationPaneDataV1 = {
      beats: [],
      espvr: {
        status: "invalid",
        invalidReason: "Nonlinear over the acquired loading range",
        linear: {
          points: [
            { volumeMl: 40, transmuralPressureMmHg: 80 },
            { volumeMl: 70, transmuralPressureMmHg: 100 },
          ],
          endSystolicElastanceMmHgPerMl: 0.67,
          volumeAxisInterceptMl: -79,
        },
      },
      edpvr: { status: "not-run" },
      prsw: { status: "not-run" },
      status: {
        status: "invalid",
        label: "Raw evidence retained",
        qc: { level: "warning", summary: "Linear ESPVR rejected" },
      },
    };

    const html = renderToStaticMarkup(React.createElement(
      ScientificPvRelationPaneV1,
      { data },
    ));

    expect(html).toContain('data-series="espvr-linear"');
    expect(html).toContain('stroke-dasharray="4 3"');
    expect(html).toContain("ESPVR diagnostic · QC rejected");
    expect(html).toContain("Diagnostic Ees");
    expect(html).toContain("Nonlinear over the acquired loading range");
  });
});
