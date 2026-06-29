import { afterEach, describe, expect, it } from "vitest";
import phase5AFArtifact from "@/data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json";
import phase5AGArtifact from "@/data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json";
import phase5AHArtifact from "@/data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json";
import phase5APArtifact from "@/data/myocardium/protocols/runtime-root-zc-live-closure-phase5ap-result-v1.json";
import phase5ARArtifact from "@/data/myocardium/protocols/atrial-land-source-stress-attribution-phase5ar-result-v1.json";
import { DEFAULT_PARAMS } from "@/constants";
import { ModelCore } from "@/engine/ModelCore";
import { runScenario } from "@/engine/harness";
import {
  createModelCoreLand2017LvSourceProviderInstrumentation,
} from "@/engine/myocardium/modelCoreLand2017LvSourceProvider";
import {
  MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_LA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
  MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
  MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_RA_LAND_SOURCE_PROVIDER_ID,
  MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID,
  resolveModelCoreRuntimeActiveSource,
  useAllChamberLandDefaultCandidateForModelCoreRuntimeForThisProcess,
  useLegacyActiveStressForModelCoreRuntimeForThisProcess,
  useLvLandDefaultForModelCoreRuntimeForThisProcess,
  useLvRvLandDefaultForModelCoreRuntimeForThisProcess,
  useLvRvLandDefaultCandidateForModelCoreRuntimeForThisProcess,
} from "@/engine/myocardium/runtimeActiveSource";
import {
  MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE,
  MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
  resolveModelCoreRuntimeRootZc,
} from "@/engine/myocardium/runtimeRootZc";

