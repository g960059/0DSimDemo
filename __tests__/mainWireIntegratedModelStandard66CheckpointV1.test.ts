import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import {
  MainWireAorticRecoveredRootPortBeatAccumulatorV1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortBeatMetricsV1";
import {
  MainWireIntegratedModelBeatAccumulatorV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  checkpointMainWireIntegratedModelStandard66V1,
  createMainWireIntegratedModelStandard66CheckpointContextV1,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1,
  restoreMainWireIntegratedModelStandard66V1,
  validateMainWireIntegratedModelStandard66CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
import {
  checkpointMainWireIntegratedModelStandardV2,
} from "@/engine/myocardium/MainWireIntegratedModelStandardCheckpointV2";
import {
  stepMainWireIntegratedModelV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  runMainWireIntegratedModelRegularSinusAllOffCycleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

describe("Main Wire integrated Standard66 exact object checkpoint V1", () => {
  it("owns the fixed identity, unchanged Standard V2, and exact beat sidecar without a 76-f64 buffer", async () => {
    const fixture = await checkpointFixtureV1();
    const checkpoint = fixture.checkpoint;

    expect(checkpoint).toMatchObject({
      checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
      schemaVersion: 1,
      revision: 0,
      acceptedTimeSec: 0,
      selectedModelIdentity:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1,
    });
    expect(checkpoint.baseStandardCheckpointV2)
      .toEqual(fixture.baseStandardCheckpointV2);
    expect(checkpoint.baseStandardCheckpointV2)
      .not.toBe(fixture.baseStandardCheckpointV2);
    expect(checkpoint.baseStandardCheckpointV2.checkpointSha256)
      .toBe(fixture.baseStandardCheckpointV2.checkpointSha256);
    expect(Object.isFrozen(checkpoint.baseStandardCheckpointV2)).toBe(true);
    expect(Object.isFrozen(
      checkpoint.baseStandardCheckpointV2.numericalCheckpoint,
    )).toBe(true);
    expect(checkpoint.selectedAorticOutflowProfileIdentitySha256)
      .toBe(await sha256CanonicalJsonHex(
        MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
      ));
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(checkpoint)).not.toContain("NumericalReadback");

    const transported = JSON.parse(JSON.stringify(checkpoint));
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(transported),
    ).resolves.toEqual(transported);
  }, 60_000);

  it("rejects rehashed owner-clock, profile, and split active-beat mutations", async () => {
    const { checkpoint } = await checkpointFixtureV1();

    const directTamper = cloneV1(checkpoint);
    directTamper.acceptedTimeSec = 0.001;
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(directTamper),
    ).rejects.toThrow(/outer SHA-256 mismatch/);

    const clockMismatch = cloneV1(checkpoint);
    clockMismatch.revision += 1;
    await rehashV1(clockMismatch);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(clockMismatch),
    ).rejects.toThrow(/owner clocks differ/);

    const signedZeroClockMismatch = cloneV1(checkpoint);
    signedZeroClockMismatch.acceptedTimeSec = -0;
    await rehashV1(signedZeroClockMismatch);
    expect(Object.is(
      signedZeroClockMismatch.acceptedTimeSec,
      -0,
    )).toBe(true);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(
        signedZeroClockMismatch,
      ),
    ).rejects.toThrow(/owner clocks differ/);

    const profileMismatch = cloneV1(checkpoint);
    profileMismatch.selectedAorticOutflowProfileIdentitySha256 = "0".repeat(64);
    await rehashV1(profileMismatch);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(profileMismatch),
    ).rejects.toThrow(/selected profile identity mismatch/);

    const splitFlow = cloneV1(checkpoint);
    splitFlow.selectedAorticPortExactBeatState.selectedBeatAccumulator
      .active.previous.aorticValveFlowMlPerSec = 1;
    await rehashV1(splitFlow);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(splitFlow),
    ).rejects.toThrow(/active beats differ/);
  }, 60_000);

  it("synchronously detaches create and validation inputs across digest awaits while preserving signed zero", async () => {
    const { checkpoint } = await checkpointFixtureV1();
    const mutableBase = cloneV1(checkpoint.baseStandardCheckpointV2);
    const mutableSelected = cloneV1(
      checkpoint.selectedAorticPortExactBeatState,
    );
    mutableBase.beatAccumulator.active.previous.aorticValveFlowMlPerSec = -0;
    mutableSelected.selectedBeatAccumulator.active.previous
      .aorticValveFlowMlPerSec = -0;
    await rehashStandardV2(mutableBase);
    const admittedBaseSha = mutableBase.checkpointSha256;
    const createPromise = checkpointMainWireIntegratedModelStandard66V1(
      fixedContextV1(),
      mutableBase,
      mutableSelected,
    );
    mutableBase.revision = 999;
    mutableBase.beatAccumulator.active.previous.aorticValveFlowMlPerSec = 99;
    mutableSelected.selectedBeatAccumulator.active.previous
      .aorticValveFlowMlPerSec = 99;
    const created = await createPromise;

    expect(created.baseStandardCheckpointV2).not.toBe(mutableBase);
    expect(created.selectedAorticPortExactBeatState).not.toBe(mutableSelected);
    expect(created.baseStandardCheckpointV2.checkpointSha256)
      .toBe(admittedBaseSha);
    expect(created.revision).toBe(0);
    expect(Object.is(
      created.baseStandardCheckpointV2.beatAccumulator.active!
        .previous.aorticValveFlowMlPerSec,
      -0,
    )).toBe(true);
    expect(Object.is(
      created.selectedAorticPortExactBeatState.selectedBeatAccumulator.active!
        .previous.aorticValveFlowMlPerSec,
      -0,
    )).toBe(true);
    expect(Object.isFrozen(
      created.baseStandardCheckpointV2.beatAccumulator.active!.previous,
    )).toBe(true);

    const mutableOuter = cloneV1(created);
    mutableOuter.baseStandardCheckpointV2.beatAccumulator.active.previous
      .aorticValveFlowMlPerSec = -0;
    mutableOuter.selectedAorticPortExactBeatState.selectedBeatAccumulator
      .active.previous.aorticValveFlowMlPerSec = -0;
    await rehashStandardV2(mutableOuter.baseStandardCheckpointV2);
    await rehashV1(mutableOuter);
    const validatePromise =
      validateMainWireIntegratedModelStandard66CheckpointV1(mutableOuter);
    mutableOuter.revision = 777;
    mutableOuter.baseStandardCheckpointV2.beatAccumulator.active.previous
      .aorticValveFlowMlPerSec = 77;
    const validated = await validatePromise;

    expect(validated).not.toBe(mutableOuter);
    expect(validated.revision).toBe(0);
    expect(Object.is(
      validated.baseStandardCheckpointV2.beatAccumulator.active!
        .previous.aorticValveFlowMlPerSec,
      -0,
    )).toBe(true);
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(
      validated.selectedAorticPortExactBeatState.selectedBeatAccumulator
        .active!.previous,
    )).toBe(true);
  }, 60_000);

  it("cross-validates retained completed beats and rejects rehashed inner-plus-outer duration drift", async () => {
    const checkpoint = await synchronizedCompletedCheckpointV1();
    expect(checkpoint.baseStandardCheckpointV2.completedBeatMetrics)
      .not.toBeNull();
    expect(checkpoint.selectedAorticPortExactBeatState
      .latestCompletedBeatMetrics).not.toBeNull();
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(checkpoint),
    ).resolves.toEqual(checkpoint);

    const splitDuration = cloneV1(checkpoint);
    splitDuration.baseStandardCheckpointV2.completedBeatMetrics
      .valveForwardPressureGradients.AoV.forwardFlowDurationSec += 0.001;
    await rehashStandardV2(splitDuration.baseStandardCheckpointV2);
    await rehashV1(splitDuration);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(splitDuration),
    ).rejects.toThrow(/completed beats differ/);
  }, 120_000);

  it("fails closed before checkpointing a different fixture or profile", () => {
    expect(() => createMainWireIntegratedModelStandard66CheckpointContextV1({
      fixedAssemblyId: "legacy-fixture",
      selectedAorticOutflowProfile:
        MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
    })).toThrow(/fixture identity mismatch/);

    expect(() => createMainWireIntegratedModelStandard66CheckpointContextV1({
      fixedAssemblyId:
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1.fixtureId,
      selectedAorticOutflowProfile: {
        ...MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
        characteristicImpedanceResistanceMmHgSecPerMl: 0.034,
      },
    })).toThrow(/selected profile mismatch/);
  });

  it("admits a synchronized nonzero pre-first-capture checkpoint with both beat owners inactive", async () => {
    const selectedFixture =
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const step = stepMainWireIntegratedModelV3(
      selectedFixture.provider,
      selectedFixture.cold.acceptedState,
      {
        candidateTimeSec: 0.002,
        coronary: selectedFixture.coronaryStepInput,
        rhythm: Object.freeze({
          configuration: selectedFixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        }),
        dynamicMechanicalSupport: selectedFixture.dynamicMechanicalSupport,
      },
    );
    if (step.converged === false) throw new Error(step.message);
    expect(step.composedRhythmCandidate.capturedAtrialActivation).toBeNull();
    const baseStandardCheckpointV2 =
      await checkpointMainWireIntegratedModelStandardV2(
        standardContextV1(selectedFixture),
        step.acceptedState,
        new MainWireIntegratedModelBeatAccumulatorV3(),
        null,
      );
    const selectedAorticPortExactBeatState = Object.freeze({
      checkpointId:
        MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
      schemaVersion: 1 as const,
      selectedBeatAccumulator:
        new MainWireAorticRecoveredRootPortBeatAccumulatorV1().checkpoint(),
      latestCompletedBeatMetrics: null,
    });
    const checkpoint = await checkpointMainWireIntegratedModelStandard66V1(
      selectedContextV1(selectedFixture),
      baseStandardCheckpointV2,
      selectedAorticPortExactBeatState,
    );

    expect(checkpoint.acceptedTimeSec).toBe(0.002);
    expect(checkpoint.baseStandardCheckpointV2.beatAccumulator.active).toBeNull();
    expect(checkpoint.selectedAorticPortExactBeatState
      .selectedBeatAccumulator.active).toBeNull();
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(checkpoint),
    ).resolves.toEqual(checkpoint);
  }, 60_000);

  it("restores both exact owners while leaving the selected instantaneous readback unavailable", async () => {
    const fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const checkpoint = await synchronizedCompletedCheckpointV1();
    const restored = await restoreMainWireIntegratedModelStandard66V1(
      Object.freeze({
        base: standardContextV1(fixture),
        selected: selectedContextV1(fixture),
      }),
      checkpoint,
    );

    expect(restored.acceptedState.revision).toBe(checkpoint.revision);
    expect(Object.is(
      restored.acceptedState.acceptedTimeSec,
      checkpoint.acceptedTimeSec,
    )).toBe(true);
    expect(restored.beatAccumulator.checkpoint()).toEqual(
      checkpoint.baseStandardCheckpointV2.beatAccumulator,
    );
    expect(restored.completedBeatMetrics).toEqual(
      checkpoint.baseStandardCheckpointV2.completedBeatMetrics,
    );
    expect(restored.selectedAorticPortExtension.checkpointExactBeatStateV1())
      .toEqual(checkpoint.selectedAorticPortExactBeatState);
    expect(restored.selectedAorticPortExtension.acceptedReadbackClockV1())
      .toBeNull();
    expect(restored.selectedAorticPortExtension.withAcceptedReadbackV3(
      Object.freeze({
        acceptedTimeSec: checkpoint.acceptedTimeSec,
        revision: checkpoint.revision,
      }),
      () => "unexpected",
    )).toBeNull();
  }, 120_000);

  it("synchronously owns the Standard66 wrapper before restore awaits", async () => {
    const fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const checkpoint = await synchronizedCompletedCheckpointV1();
    const mutable = cloneV1(checkpoint);
    const restorePromise = restoreMainWireIntegratedModelStandard66V1(
      Object.freeze({
        base: standardContextV1(fixture),
        selected: selectedContextV1(fixture),
      }),
      mutable,
    );
    mutable.revision = 777;
    mutable.baseStandardCheckpointV2.revision = 777;
    mutable.selectedAorticPortExactBeatState.selectedBeatAccumulator.active
      .previous.aorticValveFlowMlPerSec = 777;
    const restored = await restorePromise;

    expect(restored.acceptedState.revision).toBe(checkpoint.revision);
    expect(restored.beatAccumulator.checkpoint()).toEqual(
      checkpoint.baseStandardCheckpointV2.beatAccumulator,
    );
    expect(restored.selectedAorticPortExtension.checkpointExactBeatStateV1())
      .toEqual(checkpoint.selectedAorticPortExactBeatState);
  }, 120_000);
});

