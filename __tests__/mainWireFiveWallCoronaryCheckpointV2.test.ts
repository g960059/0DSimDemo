import { describe, expect, it } from "vitest";

import {
  createInitialNonCoronaryCirculationStateV1,
  resolveNonCoronaryCirculationColdSeedV1,
  type NonCoronaryCirculationRuntimeParamsV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { defaultParams } from "@/engine/core/params";
import {
  CoronaryBackwardEulerTransactionV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
  NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2,
} from "@/engine/coronary/mainWireNormalAdultCoronaryV2";
import {
  buildCoronaryTopologyV2,
  coronaryConfigurationFingerprintV2,
  coronaryTopologyPriorFingerprintV2,
  createColdCoronaryConstructionSeedV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  checkpointMainWireFiveWallCoronaryV2,
  restoreMainWireFiveWallCoronaryV2,
  type MainWireFiveWallCoronaryCheckpointContextV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryCheckpointV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
  type MainWireFiveWallCoronaryAcceptedStateV2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import type {
  MainWireFiveWallFreeCalciumDriveV1,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
  initializeWholeHeartMechanicsColdV1,
  type WholeHeartMechanicsProviderV1,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";
import {
  MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
} from "@/engine/valves/MainWireFourValveDiseaseResearchBracketsV1";
import { sha256CanonicalJsonHex } from "@/engine/integrity";

type TestWallState = Readonly<{
  history: readonly number[];
  clockSec: number;
}>;

describe("main-wire five-wall coronary accepted-tuple checkpoint V2", () => {
  it("round-trips the complete 31-volume, six-tone accepted tuple", async () => {
    const fixture = acceptedFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV2(
      fixture.context,
      fixture.state,
    );
    const serialized = JSON.parse(JSON.stringify(checkpoint)) as unknown;
    const restored = await restoreMainWireFiveWallCoronaryV2(
      fixture.context,
      serialized,
    );

    expect(restored).toEqual(fixture.state);
    expect(Object.keys(restored.circulation.nodeVolumesMl)).toHaveLength(15);
    expect(Object.keys(restored.coronary.volumeMlByNode)).toHaveLength(16);
    expect(CORONARY_TERRITORY_IDS_V2.flatMap((territoryId) =>
      CORONARY_LAYER_IDS_V2.map((layerId) =>
        restored.coronary.toneResistanceScaleByTerritoryLayer[territoryId][layerId]
      ))).toHaveLength(6);
    expect(checkpoint.checkpointSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(checkpoint).not.toHaveProperty("exactResumeClaim");
  });

  it("binds every accepted owner with the outer SHA-256", async () => {
    const fixture = acceptedFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV2(
      fixture.context,
      fixture.state,
    );
    const mutations: readonly ((value: any) => void)[] = [
      (value) => { value.fixedGlobalTotalBloodVolumeMl += 1; },
      (value) => { value.circulation.state.nodeVolumesMl.Ao += 1; },
      (value) => { value.coronary.acceptedState.volumeMlByNode["LAD.Art"] += 1; },
      (value) => {
        value.coronary.acceptedState
          .toneResistanceScaleByTerritoryLayer.LAD.subendocardial += 0.1;
      },
      (value) => { value.mechanics.materialState.history[0] += 1; },
      (value) => {
        value.mvcReferenceState.reference
          .referenceFiberLogStrainByWall.LVFW += 0.01;
      },
      (value) => { value.coronaryBinding.impMechanism = "cep-only-control"; },
    ];
    for (const mutate of mutations) {
      const tampered = JSON.parse(JSON.stringify(checkpoint));
      mutate(tampered);
      await expect(restoreMainWireFiveWallCoronaryV2(
        fixture.context,
        tampered,
      )).rejects.toThrow(/SHA-256 mismatch/);
    }
  });

  it("rejects a rehashed nested tamper and a valid checkpoint under another binding", async () => {
    const fixture = acceptedFixture();
    const checkpoint = await checkpointMainWireFiveWallCoronaryV2(
      fixture.context,
      fixture.state,
    );
    const tampered = JSON.parse(JSON.stringify(checkpoint));
    tampered.circulation.state.dynamicEdgeFlowsMlPerSec.Ao_SA += 1;
    const { checkpointSha256: _oldSha, ...payload } = tampered;
    tampered.checkpointSha256 = await sha256CanonicalJsonHex(payload);
    await expect(restoreMainWireFiveWallCoronaryV2(
      fixture.context,
      tampered,
    )).rejects.toThrow(/circulation checkpoint fingerprint mismatch/);

    const anotherContext = Object.freeze({
      ...fixture.context,
      impMechanism: "cep-only-control" as const,
    });
    await expect(restoreMainWireFiveWallCoronaryV2(
      anotherContext,
      checkpoint,
    )).rejects.toThrow(/binding mismatch/);
  });

  it("rejects old/noncoronary and scientific-V3-like checkpoint schemas", async () => {
    const fixture = acceptedFixture();
    await expect(restoreMainWireFiveWallCoronaryV2(
      fixture.context,
      {
        checkpointId: "main-wire-five-wall-noncoronary-checkpoint-v1",
        schemaVersion: 1,
      },
    )).rejects.toThrow(/unsupported.*schema/);
    await expect(restoreMainWireFiveWallCoronaryV2(
      fixture.context,
      {
        checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
        schemaVersion: 3,
      },
    )).rejects.toThrow(/unsupported.*schema/);
  });

  it("rejects a runtime-cast unknown IMP mechanism before checkpointing", async () => {
    const fixture = acceptedFixture();
    const invalidContext = {
      ...fixture.context,
      impMechanism: "unknown-imp-mechanism",
    } as unknown as typeof fixture.context;
    await expect(checkpointMainWireFiveWallCoronaryV2(
      invalidContext,
      fixture.state,
    )).rejects.toThrow(/unsupported.*IMP mechanism/);
  });
});

function acceptedFixture(): Readonly<{
  context: MainWireFiveWallCoronaryCheckpointContextV2<TestWallState>;
  state: MainWireFiveWallCoronaryAcceptedStateV2<TestWallState>;
}> {
  const provider = testProvider();
  const runtime = testRuntime();
  const nonCoronarySeed = resolveNonCoronaryCirculationColdSeedV1(runtime);
  const circulation = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
    fixedTotalBloodVolumeMl: nonCoronarySeed.fixedTotalBloodVolumeMl,
    nodeVolumesMl: nonCoronarySeed.nodeVolumesMl,
  });
  const mechanics = initializeWholeHeartMechanicsColdV1(provider, {
    timeSec: 0,
    volumesMl: {
      LA: circulation.nodeVolumesMl.LA,
      LV: circulation.nodeVolumesMl.LV,
      RA: circulation.nodeVolumesMl.RA,
      RV: circulation.nodeVolumesMl.RV,
    },
    drivingInputs: testDrive(),
  }).acceptedState;
  const prior = MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_PRIOR_V2;
  const topology = buildCoronaryTopologyV2(prior);
  const seed = createColdCoronaryConstructionSeedV2(prior);
  const coronary = new CoronaryBackwardEulerTransactionV2(
    prior,
    {
      acceptedTimeSec: 0,
      revision: 0,
      volumeMlByNode: seed.volumeMlByNode,
      toneResistanceScaleByTerritoryLayer:
        seed.initialToneResistanceScaleByTerritoryLayer,
    },
    topology,
    MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
  ).getAcceptedState();
  const context = Object.freeze({
    provider,
    coronaryPrior: prior,
    collapseHydraulics:
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPrior:
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
  });
  const coronaryBinding = Object.freeze({
    topologyId: prior.topologyId,
    priorFingerprint: coronaryTopologyPriorFingerprintV2(prior),
    collapseHydraulicsFingerprint: coronaryConfigurationFingerprintV2(
      MAIN_WIRE_PROVISIONAL_NORMAL_ADULT_CORONARY_COLLAPSE_V2,
    ),
    boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
    impMechanism: "cep-shortening-induced" as const,
    shorteningImpPriorFingerprint: coronaryConfigurationFingerprintV2(
      NORMAL_ADULT_CORONARY_SHORTENING_IMP_GAIN_PRIOR_V2,
    ),
    mvcReferenceSemantics:
      "previous-accepted-mitral-closure-fiber-strain-v1" as const,
  });
  const coronaryVolumeMl = CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.reduce(
    (sum, nodeId) => sum + coronary.volumeMlByNode[nodeId],
    0,
  );
  const state = Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: 0,
    acceptedTimeSec: 0,
    fixedGlobalTotalBloodVolumeMl:
      circulation.totalBloodVolumeMl + coronaryVolumeMl,
    coronaryBinding,
    circulation,
    coronary,
    mechanics,
    mvcReferenceState: Object.freeze({
      reference: Object.freeze({
        referenceFiberLogStrainByWall: Object.freeze({
          LVFW: 0.12,
          SEP: 0.1,
          RVFW: 0.11,
        }),
      }),
      referenceAcceptedTimeSec: 0,
      referenceRevision: 0,
      mitralForwardFlowActive: false,
      acceptedMitralClosureEventCount: 0,
    }),
  }) satisfies MainWireFiveWallCoronaryAcceptedStateV2<TestWallState>;
  return Object.freeze({ context, state });
}

