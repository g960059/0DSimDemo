import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";
import { runVerification } from "@/engine/verification/report";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES,
  LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS,
  landAtrialRuntimeNodeOverrides,
} from "@/engine/myocardium/landAtrialRuntime";
import {
  LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID,
  LANDATRIAL_RUNTIME_CONTRACT_V1,
} from "@/engine/myocardium/landAtrialRuntimeContract";
import { runLandAtrialIsolatedBench } from "@/engine/myocardium/atrialIsolatedBench";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
  MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE,
  MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE,
  MODELCORE_RUNTIME_LV_LAND_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE,
  MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
  resolveModelCoreRuntimeActiveSource,
  useAllChamberLandAtrialForModelCoreRuntimeForThisProcess,
  useAllChamberLandForModelCoreRuntimeForThisProcess,
  useBaselineActiveStressForModelCoreRuntimeForThisProcess,
  useLvLandForModelCoreRuntimeForThisProcess,
  useLvRvLandSourcedRootForModelCoreRuntimeForThisProcess,
  useLvRvLandBaseRootForModelCoreRuntimeForThisProcess,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
  resolveModelCoreRuntimeRootZc,
} from "@/engine/myocardium/runtimeRootZc";

describe("ModelCore runtime active source default", () => {
  afterEach(() => {
    useAllChamberLandAtrialForModelCoreRuntimeForThisProcess();
  });

  it("resolves the current four-chamber LandAtrial runtime", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE);
    expect(LANDATRIAL_RUNTIME_CONTRACT_V1.runtimeActiveSourceMode)
      .toBe(MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE);
    expect(LANDATRIAL_RUNTIME_CONTRACT_V1.selectedConfigurationId)
      .toBe(LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID);
    expect(resolved.sourceProviderScope).toBe("LV+RV+LA+RA");
    expect(resolved.sourceProviderId).toBeNull();
    expect(resolved.calciumMapping.noTuningInRuntimeDefault).toBe(true);
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.LA?.sourceProviderId)
      .toBe(LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.LA);
    expect(resolved.experimentalOptions.activeSourceProviders?.RA?.sourceProviderId)
      .toBe(LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.RA);
    expect(resolved.experimentalOptions.runtimeParameterPatch?.nodeOverrides)
      .toEqual(landAtrialRuntimeNodeOverrides());
    expect(LANDATRIAL_RUNTIME_CONTRACT_V1.sourceProviderIds).toEqual(resolved.sourceProviderIds);
    expect(LANDATRIAL_RUNTIME_CONTRACT_V1.atrialActiveOverrides)
      .toEqual(LANDATRIAL_RUNTIME_ACTIVE_OVERRIDES);
    expect(resolved.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(resolved.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
  });

  it("keeps the baseline active-stress reference reachable", () => {
    useBaselineActiveStressForModelCoreRuntimeForThisProcess();
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE);
    expect(resolved.experimentalOptions.activeSourceProviders).toBeUndefined();
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({});
  });

  it("runs the default all-chamber LandAtrial providers without solver failures", () => {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const laInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const raInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({
      instrumentation,
      rvInstrumentation,
      laInstrumentation,
      raInstrumentation,
    });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(core.debugExperimentalActiveSourceProviderIds().LV).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(core.debugExperimentalActiveSourceProviderIds().RV).toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
    expect(core.debugExperimentalActiveSourceProviderIds().LA)
      .toBe(LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.LA);
    expect(core.debugExperimentalActiveSourceProviderIds().RA)
      .toBe(LANDATRIAL_RUNTIME_SOURCE_PROVIDER_IDS.RA);
    expect(instrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(rvInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(laInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(raInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(instrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(rvInstrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(laInstrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(raInstrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(instrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(rvInstrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(laInstrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(raInstrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(instrumentation.landSolveFailureCount).toBe(0);
    expect(rvInstrumentation.landSolveFailureCount).toBe(0);
    expect(laInstrumentation.landSolveFailureCount).toBe(0);
    expect(raInstrumentation.landSolveFailureCount).toBe(0);
  });

  it("runs the isolated LandAtrial floor bench without provider solve failures", () => {
    const bench = runLandAtrialIsolatedBench();

    expect(bench.summaries).toHaveLength(4);
    expect(bench.protocol.noClosedLoopValveRootPreloadCoupling).toBe(true);
    for (const summary of bench.summaries) {
      expect(summary.sourceCandidateId).toBe(LANDATRIAL_RUNTIME_SELECTED_CONFIGURATION_ID);
      expect(summary.sampleCount).toBeGreaterThan(0);
      expect(summary.landSolveFailureCount).toBe(0);
      expect(summary.pressureMmHg.min).not.toBeNull();
      expect(summary.wallLambda.min).not.toBeNull();
    }
    expect(bench.avPlaneSensitivity.LA.maxEffectiveVolumeCorrectionMl).toBeGreaterThan(0);
    expect(bench.avPlaneSensitivity.RA.maxEffectiveVolumeCorrectionMl).toBeGreaterThan(0);
  });

  it("applies the LandAtrial runtime geometry patch while preserving caller node overrides", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore({
      ...DEFAULT_PARAMS,
      nodeOverrides: {
        LA: { active: { avPlaneGainMl: 30 } },
      },
    }, resolved.experimentalOptions);

    expect((core.p.nodeOverrides?.LA?.active as Record<string, number>)?.avPlaneGainMl).toBe(30);
    expect((core.p.nodeOverrides?.RA?.active as Record<string, number>)?.avPlaneGainMl)
      .toBe((landAtrialRuntimeNodeOverrides().RA.active as Record<string, number>).avPlaneGainMl);
  });

  it("preserves the LandAtrial runtime geometry patch across live immediate parameter updates", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);
    const runtimeOverrides = landAtrialRuntimeNodeOverrides();

    core.setImmediateParameters({ HR: 82 });
    expect((core.p.nodeOverrides?.LA?.active as Record<string, number>)?.avPlaneGainMl)
      .toBe((runtimeOverrides.LA.active as Record<string, number>).avPlaneGainMl);
    expect((core.p.nodeOverrides?.RA?.active as Record<string, number>)?.avPlaneGainMl)
      .toBe((runtimeOverrides.RA.active as Record<string, number>).avPlaneGainMl);

    core.setImmediateParameters({
      ...DEFAULT_PARAMS,
      nodeOverrides: {
        LA: { active: { avPlaneGainMl: 31 } },
      },
    });
    expect((core.p.nodeOverrides?.LA?.active as Record<string, number>)?.avPlaneGainMl).toBe(31);
    expect((core.p.nodeOverrides?.RA?.active as Record<string, number>)?.avPlaneGainMl)
      .toBe((runtimeOverrides.RA.active as Record<string, number>).avPlaneGainMl);
  });

  it("keeps LandAtrial atrial activation tied to AV lead timing", () => {
    const shortDelay = runVerification({
      ...DEFAULT_PARAMS,
      avDelaySec: 0.08,
    }, {
      profile: "fitFast",
      gateSet: "validityOnly",
      runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
    });
    const longDelay = runVerification({
      ...DEFAULT_PARAMS,
      avDelaySec: 0.20,
    }, {
      profile: "fitFast",
      gateSet: "validityOnly",
      runtimeActiveSourceMode: MODELCORE_RUNTIME_ALL_CHAMBER_LANDATRIAL_MODE,
    });

    expect(shortDelay.measurement).not.toBeNull();
    expect(longDelay.measurement).not.toBeNull();
    const laShortMs = shortDelay.measurement!.phaseTiming.msFromVentricularPhaseZero.activeAPeak.LA;
    const laLongMs = longDelay.measurement!.phaseTiming.msFromVentricularPhaseZero.activeAPeak.LA;
    const raShortMs = shortDelay.measurement!.phaseTiming.msFromVentricularPhaseZero.activeAPeak.RA;
    const raLongMs = longDelay.measurement!.phaseTiming.msFromVentricularPhaseZero.activeAPeak.RA;

    expect(laShortMs).not.toBeNull();
    expect(laLongMs).not.toBeNull();
    expect(raShortMs).not.toBeNull();
    expect(raLongMs).not.toBeNull();
    expect(laShortMs! - laLongMs!).toBeGreaterThan(80);
    expect(raShortMs! - raLongMs!).toBeGreaterThan(80);
  });

  it("keeps the LV-only Land runtime variant reachable", () => {
    useLvLandForModelCoreRuntimeForThisProcess();
    const resolved = resolveModelCoreRuntimeActiveSource();

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_LAND_MODE);
    expect(resolved.sourceProviderScope).toBe("LV-only");
    expect(resolved.sourceProviderId).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV).toBeUndefined();
  });

  it("keeps LV+RV Land with the base root configuration reachable", () => {
    useLvRvLandBaseRootForModelCoreRuntimeForThisProcess();
    const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({
      instrumentation: lvInstrumentation,
      rvInstrumentation,
    });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_RV_LAND_BASE_ROOT_MODE);
    expect(resolved.sourceProviderScope).toBe("LV+RV-base-root");
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({
      LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
      RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
    });
    expect(lvInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(rvInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(lvInstrumentation.landSolveFailureCount).toBe(0);
    expect(rvInstrumentation.landSolveFailureCount).toBe(0);
    const sidecar = core.packExperimentalActiveProviderRuntimeState();
    expect(sidecar.LV?.sourceProviderId).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(sidecar.RV?.sourceProviderId).toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
  });

  it("keeps the four-chamber Land runtime variant reachable", () => {
    useAllChamberLandForModelCoreRuntimeForThisProcess();
    const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const laInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const raInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({
      instrumentation: lvInstrumentation,
      rvInstrumentation,
      laInstrumentation,
      raInstrumentation,
    });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_ALL_CHAMBER_LAND_MODE);
    expect(resolved.sourceProviderScope).toBe("LV+RV+LA+RA-land");
    expect(resolved.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({
      LV: MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
      RV: MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
      LA: MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
      RA: MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
    });
    for (const instrumentation of [
      lvInstrumentation,
      rvInstrumentation,
      laInstrumentation,
      raInstrumentation,
    ]) {
      expect(instrumentation.sourceActiveStressPa).toBeGreaterThan(0);
      expect(instrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
      expect(instrumentation.landSolveOkCount).toBeGreaterThan(0);
      expect(instrumentation.landSolveFailureCount).toBe(0);
    }
  });

  it("keeps the regression harness on its baseline while supporting explicit Land", () => {
    const baseline = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
    });
    const land = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
    });

    expect(baseline.core.debugExperimentalActiveSourceProviderIds()).toEqual({});
    expect(land.core.debugExperimentalActiveSourceProviderIds().LV).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(land.core.debugExperimentalActiveSourceProviderIds().RV).toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
  });

  it("restores Land provider state through the runtime sidecar without changing SerializedModelState", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);
    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.01, 0.001, 120);
    const serialized = core.packState();
    const sidecar = core.packExperimentalActiveProviderRuntimeState();
    const beforeVersion = sidecar.LV?.version ?? 0;
    const beforeRvVersion = sidecar.RV?.version ?? 0;
    const beforeLaVersion = sidecar.LA?.version ?? 0;
    const beforeRaVersion = sidecar.RA?.version ?? 0;

    const restored = new ModelCore(DEFAULT_PARAMS, resolveModelCoreRuntimeActiveSource().experimentalOptions);
    restored.unpackState(serialized);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(0);
    expect(restored.debugExperimentalActiveSourceProviderStates().RV?.stateVersion).toBe(0);
    expect(restored.debugExperimentalActiveSourceProviderStates().LA?.stateVersion).toBe(0);
    expect(restored.debugExperimentalActiveSourceProviderStates().RA?.stateVersion).toBe(0);

    restored.restoreExperimentalActiveProviderRuntimeState(sidecar);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(beforeVersion);
    expect(restored.debugExperimentalActiveSourceProviderStates().RV?.stateVersion).toBe(beforeRvVersion);
    expect(restored.debugExperimentalActiveSourceProviderStates().LA?.stateVersion).toBe(beforeLaVersion);
    expect(restored.debugExperimentalActiveSourceProviderStates().RA?.stateVersion).toBe(beforeRaVersion);
    expect(restored.packState()).toEqual(serialized);
  });

  it("uses sourced root/Zc for the sourced-root mode while keeping the base mode explicit", () => {
    const currentRootZc = resolveModelCoreRuntimeRootZc();
    const sourcedRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
    });
    const explicitCurrentRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    });
    const explicitSourcedRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      rootZcBaseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });

    expect(currentRootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE);
    expect(currentRootZc.experimentalOptions.boundaryRootInertance).toBeUndefined();
    expect(sourcedRuntime.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(sourcedRuntime.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    expect(explicitCurrentRuntime.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE);
    expect(explicitCurrentRuntime.experimentalOptions.boundaryRootInertance).toBeUndefined();
    expect(explicitSourcedRuntime.experimentalOptions.activeSourceProviders?.LV).toBeDefined();
    expect(explicitSourcedRuntime.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    expect(explicitSourcedRuntime.rootZc.mode)
      .toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
  });

  it("requires explicit base AoV inertance for sourced root/Zc", () => {
    expect(() =>
      resolveModelCoreRuntimeRootZc({
        mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      })
    ).toThrow("requires explicit base AoV inertance");
    expect(() =>
      resolveModelCoreRuntimeRootZc({
        baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      })
    ).toThrow("only valid for sourced boundary/root modes");
  });

  it("uses the executed closure AoV inertance when adopting runtime root/Zc", () => {
    const customAoVL = DEFAULT_PARAMS.AoV_L * 3;
    const resolved = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
      runtimeParams: { AoV_L: customAoVL },
    });

    expect(resolved.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(resolved.rootZc.additionalAorticRootInertanceMmHgSec2PerMl).toBe(customAoVL);
    expect(resolved.experimentalOptions.boundaryRootInertance).toMatchObject({
      additionalAorticRootInertanceMmHgSec2PerMl: customAoVL,
    });
  });

  it("passes the executed closure AoV inertance through the regression harness explicit runtime path", () => {
    const customAoVL = DEFAULT_PARAMS.AoV_L * 2.5;
    const result = runScenario(
      { ...DEFAULT_PARAMS, AoV_L: customAoVL },
      {
        settleSeconds: 0.01,
        measureSeconds: 0.01,
        runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_SOURCED_ROOT_MODE,
      },
    );

    expect(result.core.debugExperimentalBoundaryRootInertance()).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      targetValve: "AoV",
      baseAoVInertanceMmHgSec2PerMl: customAoVL,
      additionalAorticRootInertanceMmHgSec2PerMl: customAoVL,
      effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: customAoVL * 2,
    });
  });

  it("keeps baseline active stress fenced from root/Zc options", () => {
    expect(() =>
      resolveModelCoreRuntimeActiveSource({
        mode: MODELCORE_RUNTIME_BASELINE_ACTIVE_STRESS_MODE,
        rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
        rootZcBaseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      })
    ).toThrow("Baseline active-stress mode cannot be composed with root/Zc options.");
  });

  it("maps sourced 2x root inertance to the boundary/root hook", () => {
    const rootZc = resolveModelCoreRuntimeRootZc({
      mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
      baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    const core = new ModelCore(DEFAULT_PARAMS, rootZc.experimentalOptions);
    const diagnostics = core.debugExperimentalBoundaryRootInertance();

    expect(rootZc.mechanismId).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID);
    expect(rootZc.equivalentEffectiveAoVInertanceMultiple).toBe(2);
    expect(rootZc.additionalAorticRootInertanceMmHgSec2PerMl).toBe(DEFAULT_PARAMS.AoV_L);
    expect(diagnostics).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      targetValve: "AoV",
      baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      effectiveAoVBoundaryRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L * 2,
    });
    expect(core.debugExperimentalActiveSourceProviderIds()).toEqual({});
  });

});