async function checkpointFixtureV1() {
  const selectedFixture =
    createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
  const baseBeatAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  const baseReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  baseBeatAccumulator.acceptNumericalReadback(baseReadback, "capture-0");
  const baseStandardCheckpointV2 =
    await checkpointMainWireIntegratedModelStandardV2(
      standardContextV1(selectedFixture),
      selectedFixture.cold.acceptedState,
      baseBeatAccumulator,
      null,
    );

  const selectedBeatAccumulator =
    new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
  const selectedReadback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  selectedBeatAccumulator.acceptNumericalReadbackV3(
    selectedReadback,
    "capture-0",
  );
  const selectedAorticPortExactBeatState = Object.freeze({
    checkpointId:
      MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
    schemaVersion: 1 as const,
    selectedBeatAccumulator: selectedBeatAccumulator.checkpoint(),
    latestCompletedBeatMetrics: null,
  });
  const checkpoint = await checkpointMainWireIntegratedModelStandard66V1(
    selectedContextV1(selectedFixture),
    baseStandardCheckpointV2,
    selectedAorticPortExactBeatState,
  );
  return Object.freeze({ checkpoint, baseStandardCheckpointV2 });
}

function standardContextV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelSelectedAorticOutflowFixtureV1
  >,
) {
  return Object.freeze({
    ...createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3(
      fixture,
    ),
    mechanismResearchInputs: fixture.mechanismResearchInputs,
  });
}

