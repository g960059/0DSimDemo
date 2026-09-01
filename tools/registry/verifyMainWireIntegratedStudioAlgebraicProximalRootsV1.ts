import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertModelContractV2,
  type ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import {
  importExactExecutableArtifactModuleV2,
} from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_HOT_PATH_INTEGRITY_TIER_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRelativeRoot =
  "studio/integrations/mainWireIntegratedV3/";
const entryRelativePath = integrationRelativeRoot
  + "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.entry.ts";
const artifactRelativePath = integrationRelativeRoot
  + "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.artifact.mjs";
const clientDescriptorRelativePath = integrationRelativeRoot
  + "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.client.json";
const lockRelativePath = integrationRelativeRoot
  + "algebraic-proximal-roots-standard67-registry-admission-lock.json";
const entryPath = path.join(repositoryRoot, entryRelativePath);
const artifactPath = path.join(repositoryRoot, artifactRelativePath);
const clientDescriptorPath = path.join(
  repositoryRoot,
  clientDescriptorRelativePath,
);
const lockPath = path.join(repositoryRoot, lockRelativePath);

const CLIENT_DESCRIPTOR_SCHEMA_ID_V1 =
  "circleheart-standard-exact-model-client-descriptor-v1" as const;
const REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2 =
  "circleheart-standard-exact-model-registry-admission-lock-v2" as const;

type ReleaseV1 = ReturnType<
  typeof createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1
>;

await main();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const updateRequested = args.length === 1 && args[0] === "--write";
  if (args.length > 0 && !updateRequested) {
    fail("the only supported argument is --write");
  }

  const sourceRelease =
    createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1();
  assertStandard67ManifestV1(sourceRelease.manifest);
  const firstBuild = await buildArtifactV1();
  const secondBuild = await buildArtifactV1();
  if (!sameBytesV1(firstBuild, secondBuild)) {
    fail("two clean Standard67 artifact builds emitted different bytes");
  }

  const canonicalManifest = studioCanonicalJsonStringify(
    sourceRelease.manifest,
  );
  const artifactRevisionId = exactPackageSha256V1(
    canonicalManifest,
    firstBuild,
  );
  const artifactSha256 = sha256V1(firstBuild);
  await assertArtifactAdmissionV1(firstBuild, sourceRelease);

  const descriptor = Object.freeze({
    schemaId: CLIENT_DESCRIPTOR_SCHEMA_ID_V1,
    manifest: sourceRelease.manifest,
    defaultFixture:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  });
  const lock = Object.freeze({
    schemaId: REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2,
    modelId: sourceRelease.manifest.modelId,
    artifactRevisionId,
    artifactSha256,
    predecessorArtifactRevisionId: null,
    equivalenceReportSha256: null,
  });

  if (updateRequested) {
    assertExistingIdentityCanBeWrittenV1(lock);
    writeFileSync(artifactPath, firstBuild);
    writeFileSync(
      clientDescriptorPath,
      `${JSON.stringify(descriptor, null, 2)}\n`,
      "utf8",
    );
    writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
    process.stdout.write(
      `Wrote algebraic-proximal-roots Standard67 exact release (${artifactRevisionId})\n`,
    );
    return;
  }

  for (const requiredPath of [artifactPath, clientDescriptorPath, lockPath]) {
    if (!existsSync(requiredPath)) {
      fail("committed artifact, client descriptor, or lock is missing");
    }
  }
  const committedArtifact = new Uint8Array(readFileSync(artifactPath));
  if (!sameBytesV1(committedArtifact, firstBuild)) {
    fail(`${artifactRelativePath} differs from its deterministic build`);
  }
  const committedDescriptor = JSON.parse(
    readFileSync(clientDescriptorPath, "utf8"),
  ) as unknown;
  const committedLock = JSON.parse(readFileSync(lockPath, "utf8")) as unknown;
  if (
    studioCanonicalJsonStringify(committedDescriptor)
      !== studioCanonicalJsonStringify(descriptor)
    || studioCanonicalJsonStringify(committedLock)
      !== studioCanonicalJsonStringify(lock)
  ) {
    fail("committed client descriptor or admission lock differs");
  }
  assertImmutableAgainstBaseV1(lock);
  process.stdout.write(
    `Algebraic-proximal-roots Standard67 registry admission verified: ${lock.modelId} (${artifactRevisionId})\n`,
  );
}

