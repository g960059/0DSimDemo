import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
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
  createMainWireIntegratedModelRegularSinusAllOffCheckpointContextV3,
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

describe("Main Wire integrated Standard66 exact object checkpoint V1", () => {
  it("owns selected construction identity over the unchanged base checkpoint only", async () => {
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
    expect(checkpoint.selectedAorticOutflowProfileIdentitySha256)
      .toBe(await sha256CanonicalJsonHex(
        MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
      ));
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint).not.toHaveProperty("selectedAorticPortExactBeatState");
    expect(JSON.stringify(checkpoint)).not.toContain("selectedBeatAccumulator");
    expect(JSON.stringify(checkpoint)).not.toContain(
      "selectedAorticCompletedBeatMetrics",
    );

    const transported = JSON.parse(JSON.stringify(checkpoint));
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(transported),
    ).resolves.toEqual(transported);
  }, 60_000);

  it("rejects direct and rehashed owner-clock, profile, and field-set mutations", async () => {
    const { checkpoint } = await checkpointFixtureV1();

    const direct = cloneV1(checkpoint) as any;
    direct.acceptedTimeSec = 0.001;
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(direct),
    ).rejects.toThrow(/outer SHA-256 mismatch/);

    const clock = cloneV1(checkpoint) as any;
    clock.revision += 1;
    await rehashV1(clock);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(clock),
    ).rejects.toThrow(/owner clocks differ/);

    const profile = cloneV1(checkpoint) as any;
    profile.selectedAorticOutflowProfileIdentitySha256 = "0".repeat(64);
    await rehashV1(profile);
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(profile),
    ).rejects.toThrow(/selected profile identity mismatch/);

    const legacySidecar = cloneV1(checkpoint) as Record<string, unknown>;
    legacySidecar.selectedAorticPortExactBeatState = {};
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(legacySidecar),
    ).rejects.toThrow(/unexpected field set/);
  }, 60_000);

  it("synchronously detaches the base checkpoint before digest awaits", async () => {
    const { baseStandardCheckpointV2 } = await checkpointFixtureV1();
    const mutable = cloneV1(baseStandardCheckpointV2) as any;
    const admittedRevision = mutable.revision;
    const promise = checkpointMainWireIntegratedModelStandard66V1(
      fixedContextV1(),
      mutable,
    );
    mutable.revision = 999;
    const created = await promise;

    expect(created.baseStandardCheckpointV2).not.toBe(mutable);
    expect(created.revision).toBe(admittedRevision);
    expect(created.baseStandardCheckpointV2.revision).toBe(admittedRevision);
    expect(Object.isFrozen(created)).toBe(true);
    expect(Object.isFrozen(created.baseStandardCheckpointV2)).toBe(true);
  }, 60_000);

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

  it("restores the exact base owner with an empty nonpersistent readback owner", async () => {
    const fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    const { checkpoint } = await checkpointFixtureV1(fixture);
    const restored = await restoreMainWireIntegratedModelStandard66V1(
      Object.freeze({
        base: standardContextV1(fixture),
        selected: selectedContextV1(fixture),
      }),
      checkpoint,
    );

    expect(restored.acceptedState.revision).toBe(checkpoint.revision);
    expect(restored.beatAccumulator.checkpoint()).toEqual(
      checkpoint.baseStandardCheckpointV2.beatAccumulator,
    );
    expect(restored.completedBeatMetrics).toEqual(
      checkpoint.baseStandardCheckpointV2.completedBeatMetrics,
    );
    expect(restored.selectedAorticPortExtension.acceptedReadbackClockV1())
      .toBeNull();
    restored.selectedAorticPortExtension.assertReadyForExactCheckpointV1();
  }, 60_000);
});

async function checkpointFixtureV1(
  fixture = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
) {
  const baseStandardCheckpointV2 =
    await checkpointMainWireIntegratedModelStandardV2(
      standardContextV1(fixture),
      fixture.cold.acceptedState,
      new MainWireIntegratedModelBeatAccumulatorV3(),
      null,
    );
  const checkpoint = await checkpointMainWireIntegratedModelStandard66V1(
    selectedContextV1(fixture),
    baseStandardCheckpointV2,
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

async function rehashV1(value: Record<string, any>): Promise<void> {
  const { checkpointSha256: _discarded, ...payload } = value;
  value.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}

function cloneV1<T>(value: T): T {
  return structuredClone(value);
}
