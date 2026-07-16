import { describe, expect, it } from "vitest";
import {
  MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
  mainWireDefaultHemodynamicRuntimeControlsV1,
  type MainWireNonCoronaryCirculationNodeNameV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1,
  evaluateMainWireNonCoronarySameTimeLevelV1,
} from
  "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1,
  MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1,
  buildMainWireNonCoronaryInitialVascularFlowsV1,
  initializeMainWireNonCoronaryVascularStateV1,
  type MainWireNonCoronaryVascularInitializerInputV1,
} from
  "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1";
import { MAIN_WIRE_PASCAL_PER_MMHG_V1 } from
  "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularTopologyV1";

describe("main-wire non-coronary vascular initializer V1", () => {
  it("closes a representative pre-A TBV with one physically constructed common flow", () => {
    const output = initializeMainWireNonCoronaryVascularStateV1(typicalInputV1());
    expect(output.initializerId).toBe("main-wire-non-coronary-vascular-initializer-v1");
    expect(Object.keys(output.vascularVolumeM3ByNode)).toEqual(
      MAIN_WIRE_NON_CORONARY_VASCULAR_NODE_NAMES_V1,
    );
    expect(Object.keys(output.vascularEdgeFlowM3PerSecByName)).toEqual(
      MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1,
    );
    expect(output.commonConstructionFlowM3PerSec * 1e6).toBeGreaterThan(65);
    expect(output.commonConstructionFlowM3PerSec * 1e6).toBeLessThan(80);
    expect(output.audit.reconstructedTotalBloodVolumeM3).toBeCloseTo(5.6e-3, 14);
    expect(output.audit.relativeTotalBloodVolumeResidual).toBeLessThan(1e-12);
    expect(output.audit.exactTotalBloodVolumeClosurePass).toBe(true);
    expect(output.audit.allVascularVolumesPositive).toBe(true);
    for (const volume of Object.values(output.vascularVolumeM3ByNode)) {
      expect(volume).toBeGreaterThan(0);
    }
    for (const flow of Object.values(output.vascularEdgeFlowM3PerSecByName)) {
      expect(flow).toBe(output.commonConstructionFlowM3PerSec);
    }
    expect(output.audit.claimBoundary).toMatchObject({
      commonFlowPurpose: "quasi-steady fixed-boundary state construction",
      commonFlowIsNormalCardiacOutputClaim: false,
      cardiacOutputOrBloodPressureTargetUsed: false,
      pressureOrVolumePostProjectionApplied: false,
      runtimeControlOrPvParameterAdjustedAfterRoot: false,
      coronaryInitialStateClaimed: false,
    });
    expect(output.audit.provenance).toMatchObject({
      coronaryNetworkIncluded: false,
      heartValvesIncluded: false,
      edgePressureApplicationReference:
        "engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1.ts",
      modelCoreNumericalRuntimeParityClaimed: false,
    });
    expect(Object.isFrozen(output)).toBe(true);
    expect(Object.isFrozen(output.vascularPvEvaluationByNode)).toBe(true);
  });

  it("makes all 11 pressure-loss residuals and both dynamic accelerations vanish", () => {
    const input = typicalInputV1();
    const initialized = initializeMainWireNonCoronaryVascularStateV1(input);
    expect(initialized.audit.maximumAbsoluteEdgePressureDropResidualPa)
      .toBeLessThan(1e-9);
    for (const edgeName of MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1) {
      const edge = initialized.edgePressureDropAuditByName[edgeName];
      expect(Math.abs(edge.pressureDropResidualPa)).toBeLessThan(1e-9);
      expect(edge.forwardFlowM3PerSec).toBe(
        initialized.commonConstructionFlowM3PerSec,
      );
      expect(edge.upstreamAbsolutePressurePa - edge.effectiveDownstreamPressurePa)
        .toBeCloseTo(edge.signedLossPressurePa, 10);
    }
    for (const edgeName of ["VC_RA", "PCap_PVen"] as const) {
      const edge = initialized.edgePressureDropAuditByName[edgeName];
      expect(edge.waterfallCollapsePressurePa).not.toBeNull();
      expect(edge.effectiveDownstreamPressurePa).toBeGreaterThan(
        Math.max(
          edge.downstreamAbsolutePressurePa,
          edge.waterfallCollapsePressurePa!,
        ),
      );
    }

    const evaluated = evaluateMainWireNonCoronarySameTimeLevelV1({
      state: {
        bloodVolumesM3: {
          ...initialized.chamberVolumeM3ByNode,
          ...initialized.vascularVolumeM3ByNode,
        } as Readonly<Record<MainWireNonCoronaryCirculationNodeNameV1, number>>,
        dynamicFlowsM3PerSec: {
          Q_MV: 0,
          Q_AoV: 0,
          Q_TV: 0,
          Q_PuV: 0,
          ...initialized.solverFlowPartition.dynamicRootFlowsM3PerSec,
        },
        valveApertureState01ByFlow: {
          Q_MV: 0,
          Q_AoV: 0,
          Q_TV: 0,
          Q_PuV: 0,
        },
      },
      chamberAbsolutePressurePa: initialized.chamberAbsolutePressurePaByNode,
      externalPressurePa: input.externalPressurePa,
      mainWireRuntimeControls: input.mainWireRuntimeControls,
    });
    for (const edgeName of MAIN_WIRE_NON_CORONARY_VASCULAR_EDGE_NAMES_V1) {
      expect(evaluated.vascularFlowEvaluationByFlow[edgeName].flowM3PerSec)
        .toBeCloseTo(initialized.commonConstructionFlowM3PerSec, 15);
      expect(Math.abs(
        evaluated.vascularFlowEvaluationByFlow[edgeName].momentumResidualPa,
      )).toBeLessThan(1e-9);
    }
    for (const edgeName of MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1) {
      expect(Math.abs(evaluated.dynamicFlowAccelerationM3PerSec2[edgeName]))
        .toBeLessThan(1e-12);
    }
  });

  it("exports exactly two dynamic roots and nine algebraic flows for the future solver", () => {
    const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
    const flow = 72e-6;
    const partition = buildMainWireNonCoronaryInitialVascularFlowsV1(flow, controls);
    expect(Object.keys(partition.dynamicRootFlowsM3PerSec)).toEqual(
      MAIN_WIRE_NON_CORONARY_INITIAL_DYNAMIC_ROOT_NAMES_V1,
    );
    expect(Object.keys(partition.algebraicFlowsM3PerSec)).toEqual(
      MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1,
    );
    expect(MAIN_WIRE_NON_CORONARY_INITIAL_ALGEBRAIC_FLOW_NAMES_V1).toEqual(
      MAIN_WIRE_NON_CORONARY_ALGEBRAIC_FLOW_NAMES_V1,
    );
    expect(Object.values(partition.dynamicRootFlowsM3PerSec)).toEqual([flow, flow]);
    expect(Object.values(partition.algebraicFlowsM3PerSec)).toEqual(
      Array.from({ length: 9 }, () => flow),
    );
    expect(Object.isFrozen(partition.dynamicRootFlowsM3PerSec)).toBe(true);
    expect(() => buildMainWireNonCoronaryInitialVascularFlowsV1(-1e-6, controls))
      .toThrow(/non-negative/);
  });

  it("is deterministic and responds to declared main-wire controls without fitting them", () => {
    const baselineInput = typicalInputV1();
    const first = initializeMainWireNonCoronaryVascularStateV1(baselineInput);
    const replay = initializeMainWireNonCoronaryVascularStateV1(baselineInput);
    expect(replay.commonConstructionFlowM3PerSec)
      .toBe(first.commonConstructionFlowM3PerSec);
    expect(replay.vascularVolumeM3ByNode).toEqual(first.vascularVolumeM3ByNode);

    const altered = initializeMainWireNonCoronaryVascularStateV1({
      ...baselineInput,
      mainWireRuntimeControls: {
        ...baselineInput.mainWireRuntimeControls,
        arterialStiffness: 1.1,
        systemicResistance: 1.2,
        pulmonaryResistance: 0.8,
      },
    });
    expect(altered.commonConstructionFlowM3PerSec)
      .not.toBe(first.commonConstructionFlowM3PerSec);
    expect(altered.audit.relativeTotalBloodVolumeResidual).toBeLessThan(1e-12);
    expect(altered.audit.claimBoundary.runtimeControlOrPvParameterAdjustedAfterRoot)
      .toBe(false);
  });

  it("fails closed when TBV lies below q=0 or above the shared PV support", () => {
    expect(() => initializeMainWireNonCoronaryVascularStateV1({
      ...typicalInputV1(),
      targetTotalBloodVolumeM3: 0.5e-3,
    })).toThrow(/below the minimum supported/);
    expect(() => initializeMainWireNonCoronaryVascularStateV1({
      ...typicalInputV1(),
      targetTotalBloodVolumeM3: 0.1,
    })).toThrow(/cannot be bracketed.*PV support/);
  });

  it("rejects undeclared fields and non-physical chamber volumes", () => {
    const baseline = typicalInputV1();
    expect(() => initializeMainWireNonCoronaryVascularStateV1({
      ...baseline,
      hiddenProjection: true,
    } as unknown as MainWireNonCoronaryVascularInitializerInputV1))
      .toThrow(/must contain exactly/);
    expect(() => initializeMainWireNonCoronaryVascularStateV1({
      ...baseline,
      chamberVolumeM3ByNode: {
        ...baseline.chamberVolumeM3ByNode,
        LA: 0,
      },
    })).toThrow(/LA.*positive/);
  });
});

function typicalInputV1(): MainWireNonCoronaryVascularInitializerInputV1 {
  return {
    targetTotalBloodVolumeM3: 5.6e-3,
    chamberVolumeM3ByNode: {
      LV: 134e-6,
      LA: 43e-6,
      RV: 166e-6,
      RA: 57.5e-6,
    },
    chamberAbsolutePressurePaByNode: {
      LV: 5 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      LA: 7.43 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      RV: 5.8 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
      RA: 5.23 * MAIN_WIRE_PASCAL_PER_MMHG_V1,
    },
    mainWireRuntimeControls: mainWireDefaultHemodynamicRuntimeControlsV1(),
    externalPressurePa: {
      pth: 0,
      palv: 0,
    },
  };
}
