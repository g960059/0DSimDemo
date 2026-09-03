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
  qualifyMainWireIntegratedModelStandard69BaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineQualificationV1";
import {
  qualifyMainWireIntegratedModelStandard70BaselineV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineQualificationV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelRoundedEjectionBaselineV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard69BaselineV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard70BaselineV1";
import {
  MainWireIntegratedModelStandard68TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard68TypedAuthoritySessionV1";
import {
  MainWireIntegratedModelStandard70TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard70TypedAuthoritySessionV1";
import {
  qualifyMainWireIntegratedModelFormalPreloadReserveV1,
} from "@/analysis/methods/mainWire/MainWirePressureVolumeProtocolsV3";
import {
  MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID,
} from "@/engine/vnext/MainWireSolverReplacementCorpusV1";
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
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
  createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
  type MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioSelectedAorticOutflowExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1,
  createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SETTLED_CHECKPOINT_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_VALIDATION_REPORT_V1,
  createMainWireIntegratedStudioQualifiedBaselineSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualifiedBaselineExactModelV1";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1,
  createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1";
import {
  buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioRoundedEjectionBaselineValidationV1";
import {
  buildMainWireIntegratedStudioStandard69BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard69BaselineValidationV1";
import {
  buildMainWireIntegratedStudioStandard70BaselineValidationV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard70BaselineValidationV1";
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
const requestedArguments = process.argv.slice(2);
const roundedEjectionRequested = requestedArguments.includes(
  "--rounded-ejection",
);
const qualifiedBaselineRequested = requestedArguments.includes(
  "--qualified-baseline",
);
const algebraicPulmonaryRootRequested = requestedArguments.includes(
  "--algebraic-pulmonary-root",
);
if (
  [
    roundedEjectionRequested,
    qualifiedBaselineRequested,
    algebraicPulmonaryRootRequested,
  ].filter(Boolean).length > 1
) {
  throw new Error(
    "construction selection arguments are mutually exclusive",
  );
}
const roundedConstructionRequested =
  roundedEjectionRequested
  || qualifiedBaselineRequested
  || algebraicPulmonaryRootRequested;
const updateRequested = requestedArguments.includes("--write");
if (requestedArguments.some((argument) =>
  argument !== "--write"
  && argument !== "--rounded-ejection"
  && argument !== "--qualified-baseline"
  && argument !== "--algebraic-pulmonary-root")) {
  throw new Error("unsupported registry verification argument");
}
const releaseConfigurationV1 = algebraicPulmonaryRootRequested
  ? Object.freeze({
      label: "algebraic-pulmonary-root Standard70",
      idSlug: "algebraic-pulmonary-root-standard70",
      displayName: "Main Wire Standard 70",
      entryFile:
        "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.entry.ts",
      artifactFile:
        "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.artifact.mjs",
      descriptorFile:
        "MainWireIntegratedStudioAlgebraicPulmonaryRootExactModelV1.client.json",
      lockFile:
        "algebraic-pulmonary-root-standard70-registry-admission-lock.json",
      equivalenceReportFile:
        "algebraic-pulmonary-root-standard70-artifact-equivalence-report.json",
      artifactChunkName:
        "main-wire-integrated-algebraic-pulmonary-root-standard70-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.algebraic-pulmonary-root.standard-70",
      fixtureId:
        "main-wire-integrated-model-algebraic-pulmonary-root-fixture-v1",
      proximalArterialRootsProfileId: null,
      pulmonaryArterialRootProfileId:
        "main-wire-algebraic-pulmonary-arterial-root-profile-v1",
      numericalSessionId:
        "main-wire-integrated-model-standard70-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard70-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioAlgebraicPulmonaryRootSettledReleaseV1,
      defaultFixture:
        MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_DEFAULT_FIXTURE_V1,
    })
  : qualifiedBaselineRequested
  ? Object.freeze({
      label: "qualified-baseline Standard69",
      idSlug: "qualified-baseline-standard69",
      displayName: "Main Wire Standard 69",
      entryFile: "MainWireIntegratedStudioQualifiedBaselineExactModelV1.entry.ts",
      artifactFile:
        "MainWireIntegratedStudioQualifiedBaselineExactModelV1.artifact.mjs",
      descriptorFile:
        "MainWireIntegratedStudioQualifiedBaselineExactModelV1.client.json",
      lockFile: "qualified-baseline-standard69-registry-admission-lock.json",
      equivalenceReportFile:
        "qualified-baseline-standard69-artifact-equivalence-report.json",
      artifactChunkName:
        "main-wire-integrated-qualified-baseline-standard69-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.qualified-baseline.standard-69",
      fixtureId: "main-wire-integrated-model-rounded-ejection-fixture-v1",
      proximalArterialRootsProfileId: null,
      pulmonaryArterialRootProfileId: null,
      numericalSessionId:
        "main-wire-integrated-model-standard68-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard68-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioQualifiedBaselineSettledReleaseV1,
      defaultFixture:
        MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_DEFAULT_FIXTURE_V1,
    })
  : roundedEjectionRequested
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
      equivalenceReportFile:
        "rounded-ejection-standard68-artifact-equivalence-report.json",
      artifactChunkName:
        "main-wire-integrated-rounded-ejection-standard68-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.rounded-ejection.standard-68",
      fixtureId: "main-wire-integrated-model-rounded-ejection-fixture-v1",
      proximalArterialRootsProfileId: null,
      pulmonaryArterialRootProfileId: null,
      numericalSessionId:
        "main-wire-integrated-model-standard68-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard68-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioRoundedEjectionSettledReleaseV1,
      defaultFixture:
        MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_DEFAULT_FIXTURE_V1,
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
      equivalenceReportFile:
        "algebraic-proximal-roots-standard67-artifact-equivalence-report.json",
      artifactChunkName:
        "main-wire-integrated-algebraic-proximal-roots-standard67-v1.mjs",
      modelId:
        "circleheart.main-wire-integrated-transaction-v3.algebraic-proximal-roots.standard-67",
      fixtureId:
        "main-wire-integrated-model-algebraic-proximal-roots-fixture-v1",
      proximalArterialRootsProfileId:
        "main-wire-algebraic-proximal-arterial-roots-profile-v1",
      pulmonaryArterialRootProfileId: null,
      numericalSessionId:
        "main-wire-integrated-model-standard67-typed-authority-session-v1",
      checkpointId:
        "circleheart.main-wire-integrated-model-standard67-exact-checkpoint.v1",
      createRelease:
        createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1,
      defaultFixture:
        MAIN_WIRE_INTEGRATED_STUDIO_SELECTED_AORTIC_OUTFLOW_DEFAULT_FIXTURE_V1,
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
const equivalenceReportRelativePath = integrationRelativeRoot
  + releaseConfigurationV1.equivalenceReportFile;
const equivalenceReportPath = path.join(
  repositoryRoot,
  equivalenceReportRelativePath,
);

const CLIENT_DESCRIPTOR_SCHEMA_ID_V1 =
  "circleheart-standard-exact-model-client-descriptor-v1" as const;
const REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2 =
  "circleheart-standard-exact-model-registry-admission-lock-v2" as const;
const BASELINE_RUNTIME_RELATIVE_TOLERANCE_V1 = 1e-10;

type ReleaseV1 = ReturnType<
  typeof createMainWireIntegratedStudioAlgebraicProximalRootsReleaseV1
>;

type RegistryAdmissionLockV1 = Readonly<{
  schemaId: typeof REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2;
  modelId: string;
  artifactRevisionId: string;
  artifactSha256: string;
  predecessorArtifactRevisionId: string | null;
  equivalenceReportSha256: string | null;
}>;

await main();

async function main(): Promise<void> {
  if (algebraicPulmonaryRootRequested) {
    await assertAlgebraicPulmonaryRootBaselineQualificationV1();
  } else if (roundedConstructionRequested) {
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
      releaseConfigurationV1.defaultFixture,
  });
  if (updateRequested) {
    const writtenLock = await updateArtifactAndLockV1(
      sourceRelease.manifest.modelId,
      artifactRevisionId,
      artifactSha256,
      firstBuild,
      descriptor,
    );
    process.stdout.write(
      `Wrote ${releaseConfigurationV1.label} exact release `
        + `(${writtenLock.artifactRevisionId})\n`,
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
  const committedLock = parseLockV1(
    readFileSync(lockPath, "utf8"),
    `committed ${releaseConfigurationV1.label} lock`,
  );
  if (
    studioCanonicalJsonStringify(committedDescriptor)
      !== studioCanonicalJsonStringify(descriptor)
  ) {
    fail("committed client descriptor differs from the source release");
  }
  if (
    committedLock.modelId !== sourceRelease.manifest.modelId
    || committedLock.artifactRevisionId !== artifactRevisionId
    || committedLock.artifactSha256 !== artifactSha256
  ) {
    fail("committed admission lock does not identify the exact artifact");
  }
  const committedEquivalenceReport = readCurrentEquivalenceReportV1(
    committedLock,
  );
  await assertBaseRevisionTransitionV1(
    committedLock,
    committedDescriptor,
    committedEquivalenceReport,
    committedArtifact,
  );
  process.stdout.write(
    `${releaseConfigurationV1.label} registry admission verified: `
      + `${committedLock.modelId} (${artifactRevisionId})\n`,
  );
}

async function assertAlgebraicPulmonaryRootBaselineQualificationV1():
  Promise<void> {
  const qualification =
    await qualifyMainWireIntegratedModelStandard70BaselineV1(
      MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SETTLED_CHECKPOINT_V1,
    );
  const settledSession =
    await MainWireIntegratedModelStandard70TypedAuthoritySessionV1
      .restoreStandard70ExactCheckpoint(
        qualification.checkpoint,
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
        1,
        undefined,
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_MECHANISM_INPUTS_V1,
      );
  const preloadReserve =
    await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
      settledSession,
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_BASELINE_HEMODYNAMIC_INPUTS_V1,
    );
  const report = buildMainWireIntegratedStudioStandard70BaselineValidationV1(
    qualification,
    preloadReserve,
  );
  if (
    !sameBaselineAcrossSupportedRuntimeV1(
      report,
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1,
    )
    || !sameBaselineAcrossSupportedRuntimeV1(
      qualification.checkpoint,
      MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_SETTLED_CHECKPOINT_V1,
    )
  ) {
    fail(
      "fresh Standard70 qualification differs from the committed baseline",
    );
  }
  const requiredRightHeartCheckIds = [
    "pulmonary-valve.mean-gradient",
    "pulmonary-valve.peak-gradient",
    "pulmonary-valve.ejection-time",
    "right-ventricle.maximum-dpdt",
    "right-ventricle.minimum-dpdt",
    "tricuspid-flow.peak-e-to-a",
    "right-timing.ict",
    "right-timing.irt",
    "right-timing.tei-index",
    "waveform.PAP.single-peak-no-ringing",
    "waveform.PV-flow.single-forward-episode",
    "waveform.PV-flow.single-peak-no-ringing",
    "waveform.PAP.post-PV-closure-rebound",
  ];
  const passedIds = new Set<string>(
    report.checks
      .filter(({ status }) => status === "passed")
      .map(({ checkId }) => checkId),
  );
  if (requiredRightHeartCheckIds.some((checkId) => !passedIds.has(checkId))) {
    fail("Standard70 qualification omits a required right-heart mint gate");
  }
}

async function assertRoundedEjectionBaselineQualificationV1(): Promise<void> {
  const qualification = qualifiedBaselineRequested
    ? await qualifyMainWireIntegratedModelStandard69BaselineV1()
    : await qualifyMainWireIntegratedModelRoundedEjectionBaselineV1();
  const hemodynamicInputs = qualifiedBaselineRequested
    ? MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_HEMODYNAMIC_INPUTS_V1
    : MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_HEMODYNAMIC_INPUTS_V1;
  const mechanismInputs = qualifiedBaselineRequested
    ? MAIN_WIRE_INTEGRATED_MODEL_STANDARD69_BASELINE_MECHANISM_INPUTS_V1
    : MAIN_WIRE_INTEGRATED_MODEL_ROUNDED_EJECTION_BASELINE_MECHANISM_INPUTS_V1;
  const settledSession =
    await MainWireIntegratedModelStandard68TypedAuthoritySessionV1
      .restoreStandard68ExactCheckpoint(
        qualification.checkpoint,
        hemodynamicInputs,
        1,
        undefined,
        mechanismInputs,
      );
  const preloadReserve =
    await qualifyMainWireIntegratedModelFormalPreloadReserveV1(
      settledSession,
      hemodynamicInputs,
    );
  const report = qualifiedBaselineRequested
    ? buildMainWireIntegratedStudioStandard69BaselineValidationV1(
        qualification,
        preloadReserve,
      )
    : buildMainWireIntegratedStudioRoundedEjectionBaselineValidationV1(
        qualification,
        preloadReserve,
      );
  const committedReport = qualifiedBaselineRequested
    ? MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_VALIDATION_REPORT_V1
    : MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1;
  const committedCheckpoint = qualifiedBaselineRequested
    ? MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_SETTLED_CHECKPOINT_V1
    : MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_SETTLED_BASELINE_CHECKPOINT_V1;
  if (
    !sameBaselineAcrossSupportedRuntimeV1(
      report,
      committedReport,
    )
    || !sameBaselineAcrossSupportedRuntimeV1(
      qualification.checkpoint,
      committedCheckpoint,
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
    "aortic-pressure.maximum",
    "aortic-pressure.minimum",
    "pulmonary-artery-pressure.maximum",
    "pulmonary-artery-pressure.minimum",
    "central-venous-pressure.mean",
    "pcwp-surrogate.mean",
    "left-ventricle.edv-index",
    "left-ventricle.esv-index",
    "left-ventricle.ejection-fraction",
    "right-ventricle.edv-index",
    "right-ventricle.esv-index",
    "right-ventricle.ejection-fraction",
    "systemic-forward-flow.cardiac-index",
    "systemic-forward-flow.stroke-volume-index",
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

/**
 * The persisted checkpoint remains exact and self-hashed. Reconstructing that
 * orbit on another supported Node/V8/architecture can differ by a few ulps in
 * transcendental and accumulated continuous values, which also changes each
 * enclosing checkpoint hash. Registry qualification therefore requires exact
 * structure, identities, counters, and categorical results while admitting
 * only numerically negligible continuous reconstruction drift.
 */
function sameBaselineAcrossSupportedRuntimeV1(
  left: unknown,
  right: unknown,
  propertyName: string | null = null,
): boolean {
  if (propertyName === "checkpointSha256") {
    return typeof left === "string"
      && typeof right === "string"
      && /^[0-9a-f]{64}$/.test(left)
      && /^[0-9a-f]{64}$/.test(right);
  }
  if (
    propertyName === "stateFingerprint"
    || propertyName === "materialStateFingerprint"
  ) {
    return typeof left === "string"
      && typeof right === "string"
      && /^[0-9a-f]{8}$/.test(left)
      && /^[0-9a-f]{8}$/.test(right);
  }
  if (typeof left === "number" && typeof right === "number") {
    if (Number.isSafeInteger(left) || Number.isSafeInteger(right)) {
      return left === right;
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      return Object.is(left, right);
    }
    return Math.abs(left - right)
      <= BASELINE_RUNTIME_RELATIVE_TOLERANCE_V1
        * Math.max(1, Math.abs(left), Math.abs(right));
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) =>
        sameBaselineAcrossSupportedRuntimeV1(value, right[index]));
  }
  if (
    typeof left === "object" && left !== null
    && typeof right === "object" && right !== null
  ) {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index])
      && leftKeys.every((key) => sameBaselineAcrossSupportedRuntimeV1(
        leftRecord[key],
        rightRecord[key],
        key,
      ));
  }
  return Object.is(left, right);
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
  if (
    releaseConfigurationV1.pulmonaryArterialRootProfileId === null
      ? "pulmonaryArterialRootProfileId" in manifest.equations
      : manifest.equations.pulmonaryArterialRootProfileId
        !== releaseConfigurationV1.pulmonaryArterialRootProfileId
  ) {
    fail("source release binds the wrong pulmonary-root identity");
  }
  const structuralAnalysisCapabilities = [
    "analysis/main-wire-integrated-v3-guyton-starling-structural-orientation-v1",
    "analysis/main-wire-integrated-v3-formal-fixed-tbv-pressure-volume-relations-v1",
  ];
  if (
    roundedConstructionRequested
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
        releaseConfigurationV1.defaultFixture,
    }],
  });
  try {
    const initial = produced.executables.simulationAdapter.currentFrame({
      runtimeSessionId: sourceSessionId,
      scenarioId,
    });
    const baselineReport = algebraicPulmonaryRootRequested
      ? MAIN_WIRE_INTEGRATED_STUDIO_ALGEBRAIC_PULMONARY_ROOT_VALIDATION_REPORT_V1
      : qualifiedBaselineRequested
        ? MAIN_WIRE_INTEGRATED_STUDIO_QUALIFIED_BASELINE_VALIDATION_REPORT_V1
        : MAIN_WIRE_INTEGRATED_STUDIO_ROUNDED_EJECTION_BASELINE_VALIDATION_REPORT_V1;
    const expectedInitialRevision = roundedConstructionRequested
      ? baselineReport.checkpoint.revision
      : 0;
    const expectedInitialTimeSec = roundedConstructionRequested
      ? baselineReport.checkpoint.acceptedTimeSec
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
              releaseConfigurationV1.defaultFixture,
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

type ClientDescriptorV1 = Readonly<{
  schemaId: typeof CLIENT_DESCRIPTOR_SCHEMA_ID_V1;
  manifest: ExactModelKernelManifestV3;
  defaultFixture: unknown;
}>;

async function updateArtifactAndLockV1(
  modelId: string,
  artifactRevisionId: string,
  artifactSha256: string,
  artifact: Uint8Array,
  clientDescriptor: ClientDescriptorV1,
): Promise<RegistryAdmissionLockV1> {
  const currentPrior = existsSync(lockPath)
    ? parseLockV1(
        readFileSync(lockPath, "utf8"),
        `existing ${releaseConfigurationV1.label} lock`,
      )
    : null;
  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  const baseLockBytes = usableBaseRefV1(baseRef)
    ? readPriorBytesV1(baseRef, lockRelativePath)
    : null;
  const basePrior = baseLockBytes === null
    ? null
    : parseLockV1(
        new TextDecoder().decode(baseLockBytes),
        `${releaseConfigurationV1.label} lock at ${baseRef}`,
      );
  // An explicitly usable base ref is the release boundary. If this model ID
  // does not exist there, the candidate is a first admission even when a
  // locally generated lock already exists in the worktree.
  const prior = usableBaseRefV1(baseRef) ? basePrior : currentPrior;
  let predecessorArtifactRevisionId: string | null = null;
  let equivalenceReportSha256: string | null = null;

  if (prior === null) {
    if (existsSync(equivalenceReportPath)) {
      fail("a first model identity cannot have an equivalence report");
    }
  } else {
    if (prior.modelId !== modelId) {
      fail("the dedicated registry path cannot change modelId");
    }
    if (prior.artifactRevisionId === artifactRevisionId) {
      if (prior.artifactSha256 !== artifactSha256) {
        fail("the existing lock disagrees with identical revision bytes");
      }
      if (basePrior === null) readCurrentEquivalenceReportV1(prior);
      predecessorArtifactRevisionId = prior.predecessorArtifactRevisionId;
      equivalenceReportSha256 = prior.equivalenceReportSha256;
    } else {
      const predecessorArtifact = basePrior === null
        ? existingBytesV1(artifactPath)
        : readPriorBytesV1(baseRef!, artifactRelativePath);
      const predecessorClientBytes = basePrior === null
        ? existingBytesV1(clientDescriptorPath)
        : readPriorBytesV1(baseRef!, clientDescriptorRelativePath);
      if (predecessorArtifact === null || predecessorClientBytes === null) {
        fail("the predecessor artifact or client descriptor is missing");
      }
      const predecessorClient = parseClientDescriptorV1(
        new TextDecoder().decode(predecessorClientBytes),
        `predecessor ${releaseConfigurationV1.label} client descriptor`,
      );
      const predecessorManifest = studioCanonicalJsonStringify(
        predecessorClient.manifest,
      );
      if (
        predecessorClient.manifest.modelId !== prior.modelId
        || sha256V1(predecessorArtifact) !== prior.artifactSha256
        || exactPackageSha256V1(predecessorManifest, predecessorArtifact)
          !== prior.artifactRevisionId
        || predecessorManifest
          !== studioCanonicalJsonStringify(clientDescriptor.manifest)
      ) {
        fail("the predecessor artifact, manifest, and lock disagree");
      }
      const report = await compareSelectedAorticOutflowArtifactRevisionsV1({
        predecessorArtifact,
        predecessorArtifactRevisionId: prior.artifactRevisionId,
        candidateArtifact: artifact,
        candidateArtifactRevisionId: artifactRevisionId,
        defaultFixture: releaseConfigurationV1.defaultFixture as
          MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
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

  const lock: RegistryAdmissionLockV1 = Object.freeze({
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
  lock: RegistryAdmissionLockV1,
): SelectedAorticOutflowArtifactEquivalenceReportV1 | null {
  if (lock.equivalenceReportSha256 === null) {
    if (existsSync(equivalenceReportPath)) {
      fail("an unbound artifact equivalence report remains");
    }
    return null;
  }
  if (!existsSync(equivalenceReportPath)) {
    fail("the admission lock requires a missing equivalence report");
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
    fail("the artifact equivalence report does not match its lock");
  }
  return report;
}

async function assertBaseRevisionTransitionV1(
  current: RegistryAdmissionLockV1,
  currentClientInput: unknown,
  currentReport: SelectedAorticOutflowArtifactEquivalenceReportV1 | null,
  currentArtifact: Uint8Array,
): Promise<void> {
  const baseRef = process.env.CIRCLEHEART_REGISTRY_BASE_REF;
  if (!usableBaseRefV1(baseRef)) return;
  const priorBytes = readPriorBytesV1(baseRef, lockRelativePath);
  if (priorBytes === null) {
    if (
      current.predecessorArtifactRevisionId !== null
      || current.equivalenceReportSha256 !== null
    ) {
      fail("a first model identity cannot inherit artifact lineage");
    }
    return;
  }
  const prior = parseLockV1(
    new TextDecoder().decode(priorBytes),
    `${releaseConfigurationV1.label} lock at ${baseRef}`,
  );
  if (prior.modelId !== current.modelId) {
    fail("the dedicated registry path changed modelId");
  }
  const currentClient = parseClientDescriptorV1(
    JSON.stringify(currentClientInput),
    `current ${releaseConfigurationV1.label} client descriptor`,
  );
  const priorClientBytes = readPriorBytesV1(
    baseRef,
    clientDescriptorRelativePath,
  );
  if (priorClientBytes === null) {
    fail("the predecessor client descriptor is missing at the base ref");
  }
  const priorClient = parseClientDescriptorV1(
    new TextDecoder().decode(priorClientBytes),
    `predecessor ${releaseConfigurationV1.label} client descriptor`,
  );
  if (
    studioCanonicalJsonStringify(priorClient.manifest)
      !== studioCanonicalJsonStringify(currentClient.manifest)
    || studioCanonicalJsonStringify(priorClient.defaultFixture)
      !== studioCanonicalJsonStringify(currentClient.defaultFixture)
  ) {
    fail("the exact manifest or default fixture changed under the same modelId");
  }
  if (prior.artifactRevisionId === current.artifactRevisionId) {
    if (
      current.predecessorArtifactRevisionId
        !== prior.predecessorArtifactRevisionId
      || current.equivalenceReportSha256 !== prior.equivalenceReportSha256
    ) {
      fail("an unchanged revision cannot rewrite lineage evidence");
    }
    return;
  }
  if (
    current.predecessorArtifactRevisionId !== prior.artifactRevisionId
    || currentReport === null
  ) {
    fail("a same-model change requires predecessor-bound byte-exact evidence");
  }
  const priorArtifact = readPriorBytesV1(baseRef, artifactRelativePath);
  if (
    priorArtifact === null
    || sha256V1(priorArtifact) !== prior.artifactSha256
    || exactPackageSha256V1(
      studioCanonicalJsonStringify(priorClient.manifest),
      priorArtifact,
    ) !== prior.artifactRevisionId
  ) {
    fail("the predecessor artifact does not match its base lock");
  }
  const reproduced = await compareSelectedAorticOutflowArtifactRevisionsV1({
    predecessorArtifact: priorArtifact,
    predecessorArtifactRevisionId: prior.artifactRevisionId,
    candidateArtifact: currentArtifact,
    candidateArtifactRevisionId: current.artifactRevisionId,
    defaultFixture: releaseConfigurationV1.defaultFixture as
      MainWireIntegratedStudioSelectedAorticOutflowFixtureV1,
  });
  if (
    studioCanonicalJsonStringify(reproduced)
      !== studioCanonicalJsonStringify(currentReport)
  ) {
    fail("the artifact equivalence report is not reproducible from base");
  }
}

function parseLockV1(text: string, label: string): RegistryAdmissionLockV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(parsed, label);
  const keys = Object.keys(record).sort();
  const expected = [
    "artifactRevisionId",
    "artifactSha256",
    "equivalenceReportSha256",
    "modelId",
    "predecessorArtifactRevisionId",
    "schemaId",
  ];
  if (
    keys.length !== expected.length
    || keys.some((key, index) => key !== expected[index])
    || record.schemaId !== REGISTRY_ADMISSION_LOCK_SCHEMA_ID_V2
    || typeof record.modelId !== "string"
    || !sha256HexV1(record.artifactRevisionId)
    || !sha256HexV1(record.artifactSha256)
    || (
      record.predecessorArtifactRevisionId !== null
      && !sha256HexV1(record.predecessorArtifactRevisionId)
    )
    || (
      record.equivalenceReportSha256 !== null
      && !sha256HexV1(record.equivalenceReportSha256)
    )
    || (
      (record.predecessorArtifactRevisionId === null)
      !== (record.equivalenceReportSha256 === null)
    )
  ) {
    fail(`${label} is invalid`);
  }
  return parsed as RegistryAdmissionLockV1;
}

function parseClientDescriptorV1(
  text: string,
  label: string,
): ClientDescriptorV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(parsed, label);
  const keys = Object.keys(record).sort();
  if (
    keys.length !== 3
    || keys[0] !== "defaultFixture"
    || keys[1] !== "manifest"
    || keys[2] !== "schemaId"
    || record.schemaId !== CLIENT_DESCRIPTOR_SCHEMA_ID_V1
    || record.manifest === null
    || typeof record.manifest !== "object"
  ) {
    fail(`${label} is invalid`);
  }
  return parsed as ClientDescriptorV1;
}

function parseEquivalenceReportV1(
  text: string,
): SelectedAorticOutflowArtifactEquivalenceReportV1 {
  const parsed: unknown = JSON.parse(text);
  const record = exactPlainRecordV1(parsed, "artifact equivalence report");
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
    || !sha256HexV1(record.predecessorArtifactRevisionId)
    || !sha256HexV1(record.candidateArtifactRevisionId)
    || record.corpusId !== MAIN_WIRE_SOLVER_REPLACEMENT_CORPUS_V1_ID
    || record.equality !== "byte-exact"
    || !Array.isArray(record.cases)
    || record.cases.length === 0
  ) {
    fail("artifact equivalence report is invalid");
  }
  for (const [index, artifactCase] of record.cases.entries()) {
    const caseRecord = exactPlainRecordV1(
      artifactCase,
      `artifact equivalence report case ${index}`,
    );
    const expectedCaseKeys = [
      "acceptedStepCount",
      "advancedFrameEquality",
      "caseId",
      "exactCaptureEquality",
      "initialFrameEquality",
    ];
    const caseKeys = Object.keys(caseRecord).sort();
    if (
      caseKeys.length !== expectedCaseKeys.length
      || caseKeys.some((key, keyIndex) =>
        key !== expectedCaseKeys[keyIndex])
      || typeof caseRecord.caseId !== "string"
      || typeof caseRecord.acceptedStepCount !== "number"
      || !Number.isSafeInteger(caseRecord.acceptedStepCount)
      || caseRecord.acceptedStepCount <= 0
      || caseRecord.initialFrameEquality !== "byte-exact"
      || caseRecord.advancedFrameEquality !== "byte-exact"
      || caseRecord.exactCaptureEquality !== "byte-exact"
    ) {
      fail(`artifact equivalence report case ${index} is invalid`);
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

function usableBaseRefV1(value: string | undefined): value is string {
  return value !== undefined && value !== "" && !/^0+$/.test(value);
}

function existingBytesV1(filePath: string): Uint8Array | null {
  return existsSync(filePath) ? new Uint8Array(readFileSync(filePath)) : null;
}

function readPriorBytesV1(
  baseRef: string,
  relativePath: string,
): Uint8Array | null {
  try {
    return new Uint8Array(execFileSync(
      "git",
      ["show", `${baseRef}:${relativePath}`],
      {
        cwd: repositoryRoot,
        encoding: "buffer",
        maxBuffer: 32 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      },
    ));
  } catch {
    return null;
  }
}

function sha256HexV1(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
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
