import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import artifactJson from "@/artifacts/transient-preload/pva-geometry-domain-diagnostics-v2.json";
import phaseWiseArtifactJson from "@/artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json";
import { PvaResearchDiagnosticViewV1 } from "@/components/research/PvaResearchDiagnosticViewV1";
import {
  filterPvaResearchRowsV1,
  projectPvaPhaseWiseEmaxDisplayV1,
  projectPvaResearchDatasetV1,
  summarizePvaResearchRowsV1,
  type PvaGeometryDomainArtifactInputV2,
  type PvaPhaseWiseEmaxArtifactInputV1,
} from "@/components/research/PvaResearchDiagnosticsV1";
import i18n from "@/i18n";

const DATASET = projectPvaResearchDatasetV1(
  artifactJson as unknown as PvaGeometryDomainArtifactInputV2,
);
const EMAX_DATASET = projectPvaPhaseWiseEmaxDisplayV1(
  phaseWiseArtifactJson as unknown as PvaPhaseWiseEmaxArtifactInputV1,
);

describe("PVA research diagnostic view V1", () => {
  it("projects the V2 result without promoting a generic PVA", () => {
    expect(DATASET.rows).toHaveLength(168);
    expect(DATASET.sourceAvailableRowCount).toBe(105);
    expect(DATASET.uniqueBeatWorkCount).toBe(42);
    expect(DATASET.exactlyClosedBeatWorkCount).toBe(0);
    expect(DATASET.domainSupportedRowCount).toBe(0);
    expect(DATASET.productDisplayReady).toBe(false);
    expect(DATASET.genericPvaEstablished).toBe(false);

    const first = DATASET.rows[0]!;
    expect(first.rowId).toBe("LV:1:occlusion:baseline-anchored-isochronal");
    expect(first.acceptedOpenPathJ).toBe(1.28645655683512);
    expect(first.references["dynamic-maximum-volume"].classification).toBe(
      "out-of-domain",
    );
    expect(
      first.references["intrinsic-passive-center-slice"].classification,
    ).toBe("transient-pva-like-area");
  });

  it("reclassifies the same method rows when the passive reference changes", () => {
    const dynamicRows = filterPvaResearchRowsV1(DATASET, {
      referenceId: "dynamic-maximum-volume",
      ventricleId: "all",
      systolicMethodId: "all",
      classification: "all",
    });
    const intrinsicRows = filterPvaResearchRowsV1(DATASET, {
      referenceId: "intrinsic-passive-center-slice",
      ventricleId: "all",
      systolicMethodId: "all",
      classification: "all",
    });

    expect(summarizePvaResearchRowsV1(dynamicRows)).toEqual({
      "domain-supported-pva": 0,
      "transient-pva-like-area": 21,
      "out-of-domain": 84,
      "relation-inadmissible": 21,
      "method-unavailable": 42,
    });
    expect(summarizePvaResearchRowsV1(intrinsicRows)).toEqual({
      "domain-supported-pva": 0,
      "transient-pva-like-area": 61,
      "out-of-domain": 44,
      "relation-inadmissible": 21,
      "method-unavailable": 42,
    });
  });

  it("projects phase-wise candidates and baseline EW + PE without promotion", () => {
    expect(EMAX_DATASET.rows).toHaveLength(2);
    expect(EMAX_DATASET.operationalEmaxEstablished).toBe(false);
    expect(EMAX_DATASET.genericPvaEstablished).toBe(false);
    expect(
      EMAX_DATASET.rows.map((row) => ({
        ventricleId: row.ventricleId,
        phaseIndex: row.selectedPhaseIndex,
        pvaJ: row.pressureVolumeAreaJ,
        extrapolationFraction: row.extrapolationFraction,
      })),
    ).toEqual([
      {
        ventricleId: "LV",
        phaseIndex: 8,
        pvaJ: 1.581500908199982,
        extrapolationFraction: 0.4518868571139322,
      },
      {
        ventricleId: "RV",
        phaseIndex: 7,
        pvaJ: 0.5884018254881368,
        extrapolationFraction: 0.12489082104389465,
      },
    ]);
  });

  it("refuses to present an artifact that claims product-qualified PVA", () => {
    const claimed = structuredClone(artifactJson);
    claimed.interpretation.existingAbsolutePvaReadyForProductDisplay = true;

    expect(() =>
      projectPvaResearchDatasetV1(
        claimed as unknown as PvaGeometryDomainArtifactInputV2,
      ),
    ).toThrow(/cannot project a product-qualified claim/);
  });

  it("validates phase lineage and V2 row uniqueness before presentation", () => {
    const phaseTamper = structuredClone(phaseWiseArtifactJson);
    phaseTamper.phaseFits[0]!.phase01 = 0.25;
    expect(() =>
      projectPvaPhaseWiseEmaxDisplayV1(
        phaseTamper as unknown as PvaPhaseWiseEmaxArtifactInputV1,
      ),
    ).toThrow(/invalid retained phase/);

    const rowTamper = structuredClone(artifactJson);
    rowTamper.rows[1] = structuredClone(rowTamper.rows[0]!);
    expect(() =>
      projectPvaResearchDatasetV1(
        rowTamper as unknown as PvaGeometryDomainArtifactInputV2,
      ),
    ).toThrow(/duplicate PVA geometry row/);
  });

  it("preserves an undefined closure fraction instead of coercing it to zero", () => {
    const zeroWork = structuredClone(artifactJson);
    Object.assign(zeroWork.beatWorkDiagnostics[0]!, {
      acceptedOpenPathJ: 0,
      syntheticStraightClosureJ: 0,
      syntheticClosureAbsoluteFractionOfAcceptedOpenPath: null,
    });
    const dataset = projectPvaResearchDatasetV1(
      zeroWork as unknown as PvaGeometryDomainArtifactInputV2,
    );

    expect(dataset.rows[0]!.syntheticClosureFraction).toBeNull();
  });

  it("filters by ventricle, method, and classification without losing beat work", () => {
    const rows = filterPvaResearchRowsV1(DATASET, {
      referenceId: "intrinsic-passive-center-slice",
      ventricleId: "RV",
      systolicMethodId: "semilunar-closure",
      classification: "method-unavailable",
    });

    expect(rows).toHaveLength(21);
    expect(rows.every((row) => row.ventricleId === "RV")).toBe(true);
    expect(
      rows.every((row) => row.systolicMethodId === "semilunar-closure"),
    ).toBe(true);
    expect(rows.every((row) => Number.isFinite(row.acceptedOpenPathJ))).toBe(
      true,
    );

    const inadmissible = filterPvaResearchRowsV1(DATASET, {
      referenceId: "intrinsic-passive-center-slice",
      ventricleId: "RV",
      systolicMethodId: "minimum-volume",
      classification: "relation-inadmissible",
    });
    expect(inadmissible).toHaveLength(21);
    expect(
      inadmissible.every(
        (row) =>
          row.reference.reasons[0] === "systolic-relation-nonpositive-slope",
      ),
    ).toBe(true);
  });

  it("renders an explicit research boundary and no unqualified headline value", async () => {
    await i18n.changeLanguage("en");
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/en/dev/research/pva"]}>
        <Routes>
          <Route
            path="/:locale/dev/research/pva"
            element={<PvaResearchDiagnosticViewV1 />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(markup).toContain('data-testid="pva-research-diagnostic-view-v1"');
    expect(markup).toContain("PVA geometry diagnostics");
    expect(markup).toContain("Not ready for a product PVA readout");
    expect(markup).toContain("Phase-wise Emax candidate and periodic PVA");
    expect(markup).toContain('data-testid="pva-emax-card-LV"');
    expect(markup).toContain("1.582 J");
    expect(markup).toContain("0.588 J");
    expect(markup).toContain("Domain-supported PVA");
    expect(markup).toContain("0 / 42");
    expect(markup).toContain("Relation inadmissible");
    expect(markup).toContain(
      "Internal research view backed only by the checked-in V2 result",
    );
    expect(markup).not.toContain("Generic PVA:");
    expect(markup).not.toContain("Product PVA:");
  });

  it("renders finite scientific reasons in Japanese rather than artifact prose", async () => {
    await i18n.changeLanguage("ja");
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/ja/dev/research/pva"]}>
        <Routes>
          <Route
            path="/:locale/dev/research/pva"
            element={<PvaResearchDiagnosticViewV1 />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(markup).toContain(
      "Dynamic reference fitが宣言済みsearch gridの境界に接しています。",
    );
    expect(markup).not.toContain(
      "dynamic reference fit touches a declared search-grid boundary",
    );
  });
});
