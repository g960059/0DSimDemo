import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";
import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  importExactExecutableArtifactModuleV2,
} from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import mainWireIntegratedStandardSurfaceV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-standard-v1.json";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const entryPath = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.entry.ts",
);
const lockRelativePath =
  "studio/integrations/mainWireIntegratedV3/"
    + "standard-registry-admission-lock.json";
const lockPath = path.join(repositoryRoot, lockRelativePath);
const artifactRelativePath =
  "studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.artifact.mjs";
const artifactPath = path.join(repositoryRoot, artifactRelativePath);
const clientDescriptorRelativePath =
  "studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.client.json";
const clientDescriptorPath = path.join(repositoryRoot, clientDescriptorRelativePath);

type RegistryAdmissionLock = Readonly<{
  schemaId: "circleheart-standard-exact-model-registry-admission-lock-v1";
  modelId: string;
  packageSha256: string;
}>;

type StandardClientDescriptorV1 = Readonly<{
  schemaId: "circleheart-standard-exact-model-client-descriptor-v1";
  manifest: ReturnType<typeof createCircleHeartExactModelReleaseV1>["manifest"];
  defaultFixture: typeof MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1;
}>;

await main();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const updateRequested = args.length === 1 && args[0] === "--write";
  if (args.length > 0 && !updateRequested) {
    fail("the only supported argument is --write");
  }
  const sourceRelease = createCircleHeartExactModelReleaseV1();
  const artifact = await buildExactArtifact();
  const deterministicRebuild = await buildExactArtifact();
  if (!sameBytes(artifact, deterministicRebuild)) {
    fail("two clean Standard artifact builds emitted different bytes");
  }
  const canonicalManifest = studioCanonicalJsonStringify(
    sourceRelease.manifest,
  );
  const packageSha256 = exactPackageSha256(canonicalManifest, artifact);
  await assertArtifactAdmission(artifact, canonicalManifest);

  if (updateRequested) {
    updateArtifactAndLock(
      sourceRelease.manifest.modelId,
      packageSha256,
      artifact,
      Object.freeze({
        schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
        manifest: sourceRelease.manifest,
        defaultFixture:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      }),
    );
    console.log(
      `Wrote Standard exact artifact and lock: `
        + `${sourceRelease.manifest.modelId} (${packageSha256})`,
    );
    return;
  }

  if (
    !existsSync(artifactPath)
    || !existsSync(lockPath)
    || !existsSync(clientDescriptorPath)
  ) {
    fail(
      "committed Standard artifact, lock, or client descriptor is missing; "
        + "run with --write",
    );
  }
  const committedArtifact = readFileSync(artifactPath);
  if (!sameBytes(committedArtifact, artifact)) {
    fail(
      `${artifactRelativePath} differs from the deterministic exact build; `
        + "assign a new modelId and regenerate artifact and lock",
    );
  }
  assertUtf8RoundTrip(committedArtifact);
  const currentLock = parseLock(
    readFileSync(lockPath, "utf8"),
    "current Standard lock",
  );
  if (currentLock.modelId !== sourceRelease.manifest.modelId) {
    fail("Standard lock modelId differs from the kernel manifest");
  }
  if (currentLock.packageSha256 !== packageSha256) {
    fail(
      `exact package digest changed for ${currentLock.modelId}; assign a new `
        + "modelId and replace artifact and lock together",
    );
  }
  const currentClientDescriptor = parseClientDescriptor(
    readFileSync(clientDescriptorPath, "utf8"),
    "current Standard client descriptor",
  );
  const expectedClientDescriptor: StandardClientDescriptorV1 = Object.freeze({
    schemaId: "circleheart-standard-exact-model-client-descriptor-v1",
    manifest: sourceRelease.manifest,
    defaultFixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  });
  if (
    studioCanonicalJsonStringify(currentClientDescriptor)
    !== studioCanonicalJsonStringify(expectedClientDescriptor)
  ) {
    fail(
      `${clientDescriptorRelativePath} differs from the admitted Standard `
        + "kernel and fixture; run with --write",
    );
  }

  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  if (baseRef !== undefined && baseRef !== "" && !/^0+$/.test(baseRef)) {
    const priorLock = readPriorLock(baseRef);
    if (
      priorLock !== null
      && priorLock.packageSha256 !== currentLock.packageSha256
      && priorLock.modelId === currentLock.modelId
    ) {
      fail(
        `exact package digest changed relative to ${baseRef} while modelId `
          + `${currentLock.modelId} stayed unchanged`,
      );
    }
  }
  console.log(
    `Standard exact registry admission verified: ${currentLock.modelId} `
      + `(${packageSha256})`,
  );
}