function testRuntime(): NonCoronaryCirculationRuntimeParamsV1 {
  const params = defaultParams();
  return Object.freeze({
    vascular: Object.freeze({
      venousTone: params.venousTone,
      arterialStiffness: params.arterialStiffness,
    }),
    losses: Object.freeze({
      systemicResistance: params.systemicResistance,
      pulmonaryResistance: params.pulmonaryResistance,
    }),
    respiratory: Object.freeze({
      PEEP: 0,
      Pth0: -3,
      respAmpTh: 0,
      respAmpAlv: 0,
      respRate: 0,
    }),
    valveResearchInput: MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1,
  });
}

function testDrive(): MainWireFiveWallFreeCalciumDriveV1 {
  return Object.freeze({
    freeCalciumUMByWall: Object.freeze({
      LA: 0,
      LVFW: 0,
      SEP: 0,
      RVFW: 0,
      RA: 0,
    }),
  });
}

function testProvider(): WholeHeartMechanicsProviderV1<
  TestWallState,
  MainWireFiveWallFreeCalciumDriveV1
> {
  const evaluation = (volumes: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>, timeSec: number) => ({
    materialState: Object.freeze({ history: Object.freeze([1, 2, 3]), clockSec: timeSec }),
    transmuralPressuresMmHg: Object.freeze({
      LA: volumes.LA / 10,
      LV: volumes.LV / 10,
      RA: volumes.RA / 10,
      RV: volumes.RV / 10,
    }),
    diagnostics: Object.freeze({
      converged: true,
      finite: true,
      iterationCount: 0,
      residualNorm: 0,
      errors: Object.freeze([]),
      warnings: Object.freeze([]),
      readback: null,
    }),
  });
  return Object.freeze({
    contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
    providerId: "checkpoint-v2-test-provider",
    parameterSetId: "checkpoint-v2-test-prior",
    parameterIdentityHash: "checkpoint-v2-test-parameters-sha256",
    stateSchemaVersion: 1,
    stateCodec: Object.freeze({
      clone: (state: TestWallState): TestWallState => Object.freeze({
        history: Object.freeze([...state.history]),
        clockSec: state.clockSec,
      }),
      encode: (state: TestWallState) => ({
        history: [...state.history],
        clockSec: state.clockSec,
      }),
      decode: (encoded) => {
        const value = encoded as { history: readonly number[]; clockSec: number };
        return Object.freeze({
          history: Object.freeze([...value.history]),
          clockSec: value.clockSec,
        });
      },
    }),
    initializeCold: ({ volumesMl, timeSec }) => evaluation(volumesMl, timeSec),
    evaluateTrial: ({ candidateVolumesMl, candidateTimeSec }) =>
      evaluation(candidateVolumesMl, candidateTimeSec),
  });
}