function selectedContextV1(
  fixture: ReturnType<
    typeof createMainWireIntegratedModelSelectedAorticOutflowFixtureV1
  >,
) {
  return createMainWireIntegratedModelStandard66CheckpointContextV1({
    fixedAssemblyId: fixture.fixedAssemblyId,
    selectedAorticOutflowProfile:
      fixture.runtime.vascular.selectedAorticOutflowProfile,
  });
}

function fixedContextV1() {
  return createMainWireIntegratedModelStandard66CheckpointContextV1({
    fixedAssemblyId:
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_SELECTED_IDENTITY_V1.fixtureId,
    selectedAorticOutflowProfile:
      MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
  });
}

async function synchronizedCompletedCheckpointV1() {
  const fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
  const periodicFixture = fixture as unknown as Parameters<
    typeof runMainWireIntegratedModelRegularSinusAllOffCycleV3
  >[0];
  const first = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    periodicFixture,
    fixture.cold.acceptedState,
    1,
    0.002,
  );
  const second = runMainWireIntegratedModelRegularSinusAllOffCycleV3(
    periodicFixture,
    first.terminalAcceptedState,
    2,
    0.002,
  );
  const baseAccumulator = new MainWireIntegratedModelBeatAccumulatorV3();
  const selectedAccumulator =
    new MainWireAorticRecoveredRootPortBeatAccumulatorV1();
  let baseCompleted = null;
  let selectedCompleted = null;
  for (const sample of [
    completedSampleV1(0, 0, 80, 0, 0, "capture/a"),
    completedSampleV1(0.5, 20, 100, 20, 16, null),
    completedSampleV1(1, 0, 90, 0, 0, "capture/b"),
    completedSampleV1(2, -10, 85, -5, -4, null),
  ]) {
    const readbacks = completedReadbacksV1(sample);
    baseCompleted = baseAccumulator.acceptNumericalReadback(
      readbacks.base,
      sample.captureId,
    ) ?? baseCompleted;
    selectedCompleted = selectedAccumulator.acceptNumericalReadbackV3(
      readbacks.selected,
      sample.captureId,
    ) ?? selectedCompleted;
  }
  if (baseCompleted === null || selectedCompleted === null) {
    throw new Error("completed checkpoint fixture did not complete a beat");
  }
  const baseStandardCheckpointV2 =
    await checkpointMainWireIntegratedModelStandardV2(
      standardContextV1(fixture),
      second.terminalAcceptedState,
      baseAccumulator,
      baseCompleted,
    );
  return checkpointMainWireIntegratedModelStandard66V1(
    selectedContextV1(fixture),
    baseStandardCheckpointV2,
    Object.freeze({
      checkpointId:
        MAIN_WIRE_SELECTED_AORTIC_PORT_EXACT_BEAT_STATE_CHECKPOINT_V1_ID,
      schemaVersion: 1 as const,
      selectedBeatAccumulator: selectedAccumulator.checkpoint(),
      latestCompletedBeatMetrics: selectedCompleted,
    }),
  );
}

