import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";
import {
  resolveMainWireScientificResearchPresetV1,
} from "@/engine/scientific/worker/MainWireScientificResearchPresetResolverV1";

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
  it("publishes nine lowercase metadata-only research entries without official trust", () => {
    const catalog = MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1;

    expect(catalog.entries).toHaveLength(9);
    expect(catalog.entries.map((entry) => entry.presetId))
      .toEqual(MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_IDS_V1);
    expect(new Set(catalog.entries.map((entry) => entry.presetId)).size).toBe(9);
    for (const entry of catalog.entries) {
      expect(entry.presetId).toBe(entry.presetId.toLowerCase());
      expect(entry.presetVersion).toBe("1.0.0");
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
    expect(serialized).not.toContain("releaseRef");
    expect(serialized).not.toContain("resolvedParameters");
    expect(serialized).not.toContain("sessionInputSha256");
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
