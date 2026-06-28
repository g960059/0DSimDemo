import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import {
  ModelCore,
  type ModelCoreExperimentalActiveSourceProvider,
} from "@/engine/ModelCore";

type TestProviderState = {
  commits: number;
  pressureMutations: number;
  lastDtSec: number;
  beforeT: number;
  afterT: number;
  lastEffectiveVolumeMl: number;
};

function testStateProvider(): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: "test-modelcore-owned-state-provider-v1",
    initialProviderState: (): TestProviderState => ({
      commits: 0,
      pressureMutations: 0,
      lastDtSec: 0,
      beforeT: 0,
      afterT: 0,
      lastEffectiveVolumeMl: 0,
    }),
    cloneProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    debugProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    pressure: ({ activeModel, volumeMl, internal, chamberCtx, providerState }) => {
      (providerState as TestProviderState).pressureMutations += 1;
      return activeModel.pressure(volumeMl, internal, chamberCtx);
    },
    passivePressure: ({ activeModel, volumeMl, chamberCtx, providerState }) => {
      (providerState as TestProviderState).pressureMutations += 1;
      return activeModel.passivePressure(volumeMl, chamberCtx);
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx, providerState }) => {
      (providerState as TestProviderState).pressureMutations += 1;
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    commitProviderStateAfterStep: ({
      previousProviderState,
      stepDtSec,
      beforeStep,
      afterStep,
    }): TestProviderState => {
      const previous = previousProviderState as TestProviderState;
      return {
        commits: previous.commits + 1,
        pressureMutations: previous.pressureMutations,
        lastDtSec: stepDtSec,
        beforeT: beforeStep.tSec,
        afterT: afterStep.tSec,
        lastEffectiveVolumeMl: afterStep.effectiveVolumeMl,
      };
    },
  };
}

function lvState(core: ModelCore): TestProviderState {
  return core.debugExperimentalActiveSourceProviderStates().LV?.stateSnapshot as TestProviderState;
}

function loggingStateProvider(
  sourceProviderId: string,
  observedVersions: number[],
): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId,
    initialProviderState: (): TestProviderState => ({
      commits: 0,
      pressureMutations: 0,
      lastDtSec: 0,
      beforeT: 0,
      afterT: 0,
      lastEffectiveVolumeMl: 0,
    }),
    cloneProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    debugProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    pressure: ({ activeModel, volumeMl, internal, chamberCtx, providerStateVersion }) => {
      observedVersions.push(providerStateVersion);
      return activeModel.pressure(volumeMl, internal, chamberCtx);
    },
    passivePressure: ({ activeModel, volumeMl, chamberCtx, providerStateVersion }) => {
      observedVersions.push(providerStateVersion);
      return activeModel.passivePressure(volumeMl, chamberCtx);
    },
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx, providerStateVersion }) => {
      observedVersions.push(providerStateVersion);
      return activeModel.internalDerivatives(volumeMl, internal, chamberCtx);
    },
    commitProviderStateAfterStep: ({ previousProviderState }): TestProviderState => {
      const previous = previousProviderState as TestProviderState;
      return { ...previous, commits: previous.commits + 1 };
    },
  };
}

function aliasingStateProvider(retainedStates: TestProviderState[]): ModelCoreExperimentalActiveSourceProvider {
  return {
    sourceProviderId: "test-aliasing-state-provider-v1",
    initialProviderState: (): TestProviderState => {
      const state = {
        commits: 0,
        pressureMutations: 0,
        lastDtSec: 0,
        beforeT: 0,
        afterT: 0,
        lastEffectiveVolumeMl: 0,
      };
      retainedStates.push(state);
      return state;
    },
    cloneProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    debugProviderState: (state): TestProviderState => ({ ...(state as TestProviderState) }),
    initialInternal: ({ activeModel }) => activeModel.initialInternal(),
    pressure: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      activeModel.pressure(volumeMl, internal, chamberCtx),
    internalDerivatives: ({ activeModel, volumeMl, internal, chamberCtx }) =>
      activeModel.internalDerivatives(volumeMl, internal, chamberCtx),
    commitProviderStateAfterStep: ({ previousProviderState, afterStep }): TestProviderState => {
      const previous = previousProviderState as TestProviderState;
      const state = { ...previous, commits: previous.commits + 1, afterT: afterStep.tSec };
      retainedStates.push(state);
      return state;
    },
  };
}

