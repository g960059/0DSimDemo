import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
} from "@/engine/valves/MainWireAorticRecoveredRootPortValveV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1,
  MainWireSelectedAorticPortSessionExtensionV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

describe("Main Wire selected aortic-port Session extension V1", () => {
  it("owns only transactional instantaneous readback and no beat checkpoint", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    expect(MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1)
      .toMatchObject({
        modelOwnerScope: "standard-66-only",
        legacyStandard65InstantiatesExtension: false,
        acceptedHemodynamicStateAdded: false,
        instantaneousReadbackCheckpointed: false,
        exactBeatAnalysisStateCheckpointed: false,
      });
    expect(extension.acceptedReadbackClockV1()).toBeNull();
    expect(extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0, revision: 0 },
      () => "unexpected",
    )).toBeNull();
    extension.assertReadyForExactCheckpointV1();
  });

  it("keeps aborted candidates unavailable and guards an open ticket", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const ticket = stageV1(extension, 0.1, 1, 88, 7, 6);
    expect(() => extension.assertReadyForExactCheckpointV1())
      .toThrow(/open ticket/);
    expect(() => stageV1(extension, 0.2, 2, 89, 8, 7))
      .toThrow(/already open/);
    ticket.close();
    ticket.close();
    extension.assertReadyForExactCheckpointV1();
    expect(extension.acceptedReadbackClockV1()).toBeNull();
  });

  it("publishes the selected 76-f64 readback only after a matching commit", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const historical = historicalReadbackV1(0.1);
    const ticket = extension.stageCandidateV1({
      expectedCandidateTimeSec: 0.1,
      expectedCandidateRevision: 1,
      candidateTimeSec: 0.1,
      candidateRevision: 1,
      historicalAcceptedNumericalReadback: historical,
      selectedAorticValveReadback: selectedReadbackV1(88, 7, 6),
    });
    historical.fill(999);
    ticket.promote({
      committedAcceptedTimeSec: 0.1,
      committedRevision: 1,
    });
    ticket.close();

    expect(extension.acceptedReadbackClockV1()).toEqual({
      acceptedTimeSec: 0.1,
      revision: 1,
    });
    expect(extension.withAcceptedReadbackV3(
      { acceptedTimeSec: 0.1, revision: 1 },
      (readback) => ({
        length: readback.length,
        timeSec: readback[
          MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec
        ],
        proximal: readback[
          MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
            .algebraicProximalConstitutivePortPressureMmHg
        ],
        local: readback[
          MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
            .localValvePressureGradientMmHg
        ],
        venaContracta: readback[
          MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
            .venaContractaBernoulliPressureMmHg
        ],
      }),
    )).toEqual({
      length: MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
      timeSec: 0.1,
      proximal: 88,
      local: 7,
      venaContracta: 6,
    });
  });

  it("fails closed on mismatched clocks and rejects legacy beat fields", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    expect(() => extension.stageCandidateV1({
      expectedCandidateTimeSec: 0.1,
      expectedCandidateRevision: 1,
      candidateTimeSec: 0.2,
      candidateRevision: 1,
      historicalAcceptedNumericalReadback: historicalReadbackV1(0.1),
      selectedAorticValveReadback: selectedReadbackV1(88, 7, 6),
    })).toThrow(/expected clock/);

    const ticket = stageV1(extension, 0.1, 1, 88, 7, 6);
    expect(() => ticket.promote({
      committedAcceptedTimeSec: 0.2,
      committedRevision: 1,
    })).toThrow(/committed clock/);
    expect(extension.acceptedReadbackClockV1()).toBeNull();
    ticket.close();

    const second = stageV1(extension, 0.1, 1, 88, 7, 6);
    expect(() => second.promote({
      committedAcceptedTimeSec: 0.1,
      committedRevision: 1,
      capturedAtrialActivationId: null,
      baseCompletedBeatMetrics: null,
    } as never)).toThrow(/unexpected field set/);
    second.close();
  });

  it("requires strictly advancing accepted time and revision", () => {
    const extension =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const first = stageV1(extension, 0.1, 1, 88, 7, 6);
    first.promote({
      committedAcceptedTimeSec: 0.1,
      committedRevision: 1,
    });
    expect(() => stageV1(extension, 0.1, 2, 89, 8, 7))
      .toThrow(/did not advance/);
    expect(() => stageV1(extension, 0.2, 1, 89, 8, 7))
      .toThrow(/did not advance/);
    const second = stageV1(extension, 0.2, 2, 89, 8, 7);
    second.promote({
      committedAcceptedTimeSec: 0.2,
      committedRevision: 2,
    });
    expect(extension.acceptedReadbackClockV1()).toEqual({
      acceptedTimeSec: 0.2,
      revision: 2,
    });
  });
});

function stageV1(
  extension: MainWireSelectedAorticPortSessionExtensionV1,
  timeSec: number,
  revision: number,
  proximal: number,
  local: number,
  venaContracta: number,
) {
  return extension.stageCandidateV1({
    expectedCandidateTimeSec: timeSec,
    expectedCandidateRevision: revision,
    candidateTimeSec: timeSec,
    candidateRevision: revision,
    historicalAcceptedNumericalReadback: historicalReadbackV1(timeSec),
    selectedAorticValveReadback:
      selectedReadbackV1(proximal, local, venaContracta),
  });
}

function historicalReadbackV1(timeSec: number): Float64Array {
  const readback = new Float64Array(
    MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V1,
  );
  readback[MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V1.timeSec] =
    timeSec;
  return readback;
}

function selectedReadbackV1(
  proximal: number,
  local: number,
  venaContracta: number,
) {
  return Object.freeze({
    modelId: MAIN_WIRE_AORTIC_RECOVERED_ROOT_PORT_VALVE_V1_ID,
    algebraicProximalConstitutivePortPressureMmHg: proximal,
    localValvePressureGradientMmHg: local,
    venaContractaBernoulliPressureMmHg: venaContracta,
  });
}
