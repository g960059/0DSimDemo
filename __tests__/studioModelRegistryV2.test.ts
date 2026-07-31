import { describe, expect, it, vi } from "vitest";

import {
  STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
  type RegisteredModelCaptureAdapterV2,
  type RegisteredModelPackageManifestV2,
} from "@/studio/contracts/v2/model";
import {
  InMemoryRegisteredModelStoreV2,
  RegisteredModelConflictErrorV2,
  RegisteredModelValidationErrorV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";

describe("InMemoryRegisteredModelStoreV2", () => {
  it("derives one frozen allowlisted public contract from the manifest", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    const manifest = makeManifestV2();

    const registered = await registerV2(store, manifest);
    const resolved = store.resolveContract(manifest.modelId);
    const resolvedPackage = store.resolvePackage(manifest.modelId);

    expect(registered).toBe(resolved);
    expect(resolved).toEqual({
      modelId: "circulation-reference-v1",
      modelFamilyId: "circulation-reference",
      displayName: "Reference circulation",
      fixtureSchemaId: "circulation-fixture-v1",
      checkpointCodecId: "circulation-checkpoint-v1",
      snapshotGateId: "circulation-minimum-gate-v1",
      parameterCatalog: [{ parameterId: "circulation.tbv" }],
      controlCatalog: [{
        controlId: "control.tbv",
        parameterIds: ["circulation.tbv"],
      }],
      outputCatalog: manifest.catalogs.outputCatalog,
      graphCatalog: [{
        graphId: "graph.lv-pressure",
        outputIds: ["hemodynamics.pressure.lv"],
      }],
    });
    expect(Object.keys(resolvedPackage).sort()).toEqual([
      "contract",
      "manifest",
    ]);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.parameterCatalog[0])).toBe(true);
    expect(Object.isFrozen(resolvedPackage.manifest.runtime)).toBe(true);

    (manifest as { displayName: string }).displayName = "caller mutation";
    (manifest.runtime as { entrypoint: string }).entrypoint = "mutated";
    expect(resolved.displayName).toBe("Reference circulation");
    expect(resolvedPackage.manifest.runtime).toEqual({
      entrypoint: "runtime/reference-v1",
    });
  });

  it("makes identical canonical manifest registration idempotent", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    const first = makeManifestV2();
    const second = structuredClone(first);

    const firstResolved = await registerV2(store, first);
    const reload = vi.fn(() => makeExecutableBundleV2(second));
    const secondResolved = await store.registerExactPackage({
      manifest: second,
      executableArtifact: executableArtifactV2(second.modelId),
      loadExecutables: reload,
    });

    expect(secondResolved).toBe(firstResolved);
    expect(reload).not.toHaveBeenCalled();
    expect(store.modelCount).toBe(1);
    expect(store.packageCount).toBe(1);
  });

  it("rejects any normative manifest change for the same modelId", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    await registerV2(store, makeManifestV2());

    const changedRuntime = makeManifestV2() as any;
    changedRuntime.runtime.entrypoint = "runtime/changed";
    await expect(registerV2(store, changedRuntime)).rejects.toBeInstanceOf(
      RegisteredModelConflictErrorV2,
    );

    const changedCodec = makeManifestV2() as any;
    changedCodec.checkpointCodec.checkpointCodecId =
      "circulation-checkpoint-v2";
    await expect(registerV2(store, changedCodec)).rejects.toBeInstanceOf(
      RegisteredModelConflictErrorV2,
    );
    expect(store.modelCount).toBe(1);
  });

  it("accepts changed normative content only under a new exact modelId", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    await registerV2(store, makeManifestV2());
    const next = makeManifestV2("circulation-reference-v2") as any;
    next.runtime.entrypoint = "runtime/reference-v2";

    await registerV2(store, next);

    expect(store.modelCount).toBe(2);
    expect(store.packageCount).toBe(2);
    expect(store.resolveContract("circulation-reference-v2").modelId)
      .toBe("circulation-reference-v2");
  });

  it("rejects incomplete manifests and empty normative definitions", async () => {
    const mutations: Array<(manifest: any) => void> = [
      (manifest) => delete manifest.solver,
      (manifest) => {
        manifest.equations = {};
      },
      (manifest) => {
        manifest.runtime = {};
      },
      (manifest) => {
        manifest.solver = {};
      },
      (manifest) => {
        manifest.fixtureSchema.definition = {};
      },
      (manifest) => {
        manifest.checkpointCodec.definition = {};
      },
      (manifest) => {
        manifest.snapshotGate.definition = {};
      },
    ];
    for (const mutate of mutations) {
      const manifest = makeManifestV2() as any;
      mutate(manifest);
      await expect(registerV2(new InMemoryRegisteredModelStoreV2(), manifest))
        .rejects.toBeInstanceOf(RegisteredModelValidationErrorV2);
    }
  });

  it("rejects metadata escape hatches, malformed catalogs, non-JSON, and negative zero", async () => {
    const leakedBuild = makeManifestV2() as any;
    leakedBuild.catalogs.parameterCatalog[0].buildId = "build-123";
    await expect(registerV2(new InMemoryRegisteredModelStoreV2(), leakedBuild))
      .rejects.toThrow(/exactly/);

    const leakedIntegrity = makeManifestV2() as any;
    leakedIntegrity.catalogs.controlCatalog[0].contentHash = "internal-only";
    await expect(registerV2(new InMemoryRegisteredModelStoreV2(), leakedIntegrity))
      .rejects.toThrow(/exactly/);

    const unknownDependency = makeManifestV2() as any;
    unknownDependency.catalogs.outputCatalog[1].dependencies = [
      "output/missing",
    ];
    await expect(registerV2(new InMemoryRegisteredModelStoreV2(),
      unknownDependency,
    )).rejects.toThrow(/unknown output dependency/);

    const nonJson = makeManifestV2() as any;
    nonJson.runtime.entrypoint = Number.NaN;
    await expect(registerV2(new InMemoryRegisteredModelStoreV2(), nonJson))
      .rejects.toBeInstanceOf(RegisteredModelValidationErrorV2);

    const negativeZero = makeManifestV2() as any;
    negativeZero.solver.zero = -0;
    await expect(registerV2(new InMemoryRegisteredModelStoreV2(), negativeZero))
      .rejects.toThrow(/negative zero/);
  });

  it("keeps the digest private and performs no client-side hash on resolve", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    await registerV2(store, makeManifestV2());
    const digestSpy = vi.spyOn(globalThis.crypto.subtle, "digest");
    digestSpy.mockClear();

    const contract = store.resolveContract("circulation-reference-v1");
    const resolvedPackage = store.resolvePackage("circulation-reference-v1");

    expect(digestSpy).not.toHaveBeenCalled();
    expect(Object.keys(contract).sort()).toEqual([
      "checkpointCodecId",
      "controlCatalog",
      "displayName",
      "fixtureSchemaId",
      "graphCatalog",
      "modelFamilyId",
      "modelId",
      "outputCatalog",
      "parameterCatalog",
      "snapshotGateId",
    ]);
    expect(JSON.stringify({ contract, resolvedPackage })).not.toMatch(
      /digest|checksum|sha256|buildId|contentHash/i,
    );
    digestSpy.mockRestore();
  });

  it("atomically binds every executable adapter to the exact registered identities", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    const manifest = makeManifestV2();
    await registerV2(store, manifest);

    const runtime = store.resolveExactRuntime(manifest.modelId);
    expect(store).not.toHaveProperty("registerCaptureAdapter");
    expect(runtime.captureAdapter).toMatchObject({
      modelId: manifest.modelId,
      fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
      checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    });
    expect(runtime.snapshotGate).toMatchObject({
      modelId: manifest.modelId,
      snapshotGateId: manifest.snapshotGate.snapshotGateId,
    });
    expect(JSON.stringify(runtime)).not.toMatch(
      /artifact|bytes|digest|hash/i,
    );
  });

  it("rejects empty or changed executable artifacts and mismatched bundles", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    const manifest = makeManifestV2();
    await registerV2(store, manifest);

    await expect(registerV2(
      store,
      manifest,
      new Uint8Array([9, 9, 9]),
    )).rejects.toBeInstanceOf(RegisteredModelConflictErrorV2);
    await expect(registerV2(
      new InMemoryRegisteredModelStoreV2(),
      manifest,
      new Uint8Array(),
    )).rejects.toThrow(/nonempty Uint8Array/);

    const wrongBundle = makeExecutableBundleV2(manifest) as any;
    wrongBundle.snapshotGate = {
      ...wrongBundle.snapshotGate,
      snapshotGateId: "gate/wrong",
    };
    const mismatchStore = new InMemoryRegisteredModelStoreV2();
    await expect(registerV2(
      mismatchStore,
      manifest,
      executableArtifactV2(manifest.modelId),
      wrongBundle,
    )).rejects.toThrow(/must exactly match/);
    expect(mismatchStore.modelCount).toBe(0);
    expect(mismatchStore.packageCount).toBe(0);

    const leakedBytes = makeExecutableBundleV2(manifest) as any;
    leakedBytes.fixtureAdapter.artifactBytes = [1, 2, 3];
    await expect(registerV2(
      new InMemoryRegisteredModelStoreV2(),
      manifest,
      executableArtifactV2(manifest.modelId),
      leakedBytes,
    )).rejects.toThrow(/fixture adapter must contain exactly/);
  });
});

