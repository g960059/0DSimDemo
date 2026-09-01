import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import { studioCanonicalJsonStringify } from "@/domain/json/CanonicalJson";
import {
  qualifyMainWireIntegratedModelRoundedEjectionBaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineQualificationV1";
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
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1,
  createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionExactModelV1";
import {
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRelativeRoot =
  "studio/integrations/mainWireIntegratedV3/";
const requestedArguments = process.argv.slice(2);
const roundedEjectionRequested = requestedArguments.includes(
  "--rounded-ejection",
);
const updateRequested = requestedArguments.includes("--write");
if (requestedArguments.some((argument) =>
  argument !== "--write" && argument !== "--rounded-ejection")) {
  throw new Error("supported arguments are --write and --rounded-ejection");
}
const releaseConfigurationV1 = roundedEjectionRequested
  ? Object.freeze({
      label: "rounded-ejection Standard68",
      idSlug: "rounded-ejection-standard68",
      displayName: "Main Wire Standard 68",
      entryFile: "MainWireIntegratedStudioRoundedEjectionExactModelV1.entry.ts",
      artifactFile:
        "MainWireIntegratedStudioRoundedEjectionExactModelV1.artifact.mjs",
      descriptorFile:
        "MainWireIntegratedStudioRoundedEjectionExactModelV1.client.json",
      lockFile: "rounded-ejection-standard68-registry-admission-lock.json",
      artifactChunkName:
        "main-wire-integrated-rounded-ejection-standard68-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.rounded-ejection.standard-68",
      fixtureId: "main-wire-integrated-model-rounded-ejection-fixture-v1",
      proximalArterialRootsProfileId: null,
      numericalSessionId:
        "main-wire-integrated-model-standard68-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard68-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1,
    })
  : Object.freeze({
      label: "algebraic-proximal-roots Standard67",
      idSlug: "algebraic-proximal-roots-standard67",
      displayName: "Main Wire Standard 67",
      entryFile:
        "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.entry.ts",
      artifactFile:
        "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.artifact.mjs",
      descriptorFile:
        "MainWireIntegratedStudioAlgebraicProximalRootsExactModelV1.client.json",
      lockFile:
        "algebraic-proximal-roots-standard67-registry-admission-lock.json",
      artifactChunkName:
        "main-wire-integrated-algebraic-proximal-roots-standard67-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.algebraic-proximal-roots.standard-67",
      fixtureId:
        "main-wire-integrated-model-algebraic-proximal-roots-fixture-v1",
      proximalArterialRootsProfileId:
        "main-wire-algebraic-proximal-arterial-roots-profile-v1",
      numericalSessionId:
        "main-wire-integrated-model-standard67-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard67-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
    });
const entryRelativePath = integrationRelativeRoot
  + releaseConfigurationV1.entryFile;
const artifactRelativePath = integrationRelativeRoot
  + releaseConfigurationV1.artifactFile;
const clientDescriptorRelativePath = integrationRelativeRoot
  + releaseConfigurationV1.descriptorFile;
const lockRelativePath = integrationRelativeRoot
  + releaseConfigurationV1.lockFile;
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
  if (roundedEjectionRequested) {
    await assertRoundedEjectionBaselineQualificationV1();
  }
  const sourceRelease = releaseConfigurationV1.createRelease();
  assertStandard67ManifestV1(sourceRelease.manifest);
  const firstBuild = await buildArtifactV1();
  const secondBuild = await buildArtifactV1();
  if (!sameBytesV1(firstBuild, secondBuild)) {
    fail(`two clean ${releaseConfigurationV1.label} artifact builds emitted different bytes`);
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
      `Wrote ${releaseConfigurationV1.label} exact release (${artifactRevisionId})\n`,
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
    `${releaseConfigurationV1.label} registry admission verified: ${lock.modelId} (${artifactRevisionId})\n`,
  );
}

async function assertRoundedEjectionBaselineQualificationV1(): Promise<void> {
  const qualification =
    await qualifyMainWireIntegratedModelRoundedEjectionBaselineV1();
  const report =
    buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
      qualification,
    );
  if (
    studioCanonicalJsonStringify(report)
      !== studioCanonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1,
      )
    || studioCanonicalJsonStringify(qualification.checkpoint)
      !== studioCanonicalJsonStringify(
        MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1,
      )
  ) {
    fail(
      "fresh baseline qualification differs from the committed report or settled checkpoint",
    );
  }
  const requiredCheckIds = [
    "settlement.period1",
    "waveform.LVP.single-peak-no-ringing",
    "waveform.LVP.rounded-not-plateau",
    "waveform.RVP.single-peak-no-ringing",
    "waveform.RVP.rounded-not-plateau",
    "aortic-valve.mean-gradient",
    "aortic-valve.peak-gradient",
    "aortic-valve.ejection-time",
    "left-ventricle.maximum-dpdt",
    "left-ventricle.minimum-dpdt",
    "mitral-flow.peak-e-to-a",
    "timing.ict",
    "timing.irt",
    "timing.tei-index",
  ];
  const passedIds = new Set<string>(
    report.checks
      .filter(({ status }) => status === "passed")
      .map(({ checkId }) => checkId),
  );
  if (requiredCheckIds.some((checkId) => !passedIds.has(checkId))) {
    fail("baseline qualification omits a required physiological mint gate");
  }
}

