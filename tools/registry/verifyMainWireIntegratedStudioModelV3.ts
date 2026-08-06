import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import {
  studioCanonicalJsonStringify,
} from "@/studio/infrastructure/json/StudioCanonicalJson";
import {
  InMemoryRegisteredModelStoreV2,
} from "@/studio/infrastructure/model/InMemoryRegisteredModelStoreV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3,
  createMainWireIntegratedStudioModelPackageV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const entryPath = path.join(
  repositoryRoot,
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.ts",
);
const lockRelativePath =
  "studio/integrations/mainWireIntegratedV3/registry-admission-lock.json";
const lockPath = path.join(repositoryRoot, lockRelativePath);
const artifactRelativePath =
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelV3.artifact.mjs";
const artifactPath = path.join(repositoryRoot, artifactRelativePath);

type RegistryAdmissionLock = Readonly<{
  schemaId: "circleheart-main-wire-integrated-v3-registry-admission-lock-v1";
  modelId: string;
  packageSha256: string;
}>;

await main();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const updateRequested = args.length === 1 && args[0] === "--write";
  if (args.length > 0 && !updateRequested) {
    fail("the only supported argument is --write");
  }
  const modelPackage = createMainWireIntegratedStudioModelPackageV3();
  const artifact = await buildExactArtifact();
  const deterministicRebuild = await buildExactArtifact();
  if (!sameBytes(artifact, deterministicRebuild)) {
    fail("two clean exact artifact builds emitted different bytes");
  }
  const canonicalManifest = studioCanonicalJsonStringify(
    modelPackage.manifest,
  );
  const packageSha256 = exactPackageSha256(canonicalManifest, artifact);

  await assertRegistryAdmission(modelPackage, artifact);

  if (updateRequested) {
    updateArtifactAndLock(
      modelPackage.manifest.modelId,
      packageSha256,
      artifact,
    );
    console.log(
      `Wrote exact V3 registry artifact and lock: `
        + `${modelPackage.manifest.modelId} (${packageSha256})`,
    );
    return;
  }

  const committedArtifact = readFileSync(artifactPath);
  if (!sameBytes(committedArtifact, artifact)) {
    fail(
      `${artifactRelativePath} differs from the deterministic exact build; `
        + "assign a new modelId and regenerate the artifact and lock",
    );
  }
  assertUtf8RoundTrip(committedArtifact);
  const currentLock = parseLock(
    readFileSync(lockPath, "utf8"),
    "current lock",
  );
  if (currentLock.modelId !== modelPackage.manifest.modelId) {
    fail(
      `lock modelId ${currentLock.modelId} differs from manifest modelId `
        + modelPackage.manifest.modelId,
    );
  }
  if (currentLock.packageSha256 !== packageSha256) {
    fail(
      `exact package digest changed for ${modelPackage.manifest.modelId}; `
        + `computed ${packageSha256}. Assign a new modelId and replace the `
        + "registry admission artifact and lock in the same change",
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
    `Exact V3 registry admission verified: ${currentLock.modelId} `
      + `(${packageSha256})`,
  );
}

async function buildExactArtifact(): Promise<Uint8Array> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    // The admitted artifact is the dedicated live numerical Worker build.
    // Pin its existing identity-stamped lean tier at compile time so browser
    // execution cannot silently fall back to the source/test default. The
    // tier changes defensive recomputation only; full-vs-lean lockstep tests
    // prove identical accepted frames and checkpoints.
    define: {
      "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY":
        JSON.stringify(
          MAIN_WIRE_INTEGRATED_STUDIO_HOT_PATH_INTEGRITY_TIER_V3,
        ),
    },
    resolve: {
      alias: { "@": repositoryRoot },
    },
    build: {
      target: "es2022",
      minify: false,
      sourcemap: false,
      write: false,
      lib: {
        entry: entryPath,
        formats: ["es"],
        fileName: () => "main-wire-integrated-studio-model-v3.mjs",
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });
  const rollupOutputs = Array.isArray(result) ? result : [result];
  if (
    rollupOutputs.length !== 1
    || rollupOutputs[0] === undefined
    || !("output" in rollupOutputs[0])
  ) {
    fail("exact model build unexpectedly entered watch mode");
  }
  const chunks = rollupOutputs[0].output.filter(
    (item) => item.type === "chunk",
  );
  if (chunks.length !== 1 || chunks[0] === undefined) {
    fail(`exact model build emitted ${chunks.length} JavaScript chunks`);
  }
  if (
    chunks[0].imports.length !== 0
    || chunks[0].dynamicImports.length !== 0
  ) {
    fail("exact model build must be one self-contained ESM artifact");
  }
  return new TextEncoder().encode(chunks[0].code);
}

