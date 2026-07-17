import { describe, expect, it } from "vitest";

import {
  buildMainWireScientificDocumentChainV1,
} from "@/engine/scientific/documents";
import {
  MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1,
} from "@/engine/scientific/presets/mainWireScientificResearchPresetCatalogV1";

describe("main-wire scientific document chain V1", () => {
  it("builds verified release-bound preset, case, and default workspace documents", async () => {
    const chain = await buildMainWireScientificDocumentChainV1({
      presetId: "main-wire/mr-severe",
      presetVersion: "1.0.0",
    });

    expect(chain).toMatchObject({
      chainId: "main-wire-scientific-document-chain-v1",
      presetDocument: {
        ref: { sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
        content: {
          schemaVersion: 1,
          sourceIntent: {
            parameterOperations: [{ bracketId: "MR-severe" }],
          },
        },
      },
      caseDocument: {
        ref: { sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
        content: {
          schemaVersion: 1,
          startDescriptor: { kind: "release-resolved-cold-start" },
          protocolDescriptor: {
            protocolId:
              "main-wire-normal-adult-five-wall-periodic-steady-v1",
            protocolVersion: "1.0.0",
          },
          resolvedSessionInput: {
            resolvedParameters: {
              circulationRuntime: {
                valvePreset: { bracketIds: ["MR-severe"] },
              },
            },
          },
        },
      },
      workspaceDocument: {
        ref: { sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
        content: { schemaVersion: 1, revision: 0, notes: null },
      },
    });
    expect(chain.caseDocument.content.lineage).toEqual({
      kind: "preset-instantiation",
      sourcePresetRef: chain.presetDocument.ref,
      parentCaseRef: null,
    });
    expect(chain.workspaceDocument.content.caseDocumentRef)
      .toEqual(chain.caseDocument.ref);
    expect(chain.caseDocument.content.resolvedSessionInput.sourceIntent)
      .toEqual(chain.presetDocument.content.sourceIntent);
    expect(chain.caseDocument.content.releaseRef)
      .toEqual(chain.presetDocument.content.releaseRef);
    expect(chain.caseDocument.content.resolvedSessionInput.releaseRef)
      .toEqual(chain.presetDocument.content.releaseRef);
    expect(Object.isFrozen(chain)).toBe(true);

    const panelById = Object.fromEntries(
      chain.workspaceDocument.content.panels.map((panel) => [
        panel.panelId,
        panel,
      ]),
    );
    expect(chain.workspaceDocument.content.panels.map(({ panelId }) => panelId))
      .toEqual([
        "four-chamber-pv",
        "four-valve-flow",
        "atrial-pressure",
        "ventricular-pressure",
        "vascular-pressure",
      ]);
    expect(panelById["four-chamber-pv"].view).toMatchObject({
      kind: "pressure-volume",
      trajectories: [
        {
          volumeObservableId: "hemodynamics.volume.LA",
          pressureObservableId: "hemodynamics.pressure.absolute.LA",
        },
        {
          volumeObservableId: "hemodynamics.volume.RA",
          pressureObservableId: "hemodynamics.pressure.absolute.RA",
        },
        {
          volumeObservableId: "hemodynamics.volume.LV",
          pressureObservableId: "hemodynamics.pressure.absolute.LV",
        },
        {
          volumeObservableId: "hemodynamics.volume.RV",
          pressureObservableId: "hemodynamics.pressure.absolute.RV",
        },
      ],
    });
    expect(panelById["four-valve-flow"].view).toEqual({
      kind: "time-series",
      observableIds: [
        "valve.MV.flow",
        "valve.AoV.flow",
        "valve.TV.flow",
        "valve.PV.flow",
      ],
    });
    expect(panelById["atrial-pressure"].view).toMatchObject({
      observableIds: [
        "hemodynamics.pressure.absolute.LA",
        "hemodynamics.pressure.absolute.RA",
      ],
    });
    expect(panelById["ventricular-pressure"].view).toMatchObject({
      observableIds: [
        "hemodynamics.pressure.absolute.LV",
        "hemodynamics.pressure.absolute.RV",
      ],
    });
    expect(panelById["vascular-pressure"].view).toMatchObject({
      observableIds: [
        "hemodynamics.pressure.absolute.Ao",
        "hemodynamics.pressure.absolute.PA",
        "hemodynamics.pressure.absolute.PVein",
      ],
    });

    for (const document of [
      chain.presetDocument,
      chain.caseDocument,
      chain.workspaceDocument,
    ]) {
      expect(collectKeys(document)).not.toContain("official");
      expect(collectKeys(document)).not.toContain("officialTrust");
      expect(collectKeys(document)).not.toContain("catalogVisibility");
    }
  });

  it("builds every bounded research ref without falling back or aliasing identity", async () => {
    const chains = await Promise.all(
      MAIN_WIRE_SCIENTIFIC_RESEARCH_PRESET_CATALOG_V1.entries.map((entry) =>
        buildMainWireScientificDocumentChainV1({
          presetId: entry.presetId,
          presetVersion: entry.presetVersion,
        })),
    );

    expect(new Set(chains.map((chain) =>
      chain.presetDocument.ref.sha256))).toHaveLength(9);
    expect(new Set(chains.map((chain) =>
      chain.caseDocument.content.resolvedSessionInput.sessionInputSha256)))
      .toHaveLength(9);
    expect(chains[0].caseDocument.content.resolvedSessionInput
      .resolvedParameters.circulationRuntime.valvePreset.bracketIds)
      .toEqual([]);
  });

  it("fails explicitly instead of misrepresenting the official V2 checkpoint as a Case V3 start", async () => {
    const official = buildMainWireScientificDocumentChainV1({
      presetId: "circleheart/official-healthy-periodic",
      presetVersion: "1.0.0",
    });
    await expect(official).rejects.toMatchObject({
      name: "MainWireScientificDocumentChainBuildErrorV1",
      code: "official-v2-start-not-representable",
    });
    await expect(official).rejects.toThrow(
      /exact-checkpoint V2.*CaseDocumentV1.*exact-checkpoint V3/,
    );
  });

  it("rejects changed, malformed, ambiguous, or caller-extended preset refs", async () => {
    for (const ref of [
      null,
      { presetId: "main-wire/healthy-cold", presetVersion: "1.0.1" },
      { presetId: "main-wire/unknown", presetVersion: "1.0.0" },
      {
        presetId: "main-wire/healthy-cold",
        presetVersion: "1.0.0",
        parameterPatch: { arbitrary: true },
      },
      {
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.0",
        checkpointSha256: "a".repeat(64),
      },
      {
        presetId: "circleheart/official-healthy-periodic",
        presetVersion: "1.0.1",
      },
    ]) {
      await expect(buildMainWireScientificDocumentChainV1(ref)).rejects
        .toMatchObject({
          code: "invalid-preset-ref",
        });
    }
  });
});

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child),
  ]);
}
