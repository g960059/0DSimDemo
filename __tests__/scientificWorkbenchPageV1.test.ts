import { readFileSync } from "node:fs";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ScientificProductWorkbenchPageV1 from "@/components/scientificProduct/ScientificProductWorkbenchPageV1";
import {
  createScientificProductWorkbenchPresentationV1,
} from "@/components/scientificProduct/ScientificProductWorkbenchRouteV1";
import {
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import ScientificWorkbenchPageV1 from "@/components/scientificWorkbench/ScientificWorkbenchPageV1";
import ScientificBrowserPerformanceLabV0 from "@/components/scientificPerformance/ScientificBrowserPerformanceLabV0";
import {
  appendScientificWorkbenchLiveFramesV0,
  assertScientificWorkbenchResearchForkBoundaryFrameV0,
  ScientificWorkbenchResearchControlMirrorV0,
  remainingScientificWorkbenchRegularRequestCountV0,
  reserveScientificWorkbenchRequestIdentityV0,
  scientificWorkbenchDisplayedFrameOwnerV0,
  SCIENTIFIC_WORKBENCH_LIVE_HISTORY_FRAME_LIMIT_V0,
  SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
  SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlV0";
import {
  createScientificWorkbenchResearchControlStoreV0,
  type ScientificWorkbenchResearchControlOwnerActionsV0,
  type ScientificWorkbenchResearchControlSnapshotInputV0,
  type ScientificWorkbenchResearchControlSourceV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificWorkspaceDocumentV1,
} from "@/engine/scientific/documents";
import { workspaceForPanelStateReplacement } from "@/features/workbench/hooks/useWorkbenchPanels";
import { layoutStateFromWorkspace } from "@/features/workbench/workbenchDefaults";

describe("document-bound scientific workbench page V1", () => {
  it("renders an explicit verification state before starting browser effects", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScientificWorkbenchPageV1),
    );

    expect(markup).toContain("Official healthy periodic workspace");
    expect(markup).toContain("Loading verified case");
    expect(markup).toContain("Official catalog reference");
    expect(markup).toContain("Document-bound case");
    expect(markup).toContain("Mitral regurgitation — severe research bracket");
    expect(markup).toContain("overflow-y-auto");
    expect(markup).not.toContain("backend selector");
  });

  it("keeps the research surface separate while the product route hosts the existing Workbench shell", () => {
    const source = read("index.tsx");
    expect(source).toContain('path="scientific-workbench"');
    expect(source).toContain('path="workbench"');
    expect(source).toContain(
      "./components/scientificWorkbench/ScientificWorkbenchPageV1",
    );
    expect(source).toContain(
      "./components/scientificProduct/ScientificProductWorkbenchPageV1",
    );
    expect(source).not.toMatch(
      /(?:from\s+['"]\.\/WorkbenchPage['"]|import\(['"]\.\/WorkbenchPage['"]\))/,
    );
  });

  it("starts the blank product path with fail-closed scientific verification", () => {
    const markup = renderProductRoute("/ja/workbench");

    expect(markup).toContain(
      'data-testid="scientific-product-workbench-loading-v1"',
    );
    expect(markup).toContain("release-bound scientific state");
    expect(markup).not.toContain("scientific-product-workbench-host-v1");
    expect(markup).not.toContain('data-testid="scientific-workbench-page-v1"');
    expect(markup).not.toContain("main-wire/healthy-cold");
  });

  it("derives the product default graph board and open metrics host without mutating the scientific document", () => {
    const workspace = JSON.parse(read(
      "data/scientific/documents/workspaces/official-healthy-periodic-v1.json",
    )) as MainWireScientificWorkspaceDocumentV1;
    const canonicalBefore = JSON.stringify(workspace);
    const presentation = createScientificProductWorkbenchPresentationV1(
      workspace,
      "scenario-1",
    );

    expect(presentation.panels.map(({ id, type, timeWindow }) => ({
      id,
      type,
      timeWindow,
    }))).toEqual([
      { id: "lv-pv", type: "PVLOOP", timeWindow: undefined },
      { id: "product-left-pressure-v1", type: "WAVEFORM", timeWindow: 5_000 },
      { id: "product-mitral-flow-v1", type: "WAVEFORM", timeWindow: 2_000 },
    ]);
    expect(presentation.panels[0]?.config["scenario-1"]?.selectedSignals)
      .toEqual(["lv"]);
    expect(presentation.panels[1]?.config["scenario-1"]?.selectedSignals)
      .toEqual([
        "hemodynamics.pressure.absolute.Ao",
        "hemodynamics.pressure.absolute.LV",
        "hemodynamics.pressure.absolute.LA",
      ]);
    expect(presentation.panels[2]?.config["scenario-1"]?.selectedSignals)
      .toEqual(["valve.MV.flow"]);
    expect(presentation.graphBoardLayout).toEqual({
      type: "split",
      direction: "row",
      children: [
        { type: "leaf", graphViewId: "lv-pv" },
        {
          type: "split",
          direction: "column",
          children: [
            { type: "leaf", graphViewId: "product-left-pressure-v1" },
            { type: "leaf", graphViewId: "product-mitral-flow-v1" },
          ],
          sizes: [0.5, 0.5],
        },
      ],
      sizes: [0.5, 0.5],
    });
    expect(presentation.workbenchWorkspace.hosts.metrics).toEqual({ open: true });
    expect(presentation.workbenchWorkspace.hosts.main).toEqual({});
    const normalizedInitialWorkspace = workspaceForPanelStateReplacement({
      panels: presentation.panels,
      workspace: presentation.workbenchWorkspace,
    });
    expect(normalizedInitialWorkspace.hosts.metrics.open).toBe(true);
    expect(layoutStateFromWorkspace(normalizedInitialWorkspace))
      .toMatchObject({ metricsOpen: true, metricsSpan: "main" });
    expect(JSON.stringify(workspace)).toBe(canonicalBefore);

    const routeSource = read(
      "components/scientificProduct/ScientificProductWorkbenchRouteV1.tsx",
    );
    for (const marker of [
      "addPanel={panels.addPanel}",
      "duplicatePanel={panels.duplicatePanel}",
      "removePanel={panels.removePanel}",
      "onDockviewViewStateChange={panels.updateDockviewViewState}",
      "onGraphBoardLayoutChange={setGraphBoardLayout}",
      "workspace: initialPresentation.workbenchWorkspace",
    ]) expect(routeSource).toContain(marker);
  });

  it("resolves the retained normal-sinus alias to the exact official case", () => {
    const resolution = resolveScientificProductCaseRouteV1("normal-sinus");
    expect(resolution).toMatchObject({
      canonicalCaseId: "circleheart/official-healthy-periodic",
      aliasApplied: "normal-sinus",
      caseEntry: { kind: "official-exact-periodic" },
    });
  });

  it("fails closed for an unknown product case without mounting a runtime", () => {
    const markup = renderProductRoute("/ja/workbench/unknown-case");

    expect(markup).toContain(
      'data-testid="product-workbench-unsupported-case-v1"',
    );
    expect(markup).toContain(
      "This case is not available for the current model release.",
    );
    expect(markup).toContain("not translated silently");
    expect(markup).not.toContain("scientific-product-workbench-host-v1");
    expect(markup).not.toContain("product-workbench-page-v1");
    expect(markup).not.toContain("Loading verified case");
  });

  it("keeps the page and its orchestration outside legacy runtime surfaces", () => {
    const source = [
      read("components/scientificWorkbench/ScientificWorkbenchPageV1.tsx"),
      read("components/scientificWorkbench/scientificWorkbenchOfficialCycleV1.ts"),
      read("components/scientificWorkbench/scientificWorkbenchResearchCycleV1.ts"),
      read("components/scientificWorkbench/scientificWorkbenchTerminalCycleV1.ts"),
    ].join("\n");
    for (const forbidden of [
      'from "@/engine/ModelCore"',
      'from "@/WorkbenchPage"',
      'from "@/features/workbench',
      'from "@/components/workbench',
      'from "@/components/PanelGrid"',
      'from "@/components/PreviewController"',
      'from "@/components/Controls"',
      'from "@/engine/SimInstance"',
      'from "@/casePersist"',
    ]) expect(source).not.toContain(forbidden);
  });

  it("keeps the raw performance lab hidden, unlinked, and measurement-only", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScientificBrowserPerformanceLabV0),
    );
    const index = read("index.tsx");
    const links = [read("homeLinks.ts"), read("components/Home.tsx")].join("\n");

    expect(markup).toContain("Scientific browser performance lab");
    expect(markup).toContain("does not apply a latency threshold");
    expect(index).toContain('path="scientific-performance-lab"');
    expect(index).toContain("ScientificBrowserPerformanceLabV0");
    expect(links).not.toContain("scientific-performance-lab");
  });

  it("retains the official Worker for the release-bound controller and exposes stable E2E state", () => {
    const page = read(
      "components/scientificWorkbench/ScientificWorkbenchPageV1.tsx",
    );
    const controller = read(
      "components/scientificWorkbench/ScientificWorkbenchResearchControlV0.tsx",
    );
    const renderer = read(
      "components/scientificWorkbench/ScientificWorkspaceRendererV1.tsx",
    );

    expect(page).toContain("SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0");
    expect(page).toContain('const runtime = result.kind === "official"');
    expect(page).toContain("if (runtime === null) client.terminate()");
    expect(page).not.toContain(".finally(() =>");
    expect(page).toContain('result.kind === "official" && runtime !== undefined');
    expect(page).toContain("disabled={transitionActive}");
    expect(page).toContain("Initial source periodic evidence");
    expect(page).toContain("Base case / workspace");

    for (const marker of [
      "scientific-transition-controller-v0",
      "scientific-control-svr-v0",
      "scientific-control-pvr-v0",
      "scientific-transition-mode-steady-v0",
      "scientific-transition-mode-live-v0",
      "scientific-transition-apply-v0",
      "scientific-transition-cancel-v0",
      "scientific-transition-pause-v0",
      "scientific-transition-resume-v0",
      "scientific-transition-reset-v0",
      "Research only · not clinical · not patient fitting",
      "data-source-control-sha256",
      "data-target-control-sha256",
      "data-parameter-epoch",
      "data-source-parameter-epoch",
      "data-candidate-parameter-epoch",
      "data-displayed-control-sha256",
      "data-displayed-evidence",
      "data-remaining-regular-request-count",
      "data-source-retirement-pending",
      "data-in-flight",
      "data-periodic-status",
      "data-captured-step-count",
    ]) expect(controller).toContain(marker);
    for (const marker of [
      "data-frame-count",
      "data-first-revision",
      "data-final-revision",
      "data-first-accepted-time-sec",
      "data-final-accepted-time-sec",
      "data-base-case-sha256",
    ]) expect(renderer).toContain(marker);
    expect(renderer).toContain(
      "React.memo(function ScientificWorkspaceRendererV1",
    );
  });

  it("keeps accepted live steps for the maximum waveform window without resampling", () => {
    const retained = Array.from(
      { length: 501 },
      (_, revision) => transitionFrame(revision, revision * 0.002),
    );
    const incoming = Array.from(
      { length: 4 },
      (_, offset) => transitionFrame(501 + offset, (501 + offset) * 0.002),
    );
    const next = appendScientificWorkbenchLiveFramesV0(retained, incoming);

    expect(SCIENTIFIC_WORKBENCH_LIVE_HISTORY_FRAME_LIMIT_V0).toBe(10_001);
    expect(next).toHaveLength(505);
    expect(next[0]?.revision).toBe(0);
    expect(next.at(-1)?.revision).toBe(504);
    expect(next.slice(-4).map(({ revision }) => revision)).toEqual([
      501,
      502,
      503,
      504,
    ]);
    const oneSecondRolling = appendScientificWorkbenchLiveFramesV0(
      retained,
      incoming,
      501,
    );
    expect(oneSecondRolling).toHaveLength(501);
    expect(oneSecondRolling[0]?.revision).toBe(4);
    expect(() => appendScientificWorkbenchLiveFramesV0(
      retained,
      [transitionFrame(503, 1.002)],
    )).toThrow(/revision-contiguous/);
    expect(() => appendScientificWorkbenchLiveFramesV0(
      retained,
      [transitionFrame(501, 1.003)],
    )).toThrow(/2 ms cadence/);

    expect(scientificWorkbenchDisplayedFrameOwnerV0(
      true,
      next,
      retained,
    )).toBe("candidate");
    // Ownership remains candidate-derived even if a transport failure changes
    // the UI phase to reload-required; only restoring the exact source array
    // changes the displayed provenance.
    expect(scientificWorkbenchDisplayedFrameOwnerV0(
      true,
      retained,
      retained,
    )).toBe("source");
    expect(scientificWorkbenchDisplayedFrameOwnerV0(
      false,
      next,
      retained,
    )).toBe("source");
  });

  it("auto-pauses before bounded live capacity while preserving recovery capacity", () => {
    expect(SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0).toBe(127);
    expect(remainingScientificWorkbenchRegularRequestCountV0(
      SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
    )).toBe(
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0
        - SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0,
    );
    expect(remainingScientificWorkbenchRegularRequestCountV0(
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 - 1,
    )).toBe(1);
    expect(remainingScientificWorkbenchRegularRequestCountV0(
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
    )).toBe(0);
    expect(remainingScientificWorkbenchRegularRequestCountV0(
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 + 1,
    )).toBe(0);
    const lastRegular = reserveScientificWorkbenchRequestIdentityV0(
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 - 1,
    );
    expect(lastRegular).toEqual({
      consumedRequestCount: SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0,
      remainingRegularRequestCount: 0,
    });
    expect(() => reserveScientificWorkbenchRequestIdentityV0(
      lastRegular.consumedRequestCount,
    )).toThrow(/capacity is exhausted/);
    expect(reserveScientificWorkbenchRequestIdentityV0(
      lastRegular.consumedRequestCount,
      true,
    )).toEqual({
      consumedRequestCount: SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0 + 1,
      remainingRegularRequestCount: 0,
    });

    const controller = read(
      "components/scientificWorkbench/ScientificWorkbenchResearchControlV0.tsx",
    );
    expect(controller).toContain("live-request-capacity-reached");
    expect(controller).toContain("disabled={requestCapacityExhausted}");
    expect(controller).toContain("reserveControllerRequest(true)");
    expect(controller).toContain('current.phase === "live-forking"');
    expect(controller).toContain("operationGenerationRef.current += 1");
    expect(controller).toContain("Live transition cancelled before presentation");
  });

  it("rejects evaluated readbacks and changed accepted state at the fork boundary", () => {
    const forkBoundary = researchControlForkBoundaryFrame(500, 1);
    const sourceBoundary = Object.freeze({
      ...forkBoundary,
      source: "accepted-step" as const,
    });
    expect(() => assertScientificWorkbenchResearchForkBoundaryFrameV0(
      forkBoundary,
      sourceBoundary,
    )).not.toThrow();

    const pressureId = "hemodynamics.pressure.absolute.LA" as const;
    const tamperedPressure = Object.freeze({
      ...forkBoundary,
      values: Object.freeze({
        ...forkBoundary.values,
        [pressureId]: Object.freeze({
          observableId: pressureId,
          value: 12,
          availability: "available" as const,
          quality: "accepted-derived" as const,
        }),
      }),
    });
    expect(() => assertScientificWorkbenchResearchForkBoundaryFrameV0(
      tamperedPressure,
      sourceBoundary,
    )).toThrow(/stale losses/);

    const volumeId = "hemodynamics.volume.LA" as const;
    const tamperedVolume = Object.freeze({
      ...forkBoundary,
      values: Object.freeze({
        ...forkBoundary.values,
        [volumeId]: Object.freeze({
          ...forkBoundary.values[volumeId],
          value: 2,
        }),
      }),
    });
    expect(() => assertScientificWorkbenchResearchForkBoundaryFrameV0(
      tamperedVolume,
      sourceBoundary,
    )).toThrow(/state-owned/);
  });

  it("shares one immutable research-control snapshot across controller mirrors", async () => {
    const source = await researchControlStoreSource();
    const store = createScientificWorkbenchResearchControlStoreV0(source, 21);
    const initial = store.getSnapshot();
    const calls: string[] = [];
    const ownerActions: ScientificWorkbenchResearchControlOwnerActionsV0 = {
      setSystemicScale: (value) => calls.push(`systemic:${value}`),
      setPulmonaryScale: (value) => calls.push(`pulmonary:${value}`),
      commitSystemicScale: (value) => calls.push(`commit-systemic:${value}`),
      commitPulmonaryScale: (value) => calls.push(`commit-pulmonary:${value}`),
      setMode: (mode) => calls.push(`mode:${mode}`),
      applyTransition: () => calls.push("apply"),
      cancelSteady: () => calls.push("cancel"),
      pauseLive: () => calls.push("pause"),
      resumeLive: () => calls.push("resume"),
      resetLiveOrFailure: () => calls.push("reset"),
    };
    const token = Symbol("owner");
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });
    const disconnect = store.connectOwner(token, { current: ownerActions });

    expect(store.getSnapshot().ownerConnected).toBe(true);
    expect(store.getSnapshot().actions).toBe(initial.actions);
    expect(store.getSnapshot().mode).toBe("live");
    store.actions.setMode("live");
    store.actions.setSystemicScale(1.3333333333333333);
    store.actions.commitPulmonaryScale(0.75);
    store.actions.applyTransition();
    expect(calls).toEqual([
      "mode:live",
      "systemic:1.3333333333333333",
      "commit-pulmonary:0.75",
      "apply",
    ]);

    const publishedInput = controlSnapshotInput(initial, {
      phase: "live-running",
      mode: "live",
      message: "accepted live steps",
    });
    store.publishOwnerSnapshot(token, publishedInput);
    store.publishOwnerSnapshot(token, publishedInput);
    const published = store.getSnapshot();
    expect(published.frames).toBe(source.frames);
    expect(published.actions).toBe(initial.actions);
    expect(Object.isFrozen(published)).toBe(true);
    expect(Object.isFrozen(published.draft)).toBe(true);
    // A subscribed parent may rerender the owner after publication. Reusing
    // the memoized input must not create a parent/child notification loop.
    expect(notificationCount).toBe(2);

    const markup = renderToStaticMarkup(
      React.createElement(ScientificWorkbenchResearchControlMirrorV0, {
        store,
        surface: "product",
      }),
    );
    expect(markup).toContain('data-owner-connected="true"');
    expect(markup).toContain('data-phase="live-running"');
    expect(markup).toContain("accepted live steps");

    expect(() => store.connectOwner(Symbol("second"), { current: ownerActions }))
      .toThrow(/already has an owner/);
    disconnect();
    expect(store.getSnapshot().ownerConnected).toBe(false);
    expect(store.getSnapshot().frames).toBe(source.frames);
    expect(() => store.actions.pauseLive()).toThrow(/not connected/);
    unsubscribe();
  });
});

