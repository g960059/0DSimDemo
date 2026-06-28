import path from "node:path";
import { pathToFileURL } from "node:url";
import phase5TArtifact from "@/data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json";
import { ModelCore } from "@/engine/ModelCore";
import {
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID,
  createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions,
} from "@/tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_RFC_ID =
  "myocardium-developer-only-lv-land-runtime-flag-rfc-v1";

type RuntimeFlagSmoke = {
  readonly modelCoreConstructsWithFlag: boolean;
  readonly debugProviderIdMatches: boolean;
  readonly debugProviderIds: Partial<Record<"LV" | "RV" | "LA" | "RA", string>>;
  readonly providerStateDiagnosticsAvailable: boolean;
};

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc = {
  readonly schemaVersion: 1;
  readonly id: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_RFC_ID;
  readonly phase: "Phase 5U";
  readonly claimBoundary: "developer-only-runtime-flag-rfc-no-runtime-wiring";
  readonly upstreamPhase5TArtifactId: typeof phase5TArtifact.id;
  readonly verifierScript: "verify:myocardium-developer-only-lv-land-runtime-flag-rfc";
  readonly ownerDecision: {
    readonly status: "rfc-draft-owner-decision-needed";
    readonly accepted: false;
    readonly decisionQuestion:
      "Authorize implementation of a developer-only LV Land runtime flag behind explicit non-production controls?";
  };
  readonly runtimeFlagContract: {
    readonly flagId: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID;
    readonly helperModule: "tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag.ts";
    readonly acknowledgementRequired: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT;
    readonly sourceProviderScope: "LV-only";
    readonly sourceProviderId: string;
    readonly commitScheme: "BE";
    readonly calciumMappingSource: {
      readonly artifactId: string;
      readonly scenarioId: "phase2b-absolute-peak-ca";
      readonly calciumScale: number;
      readonly fixedFromPhase5Q: true;
      readonly noTuningInHelper: true;
    };
    readonly modelCoreInterface: {
      readonly usesExperimentalActiveSourceProviders: true;
      readonly noModelCoreConstructorSignatureChange: true;
      readonly noProductionRegistryIntegration: true;
    };
  };
  readonly implementationStatus: {
    readonly helperDefined: true;
    readonly productionRuntimeWiring: "absent";
    readonly officialCaseWiring: "absent";
    readonly workbenchRuntimeWiring: "absent";
    readonly stateSchemaMigration: "absent";
    readonly runtimeFlagUi: "absent";
  };
  readonly smoke: RuntimeFlagSmoke;
  readonly boundary: {
    readonly noRuntimeReplacement: true;
    readonly noOfficialCaseReauthoring: true;
    readonly noWorkbenchRuntimeWiring: true;
    readonly noStateSchemaMigration: true;
    readonly noModelCoreGlobalIntegratorChange: true;
    readonly noLevel3Acceptance: true;
    readonly noLevel4Acceptance: true;
    readonly noOfficialMorphologyAcceptance: true;
    readonly noFinalNoAlternansAcceptance: true;
    readonly noStructuralAlternansRemovalClaim: true;
  };
  readonly nextAllowedWork: readonly string[];
  readonly blockedUntilOwnerDecision: readonly string[];
  readonly doesNotUnlock: readonly string[];
};

