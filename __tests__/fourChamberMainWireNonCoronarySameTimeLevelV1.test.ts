import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  mainWireDefaultHemodynamicRuntimeControlsV1,
  resolveMainWireNonCoronaryHemodynamicGraphV1,
  type MainWireHemodynamicRuntimeControlsV1,
  type MainWireNonCoronaryCirculationNodeNameV1,
  type MainWireNonCoronaryVascularNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_DIRECTED_EDGES_V1,
  MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_INCIDENCE_COLUMN_SUMS_V1,
  MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1,
  MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1,
  MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1,
  compileMainWireNonCoronaryPrecompiledContextV1,
  computeMainWireNonCoronaryVolumeRatesV1,
  evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1,
  evaluateMainWireNonCoronarySameTimeLevelV1,
  evaluateMainWireNonCoronaryWithPrecompiledContextV1,
  type MainWireNonCoronarySameTimeLevelInputV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  compileMainWireVascularPvLawSiV1,
  mainWireVascularPhysicalVolumeM3FromPtmPaV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireVascularPvLawSiV1";
import {
  MAIN_WIRE_PASCAL_PER_MMHG_V1,
  MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
} from
  "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

describe("main-wire non-coronary same-time-level circulation kernel", () => {
  it("generates the reviewed 15-node/15-edge incidence without aggregate bypass flows", () => {
    expect(MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1).toHaveLength(15);
    expect(MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1).toHaveLength(11);
    expect(MAIN_WIRE_NON_CORONARY_DIRECTED_EDGES_V1).toHaveLength(15);
    expect(MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1).toHaveLength(15);
    expect(MAIN_WIRE_NON_CORONARY_DYNAMIC_FLOW_NAMES_V1).toEqual([
      "Q_MV", "Q_AoV", "Q_TV", "Q_PuV", "Ao_SA", "PA_PArt",
    ]);
    expect(MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1).toEqual([
      "SA_Art", "Art_Cap", "Cap_SV", "SV_VC", "VC_RA",
      "PArt_PCap", "PCap_PVen", "PVen_PVein", "PVein_LA",
    ]);
    expect(MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1).not.toContain("Q_sys");
    expect(MAIN_WIRE_NON_CORONARY_ALL_FLOW_NAMES_V1).not.toContain("Q_pul");
    expect(MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1).toHaveLength(15);
    expect(MAIN_WIRE_NON_CORONARY_INCIDENCE_COLUMN_SUMS_V1).toEqual(
      Array.from({ length: 15 }, () => 0),
    );
    for (let column = 0; column < 15; column += 1) {
      const entries = MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1
        .map((row) => row[column]);
      expect(entries.filter((entry) => entry === -1)).toHaveLength(1);
      expect(entries.filter((entry) => entry === 1)).toHaveLength(1);
    }
    expect(Object.isFrozen(MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1)).toBe(true);
    expect(Object.isFrozen(MAIN_WIRE_NON_CORONARY_INCIDENCE_MATRIX_V1[0])).toBe(true);

    expect(MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1).toMatchObject({
      vascularGraphOwner: "main-wire",
      valveConstitutiveOwner: "engine-core-dynamic-aperture-condensed-be",
      valveApertureState: "four-stored-states-statically-condensed-from-newton",
      coronaryNetwork: "excluded",
      integrationMode: "replace-not-augment",
      fixedDynamicFlowVariant:
        "six-flow-plus-four-condensed-aperture-states-v1",
      positivePVeinLaOstialInertanceSupport:
        "unsupported-requires-seven-dynamic-flow-variant",
      modelCoreNumericalRuntimeParityClaimed: false,
      projectionApplied: false,
      flowClampApplied: false,
      fallbackApplied: false,
      duplicateAggregatePeripheralFlows: false,
    });
    expect(
      MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1
        .intendedMonolithicNewtonUnknownCount,
    ).toMatchObject({ slsOn: 58, slsOff: 53 });
    expect(
      MAIN_WIRE_NON_CORONARY_KERNEL_OWNERSHIP_AUDIT_V1
        .intendedMonolithicStoredDifferentialStateCount,
    ).toMatchObject({ slsOn: 70, slsOff: 65 });
  });

  it("evaluates canonical vascular PV laws and all nine signed algebraic roots", () => {
    const input = forwardFixtureV1();
    const output = evaluateMainWireNonCoronarySameTimeLevelV1(input);

    expect(Object.keys(output.vascularPressureByNode)).toEqual(
      MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    );
    for (const [nodeName, pressureMmHg] of Object.entries(
      BASELINE_TRANSMURAL_PRESSURE_MMHG,
    )) {
      expect(
        output.vascularPressureByNode[nodeName as MainWireNonCoronaryVascularNodeNameV1]
          .transmuralPressurePa / MAIN_WIRE_PASCAL_PER_MMHG_V1,
      ).toBeCloseTo(pressureMmHg, 9);
    }
    for (const flowName of MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1) {
      const edge = output.vascularFlowEvaluationByFlow[flowName];
      expect(edge.integrationClass).toBe("algebraic-flow");
      expect(edge.flowM3PerSec).toBeGreaterThan(0);
      expect(edge.signedLossPressurePa).toBeGreaterThan(0);
      expect(edge.dissipationW).toBeGreaterThan(0);
      expect(Math.abs(edge.momentumResidualPa)).toBeLessThan(1e-9);
    }
    expect(output.vascularFlowEvaluationByFlow.PVein_LA.integrationClass)
      .toBe("algebraic-flow");
    expect(output.energyAccounting.vascularElasticStoredEnergyJ).toBeGreaterThan(0);
    expect(output.energyAccounting.vascularHydraulicDissipationW).toBeGreaterThan(0);
    expect(output.energyAccounting.externalPressureWorkIncluded).toBe(false);
    expect(output.energyAccounting.wholeHeartEnergyClosureClaimed).toBe(false);
  });

  it("keeps every pressure, flow, inverse, and energy value identical with an immutable context", () => {
    const input = forwardFixtureV1();
    const direct = evaluateMainWireNonCoronarySameTimeLevelV1(input);
    const context = compileMainWireNonCoronaryPrecompiledContextV1(
      input.mainWireRuntimeControls,
    );
    const precompiled = evaluateMainWireNonCoronaryWithPrecompiledContextV1({
      state: input.state,
      chamberAbsolutePressurePa: input.chamberAbsolutePressurePa,
      externalPressurePa: input.externalPressurePa,
      precompiledContext: context,
    });
    expect(precompiled).toEqual(direct);
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.resolvedGraph)).toBe(true);
    expect(Object.isFrozen(context.resolvedGraph.runtimeControls)).toBe(true);
    expect(Object.isFrozen(context.vascularPvLawByNode)).toBe(true);
    expect(Object.values(context.vascularPvLawByNode).every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(context.dynamicValveParametersByFlow)).toBe(true);
    expect(Object.values(context.dynamicValveParametersByFlow).every(Object.isFrozen))
      .toBe(true);
    expect(context).toMatchObject({
      internalPerformanceContextOnly: true,
      physiologyOrNumericalAcceptanceClaimed: false,
      claimBoundary:
        "immutable parameter compilation only; pressure, flow, residual, inverse, and energy semantics unchanged",
    });
  });

  it("rejects forged and cross-compilation-spliced precompiled contexts", () => {
    const input = forwardFixtureV1();
    const context = compileMainWireNonCoronaryPrecompiledContextV1(
      input.mainWireRuntimeControls,
    );
    const otherContext = compileMainWireNonCoronaryPrecompiledContextV1({
      ...input.mainWireRuntimeControls,
      nodeOverrides: { SA: { P0: 57 } },
    });
    const evaluateWith = (precompiledContext: typeof context) =>
      evaluateMainWireNonCoronaryWithPrecompiledContextV1({
        state: input.state,
        chamberAbsolutePressurePa: input.chamberAbsolutePressurePa,
        externalPressurePa: input.externalPressurePa,
        precompiledContext,
      });

    const forged = Object.freeze({ ...context }) as typeof context;
    expect(() => evaluateWith(forged)).toThrow(/compiler-issued and source-bound/);

    const mixed = Object.freeze({
      ...context,
      resolvedGraph: otherContext.resolvedGraph,
    }) as typeof context;
    expect(() => evaluateWith(mixed)).toThrow(/compiler-issued and source-bound/);
  });

  it("keeps dynamic root momentum in SI pressure units and retains Phase-B1 valves", () => {
    const input = forwardFixtureV1();
    const output = evaluateMainWireNonCoronarySameTimeLevelV1(input);
    expect(Object.keys(output.valveMomentumByFlow)).toEqual(
      MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1,
    );

    for (const flowName of ["Ao_SA", "PA_PArt"] as const) {
      const edge = output.vascularFlowEvaluationByFlow[flowName];
      expect(edge.integrationClass).toBe("dynamic-flow-state");
      if (edge.integrationClass !== "dynamic-flow-state") throw new Error("unreachable");
      expect(Math.abs(edge.momentumResidualPa)).toBeLessThan(1e-10);
      expect(
        edge.inertancePaSec2PerM3 * edge.flowAccelerationM3PerSec2
          + edge.signedLossPressurePa,
      ).toBeCloseTo(edge.pressureGradientPa, 10);
      expect(edge.kineticEnergyJ).toBeGreaterThan(0);
      expect(edge.dissipationW).toBeGreaterThan(0);
    }
    expect(output.dynamicFlowAccelerationM3PerSec2.Ao_SA).toBeCloseTo(0, 9);
    expect(output.dynamicFlowAccelerationM3PerSec2.PA_PArt).toBeCloseTo(0, 9);
    for (const flowName of MAIN_WIRE_NON_CORONARY_VALVE_FLOW_NAMES_V1) {
      expect(output.valveMomentumByFlow[flowName].inertancePaSec2PerM3)
        .toBeGreaterThan(0);
    }
  });

  it("uses the 0.25-mmHg main-wire waterfall and not the raw downstream pressure", () => {
    const base = forwardFixtureV1();
    const pthPa = 5 * MAIN_WIRE_PASCAL_PER_MMHG_V1;
    const input: MainWireNonCoronarySameTimeLevelInputV1 = {
      ...base,
      state: {
        ...base.state,
        bloodVolumesM3: {
          ...base.state.bloodVolumesM3,
          VC: physicalVascularVolumeAtPtmV1(
            "VC",
            -1,
            base.mainWireRuntimeControls,
          ),
        },
      },
      chamberAbsolutePressurePa: {
        ...base.chamberAbsolutePressurePa,
        RA: 0,
      },
      externalPressurePa: { pth: pthPa, palv: 0 },
    };
    const output = evaluateMainWireNonCoronarySameTimeLevelV1(input);
    const edge = output.vascularFlowEvaluationByFlow.VC_RA;
    expect(edge.integrationClass).toBe("algebraic-flow");
    expect(edge.upstreamAbsolutePressurePa).toBeCloseTo(
      4 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      9,
    );
    expect(edge.downstreamAbsolutePressurePa).toBe(0);
    expect(edge.waterfallCollapsePressurePa).toBe(pthPa);
    expect(edge.effectiveDownstreamPressurePa).toBeGreaterThan(pthPa);
    expect(edge.pressureGradientPa).toBeLessThan(0);
    expect(edge.flowM3PerSec).toBeLessThan(0);

    const pulmonaryInput: MainWireNonCoronarySameTimeLevelInputV1 = {
      ...base,
      state: {
        ...base.state,
        bloodVolumesM3: {
          ...base.state.bloodVolumesM3,
          PCap: physicalVascularVolumeAtPtmV1(
            "PCap",
            -1,
            base.mainWireRuntimeControls,
          ),
          PVen: physicalVascularVolumeAtPtmV1(
            "PVen",
            0,
            base.mainWireRuntimeControls,
          ),
        },
      },
      externalPressurePa: {
        pth: 0,
        palv: 5 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      },
    };
    const pulmonary = evaluateMainWireNonCoronarySameTimeLevelV1(pulmonaryInput)
      .vascularFlowEvaluationByFlow.PCap_PVen;
    expect(pulmonary.upstreamAbsolutePressurePa).toBeCloseTo(
      4 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      9,
    );
    expect(pulmonary.downstreamAbsolutePressurePa).toBeCloseTo(0, 9);
    expect(pulmonary.waterfallCollapsePressurePa).toBeCloseTo(
      5 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      9,
    );
    expect(pulmonary.effectiveDownstreamPressurePa)
      .toBeGreaterThan(pulmonary.waterfallCollapsePressurePa!);
    expect(pulmonary.flowM3PerSec).toBeLessThan(0);
  });

  it("allows signed unbounded PVein-to-LA algebraic flow without a hidden clamp", () => {
    const base = forwardFixtureV1();
    const reverse = evaluateMainWireNonCoronarySameTimeLevelV1({
      ...base,
      chamberAbsolutePressurePa: {
        ...base.chamberAbsolutePressurePa,
        LA: 6 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      },
    }).vascularFlowEvaluationByFlow.PVein_LA;
    expect(reverse.flowM3PerSec).toBeLessThan(0);
    expect(reverse.signedLossPressurePa).toBeLessThan(0);
    expect(reverse.dissipationW).toBeGreaterThan(0);

    const highGradient = evaluateMainWireNonCoronarySameTimeLevelV1({
      ...base,
      chamberAbsolutePressurePa: {
        ...base.chamberAbsolutePressurePa,
        LA: -100 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      },
    }).vascularFlowEvaluationByFlow.PVein_LA;
    expect(highGradient.flowM3PerSec).toBeGreaterThan(1_500e-6);
    expect(Math.abs(highGradient.momentumResidualPa)).toBeLessThan(1e-9);
  });

  it("solves nonzero quadratic ostial loss with symmetric signed roots in SI", () => {
    const base = forwardFixtureV1();
    const quadraticMmHgSec2PerMl2 = 2e-5;
    const controls: MainWireHemodynamicRuntimeControlsV1 = {
      ...base.mainWireRuntimeControls,
      edgeOverrides: {
        PVein_LA: { R: 0.02, L: 0, B: quadraticMmHgSec2PerMl2 },
      },
    };
    const forward = evaluateMainWireNonCoronarySameTimeLevelV1({
      ...base,
      mainWireRuntimeControls: controls,
    }).vascularFlowEvaluationByFlow.PVein_LA;
    const reverse = evaluateMainWireNonCoronarySameTimeLevelV1({
      ...base,
      mainWireRuntimeControls: controls,
      chamberAbsolutePressurePa: {
        ...base.chamberAbsolutePressurePa,
        LA: 6 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      },
    }).vascularFlowEvaluationByFlow.PVein_LA;
    expect(forward.integrationClass).toBe("algebraic-flow");
    expect(reverse.integrationClass).toBe("algebraic-flow");
    expect(forward.quadraticResistancePaSec2PerM6).toBe(
      quadraticMmHgSec2PerMl2 * MAIN_WIRE_QUADRATIC_LOSS_SI_FACTOR_V1,
    );
    expect(forward.flowM3PerSec).toBeGreaterThan(0);
    expect(reverse.flowM3PerSec).toBeLessThan(0);
    expect(reverse.flowM3PerSec).toBeCloseTo(-forward.flowM3PerSec, 15);
    expect(Math.abs(forward.momentumResidualPa)).toBeLessThan(1e-9);
    expect(Math.abs(reverse.momentumResidualPa)).toBeLessThan(1e-9);
    expect(forward.dissipationW).toBeGreaterThan(0);
    expect(reverse.dissipationW).toBeGreaterThan(0);
  });

  it("fails closed when PVein_LA L>0 requests the unsupported seventh flow state", () => {
    const base = forwardFixtureV1();
    expect(() => evaluateMainWireNonCoronarySameTimeLevelV1({
      ...base,
      mainWireRuntimeControls: {
        ...base.mainWireRuntimeControls,
        edgeOverrides: {
          PVein_LA: { L: 0.001 },
        },
      },
    })).toThrow(
      /six-flow V1 does not support PVein_LA L>0; use a separate seven-dynamic-flow variant/,
    );
  });

  it("makes the summed BE residual exactly the total-volume change rate", () => {
    const evaluated = evaluateMainWireNonCoronarySameTimeLevelV1(forwardFixtureV1());
    const previous = evaluated.state.bloodVolumesM3;
    const timeStepSec = 0.002;
    const uniformIncrementM3 = 1e-9;
    const next = Object.freeze(Object.fromEntries(
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map((nodeName) => [
        nodeName,
        previous[nodeName] + uniformIncrementM3,
      ]),
    )) as Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>;
    const result = evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1({
      previousBloodVolumesM3: previous,
      nextBloodVolumesM3: next,
      nextFlowsM3PerSec: evaluated.allFlowsM3PerSec,
      timeStepSec,
    });
    expect(Math.abs(result.summedIncidenceVolumeRateM3PerSec)).toBeLessThan(1e-18);
    expect(result.totalBloodVolumeChangeRateM3PerSec).toBeCloseTo(
      15 * uniformIncrementM3 / timeStepSec,
      15,
    );
    expect(result.summedResidualM3PerSec).toBeCloseTo(
      result.totalBloodVolumeChangeRateM3PerSec,
      15,
    );

    const rates = computeMainWireNonCoronaryVolumeRatesV1(
      evaluated.allFlowsM3PerSec,
    );
    const conservativeNext = Object.freeze(Object.fromEntries(
      MAIN_WIRE_NON_CORONARY_CIRCULATION_NODE_NAMES_V1.map((nodeName) => [
        nodeName,
        previous[nodeName] + timeStepSec * rates[nodeName],
      ]),
    )) as Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>;
    const conservative = evaluateMainWireNonCoronaryBackwardEulerVolumeResidualV1({
      previousBloodVolumesM3: previous,
      nextBloodVolumesM3: conservativeNext,
      nextFlowsM3PerSec: evaluated.allFlowsM3PerSec,
      timeStepSec,
    });
    for (const residual of Object.values(conservative.residualM3PerSecByNode)) {
      expect(Math.abs(residual)).toBeLessThan(2e-16);
    }
    expect(Math.abs(conservative.totalBloodVolumeChangeRateM3PerSec))
      .toBeLessThan(2e-16);
  });
});

