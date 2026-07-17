import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  createMainWireScientificCaseDocumentV1,
  createMainWireScientificCaseFromPresetV1,
  createMainWireScientificPresetDocumentV1,
  loadMainWireScientificCaseDocumentV1,
  loadMainWireScientificPresetDocumentV1,
  mainWireScientificColdStartDescriptorV1,
  resolveMainWireScientificCaseDocumentV1,
} from "@/engine/scientific/documents";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  sha256CanonicalJsonHex,
  type SimulationReleaseV1,
} from "@/engine/scientific/release";

describe("greenfield main-wire scientific documents V1", () => {
  it("stores a preset as immutable release-bound intent only", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const intent = mainWireScientificSessionIntentV1(release.ref, "MR-severe");
    const preset = await createMainWireScientificPresetDocumentV1(
      release,
      intent,
    );

    expect(preset).toEqual({
      ref: {
        schemaId: "circleheart-main-wire-scientific-preset-document-ref-v1",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
      content: {
        schemaId:
          "circleheart-main-wire-scientific-preset-document-content-v1",
        schemaVersion: 1,
        releaseRef: release.ref,
        sourceIntent: intent,
      },
    });
    expect(Object.keys(preset.content).sort()).toEqual([
      "releaseRef", "schemaId", "schemaVersion", "sourceIntent",
    ]);
    expect("official" in preset.content).toBe(false);
    expect("display" in preset.content).toBe(false);
    await expect(loadMainWireScientificPresetDocumentV1(
      release,
      JSON.parse(JSON.stringify(preset)),
    )).resolves.toEqual(preset);
  });

  it("instantiates a complete case and preserves non-trust lineage on user edits", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const healthyIntent = mainWireScientificSessionIntentV1(release.ref);
    const preset = await createMainWireScientificPresetDocumentV1(
      release,
      healthyIntent,
    );
    const protocolDescriptor = periodicProtocol(release);
    const caseDocument = await createMainWireScientificCaseFromPresetV1(
      release,
      preset,
      protocolDescriptor,
    );

    expect(caseDocument.content).toMatchObject({
      schemaId: "circleheart-main-wire-scientific-case-document-content-v1",
      schemaVersion: 1,
      releaseRef: release.ref,
      sourceIntent: healthyIntent,
      resolvedSessionInput: {
        sourceIntent: healthyIntent,
        releaseRef: release.ref,
        sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
      protocolDescriptor,
      startDescriptor: {
        kind: "release-resolved-cold-start",
        protocolId: healthyIntent.initialization.protocolId,
        protocolVersion: healthyIntent.initialization.protocolVersion,
      },
      lineage: {
        kind: "preset-instantiation",
        sourcePresetRef: preset.ref,
        parentCaseRef: null,
      },
    });
    expect(Object.keys(caseDocument.content).sort()).toEqual([
      "lineage",
      "protocolDescriptor",
      "releaseRef",
      "resolvedSessionInput",
      "schemaId",
      "schemaVersion",
      "sourceIntent",
      "startDescriptor",
    ]);
    expect("officialTrust" in caseDocument.content).toBe(false);
    expect("workspace" in caseDocument.content).toBe(false);
    expect("results" in caseDocument.content).toBe(false);
    await expect(loadMainWireScientificCaseDocumentV1(
      release,
      JSON.parse(JSON.stringify(caseDocument)),
    )).resolves.toEqual(caseDocument);

    const editedIntent = mainWireScientificSessionIntentV1(
      release.ref,
      "AS-severe",
    );
    const edited = await resolveMainWireScientificCaseDocumentV1(release, {
      sourceIntent: editedIntent,
      protocolDescriptor,
      startDescriptor: {
        kind: "release-resolved-cold-start",
        protocolId: editedIntent.initialization.protocolId,
        protocolVersion: editedIntent.initialization.protocolVersion,
      },
      lineage: {
        kind: "user-edit",
        sourcePresetRef: preset.ref,
        parentCaseRef: caseDocument.ref,
      },
    });
    expect(edited.ref.sha256).not.toBe(caseDocument.ref.sha256);
    expect(edited.content.resolvedSessionInput.resolvedParameters
      .circulationRuntime.valvePreset.bracketIds).toEqual(["AS-severe"]);
    expect(edited.content.lineage).toEqual({
      kind: "user-edit",
      sourcePresetRef: preset.ref,
      parentCaseRef: caseDocument.ref,
    });
    expect("official" in edited.content.lineage).toBe(false);
  });

  it("supports exact-checkpoint start identity without embedding results", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const sourceIntent = mainWireScientificSessionIntentV1(release.ref);
    const resolvedSessionInput = await resolveMainWireScientificSessionInputV1(
      release,
      sourceIntent,
    );
    const checkpointSha256 = "a".repeat(64);
    const caseDocument = await createMainWireScientificCaseDocumentV1(
      release,
      {
        sourceIntent,
        resolvedSessionInput,
        protocolDescriptor: periodicProtocol(release),
        startDescriptor: {
          kind: "exact-checkpoint-v3",
          checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
          checkpointSha256,
          releaseRef: release.ref,
          sessionInputSha256: resolvedSessionInput.sessionInputSha256,
        },
        lineage: {
          kind: "root",
          sourcePresetRef: null,
          parentCaseRef: null,
        },
      },
    );

    expect(caseDocument.content.startDescriptor).toEqual({
      kind: "exact-checkpoint-v3",
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
      checkpointSha256,
      releaseRef: release.ref,
      sessionInputSha256: resolvedSessionInput.sessionInputSha256,
    });
    expect("checkpoint" in caseDocument.content).toBe(false);
    expect("outputs" in caseDocument.content).toBe(false);
  });

  it("rejects unknown trust/UI/result fields and digest or resolved-input tampering", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const preset = await createMainWireScientificPresetDocumentV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );

    const changedPreset = JSON.parse(JSON.stringify(preset));
    changedPreset.content.sourceIntent.parameterOperations = [{
      kind: "select-valve-research-bracket",
      target: "circulation.valvePreset",
      compositionPolicy: "exclusive-component-selection",
      bracketId: "MR-severe",
    }];
    await expect(loadMainWireScientificPresetDocumentV1(release, changedPreset))
      .rejects.toThrow(/canonical content digest/);

    const forgedOfficialPreset = JSON.parse(JSON.stringify(preset));
    forgedOfficialPreset.content.officialTrust = "official";
    forgedOfficialPreset.ref.sha256 = await sha256CanonicalJsonHex(
      forgedOfficialPreset.content,
    );
    await expect(loadMainWireScientificPresetDocumentV1(
      release,
      forgedOfficialPreset,
    )).rejects.toThrow(/must contain exactly keys/);

    const caseDocument = await createMainWireScientificCaseFromPresetV1(
      release,
      preset,
      periodicProtocol(release),
    );
    const forgedWorkspace = JSON.parse(JSON.stringify(caseDocument));
    forgedWorkspace.content.workspace = { activePanel: "pv-loop" };
    forgedWorkspace.content.results = { steady: true };
    forgedWorkspace.content.officialTrust = true;
    forgedWorkspace.ref.sha256 = await sha256CanonicalJsonHex(
      forgedWorkspace.content,
    );
    await expect(loadMainWireScientificCaseDocumentV1(
      release,
      forgedWorkspace,
    )).rejects.toThrow(/must contain exactly keys/);

    const forgedResolved = JSON.parse(JSON.stringify(caseDocument));
    forgedResolved.content.resolvedSessionInput.resolvedParameters
      .circulationRuntime.losses.systemicResistance = 2;
    const { sessionInputSha256: ignored, ...resolvedPayload } =
      forgedResolved.content.resolvedSessionInput;
    expect(ignored).toBe(
      caseDocument.content.resolvedSessionInput.sessionInputSha256,
    );
    forgedResolved.content.resolvedSessionInput.sessionInputSha256 =
      await sha256CanonicalJsonHex(resolvedPayload);
    forgedResolved.ref.sha256 = await sha256CanonicalJsonHex(
      forgedResolved.content,
    );
    await expect(loadMainWireScientificCaseDocumentV1(
      release,
      forgedResolved,
    )).rejects.toThrow(/release-bound re-resolution/);
  });

  it("rejects invalid lineage and an unapproved execution protocol", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const intent = mainWireScientificSessionIntentV1(release.ref);
    const resolved = await resolveMainWireScientificSessionInputV1(
      release,
      intent,
    );
    const coldStart = mainWireScientificColdStartDescriptorV1(resolved);

    await expect(createMainWireScientificCaseDocumentV1(release, {
      sourceIntent: intent,
      resolvedSessionInput: resolved,
      protocolDescriptor: {
        protocolId: "unapproved-research-protocol",
        protocolVersion: "1.0.0",
      },
      startDescriptor: coldStart,
      lineage: {
        kind: "root",
        sourcePresetRef: null,
        parentCaseRef: null,
      },
    })).rejects.toThrow(/not approved by the release/);

    await expect(createMainWireScientificCaseDocumentV1(release, {
      sourceIntent: intent,
      resolvedSessionInput: resolved,
      protocolDescriptor: periodicProtocol(release),
      startDescriptor: coldStart,
      lineage: {
        kind: "user-fork",
        sourcePresetRef: null,
        parentCaseRef: null,
      } as never,
    })).rejects.toThrow(/parentCaseRef must be an object/);
  });
});

function periodicProtocol(
  release: SimulationReleaseV1,
): Readonly<{ protocolId: string; protocolVersion: string }> {
  const protocol = release.manifest.approvedProtocols.find((candidate) =>
    candidate.protocolId.includes("periodic-steady"));
  if (!protocol) throw new Error("periodic protocol missing from fixture release");
  return Object.freeze({
    protocolId: protocol.protocolId,
    protocolVersion: protocol.protocolVersion,
  });
}
