import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const trackedPaths = execFileSync(
  "git",
  ["ls-files"],
  { cwd: repositoryRoot, encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);

const forbiddenExactPaths = new Set([
  "__tests__/integratedLaneBootstrapV1.test.ts",
  "__tests__/integratedLaneObservableRegistryV1.test.ts",
  "__tests__/integratedLaneSessionV1.test.ts",
  "caseDoc.ts",
  "caseValidation.ts",
  "contexts/AuthContext.tsx",
  "engine/__tests__/guytonStarlingWorkerCore.test.ts",
  "engine/__tests__/guytonStarlingWorkerQueue.test.ts",
  "engine/__tests__/instanceKnobs.test.ts",
  "engine/__tests__/knobs.test.ts",
  "engine/__tests__/verifyGuytonStarling.test.ts",
  "engine/guytonStarlingChainProtocol.ts",
  "engine/guytonStarlingChainWorker.ts",
  "engine/guytonStarlingChainWorkerCore.ts",
  "engine/guytonStarlingValidation.ts",
  "engine/guytonStarlingWorker.ts",
  "engine/guytonStarlingWorkerCore.ts",
  "engine/guytonStarlingWorkerQueue.ts",
  "engine/instanceKnobs.ts",
  "engine/knobs.ts",
  "engine/myocardium/MainWireIntegratedLaneBootstrapV1.ts",
  "engine/myocardium/MainWireIntegratedLaneObservableRegistryV1.ts",
  "engine/myocardium/MainWireIntegratedLaneSessionV1.ts",
  "engine/myocardium/activation/periodicActivationSchedulerV1.ts",
  "engine/myocardium/calcium/PrescribedCalciumTransientV1.ts",
  "engine/myocardium/calcium/index.ts",
  "engine/myocardium/calcium/protocols.ts",
  "engine/myocardium/contracts.ts",
  "engine/myocardium/mechanics/contracts.ts",
  "engine/myocardium/mechanics/identityForcePhase3BReport.ts",
  "engine/myocardium/mechanics/index.ts",
  "engine/myocardium/mechanics/passiveExponentialEnergyV1.ts",
  "engine/myocardium/mechanics/virtualPowerGeneralizedForceV1.ts",
  "engine/myocardium/mechanics/virtualPowerNominalEngineeringV1.ts",
  "engine/myocardium/myofilament/land2017/protocols.ts",
  "engine/myocardium/provenance.ts",
  "firebase-applet-config.json",
  "firebase-blueprint.json",
  "firebaseSetup.ts",
  "firestore.rules",
  "logs.txt",
  "mv_out.txt",
  "playwright.e2e.config.ts",
  "components/WorkbenchPreRegistrationPage.tsx",
  "rawParameterCatalog.ts",
  "readingConversion.ts",
  "test_blocknote.ts",
  "test_blocknote_esm.mjs",
  "tools/verifyGuytonStarling.ts",
  "studio/application/runtime/SimulationSessionCoordinatorV1.ts",
  "tools/myocardium/verifyContracts.ts",
  "vitest.archive.config.ts",
  "vitest.heavy.config.ts",
  "vitest.research.config.ts",
]);
const forbiddenPrefixes = [
  "migrated_prompt_history/",
  "tools/sweeps/",
  "data/mechanics2/",
  "data/myocardium/protocols/",
  "docs/mechanics2/",
  "engine/myocardium/homogenization/",
  "engine/myocardium/kinematics/",
  "engine/myocardium/protocols/",
  "engine/myocardium/state/",
  "engine/diagnostics/morphology/",
  "engine/mechanics2/",
  "studio/adapters/mainWire/",
  "studio/application/content/",
  "studio/contracts/v1/",
  "studio/infrastructure/artifacts/",
  "tools/mechanics2/",
];
const requiredTrackedPaths = [
  "components/WorkbenchV3Page.tsx",
  "components/workbench/WorkbenchDockview.tsx",
  "__tests__/workbenchV3Dockview.test.tsx",
  "engine/myocardium/MainWireIntegratedModelOutputRegistryV3.ts",
  "engine/myocardium/MainWireIntegratedModelRuntimeV3.ts",
  "engine/myocardium/MainWireIntegratedModelSessionV3.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelSnapshotAdmissionV3.ts",
  "engine/myocardium/experiments/MainWireIntegratedModelSnapshotQualificationV3.ts",
  "studio/application/authoring/StudioExperimentAuthoringApplicationV2.ts",
  "studio/application/authoring/StudioExperimentDataV2.ts",
  "studio/application/runtime/StudioFixtureReducerV2.ts",
  "studio/contracts/v2/index.ts",
  "studio/contracts/v2/simulation.ts",
  "studio/composition/StudioDefaultCompositionV2.ts",
  "studio/infrastructure/experiments/InMemoryExperimentRepositoryV2.ts",
  "studio/infrastructure/json/StudioCanonicalJson.ts",
  "studio/infrastructure/model/ExactModelExecutableValidationV1.ts",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.ts",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.artifact.mjs",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json",
  "studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1.ts",
  "studio/integrations/mainWireIntegratedV3/standard-registry-admission-lock.json",
  "studio/workers/StudioSimulationWorkerClientV2.ts",
  "studio/workers/StudioSimulationWorkerProtocolV2.ts",
  "studio/workers/StudioSimulationWorkerRuntimeV2.ts",
  "studio/workers/StudioSimulationWorkerV2.ts",
  "supabase/config.toml",
  ".firebaserc",
  "firebase.json",
  "supabase/migrations/20260809000100_active_model_bundle.sql",
  "tools/registry/verifyMainWireIntegratedStudioModelV3.ts",
];
const portableTextExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const machineLocalPathPatterns = [
  /\/Users\/[^/]+\//,
  /\/home\/[^/]+\//,
  /[A-Za-z]:\\Users\\[^\\]+\\/,
];

const failures = [];
const trackedPathSet = new Set(trackedPaths);
for (const requiredPath of requiredTrackedPaths) {
  if (!trackedPathSet.has(requiredPath)) {
    failures.push(
      `${requiredPath}: required Studio foundation source is not tracked`,
    );
  }
}

for (const trackedPath of trackedPaths) {
  const absolutePath = path.join(repositoryRoot, trackedPath);
  if (!existsSync(absolutePath)) continue;
  if (
    forbiddenExactPaths.has(trackedPath)
    || forbiddenPrefixes.some((prefix) => trackedPath.startsWith(prefix))
  ) {
    failures.push(
      `${trackedPath}: historical scratch output belongs in Git history, not the working tree`,
    );
  }
  if (portableTextExtensions.has(path.extname(trackedPath))) {
    const text = readFileSync(absolutePath, "utf8");
    if (machineLocalPathPatterns.some((pattern) => pattern.test(text))) {
      failures.push(
        `${trackedPath}: tracked portable content must not contain a machine-local absolute path`,
      );
    }
  }
}

const studioIndexPath = path.join(repositoryRoot, "docs/studio/README.md");
const studioIndex = readFileSync(studioIndexPath, "utf8");
for (const trackedPath of trackedPaths) {
  if (
    !existsSync(path.join(repositoryRoot, trackedPath))
    || !trackedPath.startsWith("docs/studio/")
    || !trackedPath.endsWith(".md")
    || trackedPath === "docs/studio/README.md"
  ) {
    continue;
  }
  const relativePath = trackedPath.slice("docs/studio/".length);
  if (!studioIndex.includes(`(${relativePath})`)) {
    failures.push(
      `${trackedPath}: every Studio document must be classified in docs/studio/README.md`,
    );
  }
}

if (failures.length > 0) {
  console.error("Repository hygiene check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Repository hygiene check passed (${trackedPaths.length} tracked paths).`,
  );
}
