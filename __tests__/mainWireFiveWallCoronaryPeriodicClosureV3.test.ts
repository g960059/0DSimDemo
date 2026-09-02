import { describe, expect, it } from "vitest";

import { NON_CORONARY_CIRCULATION_BE_V1_ID } from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  CORONARY_ACCEPTED_AUTOREGULATION_STATE_V3_ID,
  createCoronaryAutoregulationWindowBindingV3,
  createDefaultCoronaryAutoregulationWindowControlV3,
  type CoronaryAcceptedAutoregulationStateV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import type { CoronaryConservedVolumeStateV2 } from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import { MAIN_WIRE_CORONARY_BOUNDARY_V2_ID } from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import { CORONARY_TOPOLOGY_ID_V2 } from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";
import { MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID } from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import { MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID } from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V3,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  assessMainWireFiveWallCoronarySinglePeriodClosureV3,
  classifyMainWireFiveWallCoronaryPeriodicityV3,
  compareMainWireFiveWallCoronaryAcceptedStatesV3,
  type MainWireFiveWallCoronaryPeriodicAcceptedStateV3,
  type MainWireFiveWallCoronaryPeriodicBeatObservationV3,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV3";
import type { MainWireFiveWallCoronaryPeriodicAcceptedStateV2 } from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import { WHOLE_HEART_MECHANICS_CONTRACT_V1_ID } from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("MainWireFiveWallCoronaryPeriodicClosureV3", () => {
  it("extends closure through every desired-control scalar and bound owner", () => {
    const report = compareMainWireFiveWallCoronaryAcceptedStatesV3(
      acceptedState({ revision: 300, timeSec: 3 }),
      acceptedState({ revision: 200, timeSec: 2 }),
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    );

    expect(report.baseClosure.overall).toMatchObject({
      numericEntryCount: 93,
      booleanEntryCount: 1,
      entryCount: 94,
    });
    expect(report.groups["coronary-autoregulation-window"]).toMatchObject({
      numericEntryCount: 29,
      booleanEntryCount: 2,
      entryCount: 31,
      maximumNormalizedDelta: 0,
    });
    expect(report.overall).toMatchObject({
      baseNumericEntryCount: 93,
      autoregulationNumericEntryCount: 29,
      numericEntryCount: 122,
      baseBooleanEntryCount: 1,
      autoregulationBooleanEntryCount: 2,
      booleanEntryCount: 3,
      entryCount: 125,
      maximumNormalizedDelta: 0,
    });
    expect(report.provenance).toMatchObject({
      autoregulationWindowIndexAdvance: 1,
      autoregulationWindowStartAcceptedTimeAdvanceSec: 1,
      autoregulationWindowStartRevisionAdvance: 100,
    });
    expect(
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V3,
    ).toMatchObject({
      autoregulationNumericStateCount: 29,
      numericClosureEntryCount: 122,
      hiddenBooleanClosureEntryCount: 3,
      totalClosureEntryCount: 125,
    });

    const single = assessMainWireFiveWallCoronarySinglePeriodClosureV3(
      report,
      1e-3,
    );
    expect(single.withinFullAcceptedStateTolerance).toBe(true);
    expect(single.period1EvidenceEstablished).toBe(false);
  });

  it("measures every desired-control scalar and gates its identity exactly", () => {
    const changedScalar = compareMainWireFiveWallCoronaryAcceptedStatesV3(
      acceptedState({
        revision: 300,
        timeSec: 3,
        desiredDemandScale: 1 + Number.EPSILON,
      }),
      acceptedState({ revision: 200, timeSec: 2 }),
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    );
    expect(changedScalar.overall.maximumNormalizedDelta)
      .toBe(Number.EPSILON);
    expect(changedScalar.overall.worstPath)
      .toContain("desiredControl.demandScaleByTerritoryLayer");

    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV3(
      acceptedState({
        revision: 300,
        timeSec: 3,
        desiredControlId: "another-exact-control-id",
      }),
      acceptedState({ revision: 200, timeSec: 2 }),
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    )).toThrow(/desired-control identity differs/);
  });

  it("fails closed when either sinus comparison boundary has a live accumulator", () => {
    const partial = acceptedState({
      revision: 350,
      timeSec: 3.5,
      acceptedDurationSec: 0.5,
    });
    expect(partial.coronaryAutoregulation.windowControl).not.toBeNull();
    expect(() =>
      compareMainWireFiveWallCoronaryAcceptedStatesV3(
        partial,
        acceptedState({ revision: 200, timeSec: 2 }),
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      ),
    ).toThrow(/accumulator is not empty/);
  });

  it("uses exact autoregulation binding and accepted-window revision gates", () => {
    expect(() =>
      compareMainWireFiveWallCoronaryAcceptedStatesV3(
        acceptedState({
          revision: 300,
          timeSec: 3,
          windowDurationSec: 0.5,
        }),
        acceptedState({ revision: 200, timeSec: 2 }),
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      ),
    ).toThrow(/binding compatibility differs/);

    expect(() =>
      compareMainWireFiveWallCoronaryAcceptedStatesV3(
        acceptedState({
          revision: 300,
          timeSec: 3,
          windowStartRevision: 299,
        }),
        acceptedState({ revision: 200, timeSec: 2 }),
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      ),
    ).toThrow(/step count differs from accepted revision/);
  });

  it("uses window provenance for large non-binary-period clock advances", () => {
    const windowDurationSec = 60 / 65;
    const referenceWindowIndex = 190;
    const referenceTimeSec = referenceWindowIndex * windowDurationSec;
    const currentTimeSec = (referenceWindowIndex + 1) * windowDurationSec;

    const report = compareMainWireFiveWallCoronaryAcceptedStatesV3(
      acceptedState({
        revision: 30_100,
        timeSec: currentTimeSec,
        windowDurationSec,
      }),
      acceptedState({
        revision: 30_000,
        timeSec: referenceTimeSec,
        windowDurationSec,
      }),
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
    );

    expect(report.provenance.autoregulationWindowIndexAdvance).toBe(1);
  });

  it("returns not-applicable for irregular rhythm before entering the P1 classifier", () => {
    const irregular = classifyMainWireFiveWallCoronaryPeriodicityV3({
      rhythmInterpretation: "irregular-rhythm-stationary",
    });
    expect(irregular).toEqual({
      applicability: "not-applicable",
      rhythmInterpretation: "irregular-rhythm-stationary",
      reason:
        "beat-periodic-P1-classification-is-undefined-for-irregular-rhythm",
      classification: null,
    });

    expect(() =>
      compareMainWireFiveWallCoronaryAcceptedStatesV3(
        acceptedState({
          revision: 300,
          timeSec: 3,
          rhythmInterpretation: "irregular-rhythm-stationary",
        }),
        acceptedState({
          revision: 200,
          timeSec: 2,
          rhythmInterpretation: "irregular-rhythm-stationary",
        }),
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
      ),
    ).toThrow(/not applicable to irregular rhythm/);
  });

  it("reuses consecutive P1 classification after validating V3 window chains", () => {
    const observations = [6, 7, 8].map((beatIndex) =>
      observation(beatIndex, closureAtBeat(beatIndex, 1, 5e-4)),
    );
    const result = classifyMainWireFiveWallCoronaryPeriodicityV3({
      rhythmInterpretation: "periodic-sinus-cycle-aligned",
      observations,
      options: CLASSIFIER_OPTIONS,
    });
    expect(result.applicability).toBe("applicable");
    if (result.applicability !== "applicable") return;
    expect(result.classification.status).toBe("period1-converged");
    expect(result.classification.evidenceBeatIndices).toEqual([6, 7, 8]);

    const discontinuous = [
      observation(6, closureAtBeat(6, 1, 5e-4)),
      observation(7, closureAtBeat(7, 2, 5e-4)),
    ];
    expect(() =>
      classifyMainWireFiveWallCoronaryPeriodicityV3({
        rhythmInterpretation: "periodic-sinus-cycle-aligned",
        observations: discontinuous,
        options: CLASSIFIER_OPTIONS,
      }),
    ).toThrow(/window provenance chain is discontinuous/);
  });
});

