import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
  OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
  OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
  verifyOfficialHealthyPeriodicPresetBundleAssetsV1,
  type OfficialHealthyPeriodicPresetBundleAssetsV1,
} from "@/engine/scientific/presets";
import {
  BUNDLED_OFFICIAL_HEALTHY_PERIODIC_RAW_ASSETS_FOR_TEST_V1,
  loadBundledOfficialHealthyPeriodicPresetV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicCheckpointPresetV1";
import {
  canonicalJsonStringify,
  sha256TextHex,
} from "@/engine/scientific/release";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker";
import {
  MainWireScientificSessionV1,
} from "@/engine/scientific/runtime";

const PRESET_ID = "circleheart/official-healthy-periodic" as const;
const PRESET_VERSION = "1.0.0" as const;

describe("main-wire scientific official preset Worker load V1", () => {
  it("loads only the bundled identity and preserves the complete preset origin", async () => {
    const loaded = await loadBundledOfficialHealthyPeriodicPresetV1({
      presetId: PRESET_ID,
      presetVersion: PRESET_VERSION,
    });
    expect(loaded).toMatchObject({
      identity: { presetId: PRESET_ID, presetVersion: PRESET_VERSION },
      release: {
        ref: {
          id: "circleheart/adult-five-wall-noncoronary",
          version: "0.2.0",
          sha256:
            "75a4aac4458de6f03db4fe3d43a919a9d06ec34e5f18e2ae48fbf63475f9e7e4",
        },
      },
      provenance: {
        catalogSchemaId: "circleheart-official-preset-catalog-v1",
        catalogSchemaVersion: 1,
        manifestRawFileSha256:
          "eb40d42aa4e8bde3b696eb1257428d2022826137e1f2c994c75f59188e451ca0",
        checkpointRawFileSha256:
          "dbe660999758177aa7c72f92ce8da3bf4378a69d11f42454724a4f923d767ea2",
        checkpointSha256:
          "2f1c0b477905b07dfefc8a37ee7e1b7ab3d856d7f017770c6bc92a22fb529ff0",
      },
      checkpoint: {
        schemaVersion: 2,
        transaction: { revision: 13_000 },
        periodicSettlementTracker: { completedBeatCount: 26 },
      },
    });

    const kernel = new MainWireScientificInProcessKernelV1({
      officialPresetLoader: loadBundledOfficialHealthyPeriodicPresetV1,
    });
    const created = await kernel.handle(officialPresetCommand(
      "request-official-create",
      "official-session",
    ));
    expect(created).toMatchObject({
      ok: true,
      commandKind: "createOfficialPresetSession",
      releaseRef: loaded.release.ref,
      sessionOrigin: {
        kind: "official-preset-exact-checkpoint-restore",
        presetId: PRESET_ID,
        presetVersion: PRESET_VERSION,
        catalogSchemaId: "circleheart-official-preset-catalog-v1",
        catalogSchemaVersion: 1,
        manifestRawFileSha256:
          "eb40d42aa4e8bde3b696eb1257428d2022826137e1f2c994c75f59188e451ca0",
        checkpointRawFileSha256:
          "dbe660999758177aa7c72f92ce8da3bf4378a69d11f42454724a4f923d767ea2",
        checkpointSha256:
          "2f1c0b477905b07dfefc8a37ee7e1b7ab3d856d7f017770c6bc92a22fb529ff0",
        parameterization: "fixed-canonical-only",
      },
      payload: {
        kind: "officialPresetSessionCreated",
        presetId: PRESET_ID,
        presetVersion: PRESET_VERSION,
        observableFrame: {
          revision: 13_000,
          acceptedTimeSec: expect.closeTo(26, 9),
          source: "exact-checkpoint-restore",
        },
      },
      error: null,
    });
    expect(structuredClone(created)).toEqual(created);
    expect(kernel.activeSessionCount()).toBe(1);

    const terminal = await kernel.handle(baseCommand(
      "settlePeriodic",
      "request-official-periodic",
      "official-session",
    ));
    expect(terminal).toMatchObject({
      ok: true,
      sessionOrigin: created.sessionOrigin,
      payload: {
        kind: "periodic-settlement-progress",
        status: "period1-converged",
        periodicSteadyStateClaimed: true,
        period2OrbitSuspected: false,
        beatCompletedThisCall: false,
        completedStepCountThisCall: 0,
        completedBeatCount: 26,
        finalObservableFrame: { revision: 13_000 },
      },
    });
  });

  it("rejects wrong identities and every caller-supplied asset field", async () => {
    const unboundKernel = new MainWireScientificInProcessKernelV1();
    const unavailable = await unboundKernel.handle(officialPresetCommand(
      "request-unbound-host",
      "unbound-host-session",
    ));
    expect(unavailable).toMatchObject({
      ok: false,
      error: { code: "capability-unavailable", silentFallbackApplied: false },
    });
    expect(unboundKernel.activeSessionCount()).toBe(0);

    const kernel = new MainWireScientificInProcessKernelV1({
      officialPresetLoader: loadBundledOfficialHealthyPeriodicPresetV1,
    });
    const wrongId = await kernel.handle({
      ...officialPresetCommand("request-wrong-id", "wrong-id-session"),
      presetId: "caller/arbitrary-preset",
    });
    expect(wrongId).toMatchObject({
      ok: false,
      error: { code: "invalid-command", silentFallbackApplied: false },
    });
    const wrongVersion = await kernel.handle({
      ...officialPresetCommand("request-wrong-version", "wrong-version-session"),
      presetVersion: "1.0.1",
    });
    expect(wrongVersion).toMatchObject({
      ok: false,
      error: { code: "invalid-command", silentFallbackApplied: false },
    });
    const callerAsset = await kernel.handle({
      ...officialPresetCommand("request-caller-asset", "caller-asset-session"),
      checkpoint: { callerControlled: true },
    });
    expect(callerAsset).toMatchObject({
      ok: false,
      error: { code: "invalid-command", silentFallbackApplied: false },
    });
    expect(kernel.activeSessionCount()).toBe(0);

    const validLoaded = await loadBundledOfficialHealthyPeriodicPresetV1({
      presetId: PRESET_ID,
      presetVersion: PRESET_VERSION,
    });
    const mislabeledLoader = async () => ({
      ...validLoaded,
      provenance: {
        ...validLoaded.provenance,
        checkpointRawFileSha256: "4".repeat(64),
      },
    }) as typeof validLoaded;
    const mislabeledKernel = new MainWireScientificInProcessKernelV1({
      officialPresetLoader: mislabeledLoader,
    });
    const mislabeled = await mislabeledKernel.handle(officialPresetCommand(
      "request-mislabeled-loader",
      "mislabeled-loader-session",
    ));
    expect(mislabeled).toMatchObject({
      ok: false,
      error: {
        code: "official-preset-restore-rejected",
        message: expect.stringMatching(/does not match the command trust anchor/),
        silentFallbackApplied: false,
      },
    });
    expect(mislabeledKernel.activeSessionCount()).toBe(0);
  });

  it("preserves every checked-in raw byte through the Vite Worker import", () => {
    expect(Buffer.from(
      BUNDLED_OFFICIAL_HEALTHY_PERIODIC_RAW_ASSETS_FOR_TEST_V1.catalogRawJson,
      "utf8",
    )).toEqual(readFileSync(path.resolve(
      OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
    )));
    expect(Buffer.from(
      BUNDLED_OFFICIAL_HEALTHY_PERIODIC_RAW_ASSETS_FOR_TEST_V1.presetRawJson,
      "utf8",
    )).toEqual(readFileSync(path.resolve(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
    )));
    expect(Buffer.from(
      BUNDLED_OFFICIAL_HEALTHY_PERIODIC_RAW_ASSETS_FOR_TEST_V1.checkpointRawJson,
      "utf8",
    )).toEqual(readFileSync(path.resolve(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
    )));
  });

  it("fails closed on raw manifest/checkpoint tamper and stale inner SHA", async () => {
    const assets = readBundleAssets();
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();

    const manifest = JSON.parse(assets.presetRawJson) as Record<string, any>;
    manifest.protocol.result.terminalTotalBloodVolumeErrorMl += 1;
    const manifestTampered = canonicalAsset(manifest);
    await expect(verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
      { presetId: PRESET_ID, presetVersion: PRESET_VERSION },
      release,
      { ...assets, presetRawJson: manifestTampered },
    )).rejects.toThrow(/preset manifest raw-file SHA-256 mismatch/);

    const checkpoint = JSON.parse(
      assets.checkpointRawJson,
    ) as Record<string, any>;
    checkpoint.transaction.circulation.state.dynamicEdgeFlowsMlPerSec.Ao_SA += 1;
    const checkpointTampered = canonicalAsset(checkpoint);
    await expect(verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
      { presetId: PRESET_ID, presetVersion: PRESET_VERSION },
      release,
      { ...assets, checkpointRawJson: checkpointTampered },
    )).rejects.toThrow(/checkpoint raw-file SHA-256 mismatch/);
    const loaded = await loadBundledOfficialHealthyPeriodicPresetV1({
      presetId: PRESET_ID,
      presetVersion: PRESET_VERSION,
    });
    await expect(MainWireScientificSessionV1.restoreExact(
      loaded.release,
      checkpoint,
    )).rejects.toThrow(/exact-checkpoint outer SHA-256 mismatch/);

    const reChainedManifest = JSON.parse(
      assets.presetRawJson,
    ) as Record<string, any>;
    reChainedManifest.initialization.checkpoint.byteLength =
      utf8ByteLength(checkpointTampered);
    reChainedManifest.initialization.checkpoint.rawFileSha256 =
      await sha256TextHex(checkpointTampered);
    const reChainedManifestRaw = canonicalAsset(reChainedManifest);
    const reChainedCatalog = JSON.parse(
      assets.catalogRawJson,
    ) as Record<string, any>;
    reChainedCatalog.entries[0].manifest.byteLength =
      utf8ByteLength(reChainedManifestRaw);
    reChainedCatalog.entries[0].manifest.rawFileSha256 =
      await sha256TextHex(reChainedManifestRaw);
    const reChainedCatalogRaw = canonicalAsset(reChainedCatalog);
    await expect(verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
      { presetId: PRESET_ID, presetVersion: PRESET_VERSION },
      release,
      {
        catalogRawJson: reChainedCatalogRaw,
        presetRawJson: reChainedManifestRaw,
        checkpointRawJson: checkpointTampered,
      },
    )).rejects.toThrow(/inner checkpoint canonical SHA-256 mismatch/);
  });

  it("rejects a preset chain bound to any release other than the exact current ref", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const wrongRelease = Object.freeze({
      ...release,
      ref: Object.freeze({ ...release.ref, sha256: "0".repeat(64) }),
    });
    await expect(verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
      { presetId: PRESET_ID, presetVersion: PRESET_VERSION },
      wrongRelease,
      readBundleAssets(),
    )).rejects.toThrow(/full current SimulationReleaseRef/);
  });
});

function officialPresetCommand(requestId: string, sessionId: string) {
  return {
    ...baseCommand(
      "createOfficialPresetSession",
      requestId,
      sessionId,
    ),
    presetId: PRESET_ID,
    presetVersion: PRESET_VERSION,
  } as const;
}

function baseCommand(
  kind: "createOfficialPresetSession" | "settlePeriodic",
  requestId: string,
  sessionId: string,
) {
  return {
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  } as const;
}

function readBundleAssets(): OfficialHealthyPeriodicPresetBundleAssetsV1 {
  return Object.freeze({
    catalogRawJson: readFileSync(path.resolve(
      OFFICIAL_SCIENTIFIC_PRESET_CATALOG_V1_PATH,
    ), "utf8"),
    presetRawJson: readFileSync(path.resolve(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_PRESET_V1_MANIFEST_PATH,
    ), "utf8"),
    checkpointRawJson: readFileSync(path.resolve(
      OFFICIAL_HEALTHY_PERIODIC_CHECKPOINT_V1_ASSET_PATH,
    ), "utf8"),
  });
}

function canonicalAsset(value: unknown): string {
  return `${canonicalJsonStringify(value)}\n`;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
