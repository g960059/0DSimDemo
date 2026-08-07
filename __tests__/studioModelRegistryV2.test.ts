import { describe, expect, it, vi } from "vitest";

import {
  STUDIO_REGISTERED_MODEL_PACKAGE_V2_SCHEMA_ID,
  assertModelContractV2,
  deriveModelContractFromManifestV2,
  type RegisteredModelCaptureAdapterV2,
  type RegisteredModelPackageManifestV2,
} from "@/studio/contracts/v2/model";
import {
  STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
  STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
  assertAdditiveModelSurfaceUpgradeV1,
  assertExactModelKernelManifestV3,
  assertModelSurfaceCompatibleV1,
  assertModelSurfaceReleaseManifestV1,
  assertStudioReleaseChannelV1,
  assertStudioReleaseStageV1,
  controlCapabilityV1,
  derivationCapabilityV1,
  materializeModelSurfaceForModelV1,
  outputCapabilityV1,
  type ExactModelKernelManifestV3,
  type ModelSurfaceReleaseManifestV1,
} from "@/studio/contracts/v2/modelSurface";
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
      controlCatalog: [{
        changeSemantics: "accepted-state-warm-start",
        controlId: "control.tbv",
        defaultValue: 5_000,
        maximum: 7_000,
        minimum: 3_000,
        step: 10,
        unit: "mL",
        valueType: "number",
      }],
      outputCatalog: manifest.catalogs.outputCatalog,
      graphCatalog: [{
        defaultSeriesIds: ["LVP"],
        graphId: "graph.lv-pressure",
        renderer: "sweep",
        seriesCatalog: [{
          kind: "scalar",
          seriesId: "LVP",
          outputId: "hemodynamics.pressure.lv",
        }],
      }],
    });
    expect(Object.keys(resolvedPackage).sort()).toEqual([
      "contract",
      "manifest",
    ]);
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.controlCatalog[0])).toBe(true);
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
    leakedBuild.catalogs.graphCatalog[0].buildId = "build-123";
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

  it("canonicalizes inherited array methods as data-free prototype state", async () => {
    const manifest = makeManifestV2() as any;
    let callCount = 0;
    const map = vi.fn(() => {
      callCount += 1;
      return callCount === 1
        ? ["0"]
        : [JSON.stringify({ controlId: "forged" })];
    });
    const prototype = Object.create(Array.prototype) as { map: typeof map };
    prototype.map = map;
    Object.setPrototypeOf(manifest.catalogs.controlCatalog, prototype);

    const contract = await registerV2(
      new InMemoryRegisteredModelStoreV2(),
      manifest,
    );

    expect(contract.controlCatalog).toEqual([{
      changeSemantics: "accepted-state-warm-start",
      controlId: "control.tbv",
      defaultValue: 5_000,
      maximum: 7_000,
      minimum: 3_000,
      step: 10,
      unit: "mL",
      valueType: "number",
    }]);
    expect(map).not.toHaveBeenCalled();
  });

  it("rejects own array methods without executing them during canonicalization", async () => {
    const manifest = makeManifestV2() as any;
    const map = vi.fn(() => {
      throw new Error("untrusted array method executed");
    });
    Object.defineProperty(manifest.catalogs.controlCatalog, "map", {
      enumerable: true,
      value: map,
    });

    await expect(registerV2(
      new InMemoryRegisteredModelStoreV2(),
      manifest,
    )).rejects.toThrow(/custom array properties/);
    expect(map).not.toHaveBeenCalled();
  });

  it("validates actual catalog IDs without invoking inherited array methods", () => {
    const contract = structuredClone(
      deriveModelContractFromManifestV2(makeManifestV2()),
    ) as any;
    contract.graphCatalog[0].seriesCatalog[0].outputId = "output/missing";
    const map = vi.fn(() => ["0"]);
    const forEach = vi.fn();
    const prototype = Object.create(Array.prototype) as {
      map: typeof map;
      forEach: typeof forEach;
    };
    prototype.map = map;
    prototype.forEach = forEach;
    Object.setPrototypeOf(contract.graphCatalog[0].seriesCatalog, prototype);

    expect(() => assertModelContractV2(contract)).toThrow(/unknown output/);
    expect(map).not.toHaveBeenCalled();
    expect(forEach).not.toHaveBeenCalled();
  });

  it("derives catalog copies without invoking inherited map, forEach, or iteration", () => {
    const manifest = makeManifestV2() as any;
    const catalog = manifest.catalogs.graphCatalog;
    const seriesCatalog = catalog[0].seriesCatalog;
    const catalogMap = vi.fn((callback: unknown) =>
      Array.prototype.map.call(catalog, callback));
    const seriesMap = vi.fn((callback: unknown) =>
      Array.prototype.map.call(seriesCatalog, callback));
    const seriesForEach = vi.fn((callback: unknown) =>
      Array.prototype.forEach.call(seriesCatalog, callback));
    const seriesIterator = vi.fn(() =>
      Array.prototype[Symbol.iterator].call(seriesCatalog));
    const catalogPrototype = Object.create(Array.prototype);
    Object.defineProperty(catalogPrototype, "map", { value: catalogMap });
    const idPrototype = Object.create(Array.prototype);
    Object.defineProperties(idPrototype, {
      map: { value: seriesMap },
      forEach: { value: seriesForEach },
      [Symbol.iterator]: { value: seriesIterator },
    });
    Object.setPrototypeOf(catalog, catalogPrototype);
    Object.setPrototypeOf(seriesCatalog, idPrototype);

    const contract = deriveModelContractFromManifestV2(manifest);

    expect(contract.graphCatalog).toEqual([{
      defaultSeriesIds: ["LVP"],
      graphId: "graph.lv-pressure",
      renderer: "sweep",
      seriesCatalog: [{
        kind: "scalar",
        seriesId: "LVP",
        outputId: "hemodynamics.pressure.lv",
      }],
    }]);
    expect(catalogMap).not.toHaveBeenCalled();
    expect(seriesMap).not.toHaveBeenCalled();
    expect(seriesForEach).not.toHaveBeenCalled();
    expect(seriesIterator).not.toHaveBeenCalled();
  });

  it("rejects mixed-unit outputs in a registered single-axis sweep graph", () => {
    const manifest = makeManifestV2() as any;
    manifest.catalogs.graphCatalog[0].seriesCatalog.push({
      kind: "scalar",
      seriesId: "EF",
      outputId: "hemodynamics.ef",
    });

    expect(() => deriveModelContractFromManifestV2(manifest))
      .toThrow(/sweep series must share one unit.*expected mmHg.*uses 1/);
  });

  it("rejects malformed graph-owned scalar series and default selection", () => {
    const mutations: Array<(graph: Record<string, any>) => void> = [
      (graph) => { graph.seriesCatalog = []; },
      (graph) => { graph.seriesCatalog[0].kind = "pressure-volume"; },
      (graph) => { graph.seriesCatalog[0].metadata = {}; },
      (graph) => {
        graph.seriesCatalog.push({
          ...graph.seriesCatalog[0],
          seriesId: graph.seriesCatalog[0].seriesId,
        });
      },
      (graph) => { graph.defaultSeriesIds = []; },
      (graph) => { graph.defaultSeriesIds = ["missing-series"]; },
      (graph) => { graph.defaultSeriesIds = ["LVP", "LVP"]; },
    ];

    for (const mutate of mutations) {
      const manifest = makeManifestV2() as any;
      mutate(manifest.catalogs.graphCatalog[0]);
      expect(() => deriveModelContractFromManifestV2(manifest)).toThrow();
    }
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
    expect(Object.isFrozen(runtime.simulationAdapter)).toBe(true);
    expect(typeof runtime.simulationAdapter.requestAnalysis).toBe("function");
    expect(JSON.stringify(runtime)).not.toMatch(
      /artifact|bytes|digest|hash/i,
    );
  });

  it("rejects an exact executable bundle without the analysis operation", async () => {
    const store = new InMemoryRegisteredModelStoreV2();
    const manifest = makeManifestV2();
    const bundle = makeExecutableBundleV2(manifest) as any;
    delete bundle.simulationAdapter.requestAnalysis;

    await expect(store.registerExactPackage({
      manifest,
      executableArtifact: executableArtifactV2(manifest.modelId),
      loadExecutables: () => bundle,
    })).rejects.toThrow(/simulation adapter.*requestAnalysis/);
    expect(store.modelCount).toBe(0);
  });

  it("rejects malformed numeric control ranges", async () => {
    const mutations: Array<(control: Record<string, unknown>) => void> = [
      (control) => { control.minimum = 7_000; },
      (control) => { control.maximum = 3_000; },
      (control) => { control.maximum = 7_001; },
      (control) => { control.step = 0; },
      (control) => { control.step = Number.MIN_VALUE; },
      (control) => { control.step = 4_001; },
      (control) => { control.defaultValue = 2_999; },
      (control) => { control.defaultValue = 5_005; },
      (control) => { control.valueType = "text"; },
      (control) => { control.changeSemantics = "live"; },
    ];

    for (const mutate of mutations) {
      const manifest = makeManifestV2() as any;
      mutate(manifest.catalogs.controlCatalog[0]);
      await expect(registerV2(
        new InMemoryRegisteredModelStoreV2(),
        manifest,
      )).rejects.toBeInstanceOf(RegisteredModelValidationErrorV2);
    }
  });

  it("validates graph-owned pressure-volume series and defaults", () => {
    const manifest = makeManifestV2() as any;
    manifest.catalogs.outputCatalog.push({
      outputId: "hemodynamics.volume.lv",
      kind: "signal",
      unit: "mL",
      shape: "scalar",
      sampling: "accepted-step",
    }, {
      outputId: "cardiac.cycle-phase",
      kind: "signal",
      unit: "1",
      shape: "scalar",
      sampling: "accepted-step",
    });
    manifest.catalogs.graphCatalog.push({
      graphId: "graph.lv-pressure-volume",
      renderer: "pressure-volume",
      seriesCatalog: [{
        kind: "pressure-volume",
        seriesId: "LV",
        volumeOutputId: "hemodynamics.volume.lv",
        pressureOutputId: "hemodynamics.pressure.lv",
        pressureBasis: "transmural",
        cyclePhaseOutputId: "cardiac.cycle-phase",
      }],
      defaultSeriesIds: ["LV"],
    });

    const contract = deriveModelContractFromManifestV2(manifest);
    expect(contract.graphCatalog[1]).toEqual({
      graphId: "graph.lv-pressure-volume",
      renderer: "pressure-volume",
      seriesCatalog: [{
        kind: "pressure-volume",
        seriesId: "LV",
        volumeOutputId: "hemodynamics.volume.lv",
        pressureOutputId: "hemodynamics.pressure.lv",
        pressureBasis: "transmural",
        cyclePhaseOutputId: "cardiac.cycle-phase",
      }],
      defaultSeriesIds: ["LV"],
    });
    const pressureVolume = contract.graphCatalog[1]!;
    expect(pressureVolume.renderer).toBe("pressure-volume");
    if (pressureVolume.renderer !== "pressure-volume") {
      throw new Error("expected pressure-volume graph");
    }
    expect(Object.isFrozen(pressureVolume.seriesCatalog)).toBe(true);
    expect(Object.isFrozen(pressureVolume.seriesCatalog[0])).toBe(true);
    expect(Object.isFrozen(pressureVolume.defaultSeriesIds)).toBe(true);

    manifest.catalogs.graphCatalog[1].seriesCatalog[0].pressureOutputId =
      "output/missing";
    expect(() => deriveModelContractFromManifestV2(manifest))
      .toThrow(/pressureOutputId.*unknown output/);

    manifest.catalogs.graphCatalog[1].seriesCatalog[0].pressureOutputId =
      "hemodynamics.pressure.lv";
    manifest.catalogs.graphCatalog[1].seriesCatalog[0].pressureBasis =
      "intracavitary";
    const intracavitaryContract = deriveModelContractFromManifestV2(manifest);
    const intracavitaryGraph = intracavitaryContract.graphCatalog[1]!;
    expect(intracavitaryGraph.renderer).toBe("pressure-volume");
    if (intracavitaryGraph.renderer !== "pressure-volume") {
      throw new Error("expected pressure-volume graph");
    }
    expect(intracavitaryGraph.seriesCatalog[0]?.pressureBasis)
      .toBe("intracavitary");
  });

  it("admits only exact on-demand structural-return graph definitions", () => {
    const structuralGraph = () => ({
      graphId: "graph.guyton-starling.right",
      renderer: "structural-return",
      analysisId: "analysis.guyton-starling.orientation-v1",
      side: "right",
    });
    const manifest = makeManifestV2() as any;
    manifest.catalogs.graphCatalog.push(structuralGraph());

    const contract = deriveModelContractFromManifestV2(manifest);
    expect(contract.graphCatalog[1]).toEqual(structuralGraph());
    expect(Object.isFrozen(contract.graphCatalog[1])).toBe(true);

    const mutations: Array<(graph: Record<string, unknown>) => void> = [
      (graph) => { graph.seriesCatalog = []; },
      (graph) => { graph.analysisId = "not portable"; },
      (graph) => { graph.side = "bilateral"; },
      (graph) => { graph.configuration = {}; },
    ];
    for (const mutate of mutations) {
      const candidate = makeManifestV2() as any;
      const graph = structuralGraph() as Record<string, unknown>;
      mutate(graph);
      candidate.catalogs.graphCatalog.push(graph);
      expect(() => deriveModelContractFromManifestV2(candidate)).toThrow();
    }
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

describe("exact model kernel and Model Surface release boundaries", () => {
  it("keeps Snapshot admission and presentation catalogs outside exact identity", () => {
    const kernel = makeKernelManifestV3();

    expect(() => assertExactModelKernelManifestV3(kernel)).not.toThrow();

    const leakedAdmission = structuredClone(kernel) as any;
    leakedAdmission.snapshotGate = { gateId: "admission/forbidden" };
    expect(() => assertExactModelKernelManifestV3(leakedAdmission))
      .toThrow(/keys must be exactly|must contain exactly/);

    const leakedGraph = structuredClone(kernel) as any;
    leakedGraph.graphCatalog = [];
    expect(() => assertExactModelKernelManifestV3(leakedGraph))
      .toThrow(/keys must be exactly|must contain exactly/);

    const leakedDisplayName = structuredClone(kernel) as any;
    leakedDisplayName.displayName = "Presentation metadata";
    expect(() => assertExactModelKernelManifestV3(leakedDisplayName))
      .toThrow(/keys must be exactly|must contain exactly/);
  });

  it("validates a separately released Surface against exact capabilities", () => {
    const model = deriveModelContractFromManifestV2(makeManifestV2());
    const surface = makeSurfaceManifestV1();

    expect(() => assertModelSurfaceReleaseManifestV1(surface)).not.toThrow();
    expect(() => assertModelSurfaceCompatibleV1(surface, model, [
      derivationCapabilityV1("derivation/stroke-work-v1"),
    ])).not.toThrow();

    const incompatible = structuredClone(surface) as any;
    incompatible.derivedOutputCatalog[0].requiredCapabilities.push(
      "output/not-supplied",
    );
    expect(() => assertModelSurfaceCompatibleV1(incompatible, model, [
      derivationCapabilityV1("derivation/stroke-work-v1"),
    ]))
      .toThrow(/unsupported by the pinned exact model/);
    const materialized = materializeModelSurfaceForModelV1(
      incompatible,
      model,
      [derivationCapabilityV1("derivation/stroke-work-v1")],
    );
    expect(materialized.controlCatalog).toHaveLength(1);
    expect(materialized.derivedOutputCatalog).toHaveLength(0);
    expect(materialized.graphCatalog).toHaveLength(0);

    const unresolvedDerivation = structuredClone(surface) as any;
    unresolvedDerivation.derivedOutputCatalog[0].requiredCapabilities =
      unresolvedDerivation.derivedOutputCatalog[0].requiredCapabilities.filter(
        (capability: string) => !capability.startsWith("derivation/"),
      );
    expect(() => assertModelSurfaceReleaseManifestV1(unresolvedDerivation))
      .toThrow(/requires capability derivation\//);
  });

  it("allows append-only Surface growth but rejects mutation or deletion", () => {
    const previous = makeSurfaceManifestV1();
    const added = structuredClone(previous) as any;
    added.surfaceReleaseId = "surface/circulation-reference-v2";
    added.predecessorSurfaceReleaseId = previous.surfaceReleaseId;
    added.protocolCatalog.push({
      protocolId: "protocol/fluid-challenge",
      requiredCapabilities: [controlCapabilityV1("control.tbv")],
      steps: [{
        atSec: 0,
        actions: [{ controlId: "control.tbv", value: 5_250 }],
      }],
    });

    expect(() => assertAdditiveModelSurfaceUpgradeV1(previous, added))
      .not.toThrow();

    const changed = structuredClone(added) as any;
    changed.controlCatalog[0].preferredPresentation = "buttons";
    expect(() => assertAdditiveModelSurfaceUpgradeV1(previous, changed))
      .toThrow(/cannot change existing definition/);

    const removed = structuredClone(added) as any;
    removed.graphCatalog = [];
    expect(() => assertAdditiveModelSurfaceUpgradeV1(previous, removed))
      .toThrow(/cannot remove/);

    const wrongPredecessor = structuredClone(added) as any;
    wrongPredecessor.predecessorSurfaceReleaseId = "surface/wrong-v1";
    expect(() => assertAdditiveModelSurfaceUpgradeV1(
      previous,
      wrongPredecessor,
    )).toThrow(/predecessorSurfaceReleaseId/);
  });

  it("rejects unsafe Knob domains and enforces declared neutral defaults", () => {
    const model = deriveModelContractFromManifestV2(makeManifestV2());
    const outsideDomain = structuredClone(makeSurfaceManifestV1()) as any;
    outsideDomain.knobCatalog[0].targets[0].scale = 2;
    expect(() => assertModelSurfaceCompatibleV1(
      outsideDomain,
      model,
      [derivationCapabilityV1("derivation/stroke-work-v1")],
    )).toThrow(/mapping at 7000 must be within/);

    const nonneutral = structuredClone(makeSurfaceManifestV1()) as any;
    nonneutral.knobCatalog[0].targets[0].scale = 0.5;
    nonneutral.knobCatalog[0].targets[0].offset = 2_000;
    expect(() => assertModelSurfaceCompatibleV1(
      nonneutral,
      model,
      [derivationCapabilityV1("derivation/stroke-work-v1")],
    )).toThrow(/must reproduce primitive default/);

    nonneutral.knobCatalog[0].neutralAtDefault = false;
    expect(() => assertModelSurfaceCompatibleV1(
      nonneutral,
      model,
      [derivationCapabilityV1("derivation/stroke-work-v1")],
    )).not.toThrow();
  });

  it("exposes only the agreed lifecycle vocabulary", () => {
    expect(() => assertStudioReleaseStageV1("dev")).not.toThrow();
    expect(() => assertStudioReleaseStageV1("stable")).not.toThrow();
    expect(() => assertStudioReleaseStageV1("retired")).not.toThrow();
    expect(() => assertStudioReleaseStageV1("preview")).toThrow();
    expect(() => assertStudioReleaseChannelV1("default")).not.toThrow();
    expect(() => assertStudioReleaseChannelV1("research")).not.toThrow();
    expect(() => assertStudioReleaseChannelV1("nightly")).toThrow();
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

function makeKernelManifestV3(): ExactModelKernelManifestV3 {
  const legacy = makeManifestV2();
  const control = legacy.catalogs.controlCatalog[0]!;
  const signal = legacy.catalogs.outputCatalog[0]!;
  if (signal.kind !== "signal") throw new Error("test signal missing");
  return {
    schemaId: STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
    modelId: legacy.modelId,
    modelFamilyId: legacy.modelFamilyId,
    equations: legacy.equations,
    runtime: legacy.runtime,
    solver: legacy.solver,
    fixtureSchema: legacy.fixtureSchema,
    checkpointCodec: legacy.checkpointCodec,
    primitiveControlCatalog: [control],
    primitiveSignalCatalog: [signal],
    capabilities: [
      controlCapabilityV1(control.controlId),
      outputCapabilityV1(signal.outputId),
    ],
  };
}

function makeSurfaceManifestV1(): ModelSurfaceReleaseManifestV1 {
  return {
    schemaId: STUDIO_MODEL_SURFACE_RELEASE_V1_SCHEMA_ID,
    surfaceReleaseId: "surface/circulation-reference-v1",
    surfaceSeriesId: "surface-series/circulation-reference",
    predecessorSurfaceReleaseId: null,
    modelFamilyId: "circulation-reference",
    displayName: "Reference circulation Surface",
    controlCatalog: [{
      controlId: "control.tbv",
      preferredPresentation: "slider",
      requiredCapabilities: [controlCapabilityV1("control.tbv")],
    }],
    derivedOutputCatalog: [{
      outputId: "hemodynamics.stroke-work",
      kind: "metric",
      unit: "mmHg mL",
      shape: "scalar",
      scope: "beat",
      dependencies: ["hemodynamics.pressure.lv"],
      derivationId: "derivation/stroke-work-v1",
      requiredCapabilities: [
        outputCapabilityV1("hemodynamics.pressure.lv"),
        derivationCapabilityV1("derivation/stroke-work-v1"),
      ],
    }],
    graphCatalog: [{
      graphId: "graph.stroke-work",
      renderer: "sweep",
      seriesCatalog: [{
        kind: "scalar",
        seriesId: "stroke-work",
        outputId: "hemodynamics.stroke-work",
      }],
      defaultSeriesIds: ["stroke-work"],
      requiredCapabilities: [],
    }],
    knobCatalog: [{
      knobId: "knob/volume",
      unit: "mL",
      minimum: 3_000,
      maximum: 7_000,
      step: 10,
      defaultValue: 5_000,
      neutralAtDefault: true,
      requiredCapabilities: [controlCapabilityV1("control.tbv")],
      targets: [{ controlId: "control.tbv", scale: 1, offset: 0 }],
    }],
    protocolCatalog: [],
  };
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
    experimentCapture: {
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
      admitFrozenCandidate() {
        return Promise.resolve({ status: "passed" as const });
      },
    },
    fixtureAdapter: {
      modelId: manifest.modelId,
      fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
      validateCompleteFixture() { return undefined; },
    },
    simulationAdapter: {
      modelId: manifest.modelId,
      fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
      checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
      async createSession() {},
      disposeSession() {},
      currentFrame() {
        throw new Error("not used");
      },
      advanceOnePresentationStep() {
        throw new Error("not used");
      },
      applyControl() {
        throw new Error("not used");
      },
      requestAnalysis() {
        throw new Error("not used");
      },
      async replaceFixture() {
        return 0;
      },
      currentInputEpoch() {
        return 0;
      },
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
      controlCatalog: [{
        controlId: "control.tbv",
        valueType: "number",
        unit: "mL",
        minimum: 3_000,
        maximum: 7_000,
        step: 10,
        defaultValue: 5_000,
        changeSemantics: "accepted-state-warm-start",
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
        renderer: "sweep",
        seriesCatalog: [{
          kind: "scalar",
          seriesId: "LVP",
          outputId: "hemodynamics.pressure.lv",
        }],
        defaultSeriesIds: ["LVP"],
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
    async validateCapture() {},
  };
}
