import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  resolveModelCoreRuntimeActiveSource,
  useLegacyActiveStressForModelCoreRuntimeForThisProcess,
  useLvLandDefaultForModelCoreRuntimeForThisProcess,
} from "@/engine/myocardium/runtimeActiveSource";

describe("ModelCore runtime active source default", () => {
  afterEach(() => {
    useLvLandDefaultForModelCoreRuntimeForThisProcess();
  });

  it("resolves LV Land as the user-0 staged runtime default", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE);
    expect(resolved.claimBoundary).toBe("user0-staged-lv-land-default-no-clinical-validation");
    expect(resolved.sourceProviderScope).toBe("LV-only");
    expect(resolved.sourceProviderId).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.calciumMapping.noTuningInRuntimeDefault).toBe(true);
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV).toBeUndefined();
  });

  it("keeps one-call legacy active-stress rollback reachable", () => {
    useLegacyActiveStressForModelCoreRuntimeForThisProcess();
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE);
    expect(resolved.claimBoundary).toBe("legacy-active-stress-frozen-reference-rollback");
    expect(resolved.experimentalOptions.activeSourceProviders).toBeUndefined();
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({});
  });

  it("runs the default LV Land provider without solver failures", () => {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({ instrumentation });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(core.debugExperimentalActiveSourceProviderIds().LV).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(instrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(instrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(instrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(instrumentation.landSolveFailureCount).toBe(0);
  });

  it("keeps the regression harness on legacy by default but supports explicit LV Land", () => {
    const legacy = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
    });
    const land = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
    });

    expect(legacy.core.debugExperimentalActiveSourceProviderIds()).toEqual({});
    expect(land.core.debugExperimentalActiveSourceProviderIds().LV).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
  });

  it("restores Land provider state through the runtime sidecar without changing SerializedModelState", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.01, 0.001, 120);
    const serialized = core.packState();
    const sidecar = core.packExperimentalActiveProviderRuntimeState();
    const beforeVersion = sidecar.LV?.version ?? 0;

    const restored = new ModelCore(DEFAULT_PARAMS, resolveModelCoreRuntimeActiveSource().experimentalOptions);
    restored.unpackState(serialized);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(0);

    restored.restoreExperimentalActiveProviderRuntimeState(sidecar);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(beforeVersion);
    expect(restored.packState()).toEqual(serialized);
  });
});