function registerV2(
  store: InMemoryRegisteredModelStoreV2,
  manifest: RegisteredModelPackageManifestV2,
  executableArtifact = executableArtifactV2(manifest.modelId),
  executables = makeExecutableBundleV2(manifest),
) {
  return store.registerExactPackage({
    manifest,
    executableArtifact,
    loadExecutables(artifact) {
      expect(artifact).not.toBe(executableArtifact);
      expect(artifact).toEqual(executableArtifact);
      return executables;
    },
  });
}

function executableArtifactV2(modelId: string): Uint8Array {
  return new TextEncoder().encode(`exact-executable:${modelId}`);
}

function makeExecutableBundleV2(
  manifest: RegisteredModelPackageManifestV2,
) {
  const captureAdapter = makeCaptureAdapterV2(manifest);
  return {
    modelId: manifest.modelId,
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    snapshotGateId: manifest.snapshotGate.snapshotGateId,
    captureAdapter,
    draftCapture: {
      modelId: manifest.modelId,
      fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
      checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
      captureAcceptedCandidate(input: any) {
        return Promise.resolve({
          content: {
            modelId: input.desiredContent.modelId,
            scenarios: input.desiredContent.scenarios.map((scenario: any) => ({
              scenarioId: scenario.scenarioId,
              label: scenario.label,
              capture: {
                fixture: scenario.fixture,
                checkpoint: {
                  acceptedRevision: 1,
                  acceptedTimeSec: 0.1,
                  payload: {},
                },
              },
            })),
            surface: input.desiredContent.surface,
          },
          confirmation: {
            experimentId: input.experimentId,
            runtimeSessionId: input.correlation.runtimeSessionId,
            scenarios: input.correlation.scenarios,
          },
        });
      },
    },
    snapshotGate: {
      modelId: manifest.modelId,
      snapshotGateId: manifest.snapshotGate.snapshotGateId,
      qualifyFrozenCandidate({ content }: any) {
        return Promise.resolve({ status: "passed" as const, qualifiedContent: content });
      },
    },
    fixtureAdapter: {
      modelId: manifest.modelId,
      fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
      validateCompleteFixture() {},
    },
  };
}

