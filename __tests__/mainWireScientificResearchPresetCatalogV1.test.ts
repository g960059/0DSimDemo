import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import {
  resolveMainWireScientificResearchPresetV1,
} from "@/engine/scientific/worker/MainWireScientificResearchPresetResolverV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
  SCIENTIFIC_PRODUCT_CASE_IDS_V1,
  SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
  resolveScientificProductCaseRouteV1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  ScientificProductCasesGridV1,
} from "@/components/scientificProduct/ScientificProductCasesGridV1";

const BRACKET_BY_PRESET_ID = {
  "main-wire/healthy-cold": null,
  "main-wire/as-severe": "AS-severe",
  "main-wire/ar-severe": "AR-severe",
  "main-wire/ms-severe": "MS-severe",
  "main-wire/mr-severe": "MR-severe",
  "main-wire/ts-severe": "TS-severe",
  "main-wire/tr-severe": "TR-severe",
  "main-wire/ps-severe": "PS-severe",
  "main-wire/pr-severe": "PR-severe",
} as const;

describe("main-wire scientific research preset catalog V1", () => {
  it("publishes nine release-pinned research entries without official trust", () => {
    const catalog = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1;

    expect(catalog.entries).toHaveLength(9);
    expect(catalog.entries.map((entry) => entry.presetId))
      .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1);
    expect(new Set(catalog.entries.map((entry) => entry.presetId)).size).toBe(9);
    expect(catalog.releaseRef).toEqual({
      id: "circleheart/adult-five-wall-noncoronary",
      version: "0.2.0",
      sha256:
        "aa1947dc572b94370044e97efc03e3e62b000657a2fd580be7883d2b0774e48a",
    });
    for (const entry of catalog.entries) {
      expect(entry.presetId).toBe(entry.presetId.toLowerCase());
      expect(entry.presetVersion).toBe("1.0.0");
      expect(entry.documentChainBinding).toEqual({
        presetDocumentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        caseDocumentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        workspaceDocumentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(entry.claims).toEqual({
        classification: "research-bracket-not-clinical",
        officialTrustClaimed: false,
        clinicalDiagnosisClaimed: false,
        clinicalValidationClaimed: false,
        patientSpecificFitClaimed: false,
        parameterSearchPerformed: false,
        parameterFittingPerformed: false,
      });
    }

    const serialized = JSON.stringify(catalog);
    expect(serialized).toContain("releaseRef");
    expect(serialized).toContain("documentChainBinding");
    expect(serialized).toContain("sessionInputSha256");
    expect(serialized).not.toContain("resolvedParameters");
    expect(serialized).not.toContain("officialDesignation");
  });

  it("resolves every exact preset ref to a unique immutable session input", async () => {
    const resolved = await Promise.all(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.map(
        async (preset) => resolveMainWireScientificResearchPresetV1({
          presetId: preset.presetId,
          presetVersion: preset.presetVersion,
        }),
      ),
    );

    expect(new Set(
      resolved.map((item) => item.resolvedSessionInput.sessionInputSha256),
    ).size).toBe(9);
    for (const item of resolved) {
      expect(item.intent.releaseRef).toEqual(item.releaseRef);
      expect(item.resolvedSessionInput.releaseRef).toEqual(item.releaseRef);
      const bracketId = BRACKET_BY_PRESET_ID[item.preset.presetId];
      expect(item.resolvedSessionInput.resolvedParameters.circulationRuntime
        .valvePreset.bracketIds).toEqual(bracketId === null ? [] : [bracketId]);
    }
  });

  it("fails closed for unknown, changed, malformed, or ambiguous refs", async () => {
    await expect(resolveMainWireScientificResearchPresetV1({
      presetId: "main-wire/healthy",
      presetVersion: "1.0.0",
    })).rejects.toThrow(/unsupported preset id/);
    await expect(resolveMainWireScientificResearchPresetV1({
      presetId: "main-wire/healthy-cold",
      presetVersion: "1.0.1",
    })).rejects.toThrow(/unsupported preset version/);
    await expect(resolveMainWireScientificResearchPresetV1({
      presetId: "MAIN-WIRE\/AS-SEVERE",
      presetVersion: "1.0.0",
    })).rejects.toThrow(/unsupported preset id/);
    await expect(resolveMainWireScientificResearchPresetV1({
      presetId: "main-wire/healthy-cold",
      presetVersion: "1.0.0",
      fallback: "healthy",
    })).rejects.toThrow(/exactly presetId and presetVersion/);
    await expect(resolveMainWireScientificResearchPresetV1(null))
      .rejects.toThrow(/preset ref must be an object/);
  });
});

describe("scientific product case catalog V1", () => {
  it("exposes one exact official case and the eight valve research brackets", () => {
    const valveResearchIds = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1.slice(1);
    expect(SCIENTIFIC_PRODUCT_CASE_CATALOG_V1).toHaveLength(9);
    expect(SCIENTIFIC_PRODUCT_CASE_IDS_V1).toEqual([
      "circleheart/official-healthy-periodic",
      ...valveResearchIds,
    ]);
    expect(SCIENTIFIC_PRODUCT_CASE_IDS_V1)
      .not.toContain("main-wire/healthy-cold");
    expect(new Set(SCIENTIFIC_PRODUCT_CASE_IDS_V1).size).toBe(9);

    const [official, ...research] = SCIENTIFIC_PRODUCT_CASE_CATALOG_V1;
    expect(official).toMatchObject({
      caseId: SCIENTIFIC_PRODUCT_OFFICIAL_HEALTHY_CASE_ID_V1,
      kind: "official-exact-periodic",
      source: {
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
        initialization: "exact-v3-checkpoint",
      },
      claims: {
        clinicalValidationClaimed: false,
        patientSpecificFitClaimed: false,
      },
    });
    expect(research.map((entry) => entry.caseId))
      .toEqual(valveResearchIds);
    for (const entry of research) {
      expect(entry.kind).toBe("research-bracket");
      expect(entry.claims).toMatchObject({
        classification: "research-bracket-not-clinical",
        officialTrustClaimed: false,
        clinicalDiagnosisClaimed: false,
        clinicalValidationClaimed: false,
        patientSpecificFitClaimed: false,
      });
    }
  });

  it("resolves exact route ids, encoded ids, and only the retained legacy aliases", () => {
    expect(resolveScientificProductCaseRouteV1("main-wire/as-severe"))
      .toMatchObject({
        canonicalCaseId: "main-wire/as-severe",
        aliasApplied: null,
      });
    expect(resolveScientificProductCaseRouteV1("main-wire%2Fmr-severe"))
      .toMatchObject({
        requestedCaseId: "main-wire/mr-severe",
        canonicalCaseId: "main-wire/mr-severe",
        aliasApplied: null,
      });
    expect(resolveScientificProductCaseRouteV1("normal-sinus"))
      .toMatchObject({
        canonicalCaseId: "circleheart/official-healthy-periodic",
        aliasApplied: "normal-sinus",
        caseEntry: { kind: "official-exact-periodic" },
      });
    expect(resolveScientificProductCaseRouteV1("aortic-stenosis"))
      .toMatchObject({
        canonicalCaseId: "main-wire/as-severe",
        aliasApplied: "aortic-stenosis",
        caseEntry: { kind: "research-bracket" },
      });
    expect(resolveScientificProductCaseRouteV1("unknown-case")).toBeNull();
    expect(resolveScientificProductCaseRouteV1("MAIN-WIRE/AS-SEVERE")).toBeNull();
    expect(resolveScientificProductCaseRouteV1("%ZZ")).toBeNull();
    expect(resolveScientificProductCaseRouteV1(" ")).toBeNull();
  });

  it("renders product links with stable encoded case ids and visible claim boundaries", () => {
    const markup = renderToStaticMarkup(React.createElement(
      MemoryRouter,
      null,
      React.createElement(ScientificProductCasesGridV1, {
        locale: "ja",
        openLabel: "Open case",
      }),
    ));

    expect(markup.match(/data-case-id=/g)).toHaveLength(9);
    expect(markup).toContain(
      "/ja/workbench/circleheart%2Fofficial-healthy-periodic?from=cases",
    );
    expect(markup).toContain(
      "/ja/workbench/main-wire%2Fas-severe?from=cases",
    );
    expect(markup).not.toContain("main-wire%2Fhealthy-cold");
    expect(markup).toContain("Official catalog reference");
    expect(markup).toContain("not a diagnosis, clinical validation");
  });
});
