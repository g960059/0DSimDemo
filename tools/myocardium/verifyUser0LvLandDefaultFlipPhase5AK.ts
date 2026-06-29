import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import resultArtifact from "@/data/myocardium/protocols/user0-lv-land-default-flip-phase5ak-result-v1.json";
import {
  USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_ID,
  USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH,
  buildUser0LvLandDefaultFlipPhase5AKEvidence,
  type User0LvLandDefaultFlipPhase5AKEvidence,
} from "@/tools/myocardium/buildUser0LvLandDefaultFlipPhase5AK";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
} from "@/engine/myocardium/runtimeActiveSource";

export type User0LvLandDefaultFlipPhase5AKValidationIssue = {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type User0LvLandDefaultFlipPhase5AKValidationReport = {
  readonly pass: boolean;
  readonly evidence: User0LvLandDefaultFlipPhase5AKEvidence;
  readonly errors: readonly User0LvLandDefaultFlipPhase5AKValidationIssue[];
  readonly warnings: readonly User0LvLandDefaultFlipPhase5AKValidationIssue[];
};

const VERIFIER_SCRIPT = "verify:myocardium-user0-lv-land-default-flip" as const;

const REQUIRED_RUNTIME_SNIPPETS = [
  ["engine/harness.ts", "runtimeActiveSourceMode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE"],
  ["engine/harness.ts", "createModelCoreRuntimeExperimentalOptions({"],
  ["engine/steadyJob.ts", "runtimeActiveSourceMode"],
  ["engine/steadyJob.ts", "createModelCoreRuntimeExperimentalOptions({ mode: runtimeActiveSourceMode })"],
  ["engine/previewController.ts", "createModelCoreRuntimeExperimentalOptions({"],
  ["engine/previewController.ts", "runtimeActiveSourceMode: this.runtimeActiveSourceMode()"],
  ["engine/previewController.ts", "runtimeActiveSourceMode,"],
  ["engine/previewWorker.ts", "createModelCoreRuntimeExperimentalOptions({"],
  ["engine/previewWorker.ts", "runtimeActiveSourceMode = message.runtimeActiveSourceMode"],
  ["engine/previewWorker.ts", "if (existing.settleSignature !== sig)"],
  ["engine/previewWorkerProtocol.ts", "runtimeActiveSourceMode: ModelCoreRuntimeActiveSourceMode"],
  ["engine/transitionSteadyWorker.ts", "createModelCoreRuntimeExperimentalOptions({"],
  ["engine/guytonStarlingWorkerCore.ts", "createModelCoreRuntimeExperimentalOptions({"],
  ["engine/guytonStarlingWorkerCore.ts", "mode: req.runtimeActiveSourceMode"],
  ["engine/guytonStarling.ts", "runtimeActiveSourceMode?: ModelCoreRuntimeActiveSourceMode"],
  ["engine/guytonStarlingChainProtocol.ts", "runtimeActiveSourceMode?: ModelCoreRuntimeActiveSourceMode"],
  ["components/Charts.tsx", "setRuntimeActiveSourceMode(getModelCoreRuntimeActiveSourceModeForThisProcess())"],
  ["components/Charts.tsx", "[visibleInstances, side, runtimeActiveSourceMode]"],
  ["components/Charts.tsx", "runtimeActiveSourceMode: input.runtimeActiveSourceMode"],
  ["engine/transitionSteadyProtocol.ts", "experimentalActiveProviderStates?"],
  ["engine/previewWorkerProtocol.ts", "experimentalActiveProviderStates?"],
] as const;

export function validateUser0LvLandDefaultFlipPhase5AK(
  rootDir = process.cwd(),
): User0LvLandDefaultFlipPhase5AKValidationReport {
  const errors: User0LvLandDefaultFlipPhase5AKValidationIssue[] = [];
  const warnings: User0LvLandDefaultFlipPhase5AKValidationIssue[] = [];
  const evidence = resultArtifact as unknown as User0LvLandDefaultFlipPhase5AKEvidence;

  validateFreshEvidence(evidence, errors);
  validateIdentity(evidence, errors);
  validateSummary(evidence, errors);
  validateSmokeMatrix(evidence, errors);
  validateBoundary(evidence, errors);
  validateRuntimeWiring(rootDir, errors);

  warnings.push({
    severity: "warning",
    code: "phase5ak_bounded_default_only",
    path: USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH,
    message: "Phase 5AK flips the user-0 staged LV runtime default only; all-chamber Land replacement remains a future lane.",
  });

  return { pass: errors.length === 0, evidence, errors, warnings };
}

function validateFreshEvidence(
  artifact: User0LvLandDefaultFlipPhase5AKEvidence,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  const fresh = buildUser0LvLandDefaultFlipPhase5AKEvidence();
  if (JSON.stringify(fresh) !== JSON.stringify(artifact)) {
    addIssue(errors, "phase5ak_stale_artifact", USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH, "Phase 5AK artifact must match a fresh builder run.");
  }
}

function validateIdentity(
  evidence: User0LvLandDefaultFlipPhase5AKEvidence,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  const { normalizedSha256, ...withoutHash } = evidence;
  if (
    evidence.schemaVersion !== 1
    || evidence.id !== USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_ID
    || evidence.phase !== "Phase 5AK"
    || evidence.claimBoundary !== "user0-staged-lv-land-runtime-default-implemented"
    || evidence.verifierScript !== VERIFIER_SCRIPT
    || evidence.ownerDecision.acceptedOption !== "GO"
    || evidence.implementation.runtimeDefaultMode !== MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE
    || evidence.implementation.rollbackMode !== MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE
    || evidence.implementation.sourceProviderId !== MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID
    || evidence.implementation.runtimeContractilityControl !== "existing-tmax-contractility-knob-multiplies-land-calcium-input-normalized-to-default"
    || evidence.implementation.regressionHarnessDefaultMode !== MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE
    || evidence.implementation.regressionHarnessLandMode !== "explicit-runtimeActiveSourceMode-only"
    || normalizedSha256 !== hashStable(withoutHash)
  ) {
    addIssue(errors, "phase5ak_identity", USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH, "Phase 5AK identity, owner GO, runtime modes, or normalized hash is invalid.");
  }
}

function validateSummary(
  evidence: User0LvLandDefaultFlipPhase5AKEvidence,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  const summary = evidence.summary;
  if (
    summary.defaultSmokeCount !== 4
    || summary.rollbackSmokeCount !== 4
    || summary.defaultProviderCallPoints !== 4
    || summary.defaultLandSolveFailureCount !== 0
    || summary.rollbackProviderFreeCount !== 4
    || summary.defaultHealthOkCount < 4
    || summary.rollbackHealthNonFailedCount < 4
  ) {
    addIssue(errors, "phase5ak_summary", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.summary`, "Phase 5AK summary must show all default smoke points health ok, all rollback smoke points provider-free/non-failed, and zero Land solve failures.");
  }
}

function validateSmokeMatrix(
  evidence: User0LvLandDefaultFlipPhase5AKEvidence,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  if (evidence.smokeMatrix.length !== 8) {
    addIssue(errors, "phase5ak_smoke_count", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix`, "Phase 5AK must record four default and four rollback smoke runs.");
    return;
  }
  for (const run of evidence.smokeMatrix) {
    if (run.mode === MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE) {
      if (run.health.status !== "ok") {
        addIssue(errors, "phase5ak_default_smoke_health", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix.${run.pointId}`, "Every default LV Land smoke run must remain health ok.");
      }
      if (
        run.providerIds.LV !== MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID
        || run.providerStateSidecar.sourceProviderId !== MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID
        || (run.landInstrumentation?.sourceActiveStressPa ?? 0) <= 0
        || (run.landInstrumentation?.commitProviderStateAfterStep ?? 0) <= 0
        || run.landInstrumentation?.landSolveFailureCount !== 0
        || run.landInstrumentation.sourcePathFiniteHealthAllSamples !== true
        || run.landInstrumentation.commitPathFiniteHealthAllSamples !== true
      ) {
        addIssue(errors, "phase5ak_default_land_reachability", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix.${run.pointId}`, "Default smoke runs must reach LV Land provider state, source calls, commit calls, and zero failures.");
      }
    } else if (run.mode === MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE) {
      if (run.health.status === "failed") {
        addIssue(errors, "phase5ak_rollback_smoke_health", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix.${run.pointId}`, "Rollback smoke runs may retain legacy warnings but must not fail.");
      }
      if (Object.keys(run.providerIds).length !== 0 || run.landInstrumentation !== null || run.providerStateSidecar.hasLV) {
        addIssue(errors, "phase5ak_rollback_legacy_reachability", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix.${run.pointId}`, "Rollback smoke runs must stay provider-free legacy active-stress.");
      }
    } else {
      addIssue(errors, "phase5ak_unknown_mode", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.smokeMatrix.${run.pointId}`, "Smoke run records an unknown runtime active-source mode.");
    }
  }
}

function validateBoundary(
  evidence: User0LvLandDefaultFlipPhase5AKEvidence,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  if (!Object.values(evidence.boundary).every((value) => value === true)) {
    addIssue(errors, "phase5ak_boundary", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.boundary`, "Every Phase 5AK boundary guard must remain true.");
  }
  for (const blocked of [
    "legacyActiveStressDeletion",
    "rootZcAdoption",
    "atrialFigureEightGate",
    "officialCaseTuning",
    "boundaryRootInertanceDefault",
    "qDotClampRemoval",
    "allChamberLandReplacement",
  ]) {
    if (!evidence.doesNotUnlock.includes(blocked)) {
      addIssue(errors, "phase5ak_does_not_unlock", `${USER0_LV_LAND_DEFAULT_FLIP_PHASE5AK_RESULT_PATH}.doesNotUnlock`, `Phase 5AK must not unlock ${blocked}.`);
    }
  }
}

function validateRuntimeWiring(
  rootDir: string,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): void {
  for (const [relativePath, snippet] of REQUIRED_RUNTIME_SNIPPETS) {
    const text = readText(rootDir, relativePath, errors);
    if (text && !text.includes(snippet)) {
      addIssue(errors, "phase5ak_runtime_wiring", relativePath, `Expected runtime wiring snippet not found: ${snippet}`);
    }
  }
  const runtimeText = readText(rootDir, "engine/myocardium/runtimeActiveSource.ts", errors);
  if (
    runtimeText
    && (
      !runtimeText.includes("MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE")
      || !runtimeText.includes("useLegacyActiveStressForModelCoreRuntimeForThisProcess")
      || !runtimeText.includes("legacy-active-stress-frozen-reference-rollback-v0")
      || !runtimeText.includes("runtimeUserControlMultiplier")
      || !runtimeText.includes("runtimeUserControlReference")
      || !runtimeText.includes("noTuningInRuntimeDefault")
    )
  ) {
    addIssue(errors, "phase5ak_runtime_helper", "engine/myocardium/runtimeActiveSource.ts", "Runtime helper must expose LV Land default, one-call legacy rollback, and no-tuning metadata.");
  }
  const wrapperText = readText(rootDir, "tools/myocardium/modelCoreLand2017LvSourceProvider.ts", errors);
  if (wrapperText && !wrapperText.includes("export * from \"@/engine/myocardium/modelCoreLand2017LvSourceProvider\"")) {
    addIssue(errors, "phase5ak_provider_wrapper", "tools/myocardium/modelCoreLand2017LvSourceProvider.ts", "Tools provider path must remain a compatibility wrapper after moving provider into engine.");
  }
}

function readText(
  rootDir: string,
  relativePath: string,
  errors: User0LvLandDefaultFlipPhase5AKValidationIssue[],
): string | null {
  try {
    return readFileSync(path.join(rootDir, relativePath), "utf8");
  } catch (err) {
    addIssue(errors, "phase5ak_missing_file", relativePath, err instanceof Error ? err.message : String(err));
    return null;
  }
}

function addIssue(
  issues: User0LvLandDefaultFlipPhase5AKValidationIssue[],
  code: string,
  issuePath: string,
  message: string,
): void {
  issues.push({ severity: "error", code, path: issuePath, message });
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortJson(item)]),
  );
}

function main() {
  const report = validateUser0LvLandDefaultFlipPhase5AK(process.cwd());
  console.log(
    `User0 LV Land default-flip Phase 5AK ${report.pass ? "PASS" : "FAIL"} `
    + `(errors=${report.errors.length}, warnings=${report.warnings.length})`,
  );
  for (const issue of [...report.errors, ...report.warnings]) {
    console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);
  }
  if (!report.pass) process.exitCode = 1;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) main();
