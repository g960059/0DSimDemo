import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
  type MainWireIntegratedModelCompletedBeatMetricsV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MainWireAorticRecoveredRootPortBeatAccumulatorV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortBeatMetricsV1";
import {
  createMainWireIntegratedModelRuntimeV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  type MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1,
  MainWireSelectedAorticPortSessionExtensionV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";
import { withHotPathIntegrityTierV1 } from "@/engine/hotPathIntegrityTierV1";

const ONE_BASE_OUTPUT = Object.freeze([
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[0]!,
]);

type SelectedAcceptedState =
  MainWireIntegratedModelSelectedAorticOutflowFixtureV1["cold"]["acceptedState"];
type ExactBeatState = Readonly<{
  beatAccumulator: MainWireIntegratedModelBeatAccumulatorV3;
  completedBeatMetrics: MainWireIntegratedModelCompletedBeatMetricsV3 | null;
}>;

class SelectedAorticSessionHarnessV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly extension: MainWireSelectedAorticPortSessionExtensionV1;

  constructor(
    runtime: MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
    extension = MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    acceptedState: SelectedAcceptedState = runtime.cold.acceptedState,
    exactBeatState?: ExactBeatState,
  ) {
    super(
      runtime,
      acceptedState,
      "cold",
      null,
      exactBeatState,
      undefined,
      extension,
    );
    this.extension = extension;
  }
}

class ConstructionHarnessV1 extends MainWireIntegratedTypedAuthoritySessionV1 {
  constructor(
    runtime:
      | MainWireIntegratedModelRuntimeV3
      | MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
    extension: MainWireSelectedAorticPortSessionExtensionV1 | null,
    acceptedState: SelectedAcceptedState = runtime.cold.acceptedState,
    exactBeatState?: ExactBeatState,
  ) {
    super(
      runtime,
      acceptedState,
      "cold",
      null,
      exactBeatState,
      undefined,
      extension,
    );
  }
}

function createSynchronizedColdActiveBeatRestoreSeedV1(
  selectedAorticValveFlowMlPerSec = 0,
): Readonly<{
  exactBeatState: ExactBeatState;
  extension: MainWireSelectedAorticPortSessionExtensionV1;
}> {
  const baseReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  const selectedReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  selectedReadback.set(baseReadback);
  selectedReadback[
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1
      .valveFlowMlPerSec + 1
  ] = selectedAorticValveFlowMlPerSec;
  const beatAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  beatAccumulator.acceptNumericalReadback(
    baseReadback,
    "selected-aortic-test-capture-1",
  );
  const selectedAccumulator =
    new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
  selectedAccumulator.acceptNumericalReadbackV3(
    selectedReadback,
    "selected-aortic-test-capture-1",
  );
  const coldCheckpoint =
    MainWireSelectedAorticPortSessionExtensionV1.createColdV1()
      .checkpointExactBeatStateV1();
  const extension =
    MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1({
      ...coldCheckpoint,
      selectedBeatAccumulator: selectedAccumulator.checkpoint(),
    });
  return Object.freeze({
    exactBeatState: Object.freeze({
      beatAccumulator,
      completedBeatMetrics: null,
    }),
    extension,
  });
}

