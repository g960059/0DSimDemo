import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_OUTPUT_IDS_V1,
} from "@/engine/myocardium/MainWireAorticRecoveredRootPortOutputOverlayV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
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

    await expect(session.checkpointStandardExact())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
    await expect(session.checkpointCanonicalBinary())
      .rejects.toThrow(/unavailable for the selected aortic Session owner/);
    await expect(session.warmStartWithHemodynamicResearchInputs(
      MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
    )).rejects.toThrow(/unavailable for the selected aortic Session owner/);
  }, 30_000);

  it("shadows inherited Standard65 restore factories until Standard66 restore exists", async () => {
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
});
