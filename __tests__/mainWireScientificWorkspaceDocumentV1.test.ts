import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID,
} from "@/engine/scientific/documents/MainWireScientificCaseDocumentV1";
import {
  createMainWireScientificWorkspaceDocumentV1,
  loadMainWireScientificWorkspaceDocumentV1,
  MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID,
  MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID,
  MainWireScientificWorkspaceDocumentValidationErrorV1,
} from "@/engine/scientific/documents/MainWireScientificWorkspaceDocumentV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

describe("MainWireScientificWorkspaceDocumentV1", () => {
  it("content-addresses only ordered presentation state", async () => {
    const input = validInput();
    const document = await createMainWireScientificWorkspaceDocumentV1(input);

    expect(document.ref).toEqual({
      schemaId: MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_REF_V1_SCHEMA_ID,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(document.content).toEqual({
      schemaId: MAIN_WIRE_SCIENTIFIC_WORKSPACE_DOCUMENT_CONTENT_V1_SCHEMA_ID,
      schemaVersion: 1,
      revision: 3,
      caseDocumentRef: input.caseDocumentRef,
      panels: input.panels,
      notes: "Focus on atrial filling and valve timing.",
    });
    expect(document.ref.sha256).toBe(
      await sha256CanonicalJsonHex(document.content),
    );
    expect(document.content.panels.map(({ panelId }) => panelId)).toEqual([
      "atrial-pv",
      "valve-flow",
    ]);
    expect(document.content.panels[0].view).toEqual({
      kind: "pressure-volume",
      trajectories: [
        {
          trajectoryId: "la",
          label: "Left atrium",
          volumeObservableId: "hemodynamics.volume.LA",
          pressureObservableId: "hemodynamics.pressure.absolute.LA",
        },
        {
          trajectoryId: "ra",
          label: "Right atrium",
          volumeObservableId: "hemodynamics.volume.RA",
          pressureObservableId: "hemodynamics.pressure.absolute.RA",
        },
      ],
    });
    expect(document.content.panels[1].view).toEqual({
      kind: "time-series",
      observableIds: [
        "valve.MV.flow",
        "valve.AoV.flow",
        "valve.TV.flow",
        "valve.PV.flow",
      ],
    });
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.content)).toBe(true);
    expect(Object.isFrozen(document.content.panels)).toBe(true);
    expect(Object.isFrozen(document.content.panels[0].layout)).toBe(true);

    input.panels[0].title = "mutated";
    input.caseDocumentRef.sha256 = "b".repeat(64);
    expect(document.content.panels[0].title).toBe("Atrial PV loops");
    expect(document.content.caseDocumentRef.sha256).toBe("a".repeat(64));

    const loaded = await loadMainWireScientificWorkspaceDocumentV1(
      mutable(document),
    );
    expect(loaded).toEqual(document);
    expect(Object.isFrozen(loaded.content.caseDocumentRef)).toBe(true);
    expect(document).not.toHaveProperty("releaseRef");
    expect(document.content).not.toHaveProperty("parameters");
    expect(document.content).not.toHaveProperty("sourceIntent");
    expect(document.content).not.toHaveProperty("protocolDescriptor");
    expect(document.content).not.toHaveProperty("checkpoint");
    expect(document.content).not.toHaveProperty("runOutputs");
    expect(document.content).not.toHaveProperty("official");
  });

  it("preserves panel and signal order while canonicalizing object key order", async () => {
    const input = validInput();
    const reversed = {
      notes: input.notes,
      panels: input.panels.map((panel) => ({
        layout: reverseKeys(panel.layout),
        view: reverseView(panel.view),
        title: panel.title,
        panelId: panel.panelId,
      })),
      caseDocumentRef: reverseKeys(input.caseDocumentRef),
      revision: input.revision,
    };

    const first = await createMainWireScientificWorkspaceDocumentV1(input);
    const second = await createMainWireScientificWorkspaceDocumentV1(
      reversed as any,
    );
    expect(second.ref).toEqual(first.ref);
    expect(second.content).toEqual(first.content);

    const reorderedPanels = validInput();
    reorderedPanels.panels.reverse();
    const third = await createMainWireScientificWorkspaceDocumentV1(
      reorderedPanels,
    );
    expect(third.ref.sha256).not.toBe(first.ref.sha256);
  });

  it("fails closed on unknown observables, duplicate IDs, and invalid layout", async () => {
    const unknownObservable = validInput();
    unknownObservable.panels[0].view.trajectories[0].pressureObservableId =
      "internal.LA.pressure";
    await expect(createMainWireScientificWorkspaceDocumentV1(unknownObservable))
      .rejects.toThrow(/not in the scientific observable catalog/);

    const duplicateObservable = validInput();
    duplicateObservable.panels[1].view.observableIds.push(
      duplicateObservable.panels[1].view.observableIds[0],
    );
    await expect(createMainWireScientificWorkspaceDocumentV1(duplicateObservable))
      .rejects.toThrow(/duplicates an observable ID/);

    const duplicateTrajectory = validInput();
    duplicateTrajectory.panels[0].view.trajectories[1].trajectoryId = "la";
    await expect(createMainWireScientificWorkspaceDocumentV1(duplicateTrajectory))
      .rejects.toThrow(/trajectoryId must be unique/);

    const reusedPvObservable = validInput();
    reusedPvObservable.panels[0].view.trajectories[1].volumeObservableId =
      "hemodynamics.volume.LA";
    await expect(createMainWireScientificWorkspaceDocumentV1(reusedPvObservable))
      .rejects.toThrow(/must not reuse an observable ID/);

    const wrongPvKinds = validInput();
    wrongPvKinds.panels[0].view.trajectories[0].volumeObservableId =
      "hemodynamics.pressure.absolute.LA";
    wrongPvKinds.panels[0].view.trajectories[0].pressureObservableId =
      "hemodynamics.volume.LA";
    await expect(createMainWireScientificWorkspaceDocumentV1(wrongPvKinds))
      .rejects.toThrow(/must reference a volume observable/);
    await expect(createMainWireScientificWorkspaceDocumentV1(wrongPvKinds))
      .rejects.toThrow(/must reference a pressure observable/);

    const duplicatePanel = validInput();
    duplicatePanel.panels[1].panelId = duplicatePanel.panels[0].panelId;
    await expect(createMainWireScientificWorkspaceDocumentV1(duplicatePanel))
      .rejects.toThrow(/panelId must be unique/);

    const invalidLayout = validInput();
    invalidLayout.panels[0].layout.width = 0;
    await expect(createMainWireScientificWorkspaceDocumentV1(invalidLayout))
      .rejects.toThrow(/layout.width must be a safe integer/);

    const invalidRevision = validInput();
    invalidRevision.revision = 1.5;
    await expect(createMainWireScientificWorkspaceDocumentV1(invalidRevision))
      .rejects.toThrow(/revision must be a non-negative safe integer/);
  });

  it("rejects tampering and rehashed scientific or trust fields", async () => {
    const document = await createMainWireScientificWorkspaceDocumentV1(
      validInput(),
    );
    const tampered = mutable(document);
    tampered.content.panels[0].title = "Changed title";
    await expect(loadMainWireScientificWorkspaceDocumentV1(tampered))
      .rejects.toThrow(/does not match the canonical content digest/);

    for (const [field, value] of [
      ["releaseRef", { id: "forbidden" }],
      ["parameters", { contractility: 2 }],
      ["sourceIntent", { operations: [] }],
      ["protocol", { dtSec: 0.001 }],
      ["checkpoint", { state: [] }],
      ["runOutputs", { frames: [] }],
      ["official", true],
    ] as const) {
      const rehashed = mutable(document);
      rehashed.content[field] = value;
      rehashed.ref.sha256 = await sha256CanonicalJsonHex(rehashed.content);
      await expect(loadMainWireScientificWorkspaceDocumentV1(rehashed))
        .rejects.toThrow(`workspace.content.${field} is not allowed`);
    }

    const unknownPanelField = mutable(document);
    unknownPanelField.content.panels[0].chartType = "pv-loop";
    unknownPanelField.ref.sha256 = await sha256CanonicalJsonHex(
      unknownPanelField.content,
    );
    await expect(loadMainWireScientificWorkspaceDocumentV1(unknownPanelField))
      .rejects.toThrow(/chartType is not allowed/);

    const unknownInput = validInput();
    unknownInput.savedCase = { id: "legacy" };
    await expect(createMainWireScientificWorkspaceDocumentV1(unknownInput))
      .rejects.toThrow(MainWireScientificWorkspaceDocumentValidationErrorV1);
  });

  it("uses null as the canonical absence of notes", async () => {
    const input = validInput();
    input.notes = null;
    const document = await createMainWireScientificWorkspaceDocumentV1(input);
    expect(document.content.notes).toBeNull();

    const emptyNotes = validInput();
    emptyNotes.notes = "";
    await expect(createMainWireScientificWorkspaceDocumentV1(emptyNotes))
      .rejects.toThrow(/notes must be null or a non-empty trimmed string/);
  });

  it("accepts the strict numeric-table variant and rejects unknown view kinds", async () => {
    const numericTable = validInput();
    numericTable.panels[1].view = {
      kind: "numeric-table",
      observableIds: [
        "solver.mechanics.residual_norm",
        "conservation.total_blood_volume.error",
      ],
    };
    const document = await createMainWireScientificWorkspaceDocumentV1(
      numericTable,
    );
    expect(document.content.panels[1].view).toEqual(
      numericTable.panels[1].view,
    );

    const unknown = validInput();
    unknown.panels[1].view = {
      kind: "scatter",
      observableIds: ["valve.MV.flow"],
    };
    await expect(createMainWireScientificWorkspaceDocumentV1(unknown))
      .rejects.toThrow(/view.kind is unsupported/);
  });
});

