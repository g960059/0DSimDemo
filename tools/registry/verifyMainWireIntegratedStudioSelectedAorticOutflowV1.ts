import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";

import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
import {
  EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
  assertBoundExecutionPlanV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import {
  studioCanonicalJsonStringify,
} from "@/domain/json/CanonicalJson";
import {
  STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import {
  assertModelContractV2,
  type ModelContractV2,
} from "@/studio/contracts/v2/model";
import {
  STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
  type StudioSimulationFrameV2,
} from "@/studio/contracts/v2/simulation";
import {
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import {
  importExactExecutableArtifactModuleV2,
} from "@/studio/infrastructure/model/ExactExecutableArtifactModuleLoaderV2";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_HOT_PATH_INTEGRITY_TIER_V1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  SELECTED_AORTIC_OUTFLOW_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID,
  compareSelectedAorticOutflowArtifactRevisionsV1,
  selectedAorticOutflowArtifactEquivalenceReportSha256V1,
  type SelectedAorticOutflowArtifactEquivalenceReportV1,
} from "./compareMainWireIntegratedStudioSelectedAorticOutflowArtifactRevisionsV1";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const integrationRelativeRoot =
  "studio/integrations/mainWireIntegratedV3/";
const entryPath = path.join(
  repositoryRoot,
  integrationRelativeRoot
    + "MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.entry.ts",
);
const artifactRelativePath = integrationRelativeRoot
  + "MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.artifact.mjs";
const artifactPath = path.join(repositoryRoot, artifactRelativePath);
const clientDescriptorRelativePath = integrationRelativeRoot
  + "MainWireIntegratedStudioSelectedAorticOutflowExactModelV1.client.json";
const clientDescriptorPath = path.join(
  repositoryRoot,
  clientDescriptorRelativePath,
);
const lockRelativePath = integrationRelativeRoot
  + "selected-aortic-outflow-standard66-registry-admission-lock.json";
const lockPath = path.join(repositoryRoot, lockRelativePath);
const equivalenceReportRelativePath = integrationRelativeRoot
  + "selected-aortic-outflow-standard66-artifact-equivalence-report.json";
const equivalenceReportPath = path.join(
  repositoryRoot,
  equivalenceReportRelativePath,
);

const CLIENT_DESCRIPTOR_SCHEMA_ID_V1 =
  "circleheart-standard-exact-model-client-descriptor-v1" as const;
const REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2 =
  "circleheart-standard-exact-model-registry-admission-lock-v2" as const;
const PROXIMAL_CONSTITUTIVE_PORT_PRESSURE_OUTPUT_ID_V1 =
  "hemodynamics.pressure.absolute.aortic-proximal-constitutive-port" as const;
const FORBIDDEN_STANDARD65_ARTIFACT_MARKERS_V1 = Object.freeze([
  "circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.standard-65",
  "MainWireIntegratedStudioStandardRuntimeHostV1",
]);

type SelectedAorticOutflowReleaseV1 =
  ReturnType<typeof createCircleHeartExactModelReleaseV1>;

type SelectedAorticOutflowClientDescriptorV1 = Readonly<{
  schemaId: typeof CLIENT_DESCRIPTOR_SCHEMA_ID_V1;
  manifest: SelectedAorticOutflowReleaseV1["manifest"];
  defaultFixture:
    typeof MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1;
}>;

type SelectedAorticOutflowRegistryAdmissionLockV1 = Readonly<{
  schemaId: typeof REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2;
  modelId: string;
  artifactRevisionId: string;
  artifactSha256: string;
  predecessorArtifactRevisionId: string | null;
  equivalenceReportSha256: string | null;
}>;

await main();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const updateRequested = args.length === 1 && args[0] === "--write";
  if (args.length > 0 && !updateRequested) {
    fail("the only supported argument is --write");
  }

  const sourceRelease = createCircleHeartExactModelReleaseV1();
  assertSelectedSourceManifestV1(sourceRelease.manifest);

  const firstBuild = await buildSelectedAorticOutflowArtifactV1();
  const secondBuild = await buildSelectedAorticOutflowArtifactV1();
  if (!sameBytesV1(firstBuild, secondBuild)) {
    fail("two clean Standard66 artifact builds emitted different bytes");
  }

  const canonicalManifest = studioCanonicalJsonStringify(
    sourceRelease.manifest,
  );
  const artifactRevisionId = exactPackageSha256V1(
    canonicalManifest,
    firstBuild,
  );
  const artifactSha256 = sha256V1(firstBuild);
  await assertSelectedArtifactAdmissionV1(firstBuild, canonicalManifest);

  const expectedClientDescriptor: SelectedAorticOutflowClientDescriptorV1 =
    Object.freeze({
      schemaId: CLIENT_DESCRIPTOR_SCHEMA_ID_V1,
      manifest: sourceRelease.manifest,
      defaultFixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    });

  if (updateRequested) {
    const writtenLock = await updateArtifactAndLockV1(
      sourceRelease.manifest.modelId,
      artifactRevisionId,
      artifactSha256,
      firstBuild,
      expectedClientDescriptor,
    );
    console.log(
      "Wrote selected-aortic-outflow Standard66 exact artifact, client "
        + `descriptor, and lock: ${writtenLock.modelId} `
        + `(${artifactRevisionId})`,
    );
    return;
  }

  if (
    !existsSync(artifactPath)
    || !existsSync(clientDescriptorPath)
    || !existsSync(lockPath)
  ) {
    fail(
      "committed Standard66 artifact, client descriptor, or lock is "
        + "missing; run with --write",
    );
  }

  const committedArtifact = new Uint8Array(readFileSync(artifactPath));
  if (!sameBytesV1(committedArtifact, firstBuild)) {
    fail(
      `${artifactRelativePath} differs from the deterministic exact build; `
        + "run with --write to certify an implementation revision",
    );
  }
  assertUtf8RoundTripV1(committedArtifact);

  const committedClientDescriptor = parseClientDescriptorV1(
    readFileSync(clientDescriptorPath, "utf8"),
    "selected-aortic-outflow Standard66 client descriptor",
  );
  if (
    studioCanonicalJsonStringify(committedClientDescriptor)
      !== studioCanonicalJsonStringify(expectedClientDescriptor)
  ) {
    fail(
      `${clientDescriptorRelativePath} differs from the admitted Standard66 `
        + "kernel and default fixture",
    );
  }

  const committedLock = parseLockV1(
    readFileSync(lockPath, "utf8"),
    "selected-aortic-outflow Standard66 lock",
  );
  if (
    committedLock.modelId !== sourceRelease.manifest.modelId
    || committedLock.artifactRevisionId !== artifactRevisionId
    || committedLock.artifactSha256 !== artifactSha256
  ) {
    fail(
      `${lockRelativePath} does not identify the deterministic Standard66 `
        + "artifact bytes",
    );
  }
  const committedEquivalenceReport = readCurrentEquivalenceReportV1(
    committedLock,
  );
  await assertBaseRevisionTransitionV1(
    committedLock,
    committedClientDescriptor,
    committedEquivalenceReport,
    committedArtifact,
  );

  console.log(
    "Selected-aortic-outflow Standard66 registry admission verified: "
      + `${committedLock.modelId} (${committedLock.artifactRevisionId})`,
  );
}

function assertSelectedSourceManifestV1(
  manifest: ExactModelKernelManifestV3,
): void {
  for (const requiredCapability of [
    STUDIO_EXACT_PRESENTATION_BATCH_CAPABILITY_V1,
    EXECUTION_PLAN_TYPED_AUTHORITY_BINDING_V1_CAPABILITY,
    EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY,
  ]) {
    if (!manifest.capabilities.includes(requiredCapability)) {
      fail(`source release omits required capability ${requiredCapability}`);
    }
  }
  if (manifest.capabilities.some((capability) =>
    capability.startsWith("analysis/"))) {
    fail("source release must not claim an analysis capability");
  }
  if (
    manifest.primitiveControlCatalog.length !== 1
    || manifest.primitiveControlCatalog[0]?.controlId
      !== MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
        .heartRateBpm
    || manifest.primitiveControlCatalog[0].changeSemantics !== "cold-restart"
  ) {
    fail("source release must expose only the HR cold-restart control");
  }
  const outputIds = [
    ...manifest.primitiveSignalCatalog,
    ...manifest.modelMetricCatalog,
  ].map(({ outputId }) => outputId);
  const uniqueOutputIds = new Set(outputIds);
  if (
    outputIds.length !== 185
    || uniqueOutputIds.size !== outputIds.length
    || MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1.some(
      (outputId) => !uniqueOutputIds.has(outputId),
    )
  ) {
    fail("source release must expose all and only the 185 Standard66 outputs");
  }
}

async function buildSelectedAorticOutflowArtifactV1(): Promise<Uint8Array> {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_CIRCLEHEART_HOT_PATH_INTEGRITY":
        JSON.stringify(
          MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_HOT_PATH_INTEGRITY_TIER_V1,
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
          "main-wire-integrated-selected-aortic-outflow-standard66-v1.mjs",
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
    fail("Standard66 exact build unexpectedly entered watch mode");
  }
  const chunks = outputs[0].output.filter((item) => item.type === "chunk");
  if (chunks.length !== 1 || chunks[0] === undefined) {
    fail(`Standard66 exact build emitted ${chunks.length} JavaScript chunks`);
  }
  if (
    chunks[0].imports.length !== 0
    || chunks[0].dynamicImports.length !== 0
  ) {
    fail("Standard66 exact build must be one self-contained ESM artifact");
  }
  assertStandard65ArtifactMarkersExcludedV1(
    chunks[0].code,
    "deterministic artifact source",
  );
  return new TextEncoder().encode(chunks[0].code);
}

async function assertSelectedArtifactAdmissionV1(
  artifact: Uint8Array,
  canonicalManifest: string,
): Promise<void> {
  const namespace = await importExactExecutableArtifactModuleV2(artifact);
  const factory = namespace.createCircleHeartExactModelReleaseV1;
  if (typeof factory !== "function") {
    fail("artifact does not export createCircleHeartExactModelReleaseV1");
  }
  const produced: unknown = await factory();
  if (
    produced === null
    || typeof produced !== "object"
    || Array.isArray(produced)
  ) {
    fail("artifact factory returned a non-object release");
  }
  const release = produced as SelectedAorticOutflowReleaseV1;
  if (
    studioCanonicalJsonStringify(release.manifest) !== canonicalManifest
  ) {
    fail("artifact kernel manifest differs from the source release");
  }
  assertSelectedSourceManifestV1(release.manifest);

  const exactContract = exactContractFromManifestV1(release.manifest);
  const executables = release.executables;
  validateExecutableBundleV2(executables, exactContract);
  executables.fixtureAdapter.validateCompleteFixture({
    context: {
      scenarioId: "scenario/standard66-registry-verification",
      modelId: exactContract.modelId,
    },
    fixture:
      MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  });

  const runtimeSessionId = "session/standard66-registry-verification";
  const restoredRuntimeSessionId =
    "session/standard66-registry-verification-restored";
  const scenarioId = "scenario/standard66-registry-verification";
  const executionPlan = executables.executionPlan;
  const boundExecutionPlan = executionPlan.bind();
  assertBoundExecutionPlanV1(boundExecutionPlan, executionPlan.descriptor);
  await executionPlan.createSession({
    runtimeSessionId,
    scenarios: [{
      scenarioId,
      fixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
    }],
    boundExecutionPlans: new Map([[scenarioId, boundExecutionPlan]]),
  });

  try {
    const cold = executables.simulationAdapter.currentFrame({
      runtimeSessionId,
      scenarioId,
    });
    assertFrameClockV1(cold, 0, 0, 0, "cold frame");
    assertAllOutputsAndProximalPressureV1(
      cold,
      "not-evaluated-at-accepted-state",
      "cold frame",
    );

    const advanced = await executables.simulationAdapter
      .advanceOnePresentationStep({ runtimeSessionId, scenarioId });
    assertFrameClockV1(advanced, 0, 1, 0.002, "first accepted frame");
    assertAllOutputsAndProximalPressureV1(
      advanced,
      "available",
      "first accepted frame",
    );

    const captured = await executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: "experiment/standard66-registry-verification",
        model: exactContract,
        desiredContent: {
          modelId: exactContract.modelId,
          surfaceSeriesId: "surface-series/standard66-registry-verification",
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
          runtimeSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    const capture = captured.content.scenarios[0]?.capture;
    if (
      capture === undefined
      || capture.checkpoint.acceptedRevision !== advanced.acceptedRevision
      || capture.checkpoint.acceptedTimeSec !== advanced.acceptedTimeSec
      || capture.checkpoint.payload === null
      || typeof capture.checkpoint.payload !== "object"
      || Array.isArray(capture.checkpoint.payload)
    ) {
      fail("artifact did not capture the accepted Standard66 object checkpoint");
    }
    if (JSON.stringify(capture.checkpoint.payload).includes(
      "acceptedNumericalReadback",
    )) {
      fail("Standard66 object checkpoint must not persist numerical readback");
    }
    await executables.captureAdapter.validateCapture({
      model: exactContract,
      capture,
    });

    const restoredBoundExecutionPlan = executionPlan.bind();
    assertBoundExecutionPlanV1(
      restoredBoundExecutionPlan,
      executionPlan.descriptor,
    );
    await executionPlan.createSession({
      runtimeSessionId: restoredRuntimeSessionId,
      scenarios: [{
        scenarioId,
        fixture: capture.fixture,
        checkpoint: capture.checkpoint,
      }],
      boundExecutionPlans: new Map([[scenarioId, restoredBoundExecutionPlan]]),
    });

    const restored = executables.simulationAdapter.currentFrame({
      runtimeSessionId: restoredRuntimeSessionId,
      scenarioId,
    });
    assertFrameClockV1(
      restored,
      0,
      advanced.acceptedRevision,
      advanced.acceptedTimeSec,
      "restored frame",
    );
    assertAllOutputsAndProximalPressureV1(
      restored,
      "not-evaluated-at-accepted-state",
      "restored frame",
    );

    const restoredAdvanced = await executables.simulationAdapter
      .advanceOnePresentationStep({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarioId,
      });
    assertAllOutputsAndProximalPressureV1(
      restoredAdvanced,
      "available",
      "restored next frame",
    );

    const hrControl = release.manifest.primitiveControlCatalog[0];
    if (hrControl === undefined) {
      fail("HR control disappeared after artifact import");
    }
    const nextHeartRate = hrControl.defaultValue + hrControl.step
      <= hrControl.maximum
      ? hrControl.defaultValue + hrControl.step
      : hrControl.defaultValue - hrControl.step;
    const restarted = await executables.simulationAdapter.applyControl({
      runtimeSessionId: restoredRuntimeSessionId,
      scenarioId,
      controlId:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_CONTROL_IDS_V1
          .heartRateBpm,
      value: nextHeartRate,
      expectedInputEpoch: 0,
    });
    assertFrameClockV1(restarted, 1, 0, 0, "HR cold-restarted frame");
    assertAllOutputsAndProximalPressureV1(
      restarted,
      "not-evaluated-at-accepted-state",
      "HR cold-restarted frame",
    );

    await assertRejectsV1(
      executables.simulationAdapter.requestAnalysis({
        runtimeSessionId: restoredRuntimeSessionId,
        scenarioId,
        analysisId: "analysis/standard66-must-be-unregistered",
        expectedInputEpoch: restarted.inputEpoch,
        expectedAcceptedRevision: restarted.acceptedRevision,
        expectedAcceptedTimeSec: restarted.acceptedTimeSec,
      }),
      /analysis is not registered/,
      "artifact must reject every unregistered analysis request",
    );
  } finally {
    executables.simulationAdapter.disposeSession(runtimeSessionId);
    executables.simulationAdapter.disposeSession(restoredRuntimeSessionId);
  }
}

function exactContractFromManifestV1(
  manifest: ExactModelKernelManifestV3,
): ModelContractV2 {
  const contract: ModelContractV2 = Object.freeze({
    modelId: manifest.modelId,
    modelFamilyId: manifest.modelFamilyId,
    displayName: manifest.modelId,
    fixtureSchemaId: manifest.fixtureSchema.fixtureSchemaId,
    checkpointCodecId: manifest.checkpointCodec.checkpointCodecId,
    snapshotGateId: STUDIO_COMMON_SNAPSHOT_ADMISSION_ID_V1,
    controlCatalog: manifest.primitiveControlCatalog,
    outputCatalog: Object.freeze([
      ...manifest.primitiveSignalCatalog,
      ...manifest.modelMetricCatalog,
    ]),
    graphCatalog: Object.freeze([]),
  });
  assertModelContractV2(contract);
  return contract;
}

function assertFrameClockV1(
  frame: StudioSimulationFrameV2,
  inputEpoch: number,
  acceptedRevision: number,
  acceptedTimeSec: number,
  label: string,
): void {
  if (
    frame.inputEpoch !== inputEpoch
    || frame.acceptedRevision !== acceptedRevision
    || frame.acceptedTimeSec !== acceptedTimeSec
  ) {
    fail(`${label} has an unexpected epoch or accepted clock`);
  }
}

function assertAllOutputsAndProximalPressureV1(
  frame: StudioSimulationFrameV2,
  expectedAvailability: "available" | "not-evaluated-at-accepted-state",
  label: string,
): void {
  if (Object.keys(frame.outputs).length !== 185) {
    fail(`${label} does not project all 185 exact outputs`);
  }
  const proximal =
    frame.outputs[PROXIMAL_CONSTITUTIVE_PORT_PRESSURE_OUTPUT_ID_V1];
  if (
    proximal === undefined
    || proximal.availability !== expectedAvailability
    || (
      expectedAvailability === "available"
        ? typeof proximal.value !== "number"
          || !Number.isFinite(proximal.value)
        : proximal.value !== null
    )
  ) {
    fail(`${label} has an invalid proximal constitutive-port pressure state`);
  }
}

async function assertRejectsV1(
  promise: Promise<unknown>,
  messagePattern: RegExp,
  failureMessage: string,
): Promise<void> {
  try {
    await promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (messagePattern.test(message)) return;
    fail(`${failureMessage}; received ${message}`);
  }
  fail(`${failureMessage}; request unexpectedly resolved`);
}

async function updateArtifactAndLockV1(
  modelId: string,
  artifactRevisionId: string,
  artifactSha256: string,
  artifact: Uint8Array,
  clientDescriptor: SelectedAorticOutflowClientDescriptorV1,
): Promise<SelectedAorticOutflowRegistryAdmissionLockV1> {
  const prior = existsSync(lockPath)
    ? parseLockV1(
        readFileSync(lockPath, "utf8"),
        "existing selected-aortic-outflow Standard66 lock",
      )
    : null;
  let predecessorArtifactRevisionId: string | null = null;
  let equivalenceReportSha256: string | null = null;

  if (prior === null) {
    if (existsSync(equivalenceReportPath)) {
      fail("an unbound Standard66 artifact equivalence report already exists");
    }
  } else {
    if (prior.modelId !== modelId) {
      fail("the dedicated Standard66 lock cannot change modelId");
    }
    if (prior.artifactRevisionId === artifactRevisionId) {
      if (prior.artifactSha256 !== artifactSha256) {
        fail("the existing Standard66 lock disagrees with identical revision bytes");
      }
      readCurrentEquivalenceReportV1(prior);
      predecessorArtifactRevisionId = prior.predecessorArtifactRevisionId;
      equivalenceReportSha256 = prior.equivalenceReportSha256;
    } else {
      if (!existsSync(artifactPath) || !existsSync(clientDescriptorPath)) {
        fail("the predecessor Standard66 artifact or client descriptor is missing");
      }
      const predecessorArtifact = new Uint8Array(readFileSync(artifactPath));
      const predecessorClient = parseClientDescriptorV1(
        readFileSync(clientDescriptorPath, "utf8"),
        "predecessor selected-aortic-outflow Standard66 client descriptor",
      );
      const predecessorManifest = studioCanonicalJsonStringify(
        predecessorClient.manifest,
      );
      if (
        predecessorClient.manifest.modelId !== prior.modelId
        || sha256V1(predecessorArtifact) !== prior.artifactSha256
        || exactPackageSha256V1(predecessorManifest, predecessorArtifact)
          !== prior.artifactRevisionId
      ) {
        fail(
          "the checked predecessor Standard66 artifact, client manifest, "
            + "and lock disagree",
        );
      }
      const report = await compareSelectedAorticOutflowArtifactRevisionsV1({
        predecessorArtifact,
        predecessorArtifactRevisionId: prior.artifactRevisionId,
        candidateArtifact: artifact,
        candidateArtifactRevisionId: artifactRevisionId,
      });
      predecessorArtifactRevisionId = prior.artifactRevisionId;
      equivalenceReportSha256 =
        selectedAorticOutflowArtifactEquivalenceReportSha256V1(report);
      writeFileSync(
        equivalenceReportPath,
        `${JSON.stringify(report, null, 2)}\n`,
        "utf8",
      );
    }
  }

  const lock: SelectedAorticOutflowRegistryAdmissionLockV1 = Object.freeze({
    schemaId: REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2,
    modelId,
    artifactRevisionId,
    artifactSha256,
    predecessorArtifactRevisionId,
    equivalenceReportSha256,
  });
  writeFileSync(artifactPath, artifact);
  writeFileSync(
    clientDescriptorPath,
    `${JSON.stringify(clientDescriptor, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  return lock;
}

function readCurrentEquivalenceReportV1(
  lock: SelectedAorticOutflowRegistryAdmissionLockV1,
): SelectedAorticOutflowArtifactEquivalenceReportV1 | null {
  if (lock.equivalenceReportSha256 === null) {
    if (existsSync(equivalenceReportPath)) {
      fail("an unbound Standard66 artifact equivalence report remains");
    }
    return null;
  }
  if (existsSync(equivalenceReportPath) === false) {
    fail("the Standard66 lock requires a missing equivalence report");
  }
  const report = parseEquivalenceReportV1(
    readFileSync(equivalenceReportPath, "utf8"),
  );
  if (
    report.modelId !== lock.modelId
    || report.predecessorArtifactRevisionId
      !== lock.predecessorArtifactRevisionId
    || report.candidateArtifactRevisionId !== lock.artifactRevisionId
    || selectedAorticOutflowArtifactEquivalenceReportSha256V1(report)
      !== lock.equivalenceReportSha256
  ) {
    fail("the Standard66 artifact equivalence report does not match its lock");
  }
  return report;
}

async function assertBaseRevisionTransitionV1(
  current: SelectedAorticOutflowRegistryAdmissionLockV1,
  currentClient: SelectedAorticOutflowClientDescriptorV1,
  currentReport: SelectedAorticOutflowArtifactEquivalenceReportV1 | null,
  currentArtifact: Uint8Array,
): Promise<void> {
  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  if (baseRef === undefined || baseRef === "" || /^0+$/.test(baseRef)) return;
  const priorBytes = readPriorBytesV1(baseRef, lockRelativePath);
  if (priorBytes === null) {
    if (
      current.predecessorArtifactRevisionId !== null
      || current.equivalenceReportSha256 !== null
    ) {
      fail("a first Standard66 model identity cannot inherit artifact lineage");
    }
    return;
  }
  const prior = parseLockV1(
    new TextDecoder("utf-8", { fatal: true }).decode(priorBytes),
    `selected-aortic-outflow Standard66 lock at ${baseRef}`,
  );
  if (prior.modelId !== current.modelId) {
    fail("the dedicated Standard66 registry path changed modelId");
  }
  const priorClientBytes = readPriorBytesV1(
    baseRef,
    clientDescriptorRelativePath,
  );
  if (priorClientBytes === null) {
    fail(`the predecessor Standard66 client descriptor is missing at ${baseRef}`);
  }
  const priorClient = parseClientDescriptorV1(
    new TextDecoder("utf-8", { fatal: true }).decode(priorClientBytes),
    `selected-aortic-outflow Standard66 client descriptor at ${baseRef}`,
  );
  if (
    studioCanonicalJsonStringify(priorClient.manifest)
      !== studioCanonicalJsonStringify(currentClient.manifest)
  ) {
    fail("the exact Standard66 manifest changed under the same modelId");
  }
  if (prior.artifactRevisionId === current.artifactRevisionId) {
    if (
      current.predecessorArtifactRevisionId
        !== prior.predecessorArtifactRevisionId
      || current.equivalenceReportSha256 !== prior.equivalenceReportSha256
    ) {
      fail("an unchanged Standard66 revision cannot rewrite lineage evidence");
    }
    return;
  }
  if (
    current.predecessorArtifactRevisionId !== prior.artifactRevisionId
    || currentReport === null
  ) {
    fail(
      "a same-model Standard66 artifact change requires predecessor-bound "
        + "byte-exact evidence",
    );
  }
  const priorArtifact = readPriorBytesV1(baseRef, artifactRelativePath);
  if (priorArtifact === null) {
    fail(`the predecessor Standard66 artifact is missing at ${baseRef}`);
  }
  if (
    sha256V1(priorArtifact) !== prior.artifactSha256
    || exactPackageSha256V1(
      studioCanonicalJsonStringify(priorClient.manifest),
      priorArtifact,
    ) !== prior.artifactRevisionId
  ) {
    fail("the predecessor Standard66 artifact does not match its base lock");
  }
  const reproduced = await compareSelectedAorticOutflowArtifactRevisionsV1({
    predecessorArtifact: priorArtifact,
    predecessorArtifactRevisionId: prior.artifactRevisionId,
    candidateArtifact: currentArtifact,
    candidateArtifactRevisionId: current.artifactRevisionId,
  });
  if (
    studioCanonicalJsonStringify(reproduced)
      !== studioCanonicalJsonStringify(currentReport)
  ) {
    fail("the Standard66 equivalence report is not reproducible from base");
  }
}

function parseClientDescriptorV1(
  text: string,
  label: string,
): SelectedAorticOutflowClientDescriptorV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(parsed, label);
  const expected = ["defaultFixture", "manifest", "schemaId"];
  const keys = Object.keys(record).sort();
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId !== CLIENT_DESCRIPTOR_SCHEMA_ID_V1
  ) {
    fail(`${label} is invalid`);
  }
  return parsed as SelectedAorticOutflowClientDescriptorV1;
}

function parseLockV1(
  text: string,
  label: string,
): SelectedAorticOutflowRegistryAdmissionLockV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(parsed, label);
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
    || record.schemaId !== REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2
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
    fail(`${label} must be a valid v2 admission lock`);
  }
  return Object.freeze({
    schemaId: REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2,
    modelId: record.modelId,
    artifactRevisionId: record.artifactRevisionId,
    artifactSha256: record.artifactSha256,
    predecessorArtifactRevisionId: record.predecessorArtifactRevisionId,
    equivalenceReportSha256: record.equivalenceReportSha256,
  }) as SelectedAorticOutflowRegistryAdmissionLockV1;
}

function parseEquivalenceReportV1(
  text: string,
): SelectedAorticOutflowArtifactEquivalenceReportV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(
    parsed,
    "selected-aortic-outflow Standard66 equivalence report",
  );
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
      !== SELECTED_AORTIC_OUTFLOW_ARTIFACT_EQUIVALENCE_REPORT_V1_SCHEMA_ID
    || typeof record.modelId !== "string"
    || typeof record.predecessorArtifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.predecessorArtifactRevisionId)
    || typeof record.candidateArtifactRevisionId !== "string"
    || !/^[0-9a-f]{64}$/.test(record.candidateArtifactRevisionId)
    || record.corpusId !== MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID
    || record.equality !== "byte-exact"
    || !Array.isArray(record.cases)
    || record.cases.length === 0
  ) {
    fail("the Standard66 artifact equivalence report is invalid");
  }
  for (const [index, artifactCase] of record.cases.entries()) {
    const caseRecord = exactPlainRecordV1(
      artifactCase,
      `Standard66 equivalence report case ${index}`,
    );
    const caseKeys = Object.keys(caseRecord).sort();
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
      || typeof caseRecord.caseId !== "string"
      || typeof caseRecord.acceptedStepCount !== "number"
      || !Number.isSafeInteger(caseRecord.acceptedStepCount)
      || caseRecord.acceptedStepCount <= 0
      || caseRecord.initialFrameEquality !== "byte-exact"
      || caseRecord.advancedFrameEquality !== "byte-exact"
      || caseRecord.exactCaptureEquality !== "byte-exact"
    ) {
      fail(`Standard66 equivalence report case ${index} is invalid`);
    }
  }
  return parsed as SelectedAorticOutflowArtifactEquivalenceReportV1;
}

function exactPlainRecordV1(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    fail(`${label} must be a plain JSON object`);
  }
  return value as Record<string, unknown>;
}

function assertUtf8RoundTripV1(artifact: Uint8Array): void {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(artifact);
  } catch {
    fail("Standard66 executable artifact must be valid UTF-8");
  }
  if (!sameBytesV1(new TextEncoder().encode(source), artifact)) {
    fail("Standard66 executable artifact does not round-trip as UTF-8");
  }
  assertStandard65ArtifactMarkersExcludedV1(source, "committed artifact bytes");
}

function assertStandard65ArtifactMarkersExcludedV1(
  source: string,
  label: string,
): void {
  for (const marker of FORBIDDEN_STANDARD65_ARTIFACT_MARKERS_V1) {
    if (source.includes(marker)) {
      fail(`${label} unexpectedly contains Standard65 marker ${marker}`);
    }
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
      maxBuffer: 1_000_000,
      stdio: ["ignore", "pipe", "inherit"],
    },
  ));
}

function sameBytesV1(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((value, index) => value === right[index]);
}

function fail(message: string): never {
  throw new Error(
    `Selected-aortic-outflow Standard66 registry verification failed: ${message}`,
  );
}