describe("typed-authority selected aortic Session extension integration V1", () => {
  it("leaves Standard 65 on its legacy owner and checkpoint path", async () => {
    expect(MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1)
      .toMatchObject({
        modelOwnerScope: "standard-66-only",
        legacyStandard65InstantiatesExtension: false,
      });
    const session = await MainWireIntegratedTypedAuthoritySessionV1.create();
    const advanced = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    );
    expect(advanced.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    await expect(session.checkpointStandardExact()).resolves.toMatchObject({
      schemaVersion: 2,
    });
  });

  it("fails closed unless fixture identity, selected vascular profile, typed authority, and owner agree", async () => {
    const standard = await createMainWireIntegratedModelRuntimeV3();
    expect(() => new ConstructionHarnessV1(
      standard,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/requires typed authority and the fixed selected runtime/);

    const selected = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    expect(() => new ConstructionHarnessV1(selected, null))
      .toThrow(/requires its Session extension owner/);
    const wrongFixtureIdentity = Object.freeze({
      ...selected,
      fixedAssemblyId: "wrong-selected-fixture-id",
    });
    expect(() => new ConstructionHarnessV1(
      wrongFixtureIdentity as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      null,
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const copiedClaim = Object.freeze({
      ...selected,
      fixedAssemblyClaim: Object.freeze({ ...selected.fixedAssemblyClaim }),
    });
    expect(() => new ConstructionHarnessV1(
      copiedClaim as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const splitCirculationRuntime = Object.freeze({
      ...selected,
      runtime: Object.freeze({ ...selected.runtime }),
    });
    expect(() => new ConstructionHarnessV1(
      splitCirculationRuntime as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const selectedProfileImpostorRuntime = Object.freeze({
      ...selected.runtime,
      vascular: Object.freeze({
        ...selected.runtime.vascular,
        selectedAorticOutflowProfile: Object.freeze({
          ...selected.runtime.vascular.selectedAorticOutflowProfile,
        }),
      }),
    });
    const selectedProfileImpostor = Object.freeze({
      ...selected,
      runtime: selectedProfileImpostorRuntime,
      coronaryStepInput: Object.freeze({
        ...selected.coronaryStepInput,
        runtime: selectedProfileImpostorRuntime,
      }),
    });
    expect(() => new ConstructionHarnessV1(
      selectedProfileImpostor as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const wrongLandProvider = Object.freeze({
      ...selected,
      provider: Object.freeze({
        ...selected.provider,
        parameterSetId: "wrong-land-provider",
      }),
    });
    expect(() => new ConstructionHarnessV1(
      wrongLandProvider as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const wrongMatchedAlphaCalcium = Object.freeze({
      ...selected,
      coronaryStepInput: Object.freeze({
        ...selected.coronaryStepInput,
        calciumDriveParams: Object.freeze({
          ...selected.coronaryStepInput.calciumDriveParams,
          parameterSetId: "wrong-matched-alpha-calcium",
        }),
      }),
    });
    expect(() => new ConstructionHarnessV1(
      wrongMatchedAlphaCalcium as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);

    const configuration = selected.rhythm.configuration;
    const wrongRhythmBinding = Object.freeze({
      ...selected,
      rhythm: Object.freeze({
        ...selected.rhythm,
        configuration: Object.freeze({
          ...configuration,
          ventricularIntervalStrength: Object.freeze({
            ...configuration.ventricularIntervalStrength,
            parameterProvenance: Object.freeze({
              ...configuration.ventricularIntervalStrength.parameterProvenance,
              sourceId: "wrong-matched-alpha-rhythm-source",
            }),
          }),
        }),
      }),
    });
    expect(() => new ConstructionHarnessV1(
      wrongRhythmBinding as unknown as
        MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/runtime marker does not match the fixed assembly/);
  });

  it("publishes one ordinary candidate to synchronized 73/76-f64 accepted owners only after commit", async () => {
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
    );
    expect(session.extension.acceptedReadbackClockV1()).toBeNull();
    const advanced = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    );
    expect(advanced.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
      internalAcceptedSubstepCount: 1,
    });
    const clock = session.extension.acceptedReadbackClockV1();
    expect(clock).toEqual({ acceptedTimeSec: 0.002, revision: 1 });
    const accepted = session.extension.withAcceptedReadbackV3(clock!, (readback) =>
      Float64Array.from(readback)
    );
    expect(accepted).toBeInstanceOf(Float64Array);
    expect(accepted).toHaveLength(
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
    );
    expect(accepted![MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec])
      .toBe(0.002);
    for (const index of [
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
        .algebraicProximalConstitutivePortPressureMmHg,
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
        .localValvePressureGradientMmHg,
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
        .venaContractaBernoulliPressureMmHg,
    ]) {
      expect(Number.isFinite(accepted![index])).toBe(true);
    }
    expect(session.extension.checkpointExactBeatStateV1()
      .selectedBeatAccumulator.active).toBeNull();
    await expect(session.checkpointStandardExact())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
    await expect(session.checkpointCanonicalBinary())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
  });

  it("rejects cross-owner active beat restore drift before Session admission", () => {
    const runtime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const valid = createSynchronizedColdActiveBeatRestoreSeedV1();
    expect(() => new ConstructionHarnessV1(
      runtime,
      valid.extension,
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).not.toThrow();

    expect(() => new ConstructionHarnessV1(
      runtime,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).toThrow(/active beat availability differs/);

    const signedZeroFlow = createSynchronizedColdActiveBeatRestoreSeedV1(-0);
    expect(() => new ConstructionHarnessV1(
      runtime,
      signedZeroFlow.extension,
      runtime.cold.acceptedState,
      signedZeroFlow.exactBeatState,
    )).toThrow(/active beat boundary differs/);

    const checkpoint = valid.extension.checkpointExactBeatStateV1();
    const active = checkpoint.selectedBeatAccumulator.active!;
    const restoreWithActive = (replacement: typeof active) =>
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1({
        ...checkpoint,
        selectedBeatAccumulator: {
          ...checkpoint.selectedBeatAccumulator,
          active: replacement,
        },
      });
    const wrongClock = restoreWithActive(Object.freeze({
      ...active,
      previous: Object.freeze({
        ...active.previous,
        timeSec: Number.MIN_VALUE,
      }),
    }));
    expect(() => new ConstructionHarnessV1(
      runtime,
      wrongClock,
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).toThrow(/active beat boundary differs/);

    const signedZeroClockAndStart = restoreWithActive(Object.freeze({
      ...active,
      startTimeSec: -0,
      previous: Object.freeze({
        ...active.previous,
        timeSec: -0,
      }),
    }));
    expect(() => new ConstructionHarnessV1(
      runtime,
      signedZeroClockAndStart,
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).toThrow(/active beat boundary differs/);

    const wrongCapture = restoreWithActive(Object.freeze({
      ...active,
      startAtrialCaptureId: "selected-aortic-test-capture-other",
    }));
    expect(() => new ConstructionHarnessV1(
      runtime,
      wrongCapture,
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).toThrow(/active beat boundary differs/);

    const signedZeroDuration = restoreWithActive(Object.freeze({
      ...active,
      forwardFlowDurationSec: -0,
    }));
    expect(() => new ConstructionHarnessV1(
      runtime,
      signedZeroDuration,
      runtime.cold.acceptedState,
      valid.exactBeatState,
    )).toThrow(/active beat boundary differs/);
  });

  it("keeps event-clipped multi-substeps and completed base/selected beat clocks exactly synchronized", () => {
    const runtime =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const session = new SelectedAorticSessionHarnessV1(runtime);
    for (let ordinal = 1; ordinal <= 433; ordinal += 1) {
      session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        ordinal * 0.002,
        ONE_BASE_OUTPUT,
      );
    }
    const firstBoundary = session
      .advanceToPresentationTimeWithSelectedOutputProjectionV1(
        0.87,
        ONE_BASE_OUTPUT,
      );
    expect(firstBoundary.advance).toMatchObject({
      status: "advanced",
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
    });
    for (let ordinal = 436; ordinal <= 933; ordinal += 1) {
      session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        ordinal * 0.002,
        ONE_BASE_OUTPUT,
      );
    }
    const secondBoundary = session
      .advanceToPresentationTimeWithSelectedOutputProjectionV1(
        1.868,
        ONE_BASE_OUTPUT,
      );
    expect(secondBoundary.advance).toMatchObject({
      status: "advanced",
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
    });

    const base = session.observe().completedBeatMetrics;
    const selected = session.extension.latestCompletedBeatMetricsV1();
    expect(base).not.toBeNull();
    expect(selected).not.toBeNull();
    expect(selected).toMatchObject({
      startAtrialCaptureId: base!.startAtrialCaptureId,
      endAtrialCaptureId: base!.endAtrialCaptureId,
      startTimeSec: base!.startTimeSec,
      endTimeSec: base!.endTimeSec,
      durationSec: base!.durationSec,
    });
    expect(selected!.localValveForwardPressureGradient.forwardFlowDurationSec)
      .toBe(base!.valveForwardPressureGradients.AoV.forwardFlowDurationSec);
    const selectedCheckpoint =
      session.extension.checkpointExactBeatStateV1();
    expect(selectedCheckpoint.selectedBeatAccumulator.active?.previous.timeSec)
      .toBe(1.868);

    const clock = session.extension.acceptedReadbackClockV1()!;
    const readback = session.extension.withAcceptedReadbackV3(
      clock,
      (borrowed) => Float64Array.from(borrowed),
    )!;
    const restoredBaseAccumulator =
      new MainWireIntegratedModelBeatAccumulatorV3();
    const acceptedBaseReadback = readback.slice(
      0,
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
    );
    const captureBaseReadback = Float64Array.from(acceptedBaseReadback);
    captureBaseReadback[
      MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
    ] = selectedCheckpoint.selectedBeatAccumulator.active!.startTimeSec;
    restoredBaseAccumulator.acceptNumericalReadback(
      captureBaseReadback,
      base!.endAtrialCaptureId,
    );
    restoredBaseAccumulator.acceptNumericalReadback(
      acceptedBaseReadback,
      null,
    );
    const acceptedState = session.currentAcceptedState();
    const exactBeatState = Object.freeze({
      beatAccumulator: restoredBaseAccumulator,
      completedBeatMetrics: base,
    });
    expect(() => new ConstructionHarnessV1(
      runtime,
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1(
        selectedCheckpoint,
      ),
      acceptedState,
      exactBeatState,
    )).not.toThrow();

    const missingSelectedLatest =
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1({
        ...selectedCheckpoint,
        latestCompletedBeatMetrics: null,
      });
    expect(() => new ConstructionHarnessV1(
      runtime,
      missingSelectedLatest,
      acceptedState,
      exactBeatState,
    )).toThrow(/completed beat availability differs/);

    const wrongSelectedLatest =
      MainWireSelectedAorticPortSessionExtensionV1.restoreExactBeatStateV1({
        ...selectedCheckpoint,
        latestCompletedBeatMetrics: Object.freeze({
          ...selectedCheckpoint.latestCompletedBeatMetrics!,
          startAtrialCaptureId: "selected-aortic-test-wrong-start-capture",
        }),
      });
    expect(() => new ConstructionHarnessV1(
      runtime,
      wrongSelectedLatest,
      acceptedState,
      exactBeatState,
    )).toThrow(/completed beat boundary differs/);
  }, 30_000);

  it("aborts a selected precommit staging failure without commit or terminal poison", () => {
    const real = MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    let stageCallCount = 0;
    const injected = {
      extensionId: real.extensionId,
      acceptedReadbackClockV1: real.acceptedReadbackClockV1.bind(real),
      latestCompletedBeatMetricsV1:
        real.latestCompletedBeatMetricsV1.bind(real),
      withAcceptedReadbackV3: real.withAcceptedReadbackV3.bind(real),
      checkpointExactBeatStateV1: real.checkpointExactBeatStateV1.bind(real),
      stageCandidateV1: () => {
        stageCallCount += 1;
        throw new Error("injected precommit selected staging failure");
      },
    } as unknown as MainWireSelectedAorticPortSessionExtensionV1;
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
      injected,
    );
    const returned = session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    );
    expect(returned).toMatchObject({
      advance: {
        status: "failed",
        acceptedTimeSec: 0,
        acceptedRevision: 0,
        partiallyAdvanced: false,
        message: "injected precommit selected staging failure",
      },
      projectedValues: null,
    });
    expect(stageCallCount).toBe(1);
    expect(real.acceptedReadbackClockV1()).toBeNull();
    expect(session.authorityReport()).toMatchObject({
      commitCount: 0,
      staged: false,
    });
    expect(session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: 0,
      revision: 0,
    });
    expect(session.observe()).toMatchObject({ source: "cold" });
  });

  it("aborts an ordinary fast-path staging failure without a second commit or poison", () => withHotPathIntegrityTierV1("hot-path-lean", () => {
    const real = MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    let stageCallCount = 0;
    const injected = {
      extensionId: real.extensionId,
      acceptedReadbackClockV1: real.acceptedReadbackClockV1.bind(real),
      latestCompletedBeatMetricsV1:
        real.latestCompletedBeatMetricsV1.bind(real),
      withAcceptedReadbackV3: real.withAcceptedReadbackV3.bind(real),
      checkpointExactBeatStateV1: real.checkpointExactBeatStateV1.bind(real),
      stageCandidateV1: (
        input: Parameters<
          MainWireSelectedAorticPortSessionExtensionV1["stageCandidateV1"]
        >[0],
      ) => {
        stageCallCount += 1;
        if (stageCallCount === 2) {
          throw new Error("injected ordinary precommit staging failure");
        }
        return real.stageCandidateV1(input);
      },
    } as unknown as MainWireSelectedAorticPortSessionExtensionV1;
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
      injected,
    );
    expect(session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    ).advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    expect(() => session
      .advanceToPresentationTimeWithSelectedOutputProjectionV1(
        0.004,
        ONE_BASE_OUTPUT,
      )).toThrow(/injected ordinary precommit staging failure/);
    expect(stageCallCount).toBe(2);
    expect(real.acceptedReadbackClockV1()).toEqual({
      acceptedTimeSec: 0.002,
      revision: 1,
    });
    expect(session.authorityReport()).toMatchObject({
      commitCount: 1,
      staged: false,
    });
    expect(session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: 0.002,
      revision: 1,
    });
    expect(session.observe()).toMatchObject({
      acceptedState: { acceptedTimeSec: 0.002, revision: 1 },
    });
  }));

  it("terminally poisons the Session if selected promotion fails after hemodynamic commit", async () => {
    const real = MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const injected = {
      extensionId: real.extensionId,
      acceptedReadbackClockV1: real.acceptedReadbackClockV1.bind(real),
      latestCompletedBeatMetricsV1:
        real.latestCompletedBeatMetricsV1.bind(real),
      withAcceptedReadbackV3: real.withAcceptedReadbackV3.bind(real),
      checkpointExactBeatStateV1: real.checkpointExactBeatStateV1.bind(real),
      stageCandidateV1: (
        input: Parameters<
          MainWireSelectedAorticPortSessionExtensionV1["stageCandidateV1"]
        >[0],
      ) => {
        const ticket = real.stageCandidateV1(input);
        return Object.freeze({
          ...ticket,
          promote: (
            _promotion: Parameters<typeof ticket.promote>[0],
          ) => {
            throw new Error("injected postcommit promotion failure");
          },
        });
      },
    } as unknown as MainWireSelectedAorticPortSessionExtensionV1;
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
      injected,
    );
    expect(() => session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    )).toThrow(/injected postcommit promotion failure/);
    expect(real.acceptedReadbackClockV1()).toBeNull();

    const poisoned = /terminally poisoned/;
    expect(() => session.advanceToPresentationTime(0.004)).toThrow(poisoned);
    expect(() => session.observe()).toThrow(poisoned);
    expect(() => session.projectCurrentAcceptedValuesV1(ONE_BASE_OUTPUT))
      .toThrow(poisoned);
    expect(() => session.currentAcceptedState()).toThrow(poisoned);
    expect(() => session.snapshotAcceptedStateBytes()).toThrow(poisoned);
    await expect(session.checkpointStandardExact()).rejects.toThrow(poisoned);
    await expect(session.warmStartWithHemodynamicResearchInputs(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1()
        .hemodynamicResearchInputs,
    )).rejects.toThrow(poisoned);

    expect(session.authorityReport().commitCount).toBe(1);
    expect(session.coupledSolverProfile().solveCount).toEqual(expect.any(Number));
    expect(session.coupledPredictorReport()).toBeDefined();
  });
});
