import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  mainWireDefaultHemodynamicRuntimeControlsV1,
} from "@/engine/core/mainWireHemodynamicGraphV1";
import {
  advanceMainWireDynamicValveApertureBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireDynamicValveApertureV1";
import {
  MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1,
} from "@/engine/myocardium/fourChamberV1/hydromechanics/mainWireNonCoronarySameTimeLevelV1";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  buildPhaseB1MainWireDistributedNewtonResidualLabelsV1,
  buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1,
  buildPhaseB1MainWireDistributedStoredLabelsV1,
  createPhaseB1MainWireDistributedEndpointV1,
  decodePhaseB1MainWireDistributedStoredStateV1,
  encodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1,
  encodePhaseB1MainWireDistributedStoredStateV1,
  PHASE_B1_MAIN_WIRE_DISTRIBUTED_TOPOLOGY_V1,
  transformPhaseB1EndpointToMainWireDistributedV1,
  type PhaseB1MainWireDistributedEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedEndpointV1";
import {
  createPhaseB1MainWireDistributedResearchModelV1,
  evaluatePhaseB1MainWireDistributedEndpointV1,
  PHASE_B1_MAIN_WIRE_MECHANICS_PROXY_AUDIT_V1,
  stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1MainWireDistributedMonolithicBackwardEulerV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import type { PhaseB1SlsModeV1 } from
  "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1StoredStateNewtonTopologyV1";
import {
  initializeMainWireNonCoronaryVascularStateV1,
} from "@/engine/myocardium/fourChamberV1/vascular/mainWireNonCoronaryVascularInitializerV1";

describe("Phase B1 main-wire distributed monolithic research step", () => {
  const fixtures = {
    on: buildFixture("on"),
    off: buildFixture("off"),
  } as const;

  it.each(["on", "off"] as const)(
    "round-trips the immutable %s state with exact stored/Newton counts",
    (slsMode) => {
      const fixture = fixtures[slsMode];
      const stored = encodePhaseB1MainWireDistributedStoredStateV1(
        fixture.endpoint.differentialState,
      );
      const newton = encodePhaseB1MainWireDistributedEndpointNewtonUnknownsV1(
        fixture.endpoint,
      );
      expect(stored).toHaveLength(slsMode === "on" ? 70 : 65);
      expect(newton).toHaveLength(slsMode === "on" ? 58 : 53);
      expect(buildPhaseB1MainWireDistributedStoredLabelsV1(slsMode))
        .toHaveLength(stored.length);
      expect(
        buildPhaseB1MainWireDistributedStoredLabelsV1(slsMode).slice(21, 25),
      ).toEqual([
        "circulation.main-wire.valve-aperture.Q_MV",
        "circulation.main-wire.valve-aperture.Q_AoV",
        "circulation.main-wire.valve-aperture.Q_TV",
        "circulation.main-wire.valve-aperture.Q_PuV",
      ]);
      expect(buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1(slsMode))
        .toHaveLength(newton.length);
      expect(buildPhaseB1MainWireDistributedNewtonResidualLabelsV1(slsMode))
        .toHaveLength(newton.length);
      const decoded = decodePhaseB1MainWireDistributedStoredStateV1(
        stored,
        slsMode,
      );
      expect(encodePhaseB1MainWireDistributedStoredStateV1(decoded))
        .toEqual(stored);
      expect(Object.isFrozen(decoded)).toBe(true);
      expect(Object.isFrozen(decoded.bloodVolumesM3)).toBe(true);
      expect(Object.isFrozen(decoded.dynamicFlowsM3PerSec)).toBe(true);
      expect(Object.isFrozen(decoded.valveApertureState01ByFlow)).toBe(true);
      if (slsMode === "off") {
        expect(Object.hasOwn(decoded, "slsAlphaVByWall")).toBe(false);
        expect(buildPhaseB1MainWireDistributedStoredLabelsV1("off").some(
          (label) => label.includes(".sls."),
        )).toBe(false);
        expect(buildPhaseB1MainWireDistributedNewtonUnknownLabelsV1("off").some(
          (label) => label.includes(".sls."),
        )).toBe(false);
      }
      expect(fixture.transform.audit.suppliedVascularVolumeCount).toBe(11);
      expect(fixture.transform.audit.suppliedRootDynamicFlowCount).toBe(2);
      expect(fixture.transform.audit.valveApertureStateCount).toBe(4);
      expect(
        fixture.transform.audit
          .valveApertureDerivedFromInitialPressureGradientAndFlow,
      ).toBe(true);
      expect(fixture.transform.audit.topologyXi0Consumed).toBe(false);
      expect(fixture.transform.audit.vascularInitializationInferred).toBe(false);
      expect(fixture.transform.audit.parameterFitApplied).toBe(false);
    },
  );

  it("feeds wall-derived chamber pressures into the distributed circulation", () => {
    const fixture = fixtures.off;
    const baseline = evaluatePhaseB1MainWireDistributedEndpointV1({
      model: fixture.model,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      endpoint: fixture.endpoint,
    });
    const perturbed = withVolumeChanges(fixture.endpoint, {
      LA: 1e-9,
      PVein: -1e-9,
    });
    const changed = evaluatePhaseB1MainWireDistributedEndpointV1({
      model: fixture.model,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      endpoint: perturbed,
    });
    expect(baseline.mechanicsProxyAudit)
      .toBe(PHASE_B1_MAIN_WIRE_MECHANICS_PROXY_AUDIT_V1);
    expect(baseline.circulationCrossCoupledToChamberWallPressure).toBe(true);
    expect(baseline.distributedCirculation.absolutePressurePaByNode.LA)
      .toBe(baseline.chamberAbsolutePressurePa.LA);
    expect(changed.chamberAbsolutePressurePa.LA)
      .not.toBe(baseline.chamberAbsolutePressurePa.LA);
    expect(changed.distributedCirculation.valveMomentumByFlow.Q_MV.pressureGradientPa)
      .not.toBe(
        baseline.distributedCirculation.valveMomentumByFlow.Q_MV.pressureGradientPa,
      );
  });

  it("advances one nominal 4-ms distributed step with roundoff TBV closure", () => {
    const fixture = fixtures.off;
    const result = stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1({
      model: fixture.model,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      previousEndpoint: fixture.endpoint,
      dtSec: 4e-3,
    });
    if (result.converged === false) {
      throw new Error(`${result.reason}: ${result.message}`);
    }
    expect(result.unknownCount).toBe(53);
    expect(result.residualCount).toBe(53);
    expect(result.storedDifferentialStateCount).toBe(65);
    expect(result.calciumStoredStateCount).toBe(10);
    expect(result.calciumNewtonUnknownCount).toBe(0);
    expect(result.calciumResidualCount).toBe(0);
    expect(result.nextEndpointLeftLimit.timeSec).toBe(4e-3);
    expect(Math.abs(result.totalBloodVolumeChangeM3)).toBeLessThan(2e-17);
    expect(Math.abs(result.summedVolumeResidualM3PerSec)).toBeLessThan(1e-12);
    expect(Math.max(...Object.values(
      result.residualEvaluation.volumeResidual.residualM3PerSecByNode,
    ).map(Math.abs))).toBeLessThan(1e-11);
    expect(Math.abs(
      result.residualEvaluation.volumeResidual.summedIncidenceVolumeRateM3PerSec,
    )).toBeLessThan(1e-18);
    const expectedDimensionlessLandMargin = Math.min(
      ...Object.values(
        result.nextEndpointLeftLimit.differentialState.landByWall,
      ).flatMap(([caTrpn, b, w, s]) => [
        caTrpn,
        b,
        w,
        s,
        1 - caTrpn,
        1 - b - w - s,
      ]),
    );
    expect(result.minimumLandSimplexMargin)
      .toBeCloseTo(expectedDimensionlessLandMargin, 15);
    expect(result.minimumLandSimplexMargin).toBeGreaterThan(0);
    expect(result.minimumVascularPvDomainMarginM3).toBeGreaterThan(0);
    expect(result.algorithmicJacobian).toBe(
      "exploratory-nonlinear-scaled-five-point-no-generalized-jacobian-audit",
    );
    expect(result.generalizedJacobianAuditClaimed).toBe(false);
    expect(result.semismoothActiveSetFrozen).toBe(false);
    expect(result.projectionApplied).toBe(false);
    expect(result.postStepBloodVolumeProjectionApplied).toBe(false);
    expect(result.flowClampApplied).toBe(false);
    expect(result.fallbackApplied).toBe(false);
    expect(result.residualEvaluation.mechanicsProxyCirculationResidualConsumed)
      .toBe(false);
    for (const flowName of MAIN_WIRE_PHASE_B1_VALVE_FLOW_NAMES_V1) {
      const expected = advanceMainWireDynamicValveApertureBackwardEulerV1({
        parameters:
          fixture.model.internalPrecompiledCirculationContext
            .dynamicValveParametersByFlow[flowName],
        previousApertureState01:
          fixture.endpoint.differentialState
            .valveApertureState01ByFlow[flowName],
        pressureGradientPa:
          result.nextEvaluation.distributedCirculation
            .valveMomentumByFlow[flowName].pressureGradientPa,
        timeStepSec: 4e-3,
      });
      expect(
        result.nextEndpointLeftLimit.differentialState
          .valveApertureState01ByFlow[flowName],
      ).toBeCloseTo(expected.nextApertureState01, 15);
      expect(result.nextEvaluation.valveApertureState01ByFlow[flowName])
        .toBe(
          result.nextEndpointLeftLimit.differentialState
            .valveApertureState01ByFlow[flowName],
        );
      expect(result.nextEvaluation.effectiveValveAreaM2ByFlow[flowName])
        .toBe(
          result.nextEvaluation.distributedCirculation
            .valveMomentumByFlow[flowName].effectiveAreaM2,
        );
    }
  });

  it("rolls back the exact previous endpoint after a capped Newton failure", () => {
    const fixture = fixtures.off;
    const oneUpdateModel = createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: fixture.candidate.model,
      mainWireRuntimeControls: fixture.controls,
      vascularExternalPressurePa: fixture.externalPressurePa,
      maximumNewtonIterations: 1,
    });
    const result = stepPhaseB1MainWireDistributedMonolithicBackwardEulerV1({
      model: oneUpdateModel,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      previousEndpoint: fixture.endpoint,
      dtSec: 0.025e-3,
    });
    expect(result.converged).toBe(false);
    if (result.converged === true) throw new Error("expected a capped Newton failure");
    expect(result.reason).toBe("maximum-iterations");
    expect(result.failureClass).toBe("recoverable-nonlinear-convergence");
    expect(result.retryableByStepSubdivision).toBe(true);
    expect(result.rollbackEndpoint.timeSec).toBe(fixture.endpoint.timeSec);
    expect(encodePhaseB1MainWireDistributedStoredStateV1(
      result.rollbackEndpoint.differentialState,
    )).toEqual(encodePhaseB1MainWireDistributedStoredStateV1(
      fixture.endpoint.differentialState,
    ));
    expect(result.projectionApplied).toBe(false);
    expect(result.flowClampApplied).toBe(false);
    expect(result.fallbackApplied).toBe(false);
  });

  it("ignores legacy aggregate vascular outputs and responds to the main-wire split", () => {
    const fixture = fixtures.off;
    const baseline = evaluatePhaseB1MainWireDistributedEndpointV1({
      model: fixture.model,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      endpoint: fixture.endpoint,
    });
    const redistributed = withVolumeChanges(fixture.endpoint, {
      Ao: 0.1e-6,
      SA: -0.1e-6,
    });
    const changed = evaluatePhaseB1MainWireDistributedEndpointV1({
      model: fixture.model,
      wallMaterialBinding: fixture.candidate.wallMaterialBinding,
      endpoint: redistributed,
    });
    expect(changed.mechanicsProxyEndpoint.differentialState.bloodVolumesM3.SA)
      .toBeCloseTo(
        baseline.mechanicsProxyEndpoint.differentialState.bloodVolumesM3.SA,
        18,
      );
    expect(changed.mechanicsProxyEvaluation.closedLoop.vascular.SA.absolutePressurePa)
      .toBeCloseTo(
        baseline.mechanicsProxyEvaluation.closedLoop.vascular.SA.absolutePressurePa,
        12,
      );
    expect(changed.distributedCirculation.absolutePressurePaByNode.Ao)
      .not.toBe(baseline.distributedCirculation.absolutePressurePaByNode.Ao);
    expect(changed.distributedCirculation.absolutePressurePaByNode.SA)
      .not.toBe(baseline.distributedCirculation.absolutePressurePaByNode.SA);
    expect(changed.mechanicsProxyAudit.legacyProxyVascularPressuresConsumed)
      .toBe(false);
    expect(changed.mechanicsProxyAudit.legacyProxyVolumeResidualConsumed)
      .toBe(false);
    expect(changed.mechanicsProxyAudit.duplicateAggregateCirculationStatePresent)
      .toBe(false);
  });

  it("pins the declared topology counts independently of the kernel audit", () => {
    expect(PHASE_B1_MAIN_WIRE_DISTRIBUTED_TOPOLOGY_V1)
      .toMatchObject({
        storedDifferentialStateCount: { slsOn: 70, slsOff: 65 },
        newtonUnknownCount: { slsOn: 58, slsOff: 53 },
        newtonResidualCount: { slsOn: 58, slsOff: 53 },
        exactCalciumStoredStateCount: 10,
        exactCalciumNewtonUnknownCount: 0,
        exactCalciumResidualCount: 0,
        storedValveApertureStateCount: 4,
        valveApertureNewtonUnknownCount: 0,
        slsOffRepresentation: "physically-absent-no-placeholder",
      });
  });

  it("deep-copies main-wire overrides but fails closed on a seventh dynamic flow", () => {
    const fixture = fixtures.off;
    const nodeOverrides = { SA: { P0: 55 } };
    const withNodeOverride = createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: fixture.candidate.model,
      mainWireRuntimeControls: {
        ...fixture.controls,
        nodeOverrides,
      },
      vascularExternalPressurePa: fixture.externalPressurePa,
      maximumNewtonIterations: 24,
    });
    nodeOverrides.SA.P0 = 65;
    expect(withNodeOverride.mainWireRuntimeControls.nodeOverrides?.SA?.P0)
      .toBe(55);
    expect(Object.isFrozen(
      withNodeOverride.mainWireRuntimeControls.nodeOverrides?.SA,
    )).toBe(true);
    expect(Object.isFrozen(
      withNodeOverride.internalPrecompiledCirculationContext,
    )).toBe(true);
    expect(
      withNodeOverride.internalPrecompiledCirculationContext
        .resolvedGraph.runtimeControls,
    ).toBe(withNodeOverride.mainWireRuntimeControls);
    expect(
      withNodeOverride.internalPrecompiledCirculationContext
        .vascularPvLawByNode.SA.sourceLawMainWireUnits,
    ).toMatchObject({ P0: 55 });
    expect(
      withNodeOverride.internalPrecompiledCirculationContext
        .physiologyOrNumericalAcceptanceClaimed,
    ).toBe(false);

    expect(() => createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: fixture.candidate.model,
      mainWireRuntimeControls: {
        ...fixture.controls,
        edgeOverrides: { PVein_LA: { L: 0.001 } },
      },
      vascularExternalPressurePa: fixture.externalPressurePa,
      maximumNewtonIterations: 24,
    })).toThrow(/six-flow V1|seven-dynamic-flow variant|hidden seventh flow/i);
  });

  it("requires one synchronized intrathoracic-pressure gauge across mechanics and vasculature", () => {
    const fixture = fixtures.off;
    const mechanicsPthPa =
      fixture.candidate.model.closedLoopParameters.intrathoracicPressurePa;
    expect(() => createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: fixture.candidate.model,
      mainWireRuntimeControls: fixture.controls,
      vascularExternalPressurePa: {
        ...fixture.externalPressurePa,
        pth: mechanicsPthPa + 1,
      },
      maximumNewtonIterations: 24,
    })).toThrow(/must share one synchronized pressure gauge/);

    const synchronizedNonzeroPthPa = 320;
    const synchronizedMechanicsProxyModel = Object.freeze({
      ...fixture.candidate.model,
      closedLoopParameters: Object.freeze({
        ...fixture.candidate.model.closedLoopParameters,
        intrathoracicPressurePa: synchronizedNonzeroPthPa,
      }),
    });
    expect(() => createPhaseB1MainWireDistributedResearchModelV1({
      mechanicsProxyModel: synchronizedMechanicsProxyModel,
      mainWireRuntimeControls: fixture.controls,
      vascularExternalPressurePa: {
        ...fixture.externalPressurePa,
        pth: synchronizedNonzeroPthPa,
      },
      maximumNewtonIterations: 24,
    })).not.toThrow();
  });
});