const PROTOCOL_IDENTITY_HASH = "a".repeat(64);
const CLASSIFIER_OPTIONS = Object.freeze({
  period1NormalizedTolerance: 1e-3,
  period2NormalizedTolerance: 1e-3,
  period2MinimumPeriod1NormalizedDelta: 1e-2,
  consecutiveBeats: 3,
});

type StateOptions = Readonly<{
  revision: number;
  timeSec: number;
  windowDurationSec?: number;
  windowStartRevision?: number;
  acceptedDurationSec?: number;
  rhythmInterpretation?:
    "periodic-sinus-cycle-aligned" | "irregular-rhythm-stationary";
  ladSubepicardialTone?: number;
  desiredControlId?: string;
  desiredDemandScale?: number;
}>;

function acceptedState(
  options: StateOptions,
): MainWireFiveWallCoronaryPeriodicAcceptedStateV3 {
  const base = acceptedBaseState(options);
  const windowDurationSec = options.windowDurationSec ?? 1;
  const interpretation =
    options.rhythmInterpretation ?? "periodic-sinus-cycle-aligned";
  const binding = createCoronaryAutoregulationWindowBindingV3({
    originAcceptedTimeSec: 0,
    durationSec: windowDurationSec,
    interpretation,
  });
  const windowIndex = Math.floor((options.timeSec + 1e-12) / windowDurationSec);
  const windowStartAcceptedTimeSec = windowIndex * windowDurationSec;
  const acceptedDurationSec = options.acceptedDurationSec ?? 0;
  const partial = acceptedDurationSec > 0;
  const defaultControl =
    createDefaultCoronaryAutoregulationWindowControlV3();
  const desiredControl = partial || windowIndex > 0
    ? Object.freeze({
      ...defaultControl,
      controlId: options.desiredControlId ?? defaultControl.controlId,
      demandScaleByTerritoryLayer:
        layerRecord(options.desiredDemandScale ?? 1),
    })
    : null;
  const autoregulation = Object.freeze({
    stateId: CORONARY_ACCEPTED_AUTOREGULATION_STATE_V3_ID,
    windowIndex,
    windowOriginAcceptedTimeSec: 0,
    windowStartAcceptedTimeSec,
    windowStartRevision:
      options.windowStartRevision ??
      (partial ? options.revision - 1 : options.revision),
    acceptedDurationSec,
    acceptedStepCount: partial ? 1 : 0,
    qmTimeIntegralMlByTerritoryLayer: layerRecord(partial ? 0.25 : 0),
    perfusionPressureTimeIntegralMmHgSecByTerritory: territoryRecord(
      partial ? 35 : 0,
    ),
    windowControl: partial
      ? defaultControl
      : null,
    desiredControl,
  }) satisfies CoronaryAcceptedAutoregulationStateV3;
  return Object.freeze({
    ...base,
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V3_ID,
    coronaryAutoregulationBinding: binding,
    coronaryAutoregulation: autoregulation,
  });
}