function validInput(): any {
  return {
    revision: 3,
    caseDocumentRef: {
      schemaId: MAIN_WIRE_SCIENTIFIC_CASE_DOCUMENT_REF_V1_SCHEMA_ID,
      sha256: "a".repeat(64),
    },
    panels: [
      {
        panelId: "atrial-pv",
        title: "Atrial PV loops",
        view: {
          kind: "pressure-volume",
          trajectories: [
            {
              trajectoryId: "la",
              label: "Left atrium",
              volumeObservableId: "hemodynamics.volume.LA",
              pressureObservableId: "hemodynamics.pressure.absolute.LA",
            },
            {
              trajectoryId: "ra",
              label: "Right atrium",
              volumeObservableId: "hemodynamics.volume.RA",
              pressureObservableId: "hemodynamics.pressure.absolute.RA",
            },
          ],
        },
        layout: { x: 0, y: 0, width: 6, height: 4 },
      },
      {
        panelId: "valve-flow",
        title: "Valve flow",
        view: {
          kind: "time-series",
          observableIds: [
            "valve.MV.flow",
            "valve.AoV.flow",
            "valve.TV.flow",
            "valve.PV.flow",
          ],
        },
        layout: { x: 6, y: 0, width: 6, height: 4 },
      },
    ],
    notes: "Focus on atrial filling and valve timing.",
  };
}

function mutable<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

function reverseKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).reverse());
}

function reverseView(view: any): Record<string, unknown> {
  if (view.kind === "pressure-volume") {
    return reverseKeys({
      kind: view.kind,
      trajectories: view.trajectories.map(reverseKeys),
    });
  }
  return reverseKeys(view);
}
