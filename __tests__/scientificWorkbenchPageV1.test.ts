import { readFileSync } from "node:fs";
import path from "node:path";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ScientificWorkbenchPageV1 from "@/components/scientificWorkbench/ScientificWorkbenchPageV1";
import ScientificBrowserPerformanceLabV0 from "@/components/scientificPerformance/ScientificBrowserPerformanceLabV0";

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

  it("is routed separately without replacing the legacy workbench", () => {
    const source = read("index.tsx");
    expect(source).toContain('path="scientific-workbench"');
    expect(source).toContain('path="workbench"');
    expect(source).toContain(
      "./components/scientificWorkbench/ScientificWorkbenchPageV1",
    );
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
});

function read(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}