describe("ModelCore experimental active source-provider state lifecycle", () => {
  it("keeps provider state ModelCore-owned and commits it once per step", () => {
    const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: testStateProvider() } });

    expect(lvState(core).commits).toBe(0);
    expect(lvState(core).pressureMutations).toBe(0);

    core.step(0.001);

    const diagnostics = core.debugExperimentalActiveSourceProviderStates().LV;
    expect(diagnostics?.sourceProviderId).toBe("test-modelcore-owned-state-provider-v1");
    expect(diagnostics?.stateVersion).toBe(1);
    expect(lvState(core).commits).toBe(1);
    expect(lvState(core).pressureMutations).toBe(0);
    expect(lvState(core).lastDtSec).toBeCloseTo(0.001, 12);
    expect(lvState(core).beforeT).toBeCloseTo(0, 12);
    expect(lvState(core).afterT).toBeCloseTo(0.001, 12);
    expect(lvState(core).lastEffectiveVolumeMl).toBeGreaterThan(0);
  });

  it("does not let read-only measurement clones advance the parent provider state", () => {
    const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: testStateProvider() } });
    core.step(0.001);
    const before = core.debugExperimentalActiveSourceProviderStates().LV;

    const snapshot = core.vascularReturnSnapshot("left", {
      mode: "cycle-mean",
      seconds: 0.003,
      dt: 0.001,
      sampleHz: 1000,
    });

    const after = core.debugExperimentalActiveSourceProviderStates().LV;
    expect(snapshot.sampleCount).toBeGreaterThan(0);
    expect(after?.stateVersion).toBe(before?.stateVersion);
    expect(lvState(core).commits).toBe((before?.stateSnapshot as TestProviderState).commits);
    expect(lvState(core).afterT).toBeCloseTo((before?.stateSnapshot as TestProviderState).afterT, 12);
  });

  it("clones provider state for read-only measurements without resetting it", () => {
    const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: testStateProvider() } });
    core.step(0.001);
    core.step(0.001);
    const before = core.debugExperimentalActiveSourceProviderStates().LV;

    const clone = core.cloneForReadOnlyMeasurement();

    expect(clone.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(before?.stateVersion);
    expect(lvState(clone).commits).toBe((before?.stateSnapshot as TestProviderState).commits);

    clone.step(0.001);

    expect(lvState(clone).commits).toBe((before?.stateSnapshot as TestProviderState).commits + 1);
    expect(core.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(before?.stateVersion);
    expect(lvState(core).commits).toBe((before?.stateSnapshot as TestProviderState).commits);
  });

  it("commits multiple provider states from the same old-state snapshot", () => {
    const observedVersions: number[] = [];
    const core = new ModelCore(DEFAULT_PARAMS, {
      activeSourceProviders: {
        LV: loggingStateProvider("test-lv-state-provider-v1", observedVersions),
        RV: loggingStateProvider("test-rv-state-provider-v1", observedVersions),
      },
    });
    observedVersions.length = 0;

    core.step(0.001);

    expect(observedVersions.length).toBeGreaterThan(0);
    expect(Math.max(...observedVersions)).toBe(0);
    expect(core.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(1);
    expect(core.debugExperimentalActiveSourceProviderStates().RV?.stateVersion).toBe(1);
  });

  it("does not retain provider-owned aliases returned from init or commit", () => {
    const retainedStates: TestProviderState[] = [];
    const core = new ModelCore(DEFAULT_PARAMS, {
      activeSourceProviders: { LV: aliasingStateProvider(retainedStates) },
    });

    retainedStates[0].commits = 99;
    expect(lvState(core).commits).toBe(0);

    core.step(0.001);
    retainedStates[1].commits = 123;
    retainedStates[1].afterT = 99;

    expect(lvState(core).commits).toBe(1);
    expect(lvState(core).afterT).toBeCloseTo(0.001, 12);
  });

  it("resets experimental provider state on public unpackState because it is not serialized", () => {
    const core = new ModelCore(DEFAULT_PARAMS, { activeSourceProviders: { LV: testStateProvider() } });
    core.step(0.001);
    const snapshot = core.packState();
    core.step(0.001);
    expect(core.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(2);
    expect(lvState(core).commits).toBe(2);

    core.unpackState(snapshot);

    expect(core.debugExperimentalActiveSourceProviderStates().LV?.stateVersion).toBe(0);
    expect(lvState(core).commits).toBe(0);
    expect(core.packState().t).toBeCloseTo(snapshot.t, 12);
  });
});