function makeManifestV2(
  modelId = "circulation-reference-v1",
): RegisteredModelPackageManifestV2 {
  return {
    schemaId: STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
    modelId,
    modelFamilyId: "circulation-reference",
    displayName: "Reference circulation",
    equations: {
      system: "five-wall",
    },
    runtime: {
      entrypoint: "runtime/reference-v1",
    },
    solver: {
      method: "backward-euler",
    },
    fixtureSchema: {
      fixtureSchemaId: "circulation-fixture-v1",
      definition: {
        rootType: "object",
      },
    },
    checkpointCodec: {
      checkpointCodecId: "circulation-checkpoint-v1",
      definition: {
        format: "accepted-state-json-v1",
      },
    },
    snapshotGate: {
      snapshotGateId: "circulation-minimum-gate-v1",
      definition: {
        policy: "minimum-numerical-v1",
      },
    },
    catalogs: {
      parameterCatalog: [{
        parameterId: "circulation.tbv",
      }],
      controlCatalog: [{
        controlId: "control.tbv",
        parameterIds: ["circulation.tbv"],
      }],
      outputCatalog: [{
        outputId: "hemodynamics.pressure.lv",
        kind: "signal",
        unit: "mmHg",
        shape: "scalar",
        sampling: "accepted-step",
      }, {
        outputId: "hemodynamics.ef",
        kind: "metric",
        unit: "1",
        shape: "scalar",
        scope: "beat",
        dependencies: ["hemodynamics.pressure.lv"],
      }],
      graphCatalog: [{
        graphId: "graph.lv-pressure",
        outputIds: ["hemodynamics.pressure.lv"],
      }],
    },
  };
}

function makeCaptureAdapterV2(
  manifest = makeManifestV2(),
): RegisteredModelCaptureAdapterV2 {
  return {
    modelId: manifest.modelId,
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    validateFixture() {},
    validateCapture() {},
  };
}
