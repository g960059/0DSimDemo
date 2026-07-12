import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
  WORK_CONJUGATE_AV_PLANE_DEFAULT_EXTERNAL_DAMPING_N_SEC_PER_CM_V1,
  WORK_CONJUGATE_AV_PLANE_DEFAULT_INERTIA_N_SEC2_PER_CM_V1,
  WORK_CONJUGATE_AV_PLANE_DEFAULT_PHYSICAL_MASS_KG_V1,
  WORK_CONJUGATE_AV_PLANE_LEFT_HEART_TRIAL_VARIABLES_V1,
  WORK_CONJUGATE_AV_PLANE_PHYSICAL_DAMPING_KG_PER_SEC_TO_DAMPING_N_SEC_PER_CM_V1,
  WORK_CONJUGATE_AV_PLANE_PHYSICAL_MASS_KG_TO_INERTIA_N_SEC2_PER_CM_V1,
  evaluateWorkConjugateAVPlaneLeftHeartStateV1,
  estimateStaticNetForceDerivativeNPerCmV1,
  estimateStaticNetRestoringStiffnessNPerCmV1,
  initialWorkConjugateAVPlaneLeftHeartStateV1,
  stepWorkConjugateAVPlaneLeftHeartV1,
  workConjugateAVPlaneCoordinateDampingNSecPerCmFromPhysicalDampingKgPerSecV1,
  workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1,
  type WorkConjugateAVPlaneLeftHeartParamsV1,
  type WorkConjugateAVPlaneLeftHeartStateV1,
} from "@/engine/mechanics2/subsystems/WorkConjugateAVPlaneLeftHeartV1";
describe("WorkConjugateAVPlaneLeftHeartV1", () => {
  it("converts physical mass and damping to centimetre-coordinate units exactly", () => {
    expect(WORK_CONJUGATE_AV_PLANE_PHYSICAL_MASS_KG_TO_INERTIA_N_SEC2_PER_CM_V1).toBe(0.01);
    expect(WORK_CONJUGATE_AV_PLANE_PHYSICAL_DAMPING_KG_PER_SEC_TO_DAMPING_N_SEC_PER_CM_V1)
      .toBe(0.01);
    expect(workConjugateAVPlaneCoordinateInertiaNSec2PerCmFromPhysicalMassKgV1(1)).toBe(0.01);
    expect(workConjugateAVPlaneCoordinateDampingNSecPerCmFromPhysicalDampingKgPerSecV1(1))
      .toBe(0.01);
  });

  it("uses the 30 g inertial engineering seed with wall-viscosity-only damping", () => {
    expect(WORK_CONJUGATE_AV_PLANE_DEFAULT_PHYSICAL_MASS_KG_V1).toBe(0.030);
    expect(WORK_CONJUGATE_AV_PLANE_DEFAULT_INERTIA_N_SEC2_PER_CM_V1).toBe(0.0003);
    expect(WORK_CONJUGATE_AV_PLANE_DEFAULT_EXTERNAL_DAMPING_N_SEC_PER_CM_V1).toBe(0);
    expect(DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1.avPlane.inertiaNSec2PerCm)
      .toBe(0.0003);
    expect(DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1.avPlane.externalDampingNSecPerCm)
      .toBe(0);
  });

  it("solves one finite closed-ledger step with the declared ten trial unknowns", () => {
    const output = stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0,
        lvElectricalActivation01: 0,
      },
      DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
    );

    expect(WORK_CONJUGATE_AV_PLANE_LEFT_HEART_TRIAL_VARIABLES_V1).toEqual([
      "V_LA",
      "V_LV",
      "z",
      "u",
      "Q_MV",
      "Q_AoV",
      "P_PV",
      "Q_PV",
      "P_Ao",
      "P_return",
    ]);
    expect(output.allFinite).toBe(true);
    expect(output.acceptedStep).toBe(true);
    expect(output.residual.solverConverged).toBe(true);
    expect(output.residual.maxNormalizedEquationResidual).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.laMassResidualMl)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.lvMassResidualMl)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.avPlaneKinematicResidualCm)).toBeLessThan(1e-7);
    expect(Math.abs(output.residual.closedCircuitVolumeResidualMl)).toBeLessThan(1e-7);
    expect(output.residual.physicalResiduals).toHaveLength(10);
    expect(output.residual.normalizedResiduals).toHaveLength(10);
  });

  it("owns legacy or upstream-prescribed LA/LV contractile states symmetrically", () => {
    const previous = initialWorkConjugateAVPlaneLeftHeartStateV1({
      laActivation01: 0.13,
      lvActivation01: 0.21,
    });
    const output = stepWorkConjugateAVPlaneLeftHeartV1(
      previous,
      {
        dtSec: 0.001,
        laActivationSource: "prescribed-contractile-state",
        laElectricalActivation01: 1,
        lvElectricalActivation01: 0,
        laPrescribedContractileActivation01: 0.42,
      },
    );

    expect(output.state.laActivation01).toBe(0.42);
    expect(output.state.lvActivation01).toBeLessThan(0.21);
    expect(output.activation.la).toEqual({
      source: "prescribed-contractile-state",
      stateOwner: "upstream-prescribed-contractile-state",
      previousContractileActivation01: 0.13,
      currentContractileActivation01: 0.42,
      electricalProtocolMarker01: 1,
      prescribedContractileActivation01: 0.42,
    });
    expect(output.activation.lv).toEqual({
      source: "legacy-first-order-filter",
      stateOwner: "subsystem-first-order-filter",
      previousContractileActivation01: 0.21,
      currentContractileActivation01: output.state.lvActivation01,
      electricalProtocolMarker01: 0,
      prescribedContractileActivation01: null,
    });
    expect(output.residual.physicalResiduals).toHaveLength(10);
    expect(output.acceptedStep).toBe(true);
    expect(output.residual.hiddenBloodVolumeSourceMl).toBe(0);

    const alternateProtocolMarker = stepWorkConjugateAVPlaneLeftHeartV1(
      previous,
      {
        dtSec: 0.001,
        laActivationSource: "prescribed-contractile-state",
        laElectricalActivation01: 0,
        lvElectricalActivation01: 0,
        laPrescribedContractileActivation01: 0.42,
      },
    );
    expect(alternateProtocolMarker.state).toEqual(output.state);

    const lvPrescribed = stepWorkConjugateAVPlaneLeftHeartV1(previous, {
      dtSec: 0.001,
      laElectricalActivation01: 0,
      lvActivationSource: "prescribed-contractile-state",
      lvElectricalActivation01: 1,
      lvPrescribedContractileActivation01: 0.31,
    });
    expect(lvPrescribed.state.laActivation01).toBeLessThan(0.13);
    expect(lvPrescribed.state.lvActivation01).toBe(0.31);
    expect(lvPrescribed.activation.la.source).toBe("legacy-first-order-filter");
    expect(lvPrescribed.activation.la.stateOwner).toBe("subsystem-first-order-filter");
    expect(lvPrescribed.activation.lv).toEqual({
      source: "prescribed-contractile-state",
      stateOwner: "upstream-prescribed-contractile-state",
      previousContractileActivation01: 0.21,
      currentContractileActivation01: 0.31,
      electricalProtocolMarker01: 1,
      prescribedContractileActivation01: 0.31,
    });
    expect(lvPrescribed.residual.physicalResiduals).toHaveLength(10);
    expect(lvPrescribed.residual.hiddenBloodVolumeSourceMl).toBe(0);

    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laActivationSource: "prescribed-contractile-state",
        laElectricalActivation01: 0,
        lvElectricalActivation01: 0,
        laPrescribedContractileActivation01: 1.01,
      },
    )).toThrow(/laPrescribedContractileActivation01 must be finite and within \[0, 1\]/);
    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0,
        lvActivationSource: "prescribed-contractile-state",
        lvElectricalActivation01: 0,
        lvPrescribedContractileActivation01: -0.01,
      },
    )).toThrow(/lvPrescribedContractileActivation01 must be finite and within \[0, 1\]/);
  });

  it("keeps hidden blood source exactly zero and preserves closed-circuit volume delta", () => {
    const previous = initialWorkConjugateAVPlaneLeftHeartStateV1();
    const output = stepWorkConjugateAVPlaneLeftHeartV1(previous, {
      dtSec: 0.001,
      laElectricalActivation01: 0.2,
      lvElectricalActivation01: 0.1,
    });

    const previousTotal = totalClosedVolumeMl(
      previous,
      DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
    );
    const currentTotal = totalClosedVolumeMl(
      output.state,
      DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
    );

    expect(output.residual.hiddenBloodVolumeSourceMl).toBe(0);
    expect(output.residual.totalClosedCircuitVolumeDeltaMl).toBe(currentTotal - previousTotal);
    expect(Math.abs(currentTotal - previousTotal)).toBeLessThan(1e-7);
  });

  it("reports raw wall power and pressure-area identities without rounding", () => {
    const output = stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0.4,
        lvElectricalActivation01: 0.3,
      },
    );

    expect(output.power.laWallRawPowerResidualW).toBe(output.la.power.rawPowerResidualW);
    expect(output.power.lvWallRawPowerResidualW).toBe(output.lv.power.rawPowerResidualW);
    expect(Math.abs(output.power.laWallRawPowerResidualW)).toBeLessThan(1e-15);
    expect(Math.abs(output.power.lvWallRawPowerResidualW)).toBeLessThan(1e-15);
    expect(Math.abs(output.pressureArea.laPressureAreaIdentityResidualN)).toBeLessThan(1e-14);
    expect(Math.abs(output.pressureArea.lvPressureAreaIdentityResidualN)).toBeLessThan(1e-14);
    expect(output.power.coupledRawPowerResidualW).not.toBe(
      Number(output.power.coupledRawPowerResidualW.toFixed(12)),
    );
  });

  it("uses exact AV equation semantics for quasistatic, overdamped, and inertial modes", () => {
    const previous = initialWorkConjugateAVPlaneLeftHeartStateV1({
      avPlaneVelocityCmPerSec: -0.2,
      laActivation01: 0.4,
      lvActivation01: 0.25,
    });
    const trial: WorkConjugateAVPlaneLeftHeartStateV1 = {
      ...previous,
      laVolumeMl: 66,
      lvVolumeMl: 119,
      avPlanePositionCm: 0.12,
      avPlaneVelocityCmPerSec: 1.7,
      mitralValve: { qMlPerSec: 12 },
      aorticValve: { qMlPerSec: 3 },
      pulmonaryVenousFlowMlPerSec: 60,
      laActivation01: 0.4,
      lvActivation01: 0.25,
    };
    const input = {
      dtSec: 0.002,
      laElectricalActivation01: 0.4,
      lvElectricalActivation01: 0.25,
    };
    const base = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;
    const cases = [
      { order: "quasistatic" as const, damping: 0, inertia: base.avPlane.inertiaNSec2PerCm },
      { order: "overdamped" as const, damping: 3.5, inertia: base.avPlane.inertiaNSec2PerCm },
      { order: "inertial" as const, damping: 2.2, inertia: 1.4 },
    ];

    for (const avPlane of cases) {
      const params = { ...base, avPlane: {
        order: avPlane.order,
        externalDampingNSecPerCm: avPlane.damping,
        inertiaNSec2PerCm: avPlane.inertia,
      } };
      const output = evaluateWorkConjugateAVPlaneLeftHeartStateV1(previous, trial, input, params);
      const expectedDamping = avPlane.order === "quasistatic" ? 0 : avPlane.damping * trial.avPlaneVelocityCmPerSec;
      const expectedInertia = avPlane.order === "inertial"
        ? avPlane.inertia * (trial.avPlaneVelocityCmPerSec - previous.avPlaneVelocityCmPerSec) / input.dtSec
        : 0;

      expect(output.avForce.wallForceSumN)
        .toBe(output.avForce.laWallForceN + output.avForce.lvWallForceN);
      expect(output.avForce.externalDampingForceN).toBe(expectedDamping);
      expect(output.avForce.beInertialForceN).toBe(expectedInertia);
      expect(output.avForce.forceResidualN)
        .toBe(output.avForce.wallForceSumN - expectedDamping - expectedInertia);
      expect(output.residual.avPlaneKinematicResidualCm)
        .toBe(trial.avPlanePositionCm - previous.avPlanePositionCm - input.dtSec * trial.avPlaneVelocityCmPerSec);
    }
  });

  it("converges actual implicit steps in quasistatic and overdamped modes", () => {
    const base = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;
    const cases = [
      {
        order: "quasistatic" as const,
        externalDampingNSecPerCm: 0,
        inertiaNSec2PerCm: base.avPlane.inertiaNSec2PerCm,
      },
      {
        order: "overdamped" as const,
        externalDampingNSecPerCm: 0.1,
        inertiaNSec2PerCm: base.avPlane.inertiaNSec2PerCm,
      },
    ];

    for (const avPlane of cases) {
      const params = { ...base, avPlane };
      const output = stepWorkConjugateAVPlaneLeftHeartV1(
        initialWorkConjugateAVPlaneLeftHeartStateV1({}, params),
        {
          dtSec: 0.001,
          laElectricalActivation01: 0.2,
          lvElectricalActivation01: 0.15,
        },
        params,
      );

      expect(output.residual.solverConverged, avPlane.order).toBe(true);
      expect(output.acceptedStep, avPlane.order).toBe(true);
      expect(output.allFinite, avPlane.order).toBe(true);
    }
  });

  it("keeps a short driven transient finite, converged, and accepted", () => {
    let state = initialWorkConjugateAVPlaneLeftHeartStateV1();

    for (let stepIndex = 0; stepIndex < 24; stepIndex += 1) {
      const output = stepWorkConjugateAVPlaneLeftHeartV1(state, {
        dtSec: 0.001,
        laElectricalActivation01: stepIndex < 12 ? 0.35 : 0.05,
        lvElectricalActivation01: stepIndex < 6 ? 0.05 : 0.30,
      });

      expect(output.allFinite, `step ${stepIndex}`).toBe(true);
      expect(output.residual.solverConverged, `step ${stepIndex}`).toBe(true);
      expect(output.acceptedStep, `step ${stepIndex}`).toBe(true);
      expect(output.residual.hiddenBloodVolumeSourceMl, `step ${stepIndex}`).toBe(0);
      state = output.state;
    }

    expect(state.laActivation01).toBeGreaterThan(0);
    expect(state.lvActivation01).toBeGreaterThan(0);
  });

  it("marks a finite nonconverged solve as unaccepted", () => {
    const base = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;
    const params = {
      ...base,
      nonlinearSolverIterations: 1,
      nonlinearResidualTolerance: 1e-30,
    };
    const output = stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1({}, params),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0.8,
        lvElectricalActivation01: 0.7,
      },
      params,
    );

    expect(output.la.finite).toBe(true);
    expect(output.lv.finite).toBe(true);
    expect(output.allFinite).toBe(true);
    expect(output.residual.solverConverged).toBe(false);
    expect(output.acceptedStep).toBe(false);
  });

  it("does not double count hydraulic pressure-area or forbidden AV-plane hooks", () => {
    const params: WorkConjugateAVPlaneLeftHeartParamsV1 = {
      ...DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1,
      avPlane: {
        order: "quasistatic",
        externalDampingNSecPerCm: 0,
        inertiaNSec2PerCm: 1,
      },
    };
    const previous = initialWorkConjugateAVPlaneLeftHeartStateV1({
      laVolumeMl: 60,
      lvVolumeMl: 120,
      pulmonaryVenousPressureMmHg: 20,
      aorticPressureMmHg: 100,
      returnReservoirPressureMmHg: 12,
    }, params);
    const output = evaluateWorkConjugateAVPlaneLeftHeartStateV1(previous, {
      ...previous,
      laVolumeMl: 70,
      lvVolumeMl: 150,
      avPlanePositionCm: 0.2,
      avPlaneVelocityCmPerSec: 4,
      mitralValve: { qMlPerSec: 10 },
      aorticValve: { qMlPerSec: 5 },
      laActivation01: 0.65,
      lvActivation01: 0.45,
    }, {
      dtSec: 0.001,
      laElectricalActivation01: 0.65,
      lvElectricalActivation01: 0.45,
      pericardialPressureMmHg: 15,
    }, params);
    const laPressureAreaForceN =
      output.la.zForceAxisDecompositionN.circumferentialPressureAreaForceN.total;
    const lvPressureAreaForceN =
      output.lv.zForceAxisDecompositionN.circumferentialPressureAreaForceN.total;

    expect(output.la.cavityPressureKPa).toBeGreaterThan(0);
    expect(output.lv.cavityPressureKPa).toBeGreaterThan(0);
    expect(Math.abs(output.la.zForceN.total)).toBeGreaterThan(1e-6);
    expect(Math.abs(output.lv.zForceN.total)).toBeGreaterThan(1e-6);
    expect(Math.abs(laPressureAreaForceN)).toBeGreaterThan(1e-6);
    expect(Math.abs(lvPressureAreaForceN)).toBeGreaterThan(1e-6);
    expect(output.avForce.laWallForceN).toBe(output.la.zForceN.total);
    expect(output.avForce.lvWallForceN).toBe(output.lv.zForceN.total);
    expect(output.avForce.wallForceSumN).toBe(output.la.zForceN.total + output.lv.zForceN.total);
    expect(output.avForce.laWallForceN).not.toBe(output.la.zForceN.total + laPressureAreaForceN);
    expect(output.avForce.lvWallForceN).not.toBe(output.lv.zForceN.total + lvPressureAreaForceN);
  });

  it("exposes static net force derivative with explicit restoring stiffness sign", () => {
    const input = {
      laVolumeMl: 65,
      lvVolumeMl: 120,
      avPlanePositionCm: 0,
      laActivation01: 0,
      lvActivation01: 0,
      pericardialPressureMmHg: 0,
    };
    const derivative = estimateStaticNetForceDerivativeNPerCmV1(input);
    const restoringStiffness = estimateStaticNetRestoringStiffnessNPerCmV1(input);

    expect(derivative).toBeLessThan(0);
    expect(restoringStiffness).toBe(-derivative);
    expect(restoringStiffness).toBeGreaterThan(0);
  });

  it("keeps the coupled raw power conservation residual consistent with force power", () => {
    const output = stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      {
        dtSec: 0.001,
        laElectricalActivation01: 0.5,
        lvElectricalActivation01: 0.2,
      },
    );
    const wallRawPowerSum = output.power.laWallRawPowerResidualW + output.power.lvWallRawPowerResidualW;
    const expectedCoupled = wallRawPowerSum - output.avForce.forcePowerResidualW;

    expect(Math.abs(output.avForce.forcePowerResidualW)).toBeLessThan(1e-9);
    expect(Math.abs(output.power.coupledRawPowerResidualW - expectedCoupled)).toBeLessThan(1e-15);
    expect(Math.abs(output.power.coupledRawPowerResidualW)).toBeLessThan(1e-9);
  });

  it("rejects invalid AV order parameters and invalid trial geometry", () => {
    const base = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;
    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      { dtSec: 0.001, laElectricalActivation01: 0, lvElectricalActivation01: 0 },
      { ...base, avPlane: { order: "overdamped", externalDampingNSecPerCm: 0, inertiaNSec2PerCm: 1 } },
    )).toThrow(/positive for overdamped/);
    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      { dtSec: 0.001, laElectricalActivation01: 0, lvElectricalActivation01: 0 },
      { ...base, avPlane: { order: "inertial", externalDampingNSecPerCm: 0, inertiaNSec2PerCm: 0 } },
    )).toThrow(/positive for inertial/);

    const invalid = stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1({
        laVolumeMl: 50,
        lvVolumeMl: 120,
        avPlanePositionCm: -4.2,
      }),
      { dtSec: 0.001, laElectricalActivation01: 0, lvElectricalActivation01: 0 },
      base,
    );
    expect(invalid.residual.solverConverged).toBe(false);
    expect(invalid.allFinite).toBe(false);
    expect(invalid.acceptedStep).toBe(false);
  });

  it("rejects swapped LA and LV wall ownership at the left-heart boundary", () => {
    const base = DEFAULT_WORK_CONJUGATE_AV_PLANE_LEFT_HEART_PARAMS_V1;
    const swapped: WorkConjugateAVPlaneLeftHeartParamsV1 = {
      ...base,
      laWall: base.lvWall,
      lvWall: base.laWall,
    };

    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      { dtSec: 0.001, laElectricalActivation01: 0, lvElectricalActivation01: 0 },
      swapped,
    )).toThrowError(RangeError);
    expect(() => stepWorkConjugateAVPlaneLeftHeartV1(
      initialWorkConjugateAVPlaneLeftHeartStateV1(),
      { dtSec: 0.001, laElectricalActivation01: 0, lvElectricalActivation01: 0 },
      swapped,
    )).toThrow(/params\.laWall\.chamberId must be "LA"; received "LV"/);

    const wrongLv = { ...base, lvWall: base.laWall };
    expect(() => initialWorkConjugateAVPlaneLeftHeartStateV1({}, wrongLv))
      .toThrow(/params\.lvWall\.chamberId must be "LV"; received "LA"/);
  });
});

function totalClosedVolumeMl(
  state: WorkConjugateAVPlaneLeftHeartStateV1,
  params: WorkConjugateAVPlaneLeftHeartParamsV1,
): number {
  return state.laVolumeMl + state.lvVolumeMl +
    params.pulmonaryVenousComplianceMlPerMmHg * state.pulmonaryVenousPressureMmHg +
    params.aorticComplianceMlPerMmHg * state.aorticPressureMmHg +
    params.returnReservoirComplianceMlPerMmHg * state.returnReservoirPressureMmHg;
}