function assertStandard67ManifestV1(
  manifest: ExactModelKernelManifestV3,
): void {
  if (
    manifest.modelId
      !== "circleheart.main-wire-integrated-transaction-v3.algebraic-proximal-roots.standard-67"
    || manifest.equations.fixtureId
      !== "main-wire-integrated-model-algebraic-proximal-roots-fixture-v1"
    || manifest.equations.proximalArterialRootsProfileId
      !== "main-wire-algebraic-proximal-arterial-roots-profile-v1"
    || manifest.runtime.numericalSessionId
      !== "main-wire-integrated-model-standard67-typed-authority-session-v1"
    || manifest.checkpointCodec.definition.checkpointId
      !== "circleheart.main-wire-integrated-model-standard67-exact-checkpoint.v1"
  ) {
    fail("source release does not bind the complete Standard67 identity");
  }
  if (manifest.capabilities.some((value) => value.startsWith("analysis/"))) {
    fail("exact model must not reserve analysis output capabilities");
  }
}

async function buildArtifactV1(): Promise<Uint8Array> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY":
        JSON.stringify(
          MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PROXIMAL_ROOTS_HOT_PATH_INTEGRITY_TIER_V1,
        ),
    },
    resolve: { alias: { "@": repositoryRoot } },
    build: {
      target: "es2022",
      minify: false,
      sourcemap: false,
      write: false,
      lib: {
        entry: entryPath,
        formats: ["es"],
        fileName: () =>
          "main-wire-integrated-algebraic-proximal-roots-standard67-v1.mjs",
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.length === 1 && outputs[0] !== undefined
    && "output" in outputs[0]
    ? outputs[0].output.filter((item) => item.type === "chunk")
    : [];
  if (
    chunks.length !== 1
    || chunks[0] === undefined
    || chunks[0].imports.length !== 0
    || chunks[0].dynamicImports.length !== 0
  ) {
    fail("exact build must emit one self-contained ESM chunk");
  }
  return new TextEncoder().encode(chunks[0].code);
}

async function assertArtifactAdmissionV1(
  artifact: Uint8Array,
  sourceRelease: ReleaseV1,
): Promise<void> {
  const namespace = await importExactExecutableArtifactModuleV2(artifact);
  const factory = namespace.createCircleHeartExactModelReleaseV1;
  if (typeof factory !== "function") {
    fail("artifact omits createCircleHeartExactModelReleaseV1");
  }
  const produced = await factory() as ReleaseV1;
  if (
    studioCanonicalJsonStringify(produced.manifest)
      !== studioCanonicalJsonStringify(sourceRelease.manifest)
  ) {
    fail("artifact manifest differs from source");
  }
  const model = exactContractV1(produced.manifest);
  validateExecutableBundleV2(produced.executables, model);
  const scenarioId = "scenario/standard67-registry";
  const sourceSessionId = "session/standard67-registry";
  const restoredSessionId = "session/standard67-registry-restored";
  await produced.executables.simulationAdapter.createSession({
    runtimeSessionId: sourceSessionId,
    scenarios: [{
      scenarioId,
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }],
  });
  try {
    const advanced =
      await produced.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: sourceSessionId,
        scenarioId,
      });
    if (
      advanced.modelId !== model.modelId
      || advanced.acceptedRevision !== 1
      || advanced.acceptedTimeSec !== 0.002
    ) {
      fail("artifact did not advance its accepted Standard67 owner");
    }
    const captured = await produced.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: "experiment/standard67-registry",
        model,
        desiredContent: {
          modelId: model.modelId,
          surfaceSeriesId: "surface/standard67-registry",
          scenarios: [{
            scenarioId,
            label: "Baseline",
            fixture:
              MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
          }],
          surface: {
            graphPanes: [],
            outputPanes: [],
            controlPanes: [],
            note: { text: "" },
          },
        },
        correlation: {
          runtimeSessionId: sourceSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const capture = captured.content.scenarios[0]?.capture;
    if (
      capture === undefined
      || (capture.checkpoint.payload as { checkpointId?: unknown })
        .checkpointId
        !== "circleheart.main-wire-integrated-model-standard67-exact-checkpoint.v1"
    ) {
      fail("artifact captured the wrong exact checkpoint identity");
    }
    await produced.executables.captureAdapter.validateCapture({
      model,
      capture,
    });
    await produced.executables.simulationAdapter.createSession({
      runtimeSessionId: restoredSessionId,
      scenarios: [{
        scenarioId,
        fixture: capture.fixture,
        checkpoint: capture.checkpoint,
      }],
    });
    const continued =
      await produced.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: restoredSessionId,
        scenarioId,
      });
    const uninterrupted =
      await produced.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: sourceSessionId,
        scenarioId,
      });
    if (
      studioCanonicalJsonStringify(continued.outputs)
        !== studioCanonicalJsonStringify(uninterrupted.outputs)
    ) {
      fail("artifact checkpoint continuation differs from uninterrupted output");
    }
  } finally {
    produced.executables.simulationAdapter.disposeSession(sourceSessionId);
    produced.executables.simulationAdapter.disposeSession(restoredSessionId);
  }
}