const BASELINE_TRANSMURAL_PRESSURE_MMHG: Readonly<
  Record<MainWireNonCoronaryVascularNodeNameV1, number>
> = Object.freeze({
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
});

function forwardFixtureV1(): MainWireNonCoronarySameTimeLevelInputV1 {
  const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
  const bloodVolumesM3 = Object.freeze({
    LV: 120e-6,
    LA: 50e-6,
    RV: 130e-6,
    RA: 55e-6,
    ...Object.fromEntries(MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1.map(
      (nodeName) => [
        nodeName,
        physicalVascularVolumeAtPtmV1(
          nodeName,
          BASELINE_TRANSMURAL_PRESSURE_MMHG[nodeName],
          controls,
        ),
      ],
    )),
  }) as Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>;
  const graph = resolveMainWireNonCoronaryHemodynamicGraphV1(controls);
  const graphAoSaResistance = graph.edges.find((edge) => edge.name === "Ao_SA")!
    .effectiveResistanceMmHgSecPerMl;
  const graphPaPartResistance = graph.edges.find((edge) => edge.name === "PA_PArt")!
    .effectiveResistanceMmHgSecPerMl;
  return {
    state: {
      bloodVolumesM3,
      dynamicFlowsM3PerSec: {
        Q_MV: 0,
        Q_AoV: 0,
        Q_TV: 0,
        Q_PuV: 0,
        Ao_SA: (90 - 85) / graphAoSaResistance * 1e-6,
        PA_PArt: (16 - 13) / graphPaPartResistance * 1e-6,
      },
      valveApertureState01ByFlow: {
        Q_MV: 0.2,
        Q_AoV: 0.2,
        Q_TV: 0.2,
        Q_PuV: 0.2,
      },
    },
    chamberAbsolutePressurePa: {
      LV: 8 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      LA: 4 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      RV: 10 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      RA: 2 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
    },
    externalPressurePa: { pth: 0, palv: 0 },
    mainWireRuntimeControls: controls,
  };
}

function physicalVascularVolumeAtPtmV1(
  nodeName: MainWireNonCoronaryVascularNodeNameV1,
  pressureMmHg: number,
  controls: MainWireHemodynamicRuntimeControlsV1,
): number {
  const compiled = compileMainWireVascularPvLawSiV1(nodeName, {
    venousTone: controls.venousTone,
    arterialStiffness: controls.arterialStiffness,
  });
  return mainWireVascularPhysicalVolumeM3FromPtmPaV1(
    compiled,
    pressureMmHg * MAIN_WIRE_PASCAL_PER_MMHG_V1,
  );
}