async function buildExactArtifact(): Promise<Uint8Array> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY":
        JSON.stringify(
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_HOT_PATH_INTEGRITY_TIER_V1,
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
        fileName: () => "main-wire-integrated-standard-v1.mjs",
      },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  if (
    outputs.length !== 1
    || outputs[0] === undefined
    || !("output" in outputs[0])
  ) {
    fail("Standard exact build unexpectedly entered watch mode");
  }
  const chunks = outputs[0].output.filter((item) => item.type === "chunk");
  if (chunks.length !== 1 || chunks[0] === undefined) {
    fail(`Standard exact build emitted ${chunks.length} JavaScript chunks`);
  }
  if (
    chunks[0].imports.length !== 0
    || chunks[0].dynamicImports.length !== 0
  ) {
    fail("Standard exact build must be one self-contained ESM artifact");
  }
  return new TextEncoder().encode(chunks[0].code);
}

async function assertArtifactAdmission(
  artifact: Uint8Array,
  canonicalManifest: string,
): Promise<void> {
  const namespace = await importExactExecutableArtifactModuleV2(artifact);
  const factory = namespace.createCircleHeartExactModelReleaseV1;
  if (typeof factory !== "function") {
    fail("artifact does not export createCircleHeartExactModelReleaseV1");
  }
  const value: unknown = await factory();
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("artifact factory returned a non-object release");
  }
  const release = value as Record<string, unknown>;
  if (
    studioCanonicalJsonStringify(release.manifest) !== canonicalManifest
  ) {
    fail("artifact kernel manifest differs from the source release");
  }
  const sourceRelease = createCircleHeartExactModelReleaseV1();
  const composed = composeStandardModelContractV1(
    sourceRelease.manifest,
    mainWireIntegratedStandardSurfaceV1,
  );
  const executables = release.executables as
    ReturnType<typeof createCircleHeartExactModelReleaseV1>["executables"];
  validateExecutableBundleV2(executables, composed.contract);
  executables.fixtureAdapter.validateCompleteFixture({
    context: {
      scenarioId: "scenario/standard-registry-verification",
      modelId: composed.contract.modelId,
    },
    fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  });
  const runtimeSessionId = "session/standard-registry-verification";
  const scenarioId = "scenario/standard-registry-verification";
  await executables.simulationAdapter.createSession({
    runtimeSessionId,
    scenarios: [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }],
  });
  const frame = await executables.simulationAdapter
    .advanceOnePresentationStep({ runtimeSessionId, scenarioId });
  if (
    frame.modelId !== composed.contract.modelId
    || frame.acceptedTimeSec !== 0.002
  ) {
    fail("artifact runtime failed its accepted-frame smoke check");
  }
  const warmed = await executables.simulationAdapter.applyControl({
    runtimeSessionId,
    scenarioId,
    controlId:
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1
        .ventricularContractilityScale,
    value: 1.2,
    expectedInputEpoch: 0,
  });
  if (
    warmed.inputEpoch !== 1
    || warmed.acceptedRevision !== frame.acceptedRevision
    || warmed.acceptedTimeSec !== frame.acceptedTimeSec
  ) {
    fail("artifact runtime failed its contractility warm-start smoke check");
  }
  const continued = await executables.simulationAdapter
    .advanceOnePresentationStep({ runtimeSessionId, scenarioId });
  if (
    continued.inputEpoch !== 1
    || continued.acceptedTimeSec <= warmed.acceptedTimeSec
  ) {
    fail("artifact runtime did not advance after contractility warm start");
  }
  executables.simulationAdapter.disposeSession(runtimeSessionId);
}