describe("ModelCore runtime active source default", () => {
  afterEach(() => {
    useLvRvLandDefaultForModelCoreRuntimeForThisProcess();
  });

  it("resolves LV+RV Land as the user-0 staged runtime default", () => {
    const resolved = resolveModelCoreRuntimeActiveSource();

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE);
    expect(resolved.claimBoundary).toBe("user0-staged-lv-rv-land-default-no-clinical-validation");
    expect(resolved.sourceProviderScope).toBe("LV+RV");
    expect(resolved.sourceProviderId).toBeNull();
    expect(resolved.calciumMapping.noTuningInRuntimeDefault).toBe(true);
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.LA).toBeUndefined();
    expect(resolved.experimentalOptions.activeSourceProviders?.RA).toBeUndefined();
    expect(resolved.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(resolved.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
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

  it("runs the default LV+RV Land providers without solver failures", () => {
    const instrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({ instrumentation, rvInstrumentation });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(core.debugExperimentalActiveSourceProviderIds().LV).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(core.debugExperimentalActiveSourceProviderIds().RV).toBe(MODELCORE_RUNTIME_RV_LAND_SOURCE_PROVIDER_ID);
    expect(instrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(rvInstrumentation.sourceActiveStressPa).toBeGreaterThan(0);
    expect(instrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(rvInstrumentation.commitProviderStateAfterStep).toBeGreaterThan(0);
    expect(instrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(rvInstrumentation.landSolveOkCount).toBeGreaterThan(0);
    expect(instrumentation.landSolveFailureCount).toBe(0);
    expect(rvInstrumentation.landSolveFailureCount).toBe(0);
  });

  it("keeps LV-only Land reachable as an explicit historical staged default mode", () => {
    useLvLandDefaultForModelCoreRuntimeForThisProcess();
    const resolved = resolveModelCoreRuntimeActiveSource();

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_LAND_DEFAULT_MODE);
    expect(resolved.claimBoundary).toBe("user0-staged-lv-land-default-no-clinical-validation");
    expect(resolved.sourceProviderScope).toBe("LV-only");
    expect(resolved.sourceProviderId).toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.LV?.sourceProviderId)
      .toBe(MODELCORE_RUNTIME_LV_LAND_SOURCE_PROVIDER_ID);
    expect(resolved.experimentalOptions.activeSourceProviders?.RV).toBeUndefined();
  });

  it("keeps LV+RV Land as an explicit default-candidate mode", () => {
    useLvRvLandDefaultCandidateForModelCoreRuntimeForThisProcess();
    const lvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const rvInstrumentation = createModelCoreLand2017LvSourceProviderInstrumentation();
    const resolved = resolveModelCoreRuntimeActiveSource({
      instrumentation: lvInstrumentation,
      rvInstrumentation,
    });
    const core = new ModelCore(DEFAULT_PARAMS, resolved.experimentalOptions);

    core.initializeVenousPressuresForTargetTBV(5600);
    core.runFor(0.05, 0.001, 120);

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_CANDIDATE_MODE);
    expect(resolved.claimBoundary).toBe("lv-rv-land-default-candidate-evidence-no-runtime-flip");
    expect(resolved.sourceProviderScope).toBe("LV+RV-candidate");
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

  it("keeps all-chamber Land reachable as an explicit candidate without changing the user-0 default", () => {
    useAllChamberLandDefaultCandidateForModelCoreRuntimeForThisProcess();
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

    expect(resolved.mode).toBe(MODELCORE_RUNTIME_ALL_CHAMBER_LAND_DEFAULT_CANDIDATE_MODE);
    expect(resolved.claimBoundary).toBe("all-chamber-land-default-candidate-evidence-no-runtime-flip");
    expect(resolved.sourceProviderScope).toBe("LV+RV+LA+RA-candidate");
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

  it("keeps the regression harness on legacy by default but supports explicit LV Land", () => {
    const legacy = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
    });
    const land = runScenario(DEFAULT_PARAMS, {
      settleSeconds: 0.02,
      measureSeconds: 0.02,
      runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    });

    expect(legacy.core.debugExperimentalActiveSourceProviderIds()).toEqual({});
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

    const restored = new ModelCore(DEFAULT_PARAMS, resolveModelCoreRuntimeActiveSource().experimentalOptions);
    restored.unpackState(serialized);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(0);
    expect(restored.debugExperimentalActiveSourceProviderStates().RV?.stateVersion).toBe(0);

    restored.restoreExperimentalActiveProviderRuntimeState(sidecar);
    expect(restored.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(beforeVersion);
    expect(restored.debugExperimentalActiveSourceProviderStates().RV?.stateVersion).toBe(beforeRvVersion);
    expect(restored.packState()).toEqual(serialized);
  });

  it("adopts sourced root/Zc for LV+RV runtime default while keeping current mode explicit", () => {
    const currentRootZc = resolveModelCoreRuntimeRootZc();
    const defaultRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
    });
    const explicitCurrentRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE,
    });
    const candidateRuntime = resolveModelCoreRuntimeActiveSource({
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
      rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
      rootZcBaseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });

    expect(currentRootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE);
    expect(currentRootZc.claimBoundary).toBe("current-root-zc-no-boundary-root-adoption");
    expect(currentRootZc.experimentalOptions.boundaryRootInertance).toBeUndefined();
    expect(defaultRuntime.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_DEFAULT_MODE);
    expect(defaultRuntime.rootZc.claimBoundary)
      .toBe("user0-staged-sourced-boundary-root-zc-default-no-qdot-removal");
    expect(defaultRuntime.rootZc.adoptionStatus).toBe("user0-staged-runtime-default-adopted");
    expect(defaultRuntime.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    expect(explicitCurrentRuntime.rootZc.mode).toBe(MODELCORE_RUNTIME_ROOT_ZC_CURRENT_MODE);
    expect(explicitCurrentRuntime.experimentalOptions.boundaryRootInertance).toBeUndefined();
    expect(candidateRuntime.experimentalOptions.activeSourceProviders?.LV).toBeDefined();
    expect(candidateRuntime.experimentalOptions.boundaryRootInertance).toMatchObject({
      mechanismId: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_MECHANISM_ID,
      additionalAorticRootInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    expect(candidateRuntime.rootZc.mode)
      .toBe(MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE);
  });

  it("requires explicit base AoV inertance for the sourced root/Zc candidate", () => {
    expect(() =>
      resolveModelCoreRuntimeRootZc({
        mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
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
      mode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
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
        runtimeActiveSourceMode: MODELCORE_RUNTIME_LV_RV_LAND_DEFAULT_MODE,
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

  it("keeps legacy active-stress rollback fenced from root/Zc opt-in", () => {
    expect(() =>
      resolveModelCoreRuntimeActiveSource({
        mode: MODELCORE_RUNTIME_LEGACY_ACTIVE_STRESS_ROLLBACK_MODE,
        rootZcMode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
        rootZcBaseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
      })
    ).toThrow("Legacy active-stress rollback cannot be composed with experimental root/Zc options.");
  });

  it("maps the Phase 5AF sourced total 2x candidate to the existing boundary/root hook", () => {
    const rootZc = resolveModelCoreRuntimeRootZc({
      mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
      baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });
    const core = new ModelCore(DEFAULT_PARAMS, rootZc.experimentalOptions);
    const diagnostics = core.debugExperimentalBoundaryRootInertance();

    expect(rootZc.claimBoundary)
      .toBe("off-by-default-sourced-boundary-root-zc-candidate-no-production-adoption");
    expect(rootZc.adoptionStatus).toBe("off-by-default-acceptance-evidence-only");
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

  it("readbacks Phase 5AF/5AG/5AH/5AP evidence without drifting from artifacts", () => {
    const rootZc = resolveModelCoreRuntimeRootZc({
      mode: MODELCORE_RUNTIME_ROOT_ZC_SOURCED_BOUNDARY_ROOT_CANDIDATE_MODE,
      baseAoVInertanceMmHgSec2PerMl: DEFAULT_PARAMS.AoV_L,
    });

    expect(rootZc.evidenceReadback).toMatchObject({
      upstreamPhase5AFArtifactId: phase5AFArtifact.id,
      upstreamPhase5AGArtifactId: phase5AGArtifact.id,
      upstreamPhase5AHArtifactId: phase5AHArtifact.id,
      upstreamPhase5APArtifactId: phase5APArtifact.id,
      sourceCalibrationStatus: phase5AFArtifact.phase5aeBoundaryRootMechanismCalibration.calibrationStatus,
      equivalentPhase5ACCandidateId:
        phase5AFArtifact.phase5aeBoundaryRootMechanismCalibration.equivalentPhase5ACCandidateId,
      equivalentEffectiveAoVInertanceMultiple:
        phase5AFArtifact.phase5aeBoundaryRootMechanismCalibration.equivalentEffectiveAoVInertanceMultiple,
      phase5AGHealthOkCandidateComparisonCount: phase5AGArtifact.summary.healthOkCandidateComparisonCount,
      phase5AGQDotAndTimingOutputPreservedCount: phase5AGArtifact.summary.qDotAndTimingOutputPreservedCount,
      phase5AHLandHealthOkCandidateComparisonCount: phase5AHArtifact.summary.landHealthOkCandidateComparisonCount,
      phase5AHLandQDotTimingOutputPreservedCount: phase5AHArtifact.summary.landQDotTimingOutputPreservedCount,
      phase5AHLandTimingOnlyOutputPreservedCount: phase5AHArtifact.summary.landTimingOnlyOutputPreservedCount,
      phase5AHLandSolveFailureCount: phase5AHArtifact.summary.landSolveFailureCount,
      phase5APHealthOkCandidateComparisonCount: phase5APArtifact.summary.healthOkCandidateComparisonCount,
      phase5APOutputPreservedHealthOkCount: phase5APArtifact.summary.outputPreservedHealthOkCount,
      phase5APValveLoadTimingSignalCount: phase5APArtifact.summary.valveLoadTimingSignalCount,
      phase5APQDotEngagementSignalCount: phase5APArtifact.summary.qDotEngagementSignalCount,
      phase5APOutputPreservedFraction: phase5APArtifact.summary.outputPreservedFraction,
      phase5APTimingSignalFraction: phase5APArtifact.summary.timingSignalFraction,
      phase5APQDotSignalFraction: phase5APArtifact.summary.qDotSignalFraction,
      productionDefaultAdoptionSupported: phase5APArtifact.summary.adoptionSupport === "supported",
      qDotClampRemovalSupported: false,
      valveLoadTimingAcceptanceSupported: false,
    });
    expect(phase5AHArtifact.boundary.noBoundaryRootProductionAdoption).toBe(true);
    expect(phase5AHArtifact.boundary.noQDotClampRemoval).toBe(true);
    expect(phase5AHArtifact.boundary.noValveLoadTimingAcceptance).toBe(true);
  });

  it("readbacks Phase 5AR atrial source-stress attribution without drifting from artifacts", () => {
    const lowHr90Runs = phase5ARArtifact.runs.filter((run) => run.pointId === "low-preload-hr90");
    const laOnly = lowHr90Runs.find((run) => run.candidateId === "la-only-land-candidate");
    const raOnly = lowHr90Runs.find((run) => run.candidateId === "ra-only-land-candidate");
    const allChamber = lowHr90Runs.find((run) => run.candidateId === "all-chamber-land-candidate");

    expect(phase5ARArtifact.summary.candidateSupport)
      .toBe("attributed-negative-raw-land-source-stress");
    expect(phase5ARArtifact.summary.pressureAdapterNonnegativeErrorCount).toBe(2);
    expect(phase5ARArtifact.summary.negativeSourceStressFindingCount).toBe(2);
    expect(phase5ARArtifact.summary.negativeCommitStressFindingCount).toBe(2);
    expect(laOnly).toMatchObject({
      status: "measured",
      sourceStressAttribution: "measured-no-negative-source-stress",
      negativeSourceStressChambers: [],
    });
    for (const run of [raOnly, allChamber]) {
      expect(run).toMatchObject({
        status: "runtime-error",
        pressureAdapterNonnegativeError: true,
        errorMessage: "source active-fiber stress must be nonnegative",
        negativeSourceStressChambers: ["RA"],
        negativeCommitStressChambers: ["RA"],
        sourceStressAttribution: "runtime-error-negative-raw-land-source-stress-before-pressure-adapter",
      });
      expect(run?.providerInstrumentation.RA?.landSolveFailureCount).toBe(0);
      expect(run?.providerInstrumentation.RA?.sourcePathAudit.sourceActiveFiberStressPa.min)
        .toBeLessThan(0);
      expect(run?.providerInstrumentation.RA?.commitPathAudit.sourceActiveFiberStressPa.min)
        .toBeLessThan(0);
    }
    for (const run of phase5ARArtifact.runs) {
      for (const chamber of ["LV", "RV", "LA"] as const) {
        const min = run.providerInstrumentation[chamber]?.sourcePathAudit.sourceActiveFiberStressPa.min;
        if (min != null) expect(min).toBeGreaterThanOrEqual(0);
      }
    }
    expect(phase5ARArtifact.boundary.noAllChamberRuntimeDefaultFlip).toBe(true);
    expect(phase5ARArtifact.boundary.noSourceStressClampOrTuning).toBe(true);
    expect(phase5ARArtifact.boundary.noLegacyDeletion).toBe(true);
  });
});