function assertStandard67ManifestV1(
  manifest: ExactModelKernelManifestV3,
): void {
  if (
    manifest.modelId !== releaseConfigurationV1.modelId
    || manifest.equations.fixtureId !== releaseConfigurationV1.fixtureId
    || manifest.runtime.numericalSessionId
      !== releaseConfigurationV1.numericalSessionId
    || manifest.checkpointCodec.definition.checkpointId
      !== releaseConfigurationV1.checkpointId
  ) {
    fail(`source release does not bind the complete ${releaseConfigurationV1.label} identity`);
  }
  if (
    releaseConfigurationV1.proximalArterialRootsProfileId === null
      ? "proximalArterialRootsProfileId" in manifest.equations
      : manifest.equations.proximalArterialRootsProfileId
        !== releaseConfigurationV1.proximalArterialRootsProfileId
  ) {
    fail("source release binds the wrong proximal-root identity");
  }
  const structuralAnalysisCapabilities = [
    "analysis/main-wire-integrated-v3-guyton-starling-structural-orientation-v1",
    "analysis/main-wire-integrated-v3-formal-fixed-tbv-pressure-volume-relations-v1",
  ];
  if (
    roundedEjectionRequested
      ? structuralAnalysisCapabilities.some((capability) =>
          !manifest.capabilities.includes(capability))
      : structuralAnalysisCapabilities.some((capability) =>
          manifest.capabilities.includes(capability))
  ) {
    fail("structural-analysis capability declaration differs from the release contract");
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
        fileName: () => releaseConfigurationV1.artifactChunkName,
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
  const scenarioId = `scenario/${releaseConfigurationV1.idSlug}-registry`;
  const sourceSessionId = `session/${releaseConfigurationV1.idSlug}-registry`;
  const restoredSessionId =
    `session/${releaseConfigurationV1.idSlug}-registry-restored`;
  await produced.executables.simulationAdapter.createSession({
    runtimeSessionId: sourceSessionId,
    scenarios: [{
      scenarioId,
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }],
  });
  try {
    const initial = produced.executables.simulationAdapter.currentFrame({
      runtimeSessionId: sourceSessionId,
      scenarioId,
    });
    const expectedInitialRevision = roundedEjectionRequested
      ? MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1
        .checkpoint.revision
      : 0;
    const expectedInitialTimeSec = roundedEjectionRequested
      ? MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1
        .checkpoint.acceptedTimeSec
      : 0;
    if (
      initial.acceptedRevision !== expectedInitialRevision
      || initial.acceptedTimeSec !== expectedInitialTimeSec
    ) {
      fail("artifact did not start from its registered baseline clock");
    }
    const advanced =
      await produced.executables.simulationAdapter.advanceOnePresentationStep({
        runtimeSessionId: sourceSessionId,
        scenarioId,
      });
    if (
      advanced.modelId !== model.modelId
      || advanced.acceptedRevision !== expectedInitialRevision + 1
      || advanced.acceptedTimeSec !== expectedInitialTimeSec + 0.002
    ) {
      fail(`artifact did not advance its accepted ${releaseConfigurationV1.label} owner`);
    }
    const captured = await produced.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: `experiment/${releaseConfigurationV1.idSlug}-registry`,
        model,
        desiredContent: {
          modelId: model.modelId,
          surfaceSeriesId: `surface/${releaseConfigurationV1.idSlug}-registry`,
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
        !== releaseConfigurationV1.checkpointId
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
    displayName: releaseConfigurationV1.displayName,
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
      `an existing ${releaseConfigurationV1.label} identity cannot be rewritten without explicit same-model equivalence evidence`,
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
    fail(`the committed ${releaseConfigurationV1.label} exact identity changed against the base ref`);
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
    `${releaseConfigurationV1.label} registry verification failed: ${message}`,
  );
}