function acceptedBaseState(
  options: StateOptions,
): MainWireFiveWallCoronaryPeriodicAcceptedStateV2 {
  const fixedGlobalTotalBloodVolumeMl = 5600;
  const coronaryVolumeMlByNode = Object.freeze(
    Object.fromEntries(
      CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId) => [nodeId, 1]),
    ),
  ) as CoronaryConservedVolumeStateV2;
  const coronaryBloodVolumeMl = Object.values(coronaryVolumeMlByNode).reduce(
    (sum, volume) => sum + volume,
    0,
  );
  const fixedNodeVolumes = Object.freeze({
    LV: 120,
    LA: 50,
    RV: 130,
    RA: 55,
    Ao: 140,
    SA: 150,
    Art: 160,
    Cap: 170,
    VC: 190,
    PA: 80,
    PArt: 90,
    PCap: 100,
    PVen: 110,
    PVein: 120,
  });
  const nonSvBloodVolumeMl = Object.values(fixedNodeVolumes).reduce(
    (sum, volume) => sum + volume,
    0,
  );
  const nodeVolumesMl = Object.freeze({
    LV: fixedNodeVolumes.LV,
    LA: fixedNodeVolumes.LA,
    RV: fixedNodeVolumes.RV,
    RA: fixedNodeVolumes.RA,
    Ao: fixedNodeVolumes.Ao,
    SA: fixedNodeVolumes.SA,
    Art: fixedNodeVolumes.Art,
    Cap: fixedNodeVolumes.Cap,
    SV:
      fixedGlobalTotalBloodVolumeMl -
      coronaryBloodVolumeMl -
      nonSvBloodVolumeMl,
    VC: fixedNodeVolumes.VC,
    PA: fixedNodeVolumes.PA,
    PArt: fixedNodeVolumes.PArt,
    PCap: fixedNodeVolumes.PCap,
    PVen: fixedNodeVolumes.PVen,
    PVein: fixedNodeVolumes.PVein,
  });
  const wallStateByWall = Object.freeze({
    LA: wallState(),
    LVFW: wallState(),
    SEP: wallState(),
    RVFW: wallState(),
    RA: wallState(),
  });
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: options.revision,
    acceptedTimeSec: options.timeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: Object.freeze({
      topologyId: CORONARY_TOPOLOGY_ID_V2,
      priorFingerprint: "fnv1a32-11111111",
      collapseHydraulicsFingerprint: "fnv1a32-22222222",
      boundaryResolverId: MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
      impMechanism: "cep-shortening-induced" as const,
      shorteningImpPriorFingerprint: "fnv1a32-33333333",
      mvcReferenceSemantics:
        "previous-accepted-mitral-closure-fiber-strain-v1" as const,
    }),
    circulation: Object.freeze({
      transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      totalBloodVolumeMl: fixedGlobalTotalBloodVolumeMl - coronaryBloodVolumeMl,
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 10, PA_PArt: 8 }),
      valveStates: Object.freeze({
        MV: Object.freeze({ leafletOpeningFraction01: 0.2 }),
        AoV: Object.freeze({ leafletOpeningFraction01: 0.3 }),
        TV: Object.freeze({ leafletOpeningFraction01: 0.4 }),
        PV: Object.freeze({ leafletOpeningFraction01: 0.5 }),
      }),
    }),
    coronary: Object.freeze({
      acceptedTimeSec: options.timeSec,
      revision: options.revision,
      volumeMlByNode: coronaryVolumeMlByNode,
      toneResistanceScaleByTerritoryLayer: Object.freeze({
        LAD: Object.freeze({
          subepicardial: options.ladSubepicardialTone ?? 1,
          subendocardial: 1,
        }),
        LCx: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
        RCA: Object.freeze({ subepicardial: 1, subendocardial: 1 }),
      }),
    }),
    mechanics: Object.freeze({
      contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
      providerId: "test-five-wall-provider-v1",
      parameterSetId: "test-five-wall-prior-v1",
      parameterIdentityHash: "same-provider-parameters",
      stateSchemaVersion: 2,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      acceptedVolumesMl: Object.freeze({
        LA: nodeVolumesMl.LA,
        LV: nodeVolumesMl.LV,
        RA: nodeVolumesMl.RA,
        RV: nodeVolumesMl.RV,
      }),
      materialState: Object.freeze({
        wallStateByWall,
        trisegCoordinates: Object.freeze({
          septalMidwallCapVolumeM3: 42e-6,
          junctionRadiusM: 0.033,
        }),
      }),
      materialStateFingerprint: "test-fingerprint",
    }),
    mvcReferenceState: Object.freeze({
      reference: Object.freeze({
        referenceFiberLogStrainByWall: Object.freeze({
          LVFW: 0.1,
          SEP: 0.08,
          RVFW: 0.06,
        }),
      }),
      referenceAcceptedTimeSec: Math.max(0, options.timeSec - 0.1),
      referenceRevision: Math.max(0, options.revision - 10),
      mitralForwardFlowActive: false,
      acceptedMitralClosureEventCount: Math.floor(options.timeSec),
    }),
  });
}