const TRANSITION_TEST_RELEASE = Object.freeze({
  id: "transition-test-release",
  version: "0.0.0",
  sha256: "a".repeat(64),
});

function transitionFrame(
  revision: number,
  acceptedTimeSec: number,
): MainWireScientificObservableFrameV1 {
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion:
      MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef: TRANSITION_TEST_RELEASE,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source: "accepted-step",
    revision,
    acceptedTimeSec,
    values: Object.freeze({}) as MainWireScientificObservableFrameV1["values"],
  });
}

function researchControlForkBoundaryFrame(
  revision: number,
  acceptedTimeSec: number,
): MainWireScientificObservableFrameV1 {
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => {
      if (definition.sourceKind === "accepted-state") {
        return [definition.observableId, Object.freeze({
          observableId: definition.observableId,
          value: 1,
          availability: "available" as const,
          quality: "authoritative-state" as const,
        })];
      }
      if (definition.sourceKind === "capability-placeholder") {
        return [definition.observableId, Object.freeze({
          observableId: definition.observableId,
          value: null,
          availability: "not-modeled" as const,
          quality: "not-assessed" as const,
        })];
      }
      if (definition.observableId === "conservation.total_blood_volume.error") {
        return [definition.observableId, Object.freeze({
          observableId: definition.observableId,
          value: 0,
          availability: "available" as const,
          quality: "solver-diagnostic" as const,
        })];
      }
      return [definition.observableId, Object.freeze({
        observableId: definition.observableId,
        value: null,
        availability: "not-evaluated-at-accepted-state" as const,
        quality: "not-assessed" as const,
      })];
    }),
  ) as MainWireScientificObservableFrameV1["values"];
  return Object.freeze({
    ...transitionFrame(revision, acceptedTimeSec),
    source: "research-control-state-fork" as const,
    values: Object.freeze(values),
  });
}

async function researchControlStoreSource(): Promise<
  ScientificWorkbenchResearchControlSourceV0
> {
  const controlState =
    await createMainWireScientificResearchControlBaselineTargetStateV0();
  const frame = transitionFrame(100, 1);
  return Object.freeze({
    sessionId: "shared-source-session",
    context: Object.freeze({
      stateIdentity: Object.freeze({
        revision: frame.revision,
        acceptedTimeSec: frame.acceptedTimeSec,
        totalBloodVolumeMl: 4_800,
      }),
      controlState,
      parameterEpoch: 0,
    }),
    frames: Object.freeze([frame]),
  });
}

function controlSnapshotInput(
  snapshot: ReturnType<
    ReturnType<typeof createScientificWorkbenchResearchControlStoreV0>["getSnapshot"]
  >,
  patch: Partial<ScientificWorkbenchResearchControlSnapshotInputV0>,
): ScientificWorkbenchResearchControlSnapshotInputV0 {
  const { actions: _actions, ownerConnected: _ownerConnected, ...input } = snapshot;
  return Object.freeze({ ...input, ...patch });
}

function read(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

function renderProductRoute(initialEntry: string): string {
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
