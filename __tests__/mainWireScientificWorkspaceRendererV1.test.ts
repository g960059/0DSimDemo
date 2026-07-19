import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ScientificWorkspaceRendererV1,
} from "@/components/scientificWorkbench/ScientificWorkspaceRendererV1";
import {
  boundScientificWorkspaceHistoryV1,
  projectScientificWorkspaceNumericRowsV1,
  projectScientificWorkspacePvTrajectoryV1,
  projectScientificWorkspaceTimeSeriesV1,
} from "@/components/scientificWorkbench/scientificWorkspaceProjectionV1";
import {
  MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import {
  createMainWireScientificWorkspaceDocumentV1,
  type MainWireScientificWorkspacePressureVolumeTrajectoryV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
  type MainWireScientificObservableValueV1,
  type ScientificObservableAvailabilityV1,
  type ScientificObservableQualityV1,
} from "@/engine/scientific/observables/MainWireScientificObservableRegistryV1";

describe("ScientificWorkspaceRendererV1", () => {
  it("splits time-series and explicit PV paths at unavailable samples without inventing zeros", () => {
    const frames = testFrames();
    const flow = projectScientificWorkspaceTimeSeriesV1(frames, "valve.MV.flow");
    expect(flow.availableSampleCount).toBe(3);
    expect(flow.unavailableSampleCount).toBe(1);
    expect(flow.segments).toHaveLength(2);
    expect(flow.segments.map(({ quality, points }) => ({
      quality,
      values: points.map(({ y }) => y),
    }))).toEqual([
      { quality: "accepted-derived", values: [10] },
      { quality: "solver-diagnostic", values: [12, 14] },
    ]);

    const pv = projectScientificWorkspacePvTrajectoryV1(frames, LA_PV);
    expect(pv.availablePairCount).toBe(3);
    expect(pv.unavailablePairCount).toBe(1);
    expect(pv.segments.map(({ points }) =>
      points.map(({ x, y }) => [x, y]))).toEqual([
      [[40, 7]],
      [[42, 9], [43, 10]],
    ]);
    expect(pv.segments.flatMap(({ points }) => points))
      .not.toContainEqual(expect.objectContaining({ x: 0 }));
    expect(pv.segments.flatMap(({ points }) => points))
      .not.toContainEqual(expect.objectContaining({ y: 0 }));
  });

  it("keeps the latest numeric value, availability, and quality as separate fields", () => {
    const rows = projectScientificWorkspaceNumericRowsV1(testFrames(), [
      "valve.AoV.flow",
      "coronary.flow.total",
    ]);
    expect(rows[0]).toMatchObject({
      observableId: "valve.AoV.flow",
      value: 0,
      availability: "available",
      quality: "accepted-derived",
      finiteValueAvailable: true,
    });
    expect(rows[1]).toMatchObject({
      observableId: "coronary.flow.total",
      value: null,
      availability: "not-modeled",
      quality: "not-assessed",
      finiteValueAvailable: false,
    });

    const malformedAvailableNull = projectScientificWorkspaceNumericRowsV1([
      frame(5, 1.008, {
        "pericardium.excess_pressure": {
          value: null,
          availability: "available",
          quality: "accepted-derived",
        },
      }),
    ], ["pericardium.excess_pressure"])[0];
    expect(malformedAvailableNull).toMatchObject({
      value: null,
      availability: "available",
      quality: "accepted-derived",
      finiteValueAvailable: false,
    });
  });

  it("renders all three WorkspaceDocument panel kinds and exposes provenance summaries", async () => {
    const document = await workspaceDocument();
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkspaceRendererV1,
      { workspaceDocument: document, frames: testFrames() },
    ));

    expect(html).toContain("data-testid=\"scientific-workspace-renderer-v1\"");
    expect(html).toContain(`data-workspace-sha256=\"${document.ref.sha256}\"`);
    expect(html).toContain("data-frame-count=\"4\"");
    expect(html).toContain("data-first-revision=\"1\"");
    expect(html).toContain("data-final-revision=\"4\"");
    expect(html).toContain("data-first-accepted-time-sec=\"1\"");
    expect(html).toContain("data-final-accepted-time-sec=\"1.006\"");
    expect(html).toContain("data-panel-kind=\"time-series\"");
    expect(html).toContain("data-panel-kind=\"pressure-volume\"");
    expect(html).toContain("data-panel-kind=\"numeric-table\"");
    expect(html).toContain("data-testid=\"scientific-workspace-series-waveforms-valve.MV.flow-0\"");
    expect(html).toContain("data-testid=\"scientific-workspace-series-waveforms-valve.MV.flow-1\"");
    expect(html).toContain("data-quality=\"solver-diagnostic\"");
    expect(html).toContain("data-volume-observable-id=\"hemodynamics.volume.LA\"");
    expect(html).toContain("data-pressure-observable-id=\"hemodynamics.pressure.absolute.LA\"");
    expect(html).toContain("data-unavailable-pairs=\"1\"");
    expect(html).toContain("data-observable-id=\"coronary.flow.total\"");
    expect(html).toContain("data-availability=\"not-modeled\"");
    expect(html).toContain("data-finite-value-available=\"false\"");
    expect(html).toContain("—");
    expect(html).toContain("0 mL/s");
  });

  it("does not draw axes or a zero-valued path when every requested sample is unavailable", async () => {
    const document = await createMainWireScientificWorkspaceDocumentV1({
      revision: 0,
      caseDocumentRef: CASE_REF,
      panels: [{
        panelId: "unavailable",
        title: "Unavailable capability",
        view: { kind: "time-series", observableIds: ["device.LVAD.flow"] },
        layout: { x: 0, y: 0, width: 4, height: 3 },
      }],
      notes: null,
    });
    const html = renderToStaticMarkup(React.createElement(
      ScientificWorkspaceRendererV1,
      { workspaceDocument: document, frames: testFrames() },
    ));

    expect(html).toContain("No finite, available samples to plot.");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("scientific-workspace-series-unavailable-device.LVAD.flow");
  });

  it("bounds rendering history explicitly while retaining the latest frames", () => {
    const frames = testFrames();
    expect(boundScientificWorkspaceHistoryV1(frames, 2)).toEqual({
      frames: [frames[2], frames[3]],
      omittedFrameCount: 2,
    });
    expect(() => boundScientificWorkspaceHistoryV1(frames, 0))
      .toThrow(/positive safe integer/);
  });

  it("keeps the renderer source outside legacy runtime, Workbench, controls, Worker, and persistence boundaries", () => {
    const sourcePaths = [
      "components/scientificWorkbench/ScientificWorkspaceRendererV1.tsx",
      "components/scientificWorkbench/scientificWorkspaceProjectionV1.ts",
      "components/scientificWorkbench/index.ts",
    ];
    const forbidden = [
      "ModelCore",
      "PreviewController",
      "PanelGrid",
      "SimInstance",
      "features/workbench",
      "components/Controls",
      "scientificBrowser",
      "ScientificWorker",
      "firebase",
      "casePersist",
      "localStorage",
    ];
    for (const sourcePath of sourcePaths) {
      const source = readFileSync(path.resolve(sourcePath), "utf8");
      expect(source, `${sourcePath} must not coerce nullish data to zero`)
        .not.toMatch(/(?:\?\?|\|\|)\s*0\b/);
      for (const marker of forbidden) {
        expect(source, `${sourcePath} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });
});

const RELEASE = Object.freeze({
  id: "test-release",
  version: "0.0.0",
  sha256: "a".repeat(64),
});

const CASE_REF = Object.freeze({
  schemaId: MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID,
  sha256: "b".repeat(64),
});

const LA_PV: MainWireScientificWorkspacePressureVolumeTrajectoryV1 =
  Object.freeze({
    trajectoryId: "la",
    label: "Left atrium",
    volumeObservableId: "hemodynamics.volume.LA",
    pressureObservableId: "hemodynamics.pressure.absolute.LA",
  });

type ValueOverride = Readonly<{
  value: number | null;
  availability?: ScientificObservableAvailabilityV1;
  quality?: ScientificObservableQualityV1;
}>;

function testFrames(): readonly MainWireScientificObservableFrameV1[] {
  return Object.freeze([
    frame(1, 1, {
      "hemodynamics.volume.LA": { value: 40, quality: "authoritative-state" },
      "hemodynamics.pressure.absolute.LA": { value: 7 },
      "valve.MV.flow": { value: 10 },
      "valve.AoV.flow": { value: 0 },
    }),
    frame(2, 1.002, {
      "hemodynamics.volume.LA": { value: 41, quality: "authoritative-state" },
      "hemodynamics.pressure.absolute.LA": {
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      },
      "valve.MV.flow": {
        value: null,
        availability: "not-converged",
        quality: "not-assessed",
      },
      "valve.AoV.flow": { value: 0 },
    }),
    frame(3, 1.004, {
      "hemodynamics.volume.LA": { value: 42, quality: "authoritative-state" },
      "hemodynamics.pressure.absolute.LA": { value: 9 },
      "valve.MV.flow": { value: 12, quality: "solver-diagnostic" },
      "valve.AoV.flow": { value: 0 },
    }),
    frame(4, 1.006, {
      "hemodynamics.volume.LA": { value: 43, quality: "authoritative-state" },
      "hemodynamics.pressure.absolute.LA": { value: 10 },
      "valve.MV.flow": { value: 14, quality: "solver-diagnostic" },
      "valve.AoV.flow": { value: 0 },
    }),
  ]);
}

function frame(
  revision: number,
  acceptedTimeSec: number,
  overrides: Partial<Record<MainWireScientificObservableIdV1, ValueOverride>>,
): MainWireScientificObservableFrameV1 {
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => {
      const override = overrides[definition.observableId];
      const value = override?.value ?? null;
      const availability = override?.availability
        ?? (override === undefined
          ? definition.modelingStatus === "not-modeled"
            ? "not-modeled"
            : "not-evaluated-at-accepted-state"
          : "available");
      const quality = override?.quality
        ?? (availability === "available" ? "accepted-derived" : "not-assessed");
      return [definition.observableId, Object.freeze({
        observableId: definition.observableId,
        value,
        availability,
        quality,
      })];
    }),
  ) as Record<MainWireScientificObservableIdV1,
  MainWireScientificObservableValueV1>;
  return Object.freeze({
    frameId: "main-wire-scientific-observable-frame-v1",
    registryId: "main-wire-scientific-observable-registry-v1",
    schemaVersion: 1,
    releaseRef: RELEASE,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source: "accepted-step",
    revision,
    acceptedTimeSec,
    values: Object.freeze(values),
  });
}

async function workspaceDocument() {
  return createMainWireScientificWorkspaceDocumentV1({
    revision: 0,
    caseDocumentRef: CASE_REF,
    panels: [
      {
        panelId: "waveforms",
        title: "Waveforms",
        view: {
          kind: "time-series",
          observableIds: ["valve.MV.flow", "hemodynamics.pressure.absolute.LA"],
        },
        layout: { x: 0, y: 0, width: 6, height: 4 },
      },
      {
        panelId: "atrial-pv",
        title: "Atrial PV",
        view: { kind: "pressure-volume", trajectories: [LA_PV] },
        layout: { x: 6, y: 0, width: 6, height: 4 },
      },
      {
        panelId: "latest-values",
        title: "Latest values",
        view: {
          kind: "numeric-table",
          observableIds: ["valve.AoV.flow", "coronary.flow.total"],
        },
        layout: { x: 0, y: 4, width: 12, height: 3 },
      },
    ],
    notes: "Presentation only.",
  });
}
