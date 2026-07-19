import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_CIRCULATION_BE_V1_ID,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import type {
  CoronaryConservedVolumeStateV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  MAIN_WIRE_CORONARY_BOUNDARY_V2_ID,
} from "@/engine/coronary/mainWireCoronaryBoundaryV2";
import {
  CORONARY_TOPOLOGY_ID_V2,
} from "@/engine/coronary/topologyPriorV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
} from "@/engine/coronary/typesV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2,
  MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
  assessMainWireFiveWallCoronarySinglePeriodClosureV2,
  compareMainWireFiveWallCoronaryAcceptedStatesV2,
  type MainWireFiveWallCoronaryPeriodicAcceptedStateV2,
} from "@/engine/myocardium/experiments/MainWireFiveWallCoronaryPeriodicClosureV2";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("MainWireFiveWallCoronaryPeriodicClosureV2", () => {
  it("reports 68 legacy plus 25 coronary numeric states and one hidden phase boolean", () => {
    const reference = acceptedState({
      revision: 200,
      timeSec: 2,
      mvcReferenceRevision: 190,
      mvcReferenceTimeSec: 1.9,
      mitralClosureEventCount: 8,
    });
    const current = acceptedState({
      revision: 300,
      timeSec: 3,
      mvcReferenceRevision: 290,
      mvcReferenceTimeSec: 2.9,
      mitralClosureEventCount: 9,
    });
    const report = compareMainWireFiveWallCoronaryAcceptedStatesV2(
      current,
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    );

    expect(report.legacyClosure.overall.entryCount).toBe(68);
    expect(report.overall).toMatchObject({
      legacyNumericEntryCount: 68,
      coronaryNumericEntryCount: 25,
      numericEntryCount: 93,
      booleanEntryCount: 1,
      entryCount: 94,
      maximumNormalizedDelta: 0,
    });
    expect(report.groups["coronary-node-volume"].entryCount).toBe(16);
    expect(report.groups["coronary-tone"].entryCount).toBe(6);
    expect(report.groups["mvc-reference-strain"].entryCount).toBe(3);
    expect(report.groups["mvc-phase-memory"]).toMatchObject({
      numericEntryCount: 0,
      booleanEntryCount: 1,
      entryCount: 1,
      maximumNormalizedDelta: 0,
    });
    expect(report.provenance).toMatchObject({
      revisionAdvance: 100,
      elapsedTimeSec: 1,
      mvcReferenceRevisionAdvance: 100,
      mvcReferenceAcceptedTimeAdvanceSec: 1,
      mitralClosureEventCountAdvance: 1,
    });

    const assessment = assessMainWireFiveWallCoronarySinglePeriodClosureV2(
      report,
      1e-3,
    );
    expect(assessment.withinFullAcceptedStateTolerance).toBe(true);
    expect(assessment.period1EvidenceEstablished).toBe(false);
    expect(assessment.reason).toMatch(/separate-consecutive-beat-evidence/);
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
      .rapidSettlingBeatRange).toEqual([2, 5]);
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
      .rapidSettlingEvidenceRole).toBe("presentation-only");
    expect(MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_CLOSURE_CLAIM_V2
      .rapidSettlingCanEstablishP1).toBe(false);
  });

  it("refuses P1-tolerance closure when legacy 68-state matches but any coronary hidden owner drifts", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    const variants = Object.freeze([
      Object.freeze({
        label: "coronary volume redistribution",
        group: "coronary-node-volume" as const,
        state: acceptedState({
          revision: 300,
          timeSec: 3,
          coronaryVolumeRedistributionMl: 0.02,
        }),
      }),
      Object.freeze({
        label: "coronary tone",
        group: "coronary-tone" as const,
        state: acceptedState({
          revision: 300,
          timeSec: 3,
          ladSubepicardialTone: 1.02,
        }),
      }),
      Object.freeze({
        label: "MVC reference strain",
        group: "mvc-reference-strain" as const,
        state: acceptedState({
          revision: 300,
          timeSec: 3,
          mvcLvfwReferenceStrain: 0.122,
        }),
      }),
      Object.freeze({
        label: "mitral phase memory",
        group: "mvc-phase-memory" as const,
        state: acceptedState({
          revision: 300,
          timeSec: 3,
          mitralForwardFlowActive: true,
        }),
      }),
    ]);

    for (const variant of variants) {
      const report = compareMainWireFiveWallCoronaryAcceptedStatesV2(
        variant.state,
        reference,
        MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
      );
      expect(report.legacyClosure.overall.maximumNormalizedDelta,
        `${variant.label}: legacy state`).toBe(0);
      expect(report.groups[variant.group].maximumNormalizedDelta,
        variant.label).toBeGreaterThan(1e-3);
      expect(report.overall.worstGroup, variant.label).toBe(variant.group);
      const assessment = assessMainWireFiveWallCoronarySinglePeriodClosureV2(
        report,
        1e-3,
      );
      expect(assessment.withinFullAcceptedStateTolerance, variant.label)
        .toBe(false);
      expect(assessment.period1EvidenceEstablished, variant.label).toBe(false);
      expect(assessment.reason).toBe(
        "full-accepted-state-drift-exceeds-tolerance",
      );
    }
  });

  it("uses fixed dimensional scales and exposes a deterministic worst path", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    const current = acceptedState({
      revision: 300,
      timeSec: 3,
      coronaryVolumeRedistributionMl: 0.02,
      ladSubepicardialTone: 1.03,
      mvcLvfwReferenceStrain: 0.104,
      mitralForwardFlowActive: true,
    });
    const report = compareMainWireFiveWallCoronaryAcceptedStatesV2(
      current,
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    );

    expect(report.groups["coronary-node-volume"].maximumNormalizedDelta)
      .toBeCloseTo(0.02 / 1, 14);
    expect(report.groups["coronary-tone"].maximumNormalizedDelta)
      .toBeCloseTo(0.03 / 1, 14);
    expect(report.groups["mvc-reference-strain"].maximumNormalizedDelta)
      .toBeCloseTo(0.004 / 0.1, 14);
    expect(report.groups["mvc-phase-memory"].maximumNormalizedDelta).toBe(1);
    expect(report.overall.worstGroup).toBe("mvc-phase-memory");
    expect(report.overall.worstPath)
      .toBe("mvcReferenceState.mitralForwardFlowActive");
    expect(report.overall.worstEntry.kind).toBe("boolean");
  });

  it("uses binding, global TBV, and mechanics provider identity as exact compatibility gates", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({
        revision: 300,
        timeSec: 3,
        priorFingerprint: "fnv1a32-deadbeef",
      }),
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    )).toThrow(/binding compatibility differs/);
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({
        revision: 300,
        timeSec: 3,
        fixedGlobalTotalBloodVolumeMl: 5601,
      }),
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    )).toThrow(/fixed global TBV differs/);
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({
        revision: 300,
        timeSec: 3,
        parameterIdentityHash: "different-provider-parameters",
      }),
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    )).toThrow(/provider identity differs/);
  });

  it("requires monotonic metadata provenance but excludes it from closure deltas", () => {
    const reference = acceptedState({
      revision: 200,
      timeSec: 2,
      mvcReferenceRevision: 190,
      mvcReferenceTimeSec: 1.9,
      mitralClosureEventCount: 10,
    });
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({
        revision: 300,
        timeSec: 3,
        mvcReferenceRevision: 290,
        mvcReferenceTimeSec: 2.9,
        mitralClosureEventCount: 9,
      }),
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    )).toThrow(/provenance is not monotonic/);
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({
        revision: 199,
        timeSec: 1.99,
        mvcReferenceRevision: 189,
        mvcReferenceTimeSec: 1.89,
        mitralClosureEventCount: 10,
      }),
      reference,
      MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
    )).toThrow(/provenance is not monotonic/);
  });

  it("rejects nonpositive new reference scales", () => {
    expect(() => compareMainWireFiveWallCoronaryAcceptedStatesV2(
      acceptedState({ revision: 300, timeSec: 3 }),
      acceptedState({ revision: 200, timeSec: 2 }),
      {
        ...MAIN_WIRE_FIVE_WALL_CORONARY_PERIODIC_REFERENCE_SCALES_V2,
        coronaryToneResistanceScale: 0,
      },
    )).toThrow(/must be positive/);
  });
});