function exactContractV1(
  manifest: ExactModelKernelManifestV3,
): ModelContractV2 {
  const model = Object.freeze({
    modelId: manifest.modelId,
    modelFamilyId: manifest.modelFamilyId,
    displayName: "Main Wire Standard 67",
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    controlCatalog: manifest.primitiveControlCatalog,
    outputCatalog: Object.freeze([
      ...manifest.primitiveSignalCatalog,
      ...manifest.modelMetricCatalog,
    ]),
    graphCatalog: Object.freeze([]),
  }) satisfies ModelContractV2;
  assertModelContractV2(model);
  return model;
}

function assertExistingIdentityCanBeWrittenV1(
  next: Readonly<{ modelId: string; artifactRevisionId: string }>,
): void {
  if (!existsSync(lockPath)) return;
  const current = JSON.parse(readFileSync(lockPath, "utf8")) as {
    modelId?: unknown;
    artifactRevisionId?: unknown;
  };
  if (
    current.modelId !== next.modelId
    || current.artifactRevisionId !== next.artifactRevisionId
  ) {
    const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF
      || "origin/main";
    try {
      execFileSync("git", ["show", `${baseRef}:${lockRelativePath}`], {
        cwd: repositoryRoot,
        stdio: "ignore",
      });
    } catch {
      // The candidate identity has not been admitted on the base branch yet.
      return;
    }
    fail(
      "an existing Standard67 identity cannot be rewritten without explicit same-model equivalence evidence",
    );
  }
}

function assertImmutableAgainstBaseV1(
  current: Readonly<{ modelId: string; artifactRevisionId: string }>,
): void {
  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  if (baseRef === undefined || baseRef === "" || /^0+$/.test(baseRef)) return;
  let raw: string;
  try {
    raw = execFileSync("git", ["show", `${baseRef}:${lockRelativePath}`], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return;
  }
  const prior = JSON.parse(raw) as {
    modelId?: unknown;
    artifactRevisionId?: unknown;
  };
  if (
    prior.modelId !== current.modelId
    || prior.artifactRevisionId !== current.artifactRevisionId
  ) {
    fail("the committed Standard67 exact identity changed against the base ref");
  }
}

function exactPackageSha256V1(
  canonicalManifest: string,
  artifact: Uint8Array,
): string {
  const manifestBytes = new TextEncoder().encode(canonicalManifest);
  const framed = new Uint8Array(
    8 + manifestBytes.byteLength + artifact.byteLength,
  );
  const lengths = new DataView(framed.buffer, framed.byteOffset, 8);
  lengths.setUint32(0, manifestBytes.byteLength, false);
  lengths.setUint32(4, artifact.byteLength, false);
  framed.set(manifestBytes, 8);
  framed.set(artifact, 8 + manifestBytes.byteLength);
  return sha256V1(framed);
}

function sha256V1(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sameBytesV1(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((value, index) => value === right[index]);
}

function fail(message: string): never {
  throw new Error(
    `Algebraic-proximal-roots Standard67 registry verification failed: ${message}`,
  );
}
