import { describe, expect, it } from "vitest";

import {
  buildAuthoritativeCirculationGraphV1,
  collapsibleTubeAreaRatioAndPressureDerivativesV1,
  collapsibleTubeAreaRatioV1,
  downstreamEffectivePressureAndDerivativeV1,
  downstreamEffectivePressureV1,
  nonValveEdgeLossAndPressureDerivativesV1,
  nonValveEdgeLossV1,
  physicalColdSeedVolumeFromNodeV1,
  vascularPvLawFromNodeV1,
  vascularTransmuralPressureAndVolumeTangentFromLawV1,
  vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1,
  vascularTransmuralPressureFromLawV1,
  vascularTransmuralPressureFromPhysicalVolumeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  evaluateMainWireQuasiSteadyOrificeValveV2,
  initialMainWireQuasiSteadyOrificeValveStateV2,
  stepMainWireQuasiSteadyOrificeValveV2,
  type MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";
import {
  MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN,
  MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG,
  ptmAndVolumeTangentFromStressedVolume,
  ptmFromStressedVolume,
  stressedVolumeFromPtm,
  type VascularPvLaw,
} from "@/engine/vascularPv";

const VASCULAR = Object.freeze({ venousTone: 0, arterialStiffness: 1 });

const VALVE = Object.freeze({
  parameterSetId: "local-tangent-test-MV-v2",
  valveId: "MV",
  backgroundLinearResistanceMmHgSecPerMl: 0.0027,
  maximumForwardEoaCm2: 5.5,
  closedReverseEroaCm2: 0,
  openingGainPerMmHg: 2,
  openingPressureOffsetMmHg: 0,
  openingDriveDeadbandMmHg: 0.6,
  openingDriveSmoothingMmHg: 0.1,
  openingTimeConstantSec: 0.024,
  closingTimeConstantSec: 0.016,
} satisfies MainWireQuasiSteadyOrificeValveParamsV2);

describe("local paired vascular and edge tangents", () => {
  it("preserves arterial and venous primal values and differentiates interior branches", () => {
    const arterial = {
      kind: "arterial",
      Vu: 0,
      P0: 50,
      VsEff: 150,
    } satisfies VascularPvLaw;
    const arterialVolume = 150 * Math.log1p(90 / 50);
    const pairedArterial = ptmAndVolumeTangentFromStressedVolume(
      arterial,
      arterialVolume,
    );
    expect(pairedArterial.transmuralPressure)
      .toBe(ptmFromStressedVolume(arterial, arterialVolume));
    expect(pairedArterial.branch).toBe("arterial-interior");
    expect(pairedArterial.dPtmDStressedVolume)
      .toBeCloseTo(centralDerivative(
        (volume) => ptmFromStressedVolume(arterial, volume),
        arterialVolume,
        1e-4,
      ), 9);

    const venous = venousLaw();
    const venousVolume = stressedVolumeFromPtm(venous, 6);
    const pairedVenous = ptmAndVolumeTangentFromStressedVolume(
      venous,
      venousVolume,
    );
    expect(pairedVenous.transmuralPressure)
      .toBe(ptmFromStressedVolume(venous, venousVolume));
    expect(pairedVenous.branch).toBe("venous-interior");
    expect(pairedVenous.dPtmDStressedVolume)
      .toBeCloseTo(1 / centralDerivative(
        (pressure) => stressedVolumeFromPtm(venous, pressure),
        pairedVenous.transmuralPressure,
        1e-5,
      ), 9);
  });

  it("declares zero one-sided tangents on arterial and venous saturation branches", () => {
    const arterial = {
      kind: "arterial",
      Vu: 0,
      P0: 50,
      VsEff: 150,
    } satisfies VascularPvLaw;
    const arterialBoundary =
      150 * MAIN_WIRE_ARTERIAL_MINIMUM_LOG_STRAIN;
    const pairedArterial = ptmAndVolumeTangentFromStressedVolume(
      arterial,
      arterialBoundary,
    );
    expect(pairedArterial.branch).toBe("arterial-lower-saturation");
    expect(pairedArterial.dPtmDStressedVolume).toBe(0);
    expect(ptmFromStressedVolume(arterial, arterialBoundary - 1e-4))
      .toBe(pairedArterial.transmuralPressure);

    const venous = venousLaw();
    for (const [pressure, branch, direction] of [
      [MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.minimum,
        "venous-lower-saturation", -1],
      [MAIN_WIRE_VENOUS_PTM_BOUNDS_MMHG.maximum,
        "venous-upper-saturation", 1],
    ] as const) {
      const boundaryVolume = stressedVolumeFromPtm(venous, pressure);
      const paired = ptmAndVolumeTangentFromStressedVolume(
        venous,
        boundaryVolume,
      );
      expect(paired.branch).toBe(branch);
      expect(paired.dPtmDStressedVolume).toBe(0);
      expect(ptmFromStressedVolume(
        venous,
        boundaryVolume + direction * 1e-4,
      )).toBe(pressure);
    }
  });

  it("pairs the physical-volume wrapper without changing either inverse policy's pressure", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const ao = graph.nodes[graph.nodeIndex.get("Ao")!]!;
    for (const policy of [
      "adaptive-volume-tolerance",
      "fixed-32-iterations",
    ] as const) {
      const paired =
        vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
          ao,
          ao.x0,
          VASCULAR,
          policy,
        );
      expect(paired.transmuralPressureMmHg).toBe(
        vascularTransmuralPressureFromPhysicalVolumeV1(
          ao,
          ao.x0,
          VASCULAR,
          policy,
        ),
      );
      expect(paired.dTransmuralPressureDPhysicalVolumeMmHgPerMl)
        .toBeGreaterThan(0);
    }
  });

  it("keeps snapshotted law and node wrappers bit-identical for every vascular node", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    for (const node of graph.nodes) {
      if (
        node.kind !== "arterial"
        && node.kind !== "linear"
        && node.kind !== "venousPressure"
      ) continue;
      const physicalVolumeMl = physicalColdSeedVolumeFromNodeV1(
        node,
        VASCULAR,
      );
      const law = Object.freeze(vascularPvLawFromNodeV1(node, VASCULAR));
      for (const policy of [
        "adaptive-volume-tolerance",
        "fixed-32-iterations",
      ] as const) {
        expect(vascularTransmuralPressureFromLawV1(
          law,
          physicalVolumeMl,
          policy,
        )).toBe(vascularTransmuralPressureFromPhysicalVolumeV1(
          node,
          physicalVolumeMl,
          VASCULAR,
          policy,
        ));
        expect(vascularTransmuralPressureAndVolumeTangentFromLawV1(
          law,
          physicalVolumeMl,
          policy,
        )).toEqual(
          vascularTransmuralPressureAndVolumeTangentFromPhysicalVolumeV1(
            node,
            physicalVolumeMl,
            VASCULAR,
            policy,
          ),
        );
      }
    }
  });

  it("differentiates direct and smooth-waterfall downstream pressure", () => {
    const directInput = {
      edge: { waterfall: false },
      downstreamPressureMmHg: 4,
      edgeExternalPressureMmHg: -2,
    } as const;
    const direct = downstreamEffectivePressureAndDerivativeV1(directInput);
    expect(direct.effectivePressureMmHg)
      .toBe(downstreamEffectivePressureV1(directInput));
    expect(direct.dEffectivePressureDDownstreamPressure).toBe(1);

    const waterfallInput = {
      edge: { waterfall: true, Pcrit: 0 },
      downstreamPressureMmHg: 0.3,
      edgeExternalPressureMmHg: 0,
      smoothingMmHg: 0.25,
    } as const;
    const waterfall = downstreamEffectivePressureAndDerivativeV1(
      waterfallInput,
    );
    expect(waterfall.effectivePressureMmHg)
      .toBe(downstreamEffectivePressureV1(waterfallInput));
    expect(waterfall.dEffectivePressureDDownstreamPressure)
      .toBeCloseTo(centralDerivative(
        (pressure) => downstreamEffectivePressureV1({
          ...waterfallInput,
          downstreamPressureMmHg: pressure,
        }),
        waterfallInput.downstreamPressureMmHg,
        1e-6,
      ), 10);

    const exactTie = downstreamEffectivePressureAndDerivativeV1({
      ...waterfallInput,
      downstreamPressureMmHg: 0,
      smoothingMmHg: 0,
    });
    expect(exactTie.dEffectivePressureDDownstreamPressure).toBe(0.5);
  });

  it("differentiates chi area and pressure-dependent R without changing their primal values", () => {
    const graph = buildAuthoritativeCirculationGraphV1();
    const edge = graph.edges[graph.edgeIndex.get("VC_RA")!]!;
    const input = {
      edge,
      upstreamPressureMmHg: 1.2,
      downstreamPressureMmHg: 0.4,
      edgeExternalPressureMmHg: 0,
    } as const;
    const area = collapsibleTubeAreaRatioAndPressureDerivativesV1(input);
    expect(area.areaRatio).toBe(collapsibleTubeAreaRatioV1(input));
    expect(area.dAreaRatioDUpstreamPressurePerMmHg)
      .toBeCloseTo(centralDerivative(
        (pressure) => collapsibleTubeAreaRatioV1({
          ...input,
          upstreamPressureMmHg: pressure,
        }),
        input.upstreamPressureMmHg,
        1e-6,
      ), 9);
    expect(area.dAreaRatioDDownstreamPressurePerMmHg)
      .toBeCloseTo(centralDerivative(
        (pressure) => collapsibleTubeAreaRatioV1({
          ...input,
          downstreamPressureMmHg: pressure,
        }),
        input.downstreamPressureMmHg,
        1e-6,
      ), 9);

    const lossInput = {
      ...input,
      params: {
        systemicResistance: 1,
        pulmonaryResistance: 1,
        useChiResistance: true,
      },
    } as const;
    const loss = nonValveEdgeLossAndPressureDerivativesV1(lossInput);
    const primalLoss = nonValveEdgeLossV1(lossInput);
    expect(loss.resistanceMmHgSecPerMl)
      .toBe(primalLoss.resistanceMmHgSecPerMl);
    expect(loss.areaRatio).toBe(primalLoss.areaRatio);
    expect(loss.dResistanceDUpstreamPressureSecPerMl)
      .toBeCloseTo(centralDerivative(
        (pressure) => nonValveEdgeLossV1({
          ...lossInput,
          upstreamPressureMmHg: pressure,
        }).resistanceMmHgSecPerMl,
        lossInput.upstreamPressureMmHg,
        1e-6,
      ), 9);
  });
});

