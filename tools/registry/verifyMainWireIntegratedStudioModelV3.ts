import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  resolveStudioAnalysisMethodsForSurfaceV1,
} from "@/studio/analysis/StudioAnalysisMethodRegistryV1";
import {
  STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
} from "@/studio/contracts/v2/simulation";
import {
  EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
  EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  assertBoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  compileExecutionPlanV1,
} from "@/engine/executionPlan/ExecutionPlanCompilerV1";
import {
  createMainWireModelDefinitionV1,
  createMainWireNumericalPolicyV1,
} from "@/engine/executionPlan/MainWireModelDefinitionV1";
import {
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
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
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-analysis-v1.json";
import generatedExecutionPlanV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedExecutionPlanV1.generated.json";
import {
  compareExactModelArtifactRevisionsV1,
  exactModelArtifactEquivalenceReportSha256V1,
  type ExactModelArtifactEquivalenceReportV1,
} from "./compareExactModelArtifactRevisionsV1";

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
const equivalenceReportRelativePath =
  "studio/integrations/mainWireIntegratedV3/"
    + "standard-artifact-equivalence-report.json";
const equivalenceReportPath = path.join(
  repositoryRoot,
  equivalenceReportRelativePath,
);

type RegistryAdmissionLock = Readonly<{
  schemaId: "circleheart-standard-exact-model-registry-admission-lock-v2";
  modelId: string;
  artifactRevisionId: string;
  artifactSha256: string;
  predecessorArtifactRevisionId: string | null;
  equivalenceReportSha256: string | null;
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
  for (const requiredCapability of [
    STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
    EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
    EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  ]) {
    if (!sourceRelease.manifest.capabilities.includes(requiredCapability)) {
      fail(`source release omits required capability ${requiredCapability}`);
    }
  }
  const compiledExecutionPlan = compileExecutionPlanV1(
    createMainWireModelDefinitionV1(),
    createMainWireNumericalPolicyV1(),
  );
  if (
    studioCanonicalJsonStringify(compiledExecutionPlan)
      !== studioCanonicalJsonStringify(generatedExecutionPlanV1)
  ) {
    fail(
      "checked-in execution plan differs from the build-time compiler; "
        + "run npm run compile:model:execution-plan -- --write",
    );
  }
  const artifact = await buildExactArtifact();
  const deterministicRebuild = await buildExactArtifact();
  if (!sameBytes(artifact, deterministicRebuild)) {
    fail("two clean Standard artifact builds emitted different bytes");
  }
  const canonicalManifest = studioCanonicalJsonStringify(
    sourceRelease.manifest,
  );
  const artifactRevisionId = exactPackageSha256(canonicalManifest, artifact);
  const artifactSha256 = sha256V1(artifact);
  await assertArtifactAdmission(artifact, canonicalManifest);

  if (updateRequested) {
    await updateArtifactAndLock(
      sourceRelease.manifest.modelId,
      artifactRevisionId,
      artifactSha256,
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
        + `${sourceRelease.manifest.modelId} (${artifactRevisionId})`,
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
        + "run with --write to certify an implementation revision",
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
  if (
    currentLock.artifactRevisionId !== artifactRevisionId
    || currentLock.artifactSha256 !== artifactSha256
  ) {
    fail("Standard lock does not identify the deterministic artifact bytes");
  }
  const currentEquivalenceReport = readCurrentEquivalenceReportV1(currentLock);
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
    await assertBaseRevisionTransitionV1(
      baseRef,
      priorLock,
      currentLock,
      currentClientDescriptor,
      currentEquivalenceReport,
      new Uint8Array(committedArtifact),
    );
  }
  console.log(
    `Standard exact registry admission verified: ${currentLock.modelId} `
      + `(${artifactRevisionId})`,
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
  const analysisMethods = resolveStudioAnalysisMethodsForSurfaceV1(
    mainWireIntegratedStandardSurfaceV1,
  );
  const composed = composeStandardModelContractV1(
    sourceRelease.manifest,
    mainWireIntegratedStandardSurfaceV1,
    analysisMethods.capabilities,
  );
  const executables = release.executables as
    ReturnType<typeof createCircleHeartExactModelReleaseV1>["executables"];
  validateExecutableBundleV2(executables, composed.exactContract);
  executables.fixtureAdapter.validateCompleteFixture({
    context: {
      scenarioId: "scenario/standard-registry-verification",
      modelId: composed.exactContract.modelId,
    },
    fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  });
  const runtimeSessionId = "session/standard-registry-verification";
  const scenarioId = "scenario/standard-registry-verification";
  const executionPlan = executables.executionPlan;
  const boundExecutionPlan = executionPlan.bind();
  assertBoundExecutionPlanV1(boundExecutionPlan, executionPlan.descriptor);
  await executionPlan.createSession({
    runtimeSessionId,
    scenarios: [{
      scenarioId,
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
    }],
    boundExecutionPlans: new Map([[scenarioId, boundExecutionPlan]]),
  });
  const frame = await executables.simulationAdapter
    .advanceOnePresentationStep({ runtimeSessionId, scenarioId });
  if (
    frame.modelId !== composed.exactContract.modelId
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

async function updateArtifactAndLock(
  modelId: string,
  artifactRevisionId: string,
  artifactSha256: string,
  artifact: Uint8Array,
  clientDescriptor: StandardClientDescriptorV1,
): Promise<void> {
  const prior = existsSync(lockPath)
    ? parseLock(readFileSync(lockPath, "utf8"), "current lock")
    : null;
  let predecessorArtifactRevisionId: string | null = null;
  let equivalenceReportSha256: string | null = null;
  if (
    prior !== null
    && prior.modelId === modelId
    && prior.artifactRevisionId !== artifactRevisionId
  ) {
    if (!existsSync(artifactPath) || !existsSync(clientDescriptorPath)) {
      fail("the predecessor artifact or client descriptor is missing");
    }
    const predecessorArtifact = new Uint8Array(readFileSync(artifactPath));
    const predecessorClient = parseClientDescriptor(
      readFileSync(clientDescriptorPath, "utf8"),
      "predecessor Standard client descriptor",
    );
    const predecessorManifest = studioCanonicalJsonStringify(
      predecessorClient.manifest,
    );
    if (
      predecessorClient.manifest.modelId !== prior.modelId
      || sha256V1(predecessorArtifact) !== prior.artifactSha256
      || exactPackageSha256(predecessorManifest, predecessorArtifact)
        !== prior.artifactRevisionId
    ) {
      fail(
        "the checked predecessor artifact, client manifest, and lock disagree",
      );
    }
    const report = await compareExactModelArtifactRevisionsV1({
      predecessorArtifact,
      predecessorArtifactRevisionId: prior.artifactRevisionId,
      candidateArtifact: artifact,
      candidateArtifactRevisionId: artifactRevisionId,
    });
    predecessorArtifactRevisionId = prior.artifactRevisionId;
    equivalenceReportSha256 =
      exactModelArtifactEquivalenceReportSha256V1(report);
    writeFileSync(
      equivalenceReportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
  } else if (
    prior !== null
    && prior.modelId === modelId
    && prior.artifactRevisionId === artifactRevisionId
  ) {
    predecessorArtifactRevisionId = prior.predecessorArtifactRevisionId;
    equivalenceReportSha256 = prior.equivalenceReportSha256;
  } else if (existsSync(equivalenceReportPath)) {
    rmSync(equivalenceReportPath);
  }
  writeFileSync(artifactPath, artifact);
  writeFileSync(lockPath, `${JSON.stringify({
    schemaId: "circleheart-standard-exact-model-registry-admission-lock-v2",
    modelId,
    artifactRevisionId,
    artifactSha256,
    predecessorArtifactRevisionId,
    equivalenceReportSha256,
  }, null, 2)}\n`, "utf8");
  writeFileSync(
    clientDescriptorPath,
    `${JSON.stringify(clientDescriptor, null, 2)}\n`,
    "utf8",
  );
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

function sha256V1(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
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
  const expected = [
    "artifactRevisionId",
    "artifactSha256",
    "equivalenceReportSha256",
    "modelId",
    "predecessorArtifactRevisionId",
    "schemaId",
  ];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId
      !== "circleheart-standard-exact-model-registry-admission-lock-v2"
    || typeof record.modelId !== "string"
    || typeof record.artifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.artifactRevisionId)
    || typeof record.artifactSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.artifactSha256)
    || (
      record.predecessorArtifactRevisionId !== null
      && (
        typeof record.predecessorArtifactRevisionId !== "string"
        || !/^[0-9a-f]{64}$/.test(record.predecessorArtifactRevisionId)
      )
    )
    || (
      record.equivalenceReportSha256 !== null
      && (
        typeof record.equivalenceReportSha256 !== "string"
        || !/^[0-9a-f]{64}$/.test(record.equivalenceReportSha256)
      )
    )
    || (
      (record.predecessorArtifactRevisionId === null)
      !== (record.equivalenceReportSha256 === null)
    )
  ) {
    fail(`${label} is invalid`);
  }
  return Object.freeze({
    schemaId: record.schemaId,
    modelId: record.modelId,
    artifactRevisionId: record.artifactRevisionId,
    artifactSha256: record.artifactSha256,
    predecessorArtifactRevisionId: record.predecessorArtifactRevisionId,
    equivalenceReportSha256: record.equivalenceReportSha256,
  }) as RegistryAdmissionLock;
}

type PriorRegistryAdmissionLockV1 = Readonly<{
  schemaId:
    | "circleheart-standard-exact-model-registry-admission-lock-v1"
    | "circleheart-standard-exact-model-registry-admission-lock-v2";
  modelId: string;
  artifactRevisionId: string;
  predecessorArtifactRevisionId: string | null;
  equivalenceReportSha256: string | null;
}>;

function readPriorLock(baseRef: string): PriorRegistryAdmissionLockV1 | null {
  try {
    execFileSync("git", ["cat-file", "-e", `${baseRef}:${lockRelativePath}`], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
  } catch {
    return null;
  }
  const raw = execFileSync(
    "git",
    ["show", `${baseRef}:${lockRelativePath}`],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  );
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed.schemaId
      === "circleheart-standard-exact-model-registry-admission-lock-v2"
  ) {
    return parseLock(raw, `registry lock at ${baseRef}`);
  }
  const revision = parsed.schemaId
      === "circleheart-standard-exact-model-registry-admission-lock-v1"
    ? parsed.packageSha256
    : null;
  if (
    typeof parsed.modelId !== "string"
    || typeof revision !== "string"
    || !/^[0-9a-f]{64}$/.test(revision)
  ) {
    fail(`registry lock at ${baseRef} is invalid`);
  }
  return Object.freeze({
    schemaId: "circleheart-standard-exact-model-registry-admission-lock-v1",
    modelId: parsed.modelId,
    artifactRevisionId: revision,
    predecessorArtifactRevisionId: null,
    equivalenceReportSha256: null,
  });
}

function readCurrentEquivalenceReportV1(
  lock: RegistryAdmissionLock,
): ExactModelArtifactEquivalenceReportV1 | null {
  if (lock.equivalenceReportSha256 === null) {
    if (existsSync(equivalenceReportPath)) {
      fail("an unbound artifact equivalence report remains in the worktree");
    }
    return null;
  }
  if (!existsSync(equivalenceReportPath)) {
    fail("the lock requires a missing artifact equivalence report");
  }
  const report = parseEquivalenceReportV1(
    readFileSync(equivalenceReportPath, "utf8"),
  );
  if (
    report.modelId !== lock.modelId
    || report.predecessorArtifactRevisionId
      !== lock.predecessorArtifactRevisionId
    || report.candidateArtifactRevisionId !== lock.artifactRevisionId
    || exactModelArtifactEquivalenceReportSha256V1(report)
      !== lock.equivalenceReportSha256
  ) {
    fail("artifact equivalence report does not match the registry lock");
  }
  return report;
}

async function assertBaseRevisionTransitionV1(
  baseRef: string,
  priorLock: PriorRegistryAdmissionLockV1 | null,
  currentLock: RegistryAdmissionLock,
  currentClientDescriptor: StandardClientDescriptorV1,
  currentReport: ExactModelArtifactEquivalenceReportV1 | null,
  currentArtifact: Uint8Array,
): Promise<void> {
  if (priorLock === null) return;
  if (priorLock.modelId !== currentLock.modelId) {
    if (
      currentLock.predecessorArtifactRevisionId !== null
      || currentLock.equivalenceReportSha256 !== null
    ) {
      fail("a new scientific modelId cannot inherit an artifact revision");
    }
    return;
  }
  const priorClientBytes = readPriorBytesV1(
    baseRef,
    clientDescriptorRelativePath,
  );
  if (priorClientBytes !== null) {
    const priorClient = parseClientDescriptor(
      new TextDecoder().decode(priorClientBytes),
      `client descriptor at ${baseRef}`,
    );
    if (
      studioCanonicalJsonStringify(priorClient.manifest)
        !== studioCanonicalJsonStringify(currentClientDescriptor.manifest)
    ) {
      fail("the exact numerical manifest changed under the same modelId");
    }
  }
  if (priorLock.artifactRevisionId === currentLock.artifactRevisionId) {
    if (
      currentLock.predecessorArtifactRevisionId
        !== priorLock.predecessorArtifactRevisionId
      || currentLock.equivalenceReportSha256
        !== priorLock.equivalenceReportSha256
    ) {
      fail("an unchanged artifact revision cannot rewrite its lineage evidence");
    }
    return;
  }
  if (
    currentLock.predecessorArtifactRevisionId
      !== priorLock.artifactRevisionId
    || currentReport === null
  ) {
    fail(
      "a same-model artifact change requires predecessor-bound byte-exact evidence",
    );
  }
  const priorArtifact = readPriorBytesV1(baseRef, artifactRelativePath);
  if (priorArtifact === null) {
    fail(`the predecessor artifact is missing at ${baseRef}`);
  }
  const reproduced = await compareExactModelArtifactRevisionsV1({
    predecessorArtifact: priorArtifact,
    predecessorArtifactRevisionId: priorLock.artifactRevisionId,
    candidateArtifact: currentArtifact,
    candidateArtifactRevisionId: currentLock.artifactRevisionId,
  });
  if (
    studioCanonicalJsonStringify(reproduced)
      !== studioCanonicalJsonStringify(currentReport)
  ) {
    fail("artifact equivalence report is not reproducible from base and head");
  }
}

function parseEquivalenceReportV1(
  raw: string,
): ExactModelArtifactEquivalenceReportV1 {
  const parsed: unknown = JSON.parse(raw);
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
  ) {
    fail("artifact equivalence report must be an object");
  }
  const record = parsed as Record<string, unknown>;
  const expected = [
    "candidateArtifactRevisionId",
    "cases",
    "corpusId",
    "equality",
    "modelId",
    "predecessorArtifactRevisionId",
    "schemaId",
  ];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId
      !== "circleheart-exact-model-artifact-equivalence-report-v1"
    || typeof record.modelId !== "string"
    || typeof record.predecessorArtifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.predecessorArtifactRevisionId)
    || typeof record.candidateArtifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.candidateArtifactRevisionId)
    || record.corpusId !== "main-wire-solver-replacement-corpus-v1"
    || record.equality !== "byte-exact"
    || !Array.isArray(record.cases)
    || record.cases.length === 0
  ) {
    fail("artifact equivalence report is invalid");
  }
  for (const [index, value] of record.cases.entries()) {
    if (
      value === null
      || typeof value !== "object"
      || Array.isArray(value)
    ) {
      fail(`artifact equivalence report case ${index} is invalid`);
    }
    const artifactCase = value as Record<string, unknown>;
    const caseKeys = Object.keys(artifactCase).sort();
    const expectedCaseKeys = [
      "acceptedStepCount",
      "advancedFrameEquality",
      "caseId",
      "exactCaptureEquality",
      "initialFrameEquality",
    ];
    if (
      caseKeys.length !== expectedCaseKeys.length
      || caseKeys.some((key, keyIndex) => key !== expectedCaseKeys[keyIndex])
      || typeof artifactCase.caseId !== "string"
      || !Number.isSafeInteger(artifactCase.acceptedStepCount)
      || (artifactCase.acceptedStepCount as number) <= 0
      || artifactCase.initialFrameEquality !== "byte-exact"
      || artifactCase.advancedFrameEquality !== "byte-exact"
      || artifactCase.exactCaptureEquality !== "byte-exact"
    ) {
      fail(`artifact equivalence report case ${index} is invalid`);
    }
  }
  return parsed as ExactModelArtifactEquivalenceReportV1;
}

function readPriorBytesV1(
  baseRef: string,
  relativePath: string,
): Uint8Array | null {
  try {
    execFileSync("git", ["cat-file", "-e", `${baseRef}:${relativePath}`], {
      cwd: repositoryRoot,
      stdio: "ignore",
    });
  } catch {
    return null;
  }
  return new Uint8Array(execFileSync(
    "git",
    ["show", `${baseRef}:${relativePath}`],
    {
      cwd: repositoryRoot,
      encoding: "buffer",
      maxBuffer: 10_000_000,
      stdio: ["ignore", "pipe", "inherit"],
    },
  ));
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