function updateArtifactAndLock(
  modelId: string,
  packageSha256: string,
  artifact: Uint8Array,
  clientDescriptor: StandardClientDescriptorV1,
): void {
  if (existsSync(lockPath)) {
    const prior = parseLock(readFileSync(lockPath, "utf8"), "current lock");
    if (
      prior.modelId === modelId
      && prior.packageSha256 !== packageSha256
      && standardAdmissionFilesAreTracked()
    ) {
      fail(`refusing to replace changed bytes under immutable modelId ${modelId}`);
    }
  }
  writeFileSync(artifactPath, artifact);
  writeFileSync(lockPath, `${JSON.stringify({
    schemaId: "circleheart-standard-exact-model-registry-admission-lock-v1",
    modelId,
    packageSha256,
  }, null, 2)}\n`, "utf8");
  writeFileSync(
    clientDescriptorPath,
    `${JSON.stringify(clientDescriptor, null, 2)}\n`,
    "utf8",
  );
}

function standardAdmissionFilesAreTracked(): boolean {
  return [
    artifactRelativePath,
    lockRelativePath,
    clientDescriptorRelativePath,
  ].some((relativePath) => {
    try {
      execFileSync(
        "git",
        ["ls-files", "--error-unmatch", "--", relativePath],
        { cwd: repositoryRoot, stdio: "ignore" },
      );
      return true;
    } catch {
      return false;
    }
  });
}

function parseClientDescriptor(
  text: string,
  label: string,
): StandardClientDescriptorV1 {
  const parsed: unknown = JSON.parse(text);
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || Object.getPrototypeOf(parsed) !== Object.prototype
  ) {
    fail(`${label} must be a JSON object`);
  }
  const record = parsed as Record<string, unknown>;
  const expected = ["defaultFixture", "manifest", "schemaId"];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId
      !== "circleheart-standard-exact-model-client-descriptor-v1"
  ) {
    fail(`${label} is invalid`);
  }
  return parsed as StandardClientDescriptorV1;
}

function assertUtf8RoundTrip(artifact: Uint8Array): void {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(artifact);
  } catch {
    fail("Standard executable artifact must be valid UTF-8");
  }
  if (!sameBytes(new TextEncoder().encode(source), artifact)) {
    fail("Standard executable artifact does not round-trip as UTF-8");
  }
}

function exactPackageSha256(
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
  return createHash("sha256").update(framed).digest("hex");
}

function parseLock(text: string, label: string): RegistryAdmissionLock {
  const parsed: unknown = JSON.parse(text);
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || Object.getPrototypeOf(parsed) !== Object.prototype
  ) {
    fail(`${label} must be a JSON object`);
  }
  const record = parsed as Record<string, unknown>;
  const expected = ["modelId", "packageSha256", "schemaId"];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId
      !== "circleheart-standard-exact-model-registry-admission-lock-v1"
    || typeof record.modelId !== "string"
    || typeof record.packageSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.packageSha256)
  ) {
    fail(`${label} is invalid`);
  }
  return Object.freeze({
    schemaId: record.schemaId,
    modelId: record.modelId,
    packageSha256: record.packageSha256,
  }) as RegistryAdmissionLock;
}

function readPriorLock(baseRef: string): RegistryAdmissionLock | null {
  try {
    execFileSync("git", ["cat-file", "-e", `${baseRef}:${lockRelativePath}`], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
  } catch {
    return null;
  }
  return parseLock(execFileSync(
    "git",
    ["show", `${baseRef}:${lockRelativePath}`],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  ), `registry lock at ${baseRef}`);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((value, index) => value === right[index]);
}

function fail(message: string): never {
  throw new Error(
    `Main Wire Standard registry verification failed: ${message}`,
  );
}