async function assertRegistryAdmission(
  modelPackage: ReturnType<
    typeof createMainWireIntegratedStudioModelPackageV3
  >,
  artifact: Uint8Array,
): Promise<void> {
  const registry = new InMemoryRegisteredModelStoreV2();
  const admitted = await registry.registerExactPackage(
    modelPackage.createRegistryAdmission(artifact),
  );
  if (admitted.modelId !== modelPackage.manifest.modelId) {
    fail("registry admitted a model other than the exact artifact modelId");
  }
  if (
    registry.resolveExactRuntime(admitted.modelId).contract.modelId
      !== admitted.modelId
  ) {
    fail("registry runtime differs from the exact admitted model");
  }
}

function updateArtifactAndLock(
  modelId: string,
  packageSha256: string,
  artifact: Uint8Array,
): void {
  if (existsSync(lockPath)) {
    const priorLock = parseLock(readFileSync(lockPath, "utf8"), "current lock");
    if (
      priorLock.modelId === modelId
      && priorLock.packageSha256 !== packageSha256
    ) {
      fail(
        `refusing to replace changed artifact bytes under immutable modelId ${modelId}`,
      );
    }
  }
  writeFileSync(artifactPath, artifact);
  writeFileSync(lockPath, `${JSON.stringify({
    schemaId: "circleheart-main-wire-integrated-v3-registry-admission-lock-v1",
    modelId,
    packageSha256,
  }, null, 2)}\n`, "utf8");
}

function assertUtf8RoundTrip(artifact: Uint8Array): void {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(artifact);
  } catch {
    fail("exact executable artifact must be valid UTF-8 ESM source");
  }
  if (!sameBytes(new TextEncoder().encode(source), artifact)) {
    fail("exact executable artifact does not round-trip as UTF-8 bytes");
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((value, index) => value === right[index]);
}

function exactPackageSha256(
  canonicalManifestValue: string,
  executableArtifact: Uint8Array,
): string {
  const manifestBytes = new TextEncoder().encode(canonicalManifestValue);
  const framed = new Uint8Array(
    8 + manifestBytes.byteLength + executableArtifact.byteLength,
  );
  const lengths = new DataView(framed.buffer, framed.byteOffset, 8);
  lengths.setUint32(0, manifestBytes.byteLength, false);
  lengths.setUint32(4, executableArtifact.byteLength, false);
  framed.set(manifestBytes, 8);
  framed.set(executableArtifact, 8 + manifestBytes.byteLength);
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
  const keys = Object.keys(record).sort();
  const expected = ["modelId", "packageSha256", "schemaId"];
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
  ) {
    fail(`${label} must contain exactly ${expected.join(", ")}`);
  }
  if (
    record.schemaId
      !== "circleheart-main-wire-integrated-v3-registry-admission-lock-v1"
    || typeof record.modelId !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/.test(record.modelId)
    || typeof record.packageSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.packageSha256)
  ) {
    fail(`${label} contains an invalid identity or digest`);
  }
  return Object.freeze({
    schemaId: record.schemaId,
    modelId: record.modelId,
    packageSha256: record.packageSha256,
  }) as RegistryAdmissionLock;
}

function readPriorLock(baseRef: string): RegistryAdmissionLock | null {
  try {
    execFileSync(
      "git",
      ["cat-file", "-e", `${baseRef}:${lockRelativePath}`],
      { cwd: repositoryRoot, stdio: "ignore" },
    );
  } catch {
    return null;
  }
  const text = execFileSync(
    "git",
    ["show", `${baseRef}:${lockRelativePath}`],
    { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  return parseLock(text, `registry lock at ${baseRef}`);
}

function fail(message: string): never {
  throw new Error(`Main Wire Integrated V3 registry verification failed: ${message}`);
}