function buildFixture(slsMode: PhaseB1SlsModeV1) {
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    slsMode,
    sha256,
  );
  const oldEvaluation = evaluatePhaseB1EventFreeEndpointV1(
    candidate.model,
    candidate.wallMaterialBinding,
    candidate.warmStart.endpoint,
  );
  const oldVolumes = candidate.warmStart.endpoint.differentialState
    .bloodVolumesM3;
  const controls = mainWireDefaultHemodynamicRuntimeControlsV1();
  const externalPressurePa = Object.freeze({ pth: 0, palv: 0 });
  const initialized = initializeMainWireNonCoronaryVascularStateV1({
    targetTotalBloodVolumeM3: 5e-3,
    chamberVolumeM3ByNode: Object.freeze({
      LV: oldVolumes.LV,
      LA: oldVolumes.LA,
      RV: oldVolumes.RV,
      RA: oldVolumes.RA,
    }),
    chamberAbsolutePressurePaByNode:
      oldEvaluation.closedLoop.chamberAbsolutePressurePa,
    mainWireRuntimeControls: controls,
    externalPressurePa,
  });
  const transform = transformPhaseB1EndpointToMainWireDistributedV1({
    sourceEndpoint: candidate.warmStart.endpoint,
    vascularBloodVolumesM3: initialized.vascularVolumeM3ByNode,
    chamberAbsolutePressurePaByNode:
      initialized.chamberAbsolutePressurePaByNode,
    vascularAbsolutePressurePaByNode:
      initialized.vascularAbsolutePressurePaByNode,
    rootDynamicFlowsM3PerSec:
      initialized.solverFlowPartition.dynamicRootFlowsM3PerSec,
  });
  const model = createPhaseB1MainWireDistributedResearchModelV1({
    mechanicsProxyModel: candidate.model,
    mainWireRuntimeControls: controls,
    vascularExternalPressurePa: externalPressurePa,
    maximumNewtonIterations: 24,
  });
  return Object.freeze({
    candidate,
    controls,
    externalPressurePa,
    initialized,
    transform,
    endpoint: transform.endpoint,
    model,
  });
}

function withVolumeChanges(
  endpoint: PhaseB1MainWireDistributedEndpointV1,
  changesM3: Readonly<Partial<Record<
    keyof PhaseB1MainWireDistributedEndpointV1["differentialState"]["bloodVolumesM3"],
    number
  >>>,
): PhaseB1MainWireDistributedEndpointV1 {
  const state = endpoint.differentialState;
  const bloodVolumesM3 = Object.freeze(Object.fromEntries(Object.entries(
    state.bloodVolumesM3,
  ).map(([node, volume]) => [
    node,
    volume + (changesM3[node as keyof typeof changesM3] ?? 0),
  ]))) as typeof state.bloodVolumesM3;
  return createPhaseB1MainWireDistributedEndpointV1({
    timeSec: endpoint.timeSec,
    differentialState: state.slsMode === "on"
      ? Object.freeze({ ...state, bloodVolumesM3 })
      : Object.freeze({ ...state, bloodVolumesM3 }),
    triSegCoordinates: endpoint.triSegCoordinates,
  });
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