describe("MainWireQuasiSteadyOrificeValveV2 paired tangents", () => {
  it("matches the total forward derivative with BE opening-state elimination", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.25);
    const gradient = 5;
    const center = steppedValve(previous, gradient, VALVE);
    const h = 1e-5;
    expect(center.tangentMode)
      .toBe("backward-euler-opening-state-eliminated");
    expect(center.tangentBranch).toBe("forward-open-orifice");
    expect(center.dLeafletOpeningFractionDPressureGradientPerMmHg)
      .toBeCloseTo(centralDerivative(
        (value) => steppedValve(previous, value, VALVE)
          .state.leafletOpeningFraction01,
        gradient,
        h,
      ), 8);
    expect(center.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(centralDerivative(
        (value) => steppedValve(previous, value, VALVE).flowMlPerSec,
        gradient,
        h,
      ), 7);
  });

  it("exposes the fixed-next partial derivative from evaluate", () => {
    const state = initialMainWireQuasiSteadyOrificeValveStateV2(0.45);
    const gradient = 5;
    const center = evaluatedValve(state, gradient, VALVE);
    expect(center.tangentMode).toBe("next-opening-held-fixed");
    expect(center.dLeafletOpeningFractionDPressureGradientPerMmHg).toBe(0);
    expect(center.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(centralDerivative(
        (value) => evaluatedValve(state, value, VALVE).flowMlPerSec,
        gradient,
        1e-5,
      ), 8);
  });

  it("uses reverse EROA derivative and exact zero derivative for competent closure", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.7);
    const regurgitant = { ...VALVE, closedReverseEroaCm2: 0.2 };
    const reverse = steppedValve(previous, -5, regurgitant);
    expect(reverse.tangentBranch).toBe("reverse-regurgitant-orifice");
    expect(reverse.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(centralDerivative(
        (value) => steppedValve(previous, value, regurgitant).flowMlPerSec,
        -5,
        1e-5,
      ), 8);

    const competent = steppedValve(previous, -5, VALVE);
    expect(competent.tangentBranch)
      .toBe("exact-zero-area-hydraulic-support");
    expect(competent.flowMlPerSec).toBe(0);
    expect(competent.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
  });

  it("selects closing tau when target equals previous opening", () => {
    const gradient = 1;
    const probe = evaluatedValve(
      initialMainWireQuasiSteadyOrificeValveStateV2(0),
      gradient,
      VALVE,
    );
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(
      probe.openingTarget01,
    );
    const center = steppedValve(previous, gradient, VALVE);
    const h = 1e-6;
    const leftDerivative = (
      center.state.leafletOpeningFraction01
      - steppedValve(previous, gradient - h, VALVE)
        .state.leafletOpeningFraction01
    ) / h;
    expect(center.state.leafletOpeningFraction01)
      .toBe(previous.leafletOpeningFraction01);
    expect(center.dLeafletOpeningFractionDPressureGradientPerMmHg)
      .toBeCloseTo(leftDerivative, 6);
  });

  it("uses the forward one-sided semismooth derivative at zero gradient", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0.5);
    const center = steppedValve(previous, 0, VALVE);
    const h = 1e-7;
    const forwardDerivative =
      (steppedValve(previous, h, VALVE).flowMlPerSec - center.flowMlPerSec) / h;
    const reverseDerivative =
      (center.flowMlPerSec - steppedValve(previous, -h, VALVE).flowMlPerSec) / h;
    expect(center.tangentBranch)
      .toBe("zero-gradient-forward-open-orifice");
    expect(center.dFlowDPressureGradientMlPerSecPerMmHg)
      .toBeCloseTo(forwardDerivative, 3);
    expect(reverseDerivative).toBe(0);
  });

  it("keeps zero EOA support primal and tangent exactly zero", () => {
    const previous = initialMainWireQuasiSteadyOrificeValveStateV2(0);
    const output = steppedValve(previous, 0.3, VALVE);
    expect(output.openingTarget01).toBe(0);
    expect(output.state.leafletOpeningFraction01).toBe(0);
    expect(output.flowMlPerSec).toBe(0);
    expect(output.dLeafletOpeningFractionDPressureGradientPerMmHg).toBe(0);
    expect(output.dFlowDPressureGradientMlPerSecPerMmHg).toBe(0);
    expect(output.tangentBranch).toBe("exact-zero-area-hydraulic-support");
  });
});