type CompletedSampleV1 = Readonly<{
  timeSec: number;
  aorticValveFlowMlPerSec: number;
  proximalPressureMmHg: number;
  localGradientMmHg: number;
  venaContractaPressureMmHg: number;
  captureId: string | null;
}>;

function completedSampleV1(
  timeSec: number,
  aorticValveFlowMlPerSec: number,
  proximalPressureMmHg: number,
  localGradientMmHg: number,
  venaContractaPressureMmHg: number,
  captureId: string | null,
): CompletedSampleV1 {
  return Object.freeze({
    timeSec,
    aorticValveFlowMlPerSec,
    proximalPressureMmHg,
    localGradientMmHg,
    venaContractaPressureMmHg,
    captureId,
  });
}

function completedReadbacksV1(sample: CompletedSampleV1) {
  const base = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  const layout = MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1;
  base[layout.timeSec] = sample.timeSec;
  for (let index = 0; index < 4; index += 1) {
    base[layout.chamberVolumeMl + index] = 100;
  }
  base[layout.valveFlowMlPerSec + 1] = sample.aorticValveFlowMlPerSec;
  base[layout.absolutePressureMmHg + 1] =
    80 + sample.localGradientMmHg;
  base[layout.absolutePressureMmHg + 4] = 80;
  const selected = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  );
  selected.set(base);
  selected[
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
      .algebraicProximalConstitutivePortPressureMmHg
  ] = sample.proximalPressureMmHg;
  selected[
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
      .localValvePressureGradientMmHg
  ] = sample.localGradientMmHg;
  selected[
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
      .venaContractaBernoulliPressureMmHg
  ] = sample.venaContractaPressureMmHg;
  return Object.freeze({ base, selected });
}

function cloneV1<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}

async function rehashV1(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}

async function rehashStandardV2(checkpoint: any): Promise<void> {
  const { checkpointSha256: _old, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
