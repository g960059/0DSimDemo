import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
  ScientificProductIntegratedV3LaneSurfaceV1,
  ScientificProductIntegratedV3WorkbenchV1,
} from "@/components/scientificProduct/ScientificProductIntegratedV3WorkbenchV1";
import {
  SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
} from "@/components/scientificProduct/ScientificProductIntegratedV3CaseV1";
import {
  SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1,
} from "@/components/scientificProduct/ScientificProductLaneSelectorV1";
import {
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_KIND_V1,
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
  type StudioIntegratedV3LiveLaneDriverV1,
  type StudioIntegratedV3PresentationSampleV1,
} from "@/studio/adapters/mainWire/StudioLiveLaneV1";

/**
 * The V3 lane is what the bare `/<locale>/workbench` route opens, and
 * `components/Layout.tsx:25-28` suppresses the global header on `/workbench`,
 * so the header's `<ModelLimitations/>` — the product's only "not a medical
 * device, research only" acknowledgement — does not render there.
 *
 * This file exists because no other test could see that. Every Playwright spec
 * that visits the workbench seeds `circleheart.modelLimitations.ack.v1` in an
 * init script before navigating (for example
 * `e2e/integratedV3LaneLiveV1.spec.ts:229-233`), which suppresses the
 * acknowledgement in exactly the case that matters. Nothing here seeds that
 * key except the one test that asserts the key still suppresses it.
 */

const ACK_KEY_V1 = "circleheart.modelLimitations.ack.v1";

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

describe("integrated V3 lane first-run acknowledgement and opening view", () => {
  let storage: Map<string, string>;
  let hadLocalStorage: boolean;

  beforeEach(async () => {
    // The fast suite runs in the node environment, where `localStorage` is
    // absent and `ModelLimitations` deliberately does not nag. A fresh browser
    // has storage and no acknowledgement, which is the state under test.
    storage = new Map<string, string>();
    hadLocalStorage = "localStorage" in globalThis;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    if (!hadLocalStorage) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it("lands the bare workbench route on the lane this file guards", () => {
    expect(SCIENTIFIC_PRODUCT_DEFAULT_LANE_KIND_V1).toBe(
      INTEGRATED_V3_LANE_KIND_V1,
    );
  });

  it("demands the acknowledgement on the very first paint, before any sample", () => {
    const markup = openingMarkupV1();

    expect(markup).toContain("role=\"dialog\"");
    expect(markup).toContain("aria-labelledby=\"model-limits-title\"");
    expect(textV1(markup)).toContain("not a medical device");
  });

  it("demands the acknowledgement on the live surface as well", () => {
    const markup = surfaceMarkupV1();

    expect(markup).toContain("role=\"dialog\"");
    expect(textV1(markup)).toContain("not a medical device");
  });

  it("is suppressed by the same acknowledgement key the global header writes", () => {
    storage.set(ACK_KEY_V1, "1");

    expect(openingMarkupV1()).not.toContain("role=\"dialog\"");
    expect(surfaceMarkupV1()).not.toContain("role=\"dialog\"");
  });

  it("keeps the unavailable-action grid collapsed without dropping a capability attribute", () => {
    const markup = surfaceMarkupV1();
    const unavailableKeys = INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1.filter(
      (key) =>
        MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1.capabilities[key]
          .available === false,
    );

    expect(unavailableKeys.length).toBeGreaterThan(0);
    expect(markup).toContain(
      "<details data-testid=\"integrated-v3-unavailable-actions-v1\"",
    );
    expect(markup).not.toMatch(/<details[^>]*\sopen/);
    expect(markup.match(/data-capability-available="false"/g)).toHaveLength(
      unavailableKeys.length,
    );
    for (const key of unavailableKeys) {
      expect(markup).toContain(`data-capability-action="${key}"`);
      expect(markup).toContain(`data-capability-explanation="${key}"`);
    }
    // The count in the summary is the count of denied actions, not a constant.
    expect(textV1(markup)).toContain(`${unavailableKeys.length} actions`);
  });

  it("renders its own copy through i18n in both shipped locales", async () => {
    expect(textV1(surfaceMarkupV1())).toContain("Unavailable actions");
    expect(textV1(openingMarkupV1())).toContain(
      "Opening the fixed experimental browser lane",
    );

    await i18n.changeLanguage("ja");
    const jaSurface = textV1(surfaceMarkupV1());
    expect(jaSurface).toContain("利用できない操作");
    expect(jaSurface).toContain("制限事項");
    expect(jaSurface).toContain("ケース一覧に戻る");
    expect(textV1(openingMarkupV1())).toContain(
      "実験用ブラウザーレーンを起動しています",
    );
    // The lane's own eight limitation strings are evidence, not UI copy, and
    // stay verbatim in every locale. `e2e/integratedV3LaneLiveV1.spec.ts` pins
    // them on the `/ja` route.
    expect(jaSurface).toContain(
      MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1.limitations[0],
    );
    await i18n.changeLanguage("en");
  });
});

function openingMarkupV1(): string {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/ja/workbench"] },
      React.createElement(ScientificProductIntegratedV3WorkbenchV1, {
        caseEntry: SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
        driverFactory: serverRenderDriverV1,
      }),
    ),
  );
}

function surfaceMarkupV1(): string {
  const sample = sampleV1(1, 501, 2);
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/ja/workbench"] },
      React.createElement(ScientificProductIntegratedV3LaneSurfaceV1, {
        caseEntry: SCIENTIFIC_PRODUCT_INTEGRATED_V3_CASE_V1,
        descriptor: MAIN_WIRE_INTEGRATED_V3_LANE_DESCRIPTOR_V1,
        history: [sample],
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
}

/**
 * A server render runs no effect, so the opening view must not need a session.
 * Every member throws to keep that honest: if the first paint ever starts
 * reaching into the driver, these tests say so rather than opening a Worker.
 */
function serverRenderDriverV1(): StudioIntegratedV3LiveLaneDriverV1 {
  const unreachable = (member: string) => (): never => {
    throw new Error(`${member} must not be reached during a server render`);
  };
  return {
    get laneKind(): never {
      return unreachable("laneKind")();
    },
    get laneDescriptor(): never {
      return unreachable("laneDescriptor")();
    },
    get executionIdentity(): never {
      return unreachable("executionIdentity")();
    },
    openSession: unreachable("openSession"),
    subscribePresentationSignalChannel: unreachable(
      "subscribePresentationSignalChannel",
    ),
    closeSession: unreachable("closeSession"),
  } as unknown as StudioIntegratedV3LiveLaneDriverV1;
}

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
    boundaryClippedSubstepCount: internalAcceptedSubstepCount > 1 ? 1 : 0,
    observableFrame: frameV1(),
  });
}

function frameV1(): MainWireIntegratedLaneObservableFrameV1 {
  return Object.freeze({
    frameId: "main-wire-integrated-v3-experimental-observable-frame-v1",
    registryId: "main-wire-integrated-v3-experimental-observable-registry-v1",
    schemaVersion: 1,
    values: Object.freeze(Object.fromEntries(
      Object.entries(OBSERVABLE_VALUES_V1).map(([observableId, value]) => [
        observableId,
        Object.freeze({
          observableId,
          value,
          availability: "available" as const,
          quality: "accepted-derived" as const,
        }),
      ]),
    )) as MainWireIntegratedLaneObservableFrameV1["values"],
  });
}

function textV1(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