type StateOptions = Readonly<{
  revision: number;
  timeSec: number;
  fixedGlobalTotalBloodVolumeMl?: number;
  priorFingerprint?: string;
  parameterIdentityHash?: string;
  coronaryVolumeRedistributionMl?: number;
  ladSubepicardialTone?: number;
  mvcLvfwReferenceStrain?: number;
  mitralForwardFlowActive?: boolean;
  mvcReferenceRevision?: number;
  mvcReferenceTimeSec?: number;
  mitralClosureEventCount?: number;
}>;

function acceptedState(
  options: StateOptions,
): MainWireFiveWallCoronaryPeriodicAcceptedStateV2 {
  const fixedGlobalTotalBloodVolumeMl =
    options.fixedGlobalTotalBloodVolumeMl ?? 5600;
  const redistribution = options.coronaryVolumeRedistributionMl ?? 0;
  const coronaryVolumeMlByNode = Object.freeze(Object.fromEntries(
    CORONARY_CONSERVED_VOLUME_NODE_IDS_V2.map((nodeId, index) => [
      nodeId,
      index === 0 ? 1 + redistribution : index === 1
        ? 1 - redistribution
        : 1,
    ]),
  )) as CoronaryConservedVolumeStateV2;
  const coronaryBloodVolumeMl = Object.values(coronaryVolumeMlByNode)
    .reduce((sum, volume) => sum + volume, 0);
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
  const nonSvBloodVolumeMl = Object.values(fixedNodeVolumes)
    .reduce((sum, volume) => sum + volume, 0);
  const nodeVolumesMl = Object.freeze({
    LV: fixedNodeVolumes.LV,
    LA: fixedNodeVolumes.LA,
    RV: fixedNodeVolumes.RV,
    RA: fixedNodeVolumes.RA,
    Ao: fixedNodeVolumes.Ao,
    SA: fixedNodeVolumes.SA,
    Art: fixedNodeVolumes.Art,
    Cap: fixedNodeVolumes.Cap,
    SV: fixedGlobalTotalBloodVolumeMl - coronaryBloodVolumeMl
      - nonSvBloodVolumeMl,
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
  const mvcReferenceRevision = options.mvcReferenceRevision
    ?? Math.max(0, options.revision - 10);
  const mvcReferenceTimeSec = options.mvcReferenceTimeSec
    ?? Math.max(0, options.timeSec - 0.1);

  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V2_ID,
    revision: options.revision,
    acceptedTimeSec: options.timeSec,
    fixedGlobalTotalBloodVolumeMl,
    coronaryBinding: Object.freeze({
      topologyId: CORONARY_TOPOLOGY_ID_V2,
      priorFingerprint: options.priorFingerprint ?? "fnv1a32-11111111",
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
      totalBloodVolumeMl: fixedGlobalTotalBloodVolumeMl
        - coronaryBloodVolumeMl,
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec: Object.freeze({
        Ao_SA: 10,
        PA_PArt: 8,
      }),
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
      parameterIdentityHash:
        options.parameterIdentityHash ?? "same-provider-parameters",
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
          LVFW: options.mvcLvfwReferenceStrain ?? 0.1,
          SEP: 0.08,
          RVFW: 0.06,
        }),
      }),
      referenceAcceptedTimeSec: mvcReferenceTimeSec,
      referenceRevision: mvcReferenceRevision,
      mitralForwardFlowActive: options.mitralForwardFlowActive ?? false,
      acceptedMitralClosureEventCount:
        options.mitralClosureEventCount ?? 5,
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
