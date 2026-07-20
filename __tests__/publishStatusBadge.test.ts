import React from "react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import {
  PublishStatusBadge,
  publishBadgeClassName,
  publishBadgeKind,
} from "@/components/workbench/PublishStatusBadge";
import {
  EvidenceChecksStatusControl,
  evidenceChecksStatusAppearance,
} from "@/components/workbench/EvidenceChecksStatusControl";
import { WorkbenchHeader } from "@/components/workbench/WorkbenchHeader";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("PublishStatusBadge", () => {
  it("maps missing or draft status to Draft", () => {
    expect(publishBadgeKind()).toBe("draft");
    expect(publishBadgeKind("draft", "private")).toBe("draft");
    expect(publishBadgeClassName("draft")).toContain("border-wb-line");
  });

  it("maps published visibility to Unlisted or Public", () => {
    expect(publishBadgeKind("published", "unlisted")).toBe("unlisted");
    expect(publishBadgeKind("published", "public")).toBe("public");
    expect(publishBadgeClassName("public")).toContain("border-wb-accent/40");
  });

  it("renders the localized badge label", () => {
    const html = renderToString(React.createElement(PublishStatusBadge, {
      status: "published",
      visibility: "unlisted",
      onClick: () => {},
    }));

    expect(html).toContain("Unlisted");
    expect(html).toContain("Publish settings");
  });
});

describe("EvidenceChecksStatusControl", () => {
  it("defaults to a low-noise Checks control with an anchored, reduced-motion popover", () => {
    const html = renderToString(React.createElement(EvidenceChecksStatusControl));

    expect(html).toContain('data-evidence-checks-status="idle"');
    expect(html).toContain(">Checks<");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("origin-top-right");
    expect(html).toContain("duration-150");
    expect(html).toContain("motion-reduce:transition-opacity");
  });

  it("keeps findings separate from verification errors and exposes a reduced-motion checking state", () => {
    expect(evidenceChecksStatusAppearance("checking").iconClassName).toContain("animate-spin");
    expect(evidenceChecksStatusAppearance("checking").iconClassName).toContain("motion-reduce:animate-none");
    expect(evidenceChecksStatusAppearance("passed").triggerClassName).toContain("text-wb-subtle");
    expect(evidenceChecksStatusAppearance("findings").triggerClassName).toContain("text-wb-subtle");
    expect(evidenceChecksStatusAppearance("findings").iconClassName).toContain("text-wb-warning");
    expect(evidenceChecksStatusAppearance("verification-error").triggerClassName).toContain("text-wb-danger");
  });

  it("renders one compact row per scenario and a full-report link", () => {
    const html = renderToString(React.createElement(EvidenceChecksStatusControl, {
      status: "findings",
      scenarios: [
        { id: "healthy", name: "Healthy", status: "idle" },
        {
          id: "hfref",
          name: "HFrEF",
          status: "findings",
          message: "2 reference deviations",
          color: "#38bdf8",
        },
        { id: "custom", name: "Custom scenario", status: "verification-error" },
      ],
      fullReportHref: "/workbench/vv",
    }));

    expect(html.match(/role="listitem"/g)).toHaveLength(3);
    expect(html).toContain("Healthy");
    expect(html).toContain("HFrEF");
    expect(html).toContain("2 reference deviations");
    expect(html).toContain("Verification error");
    expect(html).toContain('href="/workbench/vv"');
    expect(html).toContain("View evidence and checks");
  });

  it("supports a callback-only full report action", () => {
    const html = renderToString(React.createElement(EvidenceChecksStatusControl, {
      onOpenFullReport: () => {},
      fullReportLabel: "Open report",
    }));

    expect(html).toContain("Open report");
    expect(html).not.toContain('href="/workbench/vv"');
  });

  it("occupies the explicit Workbench header slot immediately before Notes", () => {
    const html = renderToString(React.createElement(WorkbenchHeader, {
      mode: "sandbox",
      backHref: "/cases",
      backLabel: "Cases",
      sceneMeta: { title: "Case", description: "", modelLimitations: [] },
      onSceneMetaChange: () => {},
      onPrimaryAction: () => {},
      fileInputRef: React.createRef<HTMLInputElement>(),
      onImportFile: () => {},
      onExport: () => {},
      showPrimaryAction: false,
      isPlaying: false,
      togglePlay: () => {},
      timeScale: 1,
      setTimeScale: () => {},
      noteOpen: false,
      metricsOpen: false,
      rightRailVisible: false,
      metricsSpan: "main",
      hasNotePanel: true,
      onToggleNote: () => {},
      onToggleMetrics: () => {},
      onToggleRightRail: () => {},
      onMetricsSpanChange: () => {},
      theme: "dark",
      onThemeChange: () => {},
      evidenceChecksControl: React.createElement(EvidenceChecksStatusControl),
    }));

    const evidenceSlot = html.indexOf("data-workbench-header-evidence-checks-slot");
    const notesToggle = html.indexOf('aria-label="Toggle note drawer"');

    expect(evidenceSlot).toBeGreaterThan(-1);
    expect(notesToggle).toBeGreaterThan(evidenceSlot);
    expect(html).not.toContain("Morphology check");
    expect(html).not.toContain("Simulation health");
    expect(html).not.toContain("Save case");
  });
});