function wallState() {
  return Object.freeze({
    landState: Float64Array.from([0.18, 0.22, 0.04, 0.02, 0, 0]),
    slsState: Object.freeze({ viscousLogStrain: 0.01 }),
    previousFiberLogStrain: 0.01,
    previousFreeCalciumUM: 0.1,
  });
}

function closureAtBeat(
  beatIndex: number,
  period: 1 | 2,
  maximumNormalizedDelta: number,
) {
  return compareMainWireFiveWallCoronaryAcceptedStatesV3(
    acceptedState({
      revision: beatIndex * 100,
      timeSec: beatIndex,
      ladSubepicardialTone: 1 + maximumNormalizedDelta,
    }),
    acceptedState({
      revision: (beatIndex - period) * 100,
      timeSec: beatIndex - period,
    }),
    MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V3,
  );
}

function observation(
  beatIndex: number,
  period1: ReturnType<typeof closureAtBeat>,
): MainWireFiveWallCoronaryPeriodicBeatObservationV3 {
  return Object.freeze({
    beatIndex,
    evidenceRole: "canonical-periodic-protocol" as const,
    protocolIdentityHash: PROTOCOL_IDENTITY_HASH,
    period1,
    period2: null,
  });
}

function layerRecord(value: number): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(
    Object.fromEntries(
      CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
        territoryId,
        Object.freeze(
          Object.fromEntries(
            CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, value]),
          ),
        ),
      ]),
    ),
  ) as CoronaryTerritoryLayerRecordV2<number>;
}

function territoryRecord(value: number): CoronaryTerritoryRecordV2<number> {
  return Object.freeze(
    Object.fromEntries(
      CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId, value]),
    ),
  ) as CoronaryTerritoryRecordV2<number>;
}
