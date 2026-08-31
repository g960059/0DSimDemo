import { describe, expect, it } from "vitest";

import {
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelMechanismResearchInputsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
  validateMainWireIntegratedModelStandard66CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
  type MainWireIntegratedModelStandard66OutputIdV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard66OutputRegistryV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID,
  MainWireIntegratedModelStandard66TypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedModelStandard66TypedAuthoritySessionV1";
import {
  decodeCanonicalFlatCheckpointV1,
  encodeCanonicalFlatCheckpointV1,
} from "@/engine/vnext/CanonicalFlatDataV1";

const PROXIMAL_PRESSURE_SIGNAL =
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1[0]!;
const LOCAL_GRADIENT_SIGNAL =
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1[1]!;
const VENA_CONTRACTA_SIGNAL =
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1[2]!;
const FORWARD_FLOW_DURATION_METRIC =
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1.at(-1)!;

describe("Main Wire integrated Standard66 typed-authority Session V1", () => {
  it("composes cold Standard65 semantics with an unavailable selected overlay in request order", async () => {
    const session =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
    expect(session.standard66SessionId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_TYPED_AUTHORITY_SESSION_V1_ID,
    );

    const requested = [
      PROXIMAL_PRESSURE_SIGNAL,
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[0]!,
      FORWARD_FLOW_DURATION_METRIC,
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[4]!,
    ] as const;
    const composed = session.projectCurrentAcceptedStandard66ValuesV1(
      requested,
    );
    expect(Object.keys(composed)).toEqual(requested);

    const base = session.projectCurrentAcceptedValuesV1([
      requested[1],
      requested[3],
    ]);
    expect(composed[requested[1]]).toEqual(base[requested[1]]);
    expect(composed[requested[3]]).toEqual(base[requested[3]]);
    for (const outputId of [requested[0], requested[2]]) {
      expect(composed[outputId]).toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }

    const coldAll = session.projectCurrentAcceptedStandard66ValuesV1(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
    );
    const coldBase = session.projectCurrentAcceptedValuesV1(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
    );
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3) {
      expect(coldAll[outputId]).toEqual(coldBase[outputId]);
    }
    for (const outputId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1) {
      expect(coldAll[outputId]).toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }
  });

  it("projects every requested base and overlay output after an accepted step and fails closed before invalid requests mutate state", async () => {
    const session =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
    const all =
      session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        0.002,
        MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
      );
    expect(all.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    expect(all.projectedValues).not.toBeNull();
    expect(Object.keys(all.projectedValues!)).toEqual(
      MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
    );
    for (const outputId of [
      PROXIMAL_PRESSURE_SIGNAL,
      LOCAL_GRADIENT_SIGNAL,
      VENA_CONTRACTA_SIGNAL,
    ]) {
      expect(all.projectedValues![outputId]).toMatchObject({
        availability: "available",
        quality: "accepted-derived",
      });
      expect(Number.isFinite(all.projectedValues![outputId]!.value)).toBe(true);
    }
    for (const outputId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1.slice(3)) {
      expect(all.projectedValues![outputId]).toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
      });
    }

    const acceptedBeforeInvalidRequest = session.currentAcceptedState();
    expect(() =>
      session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        0.004,
        ["unknown.standard66.output" as
          MainWireIntegratedModelStandard66OutputIdV1],
      ),
    ).toThrow(/is not registered/);
    expect(session.currentAcceptedState().revision).toBe(
      acceptedBeforeInvalidRequest.revision,
    );
    expect(session.currentAcceptedState().acceptedTimeSec).toBe(
      acceptedBeforeInvalidRequest.acceptedTimeSec,
    );
    expect(() => session.projectCurrentAcceptedStandard66ValuesV1([
      PROXIMAL_PRESSURE_SIGNAL,
      PROXIMAL_PRESSURE_SIGNAL,
    ])).toThrow(/duplicated/);
  });

  it("publishes selected completed-beat metrics and owns a Standard66 object checkpoint without a 76-f64 image", async () => {
    const session =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
    let acceptedTimeSec = 0;
    let durationAvailable = false;
    for (let index = 0; index < 960 && !durationAvailable; index += 1) {
      acceptedTimeSec += 0.002;
      const advanced =
        session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          acceptedTimeSec,
          [FORWARD_FLOW_DURATION_METRIC],
        );
      if (advanced.advance.status !== "advanced") {
        throw new Error("Standard66 completed-beat fixture did not advance");
      }
      durationAvailable =
        advanced.projectedValues![FORWARD_FLOW_DURATION_METRIC]!.availability
          === "available";
    }
    expect(durationAvailable).toBe(true);
    const completed = session.projectCurrentAcceptedStandard66ValuesV1(
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
    );
    for (const outputId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1) {
      expect(completed[outputId].availability).toBe("available");
    }

    const checkpoint = await session.checkpointStandard66Exact();
    expect(checkpoint).toMatchObject({
      checkpointId: MAIN_WIRE_INTEGRATED_MODEL_STANDARD66_CHECKPOINT_V1_ID,
      schemaVersion: 1,
      revision: session.currentAcceptedState().revision,
      acceptedTimeSec: session.currentAcceptedState().acceptedTimeSec,
    });
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(checkpoint),
    ).resolves.toEqual(checkpoint);
    expect(JSON.stringify(checkpoint)).not.toContain(
      "acceptedNumericalReadback",
    );

    const restored =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandard66ExactCheckpoint(checkpoint);
    expect(restored.currentAcceptedState())
      .toEqual(session.currentAcceptedState());
    expect(restored.coupledPredictorReport()).toMatchObject({
      hasAcceptedPair: false,
      historyDepth: 0,
    });
    expect(await restored.checkpointStandard66Exact()).toEqual(checkpoint);
    const restoredSelected = restored.projectCurrentAcceptedStandard66ValuesV1(
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
    );
    for (const outputId of [
      PROXIMAL_PRESSURE_SIGNAL,
      LOCAL_GRADIENT_SIGNAL,
      VENA_CONTRACTA_SIGNAL,
    ]) {
      expect(restoredSelected[outputId]).toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
      });
    }
    for (const outputId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1.slice(3)) {
      expect(restoredSelected[outputId].availability).toBe("available");
    }
    const restoredBase = restored.projectCurrentAcceptedStandard66ValuesV1([
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[0]!,
    ]);
    expect(restoredBase[MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[0]!]
      .availability).toBe("available");
    const firstPostRestore =
      restored.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        checkpoint.acceptedTimeSec + 0.002,
        MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
      );
    expect(firstPostRestore.advance.status).toBe("advanced");
    for (const outputId of
      MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1) {
      expect(firstPostRestore.projectedValues![outputId].availability)
        .toBe("available");
    }

    await expect(session.checkpointStandardExact())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
    await expect(session.checkpointCanonicalBinary())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
    await expect(session.warmStartWithHemodynamicResearchInputs(
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    )).rejects.toThrow(/unavailable for the selected aortic Session owner/);
  }, 30_000);

  it("keeps inherited Standard65 restore factories fail-closed", async () => {
    await expect(
      MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandardExactCheckpoint({}),
    ).rejects.toThrow(/Standard65 restore cannot own the selected model/);
    await expect(
      MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreCanonicalBinary(new Uint8Array()),
    ).rejects.toThrow(/Standard65 restore cannot own the selected model/);
  });

  it("captures one synchronized base and selected epoch before its first digest await", async () => {
    const session =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
    for (let ordinal = 1; ordinal <= 433; ordinal += 1) {
      session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        ordinal * 0.002,
        [],
      );
    }
    const firstCapture =
      session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
        0.87,
        [],
      );
    expect(firstCapture.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.87,
      internalAcceptedSubstepCount: 2,
      boundaryClippedSubstepCount: 1,
    });
    const capturedClock = session.currentAcceptedState();
    const checkpointPromise = session.checkpointStandard66Exact();

    // Both active-beat owners must detach their previous sample before this
    // synchronous post-capture step runs while the digest remains pending.
    session.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
      0.872,
      [],
    );
    const checkpoint = await checkpointPromise;
    expect(checkpoint).toMatchObject({
      revision: capturedClock.revision,
      acceptedTimeSec: 0.87,
      baseStandardCheckpointV2: {
        revision: capturedClock.revision,
        acceptedTimeSec: 0.87,
      },
    });
    const baseActive =
      checkpoint.baseStandardCheckpointV2.beatAccumulator.active;
    const selectedActive = checkpoint.selectedAorticPortExactBeatState
      .selectedBeatAccumulator.active;
    expect(baseActive).not.toBeNull();
    expect(selectedActive).not.toBeNull();
    expect(baseActive!.previous.timeSec).toBe(checkpoint.acceptedTimeSec);
    expect(selectedActive!.previous.timeSec).toBe(checkpoint.acceptedTimeSec);
    expect(selectedActive!.previous.timeSec).toBe(
      baseActive!.previous.timeSec,
    );
    expect(session.currentAcceptedState()).toMatchObject({
      revision: capturedClock.revision + 1,
      acceptedTimeSec: 0.872,
    });
    await expect(
      validateMainWireIntegratedModelStandard66CheckpointV1(checkpoint),
    ).resolves.toEqual(checkpoint);
  });

  it("owns canonical bytes and continues exactly through an event boundary", async () => {
    const previousTier = hotPathIntegrityTierV1();
    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      const source =
        await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
      for (let ordinal = 1; ordinal <= 433; ordinal += 1) {
        const advanced =
          source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
            ordinal * 0.002,
            [],
          );
        expect(advanced.advance.status).toBe("advanced");
      }
      expect(source.currentAcceptedState().acceptedTimeSec).toBe(0.866);
      expect(source.coupledPredictorReport().historyDepth).toBe(4);

      const first = await source.checkpointStandard66CanonicalBinaryV3();
      const second = await source.checkpointStandard66CanonicalBinaryV3();
      expect(second).toEqual(first);
      const callerBytes = first.slice();
      const callerInputs = {
        ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      };
      const callerMechanism = structuredClone(
        MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_MECHANISM_RESEARCH_INPUTS_V3,
      );
      const restorePromise =
        MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(
            callerBytes,
            callerInputs,
            1,
            callerMechanism,
          );
      callerBytes.fill(0);
      callerInputs.totalBloodVolumeMl = 5_650;
      (callerMechanism as { inputId: string }).inputId = "mutated-after-call";
      const restored = await restorePromise;
      expect(restored.currentAcceptedState())
        .toEqual(source.currentAcceptedState());
      expect(await restored.checkpointStandard66CanonicalBinaryV3())
        .toEqual(first);

      const targetAcrossEvent = 0.872;
      const uninterrupted =
        source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          targetAcrossEvent,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      const continued =
        restored.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          targetAcrossEvent,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      expect(continued.advance).toEqual(uninterrupted.advance);
      expect(continued.projectedValues).toEqual(uninterrupted.projectedValues);
      expect(restored.snapshotAcceptedStateBytes())
        .toEqual(source.snapshotAcceptedStateBytes());

      const uninterruptedPostBoundary =
        source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          0.874,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      const continuedPostBoundary =
        restored.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          0.874,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      expect(continuedPostBoundary.advance)
        .toEqual(uninterruptedPostBoundary.advance);
      expect(continuedPostBoundary.projectedValues)
        .toEqual(uninterruptedPostBoundary.projectedValues);
      expect(source.coupledPredictorReport().historyDepth).toBeGreaterThan(0);
      const capturedStateBytes = source.snapshotAcceptedStateBytes();
      const inFlightCheckpoint = source.checkpointStandard66CanonicalBinaryV3();
      const liveAdvance =
        source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          0.876,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      const capturedCheckpoint = await inFlightCheckpoint;
      const captured =
        await MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(capturedCheckpoint);
      expect(captured.currentAcceptedState().acceptedTimeSec).toBe(0.874);
      expect(captured.snapshotAcceptedStateBytes()).toEqual(capturedStateBytes);
      const capturedContinuation =
        captured.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          0.876,
          MAIN_WIRE_INTEGRATED_MODEL_STANDARD_66_OUTPUT_IDS_V1,
        );
      expect(capturedContinuation.advance).toEqual(liveAdvance.advance);
      expect(capturedContinuation.projectedValues).toEqual(
        liveAdvance.projectedValues,
      );
      expect(captured.snapshotAcceptedStateBytes())
        .toEqual(source.snapshotAcceptedStateBytes());
    } finally {
      selectHotPathIntegrityTierV1(previousTier);
    }
  }, 120_000);

  it("rejects semantic predictor drift, binary tamper, and legacy canonical schemas", async () => {
    const previousTier = hotPathIntegrityTierV1();
    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      const source =
        await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create();
      for (let ordinal = 1; ordinal <= 5; ordinal += 1) {
        source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
          ordinal * 0.002,
          [],
        );
      }
      expect(source.coupledPredictorReport().historyDepth).toBe(4);
      const canonical = await source.checkpointStandard66CanonicalBinaryV3();
      const decoded = await decodeCanonicalFlatCheckpointV1(canonical) as {
        coupledPredictor: {
          expectedBaseAcceptedTimeSec: number;
          currentAcceptedMl: number[];
        };
      } & Record<string, unknown>;

      const wrongClock = await encodeCanonicalFlatCheckpointV1({
        ...decoded,
        coupledPredictor: {
          ...decoded.coupledPredictor,
          expectedBaseAcceptedTimeSec:
            decoded.coupledPredictor.expectedBaseAcceptedTimeSec + 0.002,
        },
      });
      await expect(
        MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(wrongClock),
      ).rejects.toThrow(/predictor clock differs/);

      const wrongRoot = [...decoded.coupledPredictor.currentAcceptedMl];
      wrongRoot[0] += 1e-6;
      const rootDrift = await encodeCanonicalFlatCheckpointV1({
        ...decoded,
        coupledPredictor: {
          ...decoded.coupledPredictor,
          currentAcceptedMl: wrongRoot,
        },
      });
      await expect(
        MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(rootDrift),
      ).rejects.toThrow(/predictor checkpoint root differs/);

      const bitTamper = canonical.slice();
      bitTamper[20] ^= 0x80;
      await expect(
        MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(bitTamper),
      ).rejects.toThrow(/SHA-256 mismatch/);

      const legacy = await encodeCanonicalFlatCheckpointV1({
        checkpointId:
          "circleheart-main-wire-flat-authoritative-reference-checkpoint-v2",
        schemaVersion: 2,
        standardCheckpoint: {},
        coupledPredictor: {},
      });
      await expect(
        MainWireIntegratedModelStandard66TypedAuthoritySessionV1
          .restoreStandard66CanonicalBinaryV3(legacy),
      ).rejects.toThrow(/unexpected fields|unsupported/);
    } finally {
      selectHotPathIntegrityTierV1(previousTier);
    }
  }, 30_000);

  it("binds object restore to the requested nondefault fixture identity", async () => {
    const nondefaultInputs = Object.freeze({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      totalBloodVolumeMl: 5_650,
    });
    const source =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1.create(
        nondefaultInputs,
      );
    source.advanceToPresentationTimeWithStandard66SelectedOutputProjectionV1(
      0.002,
      [],
    );
    const checkpoint = await source.checkpointStandard66Exact();
    await expect(
      MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandard66ExactCheckpoint(checkpoint),
    ).rejects.toThrow(/hemodynamic research input SHA-256 identity mismatch/);
    const restored =
      await MainWireIntegratedModelStandard66TypedAuthoritySessionV1
        .restoreStandard66ExactCheckpoint(checkpoint, nondefaultInputs);
    expect(restored.currentAcceptedState()).toEqual(source.currentAcceptedState());
  });
});