function venousLaw(): Extract<VascularPvLaw, { kind: "venous3" }> {
  return {
    kind: "venous3",
    Vu: 0,
    Ccoll: 15,
    Copen: 130,
    Cdist: 35,
    Popen: -2,
    Pstiff: 16,
    dOpen: 1.5,
    dStiff: 4,
  };
}

function steppedValve(
  previous: ReturnType<typeof initialMainWireQuasiSteadyOrificeValveStateV2>,
  gradientMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
) {
  return stepMainWireQuasiSteadyOrificeValveV2(previous, {
    dtSec: 0.001,
    upstreamPressureMmHg: 10 + gradientMmHg,
    downstreamPressureMmHg: 10,
  }, params);
}

function evaluatedValve(
  state: ReturnType<typeof initialMainWireQuasiSteadyOrificeValveStateV2>,
  gradientMmHg: number,
  params: MainWireQuasiSteadyOrificeValveParamsV2,
) {
  return evaluateMainWireQuasiSteadyOrificeValveV2(state, {
    dtSec: 0.001,
    upstreamPressureMmHg: 10 + gradientMmHg,
    downstreamPressureMmHg: 10,
  }, state, params);
}

function centralDerivative(
  evaluate: (value: number) => number,
  center: number,
  step: number,
): number {
  return (evaluate(center + step) - evaluate(center - step)) / (2 * step);
}
