import phase5QArtifact from "@/data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json";
import type {
  ModelCoreExperimentalOptions,
} from "@/engine/ModelCore";
import {
  calciumScaledLand2017LvSourceOnlyProvider,
  createModelCoreLand2017LvSourceProviderInstrumentation,
  type ModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/tools/myocardium/modelCoreLand2017LvSourceProvider";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID =
  "developer-only-lv-land-runtime-flag-rfc-v1";

export const MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT =
  "developer-only-no-production-case-workbench-runtime" as const;

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagAcknowledgement =
  typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT;

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagFactoryInput = {
  readonly acknowledgement: MyocardiumDeveloperOnlyLvLandRuntimeFlagAcknowledgement;
  readonly instrumentation?: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export type MyocardiumDeveloperOnlyLvLandRuntimeFlagOptions = {
  readonly flagId: typeof MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID;
  readonly claimBoundary: "developer-only-rfc-helper-not-production-runtime";
  readonly sourceProviderScope: "LV-only";
  readonly sourceProviderId: string;
  readonly commitScheme: "BE";
  readonly calciumMapping: {
    readonly sourceArtifactId: typeof phase5QArtifact.id;
    readonly scenarioId: "phase2b-absolute-peak-ca";
    readonly calciumScale: number;
    readonly noTuningInHelper: true;
  };
  readonly experimentalOptions: ModelCoreExperimentalOptions;
  readonly instrumentation: ModelCoreLand2017LvSourceProviderInstrumentation;
};

export function createMyocardiumDeveloperOnlyLvLandRuntimeFlagOptions(
  input: MyocardiumDeveloperOnlyLvLandRuntimeFlagFactoryInput,
): MyocardiumDeveloperOnlyLvLandRuntimeFlagOptions {
  if (input.acknowledgement !== MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ACKNOWLEDGEMENT) {
    throw new Error("Developer-only LV Land runtime flag requires explicit non-production acknowledgement.");
  }
  const instrumentation = input.instrumentation ?? createModelCoreLand2017LvSourceProviderInstrumentation();
  const sourceProviderId =
    "modelcore-experimental-land2017-lv-source-only-provider-v1:phase5u-developer-only-be-phase5q-calcium";
  const provider = calciumScaledLand2017LvSourceOnlyProvider(instrumentation, {
    commitScheme: "BE",
    sourceProviderId,
    calciumScale: phase5QArtifact.calibration.phase2bAbsolutePeakScale,
  });
  return {
    flagId: MYOCARDIUM_DEVELOPER_ONLY_LV_LAND_RUNTIME_FLAG_ID,
    claimBoundary: "developer-only-rfc-helper-not-production-runtime",
    sourceProviderScope: "LV-only",
    sourceProviderId,
    commitScheme: "BE",
    calciumMapping: {
      sourceArtifactId: phase5QArtifact.id,
      scenarioId: "phase2b-absolute-peak-ca",
      calciumScale: phase5QArtifact.calibration.phase2bAbsolutePeakScale,
      noTuningInHelper: true,
    },
    experimentalOptions: { activeSourceProviders: { LV: provider } },
    instrumentation,
  };
}
