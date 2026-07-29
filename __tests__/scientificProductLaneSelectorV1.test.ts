import { readFileSync } from "node:fs";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1,
  SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1,
  SCIENTIFIC_PRODUCT_LANE_PREFERENCE_KEY_V1,
  ScientificProductLaneSelectorV1,
  readScientificProductLanePreferenceV1,
  writeScientificProductLanePreferenceV1,
} from "@/components/scientificProduct/ScientificProductLaneSelectorV1";
import ScientificProductWorkbenchPageV1 from "@/components/scientificProduct/ScientificProductWorkbenchPageV1";
import {
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1,
} from "@/components/scientificProduct/ScientificProductIntegratedV3CaseV1";
import {
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_KIND_V1,
  INTEGRATED_V3_LANE_LIMITATIONS_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
import {
  STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1,
  STUDIO_NONCORONARY_LANE_KIND_V1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

describe("scientific product lane selector V1", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the integrated V3 lane by default with its badge and all eight limitations", () => {
    const markup = renderProductRouteV1("/ja/workbench");
    const text = renderedTextV1(markup);

    expect(SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1).toBe(
      INTEGRATED_V3_LANE_KIND_V1,
    );
    expect(markup).toContain(
      'data-selected-lane-kind="integrated-v3-experimental"',
    );
    expect(markup).toContain(
      'data-testid="integrated-v3-product-opening-v1"',
    );
    expect(markup).not.toContain(
      'data-testid="scientific-product-workbench-loading-v1"',
    );
    expect(markup.match(/data-selected-lane-limitation-index=/g))
      .toHaveLength(8);
    for (const limitation of INTEGRATED_V3_LANE_LIMITATIONS_V1) {
      expect(text).toContain(limitation);
    }
  });

  it("keeps the direct V3 case route authoritative over a saved non-coronary preference", () => {
    const storage = memoryStorageV1();
    writeScientificProductLanePreferenceV1(
      STUDIO_NONCORONARY_LANE_KIND_V1,
      storage,
    );
    vi.stubGlobal("window", { localStorage: storage });

    const markup = renderProductRouteV1(
      `/ja/workbench/${SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_ID_V1}`,
    );

    expect(markup).toContain(
      'data-selected-lane-kind="integrated-v3-experimental"',
    );
    expect(markup).toContain(
      'data-testid="integrated-v3-product-opening-v1"',
    );
  });

  it("persists an explicit non-coronary choice across fresh route mounts", () => {
    const storage = memoryStorageV1();
    writeScientificProductLanePreferenceV1(
      STUDIO_NONCORONARY_LANE_KIND_V1,
      storage,
    );
    expect(storage.getItem(SCIENTIFIC_PRODUCT_LANE_PREFERENCE_KEY_V1))
      .toBe(STUDIO_NONCORONARY_LANE_KIND_V1);
    expect(readScientificProductLanePreferenceV1(storage))
      .toBe(STUDIO_NONCORONARY_LANE_KIND_V1);
    vi.stubGlobal("window", { localStorage: storage });

    const firstVisit = renderProductRouteV1("/ja/workbench");
    const reloadedVisit = renderProductRouteV1("/ja/workbench");
    for (const markup of [firstVisit, reloadedVisit]) {
      expect(markup).toContain(
        'data-selected-lane-kind="noncoronary-v1"',
      );
      expect(markup).toContain(
        'data-testid="scientific-product-workbench-loading-v1"',
      );
      expect(markup).not.toContain(
        'data-testid="integrated-v3-product-opening-v1"',
      );
    }

    for (const key of [
      "interactiveResearchControls",
      "strictPeriodicSettlement",
      "steadyCandidatePromotion",
      "candidatePinning",
      "persistedWarmSnapshot",
      "exactSignalExport",
      "hemodynamicSideAnalysis",
      "pvRelationsSideAnalysis",
      "tbvContinuationSeedPrediction",
    ] as const) {
      expect(
        STUDIO_NONCORONARY_LANE_DESCRIPTOR_V1.capabilities[key].available,
      ).toBe(true);
    }
  });

  it("derives every lane row, unavailable reason, and explanation from the descriptors", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(ScientificProductLaneSelectorV1, {
          selectedDescriptor: SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1[0],
          onSelectLane: () => undefined,
        }),
      ),
    );

    for (const descriptor of SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1) {
      const card = laneCardMarkupV1(markup, descriptor.laneKind);
      expect(card.match(/data-lane-capability=/g)).toHaveLength(
        INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1.length,
      );
      const text = renderedTextV1(card);
      for (const key of INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1) {
        const capability = descriptor.capabilities[key];
        if (capability.available !== false) continue;
        expect(card).toContain(`data-capability-explanation="${key}"`);
        expect(card).toContain(
          `data-capability-reason="${capability.reason}"`,
        );
        expect(text).toContain(capability.reason);
        expect(text).toContain(capability.explanation);
      }
    }

    const source = readFileSync(path.resolve(
      process.cwd(),
      "components/scientificProduct/ScientificProductLaneSelectorV1.tsx",
    ), "utf8");
    expect(source).toContain(
      "SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1.map",
    );
    expect(source).toContain("descriptor.capabilities[key]");
    expect(source).not.toContain("laneKind ===");
    for (const descriptor of SCIENTIFIC_PRODUCT_LANE_DESCRIPTORS_V1) {
      for (const capability of Object.values(descriptor.capabilities)) {
        if (capability.available === false) {
          expect(source).not.toContain(capability.explanation);
        }
      }
    }
  });
});

function renderProductRouteV1(initialEntry: string): string {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: "/:locale/workbench",
          element: React.createElement(ScientificProductWorkbenchPageV1),
        }),
        React.createElement(Route, {
          path: "/:locale/workbench/:caseId",
          element: React.createElement(ScientificProductWorkbenchPageV1),
        }),
      ),
    ),
  );
}

function laneCardMarkupV1(markup: string, laneKind: string): string {
  const start = markup.indexOf(`data-lane-option="${laneKind}"`);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = markup.indexOf("</article>", start);
  expect(end).toBeGreaterThan(start);
  return markup.slice(start, end);
}

function memoryStorageV1(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
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
