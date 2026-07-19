import { describe, expect, it } from "vitest";

import {
  buildNonCoronaryCirculationGraphV1,
  NON_CORONARY_CIRCULATION_BE_V1_ID,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryNodeNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { vascularPvLawFromNodeV1 } from "@/engine/core/circulationGraphKernelV1";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import type {
  MainWireScientificProtocolAcceptedStateV1,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicProtocolV1";
import {
  initializeMainWireScientificTbvTargetSeedV1,
} from "@/engine/scientific/protocols/MainWireScientificTbvContinuationSeedPredictorV1";
import { stressedVolumeFromPtm } from "@/engine/vascularPv";

const VASCULAR_NAMES = Object.freeze([
  "Ao", "SA", "Art", "Cap", "SV", "VC",
  "PA", "PArt", "PCap", "PVen", "PVein",
] as const satisfies readonly NonCoronaryNodeNameV1[]);

const DELTA_BY_VASCULAR_NODE = Object.freeze({
  Ao: -5,
  SA: 5,
  Art: 5,
  Cap: 5,
  SV: 40,
  VC: 15,
  PA: 2,
  PArt: 3,
  PCap: 5,
  PVen: 10,
  PVein: 15,
} as const satisfies Readonly<Record<typeof VASCULAR_NAMES[number], number>>);

describe("main-wire scientific TBV continuation seed predictor V1", () => {
  it("preserves a trusted vascular secant and projects exact TBV without changing hidden state", () => {
    const previous = makeReferenceState(0);
    const currentVolumes = Object.freeze({
      ...previous.circulation.nodeVolumesMl,
      ...Object.fromEntries(VASCULAR_NAMES.map((name) => [
        name,
        previous.circulation.nodeVolumesMl[name]
          + DELTA_BY_VASCULAR_NODE[name],
      ])),
    }) as MainWireScientificProtocolAcceptedStateV1["circulation"]["nodeVolumesMl"];
    const current = makeState(
      currentVolumes,
      previous.circulation.totalBloodVolumeMl + 100,
      1,
      previous,
    );
    const targetTbvMl = current.circulation.totalBloodVolumeMl + 50;

    const initialized = initializeMainWireScientificTbvTargetSeedV1({
      previousP1State: previous,
      currentP1State: current,
      targetTbvMl,
      runtime: RUNTIME,
      cycleLengthSec: 1,
    });

    expect(initialized.diagnostics).toMatchObject({
      kind: "p1-vascular-secant-compliance-projection",
      fallbackUsed: false,
      secantExtrapolationRatio: 0.5,
      sameCyclePhase: true,
      chamberVolumesChanged: false,
      mechanicsStateChanged: false,
      dynamicFlowMemoryChanged: false,
      valveMemoryChanged: false,
    });
    expect(totalVolume(initialized.state)).toBeCloseTo(targetTbvMl, 9);
    expect(initialized.diagnostics.targetTbvProjectionErrorMl).toBeCloseTo(0, 9);
    expect(initialized.diagnostics.maximumNormalizedProjectionCorrection)
      .toBeLessThan(1e-9);
    for (const name of ["LV", "LA", "RV", "RA"] as const) {
      expect(initialized.state.circulation.nodeVolumesMl[name])
        .toBe(current.circulation.nodeVolumesMl[name]);
    }
    expect(initialized.state.mechanics).toBe(current.mechanics);
    expect(initialized.state.circulation.dynamicEdgeFlowsMlPerSec)
      .toBe(current.circulation.dynamicEdgeFlowsMlPerSec);
    expect(initialized.state.circulation.valveStates)
      .toBe(current.circulation.valveStates);
    // Negative component slopes are valid and must not be simplex-projected.
    expect(initialized.state.circulation.nodeVolumesMl.Ao)
      .toBeCloseTo(current.circulation.nodeVolumesMl.Ao - 2.5, 9);

    const provisional = initializeMainWireScientificTbvTargetSeedV1({
      previousP1State: previous,
      currentP1State: current,
      targetTbvMl,
      runtime: RUNTIME,
      cycleLengthSec: 1,
      referenceEvidence: "provisional-fast-preview",
    });
    expect(provisional.diagnostics).toMatchObject({
      kind: "provisional-vascular-secant-compliance-projection",
      referenceEvidence: "provisional-fast-preview",
      fallbackUsed: false,
    });
  });

  it("falls back to the conservative SV/VC fork outside the trust region", () => {
    const previous = makeReferenceState(0);
    const current = makeState(
      previous.circulation.nodeVolumesMl,
      previous.circulation.totalBloodVolumeMl,
      1.2,
      previous,
    );
    const targetTbvMl = current.circulation.totalBloodVolumeMl + 50;
    const initialized = initializeMainWireScientificTbvTargetSeedV1({
      previousP1State: previous,
      currentP1State: current,
      targetTbvMl,
      runtime: RUNTIME,
      cycleLengthSec: 1,
    });

    expect(initialized.diagnostics.kind)
      .toBe("shared-sv-vc-pressure-offset");
    expect(initialized.diagnostics.fallbackUsed).toBe(true);
    expect(initialized.diagnostics.fallbackReason)
      .toContain("cardiac-cycle phase");
    expect(totalVolume(initialized.state)).toBeCloseTo(targetTbvMl, 9);
    for (const name of VASCULAR_NAMES) {
      if (name === "SV" || name === "VC") continue;
      expect(initialized.state.circulation.nodeVolumesMl[name])
        .toBe(current.circulation.nodeVolumesMl[name]);
    }
  });

  it("uses the conservative initializer for the first point in each lane", () => {
    const current = makeReferenceState(0);
    const targetTbvMl = current.circulation.totalBloodVolumeMl * 0.95;
    const initialized = initializeMainWireScientificTbvTargetSeedV1({
      previousP1State: null,
      currentP1State: current,
      targetTbvMl,
      runtime: RUNTIME,
    });
    expect(initialized.diagnostics).toMatchObject({
      kind: "shared-sv-vc-pressure-offset",
      referenceEvidence: "trusted-p1",
      fallbackUsed: true,
      fallbackReason: "previous trusted P1 endpoint is unavailable",
    });
    expect(totalVolume(initialized.state)).toBeCloseTo(targetTbvMl, 9);
  });
});

const RUNTIME = Object.freeze({
  vascular: Object.freeze({ venousTone: 0, arterialStiffness: 1 }),
}) as NonCoronaryCirculationRuntimeParamsV1;

const PRESSURE_BY_VASCULAR_NODE = Object.freeze({
  Ao: 90,
  SA: 85,
  Art: 70,
  Cap: 25,
  SV: 6,
  VC: 4,
  PA: 16,
  PArt: 13,
  PCap: 8,
  PVen: 6,
  PVein: 5,
} as const satisfies Readonly<Record<typeof VASCULAR_NAMES[number], number>>);

function makeReferenceState(
  acceptedTimeSec: number,
): MainWireScientificProtocolAcceptedStateV1 {
  const graph = buildNonCoronaryCirculationGraphV1();
  const vascular = Object.fromEntries(VASCULAR_NAMES.map((name) => {
    const node = graph.nodes[graph.nodeIndex.get(name)!]!;
    const law = vascularPvLawFromNodeV1(node, RUNTIME.vascular);
    return [
      name,
      law.Vu + stressedVolumeFromPtm(
        law,
        PRESSURE_BY_VASCULAR_NODE[name],
      ),
    ];
  }));
  const nodeVolumesMl = Object.freeze({
    LV: 120,
    LA: 55,
    RV: 130,
    RA: 65,
    ...vascular,
  }) as MainWireScientificProtocolAcceptedStateV1["circulation"]["nodeVolumesMl"];
  return makeState(
    nodeVolumesMl,
    Object.values(nodeVolumesMl).reduce((sum, value) => sum + value, 0),
    acceptedTimeSec,
  );
}

function makeState(
  nodeVolumesMl:
    MainWireScientificProtocolAcceptedStateV1["circulation"]["nodeVolumesMl"],
  totalBloodVolumeMl: number,
  acceptedTimeSec: number,
  shareHiddenStateWith?: MainWireScientificProtocolAcceptedStateV1,
): MainWireScientificProtocolAcceptedStateV1 {
  const hidden = shareHiddenStateWith ?? Object.freeze({
    circulation: Object.freeze({
      dynamicEdgeFlowsMlPerSec: Object.freeze({ Ao_SA: 0, PA_PArt: 0 }),
      valveStates: Object.freeze({}),
    }),
    mechanics: Object.freeze({}),
  }) as unknown as MainWireScientificProtocolAcceptedStateV1;
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: Math.round(acceptedTimeSec * 500),
    acceptedTimeSec,
    circulation: Object.freeze({
      transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      revision: Math.round(acceptedTimeSec * 500),
      acceptedTimeSec,
      totalBloodVolumeMl,
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec:
        hidden.circulation.dynamicEdgeFlowsMlPerSec,
      valveStates: hidden.circulation.valveStates,
    }),
    mechanics: hidden.mechanics,
  });
}

function totalVolume(state: MainWireScientificProtocolAcceptedStateV1): number {
  return Object.values(state.circulation.nodeVolumesMl).reduce(
    (sum, value) => sum + value,
    0,
  );
}
