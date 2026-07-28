import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  CatalogNeutralWaveformCanvasV1,
} from "@/components/scientificProduct/CatalogNeutralWaveformCanvasV1";
import {
  SCIENTIFIC_PRODUCT_DISCOVERY_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1,
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
  resolveScientificProductIntegratedV3CaseRouteV1,
} from "@/components/scientificProduct/ScientificProductIntegratedV3CaseV1";
import {
  ScientificProductCasesGridV1,
} from "@/components/scientificProduct/ScientificProductCasesGridV1";
import {
  integratedV3ChartPointV1,
  ScientificProductIntegratedV3LaneSurfaceV1,
} from "@/components/scientificProduct/ScientificProductIntegratedV3WorkbenchV1";
import {
  INTEGRATED_V3_LANE_BADGE_V1,
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_LIMITATIONS_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import type {
  MainWireIntegratedLaneObservableFrameV1,
  MainWireIntegratedLaneObservableIdV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
} from "@/studio/adapters/mainWire/MainWireIntegratedV3LiveLaneDriverV1";
import {
  STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
  type StudioIntegratedV3PresentationSampleV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

const OBSERVABLE_VALUES_V1 = {
  "hemodynamics.volume.LV": 142,
  "hemodynamics.pressure.absolute.LV": 91,
  "hemodynamics.pressure.absolute.Ao": 84,
  "coronary.flow.total": 3.7,
  "coronary.flow.inlet.LAD": 1.5,
  "coronary.flow.inlet.LCx": 1.2,
  "coronary.flow.inlet.RCA": 1,
  "device.LVAD.flow": 72,
} as const satisfies Record<MainWireIntegratedLaneObservableIdV1, number>;

describe("scientific product integrated V3 lane step 8", () => {
  it("adds the opt-in badge to product discovery without changing the release-bound catalog default", () => {
    expect(SCIENTIFIC_PRODUCT_DISCOVERY_CASE_CATALOG_V1).toHaveLength(10);
    expect(SCIENTIFIC_PRODUCT_DISCOVERY_CASE_CATALOG_V1.at(-1)).toEqual(
      SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
    );
    expect(SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1).toMatchObject({
      caseId: SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1,
      kind: "integrated-v3-experimental",
      badge: INTEGRATED_V3_LANE_BADGE_V1,
    });
    expect(resolveScientificProductIntegratedV3CaseRouteV1(
      encodeURIComponent(SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1),
    )).toBe(SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1);

    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ScientificProductCasesGridV1, {
          locale: "ja",
          openLabel: "Open case",
          cases: SCIENTIFIC_PRODUCT_DISCOVERY_CASE_CATALOG_V1,
        }),
      ),
    );
    expect(markup.match(/data-case-id=/g)).toHaveLength(10);
    expect(renderedTextV1(markup)).toContain(
      "Experimental · development · unverified",
    );
    expect(markup).toContain(
      encodeURIComponent(SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1),
    );
  });

  it("routes the eight V3 values directly into catalog-neutral chart points", () => {
    const sample = sampleV1(0.002, 1, 1);
    expect(integratedV3ChartPointV1(sample)).toEqual({
      timeSec: 0.002,
      values: OBSERVABLE_VALUES_V1,
    });
    expect(sample.coverage).toBe(
      STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
    );

    const chartSource = readFileSync(
      new URL(
        "../components/scientificProduct/CatalogNeutralWaveformCanvasV1.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(chartSource).not.toMatch(
      /ObservableCatalog|LaneObservable|laneKind|releaseRef/,
    );
    expect(CatalogNeutralWaveformCanvasV1).toEqual(expect.any(Function));
  });

  it("T8/T9/T14 renders exact limitations, measured degraded pacing, signals, status, and every denied capability", () => {
    const sample = sampleV1(1, 501, 2);
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ["/ja/workbench/integrated-v3"] },
        React.createElement(ScientificProductIntegratedV3LaneSurfaceV1, {
          caseEntry: SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
          descriptor: MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
          history: [sampleV1(0.998, 499, 1), sample],
          sample,
          pacing: {
            mode: "degraded",
            epochLagMs: 0,
            recentAchievedRate: 0.37,
            cumulativeRebasedDeficitMs: 1_700,
          },
        }),
      ),
    );
    const text = renderedTextV1(markup);

    expect(text).toContain("Model time");
    expect(text).toContain("1.000 s");
    expect(text).toContain("Accepted revision");
    expect(text).toContain("501");
    expect(text).toContain("Internal substeps");
    expect(text).toContain("Regular sinus");
    expect(text).toContain("HMII 9000");
    expect(text).toContain("degraded · 0.37× measured");
    expect(markup).not.toContain("realtime-1x");
    for (const observableId of Object.keys(OBSERVABLE_VALUES_V1)) {
      expect(markup).toContain(`data-signal-id="${observableId}"`);
    }

    expect(markup.match(/data-limitation-index=/g)).toHaveLength(
      INTEGRATED_V3_LANE_LIMITATIONS_V1.length,
    );
    let previousLimitationIndex = -1;
    for (const limitation of INTEGRATED_V3_LANE_LIMITATIONS_V1) {
      const limitationIndex = text.indexOf(limitation);
      expect(limitationIndex).toBeGreaterThan(previousLimitationIndex);
      previousLimitationIndex = limitationIndex;
    }

    const unavailableKeys = INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1.filter(
      (key) =>
        !MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1
          .capabilities[key].available,
    );
    expect(markup.match(/data-capability-available="false"/g)).toHaveLength(
      unavailableKeys.length,
    );
    for (const key of unavailableKeys) {
      const capability =
        MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1.capabilities[key];
      if (capability.available !== false) {
        throw new Error(`${key} unexpectedly available`);
      }
      expect(markup).toContain(`data-capability-key="${key}"`);
      expect(markup).toContain(`data-capability-explanation="${key}"`);
      expect(text).toContain(capability.explanation);
      expect(markup).toMatch(new RegExp(
        `<button[^>]*disabled=""[^>]*data-capability-action="${key}"`,
      ));
    }
  });

  it("T3/T4/T5/T10/T15 keeps forbidden projection, artifacts, exactness, release reuse, and lane-kind UI branches off the V3 path", () => {
    const v3UiSource = [
      "../components/scientificProduct/ScientificProductIntegratedV3CaseV1.ts",
      "../components/scientificProduct/CatalogNeutralWaveformCanvasV1.tsx",
      "../components/scientificProduct/ScientificProductIntegratedV3WorkbenchV1.tsx",
    ].map((path) =>
      readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

    expect(v3UiSource).not.toMatch(
      /ScientificProductStudioObservableFrameProjectionV1|projectMainWireScientificObservationV1|MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1/,
    );
    expect(v3UiSource).not.toMatch(
      /StudioRunArtifactContentV1|STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID|artifactStore/,
    );
    expect(v3UiSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(v3UiSource).not.toMatch(
      /main-wire-adult-five-wall-noncoronary|0\.2\.0|verified-research/,
    );
    expect(v3UiSource).not.toContain("laneKind ===");
    expect(v3UiSource).not.toContain("\"realtime-1x\"");
    expect(v3UiSource).not.toContain("INITIAL_RUNTIME_LIVE_PACING_STATE_V1");
    expect(v3UiSource).not.toMatch(
      /checkpointMainWireIntegratedModelV3|persistedWarmSnapshot\s*:\s*\{\s*available:\s*true/,
    );
  });
});

function sampleV1(
  presentationTimeSec: number,
  acceptedRevision: number,
  internalAcceptedSubstepCount: number,
): StudioIntegratedV3PresentationSampleV1 {
  return Object.freeze({
    coverage: STUDIO_INTEGRATED_V3_PRESENTATION_COVERAGE_V1,
    presentationOrdinal: Math.round(presentationTimeSec / 0.002),
    presentationTimeSec,
    acceptedRevision,
    acceptedTimeSec: presentationTimeSec,
    acceptedRevisionSpanFromPrevious: internalAcceptedSubstepCount,
    internalAcceptedSubstepCount,
    boundaryClippedSubstepCount:
      internalAcceptedSubstepCount > 1 ? 1 : 0,
    observableFrame: frameV1(),
  });
}

function frameV1(): MainWireIntegratedLaneObservableFrameV1 {
  return Object.freeze({
    frameId: "main-wire-integrated-v3-experimental-observable-frame-v1",
    registryId:
      "main-wire-integrated-v3-experimental-observable-registry-v1",
    schemaVersion: 1,
    values: Object.freeze(Object.fromEntries(
      Object.entries(OBSERVABLE_VALUES_V1).map(
        ([observableId, value]) => [
          observableId,
          Object.freeze({
            observableId,
            value,
            availability: "available" as const,
            quality: "accepted-derived" as const,
          }),
        ],
      ),
    )) as MainWireIntegratedLaneObservableFrameV1["values"],
  });
}

function renderedTextV1(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
