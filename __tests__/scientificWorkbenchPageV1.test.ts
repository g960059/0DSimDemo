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
  createScientificProductEvidenceReportV1,
} from "@/components/scientificProduct/ScientificProductEvidenceReportV1";
import type {
  ScientificProductQuickCheckRecordV1,
} from "@/components/scientificProduct/ScientificProductQuickCheckRegistryV1";
import {
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import ScientificWorkbenchPageV1 from "@/components/scientificWorkbench/ScientificWorkbenchPageV1";
import ScientificBrowserPerformanceLabV0 from "@/components/scientificPerformance/ScientificBrowserPerformanceLabV0";
import {
  ScientificProductEvidencePageV1,
  type ScientificProductEvidenceSelectedReportV1,
} from "@/components/scientificVerification/ScientificProductEvidencePageV1";
import {
  createScientificProductEvidenceExplorerMetricsV1,
  filterScientificProductEvidenceExplorerMetricsV1,
  scientificProductEvidenceMetricCountsV1,
} from "@/components/scientificVerification/ScientificProductEvidenceMetricExplorerV1";
import {
  appendScientificWorkbenchLiveFramesV0,
  assertScientificWorkbenchResearchForkBoundaryFrameV0,
  ScientificWorkbenchResearchControlMirrorV0,
  remainingScientificWorkbenchRegularRequestCountV0,
  reserveScientificWorkbenchRequestIdentityV0,
  scientificWorkbenchDisplayedFrameOwnerV0,
  SCIENTIFIC_WORKBENCH_LIVE_HISTORY_FRAME_LIMIT_V0,
  SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0,
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
  it("keeps the metric explorer presentational, searchable, and progressively disclosed", () => {
    const markup = renderToStaticMarkup(React.createElement(
      ScientificProductEvidencePageV1,
      {
        currentSessions: [{ key: "current", name: "Current run" }],
        presets: [{ key: "healthy", name: "Healthy adult" }],
        savedScenarios: [{ key: "saved", name: "Saved HFrEF" }],
        selectedSubjectKey: "current",
        selectedReport: {
          subjectKey: "current",
          status: "verification-error",
          message: "Quick checks are shown without claiming a completed full suite.",
          validation: {
            status: "findings",
            message: "One contextual comparison needs review.",
            items: [{
              id: "ci",
              label: "Cardiac index",
              section: "overall",
              status: "finding",
              observedValue: "1.8 L/min/m²",
              referenceRange: "2.5–4.0 L/min/m²",
              referenceIds: ["reference-1"],
            }, {
              id: "mitral-flow",
              label: "Mitral flow description",
              section: "valve-flow",
              status: "not-assessed",
              observedValue: "Forward-flow dominant",
            }, {
              id: "waveform-availability",
              label: "Pressure waveform availability",
              section: "waveform",
              status: "within-reference",
              observedValue: "Available",
            }],
            healthyReference: {
              title: "Resting healthy adult",
              description: "A contextual comparator, not a universal normal.",
              attributes: [{ id: "posture", label: "Posture", value: "Supine" }],
            },
            references: [{
              id: "reference-1",
              label: "Reference 1",
              citation: "Healthy adult hemodynamic reference",
              href: "/references/healthy",
            }],
          },
          evidenceSource: "Current committed evidence",
          controlStateSha256: "release-sha256",
          parameterEpoch: 2,
          fullSuiteStatus: {
            status: "not-run",
            detail: "Time-step refinement and multi-start checks have not been run.",
          },
          verificationItems: [{
            id: "solver",
            label: "Solver closure",
            status: "error",
            detail: "The numerical result is not interpretable.",
          }],
          summaryFacts: [{ id: "scope", label: "Scope", value: "Quick checks" }],
          claimBoundaries: ["Not clinical validation"],
        },
        onSelect: () => {},
        onBack: () => {},
        onSaveCurrent: () => {},
        onOpenCurrent: () => {},
        onOpenPreset: () => {},
        onOpenSaved: () => {},
        onDeleteSaved: () => {},
      },
    ));
    const source = read(
      "components/scientificVerification/ScientificProductEvidencePageV1.tsx",
    );

    for (const marker of [
      "Current session",
      "Presets",
      "My scenarios",
      'role="search"',
      'id="scientific-evidence-metric-search-v1"',
      'name="scientific-evidence-status-filter-v1"',
      'value="all"',
      'value="review"',
      'value="meets"',
      'value="unassessed"',
      'aria-label="Type"',
      'aria-label="Area"',
      'data-testid="scientific-product-metric-tile-v1"',
      'data-evidence-domain="verification"',
      'data-evidence-domain="validation"',
      'data-evidence-kind="verification-error"',
      'data-evidence-kind="validation-finding"',
      'data-validation-section="overall"',
      'data-validation-section="valve-flow"',
      'data-validation-section="waveform"',
      'data-effective-status="not-assessed"',
      'data-filter-bucket="review"',
      'data-filter-bucket="unassessed"',
      "Model checks",
      "Search by name or abbreviation…",
      "Technical details",
      "Calculation checks",
      "Reference comparisons",
      "Overall circulation",
      "Valves &amp; flow",
      "Waveforms",
      "Calculation error",
      "Outside range",
      "No target",
      "1.8 L/min/m²",
      "Save",
    ]) expect(markup).toContain(marker);
    for (const implementationDetail of [
      'id="summary"',
      "Quick checks are shown without claiming a completed full suite.",
      "Current committed evidence",
      "release-sha256",
      "Parameter epoch",
      "Quick checks",
      "Time-step refinement and multi-start checks have not been run.",
      "Resting healthy adult",
      "2.5–4.0 L/min/m²",
      "Healthy adult hemodynamic reference",
    ]) expect(markup).not.toContain(implementationDetail);
    expect(source).not.toContain("react-router");
    expect(source).not.toContain("ScenarioRegistry");
    expect(source).not.toMatch(/ControlStore|ValidationContext|useContext/);
  });

  it("distinguishes an assessed pass from a scenario that has not been checked", () => {
    const markup = renderToStaticMarkup(React.createElement(
      ScientificProductEvidencePageV1,
      {
        currentSessions: [{ key: "current", name: "Passing run" }],
        presets: [],
        savedScenarios: [],
        selectedSubjectKey: "current",
        selectedReport: {
          subjectKey: "current",
          status: "passed",
          message: "Quick verification and assessed comparisons passed.",
          validation: {
            status: "within-reference",
            message: "All assessed values are within reference.",
            items: [],
            healthyReference: {
              title: "Reference",
              description: "Context only.",
              attributes: [],
            },
          },
          evidenceSource: "Committed P1 cycle",
          controlStateSha256: "a".repeat(64),
          parameterEpoch: 1,
          fullSuiteStatus: { status: "not-run", detail: "Not run." },
          verificationItems: [],
        },
        onSelect: () => {},
        onBack: () => {},
        onSaveCurrent: () => {},
        onOpenCurrent: () => {},
        onOpenPreset: () => {},
        onOpenSaved: () => {},
        onDeleteSaved: () => {},
      },
    ));

    expect(markup).toContain('data-evidence-page-status="passed"');
    expect(markup).toContain("No items need review");
    expect(markup).not.toContain("Not checked");
    expect(markup).not.toContain("Calculation error");
  });

  it("projects exact scientific statuses into simple explorer filter buckets", () => {
    const metrics = createScientificProductEvidenceExplorerMetricsV1(
      evidenceMetricExplorerReport(),
      "en",
    );

    expect(scientificProductEvidenceMetricCountsV1(metrics)).toEqual({
      all: 9,
      review: 3,
      meets: 3,
      unassessed: 3,
    });
    expect(metrics.find(({ itemId }) => itemId === "waveform-aortic-pressure"))
      .toMatchObject({
        filter: "unassessed",
        source: {
          kind: "validation",
          effectiveStatus: "not-assessed",
        },
      });
    expect(metrics.find(({ itemId }) => itemId === "expected-disease-change"))
      .toMatchObject({ filter: "meets" });
    expect(metrics.find(({ itemId }) => itemId === "solver-warning"))
      .toMatchObject({ filter: "review" });
  });

  it("combines NFKC search with status, domain, and section facets", () => {
    const metrics = createScientificProductEvidenceExplorerMetricsV1(
      evidenceMetricExplorerReport(),
      "ja-JP",
    );
    const filter = (
      query: string,
      status: "all" | "review" | "meets" | "unassessed" = "all",
      domain: "all" | "verification" | "validation" = "all",
      section: "all" | "verification" | "overall" | "valve-flow" | "waveform" = "all",
    ) => filterScientificProductEvidenceExplorerMetricsV1(metrics, {
      query,
      filter: status,
      domain,
      section,
    }).map(({ itemId }) => itemId);

    expect(filter("ＬＶＥＤＶｉ")).toEqual(["healthy.lv.edvi"]);
    expect(filter("左室拡張末期容積係数")).toEqual(["healthy.lv.edvi"]);
    expect(filter("LVESVi", "review", "validation", "overall"))
      .toEqual(["healthy.lv.esvi"]);
    expect(filter("", "all", "verification"))
      .toEqual([
        "steady-state-check",
        "solver-warning",
        "solver-error",
        "future-check",
      ]);
    expect(filter("", "unassessed", "validation", "waveform"))
      .toEqual(["waveform-aortic-pressure"]);
    expect(filter("LVEDVi", "review", "validation", "overall")).toEqual([]);
  });

  it("classifies a scenario calculation failure as a verification error", () => {
    const report = createScientificProductEvidenceReportV1({
      subjectKey: "session:failed",
      subjectName: "Failed run",
      subjectKind: "current-session",
      record: null,
      builtInDiseasePreset: false,
      releaseId: "test-release",
      releaseVersion: "0.0.0",
      releaseSha256: "a".repeat(64),
      workspaceSha256: null,
      unavailableVerificationError: "Worker settlement failed.",
    });

    expect(report).toMatchObject({
      status: "verification-error",
      message: "Worker settlement failed.",
      evidenceSource: "Scenario calculation failed",
      verificationItems: [{
        id: "scenario-calculation-error",
        status: "error",
        value: "Verification error",
      }],
    });
  });

  it("keeps an explicitly unavailable Studio V&V report idle and not assessed", () => {
    const unavailableMessage =
      "Studio V&V reports are not connected to this product surface yet.";
    const report = createScientificProductEvidenceReportV1({
      subjectKey: "session:studio-v1",
      subjectName: "Studio live run",
      subjectKind: "current-session",
      record: null,
      builtInDiseasePreset: false,
      releaseId: "test-release",
      releaseVersion: "0.0.0",
      releaseSha256: "a".repeat(64),
      workspaceSha256: null,
      unavailableMessage,
    });

    expect(report).toMatchObject({
      status: "idle",
      message: unavailableMessage,
      evidenceSource: "No report in this session",
      controlStateSha256: null,
      parameterEpoch: null,
      verificationItems: [],
      validation: {
        status: "not-assessed",
        message: "No committed P1 cycle is available for comparison.",
        items: [],
      },
      fullSuiteStatus: { status: "not-run" },
    });
  });

  it("never classifies an empty failed-cycle validation context as within range", () => {
    const record = {
      status: "verification-error",
      message: "The committed target did not settle.",
      committedControlStateSha256: "d".repeat(64),
      parameterEpoch: 6,
      evidenceSource: "hidden-committed-target",
      cacheHit: false,
      validation: {
        cycleAvailable: false,
        referenceResults: [],
        numericalResults: [],
        valveFlow: [],
        waveformAvailability: [],
      },
    } as unknown as ScientificProductQuickCheckRecordV1;
    const report = createScientificProductEvidenceReportV1({
      subjectKey: "session:failed-cycle",
      subjectName: "Failed cycle",
      subjectKind: "current-session",
      record,
      builtInDiseasePreset: false,
      releaseId: "test-release",
      releaseVersion: "0.0.0",
      releaseSha256: "a".repeat(64),
      workspaceSha256: null,
    });

    expect(report.status).toBe("verification-error");
    expect(report.validation.status).toBe("not-assessed");
    expect(report.validation.message).toBe("No complete-cycle comparison is available.");
    expect(report.validation.items).toEqual([]);
    expect(report.validation.message).not.toContain("within");
  });

  it("keeps an unavailable reference comparison distinct from an out-of-range finding", () => {
    const record = {
      status: "passed",
      message: "Quick check passed.",
      committedControlStateSha256: "b".repeat(64),
      parameterEpoch: 3,
      evidenceSource: "hidden-committed-target",
      cacheHit: false,
      validation: {
        cycleAvailable: true,
        referenceResults: [{
          gateId: "unavailable-reference",
          label: "Unavailable comparison",
          value: null,
          unit: "mmHg",
          lowerInclusive: 1,
          upperInclusive: 2,
          status: "unavailable",
          interpretation: "The source metric was unavailable.",
          sourceIds: [],
        }],
        numericalResults: [],
        valveFlow: [],
        waveformAvailability: [],
      },
    } as unknown as ScientificProductQuickCheckRecordV1;
    const report = createScientificProductEvidenceReportV1({
      subjectKey: "session:unavailable",
      subjectName: "Unavailable run",
      subjectKind: "current-session",
      record,
      builtInDiseasePreset: false,
      releaseId: "test-release",
      releaseVersion: "0.0.0",
      releaseSha256: "a".repeat(64),
      workspaceSha256: null,
    });

    expect(report.status).toBe("not-assessed");
    expect(report.message).toContain("could not be assessed");
    expect(report.message).not.toContain("outside the stated range");
    expect(report.validation.items[0]?.status).toBe("not-assessed");
    expect(report.validation.message).toContain("was not assessed");

    const markup = renderToStaticMarkup(React.createElement(
      ScientificProductEvidencePageV1,
      {
        currentSessions: [{ key: report.subjectKey, name: "Unavailable run" }],
        presets: [],
        savedScenarios: [],
        selectedSubjectKey: report.subjectKey,
        selectedReport: report,
        onSelect: () => {},
        onBack: () => {},
        onSaveCurrent: () => {},
        onOpenCurrent: () => {},
        onOpenPreset: () => {},
        onOpenSaved: () => {},
        onDeleteSaved: () => {},
      },
    ));
    expect(markup).toContain("Some comparisons could not be assessed");
    expect(markup).not.toContain("No items need review");
  });

  it("keeps disease-preset misses visible and formats EF and valve values as separate metrics", () => {
    const record = {
      status: "passed",
      message: "Quick check passed.",
      committedControlStateSha256: "c".repeat(64),
      parameterEpoch: 5,
      evidenceSource: "hidden-committed-target",
      cacheHit: false,
      validation: {
        cycleAvailable: true,
        referenceResults: [{
          gateId: "healthy.lv.ef",
          label: "LV ejection fraction",
          value: 0.4,
          unit: "fraction",
          lowerInclusive: 0.52,
          upperInclusive: 0.74,
          status: "outside-reference",
          interpretation: "Outside the broad healthy-adult range.",
          sourceIds: [],
        }],
        numericalResults: [],
        valveFlow: [{
          valveId: "AoV",
          forwardVolumeMl: 71,
          reverseVolumeMl: 2,
          regurgitantFractionPercent: 2.8,
          peakGradientMmHg: 12,
          meanGradientMmHg: 6,
        }],
        waveformAvailability: [],
      },
    } as unknown as ScientificProductQuickCheckRecordV1;
    const report = createScientificProductEvidenceReportV1({
      subjectKey: "preset:hfref",
      subjectName: "HFrEF",
      subjectKind: "preset",
      record,
      builtInDiseasePreset: true,
      releaseId: "test-release",
      releaseVersion: "0.0.0",
      releaseSha256: "a".repeat(64),
      workspaceSha256: null,
    });

    expect(report.validation.items.find(({ id }) => id === "healthy.lv.ef"))
      .toMatchObject({
        status: "finding",
        numericValue: 40,
        unit: "%",
        referenceLowerInclusive: 52,
        referenceUpperInclusive: 74,
      });
    expect(report.validation.items.filter(({ id }) => id.startsWith("valve-flow-AoV-")))
      .toHaveLength(5);
  });

  it("keeps Studio V&V explicitly unavailable without mounting the legacy Quick Check owner", () => {
    const route = read(
      "components/scientificProduct/ScientificProductWorkbenchRouteV1.tsx",
    );
    const report = read(
      "components/scientificProduct/ScientificProductEvidenceReportV1.ts",
    );

    expect(route).toContain(
      "new ScientificProductStudioScenarioRegistryV1(",
    );
    expect(route).toContain("registry.connect()");
    expect(route).toContain(
      "loadScientificProductStudioScenarioRuntimeV1({",
    );
    expect(route).toContain(
      "const abortController = new AbortController()",
    );
    expect(route).toContain("signal: abortController.signal");
    expect(route).toContain("abortController.abort()");
    expect(route).toContain(
      "const quickCheckSnapshot = EMPTY_STUDIO_QUICK_CHECK_SNAPSHOT_V1",
    );
    expect(route).toContain(
      "Studio V&V reports are not connected to this product surface yet.",
    );
    expect(route).toContain(
      "Live simulation and strict numerical settlement remain active.",
    );
    expect(route).toContain(
      "unavailableMessage: record === null",
    );
    expect(route).not.toContain(
      "new ScientificProductQuickCheckRegistryV1(",
    );
    expect(route).not.toContain("quickCheckRegistry.");
    expect(route).toContain("saveCurrentScenario(scenarioId)");
    expect(route).toContain("onOpenCurrent={openCurrentFromEvidence}");
    expect(route).toContain("setActiveInstanceId(selectedSessionId)");
    expect(route).toContain("if (!writeScientificProductSavedScenarioCatalogV1(next)) return null");
    expect(route).toContain("onOpenFullReport={openEvidenceView}");
    expect(route).toContain('data-workbench-surface-preserved="true"');
    expect(route).not.toContain("{!evidenceViewOpen && <PanelGrid");
    expect(report).toContain(
      "explicitUnavailableMessage === null",
    );
    expect(report).toContain(
      '? "checking" as const\n        : "idle" as const',
    );

    for (const forbidden of [
      "Pending changes",
      "Recompute needed",
      "recompute needed",
      "Preview only",
      "Cannot interpret",
    ]) expect(`${route}\n${report}`).not.toContain(forbidden);
  });

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
      {
        id: "product-guyton-left-v1",
        type: "GUYTON_LEFT",
        timeWindow: undefined,
      },
      {
        id: "product-guyton-right-v1",
        type: "GUYTON_RIGHT",
        timeWindow: undefined,
      },
    ]);
    expect(presentation.panels[0]?.config["scenario-1"]?.selectedSignals)
      .toEqual(["lv"]);
    expect(presentation.panels[0]).toMatchObject({
      showGuides: true,
      pvRelationDisplayMode: "off",
      pvHistoryBeats: 4,
      pvHistoryMode: "fade",
      view: {
        pvHistoryBeats: 4,
        pvHistoryMode: "fade",
        pvRelationDisplayMode: "off",
      },
    });
    expect(presentation.panels[1]?.config["scenario-1"]?.selectedSignals)
      .toEqual([
        "hemodynamics.pressure.absolute.Ao",
        "hemodynamics.pressure.absolute.LV",
        "hemodynamics.pressure.absolute.LA",
      ]);
    expect(presentation.panels[2]?.config["scenario-1"]?.selectedSignals)
      .toEqual(["valve.MV.flow"]);
    for (const panel of presentation.panels.slice(3)) {
      expect(panel.config["scenario-1"]?.selectedSignals).toEqual(["Default"]);
      expect(panel).toMatchObject({
        hemodynamicDetailMode: "compare",
        hemodynamicParameterHistoryCount: 5,
        hemodynamicAllowNegativeFillingPressure: false,
        view: {
          hemodynamicDetailMode: "compare",
          hemodynamicParameterHistoryCount: 5,
          hemodynamicAllowNegativeFillingPressure: false,
        },
      });
    }
    expect(presentation.graphBoardLayout).toEqual({
      type: "split",
      direction: "column",
      children: [
        {
          type: "split",
          direction: "row",
          children: [
            { type: "leaf", graphViewId: "lv-pv" },
            {
              type: "split",
              direction: "column",
              children: [
                {
                  type: "leaf",
                  graphViewId: "product-left-pressure-v1",
                },
                {
                  type: "leaf",
                  graphViewId: "product-mitral-flow-v1",
                },
              ],
              sizes: [0.5, 0.5],
            },
          ],
          sizes: [0.5, 0.5],
        },
        {
          type: "split",
          direction: "row",
          children: [
            { type: "leaf", graphViewId: "product-guyton-left-v1" },
            { type: "leaf", graphViewId: "product-guyton-right-v1" },
          ],
          sizes: [0.5, 0.5],
        },
      ],
      sizes: [8 / 14, 6 / 14],
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
    expect(SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0).toBe(100_000);
    expect(SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0).toBe(16);
    const minimumContinuousLiveMinutes = (
      SCIENTIFIC_WORKBENCH_REQUEST_CAPACITY_V0
      - SCIENTIFIC_WORKBENCH_OFFICIAL_BOOTSTRAP_REQUEST_COUNT_V0
    ) * SCIENTIFIC_WORKBENCH_LIVE_STEPS_PER_COMMAND_V0 * 0.002 / 60;
    expect(minimumContinuousLiveMinutes).toBeGreaterThan(50);
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
    expect(controller).toContain("visibilityAutoPausedRef");
    expect(controller).toContain("will resume when visible");
    expect(controller).toContain("resumed when the tab became visible");
    expect(controller).toContain('current.phase === "live-forking"');
    expect(controller).toContain("operationGenerationRef.current += 1");
    expect(controller).toContain("Live transition cancelled before presentation");
  });

  it("runs Studio presentation at fixed 1× and synchronizes pause/resume across ready branches", () => {
    const route = read(
      "components/scientificProduct/ScientificProductWorkbenchRouteV1.tsx",
    );
    expect(route).toContain("displayClock.configure(isPlaying, 1)");
    expect(route).toContain(
      "const shouldRun = isPlaying && !document.hidden",
    );
    expect(route).toContain(
      "for (const descriptor of registry.getDescriptorSnapshot())",
    );
    expect(route).toContain(
      "if (shouldRun) scenarioRuntime.controlStore.actions.resumeLive()",
    );
    expect(route).toContain(
      "else scenarioRuntime.controlStore.actions.pauseLive()",
    );
    expect(route).toContain(
      "const cancelDeferredStart = scheduleAfterCommittedPaintV1(() =>",
    );
    expect(route).toContain(
      "presentationBoundaryPassed = true",
    );
    expect(route).toContain(
      "if (document.hidden || presentationBoundaryPassed)",
    );
    expect(route).toContain(
      '"visibilitychange",\n      synchronizeVisiblePlayback',
    );
    expect(route).toContain("deferInitialLivePresentation: true");
    expect(route).toContain("togglePlay={toggleStudioPlayback}");
    expect(route).toContain("timeScale={1}");
    expect(route).toContain("setTimeScale={noPhysicsMutation}");
    expect(route).toContain("showTimeScaleControl={false}");
    expect(route).toContain(
      'playLabel={t("workbench.header.resumeLiveTrace")}',
    );
    expect(route).toContain(
      'pauseLabel={t("workbench.header.pauseLiveTrace")}',
    );
    expect(route).not.toContain("playbackRunning={isPlaying}");
    expect(route).not.toContain("playbackTimeScale={timeScale}");
    const productRenderer = read(
      "components/scientificProduct/ScientificWorkbenchRuntimeRendererV1.tsx",
    );
    expect(productRenderer).not.toContain(">Resume<");
    expect(productRenderer).not.toContain(">Reset<");
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
      setControlValue: (controlId, value) =>
        calls.push(`control:${controlId}:${value}`),
      commitControlValue: (controlId, value) =>
        calls.push(`commit-control:${controlId}:${value}`),
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
    store.actions.setSystemicScale(1.5);
    store.actions.commitPulmonaryScale(0.75);
    store.actions.commitControlValue("ventilation.peep-cm-h2o", 10);
    store.actions.applyTransition();
    expect(calls).toEqual([
      "mode:live",
      "systemic:1.5",
      "commit-pulmonary:0.75",
      "commit-control:ventilation.peep-cm-h2o:10",
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

function evidenceMetricExplorerReport(): ScientificProductEvidenceSelectedReportV1 {
  return {
    subjectKey: "current",
    status: "findings",
    message: "Three metrics need review.",
    evidenceSource: "hidden-committed-target",
    controlStateSha256: "a".repeat(64),
    parameterEpoch: 4,
    fullSuiteStatus: { status: "not-run", detail: "Not run." },
    verificationItems: [{
      id: "steady-state-check",
      label: "Committed-target P1 steady state",
      status: "passed",
      value: "Pass",
    }, {
      id: "solver-warning",
      label: "Solver tolerance warning",
      status: "warning",
      value: "Review",
    }, {
      id: "solver-error",
      label: "Solver closure error",
      status: "error",
      value: "Error",
    }, {
      id: "future-check",
      label: "Future numerical check",
      status: "not-run",
      value: "Not run",
    }],
    validation: {
      status: "findings",
      message: "One comparison is outside its stated range.",
      healthyReference: {
        title: "Resting adult research reference",
        description: "Context only.",
        attributes: [],
      },
      items: [{
        id: "healthy.lv.edvi",
        label: "LV end-diastolic volume index",
        searchTerms: ["LVEDVi"],
        section: "overall",
        status: "within-reference",
        observedValue: "70 mL/m²",
        numericValue: 70,
        unit: "mL/m²",
        referenceLowerInclusive: 34,
        referenceUpperInclusive: 76,
        referenceRange: "34–76 mL/m²",
      }, {
        id: "waveform-aortic-pressure",
        label: "Aortic pressure",
        section: "waveform",
        status: "within-reference",
        observedValue: "501 / 501 frames",
      }, {
        id: "expected-disease-change",
        label: "Expected disease change",
        section: "overall",
        status: "expected-deviation",
        observedValue: "Expected",
        referenceRange: "Disease-specific target",
      }, {
        id: "healthy.lv.esvi",
        label: "LV end-systolic volume index",
        searchTerms: ["LVESVi"],
        section: "overall",
        status: "finding",
        observedValue: "34 mL/m²",
        numericValue: 34,
        unit: "mL/m²",
        referenceLowerInclusive: 10,
        referenceUpperInclusive: 29,
        referenceRange: "10–29 mL/m²",
      }, {
        id: "mitral-flow-description",
        label: "Mitral flow description",
        section: "valve-flow",
        status: "not-assessed",
        observedValue: "Forward-flow dominant",
      }],
    },
  };
}

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