export function buildDeveloperOnlyLvLandRuntimeFlagRfc(): MyocardiumDeveloperOnlyLvLandRuntimeFlagRfc {
  const flagOptions = createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions({
    acknowledgement: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
  });
  const smoke = buildSmoke(flagOptions.sourceProviderId, flagOptions.experimentalOptions);

  return {
    schemaVersion: 1,
    id: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_RFC_ID,
    phase: "Phase 5U",
    claimBoundary: "developer-only-runtime-flag-rfc-no-runtime-wiring",
    upstreamPhase5TArtifactId: phase5TArtifact.id,
    verifierScript: "verify:myocardium-developer-only-lv-land-runtime-flag-rfc",
    ownerDecision: {
      status: "rfc-draft-owner-decision-needed",
      accepted: false,
      decisionQuestion:
        "Authorize implementation of a developer-only LV Land runtime flag behind explicit non-production controls?",
    },
    runtimeFlagContract: {
      flagId: flagOptions.flagId,
      helperModule: "tools/myocardium/modelCoreDeveloperOnlyLandRuntimeFlag.ts",
      acknowledgementRequired: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT,
      sourceProviderScope: flagOptions.sourceProviderScope,
      sourceProviderId: flagOptions.sourceProviderId,
      commitScheme: flagOptions.commitScheme,
      calciumMappingSource: {
        artifactId: flagOptions.calciumMapping.sourceArtifactId,
        scenarioId: flagOptions.calciumMapping.scenarioId,
        calciumScale: flagOptions.calciumMapping.calciumScale,
        fixedFromPhase5Q: true,
        noTuningInHelper: flagOptions.calciumMapping.noTuningInHelper,
      },
      modelCoreInterface: {
        usesExperimentalActiveSourceProviders: true,
        noModelCoreConstructorSignatureChange: true,
        noProductionRegistryIntegration: true,
      },
    },
    implementationStatus: {
      helperDefined: true,
      productionRuntimeWiring: "absent",
      officialCaseWiring: "absent",
      workbenchRuntimeWiring: "absent",
      stateSchemaMigration: "absent",
      runtimeFlagUi: "absent",
    },
    smoke,
    boundary: {
      noRuntimeReplacement: true,
      noOfficialCaseReauthoring: true,
      noWorkbenchRuntimeWiring: true,
      noStateSchemaMigration: true,
      noModelCoreGlobalIntegratorChange: true,
      noLevel3Acceptance: true,
      noLevel4Acceptance: true,
      noOfficialMorphologyAcceptance: true,
      noFinalNoAlternansAcceptance: true,
      noStructuralAlternansRemovalClaim: true,
    },
    nextAllowedWork: [
      "owner GO/NO-GO on developer-only LV Land runtime flag implementation",
      "if GO, implement a non-production developer flag that remains inaccessible to official cases and Workbench",
      "if GO, keep morphology and low-preload alternans evidence report-only until separate acceptance gates",
    ],
    blockedUntilOwnerDecision: [
      "production runtime replacement",
      "official case reauthoring against Land",
      "Workbench runtime wiring",
      "runtime flag UI",
      "state schema migration",
    ],
    doesNotUnlock: [
      "runtimeReplacement",
      "officialCaseWiring",
      "workbenchRuntimeWiring",
      "stateSchemaMigration",
      "officialMorphologyAcceptance",
      "finalNoAlternans",
      "structuralAlternansRemoval",
      "Level3Acceptance",
      "Level4Acceptance",
      "clinicalDecisionSupport",
      "scientificValidationClaim",
    ],
  };
}

function buildSmoke(
  sourceProviderId: string,
  experimentalOptions: ConstructorParameters<typeof ModelCore>[1],
): RuntimeFlagSmoke {
  const core = new ModelCore(undefined, experimentalOptions);
  const debugProviderIds = core.debugExperimentalActiveSourceProviderIds();
  return {
    modelCoreConstructsWithFlag: true,
    debugProviderIdMatches: debugProviderIds.LV === sourceProviderId,
    debugProviderIds,
    providerStateDiagnosticsAvailable:
      typeof core.debugExperimentalActiveSourceProviderStates === "function",
  };
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  if (entrypoint && import.meta.url === pathToFileURL(path.resolve(entrypoint)).href) return true;
  const normalizedScriptPath =
    path.normalize("tools/myocardium/buildDeveloperOnlyLvLandRuntimeFlagRfc.ts");
  return process.argv.some((arg) => path.normalize(arg).endsWith(normalizedScriptPath));
}

if (isDirectExecution()) {
  console.log(JSON.stringify(buildDeveloperOnlyLvLandRuntimeFlagRfc(), null, 2));
}
